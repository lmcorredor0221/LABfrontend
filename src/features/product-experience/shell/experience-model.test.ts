import {
  getProductDisplayStageForSection,
  getProductExperienceStateHref,
  getProductFetchStageForSection,
  getStageState,
} from "@/features/product-experience/shell/experience-model";

describe("experience-model canonical product states", () => {
  it("keeps the operational fetch stage separate from the visible ACP state", () => {
    expect(getProductFetchStageForSection("acp")).toBe("validate");
    expect(getProductDisplayStageForSection("acp")).toBe("acp_prep");
    expect(getProductDisplayStageForSection("acp_overview")).toBe("acp_access_requested");
  });

  it("maps Blueprint Pro product sections to their canonical visible states", () => {
    expect(getProductFetchStageForSection("blueprint_pro")).toBe("estimate");
    expect(getProductDisplayStageForSection("blueprint_pro")).toBe("blueprint_pro_active");
    expect(getProductDisplayStageForSection("blueprint_pro_overview")).toBe("blueprint_pro_access_requested");
  });

  it("builds first-class hrefs for premium request, workspace, and package states", () => {
    expect(getProductExperienceStateHref("session-uxa", "blueprint_pro_access_requested")).toBe(
      "/projects/session-uxa/blueprint/pro/overview",
    );
    expect(getProductExperienceStateHref("session-uxa", "acp_prep")).toBe("/projects/session-uxa/acp");
    expect(getProductExperienceStateHref("session-uxa", "validate")).toBe(
      "/projects/session-uxa/acp?acp_tab=validate",
    );
    expect(getProductExperienceStateHref("session-uxa", "completed")).toBe(
      "/projects/session-uxa/acp?acp_tab=package",
    );
  });

  it("anchors premium product states to the final LEAN work stage for shell progress", () => {
    expect(getStageState("estimate", "blueprint_pro_active")).toBe("active");
    expect(getStageState("memory", "acp_prep")).toBe("done");
    expect(getStageState("estimate", "completed")).toBe("active");
  });
});
