import {
  apiFetch,
  clearTokens,
  getAccessToken,
  isBackendConfigured,
  postJson,
  storeTokens,
} from "@/lib/api";
import { useAuthStore, type AuthUser } from "@/stores/authStore";

type AuthResponse = {
  user: {
    id: string;
    email: string;
    displayName?: string | null;
    createdAt: string;
    lastLoginAt: string;
  };
  tokens: { accessToken: string; refreshToken: string };
};

export async function initAuth(): Promise<void> {
  const store = useAuthStore.getState();
  if (!isBackendConfigured()) {
    store.setInitialized(true);
    return;
  }

  const token = getAccessToken();
  if (!token) {
    store.setUser(null);
    store.setInitialized(true);
    return;
  }

  try {
    const data = await apiFetch<{ user: AuthResponse["user"] }>("/auth/verify", { auth: true });
    store.setUser(mapUser(data.user));
  } catch {
    clearTokens();
    store.setUser(null);
  } finally {
    store.setInitialized(true);
  }
}

export async function signInWithPassword(email: string, password: string): Promise<AuthUser> {
  if (!isBackendConfigured()) {
    throw new Error("Backend is not configured. Set VITE_API_URL to your Railway URL.");
  }
  const data = await postJson<AuthResponse>("/auth/signin", {
    email: email.trim(),
    password,
  });
  storeTokens(data.tokens);
  return mapUser(data.user);
}

export async function signUpWithPassword(
  email: string,
  password: string,
  displayName?: string
): Promise<AuthUser> {
  if (!isBackendConfigured()) {
    throw new Error("Backend is not configured. Set VITE_API_URL to your Railway URL.");
  }
  const data = await postJson<AuthResponse>("/auth/signup", {
    email: email.trim(),
    password,
    displayName,
  });
  storeTokens(data.tokens);
  return mapUser(data.user);
}

export async function signOutRemote(): Promise<void> {
  try {
    if (getAccessToken() && isBackendConfigured()) {
      await apiFetch("/auth/signout", { method: "POST", auth: true });
    }
  } catch {
    // ignore network errors on sign-out
  } finally {
    clearTokens();
  }
}

function mapUser(user: AuthResponse["user"]): AuthUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName || null,
    isAnonymous: false,
  };
}
