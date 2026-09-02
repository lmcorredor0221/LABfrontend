import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AuthProvider } from "@/core/auth/auth-context";
import { createAuthStore } from "@/core/auth/auth-store";
import type { AuthUser } from "@/core/auth/types";
import { LanguageProvider } from "@/core/i18n/language-context";
import { HotmartAdminView } from "@/features/hotmart/hotmart-admin-page";
import type { HotmartAdminApi } from "@/features/hotmart/hotmart-api";
import type { CommercialAdminBootstrapData, HotmartDashboardData } from "@/features/hotmart/hotmart-contracts";

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

const dashboardBootstrap = {
  products: dashboard.products,
  status: dashboard.status,
};

const commercialBootstrap: CommercialAdminBootstrapData = {
  balanceSnapshot: {
    buckets: [],
    by_source_kind: {
      adjustment: 0,
      free: 2,
      one_time: 0,
      subscription: 0,
    },
    contract_version: "commercial-balance-snapshot.v1",
    product_key: "blueprint_pro",
    total_available_units: 2,
    workspace_id: "workspace-1",
  },
  effectiveConfig: {
    allow_courtesy: true,
    allow_debt_pending: true,
    allow_manual_override_without_charge: true,
    catalog_priority_strategy: "minimum_sufficient",
    checkout_required_on_zero_balance: true,
    consumption_priority: ["free", "subscription", "one_time"],
    contract_version: "commercial-quota-effective-config.v1",
    debt_enabled: true,
    default_blocked_request_ttl_hours: 72,
    default_checkout_ttl_minutes: 30,
    display_name: "Blueprint Pro",
    duplicate_conflict_visibility: "platform_admin_only",
    enabled: true,
    fifo_auto_approval_enabled: true,
    initial_free_units: 2,
    override_id: null,
    product_key: "blueprint_pro",
    sync_retry_limit: 5,
    workspace_id: "workspace-1",
  },
  openDebtCount: 1,
  quotaConfigs: [
    {
      allow_courtesy: true,
      allow_debt_pending: true,
      allow_manual_override_without_charge: true,
      catalog_priority_strategy: "minimum_sufficient",
      checkout_required_on_zero_balance: true,
      consumption_priority: ["free", "subscription", "one_time"],
      contract_version: "commercial-quota-product-config.v1",
      debt_enabled: true,
      default_blocked_request_ttl_hours: 72,
      default_checkout_ttl_minutes: 30,
      display_name: "Blueprint Pro",
      duplicate_conflict_visibility: "platform_admin_only",
      enabled: true,
      fifo_auto_approval_enabled: true,
      id: "quota-1",
      initial_free_units: 2,
      product_key: "blueprint_pro",
      sync_retry_limit: 5,
      updated_at: "2026-08-14T10:00:00Z",
    },
  ],
  recommendation: {
    contract_version: "commercial-package-recommendation.v1",
    display_name: "Plan BP Pro",
    granted_units_for_product: 10,
    hotmart_environment: "sandbox",
    hotmart_product_id: "123",
    hotmart_product_ucode: "",
    offer_code: "offer-1",
    package_code: "pkg-bp-pro",
    package_type: "one_time",
    plan_code: "",
    recommendation_priority: 10,
    recommendation_reason: "Paquete minimo suficiente segun configuracion efectiva.",
    requested_product_key: "blueprint_pro",
    required_units: 1,
  },
  workspaceOverrides: [],
};

function createMockApi(overrides: Partial<HotmartAdminApi> = {}): HotmartAdminApi {
  return {
    createPromotion: vi.fn(),
    createCheckoutPaymentLink: vi.fn(),
    createHotmartCheckoutSession: vi.fn(),
    createPaymentLink: vi.fn(),
    deletePromotion: vi.fn(),
    getClubOverview: vi.fn().mockResolvedValue(dashboard.clubOverview),
    getCommercialBootstrap: vi.fn().mockResolvedValue(commercialBootstrap),
    getDashboardBootstrap: vi.fn().mockResolvedValue(dashboardBootstrap),
    replayWebhook: vi.fn(),
    getDashboard: vi.fn().mockResolvedValue(dashboard),
    listCommercialBalanceLedger: vi.fn().mockResolvedValue([
      {
        access_request_id: null,
        actor_user_id: null,
        balance_after_units: 2,
        balance_before_units: 0,
        bucket_balance_after_units: 2,
        bucket_balance_before_units: 0,
        bucket_id: null,
        contract_version: "commercial-balance-ledger.v1",
        created_at: "2026-08-14T10:00:00Z",
        delta_units: 2,
        id: "ledger-1",
        metadata: {},
        movement_type: "grant",
        order_id: null,
        payment_id: null,
        product_key: "blueprint_pro",
        source_kind: "free",
        source_ref: "seed",
        workspace_id: "workspace-1",
      },
    ]),
    listCommercialDebts: vi.fn().mockResolvedValue([
      {
        access_request_id: null,
        amount_cents: 10000,
        contract_version: "commercial-debt.v1",
        created_at: "2026-08-14T10:00:00Z",
        currency: "USD",
        due_at: null,
        id: "debt-1",
        opened_by_user_id: null,
        order_id: null,
        product_key: "blueprint_pro",
        reason_code: "debt_pending",
        reason_label: "Deuda pendiente",
        resolved_at: null,
        resolved_by_user_id: null,
        settled_amount_cents: 0,
        status: "open",
        summary: "Aprobacion comercial con deuda pendiente.",
        updated_at: "2026-08-14T10:00:00Z",
        workspace_id: "workspace-1",
      },
    ]),
    listCommercialLegacyPackageResolutions: vi.fn().mockResolvedValue([]),
    listCommercialPackageCatalog: vi.fn().mockResolvedValue([
      {
        billing_cycle: "",
        checkout_currency_mode: "workspace_preferred",
        contract_version: "commercial-package-catalog.v1",
        display_name: "Plan BP Pro",
        enabled: true,
        granted_units: 10,
        granted_units_acp: 0,
        granted_units_blueprint_pro: 10,
        hotmart_environment: "sandbox",
        hotmart_price_strategy: "provider_authoritative",
        hotmart_product_id: "123",
        hotmart_product_ucode: "",
        id: "pkg-1",
        offer_code: "offer-1",
        package_code: "pkg-bp-pro",
        package_type: "one_time",
        plan_code: "",
        product_key: "blueprint_pro",
        recommendation_priority: 10,
        renewal_policy: "",
        updated_at: "2026-08-14T10:00:00Z",
        validity_days: null,
      },
    ]),
    getPromotionMetrics: vi.fn().mockResolvedValue(dashboard.promotionMetrics),
    getReleaseReadiness: vi.fn().mockResolvedValue(dashboard.releaseReadiness),
    getStatus: vi.fn().mockResolvedValue(dashboard.status),
    listClubModules: vi.fn().mockResolvedValue(dashboard.clubModules),
    listClubPages: vi.fn().mockResolvedValue(dashboard.clubPages),
    listClubProgress: vi.fn().mockResolvedValue(dashboard.clubProgress),
    listClubStudents: vi.fn().mockResolvedValue(dashboard.clubStudents),
    listOperationalAlerts: vi.fn().mockResolvedValue(dashboard.operationalAlerts),
    listReconciliationIssues: vi.fn().mockResolvedValue(dashboard.reconciliationIssues),
    listMappings: vi.fn().mockResolvedValue(dashboard.mappings),
    listPaymentLinks: vi.fn().mockResolvedValue(dashboard.links),
    listProducts: vi.fn().mockResolvedValue(dashboard.products),
    listPromotions: vi.fn().mockResolvedValue(dashboard.promotions),
    listRunbook: vi.fn().mockResolvedValue(dashboard.runbook),
    listSyncCursors: vi.fn().mockResolvedValue(dashboard.syncCursors),
    listSyncRuns: vi.fn().mockResolvedValue(dashboard.syncRuns),
    refreshPaymentLink: vi.fn(),
    resolveCommercialLegacyPackageResolution: vi.fn(),
    resolveReconciliationIssue: vi.fn(),
    runSync: vi.fn(),
    saveCredentials: vi.fn().mockResolvedValue(dashboard.status),
    saveCommercialPackageCatalog: vi.fn(),
    saveCommercialQuotaProduct: vi.fn(),
    saveCommercialWorkspaceOverride: vi.fn(),
    settleCommercialDebt: vi.fn(),
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

function createUser(role: "admin" | "viewer", platformAdmin = false): AuthUser {
  return {
    active_workspace_id: "workspace-1",
    active_workspace_name: "Workspace principal",
    email: "admin@example.com",
    full_name: "Admin",
    id: "user-1",
    platform_roles: platformAdmin ? ["platform_admin"] : [],
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

function renderView(api: HotmartAdminApi, role: "admin" | "viewer" = "admin", platformAdmin = true) {
  const user = createUser(role, platformAdmin);
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
          isPlatformAdmin={platformAdmin}
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

  it("loads the admin dashboard for platform admins", async () => {
    const api = createMockApi();

    renderView(api, "admin", true);

    expect(await screen.findByText("Consola Hotmart")).toBeInTheDocument();
    expect(await screen.findByText("Preparacion operacional")).toBeInTheDocument();
    expect(screen.getAllByText("connected").length).toBeGreaterThan(0);
    expect(api.getDashboardBootstrap).toHaveBeenCalledWith("sandbox");
    expect(api.getClubOverview).not.toHaveBeenCalled();
    expect(api.getPromotionMetrics).not.toHaveBeenCalled();
    expect(api.getReleaseReadiness).not.toHaveBeenCalled();
  });

  it("protects the module for non-platform-admin users", async () => {
    const api = createMockApi();

    renderView(api, "admin", false);

    expect(await screen.findByText("Modulo Hotmart protegido")).toBeInTheDocument();
    expect(api.getDashboardBootstrap).not.toHaveBeenCalled();
  });

  it("saves credential configuration without rendering secret values", async () => {
    const api = createMockApi();

    renderView(api, "admin", true);

    fireEvent.click(await screen.findByRole("button", { name: "Credenciales" }));
    fireEvent.change(await screen.findByLabelText("Client Secret"), { target: { value: "secret-for-test" } });
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

    renderView(api, "admin", true);

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

  it("shows release readiness, operational alerts and runbook in readiness tab", async () => {
    const api = createMockApi();

    renderView(api);

    fireEvent.click(await screen.findByRole("button", { name: "Readiness" }));

    expect(await screen.findByText("Release checklist")).toBeInTheDocument();
    expect(screen.getByText("Conexion validada")).toBeInTheDocument();
    expect(screen.getByText("Alertas operativas")).toBeInTheDocument();
    expect(screen.getByText("Diferencias abiertas")).toBeInTheDocument();
    expect(screen.getByText("Runbook admin")).toBeInTheDocument();
    expect(screen.getByText("Pausar y volver a fallback")).toBeInTheDocument();
  });

  it("loads comercial slices only when the platform admin opens each subview", async () => {
    const api = createMockApi();

    renderView(api);

    fireEvent.click(await screen.findByRole("button", { name: "Comercial" }));

    expect(await screen.findByText("Motor comercial por cliente/workspace")).toBeInTheDocument();
    expect(api.getCommercialBootstrap).toHaveBeenCalledWith({ productKey: "blueprint_pro" });
    expect(api.listCommercialBalanceLedger).not.toHaveBeenCalled();
    expect(api.listCommercialPackageCatalog).not.toHaveBeenCalled();
    expect(api.listCommercialDebts).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Balance" }));
    expect(await screen.findByText("Ledger reciente")).toBeInTheDocument();
    expect(api.listCommercialBalanceLedger).toHaveBeenCalledWith("blueprint_pro");

    fireEvent.click(screen.getByRole("button", { name: "Paquetes" }));
    expect(await screen.findByText("Catalogo de paquetes")).toBeInTheDocument();
    expect(api.listCommercialPackageCatalog).toHaveBeenCalledWith("", true);
    expect(api.listCommercialLegacyPackageResolutions).toHaveBeenCalledWith({ productKey: "blueprint_pro" });

    fireEvent.click(screen.getByRole("button", { name: "Deudas" }));
    expect((await screen.findAllByText("Deudas abiertas")).length).toBeGreaterThan(0);
    expect(api.listCommercialDebts).toHaveBeenCalledWith({ productKey: "blueprint_pro", status: "open" });
  });
});
