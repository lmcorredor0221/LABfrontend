"use client";

import { Archive, FolderOpen, PencilLine, RotateCcw, Trash2 } from "lucide-react";
import { useLanguage } from "@/core/i18n/language-context";
import { byLanguage } from "@/features/product-experience/core/localized-copy";
import type { ProjectPortfolioItem } from "@/features/projects/project-portfolio-contracts";

export function ProjectRowActions({
  disabled,
  onArchive,
  onDelete,
  onOpen,
  onRename,
  onRestore,
  project,
}: {
  disabled: boolean;
  onArchive: (project: ProjectPortfolioItem) => void;
  onDelete: (project: ProjectPortfolioItem) => void;
  onOpen: (project: ProjectPortfolioItem) => void;
  onRename: (project: ProjectPortfolioItem) => void;
  onRestore: (project: ProjectPortfolioItem) => void;
  project: ProjectPortfolioItem;
}) {
  const { language } = useLanguage();
  const capabilities = project.capabilities;

  return (
    <div className="flex items-center justify-end gap-1">
      {capabilities?.can_open !== false ? (
        <CompactActionButton
          label={byLanguage(language, { en: "Open", es: "Abrir", pt: "Abrir" })}
          onClick={() => onOpen(project)}
          disabled={disabled}
          primary
        >
          <FolderOpen className="h-3.5 w-3.5" aria-hidden="true" />
        </CompactActionButton>
      ) : null}
      {capabilities?.can_rename ? (
        <CompactIconButton
          label={byLanguage(language, {
            en: "Rename project",
            es: "Renombrar proyecto",
            pt: "Renomear projeto",
          })}
          onClick={() => onRename(project)}
          disabled={disabled}
        >
          <PencilLine className="h-3.5 w-3.5" aria-hidden="true" />
        </CompactIconButton>
      ) : null}
      {capabilities?.can_archive ? (
        <CompactIconButton
          label={byLanguage(language, {
            en: "Archive project",
            es: "Archivar proyecto",
            pt: "Arquivar projeto",
          })}
          onClick={() => onArchive(project)}
          disabled={disabled}
        >
          <Archive className="h-3.5 w-3.5" aria-hidden="true" />
        </CompactIconButton>
      ) : null}
      {capabilities?.can_restore ? (
        <CompactIconButton
          label={byLanguage(language, {
            en: "Restore project",
            es: "Restaurar proyecto",
            pt: "Restaurar projeto",
          })}
          onClick={() => onRestore(project)}
          disabled={disabled}
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
        </CompactIconButton>
      ) : null}
      {capabilities?.can_delete ? (
        <CompactIconButton
          label={byLanguage(language, {
            en: "Move project to trash",
            es: "Enviar proyecto a papelera",
            pt: "Enviar projeto para a lixeira",
          })}
          onClick={() => onDelete(project)}
          disabled={disabled}
          danger
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        </CompactIconButton>
      ) : null}
    </div>
  );
}

function CompactActionButton({
  children,
  disabled,
  label,
  onClick,
  primary,
}: {
  children: React.ReactNode;
  disabled: boolean;
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        primary
          ? "inline-flex h-7 items-center gap-1 rounded-[7px] bg-[var(--brand-primary)] px-2 text-[11px] font-semibold text-white transition hover:bg-[var(--brand-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          : "inline-flex h-7 items-center gap-1 rounded-[7px] border border-[var(--border-default)] bg-white px-2 text-[11px] font-semibold text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-60"
      }
    >
      {children}
      <span>{label}</span>
    </button>
  );
}

function CompactIconButton({
  children,
  danger,
  disabled,
  label,
  onClick,
}: {
  children: React.ReactNode;
  danger?: boolean;
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex h-7 w-7 items-center justify-center rounded-[7px] border bg-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
        danger
          ? "border-[rgba(185,28,28,0.20)] text-[var(--danger)] hover:bg-[var(--danger-soft)]"
          : "border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-focus)] hover:text-[var(--brand-primary)]"
      }`}
    >
      {children}
    </button>
  );
}
