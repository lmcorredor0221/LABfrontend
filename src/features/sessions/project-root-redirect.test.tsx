import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProductJourneyOverview } from "@/features/product-experience/saas/product-journey-overview";
import { ProjectRootRedirect } from "@/features/sessions/project-root-redirect";

const mocks = vi.hoisted(() => ({
  getProductJourneyOverview: vi.fn(),
  replace: vi.fn(),
  router: { replace: vi.fn() },
  selectSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => mocks.router,
}));

vi.mock("@/features/sessions/session-context", () => ({
  useSessions: () => ({
    getProductJourneyOverview: mocks.getProductJourneyOverview,
    selectSession: mocks.selectSession,
  }),
}));

function createJourneyOverview(overrides?: Partial<ProductJourneyOverview>): ProductJourneyOverview {
  return {
    achieved_outcomes: [],
    active_operation: null,
    blocking_attention_count: 0,
    contract_version: "product-journey-overview.v2",
    current_stage: {
      label: "Herramientas",
      lifecycle: "running",
      product_key: "blueprint_basic",
      progress_percent: 44,
      stage_key: "tools",
    },
    deliverable_summary: {
      attention_count: 0,
      available_count: 1,
      error_count: 0,
      locked_count: 2,
      pending_count: 4,
      running_count: 1,
      stale_count: 0,
      total_count: 8,
    },
    generated_at: "2026-08-05T11:00:00Z",
    products: [],
    project_title: "Asistente de soporte",
    recommended_next_action: null,
    session_id: "session-1",
    source_contracts: ["product-build-status.v1"],
    technical_error_count: 0,
    warning_attention_count: 0,
    workspace_id: "workspace-1",
    ...overrides,
  };
}

describe("ProjectRootRedirect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.router.replace = mocks.replace;
    mocks.selectSession.mockResolvedValue(undefined);
  });

  it("opens the canonical unfinished project stage from the journey overview", async () => {
    mocks.getProductJourneyOverview.mockResolvedValue(createJourneyOverview());

    render(<ProjectRootRedirect sessionId="session-1" />);

    expect(screen.getByText("Abriendo tu proyecto")).toBeInTheDocument();
    await waitFor(() => expect(mocks.getProductJourneyOverview).toHaveBeenCalledWith("session-1"));
    expect(mocks.selectSession).toHaveBeenCalledWith("session-1", { loadSnapshot: false, persist: true });
    expect(mocks.replace).toHaveBeenCalledWith("/projects/session-1/work/tools");
  });

  it("shows a retryable error when the canonical overview cannot be loaded", async () => {
    mocks.getProductJourneyOverview
      .mockRejectedValueOnce(new Error("Overview temporalmente no disponible"))
      .mockResolvedValueOnce(
        createJourneyOverview({
          blocking_attention_count: 1,
          recommended_next_action: {
            action_key: "open_attention",
            href: "/projects/session-1/attention",
            label: "Resolver pendientes",
            primary: true,
            product_key: "blueprint_basic",
            reason: "Falta informacion obligatoria.",
            state: "blocked",
          },
        }),
      );

    render(<ProjectRootRedirect sessionId="session-1" />);

    expect(await screen.findByText("Overview temporalmente no disponible")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    await waitFor(() => expect(mocks.getProductJourneyOverview).toHaveBeenCalledTimes(2));
    expect(mocks.replace).toHaveBeenCalledWith("/projects/session-1/attention");
  });
});
