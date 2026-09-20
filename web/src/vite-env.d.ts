/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_BIBLE_API_KEY?: string;
  readonly VITE_OPENAI_API_KEY?: string;
  readonly EXPO_PUBLIC_API_URL?: string;
  readonly EXPO_PUBLIC_BIBLE_API_KEY?: string;
  readonly EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
