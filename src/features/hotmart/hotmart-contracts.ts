import type { ProductCatalogResponse } from "@/features/sessions/types";

export type HotmartEnvironment = "sandbox" | "production";
export type HotmartEntitlementTier = "blueprint" | "blueprint_pro" | "acp";
export type HotmartSyncResource =
  | "coupons"
  | "offers"
  | "payment_links"
  | "plans"
  | "products"
  | "sales"
  | "subscriptions";

export type HotmartCredentialUpsertRequest = {
  api_base_url?: string;
  auth_base_url?: string;
  basic_token?: string;
  client_id?: string;
  client_secret?: string;
  enabled?: boolean;
  environment: HotmartEnvironment;
  hottok?: string;
  webhook_public_url?: string;
};

export type HotmartIntegrationStatusResponse = {
  api_base_url: string;
  auth_base_url: string;
  basic_token_configured: boolean;
  client_id_configured: boolean;
  client_secret_configured: boolean;
  contract_version: string;
  enabled: boolean;
  environment: HotmartEnvironment;
  hottok_configured: boolean;
  last_health_check_at?: string | null;
  last_health_message: string;
  last_health_status: string;
  last_sync_at?: string | null;
  status: string;
  storage_mode: string;
  updated_at?: string | null;
  webhook_public_url: string;
  workspace_id: string;
};

export type HotmartTestConnectionResponse = {
  checked_at: string;
  contract_version: string;
  environment: HotmartEnvironment;
  http_status?: number | null;
  message: string;
  rate_limit_remaining?: number | null;
  reachable: boolean;
  status: string;
  token_expires_in?: number | null;
  workspace_id: string;
};

export type HotmartProductMappingUpsertRequest = {
  billing_mode?: string;
  currency?: string;
  environment: HotmartEnvironment;
  entitlement_scope?: string;
  grants_tier?: HotmartEntitlementTier;
  hotmart_price_strategy?: string;
  hotmart_product_id?: string;
  hotmart_product_ucode?: string;
  internal_product_key: string;
  is_active?: boolean;
  metadata?: Record<string, unknown>;
  offer_code?: string;
  plan_code?: string;
  trm_policy?: string;
};

export type HotmartProductMappingResponse = {
  billing_mode: string;
  contract_version: string;
  currency: string;
  entitlement_scope: string;
  environment: HotmartEnvironment;
  grants_tier: HotmartEntitlementTier;
  hotmart_price_strategy: string;
  hotmart_product_id: string;
  hotmart_product_ucode: string;
  id: string;
  internal_base_currency?: string;
  internal_product_key: string;
  internal_unit_amount_usd_cents: number;
  is_active: boolean;
  offer_code: string;
  plan_code: string;
  trm_policy: string;
  updated_at: string;
  workspace_id: string;
};

export type HotmartPaymentLinkCreateRequest = {
  callback_url?: string;
  checkout_ref?: string;
  environment: HotmartEnvironment;
  force_new?: boolean;
  link_name?: string;
  order_id?: string | null;
};

export type HotmartPaymentLinkResponse = {
  activation_status: string;
  checkout_url: string;
  contract_version: string;
  created_at: string;
  currency: string;
  discount_amount_cents: number;
  discount_origin: string;
  gross_amount_cents: number;
  hotmart_payment_link_id: string;
  id: string;
  internal_product_key: string;
  net_amount_cents: number;
  order_id: string;
  provider_ref: string;
  updated_at: string;
  workspace_id: string;
};

export type HotmartPromotionCreateRequest = {
  affiliate_id?: string;
  coupon_code: string;
  discount_percent: number;
  ends_at?: string | null;
  environment: HotmartEnvironment;
  internal_campaign_key?: string;
  internal_product_key: string;
  metadata?: Record<string, unknown>;
  offer_codes?: string[];
  publish?: boolean;
  starts_at?: string | null;
};

export type HotmartPromotionResponse = {
  contract_version: string;
  coupon_code: string;
  coupon_id: string;
  created_at: string;
  discount_amount_cents?: number | null;
  discount_origin: string;
  discount_percent: number;
  discount_type: string;
  ends_at?: string | null;
  environment: HotmartEnvironment;
  hotmart_product_id: string;
  id: string;
  internal_campaign_key: string;
  internal_product_key: string;
  offer_codes: string[];
  published_at?: string | null;
  starts_at?: string | null;
  status: string;
  updated_at: string;
  workspace_id: string;
};

export type HotmartPromotionDeleteResponse = {
  contract_version: string;
  coupon_code: string;
  coupon_id: string;
  deleted_remote: boolean;
  id: string;
  message: string;
  status: string;
};

export type HotmartPromotionMetricsResponse = {
  active: number;
  contract_version: string;
  deleted: number;
  expired: number;
  internal_upgrade_credit_count: number;
  provider_coupon_count: number;
  scheduled: number;
  sync_error: number;
  total: number;
};

export type HotmartSyncRequest = {
  environment: HotmartEnvironment;
  filters?: Record<string, unknown>;
  force_reset?: boolean;
  max_results?: number;
  page_token?: string;
  product_id?: string;
  resource: HotmartSyncResource;
};

export type HotmartSyncRunResponse = {
  contract_version: string;
  cursor_after: string;
  cursor_before: string;
  environment: HotmartEnvironment;
  error_summary: string;
  finished_at?: string | null;
  id: string;
  issue_count: number;
  records_created: number;
  records_read: number;
  records_skipped: number;
  records_updated: number;
  resource: string;
  started_at: string;
  started_by_user_id?: string | null;
  status: string;
  workspace_id: string;
};

export type HotmartSyncCursorResponse = {
  contract_version: string;
  environment: HotmartEnvironment;
  id: string;
  last_event_at?: string | null;
  last_success_at?: string | null;
  last_transaction: string;
  page_token: string;
  resource: string;
  updated_at: string;
  workspace_id: string;
};

export type HotmartReconciliationIssueResponse = {
  contract_version: string;
  created_at: string;
  environment: HotmartEnvironment;
  id: string;
  internal_ref: string;
  issue_type: string;
  provider_ref: string;
  resolution_action: string;
  resolution_note: string;
  resolved_at?: string | null;
  resolved_by_user_id?: string | null;
  severity: string;
  status: string;
  suggested_action: string;
  summary: string;
  updated_at: string;
  workspace_id: string;
};

export type HotmartReconciliationResolveRequest = {
  resolution_action: string;
  resolution_note?: string;
  status?: "ignored" | "needs_review" | "resolved";
};

export type HotmartWebhookReplayResponse = {
  contract_version: string;
  event_id: string;
  issue_id?: string | null;
  message: string;
  processing_status: string;
  retries: number;
};

export type HotmartClubSyncRequest = {
  environment: HotmartEnvironment;
  is_extra?: boolean | null;
  module_id?: string;
  subdomain: string;
  sync_modules?: boolean;
  sync_pages?: boolean;
  sync_progress?: boolean;
  sync_students?: boolean;
  user_id?: string;
};

export type HotmartClubOverviewResponse = {
  contract_version: string;
  environment: HotmartEnvironment;
  last_sync_at?: string | null;
  last_sync_status: string;
  modules_count: number;
  open_issue_count: number;
  pages_count: number;
  progress_count: number;
  students_count: number;
  subdomain: string;
  workspace_id: string;
};

export type HotmartClubModuleResponse = {
  contract_version: string;
  is_extra: boolean;
  is_extra_paid: boolean;
  is_public: boolean;
  module_id: string;
  name: string;
  sequence: number;
  total_pages: number;
};

export type HotmartClubPageResponse = {
  contract_version: string;
  module_id: string;
  name: string;
  page_id: string;
  page_order: number;
  type: string;
};

export type HotmartClubStudentResponse = {
  contract_version: string;
  email: string;
  engagement: string;
  name: string;
  progress: Record<string, unknown>;
  status: string;
  user_id: string;
};

export type HotmartClubProgressResponse = {
  completed: boolean;
  completed_at?: string | null;
  contract_version: string;
  email: string;
  page_id: string;
  page_name: string;
  progress_payload: Record<string, unknown>;
  user_id: string;
};

export type HotmartReleaseChecklistItemResponse = {
  contract_version: string;
  detail: string;
  evidence: string[];
  key: string;
  label: string;
  required: boolean;
  severity: "critical" | "high" | "low" | "medium";
  status: "failed" | "manual" | "passed" | "warning";
};

export type HotmartOperationalAlertResponse = {
  contract_version: string;
  created_at: string;
  evidence: string[];
  key: string;
  message: string;
  severity: "critical" | "high" | "low" | "medium";
  status: "active" | "resolved";
  title: string;
};

export type HotmartRunbookSectionResponse = {
  contract_version: string;
  key: string;
  links: string[];
  steps: string[];
  title: string;
};

export type HotmartReleaseReadinessResponse = {
  alerts: HotmartOperationalAlertResponse[];
  checklist: HotmartReleaseChecklistItemResponse[];
  contract_version: string;
  environment: HotmartEnvironment;
  generated_at: string;
  metrics: Record<string, number>;
  overall_status: "blocked" | "needs_attention" | "ready";
  release_candidate: boolean;
  runbook: HotmartRunbookSectionResponse[];
  workspace_id: string;
};

export type HotmartCheckoutSessionRequest = {
  cancel_url?: string;
  idempotency_key?: string;
  price_code?: string;
  product_key: string;
  session_id: string;
  success_url?: string;
};

export type HotmartCheckoutSessionResponse = {
  checkout_ref: string;
  checkout_url: string;
  contract_version: string;
  currency: string;
  expires_at?: string | null;
  next_action: string;
  order_id: string;
  product_key: string;
  provider: string;
  session_id: string;
  status: string;
  total_cents: number;
  workspace_id: string;
};

export type HotmartDashboardData = {
  clubModules: HotmartClubModuleResponse[];
  clubOverview: HotmartClubOverviewResponse;
  clubPages: HotmartClubPageResponse[];
  clubProgress: HotmartClubProgressResponse[];
  clubStudents: HotmartClubStudentResponse[];
  links: HotmartPaymentLinkResponse[];
  mappings: HotmartProductMappingResponse[];
  operationalAlerts: HotmartOperationalAlertResponse[];
  products: ProductCatalogResponse[];
  promotionMetrics: HotmartPromotionMetricsResponse;
  promotions: HotmartPromotionResponse[];
  releaseReadiness: HotmartReleaseReadinessResponse;
  runbook: HotmartRunbookSectionResponse[];
  reconciliationIssues: HotmartReconciliationIssueResponse[];
  status: HotmartIntegrationStatusResponse;
  syncCursors: HotmartSyncCursorResponse[];
  syncRuns: HotmartSyncRunResponse[];
};

export type HotmartCheckoutLinkFlowResponse = {
  checkout: HotmartCheckoutSessionResponse;
  paymentLink: HotmartPaymentLinkResponse;
};
