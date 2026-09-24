import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "@/layouts/AppShell";
import { usePreferencesStore } from "@/stores/preferencesStore";
import { isSignedInUser, useAuthStore } from "@/stores/authStore";
import { isBackendConfigured } from "@/lib/api";
import OnboardingPage from "@/pages/OnboardingPage";
import SignInPage from "@/pages/SignInPage";
import SignUpPage from "@/pages/SignUpPage";
import HomePage from "@/pages/HomePage";
import StationsPage from "@/pages/StationsPage";
import LibraryPage from "@/pages/LibraryPage";
import ModesPage from "@/pages/ModesPage";
import SettingsPage from "@/pages/SettingsPage";
import CreateManualPage from "@/pages/CreateManualPage";
import CreatePromptPage from "@/pages/CreatePromptPage";
import PlaylistDetailPage from "@/pages/PlaylistDetailPage";
import EditPlaylistPage from "@/pages/EditPlaylistPage";
import DeepDivePage from "@/pages/DeepDivePage";
import ListenPage from "@/pages/ListenPage";
import ReadPage from "@/pages/ReadPage";
import SharePlaylistPage from "@/pages/SharePlaylistPage";
import CommunityPage from "@/pages/CommunityPage";
import AnalyticsPage from "@/pages/AnalyticsPage";

function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const done = usePreferencesStore((s) => s.hasCompletedOnboarding);
  const user = useAuthStore((s) => s.user);
  const hasSeenAuthPrompt = useAuthStore((s) => s.hasSeenAuthPrompt);
  const initialized = useAuthStore((s) => s.initialized);

  if (!done) return <Navigate to="/onboarding" replace />;

  if (isBackendConfigured()) {
    if (!initialized) {
      return (
        <div className="flex min-h-dvh items-center justify-center bg-ink-950 text-neutral-400">
          Loading…
        </div>
      );
    }
    if (!hasSeenAuthPrompt && !isSignedInUser(user)) {
      return <Navigate to="/sign-in" replace />;
    }
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/sign-up" element={<SignUpPage />} />
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
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/share" element={<SharePlaylistPage />} />
        <Route path="/share/:id" element={<SharePlaylistPage />} />
        <Route path="/deep-dive" element={<DeepDivePage />} />
        <Route path="/create/manual" element={<CreateManualPage />} />
        <Route path="/create/prompt" element={<CreatePromptPage />} />
        <Route path="/playlist/:id" element={<PlaylistDetailPage />} />
        <Route path="/playlist/:id/edit" element={<EditPlaylistPage />} />
        <Route path="/listen/:id" element={<ListenPage />} />
        <Route path="/read/:id" element={<ReadPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
