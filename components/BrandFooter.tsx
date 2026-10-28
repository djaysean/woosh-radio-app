import { Image, StyleSheet, Text, View } from "react-native";

const BRAND_ICON = require("../assets/images/woosh-radio-icon.png");

export default function BrandFooter() {
  return (
    <View style={styles.container}>
      <Image
        source={BRAND_ICON}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="WOOSH RADIO logo"
      />

      <Text style={styles.brandName}>WOOSH RADIO</Text>

      <Text style={styles.tagline}>THE SOUND OF WHAT’S HAPPENING</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#151329",
    borderColor: "#302344",
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 18,
    marginTop: 32,
    marginBottom: 12,
  },
  logo: {
    width: 76,
    height: 76,
    marginBottom: 12,
  },
  brandName: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 3,
    textAlign: "center",
    marginBottom: 7,
  },
  tagline: {
    color: "#D8B4FE",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    textAlign: "center",
  },
});
