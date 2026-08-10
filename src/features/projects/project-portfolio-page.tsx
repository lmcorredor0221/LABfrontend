"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCcw } from "lucide-react";
import { useAuth } from "@/core/auth/auth-context";
import { useLanguage } from "@/core/i18n/language-context";
import { getProjectRoute } from "@/core/routing/routes";
import { PageChrome, TopUtilities, WorkspaceShell } from "@/components/lean/shell";
import { ArchiveProjectDialog, DeleteProjectDialog, RenameProjectDialog } from "@/features/projects/components/project-dialogs";
import { ProjectListSkeleton, ProjectListState, getEmptyPortfolioCopy } from "@/features/projects/components/project-list-state";
import { ProjectMobileList } from "@/features/projects/components/project-mobile-list";
import { ProjectPortfolioHeader } from "@/features/projects/components/project-portfolio-header";
import { ProjectSummaryStrip } from "@/features/projects/components/project-summary-strip";
import { ProjectTable } from "@/features/projects/components/project-table";
import { ProjectToolbar } from "@/features/projects/components/project-toolbar";
import type { ProjectPortfolioItem, ProjectPortfolioMutation } from "@/features/projects/project-portfolio-contracts";
import { useProjectPortfolio } from "@/features/projects/use-project-portfolio";
import { useSessions } from "@/features/sessions/session-context";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function ProjectPortfolioPage() {
  const router = useRouter();
  const auth = useAuth();
  const { t } = useLanguage();
  const sessions = useSessions();
  const portfolio = useProjectPortfolio();
  const [creating, setCreating] = useState(false);
  const [mutation, setMutation] = useState<ProjectPortfolioMutation>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);

  async function handleCreateProject() {
    setCreating(true);
    setInlineError(null);

    try {
      const project = await sessions.createSession({ loadSnapshot: false });
      await sessions.selectSession(project.id, {
        loadSnapshot: false,
        persist: true,
      });
      router.push(getProjectRoute(project.id, "discover"));
    } catch (error) {
      setInlineError(
        getErrorMessage(
          error,
          t("projects.createError", "No se pudo crear el proyecto."),
        ),
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleOpenProject(project: ProjectPortfolioItem) {
    await sessions.selectSession(project.id, {
      loadSnapshot: false,
      persist: true,
    });
    router.push(getProjectRoute(project.id, "discover"));
  }

  async function handleRenameProject(title: string) {
    if (mutation?.kind !== "rename") {
      return;
    }

    setDialogError(null);

    try {
      const updated = await portfolio.renameProject(mutation.project, title);
      await sessions.refreshList({ force: true, loadActiveSnapshot: false, selectSessionId: updated.id }).catch(() => undefined);
      setMutation(null);
    } catch (error) {
      setDialogError(
        getErrorMessage(
          error,
          t("projects.renameError", "No se pudo renombrar el proyecto."),
        ),
      );
    }
  }

  async function handleArchiveProject() {
    if (mutation?.kind !== "archive") {
      return;
    }

    setDialogError(null);

    try {
      const updated = await portfolio.archiveProject(mutation.project);
      await sessions.refreshList({ force: true, loadActiveSnapshot: false, selectSessionId: updated.id }).catch(() => undefined);
      setMutation(null);
    } catch (error) {
      setDialogError(
        getErrorMessage(
          error,
          t("projects.archiveError", "No se pudo archivar el proyecto."),
        ),
      );
    }
  }

  async function handleRestoreProject(project: ProjectPortfolioItem) {
    setInlineError(null);

    try {
      const updated = await portfolio.restoreProject(project);
      await sessions.refreshList({ force: true, loadActiveSnapshot: false, selectSessionId: updated.id }).catch(() => undefined);
    } catch (error) {
      setInlineError(
        getErrorMessage(
          error,
          t("projects.restoreError", "No se pudo restaurar el proyecto."),
        ),
      );
    }
  }

  async function handleDeleteProject(confirmTitle: string) {
    if (mutation?.kind !== "delete") {
      return;
    }

    setDialogError(null);

    try {
      const updated = await portfolio.deleteProject(mutation.project, confirmTitle);
      await sessions.refreshList({ force: true, loadActiveSnapshot: false, selectSessionId: updated.id }).catch(() => undefined);
      setMutation(null);
    } catch (error) {
      setDialogError(
        getErrorMessage(
          error,
          t("projects.deleteError", "No se pudo enviar el proyecto a papelera."),
        ),
      );
    }
  }

  const pageTotal = portfolio.page.total;
  const itemsCount = portfolio.items.length;
  const emptyCopy = getEmptyPortfolioCopy(portfolio.query);
  const showInitialLoading = portfolio.status === "loading" && itemsCount === 0;
  const showError = portfolio.status === "error" && itemsCount === 0;
  const activeMembership = auth.user?.workspaces.find(
    (workspace) => workspace.workspace_id === auth.user?.active_workspace_id,
  );
  const canCreateProject = activeMembership ? activeMembership.role !== "viewer" : true;

  return (
    <WorkspaceShell>
      <PageChrome breadcrumbs={[t("projects.eyebrow", "Portafolio"), t("nav.projects", "Proyectos")]} actions={<TopUtilities density="compact" />} density="compact">
        <div className="space-y-3">
          <ProjectPortfolioHeader
            canCreate={canCreateProject}
            creating={creating}
            onCreateProject={() => void handleCreateProject()}
          />

          {inlineError ? (
            <div className="rounded-[10px] border border-[rgba(185,28,28,0.18)] bg-[var(--danger-soft)] px-4 py-3 text-[13px] font-medium text-[var(--danger)]">
              {inlineError}
            </div>
          ) : null}

          <ProjectToolbar facets={portfolio.facets} query={portfolio.query} onChange={portfolio.commitQuery} />
          <ProjectSummaryStrip facets={portfolio.facets} total={pageTotal} />

          {showInitialLoading ? <ProjectListSkeleton /> : null}

          {showError ? (
            <ProjectListState
              action={
                <button
                  type="button"
                  onClick={() => void portfolio.refresh()}
                  className="inline-flex h-9 items-center gap-2 rounded-[8px] bg-[var(--brand-primary)] px-3 text-[13px] font-semibold text-white"
                >
                  <RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("projects.retry", "Reintentar")}
                </button>
              }
              description={
                portfolio.error?.message ??
                t(
                  "projects.loadErrorDesc",
                  "El backend no devolvio el portafolio del workspace.",
                )
              }
              kind="error"
              title={t("projects.loadErrorTitle", "No se pudo cargar el portafolio")}
            />
          ) : null}

          {!showInitialLoading && !showError && itemsCount === 0 ? (
            <ProjectListState
              action={
                emptyCopy.kind === "empty" && canCreateProject ? (
                  <button
                    type="button"
                    onClick={() => void handleCreateProject()}
                    className="h-9 rounded-[8px] bg-[var(--brand-primary)] px-3 text-[13px] font-semibold text-white"
                  >
                    {t("projects.create", "Crear proyecto")}
                  </button>
                ) : null
              }
              description={emptyCopy.description}
              kind={emptyCopy.kind}
              title={emptyCopy.title}
            />
          ) : null}

          {itemsCount > 0 ? (
            <>
              <ProjectTable
                items={portfolio.items}
                mutatingProjectId={portfolio.mutatingProjectId}
                onArchive={(project) => {
                  setDialogError(null);
                  setMutation({ kind: "archive", project });
                }}
                onDelete={(project) => {
                  setDialogError(null);
                  setMutation({ kind: "delete", project });
                }}
                onOpen={(project) => void handleOpenProject(project)}
                onRename={(project) => {
                  setDialogError(null);
                  setMutation({ kind: "rename", project });
                }}
                onRestore={(project) => void handleRestoreProject(project)}
              />
              <ProjectMobileList
                items={portfolio.items}
                mutatingProjectId={portfolio.mutatingProjectId}
                onArchive={(project) => {
                  setDialogError(null);
                  setMutation({ kind: "archive", project });
                }}
                onDelete={(project) => {
                  setDialogError(null);
                  setMutation({ kind: "delete", project });
                }}
                onOpen={(project) => void handleOpenProject(project)}
                onRename={(project) => {
                  setDialogError(null);
                  setMutation({ kind: "rename", project });
                }}
                onRestore={(project) => void handleRestoreProject(project)}
              />
            </>
          ) : null}

          {portfolio.hasMore ? (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => void portfolio.loadMore()}
                disabled={portfolio.isLoadingMore}
                className="h-9 rounded-[8px] border border-[var(--border-default)] bg-white px-4 text-[13px] font-semibold text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {portfolio.isLoadingMore
                  ? t("projects.loadingMore", "Cargando...")
                  : t("projects.loadMore", "Cargar mas proyectos")}
              </button>
            </div>
          ) : null}
        </div>

        <RenameProjectDialog
          error={dialogError}
          onClose={() => setMutation(null)}
          onSubmit={(title) => void handleRenameProject(title)}
          project={mutation?.kind === "rename" ? mutation.project : null}
          submitting={Boolean(portfolio.mutatingProjectId)}
        />
        <ArchiveProjectDialog
          error={dialogError}
          onClose={() => setMutation(null)}
          onConfirm={() => void handleArchiveProject()}
          project={mutation?.kind === "archive" ? mutation.project : null}
          submitting={Boolean(portfolio.mutatingProjectId)}
        />
        <DeleteProjectDialog
          error={dialogError}
          onClose={() => setMutation(null)}
          onConfirm={(confirmTitle) => void handleDeleteProject(confirmTitle)}
          project={mutation?.kind === "delete" ? mutation.project : null}
          submitting={Boolean(portfolio.mutatingProjectId)}
        />
      </PageChrome>
    </WorkspaceShell>
  );
}
