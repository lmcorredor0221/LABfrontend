import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { vi } from "vitest";
import { UxaButton } from "@/features/product-experience/design-system";
import { ProjectWorkspaceShell } from "@/features/product-experience/shell/project-workspace-shell";
import type {
  ProductExperienceRouteSnapshot,
  ProductExperienceStageOperation,
} from "@/features/product-experience/core/server-state";
import type { AttentionResponseV2 } from "@/features/attention/attention-contracts";
import { createMutationOperationEnvelope } from "@/features/product-experience/operations/operation-model";
import type { SessionSnapshot } from "@/features/sessions/types";

vi.mock("next/navigation", () => ({
  usePathname: () => "/projects/session-uxa5/work/design",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

vi.mock("@/core/i18n/language-context", () => ({
  useLanguage: () => ({
    language: "es",
    languages: [
      { code: "es", flag: "ES", label: "Espanol" },
      { code: "en", flag: "EN", label: "English" },
      { code: "pt", flag: "PT", label: "Portugues" },
    ],
    setLanguage: vi.fn(),
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}));

vi.mock("@/core/auth/auth-context", () => ({
  useAuth: () => ({
    logout: vi.fn(),
    user: {
      active_workspace_id: "workspace-1",
      active_workspace_name: "Lean Builder",
      email: "admin@example.com",
      full_name: "Admin UXA",
      id: "user-1",
      workspaces: [],
    },
  }),
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

function createSnapshot(): SessionSnapshot {
  return {
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
    session: {
      commercial_tier: "blueprint",
      created_at: "2026-08-03T10:00:00Z",
      current_stage: "build_blueprint",
      id: "session-uxa5",
      status: "ready",
      title: "Proyecto UXA5",
      updated_at: "2026-08-03T10:10:00Z",
      workspace_id: "workspace-1",
    },
    skill_catalog: [],
    skill_runs: [],
    subagent_runs: [],
    simulation_runs: [],
    validations: [],
    workflow_templates: [],
    workspace_contract: {
      catalogs: [],
      contract_version: "workspace-contract.v1",
      feature_flags: [
        {
          description: "UXA shell",
          enabled: true,
          key: "product_experience_v2",
          stage_hint: "workspace",
        },
      ],
      sections: [],
    },
  };
}

function createAttention(): AttentionResponseV2 {
  return {
    actionable_count: 1,
    blocking_count: 0,
    contract_version: "attention.v2",
    counts_by_product: { blueprint: 1 },
    counts_by_stage: { design: 1 },
    counts_by_type: { question: 1 },
    current_stage: "design",
    cursor: "",
    generated_at: "2026-08-03T10:11:00Z",
    info_count: 1,
    items: [],
    primary_item: null,
    session_id: "session-uxa5",
    total_count: 1,
    warning_count: 0,
    workspace_id: "workspace-1",
  };
}

function createStageOperation(overrides: Partial<ProductExperienceStageOperation> = {}): ProductExperienceStageOperation {
  return {
    action: "propose_design",
    attempt_count: 1,
    can_cancel: true,
    can_retry: false,
    cancel_requested_at: null,
    cancel_url: "/api/v1/sessions/session-uxa5/stage-operations/operation-1/cancel",
    completed_at: null,
    created_at: "2026-08-16T10:00:00Z",
    current_step: "proposal",
    detail: "Generando propuesta de arquitectura.",
    error_message: "",
    expires_at: "2026-08-16T10:30:00Z",
    heartbeat_at: "2026-08-16T10:00:00Z",
    id: "operation-1",
    idempotency_key: "design-once",
    is_stale: false,
    recover_url: "/api/v1/sessions/session-uxa5/stage-operations/operation-1/recover",
    result: null,
    result_artifact_id: null,
    retry_url: "",
    session_id: "session-uxa5",
    stage_key: "design",
    status: "running",
    steps: [
      { detail: "", key: "queued", label: "Solicitud recibida", status: "completed" },
      { detail: "", key: "proposal", label: "Propuesta de arquitectura", status: "active" },
      { detail: "", key: "persist", label: "Publicacion del artefacto", status: "pending" },
    ],
    technical_detail: "",
    updated_at: "2026-08-16T10:00:00Z",
    workspace_id: "workspace-1",
    ...overrides,
  };
}

function createRoute(): ProductExperienceRouteSnapshot {
  return {
    attention: resource(createAttention()),
    auth: resource({
      active_workspace_id: "workspace-1",
      active_workspace_name: "Lean Builder",
      email: "admin@example.com",
      full_name: "Admin UXA",
      id: "user-1",
      workspaces: [],
    }),
    list: resource({ items: [createSnapshot().session] }),
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
    snapshot: resource(createSnapshot()),
  };
}

function renderWithLanguage(ui: ReactElement) {
  return render(ui);
}

function getLinkByHref(href: string) {
  const link = screen.getAllByRole("link").find((candidate) => candidate.getAttribute("href") === href);
  if (!link) {
    throw new Error(`Expected product navigation link with href: ${href}`);
  }
  return link;
}

describe("ProjectWorkspaceShell UXA5", () => {
  it("renders a single h1, a single stage rail and a single primary CTA for stage routes", () => {
    const route = createRoute();
    const { container } = renderWithLanguage(
      <ProjectWorkspaceShell activeProduct="work" activeRoute={route} activeStage="design" sessionId="session-uxa5">
        <section aria-label="Contenido de etapa"><UxaButton>Continuar</UxaButton></section>
      </ProjectWorkspaceShell>,
    );

    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(screen.getAllByRole("navigation", { name: "Ruta LEAN" })).toHaveLength(1);
    expect(container.querySelectorAll(".uxa-button--primary")).toHaveLength(1);
    expect(screen.queryByLabelText("Recursos del proyecto")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Abrir Segmento de Atencion/ })).toHaveLength(2);
    expect(getLinkByHref("/projects/session-uxa5/blueprint/pro")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Validar/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Package/ })).not.toBeInTheDocument();
  });

  it("keeps product routes accessible in the new product navigation", () => {
    const route = createRoute();
    renderWithLanguage(
      <ProjectWorkspaceShell activeProduct="diagrams" activeRoute={route} activeStage="estimate" sessionId="session-uxa5">
        <section aria-label="Contenido de Diagramas" />
      </ProjectWorkspaceShell>,
    );

    expect(screen.getByRole("link", { name: /Diagramas/ })).toHaveAttribute(
      "href",
      "/projects/session-uxa5/diagrams",
    );
    expect(screen.queryByRole("link", { name: /Resumen Blueprint/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Resumen Pro/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Resumen ACP/ })).not.toBeInTheDocument();
    expect(getLinkByHref("/projects/session-uxa5/acp")).toBeInTheDocument();
  });

  it("shows persistent processing feedback for active backend or LLM operations", () => {
    const route = createRoute();
    const operation = createMutationOperationEnvelope({
      action: "define_requirements",
      message: "Generando Definir con LLM.",
      sessionId: "session-uxa5",
      stage: "define",
    });

    renderWithLanguage(
      <ProjectWorkspaceShell
        activeProduct="work"
        activeRoute={route}
        activeStage="define"
        operationAction={{
          action: "define_requirements",
          message: "Generando Definir con LLM.",
          operation,
          status: "submitting",
        }}
        sessionId="session-uxa5"
      >
        <section aria-label="Contenido de etapa"><UxaButton>Continuar</UxaButton></section>
      </ProjectWorkspaceShell>,
    );

    expect(screen.getAllByText("Generando Definir con LLM.").length).toBeGreaterThan(0);
    expect(screen.getByText("Backend/LLM")).toBeInTheDocument();
    expect(screen.getByText(/El proceso continua aunque aun no existan nuevos resultados visibles/)).toBeInTheDocument();
  });

  it("renders server stage operations with real cancel and retry controls", () => {
    const onCancelOperation = vi.fn();
    const onRetryOperation = vi.fn();
    const route = createRoute();
    route.operation.data!.stageOperation = createStageOperation();

    const { rerender } = renderWithLanguage(
      <ProjectWorkspaceShell
        activeProduct="work"
        activeRoute={route}
        activeStage="design"
        onCancelOperation={onCancelOperation}
        onRetryOperation={onRetryOperation}
        sessionId="session-uxa5"
      >
        <section aria-label="Contenido de etapa"><UxaButton>Continuar</UxaButton></section>
      </ProjectWorkspaceShell>,
    );

    expect(screen.getByText("Generando propuesta de arquitectura.")).toBeInTheDocument();
    expect(screen.getAllByText("Propuesta de arquitectura").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancelOperation).toHaveBeenCalledWith("operation-1");

    route.operation.data!.stageOperation = createStageOperation({
      can_cancel: false,
      can_retry: true,
      error_message: "Stage operation heartbeat expired before completion.",
      retry_url: "/api/v1/sessions/session-uxa5/stage-operations/operation-1/retry",
      status: "failed",
      technical_detail: "stage_operation_stale",
    });

    rerender(
      <ProjectWorkspaceShell
        activeProduct="work"
        activeRoute={route}
        activeStage="design"
        onCancelOperation={onCancelOperation}
        onRetryOperation={onRetryOperation}
        sessionId="session-uxa5"
      >
        <section aria-label="Contenido de etapa"><UxaButton>Continuar</UxaButton></section>
      </ProjectWorkspaceShell>,
    );

    expect(screen.getByText("Stage operation heartbeat expired before completion.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onRetryOperation).toHaveBeenCalledWith("operation-1");
  });
});
