import { apiClient } from "@/core/api/client";

export type PlatformAdminMembershipSummary = {
  workspace_id: string;
  workspace_name: string;
  workspace_slug: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PlatformAdminUserSummary = {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  default_workspace_id?: string | null;
  platform_roles: string[];
  workspace_count: number;
  active_workspace_count: number;
  project_count: number;
  llm_total_tokens: number;
  llm_total_cost: number;
  memberships: PlatformAdminMembershipSummary[];
  created_at: string;
  updated_at: string;
};

export type PlatformAdminWorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
  owner_emails: string[];
  member_count: number;
  project_count: number;
  active_runtime_provider?: string | null;
  uses_platform_credentials?: boolean | null;
  hotmart_enabled?: boolean | null;
  hotmart_status: string;
  created_at: string;
  updated_at: string;
};

export type PlatformAdminProjectSummary = {
  id: string;
  workspace_id: string;
  workspace_name: string;
  user_id: string;
  owner_email: string;
  title: string;
  current_stage: string;
  status: string;
  commercial_tier: string;
  llm_total_tokens: number;
  llm_total_cost: number;
  created_at: string;
  updated_at: string;
};

export type PlatformAdminDashboardData = {
  users: PlatformAdminUserSummary[];
  workspaces: PlatformAdminWorkspaceSummary[];
  projects: PlatformAdminProjectSummary[];
};

export function getPlatformAdminUsers(limit = 100): Promise<{ users: PlatformAdminUserSummary[]; total: number }> {
  return apiClient.get<{ users: PlatformAdminUserSummary[]; total: number }>(
    `/api/v1/platform/admin/users?limit=${limit}`,
    { includeWorkspaceId: false },
  );
}

export function getPlatformAdminWorkspaces(limit = 100): Promise<{ workspaces: PlatformAdminWorkspaceSummary[]; total: number }> {
  return apiClient.get<{ workspaces: PlatformAdminWorkspaceSummary[]; total: number }>(
    `/api/v1/platform/admin/workspaces?limit=${limit}`,
    { includeWorkspaceId: false },
  );
}

export function getPlatformAdminProjects(limit = 100): Promise<{ projects: PlatformAdminProjectSummary[]; total: number }> {
  return apiClient.get<{ projects: PlatformAdminProjectSummary[]; total: number }>(
    `/api/v1/platform/admin/projects?limit=${limit}`,
    { includeWorkspaceId: false },
  );
}

export async function getPlatformAdminDashboard(): Promise<PlatformAdminDashboardData> {
  const [usersResponse, workspacesResponse, projectsResponse] = await Promise.all([
    getPlatformAdminUsers(100),
    getPlatformAdminWorkspaces(100),
    getPlatformAdminProjects(100),
  ]);

  return {
    projects: projectsResponse.projects,
    users: usersResponse.users,
    workspaces: workspacesResponse.workspaces,
  };
}
