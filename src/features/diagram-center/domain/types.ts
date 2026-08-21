export type DiagramAccessState = "available" | "preview" | "locked" | "stage_locked" | "disabled";
export type DiagramGenerationState = "pending" | "queued" | "generating" | "available" | "error" | "updating";
export type DiagramGenerationReason = "user_request" | "regenerate" | "layout_upgrade";

export type DiagramPolicyDecision = {
  access_state: DiagramAccessState;
  can_compare: boolean;
  can_download: boolean;
  can_generate: boolean;
  can_regenerate: boolean;
  can_view: boolean;
  cta_label: string;
  reason: string;
  reason_code: string;
  required_tier: string;
  visible: boolean;
};

export type DiagramVersionSummary = {
  created_at: string;
  id: string;
  model_name: string;
  prompt_spec_version: string;
  provider_key: string;
  quality_score: number;
  state: string;
  version_number: number;
};

export type DiagramCatalogItem = {
  access: DiagramPolicyDecision;
  available_actions: string[];
  benefit: string;
  category: string;
  complexity: "basic" | "intermediate" | "advanced";
  current_version: DiagramVersionSummary | null;
  description: string;
  family: string;
  generation_state: DiagramGenerationState;
  key: string;
  layout_upgrade_reason: string;
  needs_layout_upgrade: boolean;
  notation: string;
  presentation_contract?: string;
  products: string[];
  required_tier: string;
  renderer_key?: string;
  source_contract?: string;
  stage: string;
  standard?: string;
  title: string;
  type: string;
  updated_at: string | null;
  validator_key?: string;
};

export type DiagramCatalog = {
  available_count: number;
  contract_version: "diagram-catalog.v3";
  current_stage: string;
  entries: DiagramCatalogItem[];
  locked_count: number;
  preview_count: number;
  project_id: string;
  provider_key: string;
  tier: string;
  total_count: number;
  workspace_id: string;
};

export type DiagramNode = {
  description: string;
  group_id: string | null;
  id: string;
  kind: string;
  label: string;
  metadata: Record<string, unknown>;
  source_refs: string[];
};

export type DiagramEdge = {
  id: string;
  kind: string;
  label: string;
  order: number | null;
  source: string;
  source_refs: string[];
  target: string;
};

export type DiagramLane = {
  description: string;
  id: string;
  label: string;
  metadata: Record<string, unknown>;
  source_refs: string[];
};

export type DiagramPool = {
  description: string;
  id: string;
  label: string;
  lanes: DiagramLane[];
  metadata: Record<string, unknown>;
  source_refs: string[];
};

export type DiagramModel = {
  assumptions: string[];
  description: string;
  diagram_key: string;
  direction: string;
  edges: DiagramEdge[];
  groups: Array<{ id: string; label: string; kind: string; parent_id: string | null; description: string }>;
  legend: Array<{ key: string; label: string; description: string }>;
  metadata: Record<string, unknown>;
  nodes: DiagramNode[];
  notation: string;
  pools: DiagramPool[];
  schema_version: "diagram-model.v1";
  source_refs: string[];
  title: string;
};

export type DiagramQualityReport = {
  checks: Record<string, boolean>;
  errors: string[];
  score: number;
  valid: boolean;
  warnings: string[];
};

export type DiagramDetail = {
  contract_version: "diagram-detail.v3";
  item: DiagramCatalogItem;
  model: DiagramModel | null;
  project_id: string;
  quality: DiagramQualityReport | null;
  renderings: Record<string, string>;
  versions: DiagramVersionSummary[];
};

export type DiagramGenerationJob = {
  completed_at: string | null;
  contract_version: "diagram-generation-job.v1";
  diagram_key: string;
  error_code: string;
  error_message: string;
  id: string;
  model_name: string;
  project_id: string;
  provider_key: string;
  requested_at: string;
  started_at: string | null;
  status: "queued" | "generating" | "available" | "error" | "updating";
  version_id: string | null;
};

export type DiagramVersionComparison = {
  added_nodes: DiagramNode[];
  base_version_id: string;
  changed_nodes: Array<{ before: DiagramNode; after: DiagramNode }>;
  contract_version: "diagram-version-comparison.v1";
  diagram_key: string;
  removed_nodes: DiagramNode[];
  target_version_id: string;
};
