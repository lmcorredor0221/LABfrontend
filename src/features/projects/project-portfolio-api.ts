import { sessionsApi } from "@/features/sessions/session-api";
import type {
  ProjectLifecycle,
  ProjectPortfolioQuery,
  ProjectPortfolioResponse,
  ProjectSort,
} from "@/features/projects/project-portfolio-contracts";

function normalizeOptionalFilter(value: string | null | undefined) {
  return value && value !== "all" ? value : undefined;
}

export const DEFAULT_PROJECT_PORTFOLIO_QUERY: ProjectPortfolioQuery = {
  cursor: null,
  lifecycle: "active",
  limit: 25,
  q: "",
  sort: "updated_desc",
  status: "all",
  tier: "all",
};

export const PROJECT_LIFECYCLE_OPTIONS: readonly ProjectLifecycle[] = ["active", "archived", "trash"];
export const PROJECT_SORT_OPTIONS: readonly ProjectSort[] = [
  "updated_desc",
  "updated_asc",
  "created_desc",
  "title_asc",
  "title_desc",
];

export function createProjectPortfolioApi(client = sessionsApi) {
  return {
    archive(projectId: string) {
      return client.archive(projectId);
    },
    create() {
      return client.create();
    },
    delete(projectId: string, confirmTitle: string) {
      return client.delete(projectId, {
        confirm_title: confirmTitle,
      });
    },
    list(query: ProjectPortfolioQuery): Promise<ProjectPortfolioResponse> {
      return client.list({
        cursor: query.cursor ?? undefined,
        lifecycle: query.lifecycle,
        limit: query.limit,
        q: query.q,
        sort: query.sort,
        status: normalizeOptionalFilter(query.status),
        tier: normalizeOptionalFilter(query.tier),
      });
    },
    rename(projectId: string, title: string, expectedVersion?: number | null) {
      return client.rename(projectId, {
        expected_version: expectedVersion ?? undefined,
        title,
      });
    },
    restore(projectId: string) {
      return client.restore(projectId);
    },
  };
}

export type ProjectPortfolioApi = ReturnType<typeof createProjectPortfolioApi>;

export const projectPortfolioApi = createProjectPortfolioApi();
