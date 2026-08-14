import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { setRuntimeApiBaseUrl } from "../api/config";
import { authService } from "../services/authService";
import { analyticsService } from "../services/analyticsService";
import { usePreferencesStore } from "../state/preferencesStore";
import { useUserStore } from "../state/userStore";

/**
 * Boots auth session, analytics, and runtime API URL from preferences.
 */
export function AppBootstrap({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const apiBaseUrlOverride = usePreferencesStore((s) => s.apiBaseUrlOverride);
  const setUser = useUserStore((s) => s.setUser);
  const setIsLoading = useUserStore((s) => s.setIsLoading);

  useEffect(() => {
    setRuntimeApiBaseUrl(apiBaseUrlOverride || null);
  }, [apiBaseUrlOverride]);

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      setIsLoading(true);
      try {
        setRuntimeApiBaseUrl(
          usePreferencesStore.getState().apiBaseUrlOverride || null
        );
        await analyticsService.initialize();
        const user = await authService.initialize();
        if (!cancelled) {
          setUser(user);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setReady(true);
        }
      }
    };

    void boot();

    return () => {
      cancelled = true;
      void analyticsService.shutdown();
    };
  }, [setIsLoading, setUser]);

  if (!ready) {
    return (
      <View className="flex-1 bg-neutral-950 items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="text-neutral-400 mt-4">Starting Davar...</Text>
      </View>
    );
  }

  return <>{children}</>;
}
