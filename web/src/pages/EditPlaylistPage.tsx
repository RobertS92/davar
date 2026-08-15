import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { PlaylistItem } from "@/types/bible";
import { AppModal } from "@/components/AppModal";
import { parseReferences } from "@/services/bibleParser";
import { compilePlaylist } from "@/services/playlistCompiler";
import { getPlaylistById, usePlaylistStore } from "@/stores/playlistStore";
import { usePreferencesStore } from "@/stores/preferencesStore";
import { analytics } from "@/services/analyticsService";

export default function EditPlaylistPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const playlists = usePlaylistStore((s) => s.playlists);
  const updatePlaylist = usePlaylistStore((s) => s.updatePlaylist);
  const translation = usePreferencesStore((s) => s.defaultTranslation);

  const playlist = useMemo(() => getPlaylistById(playlists, id), [playlists, id]);
  const [title, setTitle] = useState(playlist?.title ?? "");
  const [items, setItems] = useState<PlaylistItem[]>(playlist?.items ?? []);
  const [addText, setAddText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!playlist) {
    return (
      <div className="safe-top flex flex-1 items-center justify-center px-6 text-center">
        <div>
          <p className="font-display text-2xl">Playlist not found</p>
          <Link to="/library" className="mt-3 inline-block text-accent-soft">
            Back to Library
          </Link>
        </div>
      </div>
    );
  }

  const save = () => {
    const totalDuration = items.reduce((sum, item) => sum + item.estimatedDuration, 0);
    updatePlaylist(playlist.id, { title: title.trim() || playlist.title, items, totalDuration });
    analytics.track("playlist_edited", { playlistId: playlist.id, itemCount: items.length });
    navigate(`/playlist/${playlist.id}`, { replace: true });
  };

  const move = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= items.length) return;
    const copy = [...items];
    [copy[index], copy[next]] = [copy[next], copy[index]];
    setItems(copy);
  };

  const addPassages = async (e: FormEvent) => {
    e.preventDefault();
    if (!addText.trim()) return;
    setBusy(true);
    try {
      const { references, errors } = parseReferences(addText);
      if (!references.length) {
        setError(errors[0] || "Enter a valid Bible reference.");
        return;
      }
      const compiled = await compilePlaylist({
        title: "temp",
        references,
        translation: translation === "NIV" ? translation : "KJV",
        sourceType: "manual",
        tags: [],
      });
      setItems((prev) => [...prev, ...compiled.items]);
      setAddText("");
    } catch {
      setError("Could not add those passages.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="safe-top flex flex-1 flex-col pb-8">
      <header className="flex items-center justify-between gap-3 border-b border-white/5 px-5 pb-4 pt-2">
        <button onClick={() => navigate(-1)} className="text-neutral-400">
          Cancel
        </button>
        <p className="font-semibold text-white">Edit Playlist</p>
        <button onClick={save} className="font-semibold text-accent-soft">
          Save
        </button>
      </header>

      <div className="space-y-6 px-5 pt-6 lg:mx-auto lg:w-full lg:max-w-2xl">
        <label className="block">
          <span className="mb-2 block text-sm text-neutral-400">Playlist title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-ink-850 px-4 py-3 text-white outline-none focus:border-accent"
          />
        </label>

        <div>
          <p className="mb-3 text-sm font-medium text-white">Passages ({items.length})</p>
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={item.id} className="rounded-2xl border border-white/5 bg-ink-850 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-sm text-accent-soft">
                    {index + 1}
                  </span>
                  <p className="flex-1 font-medium text-white">{item.title}</p>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    className="rounded-lg bg-white/5 p-2 disabled:opacity-30"
                    aria-label="Move up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => move(index, 1)}
                    disabled={index === items.length - 1}
                    className="rounded-lg bg-white/5 p-2 disabled:opacity-30"
                    aria-label="Move down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setItems(items.filter((i) => i.id !== item.id))}
                    className="rounded-lg bg-red-500/20 p-2 text-red-400"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <p className="py-8 text-center text-neutral-500">No passages in playlist</p>
            )}
          </div>
        </div>

        <form onSubmit={addPassages} className="rounded-2xl border border-white/10 bg-ink-850 p-4">
          <p className="mb-2 text-sm font-medium text-white">Add passages</p>
          <textarea
            value={addText}
            onChange={(e) => setAddText(e.target.value)}
            rows={3}
            placeholder="John 3:16&#10;Psalm 23"
            className="mb-3 w-full resize-none rounded-xl border border-white/10 bg-ink-900 px-3 py-2 text-sm text-white outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={busy || !addText.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {busy ? "Adding…" : "Add"}
          </button>
        </form>
      </div>

      <AppModal open={!!error} title="Edit playlist" message={error || ""} onClose={() => setError(null)} />
    </div>
  );
}
