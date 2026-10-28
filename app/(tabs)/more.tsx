import Constants from "expo-constants";
import { useRouter } from "expo-router";
import {
  Linking,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BrandFooter from "../../components/BrandFooter";

const COLORS = {
  background: "#0B0B1A",
  card: "#17152B",
  border: "#29243D",
  text: "#FFFFFF",
  muted: "#A7A1BF",
  accent: "#D946EF",
};

const WEBSITE_URL = "https://wooshradio.com";

type MenuItem = {
  title: string;
  description: string;
  icon: string;
  route?: "/team" | "/contact" | "/privacy";
  externalUrl?: string;
};

const MENU_ITEMS: MenuItem[] = [
  {
    title: "Team",
    description: "Meet the people behind WOOSH RADIO.",
    icon: "◉",
    route: "/team",
  },
  {
    title: "Contact Us",
    description: "Get in touch with the station.",
    icon: "✉",
    route: "/contact",
  },
  {
    title: "Privacy Policy",
    description: "Learn how your information is handled.",
    icon: "◇",
    route: "/privacy",
  },
  {
    title: "Visit the Website",
    description: "Explore WOOSH RADIO online.",
    icon: "↗",
    externalUrl: WEBSITE_URL,
  },
];

export default function MoreScreen() {
  const router = useRouter();
  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

  const openWebsite = async () => {
    try {
      await Linking.openURL(WEBSITE_URL);
    } catch {
      // Leave the screen in place if the website cannot be opened.
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>WOOSH RADIO</Text>
          <Text style={styles.title}>More</Text>
          <Text style={styles.subtitle}>Everything else you need to know.</Text>
        </View>

        <Text style={styles.sectionLabel}>EXPLORE</Text>

        <View style={styles.menuCard}>
          {MENU_ITEMS.map((item, index) => (
            <View key={item.title}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={item.title}
                onPress={() => {
                  if (item.route) {
                    router.push(item.route);
                  } else if (item.externalUrl) {
                    void openWebsite();
                  }
                }}
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && styles.menuItemPressed,
                ]}
              >
                <View style={styles.iconContainer}>
                  <Text style={styles.iconText}>{item.icon}</Text>
                </View>

                <View style={styles.menuText}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuDescription}>{item.description}</Text>
                </View>

                <Text style={styles.chevron}>
                  {item.externalUrl ? "↗" : "›"}
                </Text>
              </Pressable>

              {index < MENU_ITEMS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        <BrandFooter />

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>App Version {appVersion}</Text>
        </View>
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
    paddingBottom: 42,
  },
  header: {
    marginBottom: 28,
  },
  eyebrow: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 3,
    marginBottom: 10,
  },
  title: {
    color: COLORS.text,
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 14,
    marginTop: 8,
  },
  sectionLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.8,
    marginBottom: 12,
  },
  menuCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    paddingHorizontal: 14,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 17,
    gap: 13,
  },
  menuItemPressed: {
    opacity: 0.65,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#29183A",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    color: "#E879F9",
    fontSize: 23,
    fontWeight: "800",
  },
  menuText: {
    flex: 1,
    gap: 5,
  },
  menuTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
  },
  menuDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  chevron: {
    color: COLORS.muted,
    fontSize: 23,
    paddingLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  versionContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  versionText: {
    color: COLORS.muted,
    fontSize: 12,
  },
});
