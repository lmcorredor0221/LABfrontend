"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
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
  applySelectedAlternative,
  buildDesignViewModel,
  deriveCoverageForAlternative,
  parseDesignArtifact,
  parseDesignSection,
  type DesignSection,
  type DesignStageStatus,
} from "@/features/product-experience/design/design-model";
import { getProductExperienceProductHref, getProductExperienceStageHref } from "@/features/product-experience/shell/experience-model";
import type {
  ProductStageActions,
  ProductStageActionState,
} from "@/features/product-experience/shell/use-product-experience-route";
import type { DesignAlternative, DesignRecommendationArtifact } from "@/features/sessions/session-contracts";
import { useLanguage, type SupportedLanguage } from "@/core/i18n/language-context";
import { cn } from "@/lib/utils";

type DesignStageViewProps = {
  actionState?: ProductStageActionState;
  activeRoute: ProductExperienceRouteSnapshot | null;
  actions?: ProductStageActions;
};

type LocalActionState = {
  message?: string;
  status: "idle" | "submitting" | "success" | "error";
};

function getStatusCopy(language: SupportedLanguage): Record<DesignStageStatus, { description: string; label: string; tone: UxaTone }> {
  return {
    approved: {
      description: byLanguage(language, { en: "Design approved. Tools can infer the minimum capabilities from a consolidated architecture.", es: "Diseno aprobado. Herramientas puede inferir capacidades minimas desde una arquitectura consolidada.", pt: "Design aprovado. Ferramentas pode inferir as capacidades minimas a partir de uma arquitetura consolidada." }),
      label: byLanguage(language, { en: "Approved", es: "Aprobado", pt: "Aprovado" }),
      tone: "success",
    },
    blocked: {
      description: byLanguage(language, { en: "Approve Define first; architecture depends on consolidated requirements.", es: "Primero aprueba Definir; la arquitectura depende de requisitos consolidados.", pt: "Aprove Definir primeiro; a arquitetura depende de requisitos consolidados." }),
      label: byLanguage(language, { en: "Blocked", es: "Bloqueado", pt: "Bloqueado" }),
      tone: "danger",
    },
    empty: {
      description: byLanguage(language, { en: "Define is approved. Generate architecture alternatives to choose the best agentic pattern.", es: "Definir esta aprobado. Genera alternativas de arquitectura para seleccionar el mejor patron agentico.", pt: "Definir esta aprovado. Gere alternativas de arquitetura para selecionar o melhor padrao agentico." }),
      label: byLanguage(language, { en: "Ready to generate", es: "Listo para generar", pt: "Pronto para gerar" }),
      tone: "info",
    },
    error: {
      description: byLanguage(language, { en: "The real project information could not be loaded.", es: "No fue posible recuperar la informacion real del proyecto.", pt: "Nao foi possivel recuperar a informacao real do projeto." }),
      label: byLanguage(language, { en: "Error", es: "Error", pt: "Erro" }),
      tone: "danger",
    },
    loading: {
      description: byLanguage(language, { en: "Loading the project snapshot, attention, and operation state.", es: "Recuperando snapshot, atencion y operacion del proyecto.", pt: "Recuperando snapshot, atencao e operacao do projeto." }),
      label: byLanguage(language, { en: "Loading", es: "Cargando", pt: "Carregando" }),
      tone: "neutral",
    },
    processing: {
      description: byLanguage(language, { en: "The system is running a real backend action.", es: "El sistema esta ejecutando una accion real contra backend.", pt: "O sistema esta executando uma acao real no backend." }),
      label: byLanguage(language, { en: "Processing", es: "Procesando", pt: "Processando" }),
      tone: "warning",
    },
    stale: {
      description: byLanguage(language, { en: "Define or Design changed. Regenerate before moving to Tools.", es: "Definir o Disenar cambiaron. Regenera antes de promover a Herramientas.", pt: "Definir ou Design mudaram. Regenere antes de promover para Ferramentas." }),
      label: byLanguage(language, { en: "Outdated", es: "Desactualizado", pt: "Desatualizado" }),
      tone: "warning",
    },
    waiting_review: {
      description: byLanguage(language, { en: "Compare alternatives, confirm the recommended one, and approve the selected architecture.", es: "Compara alternativas, confirma la recomendada y aprueba la arquitectura seleccionada.", pt: "Compare alternativas, confirme a recomendada e aprove a arquitetura selecionada." }),
      label: byLanguage(language, { en: "In review", es: "En revision", pt: "Em revisao" }),
      tone: "warning",
    },
  };
}

function isSubmitting(actionState?: ProductStageActionState, localAction?: LocalActionState) {
  return actionState?.status === "submitting" || localAction?.status === "submitting";
}

function payload(design: DesignRecommendationArtifact): Record<string, unknown> {
  return design as unknown as Record<string, unknown>;
}

function DesignLoadingState() {
  const { language } = useLanguage();
  return (
    <UxaSurface className="p-[var(--uxa-panel-padding-lg)]">
      <div className="flex items-start gap-4">
        <span className="flex h-[var(--uxa-icon-tile)] w-[var(--uxa-icon-tile)] items-center justify-center rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-brand-soft)] text-[var(--uxa-color-brand)]">
          <Loader2 aria-hidden="true" className="h-6 w-6 animate-spin" />
        </span>
        <div>
          <UxaBadge tone="neutral">{byLanguage(language, { en: "Loading", es: "Cargando", pt: "Carregando" })}</UxaBadge>
          <h2 className="mt-3 text-[var(--uxa-font-size-screen-title)] font-black">{byLanguage(language, { en: "Preparing Design", es: "Preparando Disenar", pt: "Preparando Design" })}</h2>
          <p className="mt-2 text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">
            {byLanguage(language, { en: "We are loading alternatives, the fit matrix, and the Attention Segment before showing the decision.", es: "Estamos recuperando alternativas, matriz de fit y Segmento de Atencion antes de mostrar la decision.", pt: "Estamos recuperando alternativas, matriz de fit e o Segmento de Atencao antes de mostrar a decisao." })}
          </p>
        </div>
      </div>
    </UxaSurface>
  );
}

function DesignErrorState({ message }: { message: string }) {
  const { language } = useLanguage();
  return (
    <UxaSurface className="border-[var(--uxa-state-danger)] p-[var(--uxa-panel-padding-lg)]">
      <div className="flex items-start gap-4">
        <span className="flex h-[var(--uxa-icon-tile)] w-[var(--uxa-icon-tile)] items-center justify-center rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-state-danger-bg)] text-[var(--uxa-state-danger)]">
          <AlertCircle aria-hidden="true" className="h-6 w-6" />
        </span>
        <div>
          <UxaBadge tone="danger">{byLanguage(language, { en: "Error", es: "Error", pt: "Erro" })}</UxaBadge>
          <h2 className="mt-3 text-[var(--uxa-font-size-screen-title)] font-black">{byLanguage(language, { en: "Design could not be opened", es: "No se pudo abrir Disenar", pt: "Nao foi possivel abrir Design" })}</h2>
          <p className="mt-2 text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">{message}</p>
        </div>
      </div>
    </UxaSurface>
  );
}



function EmptyDesign({ canGenerate }: { canGenerate: boolean }) {
  const { language } = useLanguage();
  return (
    <UxaEmptyState
      description={canGenerate
        ? byLanguage(language, { en: "Define is already approved. Generate alternatives to choose architecture, agentic pattern, and behavior.", es: "Definir ya esta aprobado. Genera alternativas para seleccionar arquitectura, patron agentivo y comportamiento.", pt: "Definir ja esta aprovado. Gere alternativas para selecionar arquitetura, padrao agentico e comportamento." })
        : byLanguage(language, { en: "Approve Define before generating architecture and behavior.", es: "Aprueba Definir antes de generar arquitectura y comportamiento.", pt: "Aprove Definir antes de gerar arquitetura e comportamento." })}
      eyebrow={byLanguage(language, { en: "Design", es: "Disenar", pt: "Design" })}
      icon={<Sparkles aria-hidden="true" className="h-5 w-5" />}
      title={byLanguage(language, { en: "There is no Design for this session yet", es: "Todavia no existe Diseno para esta sesion", pt: "Ainda nao existe Design para esta sessao" })}
    />
  );
}

function AlternativeCard({
  alternative,
  recommended,
  selected,
  onSelect,
}: {
  alternative: DesignAlternative;
  recommended: boolean;
  selected: boolean;
  onSelect(key: string): void;
}) {
  const { language } = useLanguage();
  return (
    <article
      className={cn(
        "rounded-[var(--uxa-radius-xl)] border bg-white p-4 transition",
        selected ? "border-[var(--uxa-color-brand)] shadow-[var(--uxa-shadow-card)]" : "border-[var(--uxa-color-border)]",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)]">{alternative.alternative_key}</p>
          <h4 className="mt-1 text-[18px] font-black">{alternative.label}</h4>
        </div>
        <div className="flex flex-wrap gap-2">
          {recommended ? <UxaBadge tone="success">{byLanguage(language, { en: "Recommended", es: "Recomendada", pt: "Recomendada" })}</UxaBadge> : null}
          <UxaBadge tone={alternative.fit_score >= 85 ? "success" : alternative.fit_score >= 70 ? "warning" : "neutral"}>{alternative.fit_score}% fit</UxaBadge>
        </div>
      </div>
      <p className="mt-3 text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">{alternative.summary}</p>
      <div className="mt-4 grid gap-2 text-[12px] md:grid-cols-3">
        <p className="rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] p-3"><span className="font-black">{byLanguage(language, { en: "Cost", es: "Costo", pt: "Custo" })}:</span> {alternative.relative_cost}</p>
        <p className="rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] p-3"><span className="font-black">{byLanguage(language, { en: "Complexity", es: "Complejidad", pt: "Complexidade" })}:</span> {alternative.operational_complexity}</p>
        <p className="rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] p-3"><span className="font-black">{byLanguage(language, { en: "Pattern", es: "Patron", pt: "Padrao" })}:</span> {alternative.reasoning_pattern}</p>
      </div>
      <ul className="mt-4 space-y-1 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
        {alternative.fit_rationale.map((item) => <li key={item}>{item}</li>)}
      </ul>
      <UxaButton className="mt-4" onClick={() => onSelect(alternative.alternative_key)} variant={selected ? "primary" : "secondary"}>
        {selected
          ? byLanguage(language, { en: "Selected", es: "Seleccionada", pt: "Selecionada" })
          : byLanguage(language, { en: "Select alternative", es: "Seleccionar alternativa", pt: "Selecionar alternativa" })}
      </UxaButton>
    </article>
  );
}

function Alternatives({
  design,
  selectedKey,
  onSelect,
}: {
  design: DesignRecommendationArtifact;
  selectedKey: string | null;
  onSelect(key: string): void;
}) {
  return (
    <div className="space-y-3">
      {design.alternatives.map((alternative) => (
        <AlternativeCard
          alternative={alternative}
          key={alternative.alternative_key}
          onSelect={onSelect}
          recommended={alternative.alternative_key === design.recommended_alternative_key}
          selected={alternative.alternative_key === selectedKey}
        />
      ))}
    </div>
  );
}

function FitMatrix({ design }: { design: DesignRecommendationArtifact }) {
  const { language } = useLanguage();
  return (
    <div className="overflow-hidden rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-white">
      <table className="w-full min-w-[760px] text-left text-[12px]">
        <thead className="bg-[var(--uxa-color-muted-panel)] text-[11px] uppercase tracking-[0.12em] text-[var(--uxa-color-ink-muted)]">
          <tr>
            <th className="p-3">{byLanguage(language, { en: "Requirement", es: "Requisito", pt: "Requisito" })}</th>
            <th className="p-3">{byLanguage(language, { en: "Priority", es: "Prioridad", pt: "Prioridade" })}</th>
            {design.alternatives.map((alternative) => <th className="p-3" key={alternative.alternative_key}>{alternative.label}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--uxa-color-border)]">
          {design.fit_matrix.map((entry) => (
            <tr key={entry.requirement_key}>
              <td className="p-3 font-black">{entry.requirement_title}</td>
              <td className="p-3">{entry.priority}</td>
              {design.alternatives.map((alternative) => {
                const score = entry.scores.find((item) => item.alternative_key === alternative.alternative_key);
                return (
                  <td className="p-3" key={alternative.alternative_key}>
                    <span className="font-black">{score ? Math.round(score.score * 100) : 0}%</span>
                    <p className="mt-1 text-[var(--uxa-color-ink-soft)]">{score?.rationale ?? byLanguage(language, { en: "No score", es: "Sin score", pt: "Sem score" })}</p>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Coverage({
  design,
  selectedKey,
}: {
  design: DesignRecommendationArtifact;
  selectedKey: string;
}) {
  const coverage = deriveCoverageForAlternative(design, selectedKey);
  return (
    <div className="space-y-3">
      {coverage.map((entry) => (
        <article className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-white p-4" key={entry.requirement_key}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)]">{entry.requirement_key}</p>
              <h4 className="mt-1 text-[15px] font-black">{entry.requirement_title}</h4>
            </div>
            <UxaBadge tone={entry.coverage_status === "covered" ? "success" : entry.coverage_status === "partial" ? "warning" : "danger"}>
              {entry.coverage_status}
            </UxaBadge>
          </div>
          <p className="mt-3 text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">{entry.rationale}</p>
        </article>
      ))}
    </div>
  );
}

function Critique({ design, sessionId }: { design: DesignRecommendationArtifact; sessionId: string }) {
  const { language } = useLanguage();
  const empty = !design.critic_findings.length && !design.open_questions.length && !design.missing_information.length;
  return (
    <div className="space-y-3">
      {design.critic_findings.map((finding) => (
        <article className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-white p-4" key={finding.finding_key}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h4 className="text-[15px] font-black">{finding.title}</h4>
            <UxaBadge tone={finding.severity === "blocking" ? "danger" : finding.severity === "warning" ? "warning" : "neutral"}>{finding.severity}</UxaBadge>
          </div>
          <p className="mt-2 text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">{finding.detail}</p>
          <p className="mt-2 rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] p-3 text-[12px]">{finding.suggested_action}</p>
        </article>
      ))}
      {design.open_questions.map((question, index) => (
        <p className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-white p-4 text-[13px]" key={`${question}-${index}`}>
          {question}
        </p>
      ))}
      {design.missing_information.map((item, index) => (
        <p className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-state-warning)] bg-[var(--uxa-state-warning-bg)] p-4 text-[13px]" key={`${item}-${index}`}>
          {item}
        </p>
      ))}
      {empty ? (
        <UxaSurface className="p-[var(--uxa-panel-padding-lg)] text-center" muted>
          <CheckCircle2 aria-hidden="true" className="mx-auto h-6 w-6 text-[var(--uxa-state-success)]" />
          <p className="mt-2 text-[13px] font-black">{byLanguage(language, { en: "There are no blocking findings or open questions.", es: "Sin findings bloqueantes ni preguntas abiertas.", pt: "Nao ha achados bloqueantes nem perguntas abertas." })}</p>
        </UxaSurface>
      ) : (
        <Link className="uxa-button uxa-button--secondary" href={getProductExperienceProductHref(sessionId, "attention")}>
          {byLanguage(language, { en: "Manage in Attention", es: "Gestionar en Atencion", pt: "Gerenciar em Atencao" })}
        </Link>
      )}
    </div>
  );
}

function ArchitectureDetails({ alternative }: { alternative: DesignAlternative | null }) {
  const { language } = useLanguage();
  if (!alternative) {
    return (
      <UxaSurface className="p-[var(--uxa-panel-padding-lg)] text-center" muted>
        <p className="text-[13px] font-black">{byLanguage(language, { en: "Select an alternative to view architecture details.", es: "Selecciona una alternativa para ver detalles de arquitectura.", pt: "Selecione uma alternativa para ver detalhes da arquitetura." })}</p>
      </UxaSurface>
    );
  }

  return (
    <div className="space-y-3">
      <UxaSurface className="p-[var(--uxa-panel-padding-lg)]">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)]">{byLanguage(language, { en: "Selected architecture", es: "Arquitectura seleccionada", pt: "Arquitetura selecionada" })}</p>
        <h4 className="mt-2 text-[22px] font-black">{alternative.label}</h4>
        <p className="mt-3 text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">{alternative.architecture}</p>
      </UxaSurface>
      <details className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-white p-4" open>
        <summary className="cursor-pointer text-[14px] font-black">{byLanguage(language, { en: "Roles and limits", es: "Roles y limites", pt: "Papeis e limites" })}</summary>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {alternative.roles.map((role) => (
            <article className="rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] p-4" key={role.key}>
              <h5 className="font-black">{role.title}</h5>
              <p className="mt-2 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">{role.responsibility}</p>
              <p className="mt-2 text-[12px] font-black">{byLanguage(language, { en: "Limits", es: "Limites", pt: "Limites" })}: {role.limits.join(", ") || byLanguage(language, { en: "no limits declared", es: "sin limites declarados", pt: "sem limites declarados" })}</p>
            </article>
          ))}
        </div>
      </details>
      <details className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-white p-4">
        <summary className="cursor-pointer text-[14px] font-black">{byLanguage(language, { en: "Handoffs and escalation", es: "Handoffs y escalamiento", pt: "Handoffs e escalonamento" })}</summary>
        <div className="mt-3 space-y-3">
          {alternative.handoffs.map((handoff, index) => (
            <article className="rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] p-4" key={`${handoff.from_role}-${handoff.to_role}-${index}`}>
              <p className="font-black">{handoff.from_role}{" -> "}{handoff.to_role}</p>
              <p className="mt-2 text-[12px] leading-5">{handoff.trigger}</p>
              <p className="mt-1 text-[12px] text-[var(--uxa-color-ink-soft)]">{handoff.payload}</p>
            </article>
          ))}
        </div>
      </details>
      <details className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-white p-4">
        <summary className="cursor-pointer text-[14px] font-black">{byLanguage(language, { en: "Failure modes and guardrails", es: "Failure modes y guardrails", pt: "Failure modes e guardrails" })}</summary>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {alternative.failure_modes.map((failure) => (
            <article className="rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] p-4" key={failure.scenario}>
              <h5 className="font-black">{failure.scenario}</h5>
              <p className="mt-2 text-[12px] leading-5">{failure.retry_strategy}</p>
              <p className="mt-1 text-[12px] text-[var(--uxa-color-ink-soft)]">{failure.compensation_strategy}</p>
            </article>
          ))}
          {alternative.blueprint_projection.guardrails.map((guardrail) => (
            <p className="rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] p-4 text-[12px] font-black" key={guardrail}>{guardrail}</p>
          ))}
        </div>
      </details>
    </div>
  );
}

function DesignSectionContent({
  activeSection,
  design,
  onSelect,
  selectedAlternative,
  selectedKey,
  sessionId,
}: {
  activeSection: DesignSection;
  design: DesignRecommendationArtifact;
  onSelect(key: string): void;
  selectedAlternative: DesignAlternative | null;
  selectedKey: string | null;
  sessionId: string;
}) {
  if (activeSection === "alternatives") {
    return <Alternatives design={design} onSelect={onSelect} selectedKey={selectedKey} />;
  }

  if (activeSection === "fit") {
    return <FitMatrix design={design} />;
  }

  if (activeSection === "coverage") {
    return <Coverage design={design} selectedKey={selectedKey ?? design.recommended_alternative_key} />;
  }

  if (activeSection === "critique") {
    return <Critique design={design} sessionId={sessionId} />;
  }

  return <ArchitectureDetails alternative={selectedAlternative} />;
}

function ReadinessPanel({ items, openIssueCount, sessionId }: { items: ReturnType<typeof buildDesignViewModel>["readiness"]; openIssueCount: number; sessionId: string }) {
  const { language } = useLanguage();
  return (
    <UxaSurface className={cn("p-4", openIssueCount ? "border-[var(--uxa-state-danger)]" : "")}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] text-[var(--uxa-color-brand)]">
          {openIssueCount ? <ShieldAlert aria-hidden="true" className="h-5 w-5" /> : <CheckCircle2 aria-hidden="true" className="h-5 w-5" />}
        </span>
        <div>
          <p className="text-[13px] font-black">{byLanguage(language, { en: "Architecture readiness", es: "Readiness de arquitectura", pt: "Readiness de arquitetura" })}</p>
          <p className="mt-1 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
            {openIssueCount
              ? byLanguage(language, { en: "There are decisions or findings that must go through Attention.", es: "Hay decisiones o findings que deben pasar por Atencion.", pt: "Ha decisoes ou achados que devem passar por Atencao." })
              : byLanguage(language, { en: "The proposal is ready to approve.", es: "La propuesta esta lista para aprobar.", pt: "A proposta esta pronta para aprovar." })}
          </p>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {items.map((item) => (
          <p className="flex items-center justify-between gap-3 rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] p-3 text-[12px]" key={item.key}>
            <span>{item.label}</span>
            <UxaBadge tone={item.state === "done" ? "success" : item.state === "blocked" ? "danger" : "warning"}>{item.state}</UxaBadge>
          </p>
        ))}
      </div>
      <Link className="mt-4 inline-flex text-[12px] font-black text-[var(--uxa-color-brand)]" href={getProductExperienceProductHref(sessionId, "attention")}>
        {byLanguage(language, { en: "Open Attention Segment", es: "Abrir Segmento de Atencion", pt: "Abrir Segmento de Atencao" })} <ArrowRight aria-hidden="true" className="ml-1 h-4 w-4" />
      </Link>
    </UxaSurface>
  );
}

export function DesignStageView({ actionState, activeRoute, actions }: DesignStageViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const latestDesignArtifact = activeRoute?.snapshot.data?.journey_latest_artifacts?.design ?? null;
  const artifactSignature = `${latestDesignArtifact?.id ?? "none"}:${latestDesignArtifact?.updated_at ?? ""}`;
  const parsedDesign = useMemo(() => parseDesignArtifact(latestDesignArtifact), [latestDesignArtifact]);
  const defaultSelectedAlternativeKey = parsedDesign?.selected_design?.alternative_key ?? parsedDesign?.recommended_alternative_key ?? null;
  const [draftState, setDraftState] = useState<{
    design: DesignRecommendationArtifact | null;
    selectedAlternativeKey: string | null;
    signature: string;
  }>({ design: null, selectedAlternativeKey: null, signature: "uninitialized" });
  const draftDesign = draftState.signature === artifactSignature ? draftState.design : parsedDesign;
  const selectedAlternativeKey =
    draftState.signature === artifactSignature ? draftState.selectedAlternativeKey : defaultSelectedAlternativeKey;
  const [instructions, setInstructions] = useState("");
  const [localAction, setLocalAction] = useState<LocalActionState>({ status: "idle" });
  const selectedSection = parseDesignSection(searchParams.get("uxa_section"));
  const processing = isSubmitting(actionState, localAction);
  const viewModel = useMemo(
    () => buildDesignViewModel(activeRoute, { draftDesign, processing, selectedAlternativeKey }),
    [activeRoute, draftDesign, processing, selectedAlternativeKey],
  );
  const message = actionState?.message ?? localAction.message;
  const statusCopy = getStatusCopy(language);
  const copy = (en: string, es: string, pt: string) => byLanguage(language, { en, es, pt });

  function setDraftDesign(next: DesignRecommendationArtifact | null, nextSelectedKey = selectedAlternativeKey) {
    setDraftState({
      design: next,
      selectedAlternativeKey: nextSelectedKey,
      signature: artifactSignature,
    });
  }

  function setSelectedAlternativeKey(next: string | null) {
    setDraftState({
      design: draftDesign,
      selectedAlternativeKey: next,
      signature: artifactSignature,
    });
  }

  function updateSection(section: DesignSection) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("uxa_section", section);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  async function runLocal(messageText: string, action: () => Promise<void>) {
    setLocalAction({ message: messageText, status: "submitting" });
    try {
      await action();
      setLocalAction({ message: copy("Design synchronized.", "Disenar sincronizado.", "Design sincronizado."), status: "success" });
    } catch (error) {
      setLocalAction({
        message: error instanceof Error ? error.message : copy(
          "The Design action could not be completed.",
          "No se pudo completar la accion de Disenar.",
          "Nao foi possivel completar a acao de Design.",
        ),
        status: "error",
      });
      throw error;
    }
  }

  async function handleGenerate() {
    await runLocal(copy(
      "Generating architecture alternatives with the backend.",
      "Generando alternativas de arquitectura con backend.",
      "Gerando alternativas de arquitetura com o backend.",
    ), async () => {
      await actions?.proposeDesign({ instructions: instructions.trim() || undefined });
    });
  }

  function handleSelect(key: string) {
    setSelectedAlternativeKey(key);
    if (draftDesign) {
      setDraftDesign(applySelectedAlternative(draftDesign, key), key);
    }
  }

  async function handleSave() {
    if (!viewModel.latestDesignArtifact || !draftDesign) {
      return;
    }

    const nextDesign = selectedAlternativeKey ? applySelectedAlternative(draftDesign, selectedAlternativeKey) : draftDesign;
    await runLocal(copy("Saving Design decision.", "Guardando decision de Disenar.", "Salvando decisao de Design."), async () => {
      await actions?.patchStageArtifact("design", viewModel.latestDesignArtifact!.id, {
        note: "uxa8_design_review",
        proposal_payload: payload(nextDesign),
      });
    });
  }

  async function handleApprove() {
    if (!viewModel.latestDesignArtifact || !draftDesign || !selectedAlternativeKey) {
      return;
    }

    const nextDesign = applySelectedAlternative(draftDesign, selectedAlternativeKey);
    await runLocal(copy(
      "Approving Design and enabling Tools.",
      "Aprobando Disenar y habilitando Herramientas.",
      "Aprovando Design e habilitando Ferramentas.",
    ), async () => {
      await actions?.patchStageArtifact("design", viewModel.latestDesignArtifact!.id, {
        note: "uxa8_design_pre_approval_review",
        proposal_payload: payload(nextDesign),
      });
      await actions?.approveStageArtifact("design", viewModel.latestDesignArtifact!.id, {
        decision_payload: {
          selected_alternative_key: selectedAlternativeKey,
          source: "product_experience_v2",
        },
        note: "uxa8_design_approved",
      });
      router.push(getProductExperienceStageHref(viewModel.sessionId, "tools"));
    });
  }

  async function handleReject() {
    if (!viewModel.latestDesignArtifact) {
      return;
    }

    await runLocal(copy("Rejecting Design proposal.", "Rechazando propuesta de Disenar.", "Rejeitando proposta de Design."), async () => {
      await actions?.rejectStageArtifact("design", viewModel.latestDesignArtifact!.id, {
        note: "uxa8_design_rejected",
      });
    });
  }

  if (viewModel.status === "loading") {
    return <DesignLoadingState />;
  }

  if (viewModel.status === "error") {
    return <DesignErrorState message={activeRoute?.snapshot.error?.message ?? byLanguage(language, { en: "The snapshot could not be loaded.", es: "No se pudo cargar el snapshot.", pt: "Nao foi possivel carregar o snapshot." })} />;
  }

  const progress = viewModel.status === "approved" ? 100 : viewModel.status === "waiting_review" ? 76 : viewModel.status === "empty" ? 42 : viewModel.status === "blocked" ? 22 : 52;
  const primaryLabel =
    viewModel.status === "approved"
      ? byLanguage(language, { en: "Continue to Tools", es: "Continuar a Herramientas", pt: "Continuar para Ferramentas" })
      : viewModel.design
        ? byLanguage(language, { en: "Approve Design", es: "Aprobar Diseno", pt: "Aprovar Design" })
        : viewModel.status === "blocked"
          ? byLanguage(language, { en: "Back to Define", es: "Volver a Definir", pt: "Voltar para Definir" })
          : byLanguage(language, { en: "Generate Design", es: "Generar Diseno", pt: "Gerar Design" });
  const primaryDescription =
    viewModel.status === "approved"
      ? byLanguage(language, { en: "The architecture is approved and can drive the minimum tool selection.", es: "La arquitectura esta aprobada y puede alimentar la seleccion minima de herramientas.", pt: "A arquitetura esta aprovada e pode orientar a selecao minima de ferramentas." })
      : viewModel.status === "blocked"
        ? byLanguage(language, { en: "Design needs approved requirements before generating architecture alternatives.", es: "Disenar necesita requisitos aprobados antes de generar alternativas de arquitectura.", pt: "Design precisa de requisitos aprovados antes de gerar alternativas de arquitetura." })
        : viewModel.design
          ? byLanguage(language, { en: "Select or confirm the recommended alternative and review findings before approving.", es: "Selecciona o confirma la alternativa recomendada y revisa findings antes de aprobar.", pt: "Selecione ou confirme a alternativa recomendada e revise os findings antes de aprovar." })
          : byLanguage(language, { en: "Ask the LLM to propose architecture alternatives, patterns, and behavior.", es: "Pide al LLM que proponga alternativas de arquitectura, patrones y comportamiento.", pt: "Peça ao LLM que proponha alternativas de arquitetura, padroes e comportamento." });
  const contract: LeanStageScreenContract = {
    attentionItems: [
      ...(viewModel.design?.open_questions ?? []).slice(0, 3).map((question) => ({
        description: copy(
          "Decision required to close architecture or behavior.",
          "Decision requerida para cerrar arquitectura o comportamiento.",
          "Decisao necessaria para fechar arquitetura ou comportamento.",
        ),
        href: getProductExperienceProductHref(viewModel.sessionId, "attention"),
        label: copy("Question", "Pregunta", "Pergunta"),
        tone: "warning" as const,
        value: question,
      })),
      ...(viewModel.design?.critic_findings ?? []).slice(0, 3).map((finding) => ({
        description: finding.suggested_action,
        href: getProductExperienceProductHref(viewModel.sessionId, "attention"),
        label: finding.severity === "blocking"
          ? copy("Blocking finding", "Finding bloqueante", "Achado bloqueante")
          : copy("Finding", "Finding", "Achado"),
        tone: finding.severity === "blocking" ? ("danger" as const) : ("warning" as const),
        value: finding.title,
      })),
      ...(viewModel.design?.missing_information ?? []).slice(0, 2).map((item) => ({
        description: copy(
          "Information required by the LLM to raise design confidence.",
          "Informacion requerida por el LLM para elevar la confianza del diseno.",
          "Informacao exigida pelo LLM para elevar a confianca do design.",
        ),
        href: getProductExperienceProductHref(viewModel.sessionId, "attention"),
        label: copy("Missing input", "Dato faltante", "Dado faltante"),
        tone: "warning" as const,
        value: item,
      })),
      ...viewModel.warnings.slice(0, 2).map((warning) => ({
        description: copy(
          "Staleness or traceability warning.",
          "Advertencia de desactualizacion o trazabilidad.",
          "Advertencia de desatualizacao ou rastreabilidade.",
        ),
        href: getProductExperienceProductHref(viewModel.sessionId, "attention"),
        label: copy("Warning", "Advertencia", "Advertencia"),
        tone: "warning" as const,
        value: warning,
      })),
    ],
    linkedResults: [
      {
        description: viewModel.design
          ? copy(
              "Architecture, selected agentic pattern, and proposed behavior.",
              "Arquitectura, patron agentivo y conducta propuesta.",
              "Arquitetura, padrao agentico selecionado e comportamento proposto.",
            )
          : copy(
              "Enabled after generating Design.",
              "Se habilita al generar Disenar.",
              "Sera habilitado ao gerar Design.",
            ),
        href: viewModel.design ? getProductExperienceProductHref(viewModel.sessionId, "artifacts") : undefined,
        label: copy("Architecture specification", "Especificacion de arquitectura", "Especificacao de arquitetura"),
        locked: !viewModel.design,
        type: "document",
      },
      {
        description: copy(
          "Orchestration, handoffs, roles, decisions, and guardrails.",
          "Orquestacion, handoffs, roles, decisiones y guardrails.",
          "Orquestracao, handoffs, papeis, decisoes e guardrails.",
        ),
        href: getProductExperienceProductHref(viewModel.sessionId, "diagrams"),
        label: copy("Architecture diagram", "Diagrama de arquitectura", "Diagrama de arquitetura"),
        locked: !viewModel.design,
        type: "diagram",
      },
      {
        description: copy(
          "Selected alternative, rationale, and resolved findings.",
          "Alternativa seleccionada, justificacion y hallazgos resueltos.",
          "Alternativa selecionada, justificativa e achados resolvidos.",
        ),
        href: getProductExperienceProductHref(viewModel.sessionId, "attention"),
        label: copy("Decision log", "Registro de decisiones", "Registro de decisoes"),
        locked: !viewModel.latestDesignArtifact,
        type: "decision",
      },
    ],
    metric: {
      helper: copy(
        `${viewModel.design?.alternatives.length ?? 0} alternative(s), ${viewModel.openIssueCount} issue(s). Last update: ${viewModel.snapshotUpdatedAt ?? "no snapshot"}.`,
        `${viewModel.design?.alternatives.length ?? 0} alternativa(s), ${viewModel.openIssueCount} asunto(s). Ultima actualizacion: ${viewModel.snapshotUpdatedAt ?? "sin snapshot"}.`,
        `${viewModel.design?.alternatives.length ?? 0} alternativa(s), ${viewModel.openIssueCount} assunto(s). Ultima atualizacao: ${viewModel.snapshotUpdatedAt ?? "sem snapshot"}.`,
      ),
      label: byLanguage(language, { en: "Design maturity", es: "Madurez de diseno", pt: "Maturidade do design" }),
      progress,
      value: `${progress}%`,
    },
    nextStep:
      viewModel.status === "approved"
        ? copy(
            "Tools will infer the minimum set from this approved architecture.",
            "Herramientas inferira el set minimo con base en esta arquitectura aprobada.",
            "Ferramentas inferirao o conjunto minimo com base nesta arquitetura aprovada.",
          )
        : copy(
            "When you approve an alternative, the system can recommend external capabilities without overprovisioning.",
            "Cuando apruebes una alternativa, el sistema podra recomendar capacidades externas sin sobreaprovisionar.",
            "Quando voce aprovar uma alternativa, o sistema podera recomendar capacidades externas sem superprovisionar.",
          ),
    primaryAction: {
      description: primaryDescription,
      label: primaryLabel,
      tone: viewModel.status === "blocked" ? "danger" : viewModel.status === "approved" ? "success" : "info",
    },
    stage: {
      description: copy(
        "Evaluate agentic patterns, architecture, roles, handoffs, guardrails, and decision mechanisms.",
        "Evalua patrones agentivos, arquitectura, roles, handoffs, guardrails y mecanismos de decision.",
        "Avalie padroes agenticos, arquitetura, papeis, handoffs, guardrails e mecanismos de decisao.",
      ),
      objective: copy(
        "Build the agent architecture and behavior from approved upstream stages.",
        "Construir la arquitectura y comportamiento del agente con base en etapas aprobadas.",
        "Construir a arquitetura e o comportamento do agente com base nas etapas aprovadas.",
      ),
      statusLabel: statusCopy[viewModel.status].label,
      statusTone: statusCopy[viewModel.status].tone,
      title: byLanguage(language, { en: "Design: architecture and behavior", es: "Disenar: arquitectura y comportamiento", pt: "Design: arquitetura e comportamento" }),
    },
    tabs: [
      {
        badge: viewModel.design?.alternatives.length ?? 0,
        description: copy(
          "Architecture decision the user should review now.",
          "Decision de arquitectura que el usuario debe revisar ahora.",
          "Decisao de arquitetura que o usuario deve revisar agora.",
        ),
        key: "task",
        label: copy("Current task", "Tarea actual", "Tarefa atual"),
        children: viewModel.status === "blocked" ? (
          <UxaSurface className="border-[var(--uxa-state-danger)] p-[var(--uxa-panel-padding-lg)]">
            <div className="flex items-start gap-4">
              <ShieldAlert aria-hidden="true" className="h-8 w-8 text-[var(--uxa-state-danger)]" />
              <div>
                <h3 className="text-[22px] font-black">{copy("Design depends on approved Define", "Disenar depende de Definir aprobado", "Design depende de Definir aprovado")}</h3>
                <p className="mt-2 text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">
                  {copy(
                    "Go back to Define, review the requirements, and approve the artifact before generating architecture.",
                    "Vuelve a Definir, revisa requisitos y aprueba el artefacto antes de generar arquitectura.",
                    "Volte para Definir, revise os requisitos e aprove o artefato antes de gerar a arquitetura.",
                  )}
                </p>
                <Link className="uxa-button uxa-button--primary mt-4" href={getProductExperienceStageHref(viewModel.sessionId, "define")}>
                  {copy("Go to Define", "Ir a Definir", "Ir para Definir")}
                </Link>
              </div>
            </div>
          </UxaSurface>
        ) : viewModel.design ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {viewModel.sections.map((section) => (
                <UxaFilterChip
                  key={section.key}
                  onClick={() => updateSection(section.key)}
                  selected={selectedSection === section.key}
                >
                  {section.label} {section.count}
                </UxaFilterChip>
              ))}
            </div>
            <DesignSectionContent
              activeSection={selectedSection}
              design={viewModel.design!}
              onSelect={handleSelect}
              selectedAlternative={viewModel.selectedAlternative}
              selectedKey={selectedAlternativeKey}
              sessionId={viewModel.sessionId}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <EmptyDesign canGenerate={viewModel.canGenerate} />
            <UxaSurface className="p-[var(--uxa-panel-padding-lg)]">
              <UxaTextareaField
                hint={copy(
                  "Optional. Helps steer regenerations without replacing the approved context.",
                  "Opcional. Sirve para orientar regeneraciones sin reemplazar el contexto aprobado.",
                  "Opcional. Serve para orientar regeneracoes sem substituir o contexto aprovado.",
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
        badge: viewModel.selectedAlternative ? "1" : "0",
        description: copy(
          "Selected architecture and decision rationale.",
          "Arquitectura seleccionada y rationale de decision.",
          "Arquitetura selecionada e rationale da decisao.",
        ),
        key: "result",
        label: copy("Generated result", "Resultado generado", "Resultado gerado"),
        children: viewModel.design ? (
          <div className="space-y-4">
            <ArchitectureDetails alternative={viewModel.selectedAlternative} />
            <UxaSurface className="p-4">
              <p className="text-[13px] font-black">{copy("Recommended decision", "Decision recomendada", "Decisao recomendada")}</p>
              <p className="mt-2 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
                {viewModel.design!.decision_rationale}
              </p>
              <p className="mt-3 rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] p-3 text-[12px]">
                {copy("Confidence", "Confianza", "Confianca")} {Math.round(viewModel.design.confidence.overall * 100)}% - {viewModel.design.confidence.band}
              </p>
            </UxaSurface>
            <ReadinessPanel items={viewModel.readiness} openIssueCount={viewModel.openIssueCount} sessionId={viewModel.sessionId} />
          </div>
        ) : (
          <EmptyDesign canGenerate={viewModel.canGenerate} />
        ),
      },
      {
        badge: viewModel.openIssueCount,
        description: byLanguage(language, { en: "Fit, coverage, critique, warnings, and traceability.", es: "Ajuste, cobertura, critica, advertencias y trazabilidad.", pt: "Aderencia, cobertura, critica, alertas e rastreabilidade." }),
        key: "evidence",
        label: byLanguage(language, { en: "Evidence and traceability", es: "Evidencia y trazabilidad", pt: "Evidencia e rastreabilidade" }),
        children: viewModel.design ? (
          <div className="space-y-4">
            <FitMatrix design={viewModel.design} />
            <Coverage design={viewModel.design} selectedKey={selectedAlternativeKey ?? viewModel.design.recommended_alternative_key} />
            <Critique design={viewModel.design} sessionId={viewModel.sessionId} />
            {viewModel.warnings.length ? (
              <UxaSurface className="p-4">
                <p className="text-[13px] font-black">{copy("Warnings", "Advertencias", "Advertencias")}</p>
                {viewModel.warnings.map((warning, index) => (
                  <p className="mt-2 rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] p-3 text-[12px]" key={`${warning}-${index}`}>
                    {warning}
                  </p>
                ))}
              </UxaSurface>
            ) : null}
          </div>
        ) : (
          <UxaSurface className="p-[var(--uxa-panel-padding-lg)]" muted>
            <p className="text-[13px] font-black">{byLanguage(language, { en: "Evidence will appear when a design exists.", es: "La evidencia aparecera cuando exista diseno generado.", pt: "A evidencia aparecera quando existir um design gerado." })}</p>
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
            <UxaButton onClick={() => router.push(getProductExperienceStageHref(viewModel.sessionId, "tools"))} variant="primary">
              {byLanguage(language, { en: "Continue to Tools", es: "Continuar a Herramientas", pt: "Continuar para Ferramentas" })} <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </UxaButton>
          ) : viewModel.design ? (
            <UxaButton disabled={!viewModel.canApprove || processing} isLoading={processing && actionState?.action === "approve"} onClick={() => void handleApprove()} variant="primary">
              {byLanguage(language, { en: "Approve Design", es: "Aprobar Diseno", pt: "Aprovar Design" })} <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </UxaButton>
          ) : viewModel.status === "blocked" ? (
            <UxaButton onClick={() => router.push(getProductExperienceStageHref(viewModel.sessionId, "define"))} variant="primary">
              {byLanguage(language, { en: "Go to Define", es: "Ir a Definir", pt: "Ir para Definir" })} <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </UxaButton>
          ) : (
            <UxaButton disabled={!viewModel.canGenerate || processing} isLoading={processing} onClick={() => void handleGenerate()} variant="primary">
              {byLanguage(language, { en: "Generate Design", es: "Generar Diseno", pt: "Gerar Design" })} <Sparkles aria-hidden="true" className="h-4 w-4" />
            </UxaButton>
          )}
          <UxaButton disabled={!viewModel.canGenerate || processing} onClick={() => void handleGenerate()} variant="secondary">
            <RefreshCw aria-hidden="true" className="h-4 w-4" /> {byLanguage(language, { en: "Regenerate", es: "Regenerar", pt: "Regenerar" })}
          </UxaButton>
          <UxaButton disabled={!viewModel.design || processing} onClick={() => void handleSave()} variant="secondary">
            {byLanguage(language, { en: "Save decision", es: "Guardar decision", pt: "Salvar decisao" })}
          </UxaButton>
          <UxaButton disabled={!viewModel.latestDesignArtifact || processing} onClick={() => void handleReject()} variant="ghost">
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
