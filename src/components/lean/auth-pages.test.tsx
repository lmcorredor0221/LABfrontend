import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiError } from "@/core/api";
import { LoginPage } from "@/components/lean/auth-pages";
import { AuthProvider } from "@/core/auth/auth-context";
import { createAuthStore } from "@/core/auth/auth-store";
import { runtimeApi } from "@/core/system/runtime-api";
import { LanguageProvider } from "@/core/i18n/language-context";

const replaceMock = vi.fn();
let mockPathname = "/login";

function ensureLocalStorage() {
  if (typeof window.localStorage?.getItem === "function") {
    return;
  }

  const values = new Map<string, string>();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      clear: () => values.clear(),
      getItem: (key: string) => values.get(key) ?? null,
      removeItem: (key: string) => values.delete(key),
      setItem: (key: string, value: string) => values.set(key, value),
    } satisfies Pick<Storage, "clear" | "getItem" | "removeItem" | "setItem">,
  });
}

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({
    push: vi.fn(),
    replace: replaceMock,
  }),
}));

vi.mock("@/core/system/runtime-api", () => ({
  runtimeApi: {
    health: vi.fn(),
  },
}));

describe("LoginPage", () => {
  beforeEach(() => {
    ensureLocalStorage();
    replaceMock.mockReset();
    mockPathname = "/login";
    vi.mocked(runtimeApi.health).mockResolvedValue({
      llm: {},
      runtime: {},
      status: "ok",
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders backend login errors after submit", async () => {
    const user = userEvent.setup();
    const authStore = createAuthStore({
      api: {
        login: vi.fn().mockRejectedValue(
          ApiError.fromResponse({
            fallbackMessage: "Login failed",
            method: "POST",
            payload: { detail: "Invalid credentials" },
            source: "backend",
            status: 401,
            url: "/api/v1/auth/login",
          }),
        ),
        logout: vi.fn(),
        me: vi.fn(),
        selectWorkspace: vi.fn(),
      },
      clearToken: vi.fn(),
      loadToken: () => null,
      persistToken: vi.fn(),
    });

    render(
      <LanguageProvider>
        <AuthProvider store={authStore}>
          <LoginPage />
        </AuthProvider>
      </LanguageProvider>,
    );

    await waitFor(() => expect(runtimeApi.health).toHaveBeenCalled());
    await user.type(
      screen.getByRole("textbox", { name: /correo electr[oó]nico/i }),
      "lmcorredor@leanagentbuilder.com",
    );
    await user.type(screen.getByLabelText(/contrase[nñ]a/i), "wrong-password");
    await user.click(
      screen.getByRole("button", { name: /Iniciar sesi[oó]n/i }),
    );

    expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("fills the seeded local admin credentials without submitting the form", async () => {
    const user = userEvent.setup();
    const authStore = createAuthStore({
      api: {
        login: vi.fn(),
        logout: vi.fn(),
        me: vi.fn(),
        selectWorkspace: vi.fn(),
      },
      clearToken: vi.fn(),
      loadToken: () => null,
      persistToken: vi.fn(),
    });

    render(
      <LanguageProvider>
        <AuthProvider store={authStore}>
          <LoginPage />
        </AuthProvider>
      </LanguageProvider>,
    );

    await waitFor(() => expect(runtimeApi.health).toHaveBeenCalled());
    await user.click(
      screen.getByRole("button", { name: "Usar usuario semilla local" }),
    );

    expect(
      screen.getByRole("textbox", { name: /correo electr[oó]nico/i }),
    ).toHaveValue("lmcorredor@leanagentbuilder.com");
    expect(screen.getByLabelText(/contrase[nñ]a/i)).toHaveValue(
      "LeanBuilder123!",
    );
    await waitFor(() => expect(replaceMock).not.toHaveBeenCalled());
  });

  it("hides the local seed user shortcut in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const authStore = createAuthStore({
      api: {
        login: vi.fn(),
        logout: vi.fn(),
        me: vi.fn(),
        selectWorkspace: vi.fn(),
      },
      clearToken: vi.fn(),
      loadToken: () => null,
      persistToken: vi.fn(),
    });

    render(
      <LanguageProvider>
        <AuthProvider store={authStore}>
          <LoginPage />
        </AuthProvider>
      </LanguageProvider>,
    );

    await waitFor(() => expect(runtimeApi.health).toHaveBeenCalled());

    expect(
      screen.queryByRole("button", { name: "Usar usuario semilla local" }),
    ).not.toBeInTheDocument();
  });

  it("exposes the compact auth runtime marker on login", async () => {
    const authStore = createAuthStore({
      api: {
        login: vi.fn(),
        logout: vi.fn(),
        me: vi.fn(),
        selectWorkspace: vi.fn(),
      },
      clearToken: vi.fn(),
      loadToken: () => null,
      persistToken: vi.fn(),
    });

    const { container } = render(
      <LanguageProvider>
        <AuthProvider store={authStore}>
          <LoginPage />
        </AuthProvider>
      </LanguageProvider>,
    );

    await waitFor(() => expect(runtimeApi.health).toHaveBeenCalled());
    const root = container.querySelector('[data-auth-surface="login"]');

    expect(root).toHaveAttribute("data-auth-build", "auth-compact-20");
    expect(root).toHaveAttribute("data-auth-density", "compact-20");
  });

  it("does not expose an inert forgot-password action", async () => {
    const authStore = createAuthStore({
      api: {
        login: vi.fn(),
        logout: vi.fn(),
        me: vi.fn(),
        selectWorkspace: vi.fn(),
      },
      clearToken: vi.fn(),
      loadToken: () => null,
      persistToken: vi.fn(),
    });

    render(
      <LanguageProvider>
        <AuthProvider store={authStore}>
          <LoginPage />
        </AuthProvider>
      </LanguageProvider>,
    );

    await waitFor(() => expect(runtimeApi.health).toHaveBeenCalled());

    expect(
      screen.queryByRole("button", { name: /olvidaste|forgot/i }),
    ).not.toBeInTheDocument();
  });
});
