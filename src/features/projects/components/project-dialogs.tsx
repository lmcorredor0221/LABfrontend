"use client";

import { useState } from "react";
import { AlertTriangle, Archive, PencilLine, Trash2, X } from "lucide-react";
import { useLanguage } from "@/core/i18n/language-context";
import { byLanguage } from "@/features/product-experience/core/localized-copy";
import type { ProjectPortfolioItem } from "@/features/projects/project-portfolio-contracts";
import { getProjectDisplayTitle } from "@/features/projects/project-portfolio-model";
import { cn } from "@/lib/utils";

export function RenameProjectDialog({
  error,
  onClose,
  onSubmit,
  project,
  submitting,
}: {
  error?: string | null;
  onClose: () => void;
  onSubmit: (title: string) => void;
  project: ProjectPortfolioItem | null;
  submitting: boolean;
}) {
  if (!project) {
    return null;
  }

  return (
    <RenameProjectDialogContent
      key={project.id}
      error={error}
      initialTitle={getProjectDisplayTitle(project)}
      onClose={onClose}
      onSubmit={onSubmit}
      project={project}
      submitting={submitting}
    />
  );
}

function RenameProjectDialogContent({
  error,
  initialTitle,
  onClose,
  onSubmit,
  project,
  submitting,
}: {
  error?: string | null;
  initialTitle: string;
  onClose: () => void;
  onSubmit: (title: string) => void;
  project: ProjectPortfolioItem;
  submitting: boolean;
}) {
  const { language } = useLanguage();
  const [title, setTitle] = useState(initialTitle);
  const normalizedTitle = title.trim().replace(/\s+/g, " ");
  const titleIsValid = normalizedTitle.length >= 3 && normalizedTitle.length <= 100;

  return (
    <ProjectDialogFrame
      description={byLanguage(language, {
        en: "A manual name will not be overwritten by Discovery.",
        es: "El nombre manual no sera sobrescrito por Discovery.",
        pt: "O nome manual nao sera sobrescrito pelo Discovery.",
      })}
      icon={<PencilLine className="h-4 w-4" aria-hidden="true" />}
      onClose={onClose}
      title={byLanguage(language, {
        en: "Rename project",
        es: "Renombrar proyecto",
        pt: "Renomear projeto",
      })}
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (titleIsValid) {
            onSubmit(normalizedTitle);
          }
        }}
      >
        <label className="block text-[13px] font-semibold text-[var(--text-primary)]">
          {byLanguage(language, {
            en: "Display name",
            es: "Nombre visible",
            pt: "Nome visivel",
          })}
          <input
            autoFocus
            className="mt-2 h-10 w-full rounded-[8px] border border-[var(--border-default)] bg-white px-3 text-[13px] outline-none focus:border-[var(--border-focus)]"
            maxLength={100}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <p className="text-[12px] text-[var(--text-secondary)]">
          {byLanguage(language, {
            en: "Use between 3 and 100 characters. Current version:",
            es: "Usa entre 3 y 100 caracteres. Version actual:",
            pt: "Use entre 3 e 100 caracteres. Versao atual:",
          })}{" "}
          {project.row_version ?? 1}.
        </p>
        {error ? <DialogError>{error}</DialogError> : null}
        <DialogActions
          confirmLabel={
            submitting
              ? byLanguage(language, { en: "Saving...", es: "Guardando...", pt: "Salvando..." })
              : byLanguage(language, { en: "Save name", es: "Guardar nombre", pt: "Salvar nome" })
          }
          danger={false}
          disabled={!titleIsValid || submitting}
          onClose={onClose}
        />
      </form>
    </ProjectDialogFrame>
  );
}

export function ArchiveProjectDialog({
  error,
  onClose,
  onConfirm,
  project,
  submitting,
}: {
  error?: string | null;
  onClose: () => void;
  onConfirm: () => void;
  project: ProjectPortfolioItem | null;
  submitting: boolean;
}) {
  const { language } = useLanguage();
  if (!project) {
    return null;
  }

  return (
    <ProjectDialogFrame
      description={byLanguage(language, {
        en: "The project will leave the active view, but can be restored from Archived.",
        es: "El proyecto saldra de la vista activa, pero podra restaurarse desde Archivados.",
        pt: "O projeto saira da vista ativa, mas podera ser restaurado em Arquivados.",
      })}
      icon={<Archive className="h-4 w-4" aria-hidden="true" />}
      onClose={onClose}
      title={byLanguage(language, {
        en: "Archive project",
        es: "Archivar proyecto",
        pt: "Arquivar projeto",
      })}
    >
      <div className="space-y-4">
        <ConfirmSummary project={project} />
        {error ? <DialogError>{error}</DialogError> : null}
        <DialogActions
          confirmLabel={
            submitting
              ? byLanguage(language, { en: "Archiving...", es: "Archivando...", pt: "Arquivando..." })
              : byLanguage(language, { en: "Archive", es: "Archivar", pt: "Arquivar" })
          }
          danger={false}
          disabled={submitting}
          onClose={onClose}
          onConfirm={onConfirm}
        />
      </div>
    </ProjectDialogFrame>
  );
}

export function DeleteProjectDialog({
  error,
  onClose,
  onConfirm,
  project,
  submitting,
}: {
  error?: string | null;
  onClose: () => void;
  onConfirm: (confirmTitle: string) => void;
  project: ProjectPortfolioItem | null;
  submitting: boolean;
}) {
  if (!project) {
    return null;
  }

  return (
    <DeleteProjectDialogContent
      key={project.id}
      error={error}
      onClose={onClose}
      onConfirm={onConfirm}
      project={project}
      submitting={submitting}
    />
  );
}

function DeleteProjectDialogContent({
  error,
  onClose,
  onConfirm,
  project,
  submitting,
}: {
  error?: string | null;
  onClose: () => void;
  onConfirm: (confirmTitle: string) => void;
  project: ProjectPortfolioItem;
  submitting: boolean;
}) {
  const { language } = useLanguage();
  const [confirmTitle, setConfirmTitle] = useState("");
  const expectedTitle = getProjectDisplayTitle(project);
  const canDelete = confirmTitle.trim() === expectedTitle;

  return (
    <ProjectDialogFrame
      description={byLanguage(language, {
        en: "This action moves the project to trash. To avoid mistakes, confirm the exact name.",
        es: "Esta accion mueve el proyecto a papelera. Para evitar errores, confirma el nombre exacto.",
        pt: "Esta acao move o projeto para a lixeira. Para evitar erros, confirme o nome exato.",
      })}
      icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
      onClose={onClose}
      title={byLanguage(language, {
        en: "Move to trash",
        es: "Enviar a papelera",
        pt: "Enviar para a lixeira",
      })}
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (canDelete) {
            onConfirm(confirmTitle.trim());
          }
        }}
      >
        <ConfirmSummary project={project} />
        <label className="block text-[13px] font-semibold text-[var(--text-primary)]">
          {byLanguage(language, {
            en: "Type the exact name",
            es: "Escribe el nombre exacto",
            pt: "Digite o nome exato",
          })}
          <input
            className="mt-2 h-10 w-full rounded-[8px] border border-[var(--border-default)] bg-white px-3 text-[13px] outline-none focus:border-[var(--border-focus)]"
            placeholder={expectedTitle}
            value={confirmTitle}
            onChange={(event) => setConfirmTitle(event.target.value)}
          />
        </label>
        {error ? <DialogError>{error}</DialogError> : null}
        <DialogActions
          confirmLabel={
            submitting
              ? byLanguage(language, { en: "Sending...", es: "Enviando...", pt: "Enviando..." })
              : byLanguage(language, {
                  en: "Move to trash",
                  es: "Enviar a papelera",
                  pt: "Enviar para a lixeira",
                })
          }
          danger
          disabled={!canDelete || submitting}
          onClose={onClose}
        />
      </form>
    </ProjectDialogFrame>
  );
}

function ConfirmSummary({ project }: { project: ProjectPortfolioItem }) {
  const { language } = useLanguage();

  return (
    <div className="rounded-[10px] border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-3 py-3">
      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
        {byLanguage(language, { en: "Project", es: "Proyecto", pt: "Projeto" })}
      </p>
      <p className="mt-1 text-[14px] font-semibold text-[var(--text-primary)]">{getProjectDisplayTitle(project)}</p>
    </div>
  );
}

function ProjectDialogFrame({
  children,
  description,
  icon,
  onClose,
  title,
}: {
  children: React.ReactNode;
  description: string;
  icon: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  const { language } = useLanguage();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-6">
      <div
        aria-modal="true"
        role="dialog"
        className="w-full max-w-[460px] rounded-[12px] border border-[var(--border-default)] bg-white p-4 shadow-[var(--shadow-elevated)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-[var(--brand-soft)] text-[var(--brand-primary)]">
              {icon}
            </span>
            <div>
              <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">{title}</h2>
              <p className="mt-1 text-[13px] leading-5 text-[var(--text-secondary)]">{description}</p>
            </div>
          </div>
          <button
            aria-label={byLanguage(language, {
              en: "Close dialog",
              es: "Cerrar dialogo",
              pt: "Fechar dialogo",
            })}
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[var(--border-default)] text-[var(--text-secondary)]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

function DialogActions({
  confirmLabel,
  danger,
  disabled,
  onClose,
  onConfirm,
}: {
  confirmLabel: string;
  danger: boolean;
  disabled: boolean;
  onClose: () => void;
  onConfirm?: () => void;
}) {
  const { language } = useLanguage();

  return (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={onClose}
        className="h-9 rounded-[8px] border border-[var(--border-default)] bg-white px-3 text-[13px] font-semibold text-[var(--text-primary)]"
      >
        {byLanguage(language, { en: "Cancel", es: "Cancelar", pt: "Cancelar" })}
      </button>
      <button
        type={onConfirm ? "button" : "submit"}
        onClick={onConfirm}
        disabled={disabled}
        className={cn(
          "h-9 rounded-[8px] px-3 text-[13px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60",
          danger ? "bg-[var(--danger)] hover:bg-red-700" : "bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]",
        )}
      >
        {confirmLabel}
      </button>
    </div>
  );
}

function DialogError({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 rounded-[10px] border border-[rgba(185,28,28,0.18)] bg-[var(--danger-soft)] px-3 py-2 text-[12px] font-medium text-[var(--danger)]">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
