import type { CommercialTier, SessionCommercialAccess, SessionSnapshot } from "@/features/sessions/types";

type SnapshotCommercialAccessCarrier = Pick<SessionSnapshot, "commercial_access" | "session"> | null | undefined;

function normalizeTier(value: unknown): CommercialTier | null {
  const candidate = String(value ?? "").trim().toLowerCase();
  if (candidate === "blueprint" || candidate === "blueprint_pro" || candidate === "acp") {
    return candidate;
  }
  return null;
}

export function getCommercialAccessSnapshot(snapshot: SnapshotCommercialAccessCarrier): SessionCommercialAccess | null {
  return snapshot?.commercial_access ?? null;
}

export function resolveDisplayCommercialTier(
  snapshot: SnapshotCommercialAccessCarrier,
  fallback: CommercialTier = "blueprint",
): CommercialTier {
  return normalizeTier(snapshot?.commercial_access?.tier) ?? normalizeTier(snapshot?.session?.commercial_tier) ?? fallback;
}

export function hasBlueprintProEntitlement(snapshot: SnapshotCommercialAccessCarrier): boolean {
  const access = getCommercialAccessSnapshot(snapshot);
  if (!access) {
    return false;
  }

  return Boolean(
    access.tier === "blueprint_pro" ||
      access.tier === "acp" ||
      access.can_download_blueprint ||
      access.can_export_blueprint_core ||
      access.can_export_blueprint_document,
  );
}

export function hasAcpEntitlement(snapshot: SnapshotCommercialAccessCarrier): boolean {
  const access = getCommercialAccessSnapshot(snapshot);
  if (!access) {
    return false;
  }

  return Boolean(
    access.tier === "acp" ||
      access.can_build_acp ||
      access.can_download_acp ||
      access.can_export_acp_zip ||
      access.can_export_construction_pack,
  );
}
