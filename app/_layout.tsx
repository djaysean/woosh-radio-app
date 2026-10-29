import { useFonts } from "expo-font";
import { DarkTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/components/useColorScheme";
import { RadioPlayerProvider } from "@/contexts/RadioPlayerContext";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  anchor: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SoraSemiBold: require("../assets/fonts/Sora-SemiBold.ttf"),
    SoraBold: require("../assets/fonts/Sora-Bold.ttf"),
    SoraExtraBold: require("../assets/fonts/Sora-ExtraBold.ttf"),

    InterRegular: require("../assets/fonts/Inter_18pt-Regular.ttf"),
    InterMedium: require("../assets/fonts/Inter_18pt-Medium.ttf"),
    InterSemiBold: require("../assets/fonts/Inter_18pt-SemiBold.ttf"),
    InterBold: require("../assets/fonts/Inter_18pt-Bold.ttf"),
  });

  useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      void SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DarkTheme}>
      <RadioPlayerProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: "modal" }} />
        </Stack>
      </RadioPlayerProvider>
    </ThemeProvider>
  );
}
