import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  ConsumptionMode,
  PauseStyle,
  PlaybackSpeed,
  PlaylistMode,
  Translation,
} from "@/types/bible";

interface PreferencesState {
  defaultTranslation: Translation;
  defaultConsumptionMode: ConsumptionMode;
  defaultVoice: string;
  playbackSpeed: PlaybackSpeed;
  pauseStyle: PauseStyle;
  speakVerseNumbers: boolean;
  announceBookChapter: boolean;
  defaultPlaylistLength: number;
  preferredModes: PlaylistMode[];
  textSize: number;
  nightMode: boolean;
  showVerseNumbersInRead: boolean;
  hasCompletedOnboarding: boolean;
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

const defaults = {
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
      ...defaults,
      setDefaultTranslation: (defaultTranslation) => set({ defaultTranslation }),
      setDefaultConsumptionMode: (defaultConsumptionMode) => set({ defaultConsumptionMode }),
      setDefaultVoice: (defaultVoice) => set({ defaultVoice }),
      setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),
      setPauseStyle: (pauseStyle) => set({ pauseStyle }),
      setSpeakVerseNumbers: (speakVerseNumbers) => set({ speakVerseNumbers }),
      setAnnounceBookChapter: (announceBookChapter) => set({ announceBookChapter }),
      setDefaultPlaylistLength: (defaultPlaylistLength) => set({ defaultPlaylistLength }),
      setPreferredModes: (preferredModes) => set({ preferredModes }),
      setTextSize: (textSize) => set({ textSize }),
      setNightMode: (nightMode) => set({ nightMode }),
      setShowVerseNumbersInRead: (showVerseNumbersInRead) => set({ showVerseNumbersInRead }),
      setHasCompletedOnboarding: (hasCompletedOnboarding) => set({ hasCompletedOnboarding }),
      resetPreferences: () => set(defaults),
    }),
    {
      name: "davar-web-preferences",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
