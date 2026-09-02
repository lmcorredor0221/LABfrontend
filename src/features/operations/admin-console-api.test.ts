import { createAdminConsoleApi } from "@/features/operations/admin-console-api";

describe("admin console api", () => {
  it("builds analytics and project endpoints with filters", async () => {
    const client = {
      get: vi.fn().mockResolvedValue({}),
    };

    const api = createAdminConsoleApi(client as never);
    await api.getOverview({
      granularity: "day",
      provider_key: "openai",
      started_from: "2026-08-01T00:00:00",
      started_to: "2026-08-31T23:59:59",
    });
    await api.getProjectsAnalytics({
      stage: "ready_for_export",
      user_id: "user-1",
    });

    expect(client.get).toHaveBeenCalledWith(
      "/api/v1/admin/overview?granularity=day&provider_key=openai&started_from=2026-08-01T00%3A00%3A00&started_to=2026-08-31T23%3A59%3A59",
      { includeWorkspaceId: false },
    );
    expect(client.get).toHaveBeenCalledWith(
      "/api/v1/admin/projects/analytics?stage=ready_for_export&user_id=user-1",
      { includeWorkspaceId: false },
    );
  });

  it("uses users, invitations and roles endpoints", async () => {
    const client = {
      get: vi.fn().mockResolvedValue({ items: [], count: 0 }),
      patch: vi.fn().mockResolvedValue({ id: "user-1" }),
      post: vi.fn().mockResolvedValue({ id: "invitation-1" }),
    };

    const api = createAdminConsoleApi(client as never);
    await api.listUsers({ limit: 100, role: "admin", status: "active" });
    await api.updateUser("user/1", { membership_role: "viewer" });
    await api.listInvitations({ limit: 50, status: "pending" });
    await api.createInvitation({
      email: "nuevo@leanbuilder.local",
      metadata: { source: "settings_admin_console" },
      role: "viewer",
    });
    await api.getRoles();

    expect(client.get).toHaveBeenCalledWith("/api/v1/admin/users?limit=100&role=admin&status=active");
    expect(client.patch).toHaveBeenCalledWith("/api/v1/admin/users/user%2F1", {
      body: { membership_role: "viewer" },
    });
    expect(client.get).toHaveBeenCalledWith("/api/v1/admin/users/invitations?limit=50&status=pending");
    expect(client.post).toHaveBeenCalledWith("/api/v1/admin/users/invitations", {
      body: {
        email: "nuevo@leanbuilder.local",
        metadata: { source: "settings_admin_console" },
        role: "viewer",
      },
    });
    expect(client.get).toHaveBeenCalledWith("/api/v1/admin/roles");
  });
});
