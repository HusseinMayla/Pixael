/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TELEGRAM_BOT_TOKEN?: string;
  readonly VITE_TELEGRAM_CHAT_ID?: string;
  readonly VITE_TELEGRAM_ALERTS_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
