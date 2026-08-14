import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Playlist } from "../types/bible";
import { playlistSyncService } from "../services/playlistSyncService";

interface PlaylistState {
  playlists: Playlist[];
  recentPlaylistIds: string[];
  currentPlaylistId: string | null;
  currentItemIndex: number;
  isPlaying: boolean;
  lastSyncAt: string | null;
  syncStatus: "idle" | "syncing" | "error" | "success";
  syncError: string | null;

  // Actions
  addPlaylist: (playlist: Playlist) => void;
  updatePlaylist: (id: string, updates: Partial<Playlist>) => void;
  deletePlaylist: (id: string) => void;
  toggleFavorite: (id: string) => void;
  replacePlaylists: (playlists: Playlist[]) => void;

  // Playback state
  setCurrentPlaylist: (id: string | null) => void;
  setCurrentItemIndex: (index: number) => void;
  setIsPlaying: (playing: boolean) => void;

  // Progress tracking
  updatePlaybackProgress: (playlistId: string, itemId: string, position: number) => void;
  markPlaylistCompleted: (id: string) => void;

  // Recent playlists
  addToRecent: (id: string) => void;

  // Cloud sync
  syncWithCloud: () => Promise<boolean>;
}

function queueSync(playlist: Playlist) {
  void playlistSyncService.syncPlaylist(playlist);
}

export const usePlaylistStore = create<PlaylistState>()(
  persist(
    (set, get) => ({
      playlists: [],
      recentPlaylistIds: [],
      currentPlaylistId: null,
      currentItemIndex: 0,
      isPlaying: false,
      lastSyncAt: null,
      syncStatus: "idle",
      syncError: null,

      addPlaylist: (playlist) => {
        set((state) => ({
          playlists: [playlist, ...state.playlists],
        }));
        queueSync(playlist);
      },

      updatePlaylist: (id, updates) => {
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
        }));
        const updated = get().playlists.find((p) => p.id === id);
        if (updated) queueSync(updated);
      },

      deletePlaylist: (id) => {
        set((state) => ({
          playlists: state.playlists.filter((p) => p.id !== id),
          recentPlaylistIds: state.recentPlaylistIds.filter((rid) => rid !== id),
        }));
        void playlistSyncService.deletePlaylist(id);
      },

      toggleFavorite: (id) => {
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === id ? { ...p, isFavorite: !p.isFavorite, updatedAt: new Date().toISOString() } : p
          ),
        }));
        const updated = get().playlists.find((p) => p.id === id);
        if (updated) queueSync(updated);
      },

      replacePlaylists: (playlists) => set({ playlists }),

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

      syncWithCloud: async () => {
        set({ syncStatus: "syncing", syncError: null });
        const local = get().playlists;
        const pushResult = await playlistSyncService.syncAll(local);

        if (!pushResult.ok) {
          set({ syncStatus: "error", syncError: pushResult.error });
          return false;
        }

        const remote = await playlistSyncService.fetchRemotePlaylists();
        const merged = playlistSyncService.mergePlaylists(get().playlists, remote);
        set({
          playlists: merged,
          lastSyncAt: new Date().toISOString(),
          syncStatus: "success",
          syncError: null,
        });
        return true;
      },
    }),
    {
      name: "scripture-playlists",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        playlists: state.playlists,
        recentPlaylistIds: state.recentPlaylistIds,
        lastSyncAt: state.lastSyncAt,
      }),
    }
  )
);

// Helper functions to derive data outside of components
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
