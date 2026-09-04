"use client";

import {
  Activity,
  BrainCircuit,
  Database,
  ShieldCheck,
  UserCheck,
  Wrench,
} from "lucide-react";
import { byLanguage } from "@/features/product-experience/core/localized-copy";
import { useLanguage } from "@/core/i18n/language-context";
import { UxaBadge } from "@/features/product-experience/design-system";

/**
 * Grafo conceptual de arquitectura del agente para la Etapa 2 de ACP (Validar).
 * Muestra los 5 nodos de ejecución: Input → Tools → Memory → HITL → Resilience.
 * Extraído de AcpValidationStage para reutilizarse como supplementalContent
 * de ValidateStageView.
 */
export function AcpSimulationGraph() {
  const { language } = useLanguage();

  const nodes = [
    {
      number: 1,
      color: "indigo",
      icon: <BrainCircuit className="h-4 w-4 text-indigo-600" />,
      title: byLanguage(language, {
        en: "Input & Intent",
        es: "Entrada & Intención",
        pt: "Entrada & Intenção",
      }),
      body: byLanguage(language, {
        en: "User message received, classified, and grounded against active system policies.",
        es: "Mensaje del usuario recibido, clasificado y alineado con las directivas del agente.",
        pt: "Mensagem recebida, classificada e alinhada com as diretrizes do agente.",
      }),
      mono: "LLM Prompt: System Instructions",
      border: "border-indigo-200 bg-indigo-50/50",
      markerBg: "bg-indigo-600",
      monoBg: "bg-white/90 text-indigo-900 border-indigo-100",
    },
    {
      number: 2,
      color: "blue",
      icon: <Wrench className="h-4 w-4 text-blue-600" />,
      title: byLanguage(language, {
        en: "Tools & Execution",
        es: "Herramientas & APIs",
        pt: "Ferramentas & APIs",
      }),
      body: byLanguage(language, {
        en: "Tool schema validation and external system integrations called according to contracts.",
        es: "Validación de esquema e invocación de herramientas externas según contratos.",
        pt: "Validação de esquema e invocação de ferramentas externas conforme contratos.",
      }),
      mono: "Side Effects: Governed Contracts",
      border: "border-blue-200 bg-blue-50/50",
      markerBg: "bg-blue-600",
      monoBg: "bg-white/90 text-blue-900 border-blue-100",
    },
    {
      number: 3,
      color: "emerald",
      icon: <Database className="h-4 w-4 text-emerald-600" />,
      title: byLanguage(language, {
        en: "Memory & Knowledge",
        es: "Memoria & Contexto",
        pt: "Memória & Contexto",
      }),
      body: byLanguage(language, {
        en: "Short-term buffer and long-term vector store queried and synchronized.",
        es: "Buffer a corto plazo y almacén vectorial consultados y sincronizados.",
        pt: "Buffer de curto prazo e armazenamento vetorial consultados e sincronizados.",
      }),
      mono: "TTL & Pruning Policies",
      border: "border-emerald-200 bg-emerald-50/50",
      markerBg: "bg-emerald-600",
      monoBg: "bg-white/90 text-emerald-900 border-emerald-100",
    },
    {
      number: 4,
      color: "amber",
      icon: <UserCheck className="h-4 w-4 text-amber-600" />,
      title: byLanguage(language, {
        en: "Human Approval Gate",
        es: "Aprobación Humana (HITL)",
        pt: "Aprovação Humana (HITL)",
      }),
      body: byLanguage(language, {
        en: "Critical decisions and out-of-scope actions paused for human authorization.",
        es: "Decisiones críticas y acciones con impacto pausadas para autorización de supervisor.",
        pt: "Decisões críticas e ações com impacto pausadas para autorização humana.",
      }),
      mono: "Escalation & SLA Timeout",
      border: "border-amber-200 bg-amber-50/50",
      markerBg: "bg-amber-600",
      monoBg: "bg-white/90 text-amber-900 border-amber-100",
    },
    {
      number: 5,
      color: "purple",
      icon: <ShieldCheck className="h-4 w-4 text-purple-600" />,
      title: byLanguage(language, {
        en: "Resilience & Response",
        es: "Resiliencia & Respuesta",
        pt: "Resiliência & Resposta",
      }),
      body: byLanguage(language, {
        en: "Fallback model activated on API error; final output checked against rubrics.",
        es: "Modelo de respaldo en caso de fallo; respuesta validada contra la rúbrica.",
        pt: "Modelo de contingência em caso de falha; resposta validada contra a rubrica.",
      }),
      mono: "Conformance Verified",
      border: "border-purple-200 bg-purple-50/50",
      markerBg: "bg-purple-600",
      monoBg: "bg-white/90 text-purple-900 border-purple-100",
    },
  ] as const;

  return (
    <div className="rounded-[var(--uxa-radius-xl)] border border-[var(--uxa-color-border)] bg-white p-[var(--uxa-panel-padding-lg)]">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--uxa-color-brand-soft)]/40 text-[var(--uxa-color-brand)]">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-[16px] font-black text-[var(--uxa-color-ink)]">
              {byLanguage(language, {
                en: "Interactive Architectural Simulation Flow",
                es: "Simulación gráfica de arquitectura y comportamiento",
                pt: "Simulação gráfica de arquitetura e comportamento",
              })}
            </h3>
            <p className="text-[12px] text-[var(--uxa-color-ink-soft)]">
              {byLanguage(language, {
                en: "Visual execution trace showing interactions, tools, memory, and checkpoints",
                es: "Traza visual de ejecución que muestra interacciones, herramientas, memoria y puntos de control",
                pt: "Rastreamento visual de execução mostrando interações, ferramentas, memória e checkpoints",
              })}
            </p>
          </div>
        </div>
        <UxaBadge tone="brand">
          {byLanguage(language, {
            en: "Live Blueprint Graph",
            es: "Grafo Blueprint Activo",
            pt: "Grafo Blueprint Ativo",
          })}
        </UxaBadge>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-5">
        {nodes.map((node) => (
          <div
            className={`rounded-xl border p-4 transition hover:shadow-md ${node.border}`}
            key={node.number}
          >
            <div className="flex items-center justify-between">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-lg ${node.markerBg} text-xs font-bold text-white`}
              >
                {node.number}
              </span>
              {node.icon}
            </div>
            <h4 className="mt-3 text-[13px] font-black">{node.title}</h4>
            <p className="mt-1 text-[11px] leading-4 opacity-80">{node.body}</p>
            <div
              className={`mt-3 rounded-md border p-2 font-mono text-[10px] ${node.monoBg}`}
            >
              {node.mono}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
