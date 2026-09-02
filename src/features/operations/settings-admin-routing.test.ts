import { describe, expect, it } from "vitest";
import {
  buildSettingsHref,
  parseSettingsRouteState,
} from "@/features/operations/settings-admin-routing";

describe("settings admin routing", () => {
  it("parses canonical Settings query params from a single registry", () => {
    expect(
      parseSettingsRouteState({
        config: "llmRuntime",
        section: "configuration",
        subtab: "providers",
      }),
    ).toEqual({
      configSubTab: "providers",
      configTab: "llmRuntime",
      productGovernanceTab: undefined,
      section: "configuration",
    });
  });

  it("supports legacy aliases without exposing duplicate navigation", () => {
    expect(parseSettingsRouteState({ configTab: "commerce", configSubTab: "hotmart", section: "config" })).toEqual({
      configSubTab: undefined,
      configTab: "commerce",
      productGovernanceTab: undefined,
      section: "configuration",
    });
    expect(parseSettingsRouteState({ section: "product-governance", tab: "components" }).section).toBe(
      "productGovernance",
    );
    expect(parseSettingsRouteState({ configTab: "deliverable", section: "governance" })).toEqual({
      configSubTab: undefined,
      configTab: undefined,
      productGovernanceTab: "components",
      section: "productGovernance",
    });
  });

  it("builds stable deep-links for sections, config tabs and product governance", () => {
    expect(
      buildSettingsHref({
        configSubTab: "secrets",
        configTab: "security",
        section: "configuration",
      }),
    ).toBe("/settings?section=configuration&config=security&subtab=secrets");
    expect(buildSettingsHref({ productGovernanceTab: "diagrams", section: "productGovernance" })).toBe(
      "/settings?section=product-governance&tab=diagrams",
    );
  });
});
