import {
  API_TIMEOUT_HEADER,
  getBackendApiOrigin,
  getApiRequestTimeoutMs,
  normalizeApiRequestTimeoutMs,
} from "@/core/config/runtime";
import { createApiErrorPayload } from "@/core/api/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-length",
  "content-encoding",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

async function proxyRequest(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ path: string[] }>;
  },
) {
  const { path } = await params;
  const backendOrigin = getBackendApiOrigin();
  const backendApiBase = backendOrigin.endsWith("/api") ? backendOrigin : `${backendOrigin}/api`;
  const isRootHealthCheck = path.length === 1 && path[0] === "health";
  const targetUrl = isRootHealthCheck
    ? new URL("/health", `${backendOrigin}/`)
    : new URL(path.join("/"), `${backendApiBase}/`);
  targetUrl.search = new URL(request.url).search;

  const headers = new Headers(request.headers);
  HOP_BY_HOP_HEADERS.forEach((header) => headers.delete(header));
  const timeoutMs = normalizeApiRequestTimeoutMs(
    request.headers.get(API_TIMEOUT_HEADER),
    getApiRequestTimeoutMs(),
  );
  headers.delete(API_TIMEOUT_HEADER);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort("timeout"), timeoutMs);

  try {
    const body =
      request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer();

    const response = await fetch(targetUrl.toString(), {
      body: body && body.byteLength > 0 ? body : undefined,
      cache: "no-store",
      headers,
      method: request.method,
      redirect: "manual",
      signal: controller.signal,
    });

    const responseHeaders = new Headers(response.headers);
    HOP_BY_HOP_HEADERS.forEach((header) => responseHeaders.delete(header));
    responseHeaders.set("x-lean-builder-proxy", "next-api");

    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (contentType.includes("application/json")) {
      const payload = await response.arrayBuffer();
      responseHeaders.set("content-length", String(payload.byteLength));
      return new Response(payload, {
        headers: responseHeaders,
        status: response.status,
        statusText: response.statusText,
      });
    }

    return new Response(response.body, {
      headers: responseHeaders,
      status: response.status,
      statusText: response.statusText,
    });
  } catch (error) {
    const isAbortError = error instanceof DOMException && error.name === "AbortError";

    const payload = createApiErrorPayload({
      code: isAbortError ? "REQUEST_TIMEOUT" : "NETWORK_ERROR",
      details: error,
      message: isAbortError
        ? "The backend request timed out before completing."
        : "Unable to reach the backend origin from the Next.js proxy.",
      method: request.method,
      source: "proxy",
      status: isAbortError ? 504 : 502,
      url: targetUrl.toString(),
    });

    return Response.json(payload, { status: isAbortError ? 504 : 502 });
  } finally {
    clearTimeout(timeoutId);
  }
}

export const DELETE = proxyRequest;
export const GET = proxyRequest;
export const HEAD = proxyRequest;
export const OPTIONS = proxyRequest;
export const PATCH = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
