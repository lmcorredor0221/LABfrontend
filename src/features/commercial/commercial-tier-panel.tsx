"use client";

import { Lock, Sparkles, Zap } from "lucide-react";
import { AppButton, Badge, Panel } from "@/components/lean/ui";
import type { CommercialTier, SessionCommercialAccess } from "@/features/sessions/types";

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
  upgrade_cta_label: "Upgrade a Blueprint Profesional",
  upgrade_message:
    "Explora el Blueprint en la plataforma y desbloquea exportables profesionales o el paquete ACP completo cuando quieras llevarlo a implementacion.",
};

export function resolveCommercialAccess(access?: SessionCommercialAccess | null): SessionCommercialAccess {
  return access ?? DEFAULT_COMMERCIAL_ACCESS;
}

const TIER_RANK: Record<CommercialTier, number> = {
  blueprint: 1,
  blueprint_pro: 2,
  acp: 3,
};

type TierDefinition = {
  accent: string;
  bullets: string[];
  cta: string;
  description: string;
  label: string;
  tier: CommercialTier;
};

const TIER_DEFINITIONS: TierDefinition[] = [
  {
    accent: "from-[rgba(15,118,110,0.16)] via-[rgba(255,255,255,0.98)] to-white",
    bullets: [
      "Blueprint completo visible dentro de la plataforma.",
      "Narrativa comercial y visual para entender el valor del agente.",
      "Sin descargas ni exportaciones externas.",
    ],
    cta: "Plan actual",
    description: "Ideal para descubrir el caso, validar la oportunidad y ver el blueprint antes de comprar.",
    label: "Blueprint",
    tier: "blueprint",
  },
  {
    accent: "from-[rgba(37,99,235,0.16)] via-[rgba(255,255,255,0.98)] to-white",
    bullets: [
      "Descarga del Blueprint Profesional.",
      "Arquitectura, alcance, reglas, integraciones y roadmap.",
      "Estimacion de esfuerzo, tiempo y costo.",
    ],
    cta: "Upgrade a Pro",
    description: "Convierte el analisis en un documento profesional listo para decision, compra o implementacion.",
    label: "Blueprint Profesional",
    tier: "blueprint_pro",
  },
  {
    accent: "from-[rgba(124,58,237,0.18)] via-[rgba(255,255,255,0.98)] to-white",
    bullets: [
      "Incluye todo lo del Blueprint Profesional.",
      "Construction Pack, prompts, tests y configuraciones.",
      "Paquete tecnico listo para construir sin redefinir la arquitectura.",
    ],
    cta: "Upgrade a ACP",
    description: "La capa premium para equipos de implementacion y plataformas agenticas que necesitan el paquete completo.",
    label: "ACP Premium",
    tier: "acp",
  },
];

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
  onUpgrade,
  title = "Modelo comercial",
}: {
  access?: SessionCommercialAccess | null;
  actionState?: CommercialTier | null;
  description?: string;
  onUpgrade?: (tier: CommercialTier) => void;
  title?: string;
}) {
  const resolvedAccess = resolveCommercialAccess(access);

  return (
    <Panel className="overflow-hidden border-[rgba(15,23,42,0.08)] p-0">
      <div className="border-b border-[var(--border-default)] bg-[linear-gradient(135deg,rgba(11,18,32,0.98),rgba(32,44,68,0.96))] px-6 py-6 text-white">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={badgeToneForTier(resolvedAccess.tier)}>{resolvedAccess.tier_label}</Badge>
          <span className="text-[12px] uppercase tracking-[0.22em] text-white/62">SaaS ladder</span>
        </div>
        <p className="mt-4 text-[26px] font-semibold">{title}</p>
        <p className="mt-2 max-w-[860px] text-[14px] leading-7 text-white/76">
          {description ?? resolvedAccess.upgrade_message}
        </p>
      </div>

      <div className="grid gap-4 p-6 xl:grid-cols-3">
        {TIER_DEFINITIONS.map((definition) => {
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
                  {isCurrent ? "Actual" : isUnlocked ? "Incluido" : "Locked"}
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
                    {definition.cta}
                  </AppButton>
                ) : (
                  <AppButton disabled>{isCurrent ? "Plan actual" : "Ya incluido"}</AppButton>
                )}
              </div>
            </Panel>
          );
        })}
      </div>
    </Panel>
  );
}
