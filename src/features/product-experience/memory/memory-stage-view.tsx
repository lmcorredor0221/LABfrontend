"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
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
  UxaSurface,
  UxaTextareaField,
  type UxaTone,
} from "@/features/product-experience/design-system";
import { byLanguage } from "@/features/product-experience/core/localized-copy";
import {
  LeanGeneratedDeliverable,
  LeanStageScreen,
  type LeanStageScreenContract,
} from "@/features/product-experience/stage-screen";
import {
  buildMemoryViewModel,
  parseMemoryArtifact,
  type MemoryStageStatus,
} from "@/features/product-experience/memory/memory-model";
import { getProductExperienceProductHref, getProductExperienceStageHref } from "@/features/product-experience/shell/experience-model";
import type {
  ProductStageActions,
  ProductStageActionState,
} from "@/features/product-experience/shell/use-product-experience-route";
import type { MemoryRecommendationArtifact } from "@/features/sessions/session-contracts";
import { useLanguage, type SupportedLanguage } from "@/core/i18n/language-context";
import { cn } from "@/lib/utils";

type MemoryStageViewProps = {
  actionState?: ProductStageActionState;
  activeRoute: ProductExperienceRouteSnapshot | null;
  actions?: ProductStageActions;
};

type LocalActionState = {
  message?: string;
  status: "idle" | "submitting" | "success" | "error";
};

function getStatusCopy(language: SupportedLanguage): Record<MemoryStageStatus, { description: string; label: string; tone: UxaTone }> {
  return {
    approved: {
      description: byLanguage(language, { en: "Memory approved. The Blueprint can move toward Validate and Estimate.", es: "Memoria aprobada. El Blueprint puede avanzar hacia Validar/Estimar.", pt: "Memoria aprovada. O Blueprint pode avancar para Validar e Estimar." }),
      label: byLanguage(language, { en: "Approved", es: "Aprobado", pt: "Aprovado" }),
      tone: "success",
    },
    blocked: {
      description: byLanguage(language, { en: "Promote Tools first so a canonical digest exists.", es: "Primero promueve Herramientas para que exista digest canonico.", pt: "Promova Ferramentas primeiro para que exista um digest canonico." }),
      label: byLanguage(language, { en: "Blocked", es: "Bloqueado", pt: "Bloqueado" }),
      tone: "danger",
    },
    empty: {
      description: byLanguage(language, { en: "Tools approved. Generate the memory and knowledge strategy.", es: "Tools aprobado. Genera estrategia de memoria y conocimiento.", pt: "Tools aprovado. Gere a estrategia de memoria e conhecimento." }),
      label: byLanguage(language, { en: "Ready to generate", es: "Listo para generar", pt: "Pronto para gerar" }),
      tone: "info",
    },
    error: {
      description: byLanguage(language, { en: "The real project information could not be loaded.", es: "No fue posible recuperar la informacion real del proyecto.", pt: "Nao foi possivel recuperar a informacao real do projeto." }),
      label: byLanguage(language, { en: "Error", es: "Error", pt: "Erro" }),
      tone: "danger",
    },
    loading: {
      description: byLanguage(language, { en: "Loading the snapshot, attention, and memory state.", es: "Recuperando snapshot, attention y memoria.", pt: "Recuperando snapshot, attention e memoria." }),
      label: byLanguage(language, { en: "Loading", es: "Cargando", pt: "Carregando" }),
      tone: "neutral",
    },
    processing: {
      description: byLanguage(language, { en: "The system is running a real backend action.", es: "El sistema esta ejecutando una accion real contra backend.", pt: "O sistema esta executando uma acao real no backend." }),
      label: byLanguage(language, { en: "Processing", es: "Procesando", pt: "Processando" }),
      tone: "warning",
    },
    stale: {
      description: byLanguage(language, { en: "Tools or Memory changed. Regenerate before approving.", es: "Tools o Memory cambiaron. Regenera antes de aprobar.", pt: "Tools ou Memory mudaram. Regenere antes de aprovar." }),
      label: byLanguage(language, { en: "Outdated", es: "Desactualizado", pt: "Desatualizado" }),
      tone: "warning",
    },
    waiting_review: {
      description: byLanguage(language, { en: "Review strategy, RAG, ownership, budget, and dependencies before approving.", es: "Revisa estrategia, RAG, propiedad, presupuesto y dependencias antes de aprobar.", pt: "Revise estrategia, RAG, propriedade, orcamento e dependencias antes de aprovar." }),
      label: byLanguage(language, { en: "In review", es: "En revision", pt: "Em revisao" }),
      tone: "warning",
    },
  };
}

function isSubmitting(actionState?: ProductStageActionState, localAction?: LocalActionState) {
  return actionState?.status === "submitting" || localAction?.status === "submitting";
}

function hasActiveServerOperation(
  activeRoute: ProductExperienceRouteSnapshot | null,
  stageKey: string,
  actions: string[],
) {
  const operation = activeRoute?.operation.data?.stageOperation ?? null;
  return Boolean(
    operation &&
      operation.stage_key === stageKey &&
      actions.includes(operation.action) &&
      ["queued", "running"].includes(operation.status),
  );
}

function payload(memory: MemoryRecommendationArtifact): Record<string, unknown> {
  return memory as unknown as Record<string, unknown>;
}


function LoadingState() {
  const { language } = useLanguage();
  return (
    <UxaSurface className="p-[var(--uxa-panel-padding-lg)]">
      <div className="flex items-start gap-4">
        <span className="flex h-[var(--uxa-icon-tile)] w-[var(--uxa-icon-tile)] items-center justify-center rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-brand-soft)] text-[var(--uxa-color-brand)]">
          <Loader2 aria-hidden="true" className="h-6 w-6 animate-spin" />
        </span>
        <div>
          <UxaBadge tone="neutral">{byLanguage(language, { en: "Loading", es: "Cargando", pt: "Carregando" })}</UxaBadge>
          <h2 className="mt-3 text-[var(--uxa-font-size-screen-title)] font-black">{byLanguage(language, { en: "Preparing Memory", es: "Preparando Memoria", pt: "Preparando Memoria" })}</h2>
          <p className="mt-2 text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">
            {byLanguage(language, { en: "Loading strategy, tools digest, sources, budget, and blockers.", es: "Recuperando estrategia, digest de Herramientas, fuentes, presupuesto y bloqueos.", pt: "Recuperando estrategia, digest de Ferramentas, fontes, orcamento e bloqueios." })}
          </p>
        </div>
      </div>
    </UxaSurface>
  );
}


function EmptyMemory({ canGenerate }: { canGenerate: boolean }) {
  const { language } = useLanguage();
  return (
    <UxaEmptyState
      description={canGenerate
        ? byLanguage(language, { en: "Tools is already approved. Generate short and long-term memory, RAG, sources, and context budget.", es: "Herramientas ya esta aprobado. Genera memoria corta/larga, RAG, fuentes y presupuesto de contexto.", pt: "Ferramentas ja esta aprovado. Gere memoria curta/longa, RAG, fontes e orcamento de contexto." })
        : byLanguage(language, { en: "Promote Tools first to create the canonical digest.", es: "Promueve primero Herramientas para crear el digest canonico.", pt: "Promova Ferramentas primeiro para criar o digest canonico." })}
      eyebrow={byLanguage(language, { en: "Memory", es: "Memoria", pt: "Memoria" })}
      icon={<Sparkles aria-hidden="true" className="h-5 w-5" />}
      title={byLanguage(language, { en: "There is no Memory strategy yet", es: "Todavia no existe estrategia de Memoria", pt: "Ainda nao existe estrategia de Memoria" })}
    />
  );
}

function Blockers({
  blockers,
  sessionId,
}: {
  blockers: ReturnType<typeof buildMemoryViewModel>["blockers"];
  sessionId: string;
}) {
  const { language } = useLanguage();
  const hasBlocking = blockers.some((item) => item.severity === "blocking");
  const hasWarnings = blockers.length > 0;
  if (!hasWarnings) {
    return null;
  }
  const title = hasBlocking
    ? byLanguage(language, { en: "Approval control", es: "Control de aprobacion", pt: "Controle de aprovacao" })
    : hasWarnings
      ? byLanguage(language, { en: "Deferred observations", es: "Observaciones diferidas", pt: "Observacoes diferidas" })
      : byLanguage(language, { en: "Approval control", es: "Control de aprobacion", pt: "Controle de aprovacao" });
  const description = hasBlocking
    ? byLanguage(language, { en: "Resolve these issues before approving Memory.", es: "Resuelve estos asuntos antes de aprobar Memoria.", pt: "Resolva estes assuntos antes de aprovar Memoria." })
    : hasWarnings
      ? byLanguage(language, {
          en: "These quality findings remain documented for Blueprint Pro or ACP, but they do not block Basic Blueprint approval.",
          es: "Estos hallazgos de calidad quedan documentados para Blueprint Pro o ACP, pero no bloquean la aprobacion del Blueprint Basico.",
          pt: "Estes achados de qualidade ficam documentados para Blueprint Pro ou ACP, mas nao bloqueiam a aprovacao do Blueprint Basico.",
        })
      : byLanguage(language, { en: "The proposal has no critical blockers.", es: "La propuesta no tiene bloqueos criticos.", pt: "A proposta nao tem bloqueios criticos." });
  return (
    <details
      className={cn(
        "group rounded-[var(--uxa-radius-xl)] border bg-white",
        hasBlocking ? "border-[var(--uxa-state-danger)]" : "border-[var(--uxa-state-warning)]",
      )}
      open={hasBlocking}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] text-[var(--uxa-color-brand)]">
            {hasBlocking ? <ShieldAlert aria-hidden="true" className="h-5 w-5" /> : <CheckCircle2 aria-hidden="true" className="h-5 w-5" />}
          </span>
          <div>
            <p className="text-[13px] font-black">{title}</p>
            <p className="mt-1 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
              {hasBlocking
                ? description
                : byLanguage(language, {
                    en: `${blockers.length} deferred finding(s). Expand only if you want to review traceability.`,
                    es: `${blockers.length} hallazgo(s) diferido(s). Expande solo si quieres revisar la trazabilidad.`,
                    pt: `${blockers.length} achado(s) diferido(s). Expanda apenas se quiser revisar a rastreabilidade.`,
                  })}
            </p>
          </div>
        </div>
        <ChevronDown aria-hidden="true" className="h-5 w-5 shrink-0 text-[var(--uxa-color-ink-muted)] transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-[var(--uxa-color-border)] px-4 pb-4 pt-3">
        <p className="rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] p-3 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
          {description}
        </p>
      </div>
      <div className="space-y-2 px-4 pb-4">
        {blockers.map((blocker) => (
          <p
            className={cn(
              "rounded-[var(--uxa-radius-lg)] p-3 text-[12px]",
              blocker.severity === "blocking"
                ? "bg-[var(--uxa-state-danger-bg)]"
                : "bg-[var(--uxa-state-warning-bg)]",
            )}
            key={blocker.key}
          >
            <span className="font-black">{blocker.severity === "blocking" ? blocker.title : `${blocker.title} (diferido)`}: </span>{blocker.detail}
          </p>
        ))}
      </div>
      <div className="px-4 pb-4">
        <Link className="inline-flex text-[12px] font-black text-[var(--uxa-color-brand)]" href={getProductExperienceProductHref(sessionId, "attention")}>
          {byLanguage(language, { en: "Open Attention Segment", es: "Abrir Segmento de Atencion", pt: "Abrir Segmento de Atencao" })} <ArrowRight aria-hidden="true" className="ml-1 h-4 w-4" />
        </Link>
      </div>
    </details>
  );
}

function Strategy({
  memory,
  onChange,
}: {
  memory: MemoryRecommendationArtifact;
  onChange(next: MemoryRecommendationArtifact): void;
}) {
  const { language } = useLanguage();
  return (
    <div className="space-y-4">
      <UxaTextareaField
        label={byLanguage(language, { en: "Strategy summary", es: "Resumen de estrategia", pt: "Resumo da estrategia" })}
        onChange={(event) => onChange({ ...memory, summary: event.target.value })}
        rows={4}
        value={memory.summary}
      />
      <div className="grid gap-3 lg:grid-cols-3">
        <UxaSurface className="p-4" muted>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)]">{byLanguage(language, { en: "Decision", es: "Decision", pt: "Decisao" })}</p>
          <p className="mt-2 text-[18px] font-black">{memory.memory_need_decision.mode}</p>
          <p className="mt-2 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">{memory.memory_need_decision.summary}</p>
        </UxaSurface>
        <UxaSurface className="p-4" muted>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)]">{byLanguage(language, { en: "Short-term", es: "Corta", pt: "Curta" })}</p>
          <p className="mt-2 text-[13px] leading-6">{memory.short_term_design.summary}</p>
        </UxaSurface>
        <UxaSurface className="p-4" muted>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)]">{byLanguage(language, { en: "Long-term", es: "Larga", pt: "Longa" })}</p>
          <p className="mt-2 text-[13px] leading-6">{memory.long_term_design.summary}</p>
        </UxaSurface>
      </div>
    </div>
  );
}

function Knowledge({ memory }: { memory: MemoryRecommendationArtifact }) {
  const { language } = useLanguage();
  return (
    <div className="space-y-4">
      <UxaSurface className="p-[var(--uxa-panel-padding-lg)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)]">{byLanguage(language, { en: "RAG and grounding", es: "RAG y grounding", pt: "RAG e grounding" })}</p>
            <h4 className="mt-2 text-[20px] font-black">{memory.knowledge_design.mode}</h4>
          </div>
          <UxaBadge tone={memory.knowledge_design.rag_required ? "success" : "neutral"}>
            {memory.knowledge_design.rag_required
              ? byLanguage(language, { en: "RAG required", es: "RAG requerido", pt: "RAG requerido" })
              : byLanguage(language, { en: "RAG not required", es: "RAG no requerido", pt: "RAG nao requerido" })}
          </UxaBadge>
        </div>
        <p className="mt-3 text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">{memory.knowledge_design.summary}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <p className="rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] p-3 text-[12px]">{byLanguage(language, { en: "Parser", es: "Parser", pt: "Parser" })}: {memory.knowledge_design.ingestion_policy.parser}</p>
          <p className="rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] p-3 text-[12px]">Top K: {memory.knowledge_design.retrieval_policy.top_k}</p>
        </div>
      </UxaSurface>
      <div className="grid gap-3 xl:grid-cols-2">
        {memory.knowledge_design.approved_sources.map((source) => (
          <article className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-white p-4" key={source.key}>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)]">{source.source_type}</p>
            <h4 className="mt-1 text-[15px] font-black">{source.title}</h4>
            <p className="mt-2 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">{source.description}</p>
            <p className="mt-3 text-[12px] font-black">{byLanguage(language, { en: "Owner", es: "Owner", pt: "Responsavel" })}: {source.owner}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function MemoryDeliverable({
  blockerCount,
  memory,
}: {
  blockerCount: number;
  memory: MemoryRecommendationArtifact;
}) {
  const { language } = useLanguage();
  const confidence = Math.round(memory.confidence.overall * 100);
  const requiredDependencies = memory.tool_dependencies.filter((dependency) => dependency.required);

  return (
    <LeanGeneratedDeliverable
      badge={{
        label: byLanguage(language, { en: "Knowledge strategy", es: "Estrategia de conocimiento", pt: "Estrategia de conhecimento" }),
        tone: blockerCount ? "warning" : "success",
      }}
      metrics={[
        {
          helper: memory.memory_need_decision.mode,
          label: byLanguage(language, { en: "Memory need", es: "Necesidad de memoria", pt: "Necessidade de memoria" }),
          tone: memory.memory_need_decision.required ? "success" : "neutral",
          value: memory.memory_need_decision.required
            ? byLanguage(language, { en: "Required", es: "Requerida", pt: "Obrigatoria" })
            : byLanguage(language, { en: "Optional", es: "Opcional", pt: "Opcional" }),
        },
        {
          helper: memory.knowledge_design.source_scope,
          label: byLanguage(language, { en: "RAG", es: "RAG", pt: "RAG" }),
          tone: memory.knowledge_design.rag_required ? "success" : "neutral",
          value: memory.knowledge_design.rag_required
            ? byLanguage(language, { en: "Required", es: "Requerido", pt: "Obrigatorio" })
            : byLanguage(language, { en: "Not required", es: "No requerido", pt: "Nao obrigatorio" }),
        },
        {
          helper: memory.confidence.band,
          label: byLanguage(language, { en: "Confidence", es: "Confianza", pt: "Confianca" }),
          tone: confidence >= 70 ? "success" : "warning",
          value: `${confidence}%`,
        },
        {
          helper: byLanguage(language, { en: "Required tool dependencies.", es: "Dependencias de herramientas requeridas.", pt: "Dependencias de ferramentas obrigatorias." }),
          label: byLanguage(language, { en: "Dependencies", es: "Dependencias", pt: "Dependencias" }),
          tone: requiredDependencies.length ? "info" : "neutral",
          value: requiredDependencies.length,
        },
      ]}
      nextUse={byLanguage(language, {
        en: "Estimate and Blueprint visualization will use this strategy to explain context budget, source governance, RAG scope, and operational memory risk.",
        es: "Estimar y la visualizacion del Blueprint usaran esta estrategia para explicar presupuesto de contexto, gobierno de fuentes, alcance RAG y riesgo operativo de memoria.",
        pt: "Estimativa e visualizacao do Blueprint usarao esta estrategia para explicar orcamento de contexto, governanca de fontes, escopo RAG e risco operacional de memoria.",
      })}
      sections={[
        {
          items: [memory.short_term_design.summary, memory.working_memory_design.summary, memory.long_term_design.summary],
          title: byLanguage(language, { en: "Memory layers", es: "Capas de memoria", pt: "Camadas de memoria" }),
        },
        {
          items: [memory.knowledge_design.summary, ...memory.knowledge_design.notes],
          title: byLanguage(language, { en: "Knowledge and RAG", es: "Conocimiento y RAG", pt: "Conhecimento e RAG" }),
        },
        {
          items: [
            memory.dry_compile_status.summary,
            ...requiredDependencies.map((dependency) => `${dependency.tool_key}: ${dependency.reason}`),
          ],
          title: byLanguage(language, { en: "Operational readiness", es: "Preparacion operativa", pt: "Preparacao operacional" }),
        },
      ]}
      summary={memory.summary}
      title={byLanguage(language, { en: "Memory deliverable", es: "Entrega de Memoria", pt: "Entrega de Memoria" })}
    />
  );
}

function Budget({ memory }: { memory: MemoryRecommendationArtifact }) {
  const { language } = useLanguage();
  return (
    <div className="space-y-3">
      {memory.context_budget_plan.map((entry) => (
        <article className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-white p-4" key={`${entry.role}-${entry.task_kind}`}>
          <h4 className="text-[15px] font-black">{entry.role} · {entry.task_kind}</h4>
          <div className="mt-3 grid gap-2 text-[12px] md:grid-cols-3">
            <p className="rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] p-3">{byLanguage(language, { en: "Tokens", es: "Tokens", pt: "Tokens" })}: {entry.max_context_tokens}</p>
            <p className="rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] p-3">{byLanguage(language, { en: "Sources", es: "Fuentes", pt: "Fontes" })}: {entry.max_retrieved_sources}</p>
            <p className="rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] p-3">{byLanguage(language, { en: "Short-term", es: "Short term", pt: "Curto prazo" })}: {entry.max_short_term_items}</p>
          </div>
          <p className="mt-3 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">{entry.strategy}</p>
        </article>
      ))}
    </div>
  );
}

function Governance({ memory }: { memory: MemoryRecommendationArtifact }) {
  const { language } = useLanguage();
  return (
    <div className="space-y-4">
      <details className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-white p-4" open>
        <summary className="cursor-pointer text-[14px] font-black">{byLanguage(language, { en: "Write/read matrix", es: "Write/read matrix", pt: "Matriz de escrita/leitura" })}</summary>
        <div className="mt-3 space-y-2">
          {memory.write_read_matrix.map((rule) => (
            <p className="rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] p-3 text-[12px]" key={`${rule.scope}-${rule.owner}`}>
              <span className="font-black">{rule.scope}: </span>{rule.write_when} · {rule.read_when}
            </p>
          ))}
        </div>
      </details>
      <details className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-white p-4">
        <summary className="cursor-pointer text-[14px] font-black">{byLanguage(language, { en: "Retention and sensitivity", es: "Retencion y sensibilidad", pt: "Retencao e sensibilidade" })}</summary>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {memory.retention_and_deletion.map((rule) => (
            <p className="rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] p-3 text-[12px]" key={rule.scope}>{rule.scope}: {rule.retention_policy}</p>
          ))}
          {memory.sensitivity_and_isolation.map((rule) => (
            <p className="rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] p-3 text-[12px]" key={rule.scope}>{rule.scope}: {rule.isolation_mode}</p>
          ))}
        </div>
      </details>
    </div>
  );
}

function Dependencies({ memory }: { memory: MemoryRecommendationArtifact }) {
  const { language } = useLanguage();
  return (
    <div className="space-y-3">
      {memory.tool_dependencies.map((dependency) => (
        <article className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-white p-4" key={dependency.tool_key}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h4 className="text-[15px] font-black">{dependency.tool_key}</h4>
            <UxaBadge tone={dependency.status === "approved" ? "success" : dependency.required ? "danger" : "warning"}>{dependency.status}</UxaBadge>
          </div>
          <p className="mt-3 text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">{dependency.reason}</p>
          <p className="mt-2 text-[12px] font-black">{byLanguage(language, { en: "Capabilities", es: "Capacidades", pt: "Capacidades" })}: {dependency.capabilities.join(", ")}</p>
        </article>
      ))}
    </div>
  );
}


export function MemoryStageView({ actionState, activeRoute, actions }: MemoryStageViewProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const latestMemoryArtifact = activeRoute?.snapshot.data?.journey_latest_artifacts?.memory ?? null;
  const artifactSignature = `${latestMemoryArtifact?.id ?? "none"}:${latestMemoryArtifact?.updated_at ?? ""}`;
  const parsedMemory = useMemo(() => parseMemoryArtifact(latestMemoryArtifact), [latestMemoryArtifact]);
  const [draftState, setDraftState] = useState<{ memory: MemoryRecommendationArtifact | null; signature: string }>({
    memory: null,
    signature: "uninitialized",
  });
  const draftMemory = draftState.signature === artifactSignature ? draftState.memory : parsedMemory;
  const [instructions, setInstructions] = useState("");
  const [localAction, setLocalAction] = useState<LocalActionState>({ status: "idle" });
  const processing =
    isSubmitting(actionState, localAction) ||
    hasActiveServerOperation(activeRoute, "memory", ["recommend_memory"]);
  const viewModel = useMemo(
    () => buildMemoryViewModel(activeRoute, { draftMemory, processing }),
    [activeRoute, draftMemory, processing],
  );
  const message = actionState?.message ?? localAction.message;
  const statusCopy = getStatusCopy(language);
  const copy = (en: string, es: string, pt: string) => byLanguage(language, { en, es, pt });

  function setDraftMemory(next: MemoryRecommendationArtifact | null) {
    setDraftState({ memory: next, signature: artifactSignature });
  }

  async function runLocal(messageText: string, action: () => Promise<void>) {
    setLocalAction({ message: messageText, status: "submitting" });
    try {
      await action();
      setLocalAction({ message: copy("Memory synchronized.", "Memoria sincronizada.", "Memoria sincronizada."), status: "success" });
    } catch (error) {
      setLocalAction({
        message: error instanceof Error ? error.message : copy(
          "The Memory action could not be completed.",
          "No se pudo completar la accion de Memoria.",
          "Nao foi possivel completar a acao de Memoria.",
        ),
        status: "error",
      });
    }
  }

  async function handleGenerate() {
    if (!actions || processing) {
      return;
    }

    await runLocal(copy(
      "Generating memory strategy with the backend.",
      "Generando estrategia de memoria con backend.",
      "Gerando estrategia de memoria com o backend.",
    ), async () => {
      await actions.recommendMemory({ instructions: instructions.trim() || undefined });
    });
  }

  async function handleSaveReview() {
    if (!viewModel.latestMemoryArtifact || !viewModel.memory) {
      return;
    }

    await runLocal(copy("Saving Memory review.", "Guardando revision de Memoria.", "Salvando revisao de Memoria."), async () => {
      await actions?.patchStageArtifact("memory", viewModel.latestMemoryArtifact!.id, {
        note: "uxa9_memory_review",
        proposal_payload: payload(viewModel.memory!),
      });
    });
  }

  async function handleApprove() {
    if (!viewModel.latestMemoryArtifact || !viewModel.memory) {
      return;
    }

    await runLocal(copy(
      "Approving Memory and preparing Estimate.",
      "Aprobando Memoria y preparando Estimar.",
      "Aprovando Memoria e preparando Estimar.",
    ), async () => {
      await actions?.patchStageArtifact("memory", viewModel.latestMemoryArtifact!.id, {
        note: "uxa9_memory_pre_approval_review",
        proposal_payload: payload(viewModel.memory!),
      });
      await actions?.approveMemoryProfile({
        decision_payload: {
          source: "product_experience_v2",
        },
        note: "uxa9_memory_approved",
      });
      router.push(getProductExperienceStageHref(viewModel.sessionId, "estimate"));
    });
  }

  async function handleReject() {
    if (!viewModel.latestMemoryArtifact) {
      return;
    }

    await runLocal(copy("Rejecting Memory proposal.", "Rechazando propuesta de Memoria.", "Rejeitando proposta de Memoria."), async () => {
      await actions?.rejectStageArtifact("memory", viewModel.latestMemoryArtifact!.id, {
        note: "uxa9_memory_rejected",
      });
    });
  }

  if (viewModel.status === "loading") {
    return <LoadingState />;
  }

  const blockingCount = viewModel.blockers.filter((blocker) => blocker.severity === "blocking").length;
  const progress = viewModel.status === "approved" ? 100 : viewModel.status === "waiting_review" ? 78 : viewModel.status === "empty" ? 48 : viewModel.status === "blocked" ? 34 : 58;
  const primaryLabel =
    viewModel.status === "processing"
      ? byLanguage(language, { en: "Generating Memory...", es: "Generando Memoria...", pt: "Gerando Memoria..." })
      : viewModel.status === "approved"
        ? byLanguage(language, { en: "Continue to Estimate", es: "Continuar a Estimar", pt: "Continuar para Estimar" })
        : viewModel.memory
          ? byLanguage(language, { en: "Approve Memory", es: "Aprobar Memoria", pt: "Aprovar Memoria" })
          : viewModel.status === "blocked"
            ? byLanguage(language, { en: "Back to Tools", es: "Volver a Herramientas", pt: "Voltar para Ferramentas" })
            : byLanguage(language, { en: "Generate Memory", es: "Generar Memoria", pt: "Gerar Memoria" });
  const primaryDescription =
    viewModel.status === "approved"
      ? byLanguage(language, { en: "The memory strategy is approved and ready for value and cost estimation.", es: "La estrategia de memoria esta aprobada y lista para estimar valor/costo.", pt: "A estrategia de memoria esta aprovada e pronta para estimar valor e custo." })
      : viewModel.status === "blocked"
        ? byLanguage(language, { en: "Memory needs an approved tools digest to validate RAG, ingestion, and retrieval.", es: "Memoria necesita un digest aprobado de herramientas para validar RAG, ingesta y recuperacion.", pt: "Memoria precisa de um digest aprovado de ferramentas para validar RAG, ingestao e recuperacao." })
        : viewModel.memory
          ? byLanguage(language, { en: "Review strategy, knowledge, budget, governance, and dependencies before approving.", es: "Revisa estrategia, conocimiento, presupuesto, gobernanza y dependencias antes de aprobar.", pt: "Revise estrategia, conhecimento, orcamento, governanca e dependencias antes de aprovar." })
          : byLanguage(language, { en: "Ask the LLM to design short and long-term memory, RAG, sources, and context management.", es: "Pide al LLM disenar memoria corta/larga, RAG, fuentes y gestion de contexto.", pt: "Peca ao LLM para desenhar memoria curta/longa, RAG, fontes e gestao de contexto." });
  const contract: LeanStageScreenContract = {
    attentionItems: [
      ...viewModel.blockers.slice(0, 5).map((blocker) => ({
        description: blocker.detail,
        href: getProductExperienceProductHref(viewModel.sessionId, "attention"),
        label: blocker.severity === "blocking"
          ? copy("Blocker", "Bloqueo", "Bloqueio")
          : copy("Warning", "Advertencia", "Advertencia"),
        tone: blocker.severity === "blocking" ? ("danger" as const) : ("warning" as const),
        value: blocker.title,
      })),
      ...viewModel.warnings.slice(0, 2).map((warning) => ({
        description: copy(
          "Memory, staleness, or dependency warning.",
          "Advertencia de memoria, desactualizacion o dependencia.",
          "Advertencia de memoria, desatualizacao ou dependencia.",
        ),
        href: getProductExperienceProductHref(viewModel.sessionId, "attention"),
        label: copy("Warning", "Advertencia", "Advertencia"),
        tone: "warning" as const,
        value: warning,
      })),
    ],
    linkedResults: [
      {
        description: viewModel.memory
          ? copy(
              "Short/long-term strategy, RAG, budget, and governance.",
              "Estrategia corta/larga, RAG, presupuesto y gobernanza.",
              "Estrategia de curto/longo prazo, RAG, orcamento e governanca.",
            )
          : copy(
              "Enabled after generating Memory.",
              "Se habilita al generar Memoria.",
              "Sera habilitado ao gerar Memoria.",
            ),
        href: viewModel.memory ? getProductExperienceProductHref(viewModel.sessionId, "artifacts") : undefined,
        label: copy("Memory strategy", "Estrategia de memoria", "Estrategia de memoria"),
        locked: !viewModel.memory,
        type: "document",
      },
      {
        description: copy(
          "Memory, knowledge, RAG, and approved-source map.",
          "Mapa de memoria, conocimiento, RAG y fuentes aprobadas.",
          "Mapa de memoria, conhecimento, RAG e fontes aprovadas.",
        ),
        href: getProductExperienceProductHref(viewModel.sessionId, "diagrams"),
        label: copy("Memory-knowledge diagram", "Diagrama memoria-conocimiento", "Diagrama memoria-conhecimento"),
        locked: !viewModel.memory,
        type: "diagram",
      },
      {
        description: copy(
          "Tools-Memory dependencies, RAG, and ownership decisions.",
          "Dependencias Herramientas-Memoria, RAG y decisiones de ownership.",
          "Dependencias Ferramentas-Memoria, RAG e decisoes de ownership.",
        ),
        href: getProductExperienceProductHref(viewModel.sessionId, "attention"),
        label: copy("Decision log", "Registro de decisiones", "Registro de decisoes"),
        locked: !viewModel.latestMemoryArtifact,
        type: "decision",
      },
    ],
    metric: {
      helper: copy(
        `${blockingCount} blocker(s). Last update: ${viewModel.snapshotUpdatedAt ?? "no snapshot"}.`,
        `${blockingCount} bloqueo(s). Ultima actualizacion: ${viewModel.snapshotUpdatedAt ?? "sin snapshot"}.`,
        `${blockingCount} bloqueio(s). Ultima atualizacao: ${viewModel.snapshotUpdatedAt ?? "sem snapshot"}.`,
      ),
      label: byLanguage(language, { en: "Memory maturity", es: "Madurez de memoria", pt: "Maturidade da memoria" }),
      progress,
      value: `${progress}%`,
    },
    nextStep:
      viewModel.status === "approved"
        ? copy(
            "Estimate will quantify effort, cost, savings, and ROI with approved memory.",
            "Estimar cuantificara esfuerzo, costo, ahorro y ROI con memoria aprobada.",
            "Estimar quantificara esforco, custo, economia e ROI com memoria aprovada.",
          )
        : copy(
            "Once Memory is approved, the Blueprint is ready to estimate value and prepare validation/ACP according to entitlement.",
            "Al aprobar Memoria, el Blueprint queda listo para estimar valor y preparar validacion/ACP segun entitlement.",
            "Ao aprovar Memoria, o Blueprint fica pronto para estimar valor e preparar validacao/ACP conforme entitlement.",
          ),
    primaryAction: {
      description: primaryDescription,
      label: primaryLabel,
      tone: viewModel.status === "blocked" || blockingCount ? "danger" : viewModel.status === "approved" ? "success" : "info",
    },
    stage: {
      description: copy(
        "Define short and long-term memory, RAG, sources, context budget, retention, and read/write rules.",
        "Define memoria corta/larga, RAG, fuentes, presupuesto de contexto, retencion y reglas de lectura/escritura.",
        "Defina memoria de curto e longo prazo, RAG, fontes, orcamento de contexto, retencao e regras de leitura/escrita.",
      ),
      objective: copy(
        "Design the agent knowledge and context strategy without saturating the LLM context window.",
        "Disenar la estrategia de conocimiento y contexto del agente sin saturar la ventana LLM.",
        "Desenhar a estrategia de conhecimento e contexto do agente sem saturar a janela de contexto do LLM.",
      ),
      statusLabel: statusCopy[viewModel.status].label,
      statusTone: statusCopy[viewModel.status].tone,
      title: byLanguage(language, { en: "Memory: knowledge and context", es: "Memoria: conocimiento y contexto", pt: "Memoria: conhecimento e contexto" }),
    },
    tabs: [
      {
        badge: blockingCount,
        description: byLanguage(language, { en: "Strategy the user should review or unblock now.", es: "Estrategia que el usuario debe revisar o desbloquear ahora.", pt: "Estrategia que o usuario deve revisar ou desbloquear agora." }),
        key: "task",
        label: byLanguage(language, { en: "Current task", es: "Tarea actual", pt: "Tarefa atual" }),
        children: viewModel.status === "blocked" ? (
          <UxaSurface className="border-[var(--uxa-state-danger)] p-[var(--uxa-panel-padding-lg)]">
            <div className="flex items-start gap-4">
              <ShieldAlert aria-hidden="true" className="h-8 w-8 text-[var(--uxa-state-danger)]" />
              <div>
                <h3 className="text-[22px] font-black">{copy("Memory depends on approved Tools", "Memoria depende de Tools aprobado", "Memoria depende de Tools aprovado")}</h3>
                <p className="mt-2 text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">
                  {copy(
                    "Promote Tools so Memory can consume a canonical digest with capabilities and RAG.",
                    "Promueve Herramientas para que Memoria consuma un digest canonico con capacidades y RAG.",
                    "Promova Ferramentas para que Memoria consuma um digest canonico com capacidades e RAG.",
                  )}
                </p>
                <Link className="uxa-button uxa-button--primary mt-4" href={getProductExperienceStageHref(viewModel.sessionId, "tools")}>
                  {copy("Back to Tools", "Volver a Herramientas", "Voltar para Ferramentas")}
                </Link>
              </div>
            </div>
          </UxaSurface>
        ) : viewModel.memory ? (
          <div className="space-y-4">
            <Strategy memory={viewModel.memory} onChange={setDraftMemory} />
            <Blockers blockers={viewModel.blockers} sessionId={viewModel.sessionId} />
          </div>
        ) : (
          <div className="space-y-4">
            <EmptyMemory canGenerate={viewModel.canGenerate} />
            <UxaSurface className="p-[var(--uxa-panel-padding-lg)]">
              <UxaTextareaField
                hint={copy(
                  "Optional. Guides regeneration without replacing the approved digest.",
                  "Opcional. Orienta regeneracion sin reemplazar el digest aprobado.",
                  "Opcional. Orienta a regeneracao sem substituir o digest aprovado.",
                )}
                label={copy("Additional instructions for the LLM", "Instrucciones adicionales para el LLM", "Instrucoes adicionais para o LLM")}
                onChange={(event) => setInstructions(event.target.value)}
                rows={4}
                value={instructions}
              />
            </UxaSurface>
          </div>
        ),
      },
      {
        badge: viewModel.memory?.knowledge_design.approved_sources.length ?? 0,
        description: byLanguage(language, { en: "Executive deliverable for memory, knowledge, and context.", es: "Entregable ejecutivo de memoria, conocimiento y contexto.", pt: "Entregavel executivo de memoria, conhecimento e contexto." }),
        key: "result",
        label: byLanguage(language, { en: "Generated deliverable", es: "Entrega generada", pt: "Entrega gerada" }),
        children: viewModel.memory ? (
          <div className="space-y-4">
            <MemoryDeliverable blockerCount={blockingCount} memory={viewModel.memory} />
            <Knowledge memory={viewModel.memory} />
            <Budget memory={viewModel.memory} />
          </div>
        ) : (
          <EmptyMemory canGenerate={viewModel.canGenerate} />
        ),
      },
      {
        badge: viewModel.memory?.tool_dependencies.length ?? 0,
        description: byLanguage(language, { en: "Governance, dependencies, and digest used.", es: "Gobernanza, dependencias y digest usado.", pt: "Governanca, dependencias e digest usado." }),
        key: "evidence",
        label: byLanguage(language, { en: "Evidence and traceability", es: "Evidencia y trazabilidad", pt: "Evidencia e rastreabilidade" }),
        children: viewModel.memory ? (
          <div className="space-y-4">
            <Governance memory={viewModel.memory} />
            <Dependencies memory={viewModel.memory} />
            <UxaSurface className="p-4">
              <p className="text-[13px] font-black">{copy("Digest used", "Digest usado", "Digest usado")}</p>
              <p className="mt-2 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
                {viewModel.approvedDigest?.summary ?? copy("No approved digest visible.", "Sin digest aprobado visible.", "Nenhum digest aprovado visivel.")}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {viewModel.approvedDigest?.approved_tool_keys.map((toolKey) => <UxaBadge key={toolKey} tone="neutral">{toolKey}</UxaBadge>)}
              </div>
              {viewModel.warnings.map((warning, index) => (
                <p className="mt-2 rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] p-3 text-[12px]" key={`${warning}-${index}`}>{warning}</p>
              ))}
            </UxaSurface>
          </div>
        ) : (
          <UxaSurface className="p-[var(--uxa-panel-padding-lg)]" muted>
            <p className="text-[13px] font-black">
              {copy(
                "Evidence will appear once a memory strategy exists.",
                "La evidencia aparecera cuando exista estrategia de memoria.",
                "A evidencia aparecera quando existir estrategia de memoria.",
              )}
            </p>
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
            <UxaButton onClick={() => router.push(getProductExperienceStageHref(viewModel.sessionId, "estimate"))} variant="primary">
              {byLanguage(language, { en: "Continue to Estimate", es: "Continuar a Estimar", pt: "Continuar para Estimar" })} <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </UxaButton>
          ) : viewModel.memory ? (
            <UxaButton disabled={!viewModel.canApprove || processing} isLoading={processing && actionState?.action === "approve_memory_profile"} onClick={() => void handleApprove()} variant="primary">
              {byLanguage(language, { en: "Approve Memory", es: "Aprobar Memoria", pt: "Aprovar Memoria" })} <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </UxaButton>
          ) : viewModel.status === "blocked" ? (
            <UxaButton onClick={() => router.push(getProductExperienceStageHref(viewModel.sessionId, "tools"))} variant="primary">
              {byLanguage(language, { en: "Back to Tools", es: "Volver a Herramientas", pt: "Voltar para Ferramentas" })} <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </UxaButton>
          ) : (
            <UxaButton disabled={!viewModel.canGenerate || processing} isLoading={processing} onClick={() => void handleGenerate()} variant="primary">
              {viewModel.status === "processing"
                ? byLanguage(language, { en: "Generating Memory...", es: "Generando Memoria...", pt: "Gerando Memoria..." })
                : byLanguage(language, { en: "Generate Memory", es: "Generar Memoria", pt: "Gerar Memoria" })} <Sparkles aria-hidden="true" className="h-4 w-4" />
            </UxaButton>
          )}
          <UxaButton disabled={!viewModel.canGenerate || processing} onClick={() => void handleGenerate()} variant="secondary">
            <RefreshCw aria-hidden="true" className={cn("h-4 w-4", processing && "animate-spin")} /> {byLanguage(language, { en: "Regenerate", es: "Regenerar", pt: "Regenerar" })}
          </UxaButton>
          <UxaButton disabled={!viewModel.memory || processing} onClick={() => void handleSaveReview()} variant="secondary">
            {byLanguage(language, { en: "Save review", es: "Guardar revision", pt: "Salvar revisao" })}
          </UxaButton>
          <UxaButton disabled={!viewModel.latestMemoryArtifact || processing} onClick={() => void handleReject()} variant="ghost">
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
