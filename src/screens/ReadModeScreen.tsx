import React, { useState, useEffect, useRef, useMemo } from "react";
import { View, Text, Pressable, Dimensions, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import PagerView from "react-native-pager-view";
import * as Haptics from "expo-haptics";

import { RootStackParamList } from "../navigation/RootNavigator";
import { usePlaylistStore, getPlaylistById } from "../state/playlistStore";
import { usePreferencesStore } from "../state/preferencesStore";
import { PlaylistItem, BibleVerse } from "../types/bible";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, "ReadMode">;

const { width, height } = Dimensions.get("window");

export default function ReadModeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const pagerRef = useRef<PagerView>(null);

  const playlistId = route.params.playlistId;
  const startFromItem = route.params?.startFromItem;

  const playlists = usePlaylistStore((s) => s.playlists);
  const updatePlaybackProgress = usePlaylistStore((s) => s.updatePlaybackProgress);
  const markPlaylistCompleted = usePlaylistStore((s) => s.markPlaylistCompleted);

  const playlist = useMemo(
    () => getPlaylistById(playlists, playlistId),
    [playlists, playlistId]
  );

  const textSize = usePreferencesStore((s) => s.textSize);
  const nightMode = usePreferencesStore((s) => s.nightMode);
  const showVerseNumbers = usePreferencesStore((s) => s.showVerseNumbersInRead);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    if (startFromItem && playlist) {
      const index = playlist.items.findIndex((item: PlaylistItem) => item.id === startFromItem);
      if (index >= 0) {
        setCurrentIndex(index);
        setTimeout(() => {
          pagerRef.current?.setPage(index);
        }, 100);
      }
    }
  }, [startFromItem, playlist]);

  if (!playlist) {
    return (
      <View className="flex-1 bg-neutral-950 items-center justify-center">
        <Text className="text-white text-lg">Playlist not found</Text>
      </View>
    );
  }

  const totalItems = playlist.items.length;
  const bgColor = nightMode ? "#0a0a0a" : "#faf7f2";
  const textColor = nightMode ? "#ffffff" : "#1a1a1a";
  const subTextColor = nightMode ? "#9ca3af" : "#6b7280";

  const handlePageChange = (position: number) => {
    setCurrentIndex(position);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const currentItem = playlist.items[position];
    updatePlaybackProgress(playlistId, currentItem.id, 0);

    if (position === totalItems - 1) {
      markPlaylistCompleted(playlistId);
    }
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: bgColor }}>
      {/* Header */}
      {showControls && (
        <View
          style={{ paddingTop: insets.top + 8, backgroundColor: bgColor }}
          className="px-5 pb-4 flex-row items-center justify-between border-b"
        >
          <Pressable onPress={handleClose} hitSlop={8}>
            <Ionicons name="close" size={28} color={textColor} />
          </Pressable>
          <View className="items-center">
            <Text style={{ color: subTextColor }} className="text-sm">
              {currentIndex + 1} of {totalItems}
            </Text>
            <Text style={{ color: textColor }} className="font-medium">
              {playlist.title}
            </Text>
          </View>
          <Pressable
            onPress={() =>
              navigation.navigate("ListenMode", {
                playlistId,
                startFromItem: playlist.items[currentIndex].id,
              })
            }
            hitSlop={8}
          >
            <Ionicons name="headset-outline" size={24} color={textColor} />
          </Pressable>
        </View>
      )}

      {/* Pager */}
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={(e) => handlePageChange(e.nativeEvent.position)}
      >
        {playlist.items.map((item: PlaylistItem, index: number) => (
          <Pressable
            key={item.id}
            onPress={toggleControls}
            className="flex-1"
          >
            <ScrollView
              className="flex-1 px-6"
              contentContainerStyle={{
                paddingTop: showControls ? 20 : insets.top + 20,
                paddingBottom: showControls ? 100 : insets.bottom + 100,
              }}
              showsVerticalScrollIndicator={false}
            >
              {/* Reference Title */}
              <Text
                style={{ color: "#6366f1", fontSize: 14 }}
                className="font-semibold uppercase tracking-wider mb-4"
              >
                {item.title}
              </Text>

              {/* Scripture Text */}
              {showVerseNumbers ? (
                item.verses.map((verse: BibleVerse) => (
                  <View key={verse.verse} className="flex-row mb-3">
                    <Text
                      style={{ color: "#6366f1", fontSize: textSize - 4 }}
                      className="font-medium mr-2 mt-1"
                    >
                      {verse.verse}
                    </Text>
                    <Text
                      style={{ color: textColor, fontSize: textSize, lineHeight: textSize * 1.8 }}
                      className="flex-1"
                    >
                      {verse.text}
                    </Text>
                  </View>
                ))
              ) : (
                <Text
                  style={{ color: textColor, fontSize: textSize, lineHeight: textSize * 1.8 }}
                >
                  {item.text}
                </Text>
              )}
            </ScrollView>
          </Pressable>
        ))}
      </PagerView>

      {/* Bottom Navigation */}
      {showControls && (
        <View
          style={{ paddingBottom: insets.bottom + 16, backgroundColor: bgColor }}
          className="px-5 pt-4 border-t flex-row items-center justify-between"
        >
          <Pressable
            onPress={() => {
              if (currentIndex > 0) {
                pagerRef.current?.setPage(currentIndex - 1);
              }
            }}
            disabled={currentIndex === 0}
            className={`flex-row items-center ${currentIndex === 0 ? "opacity-30" : ""}`}
          >
            <Ionicons name="chevron-back" size={24} color={textColor} />
            <Text style={{ color: textColor }} className="font-medium ml-1">
              Previous
            </Text>
          </Pressable>

          {/* Progress Dots */}
          <View className="flex-row gap-1.5">
            {totalItems <= 10 ? (
              playlist.items.map((_: PlaylistItem, i: number) => (
                <View
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i === currentIndex ? "bg-indigo-500" : "bg-neutral-600"
                  }`}
                />
              ))
            ) : (
              <Text style={{ color: subTextColor }} className="text-sm">
                {currentIndex + 1} / {totalItems}
              </Text>
            )}
          </View>

          <Pressable
            onPress={() => {
              if (currentIndex < totalItems - 1) {
                pagerRef.current?.setPage(currentIndex + 1);
              }
            }}
            disabled={currentIndex === totalItems - 1}
            className={`flex-row items-center ${
              currentIndex === totalItems - 1 ? "opacity-30" : ""
            }`}
          >
            <Text style={{ color: textColor }} className="font-medium mr-1">
              Next
            </Text>
            <Ionicons name="chevron-forward" size={24} color={textColor} />
          </Pressable>
        </View>
      )}
    </View>
  );
}
