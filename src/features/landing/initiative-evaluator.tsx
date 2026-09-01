"use client";

import { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  Lightbulb,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import { useLanguage } from "@/core/i18n/language-context";
import { byLanguage } from "@/features/product-experience/core/localized-copy";
import { cn } from "@/lib/utils";
import {
  evaluateInitiativeApi,
  type InitiativeEvaluationResponse,
} from "./initiative-evaluator-contracts";

type InitiativeEvaluatorProps = {
  onStartProject?: (prefill: { title?: string; initial_prompt?: string; archetype?: string }) => void | Promise<void>;
  className?: string;
};

export function InitiativeEvaluator({ onStartProject, className }: InitiativeEvaluatorProps) {
  const { language, t } = useLanguage();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InitiativeEvaluationResponse | null>(null);
  const [showDimensionsDetail, setShowDimensionsDetail] = useState(true);

  const examples = [
    {
      icon: "📄",
      label: t("scanner.chip1", "Tenemos 6 personas revisando facturas..."),
      text: byLanguage(language, {
        es: "Tenemos 6 personas revisando facturas y contratos en PDF manualmente, verificando precios contra el ERP SAP y necesitamos automatizar la validación dejando solo las discrepancias para aprobación humana.",
        en: "We have 6 people manually reviewing invoices and contracts in PDF, verifying prices against SAP ERP, and we need to automate validation leaving only discrepancies for human approval.",
        pt: "Temos 6 pessoas revisando faturas e contratos em PDF manualmente, verificando preços no ERP SAP e precisamos automatizar a validação deixando apenas discrepâncias para aprovação humana.",
      }),
    },
    {
      icon: "💬",
      label: t("scanner.chip2", "Quiero automatizar soporte de clientes..."),
      text: byLanguage(language, {
        es: "Quiero automatizar el soporte de clientes para que un agente clasifique tickets de Zendesk, consulte órdenes en la base de datos de compras, tome decisiones de reembolso y escale al supervisor si supera $100.",
        en: "I want to automate customer support so an agent classifies Zendesk tickets, queries orders in the database, makes refund decisions, and escalates to a supervisor if over $100.",
        pt: "Quero automatizar o suporte ao cliente para que um agente classifique tickets do Zendesk, consulte pedidos no banco de dados, tome decisões de reembolso e escale ao supervisor se passar de $100.",
      }),
    },
    {
      icon: "📑",
      label: t("scanner.chip3", "Necesitamos analizar documentos y solicitar aprobación..."),
      text: byLanguage(language, {
        es: "Necesitamos analizar documentos regulatorios complejos, comparar cláusulas contra políticas internas de cumplimiento y solicitar aprobación humana si se detectan riesgos altos.",
        en: "We need to analyze complex regulatory documents, compare clauses against internal compliance policies, and request human approval if high risks are detected.",
        pt: "Precisamos analisar documentos regulatórios complexos, comparar cláusulas com políticas internas de conformidade e solicitar aprovação humana se forem detectados altos riscos.",
      }),
    },
  ];

  async function handleEvaluate() {
    if (!text.trim() || text.trim().length < 5) {
      setError(
        byLanguage(language, {
          es: "Por favor describe el caso de uso que deseas resolver (mínimo 5 caracteres).",
          en: "Please describe the use case you want to solve (minimum 5 characters).",
          pt: "Por favor, descreva o caso de uso que deseja resolver (mínimo 5 caracteres).",
        }),
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const evaluation = await evaluateInitiativeApi({
        initiative_text: text,
        language: language as "es" | "en" | "pt",
      });
      setResult(evaluation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error evaluando iniciativa");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setError(null);
    setText("");
  }

  return (
    <div
      className={cn(
        "w-full rounded-2xl border border-[var(--border-default)] bg-white p-6 shadow-sm sm:p-8 transition-all",
        className,
      )}
    >
      {/* Header Centrado Estilo 'Experiencia Directa de Producto' */}
      <div className="flex flex-col items-center text-center pb-6">
        <span className="inline-block rounded-full bg-blue-50 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-700">
          {t("scanner.pill", "EXPERIENCIA DIRECTA DE PRODUCTO")}
        </span>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl lg:text-[32px]">
          {t("landing.scannerTitle", "¿Qué quieres resolver?")}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          {t(
            "landing.scannerSubtitle",
            "Prueba el análisis inicial de LAB sin compromiso. Describe el problema de tu negocio en lenguaje natural.",
          )}
        </p>

        {result ? (
          <div className="mt-4">
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] transition"
              type="button"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{t("scanner.reset", "Evaluar otra iniciativa")}</span>
            </button>
          </div>
        ) : null}
      </div>

      {!result ? (
        /* Formulario de Entrada con Ejemplos Arriba */
        <div className="space-y-4">
          {/* Quick Examples Chips Arriba del Textarea */}
          <div>
            <p className="mb-2 text-xs font-semibold text-[var(--text-secondary)]">
              {t("scanner.quickExamplesTitle", "Ejemplos rápidos para probar:")}
            </p>
            <div className="flex flex-wrap gap-2">
              {examples.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setText(item.text)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] hover:bg-blue-50/50 shadow-2xs transition"
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="initiative-text" className="sr-only">
              Descripción de la iniciativa
            </label>
            <textarea
              id="initiative-text"
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t(
                "scanner.placeholder",
                "Describe tu necesidad de negocio aquí... Ej: Tenemos un proceso manual en el que 4 personas procesan solicitudes de crédito comparando extractos bancarios contra reglas internas...",
              )}
              className="w-full rounded-xl border border-[var(--border-default)] p-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-soft)] transition leading-relaxed"
              disabled={loading}
            />
            <div className="mt-1.5 flex items-center justify-between text-xs text-[var(--text-tertiary)]">
              <span>{t("scanner.tokenNotice", "Escaneo token-optimizado con inferencia en <1.5s")}</span>
              <span>{text.length}/4000</span>
            </div>
          </div>

          {error ? (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          {/* Action Button Prominente */}
          <div className="pt-2">
            <button
              onClick={handleEvaluate}
              disabled={loading || text.trim().length === 0}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#444ce7] hover:bg-[#3538cd] px-6 text-sm font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-50 transition"
              type="button"
            >
              {loading ? (
                <>
                  <Cpu className="h-4 w-4 animate-spin" />
                  <span>{t("scanner.evaluating", "Analizando idoneidad agéntica...")}</span>
                </>
              ) : (
                <>
                  <span className="text-xs">▶</span>
                  <span>{t("scanner.btnAnalyze", "Analizar mi caso gratis")}</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Scorecard de Resultados */
        <div className="mt-6 space-y-6 animate-in fade-in-50 duration-300">
          {/* Tarjeta Principal de Veredicto */}
          <div
            className={cn(
              "rounded-xl border p-5 sm:p-6 transition-all",
              result.is_viable
                ? "border-emerald-200 bg-emerald-50/40"
                : result.verdict_badge === "partially_viable"
                  ? "border-amber-200 bg-amber-50/40"
                  : "border-rose-200 bg-rose-50/40",
            )}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3.5">
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                    result.is_viable
                      ? "bg-emerald-600 text-white shadow-sm shadow-emerald-200"
                      : result.verdict_badge === "partially_viable"
                        ? "bg-amber-500 text-white shadow-sm shadow-amber-200"
                        : "bg-rose-500 text-white shadow-sm shadow-rose-200",
                  )}
                >
                  {result.is_viable ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : result.verdict_badge === "partially_viable" ? (
                    <AlertTriangle className="h-6 w-6" />
                  ) : (
                    <ShieldAlert className="h-6 w-6" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wider",
                        result.is_viable
                          ? "bg-emerald-100 text-emerald-800"
                          : result.verdict_badge === "partially_viable"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800",
                      )}
                    >
                      {result.verdict_badge === "viable"
                        ? t("scanner.verdictViable", "Candidato Óptimo para Agente")
                        : result.verdict_badge === "partially_viable"
                          ? t("scanner.verdictPartial", "Parcialmente Viable")
                          : t("scanner.verdictNotRecommended", "No Recomendado para Agente")}
                    </span>

                    {result.suggested_tier ? (
                      <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800 uppercase">
                        Nivel: {result.suggested_tier}
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mt-1 text-lg font-bold text-[var(--text-primary)]">
                    {result.verdict_title}
                  </h3>
                </div>
              </div>

              {/* Score Circular / Pill */}
              <div className="flex items-center gap-3 self-end sm:self-auto">
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                    {t("scanner.scoreLabel", "Índice de Idoneidad")}
                  </p>
                  <p className="text-2xl font-black text-[var(--text-primary)]">
                    {result.readiness_score}
                    <span className="text-sm font-normal text-[var(--text-secondary)]">/100</span>
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)] border-t border-black/5 pt-3">
              {result.verdict_summary}
            </p>

            {result.suggested_archetype ? (
              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
                <Bot className="h-4 w-4 text-[var(--brand-primary)]" />
                <span>
                  {t("scanner.suggestedArchetype", "Arquetipo Recomendado")}:{" "}
                  <span className="text-[var(--brand-primary)]">{result.suggested_archetype}</span>
                </span>
              </div>
            ) : null}
          </div>

          {/* Alternativa Estratégica si NO es viable */}
          {result.alternative ? (
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5 space-y-3">
              <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
                <Lightbulb className="h-4 w-4" />
                <span>{t("scanner.alternativeTitle", "Recomendación Estratégica Alternativa")}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg bg-white p-3 border border-blue-100">
                  <p className="font-bold text-blue-900 mb-1">
                    Tecnología Recomendada:
                  </p>
                  <p className="text-[var(--text-secondary)] font-medium">
                    {result.alternative.recommended_technology}
                  </p>
                </div>

                <div className="rounded-lg bg-white p-3 border border-blue-100">
                  <p className="font-bold text-blue-900 mb-1">
                    {t("scanner.whyNotAgent", "¿Por qué no construir un agente?")}
                  </p>
                  <p className="text-[var(--text-secondary)]">
                    {result.alternative.why_not_agent}
                  </p>
                </div>

                <div className="rounded-lg bg-white p-3 border border-blue-100">
                  <p className="font-bold text-blue-900 mb-1">
                    {t("scanner.costRisk", "Comparativa de Costo y Riesgo")}
                  </p>
                  <p className="text-[var(--text-secondary)]">
                    {result.alternative.estimated_cost_risk}
                  </p>
                </div>

                <div className="rounded-lg bg-white p-3 border border-blue-100">
                  <p className="font-bold text-blue-900 mb-1">
                    {t("scanner.nextStep", "Siguiente Paso Sugerido")}
                  </p>
                  <p className="text-[var(--text-secondary)]">
                    {result.alternative.suggested_next_step}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Desglose de las 5 Dimensiones */}
          <div className="rounded-xl border border-[var(--border-default)] bg-white p-5">
            <button
              onClick={() => setShowDimensionsDetail((prev) => !prev)}
              className="flex w-full items-center justify-between text-left text-sm font-bold text-[var(--text-primary)]"
              type="button"
            >
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-[var(--brand-primary)]" />
                <span>{t("scanner.dimensionsTitle", "Diagnóstico de las 5 Dimensiones Agénticas")}</span>
              </div>
              {showDimensionsDetail ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showDimensionsDetail ? (
              <div className="mt-4 space-y-3.5 border-t border-[var(--border-subtle)] pt-4">
                {result.dimensions.map((dim) => (
                  <div key={dim.dimension_key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[var(--text-primary)]">
                        {dim.dimension_name}
                      </span>
                      <span
                        className={cn(
                          "font-mono font-bold",
                          dim.score >= 70
                            ? "text-emerald-600"
                            : dim.score >= 45
                              ? "text-amber-600"
                              : "text-rose-600",
                        )}
                      >
                        {dim.score}/100
                      </span>
                    </div>

                    {/* Progress Track */}
                    <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          dim.score >= 70
                            ? "bg-emerald-500"
                            : dim.score >= 45
                              ? "bg-amber-500"
                              : "bg-rose-500",
                        )}
                        style={{ width: `${dim.score}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-[var(--text-secondary)]">
                      {dim.justification}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* CTA Principal de Conversión */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {result.is_viable ? (
              <button
                onClick={() => {
                  if (onStartProject) {
                    void onStartProject({
                      title: result.prefilled_project_data.title,
                      initial_prompt: result.prefilled_project_data.initial_prompt,
                      archetype: result.prefilled_project_data.archetype,
                    });
                  }
                }}
                className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-6 text-sm font-bold text-white shadow-sm hover:opacity-90 transition"
                type="button"
              >
                <span>{t("scanner.ctaBuild", "Iniciar Blueprint de esta Solución")}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleReset}
                className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gray-900 px-6 text-sm font-bold text-white shadow-sm hover:bg-black transition"
                type="button"
              >
                <span>{t("scanner.reset", "Evaluar otra iniciativa")}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
