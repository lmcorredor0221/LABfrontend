import { createProductExperienceServerState } from "@/features/product-experience/core/server-state/store";
import type { ProductExperienceApiClientInstance } from "@/features/product-experience/core/server-state/api";
import type {
  AttentionActionRequestV2,
  AttentionActionResultV2,
  AttentionResponseV2,
} from "@/features/attention/attention-contracts";
import type {
  ActivityResponse,
  ProductOverviewResponse,
  SessionListResponse,
  SessionSnapshot,
  SessionSummary,
} from "@/features/sessions/types";
import type {
  CanvasEnvelope,
  DiscoveryInput,
  JourneyStageArtifactEntry,
  ToolRecommendationEnvelope,
} from "@/features/sessions/session-contracts";

type Deferred<T> = {
  promise: Promise<T>;
  reject: (error: unknown) => void;
  resolve: (value: T) => void;
};

function deferred<T>(): Deferred<T> {
  let reject!: (error: unknown) => void;
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((innerResolve, innerReject) => {
    resolve = innerResolve;
    reject = innerReject;
  });

  return { promise, reject, resolve };
}

function createSessionSummary(sessionId: string, overrides?: Partial<SessionSummary>): SessionSummary {
  return {
    created_at: "2026-08-03T10:00:00Z",
    current_stage: "build_canvas",
    id: sessionId,
    status: "ready",
    title: `Proyecto ${sessionId}`,
    updated_at: "2026-08-03T10:01:00Z",
    workspace_id: "workspace-1",
    ...overrides,
  };
}

function createSessionSnapshot(sessionId: string, updatedAt = "2026-08-03T10:01:00Z"): SessionSnapshot {
  return {
    activity: [],
    alert_events: [],
    approvals: [],
    artifact_records: [],
    blueprint: null,
    blueprint_versions: [],
    canvas: null,
    contract_version: "session-snapshot.v1",
    discovery: null,
    estimation_error_metrics: [],
    estimation_report: null,
    estimation_runs: [],
    evaluation: null,
    evaluation_dataset: null,
    evaluation_rubric: null,
    evaluation_runs: [],
    governance_policies: [],
    handoff_records: [],
    integration_statuses: [],
    journey_artifacts: [],
    metric_snapshots: [],
    project_actuals: [],
    session: createSessionSummary(sessionId, { updated_at: updatedAt }),
    skill_catalog: [],
    skill_runs: [],
    subagent_runs: [],
    simulation_runs: [],
    validations: [],
    workflow_templates: [],
    workspace_contract: {
      catalogs: [],
      contract_version: "workspace-contract.v1",
      feature_flags: [],
      sections: [],
    },
  };
}

function createAttention(sessionId: string, currentStage: string, totalCount = 1): AttentionResponseV2 {
  return {
    actionable_count: totalCount,
    blocking_count: 0,
    contract_version: "attention.v2",
    counts_by_product: { blueprint: totalCount },
    counts_by_stage: { [currentStage]: totalCount },
    counts_by_type: { question: totalCount },
    current_stage: currentStage,
    cursor: "",
    generated_at: "2026-08-03T10:02:00Z",
    info_count: totalCount,
    items: [],
    primary_item: null,
    session_id: sessionId,
    total_count: totalCount,
    warning_count: 0,
    workspace_id: "workspace-1",
  };
}

function createList(...sessionIds: string[]): SessionListResponse {
  return {
    items: sessionIds.map((sessionId) => createSessionSummary(sessionId)),
  };
}

function createOperation(sessionId: string): {
  activity: ActivityResponse;
  overview: ProductOverviewResponse;
} {
  return {
    activity: {
      contract_version: "activity.v1",
      funnel: [],
      generated_at: "2026-08-03T10:04:00Z",
      metrics: [],
      session_id: sessionId,
      timeline: [],
      workspace_id: "workspace-1",
    },
    overview: {
      access: {} as ProductOverviewResponse["access"],
      active_stage: "discover",
      attention: [],
      contract_version: "product-overview.v1",
      exports: [],
      generated_at: "2026-08-03T10:03:00Z",
      lean_progress_percent: 20,
      navigation: [],
      products: [],
      project_title: `Proyecto ${sessionId}`,
      session_id: sessionId,
      workspace_id: "workspace-1",
    },
  };
}

function createDiscoveryPayload(): DiscoveryInput {
  return {
    autonomy_level: "medium",
    constraints: ["No publicar sin revision"],
    current_process: "El equipo responde tickets repetitivos manualmente.",
    current_user: "Analista de soporte",
    desired_outcome: "Reducir tiempo de respuesta con trazabilidad.",
    mvp_definition: {
      non_delegable_decisions: ["Aprobar excepciones"],
      north_star_metric: "Tiempo promedio de resolucion",
      out_of_scope: ["Ejecutar pagos"],
      v1_scope: ["Clasificar tickets", "Proponer respuestas"],
    },
    operational_baseline: {
      automation_opportunities: ["Recuperar conocimiento"],
      current_cost: "Impacto moderado en tiempo y calidad",
      current_time_spent: "Entre 2 y 8 horas por semana",
      frequent_errors: ["Respuestas inconsistentes"],
    },
    problem_statement: "Soporte recibe solicitudes repetitivas.",
  };
}

function createStageArtifact(stageKey: JourneyStageArtifactEntry["stage_key"], id = `${stageKey}-artifact`): JourneyStageArtifactEntry {
  return {
    approved_at: null,
    approved_by_user_id: null,
    artifact_kind: `${stageKey}_artifact`,
    based_on_artifact_id: null,
    confidence: 0.8,
    context_fingerprint: "ctx",
    corpus_hash: "corpus",
    created_at: "2026-08-03T10:00:00Z",
    decisions: [],
    evidence_manifest: [],
    execution_backend: "codex",
    id,
    input_fingerprint: "input",
    missing_information: [],
    model: "gpt-5.5",
    output_fingerprint: "output",
    prompt_version: `${stageKey}.v1`,
    proposal_payload: {},
    provider_key: "codex-cli",
    rejected_at: null,
    reviewed_at: null,
    schema_version: `${stageKey}.v1`,
    session_id: "session-a",
    source_action: stageKey,
    source_stage_versions: {},
    stage_key: stageKey,
    stale_at: null,
    stale_reasons: [],
    state: "generated",
    superseded_by_artifact_id: null,
    updated_at: "2026-08-03T10:01:00Z",
    user_patch: {},
    version_number: 1,
    warnings: [],
    workspace_id: "workspace-1",
  };
}

function createApi(overrides: Partial<ProductExperienceApiClientInstance> = {}): ProductExperienceApiClientInstance {
  return {
    getActivity: vi.fn(async (sessionId: string) => createOperation(sessionId).activity),
    getAttentionV2: vi.fn(async (sessionId: string, params: { current_stage?: string }) =>
      createAttention(sessionId, params.current_stage ?? "discover"),
    ),
    getAuth: vi.fn(async () => ({
      active_workspace_id: "workspace-1",
      active_workspace_name: "Lean Agent Builder",
      email: "admin@example.com",
      full_name: "Admin",
      id: "user-1",
      workspaces: [],
    })),
    getProductOverview: vi.fn(async (sessionId: string) => createOperation(sessionId).overview),
    getSnapshot: vi.fn(async (sessionId: string) => createSessionSnapshot(sessionId)),
    listSessions: vi.fn(async () => createList("session-a")),
    analyzeDiscovery: vi.fn(async () => createStageArtifact("discover", "discover-analysis")),
    buildCanvas: vi.fn(async (): Promise<CanvasEnvelope> => ({
      assumptions: [],
      data: {
        agent_profile: {
          agent_task: "Clasificar tickets y proponer respuestas trazables.",
          allowed_decisions: [],
          expected_outputs: [],
          human_approvals: [],
          key_inputs: [],
          mission: "Resolver solicitudes repetitivas.",
          primary_user: "Analista",
          prohibited_decisions: [],
          success_metrics: [],
        },
        mvp_scope: [],
        out_of_scope: [],
        primary_risk: "Conocimiento no gobernado",
        success_metric: "Tiempo de resolucion",
        user_goal: "Reducir soporte manual",
      },
      evidence: [],
      missing_fields: [],
      next_action: "define_requirements",
      stage: "build_canvas",
      status: "ready",
      warnings: [],
    } as CanvasEnvelope)),
    defineRequirements: vi.fn(async () => createStageArtifact("define", "define-artifact")),
    normalizeDiscovery: vi.fn(async () => ({
      assumptions: [],
      data: createSessionSnapshot("session-a").discovery,
      evidence: [],
      missing_fields: [],
      next_action: "analyze_discovery",
      stage: "normalize_discovery",
      status: "ready",
      warnings: [],
    }) as never),
    proposeDesign: vi.fn(async () => createStageArtifact("design", "design-artifact")),
    recommendTools: vi.fn(async (): Promise<ToolRecommendationEnvelope> => ({
      assumptions: [],
      data: {
        approved_tools_digest: null,
        confidence: { band: "high", overall: 0.86, rationale: "Suficiente contexto" },
        context_digest: {
          constraints_summary: "Sin side effects autonomos",
          digest_sha256: "digest",
          source_refs: ["design"],
          workflow_summary: "Clasificar y responder",
        },
        coverage_gaps: [],
        design_role_coverage: [],
        evaluation: {
          compatibility_status: "complete",
          coverage_status: "complete",
          findings: [],
          governance_status: "complete",
          minimality_status: "complete",
          overall_status: "complete",
          promotion_blocked: false,
          recommended_actions: [],
          summary: "Tools minimas listas.",
        },
        is_stale: false,
        needs_information: [],
        optional_tools: [],
        preflight: {
          agent_goal: "Resolver soporte repetitivo",
          approval_boundaries: [],
          candidate_tool_families: [],
          case_classification: "support",
          core_workflows: [],
          forbidden_capabilities: [],
          hard_constraints: [],
          interaction_modes: [],
          mandatory_capabilities: [],
          missing_information: [],
          primary_user: "Analista",
          required_information_sources: [],
          required_write_actions: [],
        },
        recommended_tools: [],
        rejected_tools: [],
        requirements_coverage: [],
        review_decisions: [],
        review_state: "partial",
        schema_version: "tool-recommendation.v1",
        source_stage_versions: {},
        stale_reasons: [],
        summary: "Set minimo de tools.",
      },
      evidence: [],
      missing_fields: [],
      next_action: "approve_tools_selection",
      stage: "build_blueprint",
      status: "ready",
      warnings: [],
    } as unknown as ToolRecommendationEnvelope)),
    recommendMemory: vi.fn(async () => createStageArtifact("memory", "memory-artifact")),
    approveToolsSelection: vi.fn(async (sessionId: string) => createSessionSnapshot(sessionId, "2026-08-03T10:07:00Z")),
    approveMemoryProfile: vi.fn(async (sessionId: string) => createSessionSnapshot(sessionId, "2026-08-03T10:08:00Z")),
    approveJourneyArtifact: vi.fn(async () => ({ ...createStageArtifact("discover", "discover-analysis"), state: "approved" as const })),
    patchJourneyArtifact: vi.fn(async () => ({ ...createStageArtifact("discover", "discover-analysis"), state: "reviewed" as const })),
    rejectJourneyArtifact: vi.fn(async () => ({ ...createStageArtifact("discover", "discover-analysis"), state: "rejected" as const })),
    resolveAttentionItemV2: vi.fn(async (sessionId: string, itemKey: string): Promise<AttentionActionResultV2> => {
      return {
        action_kind: "answer",
        attention: createAttention(sessionId, "memory", 0),
        contract_version: "attention-action.v2",
        item_key: itemKey,
        message: "Resuelto",
        session_id: sessionId,
        status: "applied",
        workspace_id: "workspace-1",
      };
    }),
    ...overrides,
  };
}

describe("product experience server state", () => {
  it("deduplicates cold route loads and avoids refetching on rerender", async () => {
    const api = createApi();
    const store = createProductExperienceServerState({ api });
    const route = { currentStage: "design", sessionId: "session-a" };

    const first = store.loadRoute(route);
    const second = store.loadRoute(route);
    await Promise.all([first, second]);
    await store.loadRoute(route);

    expect(api.getAuth).toHaveBeenCalledTimes(1);
    expect(api.listSessions).toHaveBeenCalledTimes(1);
    expect(api.getSnapshot).toHaveBeenCalledTimes(1);
    expect(api.getAttentionV2).toHaveBeenCalledTimes(1);
    expect(api.getProductOverview).toHaveBeenCalledTimes(1);
    expect(api.getActivity).toHaveBeenCalledTimes(1);
    expect(store.getState().active?.snapshot.data?.session.id).toBe("session-a");
  });

  it("aborts the previous route and does not publish an old snapshot after fast project changes", async () => {
    const firstSnapshot = deferred<SessionSnapshot>();
    const secondSnapshot = deferred<SessionSnapshot>();
    const snapshotSignals: AbortSignal[] = [];
    const api = createApi({
      getSnapshot: vi.fn((sessionId: string, options) => {
        if (options?.signal) {
          snapshotSignals.push(options.signal);
        }

        return sessionId === "session-a" ? firstSnapshot.promise : secondSnapshot.promise;
      }),
    });
    const store = createProductExperienceServerState({ api });

    const firstLoad = store.loadRoute({ currentStage: "define", sessionId: "session-a" });
    const secondLoad = store.loadRoute({ currentStage: "define", sessionId: "session-b" });

    secondSnapshot.resolve(createSessionSnapshot("session-b", "2026-08-03T10:05:00Z"));
    await secondLoad;
    firstSnapshot.resolve(createSessionSnapshot("session-a", "2026-08-03T10:06:00Z"));
    await firstLoad;

    expect(snapshotSignals[0]?.aborted).toBe(true);
    expect(store.getState().active?.route.sessionId).toBe("session-b");
    expect(store.getState().active?.snapshot.data?.session.id).toBe("session-b");
  });

  it("preserves the snapshot cache across back and forward stage navigation", async () => {
    const api = createApi();
    const store = createProductExperienceServerState({ api });

    await store.loadRoute({ currentStage: "design", sessionId: "session-a" });
    await store.loadRoute({ currentStage: "memory", sessionId: "session-a" });
    await store.loadRoute({ currentStage: "design", sessionId: "session-a" });

    expect(api.getSnapshot).toHaveBeenCalledTimes(1);
    expect(api.getAttentionV2).toHaveBeenCalledTimes(2);
    expect(store.getState().active?.route.currentStage).toBe("design");
    expect(store.getState().active?.snapshot.data?.session.id).toBe("session-a");
  });

  it("syncs mutation snapshots and keeps returned attention after resolving an item", async () => {
    const api = createApi();
    const store = createProductExperienceServerState({ api });

    await store.loadRoute({ currentStage: "memory", sessionId: "session-a" });
    const result = await store.resolveAttentionItem("gap-1", {
      action_kind: "answer",
      answer_text: "Usar RAG gobernado.",
    } satisfies AttentionActionRequestV2);

    expect(result.status).toBe("applied");
    expect(api.resolveAttentionItemV2).toHaveBeenCalledWith(
      "session-a",
      "gap-1",
      expect.objectContaining({ answer_text: "Usar RAG gobernado." }),
      expect.objectContaining({ signal: null }),
    );
    expect(store.getState().active?.attention.data?.total_count).toBe(0);

    await store.loadRoute({ currentStage: "memory", sessionId: "session-a" });
    expect(api.getSnapshot).toHaveBeenCalledTimes(2);
    expect(api.getAttentionV2).toHaveBeenCalledTimes(1);
  });

  it("runs Discover mutations against the active route and invalidates session resources", async () => {
    const api = createApi();
    const store = createProductExperienceServerState({ api });
    const payload = createDiscoveryPayload();

    await store.loadRoute({ currentStage: "discover", sessionId: "session-a" });
    await store.normalizeDiscovery(payload);
    await store.analyzeDiscovery(payload);
    await store.patchDiscoverArtifact("artifact-1", { note: "review" });
    await store.approveDiscoverArtifact("artifact-1", { note: "approve" });
    await store.rejectDiscoverArtifact("artifact-1", { note: "reject" });

    expect(api.normalizeDiscovery).toHaveBeenCalledWith("session-a", payload, expect.any(Object));
    expect(api.analyzeDiscovery).toHaveBeenCalledWith("session-a", payload, expect.any(Object));
    expect(api.patchJourneyArtifact).toHaveBeenCalledWith("session-a", "discover", "artifact-1", { note: "review" }, expect.any(Object));
    expect(api.approveJourneyArtifact).toHaveBeenCalledWith("session-a", "discover", "artifact-1", { note: "approve" }, expect.any(Object));
    expect(api.rejectJourneyArtifact).toHaveBeenCalledWith("session-a", "discover", "artifact-1", { note: "reject" }, expect.any(Object));
  });

  it("runs Define and Design mutations against the active route with generic stage artifacts", async () => {
    const api = createApi();
    const store = createProductExperienceServerState({ api });

    await store.loadRoute({ currentStage: "define", sessionId: "session-a" });
    await store.buildCanvas();
    await store.defineRequirements();
    await store.patchStageArtifact("define", "define-artifact", { note: "review" });
    await store.approveStageArtifact("define", "define-artifact", { note: "approve" });

    await store.loadRoute({ currentStage: "design", sessionId: "session-a" });
    await store.proposeDesign({ instructions: "Priorizar RAG gobernado." });
    await store.rejectStageArtifact("design", "design-artifact", { note: "reject" });

    expect(api.buildCanvas).toHaveBeenCalledWith("session-a", expect.any(Object));
    expect(api.defineRequirements).toHaveBeenCalledWith("session-a", expect.any(Object));
    expect(api.patchJourneyArtifact).toHaveBeenCalledWith("session-a", "define", "define-artifact", { note: "review" }, expect.any(Object));
    expect(api.approveJourneyArtifact).toHaveBeenCalledWith("session-a", "define", "define-artifact", { note: "approve" }, expect.any(Object));
    expect(api.proposeDesign).toHaveBeenCalledWith(
      "session-a",
      { instructions: "Priorizar RAG gobernado." },
      expect.any(Object),
    );
    expect(api.rejectJourneyArtifact).toHaveBeenCalledWith("session-a", "design", "design-artifact", { note: "reject" }, expect.any(Object));
  });

  it("runs Tools and Memory UXA9 mutations and syncs promoted snapshots", async () => {
    const api = createApi();
    const store = createProductExperienceServerState({ api });

    await store.loadRoute({ currentStage: "tools", sessionId: "session-a" });
    await store.recommendTools({ instructions: "Solo herramientas minimas." });
    await store.approveToolsSelection({ include_optional_tool_keys: ["document_ingestion"] });

    await store.loadRoute({ currentStage: "memory", sessionId: "session-a" });
    await store.recommendMemory({ instructions: "RAG gobernado con fuentes aprobadas." });
    await store.approveMemoryProfile({ note: "Aprobar memoria." });

    expect(api.recommendTools).toHaveBeenCalledWith(
      "session-a",
      { instructions: "Solo herramientas minimas." },
      expect.any(Object),
    );
    expect(api.approveToolsSelection).toHaveBeenCalledWith(
      "session-a",
      { include_optional_tool_keys: ["document_ingestion"] },
      expect.any(Object),
    );
    expect(api.recommendMemory).toHaveBeenCalledWith(
      "session-a",
      { instructions: "RAG gobernado con fuentes aprobadas." },
      expect.any(Object),
    );
    expect(api.approveMemoryProfile).toHaveBeenCalledWith("session-a", { note: "Aprobar memoria." }, expect.any(Object));
    expect(store.getState().active?.snapshot.data?.session.updated_at).toBe("2026-08-03T10:08:00Z");
  });
});
