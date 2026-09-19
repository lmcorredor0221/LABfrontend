import { describe, expect, it } from "vitest";
import { getProjectEffortMetrics } from "./effort-metrics";
import type { EstimationReportArtifact } from "@/features/sessions/session-contracts";

describe("getProjectEffortMetrics", () => {
  it("returns fallback values when report is null or undefined", () => {
    const metrics = getProjectEffortMetrics(null);

    expect(metrics.hasReport).toBe(false);
    expect(metrics.traditionalHours).toBe(350);
    expect(metrics.traditionalHoursDisplay).toBe("~350 h-h");
    expect(metrics.freeSavedHours).toBe(18);
    expect(metrics.freeSavedDisplay).toBe("~18 h-h");
    expect(metrics.proAdditionalSavedHours).toBe(45);
    expect(metrics.proAdditionalSavedDisplay).toBe("~45 h-h");
    expect(metrics.proTotalSavedHours).toBe(63);

    // Sum of free items must equal freeSavedHours
    const freeSum = metrics.freeDeliverablesBreakdown.reduce((sum, item) => sum + item.hours, 0);
    expect(freeSum).toBe(18);

    // Sum of pro items must equal proAdditionalSavedHours
    const proSum = metrics.proDeliverablesBreakdown.reduce((sum, item) => sum + item.hours, 0);
    expect(proSum).toBe(45);
  });

  it("calculates coherent hours when an estimation report with scenarios is present", () => {
    const mockReport = {
      agentic: {
        acp_package_readiness_percent: 90,
        automation_coverage_percent: 72,
        blueprint_design_coverage_percent: 85,
        estimated_cost: 12000,
        estimated_duration_weeks: 3.5,
        estimated_hours_total: 183.93,
        net_savings_vs_traditional: 8000,
        provider_runtime_cost_total_cop: 0,
        speedup_factor: 2.1,
      },
      commercial_explanation: {
        best_choice_summary: "ACP",
        roi_narrative: "High ROI",
        scenario_recommendation: "acp_agentic",
        tradeoffs: [],
      },
      construction_scenarios: [
        {
          automation_leverage_percent: 0,
          cost_savings_vs_traditional: 0,
          description: "Tradicional",
          effort_reduction_vs_traditional_percent: 0,
          estimated_cost: 20000,
          estimated_duration_weeks: 8,
          estimated_hours_total: 345.02,
          human_intervention_percent: 100,
          label: "Tradicional",
          notes: [],
          scenario_key: "traditional_blueprint",
        },
        {
          automation_leverage_percent: 32,
          cost_savings_vs_traditional: 5000,
          description: "Free",
          effort_reduction_vs_traditional_percent: 26,
          estimated_cost: 15000,
          estimated_duration_weeks: 6,
          estimated_hours_total: 254.73,
          human_intervention_percent: 82,
          label: "Blueprint Basico",
          notes: [],
          scenario_key: "blueprint_basic",
        },
        {
          automation_leverage_percent: 55,
          cost_savings_vs_traditional: 7000,
          description: "Pro",
          effort_reduction_vs_traditional_percent: 35,
          estimated_cost: 13000,
          estimated_duration_weeks: 5,
          estimated_hours_total: 224.02,
          human_intervention_percent: 68,
          label: "Blueprint Premium",
          notes: [],
          scenario_key: "blueprint_premium",
        },
        {
          automation_leverage_percent: 72,
          cost_savings_vs_traditional: 8000,
          description: "ACP",
          effort_reduction_vs_traditional_percent: 47,
          estimated_cost: 12000,
          estimated_duration_weeks: 3.5,
          estimated_hours_total: 183.93,
          human_intervention_percent: 28,
          label: "ACP Agentic",
          notes: [],
          scenario_key: "acp_agentic",
        },
      ],
      generated_at: "2026-09-18T00:00:00Z",
      inputs_hash: "abc",
      is_stale: false,
      package_policy: {
        can_export: true,
        package_block_reasons: [],
        ready_for_package: true,
      },
      stale_reasons: [],
      traditional: {
        estimated_cost: 20000,
        estimated_duration_weeks: 8,
        estimated_hours_total: 345.02,
      },
    };

    const metrics = getProjectEffortMetrics(mockReport as unknown as EstimationReportArtifact);

    expect(metrics.hasReport).toBe(true);
    expect(metrics.traditionalHours).toBe(345);
    expect(metrics.traditionalHoursDisplay).toBe("~345 h-h");

    // Free hours = 255, so Free saved = 345 - 255 = 90
    expect(metrics.freeHours).toBe(255);
    expect(metrics.freeSavedHours).toBe(90);
    expect(metrics.freeSavedDisplay).toBe("~90 h-h");

    // Pro hours = 224, so Pro additional saved = 255 - 224 = 31
    expect(metrics.proHours).toBe(224);
    expect(metrics.proAdditionalSavedHours).toBe(31);
    expect(metrics.proAdditionalSavedDisplay).toBe("~31 h-h");

    // Total Pro saved vs Traditional = 345 - 224 = 121
    expect(metrics.proTotalSavedHours).toBe(121);
    expect(metrics.proTotalSavedDisplay).toBe("~121 h-h");

    // ACP hours = 184, so ACP saved = 345 - 184 = 161
    expect(metrics.acpAgenticHours).toBe(184);
    expect(metrics.acpSavedHours).toBe(161);
    expect(metrics.acpSavedDisplay).toBe("~161 h-h");

    // Free breakdown items sum strictly to freeSavedHours (90)
    const freeSum = metrics.freeDeliverablesBreakdown.reduce((sum, item) => sum + item.hours, 0);
    expect(freeSum).toBe(90);

    // Pro breakdown items sum strictly to proAdditionalSavedHours (31)
    const proSum = metrics.proDeliverablesBreakdown.reduce((sum, item) => sum + item.hours, 0);
    expect(proSum).toBe(31);
  });
});
