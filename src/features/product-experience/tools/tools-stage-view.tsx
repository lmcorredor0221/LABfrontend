"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
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
} from "lucide-react";
import type { ProductExperienceRouteSnapshot } from "@/features/product-experience/core/server-state";
import {
  UxaBadge,
  UxaButton,
  UxaEmptyState,
  UxaSectionNav,
  UxaSurface,
  UxaTextareaField,
  type UxaTone,
} from "@/features/product-experience/design-system";
import { byLanguage } from "@/features/product-experience/core/localized-copy";
import { LeanStageScreen, type LeanStageScreenContract } from "@/features/product-experience/stage-screen";
import {
  buildToolsViewModel,
  parseToolsSection,
  type ToolsSection,
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

function payload(recommendation: ToolRecommendationArtifact): Record<string, unknown> {
  return recommendation as unknown as Record<string, unknown>;
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

function SectionNav({
  activeSection,
  onSectionChange,
  sections,
}: {
  activeSection: ToolsSection;
  onSectionChange(section: ToolsSection): void;
  sections: ReturnType<typeof buildToolsViewModel>["sections"];
}) {
  const { language } = useLanguage();
  return (
    <UxaSurface as="aside" className="h-fit p-3 lg:sticky lg:top-6">
      <p className="px-2 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)]">
        {byLanguage(language, { en: "Sections", es: "Secciones", pt: "Secoes" })}
      </p>
      <div className="mt-3">
        <UxaSectionNav
          activeKey={activeSection}
          ariaLabel={byLanguage(language, {
            en: "Tools sections",
            es: "Secciones de Herramientas",
            pt: "Secoes de Ferramentas",
          })}
          items={sections}
          onSelect={(key) => onSectionChange(key as ToolsSection)}
        />
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

function Decisions({ decisions, sessionId }: { decisions: ReturnType<typeof buildToolsViewModel>["decisions"]; sessionId: string }) {
  const { language } = useLanguage();
  return (
    <div className="space-y-3">
      {decisions.map((item) => (
        <article className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-white p-4" key={item.key}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)]">{item.source}</p>
              <h4 className="mt-1 text-[15px] font-black">{item.title}</h4>
            </div>
          <UxaBadge tone={item.severity === "blocking" ? "danger" : item.severity === "warning" ? "warning" : "info"}>{getDecisionSeverityLabel(language, item.severity)}</UxaBadge>
          </div>
          <p className="mt-3 text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">{item.detail}</p>
          <p className="mt-3 rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] p-3 text-[12px]">{item.action}</p>
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
      ) : (
        <Link className="uxa-button uxa-button--secondary" href={getProductExperienceProductHref(sessionId, "attention")}>
          {byLanguage(language, {
            en: "Manage in Attention",
            es: "Gestionar en Atencion",
            pt: "Gerenciar em Atencao",
          })}
        </Link>
      )}
    </div>
  );
}

function ToolCard({
  optionalSelected,
  tool,
  onOpen,
  onToggleOptional,
}: {
  optionalSelected?: boolean;
  tool: ToolRecommendationEntry;
  onOpen(tool: ToolRecommendationEntry): void;
  onToggleOptional?(toolKey: string): void;
}) {
  const { language } = useLanguage();
  const tone: UxaTone = tool.classification === "mandatory" ? "success" : tool.classification === "optional" ? "warning" : "neutral";
  return (
    <article className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)]">{tool.tool_key}</p>
          <h4 className="mt-1 text-[16px] font-black">{tool.tool_label}</h4>
        </div>
        <div className="flex flex-wrap gap-2">
          <UxaBadge tone={tone}>{getToolClassificationLabel(language, tool.classification)}</UxaBadge>
          <UxaBadge tone="neutral">{Math.round(tool.confidence * 100)}%</UxaBadge>
        </div>
      </div>
      <p className="mt-3 text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">{tool.capability_covered}</p>
      <p className="mt-3 rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] p-3 text-[12px]">{tool.decision_reason}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {onToggleOptional ? (
          <UxaButton onClick={() => onToggleOptional(tool.tool_key)} size="sm" variant={optionalSelected ? "primary" : "secondary"}>
            {optionalSelected
              ? byLanguage(language, { en: "Optional included", es: "Opcional incluido", pt: "Opcional incluido" })
              : byLanguage(language, { en: "Include optional", es: "Incluir opcional", pt: "Incluir opcional" })}
          </UxaButton>
        ) : null}
        <UxaButton onClick={() => onOpen(tool)} size="sm" variant="ghost">
          {byLanguage(language, { en: "View contract", es: "Ver contrato", pt: "Ver contrato" })}
        </UxaButton>
      </div>
    </article>
  );
}

function Catalog({
  optionalKeys,
  recommendation,
  onOpenTool,
  onToggleOptional,
}: {
  optionalKeys: string[];
  recommendation: ToolRecommendationArtifact;
  onOpenTool(tool: ToolRecommendationEntry): void;
  onToggleOptional(toolKey: string): void;
}) {
  const { language } = useLanguage();
  return (
    <div className="space-y-5">
      <div>
        <p className="mb-3 text-[13px] font-black">
          {byLanguage(language, { en: "Mandatory", es: "Obligatorias", pt: "Obrigatorias" })}
        </p>
        <div className="grid gap-3 xl:grid-cols-2">
          {recommendation.recommended_tools.map((tool) => (
            <ToolCard key={tool.tool_key} onOpen={onOpenTool} tool={tool} />
          ))}
        </div>
      </div>
      <div>
        <p className="mb-3 text-[13px] font-black">
          {byLanguage(language, { en: "Resolvable optional", es: "Opcionales resolubles", pt: "Opcionais resolviveis" })}
        </p>
        <div className="grid gap-3 xl:grid-cols-2">
          {recommendation.optional_tools.map((tool) => (
            <ToolCard
              key={tool.tool_key}
              onOpen={onOpenTool}
              onToggleOptional={onToggleOptional}
              optionalSelected={optionalKeys.includes(tool.tool_key)}
              tool={tool}
            />
          ))}
        </div>
      </div>
      <details className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-white p-4">
        <summary className="cursor-pointer text-[14px] font-black">
          {byLanguage(language, { en: "Unnecessary or rejected", es: "Innecesarias o rechazadas", pt: "Desnecessarias ou rejeitadas" })}
        </summary>
        <div className="mt-3 grid gap-3 xl:grid-cols-2">
          {recommendation.rejected_tools.map((tool) => (
            <ToolCard key={tool.tool_key} onOpen={onOpenTool} tool={tool} />
          ))}
        </div>
      </details>
    </div>
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
            <UxaBadge tone={tool.contract_seed?.has_side_effects ? "danger" : "success"}>
              {tool.contract_seed?.has_side_effects
                ? byLanguage(language, { en: "Side effect", es: "Efecto lateral", pt: "Efeito colateral" })
                : byLanguage(language, { en: "read-only", es: "solo lectura", pt: "somente leitura" })}
            </UxaBadge>
          </div>
          <UxaButton className="mt-4" onClick={() => onOpenTool(tool)} size="sm" variant="secondary">
            {byLanguage(language, { en: "Open resource panel", es: "Abrir panel del recurso", pt: "Abrir painel do recurso" })}
          </UxaButton>
        </article>
      ))}
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

  return (
    <UxaSurface className="p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)]">
        {byLanguage(language, { en: "Contract", es: "Contrato", pt: "Contrato" })}
      </p>
      <h4 className="mt-2 text-[18px] font-black">{tool.tool_label}</h4>
      <p className="mt-2 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">{tool.contract_seed?.purpose ?? tool.capability_covered}</p>
      <div className="mt-4 space-y-2 text-[12px]">
        <p className="rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] p-3">
          {byLanguage(language, { en: "Inputs", es: "Entradas", pt: "Entradas" })}: {tool.contract_seed?.inputs.join(", ") || "N/A"}
        </p>
        <p className="rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] p-3">
          {byLanguage(language, { en: "Outputs", es: "Salidas", pt: "Saidas" })}: {tool.contract_seed?.outputs.join(", ") || "N/A"}
        </p>
        <p className="rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] p-3">
          {byLanguage(language, { en: "Owner", es: "Responsable", pt: "Responsavel" })}: {tool.contract_seed?.owner
            ?? byLanguage(language, { en: "to be defined", es: "por definir", pt: "por definir" })}
        </p>
        <p className="rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] p-3">
          {byLanguage(language, { en: "Binding", es: "Vinculo", pt: "Vinculo" })}: {tool.contract_seed?.endpoint_reference
            ?? byLanguage(language, { en: "pending implementation", es: "pendiente de implementacion", pt: "pendente de implementacao" })}
        </p>
      </div>
    </UxaSurface>
  );
}


export function ToolsStageView({ actionState, activeRoute, actions }: ToolsStageViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
  const selectedSection = parseToolsSection(searchParams.get("uxa_section"));
  const processing = isSubmitting(actionState, localAction);
  const viewModel = useMemo(() => buildToolsViewModel(activeRoute, { processing }), [activeRoute, processing]);
  const optionalKeys =
    selectionState.signature === artifactSignature
      ? selectionState.optionalKeys
      : (viewModel.approvedDigest?.optional_tool_keys ?? []);
  const message = actionState?.message ?? localAction.message;
  const statusCopy = getStatusCopy(language);
  const copy = (en: string, es: string, pt: string) => byLanguage(language, { en, es, pt });

  function updateSection(section: ToolsSection) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("uxa_section", section);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
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
      throw error;
    }
  }

  function toggleOptional(toolKey: string) {
    const next = optionalKeys.includes(toolKey) ? optionalKeys.filter((item) => item !== toolKey) : [...optionalKeys, toolKey];
    setSelectionState({ optionalKeys: next, signature: artifactSignature });
  }

  async function handleGenerate() {
    await runLocal(copy(
      "Generating minimum tools with the backend.",
      "Generando herramientas minimas con backend.",
      "Gerando ferramentas minimas com o backend.",
    ), async () => {
      await actions?.recommendTools({ instructions: instructions.trim() || undefined });
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
          <div className="grid gap-4 lg:grid-cols-[250px_minmax(0,1fr)]">
            <SectionNav activeSection={selectedSection} onSectionChange={updateSection} sections={viewModel.sections} />
            <div className="space-y-4">
              <Decisions decisions={viewModel.decisions} sessionId={viewModel.sessionId} />
              <Catalog optionalKeys={optionalKeys} onOpenTool={setSelectedTool} onToggleOptional={toggleOptional} recommendation={viewModel.recommendation} />
            </div>
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
        description: byLanguage(language, { en: "Recommendation, coverage, and promotion control.", es: "Recomendacion, cobertura y control de promocion.", pt: "Recomendacao, coverage e controle de promocao." }),
        key: "result",
        label: byLanguage(language, { en: "Generated result", es: "Resultado generado", pt: "Resultado gerado" }),
        children: viewModel.recommendation ? (
          <div className="space-y-4">
            <UxaSurface className="p-4">
              <p className="text-[13px] font-black">{copy("Recommendation summary", "Resumen de recomendacion", "Resumo da recomendacao")}</p>
              <p className="mt-2 text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">{viewModel.recommendation.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <UxaBadge tone={viewModel.recommendation.evaluation.promotion_blocked ? "danger" : "success"}>
                  {viewModel.recommendation.evaluation.overall_status}
                </UxaBadge>
                <UxaBadge tone="neutral">{Math.round(viewModel.recommendation.confidence.overall * 100)}%</UxaBadge>
              </div>
            </UxaSurface>
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
            <Contracts onOpenTool={setSelectedTool} recommendation={viewModel.recommendation} />
            <ResourceDrawer tool={selectedTool} />
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
              {byLanguage(language, { en: "Generate tools", es: "Generar herramientas", pt: "Gerar ferramentas" })} <Sparkles aria-hidden="true" className="h-4 w-4" />
            </UxaButton>
          )}
          <UxaButton disabled={!viewModel.canGenerate || processing} onClick={() => void handleGenerate()} variant="secondary">
            <RefreshCw aria-hidden="true" className="h-4 w-4" /> {byLanguage(language, { en: "Regenerate", es: "Regenerar", pt: "Regenerar" })}
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
  );

}
