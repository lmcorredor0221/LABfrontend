"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Panel } from "@/components/lean/ui";
import { hasPlatformAdminRole } from "@/core/auth/types";
import { useAuth } from "@/core/auth/auth-context";
import {
  getPlatformAdminDashboard,
  type PlatformAdminDashboardData,
  type PlatformAdminProjectSummary,
  type PlatformAdminUserSummary,
  type PlatformAdminWorkspaceSummary,
} from "@/features/platform-admin/platform-admin-api";
import { EmptyState, ErrorState, LoadingState } from "@/shared/states/runtime-states";

type LoadState =
  | { data: null; error: null; status: "loading" }
  | { data: PlatformAdminDashboardData; error: null; status: "ready" }
  | { data: null; error: string; status: "error" };

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-CO").format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CO", {
    currency: "USD",
    maximumFractionDigits: 2,
    style: "currency",
  }).format(value);
}

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Panel className="p-5">
      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-3 text-[34px] font-semibold tracking-[-0.04em] text-[var(--text-primary)]">{value}</p>
      <p className="mt-2 text-[13px] leading-6 text-[var(--text-secondary)]">{hint}</p>
    </Panel>
  );
}

function UserRow({ user }: { user: PlatformAdminUserSummary }) {
  return (
    <div className="grid gap-3 border-b border-[var(--border-subtle)] px-5 py-4 last:border-0 lg:grid-cols-[minmax(0,1.3fr)_120px_120px_150px] lg:items-center">
      <div>
        <p className="font-semibold text-[var(--text-primary)]">{user.full_name || user.email}</p>
        <p className="text-[13px] text-[var(--text-secondary)]">{user.email}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {user.platform_roles.length ? user.platform_roles.map((role) => <Badge key={role} tone="blue">{role}</Badge>) : <Badge>workspace user</Badge>}
        </div>
      </div>
      <p className="text-[13px] text-[var(--text-secondary)]">{user.active_workspace_count} workspaces</p>
      <p className="text-[13px] text-[var(--text-secondary)]">{user.project_count} proyectos</p>
      <p className="text-[13px] font-semibold text-[var(--text-primary)]">{formatCurrency(user.llm_total_cost)}</p>
    </div>
  );
}

function WorkspaceRow({ workspace }: { workspace: PlatformAdminWorkspaceSummary }) {
  const hotmartTone = workspace.hotmart_enabled ? "green" : "orange";
  return (
    <div className="grid gap-3 border-b border-[var(--border-subtle)] px-5 py-4 last:border-0 lg:grid-cols-[minmax(0,1.3fr)_120px_140px_140px] lg:items-center">
      <div>
        <p className="font-semibold text-[var(--text-primary)]">{workspace.name}</p>
        <p className="text-[13px] text-[var(--text-secondary)]">{workspace.slug}</p>
        <p className="mt-1 text-[12px] text-[var(--text-muted)]">{workspace.owner_emails.join(", ") || "Sin owner detectado"}</p>
      </div>
      <p className="text-[13px] text-[var(--text-secondary)]">{workspace.member_count} miembros</p>
      <p className="text-[13px] text-[var(--text-secondary)]">{workspace.project_count} proyectos</p>
      <Badge tone={hotmartTone}>{workspace.hotmart_enabled ? workspace.hotmart_status || "Hotmart on" : "Hotmart off"}</Badge>
    </div>
  );
}

function ProjectRow({ project }: { project: PlatformAdminProjectSummary }) {
  return (
    <div className="grid gap-3 border-b border-[var(--border-subtle)] px-5 py-4 last:border-0 lg:grid-cols-[minmax(0,1.35fr)_150px_140px_140px] lg:items-center">
      <div>
        <p className="font-semibold text-[var(--text-primary)]">{project.title || "Proyecto sin titulo"}</p>
        <p className="text-[13px] text-[var(--text-secondary)]">{project.workspace_name || project.workspace_id}</p>
      </div>
      <Badge tone="slate">{project.commercial_tier}</Badge>
      <p className="text-[13px] text-[var(--text-secondary)]">{project.current_stage}</p>
      <p className="text-[13px] font-semibold text-[var(--text-primary)]">{formatNumber(project.llm_total_tokens)} tokens</p>
    </div>
  );
}

export function PlatformAdminPage() {
  const auth = useAuth();
  const [state, setState] = useState<LoadState>({ data: null, error: null, status: "loading" });
  const canUsePlatformAdmin = hasPlatformAdminRole(auth.user);

  useEffect(() => {
    if (!auth.isHydrated) {
      return;
    }
    if (!canUsePlatformAdmin) {
      return;
    }
    let cancelled = false;
    async function load() {
      setState({ data: null, error: null, status: "loading" });
      try {
        const data = await getPlatformAdminDashboard();
        if (!cancelled) {
          setState({ data, error: null, status: "ready" });
        }
      } catch (error) {
        if (!cancelled) {
          setState({ data: null, error: error instanceof Error ? error.message : "No se pudo cargar Admin Global.", status: "error" });
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [auth.isHydrated, canUsePlatformAdmin]);

  const totals = useMemo(() => {
    if (!state.data) {
      return { cost: 0, projects: 0, tokens: 0, users: 0, workspaces: 0 };
    }
    return {
      cost: state.data.users.reduce((total, user) => total + user.llm_total_cost, 0),
      projects: state.data.projects.length,
      tokens: state.data.users.reduce((total, user) => total + user.llm_total_tokens, 0),
      users: state.data.users.length,
      workspaces: state.data.workspaces.length,
    };
  }, [state.data]);

  if (!auth.isHydrated || state.status === "loading") {
    return <LoadingState title="Cargando consola global" description="Leyendo usuarios, workspaces y proyectos sin scope de workspace activo." />;
  }
  if (!canUsePlatformAdmin) {
    return <ErrorState title="Admin Global no disponible" description="Necesitas rol platform_admin para ver la consola global." />;
  }
  if (state.status === "error") {
    return <ErrorState title="Admin Global no disponible" description={state.error} />;
  }
  if (!state.data) {
    return <EmptyState title="Sin datos globales" description="Todavia no hay informacion de plataforma para mostrar." />;
  }

  return (
    <main className="min-h-screen bg-[var(--app-bg)] px-5 py-6 lg:px-8">
      <div className="mx-auto max-w-[1380px] space-y-6">
        <Panel className="p-7">
          <Badge tone="blue">Platform Admin</Badge>
          <h1 className="mt-4 text-[42px] font-semibold tracking-[-0.05em] text-[var(--text-primary)]">Admin Global LAB</h1>
          <p className="mt-3 max-w-4xl text-[15px] leading-7 text-[var(--text-secondary)]">
            Vista global real: usuarios, workspaces y proyectos se consultan desde `/platform/admin/*` sin depender del workspace activo.
          </p>
        </Panel>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Usuarios" value={formatNumber(totals.users)} hint="Cuentas visibles globalmente." />
          <StatCard label="Workspaces" value={formatNumber(totals.workspaces)} hint="Tenants detectados en plataforma." />
          <StatCard label="Proyectos" value={formatNumber(totals.projects)} hint="Sesiones/proyectos globales." />
          <StatCard label="Tokens LLM" value={formatNumber(totals.tokens)} hint="Consumo acumulado por usuario." />
          <StatCard label="Costo LLM" value={formatCurrency(totals.cost)} hint="Costo agregado reportado." />
        </div>

        <Panel className="overflow-hidden">
          <div className="border-b border-[var(--border-subtle)] p-5">
            <h2 className="text-[22px] font-semibold text-[var(--text-primary)]">Usuarios globales</h2>
          </div>
          {state.data.users.map((user) => <UserRow key={user.id} user={user} />)}
        </Panel>

        <Panel className="overflow-hidden">
          <div className="border-b border-[var(--border-subtle)] p-5">
            <h2 className="text-[22px] font-semibold text-[var(--text-primary)]">Workspaces</h2>
          </div>
          {state.data.workspaces.map((workspace) => <WorkspaceRow key={workspace.id} workspace={workspace} />)}
        </Panel>

        <Panel className="overflow-hidden">
          <div className="border-b border-[var(--border-subtle)] p-5">
            <h2 className="text-[22px] font-semibold text-[var(--text-primary)]">Proyectos</h2>
          </div>
          {state.data.projects.map((project) => <ProjectRow key={project.id} project={project} />)}
        </Panel>
      </div>
    </main>
  );
}
