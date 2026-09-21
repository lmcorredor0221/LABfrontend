import { ALLOWED_EVENT_PARAMS, type AnalyticsEventName, type SafeAnalyticsParams } from "@/core/analytics/contracts";
import { readConsentChoice } from "@/core/analytics/consent-store";
import { isAnalyticsEnabled } from "@/core/config/runtime";

function isSafeScalar(value: unknown): value is string | number | boolean | null | undefined {
  return value === null || value === undefined || ["string", "number", "boolean"].includes(typeof value);
}

function filterParams(event: AnalyticsEventName, params: SafeAnalyticsParams = {}) {
  const allowed = ALLOWED_EVENT_PARAMS[event];
  const filtered: SafeAnalyticsParams = {};
  for (const [key, value] of Object.entries(params)) {
    if (!allowed.has(key) || !isSafeScalar(value)) continue;
    filtered[key] = typeof value === "string" ? value.slice(0, 160) : value;
  }
  return filtered;
}

export function canSendAnalyticsEvent() {
  return isAnalyticsEnabled() && readConsentChoice()?.analytics === true;
}

export function pushAnalyticsEvent(event: AnalyticsEventName, params: SafeAnalyticsParams = {}) {
  if (typeof window === "undefined" || !canSendAnalyticsEvent()) return false;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event,
    ...filterParams(event, params),
  });
  return true;
}

export function trackFunnelCtaClick(params: SafeAnalyticsParams) {
  return pushAnalyticsEvent("funnel_cta_click", params);
}

export function trackValidatorStarted(params: SafeAnalyticsParams) {
  return pushAnalyticsEvent("validator_started", params);
}

export function trackIdeaEvaluated(params: SafeAnalyticsParams) {
  return pushAnalyticsEvent("idea_evaluated", params);
}

export function trackSignUp(method: "email" | "google" = "email") {
  return pushAnalyticsEvent("sign_up", { method });
}

export function trackLogin(method: "email" | "google") {
  return pushAnalyticsEvent("login", { method });
}

export function trackProjectCreated(params: SafeAnalyticsParams) {
  return pushAnalyticsEvent("project_created", params);
}

export function trackBeginCheckout(params: SafeAnalyticsParams) {
  return pushAnalyticsEvent("begin_checkout", params);
}
