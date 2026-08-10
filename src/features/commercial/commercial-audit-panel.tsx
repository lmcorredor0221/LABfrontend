"use client";

import { useEffect, useState } from "react";
import { RefreshCcw } from "lucide-react";
import { AppButton, Badge, KeyValue, MiniStat, Panel, ProgressBar } from "@/components/lean/ui";
import { formatDateTime } from "@/features/operations/operations-adapter";
import { useSessions } from "@/features/sessions/session-context";
import type { CommercialAuditMetric, CommercialAuditReport } from "@/features/sessions/session-contracts";
import { cn } from "@/lib/utils";
import { ErrorState, LoadingState } from "@/shared/states/runtime-states";

type AuditState =
  | { data: null; error: null; status: "idle" | "loading" }
  | { data: CommercialAuditReport; error: null; status: "ready" }
  | { data: null; error: string; status: "error" };

function createIdleState(): AuditState {
  return {
    data: null,
    error: null,
    status: "idle",
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function getMetricValue(report: CommercialAuditReport, key: string) {
  return report.metrics.find((metric) => metric.key === key)?.value ?? 0;
}

function formatMetricValue(metric: CommercialAuditMetric) {
  return `${metric.value}${metric.unit ? ` ${metric.unit}` : ""}`;
}

function formatProductLabel(product: string) {
  if (product === "blueprint_pro") {
    return "Blueprint Pro";
  }

  if (product === "acp") {
    return "ACP";
  }

  return "Blueprint";
}

function formatMetadataPreview(metadata: Record<string, unknown>) {
  const text = JSON.stringify(metadata);
  if (!text || text === "{}") {
    return "Sin metadata adicional";
  }

  return text.length > 180 ? `${text.slice(0, 180)}...` : text;
}

export function CommercialAuditPanel({
  className,
  compact = false,
  sessionId,
}: {
  className?: string;
  compact?: boolean;
  sessionId: string;
}) {
  const { getCommercialAuditReport } = useSessions();
  const [state, setState] = useState<AuditState>(createIdleState);
  const eventLimit = compact ? 8 : 16;

  async function loadReport() {
    setState({ data: null, error: null, status: "loading" });
    try {
      const report = await getCommercialAuditReport(sessionId, eventLimit);
      setState({ data: report, error: null, status: "ready" });
    } catch (error) {
      setState({
        data: null,
        error: getErrorMessage(error, "No se pudo cargar la auditoria comercial."),
        status: "error",
      });
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitialReport() {
      setState({ data: null, error: null, status: "loading" });
      try {
        const report = await getCommercialAuditReport(sessionId, eventLimit);
        if (!cancelled) {
          setState({ data: report, error: null, status: "ready" });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            data: null,
            error: getErrorMessage(error, "No se pudo cargar la auditoria comercial."),
            status: "error",
          });
        }
      }
    }

    void loadInitialReport();

    return () => {
      cancelled = true;
    };
  }, [eventLimit, getCommercialAuditReport, sessionId]);

  function renderContent() {
    if (state.status === "error") {
      return (
        <ErrorState
          title="No se pudo cargar la auditoria"
          description={state.error}
          action={
            <AppButton icon={<RefreshCcw className="h-4 w-4" />} onClick={() => void loadReport()}>
              Reintentar
            </AppButton>
          }
        />
      );
    }

    if (state.status !== "ready" || !state.data) {
      return (
        <LoadingState
          title="Cargando auditoria comercial"
          description="Estamos consolidando eventos de conversion, bloqueos, exportaciones y conformance."
        />
      );
    }

    const report = state.data;
    const totalEvents = Number(getMetricValue(report, "total_events"));
    const blockedEvents = Number(getMetricValue(report, "blocked_events"));
    const exportCount = Number(getMetricValue(report, "exports"));
    const conformanceErrors = Number(getMetricValue(report, "conformance_errors"));

    return (
      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MiniStat label="Eventos" value={totalEvents} hint="auditables" tone="blue" />
          <MiniStat label="Bloqueos" value={blockedEvents} hint="protegidos" tone={blockedEvents ? "orange" : "green"} />
          <MiniStat label="Exportaciones" value={exportCount} hint="Blueprint/ACP" tone={exportCount ? "green" : "slate"} />
          <MiniStat label="Conformance" value={conformanceErrors} hint="errores" tone={conformanceErrors ? "red" : "green"} />
        </div>

        <Panel className="border-[var(--border-default)] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[12px] font-semibold text-[var(--text-primary)]">Funnel comercial</p>
              <p className="mt-1 text-[12px] leading-5 text-[var(--text-secondary)]">
                Blueprint visto, Blueprint Pro, invitacion ACP, ACP comprado y ACP exportado.
              </p>
            </div>
            <Badge tone={report.current_tier === "acp" ? "violet" : report.current_tier === "blueprint_pro" ? "green" : "blue"}>
              {formatProductLabel(report.current_tier)}
            </Badge>
          </div>

          <div className="mt-4 grid gap-3">
            {report.funnel.map((step) => (
              <div key={step.key} className="rounded-[18px] border border-[var(--border-default)] bg-white/76 p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--text-primary)]">{step.label}</p>
                    <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                      {step.count} evento(s){step.latest_at ? ` - ${formatDateTime(step.latest_at)}` : ""}
                    </p>
                  </div>
                  <Badge tone={step.completed ? "green" : "slate"}>{step.completed ? "Completo" : "Pendiente"}</Badge>
                </div>
                <ProgressBar className="mt-3" color={step.completed ? "#10b981" : "#94a3b8"} value={step.conversion_percent} />
              </div>
            ))}
          </div>
        </Panel>

        {!compact ? (
          <Panel className="border-[var(--border-default)] p-4">
            <p className="text-[12px] font-semibold text-[var(--text-primary)]">Resumen por producto</p>
            <div className="mt-3 grid gap-3 xl:grid-cols-3">
              {report.product_summary.map((item) => (
                <div key={item.product} className="rounded-[18px] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-[13px] font-semibold text-[var(--text-primary)]">{formatProductLabel(item.product)}</p>
                    <Badge tone={item.exports || item.purchases ? "green" : item.blocked_events ? "orange" : "slate"}>
                      {item.views + item.cta_clicks + item.purchases + item.exports} senales
                    </Badge>
                  </div>
                  <div className="grid gap-2">
                    <KeyValue label="Vistas" value={item.views} />
                    <KeyValue label="Bloqueos" value={item.blocked_events} />
                    <KeyValue label="CTAs" value={item.cta_clicks} />
                    <KeyValue label="Compras" value={item.purchases} />
                    <KeyValue label="Exports" value={item.exports} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        ) : null}

        <Panel className="border-[var(--border-default)] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[12px] font-semibold text-[var(--text-primary)]">Eventos recientes</p>
              <p className="mt-1 text-[12px] leading-5 text-[var(--text-secondary)]">{report.redaction_policy}</p>
            </div>
            <AppButton icon={<RefreshCcw className="h-4 w-4" />} onClick={() => void loadReport()}>
              Actualizar
            </AppButton>
          </div>

          <div className="mt-4 max-h-[360px] space-y-3 overflow-y-auto pr-2 [scrollbar-color:#0f766e_rgba(15,23,42,0.10)] [scrollbar-gutter:stable] [scrollbar-width:thin]">
            {report.recent_events.length ? (
              report.recent_events.map((event) => (
                <div key={`${event.created_at}-${event.event_key}-${event.source}`} className="rounded-[18px] border border-[var(--border-default)] bg-white/80 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-semibold text-[var(--text-primary)]">{event.event_key}</p>
                      <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                        {formatProductLabel(event.product)} - {event.source || "sin fuente"} - {formatDateTime(event.created_at)}
                      </p>
                    </div>
                    <Badge tone={event.status === "failed" ? "red" : event.event_key.includes("blocked") ? "orange" : "green"}>
                      {event.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-[12px] leading-5 text-[var(--text-secondary)]">{event.message}</p>
                  <code className="mt-2 block rounded-[12px] bg-[#07152c] px-3 py-2 text-[11px] leading-5 text-white/76">
                    {formatMetadataPreview(event.metadata)}
                  </code>
                </div>
              ))
            ) : (
              <div className="rounded-[18px] border border-dashed border-[var(--border-default)] bg-white/70 p-4 text-[13px] leading-6 text-[var(--text-secondary)]">
                Todavia no hay eventos comerciales normalizados para esta sesion.
              </div>
            )}
          </div>
        </Panel>

        {report.warnings.length ? (
          <div className="grid gap-2">
            {report.warnings.map((warning) => (
              <p key={warning} className="rounded-[16px] border border-[rgba(245,158,11,0.20)] bg-[rgba(245,158,11,0.08)] px-3 py-2 text-[12px] leading-5 text-[var(--text-secondary)]">
                {warning}
              </p>
            ))}
          </div>
        ) : null}

        {!compact ? (
          <div className="grid gap-3 md:grid-cols-3">
            {report.metrics.map((metric) => (
              <Panel key={metric.key} className="border-[var(--border-default)] p-4">
                <Badge tone={metric.tone}>{metric.label}</Badge>
                <p className="mt-3 text-[22px] font-semibold text-[var(--text-primary)]">{formatMetricValue(metric)}</p>
                <p className="mt-2 text-[12px] leading-5 text-[var(--text-secondary)]">{metric.detail}</p>
              </Panel>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <Panel className={cn("p-5", className)} data-testid="commercial-audit-panel">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">Observabilidad comercial</p>
          <h3 className="mt-2 text-[22px] font-semibold text-[var(--text-primary)]">Conversion, bloqueos y auditoria</h3>
        </div>
        <Badge tone="blue">commercial-audit.v1</Badge>
      </div>
      {renderContent()}
    </Panel>
  );
}
