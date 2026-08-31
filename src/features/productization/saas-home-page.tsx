"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  FolderKanban,
  Minus,
  PackageCheck,
  Play,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { TopUtilities, WorkspaceShell, WorkspaceUserCard } from "@/components/lean/shell";
import { LanguageSelector } from "@/components/lean/language-selector";
import { AppButton, Badge, Panel, ProgressBar } from "@/components/lean/ui";
import { useAuth } from "@/core/auth/auth-context";
import { useCurrency } from "@/core/commerce/currency-context";
import { useLanguage } from "@/core/i18n/language-context";
import { byLanguage } from "@/features/product-experience/core/localized-copy";
import type { Currency } from "@/core/commerce/trm-service";
import { getProjectProductRoute } from "@/core/routing/routes";
import { getSessionProjectRoute, getSessionStageLabel, getSessionStatusLabel } from "@/features/sessions/session-routes";
import { useSessions } from "@/features/sessions/session-context";
import {
  getJourneyStateMachineTier,
  type ProductJourneyOverview,
} from "@/features/product-experience/saas/product-journey-overview";
import { getJourneyStateMachineDisplay } from "@/features/product-experience/saas/journey-state-machine-ui";
import { resolveDisplayCommercialTier } from "@/features/sessions/commercial-access";
import type { CommercialTier, ProductCatalogResponse } from "@/features/sessions/types";
import { cn } from "@/lib/utils";
import { ErrorState, LoadingState } from "@/shared/states/runtime-states";

type LoadStatus = "idle" | "loading" | "ready" | "error";

type PlanDefinition = {
  accent: string;
  benefits: string[];
  description: string;
  exclusion: string;
  eyebrow: string;
  icon: ReactNode;
  key: CommercialTier;
  name: string;
  price: string;
  priceDetail: string;
  recommended?: boolean;
};

const TIER_ORDER: CommercialTier[] = ["blueprint", "blueprint_pro", "acp"];

const PLAN_PRESENTATION: Record<CommercialTier, Omit<PlanDefinition, "benefits" | "exclusion" | "icon" | "price" | "priceDetail"> & {
  fallbackBenefits: string[];
  fallbackExclusion: string;
}> = {
  blueprint: {
    accent: "#3554c7",
    description: "Para explorar la solución, validar el enfoque y decidir si vale la pena avanzar.",
    eyebrow: "01 · EXPLORAR",
    fallbackBenefits: [
      "Diseño integral visible en la plataforma",
      "Narrativa de valor y arquitectura de muestra",
      "Acceso a diagramas de muestra",
    ],
    fallbackExclusion: "Sin descarga, copia ni exportación externa.",
    key: "blueprint",
    name: "Blueprint",
  },
  blueprint_pro: {
    accent: "#2446bf",
    description: "Para presentar, tomar una decisión de inversión o contratar la implementación.",
    eyebrow: "02 · DOCUMENTAR",
    fallbackBenefits: [
      "Todo lo incluido en Blueprint",
      "Documento profesional descargable",
      "Arquitectura, alcance, reglas y roadmap",
      "Estimación de esfuerzo, tiempo y costo",
    ],
    fallbackExclusion: "No incluye Test Suite ni paquete técnico ACP.",
    key: "blueprint_pro",
    name: "Blueprint Profesional",
    recommended: true,
  },
  acp: {
    accent: "#0f766e",
    description: "Para iniciar la construcción con Codex, Cursor, Claude Code o Copilot.",
    eyebrow: "03 · CONSTRUIR",
    fallbackBenefits: [
      "Todo lo incluido en Blueprint Profesional",
      "Prompts, contratos, herramientas y memoria",
      "Test Suite, GAPs y preguntas de implementación",
      "Paquete ZIP portable para herramientas agenticas",
    ],
    fallbackExclusion: "No ejecuta el despliegue ni instala dependencias.",
    key: "acp",
    name: "ACP Premium",
  },
};

function runAfterEffect(task: () => void) {
  const timeoutId = window.setTimeout(task, 0);
  return () => window.clearTimeout(timeoutId);
}

function getInitials(fullName?: string | null) {
  return (
    fullName
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "LB"
  );
}

function tierRank(tier: CommercialTier) {
  return TIER_ORDER.indexOf(tier);
}

function formatPrice(
  product: ProductCatalogResponse | undefined,
  currency: Currency = "COP",
  trmRate: number = 3171.93,
  language: "en" | "es" | "pt" = "es",
) {
  const copy = (en: string, es: string, pt: string) => byLanguage(language, { en, es, pt });
  const price = product?.price;
  if (!price) {
    return { price: copy("To be confirmed", "Por confirmar", "Por confirmar"), detail: copy("Check availability", "Consulta disponibilidad", "Consultar disponibilidade") };
  }
  if (price.billing_period === "free" || price.unit_amount_cents === 0) {
    return { price: "$0", detail: copy("Free per project", "Gratis por proyecto", "Gratis por projeto") };
  }
  const usdCents = (price as { unit_amount_usd_cents?: number }).unit_amount_usd_cents || price.unit_amount_cents;
  const usdAmount = usdCents > 1000 ? usdCents / 100 : (product?.tier === "acp" ? 149 : 49);

  if (currency === "USD") {
    const formatted = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(usdAmount);
    return {
      price: formatted,
      detail: copy("USD · One-time purchase", "USD · Pago unico", "USD · Pagamento unico"),
    };
  } else {
    const copValue = Math.round(usdAmount * trmRate);
    const formatted = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(copValue);
    return {
      price: formatted,
      detail: copy("COP · One-time purchase", "COP · Pago unico", "COP · Pagamento unico"),
    };
  }
}

function planIcon(tier: CommercialTier) {
  if (tier === "blueprint_pro") {
    return <FileCheck2 aria-hidden="true" className="h-4 w-4" />;
  }
  if (tier === "acp") {
    return <PackageCheck aria-hidden="true" className="h-4 w-4" />;
  }
  return <Sparkles aria-hidden="true" className="h-4 w-4" />;
}

function buildPlanDefinitions(
  products: ProductCatalogResponse[],
  currency: Currency,
  trmRate: number,
  activeTier: CommercialTier | undefined,
  language: "en" | "es" | "pt",
): PlanDefinition[] {
  const copy = (en: string, es: string, pt: string) => byLanguage(language, { en, es, pt });

  return TIER_ORDER.map((tier) => {
    const presentation = PLAN_PRESENTATION[tier];
    const product = products.find((entry) => entry.tier === tier);
    let formattedPrice = formatPrice(product, currency, trmRate, language);

    if (activeTier === "blueprint_pro" && tier === "acp") {
      const blueprintProduct = products.find((entry) => entry.tier === "blueprint_pro");
      const bpUsdCents = (blueprintProduct?.price as { unit_amount_usd_cents?: number })?.unit_amount_usd_cents || blueprintProduct?.price?.unit_amount_cents || 4900;
      const bpUsd = bpUsdCents > 1000 ? bpUsdCents / 100 : 49;

      const acpUsdCents = (product?.price as { unit_amount_usd_cents?: number })?.unit_amount_usd_cents || product?.price?.unit_amount_cents || 14900;
      const acpUsd = acpUsdCents > 1000 ? acpUsdCents / 100 : 149;

      const netUsd = Math.max(0, acpUsd - bpUsd);
      if (currency === "USD") {
        const formattedNet = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(netUsd);
        const formattedDiscount = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(bpUsd);
        formattedPrice = {
          price: formattedNet,
          detail: copy(
            `USD · Upgrade from prior Blueprint (-${formattedDiscount}) on this project`,
            `USD · Upgrade por Blueprint previo (-${formattedDiscount}) en este proyecto`,
            `USD · Upgrade por Blueprint previo (-${formattedDiscount}) neste projeto`,
          ),
        };
      } else {
        const copNet = Math.round(netUsd * trmRate);
        const copDiscount = Math.round(bpUsd * trmRate);
        const formattedNet = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(copNet);
        const formattedDiscount = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(copDiscount);
        formattedPrice = {
          price: formattedNet,
          detail: copy(
            `COP · Upgrade from prior Blueprint (-${formattedDiscount}) on this project`,
            `COP · Upgrade por Blueprint previo (-${formattedDiscount}) en este proyecto`,
            `COP · Upgrade por Blueprint previo (-${formattedDiscount}) neste projeto`,
          ),
        };
      }
    }

    const benefits = product?.benefits?.length ? product.benefits : presentation.fallbackBenefits;
    const exclusions = product?.exclusions?.length ? product.exclusions.join(" ") : presentation.fallbackExclusion;

    return {
      accent: presentation.accent,
      benefits,
      description: presentation.description,
      exclusion: exclusions,
      eyebrow: presentation.eyebrow,
      icon: planIcon(tier),
      key: tier,
      name: presentation.name,
      price: formattedPrice.price,
      priceDetail: formattedPrice.detail,
      recommended: presentation.recommended,
    };
  });
}

function HomeSidebarFooter() {
  const { user } = useAuth();
  const { language } = useLanguage();

  return (
    <WorkspaceUserCard
      initials={getInitials(user?.full_name)}
      name={user?.full_name ?? "Lean Builder"}
      subtitle={user?.active_workspace_name ?? user?.email ?? byLanguage(language, {
        en: "Current workspace",
        es: "Workspace actual",
        pt: "Workspace atual",
      })}
    />
  );
}

function getActiveTierFromJourneyOverview(overview: ProductJourneyOverview | null): CommercialTier | null {
  if (!overview) {
    return null;
  }

  const currentTier = getJourneyStateMachineTier(overview.journey_state_machine ?? null);
  if (currentTier === "acp" || currentTier === "blueprint_pro") {
    return currentTier;
  }

  if (overview.products.some((product) => product.product_key === "acp" && product.is_purchased)) {
    return "acp";
  }

  if (overview.products.some((product) => product.product_key === "blueprint_pro" && product.is_purchased)) {
    return "blueprint_pro";
  }

  if (overview.products.some((product) => product.product_key === "blueprint_basic" && product.is_purchased)) {
    return "blueprint";
  }

  return null;
}

function FirstValueCard() {
  const { language } = useLanguage();
  const items = [
    byLanguage(language, {
      en: "Define problem, scope, and constraints",
      es: "Define problema, alcance y restricciones",
      pt: "Defina problema, escopo e restricoes",
    }),
    byLanguage(language, {
      en: "Propose architecture and behavior",
      es: "Propone arquitectura y comportamiento",
      pt: "Propoe arquitetura e comportamento",
    }),
    byLanguage(language, {
      en: "Estimate effort before building",
      es: "Estima esfuerzo antes de construir",
      pt: "Estime esforco antes de construir",
    }),
  ];

  return (
    <div className="rounded-[12px] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
          {byLanguage(language, { en: "Your first delivery", es: "Tu primera entrega", pt: "Sua primeira entrega" })}
        </p>
        <Badge tone="green">{byLanguage(language, { en: "Free", es: "Sin costo", pt: "Sem custo" })}</Badge>
      </div>
      <p className="mt-3 text-[18px] font-semibold text-[var(--text-primary)]">
        {byLanguage(language, {
          en: "A blueprint to decide with evidence",
          es: "Un Blueprint para decidir con evidencia",
          pt: "Um blueprint para decidir com evidencia",
        })}
      </p>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div className="flex items-start gap-2.5" key={item}>
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] bg-[var(--brand-soft)] text-[var(--brand-primary)]">
              <Check aria-hidden="true" className="h-3 w-3" />
            </span>
            <span className="text-[12px] leading-5 text-[var(--text-secondary)]">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActiveProjectCard({
  detail,
  nextStepLabel,
  planLabel,
  progress,
  stage,
  status,
  title,
}: {
  detail?: string;
  nextStepLabel?: string;
  planLabel: string;
  progress: number;
  stage: string;
  status: string;
  title: string;
}) {
  const { language } = useLanguage();

  return (
    <div className="rounded-[12px] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
            {byLanguage(language, { en: "Active project", es: "Proyecto activo", pt: "Projeto ativo" })}
          </p>
          <p className="mt-2 truncate text-[18px] font-semibold text-[var(--text-primary)]">{title}</p>
          <p className="mt-1 text-[12px] text-[var(--text-secondary)]">{stage} · {status}</p>
          {detail ? <p className="mt-2 text-[12px] leading-5 text-[var(--text-secondary)]">{detail}</p> : null}
        </div>
        <Badge tone="blue">{planLabel}</Badge>
      </div>
      <div className="mt-5 flex items-center justify-between text-[11px] font-semibold text-[var(--text-secondary)]">
        <span>{byLanguage(language, { en: "Project progress", es: "Progreso del proyecto", pt: "Progresso do projeto" })}</span>
        <span>{progress}%</span>
      </div>
      <ProgressBar className="mt-2 h-1.5" value={progress} />
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-4">
        <span className="text-[12px] text-[var(--text-secondary)]">
          {nextStepLabel ?? byLanguage(language, {
            en: "Next: continue the current stage",
            es: "Siguiente: continuar la etapa actual",
            pt: "Proximo: continuar a etapa atual",
          })}
        </span>
        <ArrowRight aria-hidden="true" className="h-4 w-4 text-[var(--brand-primary)]" />
      </div>
    </div>
  );
}

function PlanCard({
  actionLabel,
  active,
  onAction,
  plan,
}: {
  actionLabel: string;
  active: boolean;
  onAction(): void;
  plan: PlanDefinition;
}) {
  const { language } = useLanguage();

  return (
    <article
      className={cn(
        "relative flex min-h-[430px] flex-col rounded-[12px] border bg-white p-5 transition duration-200",
        active
          ? "border-[var(--brand-primary)] shadow-[0_16px_38px_rgba(36,70,191,0.13)]"
          : "border-[var(--border-default)] hover:-translate-y-1 hover:shadow-[var(--shadow-card)]",
      )}
    >
      <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: plan.accent }} />
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.16em]" style={{ color: plan.accent }}>
          {plan.icon}
          <span>{plan.eyebrow}</span>
        </div>
        {active ? (
          <Badge tone="green">{byLanguage(language, { en: "Your tier", es: "Tu nivel", pt: "Seu nivel" })}</Badge>
        ) : plan.recommended ? (
          <Badge tone="blue">{byLanguage(language, { en: "Recommended", es: "Recomendado", pt: "Recomendado" })}</Badge>
        ) : null}
      </div>

      <h3 className="mt-5 text-[22px] font-semibold tracking-[-0.035em] text-[var(--text-primary)]">{plan.name}</h3>
      <p className="mt-2 min-h-14 text-[13px] leading-6 text-[var(--text-secondary)]">{plan.description}</p>

      <div className="mt-5 flex items-end gap-2 border-y border-[var(--border-subtle)] py-4">
        <p className="text-[30px] font-semibold tracking-[-0.045em] text-[var(--text-primary)]">{plan.price}</p>
        <p className="pb-1 text-[11px] font-medium text-[var(--text-secondary)]">{plan.priceDetail}</p>
      </div>

      <div className="mt-5 flex-1 space-y-3">
        {plan.benefits.slice(0, 4).map((benefit) => (
          <div className="flex items-start gap-2.5" key={benefit}>
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] bg-[#e9f6ef] text-[#22734a]">
              <Check aria-hidden="true" className="h-3 w-3" />
            </span>
            <span className="text-[12px] leading-5 text-[var(--text-secondary)]">{benefit}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-start gap-2 border-t border-[var(--border-subtle)] pt-4">
        <Minus aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-secondary)]" />
        <p className="text-[11px] leading-5 text-[var(--text-secondary)]">{plan.exclusion}</p>
      </div>

      <AppButton className="mt-5 h-10 w-full rounded-[9px]" onClick={onAction} variant={active ? "primary" : "secondary"}>
        {actionLabel}
      </AppButton>
    </article>
  );
}

function ComparisonTable() {
  const { language } = useLanguage();
  const rows = [
    [byLanguage(language, { en: "Visible design in platform", es: "Diseno visible en plataforma", pt: "Design visivel na plataforma" }), byLanguage(language, { en: "Included", es: "Incluido", pt: "Incluido" }), byLanguage(language, { en: "Included", es: "Incluido", pt: "Incluido" }), byLanguage(language, { en: "Included", es: "Incluido", pt: "Incluido" })],
    [byLanguage(language, { en: "Downloadable blueprint", es: "Blueprint descargable", pt: "Blueprint para download" }), "—", byLanguage(language, { en: "Included", es: "Incluido", pt: "Incluido" }), byLanguage(language, { en: "Included", es: "Incluido", pt: "Incluido" })],
    [byLanguage(language, { en: "Diagrams", es: "Diagramas", pt: "Diagramas" }), byLanguage(language, { en: "Samples", es: "Muestras", pt: "Amostras" }), "Blueprint", "Blueprint + ACP"],
    [byLanguage(language, { en: "Commercial estimate", es: "Estimacion comercial", pt: "Estimativa comercial" }), "—", byLanguage(language, { en: "Included", es: "Incluido", pt: "Incluido" }), byLanguage(language, { en: "Included", es: "Incluido", pt: "Incluido" })],
    [byLanguage(language, { en: "Prompt pack and contracts", es: "Prompt Pack y contratos", pt: "Prompt Pack e contratos" }), "—", "—", byLanguage(language, { en: "Included", es: "Incluido", pt: "Incluido" })],
    [byLanguage(language, { en: "Test Suite and GAPs", es: "Test Suite y GAPs", pt: "Test Suite e GAPs" }), "—", "—", byLanguage(language, { en: "Included", es: "Incluido", pt: "Incluido" })],
    [byLanguage(language, { en: "Portable technical package", es: "Paquete tecnico portable", pt: "Pacote tecnico portavel" }), "—", "—", byLanguage(language, { en: "Included", es: "Incluido", pt: "Incluido" })],
  ];
  return (
    <div
      aria-label={byLanguage(language, { en: "Tier comparison", es: "Comparacion de niveles", pt: "Comparacao de niveis" })}
      className="w-full min-w-0 max-w-full overflow-x-auto rounded-[12px] border border-[var(--border-default)] bg-white"
      role="region"
      tabIndex={0}
    >
      <table className="w-full min-w-[760px] border-collapse text-left">
        <thead>
          <tr className="bg-[var(--surface-subtle)] text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
            <th className="w-[34%] px-5 py-4">{byLanguage(language, { en: "Capability", es: "Capacidad", pt: "Capacidade" })}</th>
            <th className="px-4 py-4">Blueprint</th>
            <th className="px-4 py-4 text-[var(--brand-primary)]">{byLanguage(language, { en: "Professional", es: "Profesional", pt: "Profissional" })}</th>
            <th className="px-4 py-4 text-[#0f766e]">ACP Premium</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([feature, blueprint, professional, acp]) => (
            <tr className="border-t border-[var(--border-subtle)]" key={feature}>
              <th className="px-5 py-3.5 text-[12px] font-semibold text-[var(--text-primary)]">{feature}</th>
              {[blueprint, professional, acp].map((value, index) => (
                <td className="px-4 py-3.5 text-[12px] text-[var(--text-secondary)]" key={`${feature}-${index}`}>
                  <span className="inline-flex items-center gap-2">
                    {value === byLanguage(language, { en: "Included", es: "Incluido", pt: "Incluido" }) ? (
                      <Check aria-hidden="true" className="h-3.5 w-3.5 text-[#22734a]" />
                    ) : null}
                    {value}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HomeLoading() {
  const { language } = useLanguage();

  return (
    <WorkspaceShell sidebarFooter={<HomeSidebarFooter />}>
      <div className="min-h-screen bg-[#f3f6fa] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1360px]">
          <LoadingState
            title={byLanguage(language, { en: "Preparing your workspace", es: "Preparando tu inicio", pt: "Preparando seu inicio" })}
            description={byLanguage(
              language,
              {
                en: "We are recovering projects, permissions, and available products.",
                es: "Estamos recuperando proyectos, permisos y productos disponibles.",
                pt: "Estamos recuperando projetos, permissoes e produtos disponiveis.",
              },
            )}
          />
        </div>
      </div>
    </WorkspaceShell>
  );
}

export function SaasHomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    activeSessionId,
    activeSnapshot,
    createSession,
    getProductJourneyOverview,
    items,
    listCommercialProducts,
    listError,
    listStatus,
    refreshList,
    selectSession,
    snapshotStatus,
  } = useSessions();
  const [catalog, setCatalog] = useState<ProductCatalogResponse[]>([]);
  const [catalogStatus, setCatalogStatus] = useState<LoadStatus>("idle");
  const [catalogError, setCatalogError] = useState("");
  const [journeyOverview, setJourneyOverview] = useState<ProductJourneyOverview | null>(null);
  const [journeyStatus, setJourneyStatus] = useState<LoadStatus>("idle");
  const [journeyError, setJourneyError] = useState("");
  const [createStatus, setCreateStatus] = useState<"idle" | "creating" | "error">("idle");
  const [createError, setCreateError] = useState("");
  const [comparisonOpen, setComparisonOpen] = useState(false);

  const { currency, setCurrency, trm } = useCurrency();
  const { language } = useLanguage();
  const copy = useCallback((en: string, es: string, pt: string) => byLanguage(language, { en, es, pt }), [language]);
  const selectedSession = items.find((item) => item.id === activeSessionId) ?? items[0] ?? null;
  const selectedSnapshot = activeSnapshot?.session.id === selectedSession?.id ? activeSnapshot : null;
  const hasProject = Boolean(selectedSession);
  const journeyDisplay = getJourneyStateMachineDisplay(language, journeyOverview?.journey_state_machine ?? null);
  const activeTier =
    getActiveTierFromJourneyOverview(journeyOverview) ??
    resolveDisplayCommercialTier(selectedSnapshot ?? null);
  const planDefinitions = useMemo(
    () => buildPlanDefinitions(catalog, currency, trm.trm_cop, activeTier, language),
    [activeTier, catalog, currency, language, trm.trm_cop],
  );
  const localizedPlanDefinitions = useMemo(
    () =>
      planDefinitions.map((plan) => {
        if (plan.key === "blueprint") {
          return {
            ...plan,
            benefits: [
              copy("Complete design visible in the platform", "Diseno integral visible en la plataforma", "Design integral visivel na plataforma"),
              copy("Value narrative and sample architecture", "Narrativa de valor y arquitectura de muestra", "Narrativa de valor e arquitetura de amostra"),
              copy("Access to sample diagrams", "Acceso a diagramas de muestra", "Acesso a diagramas de amostra"),
            ],
            description: copy(
              "To explore the solution, validate the direction, and decide whether it is worth moving forward.",
              "Para explorar la solucion, validar el enfoque y decidir si vale la pena avanzar.",
              "Para explorar a solucao, validar a direcao e decidir se vale a pena avancar.",
            ),
            exclusion: copy("No external download, copy, or export.", "Sin descarga, copia ni exportacion externa.", "Sem download, copia ou exportacao externa."),
            eyebrow: copy("01 · EXPLORE", "01 · EXPLORAR", "01 · EXPLORAR"),
          };
        }
        if (plan.key === "blueprint_pro") {
          return {
            ...plan,
            benefits: [
              copy("Everything included in Blueprint", "Todo lo incluido en Blueprint", "Tudo incluido no Blueprint"),
              copy("Professional downloadable document", "Documento profesional descargable", "Documento profissional para download"),
              copy("Architecture, scope, rules, and roadmap", "Arquitectura, alcance, reglas y roadmap", "Arquitetura, escopo, regras e roadmap"),
              copy("Effort, time, and cost estimate", "Estimacion de esfuerzo, tiempo y costo", "Estimativa de esforco, tempo e custo"),
            ],
            description: copy(
              "To present the solution, support an investment decision, or contract implementation.",
              "Para presentar, tomar una decision de inversion o contratar la implementacion.",
              "Para apresentar, tomar uma decisao de investimento ou contratar a implementacao.",
            ),
            exclusion: copy(
              "Does not include the Test Suite or ACP technical package.",
              "No incluye Test Suite ni paquete tecnico ACP.",
              "Nao inclui Test Suite nem pacote tecnico ACP.",
            ),
            eyebrow: copy("02 · DOCUMENT", "02 · DOCUMENTAR", "02 · DOCUMENTAR"),
            name: copy("Blueprint Pro", "Blueprint Profesional", "Blueprint Pro"),
          };
        }
        return {
          ...plan,
          benefits: [
            copy("Everything included in Blueprint Pro", "Todo lo incluido en Blueprint Profesional", "Tudo incluido no Blueprint Pro"),
            copy("Prompts, contracts, tools, and memory", "Prompts, contratos, herramientas y memoria", "Prompts, contratos, ferramentas e memoria"),
            copy("Test Suite, GAPs, and implementation questions", "Test Suite, GAPs y preguntas de implementacion", "Test Suite, GAPs e perguntas de implementacao"),
            copy("Portable ZIP package for agentic tools", "Paquete ZIP portable para herramientas agenticas", "Pacote ZIP portavel para ferramentas agenticas"),
          ],
          description: copy(
            "To begin construction with Codex, Cursor, Claude Code, or Copilot.",
            "Para iniciar la construccion con Codex, Cursor, Claude Code o Copilot.",
            "Para iniciar a construcao com Codex, Cursor, Claude Code ou Copilot.",
          ),
          exclusion: copy(
            "It does not execute deployment or install dependencies.",
            "No ejecuta el despliegue ni instala dependencias.",
            "Nao executa o deploy nem instala dependencias.",
          ),
          eyebrow: copy("03 · BUILD", "03 · CONSTRUIR", "03 · CONSTRUIR"),
        };
      }),
    [copy, planDefinitions],
  );
  const activePlan = localizedPlanDefinitions.find((plan) => plan.key === activeTier) ?? localizedPlanDefinitions[0];

  const progress = journeyOverview?.current_stage.progress_percent ?? 0;

  const loadCatalog = useCallback(async () => {
    setCatalogStatus("loading");
    setCatalogError("");
    try {
      setCatalog(await listCommercialProducts());
      setCatalogStatus("ready");
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : copy("The commercial catalog could not be loaded.", "No fue posible recuperar el catalogo comercial.", "Nao foi possivel recuperar o catalogo comercial."));
      setCatalogStatus("error");
    }
  }, [copy, listCommercialProducts]);

  useEffect(() => {
    if (user && listStatus === "idle") {
      return runAfterEffect(() => void refreshList({ loadActiveSnapshot: true }));
    }
    return undefined;
  }, [listStatus, refreshList, user]);

  useEffect(() => {
    if (catalogStatus === "idle") {
      return runAfterEffect(() => void loadCatalog());
    }
    return undefined;
  }, [catalogStatus, loadCatalog]);

  useEffect(() => {
    if (!selectedSession || selectedSnapshot || snapshotStatus !== "idle") {
      return;
    }
    void selectSession(selectedSession.id);
  }, [selectedSession, selectedSnapshot, selectSession, snapshotStatus]);

  const loadJourneyOverview = useCallback(async () => {
    if (!selectedSession) {
      setJourneyOverview(null);
      setJourneyStatus("idle");
      setJourneyError("");
      return;
    }

    setJourneyStatus((current) => (journeyOverview ? current : "loading"));
    setJourneyError("");
    try {
      const result = await getProductJourneyOverview(selectedSession.id);
      setJourneyOverview(result);
      setJourneyStatus("ready");
    } catch (error) {
      setJourneyError(error instanceof Error ? error.message : copy("The journey overview could not be loaded.", "No fue posible cargar el progreso del journey.", "Nao foi possivel carregar o progresso da jornada."));
      setJourneyStatus("error");
    }
  }, [copy, getProductJourneyOverview, journeyOverview, selectedSession]);

  useEffect(() => {
    if (!selectedSession) {
      return runAfterEffect(() => {
        setJourneyOverview(null);
        setJourneyStatus("idle");
        setJourneyError("");
      });
    }
    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      if (!cancelled) {
        void loadJourneyOverview();
      }
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [loadJourneyOverview, selectedSession]);

  async function handleCreateBlueprint(prefill?: { title?: string; initial_prompt?: string; archetype?: string }) {
    setCreateStatus("creating");
    setCreateError("");
    try {
      const created = await createSession({ loadSnapshot: false });
      if (prefill && typeof window !== "undefined") {
        try {
          window.sessionStorage.setItem(`session_eval_prefill_${created.id}`, JSON.stringify(prefill));
        } catch {
          // ignore storage errors
        }
      }
      const targetRoute = getSessionProjectRoute(created);
      router.push(targetRoute);
      setCreateStatus("idle");
    } catch (error) {
      setCreateStatus("error");
      setCreateError(error instanceof Error ? error.message : copy("The Blueprint could not be created.", "No fue posible crear el Blueprint.", "Nao foi possivel criar o Blueprint."));
    }
  }

  async function handleContinue() {
    if (!user) {
      router.push("/register?redirect=/projects/new&tier=blueprint");
      return;
    }
    if (!selectedSession) {
      await handleCreateBlueprint();
      return;
    }
    await selectSession(selectedSession.id, { loadSnapshot: false, persist: true });
    router.push(getSessionProjectRoute(selectedSession, selectedSnapshot ?? null, journeyOverview));
  }

  async function handlePlanAction(tier: CommercialTier) {
    if (!user) {
      router.push(`/register?tier=${tier}`);
      return;
    }
    if (!selectedSession) {
      await handleCreateBlueprint();
      return;
    }
    await selectSession(selectedSession.id, { loadSnapshot: false, persist: true });
    router.push(getProjectProductRoute(selectedSession.id, tier === "acp" ? "acp" : tier));
  }

  function getPlanActionLabel(plan: PlanDefinition) {
    if (!selectedSession) {
      return plan.key === "blueprint"
        ? copy("Create free Blueprint", "Crear Blueprint gratis", "Criar Blueprint gratis")
        : copy("Create project first", "Crear proyecto primero", "Criar projeto primero");
    }
    if (tierRank(activeTier) >= tierRank(plan.key)) {
      return plan.key === "blueprint"
        ? copy("Open Blueprint", "Abrir Blueprint", "Abrir Blueprint")
        : plan.key === "blueprint_pro"
          ? copy("Open Blueprint Pro", "Abrir Blueprint Profesional", "Abrir Blueprint Pro")
          : copy("Open ACP Premium", "Abrir ACP Premium", "Abrir ACP Premium");
    }
    if (activeTier === "blueprint_pro" && plan.key === "acp") {
      return copy("Complete ACP upgrade", "Completar Upgrade a ACP", "Completar upgrade para ACP");
    }
    return plan.key === "blueprint_pro"
      ? copy("View professional delivery", "Ver entrega profesional", "Ver entrega profissional")
      : copy("View ACP package", "Ver paquete ACP", "Ver pacote ACP");
  }

  if (user && listStatus === "loading" && items.length === 0) {
    return <HomeLoading />;
  }

  if (user && listStatus === "error" && items.length === 0) {
    return (
      <WorkspaceShell sidebarFooter={<HomeSidebarFooter />}>
        <div className="min-h-screen bg-[#f3f6fa] px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1360px]">
            <ErrorState
              title="No se pudo abrir el inicio"
              description={listError?.message ?? "No fue posible recuperar la información del workspace."}
              action={<AppButton onClick={() => void refreshList({ force: true })}>Reintentar</AppButton>}
            />
          </div>
        </div>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell sidebarFooter={user ? <HomeSidebarFooter /> : null}>
      <div className="min-h-screen w-full min-w-0 max-w-[calc(100vw-2px)] overflow-x-hidden bg-[#f3f6fa] text-[var(--text-primary)] lg:max-w-none">
        <header className="sticky top-0 z-30 border-b border-[var(--border-default)] bg-white/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-[1360px] flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand-primary)] text-white shadow-xs">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[12px] font-black uppercase tracking-[0.16em] text-[var(--brand-primary)]">Lean Agent Builder</p>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  {user
                    ? `${copy("Workspace · ", "Workspace · ", "Workspace · ")}${user?.active_workspace_name ?? copy("Current workspace", "Workspace actual", "Workspace atual")}`
                    : copy("AI Agent Design & Packaging", "Diseño y Empaquetado de Agentes de IA", "Design e Empacotamento de Agentes de IA")}
                </p>
              </div>
            </div>

            {user ? (
              <TopUtilities />
            ) : (
              <div className="flex items-center gap-3 self-end sm:self-auto">
                <div className="flex items-center gap-1 rounded-[8px] border border-[var(--border-default)] bg-white p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setCurrency("USD")}
                    className={cn(
                      "px-2 py-0.5 rounded-[6px] font-bold transition",
                      currency === "USD" ? "bg-[var(--brand-primary)] text-white" : "text-[var(--text-secondary)] hover:text-black"
                    )}
                  >
                    USD ($)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency("COP")}
                    className={cn(
                      "px-2 py-0.5 rounded-[6px] font-bold transition",
                      currency === "COP" ? "bg-[var(--brand-primary)] text-white" : "text-[var(--text-secondary)] hover:text-black"
                    )}
                  >
                    COP ($)
                  </button>
                </div>

                <LanguageSelector />

                <div className="h-4 w-px bg-[var(--border-default)] mx-1" />

                <Link
                  href="/login"
                  className="rounded-lg border border-[var(--border-default)] bg-white px-3.5 py-1.5 text-xs font-bold text-[var(--text-secondary)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] transition"
                >
                  {copy("Log in", "Iniciar sesión", "Entrar")}
                </Link>

                <Link
                  href="/register"
                  className="rounded-lg bg-[var(--brand-primary)] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:opacity-90 transition"
                >
                  {copy("Sign up free", "Crear cuenta gratis", "Criar conta grátis")}
                </Link>
              </div>
            )}
          </div>
        </header>

        <main className="mx-auto min-w-0 max-w-[1360px] space-y-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          <Panel className="border-[var(--border-default)] bg-white p-5 lg:p-6">
            <div aria-hidden="true" className="pointer-events-none absolute right-0 top-0 hidden h-full w-[42%] opacity-60 lg:block">
              <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(53,84,199,0.035))]" />
              <div className="absolute right-8 top-8 h-28 w-28 border border-[#dbe3f3]" />
              <div className="absolute right-16 top-16 h-28 w-28 border border-[#dbe3f3]" />
            </div>

            <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_360px] lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={hasProject ? "green" : "blue"}>
                    {hasProject
                      ? copy("Active project", "Proyecto activo", "Projeto ativo")
                      : copy("Start at no cost", "Empieza sin costo", "Comece sem custo")}
                  </Badge>
                  {hasProject ? <Badge tone="slate">{activePlan.name}</Badge> : null}
                </div>
                <h1 className="mt-4 max-w-4xl text-[34px] font-semibold leading-[1.08] tracking-[-0.045em] text-[var(--text-primary)] sm:text-[40px] lg:text-[44px]">
                  {hasProject
                    ? copy(
                        "Continue your design without losing context or decisions.",
                        "Continua tu diseno sin perder contexto ni decisiones.",
                        "Continue seu design sem perder contexto nem decisoes.",
                      )
                    : copy(
                        "From a business need to an agent ready to build.",
                        "De una necesidad de negocio a un agente listo para construir.",
                        "De uma necessidade de negocio a um agente pronto para construir.",
                      )}
                </h1>
                <p className="mt-4 max-w-3xl text-[14px] leading-7 text-[var(--text-secondary)]">
                  {hasProject
                    ? copy(
                        "Resume the current stage, review the available deliverable, and decide when to move to professional documentation or construction.",
                        "Retoma la etapa actual, revisa la entrega disponible y decide cuando avanzar a documentacion profesional o construccion.",
                        "Retome a etapa atual, revise a entrega disponivel e decida quando avancar para documentacao profissional ou construcao.",
                      )
                    : copy(
                        "Start free with a Blueprint. When you are ready, download the professional documentation or acquire the full technical package.",
                        "Empieza gratis con un Blueprint. Cuando estes listo, descarga la documentacion profesional o adquiere el paquete tecnico completo.",
                        "Comece gratis com um Blueprint. Quando estiver pronto, baixe a documentacao profissional ou adquira o pacote tecnico completo.",
                      )}
                </p>

                {createStatus === "error" ? (
                  <div className="mt-4 rounded-[10px] border border-[rgba(239,68,68,0.2)] bg-[var(--danger-soft)] px-4 py-3 text-[12px] text-[var(--danger)]">
                    {createError}
                  </div>
                ) : null}

                {hasProject && journeyStatus === "loading" ? (
                  <div className="mt-4 rounded-[10px] border border-[var(--border-default)] bg-[var(--surface-subtle)] px-4 py-3 text-[12px] text-[var(--text-secondary)]" aria-live="polite">
                    {copy("Updating your next recommended action...", "Actualizando tu siguiente accion recomendada...", "Atualizando sua proxima acao recomendada...")}
                  </div>
                ) : null}

                {hasProject && journeyStatus === "error" ? (
                  <div className="mt-4 flex flex-col gap-3 rounded-[10px] border border-[#f3d7aa] bg-[#fff8ec] px-4 py-3 text-[12px] text-[#7a4a0a] sm:flex-row sm:items-center sm:justify-between" role="alert">
                    <span>{journeyError}</span>
                    <AppButton className="h-8 rounded-[8px]" onClick={() => void loadJourneyOverview()}>
                      {copy("Retry progress", "Reintentar progreso", "Tentar progresso novamente")}
                    </AppButton>
                  </div>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-3">
                  <AppButton
                    className="h-10 rounded-[9px] px-5"
                    icon={hasProject ? <Play aria-hidden="true" className="h-4 w-4" /> : <Sparkles aria-hidden="true" className="h-4 w-4" />}
                    loading={createStatus === "creating"}
                    loadingLabel={copy("Creating Blueprint", "Creando Blueprint", "Criando Blueprint")}
                    onClick={() => void handleContinue()}
                    variant="primary"
                  >
                    {hasProject
                      ? copy("Continue project", "Continuar proyecto", "Continuar projeto")
                      : copy("Create free Blueprint", "Crear Blueprint gratis", "Criar Blueprint gratis")}
                  </AppButton>
                  <AppButton
                    className="h-10 rounded-[9px]"
                    icon={<FolderKanban aria-hidden="true" className="h-4 w-4" />}
                    onClick={() => router.push("/projects")}
                  >
                    {copy("View projects", "Ver proyectos", "Ver projetos")}
                  </AppButton>
                </div>
              </div>

              {selectedSession ? (
                <ActiveProjectCard
                  detail={journeyDisplay?.detail ?? journeyOverview?.recommended_next_action?.reason ?? ""}
                  nextStepLabel={journeyOverview?.recommended_next_action?.label}
                  planLabel={activePlan.name}
                  progress={progress}
                  stage={journeyDisplay?.label ?? journeyOverview?.current_stage.label ?? getSessionStageLabel(selectedSession.current_stage, language)}
                  status={journeyDisplay?.substateLabel ?? journeyOverview?.recommended_next_action?.label ?? getSessionStatusLabel(selectedSession.status, language)}
                  title={journeyOverview?.project_title ?? selectedSession.title}
                />
              ) : (
                <FirstValueCard />
              )}
            </div>
          </Panel>

          <section aria-labelledby="plans-title" className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--brand-primary)]">
                  {copy("Delivery tiers", "Niveles de entrega", "Niveis de entrega")}
                </p>
                <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.035em] text-[var(--text-primary)]" id="plans-title">
                  {copy(
                    "Choose how far you want to take your project",
                    "Elige hasta donde quieres llevar tu proyecto",
                    "Escolha ate onde quer levar seu projeto",
                  )}
                </h2>
                <p className="mt-2 text-[13px] leading-6 text-[var(--text-secondary)]">
                  {copy(
                    "Start free. Paid tiers are one-time purchases and apply to the selected project.",
                    "Empieza gratis. Los niveles pagos son compras unicas y se aplican al proyecto seleccionado.",
                    "Comece gratis. Os niveis pagos sao compras unicas e se aplicam ao projeto selecionado.",
                  )}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 rounded-[8px] border border-[var(--border-default)] bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setCurrency("USD")}
                    className={cn(
                      "px-2.5 py-1 rounded-[6px] text-[11px] font-bold transition",
                      currency === "USD" ? "bg-[var(--brand-primary)] text-white" : "text-[var(--text-secondary)] hover:text-black"
                    )}
                  >
                    USD ($)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency("COP")}
                    className={cn(
                      "px-2.5 py-1 rounded-[6px] text-[11px] font-bold transition",
                      currency === "COP" ? "bg-[var(--brand-primary)] text-white" : "text-[var(--text-secondary)] hover:text-black"
                    )}
                  >
                    COP ($)
                  </button>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-semibold text-[var(--text-secondary)]">
                  <ShieldCheck aria-hidden="true" className="h-4 w-4 text-[#22734a]" />
                  <span>
                    {currency === "COP"
                      ? `TRM $${new Intl.NumberFormat("es-CO").format(trm.trm_cop)} COP/USD`
                      : copy("Base values in USD", "Valores base en USD", "Valores base em USD")}
                  </span>
                </div>
              </div>
            </div>

            {catalogStatus === "error" ? (
              <div className="flex flex-col gap-3 rounded-[10px] border border-[#f3d7aa] bg-[#fff8ec] px-4 py-3 text-[12px] text-[#7a4a0a] sm:flex-row sm:items-center sm:justify-between">
                <span className="flex items-start gap-2">
                  <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    {catalogError || copy("Pricing is temporarily unavailable.", "Los precios no estan disponibles temporalmente.", "Os precos nao estao disponiveis temporariamente.")}
                  </span>
                </span>
                <AppButton className="h-9 rounded-[8px]" icon={<RefreshCcw aria-hidden="true" className="h-3.5 w-3.5" />} onClick={() => void loadCatalog()}>
                  {copy("Retry catalog", "Reintentar catalogo", "Tentar catalogo novamente")}
                </AppButton>
              </div>
            ) : null}

            <div className="relative grid gap-4 lg:grid-cols-3">
              <div aria-hidden="true" className="absolute left-[16%] right-[16%] top-7 hidden h-px bg-[var(--border-default)] lg:block" />
              {localizedPlanDefinitions.map((plan) => (
                <PlanCard
                  actionLabel={getPlanActionLabel(plan)}
                  active={plan.key === activeTier}
                  key={plan.key}
                  onAction={() => void handlePlanAction(plan.key)}
                  plan={plan}
                />
              ))}
            </div>
          </section>

          <Panel className="min-w-0 border-[var(--border-default)] bg-white p-5">
            <button
              aria-expanded={comparisonOpen}
              className="flex w-full items-center justify-between gap-4 text-left"
              onClick={() => setComparisonOpen((current) => !current)}
              type="button"
            >
              <span>
                <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                  {copy("Detailed comparison", "Comparacion detallada", "Comparacao detalhada")}
                </span>
                <span className="mt-1 block text-[18px] font-semibold text-[var(--text-primary)]">
                  {copy("What you receive at each tier", "Que recibes en cada nivel", "O que voce recebe em cada nivel")}
                </span>
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-[9px] border border-[var(--border-default)] text-[var(--brand-primary)]">
                {comparisonOpen ? <ChevronUp aria-hidden="true" className="h-4 w-4" /> : <ChevronDown aria-hidden="true" className="h-4 w-4" />}
              </span>
            </button>
            {comparisonOpen ? <div className="mt-5"><ComparisonTable /></div> : null}
          </Panel>

          <Panel className="border-[var(--border-default)] bg-white p-5" id="how-it-works">
            <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-center">
              <div>
                <Badge tone="slate">{copy("How it works", "Como funciona", "Como funciona")}</Badge>
                <h2 className="mt-3 text-[22px] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                  {copy("One journey, three decisions", "Un recorrido, tres decisiones", "Uma jornada, tres decisoes")}
                </h2>
                <p className="mt-2 text-[12px] leading-6 text-[var(--text-secondary)]">
                  {copy("Complexity appears only when it adds value.", "La complejidad aparece solo cuando aporta valor.", "A complexidade aparece apenas quando agrega valor.")}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ["01", copy("Discover", "Descubrir", "Descobrir"), copy("Describe the problem and the context.", "Describe el problema y el contexto.", "Descreva o problema e o contexto.")],
                  ["02", copy("Design", "Disenar", "Design"), copy("Validate architecture, rules, and scope.", "Valida arquitectura, reglas y alcance.", "Valide arquitetura, regras e escopo.")],
                  ["03", copy("Decide", "Decidir", "Decidir"), copy("Review effort, cost, and delivery tier.", "Revisa esfuerzo, costo y nivel de entrega.", "Revise esforco, custo e nivel de entrega.")],
                  ["04", copy("Build", "Construir", "Construir"), copy("Take the package to your preferred tool.", "Lleva el paquete a tu herramienta preferida.", "Leve o pacote para sua ferramenta preferida.")],
                ].map(([number, title, detail]) => (
                  <div className="rounded-[10px] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4" key={number}>
                    <span className="text-[10px] font-bold tracking-[0.16em] text-[var(--brand-primary)]">{number}</span>
                    <p className="mt-2 text-[14px] font-semibold text-[var(--text-primary)]">{title}</p>
                    <p className="mt-1 text-[11px] leading-5 text-[var(--text-secondary)]">{detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          {items.length > 0 ? (
            <Panel className="border-[var(--border-default)] bg-white p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                    {copy("Continuity", "Continuidad", "Continuidade")}
                  </p>
                  <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                    {copy("Recent projects", "Proyectos recientes", "Projetos recentes")}
                  </h2>
                </div>
                <AppButton className="h-9 rounded-[8px]" onClick={() => router.push("/projects")} variant="ghost">
                  {copy("Open portfolio", "Abrir portafolio", "Abrir portifolio")}
                </AppButton>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {items.slice(0, 4).map((item) => (
                  <button
                    className="flex min-h-20 w-full items-center justify-between gap-4 rounded-[10px] border border-[var(--border-default)] bg-[var(--surface-subtle)] px-4 py-3 text-left transition hover:border-[var(--brand-primary)] hover:bg-white"
                    key={item.id}
                    onClick={() => {
                      void selectSession(item.id, { loadSnapshot: false, persist: true });
                      router.push(getSessionProjectRoute(item));
                    }}
                    type="button"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] font-semibold text-[var(--text-primary)]">{item.title}</span>
                      <span className="mt-1 block text-[11px] text-[var(--text-secondary)]">
                        {getSessionStageLabel(item.current_stage, language)} · {getSessionStatusLabel(item.status, language)}
                      </span>
                    </span>
                    <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-[var(--brand-primary)]" />
                  </button>
                ))}
              </div>
            </Panel>
          ) : null}

          <footer className="flex flex-col gap-3 border-t border-[var(--border-default)] py-4 text-[11px] text-[var(--text-secondary)] sm:flex-row sm:items-center sm:justify-between">
            <span>{copy("Purchases are one-time and apply to the selected project.", "Las compras son unicas y se aplican al proyecto seleccionado.", "As compras sao unicas e se aplicam ao projeto selecionado.")}</span>
            <span>{copy("Enterprise Corporate · Compact density", "Enterprise Corporate · Densidad compacta", "Enterprise Corporate · Densidade compacta")}</span>
          </footer>
        </main>
      </div>
    </WorkspaceShell>
  );
}
