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
  if (typeof window === "undefined" || !canSendAnalyticsEvent()) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event,
    ...filterParams(event, params),
  });
}

export function trackIdeaEvaluated(params: SafeAnalyticsParams) {
  pushAnalyticsEvent("idea_evaluated", params);
}

export function trackSignUp() {
  pushAnalyticsEvent("sign_up", { method: "email" });
}

export function trackProjectCreated(params: SafeAnalyticsParams) {
  pushAnalyticsEvent("project_created", params);
}

export function trackBeginCheckout(params: SafeAnalyticsParams) {
  pushAnalyticsEvent("begin_checkout", params);
}
