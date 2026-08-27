"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { productBuildApi, type ProductBuildApi } from "@/features/product-experience/saas/product-build-api";
import type {
  ProductBuildLifecycle,
  ProductBuildProductKey,
  ProductBuildStatus,
} from "@/features/product-experience/saas/product-build-status";

export type ProductBuildResourceStatus = "idle" | "loading" | "empty" | "success" | "stale" | "error";

export type ProductBuildStatusState = {
  data: ProductBuildStatus | null;
  error: Error | null;
  isFetching: boolean;
  status: ProductBuildResourceStatus;
  updatedAt: number | null;
};

export type UseProductBuildStatusOptions = {
  api?: Pick<ProductBuildApi, "getProductBuildStatus"> & Partial<Pick<ProductBuildApi, "executeProductBuildAction">>;
  enabled?: boolean;
  pollIntervalMs?: number;
  polling?: boolean;
  staleWhileRevalidating?: boolean;
};

export type UseProductBuildStatusResult = ProductBuildStatusState & {
  executeCommand(
    action: "start" | "resume" | "retry" | "process_pending" | "retry_failed",
    options?: { allow_llm?: boolean },
  ): Promise<ProductBuildStatus | null>;
  isEmpty: boolean;
  isError: boolean;
  isFinal: boolean;
  isLoading: boolean;
  isStale: boolean;
  refresh(): Promise<ProductBuildStatus | null>;
};

const DEFAULT_POLL_INTERVAL_MS = 2_500;
const ACTIVE_LIFECYCLES = new Set<ProductBuildLifecycle>(["queued", "preparing", "running"]);

function createIdleState(): ProductBuildStatusState {
  return {
    data: null,
    error: null,
    isFetching: false,
    status: "idle",
    updatedAt: null,
  };
}

function isAbortLikeError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function isProductBuildLifecycleFinal(lifecycle: ProductBuildLifecycle): boolean {
  return !ACTIVE_LIFECYCLES.has(lifecycle);
}

export function shouldPollProductBuildStatus(status: ProductBuildStatus | null): boolean {
  return Boolean(status && ACTIVE_LIFECYCLES.has(status.lifecycle));
}

export function getProductBuildPollIntervalMs(
  status: ProductBuildStatus | null,
  fallbackMs = DEFAULT_POLL_INTERVAL_MS,
): number | null {
  if (!shouldPollProductBuildStatus(status)) {
    return null;
  }

  if (status?.lifecycle === "queued") {
    return Math.max(1_500, Math.min(fallbackMs, 2_000));
  }

  return fallbackMs;
}

export function useProductBuildStatus(
  sessionId: string,
  productKey: ProductBuildProductKey | null | undefined,
  {
    api = productBuildApi,
    enabled = true,
    pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
    polling = true,
    staleWhileRevalidating = true,
  }: UseProductBuildStatusOptions = {},
): UseProductBuildStatusResult {
  const [state, setState] = useState<ProductBuildStatusState>(() => createIdleState());
  const abortRef = useRef<AbortController | null>(null);
  const requestRef = useRef(0);
  const stateRef = useRef<ProductBuildStatusState>(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const refresh = useCallback(async (): Promise<ProductBuildStatus | null> => {
    if (!enabled || !sessionId || !productKey) {
      const empty = {
        ...createIdleState(),
        status: "empty" as const,
      };
      setState(empty);
      stateRef.current = empty;
      return null;
    }

    abortRef.current?.abort("superseded");
    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = ++requestRef.current;

    setState((current) => ({
      ...current,
      error: null,
      isFetching: true,
      status: current.data && staleWhileRevalidating ? "stale" : "loading",
    }));

    try {
      const data = await api.getProductBuildStatus(sessionId, productKey, { signal: controller.signal });
      const nextState: ProductBuildStatusState = {
        data,
        error: null,
        isFetching: false,
        status: data ? "success" : "empty",
        updatedAt: Date.now(),
      };

      if (requestRef.current === requestId) {
        setState(nextState);
        stateRef.current = nextState;
      }

      return data;
    } catch (error) {
      if (isAbortLikeError(error)) {
        return stateRef.current.data;
      }

      const nextState: ProductBuildStatusState = {
        ...stateRef.current,
        error: error instanceof Error ? error : new Error("No se pudo cargar el estado del producto."),
        isFetching: false,
        status: "error",
      };

      if (requestRef.current === requestId) {
        setState(nextState);
        stateRef.current = nextState;
      }

      return null;
    }
  }, [api, enabled, productKey, sessionId, staleWhileRevalidating]);

  const executeCommand = useCallback(
    async (
      action: "start" | "resume" | "retry" | "process_pending" | "retry_failed",
      options?: { allow_llm?: boolean },
    ): Promise<ProductBuildStatus | null> => {
      if (!enabled || !sessionId || !productKey || !api.executeProductBuildAction) {
        return null;
      }

      setState((current) => ({
        ...current,
        isFetching: true,
      }));

      try {
        const data = await api.executeProductBuildAction(sessionId, productKey, {
          action,
          allow_llm: options?.allow_llm,
          idempotency_key: createIdempotencyKey(),
        });
        const nextState: ProductBuildStatusState = {
          data,
          error: null,
          isFetching: false,
          status: data ? "success" : "empty",
          updatedAt: Date.now(),
        };
        setState(nextState);
        stateRef.current = nextState;
        return data;
      } catch (error) {
        const nextState: ProductBuildStatusState = {
          ...stateRef.current,
          error: error instanceof Error ? error : new Error("No se pudo ejecutar la acción sobre el build."),
          isFetching: false,
          status: "error",
        };
        setState(nextState);
        stateRef.current = nextState;
        return null;
      }
    },
    [api, enabled, productKey, sessionId],
  );

  useEffect(() => {
    let mounted = true;

    globalThis.queueMicrotask(() => {
      if (mounted) {
        void refresh();
      }
    });

    return () => {
      mounted = false;
      abortRef.current?.abort("unmounted");
    };
  }, [refresh]);

  useEffect(() => {
    if (!enabled || !polling || state.isFetching) {
      return;
    }

    const intervalMs = getProductBuildPollIntervalMs(state.data, pollIntervalMs);
    if (intervalMs === null) {
      return;
    }

    const timeoutId = globalThis.setTimeout(() => {
      void refresh();
    }, intervalMs);

    return () => globalThis.clearTimeout(timeoutId);
  }, [enabled, pollIntervalMs, polling, refresh, state.data, state.isFetching]);

  const lifecycle = state.data?.lifecycle ?? "not_purchased";
  const isFinal = state.data ? isProductBuildLifecycleFinal(lifecycle) : false;

  return {
    ...state,
    executeCommand,
    isEmpty: state.status === "empty",
    isError: state.status === "error",
    isFinal,
    isLoading: state.status === "loading",
    isStale: state.status === "stale",
    refresh,
  };
}
