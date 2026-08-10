import type {
  AutonomyLevel,
  DiscoveryArtifact,
  DiscoveryInput,
} from "@/features/sessions/session-contracts";

export type DiscoveryFormValues = {
  automationOpportunities: string;
  autonomyLevel: number;
  constraints: string;
  currentCost: string;
  currentProcess: string;
  currentTimeSpent: string;
  currentUser: string;
  desiredOutcome: string;
  frequentErrors: string;
  nonDelegableDecisions: string;
  northStarMetric: string;
  outOfScope: string;
  problemStatement: string;
  v1Scope: string;
};

export type DiscoveryFormErrors = Partial<Record<keyof DiscoveryFormValues, string>>;

type DiscoveryChecklistItem = {
  label: string;
  state: "done" | "pending";
};

const REQUIRED_TEXT_FIELDS = [
  "problem_statement",
  "current_user",
  "current_process",
  "desired_outcome",
  "autonomy_level",
  "operational_baseline.current_time_spent",
  "operational_baseline.current_cost",
  "mvp_definition.north_star_metric",
] as const;

const REQUIRED_LIST_FIELDS = [
  "operational_baseline.frequent_errors",
  "operational_baseline.automation_opportunities",
  "mvp_definition.v1_scope",
  "mvp_definition.out_of_scope",
  "mvp_definition.non_delegable_decisions",
] as const;

const MISSING_FIELD_LABELS: Record<string, string> = {
  "current_process": "Tarea o proceso actual",
  "current_user": "Quien ejecuta hoy",
  "desired_outcome": "Resultado deseado",
  "mvp_definition.non_delegable_decisions": "Decisiones no delegables",
  "mvp_definition.north_star_metric": "Metrica norte",
  "mvp_definition.out_of_scope": "Fuera de alcance",
  "mvp_definition.v1_scope": "Alcance MVP",
  "operational_baseline.automation_opportunities": "Oportunidades de automatizacion",
  "operational_baseline.current_cost": "Costo o impacto actual",
  "operational_baseline.current_time_spent": "Tiempo actual invertido",
  "operational_baseline.frequent_errors": "Errores frecuentes",
  "problem_statement": "Descripcion del problema",
};

export const DISCOVERY_TIME_SPENT_OPTIONS = [
  { label: "Seleccionar...", value: "" },
  { label: "Menos de 2 horas por semana", value: "Menos de 2 horas por semana" },
  { label: "Entre 2 y 8 horas por semana", value: "Entre 2 y 8 horas por semana" },
  { label: "Entre 1 y 2 dias por semana", value: "Entre 1 y 2 dias por semana" },
  { label: "Mas de 2 dias por semana", value: "Mas de 2 dias por semana" },
] as const;

export const DISCOVERY_COST_OPTIONS = [
  { label: "Seleccionar...", value: "" },
  { label: "Impacto bajo o retrabajo menor", value: "Impacto bajo o retrabajo menor" },
  { label: "Impacto moderado en tiempo y calidad", value: "Impacto moderado en tiempo y calidad" },
  { label: "Impacto alto en costos o experiencia", value: "Impacto alto en costos o experiencia" },
  { label: "Impacto critico para el negocio", value: "Impacto critico para el negocio" },
] as const;

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function parseTextList(value: string) {
  return value
    .split(/\r?\n|,|;/)
    .map((item) => normalizeText(item))
    .filter(Boolean);
}

function toTextAreaValue(items: string[] | undefined) {
  return (items ?? []).join("\n");
}

function readNestedValue(payload: Record<string, unknown>, path: string) {
  let current: unknown = payload;

  for (const part of path.split(".")) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return null;
    }

    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

export function mapAutonomySliderToLevel(value: number): AutonomyLevel {
  if (value < 0.34) {
    return "low";
  }

  if (value < 0.67) {
    return "medium";
  }

  return "high";
}

export function mapAutonomyLevelToSlider(value: string | undefined | null) {
  if (value === "low") {
    return 0.18;
  }

  if (value === "high") {
    return 0.84;
  }

  return 0.5;
}

export function createEmptyDiscoveryFormValues(): DiscoveryFormValues {
  return {
    automationOpportunities: "",
    autonomyLevel: 0.5,
    constraints: "",
    currentCost: "",
    currentProcess: "",
    currentTimeSpent: "",
    currentUser: "",
    desiredOutcome: "",
    frequentErrors: "",
    nonDelegableDecisions: "",
    northStarMetric: "",
    outOfScope: "",
    problemStatement: "",
    v1Scope: "",
  };
}

export function createDiscoveryFormValues(discovery?: DiscoveryArtifact | null): DiscoveryFormValues {
  if (!discovery) {
    return createEmptyDiscoveryFormValues();
  }

  return {
    automationOpportunities: toTextAreaValue(discovery.operational_baseline.automation_opportunities),
    autonomyLevel: mapAutonomyLevelToSlider(discovery.autonomy_level),
    constraints: toTextAreaValue(discovery.constraints),
    currentCost: discovery.operational_baseline.current_cost,
    currentProcess: discovery.current_process,
    currentTimeSpent: discovery.operational_baseline.current_time_spent,
    currentUser: discovery.current_user,
    desiredOutcome: discovery.desired_outcome,
    frequentErrors: toTextAreaValue(discovery.operational_baseline.frequent_errors),
    nonDelegableDecisions: toTextAreaValue(discovery.mvp_definition.non_delegable_decisions),
    northStarMetric: discovery.mvp_definition.north_star_metric,
    outOfScope: toTextAreaValue(discovery.mvp_definition.out_of_scope),
    problemStatement: discovery.problem_statement,
    v1Scope: toTextAreaValue(discovery.mvp_definition.v1_scope),
  };
}

export function buildDiscoveryInput(values: DiscoveryFormValues): DiscoveryInput {
  return {
    autonomy_level: mapAutonomySliderToLevel(values.autonomyLevel),
    constraints: parseTextList(values.constraints),
    current_process: normalizeText(values.currentProcess),
    current_user: normalizeText(values.currentUser),
    desired_outcome: normalizeText(values.desiredOutcome),
    mvp_definition: {
      non_delegable_decisions: parseTextList(values.nonDelegableDecisions),
      north_star_metric: normalizeText(values.northStarMetric),
      out_of_scope: parseTextList(values.outOfScope),
      v1_scope: parseTextList(values.v1Scope),
    },
    operational_baseline: {
      automation_opportunities: parseTextList(values.automationOpportunities),
      current_cost: normalizeText(values.currentCost),
      current_time_spent: normalizeText(values.currentTimeSpent),
      frequent_errors: parseTextList(values.frequentErrors),
    },
    problem_statement: normalizeText(values.problemStatement),
  };
}

export function getDiscoveryInputMissingFields(input: DiscoveryInput) {
  const payload = input as unknown as Record<string, unknown>;
  const missing: string[] = [];

  for (const path of REQUIRED_TEXT_FIELDS) {
    const value = readNestedValue(payload, path);

    if (typeof value !== "string" || !normalizeText(value)) {
      missing.push(path);
    }
  }

  for (const path of REQUIRED_LIST_FIELDS) {
    const value = readNestedValue(payload, path);

    if (!Array.isArray(value) || value.every((item) => typeof item !== "string" || !normalizeText(item))) {
      missing.push(path);
    }
  }

  return missing;
}

export function getDiscoveryFieldErrors(values: DiscoveryFormValues): DiscoveryFormErrors {
  const input = buildDiscoveryInput(values);
  const missingFields = getDiscoveryInputMissingFields(input);
  const errors: DiscoveryFormErrors = {};

  if (missingFields.includes("problem_statement")) {
    errors.problemStatement = "Describe el problema con suficiente contexto.";
  }

  if (missingFields.includes("current_process")) {
    errors.currentProcess = "Define la tarea o proceso actual.";
  }

  if (missingFields.includes("current_user")) {
    errors.currentUser = "Indica quien ejecuta hoy este trabajo.";
  }

  if (missingFields.includes("desired_outcome")) {
    errors.desiredOutcome = "Aclara el resultado esperado.";
  }

  if (missingFields.includes("operational_baseline.current_time_spent")) {
    errors.currentTimeSpent = "Selecciona el tiempo invertido hoy.";
  }

  if (missingFields.includes("operational_baseline.current_cost")) {
    errors.currentCost = "Selecciona el costo o impacto actual.";
  }

  if (missingFields.includes("operational_baseline.frequent_errors")) {
    errors.frequentErrors = "Lista al menos un error frecuente.";
  }

  if (missingFields.includes("operational_baseline.automation_opportunities")) {
    errors.automationOpportunities = "Describe al menos una oportunidad de automatizacion.";
  }

  if (missingFields.includes("mvp_definition.v1_scope")) {
    errors.v1Scope = "Define que si entra en el MVP.";
  }

  if (missingFields.includes("mvp_definition.out_of_scope")) {
    errors.outOfScope = "Define que queda fuera del MVP.";
  }

  if (missingFields.includes("mvp_definition.north_star_metric")) {
    errors.northStarMetric = "Define una metrica norte.";
  }

  if (missingFields.includes("mvp_definition.non_delegable_decisions")) {
    errors.nonDelegableDecisions = "Lista las decisiones que siguen siendo humanas.";
  }

  return errors;
}

export function getDiscoveryChecklist(values: DiscoveryFormValues): DiscoveryChecklistItem[] {
  const input = buildDiscoveryInput(values);
  const missing = new Set(getDiscoveryInputMissingFields(input));

  return [
    {
      label: "Entender el problema",
      state:
        !missing.has("problem_statement") &&
        !missing.has("current_process") &&
        !missing.has("current_user") &&
        !missing.has("desired_outcome")
          ? "done"
          : "pending",
    },
    {
      label: "Alcance e impacto actual",
      state:
        !missing.has("operational_baseline.current_time_spent") &&
        !missing.has("operational_baseline.current_cost") &&
        !missing.has("operational_baseline.frequent_errors") &&
        !missing.has("operational_baseline.automation_opportunities")
          ? "done"
          : "pending",
    },
    {
      label: "Definir MVP y decisiones humanas",
      state:
        !missing.has("mvp_definition.v1_scope") &&
        !missing.has("mvp_definition.out_of_scope") &&
        !missing.has("mvp_definition.north_star_metric") &&
        !missing.has("mvp_definition.non_delegable_decisions")
          ? "done"
          : "pending",
    },
  ];
}

export function formatDiscoveryMissingField(path: string) {
  return MISSING_FIELD_LABELS[path] ?? path;
}
