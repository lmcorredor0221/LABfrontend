import type { FeatureFlagEntry } from "@/features/sessions/session-contracts";

export const PRODUCT_EXPERIENCE_V2_FLAG_KEY = "product_experience_v2";
export const ATTENTION_V2_FLAG_KEY = "attention_v2";
export const PRODUCT_EXPERIENCE_V2_GATE_ENV = "NEXT_PUBLIC_PRODUCT_EXPERIENCE_V2_GATE";
export const PRODUCT_EXPERIENCE_ROLLOUT_PERCENT_ENV = "NEXT_PUBLIC_PRODUCT_EXPERIENCE_ROLLOUT_PERCENT";
export const PRODUCT_EXPERIENCE_ROLLBACK_ENV = "NEXT_PUBLIC_PRODUCT_EXPERIENCE_ROLLBACK";

export const BACKEND_COMPATIBILITY_FLAG_KEYS = [ATTENTION_V2_FLAG_KEY] as const;

export type BackendCompatibilityFlagKey = (typeof BACKEND_COMPATIBILITY_FLAG_KEYS)[number];
export type ProductFrontendExperience = "product_experience_v2";
export type WorkspaceFeatureFlag = Pick<FeatureFlagEntry, "description" | "enabled" | "key" | "stage_hint">;

export type ProductExperienceResolutionInput = {
  integralGateEnabled?: boolean;
  rollbackEnabled?: boolean;
  rolloutPercent?: number | string | null;
  workspaceId?: string | null;
  workspaceFlags?: WorkspaceFeatureFlag[] | null;
};

export type ProductExperienceCutoverReason =
  | "legacy_removed"
  | "enabled";

export type ProductExperienceCutoverDecision = {
  cohortPercent: number;
  experience: ProductFrontendExperience;
  integralGateEnabled: boolean;
  reason: ProductExperienceCutoverReason;
  rollbackEnabled: boolean;
  rolloutPercent: number;
  workspaceAllowsV2: boolean;
  workspaceId: string | null;
};

export type FeatureFlagBoundaryViolation = {
  flagKey: string;
  reason: string;
};

const LEAN_STAGE_TOKENS = ["discover", "define", "design", "tools", "memory", "estimate", "validate", "package"];
const VISUAL_FRAGMENT_TOKENS = ["ui", "screen", "page", "view", "layout", "rail", "tab", "tabs", "component", "shell"];

function normalizeFlagKey(value: string) {
  return value.trim().toLowerCase();
}

export function parsePublicBooleanFlag(rawValue: string | boolean | null | undefined, fallback = false) {
  if (typeof rawValue === "boolean") {
    return rawValue;
  }

  if (rawValue === undefined || rawValue === null || rawValue.trim() === "") {
    return fallback;
  }

  return ["1", "true", "yes", "on", "enabled"].includes(rawValue.trim().toLowerCase());
}

export function isIntegralProductExperienceGateEnabled(rawValue = process.env.NEXT_PUBLIC_PRODUCT_EXPERIENCE_V2_GATE) {
  return parsePublicBooleanFlag(rawValue, false);
}

export function parsePublicPercentFlag(rawValue: string | number | null | undefined, fallback = 100) {
  const numericValue =
    typeof rawValue === "number"
      ? rawValue
      : rawValue === undefined || rawValue === null || rawValue.trim() === ""
        ? fallback
        : Number(rawValue);

  if (!Number.isFinite(numericValue)) {
    return Math.max(0, Math.min(100, fallback));
  }

  return Math.max(0, Math.min(100, Math.round(numericValue)));
}

export function isProductExperienceRollbackEnabled(rawValue = process.env.NEXT_PUBLIC_PRODUCT_EXPERIENCE_ROLLBACK) {
  return parsePublicBooleanFlag(rawValue, false);
}

export function getProductExperienceRolloutPercent(rawValue = process.env.NEXT_PUBLIC_PRODUCT_EXPERIENCE_ROLLOUT_PERCENT) {
  return parsePublicPercentFlag(rawValue, 100);
}

export function getStableWorkspaceCohortPercent(workspaceId: string | null | undefined) {
  if (!workspaceId?.trim()) {
    return 0;
  }

  let hash = 0;
  for (const character of workspaceId.trim()) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return hash % 100;
}

export function findWorkspaceFeatureFlag(flags: WorkspaceFeatureFlag[] | null | undefined, flagKey: string) {
  const normalizedKey = normalizeFlagKey(flagKey);
  return flags?.find((flag) => normalizeFlagKey(flag.key) === normalizedKey) ?? null;
}

export function isWorkspaceFeatureFlagEnabled(
  flags: WorkspaceFeatureFlag[] | null | undefined,
  flagKey: string,
  fallback = false,
) {
  return findWorkspaceFeatureFlag(flags, flagKey)?.enabled ?? fallback;
}

export function resolveProductFrontendExperience({
  integralGateEnabled = isIntegralProductExperienceGateEnabled(),
  rollbackEnabled = isProductExperienceRollbackEnabled(),
  rolloutPercent = getProductExperienceRolloutPercent(),
  workspaceId,
  workspaceFlags,
}: ProductExperienceResolutionInput = {}): ProductFrontendExperience {
  void resolveProductExperienceCutoverDecision({
    integralGateEnabled,
    rollbackEnabled,
    rolloutPercent,
    workspaceFlags,
    workspaceId,
  });

  return "product_experience_v2";
}

export function resolveProductExperienceCutoverDecision({
  integralGateEnabled = isIntegralProductExperienceGateEnabled(),
  rollbackEnabled = isProductExperienceRollbackEnabled(),
  rolloutPercent = getProductExperienceRolloutPercent(),
  workspaceId,
  workspaceFlags,
}: ProductExperienceResolutionInput = {}): ProductExperienceCutoverDecision {
  const workspaceAllowsV2 = isWorkspaceFeatureFlagEnabled(
    workspaceFlags,
    PRODUCT_EXPERIENCE_V2_FLAG_KEY,
    integralGateEnabled,
  );
  const safeRolloutPercent = parsePublicPercentFlag(rolloutPercent, 100);
  const normalizedWorkspaceId = workspaceId?.trim() || null;
  const cohortPercent = getStableWorkspaceCohortPercent(normalizedWorkspaceId);
  const inRollout = safeRolloutPercent >= 100 || (Boolean(normalizedWorkspaceId) && cohortPercent < safeRolloutPercent);
  const wouldHaveUsedLegacyBeforeDeprecation = rollbackEnabled || !integralGateEnabled || !workspaceAllowsV2 || !inRollout;

  return {
    cohortPercent,
    experience: "product_experience_v2",
    integralGateEnabled,
    reason: wouldHaveUsedLegacyBeforeDeprecation ? "legacy_removed" : "enabled",
    rollbackEnabled,
    rolloutPercent: safeRolloutPercent,
    workspaceAllowsV2,
    workspaceId: normalizedWorkspaceId,
  };
}

export function isBackendCompatibilityFlagKey(flagKey: string): flagKey is BackendCompatibilityFlagKey {
  return BACKEND_COMPATIBILITY_FLAG_KEYS.includes(normalizeFlagKey(flagKey) as BackendCompatibilityFlagKey);
}

export function isProhibitedVisualFeatureFlagKey(flagKey: string) {
  const normalizedKey = normalizeFlagKey(flagKey);

  if (normalizedKey === PRODUCT_EXPERIENCE_V2_FLAG_KEY || isBackendCompatibilityFlagKey(normalizedKey)) {
    return false;
  }

  const fragments = normalizedKey.split(/[-_:.]+/).filter(Boolean);
  const hasStageToken = fragments.some((fragment) => LEAN_STAGE_TOKENS.includes(fragment));
  const hasVisualToken = fragments.some((fragment) => VISUAL_FRAGMENT_TOKENS.includes(fragment));

  return hasStageToken && hasVisualToken;
}

export function validateFeatureFlagBoundary(flags: WorkspaceFeatureFlag[] | null | undefined): FeatureFlagBoundaryViolation[] {
  return (flags ?? [])
    .filter((flag) => isProhibitedVisualFeatureFlagKey(flag.key))
    .map((flag) => ({
      flagKey: flag.key,
      reason:
        "UXA0 prohibe flags productivos por etapa o componente visual; usa product_experience_v2 como selector integral.",
    }));
}
