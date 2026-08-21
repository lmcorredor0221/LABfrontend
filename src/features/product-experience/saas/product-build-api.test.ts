import { describe, expect, it, vi } from "vitest";

import {
  createProductBuildApi,
  type ProductBuildApiClient,
} from "@/features/product-experience/saas/product-build-api";

const productBuildStatusPayload = {
  contract_version: "product-build-status.v1",
  workspace_id: "workspace-1",
  session_id: "session-1",
  product_key: "blueprint_basic",
  product_mode: "basic_free",
  product_label: "Blueprint Basico",
  lifecycle: "completed",
  entitlement: {
    tier: "blueprint",
    access_state: "allowed",
    is_purchased: true,
    purchase_required: false,
    checkout_href: "",
    upgrade_label: "",
  },
  progress: {
    percent: 100,
    completed_units: 5,
    total_units: 5,
    blocked_units: 0,
    calculation: "weighted_units",
    label: "5 de 5 entregables listos",
  },
  current_activity: null,
  stages: [],
  deliverables: [],
  attention: {
    total: 0,
    blocking_count: 0,
    warning_count: 0,
    technical_error_count: 0,
    items: [],
  },
  actions: [],
  last_error: null,
  generated_at: "2026-08-15T10:01:00Z",
  source_contracts: ["product-build-runs.v1"],
};

const productJourneyOverviewPayload = {
  contract_version: "product-journey-overview.v2",
  workspace_id: "workspace-1",
  session_id: "session-1",
  project_title: "Journey Project",
  current_stage: {
    stage_key: "discover",
    label: "Descubrir",
    lifecycle: "ready_to_start",
    progress_percent: 0,
    product_key: "blueprint_basic",
  },
  achieved_outcomes: [],
  active_operation: null,
  blocking_attention_count: 0,
  warning_attention_count: 0,
  technical_error_count: 0,
  recommended_next_action: {
    action_key: "open_product",
    label: "Ver Blueprint Basico",
    state: "recommended",
    href: "/projects/session-1/blueprint",
    reason: "Abrir experiencia del producto.",
    product_key: "blueprint_basic",
    primary: true,
  },
  products: [],
  deliverable_summary: {
    total_count: 0,
    available_count: 0,
    pending_count: 0,
    running_count: 0,
    locked_count: 0,
    stale_count: 0,
    attention_count: 0,
    error_count: 0,
  },
  generated_at: "2026-08-16T12:00:00Z",
  source_contracts: ["product-build-status.v1"],
};

function createGetMock(payload: unknown) {
  const get = vi.fn(async () => payload);
  return get as typeof get & ProductBuildApiClient["get"];
}

describe("productBuildApi", () => {
  it("loads and normalizes a single product build status", async () => {
    const get = createGetMock(productBuildStatusPayload);
    const api = createProductBuildApi({ get });

    const status = await api.getProductBuildStatus("session-1", "blueprint_basic");

    expect(get).toHaveBeenCalledWith("/api/v1/sessions/session-1/product-builds/blueprint_basic", {
      signal: undefined,
    });
    expect(status.contract_version).toBe("product-build-status.v1");
    expect(status.product_key).toBe("blueprint_basic");
  });

  it("loads and normalizes the product build status list", async () => {
    const get = createGetMock([productBuildStatusPayload]);
    const api = createProductBuildApi({ get });

    const statuses = await api.listProductBuildStatuses("session-1");

    expect(get).toHaveBeenCalledWith("/api/v1/sessions/session-1/product-builds", {
      signal: undefined,
    });
    expect(statuses).toHaveLength(1);
    expect(statuses[0]?.product_key).toBe("blueprint_basic");
  });

  it("loads and normalizes the canonical product journey overview", async () => {
    const get = createGetMock(productJourneyOverviewPayload);
    const api = createProductBuildApi({ get });

    const overview = await api.getProductJourneyOverview("session-1");

    expect(get).toHaveBeenCalledWith("/api/v1/sessions/session-1/product-journey-overview", {
      signal: undefined,
    });
    expect(overview.contract_version).toBe("product-journey-overview.v2");
    expect(overview.recommended_next_action?.product_key).toBe("blueprint_basic");
  });
});
