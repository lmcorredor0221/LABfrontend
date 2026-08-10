"use client";

import { useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  Bot,
  Boxes,
  Brain,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  ClipboardCheck,
  Database,
  Download,
  Eye,
  FileSearch,
  FileText,
  FolderKanban,
  Gauge,
  GitBranch,
  History,
  Home,
  Layers3,
  Library,
  Link2,
  Lock,
  MessageSquareText,
  MoreHorizontal,
  Network,
  Pause,
  Play,
  Plus,
  RefreshCcw,
  Route,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Square,
  Users,
  Waypoints,
  Wrench,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  isSaasScreenKey,
  SAAS_SCREEN_OPTIONS,
  SaasProductView,
  UnifiedDiagramViewer,
  type CommercialScenario,
  type SaasScreenKey,
} from "@/features/mockups/lean-evolution-saas-views";

type ScreenKey =
  | "command"
  | "stage"
  | "blocked"
  | "processing"
  | "attention"
  | "results"
  | "diagrams"
  | "estimate"
  | "validate"
  | "package"
  | SaasScreenKey;

type Tone = "violet" | "green" | "amber" | "red" | "blue" | "slate";
type LeanStage = "discover" | "define" | "design" | "tools" | "memory" | "estimate" | "validate" | "package";

type AttentionItem = {
  id: string;
  type: string;
  stage: string;
  title: string;
  detail: string;
  impact: string;
  owner: string;
  blocking: boolean;
  tone: Tone;
};

const SCREEN_OPTIONS: Array<{ key: ScreenKey; label: string; description: string }> = [
  { key: "command", label: "Inicio", description: "Command center" },
  { key: "stage", label: "Etapas LEAN", description: "Discovery a Memoria" },
  { key: "blocked", label: "Bloqueo", description: "Intervencion humana" },
  { key: "processing", label: "Procesando", description: "Actividad LLM" },
  { key: "attention", label: "Atencion", description: "Bandeja transversal" },
  { key: "results", label: "Resultado", description: "Revision y trazabilidad" },
  { key: "diagrams", label: "Diagramas", description: "Catalogo y canvas" },
  { key: "estimate", label: "Estimar", description: "Valor y escenarios" },
  { key: "validate", label: "Validar", description: "Suite y simulacion" },
  { key: "package", label: "Package", description: "Construccion ACP" },
  ...SAAS_SCREEN_OPTIONS,
];

const JOURNEY: Array<{
  key: LeanStage;
  label: string;
  subtitle: string;
  product: "Blueprint" | "ACP";
  state: "done" | "active" | "attention" | "locked";
}> = [
  { key: "discover", label: "Descubrir", subtitle: "Problema y contexto", product: "Blueprint", state: "done" },
  { key: "define", label: "Definir", subtitle: "Requisitos y alcance", product: "Blueprint", state: "done" },
  { key: "design", label: "Disenar", subtitle: "Arquitectura y conducta", product: "Blueprint", state: "active" },
  { key: "tools", label: "Herramientas", subtitle: "Capacidades y contratos", product: "Blueprint", state: "attention" },
  { key: "memory", label: "Memoria", subtitle: "Memoria y conocimiento", product: "Blueprint", state: "attention" },
  { key: "estimate", label: "Estimar", subtitle: "Resultados y ROI", product: "Blueprint", state: "locked" },
  { key: "validate", label: "Validar", subtitle: "Pruebas y GAPs", product: "ACP", state: "locked" },
  { key: "package", label: "Package", subtitle: "Paquete portable", product: "ACP", state: "locked" },
];

const LEAN_STAGE_OPERATING_MODEL: Array<{
  action: string;
  inputs: string;
  label: string;
  output: string;
  pending: string;
  stage: LeanStage;
  tone: Tone;
}> = [
  {
    action: "Completar contexto y ejecutar analisis LLM",
    inputs: "Dolor, proceso actual, objetivos, restricciones y fuentes iniciales.",
    label: "Descubrir",
    output: "Canvas validado, resumen ejecutivo y preguntas tempranas.",
    pending: "Datos faltantes o contradicciones se muestran dentro de la etapa.",
    stage: "discover",
    tone: "green",
  },
  {
    action: "Consolidar alcance y aprobar definicion",
    inputs: "Discovery aprobado, memoria recuperada y reglas de negocio.",
    label: "Definir",
    output: "Requerimientos, NFRs, alcance, decisiones y criterios de exito.",
    pending: "Gaps de diseno bloquean aqui, no se empujan al final.",
    stage: "define",
    tone: "blue",
  },
  {
    action: "Comparar patrones y confirmar arquitectura",
    inputs: "Requisitos, restricciones, riesgos, conocimiento y decisiones previas.",
    label: "Disenar",
    output: "Arquitectura, orquestacion, patrones, limites y diagramas base.",
    pending: "Decisiones criticas se convierten en accion principal.",
    stage: "design",
    tone: "violet",
  },
  {
    action: "Seleccionar herramientas minimas",
    inputs: "Arquitectura, flujos, fuentes, integraciones y side effects.",
    label: "Herramientas",
    output: "Toolset minimo, contratos, redundancias e incompatibilidades.",
    pending: "Dependencias como RAG o APIs quedan explicadas y accionables.",
    stage: "tools",
    tone: "amber",
  },
  {
    action: "Aprobar memoria y conocimiento",
    inputs: "Herramientas aprobadas, fuentes, ownership y politica de recuperacion.",
    label: "Memoria",
    output: "Memoria corta/larga, RAG, indexing, trazabilidad y control de contexto.",
    pending: "Si falta ingesta/document_ingestion, bloquea con remediacion clara.",
    stage: "memory",
    tone: "red",
  },
];

const ATTENTION_ITEMS: AttentionItem[] = [
  {
    id: "Q-14",
    type: "Pregunta bloqueante",
    stage: "Disenar",
    title: "Quien autoriza una compensacion con impacto financiero?",
    detail: "El LLM encontro dos reglas de negocio compatibles, pero ninguna identifica al responsable final.",
    impact: "Detiene la aprobacion del diseno y la definicion del approval gate.",
    owner: "Product owner",
    blocking: true,
    tone: "red",
  },
  {
    id: "G-08",
    type: "GAP de informacion",
    stage: "Herramientas",
    title: "Falta confirmar el sistema fuente de tickets",
    detail: "La capacidad es necesaria, pero el proveedor se puede decidir durante implementacion.",
    impact: "No bloquea el Blueprint; se trasladara como pregunta estructurada al ACP.",
    owner: "Arquitectura",
    blocking: false,
    tone: "amber",
  },
  {
    id: "S-03",
    type: "Artefacto desactualizado",
    stage: "Memoria",
    title: "La estrategia RAG usa una version anterior de Herramientas",
    detail: "Se aprobo document_ingestion despues de generar la propuesta de Memoria.",
    impact: "Requiere regenerar Memoria antes de aprobarla.",
    owner: "Lean Builder",
    blocking: true,
    tone: "violet",
  },
  {
    id: "W-19",
    type: "Recomendacion",
    stage: "Definir",
    title: "Precisar el objetivo de latencia del canal asincrono",
    detail: "El NFR actual usa el termino rapido sin una metrica verificable.",
    impact: "Reduce la confianza de estimacion, pero no detiene el diseno.",
    owner: "Analista",
    blocking: false,
    tone: "blue",
  },
];

const toneClass: Record<Tone, string> = {
  violet: "border-violet-200 bg-violet-50 text-violet-700",
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  red: "border-rose-200 bg-rose-50 text-rose-700",
  blue: "border-sky-200 bg-sky-50 text-sky-700",
  slate: "border-slate-200 bg-slate-50 text-slate-600",
};

function Badge({ children, tone = "slate", className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold", toneClass[tone], className)}>
      {children}
    </span>
  );
}

function Button({
  children,
  icon: Icon,
  variant = "secondary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  icon?: LucideIcon;
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const styles = {
    primary: "border-violet-600 bg-violet-600 text-white shadow-[0_12px_28px_rgba(91,70,246,0.24)] hover:bg-violet-700",
    secondary: "border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50",
    ghost: "border-transparent bg-transparent text-slate-600 hover:bg-slate-100",
    danger: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
  };
  return (
    <button
      {...props}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-[13px] font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:cursor-not-allowed disabled:opacity-45",
        styles[variant],
        className,
      )}
      type={props.type ?? "button"}
    >
      {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-2xl border border-slate-200 bg-white shadow-[0_10px_32px_rgba(15,23,42,0.045)]", className)}>{children}</section>;
}

function IconButton({ label, children, onClick }: { label: string; children: ReactNode; onClick?: () => void }) {
  return (
    <button
      aria-label={label}
      className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function ReviewNavigator({ active, onSelect }: { active: ScreenKey; onSelect: (screen: ScreenKey) => void }) {
  return (
    <div className="sticky top-0 z-50 border-b border-slate-200 bg-[#f7f7fb]/95 px-4 py-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1920px] items-center gap-4">
        <div className="hidden min-w-[240px] xl:block">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-600">Mockup evolutivo</p>
          <p className="mt-0.5 text-[12px] font-semibold text-slate-600">{SCREEN_OPTIONS.length} vistas / LEAN + producto SaaS</p>
        </div>
        <div aria-label="Escenarios del mockup" className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1" role="tablist">
          {SCREEN_OPTIONS.map((screen) => (
            <button
              aria-selected={active === screen.key}
              className={cn(
                "min-h-11 shrink-0 rounded-xl border px-3.5 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600",
                active === screen.key
                  ? "border-slate-900 bg-slate-950 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
              )}
              key={screen.key}
              onClick={() => onSelect(screen.key)}
              role="tab"
              type="button"
            >
              <span className="block text-[12px] font-bold">{screen.label}</span>
              <span className={cn("block text-[9px]", active === screen.key ? "text-slate-300" : "text-slate-400")}>{screen.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const GLOBAL_NAV: Array<{ label: string; icon: LucideIcon; active?: boolean }> = [
  { label: "Inicio", icon: Home },
  { label: "Proyectos", icon: FolderKanban, active: true },
  { label: "Agentes", icon: Bot },
  { label: "Plantillas", icon: Layers3 },
  { label: "Evaluaciones", icon: ClipboardCheck },
  { label: "Monitoreo", icon: Gauge },
  { label: "Biblioteca", icon: Library },
  { label: "Integraciones", icon: Link2 },
  { label: "Configuracion", icon: Settings },
];

function GlobalSidebar({ activeScreen, onNavigate }: { activeScreen: ScreenKey; onNavigate: (screen: ScreenKey) => void }) {
  return (
    <aside className="sticky top-0 hidden h-[calc(100vh/0.67-68px)] min-h-[980px] flex-col bg-[#071329] text-white lg:flex">
      <div className="flex h-[74px] items-center gap-3 border-b border-white/10 px-5">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-950/30">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-[14px] font-black tracking-tight">Lean Agent</p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Builder</p>
        </div>
      </div>
      <nav aria-label="Navegacion principal" className="flex-1 space-y-1.5 p-3">
        {GLOBAL_NAV.map((item) => {
          const Icon = item.icon;
          const isActive = item.active && !["command"].includes(activeScreen);
          return (
            <button
              className={cn(
                "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-[12px] font-semibold transition",
                isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white",
              )}
              key={item.label}
              onClick={() => item.label === "Inicio" && onNavigate("command")}
              type="button"
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/20 text-[11px] font-black text-violet-200">LB</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-bold">Lean Builder</p>
              <p className="truncate text-[10px] text-slate-400">Workspace principal</p>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-500" />
          </div>
        </div>
      </div>
    </aside>
  );
}

function AppTopbar({ onNavigate }: { onNavigate: (screen: ScreenKey) => void }) {
  return (
    <header className="flex min-h-[74px] items-center justify-between border-b border-slate-200 bg-white px-5 lg:px-7">
      <div className="flex min-w-0 items-center gap-3 text-[12px] text-slate-500">
        <span>Proyectos</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="truncate font-bold text-slate-900">Asistente de soporte inteligente</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="hidden min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-bold text-slate-700 hover:bg-slate-50 sm:flex"
          onClick={() => onNavigate("attention")}
          type="button"
        >
          <AlertCircle className="h-4 w-4 text-rose-600" />
          3 requieren atencion
        </button>
        <IconButton label="Buscar"><Search className="h-4 w-4" /></IconButton>
        <IconButton label="Notificaciones"><Bell className="h-4 w-4" /><span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-rose-500" /></IconButton>
        <span className="ml-1 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-[11px] font-black text-white">AM</span>
      </div>
    </header>
  );
}

function ProjectContextHeader({
  activeSection = "Trabajo",
  onNavigate,
  runState = "Sin ejecucion activa",
  runTone = "slate",
}: {
  activeSection?: "Trabajo" | "Blueprint" | "ACP" | "Diagramas" | "Artefactos" | "Atencion" | "Actividad";
  onNavigate: (screen: ScreenKey) => void;
  runState?: string;
  runTone?: Tone;
}) {
  const sections = ["Trabajo", "Blueprint", "ACP", "Diagramas", "Artefactos", "Atencion", "Actividad"] as const;
  function sectionTarget(section: (typeof sections)[number]): ScreenKey | null {
    if (section === "Trabajo") return "stage";
    if (section === "Blueprint") return "blueprint-free";
    if (section === "ACP") return "acp-invitation";
    if (section === "Atencion") return "attention";
    if (section === "Diagramas") return "diagrams";
    if (section === "Artefactos") return "export-center";
    if (section === "Actividad") return "commercial-audit";
    return "stage";
  }
  return (
    <div className="border-b border-slate-200 bg-white px-5 pt-5 lg:px-7">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="violet">Blueprint</Badge>
            <Badge tone="green">2 etapas aprobadas</Badge>
            <Badge tone={runTone}><CircleDot className="h-3 w-3" />{runState}</Badge>
          </div>
          <h1 className="mt-3 text-[26px] font-black tracking-[-0.035em] text-slate-950">Asistente de soporte inteligente</h1>
          <p className="mt-1 text-[12px] text-slate-500">Workspace Lean Builder / Actualizado hace 2 min / Version Blueprint v12</p>
        </div>
        <div className="grid min-w-[360px] grid-cols-[1fr_auto] gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
          <div>
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500"><span>Progreso Blueprint</span><span>2 de 6 etapas</span></div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full w-[33%] rounded-full bg-violet-600" /></div>
          </div>
          <button className="flex items-center gap-2 rounded-xl bg-white px-3 text-[11px] font-bold text-rose-700 shadow-sm" onClick={() => onNavigate("attention")} type="button">
            <AlertCircle className="h-4 w-4" />3 pendientes
          </button>
        </div>
      </div>
      <nav aria-label="Secciones del proyecto" className="mt-5 flex gap-1 overflow-x-auto">
        {sections.map((section) => (
          <button
            aria-current={activeSection === section ? "page" : undefined}
            className={cn(
              "min-h-11 shrink-0 border-b-2 px-3 text-[12px] font-bold transition",
              activeSection === section ? "border-violet-600 text-violet-700" : "border-transparent text-slate-500 hover:text-slate-800",
            )}
            key={section}
            onClick={() => {
              const target = sectionTarget(section);
              if (target) onNavigate(target);
            }}
            type="button"
          >
            {section}
            {section === "Atencion" ? <span className="ml-2 rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] text-rose-700">3</span> : null}
          </button>
        ))}
      </nav>
    </div>
  );
}

function LeanRail({ activeStage, onNavigate }: { activeStage: LeanStage; onNavigate: (screen: ScreenKey) => void }) {
  function go(stage: LeanStage) {
    if (stage === "estimate") onNavigate("estimate");
    else if (stage === "validate") onNavigate("validate");
    else if (stage === "package") onNavigate("package");
    else onNavigate("stage");
  }
  return (
    <aside className="hidden border-r border-slate-200 bg-white p-4 xl:block">
      <div className="flex items-center justify-between px-2">
        <div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Ruta LEAN</p><p className="mt-1 text-[13px] font-black text-slate-900">Blueprint + ACP</p></div>
        <IconButton label="Contraer ruta"><ArrowLeft className="h-4 w-4" /></IconButton>
      </div>
      <div className="mt-5 space-y-1">
        {JOURNEY.map((step, index) => {
          const active = step.key === activeStage;
          return (
            <button
              className={cn(
                "group relative flex min-h-[66px] w-full items-start gap-3 rounded-xl border p-3 text-left transition",
                active ? "border-violet-200 bg-violet-50" : "border-transparent hover:border-slate-200 hover:bg-slate-50",
              )}
              key={step.key}
              onClick={() => go(step.key)}
              type="button"
            >
              {index < JOURNEY.length - 1 ? <span className="absolute left-[26px] top-[46px] h-[31px] w-px bg-slate-200" /> : null}
              <span
                className={cn(
                  "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-black",
                  step.state === "done" && "border-emerald-300 bg-emerald-50 text-emerald-700",
                  step.state === "active" && "border-violet-600 bg-violet-600 text-white",
                  step.state === "attention" && "border-amber-300 bg-amber-50 text-amber-700",
                  step.state === "locked" && "border-slate-200 bg-white text-slate-400",
                )}
              >
                {step.state === "done" ? <Check className="h-3.5 w-3.5" /> : step.state === "attention" ? <AlertCircle className="h-3.5 w-3.5" /> : step.state === "locked" ? <Lock className="h-3 w-3" /> : index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn("block text-[12px] font-black", active ? "text-violet-900" : "text-slate-800")}>{step.label}</span>
                <span className="mt-0.5 block text-[10px] leading-4 text-slate-500">{step.subtitle}</span>
              </span>
              {index === 5 || index === 6 ? <span className="absolute right-2 top-2 text-[8px] font-black uppercase tracking-wider text-slate-400">{step.product}</span> : null}
            </button>
          );
        })}
      </div>
      <div className="mt-5 rounded-2xl border border-violet-100 bg-violet-50 p-4">
        <div className="flex items-center gap-2 text-violet-700"><Sparkles className="h-4 w-4" /><span className="text-[10px] font-black uppercase tracking-wider">Memoria activa</span></div>
        <p className="mt-2 text-[11px] leading-5 text-slate-600">10 evidencias y 4 decisiones aprobadas forman el contexto actual.</p>
        <button className="mt-3 text-[11px] font-bold text-violet-700 underline-offset-4 hover:underline" type="button">Ver contexto usado</button>
      </div>
    </aside>
  );
}

function StageContextRail({ onNavigate, variant = "normal" }: { onNavigate: (screen: ScreenKey) => void; variant?: "normal" | "blocked" | "processing" }) {
  return (
    <aside className="hidden space-y-4 border-l border-slate-200 bg-[#fbfbfd] p-4 2xl:block">
      <Panel className="p-4">
        <div className="flex items-center justify-between"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Estado de etapa</p><Badge tone={variant === "blocked" ? "red" : variant === "processing" ? "blue" : "amber"}>{variant === "blocked" ? "Bloqueada" : variant === "processing" ? "Procesando" : "En revision"}</Badge></div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[['2', 'Pendientes'], ['6', 'Artefactos'], ['10', 'Evidencias']].map(([value, label]) => <div className="rounded-xl bg-slate-50 px-2 py-3" key={label}><p className="text-[17px] font-black text-slate-950">{value}</p><p className="text-[9px] text-slate-500">{label}</p></div>)}
        </div>
      </Panel>
      <Panel className="overflow-hidden">
        <div className="border-b border-slate-100 p-4"><div className="flex items-center justify-between"><p className="text-[12px] font-black text-slate-900">Requiere atencion</p><button className="text-[10px] font-bold text-violet-700" onClick={() => onNavigate("attention")} type="button">Ver todo</button></div></div>
        <div className="space-y-2 p-3">
          <button className="w-full rounded-xl border border-rose-200 bg-rose-50 p-3 text-left" onClick={() => onNavigate("blocked")} type="button"><div className="flex items-center gap-2 text-[10px] font-bold text-rose-700"><AlertCircle className="h-3.5 w-3.5" />Bloquea Disenar</div><p className="mt-1.5 text-[11px] font-semibold leading-4 text-slate-800">Definir autoridad para compensaciones</p></button>
          <button className="w-full rounded-xl border border-amber-200 bg-amber-50 p-3 text-left" type="button"><div className="flex items-center gap-2 text-[10px] font-bold text-amber-700"><AlertTriangle className="h-3.5 w-3.5" />Recomendacion</div><p className="mt-1.5 text-[11px] font-semibold leading-4 text-slate-800">Precisar latencia asincrona</p></button>
        </div>
      </Panel>
      <Panel className="p-4">
        <div className="flex items-center justify-between"><p className="text-[12px] font-black text-slate-900">Artefactos vinculados</p><span className="text-[10px] text-slate-400">v12</span></div>
        <div className="mt-3 space-y-2">
          {[['Arquitectura', Network], ['Orquestacion', Waypoints], ['Decision log', FileText]].map(([label, IconValue]) => { const Icon = IconValue as LucideIcon; return <button className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-slate-200 px-3 text-left text-[11px] font-semibold text-slate-700 hover:bg-slate-50" key={String(label)} onClick={() => label !== 'Decision log' && onNavigate("diagrams")} type="button"><Icon className="h-4 w-4 text-violet-600" />{String(label)}<ChevronRight className="ml-auto h-3.5 w-3.5 text-slate-400" /></button>; })}
        </div>
      </Panel>
      <Panel className="p-4">
        <div className="flex items-center gap-2"><History className="h-4 w-4 text-slate-500" /><p className="text-[12px] font-black text-slate-900">Ultima actividad</p></div>
        <p className="mt-3 text-[11px] leading-5 text-slate-600">El critic LLM encontro 1 decision pendiente y confirmo cobertura de 14/15 requisitos.</p>
        <button className="mt-3 text-[11px] font-bold text-violet-700" onClick={() => onNavigate("processing")} type="button">Abrir trazabilidad de corrida</button>
      </Panel>
    </aside>
  );
}

function ProjectLayout({
  children,
  onNavigate,
  activeStage = "design",
  activeSection = "Trabajo",
  contextVariant = "normal",
  runState,
  runTone,
  showContext = true,
}: {
  children: ReactNode;
  onNavigate: (screen: ScreenKey) => void;
  activeStage?: LeanStage;
  activeSection?: "Trabajo" | "Blueprint" | "ACP" | "Diagramas" | "Artefactos" | "Atencion" | "Actividad";
  contextVariant?: "normal" | "blocked" | "processing";
  runState?: string;
  runTone?: Tone;
  showContext?: boolean;
}) {
  return (
    <>
      <ProjectContextHeader activeSection={activeSection} onNavigate={onNavigate} runState={runState} runTone={runTone} />
      <div className={cn("grid min-h-[950px]", showContext ? "xl:grid-cols-[250px_minmax(0,1fr)] 2xl:grid-cols-[250px_minmax(0,1fr)_300px]" : "xl:grid-cols-[250px_minmax(0,1fr)]")}>
        <LeanRail activeStage={activeStage} onNavigate={onNavigate} />
        <main className="min-w-0 bg-[#f7f7fb] p-4 lg:p-6">{children}</main>
        {showContext ? <StageContextRail onNavigate={onNavigate} variant={contextVariant} /> : null}
      </div>
    </>
  );
}

function CommandCenter({ onNavigate }: { onNavigate: (screen: ScreenKey) => void }) {
  return (
    <main className="min-h-[1100px] bg-[#f7f7fb] p-5 lg:p-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div><Badge tone="violet">Workspace Lean Builder</Badge><h1 className="mt-3 text-[34px] font-black tracking-[-0.045em] text-slate-950">Tu trabajo, en orden de impacto</h1><p className="mt-2 max-w-2xl text-[13px] leading-6 text-slate-600">Continua el flujo LEAN, resuelve bloqueos y consulta resultados sin perder el contexto de tus proyectos.</p></div>
          <Button icon={Plus} variant="primary">Nuevo proyecto</Button>
        </div>
        <div className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(340px,0.8fr)]">
          <Panel className="overflow-hidden border-violet-200">
            <div className="bg-[radial-gradient(circle_at_90%_10%,rgba(139,92,246,0.18),transparent_35%),linear-gradient(135deg,#ffffff,#f5f3ff)] p-6 lg:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><Badge tone="red"><AlertCircle className="h-3 w-3" />Accion bloqueante</Badge><span className="text-[11px] text-slate-500">Detectada hace 12 min</span></div><Badge tone="slate">Disenar / Blueprint</Badge></div>
              <p className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-violet-700">Continua donde importa</p>
              <h2 className="mt-2 max-w-3xl text-[28px] font-black tracking-[-0.035em] text-slate-950">Define quien autoriza compensaciones con impacto financiero</h2>
              <p className="mt-3 max-w-3xl text-[13px] leading-6 text-slate-600">La decision completa el approval gate del agente. Al responder, Lean Builder actualizara el diseno y volvera a ejecutar la validacion de cobertura.</p>
              <div className="mt-6 flex flex-wrap gap-3"><Button icon={MessageSquareText} onClick={() => onNavigate("blocked")} variant="primary">Resolver pregunta</Button><Button icon={Eye} onClick={() => onNavigate("stage")}>Revisar contexto</Button></div>
            </div>
            <div className="grid border-t border-violet-100 bg-white sm:grid-cols-3">
              {[['Proyecto', 'Asistente de soporte'], ['Impacto', 'Bloquea Disenar'], ['Despues', 'Regenerar y revisar']].map(([label, value]) => <div className="border-b border-slate-100 px-6 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0" key={label}><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-[12px] font-bold text-slate-800">{value}</p></div>)}
            </div>
          </Panel>
          <Panel className="p-5">
            <div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Requiere tu atencion</p><h2 className="mt-1 text-[19px] font-black">4 items abiertos</h2></div><button className="text-[11px] font-bold text-violet-700" onClick={() => onNavigate("attention")} type="button">Abrir bandeja</button></div>
            <div className="mt-4 space-y-2.5">
              {ATTENTION_ITEMS.slice(0, 3).map((item) => <button className="flex w-full items-start gap-3 rounded-xl border border-slate-200 p-3 text-left hover:bg-slate-50" key={item.id} onClick={() => onNavigate(item.blocking ? "blocked" : "attention")} type="button"><span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-[10px] font-black", toneClass[item.tone])}>{item.id.split('-')[0]}</span><span className="min-w-0 flex-1"><span className="block text-[11px] font-black text-slate-800">{item.title}</span><span className="mt-1 block text-[9px] text-slate-500">{item.stage} / {item.owner}</span></span><ChevronRight className="mt-2 h-4 w-4 text-slate-400" /></button>)}
            </div>
          </Panel>
        </div>
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
          <Panel className="p-5">
            <div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Proyectos recientes</p><h2 className="mt-1 text-[19px] font-black">Estado y siguiente accion</h2></div><Button variant="ghost">Ver proyectos</Button></div>
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
              {[['Asistente de soporte inteligente', 'Disenar', '1 bloqueo', 'Resolver autoridad', 'red'], ['Analista de renovaciones', 'Memoria', 'En revision', 'Aprobar estrategia', 'amber'], ['Copiloto de operaciones', 'Estimar', 'Blueprint listo', 'Revisar ROI', 'green']].map(([name, stage, status, action, tone]) => <button className="grid min-h-[70px] w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-slate-100 px-4 text-left last:border-b-0 hover:bg-slate-50 sm:grid-cols-[minmax(0,1fr)_100px_110px_160px]" key={name} onClick={() => onNavigate(name === 'Asistente de soporte inteligente' ? 'blocked' : stage === 'Estimar' ? 'estimate' : 'stage')} type="button"><span><span className="block text-[12px] font-black text-slate-900">{name}</span><span className="mt-1 block text-[9px] text-slate-500">Actualizado hoy</span><span className="mt-2 flex items-center gap-2 sm:hidden"><span className="text-[9px] font-semibold text-slate-500">{stage}</span><Badge tone={tone as Tone}>{status}</Badge></span></span><span className="hidden text-[11px] font-semibold text-slate-600 sm:block">{stage}</span><Badge className="hidden sm:inline-flex" tone={tone as Tone}>{status}</Badge><span className="flex items-center justify-end gap-2 text-[11px] font-bold text-violet-700"><span className="hidden sm:inline">{action}</span><ArrowRight className="h-3.5 w-3.5" /></span></button>)}
            </div>
          </Panel>
          <Panel className="p-5">
            <div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Actividad del sistema</p><h2 className="mt-1 text-[19px] font-black">Ejecuciones recientes</h2></div><Activity className="h-5 w-5 text-violet-600" /></div>
            <div className="mt-4 space-y-4">
              {[['Criticar arquitectura', 'Completado con 1 observacion', 'green'], ['Indexar 18 documentos', '12 de 18 fuentes procesadas', 'blue'], ['Actualizar memoria', 'Esperando aprobacion de herramienta', 'amber']].map(([label, status, tone], index) => <div className="flex gap-3" key={label}><span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border", toneClass[tone as Tone])}>{index === 0 ? <Check className="h-4 w-4" /> : index === 1 ? <RefreshCcw className="h-4 w-4" /> : <Pause className="h-4 w-4" />}</span><div><p className="text-[11px] font-black text-slate-800">{label}</p><p className="mt-1 text-[10px] text-slate-500">{status}</p></div></div>)}
            </div>
          </Panel>
        </div>
      </div>
    </main>
  );
}

function StageHeader({ status, tone = "amber" }: { status: string; tone?: Tone }) {
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 lg:flex-row lg:items-start lg:justify-between">
      <div><div className="flex flex-wrap items-center gap-2"><Badge tone="violet">Etapa 3 de 8</Badge><Badge tone={tone}>{status}</Badge></div><h2 className="mt-3 text-[25px] font-black tracking-[-0.035em] text-slate-950">Disenar la arquitectura y el comportamiento</h2><p className="mt-1.5 max-w-3xl text-[12px] leading-5 text-slate-600">Evalua alternativas, define limites y confirma como razona, coordina, escala y se recupera el sistema agentico.</p></div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 lg:max-w-[270px]"><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Criterio para avanzar</p><p className="mt-1.5 text-[11px] font-semibold leading-4 text-slate-700">Alternativa seleccionada, findings criticos resueltos y aprobacion registrada.</p></div>
    </div>
  );
}

function StageWorkspace({ onNavigate }: { onNavigate: (screen: ScreenKey) => void }) {
  const [alternative, setAlternative] = useState("Supervision jerarquica");
  const alternatives = [
    { name: "Supervision jerarquica", score: "92%", detail: "Un supervisor enruta, valida y escala a especialistas.", recommended: true },
    { name: "Router especializado", score: "84%", detail: "Clasificacion directa con menor costo y menos control.", recommended: false },
    { name: "Swarm colaborativo", score: "68%", detail: "Mayor flexibilidad, pero complejidad innecesaria para el MVP.", recommended: false },
  ];
  return (
    <ProjectLayout activeStage="design" onNavigate={onNavigate}>
      <StageHeader status="En revision" />
      <Panel className="mb-4 overflow-hidden border-slate-200">
        <div className="border-b border-slate-200 bg-white p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Badge tone="violet">Patron transversal aplicado a la app real</Badge>
              <h3 className="mt-3 text-[22px] font-black tracking-[-0.035em] text-slate-950">
                Cada etapa conserva sus funciones, pero prioriza la accion que desbloquea avance
              </h3>
              <p className="mt-2 max-w-4xl text-[12px] leading-5 text-slate-600">
                El redisenio no elimina formularios, resultados, preguntas, gaps, decisiones ni diagramas. Los reordena por
                contexto: accion principal primero, informacion generada despues y artefactos conectados al producto SaaS.
              </p>
            </div>
            <Button icon={AlertCircle} onClick={() => onNavigate("attention")}>
              Ver bandeja transversal
            </Button>
          </div>
        </div>
        <div className="grid gap-3 p-4 xl:grid-cols-5">
          {LEAN_STAGE_OPERATING_MODEL.map((item) => (
            <button
              className={cn(
                "rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(15,23,42,0.08)]",
                item.stage === "design" ? "border-violet-400 bg-violet-50" : "border-slate-200 bg-white",
              )}
              key={item.stage}
              onClick={() => onNavigate(item.stage === "tools" || item.stage === "memory" ? "attention" : "stage")}
              type="button"
            >
              <div className="flex items-center justify-between gap-2">
                <Badge tone={item.tone}>{item.label}</Badge>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
              <p className="mt-3 text-[12px] font-black leading-5 text-slate-900">{item.action}</p>
              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Entradas</p>
                  <p className="mt-1 text-[10px] leading-4 text-slate-600">{item.inputs}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Salida</p>
                  <p className="mt-1 text-[10px] leading-4 text-slate-600">{item.output}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Pendientes y gaps</p>
                  <p className="mt-1 text-[10px] leading-4 text-slate-600">{item.pending}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </Panel>
      <Panel className="overflow-hidden border-violet-200">
        <div className="border-b border-violet-100 bg-violet-50/60 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-700">Tu accion ahora</p><h3 className="mt-2 text-[21px] font-black text-slate-950">Compara las alternativas y confirma el patron de orquestacion</h3><p className="mt-2 max-w-3xl text-[12px] leading-5 text-slate-600">Lean Builder recomienda supervision jerarquica porque cubre 14/15 requisitos, reduce side effects y conserva escalamiento humano.</p></div><Badge tone="green"><Sparkles className="h-3 w-3" />Recomendacion LLM / confianza alta</Badge></div>
        </div>
        <div className="grid gap-3 p-5 lg:grid-cols-3">
          {alternatives.map((item) => <button aria-pressed={alternative === item.name} className={cn("relative rounded-2xl border p-4 text-left transition", alternative === item.name ? "border-violet-500 bg-violet-50 shadow-[0_8px_24px_rgba(91,70,246,0.1)]" : "border-slate-200 bg-white hover:bg-slate-50")} key={item.name} onClick={() => setAlternative(item.name)} type="button">{item.recommended ? <Badge className="absolute right-3 top-3" tone="violet">Recomendada</Badge> : null}<span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white"><Network className="h-4 w-4" /></span><div className="mt-4 flex items-center justify-between"><p className="text-[13px] font-black text-slate-900">{item.name}</p><span className="text-[12px] font-black text-violet-700">{item.score}</span></div><p className="mt-2 text-[10px] leading-4 text-slate-500">{item.detail}</p><span className="mt-4 flex items-center gap-2 text-[10px] font-bold text-violet-700">Ver razones y tradeoffs <ChevronRight className="h-3 w-3" /></span></button>)}
        </div>
      </Panel>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel className="p-5"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Arquitectura seleccionada</p><h3 className="mt-1 text-[17px] font-black">{alternative}</h3></div><button className="text-[11px] font-bold text-violet-700" onClick={() => onNavigate("diagrams")} type="button">Abrir diagrama</button></div><div className="relative mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,.14),transparent_38%),#f8fafc] p-5"><div className="grid grid-cols-3 gap-3">{[['Supervisor', Bot], ['Especialistas', Users], ['Humano', ShieldCheck]].map(([label, IconValue]) => { const Icon = IconValue as LucideIcon; return <div className="rounded-xl border border-white bg-white p-3 text-center shadow-sm" key={String(label)}><Icon className="mx-auto h-5 w-5 text-violet-600" /><p className="mt-2 text-[10px] font-bold text-slate-700">{String(label)}</p></div>; })}</div><div className="mx-auto mt-3 h-8 w-px bg-violet-300" /><div className="rounded-xl bg-slate-900 px-4 py-3 text-center text-[10px] font-bold text-white">Herramientas + memoria + auditoria</div></div></Panel>
        <Panel className="p-5"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Cobertura y critic</p><h3 className="mt-1 text-[17px] font-black">14 de 15 requisitos cubiertos</h3></div><Badge tone="amber">1 decision pendiente</Badge></div><div className="mt-4 h-2 rounded-full bg-slate-100"><div className="h-full w-[93%] rounded-full bg-emerald-500" /></div><div className="mt-4 space-y-2">{[['Roles y limites', 'Cubierto', 'green'], ['Retries e idempotencia', 'Cubierto', 'green'], ['Autoridad financiera', 'Requiere decision', 'red']].map(([label, value, tone]) => <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5" key={label}><span className="text-[11px] font-semibold text-slate-700">{label}</span><Badge tone={tone as Tone}>{value}</Badge></div>)}</div></Panel>
      </div>
      <div className="sticky bottom-4 z-20 mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.16)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[12px] font-black text-slate-900">Seleccion actual: {alternative}</p><p className="mt-1 text-[10px] text-slate-500">Antes de aprobar falta resolver 1 decision bloqueante.</p></div><div className="flex gap-2"><Button icon={FileText}>Guardar revision</Button><Button icon={MessageSquareText} onClick={() => onNavigate("blocked")} variant="primary">Resolver y aprobar</Button></div></div>
    </ProjectLayout>
  );
}

function BlockedWorkspace({ onNavigate }: { onNavigate: (screen: ScreenKey) => void }) {
  const [answer, setAnswer] = useState("");
  return (
    <ProjectLayout activeStage="design" contextVariant="blocked" onNavigate={onNavigate} runState="Esperando respuesta" runTone="red">
      <StageHeader status="Bloqueada por decision" tone="red" />
      <Panel className="overflow-hidden border-rose-300 shadow-[0_16px_50px_rgba(225,29,72,0.08)]">
        <div className="border-b border-rose-200 bg-[radial-gradient(circle_at_90%_0%,rgba(251,113,133,.18),transparent_35%),#fff1f2] p-5 lg:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><Badge tone="red"><AlertCircle className="h-3.5 w-3.5" />Pregunta bloqueante / Q-14</Badge><span className="text-[10px] font-semibold text-rose-700">Detectada por critic LLM hace 12 min</span></div>
          <h2 className="mt-5 max-w-4xl text-[26px] font-black tracking-[-0.035em] text-slate-950">Quien debe autorizar una compensacion que tenga impacto financiero?</h2>
          <p className="mt-3 max-w-4xl text-[13px] leading-6 text-slate-600">El diseno necesita una autoridad explicita para no permitir que el agente ejecute side effects fuera de las reglas de negocio.</p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">{[['Que falta', 'El rol que toma la decision final.'], ['Que se detuvo', 'Aprobacion de Disenar y contrato de escalamiento.'], ['Que ocurrira', 'Se actualizara el gate y se repetira el critic.']].map(([label, value]) => <div className="rounded-xl border border-rose-200 bg-white/80 p-3.5" key={label}><p className="text-[9px] font-black uppercase tracking-wider text-rose-600">{label}</p><p className="mt-1.5 text-[11px] font-semibold leading-4 text-slate-700">{value}</p></div>)}</div>
        </div>
        <div className="p-5 lg:p-6">
          <fieldset>
            <legend className="text-[13px] font-black text-slate-900">Selecciona la regla aplicable</legend>
            <p className="mt-1 text-[11px] text-slate-500">Puedes ajustar la redaccion antes de confirmar.</p>
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              {[['supervisor', 'Supervisor de soporte', 'Autoriza hasta COP 200.000; montos superiores escalan.'], ['finance', 'Responsable financiero', 'Toda compensacion requiere aprobacion financiera.'], ['policy', 'Regla por monto', 'Hasta COP 50.000 automatico; despues requiere aprobacion.']].map(([value, label, detail]) => <label className={cn("cursor-pointer rounded-2xl border p-4 transition", answer === value ? "border-violet-500 bg-violet-50" : "border-slate-200 hover:bg-slate-50")} key={value}><span className="flex items-start gap-3"><input checked={answer === value} className="mt-1 h-4 w-4 accent-violet-600" name="authority" onChange={() => setAnswer(value)} type="radio" value={value} /><span><span className="block text-[12px] font-black text-slate-900">{label}</span><span className="mt-1 block text-[10px] leading-4 text-slate-500">{detail}</span></span></span></label>)}
            </div>
            <label className="mt-4 block"><span className="text-[11px] font-bold text-slate-700">Contexto adicional (opcional)</span><textarea className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 bg-white p-3 text-[12px] outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" placeholder="Agrega limites, excepciones o el responsable..." /></label>
          </fieldset>
          <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2 text-[10px] text-slate-500"><ShieldCheck className="h-4 w-4 text-emerald-600" />La respuesta quedara versionada en reglas, arquitectura y trazabilidad.</div><div className="flex gap-2"><Button onClick={() => onNavigate("stage")}>Volver al diseno</Button><Button disabled={!answer} icon={ArrowRight} onClick={() => onNavigate("processing")} variant="primary">Confirmar y regenerar</Button></div></div>
        </div>
      </Panel>
      <Panel className="mt-4 p-5"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" /><div><h3 className="text-[13px] font-black text-slate-900">Otras recomendaciones no bloqueantes</h3><p className="mt-1 text-[11px] leading-5 text-slate-600">La latencia del canal asincrono y el proveedor de ticketing pueden resolverse despues. No impiden confirmar esta decision.</p><button className="mt-2 text-[11px] font-bold text-violet-700" onClick={() => onNavigate("attention")} type="button">Ver 2 recomendaciones</button></div></div></Panel>
    </ProjectLayout>
  );
}

function ProcessingWorkspace({ onNavigate }: { onNavigate: (screen: ScreenKey) => void }) {
  const [paused, setPaused] = useState(false);
  const steps = [
    { label: "Validar la respuesta", detail: "Regla y owner confirmados", state: "done" },
    { label: "Recuperar contexto", detail: "10 evidencias + 4 decisiones", state: "done" },
    { label: "Actualizar arquitectura", detail: paused ? "Pausado en checkpoint seguro" : "Generando approval gate y limites", state: paused ? "paused" : "active" },
    { label: "Ejecutar critic", detail: "Cobertura, seguridad y consistencia", state: "pending" },
    { label: "Persistir version", detail: "Blueprint v13 y artefactos afectados", state: "pending" },
  ];
  return (
    <ProjectLayout activeStage="design" contextVariant="processing" onNavigate={onNavigate} runState={paused ? "Ejecucion pausada" : "LLM procesando"} runTone={paused ? "amber" : "blue"}>
      <StageHeader status={paused ? "Pausada" : "Procesando"} tone={paused ? "amber" : "blue"} />
      <Panel className="overflow-hidden border-sky-200">
        <div className="border-b border-sky-100 bg-[radial-gradient(circle_at_90%_10%,rgba(56,189,248,.16),transparent_35%),#f0f9ff] p-5 lg:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><Badge tone={paused ? "amber" : "blue"}>{paused ? <Pause className="h-3 w-3" /> : <RefreshCcw className="h-3 w-3 animate-spin" />}{paused ? "Pausada en checkpoint" : "Actividad en curso"}</Badge><h2 className="mt-4 text-[25px] font-black tracking-[-0.035em] text-slate-950">{paused ? "La ejecucion esta pausada y el trabajo esta seguro" : "Actualizando el diseno con tu decision"}</h2><p className="mt-2 max-w-3xl text-[12px] leading-5 text-slate-600">{paused ? "Puedes reanudar desde el mismo checkpoint sin repetir los pasos completados." : "No mostramos un tiempo ni porcentaje porque la duracion de la generacion no es determinista. El avance se comunica por pasos verificables."}</p></div><div className="rounded-xl border border-sky-200 bg-white/80 px-4 py-3"><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Ultima senal</p><p className="mt-1 text-[12px] font-black text-emerald-700">Hace 4 segundos</p><p className="mt-0.5 text-[9px] text-slate-500">Run RUN-284 / checkpoint 2</p></div></div>
        </div>
        <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,.75fr)] lg:p-6">
          <div><div className="flex items-center justify-between"><h3 className="text-[14px] font-black text-slate-900">Progreso por actividad</h3><span className="text-[10px] font-semibold text-slate-500">2 pasos completados / 1 actual / 2 pendientes</span></div><div aria-live="polite" className="mt-4 space-y-2.5">{steps.map((step, index) => <div className={cn("flex items-center gap-4 rounded-xl border p-3.5", step.state === 'active' && 'border-sky-300 bg-sky-50', step.state === 'paused' && 'border-amber-300 bg-amber-50', step.state === 'done' && 'border-emerald-200 bg-emerald-50/50', step.state === 'pending' && 'border-slate-200 bg-white')} key={step.label}><span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[11px] font-black", step.state === 'done' && toneClass.green, step.state === 'active' && toneClass.blue, step.state === 'paused' && toneClass.amber, step.state === 'pending' && toneClass.slate)}>{step.state === 'done' ? <Check className="h-4 w-4" /> : step.state === 'active' ? <RefreshCcw className="h-4 w-4 animate-spin" /> : step.state === 'paused' ? <Pause className="h-4 w-4" /> : index + 1}</span><span className="min-w-0 flex-1"><span className="block text-[12px] font-black text-slate-800">{step.label}</span><span className="mt-0.5 block text-[10px] text-slate-500">{step.detail}</span></span><Badge tone={step.state === 'done' ? 'green' : step.state === 'active' ? 'blue' : step.state === 'paused' ? 'amber' : 'slate'}>{step.state === 'done' ? 'Completado' : step.state === 'active' ? 'En curso' : step.state === 'paused' ? 'Pausado' : 'Pendiente'}</Badge></div>)}</div></div>
          <div className="space-y-4"><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Contexto usado</p><div className="mt-3 space-y-2">{[['Decisiones aprobadas', '4'], ['Evidencias recuperadas', '10'], ['Documentos de memoria', '6'], ['Tokens de contexto', '18.4k']].map(([label, value]) => <div className="flex items-center justify-between text-[11px]" key={label}><span className="text-slate-600">{label}</span><span className="font-black text-slate-900">{value}</span></div>)}</div><button className="mt-4 text-[11px] font-bold text-violet-700" type="button">Inspeccionar fuentes y resumen</button></div><div className="rounded-2xl border border-violet-200 bg-violet-50 p-4"><div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-violet-700" /><p className="text-[11px] font-black text-violet-900">Puedes continuar navegando</p></div><p className="mt-2 text-[10px] leading-4 text-slate-600">La corrida seguira visible en el encabezado del proyecto y te avisaremos si requiere otra intervencion.</p><Button className="mt-3 w-full" onClick={() => onNavigate("command")}>Ir a Inicio</Button></div></div>
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-[10px] text-slate-500">Cancelar conserva la respuesta, pero descarta la generacion parcial actual.</p><div className="flex gap-2"><Button icon={paused ? Play : Pause} onClick={() => setPaused(!paused)}>{paused ? 'Reanudar' : 'Pausar'}</Button><Button icon={Square} variant="danger">Cancelar ejecucion</Button></div></div>
      </Panel>
    </ProjectLayout>
  );
}

function AttentionWorkspace({ onNavigate }: { onNavigate: (screen: ScreenKey) => void }) {
  const [selectedId, setSelectedId] = useState("Q-14");
  const [filter, setFilter] = useState<"all" | "blocking">("all");
  const visible = filter === "blocking" ? ATTENTION_ITEMS.filter((item) => item.blocking) : ATTENTION_ITEMS;
  const selected = ATTENTION_ITEMS.find((item) => item.id === selectedId) ?? ATTENTION_ITEMS[0];
  return (
    <ProjectLayout activeSection="Atencion" activeStage="design" onNavigate={onNavigate} showContext={false}>
      <div className="mb-4 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 lg:flex-row lg:items-end lg:justify-between"><div><Badge tone="red"><AlertCircle className="h-3 w-3" />3 acciones requieren intervencion</Badge><h2 className="mt-3 text-[25px] font-black tracking-[-0.035em] text-slate-950">Bandeja de atencion del proyecto</h2><p className="mt-1.5 text-[12px] text-slate-600">Todos los pendientes aparecen aqui y permanecen visibles en la etapa donde se originaron.</p></div><div className="flex flex-wrap gap-2"><Button icon={Search}>Buscar</Button><Button icon={Users}>Asignar</Button><Button icon={MoreHorizontal}>Mas</Button></div></div>
      <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
        <Panel className="overflow-hidden">
          <div className="border-b border-slate-200 p-4"><div className="flex gap-2"><button className={cn("min-h-10 rounded-lg px-3 text-[11px] font-bold", filter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600')} onClick={() => setFilter('all')} type="button">Todos 4</button><button className={cn("min-h-10 rounded-lg px-3 text-[11px] font-bold", filter === 'blocking' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700')} onClick={() => setFilter('blocking')} type="button">Bloqueantes 2</button></div><div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 px-3"><Search className="h-4 w-4 text-slate-400" /><input aria-label="Buscar pendientes" className="min-h-11 min-w-0 flex-1 bg-transparent text-[11px] outline-none" placeholder="Buscar por etapa, tipo o responsable" /></div></div>
          <div className="max-h-[700px] overflow-y-auto p-2">{visible.map((item) => <button className={cn("mb-2 w-full rounded-xl border p-3.5 text-left transition", selectedId === item.id ? "border-violet-400 bg-violet-50" : "border-slate-200 bg-white hover:bg-slate-50")} key={item.id} onClick={() => setSelectedId(item.id)} type="button"><div className="flex items-center justify-between gap-2"><Badge tone={item.tone}>{item.id} / {item.type}</Badge>{item.blocking ? <span className="text-[9px] font-black uppercase text-rose-600">Bloquea</span> : null}</div><p className="mt-3 text-[12px] font-black leading-5 text-slate-900">{item.title}</p><div className="mt-3 flex items-center justify-between text-[9px] text-slate-500"><span>{item.stage}</span><span>{item.owner}</span></div></button>)}</div>
        </Panel>
        <Panel className="overflow-hidden">
          <div className={cn("border-b p-5", selected.blocking ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-slate-50")}><div className="flex flex-wrap items-center justify-between gap-3"><Badge tone={selected.tone}>{selected.type}</Badge><span className="text-[10px] font-semibold text-slate-500">Detectado hoy, 09:42</span></div><h2 className="mt-4 text-[23px] font-black tracking-[-0.03em] text-slate-950">{selected.title}</h2><p className="mt-2 text-[12px] leading-5 text-slate-600">{selected.detail}</p></div>
          <div className="p-5"><div className="grid gap-3 md:grid-cols-2">{[['Etapa de origen', selected.stage], ['Responsable', selected.owner], ['Impacto', selected.impact], ['Consecuencia', selected.blocking ? 'La etapa no puede aprobarse.' : 'Se reduce la confianza, sin detener el flujo.']].map(([label, value]) => <div className="rounded-xl border border-slate-200 p-4" key={label}><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</p><p className="mt-2 text-[11px] font-semibold leading-4 text-slate-700">{value}</p></div>)}</div><div className="mt-5 rounded-2xl border border-violet-200 bg-violet-50 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-violet-700">Accion requerida</p><p className="mt-2 text-[13px] font-black text-slate-900">{selected.blocking ? 'Responde o resuelve el item en su contexto de origen.' : 'Revisa la recomendacion y decide si la incorporas ahora o la difieres.'}</p><p className="mt-2 text-[10px] leading-4 text-slate-600">Al resolverlo, volveras a esta bandeja con el filtro y seleccion conservados.</p></div><div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5"><Button icon={History}>Ver historial</Button><div className="flex gap-2"><Button>Delegar</Button><Button icon={ArrowRight} onClick={() => onNavigate(selected.blocking ? "blocked" : "stage")} variant="primary">Abrir en {selected.stage}</Button></div></div></div>
        </Panel>
      </div>
    </ProjectLayout>
  );
}

function ResultWorkspace({ onNavigate }: { onNavigate: (screen: ScreenKey) => void }) {
  const [tab, setTab] = useState("Resumen");
  const tabs = ["Resumen", "Detalle", "Artefactos", "Trazabilidad"];
  return (
    <ProjectLayout activeSection="Blueprint" activeStage="design" onNavigate={onNavigate}>
      <div className="mb-4 flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-[radial-gradient(circle_at_90%_0%,rgba(52,211,153,.13),transparent_35%),#ffffff] p-5 lg:flex-row lg:items-start lg:justify-between"><div><Badge tone="green"><CheckCircle2 className="h-3 w-3" />Diseno v13 generado</Badge><h2 className="mt-3 text-[25px] font-black tracking-[-0.035em] text-slate-950">La arquitectura esta lista para revision</h2><p className="mt-1.5 max-w-3xl text-[12px] leading-5 text-slate-600">El approval gate financiero fue incorporado, el critic no encontro findings bloqueantes y la cobertura aumento a 15/15 requisitos.</p></div><div className="flex gap-2"><Button icon={RefreshCcw}>Regenerar</Button><Button icon={Check} variant="primary">Aprobar diseno</Button></div></div>
      <Panel className="overflow-hidden">
        <div aria-label="Vistas del resultado" className="flex gap-1 overflow-x-auto border-b border-slate-200 px-4" role="tablist">{tabs.map((item) => <button aria-selected={tab === item} className={cn("min-h-12 shrink-0 border-b-2 px-4 text-[12px] font-bold", tab === item ? "border-violet-600 text-violet-700" : "border-transparent text-slate-500")} key={item} onClick={() => setTab(item)} role="tab" type="button">{item}{item === 'Artefactos' ? <span className="ml-2 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px]">6</span> : null}</button>)}</div>
        <div className="p-5">
          {tab === "Resumen" ? <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,.75fr)]"><div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Decision de diseno</p><h3 className="mt-2 text-[20px] font-black text-slate-950">Supervision jerarquica con especialistas y escalamiento humano</h3><p className="mt-2 text-[12px] leading-6 text-slate-600">Un supervisor coordina clasificacion, recuperacion y respuesta. Los side effects se ejecutan mediante tools gobernadas; compensaciones financieras respetan una regla por monto y escalan al owner definido.</p><div className="mt-5 grid gap-3 sm:grid-cols-3">{[['Cobertura', '15/15', 'green'], ['Confianza', 'Alta', 'blue'], ['Findings', '0 criticos', 'green']].map(([label, value, tone]) => <div className="rounded-xl border border-slate-200 p-4" key={label}><p className="text-[9px] uppercase tracking-wider text-slate-400">{label}</p><div className="mt-2 flex items-center justify-between"><p className="text-[17px] font-black text-slate-900">{value}</p><span className={cn("h-2.5 w-2.5 rounded-full", tone === 'green' ? 'bg-emerald-500' : 'bg-sky-500')} /></div></div>)}</div></div><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between"><p className="text-[12px] font-black">Diagrama principal</p><button className="text-[10px] font-bold text-violet-700" onClick={() => onNavigate("diagrams")} type="button">Ampliar</button></div><div className="mt-3 rounded-xl border border-slate-200 bg-white p-4"><div className="grid grid-cols-3 gap-2">{['Supervisor', 'Especialistas', 'Humano'].map((label) => <div className="rounded-lg bg-violet-50 p-2 text-center text-[9px] font-bold text-violet-800" key={label}>{label}</div>)}</div><div className="mx-auto h-6 w-px bg-violet-300" /><div className="rounded-lg bg-slate-900 p-2 text-center text-[9px] font-bold text-white">Tools + Memory</div></div><p className="mt-3 text-[9px] leading-4 text-slate-500">Relaciona 4 decisiones, 6 artefactos y 10 evidencias.</p></div></div> : null}
          {tab === "Detalle" ? <div className="grid gap-3 md:grid-cols-2">{[['Orquestacion', 'Supervisor con routing por intencion y critic antes de side effects.'], ['Razonamiento', 'Plan breve, recuperacion de evidencia y respuesta grounded.'], ['Escalamiento', 'Baja confianza, contradiccion y monto superior al limite.'], ['Recuperacion', 'Retry exponencial, idempotency key y compensacion gobernada.'], ['Seguridad', 'Least privilege, PII redaction y audit trail.'], ['Tradeoff', 'Mayor control a cambio de una llamada LLM adicional.']].map(([label, value]) => <div className="rounded-xl border border-slate-200 p-4" key={label}><p className="text-[11px] font-black text-slate-900">{label}</p><p className="mt-2 text-[10px] leading-5 text-slate-600">{value}</p></div>)}</div> : null}
          {tab === "Artefactos" ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{[['Architecture spec', 'Documento', 'Aprobacion pendiente'], ['Diagrama de arquitectura', 'Diagrama', 'Disponible'], ['Diagrama de orquestacion', 'Diagrama', 'Disponible'], ['Decision log', 'Documento', 'Actualizado'], ['Matriz de fit', 'Tabla', 'Disponible'], ['Security boundaries', 'Diagrama', 'Blueprint Pro']].map(([name, type, status]) => <button className="rounded-xl border border-slate-200 p-4 text-left hover:bg-slate-50" key={name} onClick={() => type === 'Diagrama' && onNavigate("diagrams")} type="button"><div className="flex items-center justify-between"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-700">{type === 'Diagrama' ? <Network className="h-4 w-4" /> : <FileText className="h-4 w-4" />}</span><Badge tone={status === 'Blueprint Pro' ? 'amber' : 'slate'}>{status}</Badge></div><p className="mt-4 text-[12px] font-black text-slate-900">{name}</p><p className="mt-1 text-[9px] text-slate-500">{type} / Disenar / v13</p></button>)}</div> : null}
          {tab === "Trazabilidad" ? <div className="space-y-3">{[['Entrada', 'Definition v8 + Discovery v5'], ['Memoria recuperada', '6 fuentes / patrones de orquestacion y seguridad'], ['Proveedor', 'Codex CLI / gpt-5.5 / prompt design-v4'], ['Decision humana', 'Regla financiera confirmada por Product owner'], ['Validacion', 'Critic v3 / 15 requisitos / 0 blockers'], ['Salida', 'Architecture spec v13 / hash 78b...e2']].map(([label, value], index) => <div className="flex gap-4 rounded-xl border border-slate-200 p-4" key={label}><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-black text-white">{index + 1}</span><div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-[11px] font-semibold text-slate-700">{value}</p></div></div>)}</div> : null}
        </div>
      </Panel>
      <div className="sticky bottom-4 z-20 mt-4 flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-white/95 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[12px] font-black text-slate-900">No hay bloqueos para aprobar</p><p className="mt-1 text-[10px] text-slate-500">Al aprobar, Herramientas usara esta version como contexto obligatorio.</p></div><div className="flex gap-2"><Button>Solicitar ajuste</Button><Button icon={ArrowRight} variant="primary">Aprobar y continuar</Button></div></div>
    </ProjectLayout>
  );
}

export function LegacyDiagramWorkspace({ onNavigate }: { onNavigate: (screen: ScreenKey) => void }) {
  const [selected, setSelected] = useState("Arquitectura del agente");
  const diagrams = [
    { name: "Arquitectura del agente", stage: "Disenar", status: "Disponible", product: "Blueprint", icon: Network },
    { name: "Orquestacion y handoffs", stage: "Disenar", status: "Disponible", product: "Blueprint", icon: Waypoints },
    { name: "Mapa de herramientas", stage: "Herramientas", status: "Disponible", product: "Blueprint", icon: Wrench },
    { name: "Memoria y conocimiento", stage: "Memoria", status: "Desactualizado", product: "Blueprint", icon: Brain },
    { name: "Flujo de simulacion", stage: "Validar", status: "ACP requerido", product: "ACP", icon: GitBranch },
    { name: "Despliegue portable", stage: "Package", status: "ACP requerido", product: "ACP", icon: Boxes },
  ];
  const current = diagrams.find((item) => item.name === selected) ?? diagrams[0];
  return (
    <ProjectLayout activeSection="Diagramas" activeStage="design" onNavigate={onNavigate} showContext={false}>
      <div className="mb-4 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 lg:flex-row lg:items-end lg:justify-between"><div><Badge tone="violet">10 diagramas en el catalogo</Badge><h2 className="mt-3 text-[25px] font-black tracking-[-0.035em] text-slate-950">Diagramas conectados al diseno</h2><p className="mt-1.5 text-[12px] text-slate-600">Cada vista conserva etapa, version, decisiones, evidencia y reglas de acceso.</p></div><div className="flex gap-2"><Button icon={Search}>Buscar</Button><Button icon={History}>Comparar versiones</Button></div></div>
      <div className="grid min-h-[760px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:grid-cols-[300px_minmax(0,1fr)_300px]">
        <aside className="border-r border-slate-200 bg-slate-50/60 p-4"><div className="flex items-center justify-between"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Catalogo</p><Badge tone="slate">6 de 10</Badge></div><div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3"><Search className="h-4 w-4 text-slate-400" /><input aria-label="Buscar diagramas" className="min-h-11 min-w-0 flex-1 bg-transparent text-[10px] outline-none" placeholder="Buscar diagrama..." /></div><div className="mt-3 max-h-[645px] space-y-2 overflow-y-auto pr-1">{diagrams.map((item) => { const Icon = item.icon; const locked = item.status === 'ACP requerido'; return <button className={cn("w-full rounded-xl border p-3 text-left", selected === item.name ? "border-violet-400 bg-violet-50" : "border-slate-200 bg-white hover:bg-slate-50")} key={item.name} onClick={() => setSelected(item.name)} type="button"><div className="flex items-start gap-3"><span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", locked ? "bg-slate-100 text-slate-400" : "bg-violet-100 text-violet-700")}><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-[11px] font-black leading-4 text-slate-800">{item.name}</span><span className="mt-1 block text-[9px] text-slate-500">{item.stage} / {item.product}</span></span>{locked ? <Lock className="h-3.5 w-3.5 text-slate-400" /> : null}</div><Badge className="mt-3" tone={item.status === 'Disponible' ? 'green' : item.status === 'Desactualizado' ? 'amber' : 'slate'}>{item.status}</Badge></button>; })}</div><button className="mt-3 w-full text-[11px] font-bold text-violet-700" type="button">Cargar 4 diagramas mas</button></aside>
        <section className="flex min-w-0 flex-col bg-[#f8fafc]"><div className="flex min-h-[60px] items-center justify-between border-b border-slate-200 bg-white px-4"><div><p className="text-[12px] font-black text-slate-900">{current.name}</p><p className="mt-0.5 text-[9px] text-slate-500">Version 13 / {current.stage} / Actualizado hace 4 min</p></div><div className="flex gap-2"><IconButton label="Ajustar a pantalla"><Eye className="h-4 w-4" /></IconButton><IconButton label="Mas opciones"><MoreHorizontal className="h-4 w-4" /></IconButton></div></div>{current.status === 'ACP requerido' ? <div className="m-auto max-w-lg p-8 text-center"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white"><Lock className="h-7 w-7" /></span><Badge className="mt-5" tone="violet">Contenido ACP</Badge><h3 className="mt-3 text-[24px] font-black text-slate-950">Este diagrama forma parte del Agent Construction Package</h3><p className="mt-3 text-[12px] leading-6 text-slate-600">Adquiere el ACP para acceder a artefactos de implementacion, simulacion y construccion portable.</p><Button className="mt-5" variant="primary">Conocer el valor del ACP</Button></div> : <div className="relative m-5 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-[radial-gradient(circle_at_20%_10%,rgba(139,92,246,.1),transparent_30%),radial-gradient(circle_at_80%_80%,rgba(14,165,233,.1),transparent_30%),#ffffff] p-8"><div className="absolute inset-0 opacity-30 [background-image:linear-gradient(#cbd5e1_1px,transparent_1px),linear-gradient(90deg,#cbd5e1_1px,transparent_1px)] [background-size:24px_24px]" /><div className="relative mx-auto grid max-w-3xl gap-7"><div className="mx-auto rounded-2xl border-2 border-violet-300 bg-violet-50 px-8 py-4 text-center shadow-lg shadow-violet-100"><Bot className="mx-auto h-6 w-6 text-violet-700" /><p className="mt-2 text-[12px] font-black text-violet-950">Supervisor agentico</p><p className="mt-1 text-[9px] text-violet-700">Routing / critic / approval gates</p></div><div className="grid grid-cols-3 gap-6">{[['Clasificador', Route], ['Knowledge agent', Database], ['Response agent', MessageSquareText]].map(([label, IconValue]) => { const Icon = IconValue as LucideIcon; return <div className="relative rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-md" key={String(label)}><span className="absolute -top-7 left-1/2 h-7 w-px bg-violet-300" /><Icon className="mx-auto h-5 w-5 text-sky-600" /><p className="mt-2 text-[10px] font-black text-slate-800">{String(label)}</p></div>; })}</div><div className="grid grid-cols-2 gap-6">{[['Herramientas gobernadas', Wrench], ['Memoria + RAG', Brain]].map(([label, IconValue]) => { const Icon = IconValue as LucideIcon; return <div className="rounded-2xl bg-slate-900 p-4 text-center text-white" key={String(label)}><Icon className="mx-auto h-5 w-5 text-violet-300" /><p className="mt-2 text-[10px] font-bold">{String(label)}</p></div>; })}</div></div></div>}</section>
        <aside className="border-l border-slate-200 bg-white p-4"><div className="flex items-center justify-between"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Inspector</p><Badge tone={current.status === 'Disponible' ? 'green' : current.status === 'Desactualizado' ? 'amber' : 'slate'}>{current.status}</Badge></div><div className="mt-5 space-y-4">{[['Etapa de origen', current.stage], ['Producto', current.product], ['Version', 'v13'], ['Estado de revision', current.status === 'Desactualizado' ? 'Requiere regeneracion' : 'Generado'], ['Decisiones vinculadas', '4'], ['Evidencias vinculadas', '10']].map(([label, value]) => <div key={label}><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-[11px] font-semibold text-slate-700">{value}</p></div>)}</div><div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3"><p className="text-[10px] font-black text-amber-900">1 relacion requiere revision</p><p className="mt-1 text-[9px] leading-4 text-amber-800">Memory v9 aun referencia Tools v6.</p><button className="mt-2 text-[10px] font-bold text-amber-900" onClick={() => onNavigate("attention")} type="button">Abrir GAP relacionado</button></div><div className="mt-5 border-t border-slate-100 pt-4"><p className="text-[10px] font-black text-slate-800">Restricciones de licencia</p><p className="mt-1 text-[9px] leading-4 text-slate-500">Vista habilitada. Copia y descarga dependen de Blueprint Pro.</p><Button className="mt-3 w-full" icon={Download} disabled>Descarga bloqueada</Button></div></aside>
      </div>
    </ProjectLayout>
  );
}

function EstimateWorkspace({ onNavigate }: { onNavigate: (screen: ScreenKey) => void }) {
  const scenarios = [
    { name: "Tradicional", time: "18.4 sem", cost: "$148.2M", human: "100%", risk: "Alto", saving: "Base" },
    { name: "Con Blueprint", time: "13.1 sem", cost: "$104.6M", human: "82%", risk: "Medio", saving: "29%" },
    { name: "Con ACP", time: "9.2 sem", cost: "$73.8M", human: "61%", risk: "Medio-bajo", saving: "50%" },
    { name: "ACP + agentic", time: "5.8 sem", cost: "$47.3M", human: "38%", risk: "Controlado", saving: "68%" },
  ];
  return (
    <ProjectLayout activeStage="estimate" onNavigate={onNavigate}>
      <div className="mb-4 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex gap-2"><Badge tone="violet">Producto 1 / Blueprint</Badge><Badge tone="green">Estimacion vigente</Badge></div><h2 className="mt-3 text-[25px] font-black tracking-[-0.035em] text-slate-950">Valor, preparacion y opciones de construccion</h2><p className="mt-1.5 max-w-3xl text-[12px] leading-5 text-slate-600">Tres perspectivas separan la calidad del diseno, el alcance real de la plataforma y las decisiones que corresponden a implementacion.</p></div><Button icon={RefreshCcw}>Actualizar snapshot</Button></div>
      <div className="grid gap-4 lg:grid-cols-3">
        {[['Blueprint listo para construir', '94%', 'Diseno integral', 'Arquitectura, patrones, tools, memoria y contratos definidos.', 'green'], ['Alcance de esta plataforma', '100%', 'Blueprint + ACP', 'No penaliza integraciones externas ni despliegue fuera del alcance.', 'violet'], ['Cierre de implementacion', '96%', 'Incertidumbre residual', '4% diseno y 2% implementacion como bandas maximas.', 'blue']].map(([title, value, label, detail, tone]) => <Panel className="p-5" key={title}><div className="flex items-start justify-between"><div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p><h3 className="mt-2 text-[15px] font-black text-slate-900">{title}</h3></div><span className="text-[28px] font-black tracking-[-0.04em] text-slate-950">{value}</span></div><div className="mt-4 h-2 rounded-full bg-slate-100"><div className={cn("h-full rounded-full", tone === 'green' ? 'w-[94%] bg-emerald-500' : tone === 'violet' ? 'w-full bg-violet-600' : 'w-[96%] bg-sky-500')} /></div><p className="mt-3 text-[10px] leading-4 text-slate-500">{detail}</p></Panel>)}
      </div>
      <Panel className="mt-4 overflow-hidden"><div className="flex flex-col gap-3 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Comparativa comercial</p><h3 className="mt-1 text-[18px] font-black text-slate-950">Cuatro formas de construir el mismo agente</h3></div><Badge tone="green">Hasta 68% de ahorro estimado</Badge></div><div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left"><thead className="bg-slate-50 text-[9px] font-black uppercase tracking-wider text-slate-400"><tr>{['Enfoque', 'Tiempo', 'Costo COP', 'Intervencion humana', 'Riesgo', 'Ahorro'].map((head) => <th className="px-5 py-3" key={head}>{head}</th>)}</tr></thead><tbody>{scenarios.map((scenario, index) => <tr className={cn("border-t border-slate-100 text-[11px]", index === 3 && "bg-violet-50/70")} key={scenario.name}><td className="px-5 py-4"><div className="flex items-center gap-2"><span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", index === 3 ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600")}>{index === 0 ? <Users className="h-4 w-4" /> : <Zap className="h-4 w-4" />}</span><span className="font-black text-slate-900">{scenario.name}</span>{index === 3 ? <Badge tone="violet">Mayor valor</Badge> : null}</div></td><td className="px-5 py-4 font-semibold text-slate-700">{scenario.time}</td><td className="px-5 py-4 font-semibold text-slate-700">{scenario.cost}</td><td className="px-5 py-4 text-slate-600">{scenario.human}</td><td className="px-5 py-4 text-slate-600">{scenario.risk}</td><td className="px-5 py-4"><Badge tone={index === 0 ? 'slate' : 'green'}>{scenario.saving}</Badge></td></tr>)}</tbody></table></div></Panel>
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]"><Panel className="p-5"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Incertidumbre explicada</p><h3 className="mt-1 text-[17px] font-black text-slate-950">Lo pendiente no reduce el valor del Blueprint</h3></div><Badge tone="blue">Banda total 6%</Badge></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-slate-200 p-4"><div className="flex items-center justify-between"><p className="text-[11px] font-black">GAPs de diseno</p><span className="text-[18px] font-black">4%</span></div><p className="mt-2 text-[10px] leading-4 text-slate-500">Solo temas que aun afectan la especificacion integral.</p></div><div className="rounded-xl border border-slate-200 p-4"><div className="flex items-center justify-between"><p className="text-[11px] font-black">Decisiones de implementacion</p><span className="text-[18px] font-black">2%</span></div><p className="mt-2 text-[10px] leading-4 text-slate-500">Entorno, credenciales, regiones o proveedor final.</p></div></div></Panel><Panel className="border-violet-200 bg-violet-50 p-5"><Badge tone="violet">Blueprint Pro</Badge><h3 className="mt-3 text-[18px] font-black text-slate-950">El diseno integral esta listo</h3><p className="mt-2 text-[10px] leading-5 text-slate-600">Explora el Blueprint en la plataforma o adquiere la version profesional para descargar toda la documentacion.</p><Button className="mt-4 w-full" onClick={() => onNavigate("blueprint-pro")} variant="primary">Ver contenido y adquirir</Button><button className="mt-3 w-full text-[10px] font-bold text-violet-700" onClick={() => onNavigate("acp-invitation")} type="button">Conocer el valor adicional del ACP</button></Panel></div>
    </ProjectLayout>
  );
}

function ValidateWorkspace({ onNavigate }: { onNavigate: (screen: ScreenKey) => void }) {
  const [scenario, setScenario] = useState("Resolucion grounded");
  const scenarios = [
    { name: "Resolucion grounded", status: "Aprobado", tone: "green" as Tone },
    { name: "Escalamiento financiero", status: "Aprobado", tone: "green" as Tone },
    { name: "Fuentes contradictorias", status: "1 finding", tone: "amber" as Tone },
  ];
  return (
    <ProjectLayout activeStage="validate" onNavigate={onNavigate} showContext={false}>
      <div className="mb-4 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex gap-2"><Badge tone="violet">Producto 2 / ACP</Badge><Badge tone="green">Entitlement activo</Badge></div><h2 className="mt-3 text-[25px] font-black tracking-[-0.035em] text-slate-950">Validar el Blueprint antes de construir</h2><p className="mt-1.5 text-[12px] text-slate-600">Prueba flujos, herramientas, memoria, decisiones humanas y criterios de aceptacion.</p></div><Button icon={Play} variant="primary">Ejecutar suite</Button></div>
      <div className="grid gap-4 xl:grid-cols-[290px_minmax(0,1fr)_320px]">
        <Panel className="p-4"><div className="flex items-center justify-between"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Escenarios</p><Badge tone="slate">3</Badge></div><div className="mt-4 space-y-2">{scenarios.map((item, index) => <button className={cn("w-full rounded-xl border p-3 text-left", scenario === item.name ? "border-violet-400 bg-violet-50" : "border-slate-200 hover:bg-slate-50")} key={item.name} onClick={() => setScenario(item.name)} type="button"><div className="flex items-center justify-between"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[10px] font-black">{index + 1}</span><Badge tone={item.tone}>{item.status}</Badge></div><p className="mt-3 text-[11px] font-black text-slate-900">{item.name}</p><p className="mt-1 text-[9px] text-slate-500">7 pasos / 4 criterios / 2 tools</p></button>)}</div><Button className="mt-3 w-full" icon={Plus}>Agregar escenario</Button></Panel>
        <Panel className="overflow-hidden"><div className="flex items-center justify-between border-b border-slate-200 p-4"><div><p className="text-[12px] font-black text-slate-900">{scenario}</p><p className="mt-1 text-[9px] text-slate-500">Simulacion v4 / ultima corrida hace 8 min</p></div><Button icon={Play}>Ejecutar de nuevo</Button></div><div className="relative min-h-[470px] overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,.12),transparent_35%),#f8fafc] p-6"><div className="absolute inset-0 opacity-25 [background-image:linear-gradient(#cbd5e1_1px,transparent_1px),linear-gradient(90deg,#cbd5e1_1px,transparent_1px)] [background-size:24px_24px]" /><div className="relative grid gap-5 pt-6 md:grid-cols-4">{[['Entrada', MessageSquareText, 'Solicitud'], ['Recuperar', Database, '3 fuentes'], ['Decidir', GitBranch, scenario === 'Fuentes contradictorias' ? 'Contradiccion' : 'Confianza 91%'], ['Responder', CheckCircle2, scenario === 'Fuentes contradictorias' ? 'Escalar' : 'Grounded']].map(([label, IconValue, detail], index) => { const Icon = IconValue as LucideIcon; const warning = scenario === 'Fuentes contradictorias' && index === 2; return <div className={cn("relative rounded-2xl border bg-white p-4 text-center shadow-md", warning ? "border-amber-300" : "border-slate-200")} key={String(label)}>{index < 3 ? <span className="absolute left-full top-1/2 hidden h-px w-5 bg-violet-300 md:block" /> : null}<span className={cn("mx-auto flex h-11 w-11 items-center justify-center rounded-xl", warning ? "bg-amber-100 text-amber-700" : "bg-violet-100 text-violet-700")}><Icon className="h-5 w-5" /></span><p className="mt-3 text-[10px] font-black uppercase tracking-wider text-slate-800">{String(label)}</p><p className="mt-1 text-[9px] text-slate-500">{String(detail)}</p></div>; })}</div><div className="relative mt-8 rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between"><p className="text-[11px] font-black">Timeline de eventos</p><span className="text-[9px] text-slate-500">7 eventos / 2.8 s</span></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{['input.received', 'memory.read', 'tool.call', 'decision.made'].map((event, index) => <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[9px] font-semibold text-slate-600" key={event}><span className="h-2 w-2 rounded-full bg-emerald-500" />0.{index + 2}s {event}</div>)}</div></div></div></Panel>
        <div className="space-y-4"><Panel className="p-4"><div className="flex items-center justify-between"><p className="text-[12px] font-black">Resultado de corrida</p><Badge tone={scenario === 'Fuentes contradictorias' ? 'amber' : 'green'}>{scenario === 'Fuentes contradictorias' ? 'Revisar' : 'Aprobado'}</Badge></div><div className="mt-4 grid grid-cols-3 gap-2 text-center">{[['92', 'Score'], ['4/4', 'Criterios'], [scenario === 'Fuentes contradictorias' ? '1' : '0', 'Findings']].map(([value, label]) => <div className="rounded-xl bg-slate-50 p-3" key={label}><p className="text-[17px] font-black">{value}</p><p className="text-[8px] uppercase text-slate-400">{label}</p></div>)}</div></Panel><Panel className={cn("p-4", scenario === 'Fuentes contradictorias' ? 'border-amber-300 bg-amber-50' : '')}><div className="flex items-center gap-2">{scenario === 'Fuentes contradictorias' ? <AlertTriangle className="h-4 w-4 text-amber-700" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}<p className="text-[12px] font-black">{scenario === 'Fuentes contradictorias' ? 'Finding detectado' : 'Criterios cubiertos'}</p></div><p className="mt-2 text-[10px] leading-5 text-slate-600">{scenario === 'Fuentes contradictorias' ? 'La simulacion escala correctamente, pero falta definir el SLA del owner humano.' : 'Grounding, side effects, escalamiento y auditoria cumplen el Blueprint.'}</p>{scenario === 'Fuentes contradictorias' ? <Button className="mt-3 w-full" onClick={() => onNavigate("attention")} variant="primary">Resolver finding</Button> : null}</Panel><Panel className="p-4"><p className="text-[12px] font-black">Evidencia de prueba</p><div className="mt-3 space-y-2">{['Trace de eventos', 'Tool calls', 'Memory reads', 'Decision rationale'].map((item) => <button className="flex min-h-10 w-full items-center gap-2 rounded-lg bg-slate-50 px-3 text-[10px] font-semibold text-slate-700" key={item} type="button"><FileSearch className="h-3.5 w-3.5 text-violet-600" />{item}<ChevronRight className="ml-auto h-3 w-3" /></button>)}</div></Panel></div>
      </div>
    </ProjectLayout>
  );
}

function PackageWorkspace({ onNavigate }: { onNavigate: (screen: ScreenKey) => void }) {
  const [tab, setTab] = useState("Resumen");
  const tabs = ["Resumen", "Preguntas", "GAPs", "Archivos"];
  return (
    <ProjectLayout activeStage="package" onNavigate={onNavigate} showContext={false}>
      <div className="mb-4 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex gap-2"><Badge tone="violet">ACP / Construccion</Badge><Badge tone="amber">2 preguntas abiertas</Badge></div><h2 className="mt-3 text-[25px] font-black tracking-[-0.035em] text-slate-950">Agent Construction Package portable</h2><p className="mt-1.5 max-w-3xl text-[12px] leading-5 text-slate-600">El paquete traduce el Blueprint en especificaciones, prompts, contratos, tests e instrucciones sin depender del runtime de Lean Agent Builder.</p></div><Button icon={Download} disabled variant="primary">Descargar ACP</Button></div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Panel className="overflow-hidden"><div aria-label="Vistas del ACP" className="flex gap-1 overflow-x-auto border-b border-slate-200 px-4" role="tablist">{tabs.map((item) => <button aria-selected={tab === item} className={cn("min-h-12 shrink-0 border-b-2 px-4 text-[12px] font-bold", tab === item ? "border-violet-600 text-violet-700" : "border-transparent text-slate-500")} key={item} onClick={() => setTab(item)} role="tab" type="button">{item}{item === 'Preguntas' ? <span className="ml-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] text-amber-800">2</span> : item === 'Archivos' ? <span className="ml-2 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px]">24</span> : null}</button>)}</div><div className="p-5">
          {tab === 'Resumen' ? <div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[['24', 'Archivos'], ['18', 'Validos'], ['4', 'Con warning'], ['2', 'Bloqueados']].map(([value, label], index) => <div className="rounded-xl border border-slate-200 p-4" key={label}><p className={cn("text-[22px] font-black", index === 3 ? 'text-rose-600' : 'text-slate-950')}>{value}</p><p className="mt-1 text-[9px] uppercase tracking-wider text-slate-400">{label}</p></div>)}</div><div className="mt-5 grid gap-3 md:grid-cols-2">{[['Especificacion declarativa', 'Workflows, estados, transiciones y policies en formatos portables.', 'green'], ['Prompts y playbooks', 'System prompts, tareas, guardrails y ejemplos versionados.', 'green'], ['Contratos y schemas', 'Tools, errores, auth refs, side effects y compensacion.', 'green'], ['Decisiones de implementacion', 'Preguntas con contexto, opciones, impacto y momento de resolucion.', 'amber']].map(([name, detail, tone]) => <div className="rounded-xl border border-slate-200 p-4" key={name}><div className="flex items-center justify-between"><p className="text-[11px] font-black text-slate-900">{name}</p><Badge tone={tone as Tone}>{tone === 'green' ? 'Listo' : '2 abiertas'}</Badge></div><p className="mt-2 text-[10px] leading-4 text-slate-500">{detail}</p></div>)}</div></div> : null}
          {tab === 'Preguntas' ? <div className="space-y-3">{[['IMP-02', 'Que lenguaje y framework se usaran para implementar el agente?', 'Arquitectura de implementacion', 'Bloquea generacion final'], ['IMP-05', 'Que proveedor de ticketing y credenciales estaran disponibles?', 'Integraciones', 'Puede resolverse al ejecutar ACP']].map(([id, title, owner, effect], index) => <div className={cn("rounded-2xl border p-4", index === 0 ? 'border-rose-200 bg-rose-50' : 'border-amber-200 bg-amber-50')} key={id}><div className="flex flex-wrap items-center justify-between gap-2"><Badge tone={index === 0 ? 'red' : 'amber'}>{id} / Pregunta de implementacion</Badge><span className="text-[9px] font-semibold text-slate-500">Owner: {owner}</span></div><h3 className="mt-3 text-[13px] font-black text-slate-900">{title}</h3><p className="mt-2 text-[10px] text-slate-600">{effect}. El ACP presentara opciones, impacto y ejemplos sin imponer una tecnologia de Lean Builder.</p><div className="mt-3 flex gap-2"><Button>Responder ahora</Button><Button variant="ghost">Conservar para ejecucion</Button></div></div>)}</div> : null}
          {tab === 'GAPs' ? <div className="space-y-3">{[['GAP-P01', 'Launcher portable', 'Definir scripts PowerShell/Bash que detecten IDE y herramienta agentic.', 'En remediacion'], ['GAP-P04', 'Checkpoint agnostico', 'Eliminar referencias a IDs y estados internos de Lean Builder.', 'Resuelto'], ['GAP-P07', 'Guia de despliegue', 'Mantenerla como guia parametrizable, no deployment ejecutado.', 'Resuelto']].map(([id, title, detail, status]) => <div className="flex gap-4 rounded-xl border border-slate-200 p-4" key={id}><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[9px] font-black text-slate-600">{id}</span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="text-[11px] font-black text-slate-900">{title}</p><Badge tone={status === 'Resuelto' ? 'green' : 'amber'}>{status}</Badge></div><p className="mt-2 text-[10px] leading-4 text-slate-500">{detail}</p></div></div>)}</div> : null}
          {tab === 'Archivos' ? <div className="overflow-hidden rounded-xl border border-slate-200"><div className="grid grid-cols-[minmax(0,1fr)_100px_110px_100px] bg-slate-50 px-4 py-3 text-[9px] font-black uppercase tracking-wider text-slate-400"><span>Ruta</span><span>Formato</span><span>Dominio</span><span>Estado</span></div>{[['manifest.yaml', 'YAML', 'Core', 'Valido'], ['spec/workflow.yaml', 'YAML', 'Runtime', 'Valido'], ['prompts/supervisor.md', 'Markdown', 'Prompts', 'Valido'], ['questions/implementation.yaml', 'YAML', 'Decisiones', 'Warning'], ['launch/start.ps1', 'PowerShell', 'Launcher', 'Bloqueado'], ['tests/scenarios.json', 'JSON', 'Evaluation', 'Valido']].map(([path, format, domain, status]) => <button className="grid min-h-[54px] w-full grid-cols-[minmax(0,1fr)_100px_110px_100px] items-center border-t border-slate-100 px-4 text-left text-[10px] hover:bg-slate-50" key={path} type="button"><span className="flex items-center gap-2 font-mono font-semibold text-slate-800"><FileText className="h-3.5 w-3.5 text-violet-600" />{path}</span><span className="text-slate-500">{format}</span><span className="text-slate-500">{domain}</span><Badge tone={status === 'Valido' ? 'green' : status === 'Warning' ? 'amber' : 'red'}>{status}</Badge></button>)}</div> : null}
        </div></Panel>
        <div className="space-y-4"><Panel className="p-5"><div className="flex items-center justify-between"><p className="text-[12px] font-black">Readiness del paquete</p><span className="text-[24px] font-black text-slate-950">92%</span></div><div className="mt-3 h-2 rounded-full bg-slate-100"><div className="h-full w-[92%] rounded-full bg-violet-600" /></div><div className="mt-4 space-y-2">{[['Especificacion', 'Completa', 'green'], ['Portabilidad', 'Validada', 'green'], ['Preguntas', '2 abiertas', 'amber'], ['Launcher', 'Pendiente', 'red']].map(([label, value, tone]) => <div className="flex items-center justify-between text-[10px]" key={label}><span className="text-slate-600">{label}</span><Badge tone={tone as Tone}>{value}</Badge></div>)}</div></Panel><Panel className="border-rose-200 bg-rose-50 p-5"><Badge tone="red">Descarga bloqueada</Badge><h3 className="mt-3 text-[16px] font-black text-slate-950">Cierra 2 acciones antes de exportar</h3><p className="mt-2 text-[10px] leading-5 text-slate-600">Define el stack objetivo y completa el launcher portable. Las preguntas del entorno pueden permanecer abiertas dentro del ACP.</p><Button className="mt-4 w-full" onClick={() => setTab('Preguntas')} variant="primary">Resolver acciones</Button></Panel><Panel className="p-5"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" /><p className="text-[12px] font-black">Portabilidad</p></div><p className="mt-2 text-[10px] leading-5 text-slate-600">Sin project IDs, endpoints, estados o servicios exclusivos de Lean Agent Builder.</p><button className="mt-3 text-[10px] font-bold text-violet-700" type="button">Ver reporte de conformidad</button></Panel></div>
      </div>
    </ProjectLayout>
  );
}

function ActiveView({
  active,
  onNavigate,
  scenario,
  onScenarioChange,
}: {
  active: ScreenKey;
  onNavigate: (screen: ScreenKey) => void;
  scenario: CommercialScenario;
  onScenarioChange: (scenario: CommercialScenario) => void;
}) {
  if (active === "command") return <CommandCenter onNavigate={onNavigate} />;
  if (active === "stage") return <StageWorkspace onNavigate={onNavigate} />;
  if (active === "blocked") return <BlockedWorkspace onNavigate={onNavigate} />;
  if (active === "processing") return <ProcessingWorkspace onNavigate={onNavigate} />;
  if (active === "attention") return <AttentionWorkspace onNavigate={onNavigate} />;
  if (active === "results") return <ResultWorkspace onNavigate={onNavigate} />;
  if (active === "diagrams") return <UnifiedDiagramViewer onNavigate={(screen) => onNavigate(screen)} onScenarioChange={onScenarioChange} scenario={scenario} />;
  if (active === "estimate") return <EstimateWorkspace onNavigate={onNavigate} />;
  if (active === "validate") {
    if (scenario !== "acp") return <SaasProductView active="acp-gate" onNavigate={(screen) => onNavigate(screen)} onScenarioChange={onScenarioChange} scenario={scenario} />;
    return <ValidateWorkspace onNavigate={onNavigate} />;
  }
  if (active === "package") {
    if (scenario !== "acp") return <SaasProductView active="acp-gate" onNavigate={(screen) => onNavigate(screen)} onScenarioChange={onScenarioChange} scenario={scenario} />;
    return <PackageWorkspace onNavigate={onNavigate} />;
  }
  if (isSaasScreenKey(active)) return <SaasProductView active={active} onNavigate={(screen) => onNavigate(screen)} onScenarioChange={onScenarioChange} scenario={scenario} />;
  return <CommandCenter onNavigate={onNavigate} />;
}

export function LeanEvolutionMockupPage() {
  const [active, setActive] = useState<ScreenKey>("stage");
  const [scenario, setScenario] = useState<CommercialScenario>("free");
  return (
    <div className="min-h-screen bg-[#f7f7fb] text-slate-950">
      <ReviewNavigator active={active} onSelect={setActive} />
      <div className="mx-auto grid max-w-[1920px] border-x border-slate-200 bg-white shadow-[0_0_70px_rgba(15,23,42,0.08)] lg:grid-cols-[210px_minmax(0,1fr)]">
        <GlobalSidebar activeScreen={active} onNavigate={setActive} />
        <div className="min-w-0">
          <AppTopbar onNavigate={setActive} />
          <ActiveView active={active} onNavigate={setActive} onScenarioChange={setScenario} scenario={scenario} />
        </div>
      </div>
    </div>
  );
}
