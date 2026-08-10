import {
  getProjectDiagramsRoute,
  getProjectProductRoute,
  getProjectRoute,
  parseProjectRoute,
  resolveProjectStage,
} from "@/core/routing/routes";

describe("project routes", () => {
  it("builds canonical routes with optional section query", () => {
    expect(getProjectRoute("session-1", "validate", { section: "governance" })).toBe(
      "/projects/session-1/work/validate?section=governance",
    );
    expect(getProjectRoute("session-1", "package")).toBe("/projects/session-1/work/package");
    expect(getProjectDiagramsRoute("session-1")).toBe("/projects/session-1/diagrams");
    expect(getProjectProductRoute("session-1", "blueprint")).toBe("/projects/session-1/blueprint");
    expect(getProjectProductRoute("session-1", "blueprint_pro")).toBe("/projects/session-1/blueprint/pro");
    expect(getProjectProductRoute("session-1", "acp")).toBe("/projects/session-1/acp");
  });

  it("normalizes legacy aliases to canonical stages", () => {
    expect(resolveProjectStage("evaluate", { sessionId: "session-1" })).toEqual({
      isLegacyAlias: true,
      redirectPath: "/projects/session-1/work/validate?section=evaluation",
      section: "evaluation",
      stage: "validate",
    });
    expect(resolveProjectStage("security", { sessionId: "session-1" })).toEqual({
      isLegacyAlias: true,
      redirectPath: "/projects/session-1/work/validate?section=governance",
      section: "governance",
      stage: "validate",
    });
    expect(resolveProjectStage("build", { sessionId: "session-1" })).toEqual({
      isLegacyAlias: true,
      redirectPath: "/projects/session-1/work/package",
      section: null,
      stage: "package",
    });
    expect(resolveProjectStage("operate", { sessionId: "session-1" })).toEqual({
      isLegacyAlias: true,
      redirectPath: "/projects/session-1/work/package?section=summary",
      section: "summary",
      stage: "package",
    });
  });

  it("parses project routes and canonicalizes legacy stage segments", () => {
    expect(parseProjectRoute("/projects/session-1/evaluate")).toEqual({
      sessionId: "session-1",
      stage: "validate",
    });
    expect(parseProjectRoute("/projects/session-1/package")).toEqual({
      sessionId: "session-1",
      stage: "package",
    });
    expect(parseProjectRoute("/projects/session-1/diagrams")).toEqual({
      sessionId: "session-1",
      stage: "discover",
    });
    expect(parseProjectRoute("/monitoring")).toBeNull();
  });
});
