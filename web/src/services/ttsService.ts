import { apiUrl } from "@/lib/api";

export type TTSVoice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";

export const VOICE_OPTIONS: { id: TTSVoice; name: string; gender: string; style: string }[] = [
  { id: "alloy", name: "Alloy", gender: "Neutral", style: "Balanced and clear" },
  { id: "echo", name: "Echo", gender: "Male", style: "Warm and conversational" },
  { id: "fable", name: "Fable", gender: "Male", style: "British, narrative" },
  { id: "onyx", name: "Onyx", gender: "Male", style: "Deep and authoritative" },
  { id: "nova", name: "Nova", gender: "Female", style: "Friendly and expressive" },
  { id: "shimmer", name: "Shimmer", gender: "Female", style: "Soft and gentle" },
];

const DB_NAME = "davar-tts-cache";
const STORE = "audio";

type SpeakHandlers = {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (message: string) => void;
  onTimeUpdate?: (current: number, duration: number) => void;
};

let currentAudio: HTMLAudioElement | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;
let openAiAvailable: boolean | null = null;

function getCacheKey(text: string, voice: TTSVoice, speed: number): string {
  const input = `${text}-${voice}-${speed}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return `tts_${Math.abs(hash)}`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key: string): Promise<Blob | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve((req.result as Blob) || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

async function idbSet(key: string, blob: Blob): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(blob, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // ignore cache write failures
  }
}

export async function idbDeleteKeys(keys: string[]): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      keys.forEach((k) => store.delete(k));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // ignore
  }
}

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && ("speechSynthesis" in window || typeof Audio !== "undefined");
}

export async function probeOpenAiTts(): Promise<boolean> {
  if (openAiAvailable !== null) return openAiAvailable;
  try {
    const res = await fetch(apiUrl("/api/tts/health"));
    openAiAvailable = res.ok;
  } catch {
    openAiAvailable = false;
  }
  return openAiAvailable;
}

export async function generateTTSAudio(
  text: string,
  options: { voice?: TTSVoice; speed?: number } = {}
): Promise<{ audioUri: string; duration: number; cacheKey: string }> {
  const voice = options.voice || "nova";
  const speed = options.speed || 1.0;
  const cacheKey = getCacheKey(text, voice, speed);

  const cached = await idbGet(cacheKey);
  if (cached) {
    const audioUri = URL.createObjectURL(cached);
    const duration = await estimateDuration(audioUri);
    return { audioUri, duration, cacheKey };
  }

  const response = await fetch(apiUrl("/api/tts"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice, speed }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(err || "TTS generation failed");
  }

  const blob = await response.blob();
  await idbSet(cacheKey, blob);
  const audioUri = URL.createObjectURL(blob);
  const duration = await estimateDuration(audioUri);
  openAiAvailable = true;
  return { audioUri, duration, cacheKey };
}

export async function generatePlaylistItemAudio(
  title: string,
  text: string,
  options: {
    voice?: TTSVoice;
    speed?: number;
    announceTitle?: boolean;
  } = {}
): Promise<{ audioUri: string; duration: number; cacheKey: string }> {
  let fullText = "";
  if (options.announceTitle !== false) fullText += `${title}. `;
  fullText += text;
  return generateTTSAudio(fullText, { voice: options.voice, speed: options.speed });
}

function estimateDuration(uri: string): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      resolve(Number.isFinite(audio.duration) ? audio.duration : 0);
      audio.src = "";
    };
    audio.onerror = () => resolve(0);
    audio.src = uri;
  });
}

function pickVoice(preferred: TTSVoice): SpeechSynthesisVoice | null {
  if (!window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const preferFemale = preferred === "nova" || preferred === "shimmer";
  const preferBritish = preferred === "fable";
  const scored = voices
    .filter((v) => /en/i.test(v.lang))
    .map((voice) => {
      let score = 0;
      const name = voice.name.toLowerCase();
      if (preferFemale && /(female|samantha|karen|moira|victoria|zira)/i.test(name)) score += 3;
      if (!preferFemale && /(male|daniel|alex|david|fred)/i.test(name)) score += 3;
      if (preferBritish && /en-gb|british|uk/i.test(`${voice.lang} ${name}`)) score += 2;
      if (voice.default) score += 0.5;
      return { voice, score };
    })
    .sort((a, b) => b.score - a.score);
  return scored[0]?.voice ?? voices[0];
}

export function stopSpeaking(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  currentUtterance = null;
}

export function pauseSpeaking(): void {
  if (currentAudio && !currentAudio.paused) currentAudio.pause();
  else if (window.speechSynthesis) window.speechSynthesis.pause();
}

export function resumeSpeaking(): void {
  if (currentAudio && currentAudio.paused) void currentAudio.play();
  else if (window.speechSynthesis) window.speechSynthesis.resume();
}

export async function speakText(
  text: string,
  options: { voice?: TTSVoice; speed?: number; preferOpenAi?: boolean; startAt?: number } = {},
  handlers: SpeakHandlers = {}
): Promise<"openai" | "speech"> {
  stopSpeaking();
  const voice = options.voice || "nova";
  const speed = options.speed || 1.0;
  const preferOpenAi = options.preferOpenAi !== false;

  if (preferOpenAi) {
    try {
      const { audioUri } = await generateTTSAudio(text, { voice, speed });
      await playAudioUri(audioUri, handlers, { speed, startAt: options.startAt });
      return "openai";
    } catch {
      openAiAvailable = false;
      // fall through to browser speech
    }
  }

  if (!window.speechSynthesis) {
    handlers.onError?.("Speech is not supported in this browser.");
    throw new Error("Speech unsupported");
  }

  return new Promise((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = Math.min(2, Math.max(0.7, speed));
    utterance.pitch = voice === "onyx" ? 0.85 : voice === "shimmer" ? 1.05 : 1;
    const picked = pickVoice(voice);
    if (picked) utterance.voice = picked;

    utterance.onstart = () => handlers.onStart?.();
    utterance.onend = () => {
      currentUtterance = null;
      handlers.onEnd?.();
      resolve("speech");
    };
    utterance.onerror = () => {
      currentUtterance = null;
      handlers.onError?.("Could not play audio. Try Read mode instead.");
      reject(new Error("Speech failed"));
    };

    currentUtterance = utterance;
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) {
      window.speechSynthesis.onvoiceschanged = () => {
        const refreshed = pickVoice(voice);
        if (refreshed) utterance.voice = refreshed;
        window.speechSynthesis.speak(utterance);
      };
    } else {
      window.speechSynthesis.speak(utterance);
    }
  });
}

function playAudioUri(
  uri: string,
  handlers: SpeakHandlers,
  options: { speed?: number; startAt?: number } = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(uri);
    currentAudio = audio;
    const speed = options.speed || 1;
    audio.playbackRate = Math.min(2, Math.max(0.5, speed));
    audio.onloadedmetadata = () => {
      if (options.startAt && Number.isFinite(options.startAt) && options.startAt > 0) {
        try {
          audio.currentTime = Math.min(options.startAt, audio.duration || options.startAt);
        } catch {
          // ignore seek failures
        }
      }
    };
    audio.onplay = () => handlers.onStart?.();
    audio.ontimeupdate = () => {
      handlers.onTimeUpdate?.(audio.currentTime, audio.duration || 0);
    };
    audio.onended = () => {
      currentAudio = null;
      handlers.onEnd?.();
      resolve();
    };
    audio.onerror = () => {
      currentAudio = null;
      handlers.onError?.("Could not play generated audio.");
      reject(new Error("Audio playback failed"));
    };
    void audio.play().catch((err) => {
      currentAudio = null;
      handlers.onError?.("Tap play to start audio (browser blocked autoplay).");
      reject(err);
    });
  });
}

export function seekSpeaking(seconds: number): void {
  if (currentAudio && Number.isFinite(seconds)) {
    const max = Number.isFinite(currentAudio.duration) ? currentAudio.duration : seconds;
    currentAudio.currentTime = Math.max(0, Math.min(seconds, max));
  }
}

export function getSpeakingPosition(): number {
  return currentAudio?.currentTime ?? 0;
}

export function setSpeakingRate(speed: number): void {
  if (currentAudio) {
    currentAudio.playbackRate = Math.min(2, Math.max(0.5, speed));
  }
}

export function warmUpVoices(): void {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.getVoices();
  }
  void probeOpenAiTts();
}

export function pauseStyleDelayMs(style: "short" | "medium" | "long"): number {
  if (style === "short") return 600;
  if (style === "long") return 3200;
  return 1600;
}
