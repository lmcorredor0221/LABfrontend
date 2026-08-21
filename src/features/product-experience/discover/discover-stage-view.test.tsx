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
    expires_at: "2026-08-16T10:30:00Z",
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
    expect(screen.getByLabelText("Descripcion del problema")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Guardar y analizar" }));

    await waitFor(() => expect(actions.analyzeDiscovery).toHaveBeenCalledTimes(1));
    expect(actions.normalizeDiscovery).not.toHaveBeenCalled();
    expect(actions.analyzeDiscovery).toHaveBeenCalledWith(expect.objectContaining({
      problem_statement: expect.stringContaining("soporte recibe solicitudes repetitivas"),
    }));
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
