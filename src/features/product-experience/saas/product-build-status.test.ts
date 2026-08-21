import { describe, expect, it } from "vitest";

import { calculateProductBuildPercent, normalizeProductBuildStatus } from "./product-build-status";

const productBuildStatusPayload = {
  contract_version: "product-build-status.v1",
  workspace_id: "workspace-1",
  session_id: "session-1",
  product_key: "blueprint_basic",
  product_mode: "basic_free",
  product_label: "Blueprint Basico",
  lifecycle: "running",
  entitlement: {
    tier: "blueprint",
    access_state: "allowed",
    is_purchased: true,
    purchase_required: false,
    checkout_href: "",
    upgrade_label: "",
  },
  progress: {
    percent: 60,
    completed_units: 3,
    total_units: 5,
    blocked_units: 0,
    calculation: "weighted_units",
    label: "3 de 5 entregables listos",
  },
  current_activity: {
    activity_key: "generate_blueprint",
    label: "Generando Blueprint",
    detail: "Preparando diagramas y artefactos comerciales.",
    step_key: "deliverables",
    status: "running",
    started_at: "2026-08-15T10:00:00Z",
    updated_at: "2026-08-15T10:01:00Z",
  },
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
  source_contracts: ["product-overview.v1"],
};

describe("product-build-status contract", () => {
  it("parses product-build-status.v1 payloads", () => {
    const status = normalizeProductBuildStatus(productBuildStatusPayload);

    expect(status.contract_version).toBe("product-build-status.v1");
    expect(status.lifecycle).toBe("running");
    expect(status.progress.percent).toBe(60);
  });

  it("rejects product-overview.v1 payloads", () => {
    expect(() =>
      normalizeProductBuildStatus({
        contract_version: "product-overview.v1",
        session_id: "session-1",
      }),
    ).toThrow("Expected product-build-status.v1 response.");
  });

  it("uses the same rounded progress calculation as backend", () => {
    expect(calculateProductBuildPercent(1, 4)).toBe(25);
    expect(calculateProductBuildPercent(20, 10)).toBe(100);
    expect(calculateProductBuildPercent(-1, 10)).toBe(0);
    expect(calculateProductBuildPercent(1, 0)).toBe(0);
  });
});
