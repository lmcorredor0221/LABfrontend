import { act, renderHook, waitFor } from "@testing-library/react";

const mockStore = vi.hoisted(() => {
  const state = {
    active: null,
    history: [],
  };

  return {
    approveMemoryProfile: vi.fn(),
    approveStageArtifact: vi.fn(),
    approveToolsSelection: vi.fn(),
    buildCanvas: vi.fn(),
    defineRequirements: vi.fn(),
    getState: vi.fn(() => state),
    loadRoute: vi.fn(async () => undefined),
    patchStageArtifact: vi.fn(),
    proposeDesign: vi.fn(),
    recommendMemory: vi.fn(),
    recommendTools: vi.fn(),
    rejectStageArtifact: vi.fn(),
    resolveAttentionItem: vi.fn(),
    subscribe: vi.fn(() => () => undefined),
  };
});

vi.mock("@/features/product-experience/core/server-state", () => ({
  createProductExperienceServerState: () => mockStore,
}));

import { useProductExperienceRoute } from "@/features/product-experience/shell/use-product-experience-route";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });

  return {
    promise,
    reject,
    resolve,
  };
}

describe("useProductExperienceRoute UXA10", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("deduplicates concurrent stage mutations and exposes an observable operation", async () => {
    const request = deferred<unknown>();
    mockStore.defineRequirements.mockReturnValue(request.promise);
    const { result } = renderHook(() =>
      useProductExperienceRoute({
        currentStage: "define",
        sessionId: "session-uxa10",
      }),
    );

    let first!: Promise<unknown>;
    let second!: Promise<unknown>;
    act(() => {
      first = result.current.stageActions.defineRequirements();
      second = result.current.stageActions.defineRequirements();
    });

    expect(mockStore.defineRequirements).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(result.current.stageAction.operation?.status).toBe("running"));
    expect(result.current.stageAction.operation?.steps.map((step) => step.status)).toEqual(["completed", "active", "pending"]);

    await act(async () => {
      request.resolve({ id: "artifact-define" });
      await Promise.all([first, second]);
    });

    expect(result.current.stageAction.status).toBe("success");
    expect(result.current.stageAction.operation?.status).toBe("completed");
    expect(mockStore.loadRoute).toHaveBeenCalledWith(
      { currentStage: "define", sessionId: "session-uxa10" },
      { force: true },
    );
  });

  it("marks timeout failures with a recoverable operation envelope", async () => {
    const request = deferred<unknown>();
    mockStore.recommendMemory.mockReturnValue(request.promise);
    const { result } = renderHook(() =>
      useProductExperienceRoute({
        currentStage: "memory",
        sessionId: "session-uxa10",
      }),
    );

    let promise!: Promise<unknown>;
    act(() => {
      promise = result.current.stageActions.recommendMemory();
    });

    await act(async () => {
      request.reject(new Error("timeout waiting for codex cli"));
      await expect(promise).rejects.toThrow("timeout waiting for codex cli");
    });

    expect(result.current.stageAction.status).toBe("error");
    expect(result.current.stageAction.operation?.status).toBe("failed");
    expect(result.current.stageAction.operation?.detail).toContain("umbral operativo");
  });
});
