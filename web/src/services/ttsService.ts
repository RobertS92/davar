export type TTSVoice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";

export const VOICE_OPTIONS: { id: TTSVoice; name: string; gender: string; style: string }[] = [
  { id: "alloy", name: "Alloy", gender: "Neutral", style: "Balanced and clear" },
  { id: "echo", name: "Echo", gender: "Male", style: "Warm and conversational" },
  { id: "fable", name: "Fable", gender: "Male", style: "British, narrative" },
  { id: "onyx", name: "Onyx", gender: "Male", style: "Deep and authoritative" },
  { id: "nova", name: "Nova", gender: "Female", style: "Friendly and expressive" },
  { id: "shimmer", name: "Shimmer", gender: "Female", style: "Soft and gentle" },
];

type SpeakHandlers = {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (message: string) => void;
  onBoundary?: (charIndex: number) => void;
};

let currentUtterance: SpeechSynthesisUtterance | null = null;

function pickVoice(preferred: TTSVoice): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const preferFemale = preferred === "nova" || preferred === "shimmer";
  const preferBritish = preferred === "fable";
  const preferDeep = preferred === "onyx";

  const scored = voices
    .filter((v) => /en/i.test(v.lang))
    .map((voice) => {
      let score = 0;
      const name = voice.name.toLowerCase();
      if (preferFemale && /(female|samantha|karen|moira|victoria|zira|google uk english female)/i.test(name)) score += 3;
      if (!preferFemale && /(male|daniel|alex|david|fred|google uk english male)/i.test(name)) score += 3;
      if (preferBritish && /en-gb|british|uk/i.test(`${voice.lang} ${name}`)) score += 2;
      if (preferDeep && /(daniel|alex|fred)/i.test(name)) score += 1;
      if (voice.default) score += 0.5;
      return { voice, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0]?.voice ?? voices.find((v) => /en/i.test(v.lang)) ?? voices[0];
}

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function stopSpeaking(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  currentUtterance = null;
}

export function pauseSpeaking(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.pause();
}

export function resumeSpeaking(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.resume();
}

export function speakText(
  text: string,
  options: {
    voice?: TTSVoice;
    speed?: number;
  } = {},
  handlers: SpeakHandlers = {}
): void {
  if (!isSpeechSupported()) {
    handlers.onError?.("Speech is not supported in this browser.");
    return;
  }

  stopSpeaking();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = Math.min(2, Math.max(0.7, options.speed ?? 1));
  utterance.pitch = options.voice === "onyx" ? 0.85 : options.voice === "shimmer" ? 1.05 : 1;
  const voice = pickVoice(options.voice ?? "nova");
  if (voice) utterance.voice = voice;

  utterance.onstart = () => handlers.onStart?.();
  utterance.onend = () => {
    currentUtterance = null;
    handlers.onEnd?.();
  };
  utterance.onerror = () => {
    currentUtterance = null;
    handlers.onError?.("Could not play audio. Try again or switch to Read mode.");
  };
  utterance.onboundary = (event) => {
    if (typeof event.charIndex === "number") handlers.onBoundary?.(event.charIndex);
  };

  currentUtterance = utterance;

  // Chrome sometimes needs voices loaded asynchronously
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) {
    window.speechSynthesis.onvoiceschanged = () => {
      const refreshed = pickVoice(options.voice ?? "nova");
      if (refreshed) utterance.voice = refreshed;
      window.speechSynthesis.speak(utterance);
    };
  } else {
    window.speechSynthesis.speak(utterance);
  }
}

export function warmUpVoices(): void {
  if (!isSpeechSupported()) return;
  window.speechSynthesis.getVoices();
}
