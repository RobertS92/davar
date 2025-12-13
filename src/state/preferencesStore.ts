import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Translation,
  ConsumptionMode,
  PlaybackSpeed,
  PauseStyle,
  PlaylistMode
} from "../types/bible";

interface PreferencesState {
  // Core preferences
  defaultTranslation: Translation;
  defaultConsumptionMode: ConsumptionMode;

  // Voice settings
  defaultVoice: string;
  playbackSpeed: PlaybackSpeed;
  pauseStyle: PauseStyle;
  speakVerseNumbers: boolean;
  announceBookChapter: boolean;

  // Playlist defaults
  defaultPlaylistLength: number;
  preferredModes: PlaylistMode[];

  // Reading preferences
  textSize: number;
  nightMode: boolean;
  showVerseNumbersInRead: boolean;

  // App state
  hasCompletedOnboarding: boolean;

  // Actions
  setDefaultTranslation: (translation: Translation) => void;
  setDefaultConsumptionMode: (mode: ConsumptionMode) => void;
  setDefaultVoice: (voice: string) => void;
  setPlaybackSpeed: (speed: PlaybackSpeed) => void;
  setPauseStyle: (style: PauseStyle) => void;
  setSpeakVerseNumbers: (speak: boolean) => void;
  setAnnounceBookChapter: (announce: boolean) => void;
  setDefaultPlaylistLength: (length: number) => void;
  setPreferredModes: (modes: PlaylistMode[]) => void;
  setTextSize: (size: number) => void;
  setNightMode: (night: boolean) => void;
  setShowVerseNumbersInRead: (show: boolean) => void;
  setHasCompletedOnboarding: (completed: boolean) => void;
  resetPreferences: () => void;
}

const defaultPreferences = {
  defaultTranslation: "KJV" as Translation,
  defaultConsumptionMode: "listen" as ConsumptionMode,
  defaultVoice: "alloy",
  playbackSpeed: 1.0 as PlaybackSpeed,
  pauseStyle: "medium" as PauseStyle,
  speakVerseNumbers: false,
  announceBookChapter: true,
  defaultPlaylistLength: 15,
  preferredModes: ["bedtime", "commute"] as PlaylistMode[],
  textSize: 18,
  nightMode: true,
  showVerseNumbersInRead: true,
  hasCompletedOnboarding: false,
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      ...defaultPreferences,

      setDefaultTranslation: (translation) =>
        set({ defaultTranslation: translation }),
      setDefaultConsumptionMode: (mode) =>
        set({ defaultConsumptionMode: mode }),
      setDefaultVoice: (voice) =>
        set({ defaultVoice: voice }),
      setPlaybackSpeed: (speed) =>
        set({ playbackSpeed: speed }),
      setPauseStyle: (style) =>
        set({ pauseStyle: style }),
      setSpeakVerseNumbers: (speak) =>
        set({ speakVerseNumbers: speak }),
      setAnnounceBookChapter: (announce) =>
        set({ announceBookChapter: announce }),
      setDefaultPlaylistLength: (length) =>
        set({ defaultPlaylistLength: length }),
      setPreferredModes: (modes) =>
        set({ preferredModes: modes }),
      setTextSize: (size) =>
        set({ textSize: size }),
      setNightMode: (night) =>
        set({ nightMode: night }),
      setShowVerseNumbersInRead: (show) =>
        set({ showVerseNumbersInRead: show }),
      setHasCompletedOnboarding: (completed) =>
        set({ hasCompletedOnboarding: completed }),
      resetPreferences: () =>
        set(defaultPreferences),
    }),
    {
      name: "scripture-preferences",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
