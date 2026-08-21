"use client";

import { Fragment, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Edit3, RefreshCcw, Save, X } from "lucide-react";
import { AppButton, Badge, KeyValue, Panel, ProgressBar, SelectField, TextField } from "@/components/lean/ui";
import { finOpsApi, type FinOpsApi } from "@/features/finops/finops-api";
import type {
  FinOpsBudgetListResponse,
  FinOpsBudgetPolicy,
  FinOpsBudgetPolicyCreateRequest,
  LLMBudgetPeriodType,
  LLMBudgetScopeType,
} from "@/features/finops/finops-contracts";
import { EmptyState, ErrorState, LoadingState } from "@/shared/states/runtime-states";

type BudgetPanelState =
  | { data: null; error: null; status: "idle" | "loading" }
  | { data: FinOpsBudgetListResponse; error: null; status: "ready" }
  | { data: null; error: string; status: "error" };

type BudgetDraft = {
  currency: string;
  limitAmount: string;
  modelName: string;
  periodType: LLMBudgetPeriodType;
  policyKey: string;
  providerKey: string;
  scopeType: LLMBudgetScopeType;
  scopeValue: string;
  stage: string;
  thresholdsText: string;
};

const SCOPE_OPTIONS: Array<{ label: string; value: LLMBudgetScopeType }> = [
  { label: "Workspace", value: "workspace" },
  { label: "Usuario", value: "user" },
  { label: "Proyecto", value: "project" },
  { label: "Iniciativa", value: "initiative" },
  { label: "Etapa", value: "stage" },
  { label: "Provider", value: "provider" },
  { label: "Modelo", value: "model" },
];

const PERIOD_OPTIONS: Array<{ label: string; value: LLMBudgetPeriodType }> = [
  { label: "Diario", value: "daily" },
  { label: "Semanal", value: "weekly" },
  { label: "Mensual", value: "monthly" },
  { label: "Custom", value: "custom" },
];

function createIdleState(): BudgetPanelState {
  return { data: null, error: null, status: "idle" };
}

function createEmptyDraft(): BudgetDraft {
  return {
    currency: "USD",
    limitAmount: "",
    modelName: "",
    periodType: "monthly",
    policyKey: "",
    providerKey: "",
    scopeType: "workspace",
    scopeValue: "",
    stage: "",
    thresholdsText: "50,80,95,100",
  };
}

function formatCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat("es-CO", {
    currency,
    maximumFractionDigits: value >= 100 ? 0 : 4,
    style: "currency",
  }).format(Number.isFinite(value) ? value : 0);
}

function statusTone(status: string) {
  if (status === "hard_limit") {
    return "red" as const;
  }
  if (status === "warning") {
    return "orange" as const;
  }
  if (status === "ok") {
    return "green" as const;
  }
  return "slate" as const;
}

function parseThresholds(value: string) {
  return value
    .split(",")
    .map((item) => Number.parseFloat(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0);
}

function draftFromPolicy(policy: FinOpsBudgetPolicy): BudgetDraft {
  return {
    currency: policy.currency,
    limitAmount: String(policy.limit_amount),
    modelName: policy.model_name,
    periodType: policy.period_type as LLMBudgetPeriodType,
    policyKey: policy.policy_key,
    providerKey: policy.provider_key,
    scopeType: policy.scope_type as LLMBudgetScopeType,
    scopeValue: policy.scope_value,
    stage: policy.stage,
    thresholdsText: policy.threshold_percentages.join(","),
  };
}

function validateDraft(draft: BudgetDraft) {
  const errors: Partial<Record<keyof BudgetDraft, string>> = {};
  const limitAmount = Number.parseFloat(draft.limitAmount);
  if (!Number.isFinite(limitAmount) || limitAmount <= 0) {
    errors.limitAmount = "El limite debe ser mayor a cero.";
  }
  if (["user", "project", "initiative"].includes(draft.scopeType) && !draft.scopeValue.trim()) {
    errors.scopeValue = "El scope requiere identificador.";
  }
  if (draft.scopeType === "stage" && !draft.stage.trim() && !draft.scopeValue.trim()) {
    errors.stage = "La etapa es obligatoria.";
  }
  if (draft.scopeType === "provider" && !draft.providerKey.trim() && !draft.scopeValue.trim()) {
    errors.providerKey = "El provider es obligatorio.";
  }
  if (draft.scopeType === "model" && !draft.modelName.trim() && !draft.scopeValue.trim()) {
    errors.modelName = "El modelo es obligatorio.";
  }
  if (parseThresholds(draft.thresholdsText).length === 0) {
    errors.thresholdsText = "Agrega al menos un umbral.";
  }
  return errors;
}

function payloadFromDraft(draft: BudgetDraft): FinOpsBudgetPolicyCreateRequest {
  const limitAmount = Number.parseFloat(draft.limitAmount);
  return {
    currency: draft.currency.trim() || "USD",
    limit_amount: Number.isFinite(limitAmount) ? limitAmount : 0,
    model_name: draft.scopeType === "model" ? draft.modelName.trim() || draft.scopeValue.trim() : draft.modelName.trim(),
    period_type: draft.periodType,
    policy_key: draft.policyKey.trim(),
    provider_key:
      draft.scopeType === "provider" ? draft.providerKey.trim() || draft.scopeValue.trim() : draft.providerKey.trim(),
    scope_type: draft.scopeType,
    scope_value: draft.scopeValue.trim(),
    stage: draft.scopeType === "stage" ? draft.stage.trim() || draft.scopeValue.trim() : draft.stage.trim(),
    threshold_percentages: parseThresholds(draft.thresholdsText),
  };
}

function BudgetUsageBar({ policy }: { policy: FinOpsBudgetPolicy }) {
  const evaluation = policy.evaluation;
  const percent = evaluation?.percent_consumed ?? 0;
  return (
    <div className="min-w-[180px] space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Badge tone={statusTone(evaluation?.status ?? "unconfigured")}>{evaluation?.status ?? "sin evaluacion"}</Badge>
        <span className="text-[12px] font-medium text-[var(--text-secondary)]">{percent.toFixed(1)}%</span>
      </div>
      <ProgressBar
        value={percent}
        color={evaluation?.is_hard_limit ? "var(--danger)" : evaluation?.is_warning ? "var(--warning)" : "var(--success)"}
      />
    </div>
  );
}

export function FinOpsBudgetPanel({
  api = finOpsApi,
  canManage,
}: {
  api?: FinOpsApi;
  canManage: boolean;
}) {
  const [state, setState] = useState<BudgetPanelState>(createIdleState);
  const [draft, setDraft] = useState<BudgetDraft>(createEmptyDraft);
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof BudgetDraft, string>>>({});
  const [expanded, setExpanded] = useState(false);
  const [expandedBudgetId, setExpandedBudgetId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [pending, setPending] = useState(false);

  async function loadBudgets() {
    setState({ data: null, error: null, status: "loading" });
    try {
      const data = await api.listBudgets({ include_inactive: true, include_evaluations: true });
      setState({ data, error: null, status: "ready" });
    } catch (error) {
      setState({
        data: null,
        error: error instanceof Error ? error.message : "No se pudieron cargar presupuestos FinOps.",
        status: "error",
      });
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadBudgets();
    }, 0);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit() {
    const validationErrors = validateDraft(draft);
    setErrors(validationErrors);
    setFeedback("");
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setPending(true);
    try {
      const payload = payloadFromDraft(draft);
      if (editingBudgetId) {
        await api.updateBudget(editingBudgetId, payload);
        setFeedback("Presupuesto actualizado.");
      } else {
        await api.createBudget(payload);
        setFeedback("Presupuesto creado.");
      }
      setDraft(createEmptyDraft());
      setEditingBudgetId(null);
      await loadBudgets();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No se pudo guardar el presupuesto.");
    } finally {
      setPending(false);
    }
  }

  const budgets = state.status === "ready" ? state.data.items : [];
  const activeBudgetCount = budgets.filter((budget) => budget.is_active).length;
  const budgetStatusLabel =
    state.status === "loading"
      ? "Cargando"
      : state.status === "error"
        ? "Error"
        : state.status === "ready"
          ? `${budgets.length} politicas`
          : "Pendiente";
  const budgetStatusTone =
    state.status === "error" ? "red" : state.status === "loading" ? "orange" : state.status === "ready" && budgets.length > 0 ? "green" : "slate";

  return (
    <Panel className="overflow-hidden p-0" id="workspace-finops-budgets">
      <div className="flex flex-wrap items-start justify-between gap-3 p-5">
        <div className="space-y-1">
          <Badge tone={canManage ? "green" : "slate"}>{canManage ? "Owner / Admin" : "Solo lectura"}</Badge>
          <p className="text-[20px] font-semibold text-[var(--text-primary)]">Presupuestos FinOps IA</p>
          <p className="text-[13px] leading-6 text-[var(--text-secondary)]">Limites por workspace, usuario, etapa, provider o modelo.</p>
          <div className="flex flex-wrap gap-2">
            <Badge tone={budgetStatusTone}>{budgetStatusLabel}</Badge>
            {state.status === "ready" ? <Badge tone="blue">{activeBudgetCount} activas</Badge> : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AppButton className="h-10 px-3 text-[12px]" icon={<RefreshCcw className="h-4 w-4" />} onClick={() => void loadBudgets()}>
            Refrescar
          </AppButton>
          <button
            aria-expanded={expanded}
            aria-label={expanded ? "Contraer presupuestos FinOps IA" : "Expandir presupuestos FinOps IA"}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-[var(--border-default)] bg-white text-[var(--brand-primary)] transition hover:bg-[var(--brand-soft)]"
            type="button"
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {expanded ? (
        <div className="border-t border-[var(--border-default)] p-5">
          {state.status === "loading" ? (
            <LoadingState className="px-0 py-5" title="Cargando presupuestos" description="Leyendo politicas y consumo acumulado." />
          ) : null}

          {state.status === "error" ? (
            <ErrorState
              className="px-0 py-5"
              title="Presupuestos no disponibles"
              description={state.error}
              action={<AppButton onClick={() => void loadBudgets()}>Reintentar</AppButton>}
            />
          ) : null}

          {state.status === "ready" ? (
            <div className="space-y-5">
          {budgets.length > 0 ? (
            <div className="overflow-hidden rounded-[18px] border border-[var(--border-default)] bg-white">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-[var(--border-default)] bg-[var(--surface-subtle)] text-[12px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    <th className="px-4 py-3 font-semibold">Politica</th>
                    <th className="hidden px-4 py-3 font-semibold md:table-cell">Scope</th>
                    <th className="hidden px-4 py-3 font-semibold lg:table-cell">Limite</th>
                    <th className="hidden px-4 py-3 font-semibold xl:table-cell">Consumo</th>
                    <th className="px-4 py-3 text-right font-semibold">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.map((policy) => {
                    const isExpanded = expandedBudgetId === policy.id;

                    return (
                      <Fragment key={policy.id}>
                        <tr className="border-b border-[var(--border-subtle)] align-top">
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-[13px] font-semibold text-[var(--text-primary)]">{policy.name || policy.policy_key}</p>
                              <Badge className="md:hidden" tone={policy.is_active ? "green" : "slate"}>{policy.is_active ? "Activa" : "Inactiva"}</Badge>
                            </div>
                            <p className="mt-1 text-[12px] text-[var(--text-secondary)]">{policy.policy_key}</p>
                            <p className="mt-1 text-[12px] text-[var(--text-muted)] lg:hidden">
                              {formatCurrency(policy.limit_amount, policy.currency)} · {policy.period_type}
                            </p>
                          </td>
                          <td className="hidden px-4 py-3 md:table-cell">
                            <p className="text-[13px] font-medium text-[var(--text-primary)]">{policy.scope_type}</p>
                            <p className="mt-1 break-words text-[12px] text-[var(--text-secondary)]">{policy.scope_value || "Workspace completo"}</p>
                          </td>
                          <td className="hidden px-4 py-3 lg:table-cell">
                            <p className="text-[13px] font-semibold text-[var(--text-primary)]">{formatCurrency(policy.limit_amount, policy.currency)}</p>
                            <p className="mt-1 text-[12px] text-[var(--text-secondary)]">{policy.period_type}</p>
                          </td>
                          <td className="hidden px-4 py-3 xl:table-cell">
                            <BudgetUsageBar policy={policy} />
                          </td>
                          <td className="px-4 py-2 text-right">
                            <button
                              aria-expanded={isExpanded}
                              aria-label={isExpanded ? `Contraer presupuesto ${policy.policy_key}` : `Expandir presupuesto ${policy.policy_key}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-[12px] border border-[var(--border-default)] bg-white text-[var(--brand-primary)] transition hover:bg-[var(--brand-soft)]"
                              type="button"
                              onClick={() => setExpandedBudgetId(isExpanded ? null : policy.id)}
                            >
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                          </td>
                        </tr>
                        {isExpanded ? (
                          <tr className="border-b border-[var(--border-default)] bg-[var(--surface-subtle)]">
                            <td className="px-4 py-4" colSpan={5}>
                              <div className="grid gap-4 rounded-[18px] border border-[var(--border-default)] bg-white p-4 xl:grid-cols-[minmax(0,1fr)_220px]">
                                <div className="grid gap-3 md:grid-cols-3">
                                  <KeyValue label="Scope" value={policy.scope_type} hint={policy.scope_value || "Workspace completo"} />
                                  <KeyValue label="Periodo" value={policy.period_type} hint={`Moneda ${policy.currency}`} />
                                  <KeyValue label="Umbrales" value={policy.threshold_percentages.join(", ")} hint="Porcentaje de consumo" />
                                  <KeyValue label="Provider" value={policy.provider_key || "Cualquier provider"} hint="Filtro opcional" />
                                  <KeyValue label="Modelo" value={policy.model_name || "Cualquier modelo"} hint="Filtro opcional" />
                                  <KeyValue label="Etapa" value={policy.stage || "Cualquier etapa"} hint="Filtro opcional" />
                                </div>
                                <div className="space-y-3">
                                  <BudgetUsageBar policy={policy} />
                                  {canManage ? (
                                    <AppButton
                                      className="h-9 rounded-[8px] px-3 text-[12px]"
                                      icon={<Edit3 className="h-3.5 w-3.5" />}
                                      onClick={() => {
                                        setDraft(draftFromPolicy(policy));
                                        setEditingBudgetId(policy.id);
                                        setErrors({});
                                        setFeedback("");
                                      }}
                                    >
                                      Editar
                                    </AppButton>
                                  ) : (
                                    <Badge tone="slate">Lectura</Badge>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState className="px-0 py-5" title="Sin presupuestos FinOps" description="No hay politicas activas o archivadas." />
          )}

          {canManage ? (
            <div className="rounded-[8px] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[16px] font-semibold text-[var(--text-primary)]">
                    {editingBudgetId ? "Editar presupuesto" : "Crear presupuesto"}
                  </p>
                  <p className="text-[12px] text-[var(--text-secondary)]">Scope, periodo, limite y umbrales.</p>
                </div>
                {editingBudgetId ? (
                  <AppButton
                    className="h-9 rounded-[8px] px-3 text-[12px]"
                    icon={<X className="h-3.5 w-3.5" />}
                    onClick={() => {
                      setDraft(createEmptyDraft());
                      setEditingBudgetId(null);
                      setErrors({});
                      setFeedback("");
                    }}
                  >
                    Cancelar
                  </AppButton>
                ) : null}
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <TextField
                  label="Identificador"
                  value={draft.policyKey}
                  onValueChange={(value) => setDraft((current) => ({ ...current, policyKey: value }))}
                />
                <SelectField
                  label="Scope"
                  value={draft.scopeType}
                  options={SCOPE_OPTIONS}
                  onValueChange={(value) => setDraft((current) => ({ ...current, scopeType: value as LLMBudgetScopeType }))}
                />
                <TextField
                  label="Scope value"
                  value={draft.scopeValue}
                  error={errors.scopeValue}
                  onValueChange={(value) => setDraft((current) => ({ ...current, scopeValue: value }))}
                />
                <SelectField
                  label="Periodo"
                  value={draft.periodType}
                  options={PERIOD_OPTIONS}
                  onValueChange={(value) => setDraft((current) => ({ ...current, periodType: value as LLMBudgetPeriodType }))}
                />
                <TextField
                  label="Limite USD"
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.limitAmount}
                  error={errors.limitAmount}
                  onValueChange={(value) => setDraft((current) => ({ ...current, limitAmount: value }))}
                />
                <TextField
                  label="Provider"
                  value={draft.providerKey}
                  error={errors.providerKey}
                  onValueChange={(value) => setDraft((current) => ({ ...current, providerKey: value }))}
                />
                <TextField
                  label="Modelo"
                  value={draft.modelName}
                  error={errors.modelName}
                  onValueChange={(value) => setDraft((current) => ({ ...current, modelName: value }))}
                />
                <TextField
                  label="Etapa"
                  value={draft.stage}
                  error={errors.stage}
                  onValueChange={(value) => setDraft((current) => ({ ...current, stage: value }))}
                />
                <TextField
                  className="xl:col-span-2"
                  label="Umbrales"
                  value={draft.thresholdsText}
                  error={errors.thresholdsText}
                  onValueChange={(value) => setDraft((current) => ({ ...current, thresholdsText: value }))}
                />
                <TextField
                  label="Moneda"
                  value={draft.currency}
                  onValueChange={(value) => setDraft((current) => ({ ...current, currency: value }))}
                />
                <div className="flex items-end">
                  <AppButton
                    className="w-full"
                    icon={<Save className="h-4 w-4" />}
                    loading={pending}
                    onClick={() => void handleSubmit()}
                    variant="primary"
                  >
                    {editingBudgetId ? "Guardar cambios" : "Crear presupuesto"}
                  </AppButton>
                </div>
              </div>
              {feedback ? <p className="mt-3 text-[13px] font-medium text-[var(--text-secondary)]">{feedback}</p> : null}
            </div>
          ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </Panel>
  );
}
