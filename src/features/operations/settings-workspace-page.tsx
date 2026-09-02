"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  Copy,
  KeyRound,
  Layers3,
  LockKeyhole,
  RefreshCcw,
  RotateCcw,
  Save,
  ServerCog,
  ShieldCheck,
  TestTube2,
} from "lucide-react";
import { AppButton, Badge, KeyValue, Panel, SelectField, StatRow, TextAreaField, TextField } from "@/components/lean/ui";
import { FinOpsBudgetPanel } from "@/features/finops/finops-budget-panel";
import { PlatformBasePricesAdminPanel } from "@/features/operations/settings-commerce-panels";
import { SettingsHotmartPanel } from "@/features/operations/settings-hotmart-panel";
import { PlanAccessAdminPanel } from "@/features/productization/plan-access-page";
import {
  SettingsScopeHeader,
  UserCurrencyPreferencePanel,
  UserLanguagePreferencePanel,
  UserPrivacyConsentsPanel,
} from "@/features/operations/settings-general-panels";
import {
  AdminSettingsConsoleShell,
} from "@/features/operations/components/settings-admin-console-shell";
import { SettingsWorkspaceActions } from "@/features/operations/settings-workspace-actions";
import {
  buildSettingsHref,
} from "@/features/operations/settings-admin-routing";
import {
  type AdminConfigTabKey,
  type AdminSettingsSectionKey,
  type ProductGovernanceTabKey,
} from "@/features/operations/settings-admin-navigation";
import { useSettingsConfigNavigation } from "@/features/operations/use-settings-config-navigation";
import { ApiError } from "@/core/api/errors";
import { useAuth } from "@/core/auth/auth-context";
import { useLanguage } from "@/core/i18n/language-context";
import { hasPlatformAdminRole, type WorkspaceRole } from "@/core/auth/types";
import { byLanguage } from "@/features/product-experience/core/localized-copy";
import { cn } from "@/lib/utils";
import {
  runtimeApi,
  type RuntimePropagationMode,
  type RuntimePropagationRunResponse,
  type RuntimeStatusResponse,
} from "@/core/system/runtime-api";
import {
  buildCodexRolloutSummary,
  buildCodexRuntimeSummary,
  buildFeatureFlagSummary,
  buildRuntimeDraft,
  defaultAntigravityConfig,
  formatCommaSeparatedValues,
  formatDateTime,
  formatDurationMs,
  getAgentExecutionBackendCopy,
  getKnowledgeAccessBackendCopy,
  getRuntimeFieldOriginLabel,
  getSecretSourceLabel,
  parseCommaSeparatedValues,
  validateRuntimeSettingsForm,
} from "@/features/operations/operations-adapter";
import { OperationsModuleShell } from "@/features/operations/operations-module-shell";
import { useOperationalSession } from "@/features/operations/use-operational-session";
import { getSessionProjectRoute } from "@/features/sessions/session-routes";
import type {
  EstimationCalibrationDashboard,
  FeatureFlagEntry,
  LLMProviderKey,
  LLMRuntimeSettings,
  LLMRuntimeSettingsUpdateRequest,
  PlatformProviderSecretResponse,
  PlatformRuntimeProviderResponse,
  RuntimeProviderReleaseStage,
  WorkspaceProviderSecretUpsertRequest,
  WorkspaceRuntimeHealthResponse,
} from "@/features/sessions/session-contracts";
import {
  getPlatformAdminWorkspaces,
  type PlatformAdminWorkspaceSummary,
} from "@/features/platform-admin/platform-admin-api";
import { EmptyState, ErrorState, LoadingState } from "@/shared/states/runtime-states";

type AsyncState<TData> = {
  data: TData | null;
  error: string | null;
  status: "error" | "idle" | "loading" | "ready";
};

type FeedbackState = {
  message: string;
  tone: "error" | "info" | "success";
};

type SecretDraftMap = Record<LLMProviderKey, WorkspaceProviderSecretUpsertRequest>;
type SecretPendingMap = Partial<Record<LLMProviderKey, boolean>>;
type SettingsWorkspacePageProps = {
  initialConfigSubTab?: string;
  initialConfigTab?: AdminConfigTabKey;
  initialProductGovernanceTab?: ProductGovernanceTabKey;
  initialSection?: AdminSettingsSectionKey;
};
type PlatformProviderDraftMap = Record<
  LLMProviderKey,
  {
    allowed_auth_modes_text: string;
    allowed_models_text: string;
    is_enabled: boolean;
    label: string;
    release_stage: RuntimeProviderReleaseStage;
    supports_platform_managed_credentials: boolean;
    supports_workspace_secrets: boolean;
  }
>;

const PROVIDER_ORDER: LLMProviderKey[] = ["openai", "deepseek", "codex_local", "antigravity_cli"];
function createIdleState<TData>(): AsyncState<TData> {
  return {
    data: null,
    error: null,
    status: "idle",
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function hasRuntimeDraftChanges(
  current: LLMRuntimeSettings | null,
  draft: LLMRuntimeSettingsUpdateRequest | null,
) {
  if (!current || !draft) {
    return false;
  }
  return JSON.stringify(buildRuntimeDraft(current)) !== JSON.stringify(draft);
}

function isForbidden(error: unknown) {
  return error instanceof ApiError && error.status === 403;
}

function parseIntegerField(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return 0;
  }
  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getFeedbackToneClass(tone: FeedbackState["tone"]) {
  if (tone === "success") {
    return "text-[var(--success)]";
  }
  if (tone === "error") {
    return "text-[var(--danger)]";
  }
  return "text-[var(--text-secondary)]";
}

function getBadgeTone(status: string) {
  const normalized = status.trim().toLowerCase();
  if (
    normalized.includes("ready") ||
    normalized.includes("healthy") ||
    normalized === "configured" ||
    normalized === "ok" ||
    normalized === "general_availability"
  ) {
    return "green" as const;
  }
  if (
    normalized.includes("warning") ||
    normalized.includes("degraded") ||
    normalized.includes("pending") ||
    normalized.includes("preview")
  ) {
    return "orange" as const;
  }
  if (
    normalized.includes("missing") ||
    normalized.includes("invalid") ||
    normalized.includes("blocked") ||
    normalized.includes("deprecated") ||
    normalized.includes("error")
  ) {
    return "red" as const;
  }
  if (normalized.includes("workspace") || normalized.includes("platform") || normalized.includes("active")) {
    return "blue" as const;
  }
  return "slate" as const;
}

function getWorkspaceRoleLabel(role: WorkspaceRole | null, language: "es" | "en" | "pt" = "es") {
  if (!role) {
    return byLanguage(language, {
      en: "No membership",
      es: "Sin membresia",
      pt: "Sem vinculacao",
    });
  }
  switch (role) {
    case "owner":
      return "Owner";
    case "admin":
      return "Admin";
    case "editor":
      return byLanguage(language, { en: "Editor", es: "Editor", pt: "Editor" });
    default:
      return byLanguage(language, { en: "Viewer", es: "Visualizador", pt: "Visualizador" });
  }
}

function supportsWorkspaceSecrets(providerKey: LLMProviderKey) {
  return providerKey === "openai" || providerKey === "deepseek";
}

function supportsPlatformSecrets(providerKey: LLMProviderKey) {
  return providerKey === "openai" || providerKey === "deepseek";
}

function getProviderLabel(providerKey: LLMProviderKey) {
  switch (providerKey) {
    case "openai":
      return "OpenAI";
    case "deepseek":
      return "DeepSeek";
    case "antigravity_cli":
      return "Antigravity CLI";
    default:
      return "Codex CLI";
  }
}

function getProviderDescription(providerKey: LLMProviderKey) {
  switch (providerKey) {
    case "openai":
      return "Modelos SaaS, reasoning effort y secreto API del workspace.";
    case "deepseek":
      return "Base URL, modelos y aislamiento de secreto compatible.";
    case "antigravity_cli":
      return "Runtime local Antigravity con ejecutable, modelo y concurrencia.";
    default:
      return "Runtime local Codex CLI con autenticacion y fallback models.";
  }
}

function getProviderPrimaryConfig(runtimeDraft: LLMRuntimeSettingsUpdateRequest, providerKey: LLMProviderKey) {
  if (providerKey === "openai") {
    return runtimeDraft.openai.fast_model || "Sin fast model";
  }
  if (providerKey === "deepseek") {
    return runtimeDraft.deepseek.fast_model || "Sin fast model";
  }
  if (providerKey === "antigravity_cli") {
    const agyDraft = runtimeDraft.antigravity_cli ?? defaultAntigravityConfig;
    return agyDraft.model || "Sin modelo";
  }
  return runtimeDraft.codex_local.model || "Sin modelo";
}

function getProviderSecondaryConfig(runtimeDraft: LLMRuntimeSettingsUpdateRequest, providerKey: LLMProviderKey) {
  if (providerKey === "openai") {
    return `reasoning: ${runtimeDraft.openai.reasoning_model || "n/a"}`;
  }
  if (providerKey === "deepseek") {
    return runtimeDraft.deepseek.base_url || "Sin base URL";
  }
  if (providerKey === "antigravity_cli") {
    const agyDraft = runtimeDraft.antigravity_cli ?? defaultAntigravityConfig;
    return agyDraft.executable || "Sin executable";
  }
  return runtimeDraft.codex_local.command || "Sin command";
}

function createSecretDrafts(runtime: LLMRuntimeSettings): SecretDraftMap {
  return {
    openai: {
      activate_for_runtime: runtime.active_provider === "openai",
      secret_kind: "api_key",
      secret_ref: "",
      secret_value: "",
    },
    deepseek: {
      activate_for_runtime: runtime.active_provider === "deepseek",
      secret_kind: "api_key",
      secret_ref: "",
      secret_value: "",
    },
    codex_local: {
      activate_for_runtime: false,
      secret_kind: "api_key",
      secret_ref: "",
      secret_value: "",
    },
    antigravity_cli: {
      activate_for_runtime: false,
      secret_kind: "api_key",
      secret_ref: "",
      secret_value: "",
    },
  };
}

function createPlatformSecretDrafts(activeProvider: LLMProviderKey = "openai"): SecretDraftMap {
  return {
    antigravity_cli: {
      activate_for_runtime: false,
      secret_kind: "api_key",
      secret_ref: "",
      secret_value: "",
    },
    codex_local: {
      activate_for_runtime: false,
      secret_kind: "api_key",
      secret_ref: "",
      secret_value: "",
    },
    deepseek: {
      activate_for_runtime: activeProvider === "deepseek",
      secret_kind: "api_key",
      secret_ref: "",
      secret_value: "",
    },
    openai: {
      activate_for_runtime: activeProvider === "openai",
      secret_kind: "api_key",
      secret_ref: "",
      secret_value: "",
    },
  };
}

function createPlatformProviderDrafts(providers: PlatformRuntimeProviderResponse[]): PlatformProviderDraftMap {
  const entries = providers.map((provider) => [
    provider.provider_key,
    {
      allowed_auth_modes_text: formatCommaSeparatedValues(provider.allowed_auth_modes),
      allowed_models_text: formatCommaSeparatedValues(provider.allowed_models),
      is_enabled: provider.is_enabled,
      label: provider.label,
      release_stage: provider.release_stage,
      supports_platform_managed_credentials: provider.supports_platform_managed_credentials,
      supports_workspace_secrets: provider.supports_workspace_secrets,
    },
  ]);

  return Object.fromEntries(entries) as PlatformProviderDraftMap;
}

function getProviderSecretSnapshot(runtime: LLMRuntimeSettings, providerKey: LLMProviderKey) {
  switch (providerKey) {
    case "openai":
      return runtime.openai;
    case "deepseek":
      return runtime.deepseek;
    case "antigravity_cli":
      return runtime.antigravity_cli ?? runtime.antigravity ?? defaultAntigravityConfig;
    default:
      return runtime.codex_local;
  }
}

function providerHasOverrides(runtime: LLMRuntimeSettings, providerKey: LLMProviderKey) {
  return Object.entries(runtime.field_origins).some(([fieldPath, origin]) => fieldPath.startsWith(`${providerKey}.`) && origin === "override");
}

export function SettingsWorkspacePage({
  initialConfigSubTab,
  initialConfigTab,
  initialProductGovernanceTab,
  initialSection,
}: SettingsWorkspacePageProps = {}) {
  const router = useRouter();
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const isPlatformAdmin = hasPlatformAdminRole(user);
  const activeWorkspaceId = user?.active_workspace_id ?? null;
  const activeMembership = user?.workspaces.find((workspace) => workspace.workspace_id === activeWorkspaceId) ?? null;
  const workspaceRole = activeMembership?.role ?? null;
  const resolvedInitialConfigTab = isPlatformAdmin ? (initialConfigTab ?? "llmRuntime") : "general";
  const {
    createSession,
    getEstimationCalibration,
    getRuntimeSettings,
    items,
    listError,
    listStatus,
    patchFeatureFlag,
    patchRuntimeSettings,
    selectedSession,
    selectedSnapshot,
    selectOperationalSession,
  } = useOperationalSession({
    requireSnapshot: true,
  });

  const [runtimeState, setRuntimeState] = useState<AsyncState<LLMRuntimeSettings>>(createIdleState);
  const [workspaceHealthState, setWorkspaceHealthState] = useState<AsyncState<WorkspaceRuntimeHealthResponse>>(createIdleState);
  const [runtimeStatusState, setRuntimeStatusState] = useState<AsyncState<RuntimeStatusResponse>>(createIdleState);
  const [calibrationState, setCalibrationState] = useState<AsyncState<EstimationCalibrationDashboard | null>>(createIdleState);
  const [platformProvidersState, setPlatformProvidersState] = useState<AsyncState<PlatformRuntimeProviderResponse[] | null>>(createIdleState);
  const [platformDefaultsState, setPlatformDefaultsState] = useState<AsyncState<LLMRuntimeSettings | null>>(createIdleState);
  const [platformAuditState, setPlatformAuditState] = useState<AsyncState<Array<Record<string, unknown>> | null>>(createIdleState);

  const [runtimeDraft, setRuntimeDraft] = useState<LLMRuntimeSettingsUpdateRequest | null>(null);
  const [runtimeErrors, setRuntimeErrors] = useState<Partial<Record<string, string>>>({});
  const [runtimeFeedback, setRuntimeFeedback] = useState<FeedbackState | null>(null);
  const [runtimeSavePending, setRuntimeSavePending] = useState(false);
  const [runtimeResetPending, setRuntimeResetPending] = useState(false);
  const [workspaceHealthPending, setWorkspaceHealthPending] = useState(false);

  const [platformDefaultsDraft, setPlatformDefaultsDraft] = useState<LLMRuntimeSettingsUpdateRequest | null>(null);
  const [platformDefaultsErrors, setPlatformDefaultsErrors] = useState<Partial<Record<string, string>>>({});
  const [platformFeedback, setPlatformFeedback] = useState<FeedbackState | null>(null);
  const [platformDefaultsPending, setPlatformDefaultsPending] = useState(false);
  const [platformProviderDrafts, setPlatformProviderDrafts] = useState<PlatformProviderDraftMap | null>(null);
  const [platformProviderPending, setPlatformProviderPending] = useState<SecretPendingMap>({});
  const [platformWorkspacesState, setPlatformWorkspacesState] = useState<AsyncState<PlatformAdminWorkspaceSummary[] | null>>(createIdleState);
  const [runtimePropagationPending, setRuntimePropagationPending] = useState<RuntimePropagationMode | null>(null);
  const [runtimePropagationPreview, setRuntimePropagationPreview] = useState<RuntimePropagationRunResponse | null>(null);
  const [selectedPropagationWorkspaceIds, setSelectedPropagationWorkspaceIds] = useState<string[]>([]);
  const [platformSecretsState, setPlatformSecretsState] = useState<AsyncState<Record<LLMProviderKey, PlatformProviderSecretResponse> | null>>(createIdleState);
  const [platformSecretDrafts, setPlatformSecretDrafts] = useState<SecretDraftMap | null>(null);
  const [platformSecretPending, setPlatformSecretPending] = useState<SecretPendingMap>({});
  const [selectedPlatformSecretProvider, setSelectedPlatformSecretProvider] = useState<LLMProviderKey>("openai");

  const [secretDrafts, setSecretDrafts] = useState<SecretDraftMap | null>(null);
  const [secretPending, setSecretPending] = useState<SecretPendingMap>({});
  const [secretFeedback, setSecretFeedback] = useState<FeedbackState | null>(null);
  const [expandedWorkspaceProvider, setExpandedWorkspaceProvider] = useState<LLMProviderKey | null>(PROVIDER_ORDER[0] ?? null);
  const [expandedSecretProvider, setExpandedSecretProvider] = useState<LLMProviderKey | null>(PROVIDER_ORDER[0] ?? null);
  const [workspaceRuntimeExpanded, setWorkspaceRuntimeExpanded] = useState(false);
  const [memoryRolloutExpanded, setMemoryRolloutExpanded] = useState(false);
  const [expandedMemoryStage, setExpandedMemoryStage] = useState<string | null>(null);
  const [sessionControlsExpanded, setSessionControlsExpanded] = useState(false);
  const [expandedFeatureFlag, setExpandedFeatureFlag] = useState<string | null>(null);
  const [expandedDiagnosticPanel, setExpandedDiagnosticPanel] = useState<"codex-cli" | "workspace-health" | null>(null);
  const [runtimeStatusRefreshPending, setRuntimeStatusRefreshPending] = useState(false);
  const [smokeCommandFeedback, setSmokeCommandFeedback] = useState<string | null>(null);

  const [flagPending, setFlagPending] = useState<Record<string, boolean>>({});
  const [flagErrors, setFlagErrors] = useState<Record<string, string>>({});
  const [expandedPlatformProvider, setExpandedPlatformProvider] = useState<LLMProviderKey | null>(PROVIDER_ORDER[0] ?? null);
  const [expandedPlatformAuditEntry, setExpandedPlatformAuditEntry] = useState<string | null>(null);

  const sessionOptions = items.map((item) => ({
    label: item.title,
    value: item.id,
  }));
  const featureFlags = selectedSnapshot?.workspace_contract?.feature_flags ?? [];
  const featureFlagSummary = buildFeatureFlagSummary(featureFlags);
  const isPlatformPanelVisible = Boolean(platformProvidersState.data && platformDefaultsState.data);
  const canManageWorkspaceRuntime = isPlatformAdmin;
  const {
    activeConfigSubTab,
    activeConfigSubTabs,
    activeConfigTab,
    activeScope,
    configSubTabs,
    handleConfigSubTabChange,
    handleConfigTabChange,
    setActiveConfigSubTabs,
    setActiveConfigTab,
  } = useSettingsConfigNavigation({
    initialConfigSubTab,
    initialConfigTab: resolvedInitialConfigTab,
    isPlatformPanelVisible: isPlatformAdmin,
  });

  const loadPlatformPanel = useCallback(async () => {
    if (!isPlatformAdmin) {
      setPlatformProvidersState({ data: null, error: null, status: "ready" });
      setPlatformDefaultsState({ data: null, error: null, status: "ready" });
      setPlatformAuditState({ data: null, error: null, status: "ready" });
      setPlatformWorkspacesState({ data: null, error: null, status: "ready" });
      setPlatformSecretsState({ data: null, error: null, status: "ready" });
      setPlatformDefaultsDraft(null);
      setPlatformProviderDrafts(null);
      setPlatformSecretDrafts(null);
      setSelectedPropagationWorkspaceIds([]);
      return;
    }
    setPlatformProvidersState({ data: null, error: null, status: "loading" });
    setPlatformDefaultsState({ data: null, error: null, status: "loading" });
    setPlatformAuditState({ data: null, error: null, status: "loading" });
    setPlatformWorkspacesState({ data: null, error: null, status: "loading" });
    setPlatformSecretsState({ data: null, error: null, status: "loading" });

    const [providersResult, defaultsResult, auditResult, workspacesResult, secretsResult] = await Promise.allSettled([
      runtimeApi.listPlatformProviders(),
      runtimeApi.getPlatformDefaults(),
      runtimeApi.getPlatformAudit(12),
      getPlatformAdminWorkspaces(100),
      Promise.all(PROVIDER_ORDER.map(async (providerKey) => [providerKey, await runtimeApi.getPlatformSecret(providerKey)] as const)),
    ]);

    if (providersResult.status === "fulfilled") {
      setPlatformProvidersState({ data: providersResult.value, error: null, status: "ready" });
      setPlatformProviderDrafts(createPlatformProviderDrafts(providersResult.value));
    } else if (isForbidden(providersResult.reason)) {
      setPlatformProvidersState({ data: null, error: null, status: "ready" });
      setPlatformProviderDrafts(null);
    } else {
      setPlatformProvidersState({
        data: null,
        error: getErrorMessage(providersResult.reason, "No se pudo cargar el registry de providers."),
        status: "error",
      });
      setPlatformProviderDrafts(null);
    }

    if (defaultsResult.status === "fulfilled") {
      setPlatformDefaultsState({ data: defaultsResult.value, error: null, status: "ready" });
      setPlatformDefaultsDraft(buildRuntimeDraft(defaultsResult.value));
    } else if (isForbidden(defaultsResult.reason)) {
      setPlatformDefaultsState({ data: null, error: null, status: "ready" });
      setPlatformDefaultsDraft(null);
    } else {
      setPlatformDefaultsState({
        data: null,
        error: getErrorMessage(defaultsResult.reason, "No se pudo cargar el baseline de plataforma."),
        status: "error",
      });
      setPlatformDefaultsDraft(null);
    }

    if (auditResult.status === "fulfilled") {
      setPlatformAuditState({
        data: auditResult.value.items,
        error: null,
        status: "ready",
      });
    } else if (isForbidden(auditResult.reason)) {
      setPlatformAuditState({ data: null, error: null, status: "ready" });
    } else {
      setPlatformAuditState({
        data: null,
        error: getErrorMessage(auditResult.reason, "No se pudo cargar la auditoria de plataforma."),
        status: "error",
      });
    }

    if (workspacesResult.status === "fulfilled") {
      setPlatformWorkspacesState({ data: workspacesResult.value.workspaces, error: null, status: "ready" });
      setSelectedPropagationWorkspaceIds((current) =>
        current.filter((workspaceId) => workspacesResult.value.workspaces.some((workspace) => workspace.id === workspaceId)),
      );
    } else if (isForbidden(workspacesResult.reason)) {
      setPlatformWorkspacesState({ data: null, error: null, status: "ready" });
      setSelectedPropagationWorkspaceIds([]);
    } else {
      setPlatformWorkspacesState({
        data: null,
        error: getErrorMessage(workspacesResult.reason, "No se pudo cargar workspaces para propagacion."),
        status: "error",
      });
    }

    if (secretsResult.status === "fulfilled") {
      setPlatformSecretsState({
        data: Object.fromEntries(secretsResult.value) as Record<LLMProviderKey, PlatformProviderSecretResponse>,
        error: null,
        status: "ready",
      });
      setPlatformSecretDrafts(
        createPlatformSecretDrafts(defaultsResult.status === "fulfilled" ? defaultsResult.value.active_provider : "openai"),
      );
    } else if (isForbidden(secretsResult.reason)) {
      setPlatformSecretsState({ data: null, error: null, status: "ready" });
      setPlatformSecretDrafts(null);
    } else {
      setPlatformSecretsState({
        data: null,
        error: getErrorMessage(secretsResult.reason, "No se pudo cargar secretos globales de plataforma."),
        status: "error",
      });
      setPlatformSecretDrafts(null);
    }
  }, [isPlatformAdmin]);

  const loadWorkspacePanel = useCallback(
    async (options?: { keepRuntime?: boolean; keepStatus?: boolean }) => {
      if (!isPlatformAdmin) {
        setRuntimeState({ data: null, error: null, status: "ready" });
        setWorkspaceHealthState({ data: null, error: null, status: "ready" });
        setRuntimeStatusState({ data: null, error: null, status: "ready" });
        setCalibrationState({ data: null, error: null, status: "ready" });
        setRuntimeDraft(null);
        setSecretDrafts(null);
        return;
      }
      setRuntimeState((current) => ({
        data: options?.keepRuntime ? current.data : null,
        error: null,
        status: options?.keepRuntime && current.data ? "ready" : "loading",
      }));
      setWorkspaceHealthState((current) => ({
        data: current.data,
        error: null,
        status: current.data ? "ready" : "loading",
      }));
      setRuntimeStatusState((current) => ({
        data: options?.keepStatus ? current.data : null,
        error: null,
        status: options?.keepStatus && current.data ? "ready" : "loading",
      }));
      setCalibrationState((current) => ({
        data: current.data,
        error: null,
        status: current.data ? "ready" : "loading",
      }));

      const [runtimeResult, calibrationResult, healthResult, statusResult] = await Promise.allSettled([
        getRuntimeSettings(),
        getEstimationCalibration(),
        runtimeApi.getWorkspaceRuntimeHealth(),
        runtimeApi.status(),
      ]);

      if (runtimeResult.status === "fulfilled") {
        setRuntimeState({ data: runtimeResult.value, error: null, status: "ready" });
        setRuntimeDraft(buildRuntimeDraft(runtimeResult.value));
        setSecretDrafts(createSecretDrafts(runtimeResult.value));
      } else {
        setRuntimeState({
          data: null,
          error: getErrorMessage(runtimeResult.reason, "No se pudo cargar el runtime del workspace."),
          status: "error",
        });
      }

      if (calibrationResult.status === "fulfilled") {
        setCalibrationState({ data: calibrationResult.value, error: null, status: "ready" });
      } else {
        const message = getErrorMessage(calibrationResult.reason, "La calibracion no esta disponible.");
        if (message.toLowerCase().includes("feature flag")) {
          setCalibrationState({ data: null, error: null, status: "ready" });
        } else {
          setCalibrationState({ data: null, error: message, status: "error" });
        }
      }

      if (healthResult.status === "fulfilled") {
        setWorkspaceHealthState({ data: healthResult.value, error: null, status: "ready" });
      } else if (isForbidden(healthResult.reason)) {
        setWorkspaceHealthState({ data: null, error: null, status: "ready" });
      } else {
        setWorkspaceHealthState({
          data: null,
          error: getErrorMessage(healthResult.reason, "No se pudo cargar la salud operativa del workspace."),
          status: "error",
        });
      }

      if (statusResult.status === "fulfilled") {
        setRuntimeStatusState({ data: statusResult.value, error: null, status: "ready" });
      } else if (isForbidden(statusResult.reason)) {
        setRuntimeStatusState({ data: null, error: null, status: "ready" });
      } else {
        setRuntimeStatusState({
          data: null,
          error: getErrorMessage(statusResult.reason, "No se pudo cargar el diagnostico de plataforma."),
          status: "error",
        });
      }
    },
    [getEstimationCalibration, getRuntimeSettings, isPlatformAdmin],
  );

  useEffect(() => {
    void loadWorkspacePanel();
    void loadPlatformPanel();
  }, [activeWorkspaceId, loadPlatformPanel, loadWorkspacePanel]);

  async function handleCreateSession() {
    const created = await createSession();
    router.push(getSessionProjectRoute(created));
  }

  async function handleSaveRuntime() {
    if (!runtimeDraft) {
      return;
    }

    const errors = validateRuntimeSettingsForm(runtimeDraft);
    setRuntimeErrors(errors);
    setRuntimeFeedback(null);
    setSecretFeedback(null);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setRuntimeSavePending(true);
    try {
      const saved = await patchRuntimeSettings(runtimeDraft);
      setRuntimeState({ data: saved, error: null, status: "ready" });
      setRuntimeDraft(buildRuntimeDraft(saved));
      setSecretDrafts(createSecretDrafts(saved));
      setRuntimeFeedback({
        message: "Runtime efectivo del workspace actualizado.",
        tone: "success",
      });
      await loadWorkspacePanel({ keepRuntime: true, keepStatus: true });
    } catch (error) {
      setRuntimeFeedback({
        message: getErrorMessage(error, "No se pudo guardar el runtime del workspace."),
        tone: "error",
      });
    } finally {
      setRuntimeSavePending(false);
    }
  }

  async function handleResetRuntime() {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        "Vas a restaurar el runtime del workspace al baseline de plataforma. Se perderan overrides locales de provider, backend y modelos. ¿Continuar?",
      );
      if (!confirmed) {
        return;
      }
    }

    setRuntimeResetPending(true);
    setRuntimeFeedback(null);
    try {
      const resetRuntime = await runtimeApi.resetWorkspaceRuntime();
      setRuntimeState({ data: resetRuntime, error: null, status: "ready" });
      setRuntimeDraft(buildRuntimeDraft(resetRuntime));
      setSecretDrafts(createSecretDrafts(resetRuntime));
      setRuntimeErrors({});
      setRuntimeFeedback({
        message: "El workspace volvio al baseline de plataforma.",
        tone: "success",
      });
      await loadWorkspacePanel({ keepRuntime: true, keepStatus: true });
    } catch (error) {
      setRuntimeFeedback({
        message: getErrorMessage(error, "No se pudo resetear el runtime del workspace."),
        tone: "error",
      });
    } finally {
      setRuntimeResetPending(false);
    }
  }

  async function handleRefreshWorkspaceHealth(mode: "health" | "test") {
    setWorkspaceHealthPending(true);
    setRuntimeFeedback(null);
    try {
      const response = mode === "test" ? await runtimeApi.testWorkspaceRuntime() : await runtimeApi.getWorkspaceRuntimeHealth();
      setWorkspaceHealthState({ data: response, error: null, status: "ready" });
      setRuntimeFeedback({
        message: mode === "test" ? "Conectividad validada contra el runtime efectivo." : "Salud del workspace actualizada.",
        tone: "info",
      });
    } catch (error) {
      setRuntimeFeedback({
        message: getErrorMessage(error, "No se pudo consultar la salud del workspace."),
        tone: "error",
      });
    } finally {
      setWorkspaceHealthPending(false);
    }
  }

  async function handleCopySmokeCommand() {
    const smokeCommand = runtimeStatusState.data?.smoke_command?.trim();
    if (!smokeCommand) {
      setSmokeCommandFeedback("No hay smoke command disponible.");
      return;
    }
    if (!window.navigator?.clipboard) {
      setSmokeCommandFeedback("El portapapeles no esta disponible en este navegador.");
      return;
    }

    try {
      await window.navigator.clipboard.writeText(smokeCommand);
      setSmokeCommandFeedback("Smoke command copiado al portapapeles.");
    } catch {
      setSmokeCommandFeedback("No se pudo copiar el smoke command.");
    }
  }

  async function handleRefreshPlatformStatus() {
    setRuntimeStatusRefreshPending(true);
    setRuntimeFeedback(null);
    try {
      const status = await runtimeApi.status();
      setRuntimeStatusState({ data: status, error: null, status: "ready" });
      setRuntimeFeedback({
        message: "Diagnostico de plataforma actualizado.",
        tone: "info",
      });
    } catch (error) {
      setRuntimeFeedback({
        message: getErrorMessage(error, "No se pudo actualizar el diagnostico de plataforma."),
        tone: "error",
      });
    } finally {
      setRuntimeStatusRefreshPending(false);
    }
  }

  async function handleToggleFlag(flag: FeatureFlagEntry) {
    if (!selectedSession) {
      return;
    }

    setFlagPending((current) => ({ ...current, [flag.key]: true }));
    setFlagErrors((current) => ({ ...current, [flag.key]: "" }));

    try {
      await patchFeatureFlag(selectedSession.id, flag.key, {
        enabled: !flag.enabled,
      });
    } catch (error) {
      setFlagErrors((current) => ({
        ...current,
        [flag.key]: error instanceof Error ? error.message : "No se pudo actualizar el feature flag.",
      }));
    } finally {
      setFlagPending((current) => ({ ...current, [flag.key]: false }));
    }
  }

  async function handleWorkspaceSecretAction(providerKey: LLMProviderKey, mode: "delete" | "rotate" | "upsert") {
    if (!secretDrafts) {
      return;
    }

    const draft = secretDrafts[providerKey];
    if ((mode === "delete" || mode === "rotate") && typeof window !== "undefined") {
      const actionLabel = mode === "delete" ? "limpiar" : "rotar";
      const confirmed = window.confirm(
        `Vas a ${actionLabel} el secreto de ${getProviderLabel(providerKey)} para este workspace. Esta accion puede afectar la ejecucion de LLM hasta que exista una credencial valida. ¿Continuar?`,
      );
      if (!confirmed) {
        return;
      }
    }

    setSecretPending((current) => ({ ...current, [providerKey]: true }));
    setSecretFeedback(null);

    try {
      if (mode === "delete") {
        await runtimeApi.deleteWorkspaceSecret(providerKey);
      } else if (mode === "rotate") {
        await runtimeApi.rotateWorkspaceSecret(providerKey, draft);
      } else {
        await runtimeApi.upsertWorkspaceSecret(providerKey, draft);
      }

      setSecretDrafts((current) =>
        current
          ? {
              ...current,
              [providerKey]: {
                ...current[providerKey],
                secret_ref: "",
                secret_value: "",
              },
            }
          : current,
      );
      setSecretFeedback({
        message:
          mode === "delete"
            ? `${getProviderLabel(providerKey)} volvio a usar el baseline disponible.`
            : `${getProviderLabel(providerKey)} actualizo su material secreto del workspace.`,
        tone: "success",
      });
      await loadWorkspacePanel({ keepRuntime: true, keepStatus: true });
    } catch (error) {
      setSecretFeedback({
        message: getErrorMessage(error, `No se pudo actualizar el secreto de ${getProviderLabel(providerKey)}.`),
        tone: "error",
      });
    } finally {
      setSecretPending((current) => ({ ...current, [providerKey]: false }));
    }
  }

  async function handlePlatformSecretAction(providerKey: LLMProviderKey, mode: "delete" | "rotate" | "upsert") {
    if (!platformSecretDrafts) {
      return;
    }

    const draft = platformSecretDrafts[providerKey];
    if (mode !== "delete" && !draft.secret_value.trim() && !draft.secret_ref.trim()) {
      setSecretFeedback({
        message: `Ingresa secret_value o secret_ref global para ${getProviderLabel(providerKey)}.`,
        tone: "error",
      });
      return;
    }

    const actionLabel = mode === "delete" ? "limpiar" : mode === "rotate" ? "rotar" : "guardar";
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        `Vas a ${actionLabel} el secreto global de plataforma para ${getProviderLabel(providerKey)}. Este cambio afecta a todos los workspaces que heredan credenciales de plataforma. ¿Continuar?`,
      );
      if (!confirmed) {
        return;
      }
    }

    setPlatformSecretPending((current) => ({ ...current, [providerKey]: true }));
    setSecretFeedback(null);

    try {
      if (mode === "delete") {
        await runtimeApi.deletePlatformSecret(providerKey);
      } else if (mode === "rotate") {
        await runtimeApi.rotatePlatformSecret(providerKey, draft);
      } else {
        await runtimeApi.upsertPlatformSecret(providerKey, draft);
      }

      setPlatformSecretDrafts((current) =>
        current
          ? {
              ...current,
              [providerKey]: {
                ...current[providerKey],
                secret_ref: "",
                secret_value: "",
              },
            }
          : current,
      );
      setSecretFeedback({
        message:
          mode === "delete"
            ? `${getProviderLabel(providerKey)} dejo de tener secreto global de plataforma configurado.`
            : `${getProviderLabel(providerKey)} actualizo su secreto global de plataforma.`,
        tone: "success",
      });
      await loadPlatformPanel();
      await loadWorkspacePanel({ keepRuntime: true, keepStatus: true });
    } catch (error) {
      setSecretFeedback({
        message: getErrorMessage(error, `No se pudo actualizar el secreto global de ${getProviderLabel(providerKey)}.`),
        tone: "error",
      });
    } finally {
      setPlatformSecretPending((current) => ({ ...current, [providerKey]: false }));
    }
  }

  async function handleSavePlatformDefaults() {
    if (!platformDefaultsDraft) {
      return;
    }

    const errors = validateRuntimeSettingsForm(platformDefaultsDraft);
    setPlatformDefaultsErrors(errors);
    setPlatformFeedback(null);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setPlatformDefaultsPending(true);
    try {
      await runtimeApi.updatePlatformDefaults(platformDefaultsDraft);
      setPlatformFeedback({
        message: "Baseline de plataforma actualizado.",
        tone: "success",
      });
      await loadPlatformPanel();
      await loadWorkspacePanel({ keepRuntime: true, keepStatus: true });
    } catch (error) {
      setPlatformFeedback({
        message: getErrorMessage(error, "No se pudo actualizar el baseline de plataforma."),
        tone: "error",
      });
    } finally {
      setPlatformDefaultsPending(false);
    }
  }

  async function handleSaveAndPropagatePlatformDefaults(mode: RuntimePropagationMode, dryRun: boolean) {
    if (!platformDefaultsDraft) {
      return;
    }

    const errors = validateRuntimeSettingsForm(platformDefaultsDraft);
    setPlatformDefaultsErrors(errors);
    setPlatformFeedback(null);
    if (Object.keys(errors).length > 0) {
      return;
    }
    if (mode === "reset_to_platform" && selectedPropagationWorkspaceIds.length === 0) {
      setPlatformFeedback({
        message: "Selecciona al menos un workspace antes de resetear overrides a plataforma.",
        tone: "error",
      });
      return;
    }

    setRuntimePropagationPending(mode);
    setRuntimePropagationPreview(null);
    try {
      const saved = await runtimeApi.updatePlatformDefaults(platformDefaultsDraft);
      const payload = buildRuntimeDraft(saved);
      const response = await runtimeApi.propagatePlatformDefaults({
        dry_run: dryRun,
        mode,
        payload,
        workspace_ids: mode === "reset_to_platform" ? selectedPropagationWorkspaceIds : undefined,
      });
      setRuntimePropagationPreview(response);
      setPlatformFeedback({
        message: dryRun
          ? `Preview listo: ${response.planned_count} planificados, ${response.skipped_count} omitidos.`
          : `Propagacion aplicada: ${response.applied_count} aplicados, ${response.skipped_count} omitidos, ${response.failed_count} fallidos.`,
        tone: response.failed_count > 0 ? "error" : "success",
      });
      await loadPlatformPanel();
      await loadWorkspacePanel({ keepRuntime: true, keepStatus: true });
    } catch (error) {
      setPlatformFeedback({
        message: getErrorMessage(error, "No se pudo ejecutar la propagacion del runtime."),
        tone: "error",
      });
    } finally {
      setRuntimePropagationPending(null);
    }
  }

  async function handleSavePlatformProvider(providerKey: LLMProviderKey) {
    if (!platformProviderDrafts) {
      return;
    }

    const providerDraft = platformProviderDrafts[providerKey];
    setPlatformProviderPending((current) => ({ ...current, [providerKey]: true }));
    setPlatformFeedback(null);

    try {
      await runtimeApi.updatePlatformProvider(providerKey, {
        allowed_auth_modes: parseCommaSeparatedValues(providerDraft.allowed_auth_modes_text),
        allowed_models: parseCommaSeparatedValues(providerDraft.allowed_models_text),
        is_enabled: providerDraft.is_enabled,
        label: providerDraft.label,
        release_stage: providerDraft.release_stage,
        supports_platform_managed_credentials: providerDraft.supports_platform_managed_credentials,
        supports_workspace_secrets: providerDraft.supports_workspace_secrets,
      });
      setPlatformFeedback({
        message: `Registry de ${getProviderLabel(providerKey)} actualizado.`,
        tone: "success",
      });
      await loadPlatformPanel();
    } catch (error) {
      setPlatformFeedback({
        message: getErrorMessage(error, `No se pudo actualizar el registry de ${getProviderLabel(providerKey)}.`),
        tone: "error",
      });
    } finally {
      setPlatformProviderPending((current) => ({ ...current, [providerKey]: false }));
    }
  }

  const runtime = runtimeState.data;
  const runtimeStatus = runtimeStatusState.data;
  const runtimeHealth = workspaceHealthState.data;
  const runtimeHasChanges = hasRuntimeDraftChanges(runtime, runtimeDraft);
  const platformDefaultsHasChanges = hasRuntimeDraftChanges(platformDefaultsState.data, platformDefaultsDraft);
  const platformWorkspaces = platformWorkspacesState.data ?? [];
  const selectedProvider = runtimeDraft?.active_provider ?? runtime?.active_provider ?? "openai";
  const platformSecretView = platformSecretsState.data?.[selectedPlatformSecretProvider] ?? null;
  const platformSecretDraft = platformSecretDrafts?.[selectedPlatformSecretProvider] ?? null;
  const platformSecretSupports =
    platformSecretView?.supports_platform_managed_credentials ?? supportsPlatformSecrets(selectedPlatformSecretProvider);
  const platformSecretBusy = Boolean(platformSecretPending[selectedPlatformSecretProvider]);
  const executionBackendCopy = getAgentExecutionBackendCopy(runtimeDraft?.agent_execution_backend ?? "provider_native", t);
  const knowledgeBackendCopy = getKnowledgeAccessBackendCopy(runtimeDraft?.knowledge_access_backend ?? "inline_context", t);
  const rolloutSummary = runtimeDraft ? buildCodexRolloutSummary(runtimeDraft.codex_local) : null;
  const codexRuntimeSummary = runtime ? buildCodexRuntimeSummary(runtime, runtimeStatus) : null;
  const workspaceHealthStatusLabel =
    workspaceHealthState.status === "loading" && !runtimeHealth
      ? "Validando"
      : workspaceHealthState.error
        ? "Error"
        : runtimeHealth
          ? runtimeHealth.overall_status
          : canManageWorkspaceRuntime
            ? "Pendiente"
            : "Restringido";
  const workspaceHealthStatusTone =
    workspaceHealthState.error
      ? "red"
      : runtimeHealth
        ? getBadgeTone(runtimeHealth.overall_status)
        : workspaceHealthState.status === "loading"
          ? "orange"
          : canManageWorkspaceRuntime
            ? "slate"
            : "orange";
  const codexDiagnosticStatusLabel =
    runtimeStatusState.status === "loading" && !runtimeStatus
      ? "Leyendo"
      : runtimeStatusState.error
        ? "Error"
        : codexRuntimeSummary?.readiness.label ?? "Oculto";
  const codexDiagnosticStatusTone =
    runtimeStatusState.error
      ? "red"
      : runtimeStatusState.status === "loading" && !runtimeStatus
        ? "orange"
        : codexRuntimeSummary?.readiness.tone ?? "slate";
  const memoryRollout = runtime?.memory_rollout ?? null;
  const getFieldOriginLabel = (fieldPath: string) => (runtime ? getRuntimeFieldOriginLabel(runtime, fieldPath, t) : "");
  const getSecretLabel = (source: string) => getSecretSourceLabel(source, t);
  const copy = (en: string, es: string, pt: string) => byLanguage(language, { en, es, pt });
  const isHotmartConfigActive = activeConfigTab === "commerce" && activeConfigSubTab === "hotmart";
  const showWorkspaceRuntimePanel = activeConfigTab === "llmRuntime" && activeConfigSubTab === "runtime";
  const showWorkspaceProviderPanels = activeConfigTab === "llmRuntime" && activeConfigSubTab === "providers";
  const showWorkspaceBackendsPanel =
    (activeConfigTab === "llmRuntime" && activeConfigSubTab === "backends") ||
    (activeConfigTab === "commerce" && (activeConfigSubTab === "budgets" || activeConfigSubTab === "alerts")) ||
    (activeConfigTab === "governance" && activeConfigSubTab === "flags");
  const showWorkspaceSecretsPanel = activeConfigTab === "security" && activeConfigSubTab === "secrets";
  const showWorkspaceDiagnosticsPanel = activeConfigTab === "llmRuntime" && activeConfigSubTab === "diagnostics";
  const showPlatformGeneralPanel = activeConfigTab === "general" && activeConfigSubTab === "workspace";
  const showPlatformBasePricesPanel = activeConfigTab === "commerce" && activeConfigSubTab === "prices";
  const showPlatformRegistryPanel = activeConfigTab === "governance" && activeConfigSubTab === "registry";
  const showPlatformRuntimeAuditPanel = activeConfigTab === "governance" && activeConfigSubTab === "runtimeAudit";

  function renderWorkspaceProviderDetail(providerKey: LLMProviderKey) {
    if (!runtime || !runtimeDraft) {
      return null;
    }

    if (providerKey === "openai") {
      return (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(220px,320px)]">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <TextField
              label="Fast model"
              value={runtimeDraft.openai.fast_model}
              error={runtimeErrors.openai_fast_model}
              hint={getFieldOriginLabel("openai.fast_model")}
              onValueChange={(value) =>
                setRuntimeDraft((current) =>
                  current
                    ? {
                        ...current,
                        openai: {
                          ...current.openai,
                          fast_model: value,
                        },
                      }
                    : current,
                )
              }
            />
            <TextField
              label="Reasoning model"
              value={runtimeDraft.openai.reasoning_model}
              error={runtimeErrors.openai_reasoning_model}
              hint={getFieldOriginLabel("openai.reasoning_model")}
              onValueChange={(value) =>
                setRuntimeDraft((current) =>
                  current
                    ? {
                        ...current,
                        openai: {
                          ...current.openai,
                          reasoning_model: value,
                        },
                      }
                    : current,
                )
              }
            />
            <SelectField
              label="Reasoning effort"
              value={runtimeDraft.openai.reasoning_effort}
              hint={getFieldOriginLabel("openai.reasoning_effort")}
              options={[
                { label: "low", value: "low" },
                { label: "medium", value: "medium" },
                { label: "high", value: "high" },
              ]}
              onValueChange={(value) =>
                setRuntimeDraft((current) =>
                  current
                    ? {
                        ...current,
                        openai: {
                          ...current.openai,
                          reasoning_effort: value,
                        },
                      }
                    : current,
                )
              }
            />
          </div>
          <div className="space-y-2 rounded-[18px] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4">
            <StatRow label="Secret source" value={getSecretLabel(runtime.openai.secret_source)} tone={getBadgeTone(runtime.openai.secret_source)} />
            <StatRow label="Health" value={runtime.openai.health_status} tone={getBadgeTone(runtime.openai.health_status)} />
            <StatRow label="Ultima rotacion" value={formatDateTime(runtime.openai.last_rotated_at)} tone="slate" />
          </div>
        </div>
      );
    }

    if (providerKey === "deepseek") {
      return (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(220px,320px)]">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <TextField
              label="Base URL"
              value={runtimeDraft.deepseek.base_url}
              error={runtimeErrors.deepseek_base_url}
              hint={getFieldOriginLabel("deepseek.base_url")}
              onValueChange={(value) =>
                setRuntimeDraft((current) =>
                  current
                    ? {
                        ...current,
                        deepseek: {
                          ...current.deepseek,
                          base_url: value,
                        },
                      }
                    : current,
                )
              }
            />
            <TextField
              label="Fast model"
              value={runtimeDraft.deepseek.fast_model}
              error={runtimeErrors.deepseek_fast_model}
              hint={getFieldOriginLabel("deepseek.fast_model")}
              onValueChange={(value) =>
                setRuntimeDraft((current) =>
                  current
                    ? {
                        ...current,
                        deepseek: {
                          ...current.deepseek,
                          fast_model: value,
                        },
                      }
                    : current,
                )
              }
            />
            <TextField
              label="Reasoning model"
              value={runtimeDraft.deepseek.reasoning_model}
              error={runtimeErrors.deepseek_reasoning_model}
              hint={getFieldOriginLabel("deepseek.reasoning_model")}
              onValueChange={(value) =>
                setRuntimeDraft((current) =>
                  current
                    ? {
                        ...current,
                        deepseek: {
                          ...current.deepseek,
                          reasoning_model: value,
                        },
                      }
                    : current,
                )
              }
            />
            <SelectField
              label="Reasoning effort"
              value={runtimeDraft.deepseek.reasoning_effort}
              hint={getFieldOriginLabel("deepseek.reasoning_effort")}
              options={[
                { label: "low", value: "low" },
                { label: "medium", value: "medium" },
                { label: "high", value: "high" },
              ]}
              onValueChange={(value) =>
                setRuntimeDraft((current) =>
                  current
                    ? {
                        ...current,
                        deepseek: {
                          ...current.deepseek,
                          reasoning_effort: value,
                        },
                      }
                    : current,
                )
              }
            />
          </div>
          <div className="space-y-2 rounded-[18px] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4">
            <StatRow label="Secret source" value={getSecretLabel(runtime.deepseek.secret_source)} tone={getBadgeTone(runtime.deepseek.secret_source)} />
            <StatRow label="Health" value={runtime.deepseek.health_status} tone={getBadgeTone(runtime.deepseek.health_status)} />
            <StatRow label="Ultima rotacion" value={formatDateTime(runtime.deepseek.last_rotated_at)} tone="slate" />
          </div>
        </div>
      );
    }

    if (providerKey === "codex_local") {
      return (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(220px,320px)]">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <TextField
              label="Command"
              value={runtimeDraft.codex_local.command}
              error={runtimeErrors.codex_local_command}
              hint={getFieldOriginLabel("codex_local.command")}
              onValueChange={(value) =>
                setRuntimeDraft((current) =>
                  current
                    ? {
                        ...current,
                        codex_local: {
                          ...current.codex_local,
                          command: value,
                        },
                      }
                    : current,
                )
              }
            />
            <TextField
              label="Model"
              value={runtimeDraft.codex_local.model}
              error={runtimeErrors.codex_local_model}
              hint={getFieldOriginLabel("codex_local.model")}
              onValueChange={(value) =>
                setRuntimeDraft((current) =>
                  current
                    ? {
                        ...current,
                        codex_local: {
                          ...current.codex_local,
                          model: value,
                        },
                      }
                    : current,
                )
              }
            />
            <TextField
              label="Runner ID"
              value={runtimeDraft.codex_local.runner_id}
              error={runtimeErrors.codex_local_runner_id}
              hint={getFieldOriginLabel("codex_local.runner_id")}
              onValueChange={(value) =>
                setRuntimeDraft((current) =>
                  current
                    ? {
                        ...current,
                        codex_local: {
                          ...current.codex_local,
                          runner_id: value,
                        },
                      }
                    : current,
                )
              }
            />
            <SelectField
              label="Auth mode"
              value={runtimeDraft.codex_local.auth_mode}
              hint={getFieldOriginLabel("codex_local.auth_mode")}
              options={[
                { label: "auto", value: "auto" },
                { label: "api_key", value: "api_key" },
                { label: "access_token", value: "access_token" },
                { label: "chatgpt_session", value: "chatgpt_session" },
                { label: "profile", value: "profile" },
              ]}
              onValueChange={(value) =>
                setRuntimeDraft((current) =>
                  current
                    ? {
                        ...current,
                        codex_local: {
                          ...current.codex_local,
                          auth_mode: value as LLMRuntimeSettingsUpdateRequest["codex_local"]["auth_mode"],
                        },
                      }
                    : current,
                )
              }
            />
            <TextField
              label="Timeout ms"
              value={String(runtimeDraft.codex_local.timeout_ms)}
              error={runtimeErrors.codex_local_timeout_ms}
              hint={getFieldOriginLabel("codex_local.timeout_ms")}
              onValueChange={(value) =>
                setRuntimeDraft((current) =>
                  current
                    ? {
                        ...current,
                        codex_local: {
                          ...current.codex_local,
                          timeout_ms: parseIntegerField(value),
                        },
                      }
                    : current,
                )
              }
            />
            <TextField
              label="Max concurrency"
              value={String(runtimeDraft.codex_local.max_concurrency)}
              error={runtimeErrors.codex_local_max_concurrency}
              hint={getFieldOriginLabel("codex_local.max_concurrency")}
              onValueChange={(value) =>
                setRuntimeDraft((current) =>
                  current
                    ? {
                        ...current,
                        codex_local: {
                          ...current.codex_local,
                          max_concurrency: parseIntegerField(value),
                        },
                      }
                    : current,
                )
              }
            />
            <TextAreaField
              className="md:col-span-2 xl:col-span-3"
              label="Fallback models (CSV)"
              value={formatCommaSeparatedValues(runtimeDraft.codex_local.fallback_models)}
              hint={getFieldOriginLabel("codex_local.fallback_models")}
              rows={3}
              onValueChange={(value) =>
                setRuntimeDraft((current) =>
                  current
                    ? {
                        ...current,
                        codex_local: {
                          ...current.codex_local,
                          fallback_models: parseCommaSeparatedValues(value),
                        },
                      }
                    : current,
                )
              }
            />
          </div>
          <div className="space-y-2 rounded-[18px] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4">
            <StatRow label="Readiness" value={codexRuntimeSummary?.readiness.label ?? runtime.codex_local.health_status} tone={codexRuntimeSummary?.readiness.tone ?? getBadgeTone(runtime.codex_local.health_status)} />
            <StatRow label="Secret source" value={getSecretLabel(runtime.codex_local.secret_source)} tone={getBadgeTone(runtime.codex_local.secret_source)} />
            <StatRow label="Timeout efectivo" value={formatDurationMs(runtimeStatus?.timeout_ms ?? runtimeDraft.codex_local.timeout_ms)} tone="blue" />
          </div>
        </div>
      );
    }

    const agyDraft = runtimeDraft.antigravity_cli ?? defaultAntigravityConfig;
    const agyRuntime = runtime.antigravity_cli ?? runtime.antigravity;
    return (
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(220px,320px)]">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <TextField
            label="Executable"
            value={agyDraft.executable}
            error={runtimeErrors.antigravity_cli_executable}
            hint={getFieldOriginLabel("antigravity_cli.executable")}
            onValueChange={(value) =>
              setRuntimeDraft((current) =>
                current
                  ? {
                      ...current,
                      antigravity_cli: {
                        ...defaultAntigravityConfig,
                        ...current.antigravity_cli,
                        executable: value,
                      },
                    }
                  : current,
              )
            }
          />
          <TextField
            label="Model"
            value={agyDraft.model}
            error={runtimeErrors.antigravity_cli_model}
            hint={getFieldOriginLabel("antigravity_cli.model")}
            onValueChange={(value) =>
              setRuntimeDraft((current) =>
                current
                  ? {
                      ...current,
                      antigravity_cli: {
                        ...defaultAntigravityConfig,
                        ...current.antigravity_cli,
                        model: value,
                      },
                    }
                  : current,
              )
            }
          />
          <TextField
            label="Runner ID"
            value={agyDraft.runner_id}
            error={runtimeErrors.antigravity_cli_runner_id}
            hint={getFieldOriginLabel("antigravity_cli.runner_id")}
            onValueChange={(value) =>
              setRuntimeDraft((current) =>
                current
                  ? {
                      ...current,
                      antigravity_cli: {
                        ...defaultAntigravityConfig,
                        ...current.antigravity_cli,
                        runner_id: value,
                      },
                    }
                  : current,
              )
            }
          />
          <SelectField
            label="Reasoning effort"
            value={agyDraft.effort}
            hint={getFieldOriginLabel("antigravity_cli.effort")}
            options={[
              { label: "low", value: "low" },
              { label: "medium", value: "medium" },
              { label: "high", value: "high" },
            ]}
            onValueChange={(value) =>
              setRuntimeDraft((current) =>
                current
                  ? {
                      ...current,
                      antigravity_cli: {
                        ...defaultAntigravityConfig,
                        ...current.antigravity_cli,
                        effort: value,
                      },
                    }
                  : current,
              )
            }
          />
          <TextField
            label="Timeout ms"
            value={String(agyDraft.timeout_ms)}
            error={runtimeErrors.antigravity_cli_timeout_ms}
            hint={getFieldOriginLabel("antigravity_cli.timeout_ms")}
            onValueChange={(value) =>
              setRuntimeDraft((current) =>
                current
                  ? {
                      ...current,
                      antigravity_cli: {
                        ...defaultAntigravityConfig,
                        ...current.antigravity_cli,
                        timeout_ms: parseIntegerField(value),
                      },
                    }
                  : current,
              )
            }
          />
          <TextField
            label="Max concurrency"
            value={String(agyDraft.max_concurrency)}
            error={runtimeErrors.antigravity_cli_max_concurrency}
            hint={getFieldOriginLabel("antigravity_cli.max_concurrency")}
            onValueChange={(value) =>
              setRuntimeDraft((current) =>
                current
                  ? {
                      ...current,
                      antigravity_cli: {
                        ...defaultAntigravityConfig,
                        ...current.antigravity_cli,
                        max_concurrency: parseIntegerField(value),
                      },
                    }
                  : current,
              )
            }
          />
          <TextAreaField
            className="md:col-span-2 xl:col-span-3"
            label="Fallback models (CSV)"
            value={formatCommaSeparatedValues(agyDraft.fallback_models)}
            hint={getFieldOriginLabel("antigravity_cli.fallback_models")}
            rows={3}
            onValueChange={(value) =>
              setRuntimeDraft((current) =>
                current
                  ? {
                      ...current,
                      antigravity_cli: {
                        ...defaultAntigravityConfig,
                        ...current.antigravity_cli,
                        fallback_models: parseCommaSeparatedValues(value),
                      },
                    }
                  : current,
              )
            }
          />
        </div>
        <div className="space-y-2 rounded-[18px] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4">
          <StatRow label="Readiness" value={agyRuntime?.executable_found ? t("status.executableFound", "Executable found") : t("status.notConfigured", "Not configured")} tone={agyRuntime?.executable_found ? "green" : "orange"} />
          <StatRow label="Available" value={agyRuntime?.available ? "Yes" : "No"} tone={agyRuntime?.available ? "green" : "orange"} />
        </div>
      </div>
    );
  }

  const requestedAdminSurface =
    (initialSection != null && initialSection !== "configuration") ||
    (initialConfigTab != null && initialConfigTab !== "general");

  const settingsActions = (
    <SettingsWorkspaceActions
      activeScope={activeScope}
      isHotmartConfigActive={isHotmartConfigActive}
      isPlatformPanelVisible={isPlatformPanelVisible}
      onCreateSession={() => void handleCreateSession()}
      onOpenSelectedProject={(session) => router.push(getSessionProjectRoute(session))}
      onRefreshPlatform={() => void loadPlatformPanel()}
      onRefreshWorkspace={() => void loadWorkspacePanel()}
      selectedSession={selectedSession}
      t={t}
    />
  );

  const standalonePersonalContent = (
    <div className="settings-center space-y-5">
      <section
        aria-label={copy("Account and access", "Cuenta y acceso", "Conta e acesso")}
        className="space-y-5"
        id="settings-panel-personal"
      >
        <SettingsScopeHeader
          accessLabel={t("settings.personalScopeLabel", "Ámbito personal")}
          description={t(
            "settings.personalScopeDesc",
            "Consulta quién eres dentro del producto, en qué workspace estás trabajando y qué nivel de acceso operativo tiene tu membresía.",
          )}
          eyebrow={copy("For you", "Para ti", "Para voce")}
          icon={<CircleUserRound aria-hidden="true" className="h-5 w-5" />}
          id="settings-personal-title"
          title={t("settings.scope.personal", "Cuenta y acceso")}
        />

        <div className="grid gap-4 lg:grid-cols-3">
          <Panel className="p-4">
            <KeyValue
              label={copy("User", "Usuario", "Usuario")}
              value={user?.full_name ?? copy("User", "Usuario", "Usuario")}
              hint={user?.email ?? copy("No email available", "Sin email disponible", "Sem email disponivel")}
            />
          </Panel>
          <Panel className="p-4">
            <KeyValue
              label={copy("Active workspace", "Workspace activo", "Workspace ativo")}
              value={user?.active_workspace_name ?? copy("No workspace", "Sin workspace", "Sem workspace")}
              hint={activeWorkspaceId ?? copy("No identifier", "Sin identificador", "Sem identificador")}
            />
          </Panel>
          <Panel className="p-4">
            <div className="flex items-start justify-between gap-3">
              <KeyValue
                label={copy("Membership", "Membresia", "Vinculacao")}
                value={getWorkspaceRoleLabel(workspaceRole, language)}
                hint={copy(
                  "Functional workspace access only.",
                  "Acceso funcional al workspace, sin consola administrativa.",
                  "Acesso funcional ao workspace, sem console administrativa.",
                )}
              />
              <Badge tone="slate">{copy("User", "Usuario", "Usuario")}</Badge>
            </div>
          </Panel>
        </div>

        {requestedAdminSurface ? (
          <Panel className="border-[var(--warning)]/25 bg-[var(--warning)]/5 p-5">
            <div className="flex items-start gap-3">
              <LockKeyhole aria-hidden="true" className="mt-0.5 h-5 w-5 text-[var(--warning)]" />
              <div>
                <p className="text-[16px] font-semibold text-[var(--text-primary)]">
                  {copy(
                    "Administrative console restricted",
                    "Consola administrativa restringida",
                    "Console administrativa restrita",
                  )}
                </p>
                <p className="mt-2 text-[13px] leading-6 text-[var(--text-secondary)]">
                  {copy(
                    "This account can keep using the workspace and project flow, but technical settings, Hotmart, runtime, FinOps and administrative reports require the global platform admin role.",
                    "Esta cuenta puede seguir usando el workspace y el flujo de proyectos, pero la configuración técnica, Hotmart, runtime, FinOps y los reportes administrativos requieren el rol global de platform admin.",
                    "Esta conta pode seguir usando o workspace e o fluxo de projetos, mas a configuracao tecnica, Hotmart, runtime, FinOps e os relatorios administrativos exigem o papel global de platform admin.",
                  )}
                </p>
              </div>
            </div>
          </Panel>
        ) : null}

        <PlanAccessAdminPanel compact showDetailLink />
        <UserCurrencyPreferencePanel />
        <UserLanguagePreferencePanel />
        <UserPrivacyConsentsPanel />
      </section>
    </div>
  );

  return (
    <OperationsModuleShell
      moduleLabel={t("nav.settings", "Configuración")}
      title={t("settings.centerTitle", "Centro de configuración")}
      description={t("settings.centerDesc", "Tus opciones personales y los controles administrativos viven en ámbitos separados. Elige un nivel para ver solo la configuración que corresponde a tu rol.")}
      sessionDescription={copy(
        "The active session is used for feature flag traceability; runtime is resolved by workspace even when no session is selected.",
        "La sesion activa se usa para trazabilidad de feature flags; el runtime se resuelve por workspace aunque no exista una sesion seleccionada.",
        "A sessao ativa e usada para rastreabilidade de feature flags; o runtime e resolvido por workspace mesmo quando nao ha sessao selecionada.",
      )}
      sessionOptions={sessionOptions}
      sessionValue={selectedSession?.id ?? null}
      selectedSession={selectedSession}
      showSessionContext={false}
      frameless
      onSessionChange={(value) => void selectOperationalSession(value)}
      actions={settingsActions}
    >
      {isPlatformAdmin ? (
      <AdminSettingsConsoleShell
        activeConfigTab={activeConfigTab}
        activeConfigSubTab={activeConfigSubTab}
        actions={settingsActions}
        configSubTabs={configSubTabs}
        configSubTabsByTab={activeConfigSubTabs}
        currentUser={user}
        featureFlagCount={featureFlags.length}
        initialProductGovernanceTab={initialProductGovernanceTab}
        initialSection={initialSection ?? "overview"}
        isPlatformAdmin={isPlatformAdmin}
        onConfigSubTabChange={handleConfigSubTabChange}
        onConfigTabChange={handleConfigTabChange}
        projectItems={items}
        providerLabel={runtimeHealth?.provider_label ?? runtime?.active_provider ?? "No disponible"}
        runtimeHealth={runtimeHealth?.overall_status ?? runtimeHealth?.health_status ?? "Pendiente"}
        workspaceId={activeWorkspaceId}
        workspaceName={user?.active_workspace_name ?? "Sin workspace"}
        workspaceRole={workspaceRole}
      >
        <div className="settings-center space-y-5">

      {isHotmartConfigActive ? (
        <SettingsHotmartPanel
          listError={listError}
          listStatus={listStatus}
          onCreateSession={() => void handleCreateSession()}
          onOpenIntegrations={() => {
            setActiveConfigTab("commerce");
            setActiveConfigSubTabs((current) => ({ ...current, commerce: "prices" }));
            router.replace(
              buildSettingsHref({
                configSubTab: "prices",
                configTab: "commerce",
                section: "configuration",
              }),
              { scroll: false },
            );
          }}
          onOpenProject={() => {
            if (selectedSession) {
              router.push(getSessionProjectRoute(selectedSession));
            }
          }}
          selectedSession={selectedSession}
          sessionOptions={sessionOptions}
          isPlatformAdmin={isPlatformAdmin}
          user={user}
        />
      ) : null}

      {!isHotmartConfigActive && activeScope === "personal" ? (
        <section aria-label={copy("Account and access", "Cuenta y acceso", "Conta e acesso")} className="space-y-5" id="settings-panel-personal" role="tabpanel">
          <SettingsScopeHeader
            accessLabel={t("settings.personalScopeLabel", "Ámbito personal")}
            description={t("settings.personalScopeDesc", "Consulta quién eres dentro del producto, en qué workspace estás trabajando y qué nivel de administración tiene tu membresía. Aquí no aparecen controles técnicos del runtime.")}
            eyebrow={copy("For you", "Para ti", "Para voce")}
            icon={<CircleUserRound aria-hidden="true" className="h-5 w-5" />}
            id="settings-personal-title"
            title={t("settings.scope.personal", "Cuenta y acceso")}
          />

          <div className="grid gap-4 lg:grid-cols-3">
            <Panel className="p-4">
              <KeyValue
                label={copy("User", "Usuario", "Usuario")}
                value={user?.full_name ?? copy("User", "Usuario", "Usuario")}
                hint={user?.email ?? copy("No email available", "Sin email disponible", "Sem email disponivel")}
              />
            </Panel>
            <Panel className="p-4">
              <KeyValue
                label={copy("Active workspace", "Workspace activo", "Workspace ativo")}
                value={user?.active_workspace_name ?? copy("No workspace", "Sin workspace", "Sem workspace")}
                hint={activeWorkspaceId ?? copy("No identifier", "Sin identificador", "Sem identificador")}
              />
            </Panel>
            <Panel className="p-4">
              <div className="flex items-start justify-between gap-3">
                <KeyValue
                  label={copy("Membership", "Membresia", "Vinculacao")}
                  value={getWorkspaceRoleLabel(workspaceRole, language)}
                  hint={canManageWorkspaceRuntime
                    ? copy("Includes workspace administration", "Incluye administracion del workspace", "Inclui administracao do workspace")
                    : copy("Product usage without technical controls", "Uso del producto sin controles tecnicos", "Uso do produto sem controles tecnicos")}
                />
                <Badge tone={canManageWorkspaceRuntime ? "blue" : "slate"}>
                  {canManageWorkspaceRuntime ? copy("Admin", "Admin", "Admin") : copy("User", "Usuario", "Usuario")}
                </Badge>
              </div>
            </Panel>
          </div>
          <PlanAccessAdminPanel compact showDetailLink />

          <UserCurrencyPreferencePanel />
          <UserLanguagePreferencePanel />
          <UserPrivacyConsentsPanel />

          <Panel className="border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-5">
            <div className="flex items-start gap-3">
              {canManageWorkspaceRuntime ? (
                <Building2 aria-hidden="true" className="mt-0.5 h-5 w-5 text-[var(--brand-primary)]" />
              ) : (
                <LockKeyhole aria-hidden="true" className="mt-0.5 h-5 w-5 text-[var(--text-muted)]" />
              )}
              <div>
                <p className="text-[14px] font-semibold text-[var(--text-primary)]">
                  {canManageWorkspaceRuntime
                    ? t("settings.manageWorkspaceTitle", "También administras este workspace")
                    : t("settings.adminProtectedTitle", "Los controles administrativos están protegidos")}
                </p>
                <p className="mt-1 text-[13px] leading-6 text-[var(--text-secondary)]">
                  {canManageWorkspaceRuntime
                    ? t("settings.manageWorkspaceDesc", "Usa el ámbito Workspace para configurar providers, credenciales, automatización y diagnóstico.")
                    : t("settings.adminProtectedDesc", "Tu experiencia se limita a cuenta y acceso. Un admin del workspace o platform admin gestiona providers, secretos y políticas técnicas.")}
                </p>
              </div>
            </div>
          </Panel>
        </section>
      ) : null}

      {!isHotmartConfigActive && activeScope === "workspace" && !canManageWorkspaceRuntime ? (
        <section aria-label={copy("Restricted workspace administration", "Administracion del workspace restringida", "Administracao restrita do workspace")} className="space-y-5" id="settings-panel-workspace" role="tabpanel">
          <SettingsScopeHeader
            accessLabel={t("settings.workspaceScopeRestrictedLabel", "Admin")}
            description={t("settings.workspaceScopeRestrictedDesc", "Este ámbito contiene configuración técnica que afecta a todas las personas del workspace. Tu membresía actual no permite modificarla.")}
            eyebrow={copy("Administration", "Administracion", "Administracao")}
            icon={<LockKeyhole aria-hidden="true" className="h-5 w-5" />}
            id="settings-workspace-restricted-title"
            title={t("settings.scope.workspace", "Workspace & LLM Runtime")}
          />
          <Panel className="p-5">
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[var(--surface-subtle)] text-[var(--text-muted)]">
                <LockKeyhole aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[16px] font-semibold text-[var(--text-primary)]">{t("settings.adminRoleRequired", "Se requiere una membresía admin o permisos de platform admin")}</p>
                <p className="mt-2 text-[13px] leading-6 text-[var(--text-secondary)]">
                  {t("settings.adminRoleDesc", "Solicita el cambio de rol a un administrador del workspace. No se muestran formularios editables para evitar que la configuración técnica parezca una preferencia personal.")}
                </p>
              </div>
            </div>
          </Panel>
        </section>
      ) : null}

      {!isHotmartConfigActive && activeScope === "workspace" && canManageWorkspaceRuntime ? (
        <section aria-label={copy("Workspace administration", "Administracion del workspace", "Administracao do workspace")} className="space-y-5" id="settings-panel-workspace" role="tabpanel">
          <SettingsScopeHeader
            accessLabel={t("settings.workspaceScopeLabel", "Admin")}
            description={t("settings.workspaceScopeDesc", "Configura el runtime efectivo, sus credenciales y controles operativos. Los cambios de este ámbito afectan al workspace activo, no solo a tu cuenta.")}
            eyebrow={copy("Administration", "Administracion", "Administracao")}
            icon={<Building2 aria-hidden="true" className="h-5 w-5" />}
            id="settings-workspace-title"
            title={t("settings.scope.workspace", "Workspace & LLM Runtime")}
          />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Panel className="p-4">
          <KeyValue
            label={t("settings.gov.activeWorkspace", "Workspace activo")}
            value={user?.active_workspace_name ?? copy("No workspace", "Sin workspace", "Sem workspace")}
            hint={activeWorkspaceId ?? copy("No identifier", "Sin identificador", "Sem identificador")}
          />
        </Panel>
        <Panel className="p-4">
          <KeyValue
            label={t("settings.gov.effectiveRole", "Rol efectivo")}
            value={getWorkspaceRoleLabel(workspaceRole, language)}
            hint={canManageWorkspaceRuntime ? copy("Can govern runtime", "Puede gobernar runtime", "Pode governar o runtime") : copy("Operational read-only", "Lectura operativa", "Leitura operacional")}
          />
        </Panel>
        <Panel className="p-4">
          <KeyValue
            label={t("settings.gov.effectiveProvider", "Provider efectivo")}
            value={runtime?.active_provider ?? copy("Not loaded", "Sin cargar", "Nao carregado")}
            hint={runtime ? getProviderLabel(runtime.active_provider) : copy("Runtime pending", "Runtime pendiente", "Runtime pendente")}
          />
        </Panel>
        <Panel className="p-4">
          <KeyValue
            label={t("settings.gov.credentials", "Credenciales")}
            value={runtime?.uses_platform_credentials ? copy("Platform", "Plataforma", "Plataforma") : "Workspace"}
            hint={runtime?.uses_platform_credentials ? copy("Managed baseline in use", "Se usa baseline gestionado", "Baseline gerenciado em uso") : copy("Workspace-isolated secret in use", "Se usa secreto aislado por workspace", "Segredo isolado por workspace em uso")}
          />
        </Panel>
        <Panel className="p-4">
          <KeyValue
            label={t("settings.gov.operationalHealth", "Health operativo")}
            value={runtimeHealth?.overall_status ?? (workspaceHealthState.error ? copy("With error", "Con error", "Com erro") : copy("Not visible", "No visible", "Nao visivel"))}
            hint={runtimeHealth?.provider_label ?? (canManageWorkspaceRuntime ? copy("No diagnostics", "Sin diagnostico", "Sem diagnostico") : copy("Available for workspace admin", "Disponible para admin del workspace", "Disponivel para admin do workspace"))}
          />
        </Panel>
      </div>

      {runtimeState.status === "loading" && !runtime ? (
        <LoadingState
          title={copy("Loading workspace runtime", "Cargando runtime del workspace", "Carregando runtime do workspace")}
          description={copy(
            "We are resolving the effective runtime, its secrets, and the operational health of this workspace.",
            "Estamos resolviendo el runtime efectivo, sus secretos y la salud operativa de este workspace.",
            "Estamos resolvendo o runtime efetivo, seus segredos e a saude operacional deste workspace.",
          )}
        />
      ) : null}

      {runtimeState.status === "error" && !runtime ? (
        <ErrorState
          title={copy("Could not load runtime configuration", "No se pudo cargar la configuracion del runtime", "Nao foi possivel carregar a configuracao do runtime")}
          description={runtimeState.error ?? copy("The workspace operational view could not be built.", "No fue posible construir la vista operativa del workspace.", "Nao foi possivel construir a visao operacional do workspace.")}
          action={<AppButton onClick={() => void loadWorkspacePanel()}>{copy("Retry", "Reintentar", "Tentar novamente")}</AppButton>}
        />
      ) : null}

      {runtime && runtimeDraft && secretDrafts ? (
        <div className={cn("grid gap-5", showWorkspaceDiagnosticsPanel ? "xl:grid-cols-[minmax(0,1.25fr)_360px]" : "")}>
          <div className="space-y-5">
            {showWorkspaceRuntimePanel ? (
            <Panel className="overflow-hidden p-0" id="workspace-runtime">
              <div className="flex flex-wrap items-start justify-between gap-4 p-5">
                <div className="space-y-2">
                  <p className="text-[20px] font-semibold text-[var(--text-primary)]">{t("settings.gov.title", "Runtime efectivo del workspace")}</p>
                  <p className="text-[14px] leading-7 text-[var(--text-secondary)]">
                    {t("settings.gov.subtitle", "Define el provider, los backends y el origen de credenciales del workspace. Cada valor indica si proviene de plataforma o de un override local.")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="blue">{getProviderLabel(runtimeDraft.active_provider)}</Badge>
                    <Badge tone={runtimeDraft.uses_platform_credentials === false ? "green" : "violet"}>
                      {runtimeDraft.uses_platform_credentials === false ? "Workspace credentials" : "Platform credentials"}
                    </Badge>
                    <Badge tone="slate">{executionBackendCopy.label}</Badge>
                  </div>
                </div>
                <button
                  aria-expanded={workspaceRuntimeExpanded}
                  aria-label={workspaceRuntimeExpanded ? "Contraer runtime efectivo del workspace" : "Expandir runtime efectivo del workspace"}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-[var(--border-default)] bg-white text-[var(--brand-primary)] transition hover:bg-[var(--brand-soft)]"
                  type="button"
                  onClick={() => setWorkspaceRuntimeExpanded((value) => !value)}
                >
                  {workspaceRuntimeExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              </div>

              {workspaceRuntimeExpanded ? (
                <div className="border-t border-[var(--border-default)] p-5">
                  <div className="mb-5 flex flex-wrap justify-end gap-3">
                  <AppButton
                    onClick={() => void handleRefreshWorkspaceHealth("test")}
                    loading={workspaceHealthPending}
                    disabled={!canManageWorkspaceRuntime}
                    icon={<TestTube2 className="h-4 w-4" />}
                  >
                    {t("settings.btn.testConnection", "Probar conexión")}
                  </AppButton>
                  <AppButton
                    onClick={() => void handleResetRuntime()}
                    loading={runtimeResetPending}
                    disabled={!canManageWorkspaceRuntime}
                    icon={<RotateCcw className="h-4 w-4" />}
                  >
                    {t("settings.btn.resetDefaults", "Restaurar defaults")}
                  </AppButton>
                  <AppButton
                    onClick={() => void handleSaveRuntime()}
                    loading={runtimeSavePending}
                    disabled={!canManageWorkspaceRuntime || !runtimeHasChanges}
                    variant="primary"
                    icon={<Save className="h-4 w-4" />}
                  >
                    {t("settings.btn.saveWorkspace", "Guardar workspace")}
                  </AppButton>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  label={t("settings.gov.activeProvider", "Provider activo")}
                  value={runtimeDraft.active_provider}
                  options={PROVIDER_ORDER.map((providerKey) => ({
                    label: getProviderLabel(providerKey),
                    value: providerKey,
                  }))}
                  error={runtimeErrors.active_provider}
                  hint={getFieldOriginLabel("active_provider")}
                  onValueChange={(value) =>
                    setRuntimeDraft((current) =>
                      current
                        ? {
                            ...current,
                            active_provider: value as LLMProviderKey,
                          }
                        : current,
                    )
                  }
                />
                <SelectField
                  label={t("settings.gov.credentialsMode", "Modo de credenciales")}
                  value={runtimeDraft.uses_platform_credentials === false ? "workspace" : "platform"}
                  hint={
                    selectedProvider === "codex_local"
                      ? "Codex CLI usa autenticacion local; este selector queda solo como referencia."
                      : getFieldOriginLabel("uses_platform_credentials")
                  }
                  options={[
                    {
                      label: "Plataforma",
                      value: "platform",
                    },
                    {
                      label: "Workspace",
                      value: "workspace",
                      disabled: !supportsWorkspaceSecrets(selectedProvider),
                    },
                  ]}
                  onValueChange={(value) =>
                    setRuntimeDraft((current) =>
                      current
                        ? {
                            ...current,
                            uses_platform_credentials: value === "workspace" ? false : true,
                          }
                        : current,
                    )
                  }
                />
                <SelectField
                  label="Agent execution backend"
                  value={runtimeDraft.agent_execution_backend}
                  error={runtimeErrors.agent_execution_backend}
                  hint={`${getFieldOriginLabel("agent_execution_backend")}. ${executionBackendCopy.description}`}
                  options={[
                    { label: "provider_native", value: "provider_native" },
                    { label: "codex_cli", value: "codex_cli" },
                    { label: "shadow_codex_cli", value: "shadow_codex_cli" },
                  ]}
                  onValueChange={(value) =>
                    setRuntimeDraft((current) =>
                      current
                        ? {
                            ...current,
                            agent_execution_backend: value as LLMRuntimeSettingsUpdateRequest["agent_execution_backend"],
                          }
                        : current,
                    )
                  }
                />
                <SelectField
                  label="Knowledge access backend"
                  value={runtimeDraft.knowledge_access_backend}
                  error={runtimeErrors.knowledge_access_backend}
                  hint={`${getFieldOriginLabel("knowledge_access_backend")}. ${knowledgeBackendCopy.description}`}
                  options={[
                    { label: "inline_context", value: "inline_context" },
                    { label: "workspace_staged", value: "workspace_staged" },
                    { label: "hybrid", value: "hybrid" },
                  ]}
                  onValueChange={(value) =>
                    setRuntimeDraft((current) =>
                      current
                        ? {
                            ...current,
                            knowledge_access_backend: value as LLMRuntimeSettingsUpdateRequest["knowledge_access_backend"],
                          }
                        : current,
                    )
                  }
                />
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                <KeyValue label="Workspace binding" value={activeWorkspaceId ?? "Sin workspace"} hint="Toda lectura y escritura viaja con x-workspace-id" />
                <KeyValue label="Ultima actualizacion" value={formatDateTime(runtime.updated_at)} hint="Runtime efectivo redactado" />
                <KeyValue label="Origen del provider" value={getFieldOriginLabel("active_provider")} hint={runtimeDraft.active_provider} />
                  </div>

                  {runtimeFeedback ? (
                    <p className={`mt-5 text-[13px] font-medium ${getFeedbackToneClass(runtimeFeedback.tone)}`}>{runtimeFeedback.message}</p>
                  ) : null}
                </div>
              ) : null}
            </Panel>
            ) : null}

            {showWorkspaceProviderPanels ? (
            <Panel className="overflow-hidden p-0" id="workspace-providers">
              <div className="border-b border-[var(--border-default)] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[20px] font-semibold text-[var(--text-primary)]">Providers del workspace</p>
                    <p className="mt-1 max-w-3xl text-[13px] leading-6 text-[var(--text-secondary)]">
                      Gestiona cada provider como registro: resumen operativo en la fila y parametros editables al expandir.
                    </p>
                  </div>
                  <Badge tone="violet">Tabla + acordeon</Badge>
                </div>
              </div>

              <div className="overflow-hidden">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[var(--border-default)] bg-[var(--surface-subtle)] text-[12px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                      <th className="px-5 py-3 font-semibold">Provider</th>
                      <th className="hidden px-5 py-3 font-semibold md:table-cell">Estado</th>
                      <th className="hidden px-5 py-3 font-semibold lg:table-cell">Configuracion</th>
                      <th className="hidden px-5 py-3 font-semibold xl:table-cell">Salud</th>
                      <th className="px-5 py-3 text-right font-semibold">Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PROVIDER_ORDER.map((providerKey) => {
                      const providerConfig = getProviderSecretSnapshot(runtime, providerKey);
                      const providerLabel = getProviderLabel(providerKey);
                      const isExpanded = expandedWorkspaceProvider === providerKey;
                      const isActiveProvider = selectedProvider === providerKey;
                      const hasOverrides = providerHasOverrides(runtime, providerKey);

                      return (
                        <Fragment key={providerKey}>
                          <tr className="border-b border-[var(--border-subtle)] bg-white align-top">
                            <td className="px-5 py-4">
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-[14px] font-semibold text-[var(--text-primary)]">{providerLabel}</p>
                                  <Badge tone={isActiveProvider ? "green" : "slate"}>{isActiveProvider ? "Activo" : "Disponible"}</Badge>
                                </div>
                                <p className="max-w-[420px] text-[12px] leading-5 text-[var(--text-secondary)]">{getProviderDescription(providerKey)}</p>
                                <p className="text-[12px] font-medium text-[var(--text-muted)] lg:hidden">
                                  {getProviderPrimaryConfig(runtimeDraft, providerKey)} · {providerConfig.health_status}
                                </p>
                              </div>
                            </td>
                            <td className="hidden px-5 py-4 md:table-cell">
                              <div className="flex flex-col items-start gap-2">
                                <Badge tone={isActiveProvider ? "green" : "slate"}>{isActiveProvider ? "Activo" : "Disponible"}</Badge>
                                <Badge tone={hasOverrides ? "orange" : "blue"}>{hasOverrides ? "Override workspace" : "Default plataforma"}</Badge>
                              </div>
                            </td>
                            <td className="hidden px-5 py-4 text-[12px] lg:table-cell">
                              <p className="font-semibold text-[var(--text-primary)]">{getProviderPrimaryConfig(runtimeDraft, providerKey)}</p>
                              <p className="mt-1 break-words text-[var(--text-secondary)]">{getProviderSecondaryConfig(runtimeDraft, providerKey)}</p>
                            </td>
                            <td className="hidden px-5 py-4 xl:table-cell">
                              <div className="flex flex-col items-start gap-2">
                                <Badge tone={getBadgeTone(providerConfig.health_status)}>{providerConfig.health_status}</Badge>
                                <Badge tone={getBadgeTone(providerConfig.secret_source)}>{getSecretLabel(providerConfig.secret_source)}</Badge>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-right">
                              <button
                                aria-expanded={isExpanded}
                                aria-label={isExpanded ? `Contraer provider ${providerLabel}` : `Expandir provider ${providerLabel}`}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-[12px] border border-[var(--border-default)] bg-white text-[var(--brand-primary)] transition hover:bg-[var(--brand-soft)]"
                                type="button"
                                onClick={() => setExpandedWorkspaceProvider(isExpanded ? null : providerKey)}
                              >
                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              </button>
                            </td>
                          </tr>
                          {isExpanded ? (
                            <tr className="border-b border-[var(--border-default)] bg-[var(--surface-subtle)]">
                              <td className="px-5 py-4" colSpan={5}>
                                <div className="rounded-[18px] border border-[var(--border-default)] bg-white p-4">
                                  {renderWorkspaceProviderDetail(providerKey)}
                                </div>
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
            ) : null}

            {showWorkspaceSecretsPanel ? (
            <Panel className="overflow-hidden p-0" id="workspace-credentials">
              <div className="border-b border-[var(--border-default)] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[20px] font-semibold text-[var(--text-primary)]">Secretos y aislamiento por provider</p>
                    <p className="mt-1 max-w-3xl text-[13px] leading-6 text-[var(--text-secondary)]">
                      Separamos el estado global de plataforma del override del workspace activo. Los workspaces platform-managed usan la credencial global cifrada sin duplicar secretos.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="violet">Tabla + acordeon</Badge>
                    <Badge tone={runtime.uses_platform_credentials ? "blue" : "green"}>
                      {runtime.uses_platform_credentials ? "Plataforma activa" : "Workspace activo"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 border-b border-[var(--border-default)] bg-[var(--surface-subtle)] p-5 lg:grid-cols-2">
                <div className="rounded-[18px] border border-[var(--border-default)] bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[15px] font-semibold text-[var(--text-primary)]">Credenciales de plataforma</p>
                    <Badge tone={platformSecretView?.configured ? "green" : "orange"}>
                      {platformSecretView?.configured ? "Secreto global activo" : "Secreto global pendiente"}
                    </Badge>
                  </div>
                  <p className="mt-2 text-[13px] leading-6 text-[var(--text-secondary)]">
                    El Platform Admin gobierna la credencial global cifrada. Los workspaces que heredan plataforma resuelven este secreto sin copiarlo a cada workspace.
                  </p>

                  <div className="mt-4 grid gap-3">
                    <SelectField
                      label="Provider global"
                      value={selectedPlatformSecretProvider}
                      options={PROVIDER_ORDER.map((providerKey) => ({
                        disabled: !supportsPlatformSecrets(providerKey),
                        label: getProviderLabel(providerKey),
                        value: providerKey,
                      }))}
                      onValueChange={(value) => setSelectedPlatformSecretProvider(value as LLMProviderKey)}
                    />

                    {platformSecretsState.status === "loading" ? (
                      <p className="text-[13px] text-[var(--text-secondary)]">Leyendo secreto global...</p>
                    ) : platformSecretsState.error ? (
                      <p className="text-[13px] font-medium text-[var(--danger)]">{platformSecretsState.error}</p>
                    ) : (
                      <div className="grid gap-3 md:grid-cols-2">
                        <KeyValue label="Estado" value={platformSecretView?.status ?? "not_configured"} hint={platformSecretView?.health_status ?? "platform_missing"} />
                        <KeyValue label="Storage" value={platformSecretView?.storage_mode ?? "none"} hint={getSecretLabel(platformSecretView?.secret_source ?? "platform_managed")} />
                        <KeyValue label="Ultima rotacion" value={formatDateTime(platformSecretView?.last_rotated_at)} hint="Fecha conocida por backend" />
                        <KeyValue label="Actualizado" value={formatDateTime(platformSecretView?.updated_at)} hint="Registro global de plataforma" />
                      </div>
                    )}

                    {platformSecretSupports && platformSecretDraft ? (
                      <div className="grid gap-3">
                        <TextField
                          label="Secret value global"
                          type="password"
                          value={platformSecretDraft.secret_value}
                          hint="Se cifra en platform_provider_secrets y nunca se devuelve en respuestas."
                          onValueChange={(value) =>
                            setPlatformSecretDrafts((current) =>
                              current
                                ? {
                                    ...current,
                                    [selectedPlatformSecretProvider]: {
                                      ...current[selectedPlatformSecretProvider],
                                      secret_value: value,
                                    },
                                  }
                                : current,
                            )
                          }
                        />
                        <TextField
                          label="Secret reference global"
                          value={platformSecretDraft.secret_ref}
                          hint="Opcional para registrar una referencia externa sin exponer el valor."
                          onValueChange={(value) =>
                            setPlatformSecretDrafts((current) =>
                              current
                                ? {
                                    ...current,
                                    [selectedPlatformSecretProvider]: {
                                      ...current[selectedPlatformSecretProvider],
                                      secret_ref: value,
                                    },
                                  }
                                : current,
                            )
                          }
                        />
                        <div className="flex flex-wrap gap-2">
                          <AppButton
                            className="h-10 px-3 text-[12px]"
                            onClick={() => void handlePlatformSecretAction(selectedPlatformSecretProvider, "upsert")}
                            loading={platformSecretBusy}
                            icon={<KeyRound className="h-4 w-4" />}
                          >
                            Guardar secreto global
                          </AppButton>
                          <AppButton
                            className="h-10 px-3 text-[12px]"
                            onClick={() => void handlePlatformSecretAction(selectedPlatformSecretProvider, "rotate")}
                            loading={platformSecretBusy}
                            icon={<RotateCcw className="h-4 w-4" />}
                          >
                            Rotar secreto global
                          </AppButton>
                          <AppButton
                            className="h-10 px-3 text-[12px] text-[var(--danger)]"
                            onClick={() => void handlePlatformSecretAction(selectedPlatformSecretProvider, "delete")}
                            loading={platformSecretBusy}
                            icon={<ShieldCheck className="h-4 w-4" />}
                          >
                            Limpiar secreto global
                          </AppButton>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-[16px] border border-[var(--border-default)] bg-[var(--surface-subtle)] px-4 py-3 text-[13px] leading-6 text-[var(--text-secondary)]">
                        Este provider no usa credencial SaaS global administrada por plataforma.
                      </div>
                    )}
                  </div>
                </div>
                <div className="rounded-[18px] border border-[var(--border-default)] bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[15px] font-semibold text-[var(--text-primary)]">Credenciales del workspace activo</p>
                    <Badge tone={runtime.uses_platform_credentials ? "blue" : "green"}>
                      {runtime.uses_platform_credentials ? "Hereda plataforma" : "Override workspace"}
                    </Badge>
                  </div>
                  <p className="mt-2 text-[13px] leading-6 text-[var(--text-secondary)]">
                    Usa los acordeones por provider para guardar, rotar o limpiar secretos del workspace. Limpiar permite que este workspace vuelva a resolver el baseline disponible.
                  </p>
                  <AppButton
                    className="mt-3"
                    onClick={() => void handleResetRuntime()}
                    loading={runtimeResetPending}
                    disabled={!canManageWorkspaceRuntime}
                    icon={<RotateCcw className="h-4 w-4" />}
                  >
                    Resetear este workspace para usar plataforma
                  </AppButton>
                </div>
              </div>

              <div className="overflow-hidden">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[var(--border-default)] bg-[var(--surface-subtle)] text-[12px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                      <th className="px-5 py-3 font-semibold">Provider</th>
                      <th className="px-5 py-3 font-semibold">Salud</th>
                      <th className="hidden px-5 py-3 font-semibold md:table-cell">Origen</th>
                      <th className="hidden px-5 py-3 font-semibold lg:table-cell">Ultima rotacion</th>
                      <th className="hidden px-5 py-3 font-semibold xl:table-cell">Disponible</th>
                      <th className="hidden px-5 py-3 font-semibold xl:table-cell">Aislamiento</th>
                      <th className="px-5 py-3 text-right font-semibold">Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PROVIDER_ORDER.map((providerKey) => {
                      const providerConfig = getProviderSecretSnapshot(runtime, providerKey);
                      const draft = secretDrafts[providerKey];
                      const providerSupportsWorkspaceSecrets = supportsWorkspaceSecrets(providerKey);
                      const isExpanded = expandedSecretProvider === providerKey;
                      const providerLabel = getProviderLabel(providerKey);

                      return (
                        <Fragment key={providerKey}>
                          <tr className="border-b border-[var(--border-subtle)] bg-white align-top">
                            <td className="px-5 py-4">
                              <p className="text-[14px] font-semibold text-[var(--text-primary)]">{providerLabel}</p>
                              <p className="mt-1 max-w-[320px] text-[12px] leading-5 text-[var(--text-secondary)]">
                                {providerSupportsWorkspaceSecrets
                                  ? "Puede aislar secreto por workspace o heredar credencial de plataforma."
                                  : "Usa autenticacion local del runtime; no admite secreto SaaS por workspace."}
                              </p>
                            </td>
                            <td className="px-5 py-4">
                              <Badge tone={getBadgeTone(providerConfig.health_status)}>{providerConfig.health_status}</Badge>
                            </td>
                            <td className="hidden px-5 py-4 md:table-cell">
                              <Badge tone={getBadgeTone(providerConfig.secret_source)}>{getSecretLabel(providerConfig.secret_source)}</Badge>
                            </td>
                            <td className="hidden px-5 py-4 text-[12px] font-medium text-[var(--text-secondary)] lg:table-cell">
                              {formatDateTime(providerConfig.last_rotated_at)}
                            </td>
                            <td className="hidden px-5 py-4 xl:table-cell">
                              <Badge tone={providerConfig.available ? "green" : "orange"}>{providerConfig.available ? "Si" : "No"}</Badge>
                            </td>
                            <td className="hidden px-5 py-4 text-[12px] font-medium text-[var(--text-secondary)] xl:table-cell">
                              {providerSupportsWorkspaceSecrets ? "Workspace / Plataforma" : "Runtime local"}
                            </td>
                            <td className="px-5 py-3 text-right">
                              <button
                                aria-expanded={isExpanded}
                                aria-label={isExpanded ? `Contraer ${providerLabel}` : `Expandir ${providerLabel}`}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-[12px] border border-[var(--border-default)] bg-white text-[var(--brand-primary)] transition hover:bg-[var(--brand-soft)]"
                                type="button"
                                onClick={() => setExpandedSecretProvider(isExpanded ? null : providerKey)}
                              >
                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              </button>
                            </td>
                          </tr>
                          {isExpanded ? (
                            <tr className="border-b border-[var(--border-default)] bg-[var(--surface-subtle)]">
                              <td className="px-5 py-4" colSpan={7}>
                                <div className="grid gap-4 rounded-[18px] border border-[var(--border-default)] bg-white p-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                                  <div>
                                    <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                                      Detalle del secreto
                                    </p>
                                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                                      <KeyValue label="Origen" value={getSecretLabel(providerConfig.secret_source)} hint="Estado devuelto por runtime settings" />
                                      <KeyValue label="Ultima rotacion" value={formatDateTime(providerConfig.last_rotated_at)} hint="Fecha conocida por backend" />
                                      <KeyValue label="Disponible" value={providerConfig.available ? "Si" : "No"} hint="Resolucion efectiva del provider" />
                                    </div>

                                    {providerSupportsWorkspaceSecrets ? (
                                      <div className="mt-4 grid gap-4 lg:grid-cols-3">
                                        <TextField
                                          label="Secret value"
                                          type="password"
                                          value={draft.secret_value}
                                          hint="Solo se usa para upsert o rotate; nunca vuelve en respuestas."
                                          onValueChange={(value) =>
                                            setSecretDrafts((current) =>
                                              current
                                                ? {
                                                    ...current,
                                                    [providerKey]: {
                                                      ...current[providerKey],
                                                      secret_value: value,
                                                    },
                                                  }
                                                : current,
                                            )
                                          }
                                        />
                                        <TextField
                                          label="Secret reference"
                                          value={draft.secret_ref}
                                          hint="Opcional si quieres guardar una referencia en vez del valor cifrado."
                                          onValueChange={(value) =>
                                            setSecretDrafts((current) =>
                                              current
                                                ? {
                                                    ...current,
                                                    [providerKey]: {
                                                      ...current[providerKey],
                                                      secret_ref: value,
                                                    },
                                                  }
                                                : current,
                                            )
                                          }
                                        />
                                        <SelectField
                                          label="Activar para runtime"
                                          value={draft.activate_for_runtime ? "yes" : "no"}
                                          options={[
                                            { label: "Si", value: "yes" },
                                            { label: "No", value: "no" },
                                          ]}
                                          onValueChange={(value) =>
                                            setSecretDrafts((current) =>
                                              current
                                                ? {
                                                    ...current,
                                                    [providerKey]: {
                                                      ...current[providerKey],
                                                      activate_for_runtime: value === "yes",
                                                    },
                                                  }
                                                : current,
                                            )
                                          }
                                        />
                                      </div>
                                    ) : (
                                      <div className="mt-4 rounded-[18px] border border-[var(--border-default)] bg-[var(--surface-subtle)] px-4 py-4 text-[13px] leading-6 text-[var(--text-secondary)]">
                                        Este provider depende del runtime local. La gestion de secretos se hace fuera de la capa SaaS, mediante auth local de Codex CLI.
                                      </div>
                                    )}
                                  </div>

                                  <div className="rounded-[16px] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4">
                                    <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                                      Acciones al expandir
                                    </p>
                                    {providerSupportsWorkspaceSecrets ? (
                                      <div className="mt-3 flex flex-col gap-2">
                                        <AppButton
                                          className="h-10 justify-start px-3 text-[12px]"
                                          onClick={() => void handleWorkspaceSecretAction(providerKey, "upsert")}
                                          loading={secretPending[providerKey]}
                                          disabled={!canManageWorkspaceRuntime}
                                          icon={<KeyRound className="h-4 w-4" />}
                                        >
                                          Guardar secreto
                                        </AppButton>
                                        <AppButton
                                          className="h-10 justify-start px-3 text-[12px]"
                                          onClick={() => void handleWorkspaceSecretAction(providerKey, "rotate")}
                                          loading={secretPending[providerKey]}
                                          disabled={!canManageWorkspaceRuntime}
                                          icon={<RotateCcw className="h-4 w-4" />}
                                        >
                                          Rotar
                                        </AppButton>
                                        <AppButton
                                          className="h-10 justify-start px-3 text-[12px] text-[var(--danger)]"
                                          onClick={() => void handleWorkspaceSecretAction(providerKey, "delete")}
                                          loading={secretPending[providerKey]}
                                          disabled={!canManageWorkspaceRuntime}
                                          icon={<ShieldCheck className="h-4 w-4" />}
                                        >
                                          Limpiar
                                        </AppButton>
                                      </div>
                                    ) : (
                                      <p className="mt-3 text-[13px] leading-6 text-[var(--text-secondary)]">
                                        No hay acciones SaaS disponibles para este provider. Administra sus credenciales desde el runtime local correspondiente.
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {secretFeedback ? <p className={`px-5 py-4 text-[13px] font-medium ${getFeedbackToneClass(secretFeedback.tone)}`}>{secretFeedback.message}</p> : null}
            </Panel>
            ) : null}

            {showWorkspaceBackendsPanel ? (
            <>
            <FinOpsBudgetPanel canManage={canManageWorkspaceRuntime} />

            {memoryRollout ? (
              <Panel className="overflow-hidden p-0">
                <div className="flex flex-wrap items-start justify-between gap-3 p-5">
                  <div>
                    <p className="text-[20px] font-semibold text-[var(--text-primary)]">Rollout de memoria hibrida</p>
                    <p className="text-[14px] leading-7 text-[var(--text-secondary)]">
                      Estado operativo de la estrategia de memoria aplicada al runtime efectivo del workspace.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge tone={getBadgeTone(memoryRollout.status)}>{memoryRollout.status}</Badge>
                      <Badge tone={memoryRollout.manifest_ready ? "green" : "orange"}>
                        {memoryRollout.manifest_ready ? "Manifest listo" : "Manifest pendiente"}
                      </Badge>
                      <Badge tone="blue">{memoryRollout.effective_default_backend}</Badge>
                    </div>
                  </div>
                  <button
                    aria-expanded={memoryRolloutExpanded}
                    aria-label={memoryRolloutExpanded ? "Contraer rollout de memoria hibrida" : "Expandir rollout de memoria hibrida"}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-[var(--border-default)] bg-white text-[var(--brand-primary)] transition hover:bg-[var(--brand-soft)]"
                    type="button"
                    onClick={() => setMemoryRolloutExpanded((value) => !value)}
                  >
                    {memoryRolloutExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                </div>

                {memoryRolloutExpanded ? (
                  <div className="border-t border-[var(--border-default)] p-5">
                    <div className="grid gap-4 md:grid-cols-3">
                      <KeyValue label="Manifest gobernado" value={memoryRollout.manifest_ready ? "Listo" : "Pendiente"} hint="knowledge-corpus-manifest.json" />
                      <KeyValue label="Backend solicitado" value={memoryRollout.requested_backend} hint="Valor persistido del runtime" />
                      <KeyValue label="Backend efectivo" value={memoryRollout.effective_default_backend} hint="Resultado del rollout" />
                    </div>
                    <div className="mt-4 overflow-hidden rounded-[18px] border border-[var(--border-default)] bg-white">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="border-b border-[var(--border-default)] bg-[var(--surface-subtle)] text-[12px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                            <th className="px-4 py-3 font-semibold">Etapa</th>
                            <th className="hidden px-4 py-3 font-semibold md:table-cell">Backend</th>
                            <th className="hidden px-4 py-3 font-semibold lg:table-cell">LLM</th>
                            <th className="px-4 py-3 text-right font-semibold">Detalle</th>
                          </tr>
                        </thead>
                        <tbody>
                          {memoryRollout.stages.map((stage) => {
                            const isExpanded = expandedMemoryStage === stage.stage_key;

                            return (
                              <Fragment key={stage.stage_key}>
                                <tr className="border-b border-[var(--border-subtle)] align-top">
                                  <td className="px-4 py-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="text-[13px] font-semibold text-[var(--text-primary)]">{stage.label}</p>
                                      <Badge tone={stage.enabled ? "green" : "slate"}>{stage.enabled ? "On" : "Off"}</Badge>
                                    </div>
                                    <p className="mt-1 text-[12px] text-[var(--text-secondary)] md:hidden">{stage.effective_backend}</p>
                                  </td>
                                  <td className="hidden px-4 py-3 text-[12px] font-medium text-[var(--text-secondary)] md:table-cell">
                                    {stage.effective_backend}
                                  </td>
                                  <td className="hidden px-4 py-3 lg:table-cell">
                                    <Badge tone={stage.expects_llm_call ? "blue" : "slate"}>{stage.expects_llm_call ? "Budget trazable" : "Sin invocacion"}</Badge>
                                  </td>
                                  <td className="px-4 py-2 text-right">
                                    <button
                                      aria-expanded={isExpanded}
                                      aria-label={isExpanded ? `Contraer etapa ${stage.label}` : `Expandir etapa ${stage.label}`}
                                      className="inline-flex h-9 w-9 items-center justify-center rounded-[12px] border border-[var(--border-default)] bg-white text-[var(--brand-primary)] transition hover:bg-[var(--brand-soft)]"
                                      type="button"
                                      onClick={() => setExpandedMemoryStage(isExpanded ? null : stage.stage_key)}
                                    >
                                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    </button>
                                  </td>
                                </tr>
                                {isExpanded ? (
                                  <tr className="border-b border-[var(--border-default)] bg-[var(--surface-subtle)]">
                                    <td className="px-4 py-4" colSpan={4}>
                                      <div className="grid gap-3 md:grid-cols-3">
                                        <KeyValue label="Stage key" value={stage.stage_key} hint="Identificador del rollout" />
                                        <KeyValue label="Backend efectivo" value={stage.effective_backend} hint="Resultado aplicado" />
                                        <KeyValue label="Invocacion LLM" value={stage.expects_llm_call ? "Si" : "No"} hint="Control de budget y trazabilidad" />
                                      </div>
                                    </td>
                                  </tr>
                                ) : null}
                              </Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}
              </Panel>
            ) : null}

            <Panel className="overflow-hidden p-0" id="workspace-automation">
              <div className="flex flex-wrap items-start justify-between gap-4 p-5">
                <div className="space-y-2">
                  <p className="text-[18px] font-semibold text-[var(--text-primary)]">Controles por sesion</p>
                  <p className="text-[13px] leading-6 text-[var(--text-secondary)]">
                    Feature flags ligados a una sesion operativa para mantener trazabilidad sin saturar el panel.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={selectedSession ? "green" : "slate"}>{selectedSession ? "Sesion seleccionada" : "Sin sesion"}</Badge>
                    <Badge tone={featureFlagSummary.totalCount > 0 ? "blue" : "slate"}>
                      {featureFlagSummary.enabledCount}/{featureFlagSummary.totalCount} feature flags
                    </Badge>
                  </div>
                </div>
                <button
                  aria-controls="workspace-automation-body"
                  aria-expanded={sessionControlsExpanded}
                  aria-label={sessionControlsExpanded ? "Contraer controles por sesion" : "Expandir controles por sesion"}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-[var(--border-default)] bg-white text-[var(--brand-primary)] transition hover:bg-[var(--brand-soft)]"
                  type="button"
                  onClick={() => setSessionControlsExpanded((value) => !value)}
                >
                  {sessionControlsExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              </div>

              {sessionControlsExpanded ? (
                <div id="workspace-automation-body" className="border-t border-[var(--border-default)] p-5">
                  <div className="mb-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
                    <p className="text-[13px] leading-6 text-[var(--text-secondary)]">
                      Los feature flags son el unico bloque de esta pagina que depende de una sesion. Seleccionala aqui para mantener claro su alcance.
                    </p>
                    <SelectField
                      data-testid="operations-session-select"
                      label="Sesion para feature flags"
                      onValueChange={(value) => void selectOperationalSession(value)}
                      options={sessionOptions}
                      value={selectedSession?.id ?? ""}
                    />
                  </div>
                  {selectedSession ? (
                    featureFlags.length > 0 ? (
                      <div className="overflow-hidden rounded-[18px] border border-[var(--border-default)] bg-white">
                        <table className="w-full border-collapse text-left">
                          <thead>
                            <tr className="border-b border-[var(--border-default)] bg-[var(--surface-subtle)] text-[12px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                              <th className="px-4 py-3 font-semibold">Flag</th>
                              <th className="hidden px-4 py-3 font-semibold md:table-cell">Estado</th>
                              <th className="hidden px-4 py-3 font-semibold lg:table-cell">Stage</th>
                              <th className="px-4 py-3 text-right font-semibold">Detalle</th>
                            </tr>
                          </thead>
                          <tbody>
                            {featureFlags.map((flag) => {
                              const isExpanded = expandedFeatureFlag === flag.key;

                              return (
                                <Fragment key={flag.key}>
                                  <tr className="border-b border-[var(--border-subtle)] align-top">
                                    <td className="px-4 py-3">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-[13px] font-semibold text-[var(--text-primary)]">{flag.key}</p>
                                        <Badge className="md:hidden" tone={flag.enabled ? "green" : "slate"}>{flag.enabled ? "Activo" : "Inactivo"}</Badge>
                                      </div>
                                      <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-[var(--text-secondary)]">{flag.description}</p>
                                    </td>
                                    <td className="hidden px-4 py-3 md:table-cell">
                                      <Badge tone={flag.enabled ? "green" : "slate"}>{flag.enabled ? "Activo" : "Inactivo"}</Badge>
                                    </td>
                                    <td className="hidden px-4 py-3 text-[12px] text-[var(--text-secondary)] lg:table-cell">
                                      {flag.stage_hint || "n/a"}
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                      <button
                                        aria-expanded={isExpanded}
                                        aria-label={isExpanded ? `Contraer flag ${flag.key}` : `Expandir flag ${flag.key}`}
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-[12px] border border-[var(--border-default)] bg-white text-[var(--brand-primary)] transition hover:bg-[var(--brand-soft)]"
                                        type="button"
                                        onClick={() => setExpandedFeatureFlag(isExpanded ? null : flag.key)}
                                      >
                                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                      </button>
                                    </td>
                                  </tr>
                                  {isExpanded ? (
                                    <tr className="border-b border-[var(--border-default)] bg-[var(--surface-subtle)]">
                                      <td className="px-4 py-4" colSpan={4}>
                                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                          <div className="space-y-1">
                                            <p className="text-[13px] leading-6 text-[var(--text-secondary)]">{flag.description}</p>
                                            <p className="text-[12px] text-[var(--text-muted)]">Stage hint: {flag.stage_hint || "n/a"}</p>
                                            {flagErrors[flag.key] ? <p className="text-[13px] font-medium text-[var(--danger)]">{flagErrors[flag.key]}</p> : null}
                                          </div>
                                          <AppButton
                                            onClick={() => void handleToggleFlag(flag)}
                                            loading={flagPending[flag.key]}
                                            variant={flag.enabled ? "secondary" : "primary"}
                                          >
                                            {flag.enabled ? "Desactivar" : "Activar"}
                                          </AppButton>
                                        </div>
                                      </td>
                                    </tr>
                                  ) : null}
                                </Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <EmptyState className="px-0 py-4" title="Sin feature flags expuestos" description="El snapshot actual aun no devolvio feature flags visibles." />
                    )
                  ) : (
                    <EmptyState
                      className="px-0 py-4"
                      title="Selecciona una sesion"
                      description="El runtime ya esta gobernado por workspace, pero los feature flags requieren una sesion activa para trazabilidad."
                      action={<AppButton onClick={() => void handleCreateSession()}>Crear sesion</AppButton>}
                    />
                  )}
                </div>
                ) : (
                  <div id="workspace-automation-body" hidden />
              )}
            </Panel>
            </>
            ) : null}
          </div>

          {showWorkspaceDiagnosticsPanel ? (
          <div className="space-y-5">
            <Panel className="overflow-hidden p-0" id="workspace-diagnostics">
              <div className="border-b border-[var(--border-default)] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[18px] font-semibold text-[var(--text-primary)]">Diagnostico tecnico</p>
                    <p className="mt-1 text-[13px] leading-6 text-[var(--text-secondary)]">
                      Salud del workspace y Codex CLI quedan disponibles solo cuando necesitas investigar un incidente.
                    </p>
                  </div>
                  <Badge tone={workspaceHealthState.error || runtimeStatusState.error ? "red" : runtimeHealth || runtimeStatus ? "green" : "slate"}>
                    {runtimeHealth || runtimeStatus ? "Disponible" : workspaceHealthState.error || runtimeStatusState.error ? "Revisar" : "Bajo demanda"}
                  </Badge>
                </div>
              </div>

              <div className="overflow-hidden">
                <table className="w-full table-auto border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[var(--border-default)] bg-[var(--surface-subtle)] text-[12px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                      <th className="px-5 py-3 font-semibold">Chequeo</th>
                      <th className="px-5 py-3 font-semibold">Estado</th>
                      <th className="px-5 py-3 font-semibold">Resumen</th>
                      <th className="px-5 py-3 text-right font-semibold">Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    <Fragment>
                      <tr className="border-b border-[var(--border-subtle)] bg-white align-top">
                        <td className="px-5 py-4">
                          <p className="text-[14px] font-semibold text-[var(--text-primary)]">Salud del workspace</p>
                          <p className="mt-1 text-[12px] leading-5 text-[var(--text-secondary)]">Health checks efectivos del runtime actual.</p>
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone={workspaceHealthStatusTone}>{workspaceHealthStatusLabel}</Badge>
                        </td>
                        <td className="px-5 py-4 text-[12px] font-medium text-[var(--text-secondary)]">
                          {runtimeHealth
                            ? `${runtimeHealth.provider_label} · ${runtimeHealth.agent_execution_backend}`
                            : workspaceHealthState.error
                              ? workspaceHealthState.error
                              : canManageWorkspaceRuntime
                                ? "Expandir para cargar o revisar detalle."
                                : "Reservado para admin del workspace."}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            aria-expanded={expandedDiagnosticPanel === "workspace-health"}
                            aria-label={expandedDiagnosticPanel === "workspace-health" ? "Contraer salud del workspace" : "Expandir salud del workspace"}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-[12px] border border-[var(--border-default)] bg-white text-[var(--brand-primary)] transition hover:bg-[var(--brand-soft)]"
                            type="button"
                            onClick={() => setExpandedDiagnosticPanel(expandedDiagnosticPanel === "workspace-health" ? null : "workspace-health")}
                          >
                            {expandedDiagnosticPanel === "workspace-health" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                        </td>
                      </tr>
                      {expandedDiagnosticPanel === "workspace-health" ? (
                        <tr className="border-b border-[var(--border-default)] bg-[var(--surface-subtle)]">
                          <td className="px-5 py-4" colSpan={4}>
                            <div className="rounded-[18px] border border-[var(--border-default)] bg-white p-4">
                              {workspaceHealthState.status === "loading" && !runtimeHealth ? (
                                <LoadingState title="Validando salud" description="Consultando checks de conectividad y credenciales del workspace." />
                              ) : workspaceHealthState.error ? (
                                <ErrorState title="Health no disponible" description={workspaceHealthState.error} />
                              ) : runtimeHealth ? (
                                <div className="space-y-4">
                                  <div className="grid gap-3 md:grid-cols-2">
                                    <KeyValue label="Provider" value={runtimeHealth.provider_label} hint="Provider efectivo" />
                                    <KeyValue label="Secret source" value={getSecretSourceLabel(runtimeHealth.secret_source)} hint="Origen de credencial" />
                                    <KeyValue label="Backend agentico" value={runtimeHealth.agent_execution_backend} hint="Ejecucion activa" />
                                    <KeyValue label="Checked at" value={formatDateTime(runtimeHealth.checked_at)} hint="Ultimo diagnostico" />
                                  </div>
                                  <div className="space-y-2">
                                    {runtimeHealth.checks.map((check) => (
                                      <div key={check.check_key} className="rounded-[16px] border border-[var(--border-default)] bg-[var(--surface-subtle)] px-4 py-3">
                                        <div className="flex items-center justify-between gap-3">
                                          <p className="text-[13px] font-semibold text-[var(--text-primary)]">{check.label}</p>
                                          <Badge tone={getBadgeTone(check.status)}>{check.status}</Badge>
                                        </div>
                                        <p className="mt-1 text-[12px] leading-5 text-[var(--text-secondary)]">{check.detail}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <EmptyState
                                  className="px-0 py-4"
                                  title="Health restringido"
                                  description={
                                    canManageWorkspaceRuntime
                                      ? "Todavia no hay diagnostico operativo."
                                      : "Los checks de salud del runtime solo se exponen a workspace admin o platform admin."
                                  }
                                />
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>

                    <Fragment>
                      <tr className="border-b border-[var(--border-subtle)] bg-white align-top">
                        <td className="px-5 py-4">
                          <p className="text-[14px] font-semibold text-[var(--text-primary)]">Codex CLI</p>
                          <p className="mt-1 text-[12px] leading-5 text-[var(--text-secondary)]">Diagnostico local y smoke command.</p>
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone={codexDiagnosticStatusTone}>{codexDiagnosticStatusLabel}</Badge>
                        </td>
                        <td className="px-5 py-4 text-[12px] font-medium text-[var(--text-secondary)]">
                          {runtimeStatus
                            ? `${runtimeStatus.version ?? "Sin version"} · Auth ${runtimeStatus.auth_detected ? "detectada" : "no detectada"}`
                            : runtimeStatusState.error
                              ? runtimeStatusState.error
                              : "`/api/v1/runtime/status` reservado para plataforma."}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            aria-expanded={expandedDiagnosticPanel === "codex-cli"}
                            aria-label={expandedDiagnosticPanel === "codex-cli" ? "Contraer Codex CLI" : "Expandir Codex CLI"}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-[12px] border border-[var(--border-default)] bg-white text-[var(--brand-primary)] transition hover:bg-[var(--brand-soft)]"
                            type="button"
                            onClick={() => setExpandedDiagnosticPanel(expandedDiagnosticPanel === "codex-cli" ? null : "codex-cli")}
                          >
                            {expandedDiagnosticPanel === "codex-cli" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                        </td>
                      </tr>
                      {expandedDiagnosticPanel === "codex-cli" ? (
                        <tr className="border-b border-[var(--border-default)] bg-[var(--surface-subtle)]">
                          <td className="px-5 py-4" colSpan={4}>
                            <div className="rounded-[18px] border border-[var(--border-default)] bg-white p-4">
                              {runtimeStatusState.status === "loading" && !runtimeStatus ? (
                                <LoadingState title="Leyendo diagnostico" description="Consultando `GET /api/v1/runtime/status`." />
                              ) : runtimeStatusState.error ? (
                                <ErrorState title="Diagnostico no disponible" description={runtimeStatusState.error} />
                              ) : runtimeStatus ? (
                                <div className="space-y-4">
                                  <div className="grid gap-3 md:grid-cols-2">
                                    <KeyValue label="Version" value={runtimeStatus.version ?? "Sin version"} hint="CLI detectado" />
                                    <KeyValue label="Auth detectada" value={runtimeStatus.auth_detected ? "Si" : "No"} hint={codexRuntimeSummary?.auth.label ?? "Sin lectura"} />
                                    <KeyValue label="Implementation backend" value={runtimeStatus.implementation_backend} hint="Runtime activo" />
                                    <KeyValue label="Timeout" value={formatDurationMs(runtimeStatus.timeout_ms)} hint="Limite operativo" />
                                  </div>
                                  <div className="flex flex-wrap gap-3">
                                    <AppButton onClick={() => void handleRefreshPlatformStatus()} loading={runtimeStatusRefreshPending} icon={<RefreshCcw className="h-4 w-4" />}>
                                      Refrescar
                                    </AppButton>
                                    <AppButton onClick={() => void handleCopySmokeCommand()} icon={<Copy className="h-4 w-4" />}>
                                      Copiar smoke command
                                    </AppButton>
                                  </div>
                                  {smokeCommandFeedback ? <p className="text-[12px] font-medium text-[var(--text-secondary)]">{smokeCommandFeedback}</p> : null}
                                  <div className="rounded-[16px] border border-[var(--border-default)] bg-[rgba(15,23,42,0.02)] p-4">
                                    <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Smoke command</p>
                                    <p className="mt-2 break-all font-mono text-[12px] leading-5 text-[var(--text-primary)]">{runtimeStatus.smoke_command}</p>
                                  </div>
                                  {codexRuntimeSummary?.blockingReasons.length ? (
                                    <div className="rounded-[16px] border border-[rgba(239,68,68,0.18)] bg-[rgba(239,68,68,0.04)] p-4">
                                      <div className="flex items-start gap-3">
                                        <AlertTriangle className="mt-0.5 h-5 w-5 text-[var(--danger)]" />
                                        <div className="space-y-2">
                                          <p className="text-[13px] font-semibold text-[var(--text-primary)]">Bloqueos detectados</p>
                                          {codexRuntimeSummary.blockingReasons.map((reason) => (
                                            <p key={reason} className="text-[12px] leading-5 text-[var(--text-secondary)]">
                                              {reason}
                                            </p>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  ) : null}
                                </div>
                              ) : (
                                <EmptyState className="px-0 py-4" title="Diagnostico oculto" description="`/api/v1/runtime/status` queda reservado para platform admin." />
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  </tbody>
                </table>
              </div>
            </Panel>

            <Panel className="p-6">
              <div className="mb-4 space-y-1">
                <p className="text-[18px] font-semibold text-[var(--text-primary)]">Resumen operativo</p>
                <p className="text-[13px] text-[var(--text-secondary)]">Lectura rapida del runtime efectivo y la capacidad comercial habilitada en este workspace.</p>
              </div>
              
              <div className="space-y-3">
                <StatRow label="Execution backend" value={executionBackendCopy.label} tone="violet" />
                <StatRow label="Knowledge backend" value={knowledgeBackendCopy.label} tone="blue" />
                <StatRow label="Feature flags" value={`${featureFlagSummary.enabledCount}/${featureFlagSummary.totalCount}`} tone="green" />
                <StatRow
                  label="Cobertura calibrada"
                  value={calibrationState.status === "ready" && calibrationState.data ? `${calibrationState.data.coverage_percent}%` : "No disponible"}
                  tone="violet"
                />
                <StatRow label="Rollout Codex" value={rolloutSummary ? `${rolloutSummary.totalCount} capacidades` : "Sin rollout"} tone="blue" />
              </div>
            </Panel>

          </div>
          ) : null}
        </div>
      ) : null}
        </section>
      ) : null}

      {activeScope === "platform" && isPlatformPanelVisible ? (
        <section aria-label="Administracion de plataforma" className="space-y-5" id="settings-panel-platform" role="tabpanel">
          <SettingsScopeHeader
            accessLabel="Platform admin"
            description="Gobierna defaults SaaS, disponibilidad de providers, Hotmart, FinOps y trazabilidad global. Los cambios se aplican a la plataforma y afectan clientes, usuarios y workspaces que heredan configuracion global."
            eyebrow="Administracion global"
            icon={<ServerCog aria-hidden="true" className="h-5 w-5" />}
            id="settings-platform-title"
            title="Administracion de plataforma"
          />

          {showPlatformGeneralPanel ? (
            <Panel className="p-6">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <p className="text-[20px] font-semibold text-[var(--text-primary)]">Identidad y alcance global de plataforma</p>
                  <p className="text-[14px] leading-7 text-[var(--text-secondary)]">
                    Esta vista pertenece al Platform Admin. No configura un workspace aislado: define el contexto administrativo global desde el cual se gobiernan clientes, usuarios, proyectos, runtime, Hotmart y costos.
                  </p>
                </div>
                <Badge tone="green">Plataforma global</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Panel className="p-4">
                  <KeyValue label="Scope activo" value="Plataforma global" hint="No depende del workspace seleccionado en la cuenta" />
                </Panel>
                <Panel className="p-4">
                  <KeyValue label="Rol efectivo" value="Platform Admin" hint="Gobierno transversal de la plataforma" />
                </Panel>
                <Panel className="p-4">
                  <KeyValue label="Runtime default" value={platformDefaultsDraft?.active_provider ?? runtime?.active_provider ?? "Pendiente"} hint="Baseline administrado globalmente" />
                </Panel>
                <Panel className="p-4">
                  <KeyValue label="Workspaces visibles" value={`${platformWorkspaces.length}`} hint="Clientes/workspaces gobernados por plataforma" />
                </Panel>
              </div>
            </Panel>
          ) : null}

          {showPlatformBasePricesPanel ? <PlatformBasePricesAdminPanel /> : null}

          {showPlatformRegistryPanel ? (
          <Panel className="p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <p className="text-[20px] font-semibold text-[var(--text-primary)]">Baseline global del runtime</p>
                <p className="text-[14px] leading-7 text-[var(--text-secondary)]">
                  Define los valores heredados por workspaces sin override y mantiene la operacion multicliente bajo un contrato comun.
                </p>
              </div>
              <Badge tone="green">Platform admin</Badge>
            </div>

            {platformDefaultsDraft ? (
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <SelectField
                      label="Provider default"
                      value={platformDefaultsDraft.active_provider}
                      error={platformDefaultsErrors.active_provider}
                      options={PROVIDER_ORDER.map((providerKey) => ({
                        label: getProviderLabel(providerKey),
                        value: providerKey,
                      }))}
                      onValueChange={(value) =>
                        setPlatformDefaultsDraft((current) =>
                          current
                            ? {
                                ...current,
                                active_provider: value as LLMProviderKey,
                              }
                            : current,
                        )
                      }
                    />
                    <SelectField
                      label="Execution backend default"
                      value={platformDefaultsDraft.agent_execution_backend}
                      error={platformDefaultsErrors.agent_execution_backend}
                      options={[
                        { label: "provider_native", value: "provider_native" },
                        { label: "codex_cli", value: "codex_cli" },
                        { label: "shadow_codex_cli", value: "shadow_codex_cli" },
                      ]}
                      onValueChange={(value) =>
                        setPlatformDefaultsDraft((current) =>
                          current
                            ? {
                                ...current,
                                agent_execution_backend: value as LLMRuntimeSettingsUpdateRequest["agent_execution_backend"],
                              }
                            : current,
                        )
                      }
                    />
                    <SelectField
                      label="Knowledge backend default"
                      value={platformDefaultsDraft.knowledge_access_backend}
                      error={platformDefaultsErrors.knowledge_access_backend}
                      options={[
                        { label: "inline_context", value: "inline_context" },
                        { label: "workspace_staged", value: "workspace_staged" },
                        { label: "hybrid", value: "hybrid" },
                      ]}
                      onValueChange={(value) =>
                        setPlatformDefaultsDraft((current) =>
                          current
                            ? {
                                ...current,
                                knowledge_access_backend: value as LLMRuntimeSettingsUpdateRequest["knowledge_access_backend"],
                              }
                            : current,
                        )
                      }
                    />
                    <SelectField
                      label="Credencial default"
                      value={platformDefaultsDraft.uses_platform_credentials === false ? "workspace" : "platform"}
                      options={[
                        { label: "Plataforma", value: "platform" },
                        { label: "Workspace", value: "workspace" },
                      ]}
                      onValueChange={(value) =>
                        setPlatformDefaultsDraft((current) =>
                          current
                            ? {
                                ...current,
                                uses_platform_credentials: value === "workspace" ? false : true,
                              }
                            : current,
                        )
                      }
                    />
                  </div>

                  <div className="grid gap-4 lg:grid-cols-3">
                    <TextField
                      label="OpenAI fast model"
                      value={platformDefaultsDraft.openai.fast_model}
                      onValueChange={(value) =>
                        setPlatformDefaultsDraft((current) =>
                          current
                            ? {
                                ...current,
                                openai: {
                                  ...current.openai,
                                  fast_model: value,
                                },
                              }
                            : current,
                        )
                      }
                    />
                    <TextField
                      label="OpenAI reasoning model"
                      value={platformDefaultsDraft.openai.reasoning_model}
                      onValueChange={(value) =>
                        setPlatformDefaultsDraft((current) =>
                          current
                            ? {
                                ...current,
                                openai: {
                                  ...current.openai,
                                  reasoning_model: value,
                                },
                              }
                            : current,
                        )
                      }
                    />
                    <TextField
                      label="DeepSeek base URL"
                      value={platformDefaultsDraft.deepseek.base_url}
                      onValueChange={(value) =>
                        setPlatformDefaultsDraft((current) =>
                          current
                            ? {
                                ...current,
                                deepseek: {
                                  ...current.deepseek,
                                  base_url: value,
                                },
                              }
                            : current,
                        )
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4 rounded-[24px] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-5">
                  <KeyValue label="Scope" value="Platform defaults" hint="Aplica a workspaces sin override" />
                  <KeyValue label="Registry visible" value={`${platformProvidersState.data?.length ?? 0} providers`} hint="Catalogo gobernado" />
                  <KeyValue label="Workspaces visibles" value={`${platformWorkspaces.length}`} hint="Candidatos para dry-run y reset" />
                  <AppButton
                    onClick={() => void handleSavePlatformDefaults()}
                    loading={platformDefaultsPending}
                    disabled={!platformDefaultsHasChanges}
                    variant="primary"
                    icon={<Save className="h-4 w-4" />}
                  >
                    Guardar solo baseline
                  </AppButton>
                  <AppButton
                    onClick={() => void handleSaveAndPropagatePlatformDefaults("fallback_only", true)}
                    loading={runtimePropagationPending === "fallback_only"}
                    disabled={!platformDefaultsDraft}
                    icon={<TestTube2 className="h-4 w-4" />}
                  >
                    Guardar y previsualizar propagacion
                  </AppButton>
                  <AppButton
                    onClick={() => void handleSaveAndPropagatePlatformDefaults("reset_to_platform", false)}
                    loading={runtimePropagationPending === "reset_to_platform"}
                    disabled={!platformDefaultsDraft || selectedPropagationWorkspaceIds.length === 0}
                    icon={<RotateCcw className="h-4 w-4" />}
                  >
                    Resetear workspaces seleccionados
                  </AppButton>
                  <AppButton
                    className="text-[var(--danger)]"
                    onClick={() => void handleSaveAndPropagatePlatformDefaults("force_all", false)}
                    loading={runtimePropagationPending === "force_all"}
                    disabled={!platformDefaultsDraft}
                    icon={<ShieldCheck className="h-4 w-4" />}
                  >
                    Aplicar a todos los workspaces
                  </AppButton>
                </div>
              </div>
            ) : null}

            {platformDefaultsDraft ? (
              <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                <div className="rounded-[20px] border border-[var(--border-default)] bg-white p-4">
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-[14px] font-semibold text-[var(--text-primary)]">Workspaces para reset selectivo</p>
                      <p className="mt-1 text-[12px] leading-5 text-[var(--text-secondary)]">
                        Marca solo los workspaces que deben perder su override y volver a heredar plataforma.
                      </p>
                    </div>
                    <Badge tone="blue">{selectedPropagationWorkspaceIds.length} seleccionados</Badge>
                  </div>
                  {platformWorkspacesState.status === "loading" ? (
                    <p className="text-[13px] text-[var(--text-secondary)]">Cargando workspaces...</p>
                  ) : platformWorkspacesState.error ? (
                    <p className="text-[13px] font-medium text-[var(--danger)]">{platformWorkspacesState.error}</p>
                  ) : platformWorkspaces.length > 0 ? (
                    <div className="max-h-64 space-y-2 overflow-auto pr-1">
                      {platformWorkspaces.map((workspace) => {
                        const checked = selectedPropagationWorkspaceIds.includes(workspace.id);
                        return (
                          <label
                            className="flex cursor-pointer items-start gap-3 rounded-[14px] border border-[var(--border-default)] bg-[var(--surface-subtle)] px-3 py-2 text-[13px]"
                            key={workspace.id}
                          >
                            <input
                              checked={checked}
                              className="mt-1"
                              type="checkbox"
                              onChange={(event) =>
                                setSelectedPropagationWorkspaceIds((current) =>
                                  event.target.checked
                                    ? Array.from(new Set([...current, workspace.id]))
                                    : current.filter((workspaceId) => workspaceId !== workspace.id),
                                )
                              }
                            />
                            <span>
                              <span className="block font-semibold text-[var(--text-primary)]">{workspace.name}</span>
                              <span className="block text-[11px] text-[var(--text-muted)]">
                                {workspace.active_runtime_provider ?? "sin runtime"} · {workspace.id}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[13px] text-[var(--text-secondary)]">No hay workspaces globales visibles.</p>
                  )}
                </div>

                <div className="rounded-[20px] border border-[var(--border-default)] bg-white p-4">
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-[14px] font-semibold text-[var(--text-primary)]">Dry-run / resultado de propagacion</p>
                      <p className="mt-1 text-[12px] leading-5 text-[var(--text-secondary)]">
                        El preview vive aqui mismo para revisar impacto antes de forzar cambios globales.
                      </p>
                    </div>
                    {runtimePropagationPreview ? <Badge tone={getBadgeTone(runtimePropagationPreview.status)}>{runtimePropagationPreview.status}</Badge> : null}
                  </div>
                  {runtimePropagationPreview ? (
                    <div className="space-y-3">
                      <div className="grid gap-2 sm:grid-cols-4">
                        <StatRow label="Planificados" value={String(runtimePropagationPreview.planned_count)} tone="blue" />
                        <StatRow label="Aplicados" value={String(runtimePropagationPreview.applied_count)} tone="green" />
                        <StatRow label="Omitidos" value={String(runtimePropagationPreview.skipped_count)} tone="orange" />
                        <StatRow label="Fallidos" value={String(runtimePropagationPreview.failed_count)} tone={runtimePropagationPreview.failed_count > 0 ? "red" : "slate"} />
                      </div>
                      <div className="max-h-64 space-y-2 overflow-auto pr-1">
                        {runtimePropagationPreview.items.slice(0, 20).map((item) => (
                          <div className="rounded-[14px] border border-[var(--border-default)] bg-[var(--surface-subtle)] px-3 py-2" key={`${runtimePropagationPreview.id}-${item.workspace_id}`}>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-[13px] font-semibold text-[var(--text-primary)]">{item.workspace_name}</p>
                              <Badge tone={getBadgeTone(item.status)}>{item.status}</Badge>
                            </div>
                            <p className="mt-1 text-[12px] text-[var(--text-secondary)]">{item.action} · {item.detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[13px] text-[var(--text-secondary)]">
                      Usa “Guardar y previsualizar propagacion” para ver que workspaces heredarian plataforma y cuales se preservan por override.
                    </p>
                  )}
                </div>
              </div>
            ) : null}

            {platformFeedback ? <p className={`mt-5 text-[13px] font-medium ${getFeedbackToneClass(platformFeedback.tone)}`}>{platformFeedback.message}</p> : null}
            {platformProvidersState.error ? <p className="mt-2 text-[13px] font-medium text-[var(--danger)]">{platformProvidersState.error}</p> : null}
            {platformDefaultsState.error ? <p className="mt-2 text-[13px] font-medium text-[var(--danger)]">{platformDefaultsState.error}</p> : null}
          </Panel>
          ) : null}

          {showPlatformRegistryPanel && platformProvidersState.data && platformProviderDrafts ? (
            <Panel className="p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[20px] font-semibold text-[var(--text-primary)]">Provider registry</p>
                  <p className="text-[14px] leading-7 text-[var(--text-secondary)]">
                    Edita release stage, modelos permitidos y capacidades SaaS expuestas a los workspaces.
                  </p>
                </div>
                <Layers3 className="h-5 w-5 text-[var(--text-muted)]" />
              </div>

              <div className="overflow-hidden rounded-[18px] border border-[var(--border-default)] bg-white">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[var(--border-default)] bg-[var(--surface-subtle)] text-[12px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                      <th className="px-4 py-3 font-semibold">Provider</th>
                      <th className="hidden px-4 py-3 font-semibold md:table-cell">Estado</th>
                      <th className="hidden px-4 py-3 font-semibold lg:table-cell">Capacidades</th>
                      <th className="hidden px-4 py-3 font-semibold xl:table-cell">Modelos</th>
                      <th className="px-4 py-3 text-right font-semibold">Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {platformProvidersState.data.map((provider) => {
                      const draft = platformProviderDrafts[provider.provider_key];
                      const isExpanded = expandedPlatformProvider === provider.provider_key;

                      return (
                        <Fragment key={provider.provider_key}>
                          <tr className="border-b border-[var(--border-subtle)] align-top">
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-[13px] font-semibold text-[var(--text-primary)]">{draft.label || provider.label}</p>
                                <Badge className="md:hidden" tone={draft.is_enabled ? "green" : "slate"}>{draft.is_enabled ? "Enabled" : "Disabled"}</Badge>
                              </div>
                              <p className="mt-1 text-[12px] text-[var(--text-secondary)]">{provider.provider_key}</p>
                            </td>
                            <td className="hidden px-4 py-3 md:table-cell">
                              <div className="flex flex-col items-start gap-2">
                                <Badge tone={draft.is_enabled ? "green" : "slate"}>{draft.is_enabled ? "Enabled" : "Disabled"}</Badge>
                                <Badge tone={getBadgeTone(draft.release_stage)}>{draft.release_stage}</Badge>
                              </div>
                            </td>
                            <td className="hidden px-4 py-3 lg:table-cell">
                              <div className="flex flex-wrap gap-2">
                                <Badge tone={draft.supports_workspace_secrets ? "green" : "slate"}>Workspace secrets</Badge>
                                <Badge tone={draft.supports_platform_managed_credentials ? "blue" : "slate"}>Platform credentials</Badge>
                              </div>
                            </td>
                            <td className="hidden px-4 py-3 text-[12px] text-[var(--text-secondary)] xl:table-cell">
                              <span className="line-clamp-2">{draft.allowed_models_text || "Sin modelos permitidos"}</span>
                            </td>
                            <td className="px-4 py-2 text-right">
                              <button
                                aria-expanded={isExpanded}
                                aria-label={isExpanded ? `Contraer registry ${provider.label}` : `Expandir registry ${provider.label}`}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-[12px] border border-[var(--border-default)] bg-white text-[var(--brand-primary)] transition hover:bg-[var(--brand-soft)]"
                                type="button"
                                onClick={() => setExpandedPlatformProvider(isExpanded ? null : provider.provider_key)}
                              >
                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              </button>
                            </td>
                          </tr>
                          {isExpanded ? (
                            <tr className="border-b border-[var(--border-default)] bg-[var(--surface-subtle)]">
                              <td className="px-4 py-4" colSpan={5}>
                                <div className="grid gap-4 rounded-[18px] border border-[var(--border-default)] bg-white p-4 xl:grid-cols-[minmax(0,1fr)_260px]">
                                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                    <TextField
                                      label="Label"
                                      value={draft.label}
                                      onValueChange={(value) =>
                                        setPlatformProviderDrafts((current) =>
                                          current
                                            ? {
                                                ...current,
                                                [provider.provider_key]: {
                                                  ...current[provider.provider_key],
                                                  label: value,
                                                },
                                              }
                                            : current,
                                        )
                                      }
                                    />
                                    <SelectField
                                      label="Enabled"
                                      value={draft.is_enabled ? "yes" : "no"}
                                      options={[
                                        { label: "Si", value: "yes" },
                                        { label: "No", value: "no" },
                                      ]}
                                      onValueChange={(value) =>
                                        setPlatformProviderDrafts((current) =>
                                          current
                                            ? {
                                                ...current,
                                                [provider.provider_key]: {
                                                  ...current[provider.provider_key],
                                                  is_enabled: value === "yes",
                                                },
                                              }
                                            : current,
                                        )
                                      }
                                    />
                                    <SelectField
                                      label="Release stage"
                                      value={draft.release_stage}
                                      options={[
                                        { label: "preview", value: "preview" },
                                        { label: "general_availability", value: "general_availability" },
                                        { label: "deprecated", value: "deprecated" },
                                      ]}
                                      onValueChange={(value) =>
                                        setPlatformProviderDrafts((current) =>
                                          current
                                            ? {
                                                ...current,
                                                [provider.provider_key]: {
                                                  ...current[provider.provider_key],
                                                  release_stage: value as RuntimeProviderReleaseStage,
                                                },
                                              }
                                            : current,
                                        )
                                      }
                                    />
                                    <TextAreaField
                                      className="md:col-span-2"
                                      label="Allowed models (CSV)"
                                      value={draft.allowed_models_text}
                                      rows={3}
                                      onValueChange={(value) =>
                                        setPlatformProviderDrafts((current) =>
                                          current
                                            ? {
                                                ...current,
                                                [provider.provider_key]: {
                                                  ...current[provider.provider_key],
                                                  allowed_models_text: value,
                                                },
                                              }
                                            : current,
                                        )
                                      }
                                    />
                                    <TextAreaField
                                      label="Allowed auth modes (CSV)"
                                      value={draft.allowed_auth_modes_text}
                                      rows={3}
                                      onValueChange={(value) =>
                                        setPlatformProviderDrafts((current) =>
                                          current
                                            ? {
                                                ...current,
                                                [provider.provider_key]: {
                                                  ...current[provider.provider_key],
                                                  allowed_auth_modes_text: value,
                                                },
                                              }
                                            : current,
                                        )
                                      }
                                    />
                                    <SelectField
                                      label="Workspace secrets"
                                      value={draft.supports_workspace_secrets ? "yes" : "no"}
                                      options={[
                                        { label: "Si", value: "yes" },
                                        { label: "No", value: "no" },
                                      ]}
                                      onValueChange={(value) =>
                                        setPlatformProviderDrafts((current) =>
                                          current
                                            ? {
                                                ...current,
                                                [provider.provider_key]: {
                                                  ...current[provider.provider_key],
                                                  supports_workspace_secrets: value === "yes",
                                                },
                                              }
                                            : current,
                                        )
                                      }
                                    />
                                    <SelectField
                                      label="Platform credentials"
                                      value={draft.supports_platform_managed_credentials ? "yes" : "no"}
                                      options={[
                                        { label: "Si", value: "yes" },
                                        { label: "No", value: "no" },
                                      ]}
                                      onValueChange={(value) =>
                                        setPlatformProviderDrafts((current) =>
                                          current
                                            ? {
                                                ...current,
                                                [provider.provider_key]: {
                                                  ...current[provider.provider_key],
                                                  supports_platform_managed_credentials: value === "yes",
                                                },
                                              }
                                            : current,
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="space-y-3 rounded-[16px] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4">
                                    <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Default models</p>
                                    <p className="text-[12px] leading-6 text-[var(--text-secondary)]">{JSON.stringify(provider.default_models)}</p>
                                    <AppButton
                                      onClick={() => void handleSavePlatformProvider(provider.provider_key)}
                                      loading={platformProviderPending[provider.provider_key]}
                                      icon={<Save className="h-4 w-4" />}
                                    >
                                      Guardar provider
                                    </AppButton>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
          ) : null}

          {showPlatformRuntimeAuditPanel ? (
          <Panel className="p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-[20px] font-semibold text-[var(--text-primary)]">Auditoria de runtime</p>
                <p className="text-[14px] leading-7 text-[var(--text-secondary)]">
                  Cambios de plataforma visibles para trazabilidad, cumplimiento y soporte multicliente.
                </p>
              </div>
              <BadgeCheck className="h-5 w-5 text-[var(--text-muted)]" />
            </div>
            {platformAuditState.data && platformAuditState.data.length > 0 ? (
              <>
              <div className="overflow-hidden rounded-[18px] border border-[var(--border-default)] bg-white">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[var(--border-default)] bg-[var(--surface-subtle)] text-[12px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                      <th className="px-4 py-3 font-semibold">Evento</th>
                      <th className="hidden px-4 py-3 font-semibold md:table-cell">Scope</th>
                      <th className="hidden px-4 py-3 font-semibold lg:table-cell">Actor</th>
                      <th className="hidden px-4 py-3 font-semibold xl:table-cell">Fecha</th>
                      <th className="px-4 py-3 text-right font-semibold">Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {platformAuditState.data.map((entry, index) => {
                      const auditKey = `${String(entry.id)}-${index}`;
                      const isExpanded = expandedPlatformAuditEntry === auditKey;

                      return (
                        <Fragment key={auditKey}>
                          <tr className="border-b border-[var(--border-subtle)] align-top">
                            <td className="px-4 py-3">
                              <p className="text-[13px] font-semibold text-[var(--text-primary)]">{String(entry.change_type)}</p>
                              <p className="mt-1 text-[12px] text-[var(--text-secondary)] lg:hidden">
                                {String(entry.actor_email || "system")} · {formatDateTime(String(entry.created_at))}
                              </p>
                            </td>
                            <td className="hidden px-4 py-3 md:table-cell">
                              <Badge tone="blue">{String(entry.scope_id)}</Badge>
                            </td>
                            <td className="hidden px-4 py-3 text-[12px] text-[var(--text-secondary)] lg:table-cell">
                              {String(entry.actor_email || "system")}
                            </td>
                            <td className="hidden px-4 py-3 text-[12px] text-[var(--text-secondary)] xl:table-cell">
                              {formatDateTime(String(entry.created_at))}
                            </td>
                            <td className="px-4 py-2 text-right">
                              <button
                                aria-expanded={isExpanded}
                                aria-label={isExpanded ? `Contraer auditoria ${String(entry.change_type)}` : `Expandir auditoria ${String(entry.change_type)}`}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-[12px] border border-[var(--border-default)] bg-white text-[var(--brand-primary)] transition hover:bg-[var(--brand-soft)]"
                                type="button"
                                onClick={() => setExpandedPlatformAuditEntry(isExpanded ? null : auditKey)}
                              >
                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              </button>
                            </td>
                          </tr>
                          {isExpanded ? (
                            <tr className="border-b border-[var(--border-default)] bg-[var(--surface-subtle)]">
                              <td className="px-4 py-4" colSpan={5}>
                                <div className="grid gap-3 md:grid-cols-3">
                                  <KeyValue label="Scope type" value={String(entry.scope_type || "n/a")} hint="Ambito del cambio" />
                                  <KeyValue label="Scope id" value={String(entry.scope_id || "n/a")} hint="Identificador afectado" />
                                  <KeyValue label="Actor" value={String(entry.actor_email || "system")} hint={String(entry.actor_user_id || "Sin user id")} />
                                </div>
                                <pre className="mt-4 max-h-[260px] overflow-auto rounded-[16px] border border-[var(--border-default)] bg-white p-4 text-[11px] leading-5 text-[var(--text-secondary)]">
                                  {JSON.stringify(entry, null, 2)}
                                </pre>
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              </>
            ) : platformAuditState.error ? (
              <ErrorState title="Auditoria no disponible" description={platformAuditState.error} />
            ) : (
              <EmptyState className="px-0 py-4" title="Sin eventos recientes" description="Todavia no hay cambios de plataforma para mostrar." />
            )}
          </Panel>
          ) : null}
        </section>
      ) : null}

      {!isHotmartConfigActive && activeScope === "workspace" && listStatus === "error" ? (
        <Panel className="p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-[var(--warning)]" />
            <div className="space-y-1">
              <p className="text-[15px] font-semibold text-[var(--text-primary)]">La lista de sesiones no esta disponible</p>
              <p className="text-[13px] leading-6 text-[var(--text-secondary)]">
                {listError?.message ?? "No se pudo recuperar la lista de sesiones, pero el runtime del workspace sigue operativo."}
              </p>
            </div>
          </div>
        </Panel>
      ) : null}
        </div>
      </AdminSettingsConsoleShell>
      ) : (
        standalonePersonalContent
      )}
    </OperationsModuleShell>
  );
}
