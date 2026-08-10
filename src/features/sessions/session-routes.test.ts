import {
  getPreferredProjectStage,
  getSessionProjectRoute,
  getSessionProjectWorkRoute,
  persistLastVisitedProjectStage,
} from "@/features/sessions/session-routes";
import type { SessionCommercialAccess, SessionSnapshot, SessionSummary } from "@/features/sessions/types";

function createSession(overrides?: Partial<SessionSummary>): SessionSummary {
  return {
    created_at: "2026-07-16T10:00:00",
    current_stage: "build_blueprint",
    id: "session-s3",
    status: "needs_review",
    title: "Asistente de soporte",
    updated_at: "2026-07-16T10:15:00",
    ...overrides,
  };
}

function createCommercialAccess(overrides?: Partial<SessionCommercialAccess>): SessionCommercialAccess {
  return {
    available_upgrades: ["blueprint_pro", "acp"],
    can_access_library_workspace: false,
    can_build_acp: false,
    can_download_acp: false,
    can_download_blueprint: false,
    can_export_acp_zip: false,
    can_export_blueprint_core: false,
    can_export_blueprint_document: false,
    can_export_construction_pack: false,
    can_export_estimation_pack: false,
    can_export_json: false,
    can_export_markdown: false,
    can_export_prompt_pack: false,
    can_export_test_pack: false,
    can_invite_acp: true,
    can_view_blueprint: true,
    can_view_diagram_acp: false,
    can_view_diagram_blueprint: false,
    can_view_diagram_sample: true,
    can_view_in_app_blueprint: true,
    tier: "blueprint",
    tier_label: "Blueprint",
    tier_rank: 1,
    upgrade_cta_label: "Upgrade a Blueprint Profesional",
    upgrade_message: "Explora el Blueprint en la plataforma antes de adquirir exportables premium.",
    ...overrides,
  };
}

function createSnapshot(overrides?: Partial<SessionSnapshot>): SessionSnapshot {
  return {
    activity: [],
    alert_events: [],
    approvals: [],
    artifact_records: [],
    blueprint: {
      architecture: "single_agent_with_skills",
      contract_version: "blueprint.v1",
      delivery_package: {
        blueprint_coverage: {
          covered_sections: 1,
          missing_sections: [],
          overall_status: "complete",
          sections: [],
          total_sections: 1,
        },
        component_readiness: [],
        contract_version: "delivery-package.v1",
        decision_summary: "",
        decision_trace: [],
        deliverables: [],
        observability_plan: {
          alert_triggers: [],
          captured_signals: [],
          cost_tracking: "",
          decision_logging: "",
          duration_tracking: "",
          plan_summary_policy: "",
          result_tracking: "",
          tool_response_logging: "",
        },
        pattern_catalog: [],
        risk_summary: {
          approval_gates_required: 0,
          high_risks: 0,
          low_risks: 0,
          medium_risks: 0,
          overall_status: "complete",
          side_effect_tools: 0,
          summary: "",
          total_checks: 0,
        },
        roadmap_evolution: {
          current_focus: "Validate",
          current_release: "Focused Builder",
          milestones: [],
        },
        workflow_profile: {
          approval_pause: "",
          checkpoint_policy: "",
          compensation_strategy: "",
          execution_pattern: "",
          inbox_strategy: "",
          outbox_strategy: "",
          retry_strategy: "",
          steps: [],
          timeout_policy: "",
        },
      },
      guardrails: [],
      memory_profile: {
        goal_drift_guard: "Comparar objetivo y salida",
        retrieval_policy: "Traer solo evidencia aprobada",
        review_trigger: "Antes de responder",
        storage_layers: ["session_state"],
        strategy: "persistent_memory",
        write_policy: "Guardar decisiones aprobadas",
      },
      memory_strategy: "persistent_memory",
      narrative: "Narrativa base",
      readiness_state: "complete",
      reasoning_pattern: "Plan-and-Execute",
      safety_checks: [],
      tools: [
        {
          approval_reason: "",
          compensation_strategy: "",
          execution_mode: "read",
          failure_mode: "",
          has_side_effects: false,
          inputs: [],
          name: "buscar_ticket",
          outputs: [],
          purpose: "Consultar tickets",
          requires_approval: false,
          retry_strategy: "",
          risk_level: "low",
          validations: [],
        },
      ],
    },
    blueprint_versions: [],
    canvas: {
      agent_profile: {
        agent_task: "Ayudar al equipo",
        allowed_decisions: [],
        expected_outputs: [],
        human_approvals: [],
        key_inputs: [],
        mission: "",
        primary_user: "",
        prohibited_decisions: [],
        success_metrics: [],
      },
      mvp_scope: [],
      out_of_scope: [],
      primary_risk: "",
      success_metric: "",
      user_goal: "",
    },
    commercial_access: createCommercialAccess(),
    contract_version: "session-snapshot.v1",
    discovery: {
      autonomy_level: "medium",
      case_type: "copiloto",
      constraints: [],
      current_process: "",
      current_user: "",
      desired_outcome: "",
      mvp_definition: {
        non_delegable_decisions: [],
        north_star_metric: "",
        out_of_scope: [],
        v1_scope: [],
      },
      operational_baseline: {
        automation_opportunities: [],
        current_cost: "",
        current_time_spent: "",
        frequent_errors: [],
      },
      problem_statement: "",
      value_statement: "",
    },
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
    session: createSession(),
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
    ...overrides,
  };
}

describe("session project routes", () => {
  beforeEach(() => {
    const storage = new Map<string, string>();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        removeItem: (key: string) => void storage.delete(key),
        setItem: (key: string, value: string) => void storage.set(key, value),
      },
    });
    window.localStorage.removeItem("lean-builder.last-project-stage");
  });

  it("restores the last visited in-progress stage when it is still accessible", () => {
    const session = createSession();
    const snapshot = createSnapshot();

    persistLastVisitedProjectStage(session.id, "memory");

    expect(getPreferredProjectStage(session, snapshot)).toBe("memory");
    expect(getSessionProjectRoute(session, snapshot)).toBe("/projects/session-s3/blueprint");
    expect(getSessionProjectWorkRoute(session, snapshot)).toBe("/projects/session-s3/work/memory");
  });

  it("falls back to the recommended stage when the stored stage is no longer accessible", () => {
    const session = createSession({
      current_stage: "normalize_discovery",
    });
    const snapshot = createSnapshot({
      blueprint: null,
      canvas: null,
      discovery: null,
      session,
    });

    persistLastVisitedProjectStage(session.id, "package");

    expect(getPreferredProjectStage(session, snapshot)).toBe("discover");
    expect(getSessionProjectRoute(session, snapshot)).toBe("/projects/session-s3/work/discover");
    expect(getSessionProjectWorkRoute(session, snapshot)).toBe("/projects/session-s3/work/discover");
  });

  it("moves to estimate once validation exists and no more design work is pending", () => {
    const session = createSession({
      current_stage: "post_validation",
    });
    const snapshot = createSnapshot({
      evaluation_runs: [
        {
          blocking_issues: [],
          blueprint_version_number: 2,
          category_scores: {},
          created_at: "2026-07-16T11:00:00",
          dataset_version_number: 1,
          dimension_scores: {},
          id: "run-1",
          overall_score: 84,
          recommendations: [],
          results: [],
          rubric_version_number: 1,
          source_action: "evaluate_blueprint",
          status: "ready",
          summary: "Validacion aprobada",
        },
      ],
      session,
    });

    expect(getPreferredProjectStage(session, snapshot)).toBe("estimate");
  });

  it("keeps the user in blueprint results when ACP stages were stored without entitlement", () => {
    const session = createSession({
      current_stage: "ready_for_export",
      status: "ready",
    });
    const snapshot = createSnapshot({
      estimation_report: { is_stale: false } as NonNullable<SessionSnapshot["estimation_report"]>,
      session,
    });

    persistLastVisitedProjectStage(session.id, "package");

    expect(getPreferredProjectStage(session, snapshot)).toBe("estimate");
    expect(getSessionProjectRoute(session, snapshot)).toBe("/projects/session-s3/blueprint");
    expect(getSessionProjectWorkRoute(session, snapshot)).toBe("/projects/session-s3/work/estimate");
  });

  it("starts ACP validation after blueprint estimate when ACP entitlement exists", () => {
    const session = createSession({
      current_stage: "post_validation",
      status: "ready",
    });
    const snapshot = createSnapshot({
      commercial_access: createCommercialAccess({
        available_upgrades: [],
        can_build_acp: true,
        can_download_acp: true,
        can_export_acp_zip: true,
        can_export_construction_pack: true,
        can_export_prompt_pack: true,
        can_export_test_pack: true,
        can_invite_acp: true,
        can_view_diagram_acp: true,
        tier: "acp",
        tier_label: "ACP Premium",
        tier_rank: 3,
      }),
      estimation_report: { is_stale: false } as NonNullable<SessionSnapshot["estimation_report"]>,
      session,
    });

    expect(getPreferredProjectStage(session, snapshot)).toBe("validate");
    expect(getSessionProjectRoute(session, snapshot)).toBe("/projects/session-s3/acp");
    expect(getSessionProjectWorkRoute(session, snapshot)).toBe("/projects/session-s3/work/validate");
  });

  it("returns to estimate when the persisted estimation is stale after a blueprint change", () => {
    const session = createSession({
      current_stage: "ready_for_export",
      status: "ready",
    });
    const snapshot = createSnapshot({
      estimation_report: {
        agentic: {
          active_provider: "openai",
          assumptions: [],
          automation_assessments: [],
          automation_coverage_by_artifact_family: {},
          automation_coverage_by_workstream: {},
          automation_coverage_percent: 62,
          acp_package_readiness_percent: 88,
          blueprint_design_coverage_percent: 91,
          economic_model: "automation_first",
          estimated_cost: 9800000,
          estimated_duration_weeks: 4,
          estimated_hours_total: 120,
          human_delivery_cost: 4400000,
          human_supervision_cost: 800000,
          human_supervision_hours: 18,
          llm_runtime_cost_usd: 80,
          net_savings_vs_traditional: 5400000,
          platform_cost_usd: 50,
          platform_overhead_cost_usd: 12,
          pricing_assumptions: [],
          pricing_policy: "openai_standard",
          pricing_snapshot: null,
          provider_model: "gpt-5",
          provider_runtime_cost_total_cop: 320000,
          provider_runtime_cost_total_usd: 80,
          implementation_scope_coverage_percent: 62,
          scenario_type: "agentic",
          team_shape: [],
          tool_runtime_cost_usd: 18,
          tooling_cost_usd: 24,
          warnings: [],
          workstream_breakdown: [],
        },
        assumptions: ["Blueprint validado sobre alcance controlado."],
        analysis: null,
        analysis_decision: {
          decision: "pending",
          note: "",
        },
        base_confidence: {
          assumptions_count: 1,
          blocking_gaps: 0,
          label: "medium",
          negative_signals: [],
          open_questions: 0,
          positive_signals: ["Evaluation completa"],
          recommended_next_actions: ["Recalcular tras cambio de blueprint"],
          score: 76,
          subscores: {},
          uncertainty_band_percent: 10,
        },
        blueprint_version_number: 2,
        confidence: {
          assumptions_count: 1,
          blocking_gaps: 0,
          label: "medium",
          negative_signals: [],
          open_questions: 0,
          positive_signals: ["Evaluation completa"],
          recommended_next_actions: ["Recalcular tras cambio de blueprint"],
          score: 72,
          subscores: {},
          uncertainty_band_percent: 12,
        },
        contract_version: "estimation-report.v1",
        current_blueprint_version_number: 3,
        deterministic_inputs: {
          benchmark_corpus_hash: "corpus-hash",
          benchmark_ids: [],
          calibration_sample_size: 0,
          catalogs_used: ["estimation_pricing_profiles"],
          formula_notes: ["Escenario agentic = costo humano + runtime provider."],
          pricing_catalog_signature: "pricing-signature",
          validation_fingerprint: "validation-signature",
        },
        generated_at: "2026-07-16T12:00:00",
        is_stale: true,
        maturity_stage: "blueprint",
        notes: ["La corrida quedo stale por version."],
        package_policy: {
          can_continue_to_package: false,
          commercial_blocked: false,
          package_block_reasons: ["La corrida esta stale."],
          preliminary: false,
        },
        risk_drivers: ["Cambio reciente en workflow profile"],
        stale_reasons: ["blueprint_version_changed"],
        source_artifacts: ["blueprint", "evaluation"],
        traditional: {
          assumptions: [],
          estimated_cost: 15200000,
          estimated_duration_weeks: 6,
          estimated_hours_total: 180,
          scenario_type: "traditional",
          team_shape: [],
          warnings: [],
          workstream_breakdown: [],
        },
      },
      evaluation_runs: [
        {
          blocking_issues: [],
          blueprint_version_number: 3,
          category_scores: {},
          created_at: "2026-07-16T11:00:00",
          dataset_version_number: 1,
          dimension_scores: {},
          id: "run-2",
          overall_score: 88,
          recommendations: [],
          results: [],
          rubric_version_number: 1,
          source_action: "evaluate_blueprint",
          status: "ready",
          summary: "Validacion actualizada",
        },
      ],
      session,
    });

    expect(getPreferredProjectStage(session, snapshot)).toBe("estimate");
    expect(getSessionProjectRoute(session, snapshot)).toBe("/projects/session-s3/blueprint");
    expect(getSessionProjectWorkRoute(session, snapshot)).toBe("/projects/session-s3/work/estimate");
  });
});
