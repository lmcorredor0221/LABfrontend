import type { ArtifactStatus, CommercialTier, SessionListResponse, SessionSummary } from "@/features/sessions/types";

export type ProjectLifecycle = "active" | "archived" | "trash" | "all";
export type ProjectSort = "updated_desc" | "updated_asc" | "created_desc" | "title_asc" | "title_desc";

export type ProjectPortfolioQuery = {
  cursor?: string | null;
  lifecycle: ProjectLifecycle;
  limit: number;
  q: string;
  sort: ProjectSort;
  status?: ArtifactStatus | "all";
  tier?: CommercialTier | "all";
};

export type ProjectPortfolioResponse = SessionListResponse;
export type ProjectPortfolioItem = SessionSummary;

export type ProjectPortfolioMutation =
  | { kind: "rename"; project: ProjectPortfolioItem }
  | { kind: "archive"; project: ProjectPortfolioItem }
  | { kind: "delete"; project: ProjectPortfolioItem }
  | { kind: "restore"; project: ProjectPortfolioItem }
  | null;
