"use client";

import { useLanguage } from "@/core/i18n/language-context";

export function ProjectSummaryStrip({
  facets,
  total,
}: {
  facets: {
    active: number;
    archived: number;
    needs_review: number;
    trash: number;
  };
  total: number;
}) {
  const { t } = useLanguage();

  const statItems = [
    { key: "active", label: t("projects.statusActive", "Activos"), tone: "bg-[var(--brand-primary)]" },
    { key: "needs_review", label: t("projects.statusAttention", "Atención"), tone: "bg-[var(--warning)]" },
    { key: "archived", label: t("projects.statusArchived", "Archivados"), tone: "bg-[var(--text-muted)]" },
    { key: "trash", label: t("projects.statusTrash", "Papelera"), tone: "bg-[var(--danger)]" },
  ] as const;

  return (
    <section
      className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-[10px] border border-[var(--border-default)] bg-white px-4 py-2.5 shadow-[var(--shadow-card)]"
      aria-label={t("projects.summaryAria", "Resumen del portafolio")}
    >
      <div className="flex items-baseline gap-2 border-r border-[var(--border-subtle)] pr-5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
          {t("projects.statusTotal", "Total")}
        </span>
        <span className="text-[18px] font-semibold leading-none text-[var(--text-primary)]">{total}</span>
      </div>
      {statItems.map((item) => {
        return (
          <div
            key={item.key}
            className="flex items-center gap-2 text-[12px] text-[var(--text-secondary)]"
          >
            <span className={`h-2 w-2 rounded-full ${item.tone}`} />
            <span>{item.label}</span>
            <span className="font-semibold text-[var(--text-primary)]">{facets[item.key]}</span>
          </div>
        );
      })}
    </section>
  );
}
