"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Boxes,
  Check,
  ChevronDown,
  Clock3,
  Columns3,
  Database,
  Download,
  FileCode2,
  Filter,
  GitCompareArrows,
  GitFork,
  Grid2X2,
  Layers3,
  List,
  LoaderCircle,
  LockKeyhole,
  Maximize2,
  Network,
  PanelRightClose,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Workflow,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AccessState =
  | "available"
  | "preview"
  | "locked_blueprint"
  | "locked_acp"
  | "locked_enterprise"
  | "stage_locked";
type GenerationState = "available" | "generating" | "error" | "pending" | "updating";
type Complexity = "Baja" | "Media" | "Alta";
type ViewMode = "viewer" | "catalog";
type CatalogLayout = "grid" | "list";

type DiagramItem = {
  access: AccessState;
  benefit: string;
  category: string;
  complexity: Complexity;
  generation: GenerationState;
  id: string;
  plan: "Todos" | "Blueprint Pro" | "ACP" | "Enterprise";
  progress?: number;
  stage: string;
  title: string;
  type: string;
  updated: string;
  version: string;
};

const DIAGRAMS: DiagramItem[] = [
  {
    access: "available",
    benefit: "Explica los límites, capas y responsabilidades de la solución antes de construirla.",
    category: "Arquitectura",
    complexity: "Media",
    generation: "available",
    id: "solution-architecture",
    plan: "Todos",
    stage: "Diseñar",
    title: "Arquitectura de solución",
    type: "C4 / Solution",
    updated: "Hoy, 10:42",
    version: "v4",
  },
  {
    access: "available",
    benefit: "Sitúa la plataforma, sus usuarios y sistemas externos en una vista ejecutiva.",
    category: "Arquitectura",
    complexity: "Baja",
    generation: "available",
    id: "c4-context",
    plan: "Blueprint Pro",
    stage: "Diseñar",
    title: "C4 · Context",
    type: "C4 Context",
    updated: "Hoy, 09:18",
    version: "v3",
  },
  {
    access: "available",
    benefit: "Descompone aplicaciones, servicios y almacenes de datos con sus responsabilidades.",
    category: "Arquitectura",
    complexity: "Media",
    generation: "updating",
    id: "c4-container",
    plan: "Blueprint Pro",
    stage: "Diseñar",
    title: "C4 · Container",
    type: "C4 Container",
    updated: "Actualizando",
    version: "v5",
  },
  {
    access: "locked_acp",
    benefit: "Detalla componentes implementables, contratos y dependencias técnicas.",
    category: "Arquitectura",
    complexity: "Alta",
    generation: "available",
    id: "component-architecture",
    plan: "ACP",
    stage: "Validar",
    title: "Arquitectura de componentes",
    type: "UML Component",
    updated: "Ayer, 16:04",
    version: "v2",
  },
  {
    access: "locked_enterprise",
    benefit: "Representa nodos, zonas, redes y restricciones físicas del entorno objetivo.",
    category: "Infraestructura",
    complexity: "Alta",
    generation: "available",
    id: "physical-architecture",
    plan: "Enterprise",
    stage: "Package",
    title: "Arquitectura física",
    type: "Deployment",
    updated: "1 ago, 14:22",
    version: "v1",
  },
  {
    access: "available",
    benefit: "Muestra APIs, eventos, adaptadores y fronteras con sistemas externos.",
    category: "Integración",
    complexity: "Alta",
    generation: "generating",
    id: "integration-architecture",
    plan: "Blueprint Pro",
    progress: 68,
    stage: "Herramientas",
    title: "Arquitectura de integración",
    type: "Integration Map",
    updated: "Generando ahora",
    version: "v3",
  },
  {
    access: "available",
    benefit: "Relaciona entidades, cardinalidades y reglas estructurales del dominio.",
    category: "Datos",
    complexity: "Media",
    generation: "available",
    id: "entity-relationship",
    plan: "Blueprint Pro",
    stage: "Definir",
    title: "Modelo entidad-relación",
    type: "ERD",
    updated: "31 jul, 11:06",
    version: "v6",
  },
  {
    access: "stage_locked",
    benefit: "Expone actividades, responsables, decisiones y excepciones del proceso futuro.",
    category: "Procesos",
    complexity: "Media",
    generation: "pending",
    id: "business-process",
    plan: "Blueprint Pro",
    stage: "Validar",
    title: "Proceso de atención",
    type: "BPMN 2.0",
    updated: "Pendiente de Validar",
    version: "—",
  },
  {
    access: "preview",
    benefit: "Aclara el orden de llamadas, respuestas y errores entre participantes críticos.",
    category: "Interacción",
    complexity: "Media",
    generation: "available",
    id: "api-sequence",
    plan: "Blueprint Pro",
    stage: "Herramientas",
    title: "Secuencia de integración API",
    type: "UML Sequence",
    updated: "30 jul, 17:28",
    version: "v2",
  },
  {
    access: "available",
    benefit: "Define estados, transiciones, guardas y eventos del ciclo de vida del agente.",
    category: "Comportamiento",
    complexity: "Alta",
    generation: "error",
    id: "state-machine",
    plan: "Blueprint Pro",
    stage: "Memoria",
    title: "Máquina de estados",
    type: "UML State",
    updated: "Error hace 12 min",
    version: "v4",
  },
  {
    access: "locked_blueprint",
    benefit: "Conecta pantallas, decisiones y rutas principales de la experiencia final.",
    category: "Experiencia",
    complexity: "Baja",
    generation: "available",
    id: "ux-navigation",
    plan: "Blueprint Pro",
    stage: "Diseñar",
    title: "Flujo de navegación UX",
    type: "UX Flow",
    updated: "29 jul, 08:54",
    version: "v1",
  },
  {
    access: "preview",
    benefit: "Relaciona capacidades de negocio con agentes, herramientas y resultados esperados.",
    category: "Negocio",
    complexity: "Media",
    generation: "available",
    id: "capability-map",
    plan: "Todos",
    stage: "Definir",
    title: "Mapa de capacidades",
    type: "Capability Map",
    updated: "28 jul, 15:37",
    version: "v3",
  },
  {
    access: "locked_acp",
    benefit: "Describe artefactos desplegables, entornos, nodos y dependencias operativas.",
    category: "Infraestructura",
    complexity: "Alta",
    generation: "pending",
    id: "deployment",
    plan: "ACP",
    stage: "Package",
    title: "Diagrama de despliegue",
    type: "UML Deployment",
    updated: "Pendiente de Package",
    version: "—",
  },
  {
    access: "locked_enterprise",
    benefit: "Traduce el modelo lógico a tablas, claves, índices y particiones de implementación.",
    category: "Datos",
    complexity: "Alta",
    generation: "available",
    id: "physical-data-model",
    plan: "Enterprise",
    stage: "Package",
    title: "Modelo de datos físico",
    type: "Physical Data Model",
    updated: "25 jul, 13:09",
    version: "v2",
  },
  {
    access: "available",
    benefit: "Hace visibles las etapas, puntos de fricción y oportunidades del usuario objetivo.",
    category: "Experiencia",
    complexity: "Baja",
    generation: "available",
    id: "user-journey",
    plan: "Blueprint Pro",
    stage: "Descubrir",
    title: "Journey del usuario",
    type: "Journey Map",
    updated: "24 jul, 09:46",
    version: "v2",
  },
];

const CATEGORIES = ["Todas", ...Array.from(new Set(DIAGRAMS.map((item) => item.category)))];
const STAGES = ["Todas", "Descubrir", "Definir", "Diseñar", "Herramientas", "Memoria", "Validar", "Package"];
const TYPES = ["Todos", ...Array.from(new Set(DIAGRAMS.map((item) => item.type)))];

const ACCESS_LABELS: Record<AccessState, string> = {
  available: "Disponible",
  locked_acp: "Requiere ACP",
  locked_blueprint: "Requiere Blueprint Pro",
  locked_enterprise: "Enterprise",
  preview: "Vista previa",
  stage_locked: "Bloqueado por etapa",
};

const GENERATION_LABELS: Record<GenerationState, string> = {
  available: "Generado",
  error: "Error",
  generating: "Generando",
  pending: "Pendiente",
  updating: "En actualización",
};

function StatusBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: "blue" | "green" | "neutral" | "red" | "yellow" }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em]",
        tone === "blue" && "bg-[#dce7ff] text-[#2448bd]",
        tone === "green" && "bg-[#e1f5e7] text-[#24633b]",
        tone === "yellow" && "bg-[#fff2c7] text-[#8a5a00]",
        tone === "red" && "bg-[#fee8e7] text-[#a52b26]",
        tone === "neutral" && "bg-[#eef1f6] text-[#566176]",
      )}
    >
      {children}
    </span>
  );
}

function accessTone(access: AccessState): "blue" | "green" | "neutral" | "yellow" {
  if (access === "available") return "green";
  if (access === "preview") return "blue";
  if (access === "stage_locked") return "yellow";
  return "neutral";
}

function generationTone(state: GenerationState): "blue" | "green" | "neutral" | "red" | "yellow" {
  if (state === "available") return "green";
  if (state === "error") return "red";
  if (state === "generating" || state === "updating") return "blue";
  return "yellow";
}

function CompactIconButton({ disabled, icon, label, onClick }: { disabled?: boolean; icon: ReactNode; label: string; onClick?: () => void }) {
  return (
    <button
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-[#cfd6e4] bg-white text-[#3f4b61] transition hover:border-[#2448bd] hover:text-[#2448bd] disabled:cursor-not-allowed disabled:opacity-40"
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      {icon}
    </button>
  );
}

function GlobalRail() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[64px] flex-col items-center border-r border-white/10 bg-[#101827] py-3 text-white lg:flex">
      <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-white text-[#2448bd]">
        <Sparkles className="h-4 w-4" />
      </div>
      <nav aria-label="Navegación principal" className="mt-8 flex flex-1 flex-col gap-2">
        {[Layers3, Boxes, FileCode2, ShieldCheck].map((Icon, index) => (
          <button
            aria-label={["Inicio", "Proyectos", "Biblioteca", "Gobierno"][index]}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-[8px] text-white/65 transition hover:bg-white/10 hover:text-white",
              index === 1 && "bg-white/12 text-white",
            )}
            key={index}
            type="button"
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </nav>
      <button aria-label="Notificaciones" className="flex h-10 w-10 items-center justify-center rounded-[8px] text-white/65" type="button">
        <Bell className="h-4 w-4" />
      </button>
      <div className="mt-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#294bbb] text-[11px] font-black">LB</div>
    </aside>
  );
}

function ProductChrome() {
  const items = ["Trabajo LEAN", "Blueprint", "Blueprint Pro", "Diagramas", "ACP", "Artefactos", "Atención", "Actividad"];
  return (
    <>
      <header className="border-b border-[#d9deea] bg-white px-4 py-3 lg:px-6">
        <div className="mx-auto flex max-w-[1760px] items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <button aria-label="Volver al proyecto" className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-[#d3d9e6] text-[#4a566d]" type="button">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <StatusBadge tone="yellow">Requiere revisión</StatusBadge>
                <StatusBadge tone="blue">Blueprint Pro</StatusBadge>
              </div>
              <p className="mt-1 truncate text-[17px] font-black text-[#121827]">Asistente corporativo de soporte</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <button className="h-9 rounded-[8px] border border-[#d3d9e6] bg-white px-3 text-[12px] font-bold text-[#48546a]" type="button">Recargar</button>
            <button className="flex h-9 items-center gap-2 rounded-[8px] border border-[#d3d9e6] bg-white px-3 text-[12px] font-bold text-[#48546a]" type="button">
              Workspace <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>
      <nav aria-label="Productos del proyecto" className="overflow-x-auto border-b border-[#d9deea] bg-white px-4 py-2 lg:px-6">
        <div className="mx-auto flex w-max max-w-[1760px] gap-2 lg:w-auto">
          {items.map((item) => (
            <button
              className={cn(
                "h-9 rounded-[8px] border px-3 text-[12px] font-black transition",
                item === "Diagramas"
                  ? "border-[#294bbb] bg-[#294bbb] text-white"
                  : "border-[#d3d9e6] bg-white text-[#4d586d] hover:border-[#294bbb] hover:text-[#294bbb]",
              )}
              key={item}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}

function DiagramGlyph({ item }: { item: DiagramItem }) {
  const Icon = item.category === "Datos" ? Database : item.category === "Procesos" ? Workflow : item.category === "Interacción" ? GitFork : Network;
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-[#d9deea] bg-[#f4f6fa] text-[#294bbb]">
      <Icon className="h-4 w-4" />
    </span>
  );
}

function DiagramRow({ active, item, onSelect }: { active: boolean; item: DiagramItem; onSelect: () => void }) {
  return (
    <button
      className={cn(
        "w-full min-w-[280px] rounded-[10px] border p-3 text-left transition xl:min-w-0",
        active ? "border-[#294bbb] bg-[#eef3ff] shadow-[0_8px_20px_rgba(36,72,189,0.08)]" : "border-[#d9deea] bg-white hover:border-[#9caddb]",
      )}
      onClick={onSelect}
      type="button"
    >
      <div className="flex items-start gap-3">
        <DiagramGlyph item={item} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[13px] font-black leading-5 text-[#151b2a]">{item.title}</p>
            {item.access.startsWith("locked") || item.access === "stage_locked" ? <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#59657a]" /> : null}
          </div>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#59657a]">{item.type} · {item.stage}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <StatusBadge tone={accessTone(item.access)}>{ACCESS_LABELS[item.access]}</StatusBadge>
            {item.generation !== "available" ? <StatusBadge tone={generationTone(item.generation)}>{GENERATION_LABELS[item.generation]}</StatusBadge> : null}
          </div>
        </div>
      </div>
    </button>
  );
}

function ArchitecturePreview({ muted = false, panoramic = false }: { muted?: boolean; panoramic?: boolean }) {
  return (
    <svg
      aria-label="Arquitectura de solución"
      className={cn("w-full", panoramic ? "h-auto min-w-[760px]" : "h-full min-h-[360px]", muted && "opacity-25 blur-[2px]")}
      preserveAspectRatio="xMinYMin meet"
      role="img"
      viewBox="0 0 900 520"
    >
      <defs>
        <marker id="arrowhead-final" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="4">
          <path d="M0,0 L8,4 L0,8 Z" fill="#7f8ca4" />
        </marker>
      </defs>
      <rect fill="#f5f7fb" height="472" rx="12" stroke="#d9deea" width="852" x="24" y="24" />
      <text fill="#707b90" fontSize="12" fontWeight="700" letterSpacing="1.5" x="48" y="58">CANALES</text>
      <rect fill="#ffffff" height="62" rx="8" stroke="#bfc8da" width="158" x="48" y="78" />
      <text fill="#182033" fontSize="14" fontWeight="700" textAnchor="middle" x="127" y="115">Portal de usuario</text>
      <rect fill="#ffffff" height="62" rx="8" stroke="#bfc8da" width="158" x="48" y="160" />
      <text fill="#182033" fontSize="14" fontWeight="700" textAnchor="middle" x="127" y="197">Canal corporativo</text>
      <path d="M206 109 H284" fill="none" markerEnd="url(#arrowhead-final)" stroke="#7f8ca4" strokeWidth="2" />
      <path d="M206 191 H250 Q268 191 268 173 V127 Q268 109 284 109" fill="none" markerEnd="url(#arrowhead-final)" stroke="#7f8ca4" strokeWidth="2" />
      <rect fill="#294bbb" height="104" rx="10" width="190" x="292" y="70" />
      <text fill="#ffffff" fontSize="16" fontWeight="800" textAnchor="middle" x="387" y="112">API + Orquestador</text>
      <text fill="#dce7ff" fontSize="12" textAnchor="middle" x="387" y="137">políticas · routing · estado</text>
      <path d="M482 122 H552" fill="none" markerEnd="url(#arrowhead-final)" stroke="#7f8ca4" strokeWidth="2" />
      <rect fill="#ffffff" height="82" rx="8" stroke="#86a0e5" strokeWidth="2" width="268" x="560" y="80" />
      <text fill="#182033" fontSize="15" fontWeight="800" textAnchor="middle" x="694" y="113">Agentes especializados</text>
      <text fill="#66738a" fontSize="12" textAnchor="middle" x="694" y="137">planner · executor · evaluator</text>
      <text fill="#707b90" fontSize="12" fontWeight="700" letterSpacing="1.5" x="292" y="228">CAPACIDADES TRANSVERSALES</text>
      {[
        [292, "Herramientas", "contratos + permisos"],
        [480, "Memoria + RAG", "recuperación trazable"],
        [668, "Gobierno", "aprobaciones + riesgo"],
      ].map(([x, title, detail]) => (
        <g key={String(title)}>
          <rect fill="#ffffff" height="88" rx="8" stroke="#c7cfdd" width="160" x={Number(x)} y="248" />
          <text fill="#182033" fontSize="14" fontWeight="800" textAnchor="middle" x={Number(x) + 80} y="284">{title}</text>
          <text fill="#66738a" fontSize="11" textAnchor="middle" x={Number(x) + 80} y="307">{detail}</text>
        </g>
      ))}
      <path d="M387 174 V214 H372 V248" fill="none" markerEnd="url(#arrowhead-final)" stroke="#7f8ca4" strokeWidth="2" />
      <path d="M387 214 H560 V248" fill="none" markerEnd="url(#arrowhead-final)" stroke="#7f8ca4" strokeWidth="2" />
      <path d="M694 162 V248" fill="none" markerEnd="url(#arrowhead-final)" stroke="#7f8ca4" strokeWidth="2" />
      <text fill="#707b90" fontSize="12" fontWeight="700" letterSpacing="1.5" x="292" y="392">PLATAFORMA</text>
      <rect fill="#e9eef9" height="70" rx="8" stroke="#c1cadb" width="536" x="292" y="410" />
      <text fill="#182033" fontSize="14" fontWeight="800" textAnchor="middle" x="560" y="440">Runtime · Datos · Observabilidad</text>
      <text fill="#66738a" fontSize="11" textAnchor="middle" x="560" y="462">servicios administrados con trazabilidad de extremo a extremo</text>
      <path d="M372 336 V410" fill="none" markerEnd="url(#arrowhead-final)" stroke="#7f8ca4" strokeWidth="2" />
      <path d="M560 336 V410" fill="none" markerEnd="url(#arrowhead-final)" stroke="#7f8ca4" strokeWidth="2" />
      <path d="M748 336 V410" fill="none" markerEnd="url(#arrowhead-final)" stroke="#7f8ca4" strokeWidth="2" />
    </svg>
  );
}

function LockedPreview({ item, onAction }: { item: DiagramItem; onAction: (message: string) => void }) {
  const plan = item.access === "locked_acp" ? "ACP" : item.access === "locked_enterprise" ? "Enterprise" : item.access === "stage_locked" ? item.stage : "Blueprint Pro";
  const title = item.access === "stage_locked" ? `Completa la etapa ${item.stage}` : `Disponible con ${plan}`;
  const cta = item.access === "stage_locked" ? `Ir a ${item.stage}` : `Conocer ${plan}`;
  return (
    <div className="relative min-h-[430px] overflow-hidden rounded-[10px] border border-[#d9deea] bg-[#f6f8fb]">
      <div className="absolute inset-0"><ArchitecturePreview muted /></div>
      <div className="absolute inset-0 bg-white/58" />
      <div className="relative flex min-h-[430px] items-center justify-center p-6">
        <div className="w-full max-w-[470px] rounded-[12px] border border-[#cdd5e4] bg-white p-6 text-center shadow-[0_18px_50px_rgba(18,32,59,0.12)]">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#eef1f6] text-[#4b586e]"><LockKeyhole className="h-5 w-5" /></span>
          <StatusBadge tone="yellow">{ACCESS_LABELS[item.access]}</StatusBadge>
          <h3 className="mt-3 text-[20px] font-black text-[#151b2a]">{title}</h3>
          <p className="mt-2 text-[13px] leading-6 text-[#657187]">{item.benefit}</p>
          <p className="mt-2 text-[12px] leading-5 text-[#59657a]">
            {item.access === "stage_locked" ? "La plataforma necesita información aprobada de esa etapa para generar una vista confiable." : `Tu plan actual permite conocer este activo, pero el contenido completo requiere ${plan}.`}
          </p>
          <button className="mt-5 h-9 rounded-[8px] bg-[#294bbb] px-4 text-[12px] font-black text-white" onClick={() => onAction(`${cta}: flujo simulado en el mockup.`)} type="button">{cta}</button>
        </div>
      </div>
    </div>
  );
}

function GenerationPreview({ item, onAction }: { item: DiagramItem; onAction: (message: string) => void }) {
  if (item.generation === "error") {
    return (
      <div className="flex min-h-[430px] items-center justify-center rounded-[10px] border border-[#efc7c4] bg-[#fffafa] p-6 text-center">
        <div className="max-w-[480px]">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#fee8e7] text-[#a52b26]"><AlertTriangle className="h-5 w-5" /></span>
          <h3 className="mt-4 text-[20px] font-black">No fue posible generar esta versión</h3>
          <p className="mt-2 text-[13px] leading-6 text-[#6a7487]">La fuente cambió durante la generación. La versión anterior permanece disponible y no se perdió información.</p>
          <div className="mt-5 flex justify-center gap-2">
            <button className="h-9 rounded-[8px] border border-[#cfd6e4] bg-white px-4 text-[12px] font-black" onClick={() => onAction("Abriendo la versión anterior.")} type="button">Ver versión anterior</button>
            <button className="h-9 rounded-[8px] bg-[#294bbb] px-4 text-[12px] font-black text-white" onClick={() => onAction("Regeneración iniciada en el mockup.")} type="button">Reintentar</button>
          </div>
        </div>
      </div>
    );
  }

  if (item.generation === "pending") {
    return (
      <div className="flex min-h-[430px] items-center justify-center rounded-[10px] border border-dashed border-[#cbd3e1] bg-[#f9fafc] p-6 text-center">
        <div className="max-w-[480px]">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#fff2c7] text-[#8a5a00]"><Clock3 className="h-5 w-5" /></span>
          <h3 className="mt-4 text-[20px] font-black">Diagrama pendiente</h3>
          <p className="mt-2 text-[13px] leading-6 text-[#6a7487]">Se generará cuando la etapa {item.stage} tenga información suficiente y aprobada.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[430px] items-center justify-center rounded-[10px] border border-[#cbd5ec] bg-[#f4f7ff] p-6 text-center">
      <div className="w-full max-w-[520px]">
        <LoaderCircle className="mx-auto h-7 w-7 animate-spin text-[#294bbb]" />
        <h3 className="mt-4 text-[20px] font-black">Generando arquitectura de integración</h3>
        <p className="mt-2 text-[13px] leading-6 text-[#68748a]">Validando APIs, eventos y contratos contra los artefactos aprobados.</p>
        <div className="mx-auto mt-5 h-2 max-w-[380px] overflow-hidden rounded-full bg-[#dce3f1]"><div className="h-full bg-[#294bbb]" style={{ width: `${item.progress ?? 45}%` }} /></div>
        <p className="mt-2 text-[11px] font-bold text-[#68748a]">{item.progress ?? 45}% · puedes seguir explorando otros diagramas</p>
      </div>
    </div>
  );
}

function DiagramCanvas({ item, onAction }: { item: DiagramItem; onAction: (message: string) => void }) {
  if (item.access.startsWith("locked") || item.access === "stage_locked") {
    return <LockedPreview item={item} onAction={onAction} />;
  }
  if (item.generation === "generating" || item.generation === "error" || item.generation === "pending") {
    return <GenerationPreview item={item} onAction={onAction} />;
  }
  return (
    <div className="relative min-h-[430px] overflow-x-auto rounded-[10px] border border-[#d9deea] bg-white p-2">
      {item.generation === "updating" ? (
        <div className="absolute left-3 right-3 top-3 z-10 flex items-center justify-between rounded-[8px] border border-[#bed0ff] bg-[#eef3ff] px-3 py-2 text-[11px] font-bold text-[#294bbb]">
          <span className="flex items-center gap-2"><LoaderCircle className="h-3.5 w-3.5 animate-spin" />Generando una nueva versión; sigues viendo {item.version}.</span>
          <span>82%</span>
        </div>
      ) : null}
      <ArchitecturePreview panoramic />
      {item.access === "preview" ? <div className="pointer-events-none absolute inset-0 flex rotate-[-18deg] items-center justify-center text-[44px] font-black uppercase tracking-[0.22em] text-[#294bbb]/10">Vista previa</div> : null}
    </div>
  );
}

function Inspector({ item, showVersions }: { item: DiagramItem; showVersions: boolean }) {
  if (showVersions) {
    return (
      <aside className="rounded-[12px] border border-[#d9deea] bg-white p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#59657a]">Historial</p>
        <h3 className="mt-1 text-[16px] font-black">Versiones disponibles</h3>
        <div className="mt-4 space-y-2">
          {["v4 · Actual", "v3 · 29 jul", "v2 · 24 jul", "v1 · 19 jul"].map((version, index) => (
            <label className="flex cursor-pointer items-center gap-3 rounded-[8px] border border-[#d9deea] p-3" key={version}>
              <input defaultChecked={index < 2} disabled={index > 1} name={`version-${index}`} type="checkbox" />
              <span className="text-[12px] font-bold">{version}</span>
            </label>
          ))}
        </div>
        <button className="mt-4 h-9 w-full rounded-[8px] bg-[#294bbb] text-[12px] font-black text-white" type="button">Comparar 2 versiones</button>
      </aside>
    );
  }
  return (
    <aside className="space-y-3">
      <section className="rounded-[12px] border border-[#d9deea] bg-white p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#59657a]">Sobre este diagrama</p>
        <p className="mt-3 text-[13px] leading-6 text-[#58657b]">{item.benefit}</p>
        <dl className="mt-4 space-y-3">
          {[
            ["Categoría", item.category],
            ["Tipo", item.type],
            ["Complejidad", item.complexity],
            ["Etapa origen", item.stage],
            ["Plan requerido", item.plan],
            ["Última actualización", item.updated],
          ].map(([label, value]) => (
            <div className="flex items-start justify-between gap-3 border-b border-[#edf0f5] pb-2 last:border-0 last:pb-0" key={label}>
              <dt className="text-[11px] text-[#59657a]">{label}</dt>
              <dd className="text-right text-[11px] font-black text-[#273247]">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="rounded-[12px] border border-[#d9deea] bg-white p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#59657a]">Trazabilidad</p>
        <p className="mt-2 text-[12px] font-black">9 artefactos fuente</p>
        <p className="mt-1 text-[11px] leading-5 text-[#59657a]">Discovery aprobado, arquitectura, contratos de herramientas y decisiones vigentes.</p>
        <div className="mt-3 flex items-center gap-2 text-[11px] font-bold text-[#2d6842]"><Check className="h-3.5 w-3.5" />Fuentes consistentes</div>
      </section>
    </aside>
  );
}

function CatalogCard({ item, onOpen }: { item: DiagramItem; onOpen: () => void }) {
  return (
    <article className="overflow-hidden rounded-[12px] border border-[#d9deea] bg-white transition hover:border-[#9caddb] hover:shadow-[0_12px_32px_rgba(18,32,59,0.08)]">
      <button className="block w-full text-left" onClick={onOpen} type="button">
        <div className="relative h-[150px] overflow-hidden border-b border-[#e0e4ed] bg-[#f6f8fb] p-3">
          <ArchitecturePreview muted={item.access.startsWith("locked") || item.access === "stage_locked"} />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            <StatusBadge tone={accessTone(item.access)}>{ACCESS_LABELS[item.access]}</StatusBadge>
            {item.generation !== "available" ? <StatusBadge tone={generationTone(item.generation)}>{GENERATION_LABELS[item.generation]}</StatusBadge> : null}
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-start gap-3">
            <DiagramGlyph item={item} />
            <div className="min-w-0">
              <h3 className="text-[14px] font-black text-[#151b2a]">{item.title}</h3>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#59657a]">{item.type} · {item.stage}</p>
            </div>
          </div>
          <p className="mt-3 line-clamp-2 text-[12px] leading-5 text-[#617087]">{item.benefit}</p>
          <div className="mt-3 flex items-center justify-between text-[11px] text-[#59657a]"><span>{item.plan}</span><span>{item.updated}</span></div>
        </div>
      </button>
    </article>
  );
}

export function DiagramViewerFinalMockup() {
  const [accessFilter, setAccessFilter] = useState("Todos");
  const [catalogLayout, setCatalogLayout] = useState<CatalogLayout>("grid");
  const [category, setCategory] = useState("Todas");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(DIAGRAMS[0].id);
  const [showVersions, setShowVersions] = useState(false);
  const [stage, setStage] = useState("Todas");
  const [toast, setToast] = useState("");
  const [type, setType] = useState("Todos");
  const [viewMode, setViewMode] = useState<ViewMode>("viewer");

  const selected = DIAGRAMS.find((item) => item.id === selectedId) ?? DIAGRAMS[0];
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("es");
    return DIAGRAMS.filter((item) => {
      const matchesText = !needle || `${item.title} ${item.type} ${item.category} ${item.benefit}`.toLocaleLowerCase("es").includes(needle);
      const matchesCategory = category === "Todas" || item.category === category;
      const matchesStage = stage === "Todas" || item.stage === stage;
      const matchesType = type === "Todos" || item.type === type;
      const matchesAccess =
        accessFilter === "Todos" ||
        (accessFilter === "Disponibles" && (item.access === "available" || item.access === "preview")) ||
        (accessFilter === "Bloqueados" && (item.access.startsWith("locked") || item.access === "stage_locked")) ||
        (accessFilter === "En proceso" && ["generating", "pending", "updating"].includes(item.generation)) ||
        (accessFilter === "Con error" && item.generation === "error");
      return matchesText && matchesCategory && matchesStage && matchesType && matchesAccess;
    });
  }, [accessFilter, category, query, stage, type]);

  const stats = {
    available: DIAGRAMS.filter((item) => item.access === "available" || item.access === "preview").length,
    blocked: DIAGRAMS.filter((item) => item.access.startsWith("locked") || item.access === "stage_locked").length,
    processing: DIAGRAMS.filter((item) => ["generating", "pending", "updating"].includes(item.generation)).length,
    total: DIAGRAMS.length,
  };

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }

  function openItem(item: DiagramItem) {
    setSelectedId(item.id);
    setViewMode("viewer");
    setShowVersions(false);
  }

  const hasFilters = category !== "Todas" || stage !== "Todas" || type !== "Todos" || accessFilter !== "Todos" || Boolean(query);
  const readable = selected.access === "available" || selected.access === "preview";
  const actionable = readable && !["generating", "error", "pending"].includes(selected.generation);

  return (
    <div className="min-h-screen bg-[#f3f5f9] text-[#151b2a] lg:pl-[64px]">
      <GlobalRail />
      <ProductChrome />

      <main className="mx-auto max-w-[1760px] p-3 sm:p-4 lg:p-5">
        <section className="rounded-[12px] border border-[#d7dce8] bg-white p-4 shadow-[0_8px_24px_rgba(18,32,59,0.05)]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone="blue">Centro de diagramas</StatusBadge>
                <span className="text-[11px] font-bold text-[#59657a]">Actualizado hace 4 min</span>
              </div>
              <h1 className="mt-2 text-[25px] font-black leading-tight text-[#111827]">Explora la solución desde todos sus ángulos</h1>
              <p className="mt-1 max-w-[860px] text-[13px] leading-6 text-[#5f6b80]">Encuentra, revisa y compara cada diagrama generado. Los bloqueos explican el valor y el requisito exacto para acceder.</p>
            </div>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {[
                ["Total", stats.total, "Todos"],
                ["Disponibles", stats.available, "Disponibles"],
                ["Bloqueados", stats.blocked, "Bloqueados"],
                ["En proceso", stats.processing, "En proceso"],
              ].map(([label, value, filter]) => (
                <button
                  className={cn("min-w-0 rounded-[9px] border px-2 py-2.5 text-left sm:min-w-[112px] sm:px-3", accessFilter === filter ? "border-[#294bbb] bg-[#eef3ff]" : "border-[#d9deea] bg-[#fafbfc]")}
                  key={String(label)}
                  onClick={() => setAccessFilter(String(filter))}
                  type="button"
                >
                  <span className="block text-[10px] font-black uppercase tracking-[0.08em] text-[#59657a]">{label}</span>
                  <span className="mt-1 block text-[20px] font-black text-[#182033]">{value}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-3 rounded-[12px] border border-[#d7dce8] bg-white p-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-[8px] border border-[#cfd6e4] bg-white px-3 xl:max-w-[430px]">
              <Search className="h-4 w-4 text-[#59657a]" />
              <span className="sr-only">Buscar diagramas</span>
              <input className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#59657a]" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, tipo o beneficio" value={query} />
              {query ? <button aria-label="Limpiar búsqueda" onClick={() => setQuery("")} type="button"><X className="h-3.5 w-3.5 text-[#59657a]" /></button> : null}
            </label>
            <button className="flex h-10 items-center justify-center gap-2 rounded-[8px] border border-[#cfd6e4] px-3 text-[12px] font-black xl:hidden" onClick={() => setFiltersOpen((current) => !current)} type="button"><Filter className="h-4 w-4" />Filtros</button>
            <div className={cn("grid flex-1 gap-2 sm:grid-cols-3 xl:flex", filtersOpen ? "grid" : "hidden xl:flex")}>
              {[
                ["Categoría", category, setCategory, CATEGORIES],
                ["Etapa LEAN", stage, setStage, STAGES],
                ["Tipo", type, setType, TYPES],
              ].map(([label, value, setter, options]) => (
                <label className="relative" key={String(label)}>
                  <span className="sr-only">{String(label)}</span>
                  <select
                    aria-label={String(label)}
                    className="h-10 w-full appearance-none rounded-[8px] border border-[#cfd6e4] bg-white pl-3 pr-8 text-[12px] font-bold text-[#465269] outline-none focus:border-[#294bbb] xl:min-w-[150px]"
                    onChange={(event) => (setter as (value: string) => void)(event.target.value)}
                    value={String(value)}
                  >
                    {(options as string[]).map((option) => <option key={option}>{option}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-3 h-3.5 w-3.5 text-[#59657a]" />
                </label>
              ))}
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-[#edf0f5] pt-3 xl:border-l xl:border-t-0 xl:pl-3 xl:pt-0">
              {hasFilters ? <button className="text-[11px] font-black text-[#294bbb]" onClick={() => { setQuery(""); setCategory("Todas"); setStage("Todas"); setType("Todos"); setAccessFilter("Todos"); }} type="button">Limpiar</button> : <span className="text-[11px] text-[#59657a]">{filtered.length} resultados</span>}
              <div className="flex rounded-[8px] border border-[#cfd6e4] bg-[#f7f8fb] p-0.5">
                <button className={cn("h-8 rounded-[6px] px-3 text-[11px] font-black", viewMode === "viewer" ? "bg-white text-[#294bbb] shadow-sm" : "text-[#657187]")} onClick={() => setViewMode("viewer")} type="button">Visor</button>
                <button className={cn("h-8 rounded-[6px] px-3 text-[11px] font-black", viewMode === "catalog" ? "bg-white text-[#294bbb] shadow-sm" : "text-[#657187]")} onClick={() => setViewMode("catalog")} type="button">Catálogo</button>
              </div>
            </div>
          </div>
        </section>

        {viewMode === "catalog" ? (
          <section className="mt-3 rounded-[12px] border border-[#d7dce8] bg-[#f9fafc] p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#59657a]">Catálogo completo</p><h2 className="mt-1 text-[18px] font-black">{filtered.length} diagramas encontrados</h2></div>
              <div className="flex rounded-[8px] border border-[#cfd6e4] bg-white p-0.5">
                <CompactIconButton icon={<Grid2X2 className="h-4 w-4" />} label="Vista de tarjetas" onClick={() => setCatalogLayout("grid")} />
                <CompactIconButton icon={<List className="h-4 w-4" />} label="Vista de lista" onClick={() => setCatalogLayout("list")} />
              </div>
            </div>
            <div className={cn(catalogLayout === "grid" ? "grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" : "grid gap-2")}>
              {filtered.map((item) => catalogLayout === "grid" ? <CatalogCard item={item} key={item.id} onOpen={() => openItem(item)} /> : <DiagramRow active={item.id === selected.id} item={item} key={item.id} onSelect={() => openItem(item)} />)}
            </div>
          </section>
        ) : (
          <section className={cn("mt-3 grid items-start gap-3", inspectorOpen ? "xl:grid-cols-[330px_minmax(0,1fr)_280px]" : "xl:grid-cols-[330px_minmax(0,1fr)]")}>
            <aside className="min-w-0 rounded-[12px] border border-[#d7dce8] bg-white p-3 xl:sticky xl:top-3">
              <div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#59657a]">Resultados</p><h2 className="mt-1 text-[16px] font-black">Diagramas</h2></div><StatusBadge tone="blue">{filtered.length}</StatusBadge></div>
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 pr-1 [scrollbar-color:#9aa6ba_transparent] [scrollbar-width:thin] xl:block xl:max-h-[720px] xl:space-y-2 xl:overflow-y-auto xl:pb-0">
                {filtered.length ? filtered.map((item) => <DiagramRow active={item.id === selected.id} item={item} key={item.id} onSelect={() => { setSelectedId(item.id); setShowVersions(false); }} />) : <div className="rounded-[10px] border border-dashed border-[#cfd6e4] p-5 text-center text-[12px] text-[#59657a]">No hay diagramas con estos filtros.</div>}
              </div>
            </aside>

            <div className="min-w-0 rounded-[12px] border border-[#d7dce8] bg-white p-3 sm:p-4">
              <div className="flex flex-col gap-3 border-b border-[#e2e6ee] pb-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-1.5"><StatusBadge tone={accessTone(selected.access)}>{ACCESS_LABELS[selected.access]}</StatusBadge><StatusBadge tone={generationTone(selected.generation)}>{GENERATION_LABELS[selected.generation]}</StatusBadge><StatusBadge>{selected.version}</StatusBadge></div>
                  <h2 className="mt-2 text-[20px] font-black leading-tight">{selected.title}</h2>
                  <p className="mt-1 text-[12px] text-[#6a758a]">{selected.type} · Complejidad {selected.complexity} · {selected.updated}</p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <CompactIconButton disabled={selected.access !== "available" || !actionable} icon={<Download className="h-4 w-4" />} label="Descargar" onClick={() => notify("Descarga preparada según el plan y formato autorizado.")} />
                  <CompactIconButton disabled={selected.access !== "available" || !actionable} icon={<RotateCcw className="h-4 w-4" />} label="Regenerar" onClick={() => notify("Regeneración solicitada; la versión actual seguirá disponible.")} />
                  <CompactIconButton disabled={selected.access !== "available" || !actionable} icon={<GitCompareArrows className="h-4 w-4" />} label="Comparar versiones" onClick={() => { setShowVersions((current) => !current); setInspectorOpen(true); }} />
                  <CompactIconButton icon={inspectorOpen ? <PanelRightClose className="h-4 w-4" /> : <Columns3 className="h-4 w-4" />} label={inspectorOpen ? "Ocultar detalles" : "Mostrar detalles"} onClick={() => setInspectorOpen((current) => !current)} />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 rounded-[8px] bg-[#f7f8fb] px-2 py-1.5">
                <div className="flex gap-1"><CompactIconButton icon={<ZoomOut className="h-3.5 w-3.5" />} label="Alejar" /><CompactIconButton icon={<ZoomIn className="h-3.5 w-3.5" />} label="Acercar" /><button className="h-9 rounded-[8px] px-2 text-[11px] font-black text-[#566176]" type="button">Ajustar</button></div>
                <CompactIconButton icon={<Maximize2 className="h-3.5 w-3.5" />} label="Pantalla completa" onClick={() => notify("Vista de pantalla completa simulada.")} />
              </div>
              <p className="mt-3 text-[11px] font-bold text-[#59657a] xl:hidden">Desliza el lienzo horizontalmente para explorar el diagrama.</p>
              <div className="mt-2 xl:mt-3"><DiagramCanvas item={selected} onAction={notify} /></div>
              <div className="mt-3 flex flex-col gap-2 rounded-[9px] border border-[#d9deea] bg-[#fafbfc] px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] leading-5 text-[#68748a]"><strong className="text-[#283349]">Acciones disponibles:</strong> ver, descargar, regenerar y comparar se habilitan según plan, estado y permisos.</p>
                <button className="h-8 shrink-0 rounded-[8px] border border-[#cfd6e4] bg-white px-3 text-[11px] font-black" onClick={() => notify("Abriendo trazabilidad del diagrama.")} type="button">Ver fuentes</button>
              </div>
            </div>

            {inspectorOpen ? <Inspector item={selected} showVersions={showVersions} /> : null}
          </section>
        )}
      </main>

      {toast ? <div className="fixed bottom-4 left-1/2 z-50 flex max-w-[calc(100vw-24px)] -translate-x-1/2 items-center gap-2 rounded-[9px] bg-[#101827] px-4 py-3 text-[12px] font-bold text-white shadow-[0_16px_45px_rgba(16,24,39,0.28)]"><Check className="h-4 w-4 text-[#7de3a4]" />{toast}</div> : null}
    </div>
  );
}
