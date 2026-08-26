import { getLongRunningApiRequestTimeoutMs } from "@/core/config/runtime";
import { createProductExperienceApi } from "@/features/product-experience/core/server-state/api";
import type { ProductExperienceStageOperation } from "@/features/product-experience/core/server-state/types";

function createStageOperation(overrides: Partial<ProductExperienceStageOperation> = {}): ProductExperienceStageOperation {
  return {
    action: "propose_design",
    attempt_count: 1,
    can_cancel: true,
    can_retry: false,
    cancel_requested_at: null,
    cancel_url: "/api/v1/sessions/session-a/stage-operations/operation-1/cancel",
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
    recover_url: "/api/v1/sessions/session-a/stage-operations/operation-1/recover",
    result: null,
    result_artifact_id: null,
    retry_url: "",
    session_id: "session-a",
    stage_key: "design",
    status: "queued",
    steps: [],
    technical_detail: "",
    updated_at: "2026-08-16T10:00:00Z",
    workspace_id: "workspace-1",
    ...overrides,
  };
}

describe("product experience api", () => {
  it("uses the shared long-running timeout for Define generation", async () => {
    const client = {
      get: vi.fn(),
      patch: vi.fn(),
      post: vi.fn().mockResolvedValue({ id: "define-artifact" }),
    };
    const api = createProductExperienceApi(client as never);

    await api.defineRequirements("session-a");

    expect(client.post).toHaveBeenCalledWith("/api/v1/sessions/session-a/define-requirements", {
      signal: undefined,
      timeoutMs: getLongRunningApiRequestTimeoutMs(),
    });
  });

  it("uses the shared long-running timeout for chained LLM stage mutations", async () => {
    const client = {
      get: vi.fn(),
      patch: vi.fn(),
      post: vi.fn(async (path: string) =>
        path.includes("propose-design/start")
          ? createStageOperation({
              can_cancel: false,
              completed_at: "2026-08-16T10:01:00Z",
              current_step: "persist",
              result: { id: "stage-artifact" },
              result_artifact_id: "stage-artifact",
              status: "completed",
            } as Partial<ProductExperienceStageOperation>)
          : { id: "stage-artifact" },
      ),
    };
    const api = createProductExperienceApi(client as never);

    await api.buildCanvas("session-a");
    await api.proposeDesign("session-a", { instructions: "Diseno gobernado." });
    await api.recommendTools("session-a", { instructions: "Herramientas minimas." });
    await api.recommendMemory("session-a", { instructions: "Memoria RAG gobernada." });

    for (const call of client.post.mock.calls) {
      const [, requestOptions] = call as unknown as [string, { timeoutMs: number }];
      expect(requestOptions).toEqual(expect.objectContaining({ timeoutMs: getLongRunningApiRequestTimeoutMs() }));
    }
  });

  it("starts Design as a persistent operation with an idempotency header", async () => {
    const client = {
      get: vi.fn(),
      patch: vi.fn(),
      post: vi.fn().mockResolvedValue(createStageOperation()),
    };
    const api = createProductExperienceApi(client as never);

    const operation = await api.startProposeDesign(
      "session-a",
      { instructions: "Diseno gobernado." },
      { idempotencyKey: "design-once" },
    );

    expect(operation.id).toBe("operation-1");
    expect(client.post).toHaveBeenCalledWith("/api/v1/sessions/session-a/propose-design/start", {
      body: { instructions: "Diseno gobernado." },
      headers: expect.any(Headers),
      signal: undefined,
      timeoutMs: getLongRunningApiRequestTimeoutMs(),
    });
    const [, requestOptions] = client.post.mock.calls[0] as unknown as [string, { headers: Headers }];
    const headers = requestOptions.headers;
    expect(headers.get("x-idempotency-key")).toBe("design-once");
  });

  it("starts Discover and Define as persistent operations with idempotency headers", async () => {
    const client = {
      get: vi.fn(),
      patch: vi.fn(),
      post: vi.fn()
        .mockResolvedValueOnce(createStageOperation({
          action: "analyze_discovery",
          id: "operation-discover",
          stage_key: "discover",
        }))
        .mockResolvedValueOnce(createStageOperation({
          action: "define_requirements",
          id: "operation-define",
          stage_key: "define",
        })),
    };
    const api = createProductExperienceApi(client as never);

    await api.startAnalyzeDiscovery(
      "session-a",
      {
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
      },
      { idempotencyKey: "discover-once" },
    );
    await api.startDefineRequirements("session-a", { idempotencyKey: "define-once" });

    const discoverCall = client.post.mock.calls[0] as unknown as [string, { headers: Headers }];
    const defineCall = client.post.mock.calls[1] as unknown as [string, { headers: Headers }];
    expect(discoverCall[0]).toBe("/api/v1/sessions/session-a/analyze-discovery/start");
    expect(discoverCall[1].headers.get("x-idempotency-key")).toBe("discover-once");
    expect(defineCall[0]).toBe("/api/v1/sessions/session-a/define-requirements/start");
    expect(defineCall[1].headers.get("x-idempotency-key")).toBe("define-once");
  });

  it("starts Tools, Memory and Estimate as persistent operations with idempotency headers", async () => {
    const client = {
      get: vi.fn(),
      patch: vi.fn(),
      post: vi.fn()
        .mockResolvedValueOnce(createStageOperation({
          action: "recommend_tools",
          id: "operation-tools",
          stage_key: "tools",
        }))
        .mockResolvedValueOnce(createStageOperation({
          action: "recommend_memory",
          id: "operation-memory",
          stage_key: "memory",
        }))
        .mockResolvedValueOnce(createStageOperation({
          action: "generate_estimation_report",
          id: "operation-estimate",
          stage_key: "estimate",
        })),
    };
    const api = createProductExperienceApi(client as never);

    await api.startRecommendTools(
      "session-a",
      { instructions: "Solo herramientas minimas." },
      { idempotencyKey: "tools-once" },
    );
    await api.startRecommendMemory(
      "session-a",
      { instructions: "Memoria RAG gobernada." },
      { idempotencyKey: "memory-once" },
    );
    await api.startGenerateEstimationReport("session-a", { idempotencyKey: "estimate-once" });

    const toolsCall = client.post.mock.calls[0] as unknown as [string, { headers: Headers }];
    const memoryCall = client.post.mock.calls[1] as unknown as [string, { headers: Headers }];
    const estimateCall = client.post.mock.calls[2] as unknown as [string, { headers: Headers }];
    expect(toolsCall[0]).toBe("/api/v1/sessions/session-a/recommend-tools/start");
    expect(toolsCall[1].headers.get("x-idempotency-key")).toBe("tools-once");
    expect(memoryCall[0]).toBe("/api/v1/sessions/session-a/recommend-memory/start");
    expect(memoryCall[1].headers.get("x-idempotency-key")).toBe("memory-once");
    expect(estimateCall[0]).toBe("/api/v1/sessions/session-a/estimate/start");
    expect(estimateCall[1].headers.get("x-idempotency-key")).toBe("estimate-once");
  });

  it("uses the shared long-running timeout for attention actions", async () => {
    const client = {
      get: vi.fn(),
      patch: vi.fn(),
      post: vi.fn().mockResolvedValue({ status: "applied" }),
    };
    const api = createProductExperienceApi(client as never);

    await api.resolveAttentionItemV2(
      "session-a",
      "attention.v2:runtime_error:memory",
      { action_kind: "retry", idempotency_key: "attention-retry" },
    );

    expect(client.post).toHaveBeenCalledWith(
      "/api/v1/sessions/session-a/attention-v2/attention.v2%3Aruntime_error%3Amemory/actions",
      {
        body: { action_kind: "retry", idempotency_key: "attention-retry" },
        signal: undefined,
        timeoutMs: getLongRunningApiRequestTimeoutMs(),
      },
    );
  });
});
