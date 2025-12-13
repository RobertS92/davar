import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Playlist } from "../types/bible";

interface PlaylistState {
  playlists: Playlist[];
  recentPlaylistIds: string[];
  currentPlaylistId: string | null;
  currentItemIndex: number;
  isPlaying: boolean;

  // Actions
  addPlaylist: (playlist: Playlist) => void;
  updatePlaylist: (id: string, updates: Partial<Playlist>) => void;
  deletePlaylist: (id: string) => void;
  toggleFavorite: (id: string) => void;

  // Playback state
  setCurrentPlaylist: (id: string | null) => void;
  setCurrentItemIndex: (index: number) => void;
  setIsPlaying: (playing: boolean) => void;

  // Progress tracking
  updatePlaybackProgress: (playlistId: string, itemId: string, position: number) => void;
  markPlaylistCompleted: (id: string) => void;

  // Recent playlists
  addToRecent: (id: string) => void;
}

export const usePlaylistStore = create<PlaylistState>()(
  persist(
    (set) => ({
      playlists: [],
      recentPlaylistIds: [],
      currentPlaylistId: null,
      currentItemIndex: 0,
      isPlaying: false,

      addPlaylist: (playlist) =>
        set((state) => ({
          playlists: [playlist, ...state.playlists]
        })),

      updatePlaylist: (id, updates) =>
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
        })),

      deletePlaylist: (id) =>
        set((state) => ({
          playlists: state.playlists.filter((p) => p.id !== id),
          recentPlaylistIds: state.recentPlaylistIds.filter((rid) => rid !== id),
        })),

      toggleFavorite: (id) =>
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
          ),
        })),

      setCurrentPlaylist: (id) =>
        set({ currentPlaylistId: id, currentItemIndex: 0 }),

      setCurrentItemIndex: (index) =>
        set({ currentItemIndex: index }),

      setIsPlaying: (playing) =>
        set({ isPlaying: playing }),

      updatePlaybackProgress: (playlistId, itemId, position) =>
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === playlistId
              ? {
                  ...p,
                  lastPlayedAt: new Date().toISOString(),
                  lastPlayedItemId: itemId,
                  lastPlayedPosition: position,
                }
              : p
          ),
        })),

      markPlaylistCompleted: (id) =>
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === id
              ? { ...p, completedCount: p.completedCount + 1 }
              : p
          ),
        })),

      addToRecent: (id) =>
        set((state) => {
          const filtered = state.recentPlaylistIds.filter((rid) => rid !== id);
          return {
            recentPlaylistIds: [id, ...filtered].slice(0, 10),
          };
        }),
    }),
    {
      name: "scripture-playlists",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Helper functions to derive data outside of components
// These should be called with the raw data from selectors
export function getPlaylistById(playlists: Playlist[], id: string): Playlist | undefined {
  return playlists.find((p) => p.id === id);
}

export function getFavorites(playlists: Playlist[]): Playlist[] {
  return playlists.filter((p) => p.isFavorite);
}

export function getRecentPlaylists(playlists: Playlist[], recentIds: string[]): Playlist[] {
  return recentIds
    .map((id) => playlists.find((p) => p.id === id))
    .filter((p): p is Playlist => p !== undefined);
}

export function getDownloadedPlaylists(playlists: Playlist[]): Playlist[] {
  return playlists.filter((p) => p.isDownloaded);
}
