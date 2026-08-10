import type { ArtifactStatus, CommercialTier, SessionStage } from "@/features/sessions/types";
import type {
  ProjectLifecycle,
  ProjectPortfolioItem,
  ProjectPortfolioQuery,
  ProjectSort,
} from "@/features/projects/project-portfolio-contracts";

export const PROJECT_STATUS_OPTIONS: Array<{ label: string; value: ArtifactStatus | "all" }> = [
  { label: "Todos los estados", value: "all" },
  { label: "Borrador", value: "draft" },
  { label: "Listo", value: "ready" },
  { label: "Requiere atencion", value: "needs_review" },
  { label: "Con error", value: "failed" },
];

export const PROJECT_TIER_OPTIONS: Array<{ label: string; value: CommercialTier | "all" }> = [
  { label: "Todos los planes", value: "all" },
  { label: "Blueprint", value: "blueprint" },
  { label: "Blueprint Pro", value: "blueprint_pro" },
  { label: "ACP", value: "acp" },
];

export const PROJECT_SORT_LABELS: Record<ProjectSort, string> = {
  created_desc: "Creacion reciente",
  title_asc: "Nombre A-Z",
  title_desc: "Nombre Z-A",
  updated_asc: "Actualizado primero antiguo",
  updated_desc: "Actualizado reciente",
};

export const PROJECT_LIFECYCLE_LABELS: Record<ProjectLifecycle, string> = {
  active: "Activos",
  all: "Todos",
  archived: "Archivados",
  trash: "Papelera",
};

export const PROJECT_STAGE_LABELS: Record<SessionStage, string> = {
  build_blueprint: "Blueprint",
  build_canvas: "Canvas",
  draft_capture: "Captura",
  input_validation: "Validacion",
  normalize_discovery: "Discovery",
  post_validation: "Revision",
  ready_for_export: "Exportable",
};

export const PROJECT_STATUS_LABELS: Record<ArtifactStatus, string> = {
  draft: "Borrador",
  failed: "Error",
  needs_review: "Atencion",
  ready: "Listo",
};

export const PROJECT_TIER_LABELS: Record<CommercialTier, string> = {
  acp: "ACP",
  blueprint: "Blueprint",
  blueprint_pro: "Blueprint Pro",
};

export function getProjectDisplayTitle(project: ProjectPortfolioItem) {
  const title = project.title?.trim();
  if (title) {
    return title;
  }

  return project.suggested_title?.trim() || "Proyecto sin nombre";
}

export function getProjectStageLabel(stage: SessionStage) {
  return PROJECT_STAGE_LABELS[stage] ?? "En progreso";
}

export function getProjectStatusLabel(status: ArtifactStatus) {
  return PROJECT_STATUS_LABELS[status] ?? "Sin estado";
}

export function getProjectTierLabel(tier?: CommercialTier) {
  return tier ? PROJECT_TIER_LABELS[tier] : "Blueprint";
}

export function getProjectStatusTone(status: ArtifactStatus) {
  if (status === "ready") {
    return "success";
  }

  if (status === "needs_review") {
    return "warning";
  }

  if (status === "failed") {
    return "danger";
  }

  return "neutral";
}

export function getProjectLifecycleFromQuery(query: ProjectPortfolioQuery) {
  if (query.lifecycle === "archived" || query.lifecycle === "trash") {
    return query.lifecycle;
  }

  return "active";
}

export function formatProjectDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(date);
}

export function normalizePortfolioQuery(nextQuery: Partial<ProjectPortfolioQuery>): ProjectPortfolioQuery {
  const parsedLimit = Number(nextQuery.limit ?? 25);
  const safeLimit = Number.isFinite(parsedLimit) ? parsedLimit : 25;

  return {
    cursor: nextQuery.cursor ?? null,
    lifecycle: nextQuery.lifecycle ?? "active",
    limit: Math.max(10, Math.min(50, safeLimit)),
    q: nextQuery.q ?? "",
    sort: nextQuery.sort ?? "updated_desc",
    status: nextQuery.status ?? "all",
    tier: nextQuery.tier ?? "all",
  };
}

export function hasActiveFilters(query: ProjectPortfolioQuery) {
  return Boolean(query.q.trim() || query.status !== "all" || query.tier !== "all" || query.lifecycle !== "active");
}
