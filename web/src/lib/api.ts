/** Resolve API base for AI/TTS/analytics. Empty = same-origin /api (Vite middleware or hosted backend). */
export function getApiBase(): string {
  const fromEnv = import.meta.env.VITE_API_URL as string | undefined;
  if (fromEnv && !fromEnv.includes("your-backend")) {
    return fromEnv.replace(/\/$/, "");
  }
  return "";
}

export function apiUrl(path: string): string {
  const base = getApiBase();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(apiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
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
