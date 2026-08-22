import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegisterPage } from "@/components/lean/register-page";
import { apiClient } from "@/core/api";
import {
  AUTH_TOKEN_STORAGE_KEY,
  LEGACY_AUTH_TOKEN_STORAGE_KEY,
} from "@/core/auth/token-store";
import type { AuthState, AuthUser, LoginResponse } from "@/core/auth/types";
import { LanguageProvider } from "@/core/i18n/language-context";

const mocks = vi.hoisted(() => ({
  auth: {
    clear: vi.fn(),
    hydrate: vi.fn(),
  },
  post: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/register",
  useRouter: () => ({
    push: vi.fn(),
    replace: mocks.replace,
  }),
}));

vi.mock("@/core/api", async () => {
  const actual = await vi.importActual<typeof import("@/core/api")>("@/core/api");

  return {
    ...actual,
    apiClient: {
      ...actual.apiClient,
      patch: vi.fn(),
      post: mocks.post,
    },
  };
});

vi.mock("@/core/auth/auth-context", () => ({
  useAuth: () => mocks.auth,
}));

const authUser: AuthUser = {
  active_workspace_id: "workspace-1",
  active_workspace_name: "Founder Workspace",
  email: "founder@example.com",
  full_name: "Jane Founder",
  id: "user-1",
  workspaces: [
    {
      is_active: true,
      role: "owner",
      workspace_id: "workspace-1",
      workspace_name: "Founder Workspace",
      workspace_slug: "founder-workspace",
    },
  ],
};

const authenticatedState: AuthState = {
  error: null,
  isHydrated: true,
  status: "authenticated",
  token: "new-token",
  user: authUser,
};

const anonymousState: AuthState = {
  error: null,
  isHydrated: true,
  status: "anonymous",
  token: null,
  user: null,
};

function loginResponse(overrides: Partial<LoginResponse> = {}): LoginResponse {
  return {
    access_token: "new-token",
    expires_at: "2026-08-16T12:00:00",
    token_type: "bearer",
    user: authUser,
    ...overrides,
  };
}

function renderRegisterPage() {
  return render(
    <LanguageProvider initialLanguage="en">
      <RegisterPage />
    </LanguageProvider>,
  );
}

function resetLocalStorage() {
  const values = new Map<string, string>();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      clear: vi.fn(() => values.clear()),
      getItem: vi.fn((key: string) => values.get(key) ?? null),
      removeItem: vi.fn((key: string) => {
        values.delete(key);
      }),
      setItem: vi.fn((key: string, value: string) => {
        values.set(key, value);
      }),
    } satisfies Pick<Storage, "clear" | "getItem" | "removeItem" | "setItem">,
  });
}

function fillValidRegistrationForm() {
  fireEvent.change(screen.getByRole("textbox", { name: /full name/i }), { target: { value: "Jane Founder" } });
  fireEvent.change(screen.getByRole("textbox", { name: /professional email/i }), { target: { value: "Founder@Example.COM" } });
  fireEvent.change(screen.getByRole("textbox", { name: /workspace or organization/i }), { target: { value: "Founder Workspace" } });
  fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "ValidPass1!" } });
  fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "ValidPass1!" } });

  fireEvent.click(screen.getByLabelText(/terms and conditions/i));
  fireEvent.click(screen.getByLabelText(/personal data processing/i));
  fireEvent.click(screen.getByLabelText(/privacy policy/i));
}

describe("RegisterPage", () => {
  beforeEach(() => {
    resetLocalStorage();
    mocks.auth.clear.mockReset();
    mocks.auth.hydrate.mockReset();
    mocks.post.mockReset();
    mocks.replace.mockReset();
  });

  it("stores the canonical token, validates /auth/me through hydrate, and opens the workspace", async () => {
    mocks.post.mockResolvedValue(loginResponse());
    mocks.auth.hydrate.mockResolvedValue(authenticatedState);
    window.localStorage.setItem(LEGACY_AUTH_TOKEN_STORAGE_KEY, "legacy-token");

    renderRegisterPage();
    fillValidRegistrationForm();

    fireEvent.click(
      screen.getByRole("button", { name: /complete registration and open workspace/i }),
    );

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/projects"));

    expect(apiClient.post).toHaveBeenCalledWith("/api/v1/auth/register", {
      body: expect.objectContaining({
        accept_data_treatment: true,
        accept_privacy: true,
        accept_terms: true,
        email: "founder@example.com",
        full_name: "Jane Founder",
        workspace_name: "Founder Workspace",
      }),
    });
    expect(window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe("new-token");
    expect(window.localStorage.getItem(LEGACY_AUTH_TOKEN_STORAGE_KEY)).toBeNull();
    expect(mocks.auth.hydrate).toHaveBeenCalledWith({
      force: true,
      redirectOnUnauthorized: false,
    });
    expect(mocks.auth.clear).not.toHaveBeenCalled();
  });

  it("does not navigate and clears the token when post-registration session validation fails", async () => {
    mocks.post.mockResolvedValue(loginResponse());
    mocks.auth.hydrate.mockResolvedValue(anonymousState);

    renderRegisterPage();
    fillValidRegistrationForm();

    fireEvent.click(
      screen.getByRole("button", { name: /complete registration and open workspace/i }),
    );

    expect(
      await screen.findByText(/could not validate the new session/i),
    ).toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(mocks.auth.clear).toHaveBeenCalledTimes(1);
  });

  it("surfaces duplicate-account errors without redirecting", async () => {
    mocks.post.mockRejectedValue(new Error("El correo electronico ya se encuentra registrado."));

    renderRegisterPage();
    fillValidRegistrationForm();

    fireEvent.click(
      screen.getByRole("button", { name: /complete registration and open workspace/i }),
    );

    expect(
      await screen.findByText("El correo electronico ya se encuentra registrado."),
    ).toBeInTheDocument();
    expect(window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull();
    expect(mocks.auth.hydrate).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("exposes an accessible password visibility toggle", async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    const showPasswordButton = screen.getByRole("button", { name: /show password/i });

    expect(showPasswordButton).toHaveAttribute("aria-pressed", "false");

    await user.click(showPasswordButton);

    expect(
      screen.getByRole("button", { name: /hide password/i }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps legal document view actions outside their consent labels to avoid touch interception", () => {
    renderRegisterPage();

    const viewButtons = screen.getAllByRole("button", { name: /\(view\)/i });

    expect(viewButtons).toHaveLength(3);
    viewButtons.forEach((button) => {
      expect(button.closest("label")).toBeNull();
    });
  });

  it("ignores a second submit while the first registration request is still in flight", async () => {
    mocks.post.mockImplementation(() => new Promise(() => undefined));

    const { container } = renderRegisterPage();
    await fillValidRegistrationForm();

    const form = container.querySelector("form");
    expect(form).not.toBeNull();

    fireEvent.submit(form as HTMLFormElement);
    fireEvent.submit(form as HTMLFormElement);

    expect(mocks.post).toHaveBeenCalledTimes(1);
  });
});
