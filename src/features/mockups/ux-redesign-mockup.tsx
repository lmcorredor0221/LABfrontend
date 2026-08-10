"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  Bell,
  Bot,
  Boxes,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Database,
  Download,
  Eye,
  FileSearch,
  FileText,
  FolderKanban,
  Gauge,
  GitBranch,
  LayoutDashboard,
  Library,
  Link2,
  Lock,
  MessageSquareText,
  MoreHorizontal,
  Plus,
  Network,
  RefreshCcw,
  Route,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UploadCloud,
  Users,
  Waypoints,
  Zap,
} from "lucide-react";
import { AppButton, Badge, Panel, ProgressBar } from "@/components/lean/ui";
import { cn } from "@/lib/utils";

type BadgeTone = "violet" | "green" | "orange" | "red" | "blue" | "slate";
type ScreenKey =
  | "home"
  | "projects"
  | "discover"
  | "stage"
  | "tools"
  | "memory"
  | "run"
  | "results"
  | "diagrams"
  | "acp"
  | "validate";
type JourneyState = "done" | "active" | "pending" | "locked";

type ScreenDefinition = {
  icon: LucideIcon;
  key: ScreenKey;
  label: string;
  metric: string;
  subtitle: string;
};

type JourneyStep = {
  label: string;
  product: "Blueprint" | "ACP";
  state: JourneyState;
  subtitle: string;
};

type TaskItem = {
  action: string;
  detail: string;
  label: string;
  tone: BadgeTone;
};

type DiagramEntry = {
  category: string;
  icon: LucideIcon;
  product: "Blueprint" | "Blueprint Pro" | "ACP";
  state: "sample" | "available" | "locked";
  title: string;
};

const SCREENS: ScreenDefinition[] = [
  {
    icon: LayoutDashboard,
    key: "home",
    label: "Inicio",
    metric: "1 accion",
    subtitle: "Command center orientado a siguiente paso.",
  },
  {
    icon: FolderKanban,
    key: "projects",
    label: "Proyectos",
    metric: "12 activos",
    subtitle: "Portafolio con siguiente accion visible.",
  },
  {
    icon: FileSearch,
    key: "discover",
    label: "Descubrir",
    metric: "76%",
    subtitle: "Captura guiada del problema de negocio.",
  },
  {
    icon: FolderKanban,
    key: "stage",
    label: "Etapa",
    metric: "Disenar",
    subtitle: "Constructor task-first con rail vertical.",
  },
  {
    icon: Boxes,
    key: "tools",
    label: "Herramientas",
    metric: "4 minimas",
    subtitle: "Seleccion razonada y sin sobreaprovisionar.",
  },
  {
    icon: Brain,
    key: "memory",
    label: "Memoria",
    metric: "3 capas",
    subtitle: "Memoria corta, larga y RAG gobernado.",
  },
  {
    icon: Activity,
    key: "run",
    label: "IA en vivo",
    metric: "42%",
    subtitle: "Corrida LLM observable y trazable.",
  },
  {
    icon: Sparkles,
    key: "results",
    label: "Blueprint",
    metric: "90%",
    subtitle: "Resultados, ROI y compra del Blueprint.",
  },
  {
    icon: Network,
    key: "diagrams",
    label: "Diagramas",
    metric: "20+",
    subtitle: "Catalogo vertical con upsell.",
  },
  {
    icon: Boxes,
    key: "acp",
    label: "ACP",
    metric: "Premium",
    subtitle: "Invitacion y paquete de construccion.",
  },
  {
    icon: ClipboardCheck,
    key: "validate",
    label: "Validar",
    metric: "8/10",
    subtitle: "Escenarios, gaps y decisiones del ACP.",
  },
];

const GLOBAL_NAV: Array<{ active?: boolean; icon: LucideIcon; label: string }> = [
  { active: true, icon: LayoutDashboard, label: "Inicio" },
  { icon: FolderKanban, label: "Proyectos" },
  { icon: Bot, label: "Agentes" },
  { icon: Library, label: "Biblioteca" },
  { icon: ShieldCheck, label: "Evaluaciones" },
  { icon: Gauge, label: "Monitoreo" },
  { icon: Link2, label: "Integraciones" },
  { icon: Settings, label: "Admin" },
];

const JOURNEY_STEPS: JourneyStep[] = [
  { label: "Descubrir", product: "Blueprint", state: "done", subtitle: "Contexto validado" },
  { label: "Definir", product: "Blueprint", state: "done", subtitle: "Requisitos aprobados" },
  { label: "Disenar", product: "Blueprint", state: "active", subtitle: "Revision lista" },
  { label: "Herramientas", product: "Blueprint", state: "pending", subtitle: "Siguiente IA" },
  { label: "Memoria", product: "Blueprint", state: "pending", subtitle: "Fuentes y RAG" },
  { label: "Resultados", product: "Blueprint", state: "pending", subtitle: "Valor y ROI" },
  { label: "Validar", product: "ACP", state: "locked", subtitle: "Requiere ACP" },
  { label: "Package", product: "ACP", state: "locked", subtitle: "Exportable premium" },
];

const STAGE_TASKS: TaskItem[] = [
  {
    action: "Revisar",
    detail: "Confirma si el patron Planner + Critic + Tool Router representa el comportamiento esperado.",
    label: "Arquitectura propuesta",
    tone: "green",
  },
  {
    action: "Editar",
    detail: "Ajusta decisiones no delegables antes de promover a Herramientas.",
    label: "Reglas de decision",
    tone: "orange",
  },
  {
    action: "Consultar",
    detail: "7 documentos de memoria larga sustentan esta recomendacion.",
    label: "Evidencia usada",
    tone: "blue",
  },
];

const RUN_STEPS = [
  { label: "Preparar contexto corto", state: "done" },
  { label: "Recuperar memoria larga", state: "active" },
  { label: "Clasificar herramientas", state: "pending" },
  { label: "Detectar redundancias", state: "pending" },
  { label: "Construir propuesta", state: "pending" },
];

const DIAGRAMS: DiagramEntry[] = [
  { category: "Arquitectura", icon: Network, product: "Blueprint", state: "sample", title: "Arquitectura propuesta" },
  { category: "Orquestacion", icon: Waypoints, product: "Blueprint Pro", state: "locked", title: "Orquestacion agentica" },
  { category: "Herramientas", icon: Boxes, product: "Blueprint Pro", state: "locked", title: "Mapa de herramientas" },
  { category: "Memoria", icon: Brain, product: "Blueprint Pro", state: "locked", title: "Memoria y RAG" },
  { category: "Flujo", icon: Route, product: "Blueprint Pro", state: "locked", title: "Flujo runtime" },
  { category: "Conocimiento", icon: GitBranch, product: "Blueprint Pro", state: "locked", title: "Grafo de conocimiento" },
  { category: "Datos", icon: Database, product: "ACP", state: "locked", title: "Datos y contratos" },
  { category: "Seguridad", icon: ShieldCheck, product: "Blueprint Pro", state: "locked", title: "Seguridad y guardrails" },
  { category: "Implementacion", icon: Download, product: "ACP", state: "locked", title: "Launcher ACP" },
  { category: "Evaluacion", icon: FileSearch, product: "ACP", state: "locked", title: "Test Suite agentico" },
  { category: "Roadmap", icon: Clock3, product: "Blueprint Pro", state: "locked", title: "Roadmap de construccion" },
  { category: "ROI", icon: Gauge, product: "Blueprint", state: "available", title: "Comparativa de valor" },
  { category: "Fuentes", icon: Library, product: "Blueprint Pro", state: "locked", title: "Lineage documental" },
  { category: "Prompts", icon: Sparkles, product: "ACP", state: "locked", title: "Prompt Pack" },
  { category: "Contratos", icon: FileText, product: "ACP", state: "locked", title: "Tool contracts" },
  { category: "Runtime", icon: Activity, product: "ACP", state: "locked", title: "Runtime workflow" },
  { category: "Gaps", icon: AlertTriangle, product: "ACP", state: "locked", title: "Gap closure map" },
  { category: "Preguntas", icon: Bot, product: "ACP", state: "locked", title: "Implementation questions" },
  { category: "Costos", icon: Gauge, product: "Blueprint", state: "available", title: "Costo y esfuerzo" },
  { category: "Versiones", icon: GitBranch, product: "Blueprint Pro", state: "locked", title: "Version lineage" },
  { category: "Permisos", icon: Lock, product: "ACP", state: "locked", title: "Permission matrix" },
  { category: "Eventos", icon: Activity, product: "ACP", state: "locked", title: "Event contracts" },
  { category: "Despliegue", icon: Boxes, product: "ACP", state: "locked", title: "Deployment guide" },
  { category: "Observabilidad", icon: Eye, product: "ACP", state: "locked", title: "Observability map" },
];

const journeyStateStyles: Record<JourneyState, string> = {
  active: "border-[#0f766e] bg-[#0f766e] text-white shadow-[0_12px_30px_rgba(15,118,110,0.22)]",
  done: "border-emerald-200 bg-emerald-50 text-emerald-700",
  locked: "border-dashed border-slate-300 bg-slate-100 text-slate-400",
  pending: "border-slate-200 bg-white text-slate-500",
};

function MetricCard({
  detail,
  label,
  value,
}: {
  detail: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/70 bg-white/78 p-5 shadow-[0_18px_46px_rgba(15,23,42,0.08)] backdrop-blur">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-[30px] font-semibold tracking-[-0.04em] text-slate-950">{value}</p>
      <p className="mt-2 text-[12px] leading-5 text-slate-500">{detail}</p>
    </div>
  );
}

function ScreenSelector({
  active,
  onSelect,
}: {
  active: ScreenKey;
  onSelect: (screen: ScreenKey) => void;
}) {
  return (
    <div className="scrollbar-subtle flex snap-x gap-3 overflow-x-auto pb-3" aria-label="Pantallas del prototipo">
      {SCREENS.map((screen) => {
        const Icon = screen.icon;
        const isActive = active === screen.key;

        return (
          <button
            key={screen.key}
            aria-pressed={isActive}
            className={cn(
              "group min-w-[190px] flex-1 snap-start rounded-[24px] border p-4 text-left shadow-[0_12px_34px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 xl:min-w-[205px]",
              isActive
                ? "border-[#0f766e]/30 bg-[#0f766e] text-white"
                : "border-white/70 bg-white/78 text-slate-900 hover:border-[#0f766e]/20",
            )}
            onClick={() => onSelect(screen.key)}
            type="button"
          >
            <div className="flex items-center justify-between gap-3">
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-[16px]",
                  isActive ? "bg-white/16 text-white" : "bg-[#ecfdf5] text-[#0f766e]",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <Badge tone={isActive ? "green" : "slate"} className={isActive ? "border-white/20 bg-white/14 text-white" : ""}>
                {screen.metric}
              </Badge>
            </div>
            <p className="mt-4 text-[15px] font-semibold">{screen.label}</p>
            <p className={cn("mt-1 text-[12px] leading-5", isActive ? "text-white/68" : "text-slate-500")}>{screen.subtitle}</p>
          </button>
        );
      })}
    </div>
  );
}

function GlobalSidebar({
  active,
  onSelect,
}: {
  active: ScreenKey;
  onSelect: (screen: ScreenKey) => void;
}) {
  return (
    <aside className="hidden w-[88px] shrink-0 flex-col rounded-[34px] border border-white/10 bg-[#07152c] p-4 text-white shadow-[0_30px_80px_rgba(7,21,44,0.32)] lg:flex">
      <div className="flex h-12 w-12 items-center justify-center rounded-[20px] bg-white text-[#07152c] shadow-[0_16px_36px_rgba(255,255,255,0.16)]">
        <Zap className="h-5 w-5" />
      </div>
      <nav className="mt-8 space-y-3" aria-label="Mockup navigation">
        {GLOBAL_NAV.map((item) => {
          const Icon = item.icon;
          const destination = item.label === "Proyectos" ? "projects" : item.label === "Inicio" ? "home" : null;
          const isActive = destination === active || (!destination && item.active && active === "home");
          return (
            <button
              key={item.label}
              aria-label={item.label}
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-[18px] border transition hover:bg-white/10",
                isActive ? "border-[#99f6e4]/30 bg-[#0f766e] text-white" : "border-transparent text-white/58",
              )}
              onClick={() => destination && onSelect(destination)}
              type="button"
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
      </nav>
      <div className="mt-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/8 text-[13px] font-bold">
        LB
      </div>
    </aside>
  );
}

function MockupShell({
  active,
  children,
  onSelect,
}: {
  active: ScreenKey;
  children: ReactNode;
  onSelect: (screen: ScreenKey) => void;
}) {
  return (
    <div className="min-h-screen bg-[#eef2ef] p-3 text-slate-950 sm:p-5">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-28 top-16 h-72 w-72 rounded-full bg-[#a7f3d0]/40 blur-3xl" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[#fcd34d]/25 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[#93c5fd]/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-[1880px] gap-4">
        <GlobalSidebar active={active} onSelect={onSelect} />
        <main className="min-w-0 flex-1">
          <div className="rounded-[38px] border border-white/70 bg-[#f8faf7]/88 p-4 shadow-[0_32px_90px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-6">
            <header className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-4xl">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="green">Prototipo alta fidelidad</Badge>
                  <Badge tone="blue">Task-first AI SaaS</Badge>
                  <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Lean Agent Builder</span>
                </div>
                <h1 className="mt-4 max-w-4xl text-[40px] font-semibold leading-[0.95] tracking-[-0.06em] text-slate-950 sm:text-[64px]">
                  El producto se entiende antes del primer clic.
                </h1>
                <p className="mt-4 max-w-3xl text-[15px] leading-7 text-slate-600">
                  Recorrido navegable basado en la auditoria UX/UI/IA: una tarea dominante, IA observable, evidencia
                  progresiva y valor comercial integrado al journey.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 xl:w-[520px]">
                <MetricCard detail="Accion visible en cada etapa." label="Foco" value="1 CTA" />
                <MetricCard detail="Estados de extremo a extremo." label="Cobertura" value="11 vistas" />
                <MetricCard detail="Catalogo comercial visible." label="Valor" value="24 diagramas" />
              </div>
            </header>

            <div className="mt-7">
              <ScreenSelector active={active} onSelect={onSelect} />
            </div>

            <div className="mt-7">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}

function MockChrome({
  children,
  eyebrow,
  title,
  toolbar,
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
  toolbar?: ReactNode;
}) {
  return (
    <Panel className="overflow-hidden border-white/70 bg-white/72 shadow-[0_28px_70px_rgba(15,23,42,0.10)]">
      <div className="border-b border-slate-200/70 bg-white/80 px-5 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">{eyebrow}</p>
            <h2 className="mt-1 text-[28px] font-semibold tracking-[-0.04em] text-slate-950">{title}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {toolbar}
            <button
              aria-label="Notificaciones"
              className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-slate-200 bg-white text-slate-600"
              type="button"
            >
              <Bell className="h-4 w-4" />
            </button>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#07152c] text-[13px] font-bold text-white">
              LB
            </div>
          </div>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </Panel>
  );
}

function HomeMockup({ onNavigate }: { onNavigate: (screen: ScreenKey) => void }) {
  return (
    <MockChrome
      eyebrow="Inicio / Command center"
      title="Todo empieza por lo que requiere tu accion"
      toolbar={
        <div className="flex min-w-[260px] items-center gap-3 rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-slate-500">
          <Search className="h-4 w-4" />
          <span className="text-[13px]">Buscar proyecto, gap o diagrama</span>
        </div>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="space-y-5">
          <section className="overflow-hidden rounded-[32px] border border-[#0f766e]/20 bg-[linear-gradient(135deg,#052e2b_0%,#0f766e_58%,#f59e0b_135%)] p-6 text-white shadow-[0_28px_80px_rgba(15,118,110,0.24)]">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="max-w-2xl">
                <Badge tone="green" className="border-white/20 bg-white/14 text-white">Necesita tu accion</Badge>
                <h3 className="mt-5 text-[38px] font-semibold leading-[1.02] tracking-[-0.05em]">
                  Aprueba la estrategia de memoria para cerrar el Blueprint.
                </h3>
                <p className="mt-4 max-w-2xl text-[15px] leading-7 text-white/72">
                  El LLM ya consolido Discover, Definir, Disenar y Herramientas. Solo faltan 3 ajustes sugeridos antes
                  de mostrar el resultado comercial.
                </p>
              </div>
              <div className="grid min-w-[220px] gap-3 rounded-[24px] border border-white/12 bg-white/10 p-4">
                <div>
                  <p className="text-[12px] text-white/56">ETA para cerrar</p>
                  <p className="mt-1 text-[32px] font-semibold">7 min</p>
                </div>
                <ProgressBar className="bg-white/16" color="#fcd34d" value={63} />
                <p className="text-[12px] text-white/62">63% del producto Blueprint</p>
              </div>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <AppButton className="border-white bg-white text-[#052e2b] hover:bg-white/92" onClick={() => onNavigate("memory")} variant="secondary">
                Continuar revision
              </AppButton>
              <AppButton className="border-white/20 bg-white/8 text-white hover:bg-white/12" onClick={() => onNavigate("results")} variant="ghost">
                Ver resumen generado
              </AppButton>
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-3">
            {[
              ["Blueprint comercial", "90%", "Listo para mostrar valor"],
              ["ACP accionable", "100%", "Paquete premium estimado"],
              ["Ahorro potencial", "68%", "Frente a desarrollo tradicional"],
            ].map(([label, value, detail]) => (
              <div key={label} className="rounded-[26px] border border-slate-200 bg-white p-5">
                <p className="text-[12px] text-slate-500">{label}</p>
                <p className="mt-2 text-[34px] font-semibold tracking-[-0.05em] text-slate-950">{value}</p>
                <p className="mt-2 text-[13px] leading-5 text-slate-500">{detail}</p>
              </div>
            ))}
          </div>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-[18px] font-semibold">Proyectos que requieren atencion</h3>
                <p className="text-[13px] text-slate-500">Ordenados por impacto y desbloqueo de valor.</p>
              </div>
              <Badge tone="orange">3 pendientes</Badge>
            </div>
            <div className="mt-5 space-y-3">
              {[
                ["Soporte recibe cientos de solicitudes", "Memoria lista para aprobar", "63%", "Aprobar ahora"],
                ["Onboarding comercial B2B", "IA generando herramientas", "48%", "Ver ejecucion"],
                ["Gestion documental legal", "Falta dato de owner", "32%", "Responder gap"],
              ].map(([title, state, progress, action]) => (
                <button
                  key={title}
                  className="grid w-full gap-3 rounded-[20px] border border-slate-200 bg-slate-50/70 p-4 text-left transition hover:-translate-y-0.5 hover:bg-white md:grid-cols-[minmax(0,1fr)_120px_150px]"
                  type="button"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-950">{title}</p>
                    <p className="mt-1 text-[13px] text-slate-500">{state}</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-slate-400">Progreso</p>
                    <p className="mt-1 font-semibold text-slate-900">{progress}</p>
                  </div>
                  <span className="flex items-center justify-between rounded-[16px] bg-[#0f766e] px-4 py-3 text-[13px] font-semibold text-white">
                    {action}
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-[28px] border border-slate-200 bg-white p-5">
            <h3 className="text-[18px] font-semibold">Actividad IA</h3>
            <div className="mt-5 space-y-4">
              {[
                ["Memoria", "Propuesta lista", "Hace 2 min", "green"],
                ["Herramientas", "RAG requerido detectado", "Hace 11 min", "blue"],
                ["Disenar", "Arquitectura aprobada", "Hace 28 min", "green"],
              ].map(([stage, state, time, tone]) => (
                <div key={`${stage}-${state}`} className="flex gap-3">
                  <span className="mt-1 flex h-9 w-9 items-center justify-center rounded-[14px] bg-[#ecfdf5] text-[#0f766e]">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-950">{stage}</p>
                    <p className="text-[13px] text-slate-500">{state}</p>
                    <Badge tone={tone as BadgeTone} className="mt-2">{time}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-[#f59e0b]/20 bg-[#fffbeb] p-5">
            <Badge tone="orange">Diseno comercial</Badge>
            <h3 className="mt-4 text-[24px] font-semibold tracking-[-0.04em] text-slate-950">
              El valor no se esconde al final.
            </h3>
            <p className="mt-3 text-[14px] leading-6 text-slate-600">
              La pantalla muestra diagramas, ahorro y ROI antes de pedir la compra del Blueprint Pro.
            </p>
            <AppButton className="mt-5 w-full" onClick={() => onNavigate("results")} variant="primary">
              Ver mockup de resultados
            </AppButton>
          </section>
        </div>
      </div>
    </MockChrome>
  );
}

function ProjectsMockup({ onNavigate }: { onNavigate: (screen: ScreenKey) => void }) {
  const projects = [
    {
      action: "Revisar memoria",
      name: "Automatizacion de soporte omnicanal",
      owner: "Equipo CX",
      product: "Blueprint",
      progress: 63,
      state: "Requiere tu accion",
      tone: "orange" as BadgeTone,
    },
    {
      action: "Ver ejecucion",
      name: "Onboarding comercial B2B",
      owner: "Revenue Operations",
      product: "Blueprint",
      progress: 48,
      state: "IA trabajando",
      tone: "blue" as BadgeTone,
    },
    {
      action: "Explorar resultado",
      name: "Gestion documental legal",
      owner: "Legal Ops",
      product: "Blueprint Pro",
      progress: 100,
      state: "Blueprint listo",
      tone: "green" as BadgeTone,
    },
    {
      action: "Resolver preguntas",
      name: "Analista de riesgo de credito",
      owner: "Risk Lab",
      product: "ACP",
      progress: 82,
      state: "2 gaps pendientes",
      tone: "violet" as BadgeTone,
    },
  ];

  return (
    <MockChrome
      eyebrow="Workspace / Proyectos"
      title="Tus sistemas agenticos, ordenados por siguiente accion"
      toolbar={
        <AppButton icon={<Plus className="h-4 w-4" />} onClick={() => onNavigate("discover")} variant="primary">
          Crear Blueprint
        </AppButton>
      }
    >
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50/70 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <label className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-[16px] border border-slate-200 bg-white px-4 text-slate-500">
              <Search className="h-4 w-4" />
              <input aria-label="Buscar proyectos" className="min-w-0 flex-1 bg-transparent text-[14px] outline-none" placeholder="Buscar por proyecto, owner o producto" />
            </label>
            <button className="flex h-12 items-center justify-between gap-4 rounded-[16px] border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700" type="button">
              Todos los estados
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="orange">2 requieren accion</Badge>
            <button aria-label="Filtros avanzados" className="flex h-12 w-12 items-center justify-center rounded-[16px] border border-slate-200 bg-white text-slate-600" type="button">
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_150px_130px_150px_44px] gap-4 border-b border-slate-200 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 max-lg:hidden">
          <span>Proyecto</span>
          <span>Producto</span>
          <span>Progreso</span>
          <span>Siguiente accion</span>
          <span />
        </div>
        <div className="divide-y divide-slate-200">
          {projects.map((project, index) => (
            <article key={project.name} className="grid gap-4 px-5 py-5 transition hover:bg-slate-50/70 lg:grid-cols-[minmax(0,1fr)_150px_130px_150px_44px] lg:items-center">
              <div className="flex min-w-0 items-center gap-4">
                <span className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-[17px]",
                  index === 0 ? "bg-[#0f766e] text-white" : "bg-slate-100 text-slate-600",
                )}>
                  <FolderKanban className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="truncate text-[15px] font-semibold text-slate-950">{project.name}</h3>
                  <p className="mt-1 text-[12px] text-slate-500">{project.owner} / Actualizado hace {index * 7 + 3} min</p>
                  <Badge className="mt-2 lg:hidden" tone={project.tone}>{project.state}</Badge>
                </div>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-slate-800">{project.product}</p>
                <p className="mt-1 text-[11px] text-slate-500">{project.state}</p>
              </div>
              <div>
                <div className="flex items-center justify-between text-[12px] font-semibold text-slate-700"><span>{project.progress}%</span></div>
                <ProgressBar className="mt-2" color={index === 3 ? "#7c3aed" : "#0f766e"} value={project.progress} />
              </div>
              <button
                className="flex h-11 items-center justify-between rounded-[14px] bg-[#07152c] px-4 text-[12px] font-semibold text-white transition hover:-translate-y-0.5"
                onClick={() => onNavigate(index === 0 ? "memory" : index === 1 ? "run" : index === 2 ? "results" : "validate")}
                type="button"
              >
                {project.action}
                <ChevronRight className="h-4 w-4" />
              </button>
              <button aria-label={`Mas opciones para ${project.name}`} className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-slate-200 bg-white text-slate-500" type="button">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </article>
          ))}
        </div>
      </section>
    </MockChrome>
  );
}

function DiscoverMockup({ onNavigate }: { onNavigate: (screen: ScreenKey) => void }) {
  const [selectedGoal, setSelectedGoal] = useState("Reducir tiempo de resolucion");
  const goals = ["Reducir tiempo de resolucion", "Mejorar consistencia", "Escalar sin aumentar equipo"];

  return (
    <MockChrome
      eyebrow="Proyecto / Descubrir"
      title="Primero entendamos el problema, no la tecnologia"
      toolbar={
        <>
          <Badge tone="blue">Autoguardado</Badge>
          <Badge tone="orange">76% contexto</Badge>
        </>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[270px_minmax(0,1fr)_330px]">
        <JourneyRail activeStage="Descubrir" progress={12} />

        <div className="space-y-5">
          <section className="rounded-[32px] border border-slate-200 bg-white p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <Badge tone="green">Paso 2 de 4</Badge>
                <h3 className="mt-4 text-[34px] font-semibold leading-tight tracking-[-0.05em] text-slate-950">Que cambio de negocio debe producir el agente?</h3>
                <p className="mt-3 text-[14px] leading-7 text-slate-600">Responde con el resultado esperado. La IA convertira esta informacion en objetivos medibles, restricciones y preguntas faltantes.</p>
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-right">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Tiempo restante</p>
                <p className="mt-1 text-[24px] font-semibold text-slate-950">6 min</p>
              </div>
            </div>

            <label className="mt-7 block">
              <span className="text-[13px] font-semibold text-slate-800">Situacion actual</span>
              <textarea className="mt-2 min-h-[132px] w-full resize-none rounded-[20px] border border-slate-200 bg-slate-50/60 p-4 text-[14px] leading-7 text-slate-700 outline-none transition focus:border-[#0f766e] focus:bg-white" defaultValue="El equipo de soporte recibe cientos de solicitudes repetitivas por correo y chat. Los analistas dedican gran parte del dia a clasificar, buscar respuestas y escalar casos." />
              <span className="mt-2 block text-[12px] text-slate-400">La informacion sensible sera resumida antes de enviarse al proveedor LLM.</span>
            </label>

            <fieldset className="mt-6">
              <legend className="text-[13px] font-semibold text-slate-800">Objetivo principal</legend>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                {goals.map((goal) => {
                  const selected = goal === selectedGoal;
                  return (
                    <button
                      key={goal}
                      aria-pressed={selected}
                      className={cn(
                        "rounded-[18px] border p-4 text-left text-[13px] font-semibold transition",
                        selected ? "border-[#0f766e] bg-[#ecfdf5] text-[#115e59]" : "border-slate-200 bg-white text-slate-700 hover:border-[#0f766e]/35",
                      )}
                      onClick={() => setSelectedGoal(goal)}
                      type="button"
                    >
                      <span className={cn("mb-3 flex h-6 w-6 items-center justify-center rounded-full border", selected ? "border-[#0f766e] bg-[#0f766e] text-white" : "border-slate-300")}>
                        {selected ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                      </span>
                      {goal}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <label className="mt-6 block">
              <span className="text-[13px] font-semibold text-slate-800">Indicador de exito</span>
              <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_180px]">
                <input className="h-12 rounded-[16px] border border-slate-200 bg-white px-4 text-[14px] outline-none focus:border-[#0f766e]" defaultValue="Tiempo medio de resolucion" />
                <input className="h-12 rounded-[16px] border border-slate-200 bg-white px-4 text-[14px] outline-none focus:border-[#0f766e]" defaultValue="-35% en 90 dias" />
              </div>
            </label>
          </section>

          <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-white/94 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.16)] backdrop-blur md:flex-row md:items-center md:justify-between">
            <p className="text-[13px] text-slate-500">La IA detectara gaps de negocio antes de generar Definir.</p>
            <div className="flex flex-wrap gap-3">
              <AppButton>Guardar borrador</AppButton>
              <AppButton onClick={() => onNavigate("run")} variant="primary">Analizar necesidad</AppButton>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <section className="rounded-[28px] border border-[#0f766e]/20 bg-[#ecfdf5] p-5">
            <div className="flex items-center justify-between gap-3">
              <Badge tone="green">Copiloto de descubrimiento</Badge>
              <Sparkles className="h-5 w-5 text-[#0f766e]" />
            </div>
            <h3 className="mt-4 text-[20px] font-semibold text-slate-950">El contexto ya es suficiente para empezar.</h3>
            <p className="mt-2 text-[13px] leading-6 text-slate-600">Falta precisar dos restricciones que mejoraran la recomendacion de arquitectura.</p>
            <div className="mt-5 space-y-3">
              {["Que casos nunca puede resolver automaticamente?", "Que sistemas contienen la respuesta oficial?"].map((question) => (
                <button key={question} className="flex w-full items-start gap-3 rounded-[16px] bg-white/80 p-3 text-left text-[13px] leading-5 text-slate-700" type="button">
                  <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-[#0f766e]" />
                  {question}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[12px] text-slate-500">Completitud</p>
                <p className="mt-1 text-[32px] font-semibold tracking-[-0.05em]">76%</p>
              </div>
              <span className="text-[12px] font-semibold text-[#0f766e]">Buena base</span>
            </div>
            <ProgressBar className="mt-4" color="#0f766e" value={76} />
            <div className="mt-5 space-y-3 text-[13px] text-slate-600">
              {["Problema y volumen", "Objetivo medible", "Usuarios afectados"].map((item) => (
                <div key={item} className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-emerald-600" />{item}</div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </MockChrome>
  );
}

function JourneyRail({
  activeStage = "Disenar",
  progress = 63,
}: {
  activeStage?: JourneyStep["label"];
  progress?: number;
}) {
  const activeIndex = JOURNEY_STEPS.findIndex((step) => step.label === activeStage);
  const visibleSteps = JOURNEY_STEPS.map((step, index) => ({
    ...step,
    state: step.product === "ACP"
      ? step.state
      : index < activeIndex
        ? "done" as const
        : index === activeIndex
          ? "active" as const
          : "pending" as const,
  }));

  return (
    <aside className="rounded-[28px] border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Journey</p>
          <h3 className="mt-1 text-[18px] font-semibold">Blueprint</h3>
        </div>
        <Badge tone="green">{progress}%</Badge>
      </div>
      <div className="mt-5 space-y-3">
        {visibleSteps.map((step, index) => (
          <div key={step.label} className="relative flex gap-3">
            {index < JOURNEY_STEPS.length - 1 ? <span className="absolute left-[18px] top-10 h-[calc(100%+4px)] w-px bg-slate-200" /> : null}
            <span
              className={cn(
                "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[12px] font-bold",
                journeyStateStyles[step.state],
              )}
            >
              {step.state === "done" ? <CheckCircle2 className="h-4 w-4" /> : step.state === "locked" ? <Lock className="h-4 w-4" /> : index + 1}
            </span>
            <div className={cn("min-w-0 rounded-[18px] px-3 py-2", step.state === "active" && "bg-[#ecfdf5]")}>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[14px] font-semibold text-slate-950">{step.label}</p>
                {step.product === "ACP" ? <Badge tone="violet">ACP</Badge> : null}
              </div>
              <p className="mt-1 text-[12px] leading-5 text-slate-500">{step.subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

function AiEvidencePanel() {
  return (
    <aside className="space-y-4">
      <section className="rounded-[28px] border border-[#0f766e]/20 bg-[#ecfdf5] p-5">
        <div className="flex items-center justify-between gap-3">
          <Badge tone="green">IA completada</Badge>
          <span className="text-[12px] font-semibold text-[#0f766e]">84% confianza</span>
        </div>
        <h3 className="mt-4 text-[22px] font-semibold tracking-[-0.04em] text-slate-950">Diseno generado</h3>
        <p className="mt-2 text-[13px] leading-6 text-slate-600">
          Se usaron 7 fuentes de memoria larga, 4 decisiones aprobadas y el canvas consolidado.
        </p>
        <div className="mt-5 space-y-3">
          {["Contexto Discover resumido", "Requisitos aprobados", "Catalogo de patrones", "Memoria agentica hibrida"].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-[16px] bg-white/74 px-3 py-3 text-[13px] font-medium text-slate-700">
              <CheckCircle2 className="h-4 w-4 text-[#0f766e]" />
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5">
        <h3 className="text-[18px] font-semibold">Bloqueos</h3>
        <div className="mt-4 rounded-[18px] border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <p className="font-semibold text-emerald-950">Sin bloqueos criticos</p>
          </div>
          <p className="mt-2 text-[13px] leading-6 text-emerald-800">
            Hay 2 decisiones editables, pero no impiden continuar a Herramientas.
          </p>
        </div>
      </section>
    </aside>
  );
}

function StageMockup({ onNavigate }: { onNavigate: (screen: ScreenKey) => void }) {
  return (
    <MockChrome
      eyebrow="Proyecto / Disenar"
      title="Una etapa, una tarea principal"
      toolbar={
        <>
          <Badge tone="green">Revision lista</Badge>
          <Badge tone="blue">Siguiente: Herramientas</Badge>
        </>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[290px_minmax(0,1fr)_330px]">
        <JourneyRail />
        <div className="space-y-5">
          <section className="rounded-[32px] border border-slate-200 bg-white p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <Badge tone="green">Tarea actual</Badge>
                <h3 className="mt-4 text-[34px] font-semibold leading-tight tracking-[-0.05em] text-slate-950">
                  Revisa la arquitectura propuesta antes de seleccionar herramientas.
                </h3>
                <p className="mt-3 text-[14px] leading-7 text-slate-600">
                  La informacion de consulta vive en el panel derecho. Aqui solo quedan las decisiones que cambian el
                  resultado.
                </p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 lg:w-[220px]">
                <p className="text-[12px] text-slate-500">Tiempo estimado</p>
                <p className="mt-1 text-[28px] font-semibold">5 min</p>
                <ProgressBar className="mt-3" color="#0f766e" value={72} />
              </div>
            </div>

            <div className="mt-7 grid gap-4 lg:grid-cols-3">
              {STAGE_TASKS.map((task) => (
                <article key={task.label} className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                  <Badge tone={task.tone}>{task.action}</Badge>
                  <h4 className="mt-4 text-[18px] font-semibold text-slate-950">{task.label}</h4>
                  <p className="mt-2 text-[13px] leading-6 text-slate-600">{task.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-[20px] font-semibold">Patron recomendado</h3>
                <Badge tone="green">Editable</Badge>
              </div>
              <div className="mt-5 rounded-[24px] border border-[#0f766e]/20 bg-[#f0fdfa] p-5">
                <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#0f766e]">Planner + Critic + Tool Router</p>
                <p className="mt-3 text-[14px] leading-7 text-slate-700">
                  Un planner organiza el objetivo, un critic valida riesgos y un router decide si invoca herramientas,
                  memoria o escalamiento humano.
                </p>
              </div>
            </div>
            <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-5">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <h3 className="mt-3 text-[18px] font-semibold text-slate-950">Decision editable</h3>
              <p className="mt-2 text-[13px] leading-6 text-slate-600">
                Confirmar si cerrar tickets requiere aprobacion humana o solo recomendacion.
              </p>
            </div>
          </section>

          <div className="sticky bottom-4 z-20 rounded-[26px] border border-slate-200 bg-white/92 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.16)] backdrop-blur">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-[13px] text-slate-500">
                Accion primaria visible y persistente. Las opciones avanzadas no compiten con el avance.
              </p>
              <div className="flex flex-wrap gap-3">
                <AppButton>Guardar cambios</AppButton>
                <AppButton onClick={() => onNavigate("run")}>Regenerar con instrucciones</AppButton>
                <AppButton onClick={() => onNavigate("tools")} variant="primary">Aprobar Diseno y continuar</AppButton>
              </div>
            </div>
          </div>
        </div>
        <AiEvidencePanel />
      </div>
    </MockChrome>
  );
}

function ToolsMockup({ onNavigate }: { onNavigate: (screen: ScreenKey) => void }) {
  const tools = [
    {
      capability: "Recuperar respuestas aprobadas con evidencia",
      classification: "Obligatoria",
      icon: Library,
      name: "knowledge_retrieval",
      reason: "El agente debe responder desde una fuente oficial y trazable; sin retrieval no puede cumplir el objetivo.",
      tone: "green" as BadgeTone,
      type: "Interna",
    },
    {
      capability: "Ingestar, versionar y refrescar documentos",
      classification: "Obligatoria",
      icon: UploadCloud,
      name: "document_ingestion",
      reason: "Mantiene actualizado el corpus RAG y conserva lineage de cada respuesta.",
      tone: "green" as BadgeTone,
      type: "Externa",
    },
    {
      capability: "Transferir casos sensibles a un especialista",
      classification: "Obligatoria",
      icon: Users,
      name: "human_handoff",
      reason: "Las restricciones aprobadas exigen escalamiento para fraude, quejas legales y baja confianza.",
      tone: "green" as BadgeTone,
      type: "Interna",
    },
    {
      capability: "Consultar y actualizar el ticket existente",
      classification: "Opcional",
      icon: Link2,
      name: "ticketing_api",
      reason: "Aporta automatizacion operativa, pero el agente puede iniciar como recomendador sin escritura.",
      tone: "blue" as BadgeTone,
      type: "Externa",
    },
  ];

  return (
    <MockChrome
      eyebrow="Proyecto / Herramientas"
      title="Solo las capacidades estrictamente necesarias"
      toolbar={
        <>
          <Badge tone="green">4 recomendadas</Badge>
          <Badge tone="slate">2 descartadas</Badge>
        </>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[270px_minmax(0,1fr)_330px]">
        <JourneyRail activeStage="Herramientas" progress={50} />

        <div className="space-y-5">
          <section className="rounded-[32px] border border-slate-200 bg-white p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <Badge tone="green">Revision lista</Badge>
                <h3 className="mt-4 text-[34px] font-semibold leading-tight tracking-[-0.05em] text-slate-950">La IA redujo 11 capacidades candidatas a 4 herramientas.</h3>
                <p className="mt-3 text-[14px] leading-7 text-slate-600">Cada seleccion esta vinculada a un requerimiento aprobado. Puedes aceptar, rechazar o reemplazar sin perder trazabilidad.</p>
              </div>
              <div className="grid min-w-[210px] grid-cols-2 gap-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-center">
                <div><p className="text-[26px] font-semibold">3</p><p className="text-[11px] text-slate-500">obligatorias</p></div>
                <div><p className="text-[26px] font-semibold">1</p><p className="text-[11px] text-slate-500">opcional</p></div>
              </div>
            </div>

            <div className="mt-7 space-y-3">
              {tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <article key={tool.name} className="grid gap-4 rounded-[22px] border border-slate-200 bg-slate-50/55 p-4 lg:grid-cols-[52px_minmax(0,1fr)_150px] lg:items-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-[17px] bg-[#07152c] text-white"><Icon className="h-5 w-5" /></span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-mono text-[13px] font-bold text-slate-950">{tool.name}</h4>
                        <Badge tone={tool.tone}>{tool.classification}</Badge>
                        <Badge tone="slate">{tool.type}</Badge>
                      </div>
                      <p className="mt-2 text-[13px] font-semibold text-slate-700">{tool.capability}</p>
                      <p className="mt-1 text-[12px] leading-5 text-slate-500">{tool.reason}</p>
                    </div>
                    <div className="flex gap-2 lg:justify-end">
                      <button className="rounded-[12px] border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-600" type="button">Reemplazar</button>
                      <button className="rounded-[12px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700" type="button">Incluida</button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-[26px] border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3"><RefreshCcw className="h-5 w-5 text-[#0f766e]" /><h3 className="text-[18px] font-semibold">Redundancia resuelta</h3></div>
              <p className="mt-3 text-[13px] leading-6 text-slate-600"><span className="font-mono font-semibold">web_search</span> fue descartada: duplica retrieval y agregaria fuentes no gobernadas.</p>
            </div>
            <div className="rounded-[26px] border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-amber-600" /><h3 className="text-[18px] font-semibold">Decision de alcance</h3></div>
              <p className="mt-3 text-[13px] leading-6 text-slate-600">La escritura en ticketing queda opcional hasta confirmar permisos del entorno de implementacion.</p>
            </div>
          </section>

          <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-white/94 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.16)] backdrop-blur md:flex-row md:items-center md:justify-between">
            <p className="text-[13px] text-slate-500">4 capacidades cubren el 100% de los flujos aprobados.</p>
            <div className="flex flex-wrap gap-3"><AppButton>Guardar cambios</AppButton><AppButton onClick={() => onNavigate("memory")} variant="primary">Aprobar Herramientas</AppButton></div>
          </div>
        </div>

        <aside className="space-y-4">
          <section className="rounded-[28px] border border-[#0f766e]/20 bg-[#ecfdf5] p-5">
            <div className="flex items-center justify-between"><Badge tone="green">88% confianza</Badge><Sparkles className="h-5 w-5 text-[#0f766e]" /></div>
            <h3 className="mt-4 text-[21px] font-semibold tracking-[-0.03em]">Por que este conjunto es minimo</h3>
            <div className="mt-4 space-y-3">
              {["12 requerimientos cubiertos", "0 capacidades sin owner", "0 incompatibilidades criticas", "1 decision diferida al ACP"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-[15px] bg-white/78 px-3 py-3 text-[13px] text-slate-700"><CheckCircle2 className="h-4 w-4 text-[#0f766e]" />{item}</div>
              ))}
            </div>
          </section>
          <section className="rounded-[28px] border border-slate-200 bg-white p-5">
            <h3 className="text-[18px] font-semibold">Contrato hacia Memoria</h3>
            <p className="mt-2 text-[13px] leading-6 text-slate-600">Memoria recibira capacidades aprobadas, politicas de acceso, fuentes RAG y la decision pendiente de escritura.</p>
            <button className="mt-4 flex items-center gap-2 text-[13px] font-semibold text-[#0f766e]" type="button">Ver contrato JSON <ChevronRight className="h-4 w-4" /></button>
          </section>
        </aside>
      </div>
    </MockChrome>
  );
}

function MemoryMockup({ onNavigate }: { onNavigate: (screen: ScreenKey) => void }) {
  const layers = [
    { detail: "Conversacion activa, resumen incremental y decisiones del turno", icon: MessageSquareText, label: "Corto plazo", metric: "6k tokens", tone: "#2563eb" },
    { detail: "Artefactos aprobados, reglas, decisiones y justificaciones versionadas", icon: Database, label: "Largo plazo", metric: "18 artefactos", tone: "#0f766e" },
    { detail: "Fuentes empresariales con retrieval, citas, refresh y lineage", icon: Library, label: "Conocimiento RAG", metric: "7 fuentes", tone: "#d97706" },
  ];

  return (
    <MockChrome
      eyebrow="Proyecto / Memoria"
      title="Conocimiento suficiente, contexto bajo control"
      toolbar={<><Badge tone="green">Propuesta lista</Badge><Badge tone="blue">10 evidencias</Badge></>}
    >
      <div className="grid gap-5 xl:grid-cols-[270px_minmax(0,1fr)_330px]">
        <JourneyRail activeStage="Memoria" progress={63} />
        <div className="space-y-5">
          <section className="rounded-[32px] border border-slate-200 bg-white p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl"><Badge tone="green">Revision lista</Badge><h3 className="mt-4 text-[34px] font-semibold leading-tight tracking-[-0.05em]">Tres capas de memoria, cada una con un proposito verificable.</h3><p className="mt-3 text-[14px] leading-7 text-slate-600">La IA recupera solo el contexto necesario, referencia artefactos aprobados y evita reenviar el historial completo.</p></div>
              <div className="rounded-[24px] border border-[#0f766e]/20 bg-[#ecfdf5] p-4 lg:w-[220px]"><p className="text-[12px] text-[#0f766e]">Ahorro de contexto</p><p className="mt-1 text-[34px] font-semibold tracking-[-0.05em]">71%</p><p className="mt-1 text-[11px] text-slate-500">vs enviar historial completo</p></div>
            </div>

            <div className="mt-7 grid gap-4 lg:grid-cols-3">
              {layers.map((layer) => {
                const Icon = layer.icon;
                return (
                  <article key={layer.label} className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50/60 p-5">
                    <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: layer.tone }} />
                    <div className="flex items-start justify-between gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-[15px] text-white" style={{ backgroundColor: layer.tone }}><Icon className="h-5 w-5" /></span><Badge tone="slate">{layer.metric}</Badge></div>
                    <h4 className="mt-5 text-[18px] font-semibold text-slate-950">{layer.label}</h4>
                    <p className="mt-2 text-[13px] leading-6 text-slate-600">{layer.detail}</p>
                    <button className="mt-4 flex items-center gap-2 text-[12px] font-semibold text-slate-700" type="button">Configurar politicas <ChevronRight className="h-4 w-4" /></button>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-[20px] font-semibold">Fuentes de conocimiento</h3><p className="mt-1 text-[13px] text-slate-500">Ownership, frescura y recuperacion definidos desde el Blueprint.</p></div><AppButton icon={<Plus className="h-4 w-4" />}>Agregar fuente</AppButton></div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {[
                ["Base de conocimiento CX", "Owner: Operaciones", "Refresh diario", "green"],
                ["Politicas de servicio", "Owner: Compliance", "Versionada", "blue"],
                ["Historial de soluciones", "Owner: Soporte L2", "Solo lectura", "orange"],
              ].map(([name, owner, policy, tone]) => (
                <div key={name} className="rounded-[20px] border border-slate-200 bg-slate-50/60 p-4"><div className="flex items-center justify-between"><Library className="h-5 w-5 text-[#0f766e]" /><Badge tone={tone as BadgeTone}>{policy}</Badge></div><p className="mt-4 text-[14px] font-semibold text-slate-950">{name}</p><p className="mt-1 text-[12px] text-slate-500">{owner}</p></div>
              ))}
            </div>
          </section>

          <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-white/94 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.16)] backdrop-blur md:flex-row md:items-center md:justify-between">
            <p className="text-[13px] text-slate-500">Sin bloqueos: ingestion documental ya fue aprobada en Herramientas.</p>
            <div className="flex flex-wrap gap-3"><AppButton>Guardar revision</AppButton><AppButton onClick={() => onNavigate("results")} variant="primary">Aprobar Memoria</AppButton></div>
          </div>
        </div>

        <aside className="space-y-4">
          <section className="rounded-[28px] border border-[#0f766e]/20 bg-[#ecfdf5] p-5"><div className="flex items-center justify-between"><Badge tone="green">86% confianza</Badge><Brain className="h-5 w-5 text-[#0f766e]" /></div><h3 className="mt-4 text-[21px] font-semibold">Memoria conectada al diseno</h3><p className="mt-2 text-[13px] leading-6 text-slate-600">Las politicas reflejan riesgos, herramientas y flujos aprobados. No es una plantilla generica.</p><div className="mt-5 space-y-3">{["Citas obligatorias", "Write gate humano", "TTL por tipo de dato", "Escalamiento por contradiccion"].map((item) => <div key={item} className="flex items-center gap-3 text-[13px] text-slate-700"><CheckCircle2 className="h-4 w-4 text-[#0f766e]" />{item}</div>)}</div></section>
          <section className="rounded-[28px] border border-slate-200 bg-white p-5"><h3 className="text-[18px] font-semibold">Evidencia recuperada</h3><p className="mt-2 text-[13px] leading-6 text-slate-600">7 documentos especializados, 3 decisiones aprobadas y 4 contratos de herramientas.</p><button className="mt-4 flex items-center gap-2 text-[13px] font-semibold text-[#0f766e]" type="button">Abrir lineage <ChevronRight className="h-4 w-4" /></button></section>
        </aside>
      </div>
    </MockChrome>
  );
}

function RunMockup({ onNavigate }: { onNavigate: (screen: ScreenKey) => void }) {
  return (
    <MockChrome
      eyebrow="IA en vivo / Runtime feedback"
      title="La IA siempre explica que esta haciendo"
      toolbar={<Badge tone="orange">Procesando</Badge>}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="overflow-hidden rounded-[34px] border border-[#0f766e]/20 bg-[linear-gradient(135deg,#042f2e_0%,#0f766e_58%,#eab308_135%)] p-7 text-white shadow-[0_28px_80px_rgba(15,118,110,0.26)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <Badge tone="green" className="border-white/20 bg-white/14 text-white">Corrida LLM</Badge>
              <h3 className="mt-5 text-[42px] font-semibold leading-[1.02] tracking-[-0.06em]">
                Generando recomendacion minima de herramientas.
              </h3>
              <p className="mt-4 text-[15px] leading-7 text-white/72">
                Paso 2 de 5: recuperando memoria larga y artefactos aprobados. El sistema no envia todo el historial,
                solo el contexto estrictamente necesario.
              </p>
            </div>
            <div className="rounded-[28px] border border-white/12 bg-white/10 p-5 lg:w-[280px]">
              <p className="text-[12px] text-white/56">Progreso</p>
              <p className="mt-1 text-[46px] font-semibold tracking-[-0.06em]">42%</p>
              <ProgressBar className="mt-3 bg-white/14" color="#fde68a" value={42} />
              <div className="mt-4 grid grid-cols-2 gap-3 text-[12px] text-white/70">
                <span>ETA: 1:20</span>
                <span>Siguiente: clasificar</span>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-3 lg:grid-cols-5">
            {RUN_STEPS.map((step, index) => (
              <div key={step.label} className="rounded-[22px] border border-white/12 bg-white/10 p-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/14 text-[13px] font-bold">
                  {step.state === "done" ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                </span>
                <p className="mt-4 text-[13px] font-semibold">{step.label}</p>
                <p className="mt-1 text-[12px] text-white/58">
                  {step.state === "active" ? "En curso" : step.state === "done" ? "Completo" : "Pendiente"}
                </p>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-[28px] border border-slate-200 bg-white p-5">
            <h3 className="text-[18px] font-semibold">Contexto enviado</h3>
            <div className="mt-4 space-y-3">
              {[
                ["Resumen corto", "1.2k tokens"],
                ["Artefactos aprobados", "4 refs"],
                ["Memoria larga recuperada", "7 chunks"],
                ["Reglas de herramientas", "3 politicas"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3 rounded-[16px] bg-slate-50 px-4 py-3">
                  <span className="text-[13px] text-slate-600">{label}</span>
                  <span className="text-[13px] font-semibold text-slate-950">{value}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5">
            <h3 className="text-[18px] font-semibold">Control humano</h3>
            <p className="mt-2 text-[13px] leading-6 text-slate-600">
              Si la confianza baja de 70%, la UI abre una tarjeta de preguntas en lugar de dejar al usuario adivinar.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <AppButton>Ver contexto</AppButton>
              <AppButton onClick={() => onNavigate("tools")} variant="primary">Ver propuesta simulada</AppButton>
            </div>
          </section>
        </aside>
      </div>
    </MockChrome>
  );
}

function ResultsMockup({ onNavigate }: { onNavigate: (screen: ScreenKey) => void }) {
  return (
    <MockChrome
      eyebrow="Producto 1 / Resultados Blueprint"
      title="El Blueprint demuestra valor antes de vender"
      toolbar={
        <>
          <Badge tone="green">Blueprint listo</Badge>
          <Badge tone="orange">Descarga bloqueada</Badge>
        </>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(330px,0.8fr)]">
        <section className="rounded-[34px] border border-slate-200 bg-white p-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <Badge tone="blue">Muestra desbloqueada</Badge>
              <h3 className="mt-4 text-[38px] font-semibold leading-tight tracking-[-0.05em] text-slate-950">
                Arquitectura propuesta para explicar la solucion en 2 minutos.
              </h3>
              <p className="mt-3 text-[14px] leading-7 text-slate-600">
                El usuario puede ver el valor dentro de la plataforma. La descarga profesional requiere adquirir
                Blueprint Pro.
              </p>
            </div>
            <div className="rounded-[28px] border border-[#0f766e]/20 bg-[#ecfdf5] p-5">
              <p className="text-[12px] text-[#0f766e]">Ahorro estimado</p>
              <p className="mt-1 text-[44px] font-semibold tracking-[-0.06em] text-slate-950">68%</p>
              <p className="mt-2 text-[13px] leading-6 text-slate-600">Vs construir desde cero sin Blueprint.</p>
            </div>
          </div>

          <div className="mt-7 rounded-[30px] border border-slate-200 bg-[#f8fafc] p-5">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ["Tradicional", "596 h", "100% intervencion humana"],
                ["Con Blueprint", "369 h", "Diseno cerrado y reusable"],
                ["ACP agentico", "191 h", "Mayor automatizacion"],
              ].map(([label, value, detail]) => (
                <div key={label} className="rounded-[22px] border border-white bg-white p-5">
                  <p className="text-[12px] text-slate-500">{label}</p>
                  <p className="mt-2 text-[32px] font-semibold tracking-[-0.05em] text-slate-950">{value}</p>
                  <p className="mt-2 text-[12px] leading-5 text-slate-500">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-[34px] border border-[#f59e0b]/25 bg-[#fffbeb] p-6">
            <Badge tone="orange">Producto 1</Badge>
            <h3 className="mt-4 text-[30px] font-semibold tracking-[-0.05em] text-slate-950">
              Adquirir Blueprint Profesional
            </h3>
            <p className="mt-3 text-[14px] leading-7 text-slate-600">
              Descarga documentacion funcional, tecnica y comercial: arquitectura, memoria, herramientas, contratos,
              roadmap, estimacion y diagramas Blueprint.
            </p>
            <div className="mt-5 space-y-3">
              {["Documento profesional", "Diagramas completos Blueprint", "Comparativa de valor", "Roadmap y costo"].map((item) => (
                <div key={item} className="flex items-center gap-3 text-[13px] font-medium text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-[#0f766e]" />
                  {item}
                </div>
              ))}
            </div>
            <AppButton className="mt-6 w-full" onClick={() => onNavigate("diagrams")} variant="primary">
              Adquirir y descargar Blueprint
            </AppButton>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5">
            <h3 className="text-[18px] font-semibold">Siguiente producto</h3>
            <p className="mt-2 text-[13px] leading-6 text-slate-600">
              El ACP no inicia automaticamente. Primero se explica que valor adicional aporta.
            </p>
            <AppButton className="mt-5 w-full" onClick={() => onNavigate("acp")}>Ver invitacion ACP</AppButton>
          </section>
        </aside>
      </div>
    </MockChrome>
  );
}

function DiagramMockup({ onNavigate }: { onNavigate: (screen: ScreenKey) => void }) {
  const [visibleCount, setVisibleCount] = useState(20);
  const [selectedTitle, setSelectedTitle] = useState(DIAGRAMS[0].title);
  const visibleDiagrams = DIAGRAMS.slice(0, visibleCount);
  const remaining = Math.max(0, DIAGRAMS.length - visibleCount);
  const selectedDiagram = DIAGRAMS.find((diagram) => diagram.title === selectedTitle) ?? DIAGRAMS[0];
  const selectedLocked = selectedDiagram.state === "locked";

  return (
    <MockChrome
      eyebrow="Visor unificado / Diagramas"
      title="Todo el catalogo visible, acceso gobernado"
      toolbar={<Badge tone="blue">{DIAGRAMS.length} diagramas generados</Badge>}
    >
      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)_320px]">
        <aside className="rounded-[32px] border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Catalogo</p>
              <h3 className="mt-2 text-[26px] font-semibold tracking-[-0.04em]">Todo el valor generado</h3>
            </div>
            <Badge tone="green">{DIAGRAMS.length}</Badge>
          </div>

          <label className="mt-5 flex h-12 items-center gap-3 rounded-[18px] border border-slate-200 bg-white px-4 text-[14px] text-slate-500">
            <Search className="h-4 w-4" />
            <span>Buscar diagrama o categoria</span>
          </label>

          <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 p-3">
            <div className="mb-3 flex items-center justify-between px-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Listado vertical</p>
              <Badge tone="slate">bloques de 20</Badge>
            </div>
            <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
              {visibleDiagrams.map((diagram) => {
                const Icon = diagram.icon;
                const isSample = diagram.state === "sample";
                const isAvailable = diagram.state === "available";
                return (
                  <button
                    key={diagram.title}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-[18px] border p-3 text-left transition hover:-translate-y-0.5",
                      selectedTitle === diagram.title
                        ? "border-[#0f766e]/25 bg-[#ecfdf5]"
                        : isAvailable
                          ? "border-blue-200 bg-blue-50"
                          : "border-slate-200 bg-white",
                    )}
                    onClick={() => setSelectedTitle(diagram.title)}
                    type="button"
                  >
                    <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px]", isSample ? "bg-[#0f766e] text-white" : "bg-slate-100 text-slate-500")}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold text-slate-950">{diagram.title}</span>
                      <span className="mt-1 block text-[12px] text-slate-500">{diagram.category} / {diagram.product}</span>
                    </span>
                    {diagram.state === "locked" ? <Lock className="h-4 w-4 text-slate-400" /> : <Eye className="h-4 w-4 text-[#0f766e]" />}
                  </button>
                );
              })}
            </div>
            {remaining > 0 ? (
              <button
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-[13px] font-semibold text-slate-700"
                onClick={() => setVisibleCount((current) => Math.min(DIAGRAMS.length, current + 20))}
                type="button"
              >
                Mostrar {remaining} mas
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </aside>

        <section className="rounded-[34px] border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Canvas</p>
              <h3 className="mt-1 text-[26px] font-semibold tracking-[-0.04em]">{selectedDiagram.title}</h3>
            </div>
            <Badge tone={selectedLocked ? "orange" : "blue"}>{selectedLocked ? selectedDiagram.product : "Muestra disponible"}</Badge>
          </div>

          <div className="relative mt-5 min-h-[520px] overflow-hidden rounded-[30px] border border-[#0f766e]/18 bg-[radial-gradient(circle_at_20%_20%,rgba(20,184,166,0.18),transparent_26%),linear-gradient(135deg,#f8fafc,#ecfdf5)] p-6">
            <div className={cn("grid h-full gap-4 transition lg:grid-cols-[1fr_1.2fr_1fr]", selectedLocked && "pointer-events-none select-none blur-[7px]")}>
              {["Fuentes", "Agente orquestador", "Canales"].map((column, columnIndex) => (
                <div key={column} className="flex flex-col justify-center gap-4">
                  <p className="text-center text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{column}</p>
                  {[0, 1, 2].map((item) => (
                    <div
                      key={`${column}-${item}`}
                      className={cn(
                        "rounded-[22px] border bg-white/84 p-4 text-center shadow-[0_14px_34px_rgba(15,23,42,0.08)]",
                        columnIndex === 1 && item === 1 && "border-[#0f766e]/30 bg-[#0f766e] text-white",
                      )}
                    >
                      <p className="text-[13px] font-semibold">{columnIndex === 1 && item === 1 ? "Planner + Critic" : `${column} ${item + 1}`}</p>
                      <p className={cn("mt-1 text-[11px]", columnIndex === 1 && item === 1 ? "text-white/64" : "text-slate-500")}>Responsabilidad clara</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {selectedLocked ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/38 p-6 backdrop-blur-[2px]">
                <div className="max-w-[390px] rounded-[28px] border border-white/80 bg-white/92 p-6 text-center shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#07152c] text-white"><Lock className="h-5 w-5" /></span>
                  <h4 className="mt-4 text-[22px] font-semibold tracking-[-0.03em] text-slate-950">Vista protegida</h4>
                  <p className="mt-2 text-[13px] leading-6 text-slate-600">El catalogo revela el valor generado, pero el contenido se habilita segun el producto adquirido.</p>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-[30px] border border-[#f59e0b]/25 bg-[#fffbeb] p-5">
            <Badge tone={selectedLocked ? "orange" : "green"}>{selectedLocked ? "Contenido bloqueado" : "Acceso habilitado"}</Badge>
            <h3 className="mt-4 text-[24px] font-semibold tracking-[-0.04em] text-slate-950">
              {selectedLocked ? `Este diagrama forma parte de ${selectedDiagram.product}.` : "Este diagrama esta incluido en tu acceso actual."}
            </h3>
            <p className="mt-3 text-[13px] leading-6 text-slate-600">
              {selectedLocked
                ? "Adquierelo para acceder a diagramas detallados, documentacion completa y diseno integral de la solucion."
                : "Puedes explorarlo dentro de la plataforma. La descarga profesional se gobierna por entitlement."}
            </p>
            {selectedLocked ? (
              <AppButton className="mt-5 w-full" onClick={() => onNavigate(selectedDiagram.product === "ACP" ? "acp" : "results")} variant="primary">
                Desbloquear {selectedDiagram.product}
              </AppButton>
            ) : null}
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5">
            <h3 className="text-[18px] font-semibold">Proteccion activa</h3>
            <div className="mt-4 space-y-3 text-[13px] text-slate-600">
              {["Sin copia directa", "Sin descarga no autorizada", "Menu contextual bloqueado", "Eventos comerciales registrados"].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <ShieldCheck className="h-4 w-4 text-[#0f766e]" />
                  {item}
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </MockChrome>
  );
}

function AcpMockup({ onNavigate }: { onNavigate: (screen: ScreenKey) => void }) {
  return (
    <MockChrome
      eyebrow="Producto 2 / ACP premium"
      title="El ACP se compra antes de iniciar la segunda etapa"
      toolbar={<Badge tone="violet">Upsell incremental</Badge>}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(330px,0.9fr)]">
        <section className="overflow-hidden rounded-[34px] border border-white/70 bg-[linear-gradient(135deg,#111827_0%,#1e293b_56%,#0f766e_140%)] p-7 text-white">
          <Badge tone="violet" className="border-white/20 bg-white/14 text-white">Agent Construction Package</Badge>
          <h3 className="mt-5 max-w-3xl text-[44px] font-semibold leading-[1.02] tracking-[-0.06em]">
            Convierte el Blueprint en instrucciones listas para construir.
          </h3>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-white/68">
            El ACP no promete cero intervencion humana. Identifica las decisiones de implementacion, las pregunta en el
            momento correcto y mantiene portabilidad frente a herramientas agenticas.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {[
              ["Tiempo", "191 h", "con tooling agentico"],
              ["Intervencion", "35%", "humana estimada"],
              ["Riesgo", "-42%", "frente a construir sin pack"],
              ["Artefactos", "24", "portables y trazables"],
            ].map(([label, value, detail]) => (
              <div key={label} className="rounded-[24px] border border-white/10 bg-white/8 p-4">
                <p className="text-[12px] text-white/48">{label}</p>
                <p className="mt-2 text-[30px] font-semibold tracking-[-0.05em]">{value}</p>
                <p className="mt-1 text-[12px] leading-5 text-white/56">{detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <AppButton className="border-white bg-white text-[#111827]" onClick={() => onNavigate("validate")} variant="secondary">
              Adquirir ACP
            </AppButton>
            <AppButton className="border-white/20 bg-white/8 text-white" variant="ghost">
              Comparar con Blueprint
            </AppButton>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-[30px] border border-slate-200 bg-white p-5">
            <h3 className="text-[20px] font-semibold">Que se habilita</h3>
            <div className="mt-5 space-y-3">
              {[
                ["Validacion del Blueprint", "Simulaciones, test suite y gobernanza"],
                ["Gaps y preguntas", "Decisiones estructuradas para implementacion"],
                ["Artefactos tecnicos", "Prompts, contratos, workflows y memoria portable"],
                ["Launcher ACP", "Guia para abrir en Codex, Cursor o herramientas agenticas"],
              ].map(([title, detail]) => (
                <div key={title} className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-950">{title}</p>
                  <p className="mt-1 text-[13px] leading-6 text-slate-600">{detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[30px] border border-[#0f766e]/20 bg-[#ecfdf5] p-5">
            <h3 className="text-[20px] font-semibold">Separacion saludable</h3>
            <p className="mt-2 text-[13px] leading-6 text-slate-600">
              El Blueprint maximiza diseno. El ACP materializa implementacion, pero deja tecnologia, despliegue y
              credenciales como preguntas guiadas cuando dependan del entorno.
            </p>
          </section>
        </aside>
      </div>
    </MockChrome>
  );
}

function ValidateMockup({ onNavigate }: { onNavigate: (screen: ScreenKey) => void }) {
  const [selectedScenario, setSelectedScenario] = useState("Resolucion automatica");
  const scenarios = [
    { label: "Resolucion automatica", result: "Aprobado", steps: "8 pasos", tone: "green" as BadgeTone },
    { label: "Escalamiento humano", result: "Aprobado", steps: "6 pasos", tone: "green" as BadgeTone },
    { label: "Fuentes contradictorias", result: "Revisar", steps: "7 pasos", tone: "orange" as BadgeTone },
  ];

  return (
    <MockChrome
      eyebrow="Producto 2 / Validacion ACP"
      title="Prueba el comportamiento antes de construir"
      toolbar={<><Badge tone="violet">ACP activo</Badge><Badge tone="green">8 de 10 checks</Badge></>}
    >
      <div className="grid gap-5 xl:grid-cols-[285px_minmax(0,1fr)_340px]">
        <aside className="rounded-[28px] border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Test Suite</p><h3 className="mt-1 text-[18px] font-semibold">Escenarios clave</h3></div><Badge tone="green">3</Badge></div>
          <div className="mt-5 space-y-3">
            {scenarios.map((scenario, index) => {
              const selected = selectedScenario === scenario.label;
              return (
                <button key={scenario.label} className={cn("w-full rounded-[18px] border p-4 text-left transition", selected ? "border-[#0f766e] bg-[#ecfdf5]" : "border-slate-200 bg-white hover:bg-slate-50")} onClick={() => setSelectedScenario(scenario.label)} type="button">
                  <div className="flex items-center justify-between gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[12px] font-bold">{index + 1}</span><Badge tone={scenario.tone}>{scenario.result}</Badge></div>
                  <p className="mt-4 text-[14px] font-semibold text-slate-950">{scenario.label}</p><p className="mt-1 text-[12px] text-slate-500">{scenario.steps} / Simulacion LLM</p>
                </button>
              );
            })}
          </div>
          <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-[16px] border border-dashed border-slate-300 px-4 py-3 text-[12px] font-semibold text-slate-600" type="button"><Plus className="h-4 w-4" />Agregar escenario</button>
        </aside>

        <div className="space-y-5">
          <section className="rounded-[32px] border border-slate-200 bg-white p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><Badge tone={selectedScenario === "Fuentes contradictorias" ? "orange" : "green"}>{selectedScenario === "Fuentes contradictorias" ? "Requiere decision" : "Simulacion aprobada"}</Badge><h3 className="mt-4 text-[30px] font-semibold tracking-[-0.04em] text-slate-950">{selectedScenario}</h3><p className="mt-2 text-[13px] leading-6 text-slate-600">Representacion interactiva del flujo esperado, decisiones, herramientas y puntos de control humano.</p></div><AppButton icon={<Activity className="h-4 w-4" />}>Ejecutar de nuevo</AppButton></div>

            <div className="relative mt-7 overflow-hidden rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top_right,rgba(15,118,110,0.13),transparent_35%),#f8fafc] p-6">
              <span className="absolute bottom-16 left-[10%] right-[10%] h-px bg-slate-300" />
              <div className="relative grid gap-4 md:grid-cols-4">
                {[
                  ["1", "Entrada", "Solicitud clasificada", Bot],
                  ["2", "Recuperacion", "3 fuentes con evidencia", Library],
                  ["3", "Decision", selectedScenario === "Fuentes contradictorias" ? "Contradiccion detectada" : "Confianza 91%", GitBranch],
                  ["4", "Salida", selectedScenario === "Fuentes contradictorias" ? "Escalar a humano" : "Respuesta aprobada", CheckCircle2],
                ].map(([step, label, detail, IconValue]) => {
                  const Icon = IconValue as LucideIcon;
                  return (
                    <div key={String(step)} className="relative rounded-[22px] border border-white bg-white p-4 text-center shadow-[0_14px_36px_rgba(15,23,42,0.08)]"><span className="mx-auto flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#07152c] text-white"><Icon className="h-5 w-5" /></span><p className="mt-4 text-[11px] font-bold uppercase tracking-[0.16em] text-[#0f766e]">{String(step)}. {String(label)}</p><p className="mt-2 text-[12px] leading-5 text-slate-600">{String(detail)}</p></div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-[19px] font-semibold">Criterios de aceptacion</h3><p className="mt-1 text-[12px] text-slate-500">Trazables a requerimientos y artefactos del Blueprint.</p></div><Badge tone="green">4/4 cubiertos</Badge></div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">{["Respuesta cita fuente aprobada", "No ejecuta side effects sin permiso", "Escala por baja confianza", "Registra decision y evidencia"].map((item) => <div key={item} className="flex items-center gap-3 rounded-[16px] bg-slate-50 px-4 py-3 text-[13px] text-slate-700"><CheckCircle2 className="h-4 w-4 text-emerald-600" />{item}</div>)}</div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-5"><div className="flex items-center justify-between"><Badge tone="orange">2 preguntas ACP</Badge><AlertTriangle className="h-5 w-5 text-amber-600" /></div><h3 className="mt-4 text-[20px] font-semibold">Decisiones para implementacion</h3><p className="mt-2 text-[13px] leading-6 text-slate-600">No bloquean el diseno. El paquete las formulara cuando el entorno pueda responderlas.</p><div className="mt-4 space-y-3">{["Que proveedor de ticketing se conectara?", "Que region alojara los datos sensibles?"].map((question) => <div key={question} className="rounded-[16px] border border-amber-200 bg-white/70 p-3 text-[13px] leading-5 text-slate-700">{question}</div>)}</div></section>
          <section className="rounded-[28px] border border-[#0f766e]/20 bg-[#ecfdf5] p-5"><Badge tone="green">Portabilidad lista</Badge><h3 className="mt-4 text-[20px] font-semibold">ACP sin runtime propietario</h3><p className="mt-2 text-[13px] leading-6 text-slate-600">Workflows, estados, prompts, contratos y preguntas usan especificaciones declarativas portables.</p><AppButton className="mt-5 w-full" onClick={() => onNavigate("acp")} variant="primary">Ver paquete final</AppButton></section>
        </aside>
      </div>
    </MockChrome>
  );
}

function ActiveScreen({
  active,
  onNavigate,
}: {
  active: ScreenKey;
  onNavigate: (screen: ScreenKey) => void;
}) {
  if (active === "home") {
    return <HomeMockup onNavigate={onNavigate} />;
  }
  if (active === "projects") {
    return <ProjectsMockup onNavigate={onNavigate} />;
  }
  if (active === "discover") {
    return <DiscoverMockup onNavigate={onNavigate} />;
  }
  if (active === "stage") {
    return <StageMockup onNavigate={onNavigate} />;
  }
  if (active === "tools") {
    return <ToolsMockup onNavigate={onNavigate} />;
  }
  if (active === "memory") {
    return <MemoryMockup onNavigate={onNavigate} />;
  }
  if (active === "run") {
    return <RunMockup onNavigate={onNavigate} />;
  }
  if (active === "results") {
    return <ResultsMockup onNavigate={onNavigate} />;
  }
  if (active === "diagrams") {
    return <DiagramMockup onNavigate={onNavigate} />;
  }
  if (active === "validate") {
    return <ValidateMockup onNavigate={onNavigate} />;
  }
  return <AcpMockup onNavigate={onNavigate} />;
}

export function UxRedesignMockupPage() {
  const [activeScreen, setActiveScreen] = useState<ScreenKey>("home");

  return (
    <MockupShell active={activeScreen} onSelect={setActiveScreen}>
      <ActiveScreen active={activeScreen} onNavigate={setActiveScreen} />
    </MockupShell>
  );
}
