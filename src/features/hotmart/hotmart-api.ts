import { apiClient } from "@/core/api";
import type {
  CommercialAdminBootstrapData,
  CommercialAdminDashboardData,
  CommercialBalanceLedgerResponse,
  CommercialBalanceSnapshotResponse,
  CommercialDebtResponse,
  CommercialDebtSettlementRequest,
  CommercialLegacyPackageResolutionResolveRequest,
  CommercialLegacyPackageResolutionResponse,
  CommercialPackageCatalogResponse,
  CommercialPackageCatalogUpsertRequest,
  CommercialPackageRecommendationResponse,
  CommercialQuotaEffectiveConfigResponse,
  CommercialQuotaProductConfigResponse,
  CommercialQuotaProductConfigUpsertRequest,
  CommercialQuotaWorkspaceOverrideResponse,
  CommercialQuotaWorkspaceOverrideUpsertRequest,
  HotmartCheckoutLinkFlowResponse,
  HotmartCheckoutSessionRequest,
  HotmartCheckoutSessionResponse,
  HotmartClubModuleResponse,
  HotmartClubOverviewResponse,
  HotmartClubPageResponse,
  HotmartClubProgressResponse,
  HotmartClubStudentResponse,
  HotmartClubSyncRequest,
  HotmartCredentialUpsertRequest,
  HotmartDashboardData,
  HotmartDashboardBootstrapData,
  HotmartEnvironment,
  HotmartIntegrationStatusResponse,
  HotmartOperationalAlertResponse,
  HotmartPaymentLinkCreateRequest,
  HotmartPaymentLinkResponse,
  HotmartPromotionCreateRequest,
  HotmartPromotionDeleteResponse,
  HotmartPromotionMetricsResponse,
  HotmartPromotionResponse,
  HotmartProductMappingResponse,
  HotmartProductMappingUpsertRequest,
  HotmartReconciliationIssueResponse,
  HotmartReconciliationResolveRequest,
  HotmartReleaseReadinessResponse,
  HotmartRunbookSectionResponse,
  HotmartSyncCursorResponse,
  HotmartSyncRequest,
  HotmartSyncRunResponse,
  HotmartTestConnectionResponse,
  HotmartWebhookReplayResponse,
} from "@/features/hotmart/hotmart-contracts";
import type { ProductCatalogResponse } from "@/features/sessions/types";

type HotmartApiClient = Pick<typeof apiClient, "delete" | "get" | "post">;

function buildEnvironmentQuery(environment: HotmartEnvironment) {
  return `environment=${encodeURIComponent(environment)}`;
}

function buildIdempotencyKey(prefix: string, parts: Array<string | null | undefined>) {
  const normalizedParts = parts.map((part) => part?.trim()).filter(Boolean);
  return `${prefix}:${normalizedParts.join(":")}:${Date.now()}`;
}

export function createHotmartAdminApi(client: HotmartApiClient = apiClient) {
  return {
    async getDashboardBootstrap(environment: HotmartEnvironment): Promise<HotmartDashboardBootstrapData> {
      const [status, products, promotionMetrics, clubOverview, releaseReadiness] = await Promise.all([
        this.getStatus(environment),
        this.listProducts(),
        this.getPromotionMetrics(environment),
        this.getClubOverview(environment),
        this.getReleaseReadiness(environment),
      ]);
      return {
        clubOverview,
        products,
        promotionMetrics,
        releaseReadiness,
        status,
      };
    },

    async getCommercialAdminDashboard({
      productKey,
      workspaceId,
    }: {
      productKey: string;
      workspaceId?: string;
    }): Promise<CommercialAdminDashboardData> {
      const bootstrap = await this.getCommercialBootstrap({ productKey, workspaceId });
      const [balanceLedger, packageCatalog, debts, legacyPackageResolutions] = await Promise.all([
        this.listCommercialBalanceLedger(productKey, workspaceId),
        this.listCommercialPackageCatalog("", true),
        this.listCommercialDebts({ productKey, status: "open", workspaceId }),
        this.listCommercialLegacyPackageResolutions({ productKey, workspaceId }),
      ]);
      return {
        ...bootstrap,
        balanceLedger,
        debts,
        legacyPackageResolutions,
        openDebtCount: debts.length,
        packageCatalog,
      };
    },

    getCommercialBootstrap({
      productKey,
      workspaceId,
    }: {
      productKey: string;
      workspaceId?: string;
    }) {
      const workspaceQuery = workspaceId ? `&workspace_id=${encodeURIComponent(workspaceId)}` : "";
      return client.get<CommercialAdminBootstrapData>(
        `/api/v1/admin/integrations/hotmart/commercial/bootstrap?product_key=${encodeURIComponent(productKey)}${workspaceQuery}`,
      );
    },

    async getDashboard(environment: HotmartEnvironment): Promise<HotmartDashboardData> {
      const bootstrap = await this.getDashboardBootstrap(environment);
      const { clubOverview, products, promotionMetrics, releaseReadiness, status } = bootstrap;
      const [mappings, links, promotions, syncRuns, syncCursors] = await Promise.all([
        this.listMappings(environment),
        this.listPaymentLinks(),
        this.listPromotions(environment),
        this.listSyncRuns(environment),
        this.listSyncCursors(environment),
      ]);
      const [reconciliationIssues] = await Promise.all([
        this.listReconciliationIssues(environment),
      ]);
      const [clubModules, clubPages, clubStudents, clubProgress] = await Promise.all([
        this.listClubModules(environment),
        this.listClubPages(environment),
        this.listClubStudents(environment),
        this.listClubProgress(environment),
      ]);
      const [operationalAlerts, runbook] = await Promise.all([
        this.listOperationalAlerts(environment),
        this.listRunbook(),
      ]);
      return {
        clubModules,
        clubOverview,
        clubPages,
        clubProgress,
        clubStudents,
        links,
        mappings,
        operationalAlerts,
        products,
        promotionMetrics,
        promotions,
        releaseReadiness,
        runbook,
        reconciliationIssues,
        status,
        syncCursors,
        syncRuns,
      };
    },

    getStatus(environment: HotmartEnvironment) {
      return client.get<HotmartIntegrationStatusResponse>(
        `/api/v1/admin/integrations/hotmart/status?${buildEnvironmentQuery(environment)}`,
      );
    },

    saveCredentials(payload: HotmartCredentialUpsertRequest) {
      return client.post<HotmartIntegrationStatusResponse>("/api/v1/admin/integrations/hotmart/credentials", {
        body: {
          api_base_url: payload.api_base_url ?? "",
          auth_base_url: payload.auth_base_url ?? "",
          basic_token: payload.basic_token ?? "",
          client_id: payload.client_id ?? "",
          client_secret: payload.client_secret ?? "",
          enabled: payload.enabled ?? true,
          environment: payload.environment,
          hottok: payload.hottok ?? "",
          webhook_public_url: payload.webhook_public_url ?? "",
        },
      });
    },

    testConnection(environment: HotmartEnvironment) {
      return client.post<HotmartTestConnectionResponse>(
        `/api/v1/admin/integrations/hotmart/test-connection?${buildEnvironmentQuery(environment)}`,
      );
    },

    listMappings(environment: HotmartEnvironment) {
      return client.get<HotmartProductMappingResponse[]>(
        `/api/v1/admin/integrations/hotmart/mappings?${buildEnvironmentQuery(environment)}`,
      );
    },

    upsertMapping(payload: HotmartProductMappingUpsertRequest) {
      return client.post<HotmartProductMappingResponse>("/api/v1/admin/integrations/hotmart/mappings", {
        body: payload,
      });
    },

    listPaymentLinks() {
      return client.get<HotmartPaymentLinkResponse[]>("/api/v1/admin/integrations/hotmart/payment-links");
    },

    createPaymentLink(payload: HotmartPaymentLinkCreateRequest) {
      return client.post<HotmartPaymentLinkResponse>("/api/v1/admin/integrations/hotmart/payment-links", {
        body: {
          callback_url: payload.callback_url ?? "",
          checkout_ref: payload.checkout_ref ?? "",
          environment: payload.environment,
          force_new: payload.force_new ?? false,
          link_name: payload.link_name ?? "",
          order_id: payload.order_id ?? null,
        },
      });
    },

    refreshPaymentLink(paymentLinkId: string, environment: HotmartEnvironment) {
      return client.post<HotmartPaymentLinkResponse>(
        `/api/v1/admin/integrations/hotmart/payment-links/${encodeURIComponent(paymentLinkId)}/refresh?${buildEnvironmentQuery(environment)}`,
      );
    },

    listPromotions(environment: HotmartEnvironment) {
      return client.get<HotmartPromotionResponse[]>(
        `/api/v1/admin/integrations/hotmart/coupons?${buildEnvironmentQuery(environment)}`,
      );
    },

    getPromotionMetrics(environment: HotmartEnvironment) {
      return client.get<HotmartPromotionMetricsResponse>(
        `/api/v1/admin/integrations/hotmart/coupons/metrics?${buildEnvironmentQuery(environment)}`,
      );
    },

    createPromotion(payload: HotmartPromotionCreateRequest) {
      return client.post<HotmartPromotionResponse>("/api/v1/admin/integrations/hotmart/coupons", {
        body: {
          affiliate_id: payload.affiliate_id ?? "",
          coupon_code: payload.coupon_code,
          discount_percent: payload.discount_percent,
          ends_at: payload.ends_at || null,
          environment: payload.environment,
          internal_campaign_key: payload.internal_campaign_key ?? "",
          internal_product_key: payload.internal_product_key,
          metadata: payload.metadata ?? {},
          offer_codes: payload.offer_codes ?? [],
          publish: payload.publish ?? true,
          starts_at: payload.starts_at || null,
        },
      });
    },

    deletePromotion(couponRef: string, environment: HotmartEnvironment) {
      return client.delete<HotmartPromotionDeleteResponse>(
        `/api/v1/admin/integrations/hotmart/coupons/${encodeURIComponent(couponRef)}?${buildEnvironmentQuery(environment)}`,
      );
    },

    runSync(payload: HotmartSyncRequest) {
      return client.post<HotmartSyncRunResponse>("/api/v1/admin/integrations/hotmart/sync", {
        body: {
          environment: payload.environment,
          filters: payload.filters ?? {},
          force_reset: payload.force_reset ?? false,
          max_results: payload.max_results ?? 50,
          page_token: payload.page_token ?? "",
          product_id: payload.product_id ?? "",
          resource: payload.resource,
        },
      });
    },

    listSyncRuns(environment: HotmartEnvironment, resource = "") {
      const resourceQuery = resource ? `&resource=${encodeURIComponent(resource)}` : "";
      return client.get<HotmartSyncRunResponse[]>(
        `/api/v1/admin/integrations/hotmart/sync-runs?${buildEnvironmentQuery(environment)}${resourceQuery}`,
      );
    },

    listSyncCursors(environment: HotmartEnvironment) {
      return client.get<HotmartSyncCursorResponse[]>(
        `/api/v1/admin/integrations/hotmart/sync-cursors?${buildEnvironmentQuery(environment)}`,
      );
    },

    listReconciliationIssues(environment: HotmartEnvironment, status = "open") {
      return client.get<HotmartReconciliationIssueResponse[]>(
        `/api/v1/admin/integrations/hotmart/reconciliation?${buildEnvironmentQuery(environment)}&status=${encodeURIComponent(status)}`,
      );
    },

    resolveReconciliationIssue(issueId: string, payload: HotmartReconciliationResolveRequest) {
      return client.post<HotmartReconciliationIssueResponse>(
        `/api/v1/admin/integrations/hotmart/reconciliation/${encodeURIComponent(issueId)}/resolve`,
        {
          body: {
            resolution_action: payload.resolution_action,
            resolution_note: payload.resolution_note ?? "",
            status: payload.status ?? "resolved",
          },
        },
      );
    },

    replayWebhook(eventRef: string, environment: HotmartEnvironment) {
      return client.post<HotmartWebhookReplayResponse>(
        `/api/v1/admin/integrations/hotmart/webhooks/${encodeURIComponent(eventRef)}/replay?${buildEnvironmentQuery(environment)}`,
      );
    },

    getClubOverview(environment: HotmartEnvironment) {
      return client.get<HotmartClubOverviewResponse>(
        `/api/v1/admin/integrations/hotmart/club/overview?${buildEnvironmentQuery(environment)}`,
      );
    },

    syncClub(payload: HotmartClubSyncRequest) {
      return client.post<HotmartSyncRunResponse>("/api/v1/admin/integrations/hotmart/club/sync", {
        body: {
          environment: payload.environment,
          is_extra: payload.is_extra ?? null,
          module_id: payload.module_id ?? "",
          subdomain: payload.subdomain,
          sync_modules: payload.sync_modules ?? true,
          sync_pages: payload.sync_pages ?? true,
          sync_progress: payload.sync_progress ?? false,
          sync_students: payload.sync_students ?? true,
          user_id: payload.user_id ?? "",
        },
      });
    },

    listClubModules(environment: HotmartEnvironment) {
      return client.get<HotmartClubModuleResponse[]>(
        `/api/v1/admin/integrations/hotmart/club/modules?${buildEnvironmentQuery(environment)}`,
      );
    },

    listClubPages(environment: HotmartEnvironment) {
      return client.get<HotmartClubPageResponse[]>(
        `/api/v1/admin/integrations/hotmart/club/pages?${buildEnvironmentQuery(environment)}`,
      );
    },

    listClubStudents(environment: HotmartEnvironment) {
      return client.get<HotmartClubStudentResponse[]>(
        `/api/v1/admin/integrations/hotmart/club/students?${buildEnvironmentQuery(environment)}`,
      );
    },

    listClubProgress(environment: HotmartEnvironment) {
      return client.get<HotmartClubProgressResponse[]>(
        `/api/v1/admin/integrations/hotmart/club/progress?${buildEnvironmentQuery(environment)}`,
      );
    },

    getReleaseReadiness(environment: HotmartEnvironment) {
      return client.get<HotmartReleaseReadinessResponse>(
        `/api/v1/admin/integrations/hotmart/release-readiness?${buildEnvironmentQuery(environment)}`,
      );
    },

    listOperationalAlerts(environment: HotmartEnvironment) {
      return client.get<HotmartOperationalAlertResponse[]>(
        `/api/v1/admin/integrations/hotmart/alerts?${buildEnvironmentQuery(environment)}`,
      );
    },

    listRunbook() {
      return client.get<HotmartRunbookSectionResponse[]>("/api/v1/admin/integrations/hotmart/runbook");
    },

    listCommercialQuotaProducts() {
      return client.get<CommercialQuotaProductConfigResponse[]>("/api/v1/admin/integrations/hotmart/commercial/quota-products");
    },

    saveCommercialQuotaProduct(payload: CommercialQuotaProductConfigUpsertRequest) {
      return client.post<CommercialQuotaProductConfigResponse>("/api/v1/admin/integrations/hotmart/commercial/quota-products", {
        body: payload,
      });
    },

    listCommercialWorkspaceOverrides(workspaceId?: string) {
      const workspaceQuery = workspaceId ? `?workspace_id=${encodeURIComponent(workspaceId)}` : "";
      return client.get<CommercialQuotaWorkspaceOverrideResponse[]>(
        `/api/v1/admin/integrations/hotmart/commercial/workspace-overrides${workspaceQuery}`,
      );
    },

    saveCommercialWorkspaceOverride(payload: CommercialQuotaWorkspaceOverrideUpsertRequest) {
      return client.post<CommercialQuotaWorkspaceOverrideResponse>(
        "/api/v1/admin/integrations/hotmart/commercial/workspace-overrides",
        {
          body: payload,
        },
      );
    },

    getCommercialEffectiveConfig(productKey: string, workspaceId?: string) {
      const workspaceQuery = workspaceId ? `&workspace_id=${encodeURIComponent(workspaceId)}` : "";
      return client.get<CommercialQuotaEffectiveConfigResponse>(
        `/api/v1/admin/integrations/hotmart/commercial/effective-config?product_key=${encodeURIComponent(productKey)}${workspaceQuery}`,
      );
    },

    getCommercialBalanceSnapshot(productKey: string, workspaceId?: string) {
      const workspaceQuery = workspaceId ? `&workspace_id=${encodeURIComponent(workspaceId)}` : "";
      return client.get<CommercialBalanceSnapshotResponse>(
        `/api/v1/admin/integrations/hotmart/commercial/balance-snapshot?product_key=${encodeURIComponent(productKey)}${workspaceQuery}`,
      );
    },

    listCommercialBalanceLedger(productKey: string, workspaceId?: string) {
      const workspaceQuery = workspaceId ? `&workspace_id=${encodeURIComponent(workspaceId)}` : "";
      return client.get<CommercialBalanceLedgerResponse[]>(
        `/api/v1/admin/integrations/hotmart/commercial/balance-ledger?product_key=${encodeURIComponent(productKey)}${workspaceQuery}`,
      );
    },

    listCommercialPackageCatalog(productKey = "", includeDisabled = true) {
      const productQuery = productKey ? `&product_key=${encodeURIComponent(productKey)}` : "";
      return client.get<CommercialPackageCatalogResponse[]>(
        `/api/v1/admin/integrations/hotmart/commercial/package-catalog?include_disabled=${includeDisabled ? "true" : "false"}${productQuery}`,
      );
    },

    saveCommercialPackageCatalog(payload: CommercialPackageCatalogUpsertRequest) {
      return client.post<CommercialPackageCatalogResponse>(
        "/api/v1/admin/integrations/hotmart/commercial/package-catalog",
        {
          body: payload,
        },
      );
    },

    getCommercialPackageRecommendation(productKey: string, requiredUnits = 1, workspaceId?: string) {
      const workspaceQuery = workspaceId ? `&workspace_id=${encodeURIComponent(workspaceId)}` : "";
      return client.get<CommercialPackageRecommendationResponse>(
        `/api/v1/admin/integrations/hotmart/commercial/package-recommendation?product_key=${encodeURIComponent(productKey)}&required_units=${requiredUnits}${workspaceQuery}`,
      );
    },

    listCommercialDebts({ productKey = "", status = "open", workspaceId }: { productKey?: string; status?: string; workspaceId?: string } = {}) {
      const productQuery = productKey ? `&product_key=${encodeURIComponent(productKey)}` : "";
      const workspaceQuery = workspaceId ? `&workspace_id=${encodeURIComponent(workspaceId)}` : "";
      return client.get<CommercialDebtResponse[]>(
        `/api/v1/admin/integrations/hotmart/commercial/debts?status=${encodeURIComponent(status)}${productQuery}${workspaceQuery}`,
      );
    },

    settleCommercialDebt(debtId: string, payload: CommercialDebtSettlementRequest, workspaceId?: string) {
      const workspaceQuery = workspaceId ? `?workspace_id=${encodeURIComponent(workspaceId)}` : "";
      return client.post<CommercialDebtResponse>(
        `/api/v1/admin/integrations/hotmart/commercial/debts/${encodeURIComponent(debtId)}/settle${workspaceQuery}`,
        {
          body: {
            amount_cents: payload.amount_cents,
            currency: payload.currency ?? "USD",
            resolution_note: payload.resolution_note ?? "",
            settlement_kind: payload.settlement_kind ?? "manual",
          },
        },
      );
    },

    listCommercialLegacyPackageResolutions({
      productKey = "",
      status = "pending",
      workspaceId,
    }: {
      productKey?: string;
      status?: string;
      workspaceId?: string;
    } = {}) {
      const productQuery = productKey ? `&product_key=${encodeURIComponent(productKey)}` : "";
      const workspaceQuery = workspaceId ? `&workspace_id=${encodeURIComponent(workspaceId)}` : "";
      return client.get<CommercialLegacyPackageResolutionResponse[]>(
        `/api/v1/admin/integrations/hotmart/commercial/legacy-package-resolutions?status=${encodeURIComponent(status)}${productQuery}${workspaceQuery}`,
      );
    },

    resolveCommercialLegacyPackageResolution(
      orderId: string,
      payload: CommercialLegacyPackageResolutionResolveRequest,
      workspaceId?: string,
    ) {
      const workspaceQuery = workspaceId ? `?workspace_id=${encodeURIComponent(workspaceId)}` : "";
      return client.post<CommercialLegacyPackageResolutionResponse>(
        `/api/v1/admin/integrations/hotmart/commercial/legacy-package-resolutions/${encodeURIComponent(orderId)}/resolve${workspaceQuery}`,
        {
          body: {
            package_code: payload.package_code,
            resolution_note: payload.resolution_note ?? "",
          },
        },
      );
    },

    listProducts() {
      return client.get<ProductCatalogResponse[]>("/api/v1/commerce/products");
    },

    createHotmartCheckoutSession(payload: HotmartCheckoutSessionRequest) {
      return client.post<HotmartCheckoutSessionResponse>("/api/v1/commerce/checkout-sessions", {
        body: {
          cancel_url: payload.cancel_url ?? "",
          idempotency_key:
            payload.idempotency_key ??
            buildIdempotencyKey("hotmart-admin-ui", [payload.session_id, payload.product_key, payload.price_code, payload.package_code]),
          package_code: payload.package_code ?? "",
          price_code: payload.price_code ?? "",
          product_key: payload.product_key,
          provider: "hotmart",
          session_id: payload.session_id,
          success_url: payload.success_url ?? "",
        },
      });
    },

    async createCheckoutPaymentLink({
      callbackUrl,
      environment,
      linkName,
      ...checkoutPayload
    }: HotmartCheckoutSessionRequest & {
      callbackUrl?: string;
      environment: HotmartEnvironment;
      linkName?: string;
    }): Promise<HotmartCheckoutLinkFlowResponse> {
      const checkout = await this.createHotmartCheckoutSession(checkoutPayload);
      const paymentLink = await this.createPaymentLink({
        callback_url: callbackUrl,
        environment,
        link_name: linkName,
        order_id: checkout.order_id,
      });
      return {
        checkout,
        paymentLink,
      };
    },
  };
}

export type HotmartAdminApi = ReturnType<typeof createHotmartAdminApi>;

export const hotmartAdminApi = createHotmartAdminApi();
