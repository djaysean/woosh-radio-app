import { useRadioPlayer } from "@/contexts/RadioPlayerContext";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BrandFooter from "../../components/BrandFooter";
import {
  getRadioShows,
  getWeeklySchedule,
  type RadioShow,
  type ScheduledShow,
  type WeeklySchedule,
} from "../../lib/wordpress";

const MAIN_LOGO = require("../../assets/images/woosh-radio-flat.png");
const CIRCULAR_LOGO = require("../../assets/images/woosh-radio-icon.png");

const COLORS = {
  background: "#080617",
  card: "#151129",
  border: "#30234B",
  white: "#FFFFFF",
  muted: "#B8B2CC",
  pink: "#FF2D8D",
  purple: "#8B5CF6",
};

type OnAirShow = {
  show: RadioShow;
};

function cleanTitle(title: string): string {
  return title
    .replace(/<[^>]*>/g, "")
    .replace(/&#8217;|&#x2019;/g, "’")
    .replace(/&#x2018;|&#8216;/g, "‘")
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .trim();
}

/**
 * Converts schedule times such as "09:30", "09:30:00",
 * "9:30 AM", or "21:30" into minutes after midnight.
 */
function parseTimeToMinutes(value: string): number | null {
  const normalized = value.trim().toUpperCase();
  const match = normalized.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/);

  if (!match) {
    return null;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3];

  if (minutes > 59) {
    return null;
  }

  if (meridiem) {
    if (hours < 1 || hours > 12) {
      return null;
    }

    if (meridiem === "AM") {
      hours = hours === 12 ? 0 : hours;
    } else {
      hours = hours === 12 ? 12 : hours + 12;
    }
  } else if (hours > 23) {
    return null;
  }

  return hours * 60 + minutes;
}

/**
 * Returns the current hour and minute in Nairobi, Kenya,
 * regardless of the device timezone.
 */
function getNairobiMinutes(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const hours = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minutes = Number(
    parts.find((part) => part.type === "minute")?.value ?? 0,
  );

  return hours * 60 + minutes;
}

function isSlotOnAir(slot: ScheduledShow, currentMinutes: number): boolean {
  const start = parseTimeToMinutes(slot.startTime);
  const end = parseTimeToMinutes(slot.endTime);

  if (start === null || end === null || start === end) {
    return false;
  }

  if (start < end) {
    return currentMinutes >= start && currentMinutes < end;
  }

  return currentMinutes >= start || currentMinutes < end;
}

function findOnAirShow(
  schedule: WeeklySchedule,
  shows: RadioShow[],
  now: Date,
): OnAirShow | null {
  if (schedule.days.length === 0 || shows.length === 0) {
    return null;
  }

  const currentMinutes = getNairobiMinutes(now);
  const showsById = new Map(shows.map((show) => [String(show.id), show]));

  const currentDay = schedule.days.find(
    (day) => day.id === schedule.currentDayId,
  );

  if (!currentDay) {
    return null;
  }

  const activeSlot = currentDay.shows.find((slot) =>
    isSlotOnAir(slot, currentMinutes),
  );

  if (activeSlot) {
    const show = showsById.get(activeSlot.showId);

    if (show) {
      return { show };
    }
  }

  const orderedDays = [...schedule.days].sort(
    (a, b) => a.menuOrder - b.menuOrder,
  );

  const currentDayIndex = orderedDays.findIndex(
    (day) => day.id === currentDay.id,
  );

  const previousDay =
    currentDayIndex > 0
      ? orderedDays[currentDayIndex - 1]
      : orderedDays[orderedDays.length - 1];

  if (previousDay) {
    const overnightSlot = previousDay.shows.find((slot) => {
      const start = parseTimeToMinutes(slot.startTime);
      const end = parseTimeToMinutes(slot.endTime);

      return (
        start !== null && end !== null && start > end && currentMinutes < end
      );
    });

    if (overnightSlot) {
      const show = showsById.get(overnightSlot.showId);

      if (show) {
        return { show };
      }
    }
  }

  return null;
}

export default function HomeScreen() {
  const router = useRouter();
  const { togglePlayback, isPlaying } = useRadioPlayer();

  const [schedule, setSchedule] = useState<WeeklySchedule | null>(null);
  const [shows, setShows] = useState<RadioShow[]>([]);
  const [now, setNow] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [playbackLoading, setPlaybackLoading] = useState(false);

  const loadHomeData = useCallback(async (showLoader = false) => {
    if (showLoader) {
      setLoading(true);
    }

    try {
      const [weeklySchedule, radioShows] = await Promise.all([
        getWeeklySchedule(),
        getRadioShows(),
      ]);

      setSchedule(weeklySchedule);
      setShows(radioShows);
      setLoadError(false);
    } catch (error) {
      console.error("Failed to load Home screen data:", error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHomeData(true);

    const scheduleInterval = setInterval(() => {
      void loadHomeData();
    }, 60_000);

    const clockInterval = setInterval(() => {
      setNow(new Date());
    }, 15_000);

    return () => {
      clearInterval(scheduleInterval);
      clearInterval(clockInterval);
    };
  }, [loadHomeData]);

  const openSchedule = useCallback(() => {
    router.push("/(tabs)/schedule");
  }, [router]);

  const openShows = useCallback(() => {
    router.push("/(tabs)/shows");
  }, [router]);

  const handleListenLive = useCallback(async () => {
    setPlaybackLoading(true);

    try {
      await togglePlayback();
    } catch (error) {
      console.error("Unable to toggle radio playback:", error);
    } finally {
      setPlaybackLoading(false);
    }
  }, [togglePlayback]);

  const onAir = schedule ? findOnAirShow(schedule, shows, now) : null;

  const onAirTitle = onAir ? cleanTitle(onAir.show.title.rendered) : "";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.logoFrame}>
            <Image
              source={MAIN_LOGO}
              style={styles.mainLogo}
              resizeMode="contain"
              accessibilityLabel="Woosh Radio"
            />
          </View>

          <Text style={styles.brandTagline}>YOUR SOUND. YOUR WORLD.</Text>
        </View>

        <View style={styles.hero}>
          <View style={styles.glowTop} />
          <View style={styles.glowBottom} />

          <Text style={styles.heroEyebrow}>WELCOME TO WOOSH RADIO</Text>

          <Text style={styles.heroTitle}>
            Turn up{"\n"}your <Text style={styles.heroAccent}>world.</Text>
          </Text>

          <Text style={styles.heroDescription}>
            Your favorite sounds, fresh voices, and the energy you need — all in
            one place.
          </Text>

          <Pressable
            onPress={handleListenLive}
            disabled={playbackLoading}
            style={({ pressed }) => [
              styles.listenButton,
              pressed && styles.buttonPressed,
              playbackLoading && styles.buttonDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? "Pause live radio" : "Listen live"}
          >
            {playbackLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.listenButtonIcon}>
                  {isPlaying ? "Ⅱ" : "▶"}
                </Text>

                <Text style={styles.listenButtonText}>
                  {isPlaying ? "PAUSE LIVE RADIO" : "LISTEN LIVE"}
                </Text>
              </>
            )}
          </Pressable>

          <View style={styles.liveStatus}>
            <View style={[styles.liveDot, isPlaying && styles.liveDotActive]} />

            <Text style={styles.liveStatusText}>
              {isPlaying ? "YOU’RE TUNED IN" : "YOUR RADIO. YOUR WORLD."}
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeadingGroup}>
            <Text style={styles.sectionEyebrow}>ON AIR NOW</Text>

            <Text style={styles.sectionTitle}>Featured Show</Text>
          </View>

          <View style={styles.sectionAccent} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.pink} />

            <Text style={styles.loadingText}>Checking what’s on air…</Text>
          </View>
        ) : loadError && !schedule ? (
          <View style={styles.messageCard}>
            <Text style={styles.messageTitle}>
              We couldn’t load the schedule.
            </Text>

            <Text style={styles.messageText}>
              Check your connection and try again.
            </Text>

            <Pressable
              onPress={() => void loadHomeData(true)}
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.buttonPressed,
              ]}
              accessibilityRole="button"
            >
              <Text style={styles.retryButtonText}>TRY AGAIN</Text>
            </Pressable>
          </View>
        ) : onAir ? (
          <View style={styles.onAirCard}>
            {onAir.show.artwork ? (
              <Image
                source={{ uri: onAir.show.artwork }}
                style={styles.onAirArtwork}
                resizeMode="cover"
                accessibilityLabel={`${onAirTitle} artwork`}
              />
            ) : (
              <View style={styles.artworkFallback}>
                <Image
                  source={CIRCULAR_LOGO}
                  style={styles.fallbackLogo}
                  resizeMode="contain"
                  accessibilityLabel="Woosh Radio"
                />
              </View>
            )}

            <View style={styles.onAirDetails}>
              <View style={styles.onAirBadge}>
                <View style={styles.onAirBadgeDot} />

                <Text style={styles.onAirBadgeText}>ON AIR NOW</Text>
              </View>

              <Text style={styles.onAirTitle} numberOfLines={2}>
                {onAirTitle}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.messageCard}>
            <View style={styles.noShowIcon}>
              <Text style={styles.noShowIconText}>♫</Text>
            </View>

            <Text style={styles.messageTitle}>No show currently scheduled</Text>

            <Text style={styles.messageText}>
              There isn’t a programme listed for this time. Check the schedule
              to see what’s coming up next.
            </Text>
          </View>
        )}

        <View style={styles.navigationButtons}>
          <Pressable
            onPress={openSchedule}
            style={({ pressed }) => [
              styles.navigationButton,
              styles.scheduleButton,
              pressed && styles.buttonPressed,
            ]}
            accessibilityRole="button"
          >
            <Text style={styles.navigationButtonText}>VIEW SCHEDULE</Text>

            <Text style={styles.navigationButtonArrow}>→</Text>
          </Pressable>

          <Pressable
            onPress={openShows}
            style={({ pressed }) => [
              styles.navigationButton,
              styles.exploreButton,
              pressed && styles.buttonPressed,
            ]}
            accessibilityRole="button"
          >
            <Text style={styles.navigationButtonText}>EXPLORE ALL SHOWS</Text>

            <Text style={styles.navigationButtonArrow}>→</Text>
          </Pressable>
        </View>

        <BrandFooter />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 28,
  },
  logoFrame: {
    width: 196,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: 14,
    backgroundColor: "#F0EAFE",
    marginBottom: 12,
  },
  mainLogo: {
    width: "100%",
    height: "100%",
  },
  brandTagline: {
    fontFamily: "SoraBold",
    color: COLORS.muted,
    fontSize: 10,
    letterSpacing: 3,
  },
  hero: {
    position: "relative",
    overflow: "hidden",
    padding: 24,
    borderRadius: 24,
    backgroundColor: "#130D29",
    borderWidth: 1,
    borderColor: "#3A2059",
    marginBottom: 34,
  },
  glowTop: {
    position: "absolute",
    width: 190,
    height: 190,
    top: -95,
    right: -60,
    borderRadius: 100,
    backgroundColor: "#7227B8",
    opacity: 0.18,
  },
  glowBottom: {
    position: "absolute",
    width: 160,
    height: 160,
    bottom: -90,
    left: -70,
    borderRadius: 100,
    backgroundColor: COLORS.pink,
    opacity: 0.12,
  },
  heroEyebrow: {
    fontFamily: "InterBold",
    color: COLORS.pink,
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 16,
  },
  heroTitle: {
    fontFamily: "SoraExtraBold",
    color: COLORS.white,
    fontSize: 42,
    lineHeight: 47,
    letterSpacing: -1.5,
    marginBottom: 14,
  },
  heroAccent: {
    fontFamily: "SoraExtraBold",
    color: COLORS.pink,
  },
  heroDescription: {
    fontFamily: "InterRegular",
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
    maxWidth: 290,
  },
  listenButton: {
    minHeight: 54,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: COLORS.pink,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: COLORS.pink,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 5,
  },
  listenButtonIcon: {
    fontFamily: "InterBold",
    color: COLORS.white,
    fontSize: 16,
  },
  listenButtonText: {
    fontFamily: "InterBold",
    color: COLORS.white,
    fontSize: 12,
    letterSpacing: 1.2,
  },
  liveStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 18,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.muted,
  },
  liveDotActive: {
    backgroundColor: "#36E69A",
  },
  liveStatusText: {
    fontFamily: "InterBold",
    color: COLORS.muted,
    fontSize: 9,
    letterSpacing: 1.1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  sectionHeadingGroup: {
    gap: 5,
  },
  sectionEyebrow: {
    fontFamily: "InterBold",
    color: COLORS.pink,
    fontSize: 9,
    letterSpacing: 2,
  },
  sectionTitle: {
    fontFamily: "SoraExtraBold",
    color: COLORS.white,
    fontSize: 25,
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  sectionAccent: {
    width: 42,
    height: 4,
    borderRadius: 2,
    marginBottom: 5,
    backgroundColor: COLORS.pink,
  },
  loadingContainer: {
    minHeight: 170,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontFamily: "InterRegular",
    color: COLORS.muted,
    fontSize: 12,
  },
  onAirCard: {
    flexDirection: "row",
    overflow: "hidden",
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },
  onAirArtwork: {
    width: 124,
    minHeight: 124,
    backgroundColor: "#17132D",
  },
  artworkFallback: {
    width: 124,
    minHeight: 124,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#17102D",
  },
  fallbackLogo: {
    width: 72,
    height: 72,
  },
  onAirDetails: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingHorizontal: 15,
    paddingVertical: 14,
  },
  onAirBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "#30203F",
    marginBottom: 10,
  },
  onAirBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.pink,
  },
  onAirBadgeText: {
    fontFamily: "InterBold",
    color: COLORS.pink,
    fontSize: 9,
    letterSpacing: 1,
  },
  onAirTitle: {
    fontFamily: "SoraBold",
    color: COLORS.white,
    fontSize: 16,
    lineHeight: 21,
  },
  messageCard: {
    alignItems: "flex-start",
    padding: 20,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },
  messageTitle: {
    fontFamily: "SoraBold",
    color: COLORS.white,
    fontSize: 15,
    marginBottom: 6,
  },
  messageText: {
    fontFamily: "InterRegular",
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  noShowIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#30203F",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  noShowIconText: {
    fontFamily: "InterBold",
    color: COLORS.pink,
    fontSize: 23,
  },
  retryButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.pink,
    marginTop: 16,
  },
  retryButtonText: {
    fontFamily: "InterBold",
    color: COLORS.white,
    fontSize: 10,
    letterSpacing: 1,
  },
  navigationButtons: {
    gap: 12,
    marginTop: 4,
    marginBottom: 4,
  },
  navigationButton: {
    minHeight: 54,
    paddingHorizontal: 18,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
  },
  scheduleButton: {
    backgroundColor: COLORS.pink,
    borderColor: COLORS.pink,
  },
  exploreButton: {
    backgroundColor: COLORS.purple,
    borderColor: COLORS.purple,
  },
  navigationButtonText: {
    fontFamily: "InterBold",
    color: COLORS.white,
    fontSize: 12,
    letterSpacing: 1,
  },
  navigationButtonArrow: {
    fontFamily: "InterBold",
    color: COLORS.white,
    fontSize: 22,
  },
  buttonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
