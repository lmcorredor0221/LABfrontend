"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  Cpu,
  FolderKanban,
  Gauge,
  Mail,
  RefreshCcw,
  Search,
  ShieldCheck,
  Users,
  UserPlus,
} from "lucide-react";
import { BarsByDimension, DonutChart, MultiSeriesChart } from "@/components/lean/charts";
import { AppButton, Badge, KeyValue, Panel, SelectField, SimpleTable, TextField } from "@/components/lean/ui";
import { FinOpsDashboard } from "@/features/finops/finops-dashboard";
import { adminConsoleApi, type AdminConsoleApi } from "@/features/operations/admin-console-api";
import { ProductGovernanceConsole } from "@/features/product-governance/product-governance-console";
import type {
  AdminAnalyticsQuery,
  AdminOverviewResponse,
  AdminProjectsAnalytics,
  AdminRoleDefinition,
  AdminRolesResponse,
  AdminUserInvitationCreateRequest,
  AdminUserInvitationListResponse,
  AdminUserPatchRequest,
  AdminUserRecord,
  AdminUsersListResponse,
} from "@/features/operations/admin-console-contracts";
import {
  AdminAccordionTable,
  AdminKpiCard,
  AdminViewState,
  ContextSubTabs,
  FunctionalTabRail,
  SettingsAdminConsoleFrame,
  type AdminAccordionRow,
  type AdminSubTabDefinition,
} from "@/features/operations/components/admin-console-primitives";
import {
  ADMIN_SECTIONS,
  CONFIG_TABS,
  PRODUCT_GOVERNANCE_TABS,
  type AdminConfigTabKey,
  type AdminSettingsSectionKey,
  type ProductGovernanceTabKey,
} from "@/features/operations/settings-admin-navigation";
import { useSettingsUrlNavigation } from "@/features/operations/use-settings-url-navigation";
import type { AuthUser, WorkspaceRole } from "@/core/auth/types";
import type { SessionSummary } from "@/features/sessions/types";
import { getSessionProjectRoute } from "@/features/sessions/session-routes";

type AdminSettingsConsoleShellProps = {
  activeConfigTab: AdminConfigTabKey;
  activeConfigSubTab: string;
  adminApi?: AdminConsoleApi;
  actions?: ReactNode;
  children: ReactNode;
  configSubTabs: AdminSubTabDefinition<string>[];
  configSubTabsByTab: Record<AdminConfigTabKey, string>;
  currentUser: AuthUser | null;
  featureFlagCount: number;
  initialSection: AdminSettingsSectionKey;
  initialProductGovernanceTab?: ProductGovernanceTabKey;
  isPlatformAdmin: boolean;
  onConfigSubTabChange: (subTab: string) => void;
  onConfigTabChange: (tab: AdminConfigTabKey) => void;
  projectItems: SessionSummary[];
  providerLabel: string;
  runtimeHealth: string;
  workspaceId: string | null;
  workspaceName: string;
  workspaceRole: WorkspaceRole | null;
};

type AdminAnalyticsState =
  | { data: null; error: null; status: "idle" | "loading" | "unauthorized" }
  | { data: { overview: AdminOverviewResponse; projects: AdminProjectsAnalytics }; error: null; status: "ready" }
  | { data: null; error: string; status: "error" };

type AdminDirectoryState =
  | { data: null; error: null; status: "idle" | "loading" | "unauthorized" }
  | { data: { invitations: AdminUserInvitationListResponse; roles: AdminRolesResponse; users: AdminUsersListResponse }; error: null; status: "ready" }
  | { data: null; error: string; status: "error" };

type AdminWorkspaceRole = NonNullable<AdminUserPatchRequest["membership_role"]>;
type AdminInvitationDraft = {
  email: string;
  full_name: string;
  message: string;
  role: AdminWorkspaceRole;
};

type AdminPeriodFilter = "7d" | "30d" | "month" | "all";

const ADMIN_PERIOD_OPTIONS: Array<{ label: string; value: AdminPeriodFilter }> = [
  { label: "7 dias", value: "7d" },
  { label: "30 dias", value: "30d" },
  { label: "Mes actual", value: "month" },
  { label: "Todo", value: "all" },
];

const PROVIDER_COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed"];
const ADMIN_WORKSPACE_ROLES: AdminWorkspaceRole[] = ["owner", "admin", "editor", "viewer"];
const ADMIN_WORKSPACE_ROLE_OPTIONS = ADMIN_WORKSPACE_ROLES.map((role) => ({
  label: getRoleLabel(role),
  value: role,
}));

function createIdleAdminAnalyticsState(): AdminAnalyticsState {
  return { data: null, error: null, status: "idle" };
}

function createIdleAdminDirectoryState(): AdminDirectoryState {
  return { data: null, error: null, status: "idle" };
}

function createAdminInvitationDraft(): AdminInvitationDraft {
  return {
    email: "",
    full_name: "",
    message: "",
    role: "viewer",
  };
}

function canLoadAdminAnalytics(workspaceRole: WorkspaceRole | null, isPlatformAdmin: boolean) {
  return isPlatformAdmin || workspaceRole === "admin";
}

function buildAdminAnalyticsQuery(period: AdminPeriodFilter): AdminAnalyticsQuery {
  if (period === "all") {
    return {};
  }

  const end = new Date();
  const start = new Date(end);

  if (period === "7d") {
    start.setDate(end.getDate() - 7);
  } else if (period === "30d") {
    start.setDate(end.getDate() - 30);
  } else {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }

  return {
    granularity: "day",
    started_from: start.toISOString(),
    started_to: end.toISOString(),
  };
}

function formatCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat("es-CO", {
    currency,
    maximumFractionDigits: value >= 100 ? 0 : 4,
    style: "currency",
  }).format(Number.isFinite(value) ? value : 0);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-CO").format(Number.isFinite(value) ? value : 0);
}

function formatBucketDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short" }).format(date);
}

function normalizeChartSeries(values: number[]) {
  const max = Math.max(...values, 1);
  return values.map((value) => Math.round((value / max) * 100));
}

function realTrend(values: number[]) {
  return values.length > 0 ? values : [0];
}

function summaryCurrency(overview: AdminOverviewResponse) {
  const summary = overview.llm.summary;
  if (summary.currency && summary.currency !== "MIXED") {
    return summary.currency;
  }
  return summary.currency_breakdown?.[0]?.currency ?? "USD";
}

function providerSegments(overview: AdminOverviewResponse) {
  return overview.llm.provider_breakdown.slice(0, 5).map((item, index) => ({
    color: PROVIDER_COLORS[index % PROVIDER_COLORS.length],
    label: `${item.provider_key}/${item.model_name}`,
    value: item.cost_total > 0 ? item.cost_total : item.total_tokens,
  }));
}

function stageBars(projects: AdminProjectsAnalytics) {
  return projects.distribution_by_stage.slice(0, 7).map((item, index) => ({
    color: PROVIDER_COLORS[index % PROVIDER_COLORS.length],
    label: humanizeStageLabel(item.stage),
    value: Math.round(item.percentage * 100),
  }));
}

function humanizeStageLabel(stage: string) {
  return stage.replaceAll("_", " ").replace(/(^|\s)\S/g, (character) => character.toUpperCase());
}

function periodLabel(period: AdminPeriodFilter) {
  return ADMIN_PERIOD_OPTIONS.find((item) => item.value === period)?.label ?? "Periodo";
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function buildAdminUserUpdateConfirmation(user: AdminUserRecord, payload: AdminUserPatchRequest) {
  const changes: string[] = [];

  if (payload.is_active === false) {
    changes.push("desactivar la cuenta");
  }
  if (payload.membership_is_active === false) {
    changes.push("suspender la membresia del workspace");
  }
  if (payload.membership_role === "owner") {
    changes.push("asignar rol Owner");
  }
  if (user.membership.role === "owner" && payload.membership_role && payload.membership_role !== "owner") {
    changes.push(`cambiar Owner a ${getRoleLabel(payload.membership_role)}`);
  }

  return [
    `Confirmar cambio administrativo para ${user.email}.`,
    changes.length > 0 ? `Cambios sensibles: ${changes.join(", ")}.` : "Este cambio modifica permisos administrativos.",
    "La accion puede afectar acceso, propiedad o visibilidad del workspace. ¿Continuar?",
  ].join(" ");
}

function formatProjectDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Sin fecha";
  }
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function humanizeStage(stage: SessionSummary["current_stage"]) {
  return stage.replaceAll("_", " ").replace(/(^|\s)\S/g, (character) => character.toUpperCase());
}

function getRoleLabel(role: WorkspaceRole | null) {
  switch (role) {
    case "owner":
      return "Owner";
    case "admin":
      return "Admin";
    case "editor":
      return "Editor";
    case "viewer":
      return "Viewer";
    default:
      return "Sin membresía";
  }
}

function getAdminRoleLabel(role: string | null | undefined) {
  if (!role) {
    return "Sin rol";
  }
  return getRoleLabel(role as WorkspaceRole);
}

function getRoleTone(role: string): AdminAccordionRow["statusTone"] {
  if (role === "owner") {
    return "violet";
  }
  if (role === "admin") {
    return "blue";
  }
  if (role === "editor") {
    return "green";
  }
  return "slate";
}

function getUserAccessTone(user: AdminUserRecord): AdminAccordionRow["statusTone"] {
  if (!user.is_active || !user.membership.is_active) {
    return "red";
  }
  if (user.activity.is_recently_active) {
    return "green";
  }
  return "blue";
}

function getUserAccessLabel(user: AdminUserRecord) {
  if (!user.is_active) {
    return "Cuenta inactiva";
  }
  if (!user.membership.is_active) {
    return "Membresia suspendida";
  }
  return user.activity.is_recently_active ? "Activo reciente" : "Acceso activo";
}

function formatAdminDate(value: string | null | undefined) {
  if (!value) {
    return "Sin registro";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getUserDisplayName(user: AdminUserRecord) {
  return user.full_name?.trim() || user.email;
}

function getInvitationStatusTone(status: string): AdminAccordionRow["statusTone"] {
  if (status === "accepted") {
    return "green";
  }
  if (status === "expired" || status === "cancelled") {
    return "red";
  }
  return "orange";
}

function AdminInstrumentationDisclosure() {
  return (
    <details className="rounded-[16px] border border-[var(--border-default)] bg-[var(--surface-subtle)] px-4 py-3">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 text-[13px] font-semibold text-[var(--text-primary)]">
        <span>Instrumentación pendiente</span>
        <Badge tone="orange">Parcial</Badge>
      </summary>
      <div className="mt-3 space-y-2 text-[12px] leading-5 text-[var(--text-secondary)]">
        <p>
          `connected_users` y `finalized_series` no se muestran como números reales porque aún faltan presencia en vivo y persistencia histórica de finalización.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Implementar heartbeat/presence para usuarios conectados.</li>
          <li>Persistir `finalized_at` o historial de transiciones para series de proyectos finalizados.</li>
        </ul>
      </div>
    </details>
  );
}

function AdminRolesLimitationsDisclosure() {
  return (
    <details className="rounded-[16px] border border-[var(--border-default)] bg-[var(--surface-subtle)] px-4 py-3">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 text-[13px] font-semibold text-[var(--text-primary)]">
        <span>Alcance actual de roles</span>
        <Badge tone="orange">Parcial</Badge>
      </summary>
      <p className="mt-3 text-[12px] leading-5 text-[var(--text-secondary)]">
        La asignación de roles ya es operativa desde Usuarios. La edición granular de permisos por rol queda como capacidad futura porque el backend aún no expone un modelo editable de permisos.
      </p>
    </details>
  );
}

export function AdminOverviewSection({
  analyticsState,
  adminPeriod,
  featureFlagCount,
  onNavigate,
  onPeriodChange,
  onRefresh,
  providerLabel,
  runtimeHealth,
  workspaceName,
  workspaceRole,
}: {
  adminPeriod: AdminPeriodFilter;
  analyticsState: AdminAnalyticsState;
  featureFlagCount: number;
  onNavigate: (section: AdminSettingsSectionKey) => void;
  onPeriodChange: (period: AdminPeriodFilter) => void;
  onRefresh: () => void;
  providerLabel: string;
  runtimeHealth: string;
  workspaceName: string;
  workspaceRole: WorkspaceRole | null;
}) {
  if (analyticsState.status === "unauthorized") {
    return (
      <AdminViewState
        state="forbidden"
        title="Dashboard administrativo protegido"
        description="El Overview requiere membresia admin del workspace o permisos de platform admin."
      />
    );
  }

  if (analyticsState.status === "loading" || analyticsState.status === "idle") {
    return (
      <AdminViewState
        state="loading"
        title="Cargando dashboard administrativo"
        description="Consultando overview, consumo LLM, proyectos, usuarios y actividad desde endpoints backend reales."
      />
    );
  }

  if (analyticsState.status === "error") {
    return (
      <AdminViewState
        action={<AppButton icon={<RefreshCcw className="h-4 w-4" />} onClick={onRefresh}>Reintentar</AppButton>}
        state="error"
        title="No se pudo cargar el dashboard administrativo"
        description={analyticsState.error}
      />
    );
  }

  if (!analyticsState.data) {
    return (
      <AdminViewState
        state="empty"
        title="Dashboard administrativo sin datos"
        description="El endpoint administrativo no devolvió payload para el periodo seleccionado."
      />
    );
  }

  const { overview, projects } = analyticsState.data;
  const currency = summaryCurrency(overview);
  const createdTrend = realTrend(projects.created_series.items.map((item) => item.created_count));
  const providerTrend = realTrend(overview.llm.provider_breakdown.map((item) => item.cost_total));
  const roleTrend = realTrend(overview.users.distribution_by_role.map((item) => item.count));
  const projectStageBars = stageBars(projects);
  const providerDonutSegments = providerSegments(overview);

  return (
    <div className="space-y-5">
      <Panel className="p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Centro de control</p>
            <h3 className="mt-2 text-[19px] font-semibold text-[var(--text-primary)]">¿Cómo se está utilizando la plataforma?</h3>
            <p className="mt-1 max-w-2xl text-[13px] leading-6 text-[var(--text-secondary)]">
              Datos reales de admin/overview: consumo LLM, proyectos, usuarios y actividad, con estados honestos para métricas no instrumentadas.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <SelectField
              label="Periodo"
              value={adminPeriod}
              options={ADMIN_PERIOD_OPTIONS}
              onValueChange={(value) => onPeriodChange(value as AdminPeriodFilter)}
            />
            <AppButton variant="secondary" onClick={onRefresh} icon={<RefreshCcw className="h-4 w-4" />}>Refrescar</AppButton>
            <AppButton variant="secondary" onClick={() => onNavigate("llm")} icon={<BarChart3 className="h-4 w-4" />}>Ver consumo</AppButton>
            <AppButton onClick={() => onNavigate("projects")} icon={<FolderKanban className="h-4 w-4" />}>Ver proyectos</AppButton>
          </div>
        </div>
      </Panel>

      <Panel className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-[var(--text-secondary)]">
          <span>
            Workspace <strong className="ml-1 text-[var(--text-primary)]">{workspaceName || "Sin workspace"}</strong>
          </span>
          <span>
            Rol <strong className="ml-1 text-[var(--text-primary)]">{getRoleLabel(workspaceRole)}</strong>
          </span>
          <span>
            Runtime <strong className="ml-1 text-[var(--text-primary)]">{providerLabel}</strong>
          </span>
          <Badge tone="slate">{runtimeHealth}</Badge>
          <span>
            Periodo <strong className="ml-1 text-[var(--text-primary)]">{periodLabel(adminPeriod)}</strong>
          </span>
          <Badge tone="blue">{featureFlagCount} flags</Badge>
        </div>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminKpiCard
          item={{
            delta: periodLabel(adminPeriod),
            detail: `${formatNumber(overview.llm.summary.call_count)} llamadas registradas`,
            icon: Banknote,
            label: "Costo LLM",
            tone: overview.llm.summary.cost_total > 0 ? "blue" : "slate",
            trend: providerTrend,
            value: formatCurrency(overview.llm.summary.cost_total, currency),
          }}
        />
        <AdminKpiCard
          item={{
            delta: `${formatNumber(overview.llm.summary.input_tokens)} in / ${formatNumber(overview.llm.summary.output_tokens)} out`,
            detail: `${formatNumber(overview.llm.summary.estimated_count ?? 0)} llamadas estimadas`,
            icon: Cpu,
            label: "Tokens LLM",
            tone: overview.llm.summary.total_tokens > 0 ? "green" : "slate",
            trend: realTrend(overview.llm.provider_breakdown.map((item) => item.total_tokens)),
            value: formatNumber(overview.llm.summary.total_tokens),
          }}
        />
        <AdminKpiCard
          item={{
            delta: `${projects.finalized} finalizados`,
            detail: `${projects.active} activos · ${projects.archived} archivados`,
            icon: FolderKanban,
            label: "Proyectos",
            tone: projects.total > 0 ? "violet" : "slate",
            trend: createdTrend,
            value: formatNumber(projects.total),
          }}
        />
        <AdminKpiCard
          item={{
            delta: `${overview.users.new_users} nuevos`,
            detail: `${overview.users.recently_active} con actividad reciente`,
            icon: Users,
            label: "Usuarios",
            tone: overview.users.connected_availability.status === "not_instrumented" ? "orange" : "green",
            trend: roleTrend,
            value: formatNumber(overview.users.active),
          }}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <Panel className="p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[18px] font-semibold text-[var(--text-primary)]">Consumo por proveedor/modelo</p>
              <p className="text-[13px] text-[var(--text-secondary)]">Agrupación real desde llm_usage_ledger.</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="blue">{overview.llm.provider_breakdown.length} grupos</Badge>
              {overview.llm.provider_breakdown.length > 5 ? (
                <AppButton className="h-9 px-3 text-[12px]" variant="ghost" onClick={() => onNavigate("llm")}>
                  Ver más
                </AppButton>
              ) : null}
            </div>
          </div>
          {providerDonutSegments.length > 0 ? (
            <div className="grid gap-5 lg:grid-cols-[210px_minmax(0,1fr)]">
              <DonutChart
                centerLabel="grupos"
                centerValue={String(overview.llm.provider_breakdown.length)}
                segments={providerDonutSegments}
                size={190}
              />
              <div className="space-y-3">
                {overview.llm.provider_breakdown.slice(0, 5).map((item, index) => (
                  <div key={`${item.provider_key}:${item.model_name}`} className="flex items-center justify-between gap-3 rounded-[10px] border border-[var(--border-default)] px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-[var(--text-primary)]">{item.provider_key}/{item.model_name}</p>
                      <p className="text-[12px] text-[var(--text-muted)]">{formatNumber(item.total_tokens)} tokens</p>
                    </div>
                    <Badge tone={index === 0 ? "blue" : "slate"}>{formatCurrency(item.cost_total, currency)}</Badge>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <AdminViewState
              state="empty"
              title="Sin consumo LLM"
              description="El ledger no tiene llamadas para los filtros actuales."
            />
          )}
        </Panel>

        <Panel className="p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[18px] font-semibold text-[var(--text-primary)]">Proyectos por etapa</p>
              <p className="text-[13px] text-[var(--text-secondary)]">Distribución global del workspace; no depende de la tabla visible.</p>
            </div>
            <Badge tone={projects.total > 0 ? "green" : "slate"}>{projects.total} proyectos</Badge>
          </div>
          {projectStageBars.length > 0 ? (
            <BarsByDimension items={projectStageBars} />
          ) : (
            <AdminViewState state="empty" title="Sin proyectos" description="No hay proyectos en el periodo seleccionado." />
          )}
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel className="p-5">
          <div className="mb-4 space-y-1">
            <p className="text-[18px] font-semibold text-[var(--text-primary)]">Crecimiento de proyectos</p>
            <p className="text-[13px] text-[var(--text-secondary)]">Serie real desde sessions.created_at; usuarios conectados y finalizados históricos permanecen marcados como no instrumentados.</p>
          </div>
          {projects.created_series.items.length > 0 ? (
            <MultiSeriesChart
              className="min-h-[260px]"
              series={[
                { color: "#2563eb", values: normalizeChartSeries(projects.created_series.items.map((item) => item.created_count)) },
                { color: "#16a34a", values: normalizeChartSeries(overview.users.distribution_by_role.map((item) => item.count)) },
              ]}
            />
          ) : (
            <AdminViewState
              state="empty"
              title="Sin serie de crecimiento"
              description={projects.created_series.availability.reason}
            />
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="blue">Proyectos creados</Badge>
            <Badge tone="green">Usuarios por rol</Badge>
            <Badge tone="orange">{overview.availability.connected_users.status}</Badge>
            <Badge tone="orange">{projects.finalized_series.availability.status}</Badge>
          </div>
        </Panel>

        <Panel className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Activity aria-hidden="true" className="h-4 w-4 text-[var(--brand-primary)]" />
            <div>
              <p className="text-[18px] font-semibold text-[var(--text-primary)]">Actividad reciente</p>
              <p className="text-[13px] text-[var(--text-secondary)]">{overview.activity.availability.reason}</p>
            </div>
          </div>
          <div className="space-y-3">
            {overview.activity.items.slice(0, 6).map((item) => (
              <div key={item.id} className="rounded-[10px] border border-[var(--border-default)] bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 text-[13px] font-semibold text-[var(--text-primary)]">{item.title}</p>
                  <Badge tone={item.severity === "warning" ? "orange" : "slate"}>{item.source}</Badge>
                </div>
                <p className="mt-2 text-[12px] text-[var(--text-muted)]">{formatBucketDate(item.created_at)} · {item.type}</p>
              </div>
            ))}
            {overview.activity.items.length > 6 ? (
              <details className="rounded-[10px] border border-[var(--border-default)] bg-[var(--surface-subtle)] px-3 py-2">
                <summary className="cursor-pointer text-[12px] font-semibold text-[var(--brand-primary)]">
                  Ver más actividad ({overview.activity.items.length - 6})
                </summary>
                <div className="mt-3 space-y-2">
                  {overview.activity.items.slice(6).map((item) => (
                    <div key={`extra-${item.id}`} className="rounded-[10px] border border-[var(--border-default)] bg-white p-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 text-[13px] font-semibold text-[var(--text-primary)]">{item.title}</p>
                        <Badge tone={item.severity === "warning" ? "orange" : "slate"}>{item.source}</Badge>
                      </div>
                      <p className="mt-2 text-[12px] text-[var(--text-muted)]">{formatBucketDate(item.created_at)} · {item.type}</p>
                    </div>
                  ))}
                </div>
              </details>
            ) : null}
            {overview.activity.items.length === 0 ? (
              <AdminViewState state="empty" title="Sin actividad reciente" description="No hay eventos administrativos en el periodo." />
            ) : null}
          </div>
        </Panel>
      </div>

      <AdminInstrumentationDisclosure />
    </div>
  );
}

export function AdminProjectsSection({
  analyticsState,
  adminPeriod,
  items,
  onPeriodChange,
  onRefresh,
}: {
  adminPeriod: AdminPeriodFilter;
  analyticsState: AdminAnalyticsState;
  items: SessionSummary[];
  onPeriodChange: (period: AdminPeriodFilter) => void;
  onRefresh: () => void;
}) {
  const router = useRouter();
  const projects = analyticsState.status === "ready" ? analyticsState.data.projects : null;
  const active = projects?.active ?? 0;
  const completed = projects?.finalized ?? 0;
  const needsReview = projects?.distribution_by_status.find((item) => item.status === "needs_review")?.count ?? 0;
  const projectStageBars = projects ? stageBars(projects) : [];
  const rows = items.map((item) => [
    <div key={`${item.id}-name`} className="min-w-0">
      <p className="truncate font-semibold text-[var(--text-primary)]">{item.title}</p>
      <p className="mt-1 truncate text-[12px] text-[var(--text-muted)]">{item.id}</p>
    </div>,
    <Badge key={`${item.id}-stage`} tone={item.current_stage === "ready_for_export" ? "green" : "blue"}>{humanizeStage(item.current_stage)}</Badge>,
    <div key={`${item.id}-status`}>
      <p className="font-medium">{item.status === "needs_review" ? "Requiere revisión" : item.status === "ready" ? "Activo" : "Borrador"}</p>
      <p className="mt-1 text-[12px] text-[var(--text-muted)]">Actualizado {formatProjectDate(item.updated_at)}</p>
    </div>,
    <AppButton key={`${item.id}-open`} variant="secondary" onClick={() => router.push(getSessionProjectRoute(item))}>Abrir</AppButton>,
  ]);
  if (analyticsState.status === "unauthorized") {
    return (
      <AdminViewState
        state="forbidden"
        title="Analítica de proyectos protegida"
        description="La distribución global de proyectos requiere permisos administrativos del workspace."
      />
    );
  }

  if (analyticsState.status === "loading" || analyticsState.status === "idle") {
    return (
      <AdminViewState
        state="loading"
        title="Cargando analítica de proyectos"
        description="Consultando /admin/projects/analytics para evitar conteos sesgados por la página visible."
      />
    );
  }

  if (analyticsState.status === "error") {
    return (
      <AdminViewState
        action={<AppButton icon={<RefreshCcw className="h-4 w-4" />} onClick={onRefresh}>Reintentar</AppButton>}
        state="error"
        title="No se pudo cargar proyectos"
        description={analyticsState.error}
      />
    );
  }

  return (
    <div className="space-y-5">
      <Panel className="p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Proyectos</p>
            <h3 className="mt-2 text-[19px] font-semibold text-[var(--text-primary)]">Distribución real por etapa</h3>
            <p className="mt-1 max-w-2xl text-[13px] leading-6 text-[var(--text-secondary)]">
              Totales y series provienen del backend agregado; la tabla inferior conserva acciones de navegación sobre proyectos visibles.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <SelectField
              label="Periodo"
              value={adminPeriod}
              options={ADMIN_PERIOD_OPTIONS}
              onValueChange={(value) => onPeriodChange(value as AdminPeriodFilter)}
            />
            <AppButton variant="secondary" onClick={onRefresh} icon={<RefreshCcw className="h-4 w-4" />}>Refrescar</AppButton>
          </div>
        </div>
      </Panel>
      <div className="grid gap-3 sm:grid-cols-3">
        <Panel className="p-4"><KeyValue label="Total backend" value={String(projects?.total ?? 0)} hint="Agregado global por workspace" /></Panel>
        <Panel className="p-4"><KeyValue label="Activos" value={String(active)} hint="Sin archivar ni eliminar" /></Panel>
        <Panel className="p-4"><KeyValue label="Listos / revisión" value={`${completed} / ${needsReview}`} hint="Distribución operativa actual" /></Panel>
      </div>
      <Panel className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-[17px] font-semibold text-[var(--text-primary)]">Etapas del pipeline</h3>
            <p className="text-[13px] text-[var(--text-secondary)]">Agrupación desde sessions.current_stage.</p>
          </div>
          <Badge tone="slate">{projects?.distribution_by_stage.length ?? 0} etapas</Badge>
        </div>
        {projectStageBars.length > 0 ? (
          <BarsByDimension items={projectStageBars} />
        ) : (
          <AdminViewState state="empty" title="Sin distribución por etapa" description="No hay proyectos para el periodo seleccionado." />
        )}
      </Panel>
      <Panel className="p-5">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div><h3 className="text-[17px] font-semibold text-[var(--text-primary)]">Proyectos visibles</h3><p className="text-[13px] text-[var(--text-secondary)]">Tabla operativa para abrir proyectos; los totales ejecutivos vienen del endpoint agregado.</p></div>
          <Badge tone="slate">{items.length} visibles</Badge>
        </div>
        {rows.length > 0 ? <SimpleTable columns={["Proyecto", "Etapa", "Estado", "Acción"]} rows={rows} /> : <Panel className="border-dashed p-6"><p className="text-[14px] font-semibold text-[var(--text-primary)]">No hay proyectos visibles</p><p className="mt-1 text-[13px] text-[var(--text-secondary)]">Crea una sesión desde las acciones de Settings para comenzar.</p></Panel>}
      </Panel>
    </div>
  );
}

export function AdminUsersSection({
  currentUser,
  directoryState,
  invitationDraft,
  invitationFeedback,
  invitationPending,
  onDraftChange,
  onInviteUser,
  onRefresh,
  onUpdateUser,
  userMutationPendingId,
  workspaceId,
  workspaceName,
}: {
  currentUser: AuthUser | null;
  directoryState: AdminDirectoryState;
  invitationDraft: AdminInvitationDraft;
  invitationFeedback: string | null;
  invitationPending: boolean;
  onDraftChange: (patch: Partial<AdminInvitationDraft>) => void;
  onInviteUser: (payload: AdminUserInvitationCreateRequest) => void;
  onRefresh: () => void;
  onUpdateUser: (user: AdminUserRecord, payload: AdminUserPatchRequest) => void;
  userMutationPendingId: string | null;
  workspaceId: string | null;
  workspaceName: string;
}) {
  if (directoryState.status === "unauthorized") {
    return (
      <AdminViewState
        state="forbidden"
        title="Directorio administrativo protegido"
        description="La administracion de usuarios requiere membresia admin del workspace o permisos de platform admin."
      />
    );
  }

  if (directoryState.status === "loading" || directoryState.status === "idle") {
    return (
      <AdminViewState
        state="loading"
        title="Cargando usuarios y membresias"
        description="Consultando el directorio administrativo, invitaciones pendientes y catalogo de roles desde el backend."
      />
    );
  }

  if (directoryState.status === "error") {
    return (
      <AdminViewState
        action={<AppButton icon={<RefreshCcw className="h-4 w-4" />} onClick={onRefresh}>Reintentar</AppButton>}
        state="error"
        title="No se pudo cargar usuarios"
        description={directoryState.error}
      />
    );
  }

  const directoryData = directoryState.data;
  if (!directoryData) {
    return (
      <AdminViewState
        state="empty"
        title="Directorio sin datos"
        description="El endpoint administrativo no devolvio payload para usuarios e invitaciones."
      />
    );
  }

  const { invitations, users } = directoryData;
  const rows: AdminAccordionRow[] = users.items.map((user) => {
    const isCurrentUser = currentUser?.id === user.id;
    const currentRole = user.membership.role;
    const pending = userMutationPendingId === user.id;
    const roleActions = isCurrentUser
      ? []
      : ADMIN_WORKSPACE_ROLES.filter((role) => role !== currentRole).map((role) => ({
          label: `Asignar ${getAdminRoleLabel(role)}`,
          onClick: () => onUpdateUser(user, { membership_role: role }),
          tone: getRoleTone(role),
        }));
    const accessAction = user.membership.is_active
      ? {
          label: "Suspender membresia",
          onClick: () => onUpdateUser(user, { membership_is_active: false }),
          tone: "orange" as const,
        }
      : {
          label: "Reactivar membresia",
          onClick: () => onUpdateUser(user, { membership_is_active: true, is_active: true }),
          tone: "green" as const,
        };
    const accountAction = user.is_active
      ? {
          label: "Desactivar cuenta",
          onClick: () => onUpdateUser(user, { is_active: false, membership_is_active: false }),
          tone: "red" as const,
        }
      : {
          label: "Activar cuenta",
          onClick: () => onUpdateUser(user, { is_active: true, membership_is_active: true }),
          tone: "green" as const,
        };

    return {
      detail: (
        <div className="space-y-3">
          <p>
            Usuario registrado en el workspace <span className="font-semibold text-[var(--text-primary)]">{workspaceName || user.membership.workspace_id}</span>.
            La fila mantiene visible el estado operativo y deja cambios de rol, suspension o activacion dentro del acordeon para evitar acciones accidentales.
          </p>
          {isCurrentUser ? (
            <Badge tone="orange">Usuario actual protegido contra autosuspension desde esta vista</Badge>
          ) : null}
        </div>
      ),
      expandedActions: isCurrentUser ? roleActions : [...roleActions, accessAction, accountAction],
      fields: [
        { label: "Email verificado", tone: user.email_verified ? "green" : "orange", value: user.email_verified ? "Si" : "No" },
        { label: "Ultima actividad", value: formatAdminDate(user.activity.last_activity_at) },
        { label: "Alta de membresia", value: formatAdminDate(user.membership.created_at) },
        { label: "Preferencias", value: `${user.preferred_language || "n/d"} · ${user.preferred_currency || "n/d"}` },
        { label: "ID usuario", value: user.id },
        { label: "ID membresia", value: user.membership.id },
      ],
      id: user.id,
      name: getUserDisplayName(user),
      owner: (
        <div>
          <p className="font-medium">{formatAdminDate(user.activity.last_activity_at)}</p>
          <p className="mt-1 text-[12px] text-[var(--text-muted)]">{user.activity.activity_definition}</p>
        </div>
      ),
      primaryAction: isCurrentUser
        ? "Usuario actual"
        : pending
          ? "Guardando..."
          : {
              label: user.membership.is_active ? "Suspender" : "Activar",
              onClick: accessAction.onClick,
              tone: accessAction.tone,
            },
      scope: (
        <div>
          <p className="font-medium">{workspaceName || user.membership.workspace_id}</p>
          <p className="mt-1 text-[12px] text-[var(--text-muted)]">{getAdminRoleLabel(currentRole)}</p>
        </div>
      ),
      statusLabel: getUserAccessLabel(user),
      statusTone: getUserAccessTone(user),
      summary: (
        <span>
          {user.email}
          <span className="mt-1 block text-[11px] text-[var(--text-muted)]">Actualizado {formatAdminDate(user.updated_at)}</span>
        </span>
      ),
    };
  });

  const invitationRows = invitations.items.map((invitation) => [
    <div key={`${invitation.id}-email`}>
      <p className="font-semibold text-[var(--text-primary)]">{invitation.email}</p>
      <p className="mt-1 text-[12px] text-[var(--text-muted)]">{invitation.full_name || "Sin nombre"}</p>
    </div>,
    <Badge key={`${invitation.id}-role`} tone={getRoleTone(invitation.role)}>{getAdminRoleLabel(invitation.role)}</Badge>,
    <Badge key={`${invitation.id}-status`} tone={getInvitationStatusTone(invitation.status)}>{invitation.status}</Badge>,
    <div key={`${invitation.id}-delivery`}>
      <p className="font-medium">{invitation.delivery_status}</p>
      <p className="mt-1 text-[12px] text-[var(--text-muted)]">{formatAdminDate(invitation.created_at)}</p>
    </div>,
  ]);

  function handleInviteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = invitationDraft.email.trim();
    if (!email || !email.includes("@")) {
      return;
    }
    onInviteUser({
      email,
      full_name: invitationDraft.full_name.trim(),
      message: invitationDraft.message.trim(),
      metadata: { source: "settings_admin_console" },
      role: invitationDraft.role,
    });
  }

  return (
    <div className="space-y-5">
      <Panel className="border-[rgba(79,70,245,0.22)] bg-[rgba(79,70,245,0.04)] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-3">
            <Users className="mt-0.5 h-5 w-5 text-[var(--brand-primary)]" />
            <div>
              <h3 className="text-[17px] font-semibold text-[var(--text-primary)]">Miembros del workspace</h3>
              <p className="mt-1 max-w-3xl text-[13px] leading-6 text-[var(--text-secondary)]">
                Este directorio no es global: solo muestra membresias del workspace activo. Las acciones sensibles quedan dentro del detalle acordeon.
              </p>
              {workspaceId ? <p className="mt-2 text-[12px] text-[var(--text-muted)]">Workspace activo: {workspaceName || "Sin nombre"} · {workspaceId}</p> : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="green">{users.count} usuarios</Badge>
            <Badge tone="orange">{invitations.count} invitaciones</Badge>
            <AppButton variant="secondary" onClick={onRefresh} icon={<RefreshCcw className="h-4 w-4" />}>Refrescar</AppButton>
          </div>
        </div>
      </Panel>

      <form onSubmit={handleInviteSubmit}>
        <Panel className="p-5">
          <div className="flex flex-col gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[var(--brand-soft)] text-[var(--brand-primary)]">
                  <UserPlus className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-[17px] font-semibold text-[var(--text-primary)]">Invitar usuario</h3>
                  <p className="mt-1 text-[13px] leading-6 text-[var(--text-secondary)]">
                    Crea el registro de invitacion administrativo. La entrega automatica de email aun no esta instrumentada, por eso el backend devuelve entrega manual requerida.
                  </p>
                </div>
              </div>
              {invitationFeedback ? <p className="mt-3 text-[13px] font-medium text-[var(--text-secondary)]">{invitationFeedback}</p> : null}
            </div>
            <div className="grid w-full gap-3 md:grid-cols-2 xl:grid-cols-4">
              <TextField
                label="Email"
                onValueChange={(value) => onDraftChange({ email: value })}
                placeholder="persona@empresa.com"
                required
                trailing={<Mail className="h-4 w-4" />}
                value={invitationDraft.email}
              />
              <TextField
                label="Nombre"
                onValueChange={(value) => onDraftChange({ full_name: value })}
                placeholder="Nombre completo"
                value={invitationDraft.full_name}
              />
              <SelectField
                label="Rol"
                onValueChange={(value) => onDraftChange({ role: value as AdminWorkspaceRole })}
                options={ADMIN_WORKSPACE_ROLE_OPTIONS}
                value={invitationDraft.role}
              />
              <TextField
                label="Mensaje"
                onValueChange={(value) => onDraftChange({ message: value })}
                placeholder="Contexto interno"
                trailing={<Search className="h-4 w-4" />}
                value={invitationDraft.message}
              />
              <div className="flex md:col-span-2 xl:col-span-4 xl:justify-end">
                <AppButton className="h-11 w-full md:w-auto" disabled={invitationPending || !invitationDraft.email.includes("@")} type="submit">
                  {invitationPending ? "Creando..." : "Crear invitacion"}
                </AppButton>
              </div>
            </div>
          </div>
        </Panel>
      </form>

      {rows.length > 0 ? (
        <AdminAccordionTable
          title="Miembros del workspace activo"
          description="Cada fila muestra lo operativo en primer nivel; este listado se filtra por el workspace activo, no por todos los usuarios registrados en la plataforma."
          rows={rows}
        />
      ) : (
        <AdminViewState
          state="empty"
          title="Sin miembros en este workspace"
          description="El backend no devolvio membresias para el workspace activo."
        />
      )}

      <Panel className="p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-[17px] font-semibold text-[var(--text-primary)]">Invitaciones pendientes</h3>
            <p className="text-[13px] text-[var(--text-secondary)]">Registros administrativos creados desde /admin/users/invitations.</p>
          </div>
          <Badge tone="slate">{invitationRows.length} visibles</Badge>
        </div>
        {invitationRows.length > 0 ? (
          <SimpleTable columns={["Invitado", "Rol", "Estado", "Entrega"]} rows={invitationRows} />
        ) : (
          <p className="text-[13px] text-[var(--text-secondary)]">No hay invitaciones pendientes.</p>
        )}
      </Panel>
    </div>
  );
}

function RolePermissionList({ role }: { role: AdminRoleDefinition }) {
  return (
    <div className="space-y-3">
      <p>
        Rol <span className="font-semibold text-[var(--text-primary)]">{role.label}</span> con {role.permission_count} permisos declarados por backend.
        La edicion granular de permisos no se expone todavia; la asignacion efectiva se administra desde usuarios.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {role.permissions.map((permission) => (
          <span key={`${role.key}-${permission}`} className="rounded-[10px] border border-[var(--border-default)] bg-[var(--surface-subtle)] px-3 py-2 font-mono text-[12px] text-[var(--text-secondary)]">
            {permission}
          </span>
        ))}
      </div>
    </div>
  );
}

export function AdminRolesSection({
  directoryState,
  onRefresh,
  workspaceRole,
}: {
  directoryState: AdminDirectoryState;
  onRefresh: () => void;
  workspaceRole: WorkspaceRole | null;
}) {
  if (directoryState.status === "unauthorized") {
    return (
      <AdminViewState
        state="forbidden"
        title="Roles y permisos protegidos"
        description="El catalogo de roles requiere membresia admin del workspace o permisos de platform admin."
      />
    );
  }

  if (directoryState.status === "loading" || directoryState.status === "idle") {
    return (
      <AdminViewState
        state="loading"
        title="Cargando catalogo de roles"
        description="Consultando roles efectivos, roles de workspace y roles de plataforma desde el backend."
      />
    );
  }

  if (directoryState.status === "error") {
    return (
      <AdminViewState
        action={<AppButton icon={<RefreshCcw className="h-4 w-4" />} onClick={onRefresh}>Reintentar</AppButton>}
        state="error"
        title="No se pudo cargar roles"
        description={directoryState.error}
      />
    );
  }

  const directoryData = directoryState.data;
  if (!directoryData) {
    return (
      <AdminViewState
        state="empty"
        title="Catalogo de roles sin datos"
        description="El endpoint administrativo no devolvio payload para roles."
      />
    );
  }

  const roles = directoryData.roles;
  const workspaceRoleRows: AdminAccordionRow[] = roles.workspace_roles.map((role) => ({
    detail: <RolePermissionList role={role} />,
    expandedActions: [
      {
        label: "Asignar desde Usuarios",
        onClick: () => undefined,
        tone: "blue",
      },
    ],
    fields: [
      { label: "Scope", value: role.scope },
      { label: "Permisos", value: String(role.permission_count) },
      { label: "Sistema", tone: role.is_system ? "green" : "orange", value: role.is_system ? "Si" : "No" },
    ],
    id: role.key,
    name: role.label,
    owner: role.key,
    primaryAction: "Ver detalle",
    scope: role.scope,
    statusLabel: role.is_system ? "Sistema" : "Custom",
    statusTone: getRoleTone(role.key),
    summary: `${role.permission_count} permisos · ${roles.definitions[role.key] ?? "Definicion operativa del rol."}`,
  }));
  const platformRoleRows: AdminAccordionRow[] = roles.platform_roles.map((role) => ({
    detail: <RolePermissionList role={role} />,
    fields: [
      { label: "Scope", value: role.scope },
      { label: "Permisos", value: String(role.permission_count) },
      { label: "Sistema", tone: role.is_system ? "green" : "orange", value: role.is_system ? "Si" : "No" },
      { label: "Key", value: role.key },
    ],
    id: `platform-${role.key}`,
    name: role.label,
    owner: role.key,
    primaryAction: "Solo lectura",
    scope: role.scope,
    statusLabel: role.is_system ? "Sistema" : "Custom",
    statusTone: role.is_system ? "violet" : "orange",
    summary: `${role.permission_count} permisos · ${role.permissions.slice(0, 3).join(" · ") || "Sin permisos declarados"}`,
  }));

  return (
    <div className="space-y-5">
      <Panel className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-[var(--brand-primary)]" />
            <div>
              <h3 className="text-[17px] font-semibold text-[var(--text-primary)]">Roles y permisos</h3>
              <p className="mt-1 max-w-3xl text-[13px] leading-6 text-[var(--text-secondary)]">
                Catalogo real de roles. Esta fase permite consultar permisos y administrar asignacion por usuario, sin inventar edicion granular no soportada por backend.
              </p>
            </div>
          </div>
          <AppButton variant="secondary" onClick={onRefresh} icon={<RefreshCcw className="h-4 w-4" />}>Refrescar</AppButton>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="p-5">
          <KeyValue label="Rol actual" value={getRoleLabel(workspaceRole)} hint="Membresia del workspace activo" />
          <div className="mt-4 flex items-center gap-2 text-[13px] text-[var(--success)]"><CheckCircle2 className="h-4 w-4" />Permisos resueltos por backend</div>
        </Panel>
        <Panel className="p-5">
          <KeyValue label="Rol efectivo workspace" value={getAdminRoleLabel(roles.effective.workspace)} hint="Respuesta de /admin/roles" />
        </Panel>
        <Panel className="p-5">
          <KeyValue label="Roles plataforma" value={roles.effective.platform.length ? roles.effective.platform.join(", ") : "Ninguno"} hint="Permisos globales efectivos" />
        </Panel>
      </div>

      <AdminAccordionTable
        title="Roles de workspace"
        description="Permisos agrupados por rol. La tabla conserva el patron Configuracion -> detalle por acordeon del mockup."
        rows={workspaceRoleRows}
      />

      {platformRoleRows.length > 0 ? (
        <AdminAccordionTable
          title="Roles de plataforma"
          description="Catálogo global disponible solo para lectura. La fila resume alcance y estado; permisos completos e identificadores viven en el detalle."
          rows={platformRoleRows}
        />
      ) : (
        <AdminViewState
          state="empty"
          title="Sin roles de plataforma visibles"
          description="El backend no devolvió roles globales para el usuario actual."
        />
      )}

      <AdminRolesLimitationsDisclosure />
    </div>
  );
}

export function AdminSettingsConsoleShell({
  activeConfigTab,
  activeConfigSubTab,
  adminApi = adminConsoleApi,
  actions,
  children,
  configSubTabs,
  configSubTabsByTab,
  currentUser,
  featureFlagCount,
  initialProductGovernanceTab = "summary",
  initialSection,
  isPlatformAdmin,
  onConfigSubTabChange,
  onConfigTabChange,
  projectItems,
  providerLabel,
  runtimeHealth,
  workspaceId,
  workspaceName,
  workspaceRole,
}: AdminSettingsConsoleShellProps) {
  const [activeSection, setActiveSection] = useState<AdminSettingsSectionKey>(initialSection);
  const [activeProductGovernanceTab, setActiveProductGovernanceTab] = useState<ProductGovernanceTabKey>(initialProductGovernanceTab);
  const [navigationCollapsed, setNavigationCollapsed] = useState(false);
  const [adminPeriod, setAdminPeriod] = useState<AdminPeriodFilter>("30d");
  const [adminRefreshIndex, setAdminRefreshIndex] = useState(0);
  const [adminAnalyticsState, setAdminAnalyticsState] = useState<AdminAnalyticsState>(createIdleAdminAnalyticsState);
  const [adminDirectoryRefreshIndex, setAdminDirectoryRefreshIndex] = useState(0);
  const [adminDirectoryState, setAdminDirectoryState] = useState<AdminDirectoryState>(createIdleAdminDirectoryState);
  const [adminUserMutationPendingId, setAdminUserMutationPendingId] = useState<string | null>(null);
  const [adminInvitationPending, setAdminInvitationPending] = useState(false);
  const [adminInvitationDraft, setAdminInvitationDraft] = useState<AdminInvitationDraft>(createAdminInvitationDraft);
  const [adminDirectoryFeedback, setAdminDirectoryFeedback] = useState<string | null>(null);
  const section = ADMIN_SECTIONS.find((item) => item.key === activeSection) ?? ADMIN_SECTIONS[0];
  const productGovernanceTab = PRODUCT_GOVERNANCE_TABS.find((item) => item.key === activeProductGovernanceTab) ?? PRODUCT_GOVERNANCE_TABS[0];
  const configTabDefinition = CONFIG_TABS.find((item) => item.key === activeConfigTab) ?? CONFIG_TABS[0];
  const configSubTabDefinition = configSubTabs.find((item) => item.key === activeConfigSubTab);
  const roleLabel = getRoleLabel(workspaceRole);
  const canReadAdminAnalytics = canLoadAdminAnalytics(workspaceRole, isPlatformAdmin);
  const shouldLoadAdminDirectory = canReadAdminAnalytics && (activeSection === "users" || activeSection === "roles");
  const adminAnalyticsQuery = useMemo(() => buildAdminAnalyticsQuery(adminPeriod), [adminPeriod]);
  const effectiveAdminAnalyticsState: AdminAnalyticsState = canReadAdminAnalytics
    ? adminAnalyticsState
    : { data: null, error: null, status: "unauthorized" };
  const effectiveAdminDirectoryState: AdminDirectoryState = canReadAdminAnalytics
    ? adminDirectoryState
    : { data: null, error: null, status: "unauthorized" };
  const {
    handleConfigSubTabNavigation,
    handleConfigTabNavigation,
    handleProductGovernanceTabNavigation,
    handleSectionChange,
  } = useSettingsUrlNavigation({
    activeConfigSubTab,
    activeConfigTab,
    activeProductGovernanceTab,
    configSubTabsByTab,
    onConfigSubTabChange,
    onConfigTabChange,
    onProductGovernanceTabChange: setActiveProductGovernanceTab,
    onSectionChange: setActiveSection,
  });

  const breadcrumbs =
    activeSection === "configuration"
      ? [
          "Administración",
          workspaceName || "Workspace",
          section.label,
          configTabDefinition.label,
          configSubTabDefinition?.label ?? activeConfigSubTab,
        ]
      : activeSection === "productGovernance"
        ? ["Administración", workspaceName || "Workspace", section.label, productGovernanceTab.label]
        : ["Administración", workspaceName || "Workspace", section.label];

  useEffect(() => {
    if (!canReadAdminAnalytics) {
      return;
    }

    let cancelled = false;

    async function loadAdminAnalytics() {
      setAdminAnalyticsState({ data: null, error: null, status: "loading" });
      try {
        const [overview, projects] = await Promise.all([
          adminApi.getOverview(adminAnalyticsQuery),
          adminApi.getProjectsAnalytics(adminAnalyticsQuery),
        ]);
        if (!cancelled) {
          setAdminAnalyticsState({ data: { overview, projects }, error: null, status: "ready" });
        }
      } catch (error) {
        if (!cancelled) {
          setAdminAnalyticsState({
            data: null,
            error: getErrorMessage(error, "No se pudo cargar analítica administrativa."),
            status: "error",
          });
        }
      }
    }

    void loadAdminAnalytics();

    return () => {
      cancelled = true;
    };
  }, [adminAnalyticsQuery, adminApi, adminRefreshIndex, canReadAdminAnalytics]);

  useEffect(() => {
    if (!shouldLoadAdminDirectory) {
      return;
    }

    let cancelled = false;

    async function loadAdminDirectory() {
      setAdminDirectoryState({ data: null, error: null, status: "loading" });
      try {
        const [users, invitations, roles] = await Promise.all([
          adminApi.listUsers({ limit: 100, status: "all" }),
          adminApi.listInvitations({ limit: 50, status: "pending" }),
          adminApi.getRoles(),
        ]);
        if (!cancelled) {
          setAdminDirectoryState({ data: { invitations, roles, users }, error: null, status: "ready" });
        }
      } catch (error) {
        if (!cancelled) {
          setAdminDirectoryState({
            data: null,
            error: getErrorMessage(error, "No se pudo cargar usuarios y roles."),
            status: "error",
          });
        }
      }
    }

    void loadAdminDirectory();

    return () => {
      cancelled = true;
    };
  }, [adminApi, adminDirectoryRefreshIndex, shouldLoadAdminDirectory]);

  async function handleAdminUserUpdate(user: AdminUserRecord, payload: AdminUserPatchRequest) {
    if (!canReadAdminAnalytics) {
      setAdminDirectoryFeedback("No tienes permisos para administrar usuarios en este workspace.");
      return;
    }
    if (currentUser?.id === user.id) {
      setAdminDirectoryFeedback("Por seguridad, no se permite modificar tu propio acceso desde esta vista.");
      return;
    }

    const requiresConfirmation =
      payload.is_active === false ||
      payload.membership_is_active === false ||
      payload.membership_role === "owner" ||
      user.membership.role === "owner";
    if (requiresConfirmation && typeof window !== "undefined") {
      const confirmed = window.confirm(buildAdminUserUpdateConfirmation(user, payload));
      if (!confirmed) {
        return;
      }
    }

    setAdminUserMutationPendingId(user.id);
    setAdminDirectoryFeedback(null);
    try {
      await adminApi.updateUser(user.id, payload);
      setAdminDirectoryFeedback(`Usuario ${user.email} actualizado correctamente.`);
      setAdminDirectoryRefreshIndex((value) => value + 1);
      setAdminRefreshIndex((value) => value + 1);
    } catch (error) {
      setAdminDirectoryFeedback(getErrorMessage(error, "No se pudo actualizar el usuario."));
    } finally {
      setAdminUserMutationPendingId(null);
    }
  }

  async function handleAdminInvitationCreate(payload: AdminUserInvitationCreateRequest) {
    if (!payload.email.includes("@")) {
      setAdminDirectoryFeedback("Ingresa un email valido antes de crear la invitacion.");
      return;
    }

    setAdminInvitationPending(true);
    setAdminDirectoryFeedback(null);
    try {
      const invitation = await adminApi.createInvitation(payload);
      setAdminInvitationDraft(createAdminInvitationDraft());
      setAdminDirectoryFeedback(`Invitacion creada para ${invitation.email}. Entrega: ${invitation.delivery_status}.`);
      setAdminDirectoryRefreshIndex((value) => value + 1);
    } catch (error) {
      setAdminDirectoryFeedback(getErrorMessage(error, "No se pudo crear la invitacion."));
    } finally {
      setAdminInvitationPending(false);
    }
  }

  return (
    <SettingsAdminConsoleFrame
      activeSection={activeSection}
      actions={actions}
      breadcrumbs={breadcrumbs}
      collapsed={navigationCollapsed}
      environmentLabel={`Producción · ${roleLabel}`}
      latencyLabel={runtimeHealth}
      onSelectSection={handleSectionChange}
      onToggleNavigation={() => setNavigationCollapsed((value) => !value)}
      planLabel={roleLabel}
      runtimeIcon={<Gauge aria-hidden="true" className="h-3.5 w-3.5 text-[var(--brand-primary)]" />}
      runtimeLabel={providerLabel}
      sectionActions={
        <div className="flex shrink-0 items-center gap-2">
          <Badge tone="green">Sesión administrativa</Badge>
          <span className="hidden text-[12px] text-[var(--text-muted)] xl:inline">Datos según permisos actuales</span>
        </div>
      }
      sections={ADMIN_SECTIONS}
      workspaceLabel={workspaceName || "Sin workspace"}
    >
      {activeSection === "configuration" ? (
        <div className="space-y-5">
          <FunctionalTabRail
            activeTab={activeConfigTab}
            countLabel={`${CONFIG_TABS.length} dominios`}
            description="Selecciona un dominio para administrar su configuración."
            onChange={handleConfigTabNavigation}
            tabs={CONFIG_TABS}
          />
          {configSubTabs.length > 0 ? (
            <ContextSubTabs
              activeSubTab={activeConfigSubTab}
              onChange={handleConfigSubTabNavigation}
              tabs={configSubTabs}
            />
          ) : null}
          {activeConfigTab === "commerce" && activeConfigSubTab === "prices" && !isPlatformAdmin ? (
            <Panel className="border-dashed p-6">
              <div className="flex items-start gap-3">
                <CircleDollarSign className="mt-0.5 h-5 w-5 text-[var(--warning)]" />
                <div>
                  <h3 className="text-[16px] font-semibold text-[var(--text-primary)]">Comercial y costos requiere administración de plataforma</h3>
                  <p className="mt-1 text-[13px] leading-6 text-[var(--text-secondary)]">
                    Los defaults globales, registry de providers y auditoría global se mantienen protegidos por el permiso de plataforma. Los presupuestos FinOps del workspace siguen disponibles desde sus controles correspondientes.
                  </p>
                </div>
              </div>
            </Panel>
          ) : children}
        </div>
      ) : null}
      {activeSection === "productGovernance" ? (
        <div className="space-y-5">
          <FunctionalTabRail
            activeTab={activeProductGovernanceTab}
            countLabel={`${PRODUCT_GOVERNANCE_TABS.length} vistas`}
            description="Administra disponibilidad, reglas, prompts, documentos y entregables sin mezclarlo con la gobernanza técnica del runtime."
            onChange={handleProductGovernanceTabNavigation}
            tabs={PRODUCT_GOVERNANCE_TABS}
            title="Gobierno de producto"
          />
          <ProductGovernanceConsole activeTab={productGovernanceTab.key} isPlatformAdmin={isPlatformAdmin} />
        </div>
      ) : null}
      {activeSection === "overview" ? (
        <AdminOverviewSection
          adminPeriod={adminPeriod}
          analyticsState={effectiveAdminAnalyticsState}
          featureFlagCount={featureFlagCount}
          onNavigate={handleSectionChange}
          onPeriodChange={setAdminPeriod}
          onRefresh={() => setAdminRefreshIndex((value) => value + 1)}
          providerLabel={providerLabel}
          runtimeHealth={runtimeHealth}
          workspaceName={workspaceName}
          workspaceRole={workspaceRole}
        />
      ) : null}
      {activeSection === "llm" ? <div className="space-y-5"><Panel className="p-5"><div className="flex items-start gap-3"><BarChart3 className="mt-0.5 h-5 w-5 text-[var(--brand-primary)]" /><div><h3 className="text-[17px] font-semibold text-[var(--text-primary)]">Analítica y consumo de LLM</h3><p className="mt-1 text-[13px] leading-6 text-[var(--text-secondary)]">Tokens de entrada y salida, costos, proveedores, modelos, latencia, alertas y consumidores principales desde FinOps.</p></div></div></Panel><FinOpsDashboard /></div> : null}
      {activeSection === "projects" ? (
        <AdminProjectsSection
          adminPeriod={adminPeriod}
          analyticsState={effectiveAdminAnalyticsState}
          items={projectItems}
          onPeriodChange={setAdminPeriod}
          onRefresh={() => setAdminRefreshIndex((value) => value + 1)}
        />
      ) : null}
      {activeSection === "users" ? (
        <AdminUsersSection
          currentUser={currentUser}
          directoryState={effectiveAdminDirectoryState}
          invitationDraft={adminInvitationDraft}
          invitationFeedback={adminDirectoryFeedback}
          invitationPending={adminInvitationPending}
          onDraftChange={(patch) => setAdminInvitationDraft((draft) => ({ ...draft, ...patch }))}
          onInviteUser={(payload) => { void handleAdminInvitationCreate(payload); }}
          onRefresh={() => setAdminDirectoryRefreshIndex((value) => value + 1)}
          onUpdateUser={(user, payload) => { void handleAdminUserUpdate(user, payload); }}
          userMutationPendingId={adminUserMutationPendingId}
          workspaceId={workspaceId}
          workspaceName={workspaceName}
        />
      ) : null}
      {activeSection === "roles" ? (
        <AdminRolesSection
          directoryState={effectiveAdminDirectoryState}
          onRefresh={() => setAdminDirectoryRefreshIndex((value) => value + 1)}
          workspaceRole={workspaceRole}
        />
      ) : null}
    </SettingsAdminConsoleFrame>
  );
}

