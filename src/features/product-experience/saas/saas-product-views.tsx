"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  Clock3,
  Download,
  Edit3,
  ExternalLink,
  FastForward,
  FileText,
  Filter,
  Layers,
  Search,
  Sparkles,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { useLanguage, type SupportedLanguage } from "@/core/i18n/language-context";
import {
  getBlockingQuestions,
  getOpenQuestions,
} from "@/features/acp/acp-adapter";
import { DiagramCenterPage } from "@/features/diagram-center";
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
  UxaMetricCard,
  UxaProcessingStrip,
  UxaProductHero,
  UxaStickyActionBar,
  UxaSurface,
} from "@/features/product-experience/design-system";
import type { ProductExperienceProductSection } from "@/features/product-experience/shell/experience-model";
import {
  buildProductSaasViewModel,
  hasTier,
  type ProductMetric,
} from "@/features/product-experience/saas/saas-product-model";
import {
  DeliverableGenerationLiveTracker,
  DeliverableProgressSummary,
  ExecutiveOverviewShell,
  ExecutiveProductKeyDeliverables,
  ExecutiveStorySection,
  ProductAttentionCallout,
  ProductMilestoneTimeline,
  ProductNextAction,
  buildExecutiveOverviewModel,
} from "@/features/product-experience/saas/executive-overview-components";
import { useProductBuildStatus } from "@/features/product-experience/saas/use-product-build-status";
import {
  premiumEnrichmentApi,
  type PremiumEnrichmentItem,
  type PremiumEnrichmentWorkspace,
  type PremiumSelectiveReprocessResult,
} from "@/features/product-experience/saas/premium-enrichment-api";
import {
  acpDirectApi,
  type AcpDirectRouteResolution,
} from "@/features/product-experience/saas/acp-direct-api";
import { PackageStageView, ValidateStageView } from "@/features/product-experience/saas/saas-stage-views";
import { ProfessionalArtifactViewer } from "@/features/product-experience/saas/professional-artifact-viewer";
import { sessionsApi } from "@/features/sessions/session-api";
import type { ConstructionQuestionViewEntry } from "@/features/sessions/session-contracts";
import type { ACPWorkspaceResponse, CommercialTier, ExportJobResponse } from "@/features/sessions/types";
import { cn } from "@/lib/utils";

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

async function executeBlueprintProDownload({
  sessionId,
}: {
  sessionId: string;
}) {
  const job = await sessionsApi.createExportJob(sessionId, {
    artifact_kind: "blueprint_professional",
    profile: "professional",
  });
  if (job.status === "ready" && job.download_url) {
    if (typeof window !== "undefined") {
      window.location.assign(job.download_url);
    }
    return job;
  }
  if (job.status === "expired") {
    const retried = await sessionsApi.retryExportJob(sessionId, job.id);
    if (retried.download_url && typeof window !== "undefined") {
      window.location.assign(retried.download_url);
    }
    return retried;
  }
  return job;
}

async function executeAcpZipDownload({
  sessionId,
}: {
  sessionId: string;
}) {
  const job = await sessionsApi.createExportJob(sessionId, {
    artifact_kind: "acp_portable_zip",
    profile: "acp-portable",
  });
  if (job.status === "ready" && job.download_url) {
    if (typeof window !== "undefined") {
      window.location.assign(job.download_url);
    }
    return job;
  }
  if (job.status === "expired") {
    const retried = await sessionsApi.retryExportJob(sessionId, job.id);
    if (retried.download_url && typeof window !== "undefined") {
      window.location.assign(retried.download_url);
    }
    return retried;
  }
  return job;
}

type InlineNoticeTone = "danger" | "warning" | "success";

type InlineNotice = {
  message: string;
  tone: InlineNoticeTone;
};

type AcpPreparationState = {
  canExportZip: boolean;
  canStartPackage: boolean;
  nextHref: string;
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

function formatAcpPhaseStatus(
  language: SupportedLanguage,
  status: string,
) {
  switch (status) {
    case "completed":
      return byLanguage(language, { en: "Completed", es: "Completada", pt: "Concluida" });
    case "completed_with_observations":
      return byLanguage(language, { en: "Completed with observations", es: "Completada con observaciones", pt: "Concluida com observacoes" });
    case "waiting_user":
      return byLanguage(language, { en: "Waiting user", es: "Espera usuario", pt: "Aguardando usuario" });
    case "blocked":
      return byLanguage(language, { en: "Blocked", es: "Bloqueada", pt: "Bloqueada" });
    case "running":
      return byLanguage(language, { en: "Running", es: "Procesando", pt: "Processando" });
    case "failed":
      return byLanguage(language, { en: "Failed", es: "Falló", pt: "Falhou" });
    case "stale":
      return byLanguage(language, { en: "Stale", es: "Desactualizada", pt: "Desatualizada" });
    case "canceled":
      return byLanguage(language, { en: "Canceled", es: "Cancelada", pt: "Cancelada" });
    default:
      return byLanguage(language, { en: "Not started", es: "Sin iniciar", pt: "Nao iniciada" });
  }
}

function phaseTone(status: string) {
  if (status === "completed" || status === "completed_with_observations") return "success";
  if (status === "blocked" || status === "failed") return "danger";
  if (status === "running") return "info";
  return "warning";
}

function formatDomainLabel(domain: string) {
  const normalized = domain.replace(/_/g, " ").trim();
  if (!normalized) return "general";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

type ProductSaasViewProps = {
  activeRoute: ProductExperienceRouteSnapshot | null;
  section: ProductExperienceProductSection;
};

type ProductTierScope = CommercialTier;
type ProductArtifactCard = ReturnType<typeof buildProductSaasViewModel>["artifactCards"][number];
type BlueprintResultTab = "enrichment" | "overview" | "validate" | "package" | "diagrams" | "governed-artifacts" | "commercial-artifacts";
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

function MetricStrip({ metrics }: { metrics: ProductMetric[] }) {
  const { language } = useLanguage();

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <UxaMetricCard
          description={metric.detail}
          key={metric.key}
          label={
            <span className="inline-flex items-center gap-2">
              {metric.label}
              <UxaBadge tone={metric.tone}>{getToneBadgeLabel(language, metric.tone)}</UxaBadge>
            </span>
          }
          value={metric.value}
        />
      ))}
    </div>
  );
}

function ProductProgressCards({
  activeRoute,
}: {
  activeRoute: ProductExperienceRouteSnapshot | null;
}) {
  const { language } = useLanguage();
  const viewModel = buildProductSaasViewModel({
    activeRoute,
    language,
    section: "blueprint",
  });

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {viewModel.products.map((product) => (
        <a
          className="uxa-card block p-4 transition hover:-translate-y-0.5 hover:shadow-[var(--uxa-shadow-card)]"
          href={product.href}
          key={product.key}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <UxaBadge tone={product.tone}>{product.label}</UxaBadge>
              <p className="mt-3 text-[13px] leading-5 text-[var(--uxa-color-ink-soft)]">
                {product.detail}
              </p>
            </div>
            <ArrowUpRight
              aria-hidden="true"
              className="h-4 w-4 text-[var(--uxa-color-ink-muted)]"
            />
          </div>
          <div className="mt-4">
            <div className="mb-2 flex justify-between text-[10px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)]">
              <span>
                {byLanguage(language, {
                  en: "Progress",
                  es: "Avance",
                  pt: "Avanco",
                })}
              </span>
              <span>{product.progress}%</span>
            </div>
            <UxaProcessingStrip
              label={byLanguage(language, {
                en: `Progress ${product.label}`,
                es: `Avance ${product.label}`,
                pt: `Avanco ${product.label}`,
              })}
              value={product.progress}
            />
          </div>
        </a>
      ))}
    </div>
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

function getProductOverviewTabConfig(tierScope: ProductTierScope, language: "en" | "es" | "pt") {
  if (tierScope === "blueprint") {
    return {
      description: byLanguage(language, {
        en: "Executive story of the LEAN journey and generated value.",
        es: "Historia ejecutiva del viaje LEAN y del valor generado.",
        pt: "Historia executiva da jornada LEAN e do valor gerado.",
      }),
      label: byLanguage(language, {
        en: "Blueprint summary",
        es: "Resumen Blueprint",
        pt: "Resumo Blueprint",
      }),
      productKey: "blueprint_basic" as const,
    };
  }

  if (tierScope === "blueprint_pro") {
    return {
      description: byLanguage(language, {
        en: "Executive story of the enriched Blueprint, decisions and professional deliverables.",
        es: "Historia ejecutiva del Blueprint enriquecido, decisiones y entregables profesionales.",
        pt: "Historia executiva do Blueprint enriquecido, decisoes e entregaveis profissionais.",
      }),
      label: byLanguage(language, {
        en: "Pro summary",
        es: "Resumen Pro",
        pt: "Resumo Pro",
      }),
      productKey: "blueprint_pro" as const,
    };
  }

  if (tierScope === "acp") {
    return {
      description: byLanguage(language, {
        en: "Executive story of the construction package, readiness and implementation assets.",
        es: "Historia ejecutiva del paquete de construccion, readiness y activos de implementacion.",
        pt: "Historia executiva do pacote de construcao, prontidao e ativos de implementacao.",
      }),
      label: byLanguage(language, {
        en: "ACP summary",
        es: "Resumen ACP",
        pt: "Resumo ACP",
      }),
      productKey: "acp" as const,
    };
  }

  return null;
}
function normalizeBlueprintResultTab(
  value: string | null,
  options: {
    hasAcpWorkflowTabs: boolean;
    hasEnrichmentTab: boolean;
    hasProductOverview: boolean;
  },
): BlueprintResultTab {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replaceAll("_", "-");

  if (["enrichment", "enriquecimiento", "resuelve"].includes(normalized) && options.hasEnrichmentTab) {
    return "enrichment";
  }

  if (normalized === "overview" && options.hasProductOverview) {
    return "overview";
  }

  if (normalized === "validate" && options.hasAcpWorkflowTabs) {
    return "validate";
  }

  if (["package", "packaging", "empaquetar"].includes(normalized) && options.hasAcpWorkflowTabs) {
    return "package";
  }

  if (normalized === "diagrams") {
    return "diagrams";
  }

  if (["governed-artifacts", "artifacts", "governed"].includes(normalized)) {
    return "governed-artifacts";
  }

  if (["commercial-artifacts", "commercial"].includes(normalized)) {
    return "commercial-artifacts";
  }

  if (options.hasEnrichmentTab) {
    return "enrichment";
  }

  return options.hasProductOverview ? "overview" : "diagrams";
}

function getAcpResultTabHref(sessionId: string, tab: Extract<BlueprintResultTab, "validate" | "package">) {
  return `/projects/${sessionId}/acp?acp_tab=${tab}`;
}

function CommercialBlueprintResult({
  activeRoute,
  artifactCards,
  projectTitle,
  sessionId,
  tierScope,
  unlocked = false,
}: {
  activeRoute?: ProductExperienceRouteSnapshot | null;
  artifactCards: ReturnType<typeof buildProductSaasViewModel>["artifactCards"];
  projectTitle: string;
  sessionId: string;
  tierScope: ProductTierScope;
  unlocked?: boolean;
}) {
  const { language } = useLanguage();
  const searchParams = useSearchParams();
  const overviewTab = getProductOverviewTabConfig(tierScope, language);
  const hasProductOverview = Boolean(overviewTab);
  const hasAcpWorkflowTabs = tierScope === "acp";
  const hasEnrichmentTab = tierScope === "blueprint_pro";
  const productBuildKey = overviewTab?.productKey ?? (tierScope === "acp" ? "acp" : tierScope === "blueprint_pro" ? "blueprint_pro" : "blueprint_basic");
  const requestedTab = searchParams.get("acp_tab") ?? searchParams.get("result_tab");
  const productBuild = useProductBuildStatus(sessionId, productBuildKey, {
    polling: true,
    staleWhileRevalidating: true,
  });
  const diagramCatalogFilter = useMemo(
    () => (item: DiagramCatalogItem) => isTierIncluded(item.required_tier, tierScope),
    [tierScope],
  );
  const commercialCards = useMemo(
    () =>
      artifactCards.filter(
        (artifact) => artifact.isCommercial && isTierIncluded(resolveArtifactTier(artifact), tierScope),
      ),
    [artifactCards, tierScope],
  );
  const commercialArtifacts = useMemo(() => commercialCards.filter((artifact) => !artifact.isDiagram), [commercialCards]);
  const [selectedKey, setSelectedKey] = useState(commercialArtifacts[0]?.key ?? "");
  const effectiveCommercialSelectedKey =
    selectedKey && commercialArtifacts.some((artifact) => artifact.key === selectedKey)
      ? selectedKey
      : commercialArtifacts[0]?.key ?? "";
  const selectedArtifact = commercialArtifacts.find((artifact) => artifact.key === effectiveCommercialSelectedKey) ?? null;
  const documentCount = commercialArtifacts.length;

  function metadataText(artifact: (typeof commercialArtifacts)[number], key: string, fallback = "") {
    const value = artifact.metadata[key];
    return typeof value === "string" && value.trim() ? value : fallback;
  }

  function metadataList(artifact: (typeof commercialArtifacts)[number], key: string) {
    const value = artifact.metadata[key];
    if (Array.isArray(value)) {
      return value.map(String).filter(Boolean);
    }
    if (typeof value === "string" && value.trim()) {
      return value.split("\n").map((item) => item.trim()).filter(Boolean);
    }
    return [];
  }

  function fallbackCommercialPurpose(artifact: (typeof commercialArtifacts)[number]) {
    const key = String(artifact.metadata.artifact_key ?? artifact.key).toLocaleLowerCase("es");
    if (key.includes("resultado-ejecutivo")) {
      return byLanguage(language, {
        en: "Executive summary of the business problem, proposed solution, architecture, memory, and minimum tools.",
        es: "Resumen ejecutivo del problema, solucion propuesta, arquitectura, memoria y herramientas minimas.",
        pt: "Resumo executivo do problema, solucao proposta, arquitetura, memoria e ferramentas minimas.",
      });
    }
    if (key.includes("comparativa-valor")) {
      return byLanguage(language, {
        en: "Commercial comparison of effort, cost, savings, and estimation scope.",
        es: "Comparativa comercial de esfuerzo, costo, ahorro y alcance de la estimacion.",
        pt: "Comparativo comercial de esforco, custo, economia e escopo da estimativa.",
      });
    }
    if (key.includes("arquitectura")) {
      return byLanguage(language, {
        en: "High-level view of how the business need becomes architecture, tools, memory, and value.",
        es: "Vista de alto nivel de como la necesidad de negocio se convierte en arquitectura, herramientas, memoria y valor.",
        pt: "Visao de alto nivel de como a necessidade de negocio vira arquitetura, ferramentas, memoria e valor.",
      });
    }
    if (key.includes("flujo-valor")) {
      return byLanguage(language, {
        en: "LEAN value flow from discovery to the commercial Blueprint result.",
        es: "Flujo de valor LEAN desde descubrimiento hasta el resultado comercial del Blueprint.",
        pt: "Fluxo de valor LEAN da descoberta ate o resultado comercial do Blueprint.",
      });
    }
    return "";
  }

  function fallbackCommercialDescription(artifact: (typeof commercialArtifacts)[number]) {
    const key = String(artifact.metadata.artifact_key ?? artifact.key).toLocaleLowerCase("es");
    if (key.includes("resultado-ejecutivo")) {
      return byLanguage(language, {
        en: "Consolidated executive vision designed to align business leaders and technical teams before implementation.",
        es: "Vision ejecutiva consolidada para alinear lideres de negocio y equipo tecnico antes de implementar.",
        pt: "Visao executiva consolidada para alinhar lideranca e time tecnico antes de implementar.",
      });
    }
    if (key.includes("comparativa-valor")) {
      return byLanguage(language, {
        en: "Defends investment, projected savings, and comparison across development scenarios.",
        es: "Defiende la inversion, el ahorro proyectado y la comparativa entre escenarios de desarrollo.",
        pt: "Defende o investimento, a economia projetada e a comparacao entre cenarios.",
      });
    }
    if (key.includes("arquitectura")) {
      return byLanguage(language, {
        en: "Architectural blueprint and capabilities explaining technical feasibility clearly.",
        es: "Blueprint de arquitectura y capacidades que explica la viabilidad tecnica con claridad.",
        pt: "Blueprint de arquitetura e capacidades que explica a viabilidade tecnica com clareza.",
      });
    }
    return metadataText(artifact, "description", artifact.detail);
  }

  function fallbackContains(): string[] {
    return [
      byLanguage(language, {
        en: "Commercial artifact generated to explain the value and scope of the Blueprint.",
        es: "Artefacto comercial generado para explicar el valor y alcance del Blueprint.",
        pt: "Artefato comercial gerado para explicar o valor e escopo do Blueprint.",
      }),
    ];
  }

  function fallbackCommercialAudience(artifact: (typeof commercialArtifacts)[number]) {
    const key = String(artifact.metadata.artifact_key ?? artifact.key).toLocaleLowerCase("es");
    if (key.includes("comparativa-valor")) {
      return [
        byLanguage(language, { en: "CFO / Finance", es: "CFO / Finanzas", pt: "CFO / Financas" }),
        byLanguage(language, { en: "Procurement", es: "Compras", pt: "Compras" }),
        byLanguage(language, { en: "Executive sponsor", es: "Sponsor ejecutivo", pt: "Sponsor executivo" }),
      ];
    }
    return [
      byLanguage(language, { en: "Executive leadership", es: "Liderazgo ejecutivo", pt: "Lideranca executiva" }),
      byLanguage(language, { en: "Product owner", es: "Product owner", pt: "Product owner" }),
      byLanguage(language, { en: "Architecture team", es: "Equipo de arquitectura", pt: "Time de arquitetura" }),
    ];
  }

  function fallbackCommercialHighlights(artifact: (typeof commercialArtifacts)[number]) {
    const key = String(artifact.metadata.artifact_key ?? artifact.key).toLocaleLowerCase("es");
    if (key.includes("comparativa-valor")) {
      return [
        byLanguage(language, { en: "Development scenarios", es: "Escenarios de desarrollo", pt: "Cenarios de desenvolvimento" }),
        byLanguage(language, { en: "Clear effort and cost", es: "Esfuerzo y costo claros", pt: "Esforco e custo claros" }),
        byLanguage(language, { en: "Savings and ROI projection", es: "Proyeccion de ahorro y ROI", pt: "Projecao de economia e ROI" }),
      ];
    }
    return [
      byLanguage(language, { en: "Executive explanation", es: "Explicacion ejecutiva", pt: "Explicacao executiva" }),
      byLanguage(language, { en: "Approved context", es: "Contexto aprobado", pt: "Contexto aprovado" }),
      byLanguage(language, { en: "Commercial decision support", es: "Soporte para decision comercial", pt: "Suporte para decisao comercial" }),
    ];
  }

  const renderCatalogItem = (artifact: (typeof commercialArtifacts)[number]) => {
    const selected = selectedArtifact?.key === artifact.key;
    const purpose = metadataText(artifact, "purpose", fallbackCommercialPurpose(artifact));
    return (
      <article className={`${diagramCenterStyles.card} ${selected ? diagramCenterStyles.cardSelected : ""} ${diagramCenterStyles.listCard}`} key={artifact.key}>
        <div>
          <div className={diagramCenterStyles.cardTop}>
            <span className={diagramCenterStyles.tag}>
              {artifact.isDiagram
                ? byLanguage(language, { en: "Diagram", es: "Diagrama", pt: "Diagrama" })
                : byLanguage(language, { en: "Artifact", es: "Artefacto", pt: "Artefato" })}
            </span>
            <span className={`${diagramCenterStyles.status} ${diagramCenterStyles.statusAvailable}`}>
              {byLanguage(language, { en: "Commercial", es: "Comercial", pt: "Comercial" })}
            </span>
          </div>
          <button
            aria-pressed={selected}
            className={diagramCenterStyles.cardTitleButton}
            onClick={() => setSelectedKey(artifact.key)}
            type="button"
          >
            <h4>{artifact.label}</h4>
            <p>{purpose}</p>
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
  };

  const [activeTab, setActiveTab] = useState<BlueprintResultTab | null>(null);
  const effectiveActiveTab = normalizeBlueprintResultTab(activeTab ?? requestedTab, {
    hasAcpWorkflowTabs,
    hasEnrichmentTab,
    hasProductOverview,
  });
  const tabItems: Array<{
    key: BlueprintResultTab;
    label: string;
    description: string;
    count?: number;
  }> = [
    ...(hasEnrichmentTab
      ? [
          {
            key: "enrichment" as const,
            label: byLanguage(language, {
              en: "Enrichment Pro",
              es: "Enriquecimiento Pro",
              pt: "Enriquecimento Pro",
            }),
            description: byLanguage(language, {
              en: "Resolve only what improves the professional Blueprint.",
              es: "Resuelve solo lo que mejora el Blueprint profesional.",
              pt: "Resolva apenas o que melhora o Blueprint profissional.",
            }),
          },
        ]
      : []),
    ...(overviewTab
      ? [
          {
            key: "overview" as const,
            label: overviewTab.label,
            description: overviewTab.description,
          },
        ]
      : []),
    ...(hasAcpWorkflowTabs
      ? [
          {
            key: "validate" as const,
            label: byLanguage(language, {
              en: "Validate Blueprint",
              es: "Validar Blueprint",
              pt: "Validar Blueprint",
            }),
            description: byLanguage(language, {
              en: "Test Suite, simulations, gaps, and readiness before building the package.",
              es: "Test Suite, simulaciones, gaps y readiness antes de construir el paquete.",
              pt: "Test Suite, simulacoes, gaps e prontidao antes de construir o pacote.",
            }),
          },
          {
            key: "package" as const,
            label: byLanguage(language, {
              en: "Package ACP",
              es: "Empaquetar ACP",
              pt: "Empacotar ACP",
            }),
            description: byLanguage(language, {
              en: "Portable package, implementation instructions, contracts, and technical assets.",
              es: "Paquete portable, instrucciones de implementacion, contratos y activos tecnicos.",
              pt: "Pacote portavel, instrucoes de implementacao, contratos e ativos tecnicos.",
            }),
          },
        ]
      : []),
    {
      key: "diagrams",
      label: byLanguage(language, {
        en: `${productTierLabel(language, tierScope)} diagrams`,
        es: `Diagramas de ${productTierLabel(language, tierScope)}`,
        pt: `Diagramas de ${productTierLabel(language, tierScope)}`,
      }),
      description: byLanguage(language, {
        en: "Visual governed catalog by product access rules.",
        es: "Catalogo visual gobernado por reglas de acceso del producto.",
        pt: "Catalogo visual governado por regras de acceso del producto.",
      }),
    },
    {
      key: "governed-artifacts",
      label: byLanguage(language, {
        en: "Governed artifacts",
        es: "Artefactos gobernados",
        pt: "Artefatos governados",
      }),
      description: byLanguage(language, {
        en: "Functional and technical deliverables managed by governance.",
        es: "Entregables funcionales y tecnicos administrados por gobernanza.",
        pt: "Entregaveis funcionais e tecnicos administrados por governanca.",
      }),
    },
    {
      key: "commercial-artifacts",
      label: byLanguage(language, {
        en: "Commercial artifacts",
        es: "Artefactos comerciales",
        pt: "Artefatos comerciais",
      }),
      description: byLanguage(language, {
        en: "Executive material prepared to explain value and conversion.",
        es: "Material ejecutivo preparado para explicar valor y conversion.",
        pt: "Material executivo preparado para explicar valor e conversao.",
      }),
      count: documentCount,
    },
  ];

  return (
    <section aria-labelledby="commercial-blueprint-result-title" className={diagramCenterStyles.root}>
      <header className="uxa-card p-3 md:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h2 id="commercial-blueprint-result-title" className="text-[17px] font-black text-[var(--uxa-color-ink)]">
                {byLanguage(language, {
                  en: "Blueprint result",
                  es: "Resultado del Blueprint",
                  pt: "Resultado do Blueprint",
                })}
              </h2>
              <UxaBadge tone="info">{productTierLabel(language, tierScope)}</UxaBadge>
            </div>
            <p className="mt-1 max-w-3xl text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
              {byLanguage(language, {
                en: "Explore diagrams and artifacts from one compact surface. Each tab reuses the governed viewers and preserves access rules.",
                es: "Explora diagramas y artefactos desde una superficie compacta. Cada pestana reutiliza los visores gobernados y conserva las reglas de acceso.",
                pt: "Explore diagramas e artefatos em uma superficie compacta. Cada aba reutiliza os visualizadores governados e preserva as regras de acesso.",
              })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a className="uxa-button uxa-button--secondary" href={`/projects/${sessionId}/diagrams`}>
              <span>{byLanguage(language, { en: "Open Diagram Center", es: "Abrir Diagram Center", pt: "Abrir Diagram Center" })}</span>
            </a>
            <a className="uxa-button uxa-button--secondary" href={`/projects/${sessionId}/artifacts`}>
              <span>{byLanguage(language, { en: "Open Artifacts", es: "Abrir Artefactos", pt: "Abrir Artefatos" })}</span>
            </a>
          </div>
        </div>
        <div
          aria-label={byLanguage(language, {
            en: "Blueprint result sections",
            es: "Secciones del resultado Blueprint",
            pt: "Secoes do resultado Blueprint",
          })}
          className={cn(
            "mt-3 grid gap-2",
            hasAcpWorkflowTabs
              ? "md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"
              : hasEnrichmentTab
                ? "md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5"
                : hasProductOverview
                  ? "md:grid-cols-2 xl:grid-cols-4"
                  : "md:grid-cols-3",
          )}
          role="tablist"
        >
          {tabItems.map((tab) => {
            const selected = effectiveActiveTab === tab.key;
            return (
              <button
                aria-controls={`blueprint-result-panel-${tab.key}`}
                aria-selected={selected}
                className={cn(
                  "rounded-[var(--uxa-radius-lg)] border px-3 py-2 text-left transition",
                  selected
                    ? "border-[var(--uxa-color-brand)] bg-[var(--uxa-color-brand)] text-white shadow-[var(--uxa-shadow-card)]"
                    : "border-[var(--uxa-color-border)] bg-white text-[var(--uxa-color-ink)] hover:border-[var(--uxa-color-brand)]",
                )}
                id={`blueprint-result-tab-${tab.key}`}
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                role="tab"
                type="button"
              >
                <span className="flex items-center justify-between gap-2 text-[12px] font-black">
                  <span>{tab.label}</span>
                  {typeof tab.count === "number" ? (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px]",
                        selected
                          ? "bg-white/20 text-white"
                          : "bg-[var(--uxa-color-muted-panel)] text-[var(--uxa-color-ink-muted)]",
                      )}
                    >
                      {tab.count}
                    </span>
                  ) : null}
                </span>
                <span
                  className={cn(
                    "mt-1 block line-clamp-2 text-[11px] leading-4",
                    selected ? "text-white/80" : "text-[var(--uxa-color-ink-soft)]",
                  )}
                >
                  {tab.description}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {effectiveActiveTab !== "overview" ? (
        productBuild.isError ? (
          <UxaSurface className="border-[var(--uxa-state-danger-border)] bg-[var(--uxa-state-danger-bg)] p-4">
            <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[var(--uxa-state-danger)]">
              {byLanguage(language, {
                en: "Product status unavailable",
                es: "Estado del producto no disponible",
                pt: "Estado do produto indisponivel",
              })}
            </p>
            <p className="mt-2 text-[13px] leading-5 text-[var(--uxa-color-ink-soft)]">
              {byLanguage(language, {
                en: "The build status could not be loaded. Diagram and artifact generation may still be running in the background.",
                es: "No se pudo cargar el estado del build. La generacion de diagramas y artefactos puede seguir ejecutandose en segundo plano.",
                pt: "Nao foi possivel carregar o estado do build. A geracao de diagramas e artefatos pode seguir executando em segundo plano.",
              })}
            </p>
          </UxaSurface>
        ) : productBuild.data ? (
          <DeliverableGenerationLiveTracker
            productKey={productBuildKey}
            productLabel={productTierLabel(language, tierScope)}
            status={productBuild.data}
          />
        ) : productBuild.isLoading || productBuild.isFetching ? (
          <UxaSurface className="border border-[var(--uxa-color-brand)] bg-[var(--uxa-color-brand-soft)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--uxa-color-brand)]">
                  {byLanguage(language, {
                    en: "Build status",
                    es: "Estado del build",
                    pt: "Estado do build",
                  })}
                </p>
                <p className="mt-1 text-[13px] leading-5 text-[var(--uxa-color-ink)]">
                  {byLanguage(language, {
                    en: "Checking diagram and artifact progress for this product surface.",
                    es: "Validando el progreso de diagramas y artefactos para esta superficie del producto.",
                    pt: "Validando o progresso de diagramas e artefatos para esta superficie do produto.",
                  })}
                </p>
              </div>
              <UxaBadge tone="info">
                {byLanguage(language, {
                  en: "Updating",
                  es: "Actualizando",
                  pt: "Atualizando",
                })}
              </UxaBadge>
            </div>
          </UxaSurface>
        ) : null
      ) : null}

      {effectiveActiveTab === "enrichment" && hasEnrichmentTab ? (
        <div
          aria-labelledby="blueprint-result-tab-enrichment"
          id="blueprint-result-panel-enrichment"
          role="tabpanel"
        >
          <PremiumEnrichmentPanel activeRoute={activeRoute ?? null} unlocked={unlocked} />
        </div>
      ) : null}

      {effectiveActiveTab === "validate" && hasAcpWorkflowTabs ? (
        <div
          aria-labelledby="blueprint-result-tab-validate"
          id="blueprint-result-panel-validate"
          role="tabpanel"
        >
          <ValidateStageView activeRoute={activeRoute ?? null} />
        </div>
      ) : null}

      {effectiveActiveTab === "package" && hasAcpWorkflowTabs ? (
        <div
          aria-labelledby="blueprint-result-tab-package"
          id="blueprint-result-panel-package"
          role="tabpanel"
        >
          <PackageStageView activeRoute={activeRoute ?? null} />
        </div>
      ) : null}

      {effectiveActiveTab === "overview" && overviewTab ? (
        <div
          aria-labelledby="blueprint-result-tab-overview"
          id="blueprint-result-panel-overview"
          role="tabpanel"
        >
          <ProductExecutiveOverviewTab
            productKey={overviewTab.productKey}
            projectTitle={projectTitle}
            sessionId={sessionId}
          />
        </div>
      ) : null}

      {effectiveActiveTab === "diagrams" ? (
        <div
          aria-labelledby="blueprint-result-tab-diagrams"
          id="blueprint-result-panel-diagrams"
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
            subtitle={byLanguage(language, {
              en: productTierDescription(language, tierScope),
              es: productTierDescription(language, tierScope),
              pt: productTierDescription(language, tierScope),
            })}
            title={byLanguage(language, {
              en: `${productTierLabel(language, tierScope)} diagrams`,
              es: `Diagramas de ${productTierLabel(language, tierScope)}`,
              pt: `Diagramas de ${productTierLabel(language, tierScope)}`,
            })}
          />
        </div>
      ) : null}

      {effectiveActiveTab === "governed-artifacts" ? (
        <div
          aria-labelledby="blueprint-result-tab-governed-artifacts"
          id="blueprint-result-panel-governed-artifacts"
          role="tabpanel"
        >
          <ProductDeliverableCatalog
            artifactCards={artifactCards}
            currentStage={tierScope === "blueprint" ? "estimate" : "package"}
            sessionId={sessionId}
            tierScope={tierScope}
          />
        </div>
      ) : null}

      {effectiveActiveTab === "commercial-artifacts" && commercialArtifacts.length ? (
        <div className={diagramCenterStyles.workspace}>
          <section aria-label="Catalogo comercial del Blueprint" className={diagramCenterStyles.catalogPane}>
            <div className={diagramCenterStyles.paneHeader}>
              <div>
                <h3>{byLanguage(language, { en: "Commercial artifacts", es: "Artefactos comerciales", pt: "Artefatos comerciais" })}</h3>
                <p>{commercialArtifacts.length} / {commercialArtifacts.length}</p>
              </div>
              <span className={diagramCenterStyles.tag}>
                {byLanguage(language, { en: "Blueprint result", es: "Resultado Blueprint", pt: "Resultado Blueprint" })}
              </span>
            </div>
            <div className={diagramCenterStyles.catalogList}>
              {commercialArtifacts.map(renderCatalogItem)}
            </div>
          </section>

          <aside aria-label="Visor del resultado comercial" className={diagramCenterStyles.viewerPane}>
            <div className={diagramCenterStyles.paneHeader}>
              <div>
                <h3>{byLanguage(language, { en: "Viewer", es: "Visor", pt: "Visualizador" })}</h3>
                <p>{selectedArtifact?.exportFormat ?? byLanguage(language, { en: "Select an item", es: "Selecciona un item", pt: "Selecione um item" })}</p>
              </div>
              {selectedArtifact ? (
                <span className={`${diagramCenterStyles.status} ${diagramCenterStyles.statusAvailable}`}>
                  {selectedArtifact.isDiagram
                    ? byLanguage(language, { en: "Diagram", es: "Diagrama", pt: "Diagrama" })
                    : byLanguage(language, { en: "Artifact", es: "Artefacto", pt: "Artefato" })}
                </span>
              ) : null}
            </div>
            {selectedArtifact ? (
              <div className={diagramCenterStyles.viewerBody}>
                <div>
                  <h3 className={diagramCenterStyles.viewerTitle}>{selectedArtifact.label}</h3>
                  <p className={diagramCenterStyles.viewerDescription}>
                    {metadataText(selectedArtifact, "purpose", fallbackCommercialPurpose(selectedArtifact))}
                  </p>
                </div>
                <div className={diagramCenterStyles.viewerMeta}>
                  <span className={diagramCenterStyles.tag}>{selectedArtifact.exportFormat}</span>
                  <span className={diagramCenterStyles.tag}>{selectedArtifact.stage}</span>
                  <span className={diagramCenterStyles.tag}>{selectedArtifact.versionLabel}</span>
                  <span className={diagramCenterStyles.tag}>{String(selectedArtifact.metadata.artifact_key ?? selectedArtifact.key)}</span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-border-soft)] bg-[var(--uxa-color-muted-panel)] p-4">
                    <p className="font-mono text-[10px] font-black uppercase tracking-[.16em] text-[var(--uxa-color-ink-muted)]">
                      {byLanguage(language, { en: "What it represents", es: "Que representa", pt: "O que representa" })}
                    </p>
                    <p className="mt-2 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
                      {metadataText(selectedArtifact, "purpose", fallbackCommercialPurpose(selectedArtifact))}
                    </p>
                  </div>
                  <div className="rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-border-soft)] bg-[var(--uxa-color-muted-panel)] p-4">
                    <p className="font-mono text-[10px] font-black uppercase tracking-[.16em] text-[var(--uxa-color-ink-muted)]">
                      {byLanguage(language, { en: "What it is for", es: "Para que sirve", pt: "Para que serve" })}
                    </p>
                    <p className="mt-2 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
                      {metadataText(selectedArtifact, "usage", byLanguage(language, {
                        en: "Use it to explain the Blueprint value and decide whether to move to the next commercial product.",
                        es: "Usalo para explicar el valor del Blueprint y decidir si avanzar al siguiente producto comercial.",
                        pt: "Use para explicar o valor do Blueprint e decidir se avancar ao proximo produto comercial.",
                      }))}
                    </p>
                  </div>
                </div>
                <div className="rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-border-soft)] bg-white p-4">
                  <p className="font-mono text-[10px] font-black uppercase tracking-[.16em] text-[var(--uxa-color-ink-muted)]">
                    {byLanguage(language, { en: "What you will find", es: "Que encontraras", pt: "O que voce encontrara" })}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(metadataList(selectedArtifact, "contains").length ? metadataList(selectedArtifact, "contains") : fallbackContains()).map((item) => (
                      <span className={diagramCenterStyles.tag} key={item}>{item}</span>
                    ))}
                  </div>
                </div>
                <ProfessionalArtifactViewer
                  canCopy={tierScope !== "blueprint"}
                  canDownload={tierScope !== "blueprint"}
                  contentText={selectedArtifact.contentText}
                  description={metadataText(selectedArtifact, "purpose", fallbackCommercialPurpose(selectedArtifact))}
                  detail={selectedArtifact.detail}
                  exportFormat={selectedArtifact.exportFormat}
                  metadata={selectedArtifact.metadata}
                  protectedView={tierScope === "blueprint"}
                  stage={selectedArtifact.stage}
                  title={selectedArtifact.label}
                  versionLabel={selectedArtifact.versionLabel}
                />
              </div>
            ) : (
              <div className={diagramCenterStyles.viewerBody}>
                <div className={diagramCenterStyles.statePanel}>
                  <div>
                    <Boxes aria-hidden="true" size={28} />
                    <h4>{byLanguage(language, { en: "Select an item", es: "Selecciona un item", pt: "Selecione um item" })}</h4>
                    <p>{byLanguage(language, {
                      en: "Choose a commercial artifact to understand its purpose and content.",
                      es: "Elige un artefacto comercial para entender su proposito y contenido.",
                      pt: "Escolha um artefato comercial para entender seu proposito e conteudo.",
                    })}</p>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      ) : null}

      {effectiveActiveTab === "commercial-artifacts" && !commercialArtifacts.length ? (
        <p className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-[var(--uxa-color-muted-panel)] p-4 text-[13px] text-[var(--uxa-color-ink-soft)]">
          {byLanguage(language, {
            en: "The commercial result has not been prepared yet. Go back to Estimate and select View Blueprint result to generate the corresponding diagrams and artifacts.",
            es: "El resultado comercial aun no ha sido preparado. Vuelve a Estimar y selecciona Ver resultado Blueprint para generar los diagramas y artefactos correspondientes.",
            pt: "O resultado comercial ainda nao foi preparado. Volte para Estimar e selecione Ver resultado Blueprint para gerar os diagramas e artefatos correspondentes.",
          })}
        </p>
      ) : null}
    </section>
  );
}

function ProductExecutiveOverviewTab({
  productKey,
  projectTitle,
  sessionId,
}: {
  productKey: ExecutiveOverviewProductKey;
  projectTitle: string;
  sessionId: string;
}) {
  const { language } = useLanguage();
  const productBuild = useProductBuildStatus(sessionId, productKey, {
    polling: true,
    staleWhileRevalidating: true,
  });
  const overview = useMemo(
    () =>
      buildExecutiveOverviewModel({
        productKey,
        projectTitle,
        sessionId,
        status: productBuild.data,
      }),
    [productBuild.data, productKey, projectTitle, sessionId],
  );
  const [selectedMilestoneKey, setSelectedMilestoneKey] = useState<string | undefined>();
  const selectedMilestone =
    overview.milestones.find((milestone) => milestone.key === selectedMilestoneKey) ??
    overview.milestones.find((milestone) => milestone.progress < 80) ??
    overview.milestones[0];

  return (
    <ExecutiveOverviewShell model={overview} status={productBuild.data}>
      {productBuild.isError ? (
        <UxaSurface className="border-[var(--uxa-state-danger-border)] bg-[var(--uxa-state-danger-bg)] p-4">
          <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[var(--uxa-state-danger)]">
            {byLanguage(language, {
              en: "Product status unavailable",
              es: "Estado del producto no disponible",
              pt: "Estado do produto indisponivel",
            })}
          </p>
          <p className="mt-2 text-[13px] leading-5 text-[var(--uxa-color-ink-soft)]">
            {byLanguage(language, {
              en: "The Blueprint executive status could not be loaded. The generated result remains available through diagrams and artifacts.",
              es: "No se pudo cargar el estado ejecutivo del Blueprint. El resultado generado sigue disponible en diagramas y artefactos.",
              pt: "Nao foi possivel carregar o estado executivo do Blueprint. O resultado gerado segue disponivel em diagramas e artefatos.",
            })}
          </p>
        </UxaSurface>
      ) : null}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <ExecutiveProductKeyDeliverables productKey={productKey} sessionId={sessionId} />
        </div>
        <div className="space-y-5">
          <DeliverableGenerationLiveTracker
            productKey={productKey}
            productLabel={overview.productLabel}
            status={productBuild.data}
          />
          <DeliverableProgressSummary groups={overview.deliverableGroups} />
          <ProductNextAction model={overview} />
        </div>
      </div>
    </ExecutiveOverviewShell>
  );
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
            <DeliverableGenerationLiveTracker
              productKey={config.productKey}
              productLabel={overview.productLabel}
              status={productBuild.data}
            />
            <DeliverableProgressSummary groups={overview.deliverableGroups} />
            <ProductNextAction model={overview} />
          </div>
        </div>
      </ExecutiveOverviewShell>
      <UxaStickyActionBar
        label={byLanguage(language, {
          en: "Executive overview actions",
          es: "Acciones del resumen ejecutivo",
          pt: "Acoes do resumo executivo",
        })}
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
      </UxaStickyActionBar>
    </div>
  );
}

function BlueprintProductPage({
  activeRoute,
}: {
  activeRoute: ProductExperienceRouteSnapshot | null;
}) {
  const { language } = useLanguage();
  const searchParams = useSearchParams();
  const commercialOnly = searchParams.get("surface") === "commercial";
  const sessionId = activeRoute?.route.sessionId ?? "";
  const viewModel = buildProductSaasViewModel({
    activeRoute,
    language,
    section: "blueprint",
  });

  if (commercialOnly) {
    return (
      <div className="space-y-5">
        {false ? (
          <SectionHeader
          badge={byLanguage(language, {
            en: "Product 1 Â· Blueprint",
            es: "Producto 1 Â· Blueprint",
            pt: "Produto 1 Â· Blueprint",
          })}
          description={byLanguage(language, {
            en: "Commercial result with the Blueprint artifacts and diagrams intended to demonstrate value before downloading or moving to premium deliverables.",
            es: "Resultado comercial con los artefactos y diagramas del Blueprint destinados a demostrar valor antes de descargar o avanzar a entregables premium.",
            pt: "Resultado comercial com os artefatos e diagramas do Blueprint destinados a demonstrar valor antes de baixar ou avancar para entregaveis premium.",
          })}
          title={byLanguage(language, {
            en: "Blueprint commercial result",
            es: "Resultado comercial del Blueprint",
            pt: "Resultado comercial do Blueprint",
          })}
          />
        ) : null}
        <CommercialBlueprintResult
          activeRoute={activeRoute}
          artifactCards={viewModel.artifactCards}
          projectTitle={viewModel.title}
          sessionId={sessionId}
          tierScope="blueprint"
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {false ? (
        <SectionHeader
        badge={byLanguage(language, {
          en: "Product 1 · Blueprint",
          es: "Producto 1 · Blueprint",
          pt: "Produto 1 · Blueprint",
        })}
        description={byLanguage(language, {
          en: "Protected view of the generated end-to-end design. The user can explore value, architecture, and estimates without downloading or extracting content outside the platform.",
          es: "Vista protegida del diseno integral generado. El usuario puede explorar valor, arquitectura y estimacion sin descargar ni extraer contenido fuera de la plataforma.",
          pt: "Vista protegida do design integral gerado. O usuario pode explorar valor, arquitetura e estimativa sem baixar nem extrair conteudo fora da plataforma.",
        })}
        title={byLanguage(language, {
          en: "Blueprint outcome ready to demonstrate value",
          es: "Resultado del Blueprint listo para demostrar valor",
          pt: "Resultado do Blueprint pronto para demonstrar valor",
        })}
        />
      ) : null}
      <CommercialBlueprintResult
        activeRoute={activeRoute}
        artifactCards={viewModel.artifactCards}
        projectTitle={viewModel.title}
        sessionId={sessionId}
        tierScope="blueprint"
      />
      <UxaStickyActionBar
        label={byLanguage(language, {
          en: "Blueprint actions",
          es: "Acciones de Blueprint",
          pt: "Acoes de Blueprint",
        })}
      >
        <a
          className="uxa-button uxa-button--secondary"
          href={`/projects/${sessionId}/diagrams`}
        >
          <span>
            {byLanguage(language, {
              en: "Explore diagrams",
              es: "Explorar diagramas",
              pt: "Explorar diagramas",
            })}
          </span>
        </a>
        <a
          className="uxa-button uxa-button--primary"
          href={`/projects/${sessionId}/blueprint/pro`}
        >
          <span>
            {byLanguage(language, {
              en: "Get Blueprint Pro",
              es: "Adquirir Blueprint Pro",
              pt: "Adquirir Blueprint Pro",
            })}
          </span>
        </a>
      </UxaStickyActionBar>
    </div>
  );
}

function EnrichmentInputModal({
  item,
  onClose,
  onSubmit,
  resolving,
}: {
  item: PremiumEnrichmentItem | null;
  onClose: () => void;
  onSubmit: (answer: string) => Promise<void>;
  resolving: boolean;
}) {
  const { language } = useLanguage();
  const [inputVal, setInputVal] = useState("");

  useEffect(() => {
    if (item) {
      setInputVal(item.entry.suggested_answer || "");
    }
  }, [item]);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div
        className="w-full max-w-xl rounded-[var(--uxa-radius-xl)] border border-[var(--uxa-color-border)] bg-[var(--uxa-color-surface)] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--uxa-color-brand-muted)] text-[var(--uxa-color-brand)]">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-[17px] font-black">
                {byLanguage(language, {
                  en: "Enrich with client input",
                  es: "Enriquecer con input del cliente",
                  pt: "Enriquecer com input do cliente",
                })}
              </h3>
              <p className="text-[11px] text-[var(--uxa-color-ink-muted)]">
                {byLanguage(language, {
                  en: "Personalized context is analyzed first. Reprocessing runs only when the impact justifies it.",
                  es: "El contexto personalizado se analiza primero. El reprocesamiento solo corre cuando el impacto lo justifica.",
                  pt: "O contexto personalizado e analisado primeiro. O reprocessamento so acontece quando o impacto o justifica.",
                })}
              </p>
            </div>
          </div>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--uxa-color-ink-soft)] hover:bg-[var(--uxa-color-muted-panel)]"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] p-4 text-[13px]">
          <p className="font-bold text-[var(--uxa-color-ink-rich)]">{item.entry.title}</p>
          <p className="mt-1 text-[12px] text-[var(--uxa-color-ink-soft)]">{item.priority_reason}</p>
        </div>

        <div className="mt-4">
          <label className="block text-[12px] font-bold text-[var(--uxa-color-ink-rich)] mb-1.5">
            {byLanguage(language, {
              en: "Client input / Custom context:",
              es: "Input del cliente / Contexto personalizado:",
              pt: "Input do cliente / Contexto personalizado:",
            })}
          </label>
          <textarea
            className="w-full min-h-[110px] rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-[var(--uxa-color-surface)] p-3 text-[13px] leading-relaxed text-[var(--uxa-color-ink-rich)] placeholder:text-[var(--uxa-color-ink-muted)] focus:outline-hidden focus:ring-2 focus:ring-[var(--uxa-color-brand)]"
            placeholder={byLanguage(language, {
              en: "Enter specific requirements, business rules, or clarification...",
              es: "Escribe aquí los requerimientos específicos, reglas de negocio o aclaraciones...",
              pt: "Insira aqui os requisitos específicos, regras de negócio ou esclarecimentos...",
            })}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
          />
        </div>

        {item.entry.answer_options.length > 0 ? (
          <div className="mt-3">
            <p className="text-[11px] font-bold text-[var(--uxa-color-ink-muted)] uppercase tracking-wider mb-1.5">
              {byLanguage(language, {
                en: "Suggested shortcuts:",
                es: "Sugerencias rápidas:",
                pt: "Sugestões rápidas:",
              })}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {item.entry.answer_options.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setInputVal(opt.label + (opt.description ? ` - ${opt.description}` : ""))}
                  className="rounded-md border border-[var(--uxa-color-border)] bg-[var(--uxa-color-surface)] px-2.5 py-1 text-[11px] font-medium text-[var(--uxa-color-ink-soft)] hover:border-[var(--uxa-color-brand)] hover:text-[var(--uxa-color-brand)]"
                >
                  {opt.recommended ? "★ " : ""}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            className="uxa-button uxa-button--secondary"
            disabled={resolving}
            onClick={onClose}
            type="button"
          >
            {byLanguage(language, { en: "Cancel", es: "Cancelar", pt: "Cancelar" })}
          </button>
          <button
            className="uxa-button uxa-button--primary"
            disabled={resolving || !inputVal.trim()}
            onClick={() => void onSubmit(inputVal)}
            type="button"
          >
            {resolving
              ? byLanguage(language, { en: "Analyzing impact...", es: "Analizando impacto...", pt: "Analisando impacto..." })
              : byLanguage(language, {
                  en: "Save and Analyze Impact",
                  es: "Guardar y Analizar Impacto",
                  pt: "Salvar e Analisar Impacto",
                })}
          </button>
        </div>
      </div>
    </div>
  );
}

function PremiumEnrichmentPanel({
  activeRoute,
  unlocked,
}: {
  activeRoute: ProductExperienceRouteSnapshot | null;
  unlocked: boolean;
}) {
  const { language } = useLanguage();
  const sessionId = activeRoute?.route.sessionId ?? "";
  const [workspace, setWorkspace] = useState<PremiumEnrichmentWorkspace | null>(null);
  const [result, setResult] = useState<PremiumSelectiveReprocessResult | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error" | "resolving">("idle");
  const [error, setError] = useState("");
  const [resolvingId, setResolvingId] = useState("");
  const [modalItem, setModalItem] = useState<PremiumEnrichmentItem | null>(null);
  const [activeTab, setActiveTab] = useState<"prioritized" | "deferred" | "resolved">("prioritized");
  const resultHasExecutedReprocess = Boolean(
    result && (((result.generation_job_ids ?? []).length > 0) || ((result.queue_completed ?? 0) > 0)),
  );
  const resultNeedsExplicitReprocess = Boolean(result && result.material_impact && !resultHasExecutedReprocess);
  const resultDecisionTone =
    result?.reprocess_decision === "structural_reprocess"
      ? ("warning" as const)
      : result?.reprocess_decision === "localized_reprocess"
      ? ("success" as const)
      : ("neutral" as const);
  const resultDecisionLabel = result
    ? result.reprocess_decision === "structural_reprocess"
      ? byLanguage(language, {
          en: "Structural impact",
          es: "Impacto estructural",
          pt: "Impacto estrutural",
        })
      : result.reprocess_decision === "localized_reprocess"
      ? byLanguage(language, {
          en: "Localized impact",
          es: "Impacto localizado",
          pt: "Impacto localizado",
        })
      : byLanguage(language, {
          en: "No reprocessing",
          es: "Sin reproceso",
          pt: "Sem reprocessamento",
        })
    : "";
  const resultBannerTitle = result
    ? resultHasExecutedReprocess
      ? byLanguage(language, {
          en: "Selective reprocessing completed",
          es: "Reprocesamiento selectivo completado",
          pt: "Reprocessamento seletivo concluido",
        })
      : result.material_impact
      ? byLanguage(language, {
          en: "Impact analysis completed",
          es: "Análisis de impacto completado",
          pt: "Analise de impacto concluida",
        })
      : byLanguage(language, {
          en: "Decision documented without reprocessing",
          es: "Decisión documentada sin reproceso",
          pt: "Decisao documentada sem reprocessamento",
        })
    : "";
  const resultActionLabel = result
    ? result.reprocess_decision === "structural_reprocess"
      ? byLanguage(language, {
          en: "Reprocess dependent stages",
          es: "Reprocesar etapas dependientes",
          pt: "Reprocessar etapas dependentes",
        })
      : byLanguage(language, {
          en: "Update affected deliverables",
          es: "Actualizar entregables afectados",
          pt: "Atualizar entregaveis afetados",
        })
    : "";
  const resultItem = result ? workspace?.items.find((item) => item.entry.id === result.resolved_entry.id) ?? null : null;

  useEffect(() => {
    if (!sessionId) {
      return;
    }
    let alive = true;
    deferStateUpdate(() => {
      if (alive) {
        setStatus("loading");
        setError("");
      }
    });
    premiumEnrichmentApi
      .getWorkspace(sessionId, 6)
      .then((data) => {
        if (!alive) {
          return;
        }
        setWorkspace(data);
        setStatus("ready");
      })
      .catch(() => {
        if (!alive) {
          return;
        }
        setWorkspace(null);
        setError(
          byLanguage(language, {
            en: "Premium enrichment workspace could not be loaded.",
            es: "No se pudo cargar el workspace de enriquecimiento Premium.",
            pt: "Nao foi possivel carregar o workspace de enriquecimento Premium.",
          }),
        );
        setStatus("error");
      });
    return () => {
      alive = false;
    };
  }, [language, sessionId]);

  async function resolveItem(
    item: PremiumEnrichmentItem,
    selectedOptionKey = "",
    customAnswer = "",
    executionMode: "analyze_only" | "apply_reprocess" = "analyze_only",
  ) {
    if (!sessionId || !unlocked) {
      return;
    }
    const suggestedAnswer =
      customAnswer ||
      item.entry.assumed_answer ||
      (selectedOptionKey
        ? ""
        : item.entry.suggested_answer ||
          item.entry.answer_options.find((option) => option.recommended)?.label ||
          "");
    const maxDeliverables =
      executionMode === "apply_reprocess" ? Math.max(1, Math.min(item.ordered_regeneration_keys.length || 1, 12)) : 5;
    setStatus("resolving");
    setResolvingId(item.entry.id);
    setError("");
    try {
      const data = await premiumEnrichmentApi.resolveItem(sessionId, item.entry.id, {
        answer: suggestedAnswer,
        execution_mode: executionMode,
        selected_option_key: selectedOptionKey,
        regenerate: executionMode === "apply_reprocess",
        max_deliverables: maxDeliverables,
      });
      const refreshed = await premiumEnrichmentApi.getWorkspace(sessionId, 6);
      setResult(data);
      setWorkspace(refreshed);
      setStatus("ready");
      setModalItem(null);
    } catch {
      setError(
        byLanguage(language, {
          en:
            executionMode === "apply_reprocess"
              ? "The selective reprocessing could not be completed. Check backend availability and retry."
              : "The answer could not be registered or analyzed. Check entitlement, permissions, or backend availability.",
          es:
            executionMode === "apply_reprocess"
              ? "No se pudo completar el reprocesamiento selectivo. Revisa el backend y vuelve a intentarlo."
              : "No se pudo registrar o analizar la respuesta. Revisa entitlement, permisos o disponibilidad del backend.",
          pt:
            executionMode === "apply_reprocess"
              ? "Nao foi possivel concluir o reprocessamento seletivo. Revise o backend e tente novamente."
              : "Nao foi possivel registrar ou analisar a resposta. Revise entitlement, permissoes ou disponibilidade do backend.",
        }),
      );
      setStatus("error");
    } finally {
      setResolvingId("");
    }
  }

  async function applySuggestedReprocess() {
    if (!result || !resultItem) {
      return;
    }
    await resolveItem(
      resultItem,
      "",
      resultItem.entry.assumed_answer || result.resolved_entry.assumed_answer || resultItem.entry.suggested_answer || "",
      "apply_reprocess",
    );
  }

  async function deferItemToAcp(item: PremiumEnrichmentItem) {
    if (!sessionId || !unlocked) {
      return;
    }
    setStatus("resolving");
    setResolvingId(item.entry.id);
    setError("");
    try {
      await premiumEnrichmentApi.deferToAcp(sessionId, item.entry.id);
      const refreshed = await premiumEnrichmentApi.getWorkspace(sessionId, 6);
      setWorkspace(refreshed);
      setStatus("ready");
    } catch {
      setError(
        byLanguage(language, {
          en: "Could not defer item to ACP.",
          es: "No se pudo diferir el ítem al ACP.",
          pt: "Não foi possível adiar o item para o ACP.",
        }),
      );
      setStatus("error");
    } finally {
      setResolvingId("");
    }
  }

  async function dismissItem(item: PremiumEnrichmentItem) {
    if (!sessionId || !unlocked) {
      return;
    }
    setStatus("resolving");
    setResolvingId(item.entry.id);
    setError("");
    try {
      await premiumEnrichmentApi.dismissItem(sessionId, item.entry.id);
      const refreshed = await premiumEnrichmentApi.getWorkspace(sessionId, 6);
      setWorkspace(refreshed);
      setStatus("ready");
    } catch {
      setError(
        byLanguage(language, {
          en: "Could not dismiss item.",
          es: "No se pudo descartar el ítem.",
          pt: "Não foi possível descartar o item.",
        }),
      );
      setStatus("error");
    } finally {
      setResolvingId("");
    }
  }

  const displayedItems = (workspace?.items ?? []).filter((item) => {
    if (activeTab === "deferred") {
      return item.entry.status === "deferred" || item.entry.disposition === "defer";
    }
    if (activeTab === "resolved") {
      return item.entry.status === "resolved";
    }
    return (
      item.entry.status !== "deferred" &&
      item.entry.status !== "resolved" &&
      item.entry.status !== "dismissed" &&
      item.entry.disposition !== "defer"
    );
  });

  return (
    <UxaSurface className="p-[var(--uxa-panel-padding-lg)]">
      {modalItem ? (
        <EnrichmentInputModal
          item={modalItem}
          onClose={() => setModalItem(null)}
          onSubmit={(customAnswer) => resolveItem(modalItem, "", customAnswer)}
          resolving={status === "resolving" && resolvingId === modalItem.entry.id}
        />
      ) : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <UxaBadge tone={unlocked ? "success" : "warning"}>
            {byLanguage(language, {
              en: "Premium enrichment",
              es: "Enriquecimiento Premium",
              pt: "Enriquecimento Premium",
            })}
          </UxaBadge>
          <h2 className="mt-3 text-[20px] font-black">
            {byLanguage(language, {
              en: "Resolve only what improves the professional Blueprint",
              es: "Resuelve solo lo que mejora el Blueprint profesional",
              pt: "Resolva apenas o que melhora o Blueprint profissional",
            })}
          </h2>
          <p className="mt-2 max-w-3xl text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">
            {workspace?.value_summary ??
              byLanguage(language, {
                en: "Basic findings become prioritized opportunities for Premium. The system enriches selectively instead of asking everything again.",
                es: "Los hallazgos de Basico se convierten en oportunidades priorizadas para Premium. El sistema enriquece selectivamente sin preguntar todo otra vez.",
                pt: "Os achados do Basico viram oportunidades priorizadas para Premium. O sistema enriquece seletivamente sem perguntar tudo de novo.",
              })}
          </p>
        </div>
        <div className="grid min-w-[280px] grid-cols-3 gap-2">
          {[
            {
              key: "prioritized",
              count: workspace?.prioritized_count ?? 0,
              label: byLanguage(language, { en: "Prioritized", es: "Priorizadas", pt: "Priorizadas" }),
            },
            {
              key: "deferred",
              count: workspace?.deferred_count ?? 0,
              label: byLanguage(language, { en: "Deferred", es: "Diferidas", pt: "Diferidas" }),
            },
            {
              key: "resolved",
              count: workspace?.resolved_count ?? 0,
              label: byLanguage(language, { en: "Resolved", es: "Resueltas", pt: "Resolvidas" }),
            },
          ].map(({ key, count, label }) => {
            const isActive = activeTab === key;
            return (
              <button
                type="button"
                onClick={() => setActiveTab(key as "prioritized" | "deferred" | "resolved")}
                className={`cursor-pointer rounded-[var(--uxa-radius-lg)] p-3 text-center transition-all ${
                  isActive
                    ? "bg-[var(--uxa-color-brand)] text-white shadow-sm ring-2 ring-[var(--uxa-color-brand)]"
                    : "bg-[var(--uxa-color-muted-panel)] hover:bg-[var(--uxa-color-border)]"
                }`}
                key={key}
              >
                <p className={`text-[18px] font-black ${isActive ? "text-white" : ""}`}>{count}</p>
                <p
                  className={`mt-1 text-[10px] font-black uppercase tracking-[0.14em] ${
                    isActive ? "text-white/90" : "text-[var(--uxa-color-ink-muted)]"
                  }`}
                >
                  {label}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {status === "loading" ? (
        <p className="mt-4 text-[13px] text-[var(--uxa-color-ink-soft)]">
          {byLanguage(language, {
            en: "Loading prioritized enrichment backlog...",
            es: "Cargando backlog priorizado de enriquecimiento...",
            pt: "Carregando backlog priorizado de enriquecimento...",
          })}
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-state-warning)] bg-[var(--uxa-state-warning-bg)] px-4 py-3 text-[13px] text-[var(--uxa-color-ink-soft)]">
          {error}
        </p>
      ) : null}

      {/* Visual FIFO Reprocessing Queue Progress Banner */}
      {result ? (
        <div className="mt-4 rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-brand-muted)] bg-[var(--uxa-color-muted-panel)] p-4.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-2.5 w-2.5 rounded-full",
                  resultHasExecutedReprocess
                    ? "bg-[var(--uxa-color-brand)] animate-pulse"
                    : result.material_impact
                    ? "bg-[var(--uxa-color-brand)]"
                    : "bg-[var(--uxa-state-success)]",
                )}
              />
              <p className="text-[13px] font-bold text-[var(--uxa-color-ink-rich)]">
                {resultBannerTitle}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <UxaBadge tone={resultDecisionTone}>{resultDecisionLabel}</UxaBadge>
              <UxaBadge tone="info">
                {result.ordered_regeneration_keys.length}{" "}
                {byLanguage(language, {
                  en: "deliverables under review",
                  es: "entregables bajo revisión",
                  pt: "entregaveis em revisao",
                })}
              </UxaBadge>
              {resultHasExecutedReprocess ? (
                <>
                  <UxaBadge tone="success">
                    {result.regenerated_deliverable_keys.length}{" "}
                    {byLanguage(language, { en: "regenerated", es: "regenerados", pt: "regenerados" })}
                  </UxaBadge>
                  <UxaBadge tone="neutral">
                    {result.preserved_deliverable_keys.length}{" "}
                    {byLanguage(language, { en: "preserved", es: "conservados", pt: "preservados" })}
                  </UxaBadge>
                </>
              ) : null}
            </div>
          </div>

          {resultHasExecutedReprocess && result.queue_total ? (
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] font-medium text-[var(--uxa-color-ink-muted)] mb-1">
                <span>
                  {byLanguage(language, {
                    en: `Completed: ${result.queue_completed ?? 0} of ${result.queue_total} deliverables in FIFO order`,
                    es: `Completado: ${result.queue_completed ?? 0} de ${result.queue_total} entregables en orden FIFO`,
                    pt: `Concluído: ${result.queue_completed ?? 0} de ${result.queue_total} entregas em ordem FIFO`,
                  })}
                </span>
                <span>
                  {Math.round(((result.queue_completed ?? 0) / Math.max(1, result.queue_total)) * 100)}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--uxa-color-border)]">
                <div
                  className="h-full bg-[var(--uxa-color-brand)] transition-all duration-500 ease-out"
                  style={{
                    width: `${Math.round(((result.queue_completed ?? 0) / Math.max(1, result.queue_total)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          ) : null}

          <p className="mt-2.5 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
            {result.impact_summary || result.comparison_summary}
          </p>
          {result.impact_summary && result.impact_summary !== result.comparison_summary ? (
            <p className="mt-2 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">{result.comparison_summary}</p>
          ) : null}
          {resultNeedsExplicitReprocess ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-border)] bg-white/70 px-3.5 py-3">
              <p className="text-[12px] leading-5 text-[var(--uxa-color-ink-rich)]">{result.recommended_action}</p>
              {resultItem ? (
                <button
                  className="uxa-button uxa-button--primary justify-center gap-1.5"
                  disabled={!unlocked || status === "resolving"}
                  onClick={() => void applySuggestedReprocess()}
                  type="button"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {status === "resolving" && resolvingId === resultItem.entry.id
                    ? byLanguage(language, {
                        en: "Reprocessing...",
                        es: "Reprocesando...",
                        pt: "Reprocessando...",
                      })
                    : resultActionLabel}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 grid gap-3">
        {displayedItems.length ? (
          displayedItems.map((item) => {
            const isResolvingThis = resolvingId === item.entry.id;
            return (
              <div
                className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-[var(--uxa-color-surface)] p-4.5 transition-shadow hover:shadow-xs"
                key={item.entry.id}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <UxaBadge tone={item.entry.status === "resolved" ? "success" : item.entry.status === "deferred" ? "warning" : "info"}>
                        {formatToken(item.entry.status)}
                      </UxaBadge>
                      <UxaBadge tone="neutral">{formatToken(item.entry.source_stage)}</UxaBadge>
                      <UxaBadge tone="success">{Math.round(item.priority_score)}%</UxaBadge>
                    </div>
                    <h3 className="mt-2.5 text-[15px] font-black text-[var(--uxa-color-ink-rich)]">
                      {item.entry.title}
                    </h3>
                    <p className="mt-1 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
                      {item.priority_reason}
                    </p>
                    {item.entry.assumed_answer ? (
                      <div className="mt-2.5 rounded-[var(--uxa-radius-md)] bg-[var(--uxa-color-muted-panel)] p-3 text-[12px] leading-5 text-[var(--uxa-color-ink-rich)] border-l-2 border-[var(--uxa-color-brand)]">
                        <span className="font-semibold text-[var(--uxa-color-brand)]">
                          {byLanguage(language, { en: "Resolved answer: ", es: "Respuesta registrada: ", pt: "Resposta registrada: " })}
                        </span>
                        {item.entry.assumed_answer}
                      </div>
                    ) : item.entry.suggested_answer ? (
                      <div className="mt-2.5 rounded-[var(--uxa-radius-md)] bg-[var(--uxa-color-muted-panel)] p-3 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)] border-l-2 border-[var(--uxa-color-brand)]">
                        <span className="font-semibold text-[var(--uxa-color-brand)]">
                          {byLanguage(language, { en: "Suggestion: ", es: "Sugerencia: ", pt: "Sugestão: " })}
                        </span>
                        {item.entry.suggested_answer}
                      </div>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <UxaBadge tone="info">
                        {item.ordered_regeneration_keys.length}{" "}
                        {byLanguage(language, { en: "affected deliverables", es: "entregables afectados", pt: "entregas afetadas" })}
                      </UxaBadge>
                      <UxaBadge tone="neutral">
                        {item.unaffected_deliverable_count}{" "}
                        {byLanguage(language, { en: "preserved", es: "conservados", pt: "preservados" })}
                      </UxaBadge>
                    </div>
                  </div>

                  {/* 3 Opciones Clave Requeridas */}
                  <div className="flex min-w-[240px] flex-col gap-2 shrink-0">
                    {/* Opción 1: Enriquecer con input del cliente / Modificar respuesta */}
                    <button
                      className="uxa-button uxa-button--primary justify-center gap-1.5"
                      disabled={!unlocked || status === "resolving"}
                      onClick={() => setModalItem(item)}
                      type="button"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      {item.entry.status === "resolved"
                        ? byLanguage(language, {
                            en: "Edit answer",
                            es: "Modificar respuesta",
                            pt: "Modificar resposta",
                          })
                        : item.entry.status === "deferred"
                        ? byLanguage(language, {
                            en: "Resolve now",
                            es: "Resolver ahora",
                            pt: "Resolver agora",
                          })
                        : byLanguage(language, {
                            en: "Answer and analyze",
                            es: "Responder y analizar",
                            pt: "Responder e analisar",
                          })}
                    </button>

                    {/* Opción 2: Diferir a ACP */}
                    {item.entry.status !== "deferred" && item.entry.status !== "resolved" ? (
                      <button
                        className="uxa-button uxa-button--secondary justify-center gap-1.5 text-[var(--uxa-color-brand)] border-[var(--uxa-color-brand-muted)] hover:bg-[var(--uxa-color-brand-muted)]/20"
                        disabled={!unlocked || status === "resolving"}
                        onClick={() => void deferItemToAcp(item)}
                        type="button"
                      >
                        <FastForward className="h-3.5 w-3.5" />
                        {isResolvingThis
                          ? byLanguage(language, { en: "Deferring...", es: "Diriendo...", pt: "Adiado..." })
                          : byLanguage(language, {
                              en: "Defer to ACP",
                              es: "Diferir a ACP",
                              pt: "Adiar para ACP",
                            })}
                      </button>
                    ) : null}

                    {/* Opción 3: Descartar */}
                    <button
                      className="uxa-button uxa-button--secondary justify-center gap-1.5 text-[var(--uxa-state-danger)] border-[var(--uxa-color-border)] hover:bg-[var(--uxa-state-danger-bg)] hover:border-[var(--uxa-state-danger)]"
                      disabled={!unlocked || status === "resolving"}
                      onClick={() => void dismissItem(item)}
                      type="button"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {isResolvingThis
                        ? byLanguage(language, { en: "Dismissing...", es: "Descartando...", pt: "Descartando..." })
                        : byLanguage(language, {
                            en: "Dismiss",
                            es: "Descartar",
                            pt: "Descartar",
                          })}
                    </button>

                    {/* Usar sugerencia directa (acelerador) */}
                    {item.entry.suggested_answer && item.entry.status !== "resolved" ? (
                      <button
                        className="mt-1 flex items-center justify-center gap-1 text-[11px] font-bold text-[var(--uxa-color-brand)] hover:underline"
                        disabled={!unlocked || status === "resolving"}
                        onClick={() => void resolveItem(item)}
                        type="button"
                      >
                        <Zap className="h-3 w-3" />
                        {byLanguage(language, {
                          en: "Use suggestion and analyze",
                          es: "Usar sugerencia y analizar",
                          pt: "Usar sugestao e analisar",
                        })}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-[var(--uxa-color-muted-panel)] p-8 text-center">
            <p className="text-[15px] font-bold text-[var(--uxa-color-ink-rich)]">
              {activeTab === "prioritized"
                ? byLanguage(language, {
                    en: "All clear! No prioritized items pending for the professional Blueprint.",
                    es: "¡Excelente! No hay pendientes prioritarios por resolver para el Blueprint profesional.",
                    pt: "Excelente! Não há itens prioritários pendentes para o Blueprint profissional.",
                  })
                : activeTab === "deferred"
                ? byLanguage(language, {
                    en: "No items deferred to ACP.",
                    es: "No hay ítems diferidos al ACP.",
                    pt: "Nenhum item adiado para o ACP.",
                  })
                : byLanguage(language, {
                    en: "No resolved items yet.",
                    es: "Aún no hay ítems resueltos.",
                    pt: "Ainda não há itens resolvidos.",
                  })}
            </p>
            <p className="mt-1.5 text-[12px] text-[var(--uxa-color-ink-soft)]">
              {activeTab === "prioritized"
                ? byLanguage(language, {
                    en: "All questions have been resolved or deferred to ACP.",
                    es: "Todas las preguntas han sido resueltas o diferidas al paquete de construcción (ACP).",
                    pt: "Todas as perguntas foram resolvidas ou adiadas para o pacote de construção (ACP).",
                  })
                : null}
            </p>
          </div>
        )}
      </div>
    </UxaSurface>
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

  const [purchasing, setPurchasing] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState<InlineNotice | null>(null);

  return (
    <div className="space-y-5">
      <CommercialBlueprintResult
        activeRoute={activeRoute}
        artifactCards={viewModel.artifactCards}
        projectTitle={viewModel.title}
        sessionId={sessionId}
        tierScope="blueprint_pro"
        unlocked={unlocked}
      />
      <InlineNoticeBanner notice={downloadNotice} />
      <UxaStickyActionBar
        label={byLanguage(language, {
          en: "Blueprint Pro actions",
          es: "Acciones de Blueprint Profesional",
          pt: "Acoes de Blueprint Profissional",
        })}
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
          <>
            {canOpenAcp ? (
              <a
                className="uxa-button uxa-button--secondary"
                href={`/projects/${sessionId}/acp`}
              >
                <span>
                  {byLanguage(language, {
                    en: "Continue to ACP",
                    es: "Continuar con ACP",
                    pt: "Continuar com ACP",
                  })}
                </span>
              </a>
            ) : null}
            <a
              className="uxa-button uxa-button--secondary"
              href={`/projects/${sessionId}/artifacts`}
            >
              <span>
                {byLanguage(language, {
                  en: "View artifacts",
                  es: "Ver artefactos",
                  pt: "Ver artefatos",
                })}
              </span>
            </a>
            <button
              className={cn(
                "uxa-button uxa-button--primary",
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
              try {
                if (
                  viewModel.access?.checkout_state === "available" ||
                  viewModel.access?.checkout_state === "pending"
                ) {
                  await executeProductCheckout({
                    sessionId,
                    productKey: "blueprint_pro",
                  });
                } else {
                  await executeAccessRequest({
                    sessionId,
                    productKey: "blueprint_pro",
                  });
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
                : viewModel.access?.checkout_state === "available" ||
                  viewModel.access?.checkout_state === "pending"
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
      </UxaStickyActionBar>
    </div>
  );
}

function AcpDirectReadinessPanel({
  activeRoute,
  canBuild,
  onPreparationStateChange,
}: {
  activeRoute: ProductExperienceRouteSnapshot | null;
  canBuild: boolean;
  onPreparationStateChange?: (state: AcpPreparationState | null) => void;
}) {
  const { language } = useLanguage();
  const sessionId = activeRoute?.route.sessionId ?? "";
  const [resolution, setResolution] = useState<AcpDirectRouteResolution | null>(null);
  const [workspace, setWorkspace] = useState<ACPWorkspaceResponse | null>(null);
  const [questions, setQuestions] = useState<ConstructionQuestionViewEntry[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

  useEffect(() => {
    if (!sessionId) {
      deferStateUpdate(() => {
        setResolution(null);
        setWorkspace(null);
        setQuestions([]);
        setStatus("idle");
        onPreparationStateChange?.(null);
      });
      return;
    }

    let cancelled = false;
    deferStateUpdate(() => {
      if (!cancelled) {
        setStatus("loading");
      }
    });
    Promise.all([
      acpDirectApi.getResolution(sessionId),
      canBuild ? sessionsApi.getAcpWorkspace(sessionId) : Promise.resolve(null),
      canBuild ? sessionsApi.getAcpQuestions(sessionId) : Promise.resolve([]),
    ])
      .then(([resolutionPayload, workspacePayload, questionPayload]) => {
        if (cancelled) {
          return;
        }
        const canStartPackage =
          resolutionPayload.can_start_package || Boolean(workspacePayload?.readiness.can_start_build);
        const nextHref = canStartPackage
          ? getAcpResultTabHref(sessionId, "package")
          : getAcpResultTabHref(sessionId, "validate");
        setResolution(resolutionPayload);
        setWorkspace(workspacePayload);
        setQuestions(questionPayload);
        setStatus("ready");
        onPreparationStateChange?.({
          canExportZip: Boolean(workspacePayload?.validation.can_export_zip),
          canStartPackage,
          nextHref,
        });
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setResolution(null);
        setWorkspace(null);
        setQuestions([]);
        setStatus("error");
        onPreparationStateChange?.(null);
      });

    return () => {
      cancelled = true;
    };
  }, [canBuild, onPreparationStateChange, sessionId]);

  const leanCompletedCount = resolution?.completed_stage_keys.length ?? 0;
  const leanRequiredCount = resolution?.required_stage_keys.length ?? 7;
  const workspacePhaseCount = workspace?.phase_definitions.length ?? 6;
  const completedPhaseCount =
    workspace?.phases.filter((phase) => phase.status === "completed" || phase.status === "completed_with_observations").length ?? 0;
  const openQuestions = useMemo(() => getOpenQuestions(questions), [questions]);
  const blockingQuestions = useMemo(() => getBlockingQuestions(questions), [questions]);
  const activeBlockerCount = (workspace?.readiness.blocking_gaps ?? 0) + blockingQuestions.length;
  const preparationPending = status === "idle" || status === "loading";
  const questionGroups = useMemo(() => {
    const grouped = new Map<string, { artifacts: Set<string>; blocking: number; count: number; domain: string }>();
    for (const question of openQuestions) {
      const key = question.domain || "general";
      const current = grouped.get(key) ?? {
        artifacts: new Set<string>(),
        blocking: 0,
        count: 0,
        domain: key,
      };
      current.count += 1;
      if (question.blocking) {
        current.blocking += 1;
      }
      for (const artifact of question.impacted_artifacts ?? []) {
        if (artifact) current.artifacts.add(artifact);
      }
      grouped.set(key, current);
    }
    return Array.from(grouped.values())
      .sort((left, right) => {
        if (right.blocking !== left.blocking) return right.blocking - left.blocking;
        if (right.count !== left.count) return right.count - left.count;
        return left.domain.localeCompare(right.domain);
      })
      .slice(0, 4);
  }, [openQuestions]);
  const nextHref =
    resolution?.can_start_package || workspace?.readiness.can_start_build
      ? getAcpResultTabHref(sessionId, "package")
      : getAcpResultTabHref(sessionId, "validate");
  const missingLeanCount = resolution?.missing_stage_keys.length ?? 0;

  return (
    <UxaSurface className="p-[var(--uxa-panel-padding-lg)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <UxaBadge tone={resolution?.can_start_package || workspace?.readiness.can_start_build ? "success" : canBuild ? "warning" : "info"}>
            {byLanguage(language, {
              en: "ACP preparation",
              es: "Preparacion ACP",
              pt: "Preparacao ACP",
            })}
          </UxaBadge>
          <h2 className="mt-3 text-[20px] font-black">
            {byLanguage(language, {
              en: "Concentrated ACP workspace without restarting the Blueprint",
              es: "Espacio concentrado del ACP sin reiniciar el Blueprint",
              pt: "Espaco concentrado do ACP sem reiniciar o Blueprint",
            })}
          </h2>
          <p className="mt-2 max-w-[780px] text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">
            {byLanguage(language, {
              en: "ACP keeps you inside a dedicated preparation space: answers are accumulated, prerequisites stay visible, and the package only recalculates when Validate, Package, or a required ACP phase is resumed.",
              es: "ACP te mantiene dentro de un espacio dedicado de preparación: las respuestas se acumulan, los prerequisitos siguen visibles y el paquete solo se recalcula cuando reanudas Validar, Package o una fase requerida del ACP.",
              pt: "O ACP mantem voce em um espaco dedicado de preparacao: as respostas se acumulam, os prerequisitos permanecem visiveis e o pacote so e recalculado quando voce retoma Validar, Package ou uma fase obrigatoria do ACP.",
            })}
          </p>
        </div>
        <a
          className={cn("uxa-button", resolution?.can_start_package || workspace?.readiness.can_start_build ? "uxa-button--primary" : "uxa-button--secondary")}
          href={canBuild ? nextHref : `/projects/${sessionId}/acp`}
        >
          <span>
            {canBuild
              ? resolution?.can_start_package || workspace?.readiness.can_start_build
                ? byLanguage(language, { en: "Go to Package", es: "Ir a Package", pt: "Ir para Package" })
                : byLanguage(language, { en: "Open ACP preparation", es: "Abrir preparación ACP", pt: "Abrir preparacao ACP" })
              : byLanguage(language, { en: "Request ACP", es: "Solicitar ACP", pt: "Solicitar ACP" })}
          </span>
          <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
        </a>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        {[
          {
            label: byLanguage(language, { en: "Blueprint foundations", es: "Bases del Blueprint", pt: "Bases do Blueprint" }),
            value: preparationPending ? "..." : `${leanCompletedCount}/${leanRequiredCount}`,
            detail: byLanguage(language, { en: "Reused or justified by ACP", es: "Reutilizadas o justificadas por ACP", pt: "Reutilizadas ou justificadas pelo ACP" }),
          },
          {
            label: byLanguage(language, { en: "ACP phases", es: "Fases ACP", pt: "Fases ACP" }),
            value: preparationPending ? "..." : `${completedPhaseCount}/${workspacePhaseCount}`,
            detail: byLanguage(language, { en: "Closed or observed", es: "Cerradas u observadas", pt: "Fechadas ou observadas" }),
          },
          {
            label: byLanguage(language, { en: "Open questions", es: "Preguntas abiertas", pt: "Perguntas abertas" }),
            value: preparationPending ? "..." : String(openQuestions.length),
            detail: byLanguage(language, { en: "Persisted and accumulative", es: "Persistidas y acumulativas", pt: "Persistidas e acumulativas" }),
          },
          {
            label: byLanguage(language, { en: "Active blockers", es: "Bloqueos activos", pt: "Bloqueios ativos" }),
            value: preparationPending ? "..." : String(activeBlockerCount),
            detail: byLanguage(language, { en: "Gaps and blocking questions", es: "Gaps y preguntas bloqueantes", pt: "Gaps e perguntas bloqueantes" }),
          },
        ].map((metric) => (
          <div
            className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-white/75 p-4"
            key={metric.label}
          >
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--uxa-color-ink-muted)]">
              {metric.label}
            </p>
            <p className="mt-2 text-[24px] font-black text-[var(--uxa-color-ink)]">{metric.value}</p>
            <p className="text-[12px] text-[var(--uxa-color-ink-soft)]">{metric.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-white/75 p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--uxa-color-ink-muted)]">
            {byLanguage(language, {
              en: "What ACP is reusing",
              es: "Lo que ACP está reutilizando",
              pt: "O que o ACP está reutilizando",
            })}
          </p>
          <p className="mt-2 text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">
            {preparationPending
              ? byLanguage(language, {
                  en: "We are loading the approved Blueprint foundations, ACP questions, and package dependencies for this workspace.",
                  es: "Estamos cargando las bases aprobadas del Blueprint, las preguntas ACP y las dependencias del Package para este workspace.",
                  pt: "Estamos carregando as bases aprovadas do Blueprint, as perguntas do ACP e as dependencias do Package para este workspace.",
                })
              : missingLeanCount > 0
              ? byLanguage(language, {
                  en: `ACP still needs ${missingLeanCount} canonical LEAN prerequisite(s). This does not restart the project: it explains which approved foundations are still missing before Package can be released.`,
                  es: `ACP todavía necesita ${missingLeanCount} prerequisito(s) canónicos del LEAN. Esto no reinicia el proyecto: explica qué bases aprobadas siguen faltando antes de liberar el Package.`,
                  pt: `O ACP ainda precisa de ${missingLeanCount} prerequisito(s) canonicos do LEAN. Isso nao reinicia o projeto: apenas explica quais bases aprovadas ainda faltam antes de liberar o Package.`,
                })
              : workspace?.next_action || resolution?.processing_guidance || ""}
          </p>
        </div>
        <div className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-white/75 p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--uxa-color-ink-muted)]">
            {byLanguage(language, {
              en: "Package readiness",
              es: "Readiness de Package",
              pt: "Readiness do Package",
            })}
          </p>
          <p className="mt-2 text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">
            {preparationPending
              ? byLanguage(language, {
                  en: "We are validating whether the current ACP can export and what still needs to be closed before Package.",
                  es: "Estamos validando si el ACP actual puede exportarse y qué falta cerrar antes de liberar el Package.",
                  pt: "Estamos validando se o ACP atual pode ser exportado e o que falta fechar antes de liberar o Package.",
                })
              : workspace?.validation.can_export_zip
              ? byLanguage(language, {
                  en: "The package is already exportable from ACP.",
                  es: "El paquete ya es exportable desde ACP.",
                  pt: "O pacote ja pode ser exportado a partir do ACP.",
                })
              : byLanguage(language, {
                  en: "The package is still protected by backend readiness. Resolve the blocking gaps or open questions shown below before trying to export again.",
                  es: "El paquete sigue protegido por el readiness del backend. Resuelve los gaps bloqueantes o las preguntas abiertas que ves abajo antes de volver a exportar.",
                  pt: "O pacote ainda esta protegido pelo readiness do backend. Resolva os gaps bloqueantes ou as perguntas abertas abaixo antes de tentar exportar novamente.",
                })}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-2 lg:grid-cols-7">
        {(resolution?.stages ?? []).map((stage) => {
          const tone = stage.completed || stage.justified ? "success" : stage.blocking_question_count ? "danger" : "warning";
          const stageTitle = byLanguage(language, {
            en: `Foundation · ${stage.label}`,
            es: `Base · ${stage.label}`,
            pt: `Base · ${stage.label}`,
          });
          return (
            <div
              className={cn(
                "rounded-[var(--uxa-radius-md)] border p-3",
                tone === "success" && "border-[var(--uxa-state-success)] bg-[var(--uxa-state-success-bg)]",
                tone === "danger" && "border-[var(--uxa-state-danger)] bg-[var(--uxa-state-danger-bg)]",
                tone === "warning" && "border-[var(--uxa-state-warning)] bg-[var(--uxa-state-warning-bg)]",
              )}
              key={stage.stage_key}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[12px] font-black">{stageTitle}</p>
                {stage.completed || stage.justified ? (
                  <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-[var(--uxa-state-success)]" />
                ) : (
                  <Clock3 aria-hidden="true" className="h-4 w-4 text-[var(--uxa-state-warning)]" />
                )}
              </div>
              <p className="mt-2 text-[11px] leading-4 text-[var(--uxa-color-ink-soft)]">
                {stage.completed
                  ? byLanguage(language, { en: "Reused by ACP", es: "Reutilizada por ACP", pt: "Reutilizada pelo ACP" })
                  : stage.justified
                    ? byLanguage(language, { en: "Justified", es: "Justificada", pt: "Justificada" })
                    : stage.next_action}
              </p>
              {stage.technical_question_count > 0 ? (
                <p className="mt-2 text-[11px] font-bold text-[var(--uxa-color-ink)]">
                  {stage.technical_question_count}{" "}
                  {byLanguage(language, { en: "question(s)", es: "pregunta(s)", pt: "pergunta(s)" })}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      {workspace?.phases?.length ? (
        <div className="mt-5">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--uxa-color-ink-muted)]">
            {byLanguage(language, {
              en: "ACP phases",
              es: "Fases del ACP",
              pt: "Fases do ACP",
            })}
          </p>
          <div className="mt-3 grid gap-2 lg:grid-cols-3">
            {workspace.phases.map((phase) => {
              const tone = phaseTone(phase.status);
              return (
                <div
                  className={cn(
                    "rounded-[var(--uxa-radius-md)] border p-3",
                    tone === "success" && "border-[var(--uxa-state-success)] bg-[var(--uxa-state-success-bg)]",
                    tone === "danger" && "border-[var(--uxa-state-danger)] bg-[var(--uxa-state-danger-bg)]",
                    tone === "warning" && "border-[var(--uxa-state-warning)] bg-[var(--uxa-state-warning-bg)]",
                    tone === "info" && "border-[var(--uxa-color-brand)] bg-white",
                  )}
                  key={phase.phase_key}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12px] font-black">{phase.phase_label}</p>
                    {workspace.run.current_phase_key === phase.phase_key ? (
                      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--uxa-color-brand)]">
                        {byLanguage(language, { en: "Current", es: "Actual", pt: "Atual" })}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-[11px] leading-4 text-[var(--uxa-color-ink-soft)]">
                    {formatAcpPhaseStatus(language, phase.status)}
                  </p>
                  {phase.attempt_count > 0 ? (
                    <p className="mt-2 text-[11px] font-bold text-[var(--uxa-color-ink)]">
                      {byLanguage(language, {
                        en: `${phase.attempt_count} attempt(s)`,
                        es: `${phase.attempt_count} intento(s)`,
                        pt: `${phase.attempt_count} tentativa(s)`,
                      })}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-5">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--uxa-color-ink-muted)]">
          {byLanguage(language, {
            en: "Open question groups",
            es: "Grupos de preguntas abiertas",
            pt: "Grupos de perguntas abertas",
          })}
        </p>
        {preparationPending ? (
          <p className="mt-3 rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-border)] bg-white/75 px-3 py-2 text-[12px] text-[var(--uxa-color-ink-soft)]">
            {byLanguage(language, {
              en: "Loading ACP questions, gaps, and impacted artifacts...",
              es: "Cargando preguntas ACP, gaps y artefactos impactados...",
              pt: "Carregando perguntas do ACP, gaps e artefatos impactados...",
            })}
          </p>
        ) : questionGroups.length ? (
          <div className="mt-3 grid gap-2 lg:grid-cols-2">
            {questionGroups.map((group) => (
              <div
                className="rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-border)] bg-white/75 p-3"
                key={group.domain}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12px] font-black">{formatDomainLabel(group.domain)}</p>
                  <span className="text-[11px] font-bold text-[var(--uxa-color-ink-soft)]">
                    {group.count} {byLanguage(language, { en: "pending", es: "pendiente(s)", pt: "pendente(s)" })}
                  </span>
                </div>
                <p className="mt-2 text-[11px] leading-5 text-[var(--uxa-color-ink-soft)]">
                  {byLanguage(language, {
                    en: `${group.blocking} blocking • ${group.artifacts.size} impacted artifact(s)`,
                    es: `${group.blocking} bloqueante(s) • ${group.artifacts.size} artefacto(s) impactado(s)`,
                    pt: `${group.blocking} bloqueante(s) • ${group.artifacts.size} artefato(s) impactado(s)`,
                  })}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 rounded-[var(--uxa-radius-md)] bg-[var(--uxa-state-success-bg)] px-3 py-2 text-[12px] text-[var(--uxa-color-ink-soft)]">
            {byLanguage(language, {
              en: "There are no open ACP questions in the current workspace snapshot.",
              es: "No hay preguntas ACP abiertas en el snapshot actual del workspace.",
              pt: "Nao ha perguntas ACP abertas no snapshot atual do workspace.",
            })}
          </p>
        )}
      </div>

      {status === "loading" ? (
        <p className="mt-4 text-[12px] text-[var(--uxa-color-ink-soft)]">
          {byLanguage(language, { en: "Loading ACP preparation workspace...", es: "Cargando el workspace de preparación ACP...", pt: "Carregando o workspace de preparacao do ACP..." })}
        </p>
      ) : null}
      {status === "error" ? (
        <p className="mt-4 rounded-[var(--uxa-radius-md)] border border-[var(--uxa-state-warning)] bg-[var(--uxa-state-warning-bg)] px-3 py-2 text-[12px] text-[var(--uxa-color-ink-soft)]">
          {byLanguage(language, {
            en: "The ACP preparation workspace could not be loaded. Package export remains protected by backend readiness gates.",
            es: "No se pudo cargar el workspace de preparación ACP. La exportación del Package sigue protegida por los gates de readiness del backend.",
            pt: "Nao foi possivel carregar o workspace de preparacao do ACP. A exportacao do Package continua protegida pelos gates de readiness do backend.",
          })}
        </p>
      ) : null}
    </UxaSurface>
  );
}

function AcpProductPage({
  activeRoute,
}: {
  activeRoute: ProductExperienceRouteSnapshot | null;
}) {
  const { language } = useLanguage();
  const sessionId = activeRoute?.route.sessionId ?? "";
  const viewModel = buildProductSaasViewModel({ activeRoute, language, section: "acp" });
  const canBuild =
    hasTier(viewModel.accessTier, "acp") ||
    Boolean(viewModel.access?.can_build_acp);
  const [preparationState, setPreparationState] = useState<AcpPreparationState | null>(null);

  const [purchasing, setPurchasing] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState<InlineNotice | null>(null);
  const canExportZip = canBuild && Boolean(preparationState?.canExportZip);
  const preparationHref = preparationState?.nextHref ?? getAcpResultTabHref(sessionId, "validate");
  const preparationLabel = preparationState?.canStartPackage
    ? byLanguage(language, {
        en: "Go to Package",
        es: "Ir a Package",
        pt: "Ir para Package",
      })
    : byLanguage(language, {
        en: "Open ACP preparation",
        es: "Abrir preparación ACP",
        pt: "Abrir preparacao ACP",
      });

  return (
    <div className="space-y-5">
      {false ? (
      <SectionHeader
        badge={byLanguage(language, {
          en: "Product 2 · ACP",
          es: "Producto 2 · ACP",
          pt: "Produto 2 · ACP",
        })}
        description={byLanguage(language, {
          en: "The Agent Construction Package translates the Blueprint into a portable implementation package. It does not replace human environment decisions: it turns them into structured, manageable questions.",
          es: "El Agent Construction Package traduce el Blueprint en un paquete portable de implementacion. No reemplaza decisiones humanas de entorno: las convierte en preguntas estructuradas y gestionables.",
          pt: "O Agent Construction Package traduz o Blueprint em um pacote portavel de implementacao. Ele nao substitui decisoes humanas de ambiente: converte-as em perguntas estruturadas e gerenciaveis.",
        })}
        title={
          canBuild
            ? byLanguage(language, {
                en: "ACP enabled for construction",
                es: "ACP habilitado para construir",
                pt: "ACP habilitado para construir",
              })
            : byLanguage(language, {
                en: "Get ACP to move from design to construction",
                es: "Adquiere ACP para pasar de diseno a construccion",
                pt: "Adquira ACP para passar do design para a construcao",
              })
        }
      />
      ) : null}
      <MetricStrip metrics={viewModel.package.metrics} />
      <AcpDirectReadinessPanel
        activeRoute={activeRoute}
        canBuild={canBuild}
        onPreparationStateChange={setPreparationState}
      />
      <CommercialBlueprintResult
        activeRoute={activeRoute}
        artifactCards={viewModel.artifactCards}
        projectTitle={viewModel.title}
        sessionId={sessionId}
        tierScope="acp"
      />
      <InlineNoticeBanner notice={downloadNotice} />
      <div className="grid gap-5 xl:grid-cols-[1fr_0.85fr]">
        <UxaSurface
          className={cn(
            "p-[var(--uxa-panel-padding-lg)]",
            !canBuild &&
              "border-[var(--uxa-state-warning)] bg-[var(--uxa-state-warning-bg)]/30",
          )}
        >
          <UxaBadge tone={canBuild ? "success" : "warning"}>
            {canBuild
              ? byLanguage(language, {
                  en: "Active entitlement",
                  es: "Entitlement activo",
                  pt: "Entitlement activo",
                })
              : byLanguage(language, {
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
      <UxaStickyActionBar
        label={byLanguage(language, {
          en: "ACP actions",
          es: "Acciones de ACP",
          pt: "Acoes de ACP",
        })}
      >
        <a
          className="uxa-button uxa-button--secondary"
          href={getAcpResultTabHref(sessionId, "validate")}
        >
          <span>
            {byLanguage(language, {
              en: "Validate Blueprint",
              es: "Validar Blueprint",
              pt: "Validar Blueprint",
            })}
          </span>
        </a>
        {canBuild ? (
          canExportZip ? (
            <>
              <button
                className={cn(
                  "uxa-button uxa-button--primary inline-flex items-center gap-1.5",
                  downloading && "opacity-60 cursor-not-allowed",
                )}
                disabled={downloading}
                onClick={async () => {
                  if (downloading) return;
                  setDownloadNotice(null);
                  setDownloading(true);
                  try {
                    const job = await executeAcpZipDownload({ sessionId });
                    setDownloadNotice(
                      buildExportJobNotice(language, job, {
                        en: "ACP ZIP",
                        es: "ACP ZIP",
                        pt: "ACP ZIP",
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
                        en: "Download ACP ZIP",
                        es: "Descargar ACP ZIP",
                        pt: "Baixar ACP ZIP",
                      })}
                </span>
              </button>
              <a
                className="uxa-button uxa-button--secondary"
                href={getAcpResultTabHref(sessionId, "package")}
              >
                <span>
                  {byLanguage(language, {
                    en: "Generate package",
                    es: "Generar Package",
                    pt: "Gerar Package",
                  })}
                </span>
              </a>
            </>
          ) : (
            <a
              className="uxa-button uxa-button--primary"
              href={preparationHref}
            >
              <span>
                {preparationLabel}
              </span>
            </a>
          )
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
              try {
                if (
                  viewModel.access?.checkout_state === "available" ||
                  viewModel.access?.checkout_state === "pending"
                ) {
                  await executeProductCheckout({
                    sessionId,
                    productKey: "acp",
                  });
                } else {
                  await executeAccessRequest({
                    sessionId,
                    productKey: "acp",
                  });
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
                : viewModel.access?.checkout_state === "available" ||
                  viewModel.access?.checkout_state === "pending"
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
      </UxaStickyActionBar>
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
    return projectId ? <DiagramCenterPage projectId={projectId} /> : null;
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
