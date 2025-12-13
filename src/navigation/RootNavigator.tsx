import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

// Screens
import HomeScreen from "../screens/HomeScreen";
import LibraryScreen from "../screens/LibraryScreen";
import StationsScreen from "../screens/StationsScreen";
import CreatePlaylistScreen from "../screens/CreatePlaylistScreen";
import PromptPlaylistScreen from "../screens/PromptPlaylistScreen";
import PlaylistDetailScreen from "../screens/PlaylistDetailScreen";
import ListenModeScreen from "../screens/ListenModeScreen";
import ReadModeScreen from "../screens/ReadModeScreen";
import SettingsScreen from "../screens/SettingsScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import ModesScreen from "../screens/ModesScreen";
import EditPlaylistScreen from "../screens/EditPlaylistScreen";
import DeepDiveStudyScreen from "../screens/DeepDiveStudyScreen";

// Store
import { usePreferencesStore } from "../state/preferencesStore";

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: undefined;
  CreatePlaylist: undefined;
  PromptPlaylist: { mode?: string };
  PlaylistDetail: { playlistId: string };
  ListenMode: { playlistId: string; startFromItem?: string };
  ReadMode: { playlistId: string; startFromItem?: string };
  Settings: undefined;
  Modes: undefined;
  EditPlaylist: { playlistId: string };
  DeepDiveStudy: undefined;
};

export type TabParamList = {
  Home: undefined;
  Stations: undefined;
  Library: undefined;
  Modes: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home";

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Stations") {
            iconName = focused ? "radio" : "radio-outline";
          } else if (route.name === "Library") {
            iconName = focused ? "library" : "library-outline";
          } else if (route.name === "Modes") {
            iconName = focused ? "moon" : "moon-outline";
          } else if (route.name === "Settings") {
            iconName = focused ? "settings" : "settings-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#6366f1",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          backgroundColor: "#0a0a0a",
          borderTopColor: "#1f2937",
          borderTopWidth: 0.5,
          paddingTop: 8,
          height: 88,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
          marginTop: 4,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Stations" component={StationsScreen} />
      <Tab.Screen name="Library" component={LibraryScreen} />
      <Tab.Screen name="Modes" component={ModesScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const hasCompletedOnboarding = usePreferencesStore(s => s.hasCompletedOnboarding);

  return (
    <Stack.Navigator
      initialRouteName={hasCompletedOnboarding ? "MainTabs" : "Onboarding"}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0a0a0a" },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen
        name="CreatePlaylist"
        component={CreatePlaylistScreen}
        options={{ presentation: "modal" }}
      />
      <Stack.Screen
        name="PromptPlaylist"
        component={PromptPlaylistScreen}
        options={{ presentation: "modal" }}
      />
      <Stack.Screen name="PlaylistDetail" component={PlaylistDetailScreen} />
      <Stack.Screen
        name="ListenMode"
        component={ListenModeScreen}
        options={{
          gestureEnabled: false,
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="ReadMode"
        component={ReadModeScreen}
        options={{
          gestureEnabled: false,
          animation: "fade",
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ presentation: "modal" }}
      />
      <Stack.Screen
        name="Modes"
        component={ModesScreen}
        options={{ presentation: "modal" }}
      />
      <Stack.Screen
        name="EditPlaylist"
        component={EditPlaylistScreen}
        options={{ presentation: "modal" }}
      />
      <Stack.Screen
        name="DeepDiveStudy"
        component={DeepDiveStudyScreen}
        options={{ presentation: "modal" }}
      />
    </Stack.Navigator>
  );
}
