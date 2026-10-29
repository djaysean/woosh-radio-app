import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BrandFooter from "../components/BrandFooter";
import { getTeamMembers, TeamMember } from "../lib/wordpress";

export default function TeamScreen() {
  const router = useRouter();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTeam = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      setMembers(await getTeamMembers());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load the team.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadTeam();
  }, [loadTeam]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      <FlatList
        data={members}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadTeam(true)}
            tintColor="#D946EF"
            colors={["#D946EF"]}
          />
        }
        ListHeaderComponent={
          <View>
            <Pressable
              onPress={() => router.back()}
              style={styles.backButton}
              accessibilityRole="button"
            >
              <Text style={styles.backText}>← Back</Text>
            </Pressable>

            <Text style={styles.brand}>WOOSH RADIO</Text>
            <Text style={styles.heading}>Meet the Team</Text>
            <Text style={styles.description}>
              Meet the voices and people behind WOOSH RADIO.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.memberCard}
            onPress={() =>
              router.push({
                pathname: "/team/[slug]",
                params: { slug: item.slug },
              })
            }
            accessibilityRole="button"
            accessibilityLabel={`View ${item.name}'s profile`}
          >
            {item.image ? (
              <Image
                source={{ uri: item.image }}
                style={styles.memberImage}
                resizeMode="cover"
                accessibilityLabel={`${item.name} profile photo`}
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.placeholderText}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}

            <Text style={styles.memberName} numberOfLines={2}>
              {item.name}
            </Text>

            <Text style={styles.viewProfile}>VIEW PROFILE ↗</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.stateContainer}>
            {loading ? (
              <>
                <ActivityIndicator size="large" color="#D946EF" />
                <Text style={styles.stateText}>Loading our team...</Text>
              </>
            ) : (
              <>
                <Text style={styles.stateText}>
                  {error ?? "No team profiles are available right now."}
                </Text>

                {error ? (
                  <Pressable
                    onPress={() => void loadTeam()}
                    style={styles.retryButton}
                    accessibilityRole="button"
                  >
                    <Text style={styles.retryText}>Try Again</Text>
                  </Pressable>
                ) : null}
              </>
            )}
          </View>
        }
        ListFooterComponent={
          <View>
            <BrandFooter />
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0B0B1A",
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    flexGrow: 1,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 10,
    marginBottom: 24,
  },
  backText: {
    color: "#D8B4FE",
    fontSize: 15,
    fontFamily: "InterSemiBold",
  },
  brand: {
    color: "#D8B4FE",
    fontSize: 12,
    fontFamily: "InterBold",
    letterSpacing: 3,
    marginBottom: 12,
  },
  heading: {
    color: "#FFFFFF",
    fontSize: 30,
    fontFamily: "SoraExtraBold",
    marginBottom: 10,
  },
  description: {
    color: "#D0CDDF",
    fontSize: 15,
    fontFamily: "InterRegular",
    lineHeight: 23,
    marginBottom: 26,
  },
  row: {
    gap: 14,
  },
  memberCard: {
    flex: 1,
    marginBottom: 20,
    overflow: "hidden",
    borderRadius: 15,
    backgroundColor: "#151329",
    borderWidth: 1,
    borderColor: "#302344",
    paddingBottom: 14,
  },
  memberImage: {
    width: "100%",
    aspectRatio: 0.95,
    backgroundColor: "#201B35",
  },
  imagePlaceholder: {
    width: "100%",
    aspectRatio: 0.95,
    backgroundColor: "#201B35",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    color: "#D8B4FE",
    fontSize: 48,
    fontFamily: "SoraExtraBold",
  },
  memberName: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 21,
    fontFamily: "SoraBold",
    paddingHorizontal: 12,
    paddingTop: 13,
  },
  viewProfile: {
    color: "#F0ABFC",
    fontSize: 10,
    fontFamily: "InterBold",
    letterSpacing: 0.8,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  stateContainer: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 16,
  },
  stateText: {
    color: "#D0CDDF",
    fontSize: 14,
    fontFamily: "InterRegular",
    textAlign: "center",
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: "#382044",
    borderRadius: 9,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  retryText: {
    color: "#FFFFFF",
    fontFamily: "InterBold",
  },
});
