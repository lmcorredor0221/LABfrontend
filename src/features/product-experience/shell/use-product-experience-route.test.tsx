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
    analyzeDiscovery: vi.fn(),
    buildCanvas: vi.fn(),
    defineRequirements: vi.fn(),
    startAnalyzeDiscovery: vi.fn(),
    startDefineRequirements: vi.fn(),
    generateEstimationReport: vi.fn(),
    getState: vi.fn(() => state),
    loadRoute: vi.fn(async () => undefined),
    patchStageArtifact: vi.fn(),
    proposeDesign: vi.fn(),
    startProposeDesign: vi.fn(),
    retryStageOperation: vi.fn(),
    cancelStageOperation: vi.fn(),
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
import type { ProductExperienceStageOperation } from "@/features/product-experience/core/server-state";
import type { DiscoveryInput } from "@/features/sessions/session-contracts";

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

function createStageOperation(overrides: Partial<ProductExperienceStageOperation> = {}): ProductExperienceStageOperation {
  return {
    action: "propose_design",
    attempt_count: 1,
    can_cancel: true,
    can_retry: false,
    cancel_requested_at: null,
    cancel_url: "/api/v1/sessions/session-uxa10/stage-operations/operation-1/cancel",
    completed_at: null,
    created_at: "2026-08-16T10:00:00Z",
    current_step: "queued",
    detail: "Solicitud recibida.",
    error_message: "",
    expires_at: "2026-08-16T10:30:00Z",
    heartbeat_at: "2026-08-16T10:00:00Z",
    id: "operation-1",
    idempotency_key: "design-once",
    is_stale: false,
    recover_url: "/api/v1/sessions/session-uxa10/stage-operations/operation-1/recover",
    result: null,
    result_artifact_id: null,
    retry_url: "",
    session_id: "session-uxa10",
    stage_key: "design",
    status: "queued",
    steps: [],
    technical_detail: "",
    updated_at: "2026-08-16T10:00:00Z",
    workspace_id: "workspace-1",
    ...overrides,
  };
}

describe("useProductExperienceRoute UXA10", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("ignores cancelled route loads during fast navigation", async () => {
    mockStore.loadRoute.mockRejectedValueOnce(
      new Error("The request to /api/v1/sessions/session-uxa10 was cancelled."),
    );

    const { result } = renderHook(() =>
      useProductExperienceRoute({
        currentStage: "memory",
        sessionId: "session-uxa10",
      }),
    );

    await waitFor(() => expect(mockStore.loadRoute).toHaveBeenCalledTimes(1));
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(result.current.loadError).toBeNull();
  });

  it("deduplicates concurrent stage mutations and exposes an observable operation", async () => {
    const request = deferred<ProductExperienceStageOperation>();
    mockStore.startDefineRequirements.mockReturnValue(request.promise);
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

    expect(mockStore.startDefineRequirements).toHaveBeenCalledTimes(1);
    expect(mockStore.defineRequirements).not.toHaveBeenCalled();
    await waitFor(() => expect(result.current.stageAction.operation?.status).toBe("running"));
    expect(result.current.stageAction.operation?.steps.map((step) => step.status)).toEqual(["completed", "active", "pending"]);

    await act(async () => {
      request.resolve(createStageOperation({
        action: "define_requirements",
        id: "operation-define",
        stage_key: "define",
      }));
      await Promise.all([first, second]);
    });

    expect(result.current.stageAction.status).toBe("submitting");
    expect(result.current.stageAction.operation?.id).toBe("operation-define");
    expect(result.current.stageAction.operation?.source).toBe("server");
    expect(result.current.stageAction.operation?.status).toBe("queued");
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

  it("starts Discover analysis as a persistent backend operation", async () => {
    const operation = createStageOperation({
      action: "analyze_discovery",
      id: "operation-discover",
      stage_key: "discover",
    });
    mockStore.startAnalyzeDiscovery.mockResolvedValue(operation);
    const payload: DiscoveryInput = {
      autonomy_level: "medium",
      constraints: ["No publicar sin revision"],
      current_process: "Soporte manual",
      current_user: "Analista de soporte",
      desired_outcome: "Reducir tiempos",
      mvp_definition: {
        non_delegable_decisions: ["Aprobar excepciones"],
        north_star_metric: "Tiempo promedio de resolucion",
        out_of_scope: ["Ejecutar pagos"],
        v1_scope: ["Clasificar tickets"],
      },
      operational_baseline: {
        automation_opportunities: ["Recuperar conocimiento"],
        current_cost: "Impacto moderado",
        current_time_spent: "2 horas por semana",
        frequent_errors: ["Respuestas inconsistentes"],
      },
      problem_statement: "Tickets repetitivos",
    };
    const { result } = renderHook(() =>
      useProductExperienceRoute({
        currentStage: "discover",
        sessionId: "session-uxa10",
      }),
    );

    await act(async () => {
      await result.current.discoverActions.analyzeDiscovery(payload);
    });

    expect(mockStore.startAnalyzeDiscovery).toHaveBeenCalledWith(payload);
    expect(mockStore.analyzeDiscovery).not.toHaveBeenCalled();
    expect(result.current.discoverAction.status).toBe("submitting");
    expect(result.current.discoverAction.operation?.id).toBe("operation-discover");
    expect(result.current.discoverAction.operation?.source).toBe("server");
    expect(result.current.discoverAction.operation?.status).toBe("queued");
    expect(mockStore.loadRoute).toHaveBeenCalledWith(
      { currentStage: "discover", sessionId: "session-uxa10" },
      { force: true },
    );
  });

  it("starts Design as a persistent backend operation and exposes operation controls", async () => {
    const operation = createStageOperation();
    mockStore.startProposeDesign.mockResolvedValue(operation);
    mockStore.retryStageOperation.mockResolvedValue(createStageOperation({ attempt_count: 2 }));
    mockStore.cancelStageOperation.mockResolvedValue(createStageOperation({ cancel_requested_at: "2026-08-16T10:01:00Z" }));
    const { result } = renderHook(() =>
      useProductExperienceRoute({
        currentStage: "design",
        sessionId: "session-uxa10",
      }),
    );

    await act(async () => {
      await result.current.stageActions.proposeDesign({ instructions: "Diseno gobernado." });
    });

    expect(mockStore.startProposeDesign).toHaveBeenCalledWith({ instructions: "Diseno gobernado." });
    expect(mockStore.proposeDesign).not.toHaveBeenCalled();
    expect(result.current.stageAction.status).toBe("submitting");
    expect(result.current.stageAction.operation?.id).toBe("operation-1");
    expect(result.current.stageAction.operation?.source).toBe("server");
    expect(result.current.stageAction.operation?.status).toBe("queued");
    expect(mockStore.loadRoute).toHaveBeenCalledWith(
      { currentStage: "design", sessionId: "session-uxa10" },
      { force: true },
    );

    await act(async () => {
      await result.current.operationControls.retryOperation("operation-1");
      await result.current.operationControls.cancelOperation("operation-1");
    });

    expect(mockStore.retryStageOperation).toHaveBeenCalledWith("operation-1");
    expect(mockStore.cancelStageOperation).toHaveBeenCalledWith("operation-1");
  });
});
