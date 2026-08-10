"use client";

import { FolderKanban, Plus } from "lucide-react";
import { useLanguage } from "@/core/i18n/language-context";

export function ProjectPortfolioHeader({
  canCreate,
  creating,
  onCreateProject,
}: {
  canCreate: boolean;
  creating: boolean;
  onCreateProject: () => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-3 rounded-[10px] border border-[var(--border-default)] bg-white px-4 py-3 shadow-[var(--shadow-card)] lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[var(--brand-soft)] text-[var(--brand-primary)]">
          <FolderKanban className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--brand-primary)]">
            {t("projects.eyebrow", "Portafolio")}
          </p>
          <h1 className="mt-0.5 text-[21px] font-semibold leading-tight text-[var(--text-primary)]">
            {t("projects.title", "Mis proyectos")}
          </h1>
          <p className="mt-0.5 max-w-3xl text-[12px] leading-5 text-[var(--text-secondary)]">
            {t("projects.description", "Administra proyectos del workspace sin mezclar etapas LEAN ni entregables.")}
          </p>
        </div>
      </div>
      {canCreate ? (
        <button
          type="button"
          onClick={onCreateProject}
          disabled={creating}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-[8px] bg-[var(--brand-primary)] px-3 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[var(--brand-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          {creating ? t("projects.creating", "Creando...") : t("projects.newProject", "Nuevo proyecto")}
        </button>
      ) : null}
    </div>
  );
}
