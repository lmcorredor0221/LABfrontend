import { act, render, screen, waitFor } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { CurrencyProvider, useCurrency } from "@/core/commerce/currency-context";

const mocks = vi.hoisted(() => ({
  authState: {
    current: {} as {
      isHydrated: boolean;
      status: string;
      user: { id: string; preferred_currency: string } | null;
    },
  },
  patch: vi.fn(),
}));

mocks.authState.current = {
  isHydrated: true,
  status: "authenticated",
  user: {
    id: "user-1",
    preferred_currency: "COP",
  },
};

vi.mock("@/core/auth/auth-context", () => ({
  useAuth: () => mocks.authState.current,
}));

vi.mock("@/core/api", () => ({
  apiClient: {
    patch: mocks.patch,
  },
}));

vi.mock("@/core/commerce/trm-service", () => ({
  DEFAULT_TRM: { unit_usd: 1, trm_cop: 3171.93, date: "2026-08-23", source: "TRM test" },
  DEFAULT_BASE_PRICES: { blueprint_pro_usd: 49, acp_premium_usd: 149, lab_builder_monthly_usd: 149 },
  fetchTRM: vi.fn().mockResolvedValue({
    unit_usd: 1,
    trm_cop: 3171.93,
    date: "2026-08-23",
    source: "TRM test",
  }),
  fetchBasePrices: vi.fn().mockResolvedValue({
    blueprint_pro_usd: 49,
    acp_premium_usd: 149,
    lab_builder_monthly_usd: 149,
  }),
  formatPriceValue: vi.fn(() => "$0"),
}));

function Probe() {
  const { currency, setCurrency } = useCurrency();
  return (
    <div>
      <span data-testid="currency">{currency}</span>
      <button onClick={() => setCurrency("USD")} type="button">
        USD
      </button>
      <button onClick={() => setCurrency("COP")} type="button">
        COP
      </button>
    </div>
  );
}

function installMemoryStorage() {
  const values = new Map<string, string>();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      clear: () => values.clear(),
      getItem: (key: string) => values.get(key) ?? null,
      removeItem: (key: string) => values.delete(key),
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
    },
  });
}

describe("CurrencyProvider", () => {
  beforeEach(() => {
    installMemoryStorage();
    mocks.patch.mockReset();
    mocks.authState.current = {
      isHydrated: true,
      status: "authenticated",
      user: {
        id: "user-1",
        preferred_currency: "COP",
      },
    };
  });

  it("migrates legacy localStorage currency to backend once for the authenticated user", async () => {
    window.localStorage.setItem("lean_app_currency", "USD");
    mocks.patch.mockResolvedValue({ preferred_currency: "USD", user_id: "user-1", updated_at: "2026-08-23T00:00:00Z" });

    render(
      <CurrencyProvider>
        <Probe />
      </CurrencyProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("currency")).toHaveTextContent("USD");
    });
    await waitFor(() => {
      expect(mocks.patch).toHaveBeenCalledWith("/api/v1/auth/currency", {
        body: { preferred_currency: "USD" },
      });
    });
    expect(window.localStorage.getItem("lean_app_currency_user_id")).toBe("user-1");
    expect(window.localStorage.getItem("lean_app_currency_backend_migrated:user-1")).toBe("1");
  });

  it("hydrates without mismatch when browser storage prefers a different currency", async () => {
    window.localStorage.setItem("lean_app_currency", "USD");
    mocks.authState.current = {
      isHydrated: true,
      status: "anonymous",
      user: null,
    };

    const container = document.createElement("div");
    document.body.appendChild(container);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const originalWindow = globalThis.window;

    try {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: undefined,
      });
      const markup = renderToString(
        <CurrencyProvider>
          <Probe />
        </CurrencyProvider>,
      );
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: originalWindow,
      });

      container.innerHTML = markup;

      await act(async () => {
        hydrateRoot(
          container,
          <CurrencyProvider>
            <Probe />
          </CurrencyProvider>,
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId("currency")).toHaveTextContent("USD");
      });

      const hydrationMessages = consoleError.mock.calls
        .flatMap((call) => call.map((entry) => String(entry)))
        .join("\n");
      expect(hydrationMessages).not.toContain("Hydration failed because the server rendered text didn't match the client");
    } finally {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: originalWindow,
      });
      consoleError.mockRestore();
      container.remove();
    }
  });

  it("rolls back the UI when saving the new currency preference fails", async () => {
    window.localStorage.setItem("lean_app_currency", "COP");
    window.localStorage.setItem("lean_app_currency_user_id", "user-1");
    window.localStorage.setItem("lean_app_currency_backend_migrated:user-1", "1");
    mocks.patch.mockRejectedValue(new Error("network failure"));
    const user = userEvent.setup();

    render(
      <CurrencyProvider>
        <Probe />
      </CurrencyProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("currency")).toHaveTextContent("COP");
    });

    await user.click(screen.getByRole("button", { name: "USD" }));

    await waitFor(() => {
      expect(screen.getByTestId("currency")).toHaveTextContent("COP");
    });
    expect(window.localStorage.getItem("lean_app_currency")).toBe("COP");
  });
});
