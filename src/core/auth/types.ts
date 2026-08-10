import type { ApiError } from "@/core/api";

export type AuthUser = {
  active_workspace_id: string | null;
  active_workspace_name: string | null;
  id: string;
  email: string;
  full_name: string;
  workspaces: WorkspaceMembershipSummary[];
};

export type WorkspaceRole = "owner" | "admin" | "editor" | "viewer";

export type WorkspaceMembershipSummary = {
  workspace_id: string;
  workspace_name: string;
  workspace_slug: string;
  role: WorkspaceRole;
  is_active: boolean;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
  expires_at: string;
  user: AuthUser;
};

export type AuthStatus = "idle" | "hydrating" | "submitting" | "authenticated" | "anonymous" | "error";

export type AuthState = {
  error: ApiError | null;
  isHydrated: boolean;
  status: AuthStatus;
  token: string | null;
  user: AuthUser | null;
};
