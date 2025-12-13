import React, { useState, useRef } from "react";
import { View, Text, Pressable, Dimensions, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import PagerView from "react-native-pager-view";

import { RootStackParamList } from "../navigation/RootNavigator";
import { usePreferencesStore } from "../state/preferencesStore";
import { Translation, ConsumptionMode, PlaybackSpeed } from "../types/bible";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get("window");

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const pagerRef = useRef<PagerView>(null);

  const [currentPage, setCurrentPage] = useState(0);

  const setDefaultTranslation = usePreferencesStore((s) => s.setDefaultTranslation);
  const setDefaultConsumptionMode = usePreferencesStore((s) => s.setDefaultConsumptionMode);
  const setPlaybackSpeed = usePreferencesStore((s) => s.setPlaybackSpeed);
  const setDefaultPlaylistLength = usePreferencesStore((s) => s.setDefaultPlaylistLength);
  const setHasCompletedOnboarding = usePreferencesStore((s) => s.setHasCompletedOnboarding);

  const defaultTranslation = usePreferencesStore((s) => s.defaultTranslation);
  const defaultConsumptionMode = usePreferencesStore((s) => s.defaultConsumptionMode);
  const playbackSpeed = usePreferencesStore((s) => s.playbackSpeed);
  const defaultPlaylistLength = usePreferencesStore((s) => s.defaultPlaylistLength);

  const totalPages = 5;

  const goToNext = () => {
    if (currentPage < totalPages - 1) {
      pagerRef.current?.setPage(currentPage + 1);
    } else {
      completeOnboarding();
    }
  };

  const completeOnboarding = () => {
    setHasCompletedOnboarding(true);
    navigation.reset({
      index: 0,
      routes: [{ name: "MainTabs" }],
    });
  };

  const translationOptions: { value: Translation; label: string; desc: string }[] = [
    { value: "KJV", label: "King James Version", desc: "Classic, poetic language" },
    { value: "NIV", label: "New International Version", desc: "Modern, readable translation" },
  ];

  const modeOptions: { value: ConsumptionMode; label: string; icon: keyof typeof Ionicons.glyphMap; desc: string }[] = [
    { value: "listen", label: "Listen", icon: "headset", desc: "Audio playback with AI voice" },
    { value: "read", label: "Read", icon: "book", desc: "Swipeable reading cards" },
  ];

  const speedOptions: PlaybackSpeed[] = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

  const lengthOptions = [10, 15, 20, 30, 45, 60];

  return (
    <View className="flex-1 bg-neutral-950">
      <LinearGradient
        colors={["#6366f1", "#0a0a0a"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 300 }}
      />

      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
      >
        {/* Welcome Page */}
        <View key="0" className="flex-1 px-6" style={{ paddingTop: insets.top + 60 }}>
          <View className="items-center mb-8">
            <View className="w-24 h-24 rounded-full bg-white/10 items-center justify-center mb-6">
              <Ionicons name="book" size={48} color="white" />
            </View>
            <Text className="text-white text-3xl font-bold text-center">
              Scripture Playlist
            </Text>
            <Text className="text-white/70 text-lg text-center mt-3 px-4">
              Listen to or read Scripture playlists curated for your journey
            </Text>
          </View>

          <View className="bg-neutral-900/80 rounded-2xl p-5 mt-4">
            <View className="flex-row items-center mb-4">
              <Ionicons name="sparkles" size={24} color="#6366f1" />
              <Text className="text-white font-semibold text-lg ml-3">
                AI-Powered Playlists
              </Text>
            </View>
            <Text className="text-neutral-300 leading-6">
              Tell us what you need - peace, encouragement, wisdom - and we will create a personalized Scripture playlist for you.
            </Text>
          </View>

          <View className="bg-neutral-900/80 rounded-2xl p-5 mt-3">
            <View className="flex-row items-center mb-4">
              <Ionicons name="headset" size={24} color="#6366f1" />
              <Text className="text-white font-semibold text-lg ml-3">
                Listen or Read
              </Text>
            </View>
            <Text className="text-neutral-300 leading-6">
              Switch between audio playback with natural AI voices or beautiful reading cards - same playlist, your choice.
            </Text>
          </View>
        </View>

        {/* Translation Selection */}
        <View key="1" className="flex-1 px-6" style={{ paddingTop: insets.top + 60 }}>
          <Text className="text-white text-2xl font-bold text-center mb-2">
            Choose Your Translation
          </Text>
          <Text className="text-neutral-400 text-center mb-8">
            Select your preferred Bible translation
          </Text>

          {translationOptions.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => setDefaultTranslation(option.value)}
              className={`rounded-xl p-5 mb-3 border-2 ${
                defaultTranslation === option.value
                  ? "bg-indigo-500/20 border-indigo-500"
                  : "bg-neutral-900 border-transparent"
              }`}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-white font-semibold text-lg">
                    {option.label}
                  </Text>
                  <Text className="text-neutral-400 mt-1">{option.desc}</Text>
                </View>
                {defaultTranslation === option.value && (
                  <Ionicons name="checkmark-circle" size={28} color="#6366f1" />
                )}
              </View>
            </Pressable>
          ))}
        </View>

        {/* Consumption Mode */}
        <View key="2" className="flex-1 px-6" style={{ paddingTop: insets.top + 60 }}>
          <Text className="text-white text-2xl font-bold text-center mb-2">
            How Do You Prefer Scripture?
          </Text>
          <Text className="text-neutral-400 text-center mb-8">
            Choose your default experience
          </Text>

          {modeOptions.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => setDefaultConsumptionMode(option.value)}
              className={`rounded-xl p-5 mb-3 border-2 ${
                defaultConsumptionMode === option.value
                  ? "bg-indigo-500/20 border-indigo-500"
                  : "bg-neutral-900 border-transparent"
              }`}
            >
              <View className="flex-row items-center">
                <View className="w-14 h-14 rounded-full bg-indigo-500/20 items-center justify-center mr-4">
                  <Ionicons name={option.icon} size={28} color="#6366f1" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-semibold text-lg">
                    {option.label}
                  </Text>
                  <Text className="text-neutral-400 mt-1">{option.desc}</Text>
                </View>
                {defaultConsumptionMode === option.value && (
                  <Ionicons name="checkmark-circle" size={28} color="#6366f1" />
                )}
              </View>
            </Pressable>
          ))}
        </View>

        {/* Playback Speed */}
        <View key="3" className="flex-1 px-6" style={{ paddingTop: insets.top + 60 }}>
          <Text className="text-white text-2xl font-bold text-center mb-2">
            Playback Speed
          </Text>
          <Text className="text-neutral-400 text-center mb-8">
            Choose your preferred listening speed
          </Text>

          <View className="flex-row flex-wrap justify-center gap-3">
            {speedOptions.map((speed) => (
              <Pressable
                key={speed}
                onPress={() => setPlaybackSpeed(speed)}
                className={`w-20 h-20 rounded-xl items-center justify-center ${
                  playbackSpeed === speed
                    ? "bg-indigo-500"
                    : "bg-neutral-900"
                }`}
              >
                <Text className={`text-lg font-semibold ${
                  playbackSpeed === speed ? "text-white" : "text-neutral-300"
                }`}>
                  {speed}x
                </Text>
              </Pressable>
            ))}
          </View>

          <Text className="text-neutral-500 text-center mt-6">
            You can always change this in settings
          </Text>
        </View>

        {/* Playlist Length */}
        <View key="4" className="flex-1 px-6" style={{ paddingTop: insets.top + 60 }}>
          <Text className="text-white text-2xl font-bold text-center mb-2">
            Default Playlist Length
          </Text>
          <Text className="text-neutral-400 text-center mb-8">
            How long do you typically want to listen?
          </Text>

          <View className="flex-row flex-wrap justify-center gap-3">
            {lengthOptions.map((length) => (
              <Pressable
                key={length}
                onPress={() => setDefaultPlaylistLength(length)}
                className={`px-6 py-4 rounded-xl items-center justify-center ${
                  defaultPlaylistLength === length
                    ? "bg-indigo-500"
                    : "bg-neutral-900"
                }`}
              >
                <Text className={`text-lg font-semibold ${
                  defaultPlaylistLength === length ? "text-white" : "text-neutral-300"
                }`}>
                  {length} min
                </Text>
              </Pressable>
            ))}
          </View>

          <Text className="text-neutral-500 text-center mt-6">
            Perfect for commutes, bedtime, or breaks
          </Text>
        </View>
      </PagerView>

      {/* Navigation */}
      <View
        className="px-6 pb-4"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        {/* Progress dots */}
        <View className="flex-row justify-center mb-6 gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <View
              key={i}
              className={`h-2 rounded-full ${
                i === currentPage
                  ? "w-6 bg-indigo-500"
                  : "w-2 bg-neutral-700"
              }`}
            />
          ))}
        </View>

        <View className="flex-row gap-3">
          {currentPage > 0 && (
            <Pressable
              onPress={() => pagerRef.current?.setPage(currentPage - 1)}
              className="flex-1 bg-neutral-800 rounded-xl py-4 items-center"
            >
              <Text className="text-white font-semibold text-lg">Back</Text>
            </Pressable>
          )}
          <Pressable
            onPress={goToNext}
            className="flex-1 bg-indigo-500 rounded-xl py-4 items-center"
          >
            <Text className="text-white font-semibold text-lg">
              {currentPage === totalPages - 1 ? "Get Started" : "Continue"}
            </Text>
          </Pressable>
        </View>

        {currentPage === 0 && (
          <Pressable onPress={completeOnboarding} className="mt-4 py-2">
            <Text className="text-neutral-500 text-center">
              Skip setup for now
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
