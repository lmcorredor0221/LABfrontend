"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Cpu,
  Layers,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Zap,
} from "lucide-react";
import { useLanguage } from "@/core/i18n/language-context";
import { byLanguage } from "@/features/product-experience/core/localized-copy";
import {
  evaluateInitiativeApi,
  type InitiativeEvaluationResponse,
} from "../initiative-evaluator-contracts";

interface ValidateIdeaSectionProps {
  onStartBlueprint: (tier?: "blueprint" | "blueprint_pro" | "acp") => void;
  onShowToast: (message: string, type?: "indigo" | "emerald" | "amber") => void;
  promptText: string;
  setPromptText: (text: string) => void;
}

export function ValidateIdeaSection({
  onStartBlueprint,
  onShowToast,
  promptText,
  setPromptText,
}: ValidateIdeaSectionProps) {
  const { language } = useLanguage();
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalResult, setEvalResult] = useState<InitiativeEvaluationResponse | null>(null);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [evalStep, setEvalStep] = useState(0);

  const examplePrompts = [
    {
      id: 1,
      icon: "📄",
      label: byLanguage(language, {
        es: '"6 personas revisando facturas a mano..."',
        en: '"6 people reviewing invoices by hand..."',
        pt: '"6 pessoas revisando faturas manualmente..."',
      }),
      text: byLanguage(language, {
        es: "Tenemos 6 personas revisando facturas en PDF y validándolas contra órdenes de compra registradas en el ERP SAP. Queremos automatizar la validación dejando solo las discrepancias para aprobación humana.",
        en: "We have 6 people reviewing PDF invoices and validating them against purchase orders in SAP ERP. We want to automate validation leaving only discrepancies for human approval.",
        pt: "Temos 6 pessoas revisando faturas em PDF e validando contra pedidos de compra no ERP SAP. Queremos automatizar a validação deixando apenas discrepâncias para aprovação humana.",
      }),
    },
    {
      id: 2,
      icon: "💬",
      label: byLanguage(language, {
        es: '"Responder dudas repetitivas de clientes..."',
        en: '"Answering repetitive customer questions..."',
        pt: '"Respondendo dúvidas repetitivas de clientes..."',
      }),
      text: byLanguage(language, {
        es: "Quiero automatizar el soporte de clientes para que un agente consulte el estado de pedidos en la API de Shopify, tome decisiones de reembolso y escale casos complejos a Zendesk.",
        en: "I want to automate customer support so an agent queries order status in Shopify API, makes refund decisions, and escalates complex cases to Zendesk.",
        pt: "Quero automatizar o suporte ao cliente para que um agente consulte o status de pedidos na API da Shopify, tome decisões de reembolso e escale casos complexos para o Zendesk.",
      }),
    },
    {
      id: 3,
      icon: "📋",
      label: byLanguage(language, {
        es: '"Auditar contratos y políticas internas..."',
        en: '"Auditing contracts and internal policies..."',
        pt: '"Auditando contratos e políticas internas..."',
      }),
      text: byLanguage(language, {
        es: "Necesitamos analizar documentos legales y solicitudes de crédito comparando condiciones contra políticas internas, solicitando aprobación humana cuando existan inconsistencias.",
        en: "We need to analyze legal documents and credit applications comparing conditions against internal policies, requesting human approval when inconsistencies exist.",
        pt: "Precisamos analisar documentos legais e solicitações de crédito comparando condições com políticas internas, solicitando aprovação humana quando houver inconsistências.",
      }),
    },
  ];

  async function handleRunAnalysis() {
    if (!promptText.trim() || promptText.trim().length < 5) {
      onShowToast(
        byLanguage(language, {
          es: "Por favor describe tu necesidad de negocio (mínimo 5 caracteres).",
          en: "Please describe your business need (minimum 5 characters).",
          pt: "Por favor, descreva sua necessidade de negócio (mínimo 5 caracteres).",
        }),
        "amber",
      );
      return;
    }

    setEvalLoading(true);
    setEvalError(null);
    setEvalStep(1);

    const stepTimer1 = setTimeout(() => setEvalStep(2), 400);
    const stepTimer2 = setTimeout(() => setEvalStep(3), 800);
    const stepTimer3 = setTimeout(() => setEvalStep(4), 1150);

    try {
      const evaluation = await evaluateInitiativeApi({
        initiative_text: promptText,
        language: language as "es" | "en" | "pt",
      });
      setEvalResult(evaluation);
      onShowToast(
        byLanguage(language, {
          es: "Diagnóstico Lean completado con éxito ($0 USD)",
          en: "Lean diagnosis completed successfully ($0 USD)",
          pt: "Diagnóstico Lean concluído com sucesso ($0 USD)",
        }),
        "emerald",
      );
    } catch (err) {
      setEvalError(err instanceof Error ? err.message : "Error evaluando iniciativa");
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      setEvalLoading(false);
    }
  }

  function handleReset() {
    setEvalResult(null);
    setEvalError(null);
    setPromptText("");
    setEvalStep(0);
  }

  return (
    <section
      id="validar-idea"
      data-alias="simulador"
      className="py-12 md:py-16 bg-slate-100/70 dark:bg-slate-950/60 border-y border-slate-200 dark:border-slate-800/80 relative"
    >
      {/* Anchor shim for legacy #simulador links */}
      <div id="simulador" className="absolute -top-20 left-0 pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#131b2e]/90 shadow-2xl relative overflow-hidden backdrop-blur-md">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" />
              {byLanguage(language, {
                es: "Validar mi idea gratis",
                en: "Validate my idea for free",
                pt: "Validar minha ideia grátis",
              })}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-3">
              {byLanguage(language, {
                es: "¿Qué proceso quieres automatizar con IA?",
                en: "Which workflow do you want to automate with AI?",
                pt: "Qual processo você quer automatizar com IA?",
              })}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
              {byLanguage(language, {
                es: "Descríbelo en palabras simples. Evaluamos su viabilidad técnica, riesgos, tipo de solución recomendada y precargamos tu Blueprint inicial.",
                en: "Describe it in simple words. We evaluate technical feasibility, risks, recommended solution type, and prefill your initial Blueprint.",
                pt: "Descreva em palavras simples. Avaliamos a viabilidade técnica, riscos, tipo de solução recomendada e pré-carregamos seu Blueprint inicial.",
              })}
            </p>
          </div>

          {/* Quick Example Chips */}
          {!evalResult ? (
            <div className="mb-4">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 text-center sm:text-left">
                {byLanguage(language, {
                  es: "Haz clic en un ejemplo o describe tu necesidad:",
                  en: "Click an example or describe your need:",
                  pt: "Clique em um exemplo ou descreva sua necessidade:",
                })}
              </div>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                {examplePrompts.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setPromptText(item.text);
                      onShowToast(
                        byLanguage(language, {
                          es: "Ejemplo cargado en el validador",
                          en: "Example loaded in validator",
                          pt: "Exemplo carregado no validador",
                        }),
                        "indigo",
                      );
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-500 transition-all text-left shadow-2xs flex items-center gap-1.5"
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* Input & Action (When not evaluated yet) */}
          {!evalResult ? (
            <div className="space-y-4">
              <div className="relative">
                <textarea
                  id="sim-prompt"
                  rows={4}
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl p-4 text-sm sm:text-base text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-all resize-none shadow-xs leading-relaxed"
                  placeholder={byLanguage(language, {
                    es: "Escribe aquí tu problema... Ej: 'Tengo a dos personas pasando datos de correos electrónicos a un Excel todos los días. Toman mucho tiempo y a veces cometen errores.'",
                    en: "Describe your problem here... e.g. 'I have two people copying data from emails to Excel every day. It takes too long and they make errors.'",
                    pt: "Escreva seu problema aqui... Ex: 'Tenho duas pessoas copiando dados de e-mails para o Excel todos os dias. Demora muito e às vezes cometem erros.'",
                  })}
                  disabled={evalLoading}
                />
              </div>

              {/* Progress Steps Animation */}
              {evalLoading ? (
                <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 space-y-2 text-xs font-semibold">
                  <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                    <div className="h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0" />
                    <span>
                      {evalStep === 1 && byLanguage(language, { es: "1. Extrayendo variables de negocio y orígenes de datos...", en: "1. Extracting business variables and data sources...", pt: "1. Extraindo variáveis de negócio e fontes de dados..." })}
                      {evalStep === 2 && byLanguage(language, { es: "2. Evaluando ambigüedad, herramientas y nivel de autonomía...", en: "2. Evaluating ambiguity, tools, and autonomy level...", pt: "2. Avaliando ambiguidade, ferramentas e nível de autonomia..." })}
                      {evalStep >= 3 && byLanguage(language, { es: "3. Calculando score de viabilidad y precarga de Blueprint...", en: "3. Computing feasibility score and prefilling Blueprint...", pt: "3. Calculando pontuação de viabilidade e pré-carregamento..." })}
                    </span>
                  </div>
                </div>
              ) : null}

              {evalError ? (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{evalError}</span>
                </div>
              ) : null}

              <button
                type="button"
                id="btn-run-sim"
                onClick={handleRunAnalysis}
                disabled={evalLoading}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 hover:scale-[1.01]"
              >
                <Sparkles className="h-4 w-4" />
                <span>
                  {byLanguage(language, {
                    es: "Analizar si la IA puede ayudarme ($0 USD)",
                    en: "Analyze if AI can help me ($0 USD)",
                    pt: "Analisar se a IA pode me ajudar ($0 USD)",
                  })}
                </span>
              </button>
            </div>
          ) : null}

          {/* DIAGNOSTIC RESULTS SCORECARD */}
          {evalResult ? (
            <div className="space-y-6 animate-fade-in">
              {/* Verdict Banner */}
              <div
                className={`p-6 rounded-2xl border ${
                  evalResult.verdict_badge === "viable"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800"
                    : evalResult.verdict_badge === "partially_viable"
                    ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800"
                    : "bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${
                        evalResult.verdict_badge === "viable"
                          ? "bg-emerald-200/80 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200"
                          : evalResult.verdict_badge === "partially_viable"
                          ? "bg-amber-200/80 dark:bg-amber-900 text-amber-800 dark:text-amber-200"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {evalResult.verdict_badge === "viable"
                        ? byLanguage(language, { es: "¡Sí, la IA puede automatizar esto!", en: "Yes, AI can automate this!", pt: "Sim, a IA pode automatizar isso!" })
                        : evalResult.verdict_badge === "partially_viable"
                        ? byLanguage(language, { es: "Viabilidad Parcial (Supervisión Requerida)", en: "Partially Viable (Supervision Required)", pt: "Viabilidade Parcial (Supervisão Necessária)" })
                        : byLanguage(language, { es: "Alternativa Determinista Recomendada", en: "Deterministic Alternative Recommended", pt: "Alternativa Determinística Recomendada" })}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                      {evalResult.verdict_title}
                    </h3>
                    <p className="text-slate-700 dark:text-slate-300 text-sm mt-1 leading-relaxed">
                      {evalResult.verdict_summary}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                      {evalResult.readiness_score}%
                    </div>
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {byLanguage(language, { es: "Índice de Viabilidad", en: "Viability Index", pt: "Índice de Viabilidade" })}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3 Pillars Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Archetype */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-1.5">
                    <Bot className="h-4 w-4" />
                    <span>{byLanguage(language, { es: "Arquetipo Sugerido", en: "Suggested Archetype", pt: "Arquétipo Sugerido" })}</span>
                  </div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {evalResult.suggested_archetype || "Orquestador de Tareas"}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {byLanguage(language, {
                      es: "Arquitectura adaptada a tus herramientas.",
                      en: "Architecture tailored to your tools.",
                      pt: "Arquitetura adaptada às suas ferramentas.",
                    })}
                  </div>
                </div>

                {/* Strengths */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{byLanguage(language, { es: "Puntos Fuertes", en: "Key Strengths", pt: "Pontos Fortes" })}</span>
                  </div>
                  <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                    {evalResult.key_strengths?.slice(0, 2).map((s, idx) => (
                      <li key={idx} className="line-clamp-1">• {s}</li>
                    )) || <li>• Proceso repetitivo con reglas identificables.</li>}
                  </ul>
                </div>

                {/* Risks / HITL */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold mb-1.5">
                    <ShieldAlert className="h-4 w-4" />
                    <span>{byLanguage(language, { es: "Control de Riesgo / HITL", en: "Risk Control / HITL", pt: "Controle de Risco / HITL" })}</span>
                  </div>
                  <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                    {evalResult.key_risks_or_gaps?.slice(0, 2).map((r, idx) => (
                      <li key={idx} className="line-clamp-1">• {r}</li>
                    )) || <li>• Definir umbrales de aprobación humana.</li>}
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-center gap-2"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>{byLanguage(language, { es: "Probar otra idea", en: "Test another idea", pt: "Testar outra ideia" })}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onStartBlueprint("blueprint")}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
                >
                  <span>
                    {byLanguage(language, {
                      es: "Crear Blueprint Free con este diagnóstico →",
                      en: "Create Free Blueprint with this diagnosis →",
                      pt: "Criar Blueprint Free com este diagnóstico →",
                    })}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
