import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { RootStackParamList } from "../navigation/RootNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ModeConfig {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: readonly [string, string, ...string[]];
  description: string;
  features: string[];
  defaultLength: number;
  topics: string[];
}

const modes: ModeConfig[] = [
  {
    id: "bedtime",
    title: "Bedtime",
    subtitle: "Wind down with peace",
    icon: "moon",
    colors: ["#6366f1", "#4f46e5"] as const,
    description: "Calmer voice pacing with longer pauses, perfect for drifting off to sleep with Scripture.",
    features: [
      "Slower, calmer voice",
      "Longer pauses between verses",
      "Auto sleep timer suggestion",
      "Peaceful passage selection",
    ],
    defaultLength: 20,
    topics: ["peace", "rest", "trust", "comfort"],
  },
  {
    id: "commute",
    title: "Commute",
    subtitle: "Scripture on the go",
    icon: "car",
    colors: ["#f59e0b", "#d97706"] as const,
    description: "Optimized for listening while driving or commuting with clear, engaging delivery.",
    features: [
      "Standard to slightly faster pace",
      "Minimal announcements",
      "15-30 minute playlists",
      "Engaging, focused passages",
    ],
    defaultLength: 20,
    topics: ["wisdom", "faith", "strength", "guidance"],
  },
  {
    id: "study",
    title: "Study",
    subtitle: "Deep dive into the Word",
    icon: "book",
    colors: ["#10b981", "#059669"] as const,
    description: "Perfect for memorization and deep study with verse numbers and clear pronunciation.",
    features: [
      "Verse numbers spoken",
      "Shorter pauses for focus",
      "Key verse repetition option",
      "Clear enunciation",
    ],
    defaultLength: 30,
    topics: ["doctrine", "teaching", "wisdom", "understanding"],
  },
  {
    id: "prayer",
    title: "Prayer Loop",
    subtitle: "Meditate on Scripture",
    icon: "heart",
    colors: ["#ec4899", "#db2777"] as const,
    description: "Loop selected passages for extended prayer and meditation sessions.",
    features: [
      "Continuous loop playback",
      "Silent pauses between loops",
      "3-10 passage selection",
      "Set duration timer",
    ],
    defaultLength: 15,
    topics: ["prayer", "worship", "gratitude", "surrender"],
  },
];

export default function ModesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  const handleModeSelect = (mode: ModeConfig) => {
    navigation.navigate("PromptPlaylist", { mode: mode.id });
  };

  return (
    <View className="flex-1 bg-neutral-950">
      <View style={{ paddingTop: insets.top + 8 }} className="px-5 pb-4">
        <Text className="text-white text-3xl font-bold">Modes</Text>
        <Text className="text-neutral-400 text-base mt-1">
          Pre-built listening experiences
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {modes.map((mode) => (
          <Pressable
            key={mode.id}
            onPress={() => handleModeSelect(mode)}
            className="mb-4 overflow-hidden rounded-2xl active:opacity-90"
          >
            <LinearGradient
              colors={mode.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 20 }}
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <View className="flex-row items-center mb-2">
                    <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center mr-3">
                      <Ionicons name={mode.icon} size={24} color="white" />
                    </View>
                    <View>
                      <Text className="text-white text-xl font-bold">
                        {mode.title}
                      </Text>
                      <Text className="text-white/70 text-sm">
                        {mode.subtitle}
                      </Text>
                    </View>
                  </View>

                  <Text className="text-white/80 text-sm mt-3 leading-5">
                    {mode.description}
                  </Text>

                  <View className="mt-4">
                    {mode.features.slice(0, 3).map((feature, index) => (
                      <View key={index} className="flex-row items-center mt-1.5">
                        <Ionicons name="checkmark-circle" size={16} color="rgba(255,255,255,0.7)" />
                        <Text className="text-white/70 text-sm ml-2">{feature}</Text>
                      </View>
                    ))}
                  </View>

                  <View className="flex-row items-center mt-4 flex-wrap gap-2">
                    {mode.topics.map((topic) => (
                      <View key={topic} className="bg-white/20 px-3 py-1 rounded-full">
                        <Text className="text-white/90 text-xs">{topic}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View className="ml-3">
                  <View className="bg-white/20 px-3 py-1.5 rounded-full">
                    <Text className="text-white text-sm font-medium">
                      {mode.defaultLength} min
                    </Text>
                  </View>
                </View>
              </View>

              <View className="flex-row items-center justify-between mt-5 pt-4 border-t border-white/20">
                <Text className="text-white/70 text-sm">
                  Create playlist with this mode
                </Text>
                <View className="bg-white/20 w-10 h-10 rounded-full items-center justify-center">
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </View>
              </View>
            </LinearGradient>
          </Pressable>
        ))}

        {/* Custom Mode Coming Soon */}
        <View className="bg-neutral-900 rounded-2xl p-5 border border-dashed border-neutral-700">
          <View className="flex-row items-center mb-3">
            <View className="w-12 h-12 rounded-full bg-neutral-800 items-center justify-center mr-3">
              <Ionicons name="add" size={24} color="#6b7280" />
            </View>
            <View>
              <Text className="text-neutral-400 text-lg font-semibold">
                Custom Mode
              </Text>
              <Text className="text-neutral-500 text-sm">
                Create your own experience
              </Text>
            </View>
          </View>
          <Text className="text-neutral-500 text-sm">
            Save your preferred settings as a custom mode for quick access. Coming soon.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
