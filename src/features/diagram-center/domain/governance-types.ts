export type DiagramGovernanceEntry = {
  diagram_key: string;
  access_level: string;
  active: boolean;
  category: string;
  default_generation_state: string;
  description: string;
  diagram_surface: string;
  enabled: boolean;
  enabled_from_stage: string;
  formats: {
    available?: string[];
    preferred?: string;
  };
  generation_enabled: boolean;
  notation: string;
  notes: string;
  preview_mode: string;
  product_scope: string[];
  prompt_override: Record<string, unknown>;
  prompt_spec: {
    diagram_key: string;
    exclusions: string[];
    forbidden_mixes?: string[];
    generation_permissions?: Record<string, unknown>;
    inherits_from?: string[];
    layout_guidance?: Record<string, unknown>;
    notation: string;
    objective: string;
    output_contract: string;
    presentation_contract?: string;
    quality_gates: string[];
    renderer_key?: string;
    required_inputs: string[];
    semantic_rules: string[];
    source_contract?: string;
    standard?: string;
    transform_rules?: string[];
    validator_key?: string;
    version: string;
  };
  prompt_spec_version: string;
  prompt_status: "draft" | "active" | "retired";
  portable_paths: string[];
  required_tier: string;
  source_artifact_keys: string[];
  title: string;
  updated_at: string | null;
};

export type DiagramGovernanceAuditEntry = {
  id: string;
  diagram_key: string;
  action: string;
  changed_fields: string[];
  actor_user_id: string | null;
  reason: string;
  created_at: string;
};

export type DiagramGovernanceJob = {
  id: string;
  project_id: string;
  diagram_key: string;
  status: "queued" | "generating" | "available" | "error" | "updating";
  provider_key: string;
  model_name: string;
  prompt_spec_version: string;
  error_code: string;
  requested_at: string;
};

export type DiagramGovernanceOverview = {
  contract_version: "diagram-governance-overview.v1";
  active_provider: string;
  provider_mode: string;
  model_name: string;
  provider_configured: boolean;
  registry_version: string;
  prompt_spec_version: string;
  job_counts: Record<string, number>;
  total_versions: number;
  average_quality_score: number;
  recent_jobs: DiagramGovernanceJob[];
  recent_audit: DiagramGovernanceAuditEntry[];
};

export type DiagramGovernanceResponse = {
  contract_version: "diagram-governance.v1";
  entries: DiagramGovernanceEntry[];
};

export type DiagramGovernanceUpdate = {
  enabled: boolean;
  generation_enabled: boolean;
  notes: string;
  preview_mode_override: string;
  prompt_override: Record<string, unknown>;
  prompt_status: "draft" | "active" | "retired";
  required_tier_override: string;
};
