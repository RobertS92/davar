import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import type { PlaylistTone } from "@/types/bible";
import { AppModal } from "@/components/AppModal";
import { parseReferences } from "@/services/bibleParser";
import { compilePlaylist } from "@/services/playlistCompiler";
import { generatePlaylistWithAI, MODE_REFERENCES } from "@/services/playlistGenerator";
import { usePlaylistStore } from "@/stores/playlistStore";
import { usePreferencesStore } from "@/stores/preferencesStore";
import { analytics } from "@/services/analyticsService";
import { cn } from "@/lib/cn";
import { isNivAvailable } from "@/lib/api";

const TONES: PlaylistTone[] = [
  "comfort",
  "correction",
  "wisdom",
  "faith",
  "endurance",
  "repentance",
  "gratitude",
];

export default function CreatePromptPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const mode = params.get("mode") || undefined;

  const addPlaylist = usePlaylistStore((s) => s.addPlaylist);
  const addToRecent = usePlaylistStore((s) => s.addToRecent);
  const translation = usePreferencesStore((s) => s.defaultTranslation);
  const defaultLength = usePreferencesStore((s) => s.defaultPlaylistLength);

  const modePack = mode ? MODE_REFERENCES[mode] : undefined;

  const [prompt, setPrompt] = useState(
    modePack
      ? `Create a ${modePack.title} playlist`
      : "I need peace and strength for a hard week"
  );
  const [tones, setTones] = useState<PlaylistTone[]>(mode === "bedtime" ? ["comfort"] : []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planPreview, setPlanPreview] = useState<string[] | null>(null);

  const helper = useMemo(() => {
    if (modePack) return `Mode: ${modePack.title}`;
    return "Describe a situation, emotion, or topic";
  }, [modePack]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPlanPreview(null);
    try {
      let title = modePack?.title || "Scripture Playlist";
      let referencesText = modePack?.references.join("\n") || "";
      let tags = modePack?.tags || ["prompt"];
      let explanation: string[] = [];

      if (!modePack) {
        const plan = await generatePlaylistWithAI({
          prompt,
          targetLength: defaultLength,
          tones,
          translation: translation === "NIV" && !isNivAvailable() ? "KJV" : translation,
        });
        title = plan.title;
        referencesText = plan.references.join("\n");
        explanation = plan.explanation;
        setPlanPreview(plan.explanation);
        analytics.track("ai_playlist_generated", { mode: mode || "prompt" });
      }

      const { references, errors } = parseReferences(referencesText);
      if (!references.length) {
        setError(errors[0] || "No passages could be selected.");
        return;
      }

      const playlist = await compilePlaylist({
        title,
        references,
        translation: translation === "NIV" && !isNivAvailable() ? "KJV" : translation,
        sourceType: "prompt",
        promptUsed: prompt,
        tags,
        description: explanation.join(" ") || undefined,
      });

      addPlaylist(playlist);
      addToRecent(playlist.id);
      navigate(`/playlist/${playlist.id}`, { replace: true });
    } catch {
      setError("Could not generate a playlist. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="safe-top flex flex-1 flex-col pb-8">
      <header className="flex items-center gap-3 px-5 pb-4 pt-2">
        <Link to={mode ? "/modes" : "/"} className="rounded-full bg-white/5 p-2 text-white">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="font-display text-2xl font-semibold">Create with AI</p>
          <p className="text-sm text-neutral-400">{helper}</p>
        </div>
      </header>

      <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-4 px-5 lg:max-w-xl">
        <label className="block">
          <span className="mb-2 block text-sm text-neutral-400">What do you need?</span>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            className="w-full resize-none rounded-2xl border border-white/10 bg-ink-850 px-4 py-3 text-white outline-none focus:border-accent"
          />
        </label>

        {!modePack && (
          <div>
            <p className="mb-2 text-sm text-neutral-400">Tone</p>
            <div className="flex flex-wrap gap-2">
              {TONES.map((tone) => {
                const active = tones.includes(tone);
                return (
                  <button
                    key={tone}
                    type="button"
                    onClick={() =>
                      setTones((prev) =>
                        active ? prev.filter((t) => t !== tone) : [...prev, tone]
                      )
                    }
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium capitalize",
                      active ? "bg-accent text-white" : "bg-white/5 text-neutral-300"
                    )}
                  >
                    {tone}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {planPreview && (
          <div className="rounded-2xl border border-accent/20 bg-accent/10 p-4 text-sm text-neutral-200">
            {planPreview.map((line) => (
              <p key={line} className="mb-1 last:mb-0">
                · {line}
              </p>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3.5 font-semibold text-white disabled:opacity-60"
        >
          <Sparkles className="h-4 w-4" />
          {loading ? "Generating…" : "Generate playlist"}
        </button>
      </form>

      <AppModal open={!!error} title="Generation failed" message={error || ""} onClose={() => setError(null)} />
    </div>
  );
}
