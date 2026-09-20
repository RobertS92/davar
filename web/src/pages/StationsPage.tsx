import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  Compass,
  Flame,
  Footprints,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  Sun,
  Trophy,
  BookOpen,
  Wallet,
  UserRound,
  Flower2,
} from "lucide-react";
import { AppModal } from "@/components/AppModal";
import { Screen, ScreenHeader } from "@/components/Screen";
import { compilePlaylist } from "@/services/playlistCompiler";
import { parseReferences } from "@/services/bibleParser";
import { STATION_REFERENCES } from "@/services/playlistGenerator";
import { usePlaylistStore } from "@/stores/playlistStore";
import { usePreferencesStore } from "@/stores/preferencesStore";
import { cn } from "@/lib/cn";
import { isNivAvailable } from "@/lib/api";

const STATIONS = [
  { id: "messiah", title: "The Messiah", subtitle: "The life of Jesus Christ", icon: Sun, colors: "from-amber-400 to-orange-500" },
  { id: "kings", title: "The Kings", subtitle: "David and Solomon", icon: Trophy, colors: "from-violet-400 to-purple-600" },
  { id: "famous-stories", title: "Famous Stories", subtitle: "Heroes of the faith", icon: BookOpen, colors: "from-sky-400 to-blue-600" },
  { id: "stewardship", title: "Stewardship", subtitle: "Managing Gods resources", icon: Wallet, colors: "from-green-400 to-emerald-600" },
  { id: "faith", title: "Faith", subtitle: "Build unwavering trust", icon: Flame, colors: "from-amber-500 to-red-600" },
  { id: "lust", title: "Overcoming Lust", subtitle: "Purity and self-control", icon: ShieldCheck, colors: "from-indigo-400 to-indigo-600" },
  { id: "overcoming", title: "Overcoming", subtitle: "Victory through Christ", icon: Trophy, colors: "from-emerald-400 to-green-700" },
  { id: "obedience", title: "Obedience", subtitle: "Walking in His ways", icon: Footprints, colors: "from-violet-400 to-violet-700" },
  { id: "narrow-path", title: "The Narrow Path", subtitle: "Radical discipleship", icon: Compass, colors: "from-sky-400 to-cyan-700" },
  { id: "fatherhood", title: "Fatherhood", subtitle: "Leading your family well", icon: UserRound, colors: "from-teal-400 to-teal-700" },
  { id: "motherhood", title: "Motherhood", subtitle: "Nurturing with wisdom", icon: Flower2, colors: "from-pink-400 to-rose-600" },
  { id: "marriage", title: "Marriage", subtitle: "Covenant love", icon: HeartHandshake, colors: "from-rose-400 to-rose-600" },
  { id: "work", title: "Work", subtitle: "Working as unto the Lord", icon: Briefcase, colors: "from-stone-400 to-stone-600" },
] as const;

export default function StationsPage() {
  const navigate = useNavigate();
  const addPlaylist = usePlaylistStore((s) => s.addPlaylist);
  const addToRecent = usePlaylistStore((s) => s.addToRecent);
  const translation = usePreferencesStore((s) => s.defaultTranslation);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startStation = async (stationId: string) => {
    const pack = STATION_REFERENCES[stationId];
    if (!pack) return;
    setLoadingId(stationId);
    try {
      const { references, errors } = parseReferences(pack.references.join("\n"));
      if (!references.length) {
        setError(errors[0] || "Could not build this station playlist.");
        return;
      }
      const playlist = await compilePlaylist({
        title: pack.title,
        references,
        translation: translation === "NIV" && !isNivAvailable() ? "KJV" : translation,
        sourceType: "prompt",
        promptUsed: `Station: ${pack.title}`,
        tags: pack.tags,
        description: `Curated station playlist for ${pack.title}`,
      });
      addPlaylist(playlist);
      addToRecent(playlist.id);
      navigate(`/playlist/${playlist.id}`);
    } catch {
      setError("Something went wrong building this station. Please try again.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Stations" subtitle="Tap a topic for an instant playlist" />

      <div className="grid gap-3 px-5 pb-4 pt-4 sm:grid-cols-2 lg:grid-cols-3">
        {STATIONS.map((station) => (
          <button
            key={station.id}
            onClick={() => startStation(station.id)}
            disabled={!!loadingId}
            className={cn(
              "relative overflow-hidden rounded-2xl bg-gradient-to-br p-4 text-left text-white transition active:scale-[0.98]",
              station.colors,
              loadingId && loadingId !== station.id && "opacity-50"
            )}
          >
            <station.icon className="h-7 w-7" />
            <p className="mt-4 text-lg font-semibold">{station.title}</p>
            <p className="text-sm text-white/80">{station.subtitle}</p>
            {loadingId === station.id && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                <Sparkles className="h-6 w-6 animate-pulse-soft" />
              </div>
            )}
          </button>
        ))}
      </div>

      <AppModal
        open={!!error}
        title="Could not open station"
        message={error || ""}
        onClose={() => setError(null)}
      />
    </Screen>
  );
}
