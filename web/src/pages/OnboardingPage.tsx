import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, ChevronRight, Headphones } from "lucide-react";
import type { ConsumptionMode, PlaybackSpeed, Translation } from "@/types/bible";
import { usePreferencesStore } from "@/stores/preferencesStore";
import { cn } from "@/lib/cn";
import { isNivAvailable } from "@/lib/api";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const nivOk = isNivAvailable();

  const setDefaultTranslation = usePreferencesStore((s) => s.setDefaultTranslation);
  const setDefaultConsumptionMode = usePreferencesStore((s) => s.setDefaultConsumptionMode);
  const setPlaybackSpeed = usePreferencesStore((s) => s.setPlaybackSpeed);
  const setDefaultPlaylistLength = usePreferencesStore((s) => s.setDefaultPlaylistLength);
  const setHasCompletedOnboarding = usePreferencesStore((s) => s.setHasCompletedOnboarding);

  const defaultTranslation = usePreferencesStore((s) => s.defaultTranslation);
  const defaultConsumptionMode = usePreferencesStore((s) => s.defaultConsumptionMode);
  const playbackSpeed = usePreferencesStore((s) => s.playbackSpeed);
  const defaultPlaylistLength = usePreferencesStore((s) => s.defaultPlaylistLength);

  const complete = () => {
    setHasCompletedOnboarding(true);
    navigate("/sign-in", { replace: true });
  };

  const next = () => {
    if (page >= 4) complete();
    else setPage((p) => p + 1);
  };

  const translations: { value: Translation; label: string; desc: string }[] = [
    { value: "KJV", label: "King James Version", desc: "Classic, poetic language — works offline" },
    {
      value: "NIV",
      label: "New International Version",
      desc: nivOk ? "Modern, readable translation" : "Add a Bible API key to enable NIV",
    },
  ];

  const modes: { value: ConsumptionMode; label: string; desc: string; icon: typeof Headphones }[] = [
    { value: "listen", label: "Listen", desc: "Audio playback with natural voice", icon: Headphones },
    { value: "read", label: "Read", desc: "Swipeable reading cards", icon: BookOpen },
  ];

  const speeds: PlaybackSpeed[] = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
  const lengths = [10, 15, 20, 30, 45, 60];

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-ink-950">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-accent/40 to-transparent" />

      <div className="safe-top relative z-10 flex flex-1 flex-col px-6 pb-8 pt-10">
        {page === 0 && (
          <div className="animate-fade-up flex flex-1 flex-col">
            <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-white/10">
              <BookOpen className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-center font-display text-4xl font-semibold text-white">Davar</h1>
            <p className="mt-3 text-center text-lg text-white/70">
              Listen to or read Scripture playlists curated for your journey — right in your phone browser.
            </p>
            <div className="mt-8 space-y-3 rounded-2xl bg-ink-850/80 p-5">
              {[
                "AI-powered playlists and Deep Dive studies",
                "Stations for faith, family, work, and more",
                "OpenAI voices in Listen Mode, or Read Mode anywhere",
              ].map((item) => (
                <p key={item} className="text-sm text-neutral-200">
                  · {item}
                </p>
              ))}
            </div>
          </div>
        )}

        {page === 1 && (
          <div className="animate-fade-up flex flex-1 flex-col">
            <h2 className="font-display text-3xl font-semibold">Choose a translation</h2>
            <p className="mt-2 text-neutral-400">You can change this later in Settings.</p>
            <div className="mt-8 space-y-3">
              {translations.map((opt) => (
                <button
                  key={opt.value}
                  disabled={opt.value === "NIV" && !nivOk}
                  onClick={() => setDefaultTranslation(opt.value)}
                  className={cn(
                    "w-full rounded-2xl border p-4 text-left transition",
                    defaultTranslation === opt.value
                      ? "border-accent bg-accent/15"
                      : "border-white/10 bg-ink-850/70",
                    opt.value === "NIV" && !nivOk && "opacity-50"
                  )}
                >
                  <p className="font-semibold text-white">{opt.label}</p>
                  <p className="mt-1 text-sm text-neutral-400">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {page === 2 && (
          <div className="animate-fade-up flex flex-1 flex-col">
            <h2 className="font-display text-3xl font-semibold">How do you want to start?</h2>
            <p className="mt-2 text-neutral-400">Pick a default mode. You can switch anytime.</p>
            <div className="mt-8 grid gap-3">
              {modes.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDefaultConsumptionMode(opt.value)}
                  className={cn(
                    "flex items-center gap-4 rounded-2xl border p-4 text-left",
                    defaultConsumptionMode === opt.value
                      ? "border-accent bg-accent/15"
                      : "border-white/10 bg-ink-850/70"
                  )}
                >
                  <div className="rounded-xl bg-white/5 p-3">
                    <opt.icon className="h-6 w-6 text-accent-soft" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{opt.label}</p>
                    <p className="text-sm text-neutral-400">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {page === 3 && (
          <div className="animate-fade-up flex flex-1 flex-col">
            <h2 className="font-display text-3xl font-semibold">Playback speed</h2>
            <p className="mt-2 text-neutral-400">Used for Listen Mode voice pacing.</p>
            <div className="mt-8 grid grid-cols-3 gap-3">
              {speeds.map((speed) => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={cn(
                    "rounded-2xl border py-4 font-semibold",
                    playbackSpeed === speed
                      ? "border-accent bg-accent/15 text-white"
                      : "border-white/10 bg-ink-850/70 text-neutral-300"
                  )}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        )}

        {page === 4 && (
          <div className="animate-fade-up flex flex-1 flex-col">
            <h2 className="font-display text-3xl font-semibold">Default playlist length</h2>
            <p className="mt-2 text-neutral-400">How long should new playlists aim to be?</p>
            <div className="mt-8 grid grid-cols-3 gap-3">
              {lengths.map((len) => (
                <button
                  key={len}
                  onClick={() => setDefaultPlaylistLength(len)}
                  className={cn(
                    "rounded-2xl border py-4 font-semibold",
                    defaultPlaylistLength === len
                      ? "border-accent bg-accent/15 text-white"
                      : "border-white/10 bg-ink-850/70 text-neutral-300"
                  )}
                >
                  {len}m
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-4">
          <div className="flex gap-1.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={cn("h-1.5 rounded-full transition-all", i === page ? "w-6 bg-accent" : "w-1.5 bg-white/20")}
              />
            ))}
          </div>
          <button
            onClick={next}
            className="inline-flex items-center gap-2 rounded-2xl bg-accent px-5 py-3 font-semibold text-white active:scale-[0.98]"
          >
            {page === 4 ? "Get started" : "Continue"}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
