"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import {
  Brain,
  Boxes,
  CheckCircle2,
  Download,
  Eye,
  FileDown,
  FileText,
  GitBranch,
  Lock,
  Network,
  Route,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react";
import { AppButton, Badge, KeyValue, Panel, ProgressBar, SimpleTable } from "@/components/lean/ui";
import {
  BLUEPRINT_RESULT_DIAGRAMS,
  buildBlueprintArtifactHighlights,
  buildBlueprintComparisonSummary,
  resolveBlueprintProfessionalDownloadState,
  resolveBlueprintDiagramPreviewState,
  resolveBlueprintResultAccess,
  type BlueprintDiagramPreview,
  type BlueprintDiagramPreviewState,
  type BlueprintResultAccessState,
  type BlueprintComparisonSummary,
} from "@/features/blueprint/blueprint-results-adapter";
import { formatCurrency } from "@/features/operations/operations-adapter";
import type { EstimationReportArtifact } from "@/features/sessions/session-contracts";
import type { CommercialTier, SessionCommercialAccess, SessionSnapshot } from "@/features/sessions/types";
import { cn } from "@/lib/utils";

const ACCESS_LABELS: Record<BlueprintResultAccessState, string> = {
  acp_unlocked: "ACP Premium activo",
  free_view_only: "Blueprint gratuito - solo plataforma",
  professional_unlocked: "Blueprint Profesional activo",
};

const DIAGRAM_ACCESS_LABELS: Record<BlueprintDiagramPreviewState, string> = {
  locked_acp: "ACP",
  locked_blueprint: "Blueprint Pro",
  sample: "Muestra",
  unlocked: "Disponible",
};

const DIAGRAM_ACCESS_TONES: Record<BlueprintDiagramPreviewState, "blue" | "green" | "slate" | "violet"> = {
  locked_acp: "violet",
  locked_blueprint: "slate",
  sample: "blue",
  unlocked: "green",
};

const DIAGRAM_ICONS: Record<string, typeof Network> = {
  architecture_overview: Network,
  agent_orchestration: Workflow,
  evaluation_test_suite: ShieldCheck,
  knowledge_graph: GitBranch,
  memory_rag_architecture: Brain,
  runtime_workflow: Route,
  security_guardrails: ShieldCheck,
  tool_capability_map: Boxes,
};

const BLUEPRINT_PRO_DELIVERABLES = [
  "Arquitectura propuesta, objetivos, alcance y reglas de negocio.",
  "Diseno funcional, patrones agentivos, herramientas y contratos.",
  "Estrategia de memoria, conocimiento, RAG e integraciones requeridas.",
  "Roadmap, estimacion de esfuerzo/costo y narrativa comercial de decision.",
];

const BLUEPRINT_PRO_EXCLUSIONS = [
  "No incluye Test Suite ACP.",
  "No incluye Prompt Pack ejecutable.",
  "No incluye paquete de construccion premium.",
];

type BlueprintActionState = "idle" | "submitting" | "error" | "success";

function formatHours(value?: number | null) {
  return `${(value ?? 0).toFixed(1)} h`;
}

function formatWeeks(value?: number | null) {
  return `${(value ?? 0).toFixed(1)} sem`;
}

function formatPercent(value?: number | null) {
  return `${Math.round(value ?? 0)}%`;
}

function getArtifactTone(status: "partial" | "pending" | "ready") {
  if (status === "ready") {
    return "green" as const;
  }
  if (status === "partial") {
    return "orange" as const;
  }
  return "slate" as const;
}

function getDiagramProductLabel(diagram: BlueprintDiagramPreview) {
  if (diagram.product === "shared") {
    return "Blueprint + ACP";
  }
  return diagram.product === "acp" ? "ACP" : "Blueprint";
}

function BlueprintProfessionalAcquisitionPanel({
  access,
  comparison,
  downloadMessage,
  downloadState = "idle",
  onAcquireBlueprintPro,
  onDownloadBlueprint,
  purchaseState,
}: {
  access?: SessionCommercialAccess | null;
  comparison: BlueprintComparisonSummary | null;
  downloadMessage?: string | null;
  downloadState?: BlueprintActionState;
  onAcquireBlueprintPro?: () => void;
  onDownloadBlueprint?: () => void;
  purchaseState?: CommercialTier | null;
}) {
  const downloadGate = resolveBlueprintProfessionalDownloadState(access);
  const isBuying = purchaseState === "blueprint_pro";
  const isDownloading = downloadState === "submitting";
  const canPurchase = downloadGate.reason === "requires_purchase" && Boolean(onAcquireBlueprintPro);
  const canDownload = downloadGate.allowed && Boolean(onDownloadBlueprint);

  return (
    <Panel className="overflow-hidden border-[rgba(15,118,110,0.16)] p-0">
      <div className="bg-[linear-gradient(135deg,#effdf7_0%,#f8fbff_50%,#fff7ed_100%)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#0f766e] text-white shadow-[0_18px_36px_rgba(15,118,110,0.18)]">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0f766e]">Producto 1</p>
              <p className="text-[18px] font-semibold text-[var(--text-primary)]">Blueprint Profesional</p>
            </div>
          </div>
          <Badge tone={downloadGate.allowed ? "green" : "orange"}>{downloadGate.label}</Badge>
        </div>

        <p className="mt-4 text-[13px] leading-6 text-[var(--text-secondary)]">
          Desbloquea el documento profesional para presentar, decidir y planear la implementacion sin mezclar artefactos
          premium del ACP.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[18px] border border-white/80 bg-white/70 p-4">
            <p className="text-[12px] text-[var(--text-secondary)]">Ahorro estimado</p>
            <p className="mt-1 text-[26px] font-semibold text-[var(--text-primary)]">
              {comparison ? `${comparison.costSavingsPercent}%` : "Pendiente"}
            </p>
          </div>
          <div className="rounded-[18px] border border-white/80 bg-white/70 p-4">
            <p className="text-[12px] text-[var(--text-secondary)]">Menos esfuerzo</p>
            <p className="mt-1 text-[26px] font-semibold text-[var(--text-primary)]">
              {comparison ? `${comparison.effortReductionPercent}%` : "Pendiente"}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="space-y-2">
          {BLUEPRINT_PRO_DELIVERABLES.map((item) => (
            <div key={item} className="flex gap-3 text-[12px] leading-5 text-[var(--text-secondary)]">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0f766e]" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        <div className="rounded-[18px] border border-[var(--border-default)] bg-[var(--surface-muted)] p-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Separacion comercial
          </p>
          <div className="mt-3 space-y-2">
            {BLUEPRINT_PRO_EXCLUSIONS.map((item) => (
              <p key={item} className="text-[12px] leading-5 text-[var(--text-secondary)]">
                {item}
              </p>
            ))}
          </div>
        </div>

        <p className="text-[12px] leading-5 text-[var(--text-secondary)]">{downloadGate.detail}</p>

        <div className="grid gap-3">
          {downloadGate.reason === "requires_purchase" ? (
            <AppButton
              icon={<Download className="h-4 w-4" />}
              loading={isBuying}
              loadingLabel="Activando..."
              onClick={onAcquireBlueprintPro}
              variant="primary"
              disabled={!canPurchase}
            >
              Adquirir Blueprint Profesional
            </AppButton>
          ) : (
            <AppButton
              icon={<FileDown className="h-4 w-4" />}
              loading={isDownloading}
              loadingLabel="Descargando..."
              onClick={onDownloadBlueprint}
              variant="primary"
              disabled={!canDownload}
            >
              Descargar Blueprint Profesional
            </AppButton>
          )}
        </div>

        {downloadMessage ? (
          <div
            className={cn(
              "rounded-[16px] border px-4 py-3 text-[12px] leading-5",
              downloadState === "error"
                ? "border-[rgba(239,68,68,0.22)] bg-[rgba(239,68,68,0.06)] text-[var(--danger)]"
                : "border-[rgba(15,118,110,0.18)] bg-[rgba(20,184,166,0.08)] text-[#0f766e]",
            )}
          >
            {downloadMessage}
          </div>
        ) : null}
      </div>
    </Panel>
  );
}

function ProtectedBlueprintSurface({
  children,
  isProtected,
}: {
  children: ReactNode;
  isProtected: boolean;
}) {
  const [notice, setNotice] = useState<string | null>(null);

  function handleProtectedAction() {
    if (!isProtected) {
      return;
    }
    setNotice("Contenido protegido: el Blueprint gratuito solo puede visualizarse dentro de la plataforma.");
  }

  return (
    <div
      className={cn("relative", isProtected && "select-none")}
      draggable={false}
      onContextMenu={(event) => {
        if (!isProtected) {
          return;
        }
        event.preventDefault();
        handleProtectedAction();
      }}
      onCopy={(event) => {
        if (!isProtected) {
          return;
        }
        event.preventDefault();
        handleProtectedAction();
      }}
      onCut={(event) => {
        if (!isProtected) {
          return;
        }
        event.preventDefault();
        handleProtectedAction();
      }}
      onDragStart={(event) => {
        if (!isProtected) {
          return;
        }
        event.preventDefault();
        handleProtectedAction();
      }}
    >
      {children}
      {isProtected ? (
        <div className="pointer-events-none absolute right-4 top-4 z-20 rounded-full border border-[rgba(15,118,110,0.18)] bg-white/86 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#0f766e] shadow-[0_18px_36px_rgba(15,23,42,0.08)] backdrop-blur">
          Solo plataforma
        </div>
      ) : null}
      {notice ? (
        <div className="absolute bottom-4 left-4 right-4 z-20 rounded-[16px] border border-[rgba(245,158,11,0.22)] bg-[var(--warning-soft)] px-4 py-3 text-[13px] leading-6 text-[var(--warning)]">
          {notice}
        </div>
      ) : null}
    </div>
  );
}

function ArchitectureSampleDiagram({
  locked,
}: {
  locked: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-[rgba(15,23,42,0.08)] bg-[linear-gradient(135deg,#f8fbff_0%,#edf7f4_48%,#fff8ec_100%)] p-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(20,184,166,0.18),transparent_30%),radial-gradient(circle_at_82%_16%,rgba(14,165,233,0.16),transparent_32%),radial-gradient(circle_at_58%_92%,rgba(245,158,11,0.12),transparent_28%)]" />
      <svg className="relative h-[330px] w-full" viewBox="0 0 860 360" role="img" aria-label="Muestra protegida de arquitectura Blueprint">
        <defs>
          <linearGradient id="blueprintHub" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#0f766e" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
          <filter id="softShadow" colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="#0f172a" floodOpacity="0.14" />
          </filter>
        </defs>
        <rect x="32" y="38" width="796" height="274" rx="34" fill="rgba(255,255,255,0.62)" stroke="rgba(15,23,42,0.08)" />
        <g filter="url(#softShadow)">
          <rect x="332" y="116" width="196" height="108" rx="28" fill="url(#blueprintHub)" />
          <text x="430" y="160" textAnchor="middle" fill="#ffffff" fontSize="18" fontWeight="700">
            Agente IA
          </text>
          <text x="430" y="186" textAnchor="middle" fill="rgba(255,255,255,0.78)" fontSize="12" fontWeight="600">
            Orquestacion + memoria
          </text>
        </g>
        {[
          { label: "Usuario", sub: "Necesidad", x: 70, y: 132 },
          { label: "Herramientas", sub: "Capacidades", x: 608, y: 70 },
          { label: "Conocimiento", sub: "RAG", x: 610, y: 218 },
          { label: "Humano", sub: "Approval gates", x: 118, y: 236 },
        ].map((node) => (
          <g key={node.label} filter="url(#softShadow)">
            <rect x={node.x} y={node.y} width="158" height="72" rx="22" fill="#ffffff" stroke="rgba(15,23,42,0.08)" />
            <text x={node.x + 79} y={node.y + 32} textAnchor="middle" fill="#0f172a" fontSize="14" fontWeight="700">
              {node.label}
            </text>
            <text x={node.x + 79} y={node.y + 52} textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="600">
              {node.sub}
            </text>
          </g>
        ))}
        <path d="M228 168 C270 168 292 168 332 168" stroke="#0f766e" strokeWidth="3" strokeLinecap="round" />
        <path d="M528 152 C570 118 574 106 608 106" stroke="#0f766e" strokeWidth="3" strokeLinecap="round" />
        <path d="M528 188 C572 220 576 238 610 254" stroke="#0f766e" strokeWidth="3" strokeLinecap="round" />
        <path d="M332 198 C276 238 250 256 276 272" stroke="#0f766e" strokeWidth="3" strokeLinecap="round" />
        <circle cx="332" cy="168" r="5" fill="#0f766e" />
        <circle cx="528" cy="152" r="5" fill="#0f766e" />
        <circle cx="528" cy="188" r="5" fill="#0f766e" />
      </svg>
      {locked ? (
        <div className="absolute inset-x-8 bottom-8 rounded-[20px] border border-white/70 bg-white/80 px-5 py-4 shadow-[0_22px_52px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-[#0f766e]" />
            <p className="text-[14px] font-semibold text-[var(--text-primary)]">Muestra protegida del Blueprint</p>
          </div>
          <p className="mt-2 text-[12px] leading-5 text-[var(--text-secondary)]">
            La version completa incluye diagramas de orquestacion, herramientas, memoria, flujo, conocimiento y seguridad.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function DiagramPreviewRow({
  access,
  diagram,
}: {
  access?: SessionCommercialAccess | null;
  diagram: BlueprintDiagramPreview;
}) {
  const state = resolveBlueprintDiagramPreviewState(diagram, access);
  const Icon = DIAGRAM_ICONS[diagram.diagramKey] ?? FileText;

  return (
    <div className="rounded-[18px] border border-[var(--border-default)] bg-white px-4 py-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] border border-[rgba(15,118,110,0.14)] bg-[rgba(20,184,166,0.08)] text-[#0f766e]">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[14px] font-semibold text-[var(--text-primary)]">{diagram.title}</p>
            <Badge tone={DIAGRAM_ACCESS_TONES[state]}>{DIAGRAM_ACCESS_LABELS[state]}</Badge>
          </div>
          <p className="mt-1 text-[12px] leading-5 text-[var(--text-secondary)]">{diagram.valueStory}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone={diagram.product === "acp" ? "violet" : "blue"}>{getDiagramProductLabel(diagram)}</Badge>
            <Badge tone="slate">{diagram.category}</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BlueprintResultsShowcase({
  access,
  downloadMessage,
  downloadState,
  onAcquireBlueprintPro,
  onDownloadBlueprint,
  onExploreAcp,
  onExploreDiagrams,
  purchaseState,
  report,
  snapshot,
}: {
  access?: SessionCommercialAccess | null;
  downloadMessage?: string | null;
  downloadState?: BlueprintActionState;
  onAcquireBlueprintPro?: () => void;
  onDownloadBlueprint?: () => void;
  onExploreAcp?: () => void;
  onExploreDiagrams?: () => void;
  purchaseState?: CommercialTier | null;
  report?: EstimationReportArtifact | null;
  snapshot: SessionSnapshot;
}) {
  const blueprint = snapshot.blueprint;
  const resultAccess = resolveBlueprintResultAccess(access);
  const copyProtected = resultAccess === "free_view_only";
  const highlights = buildBlueprintArtifactHighlights(blueprint);
  const comparison = buildBlueprintComparisonSummary(report);
  const blueprintCoverage = report?.agentic.blueprint_design_coverage_percent ?? 0;
  const diagramUnlockCount = BLUEPRINT_RESULT_DIAGRAMS.filter(
    (item) => resolveBlueprintDiagramPreviewState(item, access) === "unlocked" || resolveBlueprintDiagramPreviewState(item, access) === "sample",
  ).length;

  return (
    <Panel className="overflow-hidden p-0">
      <ProtectedBlueprintSurface isProtected={copyProtected}>
        <div className="border-b border-[var(--border-default)] bg-[linear-gradient(135deg,#07152c_0%,#0f2f36_48%,#11243e_100%)] px-6 py-7 text-white">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={resultAccess === "free_view_only" ? "blue" : "green"}>{ACCESS_LABELS[resultAccess]}</Badge>
            <Badge tone="slate">Producto 1</Badge>
            {copyProtected ? <Badge tone="orange">Sin copia ni descarga</Badge> : <Badge tone="green">Exportables permitidos</Badge>}
          </div>
          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <p className="text-[34px] font-semibold leading-tight">Tu Blueprint ya cuenta la historia completa del agente.</p>
              <p className="mt-3 max-w-3xl text-[15px] leading-7 text-white/74">
                Esta vista muestra el valor generado antes de comprar: arquitectura, patrones, herramientas, memoria,
                conocimiento, diagramas y ROI. En el plan gratuito se visualiza en plataforma; la descarga se desbloquea
                con Blueprint Profesional.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <AppButton
                  icon={<Download className="h-4 w-4" />}
                  loading={purchaseState === "blueprint_pro"}
                  loadingLabel="Activando..."
                  onClick={onAcquireBlueprintPro}
                  variant="primary"
                  disabled={resultAccess !== "free_view_only" || !onAcquireBlueprintPro}
                >
                  {resultAccess === "free_view_only" ? "Adquirir Blueprint Profesional" : "Blueprint Pro activo"}
                </AppButton>
                <AppButton className="border-white/12 bg-white/8 text-white hover:bg-white/12" onClick={onExploreAcp}>
                  Explorar valor del ACP
                </AppButton>
              </div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/8 p-5">
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/54">Valor del diseno</p>
              <p className="mt-3 text-[42px] font-semibold">{formatPercent(blueprintCoverage)}</p>
              <ProgressBar value={blueprintCoverage} className="mt-4 bg-white/14" color="#14b8a6" />
              <p className="mt-4 text-[13px] leading-6 text-white/70">
                Cobertura comercial del Blueprint para explicar, vender y aprobar la solucion antes de construir.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="space-y-5 p-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <KeyValue label="Arquitectura" value={blueprint?.architecture ?? "Pendiente"} />
              <KeyValue label="Razonamiento" value={blueprint?.reasoning_pattern ?? "Pendiente"} />
              <KeyValue label="Herramientas" value={`${blueprint?.tools.length ?? 0}`} />
              <KeyValue label="Diagramas visibles" value={`${diagramUnlockCount}/${BLUEPRINT_RESULT_DIAGRAMS.length}`} />
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
              <ArchitectureSampleDiagram locked={copyProtected} />
              <div className="space-y-4">
                <Panel className="border-[rgba(20,184,166,0.16)] bg-[rgba(20,184,166,0.06)] p-5">
                  <div className="flex items-center gap-3">
                    <Eye className="h-5 w-5 text-[#0f766e]" />
                    <p className="text-[16px] font-semibold text-[var(--text-primary)]">Muestra visual autorizada</p>
                  </div>
                  <p className="mt-3 text-[13px] leading-6 text-[var(--text-secondary)]">
                    El usuario ve la arquitectura propuesta como prueba de valor. Los diagramas detallados permanecen
                    listados pero protegidos hasta adquirir Blueprint Pro o ACP.
                  </p>
                </Panel>
                <Panel className="p-5">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-[var(--brand-primary)]" />
                    <p className="text-[16px] font-semibold text-[var(--text-primary)]">Que se vende aqui</p>
                  </div>
                  <p className="mt-3 text-[13px] leading-6 text-[var(--text-secondary)]">
                    Claridad de diseno, reduccion de incertidumbre, alineacion tecnica/comercial y evidencia para decidir
                    si conviene pasar a implementacion o comprar el ACP.
                  </p>
                </Panel>
              </div>
            </div>

            <Panel className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[18px] font-semibold text-[var(--text-primary)]">Artefactos incluidos en el resultado Blueprint</p>
                  <p className="mt-2 text-[13px] leading-6 text-[var(--text-secondary)]">
                    Inventario visible del diseno generado. En modo gratuito funciona como lectura protegida dentro de la plataforma.
                  </p>
                </div>
                <Badge tone="green">Diseno integral</Badge>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {highlights.map((item) => (
                  <div key={item.key} className="rounded-[18px] border border-[var(--border-default)] bg-white px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[14px] font-semibold text-[var(--text-primary)]">{item.title}</p>
                      <Badge tone={getArtifactTone(item.status)}>{item.status === "ready" ? "Listo" : item.status === "partial" ? "Parcial" : "Pendiente"}</Badge>
                    </div>
                    <p className="mt-2 text-[12px] leading-5 text-[var(--text-secondary)]">{item.detail}</p>
                  </div>
                ))}
              </div>
            </Panel>

            {comparison ? (
              <Panel className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[18px] font-semibold text-[var(--text-primary)]">Comparativa: construir sin Blueprint vs con Blueprint</p>
                    <p className="mt-2 text-[13px] leading-6 text-[var(--text-secondary)]">
                      Esta comparacion evidencia el valor del Producto 1 sin mezclarlo con ACP. El ACP queda como ahorro adicional premium.
                    </p>
                  </div>
                  <Badge tone="blue">{formatPercent(comparison.effortReductionPercent)} menos esfuerzo</Badge>
                </div>
                <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_1fr_260px]">
                  <div className="rounded-[20px] border border-[var(--border-default)] bg-white p-5">
                    <p className="text-[13px] text-[var(--text-secondary)]">Escenario base</p>
                    <p className="mt-2 text-[18px] font-semibold text-[var(--text-primary)]">{comparison.traditional.label}</p>
                    <div className="mt-4 grid gap-3">
                      <KeyValue label="Horas" value={formatHours(comparison.traditional.estimated_hours_total)} />
                      <KeyValue label="Duracion" value={formatWeeks(comparison.traditional.estimated_duration_weeks)} />
                      <KeyValue label="Costo" value={formatCurrency(comparison.traditional.estimated_cost)} />
                    </div>
                  </div>
                  <div className="rounded-[20px] border border-[rgba(20,184,166,0.2)] bg-[rgba(20,184,166,0.06)] p-5">
                    <p className="text-[13px] text-[var(--text-secondary)]">Con Blueprint</p>
                    <p className="mt-2 text-[18px] font-semibold text-[var(--text-primary)]">{comparison.blueprintAssisted.label}</p>
                    <div className="mt-4 grid gap-3">
                      <KeyValue label="Horas" value={formatHours(comparison.blueprintAssisted.estimated_hours_total)} />
                      <KeyValue label="Duracion" value={formatWeeks(comparison.blueprintAssisted.estimated_duration_weeks)} />
                      <KeyValue label="Costo" value={formatCurrency(comparison.blueprintAssisted.estimated_cost)} />
                    </div>
                  </div>
                  <div className="rounded-[20px] border border-[rgba(37,99,235,0.18)] bg-[rgba(37,99,235,0.06)] p-5">
                    <p className="text-[13px] text-[var(--text-secondary)]">Beneficio estimado</p>
                    <p className="mt-2 text-[34px] font-semibold text-[var(--text-primary)]">
                      {formatPercent(comparison.costSavingsPercent)}
                    </p>
                    <p className="mt-2 text-[13px] leading-6 text-[var(--text-secondary)]">
                      Ahorro de costo estimado por reducir discovery tecnico, redisenos y ambiguedades.
                    </p>
                  </div>
                </div>
              </Panel>
            ) : null}
          </div>

          <div className="space-y-5 border-l border-[var(--border-default)] bg-[var(--surface-muted)] p-6">
            <BlueprintProfessionalAcquisitionPanel
              access={access}
              comparison={comparison}
              downloadMessage={downloadMessage}
              downloadState={downloadState}
              onAcquireBlueprintPro={onAcquireBlueprintPro}
              onDownloadBlueprint={onDownloadBlueprint}
              purchaseState={purchaseState}
            />

            <Panel className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[16px] font-semibold text-[var(--text-primary)]">Catalogo de diagramas</p>
                  <p className="mt-1 text-[12px] text-[var(--text-secondary)]">Todo el valor visible, contenido gobernado.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-[var(--brand-primary)]" />
                  <AppButton className="h-10 px-3 text-[12px]" onClick={onExploreDiagrams} disabled={!onExploreDiagrams}>
                    Abrir visor
                  </AppButton>
                </div>
              </div>
              <div className="mt-4 max-h-[560px] space-y-3 overflow-y-auto pr-2 [scrollbar-gutter:stable]">
                {BLUEPRINT_RESULT_DIAGRAMS.map((diagram) => (
                  <DiagramPreviewRow key={diagram.diagramKey} access={access} diagram={diagram} />
                ))}
              </div>
            </Panel>

            <Panel className="p-5">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-[var(--text-secondary)]" />
                <p className="text-[16px] font-semibold text-[var(--text-primary)]">Proteccion comercial</p>
              </div>
              <SimpleTable
                columns={["Activo", "Estado"]}
                rows={[
                  ["Copiar contenido", copyProtected ? "Bloqueado" : "Permitido"],
                  ["Menu contextual", copyProtected ? "Bloqueado" : "Permitido"],
                  ["Descarga Blueprint", access?.can_download_blueprint ? "Habilitada" : "Requiere Pro"],
                  ["Diagramas ACP", access?.can_view_diagram_acp ? "Habilitados" : "Requiere ACP"],
                ]}
              />
            </Panel>
          </div>
        </div>
      </ProtectedBlueprintSurface>
    </Panel>
  );
}
