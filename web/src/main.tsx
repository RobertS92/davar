import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { analytics } from "@/services/analyticsService";
import { useAuthStore } from "@/stores/authStore";
import { usePlaylistStore } from "@/stores/playlistStore";
import "./index.css";

function Root() {
  useEffect(() => {
    analytics.initialize();
    void (async () => {
      await useAuthStore.getState().initialize();
      await usePlaylistStore.getState().hydrateFromBackend();
      analytics.setUserId(useAuthStore.getState().user?.id ?? null);
    })();
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
