import React, { useState, useMemo } from "react";
import { View, Text, ScrollView, Pressable, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { RootStackParamList } from "../navigation/RootNavigator";
import { usePlaylistStore, getPlaylistById } from "../state/playlistStore";
import { PlaylistItem } from "../types/bible";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, "EditPlaylist">;

export default function EditPlaylistScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();

  const playlistId = route.params.playlistId;
  const playlists = usePlaylistStore((s) => s.playlists);
  const updatePlaylist = usePlaylistStore((s) => s.updatePlaylist);

  const playlist = useMemo(
    () => getPlaylistById(playlists, playlistId),
    [playlists, playlistId]
  );

  const [title, setTitle] = useState(playlist?.title ?? "");
  const [items, setItems] = useState(playlist?.items ?? []);

  if (!playlist) {
    return (
      <View className="flex-1 bg-neutral-950 items-center justify-center">
        <Text className="text-white text-lg">Playlist not found</Text>
      </View>
    );
  }

  const handleSave = () => {
    updatePlaylist(playlistId, {
      title,
      items,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.goBack();
  };

  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter((item: PlaylistItem) => item.id !== itemId));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    setItems(newItems);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    setItems(newItems);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View className="flex-1 bg-neutral-950">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="px-5 pb-4 flex-row items-center justify-between border-b border-neutral-800"
      >
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text className="text-neutral-400 text-base">Cancel</Text>
        </Pressable>
        <Text className="text-white text-lg font-semibold">Edit Playlist</Text>
        <Pressable onPress={handleSave} hitSlop={8}>
          <Text className="text-indigo-400 text-base font-semibold">Save</Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Input */}
        <View className="mt-6">
          <Text className="text-white font-medium mb-2">Playlist Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Enter title"
            placeholderTextColor="#6b7280"
            className="bg-neutral-900 rounded-xl px-4 py-4 text-white text-base"
          />
        </View>

        {/* Items */}
        <View className="mt-6">
          <Text className="text-white font-medium mb-3">
            Passages ({items.length})
          </Text>

          {items.map((item: PlaylistItem, index: number) => (
            <View
              key={item.id}
              className="bg-neutral-900 rounded-xl p-4 mb-2"
            >
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-lg bg-indigo-500/20 items-center justify-center mr-3">
                  <Text className="text-indigo-400 font-medium">{index + 1}</Text>
                </View>
                <Text className="text-white font-medium flex-1">{item.title}</Text>
              </View>

              <View className="flex-row items-center justify-end mt-3 gap-2">
                <Pressable
                  onPress={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className={`p-2 rounded-lg bg-neutral-800 ${index === 0 ? "opacity-30" : ""}`}
                >
                  <Ionicons name="arrow-up" size={18} color="#9ca3af" />
                </Pressable>
                <Pressable
                  onPress={() => handleMoveDown(index)}
                  disabled={index === items.length - 1}
                  className={`p-2 rounded-lg bg-neutral-800 ${
                    index === items.length - 1 ? "opacity-30" : ""
                  }`}
                >
                  <Ionicons name="arrow-down" size={18} color="#9ca3af" />
                </Pressable>
                <Pressable
                  onPress={() => handleRemoveItem(item.id)}
                  className="p-2 rounded-lg bg-red-500/20"
                >
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                </Pressable>
              </View>
            </View>
          ))}

          {items.length === 0 && (
            <View className="py-8 items-center">
              <Ionicons name="document-outline" size={48} color="#6b7280" />
              <Text className="text-neutral-500 mt-2">No passages in playlist</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
