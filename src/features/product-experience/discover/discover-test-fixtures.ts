import { getDiscoverSuggestionId } from "@/features/product-experience/discover/discover-model";
import type { ProductExperienceRouteSnapshot } from "@/features/product-experience/core/server-state";
import type { AttentionResponseV2 } from "@/features/attention/attention-contracts";
import type {
  DiscoveryAnalysisArtifact,
  DiscoveryArtifact,
  JourneyStageArtifactEntry,
} from "@/features/sessions/session-contracts";
import type { SessionSnapshot } from "@/features/sessions/types";

function resource<T>(data: T) {
  return {
    data,
    error: null,
    requestKey: "test",
    status: "ready" as const,
    updatedAt: Date.now(),
    version: "v1",
  };
}

export function createDiscoveryFixture(): DiscoveryArtifact {
  return {
    autonomy_level: "medium",
    case_type: "support_automation",
    constraints: ["No responder sin citar fuente"],
    current_process: "El analista busca politicas y responde tickets repetitivos manualmente.",
    current_user: "Analista de soporte",
    desired_outcome: "Reducir tiempo de respuesta manteniendo trazabilidad.",
    mvp_definition: {
      non_delegable_decisions: ["Aprobar excepciones financieras"],
      north_star_metric: "Tiempo promedio de resolucion",
      out_of_scope: ["Ejecutar reembolsos autonomos"],
      v1_scope: ["Clasificar solicitud", "Recuperar respuesta", "Proponer respuesta"],
    },
    operational_baseline: {
      automation_opportunities: ["Recuperar politicas", "Redactar respuesta inicial"],
      current_cost: "Impacto moderado en tiempo y calidad",
      current_time_spent: "Entre 2 y 8 horas por semana",
      frequent_errors: ["Respuestas inconsistentes"],
    },
    problem_statement: "El equipo de soporte recibe solicitudes repetitivas y tarda en encontrar la respuesta correcta.",
    value_statement: "Automatizar soporte repetitivo sin perder control humano.",
  };
}

export function createAnalysisFixture(discovery = createDiscoveryFixture()): DiscoveryAnalysisArtifact {
  return {
    ambiguities: [],
    assumptions: [],
    confidence: 0.86,
    deferred_resolution_items: [
      {
        kind: "business_clarification",
        question: "Definir el grupo de usuarios prioritario para la primera version.",
        reason: "No bloquea Discover porque el problema y el alcance minimo ya son comprensibles.",
        recommendation: "Usar soporte operativo como usuario inicial y confirmar el segmento en Define.",
        source_refs: ["discovery.problem_statement"],
        source_stage: "discover",
        target_stage: "define",
      },
    ],
    domain_signals: [],
    evidence_refs: ["session.discovery"],
    facts: [
      {
        confidence: 0.9,
        key: "fact-1",
        source_refs: ["discovery.problem_statement"],
        statement: "El problema se concentra en soporte repetitivo.",
      },
    ],
    inferred_needs: [
      {
        confidence: 0.82,
        key: "need-1",
        source_refs: ["discovery.desired_outcome"],
        statement: "El agente necesita recuperacion de conocimiento con trazabilidad.",
      },
    ],
    missing_information: [],
    normalized_discovery_candidate: discovery,
    open_questions: [
      {
        blocking_stages: ["define"],
        key: "q1",
        priority: "high",
        question: "Que politicas son fuente oficial?",
        rationale: "Define el set minimo de conocimiento confiable.",
        suggested_answer: "Base de conocimiento aprobada por soporte.",
      },
    ],
    quality_gate: {
      blocking: false,
      blocking_resolution: 0,
      capability: "analyze_discovery",
      delegated_resolution: 1,
      evidence_confidence: 0.73,
      evidence_penalty_count: 1,
      flow_readiness: true,
      issues: [],
      language_status: "ok",
      minimum_repair_cycles: 2,
      pending_resolution: 1,
      quality_confidence: 0.85,
      quality_gate_version: "quality-gate.v1",
      quality_repair_cycles: 0,
      reason_summary: "La salida paso el gate de calidad provider-neutral.",
      repair_policy: "document_and_delegate",
      schema_status: "valid",
      should_repair: false,
      stage: "discover",
      warnings: [],
    },
    risk_signals: [],
    schema_version: "discovery-analysis.v1",
    sensitive_data_signals: [],
    summary: "Discovery consistente para construir Definir.",
  };
}

export function createDiscoverArtifactFixture(
  overrides: Partial<JourneyStageArtifactEntry> = {},
): JourneyStageArtifactEntry {
  const analysis = createAnalysisFixture();

  return {
    approved_at: null,
    approved_by_user_id: null,
    artifact_kind: "discovery_analysis_artifact",
    based_on_artifact_id: null,
    confidence: analysis.confidence,
    context_fingerprint: "ctx",
    corpus_hash: "corpus",
    created_at: "2026-08-03T10:00:00Z",
    decisions: [],
    evidence_manifest: [],
    execution_backend: "codex",
    id: "discover-artifact-1",
    input_fingerprint: "input",
    missing_information: [],
    model: "gpt-5.5",
    output_fingerprint: "output",
    prompt_version: "analyze_discovery.v1",
    proposal_payload: analysis as unknown as Record<string, unknown>,
    provider_key: "codex-cli",
    rejected_at: null,
    reviewed_at: null,
    schema_version: "discovery-analysis.v1",
    session_id: "session-uxa7",
    source_action: "analyze_discovery",
    source_stage_versions: {},
    stage_key: "discover",
    stale_at: null,
    stale_reasons: [],
    state: "generated",
    superseded_by_artifact_id: null,
    updated_at: "2026-08-03T10:02:00Z",
    user_patch: {
      review_decisions: {
        [getDiscoverSuggestionId("question", "q1", 0)]: "accepted",
      },
    },
    version_number: 1,
    warnings: [],
    workspace_id: "workspace-1",
    ...overrides,
  };
}

export function createDiscoverRouteFixture({
  artifact = createDiscoverArtifactFixture(),
  discovery = createDiscoveryFixture(),
}: {
  artifact?: JourneyStageArtifactEntry | null;
  discovery?: DiscoveryArtifact | null;
} = {}): ProductExperienceRouteSnapshot {
  const snapshot: SessionSnapshot = {
    activity: [],
    alert_events: [],
    approvals: [],
    artifact_records: [],
    blueprint: null,
    blueprint_versions: [],
    canvas: null,
    contract_version: "session-snapshot.v1",
    discovery,
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
    journey_artifacts: artifact ? [artifact] : [],
    journey_latest_artifacts: artifact ? { discover: artifact } : {},
    metric_snapshots: [],
    project_actuals: [],
    session: {
      commercial_tier: "blueprint",
      created_at: "2026-08-03T10:00:00Z",
      current_stage: "normalize_discovery",
      id: "session-uxa7",
      status: "needs_review",
      title: "Soporte repetitivo",
      updated_at: "2026-08-03T10:03:00Z",
      workspace_id: "workspace-1",
    },
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

  const attention: AttentionResponseV2 = {
    actionable_count: 0,
    blocking_count: 0,
    contract_version: "attention.v2",
    counts_by_product: {},
    counts_by_stage: {},
    counts_by_type: {},
    current_stage: "discover",
    cursor: "",
    generated_at: "2026-08-03T10:05:00Z",
    info_count: 0,
    items: [],
    primary_item: null,
    session_id: "session-uxa7",
    total_count: 0,
    warning_count: 0,
    workspace_id: "workspace-1",
  };

  return {
    attention: resource(attention),
    auth: resource(null as never),
    list: resource({ items: [snapshot.session] }),
    operation: resource({
      activity: null,
      overview: {
        access: {} as never,
        active_stage: "discover",
        attention: [],
        contract_version: "product-overview.v1",
        exports: [],
        generated_at: "2026-08-03T10:04:00Z",
        lean_progress_percent: 12,
        navigation: [],
        products: [],
        project_title: "Soporte repetitivo",
        session_id: "session-uxa7",
        workspace_id: "workspace-1",
      },
      stageOperation: null,
    }),
    requestId: 1,
    route: {
      currentStage: "discover",
      sessionId: "session-uxa7",
    },
    snapshot: resource(snapshot),
  };
}
