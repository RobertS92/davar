import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Screen, ScreenHeader } from "@/components/Screen";
import { getLocalAnalyticsSummary } from "@/services/analyticsService";
import { cn } from "@/lib/cn";

export default function AnalyticsPage() {
  const [tick, setTick] = useState(0);
  const summary = useMemo(() => getLocalAnalyticsSummary(), [tick]);

  return (
    <Screen>
      <ScreenHeader
        title="Analytics"
        subtitle="Local activity on this device"
        left={
          <Link to="/settings" className="rounded-full bg-white/5 p-2 text-white" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        }
        right={
          <button
            onClick={() => setTick((n) => n + 1)}
            className="rounded-full bg-white/5 p-2 text-white"
            aria-label="Refresh"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        }
      />

      <div className="space-y-5 px-5 pb-4 pt-4 lg:max-w-3xl">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Events" value={summary.totalEvents} />
          <Stat label="Sessions" value={summary.uniqueSessions} />
          <Stat label="Top event" value={summary.topEvents[0]?.name || "—"} small />
          <Stat label="Top feature" value={summary.topFeatures[0]?.name || "—"} small />
        </div>

        <RankSection title="Events" rows={summary.topEvents} />
        <RankSection title="Stations" rows={summary.topStations} />
        <RankSection title="Modes" rows={summary.topModes} />
        <RankSection title="Features" rows={summary.topFeatures} />

        <section className="rounded-3xl border border-white/5 bg-ink-850/70 p-4">
          <h2 className="mb-3 font-semibold text-white">Recent</h2>
          {summary.recent.length === 0 ? (
            <p className="text-sm text-neutral-400">No events yet. Use the app and refresh.</p>
          ) : (
            <ul className="space-y-2">
              {summary.recent.map((event, i) => (
                <li
                  key={`${event.timestamp}-${event.eventName}-${i}`}
                  className="flex items-start justify-between gap-3 rounded-xl bg-white/5 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{event.eventName}</p>
                    <p className="text-xs text-neutral-500">
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Screen>
  );
}

function Stat({ label, value, small }: { label: string; value: string | number; small?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-ink-850/70 p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">{label}</p>
      <p className={cn("mt-2 font-semibold text-white", small ? "truncate text-sm" : "text-2xl")}>
        {value}
      </p>
    </div>
  );
}

function RankSection({ title, rows }: { title: string; rows: { name: string; count: number }[] }) {
  return (
    <section className="rounded-3xl border border-white/5 bg-ink-850/70 p-4">
      <h2 className="mb-3 font-semibold text-white">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-neutral-400">Nothing tracked yet.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.name} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
              <span className="text-sm text-neutral-200">{row.name}</span>
              <span className="text-sm font-medium text-accent-soft">{row.count}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
