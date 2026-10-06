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
type DiscoveryTextFormKey = Exclude<keyof DiscoveryFormValues, "autonomyLevel">;

type DiscoveryChecklistItem = {
  label: string;
  state: "done" | "pending";
};

export type DiscoveryCaptureMode = "guided" | "advanced";

export type DiscoveryGuidedQuestion = {
  fieldPath: string;
  formKey: keyof DiscoveryFormValues;
  inputKind: "text" | "textarea" | "select" | "list";
  label: string;
  prompt: string;
  requiredForAnalysis: boolean;
};

export type DiscoveryContractCardModel = {
  fieldPaths: string[];
  key: string;
  status: "complete" | "partial" | "missing";
  summary: string;
  title: string;
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

const GUIDED_FIELD_QUESTIONS: DiscoveryGuidedQuestion[] = [
  {
    fieldPath: "problem_statement",
    formKey: "problemStatement",
    inputKind: "textarea",
    label: MISSING_FIELD_LABELS.problem_statement,
    prompt: "Que problema quieres resolver o automatizar?",
    requiredForAnalysis: true,
  },
  {
    fieldPath: "current_user",
    formKey: "currentUser",
    inputKind: "text",
    label: MISSING_FIELD_LABELS.current_user,
    prompt: "Quien ejecuta hoy este trabajo?",
    requiredForAnalysis: true,
  },
  {
    fieldPath: "current_process",
    formKey: "currentProcess",
    inputKind: "textarea",
    label: MISSING_FIELD_LABELS.current_process,
    prompt: "Como se hace hoy el proceso, paso a paso o en una frase?",
    requiredForAnalysis: true,
  },
  {
    fieldPath: "desired_outcome",
    formKey: "desiredOutcome",
    inputKind: "textarea",
    label: MISSING_FIELD_LABELS.desired_outcome,
    prompt: "Que resultado esperas lograr con el agente?",
    requiredForAnalysis: true,
  },
  {
    fieldPath: "operational_baseline.current_time_spent",
    formKey: "currentTimeSpent",
    inputKind: "select",
    label: MISSING_FIELD_LABELS["operational_baseline.current_time_spent"],
    prompt: "Cuanto tiempo consume hoy este trabajo?",
    requiredForAnalysis: true,
  },
  {
    fieldPath: "operational_baseline.current_cost",
    formKey: "currentCost",
    inputKind: "select",
    label: MISSING_FIELD_LABELS["operational_baseline.current_cost"],
    prompt: "Que impacto tiene hoy en costo, calidad o experiencia?",
    requiredForAnalysis: true,
  },
  {
    fieldPath: "operational_baseline.frequent_errors",
    formKey: "frequentErrors",
    inputKind: "list",
    label: MISSING_FIELD_LABELS["operational_baseline.frequent_errors"],
    prompt: "Que errores o reprocesos aparecen con frecuencia?",
    requiredForAnalysis: true,
  },
  {
    fieldPath: "operational_baseline.automation_opportunities",
    formKey: "automationOpportunities",
    inputKind: "list",
    label: MISSING_FIELD_LABELS["operational_baseline.automation_opportunities"],
    prompt: "Que partes repetitivas conviene automatizar primero?",
    requiredForAnalysis: true,
  },
  {
    fieldPath: "mvp_definition.v1_scope",
    formKey: "v1Scope",
    inputKind: "list",
    label: MISSING_FIELD_LABELS["mvp_definition.v1_scope"],
    prompt: "Que debe entrar en la primera version del MVP?",
    requiredForAnalysis: true,
  },
  {
    fieldPath: "mvp_definition.out_of_scope",
    formKey: "outOfScope",
    inputKind: "list",
    label: MISSING_FIELD_LABELS["mvp_definition.out_of_scope"],
    prompt: "Que queda fuera de alcance por ahora?",
    requiredForAnalysis: true,
  },
  {
    fieldPath: "mvp_definition.north_star_metric",
    formKey: "northStarMetric",
    inputKind: "text",
    label: MISSING_FIELD_LABELS["mvp_definition.north_star_metric"],
    prompt: "Que metrica indicaria que el MVP funciono?",
    requiredForAnalysis: true,
  },
  {
    fieldPath: "mvp_definition.non_delegable_decisions",
    formKey: "nonDelegableDecisions",
    inputKind: "list",
    label: MISSING_FIELD_LABELS["mvp_definition.non_delegable_decisions"],
    prompt: "Que decisiones deben seguir en manos humanas?",
    requiredForAnalysis: true,
  },
];

const GUIDED_QUESTION_BY_PATH = Object.fromEntries(GUIDED_FIELD_QUESTIONS.map((item) => [item.fieldPath, item]));

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

function firstSentence(value: string) {
  const normalized = normalizeText(value);
  const [sentence] = normalized.split(/(?<=[.!?])\s+/);
  return sentence || normalized;
}

function extractSentenceWith(value: string, keywords: string[]) {
  const normalized = normalizeText(value);
  const sentences = normalized.split(/(?<=[.!?])\s+|\n+/).map((item) => normalizeText(item)).filter(Boolean);
  return sentences.find((sentence) => keywords.some((keyword) => sentence.toLowerCase().includes(keyword))) ?? "";
}

function mergeTextAreaValue(current: string, next: string) {
  const normalized = normalizeText(next);
  if (!normalized) {
    return current;
  }
  return current ? current : normalized;
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

export function getGuidedDiscoveryQuestions() {
  return [...GUIDED_FIELD_QUESTIONS];
}

export function getGuidedDiscoveryQuestion(fieldPath: string) {
  return GUIDED_QUESTION_BY_PATH[fieldPath] ?? null;
}

export function getNextDiscoveryMissingField(values: DiscoveryFormValues) {
  const missing = new Set(getDiscoveryInputMissingFields(buildDiscoveryInput(values)));
  return GUIDED_FIELD_QUESTIONS.find((item) => missing.has(item.fieldPath))?.fieldPath ?? null;
}

export function applyGuidedAnswerToDiscoveryFormValues(
  values: DiscoveryFormValues,
  fieldPath: string,
  answer: string,
): DiscoveryFormValues {
  const question = getGuidedDiscoveryQuestion(fieldPath);
  if (!question) {
    return values;
  }
  return {
    ...values,
    [question.formKey]: answer,
  };
}

export function buildDiscoveryContractCards(values: DiscoveryFormValues): DiscoveryContractCardModel[] {
  const input = buildDiscoveryInput(values);
  const missing = new Set(getDiscoveryInputMissingFields(input));
  const cards: Array<Omit<DiscoveryContractCardModel, "status">> = [
    {
      fieldPaths: ["problem_statement", "current_user", "current_process", "desired_outcome"],
      key: "context",
      summary: input.problem_statement || "Pendiente de capturar problema y contexto.",
      title: "Contexto del problema",
    },
    {
      fieldPaths: [
        "operational_baseline.current_time_spent",
        "operational_baseline.current_cost",
        "operational_baseline.frequent_errors",
        "operational_baseline.automation_opportunities",
      ],
      key: "impact",
      summary: input.operational_baseline.automation_opportunities[0] || input.operational_baseline.frequent_errors[0] || "Pendiente de cuantificar impacto.",
      title: "Impacto operativo",
    },
    {
      fieldPaths: [
        "mvp_definition.v1_scope",
        "mvp_definition.out_of_scope",
        "mvp_definition.north_star_metric",
        "mvp_definition.non_delegable_decisions",
      ],
      key: "mvp",
      summary: input.mvp_definition.v1_scope[0] || input.mvp_definition.north_star_metric || "Pendiente de delimitar MVP y control humano.",
      title: "MVP y control humano",
    },
  ];

  return cards.map((card) => {
    const missingCount = card.fieldPaths.filter((path) => missing.has(path)).length;
    return {
      ...card,
      status: missingCount === 0 ? "complete" : missingCount === card.fieldPaths.length ? "missing" : "partial",
    };
  });
}

export function extractDiscoveryFormValuesFromBrief(
  briefText: string,
  currentValues: DiscoveryFormValues = createEmptyDiscoveryFormValues(),
) {
  const normalized = normalizeText(briefText);
  const values = { ...currentValues };
  const textValues = values as Record<DiscoveryTextFormKey, string>;
  const autoFilledFields: string[] = [];
  const setIfEmpty = (key: DiscoveryTextFormKey, value: string) => {
    const next = normalizeText(value);
    if (!next || textValues[key].trim()) {
      return;
    }
    textValues[key] = next;
    autoFilledFields.push(String(key));
  };

  if (!normalized) {
    return { autoFilledFields, values };
  }

  setIfEmpty("problemStatement", firstSentence(normalized));
  setIfEmpty(
    "desiredOutcome",
    extractSentenceWith(normalized, ["quiero", "necesito", "para ", "lograr", "reducir", "aumentar", "mejorar", "automatizar"]),
  );
  setIfEmpty(
    "currentProcess",
    extractSentenceWith(normalized, ["hoy", "actualmente", "ahora", "manual", "se hace", "hacemos", "reciben", "llegan"]),
  );
  setIfEmpty(
    "currentUser",
    extractSentenceWith(normalized, ["equipo de", "area de", "analista", "asesor", "asesores", "operaciones", "responsable", "recursos humanos", "usuarios"]),
  );

  const opportunity = extractSentenceWith(normalized, ["automatizar", "reducir", "mejorar", "clasificar", "responder", "priorizar"]);
  if (opportunity) {
    values.automationOpportunities = mergeTextAreaValue(values.automationOpportunities, opportunity);
    if (values.automationOpportunities === opportunity && !autoFilledFields.includes("automationOpportunities")) {
      autoFilledFields.push("automationOpportunities");
    }
  }

  const errorSignal = extractSentenceWith(normalized, ["error", "errores", "reproceso", "demora", "tarde", "inconsistente", "manual"]);
  if (errorSignal) {
    values.frequentErrors = mergeTextAreaValue(values.frequentErrors, errorSignal);
    if (values.frequentErrors === errorSignal && !autoFilledFields.includes("frequentErrors")) {
      autoFilledFields.push("frequentErrors");
    }
  }

  const mvpSignal = extractSentenceWith(normalized, ["mvp", "primera version", "primero", "inicial", "v1"]);
  if (mvpSignal) {
    values.v1Scope = mergeTextAreaValue(values.v1Scope, mvpSignal);
    if (values.v1Scope === mvpSignal && !autoFilledFields.includes("v1Scope")) {
      autoFilledFields.push("v1Scope");
    }
  }

  return { autoFilledFields, values };
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
