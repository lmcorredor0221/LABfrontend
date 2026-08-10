import type { SupportedLanguage } from "@/core/i18n/language-context";

export function byLanguage<T>(
  language: SupportedLanguage,
  values: Record<SupportedLanguage, T>,
): T {
  return values[language] ?? values.es;
}
