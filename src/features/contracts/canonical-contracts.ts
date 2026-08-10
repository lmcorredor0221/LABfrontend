import type { ArtifactStatus } from "@/features/sessions/types";
import type { DecisionTraceEntry, PatternCatalogEntry, ReviewState } from "@/features/sessions/session-contracts";

export type CanonicalContractKind =
  | "blueprint-core.v1"
  | "construction-pack.v1"
  | "agent-construction-package.v2"
  | "prompt-pack.v1"
  | "estimation-pack.v1"
  | "test-pack.v1";

export type CanonicalExportReadiness = "ready" | "needs_review" | "blocked";

export const CANONICAL_CONTRACT_VERSIONS = {
  blueprintCore: "blueprint-core.v1",
  constructionPack: "construction-pack.v1",
  agentConstructionPackage: "agent-construction-package.v2",
  promptPack: "prompt-pack.v1",
  estimationPack: "estimation-pack.v1",
  testPack: "test-pack.v1",
} as const;

export const SPECIALIZED_CONTRACT_VERSIONS = {
  behaviorSpec: "behavior-spec.v1",
  toolContract: "tool-contract.v1",
  heuristicDecision: "heuristic-decision.v1",
  llmPolicy: "llm-policy.v1",
  memoryPolicy: "memory-policy.v1",
  shortTermMemory: "short-term-memory.v1",
  knowledgeContract: "knowledge-contract.v1",
  knowledgeManifest: "knowledge-manifest.v1",
  evaluationPack: "evaluation-pack.v1",
} as const;

export const REQUIRED_FIELDS_BY_CONTRACT: Record<CanonicalContractKind, string[]> = {
  "blueprint-core.v1": [
    "behavior_spec",
    "generated_at",
    "heuristic_decision",
    "identity",
    "knowledge_contract",
    "llm_policy",
    "memory_policy",
    "purpose",
    "scope",
    "source_session_id",
  ],
  "construction-pack.v1": [
    "behavior_spec",
    "blueprint_ref",
    "evaluation_pack",
    "generated_at",
    "heuristic_decision",
    "knowledge_contract",
    "llm_policy",
    "memory_policy",
    "prompt_pack",
    "readiness",
    "source_session_id",
  ],
  "agent-construction-package.v2": [
    "agent_runtime",
    "build_plan",
    "capability_catalog",
    "checkpoints",
    "compatibility",
    "conformance",
    "decision_registry",
    "deployment_guide",
    "generated_at",
    "implementation_decisions",
    "knowledge_sources",
    "memory_knowledge_plan",
    "memory_strategy",
    "migration",
    "portable_manifest",
    "producer_metadata",
    "prompts",
    "runtime_target_policy",
    "runtime_targets",
    "source_session_id",
    "system_specification",
    "technology_decisions",
    "tests",
    "tool_analysis",
    "tool_bindings",
    "tool_contracts",
    "workflows",
  ],
  "prompt-pack.v1": [
    "evaluator_prompt",
    "executor_prompt",
    "generated_at",
    "origin",
    "planner_prompt",
    "source_session_id",
    "system_prompt",
  ],
  "estimation-pack.v1": [
    "agentic",
    "blueprint_ref",
    "confidence",
    "generated_at",
    "maturity_stage",
    "roi_summary",
    "source_session_id",
    "traditional",
  ],
  "test-pack.v1": [
    "blueprint_ref",
    "external_consumer",
    "framework_target",
    "generated_at",
    "source_session_id",
  ],
};

export type CanonicalProvenanceEntry = {
  note: string;
  source_paths: string[];
  target_path: string;
};

export type CanonicalContractBase = {
  generated_at: string;
  provenance: CanonicalProvenanceEntry[];
  schema_version: string;
  source_blueprint_version?: number | null;
  source_session_id: string;
};

export type BlueprintIdentity = {
  blueprint_version_number?: number | null;
  case_type: string;
  current_stage: string;
  title: string;
};

export type BlueprintPurpose = {
  desired_outcome: string;
  primary_user: string;
  problem_statement: string;
  value_statement: string;
};

export type BlueprintScope = {
  constraints: string[];
  in_scope: string[];
  non_delegable_decisions: string[];
  out_of_scope: string[];
};

export type CanonicalDependency = {
  description: string;
  key: string;
  kind: string;
};

export type CanonicalOpenQuestion = {
  key: string;
  owner: string;
  question: string;
};

export type ApprovalGateSummary = {
  gate_key: string;
  rationale: string;
  requested_in_stage: string;
  status: "pending" | "approved" | "rejected";
  title: string;
};

export type RiskEntry = {
  category: string;
  mitigation: string;
  severity: string;
  status: string;
  summary: string;
};

export type SuccessCriterion = {
  description: string;
  key: string;
  source: string;
};

export type BehaviorState = {
  actor: string;
  fallback: string;
  name: string;
  objective: string;
  outputs: string[];
  requires_approval: boolean;
};

export type BehaviorSpecV1 = CanonicalContractBase & {
  approval_pause: string;
  checkpoint_policy: string;
  compensation_strategy: string;
  execution_pattern: string;
  outputs: string[];
  reasoning_pattern: string;
  required_approvals: string[];
  selected_workflow_template_key: string;
  states: BehaviorState[];
  termination_criteria: string[];
  timeout_policy: string;
  schema_version: typeof SPECIALIZED_CONTRACT_VERSIONS.behaviorSpec;
  retry_strategy: string;
};

export type ToolSchemaField = {
  description: string;
  type: string;
};

export type ToolSchemaShape = {
  properties: Record<string, ToolSchemaField>;
  required: string[];
  type: "object";
};

export type ToolContractV1 = CanonicalContractBase & {
  approval_reason: string;
  approval_policy: string;
  archetype: string;
  audit_rules: string[];
  auth_reference: string;
  contract_review_state: string;
  execution_mode: string;
  failure_mode: string;
  idempotent: boolean;
  idempotency_strategy: string;
  input_schema: ToolSchemaShape;
  integration_kind: string;
  name: string;
  owner: string;
  output_schema: ToolSchemaShape;
  permissions: string[];
  purpose: string;
  rate_limit_policy: string;
  requires_approval: boolean;
  retry_strategy: string;
  risk_level: string;
  schema_version: typeof SPECIALIZED_CONTRACT_VERSIONS.toolContract;
  scopes: string[];
  sensitive_data: string[];
  side_effects: boolean;
  compensation_strategy: string;
  timeout_policy: string;
  typed_errors: string[];
  validations: string[];
  endpoint_reference: string;
};

export type MemoryContextBudgetV1 = {
  compaction_trigger: string;
  max_chars: number;
  max_items: number;
  max_tokens: number;
  overflow_policy: string;
  role: string;
};

export type MemoryPolicyV1 = CanonicalContractBase & {
  agent_scope: string;
  checkpoints_required: boolean;
  context_budgets: MemoryContextBudgetV1[];
  goal_drift_guard: string;
  grounding_policy: {
    citations_policy: string;
    confidence_policy: string;
    contradictory_evidence_behavior: string;
    no_evidence_behavior: string;
  };
  invalidation_policy: string;
  retention_policy: string;
  retrieval_policy: string;
  retrieval_scopes: string[];
  review_trigger: string;
  schema_version: typeof SPECIALIZED_CONTRACT_VERSIONS.memoryPolicy;
  sensitivity_rules: string[];
  storage_layers: string[];
  strategy: string;
  summary_policy: string;
  ttl_policy: string;
  workspace_scope: string;
  write_policy: string;
};

export type ShortTermMemoryRefV1 = {
  blueprint_version_number?: number | null;
  created_at: string;
  evidence_paths: string[];
  key: string;
  kind: string;
  source: string;
  stage: string;
  status: string;
  summary: string;
};

export type ShortTermMemoryNamespaceV1 = {
  freshness: string;
  namespace: string;
  read_roles: string[];
  ref_keys: string[];
  summary: string;
  write_roles: string[];
};

export type ShortTermMemoryCompactionV1 = {
  eviction_policy: string;
  invalidation_policy: string;
  last_compacted_at: string;
  summary_policy: string;
};

export type ShortTermMemoryV1 = CanonicalContractBase & {
  active_goal: string;
  active_stage: string;
  artifact_refs: ShortTermMemoryRefV1[];
  branch_refs: ShortTermMemoryRefV1[];
  checkpoint_refs: ShortTermMemoryRefV1[];
  compaction: ShortTermMemoryCompactionV1;
  current_focus: string;
  namespaces: ShortTermMemoryNamespaceV1[];
  open_handoffs: string[];
  pending_approvals: string[];
  recent_decisions: string[];
  schema_version: typeof SPECIALIZED_CONTRACT_VERSIONS.shortTermMemory;
  skill_run_refs: ShortTermMemoryRefV1[];
};

export type KnowledgeSourceRef = {
  description: string;
  key: string;
  license: string;
  lineage_key: string;
  owner: string;
  sensitivity: string;
  source_type: string;
  source_version: string;
  title: string;
  uri: string;
};

export type KnowledgeIngestionPolicyV1 = {
  chunking_policy: string;
  exclude_filters: string[];
  include_filters: string[];
  metadata_fields: string[];
  parser: string;
};

export type KnowledgeEmbeddingPolicyV1 = {
  dimensions: number;
  model: string;
  provider: string;
  version: string;
};

export type KnowledgeRetrievalPolicyV1 = {
  fallback_behavior: string;
  filters: string[];
  reranking_policy: string;
  search_mode: string;
  top_k: number;
};

export type KnowledgeRefreshPolicyV1 = {
  deletion_policy: string;
  expiration_policy: string;
  frequency: string;
  triggers: string[];
};

export type KnowledgeContractV1 = CanonicalContractBase & {
  enabled: boolean;
  grounding_policy: {
    citations_policy: string;
    confidence_policy: string;
    contradictory_evidence_behavior: string;
    no_evidence_behavior: string;
  };
  embedding_policy?: KnowledgeEmbeddingPolicyV1 | null;
  ingestion_policy?: KnowledgeIngestionPolicyV1 | null;
  mode: string;
  open_questions: string[];
  refresh_policy?: KnowledgeRefreshPolicyV1 | null;
  retrieval_policy?: KnowledgeRetrievalPolicyV1 | null;
  schema_version: typeof SPECIALIZED_CONTRACT_VERSIONS.knowledgeContract;
  source_lineage: string[];
  sensitivity_rules: string[];
  sources: KnowledgeSourceRef[];
};

export type KnowledgeManifestSourceV1 = {
  agent_affinity: string[];
  authority_level: string;
  key: string;
  memory_usage: string;
  owner: string;
  required: boolean;
  source_type: string;
  source_version: string;
  stage_affinity: string[];
  summary: string;
  title: string;
  uri: string;
};

export type KnowledgeManifestV1 = CanonicalContractBase & {
  candidate_sources: KnowledgeManifestSourceV1[];
  fallback_policy: string;
  knowledge_backend_mode: string;
  operating_summary: string;
  required_sources: KnowledgeManifestSourceV1[];
  retrieval_scopes: string[];
  schema_version: typeof SPECIALIZED_CONTRACT_VERSIONS.knowledgeManifest;
  selection_policy: string;
};

export type LLMFunctionPolicy = {
  context_sources: string[];
  fallback_model: string;
  function_key: string;
  intent: string;
  max_tokens: number;
  model: string;
  provider: string;
  reasoning_effort: string;
  role: string;
  tool_availability: string[];
};

export type LLMPolicyV1 = CanonicalContractBase & {
  budget_policy: string;
  circuit_breaker_policy: string;
  context_policy: string;
  fallback_model: string;
  fallback_policy: string;
  fast_model: string;
  functions: LLMFunctionPolicy[];
  log_redaction_policy: string;
  output_validation_policy: string;
  provider: string;
  reasoning_model: string;
  sampling_policy: string;
  schema_version: typeof SPECIALIZED_CONTRACT_VERSIONS.llmPolicy;
};

export type HeuristicDecisionFact = {
  key: string;
  source: string;
  value: string;
};

export type HeuristicDecisionV1 = CanonicalContractBase & {
  candidate_catalog: PatternCatalogEntry[];
  decision_summary: string;
  decision_trace: DecisionTraceEntry[];
  facts: HeuristicDecisionFact[];
  recommended_prompts: string[];
  review_notes: string[];
  schema_version: typeof SPECIALIZED_CONTRACT_VERSIONS.heuristicDecision;
};

export type EvaluationCaseV1 = {
  category: string;
  expected_result: string;
  key: string;
  scenario: string;
  title: string;
};

export type EvaluationPackV1 = CanonicalContractBase & {
  acceptance_cases: EvaluationCaseV1[];
  blocking_issues: string[];
  cases: EvaluationCaseV1[];
  dataset_version_number?: number | null;
  latest_run_status?: ArtifactStatus | null;
  readiness_state: ReviewState;
  recommendations: string[];
  rubric_version_number?: number | null;
  schema_version: typeof SPECIALIZED_CONTRACT_VERSIONS.evaluationPack;
  scores: Record<string, number>;
};

export type PromptVariable = {
  description: string;
  name: string;
  source_paths: string[];
};

export type PromptArtifactV1 = {
  content: string;
  context_sources: string[];
  evaluation_case_keys: string[];
  fallback: string;
  guardrails: string[];
  input_contracts: string[];
  output_schema: Record<string, unknown>;
  prompt_key: string;
  provenance: CanonicalProvenanceEntry[];
  role: string;
  stop_conditions: string[];
  title: string;
  variables: PromptVariable[];
};

export type PromptPackOrigin = {
  behavior_spec_version: typeof SPECIALIZED_CONTRACT_VERSIONS.behaviorSpec;
  blueprint_core_version: typeof CANONICAL_CONTRACT_VERSIONS.blueprintCore;
  heuristic_decision_version: typeof SPECIALIZED_CONTRACT_VERSIONS.heuristicDecision;
  input_hash: string;
  llm_policy_version: typeof SPECIALIZED_CONTRACT_VERSIONS.llmPolicy;
};

export type PromptPackV1 = CanonicalContractBase & {
  evaluator_prompt: PromptArtifactV1;
  executor_prompt: PromptArtifactV1;
  memory_prompt?: PromptArtifactV1 | null;
  origin: PromptPackOrigin;
  planner_prompt: PromptArtifactV1;
  recovery_prompt?: PromptArtifactV1 | null;
  retrieval_prompt?: PromptArtifactV1 | null;
  schema_version: typeof CANONICAL_CONTRACT_VERSIONS.promptPack;
  system_prompt: PromptArtifactV1;
  tool_use_prompt?: PromptArtifactV1 | null;
};

export type ConstructionComponent = {
  key: string;
  label: string;
  role: string;
  status: ReviewState;
  summary: string;
};

export type ConstructionFileManifestEntry = {
  generated_from: string[];
  kind: string;
  path: string;
  source_contract: string;
  summary: string;
};

export type ReadinessGapEntry = {
  code: string;
  remediation: string;
  severity: string;
  summary: string;
};

export type ConstructionReadinessV1 = {
  blocking_issues: string[];
  can_build: boolean;
  remediation_notes: string[];
  status: ReviewState;
  warnings: string[];
};

export type ContractReference = {
  contract_kind: string;
  schema_version: string;
  source_blueprint_version?: number | null;
};

export type ConstructionPackV1 = CanonicalContractBase & {
  acceptance_cases: EvaluationCaseV1[];
  behavior_spec: BehaviorSpecV1;
  blueprint_ref: ContractReference;
  components: ConstructionComponent[];
  evaluation_pack: EvaluationPackV1;
  file_manifest: ConstructionFileManifestEntry[];
  gaps: ReadinessGapEntry[];
  heuristic_decision: HeuristicDecisionV1;
  knowledge_contract: KnowledgeContractV1;
  llm_policy: LLMPolicyV1;
  memory_policy: MemoryPolicyV1;
  prompt_pack: PromptPackV1;
  readiness: ConstructionReadinessV1;
  remediation_notes: string[];
  schema_version: typeof CANONICAL_CONTRACT_VERSIONS.constructionPack;
  tool_contracts: ToolContractV1[];
  topology: Record<string, unknown>;
};

export type AcpV2ProducerMetadata = {
  generated_from_contracts: string[];
  notes: string[];
  producer_contract_version: typeof CANONICAL_CONTRACT_VERSIONS.agentConstructionPackage;
  producer_name: string;
  separated_from_system_spec: boolean;
};

export type AcpV2ManifestContractEntry = {
  checksum_sha256: string;
  contract_key: string;
  relative_path: string;
  required: boolean;
  schema_version: string;
};

export type AcpV2PortableManifest = {
  checksum_algorithm: "sha256";
  compatibility_targets: string[];
  contract_version: typeof CANONICAL_CONTRACT_VERSIONS.agentConstructionPackage;
  contracts: AcpV2ManifestContractEntry[];
  created_at: string;
  manifest_version: "acp-portable-manifest.v1";
  package_id: string;
};

export type AcpV2MigrationInfo = {
  breaking_changes: string[];
  compatibility_notes: string[];
  from_schema_version: string;
  migration_strategy: string;
  source_checksum_sha256: string;
};

export type AcpV2BuildStep = {
  actions: string[];
  depends_on: string[];
  inputs: string[];
  objective: string;
  outputs: string[];
  step_key: string;
  title: string;
  validation: string[];
};

export type AcpV2BuildPlan = {
  completion_criteria: string[];
  entrypoint: string;
  steps: AcpV2BuildStep[];
};

export type AcpV2RuntimeAgent = {
  agent_key: string;
  failure_mode: string;
  goal: string;
  handoff_targets: string[];
  inputs: string[];
  memory_refs: string[];
  outputs: string[];
  role: string;
  runtime_mode: string;
  success_signals: string[];
  tools: string[];
};

export type AcpV2AgentRuntime = {
  agents: AcpV2RuntimeAgent[];
  execution_budget: Record<string, unknown>;
  failure_modes: string[];
  orchestration_pattern: string;
  routing_rules: Record<string, unknown>[];
  runtime_model: string;
  state_machine: Record<string, unknown>[];
};

export type AcpV2WorkflowNode = {
  actor: string;
  checkpoint_ref: string;
  context_refs: string[];
  decision_refs: string[];
  inputs: string[];
  node_key: string;
  objective: string;
  outputs: string[];
  portable_state: string;
  retry_policy: string;
  timeout_policy: string;
  title: string;
  workflow_role: "construction" | "runtime" | "human_decision";
};

export type AcpV2WorkflowTransition = {
  checkpoint_ref: string;
  condition: string;
  failure_behavior: string;
  from_node: string;
  requires_decision: boolean;
  routing_rule: string;
  to_node: string;
  transition_key: string;
};

export type AcpV2WorkflowSpec = {
  entry_node: string;
  handoff_contract_refs: string[];
  nodes: AcpV2WorkflowNode[];
  portable_state_policy: string;
  terminal_nodes: string[];
  topology: "sequential" | "hierarchical" | "event_driven" | "consensus" | "mixed";
  transitions: AcpV2WorkflowTransition[];
  workflow_key: string;
  workflow_type: "construction" | "runtime_operational" | "human_decision_resolution";
};

export type AcpV2CheckpointSpec = {
  checkpoint_key: string;
  portable_ref: string;
  required_artifacts: string[];
  resume_strategy: string;
  scope: "construction" | "runtime" | "human_decision";
  storage_hint: string;
  title: string;
  trigger: string;
  validation: string[];
};

export type AcpV2DecisionOption = {
  description: string;
  label: string;
  option_key: string;
  recommended: boolean;
  tradeoffs: string[];
};

export type AcpV2DecisionRegistryEntry = {
  blocking_scope: "package" | "implementation" | "none";
  classification: "mandatory" | "optional" | "deferable" | "environment_dependent";
  context: string;
  decision_key: string;
  examples: string[];
  impact: string;
  options: AcpV2DecisionOption[];
  owner: string;
  question: string;
  recommended_moment: string;
  source_ref: string;
};

export type AcpV2ImplementationDecision = {
  decision_key: string;
  decision_type: string;
  default_option: string;
  impact: string;
  options: string[];
  owner: string;
  question: string;
  required: boolean;
  source_ref: string;
  timing: string;
};

export type AcpV2ToolContractRef = {
  auth_requirements: string[];
  capability: string;
  compensation_strategy: string;
  display_name: string;
  idempotent: boolean;
  input_schema: Record<string, unknown>;
  integration_kind: string;
  output_schema: Record<string, unknown>;
  purpose: string;
  requirement_level: "required" | "optional" | "conditional";
  retry_strategy: string;
  side_effects: boolean;
  source_ref: string;
  tool_key: string;
  validations: string[];
};

export type AcpV2CapabilityContract = {
  abstract_inputs: Record<string, unknown>;
  abstract_outputs: Record<string, unknown>;
  capability_key: string;
  consumers: string[];
  description: string;
  memory_refs: string[];
  rationale: string;
  replacement_options: string[];
  required_permissions: string[];
  requirement_level: "required" | "optional" | "replaceable" | "not_recommended";
  side_effect_profile: string;
  source_refs: string[];
  title: string;
  tool_refs: string[];
};

export type AcpV2ToolBinding = {
  binding_key: string;
  binding_type: "producer_internal_tool" | "external_api" | "abstract_contract" | "runtime_adapter";
  capability_key: string;
  cost_profile: string;
  credentials_policy: string;
  external_contract_hint: string;
  fallback_strategy: string;
  idempotent: boolean;
  permissions: string[];
  provider_boundary: "producer_internal" | "customer_external" | "framework_runtime" | "abstract";
  replaceable: boolean;
  replacement_strategy: string;
  requirement_level: "required" | "optional" | "replaceable" | "not_recommended";
  risk_profile: string;
  side_effects: boolean;
  source_ref: string;
  tool_key: string;
};

export type AcpV2ToolRedundancy = {
  capability_key: string;
  rationale: string;
  recommendation: string;
  redundancy_key: string;
  severity: "info" | "warning" | "blocking";
  tool_keys: string[];
};

export type AcpV2ToolIncompatibility = {
  incompatibility_key: string;
  mitigation: string;
  reason: string;
  severity: "info" | "warning" | "blocking";
  tool_keys: string[];
};

export type AcpV2ToolAnalysis = {
  incompatibility_findings: AcpV2ToolIncompatibility[];
  minimal_tooling_policy: string;
  not_recommended_tools: string[];
  overprovisioning_policy: string;
  redundancy_findings: AcpV2ToolRedundancy[];
  summary: string;
};

export type AcpV2MemoryStrategy = {
  context_budget: Record<string, unknown>[];
  long_term: Record<string, unknown>;
  persistence: Record<string, unknown>;
  retrieval: Record<string, unknown>;
  short_term: Record<string, unknown>;
  source_refs: string[];
};

export type AcpV2MemoryNamespace = {
  compaction_policy: string;
  freshness_policy: string;
  memory_type: "short_term" | "long_term" | "documentary_knowledge" | "rag_index" | "audit";
  namespace_key: string;
  portable_ref: string;
  privacy_policy: string;
  purpose: string;
  read_roles: string[];
  retention_policy: string;
  scope: "agent" | "tenant" | "workspace" | "session_portable";
  write_roles: string[];
};

export type AcpV2KnowledgeArtifactRef = {
  artifact_key: string;
  expiration_policy: string;
  indexing_required: boolean;
  ingestion_capability_ref: string;
  license: string;
  location_hint: string;
  owner: string;
  permissions: string[];
  reason_to_index: string;
  refresh_triggers: string[];
  retrieval_capability_ref: string;
  sensitivity: string;
  source_ref: string;
  source_type: string;
  source_version: string;
  title: string;
};

export type AcpV2RagCapabilityDependency = {
  capability_key: string;
  fallback: string;
  reason: string;
  required: boolean;
};

export type AcpV2RagPipelineSpec = {
  capability_dependencies: AcpV2RagCapabilityDependency[];
  citation_policy: string;
  deletion_policy: string;
  embedding_policy: Record<string, unknown>;
  enabled: boolean;
  fallback_policy: string;
  grounding_policy: Record<string, unknown>;
  ingestion_policy: Record<string, unknown>;
  mode: string;
  refresh_policy: Record<string, unknown>;
  retrieval_policy: Record<string, unknown>;
  source_refs: string[];
  vector_store_decision_ref: string;
};

export type AcpV2ContextWindowPolicy = {
  anti_redundancy_rules: string[];
  artifact_reference_policy: string;
  compaction_trigger: string;
  max_context_utilization_percent: number;
  pagination_policy: string;
  retrieval_context_policy: string;
  short_term_budget_refs: string[];
};

export type AcpV2MemoryKnowledgePlan = {
  capability_dependencies: string[];
  context_window_policy: AcpV2ContextWindowPolicy;
  knowledge_artifacts: AcpV2KnowledgeArtifactRef[];
  namespaces: AcpV2MemoryNamespace[];
  rag_pipeline: AcpV2RagPipelineSpec;
  source_refs: string[];
};

export type AcpV2KnowledgeSource = {
  freshness: string;
  ingestion_required: boolean;
  kind: string;
  location_hint: string;
  owner: string;
  source_key: string;
  source_ref: string;
  title: string;
};

export type AcpV2PromptRef = {
  content: string;
  context_sources: string[];
  guardrails: string[];
  input_contracts: string[];
  output_schema: Record<string, unknown>;
  prompt_key: string;
  required: boolean;
  role: string;
  source_ref: string;
  title: string;
  usage: string;
};

export type AcpV2TestAsset = {
  acceptance_criteria: string[];
  expected_result: string;
  kind: string;
  required: boolean;
  scenario: string;
  source_ref: string;
  test_key: string;
  title: string;
};

export type AcpV2ConformanceRule = {
  requirement: string;
  rule_key: string;
  severity: "info" | "warning" | "blocking";
  validation_method: string;
};

export type AcpV2CompatibilityRule = {
  adapter_notes: string[];
  support_level: string;
  target: string;
  unsupported_features: string[];
};

export type AcpV2RuntimeTarget = {
  adapter_notes: string[];
  category: "agentic_ide" | "agent_framework" | "orchestration_runtime" | "custom_runtime";
  label: string;
  prerequisites: string[];
  rationale: string;
  recommendation_level: "recommended" | "compatible" | "optional" | "not_recommended";
  required: boolean;
  selection_criteria: string[];
  source_ref: string;
  target_key: string;
  tradeoffs: string[];
};

export type AcpV2RuntimeTargetPolicy = {
  override_policy: string;
  recommended_runtime: string[];
  required_runtime: string[];
  selection_policy: string;
};

export type AcpV2TechnologyOption = {
  examples: string[];
  label: string;
  option_key: string;
  prerequisites: string[];
  rationale: string;
  recommendation_level: "recommended" | "compatible" | "optional" | "not_recommended";
  tradeoffs: string[];
};

export type AcpV2TechnologyDecision = {
  category: "language" | "framework" | "database" | "vector_store" | "hosting" | "ci_cd" | "observability";
  decision_key: string;
  default_guidance: string;
  options: AcpV2TechnologyOption[];
  question: string;
  required_for_implementation: boolean;
  required_for_package: boolean;
  selection_criteria: string[];
  source_ref: string;
};

export type AcpV2DeploymentGuideStep = {
  actions: string[];
  objective: string;
  optional: boolean;
  prerequisites: string[];
  step_key: string;
  title: string;
  validation: string[];
};

export type AcpV2DeploymentGuide = {
  deployment_decision_refs: string[];
  environment_prerequisites: string[];
  guide_key: string;
  mode: "guidance_only";
  observability_considerations: string[];
  required_script: boolean;
  rollback_guidance: string[];
  security_considerations: string[];
  steps: AcpV2DeploymentGuideStep[];
};

export type AgentConstructionPackageV2 = CanonicalContractBase & {
  agent_runtime: AcpV2AgentRuntime;
  build_plan: AcpV2BuildPlan;
  capability_catalog: AcpV2CapabilityContract[];
  checkpoints: AcpV2CheckpointSpec[];
  compatibility: AcpV2CompatibilityRule[];
  conformance: AcpV2ConformanceRule[];
  decision_registry: AcpV2DecisionRegistryEntry[];
  deployment_guide: AcpV2DeploymentGuide;
  implementation_decisions: AcpV2ImplementationDecision[];
  knowledge_sources: AcpV2KnowledgeSource[];
  memory_knowledge_plan: AcpV2MemoryKnowledgePlan;
  memory_strategy: AcpV2MemoryStrategy;
  migration: AcpV2MigrationInfo;
  portable_manifest: AcpV2PortableManifest;
  producer_metadata: AcpV2ProducerMetadata;
  prompts: AcpV2PromptRef[];
  runtime_target_policy: AcpV2RuntimeTargetPolicy;
  runtime_targets: AcpV2RuntimeTarget[];
  schema_version: typeof CANONICAL_CONTRACT_VERSIONS.agentConstructionPackage;
  system_specification: Record<string, unknown>;
  technology_decisions: AcpV2TechnologyDecision[];
  tests: AcpV2TestAsset[];
  tool_analysis: AcpV2ToolAnalysis;
  tool_bindings: AcpV2ToolBinding[];
  tool_contracts: AcpV2ToolContractRef[];
  workflows: AcpV2WorkflowSpec[];
};

export type WorkstreamEstimate = {
  automation_percent: number;
  duration_days: number;
  estimated_cost: number;
  estimated_hours: number;
  label: string;
  notes: string[];
  workstream_key: string;
};

export type TraditionalEstimateContract = {
  assumptions: string[];
  estimated_cost: number;
  estimated_duration_weeks: number;
  estimated_hours_total: number;
  scenario_type: "traditional";
  team_shape: string[];
  warnings: string[];
  workstream_breakdown: WorkstreamEstimate[];
};

export type AutomationFamilyAssessment = {
  blocking_conditions: string[];
  bonuses_applied: string[];
  complexity: string;
  coverage_percent: number;
  family_key: string;
  label: string;
  mandatory_human_review: boolean;
  non_automatable_reasons: string[];
  notes: string[];
  penalties_applied: string[];
  risk_tier: string;
};

export type EstimationPricingSnapshot = {
  assumptions: string[];
  cop_per_usd: number;
  effective_from: string;
  is_local_inference: boolean;
  label: string;
  local_cost_policy?: string | null;
  model: string;
  pricing_mode: string;
  profile_key: string;
  provider: string;
  rates: Record<string, unknown>[];
};

export type AgenticEstimateContract = TraditionalEstimateContract & {
  active_provider: string;
  automation_assessments: AutomationFamilyAssessment[];
  automation_coverage_by_artifact_family: Record<string, number>;
  automation_coverage_by_workstream: Record<string, number>;
  automation_coverage_percent: number;
  economic_model: string;
  human_delivery_cost: number;
  human_supervision_cost: number;
  human_supervision_hours: number;
  llm_runtime_cost_usd: number;
  net_savings_vs_traditional: number;
  platform_cost_usd: number;
  platform_overhead_cost_usd: number;
  pricing_assumptions: string[];
  pricing_policy: string;
  pricing_snapshot?: EstimationPricingSnapshot | null;
  provider_model: string;
  provider_runtime_cost_total_cop: number;
  provider_runtime_cost_total_usd: number;
  scenario_type: "agentic";
  tool_runtime_cost_usd: number;
  tooling_cost_usd: number;
};

export type ConfidenceBreakdownContract = {
  assumptions_count: number;
  blocking_gaps: number;
  label: string;
  negative_signals: string[];
  open_questions: number;
  positive_signals: string[];
  recommended_next_actions: string[];
  score: number;
  subscores: Record<string, number>;
  uncertainty_band_percent: number;
};

export type EstimationComplexityDriverContract = {
  driver_key: string;
  evidence_refs: string[];
  impact_level: "low" | "medium" | "high";
  summary: string;
  title: string;
  workstream_key: string;
};

export type EstimationRiskRegisterEntryContract = {
  evidence_refs: string[];
  impact: string;
  likelihood: "low" | "medium" | "high";
  mitigation: string;
  risk_key: string;
  severity: "low" | "medium" | "high";
  title: string;
};

export type EstimationUncertaintyFactorContract = {
  category: string;
  evidence_refs: string[];
  factor_key: string;
  impact_area: "scope" | "schedule" | "cost" | "confidence" | "operations";
  summary: string;
  title: string;
};

export type EstimationBenchmarkRefContract = {
  benchmark_key: string;
  captured_at: string;
  freshness: string;
  sample_size: number;
  source_kind: "workspace_actuals" | "pricing_catalog" | "knowledge_document" | "platform_benchmark";
  source_ref: string;
  summary: string;
  title: string;
  workspace_scoped: boolean;
};

export type EstimationScenarioAdjustmentContract = {
  cost_multiplier: number;
  duration_multiplier: number;
  evidence_refs: string[];
  hours_multiplier: number;
  rationale: string;
  scenario_key: "optimistic" | "base" | "conservative";
};

export type EstimationSavingsOpportunityContract = {
  evidence_refs: string[];
  expected_impact: string;
  opportunity_key: string;
  prerequisites: string[];
  summary: string;
  title: string;
};

export type EstimationQuestionContract = {
  blocking: boolean;
  question: string;
  question_key: string;
  rationale: string;
};

export type EstimationConfidenceAdjustmentProposalContract = {
  evidence_refs: string[];
  proposed_score_delta: number;
  proposed_uncertainty_band_delta: number;
  rationale: string;
};

export type EstimationAnalysisArtifactContract = {
  assumptions: string[];
  benchmark_refs: EstimationBenchmarkRefContract[];
  complexity_drivers: EstimationComplexityDriverContract[];
  confidence_adjustment_proposal: EstimationConfidenceAdjustmentProposalContract;
  evidence_refs: string[];
  questions: EstimationQuestionContract[];
  risk_register: EstimationRiskRegisterEntryContract[];
  savings_opportunities: EstimationSavingsOpportunityContract[];
  scenario_adjustments: EstimationScenarioAdjustmentContract[];
  schema_version: string;
  summary: string;
  uncertainty_factors: EstimationUncertaintyFactorContract[];
};

export type EstimationDeterministicInputsContract = {
  benchmark_corpus_hash: string;
  benchmark_ids: string[];
  calibration_sample_size: number;
  catalogs_used: string[];
  formula_notes: string[];
  pricing_catalog_signature: string;
  validation_fingerprint: string;
};

export type EstimationSensitivityDriver = {
  impact: string;
  key: string;
  summary: string;
};

export type EstimationRunEntryContract = {
  agentic_cost_total: number;
  agentic_duration_weeks: number;
  agentic_hours_total: number;
  automation_coverage_percent: number;
  blueprint_version_number?: number | null;
  confidence_label: string;
  confidence_score: number;
  created_at: string;
  id: string;
  maturity_stage: string;
  pricing_policy: string;
  source_action: string;
  traditional_cost_total: number;
  traditional_duration_weeks: number;
  traditional_hours_total: number;
  uncertainty_band_percent: number;
};

export type EstimationPackV1 = CanonicalContractBase & {
  actuals_count: number;
  agentic: AgenticEstimateContract;
  analysis?: EstimationAnalysisArtifactContract | null;
  base_confidence?: ConfidenceBreakdownContract | null;
  blueprint_ref: ContractReference;
  confidence: ConfidenceBreakdownContract;
  deterministic_inputs?: EstimationDeterministicInputsContract | null;
  estimation_runs: EstimationRunEntryContract[];
  maturity_stage: string;
  risk_drivers: string[];
  roi_summary: string;
  schema_version: typeof CANONICAL_CONTRACT_VERSIONS.estimationPack;
  sensitivity_drivers: EstimationSensitivityDriver[];
  traditional: TraditionalEstimateContract;
  assumptions: string[];
};

export type TestPackFixtureRef = {
  contract_key: string;
  key: string;
  relative_path: string;
  summary: string;
  valid: boolean;
};

export type TestPackCommandV1 = {
  command: string;
  expected_exit_code: number;
  key: string;
  kind: string;
  title: string;
  workdir: string;
};

export type TestPackMutationCaseV1 = {
  blocks_readiness: boolean;
  contract_key: string;
  expected_issue_code: string;
  expected_issue_path: string;
  key: string;
  mutation: string;
  path: string;
};

export type TestPackPromptEvaluationCaseV1 = {
  blocking: boolean;
  expected_substrings: string[];
  failure_mode: string;
  forbidden_substrings: string[];
  key: string;
  measurable_criterion: string;
  mode: string;
  prompt_key: string;
};

export type TestPackRecoveryCaseV1 = {
  expected_behavior: string;
  expected_prompt_key: string;
  key: string;
  measurable_criterion: string;
  trigger: string;
};

export type TestPackAcceptanceJourneyV1 = {
  expected_behavior: string;
  input_reference: string;
  key: string;
  measurable_criterion: string;
  title: string;
};

export type StableIssueCatalogEntryV1 = {
  code: string;
  kind: string;
  remediation: string;
  severity: string;
};

export type TestPackExternalConsumerV1 = {
  constraints: string[];
  entry_command: string;
  relative_path: string;
};

export type TestPackV1 = CanonicalContractBase & {
  acceptance_journeys: TestPackAcceptanceJourneyV1[];
  blueprint_ref: ContractReference;
  commands: TestPackCommandV1[];
  external_consumer: TestPackExternalConsumerV1;
  fixtures: TestPackFixtureRef[];
  framework_target: string;
  invalid_fixtures: TestPackFixtureRef[];
  mutation_cases: TestPackMutationCaseV1[];
  prompt_evaluation_cases: TestPackPromptEvaluationCaseV1[];
  recovery_cases: TestPackRecoveryCaseV1[];
  schema_version: typeof CANONICAL_CONTRACT_VERSIONS.testPack;
  stable_issue_catalog: StableIssueCatalogEntryV1[];
};

export type BlueprintCoreV1 = CanonicalContractBase & {
  approvals: ApprovalGateSummary[];
  assumptions: string[];
  behavior_spec: BehaviorSpecV1;
  completion_criteria: string[];
  dependencies: CanonicalDependency[];
  guardrails: string[];
  heuristic_decision: HeuristicDecisionV1;
  identity: BlueprintIdentity;
  knowledge_contract: KnowledgeContractV1;
  llm_policy: LLMPolicyV1;
  memory_policy: MemoryPolicyV1;
  open_questions: CanonicalOpenQuestion[];
  purpose: BlueprintPurpose;
  risks: RiskEntry[];
  schema_version: typeof CANONICAL_CONTRACT_VERSIONS.blueprintCore;
  scope: BlueprintScope;
  success_criteria: SuccessCriterion[];
  tool_contracts: ToolContractV1[];
};

export type CanonicalContractMap = {
  "blueprint-core.v1": BlueprintCoreV1;
  "construction-pack.v1": ConstructionPackV1;
  "agent-construction-package.v2": AgentConstructionPackageV2;
  "prompt-pack.v1": PromptPackV1;
  "estimation-pack.v1": EstimationPackV1;
  "test-pack.v1": TestPackV1;
};

export type CanonicalContractsServerState = {
  items: Partial<CanonicalContractMap>;
  last_error?: string | null;
  status: "idle" | "loading" | "ready" | "error";
};

export type CanonicalExportPreviewState = {
  generatedAt: string;
  kind: CanonicalContractKind;
  readinessLabel: string;
  schemaVersion: string;
  sourceBlueprintVersion?: number | null;
  sourceSessionId: string;
  title: string;
};

export type CanonicalExportFormState = {
  includeAdvancedPrompts: boolean;
  selectedKind: CanonicalContractKind;
};

export type CanonicalExportMeta = {
  checksumSha256: string;
  contractVersion: CanonicalContractKind;
  generatedAt: string;
  preview: boolean;
  readiness: CanonicalExportReadiness;
  sourceBlueprintVersion?: number | null;
};

export type CanonicalExportResponse<K extends CanonicalContractKind> = {
  data: CanonicalContractMap[K];
  meta: CanonicalExportMeta;
};
