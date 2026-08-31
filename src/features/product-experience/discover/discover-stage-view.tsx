"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  HelpCircle,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import {
  buildDiscoveryInput,
  createDiscoveryFormValues,
  DISCOVERY_COST_OPTIONS,
  DISCOVERY_TIME_SPENT_OPTIONS,
  formatDiscoveryMissingField,
  getDiscoveryFieldErrors,
  type DiscoveryFormErrors,
  type DiscoveryFormValues,
} from "@/features/discovery/discovery-adapter";
import {
  UxaBadge,
  UxaButton,
  UxaSurface,
  UxaTextField,
  UxaTextareaField,
  type UxaTone,
} from "@/features/product-experience/design-system";
import {
  LeanGeneratedDeliverable,
  LeanStageScreen,
  type LeanStageScreenContract,
} from "@/features/product-experience/stage-screen";
import type { ProductExperienceRouteSnapshot } from "@/features/product-experience/core/server-state";
import {
  buildDiscoverViewModel,
  getDiscoverPrimaryAction,
  getDiscoverSuggestionId,
  type DiscoverReviewDecision,
} from "@/features/product-experience/discover/discover-model";
import { byLanguage } from "@/features/product-experience/core/localized-copy";
import { getProductExperienceProductHref, getProductExperienceStageHref } from "@/features/product-experience/shell/experience-model";
import { isOperationActive } from "@/features/product-experience/operations/operation-model";
import type {
  ProductDiscoveryActions,
  ProductDiscoveryActionState,
} from "@/features/product-experience/shell/use-product-experience-route";
import type {
  DiscoveryAnalysisQuestion,
  DiscoveryArtifact,
} from "@/features/sessions/session-contracts";
import { useLanguage } from "@/core/i18n/language-context";
import type { TranslationKey } from "@/core/i18n/locales/es";
import { cn } from "@/lib/utils";

type DiscoverStageViewProps = {
  actionState?: ProductDiscoveryActionState;
  activeRoute: ProductExperienceRouteSnapshot | null;
  actions?: ProductDiscoveryActions;
};

type LocalActionState = {
  message?: string;
  status: "idle" | "submitting" | "success" | "error";
};

type DiscoverTranslate = (key: TranslationKey, fallback?: string) => string;

function getArtifactStateLabel(state: string | undefined, t: DiscoverTranslate) {
  switch (state) {
    case "approved":
      return t("artifactState.approved", "Approved");
    case "approved_legacy":
      return t("artifactState.approved_legacy", "Legacy approved");
    case "generated":
      return t("artifactState.generated", "Generated");
    case "needs_review_legacy":
      return t("artifactState.needs_review_legacy", "Legacy needs review");
    case "reviewed":
      return t("artifactState.reviewed", "Reviewed");
    case "rejected":
      return t("artifactState.rejected", "Rejected");
    case "stale":
      return t("artifactState.stale", "Outdated");
    default:
      return t("artifactState.none", "No proposal");
  }
}

function getQuestionPriorityLabel(priority: string, t: DiscoverTranslate) {
  switch (priority) {
    case "high":
      return t("common.priority.high", "High");
    case "medium":
      return t("common.priority.medium", "Medium");
    case "low":
      return t("common.priority.low", "Low");
    default:
      return priority;
  }
}

function getLocalizedStageLabel(stage: string, t: DiscoverTranslate) {
  switch (stage) {
    case "discover":
      return t("attention.stage.discover", "Discover");
    case "define":
      return t("attention.stage.define", "Define");
    case "design":
      return t("attention.stage.design", "Design");
    case "tools":
      return t("attention.stage.tools", "Tools");
    case "memory":
      return t("attention.stage.memory", "Memory");
    case "estimate":
      return t("attention.stage.estimate", "Estimate");
    case "validate":
      return t("attention.stage.validate", "Validate");
    case "package":
      return t("attention.stage.package", "Package");
    default:
      return stage;
  }
}

function getStatusCopy(t: DiscoverTranslate): Record<string, { description: string; label: string; tone: UxaTone }> {
  return {
    approved: {
      description: t("discover.status.approved.desc", "Discovery aprobado y listo como entrada trazable para Definir."),
      label: t("discover.status.approved.label", "Aprobado"),
      tone: "success",
    },
    draft: {
      description: t("discover.status.draft.desc", "Hay captura suficiente para guardar o analizar, pero todavia no existe aprobacion."),
      label: t("discover.status.draft.label", "Borrador"),
      tone: "info",
    },
    empty: {
      description: t("discover.status.empty.desc", "Completa la informacion minima para que el LLM analice sin asumir datos criticos."),
      label: t("discover.status.empty.label", "Sin iniciar"),
      tone: "neutral",
    },
    error: {
      description: t("discover.status.error.desc", "No fue posible recuperar la informacion real del proyecto."),
      label: t("discover.status.error.label", "Error"),
      tone: "danger",
    },
    loading: {
      description: t("discover.status.loading.desc", "Recuperando snapshot, atencion y operacion del proyecto."),
      label: t("discover.status.loading.label", "Cargando"),
      tone: "neutral",
    },
    processing: {
      description: t("discover.status.processing.desc", "El sistema esta ejecutando una accion real contra backend."),
      label: t("discover.status.processing.label", "Procesando"),
      tone: "warning",
    },
    stale: {
      description: t("discover.status.stale.desc", "Hay cambios o staleness; vuelve a analizar antes de promover."),
      label: t("discover.status.stale.label", "Desactualizado"),
      tone: "warning",
    },
    waiting_review: {
      description: t("discover.status.waitingReview.desc", "Existe una propuesta generada. Revisa hallazgos, preguntas y evidencia antes de aprobar."),
      label: t("discover.status.waitingReview.label", "En revision"),
      tone: "warning",
    },
  };
}

function getErrorMessage(error: unknown, t?: DiscoverTranslate) {
  return error instanceof Error && error.message ? error.message : (t ? t("discover.errorDefault", "No se pudo completar la accion de Discover.") : "No se pudo completar la accion de Discover.");
}

function isSubmitting(actionState?: ProductDiscoveryActionState, localAction?: LocalActionState) {
  return (
    actionState?.status === "submitting" ||
    isOperationActive(actionState?.operation) ||
    localAction?.status === "submitting"
  );
}

function DiscoverLoadingState() {
  const { t } = useLanguage();
  return (
    <UxaSurface className="p-[var(--uxa-panel-padding-lg)]">
      <div className="flex items-start gap-4">
        <span className="flex h-[var(--uxa-icon-tile)] w-[var(--uxa-icon-tile)] items-center justify-center rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-brand-soft)] text-[var(--uxa-color-brand)]">
          <Loader2 aria-hidden="true" className="h-6 w-6 animate-spin" />
        </span>
        <div>
          <UxaBadge tone="neutral">{t("discover.loading.badge", "Cargando")}</UxaBadge>
          <h2 className="mt-3 text-[var(--uxa-font-size-screen-title)] font-black">{t("discover.loading.title", "Preparando Descubrir")}</h2>
          <p className="mt-2 text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">
            {t("discover.loading.desc", "Estamos recuperando el proyecto, los pendientes y el estado operacional antes de mostrar la captura.")}
          </p>
        </div>
      </div>
    </UxaSurface>
  );
}

function DiscoverErrorState({ message }: { message: string }) {
  const { t } = useLanguage();
  return (
    <UxaSurface className="border-[var(--uxa-state-danger)] p-[var(--uxa-panel-padding-lg)]">
      <div className="flex items-start gap-4">
        <span className="flex h-[var(--uxa-icon-tile)] w-[var(--uxa-icon-tile)] items-center justify-center rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-state-danger-bg)] text-[var(--uxa-state-danger)]">
          <AlertCircle aria-hidden="true" className="h-6 w-6" />
        </span>
        <div>
          <UxaBadge tone="danger">{t("discover.status.error.label", "Error")}</UxaBadge>
          <h2 className="mt-3 text-[var(--uxa-font-size-screen-title)] font-black">{t("discover.error.title", "No se pudo abrir Descubrir")}</h2>
          <p className="mt-2 text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">{message}</p>
        </div>
      </div>
    </UxaSurface>
  );
}


function FieldGroup({
  children,
  description,
  icon: Icon,
  title,
}: {
  children: React.ReactNode;
  description: string;
  icon: typeof ClipboardCheck;
  title: string;
}) {
  return (
    <UxaSurface className="p-[var(--uxa-panel-padding-lg)]">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-brand-soft)] text-[var(--uxa-color-brand)]">
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-[20px] font-black">{title}</h3>
          <p className="mt-1 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">{description}</p>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">{children}</div>
    </UxaSurface>
  );
}

function SelectField({
  error,
  label,
  onChange,
  options,
  value,
}: {
  error?: string;
  label: string;
  onChange: (value: string) => void;
  options: readonly { label: string; value: string }[];
  value: string;
}) {
  return (
    <label className="uxa-field">
      <span>{label}</span>
      <select
        aria-invalid={error ? true : undefined}
        className="uxa-input"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="uxa-error-text" role="alert">
          {error}
        </p>
      ) : null}
    </label>
  );
}

function AutonomyField({
  onChange,
  value,
}: {
  onChange: (value: number) => void;
  value: number;
}) {
  const { t } = useLanguage();
  const label = value < 0.34 ? t("discover.autonomy.assisted", "Asistido") : value < 0.67 ? t("discover.autonomy.copilot", "Copilot") : t("discover.autonomy.autonomous", "Autonomo");

  return (
    <label className="uxa-field lg:col-span-2">
      <span>{t("discover.autonomy.label", "Nivel de autonomia esperado")}</span>
      <input
        aria-valuetext={label}
        className="accent-[var(--uxa-color-brand)]"
        max={1}
        min={0}
        onChange={(event) => onChange(Number(event.target.value))}
        step={0.01}
        type="range"
        value={value}
      />
      <p className="uxa-help-text">{t("discover.autonomy.label", "Nivel actual")}: {label}</p>
    </label>
  );
}

function ChecklistSummary({
  items,
}: {
  items: Array<{ label: string; state: "done" | "pending" }>;
}) {
  const { t } = useLanguage();
  return (
    <UxaSurface className="p-[var(--uxa-panel-padding-lg)]">
      <UxaBadge tone="info">{t("discover.checklist.badge", "Criterios de captura")}</UxaBadge>
      <h3 className="mt-3 text-[20px] font-black">{t("discover.checklist.title", "Lo minimo para analizar bien")}</h3>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div className="flex items-start gap-3 rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] p-3" key={item.label}>
            {item.state === "done" ? (
              <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 text-[var(--uxa-state-success)]" />
            ) : (
              <HelpCircle aria-hidden="true" className="mt-0.5 h-5 w-5 text-[var(--uxa-state-warning)]" />
            )}
            <div>
              <p className="text-[13px] font-black">{item.label}</p>
              <p className="mt-1 text-[11px] text-[var(--uxa-color-ink-muted)]">
                {item.state === "done" ? t("discover.checklist.done", "Listo para el LLM.") : t("discover.checklist.pending", "Requiere completar informacion.")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </UxaSurface>
  );
}

function OpenQuestions({
  items,
  sessionId,
}: {
  items: DiscoveryAnalysisQuestion[];
  sessionId: string;
}) {
  const { t } = useLanguage();
  return (
    <UxaSurface className="p-[var(--uxa-panel-padding-lg)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <UxaBadge tone={items.length ? "warning" : "success"}>{items.length} {t("discover.attention.question", "preguntas")}</UxaBadge>
          <h3 className="mt-3 text-[20px] font-black">{t("discover.questions.title", "Preguntas abiertas y gaps")}</h3>
          <p className="mt-2 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
            {t("discover.questions.desc", "Las preguntas bloqueantes deben aparecer tambien en el Segmento de Atencion; aqui se ven dentro del contexto de Discover.")}
          </p>
        </div>
        <Link className="uxa-button uxa-button--secondary uxa-button--sm" href={`/projects/${sessionId}/attention?attention_stage=discover`}>
          {t("discover.questions.openAttention", "Abrir Atencion")}
        </Link>
      </div>
      {items.length ? (
        <div className="mt-4 space-y-3">
          {items.map((item, index) => (
            <article className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-white p-4" key={getDiscoverSuggestionId("question", item.key, index)}>
              <div className="flex flex-wrap items-center gap-2">
                <UxaBadge tone={item.priority === "high" ? "danger" : item.priority === "medium" ? "warning" : "info"}>
                  {getQuestionPriorityLabel(item.priority, t)}
                </UxaBadge>
                <UxaBadge tone="neutral">
                  {item.blocking_stages.length
                    ? item.blocking_stages.map((stage) => getLocalizedStageLabel(stage, t)).join(" / ")
                    : t("discover.questions.transversal", "Transversal")}
                </UxaBadge>
              </div>
              <h4 className="mt-3 text-[15px] font-black">{item.question}</h4>
              <p className="mt-2 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">{item.rationale}</p>
              {item.suggested_answer ? (
                <p className="mt-3 rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] p-3 text-[12px] leading-5">
                  {t("discover.questions.suggestion", "Sugerencia: ")}{item.suggested_answer}
                </p>
              ) : null}
              {item.answer_options?.length ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {item.answer_options.slice(0, 4).map((option) => (
                    <div className="rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-border)] bg-[var(--uxa-color-surface)] p-3" key={option.key}>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[12px] font-black">{option.label}</p>
                        {option.recommended ? <UxaBadge tone="success">{t("discover.questions.recommended", "Recomendada")}</UxaBadge> : null}
                      </div>
                      {option.description ? <p className="mt-1 text-[11px] leading-4 text-[var(--uxa-color-ink-soft)]">{option.description}</p> : null}
                      {option.impact ? <p className="mt-2 text-[10px] font-semibold text-[var(--uxa-color-brand)]">{t("discover.questions.impact", "Impacto: ")}{option.impact}</p> : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-[var(--uxa-radius-lg)] border border-dashed border-[var(--uxa-color-border)] bg-white p-4 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
          {t("discover.questions.empty", "El analisis no dejo preguntas abiertas para Discover.")}
        </p>
      )}
    </UxaSurface>
  );
}

function AnalysisPanel({
  analysis,
  artifactState,
  evidenceCount,
  warnings,
}: {
  analysis: ReturnType<typeof buildDiscoverViewModel>["analysisArtifact"];
  artifactState?: string;
  evidenceCount: number;
  warnings: string[];
}) {
  const { language, t } = useLanguage();
  if (!analysis) {
    return (
      <UxaSurface className="p-[var(--uxa-panel-padding-lg)]">
        <UxaBadge tone="neutral">{t("discover.analysis.noBadge", "Sin analisis")}</UxaBadge>
        <h3 className="mt-3 text-[22px] font-black">{t("discover.analysis.noTitle", "Aun no hay propuesta del LLM")}</h3>
        <p className="mt-2 text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">
          {t("discover.analysis.noDesc", "Completa los bloques esenciales y ejecuta Guardar y analizar para generar hechos, necesidades, preguntas, riesgos y candidato normalizado.")}
        </p>
      </UxaSurface>
    );
  }

  return (
    <LeanGeneratedDeliverable
      badge={{
        label: getArtifactStateLabel(artifactState ?? "generated", t),
        tone: artifactState === "approved" ? "success" : "warning",
      }}
      metrics={[
        {
          label: byLanguage(language, { en: "Confidence", es: "Confianza", pt: "Confianca" }),
          tone: analysis.confidence >= 0.75 ? "success" : "warning",
          value: `${(analysis.confidence * 100).toFixed(0)}%`,
        },
        {
          helper: byLanguage(language, {
            en: "Refs and manifest stay in Evidence.",
            es: "Refs y manifest quedan en Evidencia.",
            pt: "Refs e manifest ficam em Evidencia.",
          }),
          label: byLanguage(language, { en: "Traceable signals", es: "Senales trazables", pt: "Sinais rastreaveis" }),
          tone: "neutral",
          value: evidenceCount + analysis.evidence_refs.length,
        },
        {
          label: byLanguage(language, { en: "Warnings", es: "Advertencias", pt: "Advertencias" }),
          tone: warnings.length ? "warning" : "success",
          value: warnings.length,
        },
      ]}
      nextUse={byLanguage(language, {
        en: "Define will use this normalized understanding to structure goals, requirements, rules, and measurable criteria without asking again for the same context.",
        es: "Definir usara este entendimiento normalizado para estructurar objetivos, requisitos, reglas y criterios medibles sin volver a pedir el mismo contexto.",
        pt: "Definir usara este entendimento normalizado para estruturar objetivos, requisitos, regras e criterios mensuraveis sem pedir o mesmo contexto novamente.",
      })}
      sections={[
        {
          emptyLabel: t("discover.analysis.factsEmpty", "Sin hechos detectados."),
          items: analysis.facts.map((item) => item.statement),
          title: byLanguage(language, { en: "What was understood", es: "Que se entendio", pt: "O que foi entendido" }),
        },
        {
          emptyLabel: t("discover.analysis.needsEmpty", "Sin necesidades inferidas."),
          items: analysis.inferred_needs.map((item) => item.statement),
          title: byLanguage(language, { en: "Inferred needs", es: "Necesidades inferidas", pt: "Necessidades inferidas" }),
        },
        {
          emptyLabel: t("discover.analysis.risksEmpty", "Sin riesgos detectados."),
          items: [...analysis.assumptions, ...analysis.risk_signals].map((item) => item.statement),
          title: byLanguage(language, { en: "Assumptions and risks", es: "Supuestos y riesgos", pt: "Suposicoes e riscos" }),
        },
      ]}
      summary={analysis.summary}
      title={byLanguage(language, {
        en: "Discover deliverable",
        es: "Entrega de Descubrir",
        pt: "Entrega de Descobrir",
      })}
    />
  );
}

function ReviewDecisionPanel({
  decisions,
  onDecision,
  questions,
}: {
  decisions: Record<string, DiscoverReviewDecision>;
  onDecision: (key: string, decision: DiscoverReviewDecision) => void;
  questions: DiscoveryAnalysisQuestion[];
}) {
  const { t } = useLanguage();

  if (!questions.length) {
    return null;
  }

  return (
    <UxaSurface className="p-[var(--uxa-panel-padding-lg)]">
      <UxaBadge tone="info">{t("discover.review.badge", "Revision guiada")}</UxaBadge>
      <h3 className="mt-3 text-[20px] font-black">{t("discover.review.title", "Decisiones sobre preguntas del LLM")}</h3>
      <p className="mt-2 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
        {t("discover.review.desc", "Registra si una pregunta queda aceptada como pendiente real o descartada por no aplicar.")}
      </p>
      <div className="mt-4 space-y-3">
        {questions.map((question, index) => {
          const key = getDiscoverSuggestionId("question", question.key, index);
          const decision = decisions[key];

          return (
            <article className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-white p-4" key={key}>
              <div className="flex flex-wrap items-center gap-2">
                <UxaBadge tone={decision === "accepted" ? "success" : decision === "rejected" ? "danger" : "neutral"}>
                  {decision === "accepted" ? t("discover.review.accepted", "Aceptada") : decision === "rejected" ? t("discover.review.rejected", "Descartada") : t("discover.review.pending", "Pendiente")}
                </UxaBadge>
                <UxaBadge tone="neutral">{question.priority}</UxaBadge>
              </div>
              <p className="mt-3 text-[13px] font-black text-[var(--uxa-color-ink)]">{question.question}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <UxaButton onClick={() => onDecision(key, "accepted")} size="sm" variant="secondary">
                  {t("discover.review.acceptBtn", "Aceptar pendiente")}
                </UxaButton>
                <UxaButton onClick={() => onDecision(key, "rejected")} size="sm" variant="danger">
                  {t("discover.review.rejectBtn", "Descartar")}
                </UxaButton>
              </div>
            </article>
          );
        })}
      </div>
    </UxaSurface>
  );
}

export function DiscoverStageView({ actionState, activeRoute, actions }: DiscoverStageViewProps) {
  const router = useRouter();
  const { language, t } = useLanguage();
  const snapshot = activeRoute?.snapshot.data ?? null;
  const latestArtifactFromRoute = activeRoute?.snapshot.data?.journey_latest_artifacts?.discover ?? null;
  const candidateFromPayload =
    latestArtifactFromRoute?.proposal_payload &&
    typeof latestArtifactFromRoute.proposal_payload === "object" &&
    "normalized_discovery_candidate" in latestArtifactFromRoute.proposal_payload
      ? (latestArtifactFromRoute.proposal_payload.normalized_discovery_candidate as DiscoveryArtifact)
      : null;
  const initialValues = useMemo(
    () => createDiscoveryFormValues(snapshot?.discovery ?? candidateFromPayload),
    [snapshot?.discovery, candidateFromPayload],
  );
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<DiscoveryFormErrors>({});
  const [formValues, setFormValues] = useState<DiscoveryFormValues>(initialValues);
  const [localAction, setLocalAction] = useState<LocalActionState>({ status: "idle" });
  const busy = isSubmitting(actionState, localAction);
  const viewModel = buildDiscoverViewModel(activeRoute, {
    dirty,
    formValues,
    processing: busy,
  });
  const primaryAction = getDiscoverPrimaryAction(viewModel, dirty);
  const statusCopy = getStatusCopy(t);
  const primaryLabel =
    primaryAction.kind === "continue"
      ? t("discover.btn.continue", "Continue to Define")
      : primaryAction.kind === "approve"
        ? t("discover.btn.approve", "Approve Discover")
        : t("discover.btn.analyze", "Save and analyze");
  const copy = useCallback((en: string, es: string, pt: string) => byLanguage(language, { en, es, pt }), [language]);
  const localizedTimeSpentOptions = useMemo(
    () => [
      { label: copy("Select...", "Seleccionar...", "Selecionar..."), value: DISCOVERY_TIME_SPENT_OPTIONS[0].value },
      { label: copy("Less than 2 hours per week", "Menos de 2 horas por semana", "Menos de 2 horas por semana"), value: DISCOVERY_TIME_SPENT_OPTIONS[1].value },
      { label: copy("Between 2 and 8 hours per week", "Entre 2 y 8 horas por semana", "Entre 2 e 8 horas por semana"), value: DISCOVERY_TIME_SPENT_OPTIONS[2].value },
      { label: copy("Between 1 and 2 days per week", "Entre 1 y 2 dias por semana", "Entre 1 e 2 dias por semana"), value: DISCOVERY_TIME_SPENT_OPTIONS[3].value },
      { label: copy("More than 2 days per week", "Mas de 2 dias por semana", "Mais de 2 dias por semana"), value: DISCOVERY_TIME_SPENT_OPTIONS[4].value },
    ],
    [copy],
  );
  const localizedCostOptions = useMemo(
    () => [
      { label: copy("Select...", "Seleccionar...", "Selecionar..."), value: DISCOVERY_COST_OPTIONS[0].value },
      { label: copy("Low impact or minor rework", "Impacto bajo o retrabajo menor", "Impacto baixo ou retrabalho menor"), value: DISCOVERY_COST_OPTIONS[1].value },
      { label: copy("Moderate impact on time and quality", "Impacto moderado en tiempo y calidad", "Impacto moderado em tempo e qualidade"), value: DISCOVERY_COST_OPTIONS[2].value },
      { label: copy("High impact on cost or experience", "Impacto alto en costos o experiencia", "Impacto alto em custos ou experiencia"), value: DISCOVERY_COST_OPTIONS[3].value },
      { label: copy("Critical business impact", "Impacto critico para el negocio", "Impacto critico para o negocio"), value: DISCOVERY_COST_OPTIONS[4].value },
    ],
    [copy],
  );
  const sessionId = viewModel.sessionId;
  const latestArtifact = viewModel.latestArtifact;
  const analysis = viewModel.analysisArtifact;
  const mergedMessage = localAction.message ?? actionState?.message;

  useEffect(() => {
    if (dirty || busy) {
      return;
    }

    let nextValues = initialValues;
    let shouldMarkDirty = false;
    let storageKeysToRemove: string[] = [];

    if (sessionId && typeof window !== "undefined") {
      try {
        const stored =
          window.sessionStorage.getItem(`session_eval_prefill_${sessionId}`) ||
          window.sessionStorage.getItem("pending_initiative_prefill");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.initial_prompt && !initialValues.problemStatement) {
            nextValues = {
              ...initialValues,
              problemStatement: parsed.initial_prompt,
            };
            shouldMarkDirty = true;
            storageKeysToRemove = [`session_eval_prefill_${sessionId}`, "pending_initiative_prefill"];
          }
        }
      } catch {
        // ignore
      }
    }

    const timeoutId = window.setTimeout(() => {
      setFormValues(nextValues);
      if (shouldMarkDirty) {
        setDirty(true);
      }
      for (const key of storageKeysToRemove) {
        window.sessionStorage.removeItem(key);
      }
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [busy, dirty, initialValues, sessionId]);

  function updateField<K extends keyof DiscoveryFormValues>(key: K, value: DiscoveryFormValues[K]) {
    setFormValues((current) => ({
      ...current,
      [key]: value,
    }));
    setDirty(true);

    if (errors[key]) {
      setErrors((current) => ({
        ...current,
        [key]: undefined,
      }));
    }
  }

  function validateForm() {
    const nextErrors = getDiscoveryFieldErrors(formValues);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setLocalAction({
        message: copy(
          "Complete the critical fields before continuing.",
          "Completa los campos criticos antes de continuar.",
          "Complete os campos criticos antes de continuar.",
        ),
        status: "error",
      });
      return null;
    }

    return buildDiscoveryInput(formValues);
  }

  async function saveDraft() {
    const payload = validateForm();
    if (!payload || !actions) {
      return null;
    }

    setLocalAction({ message: copy("Saving Discovery.", "Guardando Discovery.", "Salvando Discovery."), status: "submitting" });
    try {
      const envelope = await actions.normalizeDiscovery(payload);
      setDirty(false);
      setLocalAction({
        message: envelope.status === "ready"
          ? copy("Discovery saved and normalized.", "Discovery guardado y normalizado.", "Discovery salvo e normalizado.")
          : copy(
              "Discovery saved with pending information.",
              "Discovery guardado con informacion pendiente.",
              "Discovery salvo com informacao pendente.",
            ),
        status: envelope.status === "ready" ? "success" : "error",
      });
      return envelope;
    } catch (error) {
      setLocalAction({ message: getErrorMessage(error), status: "error" });
      return null;
    }
  }

  async function analyzeDraft() {
    const payload = validateForm();
    if (!payload || !actions) {
      return;
    }

    setLocalAction({
      message: copy(
        "Normalizing and analyzing Discover with the LLM.",
        "Normalizando y analizando Discover con LLM.",
        "Normalizando e analisando Discover com LLM.",
      ),
      status: "submitting",
    });
    try {
      const operation = await actions.analyzeDiscovery(payload);
      setDirty(false);
      setLocalAction({
        message: operation.detail || copy(
          "Discover analysis started in the background.",
          "Analisis de Discover iniciado en segundo plano.",
          "Analise de Discover iniciada em segundo plano.",
        ),
        status: "success",
      });
    } catch (error) {
      setLocalAction({ message: getErrorMessage(error), status: "error" });
    }
  }

  async function persistReviewDecision(decisionKey: string, decision: DiscoverReviewDecision) {
    if (!actions || !latestArtifact || !analysis) {
      setLocalAction({
        message: copy(
          "Generate an analysis proposal first.",
          "Genera primero una propuesta de analisis.",
          "Gere primeiro uma proposta de analise.",
        ),
        status: "error",
      });
      return;
    }

    setLocalAction({
      message: copy("Recording review decision.", "Registrando decision de revision.", "Registrando decisao de revisao."),
      status: "submitting",
    });
    try {
      await actions.patchDiscoverArtifact(latestArtifact.id, {
        note: `review_decision:${decisionKey}`,
        user_patch: {
          review_decisions: {
            ...viewModel.reviewDecisions,
            [decisionKey]: decision,
          },
        },
      });
      setLocalAction({
        message: copy("Decision recorded in Discover.", "Decision registrada en Discover.", "Decisao registrada no Discover."),
        status: "success",
      });
    } catch (error) {
      setLocalAction({ message: getErrorMessage(error), status: "error" });
    }
  }

  async function approveDiscover() {
    if (!actions || !latestArtifact || !analysis) {
      setLocalAction({
        message: copy(
          "Analyze the draft before approving Discover.",
          "Analiza el borrador antes de aprobar Discover.",
          "Analise o rascunho antes de aprovar Discover.",
        ),
        status: "error",
      });
      return;
    }

    setLocalAction({ message: copy("Approving Discover.", "Aprobando Discover.", "Aprovando Discover."), status: "submitting" });
    try {
      if (dirty) {
        const payload = validateForm();
        if (!payload) {
          return;
        }

        const envelope = await actions.normalizeDiscovery(payload);
        if (envelope.data) {
          await actions.patchDiscoverArtifact(latestArtifact.id, {
            note: "Persistir candidato normalizado para aprobacion UXA7",
            user_patch: {
              normalized_discovery_candidate: envelope.data,
              review_decisions: viewModel.reviewDecisions,
            },
          });
        }
      }

      await actions.approveDiscoverArtifact(latestArtifact.id, {
        decision_payload: {
          review_decisions: viewModel.reviewDecisions,
        },
        note: "Discover aprobado desde experiencia UXA7",
      });
      setDirty(false);
      setLocalAction({
        message: copy("Discover approved. Moving to Define.", "Discover aprobado. Avanzando a Definir.", "Discover aprovado. Avancando para Definir."),
        status: "success",
      });
      router.push(getProductExperienceStageHref(sessionId, "define"));
    } catch (error) {
      setLocalAction({ message: getErrorMessage(error), status: "error" });
    }
  }

  async function rejectDiscover() {
    if (!actions || !latestArtifact) {
      setLocalAction({
        message: copy("There is no active proposal to reject.", "No hay una propuesta activa para rechazar.", "Nao ha proposta ativa para rejeitar."),
        status: "error",
      });
      return;
    }

    setLocalAction({
      message: copy("Rejecting Discover proposal.", "Rechazando propuesta de Discover.", "Rejeitando proposta de Discover."),
      status: "submitting",
    });
    try {
      await actions.rejectDiscoverArtifact(latestArtifact.id, {
        note: "Propuesta rechazada desde experiencia UXA7",
      });
      setLocalAction({
        message: copy(
          "Proposal rejected. Adjust the capture and analyze again.",
          "Propuesta rechazada. Ajusta la captura y vuelve a analizar.",
          "Proposta rejeitada. Ajuste a captura e analise novamente.",
        ),
        status: "success",
      });
    } catch (error) {
      setLocalAction({ message: getErrorMessage(error), status: "error" });
    }
  }

  function runPrimaryAction() {
    if (primaryAction.kind === "continue") {
      router.push(getProductExperienceStageHref(sessionId, "define"));
      return;
    }

    if (primaryAction.kind === "approve") {
      void approveDiscover();
      return;
    }

    void analyzeDraft();
  }

  if (viewModel.status === "loading") {
    return <DiscoverLoadingState />;
  }

  if (viewModel.status === "error") {
    return <DiscoverErrorState message={activeRoute?.snapshot.error?.message ?? t("discover.snapshotError", "No fue posible recuperar el snapshot.")} />;
  }

  const attentionItems = [
    ...viewModel.missingFields.slice(0, 3).map((field) => ({
      description: copy(
        "Required data so the LLM does not need to infer critical information.",
        "Dato requerido para que el LLM no tenga que inferir informacion critica.",
        "Dado necessario para que o LLM nao precise inferir informacao critica.",
      ),
      href: getProductExperienceProductHref(sessionId, "attention"),
      label: copy("Missing data", "Falta dato", "Dado faltante"),
      tone: "warning" as const,
      value: formatDiscoveryMissingField(field),
    })),
    ...(analysis?.open_questions ?? []).slice(0, 3).map((question) => ({
      description: question.rationale,
      href: getProductExperienceProductHref(sessionId, "attention"),
      label: question.priority === "high"
        ? copy("Critical question", "Pregunta critica", "Pergunta critica")
        : copy("Question", "Pregunta", "Pergunta"),
      tone: question.priority === "high" ? ("danger" as const) : ("warning" as const),
      value: question.question,
    })),
    ...viewModel.warnings.slice(0, 2).map((warning) => ({
      description: copy(
        "Warning detected during normalization or analysis.",
        "Advertencia detectada durante la normalizacion o el analisis.",
        "Advertencia detectada durante a normalizacao ou a analise.",
      ),
      href: getProductExperienceProductHref(sessionId, "attention"),
      label: copy("Warning", "Advertencia", "Advertencia"),
      tone: "warning" as const,
      value: warning,
    })),
  ];
  const primaryDescription =
    primaryAction.kind === "continue"
      ? copy(
          "Discover is already approved. Continue to Define using this traceable version as source of truth.",
          "Discover ya esta aprobado. Continua a Definir usando esta version trazable como fuente de verdad.",
          "Discover ja esta aprovado. Continue para Definir usando esta versao rastreavel como fonte de verdade.",
        )
      : primaryAction.kind === "approve"
        ? copy(
            "Review the proposal and approve the context to turn it into formal input for Define.",
            "Revisa la propuesta y aprueba el contexto para convertirlo en entrada formal de Definir.",
            "Revise a proposta e aprove o contexto para converte-lo em entrada formal para Definir.",
          )
        : copy(
            "Save the capture and ask the LLM to analyze facts, needs, risks, and open questions.",
            "Guarda la captura y pide al LLM analizar hechos, necesidades, riesgos y preguntas abiertas.",
            "Salve a captura e peca ao LLM para analisar fatos, necessidades, riscos e perguntas abertas.",
          );
  const contract: LeanStageScreenContract = {
    attentionItems,
    linkedResults: [
      {
        description: analysis
          ? copy("Canvas and analysis generated for this stage.", "Canvas y analisis generado para la etapa.", "Canvas e analise gerados para a etapa.")
          : copy("Enabled when Discover analysis exists.", "Se habilita cuando exista analisis de Discover.", "Sera habilitado quando existir analise de Discover."),
        href: analysis ? getProductExperienceProductHref(sessionId, "artifacts") : undefined,
        label: copy("Discover document", "Documento de Discover", "Documento de Discover"),
        locked: !analysis,
        type: "document",
      },
      {
        description: copy(
          "Problem, context, and actor map feeding the Blueprint.",
          "Mapa de problema, contexto y actores que alimenta el Blueprint.",
          "Mapa de problema, contexto e atores que alimenta o Blueprint.",
        ),
        href: getProductExperienceProductHref(sessionId, "diagrams"),
        label: copy("Problem-context diagram", "Diagrama problema-contexto", "Diagrama problema-contexto"),
        locked: !analysis,
        type: "diagram",
      },
      {
        description: copy(
          "Questions, decisions, and changes applied to discovery.",
          "Preguntas, decisiones y cambios aplicados sobre el descubrimiento.",
          "Perguntas, decisoes e mudancas aplicadas ao discovery.",
        ),
        href: getProductExperienceProductHref(sessionId, "attention"),
        label: copy("Decision log", "Registro de decisiones", "Registro de decisoes"),
        locked: !latestArtifact,
        type: "decision",
      },
    ],
    metric: {
      helper: copy(
        `${viewModel.missingFields.length} missing field(s). Last update: ${viewModel.snapshotUpdatedAt ?? "no snapshot"}.`,
        `${viewModel.missingFields.length} campo(s) faltante(s). Ultima actualizacion: ${viewModel.snapshotUpdatedAt ?? "sin snapshot"}.`,
        `${viewModel.missingFields.length} campo(s) faltante(s). Ultima atualizacao: ${viewModel.snapshotUpdatedAt ?? "sem snapshot"}.`,
      ),
      label: copy("Functional completeness", "Completitud funcional", "Completude funcional"),
      progress: viewModel.completionPercent,
      value: `${viewModel.completionPercent}%`,
    },
    nextStep:
      primaryAction.kind === "continue"
        ? copy(
            "Define will structure goals, scope, rules, and requirements using approved Discover.",
            "Definir estructurara objetivos, alcance, reglas y requisitos usando Discover aprobado.",
            "Definir estruturara objetivos, escopo, regras e requisitos usando Discover aprovado.",
          )
        : copy(
            "Once the proposal is approved, Define is enabled with traceable context and without avoidable ambiguities.",
            "Cuando la propuesta este aprobada, Definir se habilita con contexto trazable y sin ambiguedades evitables.",
            "Quando a proposta for aprovada, Definir sera habilitado com contexto rastreavel e sem ambiguidades evitaveis.",
          ),
    primaryAction: {
      description: primaryDescription,
      label: primaryLabel,
      tone: primaryAction.kind === "continue" ? "success" : primaryAction.kind === "approve" ? "warning" : "info",
    },
    stage: {
      description:
        copy(
          "Capture the minimum business context, validate completeness, and use the LLM to normalize the problem before moving on.",
          "Captura el contexto minimo del negocio, valida completitud y usa el LLM para normalizar el problema antes de avanzar.",
          "Capture o contexto minimo do negocio, valide a completude e use o LLM para normalizar o problema antes de avancar.",
        ),
      objective: copy(
        "Understand the problem, context, goals, constraints, and user needs.",
        "Comprender problema, contexto, objetivos, restricciones y necesidades del usuario.",
        "Compreender problema, contexto, objetivos, restricoes e necessidades do usuario.",
      ),
      statusLabel: statusCopy[viewModel.status].label,
      statusTone: statusCopy[viewModel.status].tone,
      title: copy("Discover: problem and context", "Descubrir: problema y contexto", "Descobrir: problema e contexto"),
    },
    tabs: [
      {
        badge: viewModel.missingFields.length,
        description: t("discover.tab.task.desc", "Fields the user must complete or adjust now."),
        key: "task",
        label: t("discover.tab.task.label", "Current task"),
        children: (
          <section className="space-y-4" aria-label={copy("Discovery capture", "Captura de discovery", "Captura de discovery")}>
            <FieldGroup
              description={copy(
                "Define the real problem, who experiences it, and what outcome is expected.",
                "Define el problema real, quien lo vive y que resultado espera obtener.",
                "Defina o problema real, quem o vivencia e qual resultado se espera obter.",
              )}
              icon={ClipboardCheck}
              title={copy("1. Problem context", "1. Contexto del problema", "1. Contexto do problema")}
            >
              <UxaTextareaField
                error={errors.problemStatement}
                label={copy("Problem description", "Descripcion del problema", "Descricao do problema")}
                onChange={(event) => updateField("problemStatement", event.target.value)}
                rows={4}
                value={formValues.problemStatement}
              />
              <UxaTextField
                error={errors.currentUser}
                label={copy("Who performs it today", "Quien ejecuta hoy", "Quem executa hoje")}
                onChange={(event) => updateField("currentUser", event.target.value)}
                value={formValues.currentUser}
              />
              <UxaTextareaField
                error={errors.currentProcess}
                label={copy("Current task or process", "Tarea o proceso actual", "Tarefa ou processo atual")}
                onChange={(event) => updateField("currentProcess", event.target.value)}
                rows={4}
                value={formValues.currentProcess}
              />
              <UxaTextareaField
                error={errors.desiredOutcome}
                label={copy("Desired outcome", "Resultado deseado", "Resultado desejado")}
                onChange={(event) => updateField("desiredOutcome", event.target.value)}
                rows={4}
                value={formValues.desiredOutcome}
              />
            </FieldGroup>

            <FieldGroup
              description={copy(
                "Quantify friction, errors, and opportunities to estimate value from the Blueprint.",
                "Cuantifica friccion, errores y oportunidades para estimar valor desde el Blueprint.",
                "Quantifique friccao, erros e oportunidades para estimar valor a partir do Blueprint.",
              )}
              icon={RefreshCw}
              title={copy("2. Operational impact", "2. Impacto operativo", "2. Impacto operacional")}
            >
              <SelectField
                error={errors.currentTimeSpent}
                label={copy("Current time invested", "Tiempo actual invertido", "Tempo atual investido")}
                onChange={(value) => updateField("currentTimeSpent", value)}
                options={localizedTimeSpentOptions}
                value={formValues.currentTimeSpent}
              />
              <SelectField
                error={errors.currentCost}
                label={copy("Current cost or impact", "Costo o impacto actual", "Custo ou impacto atual")}
                onChange={(value) => updateField("currentCost", value)}
                options={localizedCostOptions}
                value={formValues.currentCost}
              />
              <UxaTextareaField
                error={errors.frequentErrors}
                label={copy("Frequent errors", "Errores frecuentes", "Erros frequentes")}
                onChange={(event) => updateField("frequentErrors", event.target.value)}
                rows={4}
                value={formValues.frequentErrors}
              />
              <UxaTextareaField
                error={errors.automationOpportunities}
                label={copy("Automation opportunities", "Oportunidades de automatizacion", "Oportunidades de automacao")}
                onChange={(event) => updateField("automationOpportunities", event.target.value)}
                rows={4}
                value={formValues.automationOpportunities}
              />
            </FieldGroup>

            <FieldGroup
              description={copy(
                "Define the first viable scope and the decisions the agent must not make.",
                "Delimita el primer alcance viable y las decisiones que no debe tomar el agente.",
                "Delimite o primeiro escopo viavel e as decisoes que o agente nao deve tomar.",
              )}
              icon={ShieldCheck}
              title={copy("3. MVP and human control", "3. MVP y control humano", "3. MVP e controle humano")}
            >
              <UxaTextareaField
                error={errors.v1Scope}
                label={copy("MVP scope", "Alcance MVP", "Escopo MVP")}
                onChange={(event) => updateField("v1Scope", event.target.value)}
                rows={4}
                value={formValues.v1Scope}
              />
              <UxaTextareaField
                error={errors.outOfScope}
                label={copy("Out of scope", "Fuera de alcance", "Fora de escopo")}
                onChange={(event) => updateField("outOfScope", event.target.value)}
                rows={4}
                value={formValues.outOfScope}
              />
              <UxaTextField
                error={errors.northStarMetric}
                label={copy("North star metric", "Metrica norte", "Metrica norte")}
                onChange={(event) => updateField("northStarMetric", event.target.value)}
                value={formValues.northStarMetric}
              />
              <UxaTextareaField
                error={errors.nonDelegableDecisions}
                label={copy("Non-delegable decisions", "Decisiones no delegables", "Decisoes nao delegaveis")}
                onChange={(event) => updateField("nonDelegableDecisions", event.target.value)}
                rows={4}
                value={formValues.nonDelegableDecisions}
              />
              <AutonomyField onChange={(value) => updateField("autonomyLevel", value)} value={formValues.autonomyLevel} />
              <UxaTextareaField
                className="lg:col-span-2"
                label={copy("Additional constraints", "Restricciones adicionales", "Restricoes adicionais")}
                onChange={(event) => updateField("constraints", event.target.value)}
                rows={3}
                value={formValues.constraints}
              />
            </FieldGroup>
          </section>
        ),
      },
      {
        badge: analysis ? "LLM" : "0",
        description: byLanguage(language, { en: "Executive synthesis produced by the LLM.", es: "Sintesis ejecutiva producida por el LLM.", pt: "Sintese executiva produzida pelo LLM." }),
        key: "result",
        label: byLanguage(language, { en: "Generated deliverable", es: "Entrega generada", pt: "Entrega gerada" }),
        children: (
          <AnalysisPanel
            analysis={analysis}
            artifactState={latestArtifact?.state}
            evidenceCount={latestArtifact?.evidence_manifest.length ?? 0}
            warnings={viewModel.warnings}
          />
        ),
      },
      {
        badge: (analysis?.open_questions.length ?? 0) + viewModel.warnings.length,
        description: t("discover.tab.evidence.desc", "Questions, validations, warnings, and review decisions."),
        key: "evidence",
        label: t("discover.tab.evidence.label", "Evidence and traceability"),
        children: (
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <ChecklistSummary items={viewModel.checklist} />
              <UxaSurface className="p-[var(--uxa-panel-padding-lg)]">
                <UxaBadge tone={viewModel.missingFields.length ? "warning" : "success"}>
                  {viewModel.missingFields.length} {t("discover.validation.missing", "missing")}
                </UxaBadge>
                <h3 className="mt-3 text-[20px] font-black">{t("discover.validation.title", "Immediate validation")}</h3>
                {viewModel.missingFields.length ? (
                  <div className="mt-4 space-y-2">
                    {viewModel.missingFields.map((field) => (
                      <p className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-white p-3 text-[12px]" key={field}>
                        {formatDiscoveryMissingField(field)}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
                    {t("discover.validation.complete", "Critical fields complete for normalization and analysis.")}
                  </p>
                )}
              </UxaSurface>
            </div>
            <OpenQuestions items={analysis?.open_questions ?? []} sessionId={sessionId} />
            <ReviewDecisionPanel
              decisions={viewModel.reviewDecisions}
              onDecision={(key, decision) => void persistReviewDecision(key, decision)}
              questions={analysis?.open_questions ?? []}
            />
          </div>
        ),
      },
    ],
  };

  return (
    <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
      <p aria-live="polite" className="sr-only" role="status">
        {mergedMessage ?? ""}
      </p>
      <LeanStageScreen
        actionArea={
          <>
          <UxaButton disabled={busy} onClick={() => void saveDraft()} variant="secondary">
            {t("discover.btn.saveDraft", "Save draft")}
          </UxaButton>
          {analysis && latestArtifact?.state !== "approved" ? (
            <UxaButton disabled={busy} onClick={() => void rejectDiscover()} variant="danger">
              {t("discover.btn.reject", "Reject proposal")}
            </UxaButton>
          ) : null}
          <UxaButton
            className={cn(primaryAction.kind === "continue" && "bg-[var(--uxa-color-brand)]")}
            disabled={busy}
            isLoading={busy}
            onClick={runPrimaryAction}
            variant="primary"
          >
            {primaryLabel}
            {primaryAction.kind === "continue" ? <ArrowRight aria-hidden="true" className="h-4 w-4" /> : null}
          </UxaButton>
          </>
        }
        contract={contract}
        message={mergedMessage}
      />
    </form>
  );
}
