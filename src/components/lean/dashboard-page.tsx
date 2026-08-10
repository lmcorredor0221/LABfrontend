"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Activity, AlertCircle, Boxes, Download, FileDown, FolderKanban, Layers3, Network, Plus, ShieldCheck } from "lucide-react";
import { DonutChart } from "@/components/lean/charts";
import { PageChrome, StatusCard, TopUtilities, WorkspaceShell, WorkspaceUserCard } from "@/components/lean/shell";
import { AppButton, Badge, LinkRow, Panel, PanelHeader, ProgressBar, StatRow } from "@/components/lean/ui";
import { useAuth } from "@/core/auth/auth-context";
import { getProjectDiagramsRoute, getProjectProductRoute } from "@/core/routing/routes";
import {
  getPreferredProjectStage,
  getSessionProjectRoute,
  getSessionStageLabel,
  getSessionStatusLabel,
  getSessionStatusTone,
} from "@/features/sessions/session-routes";
import { useSessions } from "@/features/sessions/session-context";
import { journeySteps } from "@/lib/mock-data";
import { EmptyState, ErrorState, LoadingState } from "@/shared/states/runtime-states";

function DashboardFooter() {
  const { user } = useAuth();
  const initials =
    user?.full_name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "LB";

  return (
    <>
      <StatusCard title="Sistema operativo" subtitle="Salud del sistema" />
      <WorkspaceUserCard
        name={user?.full_name ?? "Lean Builder"}
        subtitle={user?.active_workspace_name ?? user?.email ?? "Workspace local"}
        initials={initials}
      />
    </>
  );
}

function HeaderMetricCard({
  title,
  value,
  subtitle,
  progress,
  badge,
}: {
  title: string;
  value: string;
  subtitle?: string;
  progress?: number;
  badge?: ReactNode;
}) {
  return (
    <Panel className="p-5">
      <p className="text-[13px] text-[var(--text-secondary)]">{title}</p>
      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <p className="text-[24px] font-semibold text-[var(--text-primary)]">{value}</p>
          {subtitle ? <p className="mt-2 text-[13px] text-[var(--text-secondary)]">{subtitle}</p> : null}
        </div>
        {badge}
      </div>
      {progress !== undefined ? <ProgressBar value={progress} className="mt-4" /> : null}
    </Panel>
  );
}

function SectionTitle({
  title,
  linkLabel = "Ver todas",
}: {
  title: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h3 className="text-[18px] font-semibold text-[var(--text-primary)]">{title}</h3>
      {linkLabel ? (
        <button type="button" className="text-[14px] font-medium text-[var(--brand-primary)]">
          {linkLabel}
        </button>
      ) : null}
    </div>
  );
}

function ListDot({
  color,
  title,
  detail,
}: {
  color: string;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-1 h-3 w-3 rounded-full" style={{ background: color }} />
      <div>
        <p className="text-[14px] font-medium text-[var(--text-primary)]">{title}</p>
        <p className="text-[13px] text-[var(--text-secondary)]">{detail}</p>
      </div>
    </div>
  );
}

function formatRelativeTimestamp(value?: string | null) {
  if (!value) {
    return "Sin actividad reciente";
  }

  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) {
    return "Reciente";
  }

  const diffMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60_000));

  if (diffMinutes < 1) {
    return "Ahora";
  }

  if (diffMinutes < 60) {
    return `Hace ${diffMinutes} min`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `Hace ${diffHours} h`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `Hace ${diffDays} d`;
}

function getGreetingName(fullName?: string | null) {
  if (!fullName) {
    return "equipo";
  }

  return fullName.split(" ").find(Boolean) ?? fullName;
}

export function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    activeSessionId,
    activeSnapshot,
    createSession,
    items,
    listError,
    listStatus,
    refreshList,
    selectSession,
    snapshotStatus,
  } = useSessions();

  const selectedSession = items.find((item) => item.id === activeSessionId) ?? items[0] ?? null;
  const readySessions = items.filter((item) => item.status === "ready").length;
  const reviewSessions = items.filter((item) => item.status === "needs_review").length;
  const failedSessions = items.filter((item) => item.status === "failed").length;
  const draftSessions = items.filter((item) => item.status === "draft").length;
  const progress = items.length > 0 ? Math.round((readySessions / items.length) * 100) : 0;
  const snapshotMatchesSelected = Boolean(activeSnapshot && selectedSession && activeSnapshot.session.id === selectedSession.id);
  const selectedSnapshot = snapshotMatchesSelected ? activeSnapshot : null;
  const activeJourneyIndex = selectedSession
    ? journeySteps.find((step) => step.stage === getPreferredProjectStage(selectedSession, selectedSnapshot ?? null))?.index ?? 1
    : 1;
  const nextJourneyStep = journeySteps.find((step) => step.index === Math.min(activeJourneyIndex + 1, journeySteps.length));
  const pendingApprovals = selectedSnapshot ? selectedSnapshot.approvals.filter((item) => item.status === "pending").length : 0;
  const latestActivity = selectedSnapshot ? selectedSnapshot.activity.slice(0, 4) : [];
  const workspaceCatalogCount = selectedSnapshot ? (selectedSnapshot.workspace_contract?.catalogs?.length ?? 0) : 0;
  const suggestionItems = [
    pendingApprovals > 0
      ? {
          label: `${pendingApprovals} aprobaciones pendientes`,
          detail: "Resuelvelas para desbloquear la siguiente etapa del blueprint.",
        }
      : null,
    selectedSession
      ? {
          label: `Sesion en ${getSessionStageLabel(selectedSession.current_stage)}`,
          detail: `Estado actual: ${getSessionStatusLabel(selectedSession.status)}.`,
        }
      : null,
    workspaceCatalogCount > 0
      ? {
          label: `${workspaceCatalogCount} catalogos del workspace listos`,
          detail: "El contrato del workspace ya fue cargado desde backend.",
        }
      : null,
  ].filter(Boolean) as Array<{ detail: string; label: string }>;
  const selectedSessionId = selectedSession?.id ?? null;
  const productHomeRoute = selectedSession ? getSessionProjectRoute(selectedSession, selectedSnapshot ?? null) : null;
  const blueprintRoute = selectedSessionId ? getProjectProductRoute(selectedSessionId, "blueprint") : null;
  const blueprintProRoute = selectedSessionId ? getProjectProductRoute(selectedSessionId, "blueprint_pro") : null;
  const acpRoute = selectedSessionId ? getProjectProductRoute(selectedSessionId, "acp") : null;
  const diagramsRoute = selectedSessionId ? getProjectDiagramsRoute(selectedSessionId) : null;
  const attentionRoute = selectedSessionId ? getProjectProductRoute(selectedSessionId, "attention") : null;
  const productActionCards = [
    {
      detail: "Entrada principal del producto SaaS para el proyecto activo.",
      Icon: Layers3,
      label: "Inicio SaaS",
      route: productHomeRoute,
      tone: "violet" as const,
    },
    {
      detail: "Resultado protegido, arquitectura y valor generado.",
      Icon: Layers3,
      label: "Blueprint",
      route: blueprintRoute,
      tone: "blue" as const,
    },
    {
      detail: "Oferta profesional, descarga y valor comercial.",
      Icon: FileDown,
      label: "Blueprint Profesional",
      route: blueprintProRoute,
      tone: "green" as const,
    },
    {
      detail: "Invitacion, gate y workspace premium de construccion.",
      Icon: Boxes,
      label: "ACP",
      route: acpRoute,
      tone: "orange" as const,
    },
    {
      detail: "Catalogo visual con upsell y restricciones de acceso.",
      Icon: Network,
      label: "Diagramas",
      route: diagramsRoute,
      tone: "violet" as const,
    },
    {
      detail: "Preguntas, gaps, aprobaciones y bloqueos transversales.",
      Icon: AlertCircle,
      label: "Atencion",
      route: attentionRoute,
      tone: pendingApprovals > 0 ? ("orange" as const) : ("slate" as const),
    },
  ];

  useEffect(() => {
    if (listStatus === "idle") {
      void refreshList();
    }
  }, [listStatus, refreshList]);

  useEffect(() => {
    if (!selectedSession) {
      return;
    }

    if (snapshotMatchesSelected || snapshotStatus !== "idle") {
      return;
    }

    void selectSession(selectedSession.id);
  }, [selectedSession, selectSession, snapshotMatchesSelected, snapshotStatus]);

  async function handleContinueSession() {
    if (!selectedSession) {
      return;
    }

    await selectSession(selectedSession.id, {
      loadSnapshot: false,
      persist: true,
    });
    router.push(getSessionProjectRoute(selectedSession, selectedSnapshot ?? null));
  }

  async function handleCreateSession() {
    const created = await createSession();
    router.push(getSessionProjectRoute(created));
  }

  async function handleOpenModule(route: string) {
    if (selectedSession) {
      await selectSession(selectedSession.id, {
        loadSnapshot: false,
        persist: true,
      });
    }

    router.push(route);
  }

  if (listStatus === "loading" && items.length === 0) {
    return (
      <WorkspaceShell sidebarFooter={<DashboardFooter />}>
        <PageChrome actions={<TopUtilities />}>
          <LoadingState
            title="Cargando sesiones reales"
            description="Estamos consultando la lista de sesiones del backend para abrir tu dashboard."
          />
        </PageChrome>
      </WorkspaceShell>
    );
  }

  if (listStatus === "error" && items.length === 0) {
    return (
      <WorkspaceShell sidebarFooter={<DashboardFooter />}>
        <PageChrome actions={<TopUtilities />}>
          <ErrorState
            title="No se pudo cargar el dashboard"
            description={listError?.message ?? "No fue posible recuperar las sesiones del backend."}
            action={
              <AppButton variant="primary" onClick={() => void refreshList({ force: true })}>
                Reintentar
              </AppButton>
            }
          />
        </PageChrome>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell sidebarFooter={<DashboardFooter />}>
      <PageChrome
        actions={
          <>
            <div className="rounded-[16px] border border-[var(--border-default)] bg-white px-4 py-3">
              <p className="text-[12px] text-[var(--text-muted)]">Workspace actual</p>
              <div className="mt-1 flex items-center gap-3 text-[16px] font-semibold">
                <FolderKanban className="h-4 w-4 text-[var(--text-secondary)]" />
                {selectedSession?.title ?? "Sin sesion activa"}
              </div>
            </div>
            <TopUtilities />
          </>
        }
      >
        <div className="space-y-8">
          <PanelHeader
            title={`Hola, ${getGreetingName(user?.full_name)}!`}
            description="Empieza desde la experiencia SaaS del proyecto activo o administra tu portafolio de sesiones."
          />

          <Panel className="overflow-hidden border-[var(--border-default)] bg-white p-0 shadow-[0_22px_70px_rgba(15,23,42,0.08)]">
            <div className="grid gap-5 border-b border-[var(--border-default)] bg-[radial-gradient(circle_at_top_left,rgba(79,70,245,0.12),transparent_36%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.08),transparent_34%),white] p-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="violet">Nueva navegacion SaaS</Badge>
                  <Badge tone="slate">{selectedSession?.title ?? "Sin proyecto activo"}</Badge>
                  <Badge tone={selectedSnapshot?.commercial_access?.tier === "acp" ? "violet" : selectedSnapshot?.commercial_access?.tier === "blueprint_pro" ? "blue" : "green"}>
                    {selectedSnapshot?.commercial_access?.tier_label ?? "Blueprint"}
                  </Badge>
                </div>
                <h2 className="mt-4 max-w-4xl text-[32px] font-semibold leading-[1.05] tracking-[-0.04em] text-[var(--text-primary)]">
                  Inicio ahora abre el producto: Blueprint, ACP, diagramas, pendientes y acceso.
                </h2>
                <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[var(--text-secondary)]">
                  El dashboard queda como portafolio. Para trabajar el proyecto, entra por la capa SaaS conectada al backend real y al modelo comercial definido en los planes.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <AppButton
                    variant="primary"
                    disabled={!productHomeRoute}
                    onClick={() => productHomeRoute && router.push(productHomeRoute)}
                  >
                    Abrir inicio SaaS
                  </AppButton>
                  <AppButton disabled={!diagramsRoute} onClick={() => diagramsRoute && router.push(diagramsRoute)}>
                    Ver diagramas
                  </AppButton>
                  <AppButton onClick={() => router.push("/settings/plan-access")} icon={<ShieldCheck className="h-4 w-4" />}>
                    Plan y acceso
                  </AppButton>
                </div>
              </div>

              <div className="rounded-[24px] border border-[var(--border-default)] bg-white/82 p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                  Siguiente accion
                </p>
                <p className="mt-2 text-[22px] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                  {selectedSession ? "Abrir producto SaaS" : "Crear primera sesion"}
                </p>
                <p className="mt-2 text-[13px] leading-6 text-[var(--text-secondary)]">
                  {selectedSession
                    ? "Desde alli se muestran el Blueprint, compras, ACP, diagramas y atencion en contexto."
                    : "Primero necesitamos crear una sesion para habilitar Blueprint y el recorrido LEAN."}
                </p>
                <div className="mt-5">
                  <ProgressBar value={selectedSession ? activeJourneyIndex * 12.5 : 0} />
                </div>
              </div>
            </div>

            <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-6">
              {productActionCards.map((item) => (
                <button
                  className="rounded-[18px] border border-[var(--border-default)] bg-[var(--surface-panel)] p-4 text-left transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!item.route}
                  key={item.label}
                  onClick={() => item.route && router.push(item.route)}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[var(--brand-soft)] text-[var(--brand-primary)]">
                      <item.Icon className="h-4 w-4" />
                    </span>
                    <Badge tone={item.tone}>{item.label === "Atencion" ? pendingApprovals : "SaaS"}</Badge>
                  </div>
                  <p className="mt-4 text-[14px] font-semibold text-[var(--text-primary)]">{item.label}</p>
                  <p className="mt-2 text-[12px] leading-5 text-[var(--text-secondary)]">{item.detail}</p>
                </button>
              ))}
            </div>
          </Panel>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <HeaderMetricCard
              title="Progreso general"
              value={`${progress}%`}
              subtitle={items.length > 0 ? `${readySessions} de ${items.length} sesiones listas` : "Todavia no hay sesiones creadas"}
              progress={progress}
            />
            <HeaderMetricCard title="Sesiones activas" value={String(items.length)} badge={<Badge tone="blue">Backend live</Badge>} />
            <HeaderMetricCard
              title="Requieren revision"
              value={String(reviewSessions)}
              badge={<Badge tone={reviewSessions > 0 ? "orange" : "green"}>{reviewSessions > 0 ? "Atencion" : "Estable"}</Badge>}
            />
            <HeaderMetricCard
              title="Riesgos activos"
              value={String(failedSessions)}
              badge={<Badge tone={failedSessions > 0 ? "red" : "slate"}>{failedSessions > 0 ? "Resolver" : "Sin bloqueos"}</Badge>}
            />
          </div>

          {items.length === 0 ? (
            <EmptyState
              title="Todavia no hay sesiones"
              description="Crea tu primera sesion para empezar el recorrido Lean con un session_id real."
              action={
                <AppButton data-testid="dashboard-create-session" variant="primary" onClick={() => void handleCreateSession()}>
                  Crear primera sesion
                </AppButton>
              }
            />
          ) : null}

          <Panel className="p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[18px] font-semibold">Timeline Lean del proyecto</h3>
              <Badge tone="slate">{journeySteps.length} etapas</Badge>
            </div>
            <div className="mt-7 overflow-x-auto pb-2">
              <div className="flex min-w-[860px] items-start justify-between gap-4">
                {journeySteps.map((step, index) => {
                  const isActive = step.index === activeJourneyIndex;
                  const isDone = step.index < activeJourneyIndex;

                  return (
                    <div key={step.label} className="flex flex-1 flex-col items-center text-center">
                      <div className="flex w-full items-center gap-2">
                        <span
                          className={`flex h-12 w-12 items-center justify-center rounded-full border text-[14px] font-semibold ${
                            isActive
                              ? "border-[rgba(79,70,245,0.18)] bg-[var(--brand-soft)] text-[var(--brand-primary)]"
                              : isDone
                                ? "border-[rgba(34,197,94,0.22)] bg-[var(--success-soft)] text-[var(--success)]"
                                : "border-[var(--border-default)] bg-white text-[var(--text-secondary)]"
                          }`}
                        >
                          {index + 1}
                        </span>
                        {index < journeySteps.length - 1 ? <div className="h-px flex-1 bg-[var(--border-default)]" /> : null}
                      </div>
                      <p className="mt-4 text-[15px] font-medium">{step.label}</p>
                      <p className={`mt-1 text-[13px] ${isActive ? "text-[var(--brand-primary)]" : "text-[var(--text-muted)]"}`}>
                        {isDone ? "Completada" : isActive ? "En curso" : "Pendiente"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-4 rounded-[18px] border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-5 py-4 md:flex-row md:items-center md:justify-between">
              <p className="text-[15px] text-[var(--text-secondary)]">
                Siguiente foco:{" "}
                <span className="font-medium text-[var(--text-primary)]">{nextJourneyStep?.label ?? "Package"}</span>
              </p>
              <AppButton variant="primary" onClick={() => void handleContinueSession()} disabled={!selectedSession}>
                Continuar sesion
              </AppButton>
            </div>
          </Panel>

          <div className="grid gap-5 xl:grid-cols-2">
            <Panel className="p-6">
              <SectionTitle title="Sugerencias de IA" />
              {suggestionItems.length > 0 ? (
                <div className="space-y-4">
                  {suggestionItems.map((item) => (
                    <LinkRow key={item.label} label={item.label} detail={item.detail} />
                  ))}
                </div>
              ) : (
                <p className="text-[14px] leading-7 text-[var(--text-secondary)]">
                  Selecciona o crea una sesion para obtener recomendaciones reales del workspace.
                </p>
              )}
            </Panel>

            <Panel className="p-6">
              <SectionTitle title="Actividad reciente" />
              {latestActivity.length > 0 ? (
                <div className="space-y-5">
                  {latestActivity.map((item) => (
                    <ListDot
                      key={`${item.message}-${item.created_at}`}
                      color={item.status === "ready" ? "#22c55e" : item.status === "failed" ? "#ef4444" : "#7c6cff"}
                      title={item.message}
                      detail={formatRelativeTimestamp(item.created_at)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-[14px] leading-7 text-[var(--text-secondary)]">
                  La sesion seleccionada todavia no registra actividad operativa reciente.
                </p>
              )}
            </Panel>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <Panel className="p-6">
              <SectionTitle title="Proyectos recientes" />
              <div className="space-y-4">
                {items.slice(0, 4).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => void selectSession(item.id)}
                    className="flex w-full items-start justify-between gap-4 rounded-[16px] border border-[var(--border-default)] px-4 py-4 text-left transition hover:-translate-y-0.5"
                  >
                    <div>
                      <p className="text-[16px] font-medium">{item.title}</p>
                      <p className="text-[13px] text-[var(--text-secondary)]">
                        {getSessionStageLabel(item.current_stage)} <span className="font-medium text-[var(--text-primary)]">• {getSessionStatusLabel(item.status)}</span>
                      </p>
                    </div>
                    <Badge tone={getSessionStatusTone(item.status)}>{formatRelativeTimestamp(item.updated_at)}</Badge>
                  </button>
                ))}
              </div>
            </Panel>

            <Panel className="p-6">
              <SectionTitle title="Estado del workspace" />
              <div className="grid items-center gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
                <DonutChart
                  centerValue={String(items.length)}
                  centerLabel="Total"
                  segments={
                    items.length > 0
                      ? [
                          { value: Math.max(readySessions, 0), color: "#22c55e" },
                          { value: Math.max(reviewSessions, 0), color: "#fbbf24" },
                          { value: Math.max(failedSessions, 0), color: "#ef4444" },
                          { value: Math.max(draftSessions, 0), color: "#94a3b8" },
                        ].filter((segment) => segment.value > 0)
                      : [{ value: 1, color: "#94a3b8" }]
                  }
                  size={200}
                />
                <div className="space-y-4">
                  <StatRow
                    label="Listas"
                    value={items.length > 0 ? `${readySessions} (${Math.round((readySessions / items.length) * 100)}%)` : "0"}
                    tone="green"
                  />
                  <StatRow
                    label="En revision"
                    value={items.length > 0 ? `${reviewSessions} (${Math.round((reviewSessions / items.length) * 100)}%)` : "0"}
                    tone="orange"
                  />
                  <StatRow
                    label="Con bloqueo"
                    value={items.length > 0 ? `${failedSessions} (${Math.round((failedSessions / items.length) * 100)}%)` : "0"}
                    tone="red"
                  />
                  <StatRow
                    label="Borradores"
                    value={items.length > 0 ? `${draftSessions} (${Math.round((draftSessions / items.length) * 100)}%)` : "0"}
                    tone="slate"
                  />
                </div>
              </div>
            </Panel>
          </div>

          <Panel className="p-6">
            <SectionTitle title="Actividad reciente del workspace" linkLabel="Ver toda la actividad" />
            <div className="space-y-3">
              {latestActivity.length > 0 ? (
                latestActivity.map((item) => (
                  <div
                    key={`${item.stage}-${item.created_at}`}
                    className="flex flex-col gap-3 rounded-[16px] border border-[var(--border-default)] px-4 py-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="text-[15px] font-medium">{item.message}</p>
                      <p className="text-[13px] text-[var(--text-secondary)]">{selectedSession?.title ?? "Workspace activo"}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[13px] text-[var(--text-secondary)]">{formatRelativeTimestamp(item.created_at)}</span>
                      <Badge tone={getSessionStatusTone(item.status)}>{getSessionStatusLabel(item.status)}</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[16px] border border-[var(--border-default)] px-4 py-4 text-[14px] text-[var(--text-secondary)]">
                  No hay actividad reciente para mostrar todavia.
                </div>
              )}
            </div>
          </Panel>

          <Panel className="p-6">
            <SectionTitle title="Acciones rapidas" linkLabel="" />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  title: "Nuevo proyecto",
                  detail: "Crea una nueva sesion y entra al recorrido Lean.",
                  Icon: Plus,
                  onClick: () => void handleCreateSession(),
                },
                {
                  title: "Continuar sesion",
                  detail: "Abre la etapa actual de la sesion seleccionada.",
                  Icon: FolderKanban,
                  onClick: () => void handleContinueSession(),
                },
                {
                  title: "Ver monitoreo",
                  detail: "Abre los modulos operativos para la sesion activa.",
                  Icon: Activity,
                  onClick: () => void handleOpenModule("/monitoring"),
                },
                {
                  title: "Abrir integraciones",
                  detail: "Revisa el estado del ecosistema conectado.",
                  Icon: Download,
                  onClick: () => void handleOpenModule("/integrations"),
                },
              ].map((item) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={item.onClick}
                  data-testid={item.title === "Nuevo proyecto" ? "dashboard-create-session" : undefined}
                  disabled={!selectedSession && item.title !== "Nuevo proyecto"}
                  className="rounded-[20px] border border-[var(--border-default)] bg-white px-5 py-5 text-left transition hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-[14px] bg-[var(--brand-soft)] text-[var(--brand-primary)]">
                    <item.Icon className="h-5 w-5" />
                  </div>
                  <p className="text-[17px] font-semibold">{item.title}</p>
                  <p className="mt-2 text-[14px] leading-6 text-[var(--text-secondary)]">{item.detail}</p>
                </button>
              ))}
            </div>
          </Panel>
        </div>
      </PageChrome>
    </WorkspaceShell>
  );
}
