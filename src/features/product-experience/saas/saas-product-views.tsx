"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  Boxes,
  ClipboardCopy,
  Clock3,
  Download,
  ExternalLink,
  FileText,
  GitBranch,
  Link2,
  ListChecks,
  Printer,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { ApiError } from "@/core/api/errors";
import { useLanguage, type SupportedLanguage } from "@/core/i18n/language-context";
import { DiagramCenterPage } from "@/features/diagram-center";
import { useDiagramCenter } from "@/features/diagram-center/application/use-diagram-center";
import type { DiagramCatalogItem } from "@/features/diagram-center/domain/types";
import diagramCenterStyles from "@/features/diagram-center/presentation/diagram-center.module.css";
import type {
  DeliverableCatalogItem,
  DeliverableCatalogResponse,
} from "@/features/deliverables/domain/types";
import { deliverableCatalogApi } from "@/features/deliverables/infrastructure/deliverable-catalog-api";
import { byLanguage } from "@/features/product-experience/core/localized-copy";
import type { ProductExperienceRouteSnapshot } from "@/features/product-experience/core/server-state";
import {
  UxaBadge,
  UxaButton,
  UxaContextualActionDock,
  UxaMetricCard,
  UxaProcessingStrip,
  UxaProductHero,
  UxaSurface,
  type UxaTone,
} from "@/features/product-experience/design-system";
import type { ProductExperienceProductSection } from "@/features/product-experience/shell/experience-model";
import {
  buildProductSaasViewModel,
  hasTier,
} from "@/features/product-experience/saas/saas-product-model";
import {
  DeliverableGenerationLiveTracker,
  DeliverableProgressSummary,
  ExecutiveOverviewShell,
  ExecutiveProductKeyDeliverables,
  ProductNextAction,
  buildExecutiveOverviewModel,
} from "@/features/product-experience/saas/executive-overview-components";
import { useProductBuildStatus } from "@/features/product-experience/saas/use-product-build-status";
import type { ProductBuildStatus } from "@/features/product-experience/saas/product-build-status";
import { ProfessionalArtifactViewer } from "@/features/product-experience/saas/professional-artifact-viewer";
import { sessionsApi } from "@/features/sessions/session-api";
import type { ConstructionQuestionViewEntry } from "@/features/sessions/session-contracts";
import type { ACPWorkspaceResponse, CommercialTier, ExportJobResponse } from "@/features/sessions/types";
import { cn } from "@/lib/utils";
import {
  AcpStepStepper,
  type AcpWorkflowStep,
} from "@/features/acp/components/acp-step-stepper";
import { AcpResolutionStage } from "@/features/acp/components/acp-resolution-stage";
import { AcpValidationStage } from "@/features/acp/components/acp-validation-stage";
import { AcpReconciliationStage } from "@/features/acp/components/acp-reconciliation-stage";
import { AcpPackageStage } from "@/features/acp/components/acp-package-stage";
import { productExperienceStore } from "@/features/product-experience/shell/use-product-experience-route";

type CheckoutMarketCode = "co";
type AcpLoadStatus = "idle" | "loading" | "ready" | "error";

const CHECKOUT_MARKET_STORAGE_KEY = "lean_checkout_market";
const BLUEPRINT_FREE_HERO_DIAGRAM_KEY = "agent_orchestration";
const AGENT_ORCHESTRATION_MINIMUM_CHECKS = [
  { key: "agent_orchestration_has_orchestrator", label: "Orquestador" },
  { key: "agent_orchestration_has_multiple_agents", label: "Agentes" },
  { key: "agent_orchestration_has_handoffs", label: "Handoffs" },
  { key: "agent_orchestration_has_tools", label: "Herramientas" },
  { key: "agent_orchestration_has_memory", label: "Memoria" },
  { key: "agent_orchestration_has_guardrails", label: "Guardrails" },
  { key: "agent_orchestration_has_hitl", label: "HITL" },
  { key: "agent_orchestration_has_fallback", label: "Fallback" },
] as const;
const BLUEPRINT_FREE_VALIDATED_ITEMS = [
  {
    key: "discovery.analysis",
    icon: FileText,
    label: {
      en: "Agent Executive Canvas",
      es: "Canvas Ejecutivo del Agente",
      pt: "Canvas Executivo do Agente",
    },
  },
  {
    key: "definition.requirements",
    icon: ListChecks,
    label: {
      en: "MVP User Stories Brief",
      es: "Brief de Historias de Usuario MVP",
      pt: "Brief de Historias de Usuario MVP",
    },
  },
  {
    key: "discovery.stakeholder_inventory",
    icon: Users,
    label: {
      en: "Organizational Impact Matrix",
      es: "Matriz de Impacto Organizacional",
      pt: "Matriz de Impacto Organizacional",
    },
  },
  {
    key: "diagram.architecture_overview",
    icon: Boxes,
    label: {
      en: "Agent Architecture Overview",
      es: "Overview de Arquitectura del Agente",
      pt: "Overview de Arquitetura do Agente",
    },
  },
  {
    key: "diagram.current_process_map",
    icon: GitBranch,
    label: {
      en: "Current Manual Process Diagram",
      es: "Diagrama del Proceso Manual Actual",
      pt: "Diagrama do Processo Manual Atual",
    },
  },
  {
    key: "diagram.user_journey",
    icon: ArrowUpRight,
    label: {
      en: "Agent User Journey",
      es: "User Journey con el Agente",
      pt: "User Journey com o Agente",
    },
  },
] as const;
const CHECKOUT_MARKETS: Array<{
  code: CheckoutMarketCode;
  label: Record<SupportedLanguage, string>;
}> = [
  { code: "co", label: { en: "Colombia", es: "Colombia", pt: "Colombia" } },
];

function normalizeCheckoutMarket(value: string | null | undefined): CheckoutMarketCode {
  void value;
  return "co";
}

function checkoutMarketPackageCode(productKey: "blueprint_pro" | "acp", market: CheckoutMarketCode) {
  return `${productKey}_${market}`;
}

function getAcpLoadErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error || "Error desconocido");
}

function readStoredCheckoutMarket() {
  if (
    typeof window === "undefined" ||
    typeof window.localStorage?.getItem !== "function"
  ) {
    return "";
  }

  return window.localStorage.getItem(CHECKOUT_MARKET_STORAGE_KEY) ?? "";
}

function writeStoredCheckoutMarket(market: CheckoutMarketCode) {
  if (
    typeof window === "undefined" ||
    typeof window.localStorage?.setItem !== "function"
  ) {
    return;
  }

  window.localStorage.setItem(CHECKOUT_MARKET_STORAGE_KEY, market);
}

function useCheckoutMarketSelection() {
  const searchParams = useSearchParams();
  const [market, setMarketState] = useState<CheckoutMarketCode>(() =>
    normalizeCheckoutMarket(searchParams.get("market") || readStoredCheckoutMarket()),
  );

  function setMarket(nextMarket: CheckoutMarketCode) {
    setMarketState(nextMarket);
    writeStoredCheckoutMarket(nextMarket);
  }

  return { market, setMarket };
}

function CheckoutMarketSelector({
  language,
  market,
  onMarketChange,
}: {
  language: SupportedLanguage;
  market: CheckoutMarketCode;
  onMarketChange: (market: CheckoutMarketCode) => void;
}) {
  return (
    <div
      aria-label={byLanguage(language, {
        en: "Checkout market",
        es: "Mercado de checkout",
        pt: "Mercado de checkout",
      })}
      className="flex items-center gap-1 rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-white p-1"
      role="radiogroup"
    >
      <span className="px-2 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--uxa-color-ink-muted)]">
        {byLanguage(language, { en: "Market", es: "Mercado", pt: "Mercado" })}
      </span>
      {CHECKOUT_MARKETS.map((option) => {
        const selected = option.code === market;
        return (
          <button
            aria-checked={selected}
            className={cn(
              "min-w-9 rounded-[var(--uxa-radius-md)] px-2 py-1 text-[11px] font-black uppercase transition",
              selected
                ? "bg-[var(--uxa-color-brand)] text-white shadow-sm"
                : "text-[var(--uxa-color-ink-soft)] hover:bg-[var(--uxa-color-muted-panel)] hover:text-[var(--uxa-color-ink)]",
            )}
            key={option.code}
            onClick={() => onMarketChange(option.code)}
            role="radio"
            title={option.label[language]}
            type="button"
          >
            {option.code}
          </button>
        );
      })}
    </div>
  );
}

function triggerAuthenticatedDownload(blob: Blob, fileName: string) {
  if (typeof window === "undefined") {
    return;
  }

  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

async function downloadReadyExportJob({
  sessionId,
  job,
}: {
  sessionId: string;
  job: ExportJobResponse;
}) {
  if (job.status !== "ready") {
    return;
  }

  const blob = await sessionsApi.downloadExportJob(sessionId, job.id);
  triggerAuthenticatedDownload(blob, job.file_name || `${job.artifact_kind}.bin`);
}

async function executeProductCheckout({
  sessionId,
  productKey,
  packageCode,
  successUrl,
  cancelUrl,
}: {
  sessionId: string;
  productKey: "blueprint_pro" | "acp";
  packageCode?: string;
  successUrl?: string;
  cancelUrl?: string;
}) {
  const checkout = await sessionsApi.createCheckoutSession({
    session_id: sessionId,
    package_code: packageCode,
    product_key: productKey,
    success_url: successUrl || (typeof window !== "undefined" ? window.location.href : undefined),
    cancel_url: cancelUrl || (typeof window !== "undefined" ? window.location.href : undefined),
  });

  if (checkout.provider === "sandbox") {
    await sessionsApi.completeSandboxCheckout(checkout.checkout_ref, {
      outcome: "success",
      provider_payment_id: `sandbox_${checkout.checkout_ref}`,
    });
    if (typeof window !== "undefined") {
      window.location.reload();
    }
    return checkout;
  }

  if (checkout.checkout_url && typeof window !== "undefined") {
    window.location.assign(checkout.checkout_url);
  }
  return checkout;
}

async function executeAccessRequest({
  sessionId,
  productKey,
}: {
  sessionId: string;
  productKey: "blueprint_pro" | "acp";
}) {
  return sessionsApi.createAccessRequest(sessionId, {
    capability: productKey,
    reason: `Access request for ${productKey}`,
    session_id: sessionId,
  });
}

function isCheckoutAvailableAccessConflict(error: unknown, productKey: "blueprint_pro" | "acp") {
  if (!(error instanceof ApiError) || error.status !== 409) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes("checkout") && message.includes(productKey);
}

async function executeAccessRequestWithCheckoutFallback({
  sessionId,
  productKey,
  packageCode,
}: {
  sessionId: string;
  productKey: "blueprint_pro" | "acp";
  packageCode?: string;
}) {
  try {
    return {
      response: await executeAccessRequest({ sessionId, productKey }),
      type: "access_request" as const,
    };
  } catch (error) {
    if (isCheckoutAvailableAccessConflict(error, productKey)) {
      await executeProductCheckout({
        sessionId,
        packageCode,
        productKey,
      });
      return { response: null, type: "checkout" as const };
    }

    throw error;
  }
}

async function executeBlueprintProDownload({
  sessionId,
}: {
  sessionId: string;
}) {
  let job = await sessionsApi.createExportJob(sessionId, {
    artifact_kind: "blueprint_professional",
    profile: "professional",
  });

  // Polling si el trabajo esta en cola o procesando
  let attempts = 0;
  while ((job.status === "queued" || job.status === "running") && attempts < 20) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    try {
      job = await sessionsApi.getExportJob(sessionId, job.id);
    } catch {
      // Ignored for polling
    }
    attempts++;
  }

  if (job.status === "ready") {
    await downloadReadyExportJob({ job, sessionId });
    return job;
  }

  if (job.status === "expired" || job.status === "failed") {
    const retried = await sessionsApi.retryExportJob(sessionId, job.id);
    let retryAttempts = 0;
    let currentRetry = retried;
    while ((currentRetry.status === "queued" || currentRetry.status === "running") && retryAttempts < 20) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      try {
        currentRetry = await sessionsApi.getExportJob(sessionId, retried.id);
      } catch {
        // Ignored for polling
      }
      retryAttempts++;
    }
    if (currentRetry.status === "ready") {
      await downloadReadyExportJob({ job: currentRetry, sessionId });
    }
    return currentRetry;
  }

  return job;
}

type InlineNoticeTone = "danger" | "warning" | "success";

type InlineNotice = {
  message: string;
  tone: InlineNoticeTone;
};

function buildExportJobNotice(
  language: SupportedLanguage,
  job: ExportJobResponse,
  productLabel: { en: string; es: string; pt: string },
): InlineNotice | null {
  const localizedProduct = byLanguage(language, productLabel);
  if (job.status === "failed") {
    return {
      tone: "danger",
      message:
        job.error_message ||
        byLanguage(language, {
          en: `The ${localizedProduct} download could not be prepared.`,
          es: `No se pudo preparar la descarga de ${localizedProduct}.`,
          pt: `Nao foi possivel preparar o download de ${localizedProduct}.`,
        }),
    };
  }
  if (job.status === "queued" || job.status === "running") {
    return {
      tone: "warning",
      message: byLanguage(language, {
        en: `The ${localizedProduct} download is still being prepared. Retry in a few seconds if it does not start automatically.`,
        es: `La descarga de ${localizedProduct} sigue en preparación. Reintenta en unos segundos si no inicia sola.`,
        pt: `O download de ${localizedProduct} ainda esta sendo preparado. Tente novamente em alguns segundos se nao iniciar sozinho.`,
      }),
    };
  }
  if (job.status === "expired") {
    return {
      tone: "warning",
      message: byLanguage(language, {
        en: `The ${localizedProduct} download expired before it could open. Try again.`,
        es: `La descarga de ${localizedProduct} expiró antes de abrirse. Inténtalo de nuevo.`,
        pt: `O download de ${localizedProduct} expirou antes de abrir. Tente novamente.`,
      }),
    };
  }
  if (job.status === "canceled") {
    return {
      tone: "warning",
      message: byLanguage(language, {
        en: `The ${localizedProduct} download was canceled.`,
        es: `La descarga de ${localizedProduct} fue cancelada.`,
        pt: `O download de ${localizedProduct} foi cancelado.`,
      }),
    };
  }
  if (job.status === "ready" && !job.download_url) {
    return {
      tone: "warning",
      message: byLanguage(language, {
        en: `The ${localizedProduct} download is ready but the file URL is missing.`,
        es: `La descarga de ${localizedProduct} quedó lista, pero falta la URL del archivo.`,
        pt: `O download de ${localizedProduct} ficou pronto, mas a URL do arquivo esta ausente.`,
      }),
    };
  }
  return null;
}

function InlineNoticeBanner({
  notice,
}: {
  notice: InlineNotice | null;
}) {
  if (!notice) {
    return null;
  }
  return (
    <p
      className={cn(
        "rounded-[var(--uxa-radius-md)] border px-3 py-2 text-[12px] leading-5",
        notice.tone === "danger" &&
          "border-[var(--uxa-state-danger)] bg-[var(--uxa-state-danger-bg)] text-[var(--uxa-color-ink-soft)]",
        notice.tone === "warning" &&
          "border-[var(--uxa-state-warning)] bg-[var(--uxa-state-warning-bg)] text-[var(--uxa-color-ink-soft)]",
        notice.tone === "success" &&
          "border-[var(--uxa-state-success)] bg-[var(--uxa-state-success-bg)] text-[var(--uxa-color-ink-soft)]",
      )}
      role={notice.tone === "danger" ? "alert" : "status"}
    >
      {notice.message}
    </p>
  );
}

type ProductSaasViewProps = {
  activeRoute: ProductExperienceRouteSnapshot | null;
  section: ProductExperienceProductSection;
};

type ProductTierScope = CommercialTier;
type ProductArtifactCard = ReturnType<typeof buildProductSaasViewModel>["artifactCards"][number];
type BlueprintFreeTab = "result" | "tracking" | "diagrams" | "deliverables" | "pro";
type BlueprintWorkbenchTab = "overview" | "diagrams" | "governed-artifacts" | "commercial-artifacts";
type ProductBuildStatusView = ReturnType<typeof useProductBuildStatus>;
type ExecutiveOverviewProductSection = "blueprint_overview" | "blueprint_pro_overview" | "acp_overview";
type ExecutiveOverviewProductKey = "blueprint_basic" | "blueprint_pro" | "acp";

type ExecutiveOverviewConfig = {
  detailHref: (sessionId: string) => string;
  detailLabel: {
    en: string;
    es: string;
    pt: string;
  };
  errorDescription: string;
  errorTitle: string;
  productKey: ExecutiveOverviewProductKey;
  viewModelSection: "blueprint" | "blueprint_pro" | "acp";
};

const EXECUTIVE_OVERVIEW_CONFIG: Record<ExecutiveOverviewProductSection, ExecutiveOverviewConfig> = {
  acp_overview: {
    detailHref: (sessionId) => `/projects/${sessionId}/acp`,
    detailLabel: {
      en: "View ACP",
      es: "Ver ACP",
      pt: "Ver ACP",
    },
    errorDescription:
      "No se pudo cargar el estado vivo del paquete. El readiness y las descargas siguen protegidos por los gates del backend.",
    errorTitle: "Estado ACP no disponible",
    productKey: "acp",
    viewModelSection: "acp",
  },
  blueprint_overview: {
    detailHref: (sessionId) => `/projects/${sessionId}/blueprint`,
    detailLabel: {
      en: "View Blueprint result",
      es: "Ver resultado Blueprint",
      pt: "Ver resultado Blueprint",
    },
    errorDescription:
      "No se pudo cargar el estado vivo del Blueprint. Puedes seguir explorando el resultado generado, pero conviene reintentar o revisar Atencion si el problema persiste.",
    errorTitle: "Estado del producto no disponible",
    productKey: "blueprint_basic",
    viewModelSection: "blueprint",
  },
  blueprint_pro_overview: {
    detailHref: (sessionId) => `/projects/${sessionId}/blueprint/pro`,
    detailLabel: {
      en: "View Blueprint Pro",
      es: "Ver Blueprint Pro",
      pt: "Ver Blueprint Pro",
    },
    errorDescription:
      "No se pudo cargar el estado vivo del enriquecimiento. La experiencia mantiene el contenido disponible y permite revisar permisos o Atencion.",
    errorTitle: "Estado de Blueprint Pro no disponible",
    productKey: "blueprint_pro",
    viewModelSection: "blueprint_pro",
  },
};

const PRODUCT_TIER_RANK: Record<ProductTierScope, number> = {
  blueprint: 1,
  blueprint_pro: 2,
  acp: 3,
};

function deferStateUpdate(callback: () => void) {
  if (typeof queueMicrotask === "function") {
    queueMicrotask(callback);
    return;
  }
  void Promise.resolve().then(callback);
}

function normalizeProductTier(value: unknown): ProductTierScope | null {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_");

  if (!raw) {
    return null;
  }

  if (["blueprint", "blueprint_basic", "basic", "free"].includes(raw)) {
    return "blueprint";
  }

  if (["blueprint_pro", "blueprint_premium", "premium", "professional", "pro"].includes(raw)) {
    return "blueprint_pro";
  }

  if (["acp", "agent_construction_package", "package", "construction_package"].includes(raw)) {
    return "acp";
  }

  return null;
}

function isTierIncluded(requiredTier: unknown, tierScope: ProductTierScope) {
  const normalized = normalizeProductTier(requiredTier) ?? "blueprint";
  return PRODUCT_TIER_RANK[normalized] <= PRODUCT_TIER_RANK[tierScope];
}

function productTierLabel(language: "es" | "en" | "pt", tierScope: ProductTierScope) {
  if (tierScope === "acp") {
    return "ACP";
  }

  if (tierScope === "blueprint_pro") {
    return byLanguage(language, {
      en: "Blueprint Pro",
      es: "Blueprint Pro",
      pt: "Blueprint Pro",
    });
  }

  return byLanguage(language, {
    en: "Blueprint",
    es: "Blueprint",
    pt: "Blueprint",
  });
}

function productTierDescription(language: "es" | "en" | "pt", tierScope: ProductTierScope) {
  if (tierScope === "acp") {
    return byLanguage(language, {
      en: "Cumulative catalog: Blueprint + Blueprint Pro + ACP implementation deliverables.",
      es: "Catalogo acumulado: Blueprint + Blueprint Pro + entregables de implementacion ACP.",
      pt: "Catalogo acumulado: Blueprint + Blueprint Pro + entregaveis de implementacao ACP.",
    });
  }

  if (tierScope === "blueprint_pro") {
    return byLanguage(language, {
      en: "Cumulative catalog: Blueprint Basic plus the professional Blueprint assets.",
      es: "Catalogo acumulado: Blueprint Basico mas los activos del Blueprint Profesional.",
      pt: "Catalogo acumulado: Blueprint Basico mais os ativos do Blueprint Profissional.",
    });
  }

  return byLanguage(language, {
    en: "Only the assets included in the Basic Blueprint product are shown here.",
    es: "Aqui solo se muestran los activos incluidos en el producto Blueprint Basico.",
    pt: "Aqui aparecem apenas os ativos incluidos no produto Blueprint Basico.",
  });
}

function artifactMetadataText(artifact: ProductArtifactCard, key: string) {
  const value = artifact.metadata[key];
  return typeof value === "string" && value.trim() ? value : "";
}

function resolveArtifactTier(artifact: ProductArtifactCard): ProductTierScope {
  return (
    normalizeProductTier(artifact.metadata.required_tier) ??
    normalizeProductTier(artifact.metadata.requiredTier) ??
    normalizeProductTier(artifact.metadata.tier) ??
    normalizeProductTier(artifact.metadata.scope) ??
    normalizeProductTier(artifact.metadata.product) ??
    normalizeProductTier(artifact.stage) ??
    (String(artifact.key).toLowerCase().includes("acp") ? "acp" : "blueprint")
  );
}

function getToneBadgeLabel(language: "es" | "en" | "pt", tone: "success" | "warning" | "danger" | "info" | "neutral") {
  switch (tone) {
    case "success":
      return byLanguage(language, { en: "Ready", es: "Listo", pt: "Pronto" });
    case "warning":
      return byLanguage(language, { en: "Review", es: "Revisar", pt: "Revisar" });
    case "danger":
      return byLanguage(language, { en: "Blocked", es: "Bloqueado", pt: "Bloqueado" });
    case "info":
      return byLanguage(language, { en: "Info", es: "Info", pt: "Info" });
    default:
      return byLanguage(language, { en: "Pending", es: "Pendiente", pt: "Pendente" });
  }
}

function formatToken(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function SectionHeader({
  badge,
  description,
  title,
}: {
  badge: string;
  description: string;
  title: string;
}) {
  const { language } = useLanguage();

  return (
    <UxaProductHero
      description={description}
      eyebrow={<UxaBadge tone="info">{badge}</UxaBadge>}
      headingLevel={2}
      meta={
        <span className="inline-flex items-center gap-2 text-[var(--uxa-font-size-small)] text-[var(--uxa-color-ink-soft)]">
          <Sparkles aria-hidden="true" className="h-4 w-4" />
          {byLanguage(language, {
            en: "Product experience layer",
            es: "Capa de experiencia del producto",
            pt: "Camada de experiencia do produto",
          })}
        </span>
      }
      title={title}
    />
  );
}

function ProductDeliverableCatalog({
  artifactCards,
  currentStage,
  sessionId,
  tierScope,
}: {
  artifactCards: ReturnType<typeof buildProductSaasViewModel>["artifactCards"];
  currentStage: string;
  sessionId: string;
  tierScope: ProductTierScope;
}) {
  const { language } = useLanguage();
  const [catalog, setCatalog] = useState<DeliverableCatalogResponse | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [selectedKey, setSelectedKey] = useState("");

  useEffect(() => {
    let cancelled = false;
    deferStateUpdate(() => {
      if (!cancelled) {
        setStatus("loading");
      }
    });
    deliverableCatalogApi
      .list({ currentStage, sessionId, tier: tierScope })
      .then((payload) => {
        if (cancelled) {
          return;
        }
        setCatalog(payload);
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setCatalog(null);
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [currentStage, sessionId, tierScope]);

  const entries = useMemo(
    () =>
      (catalog?.entries ?? [])
        .filter((entry) => entry.deliverable_type !== "diagram")
        .filter((entry) => isTierIncluded(entry.required_tier, tierScope))
        .sort((left, right) => left.sort_order - right.sort_order),
    [catalog?.entries, tierScope],
  );

  const generatedArtifacts = useMemo(
    () =>
      artifactCards.filter(
        (artifact) => !artifact.isDiagram && isTierIncluded(resolveArtifactTier(artifact), tierScope),
      ),
    [artifactCards, tierScope],
  );

  const effectiveSelectedKey =
    selectedKey && entries.some((entry) => entry.key === selectedKey) ? selectedKey : entries[0]?.key ?? "";
  const selectedEntry = entries.find((entry) => entry.key === effectiveSelectedKey) ?? null;
  const generatedMatch = selectedEntry
    ? generatedArtifacts.find((artifact) => {
        const metadataKey = artifactMetadataText(artifact, "artifact_key");
        const artifactKey = String(artifact.key);
        return (
          artifact.label === selectedEntry.title ||
          artifactKey === selectedEntry.key ||
          metadataKey === selectedEntry.key ||
          artifactKey.endsWith(`/${selectedEntry.key}`) ||
          metadataKey.endsWith(`/${selectedEntry.key}`)
        );
      }) ?? null
    : null;

  const totalArtifactEntries = (catalog?.entries ?? []).filter((entry) => entry.deliverable_type !== "diagram").length;
  const availableCount = entries.filter((entry) => entry.access.can_view || entry.access.access_state === "available").length;
  const lockedCount = Math.max(entries.length - availableCount, 0);

  const renderEntry = (entry: DeliverableCatalogItem) => {
    const selected = selectedEntry?.key === entry.key;
    const isAvailable = entry.access.can_view || entry.access.access_state === "available";

    return (
      <article
        className={`${diagramCenterStyles.card} ${selected ? diagramCenterStyles.cardSelected : ""} ${diagramCenterStyles.listCard}`}
        key={entry.key}
      >
        <div>
          <div className={diagramCenterStyles.cardTop}>
            <span className={diagramCenterStyles.tag}>{formatToken(entry.deliverable_type)}</span>
            <span
              className={`${diagramCenterStyles.status} ${
                isAvailable ? diagramCenterStyles.statusAvailable : diagramCenterStyles.statusLocked
              }`}
            >
              {isAvailable
                ? byLanguage(language, { en: "Available", es: "Disponible", pt: "Disponivel" })
                : byLanguage(language, { en: "Locked", es: "Bloqueado", pt: "Bloqueado" })}
            </span>
          </div>
          <button
            aria-pressed={selected}
            className={diagramCenterStyles.cardTitleButton}
            onClick={() => setSelectedKey(entry.key)}
            type="button"
          >
            <h4>{entry.title}</h4>
            <p>{entry.description}</p>
          </button>
        </div>
        <div className={diagramCenterStyles.cardFooter}>
          <button className={diagramCenterStyles.cardAction} onClick={() => setSelectedKey(entry.key)} type="button">
            {byLanguage(language, { en: "View", es: "Ver", pt: "Ver" })}
            <ArrowUpRight aria-hidden="true" size={12} />
          </button>
        </div>
      </article>
    );
  };

  return (
    <section aria-label="Catalogo gobernado de artefactos" className={diagramCenterStyles.workspace}>
      <section aria-label="Catalogo de artefactos" className={diagramCenterStyles.catalogPane}>
        <div className={diagramCenterStyles.paneHeader}>
          <div>
            <h3>
              {byLanguage(language, { en: "Governed artifacts", es: "Artefactos gobernados", pt: "Artefatos governados" })}
            </h3>
            <p>
              {entries.length} / {totalArtifactEntries || entries.length}
            </p>
          </div>
          <span className={diagramCenterStyles.tag}>{productTierLabel(language, tierScope)}</span>
        </div>
        {status === "loading" ? (
          <p className="p-4 text-[13px] text-[var(--uxa-color-ink-soft)]">
            {byLanguage(language, { en: "Loading governed artifacts...", es: "Cargando artefactos gobernados...", pt: "Carregando artefatos governados..." })}
          </p>
        ) : null}
        {status === "error" ? (
          <p className="p-4 text-[13px] text-[var(--uxa-color-ink-soft)]">
            {byLanguage(language, {
              en: "The governed artifact catalog could not be loaded.",
              es: "No se pudo cargar el catalogo gobernado de artefactos.",
              pt: "Nao foi possivel carregar o catalogo governado de artefatos.",
            })}
          </p>
        ) : null}
        <div className={diagramCenterStyles.catalogList}>{entries.map(renderEntry)}</div>
      </section>

      <aside aria-label="Visor de artefactos" className={diagramCenterStyles.viewerPane}>
        <div className={diagramCenterStyles.paneHeader}>
          <div>
            <h3>{byLanguage(language, { en: "Artifact viewer", es: "Visor de artefactos", pt: "Visualizador de artefatos" })}</h3>
            <p>{productTierDescription(language, tierScope)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`${diagramCenterStyles.status} ${diagramCenterStyles.statusAvailable}`}>
              {availableCount} {byLanguage(language, { en: "available", es: "disponibles", pt: "disponiveis" })}
            </span>
            {lockedCount ? (
              <span className={`${diagramCenterStyles.status} ${diagramCenterStyles.statusLocked}`}>
                {lockedCount} {byLanguage(language, { en: "locked", es: "bloqueados", pt: "bloqueados" })}
              </span>
            ) : null}
          </div>
        </div>
        {selectedEntry ? (
          <div className={diagramCenterStyles.viewerBody}>
            <div>
              <h3 className={diagramCenterStyles.viewerTitle}>{selectedEntry.title}</h3>
              <p className={diagramCenterStyles.viewerDescription}>{selectedEntry.description}</p>
            </div>
            <div className={diagramCenterStyles.viewerMeta}>
              <span className={diagramCenterStyles.tag}>{formatToken(selectedEntry.category)}</span>
              <span className={diagramCenterStyles.tag}>{formatToken(selectedEntry.stage)}</span>
              <span className={diagramCenterStyles.tag}>{formatToken(selectedEntry.required_tier)}</span>
              <span className={diagramCenterStyles.tag}>{selectedEntry.formats.preferred}</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-border-soft)] bg-[var(--uxa-color-muted-panel)] p-4">
                <p className="font-mono text-[10px] font-black uppercase tracking-[.16em] text-[var(--uxa-color-ink-muted)]">
                  {byLanguage(language, { en: "What it represents", es: "Que representa", pt: "O que representa" })}
                </p>
                <p className="mt-2 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">{selectedEntry.description}</p>
              </div>
              <div className="rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-border-soft)] bg-[var(--uxa-color-muted-panel)] p-4">
                <p className="font-mono text-[10px] font-black uppercase tracking-[.16em] text-[var(--uxa-color-ink-muted)]">
                  {byLanguage(language, { en: "Access rule", es: "Regla de acceso", pt: "Regra de acesso" })}
                </p>
                <p className="mt-2 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">{selectedEntry.access.reason}</p>
              </div>
            </div>
            <div className="rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-border-soft)] bg-white p-4">
              <p className="font-mono text-[10px] font-black uppercase tracking-[.16em] text-[var(--uxa-color-ink-muted)]">
                {byLanguage(language, { en: "Generation and formats", es: "Generacion y formatos", pt: "Geracao e formatos" })}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={diagramCenterStyles.tag}>{formatToken(selectedEntry.generation_mode)}</span>
                {selectedEntry.formats.available.map((format) => (
                  <span className={diagramCenterStyles.tag} key={format}>{format}</span>
                ))}
                {selectedEntry.exportable ? (
                  <span className={diagramCenterStyles.tag}>
                    {byLanguage(language, { en: "Exportable", es: "Exportable", pt: "Exportavel" })}
                  </span>
                ) : null}
              </div>
            </div>
            <ProfessionalArtifactViewer
              canCopy={tierScope !== "blueprint" && selectedEntry.access.can_download}
              canDownload={tierScope !== "blueprint" && selectedEntry.access.can_download}
              contentText={generatedMatch?.contentText}
              description={selectedEntry.description}
              detail={`${selectedEntry.key}\n\n${selectedEntry.description}\n\n${selectedEntry.access.cta_label || selectedEntry.access.reason}`}
              exportFormat={selectedEntry.formats.preferred}
              metadata={{
                ...(generatedMatch?.metadata ?? {}),
                artifact_key: selectedEntry.key,
                purpose: selectedEntry.description,
                source_refs: selectedEntry.context_policy?.short_term_refs ?? [],
              }}
              protectedView={tierScope === "blueprint"}
              stage={selectedEntry.stage}
              title={selectedEntry.title}
              versionLabel={generatedMatch?.versionLabel}
            />
          </div>
        ) : (
          <div className={diagramCenterStyles.viewerBody}>
            <div className={diagramCenterStyles.statePanel}>
              <div>
                <Boxes aria-hidden="true" size={28} />
                <h4>{byLanguage(language, { en: "No artifacts in this tier", es: "Sin artefactos en este tier", pt: "Sem artefatos neste tier" })}</h4>
                <p>{productTierDescription(language, tierScope)}</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </section>
  );
}

function canRenderBuildTracker(status: ProductBuildStatus | null | undefined) {
  return Boolean(status) && status?.entitlement?.purchase_required !== true;
}

function isExecutiveOverviewSection(section: ProductExperienceProductSection): section is ExecutiveOverviewProductSection {
  return section === "blueprint_overview" || section === "blueprint_pro_overview" || section === "acp_overview";
}

function ProductExecutiveOverviewPage({
  activeRoute,
  section,
}: {
  activeRoute: ProductExperienceRouteSnapshot | null;
  section: ExecutiveOverviewProductSection;
}) {
  if (section === "acp_overview") {
    return <AcpProductPage activeRoute={activeRoute} />;
  }

  return <BlueprintExecutiveOverviewPage activeRoute={activeRoute} section={section} />;
}

function BlueprintExecutiveOverviewPage({
  activeRoute,
  section,
}: {
  activeRoute: ProductExperienceRouteSnapshot | null;
  section: Exclude<ExecutiveOverviewProductSection, "acp_overview">;
}) {
  const { language } = useLanguage();
  const sessionId = activeRoute?.route.sessionId ?? "";
  const config = EXECUTIVE_OVERVIEW_CONFIG[section];
  const viewModel = buildProductSaasViewModel({
    activeRoute,
    language,
    section: config.viewModelSection,
  });
  const productBuild = useProductBuildStatus(sessionId, config.productKey, {
    polling: true,
    staleWhileRevalidating: true,
  });
  const overview = useMemo(
    () =>
      buildExecutiveOverviewModel({
        productKey: config.productKey,
        projectTitle: viewModel.title,
        sessionId,
        status: productBuild.data,
      }),
    [config.productKey, productBuild.data, sessionId, viewModel.title],
  );
  const shouldShowBuildTracker = canRenderBuildTracker(productBuild.data);

  return (
    <div className="space-y-5">
      <ExecutiveOverviewShell model={overview} status={productBuild.data}>
        {productBuild.isError ? (
          <UxaSurface className="border-[var(--uxa-state-danger-border)] bg-[var(--uxa-state-danger-bg)] p-4">
            <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[var(--uxa-state-danger)]">
              {config.errorTitle}
            </p>
            <p className="mt-2 text-[13px] leading-5 text-[var(--uxa-color-ink-soft)]">
              {config.errorDescription}
            </p>
          </UxaSurface>
        ) : null}
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <ExecutiveProductKeyDeliverables
              productKey={config.productKey}
              sessionId={sessionId}
              status={productBuild.data}
            />
          </div>
          <div className="space-y-5">
            {shouldShowBuildTracker ? (
              <DeliverableGenerationLiveTracker
                productKey={config.productKey}
                productLabel={overview.productLabel}
                status={productBuild.data}
                onProcessPending={() => productBuild.executeCommand("process_pending", { allow_llm: true })}
                onRetryFailed={() => productBuild.executeCommand("retry_failed", { allow_llm: true })}
                processingDisabled={productBuild.isFetching}
              />
            ) : null}
            <DeliverableProgressSummary groups={overview.deliverableGroups} />
            <ProductNextAction model={overview} />
          </div>
        </div>
      </ExecutiveOverviewShell>
      <UxaContextualActionDock
        label={byLanguage(language, {
          en: "Executive overview actions",
          es: "Acciones del resumen ejecutivo",
          pt: "Acoes do resumo executivo",
        })}
        scope={{
          helper: byLanguage(language, {
            en: "Product CTAs",
            es: "CTAs de este producto",
            pt: "CTAs deste produto",
          }),
          label: overview.productLabel,
          tone: "info",
        }}
      >
        <a className="uxa-button uxa-button--secondary" href={`/projects/${sessionId}/work/estimate`}>
          <span>
            {byLanguage(language, {
              en: "Back to Estimate",
              es: "Volver a Estimar",
              pt: "Voltar para Estimar",
            })}
          </span>
        </a>
        <a className="uxa-button uxa-button--primary" href={config.detailHref(sessionId)}>
          <span>{byLanguage(language, config.detailLabel)}</span>
          <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
        </a>
      </UxaContextualActionDock>
    </div>
  );
}

function normalizeBlueprintWorkbenchTab(value: string | null): BlueprintWorkbenchTab {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replaceAll("_", "-");

  if (normalized === "diagrams") {
    return "diagrams";
  }

  if (["governed-artifacts", "artifacts", "governed"].includes(normalized)) {
    return "governed-artifacts";
  }

  if (["commercial-artifacts", "commercial", "documents", "document", "descarga"].includes(normalized)) {
    return "commercial-artifacts";
  }

  return "overview";
}

function normalizeBlueprintFreeTab(value: string | null): BlueprintFreeTab {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replaceAll("_", "-");

  if (["tracking", "seguimiento", "overview"].includes(normalized)) {
    return "tracking";
  }

  if (normalized === "diagrams") {
    return "diagrams";
  }

  if (["deliverables", "artifacts", "artifactos", "artefactos", "entregables", "governed-artifacts"].includes(normalized)) {
    return "deliverables";
  }

  if (["pro", "blueprint-pro", "upgrade", "delta"].includes(normalized)) {
    return "pro";
  }

  return "result";
}

function BlueprintBuildInspector({
  compactWhenStable = false,
  productBuild,
  productKey,
  productLabel,
  stableSummary,
  title,
}: {
  compactWhenStable?: boolean;
  productBuild: ProductBuildStatusView;
  productKey: ExecutiveOverviewProductKey;
  productLabel: string;
  stableSummary: string;
  title: string;
}) {
  const { language } = useLanguage();
  const status = productBuild.data;
  const queue = status?.processing_queue ?? null;
  const failedCount =
    queue?.failed_count ??
    status?.deliverables?.filter((item) => item.state === "error").length ??
    0;
  const pendingCount =
    queue?.pending_count ??
    status?.deliverables?.filter((item) => item.state === "pending" || item.state === "stale").length ??
    0;
  const processingCount =
    queue?.processing_count ??
    status?.deliverables?.filter((item) => item.state === "queued" || item.state === "generating").length ??
    0;
  const completedCount =
    queue?.completed_count ??
    status?.deliverables?.filter((item) => item.state === "available").length ??
    0;
  const totalCount =
    queue?.total_count ??
    status?.progress.total_units ??
    status?.deliverables?.length ??
    completedCount + pendingCount + processingCount + failedCount;
  const progress = Math.max(0, Math.min(100, Math.round(status?.progress.percent ?? (totalCount ? (completedCount / totalCount) * 100 : 100))));
  const isRunning =
    queue?.active ||
    status?.lifecycle === "queued" ||
    status?.lifecycle === "preparing" ||
    status?.lifecycle === "running";
  const shouldOpen = Boolean(productBuild.isError || isRunning || failedCount > 0 || (!compactWhenStable && pendingCount > 0));
  const [isOpen, setIsOpen] = useState(shouldOpen || !compactWhenStable);

  useEffect(() => {
    let cancelled = false;
    if (shouldOpen) {
      deferStateUpdate(() => {
        if (!cancelled) {
          setIsOpen(true);
        }
      });
    }
    return () => {
      cancelled = true;
    };
  }, [shouldOpen]);

  const tone = productBuild.isError || failedCount > 0 ? "danger" : isRunning ? "info" : "success";
  const statusLabel = productBuild.isError
    ? byLanguage(language, { en: "Status unavailable", es: "Estado no disponible", pt: "Estado indisponivel" })
    : isRunning
      ? byLanguage(language, { en: "Generation running", es: "Generacion en curso", pt: "Geracao em andamento" })
      : byLanguage(language, { en: "Ready", es: "Listo", pt: "Pronto" });

  return (
    <details
      aria-label={byLanguage(language, {
        en: "Tracking inspector",
        es: "Inspector de seguimiento",
        pt: "Inspetor de acompanhamento",
      })}
      className="overflow-hidden rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-white shadow-[var(--uxa-shadow-card)]"
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
      open={isOpen}
    >
      <summary className="grid cursor-pointer list-none gap-3 px-4 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center [&::-webkit-details-marker]:hidden">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <UxaBadge tone={tone}>{statusLabel}</UxaBadge>
          <h2 className="text-[14px] font-black text-[var(--uxa-color-ink)]">{title}</h2>
          <span className="text-[12px] text-[var(--uxa-color-ink-soft)]">
            {completedCount || totalCount ? `${completedCount}/${totalCount || completedCount}` : stableSummary}
          </span>
        </div>
        <div className="flex min-w-0 items-center gap-3 md:min-w-[300px]">
          <div className="min-w-[140px] flex-1">
            <UxaProcessingStrip
              label={byLanguage(language, {
                en: `${productLabel} preparation progress`,
                es: `Progreso de preparacion ${productLabel}`,
                pt: `Progresso de preparacao ${productLabel}`,
              })}
              value={progress}
            />
          </div>
          <span className="text-[12px] font-black text-[var(--uxa-color-ink)]">{progress}%</span>
          <span className="text-[11px] font-semibold text-[var(--uxa-color-ink-muted)]">
            {byLanguage(language, { en: "Details", es: "Detalle", pt: "Detalhe" })}
          </span>
        </div>
      </summary>

      <div className="border-t border-[var(--uxa-color-border-soft)] p-4">
        {productBuild.isError ? (
          <p className="rounded-[var(--uxa-radius-md)] border border-[var(--uxa-state-danger-border)] bg-[var(--uxa-state-danger-bg)] p-3 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
            {byLanguage(language, {
              en: "The product status could not be loaded. The route keeps the current state and lets the next refresh reconcile progress.",
              es: "No se pudo cargar el estado del producto. La ruta conserva el estado actual y permite que el siguiente refresco reconcilie el progreso.",
              pt: "Nao foi possivel carregar o estado do produto. A rota conserva o estado atual e permite que a proxima atualizacao reconcilie o progresso.",
            })}
          </p>
        ) : canRenderBuildTracker(status) ? (
          <DeliverableGenerationLiveTracker
            productKey={productKey}
            productLabel={productLabel}
            status={status}
            onProcessPending={() => productBuild.executeCommand("process_pending", { allow_llm: true })}
            onRetryFailed={() => productBuild.executeCommand("retry_failed", { allow_llm: true })}
            processingDisabled={productBuild.isFetching}
          />
        ) : (
          <div className="grid gap-2 md:grid-cols-4">
            {[
              [byLanguage(language, { en: "Completed", es: "Completados", pt: "Concluidos" }), completedCount],
              [byLanguage(language, { en: "Pending", es: "Pendientes", pt: "Pendentes" }), pendingCount],
              [byLanguage(language, { en: "Processing", es: "En proceso", pt: "Em processo" }), processingCount],
              [byLanguage(language, { en: "Failed", es: "Fallidos", pt: "Falhos" }), failedCount],
            ].map(([label, value]) => (
              <div
                className="rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-border-soft)] bg-[var(--uxa-color-muted-panel)] px-3 py-2"
                key={String(label)}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)]">{label}</p>
                <p className="mt-1 text-[16px] font-black text-[var(--uxa-color-ink)]">{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}

function getCommercialMetadataText(artifact: ProductArtifactCard, key: string, fallback = "") {
  const value = artifact.metadata[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

function getCommercialMetadataList(artifact: ProductArtifactCard, key: string) {
  const value = artifact.metadata[key];
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function BlueprintCommercialArtifactPanel({
  artifactCards,
  tierScope,
}: {
  artifactCards: ReturnType<typeof buildProductSaasViewModel>["artifactCards"];
  tierScope: ProductTierScope;
}) {
  const { language } = useLanguage();
  const commercialArtifacts = useMemo(
    () =>
      artifactCards.filter(
        (artifact) =>
          artifact.isCommercial &&
          !artifact.isDiagram &&
          isTierIncluded(resolveArtifactTier(artifact), tierScope),
      ),
    [artifactCards, tierScope],
  );
  const [selectedKey, setSelectedKey] = useState(commercialArtifacts[0]?.key ?? "");
  const effectiveSelectedKey =
    selectedKey && commercialArtifacts.some((artifact) => artifact.key === selectedKey)
      ? selectedKey
      : commercialArtifacts[0]?.key ?? "";
  const selectedArtifact = commercialArtifacts.find((artifact) => artifact.key === effectiveSelectedKey) ?? null;

  function fallbackPurpose(artifact: ProductArtifactCard) {
    const key = String(artifact.metadata.artifact_key ?? artifact.key).toLocaleLowerCase("es");
    if (key.includes("arquitectura")) {
      return byLanguage(language, {
        en: "High-level view of how the business need becomes architecture, tools, memory, and value.",
        es: "Vista de alto nivel de como la necesidad de negocio se convierte en arquitectura, herramientas, memoria y valor.",
        pt: "Visao de alto nivel de como a necessidade de negocio vira arquitetura, ferramentas, memoria e valor.",
      });
    }
    if (key.includes("comparativa")) {
      return byLanguage(language, {
        en: "Commercial comparison of effort, cost, savings and implementation scope.",
        es: "Comparativa comercial de esfuerzo, costo, ahorro y alcance de implementacion.",
        pt: "Comparativo comercial de esforco, custo, economia e escopo de implementacao.",
      });
    }
    return byLanguage(language, {
      en: "Professional material prepared to explain value, scope and product continuity.",
      es: "Material profesional preparado para explicar valor, alcance y continuidad del producto.",
      pt: "Material profissional preparado para explicar valor, escopo e continuidade do produto.",
    });
  }

  if (!commercialArtifacts.length) {
    return (
      <p className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-[var(--uxa-color-muted-panel)] p-4 text-[13px] text-[var(--uxa-color-ink-soft)]">
        {byLanguage(language, {
          en: "The professional document has not been prepared yet. The generation queue can continue without changing product gates.",
          es: "El documento profesional aun no ha sido preparado. La cola de generacion puede continuar sin cambiar gates del producto.",
          pt: "O documento profissional ainda nao foi preparado. A fila de geracao pode continuar sem alterar gates do produto.",
        })}
      </p>
    );
  }

  return (
    <section aria-label="Documento profesional Blueprint" className={diagramCenterStyles.workspace}>
      <section aria-label="Indice del documento" className={diagramCenterStyles.catalogPane}>
        <div className={diagramCenterStyles.paneHeader}>
          <div>
            <h3>{byLanguage(language, { en: "Document index", es: "Indice del documento", pt: "Indice do documento" })}</h3>
            <p>{commercialArtifacts.length} / {commercialArtifacts.length}</p>
          </div>
          <span className={diagramCenterStyles.tag}>{productTierLabel(language, tierScope)}</span>
        </div>
        <div className={diagramCenterStyles.catalogList}>
          {commercialArtifacts.map((artifact) => {
            const selected = selectedArtifact?.key === artifact.key;
            return (
              <article
                className={`${diagramCenterStyles.card} ${selected ? diagramCenterStyles.cardSelected : ""} ${diagramCenterStyles.listCard}`}
                key={artifact.key}
              >
                <div>
                  <div className={diagramCenterStyles.cardTop}>
                    <span className={diagramCenterStyles.tag}>{artifact.exportFormat}</span>
                    <span className={`${diagramCenterStyles.status} ${diagramCenterStyles.statusAvailable}`}>
                      {byLanguage(language, { en: "Ready", es: "Listo", pt: "Pronto" })}
                    </span>
                  </div>
                  <button
                    aria-pressed={selected}
                    className={diagramCenterStyles.cardTitleButton}
                    onClick={() => setSelectedKey(artifact.key)}
                    type="button"
                  >
                    <h4>{artifact.label}</h4>
                    <p>{getCommercialMetadataText(artifact, "purpose", fallbackPurpose(artifact))}</p>
                  </button>
                </div>
                <div className={diagramCenterStyles.cardFooter}>
                  <button className={diagramCenterStyles.cardAction} onClick={() => setSelectedKey(artifact.key)} type="button">
                    {byLanguage(language, { en: "View", es: "Ver", pt: "Ver" })}
                    <ArrowUpRight aria-hidden="true" size={12} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <aside aria-label="Visor del documento profesional" className={diagramCenterStyles.viewerPane}>
        {selectedArtifact ? (
          <div className={diagramCenterStyles.viewerBody}>
            <div>
              <h3 className={diagramCenterStyles.viewerTitle}>{selectedArtifact.label}</h3>
              <p className={diagramCenterStyles.viewerDescription}>
                {getCommercialMetadataText(selectedArtifact, "purpose", fallbackPurpose(selectedArtifact))}
              </p>
            </div>
            <div className={diagramCenterStyles.viewerMeta}>
              <span className={diagramCenterStyles.tag}>{selectedArtifact.exportFormat}</span>
              <span className={diagramCenterStyles.tag}>{selectedArtifact.stage}</span>
              <span className={diagramCenterStyles.tag}>{selectedArtifact.versionLabel}</span>
            </div>
            <div className="rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-border-soft)] bg-white p-4">
              <p className="font-mono text-[10px] font-black uppercase tracking-[.16em] text-[var(--uxa-color-ink-muted)]">
                {byLanguage(language, { en: "Contents", es: "Contenido", pt: "Conteudo" })}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(getCommercialMetadataList(selectedArtifact, "contains").length
                  ? getCommercialMetadataList(selectedArtifact, "contains")
                  : [
                      byLanguage(language, {
                        en: "Executive narrative and professional product evidence.",
                        es: "Narrativa ejecutiva y evidencia profesional del producto.",
                        pt: "Narrativa executiva e evidencia profissional do produto.",
                      }),
                    ]
                ).map((item) => (
                  <span className={diagramCenterStyles.tag} key={item}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <ProfessionalArtifactViewer
              canCopy={tierScope !== "blueprint"}
              canDownload={tierScope !== "blueprint"}
              contentText={selectedArtifact.contentText}
              description={getCommercialMetadataText(selectedArtifact, "purpose", fallbackPurpose(selectedArtifact))}
              detail={selectedArtifact.detail}
              exportFormat={selectedArtifact.exportFormat}
              metadata={selectedArtifact.metadata}
              protectedView={tierScope === "blueprint"}
              stage={selectedArtifact.stage}
              title={selectedArtifact.label}
              versionLabel={selectedArtifact.versionLabel}
            />
          </div>
        ) : null}
      </aside>
    </section>
  );
}

function BlueprintProCompactTrackingPanel({
  downloadGate,
  productBuild,
  sessionId,
}: {
  downloadGate: ReturnType<typeof buildProductSaasViewModel>["blueprintDownload"];
  productBuild: ProductBuildStatusView;
  sessionId: string;
}) {
  const { language } = useLanguage();
  const status = productBuild.data;
  const queue = status?.processing_queue ?? null;
  const deliverables = (status?.deliverables ?? []).filter(
    (item) => !item.product_surface || item.product_surface === "blueprint_pro",
  );
  const failedCount =
    queue?.failed_count ??
    deliverables.filter((item) => item.state === "error").length;
  const pendingCount =
    queue?.pending_count ??
    deliverables.filter((item) => item.state === "pending" || item.state === "stale").length;
  const processingCount =
    queue?.processing_count ??
    deliverables.filter((item) => item.state === "queued" || item.state === "generating").length;
  const completedCount =
    queue?.completed_count ??
    deliverables.filter((item) => item.state === "available").length;
  const totalCount =
    queue?.total_count ??
    status?.progress.total_units ??
    deliverables.length;
  const isRunning = Boolean(
    queue?.active ||
      status?.lifecycle === "queued" ||
      status?.lifecycle === "preparing" ||
      status?.lifecycle === "running",
  );
  const progress = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        queue?.total_count
          ? ((queue.total_count - pendingCount - processingCount) / Math.max(1, queue.total_count)) * 100
          : downloadGate.allowed
            ? 100
            : (status?.progress.percent ?? (totalCount ? (completedCount / totalCount) * 100 : 0)),
      ),
    ),
  );
  const isCompletedWithoutFailures = status?.lifecycle === "completed" && failedCount === 0;
  const canRetryQueue = Boolean(failedCount > 0 && !queue?.active && !productBuild.isFetching);
  const canProcessQueue = Boolean(pendingCount > 0 && !isCompletedWithoutFailures && !queue?.active && !productBuild.isFetching);
  const statusTone: UxaTone = productBuild.isError
    ? "danger"
    : failedCount
      ? "danger"
      : isRunning
        ? "info"
        : downloadGate.allowed
          ? "success"
          : "warning";
  const statusLabel = productBuild.isError
    ? byLanguage(language, { en: "Status unavailable", es: "Estado no disponible", pt: "Estado indisponivel" })
    : failedCount
      ? byLanguage(language, { en: "Needs review", es: "Requiere revision", pt: "Requer revisao" })
      : isRunning
        ? byLanguage(language, { en: "Generation running", es: "Generacion en curso", pt: "Geracao em andamento" })
        : downloadGate.allowed
          ? byLanguage(language, { en: "Download ready", es: "Descarga lista", pt: "Download pronto" })
          : byLanguage(language, { en: "Package queued", es: "Paquete en cola", pt: "Pacote em fila" });

  const buildGroup = (
    key: "diagrams" | "artifacts" | "document",
    predicate: (item: (typeof deliverables)[number]) => boolean,
  ) => {
    const items = deliverables.filter(predicate);
    const completed = items.filter((item) => item.state === "available").length;
    const failed = items.filter((item) => item.state === "error").length;
    const active = items.filter((item) => item.state === "queued" || item.state === "generating").length;
    const pending = items.filter((item) => item.state === "pending" || item.state === "stale").length;
    const total = items.length;
    const tone: UxaTone = failed
      ? "danger"
      : active || (isRunning && !total)
        ? "info"
        : pending || (!total && !downloadGate.allowed)
          ? "warning"
          : "success";
    const fallbackLabel =
      downloadGate.allowed
        ? byLanguage(language, { en: "Ready", es: "Listo", pt: "Pronto" })
        : isRunning
          ? byLanguage(language, { en: "Running", es: "En curso", pt: "Em andamento" })
          : byLanguage(language, { en: "Queued", es: "En cola", pt: "Em fila" });

    return {
      active,
      completed,
      failed,
      key,
      pending,
      progressLabel: total ? `${completed}/${total}` : fallbackLabel,
      tone,
      total,
    };
  };

  const diagramGroup = buildGroup("diagrams", (item) => item.deliverable_type === "diagram");
  const documentGroup = buildGroup(
    "document",
    (item) => item.deliverable_type === "document" || item.deliverable_type === "package",
  );
  const artifactGroup = buildGroup(
    "artifacts",
    (item) => item.deliverable_type !== "diagram" && item.deliverable_type !== "document" && item.deliverable_type !== "package",
  );

  const componentRows = [
    {
      description: byLanguage(language, {
        en: "Architecture, orchestration, memory and security assets are generated from validated context.",
        es: "Arquitectura, orquestacion, memoria y seguridad se generan desde el contexto validado.",
        pt: "Arquitetura, orquestracao, memoria e seguranca sao geradas a partir do contexto validado.",
      }),
      group: diagramGroup,
      label: byLanguage(language, { en: "Pro diagrams", es: "Diagramas Pro", pt: "Diagramas Pro" }),
    },
    {
      description: byLanguage(language, {
        en: "Specifications, contracts and comparison artifacts are completed with the existing information.",
        es: "Especificaciones, contratos y comparativas se completan con la informacion existente.",
        pt: "Especificacoes, contratos e comparativos sao completados com a informacao existente.",
      }),
      group: artifactGroup,
      label: byLanguage(language, { en: "Pro artifacts", es: "Artefactos Pro", pt: "Artefatos Pro" }),
    },
    {
      description: byLanguage(language, {
        en: "The downloadable package closes at the end so it includes the latest generated assets.",
        es: "El paquete descargable se arma al final para incluir los activos mas recientes.",
        pt: "O pacote para download e montado no fim para incluir os ativos mais recentes.",
      }),
      group: documentGroup,
      label: byLanguage(language, { en: "Downloadable document", es: "Documento descargable", pt: "Documento para download" }),
    },
  ];

  const queueCards = [
    {
      detail: diagramGroup.failed
        ? byLanguage(language, { en: "Needs review", es: "Requiere revision", pt: "Requer revisao" })
        : diagramGroup.active || (isRunning && !diagramGroup.total)
          ? byLanguage(language, { en: "Generating diagram", es: "Generando diagrama", pt: "Gerando diagrama" })
          : diagramGroup.pending
            ? byLanguage(language, { en: "Queued", es: "En cola", pt: "Em fila" })
            : byLanguage(language, { en: "Completed", es: "Completado", pt: "Concluido" }),
      title: byLanguage(language, { en: "Agent architecture", es: "Arquitectura de agentes", pt: "Arquitetura de agentes" }),
    },
    {
      detail: artifactGroup.failed
        ? byLanguage(language, { en: "Needs review", es: "Requiere revision", pt: "Requer revisao" })
        : artifactGroup.active
          ? byLanguage(language, { en: "Updating artifact", es: "Actualizando artefacto", pt: "Atualizando artefato" })
          : artifactGroup.pending || isRunning
            ? byLanguage(language, { en: "Queued", es: "En cola", pt: "Em fila" })
            : byLanguage(language, { en: "Completed", es: "Completado", pt: "Concluido" }),
      title: "Security guardrails",
    },
    {
      detail: documentGroup.failed
        ? byLanguage(language, { en: "Needs review", es: "Requiere revision", pt: "Requer revisao" })
        : downloadGate.allowed
          ? byLanguage(language, { en: "Ready to download", es: "Listo para descargar", pt: "Pronto para download" })
          : documentGroup.active
            ? byLanguage(language, { en: "Preparing package", es: "Preparando paquete", pt: "Preparando pacote" })
            : byLanguage(language, { en: "Waiting for queue close", es: "Esperando cierre de cola", pt: "Aguardando fechamento da fila" }),
      title: byLanguage(language, { en: "Downloadable package", es: "Paquete descargable", pt: "Pacote para download" }),
    },
  ];

  return (
    <section
      aria-label={byLanguage(language, {
        en: "Tracking inspector",
        es: "Inspector de seguimiento",
        pt: "Inspetor de acompanhamento",
      })}
      className="grid min-h-[560px] overflow-hidden rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-border-soft)] lg:grid-cols-[minmax(0,1fr)_280px]"
    >
      <div className="min-w-0 p-4">
        <UxaBadge tone={statusTone}>{statusLabel}</UxaBadge>
        <h3 className="mt-3 max-w-4xl text-[19px] font-black leading-tight text-[var(--uxa-color-ink)]">
          {downloadGate.allowed
            ? byLanguage(language, {
                en: "LAB prepared the Pro package without asking for new answers.",
                es: "LAB preparo el paquete Pro sin pedir nuevas respuestas.",
                pt: "LAB preparou o pacote Pro sem pedir novas respostas.",
              })
            : byLanguage(language, {
                en: "LAB is preparing the Pro package without asking for new answers.",
                es: "LAB esta preparando el paquete Pro sin pedir nuevas respuestas.",
                pt: "LAB esta preparando o pacote Pro sem pedir novas respostas.",
              })}
        </h3>
        <p className="mt-2 max-w-4xl text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
          {byLanguage(language, {
            en: "Blueprint Pro takes what was validated in Free, generates professional assets and keeps open points as ACP input. This screen focuses on progress, review and download.",
            es: "Blueprint Pro toma lo validado en Free, genera activos profesionales y deja los puntos abiertos como insumo del ACP. Esta pantalla se concentra en progreso, revision y descarga.",
            pt: "Blueprint Pro usa o que foi validado no Free, gera ativos profissionais e deixa pontos abertos como insumo do ACP. Esta tela concentra progresso, revisao e download.",
          })}
        </p>

        <div className="mt-4 overflow-x-auto rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-border-soft)]">
          <div className="grid min-h-9 min-w-[620px] grid-cols-[180px_minmax(0,1fr)_120px] items-center gap-3 bg-[var(--uxa-color-muted-panel)] px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.12em] text-[var(--uxa-color-ink-muted)]">
            <span>{byLanguage(language, { en: "Component", es: "Componente", pt: "Componente" })}</span>
            <span>{byLanguage(language, { en: "Status", es: "Estado", pt: "Estado" })}</span>
            <span>{byLanguage(language, { en: "Progress", es: "Progreso", pt: "Progresso" })}</span>
          </div>
          {componentRows.map((row) => (
            <div
              className="grid min-h-[52px] min-w-[620px] grid-cols-[180px_minmax(0,1fr)_120px] items-center gap-3 border-t border-[var(--uxa-color-border-soft)] px-3 py-2"
              key={row.label}
            >
              <strong className="text-[12px] text-[var(--uxa-color-ink)]">{row.label}</strong>
              <span className="text-[11px] leading-5 text-[var(--uxa-color-ink-soft)]">{row.description}</span>
              <span className="justify-self-start">
                <UxaBadge tone={row.group.tone}>{row.group.progressLabel}</UxaBadge>
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <article className="rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-brand)] bg-[var(--uxa-color-brand-soft)] p-3">
            <UxaBadge tone="success">{byLanguage(language, { en: "Available", es: "Disponible", pt: "Disponivel" })}</UxaBadge>
            <h4 className="mt-3 text-[13px] font-black text-[var(--uxa-color-ink)]">
              {byLanguage(language, { en: "Review generated assets", es: "Revisar activos generados", pt: "Revisar ativos gerados" })}
            </h4>
            <p className="mt-1 text-[11px] leading-5 text-[var(--uxa-color-ink-soft)]">
              {byLanguage(language, {
                en: "The user can open diagrams and artifacts while the final document finishes.",
                es: "El usuario puede abrir diagramas y artefactos mientras el documento final termina.",
                pt: "O usuario pode abrir diagramas e artefatos enquanto o documento final termina.",
              })}
            </p>
          </article>
          <article className="rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-border-soft)] bg-white p-3">
            <UxaBadge tone="warning">{byLanguage(language, { en: "For ACP", es: "Para ACP", pt: "Para ACP" })}</UxaBadge>
            <h4 className="mt-3 text-[13px] font-black text-[var(--uxa-color-ink)]">
              {byLanguage(language, { en: "ACP context", es: "Contexto para ACP", pt: "Contexto para ACP" })}
            </h4>
            <p className="mt-1 text-[11px] leading-5 text-[var(--uxa-color-ink-soft)]">
              {byLanguage(language, {
                en: "Open points are preserved as construction context; they do not block Blueprint Pro visualization.",
                es: "Los puntos abiertos se conservan como contexto de construccion; no bloquean la visualizacion de Blueprint Pro.",
                pt: "Pontos abertos sao preservados como contexto de construcao; nao bloqueiam a visualizacao do Blueprint Pro.",
              })}
            </p>
          </article>
        </div>

        {productBuild.isError ? (
          <p className="mt-4 rounded-[var(--uxa-radius-md)] border border-[var(--uxa-state-danger-border)] bg-[var(--uxa-state-danger-bg)] p-3 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
            {byLanguage(language, {
              en: "The product status could not be loaded. The route keeps the current state and lets the next refresh reconcile progress.",
              es: "No se pudo cargar el estado del producto. La ruta conserva el estado actual y permite que el siguiente refresco reconcilie el progreso.",
              pt: "Nao foi possivel carregar o estado do produto. A rota conserva o estado atual e permite que a proxima atualizacao reconcilie o progresso.",
            })}
          </p>
        ) : null}
      </div>

      <aside className="border-t border-[var(--uxa-color-border-soft)] bg-[var(--uxa-color-muted-panel)] p-4 lg:border-l lg:border-t-0">
        <h3 className="text-[13px] font-black text-[var(--uxa-color-ink)]">
          {byLanguage(language, { en: "Product queue", es: "Cola del producto", pt: "Fila do produto" })}
        </h3>
        <div className="mt-3 grid gap-2">
          {queueCards.map((item) => (
            <div className="rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-border-soft)] bg-white p-3" key={item.title}>
              <strong className="block text-[11px] leading-4 text-[var(--uxa-color-ink)]">{item.title}</strong>
              <span className="mt-1 block text-[10px] leading-4 text-[var(--uxa-color-ink-muted)]">{item.detail}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {canRetryQueue ? (
            <button className="uxa-button uxa-button--primary" onClick={() => void productBuild.executeCommand("retry_failed", { allow_llm: true })} type="button">
              {byLanguage(language, { en: "Retry queue", es: "Reintentar cola", pt: "Tentar fila novamente" })}
            </button>
          ) : canProcessQueue ? (
            <button className="uxa-button uxa-button--primary" onClick={() => void productBuild.executeCommand("process_pending", { allow_llm: true })} type="button">
              {byLanguage(language, { en: "Process queue", es: "Procesar cola", pt: "Processar fila" })}
            </button>
          ) : (
            <span className="inline-flex min-h-10 items-center rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-border-soft)] bg-white px-3 text-[12px] font-black text-[var(--uxa-color-ink-soft)]">
              {progress}% {byLanguage(language, { en: "ready", es: "listo", pt: "pronto" })}
            </span>
          )}
          <a className="uxa-button uxa-button--secondary" href={`/projects/${sessionId}/acp`}>
            {byLanguage(language, { en: "View ACP", es: "Ver ACP", pt: "Ver ACP" })}
          </a>
        </div>
      </aside>
    </section>
  );
}

function BlueprintPostUpgradeWorkbench({
  artifactCards,
  downloadGate,
  productBuild,
  sessionId,
  tierScope,
}: {
  artifactCards: ReturnType<typeof buildProductSaasViewModel>["artifactCards"];
  downloadGate?: ReturnType<typeof buildProductSaasViewModel>["blueprintDownload"];
  productBuild?: ProductBuildStatusView;
  sessionId: string;
  tierScope: ProductTierScope;
}) {
  const { language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("result_tab");
  const [localSelection, setLocalSelection] = useState<{
    source: string | null;
    tab: BlueprintWorkbenchTab;
  } | null>(null);
  const activeTab =
    localSelection?.source === requestedTab
      ? localSelection.tab
      : normalizeBlueprintWorkbenchTab(requestedTab);
  const productKey: ExecutiveOverviewProductKey =
    tierScope === "blueprint" ? "blueprint_basic" : tierScope === "acp" ? "acp" : "blueprint_pro";
  const productLabel = productTierLabel(language, tierScope);
  const diagramCatalogFilter = useMemo(
    () => (item: DiagramCatalogItem) => isTierIncluded(item.required_tier, tierScope),
    [tierScope],
  );
  const currentStage = tierScope === "blueprint" ? "estimate" : "package";
  const status = productBuild?.data ?? null;
  const tabs: Array<{ key: BlueprintWorkbenchTab; label: string; description: string }> = [
    {
      key: "overview",
      label: byLanguage(language, { en: "Tracking", es: "Seguimiento", pt: "Acompanhamento" }),
      description: byLanguage(language, {
        en: "Progress, available assets and next product action.",
        es: "Progreso, activos disponibles y siguiente accion de producto.",
        pt: "Progresso, ativos disponiveis e proxima acao de produto.",
      }),
    },
    {
      key: "diagrams",
      label: byLanguage(language, { en: "Diagrams", es: "Diagramas", pt: "Diagramas" }),
      description: byLanguage(language, {
        en: "Governed visual catalog reused from Diagram Center.",
        es: "Catalogo visual gobernado reutilizado desde Diagram Center.",
        pt: "Catalogo visual governado reutilizado desde Diagram Center.",
      }),
    },
    {
      key: "governed-artifacts",
      label: byLanguage(language, { en: "Artifacts", es: "Artefactos", pt: "Artefatos" }),
      description: byLanguage(language, {
        en: "Functional and technical deliverables by tier.",
        es: "Entregables funcionales y tecnicos por tier.",
        pt: "Entregaveis funcionais e tecnicos por tier.",
      }),
    },
    {
      key: "commercial-artifacts",
      label: byLanguage(language, { en: "Document", es: "Documento", pt: "Documento" }),
      description: byLanguage(language, {
        en: "Professional package viewer and export evidence.",
        es: "Visor del paquete profesional y evidencia de exportacion.",
        pt: "Visualizador do pacote profissional e evidencia de exportacao.",
      }),
    },
  ];

  function buildWorkbenchHref(tab: BlueprintWorkbenchTab) {
    const baseHref =
      tierScope === "acp"
        ? `/projects/${sessionId}/acp`
        : tierScope === "blueprint"
          ? `/projects/${sessionId}/blueprint`
          : `/projects/${sessionId}/blueprint/pro`;
    return tab === "overview" ? baseHref : `${baseHref}?result_tab=${tab}`;
  }

  function selectTab(tab: BlueprintWorkbenchTab) {
    setLocalSelection({ source: requestedTab, tab });
    if (typeof window !== "undefined" && window.location.pathname.includes(`/projects/${sessionId}/blueprint`)) {
      router.push(buildWorkbenchHref(tab));
    }
  }

  return (
    <section aria-labelledby="blueprint-post-upgrade-workbench-title" className="space-y-3" id="blueprint-pro-workbench">
      <h2 id="blueprint-post-upgrade-workbench-title" className="sr-only">
        {byLanguage(language, {
          en: `${productLabel} workbench`,
          es: `Workbench ${productLabel}`,
          pt: `Workbench ${productLabel}`,
        })}
      </h2>
      <section
        aria-label={tierScope === "blueprint_pro" ? "Area de trabajo Blueprint Pro" : "Area de trabajo Blueprint"}
        className="min-w-0"
      >
        <article className="min-h-[620px] overflow-hidden rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-white shadow-[var(--uxa-shadow-card)]">
          <div
            aria-label={byLanguage(language, {
              en: "Workbench views",
              es: "Vistas del workbench",
              pt: "Vistas do workbench",
            })}
            className="flex gap-2 overflow-x-auto border-b border-[var(--uxa-color-border-soft)] bg-[var(--uxa-color-muted-panel)] p-2"
            role="tablist"
          >
            {tabs.map((tab) => {
              const selected = activeTab === tab.key;
              return (
                <a
                  aria-controls={`blueprint-workbench-panel-${tab.key}`}
                  aria-selected={selected}
                  className={cn(
                    "min-h-9 rounded-[var(--uxa-radius-md)] border px-3 text-[12px] font-black transition",
                    selected
                      ? "border-[var(--uxa-color-border)] bg-white text-[var(--uxa-color-brand)] shadow-xs"
                      : "border-transparent text-[var(--uxa-color-ink-soft)] hover:bg-white",
                  )}
                  href={buildWorkbenchHref(tab.key)}
                  id={`blueprint-workbench-tab-${tab.key}`}
                  key={tab.key}
                  onClick={(event) => {
                    event.preventDefault();
                    selectTab(tab.key);
                  }}
                  role="tab"
                  title={tab.description}
                >
                  {tab.label}
                </a>
              );
            })}
          </div>

          <div className="p-3 md:p-4">
            {activeTab === "overview" ? (
              <div
                aria-labelledby="blueprint-workbench-tab-overview"
                id="blueprint-workbench-panel-overview"
                role="tabpanel"
              >
                {tierScope === "blueprint_pro" && productBuild && downloadGate ? (
                  <BlueprintProCompactTrackingPanel
                    downloadGate={downloadGate}
                    productBuild={productBuild}
                    sessionId={sessionId}
                  />
                ) : productBuild?.isError ? (
                  <p className="rounded-[var(--uxa-radius-md)] border border-[var(--uxa-state-danger-border)] bg-[var(--uxa-state-danger-bg)] p-3 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
                    {byLanguage(language, {
                      en: "The product status could not be loaded. The route keeps the current state and lets the next refresh reconcile progress.",
                      es: "No se pudo cargar el estado del producto. La ruta conserva el estado actual y permite que el siguiente refresco reconcilie el progreso.",
                      pt: "Nao foi possivel carregar o estado do produto. A rota conserva o estado atual e permite que a proxima atualizacao reconcilie o progresso.",
                    })}
                  </p>
                ) : canRenderBuildTracker(status) ? (
                  <DeliverableGenerationLiveTracker
                    productKey={productKey}
                    productLabel={productLabel}
                    status={status}
                    onProcessPending={() => productBuild?.executeCommand("process_pending", { allow_llm: true })}
                    onRetryFailed={() => productBuild?.executeCommand("retry_failed", { allow_llm: true })}
                    processingDisabled={productBuild?.isFetching ?? false}
                  />
                ) : (
                  <UxaSurface className="p-4" muted>
                    <UxaBadge tone="neutral">
                      {byLanguage(language, { en: "No live status", es: "Sin estado vivo", pt: "Sem estado ao vivo" })}
                    </UxaBadge>
                    <h3 className="mt-3 text-[16px] font-black text-[var(--uxa-color-ink)]">
                      {byLanguage(language, {
                        en: `${productLabel} tracking`,
                        es: `Seguimiento de ${productLabel}`,
                        pt: `Acompanhamento de ${productLabel}`,
                      })}
                    </h3>
                    <p className="mt-2 max-w-3xl text-[13px] leading-5 text-[var(--uxa-color-ink-soft)]">
                      {productTierDescription(language, tierScope)}
                    </p>
                  </UxaSurface>
                )}
              </div>
            ) : null}

            {activeTab === "diagrams" ? (
              <div
                aria-labelledby="blueprint-workbench-tab-diagrams"
                id="blueprint-workbench-panel-diagrams"
                role="tabpanel"
              >
                <DiagramCenterPage
                  catalogFilter={diagramCatalogFilter}
                  engineLabel={byLanguage(language, {
                    en: "Governed catalog",
                    es: "Catalogo gobernado",
                    pt: "Catalogo governado",
                  })}
                  initialViewMode="list"
                  projectId={sessionId}
                  subtitle={productTierDescription(language, tierScope)}
                  title={byLanguage(language, {
                    en: `${productTierLabel(language, tierScope)} diagrams`,
                    es: `Diagramas de ${productTierLabel(language, tierScope)}`,
                    pt: `Diagramas de ${productTierLabel(language, tierScope)}`,
                  })}
                />
              </div>
            ) : null}

            {activeTab === "governed-artifacts" ? (
              <div
                aria-labelledby="blueprint-workbench-tab-governed-artifacts"
                id="blueprint-workbench-panel-governed-artifacts"
                role="tabpanel"
              >
                <ProductDeliverableCatalog
                  artifactCards={artifactCards}
                  currentStage={currentStage}
                  sessionId={sessionId}
                  tierScope={tierScope}
                />
              </div>
            ) : null}

            {activeTab === "commercial-artifacts" ? (
              <div
                aria-labelledby="blueprint-workbench-tab-commercial-artifacts"
                id="blueprint-workbench-panel-commercial-artifacts"
                role="tabpanel"
              >
                <BlueprintCommercialArtifactPanel artifactCards={artifactCards} tierScope={tierScope} />
              </div>
            ) : null}
          </div>
        </article>
      </section>
    </section>
  );
}

function blueprintFreeHeroProgress(state: string, buildProgress: number, hasSvg: boolean) {
  if (hasSvg) return 100;
  if (state === "updating") return 78;
  if (state === "generating") return 66;
  if (state === "queued") return 38;
  if (state === "pending") return Math.max(18, Math.min(52, buildProgress));
  if (state === "error") return Math.max(12, Math.min(32, buildProgress));
  return Math.max(24, Math.min(88, buildProgress));
}

function BlueprintFreeAgentOrchestrationSkeleton() {
  const nodes = [
    { key: "orchestrator", label: "Orquestador", detail: "Planifica y enruta", tone: "brand" },
    { key: "analysis", label: "Agente analisis", detail: "Lee contexto", tone: "info" },
    { key: "design", label: "Agente diseno", detail: "Propone arquitectura", tone: "info" },
    { key: "memory", label: "Memoria", detail: "RAG y checkpoints", tone: "success" },
    { key: "tools", label: "Herramientas", detail: "MCP, APIs y acciones", tone: "success" },
    { key: "guardrails", label: "Guardrails + HITL", detail: "Control humano", tone: "warning" },
    { key: "output", label: "Resultado", detail: "Dossier validado", tone: "brand" },
  ];
  return (
    <div className="rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-border-soft)] bg-[linear-gradient(90deg,rgba(30,64,175,0.06)_1px,transparent_1px),linear-gradient(180deg,rgba(30,64,175,0.06)_1px,transparent_1px),#f8fafc] bg-[length:32px_32px] p-3">
      <div className="grid gap-2 md:grid-cols-[1fr_1.3fr_1fr]">
        <div className="flex items-center">
          <article className="w-full rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-border)] bg-white p-3 shadow-sm">
            <span className="font-mono text-[10px] font-black uppercase tracking-[0.1em] text-[var(--uxa-color-brand)]">
              {nodes[0].label}
            </span>
            <p className="mt-1 text-[12px] font-bold text-[var(--uxa-color-ink-soft)]">{nodes[0].detail}</p>
          </article>
        </div>
        <div className="grid gap-2">
          {nodes.slice(1, 6).map((node) => (
            <article
              className="rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-border-soft)] bg-white p-3 shadow-sm"
              key={node.key}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="font-mono text-[10px] font-black uppercase tracking-[0.1em] text-[var(--uxa-color-ink-muted)]">
                    {node.label}
                  </span>
                  <p className="mt-1 text-[12px] font-bold text-[var(--uxa-color-ink)]">{node.detail}</p>
                </div>
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    node.tone === "success"
                      ? "bg-emerald-700"
                      : node.tone === "warning"
                        ? "bg-amber-600"
                        : "bg-sky-700",
                  )}
                />
              </div>
            </article>
          ))}
        </div>
        <div className="flex items-center">
          <article className="w-full rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-border)] bg-white p-3 shadow-sm">
            <span className="font-mono text-[10px] font-black uppercase tracking-[0.1em] text-[var(--uxa-color-brand)]">
              {nodes[6].label}
            </span>
            <p className="mt-1 text-[12px] font-bold text-[var(--uxa-color-ink-soft)]">{nodes[6].detail}</p>
          </article>
        </div>
      </div>
    </div>
  );
}

function BlueprintFreeAgentOrchestrationHero({
  buildProgress,
  language,
  sessionId,
}: {
  buildProgress: number;
  language: SupportedLanguage;
  sessionId: string;
}) {
  const {
    catalog,
    catalogStatus,
    detail,
    detailStatus,
    error,
    generate,
    job,
    selectedKey,
    setSelectedKey,
  } = useDiagramCenter(sessionId);
  const item = catalog?.entries.find((entry) => entry.key === BLUEPRINT_FREE_HERO_DIAGRAM_KEY) ?? null;
  const detailMatchesHero = detail?.item.key === BLUEPRINT_FREE_HERO_DIAGRAM_KEY;
  const svgSource =
    detailMatchesHero && detail?.renderings.svg
      ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(detail.renderings.svg)}`
      : "";
  const state = job?.diagram_key === BLUEPRINT_FREE_HERO_DIAGRAM_KEY ? job.status : item?.generation_state ?? "pending";
  const hasSvg = Boolean(svgSource);
  const progress = blueprintFreeHeroProgress(state, buildProgress, hasSvg);
  const quality = detailMatchesHero ? detail?.quality : null;
  const isWorking = ["queued", "generating", "updating"].includes(state) || catalogStatus === "loading" || detailStatus === "loading";
  const canGenerate = Boolean(item?.access.can_generate && (state === "pending" || state === "error"));
  const readyChecks = AGENT_ORCHESTRATION_MINIMUM_CHECKS.filter((check) => quality?.checks?.[check.key]).length;
  const qualityIsComplete = Boolean(
    hasSvg &&
      quality?.valid &&
      readyChecks === AGENT_ORCHESTRATION_MINIMUM_CHECKS.length,
  );
  const orchestrationValueItems = [
    {
      detail: byLanguage(language, {
        en: "Separates intake, planning, execution and validation.",
        es: "Separa recepcion, planeacion, ejecucion y validacion.",
        pt: "Separa recepcao, planejamento, execucao e validacao.",
      }),
      icon: GitBranch,
      label: byLanguage(language, { en: "Clear responsibilities", es: "Responsabilidades claras", pt: "Responsabilidades claras" }),
    },
    {
      detail: byLanguage(language, {
        en: "Shows where context, memory, tools and outputs move.",
        es: "Muestra donde se mueve contexto, memoria, herramientas y salidas.",
        pt: "Mostra onde contexto, memoria, ferramentas e saidas se movem.",
      }),
      icon: Boxes,
      label: byLanguage(language, { en: "Controlled handoffs", es: "Handoffs controlados", pt: "Handoffs controlados" }),
    },
    {
      detail: byLanguage(language, {
        en: "Identifies guardrails and human control before building.",
        es: "Identifica guardrails y control humano antes de construir.",
        pt: "Identifica guardrails e controle humano antes de construir.",
      }),
      icon: ListChecks,
      label: byLanguage(language, { en: "Visible risk", es: "Riesgo visible", pt: "Risco visivel" }),
    },
  ];
  const statusLabel = hasSvg
    ? byLanguage(language, { en: "Ready in Free", es: "Visible en Free", pt: "Visivel no Free" })
    : state === "error" || catalogStatus === "error" || detailStatus === "error"
      ? byLanguage(language, { en: "Needs retry", es: "Requiere reintento", pt: "Requer nova tentativa" })
      : isWorking
        ? byLanguage(language, { en: "Generating", es: "Generando", pt: "Gerando" })
        : byLanguage(language, { en: "Preparing", es: "Preparando", pt: "Preparando" });

  useEffect(() => {
    if (item && selectedKey !== BLUEPRINT_FREE_HERO_DIAGRAM_KEY) {
      setSelectedKey(BLUEPRINT_FREE_HERO_DIAGRAM_KEY);
    }
  }, [item, selectedKey, setSelectedKey]);

  return (
    <article
      aria-label={byLanguage(language, {
        en: "Blueprint Free agent orchestration",
        es: "Orquestacion agentiva de Blueprint Free",
        pt: "Orquestracao agentiva do Blueprint Free",
      })}
      aria-live="polite"
      className="mt-4 overflow-hidden rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-white"
    >
      <div className="grid gap-3 border-b border-[var(--uxa-color-border-soft)] bg-[var(--uxa-color-muted-panel)] p-3 md:grid-cols-[minmax(0,1fr)_300px] md:items-center">
        <div>
          <div className="flex flex-wrap gap-2">
            <UxaBadge tone="info">
              {byLanguage(language, { en: "Hook diagram", es: "Diagrama gancho", pt: "Diagrama gancho" })}
            </UxaBadge>
            <UxaBadge tone={hasSvg ? "success" : isWorking ? "info" : "warning"}>{statusLabel}</UxaBadge>
            <UxaBadge tone="warning">
              {byLanguage(language, { en: "No Free download", es: "Sin descarga en Free", pt: "Sem download no Free" })}
            </UxaBadge>
          </div>
          <h3 className="mt-3 text-[20px] font-black leading-tight text-[var(--uxa-color-ink)]">
            {byLanguage(language, {
              en: "Your agent already has a first operating orchestration.",
              es: "Tu agente ya tiene una primera orquestacion operativa.",
              pt: "Seu agente ja tem uma primeira orquestracao operacional.",
            })}
          </h3>
          <p className="mt-2 max-w-4xl text-[13px] leading-5 text-[var(--uxa-color-ink-soft)]">
            {byLanguage(language, {
              en: "LAB is turning the estimate into a map of agents, tools, memory, guardrails and control points. You can see it in Free; professional export remains in Pro.",
              es: "LAB esta convirtiendo la estimacion en un mapa de agentes, herramientas, memoria, guardrails y puntos de control. Lo puedes ver en Free; la exportacion profesional queda en Pro.",
              pt: "LAB esta convertendo a estimativa em um mapa de agentes, ferramentas, memoria, guardrails e pontos de controle. Voce pode ver no Free; a exportacao profissional fica no Pro.",
            })}
          </p>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between gap-3 text-[12px] font-black text-[var(--uxa-color-ink)]">
            <span>
              {byLanguage(language, { en: "Generation progress", es: "Progreso de generacion", pt: "Progresso de geracao" })}
            </span>
            <span>{progress}%</span>
          </div>
          <UxaProcessingStrip
            label={byLanguage(language, {
              en: "Agent orchestration generation",
              es: "Generacion de orquestacion agentiva",
              pt: "Geracao de orquestracao agentiva",
            })}
            value={progress}
          />
        </div>
      </div>

      <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_220px] 2xl:grid-cols-[minmax(0,1fr)_240px]">
        <div className="min-h-[420px] p-3">
          {hasSvg ? (
            <div
              aria-label={byLanguage(language, {
                en: "Agent orchestration preview",
                es: "Vista de orquestacion agentiva",
                pt: "Visualizacao de orquestracao agentiva",
              })}
              className="relative flex min-h-[390px] overflow-auto rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-border-soft)] bg-[var(--uxa-color-muted-panel)] p-2"
              onContextMenu={(event) => event.preventDefault()}
              role="region"
              tabIndex={0}
            >
              {/* SVG is loaded as an image resource so active markup is not injected into the DOM. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={byLanguage(language, {
                  en: "Agent orchestration diagram",
                  es: "Diagrama de orquestacion agentiva",
                  pt: "Diagrama de orquestracao agentiva",
                })}
                className="pointer-events-none m-auto h-full max-h-[540px] min-h-[360px] w-full select-none object-contain"
                draggable={false}
                onContextMenu={(event) => event.preventDefault()}
                onDragStart={(event) => event.preventDefault()}
                src={svgSource}
              />
              <span className="absolute right-3 top-3 rounded-full border border-[var(--uxa-color-border)] bg-white/95 px-3 py-1 font-mono text-[10px] font-black uppercase tracking-[0.08em] text-[var(--uxa-color-ink-muted)]">
                {byLanguage(language, { en: "Download in Pro", es: "Descarga en Pro", pt: "Download no Pro" })}
              </span>
            </div>
          ) : (
            <BlueprintFreeAgentOrchestrationSkeleton />
          )}
        </div>

        <aside className="border-t border-[var(--uxa-color-border-soft)] bg-[var(--uxa-color-muted-panel)] p-3 xl:border-l xl:border-t-0">
          {qualityIsComplete ? (
            <div className="rounded-[var(--uxa-radius-md)] border border-emerald-200 bg-emerald-50 p-3">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.12em] text-emerald-800">
                {byLanguage(language, { en: "Validated diagram", es: "Diagrama validado", pt: "Diagrama validado" })}
              </p>
              <p className="mt-1 text-[12px] font-bold leading-5 text-emerald-900">
                {byLanguage(language, {
                  en: "Complete diagram, ready to review.",
                  es: "Diagrama completo y listo para revisar.",
                  pt: "Diagrama completo e pronto para revisar.",
                })}
              </p>
            </div>
          ) : null}

          <p className={cn(
            "font-mono text-[10px] font-black uppercase tracking-[0.12em] text-[var(--uxa-color-brand)]",
            qualityIsComplete ? "mt-3" : "",
          )}>
            {byLanguage(language, { en: "First in queue", es: "Primero en cola", pt: "Primeiro na fila" })}
          </p>
          <h4 className="mt-2 text-[14px] font-black leading-5 text-[var(--uxa-color-ink)]">
            {byLanguage(language, {
              en: "Technical value for your agent",
              es: "Valor tecnico para tu agente",
              pt: "Valor tecnico para seu agente",
            })}
          </h4>
          <p className="mt-2 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
            {byLanguage(language, {
              en: "This diagram lets you verify the operating design before investing in a deeper build.",
              es: "Este diagrama te permite validar el diseno operativo antes de invertir en una construccion mas profunda.",
              pt: "Este diagrama permite validar o desenho operacional antes de investir em uma construcao mais profunda.",
            })}
          </p>

          <div className="mt-3 space-y-2">
            {orchestrationValueItems.map(({ detail, icon: Icon, label }) => (
              <div className="flex gap-2 border-t border-[var(--uxa-color-border-soft)] pt-2 first:border-t-0 first:pt-0" key={label}>
                <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[var(--uxa-color-brand)]" />
                <div>
                  <p className="text-[11px] font-black text-[var(--uxa-color-ink)]">{label}</p>
                  <p className="mt-0.5 text-[11px] leading-4 text-[var(--uxa-color-ink-soft)]">{detail}</p>
                </div>
              </div>
            ))}
          </div>

          {hasSvg ? (
            <p className="mt-3 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
              {byLanguage(language, {
                en: "Use it to detect missing responsibilities, risky handoffs or unclear controls before writing implementation specs.",
                es: "Usalo para detectar responsabilidades faltantes, handoffs riesgosos o controles poco claros antes de escribir especificaciones.",
                pt: "Use para detectar responsabilidades ausentes, handoffs arriscados ou controles pouco claros antes de escrever especificacoes.",
              })}
            </p>
          ) : (
            <p className="mt-3 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
              {byLanguage(language, {
                en: "While it is being prepared, the preview stays active so the screen never feels empty.",
                es: "Mientras se prepara, la vista previa permanece activa para que la pantalla nunca quede vacia.",
                pt: "Enquanto ela e preparada, a visualizacao permanece ativa para que a tela nunca fique vazia.",
              })}
            </p>
          )}
          {error || state === "error" ? (
            <p className="mt-3 rounded-[var(--uxa-radius-md)] border border-[var(--uxa-state-danger-border)] bg-[var(--uxa-state-danger-bg)] p-3 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
              {byLanguage(language, {
                en: "The preview could not be updated yet. You can retry without leaving Blueprint Free.",
                es: "La vista aun no se pudo actualizar. Puedes reintentar sin salir de Blueprint Free.",
                pt: "A visualizacao ainda nao pode ser atualizada. Voce pode tentar novamente sem sair do Blueprint Free.",
              })}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {canGenerate ? (
              <UxaButton onClick={() => void generate(BLUEPRINT_FREE_HERO_DIAGRAM_KEY, "user_request")} size="sm" variant="primary">
                <Sparkles aria-hidden="true" className="h-4 w-4" />
                {state === "error"
                  ? byLanguage(language, { en: "Retry", es: "Reintentar", pt: "Tentar novamente" })
                  : byLanguage(language, { en: "Generate", es: "Generar", pt: "Gerar" })}
              </UxaButton>
            ) : null}
            <a className="uxa-button uxa-button--secondary" href={`/projects/${sessionId}/diagrams?diagram=${BLUEPRINT_FREE_HERO_DIAGRAM_KEY}`}>
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
              {byLanguage(language, { en: "Open viewer", es: "Abrir visor", pt: "Abrir visualizador" })}
            </a>
          </div>
        </aside>
      </div>
    </article>
  );
}

function BlueprintFreePostUpgradeExperience({
  language,
  sessionId,
  viewModel,
}: {
  language: SupportedLanguage;
  sessionId: string;
  viewModel: ReturnType<typeof buildProductSaasViewModel>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("result_tab");
  const [feedback, setFeedback] = useState<"link" | "markdown" | "print" | null>(null);
  const [localSelection, setLocalSelection] = useState<{
    source: string | null;
    tab: BlueprintFreeTab;
  } | null>(null);
  const productBuild = useProductBuildStatus(sessionId, "blueprint_basic", {
    polling: true,
    staleWhileRevalidating: true,
  });
  const activeTab =
    localSelection?.source === requestedTab
      ? localSelection.tab
      : normalizeBlueprintFreeTab(requestedTab);
  const diagramCatalogFilter = useMemo(() => (item: DiagramCatalogItem) => isTierIncluded(item.required_tier, "blueprint"), []);
  const highlights = viewModel.blueprintHighlights.slice(0, 4);
  const resultHighlights = highlights.length
    ? highlights
    : [
        {
          detail: viewModel.title,
          key: "problem",
          status: "ready",
          title: byLanguage(language, { en: "Validated problem", es: "Problema validado", pt: "Problema validado" }),
        },
        {
          detail: viewModel.estimate.detail,
          key: "estimate",
          status: "ready",
          title: byLanguage(language, { en: "Estimated value", es: "Valor estimado", pt: "Valor estimado" }),
        },
      ];
  const comparison = viewModel.blueprintComparison;
  const status = productBuild.data;
  const queue = status?.processing_queue ?? null;
  const deliverables = (status?.deliverables ?? []).filter(
    (item) => !item.product_surface || item.product_surface === "blueprint_basic",
  );
  const failedCount =
    queue?.failed_count ??
    deliverables.filter((item) => item.state === "error").length;
  const pendingCount =
    queue?.pending_count ??
    deliverables.filter((item) => item.state === "pending" || item.state === "stale").length;
  const processingCount =
    queue?.processing_count ??
    deliverables.filter((item) => item.state === "queued" || item.state === "generating").length;
  const completedCount =
    queue?.completed_count ??
    deliverables.filter((item) => item.state === "available").length;
  const totalCount =
    queue?.total_count ??
    status?.progress.total_units ??
    deliverables.length ??
    completedCount + pendingCount + processingCount + failedCount;
  const progress = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        queue?.total_count
          ? ((queue.total_count - pendingCount - processingCount) / Math.max(1, queue.total_count)) * 100
          : (status?.progress.percent ?? (totalCount ? (completedCount / totalCount) * 100 : 0)),
      ),
    ),
  );
  const isRunning = Boolean(
    queue?.active ||
      status?.lifecycle === "queued" ||
      status?.lifecycle === "preparing" ||
      status?.lifecycle === "running" ||
      productBuild.isLoading ||
      productBuild.isFetching,
  );
  const statusTone: UxaTone = productBuild.isError
    ? "danger"
    : failedCount
      ? "danger"
      : isRunning
        ? "info"
        : status || totalCount
          ? "success"
          : "neutral";
  const statusLabel = productBuild.isError
    ? byLanguage(language, { en: "Status unavailable", es: "Estado no disponible", pt: "Estado indisponivel" })
    : failedCount
      ? byLanguage(language, { en: "Needs review", es: "Requiere revision", pt: "Requer revisao" })
      : isRunning
        ? byLanguage(language, { en: "Processing", es: "Procesando", pt: "Processando" })
        : status || totalCount
          ? byLanguage(language, { en: "Result ready", es: "Resultado listo", pt: "Resultado pronto" })
          : byLanguage(language, { en: "Syncing", es: "Sincronizando", pt: "Sincronizando" });
  const processingSummary = productBuild.isError
    ? byLanguage(language, {
        en: "The live tracker could not be loaded. Refresh keeps the product route and retries the same backend source.",
        es: "No se pudo cargar el seguimiento vivo. Al refrescar se conserva la ruta del producto y se reintenta la misma fuente del backend.",
        pt: "Nao foi possivel carregar o acompanhamento ao vivo. Ao atualizar, a rota do produto e mantida e a mesma fonte do backend e consultada novamente.",
      })
    : isRunning
      ? byLanguage(language, {
          en: "LAB is preparing diagrams and deliverables while you review the validated result.",
          es: "LAB esta preparando diagramas y entregables mientras revisas el resultado validado.",
          pt: "LAB esta preparando diagramas e entregaveis enquanto voce revisa o resultado validado.",
        })
      : status || totalCount
        ? byLanguage(language, {
            en: "The base result is ready. You can review the generated assets or continue to Pro.",
            es: "El resultado base esta listo. Puedes revisar activos generados o continuar a Pro.",
            pt: "O resultado base esta pronto. Voce pode revisar ativos gerados ou continuar para Pro.",
          })
        : byLanguage(language, {
            en: "The validated result is available and the live tracker will hydrate as soon as the backend responds.",
            es: "El resultado validado esta disponible y el seguimiento vivo se hidratara cuando responda el backend.",
            pt: "O resultado validado esta disponivel e o acompanhamento ao vivo sera hidratado quando o backend responder.",
          });
  const tabs: Array<{ key: BlueprintFreeTab; label: string; description: string }> = [
    {
      key: "result",
      label: byLanguage(language, { en: "Result", es: "Resultado", pt: "Resultado" }),
      description: byLanguage(language, {
        en: "Validated one-pager and first value from Estimate.",
        es: "One-pager validado y primer valor despues de Estimar.",
        pt: "One-pager validado e primeiro valor depois da Estimativa.",
      }),
    },
    {
      key: "tracking",
      label: byLanguage(language, { en: "Tracking", es: "Seguimiento", pt: "Acompanhamento" }),
      description: byLanguage(language, {
        en: "Live product queue reused from previous stages.",
        es: "Cola viva del producto reutilizada desde etapas previas.",
        pt: "Fila viva do produto reutilizada das etapas previas.",
      }),
    },
    {
      key: "diagrams",
      label: byLanguage(language, { en: "Diagrams", es: "Diagramas", pt: "Diagramas" }),
      description: byLanguage(language, {
        en: "Governed Diagram Center filtered to Free.",
        es: "Diagram Center gobernado filtrado a Free.",
        pt: "Diagram Center governado filtrado para Free.",
      }),
    },
    {
      key: "deliverables",
      label: byLanguage(language, { en: "Deliverables", es: "Entregables", pt: "Entregaveis" }),
      description: byLanguage(language, {
        en: "Foundational deliverables and reusable artifact viewer.",
        es: "Entregables base y visor de artefactos reutilizado.",
        pt: "Entregaveis base e visualizador de artefatos reutilizado.",
      }),
    },
    {
      key: "pro",
      label: "Pro",
      description: byLanguage(language, {
        en: "Professional delta and upgrade path.",
        es: "Delta profesional y ruta de mejora.",
        pt: "Delta profissional e rota de upgrade.",
      }),
    },
  ];

  function buildFreeHref(tab: BlueprintFreeTab) {
    const baseHref = `/projects/${sessionId}/blueprint`;
    return tab === "result" ? baseHref : `${baseHref}?result_tab=${tab}`;
  }

  function selectTab(tab: BlueprintFreeTab) {
    setLocalSelection({ source: requestedTab, tab });
    if (typeof window !== "undefined" && window.location.pathname.includes(`/projects/${sessionId}/blueprint`)) {
      router.push(buildFreeHref(tab));
    }
  }

  function setTemporaryFeedback(nextFeedback: typeof feedback) {
    setFeedback(nextFeedback);
    window.setTimeout(() => setFeedback(null), 1800);
  }

  function buildShareUrl() {
    const href = `/projects/${sessionId}/blueprint`;
    if (typeof window === "undefined") return href;
    return new URL(href, window.location.origin).toString();
  }

  function buildMarkdown() {
    const items = BLUEPRINT_FREE_VALIDATED_ITEMS.map(
      (item) => `- ${byLanguage(language, item.label)} (${item.key})`,
    ).join("\n");
    return [
      `# Blueprint Free: ${viewModel.title || "Lean Agent Builder"}`,
      "",
      "## Entregables disponibles",
      items,
      "",
      `URL: ${buildShareUrl()}`,
    ].join("\n");
  }

  async function copyText(text: string, nextFeedback: "link" | "markdown") {
    if (typeof navigator?.clipboard?.writeText === "function") {
      await navigator.clipboard.writeText(text);
      setTemporaryFeedback(nextFeedback);
    }
  }

  function printOnePager() {
    window.print();
    setTemporaryFeedback("print");
  }

  return (
    <div className="space-y-5">
      <h1 className="sr-only">Blueprint Free</h1>

      <section aria-label="Area de trabajo Blueprint Free" className="min-w-0">
        <article className="min-h-[620px] overflow-hidden rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-white shadow-[var(--uxa-shadow-card)]">
          <div
            aria-label={byLanguage(language, {
              en: "Blueprint Free views",
              es: "Vistas de Blueprint Free",
              pt: "Vistas de Blueprint Free",
            })}
            className="flex gap-2 overflow-x-auto border-b border-[var(--uxa-color-border-soft)] bg-[var(--uxa-color-muted-panel)] p-2"
            role="tablist"
          >
            {tabs.map((tab) => {
              const selected = activeTab === tab.key;
              return (
                <a
                  aria-controls={`blueprint-free-panel-${tab.key}`}
                  aria-selected={selected}
                  className={cn(
                    "min-h-9 rounded-[var(--uxa-radius-md)] border px-3 text-[12px] font-black transition",
                    selected
                      ? "border-[var(--uxa-color-border)] bg-white text-[var(--uxa-color-brand)] shadow-xs"
                      : "border-transparent text-[var(--uxa-color-ink-soft)] hover:bg-white",
                  )}
                  href={buildFreeHref(tab.key)}
                  id={`blueprint-free-tab-${tab.key}`}
                  key={tab.key}
                  onClick={(event) => {
                    event.preventDefault();
                    selectTab(tab.key);
                  }}
                  role="tab"
                  title={tab.description}
                >
                  {tab.label}
                </a>
              );
            })}
          </div>

          <div className="p-3 md:p-4">
            {activeTab === "result" ? (
              <div
                aria-labelledby="blueprint-free-tab-result"
                id="blueprint-free-panel-result"
                role="tabpanel"
              >
                <section aria-label="Ficha de Proyecto Validado" id="blueprint-free-dossier">
                  <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <UxaBadge tone="success">
                          {byLanguage(language, {
                            en: "Blueprint Free included",
                            es: "Blueprint Free incluido",
                            pt: "Blueprint Free incluido",
                          })}
                        </UxaBadge>
                        <UxaBadge tone={statusTone}>{statusLabel}</UxaBadge>
                        {feedback ? (
                          <UxaBadge tone="info">
                            {byLanguage(language, { en: "Copied", es: "Copiado", pt: "Copiado" })}
                          </UxaBadge>
                        ) : null}
                      </div>
                      <h2 className="mt-3 text-[24px] font-black leading-tight text-[var(--uxa-color-ink)]">
                        {byLanguage(language, {
                          en: "Your idea is now a validated agent project.",
                          es: "Tu idea ya es un proyecto de agente validado.",
                          pt: "Sua ideia ja e um projeto de agente validado.",
                        })}
                      </h2>
                      <p className="mt-2 max-w-4xl text-[14px] leading-6 text-[var(--uxa-color-ink-soft)]">
                        {byLanguage(language, {
                          en: "LAB consolidated the problem, MVP scope, actors, estimate and minimum tools in an executive dossier. Engineering depth remains reserved for Blueprint Pro.",
                          es: "LAB consolido el problema, alcance MVP, actores, estimacion y herramientas minimas en un dossier ejecutivo. La profundidad de ingenieria queda reservada para Blueprint Pro.",
                          pt: "LAB consolidou o problema, escopo MVP, atores, estimativa e ferramentas minimas em um dossier executivo. A profundidade de engenharia fica reservada para Blueprint Pro.",
                        })}
                      </p>

                      <BlueprintFreeAgentOrchestrationHero
                        buildProgress={progress}
                        language={language}
                        sessionId={sessionId}
                      />

                      <div className="mt-4 rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-border-soft)] bg-[var(--uxa-color-muted-panel)] p-3">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-[var(--uxa-color-ink-muted)]">
                              {byLanguage(language, { en: "Live preparation", es: "Preparacion viva", pt: "Preparacao ao vivo" })}
                            </p>
                            <p className="mt-1 text-[12px] font-bold leading-5 text-[var(--uxa-color-ink-soft)]">
                              {processingSummary}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full border border-[var(--uxa-color-border)] bg-white px-3 py-1 text-[12px] font-black text-[var(--uxa-color-ink)]">
                            {totalCount ? `${completedCount}/${totalCount}` : `${progress}%`}
                          </span>
                        </div>
                        <div className="mt-3">
                          <UxaProcessingStrip
                            label={byLanguage(language, {
                              en: "Blueprint Free preparation progress",
                              es: "Progreso de preparacion Blueprint Free",
                              pt: "Progresso de preparacao Blueprint Free",
                            })}
                            value={progress}
                          />
                        </div>
                      </div>

                    </div>

                    <aside className="space-y-3">
                      <article className="rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-border)] bg-white p-4">
                        <UxaBadge tone="info">
                          {byLanguage(language, { en: "Shareable one-pager", es: "One-Pager compartible", pt: "One-Pager compartilhavel" })}
                        </UxaBadge>
                        <h3 className="mt-3 text-[16px] font-black text-[var(--uxa-color-ink)]">
                          {byLanguage(language, { en: "Agent executive sheet", es: "Ficha ejecutiva del agente", pt: "Ficha executiva do agente" })}
                        </h3>
                        <p className="mt-2 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
                          {byLanguage(language, {
                            en: "Free can be shared. Technical specification, contracts and professional download stay reserved for Pro.",
                            es: "Free se puede compartir. La especificacion tecnica, contratos y descarga profesional quedan reservados para Pro.",
                            pt: "Free pode ser compartilhado. A especificacao tecnica, contratos e download profissional ficam reservados para Pro.",
                          })}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <UxaButton onClick={() => void copyText(buildShareUrl(), "link")} size="sm" variant="secondary">
                            <Link2 aria-hidden="true" className="h-4 w-4" />
                            {byLanguage(language, { en: "Copy link", es: "Copiar enlace", pt: "Copiar link" })}
                          </UxaButton>
                          <UxaButton onClick={() => void copyText(buildMarkdown(), "markdown")} size="sm" variant="secondary">
                            <ClipboardCopy aria-hidden="true" className="h-4 w-4" />
                            {byLanguage(language, { en: "Copy Markdown", es: "Copiar Markdown", pt: "Copiar Markdown" })}
                          </UxaButton>
                          <UxaButton onClick={printOnePager} size="sm" variant="secondary">
                            <Printer aria-hidden="true" className="h-4 w-4" />
                            {byLanguage(language, { en: "Print", es: "Imprimir", pt: "Imprimir" })}
                          </UxaButton>
                        </div>
                      </article>

                      <div
                        aria-label={byLanguage(language, {
                          en: "Blueprint Free executive summary",
                          es: "Resumen ejecutivo Blueprint Free",
                          pt: "Resumo executivo Blueprint Free",
                        })}
                        className="space-y-2"
                        role="group"
                      >
                        {resultHighlights.map((item) => (
                          <article
                            className="rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-border-soft)] bg-white p-3"
                            key={item.key}
                          >
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--uxa-color-ink-muted)]">{item.title}</p>
                            <p className="mt-1 line-clamp-3 text-[12px] leading-5 text-[var(--uxa-color-ink)]">{item.detail}</p>
                          </article>
                        ))}
                      </div>
                    </aside>
                  </div>
                </section>
              </div>
            ) : null}

            {activeTab === "tracking" ? (
              <div
                aria-labelledby="blueprint-free-tab-tracking"
                id="blueprint-free-panel-tracking"
                role="tabpanel"
              >
                <BlueprintBuildInspector
                  productBuild={productBuild}
                  productKey="blueprint_basic"
                  productLabel="Blueprint"
                  stableSummary="6/6"
                  title={byLanguage(language, {
                    en: "Prepare Validated Project Sheet",
                    es: "Preparar Ficha de Proyecto Validado",
                    pt: "Preparar Ficha de Projeto Validado",
                  })}
                />
              </div>
            ) : null}

            {activeTab === "diagrams" ? (
              <div
                aria-labelledby="blueprint-free-tab-diagrams"
                id="blueprint-free-panel-diagrams"
                role="tabpanel"
              >
                <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-[var(--uxa-color-ink-muted)]">
                      {byLanguage(language, { en: "Hook diagrams", es: "Diagramas gancho", pt: "Diagramas gancho" })}
                    </p>
                    <h2 className="mt-1 text-[20px] font-black text-[var(--uxa-color-ink)]">
                      {byLanguage(language, {
                        en: "Free diagrams inside the governed LAB viewer.",
                        es: "Diagramas Free dentro del visor gobernado de LAB.",
                        pt: "Diagramas Free dentro do visualizador governado de LAB.",
                      })}
                    </h2>
                  </div>
                  <a className="uxa-button uxa-button--secondary" href={`/projects/${sessionId}/diagrams`}>
                    <ExternalLink aria-hidden="true" className="h-4 w-4" />
                    {byLanguage(language, { en: "Open full viewer", es: "Abrir visor completo", pt: "Abrir visualizador completo" })}
                  </a>
                </div>
                <DiagramCenterPage
                  catalogFilter={diagramCatalogFilter}
                  engineLabel={byLanguage(language, {
                    en: "Governed viewer",
                    es: "Visor gobernado",
                    pt: "Visualizador governado",
                  })}
                  initialViewMode="list"
                  projectId={sessionId}
                  subtitle={byLanguage(language, {
                    en: "Reusable diagram visualization component filtered to Blueprint Free.",
                    es: "Componente reutilizado de visualizacion de diagramas filtrado a Blueprint Free.",
                    pt: "Componente reutilizado de visualizacao de diagramas filtrado para Blueprint Free.",
                  })}
                  title={byLanguage(language, {
                    en: "Blueprint Free diagrams",
                    es: "Diagramas de Blueprint Free",
                    pt: "Diagramas de Blueprint Free",
                  })}
                />
              </div>
            ) : null}

            {activeTab === "deliverables" ? (
              <div
                aria-labelledby="blueprint-free-tab-deliverables"
                aria-label="Entregables del Blueprint Free"
                id="blueprint-free-panel-deliverables"
                role="tabpanel"
              >
                <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-[var(--uxa-color-ink-muted)]">
                      {byLanguage(language, { en: "Foundational package", es: "Paquete base", pt: "Pacote base" })}
                    </p>
                    <h2 className="mt-1 text-[20px] font-black text-[var(--uxa-color-ink)]">
                      {byLanguage(language, {
                        en: "6 foundational deliverables ready for the next decision.",
                        es: "6 entregables fundamentales listos para la siguiente decision.",
                        pt: "6 entregaveis fundamentais prontos para a proxima decisao.",
                      })}
                    </h2>
                  </div>
                  <span className="rounded-full border border-[var(--uxa-color-border)] bg-white px-3 py-1 text-[12px] font-black text-[var(--uxa-color-ink)]">
                    12 {byLanguage(language, { en: "Free pieces", es: "piezas Free", pt: "pecas Free" })}
                  </span>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {BLUEPRINT_FREE_VALIDATED_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <article
                        className="min-h-[132px] rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-border)] bg-white p-4"
                        key={item.key}
                      >
                        <div className="flex items-start gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--uxa-radius-md)] bg-[var(--uxa-color-brand-soft)] text-[var(--uxa-color-brand)]">
                            <Icon aria-hidden="true" className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <span className="font-mono text-[10px] font-black uppercase tracking-[0.12em] text-[var(--uxa-color-ink-muted)]">
                              {item.key}
                            </span>
                            <h3 className="mt-1 text-[14px] font-black leading-5 text-[var(--uxa-color-ink)]">
                              {byLanguage(language, item.label)}
                            </h3>
                          </div>
                        </div>
                        <p className="mt-3 line-clamp-3 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
                          {byLanguage(language, {
                            en: "Included in the executive Blueprint Free dossier and ready to support the next product decision.",
                            es: "Incluido en el dossier ejecutivo Blueprint Free y listo para soportar la siguiente decision de producto.",
                            pt: "Incluido no dossier executivo Blueprint Free e pronto para apoiar a proxima decisao de produto.",
                          })}
                        </p>
                      </article>
                    );
                  })}
                </div>
                <div className="mt-4">
                  <ProductDeliverableCatalog
                    artifactCards={viewModel.artifactCards}
                    currentStage="estimate"
                    sessionId={sessionId}
                    tierScope="blueprint"
                  />
                </div>
              </div>
            ) : null}

            {activeTab === "pro" ? (
              <div
                aria-labelledby="blueprint-free-tab-pro"
                id="blueprint-free-panel-pro"
                role="tabpanel"
              >
                <section aria-label="Delta hacia Blueprint Pro" id="blueprint-free-pro-delta">
                  <div className="max-w-4xl">
                    <UxaBadge tone="warning">
                      {byLanguage(language, { en: "Engineering delta", es: "Delta de ingenieria", pt: "Delta de engenharia" })}
                    </UxaBadge>
                    <h2 className="mt-3 text-[21px] font-black leading-tight text-[var(--uxa-color-ink)]">
                      {byLanguage(language, {
                        en: "Your diagnosis is ready. To build it without improvising, you need the how.",
                        es: "Tu diagnostico esta listo. Para construirlo sin improvisar, necesitas el como.",
                        pt: "Seu diagnostico esta pronto. Para construir sem improvisar, voce precisa do como.",
                      })}
                    </h2>
                  </div>
                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-border)] bg-white p-4">
                      <h3 className="text-[15px] font-black text-[var(--uxa-color-ink)]">Blueprint Free - USD 0</h3>
                      <div className="mt-3 space-y-3">
                        {[
                          byLanguage(language, { en: "Clear problem and opportunity", es: "Problema y oportunidad claros", pt: "Problema e oportunidade claros" }),
                          byLanguage(language, { en: "MVP scope and success criteria", es: "Alcance MVP y criterios de exito", pt: "Escopo MVP e criterios de sucesso" }),
                          byLanguage(language, { en: "Conceptual diagrams and economic hook", es: "Diagramas conceptuales y gancho economico", pt: "Diagramas conceituais e gancho economico" }),
                        ].map((item, index) => (
                          <div className="flex gap-3" key={item}>
                            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--uxa-color-muted-panel)] text-[12px] font-black">
                              {index + 1}
                            </span>
                            <p className="text-[13px] font-bold text-[var(--uxa-color-ink)]">{item}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-brand)] bg-[var(--uxa-color-brand-soft)] p-4">
                      <h3 className="text-[15px] font-black text-[var(--uxa-color-ink)]">Blueprint Pro - USD 39</h3>
                      <div className="mt-3 space-y-3">
                        {[
                          byLanguage(language, { en: "Technical architecture and memory strategy", es: "Arquitectura tecnica y estrategia de memoria", pt: "Arquitetura tecnica e estrategia de memoria" }),
                          byLanguage(language, { en: "Additional professional diagrams and artifacts", es: "Diagramas y artefactos profesionales adicionales", pt: "Diagramas e artefatos profissionais adicionais" }),
                          byLanguage(language, { en: "Downloadable professional document", es: "Documento profesional descargable", pt: "Documento profissional para download" }),
                        ].map((item, index) => (
                          <div className="flex gap-3" key={item}>
                            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-[12px] font-black text-[var(--uxa-color-brand)]">
                              {index + 1}
                            </span>
                            <p className="text-[13px] font-bold text-[var(--uxa-color-ink)]">{item}</p>
                          </div>
                        ))}
                      </div>
                      {comparison ? (
                        <p className="mt-4 rounded-[var(--uxa-radius-md)] bg-white/80 p-3 text-[12px] font-bold text-[var(--uxa-color-ink)]">
                          {byLanguage(language, {
                            en: `Estimated effort reduction: ${comparison.effortReductionPercent}%`,
                            es: `Reduccion de esfuerzo estimada: ${comparison.effortReductionPercent}%`,
                            pt: `Reducao de esforco estimada: ${comparison.effortReductionPercent}%`,
                          })}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </section>
              </div>
            ) : null}
          </div>
        </article>
      </section>

      <UxaContextualActionDock
        label={byLanguage(language, {
          en: "Blueprint Free actions",
          es: "Acciones de Blueprint Free",
          pt: "Acoes de Blueprint Free",
        })}
        scope={{
          helper: byLanguage(language, {
            en: "Product CTAs",
            es: "CTAs de este producto",
            pt: "CTAs deste produto",
          }),
          label: "Blueprint Free",
          tone: "info",
        }}
      >
        <a className="uxa-button uxa-button--secondary" href={`/projects/${sessionId}/work/estimate`}>
          <span>
            {byLanguage(language, {
              en: "Back to Estimate",
              es: "Volver a Estimacion",
              pt: "Voltar para Estimativa",
            })}
          </span>
        </a>
        <a className="uxa-button uxa-button--secondary" href={buildFreeHref("diagrams")}>
          <span>
            {byLanguage(language, {
              en: "Open diagram viewer",
              es: "Abrir visor de diagramas",
              pt: "Abrir visualizador de diagramas",
            })}
          </span>
        </a>
        <button className="uxa-button uxa-button--secondary" onClick={() => void copyText(buildShareUrl(), "link")} type="button">
          <span>
            {byLanguage(language, {
              en: "Copy sheet",
              es: "Copiar ficha",
              pt: "Copiar ficha",
            })}
          </span>
        </button>
        <a className="uxa-button uxa-button--primary" href={`/projects/${sessionId}/blueprint/pro`}>
          <span>
            {byLanguage(language, {
              en: "Unlock Blueprint Pro - USD 39",
              es: "Desbloquear Blueprint Pro - USD 39",
              pt: "Desbloquear Blueprint Pro - USD 39",
            })}
          </span>
        </a>
      </UxaContextualActionDock>
    </div>
  );
}

function BlueprintProAccessGate({
  checkoutState,
  downloadGate,
  premiumAssetCount,
  productProgress,
  purchasing,
  requestSent,
  unlocked,
}: {
  checkoutState?: string | null;
  downloadGate: ReturnType<typeof buildProductSaasViewModel>["blueprintDownload"];
  premiumAssetCount: number;
  productProgress: number;
  purchasing: boolean;
  requestSent: boolean;
  unlocked: boolean;
}) {
  const { language } = useLanguage();
  const canSelfActivate = checkoutState === "available" || checkoutState === "pending";
  const title = !unlocked
    ? requestSent
      ? byLanguage(language, {
          en: "Blueprint Pro is waiting for approval or activation",
          es: "Blueprint Pro esta esperando aprobacion o activacion",
          pt: "Blueprint Pro aguarda aprovacao ou ativacao",
        })
      : canSelfActivate
        ? byLanguage(language, {
            en: "Activate Blueprint Pro before opening the professional workspace",
            es: "Activa Blueprint Pro antes de abrir el workspace profesional",
            pt: "Ative Blueprint Pro antes de abrir o workspace profissional",
          })
        : byLanguage(language, {
            en: "Request Blueprint Pro access before continuing",
            es: "Solicita acceso a Blueprint Pro antes de continuar",
            pt: "Solicite acesso a Blueprint Pro antes de continuar",
          })
    : byLanguage(language, {
        en: "The professional workspace is active, but export is still protected",
        es: "El workspace profesional esta activo, pero la exportacion sigue protegida",
        pt: "O workspace profissional esta ativo, mas a exportacao segue protegida",
      });
  const description = !unlocked
    ? requestSent
      ? byLanguage(language, {
          en: "The request was registered. The professional workspace appears when approval or activation completes.",
          es: "La solicitud fue registrada. El workspace profesional aparece cuando termine la aprobacion o activacion.",
          pt: "A solicitacao foi registrada. O workspace profissional aparece quando a aprovacao ou ativacao terminar.",
        })
      : canSelfActivate
        ? byLanguage(language, {
            en: "Blueprint Free remains visible while checkout enables the professional workspace, diagrams and authenticated ZIP download.",
            es: "Blueprint Free sigue visible mientras el checkout habilita el workspace profesional, diagramas y descarga ZIP autenticada.",
            pt: "Blueprint Free continua visivel enquanto o checkout habilita o workspace profissional, diagramas e download ZIP autenticado.",
          })
        : byLanguage(language, {
            en: "This workspace requires explicit approval before the premium experience can start.",
            es: "Este workspace requiere aprobacion explicita antes de iniciar la experiencia premium.",
            pt: "Este workspace exige aprovacao explicita antes de iniciar a experiencia premium.",
          })
    : downloadGate.detail;
  const progress = Math.max(0, Math.min(100, Math.round(unlocked ? Math.max(productProgress, 68) : requestSent ? 35 : 22)));

  return (
    <UxaSurface className="p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <UxaBadge tone={!unlocked ? (requestSent ? "info" : "warning") : "warning"}>
              {!unlocked
                ? requestSent
                  ? byLanguage(language, { en: "Access requested", es: "Acceso solicitado", pt: "Acesso solicitado" })
                  : byLanguage(language, { en: "Activate Blueprint Pro", es: "Activar Blueprint Pro", pt: "Ativar Blueprint Pro" })
                : downloadGate.label}
            </UxaBadge>
            {purchasing ? (
              <UxaBadge tone="info">
                {byLanguage(language, { en: "Processing", es: "Procesando", pt: "Processando" })}
              </UxaBadge>
            ) : null}
          </div>
          <h2 className="mt-3 text-[20px] font-black text-[var(--uxa-color-ink)]">{title}</h2>
          <p className="mt-2 max-w-4xl text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">{description}</p>
        </div>
        <div className="grid min-w-[240px] grid-cols-2 gap-2">
          <div className="rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-border-soft)] bg-[var(--uxa-color-muted-panel)] p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)]">
              {byLanguage(language, { en: "Progress", es: "Progreso", pt: "Progresso" })}
            </p>
            <p className="mt-1 text-[16px] font-black">{progress}%</p>
          </div>
          <div className="rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-border-soft)] bg-[var(--uxa-color-muted-panel)] p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)]">
              {byLanguage(language, { en: "Assets", es: "Activos", pt: "Ativos" })}
            </p>
            <p className="mt-1 text-[16px] font-black">{premiumAssetCount}</p>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <UxaProcessingStrip
          label={byLanguage(language, {
            en: "Blueprint Pro access progress",
            es: "Progreso de acceso Blueprint Pro",
            pt: "Progresso de acesso Blueprint Pro",
          })}
          value={progress}
        />
      </div>
    </UxaSurface>
  );
}

function BlueprintProPostUpgradeExperience({
  canOpenAcp,
  checkoutState,
  downloadGate,
  premiumAssetCount,
  productBuild,
  productProgress,
  purchasing,
  requestSent,
  sessionId,
  unlocked,
  viewModel,
}: {
  canOpenAcp: boolean;
  checkoutState?: string | null;
  downloadGate: ReturnType<typeof buildProductSaasViewModel>["blueprintDownload"];
  premiumAssetCount: number;
  productBuild: ProductBuildStatusView;
  productProgress: number;
  purchasing: boolean;
  requestSent: boolean;
  sessionId: string;
  unlocked: boolean;
  viewModel: ReturnType<typeof buildProductSaasViewModel>;
}) {
  const { language } = useLanguage();
  const showAccessGate = !unlocked;

  return (
    <div className="space-y-5">
      <h1 className="sr-only">Blueprint Pro</h1>

      {showAccessGate ? (
        <BlueprintProAccessGate
          checkoutState={checkoutState}
          downloadGate={downloadGate}
          premiumAssetCount={premiumAssetCount}
          productProgress={productProgress}
          purchasing={purchasing}
          requestSent={requestSent}
          unlocked={unlocked}
        />
      ) : null}

      <BlueprintPostUpgradeWorkbench
        artifactCards={viewModel.artifactCards}
        downloadGate={downloadGate}
        productBuild={productBuild}
        sessionId={sessionId}
        tierScope="blueprint_pro"
      />

      {canOpenAcp ? (
        <p className="rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-border-soft)] bg-[var(--uxa-color-muted-panel)] p-3 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
          {byLanguage(language, {
            en: "ACP is enabled for this workspace. Continue from the persistent action dock when you are ready to build.",
            es: "ACP esta habilitado para este workspace. Continua desde el dock persistente cuando estes listo para construir.",
            pt: "ACP esta habilitado para este workspace. Continue pelo dock persistente quando estiver pronto para construir.",
          })}
        </p>
      ) : null}
    </div>
  );
}

function BlueprintProductPage({
  activeRoute,
}: {
  activeRoute: ProductExperienceRouteSnapshot | null;
}) {
  const { language } = useLanguage();
  const sessionId = activeRoute?.route.sessionId ?? "";
  const viewModel = buildProductSaasViewModel({
    activeRoute,
    language,
    section: "blueprint",
  });

  return (
    <BlueprintFreePostUpgradeExperience
      language={language}
      sessionId={sessionId}
      viewModel={viewModel}
    />
  );
}

function BlueprintProPage({
  activeRoute,
}: {
  activeRoute: ProductExperienceRouteSnapshot | null;
}) {
  const { language } = useLanguage();
  const sessionId = activeRoute?.route.sessionId ?? "";
  const viewModel = buildProductSaasViewModel({
    activeRoute,
    language,
    section: "blueprint_pro",
  });
  const unlocked =
    hasTier(viewModel.accessTier, "blueprint_pro") ||
    viewModel.canDownloadBlueprint;
  const canOpenAcp =
    hasTier(viewModel.accessTier, "acp") ||
    Boolean(viewModel.access?.can_build_acp);
  const canAcquireAcp = unlocked && !canOpenAcp;
  const blueprintProProgress =
    viewModel.products.find((product) => product.key === "blueprint_pro")?.progress ??
    (unlocked ? 75 : 20);
  const premiumAssetCount = viewModel.artifactCards.filter(
    (artifact) => resolveArtifactTier(artifact) === "blueprint_pro",
  ).length;
  const canCheckout =
    viewModel.access?.checkout_state === "available" ||
    viewModel.access?.checkout_state === "pending" ||
    viewModel.access?.checkout_state === "failed";

  const [purchasing, setPurchasing] = useState(false);
  const [requestSentProduct, setRequestSentProduct] = useState<"blueprint_pro" | "acp" | null>(null);
  const blueprintProRequestSent = requestSentProduct === "blueprint_pro" && !unlocked;
  const acpRequestSent = requestSentProduct === "acp" && !canOpenAcp;
  const [downloading, setDownloading] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState<InlineNotice | null>(null);
  const [checkoutNotice, setCheckoutNotice] = useState<InlineNotice | null>(null);
  const { market: checkoutMarket, setMarket: setCheckoutMarket } = useCheckoutMarketSelection();
  const productBuild = useProductBuildStatus(sessionId, "blueprint_pro", {
    polling: true,
    staleWhileRevalidating: true,
  });

  return (
    <div className="space-y-5">
      <BlueprintProPostUpgradeExperience
        canOpenAcp={canOpenAcp}
        checkoutState={viewModel.access?.checkout_state}
        downloadGate={viewModel.blueprintDownload}
        premiumAssetCount={premiumAssetCount}
        productBuild={productBuild}
        productProgress={blueprintProProgress}
        purchasing={purchasing}
        requestSent={blueprintProRequestSent}
        sessionId={sessionId}
        unlocked={unlocked}
        viewModel={viewModel}
      />
      <InlineNoticeBanner notice={downloadNotice || checkoutNotice} />
      <UxaContextualActionDock
        label={byLanguage(language, {
          en: "Blueprint Pro actions",
          es: "Acciones de Blueprint Pro",
          pt: "Acoes de Blueprint Profissional",
        })}
        scope={{
          helper: byLanguage(language, {
            en: "Product CTAs",
            es: "CTAs de este producto",
            pt: "CTAs deste produto",
          }),
          label: "Blueprint Pro",
          tone: unlocked ? "success" : "warning",
        }}
      >
        <a
          className="uxa-button uxa-button--secondary"
          href={`/projects/${sessionId}/blueprint`}
        >
          <span>
            {byLanguage(language, {
              en: "Back to Blueprint",
              es: "Volver al Blueprint",
              pt: "Voltar ao Blueprint",
            })}
          </span>
        </a>
        {unlocked ? (
          <a
            className="uxa-button uxa-button--secondary"
            href={`/projects/${sessionId}/artifacts`}
          >
            <span>
              {byLanguage(language, {
                en: "Open full viewer",
                es: "Abrir visor completo",
                pt: "Abrir visualizador completo",
              })}
            </span>
          </a>
        ) : null}
        {unlocked ? (
          viewModel.canDownloadBlueprint ? (
            <button
              className={cn(
                "uxa-button uxa-button--secondary",
                downloading && "opacity-60 cursor-not-allowed",
              )}
              disabled={downloading}
              onClick={async () => {
                if (downloading) return;
                setDownloadNotice(null);
                setDownloading(true);
                try {
                  const job = await executeBlueprintProDownload({ sessionId });
                  setDownloadNotice(
                    buildExportJobNotice(language, job, {
                      en: "Blueprint Pro",
                      es: "Blueprint Pro",
                      pt: "Blueprint Pro",
                    }),
                  );
                } finally {
                  setDownloading(false);
                }
              }}
              type="button"
            >
              <Download aria-hidden="true" className="mr-1.5 h-4 w-4" />
              <span>
                {downloading
                  ? byLanguage(language, {
                      en: "Preparing download...",
                      es: "Preparando descarga...",
                      pt: "Preparando download...",
                    })
                  : byLanguage(language, {
                      en: "Download Blueprint Pro",
                      es: "Descargar Blueprint Pro",
                      pt: "Baixar Blueprint Pro",
                    })}
              </span>
            </button>
          ) : (
            <button
              className="uxa-button uxa-button--secondary"
              disabled
              title={viewModel.blueprintDownload.detail}
              type="button"
            >
              <span>
                {byLanguage(language, {
                  en: "Download pending",
                  es: "Descarga pendiente",
                  pt: "Download pendente",
                })}
              </span>
            </button>
          )
        ) : null}
        {canCheckout && (!unlocked || canAcquireAcp) ? (
          <CheckoutMarketSelector
            language={language}
            market={checkoutMarket}
            onMarketChange={setCheckoutMarket}
          />
        ) : null}
        {unlocked ? (
          <>
            {canOpenAcp ? (
              <a
                className="uxa-button uxa-button--primary"
                href={`/projects/${sessionId}/acp`}
              >
                <span>
                  {byLanguage(language, {
                    en: "Open ACP",
                    es: "Abrir ACP",
                    pt: "Abrir ACP",
                  })}
                </span>
              </a>
            ) : (
              <button
                className={cn(
                  "uxa-button",
                  "uxa-button--primary",
                  purchasing && "opacity-60 cursor-not-allowed",
                )}
                disabled={purchasing}
                onClick={async () => {
                  if (purchasing) return;
                  setPurchasing(true);
                  setCheckoutNotice(null);
                  try {
                    if (canCheckout) {
                      await executeProductCheckout({
                        sessionId,
                        packageCode: checkoutMarketPackageCode("acp", checkoutMarket),
                        productKey: "acp",
                      });
                    } else {
                      const accessResult = await executeAccessRequestWithCheckoutFallback({
                        sessionId,
                        packageCode: checkoutMarketPackageCode("acp", checkoutMarket),
                        productKey: "acp",
                      });
                      if (accessResult.type === "checkout") {
                        return;
                      }
                      if (accessResult.response && accessResult.response.status === "approved") {
                        productExperienceStore.invalidateSession(sessionId);
                        window.location.assign(`/projects/${sessionId}/acp`);
                        return;
                      }
                      setRequestSentProduct("acp");
                    }
                  } catch (err) {
                    const message = err instanceof Error ? err.message : "Error al iniciar checkout";
                    setCheckoutNotice({
                      message: byLanguage(language, {
                        en: `Could not initiate payment: ${message}`,
                        es: `No se pudo iniciar el pago: ${message}`,
                        pt: `Não foi possível iniciar o pagamento: ${message}`,
                      }),
                      tone: "danger",
                    });
                  } finally {
                    setPurchasing(false);
                  }
                }}
                type="button"
              >
                <span>
                  {purchasing
                    ? byLanguage(language, {
                        en: "Processing...",
                        es: "Procesando...",
                        pt: "Processando...",
                      })
                    : acpRequestSent
                    ? byLanguage(language, {
                        en: "Request sent",
                        es: "Solicitud enviada",
                        pt: "Solicitacao enviada",
                      })
                    : canCheckout
                    ? byLanguage(language, {
                        en: "Get ACP",
                        es: "Adquirir ACP",
                        pt: "Adquirir ACP",
                      })
                    : byLanguage(language, {
                        en: "Request ACP",
                        es: "Solicitar ACP",
                        pt: "Solicitar ACP",
                      })}
                </span>
              </button>
            )}
          </>
        ) : (
          <button
            className={cn(
              "uxa-button uxa-button--primary",
              purchasing && "opacity-60 cursor-not-allowed",
            )}
            disabled={purchasing}
            onClick={async () => {
              if (purchasing) return;
              setPurchasing(true);
              setCheckoutNotice(null);
              try {
                if (canCheckout) {
                  await executeProductCheckout({
                    sessionId,
                    packageCode: checkoutMarketPackageCode("blueprint_pro", checkoutMarket),
                    productKey: "blueprint_pro",
                  });
                } else {
                  const accessResult = await executeAccessRequestWithCheckoutFallback({
                    sessionId,
                    packageCode: checkoutMarketPackageCode("blueprint_pro", checkoutMarket),
                    productKey: "blueprint_pro",
                  });
                  if (accessResult.type === "checkout") {
                    return;
                  }
                  if (accessResult.response && accessResult.response.status === "approved") {
                    window.location.reload();
                    return;
                  }
                  setRequestSentProduct("blueprint_pro");
                }
              } catch (err) {
                const message = err instanceof Error ? err.message : "Error al iniciar checkout";
                setCheckoutNotice({
                  message: byLanguage(language, {
                    en: `Could not initiate payment: ${message}`,
                    es: `No se pudo iniciar el pago: ${message}`,
                    pt: `Não foi posible iniciar o pagamento: ${message}`,
                  }),
                  tone: "danger",
                });
              } finally {
                setPurchasing(false);
              }
            }}
            type="button"
          >
            <span>
              {purchasing
                ? byLanguage(language, {
                    en: "Processing...",
                    es: "Procesando...",
                    pt: "Processando...",
                  })
                : blueprintProRequestSent
                ? byLanguage(language, {
                    en: "Request sent",
                    es: "Solicitud enviada",
                    pt: "Solicitacao enviada",
                  })
                : canCheckout
                ? byLanguage(language, {
                    en: "Get Blueprint Pro",
                    es: "Adquirir Blueprint Pro",
                    pt: "Adquirir Blueprint Pro",
                  })
                : byLanguage(language, {
                    en: "Request access",
                    es: "Solicitar acceso",
                    pt: "Solicitar acesso",
                  })}
            </span>
          </button>
        )}
      </UxaContextualActionDock>
    </div>
  );
}

function AcpProductPage({
  activeRoute,
}: {
  activeRoute: ProductExperienceRouteSnapshot | null;
}) {
  const { language } = useLanguage();
  const searchParams = useSearchParams();
  const sessionId = activeRoute?.route.sessionId ?? "";
  const viewModel = buildProductSaasViewModel({ activeRoute, language, section: "acp" });
  const canBuild =
    hasTier(viewModel.accessTier, "acp") ||
    Boolean(viewModel.access?.can_build_acp);
  const canCheckout =
    viewModel.access?.checkout_state === "available" ||
    viewModel.access?.checkout_state === "pending" ||
    viewModel.access?.checkout_state === "failed";

  const [purchasing, setPurchasing] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  // Estado del flujo guiado de 4 etapas (Resolver -> Validar -> Completar -> Empaquetar)
  const stepParam = searchParams?.get("step") ?? searchParams?.get("acp_tab");
  const initialStep: AcpWorkflowStep =
    stepParam === "validate" || stepParam === "complete" || stepParam === "package"
      ? stepParam
      : "resolve";
  const [currentStep, setCurrentStep] = useState<AcpWorkflowStep>(initialStep);
  const [questions, setQuestions] = useState<ConstructionQuestionViewEntry[]>([]);
  const [workspace, setWorkspace] = useState<ACPWorkspaceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [questionLoadStatus, setQuestionLoadStatus] = useState<AcpLoadStatus>("idle");
  const [questionLoadError, setQuestionLoadError] = useState<string | null>(null);
  const [workspaceLoadError, setWorkspaceLoadError] = useState<string | null>(null);
  const [showBlueprintArtifacts, setShowBlueprintArtifacts] = useState(false);
  const { market: checkoutMarket, setMarket: setCheckoutMarket } = useCheckoutMarketSelection();

  useEffect(() => {
    if (process.env.NODE_ENV === "test") return;
    if (!canBuild && sessionId) {
      productExperienceStore.invalidateSession(sessionId);
      void productExperienceStore.loadRoute({ currentStage: "validate", sessionId }, { force: true }).catch(() => {});
    }
  }, [canBuild, sessionId]);

  async function loadAcpPreparationData(options: { cancelled?: () => boolean } = {}) {
    if (!sessionId || !canBuild) return;
    try {
      setLoading(true);
      setQuestionLoadStatus("loading");
      setQuestionLoadError(null);
      setWorkspaceLoadError(null);

      const [questionsResult, workspaceResult] = await Promise.allSettled([
        sessionsApi.getAcpQuestions(sessionId),
        sessionsApi.getAcpWorkspace(sessionId),
      ]);

      if (options.cancelled?.()) return;

      if (questionsResult.status === "fulfilled") {
        setQuestions(questionsResult.value);
        setQuestionLoadStatus("ready");
      } else {
        setQuestionLoadStatus("error");
        setQuestionLoadError(getAcpLoadErrorMessage(questionsResult.reason));
      }

      if (workspaceResult.status === "fulfilled") {
        setWorkspace(workspaceResult.value);
      } else {
        setWorkspaceLoadError(getAcpLoadErrorMessage(workspaceResult.reason));
      }
    } catch (err) {
      if (options.cancelled?.()) return;
      setQuestionLoadStatus("error");
      setQuestionLoadError(getAcpLoadErrorMessage(err));
      setWorkspaceLoadError(getAcpLoadErrorMessage(err));
    } finally {
      if (!options.cancelled?.()) {
        setLoading(false);
      }
    }
  }

  const reloadData = () => loadAcpPreparationData();

  useEffect(() => {
    if (!sessionId || !canBuild) return;
    let cancelled = false;
    deferStateUpdate(() => {
      if (!cancelled) {
        void loadAcpPreparationData({ cancelled: () => cancelled });
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ACP debe hidratarse al cambiar entitlement o session; reloadData usa el estado actual del componente.
  }, [canBuild, sessionId]);

  const openQuestions = questions.filter(
    (q) => q.status === "open" || (!q.status && !q.answer_text),
  );
  const answeredQuestions = questions.filter(
    (q) => q.status === "answered" || q.status === "resolved",
  );
  const deferredQuestions = questions.filter((q) => q.status === "deferred");
  const isQuestionDataReady = questionLoadStatus === "ready";
  const isResolutionDone = isQuestionDataReady && openQuestions.length === 0;
  const completedAcpPhaseKeys = new Set(
    (workspace?.phases ?? [])
      .filter((phase) => phase.status === "completed" || phase.status === "completed_with_observations")
      .map((phase) => phase.phase_key),
  );
  const isValidationDone = [
    "acp_input_readiness",
    "acp_questions_resolution",
    "acp_test_suite",
    "acp_graphic_simulation",
    "acp_quality_gates",
  ].every((phaseKey) => completedAcpPhaseKeys.has(phaseKey));
  const isReconciliationDone = completedAcpPhaseKeys.has("acp_artifact_reconciliation");
  const isPackageDone =
    completedAcpPhaseKeys.has("acp_package_build") &&
    completedAcpPhaseKeys.has("acp_download_ready");

  const completedSteps: AcpWorkflowStep[] = [];
  if (isResolutionDone) completedSteps.push("resolve");
  if (isValidationDone) completedSteps.push("validate");
  if (isReconciliationDone) completedSteps.push("complete");
  if (isPackageDone) completedSteps.push("package");

  const canNavigateTo = (step: AcpWorkflowStep): boolean => {
    if (step === "resolve") return true;
    // Para avanzar a etapas posteriores, todas las preguntas de decisión deben estar resueltas/delegadas/descartadas
    if (step === "validate") return isResolutionDone;
    if (step === "complete") return isResolutionDone && isValidationDone;
    return isResolutionDone && isValidationDone && isReconciliationDone;
  };
  const nextAcpStep: AcpWorkflowStep = !isResolutionDone
    ? "resolve"
    : !isValidationDone
      ? "validate"
      : !isReconciliationDone
        ? "complete"
        : "package";
  const displayedStep = currentStep === "resolve" || canNavigateTo(currentStep) ? currentStep : nextAcpStep;
  const acpPrimaryAction:
    | { disabled?: boolean; href?: string; label: string; nextStep?: AcpWorkflowStep }
    = displayedStep === "resolve"
      ? {
          disabled: !isResolutionDone,
          label: isResolutionDone
            ? byLanguage(language, { en: "Continue to Validation", es: "Continuar a Validacion", pt: "Continuar para Validacao" })
            : byLanguage(language, { en: "Resolve questions", es: "Resolver preguntas", pt: "Resolver perguntas" }),
          nextStep: "validate",
        }
      : displayedStep === "validate"
        ? {
            disabled: !isValidationDone,
            label: isValidationDone
              ? byLanguage(language, { en: "Continue to Complete", es: "Continuar a Completar", pt: "Continuar para Completar" })
              : byLanguage(language, { en: "Validation pending", es: "Validacion pendiente", pt: "Validacao pendente" }),
            nextStep: "complete",
          }
        : displayedStep === "complete"
          ? {
              disabled: !isReconciliationDone,
              label: isReconciliationDone
                ? byLanguage(language, { en: "Continue to Package", es: "Continuar a Package", pt: "Continuar para Package" })
                : byLanguage(language, { en: "Complete artifacts", es: "Completar artefactos", pt: "Completar artefatos" }),
              nextStep: "package",
            }
          : {
              href: `/projects/${sessionId}/artifacts`,
              label: isPackageDone
                ? byLanguage(language, { en: "Open artifacts", es: "Abrir artefactos", pt: "Abrir artefatos" })
                : byLanguage(language, { en: "Package pending", es: "Package pendiente", pt: "Package pendente" }),
              disabled: !isPackageDone,
            };

  if (!canBuild) {
    return (
      <div className="space-y-5">
        <div className="grid gap-5 xl:grid-cols-[1fr_0.85fr]">
          <UxaSurface
            className="p-[var(--uxa-panel-padding-lg)] border-[var(--uxa-state-warning)] bg-[var(--uxa-state-warning-bg)]/30"
          >
            <UxaBadge tone="warning">
              {byLanguage(language, {
                en: "Commercial invitation",
                es: "Invitacion comercial",
                pt: "Convite comercial",
              })}
            </UxaBadge>
            <h2 className="mt-3 text-[20px] font-black">
              {byLanguage(language, {
                en: "Incremental value over Blueprint",
                es: "Valor incremental sobre Blueprint",
                pt: "Valor incremental sobre o Blueprint",
              })}
            </h2>
            <div className="mt-5 grid gap-3">
              {[
                byLanguage(language, {
                  en: "Portable declarative specification for different agentic frameworks",
                  es: "Especificacion declarativa portable para diferentes frameworks agenticos",
                  pt: "Especificacao declarativa portavel para diferentes frameworks agenticos",
                }),
                byLanguage(language, {
                  en: "Manifest, contracts, prompts, tools, memory, and test suite ready for development",
                  es: "Manifest, contratos, prompts, herramientas, memoria y test suite listos para desarrollo",
                  pt: "Manifest, contratos, prompts, ferramentas, memoria e test suite prontos para desenvolvimento",
                }),
                byLanguage(language, {
                  en: "Implementation questions with options, impact, and close moment",
                  es: "Preguntas de implementacion con opciones, impacto y momento de cierre",
                  pt: "Perguntas de implementacao com opcoes, impacto e momento de fechamento",
                }),
                byLanguage(language, {
                  en: "Startup guide for Codex, Claude Code, Cursor, Copilot, or another agentic tool",
                  es: "Guia de arranque para Codex, Claude Code, Cursor, Copilot u otra herramienta agentica",
                  pt: "Guia de arranque para Codex, Claude Code, Cursor, Copilot ou outra ferramenta agentica",
                }),
              ].map((item) => (
                <div
                  className="flex items-start gap-3 rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-white/70 p-4"
                  key={item}
                >
                  <Boxes
                    aria-hidden="true"
                    className="mt-0.5 h-4 w-4 shrink-0 text-[var(--uxa-color-brand)]"
                  />
                  <p className="text-[13px] leading-5 text-[var(--uxa-color-ink-soft)]">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </UxaSurface>
          <UxaSurface className="p-[var(--uxa-panel-padding-lg)]">
            <UxaBadge tone={viewModel.package.blockers.length ? "danger" : "success"}>
              {byLanguage(language, {
                en: "Readiness",
                es: "Preparacion",
                pt: "Prontidao",
              })}
            </UxaBadge>
            <h2 className="mt-3 text-[20px] font-black">
              {byLanguage(language, {
                en: "Activation conditions",
                es: "Condiciones para activar",
                pt: "Condicoes para ativar",
              })}
            </h2>
            <p className="mt-2 text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">
              {viewModel.package.detail}
            </p>
            <div className="mt-5 space-y-2">
              {viewModel.package.blockers.length ? (
                viewModel.package.blockers.slice(0, 5).map((blocker, index) => (
                  <p
                    className="rounded-[var(--uxa-radius-md)] border border-[var(--uxa-state-danger)] bg-white px-3 py-2 text-[12px] text-[var(--uxa-color-ink-soft)]"
                    key={`${blocker}-${index}`}
                  >
                    {blocker}
                  </p>
                ))
              ) : (
                <p className="rounded-[var(--uxa-radius-md)] bg-[var(--uxa-state-success-bg)] px-3 py-2 text-[12px] text-[var(--uxa-color-ink-soft)]">
                  {byLanguage(language, {
                    en: "No technical blockers are declared for showing ACP value.",
                    es: "Sin bloqueos tecnicos declarados para mostrar el valor del ACP.",
                    pt: "Sem bloqueios tecnicos declarados para mostrar o valor do ACP.",
                  })}
                </p>
              )}
            </div>
          </UxaSurface>
        </div>
        <UxaContextualActionDock
          label={byLanguage(language, {
            en: "ACP actions",
            es: "Acciones de ACP",
            pt: "Acoes de ACP",
          })}
          scope={{
            helper: byLanguage(language, {
              en: "Product CTAs",
              es: "CTAs de este producto",
              pt: "CTAs deste produto",
            }),
            label: "ACP",
            tone: "warning",
          }}
        >
          {canCheckout ? (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[13px] line-through text-[var(--uxa-color-ink-muted)]">
                  $199 USD
                </span>
                <UxaBadge tone="success">
                  {byLanguage(language, {
                    en: "Blueprint Pro credit: -$49 USD",
                    es: "Crédito Blueprint Pro: -$49 USD",
                    pt: "Crédito Blueprint Pro: -$49 USD",
                  })}
                </UxaBadge>
                <span className="text-[16px] font-black text-[var(--uxa-color-ink)]">
                  $150 USD
                </span>
              </div>
              <CheckoutMarketSelector
                language={language}
                market={checkoutMarket}
                onMarketChange={setCheckoutMarket}
              />
            </div>
          ) : null}
          <button
            className={cn(
              "uxa-button uxa-button--primary",
              purchasing && "opacity-60 cursor-not-allowed",
            )}
            disabled={purchasing}
            onClick={async () => {
              if (purchasing) return;
              setPurchasing(true);
              try {
                if (canCheckout) {
                  await executeProductCheckout({
                    sessionId,
                    packageCode: checkoutMarketPackageCode("acp", checkoutMarket),
                    productKey: "acp",
                  });
                } else {
                  const accessResult = await executeAccessRequestWithCheckoutFallback({
                    sessionId,
                    packageCode: checkoutMarketPackageCode("acp", checkoutMarket),
                    productKey: "acp",
                  });
                  if (accessResult.type === "checkout") {
                    return;
                  }
                  if (accessResult.response && accessResult.response.status === "approved") {
                    productExperienceStore.invalidateSession(sessionId);
                    window.location.assign(`/projects/${sessionId}/acp`);
                    return;
                  }
                  setRequestSent(true);
                }
              } finally {
                setPurchasing(false);
              }
            }}
            type="button"
          >
            <span>
              {purchasing
                ? byLanguage(language, {
                    en: "Processing...",
                    es: "Procesando...",
                    pt: "Processando...",
                  })
                : requestSent
                ? byLanguage(language, {
                    en: "Request sent",
                    es: "Solicitud enviada",
                    pt: "Solicitacao enviada",
                  })
                : canCheckout
                ? byLanguage(language, {
                    en: "Get ACP",
                    es: "Adquirir ACP",
                    pt: "Adquirir ACP",
                  })
                : byLanguage(language, {
                    en: "Request ACP",
                    es: "Solicitar ACP",
                    pt: "Solicitar ACP",
                  })}
            </span>
          </button>
        </UxaContextualActionDock>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con contexto de proyecto y toggle para artefactos base */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-[var(--uxa-color-border)] bg-gradient-to-r from-slate-900/90 to-slate-800/90 px-6 py-5 text-white shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
              <Sparkles className="h-3 w-3" />
              {byLanguage(language, {
                en: "ACP Active · Ready to Construct",
                es: "ACP Activo · Listo para Construir",
                pt: "ACP Ativo · Pronto para Construir",
              })}
            </span>
            <span className="text-xs text-slate-400">
              {viewModel.title}
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            {byLanguage(language, {
              en: "Agent Construction Package (ACP)",
              es: "Agent Construction Package (ACP)",
              pt: "Agent Construction Package (ACP)",
            })}
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl">
            {byLanguage(language, {
              en: "Follow the 4 steps to resolve open questions, validate the architecture, update artifacts, and generate the final package for your agentic coding environment.",
              es: "Sigue las 4 etapas para resolver preguntas abiertas, validar la arquitectura, actualizar artefactos y generar el paquete final para tu entorno agéntico.",
              pt: "Siga as 4 etapas para resolver questoes abertas, validar a arquitetura, atualizar artefatos e gerar o pacote final para seu ambiente agentico.",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setShowBlueprintArtifacts(!showBlueprintArtifacts)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700"
          >
            <Boxes className="h-3.5 w-3.5 text-sky-400" />
            <span>
              {showBlueprintArtifacts
                ? byLanguage(language, { en: "Hide Blueprint Base", es: "Ocultar Blueprint Base", pt: "Ocultar Blueprint Base" })
                : byLanguage(language, { en: "View Blueprint Base", es: "Ver Blueprint Base", pt: "Ver Blueprint Base" })}
            </span>
          </button>
        </div>
      </div>

      {/* Stepper de 4 etapas */}
      <AcpStepStepper
        activeStep={displayedStep}
        completedSteps={completedSteps}
        onSelectStep={(step) => {
          if (canNavigateTo(step)) {
            setCurrentStep(step);
          }
        }}
        canNavigateTo={canNavigateTo}
        openQuestionsCount={openQuestions.length}
        resolutionState={questionLoadStatus}
      />

      {loading ? (
        <p className="text-[12px] text-[var(--uxa-color-ink-soft)]">
          {byLanguage(language, {
            en: "Loading ACP workspace state...",
            es: "Cargando estado del workspace ACP...",
            pt: "Carregando estado do workspace ACP...",
          })}
        </p>
      ) : null}

      {questionLoadError ? (
        <div
          role="alert"
          className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-state-danger)] bg-[var(--uxa-state-danger-bg)] p-4 text-[13px] text-[var(--uxa-color-ink)]"
        >
          <p className="font-black">
            {byLanguage(language, {
              en: "ACP question workspace could not load",
              es: "No se pudo cargar la zona de preguntas ACP",
              pt: "Nao foi possivel carregar a area de perguntas ACP",
            })}
          </p>
          <p className="mt-1 text-[var(--uxa-color-ink-soft)]">{questionLoadError}</p>
          <button
            className="uxa-button uxa-button--secondary mt-3"
            onClick={() => void reloadData()}
            type="button"
          >
            <span>
              {byLanguage(language, {
                en: "Retry ACP load",
                es: "Reintentar carga ACP",
                pt: "Tentar carregar ACP novamente",
              })}
            </span>
          </button>
        </div>
      ) : null}

      {workspaceLoadError ? (
        <div
          role="alert"
          className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-state-warning)] bg-[var(--uxa-state-warning-bg)] p-4 text-[13px] text-[var(--uxa-color-ink)]"
        >
          <p className="font-black">
            {byLanguage(language, {
              en: "ACP workspace state could not load",
              es: "No se pudo cargar el estado del workspace ACP",
              pt: "Nao foi possivel carregar o estado do workspace ACP",
            })}
          </p>
          <p className="mt-1 text-[var(--uxa-color-ink-soft)]">{workspaceLoadError}</p>
        </div>
      ) : null}

      {/* Artefactos de Blueprint desplegables opcionalmente */}
      {showBlueprintArtifacts && (
        <div className="rounded-2xl border border-[var(--uxa-color-border)] bg-slate-50/70 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              {byLanguage(language, {
                en: "Underlying Blueprint Artifacts (Read-Only Reference)",
                es: "Artefactos del Blueprint Base (Referencia de solo lectura)",
                pt: "Artefatos do Blueprint Base (Referencia de leitura)",
              })}
            </h3>
            <span className="text-xs text-slate-500">
              {byLanguage(language, {
                en: "Protected from modification during ACP",
                es: "Protegidos contra modificación durante ACP",
                pt: "Protegidos contra modificacao durante ACP",
              })}
            </span>
          </div>
          <BlueprintPostUpgradeWorkbench
            artifactCards={viewModel.artifactCards}
            sessionId={sessionId}
            tierScope="blueprint_pro"
          />
        </div>
      )}

      {/* Contenido de la etapa guiada activa */}
      <div className="min-h-[420px]">
        {displayedStep === "resolve" && (
          questionLoadStatus === "ready" ? (
            <AcpResolutionStage
              sessionId={sessionId}
              questions={questions}
              onQuestionsUpdated={reloadData}
              onProceedToValidation={() => setCurrentStep("validate")}
            />
          ) : (
            <UxaSurface className="p-[var(--uxa-panel-padding-lg)]">
              <UxaBadge tone={questionLoadStatus === "error" ? "danger" : "neutral"}>
                {byLanguage(language, {
                  en: "Resolve",
                  es: "Resolver",
                  pt: "Resolver",
                })}
              </UxaBadge>
              <h2 className="mt-3 text-[20px] font-black">
                {questionLoadStatus === "error"
                  ? byLanguage(language, {
                      en: "Question state is not verified",
                      es: "El estado de preguntas no esta verificado",
                      pt: "O estado das perguntas nao esta verificado",
                    })
                  : byLanguage(language, {
                      en: "Loading implementation questions",
                      es: "Cargando preguntas de implementacion",
                      pt: "Carregando perguntas de implementacao",
                    })}
              </h2>
              <p className="mt-2 max-w-2xl text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">
                {questionLoadStatus === "error"
                  ? byLanguage(language, {
                      en: "ACP will not mark the gate as passed until the consolidated questions, answers, delegated decisions, and discarded items are loaded.",
                      es: "ACP no marcara el gate como superado hasta cargar las preguntas, respuestas, decisiones delegadas y descartes consolidados.",
                      pt: "ACP nao marcara o gate como aprovado ate carregar perguntas, respostas, decisoes delegadas e descartes consolidados.",
                    })
                  : byLanguage(language, {
                      en: "This step consolidates the answers captured in Attention and the open ACP implementation decisions.",
                      es: "Esta etapa consolida las respuestas capturadas en Atencion y las decisiones abiertas de implementacion ACP.",
                      pt: "Esta etapa consolida as respostas capturadas em Atencao e as decisoes abertas de implementacao ACP.",
                    })}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <UxaButton disabled variant="primary">
                  <span>
                    {byLanguage(language, {
                      en: "Continue to Validation",
                      es: "Continuar a Validación",
                      pt: "Continuar para Validacao",
                    })}
                  </span>
                </UxaButton>
                {questionLoadStatus === "error" ? (
                  <UxaButton onClick={() => void reloadData()} variant="secondary">
                    <span>
                      {byLanguage(language, {
                        en: "Retry ACP load",
                        es: "Reintentar carga ACP",
                        pt: "Tentar carregar ACP novamente",
                      })}
                    </span>
                  </UxaButton>
                ) : null}
              </div>
            </UxaSurface>
          )
        )}
        {displayedStep === "validate" && (
          <AcpValidationStage
            activeRoute={activeRoute}
            sessionId={sessionId}
            onReload={reloadData}
            onProceedToReconciliation={() => setCurrentStep("complete")}
          />
        )}
        {displayedStep === "complete" && (
          <AcpReconciliationStage
            sessionId={sessionId}
            workspace={workspace}
            onReload={reloadData}
            onProceedToPackage={() => setCurrentStep("package")}
          />
        )}
        {displayedStep === "package" && (
          <AcpPackageStage
            sessionId={sessionId}
            answeredCount={answeredQuestions.length}
            deferredCount={deferredQuestions.length}
          />
        )}
      </div>
      <UxaContextualActionDock
        label={byLanguage(language, {
          en: "ACP actions",
          es: "Acciones de ACP",
          pt: "Acoes de ACP",
        })}
        scope={{
          helper: byLanguage(language, {
            en: "Product CTAs",
            es: "CTAs de este producto",
            pt: "CTAs deste produto",
          }),
          label: "ACP",
          tone: "success",
        }}
      >
        <a className="uxa-button uxa-button--secondary" href={`/projects/${sessionId}/blueprint/pro`}>
          <span>
            {byLanguage(language, {
              en: "Back to Blueprint Pro",
              es: "Volver al Blueprint Pro",
              pt: "Voltar ao Blueprint Pro",
            })}
          </span>
        </a>
        <button
          className="uxa-button uxa-button--secondary"
          onClick={() => setShowBlueprintArtifacts(!showBlueprintArtifacts)}
          type="button"
        >
          <span>
            {showBlueprintArtifacts
              ? byLanguage(language, { en: "Hide Blueprint base", es: "Ocultar Blueprint base", pt: "Ocultar Blueprint base" })
              : byLanguage(language, { en: "View Blueprint base", es: "Ver Blueprint base", pt: "Ver Blueprint base" })}
          </span>
        </button>
        {acpPrimaryAction.href && !acpPrimaryAction.disabled ? (
          <a className="uxa-button uxa-button--primary" href={acpPrimaryAction.href}>
            <span>{acpPrimaryAction.label}</span>
          </a>
        ) : (
          <UxaButton
            disabled={acpPrimaryAction.disabled}
            onClick={() => {
              if (acpPrimaryAction.nextStep && canNavigateTo(acpPrimaryAction.nextStep)) {
                setCurrentStep(acpPrimaryAction.nextStep);
              }
            }}
            variant="primary"
          >
            {acpPrimaryAction.label}
          </UxaButton>
        )}
      </UxaContextualActionDock>
    </div>
  );
}

function ArtifactsProductPage({
  activeRoute,
}: {
  activeRoute: ProductExperienceRouteSnapshot | null;
}) {
  const { language } = useLanguage();
  const searchParams = useSearchParams();
  const sessionId = activeRoute?.route.sessionId ?? "";
  const currentStage = activeRoute?.snapshot.data?.session.current_stage ?? "estimate";
  const viewModel = buildProductSaasViewModel({
    activeRoute,
    language,
    section: "artifacts",
  });

  const [catalog, setCatalog] = useState<DeliverableCatalogResponse | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

  const initialTypeFilter = searchParams?.get("type") || "all";
  const initialTierFilter = searchParams?.get("tier") || "all";
  const initialStageFilter = searchParams?.get("stage") || "all";
  const initialStatusFilter = searchParams?.get("status") || "all";
  const initialDeliverableKey = searchParams?.get("deliverable") || searchParams?.get("key") || "";

  const [typeFilter, setTypeFilter] = useState<string>(initialTypeFilter);
  const [tierFilter, setTierFilter] = useState<string>(initialTierFilter);
  const [stageFilter, setStageFilter] = useState<string>(initialStageFilter);
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedKey, setSelectedKey] = useState<string>(initialDeliverableKey);

  useEffect(() => {
    let cancelled = false;
    deferStateUpdate(() => {
      if (!cancelled) {
        setStatus("loading");
      }
    });

    deliverableCatalogApi
      .list({ currentStage, sessionId, tier: "acp", includeInactive: false })
      .then((payload) => {
        if (cancelled) return;
        setCatalog(payload);
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setCatalog(null);
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [currentStage, sessionId]);

  const allEntries = useMemo(() => {
    return (catalog?.entries ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
  }, [catalog?.entries]);

  const filteredEntries = useMemo(() => {
    return allEntries.filter((entry) => {
      if (typeFilter !== "all") {
        if (typeFilter === "diagram" && entry.deliverable_type !== "diagram") return false;
        if (typeFilter === "package" && entry.deliverable_type !== "package") return false;
        if (typeFilter === "document" && (entry.deliverable_type === "diagram" || entry.deliverable_type === "package")) return false;
      }
      if (tierFilter !== "all" && entry.required_tier !== tierFilter) {
        return false;
      }
      if (stageFilter !== "all" && entry.stage !== stageFilter && entry.enabled_from_stage !== stageFilter) {
        return false;
      }
      if (statusFilter !== "all") {
        const isAvailable = entry.access.can_view || entry.access.access_state === "available";
        if (statusFilter === "available" && !isAvailable) return false;
        if (statusFilter === "locked" && isAvailable) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = entry.title.toLowerCase().includes(q);
        const matchesDesc = entry.description.toLowerCase().includes(q);
        const matchesKey = entry.key.toLowerCase().includes(q);
        const matchesCategory = entry.category.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesKey && !matchesCategory) return false;
      }
      return true;
    });
  }, [allEntries, typeFilter, tierFilter, stageFilter, statusFilter, searchQuery]);

  const effectiveSelectedKey = useMemo(() => {
    if (selectedKey && allEntries.some((e) => e.key === selectedKey)) {
      return selectedKey;
    }
    return filteredEntries[0]?.key || allEntries[0]?.key || "";
  }, [selectedKey, allEntries, filteredEntries]);

  const selectedEntry = useMemo(() => {
    return allEntries.find((e) => e.key === effectiveSelectedKey) || null;
  }, [allEntries, effectiveSelectedKey]);

  const generatedMatch = useMemo(() => {
    if (!selectedEntry) return null;
    return (
      viewModel.artifactCards.find((artifact) => {
        const metadataKey = artifactMetadataText(artifact, "artifact_key");
        const artifactKey = String(artifact.key);
        return (
          artifact.label === selectedEntry.title ||
          artifactKey === selectedEntry.key ||
          metadataKey === selectedEntry.key ||
          artifactKey.endsWith(`/${selectedEntry.key}`) ||
          metadataKey.endsWith(`/${selectedEntry.key}`)
        );
      }) || null
    );
  }, [selectedEntry, viewModel.artifactCards]);

  const totalCount = allEntries.length;
  const availableCount = allEntries.filter((e) => e.access.can_view || e.access.access_state === "available").length;
  const lockedCount = Math.max(totalCount - availableCount, 0);

  return (
    <div className="space-y-6">
      <SectionHeader
        badge={byLanguage(language, {
          en: "Canonical Deliverables Hub",
          es: "Hub Canónico de Entregables",
          pt: "Hub Canonico de Entregaveis",
        })}
        description={byLanguage(language, {
          en: "Unified repository for documents, architecture diagrams, contracts, and packages across Blueprint and ACP tiers.",
          es: "Repositorio unificado de documentos, diagramas de arquitectura, contratos y paquetes para todos los tiers de Blueprint y ACP.",
          pt: "Repositorio unificado de documentos, diagramas de arquitetura, contratos e pacotes para todos os tiers de Blueprint e ACP.",
        })}
        title={byLanguage(language, {
          en: "Deliverables and Diagrams Hub",
          es: "Hub de Entregables y Diagramas",
          pt: "Hub de Entregaveis e Diagramas",
        })}
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <UxaMetricCard
          description={byLanguage(language, { en: "In catalog", es: "En catálogo", pt: "No catalogo" })}
          label={byLanguage(language, { en: "Total Deliverables", es: "Total Entregables", pt: "Total Entregaveis" })}
          value={String(totalCount || viewModel.artifactCards.length)}
        />
        <UxaMetricCard
          description={byLanguage(language, { en: "Ready to inspect", es: "Listos para inspeccionar", pt: "Prontos para inspecionar" })}
          label={byLanguage(language, { en: "Available", es: "Disponibles", pt: "Disponiveis" })}
          value={String(availableCount || viewModel.artifactCards.length)}
        />
        <UxaMetricCard
          description={byLanguage(language, { en: "Tier or stage gated", es: "Condicionados por tier/etapa", pt: "Condicionados por tier/etapa" })}
          label={byLanguage(language, { en: "Locked / Upcoming", es: "Bloqueados / Futuros", pt: "Bloqueados / Futuros" })}
          value={String(lockedCount)}
        />
        <UxaMetricCard
          description={byLanguage(language, { en: "In current snapshot", es: "En snapshot activo", pt: "No snapshot ativo" })}
          label={byLanguage(language, { en: "Persisted Artifacts", es: "Artefactos Persistidos", pt: "Artefatos Persistidos" })}
          value={String(viewModel.artifactCards.length)}
        />
      </div>

      {/* Filters Bar */}
      <UxaSurface className="p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--uxa-color-ink-muted)]" size={16} />
            <input
              aria-label={byLanguage(language, { en: "Search deliverables", es: "Buscar entregables", pt: "Buscar entregaveis" })}
              className="w-full pl-9 pr-3 py-2 text-[13px] rounded-[var(--uxa-radius-sm)] border border-[var(--uxa-color-border)] bg-transparent focus:outline-none focus:border-[var(--uxa-color-brand)]"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={byLanguage(language, {
                en: "Filter by title, key, description...",
                es: "Filtrar por título, key, descripción...",
                pt: "Filtrar por titulo, chave, descricao...",
              })}
              type="search"
              value={searchQuery}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filtrar por tipo"
              className="px-3 py-2 text-[12px] font-semibold rounded-[var(--uxa-radius-sm)] border border-[var(--uxa-color-border)] bg-transparent text-[var(--uxa-color-ink)]"
              onChange={(e) => setTypeFilter(e.target.value)}
              value={typeFilter}
            >
              <option value="all">{byLanguage(language, { en: "All Types", es: "Todos los Tipos", pt: "Todos os Tipos" })}</option>
              <option value="document">{byLanguage(language, { en: "Documents / Artifacts", es: "Documentos / Artefactos", pt: "Documentos / Artefatos" })}</option>
              <option value="diagram">{byLanguage(language, { en: "Architecture Diagrams", es: "Diagramas de Arquitectura", pt: "Diagramas de Arquitetura" })}</option>
              <option value="package">{byLanguage(language, { en: "Export Packages", es: "Paquetes de Exportación", pt: "Pacotes de Exportacao" })}</option>
            </select>

            <select
              aria-label="Filtrar por tier"
              className="px-3 py-2 text-[12px] font-semibold rounded-[var(--uxa-radius-sm)] border border-[var(--uxa-color-border)] bg-transparent text-[var(--uxa-color-ink)]"
              onChange={(e) => setTierFilter(e.target.value)}
              value={tierFilter}
            >
              <option value="all">{byLanguage(language, { en: "All Tiers", es: "Todos los Tiers", pt: "Todos os Tiers" })}</option>
              <option value="blueprint">Blueprint Basic</option>
              <option value="blueprint_pro">Blueprint Pro</option>
              <option value="acp">ACP Premium</option>
            </select>

            <select
              aria-label="Filtrar por etapa"
              className="px-3 py-2 text-[12px] font-semibold rounded-[var(--uxa-radius-sm)] border border-[var(--uxa-color-border)] bg-transparent text-[var(--uxa-color-ink)]"
              onChange={(e) => setStageFilter(e.target.value)}
              value={stageFilter}
            >
              <option value="all">{byLanguage(language, { en: "All Stages", es: "Todas las Etapas", pt: "Todas as Etapas" })}</option>
              <option value="discover">Discover</option>
              <option value="define">Define</option>
              <option value="design">Design</option>
              <option value="tools">Tools</option>
              <option value="memory">Memory</option>
              <option value="estimate">Estimate</option>
              <option value="validate">Validate</option>
              <option value="package">Package</option>
            </select>

            <select
              aria-label="Filtrar por disponibilidad"
              className="px-3 py-2 text-[12px] font-semibold rounded-[var(--uxa-radius-sm)] border border-[var(--uxa-color-border)] bg-transparent text-[var(--uxa-color-ink)]"
              onChange={(e) => setStatusFilter(e.target.value)}
              value={statusFilter}
            >
              <option value="all">{byLanguage(language, { en: "All States", es: "Todos los Estados", pt: "Todos os Estados" })}</option>
              <option value="available">{byLanguage(language, { en: "Available Only", es: "Solo Disponibles", pt: "Apenas Disponiveis" })}</option>
              <option value="locked">{byLanguage(language, { en: "Locked / Upcoming", es: "Bloqueados / Futuros", pt: "Bloqueados / Futuros" })}</option>
            </select>
          </div>
        </div>
      </UxaSurface>

      {/* Main Canonical Hub Two-Pane Layout */}
      <section aria-label="Hub canonico de entregables" className={diagramCenterStyles.workspace}>
        {/* Left Pane: Catalog List */}
        <section aria-label="Lista de entregables" className={diagramCenterStyles.catalogPane}>
          <div className={diagramCenterStyles.paneHeader}>
            <div>
              <h3>
                {byLanguage(language, { en: "Deliverables", es: "Entregables", pt: "Entregaveis" })}
              </h3>
              <p>
                {filteredEntries.length} {byLanguage(language, { en: "of", es: "de", pt: "de" })} {totalCount || viewModel.artifactCards.length}
              </p>
            </div>
            <span className={diagramCenterStyles.tag}>
              {availableCount} {byLanguage(language, { en: "ready", es: "listos", pt: "prontos" })}
            </span>
          </div>

          {status === "loading" && (
            <p className="p-4 text-[13px] text-[var(--uxa-color-ink-soft)]">
              {byLanguage(language, {
                en: "Loading canonical deliverables...",
                es: "Cargando entregables canónicos...",
                pt: "Carregando entregaveis canonicos...",
              })}
            </p>
          )}

          {status === "error" && (
            <p className="p-4 text-[13px] text-[var(--uxa-color-ink-soft)]">
              {byLanguage(language, {
                en: "The deliverable catalog could not be loaded. Showing local snapshot.",
                es: "No se pudo cargar el catálogo de entregables. Mostrando snapshot local.",
                pt: "Nao foi possivel carregar o catalogo. Mostrando snapshot local.",
              })}
            </p>
          )}

          <div className={diagramCenterStyles.catalogList}>
            {filteredEntries.map((entry) => {
              const selected = effectiveSelectedKey === entry.key;
              const isAvailable = entry.access.can_view || entry.access.access_state === "available";
              const isDiagram = entry.deliverable_type === "diagram";

              return (
                <article
                  className={`${diagramCenterStyles.card} ${selected ? diagramCenterStyles.cardSelected : ""} ${diagramCenterStyles.listCard}`}
                  key={entry.key}
                >
                  <div>
                    <div className={diagramCenterStyles.cardTop}>
                      <span className={diagramCenterStyles.tag}>{formatToken(entry.deliverable_type)}</span>
                      <span className={diagramCenterStyles.tag}>{formatToken(entry.stage)}</span>
                      <span
                        className={`${diagramCenterStyles.status} ${
                          isAvailable ? diagramCenterStyles.statusAvailable : diagramCenterStyles.statusLocked
                        }`}
                      >
                        {isAvailable
                          ? byLanguage(language, { en: "Available", es: "Disponible", pt: "Disponivel" })
                          : byLanguage(language, { en: "Locked", es: "Bloqueado", pt: "Bloqueado" })}
                      </span>
                    </div>

                    <button
                      aria-pressed={selected}
                      className={diagramCenterStyles.cardTitleButton}
                      onClick={() => setSelectedKey(entry.key)}
                      type="button"
                    >
                      <h4>{entry.title}</h4>
                      <p>{entry.description}</p>
                    </button>
                  </div>

                  <div className={diagramCenterStyles.cardFooter}>
                    <button
                      className={diagramCenterStyles.cardAction}
                      onClick={() => setSelectedKey(entry.key)}
                      type="button"
                    >
                      {byLanguage(language, { en: "Inspect", es: "Inspeccionar", pt: "Inspecionar" })}
                      <ArrowUpRight aria-hidden="true" size={12} />
                    </button>

                    {isDiagram && (
                      <a
                        className="inline-flex items-center gap-1 text-[11px] font-black text-[var(--uxa-color-brand)] hover:underline"
                        href={`/projects/${sessionId}/diagrams?diagram=${encodeURIComponent(entry.key)}`}
                      >
                        {byLanguage(language, { en: "Open in Diagram Center", es: "Abrir en Diagram Center", pt: "Abrir no Diagram Center" })}
                        <ExternalLink aria-hidden="true" size={11} />
                      </a>
                    )}
                  </div>
                </article>
              );
            })}

            {filteredEntries.length === 0 && (
              <p className="p-4 text-[13px] text-[var(--uxa-color-ink-soft)]">
                {byLanguage(language, {
                  en: "No deliverables match the selected filters.",
                  es: "Ningún entregable coincide con los filtros seleccionados.",
                  pt: "Nenhum entregavel corresponde aos filtros selecionados.",
                })}
              </p>
            )}
          </div>
        </section>

        {/* Right Pane: Deliverable Detail & Viewer */}
        <aside aria-label="Visor de entregable seleccionado" className={diagramCenterStyles.viewerPane}>
          <div className={diagramCenterStyles.paneHeader}>
            <div>
              <h3>
                {byLanguage(language, { en: "Deliverable Inspector", es: "Inspector de Entregable", pt: "Inspetor de Entregavel" })}
              </h3>
              <p>
                {selectedEntry ? formatToken(selectedEntry.deliverable_type) : ""}
              </p>
            </div>
            {selectedEntry && (
              <span
                className={`${diagramCenterStyles.status} ${
                  selectedEntry.access.can_view || selectedEntry.access.access_state === "available"
                    ? diagramCenterStyles.statusAvailable
                    : diagramCenterStyles.statusLocked
                }`}
              >
                {selectedEntry.access.can_view || selectedEntry.access.access_state === "available"
                  ? byLanguage(language, { en: "Ready", es: "Disponible", pt: "Disponivel" })
                  : byLanguage(language, { en: "Restricted", es: "Restringido", pt: "Restrito" })}
              </span>
            )}
          </div>

          {selectedEntry ? (
            <div className={diagramCenterStyles.viewerBody}>
              <div>
                <h3 className={diagramCenterStyles.viewerTitle}>{selectedEntry.title}</h3>
                <p className={diagramCenterStyles.viewerDescription}>{selectedEntry.description}</p>
              </div>

              {/* Badges */}
              <div className={diagramCenterStyles.viewerMeta}>
                <span className={diagramCenterStyles.tag}>{formatToken(selectedEntry.category)}</span>
                <span className={diagramCenterStyles.tag}>Stage: {formatToken(selectedEntry.stage)}</span>
                <span className={diagramCenterStyles.tag}>Tier: {formatToken(selectedEntry.required_tier)}</span>
                <span className={diagramCenterStyles.tag}>Format: {selectedEntry.formats.preferred}</span>
              </div>

              {/* Explanations Grid */}
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-border-soft)] bg-[var(--uxa-color-muted-panel)] p-4">
                  <p className="font-mono text-[10px] font-black uppercase tracking-[.16em] text-[var(--uxa-color-ink-muted)]">
                    {byLanguage(language, { en: "Value & Purpose", es: "Valor y Propósito", pt: "Valor e Proposito" })}
                  </p>
                  <p className="mt-2 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
                    {selectedEntry.description}
                  </p>
                </div>
                <div className="rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-border-soft)] bg-[var(--uxa-color-muted-panel)] p-4">
                  <p className="font-mono text-[10px] font-black uppercase tracking-[.16em] text-[var(--uxa-color-ink-muted)]">
                    {byLanguage(language, { en: "Access Condition", es: "Condición de Acceso", pt: "Condicao de Acesso" })}
                  </p>
                  <p className="mt-2 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
                    {selectedEntry.access.reason || selectedEntry.access.cta_label || "Acceso estándar"}
                  </p>
                </div>
              </div>

              {/* Formats & Actions */}
              <div className="rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-border-soft)] bg-white p-4">
                <p className="font-mono text-[10px] font-black uppercase tracking-[.16em] text-[var(--uxa-color-ink-muted)]">
                  {byLanguage(language, { en: "Formats & Deliverable Actions", es: "Formatos y Acciones del Entregable", pt: "Formatos e Acoes do Entregavel" })}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={diagramCenterStyles.tag}>{formatToken(selectedEntry.generation_mode)}</span>
                  {selectedEntry.formats.available.map((format) => (
                    <span className={diagramCenterStyles.tag} key={format}>{format}</span>
                  ))}
                  {selectedEntry.exportable && (
                    <span className={diagramCenterStyles.tag}>
                      {byLanguage(language, { en: "Exportable", es: "Exportable", pt: "Exportavel" })}
                    </span>
                  )}
                  {selectedEntry.deliverable_type === "diagram" && (
                    <a
                      className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-black text-white bg-[var(--uxa-color-brand)] rounded-[var(--uxa-radius-sm)] shadow-sm hover:opacity-90 transition-opacity"
                      href={`/projects/${sessionId}/diagrams?diagram=${encodeURIComponent(selectedEntry.key)}`}
                    >
                      <ExternalLink size={13} />
                      {byLanguage(language, { en: "Open Interactive Diagram", es: "Abrir Diagrama Interactivo", pt: "Abrir Diagrama Interativo" })}
                    </a>
                  )}
                </div>
              </div>

              {/* Live Protected Viewer */}
              <ProfessionalArtifactViewer
                canCopy={selectedEntry.access?.can_download ?? false}
                canDownload={selectedEntry.access?.can_download ?? false}
                contentText={generatedMatch?.contentText}
                description={selectedEntry.description}
                detail={`${selectedEntry.key}\n\n${selectedEntry.description}\n\n${selectedEntry.access.cta_label || selectedEntry.access.reason}`}
                exportFormat={selectedEntry.formats.preferred}
                metadata={{
                  ...(generatedMatch?.metadata ?? {}),
                  artifact_key: selectedEntry.key,
                  purpose: selectedEntry.description,
                  source_refs: selectedEntry.context_policy?.short_term_refs ?? [],
                }}
                protectedView={!selectedEntry.access?.can_download}
                stage={selectedEntry.stage}
                title={selectedEntry.title}
                versionLabel={generatedMatch?.versionLabel}
              />
            </div>
          ) : (
            <div className={diagramCenterStyles.viewerBody}>
              <div className={diagramCenterStyles.statePanel}>
                <div>
                  <Boxes aria-hidden="true" size={28} />
                  <h4>{byLanguage(language, { en: "Select a deliverable", es: "Selecciona un entregable", pt: "Selecione um entregavel" })}</h4>
                  <p>{byLanguage(language, { en: "Inspect metadata, relationships, and rendered content.", es: "Inspecciona metadatos, relaciones y contenido renderizado.", pt: "Inspecione metadados, relacoes e conteudo renderizado." })}</p>
                </div>
              </div>
            </div>
          )}
        </aside>
      </section>
      <UxaContextualActionDock
        label={byLanguage(language, {
          en: "Deliverable actions",
          es: "Acciones de entregables",
          pt: "Acoes de entregaveis",
        })}
        scope={{
          helper: byLanguage(language, {
            en: "Product CTAs",
            es: "CTAs de este producto",
            pt: "CTAs deste produto",
          }),
          label: byLanguage(language, {
            en: "Artifacts",
            es: "Artefactos",
            pt: "Artefatos",
          }),
          tone: availableCount ? "success" : "info",
        }}
      >
        <a className="uxa-button uxa-button--secondary" href={`/projects/${sessionId}/blueprint`}>
          <span>
            {byLanguage(language, {
              en: "Back to Blueprint",
              es: "Volver al Blueprint",
              pt: "Voltar ao Blueprint",
            })}
          </span>
        </a>
        <a className="uxa-button uxa-button--secondary" href={`/projects/${sessionId}/diagrams`}>
          <span>
            {byLanguage(language, {
              en: "Open diagram viewer",
              es: "Abrir visor de diagramas",
              pt: "Abrir visualizador de diagramas",
            })}
          </span>
        </a>
        {selectedEntry?.deliverable_type === "diagram" ? (
          <a
            className="uxa-button uxa-button--secondary"
            href={`/projects/${sessionId}/diagrams?diagram=${encodeURIComponent(selectedEntry.key)}`}
          >
            <span>
              {byLanguage(language, {
                en: "Open selected diagram",
                es: "Abrir diagrama seleccionado",
                pt: "Abrir diagrama selecionado",
              })}
            </span>
          </a>
        ) : null}
        <a className="uxa-button uxa-button--primary" href={`/projects/${sessionId}/acp`}>
          <span>
            {byLanguage(language, {
              en: hasTier(viewModel.accessTier, "acp") || viewModel.access?.can_build_acp ? "Open ACP" : "Request ACP",
              es: hasTier(viewModel.accessTier, "acp") || viewModel.access?.can_build_acp ? "Abrir ACP" : "Solicitar ACP",
              pt: hasTier(viewModel.accessTier, "acp") || viewModel.access?.can_build_acp ? "Abrir ACP" : "Solicitar ACP",
            })}
          </span>
        </a>
      </UxaContextualActionDock>
    </div>
  );
}

function ActivityProductPage({
  activeRoute,
}: {
  activeRoute: ProductExperienceRouteSnapshot | null;
}) {
  const { language } = useLanguage();
  const viewModel = buildProductSaasViewModel({
    activeRoute,
    language,
    section: "activity",
  });
  const snapshot = activeRoute?.snapshot.data ?? null;
  const sessionId = activeRoute?.route.sessionId ?? "";
  const currentStage = activeRoute?.route.currentStage ?? snapshot?.session.current_stage ?? "estimate";

  return (
    <div className="space-y-5">
      <SectionHeader
        badge={byLanguage(language, {
          en: "Activity",
          es: "Actividad",
          pt: "Atividade",
        })}
        description={byLanguage(language, {
          en: "Cross-stage timeline to understand what the system did, what is missing, and what requires human intervention.",
          es: "Linea de tiempo transversal para entender que hizo el sistema, que falta y que requiere intervencion humana.",
          pt: "Linha do tempo transversal para entender o que o sistema fez, o que falta e o que requer intervencao humana.",
        })}
        title={byLanguage(language, {
          en: "Project operations and traceability",
          es: "Operacion y trazabilidad del proyecto",
          pt: "Operacao e rastreabilidade do projeto",
        })}
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_0.75fr]">
        <UxaSurface className="p-[var(--uxa-panel-padding-lg)]">
          <UxaBadge tone={viewModel.activityItems.length ? "success" : "neutral"}>
            {byLanguage(language, {
              en: "Timeline",
              es: "Linea de tiempo",
              pt: "Linha do tempo",
            })}
          </UxaBadge>
          <div className="mt-5 space-y-3">
            {viewModel.activityItems.map((item) => (
              <article
                className="flex gap-3 rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] p-4"
                key={item.key}
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--uxa-color-brand-soft)] text-[var(--uxa-color-brand)]">
                  <Clock3 aria-hidden="true" className="h-4 w-4" />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13px] font-black">{item.label}</p>
                    <UxaBadge tone={item.tone}>{getToneBadgeLabel(language, item.tone)}</UxaBadge>
                  </div>
                  <p className="mt-1 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
                    {item.detail}
                  </p>
                  {item.time ? (
                    <p className="mt-2 text-[11px] text-[var(--uxa-color-ink-muted)]">
                      {item.time}
                    </p>
                  ) : null}
                </div>
              </article>
            ))}
            {viewModel.activityItems.length ? null : (
              <p className="rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] p-4 text-[13px] text-[var(--uxa-color-ink-soft)]">
                {byLanguage(language, {
                  en: "There are no activity events available in the operational endpoint.",
                  es: "No hay eventos de actividad disponibles en el endpoint operacional.",
                  pt: "Nao ha eventos de atividade disponiveis no endpoint operacional.",
                })}
              </p>
            )}
          </div>
        </UxaSurface>
        <UxaSurface className="p-[var(--uxa-panel-padding-lg)]">
          <UxaBadge tone="info">
            {byLanguage(language, {
              en: "Snapshot",
              es: "Snapshot",
              pt: "Snapshot",
            })}
          </UxaBadge>
          <h2 className="mt-3 text-[20px] font-black">
            {byLanguage(language, {
              en: "Operational summary",
              es: "Resumen operativo",
              pt: "Resumo operacional",
            })}
          </h2>
          <div className="mt-5 space-y-3">
            {[
              [
                byLanguage(language, {
                  en: "Current stage",
                  es: "Etapa actual",
                  pt: "Etapa atual",
                }),
                snapshot?.session.current_stage ??
                  byLanguage(language, {
                    en: "Unavailable",
                    es: "No disponible",
                    pt: "Indisponivel",
                  }),
              ],
              [
                byLanguage(language, {
                  en: "Journey artifacts",
                  es: "Artefactos del journey",
                  pt: "Artefatos da jornada",
                }),
                String(snapshot?.journey_artifacts.length ?? 0),
              ],
              [
                byLanguage(language, {
                  en: "Skill runs",
                  es: "Ejecuciones de skills",
                  pt: "Execucoes de skills",
                }),
                String(snapshot?.skill_runs.length ?? 0),
              ],
              [
                byLanguage(language, {
                  en: "Subagent runs",
                  es: "Ejecuciones de subagentes",
                  pt: "Execucoes de subagentes",
                }),
                String(snapshot?.subagent_runs.length ?? 0),
              ],
              [
                byLanguage(language, {
                  en: "Validations",
                  es: "Validaciones",
                  pt: "Validacoes",
                }),
                String(snapshot?.validations?.length ?? 0),
              ],
            ].map(([label, value]) => (
              <div
                className="rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] p-4"
                key={label}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)]">
                  {label}
                </p>
                <p className="mt-2 text-[13px] font-black">{value}</p>
              </div>
            ))}
          </div>
        </UxaSurface>
      </div>
      <UxaContextualActionDock
        label={byLanguage(language, {
          en: "Activity actions",
          es: "Acciones de actividad",
          pt: "Acoes de atividade",
        })}
        scope={{
          helper: byLanguage(language, {
            en: "Product CTAs",
            es: "CTAs de este producto",
            pt: "CTAs deste produto",
          }),
          label: byLanguage(language, {
            en: "Activity",
            es: "Actividad",
            pt: "Atividade",
          }),
          tone: viewModel.activityItems.length ? "success" : "neutral",
        }}
      >
        <a className="uxa-button uxa-button--secondary" href={`/projects/${sessionId}/work/${currentStage}`}>
          <span>
            {byLanguage(language, {
              en: "Back to stage",
              es: "Volver a etapa",
              pt: "Voltar a etapa",
            })}
          </span>
        </a>
        <a className="uxa-button uxa-button--secondary" href={`/projects/${sessionId}/blueprint`}>
          <span>
            {byLanguage(language, {
              en: "View Blueprint",
              es: "Ver Blueprint",
              pt: "Ver Blueprint",
            })}
          </span>
        </a>
        <a className="uxa-button uxa-button--primary" href={`/projects/${sessionId}/artifacts`}>
          <span>
            {byLanguage(language, {
              en: "View artifacts",
              es: "Ver artefactos",
              pt: "Ver artefatos",
            })}
          </span>
        </a>
      </UxaContextualActionDock>
    </div>
  );
}

export function ProductSaasView({
  activeRoute,
  section,
}: ProductSaasViewProps) {
  const { language } = useLanguage();

  if (isExecutiveOverviewSection(section)) {
    return <ProductExecutiveOverviewPage activeRoute={activeRoute} section={section} />;
  }

  if (section === "blueprint") {
    return <BlueprintProductPage activeRoute={activeRoute} />;
  }

  if (section === "blueprint_pro") {
    return <BlueprintProPage activeRoute={activeRoute} />;
  }

  if (section === "diagrams") {
    const projectId = activeRoute?.route.sessionId ?? "";
    const currentStage = activeRoute?.route.currentStage ?? "estimate";
    return projectId ? (
      <div className="space-y-5">
        <DiagramCenterPage projectId={projectId} />
        <UxaContextualActionDock
          label={byLanguage(language, {
            en: "Diagram actions",
            es: "Acciones de diagramas",
            pt: "Acoes de diagramas",
          })}
          scope={{
            helper: byLanguage(language, {
              en: "Product CTAs",
              es: "CTAs de este producto",
              pt: "CTAs deste produto",
            }),
            label: byLanguage(language, {
              en: "Diagrams",
              es: "Diagramas",
              pt: "Diagramas",
            }),
            tone: "info",
          }}
        >
          <a className="uxa-button uxa-button--secondary" href={`/projects/${projectId}/work/${currentStage}`}>
            <span>
              {byLanguage(language, {
                en: "Back to stage",
                es: "Volver a etapa",
                pt: "Voltar a etapa",
              })}
            </span>
          </a>
          <a className="uxa-button uxa-button--secondary" href={`/projects/${projectId}/artifacts`}>
            <span>
              {byLanguage(language, {
                en: "View artifacts",
                es: "Ver artefactos",
                pt: "Ver artefatos",
              })}
            </span>
          </a>
          <a className="uxa-button uxa-button--primary" href={`/projects/${projectId}/blueprint/pro`}>
            <span>Blueprint Pro</span>
          </a>
        </UxaContextualActionDock>
      </div>
    ) : null;
  }

  if (section === "acp") {
    return <AcpProductPage activeRoute={activeRoute} />;
  }

  if (section === "artifacts") {
    return <ArtifactsProductPage activeRoute={activeRoute} />;
  }

  if (section === "activity") {
    return <ActivityProductPage activeRoute={activeRoute} />;
  }

  return (
    <UxaSurface className="p-[var(--uxa-panel-padding-lg)]">
      <UxaBadge tone="neutral">
        {byLanguage(language, {
          en: "Product",
          es: "Producto",
          pt: "Produto",
        })}
      </UxaBadge>
      <h2 className="mt-3 text-[20px] font-black">
        {byLanguage(language, {
          en: "Section in preparation",
          es: "Seccion en preparacion",
          pt: "Secao em preparacao",
        })}
      </h2>
      <p className="mt-2 text-[13px] text-[var(--uxa-color-ink-soft)]">
        {byLanguage(language, {
          en: "This section is not yet available for the current project.",
          es: "Esta seccion aun no esta disponible para el proyecto actual.",
          pt: "Esta secao ainda nao esta disponivel para o projeto atual.",
        })}
      </p>
    </UxaSurface>
  );
}
