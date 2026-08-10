import { fireEvent, render, waitFor } from "@testing-library/react";
import {
  PRODUCT_EXPERIENCE_CUTOVER_EVENTS_KEY,
  ProductExperienceCutoverTelemetry,
} from "@/features/product-experience/qa/cutover-telemetry";
import type { ProductExperienceCutoverDecision } from "@/core/config/feature-flags";

function createDecision(): ProductExperienceCutoverDecision {
  return {
    cohortPercent: 12,
    experience: "product_experience_v2",
    integralGateEnabled: true,
    reason: "enabled",
    rollbackEnabled: false,
    rolloutPercent: 25,
    workspaceAllowsV2: true,
    workspaceId: "workspace-uxa12",
  };
}

function readEvents() {
  return JSON.parse(window.localStorage.getItem(PRODUCT_EXPERIENCE_CUTOVER_EVENTS_KEY) ?? "[]") as Array<{
    event: string;
    routeKey: string;
    sessionId: string;
  }>;
}

describe("ProductExperienceCutoverTelemetry UXA12", () => {
  beforeEach(() => {
    const storage = new Map<string, string>();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: vi.fn((key: string) => storage.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => {
          storage.set(key, value);
        }),
      },
    });
  });

  it("records a sanitized view-opened event", async () => {
    render(
      <ProductExperienceCutoverTelemetry
        decision={createDecision()}
        routeKey="work:design"
        sessionId="session-uxa12"
      />,
    );

    await waitFor(() => {
      expect(readEvents()).toContainEqual(
        expect.objectContaining({
          event: "view_opened",
          routeKey: "work:design",
          sessionId: "session-uxa12",
        }),
      );
    });
  });

  it("records first action and retry attempts without blocking the UI", async () => {
    const { getByRole } = render(
      <>
        <ProductExperienceCutoverTelemetry
          decision={createDecision()}
          routeKey="work:design"
          sessionId="session-uxa12"
        />
        <button type="button">Reintentar generacion</button>
      </>,
    );

    fireEvent.click(getByRole("button", { name: "Reintentar generacion" }));

    await waitFor(() => {
      const eventNames = readEvents().map((event) => event.event);
      expect(eventNames).toEqual(expect.arrayContaining(["view_opened", "first_action", "retry_action"]));
    });
  });
});
