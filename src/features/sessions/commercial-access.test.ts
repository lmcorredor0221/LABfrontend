import { describe, expect, it } from "vitest";

import { hasAcpEntitlement, hasBlueprintProEntitlement, resolveDisplayCommercialTier } from "./commercial-access";

describe("commercial access helpers", () => {
  it("uses commercial_access as the authority for premium entitlements", () => {
    expect(
      hasBlueprintProEntitlement({
        commercial_access: undefined,
        session: { commercial_tier: "blueprint_pro" } as never,
      }),
    ).toBe(false);
    expect(
      hasAcpEntitlement({
        commercial_access: undefined,
        session: { commercial_tier: "acp" } as never,
      }),
    ).toBe(false);
  });

  it("recognizes blueprint pro entitlement from the access snapshot", () => {
    expect(
      hasBlueprintProEntitlement({
        commercial_access: {
          can_download_blueprint: true,
          can_export_blueprint_core: false,
          can_export_blueprint_document: false,
          tier: "blueprint",
        } as never,
        session: { commercial_tier: "blueprint" } as never,
      }),
    ).toBe(true);
  });

  it("recognizes acp entitlement from the access snapshot", () => {
    expect(
      hasAcpEntitlement({
        commercial_access: {
          can_build_acp: true,
          can_download_acp: false,
          can_export_acp_zip: false,
          can_export_construction_pack: false,
          tier: "blueprint_pro",
        } as never,
        session: { commercial_tier: "blueprint_pro" } as never,
      }),
    ).toBe(true);
  });

  it("falls back to session.commercial_tier only for display continuity", () => {
    expect(
      resolveDisplayCommercialTier({
        commercial_access: undefined,
        session: { commercial_tier: "acp" } as never,
      }),
    ).toBe("acp");
  });
});
