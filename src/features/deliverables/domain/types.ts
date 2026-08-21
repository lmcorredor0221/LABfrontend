export type CommercialTier = "blueprint" | "blueprint_pro" | "acp";

export type DeliverableType =
  | "artifact"
  | "diagram"
  | "document"
  | "contract"
  | "prompt"
  | "test"
  | "package"
  | "lineage";

export type DeliverableGenerationMode =
  | "deterministic"
  | "llm_supported"
  | "llm_required"
  | "llm_with_deterministic_fallback"
  | "manual_review_required";

export type DeliverablePromptStatus = "active" | "draft" | "deprecated" | "paused" | "needs_review";

export type DeliverableFormats = {
  preferred: string;
  available: string[];
};

export type DeliverableRegistryEntry = {
  deliverable_key: string;
  title: string;
  description: string;
  deliverable_type: DeliverableType;
  category: string;
  stage: string;
  enabled_from_stage: string;
  product_scope: Array<"blueprint" | "blueprint_pro" | "acp">;
  required_tier: CommercialTier;
  access_level: "sample" | "view_only" | "downloadable" | "premium" | "restricted";
  formats: DeliverableFormats;
  generation_mode: DeliverableGenerationMode;
  prompt_policy: {
    prompt_template_key: string;
    prompt_status: DeliverablePromptStatus;
    prompt_version: string;
    schema_contract: string;
    validator_key: string;
    fallback_policy: string;
    max_iterations: number;
  };
  context_policy?: {
    short_term_refs: string[];
    long_term_collections: string[];
    max_context_tokens: number;
    retrieval_strategy: string;
  };
  quality_policy: {
    schema_contract: string;
    validator_key: string;
    minimum_score: number;
    checks: string[];
  };
  dependency_policy: {
    depends_on: string[];
    invalidates_on_change: string[];
  };
  canonical_paths: string[];
  portable_paths: string[];
  exportable: boolean;
  blueprint_download: boolean;
  acp_download: boolean;
  sort_order: number;
  active: boolean;
};

export type DeliverablePolicyDecision = {
  contract_version: "deliverable-policy-decision.v1";
  visible: boolean;
  access_state:
    | "available"
    | "preview"
    | "locked"
    | "stage_locked"
    | "disabled"
    | "not_generated"
    | "stale"
    | "quality_failed";
  can_view: boolean;
  can_generate: boolean;
  can_regenerate: boolean;
  can_download: boolean;
  can_compare: boolean;
  can_edit_prompt: boolean;
  reason_code: string;
  reason: string;
  cta_label: string;
  required_tier: CommercialTier;
  effective_prompt_status: string;
  preview_mode: string;
};

export type DeliverableGovernanceEntry = {
  deliverable_key: string;
  title: string;
  description: string;
  deliverable_type: DeliverableType;
  category: string;
  stage: string;
  enabled_from_stage: string;
  product_scope: string[];
  access_level: string;
  formats: DeliverableFormats;
  generation_mode: DeliverableGenerationMode;
  prompt_policy: DeliverableRegistryEntry["prompt_policy"];
  context_policy: NonNullable<DeliverableRegistryEntry["context_policy"]>;
  quality_policy: DeliverableRegistryEntry["quality_policy"];
  dependency_policy: DeliverableRegistryEntry["dependency_policy"];
  access_policy: {
    preview_mode: "full" | "limited" | "none";
    sample_enabled: boolean;
    content_protection: {
      disable_context_menu: boolean;
      disable_copy: boolean;
      disable_download: boolean;
    };
  };
  canonical_paths: string[];
  portable_paths: string[];
  exportable: boolean;
  blueprint_download: boolean;
  acp_download: boolean;
  active: boolean;
  scope_key: string;
  workspace_id: string | null;
  enabled: boolean;
  generation_enabled: boolean;
  required_tier: CommercialTier;
  preview_mode: string;
  prompt_status: DeliverablePromptStatus;
  prompt_override: Record<string, unknown>;
  notes: string;
  updated_at: string | null;
};

export type DeliverableGovernanceAuditEntry = {
  id: string;
  deliverable_key: string;
  scope_key: string;
  action: string;
  changed_fields: string[];
  actor_user_id: string | null;
  reason: string;
  created_at: string;
};

export type DeliverableGovernanceResponse = {
  contract_version: "deliverable-governance.v1";
  entries: DeliverableGovernanceEntry[];
};

export type DeliverableQualitySnapshotSummaryEntry = {
  id: string;
  workspace_id: string;
  session_id: string;
  deliverable_key: string;
  title: string;
  deliverable_type: string;
  stage: string;
  product_scope: string[];
  version_ref: string;
  state: string;
  score: number;
  errors_count: number;
  warnings_count: number;
  created_at: string;
};

export type DeliverableQualitySummary = {
  total_snapshots: number;
  average_score: number;
  by_state: Record<string, number>;
  recent_snapshots: DeliverableQualitySnapshotSummaryEntry[];
};

export type DeliverableGovernanceOverview = {
  contract_version: "deliverable-governance-overview.v1";
  registry_version: string;
  total_entries: number;
  active_entries: number;
  governed_entries: number;
  by_type: Record<string, number>;
  by_stage: Record<string, number>;
  by_access_state: Record<string, number>;
  by_prompt_status: Record<string, number>;
  quality_summary: DeliverableQualitySummary;
  recent_audit: DeliverableGovernanceAuditEntry[];
};

export type DeliverableGovernanceUpdate = {
  enabled: boolean;
  generation_enabled: boolean;
  required_tier_override: string;
  preview_mode_override: string;
  prompt_status: DeliverablePromptStatus;
  prompt_override: Record<string, unknown>;
  notes: string;
};

export type DeliverableCatalogItem = {
  key: string;
  title: string;
  description: string;
  deliverable_type: DeliverableType;
  category: string;
  stage: string;
  enabled_from_stage: string;
  product_scope: string[];
  required_tier: CommercialTier;
  access_level: string;
  generation_mode: DeliverableGenerationMode;
  formats: DeliverableFormats;
  context_policy: {
    long_term_collections: string[];
    max_context_tokens: number;
    retrieval_strategy: string;
    short_term_refs: string[];
  };
  exportable: boolean;
  blueprint_download: boolean;
  acp_download: boolean;
  sort_order: number;
  access: DeliverablePolicyDecision;
};

export type DeliverableCatalogResponse = {
  contract_version: "deliverable-catalog-response.v1";
  registry_version: string;
  current_stage: string;
  tier: CommercialTier;
  entries: DeliverableCatalogItem[];
};

export type DeliverableDetailResponse = {
  contract_version: "deliverable-detail.v1";
  entry: DeliverableRegistryEntry;
  access: DeliverablePolicyDecision;
  governance: DeliverableGovernanceEntry;
};

export type DeliverablePromptVersionEntry = {
  id: string | null;
  version: string;
  status: string;
  prompt_template_key: string;
  schema_contract: string;
  validator_key: string;
  fallback_policy: string;
  created_by_user_id: string | null;
  created_at: string | null;
};

export type DeliverablePromptResponse = {
  contract_version: "deliverable-prompt.v1";
  deliverable_key: string;
  scope_key: string;
  workspace_id: string | null;
  prompt_template_key: string;
  prompt_status: DeliverablePromptStatus;
  prompt_version: string;
  prompt_body: string;
  schema_contract: string;
  validator_key: string;
  fallback_policy: string;
  max_iterations: number;
  prompt_override: Record<string, unknown>;
  versions: DeliverablePromptVersionEntry[];
};

export type DeliverablePromptUpdate = {
  prompt_status: DeliverablePromptStatus;
  prompt_body: string;
  schema_contract: string;
  validator_key: string;
  fallback_policy: string;
  version: string;
  change_reason: string;
  metadata: Record<string, unknown>;
};

export type DeliverablePromptValidationRequest = {
  prompt_body: string;
  schema_contract: string;
  validator_key: string;
  fallback_policy: string;
};

export type DeliverablePromptValidationResponse = {
  contract_version: "deliverable-prompt-validation.v1";
  valid: boolean;
  errors: string[];
  warnings: string[];
  required_schema_contract: string;
  required_validator_key: string;
};
