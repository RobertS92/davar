import React, { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, Dimensions, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Slider from "@react-native-community/slider";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";

import { RootStackParamList } from "../navigation/RootNavigator";
import { usePlaylistStore } from "../state/playlistStore";
import { usePreferencesStore } from "../state/preferencesStore";
import { generatePlaylistItemAudio, TTSVoice, VOICE_OPTIONS } from "../services/ttsService";

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
  const defaultVoice = usePreferencesStore((s) => s.defaultVoice);
  const speakVerseNumbers = usePreferencesStore((s) => s.speakVerseNumbers);
  const announceBookChapter = usePreferencesStore((s) => s.announceBookChapter);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const soundRef = useRef<Audio.Sound | null>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (startFromItem && playlist) {
      const index = playlist.items.findIndex((item) => item.id === startFromItem);
      if (index >= 0) setCurrentIndex(index);
    }

    // Configure audio mode for playback
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });

    return () => {
      cleanup();
    };
  }, [startFromItem, playlist]);

  const cleanup = async () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
  };

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
    if (isPlaying && soundRef.current) {
      // Pause
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      return;
    }

    // If we have a paused sound, resume it
    if (soundRef.current && progress > 0 && progress < 1) {
      await soundRef.current.playAsync();
      setIsPlaying(true);
      startProgressTracking();
      return;
    }

    // Generate new audio
    setIsLoading(true);
    setError(null);

    try {
      const text = prepareText();
      const voice = (defaultVoice as TTSVoice) || "nova";

      const result = await generatePlaylistItemAudio(
        currentItem.title,
        text,
        {
          voice,
          speed: playbackSpeed,
          announceTitle: announceBookChapter,
        }
      );

      // Load and play the audio
      const { sound } = await Audio.Sound.createAsync(
        { uri: result.audioUri },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;
      setDuration(result.duration);
      setIsPlaying(true);
      setIsLoading(false);

      startProgressTracking();

    } catch (err) {
      console.log("TTS error:", err);
      setError("Failed to generate audio. Please try again.");
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      if (status.didJustFinish) {
        setIsPlaying(false);
        setProgress(1);
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
        }

        // Auto-advance to next track
        if (currentIndex < totalItems - 1) {
          setTimeout(() => {
            handleNext();
          }, 1500);
        } else {
          markPlaylistCompleted(playlistId);
        }
      }
    }
  };

  const startProgressTracking = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    progressInterval.current = setInterval(async () => {
      if (soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded && status.durationMillis) {
          const currentProgress = status.positionMillis / status.durationMillis;
          setProgress(currentProgress);
          setDuration(status.durationMillis / 1000);

          updatePlaybackProgress(
            playlistId,
            currentItem.id,
            status.positionMillis / 1000
          );
        }
      }
    }, 250);
  };

  const handleSeek = async (value: number) => {
    if (soundRef.current && duration > 0) {
      const positionMs = value * duration * 1000;
      await soundRef.current.setPositionAsync(positionMs);
      setProgress(value);
    }
  };

  const handlePrevious = async () => {
    if (currentIndex > 0) {
      await cleanup();
      setIsPlaying(false);
      setProgress(0);
      setDuration(0);
      setCurrentIndex(currentIndex - 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleNext = async () => {
    if (currentIndex < totalItems - 1) {
      await cleanup();
      setIsPlaying(false);
      setProgress(0);
      setDuration(0);
      setCurrentIndex(currentIndex + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleClose = async () => {
    await cleanup();
    navigation.goBack();
  };

  const currentVoice = VOICE_OPTIONS.find((v) => v.id === defaultVoice) || VOICE_OPTIONS[4];

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
            {isLoading ? (
              <>
                <ActivityIndicator color="white" size="large" />
                <Text className="text-white/70 text-base mt-4">
                  Generating audio...
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="book" size={100} color="rgba(255,255,255,0.3)" />
                <Text className="text-white/50 text-lg mt-4">
                  {currentIndex + 1} of {totalItems}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Error Message */}
        {error && (
          <View className="mx-8 mb-4 bg-red-500/20 rounded-xl p-3">
            <Text className="text-red-300 text-center">{error}</Text>
          </View>
        )}

        {/* Track Info */}
        <View className="px-8">
          <Text className="text-white text-2xl font-bold text-center" numberOfLines={2}>
            {currentItem.title}
          </Text>
          <Text className="text-white/60 text-center mt-2">
            {playlist.translation} • {currentVoice.name} voice
          </Text>
        </View>

        {/* Progress Bar */}
        <View className="px-8 mt-8">
          <Slider
            value={progress}
            onSlidingComplete={handleSeek}
            minimumValue={0}
            maximumValue={1}
            minimumTrackTintColor="#6366f1"
            maximumTrackTintColor="rgba(255,255,255,0.2)"
            thumbTintColor="#6366f1"
          />
          <View className="flex-row justify-between mt-1">
            <Text className="text-white/50 text-sm">
              {formatTime(progress * (duration || currentItem.estimatedDuration))}
            </Text>
            <Text className="text-white/50 text-sm">
              {formatTime(duration || currentItem.estimatedDuration)}
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
            disabled={isLoading}
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
