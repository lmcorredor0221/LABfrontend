"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Loader2,
  PauseCircle,
  RefreshCw,
  RotateCcw,
  Sparkles,
  XCircle,
} from "lucide-react";
import { useLanguage } from "@/core/i18n/language-context";
import type { TranslationKey } from "@/core/i18n/locales/es";
import type { ProductExperienceRouteSnapshot } from "@/features/product-experience/core/server-state";
import {
  UxaBadge,
  UxaButton,
  UxaSurface,
} from "@/features/product-experience/design-system";
import {
  buildProductOperationEnvelope,
  getOperationStepMetrics,
  isOperationActive,
  type ProductOperationActionSnapshot,
  type ProductOperationEnvelope,
  type ProductOperationStatus,
  type ProductOperationStep,
  type ProductOperationStepStatus,
} from "@/features/product-experience/operations/operation-model";
import { cn } from "@/lib/utils";

type ProductOperationPanelProps = {
  actionState?: ProductOperationActionSnapshot | null;
  activeRoute: ProductExperienceRouteSnapshot | null;
  onCancelOperation?: (operationId: string) => void | Promise<void>;
  onReload?: () => void;
  onRetryOperation?: (operationId: string) => void | Promise<void>;
};

function localizeOperationStepStatus(
  t: ReturnType<typeof useLanguage>["t"],
  status: ProductOperationStepStatus,
) {
  switch (status) {
    case "active":
      return t("operation.step.active", "En curso");
    case "completed":
      return t("operation.step.completed", "Completado");
    case "failed":
      return t("operation.step.failed", "Con error");
    case "waiting":
      return t("operation.step.waiting", "Espera usuario");
    default:
      return t("operation.step.pending", "Pendiente");
  }
}

function localizeField(
  t: ReturnType<typeof useLanguage>["t"],
  key: TranslationKey | undefined,
  fallback: string | undefined,
) {
  return key ? t(key, fallback) : (fallback ?? "");
}

function statusCopy(status: ProductOperationStatus) {
  const labels: Record<ProductOperationStatus, TranslationKey> = {
    cancelled: "operation.status.cancelled" as TranslationKey,
    completed: "operation.status.completed" as TranslationKey,
    failed: "operation.status.failed" as TranslationKey,
    queued: "operation.status.queued" as TranslationKey,
    running: "operation.status.running" as TranslationKey,
    waiting: "operation.status.waiting" as TranslationKey,
  };
  switch (status) {
    case "queued":
      return {
        icon: Clock3,
        labelKey: labels.queued,
        tone: "info" as const,
        label: "En cola",
      };
    case "running":
      return {
        icon: Loader2,
        labelKey: labels.running,
        tone: "info" as const,
        label: "Procesando",
      };
    case "waiting":
      return {
        icon: PauseCircle,
        labelKey: labels.waiting,
        tone: "warning" as const,
        label: "En espera",
      };
    case "failed":
      return {
        icon: AlertCircle,
        labelKey: labels.failed,
        tone: "danger" as const,
        label: "Con error",
      };
    case "cancelled":
      return {
        icon: XCircle,
        labelKey: labels.cancelled,
        tone: "neutral" as const,
        label: "Cancelada",
      };
    case "completed":
    default:
      return {
        icon: CheckCircle2,
        labelKey: labels.completed,
        tone: "success" as const,
        label: "Finalizada",
      };
  }
}

function formatLastUpdate(value?: string | null, fallback = "Sin timestamp disponible", locale = "es-CO") {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(locale, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function MinimalistStepBar({
  operation,
  metrics,
}: {
  operation: ProductOperationEnvelope;
  metrics: ReturnType<typeof getOperationStepMetrics>;
}) {
  const { t } = useLanguage();
  const isCompleted = operation.status === "completed";
  const isFailed = operation.status === "failed";
  const isWaiting = operation.status === "waiting";

  const activeStep =
    operation.steps.find((s) => s.status === "active") ||
    operation.steps.find((s) => s.status === "waiting") ||
    operation.steps.find((s) => s.status === "failed") ||
    (isCompleted ? operation.steps[operation.steps.length - 1] : operation.steps[0]);

  const activeLabel = activeStep ? localizeField(t, activeStep.labelKey, activeStep.label) : "";

  return (
    <div className="flex flex-col justify-center gap-1.5 min-w-[220px] max-w-[420px] flex-1 px-3">
      {/* Micro-resumen contextual superior */}
      <div className="flex items-center justify-between text-[11px] leading-tight">
        <div className="flex items-center gap-1.5 truncate max-w-[320px]">
          {isCompleted ? (
            <span className="flex items-center gap-1 font-semibold text-[var(--uxa-state-success)]">
              <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              <span>{metrics.total}/{metrics.total} fases completadas</span>
            </span>
          ) : isFailed ? (
            <span className="flex items-center gap-1 font-bold text-[var(--uxa-state-danger)]">
              <AlertCircle aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Interrumpido en paso {metrics.currentIndex}: {activeLabel}</span>
            </span>
          ) : isWaiting ? (
            <span className="flex items-center gap-1 font-bold text-[var(--uxa-state-warning)]">
              <PauseCircle aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">En espera: {activeLabel}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[var(--uxa-color-ink)] truncate font-medium">
              <span className="rounded bg-[var(--uxa-color-brand-soft)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--uxa-color-brand)]">
                Paso {metrics.currentIndex}/{metrics.total}
              </span>
              <span className="truncate font-semibold text-[var(--uxa-color-ink-soft)]">{activeLabel}</span>
            </span>
          )}
        </div>

        {/* Porcentaje o ratio sutil */}
        <span className="shrink-0 font-mono text-[10px] font-bold text-[var(--uxa-color-ink-muted)]">
          {isCompleted ? "100%" : `${metrics.progressPercent}%`}
        </span>
      </div>

      {/* Barra segmentada con micro-animación y tooltips */}
      <div
        aria-label={`Progreso de operación: ${metrics.progressPercent}%`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={metrics.progressPercent}
        className="flex items-center gap-1.5 w-full"
        role="progressbar"
      >
        {operation.steps.map((step, idx) => {
          const stepCompleted = step.status === "completed";
          const stepActive = step.status === "active";
          const stepFailed = step.status === "failed";
          const stepWaiting = step.status === "waiting";
          const stepLabel = localizeField(t, step.labelKey, step.label);
          const stepStatusText = localizeOperationStepStatus(t, step.status);

          return (
            <div
              key={step.key}
              className={cn(
                "group relative h-2 flex-1 rounded-full transition-all duration-300 cursor-help",
                stepCompleted && "bg-[var(--uxa-state-success)] hover:opacity-90",
                stepActive && "bg-[var(--uxa-color-brand)] ring-2 ring-[var(--uxa-color-brand-soft)] animate-pulse",
                stepFailed && "bg-[var(--uxa-state-danger)]",
                stepWaiting && "bg-[var(--uxa-state-warning)]",
                !stepCompleted && !stepActive && !stepFailed && !stepWaiting && "bg-[var(--uxa-color-border-soft,#e2e8f0)] hover:bg-[var(--uxa-color-border)]",
              )}
              title={`Paso ${idx + 1}/${operation.steps.length}: ${stepLabel} (${stepStatusText})`}
            />
          );
        })}
      </div>
    </div>
  );
}

function EmptyOperation({ onReload }: { onReload?: () => void }) {
  return null;
}

export function ProductOperationPanel({
  actionState,
  activeRoute,
  onCancelOperation,
  onReload,
  onRetryOperation,
}: ProductOperationPanelProps) {
  const { language, t } = useLanguage();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const operation = buildProductOperationEnvelope({ actionState, activeRoute });

  if (!operation) {
    return <EmptyOperation onReload={onReload} />;
  }

  const copy = statusCopy(operation.status);
  const Icon = copy.icon;
  const isRunning = operation.status === "running";
  const locale = language === "en" ? "en-US" : language === "pt" ? "pt-BR" : "es-CO";
  const metrics = getOperationStepMetrics(operation);

  return (
    <UxaSurface
      aria-label="Panel de Operación en Curso"
      as="section"
      className="overflow-hidden border border-[var(--uxa-color-border)] bg-white shadow-xs rounded-[var(--uxa-radius-xl)] transition-all mb-4"
    >
      {/* Barra Principal Compacta Horizontal (Desktop & Mobile Adaptativo) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 lg:flex-nowrap">
        {/* Bloque Izquierdo: Identidad de Estado y Título */}
        <div className="flex items-center gap-2.5 min-w-[200px]">
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
              isRunning
                ? "bg-[var(--uxa-color-brand-soft)] text-[var(--uxa-color-brand)]"
                : operation.status === "completed"
                  ? "bg-[var(--uxa-state-success-bg)] text-[var(--uxa-state-success)]"
                  : operation.status === "failed"
                    ? "bg-[var(--uxa-state-danger-bg)] text-[var(--uxa-state-danger)]"
                    : "bg-[var(--uxa-color-muted-panel)] text-[var(--uxa-color-ink-soft)]",
            )}
          >
            <Icon
              aria-hidden="true"
              className={cn("h-4 w-4", isRunning ? "animate-spin" : "")}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <UxaBadge tone={copy.tone}>
                {localizeField(t, copy.labelKey, copy.label)}
              </UxaBadge>
              <span className="text-[10px] font-bold text-[var(--uxa-color-ink-muted)]">
                {metrics.currentIndex}/{metrics.total}
              </span>
            </div>
            <p className="truncate text-[12px] font-black text-[var(--uxa-color-ink)]">
              {localizeField(t, operation.titleKey, operation.title)}
            </p>
            {operation.detail ? (
              <p className="truncate text-[11px] text-[var(--uxa-color-ink-soft)] max-w-[320px]">
                {localizeField(t, operation.detailKey, operation.detail)}
              </p>
            ) : null}
          </div>
          <span aria-live="polite" className="sr-only" role="status">
            {localizeField(t, operation.titleKey, operation.title)}: {localizeField(t, operation.detailKey, operation.detail)}
          </span>
        </div>

        {/* Bloque Central: Barra Segmentada Minimalista con Hitos Interactivos (Propuesta 1) */}
        <div className="hidden flex-1 items-center justify-center px-4 md:flex">
          <MinimalistStepBar metrics={metrics} operation={operation} />
        </div>

        {/* Bloque Derecho: Acciones Rápidas & Toggle de Detalles */}
        <div className="flex items-center gap-2 ml-auto">
          {operation.attentionHref ? (
            <Link
              className="uxa-button uxa-button--primary text-[11px] h-7 px-2.5 font-bold"
              href={operation.attentionHref}
            >
              {operation.attentionLabel ?? t("common.openAttention", "Abrir Atención")}
            </Link>
          ) : null}

          {operation.canRetry && onRetryOperation ? (
            <UxaButton
              className="text-[11px] h-7 px-2.5 font-bold"
              onClick={() => void onRetryOperation(operation.id)}
              size="sm"
              variant="secondary"
            >
              <RotateCcw aria-hidden="true" className="h-3.5 w-3.5 mr-1" />
              {t("common.retry", "Reintentar")}
            </UxaButton>
          ) : null}

          {operation.canCancel && onCancelOperation ? (
            <UxaButton
              className="text-[11px] h-7 px-2 font-bold text-[var(--uxa-color-ink-muted)]"
              onClick={() => void onCancelOperation(operation.id)}
              size="sm"
              variant="ghost"
            >
              {t("common.cancel", "Cancelar")}
            </UxaButton>
          ) : null}

          {onReload ? (
            <button
              aria-label={t("operation.reload", "Recargar estado")}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--uxa-color-border)] text-[var(--uxa-color-ink-muted)] hover:bg-[var(--uxa-color-muted-panel)] transition-colors"
              onClick={onReload}
              type="button"
            >
              <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          ) : null}

          <button
            aria-expanded={detailsOpen}
            aria-label="Alternar detalles técnicos de la operación"
            className="flex items-center gap-1 text-[11px] font-bold h-7 px-2 rounded-md border border-[var(--uxa-color-border)] bg-[var(--uxa-color-muted-panel)] text-[var(--uxa-color-ink-soft)] hover:text-[var(--uxa-color-ink)] transition-colors"
            onClick={() => setDetailsOpen((prev) => !prev)}
            type="button"
          >
            <span>{detailsOpen ? "Ocultar" : "Detalles"}</span>
            {detailsOpen ? (
              <ChevronUp aria-hidden="true" className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown aria-hidden="true" className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Pipeline Visual para Mobile (visible solo en pantallas chicas) */}
      <div className="flex md:hidden items-center gap-1 px-3 pb-2 pt-1 border-t border-[var(--uxa-color-border-soft)]">
        {operation.steps.map((step, idx) => (
          <div
            key={step.key}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              step.status === "completed"
                ? "bg-[var(--uxa-state-success)]"
                : step.status === "active"
                  ? "bg-[var(--uxa-color-brand)] animate-pulse"
                  : step.status === "failed"
                    ? "bg-[var(--uxa-state-danger)]"
                    : step.status === "waiting"
                      ? "bg-[var(--uxa-state-warning)]"
                      : "bg-[var(--uxa-color-border)]",
            )}
            title={`Paso ${idx + 1}/${operation.steps.length}: ${localizeField(t, step.labelKey, step.label)} (${localizeOperationStepStatus(t, step.status)})`}
          />
        ))}
      </div>

      {/* Cajón de Detalles Desplegable (Accordion con desglose completo de fases) */}
      {detailsOpen && (
        <div className="border-t border-[var(--uxa-color-border)] bg-[var(--uxa-color-muted-panel)]/40 p-4 transition-all animate-in fade-in-50 duration-200">
          {/* Fases completas desglosadas (sin compresión horizontal) */}
          <div className="mb-3 rounded-lg border border-[var(--uxa-color-border)] bg-white p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--uxa-color-ink-muted)] mb-2">
              Fases de la operación ({metrics.completed}/{metrics.total})
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              {operation.steps.map((step, idx) => {
                const stepCompleted = step.status === "completed";
                const stepActive = step.status === "active";
                const stepFailed = step.status === "failed";
                const stepWaiting = step.status === "waiting";
                const stepLabel = localizeField(t, step.labelKey, step.label);
                const stepDetail = localizeField(t, step.detailKey, step.detail);

                return (
                  <div
                    key={step.key}
                    className={cn(
                      "flex flex-col justify-between rounded-md border p-2.5 text-left transition-all",
                      stepCompleted && "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20",
                      stepActive && "border-blue-300 bg-blue-50/70 dark:border-blue-800 dark:bg-blue-950/30 ring-1 ring-blue-400",
                      stepFailed && "border-rose-200 bg-rose-50/50 dark:border-rose-900/50 dark:bg-rose-950/20",
                      stepWaiting && "border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20",
                      !stepCompleted && !stepActive && !stepFailed && !stepWaiting && "border-[var(--uxa-color-border-soft)] bg-[var(--uxa-color-muted-panel)]/50",
                    )}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-black bg-black/10">
                        {idx + 1}
                      </span>
                      <span
                        className={cn(
                          "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                          stepCompleted && "text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/50",
                          stepActive && "text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/50 animate-pulse",
                          stepFailed && "text-rose-700 bg-rose-100 dark:text-rose-300 dark:bg-rose-900/50",
                          stepWaiting && "text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/50",
                          !stepCompleted && !stepActive && !stepFailed && !stepWaiting && "text-[var(--uxa-color-ink-muted)] bg-gray-100 dark:bg-gray-800",
                        )}
                      >
                        {localizeOperationStepStatus(t, step.status)}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-[var(--uxa-color-ink)] leading-snug">
                      {stepLabel}
                    </p>
                    {stepDetail ? (
                      <p className="mt-1 text-[10px] text-[var(--uxa-color-ink-muted)] line-clamp-2">
                        {stepDetail}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Mensaje descriptivo */}
            <div className="md:col-span-2 rounded-lg border border-[var(--uxa-color-border)] bg-white p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--uxa-color-ink-muted)]">
                Detalle de la actividad
              </p>
              <p className="mt-1 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
                {localizeField(t, operation.detailKey, operation.detail)}
              </p>
              {operation.actionHint ? (
                <p className="mt-2 text-[11px] font-medium text-[var(--uxa-color-ink-muted)] border-t border-[var(--uxa-color-border-soft)] pt-2">
                  💡 {localizeField(t, operation.actionHintKey, operation.actionHint)}
                </p>
              ) : null}
            </div>

            {/* Metadatos y Pasos */}
            <div className="rounded-lg border border-[var(--uxa-color-border)] bg-white p-3 space-y-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--uxa-color-ink-muted)]">
                  Paso Actual
                </p>
                <p className="mt-0.5 text-[11px] font-bold text-[var(--uxa-color-ink)] truncate">
                  {localizeField(t, operation.currentStepKey, operation.currentStep)}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--uxa-color-ink-muted)]">
                  Siguiente
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--uxa-color-ink-soft)] truncate">
                  {localizeField(t, operation.nextStepKey, operation.nextStep)}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--uxa-color-ink-muted)]">
                  Última Actualización
                </p>
                <p className="mt-0.5 text-[11px] font-mono text-[var(--uxa-color-ink-muted)]">
                  {formatLastUpdate(operation.lastUpdatedAt, "Sin timestamp", locale)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </UxaSurface>
  );
}
