import { apiUrl } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

export interface AnalyticsEvent {
  eventName: string;
  properties?: Record<string, unknown>;
  timestamp: string;
  sessionId?: string;
  userId?: string;
  deviceInfo?: {
    platform: string;
    userAgent: string;
    appVersion: string;
  };
}

export interface AnalyticsSummary {
  totalEvents: number;
  uniqueSessions: number;
  topEvents: { name: string; count: number }[];
  topStations: { name: string; count: number }[];
  topModes: { name: string; count: number }[];
  topFeatures: { name: string; count: number }[];
  recent: AnalyticsEvent[];
}

const LOCAL_KEY = "davar-web-analytics";
const SESSION_KEY = "davar-web-session";

function rankCounts(map: Map<string, number>, limit = 8) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

export function getLocalAnalyticsEvents(): AnalyticsEvent[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as AnalyticsEvent[]) : [];
  } catch {
    return [];
  }
}

export function getLocalAnalyticsSummary(): AnalyticsSummary {
  const events = getLocalAnalyticsEvents();
  const sessions = new Set<string>();
  const eventCounts = new Map<string, number>();
  const stations = new Map<string, number>();
  const modes = new Map<string, number>();
  const features = new Map<string, number>();

  for (const event of events) {
    if (event.sessionId) sessions.add(event.sessionId);
    eventCounts.set(event.eventName, (eventCounts.get(event.eventName) || 0) + 1);

    const station = event.properties?.stationId || event.properties?.station;
    if (typeof station === "string") stations.set(station, (stations.get(station) || 0) + 1);

    const mode = event.properties?.mode || event.properties?.modeId;
    if (typeof mode === "string") modes.set(mode, (modes.get(mode) || 0) + 1);

    const feature = event.properties?.feature || event.properties?.surface;
    if (typeof feature === "string") features.set(feature, (features.get(feature) || 0) + 1);
  }

  return {
    totalEvents: events.length,
    uniqueSessions: sessions.size,
    topEvents: rankCounts(eventCounts),
    topStations: rankCounts(stations),
    topModes: rankCounts(modes),
    topFeatures: rankCounts(features),
    recent: events.slice(-20).reverse(),
  };
}

class AnalyticsService {
  private sessionId: string;
  private queue: AnalyticsEvent[] = [];
  private flushTimer: number | null = null;
  private userId: string | null = null;

  constructor() {
    this.sessionId = sessionStorage.getItem(SESSION_KEY) || this.createSessionId();
    sessionStorage.setItem(SESSION_KEY, this.sessionId);
  }

  private createSessionId() {
    return `web_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  setUserId(userId: string | null) {
    this.userId = userId;
  }

  initialize() {
    this.userId = useAuthStore.getState().user?.id ?? null;
    this.track("app_opened", { surface: "web" });
    this.flushTimer = window.setInterval(() => void this.flush(), 30000);
    window.addEventListener("beforeunload", () => {
      this.track("app_closed", { surface: "web" });
      void this.flush(true);
    });
  }

  track(eventName: string, properties?: Record<string, unknown>) {
    const event: AnalyticsEvent = {
      eventName,
      properties,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId || undefined,
      deviceInfo: {
        platform: "web",
        userAgent: navigator.userAgent,
        appVersion: "web-1.0.0",
      },
    };
    this.queue.push(event);
    this.storeLocal(event);
    if (this.queue.length >= 12) void this.flush();
  }

  private storeLocal(event: AnalyticsEvent) {
    try {
      const events = getLocalAnalyticsEvents();
      events.push(event);
      localStorage.setItem(LOCAL_KEY, JSON.stringify(events.slice(-500)));
    } catch {
      // ignore
    }
  }

  async flush(useBeacon = false) {
    if (!this.queue.length) return;
    const events = [...this.queue];
    this.queue = [];

    const payload = JSON.stringify({ events });
    const url = apiUrl("/api/analytics/events");
    try {
      if (useBeacon && navigator.sendBeacon) {
        navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }));
        return;
      }
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      });
    } catch {
      this.queue.unshift(...events);
    }
  }
}

export const analytics = new AnalyticsService();
