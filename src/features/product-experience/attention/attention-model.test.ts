import type { AttentionItemV2, AttentionResponseV2 } from "@/features/attention/attention-contracts";
import {
  DEFAULT_ATTENTION_FILTERS,
  buildAttentionResolutionPayload,
  filterAttentionItems,
  getContextualAttentionItems,
  parseAttentionFilters,
  toAttentionFilterSearchParams,
} from "@/features/product-experience/attention/attention-model";

function createItem(overrides: Partial<AttentionItemV2> = {}): AttentionItemV2 {
  return {
    affected_artifact_refs: [],
    action: {
      can_resolve_inline: true,
      href: "/projects/session-1/design",
      kind: "answer",
      label: "Responder",
      return_href: "/projects/session-1/design",
    },
    blocking: false,
    consequence_if_unresolved: "No se puede continuar con trazabilidad completa.",
    detected_at: "2026-08-03T10:00:00Z",
    impact: "Falta informacion para cerrar la etapa.",
    key: "attention-1",
    options: [],
    owner_role: "owner",
    owner_user_id: "user-1",
    product: "blueprint",
    reason: "El LLM detecto una decision pendiente.",
    severity: "warning",
    source: "design",
    source_ref: {},
    stage: "design",
    status: "open",
    suggested_answer: "Usar patron supervisor.",
    title: "Confirmar patron agentivo",
    type: "question",
    updated_at: "2026-08-03T10:05:00Z",
    ...overrides,
  };
}

function createAttention(items: AttentionItemV2[]): AttentionResponseV2 {
  return {
    actionable_count: items.length,
    blocking_count: items.filter((item) => item.blocking).length,
    contract_version: "attention.v2",
    counts_by_product: {},
    counts_by_stage: {},
    counts_by_type: {},
    current_stage: "design",
    cursor: "",
    generated_at: "2026-08-03T10:10:00Z",
    info_count: items.filter((item) => item.severity === "info").length,
    items,
    primary_item: items.find((item) => item.blocking) ?? items[0] ?? null,
    session_id: "session-1",
    total_count: items.length,
    warning_count: items.filter((item) => item.severity === "warning").length,
    workspace_id: "workspace-1",
  };
}

describe("attention model UXA6", () => {
  it("parses and serializes filters through URL params for back/forward persistence", () => {
    const searchParams = new URLSearchParams("attention_stage=tools&attention_severity=blocking&foo=bar");
    const filters = parseAttentionFilters(searchParams);

    expect(filters.stage).toBe("tools");
    expect(filters.severity).toBe("blocking");

    const next = toAttentionFilterSearchParams(searchParams, {
      ...filters,
      severity: "all",
      type: "gap",
    });

    expect(next.get("attention_stage")).toBe("tools");
    expect(next.get("attention_type")).toBe("gap");
    expect(next.get("attention_severity")).toBeNull();
    expect(next.get("foo")).toBe("bar");
  });

  it("filters and prioritizes blocking contextual items without duplicating state", () => {
    const designQuestion = createItem({ key: "design-question" });
    const toolsBlocker = createItem({
      blocking: true,
      key: "tools-blocker",
      severity: "blocking",
      stage: "tools",
      type: "gap",
    });
    const attention = createAttention([designQuestion, toolsBlocker]);

    expect(filterAttentionItems(attention.items, { ...DEFAULT_ATTENTION_FILTERS, stage: "tools" })).toEqual([toolsBlocker]);
    expect(getContextualAttentionItems(attention, "design", 2).map((item) => item.key)).toEqual([
      "design-question",
      "tools-blocker",
    ]);
  });

  it("builds inline resolution payloads from the action descriptor", () => {
    const item = createItem({ source_ref: { artifact_version: 3 } });
    const payload = buildAttentionResolutionPayload(item, {
      answerText: "Aprobar supervisor + RAG.",
      selectedOptionKey: "supervisor",
      wasSuggestedAnswerUsed: false,
    });

    expect(payload.action_kind).toBe("answer");
    expect(payload.answer_text).toBe("Aprobar supervisor + RAG.");
    expect(payload.idempotency_key).toContain("attention-ui:attention-1:answer:");
    expect(payload.selected_option_key).toBe("supervisor");
    expect(payload.was_suggested_answer_used).toBe(false);
    expect(payload.source_artifact_version).toBe(3);
  });
});
