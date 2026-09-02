"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, FolderKanban, RefreshCcw, Settings } from "lucide-react";
import { AppButton, Badge, KeyValue, Panel, SimpleTable, StatRow } from "@/components/lean/ui";
import { OperationsModuleShell } from "@/features/operations/operations-module-shell";
import { buildIntegrationsSummary, formatDateTime, getStatusTone } from "@/features/operations/operations-adapter";
import { useOperationalSession } from "@/features/operations/use-operational-session";
import { getSessionProjectRoute } from "@/features/sessions/session-routes";
import type { IntegrationStatusEntry } from "@/features/sessions/session-contracts";
import { useLanguage } from "@/core/i18n/language-context";
import { EmptyState, ErrorState, LoadingState } from "@/shared/states/runtime-states";

type AsyncState<TData> =
  | { data: null; error: null; status: "idle" | "loading" }
  | { data: TData; error: null; status: "ready" }
  | { data: null; error: string; status: "error" };

function createIdleState<TData>(): AsyncState<TData> {
  return {
    data: null,
    error: null,
    status: "idle",
  };
}

export function IntegrationsWorkspacePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const {
    checkIntegrations,
    createSession,
    items,
    listError,
    listIntegrations,
    listStatus,
    selectedSession,
    selectedSnapshot,
    selectOperationalSession,
  } = useOperationalSession({
    requireSnapshot: true,
  });
  const [integrationsState, setIntegrationsState] = useState<AsyncState<IntegrationStatusEntry[]>>(createIdleState);

  const sessionOptions = items.map((item) => ({
    label: item.title,
    value: item.id,
  }));

  useEffect(() => {
    if (!selectedSession) {
      return;
    }

    let cancelled = false;

    async function loadIntegrations() {
      setIntegrationsState({ data: null, error: null, status: "loading" });
      try {
        const data = await listIntegrations(selectedSession.id);
        if (cancelled) {
          return;
        }
        setIntegrationsState({ data, error: null, status: "ready" });
      } catch (error) {
        if (cancelled) {
          return;
        }
        setIntegrationsState({
          data: null,
          error: error instanceof Error ? error.message : "No se pudo cargar el modulo de integraciones.",
          status: "error",
        });
      }
    }

    void loadIntegrations();
    return () => {
      cancelled = true;
    };
  }, [listIntegrations, selectedSession]);

  async function handleCreateSession() {
    const created = await createSession();
    router.push(getSessionProjectRoute(created));
  }

  async function handleRefresh() {
    if (!selectedSession || integrationsState.status === "loading") {
      return;
    }

    setIntegrationsState({ data: null, error: null, status: "loading" });
    try {
      const snapshot = await checkIntegrations(selectedSession.id);
      setIntegrationsState({ data: snapshot.integration_statuses, error: null, status: "ready" });
    } catch (error) {
      setIntegrationsState({
        data: null,
        error: error instanceof Error ? error.message : "No se pudo ejecutar el check real de integraciones.",
        status: "error",
      });
    }
  }

  if (listStatus === "loading" && items.length === 0) {
    return <LoadingState title="Cargando integraciones" description="Estamos recuperando las sesiones y el runtime conectado." />;
  }

  if (listStatus === "error" && items.length === 0) {
    return (
      <ErrorState
        title="No se pudo abrir integraciones"
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
        moduleLabel="Integraciones"
        title="Integraciones"
        description="Verifica servicios reales y catálogos del runtime con una sesión activa."
        sessionOptions={sessionOptions}
        sessionValue={null}
      >
        <EmptyState
          title="Sin sesion activa"
          description="Necesitas una sesion para consultar el estado real de integraciones."
          action={
            <AppButton variant="primary" onClick={() => void handleCreateSession()}>
              Crear sesion
            </AppButton>
          }
        />
      </OperationsModuleShell>
    );
  }

  const integrations = integrationsState.status === "ready" ? integrationsState.data : [];
  const integrationSummary = buildIntegrationsSummary(integrations, selectedSnapshot?.workspace_contract?.catalogs ?? []);

  return (
    <OperationsModuleShell
      moduleLabel={t("integrations.title", "Integraciones")}
      title={t("integrations.title", "Integraciones del sistema")}
      description={t("integrations.description", "Gestiona conectores, catálogos y estado de salud de integraciones activas.")}
      sessionOptions={sessionOptions}
      sessionValue={selectedSession.id}
      selectedSession={selectedSession}
      onSessionChange={(value) => void selectOperationalSession(value)}
      actions={
        <>
          <AppButton onClick={() => router.push(getSessionProjectRoute(selectedSession))} icon={<FolderKanban className="h-4 w-4" />}>
            {t("nav.projects", "Volver al proyecto")}
          </AppButton>
          <AppButton
            data-testid="integrations-check"
            onClick={() => void handleRefresh()}
            icon={<RefreshCcw className="h-4 w-4" />}
            loading={integrationsState.status === "loading"}
          >
            {t("integrations.checkNow", "Ejecutar check")}
          </AppButton>
        </>
      }
    >
      <div className="grid gap-4 xl:grid-cols-5">
        <Panel className="p-5">
          <KeyValue label="Servicios totales" value={String(integrationSummary.totalIntegrations)} hint="Derivados de /integrations" />
        </Panel>
        <Panel className="p-5">
          <KeyValue label="Configurados" value={String(integrationSummary.configuredCount)} hint="Con credenciales o runtime asociado" />
        </Panel>
        <Panel className="p-5">
          <KeyValue label="Reachable" value={String(integrationSummary.reachableCount)} hint="Checks exitosos del backend" />
        </Panel>
        <Panel className="p-5">
          <KeyValue label="Con riesgo" value={String(integrationSummary.degradedCount)} hint="Status distinto de healthy" />
        </Panel>
        <Panel className="p-5">
          <KeyValue label="Ultimo check" value={formatDateTime(integrationSummary.lastCheckedAt)} hint="Persistido por la sesion activa" />
        </Panel>
      </div>

      {integrationsState.status === "loading" ? (
        <LoadingState title="Consultando integraciones" description="Validando reachability y configuracion con el backend real." />
      ) : null}

      {integrationsState.status === "error" ? (
        <ErrorState
          title="No se pudieron cargar las integraciones"
          description={integrationsState.error}
          action={
            <AppButton variant="primary" onClick={() => void handleRefresh()}>
              Reintentar
            </AppButton>
          }
        />
      ) : null}

      {integrationsState.status === "ready" ? (
        <>
          <Panel className="p-6">
            <div className="mb-4 space-y-2">
              <p className="text-[20px] font-semibold text-[var(--text-primary)]">Servicios criticos</p>
              <p className="text-[14px] text-[var(--text-secondary)]">
                Solo se muestran nombres y estados retornados por el runtime, sin inventar infraestructura externa.
              </p>
            </div>
            {integrations.length > 0 ? (
              <div className="grid gap-4 xl:grid-cols-4">
                {integrations.slice(0, 4).map((item) => (
                  <Panel key={item.id} className="border-[var(--border-default)] p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[16px] font-semibold text-[var(--text-primary)]">{item.label}</p>
                        <p className="text-[13px] text-[var(--text-secondary)]">{item.integration_key}</p>
                      </div>
                      <Badge tone={getStatusTone(item.status)}>{item.status}</Badge>
                    </div>
                    <div className="mt-5 space-y-2">
                      <StatRow label="Configurada" value={item.configured ? "Si" : "No"} tone={item.configured ? "green" : "orange"} />
                      <StatRow label="Reachable" value={item.reachable ? "Si" : "No"} tone={item.reachable ? "green" : "red"} />
                      <StatRow label="Ultimo check" value={formatDateTime(item.checked_at)} />
                    </div>
                    <p className="mt-4 text-[13px] leading-6 text-[var(--text-secondary)]">{item.detail}</p>
                  </Panel>
                ))}
              </div>
            ) : (
              <EmptyState
                className="px-0 py-4"
                title="Sin integraciones registradas"
                description="Ejecuta un check real para inicializar el estado operativo del runtime."
              />
            )}
          </Panel>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_320px]">
            <Panel className="p-6">
              <div className="mb-4 space-y-2">
                <p className="text-[20px] font-semibold text-[var(--text-primary)]">Inventario operativo</p>
                <p className="text-[14px] text-[var(--text-secondary)]">
                  Tabla live de resultados por servicio para la sesion seleccionada.
                </p>
              </div>
              {integrations.length > 0 ? (
                <SimpleTable
                  columns={["Servicio", "Estado", "Configurada", "Reachable", "Ultimo check", "Detalle"]}
                  rows={integrations.map((item) => [
                    item.label,
                    <Badge key={`${item.id}-status`} tone={getStatusTone(item.status)}>
                      {item.status}
                    </Badge>,
                    item.configured ? "Si" : "No",
                    item.reachable ? "Si" : "No",
                    formatDateTime(item.checked_at),
                    item.detail,
                  ])}
                />
              ) : (
                <EmptyState
                  className="px-0 py-4"
                  title="Sin resultados de integraciones"
                  description="Aun no hay checks persistidos para esta sesion."
                />
              )}
            </Panel>

            <Panel className="p-6">
              <div className="mb-4 space-y-2">
                <p className="text-[20px] font-semibold text-[var(--text-primary)]">Acceso rapido</p>
                <p className="text-[14px] text-[var(--text-secondary)]">
                  Navega conservando la misma sesion operativa.
                </p>
              </div>
              <div className="space-y-4">
                <AppButton className="w-full" onClick={() => router.push("/monitoring")}>
                  Ir a Monitoreo
                </AppButton>
                <AppButton className="w-full" onClick={() => router.push("/library")}>
                  Ir a Biblioteca
                </AppButton>
                <AppButton className="w-full" icon={<CreditCard className="h-4 w-4" />} onClick={() => router.push("/admin/hotmart")}>
                  Administrar Hotmart
                </AppButton>
                <AppButton className="w-full" variant="primary" icon={<Settings className="h-4 w-4" />} onClick={() => router.push("/settings")}>
                  Ir a Configuracion
                </AppButton>
              </div>
            </Panel>
          </div>

          <Panel className="p-6">
            <div className="mb-4 space-y-2">
              <p className="text-[20px] font-semibold text-[var(--text-primary)]">Catalogos del workspace</p>
              <p className="text-[14px] text-[var(--text-secondary)]">
                Resumen de catálogos reales expuestos por `workspace_contract` para esta sesión.
              </p>
            </div>
            {integrationSummary.catalogCards.length > 0 ? (
              <div className="grid gap-4 xl:grid-cols-4">
                {integrationSummary.catalogCards.map((item) => (
                  <Panel key={item.catalogKey} className="border-[var(--border-default)] p-5">
                    <p className="text-[16px] font-semibold text-[var(--text-primary)]">{item.label}</p>
                    <p className="mt-1 text-[13px] text-[var(--text-secondary)]">Version {item.version}</p>
                    <div className="mt-4 space-y-2">
                      <StatRow label="Items" value={String(item.itemCount)} />
                      <StatRow label="Activos" value={String(item.activeCount)} tone="green" />
                    </div>
                  </Panel>
                ))}
              </div>
            ) : (
              <EmptyState
                className="px-0 py-4"
                title="Sin catalogos disponibles"
                description="El snapshot activo no expone catálogos del workspace todavía."
              />
            )}
          </Panel>
        </>
      ) : null}
    </OperationsModuleShell>
  );
}
