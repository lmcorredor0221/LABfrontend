"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type KeyboardEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  CircleUserRound,
  Copy,
  ExternalLink,
  FolderKanban,
  KeyRound,
  Layers3,
  LockKeyhole,
  RefreshCcw,
  RotateCcw,
  Save,
  ServerCog,
  ShieldCheck,
  Sparkles,
  TestTube2,
} from "lucide-react";
import { AppButton, Badge, KeyValue, Panel, SelectField, StatRow, TextAreaField, TextField } from "@/components/lean/ui";
import { ProviderAccordion } from "@/features/operations/components/provider-accordion";
import { type SettingsCategory, SettingsTabsNav } from "@/features/operations/components/settings-tabs-nav";
import { apiClient } from "@/core/api";
import { ApiError } from "@/core/api/errors";
import { useAuth } from "@/core/auth/auth-context";
import { useCurrency } from "@/core/commerce/currency-context";
import { useLanguage } from "@/core/i18n/language-context";
import { formatPriceValue } from "@/core/commerce/trm-service";
import type { WorkspaceRole } from "@/core/auth/types";
import { byLanguage } from "@/features/product-experience/core/localized-copy";
import { cn } from "@/lib/utils";
import { runtimeApi, type RuntimeStatusResponse } from "@/core/system/runtime-api";
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
  PlatformRuntimeProviderResponse,
  RuntimeProviderReleaseStage,
  WorkspaceProviderSecretUpsertRequest,
  WorkspaceRuntimeHealthResponse,
} from "@/features/sessions/session-contracts";
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
type SettingsScope = "personal" | "platform" | "workspace";
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
const WORKSPACE_RUNTIME_ADMIN_ROLES = new Set<WorkspaceRole>(["owner", "admin"]);

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

function UserCurrencyPreferencePanel() {
  const { currency, setCurrency, trm } = useCurrency();
  const { language, t } = useLanguage();

  return (
    <Panel className="border-[var(--border-default)] bg-white p-5 lg:p-6 space-y-4">
      <div>
        <Badge tone="blue">{t("settings.currencyDisplayBadge", "Moneda de Visualización")}</Badge>
        <h3 className="mt-2 text-[18px] font-semibold text-[var(--text-primary)]">
          {t("settings.personalCurrencyTitle", "Preferencia Personal de Moneda")}
        </h3>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
          {t("settings.personalCurrencyDesc", "Selecciona la moneda en la que deseas visualizar los precios en toda la plataforma.")}
        </p>
      </div>

      <div className="rounded-[12px] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-[14px] font-semibold text-[var(--text-primary)]">{t("settings.preferredCurrencyLabel", "Moneda Preferida")}</p>
            <p className="text-[12px] text-[var(--text-secondary)]">
              {t("settings.preferredCurrencyDesc", "Dólares (USD) o Pesos Colombianos (COP) según TRM oficial vigente del día.")}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setCurrency("USD")}
              className={cn(
                "h-9 px-4 rounded-[8px] text-[13px] font-semibold transition border",
                currency === "USD"
                  ? "bg-[var(--brand-primary)] text-white border-transparent shadow-sm"
                  : "bg-white text-[var(--text-primary)] border-[var(--border-default)] hover:bg-black/5"
              )}
            >
              {byLanguage(language, { en: "USD ($)", es: "USD ($)", pt: "USD ($)" })}
            </button>
            <button
              type="button"
              onClick={() => setCurrency("COP")}
              className={cn(
                "h-9 px-4 rounded-[8px] text-[13px] font-semibold transition border",
                currency === "COP"
                  ? "bg-[var(--brand-primary)] text-white border-transparent shadow-sm"
                  : "bg-white text-[var(--text-primary)] border-[var(--border-default)] hover:bg-black/5"
              )}
            >
              {byLanguage(language, { en: "COP ($)", es: "COP ($)", pt: "COP ($)" })}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[var(--border-default)] text-[12px] text-[var(--text-secondary)]">
          <span className="font-semibold text-[var(--brand-primary)]">
            {t("settings.trmCurrentLabel", "TRM Vigente Hoy")}: {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(trm.trm_cop)} COP/USD
          </span>
          <span>·</span>
          <span>{t("settings.trmDateLabel", "Fecha TRM")}: {trm.date || "Hoy"}</span>
          <span>·</span>
          <span className="text-[11px] text-[var(--text-muted)]">{t("settings.trmSourceLabel", "Fuente")}: datos.gov.co (SICS Colombia)</span>
        </div>
      </div>
    </Panel>
  );
}

function UserPrivacyConsentsPanel() {
  const [consents, setConsents] = useState({
    consent_system_notifications: false,
    consent_commercial_promotions: false,
    consent_events_newsletters: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void loadConsents();
  }, []);

  async function loadConsents() {
    try {
      const data = await apiClient.get<{
        consent_system_notifications: boolean;
        consent_commercial_promotions: boolean;
        consent_events_newsletters: boolean;
      }>("/api/v1/auth/consents");
      setConsents({
        consent_system_notifications: Boolean(data.consent_system_notifications),
        consent_commercial_promotions: Boolean(data.consent_commercial_promotions),
        consent_events_newsletters: Boolean(data.consent_events_newsletters),
      });
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveConsents() {
    setSaving(true);
    setMessage("");
    try {
      await apiClient.patch("/api/v1/auth/consents", {
        body: consents,
      });
      setMessage("Preferencias de consentimientos de privacidad actualizadas correctamente.");
      setTimeout(() => setMessage(""), 3500);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error al actualizar consentimientos.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel className="p-6">
      <div className="space-y-4">
        <div>
          <Badge tone="violet">Privacidad & Habeas Data</Badge>
          <h3 className="mt-2 text-[18px] font-semibold text-[var(--text-primary)]">
            Consentimientos de Comunicación Opcionales
          </h3>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
            Puedes activar o desactivar independientemente las autorizaciones de contacto en cualquier momento.
          </p>
        </div>

        {loading ? (
          <p className="text-[13px] text-[var(--text-muted)]">Cargando preferencias...</p>
        ) : (
          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-3 text-[13px] text-[var(--text-primary)] cursor-pointer">
              <input
                type="checkbox"
                checked={consents.consent_system_notifications}
                onChange={(e) =>
                  setConsents((prev) => ({ ...prev, consent_system_notifications: e.target.checked }))
                }
                className="h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)]"
              />
              <span>Recibir notificaciones operativas del sistema de la plataforma.</span>
            </label>

            <label className="flex items-center gap-3 text-[13px] text-[var(--text-primary)] cursor-pointer">
              <input
                type="checkbox"
                checked={consents.consent_commercial_promotions}
                onChange={(e) =>
                  setConsents((prev) => ({ ...prev, consent_commercial_promotions: e.target.checked }))
                }
                className="h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)]"
              />
              <span>Recibir comunicaciones comerciales, promociones y ofertas especiales.</span>
            </label>

            <label className="flex items-center gap-3 text-[13px] text-[var(--text-primary)] cursor-pointer">
              <input
                type="checkbox"
                checked={consents.consent_events_newsletters}
                onChange={(e) =>
                  setConsents((prev) => ({ ...prev, consent_events_newsletters: e.target.checked }))
                }
                className="h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)]"
              />
              <span>Recibir información sobre novedades, lanzamientos de características y boletines de eventos.</span>
            </label>

            {message ? (
              <p className="text-[12px] font-medium text-[var(--brand-primary)] pt-1">{message}</p>
            ) : null}

            <div className="pt-2">
              <AppButton
                onClick={() => void handleSaveConsents()}
                loading={saving}
                variant="primary"
                className="h-9 rounded-[8px] px-4 text-[13px]"
              >
                Guardar Preferencias de Privacidad
              </AppButton>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}

function UserLanguagePreferencePanel() {
  const { language, setLanguage, languages, t } = useLanguage();
  const [message, setMessage] = useState("");

  function handleLanguageChange(code: "es" | "en" | "pt") {
    setLanguage(code);
    setMessage(t("settings.saveLangSuccess"));
    setTimeout(() => {
      setMessage("");
    }, 3000);
  }

  return (
    <Panel className="p-6">
      <div className="space-y-4">
        <div>
          <Badge tone="blue">{t("nav.switchLanguage")}</Badge>
          <h3 className="mt-2 text-[18px] font-semibold text-[var(--text-primary)]">
            {t("settings.langPanelTitle")}
          </h3>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
            {t("settings.langPanelSubtitle")}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          {languages.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => handleLanguageChange(item.code)}
              className={cn(
                "flex items-center gap-2.5 h-10 px-5 rounded-[10px] text-[13px] font-semibold transition border",
                language === item.code
                  ? "bg-[var(--brand-primary)] text-white border-transparent shadow-sm"
                  : "bg-white text-[var(--text-primary)] border-[var(--border-default)] hover:bg-black/5"
              )}
            >
              <span className="text-[16px]">{item.flag}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {message ? (
          <p className="text-[12px] font-medium text-[var(--brand-primary)] pt-1">{message}</p>
        ) : null}
      </div>
    </Panel>
  );
}

function PlatformBasePricesAdminPanel() {
  const { trm } = useCurrency();
  const [blueprintProUsd, setBlueprintProUsd] = useState(60);
  const [acpPremiumUsd, setAcpPremiumUsd] = useState(220);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    void loadBasePrices();
  }, []);

  async function loadBasePrices() {
    try {
      const data = await apiClient.get<{ blueprint_pro_usd: number; acp_premium_usd: number }>("/api/v1/commerce/base-prices");
      if (data.blueprint_pro_usd) setBlueprintProUsd(data.blueprint_pro_usd);
      if (data.acp_premium_usd) setAcpPremiumUsd(data.acp_premium_usd);
    } catch {
      // fallback
    }
  }

  async function handleSavePrices() {
    setSaveStatus("saving");
    try {
      await apiClient.patch("/api/v1/commerce/base-prices", {
        body: {
          blueprint_pro_usd: Number(blueprintProUsd),
          acp_premium_usd: Number(acpPremiumUsd),
        },
      });
      setSaveStatus("saved");
      setSaveMessage("Precios base en USD de la plataforma actualizados exitosamente.");
      setTimeout(() => setSaveStatus("idle"), 3500);
    } catch (err) {
      setSaveStatus("error");
      setSaveMessage(err instanceof Error ? err.message : "Error al actualizar los precios base.");
    }
  }

  return (
    <Panel className="border-[var(--border-default)] bg-white p-5 lg:p-6 space-y-5">
      <div>
        <Badge tone="blue">Gobierno de Plataforma</Badge>
        <h3 className="mt-2 text-[20px] font-semibold text-[var(--text-primary)]">
          Administración de Precios Base (USD)
        </h3>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
          Configuración transversal de la plataforma. Defina los precios base en dólares estadounidenses (USD) que el sistema utiliza para calcular los planes de todos los usuarios.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-[12px] font-semibold text-[var(--text-secondary)] mb-1">
            Blueprint Profesional (USD)
          </label>
          <div className="flex items-center rounded-[8px] border border-[var(--border-default)] bg-white px-3 py-2">
            <span className="text-[14px] text-[var(--text-secondary)] mr-2">$</span>
            <input
              type="number"
              min="0"
              step="1"
              value={blueprintProUsd}
              onChange={(e) => setBlueprintProUsd(Number(e.target.value))}
              className="w-full text-[14px] font-semibold text-[var(--text-primary)] outline-none bg-transparent"
            />
            <span className="text-[12px] text-[var(--text-muted)] ml-2">USD</span>
          </div>
          <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
            Equivalente COP actual: <strong className="text-[var(--text-primary)]">{formatPriceValue(blueprintProUsd, "COP", trm.trm_cop)}</strong>
          </p>
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-[var(--text-secondary)] mb-1">
            ACP Premium (USD)
          </label>
          <div className="flex items-center rounded-[8px] border border-[var(--border-default)] bg-white px-3 py-2">
            <span className="text-[14px] text-[var(--text-secondary)] mr-2">$</span>
            <input
              type="number"
              min="0"
              step="1"
              value={acpPremiumUsd}
              onChange={(e) => setAcpPremiumUsd(Number(e.target.value))}
              className="w-full text-[14px] font-semibold text-[var(--text-primary)] outline-none bg-transparent"
            />
            <span className="text-[12px] text-[var(--text-muted)] ml-2">USD</span>
          </div>
          <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
            Equivalente COP actual: <strong className="text-[var(--text-primary)]">{formatPriceValue(acpPremiumUsd, "COP", trm.trm_cop)}</strong>
          </p>
        </div>
      </div>

      {saveMessage ? (
        <p className={cn("text-[12px]", saveStatus === "saved" ? "text-emerald-600 font-medium" : "text-red-600 font-medium")}>
          {saveMessage}
        </p>
      ) : null}

      <AppButton
        onClick={() => void handleSavePrices()}
        loading={saveStatus === "saving"}
        variant="primary"
        className="h-10 rounded-[9px] px-5"
      >
        Guardar Precios Base (USD)
      </AppButton>
    </Panel>
  );
}

function SettingsScopeNavigation({
  activeScope,
  canManageWorkspace,
  canManagePlatform,
  onScopeChange,
}: {
  activeScope: SettingsScope;
  canManageWorkspace: boolean;
  canManagePlatform: boolean;
  onScopeChange(scope: SettingsScope): void;
}) {
  const { language } = useLanguage();
  const items: Array<{
    description: string;
    icon: ReactNode;
    label: string;
    scope: SettingsScope;
    status: string;
    unavailable?: boolean;
  }> = [
    {
      description: byLanguage(language, {
        en: "Identity, membership, and options tied to your access.",
        es: "Identidad, membresia y opciones asociadas a tu acceso.",
        pt: "Identidade, vinculacao e opcoes associadas ao seu acesso.",
      }),
      icon: <CircleUserRound aria-hidden="true" className="h-5 w-5" />,
      label: byLanguage(language, {
        en: "Account and access",
        es: "Cuenta y acceso",
        pt: "Conta e acesso",
      }),
      scope: "personal",
      status: byLanguage(language, {
        en: "All users",
        es: "Todos los usuarios",
        pt: "Todos os usuarios",
      }),
    },
    {
      description: byLanguage(language, {
        en: "Runtime, models, credentials, and controls for the active workspace.",
        es: "Runtime, modelos, credenciales y controles del workspace activo.",
        pt: "Runtime, modelos, credenciais e controles do workspace ativo.",
      }),
      icon: <Building2 aria-hidden="true" className="h-5 w-5" />,
      label: "Workspace",
      scope: "workspace",
      status: canManageWorkspace
        ? byLanguage(language, { en: "Owner / Admin", es: "Owner / Admin", pt: "Owner / Admin" })
        : byLanguage(language, { en: "Restricted access", es: "Acceso restringido", pt: "Acesso restrito" }),
    },
    {
      description: byLanguage(language, {
        en: "Global defaults, provider registry, and multi-tenant audit controls.",
        es: "Defaults globales, registry de providers y auditoria multicliente.",
        pt: "Defaults globais, registry de providers e auditoria multicliente.",
      }),
      icon: <ServerCog aria-hidden="true" className="h-5 w-5" />,
      label: byLanguage(language, { en: "Platform", es: "Plataforma", pt: "Plataforma" }),
      scope: "platform",
      status: canManagePlatform
        ? byLanguage(language, { en: "Platform admin", es: "Platform admin", pt: "Admin da plataforma" })
        : byLanguage(language, { en: "Unavailable", es: "No disponible", pt: "Indisponivel" }),
      unavailable: !canManagePlatform,
    },
  ];

  function handleScopeKeyDown(event: KeyboardEvent<HTMLButtonElement>, currentScope: SettingsScope) {
    const availableItems = items.filter((item) => !item.unavailable);
    const currentIndex = availableItems.findIndex((item) => item.scope === currentScope);
    let nextIndex = currentIndex;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % availableItems.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (currentIndex - 1 + availableItems.length) % availableItems.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = availableItems.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    const nextScope = availableItems[nextIndex].scope;
    const tablist = event.currentTarget.parentElement;
    tablist?.querySelector<HTMLButtonElement>(`[data-settings-scope="${nextScope}"]`)?.focus();
    onScopeChange(nextScope);
  }

  return (
    <nav
      aria-label={byLanguage(language, {
        en: "Configuration scopes",
        es: "Ambitos de configuracion",
        pt: "Escopos de configuracao",
      })}
      className="rounded-[12px] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-2"
    >
      <div
        className="grid gap-2 lg:grid-cols-3"
        role="tablist"
        aria-label={byLanguage(language, {
          en: "Select configuration scope",
          es: "Seleccionar ambito de configuracion",
          pt: "Selecionar escopo de configuracao",
        })}
      >
        {items.map((item) => {
          const active = item.scope === activeScope;
          return (
            <button
              aria-controls={`settings-panel-${item.scope}`}
              aria-selected={active}
              className={`group flex min-h-[84px] items-start gap-3 rounded-[10px] border px-4 py-3 text-left transition ${
                active
                  ? "border-[var(--brand-primary)] bg-white shadow-[var(--shadow-card)]"
                  : "border-transparent bg-transparent hover:border-[var(--border-default)] hover:bg-white"
              } disabled:cursor-not-allowed disabled:opacity-55`}
              disabled={item.unavailable}
              data-settings-scope={item.scope}
              key={item.scope}
              onClick={() => onScopeChange(item.scope)}
              onKeyDown={(event) => handleScopeKeyDown(event, item.scope)}
              role="tab"
              tabIndex={active ? 0 : -1}
              type="button"
            >
              <span
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] ${
                  active ? "bg-[var(--brand-primary)] text-white" : "bg-white text-[var(--text-secondary)]"
                }`}
              >
                {item.unavailable ? <LockKeyhole aria-hidden="true" className="h-4 w-4" /> : item.icon}
              </span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-[14px] font-semibold text-[var(--text-primary)]">{item.label}</span>
                  <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-secondary)]">
                    {item.status}
                  </span>
                </span>
                <span className="mt-1 block text-[12px] leading-5 text-[var(--text-secondary)]">{item.description}</span>
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function SettingsScopeHeader({
  accessLabel,
  description,
  eyebrow,
  icon,
  id,
  title,
}: {
  accessLabel: string;
  description: string;
  eyebrow: string;
  icon: ReactNode;
  id: string;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-[12px] border border-[var(--border-default)] bg-white p-5 md:flex-row md:items-start md:justify-between">
      <div className="flex items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[var(--brand-soft)] text-[var(--brand-primary)]">{icon}</span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">{eyebrow}</p>
          <h2 className="mt-1 text-[22px] font-semibold leading-tight text-[var(--text-primary)]" id={id}>{title}</h2>
          <p className="mt-2 max-w-3xl text-[13px] leading-6 text-[var(--text-secondary)]">{description}</p>
        </div>
      </div>
      <Badge tone="blue">{accessLabel}</Badge>
    </div>
  );
}

function SettingsAnchorMap() {
  const { language } = useLanguage();
  const items = [
    [byLanguage(language, { en: "Runtime and models", es: "Runtime y modelos", pt: "Runtime e modelos" }), "#workspace-runtime"],
    [byLanguage(language, { en: "Credentials", es: "Credenciales", pt: "Credenciais" }), "#workspace-credentials"],
    [byLanguage(language, { en: "Automation", es: "Automatizacion", pt: "Automacao" }), "#workspace-automation"],
    [byLanguage(language, { en: "Diagnostics", es: "Diagnostico", pt: "Diagnostico" }), "#workspace-diagnostics"],
  ];

  return (
    <nav
      aria-label={byLanguage(language, {
        en: "Workspace administration sections",
        es: "Secciones de administracion del workspace",
        pt: "Secoes de administracao do workspace",
      })}
      className="flex flex-wrap gap-2"
    >
      {items.map(([label, href]) => (
        <a className="inline-flex min-h-10 items-center rounded-[8px] border border-[var(--border-default)] bg-white px-3 text-[12px] font-semibold text-[var(--text-secondary)] transition hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]" href={href} key={href}>
          {label}
        </a>
      ))}
    </nav>
  );
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

function FeatureFlagRow({
  flag,
  error,
  onToggle,
  pending,
}: {
  error?: string | null;
  flag: FeatureFlagEntry;
  onToggle: () => void;
  pending?: boolean;
}) {
  return (
    <Panel className="border-[var(--border-default)] p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <p className="text-[16px] font-semibold text-[var(--text-primary)]">{flag.key}</p>
            <Badge tone={flag.enabled ? "green" : "slate"}>{flag.enabled ? "Activo" : "Inactivo"}</Badge>
          </div>
          <p className="text-[14px] leading-6 text-[var(--text-secondary)]">{flag.description}</p>
          <p className="text-[12px] text-[var(--text-muted)]">Stage hint: {flag.stage_hint || "n/a"}</p>
        </div>
        <AppButton onClick={onToggle} loading={pending} variant={flag.enabled ? "secondary" : "primary"}>
          {flag.enabled ? "Desactivar" : "Activar"}
        </AppButton>
      </div>
      {error ? <p className="mt-3 text-[13px] font-medium text-[var(--danger)]">{error}</p> : null}
    </Panel>
  );
}

export function SettingsWorkspacePage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const activeWorkspaceId = user?.active_workspace_id ?? null;
  const activeMembership = user?.workspaces.find((workspace) => workspace.workspace_id === activeWorkspaceId) ?? null;
  const workspaceRole = activeMembership?.role ?? null;
  const hasWorkspaceAdminRole = workspaceRole ? WORKSPACE_RUNTIME_ADMIN_ROLES.has(workspaceRole) : false;
  const [activeScope, setActiveScope] = useState<SettingsScope>(hasWorkspaceAdminRole ? "workspace" : "personal");
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>("providers");
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

  const [secretDrafts, setSecretDrafts] = useState<SecretDraftMap | null>(null);
  const [secretPending, setSecretPending] = useState<SecretPendingMap>({});
  const [secretFeedback, setSecretFeedback] = useState<FeedbackState | null>(null);
  const [runtimeStatusRefreshPending, setRuntimeStatusRefreshPending] = useState(false);
  const [smokeCommandFeedback, setSmokeCommandFeedback] = useState<string | null>(null);

  const [flagPending, setFlagPending] = useState<Record<string, boolean>>({});
  const [flagErrors, setFlagErrors] = useState<Record<string, string>>({});

  const sessionOptions = items.map((item) => ({
    label: item.title,
    value: item.id,
  }));
  const featureFlags = selectedSnapshot?.workspace_contract?.feature_flags ?? [];
  const featureFlagSummary = buildFeatureFlagSummary(featureFlags);
  const isPlatformPanelVisible = Boolean(platformProvidersState.data && platformDefaultsState.data);
  const canManageWorkspaceRuntime = isPlatformPanelVisible || hasWorkspaceAdminRole;

  const loadPlatformPanel = useCallback(async () => {
    setPlatformProvidersState({ data: null, error: null, status: "loading" });
    setPlatformDefaultsState({ data: null, error: null, status: "loading" });
    setPlatformAuditState({ data: null, error: null, status: "loading" });

    const [providersResult, defaultsResult, auditResult] = await Promise.allSettled([
      runtimeApi.listPlatformProviders(),
      runtimeApi.getPlatformDefaults(),
      runtimeApi.getPlatformAudit(12),
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
  }, []);

  const loadWorkspacePanel = useCallback(
    async (options?: { keepRuntime?: boolean; keepStatus?: boolean }) => {
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
    [getEstimationCalibration, getRuntimeSettings],
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
  const selectedProvider = runtimeDraft?.active_provider ?? runtime?.active_provider ?? "openai";
  const executionBackendCopy = getAgentExecutionBackendCopy(runtimeDraft?.agent_execution_backend ?? "provider_native", t);
  const knowledgeBackendCopy = getKnowledgeAccessBackendCopy(runtimeDraft?.knowledge_access_backend ?? "inline_context", t);
  const rolloutSummary = runtimeDraft ? buildCodexRolloutSummary(runtimeDraft.codex_local) : null;
  const codexRuntimeSummary = runtime ? buildCodexRuntimeSummary(runtime, runtimeStatus) : null;
  const memoryRollout = runtime?.memory_rollout ?? null;
  const getFieldOriginLabel = (fieldPath: string) => (runtime ? getRuntimeFieldOriginLabel(runtime, fieldPath, t) : "");
  const getSecretLabel = (source: string) => getSecretSourceLabel(source, t);
  const copy = (en: string, es: string, pt: string) => byLanguage(language, { en, es, pt });

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
      onSessionChange={(value) => void selectOperationalSession(value)}
      actions={
        <>
          {activeScope === "workspace" && selectedSession ? (
            <AppButton onClick={() => router.push(getSessionProjectRoute(selectedSession))} icon={<FolderKanban className="h-4 w-4" />}>
              {t("settings.backToProject", "Volver al proyecto")}
            </AppButton>
          ) : activeScope === "workspace" ? (
            <AppButton onClick={() => void handleCreateSession()} icon={<Sparkles className="h-4 w-4" />}>
              {t("settings.createSession", "Crear sesión")}
            </AppButton>
          ) : null}
          {activeScope === "workspace" ? (
            <AppButton onClick={() => void loadWorkspacePanel()} icon={<RefreshCcw className="h-4 w-4" />}>
              {t("settings.refreshWorkspaceTop", "Refrescar workspace")}
            </AppButton>
          ) : null}
          {activeScope === "platform" && isPlatformPanelVisible ? (
            <>
              <AppButton onClick={() => router.push("/settings/diagram-governance")} icon={<Layers3 className="h-4 w-4" />}>
                {copy("Diagram governance", "Gobierno de diagramas", "Governanca de diagramas")}
              </AppButton>
              <AppButton onClick={() => void loadPlatformPanel()} icon={<ServerCog className="h-4 w-4" />}>
                {t("settings.refreshPlatform", "Refrescar plataforma")}
              </AppButton>
            </>
          ) : null}
        </>
      }
    >
      <div className="settings-center space-y-5">
      <SettingsTabsNav
        activeScope={activeScope}
        activeCategory={activeCategory}
        isPlatformAdmin={isPlatformPanelVisible}
        onScopeChange={setActiveScope}
        onCategoryChange={setActiveCategory}
      />

      {activeScope === "personal" ? (
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

          <Panel className="p-5">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center">
              <div>
                <p className="text-[16px] font-semibold text-[var(--text-primary)]">{t("settings.personalPlanTitle", "Plan, permisos y capacidades")}</p>
                <p className="mt-2 max-w-3xl text-[13px] leading-6 text-[var(--text-secondary)]">
                  {t("settings.personalPlanDesc", "Revisa las capacidades disponibles para tu workspace y entiende qué funciones dependen del plan o de un permiso administrativo.")}
                </p>
              </div>
              <Link
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[8px] border border-[var(--brand-primary)] bg-[var(--brand-primary)] px-4 text-[13px] font-semibold text-white transition hover:brightness-95"
                href="/settings/plan-access"
                style={{ color: "#ffffff" }}
              >
                {t("settings.openPlanAccess", "Abrir plan y acceso")} <ExternalLink aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
          </Panel>

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
                    : t("settings.adminProtectedDesc", "Tu experiencia se limita a cuenta y acceso. Un owner o admin gestiona providers, secretos y políticas técnicas.")}
                </p>
              </div>
            </div>
          </Panel>
        </section>
      ) : null}

      {activeScope === "workspace" && !canManageWorkspaceRuntime ? (
        <section aria-label={copy("Restricted workspace administration", "Administracion del workspace restringida", "Administracao restrita do workspace")} className="space-y-5" id="settings-panel-workspace" role="tabpanel">
          <SettingsScopeHeader
            accessLabel={t("settings.workspaceScopeRestrictedLabel", "Owner / Admin")}
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
                <p className="text-[16px] font-semibold text-[var(--text-primary)]">{t("settings.adminRoleRequired", "Se requiere una membresía owner o admin")}</p>
                <p className="mt-2 text-[13px] leading-6 text-[var(--text-secondary)]">
                  {t("settings.adminRoleDesc", "Solicita el cambio de rol a un administrador del workspace. No se muestran formularios editables para evitar que la configuración técnica parezca una preferencia personal.")}
                </p>
              </div>
            </div>
          </Panel>
        </section>
      ) : null}

      {activeScope === "workspace" && canManageWorkspaceRuntime ? (
        <section aria-label={copy("Workspace administration", "Administracion del workspace", "Administracao do workspace")} className="space-y-5" id="settings-panel-workspace" role="tabpanel">
          <SettingsScopeHeader
            accessLabel={t("settings.workspaceScopeLabel", "Owner / Admin")}
            description={t("settings.workspaceScopeDesc", "Configura el runtime efectivo, sus credenciales y controles operativos. Los cambios de este ámbito afectan al workspace activo, no solo a tu cuenta.")}
            eyebrow={copy("Administration", "Administracion", "Administracao")}
            icon={<Building2 aria-hidden="true" className="h-5 w-5" />}
            id="settings-workspace-title"
            title={t("settings.scope.workspace", "Workspace & LLM Runtime")}
          />
          <SettingsAnchorMap />

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
            hint={runtimeHealth?.provider_label ?? (canManageWorkspaceRuntime ? copy("No diagnostics", "Sin diagnostico", "Sem diagnostico") : copy("Available for owner/admin", "Disponible para owner/admin", "Disponivel para owner/admin"))}
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
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_360px]">
          <div className="space-y-5">
            <Panel className="p-5" id="workspace-runtime">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-[20px] font-semibold text-[var(--text-primary)]">{t("settings.gov.title", "Runtime efectivo del workspace")}</p>
                  <p className="text-[14px] leading-7 text-[var(--text-secondary)]">
                    {t("settings.gov.subtitle", "Define el provider, los backends y el origen de credenciales del workspace. Cada valor indica si proviene de plataforma o de un override local.")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
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
                    disabled={!canManageWorkspaceRuntime}
                    variant="primary"
                    icon={<Save className="h-4 w-4" />}
                  >
                    {t("settings.btn.saveWorkspace", "Guardar workspace")}
                  </AppButton>
                </div>
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
            </Panel>

            <div className="space-y-4">
              <ProviderAccordion
                id="openai"
                title="OpenAI"
                description={t("settings.provider.openai.desc", "Modelos, origen y estado secreto del workspace.")}
                defaultExpanded={selectedProvider === "openai"}
                badges={[
                  { label: selectedProvider === "openai" ? t("status.active", "Activo") : t("status.available", "Disponible"), tone: selectedProvider === "openai" ? "green" : "slate" },
                  { label: providerHasOverrides(runtime, "openai") ? t("status.workspaceOverride", "Override workspace") : t("status.platformDefault", "Default plataforma"), tone: providerHasOverrides(runtime, "openai") ? "orange" : "blue" },
                ]}
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[18px] font-semibold text-[var(--text-primary)]">OpenAI</p>
                    <p className="text-[13px] text-[var(--text-secondary)]">Modelos, origen y estado secreto del workspace.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={selectedProvider === "openai" ? "green" : "slate"}>{selectedProvider === "openai" ? "Activo" : "Disponible"}</Badge>
                    <Badge tone={providerHasOverrides(runtime, "openai") ? "orange" : "blue"}>
                      {providerHasOverrides(runtime, "openai") ? "Override workspace" : "Default plataforma"}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-4">
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
                  <div className="space-y-2 rounded-[18px] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4">
                    <StatRow label="Secret source" value={getSecretLabel(runtime.openai.secret_source)} tone={getBadgeTone(runtime.openai.secret_source)} />
                    <StatRow label="Health" value={runtime.openai.health_status} tone={getBadgeTone(runtime.openai.health_status)} />
                    <StatRow label="Ultima rotacion" value={formatDateTime(runtime.openai.last_rotated_at)} tone="slate" />
                  </div>
                </div>
              </ProviderAccordion>

              <ProviderAccordion
                id="deepseek"
                title="DeepSeek"
                description={t("settings.provider.deepseek.desc", "Base URL, modelos y aislamiento de secreto.")}
                defaultExpanded={selectedProvider === "deepseek"}
                badges={[
                  { label: selectedProvider === "deepseek" ? t("status.active", "Activo") : t("status.available", "Disponible"), tone: selectedProvider === "deepseek" ? "green" : "slate" },
                  { label: providerHasOverrides(runtime, "deepseek") ? t("status.workspaceOverride", "Override workspace") : t("status.platformDefault", "Default plataforma"), tone: providerHasOverrides(runtime, "deepseek") ? "orange" : "blue" },
                ]}
              >
                <div className="space-y-4">
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
                  <div className="space-y-2 rounded-[18px] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4">
                    <StatRow label="Secret source" value={getSecretLabel(runtime.deepseek.secret_source)} tone={getBadgeTone(runtime.deepseek.secret_source)} />
                    <StatRow label="Health" value={runtime.deepseek.health_status} tone={getBadgeTone(runtime.deepseek.health_status)} />
                    <StatRow label="Ultima rotacion" value={formatDateTime(runtime.deepseek.last_rotated_at)} tone="slate" />
                  </div>
                </div>
              </ProviderAccordion>

              <ProviderAccordion
                id="codex_local"
                title="Codex Local CLI"
                description={t("settings.provider.codex.desc", "Runtime local gobernado con rollout y diagnostico opcional de plataforma.")}
                defaultExpanded={selectedProvider === "codex_local"}
                badges={[
                  { label: selectedProvider === "codex_local" ? t("status.active", "Activo") : t("status.available", "Disponible"), tone: selectedProvider === "codex_local" ? "green" : "slate" },
                  ...(codexRuntimeSummary ? [{ label: codexRuntimeSummary.readiness.label, tone: codexRuntimeSummary.readiness.tone }] : []),
                ]}
              >
                <div className="space-y-4">
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
                  <div className="grid gap-4 md:grid-cols-2">
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
                  </div>
                  <TextAreaField
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
                  <div className="space-y-2 rounded-[18px] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4">
                    <StatRow label="Readiness" value={codexRuntimeSummary?.readiness.label ?? runtime.codex_local.health_status} tone={codexRuntimeSummary?.readiness.tone ?? getBadgeTone(runtime.codex_local.health_status)} />
                    <StatRow label="Secret source" value={getSecretLabel(runtime.codex_local.secret_source)} tone={getBadgeTone(runtime.codex_local.secret_source)} />
                    <StatRow label="Timeout efectivo" value={formatDurationMs(runtimeStatus?.timeout_ms ?? runtimeDraft.codex_local.timeout_ms)} tone="blue" />
                  </div>
                </div>
              </ProviderAccordion>

              <ProviderAccordion
                id="antigravity_cli"
                title="Antigravity CLI"
                description={t("settings.provider.antigravity.desc", "Runtime local de Antigravity (agy).")}
                defaultExpanded={selectedProvider === "antigravity_cli"}
                badges={[
                  { label: selectedProvider === "antigravity_cli" ? t("status.active", "Activo") : t("status.available", "Disponible"), tone: selectedProvider === "antigravity_cli" ? "green" : "slate" },
                  { label: (runtime.antigravity_cli ?? runtime.antigravity)?.executable_found ? t("status.executableFound", "Executable found") : t("status.notConfigured", "Not configured"), tone: (runtime.antigravity_cli ?? runtime.antigravity)?.executable_found ? "green" : "orange" },
                ]}
              >
                <div className="space-y-4">
                  {(() => {
                    const agyDraft = runtimeDraft.antigravity_cli ?? defaultAntigravityConfig;
                    return (
                      <>
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
                        <div className="grid gap-4 md:grid-cols-2">
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
                        </div>
                        <TextAreaField
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
                      </>
                    );
                  })()}
                  <div className="space-y-2 rounded-[18px] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4">
                    <StatRow label="Readiness" value={(runtime.antigravity_cli ?? runtime.antigravity)?.executable_found ? t("status.executableFound", "Executable found") : t("status.notConfigured", "Not configured")} tone={(runtime.antigravity_cli ?? runtime.antigravity)?.executable_found ? "green" : "orange"} />
                    <StatRow label="Available" value={(runtime.antigravity_cli ?? runtime.antigravity)?.available ? "Yes" : "No"} tone={(runtime.antigravity_cli ?? runtime.antigravity)?.available ? "green" : "orange"} />
                  </div>
                </div>
              </ProviderAccordion>
            </div>

            <Panel className="p-5" id="workspace-credentials">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[20px] font-semibold text-[var(--text-primary)]">Secretos y aislamiento por provider</p>
                  <p className="text-[14px] leading-7 text-[var(--text-secondary)]">
                    Cada workspace puede usar credenciales propias cuando el provider lo soporte. La API nunca devuelve el secreto, solo su estado, origen y salud.
                  </p>
                </div>
                <Badge tone={runtime.uses_platform_credentials ? "blue" : "green"}>
                  {runtime.uses_platform_credentials ? "Plataforma activa" : "Workspace activo"}
                </Badge>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                {PROVIDER_ORDER.map((providerKey) => {
                  const providerConfig = getProviderSecretSnapshot(runtime, providerKey);
                  const draft = secretDrafts[providerKey];
                  const providerSupportsWorkspaceSecrets = supportsWorkspaceSecrets(providerKey);

                  return (
                    <Panel key={providerKey} className="border-[var(--border-default)] p-5">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[16px] font-semibold text-[var(--text-primary)]">{getProviderLabel(providerKey)}</p>
                          <p className="text-[12px] text-[var(--text-secondary)]">
                            {providerSupportsWorkspaceSecrets
                              ? "Puede aislar secreto por workspace o heredar credencial de plataforma."
                              : "Usa autenticacion local del runtime; no admite secreto SaaS por workspace."}
                          </p>
                        </div>
                        <Badge tone={getBadgeTone(providerConfig.health_status)}>{providerConfig.health_status}</Badge>
                      </div>

                      <div className="space-y-2">
                        <StatRow label="Origen" value={getSecretLabel(providerConfig.secret_source)} tone={getBadgeTone(providerConfig.secret_source)} />
                        <StatRow label="Ultima rotacion" value={formatDateTime(providerConfig.last_rotated_at)} tone="slate" />
                        <StatRow label="Disponible" value={providerConfig.available ? "Si" : "No"} tone={providerConfig.available ? "green" : "orange"} />
                      </div>

                      {providerSupportsWorkspaceSecrets ? (
                        <div className="mt-4 space-y-4">
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
                          <div className="flex flex-wrap gap-3">
                            <AppButton
                              onClick={() => void handleWorkspaceSecretAction(providerKey, "upsert")}
                              loading={secretPending[providerKey]}
                              disabled={!canManageWorkspaceRuntime}
                              icon={<KeyRound className="h-4 w-4" />}
                            >
                              Guardar secreto
                            </AppButton>
                            <AppButton
                              onClick={() => void handleWorkspaceSecretAction(providerKey, "rotate")}
                              loading={secretPending[providerKey]}
                              disabled={!canManageWorkspaceRuntime}
                              icon={<RotateCcw className="h-4 w-4" />}
                            >
                              Rotar
                            </AppButton>
                            <AppButton
                              onClick={() => void handleWorkspaceSecretAction(providerKey, "delete")}
                              loading={secretPending[providerKey]}
                              disabled={!canManageWorkspaceRuntime}
                              icon={<ShieldCheck className="h-4 w-4" />}
                            >
                              Limpiar
                            </AppButton>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 rounded-[18px] border border-[var(--border-default)] bg-[var(--surface-subtle)] px-4 py-4 text-[13px] leading-6 text-[var(--text-secondary)]">
                          Este provider depende del runtime local. La gestion de secretos se hace fuera de la capa SaaS, mediante auth local de Codex CLI.
                        </div>
                      )}
                    </Panel>
                  );
                })}
              </div>

              {secretFeedback ? <p className={`mt-5 text-[13px] font-medium ${getFeedbackToneClass(secretFeedback.tone)}`}>{secretFeedback.message}</p> : null}
            </Panel>

            {memoryRollout ? (
              <Panel className="p-5">
                <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[20px] font-semibold text-[var(--text-primary)]">Rollout de memoria hibrida</p>
                    <p className="text-[14px] leading-7 text-[var(--text-secondary)]">
                      Estado operativo de la estrategia de memoria aplicada al runtime efectivo del workspace.
                    </p>
                  </div>
                  <Badge tone={getBadgeTone(memoryRollout.status)}>{memoryRollout.status}</Badge>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <KeyValue label="Manifest gobernado" value={memoryRollout.manifest_ready ? "Listo" : "Pendiente"} hint="knowledge-corpus-manifest.json" />
                  <KeyValue label="Backend solicitado" value={memoryRollout.requested_backend} hint="Valor persistido del runtime" />
                  <KeyValue label="Backend efectivo" value={memoryRollout.effective_default_backend} hint="Resultado del rollout" />
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {memoryRollout.stages.map((stage) => (
                    <div key={stage.stage_key} className="rounded-[18px] border border-[var(--border-default)] bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[14px] font-semibold text-[var(--text-primary)]">{stage.label}</p>
                        <Badge tone={stage.enabled ? "green" : "slate"}>{stage.enabled ? "On" : "Off"}</Badge>
                      </div>
                      <p className="mt-2 text-[12px] leading-6 text-[var(--text-secondary)]">
                        {stage.effective_backend}
                        {stage.expects_llm_call ? " con budget trazable" : " sin invocacion LLM"}
                      </p>
                    </div>
                  ))}
                </div>
              </Panel>
            ) : null}

            <Panel className="p-5" id="workspace-automation">
              <div className="mb-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
                <div className="space-y-2">
                  <p className="text-[18px] font-semibold text-[var(--text-primary)]">Controles por sesion</p>
                  <p className="text-[13px] leading-6 text-[var(--text-secondary)]">
                    Los feature flags son el unico bloque de esta pagina que depende de una sesion. Seleccionala aqui para mantener claro su alcance.
                  </p>
                </div>
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
                  <div className="space-y-4">
                    {featureFlags.map((flag) => (
                      <FeatureFlagRow
                        key={flag.key}
                        flag={flag}
                        pending={flagPending[flag.key]}
                        error={flagErrors[flag.key]}
                        onToggle={() => void handleToggleFlag(flag)}
                      />
                    ))}
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
            </Panel>
          </div>

          <div className="space-y-5">
            <Panel className="p-5" id="workspace-diagnostics">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[18px] font-semibold text-[var(--text-primary)]">Salud y diagnostico del workspace</p>
                  <p className="text-[13px] text-[var(--text-secondary)]">Health checks efectivos resueltos con el runtime del workspace actual.</p>
                </div>
                {runtimeHealth ? <Badge tone={getBadgeTone(runtimeHealth.overall_status)}>{runtimeHealth.overall_status}</Badge> : null}
              </div>
              {workspaceHealthState.status === "loading" && !runtimeHealth ? (
                <LoadingState title="Validando salud" description="Consultando checks de conectividad y credenciales del workspace." />
              ) : workspaceHealthState.error ? (
                <ErrorState title="Health no disponible" description={workspaceHealthState.error} />
              ) : runtimeHealth ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <StatRow label="Provider" value={runtimeHealth.provider_label} tone="blue" />
                    <StatRow label="Secret source" value={getSecretSourceLabel(runtimeHealth.secret_source)} tone={getBadgeTone(runtimeHealth.secret_source)} />
                    <StatRow label="Backend agentico" value={runtimeHealth.agent_execution_backend} tone="violet" />
                    <StatRow label="Knowledge backend" value={runtimeHealth.knowledge_access_backend} tone="blue" />
                    <StatRow label="Checked at" value={formatDateTime(runtimeHealth.checked_at)} tone="slate" />
                  </div>
                  <div className="space-y-3">
                    {runtimeHealth.checks.map((check) => (
                      <div key={check.check_key} className="rounded-[18px] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[14px] font-semibold text-[var(--text-primary)]">{check.label}</p>
                          <Badge tone={getBadgeTone(check.status)}>{check.status}</Badge>
                        </div>
                        <p className="mt-2 text-[12px] leading-6 text-[var(--text-secondary)]">{check.detail}</p>
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
                      : "Los checks de salud del runtime solo se exponen a workspace owner/admin o platform admin."
                  }
                />
              )}
            </Panel>

            <Panel className="p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[18px] font-semibold text-[var(--text-primary)]">Resumen Codex CLI</p>
                  <p className="text-[13px] text-[var(--text-secondary)]">Visible solo cuando el usuario tiene acceso al diagnostico de plataforma.</p>
                </div>
                {codexRuntimeSummary ? <Badge tone={codexRuntimeSummary.readiness.tone}>{codexRuntimeSummary.readiness.label}</Badge> : null}
              </div>
              {runtimeStatusState.status === "loading" && !runtimeStatus ? (
                <LoadingState title="Leyendo diagnostico" description="Consultando `GET /api/v1/runtime/status`." />
              ) : runtimeStatusState.error ? (
                <ErrorState title="Diagnostico no disponible" description={runtimeStatusState.error} />
              ) : runtimeStatus ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <StatRow label="Version" value={runtimeStatus.version ?? "Sin version"} tone="slate" />
                    <StatRow label="Auth detectada" value={runtimeStatus.auth_detected ? "Si" : "No"} tone={codexRuntimeSummary?.auth.tone ?? "slate"} />
                    <StatRow label="Implementation backend" value={runtimeStatus.implementation_backend} tone="violet" />
                    <StatRow label="Timeout" value={formatDurationMs(runtimeStatus.timeout_ms)} tone="blue" />
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
                  <div className="rounded-[18px] border border-[var(--border-default)] bg-[rgba(15,23,42,0.02)] p-4">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Smoke command</p>
                    <p className="mt-2 break-all font-mono text-[12px] leading-5 text-[var(--text-primary)]">{runtimeStatus.smoke_command}</p>
                  </div>
                  {codexRuntimeSummary?.blockingReasons.length ? (
                    <div className="rounded-[18px] border border-[rgba(239,68,68,0.18)] bg-[rgba(239,68,68,0.04)] p-4">
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

            <Panel className="p-6">
              <div className="space-y-3">
                <KeyValue label="Usuario actual" value={user?.full_name ?? "Lean Builder"} hint={user?.email ?? "Sin email"} />
                <KeyValue label="Workspace" value={user?.active_workspace_name ?? "Sin workspace"} hint={activeWorkspaceId ?? "Sin workspace_id"} />
                <KeyValue label="Sesion activa" value={selectedSession?.title ?? "Sin sesion"} hint={selectedSession?.id ?? "La gobernanza principal no depende de session_id"} />
              </div>
            </Panel>
          </div>
        </div>
      ) : null}
        </section>
      ) : null}

      {activeScope === "platform" && isPlatformPanelVisible ? (
        <section aria-label="Administracion de plataforma" className="space-y-5" id="settings-panel-platform" role="tabpanel">
          <SettingsScopeHeader
            accessLabel="Platform admin"
            description="Gobierna defaults SaaS, disponibilidad de providers y trazabilidad global. Los cambios se propagan a multiples workspaces sin override."
            eyebrow="Administracion global"
            icon={<ServerCog aria-hidden="true" className="h-5 w-5" />}
            id="settings-platform-title"
            title="Administracion de plataforma"
          />

          <PlatformBasePricesAdminPanel />
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
                  <AppButton onClick={() => void handleSavePlatformDefaults()} loading={platformDefaultsPending} variant="primary" icon={<Save className="h-4 w-4" />}>
                    Guardar baseline
                  </AppButton>
                </div>
              </div>
            ) : null}

            {platformFeedback ? <p className={`mt-5 text-[13px] font-medium ${getFeedbackToneClass(platformFeedback.tone)}`}>{platformFeedback.message}</p> : null}
            {platformProvidersState.error ? <p className="mt-2 text-[13px] font-medium text-[var(--danger)]">{platformProvidersState.error}</p> : null}
            {platformDefaultsState.error ? <p className="mt-2 text-[13px] font-medium text-[var(--danger)]">{platformDefaultsState.error}</p> : null}
          </Panel>

          {platformProvidersState.data && platformProviderDrafts ? (
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

              <div className="grid gap-4 xl:grid-cols-3">
                {platformProvidersState.data.map((provider) => {
                  const draft = platformProviderDrafts[provider.provider_key];

                  return (
                    <Panel key={provider.provider_key} className="border-[var(--border-default)] p-5">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[18px] font-semibold text-[var(--text-primary)]">{provider.label}</p>
                          <p className="text-[12px] text-[var(--text-secondary)]">{provider.provider_key}</p>
                        </div>
                        <Badge tone={getBadgeTone(draft.release_stage)}>{draft.release_stage}</Badge>
                      </div>

                      <div className="space-y-4">
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
                          rows={2}
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
                        <div className="grid gap-3 md:grid-cols-2">
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
                        <div className="rounded-[18px] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4">
                          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Default models</p>
                          <p className="mt-2 text-[12px] leading-6 text-[var(--text-secondary)]">
                            {JSON.stringify(provider.default_models)}
                          </p>
                        </div>
                        <AppButton
                          onClick={() => void handleSavePlatformProvider(provider.provider_key)}
                          loading={platformProviderPending[provider.provider_key]}
                          icon={<Save className="h-4 w-4" />}
                        >
                          Guardar provider
                        </AppButton>
                      </div>
                    </Panel>
                  );
                })}
              </div>
            </Panel>
          ) : null}

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
              <div className="space-y-3">
                {platformAuditState.data.map((entry, index) => (
                  <div key={`${String(entry.id)}-${index}`} className="rounded-[18px] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-[14px] font-semibold text-[var(--text-primary)]">{String(entry.change_type)}</p>
                      <Badge tone="blue">{String(entry.scope_id)}</Badge>
                    </div>
                    <p className="mt-2 text-[12px] text-[var(--text-secondary)]">
                      {String(entry.actor_email || "system")} · {formatDateTime(String(entry.created_at))}
                    </p>
                  </div>
                ))}
              </div>
            ) : platformAuditState.error ? (
              <ErrorState title="Auditoria no disponible" description={platformAuditState.error} />
            ) : (
              <EmptyState className="px-0 py-4" title="Sin eventos recientes" description="Todavia no hay cambios de plataforma para mostrar." />
            )}
          </Panel>
        </section>
      ) : null}

      {activeScope === "workspace" && listStatus === "error" ? (
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
    </OperationsModuleShell>
  );
}
