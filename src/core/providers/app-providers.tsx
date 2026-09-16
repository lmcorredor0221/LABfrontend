"use client";

import type { ReactNode } from "react";
import { AnalyticsProvider } from "@/core/analytics/analytics-provider";
import { AuthProvider } from "@/core/auth/auth-context";
import { CurrencyProvider } from "@/core/commerce/currency-context";
import { type SupportedLanguage } from "@/core/i18n/language-config";
import { LanguageProvider } from "@/core/i18n/language-context";
import { SessionsProvider } from "@/features/sessions/session-context";

export function AppProviders({
  children,
  initialLanguage,
}: {
  children: ReactNode;
  initialLanguage: SupportedLanguage;
}) {
  return (
    <LanguageProvider initialLanguage={initialLanguage}>
      <AnalyticsProvider>
        <AuthProvider>
          <CurrencyProvider>
            <SessionsProvider>{children}</SessionsProvider>
          </CurrencyProvider>
        </AuthProvider>
      </AnalyticsProvider>
    </LanguageProvider>
  );
}
