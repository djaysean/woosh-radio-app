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
import {
  getRadioShows,
  getWeeklySchedule,
  type RadioShow,
  type WeeklySchedule,
} from "../../lib/wordpress";

const COLORS = {
  background: "#0B0B1A",
  card: "#17152B",
  border: "#29243D",
  text: "#FFFFFF",
  muted: "#A7A1BF",
  accent: "#D946EF",
  accentDark: "#7026A8",
};

function formatTime(value: string): string {
  const parts = value.split(":");
  const hours = Number(parts[0]);
  const minutes = parts[1] ?? "00";

  if (!Number.isFinite(hours)) return value;

  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;

  return `${displayHour}:${minutes} ${period}`;
}

export default function ScheduleScreen() {
  const [schedule, setSchedule] = useState<WeeklySchedule | null>(null);
  const [radioShows, setRadioShows] = useState<RadioShow[]>([]);
  const [selectedDayId, setSelectedDayId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSchedule = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const [weeklySchedule, shows] = await Promise.all([
        getWeeklySchedule(),
        getRadioShows(),
      ]);

      setSchedule(weeklySchedule);
      setRadioShows(shows);

      setSelectedDayId((previous) => {
        if (
          previous !== null &&
          weeklySchedule.days.some((day) => day.id === previous)
        ) {
          return previous;
        }

        return weeklySchedule.days.some(
          (day) => day.id === weeklySchedule.currentDayId,
        )
          ? weeklySchedule.currentDayId
          : (weeklySchedule.days[0]?.id ?? null);
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load the schedule. Please try again.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadSchedule();
  }, [loadSchedule]);

  const selectedDay = schedule?.days.find((day) => day.id === selectedDayId);

  const showById = new Map(radioShows.map((show) => [String(show.id), show]));

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadSchedule(true)}
            tintColor={COLORS.accent}
            colors={[COLORS.accent]}
            progressBackgroundColor={COLORS.card}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>WOOSH RADIO</Text>
          <Text style={styles.title}>Weekly Schedule</Text>
          <Text style={styles.subtitle}>
            Your shows. Your week. Your sound.
          </Text>
        </View>

        {loading && !schedule ? (
          <View style={styles.messageContainer}>
            <ActivityIndicator size="large" color={COLORS.accent} />
            <Text style={styles.messageText}>
              Loading the latest schedule...
            </Text>
          </View>
        ) : error && !schedule ? (
          <View style={styles.messageContainer}>
            <Text style={styles.errorTitle}>Schedule unavailable</Text>
            <Text style={styles.messageText}>{error}</Text>
            <Pressable
              style={styles.retryButton}
              onPress={() => void loadSchedule()}
              accessibilityRole="button"
            >
              <Text style={styles.retryText}>TRY AGAIN</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>SELECT A DAY</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dayList}
            >
              {(schedule?.days ?? []).map((day) => {
                const active = day.id === selectedDayId;

                return (
                  <Pressable
                    key={day.id}
                    onPress={() => setSelectedDayId(day.id)}
                    style={[styles.dayButton, active && styles.dayButtonActive]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Text
                      style={[
                        styles.dayButtonText,
                        active && styles.dayButtonTextActive,
                      ]}
                    >
                      {day.title}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {error ? (
              <Text style={styles.inlineError}>Refresh failed: {error}</Text>
            ) : null}

            <View style={styles.dayHeading}>
              <Text style={styles.dayTitle}>
                {selectedDay?.title ?? "Schedule"}
              </Text>
              <Text style={styles.daySubtitle}>
                {selectedDay?.shows.length ?? 0} scheduled shows
              </Text>
            </View>

            {!selectedDay || selectedDay.shows.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No shows listed</Text>
                <Text style={styles.messageText}>
                  There are no published show entries for this day.
                </Text>
              </View>
            ) : (
              selectedDay.shows.map((slot, index) => {
                const show = showById.get(slot.showId);

                return (
                  <View
                    key={`${selectedDay.id}-${slot.showId}-${index}`}
                    style={styles.showCard}
                  >
                    {show?.artwork ? (
                      <Image
                        source={{ uri: show.artwork }}
                        style={styles.artwork}
                        resizeMode="cover"
                        accessibilityLabel="Show artwork"
                      />
                    ) : (
                      <View style={styles.artworkPlaceholder}>
                        <Text style={styles.placeholderMark}>W</Text>
                      </View>
                    )}

                    <View style={styles.showDetails}>
                      <Text style={styles.showTitle}>
                        {show?.title.rendered ??
                          (slot.showId ? "Radio Show" : "Untitled show")}
                      </Text>

                      <Text style={styles.showTime}>
                        {formatTime(slot.startTime)} –{" "}
                        {formatTime(slot.endTime)}
                      </Text>

                      <Text style={styles.timezoneNote}>
                        Times as published on WOOSH Radio
                      </Text>
                    </View>
                  </View>
                );
              })
            )}

            <Text style={styles.footerNote}>
              Pull down to refresh the latest timetable from our website.
            </Text>
          </>
        )}

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
    paddingTop: 18,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 28,
  },
  eyebrow: {
    fontFamily: "InterBold",
    color: COLORS.accent,
    fontSize: 12,
    letterSpacing: 3,
    marginBottom: 10,
  },
  title: {
    fontFamily: "SoraExtraBold",
    color: COLORS.text,
    fontSize: 30,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontFamily: "InterRegular",
    color: COLORS.muted,
    fontSize: 14,
    marginTop: 8,
  },
  sectionLabel: {
    fontFamily: "InterBold",
    color: COLORS.muted,
    fontSize: 11,
    letterSpacing: 1.8,
    marginBottom: 12,
  },
  dayList: {
    gap: 8,
    paddingBottom: 8,
  },
  dayButton: {
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  dayButtonActive: {
    backgroundColor: COLORS.accentDark,
    borderColor: COLORS.accent,
  },
  dayButtonText: {
    fontFamily: "InterMedium",
    color: COLORS.muted,
    fontSize: 13,
  },
  dayButtonTextActive: {
    fontFamily: "InterSemiBold",
    color: COLORS.text,
  },
  dayHeading: {
    marginTop: 26,
    marginBottom: 16,
  },
  dayTitle: {
    fontFamily: "SoraBold",
    color: COLORS.text,
    fontSize: 24,
  },
  daySubtitle: {
    fontFamily: "InterRegular",
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 5,
  },
  showCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    gap: 13,
  },
  artwork: {
    width: 76,
    height: 76,
    borderRadius: 12,
    backgroundColor: COLORS.border,
  },
  artworkPlaceholder: {
    width: 76,
    height: 76,
    borderRadius: 12,
    backgroundColor: COLORS.accentDark,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderMark: {
    fontFamily: "SoraExtraBold",
    color: COLORS.text,
    fontSize: 32,
  },
  showDetails: {
    flex: 1,
  },
  showTitle: {
    fontFamily: "SoraBold",
    color: COLORS.text,
    fontSize: 15,
    marginBottom: 8,
  },
  showTime: {
    fontFamily: "InterSemiBold",
    color: COLORS.accent,
    fontSize: 14,
  },
  timezoneNote: {
    fontFamily: "InterRegular",
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 6,
  },
  messageContainer: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 14,
  },
  messageText: {
    fontFamily: "InterRegular",
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  errorTitle: {
    fontFamily: "SoraBold",
    color: COLORS.text,
    fontSize: 20,
  },
  retryButton: {
    backgroundColor: COLORS.accentDark,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 13,
    marginTop: 8,
  },
  retryText: {
    fontFamily: "InterBold",
    color: COLORS.text,
    fontSize: 12,
    letterSpacing: 1,
  },
  inlineError: {
    fontFamily: "InterMedium",
    color: "#FF8A8A",
    fontSize: 12,
    marginTop: 10,
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 22,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    fontFamily: "SoraBold",
    color: COLORS.text,
    fontSize: 17,
  },
  footerNote: {
    fontFamily: "InterRegular",
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 18,
  },
});
