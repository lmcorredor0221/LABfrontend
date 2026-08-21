import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { LanguageProvider } from "@/core/i18n/language-context";
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

function renderWithLanguage(ui: ReactElement) {
  return render(<LanguageProvider>{ui}</LanguageProvider>);
}

describe("attention components UXA6", () => {
  it("resolves inline items through the provided handler", async () => {
    let receivedCall: Parameters<ResolveAttentionItemHandler> | null = null;
    const onResolveItem: ResolveAttentionItemHandler = async (...args) => {
      receivedCall = args;
      return undefined;
    };
    renderWithLanguage(<AttentionItemCard item={createItem()} onResolveItem={onResolveItem} />);

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
    renderWithLanguage(<AttentionItemCard item={createItem()} onResolveItem={onResolveItem} />);

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

  it("shows actionable runtime diagnostics without asking for a business answer", async () => {
    let receivedCall: Parameters<ResolveAttentionItemHandler> | null = null;
    const onResolveItem: ResolveAttentionItemHandler = async (...args) => {
      receivedCall = args;
      return undefined;
    };
    renderWithLanguage(
      <AttentionItemCard
        item={createItem({
          action: {
            can_resolve_inline: true,
            href: "/projects/session-1/define",
            kind: "retry",
            label: "Reintentar recuperacion",
            return_href: "/projects/session-1/define",
          },
          diagnostics: {
            capability: "define_requirements",
            capability_label: "generar Definir",
            error_kind: "provider_or_schema",
            operation_id: "run-1",
            repair_hint: "Validar proveedor/modelo activo y reintentar.",
            retry_policy: "Reintentar con el mismo contexto aprobado.",
            summary: "generar Definir fallo porque el proveedor o el esquema no entrego una salida valida.",
            technical_message: "Codex local no pudo ejecutar define_requirements; policy=needs_review_on_provider_or_schema_failure.",
            trace_refs: ["runtime.operation:run-1", "runtime.capability:define_requirements"],
          },
          impact: "La etapa no deberia avanzar hasta recuperar o aceptar una salida trazable.",
          options: [],
          reason: "El proveedor LLM o el esquema de respuesta no entrego una salida valida para la etapa.",
          source: "runtime_operation",
          source_ref: { artifact_id: "operation", entity_id: "run-1", field_path: "runtime_issue" },
          stage: "define",
          suggested_answer: "Reintentar generacion con el mismo contexto aprobado.",
          title: "No se pudo generar Definir automaticamente",
          type: "runtime_error",
        })}
        onResolveItem={onResolveItem}
      />,
    );

    expect(screen.getByText("Que paso")).toBeInTheDocument();
    expect(screen.getByText("Mensaje tecnico saneado")).toBeInTheDocument();
    expect(screen.getByText(/needs_review_on_provider_or_schema_failure/i)).toBeInTheDocument();
    expect(screen.queryByLabelText("Respuesta o criterio de cierre")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reintentar recuperacion" }));

    await waitFor(() => expect(receivedCall).not.toBeNull());
    expect(receivedCall?.[1]).toMatchObject({
      action_kind: "retry",
      answer_text: undefined,
    });
  });

  it("shows an operational empty state that is not an upsell", () => {
    renderWithLanguage(
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
