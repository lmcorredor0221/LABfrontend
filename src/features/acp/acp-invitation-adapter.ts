import type { EstimationConstructionScenario, EstimationReportArtifact } from "@/features/sessions/session-contracts";
import type { SessionCommercialAccess } from "@/features/sessions/types";

export type AcpGateState = "unlocked" | "purchase_required" | "permission_required";

export type AcpInvitationMetrics = {
  acpAgentic: EstimationConstructionScenario;
  acpManual: EstimationConstructionScenario;
  additionalCostSavings: number;
  additionalCostSavingsPercent: number;
  additionalEffortReductionPercent: number;
  automationLiftPercent: number;
  blueprintAssisted: EstimationConstructionScenario;
  humanInterventionReductionPercent: number;
  riskReductionPercent: number;
  traditional: EstimationConstructionScenario;
};

const DEFAULT_RATE = 160000;

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(value) ? value : 0)));
}

function safePositive(value: number | null | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}

function buildScenario(
  overrides: Partial<EstimationConstructionScenario> & Pick<EstimationConstructionScenario, "label" | "scenario_key">,
): EstimationConstructionScenario {
  return {
    automation_leverage_percent: 0,
    cost_savings_vs_traditional: 0,
    description: "",
    effort_reduction_vs_traditional_percent: 0,
    estimated_cost: 0,
    estimated_duration_weeks: 0,
    estimated_hours_total: 0,
    human_intervention_percent: 100,
    notes: [],
    ...overrides,
  };
}

function findScenario(
  report: EstimationReportArtifact | null | undefined,
  scenarioKey: EstimationConstructionScenario["scenario_key"],
) {
  return report?.construction_scenarios?.find((item) => item.scenario_key === scenarioKey) ?? null;
}

export function resolveAcpGateState(access?: SessionCommercialAccess | null): AcpGateState {
  if (access?.can_build_acp || access?.can_download_acp || access?.can_export_acp_zip) {
    return "unlocked";
  }

  if (access?.tier === "acp") {
    return "permission_required";
  }

  return "purchase_required";
}

export function canOpenAcpPremium(access?: SessionCommercialAccess | null): boolean {
  return resolveAcpGateState(access) === "unlocked";
}

export function buildAcpInvitationMetrics(report?: EstimationReportArtifact | null): AcpInvitationMetrics {
  const traditionalHours = safePositive(report?.traditional.estimated_hours_total, 200);
  const traditionalCost = safePositive(report?.traditional.estimated_cost, traditionalHours * DEFAULT_RATE);
  const blendedRate = traditionalCost / traditionalHours;
  const blueprintCoverage = report?.agentic.blueprint_design_coverage_percent ?? 85;
  const acpReadiness = report?.agentic.acp_package_readiness_percent ?? 90;
  const agenticHours = safePositive(report?.agentic.estimated_hours_total, traditionalHours * 0.42);
  const agenticCost = safePositive(report?.agentic.estimated_cost, agenticHours * blendedRate);

  const traditional =
    findScenario(report, "traditional_blueprint") ??
    buildScenario({
      cost_savings_vs_traditional: 0,
      description: "Equipo humano implementa con el Blueprint como guia de diseno.",
      estimated_cost: traditionalCost,
      estimated_duration_weeks: report?.traditional.estimated_duration_weeks ?? 8,
      estimated_hours_total: traditionalHours,
      human_intervention_percent: 100,
      label: "Tradicional + Blueprint",
      scenario_key: "traditional_blueprint",
    });

  const blueprintHours = Math.max(agenticHours * 1.22, traditionalHours * 0.58);
  const blueprintAssisted =
    findScenario(report, "agentic_blueprint") ??
    buildScenario({
      automation_leverage_percent: clampPercent(blueprintCoverage * 0.62),
      cost_savings_vs_traditional: Math.max(0, traditionalCost - blueprintHours * blendedRate),
      description: "Construccion asistida por herramientas agenticas partiendo del Blueprint.",
      effort_reduction_vs_traditional_percent: clampPercent((1 - blueprintHours / traditionalHours) * 100),
      estimated_cost: blueprintHours * blendedRate,
      estimated_duration_weeks: traditional.estimated_duration_weeks * (blueprintHours / traditionalHours),
      estimated_hours_total: blueprintHours,
      human_intervention_percent: 62,
      label: "Agentic + Blueprint",
      scenario_key: "agentic_blueprint",
    });

  const acpManualHours = Math.max(agenticHours * 1.12, traditionalHours * 0.54);
  const acpManual =
    findScenario(report, "acp_manual") ??
    buildScenario({
      automation_leverage_percent: clampPercent(acpReadiness * 0.52),
      cost_savings_vs_traditional: Math.max(0, traditionalCost - acpManualHours * blendedRate),
      description: "Equipo humano implementa con ACP sin redescubrir ni redisenar.",
      effort_reduction_vs_traditional_percent: clampPercent((1 - acpManualHours / traditionalHours) * 100),
      estimated_cost: acpManualHours * blendedRate,
      estimated_duration_weeks: traditional.estimated_duration_weeks * (acpManualHours / traditionalHours),
      estimated_hours_total: acpManualHours,
      human_intervention_percent: 70,
      label: "ACP + equipo humano",
      scenario_key: "acp_manual",
    });

  const acpAgentic =
    findScenario(report, "acp_agentic") ??
    buildScenario({
      automation_leverage_percent: report?.agentic.automation_coverage_percent ?? clampPercent(acpReadiness * 0.78),
      cost_savings_vs_traditional: Math.max(0, traditionalCost - agenticCost),
      description: "ACP ejecutado con herramientas agenticas como Codex, Cursor, Claude Code o Copilot.",
      effort_reduction_vs_traditional_percent: clampPercent((1 - agenticHours / traditionalHours) * 100),
      estimated_cost: agenticCost,
      estimated_duration_weeks: report?.agentic.estimated_duration_weeks ?? traditional.estimated_duration_weeks * 0.38,
      estimated_hours_total: agenticHours,
      human_intervention_percent: Math.max(20, Math.min(70, 100 - (report?.agentic.automation_coverage_percent ?? 62))),
      label: "ACP + herramientas agenticas",
      scenario_key: "acp_agentic",
    });

  const additionalCostSavings = Math.max(0, blueprintAssisted.estimated_cost - acpAgentic.estimated_cost);
  const additionalCostSavingsPercent =
    blueprintAssisted.estimated_cost > 0 ? (additionalCostSavings / blueprintAssisted.estimated_cost) * 100 : 0;
  const additionalEffortReductionPercent =
    blueprintAssisted.estimated_hours_total > 0
      ? (1 - acpAgentic.estimated_hours_total / blueprintAssisted.estimated_hours_total) * 100
      : 0;
  const automationLiftPercent = acpAgentic.automation_leverage_percent - blueprintAssisted.automation_leverage_percent;
  const humanInterventionReductionPercent =
    blueprintAssisted.human_intervention_percent > 0
      ? (1 - acpAgentic.human_intervention_percent / blueprintAssisted.human_intervention_percent) * 100
      : 0;
  const riskReductionPercent = (acpReadiness * 0.45) + (Math.max(0, automationLiftPercent) * 0.35) + 12;

  return {
    acpAgentic,
    acpManual,
    additionalCostSavings,
    additionalCostSavingsPercent: clampPercent(additionalCostSavingsPercent),
    additionalEffortReductionPercent: clampPercent(additionalEffortReductionPercent),
    automationLiftPercent: clampPercent(automationLiftPercent),
    blueprintAssisted,
    humanInterventionReductionPercent: clampPercent(humanInterventionReductionPercent),
    riskReductionPercent: clampPercent(riskReductionPercent),
    traditional,
  };
}
