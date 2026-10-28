import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AppState } from "react-native";

const STREAM_URL = "https://artemis.streamerr.co/listen/woosh_radio/radio.mp3";
const NOW_PLAYING_URL =
  "https://artemis.streamerr.co/api/nowplaying/woosh_radio";
const WEBSOCKET_URL =
  "wss://artemis.streamerr.co/api/live/nowplaying/websocket";
const STATION_CHANNEL = "station:woosh_radio";
const ITUNES_SEARCH_URL = "https://itunes.apple.com/search";

const POLL_INTERVAL_MS = 15_000;
const REQUEST_TIMEOUT_MS = 8_000;
const INITIAL_RECONNECT_DELAY_MS = 2_000;
const MAX_RECONNECT_DELAY_MS = 30_000;
const GENERIC_ARTWORK_MARKER = "generic_song.jpg";

type TrackInfo = {
  title: string;
  artist: string;
  artworkUrl: string | null;
};

type RadioPlayerContextValue = {
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  track: TrackInfo;
  togglePlayback: () => Promise<void>;
};

type NowPlayingSong = {
  title?: string;
  text?: string;
  artist?: string;
  art?: string;
  artwork?: string;
  image?: string;
};

type NowPlayingPayload = {
  now_playing?: {
    song?: NowPlayingSong;
  };
  song?: NowPlayingSong;
  live?: { art?: string };
  station?: { art?: string };
};

type ParsedTrack = {
  title: string;
  artist: string;
  songArtworkUrl: string | null;
  stationArtworkUrl: string | null;
};

type ITunesResult = {
  trackName?: string;
  artistName?: string;
  artworkUrl100?: string;
};

type ITunesResponse = {
  results?: ITunesResult[];
};

const DEFAULT_TRACK: TrackInfo = {
  title: "WOOSH RADIO",
  artist: "Live stream",
  artworkUrl: null,
};

const RadioPlayerContext = createContext<RadioPlayerContextValue | undefined>(
  undefined,
);

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function getTrackKey(track: Pick<TrackInfo, "title" | "artist">): string {
  return `${normalizeText(track.artist)}::${normalizeText(track.title)}`;
}

function isUsableArtwork(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^https?:\/\//i.test(value.trim()) &&
    !value.includes(GENERIC_ARTWORK_MARKER)
  );
}

function parseTrack(payload: unknown): ParsedTrack | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const data = payload as NowPlayingPayload;
  const song = data.now_playing?.song ?? data.song;

  if (!song) {
    return null;
  }

  const title = song.title?.trim() || song.text?.trim() || "";
  const artist = song.artist?.trim() || "";

  if (!title && !artist) {
    return null;
  }

  // Track artwork and station artwork have different roles.
  // A station logo must not prevent an iTunes song-artwork lookup.
  const songArtworkCandidates = [song.art, song.artwork, song.image];

  const stationArtworkCandidates = [data.live?.art, data.station?.art];

  return {
    title: title || "WOOSH RADIO",
    artist: artist || "Live stream",
    songArtworkUrl: songArtworkCandidates.find(isUsableArtwork)?.trim() ?? null,
    stationArtworkUrl:
      stationArtworkCandidates.find(isUsableArtwork)?.trim() ?? null,
  };
}

function findITunesArtwork(
  results: ITunesResult[],
  track: Pick<TrackInfo, "title" | "artist">,
): string | null {
  const wantedTitle = normalizeText(track.title);
  const wantedArtist = normalizeText(track.artist);

  if (!wantedTitle || !wantedArtist) {
    return null;
  }

  const match = results.find((result) => {
    const resultTitle = normalizeText(result.trackName ?? "");
    const resultArtist = normalizeText(result.artistName ?? "");

    return (
      resultTitle === wantedTitle &&
      resultArtist.length > 0 &&
      (resultArtist === wantedArtist ||
        resultArtist.includes(wantedArtist) ||
        wantedArtist.includes(resultArtist))
    );
  });

  const artwork = match?.artworkUrl100;

  if (!isUsableArtwork(artwork)) {
    return null;
  }

  return artwork.replace(/\/100x100bb\./, "/600x600bb.");
}

async function lookupITunesArtwork(
  track: Pick<TrackInfo, "title" | "artist">,
  signal: AbortSignal,
): Promise<string | null> {
  if (
    !track.title ||
    !track.artist ||
    track.title === DEFAULT_TRACK.title ||
    track.artist === DEFAULT_TRACK.artist
  ) {
    return null;
  }

  const term = encodeURIComponent(`${track.artist} ${track.title}`);
  const url = `${ITUNES_SEARCH_URL}?term=${term}&media=music&entity=song&limit=10`;

  try {
    const response = await fetch(url, { signal });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as ITunesResponse;
    return findITunesArtwork(data.results ?? [], track);
  } catch {
    // Artwork is optional. A lookup failure must not affect playback
    // or prevent the song title and artist from being displayed.
    return null;
  }
}

export function RadioPlayerProvider({ children }: { children: ReactNode }) {
  const [player] = useState(() =>
    createAudioPlayer(STREAM_URL, {
      updateInterval: 500,
    }),
  );

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [track, setTrack] = useState<TrackInfo>(DEFAULT_TRACK);

  const playRequestedRef = useRef(false);
  const lockScreenActiveRef = useRef(false);
  const currentTrackKeyRef = useRef(getTrackKey(DEFAULT_TRACK));
  const artworkControllerRef = useRef<AbortController | null>(null);

  const audioModeReadyRef = useRef(false);
  const audioModePromiseRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    let mounted = true;
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let requestController: AbortController | null = null;
    let requestInProgress = false;
    let reconnectDelay = INITIAL_RECONNECT_DELAY_MS;

    function applyTrack(payload: unknown) {
      const parsed = parseTrack(payload);

      if (!mounted || !parsed) {
        return;
      }

      const nextTrack: TrackInfo = {
        title: parsed.title,
        artist: parsed.artist,
        artworkUrl: parsed.songArtworkUrl ?? parsed.stationArtworkUrl,
      };

      const nextKey = getTrackKey(nextTrack);
      const isNewTrack = nextKey !== currentTrackKeyRef.current;

      if (isNewTrack) {
        currentTrackKeyRef.current = nextKey;
        artworkControllerRef.current?.abort();
        artworkControllerRef.current = null;

        // Publish the new title and artist immediately. The station
        // image is only a temporary fallback while iTunes searches.
        setTrack(nextTrack);
      } else if (parsed.songArtworkUrl) {
        // Genuine song artwork always takes priority.
        artworkControllerRef.current?.abort();
        artworkControllerRef.current = null;

        setTrack((previous) => ({
          ...previous,
          title: parsed.title,
          artist: parsed.artist,
          artworkUrl: parsed.songArtworkUrl,
        }));

        return;
      } else {
        // Keep previously resolved iTunes artwork on repeated updates.
        // If no song art has been found, use the station image as fallback.
        setTrack((previous) => ({
          ...previous,
          title: parsed.title,
          artist: parsed.artist,
          artworkUrl: previous.artworkUrl ?? parsed.stationArtworkUrl,
        }));
      }

      // Crucial: station artwork does NOT stop the iTunes lookup.
      // Only actual song-specific artwork makes that lookup unnecessary.
      if (parsed.songArtworkUrl || !isNewTrack) {
        return;
      }

      const controller = new AbortController();
      artworkControllerRef.current = controller;

      void lookupITunesArtwork(nextTrack, controller.signal).then(
        (artworkUrl) => {
          if (
            !mounted ||
            controller.signal.aborted ||
            currentTrackKeyRef.current !== nextKey ||
            !artworkUrl
          ) {
            return;
          }

          setTrack((previous) => {
            if (getTrackKey(previous) !== nextKey) {
              return previous;
            }

            // Replace the temporary station image with song artwork.
            return {
              ...previous,
              artworkUrl,
            };
          });
        },
      );
    }

    async function fetchNowPlaying() {
      if (!mounted || requestInProgress) {
        return;
      }

      requestInProgress = true;

      const controller = new AbortController();
      requestController = controller;

      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch(NOW_PLAYING_URL, {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache",
          },
        });

        if (!response.ok) {
          throw new Error(`Now-playing request failed (${response.status}).`);
        }

        const data: unknown = await response.json();

        if (mounted && !controller.signal.aborted) {
          applyTrack(data);
        }
      } catch {
        // Retain the last valid metadata during network failures.
      } finally {
        clearTimeout(timeout);

        if (requestController === controller) {
          requestController = null;
        }

        requestInProgress = false;
      }
    }

    function processWebSocketMessage(rawMessage: unknown) {
      if (!mounted || typeof rawMessage !== "string") {
        return;
      }

      try {
        const message = JSON.parse(rawMessage);

        // Handle cached publications included in the connect reply.
        const connect = message?.connect;
        const subscription = connect?.subs?.[STATION_CHANNEL];
        const publications = subscription?.publications;

        if (Array.isArray(publications)) {
          for (const publication of publications) {
            if (publication?.data?.np) {
              applyTrack(publication.data.np);
            }
          }
        }

        if (Array.isArray(connect?.data)) {
          for (const publication of connect.data) {
            if (publication?.data?.np) {
              applyTrack(publication.data.np);
            }
          }
        }

        // Standard live AzuraCast now-playing publication.
        if (message?.pub?.data?.np) {
          applyTrack(message.pub.data.np);
        }
      } catch {
        // Ignore empty heartbeat messages and malformed JSON.
      }
    }

    function scheduleReconnect() {
      if (!mounted || reconnectTimer) {
        return;
      }

      const delay = reconnectDelay;
      reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY_MS);

      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connectWebSocket();
      }, delay);
    }

    function connectWebSocket() {
      if (!mounted) {
        return;
      }

      if (
        socket &&
        (socket.readyState === WebSocket.OPEN ||
          socket.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }

      try {
        const nextSocket = new WebSocket(WEBSOCKET_URL);
        socket = nextSocket;

        nextSocket.onopen = () => {
          if (!mounted || socket !== nextSocket) {
            return;
          }

          reconnectDelay = INITIAL_RECONNECT_DELAY_MS;

          try {
            nextSocket.send(
              JSON.stringify({
                subs: {
                  [STATION_CHANNEL]: {
                    recover: true,
                  },
                },
              }),
            );
          } catch {
            // The close handler will arrange reconnection.
          }

          void fetchNowPlaying();
        };

        nextSocket.onmessage = (event) => {
          if (socket === nextSocket) {
            processWebSocketMessage(event.data);
          }
        };

        nextSocket.onerror = () => {
          // Reconnection is handled by onclose.
        };

        nextSocket.onclose = () => {
          if (socket === nextSocket) {
            socket = null;
          }

          scheduleReconnect();
        };
      } catch {
        scheduleReconnect();
      }
    }

    const playbackSubscription = player.addListener(
      "playbackStatusUpdate",
      (status) => {
        if (!mounted) {
          return;
        }

        if (status.error) {
          playRequestedRef.current = false;
          setIsPlaying(false);
          setIsLoading(false);
          setError("Unable to play the live stream. Please try again.");
          return;
        }

        setIsPlaying(status.playing);

        if (status.playing) {
          playRequestedRef.current = false;
          setIsLoading(false);
        } else if (status.isBuffering || playRequestedRef.current) {
          setIsLoading(true);
        } else {
          setIsLoading(false);
        }
      },
    );

    void fetchNowPlaying();
    connectWebSocket();

    pollTimer = setInterval(() => {
      void fetchNowPlaying();
    }, POLL_INTERVAL_MS);

    const appStateSubscription = AppState.addEventListener(
      "change",
      (state) => {
        if (state !== "active" || !mounted) {
          return;
        }

        void fetchNowPlaying();
        connectWebSocket();
      },
    );

    return () => {
      mounted = false;

      if (pollTimer) {
        clearInterval(pollTimer);
      }

      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }

      requestController?.abort();
      artworkControllerRef.current?.abort();

      appStateSubscription.remove();
      playbackSubscription.remove();

      if (socket) {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
        socket.close();
        socket = null;
      }

      lockScreenActiveRef.current = false;

      try {
        player.clearLockScreenControls();
      } catch {
        // Continue cleanup if the OS controls are unavailable.
      }

      player.remove();
    };
  }, [player]);

  // This effect runs again when artwork changes. Once the lock screen
  // is active, it updates the OS metadata as well as the mini-player state.
  useEffect(() => {
    if (!lockScreenActiveRef.current) {
      return;
    }

    try {
      player.updateLockScreenMetadata({
        title: track.title,
        artist: track.artist,
        albumTitle: "WOOSH RADIO",
        ...(track.artworkUrl ? { artworkUrl: track.artworkUrl } : {}),
      });
    } catch {
      // Metadata failures must not interrupt the live stream.
    }
  }, [player, track]);

  const togglePlayback = useCallback(async () => {
    setError(null);

    try {
      if (isPlaying) {
        playRequestedRef.current = false;
        player.pause();
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      playRequestedRef.current = true;

      // Configure the audio session once, before starting playback.
      if (!audioModeReadyRef.current) {
        if (!audioModePromiseRef.current) {
          audioModePromiseRef.current = setAudioModeAsync({
            playsInSilentMode: true,
            shouldPlayInBackground: true,
            interruptionMode: "doNotMix",
          });
        }

        await audioModePromiseRef.current;
        audioModeReadyRef.current = true;
      }

      player.setActiveForLockScreen(
        true,
        {
          title: track.title,
          artist: track.artist,
          albumTitle: "WOOSH RADIO",
          ...(track.artworkUrl ? { artworkUrl: track.artworkUrl } : {}),
        },
        {
          isLiveStream: true,
        },
      );

      lockScreenActiveRef.current = true;
      player.play();
    } catch {
      audioModePromiseRef.current = null;
      audioModeReadyRef.current = false;
      playRequestedRef.current = false;
      setIsLoading(false);
      setError("Unable to play the live stream. Please try again.");
    }
  }, [isPlaying, player, track]);

  return (
    <RadioPlayerContext.Provider
      value={{
        isPlaying,
        isLoading,
        error,
        track,
        togglePlayback,
      }}
    >
      {children}
    </RadioPlayerContext.Provider>
  );
}

export function useRadioPlayer() {
  const context = useContext(RadioPlayerContext);

  if (!context) {
    throw new Error("useRadioPlayer must be used inside RadioPlayerProvider.");
  }

  return context;
}
