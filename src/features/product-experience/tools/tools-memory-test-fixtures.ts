import {
  createDefineArtifactFixture,
  createDefineRouteFixture,
  createDesignArtifactFixture,
} from "@/features/product-experience/define/define-test-fixtures";
import type { ProductExperienceRouteSnapshot } from "@/features/product-experience/core/server-state";
import type {
  ApprovedToolsDigest,
  JourneyStageArtifactEntry,
  MemoryRecommendationArtifact,
  ToolRecommendationArtifact,
} from "@/features/sessions/session-contracts";

export function createApprovedToolsDigest(overrides: Partial<ApprovedToolsDigest> = {}): ApprovedToolsDigest {
  return {
    approval_required_tool_keys: [],
    approved_tool_keys: ["knowledge_retrieval", "document_ingestion"],
    digest_sha256: "tools-digest",
    digest_version: "approved-tools-digest.v1",
    knowledge_tool_keys: ["knowledge_retrieval"],
    mandatory_tool_keys: ["knowledge_retrieval"],
    memory_hints: ["approved_tools_only", "rag_lineage_required"],
    optional_tool_keys: ["document_ingestion"],
    promoted_blueprint_version: 3,
    recommended_memory_strategy: "knowledge_rag",
    retrieval_scopes: ["approved_tools_digest", "knowledge_sources"],
    selected_blueprint_tool_names: ["Knowledge Retrieval", "Document Ingestion"],
    side_effect_tool_keys: [],
    source_blueprint_version: 2,
    source_session_id: "session-uxa9",
    summary: "Tools aprobadas para retrieval, ingesta y trazabilidad RAG.",
    tool_count: 2,
    ...overrides,
  };
}

export function createToolRecommendationPayload(
  overrides: Partial<ToolRecommendationArtifact> = {},
): ToolRecommendationArtifact {
  return {
    approved_tools_digest: null,
    candidate_tool_patterns: [],
    capability_resolutions: [],
    confidence: {
      band: "high",
      overall: 0.87,
      rationale: "Design y Define cubren el flujo de soporte repetitivo.",
    },
    context_digest: {
      constraints_summary: "No ejecutar side effects sin aprobacion.",
      digest_sha256: "context-tools",
      source_refs: ["define.FR-01", "design.rag_supervisor"],
      workflow_summary: "Clasificar ticket, recuperar politica y proponer respuesta.",
    },
    coverage_gaps: [],
    design_role_coverage: [
      {
        coverage_status: "covered",
        covered_by_tool_keys: ["knowledge_retrieval"],
        rationale: "El supervisor necesita evidencia aprobada.",
        responsibility: "Recuperar politicas confiables.",
        role_key: "retrieval_agent",
        role_title: "Retrieval Agent",
        source_refs: ["design.roles"],
      },
    ],
    evaluation: {
      compatibility_status: "complete",
      coverage_status: "complete",
      findings: [],
      governance_status: "complete",
      minimality_status: "complete",
      overall_status: "complete",
      promotion_blocked: false,
      recommended_actions: [],
      summary: "Set minimo listo para promover.",
    },
    is_stale: false,
    needs_information: [],
    optional_tools: [
      {
        capability_covered: "Ingesta y refresh de documentos fuente.",
        classification: "optional",
        confidence: 0.79,
        contract_seed: {
          approval_reason: "Controlar lineage de fuentes RAG.",
          compensation_strategy: "Reintentar ingesta o escalar a owner documental.",
          execution_mode: "async",
          failure_mode: "Fuente no parseable",
          has_side_effects: false,
          integration_kind: "document_pipeline",
          inputs: ["source_uri", "metadata"],
          name: "Document Ingestion",
          owner: "Knowledge Ops",
          outputs: ["document_chunks", "lineage"],
          purpose: "Ingerir documentos aprobados para retrieval.",
          request_schema: {
            type: "object",
            properties: {
              metadata: { type: "object", description: "Metadatos de owner, sensibilidad y version." },
              source_uri: { type: "string", description: "URI del documento o repositorio aprobado." },
            },
            required: ["source_uri"],
          },
          response_schema: {
            type: "object",
            properties: {
              document_chunks: { type: "array", description: "Chunks generados para retrieval." },
              lineage: { type: "object", description: "Trazabilidad de la ingesta." },
            },
            required: ["document_chunks", "lineage"],
          },
          requires_approval: false,
          retry_strategy: "retry_once",
          risk_level: "medium",
          usage_examples: [
            {
              request: { metadata: { owner: "Knowledge Ops" }, source_uri: "kb://support/policies" },
              response: { document_chunks: ["chunk-1"], lineage: { source_uri: "kb://support/policies" } },
            },
          ],
          validations: ["source_owner_required"],
        },
        decision_reason: "Necesaria si se habilita RAG con refresh gobernado.",
        dependencies: ["knowledge_retrieval"],
        incompatibilities: [],
        redundant_with: [],
        source_evidence: ["memory.rag_required"],
        tool_key: "document_ingestion",
        tool_label: "Document Ingestion",
      },
    ],
    preflight: {
      agent_goal: "Reducir respuesta repetitiva con trazabilidad.",
      approval_boundaries: ["No ejecutar reembolsos"],
      candidate_tool_families: [],
      case_classification: "support_automation",
      core_workflows: ["classify", "retrieve", "draft"],
      design_memory_implications: ["checkpoint_resume"],
      design_tool_implications: ["knowledge_retrieval"],
      forbidden_capabilities: ["payments"],
      hard_constraints: ["cite_sources"],
      interaction_modes: ["human_assisted"],
      mandatory_capabilities: [
        {
          capability_key: "retrieve_policy",
          confidence: 0.9,
          label: "Recuperar politica",
          reason: "El agente debe citar fuentes.",
          required: true,
          source_evidence: ["define.FR-01"],
        },
      ],
      missing_information: [],
      primary_user: "Analista de soporte",
      required_information_sources: ["Politicas aprobadas"],
      required_write_actions: [],
    },
    recommended_tools: [
      {
        capability_covered: "Recuperacion de conocimiento aprobado.",
        classification: "mandatory",
        confidence: 0.92,
        contract_seed: {
          approval_reason: "Permite fundamentar respuestas.",
          compensation_strategy: "Escalar si no hay evidencia.",
          execution_mode: "sync",
          failure_mode: "No evidence",
          has_side_effects: false,
          integration_kind: "retrieval",
          inputs: ["query", "filters"],
          name: "Knowledge Retrieval",
          owner: "Support Knowledge",
          outputs: ["sources", "snippets", "confidence"],
          purpose: "Recuperar politicas aprobadas.",
          request_schema: {
            type: "object",
            properties: {
              filters: { type: "object", description: "Filtros por fuente aprobada, dominio o sensibilidad." },
              query: { type: "string", description: "Pregunta o consulta del agente." },
              top_k: { type: "integer", description: "Numero maximo de fragmentos a recuperar." },
            },
            required: ["query"],
          },
          response_schema: {
            type: "object",
            properties: {
              confidence: { type: "number", description: "Confianza agregada de la recuperacion." },
              snippets: { type: "array", description: "Fragmentos relevantes recuperados." },
              sources: { type: "array", description: "Fuentes aprobadas usadas como evidencia." },
            },
            required: ["sources", "snippets"],
          },
          requires_approval: false,
          retry_strategy: "query_expansion_once",
          risk_level: "low",
          usage_examples: [
            {
              request: { filters: { approved: true }, query: "Politica de vacaciones", top_k: 3 },
              response: { confidence: 0.91, snippets: ["El colaborador debe..."], sources: ["policy-vacations-v2"] },
            },
          ],
          validations: ["citation_required"],
        },
        decision_reason: "Obligatoria para respuestas trazables.",
        dependencies: [],
        incompatibilities: [],
        redundant_with: [],
        source_evidence: ["define.FR-01", "design.guardrails"],
        tool_key: "knowledge_retrieval",
        tool_label: "Knowledge Retrieval",
      },
    ],
    rejected_tools: [
      {
        capability_covered: "Ejecutar cambios transaccionales.",
        classification: "unnecessary",
        confidence: 0.81,
        contract_seed: null,
        decision_reason: "Fuera del alcance del MVP y decision no delegable.",
        dependencies: [],
        incompatibilities: [],
        redundant_with: [],
        source_evidence: ["discovery.out_of_scope"],
        tool_key: "transactional_write",
        tool_label: "Transactional Write",
      },
    ],
    requirements_coverage: [
      {
        category: "functional",
        coverage_status: "covered",
        covered_by_tool_keys: ["knowledge_retrieval"],
        priority: "high",
        rationale: "FR-01 requiere retrieval para responder con fuente.",
        requirement_key: "FR-01",
        requirement_title: "Clasificacion y respuesta",
        source_refs: ["define.FR-01"],
      },
    ],
    review_decisions: [],
    review_state: "partial",
    schema_version: "tool-recommendation.v1",
    source_stage_versions: {
      define: 1,
      design: 1,
      discover: 1,
    },
    stale_reasons: [],
    summary: "Set minimo: retrieval obligatorio y document ingestion opcional para RAG gobernado.",
    ...overrides,
  };
}

export function createToolsArtifactFixture(overrides: Partial<JourneyStageArtifactEntry> = {}): JourneyStageArtifactEntry {
  const payload = createToolRecommendationPayload();
  return {
    ...createDesignArtifactFixture(),
    artifact_kind: "tool_recommendation_artifact",
    confidence: payload.confidence.overall,
    id: "tools-artifact-1",
    prompt_version: "recommend_tools.v1",
    proposal_payload: payload as unknown as Record<string, unknown>,
    schema_version: "tool-recommendation.v1",
    source_action: "recommend_tools",
    stage_key: "tools",
    state: "generated",
    ...overrides,
  };
}

export function createMemoryRecommendationPayload(
  overrides: Partial<MemoryRecommendationArtifact> = {},
): MemoryRecommendationArtifact {
  return {
    architecture_resolution: {
      checkpoint_strategy: "Retomar desde el ultimo checkpoint consistente por ticket.",
      context_budget: "summary_plus_refs con top_k gobernado.",
      dependency_gaps: [],
      evidence_refs: ["approved_tools_digest"],
      memory_mode: "semantic_rag",
      required_for_pattern: true,
      retention_policy: "90 dias con borrado logico.",
      source_strategy: "knowledge_rag",
    },
    confidence: {
      band: "high",
      overall: 0.84,
      rationale: "Tools aprobadas soportan retrieval e ingesta.",
    },
    context_budget_plan: [
      {
        max_context_tokens: 2400,
        max_retrieved_sources: 5,
        max_short_term_items: 8,
        role: "supervisor",
        source_refs: ["approved_tools_digest"],
        strategy: "summary_plus_refs",
        task_kind: "answer_support_ticket",
      },
    ],
    critic_findings: [],
    dependency_gaps: [],
    dry_compile_status: {
      blocking_issues: [],
      generated_contracts: ["memory_profile", "knowledge_profile"],
      status: "passed",
      summary: "La memoria compila con tools aprobadas.",
    },
    evidence_refs: ["approved_tools_digest", "define.FR-01"],
    is_stale: false,
    knowledge_design: {
      approved_sources: [
        {
          description: "Politicas operativas aprobadas.",
          key: "support-policy",
          license: "internal",
          owner: "Support Knowledge",
          sensitivity: "internal",
          source_type: "document_repository",
          source_version: "2026.08",
          title: "Politicas soporte",
          uri: "kb://support/policies",
        },
      ],
      embedding_policy: {
        dimensions: 1536,
        model: "text-embedding",
        provider: "runtime-provider",
        version: "v1",
      },
      grounding_policy: {
        citations_policy: "Citar fuente aprobada en cada respuesta.",
        confidence_policy: "Escalar bajo confianza < 0.75.",
        contradictory_evidence_behavior: "Escalar a humano.",
        no_evidence_behavior: "No responder sin evidencia.",
      },
      ingestion_policy: {
        chunking_policy: "semantic_chunks_800",
        exclude_filters: ["draft"],
        include_filters: ["approved"],
        metadata_fields: ["owner", "version", "sensitivity"],
        parser: "document_ingestion",
      },
      mode: "rag",
      notes: ["Usar solo fuentes aprobadas."],
      rag_required: true,
      refresh_policy: {
        deletion_policy: "soft_delete_with_lineage",
        expiration_policy: "owner_review",
        frequency: "monthly",
        triggers: ["source_updated"],
      },
      retrieval_policy: {
        fallback_behavior: "ask_human",
        filters: ["approved:true"],
        reranking_policy: "semantic_rerank",
        search_mode: "hybrid",
        top_k: 5,
      },
      source_scope: "support_knowledge",
      summary: "RAG gobernado por fuentes aprobadas y lineage.",
    },
    long_term_design: {
      compaction_policy: "decision_summaries",
      label: "Memoria largo plazo",
      layer_key: "long_term",
      owner: "Support Knowledge",
      read_paths: ["decisions", "source_lineage"],
      retention_policy: "90 dias",
      stores: ["vector_store", "artifact_store"],
      summary: "Conserva decisiones y conocimiento aprobado.",
      write_triggers: ["approval", "source_refresh"],
    },
    memory_need_decision: {
      mode: "knowledge_rag",
      rationale: "El agente necesita recuperar politicas aprobadas con trazabilidad.",
      required: true,
      source_refs: ["define.FR-01"],
      summary: "Memoria y RAG requeridos.",
    },
    missing_information: [],
    open_questions: [],
    proposed_knowledge_profile: {
      mode: "rag",
      notes: "Fuentes aprobadas solamente.",
      sources: [],
    },
    proposed_memory_profile: {
      goal_drift_guard: "Revisar contra objetivo de soporte.",
      retrieval_policy: "RAG con filtros por fuente aprobada.",
      review_trigger: "Baja confianza o contradiccion.",
      storage_layers: ["short_term", "long_term", "vector"],
      strategy: "knowledge_rag",
      ttl_policy: "90_dias",
      write_policy: "Persistir decisiones aprobadas y resumenes compactos.",
    },
    retention_and_deletion: [
      {
        deletion_policy: "soft_delete",
        residency: "workspace",
        retention_policy: "90 dias",
        scope: "decision_memory",
        source_refs: ["privacy"],
        ttl_policy: "90_dias",
      },
    ],
    review_state: "partial",
    schema_version: "memory-recommendation.v1",
    sensitivity_and_isolation: [
      {
        data_classes: ["internal"],
        isolation_mode: "workspace",
        restrictions: ["no_cross_tenant"],
        scope: "knowledge",
        source_refs: ["tenant_policy"],
      },
    ],
    short_term_design: {
      compaction_policy: "rolling_summary",
      label: "Memoria corta",
      layer_key: "short_term",
      owner: "runtime",
      read_paths: ["current_ticket"],
      retention_policy: "session",
      stores: ["conversation_state"],
      summary: "Contexto inmediato compactado.",
      write_triggers: ["user_message", "tool_result"],
    },
    source_stage_versions: {
      define: 1,
      design: 1,
      discover: 1,
      tools: 1,
    },
    stale_reasons: [],
    summary: "Memoria knowledge_rag con presupuesto de contexto y fuentes aprobadas.",
    tool_dependencies: [
      {
        capabilities: ["retrieve"],
        reason: "Necesario para grounding.",
        required: true,
        status: "approved",
        tool_key: "knowledge_retrieval",
      },
      {
        capabilities: ["ingest", "refresh"],
        reason: "Necesario para lineage de fuentes RAG.",
        required: true,
        status: "approved",
        tool_key: "document_ingestion",
      },
    ],
    working_memory_design: {
      compaction_policy: "task_summary",
      label: "Memoria de trabajo",
      layer_key: "working_memory",
      owner: "runtime",
      read_paths: ["active_reasoning"],
      retention_policy: "task",
      stores: ["scratchpad"],
      summary: "Estado temporal por ticket.",
      write_triggers: ["planning_step"],
    },
    write_read_matrix: [
      {
        compact_when: "Al cerrar ticket",
        do_not_write_when: "Sin aprobacion o datos sensibles",
        owner: "runtime",
        read_when: "Al generar respuesta",
        scope: "ticket_context",
        write_when: "Despues de aprobacion",
      },
    ],
    ...overrides,
  };
}

export function createMemoryArtifactFixture(overrides: Partial<JourneyStageArtifactEntry> = {}): JourneyStageArtifactEntry {
  const payload = createMemoryRecommendationPayload();
  return {
    ...createToolsArtifactFixture(),
    artifact_kind: "memory_recommendation_artifact",
    confidence: payload.confidence.overall,
    id: "memory-artifact-1",
    prompt_version: "recommend_memory.v1",
    proposal_payload: payload as unknown as Record<string, unknown>,
    schema_version: "memory-recommendation.v1",
    source_action: "recommend_memory",
    stage_key: "memory",
    state: "generated",
    ...overrides,
  };
}

export function createToolsRouteFixture({
  memoryArtifact = null,
  stage = "tools",
  toolsArtifact = createToolsArtifactFixture(),
}: {
  memoryArtifact?: JourneyStageArtifactEntry | null;
  stage?: "tools" | "memory";
  toolsArtifact?: JourneyStageArtifactEntry | null;
} = {}): ProductExperienceRouteSnapshot {
  const route = createDefineRouteFixture({
    defineArtifact: createDefineArtifactFixture({ state: "approved" }),
    designArtifact: createDesignArtifactFixture({ state: "approved" }),
    stage: "design",
  });
  const snapshot = route.snapshot.data!;
  const operation = route.operation.data!;
  const overview = operation.overview!;
  const journeyArtifacts = [
    ...snapshot.journey_artifacts,
    toolsArtifact,
    memoryArtifact,
  ].filter(Boolean) as JourneyStageArtifactEntry[];
  const latest: Record<string, JourneyStageArtifactEntry> = {};
  for (const artifact of journeyArtifacts) {
    latest[artifact.stage_key] = artifact;
  }
  const recommendation = toolsArtifact
    ? (toolsArtifact.proposal_payload as unknown as ToolRecommendationArtifact)
    : null;

  return {
    ...route,
    attention: {
      ...route.attention,
      data: route.attention.data ? { ...route.attention.data, current_stage: stage } : route.attention.data,
    },
    operation: {
      ...route.operation,
      data: {
        activity: operation.activity,
        overview: {
          ...overview,
          active_stage: stage,
          lean_progress_percent: stage === "tools" ? 50 : 63,
        },
        stageOperation: operation.stageOperation,
      },
    },
    route: {
      currentStage: stage,
      sessionId: "session-uxa9",
    },
    snapshot: {
      ...route.snapshot,
      data: {
        ...snapshot,
        journey_artifacts: journeyArtifacts,
        journey_latest_artifacts: latest,
        latest_tool_recommendation: recommendation,
        session: {
          ...snapshot.session,
          id: "session-uxa9",
          title: "Soporte repetitivo",
          updated_at: "2026-08-03T12:00:00Z",
        },
      },
    },
  };
}
