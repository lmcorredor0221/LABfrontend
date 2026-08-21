import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { LanguageProvider } from "@/core/i18n/language-context";
import type { ProductExperienceStageOperation } from "@/features/product-experience/core/server-state";
import { MemoryStageView } from "@/features/product-experience/memory/memory-stage-view";
import { ToolsStageView } from "@/features/product-experience/tools/tools-stage-view";
import {
  createApprovedToolsDigest,
  createMemoryArtifactFixture,
  createToolRecommendationPayload,
  createToolsArtifactFixture,
  createToolsRouteFixture,
} from "@/features/product-experience/tools/tools-memory-test-fixtures";
import type { ProductStageActions } from "@/features/product-experience/shell/use-product-experience-route";

const mockRouterPush = vi.hoisted(() => vi.fn());
const mockUsePathname = vi.hoisted(() => vi.fn(() => "/projects/session-uxa9/work/tools"));
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
    cancel_url: "/api/v1/sessions/session-uxa9/stage-operations/operation-design/cancel",
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
    recover_url: "/api/v1/sessions/session-uxa9/stage-operations/operation-design/recover",
    result: null,
    result_artifact_id: null,
    retry_url: "",
    session_id: "session-uxa9",
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
  const route = createToolsRouteFixture();
  return {
    approveMemoryProfile: vi.fn(async () => route.snapshot.data!),
    approveStageArtifact: vi.fn(async () => createToolsArtifactFixture({ state: "approved" })),
    approveToolsSelection: vi.fn(async () => route.snapshot.data!),
    buildCanvas: vi.fn(async () => ({ status: "ready" }) as never),
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
    prepareBlueprintCommercialResult: vi.fn(async () => route.snapshot.data!),
    patchStageArtifact: vi.fn(async (stageKey) =>
      stageKey === "memory"
        ? createMemoryArtifactFixture({ state: "reviewed" })
        : createToolsArtifactFixture({ state: "reviewed" }),
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
      stageKey === "memory"
        ? createMemoryArtifactFixture({ state: "rejected" })
        : createToolsArtifactFixture({ state: "rejected" }),
    ),
  };
}

function renderWithLanguage(ui: ReactElement) {
  return render(<LanguageProvider>{ui}</LanguageProvider>);
}

describe("ToolsStageView and MemoryStageView UXA9", () => {
  afterEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue("/projects/session-uxa9/work/tools");
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("generates Tools with LLM when Design is approved", async () => {
    const actions = createActions();
    renderWithLanguage(
      <ToolsStageView
        actionState={{ status: "idle" }}
        actions={actions}
        activeRoute={createToolsRouteFixture({ toolsArtifact: null })}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Generar herramientas/i }));

    await waitFor(() => expect(actions.recommendTools).toHaveBeenCalledWith({ instructions: undefined }));
  });

  it("promotes Tools digest and navigates to Memory", async () => {
    const actions = createActions();
    mockUseSearchParams.mockReturnValue(new URLSearchParams("uxa_section=catalog"));
    renderWithLanguage(
      <ToolsStageView
        actionState={{ status: "idle" }}
        actions={actions}
        activeRoute={createToolsRouteFixture()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Incluir opcional: Document Ingestion/i }));
    fireEvent.click(screen.getByRole("button", { name: /Promover herramientas/i }));

    await waitFor(() => expect(actions.approveToolsSelection).toHaveBeenCalledWith({
      include_optional_tool_keys: ["document_ingestion"],
    }));
    expect(mockRouterPush).toHaveBeenCalledWith("/projects/session-uxa9/work/memory");
  });

  it("shows Basic Blueprint gaps as assumptions and enrichment opportunities", async () => {
    const actions = createActions();
    const base = createToolRecommendationPayload();
    const recommendation = createToolRecommendationPayload({
      coverage_gaps: [
        {
          gap_key: "gap-basic",
          impact: "Mejora el detalle premium.",
          question: "Confirmar owner documental.",
          reason: "Se infiere para Basic y se conserva para enriquecimiento.",
          severity: "blocking",
          title: "Owner documental pendiente",
        },
      ],
      evaluation: {
        ...base.evaluation,
        promotion_blocked: true,
      },
    });
    const route = createToolsRouteFixture({
      toolsArtifact: createToolsArtifactFixture({
        proposal_payload: recommendation as unknown as Record<string, unknown>,
      }),
    });
    route.snapshot.data!.session.commercial_tier = "blueprint";

    renderWithLanguage(
      <ToolsStageView
        actionState={{ status: "idle" }}
        actions={actions}
        activeRoute={route}
      />,
    );

    expect(screen.getAllByText(/Supuestos y oportunidades de enriquecimiento/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Diferido a Premium/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Diferido a \[Enriquecer en Premium\]/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Promover herramientas/i })).toBeEnabled();
  });

  it("opens the tool detail drawer with request and response contracts", async () => {
    const actions = createActions();
    renderWithLanguage(
      <ToolsStageView
        actionState={{ status: "idle" }}
        actions={actions}
        activeRoute={createToolsRouteFixture()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Ver detalle: Knowledge Retrieval/i }));

    expect(screen.getByRole("dialog", { name: /Panel lateral de detalle de herramienta/i })).toBeInTheDocument();
    expect(screen.getByText(/Contratos JSON de integracion/i)).toBeInTheDocument();
    expect(screen.getByText(/Request JSON Schema/i)).toBeInTheDocument();
    expect(screen.getByText(/Response JSON Schema/i)).toBeInTheDocument();
    expect(screen.getAllByText(/query/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/sources/i).length).toBeGreaterThan(0);
  });

  it("generates Memory after Tools digest exists", async () => {
    const actions = createActions();
    renderWithLanguage(
      <MemoryStageView
        actionState={{ status: "idle" }}
        actions={actions}
        activeRoute={createToolsRouteFixture({
          memoryArtifact: null,
          stage: "memory",
          toolsArtifact: createToolsArtifactFixture({
            proposal_payload: createToolRecommendationPayload({ approved_tools_digest: createApprovedToolsDigest() }) as unknown as Record<string, unknown>,
            state: "approved",
          }),
        })}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Generar Memoria/i }));

    await waitFor(() => expect(actions.recommendMemory).toHaveBeenCalledWith({ instructions: undefined }));
  });

  it("approves Memory and navigates to Estimate", async () => {
    mockUsePathname.mockReturnValue("/projects/session-uxa9/work/memory");
    const actions = createActions();
    renderWithLanguage(
      <MemoryStageView
        actionState={{ status: "idle" }}
        actions={actions}
        activeRoute={createToolsRouteFixture({
          memoryArtifact: createMemoryArtifactFixture(),
          stage: "memory",
          toolsArtifact: createToolsArtifactFixture({
            proposal_payload: createToolRecommendationPayload({ approved_tools_digest: createApprovedToolsDigest() }) as unknown as Record<string, unknown>,
            state: "approved",
          }),
        })}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Aprobar Memoria/i }));

    await waitFor(() => expect(actions.patchStageArtifact).toHaveBeenCalledWith(
      "memory",
      "memory-artifact-1",
      expect.objectContaining({ note: "uxa9_memory_pre_approval_review" }),
    ));
    expect(actions.approveMemoryProfile).toHaveBeenCalledWith(expect.objectContaining({ note: "uxa9_memory_approved" }));
    expect(mockRouterPush).toHaveBeenCalledWith("/projects/session-uxa9/work/estimate");
  });
});
