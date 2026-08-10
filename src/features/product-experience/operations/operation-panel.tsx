"use client";

import Link from "next/link";
import { AlertCircle, CheckCircle2, Clock3, Loader2, PauseCircle, RefreshCw, RotateCcw, XCircle } from "lucide-react";
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
  type ProductOperationActionSnapshot,
  type ProductOperationEnvelope,
  type ProductOperationStatus,
  type ProductOperationStepStatus,
} from "@/features/product-experience/operations/operation-model";
import { cn } from "@/lib/utils";

type ProductOperationPanelProps = {
  actionState?: ProductOperationActionSnapshot | null;
  activeRoute: ProductExperienceRouteSnapshot | null;
  onReload?: () => void;
};

function localizeOperationStepStatus(
  t: ReturnType<typeof useLanguage>["t"],
  status: ProductOperationStepStatus,
) {
  switch (status) {
    case "active":
      return t("operation.step.active", "In progress");
    case "completed":
      return t("operation.step.completed", "Completed");
    case "failed":
      return t("operation.step.failed", "Failed");
    case "waiting":
      return t("operation.step.waiting", "Waiting for user");
    default:
      return t("operation.step.pending", "Pending");
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
    cancelled: "operation.status.cancelled",
    completed: "operation.status.completed",
    failed: "operation.status.failed",
    queued: "operation.status.queued",
    running: "operation.status.running",
    waiting: "operation.status.waiting",
  };
  switch (status) {
    case "queued":
      return {
        icon: Clock3,
        labelKey: labels.queued,
        tone: "info" as const,
      };
    case "running":
      return {
        icon: Loader2,
        labelKey: labels.running,
        tone: "info" as const,
      };
    case "waiting":
      return {
        icon: PauseCircle,
        labelKey: labels.waiting,
        tone: "warning" as const,
      };
    case "failed":
      return {
        icon: AlertCircle,
        labelKey: labels.failed,
        tone: "danger" as const,
      };
    case "cancelled":
      return {
        icon: XCircle,
        labelKey: labels.cancelled,
        tone: "neutral" as const,
      };
    case "completed":
    default:
      return {
        icon: CheckCircle2,
        labelKey: labels.completed,
        tone: "success" as const,
      };
  }
}

function stepClass(status: ProductOperationStepStatus) {
  if (status === "active") {
    return "border-[var(--uxa-color-brand)] bg-[var(--uxa-color-brand-soft)]";
  }
  if (status === "failed") {
    return "border-[var(--uxa-state-danger)] bg-[var(--uxa-state-danger-bg)]";
  }
  if (status === "waiting") {
    return "border-[var(--uxa-state-warning)] bg-[var(--uxa-state-warning-bg)]";
  }
  if (status === "completed") {
    return "border-[var(--uxa-state-success)] bg-[var(--uxa-state-success-bg)]";
  }
  return "border-[var(--uxa-color-border)] bg-white";
}

function formatLastUpdate(value?: string | null, fallback = "No timestamp available", locale = "es-CO") {
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

function EmptyOperation({ onReload }: { onReload?: () => void }) {
  const { t } = useLanguage();
  return (
    <UxaSurface as="aside" className="p-4">
      <UxaBadge tone="neutral">{t("operation.badge", "Operacion")}</UxaBadge>
      <h2 className="mt-3 text-[20px] font-black">{t("operation.idleTitle", "Sin procesamiento activo")}</h2>
      <p className="mt-2 text-[12px] leading-6 text-[var(--uxa-color-ink-soft)]">
        {t("operation.idleDesc", "Cuando el sistema invoque LLM o backend, aqui veras el estado real por actividad y no un porcentaje inventado.")}
      </p>
      {onReload ? (
        <UxaButton className="mt-4 w-full justify-center" onClick={onReload} size="sm" variant="secondary">
          <RefreshCw aria-hidden="true" className="h-4 w-4" />
          {t("operation.reload", "Recargar estado")}
        </UxaButton>
      ) : null}
    </UxaSurface>
  );
}

function OperationStepList({ operation }: { operation: ProductOperationEnvelope }) {
  const { t } = useLanguage();
  return (
    <ol className="mt-4 space-y-2" aria-label={t("operation.stepAria", "Pasos de la operacion")}>
      {operation.steps.map((step, index) => (
        <li className={cn("rounded-[var(--uxa-radius-lg)] border p-3", stepClass(step.status))} key={step.key}>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-black">
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="text-[12px] font-black">{localizeField(t, step.labelKey, step.label)}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--uxa-color-ink-muted)]">
                {localizeOperationStepStatus(t, step.status)}
              </p>
              {step.detail ? (
                <p className="mt-2 text-[11px] leading-5 text-[var(--uxa-color-ink-soft)]">{localizeField(t, step.detailKey, step.detail)}</p>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function ProductOperationPanel({
  actionState,
  activeRoute,
  onReload,
}: ProductOperationPanelProps) {
  const { language, t } = useLanguage();
  const operation = buildProductOperationEnvelope({ actionState, activeRoute });

  if (!operation) {
    return <EmptyOperation onReload={onReload} />;
  }

  const copy = statusCopy(operation.status);
  const Icon = copy.icon;
  const iconClass = operation.status === "running" ? "animate-spin" : "";
  const locale = language === "en" ? "en-US" : language === "pt" ? "pt-BR" : "es-CO";

  return (
    <UxaSurface as="aside" className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <UxaBadge tone={copy.tone}>{t(copy.labelKey, "Operacion")}</UxaBadge>
          <h2 className="mt-3 text-[20px] font-black">{t("operation.title", "Operacion LLM")}</h2>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] text-[var(--uxa-color-ink-soft)]">
          <Icon aria-hidden="true" className={cn("h-5 w-5", iconClass)} />
        </span>
      </div>

      <div aria-live="polite" className="mt-4 rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-[var(--uxa-color-muted-panel)] p-3" role="status">
        <p className="text-[12px] font-black">{localizeField(t, operation.titleKey, operation.title)}</p>
        <p className="mt-2 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">{localizeField(t, operation.detailKey, operation.detail)}</p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2">
        <div className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-white p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--uxa-color-ink-muted)]">{t("operation.currentStep", "Paso actual")}</p>
          <p className="mt-1 text-[12px] font-black">{localizeField(t, operation.currentStepKey, operation.currentStep)}</p>
        </div>
        <div className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-white p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--uxa-color-ink-muted)]">{t("operation.next", "Siguiente")}</p>
          <p className="mt-1 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">{localizeField(t, operation.nextStepKey, operation.nextStep)}</p>
        </div>
      </div>

      <OperationStepList operation={operation} />

      <div className="mt-4 rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-white p-3">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--uxa-color-ink-muted)]">{t("operation.lastUpdated", "Ultima actualizacion")}</p>
        <p className="mt-1 text-[12px] font-bold">{formatLastUpdate(operation.lastUpdatedAt, t("common.noTimestamp", "Sin timestamp disponible"), locale)}</p>
        <p className="mt-2 text-[11px] leading-5 text-[var(--uxa-color-ink-soft)]">{localizeField(t, operation.actionHintKey, operation.actionHint)}</p>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {operation.attentionHref ? (
          <Link className="uxa-button uxa-button--primary w-full justify-center" href={operation.attentionHref}>
            {operation.attentionLabel ?? t("common.openAttention", "Abrir Atencion")}
          </Link>
        ) : null}
        {operation.canRetry && operation.retryHref ? (
          <Link className="uxa-button uxa-button--secondary w-full justify-center" href={operation.retryHref}>
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
            {t("common.retry", "Reintentar")}
          </Link>
        ) : null}
        {operation.canCancel && operation.cancelHref ? (
          <Link className="uxa-button uxa-button--ghost w-full justify-center" href={operation.cancelHref}>
            {t("common.cancel", "Cancelar")}
          </Link>
        ) : null}
        {onReload ? (
          <UxaButton className="w-full justify-center" onClick={onReload} size="sm" variant="secondary">
            <RefreshCw aria-hidden="true" className="h-4 w-4" />
            {t("operation.reload", "Recargar estado")}
          </UxaButton>
        ) : null}
      </div>
    </UxaSurface>
  );
}
