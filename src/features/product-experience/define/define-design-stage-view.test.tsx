import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DefineStageView } from "@/features/product-experience/define/define-stage-view";
import { DesignStageView } from "@/features/product-experience/design/design-stage-view";
import {
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
    defineRequirements: vi.fn(async () => createDefineArtifactFixture()),
    patchStageArtifact: vi.fn(async (stageKey) =>
      stageKey === "design" ? createDesignArtifactFixture({ state: "reviewed" }) : createDefineArtifactFixture({ state: "reviewed" }),
    ),
    proposeDesign: vi.fn(async () => createDesignArtifactFixture()),
    recommendMemory: vi.fn(async () => createDesignArtifactFixture({ stage_key: "memory" })),
    recommendTools: vi.fn(async () => ({ status: "ready" }) as never),
    rejectStageArtifact: vi.fn(async (stageKey) =>
      stageKey === "design" ? createDesignArtifactFixture({ state: "rejected" }) : createDefineArtifactFixture({ state: "rejected" }),
    ),
  };
}

describe("DefineStageView and DesignStageView UXA8", () => {
  afterEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue("/projects/session-uxa8/work/define");
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("generates Define by building Canvas and requirements", async () => {
    const actions = createActions();
    render(
      <DefineStageView
        actionState={{ status: "idle" }}
        actions={actions}
        activeRoute={createDefineRouteFixture({ defineArtifact: null })}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Generar Definicion/i }));

    await waitFor(() => expect(actions.buildCanvas).toHaveBeenCalledTimes(1));
    expect(actions.defineRequirements).toHaveBeenCalledTimes(1);
  });

  it("approves Define and navigates to Design", async () => {
    const actions = createActions();
    render(
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
    render(
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

  it("generates Design from approved Define", async () => {
    const actions = createActions();
    render(
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
    render(
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
