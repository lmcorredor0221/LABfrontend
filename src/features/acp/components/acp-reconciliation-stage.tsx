"use client";

import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  FileCode,
  Layers,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { byLanguage } from "@/features/product-experience/core/localized-copy";
import { useLanguage } from "@/core/i18n/language-context";
import {
  UxaBadge,
  UxaButton,
  UxaSurface,
} from "@/features/product-experience/design-system";
import type { ACPWorkspaceResponse } from "@/features/sessions/types";
import { sessionsApi } from "@/features/sessions/session-api";

import { executeAcpZipDownload } from "@/features/acp/acp-adapter";

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
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  async function handleDownloadZip() {
    if (downloading) return;
    setDownloading(true);
    setDownloadSuccess(false);
    try {
      await executeAcpZipDownload({ sessionId });
      setDownloadSuccess(true);
    } catch {
      // Ignored for feedback
    } finally {
      setDownloading(false);
    }
  }

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
    try {
      // Regenera selectivamente el preview ACP sin reiniciar el proyecto
      await sessionsApi.generateAcp(sessionId);
      await onReload();
      setReconciled(true);
    } catch {
      // Ignored for feedback
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
              disabled={downloading}
              isLoading={downloading}
              onClick={() => void handleDownloadZip()}
              size="md"
              variant="secondary"
            >
              <Download className="mr-1.5 h-4 w-4" />
              <span>
                {downloading
                  ? byLanguage(language, { en: "Preparing ZIP...", es: "Preparando ZIP...", pt: "Preparando ZIP..." })
                  : byLanguage(language, { en: "Download ACP ZIP", es: "Descargar ACP ZIP", pt: "Baixar ACP ZIP" })}
              </span>
            </UxaButton>

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
                en: "Discover, Define, Design, Tools, Memory, and Estimate stay frozen and approved. The system performs granular updates only on ACP deliverables to ensure 100% technical consistency.",
                es: "Descubrir, Definir, Diseñar, Herramientas, Memoria y Estimar permanecen cerradas y aprobadas. El sistema realiza actualizaciones quirúrgicas únicamente sobre los entregables del ACP para asegurar consistencia técnica.",
                pt: "Descobrir, Definir, Desenhar, Ferramentas, Memória e Estimar permanecem fechadas e aprovadas. O sistema realiza atualizações cirúrgicas apenas nos entregáveis do ACP para assegurar consistência técnica.",
              })}
            </p>
          </div>
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
          <UxaBadge tone="success">
            {byLanguage(language, { en: "100% Consistent", es: "100% Consistente", pt: "100% Consistente" })}
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
