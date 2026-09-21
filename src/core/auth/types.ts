import type { ApiError } from "@/core/api";

export type AuthUser = {
  active_workspace_id: string | null;
  active_workspace_name: string | null;
  id: string;
  email: string;
  full_name: string;
  platform_roles?: string[];
  preferred_currency?: string;
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

export type GoogleAuthRequest = {
  credential: string;
  password?: string;
  workspace_name?: string;
  accept_terms?: boolean;
  accept_privacy?: boolean;
  accept_data_treatment?: boolean;
  consent_system_notifications?: boolean;
  consent_commercial_promotions?: boolean;
  consent_events_newsletters?: boolean;
};

export type GoogleAuthResponse = {
  status: "authenticated" | "registration_required" | "link_required";
  profile: {
    email: string;
    full_name: string;
  };
  access_token?: string | null;
  token_type: string;
  expires_at?: string | null;
  user?: AuthUser | null;
  is_new_user: boolean;
};

export type AuthStatus = "idle" | "hydrating" | "submitting" | "authenticated" | "anonymous" | "error";

export type AuthState = {
  error: ApiError | null;
  isHydrated: boolean;
  status: AuthStatus;
  token: string | null;
  user: AuthUser | null;
};

export function hasPlatformAdminRole(user: AuthUser | null | undefined) {
  return Boolean(user?.platform_roles?.includes("platform_admin"));
}
