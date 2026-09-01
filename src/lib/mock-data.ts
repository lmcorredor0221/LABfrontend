import { getProjectProductRoute } from "@/core/routing/routes";
import { LEAN_JOURNEY_STEPS } from "@/features/journey/journey-model";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  Bot,
  Boxes,
  FolderKanban,
  Gauge,
  Library,
  Link2,
  LayoutDashboard,
  Layers3,
  Network,
  NotebookPen,
  Settings,
  ShieldCheck,
} from "lucide-react";

const WORKSPACE_AGENT_ID = "workspace";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

function getHomeNavigationHref() {
  return "/";
}

function getAgentNavigationHref(activeSessionId?: string | null) {
  return `/agents/${activeSessionId ?? WORKSPACE_AGENT_ID}`;
}

function getProductNavigation(activeSessionId?: string | null): NavItem[] {
  if (!activeSessionId) {
    return [];
  }

  return [
    { label: "Blueprint", href: getProjectProductRoute(activeSessionId, "blueprint"), icon: Layers3 },
    { label: "ACP", href: getProjectProductRoute(activeSessionId, "acp"), icon: Boxes },
    { label: "Diagramas", href: getProjectProductRoute(activeSessionId, "diagrams"), icon: Network },
    { label: "Atencion", href: getProjectProductRoute(activeSessionId, "attention"), icon: AlertCircle },
  ];
}

export function getFullNavigation(activeSessionId?: string | null): NavItem[] {
  return [
    { label: "Inicio", href: getHomeNavigationHref(), icon: LayoutDashboard },
    { label: "Proyectos", href: "/projects", icon: FolderKanban },
    ...getProductNavigation(activeSessionId),
    { label: "Agentes", href: getAgentNavigationHref(activeSessionId), icon: Bot },
    { label: "Plantillas", href: "/templates", icon: NotebookPen },
    { label: "Evaluaciones", href: "/evaluations", icon: ShieldCheck },
    { label: "Monitoreo", href: "/monitoring", icon: Gauge },
    { label: "Biblioteca", href: "/library", icon: Library },
    { label: "Integraciones", href: "/integrations", icon: Link2 },
    { label: "Configuracion", href: "/settings", icon: Settings },
  ];
}

export function getIconNavigation(activeSessionId?: string | null): NavItem[] {
  return [
    { label: "Inicio", href: getHomeNavigationHref(), icon: LayoutDashboard },
    { label: "Proyectos", href: "/projects", icon: FolderKanban },
    ...getProductNavigation(activeSessionId),
    { label: "Agentes", href: getAgentNavigationHref(activeSessionId), icon: Bot },
    { label: "Plantillas", href: "/templates", icon: NotebookPen },
    { label: "Evaluaciones", href: "/evaluations", icon: ShieldCheck },
    { label: "Monitoreo", href: "/monitoring", icon: Gauge },
    { label: "Biblioteca", href: "/library", icon: Library },
    { label: "Integraciones", href: "/integrations", icon: Link2 },
    { label: "Configuracion", href: "/settings", icon: Settings },
    { label: "Modulos", href: "/library", icon: Boxes },
  ];
}

export const journeySteps = LEAN_JOURNEY_STEPS;
