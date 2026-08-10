import type {
  AttentionActionRequestV2,
  AttentionItemTypeV2,
  AttentionItemV2,
  AttentionProductV2,
  AttentionResponseV2,
  AttentionSeverityV2,
  AttentionStatusV2,
} from "@/features/attention/attention-contracts";

export type ProductAttentionFilters = {
  product: AttentionProductV2 | "all";
  severity: AttentionSeverityV2 | "all";
  stage: string;
  status: AttentionStatusV2 | "all";
  type: AttentionItemTypeV2 | "all";
};

export type ProductAttentionFilterKey = keyof ProductAttentionFilters;

export const ATTENTION_FILTER_QUERY_KEYS: Record<ProductAttentionFilterKey, string> = {
  product: "attention_product",
  severity: "attention_severity",
  stage: "attention_stage",
  status: "attention_status",
  type: "attention_type",
};

export const DEFAULT_ATTENTION_FILTERS: ProductAttentionFilters = {
  product: "all",
  severity: "all",
  stage: "all",
  status: "all",
  type: "all",
};

export const ATTENTION_PRODUCTS: AttentionProductV2[] = ["blueprint", "acp", "commercial"];
export const ATTENTION_SEVERITIES: AttentionSeverityV2[] = ["blocking", "warning", "info"];
export const ATTENTION_STATUSES: AttentionStatusV2[] = ["open", "in_progress", "deferred", "resolved", "dismissed", "superseded"];
export const ATTENTION_TYPES: AttentionItemTypeV2[] = [
  "question",
  "gap",
  "decision",
  "approval",
  "confirmation",
  "validation",
  "hitl",
  "inconsistency",
  "stale",
  "runtime_error",
  "access_request",
];

export const ATTENTION_LABELS = {
  product: {
    acp: "ACP",
    all: "Todos",
    blueprint: "Blueprint",
    commercial: "Comercial",
  },
  severity: {
    all: "Todas",
    blocking: "Bloqueante",
    info: "Info",
    warning: "Advertencia",
  },
  stage: {
    all: "Todas",
    define: "Definir",
    design: "Disenar",
    discover: "Descubrir",
    estimate: "Estimar",
    memory: "Memoria",
    package: "Package",
    tools: "Herramientas",
    validate: "Validar",
  } as Record<string, string>,
  status: {
    all: "Todos",
    deferred: "Diferido",
    dismissed: "Descartado",
    in_progress: "En progreso",
    open: "Abierto",
    resolved: "Resuelto",
    superseded: "Reemplazado",
  },
  type: {
    access_request: "Acceso",
    all: "Todos",
    approval: "Aprobacion",
    confirmation: "Confirmacion",
    decision: "Decision",
    gap: "Gap",
    hitl: "HITL",
    inconsistency: "Inconsistencia",
    question: "Pregunta",
    runtime_error: "Error tecnico",
    stale: "Desactualizado",
    validation: "Validacion",
  },
};

type AttentionSearchParamsLike = {
  get(name: string): string | null;
  toString(): string;
};

function parseEnum<T extends string>(value: string | null, allowed: readonly T[], fallback: T | "all") {
  if (!value || value === "all") {
    return fallback;
  }

  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function parseAttentionFilters(searchParams: AttentionSearchParamsLike): ProductAttentionFilters {
  const stage = searchParams.get(ATTENTION_FILTER_QUERY_KEYS.stage)?.trim() || DEFAULT_ATTENTION_FILTERS.stage;

  return {
    product: parseEnum(searchParams.get(ATTENTION_FILTER_QUERY_KEYS.product), ATTENTION_PRODUCTS, DEFAULT_ATTENTION_FILTERS.product),
    severity: parseEnum(searchParams.get(ATTENTION_FILTER_QUERY_KEYS.severity), ATTENTION_SEVERITIES, DEFAULT_ATTENTION_FILTERS.severity),
    stage,
    status: parseEnum(searchParams.get(ATTENTION_FILTER_QUERY_KEYS.status), ATTENTION_STATUSES, DEFAULT_ATTENTION_FILTERS.status),
    type: parseEnum(searchParams.get(ATTENTION_FILTER_QUERY_KEYS.type), ATTENTION_TYPES, DEFAULT_ATTENTION_FILTERS.type),
  };
}

export function toAttentionFilterSearchParams(
  currentSearchParams: Pick<AttentionSearchParamsLike, "toString">,
  filters: ProductAttentionFilters,
) {
  const next = new URLSearchParams(currentSearchParams.toString());

  for (const key of Object.keys(ATTENTION_FILTER_QUERY_KEYS) as ProductAttentionFilterKey[]) {
    const value = filters[key];
    const queryKey = ATTENTION_FILTER_QUERY_KEYS[key];

    if (!value || value === "all") {
      next.delete(queryKey);
    } else {
      next.set(queryKey, value);
    }
  }

  return next;
}

export function hasActiveAttentionFilters(filters: ProductAttentionFilters) {
  return Object.entries(filters).some(([, value]) => value !== "all");
}

function severityRank(severity: AttentionSeverityV2) {
  if (severity === "blocking") {
    return 0;
  }
  if (severity === "warning") {
    return 1;
  }
  return 2;
}

function matchesFilter(filter: string, value: string) {
  return filter === "all" || filter === value;
}

export function filterAttentionItems(items: AttentionItemV2[], filters: ProductAttentionFilters) {
  return items
    .filter((item) => (
      matchesFilter(filters.stage, item.stage) &&
      matchesFilter(filters.severity, item.severity) &&
      matchesFilter(filters.type, item.type) &&
      matchesFilter(filters.product, item.product) &&
      matchesFilter(filters.status, item.status)
    ))
    .sort((left, right) => {
      if (left.blocking !== right.blocking) {
        return left.blocking ? -1 : 1;
      }

      const severityDelta = severityRank(left.severity) - severityRank(right.severity);
      if (severityDelta !== 0) {
        return severityDelta;
      }

      return (right.updated_at ?? right.detected_at ?? "").localeCompare(left.updated_at ?? left.detected_at ?? "");
    });
}

export function getAttentionStageLabel(stage: string) {
  return ATTENTION_LABELS.stage[stage] ?? stage.replaceAll("_", " ");
}

export function getAttentionItemTone(item: Pick<AttentionItemV2, "blocking" | "severity">) {
  if (item.blocking || item.severity === "blocking") {
    return "danger" as const;
  }
  if (item.severity === "warning") {
    return "warning" as const;
  }
  return "info" as const;
}

export function getContextualAttentionItems(
  attention: AttentionResponseV2 | null,
  currentStage: string,
  limit = 3,
) {
  if (!attention) {
    return [];
  }

  const stageItems = filterAttentionItems(attention.items, {
    ...DEFAULT_ATTENTION_FILTERS,
    stage: currentStage,
  });
  const fallbackItems = filterAttentionItems(attention.items, DEFAULT_ATTENTION_FILTERS);
  const combined = [...stageItems];

  for (const item of fallbackItems) {
    if (!combined.some((existing) => existing.key === item.key)) {
      combined.push(item);
    }
  }

  return combined.slice(0, limit);
}

export function getAttentionFilterOptions(attention: AttentionResponseV2 | null, currentStage: string) {
  const stages = new Set<string>([currentStage]);

  attention?.items.forEach((item) => {
    if (item.stage) {
      stages.add(item.stage);
    }
  });

  return {
    products: ATTENTION_PRODUCTS,
    severities: ATTENTION_SEVERITIES,
    stages: Array.from(stages).filter(Boolean),
    statuses: ATTENTION_STATUSES,
    types: ATTENTION_TYPES,
  };
}

export function buildAttentionResolutionPayload(
  item: AttentionItemV2,
  options: {
    answerText?: string;
    resolutionNote?: string;
    selectedOptionKey?: string;
    wasSuggestedAnswerUsed?: boolean;
  } = {},
): AttentionActionRequestV2 {
  const actionKind = item.action.kind === "navigate" ? "answer" : item.action.kind;
  const trimmedAnswer = options.answerText?.trim() || item.suggested_answer?.trim();
  const trimmedNote = options.resolutionNote?.trim();

  return {
    action_kind: actionKind,
    answer_text: actionKind === "answer" ? trimmedAnswer || "Resuelto desde el Segmento de Atencion." : undefined,
    decision: actionKind === "approve" ? "approved" : actionKind === "reject" ? "rejected" : undefined,
    idempotency_key: createAttentionIdempotencyKey(item.key, actionKind),
    resolution_note: trimmedNote || `Accion '${item.action.label}' aplicada desde el Segmento de Atencion.`,
    selected_option_key: options.selectedOptionKey,
    source_artifact_version: item.source_ref.artifact_version ?? null,
    was_suggested_answer_used: options.wasSuggestedAnswerUsed ?? Boolean(item.suggested_answer && trimmedAnswer === item.suggested_answer.trim()),
  };
}

export function createAttentionIdempotencyKey(itemKey: string, actionKind: string) {
  const random =
    typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `attention-ui:${itemKey}:${actionKind}:${random}`;
}
