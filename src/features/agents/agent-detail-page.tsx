"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Bot, FolderKanban, NotebookPen } from "lucide-react";
import { PageChrome, TopUtilities, WorkspaceShell } from "@/components/lean/shell";
import { AppButton, Badge, Checklist, KeyValue, MiniStat, Panel, ProgressBar } from "@/components/lean/ui";
import { buildMonitoringSummary, formatDateTime, formatRelativeTime, getStatusTone } from "@/features/operations/operations-adapter";
import { buildAgentProjection } from "@/features/agents/agent-projection";
import { getSessionProjectRoute } from "@/features/sessions/session-routes";
import { useSessions } from "@/features/sessions/session-context";
import type { MonitoringWorkspace } from "@/features/sessions/session-contracts";
import { EmptyState, ErrorState, LoadingState, RetryPanel } from "@/shared/states/runtime-states";

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

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function MetricCard({
  title,
  value,
  hint,
  tone = "slate",
}: {
  title: string;
  value: string | number;
  hint?: string;
  tone?: "green" | "orange" | "red" | "blue" | "violet" | "slate";
}) {
  return (
    <Panel className="p-5">
      <p className="text-[13px] text-[var(--text-secondary)]">{title}</p>
      <p className="mt-3 text-[28px] font-semibold text-[var(--text-primary)]">{value}</p>
      {hint ? (
        <Badge className="mt-4" tone={tone}>
          {hint}
        </Badge>
      ) : null}
    </Panel>
  );
}

export function AgentDetailPage({
  sessionId,
}: {
  sessionId: string;
}) {
  const router = useRouter();
  const {
    activeSessionId,
    activeSnapshot,
    getMonitoringWorkspace,
    items,
    listError,
    listStatus,
    refreshList,
    selectSession,
    snapshotError,
    snapshotStatus,
  } = useSessions();
  const [monitoringState, setMonitoringState] = useState<AsyncState<MonitoringWorkspace>>(createIdleState);

  useEffect(() => {
    if (listStatus === "idle") {
      void refreshList({ loadActiveSnapshot: false });
    }
  }, [listStatus, refreshList]);

  useEffect(() => {
    if (listStatus !== "ready") {
      return;
    }

    if (sessionId === "workspace") {
      const fallbackSession = items[0];
      if (fallbackSession) {
        router.replace(`/agents/${fallbackSession.id}`);
      }
      return;
    }

    if (activeSnapshot?.session.id === sessionId && snapshotStatus === "ready") {
      return;
    }

    if (activeSessionId === sessionId && snapshotStatus === "loading") {
      return;
    }

    void selectSession(sessionId, {
      forceSnapshot: activeSnapshot?.session.id !== sessionId,
      loadSnapshot: true,
      persist: true,
    });
  }, [activeSessionId, activeSnapshot?.session.id, items, listStatus, router, selectSession, sessionId, snapshotStatus]);

  const snapshot = activeSnapshot?.session.id === sessionId ? activeSnapshot : null;

  async function refreshMonitoring(targetSessionId: string) {
    setMonitoringState({ data: null, error: null, status: "loading" });
    try {
      const data = await getMonitoringWorkspace(targetSessionId);
      setMonitoringState({ data, error: null, status: "ready" });
    } catch (error) {
      setMonitoringState({
        data: null,
        error: getErrorMessage(error, "No se pudo cargar el monitoreo derivado de esta sesion."),
        status: "error",
      });
    }
  }

  useEffect(() => {
    if (!snapshot) {
      return;
    }

    let cancelled = false;
    const snapshotSessionId = snapshot.session.id;

    async function loadMonitoring() {
      try {
        const data = await getMonitoringWorkspace(snapshotSessionId);
        if (cancelled) {
          return;
        }
        setMonitoringState({ data, error: null, status: "ready" });
      } catch (error) {
        if (cancelled) {
          return;
        }
        setMonitoringState({
          data: null,
          error: getErrorMessage(error, "No se pudo cargar el monitoreo derivado de esta sesion."),
          status: "error",
        });
      }
    }

    void loadMonitoring();
    return () => {
      cancelled = true;
    };
  }, [getMonitoringWorkspace, snapshot]);

  const monitoringSummary =
    snapshot && monitoringState.status === "ready"
      ? buildMonitoringSummary(monitoringState.data, null)
      : null;
  const projection = useMemo(
    () => (snapshot ? buildAgentProjection(snapshot, monitoringState.status === "ready" ? monitoringState.data : null) : null),
    [monitoringState.data, monitoringState.status, snapshot],
  );

  if (listStatus === "loading" && items.length === 0) {
    return <LoadingState title="Buscando agentes derivados" description="Recuperando las sesiones disponibles para resolver la proyeccion del agente." />;
  }

  if (listStatus === "error" && items.length === 0) {
    return (
      <ErrorState
        title="No se pudo resolver la vista de Agentes"
        description={listError?.message ?? "No fue posible obtener la lista de sesiones."}
        action={
          <AppButton variant="primary" onClick={() => router.push("/")}>
            Volver al dashboard
          </AppButton>
        }
      />
    );
  }

  if (sessionId === "workspace" && listStatus === "ready" && items.length === 0) {
    return (
      <EmptyState
        title="No hay sesiones para proyectar como agente"
        description="Crea una sesion y completa su blueprint para habilitar esta vista derivada."
        action={
          <AppButton variant="primary" onClick={() => router.push("/")}>
            Ir al dashboard
          </AppButton>
        }
      />
    );
  }

  if ((snapshotStatus === "loading" && !snapshot) || (sessionId === "workspace" && listStatus !== "ready")) {
    return <LoadingState title="Resolviendo la proyeccion del agente" description="Estamos sincronizando blueprint, evaluacion y runtime desde la sesion vinculada." />;
  }

  if (snapshotStatus === "error" && !snapshot) {
    return (
      <ErrorState
        title="No se pudo abrir este agente derivado"
        description={snapshotError?.message ?? "La sesion vinculada no pudo recuperarse."}
        action={
          <AppButton variant="primary" onClick={() => router.push("/")}>
            Volver al dashboard
          </AppButton>
        }
      />
    );
  }

  if (!snapshot || !projection) {
    return <LoadingState title="Sincronizando proyeccion" description="Esperando la sesion activa para construir la vista del agente." />;
  }

  return (
    <WorkspaceShell>
      <PageChrome
        breadcrumbs={["Agentes", snapshot.session.title, "Proyeccion derivada"]}
        actions={
          <>
            <AppButton icon={<FolderKanban className="h-4 w-4" />} onClick={() => router.push(getSessionProjectRoute(snapshot.session))}>
              Abrir proyecto
            </AppButton>
            <AppButton icon={<NotebookPen className="h-4 w-4" />} onClick={() => router.push("/templates")}>
              Ver plantillas
            </AppButton>
            <AppButton icon={<Activity className="h-4 w-4" />} onClick={() => router.push("/monitoring")} variant="primary">
              Ver monitoreo
            </AppButton>
            <TopUtilities />
          </>
        }
      >
        <div className="space-y-8">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 data-testid="agent-projection-title" className="text-[44px] font-semibold text-[var(--text-primary)]">
                {snapshot.session.title}
              </h1>
              <Badge tone={projection.statusTone}>{projection.statusLabel}</Badge>
              <Badge tone="blue">Derivado de sesion</Badge>
            </div>
            <p className="max-w-4xl text-[16px] leading-7 text-[var(--text-secondary)]">{projection.description}</p>
            <p className="text-[13px] leading-6 text-[var(--text-secondary)]">
              Esta vista no persiste un agente independiente: proyecta el blueprint, la evaluacion y las senales runtime de la sesion <span className="font-medium text-[var(--text-primary)]">{snapshot.session.id}</span>.
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-5">
            <MetricCard title="Readiness" value={projection.readinessLabel} hint={projection.sessionStageLabel} tone="green" />
            <MetricCard title="Salud runtime" value={projection.runtimeHealthLabel} hint={monitoringSummary?.latestScoreLabel ?? "Sin telemetria"} tone="blue" />
            <MetricCard title="Herramientas" value={projection.toolCount} hint={`${projection.guardrailCount} guardrails`} tone="violet" />
            <MetricCard title="Integraciones" value={projection.integrationCount} hint={`${projection.pendingApprovals} approvals pendientes`} tone={projection.pendingApprovals > 0 ? "orange" : "green"} />
            <MetricCard title="Artefactos" value={projection.artifactCount} hint={`${projection.workflowTemplateCount} templates vinculados`} tone="slate" />
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-5">
              <Panel className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[var(--brand-soft)] text-[var(--brand-primary)]">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[20px] font-semibold text-[var(--text-primary)]">Blueprint operativo</p>
                    <p className="text-[14px] text-[var(--text-secondary)]">Resumen derivado de la sesion activa y de sus entregables persistidos.</p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <KeyValue label="Arquitectura" value={snapshot.blueprint?.architecture ?? "Sin arquitectura persistida"} />
                  <KeyValue label="Memoria" value={projection.memoryStrategy} />
                  <KeyValue label="Razonamiento" value={projection.reasoningPattern} />
                  <KeyValue label="Ultima actualizacion" value={formatDateTime(snapshot.session.updated_at)} />
                </div>
              </Panel>

              <Panel className="p-6">
                <p className="text-[20px] font-semibold text-[var(--text-primary)]">Capacidades activas</p>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="space-y-3 rounded-[18px] border border-[var(--border-default)] px-5 py-5">
                    <p className="text-[16px] font-semibold text-[var(--text-primary)]">Herramientas del blueprint</p>
                    {snapshot.blueprint?.tools.length ? (
                      snapshot.blueprint.tools.slice(0, 5).map((item) => (
                        <div key={item.name} className="rounded-[14px] border border-[var(--border-default)] px-4 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[14px] font-medium text-[var(--text-primary)]">{item.name}</p>
                            <Badge tone={item.requires_approval ? "orange" : "green"}>
                              {item.requires_approval ? "Approval" : "Directa"}
                            </Badge>
                          </div>
                          <p className="mt-2 text-[13px] leading-6 text-[var(--text-secondary)]">{item.purpose}</p>
                        </div>
                      ))
                    ) : (
                      <EmptyState className="px-0 py-4" title="Sin herramientas persistidas" description="Esta sesion aun no expone herramientas definidas en el blueprint." />
                    )}
                  </div>

                  <div className="space-y-3 rounded-[18px] border border-[var(--border-default)] px-5 py-5">
                    <p className="text-[16px] font-semibold text-[var(--text-primary)]">Guardrails y controles</p>
                    <Checklist
                      items={
                        snapshot.blueprint?.guardrails.length
                          ? snapshot.blueprint.guardrails.slice(0, 5).map((item) => ({
                              detail: "Control persistido dentro del blueprint de la sesion.",
                              label: item,
                              state: "done" as const,
                            }))
                          : [
                              {
                                detail: "Agrega guardrails en el blueprint para endurecer esta proyeccion.",
                                label: "Sin guardrails declarados",
                                state: "pending" as const,
                              },
                            ]
                      }
                    />
                  </div>
                </div>
              </Panel>

              <Panel className="p-6">
                <p className="text-[20px] font-semibold text-[var(--text-primary)]">Senales runtime</p>
                <div className="mt-5 grid gap-4 md:grid-cols-4">
                  <MiniStat label="Score" value={monitoringSummary?.latestScoreLabel ?? projection.readinessLabel} hint="Ultima corrida o telemetria" tone="green" />
                  <MiniStat label="Alertas activas" value={monitoringSummary?.activeAlerts.length ?? 0} hint="No resueltas" tone={(monitoringSummary?.activeAlerts.length ?? 0) > 0 ? "orange" : "green"} />
                  <MiniStat label="Errores" value={monitoringSummary?.errorCount ?? 0} hint="Persistidos" tone={(monitoringSummary?.errorCount ?? 0) > 0 ? "red" : "green"} />
                  <MiniStat label="Exports" value={monitoringSummary?.exportCount ?? 0} hint="Registrados" tone="blue" />
                </div>
                <div className="mt-5 space-y-3">
                  {(projection.recentActivity.length > 0 ? projection.recentActivity : snapshot.activity.slice(0, 4)).map((item) => (
                    <div key={`${item.created_at}-${item.message}`} className="rounded-[16px] border border-[var(--border-default)] px-4 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-[14px] font-medium text-[var(--text-primary)]">{item.message}</p>
                        <Badge tone={getStatusTone(item.status)}>{item.status}</Badge>
                      </div>
                      <p className="mt-2 text-[13px] text-[var(--text-secondary)]">
                        {item.stage.replaceAll("_", " ")} - {formatRelativeTime(item.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            <div className="space-y-5">
              <Panel className="p-6">
                <p className="text-[18px] font-semibold text-[var(--text-primary)]">Cobertura del blueprint</p>
                <p className="mt-3 text-[34px] font-semibold text-[var(--text-primary)]">{projection.coverageScore}%</p>
                <ProgressBar value={projection.coverageScore} className="mt-4" color="var(--brand-primary)" />
                <div className="mt-5 space-y-3">
                  <KeyValue label="Templates vinculados" value={projection.workflowTemplateCount} />
                  <KeyValue label="Warnings visibles" value={projection.validationWarnings.length} />
                  <KeyValue label="Sesion actual" value={projection.sessionStageLabel} />
                </div>
              </Panel>

              <Panel className="p-6">
                <p className="text-[18px] font-semibold text-[var(--text-primary)]">Riesgos y controles</p>
                <Checklist
                  className="mt-5"
                  items={
                    projection.validationWarnings.length > 0
                      ? projection.validationWarnings.map((item) => ({
                          detail: "Advertencia persistida en la ultima validacion disponible.",
                          label: item,
                          state: "alert" as const,
                        }))
                      : [
                          {
                            detail: "No hay warnings persistidos para esta proyeccion.",
                            label: "Sin warnings activos",
                            state: "done" as const,
                          },
                        ]
                  }
                />
              </Panel>

              <Panel className="p-6">
                <p className="text-[18px] font-semibold text-[var(--text-primary)]">Siguientes pasos</p>
                <Checklist
                  className="mt-5"
                  items={
                    projection.recommendations.length > 0
                      ? projection.recommendations.map((item) => ({
                          detail: "Sugerencia derivada del backend o del monitoreo de la sesion.",
                          label: item,
                          state: "pending" as const,
                        }))
                      : [
                          {
                            detail: "No hay recomendaciones pendientes en este momento.",
                            label: "Proyeccion estable",
                            state: "done" as const,
                          },
                        ]
                  }
                />
              </Panel>

              {monitoringState.status === "error" ? (
                <RetryPanel
                  title="Monitoreo no disponible"
                  description={monitoringState.error}
                  onRetry={() => void refreshMonitoring(snapshot.session.id)}
                />
              ) : null}
            </div>
          </div>
        </div>
      </PageChrome>
    </WorkspaceShell>
  );
}
