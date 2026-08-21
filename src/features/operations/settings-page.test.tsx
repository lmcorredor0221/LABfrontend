import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ApiError } from "@/core/api";
import { LanguageProvider } from "@/core/i18n/language-context";
import { SettingsWorkspacePage } from "@/features/operations/settings-page";
import type {
  AdminOverviewResponse,
  AdminProjectsAnalytics,
  AdminRolesResponse,
  AdminUserInvitationListResponse,
  AdminUsersListResponse,
} from "@/features/operations/admin-console-contracts";
import type {
  LLMRuntimeSettings,
  PlatformRuntimeProviderResponse,
  WorkspaceRuntimeHealthResponse,
} from "@/features/sessions/session-contracts";

const {
  adminConsoleApiMock,
  authStateRef,
  createSessionMock,
  getEstimationCalibrationMock,
  getRuntimeSettingsMock,
  getPlanAccessMock,
  hotmartAdminViewMock,
  patchFeatureFlagMock,
  patchRuntimeSettingsMock,
  runtimeApiMock,
  refreshSessionListMock,
  selectSessionContextMock,
  selectOperationalSessionMock,
} = vi.hoisted(() => ({
  adminConsoleApiMock: {
    createInvitation: vi.fn(),
    getRoles: vi.fn(),
    getOverview: vi.fn(),
    getProjectsAnalytics: vi.fn(),
    listInvitations: vi.fn(),
    listUsers: vi.fn(),
    updateUser: vi.fn(),
  },
  authStateRef: {
    current: null as {
      status: string;
      user: {
        active_workspace_id: string | null;
        active_workspace_name: string | null;
        email: string;
        full_name: string;
        id: string;
        workspaces: Array<{
          is_active: boolean;
          role: "owner" | "admin" | "editor" | "viewer";
          workspace_id: string;
          workspace_name: string;
          workspace_slug: string;
        }>;
      } | null;
    } | null,
  },
  createSessionMock: vi.fn(),
  getEstimationCalibrationMock: vi.fn(),
  getPlanAccessMock: vi.fn(),
  getRuntimeSettingsMock: vi.fn(),
  hotmartAdminViewMock: vi.fn(({ embedded }: { embedded?: boolean }) => (
    <div data-testid="hotmart-admin-view">{embedded ? "Hotmart embebido" : "Hotmart standalone"}</div>
  )),
  patchFeatureFlagMock: vi.fn(),
  patchRuntimeSettingsMock: vi.fn(),
  runtimeApiMock: {
    deleteWorkspaceSecret: vi.fn(),
    getPlatformAudit: vi.fn(),
    getPlatformDefaults: vi.fn(),
    getWorkspaceRuntimeHealth: vi.fn(),
    listPlatformProviders: vi.fn(),
    resetWorkspaceRuntime: vi.fn(),
    rotateWorkspaceSecret: vi.fn(),
    status: vi.fn(),
    testWorkspaceRuntime: vi.fn(),
    updatePlatformDefaults: vi.fn(),
    updatePlatformProvider: vi.fn(),
    upsertWorkspaceSecret: vi.fn(),
  },
  refreshSessionListMock: vi.fn(),
  selectSessionContextMock: vi.fn(),
  selectOperationalSessionMock: vi.fn(),
}));

const pushMock = vi.fn();
const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/settings",
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
}));

vi.mock("@/core/auth/auth-context", () => ({
  useAuth: () => authStateRef.current,
}));

vi.mock("@/features/operations/use-operational-session", () => ({
  useOperationalSession: () => ({
    createSession: createSessionMock,
    getEstimationCalibration: getEstimationCalibrationMock,
    getRuntimeSettings: getRuntimeSettingsMock,
    items: [],
    listError: null,
    listStatus: "ready",
    patchFeatureFlag: patchFeatureFlagMock,
    patchRuntimeSettings: patchRuntimeSettingsMock,
    selectedSession: null,
    selectedSnapshot: null,
    selectOperationalSession: selectOperationalSessionMock,
  }),
}));

vi.mock("@/features/sessions/session-context", () => ({
  useSessions: () => ({
    activeSessionId: null,
    activeSnapshot: null,
    getPlanAccess: getPlanAccessMock,
    items: [],
    listStatus: "ready",
    refreshList: refreshSessionListMock,
    selectSession: selectSessionContextMock,
    snapshotStatus: "idle",
  }),
}));

vi.mock("@/core/system/runtime-api", () => ({
  runtimeApi: runtimeApiMock,
}));

vi.mock("@/features/operations/admin-console-api", () => ({
  adminConsoleApi: adminConsoleApiMock,
}));

vi.mock("@/features/finops/finops-budget-panel", () => ({
  FinOpsBudgetPanel: ({ canManage }: { canManage: boolean }) => (
    <div data-testid="finops-budget-panel">{canManage ? "Presupuestos FinOps editables" : "Presupuestos FinOps lectura"}</div>
  ),
}));

vi.mock("@/features/hotmart/hotmart-admin-page", () => ({
  HotmartAdminView: hotmartAdminViewMock,
}));

function buildForbiddenError() {
  return new ApiError({
    code: "FORBIDDEN",
    message: "Forbidden",
    source: "backend",
    status: 403,
  });
}

function buildRuntimeSettings(activeProvider: "deepseek" | "openai", workspaceId: string): LLMRuntimeSettings {
  return {
    active_provider: activeProvider,
    agent_execution_backend: activeProvider === "deepseek" ? "shadow_codex_cli" : "provider_native",
    codex_local: {
      auth_mode: "auto",
      available: true,
      command: "codex",
      cost_policy: "hybrid",
      executable_found: true,
      fallback_models: [],
      health_status: "local_ready",
      last_rotated_at: null,
      max_concurrency: 1,
      model: "gpt-5.5",
      primary_agents: [],
      profile: `profile-${workspaceId}`,
      runner_id: `runner-${workspaceId}`,
      secret_source: "local_runtime",
      shadow_agents: activeProvider === "deepseek" ? ["build_canvas"] : [],
      staged_agents: [],
      status_note: "Codex listo",
      timeout_ms: 150000,
    },
    compatibility_mode: "backward_compatible",
    deepseek: {
      api_key_configured: true,
      available: true,
      base_url: "https://api.deepseek.com",
      fast_model: "deepseek-v4-flash",
      health_status: activeProvider === "deepseek" ? "workspace_ready" : "platform_ready",
      last_rotated_at: null,
      reasoning_effort: "high",
      reasoning_model: "deepseek-v4-pro",
      secret_source: activeProvider === "deepseek" ? "workspace_managed" : "platform_managed",
      status_note: "DeepSeek listo",
    },
    field_origins: {
      active_provider: activeProvider === "deepseek" ? "override" : "default",
      agent_execution_backend: activeProvider === "deepseek" ? "override" : "default",
      knowledge_access_backend: activeProvider === "deepseek" ? "override" : "default",
      uses_platform_credentials: activeProvider === "deepseek" ? "override" : "default",
    },
    knowledge_access_backend: activeProvider === "deepseek" ? "workspace_staged" : "hybrid",
    memory_rollout: {
      effective_default_backend: activeProvider === "deepseek" ? "workspace_staged" : "hybrid",
      manifest_ready: true,
      notes: [],
      phases: [
        {
          description: "Core",
          enabled: true,
          label: "Core",
          phase_key: "core",
          stage_keys: ["discover", "define"],
        },
      ],
      requested_backend: activeProvider === "deepseek" ? "workspace_staged" : "hybrid",
      stages: [
        {
          effective_backend: activeProvider === "deepseek" ? "workspace_staged" : "hybrid",
          enabled: true,
          expects_llm_call: true,
          label: "Discover",
          phase_key: "core",
          requested_backend: activeProvider === "deepseek" ? "workspace_staged" : "hybrid",
          stage_key: "discover",
        },
      ],
      status: "ready",
    },
    openai: {
      api_key_configured: true,
      available: true,
      fast_model: "gpt-5.4-mini",
      health_status: activeProvider === "openai" ? "workspace_ready" : "platform_ready",
      last_rotated_at: null,
      reasoning_effort: "low",
      reasoning_model: "gpt-5.5",
      secret_source: activeProvider === "openai" ? "workspace_managed" : "platform_managed",
      status_note: "OpenAI listo",
    },
    provider_options: [
      {
        configured: true,
        description: "Provider OpenAI",
        key: "openai",
        label: "OpenAI",
        metadata: {},
        reachable: true,
        selected: activeProvider === "openai",
        supports_structured_output: true,
      },
      {
        configured: true,
        description: "Provider DeepSeek",
        key: "deepseek",
        label: "DeepSeek",
        metadata: {},
        reachable: true,
        selected: activeProvider === "deepseek",
        supports_structured_output: true,
      },
      {
        configured: true,
        description: "Provider Codex",
        key: "codex_local",
        label: "Codex CLI",
        metadata: {},
        reachable: true,
        selected: false,
        supports_structured_output: true,
      },
    ],
    updated_at: "2026-07-20T16:00:00Z",
    uses_platform_credentials: activeProvider !== "deepseek",
  };
}

function buildWorkspaceHealth(workspaceId: string, providerKey: "deepseek" | "openai"): WorkspaceRuntimeHealthResponse {
  return {
    agent_execution_backend: providerKey === "deepseek" ? "shadow_codex_cli" : "provider_native",
    checked_at: "2026-07-20T16:10:00Z",
    checks: [
      {
        check_key: "config",
        detail: "OK",
        label: "Configuracion",
        status: "ready",
      },
    ],
    health_status: "healthy",
    knowledge_access_backend: providerKey === "deepseek" ? "workspace_staged" : "hybrid",
    mode: "health",
    overall_status: "healthy",
    provider_key: providerKey,
    provider_label: providerKey === "deepseek" ? "DeepSeek" : "OpenAI",
    secret_source: providerKey === "deepseek" ? "workspace_managed" : "platform_managed",
    uses_platform_credentials: providerKey !== "deepseek",
    workspace_id: workspaceId,
  };
}

function buildPlatformProviders(): PlatformRuntimeProviderResponse[] {
  return [
    {
      allowed_auth_modes: ["api_key", "session"],
      allowed_models: ["gpt-5.5", "gpt-5.4-mini"],
      created_at: "2026-07-20T16:00:00Z",
      default_models: {},
      health_policy: {},
      is_enabled: true,
      label: "OpenAI",
      provider_key: "openai",
      release_stage: "general_availability",
      supports_platform_managed_credentials: true,
      supports_workspace_secrets: true,
      updated_at: "2026-07-20T16:00:00Z",
    },
    {
      allowed_auth_modes: ["api_key"],
      allowed_models: ["deepseek-v4-pro"],
      created_at: "2026-07-20T16:00:00Z",
      default_models: {},
      health_policy: {},
      is_enabled: true,
      label: "DeepSeek",
      provider_key: "deepseek",
      release_stage: "preview",
      supports_platform_managed_credentials: true,
      supports_workspace_secrets: true,
      updated_at: "2026-07-20T16:00:00Z",
    },
  ];
}

function buildAdminProjectsAnalytics(): AdminProjectsAnalytics {
  return {
    active: 2,
    archived: 0,
    created_series: {
      availability: { reason: "Serie calculada desde sessions.created_at.", source: "sessions.created_at", status: "available" },
      items: [
        { bucket: "2026-08-13T00:00:00", created_count: 1 },
        { bucket: "2026-08-14T00:00:00", created_count: 2 },
      ],
    },
    definitions: {
      active_project: "Proyecto no archivado, no eliminado y no finalizado.",
      finalized_project: "Snapshot: current_stage=ready_for_export o status=ready.",
    },
    deleted: 0,
    distribution_by_stage: [
      { count: 2, percentage: 0.67, stage: "draft_capture" },
      { count: 1, percentage: 0.33, stage: "ready_for_export" },
    ],
    distribution_by_status: [
      { count: 2, percentage: 0.67, status: "draft" },
      { count: 1, percentage: 0.33, status: "ready" },
    ],
    finalized: 1,
    finalized_series: {
      availability: { reason: "No existe finalized_at.", source: "sessions.current_stage", status: "not_instrumented" },
      items: [],
    },
    period: {
      granularity: "day",
      started_from: "2026-08-01T00:00:00",
      started_to: "2026-08-31T23:59:59",
      timezone: "UTC",
    },
    total: 3,
  };
}

function buildAdminOverview(): AdminOverviewResponse {
  const projects = buildAdminProjectsAnalytics();
  return {
    activity: {
      availability: {
        reason: "Feed consolidado inicial.",
        source: "runtime_settings_audit + llm_usage_ledger + sessions",
        status: "partial",
      },
      count: 1,
      items: [
        {
          actor_email: "admin@leanbuilder.local",
          actor_user_id: "user-1",
          created_at: "2026-08-14T09:00:00",
          id: "activity-1",
          metadata: {},
          severity: "info",
          source: "sessions",
          title: "Proyecto creado: Demo",
          type: "project",
        },
      ],
    },
    availability: {
      connected_users: { reason: "No existe heartbeat.", source: "auth_tokens", status: "not_instrumented" },
      llm_usage: { reason: "Ledger LLM filtrado.", source: "llm_usage_ledger", status: "available" },
      project_finalized_at: { reason: "No existe finalized_at.", source: "sessions.current_stage", status: "not_instrumented" },
      projects: { reason: "Sesiones filtradas.", source: "sessions", status: "available" },
      users: { reason: "Usuarios por membresia.", source: "workspace_memberships + users", status: "available" },
    },
    filters: {
      model_name: "",
      project_id: null,
      provider_key: "",
      stage: "",
      user_id: null,
      workspace_id: "workspace-a",
    },
    llm: {
      provider_breakdown: [
        {
          call_count: 3,
          cost_total: 12,
          error_count: 0,
          model_name: "gpt-5.5",
          provider_key: "openai",
          total_tokens: 1500,
        },
      ],
      summary: {
        avg_latency_ms: 120,
        call_count: 3,
        cost_per_call: 4,
        cost_total: 12,
        currency: "USD",
        currency_breakdown: [{ call_count: 3, cost_total: 12, currency: "USD" }],
        error_count: 0,
        error_rate: 0,
        estimated_count: 0,
        fallback_count: 0,
        input_tokens: 900,
        output_tokens: 600,
        p95_latency_ms: 220,
        retry_count: 0,
        total_tokens: 1500,
      },
    },
    period: projects.period,
    projects,
    users: {
      active: 2,
      connected: null,
      connected_availability: { reason: "No existe heartbeat.", source: "auth_tokens", status: "not_instrumented" },
      distribution_by_role: [{ count: 2, percentage: 1, role: "owner" }],
      inactive: 0,
      new_users: 1,
      period: projects.period,
      recently_active: 1,
      total: 2,
    },
    workspace: {
      id: "workspace-a",
      name: "Workspace A",
      slug: "workspace-a",
    },
  };
}

function buildAdminUsersList(): AdminUsersListResponse {
  return {
    count: 2,
    items: [
      {
        activity: {
          activity_definition: "Actividad derivada de auditoria, consumo LLM o proyectos.",
          is_recently_active: true,
          last_activity_at: "2026-08-14T09:00:00",
        },
        created_at: "2026-08-01T09:00:00",
        email: "admin@leanbuilder.local",
        email_verified: true,
        full_name: "Lean Builder Admin",
        id: "user-1",
        is_active: true,
        membership: {
          created_at: "2026-08-01T09:00:00",
          id: "membership-1",
          is_active: true,
          role: "owner",
          updated_at: "2026-08-14T09:00:00",
          workspace_id: "workspace-a",
        },
        preferred_currency: "USD",
        preferred_language: "es",
        updated_at: "2026-08-14T09:00:00",
      },
      {
        activity: {
          activity_definition: "Ultima actividad registrada en sesiones.",
          is_recently_active: false,
          last_activity_at: "2026-08-12T11:20:00",
        },
        created_at: "2026-08-05T10:00:00",
        email: "editor@leanbuilder.local",
        email_verified: true,
        full_name: "Product Editor",
        id: "user-2",
        is_active: true,
        membership: {
          created_at: "2026-08-05T10:00:00",
          id: "membership-2",
          is_active: true,
          role: "viewer",
          updated_at: "2026-08-12T11:20:00",
          workspace_id: "workspace-a",
        },
        preferred_currency: "USD",
        preferred_language: "es",
        updated_at: "2026-08-12T11:20:00",
      },
    ],
    limit: 100,
    offset: 0,
  };
}

function buildAdminInvitations(): AdminUserInvitationListResponse {
  return {
    count: 1,
    items: [
      {
        accepted_user_id: null,
        created_at: "2026-08-14T10:00:00",
        delivery_status: "manual_delivery_required",
        email: "pending@leanbuilder.local",
        expires_at: null,
        full_name: "Pending User",
        id: "invitation-1",
        invited_by_user_id: "user-1",
        message: "Acceso inicial",
        metadata: { source: "settings_admin_console" },
        role: "viewer",
        status: "pending",
        updated_at: "2026-08-14T10:00:00",
        workspace_id: "workspace-a",
      },
    ],
    limit: 50,
    offset: 0,
  };
}

function buildAdminRoles(): AdminRolesResponse {
  return {
    definitions: {
      admin: "Administra runtime y configuraciones del workspace.",
      editor: "Gestiona proyectos y contenidos operativos.",
      owner: "Administracion total del workspace.",
      viewer: "Consulta informacion sin cambios administrativos.",
    },
    effective: {
      platform: ["platform_admin"],
      workspace: "owner",
    },
    platform_roles: [
      {
        is_system: true,
        key: "platform_admin",
        label: "Platform admin",
        permission_count: 3,
        permissions: ["platform.runtime.manage", "platform.providers.manage", "platform.audit.read"],
        scope: "platform",
      },
    ],
    workspace_roles: [
      {
        is_system: true,
        key: "owner",
        label: "Owner",
        permission_count: 4,
        permissions: ["workspace.users.manage", "workspace.roles.assign", "runtime.manage", "finops.manage"],
        scope: "workspace",
      },
      {
        is_system: true,
        key: "admin",
        label: "Admin",
        permission_count: 3,
        permissions: ["workspace.users.manage", "runtime.manage", "finops.read"],
        scope: "workspace",
      },
      {
        is_system: true,
        key: "viewer",
        label: "Viewer",
        permission_count: 1,
        permissions: ["workspace.read"],
        scope: "workspace",
      },
    ],
  };
}

function getProviderSummaryText() {
  const label = screen.getByText("Provider efectivo");
  const container = label.parentElement;
  return container?.textContent ?? "";
}

function renderSettingsPage(props: Parameters<typeof SettingsWorkspacePage>[0] = {}) {
  return render(
    <LanguageProvider initialLanguage="es">
      <SettingsWorkspacePage {...props} />
    </LanguageProvider>,
  );
}

describe("SettingsWorkspacePage", () => {
  beforeEach(() => {
    adminConsoleApiMock.createInvitation.mockReset();
    adminConsoleApiMock.getRoles.mockReset();
    adminConsoleApiMock.getOverview.mockReset();
    adminConsoleApiMock.getProjectsAnalytics.mockReset();
    adminConsoleApiMock.listInvitations.mockReset();
    adminConsoleApiMock.listUsers.mockReset();
    adminConsoleApiMock.updateUser.mockReset();
    hotmartAdminViewMock.mockClear();
    pushMock.mockReset();
    replaceMock.mockReset();
    createSessionMock.mockReset();
    getEstimationCalibrationMock.mockReset();
    getRuntimeSettingsMock.mockReset();
    patchFeatureFlagMock.mockReset();
    patchRuntimeSettingsMock.mockReset();
    selectOperationalSessionMock.mockReset();

    runtimeApiMock.deleteWorkspaceSecret.mockReset();
    runtimeApiMock.getPlatformAudit.mockReset();
    runtimeApiMock.getPlatformDefaults.mockReset();
    runtimeApiMock.getWorkspaceRuntimeHealth.mockReset();
    runtimeApiMock.listPlatformProviders.mockReset();
    runtimeApiMock.resetWorkspaceRuntime.mockReset();
    runtimeApiMock.rotateWorkspaceSecret.mockReset();
    runtimeApiMock.status.mockReset();
    runtimeApiMock.testWorkspaceRuntime.mockReset();
    runtimeApiMock.updatePlatformDefaults.mockReset();
    runtimeApiMock.updatePlatformProvider.mockReset();
    runtimeApiMock.upsertWorkspaceSecret.mockReset();

    authStateRef.current = {
      status: "authenticated",
      user: {
        active_workspace_id: "workspace-a",
        active_workspace_name: "Workspace A",
        email: "admin@leanbuilder.local",
        full_name: "Lean Builder Admin",
        id: "user-1",
        workspaces: [
          {
            is_active: true,
            role: "owner",
            workspace_id: "workspace-a",
            workspace_name: "Workspace A",
            workspace_slug: "workspace-a",
          },
          {
            is_active: true,
            role: "admin",
            workspace_id: "workspace-b",
            workspace_name: "Workspace B",
            workspace_slug: "workspace-b",
          },
        ],
      },
    };

    getEstimationCalibrationMock.mockResolvedValue(null);
    adminConsoleApiMock.createInvitation.mockResolvedValue({
      ...buildAdminInvitations().items[0],
      email: "nuevo@leanbuilder.local",
      id: "invitation-new",
    });
    adminConsoleApiMock.getRoles.mockResolvedValue(buildAdminRoles());
    adminConsoleApiMock.getOverview.mockResolvedValue(buildAdminOverview());
    adminConsoleApiMock.getProjectsAnalytics.mockResolvedValue(buildAdminProjectsAnalytics());
    adminConsoleApiMock.listInvitations.mockResolvedValue(buildAdminInvitations());
    adminConsoleApiMock.listUsers.mockResolvedValue(buildAdminUsersList());
    adminConsoleApiMock.updateUser.mockResolvedValue(buildAdminUsersList().items[1]);
    createSessionMock.mockResolvedValue({ id: "session-new" });
    patchRuntimeSettingsMock.mockResolvedValue(buildRuntimeSettings("openai", "workspace-a"));
  });

  it("recarga el runtime cuando cambia el workspace activo y mantiene oculto el panel de plataforma para no-admins globales", async () => {
    getRuntimeSettingsMock.mockImplementation(async () =>
      authStateRef.current?.user?.active_workspace_id === "workspace-b"
        ? buildRuntimeSettings("deepseek", "workspace-b")
        : buildRuntimeSettings("openai", "workspace-a"),
    );
    runtimeApiMock.getWorkspaceRuntimeHealth.mockImplementation(async () =>
      authStateRef.current?.user?.active_workspace_id === "workspace-b"
        ? buildWorkspaceHealth("workspace-b", "deepseek")
        : buildWorkspaceHealth("workspace-a", "openai"),
    );
    runtimeApiMock.status.mockRejectedValue(buildForbiddenError());
    runtimeApiMock.listPlatformProviders.mockRejectedValue(buildForbiddenError());
    runtimeApiMock.getPlatformDefaults.mockRejectedValue(buildForbiddenError());
    runtimeApiMock.getPlatformAudit.mockRejectedValue(buildForbiddenError());

    const view = renderSettingsPage();

    fireEvent.click(screen.getByRole("button", { name: "Configuración" }));
    expect(await screen.findByText("Runtime efectivo del workspace")).toBeInTheDocument();
    await waitFor(() => {
      expect(getProviderSummaryText()).toContain("openai");
    });
    expect(screen.queryByRole("heading", { name: /Administracion de plataforma/i })).not.toBeInTheDocument();

    authStateRef.current = authStateRef.current
      ? {
          ...authStateRef.current,
          user: authStateRef.current.user
        ? {
            ...authStateRef.current.user,
            active_workspace_id: "workspace-b",
            active_workspace_name: "Workspace B",
          }
            : null,
        }
      : null;

    view.rerender(
      <LanguageProvider initialLanguage="es">
        <SettingsWorkspacePage />
      </LanguageProvider>,
    );

    expect(await screen.findByText("Runtime efectivo del workspace")).toBeInTheDocument();
    await waitFor(() => {
      expect(getProviderSummaryText()).toContain("deepseek");
    });
    expect(getRuntimeSettingsMock).toHaveBeenCalledTimes(2);
    expect(runtimeApiMock.getWorkspaceRuntimeHealth).toHaveBeenCalledTimes(2);
  });

  it("muestra precios base en Comercial y costos cuando el runtime global esta habilitado para platform admin", async () => {
    getRuntimeSettingsMock.mockResolvedValue(buildRuntimeSettings("openai", "workspace-a"));
    runtimeApiMock.getWorkspaceRuntimeHealth.mockResolvedValue(buildWorkspaceHealth("workspace-a", "openai"));
    runtimeApiMock.status.mockResolvedValue({
      auth_detected: true,
      auth_mode: "chatgpt_session",
      configured_fallback_models: { default: [] },
      configured_models: { default: "gpt-5.5" },
      executable: "codex",
      implementation_backend: "codex_exec_wrapper",
      last_known_result: {},
      max_concurrency: 1,
      provider: "codex_local",
      runner_id: "local",
      smoke_blocking_reasons: [],
      smoke_command: "python backend/scripts/run_codex_runtime_smoke.py",
      smoke_ready: true,
      timeout_ms: 150000,
      version: "codex-cli 0.0-test",
    });
    runtimeApiMock.listPlatformProviders.mockResolvedValue(buildPlatformProviders());
    runtimeApiMock.getPlatformDefaults.mockResolvedValue(buildRuntimeSettings("openai", "workspace-a"));
    runtimeApiMock.getPlatformAudit.mockResolvedValue({
      items: [
        {
          actor_email: "admin@leanbuilder.local",
          actor_user_id: "user-1",
          after_payload_redacted: {},
          before_payload_redacted: {},
          change_type: "platform_runtime_defaults_updated",
          created_at: "2026-07-20T16:00:00Z",
          id: "audit-1",
          scope_id: "platform-runtime-defaults",
          scope_type: "platform",
        },
      ],
    });

    renderSettingsPage();

    fireEvent.click(screen.getByRole("button", { name: "Configuración" }));
    const commerceTab = await screen.findByRole("tab", { name: /Comercial y costos/i });
    fireEvent.click(commerceTab);

    expect(await screen.findByText("Administracion de plataforma")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Precios Base \(USD\)/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue("49")).toBeInTheDocument();
    expect(screen.getByDisplayValue("149")).toBeInTheDocument();
    expect(screen.queryByLabelText("Provider default")).not.toBeInTheDocument();
  });

  it("mantiene Control tecnico en feature flags del workspace sin duplicar precios base", async () => {
    getRuntimeSettingsMock.mockResolvedValue(buildRuntimeSettings("openai", "workspace-a"));
    runtimeApiMock.getWorkspaceRuntimeHealth.mockResolvedValue(buildWorkspaceHealth("workspace-a", "openai"));
    runtimeApiMock.status.mockResolvedValue({
      auth_detected: true,
      auth_mode: "chatgpt_session",
      configured_fallback_models: { default: [] },
      configured_models: { default: "gpt-5.5" },
      executable: "codex",
      implementation_backend: "codex_exec_wrapper",
      last_known_result: {},
      max_concurrency: 1,
      provider: "codex_local",
      runner_id: "local",
      smoke_blocking_reasons: [],
      smoke_command: "python backend/scripts/run_codex_runtime_smoke.py",
      smoke_ready: true,
      timeout_ms: 150000,
      version: "codex-cli 0.0-test",
    });
    runtimeApiMock.listPlatformProviders.mockResolvedValue(buildPlatformProviders());
    runtimeApiMock.getPlatformDefaults.mockResolvedValue(buildRuntimeSettings("openai", "workspace-a"));
    runtimeApiMock.getPlatformAudit.mockResolvedValue({ items: [] });

    renderSettingsPage();

    fireEvent.click(screen.getByRole("button", { name: /Configuraci.n/i }));
    fireEvent.click(await screen.findByRole("tab", { name: /Control t/i }));

    expect(await screen.findByText("Workspace & LLM Runtime")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Feature flags/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByRole("heading", { name: /Precios Base \(USD\)/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Administracion de plataforma")).not.toBeInTheDocument();
  });

  it("renderiza Hotmart embebido dentro de Comercial y costos en Settings", async () => {
    getRuntimeSettingsMock.mockResolvedValue(buildRuntimeSettings("openai", "workspace-a"));
    runtimeApiMock.getWorkspaceRuntimeHealth.mockResolvedValue(buildWorkspaceHealth("workspace-a", "openai"));
    runtimeApiMock.status.mockRejectedValue(buildForbiddenError());
    runtimeApiMock.listPlatformProviders.mockRejectedValue(buildForbiddenError());
    runtimeApiMock.getPlatformDefaults.mockRejectedValue(buildForbiddenError());
    runtimeApiMock.getPlatformAudit.mockRejectedValue(buildForbiddenError());

    renderSettingsPage({
      initialConfigSubTab: "hotmart",
      initialConfigTab: "commerce",
      initialSection: "configuration",
    });

    expect(await screen.findByTestId("hotmart-admin-view")).toHaveTextContent("Hotmart embebido");
    expect(hotmartAdminViewMock).toHaveBeenCalled();
    expect(hotmartAdminViewMock.mock.calls.at(-1)?.[0]).toEqual(
      expect.objectContaining({
        embedded: true,
        listStatus: "ready",
        sessionValue: null,
      }),
    );
    expect(screen.getByRole("tab", { name: "Hotmart" })).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByText("Runtime efectivo del workspace")).not.toBeInTheDocument();
  });

  it("sincroniza la URL canonica al navegar tabs y sub-tabs de Settings", async () => {
    getRuntimeSettingsMock.mockResolvedValue(buildRuntimeSettings("openai", "workspace-a"));
    runtimeApiMock.getWorkspaceRuntimeHealth.mockResolvedValue(buildWorkspaceHealth("workspace-a", "openai"));
    runtimeApiMock.status.mockRejectedValue(buildForbiddenError());
    runtimeApiMock.listPlatformProviders.mockRejectedValue(buildForbiddenError());
    runtimeApiMock.getPlatformDefaults.mockRejectedValue(buildForbiddenError());
    runtimeApiMock.getPlatformAudit.mockRejectedValue(buildForbiddenError());

    renderSettingsPage();

    fireEvent.click(screen.getByRole("button", { name: /Configuraci.n/i }));
    expect(replaceMock).toHaveBeenLastCalledWith("/settings?section=configuration&config=llmRuntime&subtab=runtime", { scroll: false });

    fireEvent.click(await screen.findByRole("tab", { name: /Seguridad/i }));
    expect(replaceMock).toHaveBeenLastCalledWith("/settings?section=configuration&config=security&subtab=secrets", { scroll: false });

    fireEvent.click(await screen.findByRole("tab", { name: /Secretos/i }));
    expect(replaceMock).toHaveBeenLastCalledWith("/settings?section=configuration&config=security&subtab=secrets", { scroll: false });
  });

  it("presenta secretos por provider como tabla con filas acordeon", async () => {
    getRuntimeSettingsMock.mockResolvedValue(buildRuntimeSettings("openai", "workspace-a"));
    runtimeApiMock.getWorkspaceRuntimeHealth.mockResolvedValue(buildWorkspaceHealth("workspace-a", "openai"));
    runtimeApiMock.status.mockRejectedValue(buildForbiddenError());
    runtimeApiMock.listPlatformProviders.mockRejectedValue(buildForbiddenError());
    runtimeApiMock.getPlatformDefaults.mockRejectedValue(buildForbiddenError());
    runtimeApiMock.getPlatformAudit.mockRejectedValue(buildForbiddenError());

    renderSettingsPage();

    fireEvent.click(screen.getByRole("button", { name: "Configuración" }));
    fireEvent.click(await screen.findByRole("tab", { name: /Seguridad/ }));

    expect(await screen.findByText("Secretos y aislamiento por provider")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Provider" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Salud" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Aislamiento" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Contraer OpenAI" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Guardar secreto" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Contraer OpenAI" }));

    expect(screen.getByRole("button", { name: "Expandir OpenAI" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: "Guardar secreto" })).not.toBeInTheDocument();
  });

  it("mueve diagnostico tecnico y resumen operativo a una sub-pestana dedicada", async () => {
    getRuntimeSettingsMock.mockResolvedValue(buildRuntimeSettings("openai", "workspace-a"));
    runtimeApiMock.getWorkspaceRuntimeHealth.mockResolvedValue(buildWorkspaceHealth("workspace-a", "openai"));
    runtimeApiMock.status.mockRejectedValue(buildForbiddenError());
    runtimeApiMock.listPlatformProviders.mockRejectedValue(buildForbiddenError());
    runtimeApiMock.getPlatformDefaults.mockRejectedValue(buildForbiddenError());
    runtimeApiMock.getPlatformAudit.mockRejectedValue(buildForbiddenError());

    renderSettingsPage();

    fireEvent.click(screen.getByRole("button", { name: "Configuración" }));

    expect(await screen.findByText("Runtime efectivo del workspace")).toBeInTheDocument();
    expect(screen.queryByText("Diagnostico tecnico")).not.toBeInTheDocument();
    expect(screen.queryByText("Resumen operativo")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Diagnóstico" }));

    expect(await screen.findByText("Diagnostico tecnico")).toBeInTheDocument();
    expect(screen.getByText("Resumen operativo")).toBeInTheDocument();
    expect(screen.queryByText("Runtime efectivo del workspace")).not.toBeInTheDocument();
  });

  it("presenta controles por sesion como tarjeta colapsable", async () => {
    getRuntimeSettingsMock.mockResolvedValue(buildRuntimeSettings("openai", "workspace-a"));
    runtimeApiMock.getWorkspaceRuntimeHealth.mockResolvedValue(buildWorkspaceHealth("workspace-a", "openai"));
    runtimeApiMock.status.mockRejectedValue(buildForbiddenError());
    runtimeApiMock.listPlatformProviders.mockRejectedValue(buildForbiddenError());
    runtimeApiMock.getPlatformDefaults.mockRejectedValue(buildForbiddenError());
    runtimeApiMock.getPlatformAudit.mockRejectedValue(buildForbiddenError());

    renderSettingsPage({
      initialConfigSubTab: "backends",
      initialConfigTab: "llmRuntime",
      initialSection: "configuration",
    });

    expect(await screen.findByText("Controles por sesion")).toBeInTheDocument();
    expect(screen.getByText("Sin sesion")).toBeInTheDocument();
    expect(screen.getByText("0/0 feature flags")).toBeInTheDocument();

    const expandButton = screen.getByRole("button", { name: "Expandir controles por sesion" });
    expect(expandButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByTestId("operations-session-select")).not.toBeInTheDocument();

    fireEvent.click(expandButton);

    expect(screen.getByRole("button", { name: "Contraer controles por sesion" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("operations-session-select")).toBeInTheDocument();
    expect(screen.getByText("Selecciona una sesion")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Contraer controles por sesion" }));

    expect(screen.getByRole("button", { name: "Expandir controles por sesion" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByTestId("operations-session-select")).not.toBeInTheDocument();
  });

  it("mantiene a un usuario final en cuenta y acceso y protege la administracion tecnica", async () => {
    authStateRef.current = authStateRef.current
      ? {
          ...authStateRef.current,
          user: authStateRef.current.user
            ? {
                ...authStateRef.current.user,
                workspaces: authStateRef.current.user.workspaces.map((workspace) =>
                  workspace.workspace_id === "workspace-a" ? { ...workspace, role: "viewer" } : workspace,
                ),
              }
            : null,
        }
      : null;
    getRuntimeSettingsMock.mockResolvedValue(buildRuntimeSettings("openai", "workspace-a"));
    runtimeApiMock.getWorkspaceRuntimeHealth.mockRejectedValue(buildForbiddenError());
    runtimeApiMock.status.mockRejectedValue(buildForbiddenError());
    runtimeApiMock.listPlatformProviders.mockRejectedValue(buildForbiddenError());
    runtimeApiMock.getPlatformDefaults.mockRejectedValue(buildForbiddenError());
    runtimeApiMock.getPlatformAudit.mockRejectedValue(buildForbiddenError());

    renderSettingsPage();

    expect(await screen.findByRole("heading", { name: "Cuenta y acceso" })).toBeInTheDocument();
    expect(screen.queryByText("Runtime efectivo del workspace")).not.toBeInTheDocument();

    const runtimeTab = screen.getByRole("tab", { name: /LLM runtime/i });
    fireEvent.click(runtimeTab);
    expect(await screen.findByText(/Se requiere una membres[ií]a owner o admin/i)).toBeInTheDocument();
    expect(screen.queryByLabelText("Provider activo")).not.toBeInTheDocument();
  });

  it("administra usuarios reales con tabla acordeon, cambio de rol e invitaciones", async () => {
    getRuntimeSettingsMock.mockResolvedValue(buildRuntimeSettings("openai", "workspace-a"));
    runtimeApiMock.getWorkspaceRuntimeHealth.mockResolvedValue(buildWorkspaceHealth("workspace-a", "openai"));
    runtimeApiMock.status.mockRejectedValue(buildForbiddenError());
    runtimeApiMock.listPlatformProviders.mockRejectedValue(buildForbiddenError());
    runtimeApiMock.getPlatformDefaults.mockRejectedValue(buildForbiddenError());
    runtimeApiMock.getPlatformAudit.mockRejectedValue(buildForbiddenError());

    renderSettingsPage();

    fireEvent.click(screen.getByRole("button", { name: "Usuarios" }));

    expect(await screen.findByText("Directorio de usuarios")).toBeInTheDocument();
    await waitFor(() => {
      expect(adminConsoleApiMock.listUsers).toHaveBeenCalledWith({ limit: 100, status: "all" });
      expect(adminConsoleApiMock.listInvitations).toHaveBeenCalledWith({ limit: 50, status: "pending" });
      expect(adminConsoleApiMock.getRoles).toHaveBeenCalled();
    });
    expect(screen.getByText("Product Editor")).toBeInTheDocument();
    expect(screen.getByText("pending@leanbuilder.local")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("persona@empresa.com"), {
      target: { value: "nuevo@leanbuilder.local" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crear invitacion" }));

    await waitFor(() => {
      expect(adminConsoleApiMock.createInvitation).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "nuevo@leanbuilder.local",
          metadata: { source: "settings_admin_console" },
          role: "viewer",
        }),
      );
    });

    expect(await screen.findByText("Directorio de usuarios")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Expandir Product Editor/i }));
    fireEvent.click(screen.getByRole("button", { name: "Asignar Admin" }));

    await waitFor(() => {
      expect(adminConsoleApiMock.updateUser).toHaveBeenCalledWith("user-2", { membership_role: "admin" });
    });
  });

  it("muestra el catalogo real de roles y permisos desde backend", async () => {
    getRuntimeSettingsMock.mockResolvedValue(buildRuntimeSettings("openai", "workspace-a"));
    runtimeApiMock.getWorkspaceRuntimeHealth.mockResolvedValue(buildWorkspaceHealth("workspace-a", "openai"));
    runtimeApiMock.status.mockRejectedValue(buildForbiddenError());
    runtimeApiMock.listPlatformProviders.mockRejectedValue(buildForbiddenError());
    runtimeApiMock.getPlatformDefaults.mockRejectedValue(buildForbiddenError());
    runtimeApiMock.getPlatformAudit.mockRejectedValue(buildForbiddenError());

    renderSettingsPage();

    fireEvent.click(screen.getByRole("button", { name: "Roles y permisos" }));

    expect(await screen.findByText("Roles de workspace")).toBeInTheDocument();
    await waitFor(() => {
      expect(adminConsoleApiMock.getRoles).toHaveBeenCalled();
    });
    expect(screen.getByText("workspace.users.manage")).toBeInTheDocument();
    expect(screen.getAllByText("Platform admin").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/platform\.runtime\.manage/).length).toBeGreaterThan(0);
  });
});
