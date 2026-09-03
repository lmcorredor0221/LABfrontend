export type CommercePaymentProviderKey = "sandbox" | "hotmart" | "rebill" | (string & {});
export type CommerceProviderEnvironment = "sandbox" | "production";

export type CommerceProviderCapability =
  | "external_activation"
  | "hosted_checkout"
  | "payment_links"
  | "refunds"
  | "subscriptions"
  | "test_mode"
  | "webhooks";

export type CommerceProviderDefinitionResponse = {
  capabilities: CommerceProviderCapability[];
  contract_version: "commerce-provider-definition.v1";
  default_environment: CommerceProviderEnvironment;
  display_name: string;
  provider_key: CommercePaymentProviderKey;
};

export type CommerceProviderSecretStatusResponse = {
  configured: boolean;
  last_rotated_at?: string | null;
  secret_kind: string;
  status: string;
  storage_mode: string;
};

export type CommerceProviderCredentialUpsertRequest = {
  api_base_url?: string;
  enabled?: boolean;
  environment?: CommerceProviderEnvironment;
  secrets?: Record<string, string>;
  webhook_public_url?: string;
};

export type CommerceProviderStatusResponse = {
  api_base_url: string;
  capabilities: CommerceProviderCapability[];
  contract_version: "commerce-provider-status.v1";
  enabled: boolean;
  environment: CommerceProviderEnvironment;
  last_health_check_at?: string | null;
  last_health_message: string;
  last_health_status: string;
  provider_key: CommercePaymentProviderKey;
  secret_statuses: CommerceProviderSecretStatusResponse[];
  status: string;
  updated_at?: string | null;
  webhook_public_url: string;
  workspace_id: string;
};

export type CommerceProviderTestConnectionResponse = {
  checked_at: string;
  contract_version: "commerce-provider-test-connection.v1";
  environment: CommerceProviderEnvironment;
  http_status?: number | null;
  message: string;
  provider_key: CommercePaymentProviderKey;
  reachable: boolean;
  status: string;
  workspace_id: string;
};

export type CommerceProviderProductMappingUpsertRequest = {
  billing_mode?: "one_time" | "subscription";
  currency?: string;
  entitlement_scope?: string;
  environment?: CommerceProviderEnvironment;
  grants_tier?: "blueprint" | "blueprint_pro" | "acp";
  internal_product_key: string;
  internal_unit_amount_usd_cents?: number;
  is_active?: boolean;
  metadata?: Record<string, unknown>;
  package_code?: string;
  price_strategy?: string;
  provider_offer_ref?: string;
  provider_payment_link_id?: string;
  provider_plan_id?: string;
  provider_price_id?: string;
  provider_product_id?: string;
};

export type CommerceProviderProductMappingResponse = Required<
  Omit<CommerceProviderProductMappingUpsertRequest, "metadata">
> & {
  contract_version: "commerce-provider-product-mapping.v1";
  id: string;
  metadata: Record<string, unknown>;
  provider_key: CommercePaymentProviderKey;
  updated_at: string;
  workspace_id: string;
};

export type CommerceProviderCheckoutRecordResponse = {
  amount_cents: number;
  checkout_ref: string;
  checkout_url: string;
  contract_version: "commerce-provider-checkout-record.v1";
  created_at: string;
  currency: string;
  environment: CommerceProviderEnvironment;
  id: string;
  metadata: Record<string, unknown>;
  order_id: string;
  provider_checkout_id: string;
  provider_customer_id: string;
  provider_key: CommercePaymentProviderKey;
  provider_payment_link_id: string;
  status: string;
  updated_at: string;
  workspace_id: string;
};

export type CommerceProviderWebhookEventResponse = {
  contract_version: "commerce-provider-webhook-event.v1";
  created_at: string;
  environment: CommerceProviderEnvironment;
  error_code: string;
  error_message: string;
  event_id: string;
  event_type: string;
  id: string;
  order_id?: string | null;
  payment_id?: string | null;
  processed_at?: string | null;
  processing_status: string;
  provider_key: CommercePaymentProviderKey;
  provider_resource_id: string;
  retries: number;
  signature_validated: boolean;
  workspace_id?: string | null;
};

export type CommerceProviderReadinessCheckResponse = {
  detail: string;
  key: string;
  label: string;
  status: "ok" | "warning" | "blocking";
};

export type CommerceProviderReadinessResponse = {
  checked_at: string;
  checks: CommerceProviderReadinessCheckResponse[];
  contract_version: "commerce-provider-readiness.v1";
  environment: CommerceProviderEnvironment;
  provider_key: CommercePaymentProviderKey;
  ready: boolean;
  status: string;
  workspace_id: string;
};
