import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { LanguageProvider } from "@/core/i18n/language-context";
import { DiscoverStageView } from "@/features/product-experience/discover/discover-stage-view";
import type { ProductExperienceStageOperation } from "@/features/product-experience/core/server-state";
import {
  createAnalysisFixture,
  createDiscoverArtifactFixture,
  createDiscoverRouteFixture,
  createDiscoveryFixture,
} from "@/features/product-experience/discover/discover-test-fixtures";
import type { ProductDiscoveryActions } from "@/features/product-experience/shell/use-product-experience-route";
import { operationFromStageOperationRecord } from "@/features/product-experience/operations/operation-model";
import type { DiscoveryEnvelope } from "@/features/sessions/session-contracts";

const mockRouterPush = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

function createStageOperation(overrides: Partial<ProductExperienceStageOperation> = {}): ProductExperienceStageOperation {
  return {
    action: "analyze_discovery",
    attempt_count: 1,
    can_cancel: true,
    can_retry: false,
    cancel_requested_at: null,
    cancel_url: "/api/v1/sessions/session-uxa7/stage-operations/operation-discover/cancel",
    completed_at: null,
    created_at: "2026-08-16T10:00:00Z",
    current_step: "queued",
    detail: "Discover se normalizara y analizara en segundo plano.",
    error_message: "",
    expires_at: "2099-08-16T10:30:00Z",
    heartbeat_at: "2026-08-16T10:00:00Z",
    id: "operation-discover",
    idempotency_key: "discover-once",
    is_stale: false,
    recover_url: "/api/v1/sessions/session-uxa7/stage-operations/operation-discover/recover",
    result: null,
    result_artifact_id: null,
    retry_url: "",
    session_id: "session-uxa7",
    stage_key: "discover",
    status: "queued",
    steps: [],
    technical_detail: "",
    updated_at: "2026-08-16T10:00:00Z",
    workspace_id: "workspace-1",
    ...overrides,
  };
}

function createActions(): ProductDiscoveryActions {
  const discovery = createDiscoveryFixture();
  const artifact = createDiscoverArtifactFixture();
  const envelope: DiscoveryEnvelope = {
    assumptions: [],
    data: discovery,
    evidence: [],
    missing_fields: [],
    next_action: "analyze_discovery",
    stage: "normalize_discovery",
    status: "ready",
    warnings: [],
  };

  return {
    analyzeDiscovery: vi.fn(async () => createStageOperation()),
    approveDiscoverArtifact: vi.fn(async () => createDiscoverArtifactFixture({ state: "approved" })),
    normalizeDiscovery: vi.fn(async () => envelope),
    patchDiscoverArtifact: vi.fn(async () => artifact),
    rejectDiscoverArtifact: vi.fn(async () => createDiscoverArtifactFixture({ state: "rejected" })),
  };
}

function renderWithLanguage(ui: ReactElement) {
  return render(<LanguageProvider>{ui}</LanguageProvider>);
}

describe("DiscoverStageView UXA7", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the new Discover workbench and starts persistent LLM analysis", async () => {
    const actions = createActions();
    renderWithLanguage(
      <DiscoverStageView
        actionState={{ status: "idle" }}
        actions={actions}
        activeRoute={createDiscoverRouteFixture({ artifact: null })}
      />,
    );

    expect(screen.getByRole("heading", { name: /Descubrir: problema y contexto/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Brief libre")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Guardar y analizar" }));

    await waitFor(() => expect(actions.analyzeDiscovery).toHaveBeenCalledTimes(1));
    expect(actions.normalizeDiscovery).not.toHaveBeenCalled();
    expect(actions.analyzeDiscovery).toHaveBeenCalledWith(expect.objectContaining({
      problem_statement: expect.stringContaining("soporte recibe solicitudes repetitivas"),
    }));
  });

  it("extracts a guided brief into the editable card and saves a partial draft without analysis", async () => {
    const actions = createActions();
    renderWithLanguage(
      <DiscoverStageView
        actionState={{ status: "idle" }}
        actions={actions}
        activeRoute={createDiscoverRouteFixture({ artifact: null, discovery: null })}
      />,
    );

    fireEvent.change(screen.getByLabelText("Brief libre"), {
      target: {
        value:
          "Hoy el equipo de ventas registra leads manualmente y pierde seguimiento. Quiero automatizar recordatorios y clasificacion para mejorar conversion.",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Convertir en ficha" }));
    fireEvent.click(screen.getByText("Revisar detalles"));

    expect((screen.getByLabelText("Descripcion del problema") as HTMLTextAreaElement).value).toContain("equipo de ventas");
    expect((screen.getByLabelText("Resultado deseado") as HTMLTextAreaElement).value).toContain("automatizar");

    fireEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));

    await waitFor(() => expect(actions.normalizeDiscovery).toHaveBeenCalledTimes(1));
    expect(actions.analyzeDiscovery).not.toHaveBeenCalled();
    expect(actions.normalizeDiscovery).toHaveBeenCalledWith(expect.objectContaining({
      problem_statement: expect.stringContaining("equipo de ventas"),
    }));
  });

  it("keeps analysis validation strict while guided draft saving stays lightweight", async () => {
    const actions = createActions();
    renderWithLanguage(
      <DiscoverStageView
        actionState={{ status: "idle" }}
        actions={actions}
        activeRoute={createDiscoverRouteFixture({ artifact: null, discovery: null })}
      />,
    );

    fireEvent.change(screen.getByLabelText("Brief libre"), {
      target: { value: "Quiero automatizar seguimiento de ventas." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Convertir en ficha" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar y analizar" }));

    await waitFor(() => expect(screen.getAllByText("Completa los campos obligatorios antes de continuar.").length).toBeGreaterThan(0));
    expect(actions.analyzeDiscovery).not.toHaveBeenCalled();
  });

  it("can switch from guided capture to the advanced form for bulk editing", () => {
    const actions = createActions();
    renderWithLanguage(
      <DiscoverStageView
        actionState={{ status: "idle" }}
        actions={actions}
        activeRoute={createDiscoverRouteFixture({ artifact: null })}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Abrir formulario avanzado" }));

    expect(screen.getByText("2. Impacto operativo")).toBeInTheDocument();
    expect(screen.getByLabelText("Tiempo actual invertido")).toBeInTheDocument();
  });

  it("disables save and analyze while the persistent analysis starts", async () => {
    const pending = new Promise<ProductExperienceStageOperation>(() => undefined);
    const actions = createActions();
    actions.analyzeDiscovery = vi.fn(() => pending);
    renderWithLanguage(
      <DiscoverStageView
        actionState={{ status: "idle" }}
        actions={actions}
        activeRoute={createDiscoverRouteFixture({ artifact: null })}
      />,
    );

    const submitButton = screen.getByRole("button", { name: "Guardar y analizar" });
    fireEvent.click(submitButton);

    await waitFor(() => expect(submitButton).toBeDisabled());
    fireEvent.click(submitButton);
    expect(actions.analyzeDiscovery).toHaveBeenCalledTimes(1);
  });

  it("keeps save and analyze disabled while the backend operation remains active", () => {
    const actions = createActions();
    renderWithLanguage(
      <DiscoverStageView
        actionState={{
          message: "Discover se esta procesando en backend.",
          operation: operationFromStageOperationRecord(createStageOperation()),
          status: "success",
        }}
        actions={actions}
        activeRoute={createDiscoverRouteFixture({ artifact: null })}
      />,
    );

    expect(screen.getByRole("button", { name: "Guardar y analizar" })).toBeDisabled();
  });

  it("approves generated analysis and navigates to Define", async () => {
    const actions = createActions();
    renderWithLanguage(
      <DiscoverStageView
        actionState={{ status: "idle" }}
        actions={actions}
        activeRoute={createDiscoverRouteFixture({ artifact: createDiscoverArtifactFixture({ proposal_payload: createAnalysisFixture() as unknown as Record<string, unknown> }) })}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Aprobar Discover" }));

    await waitFor(() => expect(actions.approveDiscoverArtifact).toHaveBeenCalledTimes(1));
    expect(mockRouterPush).toHaveBeenCalledWith("/projects/session-uxa7/work/define");
  });

  it("keeps traceable pending items while hiding generated deliverable metric cards", async () => {
    const actions = createActions();
    renderWithLanguage(
      <DiscoverStageView
        actionState={{ status: "idle" }}
        actions={actions}
        activeRoute={createDiscoverRouteFixture()}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: /Entrega generada/i }));

    expect(await screen.findByText("Entrega de Descubrir")).toBeInTheDocument();
    expect(screen.queryByText("Calidad")).not.toBeInTheDocument();
    expect(screen.queryByText("Pendientes delegados")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /Evidencia y trazabilidad/i }));
    expect(await screen.findByText(/Aclaraciones diferidas con trazabilidad/i)).toBeInTheDocument();
    expect(screen.getByText(/Definir el grupo de usuarios prioritario para la primera version/i)).toBeInTheDocument();
  });

  it("records review decisions and can reject the generated proposal", async () => {
    const actions = createActions();
    renderWithLanguage(
      <DiscoverStageView
        actionState={{ status: "idle" }}
        actions={actions}
        activeRoute={createDiscoverRouteFixture()}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: /Evidencia y trazabilidad/i }));
    fireEvent.click(screen.getByRole("button", { name: "Aceptar pendiente" }));

    await waitFor(() => expect(actions.patchDiscoverArtifact).toHaveBeenCalledTimes(1));
    expect(actions.patchDiscoverArtifact).toHaveBeenCalledWith("discover-artifact-1", expect.objectContaining({
      note: "review_decision:question:q1",
    }));

    const rejectButton = await screen.findByRole("button", { name: "Rechazar propuesta" });
    await waitFor(() => expect(rejectButton).not.toBeDisabled());
    fireEvent.click(rejectButton);

    await waitFor(() => expect(actions.rejectDiscoverArtifact).toHaveBeenCalledTimes(1));
  });
});
