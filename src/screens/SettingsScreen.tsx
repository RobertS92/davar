import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Switch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { RootStackParamList } from "../navigation/RootNavigator";
import { usePreferencesStore } from "../state/preferencesStore";
import { usePlaylistStore } from "../state/playlistStore";
import { Translation, PlaybackSpeed, PauseStyle } from "../types/bible";
import { VOICE_OPTIONS, TTSVoice } from "../services/ttsService";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  const preferences = usePreferencesStore();
  const playlists = usePlaylistStore((s) => s.playlists);

  const [showTranslationPicker, setShowTranslationPicker] = useState(false);
  const [showSpeedPicker, setShowSpeedPicker] = useState(false);
  const [showPausePicker, setShowPausePicker] = useState(false);
  const [showVoicePicker, setShowVoicePicker] = useState(false);

  // Only show NIV if API key is configured
  const bibleApiKey = process.env.EXPO_PUBLIC_BIBLE_API_KEY;
  const translations: { value: Translation; label: string }[] = bibleApiKey
    ? [
        { value: "KJV", label: "King James Version" },
        { value: "NIV", label: "New International Version" },
      ]
    : [{ value: "KJV", label: "King James Version" }];

  const speeds: PlaybackSpeed[] = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

  const pauses: { value: PauseStyle; label: string }[] = [
    { value: "short", label: "Short pauses" },
    { value: "medium", label: "Medium pauses" },
    { value: "long", label: "Long pauses" },
  ];

  const currentVoice = VOICE_OPTIONS.find((v) => v.id === preferences.defaultVoice) || VOICE_OPTIONS[4];

  const renderPickerModal = (
    visible: boolean,
    onClose: () => void,
    title: string,
    children: React.ReactNode
  ) => {
    if (!visible) return null;

    return (
      <Pressable
        onPress={onClose}
        className="absolute inset-0 bg-black/60 z-50 items-center justify-end"
        style={{ paddingBottom: insets.bottom + 20 }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="bg-neutral-900 rounded-2xl w-[90%] max-h-[60%] overflow-hidden"
        >
          <View className="flex-row items-center justify-between p-4 border-b border-neutral-800">
            <Text className="text-white font-semibold text-lg">{title}</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#9ca3af" />
            </Pressable>
          </View>
          <ScrollView className="p-4">{children}</ScrollView>
        </Pressable>
      </Pressable>
    );
  };

  const SettingRow = ({
    icon,
    title,
    value,
    subtitle,
    onPress,
    showChevron = true,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    value?: string;
    subtitle?: string;
    onPress?: () => void;
    showChevron?: boolean;
  }) => (
    <Pressable
      onPress={onPress}
      className="flex-row items-center py-4 border-b border-neutral-800 active:opacity-70"
    >
      <View className="w-10 h-10 rounded-lg bg-neutral-800 items-center justify-center mr-3">
        <Ionicons name={icon} size={20} color="#6366f1" />
      </View>
      <View className="flex-1">
        <Text className="text-white text-base">{title}</Text>
        {subtitle && <Text className="text-neutral-500 text-sm mt-0.5">{subtitle}</Text>}
      </View>
      {value && <Text className="text-neutral-400 mr-2">{value}</Text>}
      {showChevron && <Ionicons name="chevron-forward" size={20} color="#6b7280" />}
    </Pressable>
  );

  const SettingToggle = ({
    icon,
    title,
    subtitle,
    value,
    onValueChange,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    value: boolean;
    onValueChange: (val: boolean) => void;
  }) => (
    <View className="flex-row items-center py-4 border-b border-neutral-800">
      <View className="w-10 h-10 rounded-lg bg-neutral-800 items-center justify-center mr-3">
        <Ionicons name={icon} size={20} color="#6366f1" />
      </View>
      <View className="flex-1">
        <Text className="text-white text-base">{title}</Text>
        {subtitle && <Text className="text-neutral-500 text-sm mt-0.5">{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#374151", true: "#6366f1" }}
        thumbColor="white"
      />
    </View>
  );

  return (
    <View className="flex-1 bg-neutral-950">
      <View style={{ paddingTop: insets.top + 8 }} className="px-5 pb-4">
        <Text className="text-white text-3xl font-bold">Settings</Text>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Voice Settings */}
        <Text className="text-neutral-400 text-sm font-medium uppercase tracking-wider mb-2 mt-4">
          AI Voice
        </Text>
        <View className="bg-neutral-900 rounded-xl px-4">
          <SettingRow
            icon="mic"
            title="Voice"
            value={currentVoice.name}
            subtitle={`${currentVoice.gender} • ${currentVoice.style}`}
            onPress={() => setShowVoicePicker(true)}
          />
        </View>

        {/* Playback Settings */}
        <Text className="text-neutral-400 text-sm font-medium uppercase tracking-wider mb-2 mt-6">
          Playback
        </Text>
        <View className="bg-neutral-900 rounded-xl px-4">
          <SettingRow
            icon="language"
            title="Default Translation"
            value={preferences.defaultTranslation}
            subtitle={preferences.defaultTranslation === "NIV" ? "Requires internet connection" : undefined}
            onPress={() => setShowTranslationPicker(true)}
          />
          <SettingRow
            icon="speedometer"
            title="Playback Speed"
            value={`${preferences.playbackSpeed}x`}
            onPress={() => setShowSpeedPicker(true)}
          />
          <SettingRow
            icon="pause"
            title="Pause Style"
            value={preferences.pauseStyle.charAt(0).toUpperCase() + preferences.pauseStyle.slice(1)}
            onPress={() => setShowPausePicker(true)}
          />
        </View>

        {/* Audio Announcements */}
        <Text className="text-neutral-400 text-sm font-medium uppercase tracking-wider mb-2 mt-6">
          Audio Announcements
        </Text>
        <View className="bg-neutral-900 rounded-xl px-4">
          <SettingToggle
            icon="list-outline"
            title="Speak Verse Numbers"
            subtitle="Read verse numbers aloud"
            value={preferences.speakVerseNumbers}
            onValueChange={preferences.setSpeakVerseNumbers}
          />
          <SettingToggle
            icon="bookmark-outline"
            title="Announce Book & Chapter"
            subtitle="Announce when starting new sections"
            value={preferences.announceBookChapter}
            onValueChange={preferences.setAnnounceBookChapter}
          />
        </View>

        {/* Reading Settings */}
        <Text className="text-neutral-400 text-sm font-medium uppercase tracking-wider mb-2 mt-6">
          Reading
        </Text>
        <View className="bg-neutral-900 rounded-xl px-4">
          <SettingRow
            icon="text"
            title="Text Size"
            value={`${preferences.textSize}pt`}
            onPress={() => {
              const sizes = [14, 16, 18, 20, 22, 24, 28];
              const currentIndex = sizes.indexOf(preferences.textSize);
              const nextIndex = (currentIndex + 1) % sizes.length;
              preferences.setTextSize(sizes[nextIndex]);
            }}
          />
          <SettingToggle
            icon="moon"
            title="Night Mode"
            value={preferences.nightMode}
            onValueChange={preferences.setNightMode}
          />
          <SettingToggle
            icon="list"
            title="Show Verse Numbers"
            subtitle="Display verse numbers while reading"
            value={preferences.showVerseNumbersInRead}
            onValueChange={preferences.setShowVerseNumbersInRead}
          />
        </View>

        {/* App Info */}
        <Text className="text-neutral-400 text-sm font-medium uppercase tracking-wider mb-2 mt-6">
          App
        </Text>
        <View className="bg-neutral-900 rounded-xl px-4">
          <View className="flex-row items-center py-4 border-b border-neutral-800">
            <View className="w-10 h-10 rounded-lg bg-neutral-800 items-center justify-center mr-3">
              <Ionicons name="library" size={20} color="#6366f1" />
            </View>
            <Text className="flex-1 text-white text-base">Saved Playlists</Text>
            <Text className="text-neutral-400">{playlists.length}</Text>
          </View>
          <Pressable
            onPress={() => {
              preferences.setHasCompletedOnboarding(false);
              navigation.reset({
                index: 0,
                routes: [{ name: "Onboarding" }],
              });
            }}
            className="flex-row items-center py-4"
          >
            <View className="w-10 h-10 rounded-lg bg-neutral-800 items-center justify-center mr-3">
              <Ionicons name="refresh" size={20} color="#6366f1" />
            </View>
            <Text className="flex-1 text-white text-base">Restart Onboarding</Text>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </Pressable>
        </View>
      </ScrollView>

      {/* Voice Picker */}
      {renderPickerModal(
        showVoicePicker,
        () => setShowVoicePicker(false),
        "Select AI Voice",
        VOICE_OPTIONS.map((voice) => (
          <Pressable
            key={voice.id}
            onPress={() => {
              preferences.setDefaultVoice(voice.id);
              setShowVoicePicker(false);
            }}
            className={`p-4 rounded-xl mb-2 ${
              preferences.defaultVoice === voice.id
                ? "bg-indigo-500/20 border border-indigo-500"
                : "bg-neutral-800"
            }`}
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white font-medium">{voice.name}</Text>
                <Text className="text-neutral-400 text-sm mt-0.5">
                  {voice.gender} • {voice.style}
                </Text>
              </View>
              {preferences.defaultVoice === voice.id && (
                <Ionicons name="checkmark-circle" size={24} color="#6366f1" />
              )}
            </View>
          </Pressable>
        ))
      )}

      {/* Translation Picker */}
      {renderPickerModal(
        showTranslationPicker,
        () => setShowTranslationPicker(false),
        "Select Translation",
        translations.map((t) => (
          <Pressable
            key={t.value}
            onPress={() => {
              preferences.setDefaultTranslation(t.value);
              setShowTranslationPicker(false);
            }}
            className={`p-4 rounded-xl mb-2 ${
              preferences.defaultTranslation === t.value
                ? "bg-indigo-500/20 border border-indigo-500"
                : "bg-neutral-800"
            }`}
          >
            <Text className="text-white font-medium">{t.label}</Text>
            {t.value === "NIV" && (
              <Text className="text-neutral-400 text-sm mt-1">Requires internet connection</Text>
            )}
          </Pressable>
        ))
      )}

      {/* Speed Picker */}
      {renderPickerModal(
        showSpeedPicker,
        () => setShowSpeedPicker(false),
        "Select Speed",
        <View className="flex-row flex-wrap gap-3">
          {speeds.map((speed) => (
            <Pressable
              key={speed}
              onPress={() => {
                preferences.setPlaybackSpeed(speed);
                setShowSpeedPicker(false);
              }}
              className={`px-6 py-4 rounded-xl ${
                preferences.playbackSpeed === speed
                  ? "bg-indigo-500"
                  : "bg-neutral-800"
              }`}
            >
              <Text className="text-white font-medium">{speed}x</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Pause Picker */}
      {renderPickerModal(
        showPausePicker,
        () => setShowPausePicker(false),
        "Select Pause Style",
        pauses.map((p) => (
          <Pressable
            key={p.value}
            onPress={() => {
              preferences.setPauseStyle(p.value);
              setShowPausePicker(false);
            }}
            className={`p-4 rounded-xl mb-2 ${
              preferences.pauseStyle === p.value
                ? "bg-indigo-500/20 border border-indigo-500"
                : "bg-neutral-800"
            }`}
          >
            <Text className="text-white font-medium">{p.label}</Text>
          </Pressable>
        ))
      )}
    </View>
  );
}
