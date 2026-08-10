"use client";

import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError } from "@/core/api";
import type { ProjectPortfolioApi } from "@/features/projects/project-portfolio-api";
import { DEFAULT_PROJECT_PORTFOLIO_QUERY, projectPortfolioApi } from "@/features/projects/project-portfolio-api";
import type {
  ProjectLifecycle,
  ProjectPortfolioItem,
  ProjectPortfolioQuery,
  ProjectPortfolioResponse,
  ProjectSort,
} from "@/features/projects/project-portfolio-contracts";
import { normalizePortfolioQuery } from "@/features/projects/project-portfolio-model";
import type { ArtifactStatus, CommercialTier, SessionListResponse } from "@/features/sessions/types";

type PortfolioStatus = "idle" | "loading" | "ready" | "error";

type UseProjectPortfolioOptions = {
  api?: ProjectPortfolioApi;
};

function toApiError(error: unknown) {
  if (error instanceof ApiError) {
    return error;
  }

  return ApiError.fromClientError({
    details: error,
    message: "No se pudo cargar el portafolio de proyectos.",
  });
}

function parseQuery(searchParams: URLSearchParams): ProjectPortfolioQuery {
  return normalizePortfolioQuery({
    lifecycle: (searchParams.get("lifecycle") as ProjectLifecycle | null) ?? DEFAULT_PROJECT_PORTFOLIO_QUERY.lifecycle,
    limit: Number(searchParams.get("limit") ?? DEFAULT_PROJECT_PORTFOLIO_QUERY.limit),
    q: searchParams.get("q") ?? "",
    sort: (searchParams.get("sort") as ProjectSort | null) ?? DEFAULT_PROJECT_PORTFOLIO_QUERY.sort,
    status: (searchParams.get("status") as ArtifactStatus | "all" | null) ?? "all",
    tier: (searchParams.get("tier") as CommercialTier | "all" | null) ?? "all",
  });
}

function buildPortfolioUrl(query: ProjectPortfolioQuery) {
  const params = new URLSearchParams();

  if (query.lifecycle !== DEFAULT_PROJECT_PORTFOLIO_QUERY.lifecycle) {
    params.set("lifecycle", query.lifecycle);
  }

  if (query.q.trim()) {
    params.set("q", query.q.trim());
  }

  if (query.status && query.status !== "all") {
    params.set("status", query.status);
  }

  if (query.tier && query.tier !== "all") {
    params.set("tier", query.tier);
  }

  if (query.sort !== DEFAULT_PROJECT_PORTFOLIO_QUERY.sort) {
    params.set("sort", query.sort);
  }

  const search = params.toString();
  return search ? `/projects?${search}` : "/projects";
}

function mergePage(current: SessionListResponse | null, next: ProjectPortfolioResponse, append: boolean) {
  if (!append || !current) {
    return next;
  }

  return {
    ...next,
    items: [...current.items, ...next.items],
  };
}

export function useProjectPortfolio({ api = projectPortfolioApi }: UseProjectPortfolioOptions = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();
  const query = useMemo(() => parseQuery(new URLSearchParams(searchKey)), [searchKey]);
  const [response, setResponse] = useState<ProjectPortfolioResponse | null>(null);
  const [status, setStatus] = useState<PortfolioStatus>("idle");
  const [error, setError] = useState<ApiError | null>(null);
  const [mutatingProjectId, setMutatingProjectId] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const commitQuery = useCallback(
    (patch: Partial<ProjectPortfolioQuery>) => {
      const nextQuery = normalizePortfolioQuery({
        ...query,
        ...patch,
        cursor: null,
      });

      startTransition(() => {
        router.replace(buildPortfolioUrl(nextQuery), {
          scroll: false,
        });
      });
    },
    [query, router],
  );

  const refresh = useCallback(
    async (nextQuery = query) => {
      setStatus((currentStatus) => (currentStatus === "ready" ? "ready" : "loading"));
      setError(null);

      try {
        const nextResponse = await api.list({ ...nextQuery, cursor: null });
        setResponse(nextResponse);
        setStatus("ready");
        return nextResponse;
      } catch (loadError) {
        const apiError = toApiError(loadError);
        setError(apiError);
        setStatus("error");
        throw apiError;
      }
    },
    [api, query],
  );

  useEffect(() => {
    let ignore = false;

    async function load() {
      setStatus((currentStatus) => (currentStatus === "ready" ? "ready" : "loading"));
      setError(null);

      try {
        const nextResponse = await api.list({ ...query, cursor: null });

        if (!ignore) {
          setResponse(nextResponse);
          setStatus("ready");
        }
      } catch (loadError) {
        if (!ignore) {
          setError(toApiError(loadError));
          setStatus("error");
        }
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [api, query]);

  async function loadMore() {
    const cursor = response?.page?.next_cursor;
    if (!cursor || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);
    setError(null);

    try {
      const nextResponse = await api.list({ ...query, cursor });
      setResponse((currentResponse) => mergePage(currentResponse, nextResponse, true));
    } catch (loadError) {
      setError(toApiError(loadError));
    } finally {
      setIsLoadingMore(false);
    }
  }

  function updateProject(nextProject: ProjectPortfolioItem, options: { remove?: boolean } = {}) {
    setResponse((currentResponse) => {
      if (!currentResponse) {
        return currentResponse;
      }

      if (options.remove) {
        return {
          ...currentResponse,
          items: currentResponse.items.filter((project) => project.id !== nextProject.id),
        };
      }

      return {
        ...currentResponse,
        items: currentResponse.items.map((project) => (project.id === nextProject.id ? nextProject : project)),
      };
    });
  }

  async function renameProject(project: ProjectPortfolioItem, title: string) {
    setMutatingProjectId(project.id);
    setError(null);

    try {
      const updated = await api.rename(project.id, title, project.row_version);
      updateProject(updated);
      return updated;
    } finally {
      setMutatingProjectId(null);
    }
  }

  async function archiveProject(project: ProjectPortfolioItem) {
    setMutatingProjectId(project.id);
    setError(null);

    try {
      const updated = await api.archive(project.id);
      updateProject(updated, { remove: query.lifecycle === "active" });
      return updated;
    } finally {
      setMutatingProjectId(null);
    }
  }

  async function restoreProject(project: ProjectPortfolioItem) {
    setMutatingProjectId(project.id);
    setError(null);

    try {
      const updated = await api.restore(project.id);
      updateProject(updated, { remove: query.lifecycle === "archived" || query.lifecycle === "trash" });
      return updated;
    } finally {
      setMutatingProjectId(null);
    }
  }

  async function deleteProject(project: ProjectPortfolioItem, confirmTitle: string) {
    setMutatingProjectId(project.id);
    setError(null);

    try {
      const updated = await api.delete(project.id, confirmTitle);
      updateProject(updated, { remove: true });
      return updated;
    } finally {
      setMutatingProjectId(null);
    }
  }

  const page = response?.page ?? { next_cursor: null, total: response?.items.length ?? 0 };
  const facets = response?.facets ?? {
    active: 0,
    archived: 0,
    needs_review: 0,
    trash: 0,
  };

  return {
    archiveProject,
    commitQuery,
    deleteProject,
    error,
    facets,
    hasMore: Boolean(page.next_cursor),
    isLoadingMore,
    items: response?.items ?? [],
    loadMore,
    mutatingProjectId,
    page,
    query,
    refresh,
    renameProject,
    restoreProject,
    status,
  };
}
