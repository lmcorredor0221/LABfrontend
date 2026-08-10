import { createApiClient } from "@/core/api/client";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: {
      "content-type": "application/json",
    },
    status,
  });
}

describe("createApiClient", () => {
  it("returns parsed JSON on 200 and injects bearer token", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    const client = createApiClient({
      baseUrl: "/api",
      fetchFn,
      getToken: () => "seed-token",
      redirectToLogin: vi.fn(),
    });

    const result = await client.get<{ ok: boolean }>("/v1/auth/me");

    expect(result).toEqual({ ok: true });
    expect(fetchFn).toHaveBeenCalledTimes(1);

    const [requestUrl, requestInit] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(requestUrl).toBe("/api/v1/auth/me");
    const headers = new Headers(requestInit.headers);
    expect(headers.get("authorization")).toBe("Bearer seed-token");
    expect(headers.get("accept")).toBe("application/json");
  });

  it("can omit the workspace header for auth bootstrap requests", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    const client = createApiClient({
      baseUrl: "/api",
      fetchFn,
      getToken: () => "seed-token",
      getWorkspaceId: () => "stale-workspace",
      redirectToLogin: vi.fn(),
    });

    await client.get<{ ok: boolean }>("/v1/auth/me", {
      includeWorkspaceId: false,
    });

    const [, requestInit] = fetchFn.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(requestInit.headers);
    expect(headers.get("authorization")).toBe("Bearer seed-token");
    expect(headers.get("x-workspace-id")).toBeNull();
  });

  it("does not duplicate a relative proxy base when the path already includes it", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    const client = createApiClient({
      baseUrl: "/api",
      fetchFn,
      getToken: () => null,
      redirectToLogin: vi.fn(),
    });

    await client.get<{ ok: boolean }>("/api/v1/runtime/llm");

    const [requestUrl] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(requestUrl).toBe("/api/v1/runtime/llm");
  });

  it("propagates the effective timeout to the proxy header", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    const client = createApiClient({
      baseUrl: "/api",
      fetchFn,
      getToken: () => null,
      redirectToLogin: vi.fn(),
    });

    await client.post<{ ok: boolean }>("/v1/sessions/demo/build-blueprint", {
      timeoutMs: 180_000,
    });

    const [, requestInit] = fetchFn.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(requestInit.headers);
    expect(headers.get("x-lean-builder-timeout-ms")).toBe("180000");
  });

  it("maps 401 responses and notifies unauthorized flows", async () => {
    const onUnauthorized = vi.fn();
    const redirectToLogin = vi.fn();
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ detail: "Not authenticated" }, 401));
    const client = createApiClient({
      baseUrl: "/api",
      fetchFn,
      getToken: () => "expired-token",
      onUnauthorized,
      redirectToLogin,
    });

    await expect(client.get("/v1/auth/me", { redirectOnUnauthorized: false })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "Not authenticated",
      status: 401,
    });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(redirectToLogin).not.toHaveBeenCalled();
  });

  it("maps 404 responses to NOT_FOUND", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ detail: "Session not found" }, 404));
    const client = createApiClient({
      baseUrl: "/api",
      fetchFn,
      getToken: () => null,
      redirectToLogin: vi.fn(),
    });

    await expect(client.get("/v1/sessions/missing")).rejects.toMatchObject({
      code: "NOT_FOUND",
      status: 404,
    });
  });

  it("maps 409 responses to CONFLICT", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      jsonResponse(
        {
          error: {
            code: "CONFLICT",
            message: "The ACP export is blocked until continuity questions are resolved.",
          },
        },
        409,
      ),
    );
    const client = createApiClient({
      baseUrl: "/api",
      fetchFn,
      getToken: () => null,
      redirectToLogin: vi.fn(),
    });

    await expect(client.get("/v1/sessions/demo/acp/export.zip")).rejects.toMatchObject({
      code: "CONFLICT",
      status: 409,
    });
  });

  it("maps 422 responses to UNPROCESSABLE_ENTITY", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      jsonResponse(
        {
          detail: [
            {
              msg: "Field required",
            },
          ],
        },
        422,
      ),
    );
    const client = createApiClient({
      baseUrl: "/api",
      fetchFn,
      getToken: () => null,
      redirectToLogin: vi.fn(),
    });

    await expect(
      client.post("/v1/sessions/demo/normalize-discovery", {
        body: {},
      }),
    ).rejects.toMatchObject({
      code: "UNPROCESSABLE_ENTITY",
      status: 422,
    });
  });
});
