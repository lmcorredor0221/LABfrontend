import { apiClient, type ApiRequestOptions } from "@/core/api";
import type { AuthUser, LoginCredentials, LoginResponse } from "@/core/auth/types";

type AuthRequestOptions = Pick<ApiRequestOptions, "redirectOnUnauthorized" | "token">;

export function createAuthApi(client = apiClient) {
  return {
    login(payload: LoginCredentials) {
      return client.post<LoginResponse>("/api/v1/auth/login", {
        body: payload,
        includeWorkspaceId: false,
        redirectOnUnauthorized: false,
      });
    },
    logout(options: AuthRequestOptions = {}) {
      return client.post<void>("/api/v1/auth/logout", {
        includeWorkspaceId: false,
        ...options,
        redirectOnUnauthorized: false,
      });
    },
    me(options: AuthRequestOptions = {}) {
      return client.get<AuthUser>("/api/v1/auth/me", {
        includeWorkspaceId: false,
        ...options,
        redirectOnUnauthorized: options.redirectOnUnauthorized ?? false,
      });
    },
    selectWorkspace(workspaceId: string, options: AuthRequestOptions = {}) {
      return client.post<AuthUser>("/api/v1/auth/workspaces/select", {
        includeWorkspaceId: false,
        ...options,
        body: { workspace_id: workspaceId },
      });
    },
  };
}

export type AuthApi = ReturnType<typeof createAuthApi>;

export const authApi = createAuthApi();
