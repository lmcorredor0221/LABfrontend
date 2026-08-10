"use client";

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Bot,
  Boxes,
  ChevronRight,
  Compass,
  Download,
  FileStack,
  FolderKanban,
  Gauge,
  History,
  Library,
  Link2,
  LayoutDashboard,
  NotebookPen,
  Settings,
  ShieldCheck,
  Sparkles,
  Waypoints,
} from "lucide-react";
import { PageChrome, TopUtilities } from "@/components/lean/shell";
import { AppButton, Badge, KeyValue, Panel, ProgressBar } from "@/components/lean/ui";
import { cn } from "@/lib/utils";

type InspectorTab = "preview" | "origin" | "metadata";
type CanvasMode = "visual" | "relations" | "exports";
type ArtifactSection = "diagramas" | "contratos" | "prompts" | "runtime";
type ArtifactKind = "diagram" | "contract" | "prompt" | "runtime";

type ArtifactEntry = {
  id: string;
  title: string;
  section: ArtifactSection;
  kind: ArtifactKind;
  format: string;
  status: "complete" | "needs_review";
  summary: string;
  sourcePath: string;
  sourceFiles: string[];
  tags: string[];
  lineage: string[];
  usedIn: string[];
  notes: string[];
  owner: string;
  updatedAt: string;
  version: string;
};

const SIDEBAR_ITEMS: Array<{ active?: boolean; icon: LucideIcon; label: string }> = [
  { icon: LayoutDashboard, label: "Inicio" },
  { icon: FolderKanban, label: "Proyectos" },
  { icon: Bot, label: "Agentes" },
  { icon: NotebookPen, label: "Plantillas" },
  { icon: ShieldCheck, label: "Evaluaciones" },
  { icon: Gauge, label: "Monitoreo" },
  { active: true, icon: Library, label: "Biblioteca" },
  { icon: Link2, label: "Integraciones" },
  { icon: Settings, label: "Configuracion" },
  { icon: Boxes, label: "Modulos" },
];

const SECTION_LABELS: Record<ArtifactSection, string> = {
  contratos: "Contratos",
  diagramas: "Diagramas",
  prompts: "Prompts",
  runtime: "Runtime",
};

const ARTIFACTS: ArtifactEntry[] = [
  {
    id: "architecture-overview",
    title: "ArchitectureOverview.md",
    section: "diagramas",
    kind: "diagram",
    format: "Mermaid + SVG",
    status: "complete",
    summary: "Vista editorial del blueprint con flujo principal, capas del runtime y evidencia operativa.",
    sourcePath: "ACP/diagrams/ArchitectureOverview.md",
    sourceFiles: [
      "ACP/architecture/topology.yaml",
      "ACP/runtime/config.yaml",
      "ACP/tools/permissions.yaml",
    ],
    tags: ["topology", "orchestration", "blueprint-core"],
    lineage: ["Discovery normalizado", "Canvas aprobado", "Blueprint enriquecido", "ACP visualizado"],
    usedIn: ["Construction pack", "Executive review", "Implementation handoff"],
    notes: [
      "Debe abrir siempre en primer plano cuando existan diagramas exportables.",
      "La vista previa combina topologia y rutas criticas del agente.",
    ],
    owner: "ACP Visualization",
    updatedAt: "2026-07-20 09:12",
    version: "v7",
  },
  {
    id: "knowledge-graph",
    title: "KnowledgeGraph.md",
    section: "diagramas",
    kind: "diagram",
    format: "Mermaid + Graph JSON",
    status: "complete",
    summary: "Mapa curado del grafo ACP para navegar decisiones, prompts, tools e integraciones.",
    sourcePath: "ACP/diagrams/KnowledgeGraph.md",
    sourceFiles: ["ACP/blueprint.graph.json", "ACP/blueprint.graphml", "ACP/blueprint.cypher"],
    tags: ["graph", "traceability", "knowledge"],
    lineage: ["Knowledge memory indexado", "Graph curado", "Artifacts publicados"],
    usedIn: ["Root cause review", "Dependency review", "Operator onboarding"],
    notes: [
      "El mockup lo trata como artefacto premium: gran canvas, minimapa y metadata lateral.",
      "Ideal para mostrar relacion entre diagramas y archivos fuente.",
    ],
    owner: "Knowledge Graph",
    updatedAt: "2026-07-20 09:08",
    version: "v7",
  },
  {
    id: "workflow-state-machine",
    title: "StateMachine.md",
    section: "diagramas",
    kind: "diagram",
    format: "Mermaid stateDiagram",
    status: "complete",
    summary: "Maquina de estados del flujo discover -> define -> design -> approval -> handoff.",
    sourcePath: "ACP/diagrams/StateMachine.md",
    sourceFiles: ["ACP/workflows/state-machine.yaml", "ACP/workflows/durable-workflow.yaml"],
    tags: ["state-machine", "continuity", "handoff"],
    lineage: ["Workflow modelado", "Continuity sync", "ACP export"],
    usedIn: ["Package gate", "Runtime alignment"],
    notes: ["Funciona bien como thumbnail lateral y como diagrama de detalle."],
    owner: "Workflow Engine",
    updatedAt: "2026-07-20 09:05",
    version: "v7",
  },
  {
    id: "prompt-pack",
    title: "prompt-pack.v1.json",
    section: "contratos",
    kind: "contract",
    format: "JSON",
    status: "needs_review",
    summary: "Contrato canónico para prompts generados desde la sesion aprobada.",
    sourcePath: "exports/prompt-pack.v1.json",
    sourceFiles: ["ACP/prompts/planner.md", "ACP/prompts/evaluator.md"],
    tags: ["prompt-pack", "contract", "llm"],
    lineage: ["Design aprobado", "Tools aprobadas", "Prompt pack sintetizado"],
    usedIn: ["Runtime config", "Prompt QA"],
    notes: ["Se muestra como archivo de apoyo, no como vista dominante."],
    owner: "Prompt Planner",
    updatedAt: "2026-07-20 08:57",
    version: "preview",
  },
  {
    id: "planner-prompt",
    title: "planner.md",
    section: "prompts",
    kind: "prompt",
    format: "Markdown",
    status: "complete",
    summary: "Prompt central del planner con instrucciones de retrieval gobernado y evidencia.",
    sourcePath: "ACP/prompts/planner.md",
    sourceFiles: ["ACP/prompts/planner.md"],
    tags: ["planner", "prompt", "governance"],
    lineage: ["Blueprint aprobado", "Prompt generado"],
    usedIn: ["Build handoff", "Runtime dry run"],
    notes: ["La propuesta visual lo relega a inspector y origen."],
    owner: "Prompt Builder",
    updatedAt: "2026-07-20 08:53",
    version: "v3",
  },
  {
    id: "runtime-config",
    title: "config.yaml",
    section: "runtime",
    kind: "runtime",
    format: "YAML",
    status: "complete",
    summary: "Configuracion de runtime, proveedores y canales de conocimiento activos.",
    sourcePath: "ACP/runtime/config.yaml",
    sourceFiles: ["ACP/runtime/config.yaml", "ACP/runtime/providers.yaml"],
    tags: ["runtime", "providers", "deployment"],
    lineage: ["Settings persistidos", "Runtime exportado"],
    usedIn: ["Deploy checklist", "Operational review"],
    notes: ["Debe permanecer visible como origen de diagramas y no competir con ellos."],
    owner: "Runtime Settings",
    updatedAt: "2026-07-20 08:48",
    version: "v5",
  },
];

function toneForStatus(status: ArtifactEntry["status"]) {
  return status === "complete" ? "green" : "orange";
}

function toneForKind(kind: ArtifactKind) {
  if (kind === "diagram") {
    return "violet";
  }
  if (kind === "contract") {
    return "blue";
  }
  if (kind === "runtime") {
    return "orange";
  }
  return "slate";
}

function MockSidebarItem({
  active = false,
  icon: Icon,
  label,
}: {
  active?: boolean;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <button
      type="button"
      title={label}
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-[14px] border transition",
        active
          ? "border-transparent bg-[var(--gradient-sidebar)] text-white shadow-[0_10px_20px_rgba(79,70,245,0.22)]"
          : "border-transparent text-white/72 hover:border-white/10 hover:bg-white/6 hover:text-white",
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function MockTabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-[12px] font-semibold transition",
        active
          ? "border-transparent bg-[var(--gradient-primary)] text-white shadow-[0_12px_22px_rgba(79,70,245,0.18)]"
          : "border-[var(--border-default)] bg-white text-[var(--text-secondary)]",
      )}
    >
      {children}
    </button>
  );
}

function MockDiagramStage({ mode }: { mode: CanvasMode }) {
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-[var(--border-default)] bg-[linear-gradient(180deg,#fdfdff_0%,#f5f7ff_100%)] px-6 py-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(79,70,245,0.12),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.1),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(124,58,237,0.12),transparent_28%)]" />
      <div className="relative space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-eyebrow text-[11px] text-[var(--text-muted)]">Diagram focus</p>
            <p className="mt-2 text-[18px] font-semibold text-[var(--text-primary)]">
              {mode === "visual"
                ? "Vista principal del blueprint"
                : mode === "relations"
                  ? "Relaciones entre archivos y decisiones"
                  : "Paquete exportable y archivos enlazados"}
            </p>
          </div>
          <Badge tone={mode === "visual" ? "violet" : mode === "relations" ? "blue" : "orange"}>
            {mode === "visual" ? "Diagram-first" : mode === "relations" ? "Traceability" : "Export view"}
          </Badge>
        </div>

        {mode === "visual" ? (
          <svg viewBox="0 0 820 360" className="h-[340px] w-full">
            <defs>
              <linearGradient id="nodeFill" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4f46f5" stopOpacity="0.96" />
                <stop offset="100%" stopColor="#6d4aff" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            <path d="M140 88 C240 88 240 88 320 88" stroke="#b9c1ff" strokeWidth="3" fill="none" />
            <path d="M430 88 C520 88 520 88 610 88" stroke="#b9c1ff" strokeWidth="3" fill="none" />
            <path d="M320 96 C320 170 320 170 220 228" stroke="#d9def6" strokeWidth="3" fill="none" />
            <path d="M430 96 C430 168 430 168 520 228" stroke="#d9def6" strokeWidth="3" fill="none" />
            <path d="M220 246 C320 306 320 306 430 306" stroke="#ccd6f5" strokeWidth="3" fill="none" />
            <path d="M520 246 C520 300 520 300 430 306" stroke="#ccd6f5" strokeWidth="3" fill="none" />

            <g>
              <rect x="40" y="56" rx="22" ry="22" width="100" height="64" fill="#ffffff" stroke="#d8ddf0" />
              <text x="90" y="82" textAnchor="middle" fontSize="14" fill="#667085">
                Discovery
              </text>
              <text x="90" y="102" textAnchor="middle" fontSize="12" fill="#98a2b3">
                approved
              </text>
            </g>
            <g>
              <rect x="320" y="50" rx="26" ry="26" width="110" height="78" fill="url(#nodeFill)" />
              <text x="375" y="82" textAnchor="middle" fontSize="16" fontWeight="700" fill="#ffffff">
                Diagram Hub
              </text>
              <text x="375" y="102" textAnchor="middle" fontSize="12" fill="#eef0ff">
                ArchitectureOverview
              </text>
            </g>
            <g>
              <rect x="610" y="56" rx="22" ry="22" width="128" height="64" fill="#ffffff" stroke="#d8ddf0" />
              <text x="674" y="82" textAnchor="middle" fontSize="14" fill="#667085">
                ACP Files
              </text>
              <text x="674" y="102" textAnchor="middle" fontSize="12" fill="#98a2b3">
                138 artifacts
              </text>
            </g>
            <g>
              <rect x="120" y="208" rx="22" ry="22" width="120" height="64" fill="#ffffff" stroke="#d8ddf0" />
              <text x="180" y="234" textAnchor="middle" fontSize="14" fill="#667085">
                KnowledgeGraph
              </text>
              <text x="180" y="254" textAnchor="middle" fontSize="12" fill="#98a2b3">
                graph slice
              </text>
            </g>
            <g>
              <rect x="520" y="208" rx="22" ry="22" width="120" height="64" fill="#ffffff" stroke="#d8ddf0" />
              <text x="580" y="234" textAnchor="middle" fontSize="14" fill="#667085">
                StateMachine
              </text>
              <text x="580" y="254" textAnchor="middle" fontSize="12" fill="#98a2b3">
                continuity
              </text>
            </g>
            <g>
              <rect x="352" y="286" rx="22" ry="22" width="106" height="52" fill="#ffffff" stroke="#d8ddf0" />
              <text x="405" y="317" textAnchor="middle" fontSize="13" fill="#667085">
                Build Pack
              </text>
            </g>
          </svg>
        ) : null}

        {mode === "relations" ? (
          <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[22px] border border-[var(--border-default)] bg-white/80 p-5">
              <div className="grid gap-3">
                {[
                  "ArchitectureOverview.md -> topology.yaml",
                  "KnowledgeGraph.md -> blueprint.graph.json",
                  "StateMachine.md -> state-machine.yaml",
                  "prompt-pack.v1.json -> planner.md",
                ].map((line) => (
                  <div key={line} className="flex items-center gap-3 rounded-[16px] bg-[var(--surface-subtle)] px-4 py-3">
                    <Waypoints className="h-4 w-4 text-[var(--brand-primary)]" />
                    <p className="text-[13px] text-[var(--text-primary)]">{line}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[22px] border border-[var(--border-default)] bg-[#0d1831] p-5 text-white">
              <p className="text-eyebrow text-[11px] text-white/55">Dependency density</p>
              <p className="mt-3 text-[32px] font-semibold">26 links</p>
              <p className="mt-2 text-[13px] leading-6 text-white/72">
                El mockup propone navegar por evidencia, no solo por nombre de archivo.
              </p>
              <div className="mt-5 space-y-3">
                {["Diagramas", "Prompts", "Runtime", "Contracts"].map((label, index) => (
                  <div key={label}>
                    <div className="mb-1 flex items-center justify-between text-[12px] text-white/70">
                      <span>{label}</span>
                      <span>{[88, 64, 52, 41][index]}%</span>
                    </div>
                    <ProgressBar value={[88, 64, 52, 41][index]} color={index === 0 ? "#8ea0ff" : "#64df8a"} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {mode === "exports" ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["SVG", "Diagramas listos para handoff"],
              ["Graph JSON", "Grafo completo para tooling"],
              ["Markdown", "Narrativa y notas enlazadas"],
            ].map(([title, detail]) => (
              <div key={title} className="rounded-[20px] border border-[var(--border-default)] bg-white/82 p-5">
                <p className="text-eyebrow text-[11px] text-[var(--text-muted)]">{title}</p>
                <p className="mt-3 text-[18px] font-semibold text-[var(--text-primary)]">{detail}</p>
                <p className="mt-2 text-[13px] leading-6 text-[var(--text-secondary)]">
                  Exportacion gobernada desde el mismo browser visual del blueprint.
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function InspectorContent({
  artifact,
  tab,
}: {
  artifact: ArtifactEntry;
  tab: InspectorTab;
}) {
  if (tab === "preview") {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <KeyValue label="File focus" value={artifact.title} />
          <KeyValue label="Visual priority" value={artifact.kind === "diagram" ? "Alta" : "Secundaria"} />
        </div>
        <Panel className="border-[var(--border-default)] bg-[var(--surface-subtle)] p-4">
          <p className="text-[13px] font-medium text-[var(--text-primary)]">{artifact.summary}</p>
          <p className="mt-3 text-[12px] leading-6 text-[var(--text-secondary)]">
            La biblioteca propuesta hace que el contenido visual sea el entrypoint principal y relega el texto largo a contexto.
          </p>
        </Panel>
      </div>
    );
  }

  if (tab === "origin") {
    return (
      <div className="space-y-3">
        {artifact.sourceFiles.map((item) => (
          <div key={item} className="rounded-[16px] border border-[var(--border-default)] px-4 py-3">
            <p className="text-[13px] font-medium text-[var(--text-primary)]">{item}</p>
            <p className="mt-1 text-[12px] text-[var(--text-secondary)]">Fuente visible del artefacto seleccionado</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <KeyValue label="Owner" value={artifact.owner} />
      <KeyValue label="Version" value={artifact.version} />
      <KeyValue label="Updated" value={artifact.updatedAt} />
      <KeyValue label="Source path" value={artifact.sourcePath} />
    </div>
  );
}

export function BlueprintLibraryMockupPage() {
  const [selectedArtifactId, setSelectedArtifactId] = useState<string>(ARTIFACTS[0].id);
  const [canvasMode, setCanvasMode] = useState<CanvasMode>("visual");
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("preview");

  const selectedArtifact = ARTIFACTS.find((item) => item.id === selectedArtifactId) ?? ARTIFACTS[0];
  const groupedArtifacts = useMemo(() => {
    return ARTIFACTS.reduce<Record<ArtifactSection, ArtifactEntry[]>>(
      (accumulator, artifact) => {
        accumulator[artifact.section].push(artifact);
        return accumulator;
      },
      {
        contratos: [],
        diagramas: [],
        prompts: [],
        runtime: [],
      },
    );
  }, []);

  return (
    <div className="min-h-screen bg-[#07152c] px-2 py-3 text-white lg:px-3">
      <div className="mx-auto flex min-h-[calc(100vh-24px)] max-w-[1860px] gap-3 rounded-[34px] border border-white/10 bg-[#07152c] p-3">
        <aside className="sidebar-sheen hidden w-[92px] flex-col justify-between rounded-[26px] border border-white/6 p-4 lg:flex">
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-[14px] bg-[var(--gradient-primary)] shadow-[0_12px_24px_rgba(79,70,245,0.28)]">
                <Sparkles className="h-5 w-5 text-white" />
                <span className="absolute inset-0 rounded-[14px] border border-white/25" />
              </div>
            </div>
            <div className="space-y-3">
              {SIDEBAR_ITEMS.map((item) => (
                <MockSidebarItem key={item.label} active={item.active} icon={item.icon} label={item.label} />
              ))}
            </div>
            <div className="rounded-[18px] border border-white/8 bg-white/6 px-3 py-4">
              <p className="text-eyebrow text-[10px] text-white/45">Mockup</p>
              <p className="mt-2 text-[14px] font-medium text-white">Blueprint browser</p>
            </div>
          </div>
          <div className="space-y-3">
            {[Compass, Bell].map((Icon, index) => (
              <button
                key={index}
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-transparent text-white/72 transition hover:bg-white/6 hover:text-white"
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/35 bg-[#040d1d] text-[15px] font-medium">
              LB
            </div>
          </div>
        </aside>

        <main className="flex-1 rounded-[28px] bg-[var(--surface-canvas)] text-[var(--text-primary)]">
          <PageChrome
            breadcrumbs={["Mockups", "Biblioteca", "Blueprint browser diagram-first"]}
            actions={
              <>
                <Badge tone="violet">Concept</Badge>
                <TopUtilities />
              </>
            }
          >
            <div className="space-y-6">
              <div className="grid gap-4 xl:grid-cols-[1.4fr_repeat(3,minmax(0,0.7fr))]">
                <Panel className="p-6">
                  <p className="text-eyebrow text-[11px] text-[var(--text-muted)]">Mockup objective</p>
                  <h1 className="mt-3 text-[34px] font-semibold leading-tight text-[var(--text-primary)]">
                    Mostrar archivos del blueprint como una biblioteca visual donde los diagramas lideran la lectura.
                  </h1>
                  <p className="mt-3 max-w-3xl text-[14px] leading-7 text-[var(--text-secondary)]">
                    El browser deja de ser solo una tabla. Pasa a ser un escenario maestro-detalle con explorer, gran canvas visual y
                    trazabilidad lateral.
                  </p>
                </Panel>
                <Panel className="p-5">
                  <KeyValue label="Archivos blueprint" value="138" hint="ACP + exports + evidencia" />
                </Panel>
                <Panel className="p-5">
                  <KeyValue label="Diagramas premium" value="12" hint="Mermaid, graph y SVG" />
                </Panel>
                <Panel className="p-5">
                  <KeyValue label="Cobertura visual" value="93%" hint="Readiness del paquete" />
                </Panel>
              </div>

              <Panel className="p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex flex-1 items-center gap-3 rounded-[18px] border border-[var(--border-default)] bg-white px-4 py-3">
                    <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Search</span>
                    <div className="h-4 w-px bg-[var(--border-default)]" />
                    <input
                      readOnly
                      value="diagramas architecture workflow knowledge graph"
                      className="w-full bg-transparent text-[14px] text-[var(--text-primary)] outline-none"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="violet">Solo diagramas</Badge>
                    <Badge tone="blue">Mermaid + graph</Badge>
                    <Badge tone="orange">Ultima version</Badge>
                    <Badge tone="green">Trazabilidad completa</Badge>
                  </div>
                </div>
              </Panel>

              <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1.1fr)_380px]">
                <Panel className="p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-[18px] font-semibold text-[var(--text-primary)]">Explorer</p>
                      <p className="text-[13px] text-[var(--text-secondary)]">Archivos agrupados por dominio</p>
                    </div>
                    <Badge tone="slate">diagram-first</Badge>
                  </div>

                  <div className="space-y-5">
                    {(Object.keys(groupedArtifacts) as ArtifactSection[]).map((section) => (
                      <div key={section} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-eyebrow text-[11px] text-[var(--text-muted)]">{SECTION_LABELS[section]}</p>
                          <span className="text-[11px] text-[var(--text-muted)]">{groupedArtifacts[section].length}</span>
                        </div>
                        <div className="space-y-2">
                          {groupedArtifacts[section].map((artifact) => (
                            <button
                              key={artifact.id}
                              type="button"
                              onClick={() => setSelectedArtifactId(artifact.id)}
                              className={cn(
                                "w-full rounded-[18px] border px-4 py-3 text-left transition",
                                artifact.id === selectedArtifact.id
                                  ? "border-[rgba(79,70,245,0.18)] bg-[var(--brand-soft)] shadow-[0_14px_24px_rgba(79,70,245,0.08)]"
                                  : "border-[var(--border-default)] bg-white hover:border-[rgba(79,70,245,0.16)]",
                              )}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <p className="text-[14px] font-semibold text-[var(--text-primary)]">{artifact.title}</p>
                                  <p className="text-[12px] leading-5 text-[var(--text-secondary)]">{artifact.summary}</p>
                                </div>
                                <ChevronRight className="mt-0.5 h-4 w-4 text-[var(--text-muted)]" />
                              </div>
                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                <Badge tone={toneForKind(artifact.kind)}>{artifact.kind}</Badge>
                                <Badge tone={toneForStatus(artifact.status)}>{artifact.status}</Badge>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>

                <div className="space-y-5">
                  <Panel className="p-6">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <p className="text-eyebrow text-[11px] text-[var(--text-muted)]">{selectedArtifact.sourcePath}</p>
                        <h2 className="mt-2 text-[28px] font-semibold text-[var(--text-primary)]">{selectedArtifact.title}</h2>
                        <p className="mt-2 max-w-3xl text-[14px] leading-7 text-[var(--text-secondary)]">{selectedArtifact.summary}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={toneForKind(selectedArtifact.kind)}>{selectedArtifact.format}</Badge>
                        <Badge tone={toneForStatus(selectedArtifact.status)}>{selectedArtifact.status}</Badge>
                        <AppButton variant="primary" icon={<Download className="h-4 w-4" />}>
                          Exportar
                        </AppButton>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2">
                      <MockTabButton active={canvasMode === "visual"} onClick={() => setCanvasMode("visual")}>
                        Visual
                      </MockTabButton>
                      <MockTabButton active={canvasMode === "relations"} onClick={() => setCanvasMode("relations")}>
                        Relaciones
                      </MockTabButton>
                      <MockTabButton active={canvasMode === "exports"} onClick={() => setCanvasMode("exports")}>
                        Exports
                      </MockTabButton>
                    </div>

                    <div className="mt-5">
                      <MockDiagramStage mode={canvasMode} />
                    </div>
                  </Panel>

                  <div className="grid gap-4 md:grid-cols-3">
                    {ARTIFACTS.filter((artifact) => artifact.kind === "diagram")
                      .slice(0, 3)
                      .map((artifact) => (
                        <button
                          key={artifact.id}
                          type="button"
                          onClick={() => setSelectedArtifactId(artifact.id)}
                          className={cn(
                            "rounded-[20px] border px-5 py-4 text-left transition",
                            artifact.id === selectedArtifact.id
                              ? "border-[rgba(79,70,245,0.2)] bg-[var(--brand-soft)]"
                              : "border-[var(--border-default)] bg-white hover:-translate-y-0.5",
                          )}
                        >
                          <p className="text-[15px] font-semibold text-[var(--text-primary)]">{artifact.title}</p>
                          <p className="mt-2 text-[12px] leading-6 text-[var(--text-secondary)]">{artifact.summary}</p>
                        </button>
                      ))}
                  </div>
                </div>

                <div className="space-y-5">
                  <Panel className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[18px] font-semibold text-[var(--text-primary)]">Inspector</p>
                        <p className="text-[13px] text-[var(--text-secondary)]">Vista previa, origen y metadata</p>
                      </div>
                      <Badge tone="blue">Persistent rail</Badge>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <MockTabButton active={inspectorTab === "preview"} onClick={() => setInspectorTab("preview")}>
                        Vista previa
                      </MockTabButton>
                      <MockTabButton active={inspectorTab === "origin"} onClick={() => setInspectorTab("origin")}>
                        Origen
                      </MockTabButton>
                      <MockTabButton active={inspectorTab === "metadata"} onClick={() => setInspectorTab("metadata")}>
                        Metadata
                      </MockTabButton>
                    </div>

                    <div className="mt-5">
                      <InspectorContent artifact={selectedArtifact} tab={inspectorTab} />
                    </div>
                  </Panel>

                  <Panel className="p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <Waypoints className="h-5 w-5 text-[var(--brand-primary)]" />
                      <p className="text-[16px] font-semibold text-[var(--text-primary)]">Lineage flow</p>
                    </div>
                    <div className="space-y-3">
                      {selectedArtifact.lineage.map((item, index) => (
                        <div key={item} className="flex items-start gap-3">
                          <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[11px] font-semibold text-[var(--brand-primary)]">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-[13px] font-medium text-[var(--text-primary)]">{item}</p>
                            <p className="mt-1 text-[12px] text-[var(--text-secondary)]">Evento relevante dentro de la cadena de construccion.</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Panel>

                  <Panel className="p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <FileStack className="h-5 w-5 text-[var(--brand-primary)]" />
                      <p className="text-[16px] font-semibold text-[var(--text-primary)]">Used in</p>
                    </div>
                    <div className="space-y-2">
                      {selectedArtifact.usedIn.map((item) => (
                        <div key={item} className="rounded-[16px] border border-[var(--border-default)] px-4 py-3">
                          <p className="text-[13px] font-medium text-[var(--text-primary)]">{item}</p>
                        </div>
                      ))}
                    </div>
                  </Panel>

                  <Panel className="p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <History className="h-5 w-5 text-[var(--brand-primary)]" />
                      <p className="text-[16px] font-semibold text-[var(--text-primary)]">Notes and tags</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedArtifact.tags.map((tag) => (
                        <Badge key={tag} tone="slate">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-4 space-y-3">
                      {selectedArtifact.notes.map((note) => (
                        <div key={note} className="rounded-[16px] border border-[var(--border-default)] bg-[var(--surface-subtle)] px-4 py-3">
                          <p className="text-[12px] leading-6 text-[var(--text-secondary)]">{note}</p>
                        </div>
                      ))}
                    </div>
                  </Panel>
                </div>
              </div>
            </div>
          </PageChrome>
        </main>
      </div>
    </div>
  );
}
