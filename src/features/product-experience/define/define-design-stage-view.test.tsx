import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { LanguageProvider } from "@/core/i18n/language-context";
import type { ProductExperienceStageOperation } from "@/features/product-experience/core/server-state";
import { DefineStageView } from "@/features/product-experience/define/define-stage-view";
import { DesignStageView } from "@/features/product-experience/design/design-stage-view";
import {
  createDefinitionArtifactPayload,
  createDefineArtifactFixture,
  createDefineRouteFixture,
  createDesignArtifactFixture,
} from "@/features/product-experience/define/define-test-fixtures";
import type { ProductStageActions } from "@/features/product-experience/shell/use-product-experience-route";
import type { CanvasEnvelope } from "@/features/sessions/session-contracts";

const mockRouterPush = vi.hoisted(() => vi.fn());
const mockUsePathname = vi.hoisted(() => vi.fn(() => "/projects/session-uxa8/work/define"));
const mockUseSearchParams = vi.hoisted(() => vi.fn(() => new URLSearchParams()));

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({
    push: mockRouterPush,
  }),
  useSearchParams: () => mockUseSearchParams(),
}));

function createStageOperation(overrides: Partial<ProductExperienceStageOperation> = {}): ProductExperienceStageOperation {
  return {
    action: "propose_design",
    attempt_count: 1,
    can_cancel: true,
    can_retry: false,
    cancel_requested_at: null,
    cancel_url: "/api/v1/sessions/session-uxa8/stage-operations/operation-design/cancel",
    completed_at: null,
    created_at: "2026-08-16T10:00:00Z",
    current_step: "queued",
    detail: "Solicitud recibida.",
    error_message: "",
    expires_at: "2026-08-16T10:30:00Z",
    heartbeat_at: "2026-08-16T10:00:00Z",
    id: "operation-design",
    idempotency_key: "design-once",
    is_stale: false,
    recover_url: "/api/v1/sessions/session-uxa8/stage-operations/operation-design/recover",
    result: null,
    result_artifact_id: null,
    retry_url: "",
    session_id: "session-uxa8",
    stage_key: "design",
    status: "queued",
    steps: [],
    technical_detail: "",
    updated_at: "2026-08-16T10:00:00Z",
    workspace_id: "workspace-1",
    ...overrides,
  };
}

function createActions(): ProductStageActions {
  return {
    approveStageArtifact: vi.fn(async (stageKey) =>
      stageKey === "design"
        ? createDesignArtifactFixture({ state: "approved" })
        : createDefineArtifactFixture({ state: "approved" }),
    ),
    approveMemoryProfile: vi.fn(async () => createDefineRouteFixture().snapshot.data!),
    approveToolsSelection: vi.fn(async () => createDefineRouteFixture().snapshot.data!),
    buildCanvas: vi.fn(async () => ({ status: "ready" } as CanvasEnvelope)),
    defineRequirements: vi.fn(async () => createStageOperation({
      action: "define_requirements",
      id: "operation-define",
      stage_key: "define",
    })),
    generateEstimationReport: vi.fn(async () => createStageOperation({
      action: "generate_estimation_report",
      id: "operation-estimate",
      stage_key: "estimate",
    })),
    prepareBlueprintCommercialResult: vi.fn(async () => createDefineRouteFixture().snapshot.data!),
    patchStageArtifact: vi.fn(async (stageKey) =>
      stageKey === "design" ? createDesignArtifactFixture({ state: "reviewed" }) : createDefineArtifactFixture({ state: "reviewed" }),
    ),
    proposeDesign: vi.fn(async () => createStageOperation()),
    recommendMemory: vi.fn(async () => createStageOperation({
      action: "recommend_memory",
      id: "operation-memory",
      stage_key: "memory",
    })),
    recommendTools: vi.fn(async () => createStageOperation({
      action: "recommend_tools",
      id: "operation-tools",
      stage_key: "tools",
    })),
    rejectStageArtifact: vi.fn(async (stageKey) =>
      stageKey === "design" ? createDesignArtifactFixture({ state: "rejected" }) : createDefineArtifactFixture({ state: "rejected" }),
    ),
  };
}

function renderWithLanguage(ui: ReactElement) {
  return render(<LanguageProvider>{ui}</LanguageProvider>);
}

describe("DefineStageView and DesignStageView UXA8", () => {
  afterEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue("/projects/session-uxa8/work/define");
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("starts Define as a persistent operation that includes Canvas and requirements", async () => {
    const actions = createActions();
    renderWithLanguage(
      <DefineStageView
        actionState={{ status: "idle" }}
        actions={actions}
        activeRoute={createDefineRouteFixture({ defineArtifact: null })}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Generar Definicion/i }));

    await waitFor(() => expect(actions.defineRequirements).toHaveBeenCalledTimes(1));
    expect(actions.buildCanvas).not.toHaveBeenCalled();
  });

  it("approves Define and navigates to Design", async () => {
    const actions = createActions();
    renderWithLanguage(
      <DefineStageView
        actionState={{ status: "idle" }}
        actions={actions}
        activeRoute={createDefineRouteFixture()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Aprobar Definir/i }));

    await waitFor(() => expect(actions.approveStageArtifact).toHaveBeenCalledWith(
      "define",
      "define-artifact-1",
      expect.objectContaining({ note: "uxa8_define_approved" }),
    ));
    expect(actions.patchStageArtifact).toHaveBeenCalledWith(
      "define",
      "define-artifact-1",
      expect.objectContaining({ note: "uxa8_define_pre_approval_review" }),
    );
    expect(mockRouterPush).toHaveBeenCalledWith("/projects/session-uxa8/work/design");
  });

  it("preserves Define section in the URL", () => {
    const actions = createActions();
    renderWithLanguage(
      <DefineStageView
        actionState={{ status: "idle" }}
        actions={actions}
        activeRoute={createDefineRouteFixture()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /NFR/i }));

    expect(mockRouterPush).toHaveBeenCalledWith(
      "/projects/session-uxa8/work/define?uxa_section=nfr",
      { scroll: false },
    );
  });

  it("renders duplicate traceability ids without duplicate React keys", () => {
    const actions = createActions();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const definition = createDefinitionArtifactPayload();
    definition.traceability = [
      definition.traceability[0],
      {
        ...definition.traceability[0],
        requirement_key: "FR-02",
        rationale: "Otra cobertura puede compartir el identificador heredado.",
      },
    ];

    try {
      renderWithLanguage(
        <DefineStageView
          actionState={{ status: "idle" }}
          actions={actions}
          activeRoute={createDefineRouteFixture({
            defineArtifact: createDefineArtifactFixture({
              proposal_payload: definition as unknown as Record<string, unknown>,
            }),
          })}
        />,
      );

      fireEvent.click(screen.getByRole("tab", { name: /Evidencia y trazabilidad/i }));
      expect(screen.getByText("FR-02")).toBeInTheDocument();
      expect(
        consoleError.mock.calls.some((call) =>
          call.some((item) => String(item).includes("Encountered two children with the same key")),
        ),
      ).toBe(false);
    } finally {
      consoleError.mockRestore();
    }
  });

  it("generates Design from approved Define", async () => {
    const actions = createActions();
    renderWithLanguage(
      <DesignStageView
        actionState={{ status: "idle" }}
        actions={actions}
        activeRoute={createDefineRouteFixture({
          defineArtifact: createDefineArtifactFixture({ state: "approved" }),
          designArtifact: null,
          stage: "design",
        })}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Generar Diseno/i }));

    await waitFor(() => expect(actions.proposeDesign).toHaveBeenCalledWith({ instructions: undefined }));
  });

  it("selects and approves a Design alternative before navigating to Tools", async () => {
    mockUsePathname.mockReturnValue("/projects/session-uxa8/work/design");
    const actions = createActions();
    renderWithLanguage(
      <DesignStageView
        actionState={{ status: "idle" }}
        actions={actions}
        activeRoute={createDefineRouteFixture({
          defineArtifact: createDefineArtifactFixture({ state: "approved" }),
          designArtifact: createDesignArtifactFixture(),
          stage: "design",
        })}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Seleccionar alternativa/i }));
    fireEvent.click(screen.getByRole("button", { name: /Aprobar Diseno/i }));

    await waitFor(() => expect(actions.approveStageArtifact).toHaveBeenCalledWith(
      "design",
      "design-artifact-1",
      expect.objectContaining({
        decision_payload: expect.objectContaining({ selected_alternative_key: "multi_agent" }),
      }),
    ));
    expect(mockRouterPush).toHaveBeenCalledWith("/projects/session-uxa8/work/tools");
  });
});
