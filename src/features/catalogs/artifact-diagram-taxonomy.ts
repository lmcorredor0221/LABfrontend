import type { CommercialTier } from "@/features/sessions/types";

export type TaxonomyProduct = "blueprint" | "acp" | "shared";
export type DiagramProductScope = Exclude<TaxonomyProduct, "shared">;
export type TaxonomyAccessLevel = "sample" | "view_only" | "downloadable" | "premium" | "restricted";
export type TaxonomyStage = "discover" | "define" | "design" | "tools" | "memory" | "estimate" | "validate" | "package";
export type ArtifactCategory =
  | "functional"
  | "technical"
  | "commercial"
  | "diagram"
  | "prompt"
  | "tool"
  | "memory"
  | "contract"
  | "estimation"
  | "package"
  | "lineage";
export type DiagramCategory =
  | "architecture"
  | "orchestration"
  | "tools"
  | "memory"
  | "flow"
  | "knowledge"
  | "data"
  | "security"
  | "deployment"
  | "decisions"
  | "integrations"
  | "evaluation"
  | "lineage";

export type DiagramSurface = "agent_design" | "agent_runtime" | "implementation_guide" | "builder_provenance";
export type DiagramGenerationState = "generated" | "planned" | "pending_generation" | "not_generated";
export type DiagramAccessState =
  | "unlocked"
  | "sample"
  | "locked_blueprint"
  | "locked_acp"
  | "stage_locked"
  | "not_generated";

export type ArtifactTaxonomyEntry = {
  access_level: TaxonomyAccessLevel;
  acp_download: boolean;
  artifact_key: string;
  blueprint_download: boolean;
  canonical_paths: string[];
  category: ArtifactCategory;
  description: string;
  formats: string[];
  internal_lean_refs_allowed: boolean;
  portable_scope: "agent_specification" | "construction_package" | "commercial_value" | "producer_lineage";
  product_owner: TaxonomyProduct;
  source_kind:
    | "approved_journey_artifact"
    | "generated_blueprint_export"
    | "generated_acp_file"
    | "generated_diagram"
    | "commercial_summary"
    | "producer_provenance";
  stage_owner: TaxonomyStage;
  title: string;
};

export type DiagramTaxonomyEntry = {
  access_level: TaxonomyAccessLevel;
  category: DiagramCategory;
  contains_internal_lean_model: boolean;
  default_generation_state: DiagramGenerationState;
  description: string;
  diagram_key: string;
  diagram_surface: DiagramSurface;
  enabled_from_stage: TaxonomyStage;
  formats: {
    available: string[];
    preferred: string;
  };
  is_active: boolean;
  portable_paths: string[];
  product_scope: DiagramProductScope[];
  required_tier: CommercialTier;
  sort_order: number;
  source_artifact_keys: string[];
  title: string;
  upsell?: {
    locked_acp_message?: string;
    locked_blueprint_message?: string;
    stage_locked_message?: string;
  };
};

export type ArtifactDiagramTaxonomyManifest = {
  access_levels: TaxonomyAccessLevel[];
  artifact_categories: ArtifactCategory[];
  artifact_entries: ArtifactTaxonomyEntry[];
  diagram_categories: DiagramCategory[];
  diagram_entries: DiagramTaxonomyEntry[];
  generated_at: string;
  products: TaxonomyProduct[];
  schema_version: "artifact-diagram-taxonomy.v1";
  validation_rules: string[];
};

export const TAXONOMY_STAGE_ORDER: readonly TaxonomyStage[] = [
  "discover",
  "define",
  "design",
  "tools",
  "memory",
  "estimate",
  "validate",
  "package",
] as const;

export const TAXONOMY_TIER_RANK: Record<CommercialTier, number> = {
  blueprint: 1,
  blueprint_pro: 2,
  acp: 3,
};

export function getTaxonomyStageIndex(stage: TaxonomyStage) {
  return TAXONOMY_STAGE_ORDER.indexOf(stage);
}

export function hasReachedTaxonomyStage(currentStage: TaxonomyStage, requiredStage: TaxonomyStage) {
  return getTaxonomyStageIndex(currentStage) >= getTaxonomyStageIndex(requiredStage);
}

export function formatDiagramProductScope(scope: readonly DiagramProductScope[]) {
  if (scope.includes("blueprint") && scope.includes("acp")) {
    return "Blueprint + ACP";
  }
  return scope.includes("acp") ? "ACP" : "Blueprint";
}

export function resolveDiagramAccessState(
  diagram: Pick<
    DiagramTaxonomyEntry,
    "access_level" | "default_generation_state" | "enabled_from_stage" | "product_scope" | "required_tier"
  >,
  options: {
    currentStage: TaxonomyStage;
    tier: CommercialTier;
  },
): DiagramAccessState {
  if (!hasReachedTaxonomyStage(options.currentStage, diagram.enabled_from_stage)) {
    return "stage_locked";
  }

  if (diagram.default_generation_state !== "generated") {
    return "not_generated";
  }

  if (diagram.access_level === "sample" && options.tier === "blueprint") {
    return "sample";
  }

  if (TAXONOMY_TIER_RANK[options.tier] >= TAXONOMY_TIER_RANK[diagram.required_tier]) {
    return "unlocked";
  }

  return diagram.required_tier === "acp" ? "locked_acp" : "locked_blueprint";
}

export function isBuilderProvenanceDiagram(diagram: Pick<DiagramTaxonomyEntry, "diagram_surface">) {
  return diagram.diagram_surface === "builder_provenance";
}
