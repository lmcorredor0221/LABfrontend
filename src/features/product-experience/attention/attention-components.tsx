"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  CheckCircle2,
  Filter,
  Inbox,
  PanelRightOpen,
} from "lucide-react";
import { useLanguage } from "@/core/i18n/language-context";
import {
  UxaBadge,
  UxaButton,
  UxaDrawerHeader,
  UxaEmptyState,
  UxaMetricCard,
  UxaProductHero,
  UxaSurface,
  UxaTextareaField,
  type UxaTone,
} from "@/features/product-experience/design-system";
import type {
  AttentionActionRequestV2,
  AttentionActionResultV2,
  AttentionItemV2,
  AttentionResponseV2,
} from "@/features/attention/attention-contracts";
import type { ProductExperienceRouteSnapshot } from "@/features/product-experience/core/server-state";
import type { ProductAttentionActionState } from "@/features/product-experience/shell/use-product-experience-route";
import {
  DEFAULT_ATTENTION_FILTERS,
  buildAttentionResolutionPayload,
  categorizeAttentionItems,
  filterAttentionItems,
  getAttentionFilterOptions,
  getAttentionItemTone,
  getContextualAttentionItems,
  hasActiveAttentionFilters,
  parseAttentionFilters,
  toAttentionFilterSearchParams,
  type ProductAttentionFilterKey,
  type ProductAttentionFilters,
} from "@/features/product-experience/attention/attention-model";
import { cn } from "@/lib/utils";

export type ResolveAttentionItemHandler = (
  itemKey: string,
  payload: AttentionActionRequestV2,
) => Promise<AttentionActionResultV2 | void>;

type AttentionActionControlsProps = {
  actionState?: ProductAttentionActionState;
  compact?: boolean;
  item: AttentionItemV2;
  onResolveItem?: ResolveAttentionItemHandler;
};

function attentionCounts(attention: AttentionResponseV2 | null) {
  return {
    blocking: attention?.blocking_count ?? 0,
    total: attention?.total_count ?? 0,
    warning: attention?.warning_count ?? 0,
  };
}

type AttentionTranslate = ReturnType<typeof useLanguage>["t"];

function getAttentionSeverityLabel(t: AttentionTranslate, value: string) {
  switch (value) {
    case "blocking":
      return t("attention.severity.blocking", "Blocking");
    case "warning":
      return t("attention.severity.warning", "Warning");
    case "info":
      return t("attention.severity.info", "Info");
    default:
      return t("attention.severity.all", "All");
  }
}

function getAttentionTypeLabel(t: AttentionTranslate, value: string) {
  switch (value) {
    case "question":
      return t("attention.type.question", "Question");
    case "gap":
      return t("attention.type.gap", "Gap");
    case "decision":
      return t("attention.type.decision", "Decision");
    case "approval":
      return t("attention.type.approval", "Approval");
    case "confirmation":
      return t("attention.type.confirmation", "Confirmation");
    case "validation":
      return t("attention.type.validation", "Validation");
    case "hitl":
      return t("attention.type.hitl", "HITL");
    case "inconsistency":
      return t("attention.type.inconsistency", "Inconsistency");
    case "stale":
      return t("attention.type.stale", "Stale");
    case "runtime_error":
      return t("attention.type.runtimeError", "Technical error");
    case "access_request":
      return t("attention.type.accessRequest", "Access");
    default:
      return t("attention.type.all", "All");
  }
}

function getAttentionProductLabel(t: AttentionTranslate, value: string) {
  switch (value) {
    case "blueprint":
      return t("attention.product.blueprint", "Blueprint");
    case "acp":
      return t("attention.product.acp", "ACP");
    case "commercial":
      return t("attention.product.commercial", "Commercial");
    default:
      return t("attention.product.all", "All");
  }
}

function getAttentionStatusLabel(t: AttentionTranslate, value: string) {
  switch (value) {
    case "open":
      return t("attention.status.open", "Open");
    case "in_progress":
      return t("attention.status.inProgress", "In progress");
    case "deferred":
      return t("attention.status.deferred", "Deferred");
    case "resolved":
      return t("attention.status.resolved", "Resolved");
    case "dismissed":
      return t("attention.status.dismissed", "Dismissed");
    case "superseded":
      return t("attention.status.superseded", "Superseded");
    default:
      return t("attention.status.all", "All");
  }
}

function getLocalizedAttentionStageLabel(t: AttentionTranslate, stage: string) {
  switch (stage) {
    case "discover":
      return t("attention.stage.discover", "Discover");
    case "define":
      return t("attention.stage.define", "Define");
    case "design":
      return t("attention.stage.design", "Design");
    case "tools":
      return t("attention.stage.tools", "Tools");
    case "memory":
      return t("attention.stage.memory", "Memory");
    case "estimate":
      return t("attention.stage.estimate", "Estimate");
    case "validate":
      return t("attention.stage.validate", "Validate");
    case "package":
      return t("attention.stage.package", "Package");
    default:
      return t("attention.stage.all", "All");
  }
}

function useAttentionUrlFilters() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters = useMemo(() => parseAttentionFilters(searchParams), [searchParams]);

  function updateFilter(key: ProductAttentionFilterKey, value: string) {
    const nextFilters = {
      ...filters,
      [key]: value || "all",
    } as ProductAttentionFilters;
    const nextSearchParams = toAttentionFilterSearchParams(searchParams, nextFilters);
    const query = nextSearchParams.toString();

    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function clearFilters() {
    const nextSearchParams = toAttentionFilterSearchParams(searchParams, DEFAULT_ATTENTION_FILTERS);
    const query = nextSearchParams.toString();

    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return {
    clearFilters,
    filters,
    updateFilter,
  };
}

function AttentionMetric({
  label,
  tone,
  value,
}: {
  label: string;
  tone: UxaTone;
  value: number;
}) {
  return <UxaMetricCard label={<UxaBadge tone={tone}>{label}</UxaBadge>} value={value} />;
}

export const AttentionGlobalBadge = forwardRef<HTMLButtonElement, {
  attention: AttentionResponseV2 | null;
  onOpen: (source: HTMLElement) => void;
}>(function AttentionGlobalBadge({ attention, onOpen }, ref) {
  const { t } = useLanguage();
  const counts = attentionCounts(attention);
  const tone = counts.blocking ? "danger" : counts.total ? "warning" : "success";

  return (
    <button
      aria-label={`${t("attention.globalAriaPrefix", "Abrir Segmento de Atencion")}, ${counts.total} ${t("attention.pendingItems", "pendiente(s)")}, ${counts.blocking} ${t("attention.blockingItems", "bloqueante(s)")}`}
      className="uxa-shell-control uxa-attention-global-badge"
      onClick={(event) => onOpen(event.currentTarget)}
      ref={ref}
      type="button"
    >
      <Bell aria-hidden="true" className={cn("h-4 w-4", counts.blocking ? "text-[var(--uxa-state-danger)]" : "text-[var(--uxa-color-brand)]")} />
      <span>{counts.total}</span>
      <UxaBadge tone={tone}>{counts.blocking ? t("attention.badge.blocking", "Bloquea") : counts.total ? t("attention.badge.pending", "Pendiente") : t("attention.badge.upToDate", "Al dia")}</UxaBadge>
    </button>
  );
});

function AttentionActionControls({ actionState, compact = false, item, onResolveItem }: AttentionActionControlsProps) {
  const { t } = useLanguage();
  const [answerText, setAnswerText] = useState(item.suggested_answer ?? "");
  const [selectedOptionKey, setSelectedOptionKey] = useState("");
  const [usedSuggestedAnswer, setUsedSuggestedAnswer] = useState(Boolean(item.suggested_answer));
  const isResolving = actionState?.status === "submitting" && actionState.itemKey === item.key;
  const canResolveInline = item.action.can_resolve_inline && item.action.kind !== "navigate" && onResolveItem;
  const expectsTextResolution = item.action.kind === "answer" || item.action.kind === "confirm" || item.type === "question" || item.type === "gap";
  const suggestedLabel = item.type === "runtime_error"
    ? t("attention.suggestedRecovery", "Recuperacion sugerida")
    : t("attention.suggestedAnswer", "Respuesta sugerida");

  async function resolveInline() {
    if (!onResolveItem || !canResolveInline) {
      return;
    }

    await onResolveItem(item.key, buildAttentionResolutionPayload(item, { answerText, selectedOptionKey, wasSuggestedAnswerUsed: usedSuggestedAnswer }));
  }

  if (!canResolveInline) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Link className="uxa-button uxa-button--secondary uxa-button--sm" href={item.action.href}>
          {item.action.label}
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
        {item.action.return_href ? (
          <Link className="text-[11px] font-black text-[var(--uxa-color-brand)] underline-offset-4 hover:underline" href={item.action.return_href}>
            {t("common.backToContext", "Volver al contexto")}
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {item.suggested_answer ? (
        <div className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-brand)]/20 bg-[var(--uxa-color-brand-soft)] p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--uxa-color-brand)]">{suggestedLabel}</p>
          <p className="mt-1 text-[12px] leading-5 text-[var(--uxa-color-text)]">{item.suggested_answer}</p>
          <button
            className="mt-2 text-[11px] font-black text-[var(--uxa-color-brand)] underline-offset-4 hover:underline"
            onClick={() => {
              setAnswerText(item.suggested_answer);
              setSelectedOptionKey("");
              setUsedSuggestedAnswer(true);
            }}
            type="button"
          >
            {t("attention.useSuggestion", "Usar sugerencia")}
          </button>
        </div>
      ) : null}
      {expectsTextResolution ? (
        <UxaTextareaField
          label={t("attention.answerField", "Respuesta o criterio de cierre")}
          onChange={(event) => {
            setAnswerText(event.target.value);
            setSelectedOptionKey("");
            setUsedSuggestedAnswer(false);
          }}
          rows={3}
          value={answerText}
        />
      ) : null}
      {item.options.length ? (
        <div className="grid gap-2" aria-label={t("attention.optionsAria", "Opciones sugeridas")}>
          {item.options.map((option) => (
            <button
              aria-pressed={selectedOptionKey === option.key}
              className={cn(
                "rounded-[var(--uxa-radius-lg)] border p-3 text-left transition",
                selectedOptionKey === option.key
                  ? "border-[var(--uxa-color-brand)] bg-[var(--uxa-color-brand-soft)]"
                  : "border-[var(--uxa-color-border)] bg-white hover:border-[var(--uxa-color-brand)]/50",
              )}
              key={option.key}
              onClick={() => {
                setAnswerText(option.label);
                setSelectedOptionKey(option.key);
                setUsedSuggestedAnswer(Boolean(item.suggested_answer && option.label === item.suggested_answer));
              }}
              type="button"
            >
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-[12px] font-black text-[var(--uxa-color-text)]">{option.label}</span>
                {option.recommended ? <UxaBadge tone="success">{t("common.recommended", "Recomendada")}</UxaBadge> : null}
              </span>
              {option.description ? <span className="mt-1 block text-[11px] leading-4 text-[var(--uxa-color-muted)]">{option.description}</span> : null}
              {option.impact ? <span className="mt-2 block text-[10px] font-semibold text-[var(--uxa-color-brand)]">{t("attention.impact", "Impacto")}: {option.impact}</span> : null}
              {option.example ? <span className="mt-1 block text-[10px] text-[var(--uxa-color-muted)]">{t("attention.example", "Ejemplo")}: {option.example}</span> : null}
            </button>
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <UxaButton isLoading={isResolving} onClick={() => void resolveInline()} size="sm" variant={compact ? "secondary" : "primary"}>
          {item.action.label}
        </UxaButton>
        {item.action.return_href ? (
          <Link className="text-[11px] font-black text-[var(--uxa-color-brand)] underline-offset-4 hover:underline" href={item.action.return_href}>
            {t("common.backToOrigin", "Regresar al origen")}
          </Link>
        ) : null}
      </div>
      {actionState?.itemKey === item.key && actionState.status !== "idle" && actionState.message ? (
        <p
          className={cn(
            "rounded-[var(--uxa-radius-lg)] border p-3 text-[12px] leading-5",
            actionState.status === "error"
              ? "border-[var(--uxa-state-danger)]/30 bg-[var(--uxa-state-danger-bg)] text-[var(--uxa-state-danger)]"
              : "border-[var(--uxa-state-success)]/30 bg-[var(--uxa-state-success-bg)] text-[var(--uxa-state-success)]",
          )}
          role={actionState.status === "error" ? "alert" : "status"}
        >
          {actionState.message}
        </p>
      ) : null}
    </div>
  );
}

function TechnicalDiagnosticValue({
  children,
  code = false,
  label,
}: {
  children: ReactNode;
  code?: boolean;
  label: string;
}) {
  return (
    <div className="rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-border)] bg-white p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)]">{label}</p>
      <p className={cn("mt-1 break-words text-[12px] leading-5 text-[var(--uxa-color-ink)]", code && "font-mono text-[11px]")}>
        {children}
      </p>
    </div>
  );
}

function RuntimeTechnicalDiagnostics({ item }: { item: AttentionItemV2 }) {
  const { t } = useLanguage();
  const diagnostics = item.diagnostics;
  const traceRefs = diagnostics?.trace_refs?.filter(Boolean) ?? [];

  return (
    <div className="mt-3 space-y-3">
      <div className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-state-danger)]/20 bg-white p-3">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--uxa-state-danger)]">
          {t("attention.runtime.whatHappened", "Que paso")}
        </p>
        <p className="mt-1 text-[12px] leading-5 text-[var(--uxa-color-ink)]">
          {diagnostics?.summary || item.reason}
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <TechnicalDiagnosticValue label={t("attention.runtime.capability", "Capability afectada")}>
          {diagnostics?.capability_label || diagnostics?.capability || item.stage}
        </TechnicalDiagnosticValue>
        <TechnicalDiagnosticValue label={t("attention.runtime.errorKind", "Tipo de error")}>
          {diagnostics?.error_kind || item.type}
        </TechnicalDiagnosticValue>
        <TechnicalDiagnosticValue label={t("attention.runtime.operationId", "Operacion")}>
          {diagnostics?.operation_id || item.source_ref.entity_id || "runtime"}
        </TechnicalDiagnosticValue>
        <TechnicalDiagnosticValue label={t("attention.runtime.retryPolicy", "Politica de recuperacion")}>
          {diagnostics?.retry_policy || t("attention.runtime.retryPolicyFallback", "Reintentar con el mismo contexto aprobado y conservar trazabilidad.")}
        </TechnicalDiagnosticValue>
      </div>
      <TechnicalDiagnosticValue label={t("attention.runtime.technicalMessage", "Mensaje tecnico saneado")} code>
        {diagnostics?.technical_message || item.reason}
      </TechnicalDiagnosticValue>
      <TechnicalDiagnosticValue label={t("attention.runtime.repairHint", "Como repararlo")}>
        {diagnostics?.repair_hint || item.suggested_answer || t("attention.runtime.repairHintFallback", "Reintenta la etapa; si el error persiste revisa proveedor, modelo, schema y logs de runtime.")}
      </TechnicalDiagnosticValue>
      {traceRefs.length ? (
        <div className="rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-border)] bg-white p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)]">
            {t("attention.runtime.traceRefs", "Referencias de traza")}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {traceRefs.map((ref) => (
              <code className="rounded-full bg-[var(--uxa-color-muted-panel)] px-2 py-1 text-[10px] text-[var(--uxa-color-ink-soft)]" key={ref}>
                {ref}
              </code>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AttentionTechnicalDetailsDisclosure({ item }: { item: AttentionItemV2 }) {
  const { t } = useLanguage();
  const isRuntimeError = item.type === "runtime_error";

  return (
    <details
      className="mt-3 rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-[var(--uxa-color-muted-panel)] px-3 py-2"
      open={isRuntimeError || undefined}
    >
      <summary className="cursor-pointer text-[11px] font-black text-[var(--uxa-color-ink-soft)]">
        {t("attention.technicalDetails", "Ver detalles técnicos")}
      </summary>
      {isRuntimeError ? <RuntimeTechnicalDiagnostics item={item} /> : null}
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)]">{t("attention.reason", "Motivo")}</p>
          <p className="mt-1 break-words text-[12px] leading-5 text-[var(--uxa-color-ink)]">{item.reason}</p>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)]">{t("attention.unresolvedConsequence", "Si no se resuelve")}</p>
          <p className="mt-1 break-words text-[12px] leading-5 text-[var(--uxa-color-ink)]">{item.consequence_if_unresolved}</p>
        </div>
      </div>
    </details>
  );
}

function AttentionInlineBlocker({ item }: { item: AttentionItemV2 }) {
  const { t } = useLanguage();
  if (!item.blocking) {
    return null;
  }

  return (
    <p className="mt-3 rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-state-danger)]/25 bg-[var(--uxa-state-danger-bg)] px-3 py-2 text-[11px] font-semibold leading-5 text-[var(--uxa-state-danger)]">
      {t("attention.blockerHint", "Resuelve esta acción para desbloquear la siguiente etapa.")}
    </p>
  );
}

function AttentionResumeStatus({ actionState, itemKey }: { actionState?: ProductAttentionActionState; itemKey: string }) {
  const { t } = useLanguage();
  if (!actionState || actionState.itemKey !== itemKey || actionState.status === "idle" || !actionState.message) {
    return null;
  }

  const isError = actionState.status === "error";
  return (
    <div
      aria-live="polite"
      className={cn(
        "mt-3 flex items-start gap-2 rounded-[var(--uxa-radius-lg)] border px-3 py-2 text-[11px] leading-5",
        isError
          ? "border-[var(--uxa-state-danger)]/30 bg-[var(--uxa-state-danger-bg)] text-[var(--uxa-state-danger)]"
          : "border-[var(--uxa-state-success)]/30 bg-[var(--uxa-state-success-bg)] text-[var(--uxa-state-success)]",
      )}
      role={isError ? "alert" : "status"}
    >
      {isError ? <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />}
      <span>
        <strong className="font-black">{isError ? t("attention.resumeError", "No se pudo aplicar la decisión") : t("attention.resumeReady", "Decisión registrada")}</strong>
        <span className="ml-1">{actionState.message}</span>
      </span>
    </div>
  );
}

export function AttentionItemCard({
  actionState,
  compact = false,
  item,
  onResolveItem,
}: {
  actionState?: ProductAttentionActionState;
  compact?: boolean;
  item: AttentionItemV2;
  onResolveItem?: ResolveAttentionItemHandler;
}) {
  const { t } = useLanguage();
  const tone = getAttentionItemTone(item);

  return (
    <article
      aria-label={`${item.title}, ${getAttentionTypeLabel(t, item.type)}, ${getAttentionSeverityLabel(t, item.severity)}`}
      className={cn(
        "rounded-[var(--uxa-radius-lg)] border bg-white p-4 shadow-[0_14px_30px_rgba(15,23,42,.04)]",
        item.blocking ? "border-[var(--uxa-state-danger)]/35" : "border-[var(--uxa-color-border)]",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <UxaBadge tone={tone}>{item.blocking ? t("common.blocking", "Blocking") : getAttentionSeverityLabel(t, item.severity)}</UxaBadge>
        <UxaBadge tone="neutral">{getLocalizedAttentionStageLabel(t, item.stage)}</UxaBadge>
        <UxaBadge tone="info">{getAttentionTypeLabel(t, item.type)}</UxaBadge>
        <UxaBadge tone="neutral">{getAttentionProductLabel(t, item.product)}</UxaBadge>
        <UxaBadge tone="neutral">{getAttentionStatusLabel(t, item.status)}</UxaBadge>
      </div>
      <h3 className="mt-3 break-words text-[17px] font-black text-[var(--uxa-color-ink)]">{item.title}</h3>
      <p className="mt-2 break-words text-[12px] leading-6 text-[var(--uxa-color-ink-soft)]">{item.impact}</p>
      {item.unblocks ? (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-brand)]/20 bg-[var(--uxa-color-brand-soft)]/60 px-3 py-1.5 text-[11px] text-[var(--uxa-color-text)]">
          <span className="font-black text-[var(--uxa-color-brand)]">{t("attention.unblocksPrefix", "Desbloquea:")}</span>
          <span className="font-semibold">{item.unblocks}</span>
          {item.resume_action ? (
            <span className="ml-auto rounded bg-[var(--uxa-color-brand)]/10 px-1.5 py-0.5 font-mono text-[10px] text-[var(--uxa-color-brand)]">
              {t("attention.resumeActionPrefix", "Reanudación")}: {item.resume_action}
            </span>
          ) : null}
        </div>
      ) : null}
      {!compact ? <AttentionTechnicalDetailsDisclosure item={item} /> : null}
      <AttentionInlineBlocker item={item} />
      <div className="mt-4">
        <AttentionActionControls actionState={actionState} compact={compact} item={item} onResolveItem={onResolveItem} />
      </div>
      <AttentionResumeStatus actionState={actionState} itemKey={item.key} />
    </article>
  );
}

function AttentionEmptyState({
  filtered,
  onClearFilters,
}: {
  filtered: boolean;
  onClearFilters: () => void;
}) {
  const { t } = useLanguage();
  return (
    <UxaEmptyState
      actions={filtered ? <UxaButton onClick={onClearFilters} variant="secondary">{t("common.clearFilters", "Limpiar filtros")}</UxaButton> : undefined}
      description={filtered
        ? t("attention.empty.filteredDesc", "La bandeja operativa no encontro preguntas, gaps o decisiones con la combinacion actual.")
        : t("attention.empty.cleanDesc", "El Segmento de Atencion esta al dia y el flujo LEAN puede continuar.")}
      eyebrow={filtered ? t("attention.empty.filteredEyebrow", "Filtros activos") : t("attention.empty.cleanEyebrow", "Estado operativo")}
      icon={filtered ? <Filter aria-hidden="true" className="h-5 w-5" /> : <CheckCircle2 aria-hidden="true" className="h-5 w-5" />}
      title={filtered ? t("attention.empty.filteredTitle", "Sin resultados con estos filtros") : t("attention.empty.cleanTitle", "Sin acciones pendientes")}
    />
  );
}

function AttentionFilters({
  attention,
  currentStage,
  filters,
  onChange,
  onClear,
}: {
  attention: AttentionResponseV2 | null;
  currentStage: string;
  filters: ProductAttentionFilters;
  onChange: (key: ProductAttentionFilterKey, value: string) => void;
  onClear: () => void;
}) {
  const { t } = useLanguage();
  const options = getAttentionFilterOptions(attention, currentStage);

  return (
    <div className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-[var(--uxa-color-muted-panel)] p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <SelectFilter
          label={t("attention.filter.stage", "Etapa")}
          onChange={(value) => onChange("stage", value)}
          options={[
            { label: t("attention.stage.all", "All"), value: "all" },
            ...options.stages.map((stage) => ({ label: getLocalizedAttentionStageLabel(t, stage), value: stage })),
          ]}
          value={filters.stage}
        />
        <SelectFilter
          label={t("attention.filter.severity", "Severidad")}
          onChange={(value) => onChange("severity", value)}
          options={[{ label: t("attention.severity.all", "All"), value: "all" }, ...options.severities.map((value) => ({ label: getAttentionSeverityLabel(t, value), value }))]}
          value={filters.severity}
        />
        <SelectFilter
          label={t("attention.filter.type", "Tipo")}
          onChange={(value) => onChange("type", value)}
          options={[{ label: t("attention.type.all", "All"), value: "all" }, ...options.types.map((value) => ({ label: getAttentionTypeLabel(t, value), value }))]}
          value={filters.type}
        />
        <SelectFilter
          label={t("attention.filter.product", "Producto")}
          onChange={(value) => onChange("product", value)}
          options={[{ label: t("attention.product.all", "All"), value: "all" }, ...options.products.map((value) => ({ label: getAttentionProductLabel(t, value), value }))]}
          value={filters.product}
        />
        <SelectFilter
          label={t("attention.filter.status", "Estado")}
          onChange={(value) => onChange("status", value)}
          options={[{ label: t("attention.status.all", "All"), value: "all" }, ...options.statuses.map((value) => ({ label: getAttentionStatusLabel(t, value), value }))]}
          value={filters.status}
        />
        <UxaButton disabled={!hasActiveAttentionFilters(filters)} onClick={onClear} size="sm" variant="secondary">
          {t("common.clear", "Limpiar")}
        </UxaButton>
      </div>
    </div>
  );
}

function SelectFilter({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <label className="min-w-[150px] flex-1 text-[11px] font-black uppercase tracking-[0.14em] text-[var(--uxa-color-ink-muted)]">
      <span>{label}</span>
      <select
        className="mt-2 min-h-11 w-full rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-white px-3 text-[13px] font-bold normal-case tracking-normal text-[var(--uxa-color-ink)] outline-none transition focus:border-[var(--uxa-color-brand)] focus:ring-4 focus:ring-[var(--uxa-color-brand-soft)]"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function AttentionBoard({
  actionState,
  activeRoute,
  currentStage,
  footer,
  onResolveItem,
}: {
  actionState?: ProductAttentionActionState;
  activeRoute: ProductExperienceRouteSnapshot | null;
  currentStage: string;
  footer?: ReactNode;
  onResolveItem?: ResolveAttentionItemHandler;
}) {
  const { t } = useLanguage();
  const [priorityTab, setPriorityTab] = useState<"all" | "needsResponse" | "recommended">("all");
  const attention = activeRoute?.attention.data ?? null;
  const { clearFilters, filters, updateFilter } = useAttentionUrlFilters();
  const filteredItems = filterAttentionItems(attention?.items ?? [], filters);
  const { needsResponse, recommended } = categorizeAttentionItems(filteredItems);
  const displayItems = priorityTab === "needsResponse" ? needsResponse : priorityTab === "recommended" ? recommended : filteredItems;
  const filtered = attention?.items.length ? hasActiveAttentionFilters(filters) : false;

  return (
    <div className="space-y-4">
      <AttentionFilters
        attention={attention}
        currentStage={currentStage}
        filters={filters}
        onChange={updateFilter}
        onClear={clearFilters}
      />
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--uxa-color-border)] pb-3">
        <button
          className={cn(
            "rounded-[var(--uxa-radius-md)] px-3 py-1.5 text-[12px] font-black transition",
            priorityTab === "all"
              ? "bg-[var(--uxa-color-brand)] text-white"
              : "bg-[var(--uxa-color-muted-panel)] text-[var(--uxa-color-ink)] hover:bg-[var(--uxa-color-brand-soft)]",
          )}
          onClick={() => setPriorityTab("all")}
          type="button"
        >
          {t("attention.tab.all", "Todos")} ({filteredItems.length})
        </button>
        <button
          className={cn(
            "rounded-[var(--uxa-radius-md)] px-3 py-1.5 text-[12px] font-black transition",
            priorityTab === "needsResponse"
              ? "bg-[var(--uxa-state-danger)] text-white"
              : "bg-[var(--uxa-color-muted-panel)] text-[var(--uxa-color-ink)] hover:bg-[var(--uxa-state-danger-bg)]",
          )}
          onClick={() => setPriorityTab("needsResponse")}
          type="button"
        >
          {t("attention.tab.needsResponse", "Necesita tu respuesta")} ({needsResponse.length})
        </button>
        <button
          className={cn(
            "rounded-[var(--uxa-radius-md)] px-3 py-1.5 text-[12px] font-black transition",
            priorityTab === "recommended"
              ? "bg-[var(--uxa-color-brand)] text-white"
              : "bg-[var(--uxa-color-muted-panel)] text-[var(--uxa-color-ink)] hover:bg-[var(--uxa-color-brand-soft)]",
          )}
          onClick={() => setPriorityTab("recommended")}
          type="button"
        >
          {t("attention.tab.recommended", "Recomendado")} ({recommended.length})
        </button>
      </div>
      <p aria-live="polite" className="sr-only" role="status">
        {t("attention.boardStatus", "Mostrando")} {displayItems.length} / {attention?.total_count ?? 0}
      </p>
      {displayItems.length ? (
        <div className="space-y-3">
          {displayItems.map((item) => (
            <AttentionItemCard
              actionState={actionState}
              item={item}
              key={item.key}
              onResolveItem={onResolveItem}
            />
          ))}
        </div>
      ) : (
        <AttentionEmptyState filtered={filtered} onClearFilters={clearFilters} />
      )}
      {footer}
    </div>
  );
}

export function AttentionInboxView({
  actionState,
  activeRoute,
  currentStage,
  onResolveItem,
}: {
  actionState?: ProductAttentionActionState;
  activeRoute: ProductExperienceRouteSnapshot | null;
  currentStage: string;
  onResolveItem?: ResolveAttentionItemHandler;
}) {
  const { t } = useLanguage();
  const attention = activeRoute?.attention.data ?? null;
  const counts = attentionCounts(attention);

  return (
    <div className="space-y-4">
      <UxaProductHero
        actions={(
          <div className="grid min-w-[320px] gap-3 sm:grid-cols-3 lg:min-w-[390px]">
            <AttentionMetric label={t("attention.metric.total", "Total")} tone="info" value={counts.total} />
            <AttentionMetric label={t("attention.metric.blocking", "Blockers")} tone="danger" value={counts.blocking} />
            <AttentionMetric label={t("attention.metric.warning", "Warnings")} tone="warning" value={counts.warning} />
          </div>
        )}
        description={t("attention.inboxDesc", "Bandeja central de preguntas, gaps, decisiones, confirmaciones y eventos HITL. Cada item conserva su etapa de origen y puede resolverse aqui cuando el contrato lo permite.")}
        eyebrow={<UxaBadge tone={counts.blocking ? "danger" : counts.total ? "warning" : "success"}>{t("attention.inboxBadge", "Segmento transversal")}</UxaBadge>}
        headingLevel={2}
        meta={<span className="inline-flex items-center gap-2 text-[var(--uxa-font-size-small)] text-[var(--uxa-color-ink-soft)]"><Inbox aria-hidden="true" className="h-4 w-4" /> {t("attention.inboxMeta", "Contexto operativo central")}</span>}
        title={t("attention.inboxTitle", "Atencion requerida")}
      />

      <UxaSurface className="p-4 lg:p-5">
        <AttentionBoard
          actionState={actionState}
          activeRoute={activeRoute}
          currentStage={currentStage}
          onResolveItem={onResolveItem}
        />
      </UxaSurface>
    </div>
  );
}

export function AttentionContextRail({
  actionState,
  activeRoute,
  currentStage,
  onOpen,
  onResolveItem,
}: {
  actionState?: ProductAttentionActionState;
  activeRoute: ProductExperienceRouteSnapshot | null;
  currentStage: string;
  onOpen: (source: HTMLElement) => void;
  onResolveItem?: ResolveAttentionItemHandler;
}) {
  const { t } = useLanguage();
  const attention = activeRoute?.attention.data ?? null;
  const contextualItems = getContextualAttentionItems(attention, currentStage);
  const counts = attentionCounts(attention);

  return (
    <UxaSurface className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <UxaBadge tone={counts.blocking ? "danger" : counts.total ? "warning" : "success"}>
            {counts.total} {t("attention.pendingItems", "pendiente(s)")}
          </UxaBadge>
          <h2 className="mt-3 text-[20px] font-black">{t("attention.contextTitle", "Segmento de Atencion")}</h2>
          <p className="mt-2 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
            {t("attention.contextDesc", "Acciones humanas vinculadas a esta etapa y al proyecto completo.")}
          </p>
        </div>
        <PanelRightOpen aria-hidden="true" className="h-5 w-5 text-[var(--uxa-color-brand)]" />
      </div>
      <p aria-live="polite" className="sr-only" role="status">
        {counts.total} {t("attention.pendingItems", "pendiente(s)")}; {counts.blocking} {t("attention.blockingItems", "bloqueante(s)")}
      </p>
      {contextualItems.length ? (
        <div className="mt-4 space-y-3">
          {contextualItems.map((item) => (
            <AttentionItemCard
              actionState={actionState}
              compact
              item={item}
              key={item.key}
              onResolveItem={onResolveItem}
            />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-[var(--uxa-radius-lg)] border border-dashed border-[var(--uxa-color-border)] bg-white p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 text-[var(--uxa-state-success)]" />
            <div>
              <p className="text-[13px] font-black text-[var(--uxa-color-ink)]">{t("attention.contextCleanTitle", "Sin acciones pendientes")}</p>
              <p className="mt-1 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
                {t("attention.contextCleanDesc", "Estado operativo limpio para esta etapa. No hay bloqueo ni venta cruzada escondida aqui.")}
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <UxaButton onClick={(event) => onOpen(event.currentTarget)} size="sm" variant={counts.blocking ? "danger" : "secondary"}>
          {t("common.openInbox", "Abrir bandeja")}
        </UxaButton>
        <Link className="uxa-button uxa-button--secondary uxa-button--sm" href={`/projects/${activeRoute?.route.sessionId ?? ""}/attention`}>
          {t("common.viewAll", "Ver completa")}
        </Link>
      </div>
    </UxaSurface>
  );
}

export function AttentionDrawer({
  actionState,
  activeRoute,
  currentStage,
  onClose,
  onResolveItem,
  open,
}: {
  actionState?: ProductAttentionActionState;
  activeRoute: ProductExperienceRouteSnapshot | null;
  currentStage: string;
  onClose: () => void;
  onResolveItem?: ResolveAttentionItemHandler;
  open: boolean;
}) {
  const { t } = useLanguage();
  const attention = activeRoute?.attention.data ?? null;
  const counts = attentionCounts(attention);
  const dialogRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusableSelector = [
      "button:not([disabled])",
      "a[href]",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "input:not([disabled])",
      "[tabindex]:not([tabindex='-1'])",
    ].join(",");

    window.setTimeout(() => dialog?.querySelector<HTMLElement>(focusableSelector)?.focus(), 0);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key === "Tab" && dialog) {
        const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector));
        const first = focusable[0];
        const last = focusable.at(-1);
        if (!first || !last) return;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100]">
      <button aria-label={t("attention.drawerClose", "Cerrar Segmento de Atencion")} className="absolute inset-0 bg-slate-950/50" onClick={onClose} type="button" />
      <aside
        aria-labelledby="attention-drawer-title"
        aria-modal="true"
        className="absolute right-0 top-0 flex h-full w-full max-w-[640px] flex-col overflow-hidden bg-[var(--uxa-color-canvas)] shadow-[var(--uxa-shadow-elevated)]"
        ref={dialogRef}
        role="dialog"
      >
        <UxaDrawerHeader
          closeLabel={t("attention.drawerClose", "Cerrar Segmento de Atencion")}
          description={t("attention.drawerDesc", "Resuelve sin perder el contexto. Esc cierra y devuelve el foco al punto de entrada.")}
          eyebrow={<UxaBadge tone={counts.blocking ? "danger" : counts.total ? "warning" : "success"}>{counts.total} {t("attention.pendingItems", "pending item(s)")}</UxaBadge>}
          onClose={onClose}
          title={t("attention.drawerTitle", "Segmento de Atencion")}
          titleId="attention-drawer-title"
        />
        <div className="min-h-0 flex-1 overflow-y-auto p-[var(--uxa-panel-padding-lg)]">
          <AttentionBoard
            actionState={actionState}
            activeRoute={activeRoute}
            currentStage={currentStage}
            footer={counts.blocking ? (
              <div className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-state-danger)]/30 bg-[var(--uxa-state-danger-bg)] p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 text-[var(--uxa-state-danger)]" />
                  <p className="text-[12px] leading-6 text-[var(--uxa-color-ink)]">
                    {t("attention.drawerFooter", "Hay bloqueos activos. Al resolverlos, la experiencia refresca proyecto, operacion y pendientes para evitar duplicados.")}
                  </p>
                </div>
              </div>
            ) : null}
            onResolveItem={onResolveItem}
          />
        </div>
      </aside>
    </div>
  );
}
