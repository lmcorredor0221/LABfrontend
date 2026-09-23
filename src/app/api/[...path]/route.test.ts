import { GET, POST } from "@/app/api/[...path]/route";

describe("Next API proxy route", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("preserves no-content backend responses without converting them to proxy 502 errors", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 204,
        statusText: "No Content",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      new Request("http://127.0.0.1:3200/api/v1/auth/logout", {
        method: "POST",
      }),
      {
        params: Promise.resolve({ path: ["v1", "auth", "logout"] }),
      },
    );

    expect(response.status).toBe(204);
    expect(response.headers.get("x-lean-builder-proxy")).toBe("next-api");
    expect(await response.text()).toBe("");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/v1/auth/logout",
      expect.objectContaining({
        body: undefined,
        method: "POST",
      }),
    );
  });

  it("retries idempotent requests once when the backend origin drops the connection", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(
        Response.json(
          {
            status: "ok",
          },
          {
            status: 200,
          },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(
      new Request("http://127.0.0.1:3200/api/health", {
        method: "GET",
      }),
      {
        params: Promise.resolve({ path: ["health"] }),
      },
    );

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(await response.json()).toEqual({ status: "ok" });
  });

  it("does not retry non-idempotent requests after a network error", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      new Request("http://127.0.0.1:3200/api/v1/auth/logout", {
        method: "POST",
      }),
      {
        params: Promise.resolve({ path: ["v1", "auth", "logout"] }),
      },
    );

    expect(response.status).toBe(502);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(await response.json()).toMatchObject({
      error: {
        code: "NETWORK_ERROR",
      },
    });
  });
});
