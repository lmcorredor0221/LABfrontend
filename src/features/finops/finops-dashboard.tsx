"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, Banknote, Cpu, Gauge, RefreshCcw, Timer, Zap } from "lucide-react";
import { BarsByDimension, DonutChart, MultiSeriesChart } from "@/components/lean/charts";
import { AppButton, Badge, Panel, SelectField, SimpleTable, StatRow, TextField } from "@/components/lean/ui";
import { finOpsApi, type FinOpsApi } from "@/features/finops/finops-api";
import type {
  FinOpsAlert,
  FinOpsAlertListResponse,
  FinOpsProviderBreakdownResponse,
  FinOpsSummary,
  FinOpsSummaryQuery,
  FinOpsTimeseriesResponse,
  FinOpsTopConsumersResponse,
} from "@/features/finops/finops-contracts";
import { EmptyState, ErrorState, LoadingState } from "@/shared/states/runtime-states";

type DashboardData = {
  alerts: FinOpsAlertListResponse;
  providerBreakdown: FinOpsProviderBreakdownResponse;
  summary: FinOpsSummary;
  timeseries: FinOpsTimeseriesResponse;
  topConsumers: FinOpsTopConsumersResponse;
};

type DashboardState =
  | { data: null; error: null; status: "idle" | "loading" }
  | { data: DashboardData; error: null; status: "ready" }
  | { data: null; error: string; status: "error" };

type FilterState = {
  agentKey: string;
  modelName: string;
  period: "7d" | "30d" | "month" | "all";
  projectId: string;
  providerKey: string;
  stage: string;
  userId: string;
};

type TopConsumersDimension = "agent_key" | "model_name" | "project_id" | "provider_key" | "stage" | "user_id";

const PERIOD_OPTIONS = [
  { label: "7 dias", value: "7d" },
  { label: "30 dias", value: "30d" },
  { label: "Mes actual", value: "month" },
  { label: "Todo", value: "all" },
];

const TOP_CONSUMER_DIMENSION_OPTIONS: Array<{ label: string; value: TopConsumersDimension }> = [
  { label: "Agente", value: "agent_key" },
  { label: "Proveedor", value: "provider_key" },
  { label: "Modelo", value: "model_name" },
  { label: "Usuario", value: "user_id" },
  { label: "Proyecto", value: "project_id" },
  { label: "Etapa", value: "stage" },
];

const TOP_CONSUMER_DIMENSION_LABELS: Record<TopConsumersDimension, string> = {
  agent_key: "Agentes",
  model_name: "Modelos",
  project_id: "Proyectos",
  provider_key: "Proveedores",
  stage: "Etapas",
  user_id: "Usuarios",
};

const TOP_CONSUMER_DIMENSION_SINGULAR_LABELS: Record<TopConsumersDimension, string> = {
  agent_key: "Agente",
  model_name: "Modelo",
  project_id: "Proyecto",
  provider_key: "Proveedor",
  stage: "Etapa",
  user_id: "Usuario",
};

function createIdleState(): DashboardState {
  return { data: null, error: null, status: "idle" };
}

function buildPeriodQuery(period: FilterState["period"]) {
  if (period === "all") {
    return {};
  }

  const end = new Date();
  const start = new Date(end);

  if (period === "7d") {
    start.setDate(end.getDate() - 7);
  } else if (period === "30d") {
    start.setDate(end.getDate() - 30);
  } else {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }

  return {
    started_from: start.toISOString(),
    started_to: end.toISOString(),
  };
}

function buildSummaryQuery(filters: FilterState): FinOpsSummaryQuery {
  return {
    ...buildPeriodQuery(filters.period),
    agent_key: filters.agentKey.trim() || undefined,
    model_name: filters.modelName.trim() || undefined,
    project_id: filters.projectId.trim() || undefined,
    provider_key: filters.providerKey.trim() || undefined,
    stage: filters.stage.trim() || undefined,
    user_id: filters.userId.trim() || undefined,
  };
}

function formatCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat("es-CO", {
    currency,
    maximumFractionDigits: value >= 100 ? 0 : 4,
    style: "currency",
  }).format(Number.isFinite(value) ? value : 0);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-CO").format(Number.isFinite(value) ? value : 0);
}

function formatMs(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "0 ms";
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)} s`;
  }
  return `${Math.round(value)} ms`;
}

function formatPercent(value: number) {
  return `${(Number.isFinite(value) ? value * 100 : 0).toFixed(2)}%`;
}

function severityTone(severity: string) {
  const normalized = severity.toLowerCase();
  if (normalized === "critical" || normalized === "high") {
    return "red" as const;
  }
  if (normalized === "medium") {
    return "orange" as const;
  }
  if (normalized === "low") {
    return "blue" as const;
  }
  return "slate" as const;
}

function availabilityTone(status: string | undefined) {
  if (status === "available") {
    return "green" as const;
  }
  if (status === "partial") {
    return "orange" as const;
  }
  if (status === "not_instrumented") {
    return "orange" as const;
  }
  if (status === "empty") {
    return "slate" as const;
  }
  return "blue" as const;
}

function providerSegments(items: FinOpsProviderBreakdownResponse["items"]) {
  const colors = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed"];
  return items.slice(0, 5).map((item, index) => ({
    color: colors[index % colors.length],
    label: `${item.provider_key}/${item.model_name}`,
    value: item.cost_total > 0 ? item.cost_total : item.total_tokens,
  }));
}

function providerShareBars(items: FinOpsProviderBreakdownResponse["items"]) {
  const total = Math.max(
    items.reduce((sum, item) => sum + item.cost_total, 0),
    1,
  );
  return items.slice(0, 6).map((item) => ({
    color: item.error_count > 0 ? "#f59e0b" : "#2563eb",
    label: `${item.provider_key}/${item.model_name}`,
    value: Math.round((item.cost_total / total) * 100),
  }));
}

function normalizeSeries(values: number[]) {
  const max = Math.max(...values, 1);
  return values.map((value) => Math.round((value / max) * 100));
}

function formatBucket(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short" }).format(date);
}

function KpiTile({
  icon,
  label,
  tone = "blue",
  value,
  detail,
}: {
  detail: string;
  icon: ReactNode;
  label: string;
  tone?: "blue" | "green" | "orange" | "red" | "slate" | "violet";
  value: string;
}) {
  return (
    <div className="min-h-[132px] rounded-[8px] border border-[var(--border-default)] bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] font-medium text-[var(--text-secondary)]">{label}</p>
        <Badge tone={tone}>{icon}</Badge>
      </div>
      <p className="mt-4 break-words text-[24px] font-semibold leading-tight text-[var(--text-primary)]">{value}</p>
      <p className="mt-2 text-[12px] leading-5 text-[var(--text-secondary)]">{detail}</p>
    </div>
  );
}

function AlertsList({ alerts }: { alerts: FinOpsAlert[] }) {
  if (alerts.length === 0) {
    return <EmptyState className="px-0 py-4" title="Sin alertas FinOps" description="No hay alertas activas para el periodo." />;
  }

  return (
    <div className="space-y-3">
      {alerts.slice(0, 6).map((alert) => (
        <div key={alert.id} className="rounded-[8px] border border-[var(--border-default)] bg-white px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="min-w-0 text-[14px] font-semibold text-[var(--text-primary)]">{alert.title}</p>
            <Badge tone={severityTone(alert.severity)}>{alert.severity}</Badge>
          </div>
          <p className="mt-2 text-[13px] leading-5 text-[var(--text-secondary)]">{alert.message}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-[12px] text-[var(--text-muted)]">
            <span>{alert.alert_type}</span>
            <span>{alert.scope_type}</span>
            {alert.scope_value ? <span className="max-w-full break-words">{alert.scope_value}</span> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export function FinOpsDashboard({ api = finOpsApi }: { api?: FinOpsApi }) {
  const [filters, setFilters] = useState<FilterState>({
    agentKey: "",
    modelName: "",
    period: "month",
    projectId: "",
    providerKey: "",
    stage: "",
    userId: "",
  });
  const [topConsumersDimension, setTopConsumersDimension] = useState<TopConsumersDimension>("agent_key");
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [state, setState] = useState<DashboardState>(createIdleState);
  const query = useMemo(() => buildSummaryQuery(filters), [filters]);

  useEffect(() => {
    let cancelled = false;

    async function loadFinOps() {
      setState({ data: null, error: null, status: "loading" });
      try {
        const [summary, providerBreakdown, topConsumers, alerts, timeseries] = await Promise.all([
          api.getSummary(query),
          api.getProviderBreakdown(query),
          api.getTopConsumers({ ...query, dimension: topConsumersDimension, limit: 6 }),
          api.listAlerts({ as_of: query.started_to, limit: 8, status: "active", sync: true }),
          api.getTimeseries({ ...query, granularity: "day" }),
        ]);

        if (!cancelled) {
          setState({
            data: { alerts, providerBreakdown, summary, timeseries, topConsumers },
            error: null,
            status: "ready",
          });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            data: null,
            error: error instanceof Error ? error.message : "No se pudo cargar FinOps IA.",
            status: "error",
          });
        }
      }
    }

    void loadFinOps();

    return () => {
      cancelled = true;
    };
  }, [api, query, refreshIndex, topConsumersDimension]);

  if (state.status === "loading" || state.status === "idle") {
    return <LoadingState title="Cargando FinOps IA" description="Consultando costos, tokens y alertas activas." />;
  }

  if (state.status === "error") {
    return (
      <ErrorState
        title="FinOps IA no disponible"
        description={state.error}
        action={
          <AppButton icon={<RefreshCcw className="h-4 w-4" />} onClick={() => setRefreshIndex((current) => current + 1)}>
            Reintentar
          </AppButton>
        }
      />
    );
  }

  // Keep the runtime guard explicit for TypeScript versions that do not fully
  // narrow the nullable payload through the discriminated status union.
  if (!state.data) {
    return <LoadingState title="Cargando FinOps IA" description="Consultando costos, tokens y alertas activas." />;
  }

  const { alerts, providerBreakdown, summary, timeseries, topConsumers } = state.data;
  const currency =
    summary.currency && summary.currency !== "MIXED"
      ? summary.currency
      : (summary.currency_breakdown?.[0]?.currency ?? "USD");
  const hasUsage = summary.call_count > 0;
  const costSeries = timeseries.items.map((item) => item.cost_total);
  const tokenSeries = timeseries.items.map((item) => item.total_tokens);
  const callSeries = timeseries.items.map((item) => item.call_count);

  return (
    <section className="space-y-5" data-testid="finops-dashboard">
      <Panel className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <Badge tone={alerts.count > 0 ? "orange" : "green"}>{alerts.count > 0 ? "Con alertas" : "Estable"}</Badge>
            <h2 className="text-[22px] font-semibold text-[var(--text-primary)]">FinOps IA</h2>
            <p className="text-[14px] leading-6 text-[var(--text-secondary)]">Consumo, costo y eficiencia por proveedor LLM.</p>
          </div>
          <AppButton icon={<RefreshCcw className="h-4 w-4" />} onClick={() => setRefreshIndex((current) => current + 1)}>
            Refrescar
          </AppButton>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
          <SelectField
            label="Periodo"
            value={filters.period}
            options={PERIOD_OPTIONS}
            onValueChange={(value) => setFilters((current) => ({ ...current, period: value as FilterState["period"] }))}
          />
          <TextField
            label="Provider"
            value={filters.providerKey}
            onValueChange={(value) => setFilters((current) => ({ ...current, providerKey: value }))}
          />
          <TextField
            label="Modelo"
            value={filters.modelName}
            onValueChange={(value) => setFilters((current) => ({ ...current, modelName: value }))}
          />
          <TextField
            label="Etapa"
            value={filters.stage}
            onValueChange={(value) => setFilters((current) => ({ ...current, stage: value }))}
          />
          <TextField
            label="Agente"
            value={filters.agentKey}
            onValueChange={(value) => setFilters((current) => ({ ...current, agentKey: value }))}
          />
          <TextField
            label="Usuario"
            value={filters.userId}
            onValueChange={(value) => setFilters((current) => ({ ...current, userId: value }))}
          />
          <TextField
            label="Proyecto"
            value={filters.projectId}
            onValueChange={(value) => setFilters((current) => ({ ...current, projectId: value }))}
          />
          <SelectField
            label="Top por"
            value={topConsumersDimension}
            options={TOP_CONSUMER_DIMENSION_OPTIONS}
            onValueChange={(value) => setTopConsumersDimension(value as TopConsumersDimension)}
          />
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-6">
        <KpiTile
          icon={<Banknote className="h-3.5 w-3.5" />}
          label="Costo total"
          value={formatCurrency(summary.cost_total, currency)}
          detail={`${formatCurrency(summary.cost_per_call, currency)} por llamada`}
          tone={summary.cost_total > 0 ? "blue" : "slate"}
        />
        <KpiTile
          icon={<Zap className="h-3.5 w-3.5" />}
          label="Tokens"
          value={formatNumber(summary.total_tokens)}
          detail={`${formatNumber(summary.input_tokens)} input / ${formatNumber(summary.output_tokens)} output`}
          tone="green"
        />
        <KpiTile
          icon={<Cpu className="h-3.5 w-3.5" />}
          label="Llamadas"
          value={formatNumber(summary.call_count)}
          detail={`${summary.retry_count} retries / ${summary.fallback_count} fallbacks`}
          tone={summary.call_count > 0 ? "violet" : "slate"}
        />
        <KpiTile
          icon={<Timer className="h-3.5 w-3.5" />}
          label="Latencia p95"
          value={formatMs(summary.p95_latency_ms)}
          detail={`${formatMs(summary.avg_latency_ms)} promedio`}
          tone="blue"
        />
        <KpiTile
          icon={<Gauge className="h-3.5 w-3.5" />}
          label="Error rate"
          value={formatPercent(summary.error_rate)}
          detail={`${summary.error_count} llamadas no exitosas`}
          tone={summary.error_count > 0 ? "red" : "green"}
        />
        <KpiTile
          icon={<AlertTriangle className="h-3.5 w-3.5" />}
          label="Alertas"
          value={formatNumber(alerts.count)}
          detail="Activas en el workspace"
          tone={alerts.count > 0 ? "orange" : "green"}
        />
      </div>

      <Panel className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[14px] font-semibold text-[var(--text-primary)]">Disponibilidad de datos FinOps</p>
            <p className="mt-1 text-[12px] leading-5 text-[var(--text-secondary)]">
              Fuente: `llm_usage_ledger` → agregaciones backend FinOps → endpoints summary/provider-breakdown/timeseries/top-consumers → visualización.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={hasUsage ? "green" : "slate"}>{hasUsage ? "Ledger con consumo" : "Ledger vacío"}</Badge>
            <Badge tone={availabilityTone(timeseries.availability.status)}>Serie: {timeseries.availability.status}</Badge>
            <Badge tone={availabilityTone(summary.estimated_availability?.status)}>
              Estimados: {summary.estimated_availability?.status ?? "no_reported"}
            </Badge>
            <Badge tone="blue">Top: {topConsumers.dimension}</Badge>
          </div>
        </div>
        {summary.estimated_availability?.reason ? (
          <p className="mt-3 text-[12px] leading-5 text-[var(--text-secondary)]">{summary.estimated_availability.reason}</p>
        ) : null}
        {timeseries.availability.reason ? (
          <p className="mt-1 text-[12px] leading-5 text-[var(--text-secondary)]">{timeseries.availability.reason}</p>
        ) : null}
      </Panel>

      {!hasUsage ? (
        <EmptyState
          className="px-0 py-6"
          title="Sin consumo LLM registrado"
          description="El ledger FinOps aun no tiene llamadas para los filtros actuales."
        />
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <Panel className="p-5 xl:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[18px] font-semibold text-[var(--text-primary)]">EvoluciÃ³n del consumo</p>
              <p className="text-[13px] text-[var(--text-secondary)]">
                Serie temporal real desde `llm_usage_ledger`; el grÃ¡fico usa Ã­ndice normalizado para comparar costo, tokens y llamadas.
              </p>
            </div>
            <Badge tone={timeseries.availability.status === "available" ? "green" : "slate"}>
              {timeseries.count} buckets
            </Badge>
          </div>
          {timeseries.items.length > 0 ? (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(220px,320px)]">
              <MultiSeriesChart
                className="min-h-[280px]"
                series={[
                  { color: "#2563eb", values: normalizeSeries(costSeries) },
                  { color: "#16a34a", values: normalizeSeries(tokenSeries) },
                  { color: "#f59e0b", values: normalizeSeries(callSeries) },
                ]}
              />
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge tone="blue">Costo</Badge>
                  <Badge tone="green">Tokens</Badge>
                  <Badge tone="orange">Llamadas</Badge>
                </div>
                {timeseries.items.slice(-4).map((item) => (
                  <div key={item.bucket} className="rounded-[10px] border border-[var(--border-default)] bg-white p-3">
                    <p className="text-[13px] font-semibold text-[var(--text-primary)]">{formatBucket(item.period_start)}</p>
                    <div className="mt-2 space-y-1 text-[12px] text-[var(--text-secondary)]">
                      <p>{formatCurrency(item.cost_total, item.currency === "MIXED" ? currency : item.currency)} Â· {formatNumber(item.total_tokens)} tokens</p>
                      <p>{item.call_count} llamadas Â· {item.error_count} errores Â· {item.fallback_count} fallbacks</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              className="px-0 py-4"
              title="Sin serie temporal LLM"
              description={timeseries.availability.reason || "No hay buckets para los filtros actuales."}
            />
          )}
        </Panel>

        <Panel className="p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[18px] font-semibold text-[var(--text-primary)]">Proveedor y modelo</p>
              <p className="text-[13px] text-[var(--text-secondary)]">Participacion por costo y tokens.</p>
            </div>
            <Badge tone="blue">{providerBreakdown.count} grupos</Badge>
          </div>
          {providerBreakdown.items.length > 0 ? (
            <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
              <DonutChart
                centerLabel="Grupos"
                centerValue={String(providerBreakdown.count)}
                segments={providerSegments(providerBreakdown.items)}
                size={190}
              />
              <BarsByDimension items={providerShareBars(providerBreakdown.items)} />
            </div>
          ) : (
            <EmptyState className="px-0 py-4" title="Sin consumo por proveedor" description="No hay datos para el filtro actual." />
          )}
        </Panel>

        <Panel className="p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[18px] font-semibold text-[var(--text-primary)]">Alertas FinOps</p>
              <p className="text-[13px] text-[var(--text-secondary)]">Presupuesto, fallback, modelos y costo por llamada.</p>
            </div>
            <Badge tone={alerts.count > 0 ? "orange" : "green"}>{alerts.count} activas</Badge>
          </div>
          <AlertsList alerts={alerts.items} />
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel className="p-5">
          <div className="mb-4 space-y-1">
            <p className="text-[18px] font-semibold text-[var(--text-primary)]">Top {TOP_CONSUMER_DIMENSION_LABELS[topConsumersDimension]}</p>
            <p className="text-[13px] text-[var(--text-secondary)]">
              Ranking por costo total usando dimensión `{topConsumersDimension}` del endpoint FinOps.
            </p>
          </div>
          {topConsumers.items.length > 0 ? (
            <SimpleTable
              columns={[TOP_CONSUMER_DIMENSION_SINGULAR_LABELS[topConsumersDimension], "Llamadas", "Costo", "Tokens", "Errores"]}
              rows={topConsumers.items.map((item) => [
                item.key,
                String(item.call_count),
                formatCurrency(item.cost_total, currency),
                formatNumber(item.total_tokens),
                String(item.error_count),
              ])}
            />
          ) : (
            <EmptyState className="px-0 py-4" title="Sin top consumers" description="No hay consumo agrupado para mostrar." />
          )}
        </Panel>

        <Panel className="p-5">
          <div className="mb-4 space-y-1">
            <p className="text-[18px] font-semibold text-[var(--text-primary)]">Detalle por modelo</p>
            <p className="text-[13px] text-[var(--text-secondary)]">Costo, volumen y fallas por combinacion.</p>
          </div>
          {providerBreakdown.items.length > 0 ? (
            <div className="space-y-3">
              {providerBreakdown.items.slice(0, 6).map((item) => (
                <div key={`${item.provider_key}:${item.model_name}`} className="rounded-[8px] border border-[var(--border-default)] bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="min-w-0 break-words text-[14px] font-semibold text-[var(--text-primary)]">
                      {item.provider_key} / {item.model_name}
                    </p>
                    <Badge tone={item.error_count > 0 ? "orange" : "green"}>{item.call_count} llamadas</Badge>
                  </div>
                  <div className="mt-3 space-y-2">
                    <StatRow label="Costo" value={formatCurrency(item.cost_total, currency)} tone="blue" />
                    <StatRow label="Tokens" value={formatNumber(item.total_tokens)} tone="green" />
                    <StatRow label="Errores" value={String(item.error_count)} tone={item.error_count > 0 ? "orange" : "slate"} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState className="px-0 py-4" title="Sin detalle por modelo" description="No hay modelos en el periodo." />
          )}
        </Panel>
      </div>
    </section>
  );
}
