"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Bot,
  Boxes,
  Brain,
  ChevronRight,
  Compass,
  Crown,
  Database,
  Download,
  Eye,
  FileSearch,
  Filter,
  Gauge,
  GitBranch,
  KeyRound,
  Library,
  Lock,
  Maximize2,
  Network,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  Waypoints,
  ZoomIn,
} from "lucide-react";
import { AppButton, Badge, IconButton, KeyValue, Panel } from "@/components/lean/ui";
import { cn } from "@/lib/utils";

type ProductScope = "blueprint" | "acp";
type CommercialTier = "blueprint" | "blueprint_pro" | "acp";
type AccessState = "unlocked" | "sample" | "locked_blueprint" | "locked_acp" | "stage_locked" | "not_generated";
type DiagramCategory =
  | "architecture"
  | "orchestration"
  | "tools"
  | "memory"
  | "flow"
  | "knowledge"
  | "data"
  | "security"
  | "deployment"
  | "evaluation";

type DiagramEntry = {
  category: DiagramCategory;
  description: string;
  enabledFromStage: string;
  formats: string[];
  icon: LucideIcon;
  key: string;
  productScope: ProductScope[];
  requiredTier: CommercialTier;
  sampleEnabled?: boolean;
  sourceCount: number;
  status: "generated" | "planned";
  title: string;
  valueStory: string;
};

const TIER_RANK: Record<CommercialTier, number> = {
  blueprint: 1,
  blueprint_pro: 2,
  acp: 3,
};

const TIER_LABEL: Record<CommercialTier, string> = {
  blueprint: "Blueprint gratuito",
  blueprint_pro: "Blueprint Profesional",
  acp: "ACP Premium",
};

const CATEGORY_LABEL: Record<DiagramCategory, string> = {
  architecture: "Arquitectura",
  data: "Datos",
  deployment: "Despliegue",
  evaluation: "Evaluacion",
  flow: "Flujo",
  knowledge: "Conocimiento",
  memory: "Memoria",
  orchestration: "Orquestacion",
  security: "Seguridad",
  tools: "Herramientas",
};

const DIAGRAMS: DiagramEntry[] = [
  {
    category: "architecture",
    description: "Vista ejecutiva de capas, responsabilidades y limites del sistema agentico.",
    enabledFromStage: "Disenar",
    formats: ["SVG", "Mermaid", "Markdown"],
    icon: Network,
    key: "architecture_overview",
    productScope: ["blueprint"],
    requiredTier: "blueprint",
    sampleEnabled: true,
    sourceCount: 8,
    status: "generated",
    title: "Arquitectura propuesta",
    valueStory: "Muestra como se organiza la solucion antes de hablar de implementacion.",
  },
  {
    category: "orchestration",
    description: "Mapa de agentes, handoffs, decisiones y rutas de razonamiento.",
    enabledFromStage: "Disenar",
    formats: ["SVG", "Mermaid"],
    icon: Waypoints,
    key: "agent_orchestration",
    productScope: ["blueprint", "acp"],
    requiredTier: "blueprint_pro",
    sourceCount: 11,
    status: "generated",
    title: "Orquestacion agentica",
    valueStory: "Explica como colaboran los agentes y cuando interviene el usuario.",
  },
  {
    category: "tools",
    description: "Herramientas minimas, capacidades, contratos y side effects gobernados.",
    enabledFromStage: "Herramientas",
    formats: ["SVG", "YAML"],
    icon: Boxes,
    key: "tool_capability_map",
    productScope: ["blueprint", "acp"],
    requiredTier: "blueprint_pro",
    sourceCount: 14,
    status: "generated",
    title: "Mapa de herramientas",
    valueStory: "Evita sobreaprovisionar el agente y muestra que aporta cada capacidad.",
  },
  {
    category: "memory",
    description: "Memoria corta, memoria larga, RAG, budgets de contexto y trazabilidad.",
    enabledFromStage: "Memoria",
    formats: ["SVG", "Mermaid", "JSON"],
    icon: Brain,
    key: "memory_rag_architecture",
    productScope: ["blueprint", "acp"],
    requiredTier: "blueprint_pro",
    sourceCount: 12,
    status: "generated",
    title: "Memoria y RAG",
    valueStory: "Resume como el agente recuerda, recupera evidencia y evita saturar contexto.",
  },
  {
    category: "flow",
    description: "Flujo operativo del agente final y reglas de transicion.",
    enabledFromStage: "Memoria",
    formats: ["SVG", "Mermaid"],
    icon: Route,
    key: "runtime_workflow",
    productScope: ["blueprint", "acp"],
    requiredTier: "blueprint_pro",
    sourceCount: 9,
    status: "generated",
    title: "Flujo runtime del agente",
    valueStory: "Diferencia el comportamiento del agente del proceso interno de Lean.",
  },
  {
    category: "knowledge",
    description: "Grafo de fuentes, decisiones, artefactos y evidencia aprobada.",
    enabledFromStage: "Memoria",
    formats: ["Graph JSON", "GraphML", "SVG"],
    icon: GitBranch,
    key: "knowledge_graph",
    productScope: ["blueprint", "acp"],
    requiredTier: "blueprint_pro",
    sourceCount: 27,
    status: "generated",
    title: "Grafo de conocimiento",
    valueStory: "Conecta las decisiones del diseno con sus fuentes y artefactos.",
  },
  {
    category: "data",
    description: "Entidades, contratos, payloads y relaciones para construccion.",
    enabledFromStage: "Validar Blueprint",
    formats: ["SVG", "JSON Schema"],
    icon: Database,
    key: "data_contracts",
    productScope: ["acp"],
    requiredTier: "acp",
    sourceCount: 18,
    status: "generated",
    title: "Datos y contratos",
    valueStory: "Traduce el Blueprint en insumos tecnicos para implementacion.",
  },
  {
    category: "security",
    description: "Guardrails, approvals, boundaries y politicas de seguridad.",
    enabledFromStage: "Herramientas",
    formats: ["SVG", "Markdown"],
    icon: ShieldCheck,
    key: "security_guardrails",
    productScope: ["blueprint", "acp"],
    requiredTier: "blueprint_pro",
    sourceCount: 10,
    status: "generated",
    title: "Seguridad y guardrails",
    valueStory: "Hace visibles los controles que reducen riesgo operativo.",
  },
  {
    category: "deployment",
    description: "Opciones de stack, runtime target, entorno y decision matrix.",
    enabledFromStage: "Construccion ACP",
    formats: ["SVG", "YAML"],
    icon: KeyRound,
    key: "deployment_decision_matrix",
    productScope: ["acp"],
    requiredTier: "acp",
    sourceCount: 16,
    status: "planned",
    title: "Despliegue y stack",
    valueStory: "No impone tecnologia; guia al equipo para elegir stack y entorno.",
  },
  {
    category: "evaluation",
    description: "Escenarios, test suite, quality gates y criterios de aceptacion.",
    enabledFromStage: "Test Suite",
    formats: ["SVG", "YAML"],
    icon: Gauge,
    key: "evaluation_test_suite",
    productScope: ["acp"],
    requiredTier: "acp",
    sourceCount: 13,
    status: "planned",
    title: "Test Suite y validacion",
    valueStory: "Convierte el diseno en pruebas concretas para construir con confianza.",
  },
];

const CATEGORY_FILTERS: Array<DiagramCategory | "all"> = [
  "all",
  "architecture",
  "orchestration",
  "tools",
  "memory",
  "knowledge",
  "deployment",
  "evaluation",
];

const INITIAL_VISIBLE_CATEGORIES = 20;
const INITIAL_VISIBLE_DIAGRAMS = 20;

function productLabel(scope: ProductScope[]) {
  if (scope.includes("blueprint") && scope.includes("acp")) {
    return "Blueprint + ACP";
  }
  return scope.includes("acp") ? "ACP" : "Blueprint";
}

function productTone(scope: ProductScope[]) {
  if (scope.includes("acp") && !scope.includes("blueprint")) {
    return "violet" as const;
  }
  if (scope.includes("acp")) {
    return "blue" as const;
  }
  return "green" as const;
}

function resolveAccessState(diagram: DiagramEntry, tier: CommercialTier): AccessState {
  if (diagram.status === "planned" && TIER_RANK[tier] >= TIER_RANK[diagram.requiredTier]) {
    return "not_generated";
  }
  if (diagram.sampleEnabled && tier === "blueprint") {
    return "sample";
  }
  if (TIER_RANK[tier] >= TIER_RANK[diagram.requiredTier]) {
    return "unlocked";
  }
  return diagram.requiredTier === "acp" ? "locked_acp" : "locked_blueprint";
}

function accessBadge(state: AccessState) {
  if (state === "unlocked") {
    return <Badge tone="green">Disponible</Badge>;
  }
  if (state === "sample") {
    return <Badge tone="blue">Muestra</Badge>;
  }
  if (state === "not_generated") {
    return <Badge tone="orange">Planificado</Badge>;
  }
  if (state === "stage_locked") {
    return <Badge tone="orange">Por etapa</Badge>;
  }
  return <Badge tone="slate">Bloqueado</Badge>;
}

function ShellRail() {
  const items: Array<{ icon: LucideIcon; label: string; active?: boolean }> = [
    { icon: Sparkles, label: "Inicio" },
    { icon: Bot, label: "Agentes" },
    { icon: Library, label: "Biblioteca", active: true },
    { icon: FileSearch, label: "Blueprint" },
    { icon: ShieldCheck, label: "Gobierno" },
    { icon: Gauge, label: "Metricas" },
  ];

  return (
    <aside className="hidden w-[86px] shrink-0 flex-col justify-between rounded-[28px] border border-white/10 bg-[#07152c] p-4 text-white lg:flex">
      <div className="space-y-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[16px] bg-[linear-gradient(135deg,#14b8a6,#0f766e)] shadow-[0_18px_40px_rgba(20,184,166,0.28)]">
          <Network className="h-5 w-5" />
        </div>
        <nav className="space-y-3">
          {items.map((item) => (
            <button
              key={item.label}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-[15px] border transition",
                item.active
                  ? "border-white/20 bg-white text-[#07152c] shadow-[0_16px_30px_rgba(255,255,255,0.18)]"
                  : "border-transparent text-white/62 hover:border-white/10 hover:bg-white/8 hover:text-white",
              )}
              title={item.label}
              type="button"
            >
              <item.icon className="h-4 w-4" />
            </button>
          ))}
        </nav>
      </div>
      <div className="space-y-3">
        {[Compass, Bell].map((Icon, index) => (
          <button
            key={index}
            className="flex h-11 w-11 items-center justify-center rounded-[15px] text-white/62 transition hover:bg-white/8 hover:text-white"
            type="button"
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-[#0b1932] text-[13px] font-bold">
          LB
        </div>
      </div>
    </aside>
  );
}

function DiagramCard({
  active,
  diagram,
  onSelect,
  tier,
}: {
  active: boolean;
  diagram: DiagramEntry;
  onSelect: () => void;
  tier: CommercialTier;
}) {
  const accessState = resolveAccessState(diagram, tier);
  const Icon = diagram.icon;

  return (
    <button
      className={cn(
        "group w-full rounded-[22px] border p-4 text-left transition hover:-translate-y-0.5",
        active
          ? "border-[rgba(20,184,166,0.42)] bg-white shadow-[0_22px_50px_rgba(15,23,42,0.12)]"
          : "border-[rgba(15,23,42,0.08)] bg-white/72 hover:border-[rgba(20,184,166,0.24)] hover:bg-white",
      )}
      onClick={onSelect}
      type="button"
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] border",
            accessState === "unlocked" || accessState === "sample"
              ? "border-[rgba(20,184,166,0.18)] bg-[rgba(20,184,166,0.1)] text-[#0f766e]"
              : "border-[rgba(15,23,42,0.08)] bg-[var(--surface-subtle)] text-[var(--text-muted)]",
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-[14px] font-semibold text-[var(--text-primary)]">{diagram.title}</p>
            <ChevronRight className="h-4 w-4 text-[var(--text-muted)] transition group-hover:translate-x-0.5" />
          </div>
          <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-[var(--text-secondary)]">{diagram.valueStory}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone={productTone(diagram.productScope)}>{productLabel(diagram.productScope)}</Badge>
            {accessBadge(accessState)}
          </div>
        </div>
      </div>
    </button>
  );
}

function ProtectedCanvas({
  accessState,
  children,
  onProtectedAction,
}: {
  accessState: AccessState;
  children: ReactNode;
  onProtectedAction: () => void;
}) {
  const protectedContent = accessState !== "unlocked";

  return (
    <div
      className={cn("relative", protectedContent && "select-none")}
      draggable={false}
      onContextMenu={(event) => {
        if (!protectedContent) {
          return;
        }
        event.preventDefault();
        onProtectedAction();
      }}
      onCopy={(event) => {
        if (!protectedContent) {
          return;
        }
        event.preventDefault();
        onProtectedAction();
      }}
      onCut={(event) => {
        if (!protectedContent) {
          return;
        }
        event.preventDefault();
        onProtectedAction();
      }}
      onDragStart={(event) => {
        if (!protectedContent) {
          return;
        }
        event.preventDefault();
        onProtectedAction();
      }}
    >
      {children}
    </div>
  );
}

function ArchitectureDiagram({ sample }: { sample: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-[30px] border border-[rgba(15,23,42,0.08)] bg-[linear-gradient(180deg,#f8fbff_0%,#edf7f4_100%)] p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(20,184,166,0.18),transparent_28%),radial-gradient(circle_at_82%_14%,rgba(14,165,233,0.16),transparent_30%),radial-gradient(circle_at_58%_92%,rgba(245,158,11,0.12),transparent_26%)]" />
      {sample ? (
        <div className="absolute right-5 top-5 z-10 rounded-full border border-[rgba(15,118,110,0.16)] bg-white/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#0f766e] backdrop-blur">
          Muestra protegida
        </div>
      ) : null}
      <svg className="relative h-[390px] w-full" viewBox="0 0 920 430" role="img" aria-label="Mockup de arquitectura propuesta">
        <defs>
          <linearGradient id="hubFill" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#0f766e" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
          <linearGradient id="darkFill" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#0b1932" />
            <stop offset="100%" stopColor="#172554" />
          </linearGradient>
        </defs>

        <path d="M188 96 C300 96 300 96 404 96" fill="none" stroke="#8bd7cf" strokeDasharray="8 8" strokeWidth="3" />
        <path d="M516 96 C632 96 632 96 748 96" fill="none" stroke="#8bd7cf" strokeDasharray="8 8" strokeWidth="3" />
        <path d="M460 144 C460 210 310 220 286 282" fill="none" stroke="#bedbd6" strokeWidth="3" />
        <path d="M460 144 C460 210 612 220 638 282" fill="none" stroke="#bedbd6" strokeWidth="3" />
        <path d="M286 330 C372 392 548 392 638 330" fill="none" stroke="#d7e4e0" strokeWidth="3" />

        <g>
          <rect fill="#ffffff" height="82" rx="24" stroke="#d9e9e6" width="152" x="36" y="58" />
          <text fill="#0b1932" fontSize="16" fontWeight="700" textAnchor="middle" x="112" y="92">
            Necesidad
          </text>
          <text fill="#64748b" fontSize="12" textAnchor="middle" x="112" y="116">
            objetivos + restricciones
          </text>
        </g>

        <g>
          <rect fill="url(#hubFill)" height="100" rx="30" width="156" x="382" y="46" />
          <text fill="#ffffff" fontSize="17" fontWeight="800" textAnchor="middle" x="460" y="84">
            Blueprint
          </text>
          <text fill="#dcfffb" fontSize="12" textAnchor="middle" x="460" y="109">
            diseno integral
          </text>
        </g>

        <g>
          <rect fill="#ffffff" height="82" rx="24" stroke="#d9e9e6" width="156" x="748" y="58" />
          <text fill="#0b1932" fontSize="16" fontWeight="700" textAnchor="middle" x="826" y="92">
            Diagramas
          </text>
          <text fill="#64748b" fontSize="12" textAnchor="middle" x="826" y="116">
            valor visible
          </text>
        </g>

        <g>
          <rect fill="#ffffff" height="96" rx="26" stroke="#d9e9e6" width="184" x="194" y="258" />
          <text fill="#0b1932" fontSize="15" fontWeight="800" textAnchor="middle" x="286" y="294">
            Herramientas
          </text>
          <text fill="#64748b" fontSize="12" textAnchor="middle" x="286" y="319">
            capacidades minimas
          </text>
        </g>

        <g>
          <rect fill="#ffffff" height="96" rx="26" stroke="#d9e9e6" width="184" x="546" y="258" />
          <text fill="#0b1932" fontSize="15" fontWeight="800" textAnchor="middle" x="638" y="294">
            Memoria + RAG
          </text>
          <text fill="#64748b" fontSize="12" textAnchor="middle" x="638" y="319">
            conocimiento recuperable
          </text>
        </g>

        <g>
          <rect fill="url(#darkFill)" height="58" rx="22" width="180" x="370" y="354" />
          <text fill="#ffffff" fontSize="14" fontWeight="800" textAnchor="middle" x="460" y="388">
            ACP opcional
          </text>
        </g>
      </svg>
      {sample ? (
        <div className="pointer-events-none absolute inset-0 flex rotate-[-18deg] items-center justify-center text-[54px] font-black uppercase tracking-[0.28em] text-[#0f766e]/10">
          Preview
        </div>
      ) : null}
    </div>
  );
}

function MiniFlowDiagram({ diagram }: { diagram: DiagramEntry }) {
  const Icon = diagram.icon;

  return (
    <div className="relative overflow-hidden rounded-[30px] border border-[rgba(15,23,42,0.08)] bg-[#07152c] p-6 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(20,184,166,0.22),transparent_30%),radial-gradient(circle_at_78%_22%,rgba(59,130,246,0.18),transparent_28%)]" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/48">Vista autorizada</p>
            <h3 className="mt-2 text-[28px] font-semibold">{diagram.title}</h3>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-[20px] border border-white/15 bg-white/10">
            <Icon className="h-6 w-6" />
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {["Contexto", "Decision", "Tool/Memory", "Artefacto"].map((label, index) => (
            <div key={label} className="relative rounded-[22px] border border-white/10 bg-white/9 p-4">
              {index < 3 ? <div className="absolute -right-5 top-1/2 hidden h-px w-6 bg-white/35 md:block" /> : null}
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/42">Nodo {index + 1}</p>
              <p className="mt-3 text-[15px] font-semibold">{label}</p>
              <p className="mt-2 text-[12px] leading-5 text-white/62">{diagram.category} layer</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {diagram.formats.map((format) => (
            <div key={format} className="rounded-[18px] border border-white/10 bg-white/7 px-4 py-3">
              <p className="text-[12px] font-semibold text-white/86">{format}</p>
              <p className="mt-1 text-[11px] text-white/48">Formato autorizado</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LockedDiagramUpsell({
  accessState,
  diagram,
}: {
  accessState: AccessState;
  diagram: DiagramEntry;
}) {
  const isAcp = accessState === "locked_acp";
  const title = isAcp ? "Desbloquea este diagrama con ACP" : "Desbloquea este diagrama con Blueprint Profesional";
  const message = isAcp
    ? "Este diagrama hace parte del Agent Construction Package (ACP). Adquiere el ACP para acceder a los artefactos de implementacion y construccion del sistema agentico."
    : "Este diagrama forma parte del Blueprint. Adquierelo para acceder a la documentacion completa, los diagramas detallados y el diseno integral de la solucion.";

  return (
    <div className="relative min-h-[430px] overflow-hidden rounded-[30px] border border-[rgba(15,23,42,0.08)] bg-[linear-gradient(135deg,#fffaf0,#eefcf8_48%,#f8fafc)] p-8">
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[rgba(20,184,166,0.18)] blur-3xl" />
      <div className="absolute -bottom-24 left-12 h-72 w-72 rounded-full bg-[rgba(245,158,11,0.16)] blur-3xl" />

      <div className="relative grid min-h-[360px] gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="flex flex-col justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#07152c] text-white shadow-[0_18px_40px_rgba(7,21,44,0.22)]">
            {isAcp ? <Crown className="h-7 w-7" /> : <Lock className="h-7 w-7" />}
          </div>
          <p className="mt-6 text-[12px] font-black uppercase tracking-[0.24em] text-[#0f766e]">
            {isAcp ? "Upgrade ACP Premium" : "Upgrade Blueprint"}
          </p>
          <h3 className="mt-3 max-w-[520px] text-[34px] font-semibold leading-tight text-[#07152c]">{title}</h3>
          <p className="mt-4 max-w-[620px] text-[15px] leading-8 text-slate-600">{message}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <AppButton variant="primary">{isAcp ? "Adquirir ACP" : "Adquirir Blueprint"}</AppButton>
            <AppButton>Ver contenido incluido</AppButton>
          </div>
        </div>

        <div className="grid content-center gap-3">
          {[
            ["Valor desbloqueado", diagram.valueStory],
            ["Producto", productLabel(diagram.productScope)],
            ["Etapa requerida", diagram.enabledFromStage],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[22px] border border-white/70 bg-white/78 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</p>
              <p className="mt-2 text-[15px] font-semibold leading-6 text-[#07152c]">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlannedDiagramState({ diagram }: { diagram: DiagramEntry }) {
  return (
    <div className="min-h-[430px] rounded-[30px] border border-dashed border-[rgba(15,23,42,0.18)] bg-white/78 p-8">
      <div className="flex h-full min-h-[360px] flex-col items-center justify-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[var(--warning-soft)] text-[var(--warning)]">
          <Filter className="h-7 w-7" />
        </div>
        <h3 className="mt-5 text-[28px] font-semibold text-[var(--text-primary)]">Diagrama planificado</h3>
        <p className="mt-3 max-w-[620px] text-[15px] leading-8 text-[var(--text-secondary)]">
          {diagram.title} aparece en el catalogo para mostrar el alcance del ACP, pero se generara cuando la etapa {diagram.enabledFromStage} tenga contexto aprobado.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Badge tone="orange">Pendiente de generacion</Badge>
          <Badge tone={productTone(diagram.productScope)}>{productLabel(diagram.productScope)}</Badge>
        </div>
      </div>
    </div>
  );
}

function DiagramCanvas({
  accessState,
  diagram,
  onProtectedAction,
}: {
  accessState: AccessState;
  diagram: DiagramEntry;
  onProtectedAction: () => void;
}) {
  if (accessState === "locked_acp" || accessState === "locked_blueprint") {
    return <LockedDiagramUpsell accessState={accessState} diagram={diagram} />;
  }

  if (accessState === "not_generated" || diagram.status === "planned") {
    return <PlannedDiagramState diagram={diagram} />;
  }

  return (
    <ProtectedCanvas accessState={accessState} onProtectedAction={onProtectedAction}>
      {diagram.key === "architecture_overview" ? (
        <ArchitectureDiagram sample={accessState === "sample"} />
      ) : (
        <MiniFlowDiagram diagram={diagram} />
      )}
    </ProtectedCanvas>
  );
}

function Inspector({
  accessState,
  diagram,
}: {
  accessState: AccessState;
  diagram: DiagramEntry;
}) {
  const protectionEnabled = accessState !== "unlocked";

  return (
    <aside className="space-y-4">
      <Panel className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">Inspector</p>
            <h3 className="mt-2 text-[20px] font-semibold text-[var(--text-primary)]">{diagram.title}</h3>
          </div>
          {accessBadge(accessState)}
        </div>
        <p className="mt-4 text-[13px] leading-7 text-[var(--text-secondary)]">{diagram.description}</p>
        <div className="mt-5 grid gap-4">
          <KeyValue label="Producto" value={productLabel(diagram.productScope)} />
          <KeyValue label="Se habilita desde" value={diagram.enabledFromStage} />
          <KeyValue label="Fuentes vinculadas" value={`${diagram.sourceCount} artefactos`} />
        </div>
      </Panel>

      <Panel className="p-5">
        <p className="text-[13px] font-semibold text-[var(--text-primary)]">Formatos</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {diagram.formats.map((format) => (
            <Badge key={format} tone="slate">
              {format}
            </Badge>
          ))}
        </div>
      </Panel>

      <Panel className="p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#0f766e]" />
          <p className="text-[13px] font-semibold text-[var(--text-primary)]">Proteccion de contenido</p>
        </div>
        <div className="mt-4 space-y-3">
          {[
            ["Menu contextual", protectionEnabled ? "Bloqueado" : "Permitido"],
            ["Copiar contenido", protectionEnabled ? "Bloqueado" : "Permitido"],
            ["Descarga", accessState === "unlocked" ? "Segun permiso" : "No disponible"],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between rounded-[16px] bg-[var(--surface-subtle)] px-3 py-3">
              <span className="text-[12px] text-[var(--text-secondary)]">{label}</span>
              <span className="text-[12px] font-semibold text-[var(--text-primary)]">{value}</span>
            </div>
          ))}
        </div>
      </Panel>
    </aside>
  );
}

export function DiagramBrowserMockupPage() {
  const [tier, setTier] = useState<CommercialTier>("blueprint");
  const [selectedKey, setSelectedKey] = useState(DIAGRAMS[0].key);
  const [category, setCategory] = useState<DiagramCategory | "all">("all");
  const [visibleCategoryCount, setVisibleCategoryCount] = useState(INITIAL_VISIBLE_CATEGORIES);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");
  const [visibleDiagramCount, setVisibleDiagramCount] = useState(INITIAL_VISIBLE_DIAGRAMS);

  const selectedDiagram = DIAGRAMS.find((item) => item.key === selectedKey) ?? DIAGRAMS[0];
  const selectedAccess = resolveAccessState(selectedDiagram, tier);

  const filteredDiagrams = useMemo(() => {
    return DIAGRAMS.filter((diagram) => {
      const matchesCategory = category === "all" || diagram.category === category;
      const normalizedQuery = query.trim().toLowerCase();
      const matchesQuery =
        normalizedQuery.length === 0 ||
        diagram.title.toLowerCase().includes(normalizedQuery) ||
        diagram.description.toLowerCase().includes(normalizedQuery) ||
        CATEGORY_LABEL[diagram.category].toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  const visibleCategoryFilters = CATEGORY_FILTERS.slice(0, visibleCategoryCount);
  const remainingCategoryCount = Math.max(0, CATEGORY_FILTERS.length - visibleCategoryFilters.length);
  const visibleDiagrams = filteredDiagrams.slice(0, visibleDiagramCount);
  const remainingDiagramCount = Math.max(0, filteredDiagrams.length - visibleDiagrams.length);

  const categoryCounts = useMemo(() => {
    return CATEGORY_FILTERS.reduce<Record<string, number>>((accumulator, item) => {
      accumulator[item] = item === "all" ? DIAGRAMS.length : DIAGRAMS.filter((diagram) => diagram.category === item).length;
      return accumulator;
    }, {});
  }, []);

  const stats = useMemo(() => {
    return DIAGRAMS.reduce(
      (accumulator, diagram) => {
        const access = resolveAccessState(diagram, tier);
        accumulator.total += 1;
        if (access === "unlocked") {
          accumulator.unlocked += 1;
        }
        if (access === "sample") {
          accumulator.samples += 1;
        }
        if (access === "locked_acp" || access === "locked_blueprint") {
          accumulator.locked += 1;
        }
        if (diagram.productScope.includes("acp") && !diagram.productScope.includes("blueprint")) {
          accumulator.acpOnly += 1;
        }
        return accumulator;
      },
      { acpOnly: 0, locked: 0, samples: 0, total: 0, unlocked: 0 },
    );
  }, [tier]);

  function handleProtectedAction() {
    setToast("Contenido protegido: esta vista no permite copiar, arrastrar ni abrir menu contextual.");
    window.setTimeout(() => setToast(""), 2600);
  }

  return (
    <div className="min-h-screen bg-[#07152c] p-3 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-24px)] max-w-[1860px] gap-3 rounded-[34px] border border-white/10 bg-[#07152c] p-3">
        <ShellRail />

        <main className="relative flex-1 overflow-hidden rounded-[30px] bg-[linear-gradient(180deg,#f8fafc_0%,#eef5f2_100%)] text-[var(--text-primary)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.14),transparent_32%),radial-gradient(circle_at_85%_10%,rgba(59,130,246,0.13),transparent_24%)]" />
          <div className="relative space-y-5 p-5 xl:p-7">
            <section className="overflow-hidden rounded-[30px] border border-white/70 bg-white/72 p-6 shadow-[0_28px_80px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div className="max-w-[900px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="green">Catalogo completo visible</Badge>
                    <Badge tone="blue">{TIER_LABEL[tier]}</Badge>
                    <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Diagram Browser</span>
                  </div>
                  <h1 className="mt-4 text-[40px] font-semibold leading-tight tracking-[-0.04em] text-[#07152c]">
                    Visor unificado de diagramas con acceso gobernado
                  </h1>
                  <p className="mt-3 max-w-[820px] text-[15px] leading-8 text-slate-600">
                    Todos los diagramas aparecen desde el inicio. El contenido real se desbloquea por etapa, producto y compra, usando upsell contextual en lugar de ocultar valor.
                  </p>
                </div>

                <div className="grid min-w-[360px] gap-2 rounded-[24px] border border-[rgba(15,23,42,0.08)] bg-[#07152c] p-3 text-white shadow-[0_24px_60px_rgba(7,21,44,0.18)]">
                  {(["blueprint", "blueprint_pro", "acp"] as CommercialTier[]).map((item) => (
                    <button
                      key={item}
                      className={cn(
                        "flex items-center justify-between rounded-[18px] px-4 py-3 text-left transition",
                        tier === item ? "bg-white text-[#07152c]" : "text-white/68 hover:bg-white/8 hover:text-white",
                      )}
                      onClick={() => setTier(item)}
                      type="button"
                    >
                      <span className="text-[13px] font-semibold">{TIER_LABEL[item]}</span>
                      {tier === item ? <Eye className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-5">
                {[
                  ["Diagramas", stats.total, "catalogo visible"],
                  ["Disponibles", stats.unlocked, "contenido completo"],
                  ["Muestras", stats.samples, "preview protegido"],
                  ["Bloqueados", stats.locked, "upsell activo"],
                  ["ACP only", stats.acpOnly, "premium"],
                ].map(([label, value, hint]) => (
                  <div key={label} className="rounded-[20px] border border-[rgba(15,23,42,0.08)] bg-white/78 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">{label}</p>
                    <p className="mt-2 text-[28px] font-semibold text-[#07152c]">{value}</p>
                    <p className="text-[12px] text-[var(--text-secondary)]">{hint}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid items-start gap-5 xl:grid-cols-[410px_minmax(0,1fr)_330px]">
              <Panel className="flex h-[calc(100vh-245px)] min-h-[720px] flex-col overflow-hidden p-4">
                <div className="shrink-0 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">Catalogo</p>
                    <h2 className="mt-1 text-[22px] font-semibold">Todo el valor generado</h2>
                  </div>
                  <Badge tone="green">{filteredDiagrams.length}</Badge>
                </div>

                <div className="mt-4 shrink-0 flex items-center gap-2 rounded-[18px] border border-[var(--border-default)] bg-white px-3 py-2">
                  <Search className="h-4 w-4 text-[var(--text-muted)]" />
                  <input
                    className="h-9 flex-1 bg-transparent text-[14px] outline-none placeholder:text-[var(--text-muted)]"
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setVisibleDiagramCount(INITIAL_VISIBLE_DIAGRAMS);
                    }}
                    placeholder="Buscar diagrama, producto o categoria"
                    value={query}
                  />
                </div>

                <div className="mt-4 shrink-0 rounded-[22px] border border-[var(--border-default)] bg-white/72 p-3">
                  <div className="mb-3 flex items-center justify-between gap-3 px-1">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">Categorias</p>
                      <p className="mt-1 text-[11px] text-[var(--text-muted)]">Carga progresiva de {INITIAL_VISIBLE_CATEGORIES}</p>
                    </div>
                    <span className="rounded-full bg-[var(--surface-subtle)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-secondary)]">
                      {visibleCategoryFilters.length}/{CATEGORY_FILTERS.length}
                    </span>
                  </div>
                  <div className="grid max-h-[430px] gap-2 overflow-y-scroll pr-2 [scrollbar-color:#0f766e_rgba(15,23,42,0.10)] [scrollbar-gutter:stable] [scrollbar-width:thin]">
                    {visibleCategoryFilters.map((item) => (
                      <button
                        key={item}
                        className={cn(
                          "flex items-center justify-between rounded-[16px] border px-3 py-2.5 text-left text-[12px] font-semibold transition",
                          category === item
                            ? "border-transparent bg-[#0f766e] text-white"
                            : "border-[var(--border-default)] bg-white text-[var(--text-secondary)] hover:border-[rgba(20,184,166,0.28)]",
                        )}
                        onClick={() => {
                          setCategory(item);
                          setVisibleDiagramCount(INITIAL_VISIBLE_DIAGRAMS);
                        }}
                        type="button"
                      >
                        <span>{item === "all" ? "Todos" : CATEGORY_LABEL[item]}</span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px]",
                            category === item ? "bg-white/18 text-white" : "bg-[var(--surface-subtle)] text-[var(--text-muted)]",
                          )}
                        >
                          {categoryCounts[item] ?? 0}
                        </span>
                      </button>
                    ))}
                  </div>
                  {remainingCategoryCount > 0 ? (
                    <button
                      className="mt-3 w-full rounded-[15px] border border-dashed border-[rgba(15,23,42,0.16)] bg-white/60 px-3 py-2.5 text-[12px] font-semibold text-[#0f766e] transition hover:bg-white"
                      onClick={() => setVisibleCategoryCount((current) => current + INITIAL_VISIBLE_CATEGORIES)}
                      type="button"
                    >
                      Cargar {Math.min(INITIAL_VISIBLE_CATEGORIES, remainingCategoryCount)} categorias mas
                    </button>
                  ) : null}
                </div>

                <div className="mt-4 shrink-0 flex items-center justify-between px-1 text-[12px] text-[var(--text-muted)]">
                  <span>
                    Mostrando {visibleDiagrams.length} de {filteredDiagrams.length}
                  </span>
                  <span>Bloques de {INITIAL_VISIBLE_DIAGRAMS}</span>
                </div>

                <div className="mt-3 min-h-[320px] flex-1 space-y-3 overflow-y-scroll pr-2 [scrollbar-color:#0f766e_rgba(15,23,42,0.10)] [scrollbar-gutter:stable] [scrollbar-width:thin]">
                  {visibleDiagrams.map((diagram) => (
                    <DiagramCard
                      key={diagram.key}
                      active={diagram.key === selectedDiagram.key}
                      diagram={diagram}
                      onSelect={() => setSelectedKey(diagram.key)}
                      tier={tier}
                    />
                  ))}
                  {remainingDiagramCount > 0 ? (
                    <button
                      className="w-full rounded-[20px] border border-[rgba(20,184,166,0.2)] bg-[rgba(20,184,166,0.08)] px-4 py-3 text-[13px] font-semibold text-[#0f766e] transition hover:bg-[rgba(20,184,166,0.14)]"
                      onClick={() => setVisibleDiagramCount((current) => current + INITIAL_VISIBLE_DIAGRAMS)}
                      type="button"
                    >
                      Cargar {Math.min(INITIAL_VISIBLE_DIAGRAMS, remainingDiagramCount)} diagramas mas
                    </button>
                  ) : null}
                </div>
              </Panel>

              <div className="space-y-4">
                <Panel className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">Canvas</p>
                      <h2 className="mt-1 text-[24px] font-semibold">{selectedDiagram.title}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <IconButton disabled={selectedAccess !== "unlocked"} icon={<Download className="h-4 w-4" />} title="Descargar" />
                      <IconButton icon={<ZoomIn className="h-4 w-4" />} title="Zoom" />
                      <IconButton icon={<Maximize2 className="h-4 w-4" />} title="Pantalla completa" />
                    </div>
                  </div>
                </Panel>

                <DiagramCanvas accessState={selectedAccess} diagram={selectedDiagram} onProtectedAction={handleProtectedAction} />

                <div className="grid gap-3 md:grid-cols-3">
                  {[
                    ["Regla", selectedAccess === "unlocked" ? "Contenido completo" : selectedAccess === "sample" ? "Muestra protegida" : "Upsell"],
                    ["Etapa", selectedDiagram.enabledFromStage],
                    ["Producto", productLabel(selectedDiagram.productScope)],
                  ].map(([label, value]) => (
                    <Panel key={label} className="p-4">
                      <KeyValue label={label} value={value} />
                    </Panel>
                  ))}
                </div>
              </div>

              <Inspector accessState={selectedAccess} diagram={selectedDiagram} />
            </section>
          </div>

          {toast ? (
            <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-[rgba(15,23,42,0.08)] bg-[#07152c] px-5 py-3 text-[13px] font-semibold text-white shadow-[0_22px_60px_rgba(7,21,44,0.26)]">
              {toast}
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
