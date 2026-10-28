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
import RenderHTML from "react-native-render-html";
import { SafeAreaView } from "react-native-safe-area-context";
import BrandFooter from "../components/BrandFooter";

const PRIVACY_API_URL =
  "https://wooshradio.com/wp-json/wp/v2/pages?slug=privacy-policy";

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
    loadPolicy();
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadPolicy(true)}
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
            <Pressable style={styles.retryButton} onPress={() => loadPolicy()}>
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
                renderersProps={renderersProps}
                tagsStyles={htmlStyles}
                baseStyle={styles.baseText}
                defaultTextProps={{ selectable: true }}
              />
            </View>
          </>
        )}

        <BrandFooter />
      </ScrollView>
    </SafeAreaView>
  );
}

const htmlStyles = {
  h2: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "700" as const,
    marginTop: 24,
    marginBottom: 10,
  },
  h3: {
    color: "#F0ABFC",
    fontSize: 17,
    fontWeight: "700" as const,
    marginTop: 18,
    marginBottom: 8,
  },
  p: {
    color: "#D1D5DB",
    fontSize: 15,
    lineHeight: 25,
    marginTop: 0,
    marginBottom: 14,
  },
  strong: {
    color: "#FFFFFF",
    fontWeight: "700" as const,
  },
  a: {
    color: "#E879F9",
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
    lineHeight: 25,
    marginBottom: 8,
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
    fontWeight: "800",
    letterSpacing: 3,
    marginBottom: 10,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 10,
  },
  subtitle: {
    color: "#B9B3C9",
    fontSize: 15,
    lineHeight: 23,
  },
  updated: {
    color: "#8D849F",
    fontSize: 12,
    marginTop: 14,
  },
  policyCard: {
    backgroundColor: "#151025",
    borderColor: "#302442",
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
  },
  baseText: {
    color: "#D1D5DB",
    fontSize: 15,
    lineHeight: 25,
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
  },
  errorText: {
    color: "#FCA5A5",
    textAlign: "center",
    fontSize: 14,
    lineHeight: 22,
  },
  inlineError: {
    color: "#FCA5A5",
    fontSize: 13,
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
    fontWeight: "700",
  },
});
