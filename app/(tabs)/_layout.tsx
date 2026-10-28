import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useRadioPlayer } from "@/contexts/RadioPlayerContext";
import { Tabs, useRouter, type Href } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TabRoute = {
  key: string;
  name: string;
};

type TabLayoutProps = {
  state: {
    index: number;
    routes: TabRoute[];
  };
};

const TAB_ITEMS = [
  { name: "index", title: "Home", icon: "home" },
  { name: "shows", title: "Shows", icon: "headphones" },
  { name: "schedule", title: "Schedule", icon: "calendar" },
  { name: "more", title: "More", icon: "more-horizontal" },
] as const;

function PlaybackIcon({ isPlaying }: { isPlaying: boolean }) {
  if (isPlaying) {
    return (
      <View style={styles.pauseIcon}>
        <View style={styles.pauseBar} />
        <View style={styles.pauseBar} />
      </View>
    );
  }

  return <View style={styles.playTriangle} />;
}

function TabIcon({ name, active }: { name: string; active: boolean }) {
  return (
    <View
      style={[
        styles.tabIcon,
        { borderColor: active ? Colors.dark.tint : "#9690C8" },
      ]}
    >
      {name === "home" ? (
        <View
          style={[
            styles.homeIcon,
            { backgroundColor: active ? Colors.dark.tint : "#9690C8" },
          ]}
        />
      ) : name === "headphones" ? (
        <View
          style={[
            styles.headphoneIcon,
            { borderColor: active ? Colors.dark.tint : "#9690C8" },
          ]}
        >
          <View
            style={[
              styles.headphoneEar,
              { backgroundColor: active ? Colors.dark.tint : "#9690C8" },
            ]}
          />
          <View
            style={[
              styles.headphoneEar,
              { backgroundColor: active ? Colors.dark.tint : "#9690C8" },
            ]}
          />
        </View>
      ) : name === "calendar" ? (
        <View
          style={[
            styles.calendarIcon,
            { borderColor: active ? Colors.dark.tint : "#9690C8" },
          ]}
        >
          <View
            style={[
              styles.calendarLine,
              { backgroundColor: active ? Colors.dark.tint : "#9690C8" },
            ]}
          />
        </View>
      ) : (
        <View style={styles.moreIcon}>
          {[0, 1, 2].map((item) => (
            <View
              key={item}
              style={[
                styles.moreDot,
                { backgroundColor: active ? Colors.dark.tint : "#9690C8" },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function CustomTabBar({ state }: TabLayoutProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const activeTint = Colors[colorScheme].tint;

  const { isPlaying, isLoading, error, track, togglePlayback } =
    useRadioPlayer();
  const [failedArtworkUrl, setFailedArtworkUrl] = useState<string | null>(null);

  const visibleRoutes = state.routes.filter((route) =>
    TAB_ITEMS.some((item) => item.name === route.name),
  );

  return (
    <View style={styles.navigationContainer}>
      <View style={styles.player}>
        <Image
          key={track.artworkUrl ?? "woosh-radio-fallback"}
          source={
            track.artworkUrl && track.artworkUrl !== failedArtworkUrl
              ? { uri: track.artworkUrl }
              : require("../../assets/images/woosh-radio-icon.png")
          }
          style={styles.trackArtwork}
          resizeMode="cover"
          onError={() => {
            if (track.artworkUrl) {
              setFailedArtworkUrl(track.artworkUrl);
            }
          }}
        />

        <View style={styles.trackText}>
          <Text style={styles.trackTitle} numberOfLines={1}>
            {track.title}
          </Text>
          <Text style={styles.trackArtist} numberOfLines={1}>
            {error
              ? "Live stream unavailable"
              : isLoading
                ? "Connecting..."
                : track.artist}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            isPlaying ? "Pause live radio" : "Play live radio"
          }
          accessibilityState={{ busy: isLoading }}
          disabled={isLoading}
          onPress={() => void togglePlayback()}
          style={({ pressed }) => [
            styles.playButton,
            pressed && styles.playButtonPressed,
          ]}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <PlaybackIcon isPlaying={isPlaying} />
          )}
        </Pressable>
      </View>

      {error ? (
        <Text style={styles.errorText} numberOfLines={2}>
          {error}
        </Text>
      ) : null}

      <View
        style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 10) }]}
      >
        {visibleRoutes.map((route) => {
          const tab = TAB_ITEMS.find((item) => item.name === route.name);
          if (!tab) return null;

          const isActive = state.routes[state.index]?.name === route.name;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityLabel={tab.title}
              accessibilityState={{ selected: isActive }}
              onPress={() => {
                const href = (
                  route.name === "index" ? "/" : `/${route.name}`
                ) as Href;

                router.navigate(href);
              }}
              style={styles.tabItem}
            >
              <TabIcon name={tab.icon} active={isActive} />

              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? activeTint : "#9690C8" },
                ]}
              >
                {tab.title}
              </Text>

              {isActive ? <View style={styles.activeIndicator} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors[colorScheme].tint,
        sceneStyle: { backgroundColor: "#08091B" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="shows" options={{ title: "Shows" }} />
      <Tabs.Screen name="schedule" options={{ title: "Schedule" }} />
      <Tabs.Screen name="more" options={{ title: "More" }} />
      <Tabs.Screen name="two" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  navigationContainer: {
    backgroundColor: "#090A1C",
    borderTopWidth: 1,
    borderTopColor: "#17172F",
    paddingTop: 10,
  },
  player: {
    minHeight: 104,
    marginHorizontal: 12,
    marginBottom: 9,
    paddingHorizontal: 17,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#151329",
    borderWidth: 1,
    borderColor: "#35275D",
    borderRadius: 29,
  },
  trackArtwork: {
    width: 61,
    height: 61,
    borderRadius: 31,
    backgroundColor: "#211637",
  },
  trackText: {
    flex: 1,
    minWidth: 0,
    marginLeft: 13,
    gap: 5,
  },
  trackTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  trackArtist: {
    color: "#C8C5EB",
    fontSize: 14,
    fontWeight: "500",
  },
  playButton: {
    width: 60,
    height: 60,
    marginLeft: 12,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#F22BEE",
    backgroundColor: "#100D24",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#F20BEB",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  playButtonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  playTriangle: {
    width: 0,
    height: 0,
    marginLeft: 4,
    borderTopWidth: 12,
    borderBottomWidth: 12,
    borderLeftWidth: 18,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: "#FFFFFF",
  },
  pauseIcon: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  pauseBar: {
    width: 5,
    height: 21,
    borderRadius: 1.5,
    backgroundColor: "#FFFFFF",
  },
  errorText: {
    color: "#FF8BCE",
    fontSize: 12,
    marginHorizontal: 24,
    marginBottom: 8,
  },
  tabBar: {
    minHeight: 83,
    paddingTop: 12,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#0B0C20",
  },
  tabItem: {
    flex: 1,
    minHeight: 63,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  tabIcon: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  homeIcon: {
    width: 19,
    height: 19,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    transform: [{ rotate: "0deg" }],
  },
  headphoneIcon: {
    width: 23,
    height: 20,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomWidth: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 3,
  },
  headphoneEar: {
    width: 5,
    height: 9,
    borderRadius: 2,
    marginTop: 8,
  },
  calendarIcon: {
    width: 22,
    height: 21,
    borderWidth: 2.5,
    borderRadius: 5,
    overflow: "hidden",
  },
  calendarLine: {
    height: 3,
    width: "100%",
    marginTop: 5,
  },
  moreIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  moreDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  activeIndicator: {
    width: 7,
    height: 7,
    marginTop: 1,
    borderRadius: 4,
    backgroundColor: "#D72AFF",
  },
});
