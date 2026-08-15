import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Flame,
  Heart,
  Lightbulb,
  List,
  MessageCircle,
  Shield,
  Sparkles,
  Globe,
  Footprints,
  CloudRain,
  User,
  Award,
  Wallet,
  Layers,
  Library,
  FileText,
} from "lucide-react";
import type { Translation } from "@/types/bible";
import { AppModal } from "@/components/AppModal";
import { parseReferences } from "@/services/bibleParser";
import { compilePlaylist } from "@/services/playlistCompiler";
import {
  generateDeepDivePlaylist,
  type DeepDiveTopic,
  type DeepDiveType,
} from "@/services/deepDiveGenerator";
import { usePlaylistStore } from "@/stores/playlistStore";
import { usePreferencesStore } from "@/stores/preferencesStore";
import { analytics } from "@/services/analyticsService";
import { cn } from "@/lib/cn";
import { isNivAvailable } from "@/lib/api";

const topics: {
  id: DeepDiveTopic;
  title: string;
  subtitle: string;
  icon: typeof Flame;
  colors: string;
  description: string;
  suggestedTypes: DeepDiveType[];
}[] = [
  { id: "faith", title: "Faith & Trust", subtitle: "Building unwavering faith", icon: Flame, colors: "from-amber-500 to-orange-600", description: "Abraham, Hebrews 11, and key faith passages", suggestedTypes: ["precepts", "story", "chapters"] },
  { id: "salvation", title: "Salvation", subtitle: "The Gospel message", icon: Heart, colors: "from-red-500 to-red-700", description: "Complete study of salvation from Genesis to Revelation", suggestedTypes: ["precepts", "chapters", "story"] },
  { id: "holiness", title: "Holiness & Purity", subtitle: "Called to be set apart", icon: Sparkles, colors: "from-violet-500 to-purple-700", description: "Commands and examples of holy living", suggestedTypes: ["precepts", "chapters"] },
  { id: "wisdom", title: "Wisdom", subtitle: "Godly understanding", icon: Lightbulb, colors: "from-emerald-500 to-green-700", description: "Proverbs, Ecclesiastes, and wisdom of Jesus", suggestedTypes: ["book", "chapters", "precepts"] },
  { id: "prayer", title: "Prayer", subtitle: "Communicating with God", icon: MessageCircle, colors: "from-indigo-500 to-indigo-700", description: "Learn to pray through Scripture examples", suggestedTypes: ["precepts", "story", "chapters"] },
  { id: "spiritual_warfare", title: "Spiritual Warfare", subtitle: "Standing firm in battle", icon: Shield, colors: "from-neutral-700 to-neutral-900", description: "Understanding and engaging in spiritual battle", suggestedTypes: ["precepts", "chapters", "story"] },
  { id: "love", title: "Love of God", subtitle: "Agape love revealed", icon: Heart, colors: "from-pink-500 to-rose-700", description: "The breadth and depth of Gods love", suggestedTypes: ["precepts", "story", "chapters"] },
  { id: "kingdom", title: "Kingdom of God", subtitle: "His reign and rule", icon: Globe, colors: "from-sky-500 to-blue-700", description: "Kingdom parables and teachings", suggestedTypes: ["story", "chapters", "precepts"] },
  { id: "obedience", title: "Obedience", subtitle: "Walking in His ways", icon: Footprints, colors: "from-teal-500 to-teal-700", description: "The call and blessing of obedience", suggestedTypes: ["precepts", "story", "chapters"] },
  { id: "suffering", title: "Suffering & Trials", subtitle: "Purpose in pain", icon: CloudRain, colors: "from-slate-500 to-slate-700", description: "Biblical perspective on suffering", suggestedTypes: ["story", "precepts", "chapters"] },
  { id: "identity", title: "Identity in Christ", subtitle: "Who you are in Him", icon: User, colors: "from-purple-500 to-fuchsia-700", description: "Your new identity as a believer", suggestedTypes: ["precepts", "chapters"] },
  { id: "promises", title: "Promises of God", subtitle: "Standing on His Word", icon: Award, colors: "from-orange-500 to-amber-700", description: "Key promises to claim and believe", suggestedTypes: ["precepts", "chapters", "story"] },
  { id: "stewardship", title: "Stewardship", subtitle: "Managing Gods resources", icon: Wallet, colors: "from-green-500 to-emerald-700", description: "Money, time, talents, and faithful management", suggestedTypes: ["precepts", "story", "chapters"] },
];

const types: { id: DeepDiveType; label: string; description: string; icon: typeof List }[] = [
  { id: "precepts", label: "Precepts", description: "Key verses and teachings", icon: List },
  { id: "story", label: "Stories", description: "Narrative passages", icon: BookOpen },
  { id: "chapters", label: "Chapters", description: "Full chapter studies", icon: FileText },
  { id: "book", label: "Whole Book", description: "Complete book study", icon: Library },
  { id: "mixed", label: "Mixed", description: "Verses, chapters & stories", icon: Layers },
];

export default function DeepDivePage() {
  const navigate = useNavigate();
  const addPlaylist = usePlaylistStore((s) => s.addPlaylist);
  const addToRecent = usePlaylistStore((s) => s.addToRecent);
  const defaultTranslation = usePreferencesStore((s) => s.defaultTranslation);

  const [step, setStep] = useState<"topic" | "customize" | "review">("topic");
  const [selectedTopic, setSelectedTopic] = useState<(typeof topics)[number] | null>(null);
  const [selectedType, setSelectedType] = useState<DeepDiveType>("mixed");
  const [duration, setDuration] = useState(90);
  const [translation, setTranslation] = useState<Translation>(defaultTranslation);
  const [customFocus, setCustomFocus] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<{ title: string; references: string[]; explanation: string[] } | null>(null);

  const nivOk = isNivAvailable();

  const generate = async () => {
    if (!selectedTopic) return;
    setLoading(true);
    setError(null);
    try {
      const generated = await generateDeepDivePlaylist({
        topic: selectedTopic.id,
        type: selectedType,
        duration,
        translation: translation === "NIV" && !nivOk ? "KJV" : translation,
        customFocus: customFocus.trim() || undefined,
      });
      setPlan(generated);
      setStep("review");
      analytics.track("deep_dive_generated", { topic: selectedTopic.id, type: selectedType, duration });
    } catch {
      setError("Could not generate this study. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const create = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!plan || !selectedTopic) return;
    setLoading(true);
    try {
      const { references, errors } = parseReferences(plan.references.join("\n"));
      if (!references.length) {
        setError(errors[0] || "No valid references in the study plan.");
        return;
      }
      const playlist = await compilePlaylist({
        title: plan.title,
        references,
        translation: translation === "NIV" && !nivOk ? "KJV" : translation,
        sourceType: "prompt",
        promptUsed: `Deep dive: ${selectedTopic.title}`,
        tags: ["deep-dive", selectedTopic.id, selectedType],
        description: plan.explanation.join(" "),
      });
      addPlaylist(playlist);
      addToRecent(playlist.id);
      analytics.track("deep_dive_created", { topic: selectedTopic.id });
      navigate(`/playlist/${playlist.id}`, { replace: true });
    } catch {
      setError("Could not build the playlist from this study.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="safe-top flex flex-1 flex-col pb-8">
      <header className="flex items-center gap-3 px-5 pb-4 pt-2">
        <button
          onClick={() => {
            if (step === "topic") navigate("/modes");
            else if (step === "customize") setStep("topic");
            else setStep("customize");
          }}
          className="rounded-full bg-white/5 p-2 text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <p className="font-display text-2xl font-semibold">Deep Dive Study</p>
          <p className="text-sm text-neutral-400">60–120 minute Scripture sessions</p>
        </div>
      </header>

      {step === "topic" && (
        <div className="grid gap-3 px-5 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => {
                setSelectedTopic(topic);
                setSelectedType(topic.suggestedTypes[0] || "mixed");
                setStep("customize");
              }}
              className={cn(
                "rounded-2xl bg-gradient-to-br p-4 text-left text-white active:scale-[0.98]",
                topic.colors
              )}
            >
              <topic.icon className="h-6 w-6" />
              <p className="mt-3 font-semibold">{topic.title}</p>
              <p className="text-sm text-white/80">{topic.subtitle}</p>
            </button>
          ))}
        </div>
      )}

      {step === "customize" && selectedTopic && (
        <div className="space-y-5 px-5 lg:max-w-2xl">
          <div className={cn("rounded-2xl bg-gradient-to-br p-4 text-white", selectedTopic.colors)}>
            <p className="font-semibold">{selectedTopic.title}</p>
            <p className="text-sm text-white/85">{selectedTopic.description}</p>
          </div>

          <div>
            <p className="mb-2 text-sm text-neutral-400">Study type</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {types.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedType(t.id)}
                  className={cn(
                    "flex items-start gap-3 rounded-2xl border p-3 text-left",
                    selectedType === t.id ? "border-accent bg-accent/15" : "border-white/10 bg-ink-850"
                  )}
                >
                  <t.icon className="mt-0.5 h-4 w-4 text-accent-soft" />
                  <span>
                    <span className="block text-sm font-medium text-white">{t.label}</span>
                    <span className="text-xs text-neutral-400">{t.description}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm text-neutral-400">Duration</p>
            <div className="grid grid-cols-3 gap-2">
              {[60, 90, 120].map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={cn(
                    "rounded-xl py-3 text-sm font-medium",
                    duration === d ? "bg-accent text-white" : "bg-white/5 text-neutral-300"
                  )}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm text-neutral-400">Translation</p>
            <div className="grid grid-cols-2 gap-2">
              {(["KJV", "NIV"] as Translation[]).map((t) => (
                <button
                  key={t}
                  disabled={t === "NIV" && !nivOk}
                  onClick={() => setTranslation(t)}
                  className={cn(
                    "rounded-xl py-3 text-sm font-medium",
                    translation === t ? "bg-accent text-white" : "bg-white/5 text-neutral-300",
                    t === "NIV" && !nivOk && "opacity-40"
                  )}
                >
                  {t}
                  {t === "NIV" && !nivOk ? " (needs API key)" : ""}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm text-neutral-400">Optional focus</span>
            <textarea
              value={customFocus}
              onChange={(e) => setCustomFocus(e.target.value)}
              rows={3}
              placeholder="e.g. faith during illness"
              className="w-full resize-none rounded-2xl border border-white/10 bg-ink-850 px-4 py-3 text-white outline-none focus:border-accent"
            />
          </label>

          <button
            onClick={() => void generate()}
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3.5 font-semibold text-white disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" />
            {loading ? "Generating study…" : "Generate study plan"}
          </button>
        </div>
      )}

      {step === "review" && plan && (
        <form onSubmit={create} className="space-y-4 px-5 lg:max-w-2xl">
          <h2 className="font-display text-2xl font-semibold text-white">{plan.title}</h2>
          <div className="rounded-2xl border border-white/10 bg-ink-850 p-4">
            <p className="mb-2 text-sm font-medium text-neutral-300">Study flow</p>
            {plan.explanation.map((line) => (
              <p key={line} className="mb-1 text-sm text-neutral-400">
                · {line}
              </p>
            ))}
          </div>
          <div className="rounded-2xl border border-white/10 bg-ink-850 p-4">
            <p className="mb-2 text-sm font-medium text-neutral-300">
              Passages ({plan.references.length})
            </p>
            <ul className="space-y-1 text-sm text-neutral-300">
              {plan.references.map((ref) => (
                <li key={ref}>{ref}</li>
              ))}
            </ul>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-accent px-4 py-3.5 font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Building playlist…" : "Create playlist"}
          </button>
          <Link to="/modes" className="block text-center text-sm text-neutral-400">
            Cancel
          </Link>
        </form>
      )}

      <AppModal open={!!error} title="Deep Dive" message={error || ""} onClose={() => setError(null)} />
    </div>
  );
}
