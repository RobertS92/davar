import React, { useMemo } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { RootStackParamList } from "../navigation/RootNavigator";
import { usePlaylistStore, getRecentPlaylists, getFavorites } from "../state/playlistStore";
import { usePreferencesStore } from "../state/preferencesStore";
import { Playlist } from "../types/bible";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  const playlists = usePlaylistStore((s) => s.playlists);
  const recentPlaylistIds = usePlaylistStore((s) => s.recentPlaylistIds);
  const defaultMode = usePreferencesStore((s) => s.defaultConsumptionMode);

  const recentPlaylists = useMemo(
    () => getRecentPlaylists(playlists, recentPlaylistIds),
    [playlists, recentPlaylistIds]
  );

  const favorites = useMemo(
    () => getFavorites(playlists),
    [playlists]
  );

  const quickActions = [
    {
      id: "prompt",
      title: "Create with AI",
      subtitle: "Describe what you need",
      icon: "sparkles" as const,
      colors: ["#6366f1", "#8b5cf6"] as const,
      onPress: () => navigation.navigate("PromptPlaylist", {}),
    },
    {
      id: "manual",
      title: "Manual Entry",
      subtitle: "Enter specific verses",
      icon: "create-outline" as const,
      colors: ["#0ea5e9", "#06b6d4"] as const,
      onPress: () => navigation.navigate("CreatePlaylist"),
    },
  ];

  const modeCards = [
    {
      id: "bedtime",
      title: "Bedtime",
      icon: "moon" as const,
      color: "#6366f1",
    },
    {
      id: "commute",
      title: "Commute",
      icon: "car" as const,
      color: "#f59e0b",
    },
    {
      id: "study",
      title: "Study",
      icon: "book" as const,
      color: "#10b981",
    },
    {
      id: "prayer",
      title: "Prayer",
      icon: "heart" as const,
      color: "#ec4899",
    },
  ];

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  return (
    <View className="flex-1 bg-neutral-950">
      <View style={{ paddingTop: insets.top + 8 }} className="px-5 pb-4">
        <Text className="text-white text-3xl font-bold">Scripture</Text>
        <Text className="text-neutral-400 text-base mt-1">
          Listen or read the Word
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        <View className="px-5 mb-6">
          <Text className="text-white text-lg font-semibold mb-3">
            Create Playlist
          </Text>
          <View className="flex-row gap-3">
            {quickActions.map((action) => (
              <Pressable
                key={action.id}
                onPress={action.onPress}
                className="flex-1 overflow-hidden rounded-2xl active:opacity-80"
              >
                <LinearGradient
                  colors={action.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ padding: 16, minHeight: 100 }}
                >
                  <Ionicons name={action.icon} size={28} color="white" />
                  <Text className="text-white font-semibold text-base mt-3">
                    {action.title}
                  </Text>
                  <Text className="text-white/70 text-sm mt-1">
                    {action.subtitle}
                  </Text>
                </LinearGradient>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Modes */}
        <View className="px-5 mb-6">
          <Text className="text-white text-lg font-semibold mb-3">
            Quick Modes
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12 }}
          >
            {modeCards.map((mode) => (
              <Pressable
                key={mode.id}
                onPress={() => navigation.navigate("PromptPlaylist", { mode: mode.id })}
                className="w-24 h-24 rounded-2xl items-center justify-center active:opacity-80"
                style={{ backgroundColor: mode.color + "20" }}
              >
                <Ionicons name={mode.icon} size={28} color={mode.color} />
                <Text className="text-white text-sm font-medium mt-2">
                  {mode.title}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Recent Playlists */}
        {recentPlaylists.length > 0 && (
          <View className="px-5 mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-white text-lg font-semibold">
                Recent
              </Text>
              <Pressable onPress={() => navigation.navigate("MainTabs")}>
                <Text className="text-indigo-400 text-sm">See All</Text>
              </Pressable>
            </View>
            {recentPlaylists.slice(0, 3).map((playlist: Playlist) => (
              <Pressable
                key={playlist.id}
                onPress={() => navigation.navigate("PlaylistDetail", { playlistId: playlist.id })}
                className="bg-neutral-900 rounded-xl p-4 mb-2 flex-row items-center active:opacity-80"
              >
                <View className="w-12 h-12 rounded-lg bg-indigo-500/20 items-center justify-center mr-3">
                  <Ionicons
                    name={defaultMode === "listen" ? "headset" : "book"}
                    size={24}
                    color="#6366f1"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-medium" numberOfLines={1}>
                    {playlist.title}
                  </Text>
                  <Text className="text-neutral-400 text-sm mt-0.5">
                    {playlist.items.length} items • {formatDuration(playlist.totalDuration)}
                  </Text>
                </View>
                <Ionicons name="play-circle" size={32} color="#6366f1" />
              </Pressable>
            ))}
          </View>
        )}

        {/* Favorites */}
        {favorites.length > 0 && (
          <View className="px-5 mb-6">
            <Text className="text-white text-lg font-semibold mb-3">
              Favorites
            </Text>
            {favorites.slice(0, 3).map((playlist: Playlist) => (
              <Pressable
                key={playlist.id}
                onPress={() => navigation.navigate("PlaylistDetail", { playlistId: playlist.id })}
                className="bg-neutral-900 rounded-xl p-4 mb-2 flex-row items-center active:opacity-80"
              >
                <View className="w-12 h-12 rounded-lg bg-amber-500/20 items-center justify-center mr-3">
                  <Ionicons name="heart" size={24} color="#f59e0b" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-medium" numberOfLines={1}>
                    {playlist.title}
                  </Text>
                  <Text className="text-neutral-400 text-sm mt-0.5">
                    {playlist.items.length} items • {formatDuration(playlist.totalDuration)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6b7280" />
              </Pressable>
            ))}
          </View>
        )}

        {/* Empty State */}
        {recentPlaylists.length === 0 && favorites.length === 0 && (
          <View className="px-5 py-12 items-center">
            <View className="w-20 h-20 rounded-full bg-indigo-500/20 items-center justify-center mb-4">
              <Ionicons name="book-outline" size={40} color="#6366f1" />
            </View>
            <Text className="text-white text-lg font-semibold text-center">
              Start Your Journey
            </Text>
            <Text className="text-neutral-400 text-center mt-2 px-8">
              Create your first Scripture playlist to listen or read on the go
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
