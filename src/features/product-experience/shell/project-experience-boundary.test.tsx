import { render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { LanguageProvider } from "@/core/i18n/language-context";
import { ProjectExperienceBoundary } from "@/features/product-experience/shell/project-experience-boundary";
import type { ProductExperienceRouteSnapshot } from "@/features/product-experience/core/server-state";

const mockRouterPush = vi.hoisted(() => vi.fn());
const mockUsePathname = vi.hoisted(() => vi.fn(() => "/projects/session-uxa5/work/design"));
const mockUseSearchParams = vi.hoisted(() => vi.fn(() => new URLSearchParams()));
const mockUseProductExperienceRoute = vi.hoisted(() => vi.fn());
const mockSelectWorkspace = vi.hoisted(() => vi.fn());
const mockAuthUser = vi.hoisted(() => ({
  active_workspace_id: "workspace-1",
  active_workspace_name: "Lean Builder",
  email: "admin@example.com",
  full_name: "Admin UXA",
  id: "user-1",
  workspaces: [],
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({
    push: mockRouterPush,
  }),
  useSearchParams: () => mockUseSearchParams(),
}));

vi.mock("@/core/auth/auth-context", () => ({
  useAuth: () => ({
    logout: vi.fn(),
    selectWorkspace: mockSelectWorkspace,
    user: mockAuthUser,
  }),
}));

vi.mock("@/features/product-experience/shell/use-product-experience-route", () => ({
  useProductExperienceRoute: mockUseProductExperienceRoute,
}));

function resource<T>(data: T) {
  return {
    data,
    error: null,
    requestKey: "test",
    status: "ready" as const,
    updatedAt: Date.now(),
    version: "v1",
  };
}

function renderWithLanguage(ui: ReactElement) {
  return render(<LanguageProvider>{ui}</LanguageProvider>);
}

function createRoute(flagEnabled: boolean | "missing", sessionWorkspaceId = "workspace-1"): ProductExperienceRouteSnapshot {
  const session = {
    commercial_tier: "blueprint" as const,
    created_at: "2026-08-03T10:00:00Z",
    current_stage: "build_blueprint" as const,
    id: "session-uxa5",
    status: "ready" as const,
    title: "Proyecto UXA5",
    updated_at: "2026-08-03T10:10:00Z",
    workspace_id: sessionWorkspaceId,
  };

  return {
    attention: resource({
      actionable_count: 0,
      blocking_count: 0,
      contract_version: "attention.v2",
      counts_by_product: {},
      counts_by_stage: {},
      counts_by_type: {},
      current_stage: "design",
      cursor: "",
      generated_at: "2026-08-03T10:11:00Z",
      info_count: 0,
      items: [],
      primary_item: null,
      session_id: "session-uxa5",
      total_count: 0,
      warning_count: 0,
      workspace_id: "workspace-1",
    }),
    auth: resource({
      active_workspace_id: "workspace-1",
      active_workspace_name: "Lean Builder",
      email: "admin@example.com",
      full_name: "Admin UXA",
      id: "user-1",
      workspaces: [],
    }),
    list: resource({ items: [session] }),
    operation: resource({
      activity: {
        contract_version: "activity.v1",
        funnel: [],
        generated_at: "2026-08-03T10:12:00Z",
        metrics: [],
        session_id: "session-uxa5",
        timeline: [],
        workspace_id: "workspace-1",
      },
      overview: {
        access: {} as never,
        active_stage: "design",
        attention: [],
        contract_version: "product-overview.v1",
        exports: [],
        generated_at: "2026-08-03T10:12:00Z",
        lean_progress_percent: 52,
        navigation: [],
        products: [],
        project_title: "Proyecto UXA5",
        session_id: "session-uxa5",
        workspace_id: "workspace-1",
      },
      stageOperation: null,
    }),
    requestId: 1,
    route: {
      currentStage: "design",
      sessionId: "session-uxa5",
    },
    snapshot: resource({
      activity: [],
      alert_events: [],
      approvals: [],
      artifact_records: [],
      blueprint: null,
      blueprint_versions: [],
      canvas: null,
      contract_version: "session-snapshot.v1",
      discovery: null,
      estimation_error_metrics: [],
      estimation_report: null,
      estimation_runs: [],
      evaluation: null,
      evaluation_dataset: null,
      evaluation_rubric: null,
      evaluation_runs: [],
      governance_policies: [],
      handoff_records: [],
      integration_statuses: [],
      journey_artifacts: [],
      metric_snapshots: [],
      project_actuals: [],
      session,
      skill_catalog: [],
      skill_runs: [],
      subagent_runs: [],
      simulation_runs: [],
      validations: [],
      workflow_templates: [],
      workspace_contract: {
        catalogs: [],
        contract_version: "workspace-contract.v1",
        feature_flags:
          flagEnabled === "missing"
            ? []
            : [
                {
                  description: "UXA shell",
                  enabled: flagEnabled,
                  key: "product_experience_v2",
                  stage_hint: "workspace",
                },
              ],
        sections: [],
      },
    }),
  } as ProductExperienceRouteSnapshot;
}

describe("ProjectExperienceBoundary UXA5", () => {
  beforeEach(() => {
    mockAuthUser.active_workspace_id = "workspace-1";
    mockAuthUser.active_workspace_name = "Lean Builder";
    mockAuthUser.workspaces = [];
    mockSelectWorkspace.mockReset();
    mockUseProductExperienceRoute.mockReturnValue({
      attentionAction: null,
      discoverAction: null,
      discoverActions: {},
      loadError: null,
      operationControls: {
        cancelOperation: vi.fn(),
        retryOperation: vi.fn(),
      },
      reload: vi.fn(),
      resolveAttentionItem: vi.fn(),
      stageAction: null,
      stageActions: {},
      state: {
        active: createRoute(true),
        history: [],
      },
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue("/projects/session-uxa5/work/design");
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("renders the new shell even when the deprecated env gate is off", () => {
    vi.stubEnv("NEXT_PUBLIC_PRODUCT_EXPERIENCE_V2_GATE", "false");

    renderWithLanguage(<ProjectExperienceBoundary sessionId="session-uxa5" stage="design" />);

    expect(mockUseProductExperienceRoute).toHaveBeenCalled();
    expect(screen.getByRole("heading", { level: 1, name: "Proyecto UXA5" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Navegacion de producto" })).toBeInTheDocument();
  });

  it("syncs the active workspace to the project's workspace before rendering the shell", async () => {
    mockUseProductExperienceRoute.mockReturnValue({
      attentionAction: null,
      discoverAction: null,
      discoverActions: {},
      loadError: null,
      operationControls: {
        cancelOperation: vi.fn(),
        retryOperation: vi.fn(),
      },
      reload: vi.fn(),
      resolveAttentionItem: vi.fn(),
      stageAction: null,
      stageActions: {},
      state: {
        active: createRoute(true, "workspace-2"),
        history: [],
      },
    });

    renderWithLanguage(<ProjectExperienceBoundary sessionId="session-uxa5" stage="design" />);

    expect(screen.getByRole("heading", { level: 2, name: "Sincronizando contexto del proyecto" })).toBeInTheDocument();
    await waitFor(() => expect(mockSelectWorkspace).toHaveBeenCalledWith("workspace-2"));
  });

  it("ignores the deprecated workspace selector and keeps the new shell", () => {
    vi.stubEnv("NEXT_PUBLIC_PRODUCT_EXPERIENCE_V2_GATE", "true");
    mockUseProductExperienceRoute.mockReturnValue({
      attentionAction: null,
      discoverAction: null,
      discoverActions: {},
      loadError: null,
      operationControls: {
        cancelOperation: vi.fn(),
        retryOperation: vi.fn(),
      },
      reload: vi.fn(),
      resolveAttentionItem: vi.fn(),
      stageAction: null,
      stageActions: {},
      state: {
        active: createRoute(false),
        history: [],
      },
    });

    renderWithLanguage(<ProjectExperienceBoundary sessionId="session-uxa5" stage="design" />);

    expect(screen.getByRole("heading", { level: 1, name: "Proyecto UXA5" })).toBeInTheDocument();
  });

  it("does not render the removed legacy workspace when rollback is enabled", () => {
    vi.stubEnv("NEXT_PUBLIC_PRODUCT_EXPERIENCE_V2_GATE", "true");
    vi.stubEnv("NEXT_PUBLIC_PRODUCT_EXPERIENCE_ROLLBACK", "true");

    renderWithLanguage(<ProjectExperienceBoundary sessionId="session-uxa5" stage="design" />);

    expect(screen.getByRole("heading", { level: 1, name: "Proyecto UXA5" })).toBeInTheDocument();
  });

  it("does not leave the workspace outside the frontend cutover cohort", () => {
    vi.stubEnv("NEXT_PUBLIC_PRODUCT_EXPERIENCE_V2_GATE", "true");
    vi.stubEnv("NEXT_PUBLIC_PRODUCT_EXPERIENCE_ROLLOUT_PERCENT", "0");

    renderWithLanguage(<ProjectExperienceBoundary sessionId="session-uxa5" stage="design" />);

    expect(screen.getByRole("heading", { level: 1, name: "Proyecto UXA5" })).toBeInTheDocument();
  });

  it("renders the new shell as the only project experience", () => {
    vi.stubEnv("NEXT_PUBLIC_PRODUCT_EXPERIENCE_V2_GATE", "true");

    renderWithLanguage(<ProjectExperienceBoundary sessionId="session-uxa5" stage="design" />);

    expect(screen.getByRole("heading", { level: 1, name: "Proyecto UXA5" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Navegacion de producto" })).toBeInTheDocument();
  });

  it("renders the new shell when the workspace selector is missing and the integral gate is enabled", () => {
    vi.stubEnv("NEXT_PUBLIC_PRODUCT_EXPERIENCE_V2_GATE", "true");
    mockUseProductExperienceRoute.mockReturnValue({
      attentionAction: null,
      discoverAction: null,
      discoverActions: {},
      loadError: null,
      operationControls: {
        cancelOperation: vi.fn(),
        retryOperation: vi.fn(),
      },
      reload: vi.fn(),
      resolveAttentionItem: vi.fn(),
      stageAction: null,
      stageActions: {},
      state: {
        active: createRoute("missing"),
        history: [],
      },
    });

    renderWithLanguage(<ProjectExperienceBoundary sessionId="session-uxa5" stage="design" />);

    expect(screen.getByRole("heading", { level: 1, name: "Proyecto UXA5" })).toBeInTheDocument();
  });
});
