import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DiscoverStageView } from "@/features/product-experience/discover/discover-stage-view";
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
    analyzeDiscovery: vi.fn(async () => artifact),
    approveDiscoverArtifact: vi.fn(async () => createDiscoverArtifactFixture({ state: "approved" })),
    normalizeDiscovery: vi.fn(async () => envelope),
    patchDiscoverArtifact: vi.fn(async () => artifact),
    rejectDiscoverArtifact: vi.fn(async () => createDiscoverArtifactFixture({ state: "rejected" })),
  };
}

describe("DiscoverStageView UXA7", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the new Discover workbench and executes normalize plus LLM analysis", async () => {
    const actions = createActions();
    render(
      <DiscoverStageView
        actionState={{ status: "idle" }}
        actions={actions}
        activeRoute={createDiscoverRouteFixture({ artifact: null })}
      />,
    );

    expect(screen.getByRole("heading", { name: /Descubrir: problema y contexto/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Descripcion del problema")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Guardar y analizar" }));

    await waitFor(() => expect(actions.normalizeDiscovery).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(actions.analyzeDiscovery).toHaveBeenCalledTimes(1));
    expect(actions.normalizeDiscovery).toHaveBeenCalledWith(expect.objectContaining({
      problem_statement: expect.stringContaining("soporte recibe solicitudes repetitivas"),
    }));
  });

  it("approves generated analysis and navigates to Define", async () => {
    const actions = createActions();
    render(
      <DiscoverStageView
        actionState={{ status: "idle" }}
        actions={actions}
        activeRoute={createDiscoverRouteFixture({ artifact: createDiscoverArtifactFixture({ proposal_payload: createAnalysisFixture() as unknown as Record<string, unknown> }) })}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Aprobar Discover" }));

    await waitFor(() => expect(actions.approveDiscoverArtifact).toHaveBeenCalledTimes(1));
    expect(actions.patchDiscoverArtifact).toHaveBeenCalledTimes(1);
    expect(mockRouterPush).toHaveBeenCalledWith("/projects/session-uxa7/work/define");
  });

  it("records review decisions and can reject the generated proposal", async () => {
    const actions = createActions();
    render(
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

    fireEvent.click(screen.getByRole("button", { name: "Rechazar propuesta" }));

    await waitFor(() => expect(actions.rejectDiscoverArtifact).toHaveBeenCalledTimes(1));
  });
});
