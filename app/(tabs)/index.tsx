import { Text, View } from "@/components/Themed";
import { Pressable, ScrollView, StatusBar, StyleSheet } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Brand header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.logoMark}>
              <Text style={styles.logoSymbol}>W</Text>
            </View>
            <View>
              <Text style={styles.brandName}>WOOSH RADIO</Text>
              <Text style={styles.tagline}>THE SOUND OF WHAT'S HAPPENING</Text>
            </View>
          </View>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>RADIO</Text>
          </View>
        </View>

        {/* Welcome section */}
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>YOUR SOUND. YOUR WORLD.</Text>
          <Text style={styles.heroTitle}>
            Turn up{"\n"}your <Text style={styles.heroAccent}>world.</Text>
          </Text>
          <Text style={styles.heroDescription}>
            Music, conversations and stories that move you. Wherever you are,
            WOOSH is with you.
          </Text>

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.listenButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => {}}
          >
            <Text style={styles.playIcon}>▶</Text>
            <Text style={styles.listenButtonText}>LISTEN LIVE</Text>
          </Pressable>

          <Text style={styles.streamCaption}>
            MUSIC • CONVERSATIONS • GOOD ENERGY
          </Text>
        </View>

        {/* Featured programs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>TUNED FOR YOU</Text>
              <Text style={styles.sectionTitle}>On WOOSH</Text>
            </View>
            <Text style={styles.sectionAccent}>EXPLORE</Text>
          </View>

          <View style={styles.programCard}>
            <View style={[styles.programArt, styles.artPurple]}>
              <Text style={styles.artLabel}>WOOSH</Text>
              <Text style={styles.artTitle}>MORNING{"\n"}PULSE</Text>
            </View>
            <View style={styles.programInfo}>
              <Text style={styles.programTime}>6 AM – 10 AM</Text>
              <Text style={styles.programName}>WOOSH Morning Pulse</Text>
              <Text style={styles.programDescription}>
                Uplifting music, motivation and positive vibes.
              </Text>
            </View>
          </View>

          <View style={styles.programCard}>
            <View style={[styles.programArt, styles.artPink]}>
              <Text style={styles.artLabel}>WOOSH</Text>
              <Text style={styles.artTitle}>MUSIC{"\n"}MIX</Text>
            </View>
            <View style={styles.programInfo}>
              <Text style={styles.programTime}>10 AM – 4 PM</Text>
              <Text style={styles.programName}>WOOSH Music Mix</Text>
              <Text style={styles.programDescription}>
                African sounds, Kenyan music and global hits.
              </Text>
            </View>
          </View>
        </View>

        {/* Brand footer */}
        <View style={styles.footer}>
          <Text style={styles.footerBrand}>WOOSH RADIO</Text>
          <Text style={styles.footerText}>The Sound of What's Happening</Text>
        </View>
      </ScrollView>
    </View>
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
    paddingBottom: 36,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 38,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoMark: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#7C35F4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D16BFF",
  },
  logoSymbol: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "900",
  },
  brandName: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  tagline: {
    color: "#AAA6C7",
    fontSize: 8,
    letterSpacing: 0.7,
    marginTop: 3,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: "#39304F",
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#D64CFF",
  },
  liveText: {
    color: "#E4D9F8",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  hero: {
    backgroundColor: "#151329",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#30234C",
    padding: 22,
    paddingTop: 26,
    paddingBottom: 24,
    overflow: "hidden",
  },
  eyebrow: {
    color: "#D76AFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 16,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 43,
    fontWeight: "900",
    lineHeight: 48,
    letterSpacing: -1.5,
  },
  heroAccent: {
    color: "#C56BFF",
  },
  heroDescription: {
    color: "#C2BED8",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 14,
    marginBottom: 24,
    maxWidth: 290,
  },
  listenButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    minHeight: 54,
    backgroundColor: "#8D35F5",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#C66AFF",
    shadowColor: "#A63DFF",
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  playIcon: {
    color: "#FFFFFF",
    fontSize: 15,
  },
  listenButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  streamCaption: {
    color: "#AAA4C6",
    textAlign: "center",
    fontSize: 8,
    letterSpacing: 1,
    marginTop: 17,
  },
  section: {
    marginTop: 34,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 17,
  },
  sectionEyebrow: {
    color: "#B65AFF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.8,
    marginBottom: 5,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  sectionAccent: {
    color: "#D277FF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    paddingBottom: 4,
  },
  programCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    padding: 12,
    marginBottom: 12,
    borderRadius: 19,
    backgroundColor: "#151329",
    borderWidth: 1,
    borderColor: "#2C2544",
  },
  programArt: {
    width: 104,
    height: 112,
    borderRadius: 13,
    padding: 10,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  artPurple: {
    backgroundColor: "#5423A4",
  },
  artPink: {
    backgroundColor: "#85295F",
  },
  artLabel: {
    color: "#F0DFFF",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 6,
  },
  artTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 19,
    letterSpacing: -0.3,
  },
  programInfo: {
    flex: 1,
    backgroundColor: "transparent",
  },
  programTime: {
    color: "#D17AFF",
    fontSize: 10,
    fontWeight: "800",
    marginBottom: 6,
  },
  programName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
  },
  programDescription: {
    color: "#B8B3CF",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 6,
  },
  footer: {
    alignItems: "center",
    paddingTop: 24,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#29243D",
  },
  footerBrand: {
    color: "#E4C2FF",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
  },
  footerText: {
    color: "#8983A7",
    fontSize: 10,
    marginTop: 6,
  },
});
