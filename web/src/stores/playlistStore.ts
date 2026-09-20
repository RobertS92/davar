import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Playlist } from "@/types/bible";
import {
  deletePlaylistFromBackend,
  fetchPlaylistsFromBackend,
  mergePlaylists,
  syncPlaylistToBackend,
} from "@/services/playlistSync";
import { getAccessToken, isBackendConfigured } from "@/lib/api";

interface PlaylistState {
  playlists: Playlist[];
  recentPlaylistIds: string[];
  currentPlaylistId: string | null;
  currentItemIndex: number;
  isPlaying: boolean;
  syncStatus: "idle" | "syncing" | "synced" | "offline";
  addPlaylist: (playlist: Playlist) => void;
  updatePlaylist: (id: string, updates: Partial<Playlist>) => void;
  deletePlaylist: (id: string) => void;
  toggleFavorite: (id: string) => void;
  setCurrentPlaylist: (id: string | null) => void;
  setCurrentItemIndex: (index: number) => void;
  setIsPlaying: (playing: boolean) => void;
  updatePlaybackProgress: (playlistId: string, itemId: string, position: number) => void;
  markPlaylistCompleted: (id: string) => void;
  addToRecent: (id: string) => void;
  hydrateFromBackend: () => Promise<void>;
  setSyncStatus: (status: PlaylistState["syncStatus"]) => void;
}

function canSync(): boolean {
  return isBackendConfigured() && !!getAccessToken();
}

function queueSync(playlist: Playlist) {
  if (!canSync()) return;
  void syncPlaylistToBackend(playlist);
}

export const usePlaylistStore = create<PlaylistState>()(
  persist(
    (set, get) => ({
      playlists: [],
      recentPlaylistIds: [],
      currentPlaylistId: null,
      currentItemIndex: 0,
      isPlaying: false,
      syncStatus: "idle",

      setSyncStatus: (syncStatus) => set({ syncStatus }),

      addPlaylist: (playlist) => {
        set((state) => ({ playlists: [playlist, ...state.playlists] }));
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
        if (canSync()) void deletePlaylistFromBackend(id);
      },

      toggleFavorite: (id) => {
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
          ),
        }));
        const updated = get().playlists.find((p) => p.id === id);
        if (updated) queueSync(updated);
      },

      setCurrentPlaylist: (id) => set({ currentPlaylistId: id, currentItemIndex: 0 }),
      setCurrentItemIndex: (index) => set({ currentItemIndex: index }),
      setIsPlaying: (playing) => set({ isPlaying: playing }),

      updatePlaybackProgress: (playlistId, itemId, position) => {
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
        }));
        const updated = get().playlists.find((p) => p.id === playlistId);
        if (updated) queueSync(updated);
      },

      markPlaylistCompleted: (id) => {
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === id ? { ...p, completedCount: p.completedCount + 1 } : p
          ),
        }));
        const updated = get().playlists.find((p) => p.id === id);
        if (updated) queueSync(updated);
      },

      addToRecent: (id) =>
        set((state) => {
          const filtered = state.recentPlaylistIds.filter((rid) => rid !== id);
          return { recentPlaylistIds: [id, ...filtered].slice(0, 10) };
        }),

      hydrateFromBackend: async () => {
        if (!canSync()) {
          set({ syncStatus: isBackendConfigured() ? "idle" : "offline" });
          return;
        }
        set({ syncStatus: "syncing" });
        try {
          const remote = await fetchPlaylistsFromBackend();
          const merged = mergePlaylists(get().playlists, remote);
          set({ playlists: merged, syncStatus: "synced" });
          for (const playlist of merged) {
            const onRemote = remote.some((r) => r.id === playlist.id);
            if (!onRemote) await syncPlaylistToBackend(playlist);
          }
        } catch {
          set({ syncStatus: "offline" });
        }
      },
    }),
    {
      name: "davar-web-playlists",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        playlists: state.playlists,
        recentPlaylistIds: state.recentPlaylistIds,
      }),
    }
  )
);

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
