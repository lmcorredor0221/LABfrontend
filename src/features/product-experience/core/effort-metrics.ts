import type {
  EstimationConstructionScenario,
  EstimationReportArtifact,
} from "@/features/sessions/session-contracts";

export interface ProjectEffortBreakdownItem {
  title: { en: string; es: string; pt: string };
  hours: number;
  display: string;
}

export interface ProjectEffortMetrics {
  traditionalHours: number;
  traditionalHoursDisplay: string;
  traditionalDurationWeeks: number;
  freeHours: number;
  freeHoursDisplay: string;
  freeSavedHours: number;
  freeSavedDisplay: string;
  proHours: number;
  proHoursDisplay: string;
  proAdditionalSavedHours: number;
  proAdditionalSavedDisplay: string;
  proTotalSavedHours: number;
  proTotalSavedDisplay: string;
  developmentTraditionalHours: number;
  developmentTraditionalHoursDisplay: string;
  acpAgenticHours: number;
  acpAgenticHoursDisplay: string;
  acpSavedHours: number;
  acpSavedDisplay: string;
  freeDeliverablesBreakdown: ProjectEffortBreakdownItem[];
  proDeliverablesBreakdown: ProjectEffortBreakdownItem[];
  hasReport: boolean;
}

const FALLBACK_TRADITIONAL_HOURS = 350;
const FALLBACK_FREE_SAVED_HOURS = 18;
const FALLBACK_PRO_ADDITIONAL_SAVED_HOURS = 45;
const FALLBACK_ACP_SAVED_HOURS = 350;

function findScenario(
  report: EstimationReportArtifact | null | undefined,
  scenarioKey: EstimationConstructionScenario["scenario_key"],
): EstimationConstructionScenario | null {
  return report?.construction_scenarios?.find((item) => item.scenario_key === scenarioKey) ?? null;
}

export function getProjectEffortMetrics(
  report?: EstimationReportArtifact | null,
): ProjectEffortMetrics {
  const hasReport = Boolean(report && (report.traditional.estimated_hours_total > 0 || (report.construction_scenarios?.length ?? 0) > 0));

  if (!hasReport || !report) {
    const freeItem1 = 8;
    const freeItem2 = 6;
    const freeItem3 = 4;
    const proItem1 = 16;
    const proItem2 = 24;
    const proItem3 = 5;

    return {
      traditionalHours: FALLBACK_TRADITIONAL_HOURS,
      traditionalHoursDisplay: `~${FALLBACK_TRADITIONAL_HOURS} h-h`,
      traditionalDurationWeeks: 8,
      freeHours: FALLBACK_TRADITIONAL_HOURS - FALLBACK_FREE_SAVED_HOURS,
      freeHoursDisplay: `~${FALLBACK_TRADITIONAL_HOURS - FALLBACK_FREE_SAVED_HOURS} h-h`,
      freeSavedHours: FALLBACK_FREE_SAVED_HOURS,
      freeSavedDisplay: `~${FALLBACK_FREE_SAVED_HOURS} h-h`,
      proHours: FALLBACK_TRADITIONAL_HOURS - FALLBACK_FREE_SAVED_HOURS - FALLBACK_PRO_ADDITIONAL_SAVED_HOURS,
      proHoursDisplay: `~${FALLBACK_TRADITIONAL_HOURS - FALLBACK_FREE_SAVED_HOURS - FALLBACK_PRO_ADDITIONAL_SAVED_HOURS} h-h`,
      proAdditionalSavedHours: FALLBACK_PRO_ADDITIONAL_SAVED_HOURS,
      proAdditionalSavedDisplay: `~${FALLBACK_PRO_ADDITIONAL_SAVED_HOURS} h-h`,
      proTotalSavedHours: FALLBACK_FREE_SAVED_HOURS + FALLBACK_PRO_ADDITIONAL_SAVED_HOURS,
      proTotalSavedDisplay: `~${FALLBACK_FREE_SAVED_HOURS + FALLBACK_PRO_ADDITIONAL_SAVED_HOURS} h-h`,
      developmentTraditionalHours: FALLBACK_TRADITIONAL_HOURS - (FALLBACK_FREE_SAVED_HOURS + FALLBACK_PRO_ADDITIONAL_SAVED_HOURS),
      developmentTraditionalHoursDisplay: `~${FALLBACK_TRADITIONAL_HOURS - (FALLBACK_FREE_SAVED_HOURS + FALLBACK_PRO_ADDITIONAL_SAVED_HOURS)} h-h`,
      acpAgenticHours: 184,
      acpAgenticHoursDisplay: "~184 h-h",
      acpSavedHours: FALLBACK_ACP_SAVED_HOURS,
      acpSavedDisplay: `~${FALLBACK_ACP_SAVED_HOURS} h-h`,
      freeDeliverablesBreakdown: [
        {
          title: {
            en: "Clear problem and opportunity",
            es: "Problema y oportunidad claros",
            pt: "Problema e oportunidade claros",
          },
          hours: freeItem1,
          display: `~${freeItem1} h-h`,
        },
        {
          title: {
            en: "MVP scope and success criteria",
            es: "Alcance MVP y criterios de exito",
            pt: "Escopo MVP e criterios de sucesso",
          },
          hours: freeItem2,
          display: `~${freeItem2} h-h`,
        },
        {
          title: {
            en: "Conceptual diagrams and economic hook",
            es: "Diagramas conceptuales y gancho economico",
            pt: "Diagramas conceituais e gancho economico",
          },
          hours: freeItem3,
          display: `~${freeItem3} h-h`,
        },
      ],
      proDeliverablesBreakdown: [
        {
          title: {
            en: "4 Production diagrams (C4, Sequence, Runtime)",
            es: "4 Diagramas tecnicos (C4, Secuencia, Runtime)",
            pt: "4 Diagramas tecnicos (C4, Sequencia, Runtime)",
          },
          hours: proItem1,
          display: `~${proItem1} h-h`,
        },
        {
          title: {
            en: "11 Engineering artifacts, RAG memory & tools",
            es: "11 Artefactos de arquitectura, memoria RAG y herramientas",
            pt: "11 Artefatos de arquitetura, memoria RAG e ferramentas",
          },
          hours: proItem2,
          display: `~${proItem2} h-h`,
        },
        {
          title: {
            en: "Downloadable professional ZIP & Markdown package",
            es: "Paquete descargable en ZIP y Markdown para ingenieros",
            pt: "Pacote para download em ZIP e Markdown para engenheiros",
          },
          hours: proItem3,
          display: `~${proItem3} h-h`,
        },
      ],
      hasReport: false,
    };
  }

  const traditionalScenario = findScenario(report, "traditional_blueprint");
  const basicScenario = findScenario(report, "blueprint_basic");
  const premiumScenario = findScenario(report, "blueprint_premium");
  const acpAgenticScenario = findScenario(report, "acp_agentic");

  const traditionalHours = Math.round(
    report.traditional?.estimated_hours_total ||
      traditionalScenario?.estimated_hours_total ||
      FALLBACK_TRADITIONAL_HOURS,
  );
  const traditionalDurationWeeks = Math.round(
    report.traditional?.estimated_duration_weeks ||
      traditionalScenario?.estimated_duration_weeks ||
      8,
  );

  const freeHours = Math.round(
    basicScenario?.estimated_hours_total ??
      traditionalHours * 0.74,
  );
  const freeSavedHours = Math.max(1, Math.round(traditionalHours - freeHours));

  const proHours = Math.round(
    premiumScenario?.estimated_hours_total ??
      traditionalHours * 0.65,
  );
  const proAdditionalSavedHours = Math.max(1, Math.round(freeHours - proHours));
  const proTotalSavedHours = freeSavedHours + proAdditionalSavedHours;

  const acpAgenticHours = Math.round(
    report.agentic?.estimated_hours_total ||
      acpAgenticScenario?.estimated_hours_total ||
      traditionalHours * 0.53,
  );
  const acpSavedHours = Math.max(1, Math.round(traditionalHours - acpAgenticHours));
  const developmentTraditionalHours = Math.max(1, traditionalHours - proTotalSavedHours);

  // Proportional breakdown for Free items that strictly sum to freeSavedHours
  const freeItem1 = Math.max(1, Math.round(freeSavedHours * (8 / 18)));
  const freeItem2 = Math.max(1, Math.round(freeSavedHours * (6 / 18)));
  const freeItem3 = Math.max(1, freeSavedHours - freeItem1 - freeItem2);

  // Proportional breakdown for Pro items that strictly sum to proAdditionalSavedHours
  const proItem1 = Math.max(1, Math.round(proAdditionalSavedHours * (16 / 45)));
  const proItem2 = Math.max(1, Math.round(proAdditionalSavedHours * (24 / 45)));
  const proItem3 = Math.max(1, proAdditionalSavedHours - proItem1 - proItem2);

  return {
    traditionalHours,
    traditionalHoursDisplay: `~${traditionalHours} h-h`,
    traditionalDurationWeeks,
    freeHours,
    freeHoursDisplay: `~${freeHours} h-h`,
    freeSavedHours,
    freeSavedDisplay: `~${freeSavedHours} h-h`,
    proHours,
    proHoursDisplay: `~${proHours} h-h`,
    proAdditionalSavedHours,
    proAdditionalSavedDisplay: `~${proAdditionalSavedHours} h-h`,
    proTotalSavedHours,
    proTotalSavedDisplay: `~${proTotalSavedHours} h-h`,
    developmentTraditionalHours,
    developmentTraditionalHoursDisplay: `~${developmentTraditionalHours} h-h`,
    acpAgenticHours,
    acpAgenticHoursDisplay: `~${acpAgenticHours} h-h`,
    acpSavedHours,
    acpSavedDisplay: `~${acpSavedHours} h-h`,
    freeDeliverablesBreakdown: [
      {
        title: {
          en: "Clear problem and opportunity",
          es: "Problema y oportunidad claros",
          pt: "Problema e oportunidade claros",
        },
        hours: freeItem1,
        display: `~${freeItem1} h-h`,
      },
      {
        title: {
          en: "MVP scope and success criteria",
          es: "Alcance MVP y criterios de exito",
          pt: "Escopo MVP e criterios de sucesso",
        },
        hours: freeItem2,
        display: `~${freeItem2} h-h`,
      },
      {
        title: {
          en: "Conceptual diagrams and economic hook",
          es: "Diagramas conceptuales y gancho economico",
          pt: "Diagramas conceituais e gancho economico",
        },
        hours: freeItem3,
        display: `~${freeItem3} h-h`,
      },
    ],
    proDeliverablesBreakdown: [
      {
        title: {
          en: "4 Production diagrams (C4, Sequence, Runtime)",
          es: "4 Diagramas tecnicos (C4, Secuencia, Runtime)",
          pt: "4 Diagramas tecnicos (C4, Sequencia, Runtime)",
        },
        hours: proItem1,
        display: `~${proItem1} h-h`,
      },
      {
        title: {
          en: "11 Engineering artifacts, RAG memory & tools",
          es: "11 Artefactos de arquitectura, memoria RAG y herramientas",
          pt: "11 Artefatos de arquitetura, memoria RAG e ferramentas",
        },
        hours: proItem2,
        display: `~${proItem2} h-h`,
      },
      {
        title: {
          en: "Downloadable professional ZIP & Markdown package",
          es: "Paquete descargable en ZIP y Markdown para ingenieros",
          pt: "Pacote para download em ZIP e Markdown para engenheiros",
        },
        hours: proItem3,
        display: `~${proItem3} h-h`,
      },
    ],
    hasReport: true,
  };
}
