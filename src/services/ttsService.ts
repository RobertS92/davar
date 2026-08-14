import * as FileSystem from "expo-file-system";
import { Audio } from "expo-av";
import { requireOpenAIApiKey } from "../api/config";

export type TTSVoice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";

export const VOICE_OPTIONS: { id: TTSVoice; name: string; gender: string; style: string }[] = [
  { id: "alloy", name: "Alloy", gender: "Neutral", style: "Balanced and clear" },
  { id: "echo", name: "Echo", gender: "Male", style: "Warm and conversational" },
  { id: "fable", name: "Fable", gender: "Male", style: "British, narrative" },
  { id: "onyx", name: "Onyx", gender: "Male", style: "Deep and authoritative" },
  { id: "nova", name: "Nova", gender: "Female", style: "Friendly and expressive" },
  { id: "shimmer", name: "Shimmer", gender: "Female", style: "Soft and gentle" },
];

interface TTSOptions {
  voice?: TTSVoice;
  speed?: number;
}

interface TTSResult {
  audioUri: string;
  duration: number;
}

// Cache directory for TTS audio files
const TTS_CACHE_DIR = `${FileSystem.cacheDirectory}tts/`;

/**
 * Ensure the TTS cache directory exists
 */
async function ensureCacheDir(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(TTS_CACHE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(TTS_CACHE_DIR, { intermediates: true });
  }
}

/**
 * Generate a cache key for the audio file
 */
function getCacheKey(text: string, voice: TTSVoice, speed: number): string {
  // Create a simple hash from the text and options
  const input = `${text}-${voice}-${speed}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `tts_${Math.abs(hash)}.mp3`;
}

/**
 * Check if audio is cached
 */
async function getCachedAudio(cacheKey: string): Promise<string | null> {
  const filePath = `${TTS_CACHE_DIR}${cacheKey}`;
  const fileInfo = await FileSystem.getInfoAsync(filePath);
  if (fileInfo.exists) {
    return filePath;
  }
  return null;
}

/**
 * Generate TTS audio using OpenAI's API with direct fetch
 */
export async function generateTTSAudio(
  text: string,
  options: TTSOptions = {}
): Promise<TTSResult> {
  const voice = options.voice || "nova";
  const speed = options.speed || 1.0;

  await ensureCacheDir();

  // Check cache first
  const cacheKey = getCacheKey(text, voice, speed);
  const cachedPath = await getCachedAudio(cacheKey);

  if (cachedPath) {
    console.log("Using cached TTS audio");
    // Get duration from cached file
    const sound = new Audio.Sound();
    try {
      await sound.loadAsync({ uri: cachedPath });
      const status = await sound.getStatusAsync();
      await sound.unloadAsync();

      const duration = status.isLoaded ? (status.durationMillis || 0) / 1000 : 0;
      return { audioUri: cachedPath, duration };
    } catch (err) {
      console.log("Error loading cached audio, regenerating:", err);
      // If cache is corrupted, delete and regenerate
      await FileSystem.deleteAsync(cachedPath, { idempotent: true });
    }
  }

  const OPENAI_API_KEY = requireOpenAIApiKey();

  try {
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1",
        voice: voice,
        input: text,
        speed: speed,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 401 || response.status === 403) {
        throw new Error(
          "AI voice key was rejected. Update EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY with a valid OpenAI key."
        );
      }
      throw new Error(`TTS generation failed (${response.status}). Try again in a moment.`);
    }

    const arrayBuffer = await response.arrayBuffer();

    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    const filePath = `${TTS_CACHE_DIR}${cacheKey}`;
    await FileSystem.writeAsStringAsync(filePath, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const sound = new Audio.Sound();
    await sound.loadAsync({ uri: filePath });
    const status = await sound.getStatusAsync();
    await sound.unloadAsync();

    const duration = status.isLoaded ? (status.durationMillis || 0) / 1000 : 0;

    return { audioUri: filePath, duration };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Could not generate audio. Check your connection and try again.");
  }
}

/**
 * Generate TTS for a playlist item with proper formatting
 */
export async function generatePlaylistItemAudio(
  title: string,
  text: string,
  options: {
    voice?: TTSVoice;
    speed?: number;
    announceTitle?: boolean;
    speakVerseNumbers?: boolean;
  } = {}
): Promise<TTSResult> {
  let fullText = "";

  // Optionally announce the title
  if (options.announceTitle !== false) {
    fullText += `${title}. `;
  }

  // Add the scripture text
  fullText += text;

  return generateTTSAudio(fullText, {
    voice: options.voice,
    speed: options.speed,
  });
}

/**
 * Clear the TTS cache
 */
export async function clearTTSCache(): Promise<void> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(TTS_CACHE_DIR);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(TTS_CACHE_DIR, { idempotent: true });
    }
  } catch (error) {
    console.log("Error clearing TTS cache:", error);
  }
}

/**
 * Get cache size in bytes
 */
export async function getTTSCacheSize(): Promise<number> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(TTS_CACHE_DIR);
    if (!dirInfo.exists) return 0;

    const files = await FileSystem.readDirectoryAsync(TTS_CACHE_DIR);
    let totalSize = 0;

    for (const file of files) {
      const fileInfo = await FileSystem.getInfoAsync(`${TTS_CACHE_DIR}${file}`);
      if (fileInfo.exists && "size" in fileInfo) {
        totalSize += fileInfo.size || 0;
      }
    }

    return totalSize;
  } catch (error) {
    console.log("Error getting cache size:", error);
    return 0;
  }
}
