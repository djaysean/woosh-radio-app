import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import RenderHTML, { defaultSystemFonts } from "react-native-render-html";
import { SafeAreaView } from "react-native-safe-area-context";
import BrandFooter from "../components/BrandFooter";

const PRIVACY_API_URL =
  "https://wooshradio.com/wp-json/wp/v2/pages?slug=privacy-policy";

// Register the custom app fonts with the HTML renderer.
const systemFonts = [
  ...defaultSystemFonts,
  "SoraSemiBold",
  "SoraBold",
  "SoraExtraBold",
  "InterRegular",
  "InterMedium",
  "InterSemiBold",
  "InterBold",
];

type WordPressPage = {
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  modified: string;
};

export default function PrivacyScreen() {
  const { width } = useWindowDimensions();

  const [policyHtml, setPolicyHtml] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadPolicy = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await fetch(PRIVACY_API_URL);

      if (!response.ok) {
        throw new Error("Unable to retrieve the Privacy Policy.");
      }

      const pages: WordPressPage[] = await response.json();

      if (!Array.isArray(pages) || pages.length === 0) {
        throw new Error("The Privacy Policy could not be found.");
      }

      const page = pages[0];

      if (!page.content?.rendered) {
        throw new Error("The Privacy Policy has no published content.");
      }

      setPolicyHtml(page.content.rendered);
      setLastUpdated(page.modified ?? "");
    } catch {
      setError(
        "We couldn't load the latest Privacy Policy. Check your internet connection and try again.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadPolicy();
  }, [loadPolicy]);

  const formattedDate = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const renderersProps = {
    a: {
      onPress: (_event: unknown, href: string) => {
        if (href) {
          Linking.openURL(href).catch(() => {
            setError("We couldn't open that link.");
          });
        }
      },
    },
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadPolicy(true)}
            tintColor="#D946EF"
            colors={["#D946EF"]}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>WOOSH RADIO</Text>
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.subtitle}>
            How we collect, use, and protect your information.
          </Text>

          {formattedDate ? (
            <Text style={styles.updated}>Last updated: {formattedDate}</Text>
          ) : null}
        </View>

        {loading ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="large" color="#D946EF" />
            <Text style={styles.stateText}>Loading Privacy Policy...</Text>
          </View>
        ) : error && !policyHtml ? (
          <View style={styles.stateContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              style={styles.retryButton}
              onPress={() => void loadPolicy()}
              accessibilityRole="button"
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {error ? <Text style={styles.inlineError}>{error}</Text> : null}

            <View style={styles.policyCard}>
              <RenderHTML
                contentWidth={width - 56}
                source={{ html: policyHtml }}
                systemFonts={systemFonts}
                renderersProps={renderersProps}
                tagsStyles={htmlStyles}
                baseStyle={baseHtmlStyle}
                ignoredStyles={["fontFamily", "fontWeight"]}
                defaultTextProps={{
                  selectable: true,
                  allowFontScaling: true,
                }}
              />
            </View>
          </>
        )}

        <BrandFooter />
      </ScrollView>
    </SafeAreaView>
  );
}

// Keep RenderHTML mixed styles as plain objects, not StyleSheet.create styles.
const baseHtmlStyle = {
  color: "#D1D5DB",
  fontSize: 15,
  fontFamily: "InterRegular",
  lineHeight: 25,
};

const htmlStyles = {
  body: {
    color: "#D1D5DB",
    fontSize: 15,
    fontFamily: "InterRegular",
    lineHeight: 25,
  },
  h1: {
    color: "#FFFFFF",
    fontSize: 26,
    fontFamily: "SoraExtraBold",
    marginTop: 24,
    marginBottom: 12,
  },
  h2: {
    color: "#FFFFFF",
    fontSize: 21,
    fontFamily: "SoraBold",
    marginTop: 24,
    marginBottom: 10,
  },
  h3: {
    color: "#F0ABFC",
    fontSize: 17,
    fontFamily: "SoraBold",
    marginTop: 18,
    marginBottom: 8,
  },
  h4: {
    color: "#F0ABFC",
    fontSize: 16,
    fontFamily: "SoraBold",
    marginTop: 16,
    marginBottom: 8,
  },
  h5: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "InterBold",
    marginTop: 14,
    marginBottom: 6,
  },
  h6: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "InterBold",
    marginTop: 12,
    marginBottom: 6,
  },
  p: {
    color: "#D1D5DB",
    fontSize: 15,
    fontFamily: "InterRegular",
    lineHeight: 25,
    marginTop: 0,
    marginBottom: 14,
  },
  strong: {
    color: "#FFFFFF",
    fontFamily: "InterBold",
  },
  b: {
    color: "#FFFFFF",
    fontFamily: "InterBold",
  },
  em: {
    fontFamily: "InterRegular",
    fontStyle: "italic" as const,
  },
  i: {
    fontFamily: "InterRegular",
    fontStyle: "italic" as const,
  },
  a: {
    color: "#E879F9",
    fontFamily: "InterMedium",
    textDecorationLine: "underline" as const,
  },
  ul: {
    marginBottom: 14,
    paddingLeft: 8,
  },
  ol: {
    marginBottom: 14,
    paddingLeft: 8,
  },
  li: {
    color: "#D1D5DB",
    fontSize: 15,
    fontFamily: "InterRegular",
    lineHeight: 25,
    marginBottom: 8,
  },
  blockquote: {
    color: "#B9B3C9",
    fontFamily: "InterRegular",
    marginVertical: 12,
  },
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0B0718",
  },
  container: {
    flex: 1,
    backgroundColor: "#0B0718",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  eyebrow: {
    color: "#E879F9",
    fontSize: 12,
    fontFamily: "InterBold",
    letterSpacing: 3,
    marginBottom: 10,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 32,
    fontFamily: "SoraExtraBold",
    marginBottom: 10,
  },
  subtitle: {
    color: "#B9B3C9",
    fontSize: 15,
    fontFamily: "InterRegular",
    lineHeight: 23,
  },
  updated: {
    color: "#8D849F",
    fontSize: 12,
    fontFamily: "InterMedium",
    marginTop: 14,
  },
  policyCard: {
    backgroundColor: "#151025",
    borderColor: "#302442",
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
  },
  stateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 16,
  },
  stateText: {
    color: "#B9B3C9",
    fontSize: 14,
    fontFamily: "InterRegular",
  },
  errorText: {
    color: "#FCA5A5",
    textAlign: "center",
    fontSize: 14,
    fontFamily: "InterRegular",
    lineHeight: 22,
  },
  inlineError: {
    color: "#FCA5A5",
    fontSize: 13,
    fontFamily: "InterRegular",
    marginBottom: 14,
  },
  retryButton: {
    backgroundColor: "#A21CAF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "InterBold",
  },
});
