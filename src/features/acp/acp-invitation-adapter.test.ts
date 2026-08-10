import {
  buildAcpInvitationMetrics,
  canOpenAcpPremium,
  resolveAcpGateState,
} from "@/features/acp/acp-invitation-adapter";
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
      acp_package_readiness_percent: 94,
      assumptions: [],
      automation_assessments: [],
      automation_coverage_by_artifact_family: {},
      automation_coverage_by_workstream: {},
      automation_coverage_percent: 74,
      blueprint_design_coverage_percent: 90,
      economic_model: "automation_first",
      estimated_cost: 42000,
      estimated_duration_weeks: 2,
      estimated_hours_total: 80,
      human_delivery_cost: 36000,
      human_supervision_cost: 4000,
      human_supervision_hours: 18,
      implementation_scope_coverage_percent: 58,
      llm_runtime_cost_usd: 80,
      net_savings_vs_traditional: 98000,
      platform_cost_usd: 120,
      platform_overhead_cost_usd: 40,
      pricing_assumptions: [],
      pricing_policy: "standard",
      pricing_snapshot: null,
      provider_model: "gpt-5",
      provider_runtime_cost_total_cop: 180000,
      provider_runtime_cost_total_usd: 45,
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
      score: 90,
      subscores: {},
      uncertainty_band_percent: 6,
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
      estimated_cost: 140000,
      estimated_duration_weeks: 8,
      estimated_hours_total: 280,
      scenario_type: "traditional",
      team_shape: [],
      warnings: [],
      workstream_breakdown: [],
    },
  };
}

describe("acp invitation adapter", () => {
  it("keeps Blueprint users behind the purchase gate", () => {
    const access = createAccess();

    expect(resolveAcpGateState(access)).toBe("purchase_required");
    expect(canOpenAcpPremium(access)).toBe(false);
  });

  it("does not unlock ACP just because the tier is acp when role capabilities are missing", () => {
    const access = createAccess({
      tier: "acp",
      tier_rank: 3,
    });

    expect(resolveAcpGateState(access)).toBe("permission_required");
    expect(canOpenAcpPremium(access)).toBe(false);
  });

  it("unlocks ACP only when an effective ACP capability is present", () => {
    const access = createAccess({
      can_build_acp: true,
      tier: "acp",
      tier_rank: 3,
    });

    expect(resolveAcpGateState(access)).toBe("unlocked");
    expect(canOpenAcpPremium(access)).toBe(true);
  });

  it("calculates incremental value against Blueprint-assisted delivery", () => {
    const metrics = buildAcpInvitationMetrics(createReport());

    expect(metrics.additionalCostSavings).toBeGreaterThan(0);
    expect(metrics.additionalCostSavingsPercent).toBeGreaterThan(0);
    expect(metrics.additionalEffortReductionPercent).toBeGreaterThan(0);
    expect(metrics.riskReductionPercent).toBeGreaterThan(0);
  });
});
