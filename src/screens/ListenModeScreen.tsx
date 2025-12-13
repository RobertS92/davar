import React, { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, Dimensions, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Slider from "@react-native-community/slider";
import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";

import { RootStackParamList } from "../navigation/RootNavigator";
import { usePlaylistStore } from "../state/playlistStore";
import { usePreferencesStore } from "../state/preferencesStore";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, "ListenMode">;

const { width } = Dimensions.get("window");

export default function ListenModeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();

  const playlistId = route.params.playlistId;
  const startFromItem = route.params?.startFromItem;

  const playlist = usePlaylistStore((s) => s.getPlaylistById(playlistId));
  const updatePlaybackProgress = usePlaylistStore((s) => s.updatePlaybackProgress);
  const markPlaylistCompleted = usePlaylistStore((s) => s.markPlaylistCompleted);

  const playbackSpeed = usePreferencesStore((s) => s.playbackSpeed);
  const speakVerseNumbers = usePreferencesStore((s) => s.speakVerseNumbers);
  const announceBookChapter = usePreferencesStore((s) => s.announceBookChapter);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (startFromItem && playlist) {
      const index = playlist.items.findIndex((item) => item.id === startFromItem);
      if (index >= 0) setCurrentIndex(index);
    }
  }, [startFromItem, playlist]);

  useEffect(() => {
    return () => {
      Speech.stop();
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  if (!playlist) {
    return (
      <View className="flex-1 bg-neutral-950 items-center justify-center">
        <Text className="text-white text-lg">Playlist not found</Text>
      </View>
    );
  }

  const currentItem = playlist.items[currentIndex];
  const totalItems = playlist.items.length;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const prepareText = () => {
    let text = "";

    if (announceBookChapter) {
      text += `${currentItem.title}. `;
    }

    if (speakVerseNumbers) {
      currentItem.verses.forEach((verse) => {
        text += `Verse ${verse.verse}. ${verse.text} `;
      });
    } else {
      text += currentItem.text;
    }

    return text;
  };

  const handlePlay = async () => {
    if (isPlaying) {
      Speech.stop();
      setIsPlaying(false);
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      return;
    }

    setIsLoading(true);
    setIsPlaying(true);

    const text = prepareText();
    const estimatedDuration = currentItem.estimatedDuration;

    // Start progress simulation
    const startTime = Date.now();
    const currentProgress = progress;

    progressInterval.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const newProgress = Math.min(
        currentProgress + (elapsed / estimatedDuration) * playbackSpeed,
        1
      );
      setProgress(newProgress);

      if (newProgress >= 1) {
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
        }
      }
    }, 100);

    setIsLoading(false);

    Speech.speak(text, {
      rate: playbackSpeed,
      onDone: () => {
        setIsPlaying(false);
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
        }
        setProgress(1);

        // Auto-advance to next track
        if (currentIndex < totalItems - 1) {
          setTimeout(() => {
            handleNext();
          }, 1000);
        } else {
          markPlaylistCompleted(playlistId);
        }
      },
      onStopped: () => {
        setIsPlaying(false);
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
        }
      },
      onError: () => {
        setIsPlaying(false);
        setIsLoading(false);
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
        }
      },
    });

    updatePlaybackProgress(playlistId, currentItem.id, progress * estimatedDuration);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      Speech.stop();
      setIsPlaying(false);
      setProgress(0);
      setCurrentIndex(currentIndex - 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleNext = () => {
    if (currentIndex < totalItems - 1) {
      Speech.stop();
      setIsPlaying(false);
      setProgress(0);
      setCurrentIndex(currentIndex + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleClose = () => {
    Speech.stop();
    navigation.goBack();
  };

  return (
    <View className="flex-1 bg-neutral-950">
      <LinearGradient
        colors={["#4f46e5", "#1e1b4b", "#0a0a0a"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View
          style={{ paddingTop: insets.top + 8 }}
          className="px-5 flex-row items-center justify-between"
        >
          <Pressable onPress={handleClose} hitSlop={8}>
            <Ionicons name="chevron-down" size={28} color="white" />
          </Pressable>
          <View className="items-center">
            <Text className="text-white/60 text-sm">NOW PLAYING</Text>
            <Text className="text-white font-medium">{playlist.title}</Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate("ReadMode", { playlistId, startFromItem: currentItem.id })}
            hitSlop={8}
          >
            <Ionicons name="book-outline" size={24} color="white" />
          </Pressable>
        </View>

        {/* Album Art / Visualization */}
        <View className="flex-1 items-center justify-center px-10">
          <View
            className="rounded-3xl bg-white/10 items-center justify-center"
            style={{ width: width - 80, height: width - 80 }}
          >
            <Ionicons name="book" size={120} color="rgba(255,255,255,0.3)" />
            <Text className="text-white/50 text-lg mt-4">
              {currentIndex + 1} of {totalItems}
            </Text>
          </View>
        </View>

        {/* Track Info */}
        <View className="px-8">
          <Text className="text-white text-2xl font-bold text-center" numberOfLines={2}>
            {currentItem.title}
          </Text>
          <Text className="text-white/60 text-center mt-2">
            {playlist.translation} • {formatTime(currentItem.estimatedDuration)}
          </Text>
        </View>

        {/* Progress Bar */}
        <View className="px-8 mt-8">
          <Slider
            value={progress}
            onValueChange={(value) => setProgress(value)}
            minimumValue={0}
            maximumValue={1}
            minimumTrackTintColor="#6366f1"
            maximumTrackTintColor="rgba(255,255,255,0.2)"
            thumbTintColor="#6366f1"
          />
          <View className="flex-row justify-between mt-1">
            <Text className="text-white/50 text-sm">
              {formatTime(progress * currentItem.estimatedDuration)}
            </Text>
            <Text className="text-white/50 text-sm">
              {formatTime(currentItem.estimatedDuration)}
            </Text>
          </View>
        </View>

        {/* Controls */}
        <View
          className="flex-row items-center justify-center gap-8 mt-6"
          style={{ paddingBottom: insets.bottom + 32 }}
        >
          <Pressable
            onPress={handlePrevious}
            disabled={currentIndex === 0}
            className={currentIndex === 0 ? "opacity-30" : ""}
          >
            <Ionicons name="play-skip-back" size={36} color="white" />
          </Pressable>

          <Pressable
            onPress={handlePlay}
            className="w-20 h-20 rounded-full bg-white items-center justify-center"
          >
            {isLoading ? (
              <ActivityIndicator color="#4f46e5" size="large" />
            ) : (
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={40}
                color="#4f46e5"
                style={{ marginLeft: isPlaying ? 0 : 4 }}
              />
            )}
          </Pressable>

          <Pressable
            onPress={handleNext}
            disabled={currentIndex === totalItems - 1}
            className={currentIndex === totalItems - 1 ? "opacity-30" : ""}
          >
            <Ionicons name="play-skip-forward" size={36} color="white" />
          </Pressable>
        </View>

        {/* Speed Indicator */}
        <View className="items-center pb-4">
          <Text className="text-white/40 text-sm">{playbackSpeed}x speed</Text>
        </View>
      </LinearGradient>
    </View>
  );
}
