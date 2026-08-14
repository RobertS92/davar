/**
 * Centralized environment / API configuration for Davar.
 * Prefer reading keys through these helpers so placeholder detection stays consistent.
 */

const PLACEHOLDER_MARKERS = [
  "n0tr3al",
  "your-",
  "changeme",
  "placeholder",
  "example",
  "xxx",
];

function isUsableSecret(value: string | undefined | null): value is string {
  if (!value) return false;
  const trimmed = value.trim();
  if (trimmed.length < 8) return false;
  const lower = trimmed.toLowerCase();
  return !PLACEHOLDER_MARKERS.some((marker) => lower.includes(marker));
}

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function getOpenAIApiKey(): string | undefined {
  const key = readEnv("EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY");
  return isUsableSecret(key) ? key : undefined;
}

export function getGrokApiKey(): string | undefined {
  const key = readEnv("EXPO_PUBLIC_VIBECODE_GROK_API_KEY");
  return isUsableSecret(key) ? key : undefined;
}

export function getAnthropicApiKey(): string | undefined {
  const key = readEnv("EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY");
  return isUsableSecret(key) ? key : undefined;
}

export function getBibleApiKey(): string | undefined {
  const key = readEnv("EXPO_PUBLIC_BIBLE_API_KEY");
  return isUsableSecret(key) ? key : undefined;
}

export function getEnvApiBaseUrl(): string | undefined {
  const url = readEnv("EXPO_PUBLIC_API_URL");
  if (!url) return undefined;
  if (url.includes("your-backend") || url.includes("example.com")) {
    return undefined;
  }
  return url.replace(/\/$/, "");
}

let runtimeApiBaseUrl: string | null = null;

/** Optional runtime override (e.g. from Settings). */
export function setRuntimeApiBaseUrl(url: string | null) {
  if (!url || !url.trim()) {
    runtimeApiBaseUrl = null;
    return;
  }
  const cleaned = url.trim().replace(/\/$/, "");
  if (cleaned.includes("your-backend") || cleaned.includes("example.com")) {
    runtimeApiBaseUrl = null;
    return;
  }
  runtimeApiBaseUrl = cleaned;
}

export function getApiBaseUrl(): string | undefined {
  return runtimeApiBaseUrl || getEnvApiBaseUrl();
}

export function isBackendConfigured(): boolean {
  return !!getApiBaseUrl();
}

export function isOpenAIConfigured(): boolean {
  return !!getOpenAIApiKey();
}

export function isNivConfigured(): boolean {
  return !!getBibleApiKey();
}

export function requireOpenAIApiKey(): string {
  const key = getOpenAIApiKey();
  if (!key) {
    throw new Error(
      "AI voice is not configured. Add a valid EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY to enable Listen Mode audio."
    );
  }
  return key;
}

export type ServiceStatus = {
  openai: boolean;
  grok: boolean;
  niv: boolean;
  backend: boolean;
  apiBaseUrl?: string;
};

export function getServiceStatus(): ServiceStatus {
  const apiBaseUrl = getApiBaseUrl();
  return {
    openai: isOpenAIConfigured(),
    grok: !!getGrokApiKey(),
    niv: isNivConfigured(),
    backend: !!apiBaseUrl,
    apiBaseUrl,
  };
}
