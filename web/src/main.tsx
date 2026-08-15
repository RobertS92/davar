import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { analytics } from "@/services/analyticsService";
import { ensureSupabaseSession, isSupabaseConfigured } from "@/lib/supabase";
import { usePlaylistStore } from "@/stores/playlistStore";
import "./index.css";

function Root() {
  useEffect(() => {
    analytics.initialize();
    if (isSupabaseConfigured()) {
      void (async () => {
        await ensureSupabaseSession();
        await usePlaylistStore.getState().hydrateFromSupabase();
      })();
    }
  }, []);

  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
