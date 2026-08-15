import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, Download, Headphones, Heart, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { AppModal } from "@/components/AppModal";
import { formatDuration } from "@/lib/cn";
import { getPlaylistById, usePlaylistStore } from "@/stores/playlistStore";
import { usePreferencesStore } from "@/stores/preferencesStore";
import {
  downloadPlaylistForOffline,
  getDownloadSizeEstimate,
  removeOfflinePlaylist,
  type DownloadProgress,
} from "@/services/offlineService";
import { analytics } from "@/services/analyticsService";

export default function PlaylistDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const playlists = usePlaylistStore((s) => s.playlists);
  const toggleFavorite = usePlaylistStore((s) => s.toggleFavorite);
  const deletePlaylist = usePlaylistStore((s) => s.deletePlaylist);
  const addToRecent = usePlaylistStore((s) => s.addToRecent);
  const defaultMode = usePreferencesStore((s) => s.defaultConsumptionMode);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const playlist = getPlaylistById(playlists, id);

  if (!playlist) {
    return (
      <div className="safe-top flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-2xl text-white">Playlist not found</p>
        <Link to="/library" className="mt-4 text-accent-soft">
          Back to Library
        </Link>
      </div>
    );
  }

  const open = (mode: "listen" | "read") => {
    addToRecent(playlist.id);
    navigate(`/${mode}/${playlist.id}`);
  };

  const handleDownload = async () => {
    if (playlist.isDownloaded) {
      await removeOfflinePlaylist(playlist.id);
      analytics.track("offline_removed", { playlistId: playlist.id });
      return;
    }
    setDownloadProgress({
      playlistId: playlist.id,
      current: 0,
      total: playlist.items.length,
      currentItem: "Starting…",
      isComplete: false,
    });
    const ok = await downloadPlaylistForOffline(playlist, setDownloadProgress);
    if (!ok) setError("Could not download all audio. Check your connection and try again.");
    else analytics.track("offline_downloaded", { playlistId: playlist.id });
    setDownloadProgress(null);
  };

  return (
    <div className="safe-top flex flex-1 flex-col pb-8">
      <header className="flex items-center justify-between gap-3 px-5 pb-4 pt-2">
        <button onClick={() => navigate(-1)} className="rounded-full bg-white/5 p-2 text-white">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/playlist/${playlist.id}/edit`)}
            className="rounded-full bg-white/5 p-2 text-white"
            aria-label="Edit"
          >
            <Pencil className="h-5 w-5" />
          </button>
          <button
            onClick={() => toggleFavorite(playlist.id)}
            className="rounded-full bg-white/5 p-2"
            aria-label="Favorite"
          >
            <Heart
              className={`h-5 w-5 ${playlist.isFavorite ? "fill-rose-400 text-rose-400" : "text-white"}`}
            />
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="rounded-full bg-white/5 p-2 text-white"
            aria-label="Delete"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="px-5 lg:mx-auto lg:w-full lg:max-w-3xl">
        <p className="text-sm uppercase tracking-[0.18em] text-accent-soft">Playlist</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-white">{playlist.title}</h1>
        <p className="mt-2 text-neutral-400">
          {playlist.items.length} passages · {formatDuration(playlist.totalDuration)} ·{" "}
          {playlist.translation}
          {playlist.isDownloaded ? " · Downloaded" : ""}
        </p>
        {playlist.description && (
          <p className="mt-3 text-sm leading-relaxed text-neutral-300">{playlist.description}</p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={() => open("listen")}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3.5 font-semibold text-white"
          >
            <Headphones className="h-5 w-5" />
            Listen
          </button>
          <button
            onClick={() => open("read")}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3.5 font-semibold text-white"
          >
            <BookOpen className="h-5 w-5" />
            Read
          </button>
        </div>

        <button
          onClick={() => open(defaultMode)}
          className="mt-3 w-full rounded-2xl border border-white/10 py-3 text-sm text-neutral-300"
        >
          Open with your default mode ({defaultMode})
        </button>

        <button
          onClick={() => void handleDownload()}
          disabled={!!downloadProgress}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 py-3 text-sm text-neutral-200 disabled:opacity-60"
        >
          <Download className="h-4 w-4" />
          {downloadProgress
            ? `Downloading ${downloadProgress.current}/${downloadProgress.total}…`
            : playlist.isDownloaded
              ? "Remove offline audio"
              : `Download for offline (~${getDownloadSizeEstimate(playlist)} MB)`}
        </button>

        <div className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold text-white">Passages</h2>
          {playlist.items.map((item, index) => (
            <div key={item.id} className="rounded-2xl border border-white/5 bg-ink-850/80 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="font-medium text-white">
                  {index + 1}. {item.title}
                </p>
                <span className="text-xs text-neutral-500">
                  {formatDuration(item.estimatedDuration)}
                  {item.isDownloaded ? " · saved" : ""}
                </span>
              </div>
              <p className="line-clamp-3 text-sm leading-relaxed text-neutral-400">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      <AppModal
        open={confirmDelete}
        title="Delete playlist?"
        message="This removes the playlist from this device. You can always create it again."
        confirmLabel="Delete"
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          deletePlaylist(playlist.id);
          navigate("/library", { replace: true });
        }}
      />
      <AppModal open={!!error} title="Download" message={error || ""} onClose={() => setError(null)} />
    </div>
  );
}
