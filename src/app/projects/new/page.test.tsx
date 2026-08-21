import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import NewProjectPage from "./page";
import { LanguageProvider } from "@/core/i18n/language-context";

const mocks = vi.hoisted(() => ({
  createSession: vi.fn().mockResolvedValue({ id: "123e4567-e89b-12d3-a456-426614174000" }),
  selectSession: vi.fn().mockResolvedValue(undefined),
  replace: vi.fn(),
  authState: { current: { status: "authenticated", isHydrated: true } },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
  usePathname: () => "/projects/new",
}));

vi.mock("@/core/auth/auth-context", () => ({
  useAuth: () => mocks.authState.current,
}));

vi.mock("@/features/sessions/session-context", () => ({
  useSessions: () => ({
    createSession: mocks.createSession,
    selectSession: mocks.selectSession,
  }),
}));

describe("NewProjectPage (/projects/new)", () => {
  it("creates a new session and redirects to /projects/:id/discover", async () => {
    render(
      <LanguageProvider initialLanguage="es">
        <NewProjectPage />
      </LanguageProvider>,
    );

    expect(screen.getByText("Iniciando tu Blueprint...")).toBeInTheDocument();

    await waitFor(() => {
      expect(mocks.createSession).toHaveBeenCalled();
      expect(mocks.selectSession).toHaveBeenCalledWith("123e4567-e89b-12d3-a456-426614174000", {
        loadSnapshot: false,
        persist: true,
      });
      expect(mocks.replace).toHaveBeenCalledWith("/projects/123e4567-e89b-12d3-a456-426614174000/discover");
    });
  });

  it("redirects to login if user is unauthenticated", async () => {
    mocks.authState.current = { status: "anonymous", isHydrated: true };
    render(
      <LanguageProvider initialLanguage="es">
        <NewProjectPage />
      </LanguageProvider>,
    );

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith("/login?redirect=/projects/new");
    });
  });
});
