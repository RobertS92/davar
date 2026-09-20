import { Link } from "react-router-dom";
import { BookOpen, Car, Heart, Moon, Sparkles } from "lucide-react";
import { Screen, ScreenHeader } from "@/components/Screen";

const modes = [
  {
    id: "bedtime",
    title: "Bedtime",
    subtitle: "Wind down with peace",
    icon: Moon,
    colors: "from-indigo-500 to-indigo-700",
    description: "Calmer pacing with peaceful passages — perfect for drifting off.",
    features: ["Softer voice pacing", "Restful passage selection", "Pairs with sleep timer"],
  },
  {
    id: "commute",
    title: "Commute",
    subtitle: "Scripture on the go",
    icon: Car,
    colors: "from-amber-500 to-orange-600",
    description: "Clear, engaging delivery for driving or transit.",
    features: ["15–30 minute focus", "Minimal fluff", "Strength and guidance"],
  },
  {
    id: "study",
    title: "Study",
    subtitle: "Deep dive into the Word",
    icon: BookOpen,
    colors: "from-emerald-500 to-green-700",
    description: "Dense chapters for memorization and careful reading.",
    features: ["Teachable passages", "Great in Read Mode", "Clear structure"],
  },
  {
    id: "prayer",
    title: "Prayer Loop",
    subtitle: "Biblical prayers for meditation",
    icon: Heart,
    colors: "from-pink-500 to-rose-600",
    description: "Prayers from Scripture including the Lords Prayer and Psalms.",
    features: ["Scripture-only prayers", "Loop-friendly length", "Quiet meditation"],
  },
];

export default function ModesPage() {
  return (
    <Screen>
      <ScreenHeader title="Modes" subtitle="Curated listening and reading moods" />

      <div className="mb-5 px-5 pt-4">
        <Link
          to="/deep-dive"
          className="flex items-center gap-4 overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-800 p-5 text-white active:scale-[0.99]"
        >
          <div className="rounded-2xl bg-white/15 p-3">
            <Sparkles className="h-7 w-7" />
          </div>
          <div>
            <p className="font-display text-2xl font-semibold">Deep Dive Study</p>
            <p className="text-sm text-white/85">
              60–120 minute sessions across 13 topics — precepts, stories, chapters, and more.
            </p>
          </div>
        </Link>
      </div>

      <div className="space-y-4 px-5 pb-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
        {modes.map((mode) => (
          <Link
            key={mode.id}
            to={`/create/prompt?mode=${mode.id}`}
            className={`block overflow-hidden rounded-3xl bg-gradient-to-br p-5 text-white active:scale-[0.99] ${mode.colors}`}
          >
            <mode.icon className="h-8 w-8" />
            <h2 className="mt-4 font-display text-2xl font-semibold">{mode.title}</h2>
            <p className="text-white/80">{mode.subtitle}</p>
            <p className="mt-3 text-sm leading-relaxed text-white/90">{mode.description}</p>
            <ul className="mt-4 space-y-1 text-sm text-white/85">
              {mode.features.map((f) => (
                <li key={f}>· {f}</li>
              ))}
            </ul>
          </Link>
        ))}
      </div>
    </Screen>
  );
}
