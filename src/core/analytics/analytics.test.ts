import { getMarketingContext } from "@/core/analytics/attribution";
import { pushAnalyticsEvent } from "@/core/analytics/analytics-client";
import { saveConsentChoice } from "@/core/analytics/consent-store";
import { sanitizePathname, sanitizeUrl } from "@/core/analytics/sanitize";

describe("marketing analytics helpers", () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        removeItem: (key: string) => storage.delete(key),
        setItem: (key: string, value: string) => storage.set(key, value),
      },
    });
    window.dataLayer = [];
    Object.defineProperty(document, "cookie", {
      configurable: true,
      value: "_ga=GA1.1.12345.67890; _ga_LJHWSTKF8D=GS2.1.s999$o1",
    });
  });

  it("normalizes dynamic routes and strips unsafe query parameters", () => {
    expect(sanitizePathname("/projects/095296d3-3cc0-4a3d-9704-222f94b3ad32/discover")).toBe(
      "/projects/:id/discover",
    );
    expect(sanitizeUrl("https://www.leanagentbuilder.com/register?email=test@example.com&utm_campaign=lab")).toBe(
      "https://www.leanagentbuilder.com/register?utm_campaign=lab",
    );
  });

  it("does not push dataLayer events before analytics consent", () => {
    vi.stubEnv("NEXT_PUBLIC_ANALYTICS_ENABLED", "true");
    pushAnalyticsEvent("sign_up", { method: "email" });
    expect(window.dataLayer).toEqual([]);

    saveConsentChoice({ analytics: true, advertising: false });
    pushAnalyticsEvent("sign_up", { method: "email", email: "blocked@example.com" } as never);
    expect(window.dataLayer?.at(-1)).toEqual({ event: "sign_up", method: "email" });
  });

  it("builds marketing context from consent and GA cookies", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-LJHWSTKF8D");
    saveConsentChoice({ analytics: true, advertising: true });
    const context = getMarketingContext();

    expect(context.consent.analytics_storage).toBe("granted");
    expect(context.ga_client_id).toBe("12345.67890");
    expect(context.ga_session_id).toBe("999");
  });
});
