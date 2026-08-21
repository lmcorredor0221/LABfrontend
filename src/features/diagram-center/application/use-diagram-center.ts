"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/core/api/errors";
import type {
  DiagramCatalog,
  DiagramDetail,
  DiagramGenerationJob,
  DiagramGenerationReason,
  DiagramVersionComparison,
} from "@/features/diagram-center/domain/types";
import { diagramCenterApi } from "@/features/diagram-center/infrastructure/diagram-center-api";

type AsyncStatus = "idle" | "loading" | "ready" | "error";
type CatalogLoadOptions = {
  silent?: boolean;
};

const AUTO_REFRESH_INTERVAL_MS = 2_000;
const AUTO_REFRESH_MAX_ATTEMPTS = 120;

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.message;
  }
  return error instanceof Error ? error.message : fallback;
}

function isActiveGenerationState(state: DiagramCatalog["entries"][number]["generation_state"]) {
  return state === "queued" || state === "generating" || state === "updating";
}

export function useDiagramCenter(projectId: string) {
  const mounted = useRef(true);
  const autoRefreshAttempts = useRef(0);
  const [catalog, setCatalog] = useState<DiagramCatalog | null>(null);
  const [catalogStatus, setCatalogStatus] = useState<AsyncStatus>("idle");
  const [detail, setDetail] = useState<DiagramDetail | null>(null);
  const [detailStatus, setDetailStatus] = useState<AsyncStatus>("idle");
  const [selectedKey, setSelectedKey] = useState("");
  const [error, setError] = useState("");
  const [job, setJob] = useState<DiagramGenerationJob | null>(null);
  const [comparison, setComparison] = useState<DiagramVersionComparison | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const loadCatalog = useCallback(async (options?: CatalogLoadOptions) => {
    const silent = Boolean(options?.silent);
    if (!silent) {
      setCatalogStatus("loading");
      setError("");
    } else {
      setCatalogStatus((current) => (current === "idle" ? "loading" : current));
    }
    try {
      const response = await diagramCenterApi.catalog(projectId);
      if (!mounted.current) return;
      setCatalog(response);
      setCatalogStatus("ready");
      setSelectedKey((current) => {
        if (current && response.entries.some((item) => item.key === current)) return current;
        return (
          response.entries.find((item) => item.access.access_state === "available")?.key ??
          response.entries.find((item) => item.access.access_state === "preview")?.key ??
          response.entries[0]?.key ??
          ""
        );
      });
    } catch (requestError) {
      if (!mounted.current) return;
      if (!silent) {
        setCatalogStatus("error");
        setError(errorMessage(requestError, "No se pudo cargar el catálogo de diagramas."));
      }
    }
  }, [projectId]);

  const loadDetail = useCallback(
    async (diagramKey: string, versionId?: string) => {
      if (!diagramKey) return;
      setDetailStatus("loading");
      setComparison(null);
      try {
        const response = await diagramCenterApi.detail(projectId, diagramKey, versionId);
        if (!mounted.current) return;
        setDetail(response);
        setDetailStatus("ready");
      } catch (requestError) {
        if (!mounted.current) return;
        setDetail(null);
        setDetailStatus("error");
        setError(errorMessage(requestError, "No se pudo cargar el diagrama."));
      }
    },
    [projectId],
  );

  useEffect(() => {
    const task = window.setTimeout(() => void loadCatalog(), 0);
    return () => window.clearTimeout(task);
  }, [loadCatalog]);

  useEffect(() => {
    const hasActiveAutomaticWork = Boolean(catalog?.entries.some((item) => isActiveGenerationState(item.generation_state)));
    if (!hasActiveAutomaticWork) {
      autoRefreshAttempts.current = 0;
      return;
    }
    if (autoRefreshAttempts.current >= AUTO_REFRESH_MAX_ATTEMPTS) {
      return;
    }

    const task = window.setTimeout(() => {
      autoRefreshAttempts.current += 1;
      void loadCatalog({ silent: true });
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => window.clearTimeout(task);
  }, [catalog, loadCatalog]);

  useEffect(() => {
    if (!selectedKey) return;
    const task = window.setTimeout(() => void loadDetail(selectedKey), 0);
    return () => window.clearTimeout(task);
  }, [loadDetail, selectedKey]);

  const selectedCatalogVersionId =
    catalog?.entries.find((item) => item.key === selectedKey)?.current_version?.id ?? "";
  const loadedDetailVersionId = detail?.versions[0]?.id ?? "";
  const loadedDetailKey = detail?.item.key ?? "";
  const detailHasModel = Boolean(detail?.model);

  useEffect(() => {
    if (!selectedKey || !selectedCatalogVersionId) return;
    if (loadedDetailKey === selectedKey && loadedDetailVersionId === selectedCatalogVersionId && detailHasModel) {
      return;
    }

    const task = window.setTimeout(() => void loadDetail(selectedKey, selectedCatalogVersionId), 0);
    return () => window.clearTimeout(task);
  }, [detailHasModel, loadDetail, loadedDetailKey, loadedDetailVersionId, selectedCatalogVersionId, selectedKey]);

  const generate = useCallback(
    async (diagramKey: string, reasonOrRegenerate: DiagramGenerationReason | boolean = false) => {
      const reason: DiagramGenerationReason =
        typeof reasonOrRegenerate === "string"
          ? reasonOrRegenerate
          : reasonOrRegenerate
            ? "regenerate"
            : "user_request";
      setError("");
      setComparison(null);
      try {
        const created = await diagramCenterApi.generate(projectId, diagramKey, reason);
        if (!mounted.current) return;
        setJob(created);
        setCatalog((current) =>
          current
            ? {
                ...current,
                entries: current.entries.map((item) =>
                  item.key === diagramKey ? { ...item, generation_state: created.status } : item,
                ),
              }
            : current,
        );
        let current = created;
        for (let attempt = 0; attempt < 80 && ["queued", "generating", "updating"].includes(current.status); attempt += 1) {
          await new Promise((resolve) => window.setTimeout(resolve, 1500));
          current = await diagramCenterApi.job(projectId, created.id);
          if (!mounted.current) return;
          setJob(current);
        }
        await loadCatalog();
        await loadDetail(diagramKey, current.version_id ?? undefined);
        if (current.status === "error") {
          setError(current.error_message || "La generación no pudo completarse.");
        }
      } catch (requestError) {
        if (!mounted.current) return;
        setError(errorMessage(requestError, "No se pudo iniciar la generación."));
      }
    },
    [loadCatalog, loadDetail, projectId],
  );

  const compare = useCallback(
    async (diagramKey: string, baseVersionId: string, targetVersionId: string) => {
      setError("");
      try {
        const response = await diagramCenterApi.compare(projectId, diagramKey, baseVersionId, targetVersionId);
        if (mounted.current) setComparison(response);
      } catch (requestError) {
        if (mounted.current) setError(errorMessage(requestError, "No se pudieron comparar las versiones."));
      }
    },
    [projectId],
  );

  const download = useCallback(
    async (diagramKey: string, format: "svg" | "mermaid" | "json") => {
      setError("");
      try {
        const blob = await diagramCenterApi.download(projectId, diagramKey, format);
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `${diagramKey}.${format === "mermaid" ? "mmd" : format}`;
        anchor.click();
        URL.revokeObjectURL(url);
      } catch (requestError) {
        setError(errorMessage(requestError, "No se pudo descargar el diagrama."));
      }
    },
    [projectId],
  );

  return {
    catalog,
    catalogStatus,
    compare,
    comparison,
    detail,
    detailStatus,
    download,
    error,
    generate,
    job,
    loadCatalog,
    loadDetail,
    selectedKey,
    setSelectedKey,
  };
}
