import { describe, expect, it } from "vitest";

import { normalizeProductJourneyOverview } from "./product-journey-overview";

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
  products: [
    {
      product_key: "blueprint_basic",
      product_label: "Blueprint Basico",
      lifecycle: "ready_to_start",
      access_state: "allowed",
      is_purchased: true,
      purchase_required: false,
      progress_percent: 0,
      available_deliverable_count: 0,
      total_deliverable_count: 5,
      blocking_attention_count: 0,
      warning_attention_count: 0,
      technical_error_count: 0,
      active_operation: null,
      primary_action: {
        action_key: "open_product",
        label: "Ver Blueprint Basico",
        state: "recommended",
        href: "/projects/session-1/blueprint",
        reason: "Abrir experiencia del producto.",
        product_key: "blueprint_basic",
        primary: true,
      },
    },
  ],
  deliverable_summary: {
    total_count: 5,
    available_count: 0,
    pending_count: 5,
    running_count: 0,
    locked_count: 0,
    stale_count: 0,
    attention_count: 0,
    error_count: 0,
  },
  generated_at: "2026-08-16T12:00:00Z",
  source_contracts: ["product-build-status.v1"],
};

describe("product-journey-overview contract", () => {
  it("parses product-journey-overview.v2 payloads", () => {
    const overview = normalizeProductJourneyOverview(productJourneyOverviewPayload);

    expect(overview.contract_version).toBe("product-journey-overview.v2");
    expect(overview.recommended_next_action?.product_key).toBe("blueprint_basic");
    expect(overview.products[0]?.progress_percent).toBe(0);
  });

  it("rejects product-overview.v1 payloads", () => {
    expect(() =>
      normalizeProductJourneyOverview({
        contract_version: "product-overview.v1",
        session_id: "session-1",
      }),
    ).toThrow("Expected product-journey-overview.v2 response.");
  });

  it("requires a single recommended_next_action object or null", () => {
    expect(() =>
      normalizeProductJourneyOverview({
        ...productJourneyOverviewPayload,
        recommended_next_action: [],
      }),
    ).toThrow("recommended_next_action must be null or an object.");
  });
});
