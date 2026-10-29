import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BrandFooter from "../../components/BrandFooter";
import { getTeamMembers, TeamMember } from "../../lib/wordpress";

export default function TeamMemberProfileScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const [member, setMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMember = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const members = await getTeamMembers();
      const found = members.find((item) => item.slug === slug);

      if (!found) {
        setError("This team member could not be found.");
      }

      setMember(found ?? null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load this profile.",
      );
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void loadMember();
  }, [loadMember]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
        >
          <Text style={styles.backText}>← All Team Members</Text>
        </Pressable>

        {loading ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="large" color="#D946EF" />
            <Text style={styles.stateText}>Loading profile...</Text>
          </View>
        ) : error || !member ? (
          <View style={styles.stateContainer}>
            <Text style={styles.errorText}>
              {error ?? "Profile unavailable."}
            </Text>

            <Pressable
              onPress={() => void loadMember()}
              style={styles.retryButton}
              accessibilityRole="button"
            >
              <Text style={styles.retryText}>Try Again</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={styles.brand}>WOOSH RADIO</Text>

            {member.image ? (
              <Image
                source={{ uri: member.image }}
                style={styles.memberImage}
                resizeMode="cover"
                accessibilityLabel={`${member.name} profile photo`}
              />
            ) : null}

            <Text style={styles.name}>{member.name}</Text>
            <Text style={styles.sectionTitle}>ABOUT</Text>

            <Text style={styles.biography}>
              {member.biography ||
                "More information about this team member will be available soon."}
            </Text>

            <Pressable
              onPress={() => void Linking.openURL(member.link)}
              style={styles.profileButton}
              accessibilityRole="link"
            >
              <Text style={styles.profileButtonText}>
                VISIT WEBSITE PROFILE ↗
              </Text>
            </Pressable>
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
    backgroundColor: "#0B0B1A",
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 10,
    marginBottom: 24,
  },
  backText: {
    color: "#D8B4FE",
    fontSize: 14,
    fontFamily: "InterSemiBold",
  },
  brand: {
    color: "#D8B4FE",
    fontSize: 12,
    fontFamily: "InterBold",
    letterSpacing: 3,
    marginBottom: 18,
  },
  memberImage: {
    width: "100%",
    height: 280,
    borderRadius: 16,
    backgroundColor: "#201B35",
    marginBottom: 24,
  },
  name: {
    color: "#FFFFFF",
    fontSize: 29,
    lineHeight: 37,
    fontFamily: "SoraExtraBold",
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#F0ABFC",
    fontSize: 12,
    fontFamily: "InterBold",
    letterSpacing: 2,
    marginBottom: 12,
  },
  biography: {
    color: "#D0CDDF",
    fontSize: 15,
    fontFamily: "InterRegular",
    lineHeight: 26,
  },
  profileButton: {
    alignSelf: "flex-start",
    marginTop: 26,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 9,
    backgroundColor: "#382044",
    borderWidth: 1,
    borderColor: "#7E328D",
  },
  profileButtonText: {
    color: "#F0ABFC",
    fontSize: 11,
    fontFamily: "InterBold",
    letterSpacing: 1,
  },
  stateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 16,
  },
  stateText: {
    color: "#D0CDDF",
    fontSize: 14,
    fontFamily: "InterRegular",
  },
  errorText: {
    color: "#FCA5A5",
    textAlign: "center",
    fontSize: 14,
    fontFamily: "InterRegular",
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
