import { createDiscoverArtifactFixture, createDiscoveryFixture } from "@/features/product-experience/discover/discover-test-fixtures";
import type { AttentionResponseV2 } from "@/features/attention/attention-contracts";
import type { ProductExperienceRouteSnapshot } from "@/features/product-experience/core/server-state";
import type {
  DefinitionArtifact,
  DesignRecommendationArtifact,
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

export function createDefinitionArtifactPayload(): DefinitionArtifact {
  return {
    acceptance_criteria: [
      {
        acceptance: ["El criterio se valida con un caso de soporte real."],
        criterion: "El agente propone respuesta citando fuente oficial.",
        key: "AC-01",
        priority: "high",
        rationale: "Evita respuestas sin trazabilidad.",
        requirement_keys: ["FR-01"],
        source_refs: ["discovery.desired_outcome"],
        status: "accepted",
        title: "Respuesta con fuente",
      },
    ],
    assumptions: [
      {
        acceptance: ["El owner confirma fuente oficial."],
        assumption: "Existe una base de conocimiento aprobada por soporte.",
        key: "ASM-01",
        priority: "medium",
        rationale: "Permite construir recuperacion sin inventar politicas.",
        source_refs: ["discovery.constraints"],
        status: "accepted",
        title: "Base oficial disponible",
      },
    ],
    business_rules: [
      {
        acceptance: ["No se ejecutan reembolsos autonomos."],
        key: "BR-01",
        owner: "Soporte",
        priority: "high",
        rationale: "Mantiene decisiones no delegables fuera del agente.",
        rule: "Escalar cualquier excepcion financiera a un supervisor humano.",
        source_refs: ["discovery.mvp_definition.non_delegable_decisions"],
        status: "accepted",
        title: "Escalamiento financiero",
      },
    ],
    canvas_projection: {
      agent_profile: {
        agent_task: "Clasificar solicitudes y proponer respuestas trazables.",
        allowed_decisions: ["Clasificar intencion", "Proponer respuesta"],
        expected_outputs: ["Respuesta sugerida", "Citas de fuente", "Motivo de escalamiento"],
        human_approvals: ["Excepciones financieras"],
        key_inputs: ["Ticket", "Politicas", "Historial de caso"],
        mission: "Resolver solicitudes repetitivas con trazabilidad.",
        primary_user: "Analista de soporte",
        prohibited_decisions: ["Ejecutar reembolsos", "Cambiar contratos"],
        success_metrics: ["Tiempo promedio de resolucion", "Tasa de escalamiento correcto"],
      },
      mvp_scope: ["Clasificar ticket", "Recuperar politica", "Proponer respuesta"],
      out_of_scope: ["Ejecutar pagos"],
      primary_risk: "Usar conocimiento desactualizado.",
      success_metric: "Reducir 40% el tiempo de respuesta.",
      user_goal: "Responder solicitudes repetitivas con calidad consistente.",
    },
    confidence: 0.88,
    dependencies: [
      {
        acceptance: ["Fuente versionada e inventariada."],
        dependency: "Repositorio de politicas aprobado.",
        dependency_type: "knowledge",
        key: "DEP-01",
        owner: "Soporte",
        priority: "high",
        rationale: "El agente necesita evidencia confiable.",
        source_refs: ["discovery.constraints"],
        status: "accepted",
        title: "Fuente de conocimiento",
      },
    ],
    evidence_refs: ["session.discovery", "memory.long_term.docs"],
    functional_requirements: [
      {
        acceptance: ["Clasifica con confianza y explica fuente de intencion."],
        actor: "Analista de soporte",
        exceptions: ["Ticket ambiguo requiere pregunta al usuario."],
        happy_path: "El usuario ingresa un ticket y recibe clasificacion y respuesta sugerida.",
        key: "FR-01",
        priority: "high",
        rationale: "Es la capacidad central del MVP.",
        requirement: "Clasificar solicitudes repetitivas y proponer una respuesta trazable.",
        source_refs: ["discovery.problem_statement"],
        status: "accepted",
        title: "Clasificacion y respuesta",
        trigger: "Nuevo ticket de soporte",
      },
    ],
    measurable_objectives: ["Reducir 40% el tiempo de respuesta", "Mantener 95% de respuestas con cita"],
    non_functional_requirements: [
      {
        acceptance: ["Respuesta visible en menos de 8 segundos p95."],
        category: "performance",
        key: "NFR-01",
        metric: "latency_p95_seconds",
        priority: "high",
        rationale: "El analista necesita fluidez operacional.",
        requirement: "Responder en una ventana aceptable para soporte.",
        source_refs: ["discovery.operational_baseline"],
        status: "accepted",
        target: "<= 8 segundos",
        title: "Latencia p95",
      },
    ],
    open_questions: [
      {
        acceptance: ["Owner de conocimiento confirmado."],
        blocking: false,
        impacted_sections: ["tools", "memory"],
        key: "Q-01",
        priority: "medium",
        question: "Quien aprueba refresh de documentos fuente?",
        rationale: "Define gobierno de conocimiento.",
        source_refs: ["discovery.constraints"],
        status: "needs_input",
        suggested_answer: "Lider de soporte con revision mensual.",
        title: "Owner de refresh",
      },
    ],
    schema_version: "definition-artifact.v1",
    summary: "El agente asistira soporte repetitivo con RAG gobernado, control humano y trazabilidad.",
    traceability: [
      {
        coverage_status: "covered",
        key: "TR-01",
        rationale: "FR-01 cubre el problema principal de soporte repetitivo.",
        requirement_key: "FR-01",
        source_ref: "discovery.problem_statement",
      },
    ],
    validation: {
      blocking_issues: [],
      blocking_open_questions: [],
      contradictions: [],
      coverage_ratio: 1,
      duplicate_keys: [],
      duplicate_signals: [],
      missing_acceptance: [],
      untraced_items: [],
      vague_nfrs: [],
    },
  };
}

export function createDefineArtifactFixture(overrides: Partial<JourneyStageArtifactEntry> = {}): JourneyStageArtifactEntry {
  const payload = createDefinitionArtifactPayload();
  return {
    ...createDiscoverArtifactFixture(),
    artifact_kind: "definition_artifact",
    confidence: payload.confidence,
    id: "define-artifact-1",
    prompt_version: "define_requirements.v1",
    proposal_payload: payload as unknown as Record<string, unknown>,
    schema_version: "definition-artifact.v1",
    source_action: "define_requirements",
    stage_key: "define",
    state: "generated",
    ...overrides,
  };
}

export function createDesignArtifactPayload(): DesignRecommendationArtifact {
  return {
    alternatives: [
      {
        alternative_key: "rag_supervisor",
        approval_points: ["Aprobacion humana en excepciones financieras"],
        architecture: "Supervisor con recuperacion RAG y herramienta de respuesta asistida.",
        assumptions: ["La fuente de conocimiento esta versionada."],
        blueprint_projection: {
          architecture: "Orquestador central + retrieval + guardrails de decision.",
          guardrails: ["No ejecutar acciones irreversibles", "Citar fuente aprobada"],
          narrative: "El agente clasifica, recupera evidencia y redacta una respuesta sugerida.",
          reasoning_pattern: "Plan-act-review con verificacion de evidencia.",
          safety_checks: [],
        },
        concurrency_strategy: "Procesamiento secuencial por ticket con cache de consulta.",
        coordination_model: "Supervisor unico con capacidades especializadas.",
        decision_policy: "Decidir bajo confianza alta; escalar si falta evidencia.",
        escalation_conditions: ["Evidencia contradictoria", "Solicitud financiera"],
        evidence_refs: ["FR-01", "NFR-01"],
        failure_modes: [
          {
            compensation_strategy: "Pedir revision humana.",
            idempotency_notes: "No persiste acciones externas irreversibles.",
            retry_strategy: "Reintentar retrieval con query expandida una vez.",
            scenario: "Fuente no encontrada",
          },
        ],
        fit_rationale: ["Cubre trazabilidad", "Reduce sobreaprovisionamiento"],
        fit_score: 91,
        handoffs: [
          {
            approval_required: true,
            from_role: "retrieval_agent",
            payload: "Evidencia y confianza",
            to_role: "human_reviewer",
            trigger: "Confianza baja o regla no delegable",
          },
        ],
        label: "Supervisor RAG gobernado",
        maintainability: "media",
        operational_complexity: "media",
        reasoning_pattern: "Plan-act-review",
        relative_cost: "medio",
        roles: [
          {
            key: "supervisor",
            limits: ["No aprueba excepciones financieras"],
            responsibility: "Coordinar clasificacion, retrieval y respuesta.",
            title: "Supervisor",
          },
        ],
        security_notes: ["Minimizar PII en prompts"],
        summary: "Mejor balance entre control, trazabilidad y costo.",
        topology: "single-supervisor",
        tradeoffs: ["Menor paralelismo, mayor gobernanza"],
      },
      {
        alternative_key: "multi_agent",
        approval_points: ["Aprobacion de handoff entre agentes"],
        architecture: "Equipo multiagente con clasificador, investigador y redactor.",
        assumptions: ["Volumen alto justifica coordinacion adicional."],
        blueprint_projection: {
          architecture: "Orquestador multiagente con roles especializados.",
          guardrails: ["Control de handoff", "Budget por consulta"],
          narrative: "Especializa pasos para casos complejos.",
          reasoning_pattern: "Decomposition + critic",
          safety_checks: [],
        },
        concurrency_strategy: "Fan-out controlado para retrieval y critic.",
        coordination_model: "Multiagente jerarquico",
        decision_policy: "Consenso entre clasificador y critic.",
        escalation_conditions: ["Conflicto entre agentes"],
        evidence_refs: ["FR-01"],
        failure_modes: [],
        fit_rationale: ["Potente para casos complejos", "Mayor costo"],
        fit_score: 78,
        handoffs: [],
        label: "Equipo multiagente",
        maintainability: "alta",
        operational_complexity: "alta",
        reasoning_pattern: "Decomposition + critic",
        relative_cost: "alto",
        roles: [],
        security_notes: [],
        summary: "Mas capacidad, pero sobreaprovisiona el MVP.",
        topology: "hierarchical-team",
        tradeoffs: ["Mas complejidad operacional"],
      },
    ],
    confidence: {
      band: "high",
      overall: 0.84,
      rationale: "Discovery y Definir tienen cobertura suficiente.",
    },
    critic_findings: [],
    decision_rationale: "Se recomienda supervisor RAG por menor complejidad y alta trazabilidad.",
    evidence_refs: ["define.FR-01", "define.NFR-01"],
    fit_matrix: [
      {
        category: "functional",
        priority: "high",
        requirement_key: "FR-01",
        requirement_title: "Clasificacion y respuesta",
        scores: [
          {
            alternative_key: "rag_supervisor",
            coverage_status: "covered",
            rationale: "Cubre clasificacion, retrieval y respuesta.",
            score: 0.92,
          },
          {
            alternative_key: "multi_agent",
            coverage_status: "covered",
            rationale: "Cubre con mayor complejidad.",
            score: 0.82,
          },
        ],
      },
    ],
    missing_information: [],
    open_questions: [],
    recommended_alternative_key: "rag_supervisor",
    remediation_summary: "Sin remediaciones bloqueantes.",
    requirements_coverage: [
      {
        category: "functional",
        coverage_status: "covered",
        priority: "high",
        rationale: "La alternativa cubre clasificacion y respuesta.",
        requirement_key: "FR-01",
        requirement_title: "Clasificacion y respuesta",
        source_refs: ["define.FR-01"],
      },
    ],
    review_state: "generated",
    schema_version: "design-recommendation.v1",
    selected_design: null,
    summary: "Diseno recomendado con supervisor RAG gobernado.",
  };
}

export function createDesignArtifactFixture(overrides: Partial<JourneyStageArtifactEntry> = {}): JourneyStageArtifactEntry {
  const payload = createDesignArtifactPayload();
  return {
    ...createDiscoverArtifactFixture(),
    artifact_kind: "design_recommendation_artifact",
    confidence: payload.confidence.overall,
    id: "design-artifact-1",
    prompt_version: "propose_design.v1",
    proposal_payload: payload as unknown as Record<string, unknown>,
    schema_version: "design-recommendation.v1",
    source_action: "propose_design",
    stage_key: "design",
    state: "generated",
    ...overrides,
  };
}

export function createDefineRouteFixture({
  defineArtifact = createDefineArtifactFixture(),
  designArtifact = null,
  discoverArtifact = createDiscoverArtifactFixture({ state: "approved" }),
  stage = "define",
}: {
  defineArtifact?: JourneyStageArtifactEntry | null;
  designArtifact?: JourneyStageArtifactEntry | null;
  discoverArtifact?: JourneyStageArtifactEntry | null;
  stage?: "define" | "design";
} = {}): ProductExperienceRouteSnapshot {
  const journeyArtifacts = [discoverArtifact, defineArtifact, designArtifact].filter(Boolean) as JourneyStageArtifactEntry[];
  const latest: Record<string, JourneyStageArtifactEntry> = {};
  for (const artifact of journeyArtifacts) {
    latest[artifact.stage_key] = artifact;
  }

  const snapshot: SessionSnapshot = {
    activity: [],
    alert_events: [],
    approvals: [],
    artifact_records: [],
    blueprint: null,
    blueprint_versions: [],
    canvas: null,
    contract_version: "session-snapshot.v1",
    discovery: createDiscoveryFixture(),
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
    journey_artifacts: journeyArtifacts,
    journey_latest_artifacts: latest,
    metric_snapshots: [],
    project_actuals: [],
    session: {
      commercial_tier: "blueprint",
      created_at: "2026-08-03T10:00:00Z",
      current_stage: stage === "define" ? "build_canvas" : "build_blueprint",
      id: "session-uxa8",
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
    current_stage: stage,
    cursor: "",
    generated_at: "2026-08-03T10:05:00Z",
    info_count: 0,
    items: [],
    primary_item: null,
    session_id: "session-uxa8",
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
        active_stage: stage,
        attention: [],
        contract_version: "product-overview.v1",
        exports: [],
        generated_at: "2026-08-03T10:04:00Z",
        lean_progress_percent: stage === "define" ? 25 : 38,
        navigation: [],
        products: [],
        project_title: "Soporte repetitivo",
        session_id: "session-uxa8",
        workspace_id: "workspace-1",
      },
      stageOperation: null,
    }),
    requestId: 1,
    route: {
      currentStage: stage,
      sessionId: "session-uxa8",
    },
    snapshot: resource(snapshot),
  };
}
