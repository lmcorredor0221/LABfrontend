"use client";

import { Search } from "lucide-react";
import type {
  ProjectLifecycle,
  ProjectPortfolioQuery,
  ProjectSort,
} from "@/features/projects/project-portfolio-contracts";
import type { ArtifactStatus, CommercialTier } from "@/features/sessions/types";
import { useLanguage } from "@/core/i18n/language-context";
import { cn } from "@/lib/utils";

const lifecycleItems: Array<{
  countKey: "active" | "needs_review" | "archived" | "trash";
  label: string;
  value: ProjectLifecycle;
}> = [
  { countKey: "active", label: "Activos", value: "active" },
  { countKey: "needs_review", label: "Atencion", value: "active" },
  { countKey: "archived", label: "Archivados", value: "archived" },
  { countKey: "trash", label: "Papelera", value: "trash" },
];

export function ProjectToolbar({
  facets,
  onChange,
  query,
}: {
  facets: {
    active: number;
    archived: number;
    needs_review: number;
    trash: number;
  };
  onChange: (patch: Partial<ProjectPortfolioQuery>) => void;
  query: ProjectPortfolioQuery;
}) {
  const { language, t } = useLanguage();
  const statusOptions = [
    { label: t("projects.filterStatus", "Filtrar por estado"), value: "all" },
    { label: languageAwareStatusLabel("draft", language), value: "draft" },
    { label: languageAwareStatusLabel("ready", language), value: "ready" },
    { label: t("projects.statusNeedsReview", "Atención"), value: "needs_review" },
    { label: languageAwareStatusLabel("failed", language), value: "failed" },
  ];
  const tierOptions = [
    { label: t("projects.filterPlan", "Filtrar por plan"), value: "all" },
    { label: "Blueprint", value: "blueprint" },
    { label: "Blueprint Pro", value: "blueprint_pro" },
    { label: "ACP", value: "acp" },
  ];
  const sortOptions = [
    { label: t("projects.filterSort", "Ordenar proyectos"), value: "updated_desc" },
    { label: "A-Z", value: "title_asc" },
    { label: "Z-A", value: "title_desc" },
    {
      label:
        language === "en"
          ? "Oldest first"
          : language === "pt"
            ? "Mais antigo primeiro"
            : "Actualizado mas antiguo",
      value: "updated_asc",
    },
    { label: language === "en" ? "Recently updated" : language === "pt" ? "Atualizado recentemente" : "Actualizado reciente", value: "updated_desc" },
  ];
  const localizedLifecycleItems = [
    { ...lifecycleItems[0], label: t("projects.statusActive", "Activos") },
    { ...lifecycleItems[1], label: t("projects.statusNeedsReview", "Atención") },
    { ...lifecycleItems[2], label: t("projects.statusArchived", "Archivados") },
    { ...lifecycleItems[3], label: t("projects.statusTrash", "Papelera") },
  ];

  return (
    <section
      aria-label={t("projects.eyebrow", "Portafolio")}
      className="rounded-[10px] border border-[var(--border-default)] bg-white px-3 py-3 shadow-[var(--shadow-card)]"
    >
      <div className="grid gap-2 xl:grid-cols-[minmax(260px,1fr)_150px_150px_180px_auto] xl:items-center">
        <label className="relative block">
          <span className="sr-only">{t("projects.searchPlaceholder", "Buscar por nombre de proyecto")}</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <input
            className="h-9 w-full rounded-[8px] border border-[var(--border-default)] bg-white pl-9 pr-3 text-[12px] text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--border-focus)]"
            placeholder={t("projects.searchPlaceholder", "Buscar por nombre de proyecto")}
            value={query.q}
            onChange={(event) => onChange({ q: event.target.value })}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onChange({ q: event.currentTarget.value });
              }
            }}
          />
        </label>

        <CompactSelect
          ariaLabel={t("projects.filterStatus", "Filtrar por estado")}
          value={query.status ?? "all"}
          onChange={(value) => onChange({ status: value as ArtifactStatus | "all" })}
          options={statusOptions}
        />
        <CompactSelect
          ariaLabel={t("projects.filterPlan", "Filtrar por plan")}
          value={query.tier ?? "all"}
          onChange={(value) => onChange({ tier: value as CommercialTier | "all" })}
          options={tierOptions}
        />
        <CompactSelect
          ariaLabel={t("projects.filterSort", "Ordenar proyectos")}
          value={query.sort}
          onChange={(value) => onChange({ sort: value as ProjectSort })}
          options={sortOptions}
        />

        <div className="flex flex-wrap items-center gap-1.5 xl:justify-end">
          {localizedLifecycleItems.map((item) => {
            const isAttention = item.countKey === "needs_review";
            const active = isAttention
              ? query.lifecycle === "active" && query.status === "needs_review"
              : query.lifecycle === item.value && query.status !== "needs_review";

            return (
              <button
                key={`${item.value}-${item.countKey}`}
                type="button"
                onClick={() => {
                  onChange({
                    lifecycle: item.value,
                    status: isAttention ? "needs_review" : query.status === "needs_review" ? "all" : query.status,
                  });
                }}
                title={item.label}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-[8px] border px-2.5 text-[12px] font-semibold transition",
                  active
                    ? "border-[var(--brand-primary)] bg-[var(--brand-soft)] text-[var(--brand-primary)]"
                    : "border-[var(--border-default)] bg-white text-[var(--text-secondary)] hover:border-[var(--border-focus)]",
                )}
              >
                <span>{item.label}</span>
                <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]">
                  {facets[item.countKey]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function languageAwareStatusLabel(status: ArtifactStatus | "all", language: "es" | "en" | "pt") {
  switch (status) {
    case "draft":
      return language === "en" ? "Draft" : language === "pt" ? "Rascunho" : "Borrador";
    case "ready":
      return language === "en" ? "Ready" : language === "pt" ? "Pronto" : "Listo";
    case "failed":
      return language === "en" ? "Error" : language === "pt" ? "Erro" : "Con error";
    default:
      return language === "en" ? "All statuses" : language === "pt" ? "Todos os status" : "Todos los estados";
  }
}

function CompactSelect({
  ariaLabel,
  onChange,
  options,
  value,
}: {
  ariaLabel: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <select
      aria-label={ariaLabel}
      className="h-9 rounded-[8px] border border-[var(--border-default)] bg-white px-2.5 text-[12px] font-medium text-[var(--text-primary)] outline-none transition focus:border-[var(--border-focus)]"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
