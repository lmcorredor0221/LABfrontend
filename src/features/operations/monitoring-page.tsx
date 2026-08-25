"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderKanban, RefreshCcw } from "lucide-react";
import { BarsByDimension, DonutChart, MultiSeriesChart, Sparkline } from "@/components/lean/charts";
import { AppButton, Badge, Panel, SelectField, SimpleTable, StatRow, TextAreaField, TextField } from "@/components/lean/ui";
import { FinOpsDashboard } from "@/features/finops/finops-dashboard";
import { OperationsModuleShell } from "@/features/operations/operations-module-shell";
import {
  buildReleaseObservabilitySummary,
  buildMonitoringSummary,
  formatCurrency,
  formatDateTime,
  formatDurationMs,
  formatRelativeTime,
  getStatusTone,
} from "@/features/operations/operations-adapter";
import { useOperationalSession } from "@/features/operations/use-operational-session";
import { getSessionProjectRoute } from "@/features/sessions/session-routes";
import { useAuth } from "@/core/auth/auth-context";
import { hasPlatformAdminRole } from "@/core/auth/types";
import { useLanguage } from "@/core/i18n/language-context";
import type {
  EstimationActualsUpsertRequest,
  EstimationCalibrationDashboard,
  MemoryDashboardEntry,
  MemoryObservabilityMetric,
  MemoryValidationCheckEntry,
  MonitoringWorkspace,
} from "@/features/sessions/session-contracts";
import type { SessionSnapshot } from "@/features/sessions/types";
import { EmptyState, ErrorState, LoadingState } from "@/shared/states/runtime-states";
import { getUniqueMessages } from "@/shared/utils/unique-messages";

type AsyncState<TData> =
  | { data: null; error: null; status: "idle" | "loading" }
  | { data: TData; error: null; status: "ready" }
  | { data: null; error: string; status: "error" };
type SubmissionState = "idle" | "submitting" | "error" | "success";
type ActualsDraft = {
  actual_automation_coverage_percent: string;
  actual_cost_total: string;
  actual_duration_weeks: string;
  actual_hours_total: string;
  actual_provider: string;
  delivery_mode: "traditional" | "agentic";
  estimation_run_id: string;
  notes: string;
};
type ActualsDraftErrors = Partial<Record<keyof ActualsDraft, string>>;

function getRecentWarnings(warnings: string[] | null | undefined) {
  return getUniqueMessages(warnings ?? []);
}

function createIdleState<TData>(): AsyncState<TData> {
  return {
    data: null,
    error: null,
    status: "idle",
  };
}

function MetricCard({
  badge,
  hint,
  title,
  value,
}: {
  badge?: ReactNode;
  hint?: string;
  title: string;
  value: string;
}) {
  return (
    <Panel className="p-5">
      <p className="text-[13px] text-[var(--text-secondary)]">{title}</p>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[24px] font-semibold text-[var(--text-primary)]">{value}</p>
          {hint ? <p className="mt-2 text-[13px] text-[var(--text-secondary)]">{hint}</p> : null}
        </div>
        {badge}
      </div>
    </Panel>
  );
}

function formatPercent(value: number) {
  return `${Math.round(value * 100) / 100}%`;
}

function MemoryMetricTile({ metric }: { metric: MemoryObservabilityMetric }) {
  return (
    <div className="rounded-[18px] border border-[var(--border-default)] bg-[var(--surface-subtle)] px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] text-[var(--text-secondary)]">{metric.label}</p>
        <Badge tone={getStatusTone(metric.status === "pass" ? "ready" : metric.status === "fail" ? "failed" : metric.status)}>
          {metric.status}
        </Badge>
      </div>
      <p className="mt-3 text-[24px] font-semibold text-[var(--text-primary)]">{formatPercent(metric.value)}</p>
      <p className="mt-2 text-[13px] text-[var(--text-secondary)]">
        {metric.numerator}/{metric.denominator} {metric.detail}
      </p>
    </div>
  );
}

function MemoryDashboardTable({
  emptyDescription,
  emptyTitle,
  items,
  labelColumn,
}: {
  emptyDescription: string;
  emptyTitle: string;
  items: MemoryDashboardEntry[];
  labelColumn: string;
}) {
  if (items.length === 0) {
    return <EmptyState className="px-0 py-4" title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <SimpleTable
      columns={[labelColumn, "Runs", "Hit rate", "Citation coverage", "Stale rate", "Budget avg", "Compression avg"]}
      rows={items.map((item) => [
        item.label,
        String(item.llm_runs),
        formatPercent(item.grounded_hit_rate),
        formatPercent(item.citation_coverage),
        formatPercent(item.stale_rate),
        formatPercent(item.average_budget_utilization),
        formatPercent(item.average_compression_gain),
      ])}
    />
  );
}

function MemoryValidationList({ items }: { items: MemoryValidationCheckEntry[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        className="px-0 py-4"
        title="Sin validaciones de memoria"
        description="El backend todavia no devolvio checks de compresion, stale o recoverability."
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.check_key} className="rounded-[18px] border border-[var(--border-default)] px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[15px] font-semibold text-[var(--text-primary)]">{item.label}</p>
            <Badge tone={getStatusTone(item.status === "pass" ? "ready" : item.status === "fail" ? "failed" : item.status)}>
              {item.status}
            </Badge>
          </div>
          <p className="mt-2 text-[14px] text-[var(--text-secondary)]">{item.summary}</p>
          {item.evidence.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {item.evidence.map((evidence) => (
                <span
                  key={`${item.check_key}-${evidence}`}
                  className="rounded-full border border-[var(--border-default)] bg-white px-3 py-1 text-[12px] text-[var(--text-secondary)]"
                >
                  {evidence}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function MemoryObservabilityPanel({ workspace }: { workspace: MonitoringWorkspace }) {
  const report = workspace.memory_observability;

  return (
    <div className="grid gap-5">
      <Panel className="p-6">
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[22px] font-semibold text-[var(--text-primary)]">Memoria y contexto</p>
              <p className="text-[14px] text-[var(--text-secondary)]">
                Observabilidad M7 sobre budget, grounding, stale detection y recoverability por agente y etapa.
              </p>
            </div>
            <Badge tone={getStatusTone((report?.stale_source_count ?? 0) > 0 ? "failed" : "ready")}>
              {(report?.llm_run_count ?? 0) > 0 ? `${report?.llm_run_count ?? 0} corridas` : "Sin corridas"}
            </Badge>
          </div>
        </div>
        {report ? (
          <div className="space-y-5">
            <div className="grid gap-4 xl:grid-cols-5">
              {report.metrics.map((metric) => (
                <MemoryMetricTile key={metric.key} metric={metric} />
              ))}
            </div>
            <div className="grid gap-5 xl:grid-cols-2">
              <div>
                <p className="mb-3 text-[15px] font-semibold text-[var(--text-primary)]">Dashboard por agente</p>
                <MemoryDashboardTable
                  labelColumn="Agente"
                  items={report.by_agent}
                  emptyTitle="Sin corridas por agente"
                  emptyDescription="Todavia no hay skill runs con traza suficiente para agrupar por agente."
                />
              </div>
              <div>
                <p className="mb-3 text-[15px] font-semibold text-[var(--text-primary)]">Dashboard por etapa</p>
                <MemoryDashboardTable
                  labelColumn="Etapa"
                  items={report.by_stage}
                  emptyTitle="Sin corridas por etapa"
                  emptyDescription="Todavia no hay trazas suficientes para agrupar por etapa."
                />
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            className="px-0 py-4"
            title="Memoria aun no observable"
            description="El backend no devolvio el reporte M7 para esta sesion."
          />
        )}
      </Panel>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel className="p-6">
          <div className="mb-4 space-y-2">
            <p className="text-[18px] font-semibold text-[var(--text-primary)]">Validaciones M7</p>
            <p className="text-[14px] text-[var(--text-secondary)]">
              Resultado de needle recovery, long-context recovery, contaminated guard y stale invalidation.
            </p>
          </div>
          <MemoryValidationList items={report?.validations ?? []} />
        </Panel>
        <Panel className="p-6">
          <div className="mb-4 space-y-2">
            <p className="text-[18px] font-semibold text-[var(--text-primary)]">Warnings recientes</p>
            <p className="text-[14px] text-[var(--text-secondary)]">
              Senales que conviene revisar antes de confiar en la continuidad entre etapas.
            </p>
          </div>
          {report?.recent_warnings && getRecentWarnings(report.recent_warnings).length > 0 ? (
            <div className="space-y-3">
              {getRecentWarnings(report.recent_warnings).map((warning, index) => (
                <div key={`${warning}-${index}`} className="rounded-[18px] border border-[var(--border-default)] bg-[var(--surface-subtle)] px-4 py-4 text-[14px] text-[var(--text-secondary)]">
                  {warning}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              className="px-0 py-4"
              title="Sin warnings recientes"
              description="La sesion no reporta desviaciones nuevas de memoria o contexto."
            />
          )}
        </Panel>
      </div>
    </div>
  );
}

function ReleaseObservabilityPanel({ workspace }: { workspace: MonitoringWorkspace }) {
  const summary = buildReleaseObservabilitySummary(workspace);
  const report = summary.report;

  if (!report) {
    return (
      <Panel className="p-6">
        <EmptyState
          className="px-0 py-4"
          title="CI13 aun no tiene observabilidad consolidada"
          description="Cuando la sesion tenga trazas, approvals y simulaciones suficientes, aqui veras el gate final de navegacion, providers y release."
        />
      </Panel>
    );
  }

  return (
    <div className="grid gap-5" data-testid="ci13-release-panel">
      <Panel className="p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[22px] font-semibold text-[var(--text-primary)]">CI13 · Cierre productivo</p>
            <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
              Consolidado final de release sobre corridas LLM, fallbacks, compaction, approvals, simulacion y trazabilidad por etapa.
            </p>
          </div>
          <Badge tone={summary.failingGateCount > 0 ? "orange" : "green"}>
            {summary.failingGateCount > 0 ? `${summary.failingGateCount} gates por cerrar` : "Gates listos"}
          </Badge>
        </div>
        <div className="grid gap-4 xl:grid-cols-6">
          <MetricCard title="Corridas LLM" value={String(summary.totalLlmRuns)} hint={summary.topProviderLabel} />
          <MetricCard
            title="Fallback rate"
            value={formatPercent(summary.fallbackRate)}
            hint={`${report.fallback_runs} fallback(s) · ${report.degraded_runs} degradadas`}
          />
          <MetricCard
            title="Context fingerprint"
            value={formatPercent(summary.contextFingerprintCoverage)}
            hint={`Source versions: ${formatPercent(summary.sourceVersionCoverage)}`}
          />
          <MetricCard
            title="Compaction promedio"
            value={formatPercent(summary.averageCompactionRatio)}
            hint={`Costo estimado: ${formatCurrency(summary.estimatedCostUsd)}`}
          />
          <MetricCard
            title="Simulation pass"
            value={formatPercent(summary.simulationPassRate)}
            hint={`${report.simulation_run_count} corrida(s) de simulacion`}
          />
          <MetricCard
            title="Tokens totales"
            value={new Intl.NumberFormat("es-CO").format(summary.totalTokens)}
            hint={`Actuals: ${summary.projectActualsCount} · auth/isolation: ${summary.authIsolationErrors}`}
          />
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
        <Panel className="p-6">
          <div className="mb-4 space-y-2">
            <p className="text-[18px] font-semibold text-[var(--text-primary)]">Release gates</p>
            <p className="text-[14px] text-[var(--text-secondary)]">
              Validaciones de cierre derivadas del estado actual de la sesion, listas para usar en rollout y promotion controlada.
            </p>
          </div>
          <div className="space-y-3">
            {summary.releaseGates.map((gate) => (
              <div
                key={gate.gate_key}
                className="rounded-[18px] border border-[var(--border-default)] px-4 py-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[15px] font-semibold text-[var(--text-primary)]">{gate.label}</p>
                  <Badge tone={getStatusTone(gate.status === "pass" ? "ready" : "failed")}>{gate.status}</Badge>
                </div>
                <p className="mt-2 text-[14px] text-[var(--text-secondary)]">{gate.detail}</p>
                {gate.evidence.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {gate.evidence.map((item, index) => (
                      <span
                        key={`${gate.gate_key}-${index}`}
                        className="rounded-full border border-[var(--border-default)] bg-[var(--surface-subtle)] px-3 py-1 text-[12px] text-[var(--text-secondary)]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-6">
          <div className="mb-4 space-y-2">
            <p className="text-[18px] font-semibold text-[var(--text-primary)]">Backend efectivo</p>
            <p className="text-[14px] text-[var(--text-secondary)]">
              Distribucion del contexto efectivo y el provider dominante segun las trazas reales de la sesion.
            </p>
          </div>
          {report.context_backends.length > 0 ? (
            <BarsByDimension
              items={report.context_backends.map((item) => ({
                color: "var(--brand-primary)",
                label: item.label,
                value: item.share_percent,
              }))}
            />
          ) : (
            <EmptyState
              className="px-0 py-4"
              title="Sin backends efectivos"
              description="Todavia no hay trazas suficientes para agrupar el contexto efectivo."
            />
          )}
          <div className="mt-5 space-y-3">
            <StatRow label="Provider dominante" value={summary.topProviderLabel} tone="blue" />
            <StatRow label="Etapa mas usada" value={summary.mostUsedStage} tone="violet" />
            <StatRow label="Long-term hits" value={String(report.long_term_hit_count)} tone="green" />
            <StatRow
              label="Band hit rate"
              value={report.estimation_error_metric_count > 0 ? formatPercent(report.estimation_band_hit_rate) : "Sin actuals"}
              tone={report.estimation_error_metric_count > 0 ? "green" : "slate"}
            />
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel className="p-6">
          <div className="mb-4 space-y-2">
            <p className="text-[18px] font-semibold text-[var(--text-primary)]">Providers y modelos</p>
            <p className="text-[14px] text-[var(--text-secondary)]">
              Mezcla efectiva entre provider, backend, modelo y contexto que realmente corrio en la sesion.
            </p>
          </div>
          {report.providers.length > 0 ? (
            <SimpleTable
              columns={["Provider", "Backend", "Modelo", "Runs", "Fallback", "Tokens", "Hits LT"]}
              rows={report.providers.map((item) => [
                item.provider_key,
                item.execution_backend,
                item.model_name,
                String(item.run_count),
                String(item.fallback_count),
                new Intl.NumberFormat("es-CO").format(item.total_tokens),
                String(item.long_term_hit_count),
              ])}
            />
          ) : (
            <EmptyState
              className="px-0 py-4"
              title="Sin providers observables"
              description="Aun no hay corridas LLM suficientes para construir la matriz multi-provider."
            />
          )}
        </Panel>

        <Panel className="p-6">
          <div className="mb-4 space-y-2">
            <p className="text-[18px] font-semibold text-[var(--text-primary)]">Etapas LEAN</p>
            <p className="text-[14px] text-[var(--text-secondary)]">
              Exito, staleness, reruns, aprobacion y simulacion agregados por etapa del journey.
            </p>
          </div>
          {report.stages.length > 0 ? (
            <SimpleTable
              columns={["Etapa", "Runs", "OK", "Review", "Fail", "Aprobados", "Stale"]}
              rows={report.stages.map((item) => [
                item.label,
                String(item.run_count),
                String(item.success_count),
                String(item.needs_review_count),
                String(item.failure_count),
                String(item.approved_artifact_count),
                String(item.stale_artifact_count),
              ])}
            />
          ) : (
            <EmptyState
              className="px-0 py-4"
              title="Sin etapas consolidadas"
              description="La sesion aun no acumula suficiente evidencia para resumir el journey completo."
            />
          )}
        </Panel>
      </div>

      <Panel className="p-6">
        <div className="mb-4 space-y-2">
          <p className="text-[18px] font-semibold text-[var(--text-primary)]">Capabilities activas</p>
          <p className="text-[14px] text-[var(--text-secondary)]">
            Vista transversal para detectar sobreuso, fallbacks, degradaciones o capacidades redundantes durante el cierre.
          </p>
        </div>
        {report.capabilities.length > 0 ? (
          <SimpleTable
            columns={["Capability", "Runs", "OK", "Fail", "Fallback", "Degraded", "Hits LT"]}
            rows={report.capabilities.map((item) => [
              item.label,
              String(item.run_count),
              String(item.success_count),
              String(item.failure_count),
              String(item.fallback_count),
              String(item.degraded_count),
              String(item.long_term_hit_count),
            ])}
          />
        ) : (
          <EmptyState
            className="px-0 py-4"
            title="Sin capabilities observables"
            description="Todavia no hay suficientes corridas para resumir capabilities por release."
          />
        )}
      </Panel>
    </div>
  );
}

function createActualsDraft(snapshot: SessionSnapshot | null): ActualsDraft | null {
  const latestRun = snapshot?.estimation_runs[0];
  if (!latestRun) {
    return null;
  }

  const latestActuals =
    snapshot?.project_actuals.find((item) => item.estimation_run_id === latestRun.id) ?? snapshot?.project_actuals[0] ?? null;
  const estimate = snapshot?.estimation_report;

  return {
    actual_automation_coverage_percent: String(
      latestActuals?.actual_automation_coverage_percent ?? estimate?.agentic.automation_coverage_percent ?? 0,
    ),
    actual_cost_total: String(latestActuals?.actual_cost_total ?? estimate?.agentic.estimated_cost ?? 0),
    actual_duration_weeks: String(
      latestActuals?.actual_duration_weeks ?? estimate?.agentic.estimated_duration_weeks ?? 0,
    ),
    actual_hours_total: String(latestActuals?.actual_hours_total ?? estimate?.agentic.estimated_hours_total ?? 0),
    actual_provider: latestActuals?.actual_provider ?? estimate?.agentic.active_provider ?? "openai",
    delivery_mode: latestActuals?.delivery_mode ?? "agentic",
    estimation_run_id: latestActuals?.estimation_run_id ?? latestRun.id,
    notes: latestActuals?.notes ?? "",
  };
}

function validateActualsDraft(draft: ActualsDraft | null): ActualsDraftErrors {
  if (!draft) {
    return { estimation_run_id: "No hay una corrida disponible para registrar actuals." };
  }

  const errors: ActualsDraftErrors = {};
  const hours = Number(draft.actual_hours_total);
  const duration = Number(draft.actual_duration_weeks);
  const cost = Number(draft.actual_cost_total);
  const automation = Number(draft.actual_automation_coverage_percent);

  if (!draft.estimation_run_id) {
    errors.estimation_run_id = "Selecciona la corrida que quieres calibrar.";
  }
  if (!Number.isFinite(hours) || hours <= 0) {
    errors.actual_hours_total = "Las horas reales deben ser mayores que cero.";
  }
  if (!Number.isFinite(duration) || duration <= 0) {
    errors.actual_duration_weeks = "La duracion real debe ser mayor que cero.";
  }
  if (!Number.isFinite(cost) || cost <= 0) {
    errors.actual_cost_total = "El costo real debe ser mayor que cero.";
  }
  if (!Number.isFinite(automation) || automation < 0 || automation > 100) {
    errors.actual_automation_coverage_percent = "La cobertura debe estar entre 0 y 100.";
  }

  return errors;
}

function buildActualsPayload(draft: ActualsDraft): EstimationActualsUpsertRequest {
  return {
    actual_automation_coverage_percent: Number(draft.actual_automation_coverage_percent),
    actual_cost_total: Number(draft.actual_cost_total),
    actual_duration_weeks: Number(draft.actual_duration_weeks),
    actual_hours_total: Number(draft.actual_hours_total),
    actual_provider: draft.actual_provider.trim() || null,
    delivery_mode: draft.delivery_mode,
    estimation_run_id: draft.estimation_run_id,
    notes: draft.notes.trim(),
  };
}

function ActualsCapturePanel({
  calibrationRuns,
  getEstimationCalibration,
  getMonitoringWorkspace,
  onCalibrationRefresh,
  onMonitoringRefresh,
  refreshSessionData,
  selectedSessionId,
  snapshot,
  upsertEstimationActuals,
}: {
  calibrationRuns: number;
  getEstimationCalibration: () => Promise<EstimationCalibrationDashboard | null>;
  getMonitoringWorkspace: (sessionId: string) => Promise<MonitoringWorkspace>;
  onCalibrationRefresh: (data: EstimationCalibrationDashboard | null) => void;
  onMonitoringRefresh: (data: MonitoringWorkspace) => void;
  refreshSessionData: (sessionId: string) => Promise<SessionSnapshot | null>;
  selectedSessionId: string;
  snapshot: SessionSnapshot | null;
  upsertEstimationActuals: (sessionId: string, payload: EstimationActualsUpsertRequest) => Promise<unknown>;
}) {
  const [draft, setDraft] = useState<ActualsDraft | null>(() => createActualsDraft(snapshot));
  const [errors, setErrors] = useState<ActualsDraftErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [state, setState] = useState<SubmissionState>("idle");
  const actualsRunOptions = (snapshot?.estimation_runs ?? []).slice(0, 8).map((item) => ({
    label: `${item.source_action} | ${item.created_at.slice(0, 16).replace("T", " ")}`,
    value: item.id,
  }));

  if (!draft) {
    return null;
  }
  const activeDraft = draft;

  async function handleSaveActuals() {
    const nextErrors = validateActualsDraft(activeDraft);
    setErrors(nextErrors);
    setMessage(null);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setState("submitting");

    try {
      await upsertEstimationActuals(selectedSessionId, buildActualsPayload(activeDraft));
      const refreshedSnapshot = await refreshSessionData(selectedSessionId);
      const [monitoringData, calibrationData] = await Promise.all([
        getMonitoringWorkspace(selectedSessionId),
        getEstimationCalibration(),
      ]);
      onMonitoringRefresh(monitoringData);
      onCalibrationRefresh(calibrationData);
      setDraft(createActualsDraft(refreshedSnapshot ?? null));
      setState("success");
      setMessage("Actuals guardados. La calibracion y los errores de estimacion quedaron refrescados.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "No se pudieron guardar los actuals.");
    }
  }

  return (
    <Panel className="p-6">
      <div className="mb-4 space-y-2">
        <p className="text-[18px] font-semibold text-[var(--text-primary)]">Registrar actuals de estimacion</p>
        <p className="text-[14px] text-[var(--text-secondary)]">
          Esta captura secundaria alimenta la calibracion real del backend sin interrumpir el journey principal.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SelectField
          label="Corrida"
          value={activeDraft.estimation_run_id}
          options={actualsRunOptions}
          error={errors.estimation_run_id}
          onValueChange={(value) => setDraft((current) => (current ? { ...current, estimation_run_id: value } : current))}
        />
        <SelectField
          label="Modo"
          value={activeDraft.delivery_mode}
          options={[
            { label: "Agentic", value: "agentic" },
            { label: "Tradicional", value: "traditional" },
          ]}
          onValueChange={(value) =>
            setDraft((current) => (current ? { ...current, delivery_mode: value as ActualsDraft["delivery_mode"] } : current))
          }
        />
        <TextField
          label="Provider real"
          value={activeDraft.actual_provider}
          onValueChange={(value) => setDraft((current) => (current ? { ...current, actual_provider: value } : current))}
        />
        <TextField label="Corridas calibradas" value={String(calibrationRuns)} readOnly />
        <TextField
          label="Horas reales"
          type="number"
          min="0"
          step="0.1"
          value={activeDraft.actual_hours_total}
          error={errors.actual_hours_total}
          onValueChange={(value) => setDraft((current) => (current ? { ...current, actual_hours_total: value } : current))}
        />
        <TextField
          label="Duracion real (semanas)"
          type="number"
          min="0"
          step="0.1"
          value={activeDraft.actual_duration_weeks}
          error={errors.actual_duration_weeks}
          onValueChange={(value) =>
            setDraft((current) => (current ? { ...current, actual_duration_weeks: value } : current))
          }
        />
        <TextField
          label="Costo real"
          type="number"
          min="0"
          step="1000"
          value={activeDraft.actual_cost_total}
          error={errors.actual_cost_total}
          onValueChange={(value) => setDraft((current) => (current ? { ...current, actual_cost_total: value } : current))}
        />
        <TextField
          label="Cobertura real (%)"
          type="number"
          min="0"
          max="100"
          step="1"
          value={activeDraft.actual_automation_coverage_percent}
          error={errors.actual_automation_coverage_percent}
          onValueChange={(value) =>
            setDraft((current) => (current ? { ...current, actual_automation_coverage_percent: value } : current))
          }
        />
      </div>
      <div className="mt-4">
        <TextAreaField
          label="Notas"
          value={activeDraft.notes}
          onValueChange={(value) => setDraft((current) => (current ? { ...current, notes: value } : current))}
          footer="Resumen corto de desvio, contexto o decisiones que expliquen la diferencia."
        />
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <AppButton variant="primary" loading={state === "submitting"} onClick={() => void handleSaveActuals()}>
          Guardar actuals
        </AppButton>
        {message ? (
          <p className="text-[13px] leading-6 text-[var(--text-secondary)]">{message}</p>
        ) : (
          <p className="text-[13px] leading-6 text-[var(--text-secondary)]">
            Usa esta captura para cerrar la brecha entre estimado y real por corrida.
          </p>
        )}
      </div>
    </Panel>
  );
}

export function MonitoringWorkspacePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useAuth();
  const isPlatformAdmin = hasPlatformAdminRole(user);
  const {
    createSession,
    getEstimationCalibration,
    getMonitoringWorkspace,
    items,
    listError,
    listStatus,
    refreshSessionData,
    selectedSession,
    selectedSnapshot,
    selectOperationalSession,
    upsertEstimationActuals,
  } = useOperationalSession({
    requireSnapshot: true,
  });
  const [monitoringState, setMonitoringState] = useState<AsyncState<MonitoringWorkspace>>(createIdleState);
  const [calibrationState, setCalibrationState] = useState<AsyncState<EstimationCalibrationDashboard | null>>(createIdleState);

  const sessionOptions = items.map((item) => ({
    label: item.title,
    value: item.id,
  }));

  useEffect(() => {
    if (!selectedSession) {
      return;
    }

    let cancelled = false;

    async function loadWorkspace() {
      setMonitoringState({ data: null, error: null, status: "loading" });
      setCalibrationState({ data: null, error: null, status: "loading" });

      const [monitoringResult, calibrationResult] = await Promise.allSettled([
        getMonitoringWorkspace(selectedSession.id),
        getEstimationCalibration(),
      ]);

      if (cancelled) {
        return;
      }

      if (monitoringResult.status === "fulfilled") {
        setMonitoringState({ data: monitoringResult.value, error: null, status: "ready" });
      } else {
        setMonitoringState({
          data: null,
          error: monitoringResult.reason instanceof Error ? monitoringResult.reason.message : "No se pudo cargar monitoreo.",
          status: "error",
        });
      }

      if (calibrationResult.status === "fulfilled") {
        setCalibrationState({ data: calibrationResult.value, error: null, status: "ready" });
      } else {
        const message =
          calibrationResult.reason instanceof Error ? calibrationResult.reason.message : "La calibracion no esta disponible.";
        if (message.toLowerCase().includes("409") || message.toLowerCase().includes("feature flag")) {
          setCalibrationState({ data: null, error: null, status: "ready" });
        } else {
          setCalibrationState({ data: null, error: message, status: "error" });
        }
      }
    }

    void loadWorkspace();
    return () => {
      cancelled = true;
    };
  }, [getEstimationCalibration, getMonitoringWorkspace, selectedSession]);

  async function handleCreateSession() {
    const created = await createSession();
    router.push(getSessionProjectRoute(created));
  }

  async function handleRefresh() {
    if (!selectedSession) {
      return;
    }

    setMonitoringState({ data: null, error: null, status: "loading" });
    try {
      const data = await getMonitoringWorkspace(selectedSession.id);
      setMonitoringState({ data, error: null, status: "ready" });
    } catch (error) {
      setMonitoringState({
        data: null,
        error: error instanceof Error ? error.message : "No se pudo refrescar monitoreo.",
        status: "error",
      });
    }
  }

  if (listStatus === "loading" && items.length === 0) {
    return <LoadingState title="Cargando modulos operativos" description="Estamos recuperando las sesiones disponibles." />;
  }

  if (listStatus === "error" && items.length === 0) {
    return (
      <ErrorState
        title="No se pudo abrir monitoreo"
        description={listError?.message ?? "La lista de sesiones no pudo recuperarse."}
        action={
          <AppButton variant="primary" onClick={() => void handleCreateSession()}>
            Crear sesion
          </AppButton>
        }
      />
    );
  }

  if (!selectedSession) {
    return (
      <OperationsModuleShell
        moduleLabel="Monitoreo"
        title="Monitoreo operativo"
        description="Supervisa metricas, alertas y continuidad usando una sesion real."
        sessionOptions={sessionOptions}
        sessionValue={null}
      >
        <EmptyState
          title="Todavia no hay sesiones operativas"
          description="Crea una sesion o completa el journey principal para ver metricas reales."
          action={
            <AppButton variant="primary" onClick={() => void handleCreateSession()}>
              Crear sesion
            </AppButton>
          }
        />
      </OperationsModuleShell>
    );
  }

  const monitoringSummary =
    monitoringState.status === "ready" ? buildMonitoringSummary(monitoringState.data, calibrationState.data ?? null) : null;
  const currentMetrics = monitoringSummary?.currentMetrics;

  return (
    <OperationsModuleShell
      moduleLabel={t("monitoring.title", "Monitoreo")}
      title={t("monitoring.title", "Monitoreo y observabilidad")}
      description={t("monitoring.description", "Métricas en tiempo real, alertas de salud y consumo de modelos de IA.")}
      sessionOptions={sessionOptions}
      sessionValue={selectedSession.id}
      selectedSession={selectedSession}
      onSessionChange={(value) => void selectOperationalSession(value)}
      actions={
        <>
          <AppButton onClick={() => router.push(getSessionProjectRoute(selectedSession))} icon={<FolderKanban className="h-4 w-4" />}>
            {t("nav.projects", "Volver al proyecto")}
          </AppButton>
          <AppButton onClick={() => void handleRefresh()} icon={<RefreshCcw className="h-4 w-4" />} loading={monitoringState.status === "loading"}>
            Refrescar
          </AppButton>
        </>
      }
    >
      {monitoringState.status === "loading" ? (
        <LoadingState title="Cargando monitoreo real" description="Consultando metricas, alertas y checks de integraciones." />
      ) : null}

      {monitoringState.status === "error" ? (
        <ErrorState
          title="No se pudo cargar monitoreo"
          description={monitoringState.error}
          action={
            <AppButton variant="primary" onClick={() => void handleRefresh()}>
              Reintentar
            </AppButton>
          }
        />
      ) : null}

      {monitoringState.status === "ready" && monitoringSummary ? (
        <>
          <div className="grid gap-4 xl:grid-cols-6">
            <MetricCard
              title="Ultimo score"
              value={monitoringSummary.latestScoreLabel}
              hint={currentMetrics?.latest_evaluation_status || "Sin corrida reciente"}
              badge={<Badge tone={getStatusTone(currentMetrics?.latest_evaluation_status ?? "draft")}>{currentMetrics?.latest_evaluation_status || "Sin score"}</Badge>}
            />
            <MetricCard title="Alertas activas" value={String(monitoringSummary.activeAlerts.length)} badge={<Badge tone={monitoringSummary.activeAlerts.length > 0 ? "orange" : "green"}>{monitoringSummary.activeAlerts.length > 0 ? "Atencion" : "Estable"}</Badge>} />
            <MetricCard title="Errores" value={String(monitoringSummary.errorCount)} badge={<Badge tone={monitoringSummary.errorCount > 0 ? "red" : "green"}>{monitoringSummary.errorCount > 0 ? "Backend" : "Sin errores"}</Badge>} />
            <MetricCard title="Aprobaciones pendientes" value={String(monitoringSummary.pendingApprovals)} badge={<Badge tone={monitoringSummary.pendingApprovals > 0 ? "orange" : "green"}>{monitoringSummary.pendingApprovals > 0 ? "Pendientes" : "Cerradas"}</Badge>} />
            <MetricCard title="Artefactos registrados" value={String(currentMetrics?.artifact_count ?? 0)} hint={`Exports: ${monitoringSummary.exportCount}`} />
            <MetricCard title="Costo estimado" value={formatCurrency(currentMetrics?.cost_estimate_usd ?? 0)} hint={formatDurationMs(currentMetrics?.total_duration_ms ?? 0)} />
          </div>

          {isPlatformAdmin ? (
            <FinOpsDashboard />
          ) : (
            <Panel className="p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-[var(--warning)]" />
                <div>
                  <p className="text-[18px] font-semibold text-[var(--text-primary)]">FinOps IA protegido</p>
                  <p className="mt-2 text-[14px] leading-6 text-[var(--text-secondary)]">
                    El detalle de consumo, costos, presupuestos y alertas LLM forma parte de la consola administrativa y solo se muestra a platform admin.
                  </p>
                </div>
              </div>
            </Panel>
          )}

          <Panel className="p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-[22px] font-semibold text-[var(--text-primary)]">Tendencia de ejecucion</p>
                <p className="text-[14px] text-[var(--text-secondary)]">
                  Serie real derivada del historial persistido en el workspace de monitoreo.
                </p>
              </div>
              <Badge tone="blue">{monitoringState.data.history.length} snapshots</Badge>
            </div>
            {monitoringState.data.history.length > 0 ? (
              <MultiSeriesChart
                series={[
                  { color: "#4f46f5", values: monitoringSummary.trendSeries.evaluation },
                  { color: "#ef4444", values: monitoringSummary.trendSeries.errors },
                  { color: "#f59e0b", values: monitoringSummary.trendSeries.warnings },
                  { color: "#22c55e", values: monitoringSummary.trendSeries.artifacts },
                ]}
              />
            ) : (
              <EmptyState
                className="px-0 py-4"
                title="Sin historial suficiente"
                description="Aun no hay snapshots acumulados para graficar la tendencia."
              />
            )}
          </Panel>

          <MemoryObservabilityPanel workspace={monitoringState.data} />
          <ReleaseObservabilityPanel workspace={monitoringState.data} />

          <div className="grid gap-5 xl:grid-cols-2">
            <Panel className="p-6">
              <div className="mb-4 space-y-2">
                <p className="text-[18px] font-semibold text-[var(--text-primary)]">Resumen de alertas</p>
                <p className="text-[14px] text-[var(--text-secondary)]">Distribucion actual por severidad activa.</p>
              </div>
              <div className="grid items-center gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
                <DonutChart
                  centerValue={String(monitoringSummary.activeAlerts.length)}
                  centerLabel="Activas"
                  segments={[
                    { value: Math.max(monitoringSummary.severityCounts.critical, 0), color: "#ef4444" },
                    { value: Math.max(monitoringSummary.severityCounts.warning, 0), color: "#f59e0b" },
                    { value: Math.max(monitoringSummary.severityCounts.info, 0), color: "#4f46f5" },
                  ].filter((segment) => segment.value > 0)}
                  size={200}
                />
                <div className="space-y-4">
                  <StatRow label="Criticas" value={String(monitoringSummary.severityCounts.critical)} tone="red" />
                  <StatRow label="Advertencias" value={String(monitoringSummary.severityCounts.warning)} tone="orange" />
                  <StatRow label="Informativas" value={String(monitoringSummary.severityCounts.info)} tone="blue" />
                </div>
              </div>
            </Panel>

            <Panel className="p-6">
              <div className="mb-4 space-y-2">
                <p className="text-[18px] font-semibold text-[var(--text-primary)]">Errores recientes</p>
                <p className="text-[14px] text-[var(--text-secondary)]">Timeline live de los errores o revisiones mas recientes.</p>
              </div>
              {monitoringState.data.recent_errors.length > 0 ? (
                <div className="space-y-4">
                  {monitoringState.data.recent_errors.slice(0, 5).map((item) => (
                    <div key={`${item.created_at}-${item.message}`} className="rounded-[16px] border border-[var(--border-default)] px-4 py-4">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-[15px] font-medium text-[var(--text-primary)]">{item.message}</p>
                        <Badge tone={getStatusTone(item.status)}>{item.status}</Badge>
                      </div>
                      <p className="mt-2 text-[13px] text-[var(--text-secondary)]">
                        {item.stage.replaceAll("_", " ")} • {formatRelativeTime(item.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  className="px-0 py-4"
                  title="Sin errores recientes"
                  description="No hay fallos o eventos needs_review registrados para esta sesion."
                />
              )}
            </Panel>
          </div>

          <Panel className="p-6">
            <div className="mb-4 space-y-2">
              <p className="text-[18px] font-semibold text-[var(--text-primary)]">Salud por integracion</p>
              <p className="text-[14px] text-[var(--text-secondary)]">
                Estado y reachability de servicios devueltos por el backend en esta sesion.
              </p>
            </div>
            {monitoringState.data.integrations.length > 0 ? (
              <SimpleTable
                columns={["Integracion", "Estado", "Configurada", "Reachable", "Ultimo check", "Detalle"]}
                rows={monitoringState.data.integrations.map((item) => [
                  item.label,
                  <Badge key={`${item.id}-badge`} tone={getStatusTone(item.status)}>
                    {item.status}
                  </Badge>,
                  item.configured ? "Si" : "No",
                  item.reachable ? "Si" : "No",
                  formatDateTime(item.checked_at),
                  <div key={`${item.id}-detail`} className="space-y-1">
                    <span className="block">{item.detail}</span>
                    <Sparkline values={[50, item.configured ? 70 : 40, item.reachable ? 85 : 35, 65]} color={item.reachable ? "#22c55e" : "#f59e0b"} />
                  </div>,
                ])}
              />
            ) : (
              <EmptyState
                className="px-0 py-4"
                title="Sin integraciones monitoreadas"
                description="El backend todavia no devolvio checks de integraciones para esta sesion."
              />
            )}
          </Panel>

          {calibrationState.status === "ready" && calibrationState.data ? (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
              <Panel className="p-6">
                <div className="mb-4 space-y-2">
                  <p className="text-[18px] font-semibold text-[var(--text-primary)]">Calibracion de estimacion</p>
                  <p className="text-[14px] text-[var(--text-secondary)]">
                    Seccion visible solo porque el backend devolvio el dashboard real de calibracion.
                  </p>
                </div>
                {monitoringSummary.stagePrecision.length > 0 ? (
                  <BarsByDimension
                    items={monitoringSummary.stagePrecision.map((item) => ({
                      color: "var(--brand-primary)",
                      label: item.label,
                      value: item.value,
                    }))}
                  />
                ) : (
                  <EmptyState
                    className="px-0 py-4"
                    title="Sin precision por etapa"
                    description="Aun no hay corridas suficientes para evaluar la calibracion por madurez."
                  />
                )}
              </Panel>
              <Panel className="p-6">
                <div className="space-y-3">
                  <StatRow label="Cobertura calibrada" value={`${calibrationState.data.coverage_percent}%`} tone="green" />
                  <StatRow label="Band hit rate" value={`${calibrationState.data.band_hit_rate}%`} tone="blue" />
                  <StatRow label="Runs totales" value={String(calibrationState.data.total_runs)} />
                  <StatRow label="Runs calibrados" value={String(calibrationState.data.calibrated_runs)} />
                </div>
              </Panel>
            </div>
          ) : null}

          {selectedSnapshot?.estimation_runs.length ? (
            <ActualsCapturePanel
              key={`${selectedSession.id}:${selectedSnapshot.estimation_runs[0]?.id ?? "no-run"}:${selectedSnapshot.project_actuals[0]?.updated_at ?? "no-actuals"}`}
              calibrationRuns={calibrationState.data?.calibrated_runs ?? 0}
              getEstimationCalibration={getEstimationCalibration}
              getMonitoringWorkspace={getMonitoringWorkspace}
              onCalibrationRefresh={(data) => setCalibrationState({ data, error: null, status: "ready" })}
              onMonitoringRefresh={(data) => setMonitoringState({ data, error: null, status: "ready" })}
              refreshSessionData={refreshSessionData}
              selectedSessionId={selectedSession.id}
              snapshot={selectedSnapshot}
              upsertEstimationActuals={upsertEstimationActuals}
            />
          ) : null}

          {calibrationState.status === "error" ? (
            <ErrorState
              title="Calibracion no disponible"
              description={calibrationState.error}
              action={<AppButton onClick={() => void handleRefresh()}>Volver a intentar</AppButton>}
            />
          ) : null}
        </>
      ) : null}
    </OperationsModuleShell>
  );
}
