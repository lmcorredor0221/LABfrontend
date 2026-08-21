import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  shouldPollProductBuildStatus,
  useProductBuildStatus,
} from "@/features/product-experience/saas/use-product-build-status";
import type {
  ProductBuildLifecycle,
  ProductBuildStatus,
} from "@/features/product-experience/saas/product-build-status";

function createStatus(lifecycle: ProductBuildLifecycle): ProductBuildStatus {
  return {
    contract_version: "product-build-status.v1",
    workspace_id: "workspace-1",
    session_id: "session-1",
    product_key: "blueprint_basic",
    product_mode: "basic_free",
    product_label: "Blueprint Basico",
    lifecycle,
    entitlement: {
      tier: "blueprint",
      access_state: "allowed",
      is_purchased: true,
      purchase_required: false,
      checkout_href: "",
      upgrade_label: "",
    },
    progress: {
      percent: lifecycle === "completed" ? 100 : 40,
      completed_units: lifecycle === "completed" ? 5 : 2,
      total_units: 5,
      blocked_units: 0,
      calculation: "weighted_units",
      label: lifecycle === "completed" ? "5 de 5 entregables listos" : "2 de 5 entregables listos",
    },
    current_activity: lifecycle === "running"
      ? {
          activity_key: "build",
          detail: "Generando entregables.",
          label: "Generando Blueprint",
          started_at: "2026-08-15T10:00:00Z",
          status: "running",
          step_key: "deliverables",
          updated_at: "2026-08-15T10:01:00Z",
        }
      : null,
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
}

describe("useProductBuildStatus", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("loads product build status without touching SSR-only state", async () => {
    const api = {
      getProductBuildStatus: vi.fn(async () => createStatus("completed")),
      listProductBuildStatuses: vi.fn(),
    };

    const { result } = renderHook(() => useProductBuildStatus("session-1", "blueprint_basic", { api }));

    await waitFor(() => expect(result.current.status).toBe("success"));

    expect(api.getProductBuildStatus).toHaveBeenCalledWith(
      "session-1",
      "blueprint_basic",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(result.current.isFinal).toBe(true);
    expect(result.current.data?.progress.percent).toBe(100);
  });

  it("exposes stale while refreshing existing data", async () => {
    let resolveSecond!: (status: ProductBuildStatus) => void;
    const api = {
      getProductBuildStatus: vi
        .fn()
        .mockResolvedValueOnce(createStatus("running"))
        .mockReturnValueOnce(new Promise<ProductBuildStatus>((resolve) => {
          resolveSecond = resolve;
        })),
      listProductBuildStatuses: vi.fn(),
    };

    const { result } = renderHook(() =>
      useProductBuildStatus("session-1", "blueprint_basic", {
        api,
        polling: false,
      }),
    );

    await waitFor(() => expect(result.current.status).toBe("success"));

    let refreshPromise!: Promise<ProductBuildStatus | null>;
    act(() => {
      refreshPromise = result.current.refresh();
    });

    await waitFor(() => expect(result.current.status).toBe("stale"));

    await act(async () => {
      resolveSecond(createStatus("completed"));
      await refreshPromise;
    });

    expect(result.current.status).toBe("success");
    expect(result.current.data?.lifecycle).toBe("completed");
  });

  it("polls active builds and stops when the lifecycle is final", async () => {
    const api = {
      getProductBuildStatus: vi
        .fn()
        .mockResolvedValueOnce(createStatus("running"))
        .mockResolvedValueOnce(createStatus("completed")),
      listProductBuildStatuses: vi.fn(),
    };

    const { result } = renderHook(() =>
      useProductBuildStatus("session-1", "blueprint_basic", {
        api,
        pollIntervalMs: 50,
      }),
    );

    await waitFor(() => expect(result.current.data?.lifecycle).toBe("running"));

    await waitFor(() => expect(result.current.data?.lifecycle).toBe("completed"));

    await act(async () => {
      await new Promise((resolve) => globalThis.setTimeout(resolve, 70));
    });

    expect(api.getProductBuildStatus).toHaveBeenCalledTimes(2);
  });

  it("classifies only active lifecycles as polling candidates", () => {
    expect(shouldPollProductBuildStatus(createStatus("queued"))).toBe(true);
    expect(shouldPollProductBuildStatus(createStatus("preparing"))).toBe(true);
    expect(shouldPollProductBuildStatus(createStatus("running"))).toBe(true);
    expect(shouldPollProductBuildStatus(createStatus("completed"))).toBe(false);
    expect(shouldPollProductBuildStatus(createStatus("requires_attention"))).toBe(false);
    expect(shouldPollProductBuildStatus(createStatus("error"))).toBe(false);
  });
});
