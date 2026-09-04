"use client";

import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  CornerDownRight,
  HelpCircle,
  Send,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { byLanguage } from "@/features/product-experience/core/localized-copy";
import { useLanguage } from "@/core/i18n/language-context";
import {
  UxaBadge,
  UxaButton,
  UxaSurface,
} from "@/features/product-experience/design-system";
import type { ConstructionQuestionViewEntry } from "@/features/sessions/session-contracts";
import { sessionsApi } from "@/features/sessions/session-api";

export type AcpResolutionStageProps = {
  sessionId: string;
  questions: ConstructionQuestionViewEntry[];
  onQuestionsUpdated: () => Promise<void> | void;
  onProceedToValidation: () => void;
};

export function AcpResolutionStage({
  sessionId,
  questions,
  onQuestionsUpdated,
  onProceedToValidation,
}: AcpResolutionStageProps) {
  const { language } = useLanguage();
  const [submittingKey, setSubmittingKey] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [customAnswerDrafts, setCustomAnswerDrafts] = useState<Record<string, string>>({});
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});

  // Contadores
  const totalQuestions = questions.length;
  const answeredQuestions = questions.filter(
    (q) => q.status === "answered" || q.status === "resolved",
  );
  const deferredQuestions = questions.filter((q) => q.status === "deferred");
  const dismissedQuestions = questions.filter((q) => q.status === "dismissed");
  const openQuestions = questions.filter(
    (q) => q.status === "open" || (!q.status && !q.answer_text),
  );
  const blockingOpenQuestions = openQuestions.filter((q) => q.blocking);

  const canProceed = openQuestions.length === 0;

  async function handleAnswerQuestion(
    questionKey: string,
    decision: "answer" | "choose_option" | "delegate" | "dismiss",
    textValue = "",
    selectedOptionKey = "",
  ) {
    if (submittingKey) return;
    setSubmittingKey(questionKey);
    setErrorNotice(null);

    try {
      await sessionsApi.answerAcpQuestion(sessionId, questionKey, {
        answer_text: textValue,
        decision,
        selected_option_key: selectedOptionKey,
        impacted_artifacts: [],
        owner_role: "",
      });
      await onQuestionsUpdated();
    } catch (err) {
      setErrorNotice(
        err instanceof Error ? err.message : "Error al procesar la resolución de la pregunta.",
      );
    } finally {
      setSubmittingKey(null);
    }
  }

  function toggleDetails(key: string) {
    setExpandedDetails((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="space-y-6">
      {/* Cabecera explicativa de Etapa 1 */}
      <UxaSurface className="p-[var(--uxa-panel-padding-lg)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <UxaBadge tone="brand">
                {byLanguage(language, {
                  en: "Stage 1 · Resolve",
                  es: "Etapa 1 · Resolver",
                  pt: "Etapa 1 · Resolver",
                })}
              </UxaBadge>
              {canProceed ? (
                <UxaBadge tone="success">
                  {byLanguage(language, {
                    en: "Ready for Validation",
                    es: "Listo para Validación",
                    pt: "Pronto para Validação",
                  })}
                </UxaBadge>
              ) : (
                <UxaBadge tone="warning">
                  {openQuestions.length}{" "}
                  {byLanguage(language, {
                    en: "pending to resolve",
                    es: "pendientes por resolver",
                    pt: "pendentes para resolver",
                  })}
                </UxaBadge>
              )}
            </div>
            <h2 className="mt-2 text-[20px] font-black">
              {byLanguage(language, {
                en: "Resolve Implementation Questions and Blockers",
                es: "Resolver preguntas y bloqueos de implementación",
                pt: "Resolver perguntas e bloqueios de implementação",
              })}
            </h2>
            <p className="mt-1 max-w-3xl text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">
              {byLanguage(language, {
                en: "Decide on runtime settings, deployment, and external systems. You can answer now, choose a suggested proposal, delegate to the agent tool, or dismiss non-relevant questions.",
                es: "Toma decisiones de configuración de runtime, despliegue y sistemas externos. Puedes responder directamente, escoger una propuesta del sistema, delegar al agente implementador o descartar preguntas no relevantes.",
                pt: "Tome decisões de configuração de runtime, deploy e sistemas externos. Você pode responder diretamente, escolher uma proposta do sistema, delegar ao agente implementador ou descartar perguntas não relevantes.",
              })}
            </p>
          </div>

          {/* Botón de Gate superior */}
          <div className="shrink-0">
            <UxaButton
              disabled={!canProceed}
              onClick={onProceedToValidation}
              size="md"
              variant="primary"
            >
              <span>
                {byLanguage(language, {
                  en: "Continue to Validation",
                  es: "Continuar a Validación",
                  pt: "Continuar para Validação",
                })}
              </span>
              <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
            </UxaButton>
          </div>
        </div>

        {/* Barra métrica de resolución: Total -> Resueltas -> Delegadas -> Descartadas -> Pendientes */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="rounded-xl border border-[var(--uxa-color-border)] bg-slate-50/70 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-[var(--uxa-color-ink-muted)]">
              {byLanguage(language, { en: "Total questions", es: "Total preguntas", pt: "Total perguntas" })}
            </p>
            <p className="mt-1 text-[22px] font-black text-[var(--uxa-color-ink)]">{totalQuestions}</p>
          </div>

          <div className="rounded-xl border border-[var(--uxa-color-border)] bg-[var(--uxa-state-success-bg)]/40 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-[var(--uxa-state-success)]">
              {byLanguage(language, { en: "Answered", es: "Respondidas", pt: "Respondidas" })}
            </p>
            <p className="mt-1 text-[22px] font-black text-[var(--uxa-state-success)]">
              {answeredQuestions.length}
            </p>
          </div>

          <div className="rounded-xl border border-[var(--uxa-color-border)] bg-amber-50/50 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-700">
              {byLanguage(language, { en: "Delegated", es: "Delegadas", pt: "Delegadas" })}
            </p>
            <p className="mt-1 text-[22px] font-black text-amber-800">
              {deferredQuestions.length}
            </p>
          </div>

          <div className="rounded-xl border border-[var(--uxa-color-border)] bg-slate-100/60 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-600">
              {byLanguage(language, { en: "Dismissed", es: "Descartadas", pt: "Descartadas" })}
            </p>
            <p className="mt-1 text-[22px] font-black text-slate-700">
              {dismissedQuestions.length}
            </p>
          </div>

          <div className={cn(
            "rounded-xl border p-3",
            openQuestions.length > 0
              ? "border-[var(--uxa-state-warning)] bg-[var(--uxa-state-warning-bg)]/50"
              : "border-[var(--uxa-state-success)] bg-[var(--uxa-state-success-bg)]/50",
          )}>
            <p className="text-[10px] font-black uppercase tracking-wider text-[var(--uxa-color-ink-muted)]">
              {byLanguage(language, { en: "Pending", es: "Pendientes", pt: "Pendentes" })}
            </p>
            <p className={cn(
              "mt-1 text-[22px] font-black",
              openQuestions.length > 0 ? "text-[var(--uxa-state-warning)]" : "text-[var(--uxa-state-success)]",
            )}>
              {openQuestions.length}
            </p>
          </div>
        </div>

        {/* Mensaje de Gate */}
        {!canProceed ? (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-[var(--uxa-state-warning)] bg-[var(--uxa-state-warning-bg)]/30 px-3.5 py-2.5 text-[12px] text-[var(--uxa-color-ink-soft)]">
            <Clock aria-hidden="true" className="h-4 w-4 shrink-0 text-[var(--uxa-state-warning)]" />
            <span>
              {byLanguage(language, {
                en: `Gate active: Resolve or delegate the remaining ${openQuestions.length} question(s) to unlock Stage 2 (Validation).`,
                es: `Gate activo: Resuelve o delega las ${openQuestions.length} pregunta(s) pendientes para habilitar la Etapa 2 (Validación).`,
                pt: `Gate ativo: Resolva ou delegue as ${openQuestions.length} pergunta(s) pendentes para liberar a Etapa 2 (Validação).`,
              })}
            </span>
          </div>
        ) : (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[var(--uxa-state-success)] bg-[var(--uxa-state-success-bg)]/30 px-3.5 py-2.5 text-[12px] text-[var(--uxa-state-success)] font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0" />
              <span>
                {byLanguage(language, {
                  en: "Gate passed! All implementation questions have been classified. You can proceed to Validation.",
                  es: "¡Gate superado! Todas las preguntas de implementación han sido clasificadas. Ya puedes avanzar a Validación.",
                  pt: "Gate superado! Todas as perguntas de implementação foram classificadas. Você já pode avançar para a Validação.",
                })}
              </span>
            </div>
            <button
              className="inline-flex items-center gap-1 font-bold underline hover:opacity-80 cursor-pointer"
              onClick={onProceedToValidation}
              type="button"
            >
              <span>{byLanguage(language, { en: "Proceed now", es: "Avanzar ahora", pt: "Avançar agora" })}</span>
              <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </UxaSurface>

      {/* Alerta de error si ocurre */}
      {errorNotice ? (
        <div className="rounded-xl border border-[var(--uxa-state-danger)] bg-[var(--uxa-state-danger-bg)] p-4 text-[13px] text-red-900">
          <p className="font-bold">{errorNotice}</p>
        </div>
      ) : null}

      {/* Lista de Preguntas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[16px] font-black text-[var(--uxa-color-ink)]">
            {byLanguage(language, {
              en: "Implementation Questions & Blockers",
              es: "Preguntas de Implementación y Bloqueos",
              pt: "Perguntas de Implementação e Bloqueios",
            })}
          </h3>
          <span className="text-[12px] font-bold text-[var(--uxa-color-ink-soft)]">
            {questions.length} {byLanguage(language, { en: "total", es: "en total", pt: "no total" })}
          </span>
        </div>
        {questions.length === 0 ? (
          <div className="rounded-2xl border border-[var(--uxa-color-border)] bg-white p-8 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-[var(--uxa-state-success)]" />
            <h4 className="mt-3 text-[15px] font-black text-[var(--uxa-color-ink)]">
              {byLanguage(language, {
                en: "No Implementation Questions Pending",
                es: "Sin preguntas de implementación pendientes",
                pt: "Sem perguntas de implementação pendentes",
              })}
            </h4>
            <p className="mt-1 text-[13px] text-[var(--uxa-color-ink-soft)]">
              {byLanguage(language, {
                en: "All technical parameters are defined or no blocking gaps were found. You can proceed directly to Validation.",
                es: "Todos los parámetros técnicos están definidos o no se encontraron bloqueos. Puedes avanzar directamente a Validación.",
                pt: "Todos os parâmetros técnicos estão definidos ou ningún bloqueio foi encontrado. Você pode avanzar para a Validação.",
              })}
            </p>
            <div className="mt-4 flex justify-center">
              <UxaButton onClick={onProceedToValidation} size="md" variant="primary">
                <span>{byLanguage(language, { en: "Proceed to Validation", es: "Avanzar a Validación", pt: "Avançar para Validação" })}</span>
                <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
              </UxaButton>
            </div>
          </div>
        ) : null}

        {questions.map((question) => {
          const isOpen = question.status === "open" || (!question.status && !question.answer_text);
          const isAnswered = question.status === "answered" || question.status === "resolved";
          const isDeferred = question.status === "deferred";
          const isDismissed = question.status === "dismissed";
          const isBusy = submittingKey === question.question_key;
          const showDetails = Boolean(expandedDetails[question.question_key]);
          const currentDraft = customAnswerDrafts[question.question_key] ?? "";

          return (
            <div
              className={cn(
                "rounded-2xl border p-5 transition shadow-xs",
                isOpen && question.blocking && "border-[var(--uxa-state-danger)] bg-white",
                isOpen && !question.blocking && "border-[var(--uxa-color-border)] bg-white",
                isAnswered && "border-[var(--uxa-state-success)]/40 bg-[var(--uxa-state-success-bg)]/20",
                isDeferred && "border-amber-300 bg-amber-50/30",
                isDismissed && "border-slate-200 bg-slate-50/60 opacity-80",
              )}
              key={question.question_key}
            >
              {/* Encabezado de la tarjeta */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {isOpen ? (
                    question.blocking ? (
                      <UxaBadge tone="danger">
                        {byLanguage(language, { en: "Blocking", es: "Bloqueante", pt: "Bloqueante" })}
                      </UxaBadge>
                    ) : (
                      <UxaBadge tone="warning">
                        {byLanguage(language, { en: "Pending", es: "Pendiente", pt: "Pendente" })}
                      </UxaBadge>
                    )
                  ) : isAnswered ? (
                    <UxaBadge tone="success">
                      {byLanguage(language, { en: "Answered", es: "Respondida", pt: "Respondida" })}
                    </UxaBadge>
                  ) : isDeferred ? (
                    <UxaBadge tone="warning">
                      {byLanguage(language, { en: "Delegated to Agent", es: "Delegada al Agente", pt: "Delegada ao Agente" })}
                    </UxaBadge>
                  ) : (
                    <UxaBadge tone="neutral">
                      {byLanguage(language, { en: "Dismissed", es: "Descartada", pt: "Descartada" })}
                    </UxaBadge>
                  )}

                  <UxaBadge tone="neutral">{question.domain || "general"}</UxaBadge>

                  {question.target_owner ? (
                    <span className="text-[11px] text-[var(--uxa-color-ink-muted)]">
                      {question.target_owner}
                    </span>
                  ) : null}
                </div>

                <button
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--uxa-color-ink-soft)] hover:text-[var(--uxa-color-ink)] cursor-pointer"
                  onClick={() => toggleDetails(question.question_key)}
                  type="button"
                >
                  <span>
                    {showDetails
                      ? byLanguage(language, { en: "Less details", es: "Menos detalles", pt: "Menos detalhes" })
                      : byLanguage(language, { en: "View details & impact", es: "Ver detalles e impacto", pt: "Ver detalhes e impacto" })}
                  </span>
                  {showDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              </div>

              {/* Pregunta principal */}
              <h4 className="mt-3 text-[15px] font-black text-[var(--uxa-color-ink)]">
                {question.question_text}
              </h4>

              {question.rationale ? (
                <p className="mt-1 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
                  {question.rationale}
                </p>
              ) : null}

              {/* Detalles expandibles (impacto, artefactos vinculados, etc.) */}
              {showDetails ? (
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-[12px] space-y-2">
                  {question.gap_title ? (
                    <p>
                      <span className="font-bold text-slate-700">Gap:</span> {question.gap_title}
                    </p>
                  ) : null}
                  {question.impact_analysis?.impact_summary ? (
                    <p>
                      <span className="font-bold text-slate-700">Impacto estimado:</span> {question.impact_analysis.impact_summary}
                    </p>
                  ) : null}
                  {question.impacted_artifacts?.length ? (
                    <div>
                      <span className="font-bold text-slate-700">Artefactos vinculados:</span>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {question.impacted_artifacts.map((art) => (
                          <span className="rounded-md bg-white px-2 py-0.5 font-mono text-[11px] text-slate-600 border" key={art}>
                            {art}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* Si ya está respondida, delegada o descartada: mostrar resolución */}
              {!isOpen ? (
                <div className="mt-4 rounded-xl border border-[var(--uxa-color-border)] bg-white/90 p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-wider text-[var(--uxa-color-ink-muted)]">
                        {isAnswered
                          ? byLanguage(language, { en: "Recorded decision", es: "Decisión registrada", pt: "Decisão registrada" })
                          : isDeferred
                          ? byLanguage(language, { en: "Delegated instruction", es: "Instrucción delegada", pt: "Instrução delegada" })
                          : byLanguage(language, { en: "Dismissal note", es: "Nota de descarte", pt: "Nota de descarte" })}
                      </p>
                      <p className="mt-1 text-[13px] font-semibold text-[var(--uxa-color-ink)]">
                        {question.answer_text || "—"}
                      </p>
                      {question.answered_by_display ? (
                        <p className="mt-1 text-[11px] text-[var(--uxa-color-ink-soft)]">
                          {byLanguage(language, { en: "Registered by", es: "Registrado por", pt: "Registrado por" })}: {question.answered_by_display}
                        </p>
                      ) : null}
                    </div>

                    {/* Botón para reabrir / modificar */}
                    <button
                      className="text-[11px] font-bold text-[var(--uxa-color-brand)] hover:underline cursor-pointer shrink-0"
                      disabled={isBusy}
                      onClick={() =>
                        handleAnswerQuestion(question.question_key, "answer", "", "")
                      }
                      type="button"
                    >
                      {byLanguage(language, { en: "Modify decision", es: "Cambiar decisión", pt: "Alterar decisão" })}
                    </button>
                  </div>
                </div>
              ) : (
                /* ACCIONES DISPONIBLES: 1. Escoger propuesta / 2. Responder / 3. Delegar / 4. Descartar */
                <div className="mt-4 space-y-3 pt-3 border-t border-[var(--uxa-color-border)]">
                  {/* Alternativa 1: Escoger propuesta (si hay opciones) */}
                  {question.options && question.options.length > 0 ? (
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-wider text-[var(--uxa-color-brand)] flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" />
                        {byLanguage(language, {
                          en: "Option A · Choose a suggested proposal",
                          es: "Alternativa A · Escoger una respuesta propuesta",
                          pt: "Alternativa A · Escolher uma resposta sugerida",
                        })}
                      </p>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {question.options.map((opt) => (
                          <button
                            className="flex items-center justify-between gap-2 rounded-xl border border-[var(--uxa-color-border)] bg-white p-3 text-left transition hover:border-[var(--uxa-color-brand)] hover:bg-[var(--uxa-color-brand-soft)]/10 cursor-pointer disabled:opacity-50"
                            disabled={isBusy}
                            key={opt.key}
                            onClick={() =>
                              handleAnswerQuestion(
                                question.question_key,
                                "choose_option",
                                opt.label,
                                opt.key,
                              )
                            }
                            type="button"
                          >
                            <span className="text-[12px] font-bold text-[var(--uxa-color-ink)]">
                              {opt.label}
                            </span>
                            <CornerDownRight className="h-3.5 w-3.5 text-[var(--uxa-color-brand)] shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Alternativa 2: Responder con texto libre */}
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-wider text-[var(--uxa-color-ink-muted)]">
                      {byLanguage(language, {
                        en: "Option B · Enter a custom answer",
                        es: "Alternativa B · Proporcionar respuesta nueva o diferente",
                        pt: "Alternativa B · Fornecer resposta nova ou diferente",
                      })}
                    </p>
                    <div className="mt-1.5 flex gap-2">
                      <input
                        className="flex-1 rounded-xl border border-[var(--uxa-color-border)] bg-white px-3 py-2 text-[12px] text-[var(--uxa-color-ink)] placeholder:text-slate-400 focus:border-[var(--uxa-color-brand)] focus:outline-none"
                        disabled={isBusy}
                        onChange={(e) =>
                          setCustomAnswerDrafts((prev) => ({
                            ...prev,
                            [question.question_key]: e.target.value,
                          }))
                        }
                        placeholder={byLanguage(language, {
                          en: "Type your answer or technical specification...",
                          es: "Escribe tu respuesta o especificación técnica...",
                          pt: "Digite sua resposta ou especificação técnica...",
                        })}
                        type="text"
                        value={currentDraft}
                      />
                      <UxaButton
                        disabled={isBusy || !currentDraft.trim()}
                        onClick={() =>
                          handleAnswerQuestion(
                            question.question_key,
                            "answer",
                            currentDraft,
                            "",
                          )
                        }
                        size="sm"
                        variant="secondary"
                      >
                        <Send className="h-3.5 w-3.5 mr-1" />
                        <span>{byLanguage(language, { en: "Save", es: "Responder", pt: "Salvar" })}</span>
                      </UxaButton>
                    </div>
                  </div>

                  {/* Alternativas 3 y 4: Delegar o Descartar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                    {/* Botón Delegar */}
                    <button
                      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50/80 px-3 py-1.5 text-[11px] font-bold text-amber-900 transition hover:bg-amber-100 cursor-pointer disabled:opacity-50"
                      disabled={isBusy}
                      onClick={() =>
                        handleAnswerQuestion(
                          question.question_key,
                          "delegate",
                          "Delegado formalmente para resolución durante la implementación.",
                          "",
                        )
                      }
                      title={byLanguage(language, {
                        en: "The question travels in the ACP bundle for the implementing agent to prompt the developer.",
                        es: "La pregunta viajará en el paquete ACP para que el agente la formule al desarrollador en implementación.",
                        pt: "A pergunta viajará no pacote ACP para o agente formular ao desenvolvedor na implementação.",
                      })}
                      type="button"
                    >
                      <Users className="h-3.5 w-3.5 text-amber-700" />
                      <span>
                        {byLanguage(language, {
                          en: "Delegate to Implementation Tool",
                          es: "Delegar a herramienta de implementación",
                          pt: "Delegar para ferramenta de implementação",
                        })}
                      </span>
                    </button>

                    {/* Botón Descartar */}
                    <button
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-red-700 cursor-pointer disabled:opacity-50"
                      disabled={isBusy}
                      onClick={() =>
                        handleAnswerQuestion(
                          question.question_key,
                          "dismiss",
                          "Descartada por el usuario como no relevante.",
                          "",
                        )
                      }
                      title={byLanguage(language, {
                        en: "Mark this question as not relevant for this agent scope.",
                        es: "Marcar esta pregunta como no relevante para el alcance de este agente.",
                        pt: "Marcar esta pergunta como não relevante para o escopo deste agente.",
                      })}
                      type="button"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>
                        {byLanguage(language, {
                          en: "Dismiss (not relevant)",
                          es: "Descartar (no aplica)",
                          pt: "Descartar (não se aplica)",
                        })}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
