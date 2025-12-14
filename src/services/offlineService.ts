import { Playlist, PlaylistItem } from "../types/bible";
import { generatePlaylistItemAudio } from "./ttsService";
import { usePlaylistStore } from "../state/playlistStore";
import { usePreferencesStore } from "../state/preferencesStore";

export interface DownloadProgress {
  playlistId: string;
  current: number;
  total: number;
  currentItem: string;
  isComplete: boolean;
  error?: string;
}

/**
 * Download all audio for a playlist for offline use
 */
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

      // Report progress
      onProgress?.({
        playlistId: playlist.id,
        current: i + 1,
        total,
        currentItem: item.title,
        isComplete: false,
      });

      try {
        // Generate TTS audio if not already cached
        const result = await generatePlaylistItemAudio(
          item.title,
          item.text,
          {
            voice: preferences.defaultVoice as any,
            speed: preferences.playbackSpeed,
            announceTitle: preferences.announceBookChapter,
            speakVerseNumbers: preferences.speakVerseNumbers,
          }
        );

        // Update item with audio URI and mark as downloaded
        downloadedItems.push({
          ...item,
          audioUri: result.audioUri,
          estimatedDuration: result.duration,
          isDownloaded: true,
        });
      } catch (error) {
        console.error(`Failed to download item ${item.id}:`, error);
        // Continue with other items even if one fails
        downloadedItems.push(item);
      }
    }

    // Update the playlist with downloaded items
    updatePlaylist(playlist.id, {
      items: downloadedItems,
      isDownloaded: true,
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
    console.error("Download failed:", error);
    onProgress?.({
      playlistId: playlist.id,
      current: 0,
      total: playlist.items.length,
      currentItem: "Failed",
      isComplete: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return false;
  }
}

/**
 * Remove downloaded audio for a playlist
 */
export async function removeOfflinePlaylist(playlistId: string): Promise<void> {
  const updatePlaylist = usePlaylistStore.getState().updatePlaylist;
  const playlists = usePlaylistStore.getState().playlists;
  const playlist = playlists.find((p) => p.id === playlistId);

  if (!playlist) return;

  // Update playlist to mark as not downloaded
  // The actual audio files stay in cache for efficiency
  const items = playlist.items.map((item) => ({
    ...item,
    isDownloaded: false,
  }));

  updatePlaylist(playlistId, {
    items,
    isDownloaded: false,
  });
}

/**
 * Check if a playlist is fully downloaded
 */
export function isPlaylistFullyDownloaded(playlist: Playlist): boolean {
  return playlist.isDownloaded && playlist.items.every((item) => item.isDownloaded);
}

/**
 * Get download size estimate for a playlist (in MB)
 */
export function getDownloadSizeEstimate(playlist: Playlist): number {
  // Rough estimate: ~1MB per minute of audio
  const durationMinutes = playlist.totalDuration / 60;
  return Math.ceil(durationMinutes);
}
