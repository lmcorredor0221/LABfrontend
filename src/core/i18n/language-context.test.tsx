import { render, screen, waitFor } from "@testing-library/react";
import { LanguageProvider, useLanguage } from "@/core/i18n/language-context";

function LanguageProbe() {
  const { language, t } = useLanguage();

  return (
    <div>
      <span data-testid="language">{language}</span>
      <span>{t("login.title")}</span>
    </div>
  );
}

describe("LanguageProvider bootstrap", () => {
  beforeEach(() => {
    const storage = new Map<string, string>();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
        removeItem: (key: string) => {
          storage.delete(key);
        },
      },
    });
    document.cookie = "antigravity_language=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    document.documentElement.lang = "es";
  });

  it("preserves a stored language instead of overwriting it with the server fallback", async () => {
    window.localStorage.setItem("antigravity_language", "en");

    render(
      <LanguageProvider initialLanguage="es">
        <LanguageProbe />
      </LanguageProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("language")).toHaveTextContent("en"));
    expect(screen.getByText("Sign in to your workspace")).toBeInTheDocument();
    expect(window.localStorage.getItem("antigravity_language")).toBe("en");
    expect(document.documentElement.lang).toBe("en");
  });
});
