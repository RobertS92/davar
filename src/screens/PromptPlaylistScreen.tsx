import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { RootStackParamList } from "../navigation/RootNavigator";
import { usePlaylistStore } from "../state/playlistStore";
import { usePreferencesStore } from "../state/preferencesStore";
import { generatePlaylistWithAI } from "../services/playlistGenerator";
import { compilePlaylist } from "../services/playlistCompiler";
import { parseReferences } from "../services/bibleParser";
import { Translation, PlaylistTone, GeneratedPlaylistPlan } from "../types/bible";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, "PromptPlaylist">;

const toneOptions: { value: PlaylistTone; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: "comfort", label: "Comfort", icon: "heart" },
  { value: "wisdom", label: "Wisdom", icon: "bulb" },
  { value: "faith", label: "Faith", icon: "flame" },
  { value: "endurance", label: "Endurance", icon: "fitness" },
  { value: "correction", label: "Correction", icon: "alert-circle" },
  { value: "repentance", label: "Repentance", icon: "refresh" },
  { value: "gratitude", label: "Gratitude", icon: "sunny" },
];

const lengthOptions = [5, 10, 15, 20, 30, 45, 60];

// Biblical prayers - no AI generation needed for prayer mode
const BIBLICAL_PRAYERS: GeneratedPlaylistPlan = {
  title: "Prayers from Scripture",
  references: [
    "Matthew 6:9-13", // The Lord's Prayer
    "Luke 11:2-4", // The Lord's Prayer (Luke's version)
    "Psalm 23", // The Lord is my Shepherd
    "Psalm 51", // David's prayer of repentance
    "Psalm 63", // David's prayer of longing for God
    "Psalm 91", // Prayer of protection
    "Psalm 139:1-18", // David's prayer of wonder
    "1 Chronicles 29:10-13", // David's prayer of praise
    "2 Chronicles 20:6-12", // Jehoshaphat's prayer
    "Daniel 9:4-19", // Daniel's prayer of confession
    "1 Samuel 2:1-10", // Hannah's prayer of thanksgiving
    "John 17:1-26", // Jesus' High Priestly Prayer
    "Ephesians 3:14-21", // Paul's prayer for the church
    "Colossians 1:9-14", // Paul's prayer for spiritual wisdom
    "Philippians 1:9-11", // Paul's prayer for love
  ],
  explanation: [
    "The Lord's Prayer - Jesus taught His disciples how to pray",
    "Psalms of David - heartfelt prayers of worship, repentance, and trust",
    "Prayers of faith - Daniel, Hannah, and Jehoshaphat crying out to God",
    "Apostolic prayers - Paul and Jesus praying for believers",
  ],
};

export default function PromptPlaylistScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();

  const addPlaylist = usePlaylistStore((s) => s.addPlaylist);
  const defaultTranslation = usePreferencesStore((s) => s.defaultTranslation);
  const defaultPlaylistLength = usePreferencesStore((s) => s.defaultPlaylistLength);

  const [prompt, setPrompt] = useState("");
  const [translation, setTranslation] = useState<Translation>(defaultTranslation);
  const [targetLength, setTargetLength] = useState(defaultPlaylistLength);
  const [selectedTones, setSelectedTones] = useState<PlaylistTone[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlaylistPlan | null>(null);
  const [step, setStep] = useState<"input" | "review">("input");

  const mode = route.params?.mode;

  const getModeDefaults = () => {
    switch (mode) {
      case "bedtime":
        return { tones: ["comfort" as PlaylistTone], length: 20, promptHint: "peaceful passages for sleep" };
      case "commute":
        return { tones: ["wisdom" as PlaylistTone, "faith" as PlaylistTone], length: 20, promptHint: "engaging passages for my commute" };
      case "study":
        return { tones: ["wisdom" as PlaylistTone], length: 30, promptHint: "passages for deep study" };
      case "prayer":
        return { tones: ["gratitude" as PlaylistTone], length: 15, promptHint: "passages for prayer and meditation" };
      default:
        return null;
    }
  };

  React.useEffect(() => {
    const defaults = getModeDefaults();
    if (defaults) {
      setSelectedTones(defaults.tones);
      setTargetLength(defaults.length);
    }
    // For prayer mode, skip to review with biblical prayers
    if (mode === "prayer") {
      setGeneratedPlan(BIBLICAL_PRAYERS);
      setStep("review");
    }
  }, [mode]);

  const toggleTone = (tone: PlaylistTone) => {
    setSelectedTones((prev) =>
      prev.includes(tone)
        ? prev.filter((t) => t !== tone)
        : [...prev, tone]
    );
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please describe what kind of Scripture you need");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const plan = await generatePlaylistWithAI({
        prompt: prompt.trim(),
        targetLength,
        tones: selectedTones,
        translation,
      });

      setGeneratedPlan(plan);
      setStep("review");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setError("Failed to generate playlist. Please try again.");
      console.log("Generate error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFromPlan = async () => {
    if (!generatedPlan) return;

    setIsLoading(true);
    setError(null);

    try {
      const parsed = parseReferences(generatedPlan.references.join("\n"));

      if (parsed.errors.length > 0) {
        setError("Some references could not be parsed: " + parsed.errors.join(", "));
        setIsLoading(false);
        return;
      }

      const playlist = await compilePlaylist({
        title: generatedPlan.title,
        references: parsed.references,
        translation,
        sourceType: "prompt",
        promptUsed: prompt,
        tags: selectedTones,
      });

      addPlaylist(playlist);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      navigation.replace("PlaylistDetail", { playlistId: playlist.id });
    } catch (err) {
      setError("Failed to create playlist. Please try again.");
      console.log("Create from plan error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    setGeneratedPlan(null);
    setStep("input");
  };

  if (step === "review" && generatedPlan) {
    const isPrayerMode = mode === "prayer";

    return (
      <View className="flex-1 bg-neutral-950">
        {/* Header */}
        <View
          style={{ paddingTop: insets.top + 8 }}
          className="px-5 pb-4 flex-row items-center justify-between border-b border-neutral-800"
        >
          <Pressable onPress={isPrayerMode ? () => navigation.goBack() : handleRegenerate} hitSlop={8}>
            <Ionicons name={isPrayerMode ? "close" : "arrow-back"} size={24} color="#9ca3af" />
          </Pressable>
          <Text className="text-white text-lg font-semibold">
            {isPrayerMode ? "Biblical Prayers" : "Review Playlist"}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Generated Title */}
          <View className="mt-6">
            <Text className="text-indigo-400 text-sm font-medium uppercase tracking-wider mb-2">
              Playlist Title
            </Text>
            <Text className="text-white text-2xl font-bold">
              {generatedPlan.title}
            </Text>
          </View>

          {/* Explanation */}
          <View className="mt-6 bg-indigo-500/10 rounded-xl p-4">
            <Text className="text-indigo-300 font-medium mb-2">Why these passages:</Text>
            {generatedPlan.explanation.map((point, index) => (
              <View key={index} className="flex-row items-start mt-1">
                <Text className="text-indigo-400 mr-2">•</Text>
                <Text className="text-indigo-200 flex-1">{point}</Text>
              </View>
            ))}
          </View>

          {/* References */}
          <View className="mt-6">
            <Text className="text-white font-medium mb-3">
              Passages ({generatedPlan.references.length})
            </Text>
            {generatedPlan.references.map((ref, index) => (
              <View
                key={index}
                className="bg-neutral-900 rounded-xl p-4 mb-2 flex-row items-center"
              >
                <View className="w-8 h-8 rounded-full bg-indigo-500/20 items-center justify-center mr-3">
                  <Text className="text-indigo-400 font-medium">{index + 1}</Text>
                </View>
                <Text className="text-white flex-1">{ref}</Text>
              </View>
            ))}
          </View>

          {error && (
            <View className="mt-4 bg-red-500/20 rounded-xl p-4">
              <Text className="text-red-400">{error}</Text>
            </View>
          )}
        </ScrollView>

        {/* Actions */}
        <View
          className="px-5 py-4 border-t border-neutral-800"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          {isPrayerMode ? (
            <Pressable
              onPress={handleCreateFromPlan}
              disabled={isLoading}
              className={`py-4 rounded-xl items-center ${
                isLoading ? "bg-indigo-500/50" : "bg-indigo-500"
              }`}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-lg">Create Prayer Playlist</Text>
              )}
            </Pressable>
          ) : (
            <View className="flex-row gap-3">
              <Pressable
                onPress={handleRegenerate}
                className="flex-1 py-4 rounded-xl items-center bg-neutral-800"
              >
                <Text className="text-white font-semibold">Regenerate</Text>
              </Pressable>
              <Pressable
                onPress={handleCreateFromPlan}
                disabled={isLoading}
                className={`flex-1 py-4 rounded-xl items-center ${
                  isLoading ? "bg-indigo-500/50" : "bg-indigo-500"
                }`}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold">Create</Text>
                )}
              </Pressable>
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-950">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="px-5 pb-4 flex-row items-center justify-between border-b border-neutral-800"
      >
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="close" size={28} color="#9ca3af" />
        </Pressable>
        <Text className="text-white text-lg font-semibold">
          {mode ? `${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode` : "AI Playlist"}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Prompt Input */}
          <View className="mt-6">
            <Text className="text-white font-medium mb-2">What do you need?</Text>
            <Text className="text-neutral-500 text-sm mb-3">
              Describe what you are going through or what you want to hear
            </Text>
            <TextInput
              value={prompt}
              onChangeText={(text) => {
                setPrompt(text);
                setError(null);
              }}
              placeholder={getModeDefaults()?.promptHint || "I need peace and comfort during a difficult time..."}
              placeholderTextColor="#6b7280"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="bg-neutral-900 rounded-xl px-4 py-4 text-white text-base min-h-[120px]"
            />
          </View>

          {/* Length Selection */}
          <View className="mt-6">
            <Text className="text-white font-medium mb-3">Playlist Length</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {lengthOptions.map((length) => (
                <Pressable
                  key={length}
                  onPress={() => setTargetLength(length)}
                  className={`px-5 py-3 rounded-xl ${
                    targetLength === length
                      ? "bg-indigo-500"
                      : "bg-neutral-900"
                  }`}
                >
                  <Text className={`font-medium ${
                    targetLength === length ? "text-white" : "text-neutral-400"
                  }`}>
                    {length} min
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Tone Selection */}
          <View className="mt-6">
            <Text className="text-white font-medium mb-3">Tone (optional)</Text>
            <View className="flex-row flex-wrap gap-2">
              {toneOptions.map((tone) => (
                <Pressable
                  key={tone.value}
                  onPress={() => toggleTone(tone.value)}
                  className={`flex-row items-center px-4 py-2 rounded-full ${
                    selectedTones.includes(tone.value)
                      ? "bg-indigo-500"
                      : "bg-neutral-900"
                  }`}
                >
                  <Ionicons
                    name={tone.icon}
                    size={16}
                    color={selectedTones.includes(tone.value) ? "white" : "#9ca3af"}
                  />
                  <Text className={`ml-2 ${
                    selectedTones.includes(tone.value) ? "text-white" : "text-neutral-400"
                  }`}>
                    {tone.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Translation */}
          <View className="mt-6">
            <Text className="text-white font-medium mb-3">Translation</Text>
            <View className="flex-row gap-3">
              {(["KJV", "NIV"] as Translation[]).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setTranslation(t)}
                  className={`flex-1 py-3 rounded-xl items-center ${
                    translation === t
                      ? "bg-indigo-500"
                      : "bg-neutral-900"
                  }`}
                >
                  <Text className={`font-medium ${
                    translation === t ? "text-white" : "text-neutral-400"
                  }`}>
                    {t}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Error Message */}
          {error && (
            <View className="mt-4 bg-red-500/20 rounded-xl p-4">
              <Text className="text-red-400">{error}</Text>
            </View>
          )}
        </ScrollView>

        {/* Generate Button */}
        <View
          className="px-5 py-4 border-t border-neutral-800"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <Pressable
            onPress={handleGenerate}
            disabled={isLoading}
            className={`py-4 rounded-xl items-center flex-row justify-center ${
              isLoading ? "bg-indigo-500/50" : "bg-indigo-500"
            }`}
          >
            {isLoading ? (
              <>
                <ActivityIndicator color="white" />
                <Text className="text-white font-semibold text-lg ml-3">
                  Generating...
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="sparkles" size={20} color="white" />
                <Text className="text-white font-semibold text-lg ml-2">
                  Generate Playlist
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
