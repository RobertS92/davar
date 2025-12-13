import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { RootStackParamList } from "../navigation/RootNavigator";
import { usePlaylistStore } from "../state/playlistStore";
import { Playlist } from "../types/bible";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type FilterType = "all" | "favorites" | "downloaded" | "recent";

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const playlists = usePlaylistStore((s) => s.playlists);
  const recentPlaylists = usePlaylistStore((s) => s.getRecentPlaylists());
  const favorites = usePlaylistStore((s) => s.getFavorites());
  const downloaded = usePlaylistStore((s) => s.getDownloadedPlaylists());
  const toggleFavorite = usePlaylistStore((s) => s.toggleFavorite);

  const getFilteredPlaylists = (): Playlist[] => {
    let filtered: Playlist[];

    switch (activeFilter) {
      case "favorites":
        filtered = favorites;
        break;
      case "downloaded":
        filtered = downloaded;
        break;
      case "recent":
        filtered = recentPlaylists;
        break;
      default:
        filtered = playlists;
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    return filtered;
  };

  const filteredPlaylists = getFilteredPlaylists();

  const filters: { id: FilterType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: "all", label: "All", icon: "list" },
    { id: "favorites", label: "Favorites", icon: "heart" },
    { id: "downloaded", label: "Offline", icon: "cloud-download" },
    { id: "recent", label: "Recent", icon: "time" },
  ];

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <View className="flex-1 bg-neutral-950">
      <View style={{ paddingTop: insets.top + 8 }} className="px-5 pb-4">
        <Text className="text-white text-3xl font-bold">Library</Text>
        <Text className="text-neutral-400 text-base mt-1">
          {playlists.length} playlist{playlists.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {/* Search */}
      <View className="px-5 mb-4">
        <View className="bg-neutral-900 rounded-xl flex-row items-center px-4 py-3">
          <Ionicons name="search" size={20} color="#6b7280" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search playlists..."
            placeholderTextColor="#6b7280"
            className="flex-1 text-white ml-3 text-base"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#6b7280" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Filters */}
      <View className="px-5 mb-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {filters.map((filter) => (
            <Pressable
              key={filter.id}
              onPress={() => setActiveFilter(filter.id)}
              className={`flex-row items-center px-4 py-2 rounded-full ${
                activeFilter === filter.id
                  ? "bg-indigo-500"
                  : "bg-neutral-800"
              }`}
            >
              <Ionicons
                name={filter.icon}
                size={16}
                color={activeFilter === filter.id ? "white" : "#9ca3af"}
              />
              <Text
                className={`ml-2 text-sm font-medium ${
                  activeFilter === filter.id ? "text-white" : "text-neutral-400"
                }`}
              >
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {filteredPlaylists.length > 0 ? (
          filteredPlaylists.map((playlist) => (
            <Pressable
              key={playlist.id}
              onPress={() => navigation.navigate("PlaylistDetail", { playlistId: playlist.id })}
              className="bg-neutral-900 rounded-xl p-4 mb-3 active:opacity-80"
            >
              <View className="flex-row items-start">
                <View className="w-14 h-14 rounded-lg bg-indigo-500/20 items-center justify-center mr-3">
                  <Ionicons
                    name={playlist.sourceType === "prompt" ? "sparkles" : "list"}
                    size={26}
                    color="#6366f1"
                  />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-white font-semibold text-base flex-1 mr-2" numberOfLines={1}>
                      {playlist.title}
                    </Text>
                    <Pressable
                      onPress={() => toggleFavorite(playlist.id)}
                      hitSlop={8}
                    >
                      <Ionicons
                        name={playlist.isFavorite ? "heart" : "heart-outline"}
                        size={22}
                        color={playlist.isFavorite ? "#ef4444" : "#6b7280"}
                      />
                    </Pressable>
                  </View>
                  <Text className="text-neutral-400 text-sm mt-1">
                    {playlist.items.length} items • {formatDuration(playlist.totalDuration)}
                  </Text>
                  <View className="flex-row items-center mt-2 gap-2">
                    <View className="bg-neutral-800 px-2 py-1 rounded">
                      <Text className="text-neutral-300 text-xs">
                        {playlist.translation}
                      </Text>
                    </View>
                    {playlist.tags.slice(0, 2).map((tag) => (
                      <View key={tag} className="bg-indigo-500/20 px-2 py-1 rounded">
                        <Text className="text-indigo-300 text-xs">{tag}</Text>
                      </View>
                    ))}
                    {playlist.isDownloaded && (
                      <Ionicons name="cloud-done" size={14} color="#10b981" />
                    )}
                  </View>
                </View>
              </View>
              <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-neutral-800">
                <Text className="text-neutral-500 text-xs">
                  Created {formatDate(playlist.createdAt)}
                </Text>
                {playlist.lastPlayedAt && (
                  <Text className="text-neutral-500 text-xs">
                    Last played {formatDate(playlist.lastPlayedAt)}
                  </Text>
                )}
              </View>
            </Pressable>
          ))
        ) : (
          <View className="py-12 items-center">
            <View className="w-20 h-20 rounded-full bg-neutral-800 items-center justify-center mb-4">
              <Ionicons name="folder-open-outline" size={40} color="#6b7280" />
            </View>
            <Text className="text-white text-lg font-semibold text-center">
              {searchQuery ? "No Results" : "No Playlists Yet"}
            </Text>
            <Text className="text-neutral-400 text-center mt-2 px-8">
              {searchQuery
                ? "Try a different search term"
                : "Create your first playlist to see it here"}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
