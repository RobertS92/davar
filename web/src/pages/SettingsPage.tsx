import type { PlaybackSpeed } from "@/types/bible";
import { VOICE_OPTIONS } from "@/services/ttsService";
import { usePreferencesStore } from "@/stores/preferencesStore";
import { cn } from "@/lib/cn";

export default function SettingsPage() {
  const prefs = usePreferencesStore();

  const speeds: PlaybackSpeed[] = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
  const lengths = [10, 15, 20, 30, 45, 60];
  const textSizes = [16, 18, 20, 22, 24, 28];

  return (
    <div className="safe-top flex flex-1 flex-col pb-10">
      <header className="px-5 pb-4 pt-2">
        <p className="font-display text-3xl font-semibold">Settings</p>
        <p className="mt-1 text-neutral-400">Preferences stay on this device</p>
      </header>

      <div className="space-y-6 px-5 lg:max-w-2xl">
        <section className="rounded-3xl border border-white/5 bg-ink-850/70 p-4">
          <h2 className="mb-3 font-semibold text-white">Defaults</h2>
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm text-neutral-400">Consumption mode</p>
              <div className="grid grid-cols-2 gap-2">
                {(["listen", "read"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => prefs.setDefaultConsumptionMode(mode)}
                    className={cn(
                      "rounded-xl px-3 py-2.5 text-sm font-medium capitalize",
                      prefs.defaultConsumptionMode === mode
                        ? "bg-accent text-white"
                        : "bg-white/5 text-neutral-300"
                    )}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm text-neutral-400">Voice</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {VOICE_OPTIONS.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => prefs.setDefaultVoice(voice.id)}
                    className={cn(
                      "rounded-xl px-3 py-2.5 text-left",
                      prefs.defaultVoice === voice.id
                        ? "bg-accent/20 ring-1 ring-accent"
                        : "bg-white/5"
                    )}
                  >
                    <p className="text-sm font-medium text-white">{voice.name}</p>
                    <p className="text-xs text-neutral-400">
                      {voice.gender} · {voice.style}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm text-neutral-400">Playback speed</p>
              <div className="grid grid-cols-3 gap-2">
                {speeds.map((speed) => (
                  <button
                    key={speed}
                    onClick={() => prefs.setPlaybackSpeed(speed)}
                    className={cn(
                      "rounded-xl py-2 text-sm font-medium",
                      prefs.playbackSpeed === speed ? "bg-accent text-white" : "bg-white/5 text-neutral-300"
                    )}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm text-neutral-400">Playlist length</p>
              <div className="grid grid-cols-3 gap-2">
                {lengths.map((len) => (
                  <button
                    key={len}
                    onClick={() => prefs.setDefaultPlaylistLength(len)}
                    className={cn(
                      "rounded-xl py-2 text-sm font-medium",
                      prefs.defaultPlaylistLength === len
                        ? "bg-accent text-white"
                        : "bg-white/5 text-neutral-300"
                    )}
                  >
                    {len}m
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/5 bg-ink-850/70 p-4">
          <h2 className="mb-3 font-semibold text-white">Reading</h2>
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm text-neutral-400">Text size</p>
              <div className="grid grid-cols-3 gap-2">
                {textSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => prefs.setTextSize(size)}
                    className={cn(
                      "rounded-xl py-2 text-sm font-medium",
                      prefs.textSize === size ? "bg-accent text-white" : "bg-white/5 text-neutral-300"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            <Toggle
              label="Show verse numbers"
              value={prefs.showVerseNumbersInRead}
              onChange={prefs.setShowVerseNumbersInRead}
            />
            <Toggle label="Night mode" value={prefs.nightMode} onChange={prefs.setNightMode} />
            <Toggle
              label="Announce book and chapter"
              value={prefs.announceBookChapter}
              onChange={prefs.setAnnounceBookChapter}
            />
          </div>
        </section>

        <section className="rounded-3xl border border-white/5 bg-ink-850/70 p-4 text-sm text-neutral-400">
          <p className="font-semibold text-white">About the web app</p>
          <p className="mt-2 leading-relaxed">
            This is the browser version of Davar. Your React Native / Expo app code is unchanged.
            Add this site to your Home Screen for a full-screen, app-like experience without TestFlight.
          </p>
        </section>
      </div>
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between rounded-xl bg-white/5 px-3 py-3"
    >
      <span className="text-sm text-neutral-200">{label}</span>
      <span
        className={cn(
          "relative h-6 w-11 rounded-full transition",
          value ? "bg-accent" : "bg-neutral-600"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white transition",
            value ? "left-5" : "left-0.5"
          )}
        />
      </span>
    </button>
  );
}
