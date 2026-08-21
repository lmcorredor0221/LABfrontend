import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { vi } from "vitest";
import { LanguageProvider } from "@/core/i18n/language-context";
import { deliverableCatalogApi } from "@/features/deliverables/infrastructure/deliverable-catalog-api";
import { getConstructionScenarios } from "@/features/product-experience/saas/saas-product-model";
import {
  premiumEnrichmentApi,
  type PremiumEnrichmentWorkspace,
} from "@/features/product-experience/saas/premium-enrichment-api";
import { ProductSaasView } from "@/features/product-experience/saas/saas-product-views";
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

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockUseSearchParams(),
}));

vi.mock("@/features/product-experience/saas/premium-enrichment-api", () => ({
  premiumEnrichmentApi: {
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
  useProductBuildStatus: vi.fn(() => ({
    data: null,
    error: null,
    isEmpty: true,
    isError: false,
    isFetching: false,
    isFinal: false,
    isLoading: false,
    isStale: false,
    refresh: vi.fn(async () => null),
    status: "empty",
    updatedAt: null,
  })),
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

beforeEach(() => {
  mockPush.mockClear();
  mockUseSearchParams.mockReturnValue(new URLSearchParams());
});

describe("UXA11 SaaS stage views", () => {
  it("renders Estimate with construction scenarios and commercial readiness", () => {
    renderWithLanguage(<EstimateStageView activeRoute={createRoute()} />);

    expect(screen.getByRole("heading", { name: "LAB encontro una oportunidad concreta de ahorro" })).toBeInTheDocument();
    expect(screen.getAllByText("ACP agentico").length).toBeGreaterThan(0);
    expect(screen.getByText("Comparacion base")).toBeInTheDocument();
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

  it("renders the direct suggestion accelerator when premium enrichment returns a suggested answer", async () => {
    vi.mocked(premiumEnrichmentApi.getWorkspace).mockResolvedValueOnce(createPremiumWorkspace());

    renderWithLanguage(<ProductSaasView activeRoute={createRoute("blueprint_pro")} section="blueprint_pro" />);

    expect(await screen.findByRole("button", { name: /Usar sugerencia directa/i })).toBeInTheDocument();
    expect(screen.getByText("Cliente regulado por norma financiera local y controles de auditoria trimestral.")).toBeInTheDocument();
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

  it("keeps Validate and Package as internal ACP Premium sections", () => {
    renderWithLanguage(<ProductSaasView activeRoute={createRoute("acp")} section="acp" />);

    fireEvent.click(screen.getByRole("tab", { name: /Validar Blueprint/ }));
    expect(screen.getByRole("heading", { name: "Validar Blueprint antes del ACP" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /Empaquetar ACP/ }));
    expect(screen.getByRole("heading", { name: "Package portable y desacoplado" })).toBeInTheDocument();
  });

  it("renders Blueprint Pro and ACP executive overviews as separate SaaS moments", () => {
    const pro = renderWithLanguage(<ProductSaasView activeRoute={createRoute("blueprint")} section="blueprint_pro_overview" />);
    expect(screen.getByRole("heading", { name: "De una propuesta clara a un Blueprint defendible" })).toBeInTheDocument();
    pro.unmount();

    renderWithLanguage(<ProductSaasView activeRoute={createRoute("blueprint")} section="acp_overview" />);
    expect(screen.getByRole("heading", { name: "Del diseno aprobado a una construccion gobernada" })).toBeInTheDocument();
  });

  it("renders canonical Entregables and Diagrams Hub with filters and deep links", async () => {
    renderWithLanguage(<ProductSaasView activeRoute={createRoute("blueprint")} section="artifacts" />);

    expect(screen.getByRole("heading", { name: "Hub de Entregables y Diagramas" })).toBeInTheDocument();
    expect(screen.getByText("Hub Canónico de Entregables")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Filtrar por título, key, descripción...")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Filtrar por tipo" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Filtrar por tier" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Filtrar por etapa" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Filtrar por disponibilidad" })).toBeInTheDocument();
  });

  it("preserves the ACP agentic scenario for downstream package value", () => {
    const scenarios = getConstructionScenarios(createRoute("acp").snapshot.data);
    const acpAgentic = scenarios.find((scenario) => scenario.scenario_key === "acp_agentic");

    expect(acpAgentic?.estimated_hours_total).toBe(145);
    expect(acpAgentic?.tone).toBe("success");
  });
});
