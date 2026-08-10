import { clearStoredToken, getStoredToken } from "@/core/auth/token-store";
import { clearStoredWorkspaceId, getStoredWorkspaceId } from "@/core/auth/workspace-store";
import { API_TIMEOUT_HEADER, getApiRequestTimeoutMs, getPublicApiBaseUrl } from "@/core/config/runtime";
import { ApiError, type ApiErrorSource } from "@/core/api/errors";

type FetchLike = typeof fetch;

export type ApiResponseType = "auto" | "blob" | "json" | "response" | "text";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

type JsonBody = JsonValue | Record<string, unknown>;

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | JsonBody;
  includeWorkspaceId?: boolean;
  responseType?: ApiResponseType;
  timeoutMs?: number;
  token?: string | null;
  redirectOnUnauthorized?: boolean;
};

export type ApiClientOptions = {
  baseUrl?: string;
  defaultTimeoutMs?: number;
  fetchFn?: FetchLike;
  getToken?: () => string | null;
  getWorkspaceId?: () => string | null;
  onUnauthorized?: (error: ApiError) => void;
  redirectToLogin?: (error: ApiError) => void;
};

function isAbsoluteUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function joinUrl(baseUrl: string, path: string) {
  if (isAbsoluteUrl(path)) {
    return path;
  }

  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (isAbsoluteUrl(normalizedBaseUrl)) {
    return new URL(normalizedPath, `${normalizedBaseUrl}/`).toString();
  }

  if (!normalizedBaseUrl) {
    return normalizedPath;
  }

  if (normalizedPath === normalizedBaseUrl || normalizedPath.startsWith(`${normalizedBaseUrl}/`)) {
    return normalizedPath;
  }

  return `${normalizedBaseUrl}${normalizedPath}`;
}

function isBodyPayload(body: ApiRequestOptions["body"]): body is BodyInit {
  return (
    typeof body === "string" ||
    body instanceof Blob ||
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body)
  );
}

function defaultUnauthorizedRedirect() {
  if (typeof window === "undefined") {
    return;
  }

  clearStoredToken();
  clearStoredWorkspaceId();
  window.dispatchEvent(new CustomEvent("lean-builder:unauthorized"));

  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

function createAbortController(signal: AbortSignal | null | undefined, timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort("timeout"), timeoutMs);

  if (signal) {
    if (signal.aborted) {
      controller.abort(signal.reason);
    } else {
      signal.addEventListener("abort", () => controller.abort(signal.reason), { once: true });
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timeoutId),
  };
}

async function parsePayload(response: Response, responseType: ApiResponseType) {
  if (responseType === "response") {
    return response;
  }

  if (response.status === 204 || response.status === 205) {
    return undefined;
  }

  if (responseType === "json") {
    return response.json();
  }

  if (responseType === "text") {
    return response.text();
  }

  if (responseType === "blob") {
    return response.blob();
  }

  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  if (contentType.startsWith("text/")) {
    return response.text();
  }

  return response.blob();
}

async function parseErrorPayload(response: Response) {
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text || null;
}

export function createApiClient({
  baseUrl = getPublicApiBaseUrl(),
  defaultTimeoutMs = getApiRequestTimeoutMs(),
  fetchFn = fetch,
  getToken = getStoredToken,
  getWorkspaceId = getStoredWorkspaceId,
  onUnauthorized,
  redirectToLogin = defaultUnauthorizedRedirect,
}: ApiClientOptions = {}) {
  const unauthorizedHandler = onUnauthorized ?? (() => undefined);

  async function request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    const {
      body,
      headers,
      includeWorkspaceId = true,
      method = "GET",
      redirectOnUnauthorized = true,
      responseType = "auto",
      timeoutMs = defaultTimeoutMs,
      token,
      signal,
      ...requestInit
    } = options;
    const url = joinUrl(baseUrl, path);
    const resolvedToken = token ?? getToken();
    const resolvedWorkspaceId = getWorkspaceId();
    const requestHeaders = new Headers(headers);

    requestHeaders.set("accept", "application/json");

    let resolvedBody: BodyInit | undefined;
    if (body !== undefined) {
      if (isBodyPayload(body)) {
        resolvedBody = body;
      } else {
        requestHeaders.set("content-type", "application/json");
        resolvedBody = JSON.stringify(body);
      }
    }

    if (resolvedToken && !requestHeaders.has("authorization")) {
      requestHeaders.set("authorization", `Bearer ${resolvedToken}`);
    }

    if (includeWorkspaceId && resolvedWorkspaceId && !requestHeaders.has("x-workspace-id")) {
      requestHeaders.set("x-workspace-id", resolvedWorkspaceId);
    }

    if (!requestHeaders.has(API_TIMEOUT_HEADER)) {
      requestHeaders.set(API_TIMEOUT_HEADER, String(timeoutMs));
    }

    const abortController = createAbortController(signal, timeoutMs);

    try {
      const response = await fetchFn(url, {
        ...requestInit,
        body: resolvedBody,
        cache: requestInit.cache ?? "no-store",
        credentials: requestInit.credentials ?? "same-origin",
        headers: requestHeaders,
        method,
        signal: abortController.signal,
      });

      if (!response.ok) {
        const payload = await parseErrorPayload(response);
        const error = ApiError.fromResponse({
          fallbackMessage: `Request failed with status ${response.status}.`,
          method,
          payload,
          source: "backend",
          status: response.status,
          url,
        });

        if (error.status === 401) {
          unauthorizedHandler(error);

          if (redirectOnUnauthorized) {
            redirectToLogin(error);
          }
        }

        throw error;
      }

      return (await parsePayload(response, responseType)) as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      if (abortController.signal.aborted) {
        const isTimeout = abortController.signal.reason === "timeout";
        throw ApiError.fromClientError({
          code: isTimeout ? "REQUEST_TIMEOUT" : "REQUEST_ABORTED",
          details: { reason: abortController.signal.reason },
          message: isTimeout ? `The request to ${url} timed out.` : `The request to ${url} was cancelled.`,
          method,
          url,
        });
      }

      if (error instanceof DOMException && error.name === "AbortError") {
        throw ApiError.fromClientError({
          code: "REQUEST_TIMEOUT",
          details: error,
          message: `The request to ${url} timed out.`,
          method,
          url,
        });
      }

      throw ApiError.fromClientError({
        code: "NETWORK_ERROR",
        details: error,
        message: `Unable to reach ${url}.`,
        method,
        url,
      });
    } finally {
      abortController.cleanup();
    }
  }

  return {
    delete: <T>(path: string, options?: ApiRequestOptions) =>
      request<T>(path, { ...options, method: "DELETE" }),
    get: <T>(path: string, options?: ApiRequestOptions) => request<T>(path, { ...options, method: "GET" }),
    patch: <T>(path: string, options?: ApiRequestOptions) =>
      request<T>(path, { ...options, method: "PATCH" }),
    post: <T>(path: string, options?: ApiRequestOptions) => request<T>(path, { ...options, method: "POST" }),
    put: <T>(path: string, options?: ApiRequestOptions) => request<T>(path, { ...options, method: "PUT" }),
    request,
  };
}

export const apiClient = createApiClient();

export function createProxyErrorResponse({
  message,
  status,
  code,
  details,
  method,
  url,
}: {
  message: string;
  status: number;
  code: string;
  details?: unknown;
  method?: string;
  url?: string;
}) {
  return ApiError.fromResponse({
    fallbackMessage: message,
    method,
    payload: {
      error: {
        code,
        details,
        message,
      },
    },
    source: "proxy" satisfies ApiErrorSource,
    status,
    url,
  }).toJSON();
}
