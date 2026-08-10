import type {
  BlueprintArtifact,
  EstimationConstructionScenario,
  EstimationReportArtifact,
} from "@/features/sessions/session-contracts";
import type { CommercialTier, SessionCommercialAccess } from "@/features/sessions/types";

export type BlueprintResultAccessState = "free_view_only" | "professional_unlocked" | "acp_unlocked";
export type BlueprintDiagramPreviewState = "sample" | "unlocked" | "locked_blueprint" | "locked_acp";

export type BlueprintDiagramPreview = {
  category: string;
  description: string;
  diagramKey: string;
  product: "blueprint" | "acp" | "shared";
  requiredTier: CommercialTier;
  sampleEnabled: boolean;
  title: string;
  valueStory: string;
};

export type BlueprintArtifactHighlight = {
  detail: string;
  key: string;
  status: "ready" | "partial" | "pending";
  title: string;
};

export type BlueprintProfessionalDownloadState = {
  allowed: boolean;
  detail: string;
  label: string;
  reason: "ready" | "requires_purchase" | "requires_workspace_permission";
};

export type BlueprintComparisonSummary = {
  blueprintAssisted: EstimationConstructionScenario;
  costSavingsPercent: number;
  effortReductionPercent: number;
  traditional: EstimationConstructionScenario;
};

const TIER_RANK: Record<CommercialTier, number> = {
  blueprint: 1,
  blueprint_pro: 2,
  acp: 3,
};

export const BLUEPRINT_RESULT_DIAGRAMS: readonly BlueprintDiagramPreview[] = [
  {
    category: "Arquitectura",
    description: "Capas, limites, responsabilidades y capacidades principales del agente.",
    diagramKey: "architecture_overview",
    product: "blueprint",
    requiredTier: "blueprint",
    sampleEnabled: true,
    title: "Arquitectura propuesta",
    valueStory: "La muestra ejecutiva que evidencia que ya existe un diseno integral.",
  },
  {
    category: "Orquestacion",
    description: "Agentes, subagentes, handoffs, rutas de decision y patrones de coordinacion.",
    diagramKey: "agent_orchestration",
    product: "shared",
    requiredTier: "blueprint_pro",
    sampleEnabled: false,
    title: "Orquestacion agentica",
    valueStory: "Explica como colaboran las piezas del agente y cuando interviene el usuario.",
  },
  {
    category: "Herramientas",
    description: "Herramientas minimas, contratos, side effects y alternativas descartadas.",
    diagramKey: "tool_capability_map",
    product: "shared",
    requiredTier: "blueprint_pro",
    sampleEnabled: false,
    title: "Mapa de herramientas",
    valueStory: "Muestra por que el agente no queda sobreaprovisionado.",
  },
  {
    category: "Memoria",
    description: "Memoria corta, memoria larga, RAG, recuperacion y budgets de contexto.",
    diagramKey: "memory_rag_architecture",
    product: "shared",
    requiredTier: "blueprint_pro",
    sampleEnabled: false,
    title: "Memoria y RAG",
    valueStory: "Resume como el agente recuerda sin saturar la ventana de contexto.",
  },
  {
    category: "Flujo",
    description: "Workflow runtime portable del agente objetivo.",
    diagramKey: "runtime_workflow",
    product: "shared",
    requiredTier: "blueprint_pro",
    sampleEnabled: false,
    title: "Flujo runtime",
    valueStory: "Diferencia el comportamiento del agente del proceso interno de Lean.",
  },
  {
    category: "Conocimiento",
    description: "Fuentes, linaje, evidencia aprobada y grafo de conocimiento.",
    diagramKey: "knowledge_graph",
    product: "shared",
    requiredTier: "blueprint_pro",
    sampleEnabled: false,
    title: "Grafo de conocimiento",
    valueStory: "Conecta decisiones del diseno con evidencia y fuentes.",
  },
  {
    category: "Seguridad",
    description: "Guardrails, approvals, boundaries y politicas de control.",
    diagramKey: "security_guardrails",
    product: "shared",
    requiredTier: "blueprint_pro",
    sampleEnabled: false,
    title: "Seguridad y guardrails",
    valueStory: "Hace visible como se reduce el riesgo operativo.",
  },
  {
    category: "Evaluacion",
    description: "Test suite, escenarios, quality gates y regresiones de implementacion.",
    diagramKey: "evaluation_test_suite",
    product: "acp",
    requiredTier: "acp",
    sampleEnabled: false,
    title: "Test Suite ACP",
    valueStory: "Convierte el diseno en pruebas concretas para construir con confianza.",
  },
];

export function resolveBlueprintResultAccess(access?: SessionCommercialAccess | null): BlueprintResultAccessState {
  if (access?.tier === "acp" || access?.can_build_acp || access?.can_download_acp) {
    return "acp_unlocked";
  }

  if (access?.can_download_blueprint || access?.can_export_blueprint_core || access?.tier === "blueprint_pro") {
    return "professional_unlocked";
  }

  return "free_view_only";
}

export function canDownloadBlueprintProfessional(access?: SessionCommercialAccess | null): boolean {
  return Boolean(
    access?.can_download_blueprint ||
      access?.can_export_blueprint_core ||
      access?.can_export_blueprint_document ||
      access?.can_export_json ||
      access?.can_export_markdown,
  );
}

export function resolveBlueprintProfessionalDownloadState(
  access?: SessionCommercialAccess | null,
): BlueprintProfessionalDownloadState {
  if (canDownloadBlueprintProfessional(access)) {
    return {
      allowed: true,
      detail:
        "El workspace ya tiene entitlement y rol con permisos para descargar el contrato blueprint-core.v1.",
      label: "Descarga habilitada",
      reason: "ready",
    };
  }

  if (access?.tier === "blueprint_pro" || access?.tier === "acp") {
    return {
      allowed: false,
      detail:
        "El producto esta activo, pero este usuario no tiene permiso de descarga/exportacion en el workspace.",
      label: "Permiso requerido",
      reason: "requires_workspace_permission",
    };
  }

  return {
    allowed: false,
    detail:
      "El Blueprint gratuito solo permite visualizacion en plataforma. La descarga se desbloquea con Blueprint Profesional.",
    label: "Requiere Blueprint Pro",
    reason: "requires_purchase",
  };
}

export function resolveBlueprintDiagramPreviewState(
  diagram: BlueprintDiagramPreview,
  access?: SessionCommercialAccess | null,
): BlueprintDiagramPreviewState {
  const tier = access?.tier ?? "blueprint";

  if (diagram.sampleEnabled && tier === "blueprint") {
    return "sample";
  }

  if (TIER_RANK[tier] >= TIER_RANK[diagram.requiredTier]) {
    return "unlocked";
  }

  return diagram.requiredTier === "acp" ? "locked_acp" : "locked_blueprint";
}

export function buildBlueprintArtifactHighlights(blueprint?: BlueprintArtifact | null): BlueprintArtifactHighlight[] {
  return [
    {
      detail: blueprint?.architecture || "Arquitectura pendiente de consolidar.",
      key: "architecture",
      status: blueprint?.architecture ? "ready" : "pending",
      title: "Arquitectura",
    },
    {
      detail: blueprint?.reasoning_pattern || "Patron de razonamiento pendiente.",
      key: "reasoning",
      status: blueprint?.reasoning_pattern ? "ready" : "pending",
      title: "Patron de razonamiento",
    },
    {
      detail: `${blueprint?.tools.length ?? 0} herramienta(s) definidas con proposito y riesgo.`,
      key: "tools",
      status: blueprint?.tools.length ? "ready" : "pending",
      title: "Herramientas",
    },
    {
      detail: blueprint?.memory_strategy || "Estrategia de memoria pendiente.",
      key: "memory",
      status: blueprint?.memory_strategy ? "ready" : "pending",
      title: "Memoria",
    },
    {
      detail: `${blueprint?.knowledge_profile?.sources.length ?? 0} fuente(s) de conocimiento declaradas.`,
      key: "knowledge",
      status: blueprint?.knowledge_profile?.mode === "rag" ? "ready" : blueprint?.knowledge_profile ? "partial" : "pending",
      title: "Conocimiento",
    },
    {
      detail: `${blueprint?.delivery_package.deliverables.length ?? 0} entregable(s) narrativos preparados.`,
      key: "documentation",
      status: blueprint?.delivery_package.deliverables.length ? "ready" : "partial",
      title: "Documentacion",
    },
  ];
}

export function buildBlueprintComparisonSummary(
  report?: EstimationReportArtifact | null,
): BlueprintComparisonSummary | null {
  if (!report) {
    return null;
  }

  const fallbackTraditional: EstimationConstructionScenario = {
    automation_leverage_percent: 0,
    cost_savings_vs_traditional: 0,
    description: "Equipo humano construye usando el Blueprint como referencia funcional y tecnica.",
    effort_reduction_vs_traditional_percent: 0,
    estimated_cost: report.traditional.estimated_cost,
    estimated_duration_weeks: report.traditional.estimated_duration_weeks,
    estimated_hours_total: report.traditional.estimated_hours_total,
    human_intervention_percent: 100,
    label: "Desarrollo tradicional",
    notes: ["Baseline manual."],
    scenario_key: "traditional_blueprint",
  };
  const traditional =
    report.construction_scenarios?.find((item) => item.scenario_key === "traditional_blueprint") ?? fallbackTraditional;

  const fallbackReduction = Math.max(18, Math.min(55, Math.round(report.agentic.blueprint_design_coverage_percent * 0.42)));
  const hourlyRate = report.traditional.estimated_cost / Math.max(report.traditional.estimated_hours_total, 1);
  const fallbackHours = report.traditional.estimated_hours_total * (1 - fallbackReduction / 100);
  const fallbackBlueprintAssisted: EstimationConstructionScenario = {
    automation_leverage_percent: Math.round(report.agentic.blueprint_design_coverage_percent * 0.62),
    cost_savings_vs_traditional: Math.max(0, report.traditional.estimated_cost - fallbackHours * hourlyRate),
    description: "Equipo implementa asistido por herramientas agenticas usando el Blueprint como diseno de referencia.",
    effort_reduction_vs_traditional_percent: fallbackReduction,
    estimated_cost: fallbackHours * hourlyRate,
    estimated_duration_weeks: report.traditional.estimated_duration_weeks * (fallbackHours / report.traditional.estimated_hours_total),
    estimated_hours_total: fallbackHours,
    human_intervention_percent: 65,
    label: "Desarrollo asistido con Blueprint",
    notes: ["Reduce discovery tecnico y retrabajo de arquitectura."],
    scenario_key: "agentic_blueprint",
  };
  const blueprintAssisted =
    report.construction_scenarios?.find((item) => item.scenario_key === "agentic_blueprint") ?? fallbackBlueprintAssisted;

  const costSavingsPercent =
    traditional.estimated_cost > 0
      ? Math.max(0, Math.round((blueprintAssisted.cost_savings_vs_traditional / traditional.estimated_cost) * 100))
      : 0;

  return {
    blueprintAssisted,
    costSavingsPercent,
    effortReductionPercent: Math.max(0, Math.round(blueprintAssisted.effort_reduction_vs_traditional_percent)),
    traditional,
  };
}
