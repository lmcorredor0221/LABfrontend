const DEFAULT_API_PROXY_BASE = "/api";
const DEFAULT_BACKEND_ORIGIN = "http://127.0.0.1:8000";
const DEFAULT_API_TIMEOUT_MS = 30_000;
const DEFAULT_LONG_RUNNING_API_TIMEOUT_MS = 180_000;
const MAX_API_TIMEOUT_MS = 300_000;

export const API_TIMEOUT_HEADER = "x-lean-builder-timeout-ms";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function parseBoolean(rawValue: string | undefined, fallback: boolean) {
  if (rawValue === undefined) {
    return fallback;
  }

  return rawValue.toLowerCase() !== "false";
}

function clampTimeout(value: number, fallback: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return fallback;
  }

  return Math.min(value, MAX_API_TIMEOUT_MS);
}

export function normalizeApiRequestTimeoutMs(
  rawValue: number | string | null | undefined,
  fallback = DEFAULT_API_TIMEOUT_MS,
) {
  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return fallback;
  }

  const parsed =
    typeof rawValue === "number" ? rawValue : Number.parseInt(String(rawValue), 10);
  return clampTimeout(parsed, fallback);
}

export function shouldUseApiProxy() {
  return parseBoolean(process.env.NEXT_PUBLIC_USE_API_PROXY, true);
}

export function getPublicApiBaseUrl() {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

  if (configuredBaseUrl) {
    return trimTrailingSlash(configuredBaseUrl);
  }

  if (shouldUseApiProxy()) {
    return DEFAULT_API_PROXY_BASE;
  }

  return `${DEFAULT_BACKEND_ORIGIN}/api`;
}

export function getBackendApiOrigin() {
  const configuredOrigin = process.env.BACKEND_API_ORIGIN?.trim();
  return trimTrailingSlash(configuredOrigin || DEFAULT_BACKEND_ORIGIN);
}

export function getApiRequestTimeoutMs() {
  return normalizeApiRequestTimeoutMs(process.env.NEXT_PUBLIC_API_TIMEOUT_MS, DEFAULT_API_TIMEOUT_MS);
}

export function getLongRunningApiRequestTimeoutMs() {
  return normalizeApiRequestTimeoutMs(
    process.env.NEXT_PUBLIC_LONG_API_TIMEOUT_MS,
    DEFAULT_LONG_RUNNING_API_TIMEOUT_MS,
  );
}
