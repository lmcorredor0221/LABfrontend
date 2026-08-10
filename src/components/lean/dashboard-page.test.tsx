import { render, screen, waitFor } from "@testing-library/react";
import { DashboardPage } from "@/components/lean/dashboard-page";
import { AuthProvider } from "@/core/auth/auth-context";
import { createAuthStore } from "@/core/auth/auth-store";
import { SessionsProvider } from "@/features/sessions/session-context";
import { createSessionsStore } from "@/features/sessions/session-store";

const replaceMock = vi.fn();
const pushMock = vi.fn();
let mockPathname = "/";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    mockPathname = "/";
    pushMock.mockReset();
    replaceMock.mockReset();
  });

  it("renders live sessions and the selected session snapshot", async () => {
    const authStore = createAuthStore({
      api: {
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
      },
      clearToken: vi.fn(),
      loadToken: () => "seed-token",
      persistToken: vi.fn(),
    });
    const sessionsStore = createSessionsStore({
      api: {
        create: vi.fn(),
        getSnapshot: vi.fn().mockResolvedValue({
          activity: [
            {
              created_at: "2026-07-15T12:00:00",
              message: "Discovery normalizado",
              stage: "normalize_discovery",
              status: "ready",
            },
          ],
          approvals: [],
          contract_version: "session-snapshot.v1",
          integration_statuses: [],
          metric_snapshots: [],
          session: {
            created_at: "2026-07-15T11:00:00",
            current_stage: "normalize_discovery",
            id: "session-1",
            status: "ready",
            title: "Ventas LATAM",
            updated_at: "2026-07-15T12:00:00",
          },
          workspace_contract: {
            catalogs: [{ catalog_key: "reasoning_patterns" }],
          },
        }),
        list: vi.fn().mockResolvedValue({
          items: [
            {
              created_at: "2026-07-15T11:00:00",
              current_stage: "normalize_discovery",
              id: "session-1",
              status: "ready",
              title: "Ventas LATAM",
              updated_at: "2026-07-15T12:00:00",
            },
            {
              created_at: "2026-07-14T10:00:00",
              current_stage: "build_canvas",
              id: "session-2",
              status: "needs_review",
              title: "Soporte TI",
              updated_at: "2026-07-14T12:00:00",
            },
          ],
        }),
      },
      clearActiveSessionId: vi.fn(),
      loadActiveSessionId: () => "session-1",
      persistActiveSessionId: vi.fn(),
    });

    render(
      <AuthProvider store={authStore}>
        <SessionsProvider store={sessionsStore}>
          <DashboardPage />
        </SessionsProvider>
      </AuthProvider>,
    );

    expect((await screen.findAllByText("Ventas LATAM")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("Discovery normalizado")).length).toBeGreaterThan(0);
    expect(screen.getByText("Backend live")).toBeInTheDocument();
    expect(screen.getByText("Soporte TI")).toBeInTheDocument();

    await waitFor(() => {
      expect(pushMock).not.toHaveBeenCalled();
    });
  });
});
