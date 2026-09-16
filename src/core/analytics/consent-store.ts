import {
  ANALYTICS_CONSENT_VERSION,
  type AnalyticsConsentChoice,
  type MarketingContext,
} from "@/core/analytics/contracts";

const STORAGE_KEY = "lab_marketing_consent_v1";

function getStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readConsentChoice(): AnalyticsConsentChoice | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) || "null") as Partial<AnalyticsConsentChoice> | null;
    if (!parsed || parsed.version !== ANALYTICS_CONSENT_VERSION) return null;
    return {
      analytics: parsed.analytics === true,
      advertising: parsed.advertising === true,
      decidedAt: typeof parsed.decidedAt === "string" ? parsed.decidedAt : "",
      version: ANALYTICS_CONSENT_VERSION,
    };
  } catch {
    return null;
  }
}

export function saveConsentChoice(choice: Pick<AnalyticsConsentChoice, "analytics" | "advertising">) {
  const nextChoice: AnalyticsConsentChoice = {
    analytics: choice.analytics,
    advertising: choice.advertising,
    decidedAt: new Date().toISOString(),
    version: ANALYTICS_CONSENT_VERSION,
  };
  try {
    getStorage()?.setItem(STORAGE_KEY, JSON.stringify(nextChoice));
  } catch {
    // Storage can be unavailable in private contexts.
  }
  applyGoogleConsent(nextChoice);
  window.dispatchEvent(new CustomEvent("lab:analytics-consent-changed", { detail: nextChoice }));
  return nextChoice;
}

export function consentToMarketingContext(choice: AnalyticsConsentChoice | null): MarketingContext["consent"] {
  const analytics = choice?.analytics === true ? "granted" : "denied";
  const advertising = choice?.advertising === true ? "granted" : "denied";
  return {
    analytics_storage: analytics,
    ad_storage: advertising,
    ad_user_data: advertising,
    ad_personalization: advertising,
    version: ANALYTICS_CONSENT_VERSION,
    decided_at: choice?.decidedAt,
  };
}

export function applyDefaultGoogleConsent() {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtagShim(...args: unknown[]) {
      window.dataLayer?.push(args);
    };
  window.gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
  });
}

export function applyGoogleConsent(choice: AnalyticsConsentChoice | null) {
  if (typeof window === "undefined") return;
  applyDefaultGoogleConsent();
  const consent = consentToMarketingContext(choice);
  window.gtag?.("consent", "update", {
    ad_storage: consent.ad_storage,
    ad_user_data: consent.ad_user_data,
    ad_personalization: consent.ad_personalization,
    analytics_storage: consent.analytics_storage,
  });
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}
