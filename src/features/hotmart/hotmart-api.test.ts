import { createHotmartAdminApi } from "@/features/hotmart/hotmart-api";
import type {
  HotmartClubModuleResponse,
  HotmartClubOverviewResponse,
  HotmartClubPageResponse,
  HotmartClubProgressResponse,
  HotmartClubStudentResponse,
  HotmartIntegrationStatusResponse,
  HotmartOperationalAlertResponse,
  HotmartPaymentLinkResponse,
  HotmartPromotionMetricsResponse,
  HotmartPromotionResponse,
  HotmartReconciliationIssueResponse,
  HotmartReleaseReadinessResponse,
  HotmartRunbookSectionResponse,
  HotmartSyncCursorResponse,
  HotmartSyncRunResponse,
} from "@/features/hotmart/hotmart-contracts";

const status: HotmartIntegrationStatusResponse = {
  api_base_url: "https://sandbox.hotmart.com",
  auth_base_url: "https://api-sec-vlc.hotmart.com",
  basic_token_configured: true,
  client_id_configured: true,
  client_secret_configured: true,
  contract_version: "hotmart-integration-status.v1",
  enabled: true,
  environment: "sandbox",
  hottok_configured: true,
  last_health_check_at: null,
  last_health_message: "",
  last_health_status: "",
  last_sync_at: null,
  status: "configured",
  storage_mode: "ciphertext",
  updated_at: null,
  webhook_public_url: "https://example.com/api/v1/webhooks/hotmart",
  workspace_id: "workspace-1",
};

const link: HotmartPaymentLinkResponse = {
  activation_status: "pending_activation",
  checkout_url: "https://pay.hotmart.test/abc",
  contract_version: "hotmart-payment-link.v1",
  created_at: "2026-08-14T10:00:00Z",
  currency: "USD",
  discount_amount_cents: 0,
  discount_origin: "none",
  gross_amount_cents: 10000,
  hotmart_payment_link_id: "pl-1",
  id: "link-1",
  internal_product_key: "blueprint_pro",
  net_amount_cents: 10000,
  order_id: "order-1",
  provider_ref: "pl-1",
  updated_at: "2026-08-14T10:00:00Z",
  workspace_id: "workspace-1",
};

const promotion: HotmartPromotionResponse = {
  contract_version: "hotmart-promotion.v1",
  coupon_code: "BLACK10",
  coupon_id: "98765",
  created_at: "2026-08-14T10:00:00Z",
  discount_amount_cents: null,
  discount_origin: "provider_coupon",
  discount_percent: 10,
  discount_type: "percent",
  ends_at: null,
  environment: "sandbox",
  hotmart_product_id: "1234567",
  id: "promotion-1",
  internal_campaign_key: "black-friday",
  internal_product_key: "blueprint_pro",
  offer_codes: ["111222"],
  published_at: "2026-08-14T10:00:00Z",
  starts_at: null,
  status: "active",
  updated_at: "2026-08-14T10:00:00Z",
  workspace_id: "workspace-1",
};

const promotionMetrics: HotmartPromotionMetricsResponse = {
  active: 1,
  contract_version: "hotmart-promotion-metrics.v1",
  deleted: 0,
  expired: 0,
  internal_upgrade_credit_count: 0,
  provider_coupon_count: 1,
  scheduled: 0,
  sync_error: 0,
  total: 1,
};

const syncRun: HotmartSyncRunResponse = {
  contract_version: "hotmart-sync-run.v1",
  cursor_after: "cursor-2",
  cursor_before: "",
  environment: "sandbox",
  error_summary: "",
  finished_at: "2026-08-14T10:00:00Z",
  id: "sync-run-1",
  issue_count: 1,
  records_created: 1,
  records_read: 1,
  records_skipped: 0,
  records_updated: 0,
  resource: "products",
  started_at: "2026-08-14T10:00:00Z",
  started_by_user_id: "user-1",
  status: "succeeded",
  workspace_id: "workspace-1",
};

const syncCursor: HotmartSyncCursorResponse = {
  contract_version: "hotmart-sync-cursor.v1",
  environment: "sandbox",
  id: "cursor-1",
  last_event_at: null,
  last_success_at: "2026-08-14T10:00:00Z",
  last_transaction: "",
  page_token: "cursor-2",
  resource: "products",
  updated_at: "2026-08-14T10:00:00Z",
  workspace_id: "workspace-1",
};

const reconciliationIssue: HotmartReconciliationIssueResponse = {
  contract_version: "hotmart-reconciliation-issue.v1",
  created_at: "2026-08-14T10:00:00Z",
  environment: "sandbox",
  id: "issue-1",
  internal_ref: "",
  issue_type: "hotmart_product_without_mapping",
  provider_ref: "7654321",
  resolution_action: "",
  resolution_note: "",
  resolved_at: null,
  resolved_by_user_id: null,
  severity: "medium",
  status: "open",
  suggested_action: "Create mapping.",
  summary: "Product without mapping.",
  updated_at: "2026-08-14T10:00:00Z",
  workspace_id: "workspace-1",
};

const clubOverview: HotmartClubOverviewResponse = {
  contract_version: "hotmart-club-overview.v1",
  environment: "sandbox",
  last_sync_at: "2026-08-14T10:00:00Z",
  last_sync_status: "succeeded",
  modules_count: 1,
  open_issue_count: 1,
  pages_count: 1,
  progress_count: 1,
  students_count: 1,
  subdomain: "leanclub",
  workspace_id: "workspace-1",
};

const clubModule: HotmartClubModuleResponse = {
  contract_version: "hotmart-club-module.v1",
  is_extra: false,
  is_extra_paid: false,
  is_public: true,
  module_id: "module-1",
  name: "Primeros pasos",
  sequence: 1,
  total_pages: 1,
};

const clubPage: HotmartClubPageResponse = {
  contract_version: "hotmart-club-page.v1",
  module_id: "module-1",
  name: "Bienvenida",
  page_id: "page-1",
  page_order: 1,
  type: "video",
};

const clubStudent: HotmartClubStudentResponse = {
  contract_version: "hotmart-club-student.v1",
  email: "student@example.com",
  engagement: "active",
  name: "Student One",
  progress: {},
  status: "ACTIVE",
  user_id: "student-1",
};

const clubProgress: HotmartClubProgressResponse = {
  completed: true,
  completed_at: "2026-08-14T10:00:00Z",
  contract_version: "hotmart-club-progress.v1",
  email: "student@example.com",
  page_id: "page-1",
  page_name: "Bienvenida",
  progress_payload: {},
  user_id: "student-1",
};

const operationalAlert: HotmartOperationalAlertResponse = {
  contract_version: "hotmart-operational-alert.v1",
  created_at: "2026-08-14T10:00:00Z",
  evidence: ["open_reconciliation_issues=1"],
  key: "hotmart_reconciliation_open",
  message: "Hay diferencias abiertas.",
  severity: "medium",
  status: "active",
  title: "Diferencias abiertas",
};

const runbookSection: HotmartRunbookSectionResponse = {
  contract_version: "hotmart-runbook-section.v1",
  key: "rollback",
  links: [],
  steps: ["Deshabilitar Hotmart.", "Volver a sandbox/fallback."],
  title: "Pausar y volver a fallback",
};

const releaseReadiness: HotmartReleaseReadinessResponse = {
  alerts: [operationalAlert],
  checklist: [
    {
      contract_version: "hotmart-release-checklist-item.v1",
      detail: "ok",
      evidence: ["connected"],
      key: "connection_health",
      label: "Conexion validada",
      required: true,
      severity: "high",
      status: "passed",
    },
  ],
  contract_version: "hotmart-release-readiness.v1",
  environment: "sandbox",
  generated_at: "2026-08-14T10:00:00Z",
  metrics: { active_mappings: 1 },
  overall_status: "needs_attention",
  release_candidate: false,
  runbook: [runbookSection],
  workspace_id: "workspace-1",
};

describe("createHotmartAdminApi", () => {
  it("loads the admin dashboard from the scoped Hotmart endpoints", async () => {
    const client = {
      delete: vi.fn(),
      get: vi.fn((path: string) => {
        if (path.includes("/status")) return Promise.resolve(status);
        if (path.includes("/mappings")) return Promise.resolve([]);
        if (path.includes("/payment-links")) return Promise.resolve([link]);
        if (path.includes("/coupons/metrics")) return Promise.resolve(promotionMetrics);
        if (path.includes("/coupons")) return Promise.resolve([promotion]);
        if (path.includes("/sync-runs")) return Promise.resolve([syncRun]);
        if (path.includes("/sync-cursors")) return Promise.resolve([syncCursor]);
        if (path.includes("/reconciliation")) return Promise.resolve([reconciliationIssue]);
        if (path.includes("/club/overview")) return Promise.resolve(clubOverview);
        if (path.includes("/club/modules")) return Promise.resolve([clubModule]);
        if (path.includes("/club/pages")) return Promise.resolve([clubPage]);
        if (path.includes("/club/students")) return Promise.resolve([clubStudent]);
        if (path.includes("/club/progress")) return Promise.resolve([clubProgress]);
        if (path.includes("/release-readiness")) return Promise.resolve(releaseReadiness);
        if (path.includes("/alerts")) return Promise.resolve([operationalAlert]);
        if (path.includes("/runbook")) return Promise.resolve([runbookSection]);
        if (path.includes("/commerce/products")) return Promise.resolve([]);
        return Promise.reject(new Error(`Unexpected GET ${path}`));
      }),
      post: vi.fn(),
    };
    const api = createHotmartAdminApi(client as unknown as NonNullable<Parameters<typeof createHotmartAdminApi>[0]>);

    const dashboard = await api.getDashboard("sandbox");

    expect(dashboard.status.status).toBe("configured");
    expect(dashboard.links).toHaveLength(1);
    expect(dashboard.promotions).toHaveLength(1);
    expect(dashboard.promotionMetrics.active).toBe(1);
    expect(dashboard.syncRuns).toHaveLength(1);
    expect(dashboard.syncCursors).toHaveLength(1);
    expect(dashboard.reconciliationIssues).toHaveLength(1);
    expect(dashboard.clubOverview.subdomain).toBe("leanclub");
    expect(dashboard.clubModules).toHaveLength(1);
    expect(dashboard.clubStudents).toHaveLength(1);
    expect(dashboard.releaseReadiness.overall_status).toBe("needs_attention");
    expect(dashboard.operationalAlerts).toHaveLength(1);
    expect(dashboard.runbook).toHaveLength(1);
    expect(client.get).toHaveBeenCalledWith("/api/v1/admin/integrations/hotmart/status?environment=sandbox");
    expect(client.get).toHaveBeenCalledWith("/api/v1/admin/integrations/hotmart/mappings?environment=sandbox");
    expect(client.get).toHaveBeenCalledWith("/api/v1/admin/integrations/hotmart/payment-links");
    expect(client.get).toHaveBeenCalledWith("/api/v1/admin/integrations/hotmart/coupons?environment=sandbox");
    expect(client.get).toHaveBeenCalledWith("/api/v1/admin/integrations/hotmart/coupons/metrics?environment=sandbox");
    expect(client.get).toHaveBeenCalledWith("/api/v1/admin/integrations/hotmart/sync-runs?environment=sandbox");
    expect(client.get).toHaveBeenCalledWith("/api/v1/admin/integrations/hotmart/sync-cursors?environment=sandbox");
    expect(client.get).toHaveBeenCalledWith("/api/v1/admin/integrations/hotmart/reconciliation?environment=sandbox&status=open");
    expect(client.get).toHaveBeenCalledWith("/api/v1/admin/integrations/hotmart/club/overview?environment=sandbox");
    expect(client.get).toHaveBeenCalledWith("/api/v1/admin/integrations/hotmart/club/modules?environment=sandbox");
    expect(client.get).toHaveBeenCalledWith("/api/v1/admin/integrations/hotmart/club/pages?environment=sandbox");
    expect(client.get).toHaveBeenCalledWith("/api/v1/admin/integrations/hotmart/club/students?environment=sandbox");
    expect(client.get).toHaveBeenCalledWith("/api/v1/admin/integrations/hotmart/club/progress?environment=sandbox");
    expect(client.get).toHaveBeenCalledWith("/api/v1/admin/integrations/hotmart/release-readiness?environment=sandbox");
    expect(client.get).toHaveBeenCalledWith("/api/v1/admin/integrations/hotmart/alerts?environment=sandbox");
    expect(client.get).toHaveBeenCalledWith("/api/v1/admin/integrations/hotmart/runbook");
    expect(client.get).toHaveBeenCalledWith("/api/v1/commerce/products");
  });

  it("caps dashboard bootstrap fan-out to five concurrent requests", async () => {
    let activeRequests = 0;
    let maxConcurrentRequests = 0;

    const resolveGet = (path: string) => {
      if (path.includes("/status")) return status;
      if (path.includes("/mappings")) return [];
      if (path.includes("/payment-links")) return [link];
      if (path.includes("/coupons/metrics")) return promotionMetrics;
      if (path.includes("/coupons")) return [promotion];
      if (path.includes("/sync-runs")) return [syncRun];
      if (path.includes("/sync-cursors")) return [syncCursor];
      if (path.includes("/reconciliation")) return [reconciliationIssue];
      if (path.includes("/club/overview")) return clubOverview;
      if (path.includes("/club/modules")) return [clubModule];
      if (path.includes("/club/pages")) return [clubPage];
      if (path.includes("/club/students")) return [clubStudent];
      if (path.includes("/club/progress")) return [clubProgress];
      if (path.includes("/release-readiness")) return releaseReadiness;
      if (path.includes("/alerts")) return [operationalAlert];
      if (path.includes("/runbook")) return [runbookSection];
      if (path.includes("/commerce/products")) return [];
      throw new Error(`Unexpected GET ${path}`);
    };

    const client = {
      delete: vi.fn(),
      get: vi.fn(
        (path: string) =>
          new Promise((resolve, reject) => {
            activeRequests += 1;
            maxConcurrentRequests = Math.max(maxConcurrentRequests, activeRequests);
            setTimeout(() => {
              try {
                resolve(resolveGet(path));
              } catch (error) {
                reject(error);
              } finally {
                activeRequests -= 1;
              }
            }, 0);
          }),
      ),
      post: vi.fn(),
    };
    const api = createHotmartAdminApi(client as unknown as NonNullable<Parameters<typeof createHotmartAdminApi>[0]>);

    const dashboard = await api.getDashboard("sandbox");

    expect(dashboard.status.status).toBe("configured");
    expect(maxConcurrentRequests).toBeLessThanOrEqual(5);
    expect(client.get).toHaveBeenCalledTimes(17);
  });

  it("creates a Hotmart checkout order before requesting the payment link", async () => {
    const client = {
      delete: vi.fn(),
      get: vi.fn(),
      post: vi.fn((path: string) => {
        if (path.includes("/commerce/checkout-sessions")) {
          return Promise.resolve({
            checkout_ref: "hotmart_order_1",
            checkout_url: "",
            contract_version: "commerce-checkout-session.v1",
            currency: "USD",
            next_action: "await_payment_link",
            order_id: "order-1",
            product_key: "blueprint_pro",
            provider: "hotmart",
            session_id: "session-1",
            status: "pending",
            total_cents: 10000,
            workspace_id: "workspace-1",
          });
        }
        if (path.includes("/admin/integrations/hotmart/payment-links")) {
          return Promise.resolve(link);
        }
        return Promise.reject(new Error(`Unexpected POST ${path}`));
      }),
    };
    const api = createHotmartAdminApi(client as unknown as NonNullable<Parameters<typeof createHotmartAdminApi>[0]>);

    const response = await api.createCheckoutPaymentLink({
      environment: "sandbox",
      product_key: "blueprint_pro",
      session_id: "session-1",
    });

    expect(response.paymentLink.id).toBe("link-1");
    expect(client.post).toHaveBeenNthCalledWith(
      1,
      "/api/v1/commerce/checkout-sessions",
      expect.objectContaining({
        body: expect.objectContaining({
          product_key: "blueprint_pro",
          provider: "hotmart",
          session_id: "session-1",
        }),
      }),
    );
    expect(client.post).toHaveBeenNthCalledWith(
      2,
      "/api/v1/admin/integrations/hotmart/payment-links",
      expect.objectContaining({
        body: expect.objectContaining({
          environment: "sandbox",
          order_id: "order-1",
        }),
      }),
    );
  });

  it("publishes and deletes Hotmart coupon promotions through admin endpoints", async () => {
    const client = {
      delete: vi.fn().mockResolvedValue({
        contract_version: "hotmart-promotion-delete.v1",
        coupon_code: "BLACK10",
        coupon_id: "98765",
        deleted_remote: true,
        id: "promotion-1",
        message: "Coupon deleted.",
        status: "deleted",
      }),
      get: vi.fn(),
      post: vi.fn((path: string) => {
        if (path.includes("/admin/integrations/hotmart/coupons")) return Promise.resolve(promotion);
        return Promise.reject(new Error(`Unexpected POST ${path}`));
      }),
    };
    const api = createHotmartAdminApi(client as unknown as NonNullable<Parameters<typeof createHotmartAdminApi>[0]>);

    const created = await api.createPromotion({
      coupon_code: "BLACK10",
      discount_percent: 10,
      environment: "sandbox",
      internal_campaign_key: "black-friday",
      internal_product_key: "blueprint_pro",
      offer_codes: ["111222"],
    });
    const deleted = await api.deletePromotion("promotion-1", "sandbox");

    expect(created.id).toBe("promotion-1");
    expect(client.post).toHaveBeenCalledWith(
      "/api/v1/admin/integrations/hotmart/coupons",
      expect.objectContaining({
        body: expect.objectContaining({
          coupon_code: "BLACK10",
          discount_percent: 10,
          environment: "sandbox",
          offer_codes: ["111222"],
        }),
      }),
    );
    expect(client.delete).toHaveBeenCalledWith("/api/v1/admin/integrations/hotmart/coupons/promotion-1?environment=sandbox");
    expect(deleted.status).toBe("deleted");
  });

  it("runs sync and resolves reconciliation issues through admin endpoints", async () => {
    const client = {
      delete: vi.fn(),
      get: vi.fn(),
      post: vi.fn((path: string) => {
        if (path.endsWith("/sync")) return Promise.resolve(syncRun);
        if (path.includes("/reconciliation/issue-1/resolve")) return Promise.resolve({ ...reconciliationIssue, status: "resolved" });
        return Promise.reject(new Error(`Unexpected POST ${path}`));
      }),
    };
    const api = createHotmartAdminApi(client as unknown as NonNullable<Parameters<typeof createHotmartAdminApi>[0]>);

    const run = await api.runSync({ environment: "sandbox", resource: "products", force_reset: true });
    const resolved = await api.resolveReconciliationIssue("issue-1", {
      resolution_action: "linked_manually",
      resolution_note: "ok",
    });

    expect(run.status).toBe("succeeded");
    expect(client.post).toHaveBeenNthCalledWith(
      1,
      "/api/v1/admin/integrations/hotmart/sync",
      expect.objectContaining({
        body: expect.objectContaining({
          environment: "sandbox",
          force_reset: true,
          resource: "products",
        }),
      }),
    );
    expect(client.post).toHaveBeenNthCalledWith(
      2,
      "/api/v1/admin/integrations/hotmart/reconciliation/issue-1/resolve",
      expect.objectContaining({
        body: expect.objectContaining({
          resolution_action: "linked_manually",
          resolution_note: "ok",
          status: "resolved",
        }),
      }),
    );
    expect(resolved.status).toBe("resolved");
  });

  it("syncs Hotmart Club through the scoped admin endpoint", async () => {
    const client = {
      delete: vi.fn(),
      get: vi.fn(),
      post: vi.fn((path: string) => {
        if (path.endsWith("/club/sync")) return Promise.resolve({ ...syncRun, resource: "club" });
        return Promise.reject(new Error(`Unexpected POST ${path}`));
      }),
    };
    const api = createHotmartAdminApi(client as unknown as NonNullable<Parameters<typeof createHotmartAdminApi>[0]>);

    const run = await api.syncClub({
      environment: "sandbox",
      is_extra: null,
      subdomain: "leanclub",
      sync_progress: true,
    });

    expect(run.resource).toBe("club");
    expect(client.post).toHaveBeenCalledWith(
      "/api/v1/admin/integrations/hotmart/club/sync",
      expect.objectContaining({
        body: expect.objectContaining({
          environment: "sandbox",
          is_extra: null,
          subdomain: "leanclub",
          sync_modules: true,
          sync_pages: true,
          sync_progress: true,
          sync_students: true,
        }),
      }),
    );
  });
});
