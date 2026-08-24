"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CreditCard, ExternalLink, KeyRound, Layers3, ReceiptText, ShieldCheck } from "lucide-react";
import { TopUtilities, WorkspaceShell } from "@/components/lean/shell";
import { AppButton, Badge, Panel } from "@/components/lean/ui";
import { useSessionWorkspace } from "@/features/sessions/use-session-workspace";
import type { PlanAccessResponse, SessionSummary } from "@/features/sessions/types";
import { EmptyState, ErrorState, LoadingState } from "@/shared/states/runtime-states";

type LoadStatus = "idle" | "loading" | "ready" | "error";

type PlanAccessAdminPanelProps = {
  compact?: boolean;
  showDetailLink?: boolean;
};

type PlanAccessDetailViewProps = {
  compact?: boolean;
  data: PlanAccessResponse;
  selectedSession: SessionSummary;
};

function runAfterEffect(task: () => void) {
  const timeoutId = window.setTimeout(task, 0);
  return () => window.clearTimeout(timeoutId);
}

function tierTone(tier: string) {
  if (tier === "acp") {
    return "violet" as const;
  }
  if (tier === "blueprint_pro") {
    return "blue" as const;
  }
  return "green" as const;
}

function statusTone(status: string) {
  if (status === "approved" || status === "paid" || status === "active" || status === "settled") {
    return "green" as const;
  }
  if (status === "pending") {
    return "orange" as const;
  }
  if (status === "failed" || status === "rejected" || status === "canceled") {
    return "red" as const;
  }
  return "slate" as const;
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Sin fecha";
  }
  try {
    return new Intl.DateTimeFormat("es-CO", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatMoney(amountCents: number, currency: string) {
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 2,
    }).format(amountCents / 100);
  } catch {
    return `${currency} ${(amountCents / 100).toFixed(2)}`;
  }
}

export function PlanAccessDetailView({
  compact = false,
  data,
  selectedSession,
}: PlanAccessDetailViewProps) {
  const requestHistory = data.workspace_commercial.request_history;

  return (
    <div className={compact ? "grid gap-5 2xl:grid-cols-[0.82fr_1.18fr]" : "grid gap-6 xl:grid-cols-[0.85fr_1.15fr]"}>
      <Panel elevated className={compact ? "border-[var(--border-default)] bg-white p-5" : "border-[var(--border-default)] bg-white p-7"}>
        <Badge tone={tierTone(data.access.tier)}>{data.access.tier_label}</Badge>
        <h2 className={compact ? "mt-4 text-[22px] font-semibold tracking-[-0.03em] text-[var(--text-primary)]" : "mt-4 text-[28px] font-semibold tracking-[-0.03em] text-[var(--text-primary)]"}>
          Acceso actual del proyecto
        </h2>
        <p className="mt-3 text-[13px] leading-6 text-[var(--text-secondary)]">
          Scope: proyecto · Workspace: {data.workspace_id.slice(0, 8)} · Estado checkout: {data.access.checkout_state}
        </p>
        <div className="mt-5 grid gap-3">
          {data.access.entitlements.length === 0 ? (
            <p className="rounded-[16px] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4 text-[13px] text-[var(--text-secondary)]">
              Sin entitlements pagos activos; el proyecto opera en Blueprint gratuito.
            </p>
          ) : (
            data.access.entitlements.map((entitlement) => (
              <div key={entitlement.id} className="rounded-[16px] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[14px] font-semibold text-[var(--text-primary)]">{entitlement.product_key}</p>
                  <Badge tone={entitlement.status === "active" ? "green" : "orange"}>{entitlement.status}</Badge>
                </div>
                <p className="mt-2 text-[12px] text-[var(--text-secondary)]">
                  Fuente: {entitlement.source} · Revenue: {entitlement.non_revenue ? "no" : "sí"}
                </p>
              </div>
            ))
          )}
        </div>
      </Panel>

      <div className="space-y-5">
        <Panel className="border-[var(--border-default)] bg-white p-5">
          <div className="flex items-center gap-3">
            <Layers3 className="h-5 w-5 text-[var(--brand-primary)]" />
            <h3 className="text-[18px] font-semibold text-[var(--text-primary)]">Productos configurados</h3>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {data.products.map((product) => (
              <div key={product.product_key} className="rounded-[18px] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4">
                <Badge tone={tierTone(product.tier)}>{product.name}</Badge>
                <p className="mt-3 text-[13px] leading-6 text-[var(--text-secondary)]">{product.description}</p>
                <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  {product.capabilities.length} capabilities
                </p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="border-[var(--border-default)] bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <KeyRound className="h-5 w-5 text-[var(--brand-primary)]" />
              <h3 className="text-[18px] font-semibold text-[var(--text-primary)]">Capabilities efectivas</h3>
            </div>
            <Link href={`/projects/${selectedSession.id}/activity`}>
              <AppButton icon={<CreditCard className="h-4 w-4" />}>Ver actividad</AppButton>
            </Link>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {data.access.capabilities.map((capability) => (
              <div key={capability.capability} className="rounded-[16px] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[13px] font-semibold text-[var(--text-primary)]">{capability.label}</p>
                  <Badge tone={capability.allowed ? "green" : "orange"}>{capability.allowed ? "permitido" : capability.reason_code}</Badge>
                </div>
                <p className="mt-2 text-[12px] text-[var(--text-secondary)]">{capability.capability}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="border-[var(--border-default)] bg-white p-5">
          <div className="flex items-center gap-3">
            <ReceiptText className="h-5 w-5 text-[var(--brand-primary)]" />
            <h3 className="text-[18px] font-semibold text-[var(--text-primary)]">Saldo comercial del workspace</h3>
          </div>
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {data.workspace_commercial.products.map((product) => (
              <div key={product.product_key} className="rounded-[18px] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[15px] font-semibold text-[var(--text-primary)]">{product.display_name}</p>
                    <p className="mt-1 text-[12px] text-[var(--text-secondary)]">Producto: {product.product_key}</p>
                  </div>
                  <Badge tone={product.available_units > 0 ? "green" : "orange"}>
                    {product.available_units} unidad{product.available_units === 1 ? "" : "es"} disponible{product.available_units === 1 ? "" : "s"}
                  </Badge>
                </div>
                <div className="mt-4 grid gap-2 text-[12px] text-[var(--text-secondary)] sm:grid-cols-2">
                  <p>Gratis: {product.free_units}</p>
                  <p>Suscripción: {product.subscription_units}</p>
                  <p>Compra única: {product.one_time_units}</p>
                  <p>Ajustes: {product.adjustment_units}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge tone={product.pending_request_count > 0 ? "orange" : "slate"}>
                    {product.pending_request_count} solicitud{product.pending_request_count === 1 ? "" : "es"} pendiente{product.pending_request_count === 1 ? "" : "s"}
                  </Badge>
                  <Badge tone={product.open_debt_count > 0 ? "red" : "green"}>
                    {product.open_debt_count} deuda{product.open_debt_count === 1 ? "" : "s"} abierta{product.open_debt_count === 1 ? "" : "s"}
                  </Badge>
                </div>
                {product.debt_totals.length > 0 ? (
                  <div className="mt-4 rounded-[14px] border border-rose-200 bg-rose-50 p-3 text-[12px] text-rose-900">
                    <p className="font-semibold">Bloqueo por deuda abierta</p>
                    <p className="mt-1">
                      {product.debt_totals.map((entry) => formatMoney(entry.amount_cents, entry.currency)).join(" · ")}
                    </p>
                  </div>
                ) : null}
                <div className="mt-4 rounded-[14px] border border-[var(--border-default)] bg-white p-3">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    Oferta sugerida
                  </p>
                  {product.recommendation ? (
                    <>
                      <p className="mt-2 text-[14px] font-semibold text-[var(--text-primary)]">{product.recommendation.display_name}</p>
                      <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
                        {product.recommendation.granted_units_for_product} unidad{product.recommendation.granted_units_for_product === 1 ? "" : "es"} para {product.display_name.toLowerCase()}.
                      </p>
                      <p className="mt-2 text-[12px] text-[var(--text-secondary)]">{product.recommendation.recommendation_reason}</p>
                    </>
                  ) : (
                    <p className="mt-2 text-[12px] text-[var(--text-secondary)]">
                      No hay una oferta parametrizada visible para este producto.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="border-[var(--border-default)] bg-white p-5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-[var(--brand-primary)]" />
            <h3 className="text-[18px] font-semibold text-[var(--text-primary)]">Solicitudes del proyecto</h3>
          </div>
          <div className="mt-5 space-y-3">
            {requestHistory.length === 0 ? (
              <p className="rounded-[16px] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4 text-[13px] text-[var(--text-secondary)]">
                No hay solicitudes comerciales registradas para este proyecto.
              </p>
            ) : (
              requestHistory.map((request) => (
                <div key={request.id} className="rounded-[16px] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[14px] font-semibold text-[var(--text-primary)]">{request.capability}</p>
                      <p className="mt-1 text-[12px] text-[var(--text-secondary)]">{request.product_key}</p>
                    </div>
                    <Badge tone={statusTone(request.status)}>{request.status}</Badge>
                  </div>
                  <p className="mt-3 text-[12px] text-[var(--text-secondary)]">{request.reason || "Sin justificación registrada."}</p>
                  {request.resolution_note ? (
                    <p className="mt-2 text-[12px] text-[var(--text-secondary)]">Resolución: {request.resolution_note}</p>
                  ) : null}
                  <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    Creada {formatDateTime(request.created_at)}
                  </p>
                </div>
              ))
            )}
          </div>
        </Panel>

        <div className="grid gap-5 xl:grid-cols-2">
          <Panel className="border-[var(--border-default)] bg-white p-5">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-[var(--brand-primary)]" />
              <h3 className="text-[18px] font-semibold text-[var(--text-primary)]">Órdenes recientes</h3>
            </div>
            <div className="mt-5 space-y-3">
              {data.workspace_commercial.recent_orders.length === 0 ? (
                <p className="rounded-[16px] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4 text-[13px] text-[var(--text-secondary)]">
                  Este proyecto no tiene órdenes comerciales recientes.
                </p>
              ) : (
                data.workspace_commercial.recent_orders.map((order) => (
                  <div key={order.order_id} className="rounded-[16px] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[14px] font-semibold text-[var(--text-primary)]">{order.product_key}</p>
                        <p className="mt-1 text-[12px] text-[var(--text-secondary)]">{formatMoney(order.total_cents, order.currency)}</p>
                      </div>
                      <Badge tone={statusTone(order.status)}>{order.status}</Badge>
                    </div>
                    <p className="mt-3 text-[12px] text-[var(--text-secondary)]">Creada {formatDateTime(order.created_at)}</p>
                    {order.status === "pending" && order.checkout_url ? (
                      <a
                        className="mt-3 inline-flex min-h-11 items-center justify-center rounded-[12px] border border-[var(--brand-primary)] px-3 text-[13px] font-semibold text-[var(--brand-primary)] transition hover:bg-[var(--surface-subtle)]"
                        href={order.checkout_url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Continuar checkout
                      </a>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </Panel>

          <Panel className="border-[var(--border-default)] bg-white p-5">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-[var(--brand-primary)]" />
              <h3 className="text-[18px] font-semibold text-[var(--text-primary)]">Deudas abiertas</h3>
            </div>
            <div className="mt-5 space-y-3">
              {data.workspace_commercial.open_debts.length === 0 ? (
                <p className="rounded-[16px] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4 text-[13px] text-[var(--text-secondary)]">
                  El workspace no tiene deudas comerciales abiertas.
                </p>
              ) : (
                data.workspace_commercial.open_debts.map((debt) => {
                  const remaining = Math.max(0, debt.amount_cents - debt.settled_amount_cents);
                  return (
                    <div key={debt.id} className="rounded-[16px] border border-rose-200 bg-rose-50 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-[14px] font-semibold text-rose-950">{debt.reason_label || debt.reason_code}</p>
                          <p className="mt-1 text-[12px] text-rose-900">{debt.summary}</p>
                        </div>
                        <Badge tone={statusTone(debt.status)}>{debt.status}</Badge>
                      </div>
                      <p className="mt-3 text-[12px] text-rose-900">Pendiente: {formatMoney(remaining, debt.currency)}</p>
                      <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-rose-700">
                        Abierta {formatDateTime(debt.created_at)}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

export function PlanAccessAdminPanel({
  compact = true,
  showDetailLink = true,
}: PlanAccessAdminPanelProps = {}) {
  const { getPlanAccess, listStatus, selectedSession } = useSessionWorkspace();
  const [data, setData] = useState<PlanAccessResponse | null>(null);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!selectedSession) {
      return;
    }
    setStatus("loading");
    setError("");
    try {
      setData(await getPlanAccess(selectedSession.id));
      setStatus("ready");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No fue posible cargar Plan y acceso.");
      setStatus("error");
    }
  }, [getPlanAccess, selectedSession]);

  useEffect(() => {
    if (!selectedSession) {
      return runAfterEffect(() => {
        setData(null);
        setStatus("idle");
      });
    }
    return runAfterEffect(() => {
      void load();
    });
  }, [load, selectedSession]);

  return (
    <div className="space-y-5">
      <Panel className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge tone="slate">Plan contextual</Badge>
            <p className="mt-3 text-[18px] font-semibold text-[var(--text-primary)]">Plan, permisos y capacidades</p>
            <p className="mt-2 max-w-3xl text-[13px] leading-6 text-[var(--text-secondary)]">
              Revisa productos, entitlements, capabilities y solicitudes del proyecto activo dentro del contexto de Settings.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <AppButton onClick={() => void load()} variant="secondary">
              Refrescar
            </AppButton>
            {showDetailLink ? (
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[14px] border border-[var(--brand-primary)] bg-[var(--brand-primary)] px-4 text-[14px] font-semibold text-white transition hover:brightness-95"
                href="/settings/plan-access"
                style={{ color: "#ffffff" }}
              >
                Abrir detalle <ExternalLink aria-hidden="true" className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
        </div>
      </Panel>

      {listStatus === "loading" || status === "loading" || status === "idle" ? (
        <LoadingState title="Sincronizando acceso" description="Estamos cargando proyecto activo, productos y entitlements." />
      ) : null}

      {listStatus === "ready" && !selectedSession ? (
        <EmptyState title="No hay proyecto activo" description="Crea o selecciona un proyecto para consultar su plan." />
      ) : null}

      {status === "error" ? (
        <ErrorState title="No se pudo abrir Plan y acceso" description={error} action={<AppButton onClick={() => void load()}>Reintentar</AppButton>} />
      ) : null}

      {status === "ready" && data && selectedSession ? (
        <PlanAccessDetailView compact={compact} data={data} selectedSession={selectedSession} />
      ) : null}
    </div>
  );
}

export function SettingsPlanAccessPage() {
  return (
    <WorkspaceShell>
      <div className="min-h-screen px-8 py-7">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge tone="slate">Operación SaaS</Badge>
            <h1 className="mt-3 text-[34px] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
              Plan y acceso
            </h1>
            <p className="mt-2 max-w-3xl text-[15px] leading-7 text-[var(--text-secondary)]">
              Vista de detalle para productos, entitlements, capabilities y solicitudes del proyecto activo.
            </p>
          </div>
          <TopUtilities />
        </div>

        <PlanAccessAdminPanel compact={false} showDetailLink={false} />
      </div>
    </WorkspaceShell>
  );
}
