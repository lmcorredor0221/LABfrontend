import {
  BLUEPRINT_RESULT_DIAGRAMS,
  buildBlueprintComparisonSummary,
  canDownloadBlueprintProfessional,
  resolveBlueprintProfessionalDownloadState,
  resolveBlueprintDiagramPreviewState,
  resolveBlueprintResultAccess,
} from "@/features/blueprint/blueprint-results-adapter";
import type { EstimationReportArtifact } from "@/features/sessions/session-contracts";
import type { SessionCommercialAccess } from "@/features/sessions/types";

function createAccess(overrides?: Partial<SessionCommercialAccess>): SessionCommercialAccess {
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
    upgrade_cta_label: "Upgrade",
    upgrade_message: "Upgrade disponible.",
    ...overrides,
  };
}

function createReport(): EstimationReportArtifact {
  return {
    agentic: {
      active_provider: "openai",
      assumptions: [],
      automation_assessments: [],
      automation_coverage_by_artifact_family: {},
      automation_coverage_by_workstream: {},
      automation_coverage_percent: 60,
      acp_package_readiness_percent: 92,
      blueprint_design_coverage_percent: 90,
      economic_model: "automation_first",
      estimated_cost: 30000,
      estimated_duration_weeks: 2,
      estimated_hours_total: 60,
      human_delivery_cost: 25000,
      human_supervision_cost: 2000,
      human_supervision_hours: 12,
      llm_runtime_cost_usd: 50,
      net_savings_vs_traditional: 70000,
      platform_cost_usd: 100,
      platform_overhead_cost_usd: 20,
      pricing_assumptions: [],
      pricing_policy: "standard",
      pricing_snapshot: null,
      provider_model: "gpt-5",
      provider_runtime_cost_total_cop: 100000,
      provider_runtime_cost_total_usd: 25,
      implementation_scope_coverage_percent: 58,
      scenario_type: "agentic",
      team_shape: [],
      tool_runtime_cost_usd: 0,
      tooling_cost_usd: 0,
      warnings: [],
      workstream_breakdown: [],
    },
    analysis: null,
    analysis_decision: {
      decision: "pending",
      note: "",
    },
    assumptions: [],
    confidence: {
      assumptions_count: 0,
      blocking_gaps: 0,
      label: "high",
      negative_signals: [],
      open_questions: 0,
      positive_signals: [],
      recommended_next_actions: [],
      score: 88,
      subscores: {},
      uncertainty_band_percent: 8,
    },
    contract_version: "estimation-report.v1",
    deterministic_inputs: {
      benchmark_corpus_hash: "",
      benchmark_ids: [],
      calibration_sample_size: 0,
      catalogs_used: [],
      formula_notes: [],
      pricing_catalog_signature: "",
      validation_fingerprint: "",
    },
    is_stale: false,
    maturity_stage: "blueprint",
    notes: [],
    package_policy: {
      can_continue_to_package: true,
      commercial_blocked: false,
      package_block_reasons: [],
      preliminary: false,
    },
    risk_drivers: [],
    stale_reasons: [],
    source_artifacts: [],
    traditional: {
      assumptions: [],
      estimated_cost: 100000,
      estimated_duration_weeks: 6,
      estimated_hours_total: 200,
      scenario_type: "traditional",
      team_shape: [],
      warnings: [],
      workstream_breakdown: [],
    },
  };
}

describe("blueprint results adapter", () => {
  it("keeps free users in protected view-only mode with architecture sample", () => {
    const access = createAccess();
    const architecture = BLUEPRINT_RESULT_DIAGRAMS.find((item) => item.diagramKey === "architecture_overview");
    const orchestration = BLUEPRINT_RESULT_DIAGRAMS.find((item) => item.diagramKey === "agent_orchestration");

    expect(resolveBlueprintResultAccess(access)).toBe("free_view_only");
    expect(resolveBlueprintDiagramPreviewState(architecture!, access)).toBe("sample");
    expect(resolveBlueprintDiagramPreviewState(orchestration!, access)).toBe("locked_blueprint");
  });

  it("unlocks Blueprint diagrams for professional tier without unlocking ACP-only diagrams", () => {
    const access = createAccess({
      can_download_blueprint: true,
      can_export_blueprint_core: true,
      can_view_diagram_blueprint: true,
      tier: "blueprint_pro",
      tier_rank: 2,
    });
    const orchestration = BLUEPRINT_RESULT_DIAGRAMS.find((item) => item.diagramKey === "agent_orchestration");
    const testSuite = BLUEPRINT_RESULT_DIAGRAMS.find((item) => item.diagramKey === "evaluation_test_suite");

    expect(resolveBlueprintResultAccess(access)).toBe("professional_unlocked");
    expect(resolveBlueprintDiagramPreviewState(orchestration!, access)).toBe("unlocked");
    expect(resolveBlueprintDiagramPreviewState(testSuite!, access)).toBe("locked_acp");
  });

  it("blocks professional download in free tier until Blueprint Pro is acquired", () => {
    const access = createAccess();
    const downloadState = resolveBlueprintProfessionalDownloadState(access);

    expect(canDownloadBlueprintProfessional(access)).toBe(false);
    expect(downloadState.allowed).toBe(false);
    expect(downloadState.reason).toBe("requires_purchase");
  });

  it("allows professional download when export entitlement is present", () => {
    const access = createAccess({
      can_export_blueprint_core: true,
      tier: "blueprint_pro",
      tier_rank: 2,
    });
    const downloadState = resolveBlueprintProfessionalDownloadState(access);

    expect(canDownloadBlueprintProfessional(access)).toBe(true);
    expect(downloadState.allowed).toBe(true);
    expect(downloadState.reason).toBe("ready");
  });

  it("keeps download blocked when product is active but workspace role cannot export", () => {
    const access = createAccess({
      can_download_blueprint: false,
      can_export_blueprint_core: false,
      tier: "blueprint_pro",
      tier_rank: 2,
    });
    const downloadState = resolveBlueprintProfessionalDownloadState(access);

    expect(canDownloadBlueprintProfessional(access)).toBe(false);
    expect(downloadState.allowed).toBe(false);
    expect(downloadState.reason).toBe("requires_workspace_permission");
  });

  it("calculates Blueprint comparison when report has no prebuilt scenario", () => {
    const summary = buildBlueprintComparisonSummary(createReport());

    expect(summary?.traditional.estimated_hours_total).toBe(200);
    expect(summary?.blueprintAssisted.estimated_hours_total).toBeLessThan(200);
    expect(summary?.effortReductionPercent).toBeGreaterThan(0);
    expect(summary?.costSavingsPercent).toBeGreaterThan(0);
  });
});
