"use client";

import { useState } from "react";
import {
  Archive,
  ArrowDownToLine,
  Bot,
  CheckCircle2,
  Download,
  FileArchive,
  FileCheck,
  FileCode,
  FolderTree,
  Sparkles,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { byLanguage } from "@/features/product-experience/core/localized-copy";
import { useLanguage } from "@/core/i18n/language-context";
import {
  UxaBadge,
  UxaButton,
  UxaSurface,
} from "@/features/product-experience/design-system";
import { executeAcpZipDownload } from "@/features/acp/acp-adapter";

export type AcpPackageStageProps = {
  sessionId: string;
  projectTitle?: string;
  answeredCount: number;
  deferredCount: number;
};

export function AcpPackageStage({
  sessionId,
  projectTitle = "Agente",
  answeredCount,
  deferredCount,
}: AcpPackageStageProps) {
  const { language } = useLanguage();
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    setDownloadSuccess(false);
    try {
      await executeAcpZipDownload({ sessionId });
      setDownloadSuccess(true);
    } catch {
      // Ignored
    } finally {
      setDownloading(false);
    }
  }

  const packageContents = [
    {
      name: "Manifiesto y Contexto Declarativo",
      file: "ACP/manifest.json",
      description: "Identificación agéntica, metadatos y arquitectura portable sin dependencias de plataforma.",
    },
    {
      name: "Contratos de Herramientas y APIs",
      file: "ACP/tools/contracts.yaml",
      description: "Definición exacta de schemas, endpoints, autenticación y efectos secundarios.",
    },
    {
      name: "Prompts del Sistema y Guía Agéntica",
      file: "ACP/prompts/system-prompt.md",
      description: "Directivas operativas, tono, límites y rol del asistente validados en simulación.",
    },
    {
      name: "Decisiones Delegadas a Implementación",
      file: "ACP/construction-readiness/deferred-decisions.yaml",
      description: `Estructura imperativa con directivas (policy: DO_NOT_ASSUME_SILENTLY) para formular preguntas durante el código. (${deferredCount} decisión/es).`,
    },
    {
      name: "Bitácora de Decisiones Resueltas",
      file: "ACP/construction-readiness/question-impact-log.yaml",
      description: `Trazabilidad de opciones elegidas y respuestas ingresadas por el usuario (${answeredCount} decisión/es).`,
    },
    {
      name: "Suite de Pruebas y Criterios de Calidad",
      file: "ACP/evaluation/golden-dataset.json",
      description: "Casos de prueba representativos para verificar el comportamiento antes y después del release.",
    },
    {
      name: "Guía de Arranque para Herramientas Agénticas",
      file: "ACP/prompts/builder-handoff.md",
      description: "Instrucciones de paso a paso y orden recomendado de construcción para Codex, Claude Code o Cursor.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Cabecera de Etapa 4 */}
      <UxaSurface className="p-[var(--uxa-panel-padding-lg)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <UxaBadge tone="brand">
                {byLanguage(language, {
                  en: "Stage 4 · Package",
                  es: "Etapa 4 · Empaquetar",
                  pt: "Etapa 4 · Empacotar",
                })}
              </UxaBadge>
              <UxaBadge tone="success">
                {byLanguage(language, {
                  en: "Ready for Agentic Implementation",
                  es: "Listo para Implementación Agéntica",
                  pt: "Pronto para Implementação Agêntica",
                })}
              </UxaBadge>
            </div>
            <h2 className="mt-2 text-[22px] font-black">
              {byLanguage(language, {
                en: "Final Agent Construction Package (ACP)",
                es: "Paquete Definitivo de Construcción (ACP)",
                pt: "Pacote Definitivo de Construção (ACP)",
              })}
            </h2>
            <p className="mt-1 max-w-3xl text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">
              {byLanguage(language, {
                en: "The portable package contains all contracts, prompts, architectures, test suites, and explicit instructions for your implementing agent (Codex, Claude Code, Cursor, Copilot).",
                es: "El paquete portable contiene todos los contratos, prompts, arquitectura, suite de pruebas e instrucciones explícitas para tu herramienta agéntica de implementación (Codex, Claude Code, Cursor, Copilot).",
                pt: "O pacote portável contém todos os contratos, prompts, arquitetura, suite de testes e instruções explícitas para sua ferramenta agêntica de implementação (Codex, Claude Code, Cursor, Copilot).",
              })}
            </p>
          </div>

          <div className="shrink-0">
            <button
              className={cn(
                "uxa-button uxa-button--primary inline-flex items-center gap-2 px-6 py-3.5 text-[14px] font-black cursor-pointer shadow-md",
                downloading && "opacity-60 cursor-not-allowed",
              )}
              disabled={downloading}
              onClick={() => void handleDownload()}
              type="button"
            >
              <Download aria-hidden="true" className="h-5 w-5" />
              <span>
                {downloading
                  ? byLanguage(language, { en: "Preparing ACP ZIP...", es: "Preparando ACP ZIP...", pt: "Preparando ACP ZIP..." })
                  : byLanguage(language, { en: "Download ACP ZIP", es: "Descargar ACP ZIP", pt: "Baixar ACP ZIP" })}
              </span>
            </button>
          </div>
        </div>

        {downloadSuccess ? (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-[12px] font-bold text-emerald-900">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              {byLanguage(language, {
                en: "Download started successfully! Your ACP package is ready to be loaded into your agentic IDE.",
                es: "¡Descarga iniciada exitosamente! Tu paquete ACP está listo para cargarse en tu IDE o herramienta agéntica.",
                pt: "Download iniciado com sucesso! Seu pacote ACP está pronto para ser carregado em sua IDE agêntica.",
              })}
            </span>
          </div>
        ) : null}
      </UxaSurface>

      {/* Contenido detallado del paquete */}
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <UxaSurface className="p-[var(--uxa-panel-padding-lg)]">
          <div className="flex items-center gap-2 border-b pb-3">
            <FolderTree className="h-4 w-4 text-[var(--uxa-color-brand)]" />
            <h3 className="text-[15px] font-black text-[var(--uxa-color-ink)]">
              {byLanguage(language, {
                en: "Package Deliverables & Specification",
                es: "Entregables del paquete y especificación",
                pt: "Entregáveis do pacote e especificação",
              })}
            </h3>
          </div>

          <div className="mt-4 space-y-3">
            {packageContents.map((item) => (
              <div className="rounded-xl border border-[var(--uxa-color-border)] bg-white p-3.5" key={item.file}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[13px] text-[var(--uxa-color-ink)]">{item.name}</span>
                  <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border">
                    {item.file}
                  </span>
                </div>
                <p className="mt-1.5 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </UxaSurface>

        {/* Instrucciones de ejecución para herramientas agénticas */}
        <div className="space-y-4">
          <UxaSurface className="p-[var(--uxa-panel-padding-lg)] bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-700">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-emerald-400" />
              <h3 className="text-[14px] font-black text-white">
                {byLanguage(language, {
                  en: "How to use with Agentic Tools",
                  es: "Cómo utilizar con herramientas agénticas",
                  pt: "Como utilizar com ferramentas agênticas",
                })}
              </h3>
            </div>
            <p className="mt-2 text-[12px] text-slate-300 leading-5">
              {byLanguage(language, {
                en: "Unzip the downloaded ACP ZIP into your project workspace root and pass the handoff prompt to your agent.",
                es: "Descomprime el ZIP descargado en la raíz de tu proyecto y entrega el prompt de arranque a tu herramienta agéntica.",
                pt: "Descompacte o ZIP baixado na raiz do seu projeto e entregue o prompt de inicialização ao seu agente.",
              })}
            </p>

            <div className="mt-4 rounded-xl bg-black/50 p-3.5 font-mono text-[11px] text-emerald-300 border border-slate-700 space-y-1">
              <p className="text-slate-400"># 1. Descomprimir el paquete</p>
              <p>unzip ACP-bundle.zip -d ./my-agent</p>
              <p className="pt-2 text-slate-400"># 2. Iniciar con Claude Code / Codex / Cursor</p>
              <p className="text-white">claude "Lee ACP/prompts/builder-handoff.md y construye el agente"</p>
            </div>
          </UxaSurface>

          {/* Tarjeta de Resumen de Decisiones */}
          <UxaSurface className="p-[var(--uxa-panel-padding-lg)]">
            <h4 className="text-[13px] font-black uppercase tracking-wider text-[var(--uxa-color-ink-muted)]">
              {byLanguage(language, { en: "Governance & Continuity", es: "Gobernanza y Continuidad", pt: "Governança e Continuidade" })}
            </h4>
            <div className="mt-3 space-y-2 text-[12px]">
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-600">Decisiones resueltas en ACP:</span>
                <span className="font-bold text-emerald-700">{answeredCount}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-600">Decisiones delegadas formalmente:</span>
                <span className="font-bold text-amber-700">{deferredCount}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-600">Política agéntica:</span>
                <span className="font-mono font-bold text-indigo-700">DO_NOT_ASSUME_SILENTLY</span>
              </div>
            </div>
          </UxaSurface>
        </div>
      </div>
    </div>
  );
}
