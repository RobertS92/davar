import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { AppModal } from "@/components/AppModal";
import { parseReferences } from "@/services/bibleParser";
import { compilePlaylist } from "@/services/playlistCompiler";
import { usePlaylistStore } from "@/stores/playlistStore";
import { usePreferencesStore } from "@/stores/preferencesStore";
import { isNivAvailable } from "@/lib/api";

export default function CreateManualPage() {
  const navigate = useNavigate();
  const addPlaylist = usePlaylistStore((s) => s.addPlaylist);
  const addToRecent = usePlaylistStore((s) => s.addToRecent);
  const translation = usePreferencesStore((s) => s.defaultTranslation);

  const [title, setTitle] = useState("");
  const [refsText, setRefsText] = useState("John 3:16\nPsalm 23\nRomans 8:28-39");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { references, errors } = parseReferences(refsText);
      if (!references.length) {
        setError(errors[0] || "Enter at least one valid Bible reference.");
        return;
      }
      const playlist = await compilePlaylist({
        title: title.trim() || "My Playlist",
        references,
        translation: translation === "NIV" && !isNivAvailable() ? "KJV" : translation,
        sourceType: "manual",
        tags: ["manual"],
      });
      if (!playlist.items.length) {
        setError("No verses were found for those references.");
        return;
      }
      addPlaylist(playlist);
      addToRecent(playlist.id);
      navigate(`/playlist/${playlist.id}`, { replace: true });
    } catch {
      setError("Could not create playlist. Check your references and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="safe-top flex flex-1 flex-col pb-8">
      <header className="flex items-center gap-3 px-5 pb-4 pt-2">
        <Link to="/" className="rounded-full bg-white/5 p-2 text-white">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="font-display text-2xl font-semibold">Manual Entry</p>
          <p className="text-sm text-neutral-400">Verse, range, chapter, or book</p>
        </div>
      </header>

      <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-4 px-5 lg:max-w-xl">
        <label className="block">
          <span className="mb-2 block text-sm text-neutral-400">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Morning strength"
            className="w-full rounded-2xl border border-white/10 bg-ink-850 px-4 py-3 text-white outline-none focus:border-accent"
          />
        </label>

        <label className="block flex-1">
          <span className="mb-2 block text-sm text-neutral-400">References</span>
          <textarea
            value={refsText}
            onChange={(e) => setRefsText(e.target.value)}
            rows={10}
            className="w-full resize-none rounded-2xl border border-white/10 bg-ink-850 px-4 py-3 text-white outline-none focus:border-accent"
          />
        </label>

        <p className="text-xs text-neutral-500">
          Examples: John 3:16 · Psalm 23 · Romans 8:28-39 · James
        </p>

        <button
          type="submit"
          disabled={loading}
          className="rounded-2xl bg-accent px-4 py-3.5 font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Building playlist…" : "Create playlist"}
        </button>
      </form>

      <AppModal open={!!error} title="Could not create playlist" message={error || ""} onClose={() => setError(null)} />
    </div>
  );
}
