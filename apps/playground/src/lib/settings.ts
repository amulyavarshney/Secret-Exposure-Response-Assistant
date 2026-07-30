import type { Environment } from "@secret-response/shared";

export interface PlaygroundSettings {
  reporter?: string;
  fingerprintSalt?: string;
  defaultEnvironment?: Environment;
}

const STORAGE_KEY = "secret-response-playground-settings";

const DEFAULT_SETTINGS: PlaygroundSettings = {};

export function loadSettings(): PlaygroundSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } as PlaygroundSettings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: PlaygroundSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
