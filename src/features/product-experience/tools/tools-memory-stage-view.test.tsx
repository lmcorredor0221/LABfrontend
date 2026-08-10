import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
import type { ToolRecommendationEnvelope } from "@/features/sessions/session-contracts";

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

function createActions(): ProductStageActions {
  const route = createToolsRouteFixture();
  return {
    approveMemoryProfile: vi.fn(async () => route.snapshot.data!),
    approveStageArtifact: vi.fn(async () => createToolsArtifactFixture({ state: "approved" })),
    approveToolsSelection: vi.fn(async () => route.snapshot.data!),
    buildCanvas: vi.fn(async () => ({ status: "ready" }) as never),
    defineRequirements: vi.fn(async () => createToolsArtifactFixture({ stage_key: "define" })),
    patchStageArtifact: vi.fn(async (stageKey) =>
      stageKey === "memory"
        ? createMemoryArtifactFixture({ state: "reviewed" })
        : createToolsArtifactFixture({ state: "reviewed" }),
    ),
    proposeDesign: vi.fn(async () => createToolsArtifactFixture({ stage_key: "design" })),
    recommendMemory: vi.fn(async () => createMemoryArtifactFixture()),
    recommendTools: vi.fn(async () => ({ status: "ready" }) as ToolRecommendationEnvelope),
    rejectStageArtifact: vi.fn(async (stageKey) =>
      stageKey === "memory"
        ? createMemoryArtifactFixture({ state: "rejected" })
        : createToolsArtifactFixture({ state: "rejected" }),
    ),
  };
}

describe("ToolsStageView and MemoryStageView UXA9", () => {
  afterEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue("/projects/session-uxa9/work/tools");
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("generates Tools with LLM when Design is approved", async () => {
    const actions = createActions();
    render(
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
    render(
      <ToolsStageView
        actionState={{ status: "idle" }}
        actions={actions}
        activeRoute={createToolsRouteFixture()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Incluir opcional/i }));
    fireEvent.click(screen.getByRole("button", { name: /Promover herramientas/i }));

    await waitFor(() => expect(actions.approveToolsSelection).toHaveBeenCalledWith({
      include_optional_tool_keys: ["document_ingestion"],
    }));
    expect(mockRouterPush).toHaveBeenCalledWith("/projects/session-uxa9/work/memory");
  });

  it("preserves Tools section in the URL", () => {
    const actions = createActions();
    render(
      <ToolsStageView
        actionState={{ status: "idle" }}
        actions={actions}
        activeRoute={createToolsRouteFixture()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Catalogo/i }));

    expect(mockRouterPush).toHaveBeenCalledWith(
      "/projects/session-uxa9/work/tools?uxa_section=catalog",
      { scroll: false },
    );
  });

  it("generates Memory after Tools digest exists", async () => {
    const actions = createActions();
    render(
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
    render(
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
