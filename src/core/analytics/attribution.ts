import type { AttributionSnapshot, MarketingContext } from "@/core/analytics/contracts";
import { consentToMarketingContext, readConsentChoice } from "@/core/analytics/consent-store";

const STORAGE_KEY = "lab_marketing_attribution_v1";
const ATTRIBUTION_TTL_DAYS = 30;
const SAFE_VALUE = /^[a-zA-Z0-9 _.\-:/|+%]{1,160}$/;
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
const AD_CLICK_KEYS = ["gclid", "gbraid", "wbraid"] as const;

function getStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function safeParam(value: string | null) {
  const trimmed = (value || "").trim().slice(0, 160);
  return trimmed && SAFE_VALUE.test(trimmed) ? trimmed : "";
}

function readSnapshot(): AttributionSnapshot | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) || "null") as AttributionSnapshot | null;
    if (!parsed?.expires_at || Date.parse(parsed.expires_at) <= Date.now()) {
      storage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeSnapshot(snapshot: AttributionSnapshot) {
  try {
    getStorage()?.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // ignore
  }
}

export function clearAttribution() {
  try {
    getStorage()?.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function captureAttributionFromLocation() {
  if (typeof window === "undefined") return readSnapshot();
  const consent = readConsentChoice();
  if (!consent?.analytics && !consent?.advertising) {
    clearAttribution();
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const touch: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    const value = safeParam(params.get(key));
    if (value && consent.analytics) touch[key] = value;
  }
  for (const key of AD_CLICK_KEYS) {
    const value = safeParam(params.get(key));
    if (value && consent.advertising) touch[key] = value;
  }
  if (!Object.keys(touch).length) return readSnapshot();

  const existing = readSnapshot();
  const now = new Date();
  const expires = new Date(now.getTime() + ATTRIBUTION_TTL_DAYS * 24 * 60 * 60 * 1000);
  const snapshot: AttributionSnapshot = {
    captured_at: now.toISOString(),
    expires_at: expires.toISOString(),
    first_touch: existing?.first_touch || touch,
    last_touch: touch,
  };
  writeSnapshot(snapshot);
  return snapshot;
}

function cookieValue(name: string) {
  if (typeof document === "undefined") return "";
  const prefix = `${name}=`;
  return (
    document.cookie
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith(prefix))
      ?.slice(prefix.length) || ""
  );
}

function readGaClientId() {
  const raw = cookieValue("_ga");
  const parts = raw.split(".");
  if (parts.length >= 4) return `${parts[2]}.${parts[3]}`;
  return "";
}

function readGaSessionId() {
  const measurementId = (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "").replace(/^G-/, "");
  if (!measurementId) return "";
  const raw = cookieValue(`_ga_${measurementId}`);
  const match = raw.match(/\.s(\d+)\$/) || raw.match(/\.s(\d+)\./);
  return match?.[1] || "";
}

export function getMarketingContext(): MarketingContext {
  const choice = readConsentChoice();
  const consent = consentToMarketingContext(choice);
  const attribution = choice?.analytics || choice?.advertising ? readSnapshot() || undefined : undefined;
  const context: MarketingContext = { consent };
  if (attribution) context.attribution = attribution;
  if (choice?.analytics) {
    const clientId = readGaClientId();
    const sessionId = readGaSessionId();
    if (clientId) context.ga_client_id = clientId;
    if (sessionId) context.ga_session_id = sessionId;
  }
  return context;
}
