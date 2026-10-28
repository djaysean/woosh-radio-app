import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BrandFooter from "../../components/BrandFooter";
import { getRadioShows, type RadioShow } from "../../lib/wordpress";

export default function ShowsScreen() {
  const [shows, setShows] = useState<RadioShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadShows = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const data = await getRadioShows();

      const sortedShows = [...data].sort((a, b) =>
        a.title.rendered.localeCompare(b.title.rendered, undefined, {
          sensitivity: "base",
          numeric: true,
        }),
      );

      setShows(sortedShows);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load shows. Please try again.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadShows();
  }, [loadShows]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadShows(true)}
            tintColor="#E83E8C"
            colors={["#E83E8C"]}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>DISCOVER WOOSH</Text>
          <Text style={styles.heading}>Our Shows</Text>
          <Text style={styles.subtitle}>
            Your favourite sounds, stories and voices — all in one place.
          </Text>

          {!loading && !error && (
            <Text style={styles.count}>
              {shows.length} {shows.length === 1 ? "SHOW" : "SHOWS"} · A–Z
            </Text>
          )}
        </View>

        {loading ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="large" color="#E83E8C" />
            <Text style={styles.stateText}>Loading our shows...</Text>
          </View>
        ) : error ? (
          <View style={styles.stateContainer}>
            <Text style={styles.stateTitle}>Unable to load shows</Text>
            <Text style={styles.stateText}>{error}</Text>

            <Pressable
              style={styles.retryButton}
              onPress={() => void loadShows()}
            >
              <Text style={styles.retryButtonText}>TRY AGAIN</Text>
            </Pressable>
          </View>
        ) : shows.length === 0 ? (
          <View style={styles.stateContainer}>
            <Text style={styles.stateTitle}>No shows available yet</Text>
            <Text style={styles.stateText}>Please check back soon.</Text>
          </View>
        ) : (
          <View style={styles.showList}>
            {shows.map((show) => {
              const description = (
                show.excerpt.rendered || show.content.rendered
              )
                .replace(/<[^>]*>/g, " ")
                .replace(/&nbsp;/g, " ")
                .replace(/&#8217;/g, "’")
                .replace(/&amp;/g, "&")
                .replace(/\s+/g, " ")
                .trim();

              return (
                <View key={show.id} style={styles.showCard}>
                  {show.artwork ? (
                    <Image
                      source={{ uri: show.artwork }}
                      style={styles.artwork}
                      resizeMode="cover"
                      accessibilityLabel={`${show.title.rendered} artwork`}
                    />
                  ) : (
                    <View style={[styles.artwork, styles.artworkFallback]}>
                      <Text style={styles.fallbackMark}>W</Text>
                    </View>
                  )}

                  <View style={styles.showInfo}>
                    <Text style={styles.showTitle}>{show.title.rendered}</Text>

                    <Text style={styles.description} numberOfLines={4}>
                      {description || "Discover this show on WOOSH RADIO."}
                    </Text>

                    <Text style={styles.showLabel}>WOOSH RADIO</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <BrandFooter />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B1A",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 24,
  },
  eyebrow: {
    color: "#E83E8C",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 3,
    marginBottom: 10,
  },
  heading: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1,
  },
  subtitle: {
    color: "#B8B3CC",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
    maxWidth: 320,
  },
  count: {
    color: "#E83E8C",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
    marginTop: 18,
  },
  showList: {
    gap: 16,
  },
  showCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#151427",
    borderColor: "#29243D",
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    gap: 14,
  },
  artwork: {
    width: 112,
    height: 112,
    borderRadius: 12,
    backgroundColor: "#211B37",
  },
  artworkFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackMark: {
    color: "#E83E8C",
    fontSize: 40,
    fontWeight: "900",
  },
  showInfo: {
    flex: 1,
    paddingTop: 3,
  },
  showTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 22,
  },
  description: {
    color: "#B8B3CC",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 7,
  },
  showLabel: {
    color: "#E83E8C",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginTop: 12,
  },
  stateContainer: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 12,
  },
  stateTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  stateText: {
    color: "#B8B3CC",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#E83E8C",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
});
