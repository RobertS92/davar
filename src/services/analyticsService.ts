import * as Device from "expo-device";
import * as Application from "expo-application";
import { Platform } from "react-native";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "https://your-backend-api.com";

export interface AnalyticsEvent {
  eventName: string;
  properties?: Record<string, any>;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  deviceInfo?: DeviceInfo;
}

export interface DeviceInfo {
  platform: string;
  osVersion: string;
  deviceModel: string;
  appVersion: string;
}

export interface SessionData {
  sessionId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  eventsCount: number;
}

class AnalyticsService {
  private sessionId: string | null = null;
  private sessionStartTime: number | null = null;
  private eventsQueue: AnalyticsEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  async initialize() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();

    // Start auto-flush every 30 seconds
    this.flushInterval = setInterval(() => {
      this.flushEvents();
    }, 30000);

    // Track app open
    this.trackEvent("app_opened");
  }

  async shutdown() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    await this.flushEvents();

    // Track app closed with session duration
    if (this.sessionStartTime) {
      const duration = Date.now() - this.sessionStartTime;
      this.trackEvent("app_closed", {
        sessionDuration: Math.floor(duration / 1000)
      });
    }
  }

  trackEvent(eventName: string, properties?: Record<string, any>) {
    const event: AnalyticsEvent = {
      eventName,
      properties,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId || undefined,
      deviceInfo: this.getDeviceInfo(),
    };

    this.eventsQueue.push(event);

    // Auto flush if queue is getting large
    if (this.eventsQueue.length >= 20) {
      this.flushEvents();
    }
  }

  async flushEvents() {
    if (this.eventsQueue.length === 0) return;

    const events = [...this.eventsQueue];
    this.eventsQueue = [];

    try {
      await fetch(`${API_BASE_URL}/analytics/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ events }),
      });
    } catch (error) {
      console.error("Failed to send analytics:", error);
      // Re-queue events on failure (max 100 to prevent memory issues)
      this.eventsQueue = [...events, ...this.eventsQueue].slice(0, 100);
    }
  }

  // Feature usage tracking
  trackFeatureUsage(featureName: string, metadata?: Record<string, any>) {
    this.trackEvent("feature_used", {
      feature: featureName,
      ...metadata,
    });
  }

  // Playlist tracking
  trackPlaylistCreated(playlistId: string, sourceType: "manual" | "prompt", itemCount: number) {
    this.trackEvent("playlist_created", {
      playlistId,
      sourceType,
      itemCount,
    });
  }

  trackPlaylistPlayed(playlistId: string, mode: "listen" | "read") {
    this.trackEvent("playlist_played", {
      playlistId,
      mode,
    });
  }

  trackPlaylistCompleted(playlistId: string, duration: number) {
    this.trackEvent("playlist_completed", {
      playlistId,
      duration,
    });
  }

  // Mode tracking
  trackModeUsed(modeName: string) {
    this.trackEvent("mode_used", {
      mode: modeName,
    });
  }

  // Station tracking
  trackStationUsed(stationName: string) {
    this.trackEvent("station_used", {
      station: stationName,
    });
  }

  // Download tracking
  trackPlaylistDownloaded(playlistId: string, itemCount: number) {
    this.trackEvent("playlist_downloaded", {
      playlistId,
      itemCount,
    });
  }

  // Sleep timer tracking
  trackSleepTimerSet(minutes: number) {
    this.trackEvent("sleep_timer_set", {
      minutes,
    });
  }

  // Settings tracking
  trackSettingChanged(settingName: string, value: any) {
    this.trackEvent("setting_changed", {
      setting: settingName,
      value,
    });
  }

  private getDeviceInfo(): DeviceInfo {
    return {
      platform: Platform.OS,
      osVersion: Platform.Version.toString(),
      deviceModel: Device.modelName || "Unknown",
      appVersion: Application.nativeApplicationVersion || "1.0.0",
    };
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  getSessionDuration(): number {
    if (!this.sessionStartTime) return 0;
    return Math.floor((Date.now() - this.sessionStartTime) / 1000);
  }
}

export const analyticsService = new AnalyticsService();
