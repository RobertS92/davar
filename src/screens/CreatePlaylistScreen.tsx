import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { RootStackParamList } from "../navigation/RootNavigator";
import { usePlaylistStore } from "../state/playlistStore";
import { usePreferencesStore } from "../state/preferencesStore";
import { parseReferences } from "../services/bibleParser";
import { compilePlaylist } from "../services/playlistCompiler";
import { Playlist, Translation } from "../types/bible";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CreatePlaylistScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  const addPlaylist = usePlaylistStore((s) => s.addPlaylist);
  const defaultTranslation = usePreferencesStore((s) => s.defaultTranslation);

  const [title, setTitle] = useState("");
  const [references, setReferences] = useState("");
  const [translation, setTranslation] = useState<Translation>(defaultTranslation);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!references.trim()) {
      setError("Please enter at least one Scripture reference");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const parsed = parseReferences(references);

      if (parsed.errors.length > 0) {
        setError(parsed.errors.join("\n"));
        setIsLoading(false);
        return;
      }

      const playlist = await compilePlaylist({
        title: title.trim() || "My Playlist",
        references: parsed.references,
        translation,
        sourceType: "manual",
      });

      addPlaylist(playlist);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      navigation.replace("PlaylistDetail", { playlistId: playlist.id });
    } catch (err) {
      setError("Failed to create playlist. Please try again.");
      console.log("Create playlist error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const exampleReferences = [
    "John 3:16",
    "Psalm 23",
    "Romans 8:28-39",
    "James",
  ];

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
        <Text className="text-white text-lg font-semibold">Create Playlist</Text>
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
          {/* Title Input */}
          <View className="mt-6">
            <Text className="text-white font-medium mb-2">Playlist Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="My Scripture Playlist"
              placeholderTextColor="#6b7280"
              className="bg-neutral-900 rounded-xl px-4 py-4 text-white text-base"
            />
          </View>

          {/* Translation Picker */}
          <View className="mt-6">
            <Text className="text-white font-medium mb-2">Translation</Text>
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

          {/* References Input */}
          <View className="mt-6">
            <Text className="text-white font-medium mb-2">Scripture References</Text>
            <Text className="text-neutral-500 text-sm mb-3">
              Enter verses, ranges, chapters, or books. One per line or comma-separated.
            </Text>
            <TextInput
              value={references}
              onChangeText={(text) => {
                setReferences(text);
                setError(null);
              }}
              placeholder="John 3:16&#10;Psalm 23&#10;Romans 8:28-39"
              placeholderTextColor="#6b7280"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              className="bg-neutral-900 rounded-xl px-4 py-4 text-white text-base min-h-[150px]"
            />
          </View>

          {/* Error Message */}
          {error && (
            <View className="mt-4 bg-red-500/20 rounded-xl p-4">
              <Text className="text-red-400">{error}</Text>
            </View>
          )}

          {/* Examples */}
          <View className="mt-6">
            <Text className="text-neutral-400 text-sm mb-3">Examples:</Text>
            <View className="flex-row flex-wrap gap-2">
              {exampleReferences.map((ref) => (
                <Pressable
                  key={ref}
                  onPress={() => {
                    setReferences((prev) =>
                      prev ? `${prev}\n${ref}` : ref
                    );
                  }}
                  className="bg-neutral-800 px-3 py-2 rounded-lg"
                >
                  <Text className="text-neutral-300 text-sm">{ref}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Format Help */}
          <View className="mt-6 bg-neutral-900 rounded-xl p-4">
            <Text className="text-white font-medium mb-2">Supported Formats</Text>
            <View className="gap-2">
              <View className="flex-row items-center">
                <Ionicons name="checkmark" size={16} color="#10b981" />
                <Text className="text-neutral-400 text-sm ml-2">Single verse: John 3:16</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="checkmark" size={16} color="#10b981" />
                <Text className="text-neutral-400 text-sm ml-2">Range: John 3:16-18</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="checkmark" size={16} color="#10b981" />
                <Text className="text-neutral-400 text-sm ml-2">Chapter: Romans 8</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="checkmark" size={16} color="#10b981" />
                <Text className="text-neutral-400 text-sm ml-2">Whole book: James</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="checkmark" size={16} color="#10b981" />
                <Text className="text-neutral-400 text-sm ml-2">Abbreviations: Ps, Rom, Matt</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Create Button */}
        <View
          className="px-5 py-4 border-t border-neutral-800"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <Pressable
            onPress={handleCreate}
            disabled={isLoading}
            className={`py-4 rounded-xl items-center ${
              isLoading ? "bg-indigo-500/50" : "bg-indigo-500"
            }`}
          >
            {isLoading ? (
              <Text className="text-white font-semibold text-lg">Creating...</Text>
            ) : (
              <Text className="text-white font-semibold text-lg">Create Playlist</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
