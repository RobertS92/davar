const TOKEN_KEY = "davar-access-token";
const REFRESH_KEY = "davar-refresh-token";

/** Railway (or local) API base URL. */
export function getApiBase(): string {
  const fromEnv =
    (import.meta.env.VITE_API_URL as string | undefined) ||
    (import.meta.env.EXPO_PUBLIC_API_URL as string | undefined);
  if (fromEnv && !fromEnv.includes("your-backend") && !fromEnv.includes("YOUR_")) {
    return fromEnv.replace(/\/$/, "");
  }
  return "";
}

export function isBackendConfigured(): boolean {
  return !!getApiBase();
}

export function apiUrl(path: string): string {
  const base = getApiBase();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (!base) {
    // Same-origin fallback for Vercel serverless stubs during local vite /api middleware
    return normalized.startsWith("/api/") ? normalized : `/api${normalized}`;
  }
  return `${base}${normalized}`;
}

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

export function storeTokens(tokens: { accessToken: string; refreshToken: string }): void {
  localStorage.setItem(TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const { auth = false, headers, ...rest } = options;
  const finalHeaders = new Headers(headers || {});
  if (!finalHeaders.has("Content-Type") && rest.body && !(rest.body instanceof FormData)) {
    finalHeaders.set("Content-Type", "application/json");
  }
  if (auth) {
    const token = getAccessToken();
    if (token) finalHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(apiUrl(path), {
    ...rest,
    headers: finalHeaders,
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "message" in payload
        ? String((payload as { message: string }).message)
        : typeof payload === "string"
          ? payload
          : `Request failed (${response.status})`;
    throw new Error(message);
  }

  return payload as T;
}

export async function postJson<T>(path: string, body: unknown, auth = false): Promise<T> {
  return apiFetch<T>(path, {
    method: "POST",
    auth,
    body: JSON.stringify(body),
  });
}

export function getBibleApiKey(): string | undefined {
  return (
    (import.meta.env.VITE_BIBLE_API_KEY as string | undefined) ||
    (import.meta.env.EXPO_PUBLIC_BIBLE_API_KEY as string | undefined)
  );
}

export function isNivAvailable(): boolean {
  return !!getBibleApiKey();
}
