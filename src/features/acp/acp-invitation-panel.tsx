"use client";

import {
  ArrowLeft,
  Boxes,
  CheckCircle2,
  FileQuestion,
  Gauge,
  GitBranch,
  Lock,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  TestTube2,
  Workflow,
} from "lucide-react";
import { AppButton, Badge, KeyValue, Panel, ProgressBar, SimpleTable } from "@/components/lean/ui";
import { formatCurrency } from "@/features/operations/operations-adapter";
import type { AcpGateState, AcpInvitationMetrics } from "@/features/acp/acp-invitation-adapter";

type AcpInvitationActionState = "idle" | "submitting" | "error";

const VALUE_BLOCKS = [
  {
    icon: ShieldCheck,
    title: "Validacion del Blueprint",
    text: "Convierte el diseno en escenarios, gates y criterios verificables antes de construir.",
  },
  {
    icon: TestTube2,
    title: "Test Suite",
    text: "Define casos, rubricas y assets de evaluacion para reducir regresiones durante implementacion.",
  },
  {
    icon: FileQuestion,
    title: "GAPs y preguntas",
    text: "Identifica decisiones diferibles, owners, impacto y opciones para resolverlas en el momento correcto.",
  },
  {
    icon: PackageCheck,
    title: "Paquete portable",
    text: "Entrega prompts, contratos, memoria, herramientas e instrucciones listas para equipos o tooling agentico.",
  },
];

const PROBLEM_BLOCKS = [
  "Evita reinterpretar el Blueprint cuando empieza la construccion.",
  "Reduce preguntas abiertas a decisiones realmente dependientes del entorno.",
  "Convierte arquitectura, memoria y herramientas en artefactos tecnicos accionables.",
  "Permite ejecutar el paquete con Codex, Cursor, Claude Code, GitHub Copilot u otros asistentes.",
];

function formatHours(value: number) {
  return `${value.toFixed(1)} h`;
}

function formatWeeks(value: number) {
  return `${value.toFixed(1)} sem`;
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function gateBadge(gateState: AcpGateState) {
  if (gateState === "unlocked") {
    return <Badge tone="green">ACP habilitado</Badge>;
  }
  if (gateState === "permission_required") {
    return <Badge tone="orange">Permiso requerido</Badge>;
  }
  return <Badge tone="violet">Upgrade disponible</Badge>;
}

export function AcpInvitationPanel({
  actionState,
  gateState,
  metrics,
  onAcquireAcp,
  onReturnToBlueprint,
  upgradeMessage,
}: {
  actionState: AcpInvitationActionState;
  gateState: AcpGateState;
  metrics: AcpInvitationMetrics;
  onAcquireAcp: () => void;
  onReturnToBlueprint: () => void;
  upgradeMessage?: string | null;
}) {
  const canAcquire = gateState === "purchase_required";
  const isPermissionBlocked = gateState === "permission_required";

  return (
    <div className="space-y-5">
      <Panel className="overflow-hidden p-0">
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="relative overflow-hidden bg-[radial-gradient(circle_at_12%_14%,rgba(124,58,237,0.22),transparent_30%),radial-gradient(circle_at_78%_8%,rgba(20,184,166,0.16),transparent_26%),linear-gradient(135deg,#0b1220_0%,#17213b_52%,#241743_100%)] p-8 text-white">
            <div className="absolute inset-x-10 bottom-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="violet">Producto 2</Badge>
              {gateBadge(gateState)}
              <Badge tone="green">Blueprint preservado</Badge>
            </div>
            <div className="mt-8 max-w-4xl">
              <p className="text-[44px] font-semibold leading-tight">
                El ACP convierte el Blueprint en un paquete de construccion.
              </p>
              <p className="mt-4 max-w-3xl text-[15px] leading-7 text-white/74">
                El Blueprint explica que se debe construir. El Agent Construction Package define como arrancar la
                implementacion: pruebas, gaps, preguntas, prompts, contratos, memoria, herramientas y artefactos portables
                para trabajar con equipos humanos o herramientas agenticas.
              </p>
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-4">
              <div className="rounded-[22px] border border-white/10 bg-white/8 p-4 backdrop-blur">
                <p className="text-[12px] text-white/58">Ahorro adicional</p>
                <p className="mt-2 text-[28px] font-semibold">{formatPercent(metrics.additionalCostSavingsPercent)}</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/8 p-4 backdrop-blur">
                <p className="text-[12px] text-white/58">Menos esfuerzo</p>
                <p className="mt-2 text-[28px] font-semibold">{formatPercent(metrics.additionalEffortReductionPercent)}</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/8 p-4 backdrop-blur">
                <p className="text-[12px] text-white/58">Riesgo reducido</p>
                <p className="mt-2 text-[28px] font-semibold">{formatPercent(metrics.riskReductionPercent)}</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/8 p-4 backdrop-blur">
                <p className="text-[12px] text-white/58">Intervencion humana</p>
                <p className="mt-2 text-[28px] font-semibold">
                  -{formatPercent(metrics.humanInterventionReductionPercent)}
                </p>
              </div>
            </div>

            {upgradeMessage ? (
              <div className="mt-6 rounded-[18px] border border-white/12 bg-white/10 px-4 py-3 text-[13px] leading-6 text-white/78">
                {upgradeMessage}
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-3">
              <AppButton
                className="border-white/12 bg-white/8 text-white hover:bg-white/12"
                icon={<ArrowLeft className="h-4 w-4" />}
                onClick={onReturnToBlueprint}
              >
                Volver al Blueprint
              </AppButton>
              <AppButton
                icon={<Sparkles className="h-4 w-4" />}
                loading={actionState === "submitting"}
                loadingLabel="Activando ACP..."
                onClick={onAcquireAcp}
                variant="primary"
                disabled={!canAcquire}
              >
                {isPermissionBlocked ? "Solicita permiso de workspace" : "Adquirir ACP Premium"}
              </AppButton>
            </div>
          </div>

          <div className="border-l border-[var(--border-default)] bg-white p-6">
            <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Que obtienes</p>
            <div className="mt-5 space-y-3">
              {VALUE_BLOCKS.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-[20px] border border-[var(--border-default)] bg-[var(--surface-muted)] p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-white text-[var(--brand-primary)]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <p className="text-[14px] font-semibold text-[var(--text-primary)]">{item.title}</p>
                    </div>
                    <p className="mt-3 text-[12px] leading-5 text-[var(--text-secondary)]">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <Panel className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[18px] font-semibold text-[var(--text-primary)]">Blueprint vs ACP</p>
              <p className="mt-2 text-[13px] leading-6 text-[var(--text-secondary)]">
                La comparativa cuantifica el valor incremental del ACP frente a construir solo con el Blueprint.
              </p>
            </div>
            <Badge tone="green">ROI incremental</Badge>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <div className="rounded-[20px] border border-[var(--border-default)] bg-white p-4">
              <div className="flex items-center gap-3">
                <GitBranch className="h-5 w-5 text-[var(--brand-primary)]" />
                <p className="text-[14px] font-semibold text-[var(--text-primary)]">{metrics.blueprintAssisted.label}</p>
              </div>
              <div className="mt-4 grid gap-3">
                <KeyValue label="Horas" value={formatHours(metrics.blueprintAssisted.estimated_hours_total)} />
                <KeyValue label="Costo" value={formatCurrency(metrics.blueprintAssisted.estimated_cost)} />
                <KeyValue label="Humano" value={formatPercent(metrics.blueprintAssisted.human_intervention_percent)} />
              </div>
            </div>
            <div className="rounded-[20px] border border-[rgba(124,58,237,0.18)] bg-[rgba(124,58,237,0.06)] p-4">
              <div className="flex items-center gap-3">
                <Boxes className="h-5 w-5 text-[var(--brand-primary)]" />
                <p className="text-[14px] font-semibold text-[var(--text-primary)]">{metrics.acpManual.label}</p>
              </div>
              <div className="mt-4 grid gap-3">
                <KeyValue label="Horas" value={formatHours(metrics.acpManual.estimated_hours_total)} />
                <KeyValue label="Costo" value={formatCurrency(metrics.acpManual.estimated_cost)} />
                <KeyValue label="Duracion" value={formatWeeks(metrics.acpManual.estimated_duration_weeks)} />
              </div>
            </div>
            <div className="rounded-[20px] border border-[rgba(20,184,166,0.2)] bg-[rgba(20,184,166,0.08)] p-4">
              <div className="flex items-center gap-3">
                <Workflow className="h-5 w-5 text-[#0f766e]" />
                <p className="text-[14px] font-semibold text-[var(--text-primary)]">{metrics.acpAgentic.label}</p>
              </div>
              <div className="mt-4 grid gap-3">
                <KeyValue label="Horas" value={formatHours(metrics.acpAgentic.estimated_hours_total)} />
                <KeyValue label="Costo" value={formatCurrency(metrics.acpAgentic.estimated_cost)} />
                <KeyValue label="Automatizacion" value={formatPercent(metrics.acpAgentic.automation_leverage_percent)} />
              </div>
            </div>
          </div>

          <SimpleTable
            columns={["Pregunta comercial", "Respuesta ACP"]}
            rows={[
              ["Que obtengo adicionalmente", "Un paquete tecnico portable, preguntas de cierre, pruebas y artefactos de implementacion."],
              ["Que problema resuelve", "Evita redescubrir, reinterpretar y rearmar manualmente prompts, contratos, memoria y herramientas."],
              ["Cuanto esfuerzo ahorra", `${formatPercent(metrics.additionalEffortReductionPercent)} adicional frente al Blueprint asistido.`],
              ["Como reduce riesgo", "Hace explicitos gaps, owners, decisiones diferibles, tests y criterios de aceptacion."],
              ["ROI esperado", `${formatCurrency(metrics.additionalCostSavings)} de ahorro incremental estimado frente al escenario Blueprint.`],
            ]}
          />
        </Panel>

        <div className="space-y-5">
          <Panel className="p-5">
            <div className="flex items-center gap-3">
              <Gauge className="h-5 w-5 text-[var(--brand-primary)]" />
              <p className="text-[16px] font-semibold text-[var(--text-primary)]">Impacto operacional</p>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <div className="flex items-center justify-between text-[12px] text-[var(--text-secondary)]">
                  <span>Lift de automatizacion</span>
                  <span>{formatPercent(metrics.automationLiftPercent)}</span>
                </div>
                <ProgressBar value={metrics.automationLiftPercent} className="mt-2" />
              </div>
              <div>
                <div className="flex items-center justify-between text-[12px] text-[var(--text-secondary)]">
                  <span>Riesgo reducido</span>
                  <span>{formatPercent(metrics.riskReductionPercent)}</span>
                </div>
                <ProgressBar value={metrics.riskReductionPercent} className="mt-2" color="#0f766e" />
              </div>
            </div>
          </Panel>

          <Panel className="p-5">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-[var(--text-secondary)]" />
              <p className="text-[16px] font-semibold text-[var(--text-primary)]">Funcionalidades bloqueadas</p>
            </div>
            <div className="mt-4 space-y-2">
              {["Validar", "Test Suite", "GAPs", "Preguntas", "Package", "Descarga ACP"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-[16px] border border-[var(--border-default)] bg-[var(--surface-muted)] px-3 py-3">
                  <CheckCircle2 className="h-4 w-4 text-[var(--text-muted)]" />
                  <p className="text-[13px] font-semibold text-[var(--text-primary)]">{item}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <Panel className="p-5">
        <p className="text-[16px] font-semibold text-[var(--text-primary)]">Problemas que el ACP resuelve</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {PROBLEM_BLOCKS.map((item) => (
            <div key={item} className="rounded-[18px] border border-[var(--border-default)] bg-white px-4 py-4 text-[13px] leading-6 text-[var(--text-secondary)]">
              {item}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
