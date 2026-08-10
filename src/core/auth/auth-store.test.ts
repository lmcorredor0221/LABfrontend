import { ApiError } from "@/core/api";
import { createAuthStore } from "@/core/auth/auth-store";

describe("auth store lifecycle", () => {
  it("hydrates a stored token into an authenticated user", async () => {
    let storedToken: string | null = "seed-token";
    const persistToken = vi.fn((token: string) => {
      storedToken = token;
    });
    const clearToken = vi.fn(() => {
      storedToken = null;
    });
    const api = {
      login: vi.fn(),
      logout: vi.fn(),
      me: vi.fn().mockResolvedValue({
        active_workspace_id: "workspace-1",
        active_workspace_name: "Workspace principal",
        email: "admin@leanbuilder.local",
        full_name: "Lean Builder Admin",
        id: "user-1",
        workspaces: [],
      }),
      selectWorkspace: vi.fn(),
    };
    const store = createAuthStore({
      api,
      clearToken,
      loadToken: () => storedToken,
      persistToken,
    });

    const result = await store.hydrate();

    expect(result.status).toBe("authenticated");
    expect(result.user?.email).toBe("admin@leanbuilder.local");
    expect(api.me).toHaveBeenCalledWith({
      redirectOnUnauthorized: false,
      token: "seed-token",
    });
    expect(clearToken).not.toHaveBeenCalled();
  });

  it("logs in, persists the token, and exposes the authenticated user", async () => {
    let storedToken: string | null = null;
    const api = {
      login: vi.fn().mockResolvedValue({
        access_token: "fresh-token",
        expires_at: "2026-07-15T00:00:00",
        token_type: "bearer",
        user: {
          active_workspace_id: "workspace-1",
          active_workspace_name: "Workspace principal",
          email: "admin@leanbuilder.local",
          full_name: "Lean Builder Admin",
          id: "user-1",
          workspaces: [],
        },
      }),
      logout: vi.fn(),
      me: vi.fn(),
      selectWorkspace: vi.fn(),
    };
    const store = createAuthStore({
      api,
      clearToken: () => {
        storedToken = null;
      },
      loadToken: () => storedToken,
      persistToken: (token) => {
        storedToken = token;
      },
    });

    const result = await store.login({
      email: "admin@leanbuilder.local",
      password: "LeanBuilder123!",
    });

    expect(result.status).toBe("authenticated");
    expect(result.token).toBe("fresh-token");
    expect(result.user?.full_name).toBe("Lean Builder Admin");
    expect(storedToken).toBe("fresh-token");
  });

  it("clears the session after logout even when the backend logout request fails", async () => {
    let storedToken: string | null = "fresh-token";
    const api = {
      login: vi.fn(),
      logout: vi.fn().mockRejectedValue(
        ApiError.fromClientError({
          message: "Network down",
        }),
      ),
      me: vi.fn().mockResolvedValue({
        active_workspace_id: "workspace-1",
        active_workspace_name: "Workspace principal",
        email: "admin@leanbuilder.local",
        full_name: "Lean Builder Admin",
        id: "user-1",
        workspaces: [],
      }),
      selectWorkspace: vi.fn(),
    };
    const store = createAuthStore({
      api,
      clearToken: () => {
        storedToken = null;
      },
      loadToken: () => storedToken,
      persistToken: (token) => {
        storedToken = token;
      },
    });

    await store.hydrate();
    const result = await store.logout();

    expect(result.status).toBe("anonymous");
    expect(result.token).toBeNull();
    expect(storedToken).toBeNull();
  });

  it("recovers hydration after clearing a stale workspace selection", async () => {
    const storedToken: string | null = "seed-token";
    const clearWorkspaceId = vi.fn();
    const persistWorkspaceId = vi.fn();
    const staleWorkspaceError = ApiError.fromResponse({
      fallbackMessage: "Forbidden",
      payload: {
        detail: "The requested workspace is not available for the current user.",
      },
      source: "backend",
      status: 403,
    });
    const api = {
      login: vi.fn(),
      logout: vi.fn(),
      me: vi
        .fn()
        .mockRejectedValueOnce(staleWorkspaceError)
        .mockResolvedValueOnce({
          active_workspace_id: "workspace-1",
          active_workspace_name: "Workspace principal",
          email: "admin@leanbuilder.local",
          full_name: "Lean Builder Admin",
          id: "user-1",
          workspaces: [],
        }),
      selectWorkspace: vi.fn(),
    };
    const store = createAuthStore({
      api,
      clearToken: vi.fn(),
      clearWorkspaceId,
      loadToken: () => storedToken,
      persistToken: vi.fn(),
      persistWorkspaceId,
    });

    const result = await store.hydrate();

    expect(clearWorkspaceId).toHaveBeenCalledTimes(1);
    expect(api.me).toHaveBeenCalledTimes(2);
    expect(persistWorkspaceId).toHaveBeenCalledWith("workspace-1");
    expect(result.status).toBe("authenticated");
    expect(result.user?.email).toBe("admin@leanbuilder.local");
  });
});
