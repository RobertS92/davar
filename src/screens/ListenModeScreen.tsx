import React, { useState, useEffect, useRef, useMemo } from "react";
import { View, Text, Pressable, Dimensions, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Slider from "@react-native-community/slider";
import { Audio, AVPlaybackStatus } from "expo-av";
import * as Haptics from "expo-haptics";

import { RootStackParamList } from "../navigation/RootNavigator";
import { usePlaylistStore, getPlaylistById } from "../state/playlistStore";
import { usePreferencesStore } from "../state/preferencesStore";
import { generatePlaylistItemAudio, TTSVoice, VOICE_OPTIONS } from "../services/ttsService";
import { PlaylistItem, BibleVerse } from "../types/bible";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, "ListenMode">;

const { width } = Dimensions.get("window");

export default function ListenModeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();

  const playlistId = route.params.playlistId;
  const startFromItem = route.params?.startFromItem;

  const playlists = usePlaylistStore((s) => s.playlists);
  const markPlaylistCompleted = usePlaylistStore((s) => s.markPlaylistCompleted);

  const playlist = useMemo(
    () => getPlaylistById(playlists, playlistId),
    [playlists, playlistId]
  );

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

  // Use refs to avoid stale closure issues
  const soundRef = useRef<Audio.Sound | null>(null);
  const currentIndexRef = useRef(currentIndex);
  const isLoadingRef = useRef(isLoading);
  const hasStartedRef = useRef(false);
  const shouldContinuePlayingRef = useRef(true);

  // Keep refs in sync with state
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  // Get total items
  const totalItems = playlist?.items.length || 0;

  // Setup audio mode on mount
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        console.log("Audio mode configured successfully");
      } catch (err) {
        console.log("Error configuring audio mode:", err);
      }
    };

    setupAudio();

    return () => {
      shouldContinuePlayingRef.current = false;
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Handle start from specific item
  useEffect(() => {
    if (startFromItem && playlist) {
      const index = playlist.items.findIndex((item: PlaylistItem) => item.id === startFromItem);
      if (index >= 0) {
        setCurrentIndex(index);
        currentIndexRef.current = index;
      }
    }
  }, [startFromItem, playlist]);

  // Auto-play on mount - only once
  useEffect(() => {
    if (playlist && !hasStartedRef.current) {
      hasStartedRef.current = true;
      const timer = setTimeout(() => {
        playTrack(currentIndexRef.current);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [playlist]);

  if (!playlist) {
    return (
      <View className="flex-1 bg-neutral-950 items-center justify-center">
        <Text className="text-white text-lg">Playlist not found</Text>
      </View>
    );
  }

  const currentItem = playlist.items[currentIndex];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const prepareText = (item: PlaylistItem) => {
    let text = "";

    if (speakVerseNumbers && item.verses) {
      item.verses.forEach((verse: BibleVerse) => {
        text += `Verse ${verse.verse}. ${verse.text} `;
      });
    } else {
      text = item.text || "";
    }

    return text;
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        console.log("Playback error:", status.error);
        setError("Playback error occurred");
        setIsPlaying(false);
      }
      return;
    }

    // Update progress
    if (status.durationMillis && status.durationMillis > 0) {
      const currentProgress = status.positionMillis / status.durationMillis;
      setProgress(currentProgress);
      setDuration(status.durationMillis / 1000);
    }

    // Handle playback finished - auto advance to next track
    if (status.didJustFinish && !status.isLooping) {
      console.log("Track finished, advancing to next...");
      setIsPlaying(false);
      setProgress(0);

      const nextIndex = currentIndexRef.current + 1;

      if (nextIndex < totalItems && shouldContinuePlayingRef.current) {
        // Auto-play next track
        setTimeout(() => {
          setCurrentIndex(nextIndex);
          currentIndexRef.current = nextIndex;
          playTrack(nextIndex);
        }, 800);
      } else {
        // Playlist complete
        console.log("Playlist completed");
        markPlaylistCompleted(playlistId);
      }
    }
  };

  const playTrack = async (index: number) => {
    if (isLoadingRef.current) {
      console.log("Already loading, skipping...");
      return;
    }

    const item = playlist.items[index];
    if (!item) {
      console.log("No item at index:", index);
      return;
    }

    console.log("Playing track:", index, item.title);
    setIsLoading(true);
    isLoadingRef.current = true;
    setError(null);
    setProgress(0);

    try {
      // Cleanup any existing sound first
      if (soundRef.current) {
        console.log("Unloading previous sound");
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const text = prepareText(item);
      console.log("Preparing audio for:", item.title, "text length:", text.length);

      if (!text || text.length === 0) {
        throw new Error("No text to speak");
      }

      const voice = (defaultVoice as TTSVoice) || "nova";

      const result = await generatePlaylistItemAudio(
        item.title,
        text,
        {
          voice,
          speed: playbackSpeed,
          announceTitle: announceBookChapter,
        }
      );

      console.log("Audio generated, URI:", result.audioUri);

      // Create and load the sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: result.audioUri },
        {
          shouldPlay: true,
          progressUpdateIntervalMillis: 500,
        },
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;
      setDuration(result.duration);
      setIsPlaying(true);
      setIsLoading(false);
      isLoadingRef.current = false;

      console.log("Playback started successfully for:", item.title);

    } catch (err) {
      console.log("TTS/Playback error:", err);
      setError("Failed to play audio. Please try again.");
      setIsLoading(false);
      isLoadingRef.current = false;
      setIsPlaying(false);
    }
  };

  const handlePlayPause = async () => {
    if (isLoading) return;

    if (isPlaying && soundRef.current) {
      console.log("Pausing playback");
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
      return;
    }

    // If we have a paused sound, resume it
    if (soundRef.current && !isPlaying) {
      try {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded && status.positionMillis > 0) {
          console.log("Resuming playback");
          await soundRef.current.playAsync();
          setIsPlaying(true);
          return;
        }
      } catch (err) {
        console.log("Error checking sound status:", err);
      }
    }

    // Start fresh
    playTrack(currentIndex);
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
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      currentIndexRef.current = newIndex;
      setIsPlaying(false);
      setProgress(0);
      setDuration(0);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Auto-play previous track
      setTimeout(() => {
        playTrack(newIndex);
      }, 300);
    }
  };

  const handleNext = async () => {
    if (currentIndex < totalItems - 1) {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      currentIndexRef.current = newIndex;
      setIsPlaying(false);
      setProgress(0);
      setDuration(0);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Auto-play next track
      setTimeout(() => {
        playTrack(newIndex);
      }, 300);
    }
  };

  const handleClose = async () => {
    shouldContinuePlayingRef.current = false;
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
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
            onPress={handlePlayPause}
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
