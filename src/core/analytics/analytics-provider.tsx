"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { captureAttributionFromLocation, clearAttribution } from "@/core/analytics/attribution";
import { pushAnalyticsEvent } from "@/core/analytics/analytics-client";
import {
  applyDefaultGoogleConsent,
  applyGoogleConsent,
  readConsentChoice,
  saveConsentChoice,
} from "@/core/analytics/consent-store";
import type { AnalyticsConsentChoice } from "@/core/analytics/contracts";
import { sanitizePathname, sanitizeReferrer, sanitizeTitle, sanitizeUrl } from "@/core/analytics/sanitize";
import { getGoogleTagManagerId, isAnalyticsEnabled } from "@/core/config/runtime";
import { useLanguage } from "@/core/i18n/language-context";

function subscribeConsent(listener: () => void) {
  window.addEventListener("lab:analytics-consent-changed", listener);
  return () => window.removeEventListener("lab:analytics-consent-changed", listener);
}

function getConsentSnapshot() {
  return JSON.stringify(readConsentChoice());
}

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const [showPreferences, setShowPreferences] = useState(false);
  const consentSnapshot = useSyncExternalStore(subscribeConsent, getConsentSnapshot, () => "null");
  const choice = useMemo(() => JSON.parse(consentSnapshot) as AnalyticsConsentChoice | null, [consentSnapshot]);
  const analyticsEnabled = isAnalyticsEnabled();
  const gtmId = getGoogleTagManagerId();
  const shouldLoadGtm = analyticsEnabled && Boolean(gtmId) && (choice?.analytics || choice?.advertising);

  useEffect(() => {
    applyDefaultGoogleConsent();
    applyGoogleConsent(choice);
    if (choice?.analytics || choice?.advertising) {
      captureAttributionFromLocation();
    } else {
      clearAttribution();
    }
  }, [choice]);

  const routeKey = useMemo(() => `${pathname}?${searchParams.toString()}`, [pathname, searchParams]);

  useEffect(() => {
    if (!choice?.analytics) return;
    captureAttributionFromLocation();
    pushAnalyticsEvent("page_view", {
      page_path: sanitizePathname(pathname || "/"),
      page_title: sanitizeTitle(document.title || "Lean Agent Builder"),
      page_location: sanitizeUrl(window.location.href),
      page_referrer: sanitizeReferrer(document.referrer),
    });
  }, [choice?.analytics, pathname, routeKey]);

  function updateConsent(next: Pick<AnalyticsConsentChoice, "analytics" | "advertising">) {
    saveConsentChoice(next);
    setShowPreferences(false);
  }

  return (
    <>
      {children}
      {shouldLoadGtm ? (
        <Script id="lab-gtm" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmId}');
          `}
        </Script>
      ) : null}
      {analyticsEnabled && (showPreferences || !choice) ? (
        <ConsentBanner
          language={language}
          onAcceptAll={() => updateConsent({ analytics: true, advertising: true })}
          onReject={() => updateConsent({ analytics: false, advertising: false })}
        />
      ) : null}
      {analyticsEnabled && choice && !showPreferences ? (
        <button
          type="button"
          onClick={() => setShowPreferences(true)}
          className="fixed bottom-3 left-3 z-40 rounded-md border border-slate-300 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          {language === "en" ? "Privacy" : language === "pt" ? "Privacidade" : "Privacidad"}
        </button>
      ) : null}
    </>
  );
}

function ConsentBanner({
  language,
  onAcceptAll,
  onReject,
}: {
  language: string;
  onAcceptAll: () => void;
  onReject: () => void;
}) {
  const copy =
    language === "en"
      ? {
          title: "Measurement preferences",
          body: "We use optional analytics and advertising measurement to understand the funnel. We do not send prompts, email, tokens, or project text to Google.",
          reject: "Reject",
          accept: "Accept",
        }
      : language === "pt"
        ? {
            title: "Preferencias de medicao",
            body: "Usamos medicao opcional de analitica e publicidade para entender o funil. Nao enviamos prompts, email, tokens ou textos de projeto ao Google.",
            reject: "Recusar",
            accept: "Aceitar",
          }
        : {
            title: "Preferencias de medicion",
            body: "Usamos medicion opcional de analitica y publicidad para entender el funnel. No enviamos prompts, correos, tokens ni textos de proyecto a Google.",
            reject: "Rechazar",
            accept: "Aceptar",
          };

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white p-4 text-slate-900 shadow-xl">
      <p className="text-sm font-bold">{copy.title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-600">{copy.body}</p>
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={onReject} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700">
          {copy.reject}
        </button>
        <button type="button" onClick={onAcceptAll} className="rounded-md bg-indigo-600 px-3 py-2 text-xs font-bold text-white">
          {copy.accept}
        </button>
      </div>
    </div>
  );
}
