import type { AttentionItemV2 } from "@/features/attention/attention-contracts";
import type { TranslationKey } from "@/core/i18n/locales/es";
import type { ProductExperienceRouteSnapshot } from "@/features/product-experience/core/server-state";
import type { ActivityTimelineEntry } from "@/features/sessions/types";

export type ProductOperationStatus = "queued" | "running" | "waiting" | "completed" | "failed" | "cancelled";
export type ProductOperationStepStatus = "pending" | "active" | "completed" | "failed" | "waiting";
export type ProductOperationSource = "local" | "activity" | "attention";

export type ProductOperationStep = {
  detail?: string;
  detailKey?: TranslationKey;
  key: string;
  label: string;
  labelKey?: TranslationKey;
  status: ProductOperationStepStatus;
};

export type ProductOperationEnvelope = {
  action?: string;
  actionHint: string;
  actionHintKey?: TranslationKey;
  attentionHref?: string;
  attentionLabel?: string;
  canCancel: boolean;
  canRetry: boolean;
  cancelHref?: string;
  currentStep: string;
  currentStepKey?: TranslationKey;
  detail: string;
  detailKey?: TranslationKey;
  id: string;
  lastUpdatedAt?: string | null;
  nextStep: string;
  nextStepKey?: TranslationKey;
  retryHref?: string;
  sessionId: string;
  source: ProductOperationSource;
  stage: string;
  status: ProductOperationStatus;
  steps: ProductOperationStep[];
  title: string;
  titleKey?: TranslationKey;
};

export type ProductOperationActionSnapshot = {
  action?: string;
  message?: string;
  operation?: ProductOperationEnvelope;
  status?: string;
};

const ACTIVE_ACTIVITY_TYPES = new Set(["execution", "workflow", "export"]);
const WAITING_ATTENTION_TYPES = new Set(["hitl", "runtime_error"]);

function toStringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function metadataString(metadata: Record<string, unknown> | undefined, ...keys: string[]) {
  if (!metadata) {
    return "";
  }

  for (const key of keys) {
    const value = toStringValue(metadata[key]);
    if (value) {
      return value;
    }
  }

  return "";
}

export function normalizeOperationStatus(value: string | null | undefined): ProductOperationStatus {
  const status = (value ?? "").trim().toLowerCase().replaceAll("-", "_");

  if (["queued", "pending", "scheduled", "preparing"].includes(status)) {
    return "queued";
  }
  if (["running", "submitting", "processing", "in_progress", "indexing", "executing"].includes(status)) {
    return "running";
  }
  if (["waiting", "waiting_user", "waiting_for_user", "blocked", "needs_review", "paused"].includes(status)) {
    return "waiting";
  }
  if (["failed", "fail", "error", "errored", "timeout", "retry_available"].includes(status)) {
    return "failed";
  }
  if (["cancel", "canceled", "cancelled"].includes(status)) {
    return "cancelled";
  }

  return "completed";
}

function statusTone(status: ProductOperationStatus) {
  if (status === "failed" || status === "cancelled") {
    return "failed";
  }
  if (status === "waiting") {
    return "waiting";
  }
  if (status === "completed") {
    return "completed";
  }
  return "active";
}

function stepsForStatus(status: ProductOperationStatus, detail: string): ProductOperationStep[] {
  const tone = statusTone(status);

  return [
    {
      detail: "Payload y contexto preparados para backend.",
      detailKey: "operation.synthetic.detail.received",
      key: "queued",
      label: "Solicitud recibida",
      labelKey: "operation.synthetic.step.received",
      status: status === "queued" ? "active" : "completed",
    },
    {
      detail,
      key: "processing",
      label: "Procesamiento backend/LLM",
      labelKey: "operation.synthetic.step.processing",
      status:
        tone === "failed"
          ? "failed"
          : tone === "waiting"
            ? "waiting"
            : tone === "completed"
              ? "completed"
              : "active",
    },
    {
      detail: "Snapshot, artefactos y Segmento de Atencion se refrescan al terminar.",
      detailKey: "operation.synthetic.detail.sync",
      key: "sync",
      label: "Sincronizacion de resultado",
      labelKey: "operation.synthetic.step.sync",
      status: tone === "completed" ? "completed" : "pending",
    },
  ];
}

function currentStepFor(status: ProductOperationStatus) {
  if (status === "queued") {
    return "Solicitud recibida";
  }
  if (status === "waiting") {
    return "Esperando intervencion del usuario";
  }
  if (status === "failed") {
    return "Fallo recuperable o error tecnico";
  }
  if (status === "cancelled") {
    return "Operacion cancelada";
  }
  if (status === "completed") {
    return "Resultado sincronizado";
  }
  return "Procesando en backend";
}

function currentStepKeyFor(status: ProductOperationStatus): TranslationKey {
  if (status === "queued") {
    return "operation.synthetic.current.queued";
  }
  if (status === "waiting") {
    return "operation.synthetic.current.waiting";
  }
  if (status === "failed") {
    return "operation.synthetic.current.failed";
  }
  if (status === "cancelled") {
    return "operation.synthetic.current.cancelled";
  }
  if (status === "completed") {
    return "operation.synthetic.current.completed";
  }
  return "operation.synthetic.current.running";
}

function nextStepFor(status: ProductOperationStatus) {
  if (status === "queued") {
    return "Iniciar procesamiento backend.";
  }
  if (status === "running") {
    return "Sincronizar snapshot y revisar si Atencion requiere accion.";
  }
  if (status === "waiting") {
    return "Resolver el item bloqueante en el Segmento de Atencion.";
  }
  if (status === "failed") {
    return "Reintentar si el backend lo permite o revisar Atencion.";
  }
  if (status === "cancelled") {
    return "Reanudar manualmente desde la accion principal.";
  }
  return "Continuar con la siguiente etapa cuando aplique.";
}

function nextStepKeyFor(status: ProductOperationStatus): TranslationKey {
  if (status === "queued") {
    return "operation.synthetic.next.queued";
  }
  if (status === "running") {
    return "operation.synthetic.next.running";
  }
  if (status === "waiting") {
    return "operation.synthetic.next.waiting";
  }
  if (status === "failed") {
    return "operation.synthetic.next.failed";
  }
  if (status === "cancelled") {
    return "operation.synthetic.next.cancelled";
  }
  return "operation.synthetic.next.completed";
}

export function createMutationOperationEnvelope({
  action,
  message,
  sessionId,
  stage,
}: {
  action: string;
  message: string;
  sessionId: string;
  stage: string;
}): ProductOperationEnvelope {
  const now = new Date().toISOString();

  return {
    action,
    actionHint: "Puedes seguir navegando; evita lanzar otra accion hasta que esta termine.",
    actionHintKey: "operation.synthetic.hint.running",
    canCancel: false,
    canRetry: false,
    currentStep: currentStepFor("running"),
    currentStepKey: currentStepKeyFor("running"),
    detail: message,
    id: `${sessionId}:${stage}:${action}`,
    lastUpdatedAt: now,
    nextStep: nextStepFor("running"),
    nextStepKey: nextStepKeyFor("running"),
    sessionId,
    source: "local",
    stage,
    status: "running",
    steps: stepsForStatus("running", message),
    title: labelForAction(action),
    titleKey: titleKeyForAction(action),
  };
}

export function completeMutationOperationEnvelope(
  operation: ProductOperationEnvelope | undefined,
  message = "Resultado sincronizado con backend.",
): ProductOperationEnvelope | undefined {
  if (!operation) {
    return undefined;
  }

  return {
    ...operation,
    actionHint: "La operacion finalizo; revisa la propuesta o continua con la siguiente etapa.",
    actionHintKey: "operation.synthetic.hint.completed",
    canCancel: false,
    canRetry: false,
    currentStep: currentStepFor("completed"),
    currentStepKey: currentStepKeyFor("completed"),
    detail: message,
    lastUpdatedAt: new Date().toISOString(),
    nextStep: nextStepFor("completed"),
    nextStepKey: nextStepKeyFor("completed"),
    status: "completed",
    steps: stepsForStatus("completed", message),
  };
}

export function failMutationOperationEnvelope(
  operation: ProductOperationEnvelope | undefined,
  error: unknown,
): ProductOperationEnvelope | undefined {
  if (!operation) {
    return undefined;
  }

  const rawMessage = error instanceof Error ? error.message : "No se pudo completar la operacion.";
  const isTimeout = /timeout|timed out|abort|cancel/i.test(rawMessage);
  const detail = isTimeout
    ? `La operacion no confirmo cierre dentro del umbral operativo. Detalle: ${rawMessage}`
    : rawMessage;

  return {
    ...operation,
    actionHint: isTimeout
      ? "Recarga para verificar si backend termino en segundo plano; si sigue fallando, reintenta desde la accion principal."
      : "Revisa el Segmento de Atencion o reintenta desde la accion principal si el error es recuperable.",
    actionHintKey: isTimeout ? "operation.synthetic.hint.timeout" : "operation.synthetic.hint.failed",
    canCancel: false,
    canRetry: false,
    currentStep: currentStepFor("failed"),
    currentStepKey: currentStepKeyFor("failed"),
    detail,
    lastUpdatedAt: new Date().toISOString(),
    nextStep: nextStepFor("failed"),
    nextStepKey: nextStepKeyFor("failed"),
    status: "failed",
    steps: stepsForStatus("failed", detail),
  };
}

function labelForAction(action: string) {
  const labels: Record<string, string> = {
    analyze: "Analisis LLM de Discovery",
    approve: "Aprobacion de artefacto",
    approve_memory_profile: "Aprobacion de Memoria",
    approve_tools_selection: "Promocion de Herramientas",
    build_canvas: "Construccion de Canvas",
    define_requirements: "Generacion de Definir",
    normalize: "Normalizacion de Discovery",
    propose_design: "Generacion de Diseno",
    recommend_memory: "Recomendacion de Memoria",
    recommend_tools: "Recomendacion de Herramientas",
    reject: "Rechazo de propuesta",
    review: "Revision de artefacto",
  };

  return labels[action] ?? action.replaceAll("_", " ");
}

function titleKeyForAction(action: string): TranslationKey {
  const keys: Record<string, TranslationKey> = {
    analyze: "operation.synthetic.title.analyze",
    approve: "operation.synthetic.title.approve",
    approve_memory_profile: "operation.synthetic.title.approveMemory",
    approve_tools_selection: "operation.synthetic.title.approveTools",
    build_canvas: "operation.synthetic.title.buildCanvas",
    define_requirements: "operation.synthetic.title.defineRequirements",
    normalize: "operation.synthetic.title.normalize",
    propose_design: "operation.synthetic.title.proposeDesign",
    recommend_memory: "operation.synthetic.title.recommendMemory",
    recommend_tools: "operation.synthetic.title.recommendTools",
    reject: "operation.synthetic.title.reject",
    review: "operation.synthetic.title.review",
  };

  return keys[action] ?? "operation.synthetic.title.generic";
}

function operationFromAttention(activeRoute: ProductExperienceRouteSnapshot | null): ProductOperationEnvelope | null {
  const attention = activeRoute?.attention.data ?? null;
  const sessionId = activeRoute?.route.sessionId ?? attention?.session_id ?? "";
  const item =
    attention?.primary_item && WAITING_ATTENTION_TYPES.has(attention.primary_item.type)
      ? attention.primary_item
      : attention?.items.find((candidate) => (
          candidate.status !== "resolved" &&
          candidate.source === "runtime_operation" &&
          WAITING_ATTENTION_TYPES.has(candidate.type)
        ));

  if (!item) {
    return null;
  }

  return operationFromAttentionItem(item, sessionId);
}

function operationFromAttentionItem(item: AttentionItemV2, sessionId: string): ProductOperationEnvelope {
  const status: ProductOperationStatus = item.type === "runtime_error" ? "failed" : "waiting";
  const detail = item.reason || item.impact || "La operacion requiere intervencion humana.";

  return {
    action: item.action.kind,
    actionHint: item.consequence_if_unresolved || nextStepFor(status),
    actionHintKey: item.consequence_if_unresolved ? undefined : nextStepKeyFor(status),
    attentionHref: item.action.href,
    attentionLabel: item.action.label,
    canCancel: false,
    canRetry: item.action.kind === "retry",
    currentStep: currentStepFor(status),
    currentStepKey: currentStepKeyFor(status),
    detail,
    id: `attention:${item.key}`,
    lastUpdatedAt: item.updated_at ?? item.detected_at ?? null,
    nextStep: nextStepFor(status),
    nextStepKey: nextStepKeyFor(status),
    retryHref: item.action.kind === "retry" ? item.action.href : undefined,
    sessionId,
    source: "attention",
    stage: item.stage,
    status,
    steps: stepsForStatus(status, detail),
    title: item.title,
  };
}

function operationFromActivity(activeRoute: ProductExperienceRouteSnapshot | null): ProductOperationEnvelope | null {
  const activity = activeRoute?.operation.data?.activity ?? null;
  const sessionId = activeRoute?.route.sessionId ?? activity?.session_id ?? "";
  const item = activity?.timeline.find((entry) => ACTIVE_ACTIVITY_TYPES.has(entry.type) || Boolean(metadataString(entry.metadata, "operation_id", "operationId")));

  if (!item) {
    return null;
  }

  return operationFromActivityItem(item, sessionId, activeRoute?.route.currentStage ?? "");
}

function operationFromActivityItem(
  item: ActivityTimelineEntry,
  sessionId: string,
  fallbackStage: string,
): ProductOperationEnvelope {
  const status = normalizeOperationStatus(item.status);
  const detail = metadataString(item.metadata, "message", "detail", "error_message", "summary") || item.title;
  const stage = metadataString(item.metadata, "stage", "current_stage", "operation_stage") || fallbackStage || item.product_key;
  const retryHref = metadataString(item.metadata, "retry_href", "retryHref");
  const cancelHref = metadataString(item.metadata, "cancel_href", "cancelHref");

  return {
    action: metadataString(item.metadata, "action", "operation_action") || item.type,
    actionHint: metadataString(item.metadata, "next_action", "action_hint") || nextStepFor(status),
    actionHintKey: metadataString(item.metadata, "next_action", "action_hint") ? undefined : nextStepKeyFor(status),
    canCancel: Boolean(cancelHref),
    canRetry: Boolean(retryHref),
    cancelHref: cancelHref || undefined,
    currentStep: currentStepFor(status),
    currentStepKey: currentStepKeyFor(status),
    detail,
    id: `activity:${item.key}`,
    lastUpdatedAt: item.created_at,
    nextStep: metadataString(item.metadata, "next_step") || nextStepFor(status),
    nextStepKey: metadataString(item.metadata, "next_step") ? undefined : nextStepKeyFor(status),
    retryHref: retryHref || undefined,
    sessionId,
    source: "activity",
    stage,
    status,
    steps: stepsForStatus(status, detail),
    title: item.title || labelForAction(metadataString(item.metadata, "action")),
    titleKey: item.title ? undefined : titleKeyForAction(metadataString(item.metadata, "action")),
  };
}

export function buildProductOperationEnvelope({
  actionState,
  activeRoute,
}: {
  actionState?: ProductOperationActionSnapshot | null;
  activeRoute: ProductExperienceRouteSnapshot | null;
}): ProductOperationEnvelope | null {
  if (actionState?.operation && actionState.status !== "idle") {
    return actionState.operation;
  }

  return operationFromAttention(activeRoute) ?? operationFromActivity(activeRoute);
}

export function isOperationActive(operation: ProductOperationEnvelope | null | undefined) {
  return operation?.status === "queued" || operation?.status === "running" || operation?.status === "waiting";
}
