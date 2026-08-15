import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "@/layouts/AppShell";
import { usePreferencesStore } from "@/stores/preferencesStore";
import OnboardingPage from "@/pages/OnboardingPage";
import HomePage from "@/pages/HomePage";
import StationsPage from "@/pages/StationsPage";
import LibraryPage from "@/pages/LibraryPage";
import ModesPage from "@/pages/ModesPage";
import SettingsPage from "@/pages/SettingsPage";
import CreateManualPage from "@/pages/CreateManualPage";
import CreatePromptPage from "@/pages/CreatePromptPage";
import PlaylistDetailPage from "@/pages/PlaylistDetailPage";
import ListenPage from "@/pages/ListenPage";
import ReadPage from "@/pages/ReadPage";

function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const done = usePreferencesStore((s) => s.hasCompletedOnboarding);
  if (!done) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route
        element={
          <RequireOnboarding>
            <AppShell />
          </RequireOnboarding>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/stations" element={<StationsPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/modes" element={<ModesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/create/manual" element={<CreateManualPage />} />
        <Route path="/create/prompt" element={<CreatePromptPage />} />
        <Route path="/playlist/:id" element={<PlaylistDetailPage />} />
        <Route path="/listen/:id" element={<ListenPage />} />
        <Route path="/read/:id" element={<ReadPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
