"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  CheckCircle2,
  FileJson2,
  HelpCircle,
  Loader2,
  PackageCheck,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  X,
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
  buildToolsViewModel,
  type ToolsStageStatus,
} from "@/features/product-experience/tools/tools-model";
import { getProductExperienceProductHref, getProductExperienceStageHref } from "@/features/product-experience/shell/experience-model";
import type {
  ProductStageActions,
  ProductStageActionState,
} from "@/features/product-experience/shell/use-product-experience-route";
import type { ToolRecommendationArtifact, ToolRecommendationEntry } from "@/features/sessions/session-contracts";
import { useLanguage, type SupportedLanguage } from "@/core/i18n/language-context";

type ToolsStageViewProps = {
  actionState?: ProductStageActionState;
  activeRoute: ProductExperienceRouteSnapshot | null;
  actions?: ProductStageActions;
};

type LocalActionState = {
  message?: string;
  status: "idle" | "submitting" | "success" | "error";
};

function getToolClassificationLabel(language: SupportedLanguage, value: string) {
  switch (value) {
    case "mandatory":
      return byLanguage(language, { en: "Mandatory", es: "Obligatoria", pt: "Obrigatoria" });
    case "optional":
      return byLanguage(language, { en: "Optional", es: "Opcional", pt: "Opcional" });
    case "rejected":
      return byLanguage(language, { en: "Rejected", es: "Rechazada", pt: "Rejeitada" });
    case "unnecessary":
      return byLanguage(language, { en: "Unnecessary", es: "Innecesaria", pt: "Desnecessaria" });
    default:
      return value;
  }
}

function getToolTypeLabel(language: SupportedLanguage, value?: string | null) {
  switch ((value ?? "").toLowerCase()) {
    case "internal":
      return byLanguage(language, { en: "Internal", es: "Interna", pt: "Interna" });
    case "external":
      return byLanguage(language, { en: "External", es: "Externa", pt: "Externa" });
    default:
      return byLanguage(language, { en: "Contract pending", es: "Contrato pendiente", pt: "Contrato pendente" });
  }
}

function getCoverageStatusLabel(language: SupportedLanguage, value: string) {
  switch (value) {
    case "covered":
      return byLanguage(language, { en: "Covered", es: "Cubierta", pt: "Coberta" });
    case "partial":
      return byLanguage(language, { en: "Partial", es: "Parcial", pt: "Parcial" });
    case "missing":
      return byLanguage(language, { en: "Missing", es: "Faltante", pt: "Ausente" });
    default:
      return value;
  }
}

function getDecisionSeverityLabel(language: SupportedLanguage, value: string) {
  switch (value) {
    case "blocking":
      return byLanguage(language, { en: "Blocking", es: "Bloqueante", pt: "Bloqueante" });
    case "warning":
      return byLanguage(language, { en: "Warning", es: "Advertencia", pt: "Advertencia" });
    case "info":
      return byLanguage(language, { en: "Info", es: "Info", pt: "Info" });
    default:
      return value;
  }
}

function getStatusCopy(language: SupportedLanguage): Record<ToolsStageStatus, { description: string; label: string; tone: UxaTone }> {
  return {
    approved: {
      description: byLanguage(language, { en: "Tools approved and canonical digest available for Memory.", es: "Herramientas aprobadas y digest canonico disponible para Memoria.", pt: "Ferramentas aprovadas e digest canonico disponivel para Memoria." }),
      label: byLanguage(language, { en: "Approved", es: "Aprobado", pt: "Aprovado" }),
      tone: "success",
    },
    blocked: {
      description: byLanguage(language, { en: "Approve Design first to infer tools from the consolidated architecture.", es: "Primero aprueba Disenar para inferir herramientas desde arquitectura consolidada.", pt: "Aprove Design primeiro para inferir ferramentas a partir da arquitetura consolidada." }),
      label: byLanguage(language, { en: "Blocked", es: "Bloqueado", pt: "Bloqueado" }),
      tone: "danger",
    },
    empty: {
      description: byLanguage(language, { en: "Design approved. Generate the minimum toolset with the LLM.", es: "Diseno aprobado. Genera el set minimo de herramientas con LLM.", pt: "Design aprovado. Gere o conjunto minimo de ferramentas com o LLM." }),
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
      description: byLanguage(language, { en: "Design or Tools changed. Regenerate before promoting the digest.", es: "Design o Tools cambiaron. Regenera antes de promover el digest.", pt: "Design ou Tools mudaram. Regenere antes de promover o digest." }),
      label: byLanguage(language, { en: "Outdated", es: "Desactualizado", pt: "Desatualizado" }),
      tone: "warning",
    },
    waiting_review: {
      description: byLanguage(language, { en: "Review coverage, decisions, optional tools, and contracts before promoting.", es: "Revisa coverage, decisiones, opcionales y contratos antes de promover.", pt: "Revise coverage, decisoes, opcionais e contratos antes de promover." }),
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
      ["queued", "running", "waiting_for_user"].includes(operation.status),
  );
}

function payload(recommendation: ToolRecommendationArtifact): Record<string, unknown> {
  return recommendation as unknown as Record<string, unknown>;
}

function listValue(values?: string[] | null) {
  return Array.isArray(values) ? values.filter(Boolean) : [];
}

function emptyCopy(language: SupportedLanguage) {
  return byLanguage(language, { en: "Not defined", es: "No definido", pt: "Nao definido" });
}

function yesNoCopy(language: SupportedLanguage, value?: boolean | null) {
  return value
    ? byLanguage(language, { en: "Yes", es: "Si", pt: "Sim" })
    : byLanguage(language, { en: "No", es: "No", pt: "Nao" });
}

function DetailField({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div className="rounded-[16px] border border-[var(--uxa-color-border)] bg-[var(--uxa-color-muted-panel)]/65 px-3 py-2.5">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[var(--uxa-color-ink-muted)]">{label}</p>
      <div className="mt-1.5 text-[12px] leading-5 text-[var(--uxa-color-ink)]">{children}</div>
    </div>
  );
}

function TokenList({
  emptyLabel,
  values,
}: {
  emptyLabel: string;
  values?: string[] | null;
}) {
  const items = listValue(values);
  if (!items.length) {
    return <span className="text-[var(--uxa-color-ink-soft)]">{emptyLabel}</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, index) => (
        <span
          className="rounded-full border border-[var(--uxa-color-border)] bg-white px-2 py-1 text-[10px] font-bold text-[var(--uxa-color-ink-soft)]"
          key={`${item}-${index}`}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function getToolContractName(tool: ToolRecommendationEntry) {
  return tool.contract_seed?.name ?? tool.tool_label;
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
          <h2 className="mt-3 text-[var(--uxa-font-size-screen-title)] font-black">{byLanguage(language, { en: "Preparing Tools", es: "Preparando Herramientas", pt: "Preparando Ferramentas" })}</h2>
          <p className="mt-2 text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">
            {byLanguage(language, { en: "Loading recommendation, digest, coverage, and pending decisions.", es: "Recuperando recomendacion, digest, coverage y decisiones pendientes.", pt: "Recuperando recomendacao, digest, coverage e decisoes pendentes." })}
          </p>
        </div>
      </div>
    </UxaSurface>
  );
}

function EmptyTools({ canGenerate }: { canGenerate: boolean }) {
  const { language } = useLanguage();
  return (
    <UxaEmptyState
      description={canGenerate
        ? byLanguage(language, { en: "Design is already approved. Generate the minimum set to close capabilities and contracts.", es: "Disenar ya esta aprobado. Genera el set minimo para cerrar capacidades y contratos.", pt: "Design ja esta aprovado. Gere o conjunto minimo para fechar capacidades e contratos." })
        : byLanguage(language, { en: "Approve Design before recommending tools.", es: "Aprueba Disenar antes de recomendar herramientas.", pt: "Aprove Design antes de recomendar ferramentas." })}
      eyebrow={byLanguage(language, { en: "Tools", es: "Herramientas", pt: "Ferramentas" })}
      icon={<Sparkles aria-hidden="true" className="h-5 w-5" />}
      title={byLanguage(language, { en: "There is no Tools recommendation yet", es: "Todavia no existe recomendacion de Herramientas", pt: "Ainda nao existe recomendacao de Ferramentas" })}
    />
  );
}

function getDecisionSourceLabel(language: SupportedLanguage, source: ReturnType<typeof buildToolsViewModel>["decisions"][number]["source"]) {
  switch (source) {
    case "gap":
      return byLanguage(language, { en: "Coverage gap", es: "Gap de cobertura", pt: "Gap de cobertura" });
    case "needs_information":
      return byLanguage(language, { en: "More context", es: "Mas contexto", pt: "Mais contexto" });
    case "finding":
      return byLanguage(language, { en: "Finding", es: "Hallazgo", pt: "Achado" });
    default:
      return source;
  }
}

function getDecisionModeLabel(language: SupportedLanguage, mode: ReturnType<typeof buildToolsViewModel>["decisions"][number]["mode"]) {
  switch (mode) {
    case "assumption":
      return byLanguage(language, { en: "Assumption kept", es: "Supuesto conservado", pt: "Suposicao mantida" });
    case "enrichment":
      return byLanguage(language, { en: "Deferred to [Enrich in Premium]", es: "Diferido a [Enriquecer en Premium]", pt: "Diferido para [Enriquecer no Premium]" });
    case "required":
      return byLanguage(language, { en: "Requires decision", es: "Requiere decision", pt: "Requer decisao" });
    case "blocker":
      return byLanguage(language, { en: "Blocks promotion", es: "Bloquea promocion", pt: "Bloqueia promocao" });
    default:
      return mode;
  }
}

function getDecisionModeTone(mode: ReturnType<typeof buildToolsViewModel>["decisions"][number]["mode"]): UxaTone {
  return mode === "blocker" ? "danger" : mode === "required" ? "warning" : mode === "enrichment" ? "info" : "success";
}

function Decisions({
  commercialTier,
  decisions,
  sessionId,
}: {
  commercialTier: ReturnType<typeof buildToolsViewModel>["commercialTier"];
  decisions: ReturnType<typeof buildToolsViewModel>["decisions"];
  sessionId: string;
}) {
  const { language } = useLanguage();
  const isBasicBlueprint = commercialTier === "blueprint";
  return (
    <div className="space-y-3">
      {decisions.length ? (
        <UxaSurface className="p-4" muted>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-brand)]">
                {isBasicBlueprint
                  ? byLanguage(language, { en: "Basic Blueprint behavior", es: "Comportamiento Blueprint Basico", pt: "Comportamento Blueprint Basico" })
                  : byLanguage(language, { en: "Actionable decisions", es: "Decisiones accionables", pt: "Decisoes acionaveis" })}
              </p>
              <h4 className="mt-1 text-[16px] font-black">
                {isBasicBlueprint
                  ? byLanguage(language, {
                      en: "Deferred to [Enrich in Premium]",
                      es: "Diferir a [Enriquecer en Premium]",
                      pt: "Diferir para [Enriquecer no Premium]",
                    })
                  : byLanguage(language, {
                      en: "Resolve before promoting when required",
                      es: "Resolver antes de promover cuando aplique",
                      pt: "Resolver antes de promover quando aplicavel",
                    })}
              </h4>
              <p className="mt-2 max-w-3xl text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
                {isBasicBlueprint
                  ? byLanguage(language, {
                      en: "In the Basic Blueprint, all technical assumptions and enrichment opportunities are deferred to [Enrich in Premium] (Blueprint Pro / ACP). The platform preserves traceable assumptions without blocking the basic product flow.",
                      es: "En el Blueprint Basico, todos los supuestos y oportunidades de enriquecimiento se difieren a [Enriquecer en Premium] (Blueprint Pro / ACP). La plataforma conserva estos supuestos trazables para no bloquear el avance del producto basico.",
                      pt: "No Blueprint Basico, todas as suposicoes e oportunidades de enriquecimento sao diferidas para [Enriquecer no Premium] (Blueprint Pro / ACP). A plataforma mantem estas suposicoes rastreaveis sem bloquear o fluxo basico.",
                    })
                  : byLanguage(language, {
                      en: "These items need a user decision or review because this product level enriches or prepares construction artifacts.",
                      es: "Estos items necesitan decision o revision del usuario porque este nivel de producto enriquece o prepara artefactos de construccion.",
                      pt: "Estes itens precisam de decisao ou revisao do usuario porque este nivel de produto enriquece ou prepara artefatos de construcao.",
                    })}
              </p>
            </div>
            <UxaBadge tone={isBasicBlueprint ? "info" : "warning"}>
              {isBasicBlueprint
                ? byLanguage(language, { en: "Deferred to Premium", es: "Diferido a Premium", pt: "Diferido para Premium" })
                : byLanguage(language, { en: "Review needed", es: "Requiere revision", pt: "Requer revisao" })}
            </UxaBadge>
          </div>
        </UxaSurface>
      ) : null}
      {decisions.map((item) => (
        <article className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-white p-4" key={item.key}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)]">
                {getDecisionSourceLabel(language, item.source)}
              </p>
              <h4 className="mt-1 text-[15px] font-black">{item.title}</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {item.occurrenceCount > 1 ? (
                <UxaBadge tone="info">
                  {byLanguage(language, {
                    en: `${item.occurrenceCount} consolidated signals`,
                    es: `${item.occurrenceCount} senales consolidadas`,
                    pt: `${item.occurrenceCount} sinais consolidados`,
                  })}
                </UxaBadge>
              ) : null}
              <UxaBadge tone={getDecisionModeTone(item.mode)}>{getDecisionModeLabel(language, item.mode)}</UxaBadge>
              <UxaBadge tone={item.severity === "blocking" ? "danger" : item.severity === "warning" ? "warning" : "info"}>
                {getDecisionSeverityLabel(language, item.severity)}
              </UxaBadge>
            </div>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <DetailField label={byLanguage(language, { en: "Why it matters", es: "Por que importa", pt: "Por que importa" })}>
              {item.detail || byLanguage(language, { en: "The item improves precision or traceability.", es: "El item mejora precision o trazabilidad.", pt: "O item melhora precisao ou rastreabilidade." })}
            </DetailField>
            <DetailField
              label={isBasicBlueprint
                ? byLanguage(language, { en: "Basic Blueprint behavior", es: "Comportamiento Basico", pt: "Comportamento Basico" })
                : byLanguage(language, { en: "Required closure", es: "Cierre requerido", pt: "Fechamento requerido" })}
            >
              {isBasicBlueprint
                ? byLanguage(language, {
                    en: "The system keeps a traceable assumption and defers enrichment to [Enrich in Premium] without blocking this product.",
                    es: "El sistema conserva un supuesto trazable y difiere el enriquecimiento a [Enriquecer en Premium] sin bloquear este producto.",
                    pt: "O sistema mantem uma suposicao rastreavel e difere o enriquecimento para [Enriquecer no Premium] sem bloquear este produto.",
                  })
                : byLanguage(language, {
                    en: "Review or resolve this item before using it as a construction-grade decision.",
                    es: "Revisa o resuelve este item antes de usarlo como decision de nivel construccion.",
                    pt: "Revise ou resolva este item antes de usa-lo como decisao de nivel construcao.",
                  })}
            </DetailField>
            <DetailField label={byLanguage(language, { en: "Suggested action", es: "Accion sugerida", pt: "Acao sugerida" })}>
              {item.action || byLanguage(language, { en: "Deferred to Premium.", es: "Diferido a Premium.", pt: "Diferido para Premium." })}
            </DetailField>
          </div>
          {item.sourceReferences.length > 1 ? (
            <p className="mt-3 text-[11px] leading-5 text-[var(--uxa-color-ink-muted)]">
              {byLanguage(language, {
                en: "Consolidated from",
                es: "Consolidado desde",
                pt: "Consolidado de",
              })}{" "}
              {item.sourceReferences.map((reference) => `${getDecisionSourceLabel(language, reference.source)}:${reference.key}`).join(" · ")}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {isBasicBlueprint ? (
              <>
                <span className="inline-flex min-h-9 items-center rounded-full bg-[var(--uxa-state-success-soft)] px-3 text-[12px] font-black text-[var(--uxa-state-success)]">
                  {byLanguage(language, { en: "Deferred to [Enrich in Premium]", es: "Diferido a [Enriquecer en Premium]", pt: "Diferido para [Enriquecer no Premium]" })}
                </span>
                <Link className="uxa-button uxa-button--primary uxa-button--sm" href={getProductExperienceProductHref(sessionId, "blueprint")}>
                  {byLanguage(language, { en: "Enrich in Premium", es: "Enriquecer en Premium", pt: "Enriquecer no Premium" })}
                </Link>
              </>
            ) : (
              <Link className="uxa-button uxa-button--secondary uxa-button--sm" href={getProductExperienceProductHref(sessionId, "attention")}>
                {byLanguage(language, { en: "Resolve in Attention", es: "Resolver en Atencion", pt: "Resolver em Atencao" })}
              </Link>
            )}
          </div>
        </article>
      ))}
      {!decisions.length ? (
        <UxaSurface className="p-[var(--uxa-panel-padding-lg)] text-center" muted>
          <CheckCircle2 aria-hidden="true" className="mx-auto h-6 w-6 text-[var(--uxa-state-success)]" />
          <p className="mt-2 text-[13px] font-black">
            {byLanguage(language, {
              en: "There are no pending gaps or findings.",
              es: "Sin gaps ni findings pendientes.",
              pt: "Nao ha gaps nem achados pendentes.",
            })}
          </p>
        </UxaSurface>
      ) : !isBasicBlueprint ? (
        <Link className="uxa-button uxa-button--secondary" href={getProductExperienceProductHref(sessionId, "attention")}>
          {byLanguage(language, {
            en: "Manage in Attention",
            es: "Gestionar en Atencion",
            pt: "Gerenciar em Atencao",
          })}
        </Link>
      ) : null}
    </div>
  );
}

function ToolCard({
  isSelected,
  optionalSelected,
  tool,
  onOpen,
  onToggleOptional,
}: {
  isSelected?: boolean;
  optionalSelected?: boolean;
  tool: ToolRecommendationEntry;
  onOpen(tool: ToolRecommendationEntry): void;
  onToggleOptional?(toolKey: string): void;
}) {
  const { language } = useLanguage();
  const tone: UxaTone = tool.classification === "mandatory" ? "success" : tool.classification === "optional" ? "warning" : "neutral";
  const detailButtonLabel = isSelected
    ? byLanguage(language, { en: "Detail open", es: "Detalle abierto", pt: "Detalhe aberto" })
    : byLanguage(language, { en: "View detail", es: "Ver detalle", pt: "Ver detalhe" });
  const optionalButtonLabel = optionalSelected
    ? byLanguage(language, { en: "Optional included", es: "Opcional incluido", pt: "Opcional incluido" })
    : byLanguage(language, { en: "Include optional", es: "Incluir opcional", pt: "Incluir opcional" });
  const empty = emptyCopy(language);

  return (
    <details
      className={[
        "group bg-white transition",
        isSelected ? "shadow-[inset_3px_0_0_var(--uxa-color-brand)]" : "hover:bg-[var(--uxa-color-muted-panel)]/40",
      ].join(" ")}
    >
      <summary className="grid cursor-pointer list-none gap-3 px-4 py-3 text-[12px] lg:grid-cols-[minmax(230px,1.7fr)_120px_115px_120px_120px_74px_92px] lg:items-center [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 lg:pr-2">
          <h4 className="truncate text-[14px] font-black text-[var(--uxa-color-ink)]">{tool.tool_label}</h4>
          <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--uxa-color-ink-muted)]">
            {tool.tool_key}
          </p>
        </div>
        <div>
          <UxaBadge tone={tone}>{getToolClassificationLabel(language, tool.classification)}</UxaBadge>
        </div>
        <span className="text-[12px] font-bold text-[var(--uxa-color-ink-soft)]">
          {getToolTypeLabel(language, tool.contract_seed?.tool_type)}
        </span>
        <div>
          <UxaBadge tone={tool.contract_seed?.has_side_effects ? "danger" : "success"}>
            {tool.contract_seed?.has_side_effects
              ? byLanguage(language, { en: "Side effect", es: "Efecto lateral", pt: "Efeito colateral" })
              : byLanguage(language, { en: "Read-only", es: "Solo lectura", pt: "Somente leitura" })}
          </UxaBadge>
        </div>
        <div>
          <UxaBadge tone={tool.contract_seed?.requires_approval ? "warning" : "neutral"}>
            {tool.contract_seed?.requires_approval
              ? byLanguage(language, { en: "Approval", es: "Aprobacion", pt: "Aprovacao" })
              : byLanguage(language, { en: "Autonomous", es: "Autonoma", pt: "Autonoma" })}
          </UxaBadge>
        </div>
        <span className="text-[13px] font-black text-[var(--uxa-color-ink)]">{Math.round(tool.confidence * 100)}%</span>
        <span className="inline-flex items-center justify-start gap-1 text-[12px] font-black text-[var(--uxa-color-brand)] lg:justify-end">
          {byLanguage(language, { en: "Open", es: "Abrir", pt: "Abrir" })}
          <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 transition group-open:rotate-90" />
        </span>
      </summary>
      <div className="border-t border-[var(--uxa-color-border)] bg-[var(--uxa-color-muted-panel)]/45 px-4 py-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_180px]">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)]">
              {byLanguage(language, { en: "Capability", es: "Capacidad", pt: "Capacidade" })}
            </p>
            <p className="mt-1 text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">{tool.capability_covered}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)]">
              {byLanguage(language, { en: "Why it was selected", es: "Por que se propone", pt: "Por que foi proposta" })}
            </p>
            <p className="mt-1 text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">{tool.decision_reason}</p>
          </div>
          <div className="flex flex-col gap-2 lg:items-end">
            {onToggleOptional ? (
              <UxaButton
                aria-label={`${optionalButtonLabel}: ${tool.tool_label}`}
                className="w-full justify-center lg:w-auto"
                onClick={() => onToggleOptional(tool.tool_key)}
                size="sm"
                variant={optionalSelected ? "primary" : "secondary"}
              >
                {optionalButtonLabel}
              </UxaButton>
            ) : null}
            <UxaButton
              aria-label={`${detailButtonLabel}: ${tool.tool_label}`}
              className="w-full justify-center lg:w-auto"
              onClick={() => onOpen(tool)}
              size="sm"
              variant={isSelected ? "primary" : "secondary"}
            >
              {detailButtonLabel}
            </UxaButton>
          </div>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <DetailField label={byLanguage(language, { en: "Purpose", es: "Proposito", pt: "Proposito" })}>
            {tool.contract_seed?.purpose ?? tool.capability_covered}
          </DetailField>
          <DetailField label={byLanguage(language, { en: "Dependencies", es: "Dependencias", pt: "Dependencias" })}>
            <TokenList emptyLabel={empty} values={tool.dependencies} />
          </DetailField>
          <DetailField label={byLanguage(language, { en: "Evidence", es: "Evidencia", pt: "Evidencia" })}>
            <TokenList emptyLabel={empty} values={tool.source_evidence} />
          </DetailField>
        </div>
      </div>
    </details>
  );
}

function ToolTable({
  emptyMessage,
  optionalKeys,
  selectedToolKey,
  title,
  tools,
  onOpenTool,
  onToggleOptional,
}: {
  emptyMessage: string;
  optionalKeys?: string[];
  selectedToolKey?: string | null;
  title: string;
  tools: ToolRecommendationEntry[];
  onOpenTool(tool: ToolRecommendationEntry): void;
  onToggleOptional?(toolKey: string): void;
}) {
  const { language } = useLanguage();
  return (
    <section className="overflow-hidden rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--uxa-color-border)] px-4 py-3">
        <h4 className="text-[14px] font-black">{title}</h4>
        <UxaBadge tone="neutral">{tools.length}</UxaBadge>
      </div>
      <div className="hidden grid-cols-[minmax(230px,1.7fr)_120px_115px_120px_120px_74px_92px] gap-3 bg-[var(--uxa-color-muted-panel)] px-4 py-2 text-[9px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)] lg:grid">
        <span>{byLanguage(language, { en: "Tool", es: "Herramienta", pt: "Ferramenta" })}</span>
        <span>{byLanguage(language, { en: "Class", es: "Clase", pt: "Classe" })}</span>
        <span>{byLanguage(language, { en: "Type", es: "Tipo", pt: "Tipo" })}</span>
        <span>{byLanguage(language, { en: "Mode", es: "Modo", pt: "Modo" })}</span>
        <span>{byLanguage(language, { en: "Control", es: "Control", pt: "Controle" })}</span>
        <span>{byLanguage(language, { en: "Fit", es: "Fit", pt: "Fit" })}</span>
        <span className="text-right">{byLanguage(language, { en: "Action", es: "Accion", pt: "Acao" })}</span>
      </div>
      <div className="divide-y divide-[var(--uxa-color-border)]">
        {tools.map((tool) => (
          <ToolCard
            isSelected={selectedToolKey === tool.tool_key}
            key={tool.tool_key}
            onOpen={onOpenTool}
            onToggleOptional={onToggleOptional}
            optionalSelected={optionalKeys?.includes(tool.tool_key)}
            tool={tool}
          />
        ))}
        {!tools.length ? <p className="px-4 py-5 text-[12px] text-[var(--uxa-color-ink-soft)]">{emptyMessage}</p> : null}
      </div>
    </section>
  );
}

function Catalog({
  optionalKeys,
  recommendation,
  selectedToolKey,
  onOpenTool,
  onToggleOptional,
}: {
  optionalKeys: string[];
  recommendation: ToolRecommendationArtifact;
  selectedToolKey?: string | null;
  onOpenTool(tool: ToolRecommendationEntry): void;
  onToggleOptional(toolKey: string): void;
}) {
  const { language } = useLanguage();
  return (
    <div className="space-y-5">
      <UxaSurface className="p-4" muted>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--uxa-color-brand)]">
              {byLanguage(language, { en: "Proposed toolset", es: "Herramientas propuestas", pt: "Ferramentas propostas" })}
            </p>
            <h3 className="mt-1 text-[20px] font-black">
              {byLanguage(language, {
                en: "Minimum capabilities to operate the agent",
                es: "Capacidades minimas para operar el agente",
                pt: "Capacidades minimas para operar o agente",
              })}
            </h3>
            <p className="mt-2 max-w-3xl text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">{recommendation.summary}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-[var(--uxa-radius-md)] bg-white px-3 py-2">
              <p className="text-[18px] font-black">{recommendation.recommended_tools.length}</p>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--uxa-color-ink-muted)]">
                {byLanguage(language, { en: "Mandatory", es: "Oblig.", pt: "Obrig." })}
              </p>
            </div>
            <div className="rounded-[var(--uxa-radius-md)] bg-white px-3 py-2">
              <p className="text-[18px] font-black">{recommendation.optional_tools.length}</p>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--uxa-color-ink-muted)]">
                {byLanguage(language, { en: "Optional", es: "Opc.", pt: "Opc." })}
              </p>
            </div>
            <div className="rounded-[var(--uxa-radius-md)] bg-white px-3 py-2">
              <p className="text-[18px] font-black">{recommendation.rejected_tools.length}</p>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--uxa-color-ink-muted)]">
                {byLanguage(language, { en: "Out", es: "Fuera", pt: "Fora" })}
              </p>
            </div>
          </div>
        </div>
      </UxaSurface>
      <ToolTable
        emptyMessage={byLanguage(language, {
          en: "No mandatory tools were recommended.",
          es: "No se recomendaron herramientas obligatorias.",
          pt: "Nenhuma ferramenta obrigatoria foi recomendada.",
        })}
        onOpenTool={onOpenTool}
        selectedToolKey={selectedToolKey}
        title={byLanguage(language, { en: "Mandatory", es: "Obligatorias", pt: "Obrigatorias" })}
        tools={recommendation.recommended_tools}
      />
      <ToolTable
        emptyMessage={byLanguage(language, {
          en: "No optional tools were needed for the minimum viable operation.",
          es: "No se detectaron herramientas opcionales necesarias para la operacion minima.",
          pt: "Nao foram detectadas ferramentas opcionais necessarias para a operacao minima.",
        })}
        onOpenTool={onOpenTool}
        onToggleOptional={onToggleOptional}
        optionalKeys={optionalKeys}
        selectedToolKey={selectedToolKey}
        title={byLanguage(language, { en: "Resolvable optional", es: "Opcionales resolubles", pt: "Opcionais resolviveis" })}
        tools={recommendation.optional_tools}
      />
      <details className="overflow-hidden rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-white">
        <summary className="cursor-pointer text-[14px] font-black">
          <span className="block px-4 py-3">
            {byLanguage(language, { en: "Unnecessary or rejected", es: "Innecesarias o rechazadas", pt: "Desnecessarias ou rejeitadas" })} ({recommendation.rejected_tools.length})
          </span>
        </summary>
        <ToolTable
          emptyMessage={byLanguage(language, {
            en: "No redundant or unnecessary tools were flagged.",
            es: "No se marcaron herramientas redundantes o innecesarias.",
            pt: "Nao foram marcadas ferramentas redundantes ou desnecessarias.",
          })}
          onOpenTool={onOpenTool}
          selectedToolKey={selectedToolKey}
          title={byLanguage(language, { en: "Out of scope", es: "Fuera de alcance", pt: "Fora de escopo" })}
          tools={recommendation.rejected_tools}
        />
      </details>
    </div>
  );
}

function ToolsDeliverable({
  decisionCount,
  recommendation,
}: {
  decisionCount: number;
  recommendation: ToolRecommendationArtifact;
}) {
  const { language } = useLanguage();
  const mandatory = recommendation.recommended_tools;
  const optional = recommendation.optional_tools;
  const rejected = recommendation.rejected_tools;
  const contractCount = [...mandatory, ...optional].filter((tool) => tool.contract_seed).length;
  const confidence = Math.round(recommendation.confidence.overall * 100);
  const coverageItems = recommendation.requirements_coverage.length + recommendation.design_role_coverage.length;

  return (
    <LeanGeneratedDeliverable
      badge={{
        label: byLanguage(language, { en: "Minimum toolset", es: "Set minimo definido", pt: "Conjunto minimo definido" }),
        tone: recommendation.evaluation.promotion_blocked ? "warning" : "success",
      }}
      metrics={[
        {
          helper: byLanguage(language, { en: "Strictly needed for operation.", es: "Estrictamente necesarias para operar.", pt: "Estritamente necessarias para operar." }),
          label: byLanguage(language, { en: "Mandatory", es: "Obligatorias", pt: "Obrigatorias" }),
          tone: "success",
          value: mandatory.length,
        },
        {
          helper: byLanguage(language, { en: "Kept available without overprovisioning.", es: "Disponibles sin sobreaprovisionar.", pt: "Disponiveis sem superprovisionar." }),
          label: byLanguage(language, { en: "Optional", es: "Opcionales", pt: "Opcionais" }),
          tone: optional.length ? "info" : "neutral",
          value: optional.length,
        },
        {
          helper: byLanguage(language, { en: "Request/response seeds visible in Evidence or detail drawer.", es: "Semillas request/response visibles en Evidencia o detalle.", pt: "Sementes request/response visiveis em Evidencia ou detalhe." }),
          label: byLanguage(language, { en: "Contracts", es: "Contratos", pt: "Contratos" }),
          tone: contractCount ? "success" : "warning",
          value: contractCount,
        },
        {
          helper: recommendation.confidence.band,
          label: byLanguage(language, { en: "Confidence", es: "Confianza", pt: "Confianca" }),
          tone: confidence >= 70 ? "success" : "warning",
          value: `${confidence}%`,
        },
      ]}
      nextUse={byLanguage(language, {
        en: "Memory will consume the approved digest to decide RAG, source ingestion, retrieval scopes, side effects, and context budget dependencies.",
        es: "Memoria consumira el digest aprobado para decidir RAG, ingesta de fuentes, scopes de recuperacion, efectos laterales y dependencias de presupuesto de contexto.",
        pt: "Memoria consumira o digest aprovado para decidir RAG, ingestao de fontes, escopos de recuperacao, efeitos laterais e dependencias de orcamento de contexto.",
      })}
      sections={[
        {
          items: mandatory.map((tool) => `${tool.tool_label}: ${tool.capability_covered}`),
          title: byLanguage(language, { en: "Approved minimum", es: "Minimo aprobado", pt: "Minimo aprovado" }),
        },
        {
          items: recommendation.evaluation.recommended_actions,
          title: byLanguage(language, { en: "Recommended actions", es: "Acciones recomendadas", pt: "Acoes recomendadas" }),
        },
        {
          items: [
            byLanguage(language, {
              en: `${coverageItems} requirements or roles covered.`,
              es: `${coverageItems} requisitos o roles cubiertos.`,
              pt: `${coverageItems} requisitos ou papeis cobertos.`,
            }),
            byLanguage(language, {
              en: `${decisionCount} assumptions, findings, or enrichment opportunities registered.`,
              es: `${decisionCount} supuestos, findings u oportunidades de enriquecimiento registradas.`,
              pt: `${decisionCount} suposicoes, findings ou oportunidades de enriquecimento registradas.`,
            }),
            ...rejected.slice(0, 3).map((tool) => `${tool.tool_label}: ${tool.decision_reason}`),
          ],
          title: byLanguage(language, { en: "Minimality evidence", es: "Evidencia de minimalidad", pt: "Evidencia de minimalidade" }),
        },
      ]}
      summary={recommendation.evaluation.summary || recommendation.summary}
      title={byLanguage(language, { en: "Tools deliverable", es: "Entrega de Herramientas", pt: "Entrega de Ferramentas" })}
    />
  );
}

function Coverage({ recommendation }: { recommendation: ToolRecommendationArtifact }) {
  const { language } = useLanguage();
  return (
    <div className="space-y-4">
      {[...recommendation.requirements_coverage, ...recommendation.design_role_coverage.map((role) => ({
        coverage_status: role.coverage_status,
        covered_by_tool_keys: role.covered_by_tool_keys,
        priority: "design-role",
        rationale: role.rationale,
        requirement_key: role.role_key,
        requirement_title: role.role_title,
        source_refs: role.source_refs,
      }))].map((entry) => (
        <article className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-white p-4" key={entry.requirement_key}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)]">{entry.requirement_key}</p>
              <h4 className="mt-1 text-[15px] font-black">{entry.requirement_title}</h4>
            </div>
            <UxaBadge tone={entry.coverage_status === "covered" ? "success" : entry.coverage_status === "partial" ? "warning" : "danger"}>{getCoverageStatusLabel(language, entry.coverage_status)}</UxaBadge>
          </div>
          <p className="mt-3 text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">{entry.rationale}</p>
          <p className="mt-2 text-[12px] font-black">
            {byLanguage(language, { en: "Tools", es: "Herramientas", pt: "Ferramentas" })}: {entry.covered_by_tool_keys.join(", ")
              || byLanguage(language, { en: "no coverage", es: "sin cobertura", pt: "sem cobertura" })}
          </p>
        </article>
      ))}
    </div>
  );
}

function Contracts({
  recommendation,
  onOpenTool,
}: {
  recommendation: ToolRecommendationArtifact;
  onOpenTool(tool: ToolRecommendationEntry): void;
}) {
  const { language } = useLanguage();
  const tools = [...recommendation.recommended_tools, ...recommendation.optional_tools].filter((tool) => tool.contract_seed);
  return (
    <div className="space-y-3">
      {tools.map((tool) => (
        <article className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-white p-4" key={tool.tool_key}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h4 className="text-[15px] font-black">{tool.contract_seed?.name ?? tool.tool_label}</h4>
              <p className="mt-2 text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">{tool.contract_seed?.purpose}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <UxaBadge tone={tool.contract_seed?.tool_type === "external" ? "info" : "neutral"}>
                {getToolTypeLabel(language, tool.contract_seed?.tool_type)}
              </UxaBadge>
              <UxaBadge tone={tool.contract_seed?.has_side_effects ? "danger" : "success"}>
                {tool.contract_seed?.has_side_effects
                  ? byLanguage(language, { en: "Side effect", es: "Efecto lateral", pt: "Efeito colateral" })
                  : byLanguage(language, { en: "read-only", es: "solo lectura", pt: "somente leitura" })}
              </UxaBadge>
            </div>
          </div>
          <UxaButton className="mt-4" onClick={() => onOpenTool(tool)} size="sm" variant="secondary">
            {byLanguage(language, { en: "Open resource panel", es: "Abrir panel del recurso", pt: "Abrir painel do recurso" })}
          </UxaButton>
        </article>
      ))}
    </div>
  );
}

function isRecordValue(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function hasSchemaValue(value?: Record<string, unknown> | null) {
  return isRecordValue(value) && Object.keys(value).length > 0;
}

function getSchemaProperties(schema?: Record<string, unknown> | null) {
  const properties = isRecordValue(schema?.properties) ? schema.properties : {};
  const required = Array.isArray(schema?.required) ? schema.required.filter((item): item is string => typeof item === "string") : [];
  return Object.entries(properties).map(([key, value]) => {
    const field = isRecordValue(value) ? value : {};
    return {
      description: typeof field.description === "string" ? field.description : "",
      key,
      required: required.includes(key),
      type: typeof field.type === "string" ? field.type : "object",
    };
  });
}

function JsonBlock({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  return (
    <div className="rounded-[16px] border border-[#18223d] bg-[#0d1428] p-3 text-white shadow-[0_12px_28px_rgba(7,17,38,0.12)]">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/60">{label}</p>
      <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words text-[11px] leading-5">
        {JSON.stringify(value ?? {}, null, 2)}
      </pre>
    </div>
  );
}

function SchemaPanel({
  empty,
  example,
  label,
  schema,
}: {
  empty: string;
  example?: unknown;
  label: string;
  schema?: Record<string, unknown> | null;
}) {
  const { language } = useLanguage();
  const fields = getSchemaProperties(schema);

  if (!hasSchemaValue(schema)) {
    return (
      <DetailField label={label}>
        <span className="text-[var(--uxa-color-ink-soft)]">
          {byLanguage(language, {
            en: "This tool does not expose a structured JSON schema yet.",
            es: "Esta herramienta todavia no expone un schema JSON estructurado.",
            pt: "Esta ferramenta ainda nao expoe um schema JSON estruturado.",
          })}
        </span>
      </DetailField>
    );
  }

  return (
    <div className="space-y-3">
      <JsonBlock label={`${label} JSON Schema`} value={schema} />
      {fields.length ? (
        <div className="overflow-hidden rounded-[16px] border border-[var(--uxa-color-border)] bg-white">
          <div className="grid grid-cols-[1fr_90px_90px_1.5fr] gap-2 bg-[var(--uxa-color-muted-panel)] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--uxa-color-ink-muted)]">
            <span>{byLanguage(language, { en: "Field", es: "Campo", pt: "Campo" })}</span>
            <span>{byLanguage(language, { en: "Type", es: "Tipo", pt: "Tipo" })}</span>
            <span>{byLanguage(language, { en: "Required", es: "Oblig.", pt: "Obrig." })}</span>
            <span>{byLanguage(language, { en: "Description", es: "Descripcion", pt: "Descricao" })}</span>
          </div>
          {fields.map((field) => (
            <div className="grid grid-cols-[1fr_90px_90px_1.5fr] gap-2 border-t border-[var(--uxa-color-border)] px-3 py-2 text-[11px]" key={field.key}>
              <span className="font-black">{field.key}</span>
              <span>{field.type}</span>
              <span>{field.required ? yesNoCopy(language, true) : yesNoCopy(language, false)}</span>
              <span className="text-[var(--uxa-color-ink-soft)]">{field.description || empty}</span>
            </div>
          ))}
        </div>
      ) : null}
      {example !== undefined ? <JsonBlock label={`${label} example`} value={example} /> : null}
    </div>
  );
}

function ResourceDrawer({ tool }: { tool: ToolRecommendationEntry | null }) {
  const { language } = useLanguage();
  if (!tool) {
    return (
      <UxaSurface className="p-4" muted>
        <FileJson2 aria-hidden="true" className="h-5 w-5 text-[var(--uxa-color-brand)]" />
        <p className="mt-3 text-[13px] font-black">
          {byLanguage(language, { en: "Resource panel", es: "Panel del recurso", pt: "Painel do recurso" })}
        </p>
        <p className="mt-2 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
          {byLanguage(language, {
            en: "Select a tool to review contract, permissions, risks, and binding.",
            es: "Selecciona una herramienta para revisar contrato, permisos, riesgos y vinculo tecnico.",
            pt: "Selecione uma ferramenta para revisar contrato, permissoes, riscos e vinculo tecnico.",
          })}
        </p>
      </UxaSurface>
    );
  }

  const contractSeed = tool.contract_seed;
  const empty = emptyCopy(language);
  const firstUsageExample = contractSeed?.usage_examples?.[0];
  return (
    <div className="space-y-4 text-[13px]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-brand)]">
            {byLanguage(language, { en: "Tool detail", es: "Detalle de herramienta", pt: "Detalhe da ferramenta" })}
          </p>
          <h4 className="mt-2 text-[18px] font-black">{getToolContractName(tool)}</h4>
          <p className="mt-1 text-[11px] font-black uppercase tracking-[0.14em] text-[var(--uxa-color-ink-muted)]">
            {tool.tool_key}
          </p>
        </div>
        <UxaBadge tone={tool.classification === "mandatory" ? "success" : tool.classification === "optional" ? "warning" : "neutral"}>
          {getToolClassificationLabel(language, tool.classification)}
        </UxaBadge>
      </div>

      <p className="rounded-[16px] border border-[var(--uxa-color-border)] bg-[var(--uxa-color-muted-panel)]/65 p-3 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
        {contractSeed?.purpose ?? tool.capability_covered}
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <DetailField label={byLanguage(language, { en: "Type", es: "Tipo", pt: "Tipo" })}>
          {getToolTypeLabel(language, contractSeed?.tool_type)}
        </DetailField>
        <DetailField label={byLanguage(language, { en: "Integration", es: "Integracion", pt: "Integracao" })}>
          {contractSeed?.integration_kind ?? empty}
        </DetailField>
        <DetailField label={byLanguage(language, { en: "Execution", es: "Ejecucion", pt: "Execucao" })}>
          {contractSeed?.execution_stage ?? contractSeed?.execution_mode ?? empty}
        </DetailField>
        <DetailField label={byLanguage(language, { en: "Risk", es: "Riesgo", pt: "Risco" })}>
          {contractSeed?.risk_level ?? empty}
        </DetailField>
        <DetailField label={byLanguage(language, { en: "Side effects", es: "Efectos laterales", pt: "Efeitos laterais" })}>
          {yesNoCopy(language, contractSeed?.has_side_effects)}
        </DetailField>
        <DetailField label={byLanguage(language, { en: "Approval", es: "Aprobacion", pt: "Aprovacao" })}>
          {yesNoCopy(language, contractSeed?.requires_approval)}
        </DetailField>
      </div>

      <div className="mt-3 grid gap-2">
        <DetailField label={byLanguage(language, { en: "Capability covered", es: "Capacidad cubierta", pt: "Capacidade coberta" })}>
          {tool.capability_covered}
        </DetailField>
        <DetailField label={byLanguage(language, { en: "Selection rationale", es: "Justificacion de seleccion", pt: "Justificativa de selecao" })}>
          {tool.decision_reason}
        </DetailField>
      </div>

      <details className="rounded-[18px] border border-[var(--uxa-color-border)] bg-white p-3 shadow-[0_12px_28px_rgba(7,17,38,0.04)]" open>
        <summary className="cursor-pointer text-[12px] font-black text-[var(--uxa-color-ink)]">
          {byLanguage(language, { en: "Inputs, outputs and contract", es: "Entradas, salidas y contrato", pt: "Entradas, saidas e contrato" })}
        </summary>
        <div className="mt-3 grid gap-2">
          <DetailField label={byLanguage(language, { en: "Inputs", es: "Entradas", pt: "Entradas" })}>
            <TokenList emptyLabel={empty} values={contractSeed?.inputs} />
          </DetailField>
          <DetailField label={byLanguage(language, { en: "Outputs", es: "Salidas", pt: "Saidas" })}>
            <TokenList emptyLabel={empty} values={contractSeed?.outputs} />
          </DetailField>
          <DetailField label={byLanguage(language, { en: "Endpoint or binding", es: "Endpoint o vinculo", pt: "Endpoint ou vinculo" })}>
            {contractSeed?.endpoint_reference ?? empty}
          </DetailField>
          <DetailField label={byLanguage(language, { en: "Auth reference", es: "Referencia de autenticacion", pt: "Referencia de autenticacao" })}>
            {contractSeed?.auth_reference ?? empty}
          </DetailField>
        </div>
      </details>

      <details className="rounded-[18px] border border-[var(--uxa-color-border)] bg-white p-3 shadow-[0_12px_28px_rgba(7,17,38,0.04)]" open>
        <summary className="cursor-pointer text-[12px] font-black text-[var(--uxa-color-ink)]">
          {byLanguage(language, { en: "JSON integration contracts", es: "Contratos JSON de integracion", pt: "Contratos JSON de integracao" })}
        </summary>
        <div className="mt-3 space-y-4">
          <SchemaPanel
            empty={empty}
            example={firstUsageExample?.request}
            label="Request"
            schema={contractSeed?.request_schema}
          />
          <SchemaPanel
            empty={empty}
            example={firstUsageExample?.response}
            label="Response"
            schema={contractSeed?.response_schema}
          />
        </div>
      </details>

      <details className="rounded-[18px] border border-[var(--uxa-color-border)] bg-white p-3 shadow-[0_12px_28px_rgba(7,17,38,0.04)]">
        <summary className="cursor-pointer text-[12px] font-black text-[var(--uxa-color-ink)]">
          {byLanguage(language, { en: "Governance and operation", es: "Gobierno y operacion", pt: "Governanca e operacao" })}
        </summary>
        <div className="mt-3 grid gap-2">
          <DetailField label={byLanguage(language, { en: "Owner", es: "Responsable", pt: "Responsavel" })}>
            {contractSeed?.owner ?? empty}
          </DetailField>
          <DetailField label={byLanguage(language, { en: "Approval reason", es: "Motivo de aprobacion", pt: "Motivo de aprovacao" })}>
            {contractSeed?.approval_reason ?? empty}
          </DetailField>
          <DetailField label={byLanguage(language, { en: "Failure mode", es: "Modo de falla", pt: "Modo de falha" })}>
            {contractSeed?.failure_mode ?? empty}
          </DetailField>
          <DetailField label={byLanguage(language, { en: "Retry", es: "Reintento", pt: "Retentativa" })}>
            {contractSeed?.retry_strategy ?? empty}
          </DetailField>
          <DetailField label={byLanguage(language, { en: "Compensation", es: "Compensacion", pt: "Compensacao" })}>
            {contractSeed?.compensation_strategy ?? empty}
          </DetailField>
          <DetailField label={byLanguage(language, { en: "Timeout", es: "Timeout", pt: "Timeout" })}>
            {contractSeed?.timeout_policy ?? empty}
          </DetailField>
        </div>
      </details>

      <details className="rounded-[18px] border border-[var(--uxa-color-border)] bg-white p-3 shadow-[0_12px_28px_rgba(7,17,38,0.04)]">
        <summary className="cursor-pointer text-[12px] font-black text-[var(--uxa-color-ink)]">
          {byLanguage(language, { en: "Permissions, evidence and relations", es: "Permisos, evidencia y relaciones", pt: "Permissoes, evidencia e relacoes" })}
        </summary>
        <div className="mt-3 grid gap-2">
          <DetailField label={byLanguage(language, { en: "Permissions", es: "Permisos", pt: "Permissoes" })}>
            <TokenList emptyLabel={empty} values={contractSeed?.permissions} />
          </DetailField>
          <DetailField label={byLanguage(language, { en: "Scopes", es: "Alcances", pt: "Escopos" })}>
            <TokenList emptyLabel={empty} values={contractSeed?.scopes} />
          </DetailField>
          <DetailField label={byLanguage(language, { en: "Sensitive data", es: "Datos sensibles", pt: "Dados sensiveis" })}>
            <TokenList emptyLabel={empty} values={contractSeed?.sensitive_data} />
          </DetailField>
          <DetailField label={byLanguage(language, { en: "Validations", es: "Validaciones", pt: "Validacoes" })}>
            <TokenList emptyLabel={empty} values={contractSeed?.validations} />
          </DetailField>
          <DetailField label={byLanguage(language, { en: "Typed errors", es: "Errores tipificados", pt: "Erros tipados" })}>
            <TokenList emptyLabel={empty} values={contractSeed?.typed_errors} />
          </DetailField>
          <DetailField label={byLanguage(language, { en: "Dependencies", es: "Dependencias", pt: "Dependencias" })}>
            <TokenList emptyLabel={empty} values={tool.dependencies} />
          </DetailField>
          <DetailField label={byLanguage(language, { en: "Incompatibilities", es: "Incompatibilidades", pt: "Incompatibilidades" })}>
            <TokenList emptyLabel={empty} values={tool.incompatibilities} />
          </DetailField>
          <DetailField label={byLanguage(language, { en: "Redundant with", es: "Redundante con", pt: "Redundante com" })}>
            <TokenList emptyLabel={empty} values={tool.redundant_with} />
          </DetailField>
          <DetailField label={byLanguage(language, { en: "Source evidence", es: "Evidencia fuente", pt: "Evidencia fonte" })}>
            <TokenList emptyLabel={empty} values={tool.source_evidence} />
          </DetailField>
        </div>
      </details>
    </div>
  );
}

function ToolDetailDrawer({
  isOpen,
  onClose,
  tool,
}: {
  isOpen: boolean;
  onClose(): void;
  tool: ToolRecommendationEntry | null;
}) {
  const { language } = useLanguage();
  if (!isOpen || !tool) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90]">
      <button
        aria-label={byLanguage(language, { en: "Close tool detail", es: "Cerrar detalle de herramienta", pt: "Fechar detalhe da ferramenta" })}
        className="absolute inset-0 h-full w-full cursor-default bg-[#071126]/35 backdrop-blur-[1px]"
        onClick={onClose}
        type="button"
      />
      <aside
        aria-label={byLanguage(language, { en: "Tool detail drawer", es: "Panel lateral de detalle de herramienta", pt: "Painel lateral de detalhe da ferramenta" })}
        aria-modal="true"
        className="absolute right-0 top-0 flex h-full w-full max-w-[720px] flex-col overflow-hidden border-l border-[var(--uxa-color-border)] bg-white shadow-[0_24px_90px_rgba(7,17,38,0.32)]"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--uxa-color-border)] bg-white px-5 py-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--uxa-color-brand)]">
              {byLanguage(language, { en: "Technical detail", es: "Detalle tecnico", pt: "Detalhe tecnico" })}
            </p>
            <h3 className="mt-1 text-[20px] font-black">{getToolContractName(tool)}</h3>
            <p className="mt-1 text-[12px] text-[var(--uxa-color-ink-soft)]">{tool.tool_key}</p>
          </div>
          <UxaButton aria-label={byLanguage(language, { en: "Close", es: "Cerrar", pt: "Fechar" })} onClick={onClose} size="sm" variant="ghost">
            <X aria-hidden="true" className="h-4 w-4" />
          </UxaButton>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--uxa-color-page)] p-5">
          <ResourceDrawer tool={tool} />
        </div>
      </aside>
    </div>
  );
}


export function ToolsStageView({ actionState, activeRoute, actions }: ToolsStageViewProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const latestToolsArtifact = activeRoute?.snapshot.data?.journey_latest_artifacts?.tools ?? null;
  const artifactSignature = `${latestToolsArtifact?.id ?? "none"}:${latestToolsArtifact?.updated_at ?? ""}`;
  const [localAction, setLocalAction] = useState<LocalActionState>({ status: "idle" });
  const [instructions, setInstructions] = useState("");
  const [selectionState, setSelectionState] = useState<{ optionalKeys: string[]; signature: string }>({
    optionalKeys: [],
    signature: "uninitialized",
  });
  const [selectedTool, setSelectedTool] = useState<ToolRecommendationEntry | null>(null);
  const [isToolDrawerOpen, setIsToolDrawerOpen] = useState(false);
  const processing =
    isSubmitting(actionState, localAction) ||
    hasActiveServerOperation(activeRoute, "tools", ["recommend_tools"]);
  const viewModel = useMemo(() => buildToolsViewModel(activeRoute, { processing }), [activeRoute, processing]);
  const activeSelectedTool = viewModel.recommendation ? selectedTool : null;
  const isActiveToolDrawerOpen = Boolean(viewModel.recommendation && isToolDrawerOpen && activeSelectedTool);
  const optionalKeys =
    selectionState.signature === artifactSignature
      ? selectionState.optionalKeys
      : (viewModel.approvedDigest?.optional_tool_keys ?? []);
  const message = actionState?.message ?? localAction.message;
  const statusCopy = getStatusCopy(language);
  const copy = (en: string, es: string, pt: string) => byLanguage(language, { en, es, pt });

  useEffect(() => {
    if (!isActiveToolDrawerOpen) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsToolDrawerOpen(false);
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isActiveToolDrawerOpen]);

  function openToolDetail(tool: ToolRecommendationEntry) {
    setSelectedTool(tool);
    setIsToolDrawerOpen(true);
  }

  async function runLocal(messageText: string, action: () => Promise<void>) {
    setLocalAction({ message: messageText, status: "submitting" });
    try {
      await action();
      setLocalAction({ message: copy("Tools synchronized.", "Herramientas sincronizadas.", "Ferramentas sincronizadas."), status: "success" });
    } catch (error) {
      setLocalAction({
        message: error instanceof Error ? error.message : copy(
          "The Tools action could not be completed.",
          "No se pudo completar la accion de Herramientas.",
          "Nao foi possivel completar a acao de Ferramentas.",
        ),
        status: "error",
      });
    }
  }

  function toggleOptional(toolKey: string) {
    const next = optionalKeys.includes(toolKey) ? optionalKeys.filter((item) => item !== toolKey) : [...optionalKeys, toolKey];
    setSelectionState({ optionalKeys: next, signature: artifactSignature });
  }

  async function handleGenerate() {
    if (!actions || processing) {
      return;
    }

    await runLocal(copy(
      "Generating minimal tools with the backend.",
      "Generando herramientas minimas con backend.",
      "Gerando ferramentas minimas com o backend.",
    ), async () => {
      await actions.recommendTools({ instructions: instructions.trim() || undefined });
    });
  }

  async function handleSaveReview() {
    if (!viewModel.latestToolsArtifact || !viewModel.recommendation) {
      return;
    }

    await runLocal(copy("Saving Tools review.", "Guardando revision de Herramientas.", "Salvando revisao de Ferramentas."), async () => {
      await actions?.patchStageArtifact("tools", viewModel.latestToolsArtifact!.id, {
        note: "uxa9_tools_review",
        proposal_payload: payload(viewModel.recommendation!),
      });
    });
  }

  async function handlePromote() {
    await runLocal(copy(
      "Promoting canonical Tools digest.",
      "Promoviendo digest canonico de Herramientas.",
      "Promovendo digest canonico de Ferramentas.",
    ), async () => {
      await actions?.approveToolsSelection({ include_optional_tool_keys: optionalKeys });
      router.push(getProductExperienceStageHref(viewModel.sessionId, "memory"));
    });
  }

  async function handleReject() {
    if (!viewModel.latestToolsArtifact) {
      return;
    }

    await runLocal(copy("Rejecting Tools proposal.", "Rechazando propuesta de Herramientas.", "Rejeitando proposta de Ferramentas."), async () => {
      await actions?.rejectStageArtifact("tools", viewModel.latestToolsArtifact!.id, {
        note: "uxa9_tools_rejected",
      });
    });
  }

  if (viewModel.status === "loading") {
    return <LoadingState />;
  }

  const toolCount = viewModel.recommendedTools.length + viewModel.optionalTools.length + viewModel.rejectedTools.length;
  const progress = viewModel.status === "approved" ? 100 : viewModel.status === "waiting_review" ? 74 : viewModel.status === "empty" ? 46 : viewModel.status === "blocked" ? 28 : 56;
  const primaryLabel =
    viewModel.status === "approved"
      ? byLanguage(language, { en: "Continue to Memory", es: "Continuar a Memoria", pt: "Continuar para Memoria" })
      : viewModel.recommendation
        ? byLanguage(language, { en: "Promote tools", es: "Promover herramientas", pt: "Promover ferramentas" })
        : viewModel.status === "blocked"
          ? byLanguage(language, { en: "Back to Design", es: "Volver a Disenar", pt: "Voltar para Design" })
          : byLanguage(language, { en: "Generate tools", es: "Generar herramientas", pt: "Gerar ferramentas" });
  const primaryDescription =
    viewModel.status === "approved"
      ? byLanguage(language, { en: "The canonical digest is already approved and Memory can consume it.", es: "El digest canonico ya esta aprobado y Memoria puede consumirlo.", pt: "O digest canonico ja esta aprovado e Memoria pode consumi-lo." })
      : viewModel.status === "blocked"
        ? byLanguage(language, { en: "Tools needs an approved architecture to avoid generic recommendations.", es: "Herramientas necesita una arquitectura aprobada para evitar recomendaciones genericas.", pt: "Ferramentas precisa de uma arquitetura aprovada para evitar recomendacoes genericas." })
        : viewModel.recommendation
          ? byLanguage(language, { en: "Review the minimum set, decide optional tools, and promote only the strictly necessary capabilities.", es: "Revisa el set minimo, decide opcionales y promueve solo las capacidades estrictamente necesarias.", pt: "Revise o conjunto minimo, decida opcionais e promova apenas as capacidades estritamente necessarias." })
          : byLanguage(language, { en: "Ask the LLM to recommend mandatory, optional, and unnecessary tools from the approved design.", es: "Pide al LLM recomendar herramientas obligatorias, opcionales e innecesarias desde el diseno aprobado.", pt: "Peca ao LLM para recomendar ferramentas obrigatorias, opcionais e desnecessarias a partir do design aprovado." });
  const contract: LeanStageScreenContract = {
    attentionItems: [
      ...viewModel.decisions.slice(0, 5).map((decision) => ({
        description: decision.detail,
        href: getProductExperienceProductHref(viewModel.sessionId, "attention"),
        label: decision.severity === "blocking"
          ? copy("Blocking decision", "Decision bloqueante", "Decisao bloqueante")
          : copy("Decision", "Decision", "Decisao"),
        tone: decision.severity === "blocking" ? ("danger" as const) : decision.severity === "warning" ? ("warning" as const) : ("info" as const),
        value: decision.title,
      })),
      ...viewModel.warnings.slice(0, 2).map((warning) => ({
        description: copy(
          "Recommendation, staleness, or coverage warning.",
          "Advertencia de recomendacion, desactualizacion o cobertura.",
          "Advertencia de recomendacao, desatualizacao ou cobertura.",
        ),
        href: getProductExperienceProductHref(viewModel.sessionId, "attention"),
        label: copy("Warning", "Advertencia", "Advertencia"),
        tone: "warning" as const,
        value: warning,
      })),
    ],
    linkedResults: [
      {
        description: viewModel.recommendation
          ? copy(
              "Minimum toolset, contracts, and coverage.",
              "Toolset minimo, contratos y cobertura.",
              "Conjunto minimo, contratos e cobertura.",
            )
          : copy("Enabled after generating Tools.", "Se habilita al generar Herramientas.", "Sera habilitado ao gerar Ferramentas."),
        href: viewModel.recommendation ? getProductExperienceProductHref(viewModel.sessionId, "artifacts") : undefined,
        label: copy("Tools digest", "Digest de herramientas", "Digest de ferramentas"),
        locked: !viewModel.recommendation,
        type: "document",
      },
      {
        description: copy(
          "Map of tools, contracts, side effects, and dependencies.",
          "Mapa de herramientas, contratos, efectos laterales y dependencias.",
          "Mapa de ferramentas, contratos, efeitos colaterais e dependencias.",
        ),
        href: getProductExperienceProductHref(viewModel.sessionId, "diagrams"),
        label: copy("Tools-contracts diagram", "Diagrama herramientas-contratos", "Diagrama ferramentas-contratos"),
        locked: !viewModel.recommendation,
        type: "diagram",
      },
      {
        description: copy(
          "Inclusion, rejection, and replacement decisions.",
          "Decisiones de inclusion, rechazo y reemplazo.",
          "Decisoes de inclusao, rejeicao e substituicao.",
        ),
        href: getProductExperienceProductHref(viewModel.sessionId, "attention"),
        label: copy("Decision log", "Registro de decisiones", "Registro de decisoes"),
        locked: !viewModel.latestToolsArtifact,
        type: "decision",
      },
    ],
    metric: {
      helper: copy(
        `${viewModel.recommendedTools.length} mandatory, ${viewModel.optionalTools.length} optional, ${viewModel.rejectedTools.length} unnecessary.`,
        `${viewModel.recommendedTools.length} obligatoria(s), ${viewModel.optionalTools.length} opcional(es), ${viewModel.rejectedTools.length} innecesaria(s).`,
        `${viewModel.recommendedTools.length} obrigatoria(s), ${viewModel.optionalTools.length} opcional(is), ${viewModel.rejectedTools.length} desnecessaria(s).`,
      ),
      label: byLanguage(language, { en: "Tools digest", es: "Digest de herramientas", pt: "Digest de ferramentas" }),
      progress,
      value: `${progress}%`,
    },
    nextStep:
      viewModel.status === "approved"
        ? copy(
            "Memory will use this digest to define RAG, knowledge, and retrieval without hidden dependencies.",
            "Memoria usara este digest para definir RAG, conocimiento y recuperacion sin dependencias invisibles.",
            "Memoria usara este digest para definir RAG, conhecimento e recuperacao sem dependencias invisiveis.",
          )
        : copy(
            "Once you promote tools, Memory can validate dependencies such as document_ingestion and knowledge_retrieval.",
            "Cuando promuevas herramientas, Memoria podra validar dependencias como document_ingestion y knowledge_retrieval.",
            "Quando voce promover ferramentas, Memoria podera validar dependencias como document_ingestion e knowledge_retrieval.",
          ),
    primaryAction: {
      description: primaryDescription,
      label: primaryLabel,
      tone: viewModel.status === "blocked" ? "danger" : viewModel.status === "approved" ? "success" : "info",
    },
    stage: {
      description: copy(
        "Select the minimum set of tools, integrations, and contracts needed to operate the agent.",
        "Selecciona el conjunto minimo de herramientas, integraciones y contratos necesarios para operar el agente.",
        "Selecione o conjunto minimo de ferramentas, integracoes e contratos necessarios para operar o agente.",
      ),
      objective: copy(
        "Identify external capabilities without overprovisioning cost, permissions, or maintenance.",
        "Identificar capacidades externas sin sobreaprovisionar costo, permisos ni mantenimiento.",
        "Identificar capacidades externas sem superprovisionar custo, permissoes ou manutencao.",
      ),
      statusLabel: statusCopy[viewModel.status].label,
      statusTone: statusCopy[viewModel.status].tone,
      title: byLanguage(language, { en: "Tools: minimum capabilities", es: "Herramientas: capacidades minimas", pt: "Ferramentas: capacidades minimas" }),
    },
    tabs: [
      {
        badge: viewModel.decisions.length,
        description: byLanguage(language, { en: "Decisions and gaps that govern the minimum selection.", es: "Decisiones y gaps que gobiernan la seleccion minima.", pt: "Decisoes e gaps que governam a selecao minima." }),
        key: "task",
        label: byLanguage(language, { en: "Current task", es: "Tarea actual", pt: "Tarefa atual" }),
        children: viewModel.status === "blocked" ? (
          <UxaSurface className="border-[var(--uxa-state-danger)] p-[var(--uxa-panel-padding-lg)]">
            <div className="flex items-start gap-4">
              <ShieldAlert aria-hidden="true" className="h-8 w-8 text-[var(--uxa-state-danger)]" />
              <div>
                <h3 className="text-[22px] font-black">{copy("Tools depends on approved Design", "Herramientas depende de Disenar aprobado", "Ferramentas dependem de Design aprovado")}</h3>
                <p className="mt-2 text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">
                  {copy(
                    "Approve architecture and behavior before inferring tools.",
                    "Aprueba arquitectura y comportamiento antes de inferir herramientas.",
                    "Aprove arquitetura e comportamento antes de inferir ferramentas.",
                  )}
                </p>
                <Link className="uxa-button uxa-button--primary mt-4" href={getProductExperienceStageHref(viewModel.sessionId, "design")}>
                  {copy("Go to Design", "Ir a Disenar", "Ir para Design")}
                </Link>
              </div>
            </div>
          </UxaSurface>
        ) : viewModel.recommendation ? (
          <div className="space-y-4">
            <Catalog
              optionalKeys={optionalKeys}
              onOpenTool={openToolDetail}
              onToggleOptional={toggleOptional}
              recommendation={viewModel.recommendation}
              selectedToolKey={activeSelectedTool?.tool_key}
            />
            {viewModel.decisions.length ? (
              <details className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-white p-4" open>
                <summary className="cursor-pointer text-[14px] font-black">
                  {viewModel.commercialTier === "blueprint"
                    ? copy("Assumptions and enrichment opportunities", "Supuestos y oportunidades de enriquecimiento", "Suposicoes e oportunidades de enriquecimento")
                    : copy("Actionable decisions and gaps", "Decisiones y gaps accionables", "Decisoes e gaps acionaveis")} · {viewModel.decisions.length}
                </summary>
                <div className="mt-4">
                  <Decisions commercialTier={viewModel.commercialTier} decisions={viewModel.decisions} sessionId={viewModel.sessionId} />
                </div>
              </details>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            <EmptyTools canGenerate={viewModel.canGenerate} />
            <UxaSurface className="p-[var(--uxa-panel-padding-lg)]">
              <UxaTextareaField
                hint={copy(
                  "Optional. Helps steer regenerations without replacing approved Design.",
                  "Opcional. Sirve para orientar regeneraciones sin reemplazar Design aprobado.",
                  "Opcional. Serve para orientar regeneracoes sem substituir o Design aprovado.",
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
        badge: toolCount,
        description: byLanguage(language, { en: "Executive deliverable of the minimum toolset.", es: "Entregable ejecutivo del set minimo de herramientas.", pt: "Entregavel executivo do conjunto minimo de ferramentas." }),
        key: "result",
        label: byLanguage(language, { en: "Generated deliverable", es: "Entrega generada", pt: "Entrega gerada" }),
        children: viewModel.recommendation ? (
          <div className="space-y-4">
            <ToolsDeliverable decisionCount={viewModel.decisions.length} recommendation={viewModel.recommendation} />
            <Coverage recommendation={viewModel.recommendation} />
          </div>
        ) : (
          <EmptyTools canGenerate={viewModel.canGenerate} />
        ),
      },
      {
        badge: viewModel.sections.find((section) => section.key === "contracts")?.count ?? 0,
        description: byLanguage(language, { en: "Contracts, bindings, side effects, and operational risks.", es: "Contratos, bindings, side-effects y riesgos operativos.", pt: "Contratos, bindings, side effects e riscos operacionais." }),
        key: "evidence",
        label: byLanguage(language, { en: "Evidence and traceability", es: "Evidencia y trazabilidad", pt: "Evidencia e rastreabilidade" }),
        children: viewModel.recommendation ? (
          <div className="space-y-4">
            <Contracts onOpenTool={openToolDetail} recommendation={viewModel.recommendation} />
            {viewModel.warnings.length ? (
              <UxaSurface className="p-4">
                <p className="text-[13px] font-black">{copy("Warnings", "Advertencias", "Advertencias")}</p>
                {viewModel.warnings.map((warning, index) => (
                  <p className="mt-2 rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] p-3 text-[12px]" key={`${warning}-${index}`}>{warning}</p>
                ))}
              </UxaSurface>
            ) : null}
          </div>
        ) : (
          <UxaSurface className="p-[var(--uxa-panel-padding-lg)]" muted>
            <p className="text-[13px] font-black">
              {copy(
                "Evidence will appear once a tools recommendation exists.",
                "La evidencia aparecera cuando exista recomendacion de herramientas.",
                "A evidencia aparecera quando existir recomendacao de ferramentas.",
              )}
            </p>
          </UxaSurface>
        ),
      },
    ],
  };

  return (
    <>
      <LeanStageScreen
        actionArea={
          <>
            {viewModel.status === "approved" ? (
              <UxaButton onClick={() => router.push(getProductExperienceStageHref(viewModel.sessionId, "memory"))} variant="primary">
                {byLanguage(language, { en: "Continue to Memory", es: "Continuar a Memoria", pt: "Continuar para Memoria" })} <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </UxaButton>
            ) : viewModel.recommendation ? (
              <UxaButton disabled={!viewModel.canPromote || processing} isLoading={processing && actionState?.action === "approve_tools_selection"} onClick={() => void handlePromote()} variant="primary">
                {byLanguage(language, { en: "Promote tools", es: "Promover herramientas", pt: "Promover ferramentas" })} <PackageCheck aria-hidden="true" className="h-4 w-4" />
              </UxaButton>
            ) : viewModel.status === "blocked" ? (
              <UxaButton onClick={() => router.push(getProductExperienceStageHref(viewModel.sessionId, "design"))} variant="primary">
                {byLanguage(language, { en: "Go to Design", es: "Ir a Disenar", pt: "Ir para Design" })} <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </UxaButton>
            ) : (
              <UxaButton disabled={!viewModel.canGenerate || processing} isLoading={processing} onClick={() => void handleGenerate()} variant="primary">
                {viewModel.status === "processing"
                  ? byLanguage(language, { en: "Generating tools...", es: "Generando herramientas...", pt: "Gerando ferramentas..." })
                  : byLanguage(language, { en: "Generate tools", es: "Generar herramientas", pt: "Gerar ferramentas" })} <Sparkles aria-hidden="true" className="h-4 w-4" />
              </UxaButton>
            )}
            <UxaButton disabled={!viewModel.canGenerate || processing} onClick={() => void handleGenerate()} variant="secondary">
              <RefreshCw aria-hidden="true" className={cn("h-4 w-4", processing && "animate-spin")} /> {byLanguage(language, { en: "Regenerate", es: "Regenerar", pt: "Regenerar" })}
            </UxaButton>
            <UxaButton disabled={!viewModel.recommendation || processing} onClick={() => void handleSaveReview()} variant="secondary">
              {byLanguage(language, { en: "Save review", es: "Guardar revision", pt: "Salvar revisao" })}
            </UxaButton>
            <UxaButton disabled={!viewModel.latestToolsArtifact || processing} onClick={() => void handleReject()} variant="ghost">
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
      <ToolDetailDrawer isOpen={isActiveToolDrawerOpen} onClose={() => setIsToolDrawerOpen(false)} tool={activeSelectedTool} />
    </>
  );

}
