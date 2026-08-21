import type {
  FinOpsProviderBreakdownItem,
  FinOpsSummary,
} from "@/features/finops/finops-contracts";

export type AdminAvailabilityStatus = "available" | "empty" | "not_instrumented" | "partial" | string;

export type AdminAvailability = {
  reason: string;
  source: string;
  status: AdminAvailabilityStatus;
};

export type AdminPeriod = {
  granularity: "day" | "week" | "month" | string;
  started_from: string | null;
  started_to: string | null;
  timezone: string;
};

export type AdminDistributionBucket = {
  count: number;
  percentage: number;
};

export type AdminStageDistributionItem = AdminDistributionBucket & {
  stage: string;
};

export type AdminStatusDistributionItem = AdminDistributionBucket & {
  status: string;
};

export type AdminCreatedSeriesItem = {
  bucket: string;
  created_count: number;
};

export type AdminProjectsAnalytics = {
  active: number;
  archived: number;
  created_series: {
    availability: AdminAvailability;
    items: AdminCreatedSeriesItem[];
  };
  definitions: Record<string, string>;
  deleted: number;
  distribution_by_stage: AdminStageDistributionItem[];
  distribution_by_status: AdminStatusDistributionItem[];
  finalized: number;
  finalized_series: {
    availability: AdminAvailability;
    items: unknown[];
  };
  period: AdminPeriod;
  total: number;
};

export type AdminUsersSummary = {
  active: number;
  connected: number | null;
  connected_availability: AdminAvailability;
  distribution_by_role: Array<AdminDistributionBucket & { role: string }>;
  inactive: number;
  new_users: number;
  period: AdminPeriod;
  recently_active: number;
  total: number;
};

export type AdminActivityItem = {
  actor_email: string;
  actor_user_id: string | null;
  created_at: string;
  id: string;
  metadata: Record<string, unknown>;
  severity: string;
  source: string;
  title: string;
  type: string;
};

export type AdminActivityResponse = {
  availability: AdminAvailability;
  count: number;
  items: AdminActivityItem[];
};

export type AdminUserRecord = {
  activity: {
    activity_definition: string;
    is_recently_active: boolean;
    last_activity_at: string | null;
  };
  created_at: string;
  email: string;
  email_verified: boolean;
  full_name: string;
  id: string;
  is_active: boolean;
  membership: {
    created_at: string;
    id: string;
    is_active: boolean;
    role: "owner" | "admin" | "editor" | "viewer" | string;
    updated_at: string;
    workspace_id: string;
  };
  preferred_currency: string;
  preferred_language: string;
  updated_at: string;
};

export type AdminUsersListResponse = {
  count: number;
  items: AdminUserRecord[];
  limit: number;
  offset: number;
};

export type AdminUserPatchRequest = {
  full_name?: string | null;
  is_active?: boolean | null;
  membership_is_active?: boolean | null;
  membership_role?: "owner" | "admin" | "editor" | "viewer" | null;
};

export type AdminUserInvitationRecord = {
  accepted_user_id: string | null;
  created_at: string;
  delivery_status: string;
  email: string;
  expires_at: string | null;
  full_name: string;
  id: string;
  invited_by_user_id: string | null;
  message: string;
  metadata: Record<string, unknown>;
  role: "owner" | "admin" | "editor" | "viewer" | string;
  status: string;
  updated_at: string;
  workspace_id: string;
};

export type AdminUserInvitationCreateRequest = {
  email: string;
  expires_at?: string | null;
  full_name?: string;
  message?: string;
  metadata?: Record<string, unknown>;
  role?: "owner" | "admin" | "editor" | "viewer";
};

export type AdminUserInvitationListResponse = {
  count: number;
  items: AdminUserInvitationRecord[];
  limit: number;
  offset: number;
};

export type AdminRoleDefinition = {
  is_system: boolean;
  key: string;
  label: string;
  permission_count: number;
  permissions: string[];
  scope: "workspace" | "platform" | string;
};

export type AdminRolesResponse = {
  definitions: Record<string, string>;
  effective: {
    platform: string[];
    workspace: string | null;
  };
  platform_roles: AdminRoleDefinition[];
  workspace_roles: AdminRoleDefinition[];
};

export type AdminOverviewResponse = {
  activity: AdminActivityResponse;
  availability: Record<string, AdminAvailability>;
  filters: {
    model_name: string;
    project_id: string | null;
    provider_key: string;
    stage: string;
    user_id: string | null;
    workspace_id: string;
  };
  llm: {
    provider_breakdown: FinOpsProviderBreakdownItem[];
    summary: FinOpsSummary;
  };
  period: AdminPeriod;
  projects: AdminProjectsAnalytics;
  users: AdminUsersSummary;
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
};

export type AdminAnalyticsQuery = {
  granularity?: "day" | "week" | "month";
  model_name?: string | null;
  project_id?: string | null;
  provider_key?: string | null;
  stage?: string | null;
  started_from?: string | null;
  started_to?: string | null;
  user_id?: string | null;
};

export type AdminUsersListQuery = {
  limit?: number;
  offset?: number;
  role?: string | null;
  search?: string | null;
  started_from?: string | null;
  started_to?: string | null;
  status?: "all" | "active" | "inactive";
};

export type AdminInvitationListQuery = {
  limit?: number;
  offset?: number;
  status?: string;
};
