export type SupportedLanguage = "es" | "en" | "pt";

export const LANGUAGE_STORAGE_KEY = "antigravity_language";
export const LANGUAGE_COOKIE_NAME = "antigravity_language";

export function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return value === "es" || value === "en" || value === "pt";
}

export function resolveInitialLanguage(value: unknown, fallback: SupportedLanguage = "es"): SupportedLanguage {
  return isSupportedLanguage(value) ? value : fallback;
}
