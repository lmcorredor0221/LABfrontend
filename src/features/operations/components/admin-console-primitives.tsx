"use client";

import { Fragment, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  ChevronDown,
  ChevronRight,
  Command,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
} from "lucide-react";
import { Sparkline } from "@/components/lean/charts";
import { PageChrome, WorkspaceShell } from "@/components/lean/shell";
import {
  AdminBadge as Badge,
  AdminButton as AppButton,
  AdminSurface as Panel,
  type AdminDesignTone,
} from "@/features/operations/components/admin-design-system";
import { cn } from "@/lib/utils";

export type AdminBadgeTone = AdminDesignTone;
export type AdminCapabilityStatus = "available" | "gap" | "partial";

export type AdminSectionDefinition<TKey extends string = string> = {
  badge?: string;
  badgeTone?: AdminBadgeTone;
  counter?: string | number;
  description: string;
  group: string;
  icon: LucideIcon;
  key: TKey;
  label: string;
};

export type AdminConfigTabDefinition<TKey extends string = string> = {
  badge: string;
  description: string;
  icon: LucideIcon;
  key: TKey;
  label: string;
  status: AdminCapabilityStatus;
};

export type AdminSubTabDefinition<TKey extends string = string> = {
  description?: string;
  key: TKey;
  label: string;
};

export type AdminKpiDefinition = {
  delta: string;
  detail: string;
  icon: LucideIcon;
  label: string;
  tone: AdminBadgeTone;
  trend: number[];
  value: string;
};

export type AdminDetailField = {
  label: string;
  tone?: AdminBadgeTone;
  value: ReactNode;
};

export type AdminActionDefinition = {
  label: string;
  onClick?: () => void;
  tone?: AdminBadgeTone;
};

export type AdminAccordionRow = {
  detail: ReactNode;
  expandedActions?: AdminActionDefinition[];
  fields?: AdminDetailField[];
  id: string;
  name: string;
  owner: ReactNode;
  primaryAction?: AdminActionDefinition | string;
  scope: ReactNode;
  statusLabel: ReactNode;
  statusTone: AdminBadgeTone;
  summary: ReactNode;
};

export type AdminViewAvailability =
  | "empty"
  | "error"
  | "forbidden"
  | "loading"
  | "partial"
  | "ready"
  | "requires-development";

function statusCopy(status: AdminCapabilityStatus) {
  if (status === "available") {
    return { label: "Disponible hoy", tone: "green" as const };
  }
  if (status === "partial") {
    return { label: "Parcial", tone: "orange" as const };
  }
  return { label: "Requiere desarrollo", tone: "slate" as const };
}

export function AdminSourceNote({
  children,
  status = "available",
}: {
  children: ReactNode;
  status?: AdminCapabilityStatus;
}) {
  const copy = statusCopy(status);

  return (
    <div className="flex items-start gap-3 rounded-[18px] border border-[var(--border-default)] bg-[var(--surface-subtle)] px-4 py-3">
      <BadgeCheck className="mt-0.5 h-4 w-4 text-[var(--brand-primary)]" />
      <div className="min-w-0 flex-1">
        <Badge tone={copy.tone}>{copy.label}</Badge>
        <p className="mt-2 text-[12px] leading-5 text-[var(--text-secondary)]">{children}</p>
      </div>
    </div>
  );
}

export function AdminKpiCard({ item }: { item: AdminKpiDefinition }) {
  const Icon = item.icon;

  return (
    <Panel className="p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-medium text-[var(--text-secondary)]">{item.label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[var(--surface-subtle)] text-[var(--brand-primary)]">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-4 text-[28px] font-semibold leading-none text-[var(--text-primary)]">{item.value}</p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div>
          <Badge tone={item.tone}>{item.delta}</Badge>
          <p className="mt-2 text-[12px] text-[var(--text-secondary)]">{item.detail}</p>
        </div>
        <Sparkline values={item.trend} className="max-w-[110px]" />
      </div>
    </Panel>
  );
}

export function AdminSessionStatusBar({
  environmentLabel,
  latencyLabel,
  runtimeIcon,
  runtimeLabel,
  searchLabel = "Buscar comando...",
  shortcutLabel = "⌘K",
}: {
  environmentLabel: string;
  latencyLabel?: string;
  runtimeIcon?: ReactNode;
  runtimeLabel: string;
  searchLabel?: string;
  shortcutLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-default)] bg-[var(--surface-subtle)] px-6 py-2.5">
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-secondary)]">
            {environmentLabel}
          </span>
        </div>
        <span className="hidden h-3 w-px bg-[var(--border-default)] sm:block" />
        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--text-primary)]">
          {runtimeIcon}
          <span className="truncate">{runtimeLabel}</span>
          {latencyLabel ? <Badge tone="green" className="px-1.5 py-0 font-mono text-[10px]">{latencyLabel}</Badge> : null}
        </div>
      </div>

      <button
        type="button"
        className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-white px-2.5 py-1 text-[12px] text-[var(--text-secondary)] shadow-xs hover:border-[var(--border-focus)] hover:text-[var(--text-primary)]"
      >
        <Command className="h-3 w-3" />
        <span className="hidden font-medium sm:inline">{searchLabel}</span>
        <kbd className="rounded border bg-[var(--surface-subtle)] px-1 font-mono text-[10px]">{shortcutLabel}</kbd>
      </button>
    </div>
  );
}

export function AdminNavigationRail<TKey extends string>({
  activeSection,
  collapsed,
  groups,
  onSelectSection,
  onToggle,
  planLabel,
  scopeEyebrow = "Espacio de Trabajo",
  sections,
  workspaceLabel,
}: {
  activeSection: TKey;
  collapsed: boolean;
  groups: readonly string[];
  onSelectSection: (key: TKey) => void;
  onToggle: () => void;
  planLabel?: string;
  scopeEyebrow?: string;
  sections: readonly AdminSectionDefinition<TKey>[];
  workspaceLabel: string;
}) {
  return (
    <aside
      className={cn(
        "flex w-full flex-col overflow-x-hidden overflow-y-auto border-b border-[var(--border-default)] bg-white transition-[width,max-height,padding] duration-200 lg:shrink-0 lg:border-b-0 lg:border-r",
        collapsed ? "max-h-[76px] p-3 lg:max-h-none lg:w-[72px] lg:p-2" : "max-h-[680px] p-4 lg:max-h-none lg:w-[280px]",
      )}
    >
      <div className={cn("flex items-center gap-2", collapsed ? "mb-0 justify-center" : "mb-6 justify-between px-2")}>
        {collapsed ? (
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[12px] font-bold text-[var(--brand-primary)]"
            title={workspaceLabel}
          >
            {workspaceLabel.slice(0, 2).toUpperCase()}
          </span>
        ) : (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{scopeEyebrow}</p>
            <div className="mt-1 flex items-center gap-3">
              <p className="text-[15px] font-bold text-[var(--text-primary)]">{workspaceLabel}</p>
              {planLabel ? <Badge tone="violet">{planLabel}</Badge> : null}
            </div>
          </div>
        )}
        <button
          type="button"
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Mostrar menu principal" : "Ocultar menu principal"}
          title={collapsed ? "Mostrar menu principal" : "Ocultar menu principal"}
          onClick={onToggle}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border-default)] bg-white text-[var(--text-secondary)] transition hover:border-[var(--border-focus)] hover:text-[var(--brand-primary)]"
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      <nav className={cn("space-y-6", collapsed && "space-y-3")} aria-label="Navegacion principal">
        {groups.map((group) => (
          <div key={group} className="space-y-1">
            <p className={cn("px-2.5 text-[12px] font-bold uppercase tracking-wider text-[var(--text-muted)]", collapsed && "sr-only")}>
              {group}
            </p>
            <div className="space-y-1">
              {sections.filter((section) => section.group === group).map((item) => {
                const Icon = item.icon;
                const isSelected = activeSection === item.key;

                return (
                  <button
                    key={item.key}
                    type="button"
                    aria-current={isSelected ? "page" : undefined}
                    aria-label={collapsed ? item.label : undefined}
                    title={collapsed ? item.label : undefined}
                    onClick={() => onSelectSection(item.key)}
                    className={cn(
                      "group flex w-full items-center rounded-xl py-2 text-left text-[13px] font-medium transition-all",
                      collapsed ? "justify-center px-2" : "justify-between px-3",
                      isSelected
                        ? "bg-[var(--brand-primary)] font-semibold text-white shadow-sm"
                        : "text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]",
                    )}
                  >
                    <div className={cn("flex min-w-0 items-center gap-2.5", collapsed && "justify-center")}>
                      <Icon className={cn("h-4 w-4 shrink-0", isSelected ? "text-white" : "text-[var(--text-muted)] group-hover:text-[var(--brand-primary)]")} />
                      <span className={cn("truncate", collapsed && "sr-only")}>{item.label}</span>
                    </div>
                    <div className={cn("flex items-center gap-1.5", collapsed && "hidden")}>
                      {item.counter ? (
                        <span className={cn("rounded-md px-1.5 py-0.5 font-mono text-[12px] font-semibold", isSelected ? "bg-white/20 text-white" : "bg-[var(--surface-subtle)] text-[var(--text-secondary)]")}>
                          {item.counter}
                        </span>
                      ) : null}
                      {item.badge && !item.counter && !isSelected ? <Badge tone={item.badgeTone ?? "slate"}>{item.badge}</Badge> : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}

export function FunctionalTabRail<TKey extends string>({
  activeTab,
  countLabel,
  description,
  onChange,
  tabs,
  title = "Tabs funcionales",
}: {
  activeTab: TKey;
  countLabel?: string;
  description: string;
  onChange: (key: TKey) => void;
  tabs: readonly AdminConfigTabDefinition<TKey>[];
  title?: string;
}) {
  return (
    <section aria-labelledby="settings-functional-tabs-title" className="overflow-hidden rounded-[18px] border border-[var(--border-default)] bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-default)] px-5 py-4">
        <div>
          <p id="settings-functional-tabs-title" className="text-[12px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            {title}
          </p>
          <p className="mt-1 text-[13px] leading-5 text-[var(--text-secondary)]">{description}</p>
        </div>
        {countLabel ? <Badge tone="slate">{countLabel}</Badge> : null}
      </div>

      <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5" role="tablist" aria-label={title}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const selected = tab.key === activeTab;
          const copy = statusCopy(tab.status);

          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={selected}
              title={tab.description}
              onClick={() => onChange(tab.key)}
              className={cn(
                "group flex min-h-[84px] min-w-0 w-full items-center gap-3 rounded-[16px] border px-3 py-2.5 text-left transition",
                selected
                  ? "border-[rgba(79,70,245,0.28)] bg-[var(--brand-soft)]"
                  : "border-transparent bg-transparent hover:border-[var(--border-default)] hover:bg-[var(--surface-subtle)]",
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px]",
                  selected ? "bg-[var(--brand-primary)] text-white" : "bg-white text-[var(--brand-primary)]",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col items-start justify-center gap-1">
                <span className="max-w-full text-[13px] font-semibold leading-5 text-[var(--text-primary)]">{tab.label}</span>
                <Badge className="shrink-0" tone={selected ? "violet" : copy.tone}>{tab.badge}</Badge>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function ContextSubTabs<TKey extends string>({
  activeSubTab,
  onChange,
  tabs,
}: {
  activeSubTab: TKey;
  onChange: (key: TKey) => void;
  tabs: readonly AdminSubTabDefinition<TKey>[];
}) {
  return (
    <div className="scrollbar-subtle flex snap-x gap-2 overflow-x-auto rounded-[16px] border border-[var(--border-default)] bg-white p-2" role="tablist">
      {tabs.map((tab) => {
        const selected = activeSubTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={selected}
            title={tab.description}
            onClick={() => onChange(tab.key)}
            className={cn(
              "min-h-10 shrink-0 snap-start rounded-[12px] px-4 text-[13px] font-semibold transition",
              selected ? "bg-[var(--brand-primary)] text-white shadow-sm" : "text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export function AdminSectionHeader({
  actions,
  badge,
  description,
  icon: Icon,
  title,
}: {
  actions?: ReactNode;
  badge?: ReactNode;
  description: ReactNode;
  icon: LucideIcon;
  title: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--border-default)] bg-white p-5">
      <div className="flex items-center gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand-primary)]">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-[20px] font-bold text-[var(--text-primary)]">{title}</h2>
          <p className="text-[13px] leading-6 text-[var(--text-secondary)]">{description}</p>
        </div>
      </div>
      {actions ?? badge ?? null}
    </div>
  );
}

export function AdminResponsiveAccordionTable({
  description,
  rows,
  title,
}: {
  description: ReactNode;
  rows: AdminAccordionRow[];
  title: ReactNode;
}) {
  const [expandedRow, setExpandedRow] = useState(rows[0]?.id ?? "");

  return (
    <Panel className="overflow-hidden p-0">
      <div className="border-b border-[var(--border-default)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[20px] font-semibold text-[var(--text-primary)]">{title}</p>
            <p className="mt-1 max-w-3xl text-[13px] leading-6 text-[var(--text-secondary)]">{description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="violet">Tabla + acordeón</Badge>
            <Badge tone="slate">Detalle responsive</Badge>
          </div>
        </div>
      </div>

      <div className="overflow-hidden">
        <table className="w-full table-auto border-collapse text-left">
          <thead>
            <tr className="border-b border-[var(--border-default)] bg-[var(--surface-subtle)] text-[12px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
              <th className="px-3 py-3 font-semibold sm:px-5">Configuración</th>
              <th className="px-3 py-3 font-semibold sm:px-5">Estado</th>
              <th className="px-3 py-3 font-semibold sm:px-5">Alcance</th>
              <th className="hidden px-5 py-3 font-semibold lg:table-cell">Responsable</th>
              <th className="hidden px-5 py-3 font-semibold xl:table-cell">Acción visible</th>
              <th className="px-3 py-3 text-right font-semibold sm:px-5">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isExpanded = expandedRow === row.id;
              const primaryAction =
                typeof row.primaryAction === "string" ? { label: row.primaryAction } : row.primaryAction;
              return (
                <Fragment key={row.id}>
                  <tr className="border-b border-[var(--border-subtle)] bg-white align-top">
                    <td className="px-3 py-4 sm:px-5">
                      <p className="text-[14px] font-semibold text-[var(--text-primary)]">{row.name}</p>
                      <p className="mt-1 max-w-lg text-[12px] leading-5 text-[var(--text-secondary)]">{row.summary}</p>
                    </td>
                    <td className="px-3 py-4 sm:px-5">
                      <Badge tone={row.statusTone}>{row.statusLabel}</Badge>
                    </td>
                    <td className="px-3 py-4 text-[12px] font-medium text-[var(--text-secondary)] sm:px-5">{row.scope}</td>
                    <td className="hidden px-5 py-4 text-[12px] font-medium text-[var(--text-secondary)] lg:table-cell">{row.owner}</td>
                    <td className="hidden px-5 py-3 xl:table-cell">
                      {primaryAction ? (
                        <AppButton className="h-9 px-3 text-[12px]" onClick={primaryAction.onClick} variant="ghost">
                          {primaryAction.label}
                        </AppButton>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 text-right sm:px-5">
                      <button
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? `Contraer ${row.name}` : `Expandir ${row.name}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-[12px] border border-[var(--border-default)] bg-white text-[var(--brand-primary)] transition hover:bg-[var(--brand-soft)]"
                        type="button"
                        onClick={() => setExpandedRow(isExpanded ? "" : row.id)}
                      >
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                    </td>
                  </tr>
                  {isExpanded ? (
                    <tr className="border-b border-[var(--border-default)] bg-[var(--surface-subtle)]">
                      <td className="px-5 py-4" colSpan={6}>
                        <div className="grid gap-4 rounded-[18px] border border-[var(--border-default)] bg-white p-4 lg:grid-cols-[minmax(0,1fr)_minmax(220px,320px)]">
                          <div>
                            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Detalle secundario</p>
                            <div className="mt-2 text-[13px] leading-6 text-[var(--text-secondary)]">{row.detail}</div>
                            <div className="mt-4 grid gap-3 md:grid-cols-2 lg:hidden">
                              <div className="rounded-[14px] border border-[var(--border-default)] bg-[var(--surface-subtle)] px-3 py-3">
                                <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">Responsable</p>
                                <div className="mt-1 text-[13px] font-semibold text-[var(--text-primary)]">{row.owner}</div>
                              </div>
                              {primaryAction ? (
                                <div className="rounded-[14px] border border-[var(--border-default)] bg-[var(--surface-subtle)] px-3 py-3">
                                  <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">Acción visible</p>
                                  <div className="mt-2">
                                    <AppButton
                                      aria-label={`${primaryAction.label} desde detalle`}
                                      className="h-9 px-3 text-[12px]"
                                      onClick={primaryAction.onClick}
                                      variant="ghost"
                                    >
                                      {primaryAction.label}
                                    </AppButton>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                            {row.fields?.length ? (
                              <div className="mt-4 grid gap-3 md:grid-cols-3">
                                {row.fields.map((field) => (
                                  <div key={`${row.id}-${field.label}`} className="rounded-[14px] border border-[var(--border-default)] bg-[var(--surface-subtle)] px-3 py-3">
                                    <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">{field.label}</p>
                                    <div className="mt-1 text-[13px] font-semibold text-[var(--text-primary)]">
                                      {field.tone ? <Badge tone={field.tone}>{field.value}</Badge> : field.value}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                          <div>
                            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Acciones al expandir</p>
                            <div className="mt-3 flex flex-col gap-2">
                              {(row.expandedActions ?? []).map((action) => (
                                <AppButton
                                  key={`${row.id}-${action.label}`}
                                  className={cn(
                                    "h-10 justify-start px-3 text-[12px]",
                                    action.tone === "red" && "text-[var(--danger)]",
                                    action.tone === "orange" && "text-[var(--warning)]",
                                    action.tone === "blue" && "text-[var(--info)]",
                                  )}
                                  onClick={action.onClick}
                                  variant="secondary"
                                >
                                  {action.label}
                                </AppButton>
                              ))}
                            </div>
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
  );
}

export function AdminFormPanel({
  actions,
  children,
  description,
  eyebrow,
  title,
}: {
  actions?: ReactNode;
  children: ReactNode;
  description: ReactNode;
  eyebrow: ReactNode;
  title: ReactNode;
}) {
  return (
    <Panel className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge tone="violet">{eyebrow}</Badge>
          <p className="mt-3 text-[20px] font-semibold text-[var(--text-primary)]">{title}</p>
          <p className="mt-1 max-w-3xl text-[13px] leading-6 text-[var(--text-secondary)]">{description}</p>
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      <div className="mt-5">{children}</div>
    </Panel>
  );
}

export function AdminViewState({
  action,
  description,
  state,
  title,
}: {
  action?: ReactNode;
  description: ReactNode;
  state: AdminViewAvailability;
  title: ReactNode;
}) {
  const tone: AdminBadgeTone =
    state === "ready" ? "green" : state === "error" || state === "forbidden" ? "red" : state === "partial" ? "orange" : "slate";

  return (
    <Panel className="p-6">
      <div className="flex items-start gap-3">
        <Search className="mt-0.5 h-5 w-5 text-[var(--brand-primary)]" />
        <div className="min-w-0 flex-1">
          <Badge tone={tone}>{state}</Badge>
          <p className="mt-3 text-[17px] font-semibold text-[var(--text-primary)]">{title}</p>
          <p className="mt-1 text-[13px] leading-6 text-[var(--text-secondary)]">{description}</p>
          {action ? <div className="mt-4">{action}</div> : null}
        </div>
      </div>
    </Panel>
  );
}

export function SettingsAdminConsoleFrame<TKey extends string>({
  activeSection,
  actions,
  breadcrumbs,
  children,
  collapsed,
  environmentLabel,
  footer,
  latencyLabel,
  onSelectSection,
  onToggleNavigation,
  planLabel,
  runtimeIcon,
  runtimeLabel,
  sectionActions,
  sections,
  shortcutLabel = "⌘K",
  scopeEyebrow,
  workspaceLabel,
}: {
  activeSection: TKey;
  actions?: ReactNode;
  breadcrumbs: string[];
  children: ReactNode;
  collapsed: boolean;
  environmentLabel: string;
  footer?: ReactNode;
  latencyLabel?: string;
  onSelectSection: (key: TKey) => void;
  onToggleNavigation: () => void;
  planLabel?: string;
  runtimeIcon?: ReactNode;
  runtimeLabel: string;
  sectionActions?: ReactNode;
  sections: readonly AdminSectionDefinition<TKey>[];
  shortcutLabel?: string;
  scopeEyebrow?: string;
  workspaceLabel: string;
}) {
  const active = sections.find((item) => item.key === activeSection) ?? sections[0];
  const groups = Array.from(new Set(sections.map((section) => section.group)));

  return (
    <WorkspaceShell>
      <PageChrome breadcrumbs={breadcrumbs} density="compact" actions={actions}>
        <div className="space-y-4">
          <Panel className="overflow-hidden border border-[var(--border-default)] p-0 shadow-sm">
            <AdminSessionStatusBar
              environmentLabel={environmentLabel}
              latencyLabel={latencyLabel}
              runtimeIcon={runtimeIcon}
              runtimeLabel={runtimeLabel}
              shortcutLabel={shortcutLabel}
            />
            <div className="flex min-h-[560px] flex-col lg:flex-row">
              <AdminNavigationRail
                activeSection={activeSection}
                collapsed={collapsed}
                groups={groups}
                onSelectSection={onSelectSection}
                onToggle={onToggleNavigation}
                planLabel={planLabel}
                scopeEyebrow={scopeEyebrow}
                sections={sections}
                workspaceLabel={workspaceLabel}
              />
              <main className="min-w-0 flex-1 bg-[var(--surface-canvas)] p-6">
                <AdminSectionHeader
                  actions={sectionActions}
                  description={active.description}
                  icon={active.icon}
                  title={active.label}
                />
                {children}
              </main>
            </div>
          </Panel>
          {footer}
        </div>
      </PageChrome>
    </WorkspaceShell>
  );
}

export const CollapsibleAdminSidebar = AdminNavigationRail;
export function AdminAccordionTable(props: Parameters<typeof AdminResponsiveAccordionTable>[0]) {
  return <AdminResponsiveAccordionTable {...props} />;
}

export const AdminDataTable = AdminResponsiveAccordionTable;
export const AccordionDetail = AdminResponsiveAccordionTable;
