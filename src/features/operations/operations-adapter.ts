import type {
  TranslationKey,
} from "@/core/i18n/locales/es";
import type {
  AgentExecutionBackend,
  AntigravityProviderConfig,
  ArtifactRecordEntry,
  CodexLocalProviderConfig,
  CatalogSummaryEntry,
  EstimationCalibrationDashboard,
  FeatureFlagEntry,
  IntegrationStatusEntry,
  KnowledgeAccessBackend,
  LLMRuntimeSettings,
  LLMRuntimeSettingsUpdateRequest,
  MonitoringWorkspace,
} from "@/features/sessions/session-contracts";
import type { RuntimeStatusResponse } from "@/core/system/runtime-api";

const CRITICAL_SEVERITIES = new Set(["blocking", "critical", "error", "high"]);
const WARNING_SEVERITIES = new Set(["medium", "needs_review", "warning"]);

export type StatusTone = "violet" | "green" | "orange" | "red" | "blue" | "slate";
type TranslationFunction = (key: TranslationKey, fallback?: string) => string;

export type CodexRolloutSummary = ReturnType<typeof buildCodexRolloutSummary>;

export type CodexRuntimeSummary = {
  auth: {
    detail: string;
    label: string;
    tone: StatusTone;
  };
  binary: {
    detail: string;
    label: string;
    tone: StatusTone;
  };
  blockingReasons: string[];
  lastKnownResult: RuntimeStatusResponse["last_known_result"];
  lastRun: {
    detail: string;
    label: string;
    tone: StatusTone;
  };
  readiness: {
    detail: string;
    label: string;
    tone: StatusTone;
  };
  rollout: CodexRolloutSummary;
};

export type ReleaseObservabilitySummary = ReturnType<typeof buildReleaseObservabilitySummary>;

export function parseCommaSeparatedValues(value: string) {
  const normalized: string[] = [];
  const seen = new Set<string>();
  for (const item of value.split(",")) {
    const token = item.trim();
    if (!token) {
      continue;
    }
    const lowered = token.toLowerCase();
    if (seen.has(lowered)) {
      continue;
    }
    seen.add(lowered);
    normalized.push(token);
  }
  return normalized;
}

export function formatCommaSeparatedValues(values: string[]) {
  return values.join(", ");
}

export function formatRelativeTime(value?: string | null) {
  if (!value) {
    return "Sin actividad reciente";
  }

  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) {
    return "Reciente";
  }

  const diffMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60_000));
  if (diffMinutes < 1) {
    return "Ahora";
  }
  if (diffMinutes < 60) {
    return `Hace ${diffMinutes} min`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `Hace ${diffHours} h`;
  }

  return `Hace ${Math.round(diffHours / 24)} d`;
}

export function formatDateTime(value?: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    return "Sin fecha";
  }

  return timestamp.toLocaleString("es-CO", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatCurrency(value?: number | null, currency: "COP" | "USD" = "COP") {
  if (currency === "COP") {
    const formatted = new Intl.NumberFormat("es-CO", {
      currency: "COP",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
      style: "currency",
    }).format(value ?? 0);
    return `${formatted} COP`;
  }
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(value ?? 0);
}

export function formatDurationMs(value?: number | null) {
  const totalMs = Math.max(0, value ?? 0);
  if (totalMs < 1000) {
    return `${totalMs} ms`;
  }

  const totalSeconds = Math.round(totalMs / 1000);
  if (totalSeconds < 60) {
    return `${totalSeconds} s`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

export function getStatusTone(status: string): StatusTone {
  const normalized = status.trim().toLowerCase();
  if (["approved", "complete", "compliant", "configured", "healthy", "ok", "ready", "resolved"].includes(normalized)) {
    return "green" as const;
  }
  if (["degraded", "draft", "needs_review", "partial", "pending", "warning"].includes(normalized)) {
    return "orange" as const;
  }
  if (["blocked", "critical", "down", "failed", "rejected"].includes(normalized)) {
    return "red" as const;
  }
  if (["active", "info", "informational"].includes(normalized)) {
    return "blue" as const;
  }
  return "slate" as const;
}

export function getArtifactTitle(item: ArtifactRecordEntry) {
  return item.artifact_title.trim() || item.artifact_key.trim() || "Artefacto sin titulo";
}

export function buildMonitoringSummary(
  workspace: MonitoringWorkspace,
  calibration: EstimationCalibrationDashboard | null,
) {
  const currentMetrics = workspace.current_metrics;
  const history = [...workspace.history].slice(0, 8).reverse();
  const activeAlerts = workspace.alerts.filter((item) => item.status !== "resolved");
  const severityCounts = activeAlerts.reduce(
    (accumulator, alert) => {
      const severity = alert.severity.trim().toLowerCase();
      if (CRITICAL_SEVERITIES.has(severity)) {
        accumulator.critical += 1;
      } else if (WARNING_SEVERITIES.has(severity)) {
        accumulator.warning += 1;
      } else {
        accumulator.info += 1;
      }
      return accumulator;
    },
    { critical: 0, info: 0, warning: 0 },
  );

  return {
    activeAlerts,
    calibrationCoverage: calibration?.coverage_percent ?? 0,
    currentMetrics,
    errorCount: currentMetrics?.error_count ?? 0,
    exportCount: currentMetrics?.export_count ?? 0,
    latestScoreLabel:
      currentMetrics?.latest_evaluation_score !== null && currentMetrics?.latest_evaluation_score !== undefined
        ? `${currentMetrics.latest_evaluation_score}/100`
        : "Sin score",
    pendingApprovals: currentMetrics?.approvals_pending ?? 0,
    severityCounts,
    stagePrecision: (calibration?.precision_by_stage ?? []).map((item) => ({
      label: item.maturity_stage.replaceAll("_", " "),
      value: item.band_hit_rate,
    })),
    trendSeries: {
      artifacts: history.map((item) => item.artifact_count),
      errors: history.map((item) => item.error_count),
      evaluation: history.map((item) => item.latest_evaluation_score ?? 0),
      warnings: history.map((item) => item.warning_count),
    },
  };
}

export function buildReleaseObservabilitySummary(workspace: MonitoringWorkspace) {
  const report = workspace.release_observability;
  const failingGates = (report?.release_gates ?? []).filter((item) => item.status !== "pass");
  const topProvider = (report?.providers ?? [])[0] ?? null;
  const mostUsedStage = [...(report?.stages ?? [])].sort((left, right) => right.run_count - left.run_count)[0] ?? null;

  return {
    averageCompactionRatio: report?.average_compaction_ratio ?? 0,
    authIsolationErrors: report?.auth_or_isolation_error_count ?? 0,
    contextFingerprintCoverage: report?.context_fingerprint_coverage ?? 0,
    estimatedCostUsd: report?.estimated_cost_usd ?? 0,
    failingGateCount: failingGates.length,
    fallbackRate: report?.fallback_rate ?? 0,
    projectActualsCount: report?.project_actuals_count ?? 0,
    releaseGates: report?.release_gates ?? [],
    report,
    simulationPassRate: report?.simulation_pass_rate ?? 0,
    sourceVersionCoverage: report?.source_version_coverage ?? 0,
    topProvider,
    topProviderLabel: topProvider
      ? `${topProvider.provider_key} · ${topProvider.model_name}`
      : "Sin provider dominante",
    totalLlmRuns: report?.total_llm_runs ?? 0,
    totalTokens: report?.total_tokens ?? 0,
    mostUsedStage: mostUsedStage?.label ?? "Sin etapa dominante",
  };
}

export function buildLibrarySummary(items: ArtifactRecordEntry[]) {
  const artifactKinds = new Set(items.map((item) => item.artifact_kind).filter(Boolean));
  const artifactStages = new Set(items.map((item) => item.stage).filter(Boolean));
  const versions = new Set(items.map((item) => item.blueprint_version_number).filter((value) => value !== null && value !== undefined));
  const latestCreatedAt = items.reduce<string | null>((latest, item) => {
    if (!latest || new Date(item.created_at).getTime() > new Date(latest).getTime()) {
      return item.created_at;
    }
    return latest;
  }, null);

  return {
    artifactKinds,
    artifactStages,
    latestCreatedAt,
    totalArtifacts: items.length,
    versionCount: versions.size,
  };
}

export function buildLibraryQueryParams(filters: {
  artifact_kind?: string;
  blueprint_version_number?: number | null;
  date_from?: string;
  date_to?: string;
  q?: string;
  stage?: string;
}) {
  return {
    artifact_kind: filters.artifact_kind?.trim() || "",
    blueprint_version_number: filters.blueprint_version_number ?? null,
    date_from: filters.date_from?.trim() || "",
    date_to: filters.date_to?.trim() || "",
    q: filters.q?.trim() || "",
    stage: filters.stage?.trim() || "",
  };
}

export function buildIntegrationsSummary(
  integrations: IntegrationStatusEntry[],
  catalogs: CatalogSummaryEntry[],
) {
  const configuredCount = integrations.filter((item) => item.configured).length;
  const reachableCount = integrations.filter((item) => item.reachable).length;
  const degradedCount = integrations.filter((item) => getStatusTone(item.status) !== "green").length;
  const lastCheckedAt = integrations.reduce<string | null>((latest, item) => {
    if (!latest || new Date(item.checked_at).getTime() > new Date(latest).getTime()) {
      return item.checked_at;
    }
    return latest;
  }, null);
  const catalogCards = catalogs.map((item) => ({
    activeCount: item.active_count,
    catalogKey: item.catalog_key,
    itemCount: item.item_count,
    label: item.catalog_key.replaceAll("_", " "),
    version: item.version,
  }));

  return {
    catalogCards,
    configuredCount,
    degradedCount,
    lastCheckedAt,
    reachableCount,
    totalIntegrations: integrations.length,
  };
}

export function buildFeatureFlagSummary(flags: FeatureFlagEntry[]) {
  const enabledCount = flags.filter((item) => item.enabled).length;
  return {
    enabledCount,
    totalCount: flags.length,
  };
}

export const defaultAntigravityConfig: AntigravityProviderConfig = {
  auth_mode: "auto",
  available: false,
  effort: "high",
  executable: "agy",
  executable_found: false,
  fallback_models: [],
  health_status: "local_runtime_missing",
  last_rotated_at: null,
  max_concurrency: 1,
  model: "gemini-3.6-flash",
  primary_agents: [],
  runner_id: "local-antigravity-cli",
  secret_source: "local_runtime",
  shadow_agents: [],
  staged_agents: [],
  status_note: "",
  timeout_ms: 1200000,
};

export function buildRuntimeDraft(runtime: LLMRuntimeSettings): LLMRuntimeSettingsUpdateRequest {
  const agy = runtime.antigravity_cli ?? runtime.antigravity ?? defaultAntigravityConfig;
  return {
    active_provider: runtime.active_provider,
    agent_execution_backend: runtime.agent_execution_backend,
    antigravity_cli: {
      auth_mode: agy.auth_mode ?? "auto",
      effort: agy.effort ?? "high",
      executable: agy.executable ?? "agy",
      fallback_models: [...(agy.fallback_models ?? [])],
      max_concurrency: agy.max_concurrency ?? 1,
      model: agy.model ?? "gemini-3.6-flash",
      primary_agents: [...(agy.primary_agents ?? [])],
      runner_id: agy.runner_id ?? "local-antigravity-cli",
      shadow_agents: [...(agy.shadow_agents ?? [])],
      staged_agents: [...(agy.staged_agents ?? [])],
      timeout_ms: agy.timeout_ms ?? 1200000,
    },
    codex_local: {
      auth_mode: runtime.codex_local.auth_mode,
      command: runtime.codex_local.command,
      cost_policy: runtime.codex_local.cost_policy,
      fallback_models: [...runtime.codex_local.fallback_models],
      max_concurrency: runtime.codex_local.max_concurrency,
      model: runtime.codex_local.model,
      primary_agents: [...runtime.codex_local.primary_agents],
      profile: runtime.codex_local.profile,
      runner_id: runtime.codex_local.runner_id,
      shadow_agents: [...runtime.codex_local.shadow_agents],
      staged_agents: [...runtime.codex_local.staged_agents],
      timeout_ms: runtime.codex_local.timeout_ms,
    },
    deepseek: {
      base_url: runtime.deepseek.base_url,
      fast_model: runtime.deepseek.fast_model,
      reasoning_effort: runtime.deepseek.reasoning_effort,
      reasoning_model: runtime.deepseek.reasoning_model,
    },
    knowledge_access_backend: runtime.knowledge_access_backend,
    openai: {
      fast_model: runtime.openai.fast_model,
      reasoning_effort: runtime.openai.reasoning_effort,
      reasoning_model: runtime.openai.reasoning_model,
    },
    uses_platform_credentials: runtime.uses_platform_credentials,
  };
}

export function getRuntimeFieldOrigin(runtime: Pick<LLMRuntimeSettings, "field_origins">, fieldPath: string) {
  return runtime.field_origins[fieldPath] === "override" ? "override" : "default";
}

export function getRuntimeFieldOriginLabel(
  runtime: Pick<LLMRuntimeSettings, "field_origins">,
  fieldPath: string,
  t?: TranslationFunction,
) {
  const origin = getRuntimeFieldOrigin(runtime, fieldPath);
  if (t) {
    return origin === "override" ? t("origin.override", "Override workspace") : t("origin.default", "Default plataforma");
  }
  return origin === "override" ? "Override workspace" : "Default plataforma";
}

export function getSecretSourceLabel(source: string, t?: TranslationFunction) {
  if (t) {
    switch (source) {
      case "workspace_managed":
        return t("secretSource.workspace_managed", "Workspace activo");
      case "workspace_staged":
        return t("secretSource.workspace_staged", "Workspace staged");
      case "platform_managed":
        return t("secretSource.platform_managed", "Plataforma");
      case "local_runtime":
        return t("secretSource.local_runtime", "Runtime local");
      default:
        return source || t("secretSource.undefined", "No definido");
    }
  }
  switch (source) {
    case "workspace_managed":
      return "Workspace activo";
    case "workspace_staged":
      return "Workspace staged";
    case "platform_managed":
      return "Plataforma";
    case "local_runtime":
      return "Runtime local";
    default:
      return source || "No definido";
  }
}

export function getAgentExecutionBackendCopy(value: AgentExecutionBackend, t?: TranslationFunction) {
  if (t) {
    switch (value) {
      case "codex_cli":
        return {
          description: t("agentBackend.codex_cli.desc", "Permite promover capacidades concretas a Codex o usarlo como backend gobernado desde settings."),
          label: t("agentBackend.codex_cli.label", "Codex runtime gobernado"),
        };
      case "shadow_codex_cli":
        return {
          description: t("agentBackend.shadow_codex_cli.desc", "Mantiene el provider activo y deja a Codex en sombra para validacion o rescate lateral."),
          label: t("agentBackend.shadow_codex_cli.label", "Shadow con Codex"),
        };
      default:
        return {
          description: t("agentBackend.provider_native.desc", "Cada provider resuelve su propia ejecucion sin routing lateral por Codex."),
          label: t("agentBackend.provider_native.label", "Nativo por provider"),
        };
    }
  }
  switch (value) {
    case "codex_cli":
      return {
        description: "Permite promover capacidades concretas a Codex o usarlo como backend gobernado desde settings.",
        label: "Codex runtime gobernado",
      };
    case "shadow_codex_cli":
      return {
        description: "Mantiene el provider activo y deja a Codex en sombra para validacion o rescate lateral.",
        label: "Shadow con Codex",
      };
    default:
      return {
        description: "Cada provider resuelve su propia ejecucion sin routing lateral por Codex.",
        label: "Nativo por provider",
      };
  }
}

export function getKnowledgeAccessBackendCopy(value: KnowledgeAccessBackend, t?: TranslationFunction) {
  if (t) {
    switch (value) {
      case "workspace_staged":
        return {
          description: t("knowledgeBackend.workspace_staged.desc", "Las corridas preparan contexto staged en workspace para ejecucion reproducible."),
          label: t("knowledgeBackend.workspace_staged.label", "Workspace staged"),
        };
      case "hybrid":
        return {
          description: t("knowledgeBackend.hybrid.desc", "Combina contexto inline con staging cuando la capacidad o el runtime lo requieren."),
          label: t("knowledgeBackend.hybrid.label", "Hibrido"),
        };
      default:
        return {
          description: t("knowledgeBackend.inline_context.desc", "El contexto se pasa inline sin staging adicional."),
          label: t("knowledgeBackend.inline_context.label", "Inline context"),
        };
    }
  }
  switch (value) {
    case "workspace_staged":
      return {
        description: "Las corridas preparan contexto staged en workspace para ejecucion reproducible.",
        label: "Workspace staged",
      };
    case "hybrid":
      return {
        description: "Combina contexto inline con staging cuando la capacidad o el runtime lo requieren.",
        label: "Hibrido",
      };
    default:
      return {
        description: "El contexto se pasa inline sin staging adicional.",
        label: "Inline context",
      };
  }
}

export function buildCodexRolloutSummary(config: Pick<CodexLocalProviderConfig, "primary_agents" | "shadow_agents" | "staged_agents">) {
  const groups = [
    {
      description: "Capacidades promovidas a Codex como path principal.",
      key: "primary" as const,
      label: "Primary",
      values: [...config.primary_agents],
    },
    {
      description: "Capacidades en corrida paralela o rescate lateral.",
      key: "shadow" as const,
      label: "Shadow",
      values: [...config.shadow_agents],
    },
    {
      description: "Capacidades reservadas para rollout controlado.",
      key: "staged" as const,
      label: "Staged",
      values: [...config.staged_agents],
    },
  ];

  return {
    groups: groups.map((group) => ({
      ...group,
      count: group.values.length,
      preview: group.values.length > 0 ? group.values.join(", ") : "Sin capacidades configuradas",
    })),
    hasRollout: groups.some((group) => group.values.length > 0),
    totalCount: groups.reduce((total, group) => total + group.values.length, 0),
  };
}

export function buildCodexRuntimeSummary(
  runtime: LLMRuntimeSettings,
  runtimeStatus: RuntimeStatusResponse | null,
): CodexRuntimeSummary {
  const rollout = buildCodexRolloutSummary(runtime.codex_local);
  const lastKnownResult = runtimeStatus?.last_known_result ?? null;
  const lastKnownStatus = (lastKnownResult?.status ?? "").trim().toLowerCase();
  const readinessTone =
    runtimeStatus?.smoke_ready === true ? "green" : runtimeStatus ? getStatusTone(runtimeStatus.status) : runtime.codex_local.available ? "orange" : "slate";
  const authTone =
    runtimeStatus?.auth_detected === true ? "green" : runtimeStatus ? "red" : runtime.codex_local.auth_mode === "auto" ? "orange" : "slate";
  const binaryTone =
    runtimeStatus?.available === true ? "green" : runtimeStatus ? "red" : runtime.codex_local.executable_found ? "green" : "orange";
  const lastRunTone =
    lastKnownStatus === "succeeded" ? "green" : lastKnownStatus ? getStatusTone(lastKnownStatus) : "slate";

  return {
    auth: {
      detail: runtimeStatus
        ? runtimeStatus.auth_detected
          ? `Modo ${runtimeStatus.auth_mode} detectado`
          : `Sin auth utilizable para ${runtimeStatus.auth_mode}`
        : runtime.codex_local.auth_mode,
      label: runtimeStatus?.auth_detected ? "Auth detectada" : "Auth pendiente",
      tone: authTone,
    },
    binary: {
      detail: runtimeStatus?.executable || runtime.codex_local.command,
      label: runtimeStatus?.available ? "Binario resuelto" : "Resolver binario",
      tone: binaryTone,
    },
    blockingReasons: runtimeStatus?.smoke_blocking_reasons ?? [],
    lastKnownResult,
    lastRun: {
      detail: lastKnownResult?.finished_at ? formatRelativeTime(lastKnownResult.finished_at) : "Sin corrida registrada",
      label: lastKnownStatus === "succeeded" ? "Ultima corrida OK" : lastKnownStatus ? "Ultima corrida con incidente" : "Sin corrida",
      tone: lastRunTone,
    },
    readiness: {
      detail: runtimeStatus?.recommended_check ?? runtime.codex_local.status_note ?? "Configura y verifica el runtime Codex.",
      label: runtimeStatus?.smoke_ready ? "Runtime listo" : runtimeStatus ? "Readiness bloqueado" : "Runtime sin verificar",
      tone: readinessTone,
    },
    rollout,
  };
}

export function validateRuntimeSettingsForm(draft: LLMRuntimeSettingsUpdateRequest) {
  const errors: Partial<Record<string, string>> = {};
  const rolloutSummary = buildCodexRolloutSummary(draft.codex_local);
  const requiresCodexRuntime =
    draft.active_provider === "codex_local" ||
    draft.agent_execution_backend !== "provider_native" ||
    rolloutSummary.hasRollout;

  if (!draft.active_provider) {
    errors.active_provider = "Selecciona un proveedor activo.";
  }
  if (!draft.agent_execution_backend.trim()) {
    errors.agent_execution_backend = "Define el backend de ejecucion agentica.";
  }
  if (!draft.knowledge_access_backend.trim()) {
    errors.knowledge_access_backend = "Define el backend de acceso a conocimiento.";
  }
  if (draft.agent_execution_backend === "provider_native" && rolloutSummary.hasRollout) {
    errors.agent_execution_backend = "Activa codex_cli o shadow_codex_cli para usar rollout por capacidades.";
  }

  if (draft.active_provider === "openai") {
    if (!draft.openai.fast_model.trim()) {
      errors.openai_fast_model = "Define el fast model de OpenAI.";
    }
    if (!draft.openai.reasoning_model.trim()) {
      errors.openai_reasoning_model = "Define el reasoning model de OpenAI.";
    }
  }

  if (draft.active_provider === "deepseek") {
    if (!draft.deepseek.base_url.trim()) {
      errors.deepseek_base_url = "La base URL de DeepSeek es obligatoria.";
    } else {
      try {
        new URL(draft.deepseek.base_url);
      } catch {
        errors.deepseek_base_url = "La base URL de DeepSeek debe ser valida.";
      }
    }

    if (!draft.deepseek.fast_model.trim()) {
      errors.deepseek_fast_model = "Define el fast model de DeepSeek.";
    }
    if (!draft.deepseek.reasoning_model.trim()) {
      errors.deepseek_reasoning_model = "Define el reasoning model de DeepSeek.";
    }
  }

  if (requiresCodexRuntime) {
    if (!draft.codex_local.command.trim()) {
      errors.codex_local_command = "Define el comando local de Codex.";
    }
    if (!draft.codex_local.model.trim()) {
      errors.codex_local_model = "Define el modelo local de Codex.";
    }
    if (!draft.codex_local.runner_id.trim()) {
      errors.codex_local_runner_id = "Define el runner id de Codex.";
    }
    if (draft.codex_local.timeout_ms < 1000) {
      errors.codex_local_timeout_ms = "El timeout de Codex debe ser de al menos 1000 ms.";
    }
    if (draft.codex_local.max_concurrency < 1) {
      errors.codex_local_max_concurrency = "La concurrencia maxima de Codex debe ser al menos 1.";
    }
    if (draft.codex_local.auth_mode === "profile" && !draft.codex_local.profile.trim()) {
      errors.codex_local_profile = "Si auth_mode es profile, define tambien el profile de Codex.";
    }
  }

  if (draft.active_provider === "antigravity_cli") {
    const agy = draft.antigravity_cli ?? defaultAntigravityConfig;
    if (!agy.executable.trim()) {
      errors.antigravity_cli_executable = "Define el comando local de Antigravity CLI.";
    }
    if (!agy.model.trim()) {
      errors.antigravity_cli_model = "Define el modelo de Antigravity CLI.";
    }
    if (!agy.runner_id.trim()) {
      errors.antigravity_cli_runner_id = "Define el runner id de Antigravity CLI.";
    }
    if (agy.timeout_ms < 1000) {
      errors.antigravity_cli_timeout_ms = "El timeout debe ser de al menos 1000 ms.";
    }
    if (agy.max_concurrency < 1) {
      errors.antigravity_cli_max_concurrency = "La concurrencia maxima debe ser al menos 1.";
    }
  }

  return errors;
}
