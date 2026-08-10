import {
  ATTENTION_V2_FLAG_KEY,
  PRODUCT_EXPERIENCE_V2_FLAG_KEY,
  getStableWorkspaceCohortPercent,
  isBackendCompatibilityFlagKey,
  isProhibitedVisualFeatureFlagKey,
  parsePublicBooleanFlag,
  parsePublicPercentFlag,
  resolveProductExperienceCutoverDecision,
  resolveProductFrontendExperience,
  validateFeatureFlagBoundary,
  type WorkspaceFeatureFlag,
} from "@/core/config/feature-flags";

function flag(key: string, enabled: boolean): WorkspaceFeatureFlag {
  return {
    description: key,
    enabled,
    key,
    stage_hint: "workspace",
  };
}

describe("UXA0 feature flags", () => {
  it("keeps the new frontend after the legacy experience was physically removed", () => {
    expect(
      resolveProductFrontendExperience({
        integralGateEnabled: false,
        workspaceFlags: [flag(PRODUCT_EXPERIENCE_V2_FLAG_KEY, true)],
      }),
    ).toBe("product_experience_v2");

    expect(
      resolveProductFrontendExperience({
        integralGateEnabled: true,
        workspaceFlags: [flag(PRODUCT_EXPERIENCE_V2_FLAG_KEY, false)],
      }),
    ).toBe("product_experience_v2");
  });

  it("opens the new frontend as the only complete experience", () => {
    expect(
      resolveProductFrontendExperience({
        integralGateEnabled: true,
        workspaceFlags: [flag(PRODUCT_EXPERIENCE_V2_FLAG_KEY, true)],
      }),
    ).toBe("product_experience_v2");
  });

  it("uses the integral gate as the safe default when the workspace selector has not been seeded yet", () => {
    expect(
      resolveProductFrontendExperience({
        integralGateEnabled: true,
        workspaceFlags: [],
      }),
    ).toBe("product_experience_v2");

    expect(
      resolveProductFrontendExperience({
        integralGateEnabled: false,
        workspaceFlags: [],
      }),
    ).toBe("product_experience_v2");
  });

  it("records deprecated rollout selectors without reactivating legacy UI", () => {
    const workspaceId = "workspace-uxa12-rollout";
    const cohortPercent = getStableWorkspaceCohortPercent(workspaceId);
    const excludedRollout = Math.max(0, cohortPercent);
    const includedRollout = Math.min(100, cohortPercent + 1);

    expect(
      resolveProductExperienceCutoverDecision({
        integralGateEnabled: true,
        rolloutPercent: excludedRollout,
        workspaceFlags: [flag(PRODUCT_EXPERIENCE_V2_FLAG_KEY, true)],
        workspaceId,
      }),
    ).toMatchObject({
      experience: "product_experience_v2",
      reason: excludedRollout === 100 ? "enabled" : "legacy_removed",
      workspaceId,
    });

    expect(
      resolveProductExperienceCutoverDecision({
        integralGateEnabled: true,
        rolloutPercent: includedRollout,
        workspaceFlags: [flag(PRODUCT_EXPERIENCE_V2_FLAG_KEY, true)],
        workspaceId,
      }),
    ).toMatchObject({
      experience: "product_experience_v2",
      reason: "enabled",
      workspaceId,
    });
  });

  it("does not roll back to the removed legacy workspace experience", () => {
    expect(
      resolveProductExperienceCutoverDecision({
        integralGateEnabled: true,
        rollbackEnabled: true,
        rolloutPercent: 100,
        workspaceFlags: [flag(PRODUCT_EXPERIENCE_V2_FLAG_KEY, true)],
        workspaceId: "workspace-rollback",
      }),
    ).toMatchObject({
      experience: "product_experience_v2",
      reason: "legacy_removed",
      rollbackEnabled: true,
    });
  });

  it("separates backend compatibility flags from the frontend experience selector", () => {
    expect(isBackendCompatibilityFlagKey(ATTENTION_V2_FLAG_KEY)).toBe(true);

    expect(
      resolveProductFrontendExperience({
        integralGateEnabled: false,
        workspaceFlags: [flag(ATTENTION_V2_FLAG_KEY, true)],
      }),
    ).toBe("product_experience_v2");

    expect(
      resolveProductFrontendExperience({
        integralGateEnabled: true,
        workspaceFlags: [flag(ATTENTION_V2_FLAG_KEY, true), flag(PRODUCT_EXPERIENCE_V2_FLAG_KEY, false)],
      }),
    ).toBe("product_experience_v2");
  });

  it("rejects stage or visual-component feature flags without blocking domain capability flags", () => {
    expect(isProhibitedVisualFeatureFlagKey("discover_ui_v2")).toBe(true);
    expect(isProhibitedVisualFeatureFlagKey("tools_component_redesign")).toBe(true);
    expect(isProhibitedVisualFeatureFlagKey("memory_hybrid_define_design_v1")).toBe(false);
    expect(isProhibitedVisualFeatureFlagKey("tool_recommendation_llm_v1")).toBe(false);

    expect(
      validateFeatureFlagBoundary([
        flag("discover_ui_v2", true),
        flag("tool_recommendation_llm_v1", true),
      ]),
    ).toEqual([
      {
        flagKey: "discover_ui_v2",
        reason:
          "UXA0 prohibe flags productivos por etapa o componente visual; usa product_experience_v2 como selector integral.",
      },
    ]);
  });

  it("parses public boolean env flags conservatively", () => {
    expect(parsePublicBooleanFlag(undefined)).toBe(false);
    expect(parsePublicBooleanFlag("true")).toBe(true);
    expect(parsePublicBooleanFlag("0")).toBe(false);
  });

  it("parses rollout percentages defensively", () => {
    expect(parsePublicPercentFlag(undefined)).toBe(100);
    expect(parsePublicPercentFlag("5")).toBe(5);
    expect(parsePublicPercentFlag("250")).toBe(100);
    expect(parsePublicPercentFlag("-10")).toBe(0);
    expect(parsePublicPercentFlag("not-a-number", 25)).toBe(25);
  });
});
