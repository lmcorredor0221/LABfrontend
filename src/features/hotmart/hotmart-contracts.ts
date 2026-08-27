import type { ProductCatalogResponse } from "@/features/sessions/types";

export type HotmartEnvironment = "sandbox" | "production";
export type HotmartEntitlementTier = "blueprint" | "blueprint_pro" | "acp";
export type CommercialPackageType = "bundle_subscription" | "one_time" | "subscription";
export type CommercialQuotaBucketStatus = "active" | "canceled" | "exhausted" | "expired" | "scheduled";
export type CommercialQuotaLedgerMovementType = "adjustment" | "cancel" | "consume" | "credit" | "expire" | "overwrite" | "seed";
export type CommercialQuotaSourceKind = "adjustment" | "free" | "one_time" | "subscription";
export type CommercialDebtStatus = "canceled" | "open" | "settled" | "waived";
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
  package_code?: string;
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

export type HotmartDashboardBootstrapData = Pick<
  HotmartDashboardData,
  "clubOverview" | "products" | "promotionMetrics" | "releaseReadiness" | "status"
>;

export type CommercialQuotaProductConfigUpsertRequest = {
  allow_courtesy?: boolean;
  allow_debt_pending?: boolean;
  allow_manual_override_without_charge?: boolean;
  catalog_priority_strategy?: string;
  checkout_required_on_zero_balance?: boolean;
  consumption_priority?: string[];
  debt_enabled?: boolean;
  default_blocked_request_ttl_hours?: number;
  default_checkout_ttl_minutes?: number;
  display_name: string;
  duplicate_conflict_visibility?: string;
  enabled?: boolean;
  fifo_auto_approval_enabled?: boolean;
  initial_free_units?: number;
  metadata?: Record<string, unknown>;
  product_key: string;
  sync_retry_limit?: number;
};

export type CommercialQuotaProductConfigResponse = {
  allow_courtesy: boolean;
  allow_debt_pending: boolean;
  allow_manual_override_without_charge: boolean;
  catalog_priority_strategy: string;
  checkout_required_on_zero_balance: boolean;
  consumption_priority: string[];
  contract_version: string;
  debt_enabled: boolean;
  default_blocked_request_ttl_hours: number;
  default_checkout_ttl_minutes: number;
  display_name: string;
  duplicate_conflict_visibility: string;
  enabled: boolean;
  fifo_auto_approval_enabled: boolean;
  id: string;
  initial_free_units: number;
  product_key: string;
  sync_retry_limit: number;
  updated_at: string;
};

export type CommercialQuotaWorkspaceOverrideUpsertRequest = {
  checkout_required_on_zero_balance_override?: boolean | null;
  consumption_priority_override?: string[];
  debt_enabled_override?: boolean | null;
  default_blocked_request_ttl_hours_override?: number | null;
  default_checkout_ttl_minutes_override?: number | null;
  effective_from?: string | null;
  effective_to?: string | null;
  enabled_override?: boolean | null;
  fifo_auto_approval_enabled_override?: boolean | null;
  free_units_override?: number | null;
  is_active?: boolean;
  metadata?: Record<string, unknown>;
  notes?: string;
  product_key: string;
  workspace_id: string;
};

export type CommercialQuotaWorkspaceOverrideResponse = {
  checkout_required_on_zero_balance_override?: boolean | null;
  consumption_priority_override: string[];
  contract_version: string;
  debt_enabled_override?: boolean | null;
  default_blocked_request_ttl_hours_override?: number | null;
  default_checkout_ttl_minutes_override?: number | null;
  effective_from?: string | null;
  effective_to?: string | null;
  enabled_override?: boolean | null;
  fifo_auto_approval_enabled_override?: boolean | null;
  free_units_override?: number | null;
  id: string;
  is_active: boolean;
  notes: string;
  product_key: string;
  updated_at: string;
  updated_by_user_id?: string | null;
  workspace_id: string;
};

export type CommercialQuotaEffectiveConfigResponse = {
  allow_courtesy: boolean;
  allow_debt_pending: boolean;
  allow_manual_override_without_charge: boolean;
  catalog_priority_strategy: string;
  checkout_required_on_zero_balance: boolean;
  consumption_priority: string[];
  contract_version: string;
  debt_enabled: boolean;
  default_blocked_request_ttl_hours: number;
  default_checkout_ttl_minutes: number;
  display_name: string;
  duplicate_conflict_visibility: string;
  enabled: boolean;
  fifo_auto_approval_enabled: boolean;
  initial_free_units: number;
  override_id?: string | null;
  product_key: string;
  sync_retry_limit: number;
  workspace_id: string;
};

export type CommercialBalanceBucketResponse = {
  available_units: number;
  bucket_id: string;
  bucket_key: string;
  contract_version: string;
  ends_at?: string | null;
  source_kind: CommercialQuotaSourceKind;
  source_ref: string;
  starts_at: string;
  status: CommercialQuotaBucketStatus;
  units_consumed: number;
  units_granted: number;
};

export type CommercialBalanceSnapshotResponse = {
  buckets: CommercialBalanceBucketResponse[];
  by_source_kind: Record<string, number>;
  contract_version: string;
  product_key: string;
  total_available_units: number;
  workspace_id: string;
};

export type CommercialBalanceLedgerResponse = {
  access_request_id?: string | null;
  actor_user_id?: string | null;
  balance_after_units: number;
  balance_before_units: number;
  bucket_balance_after_units: number;
  bucket_balance_before_units: number;
  bucket_id?: string | null;
  contract_version: string;
  created_at: string;
  delta_units: number;
  id: string;
  metadata: Record<string, unknown>;
  movement_type: CommercialQuotaLedgerMovementType;
  order_id?: string | null;
  payment_id?: string | null;
  product_key: string;
  source_kind: CommercialQuotaSourceKind;
  source_ref: string;
  workspace_id: string;
};

export type CommercialPackageCatalogUpsertRequest = {
  billing_cycle?: string;
  checkout_currency_mode?: string;
  display_name: string;
  enabled?: boolean;
  granted_units?: number;
  granted_units_acp?: number;
  granted_units_blueprint_pro?: number;
  hotmart_environment?: string;
  hotmart_price_strategy?: string;
  hotmart_product_id?: string;
  hotmart_product_ucode?: string;
  metadata?: Record<string, unknown>;
  offer_code?: string;
  package_code: string;
  package_type?: CommercialPackageType;
  plan_code?: string;
  product_key: string;
  recommendation_priority?: number;
  renewal_policy?: string;
  validity_days?: number | null;
};

export type CommercialPackageCatalogResponse = {
  billing_cycle: string;
  checkout_currency_mode: string;
  contract_version: string;
  display_name: string;
  enabled: boolean;
  granted_units: number;
  granted_units_acp: number;
  granted_units_blueprint_pro: number;
  hotmart_environment: string;
  hotmart_price_strategy: string;
  hotmart_product_id: string;
  hotmart_product_ucode: string;
  id: string;
  offer_code: string;
  package_code: string;
  package_type: CommercialPackageType;
  plan_code: string;
  product_key: string;
  recommendation_priority: number;
  renewal_policy: string;
  updated_at: string;
  validity_days?: number | null;
};

export type CommercialPackageRecommendationResponse = {
  contract_version: string;
  display_name: string;
  granted_units_for_product: number;
  hotmart_environment: string;
  hotmart_product_id: string;
  hotmart_product_ucode: string;
  offer_code: string;
  package_code: string;
  package_type?: CommercialPackageType | null;
  plan_code: string;
  recommendation_priority: number;
  recommendation_reason: string;
  requested_product_key: string;
  required_units: number;
};

export type CommercialLegacyPackageResolutionStatus = "pending_manual_resolution" | "resolved";

export type CommercialLegacyPackageResolutionCandidateResponse = {
  display_name: string;
  granted_units_acp: number;
  granted_units_blueprint_pro: number;
  granted_units_for_order_product: number;
  offer_ref: string;
  package_code: string;
  package_type: CommercialPackageType;
  product_key: string;
};

export type CommercialLegacyPackageResolutionResponse = {
  candidate_packages: CommercialLegacyPackageResolutionCandidateResponse[];
  checkout_ref: string;
  contract_version: string;
  created_at: string;
  currency: string;
  detected_at?: string | null;
  order_id: string;
  package_credit_applied: boolean;
  paid_at?: string | null;
  payment_id?: string | null;
  product_key: string;
  provider: string;
  reason: string;
  resolution_note: string;
  resolved_at?: string | null;
  resolved_by_user_id?: string | null;
  selected_package_code: string;
  session_id?: string | null;
  status: CommercialLegacyPackageResolutionStatus;
  total_cents: number;
  workspace_id: string;
};

export type CommercialLegacyPackageResolutionResolveRequest = {
  package_code: string;
  resolution_note?: string;
};

export type CommercialDebtSettlementRequest = {
  amount_cents: number;
  currency?: string;
  resolution_note?: string;
  settlement_kind?: string;
};

export type CommercialDebtResponse = {
  access_request_id?: string | null;
  amount_cents: number;
  contract_version: string;
  created_at: string;
  currency: string;
  due_at?: string | null;
  id: string;
  opened_by_user_id?: string | null;
  order_id?: string | null;
  product_key: string;
  reason_code: string;
  reason_label: string;
  resolved_at?: string | null;
  resolved_by_user_id?: string | null;
  settled_amount_cents: number;
  status: CommercialDebtStatus;
  summary: string;
  updated_at: string;
  workspace_id: string;
};

export type CommercialAdminBootstrapData = {
  balanceSnapshot: CommercialBalanceSnapshotResponse;
  effectiveConfig: CommercialQuotaEffectiveConfigResponse;
  openDebtCount: number;
  quotaConfigs: CommercialQuotaProductConfigResponse[];
  recommendation: CommercialPackageRecommendationResponse;
  workspaceOverrides: CommercialQuotaWorkspaceOverrideResponse[];
};

export type CommercialAdminDashboardData = CommercialAdminBootstrapData & {
  balanceLedger: CommercialBalanceLedgerResponse[];
  debts: CommercialDebtResponse[];
  legacyPackageResolutions: CommercialLegacyPackageResolutionResponse[];
  packageCatalog: CommercialPackageCatalogResponse[];
};

export type HotmartCheckoutLinkFlowResponse = {
  checkout: HotmartCheckoutSessionResponse;
  paymentLink: HotmartPaymentLinkResponse;
};

export type HotmartPendingActivationStatus = "pending_activation" | "claimed" | "canceled";

export type HotmartPendingActivationResponse = {
  activation_token: string;
  adopted_order_id?: string | null;
  adopted_payment_id?: string | null;
  amount_cents: number;
  buyer_email: string;
  buyer_email_masked: string;
  buyer_name: string;
  can_bootstrap: boolean;
  claim_status_message: string;
  claimed_session_id?: string | null;
  contract_version: string;
  created_at: string;
  currency: string;
  display_name: string;
  package_code: string;
  product_key: string;
  resolved_product_key: string;
  resolution_strategy: string;
  status: HotmartPendingActivationStatus;
  updated_at: string;
  already_claimed: boolean;
};

export type HotmartPendingActivationBootstrapRequest = {
  session_id?: string | null;
};

export type HotmartPendingActivationClaimedResponse = {
  activation_token: string;
  adopted_order_id?: string | null;
  adopted_payment_id?: string | null;
  amount_cents: number;
  buyer_email: string;
  buyer_name: string;
  claimed_session_id?: string | null;
  contract_version: string;
  created_at: string;
  currency: string;
  environment: HotmartEnvironment;
  event_id: string;
  hotmart_product_id: string;
  hotmart_product_ucode: string;
  id: string;
  metadata: Record<string, unknown>;
  offer_code: string;
  package_code: string;
  plan_code: string;
  product_key: string;
  provider_ref: string;
  resolution_strategy: string;
  source_workspace_id: string;
  status: HotmartPendingActivationStatus;
  updated_at: string;
};

export type HotmartPendingActivationBootstrapResponse = {
  contract_version: string;
  created_session: boolean;
  pending_activation: HotmartPendingActivationClaimedResponse;
  product_redirect_path: string;
  project_title: string;
  redirect_path: string;
  session_id: string;
  work_redirect_path: string;
  workspace_id: string;
};
