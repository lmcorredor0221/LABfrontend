import {
  formatDiagramProductScope,
  isBuilderProvenanceDiagram,
  resolveDiagramAccessState,
  type DiagramTaxonomyEntry,
} from "@/features/catalogs/artifact-diagram-taxonomy";

const baseDiagram: DiagramTaxonomyEntry = {
  access_level: "downloadable",
  category: "orchestration",
  contains_internal_lean_model: false,
  default_generation_state: "generated",
  description: "Mapa de orquestacion.",
  diagram_key: "agent_orchestration",
  diagram_surface: "agent_runtime",
  enabled_from_stage: "design",
  formats: {
    available: ["svg", "mermaid"],
    preferred: "svg",
  },
  is_active: true,
  portable_paths: ["Blueprint/diagrams/agent-orchestration.svg"],
  product_scope: ["blueprint", "acp"],
  required_tier: "blueprint_pro",
  sort_order: 1,
  source_artifact_keys: ["blueprint.architecture_spec"],
  title: "Orquestacion agentica",
};

describe("artifact diagram taxonomy helpers", () => {
  it("formats diagram product scope for commercial labels", () => {
    expect(formatDiagramProductScope(["blueprint"])).toBe("Blueprint");
    expect(formatDiagramProductScope(["acp"])).toBe("ACP");
    expect(formatDiagramProductScope(["blueprint", "acp"])).toBe("Blueprint + ACP");
  });

  it("resolves sample, locked and unlocked states", () => {
    expect(
      resolveDiagramAccessState(
        {
          ...baseDiagram,
          access_level: "sample",
          required_tier: "blueprint",
        },
        {
          currentStage: "estimate",
          tier: "blueprint",
        },
      ),
    ).toBe("sample");

    expect(
      resolveDiagramAccessState(baseDiagram, {
        currentStage: "estimate",
        tier: "blueprint",
      }),
    ).toBe("locked_blueprint");

    expect(
      resolveDiagramAccessState(baseDiagram, {
        currentStage: "estimate",
        tier: "blueprint_pro",
      }),
    ).toBe("unlocked");
  });

  it("distinguishes ACP, stage and generation locks", () => {
    expect(
      resolveDiagramAccessState(
        {
          ...baseDiagram,
          product_scope: ["acp"],
          required_tier: "acp",
        },
        {
          currentStage: "estimate",
          tier: "blueprint_pro",
        },
      ),
    ).toBe("locked_acp");

    expect(
      resolveDiagramAccessState(
        {
          ...baseDiagram,
          enabled_from_stage: "validate",
        },
        {
          currentStage: "estimate",
          tier: "acp",
        },
      ),
    ).toBe("stage_locked");

    expect(
      resolveDiagramAccessState(
        {
          ...baseDiagram,
          default_generation_state: "planned",
        },
        {
          currentStage: "estimate",
          tier: "acp",
        },
      ),
    ).toBe("not_generated");
  });

  it("marks builder provenance diagrams as separate from agent runtime diagrams", () => {
    expect(isBuilderProvenanceDiagram(baseDiagram)).toBe(false);
    expect(isBuilderProvenanceDiagram({ diagram_surface: "builder_provenance" })).toBe(true);
  });
});
