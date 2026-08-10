import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ApiError } from "@/core/api";
import { SettingsWorkspacePage } from "@/features/operations/settings-page";
import type {
  LLMRuntimeSettings,
  PlatformRuntimeProviderResponse,
  WorkspaceRuntimeHealthResponse,
} from "@/features/sessions/session-contracts";

const {
  authStateRef,
  createSessionMock,
  getEstimationCalibrationMock,
  getRuntimeSettingsMock,
  patchFeatureFlagMock,
  patchRuntimeSettingsMock,
  runtimeApiMock,
  selectOperationalSessionMock,
} = vi.hoisted(() => ({
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
  getRuntimeSettingsMock: vi.fn(),
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
  }),
}));

vi.mock("@/core/system/runtime-api", () => ({
  runtimeApi: runtimeApiMock,
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

function getProviderSummaryText() {
  const label = screen.getByText("Provider efectivo");
  const container = label.parentElement;
  return container?.textContent ?? "";
}

describe("SettingsWorkspacePage", () => {
  beforeEach(() => {
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

    const view = render(<SettingsWorkspacePage />);

    expect(await screen.findByText("Runtime efectivo del workspace")).toBeInTheDocument();
    await waitFor(() => {
      expect(getProviderSummaryText()).toContain("openai");
    });
    expect(screen.getByRole("tab", { name: /Plataforma/i })).toBeDisabled();

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

    view.rerender(<SettingsWorkspacePage />);

    expect(await screen.findByText("Runtime efectivo del workspace")).toBeInTheDocument();
    await waitFor(() => {
      expect(getProviderSummaryText()).toContain("deepseek");
    });
    expect(getRuntimeSettingsMock).toHaveBeenCalledTimes(2);
    expect(runtimeApiMock.getWorkspaceRuntimeHealth).toHaveBeenCalledTimes(2);
  });

  it("muestra el panel de plataforma cuando el runtime global esta habilitado para platform admin", async () => {
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

    render(<SettingsWorkspacePage />);

    const platformTab = await screen.findByRole("tab", { name: /Plataforma/i });
    await waitFor(() => expect(platformTab).toBeEnabled());
    fireEvent.click(platformTab);

    expect(await screen.findByText("Administracion de plataforma")).toBeInTheDocument();
    expect(screen.getByText(/defaults SaaS, disponibilidad de providers y trazabilidad global/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Provider default")).toHaveValue("openai");
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

    render(<SettingsWorkspacePage />);

    expect(await screen.findByRole("heading", { name: "Cuenta y acceso" })).toBeInTheDocument();
    expect(screen.queryByText("Runtime efectivo del workspace")).not.toBeInTheDocument();

    const accountTab = screen.getByRole("tab", { name: /Cuenta y acceso/i });
    const workspaceTab = screen.getByRole("tab", { name: /Workspace/i });
    accountTab.focus();
    fireEvent.keyDown(accountTab, { key: "ArrowRight" });
    await waitFor(() => expect(workspaceTab).toHaveAttribute("aria-selected", "true"));
    expect(await screen.findByText(/Se requiere una membresia owner o admin/i)).toBeInTheDocument();
    expect(screen.queryByLabelText("Provider activo")).not.toBeInTheDocument();
  });
});
