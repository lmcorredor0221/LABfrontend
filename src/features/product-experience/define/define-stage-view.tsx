"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import type { ProductExperienceRouteSnapshot } from "@/features/product-experience/core/server-state";
import {
  UxaBadge,
  UxaButton,
  UxaEmptyState,
  UxaFilterChip,
  UxaSurface,
  UxaTextareaField,
  type UxaTone,
} from "@/features/product-experience/design-system";
import { byLanguage } from "@/features/product-experience/core/localized-copy";
import { LeanStageScreen, type LeanStageScreenContract } from "@/features/product-experience/stage-screen";
import {
  buildDefineViewModel,
  parseDefineSection,
  parseDefinitionArtifact,
  setOpenQuestionStatus,
  type DefineSection,
  type DefineStageStatus,
} from "@/features/product-experience/define/define-model";
import { getProductExperienceProductHref, getProductExperienceStageHref } from "@/features/product-experience/shell/experience-model";
import type {
  ProductStageActions,
  ProductStageActionState,
} from "@/features/product-experience/shell/use-product-experience-route";
import type {
  DefinitionArtifact,
  DefinitionEntityBase,
  FunctionalRequirement,
  NonFunctionalRequirement,
  BusinessRule,
  AcceptanceCriterion,
  Dependency,
  Assumption,
} from "@/features/sessions/session-contracts";
import { useLanguage, type SupportedLanguage } from "@/core/i18n/language-context";
import { cn } from "@/lib/utils";

type DefineStageViewProps = {
  actionState?: ProductStageActionState;
  activeRoute: ProductExperienceRouteSnapshot | null;
  actions?: ProductStageActions;
};

type LocalActionState = {
  message?: string;
  status: "idle" | "submitting" | "success" | "error";
};

function getEntityStatusLabel(language: SupportedLanguage, value: string) {
  switch (value) {
    case "accepted":
      return byLanguage(language, { en: "Accepted", es: "Aceptado", pt: "Aceito" });
    case "needs_input":
      return byLanguage(language, { en: "Needs input", es: "Requiere datos", pt: "Requer dados" });
    case "rejected":
      return byLanguage(language, { en: "Rejected", es: "Rechazado", pt: "Rejeitado" });
    case "draft":
      return byLanguage(language, { en: "Draft", es: "Borrador", pt: "Rascunho" });
    default:
      return value;
  }
}

function getPriorityLabel(language: SupportedLanguage, value: string) {
  switch (value) {
    case "high":
      return byLanguage(language, { en: "High", es: "Alta", pt: "Alta" });
    case "medium":
      return byLanguage(language, { en: "Medium", es: "Media", pt: "Media" });
    case "low":
      return byLanguage(language, { en: "Low", es: "Baja", pt: "Baixa" });
    default:
      return value;
  }
}

function getCoverageStatusLabel(language: SupportedLanguage, value: string) {
  switch (value) {
    case "covered":
      return byLanguage(language, { en: "Covered", es: "Cubierto", pt: "Coberto" });
    case "partial":
      return byLanguage(language, { en: "Partial", es: "Parcial", pt: "Parcial" });
    case "missing":
      return byLanguage(language, { en: "Missing", es: "Faltante", pt: "Ausente" });
    default:
      return value;
  }
}

function getStatusCopy(language: SupportedLanguage): Record<DefineStageStatus, { description: string; label: string; tone: UxaTone }> {
  return {
    approved: {
      description: byLanguage(language, {
        en: "Definition approved. Design can now use these requirements as the consolidated source of truth.",
        es: "Definicion aprobada. Disenar puede usar estos requisitos como fuente consolidada.",
        pt: "Definicao aprovada. Design pode usar estes requisitos como fonte consolidada.",
      }),
      label: byLanguage(language, { en: "Approved", es: "Aprobado", pt: "Aprovado" }),
      tone: "success",
    },
    blocked: {
      description: byLanguage(language, {
        en: "Approve Discover first; this stage depends on validated context.",
        es: "Primero aprueba Descubrir; esta etapa depende del contexto validado.",
        pt: "Aprove Descobrir primeiro; esta etapa depende do contexto validado.",
      }),
      label: byLanguage(language, { en: "Blocked", es: "Bloqueado", pt: "Bloqueado" }),
      tone: "danger",
    },
    empty: {
      description: byLanguage(language, {
        en: "Discovery is approved. Generate the definition to structure requirements, rules, and criteria.",
        es: "Discovery esta aprobado. Genera la definicion para estructurar requisitos, reglas y criterios.",
        pt: "Discovery esta aprovado. Gere a definicao para estruturar requisitos, regras e criterios.",
      }),
      label: byLanguage(language, { en: "Ready to generate", es: "Listo para generar", pt: "Pronto para gerar" }),
      tone: "info",
    },
    error: {
      description: byLanguage(language, {
        en: "The real project information could not be loaded.",
        es: "No fue posible recuperar la informacion real del proyecto.",
        pt: "Nao foi possivel recuperar a informacao real do projeto.",
      }),
      label: byLanguage(language, { en: "Error", es: "Error", pt: "Erro" }),
      tone: "danger",
    },
    loading: {
      description: byLanguage(language, {
        en: "Loading the project snapshot, attention, and operation state.",
        es: "Recuperando snapshot, atencion y operacion del proyecto.",
        pt: "Recuperando snapshot, atencao e operacao do projeto.",
      }),
      label: byLanguage(language, { en: "Loading", es: "Cargando", pt: "Carregando" }),
      tone: "neutral",
    },
    processing: {
      description: byLanguage(language, {
        en: "The system is running a real backend action.",
        es: "El sistema esta ejecutando una accion real contra backend.",
        pt: "O sistema esta executando uma acao real no backend.",
      }),
      label: byLanguage(language, { en: "Processing", es: "Procesando", pt: "Processando" }),
      tone: "warning",
    },
    stale: {
      description: byLanguage(language, {
        en: "There are upstream changes. Regenerate before promoting these requirements.",
        es: "Hay cambios aguas arriba. Regenera antes de promover estos requisitos.",
        pt: "Ha mudancas a montante. Regenere antes de promover estes requisitos.",
      }),
      label: byLanguage(language, { en: "Outdated", es: "Desactualizado", pt: "Desatualizado" }),
      tone: "warning",
    },
    waiting_review: {
      description: byLanguage(language, {
        en: "Review requirements, rules, criteria, questions, and traceability before approving.",
        es: "Revisa requisitos, reglas, criterios, preguntas y trazabilidad antes de aprobar.",
        pt: "Revise requisitos, regras, criterios, perguntas e rastreabilidade antes de aprovar.",
      }),
      label: byLanguage(language, { en: "In review", es: "En revision", pt: "Em revisao" }),
      tone: "warning",
    },
  };
}

function getSectionCopy(language: SupportedLanguage, key: DefineSection) {
  const map: Record<DefineSection, { description: string; label: string }> = {
    summary: {
      description: byLanguage(language, {
        en: "Summary, goals, and projected canvas.",
        es: "Resumen, objetivos y Canvas proyectado.",
        pt: "Resumo, objetivos e canvas projetado.",
      }),
      label: byLanguage(language, { en: "Summary", es: "Resumen", pt: "Resumo" }),
    },
    requirements: {
      description: byLanguage(language, {
        en: "Prioritized functional requirements.",
        es: "Requisitos funcionales priorizados.",
        pt: "Requisitos funcionais priorizados.",
      }),
      label: byLanguage(language, { en: "Functional", es: "Funcionales", pt: "Funcionais" }),
    },
    nfr: {
      description: byLanguage(language, {
        en: "Measurable non-functional requirements.",
        es: "Requisitos no funcionales medibles.",
        pt: "Requisitos nao funcionais mensuraveis.",
      }),
      label: "NFR",
    },
    rules: {
      description: byLanguage(language, {
        en: "Business rules and ownership.",
        es: "Reglas de negocio y ownership.",
        pt: "Regras de negocio e ownership.",
      }),
      label: byLanguage(language, { en: "Rules", es: "Reglas", pt: "Regras" }),
    },
    criteria: {
      description: byLanguage(language, {
        en: "Criteria, dependencies, and assumptions.",
        es: "Criterios, dependencias y supuestos.",
        pt: "Criterios, dependencias e premissas.",
      }),
      label: byLanguage(language, { en: "Criteria", es: "Criterios", pt: "Criterios" }),
    },
    questions: {
      description: byLanguage(language, {
        en: "Questions and blockers movable to Attention.",
        es: "Preguntas y bloqueos movibles a Atencion.",
        pt: "Perguntas e bloqueios moviveis para Atencao.",
      }),
      label: byLanguage(language, { en: "Questions", es: "Preguntas", pt: "Perguntas" }),
    },
    traceability: {
      description: byLanguage(language, {
        en: "Traceability between inputs and requirements.",
        es: "Rastro entre entradas y requisitos.",
        pt: "Rastreabilidade entre entradas e requisitos.",
      }),
      label: byLanguage(language, { en: "Traceability", es: "Trazabilidad", pt: "Rastreabilidade" }),
    },
  };

  return map[key];
}

function isSubmitting(actionState?: ProductStageActionState, localAction?: LocalActionState) {
  return actionState?.status === "submitting" || localAction?.status === "submitting";
}

function payload(definition: DefinitionArtifact): Record<string, unknown> {
  return definition as unknown as Record<string, unknown>;
}

function DefineLoadingState() {
  const { language } = useLanguage();
  return (
    <UxaSurface className="p-[var(--uxa-panel-padding-lg)]">
      <div className="flex items-start gap-4">
        <span className="flex h-[var(--uxa-icon-tile)] w-[var(--uxa-icon-tile)] items-center justify-center rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-brand-soft)] text-[var(--uxa-color-brand)]">
          <Loader2 aria-hidden="true" className="h-6 w-6 animate-spin" />
        </span>
        <div>
          <UxaBadge tone="neutral">{byLanguage(language, { en: "Loading", es: "Cargando", pt: "Carregando" })}</UxaBadge>
          <h2 className="mt-3 text-[var(--uxa-font-size-screen-title)] font-black">{byLanguage(language, { en: "Preparing Define", es: "Preparando Definir", pt: "Preparando Definir" })}</h2>
          <p className="mt-2 text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">
            {byLanguage(language, {
              en: "We are loading requirements, artifacts, and the Attention Segment before showing the task.",
              es: "Estamos recuperando requisitos, artefactos y Segmento de Atencion antes de mostrar la tarea.",
              pt: "Estamos recuperando requisitos, artefatos e o Segmento de Atencao antes de mostrar a tarefa.",
            })}
          </p>
        </div>
      </div>
    </UxaSurface>
  );
}

function DefineErrorState({ message }: { message: string }) {
  const { language } = useLanguage();
  return (
    <UxaSurface className="border-[var(--uxa-state-danger)] p-[var(--uxa-panel-padding-lg)]">
      <div className="flex items-start gap-4">
        <span className="flex h-[var(--uxa-icon-tile)] w-[var(--uxa-icon-tile)] items-center justify-center rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-state-danger-bg)] text-[var(--uxa-state-danger)]">
          <AlertCircle aria-hidden="true" className="h-6 w-6" />
        </span>
        <div>
          <UxaBadge tone="danger">{byLanguage(language, { en: "Error", es: "Error", pt: "Erro" })}</UxaBadge>
          <h2 className="mt-3 text-[var(--uxa-font-size-screen-title)] font-black">{byLanguage(language, { en: "Define could not be opened", es: "No se pudo abrir Definir", pt: "Nao foi possivel abrir Definir" })}</h2>
          <p className="mt-2 text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">{message}</p>
        </div>
      </div>
    </UxaSurface>
  );
}



function EntityCard({ children, entity }: { children: ReactNode; entity: DefinitionEntityBase }) {
  const { language } = useLanguage();
  const tone: UxaTone =
    entity.status === "accepted" ? "success" : entity.status === "needs_input" ? "warning" : entity.status === "rejected" ? "danger" : "info";
  return (
    <article className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)]">{entity.key}</p>
          <h4 className="mt-1 text-[15px] font-black text-[var(--uxa-color-ink)]">{entity.title}</h4>
        </div>
        <div className="flex flex-wrap gap-2">
          <UxaBadge tone={tone}>{getEntityStatusLabel(language, entity.status)}</UxaBadge>
          <UxaBadge tone={entity.priority === "high" ? "danger" : entity.priority === "medium" ? "warning" : "neutral"}>
            {getPriorityLabel(language, entity.priority)}
          </UxaBadge>
        </div>
      </div>
      <div className="mt-3 text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">{children}</div>
      {entity.acceptance.length ? (
        <details className="mt-3 rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] p-3">
          <summary className="cursor-pointer text-[12px] font-black text-[var(--uxa-color-ink)]">
            {byLanguage(language, { en: "Acceptance criteria", es: "Criterios de aceptacion", pt: "Criterios de aceitacao" })}
          </summary>
          <ul className="mt-2 space-y-1 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
            {entity.acceptance.map((item, index) => (
              <li key={`${entity.key}-acceptance-${index}`}>{item}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </article>
  );
}

function EmptyDefinition({ canGenerate }: { canGenerate: boolean }) {
  const { language } = useLanguage();
  return (
    <UxaEmptyState
      description={canGenerate
        ? byLanguage(language, {
            en: "Discovery is already approved. Generate the canvas and requirements to unlock Design with full context.",
            es: "Discovery ya esta aprobado. Genera Canvas y requisitos para desbloquear Disenar con contexto completo.",
            pt: "Discovery ja esta aprovado. Gere o canvas e os requisitos para desbloquear Design com contexto completo.",
          })
        : byLanguage(language, {
            en: "Approve Discover before asking the LLM to structure the requirements.",
            es: "Aprueba Descubrir antes de pedirle al LLM que estructure los requisitos.",
            pt: "Aprove Descobrir antes de pedir ao LLM que estruture os requisitos.",
          })}
      eyebrow={byLanguage(language, { en: "Define", es: "Definir", pt: "Definir" })}
      icon={<Sparkles aria-hidden="true" className="h-5 w-5" />}
      title={byLanguage(language, {
        en: "There is no Definition for this session yet",
        es: "Todavia no existe Definicion para esta sesion",
        pt: "Ainda nao existe Definicao para esta sessao",
      })}
    />
  );
}

function DefinitionSummary({ definition, onChange }: { definition: DefinitionArtifact; onChange(next: DefinitionArtifact): void }) {
  const { language } = useLanguage();
  return (
    <div className="space-y-4">
      <UxaTextareaField
        label={byLanguage(language, {
          en: "Define executive summary",
          es: "Resumen ejecutivo de Definir",
          pt: "Resumo executivo de Definir",
        })}
        onChange={(event) => onChange({ ...definition, summary: event.target.value })}
        rows={5}
        value={definition.summary}
      />
      <div className="grid gap-3 md:grid-cols-3">
        <UxaSurface className="p-4" muted>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)]">
            {byLanguage(language, { en: "Measurable goals", es: "Objetivos medibles", pt: "Objetivos mensuraveis" })}
          </p>
          <ul className="mt-3 space-y-2 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
            {definition.measurable_objectives.map((item, index) => <li key={`objective-${index}`}>{item}</li>)}
          </ul>
        </UxaSurface>
        <UxaSurface className="p-4" muted>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)]">Canvas</p>
          <p className="mt-3 text-[13px] font-black text-[var(--uxa-color-ink)]">{definition.canvas_projection.agent_profile.mission}</p>
          <p className="mt-2 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">{definition.canvas_projection.user_goal}</p>
        </UxaSurface>
        <UxaSurface className="p-4" muted>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)]">
            {byLanguage(language, { en: "Primary risk", es: "Riesgo principal", pt: "Risco principal" })}
          </p>
          <p className="mt-3 text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">{definition.canvas_projection.primary_risk}</p>
        </UxaSurface>
      </div>
    </div>
  );
}

function FunctionalRequirements({ items }: { items: FunctionalRequirement[] }) {
  const { language } = useLanguage();
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <EntityCard entity={item} key={item.key}>
          <p>{item.requirement}</p>
          <p className="mt-2">
            <span className="font-black text-[var(--uxa-color-ink)]">{byLanguage(language, { en: "Trigger", es: "Disparador", pt: "Gatilho" })}:</span> {item.trigger}
          </p>
          <p className="mt-1">
            <span className="font-black text-[var(--uxa-color-ink)]">{byLanguage(language, { en: "Happy path", es: "Flujo ideal", pt: "Fluxo ideal" })}:</span> {item.happy_path}
          </p>
        </EntityCard>
      ))}
    </div>
  );
}

function NfrRequirements({ items }: { items: NonFunctionalRequirement[] }) {
  const { language } = useLanguage();
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <EntityCard entity={item} key={item.key}>
          <p>{item.requirement}</p>
          <p className="mt-2">
            <span className="font-black text-[var(--uxa-color-ink)]">{byLanguage(language, { en: "Metric", es: "Metrica", pt: "Metrica" })}:</span> {item.metric}
          </p>
          <p className="mt-1">
            <span className="font-black text-[var(--uxa-color-ink)]">{byLanguage(language, { en: "Target", es: "Objetivo", pt: "Meta" })}:</span> {item.target}
          </p>
        </EntityCard>
      ))}
    </div>
  );
}

function Rules({ items }: { items: BusinessRule[] }) {
  const { language } = useLanguage();
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <EntityCard entity={item} key={item.key}>
          <p>{item.rule}</p>
          <p className="mt-2">
            <span className="font-black text-[var(--uxa-color-ink)]">{byLanguage(language, { en: "Owner", es: "Responsable", pt: "Responsavel" })}:</span> {item.owner}
          </p>
        </EntityCard>
      ))}
    </div>
  );
}

function Criteria({
  acceptance,
  assumptions,
  dependencies,
}: {
  acceptance: AcceptanceCriterion[];
  assumptions: Assumption[];
  dependencies: Dependency[];
}) {
  const { language } = useLanguage();
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {acceptance.map((item) => (
          <EntityCard entity={item} key={item.key}>
            <p>{item.criterion}</p>
            <p className="mt-2">
              <span className="font-black text-[var(--uxa-color-ink)]">{byLanguage(language, { en: "Requirements", es: "Requisitos", pt: "Requisitos" })}:</span> {item.requirement_keys.join(", ")}
            </p>
          </EntityCard>
        ))}
      </div>
      <details className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-white p-4" open>
        <summary className="cursor-pointer text-[14px] font-black">
          {byLanguage(language, { en: "Dependencies and assumptions", es: "Dependencias y supuestos", pt: "Dependencias e premissas" })}
        </summary>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {dependencies.map((item) => (
            <EntityCard entity={item} key={item.key}>
              <p>{item.dependency}</p>
              <p className="mt-2">{item.dependency_type} · {item.owner}</p>
            </EntityCard>
          ))}
          {assumptions.map((item) => (
            <EntityCard entity={item} key={item.key}>
              <p>{item.assumption}</p>
            </EntityCard>
          ))}
        </div>
      </details>
    </div>
  );
}

function Questions({
  definition,
  onQuestionStatus,
  sessionId,
}: {
  definition: DefinitionArtifact;
  onQuestionStatus(key: string, status: "accepted" | "rejected" | "needs_input"): void;
  sessionId: string;
}) {
  const { language } = useLanguage();
  return (
    <div className="space-y-3">
      {definition.open_questions.map((item) => (
        <article className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-white p-4" key={item.key}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)]">
                {item.blocking
                  ? byLanguage(language, { en: "Blocking question", es: "Pregunta bloqueante", pt: "Pergunta bloqueante" })
                  : byLanguage(language, { en: "Non-blocking question", es: "Pregunta no bloqueante", pt: "Pergunta nao bloqueante" })} · {item.key}
              </p>
              <h4 className="mt-1 text-[15px] font-black">{item.question}</h4>
              <p className="mt-2 text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">{item.rationale}</p>
            </div>
            <UxaBadge tone={item.status === "accepted" ? "success" : item.status === "rejected" ? "danger" : "warning"}>{item.status}</UxaBadge>
          </div>
          <p className="mt-3 rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] p-3 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
            {byLanguage(language, { en: "Suggested answer", es: "Respuesta sugerida", pt: "Resposta sugerida" })}: {item.suggested_answer}
          </p>
          {item.answer_options?.length ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {item.answer_options.slice(0, 4).map((option) => (
                <div className="rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-border)] bg-[var(--uxa-color-surface)] p-3" key={option.key}>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[12px] font-black">{option.label}</p>
                    {option.recommended ? <UxaBadge tone="success">{byLanguage(language, { en: "Recommended", es: "Recomendada", pt: "Recomendada" })}</UxaBadge> : null}
                  </div>
                  {option.description ? <p className="mt-1 text-[11px] leading-4 text-[var(--uxa-color-ink-soft)]">{option.description}</p> : null}
                  {option.impact ? <p className="mt-2 text-[10px] font-semibold text-[var(--uxa-color-brand)]">{byLanguage(language, { en: "Impact", es: "Impacto", pt: "Impacto" })}: {option.impact}</p> : null}
                </div>
              ))}
            </div>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <UxaButton onClick={() => onQuestionStatus(item.key, "accepted")} size="sm" variant="secondary">{byLanguage(language, { en: "Mark resolved", es: "Marcar resuelta", pt: "Marcar resolvida" })}</UxaButton>
            <UxaButton onClick={() => onQuestionStatus(item.key, "needs_input")} size="sm" variant="ghost">{byLanguage(language, { en: "Keep pending", es: "Mantener pendiente", pt: "Manter pendente" })}</UxaButton>
            <UxaButton onClick={() => onQuestionStatus(item.key, "rejected")} size="sm" variant="ghost">{byLanguage(language, { en: "Dismiss", es: "Descartar", pt: "Descartar" })}</UxaButton>
            <Link className="uxa-button uxa-button--ghost uxa-button--sm" href={getProductExperienceProductHref(sessionId, "attention")}>
              {byLanguage(language, { en: "View in Attention", es: "Ver en Atencion", pt: "Ver em Atencao" })}
            </Link>
          </div>
        </article>
      ))}
      {!definition.open_questions.length ? (
        <UxaSurface className="p-[var(--uxa-panel-padding-lg)] text-center" muted>
          <CheckCircle2 aria-hidden="true" className="mx-auto h-6 w-6 text-[var(--uxa-state-success)]" />
          <p className="mt-2 text-[13px] font-black">{byLanguage(language, { en: "There are no pending questions in Define.", es: "Sin preguntas pendientes en Definir.", pt: "Nao ha perguntas pendentes em Definir." })}</p>
        </UxaSurface>
      ) : null}
    </div>
  );
}

function Traceability({ definition }: { definition: DefinitionArtifact }) {
  const { language } = useLanguage();
  return (
    <div className="overflow-hidden rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-white">
      <table className="w-full min-w-[720px] text-left text-[12px]">
        <thead className="bg-[var(--uxa-color-muted-panel)] text-[11px] uppercase tracking-[0.12em] text-[var(--uxa-color-ink-muted)]">
          <tr>
            <th className="p-3">{byLanguage(language, { en: "Source", es: "Fuente", pt: "Fonte" })}</th>
            <th className="p-3">{byLanguage(language, { en: "Requirement", es: "Requisito", pt: "Requisito" })}</th>
            <th className="p-3">{byLanguage(language, { en: "Coverage", es: "Cobertura", pt: "Cobertura" })}</th>
            <th className="p-3">{byLanguage(language, { en: "Rationale", es: "Justificacion", pt: "Justificativa" })}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--uxa-color-border)]">
          {definition.traceability.map((entry) => (
            <tr key={entry.key}>
              <td className="p-3 font-black">{entry.source_ref}</td>
              <td className="p-3">{entry.requirement_key}</td>
              <td className="p-3">{getCoverageStatusLabel(language, entry.coverage_status)}</td>
              <td className="p-3 text-[var(--uxa-color-ink-soft)]">{entry.rationale}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ValidationPanel({
  blockerCount,
  sessionId,
  validation,
}: {
  blockerCount: number;
  sessionId: string;
  validation: ReturnType<typeof buildDefineViewModel>["validation"];
}) {
  const { language } = useLanguage();
  const hasWarnings =
    validation.blocking_issues.length ||
    validation.missing_acceptance.length ||
    validation.untraced_items.length ||
    validation.vague_nfrs.length;
  return (
    <UxaSurface className={cn("p-4", blockerCount ? "border-[var(--uxa-state-danger)]" : "")}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] text-[var(--uxa-color-brand)]">
          {blockerCount ? <ShieldAlert aria-hidden="true" className="h-5 w-5" /> : <CheckCircle2 aria-hidden="true" className="h-5 w-5" />}
        </span>
        <div>
          <p className="text-[13px] font-black">{byLanguage(language, { en: "Define quality control", es: "Control de calidad de Definir", pt: "Controle de qualidade de Definir" })}</p>
          <p className="mt-1 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
            {blockerCount
              ? byLanguage(language, { en: "There are issues that must be resolved before approving the definition.", es: "Hay asuntos que deben resolverse antes de aprobar la definicion.", pt: "Ha assuntos que precisam ser resolvidos antes de aprovar a definicao." })
              : byLanguage(language, { en: "No critical blockers were detected before promoting to Design.", es: "No se detectan bloqueos criticos para promover a Disenar.", pt: "Nao ha bloqueios criticos para promover para Design." })}
          </p>
        </div>
      </div>
      {hasWarnings ? (
        <div className="mt-4 space-y-2">
          {validation.blocking_issues.map((item, index) => (
            <p className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-state-danger)] bg-[var(--uxa-state-danger-bg)] p-3 text-[12px]" key={`${item}-${index}`}>
              {item}
            </p>
          ))}
          {validation.missing_acceptance.map((item, index) => (
            <p className="rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] p-3 text-[12px]" key={`acceptance-${item}-${index}`}>
              {byLanguage(language, { en: "Missing acceptance in", es: "Falta acceptance en", pt: "Falta acceptance em" })} {item}
            </p>
          ))}
          {validation.untraced_items.map((item, index) => (
            <p className="rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] p-3 text-[12px]" key={`trace-${item}-${index}`}>
              {byLanguage(language, { en: "Missing traceability in", es: "Falta trazabilidad en", pt: "Falta rastreabilidade em" })} {item}
            </p>
          ))}
        </div>
      ) : null}
      <Link className="mt-4 inline-flex text-[12px] font-black text-[var(--uxa-color-brand)]" href={getProductExperienceProductHref(sessionId, "attention")}>
        {byLanguage(language, { en: "Open Attention Segment", es: "Abrir Segmento de Atencion", pt: "Abrir Segmento de Atencao" })} <ArrowRight aria-hidden="true" className="ml-1 h-4 w-4" />
      </Link>
    </UxaSurface>
  );
}

function DefinitionSection({
  activeSection,
  definition,
  onChange,
  onQuestionStatus,
  sessionId,
}: {
  activeSection: DefineSection;
  definition: DefinitionArtifact;
  onChange(next: DefinitionArtifact): void;
  onQuestionStatus(key: string, status: "accepted" | "rejected" | "needs_input"): void;
  sessionId: string;
}) {
  if (activeSection === "summary") {
    return <DefinitionSummary definition={definition} onChange={onChange} />;
  }

  if (activeSection === "requirements") {
    return <FunctionalRequirements items={definition.functional_requirements} />;
  }

  if (activeSection === "nfr") {
    return <NfrRequirements items={definition.non_functional_requirements} />;
  }

  if (activeSection === "rules") {
    return <Rules items={definition.business_rules} />;
  }

  if (activeSection === "criteria") {
    return (
      <Criteria
        acceptance={definition.acceptance_criteria}
        assumptions={definition.assumptions}
        dependencies={definition.dependencies}
      />
    );
  }

  if (activeSection === "questions") {
    return <Questions definition={definition} onQuestionStatus={onQuestionStatus} sessionId={sessionId} />;
  }

  return <Traceability definition={definition} />;
}

export function DefineStageView({ actionState, activeRoute, actions }: DefineStageViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const latestDefineArtifact = activeRoute?.snapshot.data?.journey_latest_artifacts?.define ?? null;
  const artifactSignature = `${latestDefineArtifact?.id ?? "none"}:${latestDefineArtifact?.updated_at ?? ""}`;
  const parsedDefinition = useMemo(() => parseDefinitionArtifact(latestDefineArtifact), [latestDefineArtifact]);
  const [draftState, setDraftState] = useState<{
    definition: DefinitionArtifact | null;
    signature: string;
  }>({ definition: null, signature: "uninitialized" });
  const draftDefinition = draftState.signature === artifactSignature ? draftState.definition : parsedDefinition;
  const [localAction, setLocalAction] = useState<LocalActionState>({ status: "idle" });
  const selectedSection = parseDefineSection(searchParams.get("uxa_section"));
  const processing = isSubmitting(actionState, localAction);
  const viewModel = useMemo(
    () => buildDefineViewModel(activeRoute, { draftDefinition, processing }),
    [activeRoute, draftDefinition, processing],
  );
  const message = actionState?.message ?? localAction.message;
  const statusCopy = getStatusCopy(language);
  const copy = (en: string, es: string, pt: string) => byLanguage(language, { en, es, pt });

  function setDraftDefinition(next: DefinitionArtifact | null) {
    setDraftState({
      definition: next,
      signature: artifactSignature,
    });
  }

  function updateSection(section: DefineSection) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("uxa_section", section);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  async function runLocal(messageText: string, action: () => Promise<void>) {
    setLocalAction({ message: messageText, status: "submitting" });
    try {
      await action();
      setLocalAction({ message: copy("Define synchronized.", "Definir sincronizado.", "Definir sincronizado."), status: "success" });
    } catch (error) {
      setLocalAction({
        message: error instanceof Error ? error.message : copy(
          "The Define action could not be completed.",
          "No se pudo completar la accion de Definir.",
          "Nao foi possivel completar a acao de Definir.",
        ),
        status: "error",
      });
      throw error;
    }
  }

  async function handleGenerate() {
    await runLocal(copy(
      "Generating canvas and requirements with the backend.",
      "Generando Canvas y requisitos con backend.",
      "Gerando canvas e requisitos com o backend.",
    ), async () => {
      await actions?.buildCanvas();
      await actions?.defineRequirements();
    });
  }

  async function handleSave() {
    if (!viewModel.latestDefineArtifact || !draftDefinition) {
      return;
    }

    await runLocal(copy("Saving Define review.", "Guardando revision de Definir.", "Salvando revisao de Definir."), async () => {
      await actions?.patchStageArtifact("define", viewModel.latestDefineArtifact!.id, {
        note: "uxa8_define_review",
        proposal_payload: payload(draftDefinition),
      });
    });
  }

  async function handleApprove() {
    if (!viewModel.latestDefineArtifact || !draftDefinition) {
      return;
    }

    await runLocal(copy(
      "Approving Define and enabling Design.",
      "Aprobando Definir y habilitando Disenar.",
      "Aprovando Definir e habilitando Design.",
    ), async () => {
      await actions?.patchStageArtifact("define", viewModel.latestDefineArtifact!.id, {
        note: "uxa8_define_pre_approval_review",
        proposal_payload: payload(draftDefinition),
      });
      await actions?.approveStageArtifact("define", viewModel.latestDefineArtifact!.id, {
        decision_payload: {
          source: "product_experience_v2",
          validation: viewModel.validation,
        },
        note: "uxa8_define_approved",
      });
      router.push(getProductExperienceStageHref(viewModel.sessionId, "design"));
    });
  }

  async function handleReject() {
    if (!viewModel.latestDefineArtifact) {
      return;
    }

    await runLocal(copy("Rejecting Define proposal.", "Rechazando propuesta de Definir.", "Rejeitando proposta de Definir."), async () => {
      await actions?.rejectStageArtifact("define", viewModel.latestDefineArtifact!.id, {
        note: "uxa8_define_rejected",
      });
    });
  }

  async function handleQuestionStatus(key: string, status: "accepted" | "rejected" | "needs_input") {
    if (!draftDefinition || !viewModel.latestDefineArtifact) {
      return;
    }

    const next = setOpenQuestionStatus(draftDefinition, key, status);
    setDraftDefinition(next);
    await actions?.patchStageArtifact("define", viewModel.latestDefineArtifact.id, {
      note: `uxa8_define_question:${key}:${status}`,
      proposal_payload: payload(next),
    });
  }

  if (viewModel.status === "loading") {
    return <DefineLoadingState />;
  }

  if (viewModel.status === "error") {
    return <DefineErrorState message={activeRoute?.snapshot.error?.message ?? byLanguage(language, { en: "The snapshot could not be loaded.", es: "No se pudo cargar el snapshot.", pt: "Nao foi possivel carregar o snapshot." })} />;
  }

  const progress = viewModel.status === "approved" ? 100 : viewModel.status === "waiting_review" ? 72 : viewModel.status === "empty" ? 38 : viewModel.status === "blocked" ? 16 : 48;
  const primaryLabel =
    viewModel.status === "approved"
      ? byLanguage(language, { en: "Continue to Design", es: "Continuar a Disenar", pt: "Continuar para Design" })
      : viewModel.definition
        ? byLanguage(language, { en: "Approve Define", es: "Aprobar Definir", pt: "Aprovar Definir" })
        : viewModel.status === "blocked"
          ? byLanguage(language, { en: "Back to Discover", es: "Volver a Descubrir", pt: "Voltar para Descobrir" })
          : byLanguage(language, { en: "Generate Definition", es: "Generar Definicion", pt: "Gerar Definicao" });
  const primaryDescription =
    viewModel.status === "approved"
      ? byLanguage(language, { en: "The definition is already approved and can drive architecture and behavior.", es: "La definicion ya esta aprobada y puede alimentar arquitectura y comportamiento.", pt: "A definicao ja esta aprovada e pode alimentar arquitetura e comportamento." })
      : viewModel.status === "blocked"
        ? byLanguage(language, { en: "Define needs an approved Discover before asking the LLM to consolidate requirements.", es: "Definir necesita un Discover aprobado antes de pedirle al LLM que consolide requisitos.", pt: "Definir precisa de um Discover aprovado antes de pedir ao LLM que consolide requisitos." })
        : viewModel.definition
          ? byLanguage(language, { en: "Review requirements, rules, NFRs, questions, and traceability before approving.", es: "Revisa requisitos, reglas, NFR, preguntas y trazabilidad antes de aprobar.", pt: "Revise requisitos, regras, NFR, perguntas e rastreabilidade antes de aprovar." })
          : byLanguage(language, { en: "Generate goals, scope, and requirements from the approved Discovery.", es: "Genera objetivos, alcance y requisitos a partir del Discovery aprobado.", pt: "Gere objetivos, escopo e requisitos a partir do Discovery aprovado." });
  const contract: LeanStageScreenContract = {
    attentionItems: [
      ...viewModel.validation.blocking_issues.slice(0, 4).map((item) => ({
        description: byLanguage(language, { en: "This blocks or degrades the quality of the definition.", es: "Bloquea o degrada la calidad de la definicion.", pt: "Isto bloqueia ou degrada a qualidade da definicao." }),
        href: getProductExperienceProductHref(viewModel.sessionId, "attention"),
        label: byLanguage(language, { en: "Blocker", es: "Bloqueo", pt: "Bloqueio" }),
        tone: "danger" as const,
        value: item,
      })),
      ...viewModel.warnings.slice(0, 3).map((warning) => ({
        description: byLanguage(language, { en: "Traceability or staleness warning.", es: "Advertencia de trazabilidad o staleness.", pt: "Advertencia de rastreabilidade ou stale." }),
        href: getProductExperienceProductHref(viewModel.sessionId, "attention"),
        label: byLanguage(language, { en: "Warning", es: "Advertencia", pt: "Advertencia" }),
        tone: "warning" as const,
        value: warning,
      })),
    ],
    linkedResults: [
      {
        description: viewModel.definition
          ? byLanguage(language, { en: "Generated PRD, requirements, rules, and criteria.", es: "PRD, requisitos, reglas y criterios generados.", pt: "PRD, requisitos, regras e criterios gerados." })
          : byLanguage(language, { en: "Enabled after generating Define.", es: "Se habilita al generar Definir.", pt: "Sera habilitado ao gerar Definir." }),
        href: viewModel.definition ? getProductExperienceProductHref(viewModel.sessionId, "artifacts") : undefined,
        label: byLanguage(language, { en: "Define document", es: "Documento de Definir", pt: "Documento de Definir" }),
        locked: !viewModel.definition,
        type: "document",
      },
      {
        description: byLanguage(language, { en: "Map of requirements, rules, dependencies, and scope.", es: "Mapa de requisitos, reglas, dependencias y alcance.", pt: "Mapa de requisitos, regras, dependencias e escopo." }),
        href: getProductExperienceProductHref(viewModel.sessionId, "diagrams"),
        label: byLanguage(language, { en: "Requirements-rules diagram", es: "Diagrama requisitos-reglas", pt: "Diagrama requisitos-regras" }),
        locked: !viewModel.definition,
        type: "diagram",
      },
      {
        description: byLanguage(language, { en: "Open questions, review changes, and decisions made.", es: "Preguntas abiertas, cambios de revision y decisiones tomadas.", pt: "Perguntas abertas, mudancas de revisao e decisoes tomadas." }),
        href: getProductExperienceProductHref(viewModel.sessionId, "attention"),
        label: copy("Decision log", "Registro de decisiones", "Registro de decisoes"),
        locked: !viewModel.latestDefineArtifact,
        type: "decision",
      },
    ],
    metric: {
      helper: byLanguage(language, {
        en: `${viewModel.totalRequirementCount} functional item(s) covered. Last updated: ${viewModel.snapshotUpdatedAt ?? "no snapshot"}.`,
        es: `${viewModel.totalRequirementCount} item(s) funcionales cubiertos. Ultima actualizacion: ${viewModel.snapshotUpdatedAt ?? "sin snapshot"}.`,
        pt: `${viewModel.totalRequirementCount} item(ns) funcionais cobertos. Ultima atualizacao: ${viewModel.snapshotUpdatedAt ?? "sem snapshot"}.`,
      }),
      label: byLanguage(language, { en: "Definition maturity", es: "Madurez de definicion", pt: "Maturidade da definicao" }),
      progress,
      value: `${progress}%`,
    },
    nextStep:
      viewModel.status === "approved"
        ? byLanguage(language, { en: "Design will use these requirements as approved context to generate architecture and patterns.", es: "Disenar usara estos requisitos como contexto aprobado para generar arquitectura y patrones.", pt: "Design usara estes requisitos como contexto aprovado para gerar arquitetura e padroes." })
        : byLanguage(language, { en: "Once Define is approved, the system can ask the LLM for architecture alternatives without starting from ambiguity.", es: "Al aprobar Definir, el sistema podra pedir al LLM alternativas de arquitectura sin partir de ambiguedades.", pt: "Ao aprovar Definir, o sistema podera pedir ao LLM alternativas de arquitetura sem partir de ambiguidades." }),
    primaryAction: {
      description: primaryDescription,
      label: primaryLabel,
      tone: viewModel.status === "blocked" ? "danger" : viewModel.status === "approved" ? "success" : "info",
    },
    stage: {
      description: byLanguage(language, { en: "Consolidate goals, scope, requirements, rules, NFRs, and acceptance criteria before design.", es: "Consolida objetivos, alcance, requisitos, reglas, NFR y criterios de aceptacion antes del diseno.", pt: "Consolide objetivos, escopo, requisitos, regras, NFR e criterios de aceitacao antes do design." }),
      objective: byLanguage(language, { en: "Structure the functional, non-functional, and business requirements.", es: "Estructurar los requerimientos funcionales, no funcionales y de negocio.", pt: "Estruturar os requisitos funcionais, nao funcionais e de negocio." }),
      statusLabel: statusCopy[viewModel.status].label,
      statusTone: statusCopy[viewModel.status].tone,
      title: byLanguage(language, { en: "Define: goals, scope, and requirements", es: "Definir: objetivos, alcance y requisitos", pt: "Definir: objetivos, escopo e requisitos" }),
    },
    tabs: [
      {
        badge: viewModel.totalRequirementCount,
        description: byLanguage(language, { en: "Editable review of the proposed definition.", es: "Revision editable de la definicion propuesta.", pt: "Revisao editavel da definicao proposta." }),
        key: "task",
        label: byLanguage(language, { en: "Current task", es: "Tarea actual", pt: "Tarefa atual" }),
        children: viewModel.status === "blocked" ? (
          <UxaSurface className="border-[var(--uxa-state-danger)] p-[var(--uxa-panel-padding-lg)]">
            <div className="flex items-start gap-4">
              <ShieldAlert aria-hidden="true" className="h-8 w-8 text-[var(--uxa-state-danger)]" />
              <div>
                <h3 className="text-[22px] font-black">{byLanguage(language, { en: "Define depends on approved Discover", es: "Definir depende de Discover aprobado", pt: "Definir depende de Discover aprovado" })}</h3>
                <p className="mt-2 text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">
                  {byLanguage(language, { en: "Go back to Discover, complete the pending items, and approve the context before structuring requirements.", es: "Vuelve a Descubrir, completa los pendientes y aprueba el contexto antes de estructurar requisitos.", pt: "Volte a Descobrir, conclua os pendentes e aprove o contexto antes de estruturar requisitos." })}
                </p>
                <Link className="uxa-button uxa-button--primary mt-4" href={getProductExperienceStageHref(viewModel.sessionId, "discover")}>
                  {byLanguage(language, { en: "Go to Discover", es: "Ir a Descubrir", pt: "Ir para Descobrir" })}
                </Link>
              </div>
            </div>
          </UxaSurface>
        ) : viewModel.definition ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {viewModel.sections.map((section) => (
                <UxaFilterChip
                  key={section.key}
                  onClick={() => updateSection(section.key)}
                  selected={selectedSection === section.key}
                >
                  {getSectionCopy(language, section.key).label} {section.count}
                </UxaFilterChip>
              ))}
            </div>
            <DefinitionSection
              activeSection={selectedSection}
              definition={viewModel.definition}
              onChange={setDraftDefinition}
              onQuestionStatus={handleQuestionStatus}
              sessionId={viewModel.sessionId}
            />
          </div>
        ) : (
          <EmptyDefinition canGenerate={viewModel.canGenerate} />
        ),
      },
      {
        badge: viewModel.validation.blocking_issues.length,
        description: byLanguage(language, { en: "Quality, coverage, and promotion status.", es: "Calidad, cobertura y estado de promocion.", pt: "Qualidade, cobertura e estado de promocao." }),
        key: "result",
        label: byLanguage(language, { en: "Generated result", es: "Resultado generado", pt: "Resultado gerado" }),
        children: viewModel.definition ? (
          <div className="space-y-4">
            <DefinitionSummary definition={viewModel.definition} onChange={setDraftDefinition} />
            <ValidationPanel blockerCount={viewModel.openBlockerCount} sessionId={viewModel.sessionId} validation={viewModel.validation} />
          </div>
        ) : (
          <EmptyDefinition canGenerate={viewModel.canGenerate} />
        ),
      },
      {
        badge: viewModel.definition?.open_questions.length ?? 0,
        description: byLanguage(language, { en: "Questions, references, warnings, and traceability.", es: "Preguntas, referencias, warnings y trazabilidad.", pt: "Perguntas, referencias, warnings e rastreabilidade." }),
        key: "evidence",
        label: byLanguage(language, { en: "Evidence and traceability", es: "Evidencia y trazabilidad", pt: "Evidencia e rastreabilidade" }),
        children: viewModel.definition ? (
          <div className="space-y-4">
            <Questions definition={viewModel.definition} onQuestionStatus={handleQuestionStatus} sessionId={viewModel.sessionId} />
            <Traceability definition={viewModel.definition} />
            <UxaSurface className="p-4">
              <p className="text-[13px] font-black">{byLanguage(language, { en: "Available context", es: "Contexto disponible", pt: "Contexto disponivel" })}</p>
              <p className="mt-2 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
                {byLanguage(language, { en: "Evidence refs", es: "Evidence refs", pt: "Evidence refs" })}: {viewModel.definition.evidence_refs.length ? viewModel.definition.evidence_refs.join(", ") : byLanguage(language, { en: "no refs", es: "sin refs", pt: "sem refs" })}
              </p>
              {viewModel.warnings.map((warning, index) => (
                <p className="mt-2 rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] p-3 text-[12px]" key={`${warning}-${index}`}>
                  {warning}
                </p>
              ))}
            </UxaSurface>
          </div>
        ) : (
          <UxaSurface className="p-[var(--uxa-panel-padding-lg)]" muted>
            <p className="text-[13px] font-black">{byLanguage(language, { en: "Evidence will appear when a definition exists.", es: "La evidencia aparecera cuando exista definicion generada.", pt: "A evidencia aparecera quando existir uma definicao gerada." })}</p>
          </UxaSurface>
        ),
      },
    ],
  };

  return (
    <LeanStageScreen
      actionArea={
        <>
          {viewModel.status === "approved" ? (
            <UxaButton onClick={() => router.push(getProductExperienceStageHref(viewModel.sessionId, "design"))} variant="primary">
              {byLanguage(language, { en: "Continue to Design", es: "Continuar a Disenar", pt: "Continuar para Design" })} <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </UxaButton>
          ) : viewModel.definition ? (
            <UxaButton disabled={!viewModel.canApprove || processing} isLoading={processing && actionState?.action === "approve"} onClick={() => void handleApprove()} variant="primary">
              {byLanguage(language, { en: "Approve Define", es: "Aprobar Definir", pt: "Aprovar Definir" })} <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </UxaButton>
          ) : (
            <UxaButton disabled={!viewModel.canGenerate || processing} isLoading={processing} onClick={() => void handleGenerate()} variant="primary">
              {byLanguage(language, { en: "Generate Definition", es: "Generar Definicion", pt: "Gerar Definicao" })} <Sparkles aria-hidden="true" className="h-4 w-4" />
            </UxaButton>
          )}
          <UxaButton disabled={!viewModel.canGenerate || processing} onClick={() => void handleGenerate()} variant="secondary">
            <RefreshCw aria-hidden="true" className="h-4 w-4" /> {byLanguage(language, { en: "Regenerate", es: "Regenerar", pt: "Regenerar" })}
          </UxaButton>
          <UxaButton disabled={!viewModel.definition || processing} onClick={() => void handleSave()} variant="secondary">
            {byLanguage(language, { en: "Save review", es: "Guardar revision", pt: "Salvar revisao" })}
          </UxaButton>
          <UxaButton disabled={!viewModel.latestDefineArtifact || processing} onClick={() => void handleReject()} variant="ghost">
            {byLanguage(language, { en: "Reject proposal", es: "Rechazar propuesta", pt: "Rejeitar proposta" })}
          </UxaButton>
          <Link className="uxa-button uxa-button--ghost" href={getProductExperienceProductHref(viewModel.sessionId, "attention")}>
            <HelpCircle aria-hidden="true" className="h-4 w-4" /> {byLanguage(language, { en: "Attention", es: "Atencion", pt: "Atencao" })}
          </Link>
        </>
      }
      contract={contract}
      message={message}
    />
  );
}
