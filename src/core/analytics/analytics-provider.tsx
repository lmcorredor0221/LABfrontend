"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { captureAttributionFromLocation, clearAttribution } from "@/core/analytics/attribution";
import { pushAnalyticsEvent } from "@/core/analytics/analytics-client";
import {
  applyGoogleConsent,
  readConsentChoice,
  saveConsentChoice,
} from "@/core/analytics/consent-store";
import type { AnalyticsConsentChoice } from "@/core/analytics/contracts";
import { sanitizePathname, sanitizeReferrer, sanitizeTitle, sanitizeUrl } from "@/core/analytics/sanitize";
import {
  getGoogleAnalyticsMeasurementId,
  getGoogleTagManagerId,
  isAnalyticsEnabled,
} from "@/core/config/runtime";
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
  const [gtmReady, setGtmReady] = useState(false);
  const [gtmLoaded, setGtmLoaded] = useState(false);
  const hasInitializedMeasurement = useRef(false);
  const consentSnapshot = useSyncExternalStore(subscribeConsent, getConsentSnapshot, () => "null");
  const choice = useMemo(() => JSON.parse(consentSnapshot) as AnalyticsConsentChoice | null, [consentSnapshot]);
  const analyticsEnabled = isAnalyticsEnabled();
  const gaMeasurementId = getGoogleAnalyticsMeasurementId();
  const gtmId = getGoogleTagManagerId();
  const shouldLoadGtm = analyticsEnabled && Boolean(gtmId) && gtmReady;

  useEffect(() => {
    applyGoogleConsent(choice);
    const hasMeasurementConsent = Boolean(choice?.analytics || choice?.advertising);
    const readyTimer = window.setTimeout(() => setGtmReady(hasMeasurementConsent), 0);
    if (hasMeasurementConsent) {
      captureAttributionFromLocation();
    } else {
      clearAttribution();
    }
    return () => window.clearTimeout(readyTimer);
  }, [choice]);

  useEffect(() => {
    const markGtmLoaded = () => setGtmLoaded(true);
    const analyticsWindow = window as Window & { __labGtmLoaded?: boolean };

    const loadedTimer = analyticsWindow.__labGtmLoaded
      ? window.setTimeout(markGtmLoaded, 0)
      : undefined;

    window.addEventListener("lab:gtm-loaded", markGtmLoaded);
    return () => {
      if (loadedTimer !== undefined) window.clearTimeout(loadedTimer);
      window.removeEventListener("lab:gtm-loaded", markGtmLoaded);
    };
  }, []);

  const routeKey = useMemo(() => `${pathname}?${searchParams.toString()}`, [pathname, searchParams]);

  useEffect(() => {
    if (!choice?.analytics || !gtmLoaded) return;
    if (!hasInitializedMeasurement.current) {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: "lab_measurement_ready" });
      hasInitializedMeasurement.current = true;
    }

    let pageViewTimer: number | undefined;
    const readinessDeadline = Date.now() + 5_000;
    const sendPageView = () => {
      captureAttributionFromLocation();
      pushAnalyticsEvent("page_view", {
        page_path: sanitizePathname(pathname || "/"),
        page_title: sanitizeTitle(document.title || "Lean Agent Builder"),
        page_location: sanitizeUrl(window.location.href),
        page_referrer: sanitizeReferrer(document.referrer),
      });
    };
    const waitForMeasurementDestination = () => {
      const analyticsWindow = window as Window & {
        google_tag_manager?: Record<string, unknown>;
      };
      const destinationReady = Boolean(
        gaMeasurementId && analyticsWindow.google_tag_manager?.[gaMeasurementId],
      );
      if (destinationReady || Date.now() >= readinessDeadline) {
        pageViewTimer = window.setTimeout(sendPageView, 250);
        return;
      }
      pageViewTimer = window.setTimeout(waitForMeasurementDestination, 100);
    };
    waitForMeasurementDestination();

    return () => {
      if (pageViewTimer !== undefined) window.clearTimeout(pageViewTimer);
    };
  }, [choice?.analytics, gaMeasurementId, gtmLoaded, pathname, routeKey]);

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
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;j.onload=function(){
            w.__labGtmLoaded=true;w.dispatchEvent(new Event('lab:gtm-loaded'));
            };f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmId}');
          `}
        </Script>
      ) : null}
      {analyticsEnabled && (showPreferences || !choice) ? (
        <ConsentBanner
          initialChoice={choice}
          language={language}
          onSave={updateConsent}
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
  initialChoice,
  language,
  onSave,
}: {
  initialChoice: AnalyticsConsentChoice | null;
  language: string;
  onSave: (choice: Pick<AnalyticsConsentChoice, "analytics" | "advertising">) => void;
}) {
  const [analytics, setAnalytics] = useState(initialChoice?.analytics ?? false);
  const [advertising, setAdvertising] = useState(initialChoice?.advertising ?? false);
  const copy =
    language === "en"
      ? {
          title: "Measurement preferences",
          body: "We use optional analytics and advertising measurement to understand the funnel. We do not send prompts, email, tokens, or project text to Google.",
          analytics: "Analytics",
          analyticsBody: "Helps us understand visits, diagnoses, and product activation.",
          advertising: "Advertising",
          advertisingBody: "Preserves campaign attribution and measures Google Ads performance.",
          necessary: "Necessary only",
          save: "Save preferences",
          accept: "Accept all",
        }
      : language === "pt"
        ? {
            title: "Preferências de medição",
            body: "Usamos medição opcional de análise e publicidade para entender o funil. Não enviamos prompts, e-mails, tokens ou textos de projetos ao Google.",
            analytics: "Análise",
            analyticsBody: "Ajuda a entender visitas, diagnósticos e ativação do produto.",
            advertising: "Publicidade",
            advertisingBody: "Preserva a atribuição da campanha e mede o desempenho do Google Ads.",
            necessary: "Somente necessárias",
            save: "Salvar preferências",
            accept: "Aceitar tudo",
          }
        : {
            title: "Preferencias de medición",
            body: "Usamos medición opcional de analítica y publicidad para entender el funnel. No enviamos prompts, correos, tokens ni textos de proyectos a Google.",
            analytics: "Analítica",
            analyticsBody: "Ayuda a entender visitas, diagnósticos y activación del producto.",
            advertising: "Publicidad",
            advertisingBody: "Conserva la atribución de campaña y mide el rendimiento de Google Ads.",
            necessary: "Solo necesarias",
            save: "Guardar preferencias",
            accept: "Aceptar todo",
          };

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl">
      <p className="text-sm font-bold">{copy.title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-600">{copy.body}</p>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3">
          <input
            type="checkbox"
            checked={analytics}
            onChange={(event) => setAnalytics(event.target.checked)}
            className="mt-0.5 h-4 w-4 accent-indigo-600"
          />
          <span>
            <span className="block text-xs font-bold text-slate-800">{copy.analytics}</span>
            <span className="mt-0.5 block text-[11px] leading-4 text-slate-500">{copy.analyticsBody}</span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3">
          <input
            type="checkbox"
            checked={advertising}
            onChange={(event) => setAdvertising(event.target.checked)}
            className="mt-0.5 h-4 w-4 accent-indigo-600"
          />
          <span>
            <span className="block text-xs font-bold text-slate-800">{copy.advertising}</span>
            <span className="mt-0.5 block text-[11px] leading-4 text-slate-500">{copy.advertisingBody}</span>
          </span>
        </label>
      </div>

      <div className="mt-3 flex flex-col-reverse justify-end gap-2 sm:flex-row">
        <button type="button" onClick={() => onSave({ analytics: false, advertising: false })} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700">
          {copy.necessary}
        </button>
        <button type="button" onClick={() => onSave({ analytics, advertising })} className="rounded-md border border-indigo-300 px-3 py-2 text-xs font-bold text-indigo-700">
          {copy.save}
        </button>
        <button type="button" onClick={() => onSave({ analytics: true, advertising: true })} className="rounded-md bg-indigo-600 px-3 py-2 text-xs font-bold text-white">
          {copy.accept}
        </button>
      </div>
    </div>
  );
}
