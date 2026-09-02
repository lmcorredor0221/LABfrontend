import { apiClient } from "@/core/api";
import type {
  AdminAnalyticsQuery,
  AdminInvitationListQuery,
  AdminOverviewResponse,
  AdminProjectsAnalytics,
  AdminRolesResponse,
  AdminUserInvitationCreateRequest,
  AdminUserInvitationListResponse,
  AdminUserPatchRequest,
  AdminUsersListQuery,
  AdminUsersListResponse,
} from "@/features/operations/admin-console-contracts";

type QueryValue = boolean | number | string | null | undefined;

function buildQueryString(params: Record<string, QueryValue>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    searchParams.set(key, String(value));
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export function createAdminConsoleApi(client = apiClient) {
  return {
    getOverview(params: AdminAnalyticsQuery = {}) {
      return client.get<AdminOverviewResponse>(`/api/v1/admin/overview${buildQueryString(params)}`, {
        includeWorkspaceId: false,
      });
    },
    getProjectsAnalytics(params: AdminAnalyticsQuery = {}) {
      return client.get<AdminProjectsAnalytics>(`/api/v1/admin/projects/analytics${buildQueryString(params)}`, {
        includeWorkspaceId: false,
      });
    },
    listUsers(params: AdminUsersListQuery = {}) {
      return client.get<AdminUsersListResponse>(`/api/v1/admin/users${buildQueryString(params)}`);
    },
    updateUser(userId: string, payload: AdminUserPatchRequest) {
      return client.patch<AdminUsersListResponse["items"][number]>(`/api/v1/admin/users/${encodeURIComponent(userId)}`, {
        body: payload,
      });
    },
    listInvitations(params: AdminInvitationListQuery = {}) {
      return client.get<AdminUserInvitationListResponse>(`/api/v1/admin/users/invitations${buildQueryString(params)}`);
    },
    createInvitation(payload: AdminUserInvitationCreateRequest) {
      return client.post<AdminUserInvitationListResponse["items"][number]>("/api/v1/admin/users/invitations", {
        body: payload,
      });
    },
    getRoles() {
      return client.get<AdminRolesResponse>("/api/v1/admin/roles");
    },
  };
}

export type AdminConsoleApi = ReturnType<typeof createAdminConsoleApi>;

export const adminConsoleApi = createAdminConsoleApi();
