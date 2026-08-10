"use client";

import type { ProjectPortfolioItem } from "@/features/projects/project-portfolio-contracts";
import {
  getProjectDisplayTitle,
} from "@/features/projects/project-portfolio-model";
import { ProjectRowActions } from "@/features/projects/components/project-row-actions";
import { useLanguage } from "@/core/i18n/language-context";

export function ProjectMobileList({
  items,
  mutatingProjectId,
  onArchive,
  onDelete,
  onOpen,
  onRename,
  onRestore,
}: {
  items: ProjectPortfolioItem[];
  mutatingProjectId: string | null;
  onArchive: (project: ProjectPortfolioItem) => void;
  onDelete: (project: ProjectPortfolioItem) => void;
  onOpen: (project: ProjectPortfolioItem) => void;
  onRename: (project: ProjectPortfolioItem) => void;
  onRestore: (project: ProjectPortfolioItem) => void;
}) {
  const { language, t } = useLanguage();
  const locale = language === "pt" ? "pt-BR" : language === "en" ? "en-US" : "es-CO";
  const stageLabels: Record<string, string> = {
    build_blueprint: "Blueprint",
    build_canvas: "Canvas",
    draft_capture: language === "en" ? "Capture" : language === "pt" ? "Captura" : "Captura",
    input_validation: language === "en" ? "Validation" : language === "pt" ? "Validação" : "Validación",
    normalize_discovery: language === "en" ? "Discover" : language === "pt" ? "Descobrir" : "Descubrir",
    post_validation: language === "en" ? "Review" : language === "pt" ? "Revisão" : "Revisión",
    ready_for_export: language === "en" ? "Exportable" : language === "pt" ? "Exportável" : "Exportable",
  };
  const statusLabels: Record<string, string> = {
    draft: language === "en" ? "Draft" : language === "pt" ? "Rascunho" : "Borrador",
    failed: language === "en" ? "Error" : language === "pt" ? "Erro" : "Error",
    needs_review: t("projects.statusNeedsReview", "Atención"),
    ready: language === "en" ? "Ready" : language === "pt" ? "Pronto" : "Listo",
  };
  const tierLabels: Record<string, string> = {
    acp: "ACP",
    blueprint: "Blueprint",
    blueprint_pro: "Blueprint Pro",
  };
  const formatProjectDateLabel = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return t("common.noTimestamp", "No timestamp available");
    }
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      month: "short",
    }).format(date);
  };

  return (
    <div className="space-y-1.5 lg:hidden">
      {items.map((project) => {
        const title = getProjectDisplayTitle(project);
        const canOpen = project.capabilities?.can_open !== false;

        return (
          <article
            key={project.id}
            className="rounded-[10px] border border-[var(--border-default)] bg-white px-3 py-2.5 shadow-[var(--shadow-card)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => onOpen(project)}
                  disabled={!canOpen || mutatingProjectId === project.id}
                  className="max-w-full truncate text-left text-[13px] font-semibold text-[var(--text-primary)] disabled:cursor-not-allowed disabled:text-[var(--text-muted)]"
                >
                  {title}
                </button>
                <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
                  {(stageLabels[project.current_stage] ?? project.current_stage)} - {project.commercial_tier ? tierLabels[project.commercial_tier] ?? project.commercial_tier : tierLabels.blueprint}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-[var(--surface-subtle)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-secondary)]">
                {statusLabels[project.status] ?? project.status}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="text-[11px] text-[var(--text-secondary)]">
                <span>{formatProjectDateLabel(project.updated_at)}</span>
                <span className="ml-2 font-semibold">{project.pending_attention_count ?? 0} {t("projects.pendingSuffix", "pendientes")}</span>
              </div>
              <ProjectRowActions
                disabled={mutatingProjectId === project.id}
                onArchive={onArchive}
                onDelete={onDelete}
                onOpen={onOpen}
                onRename={onRename}
                onRestore={onRestore}
                project={project}
              />
            </div>
          </article>
        );
      })}
    </div>
  );
}
