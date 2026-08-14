import * as Device from "expo-device";
import * as Application from "expo-application";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiBaseUrl, isBackendConfigured } from "../api/config";

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

    // Start auto-flush every 30 seconds if backend is configured
    if (isBackendConfigured()) {
      this.flushInterval = setInterval(() => {
        this.flushEvents();
      }, 30000);
    }

    // Track app open
    this.trackEvent("app_opened");
  }

  async shutdown() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }

    // Track app closed with session duration
    if (this.sessionStartTime) {
      const duration = Date.now() - this.sessionStartTime;
      this.trackEvent("app_closed", {
        sessionDuration: Math.floor(duration / 1000)
      });
    }

    await this.flushEvents();
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

    // Store locally for offline analytics
    this.storeEventLocally(event);

    // Auto flush if queue is getting large and backend is available
    if (this.eventsQueue.length >= 20 && isBackendConfigured()) {
      this.flushEvents();
    }
  }

  private async storeEventLocally(event: AnalyticsEvent) {
    try {
      const stored = await AsyncStorage.getItem("local_analytics");
      const events: AnalyticsEvent[] = stored ? JSON.parse(stored) : [];
      events.push(event);
      // Keep only last 500 events locally
      const trimmed = events.slice(-500);
      await AsyncStorage.setItem("local_analytics", JSON.stringify(trimmed));
    } catch (error) {
      // Ignore storage errors
    }
  }

  async flushEvents() {
    if (this.eventsQueue.length === 0) return;
    if (!isBackendConfigured()) {
      // No backend, just clear queue (events are stored locally)
      this.eventsQueue = [];
      return;
    }

    const events = [...this.eventsQueue];
    this.eventsQueue = [];

    try {
      const baseUrl = getApiBaseUrl();
      if (!baseUrl) {
        this.eventsQueue = [...events, ...this.eventsQueue].slice(0, 100);
        return;
      }

      const response = await fetch(`${baseUrl}/analytics/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ events }),
      });

      if (!response.ok) {
        throw new Error("Failed to send analytics");
      }
    } catch (error) {
      // Re-queue events on failure (max 100 to prevent memory issues)
      this.eventsQueue = [...events, ...this.eventsQueue].slice(0, 100);
    }
  }

  // Get local analytics summary (for when no backend)
  async getLocalAnalyticsSummary() {
    try {
      const stored = await AsyncStorage.getItem("local_analytics");
      const events: AnalyticsEvent[] = stored ? JSON.parse(stored) : [];

      const summary = {
        totalEvents: events.length,
        uniqueSessions: new Set(events.map(e => e.sessionId)).size,
        eventCounts: {} as Record<string, number>,
        featureUsage: {} as Record<string, number>,
        stationUsage: {} as Record<string, number>,
        modeUsage: {} as Record<string, number>,
      };

      events.forEach(event => {
        // Count events
        summary.eventCounts[event.eventName] = (summary.eventCounts[event.eventName] || 0) + 1;

        // Track feature usage
        if (event.eventName === "feature_used" && event.properties?.feature) {
          summary.featureUsage[event.properties.feature] =
            (summary.featureUsage[event.properties.feature] || 0) + 1;
        }

        // Track station usage
        if (event.eventName === "station_used" && event.properties?.station) {
          summary.stationUsage[event.properties.station] =
            (summary.stationUsage[event.properties.station] || 0) + 1;
        }

        // Track mode usage
        if (event.eventName === "mode_used" && event.properties?.mode) {
          summary.modeUsage[event.properties.mode] =
            (summary.modeUsage[event.properties.mode] || 0) + 1;
        }
      });

      return summary;
    } catch (error) {
      return null;
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

  isBackendAvailable(): boolean {
    return isBackendConfigured();
  }
}

export const analyticsService = new AnalyticsService();
