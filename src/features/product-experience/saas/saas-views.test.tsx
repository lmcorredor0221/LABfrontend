import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { vi } from "vitest";
import { LanguageProvider } from "@/core/i18n/language-context";
import { deliverableCatalogApi } from "@/features/deliverables/infrastructure/deliverable-catalog-api";
import { getConstructionScenarios } from "@/features/product-experience/saas/saas-product-model";
import {
  acpDirectApi,
  type AcpDirectRouteResolution,
} from "@/features/product-experience/saas/acp-direct-api";
import {
  premiumEnrichmentApi,
  type PremiumEnrichmentWorkspace,
  type PremiumSelectiveReprocessResult,
} from "@/features/product-experience/saas/premium-enrichment-api";
import { ProductSaasView } from "@/features/product-experience/saas/saas-product-views";
import type { UseProductBuildStatusResult } from "@/features/product-experience/saas/use-product-build-status";
import {
  EstimateStageView,
  PackageStageView,
  ValidateStageView,
} from "@/features/product-experience/saas/saas-stage-views";
import type {
  ProductExperienceRouteSnapshot,
  ProductExperienceStageOperation,
} from "@/features/product-experience/core/server-state";
import type { ProductStageActions } from "@/features/product-experience/shell/use-product-experience-route";
import type { AttentionResponseV2 } from "@/features/attention/attention-contracts";
import type { SessionCommercialAccess, SessionSnapshot } from "@/features/sessions/types";

const mockPush = vi.fn();
const mockUseSearchParams = vi.fn(() => new URLSearchParams());
const mockSessionsApi = vi.hoisted(() => ({
  completeSandboxCheckout: vi.fn(),
  createAccessRequest: vi.fn(),
  createCheckoutSession: vi.fn(),
  createExportJob: vi.fn(),
  downloadExportJob: vi.fn(),
  getAcpQuestions: vi.fn(),
  getAcpWorkspace: vi.fn(),
  retryExportJob: vi.fn(),
}));
const mockUseProductBuildStatus = vi.hoisted(() => vi.fn<() => UseProductBuildStatusResult>(() => ({
  data: null,
  error: null,
  executeCommand: vi.fn(async () => null),
  isEmpty: true,
  isError: false,
  isFetching: false,
  isFinal: false,
  isLoading: false,
  isStale: false,
  refresh: vi.fn(async () => null),
  status: "empty",
  updatedAt: null,
})));

function createProductBuildStatusMock(
  overrides: Partial<UseProductBuildStatusResult> = {},
): UseProductBuildStatusResult {
  return {
    data: null,
    error: null,
    executeCommand: vi.fn(async () => null),
    isEmpty: true,
    isError: false,
    isFetching: false,
    isFinal: false,
    isLoading: false,
    isStale: false,
    refresh: vi.fn(async () => null),
    status: "empty",
    updatedAt: null,
    ...overrides,
  };
}

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockUseSearchParams(),
}));

vi.mock("@/features/product-experience/saas/premium-enrichment-api", () => ({
  premiumEnrichmentApi: {
    deferToAcp: vi.fn(),
    dismissItem: vi.fn(),
    getWorkspace: vi.fn(() => new Promise(() => undefined)),
    resolveItem: vi.fn(),
  },
}));

vi.mock("@/features/product-experience/saas/acp-direct-api", () => ({
  acpDirectApi: {
    getResolution: vi.fn(() => new Promise(() => undefined)),
  },
}));

vi.mock("@/features/deliverables/infrastructure/deliverable-catalog-api", () => ({
  deliverableCatalogApi: {
    list: vi.fn(() => new Promise(() => undefined)),
  },
}));

vi.mock("@/features/product-experience/saas/use-product-build-status", () => ({
  useProductBuildStatus: mockUseProductBuildStatus,
}));

vi.mock("@/features/sessions/session-api", () => ({
  sessionsApi: mockSessionsApi,
}));

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

function createCommercialAccess(tier: SessionCommercialAccess["tier"] = "blueprint"): SessionCommercialAccess {
  const blueprintPro = tier === "blueprint_pro" || tier === "acp";
  const acp = tier === "acp";

  return {
    available_upgrades: acp ? [] : blueprintPro ? ["acp"] : ["blueprint_pro", "acp"],
    can_access_library_workspace: true,
    can_build_acp: acp,
    can_download_acp: acp,
    can_download_blueprint: blueprintPro,
    can_export_acp_zip: acp,
    can_export_blueprint_core: blueprintPro,
    can_export_blueprint_document: blueprintPro,
    can_export_construction_pack: acp,
    can_export_estimation_pack: blueprintPro,
    can_export_json: blueprintPro,
    can_export_markdown: blueprintPro,
    can_export_prompt_pack: acp,
    can_export_test_pack: acp,
    can_invite_acp: true,
    can_view_blueprint: true,
    can_view_diagram_acp: acp,
    can_view_diagram_blueprint: blueprintPro,
    can_view_diagram_sample: true,
    can_view_in_app_blueprint: true,
    checkout_state: "available",
    purchase_refs: acp ? ["ord-acp"] : blueprintPro ? ["ord-pro"] : [],
    reason_code: "fixture",
    tier,
    tier_label: tier === "acp" ? "ACP" : tier === "blueprint_pro" ? "Blueprint Profesional" : "Blueprint",
    tier_rank: tier === "acp" ? 3 : tier === "blueprint_pro" ? 2 : 1,
    upgrade_cta_label: acp ? "Activo" : "Mejorar plan",
    upgrade_message: "Desbloquea artefactos premium.",
  };
}

function createAttention(): AttentionResponseV2 {
  return {
    actionable_count: 1,
    blocking_count: 0,
    contract_version: "attention.v2",
    counts_by_product: { blueprint: 1 },
    counts_by_stage: { validate: 1 },
    counts_by_type: { question: 1 },
    current_stage: "estimate",
    cursor: "",
    generated_at: "2026-08-03T10:11:00Z",
    info_count: 1,
    items: [],
    primary_item: null,
    session_id: "session-uxa11",
    total_count: 1,
    warning_count: 0,
    workspace_id: "workspace-1",
  };
}

function createSnapshot(tier: SessionCommercialAccess["tier"] = "blueprint"): SessionSnapshot {
  const session = {
    commercial_tier: tier,
    created_at: "2026-08-03T10:00:00Z",
    current_stage: "ready_for_export" as const,
    id: "session-uxa11",
    status: "ready",
    title: "Agente soporte premium",
    updated_at: "2026-08-03T10:10:00Z",
    workspace_id: "workspace-1",
  };

  return {
    activity: [],
    alert_events: [],
    approvals: [],
    artifact_records: [
      {
        artifact_key: "architecture_overview",
        artifact_kind: "diagram",
        artifact_metadata: {},
        artifact_title: "Arquitectura propuesta",
        blueprint_version_number: 3,
        content_hash: "hash-architecture",
        content_text: "architecture_overview con capas, limites y responsabilidades.",
        created_at: "2026-08-03T10:20:00Z",
        export_format: "svg",
        id: "artifact-architecture",
        source_action: "build_blueprint",
        stage: "build_blueprint",
      },
    ],
    blueprint: {
      assumptions: [],
      data: {
        architecture: "Arquitectura multiagente con supervisor, retrieval y HITL.",
        contract_version: "blueprint-core.v1",
        delivery_package: {
          blueprint_coverage: {
            covered_sections: 6,
            missing_sections: [],
            overall_status: "ready",
            sections: [],
            total_sections: 6,
          },
          component_readiness: [],
          contract_version: "delivery-package.v1",
          decision_summary: "El Blueprint separa diseno e implementacion.",
          decision_trace: [],
          deliverables: [
            {
              content_markdown: "Documento profesional.",
              key: "blueprint_doc",
              summary: "Blueprint profesional.",
              title: "Blueprint",
            },
          ],
          observability_plan: {
            alert_triggers: [],
            captured_signals: [],
            cost_tracking: "Por proveedor",
            decision_logging: "Audit trail",
            duration_tracking: "Por run",
            plan_summary_policy: "Resumen por etapa",
            result_tracking: "Por artefacto",
            tool_response_logging: "Redactado",
          },
          pattern_catalog: [],
          risk_summary: {
            approval_gates_required: 1,
            high_risks: 0,
            low_risks: 2,
            medium_risks: 1,
            overall_status: "ready",
            side_effect_tools: 0,
            summary: "Riesgo gobernado.",
            total_checks: 3,
          },
          roadmap_evolution: {
            current_focus: "MVP",
            current_release: "v1",
            milestones: [],
          },
          workflow_profile: {
            approval_pause: "HITL",
            checkpoint_policy: "Por etapa",
            compensation_strategy: "Escalar",
            execution_pattern: "Supervisor",
            inbox_strategy: "Atencion",
            outbox_strategy: "Auditada",
            retry_strategy: "Una vez",
            steps: [],
            timeout_policy: "Por tool",
          },
        },
        guardrails: ["Citar fuentes"],
        knowledge_profile: {
          mode: "rag",
          sources: [],
        },
        memory_profile: {
          goal_drift_guard: "Resumir contexto",
          retrieval_policy: "top-k por evidencia",
          review_trigger: "Contradiccion",
          storage_layers: ["short", "long"],
          strategy: "hybrid-rag",
          write_policy: "Solo decisiones aprobadas",
        },
        memory_strategy: "Memoria hibrida con RAG y lineage.",
        narrative: "Agente de soporte con recuperacion de conocimiento.",
        readiness_state: "ready",
        reasoning_pattern: "Plan-act-observe con supervisor.",
        safety_checks: [],
        tools: [
          {
            approval_reason: "Lectura sin side effects.",
            compensation_strategy: "Escalar si no hay evidencia.",
            execution_mode: "sync",
            failure_mode: "No evidence",
            has_side_effects: false,
            inputs: ["query"],
            name: "Knowledge Retrieval",
            outputs: ["sources"],
            purpose: "Recuperar conocimiento aprobado.",
            requires_approval: false,
            retry_strategy: "query expansion",
            risk_level: "low",
            validations: ["citation_required"],
          },
        ],
      },
      evidence: [],
      missing_fields: [],
      next_action: "estimate",
      stage: "build_blueprint",
      status: "ready",
      warnings: [],
    },
    blueprint_versions: [],
    canvas: null,
    commercial_access: createCommercialAccess(tier),
    contract_version: "session-snapshot.v1",
    discovery: null,
    estimation_error_metrics: [],
    estimation_report: {
      agentic: {
        acp_package_readiness_percent: 94,
        active_provider: "command-codex",
        assumptions: [],
        automation_assessments: [],
        automation_coverage_by_artifact_family: {},
        automation_coverage_by_workstream: {},
        automation_coverage_percent: 82,
        blueprint_design_coverage_percent: 90,
        economic_model: "agentic-assisted",
        estimated_cost: 28000000,
        estimated_duration_weeks: 4,
        estimated_hours_total: 180,
        human_delivery_cost: 23000000,
        human_supervision_cost: 4000000,
        human_supervision_hours: 38,
        implementation_scope_coverage_percent: 76,
        llm_runtime_cost_usd: 45,
        net_savings_vs_traditional: 52000000,
        platform_cost_usd: 0,
        platform_overhead_cost_usd: 0,
        pricing_assumptions: [],
        pricing_policy: "local",
        provider_model: "gpt-5",
        provider_runtime_cost_total_cop: 180000,
        provider_runtime_cost_total_usd: 45,
        scenario_type: "agentic",
        team_shape: ["Tech lead", "Agent engineer"],
        tool_runtime_cost_usd: 0,
        tooling_cost_usd: 0,
        warnings: [],
        workstream_breakdown: [],
      },
      analysis: null,
      analysis_decision: {
        decision: "accepted",
        note: "Aceptada",
      },
      assumptions: [],
      confidence: {
        assumptions_count: 2,
        blocking_gaps: 0,
        design_gap_count: 1,
        implementation_gap_count: 2,
        label: "Alta",
        negative_signals: [],
        open_questions: 2,
        positive_signals: ["Blueprint aprobado"],
        recommended_next_actions: [],
        score: 91,
        subscores: {},
        uncertainty_band_percent: 6,
      },
      construction_scenarios: [
        {
          automation_leverage_percent: 0,
          cost_savings_vs_traditional: 0,
          description: "Construccion manual con Blueprint.",
          effort_reduction_vs_traditional_percent: 0,
          estimated_cost: 80000000,
          estimated_duration_weeks: 10,
          estimated_hours_total: 520,
          human_intervention_percent: 100,
          label: "Desarrollo tradicional",
          notes: [],
          scenario_key: "traditional_blueprint",
        },
        {
          automation_leverage_percent: 88,
          cost_savings_vs_traditional: 56000000,
          description: "ACP ejecutado con herramienta agentica.",
          effort_reduction_vs_traditional_percent: 72,
          estimated_cost: 24000000,
          estimated_duration_weeks: 3,
          estimated_hours_total: 145,
          human_intervention_percent: 28,
          label: "ACP agentico",
          notes: [],
          scenario_key: "acp_agentic",
        },
      ],
      contract_version: "estimation-report.v1",
      deterministic_inputs: {} as never,
      generated_at: "2026-08-03T10:30:00Z",
      is_stale: false,
      maturity_stage: "blueprint",
      notes: [],
      package_policy: {
        can_continue_to_package: true,
        commercial_blocked: tier !== "acp",
        package_block_reasons: tier === "acp" ? [] : ["ACP requiere adquisicion antes de descargar."],
        preliminary: false,
      },
      risk_drivers: [],
      source_artifacts: ["blueprint"],
      stale_reasons: [],
      traditional: {
        assumptions: [],
        estimated_cost: 80000000,
        estimated_duration_weeks: 10,
        estimated_hours_total: 520,
        scenario_type: "traditional",
        team_shape: ["PM", "Arquitecto", "Backend", "Frontend", "QA"],
        warnings: [],
        workstream_breakdown: [],
      },
    },
    estimation_runs: [],
    evaluation: {
      assumptions: [],
      data: {
        cases: [],
        coherence_status: "ready",
        completeness_status: "ready",
        gaps: [],
        recommendations: [],
        scores: {},
      },
      evidence: [],
      missing_fields: [],
      next_action: "package",
      stage: "post_validation",
      status: "ready",
      warnings: [],
    },
    evaluation_dataset: {
      cases: [
        {
          case_key: "case-source-answer",
          category: "rag",
          expected_result: "Respuesta citada.",
          is_active: true,
          priority: "high",
          scenario: "Usuario pregunta por politica interna y el agente debe citar evidencia.",
          source: "blueprint",
          title: "Respuesta con evidencia",
        },
      ],
      source_action: "generate_test_suite",
      status: "ready",
      summary: "Dataset de validacion.",
      version_number: 1,
    },
    evaluation_rubric: {
      dimensions: [
        {
          description: "Toda respuesta debe estar sustentada en fuentes aprobadas.",
          hard_block: true,
          key: "grounding",
          label: "Grounding",
          weight: 40,
        },
      ],
      source_action: "generate_rubric",
      summary: "Rubrica de quality gates.",
      version_number: 1,
    },
    evaluation_runs: [
      {
        blocking_issues: [],
        category_scores: {},
        created_at: "2026-08-03T10:35:00Z",
        dataset_version_number: 1,
        dimension_scores: {},
        id: "eval-run-1",
        overall_score: 92,
        recommendations: [],
        results: [],
        rubric_version_number: 1,
        source_action: "run_validation",
        status: "ready",
        summary: "Validacion aprobada.",
      },
    ],
    governance_policies: [],
    handoff_records: [],
    integration_statuses: [],
    journey_artifacts: [],
    metric_snapshots: [],
    project_actuals: [],
    session,
    skill_catalog: [],
    skill_runs: [],
    subagent_runs: [],
    simulation_runs: [
      {
        active_node_key: "end",
        created_at: "2026-08-03T10:36:00Z",
        deterministic_signature: "sig",
        events: [],
        execution_state: "completed",
        final_status: "pass",
        hard_gate_status: "pass",
        id: "simulation-run-1",
        injected_conditions: [],
        is_stale: false,
        judgement: {
          final_status: "pass",
          findings: [],
          hard_gate_findings: [],
          hard_gate_status: "pass",
          llm_judgment: "pass",
          scenario_key: "case-source-answer",
          score: 92,
          summary: "Simulacion aprobada.",
        },
        scenario_key: "case-source-answer",
        scenario_title: "Respuesta con evidencia",
        scenario_version_number: 1,
        source_action: "simulate",
        stale_reasons: [],
        status: "ready",
        summary: "Flujo valido.",
        updated_at: "2026-08-03T10:36:00Z",
      },
    ],
    validations: [],
    workflow_templates: [],
    workspace_contract: {
      catalogs: [],
      contract_version: "workspace-contract.v1",
      feature_flags: [],
      sections: [],
    },
  } as unknown as SessionSnapshot;
}

function createRoute(tier: SessionCommercialAccess["tier"] = "blueprint"): ProductExperienceRouteSnapshot {
  const snapshot = createSnapshot(tier);

  const route = {
    attention: resource(createAttention()),
    auth: resource({
      active_workspace_id: "workspace-1",
      active_workspace_name: "Lean Builder",
      email: "admin@example.com",
      full_name: "Admin UXA",
      id: "user-1",
      workspaces: [],
    }),
    list: resource({ items: [snapshot.session] }),
    operation: resource({
      activity: {
        contract_version: "activity.v1",
        funnel: [],
        generated_at: "2026-08-03T10:40:00Z",
        metrics: [],
        session_id: "session-uxa11",
        timeline: [
          {
            detail: "Estimar genero la comparativa comercial.",
            event_type: "stage_completed",
            id: "activity-estimate",
            title: "Estimacion lista",
          },
        ],
        workspace_id: "workspace-1",
      },
      overview: {
        access: {} as never,
        active_stage: "estimate",
        attention: [],
        contract_version: "product-overview.v1",
        exports: [],
        generated_at: "2026-08-03T10:40:00Z",
        lean_progress_percent: 80,
        navigation: [],
        products: [
          {
            access_state: "available",
            cta_label: "Ver Blueprint",
            detail: "Vista protegida del diseno.",
            href: "/projects/session-uxa11/blueprint",
            key: "blueprint",
            label: "Blueprint",
            progress_percent: 90,
            status: "ready",
          },
          {
            access_state: tier === "blueprint" ? "locked" : "available",
            cta_label: "Ver Blueprint Pro",
            detail: "Descarga profesional.",
            href: "/projects/session-uxa11/blueprint/pro",
            key: "blueprint_pro",
            label: "Blueprint Pro",
            progress_percent: tier === "blueprint" ? 0 : 100,
            status: tier === "blueprint" ? "locked" : "ready",
          },
          {
            access_state: tier === "acp" ? "available" : "locked",
            cta_label: "Ver ACP",
            detail: "Paquete portable.",
            href: "/projects/session-uxa11/acp",
            key: "acp",
            label: "ACP",
            progress_percent: tier === "acp" ? 100 : 0,
            status: tier === "acp" ? "ready" : "locked",
          },
        ],
        project_title: "Agente soporte premium",
        session_id: "session-uxa11",
        workspace_id: "workspace-1",
      },
    }),
    requestId: 1,
    route: {
      currentStage: "estimate",
      sessionId: "session-uxa11",
    },
    snapshot: resource(snapshot),
  };

  return route as unknown as ProductExperienceRouteSnapshot;
}

function renderWithLanguage(ui: ReactElement) {
  return render(<LanguageProvider>{ui}</LanguageProvider>);
}

function createStageOperation(overrides: Partial<ProductExperienceStageOperation> = {}): ProductExperienceStageOperation {
  return {
    action: "generate_estimation_report",
    attempt_count: 1,
    can_cancel: true,
    can_retry: false,
    cancel_requested_at: null,
    cancel_url: "/api/v1/sessions/session-uxa11/stage-operations/operation-estimate/cancel",
    completed_at: null,
    created_at: "2026-08-16T10:00:00Z",
    current_step: "queued",
    detail: "Solicitud recibida.",
    error_message: "",
    expires_at: "2026-08-16T10:30:00Z",
    heartbeat_at: "2026-08-16T10:00:00Z",
    id: "operation-estimate",
    idempotency_key: "estimate-once",
    is_stale: false,
    recover_url: "/api/v1/sessions/session-uxa11/stage-operations/operation-estimate/recover",
    result: null,
    result_artifact_id: null,
    retry_url: "",
    session_id: "session-uxa11",
    stage_key: "estimate",
    status: "queued",
    steps: [],
    technical_detail: "",
    updated_at: "2026-08-16T10:00:00Z",
    workspace_id: "workspace-1",
    ...overrides,
  };
}

function createPremiumWorkspace(): PremiumEnrichmentWorkspace {
  return {
    contract_version: "premium-enrichment-workspace.v1",
    current_tier: "blueprint_pro",
    deferred_count: 0,
    items: [
      {
        affected_deliverable_keys: ["blueprint_doc"],
        changed_dependency_keys: ["compliance_scope"],
        entry: {
          affected_deliverable_keys: ["blueprint_doc"],
          answer_options: [
            {
              confidence: 0.91,
              description: "Resume el marco regulatorio principal que debemos reflejar en el blueprint.",
              impact: "Aclara restricciones críticas para el documento profesional.",
              key: "regulatory-summary",
              label: "Resumen regulatorio",
              recommended: true,
            },
          ],
          assumed_answer: "",
          confidence: 0.91,
          cost_to_resolve_units: 2,
          created_from: "premium_enrichment",
          dependency_keys: ["compliance_scope"],
          disposition: "infer",
          id: "uncertainty-1",
          impact: "Puede cambiar el blueprint profesional final.",
          kind: "question",
          product_mode: "premium_enrichment",
          reason: "Falta contexto sobre las restricciones regulatorias del cliente.",
          session_id: "session-uxa11",
          source_refs: ["brief.md#regulacion"],
          source_stage: "blueprint",
          status: "open",
          suggested_answer: "Cliente regulado por norma financiera local y controles de auditoria trimestral.",
          target_stage: "blueprint_pro",
          title: "Precisar restricciones regulatorias",
          uncertainty_key: "compliance_scope",
          workspace_id: "workspace-1",
        },
        ordered_regeneration_keys: ["blueprint_doc"],
        priority_reason: "Tiene alto impacto en el Blueprint profesional.",
        priority_score: 92,
        unaffected_deliverable_count: 2,
      },
    ],
    prioritized_count: 1,
    processing_guidance: "Resuelve primero las dependencias con mayor impacto en el documento profesional.",
    product_mode: "premium_enrichment",
    resolved_count: 0,
    selectable_limit: 6,
    session_id: "session-uxa11",
    total_uncertainties: 1,
    value_summary: "Una sola aclaración desbloquea el blueprint profesional.",
    workspace_id: "workspace-1",
  };
}

function createResolvedPremiumWorkspace(answerText = "Cliente regulado por norma financiera local y controles de auditoria trimestral."): PremiumEnrichmentWorkspace {
  const workspace = createPremiumWorkspace();
  return {
    ...workspace,
    prioritized_count: 0,
    resolved_count: 1,
    items: workspace.items.map((item) => ({
      ...item,
      entry: {
        ...item.entry,
        assumed_answer: answerText,
        status: "resolved",
      },
    })),
  };
}

function createPremiumResolutionResult(
  overrides: Partial<PremiumSelectiveReprocessResult> = {},
): PremiumSelectiveReprocessResult {
  const workspace = createPremiumWorkspace();
  const item = workspace.items[0];
  const answerText = item.entry.suggested_answer;
  return {
    changed_dependency_keys: ["definition.requirements"],
    comparison_summary:
      "Se resolvio 'Precisar restricciones regulatorias'. La respuesta no cambia materialmente los entregables existentes.",
    contract_version: "premium-selective-reprocess-result.v1",
    affected_deliverable_keys: ["blueprint_doc"],
    execution_mode: "analyze_only",
    generation_job_ids: [],
    generation_status_by_deliverable: {},
    impact_summary: "La respuesta no cambia materialmente los entregables existentes.",
    material_impact: false,
    ordered_regeneration_keys: ["blueprint_doc"],
    preserved_deliverable_keys: ["diagram.c4_context", "diagram.security_guardrails"],
    reconciled_deliverable_keys: [],
    reconciliation_decision: "document_only",
    reconciliation_job_ids: [],
    reconciliation_status: "not_required",
    queue_completed: 0,
    queue_processed_keys: [],
    queue_status: "not_required",
    queue_total: 0,
    recommended_action: "Documentar la aclaracion sin reconciliar el Blueprint Pro.",
    regenerated_deliverable_keys: [],
    reprocess_decision: "document_only",
    resolved_entry: {
      ...item.entry,
      assumed_answer: answerText,
      status: "resolved",
    },
    stale_deliverable_keys: [],
    superseded_uncertainty_count: 0,
    ...overrides,
  };
}

function createAcpWorkspace(
  overrides: Partial<{
    generated_at: string;
    next_action: string;
    readiness: {
      assumptions_count: number;
      blocking_gaps: number;
      can_start_build: boolean;
      gaps: unknown[];
      next_recommended_action: string;
      open_questions: number;
      overall_status: string;
    };
    validation: {
      can_export_zip: boolean;
      completeness_percent: number;
      issues: unknown[];
      overall_status: string;
    };
  }> = {},
) {
  return {
    access: createCommercialAccess("acp"),
    contract_version: "acp-workspace.v1",
    generated_at: "2026-08-26T18:10:00Z",
    next_action: "Resolver preguntas de despliegue antes de Package.",
    phase_definitions: [
      { key: "blueprint_validation", label: "Validacion del Blueprint", objective: "Validar", order: 1, required: true },
      { key: "test_suite", label: "Diseno del Test Suite", objective: "Test suite", order: 2, required: true },
      { key: "gap_classification", label: "Clasificacion de GAPs", objective: "Clasificar", order: 3, required: true },
      { key: "implementation_questions", label: "Preguntas de implementacion", objective: "Preguntas", order: 4, required: true },
      { key: "package_build", label: "Construccion del paquete", objective: "Empaquetar", order: 5, required: true },
      { key: "conformance_export", label: "Conformance y exportacion", objective: "Exportar", order: 6, required: true },
    ],
    phases: [
      {
        attempt_count: 1,
        blockers: [],
        checkpoints: {},
        completed_at: "2026-08-26T18:11:00Z",
        id: "phase-1",
        input_refs: [],
        output_refs: [],
        phase_key: "blueprint_validation",
        phase_label: "Validacion del Blueprint",
        phase_order: 1,
        started_at: "2026-08-26T18:10:00Z",
        status: "completed",
        updated_at: "2026-08-26T18:11:00Z",
        warnings: [],
      },
      {
        attempt_count: 0,
        blockers: [],
        checkpoints: {},
        completed_at: null,
        id: "phase-2",
        input_refs: [],
        output_refs: [],
        phase_key: "test_suite",
        phase_label: "Diseno del Test Suite",
        phase_order: 2,
        started_at: null,
        status: "not_started",
        updated_at: "2026-08-26T18:11:00Z",
        warnings: [],
      },
      {
        attempt_count: 0,
        blockers: [],
        checkpoints: {},
        completed_at: null,
        id: "phase-3",
        input_refs: [],
        output_refs: [],
        phase_key: "gap_classification",
        phase_label: "Clasificacion de GAPs",
        phase_order: 3,
        started_at: null,
        status: "not_started",
        updated_at: "2026-08-26T18:11:00Z",
        warnings: [],
      },
      {
        attempt_count: 0,
        blockers: [],
        checkpoints: {},
        completed_at: null,
        id: "phase-4",
        input_refs: [],
        output_refs: [],
        phase_key: "implementation_questions",
        phase_label: "Preguntas de implementacion",
        phase_order: 4,
        started_at: null,
        status: "waiting_user",
        updated_at: "2026-08-26T18:11:00Z",
        warnings: [],
      },
      {
        attempt_count: 0,
        blockers: [],
        checkpoints: {},
        completed_at: null,
        id: "phase-5",
        input_refs: [],
        output_refs: [],
        phase_key: "package_build",
        phase_label: "Construccion del paquete",
        phase_order: 5,
        started_at: null,
        status: "not_started",
        updated_at: "2026-08-26T18:11:00Z",
        warnings: [],
      },
      {
        attempt_count: 0,
        blockers: [],
        checkpoints: {},
        completed_at: null,
        id: "phase-6",
        input_refs: [],
        output_refs: [],
        phase_key: "conformance_export",
        phase_label: "Conformance y exportacion",
        phase_order: 6,
        started_at: null,
        status: "not_started",
        updated_at: "2026-08-26T18:11:00Z",
        warnings: [],
      },
    ],
    readiness: {
      assumptions_count: 1,
      blocking_gaps: 1,
      can_start_build: false,
      gaps: [],
      next_recommended_action: "Responder preguntas de despliegue.",
      open_questions: 2,
      overall_status: "blocked",
    },
    run: {
      artifacts: {},
      blockers: [],
      blueprint_version_number: null,
      checkpoints: {},
      completed_at: null,
      created_at: "2026-08-26T18:10:00Z",
      current_phase_key: "implementation_questions",
      id: "run-1",
      phase_order: [
        "blueprint_validation",
        "test_suite",
        "gap_classification",
        "implementation_questions",
        "package_build",
        "conformance_export",
      ],
      progress_percent: 25,
      session_id: "session-uxa11",
      status: "waiting_user",
      updated_at: "2026-08-26T18:11:00Z",
      warnings: [],
      workspace_id: "workspace-1",
    },
    session_id: "session-uxa11",
    validation: {
      can_export_zip: false,
      completeness_percent: 82,
      issues: [],
      overall_status: "incomplete",
    },
    workspace_id: "workspace-1",
    ...overrides,
  };
}

function createAcpQuestions() {
  return [
    {
      answer_text: "",
      answered_at: null,
      answered_by_display: "",
      blocking: true,
      domain: "deployment",
      expected_answer_format: "target=<entorno>",
      gap_key: "deployment_target_unknown",
      gap_title: "Falta decidir el despliegue",
      impacted_artifacts: ["ACP/deployment/env.template", "ACP/runtime/config.yaml"],
      options: [],
      owner_role: "",
      purpose: "Definir despliegue",
      question_key: "deployment_target",
      question_text: "¿En qué infraestructura se instalará?",
      rationale: "Necesario para empaquetar.",
      resolved_at: null,
      status: "open",
      target_owner: "platform_owner",
    },
    {
      answer_text: "",
      answered_at: null,
      answered_by_display: "",
      blocking: false,
      domain: "knowledge",
      expected_answer_format: "provider=<proveedor>",
      gap_key: "knowledge_sources_missing",
      gap_title: "Faltan fuentes",
      impacted_artifacts: ["ACP/knowledge/sources.yaml"],
      options: [],
      owner_role: "",
      purpose: "Definir conocimiento",
      question_key: "knowledge_sources",
      question_text: "¿Qué fuentes consultará?",
      rationale: "Necesario para RAG.",
      resolved_at: null,
      status: "open",
      target_owner: "domain_owner",
    },
  ];
}

function createAcpResolution(): AcpDirectRouteResolution {
  return {
    can_export_package: false,
    can_start_package: false,
    catalog_counts: {
      acp_deliverables: 49,
    },
    completed_stage_keys: ["discover", "define"],
    contract_version: "acp-direct-route-resolution.v1",
    current_tier: "acp",
    justified_stage_keys: [],
    missing_stage_keys: ["design", "tools", "memory", "estimate", "validate"],
    next_stage_key: "discover",
    portable_catalog_paths: [],
    processing_guidance: "ACP directo usa full readiness.",
    product_mode: "acp_implementation",
    question_policy: "full_readiness",
    readiness_blockers: ["missing_stage:design"],
    required_stage_keys: ["discover", "define", "design", "tools", "memory", "estimate", "validate"],
    route_kind: "acp_direct",
    session_id: "session-uxa11",
    stages: [
      { blocking_question_count: 0, completed: true, justification: "", justified: false, label: "Descubrir", next_action: "", stage_key: "discover", technical_question_count: 0 },
      { blocking_question_count: 0, completed: true, justification: "", justified: false, label: "Definir", next_action: "", stage_key: "define", technical_question_count: 0 },
      { blocking_question_count: 0, completed: false, justification: "", justified: false, label: "Disenar", next_action: "Aprueba arquitectura.", stage_key: "design", technical_question_count: 0 },
      { blocking_question_count: 0, completed: false, justification: "", justified: false, label: "Herramientas", next_action: "Aprueba herramientas.", stage_key: "tools", technical_question_count: 0 },
      { blocking_question_count: 0, completed: false, justification: "", justified: false, label: "Memoria", next_action: "Aprueba memoria.", stage_key: "memory", technical_question_count: 0 },
      { blocking_question_count: 0, completed: false, justification: "", justified: false, label: "Estimar", next_action: "Genera estimacion.", stage_key: "estimate", technical_question_count: 0 },
      { blocking_question_count: 0, completed: false, justification: "", justified: false, label: "Validar", next_action: "Valida readiness.", stage_key: "validate", technical_question_count: 0 },
    ],
    total_blocking_questions: 0,
    total_technical_questions: 0,
    workspace_id: "workspace-1",
  };
}

beforeEach(() => {
  mockPush.mockClear();
  mockUseSearchParams.mockReturnValue(new URLSearchParams());
  mockUseProductBuildStatus.mockReset();
  mockUseProductBuildStatus.mockReturnValue(createProductBuildStatusMock());
  vi.mocked(acpDirectApi.getResolution).mockReset();
  vi.mocked(acpDirectApi.getResolution).mockImplementation(() => new Promise(() => undefined));
  vi.mocked(premiumEnrichmentApi.deferToAcp).mockReset();
  vi.mocked(premiumEnrichmentApi.dismissItem).mockReset();
  vi.mocked(premiumEnrichmentApi.getWorkspace).mockReset();
  vi.mocked(premiumEnrichmentApi.getWorkspace).mockImplementation(() => new Promise(() => undefined));
  vi.mocked(premiumEnrichmentApi.resolveItem).mockReset();
  mockSessionsApi.completeSandboxCheckout.mockReset();
  mockSessionsApi.createAccessRequest.mockReset();
  mockSessionsApi.createCheckoutSession.mockReset();
  mockSessionsApi.createExportJob.mockReset();
  mockSessionsApi.downloadExportJob.mockReset();
  mockSessionsApi.getAcpQuestions.mockReset();
  mockSessionsApi.getAcpWorkspace.mockReset();
  mockSessionsApi.retryExportJob.mockReset();
  mockSessionsApi.getAcpWorkspace.mockImplementation(() => new Promise(() => undefined));
  mockSessionsApi.getAcpQuestions.mockImplementation(() => new Promise(() => undefined));
});

describe("UXA11 SaaS stage views", () => {
  it("renders Estimate with construction scenarios and commercial readiness", () => {
    renderWithLanguage(<EstimateStageView activeRoute={createRoute()} />);

    expect(screen.getByRole("heading", { name: "LAB encontro una oportunidad concreta de ahorro" })).toBeInTheDocument();
    expect(screen.getAllByText("ACP agentico").length).toBeGreaterThan(0);
    expect(screen.getByText("Comparacion base")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Abrir Blueprint" })).toHaveAttribute(
      "href",
      "/projects/session-uxa11/blueprint",
    );
    expect(screen.queryByRole("heading", { name: "Estimar valor, costo y ROI" })).not.toBeInTheDocument();
  });

  it("treats a missing estimate as a generation task instead of an Attention blocker", async () => {
    const route = createRoute();
    route.snapshot.data = {
      ...route.snapshot.data!,
      estimation_report: null,
    } as SessionSnapshot;
    const actions = {
      generateEstimationReport: vi.fn(async () => createStageOperation()),
    } as unknown as ProductStageActions;

    renderWithLanguage(<EstimateStageView actionState={{ status: "idle" }} actions={actions} activeRoute={route} />);

    expect(screen.getByText("Sin estimacion")).toBeInTheDocument();
    expect(screen.getByText("Sin bloqueos operativos")).toBeInTheDocument();
    expect(screen.queryByText(/bloqueo\(s\)/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Generar estimacion/i }));

    await waitFor(() => expect(actions.generateEstimationReport).toHaveBeenCalledTimes(1));
  });

  it("prepares Blueprint Basic deliverables before opening the commercial result", async () => {
    const route = createRoute();
    const actions = {
      prepareBlueprintCommercialResult: vi.fn(async () => route.snapshot.data!),
    } as unknown as ProductStageActions;

    renderWithLanguage(<EstimateStageView actionState={{ status: "idle" }} actions={actions} activeRoute={route} />);

    fireEvent.click(screen.getAllByRole("button", { name: /Ver Blueprint Basico/i })[0]);

    await waitFor(() => expect(actions.prepareBlueprintCommercialResult).toHaveBeenCalledTimes(1));
    expect(mockPush).toHaveBeenCalledWith("/projects/session-uxa11/blueprint?surface=commercial");
  });

  it("renders Validate with test suite, rubric and simulation state", () => {
    renderWithLanguage(<ValidateStageView activeRoute={createRoute()} />);

    expect(screen.getByRole("heading", { name: "Validar Blueprint antes del ACP" })).toBeInTheDocument();
    expect(screen.getAllByText("Respuesta con evidencia").length).toBeGreaterThan(0);
    expect(screen.getByText("Grounding")).toBeInTheDocument();
  });

  it("renders Package as gated ACP when entitlement is not active", () => {
    renderWithLanguage(<PackageStageView activeRoute={createRoute("blueprint_pro")} />);

    expect(screen.getByRole("heading", { name: "Package portable y desacoplado" })).toBeInTheDocument();
    expect(screen.getByText("Upsell ACP")).toBeInTheDocument();
    expect(screen.getByText("Manifest portable sin IDs internos obligatorios")).toBeInTheDocument();
  });
});

describe("UXA11 SaaS product views", () => {
  it("routes diagram discovery to the independent Diagram Center", () => {
    renderWithLanguage(<ProductSaasView activeRoute={createRoute("blueprint")} section="diagrams" />);

    expect(screen.getByRole("heading", { name: "Diagramas de la solución" })).toBeInTheDocument();
    expect(screen.getByText("Motor gobernado")).toBeInTheDocument();
  });

  it("renders Blueprint Basic executive overview as a separate product entry", () => {
    renderWithLanguage(<ProductSaasView activeRoute={createRoute("blueprint")} section="blueprint_overview" />);

    expect(
      screen.getByRole("heading", { name: "De una necesidad ambigua a una propuesta clara" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "5 Artefactos Clave del Blueprint Básico" })).toBeInTheDocument();
  });

  it("renders Blueprint Basic with the executive overview inside the product tabs", () => {
    renderWithLanguage(<ProductSaasView activeRoute={createRoute("blueprint")} section="blueprint" />);

    expect(screen.getByRole("heading", { name: "Resultado del Blueprint" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Resumen Blueprint/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Diagramas de Blueprint/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "De una necesidad ambigua a una propuesta clara" })).toBeInTheDocument();
  });

  it("keeps the build tracker visible when opening the Blueprint diagrams tab directly", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("result_tab=diagrams"));
    mockUseProductBuildStatus.mockReturnValue(createProductBuildStatusMock({
      data: {
        lifecycle: "running",
        progress: {
          percent: 42,
        },
      } as never,
      error: null,
      isEmpty: false,
      isError: false,
      isFetching: false,
      isFinal: false,
      isLoading: false,
      isStale: false,
      status: "success",
      updatedAt: Date.now(),
    }));

    renderWithLanguage(<ProductSaasView activeRoute={createRoute("blueprint")} section="blueprint" />);

    expect(screen.getByRole("tab", { name: /Diagramas de Blueprint/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Generación de Entregables")).toBeInTheDocument();
    expect(screen.getByText(/Generando entregables de Blueprint/i)).toBeInTheDocument();
  });

  it("renders Blueprint Pro executive overview inside the Blueprint Pro tabs", () => {
    renderWithLanguage(<ProductSaasView activeRoute={createRoute("blueprint_pro")} section="blueprint_pro" />);

    expect(screen.getByRole("heading", { name: "Resultado del Blueprint" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Enriquecimiento Pro/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Resumen Pro/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Diagramas de Blueprint Pro/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Resuelve solo lo que mejora el Blueprint profesional" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /Resumen Pro/ }));
    expect(screen.getByRole("heading", { name: "De una propuesta clara a un Blueprint defendible" })).toBeInTheDocument();
  });

  it("keeps Blueprint Pro in the access gate until the premium entitlement is active", () => {
    renderWithLanguage(<ProductSaasView activeRoute={createRoute("blueprint")} section="blueprint_pro" />);

    expect(screen.getByRole("heading", { name: /Activa Blueprint Pro antes de abrir el workspace profesional/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /El enriquecimiento Pro inicia solo después de activar Blueprint Pro/i })).toBeInTheDocument();
    expect(vi.mocked(premiumEnrichmentApi.getWorkspace)).not.toHaveBeenCalled();
    expect(screen.queryByText("Cargando backlog priorizado de enriquecimiento...")).not.toBeInTheDocument();
  });

  it("downloads Blueprint Pro through the authenticated API instead of navigating directly", async () => {
    const createObjectUrl = vi.fn(() => "blob:blueprint-pro");
    const revokeObjectUrl = vi.fn();
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;

    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectUrl,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectUrl,
    });

    try {
      mockSessionsApi.createExportJob.mockResolvedValueOnce({
        artifact_kind: "blueprint_professional",
        checksum_sha256: "sha-256",
        completed_at: "2026-08-27T13:10:00Z",
        content_type: "application/zip",
        created_at: "2026-08-27T13:09:00Z",
        download_url: "/api/v1/sessions/session-uxa11/exports/jobs/job-blueprint/download",
        error_message: "",
        expires_at: "2026-08-27T13:25:00Z",
        file_name: "blueprint-pro.zip",
        id: "job-blueprint",
        metadata: {},
        product_key: "blueprint_pro",
        profile: "professional",
        session_id: "session-uxa11",
        size_bytes: 2048,
        status: "ready",
        updated_at: "2026-08-27T13:10:00Z",
        workspace_id: "workspace-1",
      });
      mockSessionsApi.downloadExportJob.mockResolvedValueOnce(new Blob(["blueprint-pro"], { type: "application/zip" }));

      renderWithLanguage(<ProductSaasView activeRoute={createRoute("blueprint_pro")} section="blueprint_pro" />);

      fireEvent.click(screen.getByRole("button", { name: "Descargar Blueprint Pro" }));

      await waitFor(() =>
        expect(mockSessionsApi.downloadExportJob).toHaveBeenCalledWith("session-uxa11", "job-blueprint"),
      );
      expect(createObjectUrl).toHaveBeenCalledTimes(1);
      expect(anchorClick).toHaveBeenCalledTimes(1);
      expect(revokeObjectUrl).toHaveBeenCalledWith("blob:blueprint-pro");
    } finally {
      anchorClick.mockRestore();
      Object.defineProperty(URL, "createObjectURL", {
        configurable: true,
        value: originalCreateObjectUrl,
      });
      Object.defineProperty(URL, "revokeObjectURL", {
        configurable: true,
        value: originalRevokeObjectUrl,
      });
    }
  });

  it("hides the Blueprint Pro download CTA when export permission is missing", () => {
    const route = createRoute("blueprint_pro");
    route.snapshot.data!.commercial_access = {
      ...route.snapshot.data!.commercial_access!,
      can_download_blueprint: false,
      can_export_blueprint_core: false,
      can_export_blueprint_document: false,
      can_export_json: false,
      can_export_markdown: false,
    };

    renderWithLanguage(<ProductSaasView activeRoute={route} section="blueprint_pro" />);

    expect(screen.queryByRole("button", { name: "Descargar Blueprint Pro" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Permiso de descarga requerido" })).toBeDisabled();
    expect(screen.getByRole("heading", { name: /El workspace profesional esta activo, pero la exportacion sigue protegida/i })).toBeInTheDocument();
  });

  it("renders the direct suggestion accelerator when premium enrichment returns a suggested answer", async () => {
    vi.mocked(premiumEnrichmentApi.getWorkspace).mockResolvedValueOnce(createPremiumWorkspace());

    renderWithLanguage(<ProductSaasView activeRoute={createRoute("blueprint_pro")} section="blueprint_pro" />);

    expect(await screen.findByRole("button", { name: /Usar sugerencia y analizar/i })).toBeInTheDocument();
    expect(screen.getByText("Cliente regulado por norma financiera local y controles de auditoria trimestral.")).toBeInTheDocument();
    expect(screen.getByText("Politica de decisiones")).toBeInTheDocument();
    expect(screen.getByText(/Responder guarda y analiza impacto/i)).toBeInTheDocument();
    expect(screen.getByText("Inferida por LAB")).toBeInTheDocument();
    expect(screen.getByText("Solo documentar")).toBeInTheDocument();
    expect(screen.getByText("Ver impacto")).toBeInTheDocument();
  });

  it("analyzes premium answers before triggering any reconciliation", async () => {
    vi.mocked(premiumEnrichmentApi.getWorkspace)
      .mockResolvedValueOnce(createPremiumWorkspace())
      .mockResolvedValueOnce(createResolvedPremiumWorkspace());
    vi.mocked(premiumEnrichmentApi.resolveItem).mockResolvedValueOnce(createPremiumResolutionResult());

    renderWithLanguage(<ProductSaasView activeRoute={createRoute("blueprint_pro")} section="blueprint_pro" />);

    fireEvent.click(await screen.findByRole("button", { name: /Usar sugerencia y analizar/i }));

    await waitFor(() =>
      expect(premiumEnrichmentApi.resolveItem).toHaveBeenCalledWith(
        "session-uxa11",
        "uncertainty-1",
        expect.objectContaining({
          execution_mode: "analyze_only",
          regenerate: false,
        }),
      ),
    );
    expect(await screen.findByText("Decisión documentada sin reconciliación")).toBeInTheDocument();
    expect(screen.getByText("Solo documentar")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Reconciliar entregables afectados/i })).not.toBeInTheDocument();
  });

  it("requires an explicit follow-up action to reconcile affected premium deliverables", async () => {
    vi.mocked(premiumEnrichmentApi.getWorkspace)
      .mockResolvedValueOnce(createPremiumWorkspace())
      .mockResolvedValueOnce(createResolvedPremiumWorkspace())
      .mockResolvedValueOnce(createResolvedPremiumWorkspace());
    vi.mocked(premiumEnrichmentApi.resolveItem)
      .mockResolvedValueOnce(
        createPremiumResolutionResult({
          comparison_summary:
            "Se resolvio 'Precisar restricciones regulatorias'. La respuesta afecta entregables del Blueprint Pro.",
          impact_summary: "La respuesta afecta entregables del Blueprint Pro.",
          material_impact: true,
          queue_status: "pending_user_confirmation",
          reconciliation_decision: "localized_reconciliation",
          reconciliation_status: "pending_user_confirmation",
          recommended_action: "Reconcilia solo los entregables impactados para mantener consistencia.",
        }),
      )
      .mockResolvedValueOnce(
        createPremiumResolutionResult({
          comparison_summary:
            "Se resolvio 'Precisar restricciones regulatorias'. 1 entregable(s) fueron reconciliados en cola FIFO y 2 conservaron su version.",
          execution_mode: "apply_reconciliation",
          generation_job_ids: ["job-1"],
          impact_summary: "La respuesta afecta entregables del Blueprint Pro.",
          material_impact: true,
          queue_completed: 1,
          queue_processed_keys: ["blueprint_doc"],
          queue_status: "completed",
          queue_total: 1,
          reconciled_deliverable_keys: ["blueprint_doc"],
          reconciliation_decision: "localized_reconciliation",
          reconciliation_job_ids: ["job-1"],
          reconciliation_status: "completed",
          recommended_action: "Reconcilia solo los entregables impactados para mantener consistencia.",
          regenerated_deliverable_keys: ["blueprint_doc"],
        }),
      );

    renderWithLanguage(<ProductSaasView activeRoute={createRoute("blueprint_pro")} section="blueprint_pro" />);

    fireEvent.click(await screen.findByRole("button", { name: /Usar sugerencia y analizar/i }));

    const applyButton = await screen.findByRole("button", { name: "Reconciliar entregables afectados" });
    expect(screen.getByText("Reconciliación localizada")).toBeInTheDocument();

    fireEvent.click(applyButton);

    await waitFor(() =>
      expect(premiumEnrichmentApi.resolveItem).toHaveBeenNthCalledWith(
        2,
        "session-uxa11",
        "uncertainty-1",
        expect.objectContaining({
          execution_mode: "apply_reconciliation",
          regenerate: true,
        }),
      ),
    );
    expect(await screen.findByText("Reconciliación de entregables completada")).toBeInTheDocument();
    expect(screen.getByText("1 reconciliados")).toBeInTheDocument();
  });

  it("requests governed Blueprint Pro artifacts with cumulative package stage", async () => {
    vi.mocked(deliverableCatalogApi.list).mockResolvedValueOnce({
      contract_version: "deliverable-catalog-response.v1",
      current_stage: "package",
      entries: [],
      registry_version: "v1",
      tier: "blueprint_pro",
    });

    renderWithLanguage(<ProductSaasView activeRoute={createRoute("blueprint_pro")} section="blueprint_pro" />);

    fireEvent.click(screen.getByRole("tab", { name: /Artefactos gobernados/i }));

    await waitFor(() =>
      expect(deliverableCatalogApi.list).toHaveBeenCalledWith({
        currentStage: "package",
        sessionId: "session-uxa11",
        tier: "blueprint_pro",
      }),
    );
  });

  it("renders ACP executive overview inside the ACP Premium tabs", () => {
    renderWithLanguage(<ProductSaasView activeRoute={createRoute("acp")} section="acp" />);

    expect(screen.getByRole("heading", { name: "Resultado del Blueprint" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Resumen ACP/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Validar Blueprint/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Empaquetar ACP/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Diagramas de ACP/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Del diseno aprobado a una construccion gobernada" })).toBeInTheDocument();
  });

  it("shows a direct ACP handoff from Blueprint Pro when ACP is already enabled", () => {
    renderWithLanguage(<ProductSaasView activeRoute={createRoute("acp")} section="blueprint_pro" />);

    expect(screen.getByRole("link", { name: "Continuar con ACP" })).toHaveAttribute("href", "/projects/session-uxa11/acp");
  });

  it("shows the ACP approval gate instead of loading the preparation workspace before entitlement", () => {
    renderWithLanguage(<ProductSaasView activeRoute={createRoute("blueprint_pro")} section="acp" />);

    expect(screen.getByRole("heading", { name: "ACP inicia después de la aprobación, no antes" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Solicitar ACP" })).toHaveAttribute("href", "/projects/session-uxa11/acp");
    expect(vi.mocked(acpDirectApi.getResolution)).not.toHaveBeenCalled();
    expect(mockSessionsApi.getAcpWorkspace).not.toHaveBeenCalled();
    expect(mockSessionsApi.getAcpQuestions).not.toHaveBeenCalled();
    expect(screen.queryByText("Cargando el workspace de preparación ACP...")).not.toBeInTheDocument();
  });

  it("hides legacy ACP build tracker noise while ACP is still locked", () => {
    mockUseProductBuildStatus.mockReturnValueOnce(
      createProductBuildStatusMock({
        data: {
          actions: [],
          attention: {
            blocking_count: 1,
            items: [],
            technical_error_count: 0,
            total: 1,
            warning_count: 0,
          },
          contract_version: "product-build-status.v1",
          current_activity: {
            activity_key: "deliverable:diagram.human_intervention_flow",
            detail: "deliverable:diagram.human_intervention_flow",
            label: "Procesando artefactos pendientes",
            started_at: "2026-08-27T20:16:16Z",
            status: "queued",
            step_key: "deliverable:diagram.human_intervention_flow",
            updated_at: "2026-08-27T20:16:16Z",
          },
          deliverables: [
            {
              deliverable_key: "diagram.human_intervention_flow",
              deliverable_type: "diagram",
              href: "/projects/session-uxa11/acp",
              job_id: "job-acp-1",
              product_surface: "acp",
              required: true,
              stage_key: "validate",
              state: "locked",
              title: "Intervencion humana y aprobaciones",
              updated_at: "2026-08-27T20:16:16Z",
            },
          ],
          entitlement: {
            access_state: "locked",
            checkout_href: "/projects/session-uxa11/acp",
            is_purchased: false,
            purchase_required: true,
            tier: "blueprint_pro",
            upgrade_label: "Solicitar ACP",
          },
          generated_at: "2026-08-27T20:16:23Z",
          last_error: null,
          lifecycle: "not_purchased",
          processing_queue: {
            active: false,
            completed_at: "2026-08-27T20:16:23Z",
            completed_count: 12,
            completed_items: [],
            current_deliverable_key: "",
            failed_count: 1,
            failed_items: [],
            mode: "process_pending",
            pending_count: 3,
            processing_count: 0,
            queue_id: "queue-acp-legacy",
            retried_count: 0,
            started_at: "2026-08-27T20:15:26Z",
            status: "completed_with_errors",
            summary: "Cola legacy ACP generada antes del gate comercial.",
            total_count: 16,
            updated_at: "2026-08-27T20:16:23Z",
          },
          product_key: "acp",
          product_label: "ACP",
          product_mode: "acp_implementation",
          progress: {
            blocked_units: 2,
            calculation: "manual",
            completed_units: 12,
            label: "Estado legacy no autorizado.",
            percent: 55,
            total_units: 16,
          },
          session_id: "session-uxa11",
          source_contracts: ["product-build-status.v1"],
          stages: [],
          workspace_id: "workspace-1",
        },
        isEmpty: false,
        status: "success",
        updatedAt: Date.now(),
      }),
    );

    renderWithLanguage(<ProductSaasView activeRoute={createRoute("blueprint_pro")} section="acp" />);

    expect(screen.getByRole("heading", { name: "ACP inicia después de la aprobación, no antes" })).toBeInTheDocument();
    expect(screen.queryByText("Generación de Entregables")).not.toBeInTheDocument();
    expect(screen.queryByText("Cola legacy ACP generada antes del gate comercial.")).not.toBeInTheDocument();
  });

  it("keeps ACP preparation inside ACP tabs even when canonical LEAN prerequisites are missing", async () => {
    vi.mocked(acpDirectApi.getResolution).mockResolvedValueOnce(createAcpResolution());
    mockSessionsApi.getAcpWorkspace.mockResolvedValueOnce(createAcpWorkspace());
    mockSessionsApi.getAcpQuestions.mockResolvedValueOnce(createAcpQuestions());

    renderWithLanguage(<ProductSaasView activeRoute={createRoute("acp")} section="acp" />);

    expect(await screen.findByRole("heading", { name: "Espacio concentrado del ACP sin reiniciar el Blueprint" })).toBeInTheDocument();
    const internalNav = screen.getByRole("navigation", { name: "Navegacion interna ACP" });
    expect(within(internalNav).getByRole("link", { name: /Preparacion/i })).toHaveAttribute("href", "#acp-preparation-overview");
    expect(within(internalNav).getByRole("link", { name: /Pendientes/i })).toHaveAttribute("href", "#acp-pending-questions");
    expect(within(internalNav).getByRole("link", { name: /Impacto/i })).toHaveAttribute("href", "#acp-impact-summary");
    expect(within(internalNav).getByRole("link", { name: "Validar ACP" })).toHaveAttribute("href", "/projects/session-uxa11/acp?acp_tab=validate");
    expect(within(internalNav).getByRole("link", { name: "Package ACP" })).toHaveAttribute("href", "/projects/session-uxa11/acp?acp_tab=package");
    const preparationLinks = screen.getAllByRole("link", { name: "Abrir preparación ACP" });
    expect(preparationLinks[0]).toHaveAttribute("href", "/projects/session-uxa11/acp?acp_tab=validate");
    expect(screen.getByText("Fases del ACP")).toBeInTheDocument();
    expect(screen.getByText("Grupos de preguntas abiertas")).toBeInTheDocument();
    expect(screen.getByText("Impacto y acumulacion")).toBeInTheDocument();
  });

  it("keeps ACP focused on preparation while the ZIP is still blocked", async () => {
    vi.mocked(acpDirectApi.getResolution).mockResolvedValueOnce(createAcpResolution());
    mockSessionsApi.getAcpWorkspace.mockResolvedValueOnce(createAcpWorkspace());
    mockSessionsApi.getAcpQuestions.mockResolvedValueOnce(createAcpQuestions());

    renderWithLanguage(<ProductSaasView activeRoute={createRoute("acp")} section="acp" />);

    const preparationLinks = await screen.findAllByRole("link", { name: "Abrir preparación ACP" });
    expect(preparationLinks[0]).toHaveAttribute("href", "/projects/session-uxa11/acp?acp_tab=validate");
    expect(screen.queryByRole("button", { name: "Descargar ACP ZIP" })).not.toBeInTheDocument();
  });

  it("surfaces answer outcomes and delegated decisions inside ACP impact panel", async () => {
    vi.mocked(acpDirectApi.getResolution).mockResolvedValueOnce(createAcpResolution());
    mockSessionsApi.getAcpWorkspace.mockResolvedValueOnce(createAcpWorkspace());
    mockSessionsApi.getAcpQuestions.mockResolvedValueOnce([
      {
        ...createAcpQuestions()[0],
        answer_text: "Delegado a implementacion. Resolver durante la construccion con trazabilidad ACP.",
        impact_analysis: {
          affected_phase_keys: ["implementation_questions", "package_build", "conformance_export"],
          affected_stage_keys: ["acp", "package"],
          impact_kind: "delegated_to_implementation",
          impact_summary: "La decision viaja al paquete ACP sin recalculo inmediato.",
          material_impact: false,
          recommended_action: "Resolver durante implementacion.",
          reprocess_decision: "delegated_to_implementation",
        },
        resolved_at: "2026-08-27T10:00:00Z",
        status: "deferred" as const,
      },
      {
        ...createAcpQuestions()[1],
        answer_text: "name=Confluence; type=wiki; owner=ops",
        impact_analysis: {
          affected_phase_keys: ["implementation_questions", "package_build"],
          affected_stage_keys: ["acp", "package"],
          impact_kind: "localized_impact",
          impact_summary: "La respuesta impacta artefactos localizados.",
          material_impact: true,
          recommended_action: "Reconciliar Validate o Package al actualizar entregables.",
          reprocess_decision: "localized_reconciliation",
        },
        status: "answered" as const,
      },
    ]);

    renderWithLanguage(<ProductSaasView activeRoute={createRoute("acp")} section="acp" />);

    expect(await screen.findByText("Resultado de respuestas")).toBeInTheDocument();
    expect(screen.getByText(/1 respuesta\(s\) ya quedaron trazables/i)).toBeInTheDocument();
    expect(screen.getByText(/1 por reconciliar/i)).toBeInTheDocument();
    expect(screen.getByText(/1 decision\(es\) viajaran dentro del paquete ACP/i)).toBeInTheDocument();
  });

  it("shows the ACP ZIP download only when the workspace is exportable", async () => {
    vi.mocked(acpDirectApi.getResolution).mockResolvedValueOnce({
      ...createAcpResolution(),
      can_export_package: true,
      can_start_package: true,
      missing_stage_keys: [],
      next_stage_key: "package",
      readiness_blockers: [],
    });
    mockSessionsApi.getAcpWorkspace.mockResolvedValueOnce(
      createAcpWorkspace({
        next_action: "Generar package y exportar.",
        readiness: {
          assumptions_count: 0,
          blocking_gaps: 0,
          can_start_build: true,
          gaps: [],
          next_recommended_action: "Exportar package.",
          open_questions: 0,
          overall_status: "ready",
        },
        validation: {
          can_export_zip: true,
          completeness_percent: 100,
          issues: [],
          overall_status: "ready",
        },
      }),
    );
    mockSessionsApi.getAcpQuestions.mockResolvedValueOnce([]);

    renderWithLanguage(<ProductSaasView activeRoute={createRoute("acp")} section="acp" />);

    expect(await screen.findByRole("button", { name: "Descargar ACP ZIP" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Generar Package" })).toHaveAttribute(
      "href",
      "/projects/session-uxa11/acp?acp_tab=package",
    );
  });

  it("keeps Validate and Package as internal ACP Premium sections", () => {
    renderWithLanguage(<ProductSaasView activeRoute={createRoute("acp")} section="acp" />);
    expect(screen.getByRole("heading", { name: "Agent Construction Package (ACP)" })).toBeInTheDocument();
  });
});
