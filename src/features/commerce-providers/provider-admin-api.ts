import { apiClient } from "@/core/api";
import type {
  CommercePaymentProviderKey,
  CommerceProviderCheckoutRecordResponse,
  CommerceProviderCredentialUpsertRequest,
  CommerceProviderDefinitionResponse,
  CommerceProviderEnvironment,
  CommerceProviderProductMappingResponse,
  CommerceProviderProductMappingUpsertRequest,
  CommerceProviderReadinessResponse,
  CommerceProviderStatusResponse,
  CommerceProviderTestConnectionResponse,
  CommerceProviderWebhookEventResponse,
} from "@/features/commerce-providers/provider-contracts";

type ProviderAdminApiClient = Pick<typeof apiClient, "get" | "post">;

function environmentQuery(environment: CommerceProviderEnvironment) {
  return `environment=${encodeURIComponent(environment)}`;
}

function providerPath(providerKey: CommercePaymentProviderKey, suffix: string, environment?: CommerceProviderEnvironment) {
  const base = `/api/v1/admin/commerce/providers/${encodeURIComponent(providerKey)}${suffix}`;
  return environment ? `${base}?${environmentQuery(environment)}` : base;
}

export function createCommerceProviderAdminApi(client: ProviderAdminApiClient = apiClient) {
  return {
    listProviders() {
      return client.get<CommerceProviderDefinitionResponse[]>("/api/v1/admin/commerce/providers");
    },
    getStatus(providerKey: CommercePaymentProviderKey, environment: CommerceProviderEnvironment) {
      return client.get<CommerceProviderStatusResponse>(providerPath(providerKey, "/status", environment));
    },
    upsertCredentials(providerKey: CommercePaymentProviderKey, payload: CommerceProviderCredentialUpsertRequest) {
      return client.post<CommerceProviderStatusResponse>(providerPath(providerKey, "/credentials"), { body: payload });
    },
    testConnection(providerKey: CommercePaymentProviderKey, environment: CommerceProviderEnvironment) {
      return client.post<CommerceProviderTestConnectionResponse>(providerPath(providerKey, "/test-connection", environment));
    },
    listMappings(providerKey: CommercePaymentProviderKey, environment: CommerceProviderEnvironment) {
      return client.get<CommerceProviderProductMappingResponse[]>(providerPath(providerKey, "/mappings", environment));
    },
    upsertMapping(providerKey: CommercePaymentProviderKey, payload: CommerceProviderProductMappingUpsertRequest) {
      return client.post<CommerceProviderProductMappingResponse>(providerPath(providerKey, "/mappings"), { body: payload });
    },
    listCheckouts(providerKey: CommercePaymentProviderKey, environment: CommerceProviderEnvironment) {
      return client.get<CommerceProviderCheckoutRecordResponse[]>(providerPath(providerKey, "/checkouts", environment));
    },
    listWebhookEvents(providerKey: CommercePaymentProviderKey, environment: CommerceProviderEnvironment) {
      return client.get<CommerceProviderWebhookEventResponse[]>(providerPath(providerKey, "/webhook-events", environment));
    },
    getReadiness(providerKey: CommercePaymentProviderKey, environment: CommerceProviderEnvironment) {
      return client.get<CommerceProviderReadinessResponse>(providerPath(providerKey, "/readiness", environment));
    },
  };
}

export const commerceProviderAdminApi = createCommerceProviderAdminApi();
