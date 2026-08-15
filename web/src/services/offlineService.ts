import type { Playlist, PlaylistItem } from "@/types/bible";
import { generatePlaylistItemAudio, type TTSVoice } from "@/services/ttsService";
import { usePlaylistStore } from "@/stores/playlistStore";
import { usePreferencesStore } from "@/stores/preferencesStore";

export interface DownloadProgress {
  playlistId: string;
  current: number;
  total: number;
  currentItem: string;
  isComplete: boolean;
  error?: string;
}

export async function downloadPlaylistForOffline(
  playlist: Playlist,
  onProgress?: (progress: DownloadProgress) => void
): Promise<boolean> {
  const preferences = usePreferencesStore.getState();
  const updatePlaylist = usePlaylistStore.getState().updatePlaylist;

  try {
    const total = playlist.items.length;
    const downloadedItems: PlaylistItem[] = [];

    for (let i = 0; i < playlist.items.length; i++) {
      const item = playlist.items[i];
      onProgress?.({
        playlistId: playlist.id,
        current: i + 1,
        total,
        currentItem: item.title,
        isComplete: false,
      });

      try {
        const result = await generatePlaylistItemAudio(item.title, item.text, {
          voice: preferences.defaultVoice as TTSVoice,
          speed: preferences.playbackSpeed,
          announceTitle: preferences.announceBookChapter,
        });

        downloadedItems.push({
          ...item,
          audioUri: `idb:${result.cacheKey}`,
          estimatedDuration: result.duration || item.estimatedDuration,
          isDownloaded: true,
        });
      } catch {
        downloadedItems.push(item);
      }
    }

    updatePlaylist(playlist.id, {
      items: downloadedItems,
      isDownloaded: downloadedItems.every((i) => i.isDownloaded),
    });

    onProgress?.({
      playlistId: playlist.id,
      current: total,
      total,
      currentItem: "Complete",
      isComplete: true,
    });

    return true;
  } catch (error) {
    onProgress?.({
      playlistId: playlist.id,
      current: 0,
      total: playlist.items.length,
      currentItem: "Failed",
      isComplete: false,
      error: error instanceof Error ? error.message : "Download failed",
    });
    return false;
  }
}

export async function removeOfflinePlaylist(playlistId: string): Promise<void> {
  const updatePlaylist = usePlaylistStore.getState().updatePlaylist;
  const playlist = usePlaylistStore.getState().playlists.find((p) => p.id === playlistId);
  if (!playlist) return;

  updatePlaylist(playlistId, {
    items: playlist.items.map((item) => ({
      ...item,
      isDownloaded: false,
      audioUri: undefined,
    })),
    isDownloaded: false,
  });
}

export function getDownloadSizeEstimate(playlist: Playlist): number {
  return Math.max(1, Math.ceil(playlist.totalDuration / 60));
}
