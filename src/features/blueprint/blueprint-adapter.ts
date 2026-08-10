"use client";

import type {
  BlueprintArtifact,
  BlueprintPatchRequest,
  BlueprintTool,
  ComponentReadinessEntry,
  KnowledgeSource,
  PatternCatalogEntry,
} from "@/features/sessions/session-contracts";
import type { SessionApprovalEntry, SessionValidationEntry } from "@/features/sessions/types";

type SelectOption = {
  label: string;
  value: string;
};

type PatternFamily = "architecture" | "memory" | "reasoning";
export type ReasoningCompilerStatus = "supported" | "planned";
export type ReasoningCompilerProfile = {
  complexity: string;
  control: string;
  cost: string;
  latency: string;
  remediation: string;
  requiredCapabilities: string[];
  status: ReasoningCompilerStatus;
  summary: string;
};

const ARCHITECTURE_LABELS: Record<string, string> = {
  handoffs: "Handoffs",
  router_parallel: "Router paralelo",
  single_agent: "Agente unico",
  single_agent_with_skills: "Agente con skills",
  supervisor_with_subagents: "Orquestador + subagentes",
};

const REASONING_LABELS: Record<string, string> = {
  HTN: "HTN",
  "Plan-and-Execute": "Plan & Execute",
  ReAct: "ReAct",
  Reflexion: "Reflexion",
  ToT: "Tree of Thoughts",
};

const MEMORY_LABELS: Record<string, string> = {
  no_memory: "Sin memoria",
  persistent_memory: "Memoria persistente",
  session_memory: "Memoria de sesion",
  session_memory_with_checkpoints: "Memoria con checkpoints",
};

const REASONING_COMPILER_PROFILES: Record<string, ReasoningCompilerProfile> = {
  HTN: {
    complexity: "Alta",
    control: "Alto",
    cost: "Alto",
    latency: "Media",
    remediation: "Cambialo por Plan-and-Execute o implementa el compilador jerarquico antes de avanzar.",
    requiredCapabilities: ["descomposicion formal", "governance por subplanes"],
    status: "planned",
    summary: "Planeacion jerarquica formal. Sigue planificada para una ola posterior de S4.",
  },
  "Plan-and-Execute": {
    complexity: "Media",
    control: "Alto",
    cost: "Medio",
    latency: "Media",
    remediation: "Soportado en S4. Requiere checkpoints claros y disciplina de replan.",
    requiredCapabilities: ["plan explicito", "checkpoints", "termination criteria"],
    status: "supported",
    summary: "Compilador soportado para workflows largos, auditables y con etapas visibles.",
  },
  ReAct: {
    complexity: "Media",
    control: "Medio",
    cost: "Medio",
    latency: "Baja",
    remediation: "Soportado en S4. Funciona mejor con observaciones locales y tools controladas.",
    requiredCapabilities: ["observe-act loop", "tool calling opcional", "evaluacion por iteracion"],
    status: "supported",
    summary: "Compilador soportado para iteraciones cortas con observacion y accion.",
  },
  Reflexion: {
    complexity: "Alta",
    control: "Medio",
    cost: "Alto",
    latency: "Alta",
    remediation: "Cambialo por ReAct o Plan-and-Execute hasta que la ola 4B cierre su soporte.",
    requiredCapabilities: ["self-critique loop", "memory de mejora"],
    status: "planned",
    summary: "Patron de autocorreccion planificado para una fase posterior del compilador.",
  },
  ToT: {
    complexity: "Alta",
    control: "Alto",
    cost: "Alto",
    latency: "Alta",
    remediation: "Usa Plan-and-Execute mientras se habilita la exploracion controlada de ramas en una ola futura.",
    requiredCapabilities: ["branching controlado", "comparacion de ramas", "limites de costo"],
    status: "planned",
    summary: "Exploracion de multiples ramas, aun fuera de soporte productivo en S4.",
  },
};

const BOOLEAN_LABELS: Record<"true" | "false", string> = {
  false: "No",
  true: "Si",
};

export const ARCHITECTURE_OPTIONS: SelectOption[] = Object.entries(ARCHITECTURE_LABELS).map(([value, label]) => ({
  label,
  value,
}));

export const REASONING_OPTIONS: SelectOption[] = Object.entries(REASONING_LABELS).map(([value, label]) => ({
  label,
  value,
}));

export const MEMORY_STRATEGY_OPTIONS: SelectOption[] = Object.entries(MEMORY_LABELS).map(([value, label]) => ({
  label,
  value,
}));

export const TOOL_RISK_OPTIONS: SelectOption[] = [
  { label: "Bajo", value: "low" },
  { label: "Medio", value: "medium" },
  { label: "Alto", value: "high" },
];

export const TOOL_EXECUTION_MODE_OPTIONS: SelectOption[] = [
  { label: "Validacion local", value: "in_process_validation" },
  { label: "Derivacion local", value: "in_process_derivation" },
  { label: "Generacion estructurada", value: "structured_generation" },
  { label: "Llamada a API", value: "api_call" },
  { label: "Job asincrono", value: "async_job" },
];

export const BOOLEAN_SELECT_OPTIONS: SelectOption[] = [
  { label: BOOLEAN_LABELS.false, value: "false" },
  { label: BOOLEAN_LABELS.true, value: "true" },
];

export const TOOL_ARCHETYPE_OPTIONS: SelectOption[] = [
  { label: "Read-only", value: "read_only" },
  { label: "Side effect", value: "side_effect" },
  { label: "Async job", value: "async_job" },
];

export const TOOL_REVIEW_STATE_OPTIONS: SelectOption[] = [
  { label: "Needs review", value: "needs-review" },
  { label: "Ready", value: "ready" },
];

export const LLM_PROVIDER_OPTIONS: SelectOption[] = [
  { label: "OpenAI", value: "openai" },
  { label: "DeepSeek", value: "deepseek" },
  { label: "Codex Local", value: "codex_local" },
];

export const LLM_REASONING_EFFORT_OPTIONS: SelectOption[] = [
  { label: "Bajo", value: "low" },
  { label: "Medio", value: "medium" },
  { label: "Alto", value: "high" },
];

export type DesignFormValues = {
  architecture: string;
  llmBudgetPolicy: string;
  llmCircuitBreakerPolicy: string;
  llmContextPolicy: string;
  llmFallbackModel: string;
  llmFallbackPolicy: string;
  llmFastModel: string;
  llmOutputValidationPolicy: string;
  llmProvider: string;
  llmReasoningModel: string;
  llmRoles: LLMRoleFormValue[];
  llmSamplingPolicy: string;
  llmLogRedactionPolicy: string;
  memoryStrategy: string;
  narrative: string;
  reasoningPattern: string;
};

export type LLMRoleFormValue = {
  fallbackModel: string;
  localId: string;
  maxTokens: string;
  model: string;
  provider: string;
  reasoningEffort: string;
  role: string;
  toolAvailabilityText: string;
};

export type ToolFormValue = {
  approvalReason: string;
  approvalPolicy: string;
  archetype: string;
  auditRulesText: string;
  authReference: string;
  compensationStrategy: string;
  contractReviewState: string;
  endpointReference: string;
  executionMode: string;
  failureMode: string;
  hasSideEffects: boolean;
  idempotencyStrategy: string;
  integrationKind: string;
  inputsText: string;
  localId: string;
  name: string;
  owner: string;
  outputsText: string;
  permissionsText: string;
  purpose: string;
  rateLimitPolicy: string;
  requiresApproval: boolean;
  retryStrategy: string;
  riskLevel: string;
  scopesText: string;
  sensitiveDataText: string;
  timeoutPolicy: string;
  typedErrorsText: string;
  validationsText: string;
};

export type ToolsFormValues = {
  guardrailsText: string;
  tools: ToolFormValue[];
};

export type KnowledgeSourceFormValue = {
  description: string;
  license: string;
  localId: string;
  owner: string;
  sensitivity: string;
  sourceType: string;
  sourceVersion: string;
  title: string;
  uri: string;
};

export type MemoryFormValues = {
  agentScope: string;
  configurationPreset: string;
  goalDriftGuard: string;
  knowledgeChunkingPolicy: string;
  knowledgeCitationsPolicy: string;
  knowledgeConfidencePolicy: string;
  knowledgeContradictoryEvidenceBehavior: string;
  knowledgeDeletionPolicy: string;
  knowledgeEmbeddingDimensions: string;
  knowledgeEmbeddingModel: string;
  knowledgeEmbeddingProvider: string;
  knowledgeEmbeddingVersion: string;
  knowledgeExcludeFiltersText: string;
  knowledgeExpirationPolicy: string;
  knowledgeFallbackBehavior: string;
  knowledgeIncludeFiltersText: string;
  knowledgeMetadataFieldsText: string;
  knowledgeMode: string;
  knowledgeNoEvidenceBehavior: string;
  knowledgeNotes: string;
  knowledgeParser: string;
  knowledgeRefreshFrequency: string;
  knowledgeRefreshTriggersText: string;
  knowledgeRetrievalFiltersText: string;
  knowledgeRerankingPolicy: string;
  knowledgeSearchMode: string;
  knowledgeSensitivityRulesText: string;
  knowledgeSources: KnowledgeSourceFormValue[];
  knowledgeTopK: string;
  memoryCitationsPolicy: string;
  memoryConfidencePolicy: string;
  memoryContradictoryEvidenceBehavior: string;
  memoryNoEvidenceBehavior: string;
  memorySensitivityRulesText: string;
  memoryStrategy: string;
  retentionPolicy: string;
  retrievalPolicy: string;
  reviewTrigger: string;
  storageLayersText: string;
  ttlPolicy: string;
  workspaceScope: string;
  writePolicy: string;
};

export type DesignFieldErrors = Partial<Record<keyof DesignFormValues, string>>;
export type MemoryFieldErrors = Partial<Record<keyof MemoryFormValues, string>>;

export type ToolValidationIssue = {
  field:
    | "approvalReason"
    | "approvalPolicy"
    | "archetype"
    | "auditRulesText"
    | "authReference"
    | "compensationStrategy"
    | "contractReviewState"
    | "endpointReference"
    | "executionMode"
    | "failureMode"
    | "idempotencyStrategy"
    | "inputsText"
    | "integrationKind"
    | "name"
    | "owner"
    | "outputsText"
    | "permissionsText"
    | "purpose"
    | "rateLimitPolicy"
    | "requiresApproval"
    | "retryStrategy"
    | "scopesText"
    | "sensitiveDataText"
    | "timeoutPolicy"
    | "typedErrorsText"
    | "validationsText"
    | "name_duplicate";
  index: number;
  message: string;
};

export type LLMRoleValidationIssue = {
  field:
    | "fallbackModel"
    | "maxTokens"
    | "model"
    | "provider"
    | "reasoningEffort"
    | "toolAvailabilityText";
  index: number;
  message: string;
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parseLineList(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function formatLineList(items: string[]) {
  return items.join("\n");
}

export function formatReviewState(value: string | null | undefined) {
  if (value === "complete") {
    return "Completo";
  }

  if (value === "blocked") {
    return "Bloqueado";
  }

  return "Parcial";
}

function inferMemoryPreset(blueprint: BlueprintArtifact | null | undefined) {
  if ((blueprint?.knowledge_profile?.mode ?? "").trim() === "rag") {
    return "rag";
  }

  const strategy = (blueprint?.memory_strategy ?? blueprint?.memory_profile.strategy ?? "").trim();
  if (strategy === "no_memory") {
    return "no_memory";
  }
  if (strategy === "persistent_memory") {
    return "persistent";
  }
  return "session";
}

function ensureLineList(value: string[] | undefined) {
  return formatLineList(value ?? []);
}

export function createKnowledgeSourceFormValue(source?: KnowledgeSource): KnowledgeSourceFormValue {
  return {
    description: source?.description ?? "",
    license: source?.license ?? "",
    localId: `knowledge-source-${Math.random().toString(36).slice(2, 10)}`,
    owner: source?.owner ?? "",
    sensitivity: source?.sensitivity ?? "",
    sourceType: source?.source_type ?? "",
    sourceVersion: source?.source_version ?? "",
    title: source?.title ?? "",
    uri: source?.uri ?? "",
  };
}

function coercePositiveInteger(value: string) {
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function getPatternLabel(family: PatternFamily, value: string) {
  if (family === "architecture") {
    return ARCHITECTURE_LABELS[value] ?? value;
  }

  if (family === "reasoning") {
    return REASONING_LABELS[value] ?? value;
  }

  return MEMORY_LABELS[value] ?? value;
}

export function getReasoningCompilerProfile(value: string): ReasoningCompilerProfile {
  return (
    REASONING_COMPILER_PROFILES[value] ?? {
      complexity: "Media",
      control: "Medio",
      cost: "Medio",
      latency: "Media",
      remediation: "Confirma el soporte del patron antes de publicarlo como disponible.",
      requiredCapabilities: [],
      status: "planned",
      summary: "Patron sin perfil declarado en la matriz local del compilador.",
    }
  );
}

export function isReasoningPatternSupported(value: string) {
  return getReasoningCompilerProfile(value).status === "supported";
}

export function getPatternEntries(
  blueprint: BlueprintArtifact | null | undefined,
  family: PatternFamily,
): PatternCatalogEntry[] {
  const entries = blueprint?.delivery_package.pattern_catalog.filter((item) => item.family === family) ?? [];

  if (entries.length > 0) {
    return entries;
  }

  const fallbackOptions =
    family === "architecture"
      ? ARCHITECTURE_OPTIONS
      : family === "reasoning"
        ? REASONING_OPTIONS
        : MEMORY_STRATEGY_OPTIONS;

  return fallbackOptions.map((option) => ({
    family,
    fit_score: 0,
    key: option.value,
    label: option.label,
    selected:
      family === "architecture"
        ? blueprint?.architecture === option.value
        : family === "reasoning"
          ? blueprint?.reasoning_pattern === option.value
          : blueprint?.memory_strategy === option.value,
    summary: "Sin evidencia derivada todavia. Puedes gobernar esta decision manualmente.",
    tradeoffs: [],
    use_when: [],
  }));
}

export function getBlueprintReadinessEntry(
  blueprint: BlueprintArtifact | null | undefined,
  componentKey: string,
): ComponentReadinessEntry | null {
  return blueprint?.delivery_package.component_readiness.find((item) => item.component === componentKey) ?? null;
}

export function getLatestBlueprintValidation(
  validations: SessionValidationEntry[] | null | undefined,
) {
  const candidates = (validations ?? []).filter((item) => item.artifact_name.startsWith("blueprint"));
  return candidates.sort((left, right) => right.created_at.localeCompare(left.created_at))[0] ?? null;
}

export function countPendingApprovals(approvals: SessionApprovalEntry[] | null | undefined) {
  return (approvals ?? []).filter((item) => item.status === "pending").length;
}

function createDefaultLLMRole(role: string, index: number, toolNames: string[]) {
  const isReasoningRole = role === "planner" || role === "evaluator";
  return {
    fallbackModel: "manual_review_gate",
    localId: `${role}-${index + 1}`,
    maxTokens: isReasoningRole ? "1800" : role === "tool_use" ? "1200" : "1600",
    model: isReasoningRole ? "gpt-5.5" : "gpt-5-mini",
    provider: "openai",
    reasoningEffort: isReasoningRole ? "high" : "medium",
    role,
    toolAvailabilityText: role === "tool_use" ? formatLineList(toolNames) : "",
  } satisfies LLMRoleFormValue;
}

function createDefaultLLMRoles(toolNames: string[]) {
  return [
    createDefaultLLMRole("planner", 0, toolNames),
    createDefaultLLMRole("executor", 1, toolNames),
    createDefaultLLMRole("evaluator", 2, toolNames),
    createDefaultLLMRole("tool_use", 3, toolNames),
  ];
}

export function createBlankTool(seed = "tool"): ToolFormValue {
  return {
    approvalReason: "",
    approvalPolicy: "not_required",
    archetype: "read_only",
    auditRulesText: "Registrar request_id y resultado auditado.",
    authReference: "none",
    compensationStrategy: "No aplica porque no hay side effects.",
    contractReviewState: "needs-review",
    endpointReference: "endpoint://pending",
    executionMode: "in_process_validation",
    failureMode: "La herramienta responde sin datos o con schema invalido.",
    hasSideEffects: false,
    idempotencyStrategy: "Repetible sobre el mismo input sin side effects.",
    integrationKind: "local_runtime",
    inputsText: "request",
    localId: `${seed}-${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    owner: "builder",
    outputsText: "response",
    permissionsText: "implicit_read_access",
    purpose: "",
    rateLimitPolicy: "Sin limite externo; una ejecucion por accion del usuario.",
    requiresApproval: false,
    retryStrategy: "Reintentar una vez cuando el error sea recuperable.",
    riskLevel: "low",
    scopesText: "read",
    sensitiveDataText: "",
    timeoutPolicy: "Timeout local corto de 10 segundos.",
    typedErrorsText: "validation_error",
    validationsText: "Schema valido",
  };
}

export function createDesignFormValues(blueprint: BlueprintArtifact | null | undefined): DesignFormValues {
  const toolNames = (blueprint?.tools ?? []).map((tool) => tool.name).filter(Boolean);
  const roles =
    blueprint?.llm_policy?.functions?.map((item, index) => ({
      fallbackModel: item.fallback_model,
      localId: `${item.role || "role"}-${index + 1}`,
      maxTokens: item.max_tokens > 0 ? String(item.max_tokens) : "",
      model: item.model,
      provider: item.provider,
      reasoningEffort: item.reasoning_effort,
      role: item.role,
      toolAvailabilityText: formatLineList(item.tool_availability),
    })) ?? [];

  return {
    architecture: blueprint?.architecture ?? "",
    llmBudgetPolicy:
      blueprint?.llm_policy?.budget_policy ??
      "Reservar razonamiento largo para planner y evaluator; limitar executor y tool_use a interacciones acotadas.",
    llmCircuitBreakerPolicy:
      blueprint?.llm_policy?.circuit_breaker_policy ??
      "Abrir circuit breaker tras 3 fallos consecutivos y escalar a review.",
    llmContextPolicy:
      blueprint?.llm_policy?.context_policy ??
      "Trabajar solo con contratos aprobados, evidencia trazable y el snapshot vigente.",
    llmFallbackModel: blueprint?.llm_policy?.fallback_model ?? "manual_review_gate",
    llmFallbackPolicy:
      blueprint?.llm_policy?.fallback_policy ??
      "Si el proveedor no responde o el contrato no alcanza, usar el fallback declarado o bloquear con revision humana.",
    llmFastModel: blueprint?.llm_policy?.fast_model ?? "gpt-5-mini",
    llmOutputValidationPolicy:
      blueprint?.llm_policy?.output_validation_policy ??
      "Validar cada salida estructurada contra schemas versionados antes de promover estado o artefactos.",
    llmProvider: blueprint?.llm_policy?.provider ?? "openai",
    llmReasoningModel: blueprint?.llm_policy?.reasoning_model ?? "gpt-5.5",
    llmRoles: roles.length > 0 ? roles : createDefaultLLMRoles(toolNames),
    llmSamplingPolicy:
      blueprint?.llm_policy?.sampling_policy ??
      "Planner y evaluator con temperatura baja; executor y tool_use sin improvisacion fuera del contrato.",
    llmLogRedactionPolicy:
      blueprint?.llm_policy?.log_redaction_policy ??
      "Redactar secretos, credenciales y datos sensibles; conservar ids, hashes y trazas auditables.",
    memoryStrategy: blueprint?.memory_strategy ?? "",
    narrative: blueprint?.narrative ?? "",
    reasoningPattern: blueprint?.reasoning_pattern ?? "",
  };
}

export function createToolsFormValues(blueprint: BlueprintArtifact | null | undefined): ToolsFormValues {
  return {
    guardrailsText: formatLineList(blueprint?.guardrails ?? []),
    tools:
      blueprint?.tools.map((tool, index) => ({
        approvalReason: tool.approval_reason,
        approvalPolicy: tool.approval_policy ?? (tool.requires_approval ? "local_admin_mandatory" : "not_required"),
        archetype: tool.archetype ?? (tool.has_side_effects ? "side_effect" : "read_only"),
        auditRulesText: formatLineList(tool.audit_rules ?? []),
        authReference: tool.auth_reference ?? "none",
        compensationStrategy: tool.compensation_strategy,
        contractReviewState: tool.contract_review_state ?? "needs-review",
        endpointReference: tool.endpoint_reference ?? "endpoint://pending",
        executionMode: tool.execution_mode,
        failureMode: tool.failure_mode,
        hasSideEffects: tool.has_side_effects,
        idempotencyStrategy: tool.idempotency_strategy ?? "",
        integrationKind: tool.integration_kind ?? "local_runtime",
        inputsText: formatLineList(tool.inputs),
        localId: `${slugify(tool.name || `tool-${index + 1}`) || `tool-${index + 1}`}-${index + 1}`,
        name: tool.name,
        owner: tool.owner ?? "builder",
        outputsText: formatLineList(tool.outputs),
        permissionsText: formatLineList(tool.permissions ?? []),
        purpose: tool.purpose,
        rateLimitPolicy: tool.rate_limit_policy ?? "",
        requiresApproval: tool.requires_approval,
        retryStrategy: tool.retry_strategy,
        riskLevel: tool.risk_level,
        scopesText: formatLineList(tool.scopes ?? []),
        sensitiveDataText: formatLineList(tool.sensitive_data ?? []),
        timeoutPolicy: tool.timeout_policy ?? "",
        typedErrorsText: formatLineList(tool.typed_errors ?? []),
        validationsText: formatLineList(tool.validations),
      })) ?? [],
  };
}

export function createMemoryFormValues(blueprint: BlueprintArtifact | null | undefined): MemoryFormValues {
  const knowledgeProfile = blueprint?.knowledge_profile;
  const memoryGrounding = blueprint?.memory_profile.grounding_policy;
  const knowledgeGrounding = knowledgeProfile?.grounding_policy;
  const ingestionPolicy = knowledgeProfile?.ingestion_policy;
  const embeddingPolicy = knowledgeProfile?.embedding_policy;
  const retrievalPolicy = knowledgeProfile?.retrieval_policy;
  const refreshPolicy = knowledgeProfile?.refresh_policy;

  return {
    agentScope: blueprint?.memory_profile.agent_scope ?? "",
    configurationPreset: inferMemoryPreset(blueprint),
    goalDriftGuard: blueprint?.memory_profile.goal_drift_guard ?? "",
    knowledgeChunkingPolicy: ingestionPolicy?.chunking_policy ?? "",
    knowledgeCitationsPolicy: knowledgeGrounding?.citations_policy ?? "",
    knowledgeConfidencePolicy: knowledgeGrounding?.confidence_policy ?? "",
    knowledgeContradictoryEvidenceBehavior: knowledgeGrounding?.contradictory_evidence_behavior ?? "",
    knowledgeDeletionPolicy: refreshPolicy?.deletion_policy ?? "",
    knowledgeEmbeddingDimensions:
      embeddingPolicy && embeddingPolicy.dimensions > 0 ? String(embeddingPolicy.dimensions) : "",
    knowledgeEmbeddingModel: embeddingPolicy?.model ?? "",
    knowledgeEmbeddingProvider: embeddingPolicy?.provider ?? "",
    knowledgeEmbeddingVersion: embeddingPolicy?.version ?? "",
    knowledgeExcludeFiltersText: ensureLineList(ingestionPolicy?.exclude_filters),
    knowledgeExpirationPolicy: refreshPolicy?.expiration_policy ?? "",
    knowledgeFallbackBehavior: retrievalPolicy?.fallback_behavior ?? "",
    knowledgeIncludeFiltersText: ensureLineList(ingestionPolicy?.include_filters),
    knowledgeMetadataFieldsText: ensureLineList(ingestionPolicy?.metadata_fields),
    knowledgeMode: knowledgeProfile?.mode ?? "none",
    knowledgeNoEvidenceBehavior: knowledgeGrounding?.no_evidence_behavior ?? "",
    knowledgeNotes: knowledgeProfile?.notes ?? "",
    knowledgeParser: ingestionPolicy?.parser ?? "",
    knowledgeRefreshFrequency: refreshPolicy?.frequency ?? "",
    knowledgeRefreshTriggersText: ensureLineList(refreshPolicy?.triggers),
    knowledgeRetrievalFiltersText: ensureLineList(retrievalPolicy?.filters),
    knowledgeRerankingPolicy: retrievalPolicy?.reranking_policy ?? "",
    knowledgeSearchMode: retrievalPolicy?.search_mode ?? "",
    knowledgeSensitivityRulesText: ensureLineList(knowledgeProfile?.sensitivity_rules),
    knowledgeSources: (knowledgeProfile?.sources ?? []).map((source) => createKnowledgeSourceFormValue(source)),
    knowledgeTopK: retrievalPolicy && retrievalPolicy.top_k > 0 ? String(retrievalPolicy.top_k) : "",
    memoryCitationsPolicy: memoryGrounding?.citations_policy ?? "",
    memoryConfidencePolicy: memoryGrounding?.confidence_policy ?? "",
    memoryContradictoryEvidenceBehavior: memoryGrounding?.contradictory_evidence_behavior ?? "",
    memoryNoEvidenceBehavior: memoryGrounding?.no_evidence_behavior ?? "",
    memorySensitivityRulesText: ensureLineList(blueprint?.memory_profile.sensitivity_rules),
    memoryStrategy: blueprint?.memory_strategy ?? blueprint?.memory_profile.strategy ?? "",
    retentionPolicy: blueprint?.memory_profile.retention_policy ?? "",
    retrievalPolicy: blueprint?.memory_profile.retrieval_policy ?? "",
    reviewTrigger: blueprint?.memory_profile.review_trigger ?? "",
    storageLayersText: formatLineList(blueprint?.memory_profile.storage_layers ?? []),
    ttlPolicy: blueprint?.memory_profile.ttl_policy ?? "",
    workspaceScope: blueprint?.memory_profile.workspace_scope ?? "",
    writePolicy: blueprint?.memory_profile.write_policy ?? "",
  };
}

export function getDesignFieldErrors(values: DesignFormValues): DesignFieldErrors {
  const errors: DesignFieldErrors = {};

  if (!values.architecture.trim()) {
    errors.architecture = "Selecciona una arquitectura.";
  }

  if (!values.reasoningPattern.trim()) {
    errors.reasoningPattern = "Selecciona un patron de razonamiento.";
  }

  if (!values.memoryStrategy.trim()) {
    errors.memoryStrategy = "Selecciona una estrategia de memoria.";
  }

  if (!values.llmProvider.trim()) {
    errors.llmProvider = "Selecciona el proveedor base de la policy LLM.";
  }

  if (!values.llmFastModel.trim()) {
    errors.llmFastModel = "Declara el fast model base.";
  }

  if (!values.llmReasoningModel.trim()) {
    errors.llmReasoningModel = "Declara el reasoning model base.";
  }

  if (!values.llmFallbackModel.trim()) {
    errors.llmFallbackModel = "Declara el fallback model o gate manual.";
  }

  if (!values.llmContextPolicy.trim()) {
    errors.llmContextPolicy = "Define la context policy.";
  }

  if (!values.llmSamplingPolicy.trim()) {
    errors.llmSamplingPolicy = "Define la sampling policy.";
  }

  if (!values.llmFallbackPolicy.trim()) {
    errors.llmFallbackPolicy = "Define la fallback policy.";
  }

  if (!values.llmCircuitBreakerPolicy.trim()) {
    errors.llmCircuitBreakerPolicy = "Define la politica de circuit breaker.";
  }

  if (!values.llmBudgetPolicy.trim()) {
    errors.llmBudgetPolicy = "Define la budget policy.";
  }

  if (!values.llmOutputValidationPolicy.trim()) {
    errors.llmOutputValidationPolicy = "Define la policy de validacion de salida.";
  }

  if (!values.llmLogRedactionPolicy.trim()) {
    errors.llmLogRedactionPolicy = "Define la policy de redaccion de logs.";
  }

  if (values.llmRoles.length === 0) {
    errors.llmRoles = "Declara al menos una policy por rol.";
  }

  return errors;
}

export function getMemoryFieldErrors(values: MemoryFormValues): MemoryFieldErrors {
  const errors: MemoryFieldErrors = {};
  const requiresRag = values.configurationPreset === "rag" || values.knowledgeMode.trim() === "rag";

  if (!values.memoryStrategy.trim()) {
    errors.memoryStrategy = "Selecciona una estrategia de memoria.";
  }

  if (parseLineList(values.storageLayersText).length === 0) {
    errors.storageLayersText = "Declara al menos una capa de memoria.";
  }

  if (!values.writePolicy.trim()) {
    errors.writePolicy = "Define la politica de escritura.";
  }

  if (!values.retrievalPolicy.trim()) {
    errors.retrievalPolicy = "Define la politica de recuperacion.";
  }

  if (!values.reviewTrigger.trim()) {
    errors.reviewTrigger = "Define cuando debe entrar en revision.";
  }

  if (!values.goalDriftGuard.trim()) {
    errors.goalDriftGuard = "Define como se protege el objetivo.";
  }

  if (!values.retentionPolicy.trim()) {
    errors.retentionPolicy = "Define la politica de retencion.";
  }

  if (!values.ttlPolicy.trim()) {
    errors.ttlPolicy = "Define la politica TTL.";
  }

  if (!values.workspaceScope.trim()) {
    errors.workspaceScope = "Separa la memoria del workspace.";
  }

  if (!values.agentScope.trim()) {
    errors.agentScope = "Separa la memoria del agente final.";
  }

  if (!values.memoryCitationsPolicy.trim()) {
    errors.memoryCitationsPolicy = "Define como se citan los checkpoints o artefactos.";
  }

  if (!values.memoryConfidencePolicy.trim()) {
    errors.memoryConfidencePolicy = "Define cuando confiar en memoria previa.";
  }

  if (!values.memoryNoEvidenceBehavior.trim()) {
    errors.memoryNoEvidenceBehavior = "Define el fallback sin evidencia de memoria.";
  }

  if (!values.memorySensitivityRulesText.trim()) {
    errors.memorySensitivityRulesText = "Declara reglas de sensibilidad para memoria.";
  }

  if (requiresRag) {
    if (values.knowledgeSources.length === 0) {
      errors.knowledgeSources = "Agrega al menos una fuente aprobada para RAG.";
    } else if (
      values.knowledgeSources.some(
        (source) =>
          !source.title.trim() ||
          !source.sourceType.trim() ||
          !source.uri.trim() ||
          !source.owner.trim() ||
          !source.sensitivity.trim() ||
          !source.sourceVersion.trim(),
      )
    ) {
      errors.knowledgeSources = "Cada fuente debe incluir titulo, tipo, URI, owner, sensibilidad y version.";
    }

    if (!values.knowledgeParser.trim()) {
      errors.knowledgeParser = "Define el parser de ingestion.";
    }

    if (!values.knowledgeChunkingPolicy.trim()) {
      errors.knowledgeChunkingPolicy = "Define la politica de chunking.";
    }

    if (!values.knowledgeEmbeddingProvider.trim()) {
      errors.knowledgeEmbeddingProvider = "Define el provider de embeddings.";
    }

    if (!values.knowledgeEmbeddingModel.trim()) {
      errors.knowledgeEmbeddingModel = "Define el modelo de embeddings.";
    }

    if (coercePositiveInteger(values.knowledgeEmbeddingDimensions) <= 0) {
      errors.knowledgeEmbeddingDimensions = "Define dimensions validas para embeddings.";
    }

    if (!values.knowledgeEmbeddingVersion.trim()) {
      errors.knowledgeEmbeddingVersion = "Declara la version de embeddings.";
    }

    if (coercePositiveInteger(values.knowledgeTopK) <= 0) {
      errors.knowledgeTopK = "Define un top-k valido para retrieval.";
    }

    if (!values.knowledgeSearchMode.trim()) {
      errors.knowledgeSearchMode = "Define el modo de busqueda.";
    }

    if (!values.knowledgeFallbackBehavior.trim()) {
      errors.knowledgeFallbackBehavior = "Define el fallback cuando retrieval no encuentra evidencia.";
    }

    if (!values.knowledgeRefreshFrequency.trim()) {
      errors.knowledgeRefreshFrequency = "Define la frecuencia de refresh.";
    }

    if (parseLineList(values.knowledgeRefreshTriggersText).length === 0) {
      errors.knowledgeRefreshTriggersText = "Declara al menos un trigger de refresh.";
    }

    if (!values.knowledgeExpirationPolicy.trim()) {
      errors.knowledgeExpirationPolicy = "Define la expiracion del knowledge.";
    }

    if (!values.knowledgeDeletionPolicy.trim()) {
      errors.knowledgeDeletionPolicy = "Define la politica de borrado.";
    }

    if (!values.knowledgeCitationsPolicy.trim()) {
      errors.knowledgeCitationsPolicy = "Define la politica de citas para retrieval.";
    }

    if (!values.knowledgeConfidencePolicy.trim()) {
      errors.knowledgeConfidencePolicy = "Define la politica de confianza para retrieval.";
    }

    if (!values.knowledgeNoEvidenceBehavior.trim()) {
      errors.knowledgeNoEvidenceBehavior = "Define el comportamiento sin evidencia.";
    }

    if (!values.knowledgeSensitivityRulesText.trim()) {
      errors.knowledgeSensitivityRulesText = "Declara reglas sensibles para knowledge.";
    }
  }

  return errors;
}

export function getToolValidationIssues(values: ToolsFormValues): ToolValidationIssue[] {
  const issues: ToolValidationIssue[] = [];
  const seenNames = new Map<string, number>();

  values.tools.forEach((tool, index) => {
    const normalizedName = tool.name.trim().toLowerCase();

    if (!tool.name.trim()) {
      issues.push({ field: "name", index, message: "El nombre es obligatorio." });
    }

    if (!tool.purpose.trim()) {
      issues.push({ field: "purpose", index, message: "El proposito es obligatorio." });
    }

    if (!tool.owner.trim()) {
      issues.push({ field: "owner", index, message: "Declara el owner de la tool." });
    }

    if (!tool.archetype.trim()) {
      issues.push({ field: "archetype", index, message: "Selecciona el arquetipo de la tool." });
    }

    if (!tool.integrationKind.trim()) {
      issues.push({ field: "integrationKind", index, message: "Declara el tipo de integracion." });
    }

    if (!tool.endpointReference.trim()) {
      issues.push({ field: "endpointReference", index, message: "Declara una referencia abstracta de endpoint." });
    }

    if (!tool.authReference.trim()) {
      issues.push({ field: "authReference", index, message: "Declara una referencia de autenticacion no secreta." });
    }

    if (parseLineList(tool.inputsText).length === 0) {
      issues.push({ field: "inputsText", index, message: "Declara al menos un input." });
    }

    if (parseLineList(tool.outputsText).length === 0) {
      issues.push({ field: "outputsText", index, message: "Declara al menos un output." });
    }

    if (parseLineList(tool.validationsText).length === 0) {
      issues.push({ field: "validationsText", index, message: "Agrega al menos una validacion." });
    }

    if (parseLineList(tool.typedErrorsText).length === 0) {
      issues.push({ field: "typedErrorsText", index, message: "Agrega al menos un error tipado." });
    }

    if (parseLineList(tool.permissionsText).length === 0) {
      issues.push({ field: "permissionsText", index, message: "Declara al menos un permiso." });
    }

    if (parseLineList(tool.scopesText).length === 0) {
      issues.push({ field: "scopesText", index, message: "Declara al menos un scope." });
    }

    if (parseLineList(tool.auditRulesText).length === 0) {
      issues.push({ field: "auditRulesText", index, message: "Declara al menos una regla de auditoria." });
    }

    if (!tool.executionMode.trim()) {
      issues.push({ field: "executionMode", index, message: "Selecciona un modo de ejecucion." });
    }

    if (!tool.rateLimitPolicy.trim()) {
      issues.push({ field: "rateLimitPolicy", index, message: "Define la policy de rate limit." });
    }

    if (!tool.timeoutPolicy.trim()) {
      issues.push({ field: "timeoutPolicy", index, message: "Define la policy de timeout." });
    }

    if (!tool.retryStrategy.trim()) {
      issues.push({ field: "retryStrategy", index, message: "Define la estrategia de reintento." });
    }

    if (!tool.failureMode.trim()) {
      issues.push({ field: "failureMode", index, message: "Define el modo de fallo esperado." });
    }

    if (!tool.idempotencyStrategy.trim()) {
      issues.push({ field: "idempotencyStrategy", index, message: "Declara la estrategia de idempotencia." });
    }

    if (!tool.contractReviewState.trim()) {
      issues.push({ field: "contractReviewState", index, message: "Declara el review state del contrato." });
    }

    if (!tool.approvalPolicy.trim()) {
      issues.push({ field: "approvalPolicy", index, message: "Declara la approval policy de la tool." });
    }

    if (tool.hasSideEffects && !tool.requiresApproval) {
      issues.push({
        field: "requiresApproval",
        index,
        message: "Toda tool con side effects debe exigir aprobacion.",
      });
    }

    if (tool.requiresApproval && !tool.approvalReason.trim()) {
      issues.push({
        field: "approvalReason",
        index,
        message: "Explica por que esta tool requiere aprobacion.",
      });
    }

    if (tool.hasSideEffects && !tool.compensationStrategy.trim()) {
      issues.push({
        field: "compensationStrategy",
        index,
        message: "Define una estrategia de compensacion para side effects.",
      });
    }

    if (tool.archetype === "read_only" && tool.hasSideEffects) {
      issues.push({
        field: "archetype",
        index,
        message: "Una tool read-only no debe declarar side effects.",
      });
    }

    if (tool.archetype === "side_effect" && !tool.hasSideEffects) {
      issues.push({
        field: "archetype",
        index,
        message: "Una tool de side effect debe declarar side effects.",
      });
    }

    if (tool.archetype === "async_job" && tool.executionMode !== "async_job") {
      issues.push({
        field: "executionMode",
        index,
        message: "El arquetipo async_job debe usar execution mode async_job.",
      });
    }

    if (normalizedName) {
      const previousIndex = seenNames.get(normalizedName);

      if (previousIndex !== undefined) {
        issues.push({
          field: "name_duplicate",
          index,
          message: `El nombre de la herramienta ya se uso en la fila ${previousIndex + 1}.`,
        });
      } else {
        seenNames.set(normalizedName, index);
      }
    }
  });

  return issues;
}

export function getLLMRoleValidationIssues(values: DesignFormValues): LLMRoleValidationIssue[] {
  const issues: LLMRoleValidationIssue[] = [];
  const toolNames = new Set(values.llmRoles.filter((item) => item.role === "tool_use").flatMap((item) => parseLineList(item.toolAvailabilityText)));

  values.llmRoles.forEach((item, index) => {
    if (!item.provider.trim()) {
      issues.push({ field: "provider", index, message: "Selecciona un provider por rol." });
    }

    if (!item.model.trim()) {
      issues.push({ field: "model", index, message: "Declara el modelo por rol." });
    }

    if (!item.reasoningEffort.trim()) {
      issues.push({ field: "reasoningEffort", index, message: "Declara el reasoning effort por rol." });
    }

    if (!item.fallbackModel.trim()) {
      issues.push({ field: "fallbackModel", index, message: "Declara el fallback model por rol." });
    }

    const parsedMaxTokens = Number.parseInt(item.maxTokens, 10);
    if (!Number.isFinite(parsedMaxTokens) || parsedMaxTokens <= 0) {
      issues.push({ field: "maxTokens", index, message: "Declara un max tokens positivo." });
    }

    if (item.role === "tool_use" && parseLineList(item.toolAvailabilityText).length === 0) {
      issues.push({
        field: "toolAvailabilityText",
        index,
        message: "El rol tool_use debe declarar las tools aprobadas.",
      });
    }
  });

  if (toolNames.size === 0) {
    const toolUseIndex = values.llmRoles.findIndex((item) => item.role === "tool_use");
    if (toolUseIndex >= 0) {
      issues.push({
        field: "toolAvailabilityText",
        index: toolUseIndex,
        message: "El binding de tool_use no puede quedar vacio.",
      });
    }
  }

  return issues;
}

function toBlueprintTool(value: ToolFormValue): BlueprintTool {
  return {
    approval_reason: value.approvalReason.trim(),
    approval_policy: value.approvalPolicy.trim(),
    archetype: value.archetype.trim(),
    audit_rules: parseLineList(value.auditRulesText),
    auth_reference: value.authReference.trim(),
    compensation_strategy: value.compensationStrategy.trim(),
    contract_review_state: value.contractReviewState.trim(),
    endpoint_reference: value.endpointReference.trim(),
    execution_mode: value.executionMode.trim(),
    failure_mode: value.failureMode.trim(),
    has_side_effects: value.hasSideEffects,
    idempotency_strategy: value.idempotencyStrategy.trim(),
    integration_kind: value.integrationKind.trim(),
    inputs: parseLineList(value.inputsText),
    name: value.name.trim(),
    owner: value.owner.trim(),
    outputs: parseLineList(value.outputsText),
    permissions: parseLineList(value.permissionsText),
    purpose: value.purpose.trim(),
    rate_limit_policy: value.rateLimitPolicy.trim(),
    requires_approval: value.requiresApproval,
    retry_strategy: value.retryStrategy.trim(),
    risk_level: value.riskLevel.trim(),
    scopes: parseLineList(value.scopesText),
    sensitive_data: parseLineList(value.sensitiveDataText),
    timeout_policy: value.timeoutPolicy.trim(),
    typed_errors: parseLineList(value.typedErrorsText),
    validations: parseLineList(value.validationsText),
  };
}

function toLLMRolePolicy(value: LLMRoleFormValue) {
  return {
    fallback_model: value.fallbackModel.trim(),
    max_tokens: Number.parseInt(value.maxTokens, 10) || 0,
    model: value.model.trim(),
    provider: value.provider.trim(),
    reasoning_effort: value.reasoningEffort.trim(),
    role: value.role.trim(),
    tool_availability: parseLineList(value.toolAvailabilityText),
  };
}

export function buildDesignPatch(values: DesignFormValues): BlueprintPatchRequest {
  return {
    architecture: values.architecture.trim(),
    llm_policy: {
      budget_policy: values.llmBudgetPolicy.trim(),
      circuit_breaker_policy: values.llmCircuitBreakerPolicy.trim(),
      context_policy: values.llmContextPolicy.trim(),
      fallback_model: values.llmFallbackModel.trim(),
      fallback_policy: values.llmFallbackPolicy.trim(),
      fast_model: values.llmFastModel.trim(),
      functions: values.llmRoles.map(toLLMRolePolicy),
      log_redaction_policy: values.llmLogRedactionPolicy.trim(),
      output_validation_policy: values.llmOutputValidationPolicy.trim(),
      provider: values.llmProvider.trim(),
      reasoning_model: values.llmReasoningModel.trim(),
      review_state: "needs-review",
      sampling_policy: values.llmSamplingPolicy.trim(),
    },
    memory_strategy: values.memoryStrategy.trim(),
    narrative: values.narrative.trim(),
    reasoning_pattern: values.reasoningPattern.trim(),
  };
}

export function buildToolsPatch(values: ToolsFormValues): BlueprintPatchRequest {
  return {
    guardrails: parseLineList(values.guardrailsText),
    tools: values.tools.map(toBlueprintTool),
  };
}

export function buildMemoryPatch(values: MemoryFormValues): BlueprintPatchRequest {
  const preset = values.configurationPreset.trim();
  const strategy = values.memoryStrategy.trim();
  const knowledgeMode = preset === "rag" ? "rag" : values.knowledgeMode.trim() || "none";

  return {
    knowledge_profile: {
      embedding_policy: {
        dimensions: coercePositiveInteger(values.knowledgeEmbeddingDimensions),
        model: values.knowledgeEmbeddingModel.trim(),
        provider: values.knowledgeEmbeddingProvider.trim(),
        version: values.knowledgeEmbeddingVersion.trim(),
      },
      grounding_policy: {
        citations_policy: values.knowledgeCitationsPolicy.trim(),
        confidence_policy: values.knowledgeConfidencePolicy.trim(),
        contradictory_evidence_behavior: values.knowledgeContradictoryEvidenceBehavior.trim(),
        no_evidence_behavior: values.knowledgeNoEvidenceBehavior.trim(),
      },
      ingestion_policy: {
        chunking_policy: values.knowledgeChunkingPolicy.trim(),
        exclude_filters: parseLineList(values.knowledgeExcludeFiltersText),
        include_filters: parseLineList(values.knowledgeIncludeFiltersText),
        metadata_fields: parseLineList(values.knowledgeMetadataFieldsText),
        parser: values.knowledgeParser.trim(),
      },
      mode: knowledgeMode,
      notes: values.knowledgeNotes.trim(),
      refresh_policy: {
        deletion_policy: values.knowledgeDeletionPolicy.trim(),
        expiration_policy: values.knowledgeExpirationPolicy.trim(),
        frequency: values.knowledgeRefreshFrequency.trim(),
        triggers: parseLineList(values.knowledgeRefreshTriggersText),
      },
      retrieval_policy: {
        fallback_behavior: values.knowledgeFallbackBehavior.trim(),
        filters: parseLineList(values.knowledgeRetrievalFiltersText),
        reranking_policy: values.knowledgeRerankingPolicy.trim(),
        search_mode: values.knowledgeSearchMode.trim(),
        top_k: coercePositiveInteger(values.knowledgeTopK),
      },
      sensitivity_rules: parseLineList(values.knowledgeSensitivityRulesText),
      sources: values.knowledgeSources.map((source, index) => ({
        description: source.description.trim(),
        key: `knowledge_source_${index + 1}`,
        license: source.license.trim(),
        owner: source.owner.trim(),
        sensitivity: source.sensitivity.trim(),
        source_type: source.sourceType.trim(),
        source_version: source.sourceVersion.trim(),
        title: source.title.trim(),
        uri: source.uri.trim(),
      })),
    },
    memory_profile: {
      agent_scope: values.agentScope.trim(),
      goal_drift_guard: values.goalDriftGuard.trim(),
      grounding_policy: {
        citations_policy: values.memoryCitationsPolicy.trim(),
        confidence_policy: values.memoryConfidencePolicy.trim(),
        contradictory_evidence_behavior: values.memoryContradictoryEvidenceBehavior.trim(),
        no_evidence_behavior: values.memoryNoEvidenceBehavior.trim(),
      },
      retention_policy: values.retentionPolicy.trim(),
      retrieval_policy: values.retrievalPolicy.trim(),
      review_trigger: values.reviewTrigger.trim(),
      sensitivity_rules: parseLineList(values.memorySensitivityRulesText),
      storage_layers: parseLineList(values.storageLayersText),
      strategy,
      ttl_policy: values.ttlPolicy.trim(),
      workspace_scope: values.workspaceScope.trim(),
      write_policy: values.writePolicy.trim(),
    },
    memory_strategy: strategy,
  };
}
