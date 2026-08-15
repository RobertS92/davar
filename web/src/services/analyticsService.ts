import { ensureSupabaseSession } from "@/lib/auth";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { apiUrl } from "@/lib/api";

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

const LOCAL_KEY = "davar-web-analytics";
const SESSION_KEY = "davar-web-session";

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

  initialize() {
    this.track("app_opened", { surface: "web" });
    this.flushTimer = window.setInterval(() => void this.flush(), 30000);
    window.addEventListener("beforeunload", () => {
      this.track("app_closed", { surface: "web" });
      void this.flush(true);
    });
    if (isSupabaseConfigured()) {
      void ensureSupabaseSession().then((id) => {
        this.userId = id;
      });
    }
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
      const raw = localStorage.getItem(LOCAL_KEY);
      const events: AnalyticsEvent[] = raw ? JSON.parse(raw) : [];
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

    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        if (!this.userId) this.userId = await ensureSupabaseSession();
        const rows = events.map((e) => ({
          event_name: e.eventName,
          properties: e.properties || {},
          timestamp: e.timestamp,
          user_id: this.userId,
          session_id: e.sessionId,
          device_info: e.deviceInfo || {},
        }));
        const { error } = await supabase.from("analytics_events").insert(rows);
        if (error) {
          this.queue.unshift(...events);
        }
        return;
      }
    }

    // Fallback: Vercel/API route
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
