export type AnalyticsEventName =
  | "page_view"
  | "funnel_cta_click"
  | "validator_started"
  | "idea_evaluated"
  | "sign_up"
  | "project_created"
  | "begin_checkout";

export type ConsentValue = "granted" | "denied";

export type AnalyticsConsentChoice = {
  analytics: boolean;
  advertising: boolean;
  decidedAt: string;
  version: number;
};

export type SafeAnalyticsParams = Record<string, string | number | boolean | null | undefined>;

export type AttributionSnapshot = {
  captured_at: string;
  expires_at: string;
  first_touch?: Record<string, string>;
  last_touch?: Record<string, string>;
};

export type MarketingContext = {
  consent: {
    analytics_storage: ConsentValue;
    ad_storage: ConsentValue;
    ad_user_data: ConsentValue;
    ad_personalization: ConsentValue;
    version: number;
    decided_at?: string;
  };
  attribution?: AttributionSnapshot;
  ga_client_id?: string;
  ga_session_id?: string;
};

export const ANALYTICS_CONSENT_VERSION = 1;

export const ALLOWED_EVENT_PARAMS: Record<AnalyticsEventName, Set<string>> = {
  page_view: new Set(["page_path", "page_title", "page_location", "page_referrer"]),
  funnel_cta_click: new Set(["cta_name", "cta_location", "funnel_stage", "product_key", "destination", "language"]),
  validator_started: new Set(["language", "input_type"]),
  idea_evaluated: new Set(["language", "input_type", "verdict_badge", "readiness_score"]),
  sign_up: new Set(["method"]),
  project_created: new Set(["entrypoint", "language"]),
  begin_checkout: new Set(["currency", "value", "product_key", "provider", "checkout_ref"]),
};
