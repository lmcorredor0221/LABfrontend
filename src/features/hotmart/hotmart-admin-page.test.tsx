import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AuthProvider } from "@/core/auth/auth-context";
import { createAuthStore } from "@/core/auth/auth-store";
import type { AuthUser } from "@/core/auth/types";
import { LanguageProvider } from "@/core/i18n/language-context";
import { HotmartAdminView } from "@/features/hotmart/hotmart-admin-page";
import type { HotmartAdminApi } from "@/features/hotmart/hotmart-api";
import type { HotmartDashboardData } from "@/features/hotmart/hotmart-contracts";

vi.mock("next/navigation", () => ({
  usePathname: () => "/settings/hotmart",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

const dashboard: HotmartDashboardData = {
  clubModules: [
    {
      contract_version: "hotmart-club-module.v1",
      is_extra: false,
      is_extra_paid: false,
      is_public: true,
      module_id: "module-1",
      name: "Primeros pasos",
      sequence: 1,
      total_pages: 1,
    },
  ],
  clubOverview: {
    contract_version: "hotmart-club-overview.v1",
    environment: "sandbox",
    last_sync_at: "2026-08-14T10:00:00Z",
    last_sync_status: "succeeded",
    modules_count: 1,
    open_issue_count: 1,
    pages_count: 1,
    progress_count: 0,
    students_count: 1,
    subdomain: "leanclub",
    workspace_id: "workspace-1",
  },
  clubPages: [
    {
      contract_version: "hotmart-club-page.v1",
      module_id: "module-1",
      name: "Bienvenida",
      page_id: "page-1",
      page_order: 1,
      type: "video",
    },
  ],
  clubProgress: [],
  clubStudents: [
    {
      contract_version: "hotmart-club-student.v1",
      email: "student@example.com",
      engagement: "active",
      name: "Student One",
      progress: {},
      status: "ACTIVE",
      user_id: "student-1",
    },
  ],
  links: [],
  mappings: [
    {
      billing_mode: "one_time",
      contract_version: "hotmart-product-mapping.v1",
      currency: "USD",
      entitlement_scope: "project",
      environment: "sandbox",
      grants_tier: "blueprint_pro",
      hotmart_price_strategy: "net_order_amount",
      hotmart_product_id: "123",
      hotmart_product_ucode: "",
      id: "mapping-1",
      internal_product_key: "blueprint_pro",
      internal_unit_amount_usd_cents: 10000,
      is_active: true,
      offer_code: "offer-1",
      plan_code: "",
      trm_policy: "internal_usd",
      updated_at: "2026-08-14T10:00:00Z",
      workspace_id: "workspace-1",
    },
  ],
  operationalAlerts: [
    {
      contract_version: "hotmart-operational-alert.v1",
      created_at: "2026-08-14T10:00:00Z",
      evidence: ["open_reconciliation_issues=1"],
      key: "hotmart_reconciliation_open",
      message: "La cola de reconciliacion debe revisarse.",
      severity: "medium",
      status: "active",
      title: "Diferencias abiertas",
    },
  ],
  products: [
    {
      benefits: [],
      capabilities: [],
      description: "Blueprint profesional",
      exclusions: [],
      name: "Blueprint Pro",
      price: {
        billing_period: "one_time",
        currency: "USD",
        price_code: "bp_pro_usd",
        unit_amount_cents: 10000,
        version: 1,
      },
      product_key: "blueprint_pro",
      product_type: "blueprint",
      scope: "project",
      tier: "blueprint_pro",
      version: 1,
    },
  ],
  promotionMetrics: {
    active: 0,
    contract_version: "hotmart-promotion-metrics.v1",
    deleted: 0,
    expired: 0,
    internal_upgrade_credit_count: 0,
    provider_coupon_count: 0,
    scheduled: 0,
    sync_error: 0,
    total: 0,
  },
  promotions: [],
  releaseReadiness: {
    alerts: [
      {
        contract_version: "hotmart-operational-alert.v1",
        created_at: "2026-08-14T10:00:00Z",
        evidence: ["open_reconciliation_issues=1"],
        key: "hotmart_reconciliation_open",
        message: "La cola de reconciliacion debe revisarse.",
        severity: "medium",
        status: "active",
        title: "Diferencias abiertas",
      },
    ],
    checklist: [
      {
        contract_version: "hotmart-release-checklist-item.v1",
        detail: "El ultimo health check debe ser connected/healthy.",
        evidence: ["last_health_status=connected"],
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
    runbook: [
      {
        contract_version: "hotmart-runbook-section.v1",
        key: "rollback",
        links: [],
        steps: ["Deshabilitar Hotmart.", "Volver a sandbox/fallback."],
        title: "Pausar y volver a fallback",
      },
    ],
    workspace_id: "workspace-1",
  },
  runbook: [
    {
      contract_version: "hotmart-runbook-section.v1",
      key: "rollback",
      links: [],
      steps: ["Deshabilitar Hotmart.", "Volver a sandbox/fallback."],
      title: "Pausar y volver a fallback",
    },
  ],
  reconciliationIssues: [
    {
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
      suggested_action: "Crear mapping.",
      summary: "Producto Hotmart sin mapping.",
      updated_at: "2026-08-14T10:00:00Z",
      workspace_id: "workspace-1",
    },
  ],
  status: {
    api_base_url: "https://sandbox.hotmart.com",
    auth_base_url: "https://api-sec-vlc.hotmart.com",
    basic_token_configured: true,
    client_id_configured: true,
    client_secret_configured: true,
    contract_version: "hotmart-integration-status.v1",
    enabled: true,
    environment: "sandbox",
    hottok_configured: true,
    last_health_check_at: "2026-08-14T10:00:00Z",
    last_health_message: "ok",
    last_health_status: "connected",
    last_sync_at: null,
    status: "connected",
    storage_mode: "ciphertext",
    updated_at: "2026-08-14T10:00:00Z",
    webhook_public_url: "https://example.com/api/v1/webhooks/hotmart",
    workspace_id: "workspace-1",
  },
  syncCursors: [],
  syncRuns: [],
};

function createMockApi(overrides: Partial<HotmartAdminApi> = {}): HotmartAdminApi {
  return {
    createPromotion: vi.fn(),
    createCheckoutPaymentLink: vi.fn(),
    createHotmartCheckoutSession: vi.fn(),
    createPaymentLink: vi.fn(),
    deletePromotion: vi.fn(),
    getClubOverview: vi.fn().mockResolvedValue(dashboard.clubOverview),
    replayWebhook: vi.fn(),
    getDashboard: vi.fn().mockResolvedValue(dashboard),
    getPromotionMetrics: vi.fn().mockResolvedValue(dashboard.promotionMetrics),
    getReleaseReadiness: vi.fn().mockResolvedValue(dashboard.releaseReadiness),
    getStatus: vi.fn().mockResolvedValue(dashboard.status),
    listClubModules: vi.fn().mockResolvedValue(dashboard.clubModules),
    listClubPages: vi.fn().mockResolvedValue(dashboard.clubPages),
    listClubProgress: vi.fn().mockResolvedValue(dashboard.clubProgress),
    listClubStudents: vi.fn().mockResolvedValue(dashboard.clubStudents),
    listOperationalAlerts: vi.fn().mockResolvedValue(dashboard.operationalAlerts),
    listReconciliationIssues: vi.fn().mockResolvedValue(dashboard.reconciliationIssues),
    listMappings: vi.fn(),
    listPaymentLinks: vi.fn(),
    listProducts: vi.fn(),
    listPromotions: vi.fn().mockResolvedValue(dashboard.promotions),
    listRunbook: vi.fn().mockResolvedValue(dashboard.runbook),
    listSyncCursors: vi.fn().mockResolvedValue(dashboard.syncCursors),
    listSyncRuns: vi.fn().mockResolvedValue(dashboard.syncRuns),
    refreshPaymentLink: vi.fn(),
    resolveReconciliationIssue: vi.fn(),
    runSync: vi.fn(),
    saveCredentials: vi.fn().mockResolvedValue(dashboard.status),
    syncClub: vi.fn(),
    testConnection: vi.fn().mockResolvedValue({
      checked_at: "2026-08-14T10:00:00Z",
      contract_version: "hotmart-test-connection.v1",
      environment: "sandbox",
      http_status: 200,
      message: "ok",
      reachable: true,
      status: "connected",
      token_expires_in: 172799,
      workspace_id: "workspace-1",
    }),
    upsertMapping: vi.fn(),
    ...overrides,
  } as HotmartAdminApi;
}

function createUser(role: "admin" | "viewer"): AuthUser {
  return {
    active_workspace_id: "workspace-1",
    active_workspace_name: "Workspace principal",
    email: "admin@example.com",
    full_name: "Admin",
    id: "user-1",
    workspaces: [
      {
        is_active: true,
        role,
        workspace_id: "workspace-1",
        workspace_name: "Workspace principal",
        workspace_slug: "workspace-principal",
      },
    ],
  };
}

function renderView(api: HotmartAdminApi, role: "admin" | "viewer" = "admin") {
  const user = createUser(role);
  const authStore = createAuthStore({
    api: {
      login: vi.fn(),
      logout: vi.fn(),
      me: vi.fn().mockResolvedValue(user),
      selectWorkspace: vi.fn().mockResolvedValue(user),
    },
    clearToken: vi.fn(),
    clearWorkspaceId: vi.fn(),
    loadToken: () => "test-token",
    persistToken: vi.fn(),
    persistWorkspaceId: vi.fn(),
  });

  return render(
    <LanguageProvider>
      <AuthProvider store={authStore}>
        <HotmartAdminView
          api={api}
          listStatus="ready"
          selectedSession={{
            current_stage: "build_blueprint",
            id: "session-1",
            title: "Proyecto Hotmart",
            updated_at: "2026-08-14T10:00:00Z",
          }}
          sessionOptions={[{ label: "Proyecto Hotmart", value: "session-1" }]}
          sessionValue="session-1"
          user={user}
        />
      </AuthProvider>
    </LanguageProvider>,
  );
}

describe("HotmartAdminView", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        clear: vi.fn(),
        getItem: vi.fn(() => null),
        key: vi.fn(() => null),
        length: 0,
        removeItem: vi.fn(),
        setItem: vi.fn(),
      },
    });
  });

  it("loads the admin dashboard for admin workspaces", async () => {
    const api = createMockApi();

    renderView(api);

    expect(await screen.findByText("Consola Hotmart")).toBeInTheDocument();
    expect(await screen.findByText("Preparacion operacional")).toBeInTheDocument();
    expect(screen.getAllByText("connected").length).toBeGreaterThan(0);
    expect(api.getDashboard).toHaveBeenCalledWith("sandbox");
  });

  it("protects the module for non-admin workspace members", async () => {
    const api = createMockApi();

    renderView(api, "viewer");

    expect(await screen.findByText("Modulo Hotmart protegido")).toBeInTheDocument();
    expect(api.getDashboard).not.toHaveBeenCalled();
  });

  it("saves credential configuration without rendering secret values", async () => {
    const api = createMockApi();

    renderView(api);

    fireEvent.click(await screen.findByRole("button", { name: "Credenciales" }));
    fireEvent.change(screen.getByLabelText("Client Secret"), { target: { value: "secret-for-test" } });
    fireEvent.click(screen.getByText("Guardar"));

    await waitFor(() => {
      expect(api.saveCredentials).toHaveBeenCalledWith(expect.objectContaining({ client_secret: "secret-for-test" }));
    });
    expect(screen.queryByText("secret-for-test")).not.toBeInTheDocument();
  });

  it("publishes a coupon promotion from the admin tab", async () => {
    const api = createMockApi({
      createPromotion: vi.fn().mockResolvedValue({
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
        hotmart_product_id: "123",
        id: "promotion-1",
        internal_campaign_key: "black-friday",
        internal_product_key: "blueprint_pro",
        offer_codes: ["offer-1"],
        published_at: "2026-08-14T10:00:00Z",
        starts_at: null,
        status: "active",
        updated_at: "2026-08-14T10:00:00Z",
        workspace_id: "workspace-1",
      }),
      getPromotionMetrics: vi.fn().mockResolvedValue({
        ...dashboard.promotionMetrics,
        active: 1,
        provider_coupon_count: 1,
        total: 1,
      }),
    });

    renderView(api);

    fireEvent.click(await screen.findByRole("button", { name: "Promociones" }));
    expect(await screen.findByText("Crear cupón Hotmart")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Código cupón/i), { target: { value: "black10" } });
    fireEvent.change(screen.getByLabelText("Campaña interna"), { target: { value: "black-friday" } });
    fireEvent.click(screen.getByRole("button", { name: "Publicar cupón" }));

    await waitFor(() => {
      expect(api.createPromotion).toHaveBeenCalledWith(
        expect.objectContaining({
          coupon_code: "BLACK10",
          discount_percent: 10,
          internal_campaign_key: "black-friday",
          internal_product_key: "blueprint_pro",
        }),
      );
    });
    expect(await screen.findByText("Cupon Hotmart publicado y sincronizado.")).toBeInTheDocument();
  });

  it("runs sync from the admin tab and refreshes reconciliation state", async () => {
    const api = createMockApi({
      listReconciliationIssues: vi.fn().mockResolvedValue(dashboard.reconciliationIssues),
      listSyncCursors: vi.fn().mockResolvedValue([
        {
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
        },
      ]),
      listSyncRuns: vi.fn().mockResolvedValue([
        {
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
        },
      ]),
      runSync: vi.fn().mockResolvedValue({
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
      }),
    });

    renderView(api);

    fireEvent.click(await screen.findByRole("button", { name: "Sincronizacion" }));
    expect(await screen.findByText("Sync manual por recurso")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ejecutar sync" }));

    await waitFor(() => {
      expect(api.runSync).toHaveBeenCalledWith(expect.objectContaining({ environment: "sandbox", resource: "products" }));
    });
    expect(await screen.findByText("Sync products completado: 1 leidos, 1 diferencias.")).toBeInTheDocument();
  });

  it("syncs Hotmart Club from the community admin tab", async () => {
    const api = createMockApi({
      listReconciliationIssues: vi.fn().mockResolvedValue(dashboard.reconciliationIssues),
      listSyncCursors: vi.fn().mockResolvedValue(dashboard.syncCursors),
      listSyncRuns: vi.fn().mockResolvedValue([
        {
          contract_version: "hotmart-sync-run.v1",
          cursor_after: "",
          cursor_before: "",
          environment: "sandbox",
          error_summary: "",
          finished_at: "2026-08-14T10:00:00Z",
          id: "sync-run-club-1",
          issue_count: 1,
          records_created: 1,
          records_read: 3,
          records_skipped: 0,
          records_updated: 0,
          resource: "club",
          started_at: "2026-08-14T10:00:00Z",
          started_by_user_id: "user-1",
          status: "succeeded",
          workspace_id: "workspace-1",
        },
      ]),
      syncClub: vi.fn().mockResolvedValue({
        contract_version: "hotmart-sync-run.v1",
        cursor_after: "",
        cursor_before: "",
        environment: "sandbox",
        error_summary: "",
        finished_at: "2026-08-14T10:00:00Z",
        id: "sync-run-club-1",
        issue_count: 1,
        records_created: 1,
        records_read: 3,
        records_skipped: 0,
        records_updated: 0,
        resource: "club",
        started_at: "2026-08-14T10:00:00Z",
        started_by_user_id: "user-1",
        status: "succeeded",
        workspace_id: "workspace-1",
      }),
    });

    renderView(api);

    fireEvent.click(await screen.findByRole("button", { name: "Comunidad" }));
    expect(await screen.findByText("Comunidad Hotmart Club")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sincronizar Club" }));

    await waitFor(() => {
      expect(api.syncClub).toHaveBeenCalledWith(
        expect.objectContaining({
          environment: "sandbox",
          subdomain: "leanclub",
          sync_modules: true,
          sync_pages: true,
          sync_students: true,
        }),
      );
    });
    expect(await screen.findByText("Club sincronizado: 3 registros, 1 diferencias.")).toBeInTheDocument();
  });

  it("shows release readiness, operational alerts and runbook in audit tab", async () => {
    const api = createMockApi();

    renderView(api);

    fireEvent.click(await screen.findByRole("button", { name: "Auditoria" }));

    expect(await screen.findByText("Release checklist")).toBeInTheDocument();
    expect(screen.getByText("Conexion validada")).toBeInTheDocument();
    expect(screen.getByText("Alertas operativas")).toBeInTheDocument();
    expect(screen.getByText("Diferencias abiertas")).toBeInTheDocument();
    expect(screen.getByText("Runbook admin")).toBeInTheDocument();
    expect(screen.getByText("Pausar y volver a fallback")).toBeInTheDocument();
  });
});
