import type { ProductServerResourceState, ProductServerStatus } from "@/features/product-experience/core/server-state/types";

export function createEmptyResourceState<T>(
  requestKey = "",
  status: ProductServerStatus = "idle",
): ProductServerResourceState<T> {
  return {
    data: null,
    error: null,
    requestKey,
    status,
    updatedAt: null,
    version: "",
  };
}

export function createLoadingResourceState<T>(requestKey: string): ProductServerResourceState<T> {
  return {
    data: null,
    error: null,
    requestKey,
    status: "loading",
    updatedAt: null,
    version: "",
  };
}

export function createReadyResourceState<T>({
  data,
  requestKey,
  version,
}: {
  data: T;
  requestKey: string;
  version?: string;
}): ProductServerResourceState<T> {
  return {
    data,
    error: null,
    requestKey,
    status: "ready",
    updatedAt: Date.now(),
    version: version ?? "",
  };
}

export function createErrorResourceState<T>({
  error,
  requestKey,
  status = "error",
}: {
  error: ApiErrorLike;
  requestKey: string;
  status?: "error" | "aborted";
}): ProductServerResourceState<T> {
  return {
    data: null,
    error,
    requestKey,
    status,
    updatedAt: Date.now(),
    version: "",
  };
}

type ApiErrorLike = Error;

export function isAbortLikeError(error: unknown) {
  if (error instanceof DOMException && error.name === "AbortError") {
    return true;
  }

  if (error instanceof Error) {
    return /abort|cancel|timeout/i.test(error.message);
  }

  return false;
}
