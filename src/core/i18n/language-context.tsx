"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { apiClient } from "@/core/api";
import {
  isSupportedLanguage,
  LANGUAGE_COOKIE_NAME,
  LANGUAGE_STORAGE_KEY,
  type SupportedLanguage,
} from "@/core/i18n/language-config";
import { en } from "./locales/en";
import { es, type TranslationKey } from "./locales/es";
import { pt } from "./locales/pt";

export type { SupportedLanguage } from "@/core/i18n/language-config";

export interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: TranslationKey, fallback?: string) => string;
  languages: Array<{ code: SupportedLanguage; label: string; flag: string }>;
}

const SUPPORTED_LANGUAGES: Array<{ code: SupportedLanguage; label: string; flag: string }> = [
  { code: "es", label: "Espanol", flag: "ES" },
  { code: "en", label: "English", flag: "EN" },
  { code: "pt", label: "Portugues", flag: "PT" },
];

const DICTIONARIES: Record<SupportedLanguage, Record<TranslationKey, string>> = {
  es,
  en,
  pt,
};

const LanguageContext = createContext<LanguageContextType | null>(null);

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storage = window.localStorage;
  return typeof storage?.getItem === "function" && typeof storage?.setItem === "function" ? storage : null;
}

export function getDictionary(language: SupportedLanguage): Record<TranslationKey, string> {
  return DICTIONARIES[language] || DICTIONARIES.es;
}

export function translateKey(
  language: SupportedLanguage,
  key: TranslationKey,
  fallback?: string,
): string {
  const dictionary = getDictionary(language);
  return dictionary[key] || fallback || es[key] || key;
}

function readStoredLanguage(): SupportedLanguage | null {
  if (typeof window === "undefined") {
    return null;
  }

  const savedLanguage = getStorage()?.getItem(LANGUAGE_STORAGE_KEY) as SupportedLanguage | null;
  if (isSupportedLanguage(savedLanguage)) {
    return savedLanguage;
  }

  return null;
}

export function LanguageProvider({
  children,
  initialLanguage = "es",
}: {
  children: React.ReactNode;
  initialLanguage?: SupportedLanguage;
}) {
  const [language, setLanguageState] = useState<SupportedLanguage>(initialLanguage);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedLanguage = readStoredLanguage();
    const resolvedLanguage = storedLanguage ?? language;

    queueMicrotask(() => {
      if (storedLanguage && storedLanguage !== language) {
        setLanguageState(storedLanguage);
      }
      document.documentElement.lang = resolvedLanguage;
      getStorage()?.setItem(LANGUAGE_STORAGE_KEY, resolvedLanguage);
      document.cookie = `${LANGUAGE_COOKIE_NAME}=${resolvedLanguage}; path=/; max-age=31536000; samesite=lax`;
    });
  }, [language]);

  const setLanguage = (newLanguage: SupportedLanguage) => {
    setLanguageState(newLanguage);

    if (typeof window === "undefined") {
      return;
    }

    const storage = getStorage();
    storage?.setItem(LANGUAGE_STORAGE_KEY, newLanguage);
    document.cookie = `${LANGUAGE_COOKIE_NAME}=${newLanguage}; path=/; max-age=31536000; samesite=lax`;
    const token = storage?.getItem("lean-builder.auth-token") || storage?.getItem("antigravity_auth_token");
    if (!token) {
      return;
    }

    try {
      void apiClient.patch("/api/v1/auth/language", {
        body: { preferred_language: newLanguage },
      }).catch(() => {
        // Ignore silent auth/update failures on partially authenticated surfaces.
      });
    } catch {
      // ignore
    }
  };

  const t = (key: TranslationKey, fallback?: string): string => translateKey(language, key, fallback);

  return (
    <LanguageContext.Provider
      value={{
        language,
        languages: SUPPORTED_LANGUAGES,
        setLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: "es",
      languages: SUPPORTED_LANGUAGES,
      setLanguage: () => {},
      t: (key: TranslationKey, fallback?: string) => fallback ?? String(key),
    };
  }
  return context;
}

