"use client";

import { useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Bell,
  Bot,
  Brain,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  ClipboardCheck,
  Database,
  Eye,
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
  Menu,
  Network,
  PanelRightOpen,
  Play,
  RefreshCcw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  Waypoints,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

type StageKey = "discover" | "define" | "design" | "tools" | "memory" | "estimate" | "validate" | "package";
type ViewKey = "work" | "blueprint" | "acp" | "diagrams" | "artifacts" | "attention" | "activity";
type ExperienceState = "ready" | "blocking" | "processing" | "review";
type AccessLevel = "free" | "blueprint" | "acp";
type WorkTab = "task" | "result" | "evidence";
type Tone = "violet" | "green" | "amber" | "red" | "blue" | "slate";

type StageDefinition = {
  key: StageKey;
  label: string;
  subtitle: string;
  product: "Blueprint" | "ACP";
  objective: string;
  output: string;
  nextAction: string;
};

type AttentionItem = {
  id: string;
  stage: StageKey;
  kind: string;
  title: string;
  reason: string;
  impact: string;
  owner: string;
  blocking: boolean;
  tone: Tone;
};

const STAGES: StageDefinition[] = [
  {
    key: "discover",
    label: "Descubrir",
    subtitle: "Problema y contexto",
    product: "Blueprint",
    objective: "Comprender el problema, el proceso actual, los objetivos y las restricciones.",
    output: "Canvas de descubrimiento y contexto validado",
    nextAction: "Completar contexto y analizar",
  },
  {
    key: "define",
    label: "Definir",
    subtitle: "Objetivos y alcance",
    product: "Blueprint",
    objective: "Consolidar requisitos, alcance, reglas de negocio y criterios de exito.",
    output: "Definicion funcional y no funcional",
    nextAction: "Revisar definicion propuesta",
  },
  {
    key: "design",
    label: "Disenar",
    subtitle: "Arquitectura y conducta",
    product: "Blueprint",
    objective: "Seleccionar la arquitectura, los patrones y el comportamiento del sistema agentico.",
    output: "Architecture spec y diagramas base",
    nextAction: "Resolver autoridad y aprobar diseno",
  },
  {
    key: "tools",
    label: "Herramientas",
    subtitle: "Capacidades y contratos",
    product: "Blueprint",
    objective: "Definir el conjunto minimo de herramientas, contratos y dependencias externas.",
    output: "Toolset minimo gobernado",
    nextAction: "Confirmar herramientas obligatorias",
  },
  {
    key: "memory",
    label: "Memoria",
    subtitle: "Memoria y conocimiento",
    product: "Blueprint",
    objective: "Disenar memoria corta, memoria larga, RAG, recuperacion y ownership del conocimiento.",
    output: "Estrategia de memoria y conocimiento",
    nextAction: "Regenerar propuesta con Tools v7",
  },
  {
    key: "estimate",
    label: "Estimar",
    subtitle: "Valor, costo y ROI",
    product: "Blueprint",
    objective: "Cuantificar esfuerzo, costo, riesgo, ahorro y time to market.",
    output: "Estimacion y comparativa comercial",
    nextAction: "Revisar escenarios de construccion",
  },
  {
    key: "validate",
    label: "Validar",
    subtitle: "Pruebas y GAPs",
    product: "ACP",
    objective: "Validar el Blueprint mediante escenarios, pruebas y findings trazables.",
    output: "Test suite y reporte de validacion",
    nextAction: "Adquirir ACP para continuar",
  },
  {
    key: "package",
    label: "Package",
    subtitle: "Paquete portable",
    product: "ACP",
    objective: "Construir especificaciones y artefactos portables para iniciar la implementacion.",
    output: "Agent Construction Package",
    nextAction: "Cerrar preguntas de implementacion",
  },
];

const ATTENTION_ITEMS: AttentionItem[] = [
  {
    id: "Q-14",
    stage: "design",
    kind: "Pregunta bloqueante",
    title: "Quien autoriza una compensacion con impacto financiero?",
    reason: "El analisis encontro dos reglas compatibles, pero ninguna define la autoridad final.",
    impact: "Impide aprobar el diseno y cerrar el approval gate.",
    owner: "Product owner",
    blocking: true,
    tone: "red",
  },
  {
    id: "S-03",
    stage: "memory",
    kind: "Artefacto desactualizado",
    title: "Memoria usa una version anterior de Herramientas",
    reason: "document_ingestion fue aprobada despues de generar la estrategia RAG.",
    impact: "Requiere regenerar Memoria antes de aprobarla.",
    owner: "Lean Builder",
    blocking: true,
    tone: "violet",
  },
  {
    id: "G-08",
    stage: "tools",
    kind: "GAP de implementacion",
    title: "Falta confirmar el proveedor del sistema de tickets",
    reason: "La capacidad es obligatoria, pero el proveedor puede decidirse al implementar.",
    impact: "No bloquea el Blueprint; se conserva como pregunta estructurada del ACP.",
    owner: "Arquitectura",
    blocking: false,
    tone: "amber",
  },
  {
    id: "W-19",
    stage: "define",
    kind: "Recomendacion",
    title: "Precisar la latencia del canal asincrono",
    reason: "El NFR usa el termino rapido sin una metrica verificable.",
    impact: "Reduce la confianza de la estimacion, sin detener el diseno.",
    owner: "Analista",
    blocking: false,
    tone: "blue",
  },
];

const PRODUCT_NAV: Array<{ key: ViewKey; label: string; icon: LucideIcon }> = [
  { key: "work", label: "Trabajo", icon: Zap },
  { key: "blueprint", label: "Blueprint", icon: FileText },
  { key: "acp", label: "ACP", icon: Layers3 },
  { key: "diagrams", label: "Diagramas", icon: Network },
  { key: "artifacts", label: "Artefactos", icon: Library },
  { key: "attention", label: "Atencion", icon: AlertCircle },
  { key: "activity", label: "Actividad", icon: Activity },
];

const TONE_CLASSES: Record<Tone, string> = {
  violet: "border-violet-200 bg-violet-50 text-violet-700",
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  red: "border-rose-200 bg-rose-50 text-rose-700",
  blue: "border-sky-200 bg-sky-50 text-sky-700",
  slate: "border-slate-200 bg-slate-50 text-slate-600",
};

function Badge({ children, tone = "slate", className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold", TONE_CLASSES[tone], className)}>
      {children}
    </span>
  );
}

function Button({
  children,
  className,
  disabled,
  icon: Icon,
  onClick,
  variant = "secondary",
}: {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  icon?: LucideIcon;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-[12px] font-black transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:cursor-not-allowed disabled:opacity-45",
        variant === "primary" && "border-violet-600 bg-violet-600 text-white shadow-[0_10px_24px_rgba(79,70,245,.22)] hover:bg-violet-700",
        variant === "secondary" && "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
        variant === "ghost" && "border-transparent bg-transparent text-slate-600 hover:bg-slate-100",
        variant === "danger" && "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
        className,
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {Icon ? <Icon aria-hidden="true" className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,.05)]", className)}>{children}</section>;
}

function GlobalSidebar({ mobile = false, onClose }: { mobile?: boolean; onClose?: () => void }) {
  const items: Array<{ label: string; icon: LucideIcon; active?: boolean }> = [
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
  return (
    <aside className={cn("flex min-h-screen w-[224px] flex-col bg-[#071329] text-white", mobile ? "h-full" : "sticky top-0 hidden lg:flex")}>
      <div className="flex h-[72px] items-center gap-3 border-b border-white/10 px-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-950/30">
          <Sparkles aria-hidden="true" className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-black tracking-tight">Lean Agent Builder</p>
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">Workspace SaaS</p>
        </div>
        {mobile ? (
          <button aria-label="Cerrar menu" className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-300 hover:bg-white/10" onClick={onClose} type="button">
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>
      <nav aria-label="Navegacion principal" className="flex-1 space-y-1 p-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              className={cn(
                "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[12px] font-semibold transition",
                item.active ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white",
              )}
              key={item.label}
              type="button"
            >
              <Icon aria-hidden="true" className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/20 text-[11px] font-black text-violet-200">LB</span>
          <div className="min-w-0 flex-1"><p className="truncate text-[12px] font-bold">Lean Builder</p><p className="truncate text-[10px] text-slate-400">Workspace principal</p></div>
          <ChevronDown className="h-4 w-4 text-slate-500" />
        </div>
      </div>
    </aside>
  );
}

function Topbar({ attentionCount, onAttention, onMenu }: { attentionCount: number; onAttention: () => void; onMenu: () => void }) {
  return (
    <header className="flex min-h-[72px] items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button aria-label="Abrir menu" className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 lg:hidden" onClick={onMenu} type="button">
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-slate-400">Proyectos / PRJ-204</p>
          <p className="truncate text-[13px] font-black text-slate-900">Asistente de soporte inteligente</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="hidden min-h-11 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 text-[11px] font-black text-rose-700 sm:flex" onClick={onAttention} type="button">
          <AlertCircle className="h-4 w-4" />{attentionCount} requieren atencion
        </button>
        <button aria-label="Buscar" className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50" type="button"><Search className="h-4 w-4" /></button>
        <button aria-label="Notificaciones" className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50" type="button"><Bell className="h-4 w-4" /><span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-rose-500" /></button>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-[11px] font-black text-white">AM</span>
      </div>
    </header>
  );
}

function ProjectHeader({ activeView, attentionCount, onSelectView }: { activeView: ViewKey; attentionCount: number; onSelectView: (view: ViewKey) => void }) {
  return (
    <div className="border-b border-slate-200 bg-white px-4 pt-4 lg:px-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2"><Badge tone="violet">Blueprint v12</Badge><Badge tone="green">2 etapas aprobadas</Badge><Badge><CircleDot className="h-3 w-3" />Sin ejecucion activa</Badge></div>
          <h1 className="mt-2 text-[22px] font-black tracking-[-0.035em] text-slate-950">Asistente de soporte inteligente</h1>
          <p className="mt-1 text-[11px] text-slate-500">Ultima actualizacion hace 2 min / Contexto consolidado: 10 evidencias, 4 decisiones</p>
        </div>
        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[minmax(240px,1fr)_auto]">
          <div><div className="flex justify-between text-[10px] font-bold text-slate-500"><span>Avance verificable</span><span>2 aprobadas / 1 en revision</span></div><div className="mt-2 flex gap-1">{["bg-emerald-500", "bg-emerald-500", "bg-violet-500", "bg-slate-200", "bg-slate-200"].map((color, index) => <span className={cn("h-2 flex-1 rounded-full", color)} key={`${color}-${index}`} />)}</div></div>
          <Button icon={AlertCircle} onClick={() => onSelectView("attention")} variant="secondary">{attentionCount} pendientes</Button>
        </div>
      </div>
      <nav aria-label="Secciones del proyecto" className="mt-4 flex gap-1 overflow-x-auto scrollbar-subtle">
        {PRODUCT_NAV.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.key;
          return (
            <button aria-current={active ? "page" : undefined} className={cn("flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-[11px] font-black transition", active ? "border-violet-600 text-violet-700" : "border-transparent text-slate-500 hover:text-slate-800")} key={item.key} onClick={() => onSelectView(item.key)} type="button">
              <Icon className="h-3.5 w-3.5" />{item.label}{item.key === "attention" ? <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] text-rose-700">{attentionCount}</span> : null}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function StageRail({ activeStage, access, onSelect }: { activeStage: StageKey; access: AccessLevel; onSelect: (stage: StageKey) => void }) {
  const completed = new Set<StageKey>(["discover", "define"]);
  return (
    <aside className="hidden border-r border-slate-200 bg-white p-4 xl:block">
      <div className="px-2"><p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Ruta LEAN</p><p className="mt-1 text-[13px] font-black text-slate-900">Diseno a construccion</p></div>
      <div className="mt-4 space-y-1">
        {STAGES.map((stage, index) => {
          const active = stage.key === activeStage;
          const locked = stage.product === "ACP" && access !== "acp";
          const attention = ATTENTION_ITEMS.some((item) => item.stage === stage.key && item.blocking);
          return (
            <button className={cn("group relative flex min-h-[62px] w-full items-start gap-3 rounded-xl border p-3 text-left transition", active ? "border-violet-200 bg-violet-50" : "border-transparent hover:border-slate-200 hover:bg-slate-50")} key={stage.key} onClick={() => onSelect(stage.key)} type="button">
              {index < STAGES.length - 1 ? <span className="absolute left-[26px] top-[43px] h-[30px] w-px bg-slate-200" /> : null}
              <span className={cn("relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-black", completed.has(stage.key) && "border-emerald-300 bg-emerald-50 text-emerald-700", active && "border-violet-600 bg-violet-600 text-white", attention && !active && "border-rose-300 bg-rose-50 text-rose-700", locked && "border-slate-200 bg-white text-slate-400", !completed.has(stage.key) && !active && !attention && !locked && "border-slate-200 bg-white text-slate-500")}>
                {completed.has(stage.key) ? <Check className="h-3.5 w-3.5" /> : locked ? <Lock className="h-3 w-3" /> : attention && !active ? <AlertCircle className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span className="min-w-0 flex-1"><span className={cn("block text-[11px] font-black", active ? "text-violet-900" : "text-slate-800")}>{stage.label}</span><span className="mt-0.5 block text-[9px] leading-4 text-slate-500">{stage.subtitle}</span></span>
              {stage.product === "ACP" ? <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">ACP</span> : null}
            </button>
          );
        })}
      </div>
      <div className="mt-5 rounded-2xl border border-violet-100 bg-violet-50 p-4"><div className="flex items-center gap-2 text-violet-700"><Brain className="h-4 w-4" /><span className="text-[10px] font-black uppercase tracking-wider">Contexto activo</span></div><p className="mt-2 text-[10px] leading-5 text-slate-600">Solo viajan al LLM las evidencias y decisiones necesarias para la tarea actual.</p><button className="mt-3 text-[10px] font-black text-violet-700" type="button">Inspeccionar memoria usada</button></div>
    </aside>
  );
}

function MobileStageSelector({ activeStage, onSelect }: { activeStage: StageKey; onSelect: (stage: StageKey) => void }) {
  return (
    <div className="border-b border-slate-200 bg-white p-3 xl:hidden">
      <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-3"><Waypoints className="h-4 w-4 text-violet-600" /><span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Etapa</span><select className="min-h-11 min-w-0 flex-1 bg-transparent text-[12px] font-black text-slate-800 outline-none" onChange={(event) => onSelect(event.target.value as StageKey)} value={activeStage}>{STAGES.map((stage) => <option key={stage.key} value={stage.key}>{stage.label} - {stage.subtitle}</option>)}</select></label>
    </div>
  );
}

function PrimaryAction({ mode, stage, onAttention, onMode }: { mode: ExperienceState; stage: StageDefinition; onAttention: () => void; onMode: (mode: ExperienceState) => void }) {
  if (mode === "blocking") {
    const blocker = ATTENTION_ITEMS.find((item) => item.stage === stage.key && item.blocking) ?? ATTENTION_ITEMS[0];
    return (
      <Panel className="overflow-hidden border-rose-200">
        <div className="bg-[radial-gradient(circle_at_90%_0%,rgba(244,63,94,.12),transparent_34%),#fff7f8] p-5 lg:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2"><Badge tone="red"><AlertCircle className="h-3 w-3" />Accion bloqueante</Badge><span className="text-[10px] font-semibold text-slate-500">{blocker.id} / Detectada por el critic LLM</span></div>
          <p className="mt-5 text-[10px] font-black uppercase tracking-[0.2em] text-rose-700">Lo unico que necesitas resolver ahora</p>
          <h2 className="mt-2 max-w-4xl text-[25px] font-black tracking-[-0.035em] text-slate-950">{blocker.title}</h2>
          <p className="mt-2 max-w-4xl text-[12px] leading-5 text-slate-600">{blocker.reason} {blocker.impact}</p>
          <div className="mt-5 flex flex-wrap gap-2"><Button icon={ArrowRight} onClick={onAttention} variant="primary">Responder ahora</Button><Button icon={Eye} onClick={() => onMode("ready")}>Revisar contexto</Button></div>
        </div>
        <div className="grid border-t border-rose-100 bg-white sm:grid-cols-3">{[["Origen", blocker.stage], ["Responsable", blocker.owner], ["Despues", "Regenerar y volver a revision"]].map(([label, value]) => <div className="border-b border-slate-100 px-5 py-3 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0" key={label}><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-[11px] font-bold text-slate-800">{value}</p></div>)}</div>
      </Panel>
    );
  }
  if (mode === "processing") {
    return (
      <Panel className="overflow-hidden border-sky-200">
        <div aria-live="polite" className="bg-[radial-gradient(circle_at_90%_0%,rgba(14,165,233,.13),transparent_34%),#f0f9ff] p-5 lg:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2"><Badge tone="blue"><RefreshCcw className="h-3 w-3 animate-spin" />LLM trabajando</Badge><span className="text-[10px] font-semibold text-slate-500">Ultima senal hace 4 s / RUN-284</span></div>
          <h2 className="mt-4 text-[25px] font-black tracking-[-0.035em] text-slate-950">Actualizando {stage.output.toLowerCase()}</h2>
          <p className="mt-2 max-w-3xl text-[12px] leading-5 text-slate-600">El avance se comunica por actividades verificables. No mostramos porcentajes ni tiempos que el sistema no puede estimar.</p>
          <div className="mt-5 grid gap-2 md:grid-cols-4">{[["Validar entradas", "done"], ["Recuperar contexto", "done"], ["Generar propuesta", "active"], ["Ejecutar critic", "pending"]].map(([label, state], index) => <div className={cn("rounded-xl border p-3", state === "done" && "border-emerald-200 bg-white", state === "active" && "border-sky-300 bg-sky-50", state === "pending" && "border-slate-200 bg-white/70")} key={label}><div className="flex items-center gap-2"><span className={cn("flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-black", state === "done" ? TONE_CLASSES.green : state === "active" ? TONE_CLASSES.blue : TONE_CLASSES.slate)}>{state === "done" ? <Check className="h-3.5 w-3.5" /> : state === "active" ? <RefreshCcw className="h-3.5 w-3.5 animate-spin" /> : index + 1}</span><p className="text-[10px] font-black text-slate-800">{label}</p></div></div>)}</div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><p className="text-[10px] text-slate-500">Puedes seguir navegando. Te avisaremos si se requiere intervencion.</p><div className="flex gap-2"><Button onClick={() => onMode("ready")}>Pausar</Button><Button onClick={() => onMode("review")} variant="primary">Simular finalizacion</Button></div></div>
        </div>
      </Panel>
    );
  }
  if (mode === "review") {
    return (
      <Panel className="border-emerald-200 bg-[radial-gradient(circle_at_90%_0%,rgba(16,185,129,.12),transparent_34%),#ffffff] p-5 lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><Badge tone="green"><CheckCircle2 className="h-3 w-3" />Propuesta lista para revision</Badge><h2 className="mt-4 text-[25px] font-black tracking-[-0.035em] text-slate-950">Revisa los cambios antes de aprobar {stage.label}</h2><p className="mt-2 max-w-3xl text-[12px] leading-5 text-slate-600">El critic confirmo cobertura, consistencia y trazabilidad. La aprobacion registrara esta version como contexto para la siguiente etapa.</p></div><div className="flex shrink-0 gap-2"><Button icon={RefreshCcw} onClick={() => onMode("processing")}>Regenerar</Button><Button icon={Check} variant="primary">Aprobar {stage.label}</Button></div></div>
      </Panel>
    );
  }
  return (
    <Panel className="border-violet-200 bg-[radial-gradient(circle_at_90%_0%,rgba(124,58,237,.12),transparent_36%),#ffffff] p-5 lg:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><Badge tone="violet"><Zap className="h-3 w-3" />Siguiente mejor accion</Badge><h2 className="mt-4 text-[25px] font-black tracking-[-0.035em] text-slate-950">{stage.nextAction}</h2><p className="mt-2 max-w-3xl text-[12px] leading-5 text-slate-600">Completa la tarea en el area de trabajo. El sistema usara solo el contexto aprobado necesario y mostrara cualquier nueva intervencion en Atencion.</p></div><Button icon={Play} onClick={() => onMode("processing")} variant="primary">Ejecutar analisis LLM</Button></div>
    </Panel>
  );
}

function StageTask({ stage, onAttention }: { stage: StageKey; onAttention: () => void }) {
  if (stage === "discover") return <div className="grid gap-4 lg:grid-cols-2"><label className="rounded-xl border border-slate-200 p-4"><span className="text-[11px] font-black text-slate-800">Problema de negocio</span><textarea className="mt-2 min-h-28 w-full resize-none rounded-xl border border-slate-200 p-3 text-[11px] outline-none focus:border-violet-500" defaultValue="El equipo de soporte recibe cientos de solicitudes repetitivas y tarda en identificar la respuesta correcta." /></label><label className="rounded-xl border border-slate-200 p-4"><span className="text-[11px] font-black text-slate-800">Resultado esperado</span><textarea className="mt-2 min-h-28 w-full resize-none rounded-xl border border-slate-200 p-3 text-[11px] outline-none focus:border-violet-500" defaultValue="Reducir el tiempo de resolucion manteniendo evidencia, control humano y trazabilidad." /></label><label className="rounded-xl border border-slate-200 p-4"><span className="text-[11px] font-black text-slate-800">Restricciones</span><input className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-[11px] outline-none focus:border-violet-500" defaultValue="No ejecutar compensaciones sin approval gate" /></label><label className="rounded-xl border border-slate-200 p-4"><span className="text-[11px] font-black text-slate-800">Fuentes iniciales</span><input className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-[11px] outline-none focus:border-violet-500" defaultValue="Base de conocimiento, politicas y tickets historicos" /></label></div>;
  if (stage === "define") return <div className="grid gap-3 md:grid-cols-2">{[["Objetivo medible", "Reducir 45% el tiempo de resolucion en 90 dias."], ["Alcance MVP", "Clasificar, recuperar evidencia, responder y escalar."], ["Reglas de negocio", "Side effects requieren autorizacion segun monto."], ["NFR principal", "Trazabilidad completa y respuesta grounded."]].map(([title, detail]) => <button className="rounded-xl border border-slate-200 p-4 text-left hover:border-violet-300 hover:bg-violet-50/40" key={title} type="button"><div className="flex items-center justify-between"><p className="text-[11px] font-black text-slate-900">{title}</p><Badge tone="green">Definido</Badge></div><p className="mt-2 text-[10px] leading-5 text-slate-600">{detail}</p></button>)}</div>;
  if (stage === "design") return <div className="space-y-3">{[["Supervision jerarquica", "92%", "Recomendada", "Supervisor con especialistas, critic y escalamiento humano."], ["Router especializado", "84%", "Viable", "Menor costo, pero menos control para decisiones sensibles."], ["Swarm colaborativo", "68%", "Sobredimensionada", "Mayor complejidad sin beneficio proporcional para el MVP."]].map(([title, score, status, detail], index) => <label className={cn("flex cursor-pointer gap-4 rounded-xl border p-4", index === 0 ? "border-violet-400 bg-violet-50" : "border-slate-200 hover:bg-slate-50")} key={title}><input className="mt-1 h-4 w-4 accent-violet-600" defaultChecked={index === 0} name="architecture" type="radio" /><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center justify-between gap-2"><span className="text-[12px] font-black text-slate-900">{title}</span><span className="flex gap-2"><Badge tone={index === 0 ? "violet" : "slate"}>{score} fit</Badge><Badge tone={index === 2 ? "amber" : "green"}>{status}</Badge></span></span><span className="mt-2 block text-[10px] leading-5 text-slate-600">{detail}</span></span></label>)}</div>;
  if (stage === "tools") return <div className="space-y-3">{[["knowledge_search", "Obligatoria", "Recupera evidencia aprobada para respuestas grounded.", "green"], ["ticketing_connector", "Obligatoria", "Consulta y actualiza tickets con idempotencia.", "green"], ["document_ingestion", "Obligatoria para RAG", "Ingesta, refresh y lineage de las fuentes de conocimiento.", "violet"], ["web_search", "Innecesaria", "No existe un caso aprobado que requiera acceso web abierto.", "slate"]].map(([name, status, detail, tone]) => <div className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center" key={name}><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><Wrench className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-mono text-[11px] font-black text-slate-900">{name}</p><Badge tone={tone as Tone}>{status}</Badge></div><p className="mt-1 text-[10px] leading-4 text-slate-500">{detail}</p></div><Button>{status === "Innecesaria" ? "Mantener fuera" : "Revisar contrato"}</Button></div>)}</div>;
  if (stage === "memory") return <div className="space-y-4"><div className="rounded-xl border border-rose-200 bg-rose-50 p-4"><div className="flex items-start gap-3"><AlertCircle className="mt-0.5 h-5 w-5 text-rose-600" /><div><p className="text-[12px] font-black text-slate-900">Dependencia transversal detectada</p><p className="mt-1 text-[10px] leading-5 text-slate-600">La estrategia RAG requiere document_ingestion aprobada en Herramientas. La remediacion conserva el contexto y evita una aprobacion inconsistente.</p><button className="mt-2 text-[10px] font-black text-rose-700" onClick={onAttention} type="button">Resolver desde Atencion</button></div></div></div><div className="grid gap-3 md:grid-cols-3">{[["Memoria corta", "Resumen de sesion, ventana por turnos y referencias."], ["Memoria larga", "Decisiones, reglas, artefactos y trazabilidad versionada."], ["Conocimiento RAG", "Fuentes aprobadas, chunks, metadata, ownership y refresh."]].map(([title, detail]) => <div className="rounded-xl border border-slate-200 p-4" key={title}><Database className="h-5 w-5 text-violet-600" /><p className="mt-3 text-[11px] font-black text-slate-900">{title}</p><p className="mt-2 text-[10px] leading-5 text-slate-500">{detail}</p></div>)}</div></div>;
  if (stage === "estimate") return <div className="overflow-hidden rounded-xl border border-slate-200"><div className="grid grid-cols-[minmax(180px,1fr)_100px_110px_110px] bg-slate-50 px-4 py-3 text-[9px] font-black uppercase tracking-wider text-slate-400"><span>Escenario</span><span>Tiempo</span><span>Intervencion</span><span>Ahorro</span></div>{[["Desarrollo tradicional", "16 sem", "Alta", "Base"], ["Blueprint", "12 sem", "Media-alta", "25%"], ["ACP", "8 sem", "Media", "50%"], ["ACP + agentic", "5 sem", "Baja guiada", "69%"]].map((row, index) => <div className={cn("grid min-h-14 grid-cols-[minmax(180px,1fr)_100px_110px_110px] items-center border-t border-slate-100 px-4 text-[10px]", index === 3 && "bg-emerald-50")} key={row[0]}><span className="font-black text-slate-800">{row[0]}</span><span>{row[1]}</span><span>{row[2]}</span><Badge tone={index === 0 ? "slate" : "green"}>{row[3]}</Badge></div>)}</div>;
  return <div className="rounded-2xl border border-violet-200 bg-violet-50 p-6 text-center"><Lock className="mx-auto h-7 w-7 text-violet-600" /><h3 className="mt-3 text-[16px] font-black text-slate-950">Esta etapa pertenece al Agent Construction Package</h3><p className="mx-auto mt-2 max-w-xl text-[11px] leading-5 text-slate-600">El catalogo permanece visible para mostrar su valor. Adquiere el ACP para validar, gestionar GAPs y generar el paquete portable.</p></div>;
}

function Workbench({ activeTab, onAttention, onTab, stage }: { activeTab: WorkTab; onAttention: () => void; onTab: (tab: WorkTab) => void; stage: StageDefinition }) {
  const tabs: Array<{ key: WorkTab; label: string; badge?: string }> = [{ key: "task", label: "Tarea actual" }, { key: "result", label: "Resultado generado", badge: "v12" }, { key: "evidence", label: "Evidencia y trazabilidad", badge: "10" }];
  return (
    <Panel className="overflow-hidden">
      <div aria-label="Area de trabajo" className="flex gap-1 overflow-x-auto border-b border-slate-200 px-3" role="tablist">{tabs.map((tab) => <button aria-selected={activeTab === tab.key} className={cn("min-h-12 shrink-0 border-b-2 px-3 text-[11px] font-black", activeTab === tab.key ? "border-violet-600 text-violet-700" : "border-transparent text-slate-500 hover:text-slate-800")} key={tab.key} onClick={() => onTab(tab.key)} role="tab" type="button">{tab.label}{tab.badge ? <span className="ml-2 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px]">{tab.badge}</span> : null}</button>)}</div>
      <div className="p-4 lg:p-5">
        {activeTab === "task" ? <StageTask onAttention={onAttention} stage={stage.key} /> : null}
        {activeTab === "result" ? <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(260px,.75fr)]"><div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Salida actual</p><h3 className="mt-2 text-[20px] font-black tracking-[-0.025em] text-slate-950">{stage.output}</h3><p className="mt-2 text-[11px] leading-6 text-slate-600">La propuesta consolida informacion aprobada de etapas anteriores, memoria recuperada por referencia y el analisis especializado del LLM.</p><div className="mt-4 grid gap-3 sm:grid-cols-3">{[["Cobertura", "15/15"], ["Confianza", "Alta"], ["Findings", "1 abierto"]].map(([label, value]) => <div className="rounded-xl border border-slate-200 p-4" key={label}><p className="text-[9px] uppercase tracking-wider text-slate-400">{label}</p><p className="mt-2 text-[17px] font-black text-slate-900">{value}</p></div>)}</div></div><div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between"><p className="text-[11px] font-black text-slate-900">Diagrama vinculado</p><Network className="h-4 w-4 text-violet-600" /></div><div className="mt-4 grid grid-cols-3 gap-2">{["Entrada", "Agente", "Salida"].map((label) => <span className="rounded-lg bg-white p-2 text-center text-[9px] font-bold text-violet-800" key={label}>{label}</span>)}</div><div className="mx-auto h-5 w-px bg-violet-300" /><div className="rounded-lg bg-slate-900 p-2 text-center text-[9px] font-bold text-white">Tools + Memory</div></div></div> : null}
        {activeTab === "evidence" ? <div className="space-y-3">{[["Entradas aprobadas", "Discovery v5 + Definition v8"], ["Memoria recuperada", "6 documentos / 10 fragmentos / 4 decisiones"], ["Proveedor LLM", "Codex CLI / modelo configurado por administrador"], ["Prompt y evaluador", `${stage.key}-generation-v4 / critic-v3`], ["Salida versionada", `${stage.key}-artifact-v12 / hash 78b...e2`]].map(([label, value], index) => <div className="flex gap-4 rounded-xl border border-slate-200 p-4" key={label}><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-black text-white">{index + 1}</span><div><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-[11px] font-semibold text-slate-700">{value}</p></div></div>)}</div> : null}
      </div>
    </Panel>
  );
}

function ContextRail({ activeStage, onAttention, onDiagrams }: { activeStage: StageKey; onAttention: () => void; onDiagrams: () => void }) {
  const stageItems = ATTENTION_ITEMS.filter((item) => item.stage === activeStage);
  return (
    <aside className="hidden space-y-4 border-l border-slate-200 bg-[#fbfbfd] p-4 2xl:block">
      <Panel className="p-4"><div className="flex items-center justify-between"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Atencion contextual</p><Badge tone={stageItems.some((item) => item.blocking) ? "red" : "green"}>{stageItems.length} items</Badge></div>{stageItems.length ? <div className="mt-3 space-y-2">{stageItems.map((item) => <button className={cn("w-full rounded-xl border p-3 text-left", TONE_CLASSES[item.tone])} key={item.id} onClick={onAttention} type="button"><p className="text-[9px] font-black uppercase tracking-wider">{item.kind}</p><p className="mt-1.5 text-[10px] font-black leading-4 text-slate-800">{item.title}</p></button>)}</div> : <div className="mt-3 rounded-xl bg-emerald-50 p-3"><div className="flex items-center gap-2 text-emerald-700"><CheckCircle2 className="h-4 w-4" /><p className="text-[10px] font-black">Sin intervenciones en esta etapa</p></div></div>}<button className="mt-3 text-[10px] font-black text-violet-700" onClick={onAttention} type="button">Abrir bandeja completa</button></Panel>
      <Panel className="p-4"><div className="flex items-center justify-between"><p className="text-[11px] font-black text-slate-900">Resultados vinculados</p><span className="text-[9px] text-slate-400">v12</span></div><div className="mt-3 space-y-2">{[["Documento de etapa", FileText], ["Diagrama principal", Network], ["Decision log", GitBranch]].map(([label, IconValue]) => { const Icon = IconValue as LucideIcon; return <button className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-slate-200 px-3 text-left text-[10px] font-semibold text-slate-700 hover:bg-slate-50" key={String(label)} onClick={() => label === "Diagrama principal" && onDiagrams()} type="button"><Icon className="h-4 w-4 text-violet-600" />{String(label)}<ChevronRight className="ml-auto h-3.5 w-3.5 text-slate-400" /></button>; })}</div></Panel>
      <Panel className="p-4"><div className="flex items-center gap-2"><History className="h-4 w-4 text-slate-500" /><p className="text-[11px] font-black text-slate-900">Que ocurrira despues</p></div><p className="mt-3 text-[10px] leading-5 text-slate-600">Al aprobar, esta version se convierte en contexto canonico y se habilita la siguiente etapa sin reenviar informacion redundante.</p></Panel>
    </aside>
  );
}

function AttentionHub({ onOpenItem, selectedId, setSelectedId }: { onOpenItem: () => void; selectedId: string; setSelectedId: (id: string) => void }) {
  const selected = ATTENTION_ITEMS.find((item) => item.id === selectedId) ?? ATTENTION_ITEMS[0];
  return <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]"><Panel className="overflow-hidden"><div className="border-b border-slate-200 p-4"><Badge tone="red">2 bloqueantes / 2 no bloqueantes</Badge><h2 className="mt-3 text-[20px] font-black text-slate-950">Segmento de Atencion</h2><p className="mt-1 text-[10px] leading-5 text-slate-500">Intervenciones de todas las etapas, ordenadas por impacto.</p></div><div className="max-h-[650px] space-y-2 overflow-y-auto p-2 scrollbar-subtle">{ATTENTION_ITEMS.map((item) => <button className={cn("w-full rounded-xl border p-3.5 text-left", selected.id === item.id ? "border-violet-400 bg-violet-50" : "border-slate-200 bg-white hover:bg-slate-50")} key={item.id} onClick={() => setSelectedId(item.id)} type="button"><div className="flex items-center justify-between gap-2"><Badge tone={item.tone}>{item.id} / {item.kind}</Badge>{item.blocking ? <span className="text-[9px] font-black uppercase text-rose-600">Bloquea</span> : null}</div><p className="mt-3 text-[11px] font-black leading-5 text-slate-900">{item.title}</p><p className="mt-2 text-[9px] text-slate-500">{STAGES.find((stage) => stage.key === item.stage)?.label} / {item.owner}</p></button>)}</div></Panel><Panel className="overflow-hidden"><div className={cn("border-b p-5", selected.blocking ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-slate-50")}><div className="flex flex-wrap items-center justify-between gap-2"><Badge tone={selected.tone}>{selected.kind}</Badge><span className="text-[9px] font-semibold text-slate-500">Detectado hoy, 09:42</span></div><h2 className="mt-4 text-[22px] font-black tracking-[-0.03em] text-slate-950">{selected.title}</h2><p className="mt-2 text-[11px] leading-5 text-slate-600">{selected.reason}</p></div><div className="p-5"><div className="grid gap-3 md:grid-cols-2">{[["Etapa de origen", STAGES.find((stage) => stage.key === selected.stage)?.label ?? selected.stage], ["Responsable", selected.owner], ["Impacto", selected.impact], ["Consecuencia", selected.blocking ? "La etapa no puede aprobarse." : "Puede diferirse sin detener el flujo."]].map(([label, value]) => <div className="rounded-xl border border-slate-200 p-4" key={label}><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</p><p className="mt-2 text-[10px] font-semibold leading-5 text-slate-700">{value}</p></div>)}</div><div className="mt-5 rounded-xl border border-violet-200 bg-violet-50 p-4"><p className="text-[9px] font-black uppercase tracking-wider text-violet-700">Accion requerida</p><p className="mt-2 text-[12px] font-black text-slate-900">{selected.blocking ? "Resolver dentro del contexto de origen" : "Aceptar, rechazar o diferir con justificacion"}</p><p className="mt-2 text-[10px] leading-5 text-slate-600">La resolucion actualiza el artefacto de origen; Atencion no duplica el estado de dominio.</p></div><div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5"><Button icon={History}>Ver historial</Button><Button icon={ArrowRight} onClick={onOpenItem} variant="primary">Abrir en {STAGES.find((stage) => stage.key === selected.stage)?.label}</Button></div></div></Panel></div>;
}

function DiagramHub({ access }: { access: AccessLevel }) {
  const diagrams = [["Arquitectura", "Blueprint", true], ["Orquestacion", "Blueprint", access !== "free"], ["Herramientas", "Blueprint", access !== "free"], ["Memoria y RAG", "Blueprint", access !== "free"], ["Flujo de decisiones", "Blueprint", access !== "free"], ["Conocimiento", "Blueprint Pro", access !== "free"], ["Seguridad", "Blueprint Pro", access !== "free"], ["Despliegue", "ACP", access === "acp"], ["Estados portables", "ACP", access === "acp"]] as const;
  const [selected, setSelected] = useState<string>(diagrams[0][0]);
  const selectedDiagram = diagrams.find((diagram) => diagram[0] === selected) ?? diagrams[0];
  return <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]"><Panel className="overflow-hidden"><div className="border-b border-slate-200 p-4"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-600">Catalogo completo</p><h2 className="mt-2 text-[19px] font-black text-slate-950">Diagramas generados</h2><div className="mt-3 flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3"><Search className="h-4 w-4 text-slate-400" /><input aria-label="Buscar diagramas" className="min-w-0 flex-1 bg-transparent text-[10px] outline-none" placeholder="Buscar diagrama" /></div></div><div className="max-h-[620px] space-y-2 overflow-y-auto p-2 scrollbar-subtle">{diagrams.map(([name, product, unlocked]) => <button className={cn("flex min-h-14 w-full items-center gap-3 rounded-xl border p-3 text-left", selected === name ? "border-violet-400 bg-violet-50" : "border-slate-200 hover:bg-slate-50")} key={name} onClick={() => setSelected(name)} type="button"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-violet-700"><Network className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-[10px] font-black text-slate-900">{name}</span><span className="mt-1 block text-[9px] text-slate-500">{product}</span></span>{unlocked ? <Eye className="h-4 w-4 text-emerald-600" /> : <Lock className="h-4 w-4 text-slate-400" />}</button>)}</div></Panel><Panel className="overflow-hidden"><div className="flex items-center justify-between border-b border-slate-200 p-4"><div><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Disenar / v12</p><h2 className="mt-1 text-[17px] font-black text-slate-950">{selectedDiagram[0]}</h2></div><Badge tone={selectedDiagram[2] ? "green" : "amber"}>{selectedDiagram[2] ? "Disponible" : selectedDiagram[1]}</Badge></div>{selectedDiagram[2] ? <div className="relative min-h-[520px] overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,.12),transparent_35%),#f8fafc] p-8"><div className="absolute inset-0 opacity-30 [background-image:linear-gradient(#cbd5e1_1px,transparent_1px),linear-gradient(90deg,#cbd5e1_1px,transparent_1px)] [background-size:24px_24px]" /><div className="relative mx-auto mt-12 grid max-w-3xl gap-8 md:grid-cols-3">{[["Canales", Users], ["Supervisor", GitBranch], ["Especialistas", Bot]].map(([label, IconValue], index) => { const Icon = IconValue as LucideIcon; return <div className="relative rounded-2xl border border-violet-200 bg-white p-5 text-center shadow-lg" key={String(label)}>{index < 2 ? <span className="absolute left-full top-1/2 hidden h-px w-8 bg-violet-300 md:block" /> : null}<span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><Icon className="h-5 w-5" /></span><p className="mt-3 text-[11px] font-black text-slate-900">{String(label)}</p></div>; })}</div><div className="relative mx-auto mt-12 grid max-w-xl grid-cols-2 gap-6">{[["Tools", Wrench], ["Memory + RAG", Database]].map(([label, IconValue]) => { const Icon = IconValue as LucideIcon; return <div className="rounded-2xl bg-slate-900 p-5 text-center text-white" key={String(label)}><Icon className="mx-auto h-5 w-5 text-violet-300" /><p className="mt-2 text-[10px] font-black">{String(label)}</p></div>; })}</div></div> : <div className="flex min-h-[520px] items-center justify-center bg-slate-50 p-6"><div className="max-w-lg text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-700"><Lock className="h-6 w-6" /></span><h3 className="mt-4 text-[20px] font-black text-slate-950">Este diagrama forma parte de {selectedDiagram[1]}</h3><p className="mt-2 text-[11px] leading-5 text-slate-600">El catalogo muestra todo el valor generado. Adquiere el producto correspondiente para acceder al detalle y sus relaciones.</p><Button className="mt-5" variant="primary">Conocer beneficios</Button></div></div>}</Panel></div>;
}

function ProductOverview({ access, product, onAccess }: { access: AccessLevel; product: "blueprint" | "acp"; onAccess: (access: AccessLevel) => void }) {
  const blueprint = product === "blueprint";
  const unlocked = blueprint ? access !== "free" : access === "acp";
  return <div className="space-y-4"><Panel className={cn("overflow-hidden", blueprint ? "border-violet-200" : "border-slate-800")}><div className={cn("p-6 lg:p-8", blueprint ? "bg-[radial-gradient(circle_at_90%_0%,rgba(124,58,237,.15),transparent_36%),#ffffff]" : "bg-[radial-gradient(circle_at_90%_0%,rgba(99,102,241,.3),transparent_35%),#071329] text-white")}><Badge tone={blueprint ? "violet" : "blue"}>{blueprint ? "Producto 1" : "Producto 2"}</Badge><h2 className="mt-4 text-[28px] font-black tracking-[-0.04em]">{blueprint ? "Blueprint integral del sistema agentico" : "Agent Construction Package portable"}</h2><p className={cn("mt-3 max-w-3xl text-[12px] leading-6", blueprint ? "text-slate-600" : "text-slate-300")}>{blueprint ? "Arquitectura, patrones, herramientas, memoria, conocimiento, diagramas, estimacion y documentacion para comprender como construir la solucion." : "Especificaciones, prompts, contratos, tests, decisiones pendientes y launcher para iniciar la construccion sin depender de Lean Agent Builder."}</p><div className="mt-6 flex flex-wrap gap-3"><Button icon={unlocked ? Eye : Lock} variant="primary">{unlocked ? "Explorar contenido" : `Adquirir ${blueprint ? "Blueprint Pro" : "ACP"}`}</Button><Button className={cn(!blueprint && "border-white/20 bg-white/10 text-white hover:bg-white/15")} onClick={() => onAccess(blueprint ? "blueprint" : "acp")}>Simular adquisicion</Button></div></div></Panel><div className="grid gap-4 md:grid-cols-3">{(blueprint ? [["Diseno integral", "Arquitectura, patrones, tools, memory y contratos."], ["Valor cuantificado", "Comparacion de tiempo, costo, riesgo y ahorro."], ["12 diagramas", "Catalogo relacionado con decisiones y artefactos."]] : [["Construccion guiada", "Pasos y artefactos minimos para implementar."], ["GAPs controlados", "Preguntas con contexto, opciones e impacto."], ["Portabilidad", "Sin IDs, estados ni servicios exclusivos de la plataforma."]]).map(([title, detail], index) => <Panel className="p-5" key={title}><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">{index === 0 ? <FileText className="h-5 w-5" /> : index === 1 ? <ShieldCheck className="h-5 w-5" /> : <Network className="h-5 w-5" />}</span><h3 className="mt-4 text-[13px] font-black text-slate-900">{title}</h3><p className="mt-2 text-[10px] leading-5 text-slate-500">{detail}</p></Panel>)}</div></div>;
}

function ArtifactHub() {
  return <Panel className="overflow-hidden"><div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-600">Biblioteca del proyecto</p><h2 className="mt-1 text-[20px] font-black text-slate-950">Artefactos y versiones</h2></div><Button icon={Search}>Buscar</Button></div><div className="overflow-x-auto"><div className="min-w-[720px]"><div className="grid grid-cols-[minmax(220px,1fr)_120px_110px_120px_100px] bg-slate-50 px-5 py-3 text-[9px] font-black uppercase tracking-wider text-slate-400"><span>Artefacto</span><span>Etapa</span><span>Version</span><span>Estado</span><span>Accion</span></div>{[["Discovery canvas", "Descubrir", "v5", "Aprobado"], ["Definition spec", "Definir", "v8", "Aprobado"], ["Architecture spec", "Disenar", "v12", "En revision"], ["Toolset canonico", "Herramientas", "v7", "Generado"], ["Memory strategy", "Memoria", "v4", "Desactualizado"]].map(([name, stage, version, status]) => <div className="grid min-h-16 grid-cols-[minmax(220px,1fr)_120px_110px_120px_100px] items-center border-t border-slate-100 px-5 text-[10px]" key={name}><span className="flex items-center gap-3 font-black text-slate-800"><FileText className="h-4 w-4 text-violet-600" />{name}</span><span>{stage}</span><span>{version}</span><Badge tone={status === "Aprobado" ? "green" : status === "Desactualizado" ? "red" : "amber"}>{status}</Badge><button className="font-black text-violet-700" type="button">Abrir</button></div>)}</div></div></Panel>;
}

function ActivityHub() {
  return <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]"><Panel className="p-5"><div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-600">Actividad del sistema</p><h2 className="mt-1 text-[20px] font-black text-slate-950">Ejecuciones y decisiones</h2></div><Activity className="h-5 w-5 text-violet-600" /></div><div className="mt-5 space-y-3">{[["Criticar arquitectura", "Completado con 1 pregunta", "Hace 12 min", "green"], ["Generar toolset minimo", "Completado", "Hace 28 min", "green"], ["Actualizar estrategia RAG", "Esperando intervencion", "Hace 31 min", "amber"], ["Indexar conocimiento", "12 de 18 fuentes", "Hoy, 08:54", "blue"]].map(([title, status, time, tone], index) => <div className="flex gap-4 rounded-xl border border-slate-200 p-4" key={title}><span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border", TONE_CLASSES[tone as Tone])}>{index < 2 ? <Check className="h-4 w-4" /> : index === 2 ? <AlertCircle className="h-4 w-4" /> : <RefreshCcw className="h-4 w-4" />}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap justify-between gap-2"><p className="text-[11px] font-black text-slate-900">{title}</p><span className="text-[9px] text-slate-400">{time}</span></div><p className="mt-1 text-[10px] text-slate-500">{status}</p></div></div>)}</div></Panel><Panel className="p-5"><p className="text-[11px] font-black text-slate-900">Salud operativa</p><div className="mt-4 space-y-3">{[["Proveedor LLM", "Disponible", "green"], ["Memoria larga", "Sincronizada", "green"], ["Indexacion", "En curso", "blue"], ["Accion humana", "Requerida", "red"]].map(([label, value, tone]) => <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-[10px]" key={label}><span className="text-slate-600">{label}</span><Badge tone={tone as Tone}>{value}</Badge></div>)}</div></Panel></div>;
}

function PrototypeControls({ access, mode, onAccess, onMode }: { access: AccessLevel; mode: ExperienceState; onAccess: (access: AccessLevel) => void; onMode: (mode: ExperienceState) => void }) {
  return <details className="fixed bottom-4 right-4 z-[70] hidden w-[290px] rounded-2xl border border-slate-300 bg-white/95 shadow-2xl backdrop-blur sm:block"><summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 text-[11px] font-black text-slate-800"><Settings className="h-4 w-4 text-violet-600" />Controles del prototipo<ChevronDown className="ml-auto h-4 w-4" /></summary><div className="space-y-4 border-t border-slate-200 p-4"><fieldset><legend className="text-[9px] font-black uppercase tracking-wider text-slate-400">Estado de experiencia</legend><div className="mt-2 grid grid-cols-2 gap-2">{(["ready", "blocking", "processing", "review"] as ExperienceState[]).map((state) => <button className={cn("min-h-10 rounded-lg border px-2 text-[10px] font-black capitalize", mode === state ? "border-violet-600 bg-violet-600 text-white" : "border-slate-200 text-slate-600")} key={state} onClick={() => onMode(state)} type="button">{state}</button>)}</div></fieldset><label className="block"><span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Entitlement simulado</span><select className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-black outline-none" onChange={(event) => onAccess(event.target.value as AccessLevel)} value={access}><option value="free">Blueprint gratuito</option><option value="blueprint">Blueprint Pro</option><option value="acp">ACP Premium</option></select></label><p className="text-[9px] leading-4 text-slate-500">Este panel existe solo para revisar variantes del mockup; no forma parte de la experiencia productiva.</p></div></details>;
}

export function LeanConvergenceHifiMockup() {
  const [activeStage, setActiveStage] = useState<StageKey>("design");
  const [activeView, setActiveView] = useState<ViewKey>("work");
  const [mode, setMode] = useState<ExperienceState>("blocking");
  const [access, setAccess] = useState<AccessLevel>("free");
  const [workTab, setWorkTab] = useState<WorkTab>("task");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [attentionDrawer, setAttentionDrawer] = useState(false);
  const [selectedAttention, setSelectedAttention] = useState("Q-14");
  const stage = STAGES.find((item) => item.key === activeStage) ?? STAGES[2];

  function selectStage(nextStage: StageKey) {
    const definition = STAGES.find((item) => item.key === nextStage);
    if (definition?.product === "ACP" && access !== "acp") {
      setActiveView("acp");
      return;
    }
    setActiveStage(nextStage);
    setActiveView("work");
    setWorkTab("task");
    setMode(nextStage === "design" || nextStage === "memory" ? "blocking" : "ready");
  }

  function openAttentionItem() {
    const item = ATTENTION_ITEMS.find((candidate) => candidate.id === selectedAttention) ?? ATTENTION_ITEMS[0];
    setActiveStage(item.stage);
    setActiveView("work");
    setWorkTab("task");
    setMode(item.blocking ? "blocking" : "ready");
  }

  return (
    <div className="min-h-screen bg-[var(--surface-canvas)] text-[var(--text-primary)]">
      <a className="fixed left-3 top-3 z-[100] -translate-y-24 rounded-lg bg-slate-950 px-4 py-3 text-[12px] font-black text-white focus:translate-y-0" href="#main-content">Saltar al contenido</a>
      {mobileMenu ? <div className="fixed inset-0 z-[80] lg:hidden"><button aria-label="Cerrar menu" className="absolute inset-0 bg-slate-950/55" onClick={() => setMobileMenu(false)} type="button" /><div className="relative h-full w-[280px]"><GlobalSidebar mobile onClose={() => setMobileMenu(false)} /></div></div> : null}
      <div className="mx-auto grid min-h-screen max-w-[1920px] border-x border-slate-200 bg-white shadow-[0_0_70px_rgba(15,23,42,.08)] lg:grid-cols-[224px_minmax(0,1fr)]">
        <GlobalSidebar />
        <div className="min-w-0">
          <Topbar attentionCount={ATTENTION_ITEMS.length} onAttention={() => setActiveView("attention")} onMenu={() => setMobileMenu(true)} />
          <ProjectHeader activeView={activeView} attentionCount={ATTENTION_ITEMS.length} onSelectView={setActiveView} />
          <MobileStageSelector activeStage={activeStage} onSelect={selectStage} />
          <div className="grid min-h-[900px] xl:grid-cols-[238px_minmax(0,1fr)] 2xl:grid-cols-[238px_minmax(0,1fr)_300px]">
            <StageRail access={access} activeStage={activeStage} onSelect={selectStage} />
            <main className="min-w-0 bg-[#f7f7fb] p-4 lg:p-6" id="main-content">
              {activeView === "work" ? <div className="space-y-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><Badge tone="violet">{stage.product} / Etapa {STAGES.findIndex((item) => item.key === stage.key) + 1}</Badge><Badge tone={mode === "blocking" ? "red" : mode === "processing" ? "blue" : mode === "review" ? "green" : "amber"}>{mode === "blocking" ? "Bloqueada" : mode === "processing" ? "Procesando" : mode === "review" ? "Lista para revision" : "En preparacion"}</Badge></div><h2 className="mt-3 text-[24px] font-black tracking-[-0.035em] text-slate-950">{stage.label}: {stage.subtitle}</h2><p className="mt-1.5 max-w-3xl text-[11px] leading-5 text-slate-600">{stage.objective}</p></div><div className="rounded-xl border border-slate-200 bg-white px-4 py-3 lg:max-w-[280px]"><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Criterio para avanzar</p><p className="mt-1.5 text-[10px] font-semibold leading-4 text-slate-700">Salida revisada, blockers resueltos y aprobacion versionada.</p></div></div><PrimaryAction mode={mode} onAttention={() => setAttentionDrawer(true)} onMode={setMode} stage={stage} /><Workbench activeTab={workTab} onAttention={() => setAttentionDrawer(true)} onTab={setWorkTab} stage={stage} /><div className="sticky bottom-3 z-20 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-[0_16px_40px_rgba(15,23,42,.14)] backdrop-blur sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-black text-slate-800">Siguiente: {stage.nextAction}</p><p className="mt-0.5 text-[9px] text-slate-500">Los cambios se guardan como borrador y mantienen trazabilidad.</p></div><div className="flex gap-2"><Button>Guardar borrador</Button><Button disabled={mode === "blocking" || mode === "processing"} icon={ArrowRight} onClick={() => setMode("review")} variant="primary">Continuar</Button></div></div></div> : null}
              {activeView === "attention" ? <AttentionHub onOpenItem={openAttentionItem} selectedId={selectedAttention} setSelectedId={setSelectedAttention} /> : null}
              {activeView === "diagrams" ? <DiagramHub access={access} /> : null}
              {activeView === "blueprint" ? <ProductOverview access={access} onAccess={setAccess} product="blueprint" /> : null}
              {activeView === "acp" ? <ProductOverview access={access} onAccess={setAccess} product="acp" /> : null}
              {activeView === "artifacts" ? <ArtifactHub /> : null}
              {activeView === "activity" ? <ActivityHub /> : null}
            </main>
            {activeView === "work" ? <ContextRail activeStage={activeStage} onAttention={() => setAttentionDrawer(true)} onDiagrams={() => setActiveView("diagrams")} /> : <aside className="hidden border-l border-slate-200 bg-[#fbfbfd] p-4 2xl:block"><Panel className="p-4"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Contexto preservado</p><p className="mt-2 text-[10px] leading-5 text-slate-600">Sigues en {stage.label}. Al volver a Trabajo recuperaras la tarea y el estado seleccionados.</p><Button className="mt-4 w-full" onClick={() => setActiveView("work")}>Volver a la etapa</Button></Panel></aside>}
          </div>
        </div>
      </div>
      <button aria-label="Abrir Segmento de Atencion" className="fixed bottom-20 right-4 z-40 flex h-12 items-center gap-2 rounded-full bg-rose-600 px-4 text-[11px] font-black text-white shadow-xl 2xl:hidden" onClick={() => setAttentionDrawer(true)} type="button"><PanelRightOpen className="h-4 w-4" />Atencion <span className="rounded-full bg-white px-1.5 py-0.5 text-[9px] text-rose-700">{ATTENTION_ITEMS.length}</span></button>
      {attentionDrawer ? <div className="fixed inset-0 z-[90]"><button aria-label="Cerrar Segmento de Atencion" className="absolute inset-0 bg-slate-950/50" onClick={() => setAttentionDrawer(false)} type="button" /><aside aria-label="Segmento de Atencion" className="absolute right-0 top-0 h-full w-full max-w-[470px] overflow-y-auto bg-[#f7f7fb] p-4 shadow-2xl scrollbar-subtle"><div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-rose-600">Segmento transversal</p><h2 className="mt-1 text-[20px] font-black text-slate-950">Requiere tu atencion</h2></div><button aria-label="Cerrar" className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white" onClick={() => setAttentionDrawer(false)} type="button"><X className="h-5 w-5" /></button></div><p className="mt-2 text-[10px] leading-5 text-slate-500">Las acciones se muestran aqui y tambien en la etapa que las origino.</p><div className="mt-4 space-y-3">{ATTENTION_ITEMS.map((item) => <button className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm" key={item.id} onClick={() => { setSelectedAttention(item.id); setAttentionDrawer(false); setActiveView("attention"); }} type="button"><div className="flex items-center justify-between gap-2"><Badge tone={item.tone}>{item.id} / {item.kind}</Badge>{item.blocking ? <span className="text-[9px] font-black uppercase text-rose-600">Bloquea</span> : null}</div><p className="mt-3 text-[12px] font-black leading-5 text-slate-900">{item.title}</p><p className="mt-2 text-[9px] text-slate-500">{STAGES.find((candidate) => candidate.key === item.stage)?.label} / {item.owner}</p></button>)}</div><Button className="mt-4 w-full" onClick={() => { setAttentionDrawer(false); setActiveView("attention"); }} variant="primary">Abrir bandeja completa</Button></aside></div> : null}
      <PrototypeControls access={access} mode={mode} onAccess={setAccess} onMode={setMode} />
    </div>
  );
}
