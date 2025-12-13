import React, { useMemo } from "react";
import { View, Text, ScrollView, Pressable, Share } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { RootStackParamList } from "../navigation/RootNavigator";
import { usePlaylistStore, getPlaylistById } from "../state/playlistStore";
import { usePreferencesStore } from "../state/preferencesStore";
import { PlaylistItem } from "../types/bible";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, "PlaylistDetail">;

export default function PlaylistDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();

  const playlistId = route.params.playlistId;
  const playlists = usePlaylistStore((s) => s.playlists);
  const toggleFavorite = usePlaylistStore((s) => s.toggleFavorite);
  const deletePlaylist = usePlaylistStore((s) => s.deletePlaylist);
  const addToRecent = usePlaylistStore((s) => s.addToRecent);
  const defaultMode = usePreferencesStore((s) => s.defaultConsumptionMode);

  const playlist = useMemo(
    () => getPlaylistById(playlists, playlistId),
    [playlists, playlistId]
  );

  if (!playlist) {
    return (
      <View className="flex-1 bg-neutral-950 items-center justify-center">
        <Text className="text-white text-lg">Playlist not found</Text>
        <Pressable
          onPress={() => navigation.goBack()}
          className="mt-4 bg-indigo-500 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-medium">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs}h ${remainingMins}m`;
  };

  const handlePlay = (mode: "listen" | "read") => {
    addToRecent(playlistId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (mode === "listen") {
      navigation.navigate("ListenMode", { playlistId });
    } else {
      navigation.navigate("ReadMode", { playlistId });
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out my Scripture playlist: ${playlist.title}`,
      });
    } catch (err) {
      console.log("Share error:", err);
    }
  };

  const handleDelete = () => {
    deletePlaylist(playlistId);
    navigation.goBack();
  };

  return (
    <View className="flex-1 bg-neutral-950">
      {/* Header with gradient */}
      <LinearGradient
        colors={["#4f46e5", "#0a0a0a"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ paddingTop: insets.top }}
      >
        {/* Navigation */}
        <View className="flex-row items-center justify-between px-5 py-4">
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Ionicons name="chevron-back" size={28} color="white" />
          </Pressable>
          <View className="flex-row gap-4">
            <Pressable onPress={handleShare} hitSlop={8}>
              <Ionicons name="share-outline" size={24} color="white" />
            </Pressable>
            <Pressable
              onPress={() => toggleFavorite(playlistId)}
              hitSlop={8}
            >
              <Ionicons
                name={playlist.isFavorite ? "heart" : "heart-outline"}
                size={24}
                color={playlist.isFavorite ? "#ef4444" : "white"}
              />
            </Pressable>
          </View>
        </View>

        {/* Playlist Info */}
        <View className="px-5 pb-8">
          <View className="w-20 h-20 rounded-2xl bg-white/20 items-center justify-center mb-4">
            <Ionicons
              name={playlist.sourceType === "prompt" ? "sparkles" : "book"}
              size={40}
              color="white"
            />
          </View>
          <Text className="text-white text-2xl font-bold">{playlist.title}</Text>
          <View className="flex-row items-center mt-2 gap-3">
            <Text className="text-white/70">
              {playlist.items.length} passages
            </Text>
            <Text className="text-white/50">•</Text>
            <Text className="text-white/70">
              {formatDuration(playlist.totalDuration)}
            </Text>
            <Text className="text-white/50">•</Text>
            <Text className="text-white/70">{playlist.translation}</Text>
          </View>

          {/* Tags */}
          {playlist.tags.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mt-3">
              {playlist.tags.map((tag: string) => (
                <View key={tag} className="bg-white/20 px-3 py-1 rounded-full">
                  <Text className="text-white/90 text-sm">{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Play Buttons */}
      <View className="px-5 -mt-4 flex-row gap-3">
        <Pressable
          onPress={() => handlePlay("listen")}
          className="flex-1 bg-indigo-500 rounded-xl py-4 flex-row items-center justify-center active:opacity-80"
        >
          <Ionicons name="headset" size={22} color="white" />
          <Text className="text-white font-semibold text-base ml-2">Listen</Text>
        </Pressable>
        <Pressable
          onPress={() => handlePlay("read")}
          className="flex-1 bg-neutral-800 rounded-xl py-4 flex-row items-center justify-center active:opacity-80"
        >
          <Ionicons name="book" size={22} color="white" />
          <Text className="text-white font-semibold text-base ml-2">Read</Text>
        </Pressable>
      </View>

      {/* Playlist Items */}
      <ScrollView
        className="flex-1 px-5 mt-6"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-white font-semibold text-lg mb-4">Passages</Text>

        {playlist.items.map((item: PlaylistItem, index: number) => (
          <Pressable
            key={item.id}
            onPress={() => {
              addToRecent(playlistId);
              navigation.navigate(
                defaultMode === "listen" ? "ListenMode" : "ReadMode",
                { playlistId, startFromItem: item.id }
              );
            }}
            className="bg-neutral-900 rounded-xl p-4 mb-2 flex-row items-center active:opacity-80"
          >
            <View className="w-10 h-10 rounded-lg bg-indigo-500/20 items-center justify-center mr-3">
              <Text className="text-indigo-400 font-semibold">{index + 1}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-white font-medium">{item.title}</Text>
              <Text className="text-neutral-500 text-sm mt-0.5">
                {formatDuration(item.estimatedDuration)}
              </Text>
            </View>
            <Ionicons name="play-circle" size={28} color="#6366f1" />
          </Pressable>
        ))}

        {/* Delete Button */}
        <Pressable
          onPress={handleDelete}
          className="mt-8 py-4 items-center"
        >
          <Text className="text-red-500 font-medium">Delete Playlist</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
