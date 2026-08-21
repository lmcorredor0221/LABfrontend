import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TopUtilities } from "@/components/lean/shell";
import type { AuthUser } from "@/core/auth/types";

const selectWorkspaceMock = vi.fn();
const useAuthMock = vi.fn();
const routerPushMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/projects",
  useRouter: () => ({
    push: routerPushMock,
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/core/auth/auth-context", () => ({
  useAuth: () => useAuthMock(),
}));

function buildUser(overrides?: Partial<AuthUser>): AuthUser {
  return {
    active_workspace_id: "workspace-a",
    active_workspace_name: "Workspace A",
    email: "admin@leanbuilder.local",
    full_name: "Lean Builder Admin",
    id: "user-1",
    workspaces: [
      {
        is_active: true,
        role: "owner",
        workspace_id: "workspace-a",
        workspace_name: "Workspace A",
        workspace_slug: "workspace-a",
      },
      {
        is_active: true,
        role: "admin",
        workspace_id: "workspace-b",
        workspace_name: "Workspace B",
        workspace_slug: "workspace-b",
      },
    ],
    ...overrides,
  };
}

describe("TopUtilities", () => {
  beforeEach(() => {
    selectWorkspaceMock.mockReset();
    useAuthMock.mockReturnValue({
      selectWorkspace: selectWorkspaceMock,
      status: "authenticated",
      user: buildUser(),
    });
  });

  it("permite cambiar el workspace activo desde el selector superior", async () => {
    render(<TopUtilities />);

    const selector = screen.getByLabelText("Seleccionar workspace");
    expect(selector).toHaveValue("workspace-a");

    await userEvent.selectOptions(selector, "workspace-b");

    expect(selectWorkspaceMock).toHaveBeenCalledWith("workspace-b");
  });

  it("deshabilita el selector cuando solo existe un workspace disponible", () => {
    useAuthMock.mockReturnValue({
      selectWorkspace: selectWorkspaceMock,
      status: "authenticated",
      user: buildUser({
        workspaces: [
          {
            is_active: true,
            role: "owner",
            workspace_id: "workspace-a",
            workspace_name: "Workspace A",
            workspace_slug: "workspace-a",
          },
        ],
      }),
    });

    render(<TopUtilities />);

    expect(screen.getByLabelText("Seleccionar workspace")).toBeDisabled();
  });
});
