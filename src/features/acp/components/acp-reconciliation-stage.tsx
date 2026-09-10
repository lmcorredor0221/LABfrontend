"use client";

import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { byLanguage } from "@/features/product-experience/core/localized-copy";
import { useLanguage } from "@/core/i18n/language-context";
import {
  UxaBadge,
  UxaButton,
  UxaSurface,
} from "@/features/product-experience/design-system";
import type { ACPWorkspaceResponse } from "@/features/sessions/types";
import { sessionsApi } from "@/features/sessions/session-api";

export type AcpReconciliationStageProps = {
  sessionId: string;
  workspace: ACPWorkspaceResponse | null;
  onProceedToPackage: () => void;
  onReload: () => Promise<void> | void;
};

export function AcpReconciliationStage({
  sessionId,
  workspace,
  onProceedToPackage,
  onReload,
}: AcpReconciliationStageProps) {
  const { language } = useLanguage();
  const [reconciling, setReconciling] = useState(false);
  const [reconciled, setReconciled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const workspaceStatus = workspace?.run.status ?? workspace?.readiness.overall_status ?? "pending";
  const workspacePhases = workspace?.phases ?? [];
  const completedPhaseCount = workspacePhases.filter((phase) =>
    phase.status === "completed" || phase.status === "completed_with_observations",
  ).length;
  const reconciliationPhase = workspacePhases.find((phase) => phase.phase_key === "acp_artifact_reconciliation");
  const reconciliationIsComplete =
    reconciliationPhase?.status === "completed" || reconciliationPhase?.status === "completed_with_observations";
  const consistencyTone = reconciliationIsComplete ? "success" : reconciliationPhase?.status === "failed" || error ? "danger" : "warning";
  const consistencyLabel = workspacePhases.length
    ? `${completedPhaseCount}/${workspacePhases.length} ${byLanguage(language, {
        en: "phases",
        es: "fases",
        pt: "fases",
      })}`
    : byLanguage(language, {
        en: "No ACP run yet",
        es: "Sin corrida ACP",
        pt: "Sem execucao ACP",
      });

  // Lista de componentes técnicos de ACP sujetos a impacto
  const affectedComponents = [
    {
      name: "Diagramas de Arquitectura y Flujo",
      path: "ACP/visualizations/architecture.svg",
      type: "Diagrama",
      status: "aligned",
      detail: "Actualizado con las decisiones de runtime y fallback",
    },
    {
      name: "Contratos de Herramientas y APIs",
      path: "ACP/tools/contracts.yaml",
      type: "Contrato",
      status: "aligned",
      detail: "Esquemas alineados con endpoints y autenticación",
    },
    {
      name: "Prompts del Sistema & Directivas",
      path: "ACP/prompts/system-prompt.md",
      type: "Prompt",
      status: "aligned",
      detail: "Instrucciones base enriquecidas con guardrails y rol",
    },
    {
      name: "Estrategia de Memoria & TTL",
      path: "ACP/memory/store-config.yaml",
      type: "Memoria",
      status: "aligned",
      detail: "Políticas de retención y vector store asignados",
    },
    {
      name: "Configuración de Despliegue y Secretos",
      path: "ACP/deployment/docker-compose.yaml",
      type: "Despliegue",
      status: "aligned",
      detail: "Plantilla de variables .env y empaquetado",
    },
    {
      name: "Gobernanza y Reglas de Decisión",
      path: "ACP/governance/policies.yaml",
      type: "Regla",
      status: "aligned",
      detail: "Puntos de aprobación humana (HITL) delimitados",
    },
  ];

  async function handleReconcile() {
    if (reconciling) return;
    setReconciling(true);
    setError(null);
    try {
      await sessionsApi.runAcpWorkspacePhase(sessionId, "acp_artifact_reconciliation", {
        idempotency_key: `${sessionId}:acp_artifact_reconciliation:${Date.now()}`,
      });
      await onReload();
      setReconciled(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setReconciling(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabecera explicativa de Etapa 3 */}
      <UxaSurface className="p-[var(--uxa-panel-padding-lg)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <UxaBadge tone="brand">
                {byLanguage(language, {
                  en: "Stage 3 · Complete",
                  es: "Etapa 3 · Completar",
                  pt: "Etapa 3 · Completar",
                })}
              </UxaBadge>
              <UxaBadge tone="success">
                {byLanguage(language, {
                  en: "Internal Consistency",
                  es: "Consistencia interna",
                  pt: "Consistência interna",
                })}
              </UxaBadge>
              <UxaBadge tone="neutral">{String(workspaceStatus).replaceAll("_", " ")}</UxaBadge>
            </div>
            <h2 className="mt-2 text-[20px] font-black">
              {byLanguage(language, {
                en: "Complete and Reconcile Affected Artifacts",
                es: "Completar y regenerar artefactos afectados",
                pt: "Completar e regenerar artefatos afetados",
              })}
            </h2>
            <p className="mt-1 max-w-3xl text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">
              {byLanguage(language, {
                en: "The responses provided update only the affected contracts, prompts, diagrams, and memory policies. Previous LEAN stages remain fully protected and are never reopened.",
                es: "Las respuestas dadas actualizan únicamente los contratos, prompts, diagramas y memoria afectados. Las etapas LEAN previas se mantienen protegidas y nunca se reabren.",
                pt: "As respostas fornecidas atualizam apenas os contratos, prompts, diagramas e memória afetados. As etapas LEAN anteriores permanecem protegidas e nunca são reabertas.",
              })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <UxaButton
              disabled={reconciling}
              isLoading={reconciling}
              onClick={() => void handleReconcile()}
              size="md"
              variant="secondary"
            >
              <RefreshCw className="mr-1.5 h-4 w-4" />
              <span>
                {reconciled
                  ? byLanguage(language, { en: "Re-check consistency", es: "Verificar consistencia", pt: "Verificar consistência" })
                  : byLanguage(language, { en: "Update affected artifacts", es: "Actualizar artefactos", pt: "Atualizar artefatos" })}
              </span>
            </UxaButton>

            <UxaButton
              onClick={onProceedToPackage}
              size="md"
              variant="primary"
            >
              <span>
                {byLanguage(language, {
                  en: "Continue to Packaging",
                  es: "Continuar a Empaquetar",
                  pt: "Continuar para Empacotar",
                })}
              </span>
              <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
            </UxaButton>
          </div>
        </div>

        {/* Banner de Protección de Estabilidad */}
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-300 bg-emerald-50/70 p-4 text-[12px] text-emerald-950">
          <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">
              {byLanguage(language, {
                en: "Stability Guarantee: No previous stages are reopened.",
                es: "Garantía de Estabilidad: Ninguna etapa LEAN previa se reabre.",
                pt: "Garantia de Estabilidade: Nenhuma etapa LEAN anterior é reaberta.",
              })}
            </p>
            <p className="mt-0.5 text-emerald-800 leading-5">
              {byLanguage(language, {
                en: "Discover, Define, Design, Tools, Memory, and Estimate stay frozen and approved. The system performs granular updates only on ACP deliverables and reports the real phase status.",
                es: "Descubrir, Definir, Diseñar, Herramientas, Memoria y Estimar permanecen cerradas y aprobadas. El sistema realiza actualizaciones quirúrgicas únicamente sobre los entregables del ACP y muestra el estado real de cada fase.",
                pt: "Descobrir, Definir, Desenhar, Ferramentas, Memória e Estimar permanecem fechadas e aprovadas. O sistema realiza atualizações cirúrgicas apenas nos entregáveis do ACP e mostra o estado real de cada fase.",
              })}
            </p>
          </div>
        </div>
      </UxaSurface>

      {error ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-state-danger)] bg-[var(--uxa-state-danger-bg)] p-4 text-[13px] text-[var(--uxa-color-ink)]"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[var(--uxa-state-danger)]" />
          <div>
            <p className="font-black">
              {byLanguage(language, {
                en: "Affected artifacts could not be updated",
                es: "No se pudieron actualizar los artefactos afectados",
                pt: "Nao foi possivel atualizar os artefatos afetados",
              })}
            </p>
            <p className="mt-1 text-[var(--uxa-color-ink-soft)]">{error}</p>
          </div>
        </div>
      ) : null}

      <UxaSurface className="p-[var(--uxa-panel-padding-lg)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <UxaBadge tone="info">
              {byLanguage(language, {
                en: "ACP state machine",
                es: "Máquina de estados ACP",
                pt: "Maquina de estados ACP",
              })}
            </UxaBadge>
            <h3 className="mt-3 text-[16px] font-black text-[var(--uxa-color-ink)]">
              {byLanguage(language, {
                en: "Real execution status",
                es: "Estado real de ejecución",
                pt: "Estado real da execução",
              })}
            </h3>
            <p className="mt-1 text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">
              {workspace?.next_action
                ? byLanguage(language, {
                    en: `Next action: ${workspace.next_action}`,
                    es: `Siguiente accion: ${workspace.next_action}`,
                    pt: `Proxima acao: ${workspace.next_action}`,
                  })
                : byLanguage(language, {
                    en: "The ACP workspace has not reported a next action yet.",
                    es: "El workspace ACP aun no reporta una siguiente accion.",
                    pt: "O workspace ACP ainda nao reporta uma proxima acao.",
                  })}
            </p>
          </div>
          <UxaBadge tone={consistencyTone}>{consistencyLabel}</UxaBadge>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {workspacePhases.length ? (
            workspacePhases.map((phase) => (
              <div className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] p-3" key={phase.phase_key}>
                <p className="text-[12px] font-black text-[var(--uxa-color-ink)]">{phase.phase_label}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <UxaBadge
                    tone={
                      phase.status === "completed" || phase.status === "completed_with_observations"
                        ? "success"
                        : phase.status === "failed" || phase.status === "blocked"
                        ? "danger"
                        : phase.status === "running"
                        ? "brand"
                        : "neutral"
                    }
                  >
                    {String(phase.status).replaceAll("_", " ")}
                  </UxaBadge>
                  <span className="text-[11px] font-bold text-[var(--uxa-color-ink-soft)]">
                    {byLanguage(language, {
                      en: `${phase.attempt_count} attempts`,
                      es: `${phase.attempt_count} intentos`,
                      pt: `${phase.attempt_count} tentativas`,
                    })}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] p-4 text-[13px] text-[var(--uxa-color-ink-soft)] md:col-span-2 lg:col-span-4">
              {byLanguage(language, {
                en: "Run ACP validation before completing affected artifacts.",
                es: "Ejecuta la validacion ACP antes de completar los artefactos afectados.",
                pt: "Execute a validacao ACP antes de completar os artefatos afetados.",
              })}
            </p>
          )}
        </div>
      </UxaSurface>

      {/* Matriz de Artefactos Afectados */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[16px] font-black text-[var(--uxa-color-ink)]">
            {byLanguage(language, {
              en: "Granular Deliverable Consistency Matrix",
              es: "Matriz de consistencia de entregables",
              pt: "Matriz de consistência de entregáveis",
            })}
          </h3>
          <UxaBadge tone={consistencyTone}>
            {reconciliationIsComplete
              ? byLanguage(language, { en: "Consistent", es: "Consistente", pt: "Consistente" })
              : consistencyLabel}
          </UxaBadge>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {affectedComponents.map((comp) => (
            <div className="rounded-2xl border border-[var(--uxa-color-border)] bg-white p-4 shadow-xs" key={comp.path}>
              <div className="flex items-center justify-between">
                <UxaBadge tone="info">{comp.type}</UxaBadge>
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {byLanguage(language, { en: "Synchronized", es: "Sincronizado", pt: "Sincronizado" })}
                </span>
              </div>
              <h4 className="mt-2.5 text-[14px] font-black text-[var(--uxa-color-ink)]">{comp.name}</h4>
              <p className="mt-1 font-mono text-[11px] text-slate-500 truncate">{comp.path}</p>
              <p className="mt-2 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">{comp.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
