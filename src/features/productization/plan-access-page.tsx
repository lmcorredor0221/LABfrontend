"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CreditCard, KeyRound, Layers3, ShieldCheck } from "lucide-react";
import { TopUtilities, WorkspaceShell } from "@/components/lean/shell";
import { AppButton, Badge, Panel } from "@/components/lean/ui";
import { useSessionWorkspace } from "@/features/sessions/use-session-workspace";
import type { PlanAccessResponse } from "@/features/sessions/types";
import { EmptyState, ErrorState, LoadingState } from "@/shared/states/runtime-states";

type LoadStatus = "idle" | "loading" | "ready" | "error";

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

export function SettingsPlanAccessPage() {
  const { getPlanAccess, listStatus, refreshList, selectedSession } = useSessionWorkspace();
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
    if (listStatus === "idle") {
      return runAfterEffect(() => {
        void refreshList({ loadActiveSnapshot: false });
      });
    }
    return undefined;
  }, [listStatus, refreshList]);

  useEffect(() => {
    if (!selectedSession) {
      return undefined;
    }
    return runAfterEffect(() => {
      void load();
    });
  }, [load, selectedSession]);

  return (
    <WorkspaceShell>
      <div className="min-h-screen px-8 py-7">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge tone="slate">Operacion SaaS</Badge>
            <h1 className="mt-3 text-[34px] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
              Plan y acceso
            </h1>
            <p className="mt-2 max-w-3xl text-[15px] leading-7 text-[var(--text-secondary)]">
              Revisa productos, entitlements, capabilities y solicitudes del proyecto activo sin mezclarlo con la
              administracion global del runtime LLM.
            </p>
          </div>
          <TopUtilities />
        </div>

        {listStatus === "loading" || status === "loading" || status === "idle" ? (
          <LoadingState title="Sincronizando acceso" description="Estamos cargando proyecto activo, productos y entitlements." />
        ) : null}

        {listStatus === "ready" && !selectedSession ? (
          <EmptyState title="No hay proyecto activo" description="Crea o selecciona un proyecto para consultar su plan." />
        ) : null}

        {status === "error" ? (
          <ErrorState title="No se pudo abrir Plan y acceso" description={error} action={<AppButton onClick={() => void load()}>Reintentar</AppButton>} />
        ) : null}

        {status === "ready" && data ? (
          <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
            <Panel elevated className="border-[var(--border-default)] bg-white p-7">
              <Badge tone={tierTone(data.access.tier)}>{data.access.tier_label}</Badge>
              <h2 className="mt-4 text-[28px] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                Acceso actual del proyecto
              </h2>
              <p className="mt-3 text-[15px] leading-7 text-[var(--text-secondary)]">
                Scope: proyecto · Workspace: {data.workspace_id.slice(0, 8)} · Estado checkout: {data.access.checkout_state}
              </p>
              <div className="mt-6 grid gap-3">
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
                        Fuente: {entitlement.source} · Revenue: {entitlement.non_revenue ? "no" : "si"}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </Panel>

            <div className="space-y-6">
              <Panel className="border-[var(--border-default)] bg-white p-6">
                <div className="flex items-center gap-3">
                  <Layers3 className="h-5 w-5 text-[var(--brand-primary)]" />
                  <h3 className="text-[22px] font-semibold text-[var(--text-primary)]">Productos configurados</h3>
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

              <Panel className="border-[var(--border-default)] bg-white p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <KeyRound className="h-5 w-5 text-[var(--brand-primary)]" />
                    <h3 className="text-[22px] font-semibold text-[var(--text-primary)]">Capabilities efectivas</h3>
                  </div>
                  <Link href={selectedSession ? `/projects/${selectedSession.id}/activity` : "/settings"}>
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

              <Panel className="border-[var(--border-default)] bg-white p-6">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-[var(--brand-primary)]" />
                  <h3 className="text-[22px] font-semibold text-[var(--text-primary)]">Solicitudes pendientes</h3>
                </div>
                <div className="mt-5 space-y-3">
                  {data.pending_requests.length === 0 ? (
                    <p className="rounded-[16px] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4 text-[13px] text-[var(--text-secondary)]">
                      No hay solicitudes comerciales pendientes para este proyecto.
                    </p>
                  ) : (
                    data.pending_requests.map((request) => (
                      <div key={request.id} className="rounded-[16px] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4">
                        <p className="text-[14px] font-semibold text-[var(--text-primary)]">{request.capability}</p>
                        <p className="mt-2 text-[12px] text-[var(--text-secondary)]">{request.reason}</p>
                      </div>
                    ))
                  )}
                </div>
              </Panel>
            </div>
          </div>
        ) : null}
      </div>
    </WorkspaceShell>
  );
}
