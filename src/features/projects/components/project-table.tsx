"use client";

import type { ProjectPortfolioItem } from "@/features/projects/project-portfolio-contracts";
import {
  getProjectDisplayTitle,
  getProjectStatusTone,
} from "@/features/projects/project-portfolio-model";
import { ProjectRowActions } from "@/features/projects/components/project-row-actions";
import { useLanguage } from "@/core/i18n/language-context";
import { cn } from "@/lib/utils";

export function ProjectTable({
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
    <div className="hidden overflow-hidden rounded-[12px] border border-[var(--border-default)] bg-white shadow-[var(--shadow-card)] lg:block">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-left">
          <thead className="bg-[var(--surface-subtle)] text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
            <tr>
              <th className="w-[35%] px-3 py-2">{t("projects.columnProject", "Proyecto")}</th>
              <th className="w-[10%] px-2 py-2">{t("projects.columnStatus", "Estado")}</th>
              <th className="w-[10%] px-2 py-2">{t("projects.columnStage", "Etapa")}</th>
              <th className="w-[10%] px-2 py-2">{t("projects.columnPlan", "Plan")}</th>
              <th className="w-[9%] px-2 py-2">{t("projects.columnPending", "Pend.")}</th>
              <th className="w-[12%] px-2 py-2">{t("projects.columnUpdated", "Actualizado")}</th>
              <th className="w-[14%] px-3 py-2 text-right">{t("projects.columnActions", "Acciones")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {items.map((project) => {
              const title = getProjectDisplayTitle(project);
              const progress = project.progress_percent ?? 0;
              const disabled = mutatingProjectId === project.id;
              const canOpen = project.capabilities?.can_open !== false;

              return (
                <tr key={project.id} className="h-[52px] transition hover:bg-[var(--surface-subtle)]/70">
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => onOpen(project)}
                      disabled={!canOpen || disabled}
                      className="block max-w-[430px] truncate text-left text-[12px] font-semibold text-[var(--text-primary)] hover:text-[var(--brand-primary)] disabled:cursor-not-allowed disabled:text-[var(--text-muted)]"
                      title={title}
                    >
                      {title}
                    </button>
                    <div className="mt-1 flex items-center gap-1.5">
                      <div className="h-1 w-[96px] overflow-hidden rounded-full bg-[var(--surface-subtle)]">
                        <span
                          className="block h-full rounded-full bg-[var(--brand-primary)]"
                          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)]">{progress}%</span>
                      {project.title_source === "manual" ? (
                        <span className="text-[10px] text-[var(--text-muted)]">{t("projects.manual", "manual")}</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <StatusPill tone={getProjectStatusTone(project.status)}>{statusLabels[project.status] ?? project.status}</StatusPill>
                  </td>
                  <td className="px-2 py-2 text-[12px] font-medium text-[var(--text-primary)]">
                    {stageLabels[project.current_stage] ?? project.current_stage}
                  </td>
                  <td className="px-2 py-2">
                    <span className="rounded-full bg-[var(--brand-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--brand-primary)]">
                      {project.commercial_tier ? tierLabels[project.commercial_tier] ?? project.commercial_tier : tierLabels.blueprint}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-[12px] font-semibold text-[var(--text-primary)]">
                    {project.pending_attention_count ?? 0}
                  </td>
                  <td className="px-2 py-2 text-[11px] text-[var(--text-secondary)]">
                    {formatProjectDateLabel(project.updated_at)}
                  </td>
                  <td className="px-3 py-2">
                    <ProjectRowActions
                      disabled={disabled}
                      onArchive={onArchive}
                      onDelete={onDelete}
                      onOpen={onOpen}
                      onRename={onRename}
                      onRestore={onRestore}
                      project={project}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusPill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold",
        tone === "success" && "border-[rgba(22,101,52,0.18)] bg-[var(--success-soft)] text-[var(--success)]",
        tone === "warning" && "border-[rgba(146,64,14,0.18)] bg-[var(--warning-soft)] text-[var(--warning)]",
        tone === "danger" && "border-[rgba(185,28,28,0.18)] bg-[var(--danger-soft)] text-[var(--danger)]",
        tone === "neutral" && "border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-[var(--text-secondary)]",
      )}
    >
      {children}
    </span>
  );
}
