"use client";

import { Lock, Sparkles, Zap } from "lucide-react";
import { AppButton, Badge, Panel } from "@/components/lean/ui";
import type { CommercialTier, SessionCommercialAccess } from "@/features/sessions/types";
import { useCurrency } from "@/core/commerce/currency-context";
import { useLanguage } from "@/core/i18n/language-context";
import { byLanguage } from "@/features/product-experience/core/localized-copy";
import { getProductPricingDisplay } from "@/features/product-experience/core/pricing-display";
import {
  type ProjectEffortMetrics,
  getProjectEffortMetrics,
} from "@/features/product-experience/core/effort-metrics";

const DEFAULT_COMMERCIAL_ACCESS: SessionCommercialAccess = {
  available_upgrades: ["blueprint_pro", "acp"],
  can_access_library_workspace: false,
  can_build_acp: false,
  can_download_acp: false,
  can_download_blueprint: false,
  can_export_acp_zip: false,
  can_export_blueprint_core: false,
  can_export_blueprint_document: false,
  can_export_construction_pack: false,
  can_export_estimation_pack: false,
  can_export_json: false,
  can_export_markdown: false,
  can_export_prompt_pack: false,
  can_export_test_pack: false,
  can_invite_acp: true,
  can_view_blueprint: true,
  can_view_diagram_acp: false,
  can_view_diagram_blueprint: false,
  can_view_diagram_sample: true,
  can_view_in_app_blueprint: true,
  tier: "blueprint",
  tier_label: "Blueprint",
  tier_rank: 1,
  upgrade_cta_label: "02 · DISEÑA — Completar mi diseño",
  upgrade_message:
    "Explora el Blueprint en la plataforma y completa tu diseño con Blueprint Pro (02 · DISEÑA) o prepara el paquete completo para construir con ACP (03 · PREPARA).",
};

export function resolveCommercialAccess(access?: SessionCommercialAccess | null): SessionCommercialAccess {
  return access ?? DEFAULT_COMMERCIAL_ACCESS;
}

const TIER_RANK: Record<CommercialTier, number> = {
  blueprint: 1,
  blueprint_pro: 2,
  acp: 3,
};

function getTierDefinitions(language: "en" | "es" | "pt", effortMetrics?: ProjectEffortMetrics) {
  const effort = effortMetrics ?? getProjectEffortMetrics(null);

  return [
    {
      accent: "from-[rgba(15,118,110,0.16)] via-[rgba(255,255,255,0.98)] to-white",
      bullets: byLanguage(language, {
        en: [
          "Complete blueprint visible within the platform.",
          "Commercial and visual narrative to understand agent value.",
          "No external downloads or exports.",
        ],
        es: [
          "Blueprint completo visible dentro de la plataforma.",
          "Narrativa comercial y visual para entender el valor del agente.",
          "Sin descargas ni exportaciones externas.",
        ],
        pt: [
          "Blueprint completo visível na plataforma.",
          "Narrativa comercial e visual para entender o valor do agente.",
          "Sem downloads ou exportações externas.",
        ],
      }),
      ctaKey: "blueprint" as CommercialTier,
      description: byLanguage(language, {
        en: "01 · EXPLORE — Validate your idea. Discover the case, validate the opportunity and view the blueprint before investing.",
        es: "01 · EXPLORA — Valida tu idea. Descubre el caso, valida la oportunidad y ve el blueprint antes de invertir.",
        pt: "01 · EXPLORE — Valide sua ideia. Descubra o caso, valide a oportunidade e veja o blueprint antes de investir.",
      }),
      label: byLanguage(language, {
        en: "01 · EXPLORE — Blueprint",
        es: "01 · EXPLORA — Blueprint",
        pt: "01 · EXPLORE — Blueprint",
      }),
      tier: "blueprint" as CommercialTier,
    },
    {
      accent: "from-[rgba(37,99,235,0.16)] via-[rgba(255,255,255,0.98)] to-white",
      bullets: byLanguage(language, {
        en: [
          "Professional Blueprint download.",
          "Architecture, scope, rules, integrations, and roadmap.",
          "Effort, time, and cost estimation.",
        ],
        es: [
          "Descarga del Blueprint Profesional.",
          "Arquitectura, alcance, reglas, integraciones y roadmap.",
          "Estimación de esfuerzo, tiempo y costo.",
        ],
        pt: [
          "Download do Blueprint Profissional.",
          "Arquitetura, escopo, regras, integrações e roadmap.",
          "Estimativa de esforço, tempo e custo.",
        ],
      }),
      ctaKey: "blueprint_pro" as CommercialTier,
      description: byLanguage(language, {
        en: `02 · DESIGN — Complete design. Turn the analysis into a professional document ready for decision, purchase, or implementation (${effort.proAdditionalSavedDisplay} saved).`,
        es: `02 · DISEÑA — Diseño completo. Convierte el análisis en un documento profesional listo para decisión, compra o implementación (${effort.proAdditionalSavedDisplay} ahorradas).`,
        pt: `02 · DESENHE — Desenho completo. Transforme a análise em documento profissional pronto para decisão, compra ou implementação (${effort.proAdditionalSavedDisplay} poupadas).`,
      }),
      label: byLanguage(language, {
        en: "02 · DESIGN — Blueprint Pro",
        es: "02 · DISEÑA — Blueprint Pro",
        pt: "02 · DESENHE — Blueprint Pro",
      }),
      tier: "blueprint_pro" as CommercialTier,
    },
    {
      accent: "from-[rgba(124,58,237,0.18)] via-[rgba(255,255,255,0.98)] to-white",
      bullets: byLanguage(language, {
        en: [
          "Includes everything in Blueprint Pro.",
          "Construction Pack, prompts, tests, and configurations.",
          "Ready-to-build technical package without redefining architecture.",
        ],
        es: [
          "Incluye todo lo del Blueprint Profesional.",
          "Construction Pack, prompts, tests y configuraciones.",
          "Paquete técnico listo para construir sin redefinir la arquitectura.",
        ],
        pt: [
          "Inclui tudo do Blueprint Profissional.",
          "Construction Pack, prompts, testes e configurações.",
          "Pacote técnico pronto para construir sem redefinir a arquitetura.",
        ],
      }),
      ctaKey: "acp" as CommercialTier,
      description: byLanguage(language, {
        en: `03 · PREPARE — Ready to build. Premium tier for Cursor, Claude Code, and dev teams (${effort.traditionalHoursDisplay} saved).`,
        es: `03 · PREPARA — Listo para construir. La capa premium para Cursor, Claude Code y equipos de implementación (${effort.traditionalHoursDisplay} ahorradas).`,
        pt: `03 · PREPARE — Pronto para construir. A camada premium para Cursor, Claude Code e equipes de desenvolvimento (${effort.traditionalHoursDisplay} poupadas).`,
      }),
      label: byLanguage(language, {
        en: "03 · PREPARE — ACP",
        es: "03 · PREPARA — ACP",
        pt: "03 · PREPARE — ACP",
      }),
      tier: "acp" as CommercialTier,
    },
  ];
}

function badgeToneForTier(tier: CommercialTier) {
  if (tier === "blueprint") {
    return "green";
  }
  if (tier === "blueprint_pro") {
    return "blue";
  }
  return "violet";
}

function iconForTier(tier: CommercialTier) {
  if (tier === "blueprint") {
    return <Sparkles className="h-4 w-4" />;
  }
  if (tier === "blueprint_pro") {
    return <Zap className="h-4 w-4" />;
  }
  return <Lock className="h-4 w-4" />;
}

export function CommercialTierPanel({
  access,
  actionState,
  description,
  effortMetrics,
  onUpgrade,
  title,
}: {
  access?: SessionCommercialAccess | null;
  actionState?: CommercialTier | null;
  description?: string;
  effortMetrics?: ProjectEffortMetrics;
  onUpgrade?: (tier: CommercialTier) => void;
  title?: string;
}) {
  const { language } = useLanguage();
  const resolvedAccess = resolveCommercialAccess(access);
  const { currency, formatPrice, basePrices, trm } = useCurrency();
  const proPricing = getProductPricingDisplay({
    usdAmount: basePrices.blueprint_pro_usd,
    currency,
    trmCop: trm.trm_cop,
    formatPrice,
  });
  const acpPricing = getProductPricingDisplay({
    usdAmount: basePrices.acp_premium_usd,
    currency,
    trmCop: trm.trm_cop,
    formatPrice,
  });

  const tierDefinitions = getTierDefinitions(language, effortMetrics);

  function ctaLabelForTier(ctaKey: CommercialTier): string {
    if (ctaKey === "blueprint_pro") {
      return byLanguage(language, {
        en: `⚡ Complete my design — ${proPricing.combinedCtaLabel}`,
        es: `⚡ Completar mi diseño — ${proPricing.combinedCtaLabel}`,
        pt: `⚡ Completar meu desenho — ${proPricing.combinedCtaLabel}`,
      });
    }
    if (ctaKey === "acp") {
      return byLanguage(language, {
        en: `⚡ Prepare for build — ${acpPricing.combinedCtaLabel}`,
        es: `⚡ Preparar para construcción — ${acpPricing.combinedCtaLabel}`,
        pt: `⚡ Preparar para construção — ${acpPricing.combinedCtaLabel}`,
      });
    }
    return byLanguage(language, {
      en: "Current plan",
      es: "Plan actual",
      pt: "Plano atual",
    });
  }

  const panelTitle =
    title ??
    byLanguage(language, {
      en: "Commercial model",
      es: "Modelo comercial",
      pt: "Modelo comercial",
    });

  const panelDescription =
    description ??
    byLanguage(language, {
      en: "Explore the Blueprint on the platform and complete your design with Blueprint Pro (02 · DESIGN) or prepare the full construction pack with ACP (03 · PREPARE).",
      es: resolvedAccess.upgrade_message,
      pt: "Explore o Blueprint na plataforma e complete seu desenho com o Blueprint Pro (02 · DESENHE) ou prepare o pacote de construção com o ACP (03 · PREPARE).",
    });

  return (
    <Panel className="overflow-hidden border-[rgba(15,23,42,0.08)] p-0">
      <div className="border-b border-[var(--border-default)] bg-[linear-gradient(135deg,rgba(11,18,32,0.98),rgba(32,44,68,0.96))] px-6 py-6 text-white">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={badgeToneForTier(resolvedAccess.tier)}>{resolvedAccess.tier_label}</Badge>
          <span className="text-[12px] uppercase tracking-[0.22em] text-white/62">SaaS ladder</span>
        </div>
        <p className="mt-4 text-[26px] font-semibold">{panelTitle}</p>
        <p className="mt-2 max-w-[860px] text-[14px] leading-7 text-white/76">
          {panelDescription}
        </p>
      </div>

      <div className="grid gap-4 p-6 xl:grid-cols-3">
        {tierDefinitions.map((definition) => {
          const isCurrent = resolvedAccess.tier === definition.tier;
          const isUnlocked = resolvedAccess.tier_rank >= TIER_RANK[definition.tier];
          const isUpgrade = !isUnlocked;
          return (
            <Panel
              key={definition.tier}
              className={`min-h-[280px] border p-5 ${
                isCurrent
                  ? "border-[rgba(37,99,235,0.28)] shadow-[0_18px_40px_rgba(37,99,235,0.12)]"
                  : "border-[var(--border-default)]"
              } bg-gradient-to-br ${definition.accent}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-[var(--text-primary)]">
                    {iconForTier(definition.tier)}
                    <p className="text-[18px] font-semibold">{definition.label}</p>
                  </div>
                  <p className="mt-3 text-[14px] leading-7 text-[var(--text-secondary)]">{definition.description}</p>
                </div>
                <Badge tone={isCurrent ? badgeToneForTier(definition.tier) : isUnlocked ? "green" : "slate"}>
                  {isCurrent
                    ? byLanguage(language, { en: "Current", es: "Actual", pt: "Atual" })
                    : isUnlocked
                      ? byLanguage(language, { en: "Included", es: "Incluido", pt: "Incluído" })
                      : "Locked"}
                </Badge>
              </div>

              <div className="mt-5 space-y-3">
                {definition.bullets.map((item) => (
                  <p key={item} className="rounded-[16px] border border-white/60 bg-white/72 px-3 py-3 text-[13px] leading-6 text-[var(--text-primary)]">
                    {item}
                  </p>
                ))}
              </div>

              <div className="mt-5">
                {isUpgrade && onUpgrade ? (
                  <AppButton
                    loading={actionState === definition.tier}
                    onClick={() => onUpgrade(definition.tier)}
                    variant={definition.tier === "acp" ? "primary" : undefined}
                  >
                    {ctaLabelForTier(definition.ctaKey)}
                  </AppButton>
                ) : (
                  <AppButton disabled>
                    {isCurrent
                      ? byLanguage(language, { en: "Current plan", es: "Plan actual", pt: "Plano atual" })
                      : byLanguage(language, { en: "Already included", es: "Ya incluido", pt: "Já incluído" })}
                  </AppButton>
                )}
              </div>
            </Panel>
          );
        })}
      </div>
    </Panel>
  );
}


