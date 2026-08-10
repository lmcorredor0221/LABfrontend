import { AlertTriangle, FolderPlus, LoaderCircle, SearchX } from "lucide-react";
import type { ProjectPortfolioQuery } from "@/features/projects/project-portfolio-contracts";
import { hasActiveFilters } from "@/features/projects/project-portfolio-model";

export function ProjectListSkeleton() {
  return (
    <div className="rounded-[10px] border border-[var(--border-default)] bg-white p-3 shadow-[var(--shadow-card)]">
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="grid h-[44px] grid-cols-[2fr_0.7fr_0.7fr_0.7fr_0.6fr] gap-2">
            {Array.from({ length: 5 }).map((__, cellIndex) => (
              <span
                key={`${index}-${cellIndex}`}
                className="h-full animate-pulse rounded-[7px] bg-[var(--surface-subtle)]"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProjectListState({
  action,
  description,
  kind,
  title,
}: {
  action?: React.ReactNode;
  description: string;
  kind: "empty" | "error" | "loading" | "no-results";
  title: string;
}) {
  const Icon = kind === "error" ? AlertTriangle : kind === "no-results" ? SearchX : kind === "loading" ? LoaderCircle : FolderPlus;

  return (
    <div className="rounded-[10px] border border-[var(--border-default)] bg-white px-5 py-7 text-center shadow-[var(--shadow-card)]">
      <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-[9px] bg-[var(--surface-subtle)] text-[var(--brand-primary)]">
        <Icon className={`h-4 w-4 ${kind === "loading" ? "animate-spin" : ""}`} aria-hidden="true" />
      </span>
      <h2 className="mt-3 text-[16px] font-semibold text-[var(--text-primary)]">{title}</h2>
      <p className="mx-auto mt-2 max-w-[520px] text-[13px] leading-5 text-[var(--text-secondary)]">{description}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function getEmptyPortfolioCopy(query: ProjectPortfolioQuery) {
  if (hasActiveFilters(query)) {
    return {
      kind: "no-results" as const,
      title: "No encontramos proyectos con esos filtros",
      description: "Ajusta la busqueda, estado, plan o vista para ampliar los resultados del workspace.",
    };
  }

  return {
    kind: "empty" as const,
    title: "Todavia no hay proyectos",
    description: "Crea el primer proyecto para iniciar el flujo LEAN desde Descubrir.",
  };
}
