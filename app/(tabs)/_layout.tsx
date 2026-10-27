import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors[colorScheme].tint,
        tabBarStyle: {
          backgroundColor: "#0B0B1A",
          borderTopColor: "#29243D",
        },
        tabBarInactiveTintColor: "#8983A7",
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "house.fill",
                android: "home",
                web: "home",
              }}
              tintColor={color}
              size={22}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="shows"
        options={{
          title: "Shows",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "music.note.list",
                android: "library_music",
                web: "mic",
              }}
              tintColor={color}
              size={22}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="schedule"
        options={{
          title: "Schedule",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "calendar",
                android: "calendar_month",
                web: "calendar_month",
              }}
              tintColor={color}
              size={22}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "ellipsis",
                android: "more_horiz",
                web: "more_horiz",
              }}
              tintColor={color}
              size={22}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="two"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
