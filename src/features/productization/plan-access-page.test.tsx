import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PlanAccessResponse, SessionSummary } from "@/features/sessions/types";
import { PlanAccessAdminPanel } from "./plan-access-page";

const { sessionWorkspaceRef } = vi.hoisted(() => ({
  sessionWorkspaceRef: {
    current: {
      getPlanAccess: vi.fn(),
      listStatus: "ready",
      selectedSession: null as SessionSummary | null,
    },
  },
}));

vi.mock("@/features/sessions/use-session-workspace", () => ({
  useSessionWorkspace: () => sessionWorkspaceRef.current,
}));

const selectedSession: SessionSummary = {
  created_at: "2026-08-14T12:00:00Z",
  current_stage: "draft_capture",
  id: "session-1",
  status: "draft",
  title: "Proyecto demo",
  updated_at: "2026-08-14T12:30:00Z",
};

const planAccessResponse: PlanAccessResponse = {
  access: {
    capabilities: [
      {
        allowed: true,
        capability: "can_view_blueprint",
        cta_label: "",
        current_tier: "blueprint",
        label: "Ver Blueprint",
        product: "blueprint",
        reason_code: "",
        required_tier: "blueprint",
      },
    ],
    checkout_state: "free",
    contract_version: "commercial-access.v2",
    entitlements: [],
    purchase_refs: [],
    reason_code: "free_plan",
    tier: "blueprint",
    tier_label: "Blueprint",
    user_id: "user-1",
    workspace_id: "workspace-1",
  },
  contract_version: "plan-access.v1",
  entitlements: [],
  generated_at: "2026-08-14T12:31:00Z",
  pending_requests: [],
  products: [
    {
      benefits: [],
      capabilities: ["can_view_blueprint"],
      description: "Producto base para consultar Blueprint.",
      exclusions: [],
      name: "Blueprint",
      product_key: "blueprint",
      product_type: "blueprint",
      scope: "project",
      tier: "blueprint",
      version: 1,
    },
  ],
  session_id: "session-1",
  workspace_id: "workspace-1",
};

describe("PlanAccessAdminPanel", () => {
  it("loads plan access inside Settings and keeps the detail route as contextual access", async () => {
    sessionWorkspaceRef.current = {
      getPlanAccess: vi.fn().mockResolvedValue(planAccessResponse),
      listStatus: "ready",
      selectedSession,
    };

    render(<PlanAccessAdminPanel compact showDetailLink />);

    await screen.findByText("Acceso actual del proyecto");
    expect(screen.getByText("Plan, permisos y capacidades")).toBeInTheDocument();
    expect(screen.getByText("Ver Blueprint")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Abrir detalle/i })).toHaveAttribute("href", "/settings/plan-access");
    await waitFor(() => {
      expect(sessionWorkspaceRef.current.getPlanAccess).toHaveBeenCalledWith("session-1");
    });
  });
});
