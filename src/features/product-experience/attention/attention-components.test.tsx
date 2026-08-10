import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { AttentionItemV2 } from "@/features/attention/attention-contracts";
import {
  AttentionContextRail,
  AttentionItemCard,
  type ResolveAttentionItemHandler,
} from "@/features/product-experience/attention/attention-components";
import type { ProductExperienceRouteSnapshot } from "@/features/product-experience/core/server-state";

function createItem(overrides: Partial<AttentionItemV2> = {}): AttentionItemV2 {
  return {
    affected_artifact_refs: [],
    action: {
      can_resolve_inline: true,
      href: "/projects/session-1/design",
      kind: "answer",
      label: "Resolver pregunta",
      return_href: "/projects/session-1/design",
    },
    blocking: true,
    consequence_if_unresolved: "La etapa queda bloqueada.",
    detected_at: "2026-08-03T10:00:00Z",
    impact: "Se requiere una decision humana para continuar.",
    key: "attention-question",
    options: [{ description: "Supervisor con RAG", key: "supervisor", label: "Supervisor + RAG" }],
    owner_role: "owner",
    owner_user_id: "user-1",
    product: "blueprint",
    reason: "Hay dos patrones compatibles y se necesita elegir uno.",
    severity: "blocking",
    source: "design",
    source_ref: {},
    stage: "design",
    status: "open",
    suggested_answer: "Supervisor + RAG",
    title: "Elegir patron de orquestacion",
    type: "question",
    updated_at: "2026-08-03T10:05:00Z",
    ...overrides,
  };
}

function resource<T>(data: T) {
  return {
    data,
    error: null,
    requestKey: "test",
    status: "ready" as const,
    updatedAt: Date.now(),
    version: "v1",
  };
}

function createRoute(items: AttentionItemV2[]): ProductExperienceRouteSnapshot {
  return {
    attention: resource({
      actionable_count: items.length,
      blocking_count: items.filter((item) => item.blocking).length,
      contract_version: "attention.v2" as const,
      counts_by_product: {},
      counts_by_stage: {},
      counts_by_type: {},
      current_stage: "design",
      cursor: "",
      generated_at: "2026-08-03T10:10:00Z",
      info_count: 0,
      items,
      primary_item: items[0] ?? null,
      session_id: "session-1",
      total_count: items.length,
      warning_count: 0,
      workspace_id: "workspace-1",
    }),
    auth: resource(null as never),
    list: resource(null as never),
    operation: resource(null as never),
    requestId: 1,
    route: {
      currentStage: "design",
      sessionId: "session-1",
    },
    snapshot: resource(null as never),
  };
}

describe("attention components UXA6", () => {
  it("resolves inline items through the provided handler", async () => {
    let receivedCall: Parameters<ResolveAttentionItemHandler> | null = null;
    const onResolveItem: ResolveAttentionItemHandler = async (...args) => {
      receivedCall = args;
      return undefined;
    };
    render(<AttentionItemCard item={createItem()} onResolveItem={onResolveItem} />);

    fireEvent.click(screen.getByRole("button", { name: "Resolver pregunta" }));

    await waitFor(() => expect(receivedCall).not.toBeNull());
    expect(receivedCall?.[0]).toBe("attention-question");
    expect(receivedCall?.[1]).toMatchObject({
      action_kind: "answer",
      answer_text: "Supervisor + RAG",
    });
  });

  it("sends the selected guided option when the user chooses an answer option", async () => {
    let receivedCall: Parameters<ResolveAttentionItemHandler> | null = null;
    const onResolveItem: ResolveAttentionItemHandler = async (...args) => {
      receivedCall = args;
      return undefined;
    };
    render(<AttentionItemCard item={createItem()} onResolveItem={onResolveItem} />);

    fireEvent.click(screen.getByRole("button", { name: /Supervisor \+ RAG/i }));
    fireEvent.click(screen.getByRole("button", { name: "Resolver pregunta" }));

    await waitFor(() => expect(receivedCall).not.toBeNull());
    expect(receivedCall?.[1]).toMatchObject({
      action_kind: "answer",
      answer_text: "Supervisor + RAG",
      selected_option_key: "supervisor",
      was_suggested_answer_used: true,
    });
  });

  it("shows an operational empty state that is not an upsell", () => {
    render(
      <AttentionContextRail
        activeRoute={createRoute([])}
        currentStage="design"
        onOpen={vi.fn()}
        onResolveItem={vi.fn()}
      />,
    );

    expect(screen.getByText("Sin acciones pendientes")).toBeInTheDocument();
    expect(screen.getByText(/No hay bloqueo ni venta cruzada/i)).toBeInTheDocument();
  });
});
