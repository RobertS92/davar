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
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { RootStackParamList } from "../navigation/RootNavigator";
import { usePlaylistStore } from "../state/playlistStore";
import { usePreferencesStore } from "../state/preferencesStore";
import { generateDeepDivePlaylist, DeepDiveType, DeepDiveTopic } from "../services/deepDiveGenerator";
import { compilePlaylist } from "../services/playlistCompiler";
import { parseReferences } from "../services/bibleParser";
import { Translation, GeneratedPlaylistPlan } from "../types/bible";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface DeepDiveCategory {
  id: DeepDiveTopic;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: readonly [string, string, ...string[]];
  description: string;
  suggestedTypes: DeepDiveType[];
}

const deepDiveTopics: DeepDiveCategory[] = [
  {
    id: "faith",
    title: "Faith & Trust",
    subtitle: "Building unwavering faith",
    icon: "flame",
    colors: ["#f59e0b", "#d97706"] as const,
    description: "Deep exploration of faith through Abraham, Hebrews 11, and key faith passages",
    suggestedTypes: ["precepts", "story", "chapters"],
  },
  {
    id: "salvation",
    title: "Salvation",
    subtitle: "The Gospel message",
    icon: "heart",
    colors: ["#ef4444", "#dc2626"] as const,
    description: "Complete study of salvation from Genesis to Revelation",
    suggestedTypes: ["precepts", "chapters", "story"],
  },
  {
    id: "holiness",
    title: "Holiness & Purity",
    subtitle: "Called to be set apart",
    icon: "sparkles",
    colors: ["#8b5cf6", "#7c3aed"] as const,
    description: "Commands and examples of holy living throughout Scripture",
    suggestedTypes: ["precepts", "chapters"],
  },
  {
    id: "wisdom",
    title: "Wisdom",
    subtitle: "Godly understanding",
    icon: "bulb",
    colors: ["#10b981", "#059669"] as const,
    description: "Proverbs, Ecclesiastes, and wisdom teachings of Jesus",
    suggestedTypes: ["book", "chapters", "precepts"],
  },
  {
    id: "prayer",
    title: "Prayer",
    subtitle: "Communicating with God",
    icon: "chatbubbles",
    colors: ["#6366f1", "#4f46e5"] as const,
    description: "Learn to pray through Scripture examples and teachings",
    suggestedTypes: ["precepts", "story", "chapters"],
  },
  {
    id: "spiritual_warfare",
    title: "Spiritual Warfare",
    subtitle: "Standing firm in battle",
    icon: "shield",
    colors: ["#1f2937", "#374151"] as const,
    description: "Understanding and engaging in spiritual battle",
    suggestedTypes: ["precepts", "chapters", "story"],
  },
  {
    id: "love",
    title: "Love of God",
    subtitle: "Agape love revealed",
    icon: "heart-circle",
    colors: ["#ec4899", "#db2777"] as const,
    description: "The breadth and depth of God's love for us",
    suggestedTypes: ["precepts", "story", "chapters"],
  },
  {
    id: "kingdom",
    title: "Kingdom of God",
    subtitle: "His reign and rule",
    icon: "globe",
    colors: ["#0ea5e9", "#0284c7"] as const,
    description: "Understanding the kingdom through parables and teachings",
    suggestedTypes: ["story", "chapters", "precepts"],
  },
  {
    id: "obedience",
    title: "Obedience",
    subtitle: "Walking in His ways",
    icon: "footsteps",
    colors: ["#14b8a6", "#0d9488"] as const,
    description: "The call and blessing of obedience to God",
    suggestedTypes: ["precepts", "story", "chapters"],
  },
  {
    id: "suffering",
    title: "Suffering & Trials",
    subtitle: "Purpose in pain",
    icon: "rainy",
    colors: ["#64748b", "#475569"] as const,
    description: "Biblical perspective on suffering and perseverance",
    suggestedTypes: ["story", "precepts", "chapters"],
  },
  {
    id: "identity",
    title: "Identity in Christ",
    subtitle: "Who you are in Him",
    icon: "person",
    colors: ["#a855f7", "#9333ea"] as const,
    description: "Understanding your new identity as a believer",
    suggestedTypes: ["precepts", "chapters"],
  },
  {
    id: "promises",
    title: "Promises of God",
    subtitle: "Standing on His Word",
    icon: "ribbon",
    colors: ["#f97316", "#ea580c"] as const,
    description: "Key promises throughout Scripture to claim and believe",
    suggestedTypes: ["precepts", "chapters", "story"],
  },
  {
    id: "stewardship",
    title: "Stewardship",
    subtitle: "Managing God's resources",
    icon: "wallet",
    colors: ["#22c55e", "#16a34a"] as const,
    description: "Biblical principles on money, time, talents, and faithful management",
    suggestedTypes: ["precepts", "story", "chapters"],
  },
];

const deepDiveTypes: { id: DeepDiveType; label: string; description: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: "precepts", label: "Precepts", description: "Key verses and teachings", icon: "list" },
  { id: "story", label: "Stories", description: "Narrative passages", icon: "book" },
  { id: "chapters", label: "Chapters", description: "Full chapter studies", icon: "documents" },
  { id: "book", label: "Whole Book", description: "Complete book study", icon: "library" },
  { id: "mixed", label: "Mixed", description: "Verses, chapters & stories", icon: "apps" },
];

const durationOptions = [60, 90, 120];

export default function DeepDiveStudyScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  const addPlaylist = usePlaylistStore((s) => s.addPlaylist);
  const defaultTranslation = usePreferencesStore((s) => s.defaultTranslation);

  const [step, setStep] = useState<"topic" | "customize" | "review">("topic");
  const [selectedTopic, setSelectedTopic] = useState<DeepDiveCategory | null>(null);
  const [selectedType, setSelectedType] = useState<DeepDiveType>("mixed");
  const [duration, setDuration] = useState(90);
  const [translation, setTranslation] = useState<Translation>(defaultTranslation);
  const [customFocus, setCustomFocus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlaylistPlan | null>(null);

  const handleTopicSelect = (topic: DeepDiveCategory) => {
    setSelectedTopic(topic);
    setSelectedType(topic.suggestedTypes[0] || "mixed");
    setStep("customize");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleGenerate = async () => {
    if (!selectedTopic) return;

    setIsLoading(true);
    setError(null);

    try {
      const plan = await generateDeepDivePlaylist({
        topic: selectedTopic.id,
        type: selectedType,
        duration,
        translation,
        customFocus: customFocus.trim() || undefined,
      });

      setGeneratedPlan(plan);
      setStep("review");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setError("Failed to generate deep dive playlist. Please try again.");
      console.log("Deep dive generation error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFromPlan = async () => {
    if (!generatedPlan || !selectedTopic) return;

    setIsLoading(true);
    setError(null);

    try {
      const parsed = parseReferences(generatedPlan.references.join("\n"));

      if (parsed.errors.length > 0 && parsed.references.length === 0) {
        setError("Could not parse references: " + parsed.errors.join(", "));
        setIsLoading(false);
        return;
      }

      const playlist = await compilePlaylist({
        title: generatedPlan.title,
        references: parsed.references,
        translation,
        sourceType: "prompt",
        promptUsed: `Deep Dive: ${selectedTopic.title} (${selectedType})`,
        tags: [selectedTopic.id, "deep-dive", selectedType],
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

  const handleBack = () => {
    if (step === "customize") {
      setStep("topic");
      setSelectedTopic(null);
    } else if (step === "review") {
      setStep("customize");
      setGeneratedPlan(null);
    }
  };

  // Topic Selection Step
  if (step === "topic") {
    return (
      <View className="flex-1 bg-neutral-950">
        <View style={{ paddingTop: insets.top + 8 }} className="px-5 pb-4 flex-row items-center justify-between border-b border-neutral-800">
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Ionicons name="close" size={28} color="#9ca3af" />
          </Pressable>
          <Text className="text-white text-lg font-semibold">Deep Dive Study</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Info */}
          <View className="mt-6 mb-6">
            <View className="flex-row items-center mb-2">
              <Ionicons name="school" size={24} color="#6366f1" />
              <Text className="text-indigo-400 text-sm font-medium ml-2 uppercase tracking-wider">
                90+ Minute Sessions
              </Text>
            </View>
            <Text className="text-white text-2xl font-bold">
              Choose Your Study Topic
            </Text>
            <Text className="text-neutral-400 mt-2">
              Comprehensive playlists featuring precepts, chapter ranges, stories, and full books for extended study sessions.
            </Text>
          </View>

          {/* Topic Grid */}
          <View className="gap-3">
            {deepDiveTopics.map((topic) => (
              <Pressable
                key={topic.id}
                onPress={() => handleTopicSelect(topic)}
                className="overflow-hidden rounded-2xl active:opacity-90"
              >
                <LinearGradient
                  colors={topic.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ padding: 16 }}
                >
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center mr-4">
                      <Ionicons name={topic.icon} size={24} color="white" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white text-lg font-bold">{topic.title}</Text>
                      <Text className="text-white/70 text-sm">{topic.subtitle}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.6)" />
                  </View>
                  <Text className="text-white/60 text-sm mt-3">{topic.description}</Text>
                </LinearGradient>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  // Customize Step
  if (step === "customize" && selectedTopic) {
    return (
      <View className="flex-1 bg-neutral-950">
        <View style={{ paddingTop: insets.top + 8 }} className="px-5 pb-4 flex-row items-center justify-between border-b border-neutral-800">
          <Pressable onPress={handleBack} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color="#9ca3af" />
          </Pressable>
          <Text className="text-white text-lg font-semibold">Customize Study</Text>
          <View style={{ width: 24 }} />
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
            {/* Selected Topic Card */}
            <View className="mt-6">
              <LinearGradient
                colors={selectedTopic.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 16, borderRadius: 16 }}
              >
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center mr-4">
                    <Ionicons name={selectedTopic.icon} size={24} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-xl font-bold">{selectedTopic.title}</Text>
                    <Text className="text-white/70">{selectedTopic.subtitle}</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Study Type Selection */}
            <View className="mt-8">
              <Text className="text-white font-semibold text-lg mb-3">Study Type</Text>
              <Text className="text-neutral-500 text-sm mb-4">
                Choose how the content is organized
              </Text>
              <View className="gap-2">
                {deepDiveTypes.map((type) => (
                  <Pressable
                    key={type.id}
                    onPress={() => setSelectedType(type.id)}
                    className={`flex-row items-center p-4 rounded-xl ${
                      selectedType === type.id ? "bg-indigo-500/20 border border-indigo-500" : "bg-neutral-900"
                    }`}
                  >
                    <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${
                      selectedType === type.id ? "bg-indigo-500" : "bg-neutral-800"
                    }`}>
                      <Ionicons
                        name={type.icon}
                        size={20}
                        color={selectedType === type.id ? "white" : "#9ca3af"}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className={`font-medium ${selectedType === type.id ? "text-white" : "text-neutral-300"}`}>
                        {type.label}
                      </Text>
                      <Text className="text-neutral-500 text-sm">{type.description}</Text>
                    </View>
                    {selectedType === type.id && (
                      <Ionicons name="checkmark-circle" size={24} color="#6366f1" />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Duration Selection */}
            <View className="mt-8">
              <Text className="text-white font-semibold text-lg mb-3">Duration</Text>
              <View className="flex-row gap-3">
                {durationOptions.map((d) => (
                  <Pressable
                    key={d}
                    onPress={() => setDuration(d)}
                    className={`flex-1 py-4 rounded-xl items-center ${
                      duration === d ? "bg-indigo-500" : "bg-neutral-900"
                    }`}
                  >
                    <Text className={`text-2xl font-bold ${duration === d ? "text-white" : "text-neutral-400"}`}>
                      {d}
                    </Text>
                    <Text className={`text-sm ${duration === d ? "text-white/70" : "text-neutral-500"}`}>
                      minutes
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Translation */}
            <View className="mt-8">
              <Text className="text-white font-semibold text-lg mb-3">Translation</Text>
              <View className="flex-row gap-3">
                {(["KJV", "NIV"] as Translation[]).map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => setTranslation(t)}
                    className={`flex-1 py-3 rounded-xl items-center ${
                      translation === t ? "bg-indigo-500" : "bg-neutral-900"
                    }`}
                  >
                    <Text className={`font-medium ${translation === t ? "text-white" : "text-neutral-400"}`}>
                      {t}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Custom Focus */}
            <View className="mt-8">
              <Text className="text-white font-semibold text-lg mb-2">Custom Focus (Optional)</Text>
              <Text className="text-neutral-500 text-sm mb-3">
                Add specific aspects you want to emphasize
              </Text>
              <TextInput
                value={customFocus}
                onChangeText={setCustomFocus}
                placeholder="e.g., focus on Old Testament examples, emphasize practical application..."
                placeholderTextColor="#6b7280"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                className="bg-neutral-900 rounded-xl px-4 py-4 text-white text-base min-h-[80px]"
              />
            </View>

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
                    Generating Deep Dive...
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="sparkles" size={20} color="white" />
                  <Text className="text-white font-semibold text-lg ml-2">
                    Generate {duration}-Min Study
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // Review Step
  if (step === "review" && generatedPlan && selectedTopic) {
    return (
      <View className="flex-1 bg-neutral-950">
        <View
          style={{ paddingTop: insets.top + 8 }}
          className="px-5 pb-4 flex-row items-center justify-between border-b border-neutral-800"
        >
          <Pressable onPress={handleBack} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color="#9ca3af" />
          </Pressable>
          <Text className="text-white text-lg font-semibold">Review Deep Dive</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Title Card */}
          <View className="mt-6">
            <LinearGradient
              colors={selectedTopic.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 20, borderRadius: 16 }}
            >
              <View className="flex-row items-center mb-3">
                <Ionicons name="school" size={20} color="white" />
                <Text className="text-white/70 text-sm ml-2 uppercase tracking-wider">
                  {duration}-Minute Deep Dive
                </Text>
              </View>
              <Text className="text-white text-2xl font-bold">
                {generatedPlan.title}
              </Text>
              <View className="flex-row items-center mt-3">
                <View className="bg-white/20 px-3 py-1 rounded-full mr-2">
                  <Text className="text-white text-sm">{selectedType}</Text>
                </View>
                <View className="bg-white/20 px-3 py-1 rounded-full">
                  <Text className="text-white text-sm">{generatedPlan.references.length} passages</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Explanation */}
          <View className="mt-6 bg-neutral-900 rounded-xl p-4">
            <Text className="text-white font-medium mb-3">Study Overview</Text>
            {generatedPlan.explanation.map((point, index) => (
              <View key={index} className="flex-row items-start mt-2">
                <View className="w-6 h-6 rounded-full bg-indigo-500/20 items-center justify-center mr-3 mt-0.5">
                  <Text className="text-indigo-400 text-xs font-bold">{index + 1}</Text>
                </View>
                <Text className="text-neutral-300 flex-1">{point}</Text>
              </View>
            ))}
          </View>

          {/* Passages List */}
          <View className="mt-6">
            <Text className="text-white font-semibold text-lg mb-3">
              Passages ({generatedPlan.references.length})
            </Text>
            {generatedPlan.references.map((ref, index) => {
              // Determine if this is a chapter, book, or verse reference
              const isBook = !ref.includes(":") && !ref.match(/\d+$/);
              const isChapter = !ref.includes(":") && ref.match(/\d+$/);

              return (
                <View
                  key={index}
                  className="bg-neutral-900 rounded-xl p-4 mb-2 flex-row items-center"
                >
                  <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                    isBook ? "bg-purple-500/20" : isChapter ? "bg-blue-500/20" : "bg-green-500/20"
                  }`}>
                    <Ionicons
                      name={isBook ? "library" : isChapter ? "document" : "bookmark"}
                      size={18}
                      color={isBook ? "#a855f7" : isChapter ? "#3b82f6" : "#22c55e"}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-medium">{ref}</Text>
                    <Text className="text-neutral-500 text-xs mt-0.5">
                      {isBook ? "Full Book" : isChapter ? "Full Chapter" : "Verses"}
                    </Text>
                  </View>
                  <Text className="text-neutral-600 text-sm">{index + 1}</Text>
                </View>
              );
            })}
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
          <View className="flex-row gap-3">
            <Pressable
              onPress={handleBack}
              className="flex-1 py-4 rounded-xl items-center bg-neutral-800"
            >
              <Text className="text-white font-semibold">Regenerate</Text>
            </Pressable>
            <Pressable
              onPress={handleCreateFromPlan}
              disabled={isLoading}
              className={`flex-1 py-4 rounded-xl items-center flex-row justify-center ${
                isLoading ? "bg-indigo-500/50" : "bg-indigo-500"
              }`}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="play" size={18} color="white" />
                  <Text className="text-white font-semibold ml-2">Create Study</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return null;
}
