import type { AttentionItemV2 } from "@/features/attention/attention-contracts";
import {
  buildProductOperationEnvelope,
  createMutationOperationEnvelope,
  failMutationOperationEnvelope,
  normalizeOperationStatus,
} from "@/features/product-experience/operations/operation-model";
import { createToolsRouteFixture } from "@/features/product-experience/tools/tools-memory-test-fixtures";

function createRuntimeAttentionItem(overrides: Partial<AttentionItemV2> = {}): AttentionItemV2 {
  return {
    action: {
      can_resolve_inline: false,
      href: "/projects/session-uxa10/attention",
      kind: "navigate",
      label: "Resolver en Atencion",
      return_href: "/projects/session-uxa10/work/memory",
    },
    affected_artifact_refs: [],
    blocking: true,
    consequence_if_unresolved: "La operacion permanecera detenida.",
    detected_at: "2026-08-03T13:20:00Z",
    impact: "No se puede continuar hasta responder.",
    key: "runtime-waiting",
    options: [],
    owner_role: "operator",
    owner_user_id: "",
    product: "blueprint",
    reason: "El runtime necesita una decision humana.",
    severity: "blocking",
    source: "runtime_operation",
    source_ref: {
      entity_id: "operation-1",
      field_path: "state",
    },
    stage: "memory",
    status: "open",
    suggested_answer: "",
    title: "Operacion espera decision",
    type: "hitl",
    updated_at: "2026-08-03T13:22:00Z",
    ...overrides,
  };
}

describe("operation model UXA10", () => {
  it("normalizes runtime statuses into the UXA10 envelope vocabulary", () => {
    expect(normalizeOperationStatus("queued")).toBe("queued");
    expect(normalizeOperationStatus("processing")).toBe("running");
    expect(normalizeOperationStatus("waiting_for_user")).toBe("waiting");
    expect(normalizeOperationStatus("retry_available")).toBe("failed");
    expect(normalizeOperationStatus("canceled")).toBe("cancelled");
  });

  it("recovers an active operation from activity without inventing percentage or ETA", () => {
    const route = createToolsRouteFixture();
    const activeRoute = {
      ...route,
      operation: {
        ...route.operation,
        data: {
          ...route.operation.data!,
          activity: {
            contract_version: "activity.v1",
            funnel: [],
            generated_at: "2026-08-03T13:16:00Z",
            metrics: [],
            session_id: "session-uxa10",
            timeline: [
              {
                created_at: "2026-08-03T13:15:00Z",
                currency: "",
                key: "operation-1",
                metadata: {
                  cancel_href: "/api/cancel",
                  message: "Codex CLI esta generando recomendaciones.",
                  next_step: "Sincronizar artefacto.",
                  retry_href: "/api/retry",
                  stage: "tools",
                },
                product_key: "blueprint",
                revenue_cents: 0,
                source: "runtime",
                status: "running",
                title: "Recomendacion de herramientas",
                type: "execution" as const,
              },
            ],
            workspace_id: "workspace-1",
          },
        },
      },
    };

    const operation = buildProductOperationEnvelope({ activeRoute, actionState: null });

    expect(operation?.status).toBe("running");
    expect(operation?.canRetry).toBe(true);
    expect(operation?.canCancel).toBe(true);
    expect(operation?.steps.map((step) => step.status)).toEqual(["completed", "active", "pending"]);
    expect(JSON.stringify(operation)).not.toMatch(/\bETA\b|percent|%/i);
  });

  it("turns runtime Attention items into waiting operations", () => {
    const route = createToolsRouteFixture({ stage: "memory" });
    const item = createRuntimeAttentionItem();
    const activeRoute = {
      ...route,
      attention: {
        ...route.attention,
        data: route.attention.data
          ? {
              ...route.attention.data,
              blocking_count: 1,
              items: [item],
              primary_item: item,
              total_count: 1,
            }
          : route.attention.data,
      },
    };

    const operation = buildProductOperationEnvelope({ activeRoute, actionState: null });

    expect(operation?.source).toBe("attention");
    expect(operation?.status).toBe("waiting");
    expect(operation?.attentionHref).toBe("/projects/session-uxa10/attention");
  });

  it("surfaces timeout cause and recovery action on failed local operations", () => {
    const running = createMutationOperationEnvelope({
      action: "recommend_memory",
      message: "Generando Memoria con LLM.",
      sessionId: "session-uxa10",
      stage: "memory",
    });

    const failed = failMutationOperationEnvelope(running, new Error("timeout waiting for provider"));

    expect(failed?.status).toBe("failed");
    expect(failed?.detail).toContain("umbral operativo");
    expect(failed?.actionHint).toContain("Recarga");
    expect(failed?.steps.find((step) => step.key === "processing")?.status).toBe("failed");
  });
});
