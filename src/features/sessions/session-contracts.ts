import type { ArtifactStatus, CommercialTier, SessionStage } from "@/features/sessions/types";

export type AutonomyLevel = "low" | "medium" | "high";
export type ReviewState = "complete" | "partial" | "blocked";

export type OperationalBaseline = {
  automation_opportunities: string[];
  current_cost: string;
  current_time_spent: string;
  frequent_errors: string[];
};

export type MvpDefinition = {
  non_delegable_decisions: string[];
  north_star_metric: string;
  out_of_scope: string[];
  v1_scope: string[];
};

export type DiscoveryInput = {
  autonomy_level: AutonomyLevel;
  constraints: string[];
  current_process: string;
  current_user: string;
  desired_outcome: string;
  mvp_definition: MvpDefinition;
  operational_baseline: OperationalBaseline;
  problem_statement: string;
};

export type DiscoveryArtifact = DiscoveryInput & {
  case_type: string;
  value_statement: string;
};

export type DiscoveryAnalysisInsight = {
  key: string;
  statement: string;
  source_refs: string[];
  confidence: number;
};

export type GuidedAnswerOption = {
  key: string;
  label: string;
  description: string;
  impact: string;
  example: string;
  recommended: boolean;
  confidence: number;
  source_refs: string[];
};

export type GuidedQuestion = {
  key: string;
  question: string;
  rationale: string;
  priority: "high" | "medium" | "low";
  blocking_stages: string[];
  suggested_answer: string;
  answer_options?: GuidedAnswerOption[];
  stage_scope?: string;
  deferral_target_stage?: string;
  inference_summary?: string;
  confidence?: number;
  source_refs?: string[];
};

export type DiscoveryAnalysisQuestion = {
  key: string;
  question: string;
  rationale: string;
  priority: "high" | "medium" | "low";
  blocking_stages: string[];
  suggested_answer: string;
  answer_options?: GuidedAnswerOption[];
};

export type DiscoveryAnalysisArtifact = {
  summary: string;
  facts: DiscoveryAnalysisInsight[];
  inferred_needs: DiscoveryAnalysisInsight[];
  assumptions: DiscoveryAnalysisInsight[];
  ambiguities: DiscoveryAnalysisInsight[];
  open_questions: DiscoveryAnalysisQuestion[];
  domain_signals: DiscoveryAnalysisInsight[];
  risk_signals: DiscoveryAnalysisInsight[];
  sensitive_data_signals: DiscoveryAnalysisInsight[];
  missing_information: string[];
  evidence_refs: string[];
  confidence: number;
  normalized_discovery_candidate: DiscoveryArtifact;
  schema_version?: string;
};

export type AgentCanvasProfile = {
  agent_task: string;
  allowed_decisions: string[];
  expected_outputs: string[];
  human_approvals: string[];
  key_inputs: string[];
  mission: string;
  primary_user: string;
  prohibited_decisions: string[];
  success_metrics: string[];
};

export type CanvasArtifact = {
  agent_profile: AgentCanvasProfile;
  mvp_scope: string[];
  out_of_scope: string[];
  primary_risk: string;
  success_metric: string;
  user_goal: string;
};

export type DefinitionPriority = "high" | "medium" | "low";
export type DefinitionItemStatus = "proposed" | "accepted" | "rejected" | "needs_input";
export type TraceCoverageStatus = "covered" | "partial" | "gap";

export type DefinitionEntityBase = {
  acceptance: string[];
  key: string;
  priority: DefinitionPriority;
  rationale: string;
  source_refs: string[];
  status: DefinitionItemStatus;
  title: string;
};

export type FunctionalRequirement = DefinitionEntityBase & {
  actor: string;
  exceptions: string[];
  happy_path: string;
  requirement: string;
  trigger: string;
};

export type NonFunctionalRequirement = DefinitionEntityBase & {
  category: string;
  metric: string;
  requirement: string;
  target: string;
};

export type BusinessRule = DefinitionEntityBase & {
  owner: string;
  rule: string;
};

export type AcceptanceCriterion = DefinitionEntityBase & {
  criterion: string;
  requirement_keys: string[];
};

export type Dependency = DefinitionEntityBase & {
  dependency: string;
  dependency_type: string;
  owner: string;
};

export type Assumption = DefinitionEntityBase & {
  assumption: string;
};

export type OpenQuestion = DefinitionEntityBase & {
  blocking: boolean;
  impacted_sections: string[];
  question: string;
  suggested_answer: string;
  answer_options?: GuidedAnswerOption[];
};

export type RequirementTraceEntry = {
  coverage_status: TraceCoverageStatus;
  key: string;
  rationale: string;
  requirement_key: string;
  source_ref: string;
};

export type DefinitionValidationSummary = {
  blocking_issues: string[];
  blocking_open_questions: string[];
  contradictions: string[];
  coverage_ratio: number;
  duplicate_keys: string[];
  duplicate_signals: string[];
  missing_acceptance: string[];
  untraced_items: string[];
  vague_nfrs: string[];
};

export type DefinitionArtifact = {
  assumptions: Assumption[];
  acceptance_criteria: AcceptanceCriterion[];
  business_rules: BusinessRule[];
  canvas_projection: CanvasArtifact;
  confidence: number;
  dependencies: Dependency[];
  evidence_refs: string[];
  functional_requirements: FunctionalRequirement[];
  measurable_objectives: string[];
  non_functional_requirements: NonFunctionalRequirement[];
  open_questions: OpenQuestion[];
  schema_version?: string;
  summary: string;
  traceability: RequirementTraceEntry[];
  validation: DefinitionValidationSummary;
};

export type DesignCritiqueFinding = {
  detail: string;
  finding_key: string;
  severity: string;
  source_refs: string[];
  suggested_action: string;
  title: string;
};

export type DesignRole = {
  key: string;
  limits: string[];
  responsibility: string;
  title: string;
};

export type DesignHandoff = {
  approval_required: boolean;
  from_role: string;
  payload: string;
  to_role: string;
  trigger: string;
};

export type DesignFailureMode = {
  compensation_strategy: string;
  idempotency_notes: string;
  retry_strategy: string;
  scenario: string;
};

export type DesignBlueprintProjection = {
  architecture: string;
  guardrails: string[];
  narrative: string;
  reasoning_pattern: string;
  safety_checks: SafetyCheck[];
};

export type DesignAlternative = {
  alternative_key: string;
  approval_points: string[];
  architecture: string;
  assumptions: string[];
  blueprint_projection: DesignBlueprintProjection;
  concurrency_strategy: string;
  coordination_model: string;
  decision_policy: string;
  escalation_conditions: string[];
  evidence_refs: string[];
  failure_modes: DesignFailureMode[];
  fit_rationale: string[];
  fit_score: number;
  handoffs: DesignHandoff[];
  label: string;
  maintainability: string;
  operational_complexity: string;
  reasoning_pattern: string;
  relative_cost: string;
  roles: DesignRole[];
  security_notes: string[];
  summary: string;
  topology: string;
  tradeoffs: string[];
};

export type DesignFitAlternativeScore = {
  alternative_key: string;
  coverage_status: string;
  rationale: string;
  score: number;
};

export type DesignFitMatrixEntry = {
  category: string;
  priority: string;
  requirement_key: string;
  requirement_title: string;
  scores: DesignFitAlternativeScore[];
};

export type DesignRequirementCoverageEntry = {
  category: string;
  coverage_status: string;
  priority: string;
  rationale: string;
  requirement_key: string;
  requirement_title: string;
  source_refs: string[];
};

export type DesignRecommendationConfidence = {
  band: string;
  overall: number;
  rationale: string;
};

export type DesignRecommendationArtifact = {
  alternatives: DesignAlternative[];
  confidence: DesignRecommendationConfidence;
  critic_findings: DesignCritiqueFinding[];
  decision_rationale: string;
  evidence_refs: string[];
  fit_matrix: DesignFitMatrixEntry[];
  guided_questions?: GuidedQuestion[];
  missing_information: string[];
  open_questions: string[];
  recommended_alternative_key: string;
  remediation_summary: string;
  requirements_coverage: DesignRequirementCoverageEntry[];
  review_state: string;
  schema_version?: string;
  selected_design?: DesignAlternative | null;
  summary: string;
};

export type BlueprintTool = {
  approval_reason: string;
  approval_policy?: string;
  archetype?: string;
  audit_rules?: string[];
  auth_reference?: string;
  compensation_strategy: string;
  contract_review_state?: string;
  execution_mode: string;
  failure_mode: string;
  has_side_effects: boolean;
  idempotency_strategy?: string;
  integration_kind?: string;
  inputs: string[];
  name: string;
  owner?: string;
  outputs: string[];
  permissions?: string[];
  purpose: string;
  rate_limit_policy?: string;
  registered_api_ref?: string;
  request_schema?: Record<string, unknown>;
  requires_approval: boolean;
  response_schema?: Record<string, unknown>;
  retry_strategy: string;
  risk_level: string;
  scopes?: string[];
  security_config?: Record<string, unknown>;
  sensitive_data?: string[];
  timeout_policy?: string;
  tool_type?: string;
  typed_errors?: string[];
  usage_examples?: Array<Record<string, unknown>>;
  validations: string[];
  when_to_use?: string;
  execution_stage?: string;
  endpoint_reference?: string;
};

export type BlueprintLLMFunctionPolicy = {
  fallback_model: string;
  max_tokens: number;
  model: string;
  provider: string;
  reasoning_effort: string;
  role: string;
  tool_availability: string[];
};

export type BlueprintLLMPolicy = {
  budget_policy: string;
  circuit_breaker_policy: string;
  context_policy: string;
  fallback_model: string;
  fallback_policy: string;
  fast_model: string;
  functions: BlueprintLLMFunctionPolicy[];
  log_redaction_policy: string;
  output_validation_policy: string;
  provider: string;
  reasoning_model: string;
  review_state: string;
  sampling_policy: string;
};

export type GroundingPolicy = {
  citations_policy: string;
  confidence_policy: string;
  contradictory_evidence_behavior: string;
  no_evidence_behavior: string;
};

export type MemoryProfile = {
  goal_drift_guard: string;
  agent_scope?: string;
  grounding_policy?: GroundingPolicy;
  retention_policy?: string;
  retrieval_policy: string;
  review_trigger: string;
  sensitivity_rules?: string[];
  storage_layers: string[];
  strategy: string;
  ttl_policy?: string;
  workspace_scope?: string;
  write_policy: string;
};

export type KnowledgeSource = {
  description: string;
  key: string;
  license: string;
  owner: string;
  sensitivity: string;
  source_type: string;
  source_version: string;
  title: string;
  uri: string;
};

export type IngestionPolicy = {
  chunking_policy: string;
  exclude_filters: string[];
  include_filters: string[];
  metadata_fields: string[];
  parser: string;
};

export type EmbeddingPolicy = {
  dimensions: number;
  model: string;
  provider: string;
  version: string;
};

export type RetrievalPolicyProfile = {
  fallback_behavior: string;
  filters: string[];
  reranking_policy: string;
  search_mode: string;
  top_k: number;
};

export type RefreshPolicy = {
  deletion_policy: string;
  expiration_policy: string;
  frequency: string;
  triggers: string[];
};

export type KnowledgeProfile = {
  grounding_policy?: GroundingPolicy;
  embedding_policy?: EmbeddingPolicy;
  ingestion_policy?: IngestionPolicy;
  mode: string;
  notes?: string;
  refresh_policy?: RefreshPolicy;
  retrieval_policy?: RetrievalPolicyProfile;
  sensitivity_rules?: string[];
  sources: KnowledgeSource[];
};

export type SafetyCheck = {
  category: string;
  mitigation: string;
  risk: string;
  severity: string;
  status: string;
};

export type WorkflowStep = {
  actor: string;
  fallback: string;
  name: string;
  objective: string;
  outputs: string[];
  requires_approval: boolean;
};

export type WorkflowProfile = {
  approval_pause: string;
  checkpoint_policy: string;
  compensation_strategy: string;
  execution_pattern: string;
  inbox_strategy: string;
  outbox_strategy: string;
  retry_strategy: string;
  steps: WorkflowStep[];
  timeout_policy: string;
};

export type ObservabilityPlan = {
  alert_triggers: string[];
  captured_signals: string[];
  cost_tracking: string;
  decision_logging: string;
  duration_tracking: string;
  plan_summary_policy: string;
  result_tracking: string;
  tool_response_logging: string;
};

export type GeneratedDeliverable = {
  content_markdown: string;
  key: string;
  summary: string;
  title: string;
};

export type PatternCatalogEntry = {
  family: string;
  fit_score: number;
  key: string;
  label: string;
  selected: boolean;
  summary: string;
  tradeoffs: string[];
  use_when: string[];
};

export type DecisionTraceEntry = {
  decision_source: string;
  dimension: string;
  evidence: string[];
  rationale: string;
  recommended_label: string;
  recommended_value: string;
  review_note: string;
  selected_label: string;
  selected_value: string;
};

export type ComponentCheckItem = {
  detail: string;
  key: string;
  status: ReviewState;
  title: string;
};

export type ComponentReadinessEntry = {
  blocking_issues: string[];
  checks: ComponentCheckItem[];
  completed_checks: number;
  component: string;
  label: string;
  score: number;
  status: ReviewState;
  total_checks: number;
};

export type RiskSummary = {
  approval_gates_required: number;
  high_risks: number;
  low_risks: number;
  medium_risks: number;
  overall_status: ReviewState;
  side_effect_tools: number;
  summary: string;
  total_checks: number;
};

export type RoadmapMilestone = {
  capabilities: string[];
  objective: string;
  release: string;
  title: string;
  when_to_unlock: string;
};

export type RoadmapEvolution = {
  current_focus: string;
  current_release: string;
  milestones: RoadmapMilestone[];
};

export type BlueprintSectionCoverageEntry = {
  key: string;
  note: string;
  source: string;
  status: ReviewState;
  title: string;
};

export type BlueprintCoverageSummary = {
  covered_sections: number;
  missing_sections: string[];
  overall_status: ReviewState;
  sections: BlueprintSectionCoverageEntry[];
  total_sections: number;
};

export type DeliveryPackage = {
  blueprint_coverage: BlueprintCoverageSummary;
  component_readiness: ComponentReadinessEntry[];
  contract_version: string;
  decision_summary: string;
  decision_trace: DecisionTraceEntry[];
  deliverables: GeneratedDeliverable[];
  observability_plan: ObservabilityPlan;
  pattern_catalog: PatternCatalogEntry[];
  risk_summary: RiskSummary;
  roadmap_evolution: RoadmapEvolution;
  workflow_profile: WorkflowProfile;
};

export type BlueprintArtifact = {
  architecture: string;
  contract_version: string;
  delivery_package: DeliveryPackage;
  guardrails: string[];
  knowledge_profile?: KnowledgeProfile;
  llm_policy?: BlueprintLLMPolicy;
  memory_profile: MemoryProfile;
  memory_strategy: string;
  narrative: string;
  readiness_state: ReviewState;
  reasoning_pattern: string;
  safety_checks: SafetyCheck[];
  tools: BlueprintTool[];
};

export type ToolRecommendationSourceStageVersions = {
  define?: number | null;
  design?: number | null;
  discover?: number | null;
};

export type ToolRecommendationContextDigest = {
  digest_sha256: string;
  constraints_summary: string;
  source_refs: string[];
  workflow_summary: string;
};

export type ToolRecommendationEntry = {
  capability_covered: string;
  classification: string;
  confidence: number;
  contract_seed?: BlueprintTool | null;
  decision_reason: string;
  dependencies: string[];
  incompatibilities: string[];
  redundant_with: string[];
  source_evidence: string[];
  tool_key: string;
  tool_label: string;
};

export type ToolRequirementCoverageEntry = {
  category: string;
  coverage_status: string;
  covered_by_tool_keys: string[];
  priority: string;
  rationale: string;
  requirement_key: string;
  requirement_title: string;
  source_refs: string[];
};

export type ToolDesignRoleCoverageEntry = {
  coverage_status: string;
  covered_by_tool_keys: string[];
  rationale: string;
  responsibility: string;
  role_key: string;
  role_title: string;
  source_refs: string[];
};

export type ToolRecommendationGap = {
  answer_options?: GuidedAnswerOption[];
  gap_key: string;
  impact: string;
  question: string;
  reason: string;
  severity: string;
  suggested_answer?: string;
  title: string;
};

export type ToolRecommendationConfidence = {
  band: string;
  overall: number;
  rationale: string;
};

export type ToolRecommendationReviewDecision = {
  classification: string;
  decision: "approved" | "rejected";
  decision_reason: string;
  tool_key: string;
};

export type ApprovedToolDigestEntry = {
  blueprint_tool_name: string;
  classification: string;
  has_side_effects: boolean;
  integration_kind: string;
  memory_implications: string[];
  owner: string;
  requires_approval: boolean;
  tool_key: string;
  tool_label: string;
};

export type ApprovedToolsDigest = {
  approval_required_tool_keys: string[];
  approved_tool_keys: string[];
  digest_sha256: string;
  digest_version: string;
  knowledge_tool_keys: string[];
  mandatory_tool_keys: string[];
  memory_hints: string[];
  optional_tool_keys: string[];
  promoted_blueprint_version?: number | null;
  recommended_memory_strategy: string;
  retrieval_scopes: string[];
  selected_blueprint_tool_names: string[];
  side_effect_tool_keys: string[];
  source_blueprint_version?: number | null;
  source_session_id?: string | null;
  summary: string;
  tool_count: number;
};

export type ToolRecommendationFinding = {
  affected_tool_keys: string[];
  category: string;
  detail: string;
  finding_key: string;
  severity: "info" | "warning" | "blocking";
  suggested_action: string;
  title: string;
};

export type ToolRecommendationEvaluation = {
  compatibility_status: ReviewState;
  coverage_status: ReviewState;
  findings: ToolRecommendationFinding[];
  governance_status: ReviewState;
  minimality_status: ReviewState;
  overall_status: ReviewState;
  promotion_blocked: boolean;
  recommended_actions: string[];
  summary: string;
};

export type ToolPreflightCapability = {
  capability_key: string;
  confidence: number;
  label: string;
  reason: string;
  required: boolean;
  source_evidence: string[];
};

export type ToolFamilyCandidate = {
  estimated_complexity: string;
  family_key: string;
  label: string;
  matched_signals: string[];
  reason: string;
  rejected_by_constraints: string[];
  status: string;
  suggested_tool_keys: string[];
  supported_capabilities: string[];
};

export type ToolRecommendationPreflight = {
  agent_goal: string;
  approval_boundaries: string[];
  candidate_tool_families: ToolFamilyCandidate[];
  case_classification: string;
  core_workflows: string[];
  forbidden_capabilities: string[];
  hard_constraints: string[];
  interaction_modes: string[];
  mandatory_capabilities: ToolPreflightCapability[];
  missing_information: ToolRecommendationGap[];
  primary_user: string;
  required_information_sources: string[];
  required_write_actions: string[];
};

export type ToolRecommendationArtifact = {
  approved_tools_digest?: ApprovedToolsDigest | null;
  confidence: ToolRecommendationConfidence;
  context_digest: ToolRecommendationContextDigest;
  current_blueprint_version?: number | null;
  design_role_coverage: ToolDesignRoleCoverageEntry[];
  coverage_gaps: ToolRecommendationGap[];
  evaluation: ToolRecommendationEvaluation;
  generation_instructions?: string;
  is_stale: boolean;
  needs_information: ToolRecommendationGap[];
  optional_tools: ToolRecommendationEntry[];
  preflight: ToolRecommendationPreflight;
  recommended_tools: ToolRecommendationEntry[];
  rejected_tools: ToolRecommendationEntry[];
  requirements_coverage: ToolRequirementCoverageEntry[];
  review_decisions: ToolRecommendationReviewDecision[];
  review_state: ReviewState;
  schema_version: string;
  source_blueprint_version?: number | null;
  source_session_id?: string | null;
  source_stage_versions: ToolRecommendationSourceStageVersions;
  stale_reasons: string[];
  summary: string;
};

export type MemoryRecommendationSourceStageVersions = {
  define?: number | null;
  design?: number | null;
  discover?: number | null;
  tools?: number | null;
};

export type MemoryNeedDecision = {
  mode: string;
  rationale: string;
  required: boolean;
  source_refs: string[];
  summary: string;
};

export type MemoryLayerDesign = {
  compaction_policy: string;
  label: string;
  layer_key: string;
  owner: string;
  read_paths: string[];
  retention_policy: string;
  stores: string[];
  summary: string;
  write_triggers: string[];
};

export type MemoryKnowledgeDesign = {
  approved_sources: KnowledgeSource[];
  embedding_policy: EmbeddingPolicy;
  grounding_policy: GroundingPolicy;
  ingestion_policy: IngestionPolicy;
  mode: string;
  notes: string[];
  rag_required: boolean;
  refresh_policy: RefreshPolicy;
  retrieval_policy: RetrievalPolicyProfile;
  source_scope: string;
  summary: string;
};

export type MemoryContextBudgetEntry = {
  max_context_tokens: number;
  max_retrieved_sources: number;
  max_short_term_items: number;
  role: string;
  source_refs: string[];
  strategy: string;
  task_kind: string;
};

export type MemoryWriteReadRule = {
  compact_when: string;
  do_not_write_when: string;
  owner: string;
  read_when: string;
  scope: string;
  write_when: string;
};

export type MemoryRetentionDeletionRule = {
  deletion_policy: string;
  residency: string;
  retention_policy: string;
  scope: string;
  source_refs: string[];
  ttl_policy: string;
};

export type MemorySensitivityIsolationRule = {
  data_classes: string[];
  isolation_mode: string;
  restrictions: string[];
  scope: string;
  source_refs: string[];
};

export type MemoryToolDependency = {
  capabilities: string[];
  reason: string;
  required: boolean;
  status: string;
  tool_key: string;
};

export type MemoryRecommendationFinding = {
  category: string;
  detail: string;
  finding_key: string;
  severity: "info" | "warning" | "blocking";
  source_refs: string[];
  suggested_action: string;
  title: string;
};

export type MemoryRecommendationConfidence = {
  band: string;
  overall: number;
  rationale: string;
};

export type MemoryDryCompileStatus = {
  blocking_issues: string[];
  generated_contracts: string[];
  status: string;
  summary: string;
};

export type MemoryRecommendationArtifact = {
  confidence: MemoryRecommendationConfidence;
  context_budget_plan: MemoryContextBudgetEntry[];
  critic_findings: MemoryRecommendationFinding[];
  current_blueprint_version?: number | null;
  dry_compile_status: MemoryDryCompileStatus;
  evidence_refs: string[];
  generation_instructions?: string;
  guided_questions?: GuidedQuestion[];
  is_stale: boolean;
  knowledge_design: MemoryKnowledgeDesign;
  long_term_design: MemoryLayerDesign;
  memory_need_decision: MemoryNeedDecision;
  missing_information: string[];
  open_questions: string[];
  proposed_knowledge_profile: KnowledgeProfile;
  proposed_memory_profile: MemoryProfile;
  review_state: ReviewState;
  retention_and_deletion: MemoryRetentionDeletionRule[];
  schema_version: string;
  sensitivity_and_isolation: MemorySensitivityIsolationRule[];
  short_term_design: MemoryLayerDesign;
  source_blueprint_version?: number | null;
  source_session_id?: string | null;
  source_stage_versions: MemoryRecommendationSourceStageVersions;
  stale_reasons: string[];
  summary: string;
  tool_dependencies: MemoryToolDependency[];
  working_memory_design: MemoryLayerDesign;
  write_read_matrix: MemoryWriteReadRule[];
};

export type ApproveToolsSelectionRequest = {
  include_optional_tool_keys: string[];
};

export type ToolRecommendationRequest = {
  instructions?: string;
};

export type MemoryRecommendationRequest = {
  instructions?: string;
};

export type BlueprintPatchRequest = {
  architecture?: string;
  delivery_package?: DeliveryPackage;
  guardrails?: string[];
  knowledge_profile?: KnowledgeProfile;
  llm_policy?: BlueprintLLMPolicy;
  memory_profile?: MemoryProfile;
  memory_strategy?: string;
  narrative?: string;
  readiness_state?: ReviewState;
  reasoning_pattern?: string;
  safety_checks?: SafetyCheck[];
  tools?: BlueprintTool[];
};

export type EvidenceItem = {
  detail: string;
  source: string;
};

export type OperationEnvelope<TData> = {
  assumptions: string[];
  data: TData;
  evidence: EvidenceItem[];
  missing_fields: string[];
  next_action: string;
  stage: SessionStage;
  status: ArtifactStatus;
  warnings: string[];
};

export type DiscoveryEnvelope = OperationEnvelope<DiscoveryArtifact>;
export type CanvasEnvelope = OperationEnvelope<CanvasArtifact>;
export type BlueprintEnvelope = OperationEnvelope<BlueprintArtifact>;
export type EvaluationEnvelope = OperationEnvelope<EvaluationArtifact>;
export type EstimationEnvelope = OperationEnvelope<EstimationReportArtifact>;
export type ToolRecommendationEnvelope = OperationEnvelope<ToolRecommendationArtifact>;

export type EvaluationCase = {
  category: string;
  expected_result: string;
  name: string;
  scenario: string;
};

export type EvaluationArtifact = {
  cases: EvaluationCase[];
  coherence_status: ReviewState;
  completeness_status: ReviewState;
  gaps: string[];
  recommendations: string[];
  scores: Record<string, number>;
};

export type EvaluationDatasetCase = {
  case_key: string;
  category: string;
  expected_result: string;
  id?: string | null;
  is_active: boolean;
  priority: string;
  scenario: string;
  source: string;
  title: string;
};

export type EvaluationDatasetArtifact = {
  blueprint_version_number?: number | null;
  cases: EvaluationDatasetCase[];
  id?: string | null;
  source_action: string;
  status: ArtifactStatus;
  summary: string;
  version_number: number;
};

export type EvaluationRubricDimension = {
  description: string;
  hard_block: boolean;
  key: string;
  label: string;
  weight: number;
};

export type EvaluationRubricArtifact = {
  blueprint_version_number?: number | null;
  dimensions: EvaluationRubricDimension[];
  id?: string | null;
  source_action: string;
  summary: string;
  version_number: number;
};

export type EvaluationCaseResult = {
  blocking_issues: string[];
  case_key: string;
  category: string;
  evidence: string[];
  observed_result: string;
  recommendations: string[];
  score: number;
  status: ArtifactStatus;
  summary: string;
  title: string;
};

export type EvaluationRunSummary = {
  blocking_issues: string[];
  blueprint_version_number?: number | null;
  category_scores: Record<string, number>;
  dataset_version_number: number;
  dimension_scores: Record<string, number>;
  overall_score: number;
  recommendations: string[];
  results: EvaluationCaseResult[];
  rubric_version_number: number;
  source_action: string;
  status: ArtifactStatus;
  summary: string;
};

export type EvaluationRunEntry = EvaluationRunSummary & {
  created_at: string;
  id: string;
};

export type SimulationNodeType = "agent" | "decision" | "tool" | "memory" | "human" | "end";
export type SimulationEventType =
  | "start"
  | "input"
  | "decision"
  | "tool_call"
  | "tool_result"
  | "memory_read"
  | "memory_write"
  | "approval_gate"
  | "agent_response"
  | "fault_injected"
  | "issue"
  | "end";
export type SimulationEventTone = "info" | "success" | "warning" | "error" | "blocked";
export type SimulationRunOutcome = "pass" | "needs_revision" | "fail";
export type SimulationExecutionState = "running" | "paused" | "completed";

export type SimulationNode = {
  description: string;
  label: string;
  node_key: string;
  node_type: SimulationNodeType;
  tags: string[];
  x: number;
  y: number;
};

export type SimulationEdge = {
  condition: string;
  edge_key: string;
  from_node_key: string;
  label: string;
  to_node_key: string;
  transition_type: string;
};

export type SimulationScenario = {
  actor: string;
  approval_gates: string[];
  blocking_failures: string[];
  decision_criteria: string[];
  edges: SimulationEdge[];
  expected_outcome: string;
  initial_input: string;
  memory_reads: string[];
  memory_writes: string[];
  nodes: SimulationNode[];
  objective: string;
  preconditions: string[];
  priority: string;
  scenario_key: string;
  simulated_tool_responses: string[];
  source_refs: string[];
  state_transitions: string[];
  success_criteria: string[];
  suggested_injections: string[];
  title: string;
  tools_invoked: string[];
};

export type SimulationSpecificationArtifact = {
  confidence: number;
  coverage_gaps: string[];
  missing_information: string[];
  review_state: ReviewState;
  scenarios: SimulationScenario[];
  schema_version: string;
  source_blueprint_version?: number | null;
  source_stage_versions: Record<string, number | null>;
  summary: string;
  warnings: string[];
};

export type SimulationEvent = {
  actor: string;
  detail: string;
  event_index: number;
  event_key: string;
  event_type: SimulationEventType;
  node_key: string;
  payload: Record<string, unknown>;
  title: string;
  tone: SimulationEventTone;
};

export type SimulationJudgementFinding = {
  detail: string;
  finding_key: string;
  severity: string;
  source_refs: string[];
  suggested_action: string;
  title: string;
};

export type SimulationJudgement = {
  final_status: SimulationRunOutcome;
  findings: SimulationJudgementFinding[];
  hard_gate_findings: string[];
  hard_gate_status: SimulationRunOutcome;
  llm_judgment: SimulationRunOutcome;
  scenario_key: string;
  score: number;
  summary: string;
};

export type SimulationRunRecord = {
  active_node_key: string;
  blueprint_version_number?: number | null;
  created_at: string;
  deterministic_signature: string;
  events: SimulationEvent[];
  execution_state: SimulationExecutionState;
  final_status: SimulationRunOutcome;
  hard_gate_status: SimulationRunOutcome;
  id: string;
  injected_conditions: string[];
  is_stale: boolean;
  judgement?: SimulationJudgement | null;
  scenario_key: string;
  scenario_title: string;
  scenario_version_number: number;
  source_action: string;
  specification_artifact_id?: string | null;
  stale_reasons: string[];
  status: ArtifactStatus;
  summary: string;
  updated_at: string;
};

export type EvaluationDatasetUpdateRequest = {
  cases: EvaluationDatasetCase[];
};

export type EvaluationRubricUpdateRequest = {
  dimensions: EvaluationRubricDimension[];
  summary?: string | null;
};

export type ValidationScenarioGenerationRequest = {
  focus_areas?: string[];
  instructions?: string;
};

export type ValidationSimulationRunRequest = {
  initial_input_override?: string;
  injected_conditions?: string[];
  scenario_key: string;
  scenario_version_number?: number | null;
};

export type ValidationSimulationEventInjectionRequest = {
  injection_type: string;
  note?: string;
  run_id: string;
};

export type ValidationSimulationJudgeRequest = {
  run_id: string;
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

export type EstimateScenarioBase = {
  assumptions: string[];
  estimated_cost: number;
  estimated_duration_weeks: number;
  estimated_hours_total: number;
  scenario_type: "traditional" | "agentic";
  team_shape: string[];
  warnings: string[];
  workstream_breakdown: WorkstreamEstimate[];
};

export type TraditionalEstimate = EstimateScenarioBase;

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

export type AgenticEstimate = EstimateScenarioBase & {
  active_provider: string;
  acp_package_readiness_percent: number;
  automation_assessments: AutomationFamilyAssessment[];
  automation_coverage_percent: number;
  automation_coverage_by_artifact_family: Record<string, number>;
  automation_coverage_by_workstream: Record<string, number>;
  blueprint_design_coverage_percent: number;
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
  implementation_scope_coverage_percent: number;
  tool_runtime_cost_usd: number;
  tooling_cost_usd: number;
};

export type ConfidenceBreakdown = {
  assumptions_count: number;
  blocking_gaps: number;
  design_gap_count?: number;
  design_open_questions?: number;
  implementation_gap_count?: number;
  implementation_open_questions?: number;
  label: string;
  negative_signals: string[];
  open_questions: number;
  positive_signals: string[];
  recommended_next_actions: string[];
  score: number;
  subscores: Record<string, number>;
  uncertainty_band_percent: number;
};

export type EstimationComplexityDriver = {
  driver_key: string;
  evidence_refs: string[];
  impact_level: "low" | "medium" | "high";
  summary: string;
  title: string;
  workstream_key: string;
};

export type EstimationRiskRegisterEntry = {
  evidence_refs: string[];
  impact: string;
  likelihood: "low" | "medium" | "high";
  mitigation: string;
  risk_key: string;
  severity: "low" | "medium" | "high";
  title: string;
};

export type EstimationUncertaintyFactor = {
  category: string;
  evidence_refs: string[];
  factor_key: string;
  impact_area: "scope" | "schedule" | "cost" | "confidence" | "operations";
  summary: string;
  title: string;
};

export type EstimationBenchmarkRef = {
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

export type EstimationScenarioAdjustment = {
  cost_multiplier: number;
  duration_multiplier: number;
  evidence_refs: string[];
  hours_multiplier: number;
  rationale: string;
  scenario_key: "optimistic" | "base" | "conservative";
};

export type EstimationSavingsOpportunity = {
  evidence_refs: string[];
  expected_impact: string;
  opportunity_key: string;
  prerequisites: string[];
  summary: string;
  title: string;
};

export type EstimationQuestion = {
  blocking: boolean;
  question: string;
  question_key: string;
  rationale: string;
};

export type EstimationConfidenceAdjustmentProposal = {
  evidence_refs: string[];
  proposed_score_delta: number;
  proposed_uncertainty_band_delta: number;
  rationale: string;
};

export type EstimationAnalysisArtifact = {
  assumptions: string[];
  benchmark_refs: EstimationBenchmarkRef[];
  complexity_drivers: EstimationComplexityDriver[];
  confidence_adjustment_proposal: EstimationConfidenceAdjustmentProposal;
  evidence_refs: string[];
  questions: EstimationQuestion[];
  risk_register: EstimationRiskRegisterEntry[];
  savings_opportunities: EstimationSavingsOpportunity[];
  scenario_adjustments: EstimationScenarioAdjustment[];
  schema_version: string;
  summary: string;
  uncertainty_factors: EstimationUncertaintyFactor[];
};

export type EstimationAnalysisDecision = {
  decision: "pending" | "accepted" | "rejected";
  decided_at?: string | null;
  note: string;
};

export type EstimationConstructionScenario = {
  automation_leverage_percent: number;
  cost_savings_vs_traditional: number;
  description: string;
  effort_reduction_vs_traditional_percent: number;
  estimated_cost: number;
  estimated_duration_weeks: number;
  estimated_hours_total: number;
  human_intervention_percent: number;
  label: string;
  notes: string[];
  scenario_key:
    | "traditional_blueprint"
    | "blueprint_basic"
    | "blueprint_premium"
    | "agentic_blueprint"
    | "acp_manual"
    | "acp_agentic"
    | "done_for_you_factory";
};

export type CommercialEventRequest = {
  event_key: string;
  metadata?: Record<string, unknown>;
  product?: string;
  source?: string;
};

export type CommercialEntitlementStatus =
  | "pending_activation"
  | "active"
  | "suspended"
  | "expired"
  | "revoked"
  | "refunded";

export type CommercialOrderStatus = "pending" | "paid" | "failed" | "canceled" | "refunded";

export type CommercialProductType = "blueprint" | "acp";

export type CommercialPriceResponse = {
  billing_period: string;
  currency: string;
  price_code: string;
  unit_amount_cents: number;
  version: number;
};

export type CommercialProductResponse = {
  benefits: string[];
  capabilities: string[];
  description: string;
  exclusions: string[];
  name: string;
  price?: CommercialPriceResponse | null;
  product_key: string;
  product_type: CommercialProductType;
  scope: string;
  tier: CommercialTier;
  version: number;
};

export type CommercialEntitlementSummary = {
  ends_at?: string | null;
  id: string;
  non_revenue: boolean;
  product_key: string;
  purchase_ref: string;
  scope: string;
  source: string;
  starts_at: string;
  status: CommercialEntitlementStatus;
  tier: CommercialTier;
};

export type CommercialCapabilityDecisionEntry = {
  allowed: boolean;
  capability: string;
  cta_label: string;
  current_tier: CommercialTier;
  label: string;
  product: string;
  reason_code: string;
  required_tier: CommercialTier;
};

export type CommercialAccessSnapshotV2 = {
  capabilities: CommercialCapabilityDecisionEntry[];
  checkout_state: string;
  contract_version: "commercial-access.v2";
  entitlements: CommercialEntitlementSummary[];
  purchase_refs: string[];
  reason_code: string;
  role?: "owner" | "admin" | "editor" | "viewer" | null;
  session_id?: string | null;
  tier: CommercialTier;
  tier_label: string;
  user_id?: string | null;
  workspace_id?: string | null;
};

export type CommercialCheckoutSessionRequest = {
  cancel_url?: string;
  idempotency_key?: string;
  package_code?: string;
  price_code?: string;
  product_key: string;
  provider?: "sandbox" | "hotmart";
  session_id: string;
  success_url?: string;
};

export type CommercialCheckoutSessionResponse = {
  checkout_ref: string;
  checkout_url: string;
  contract_version: "commerce-checkout-session.v1";
  currency: string;
  entitlement?: CommercialEntitlementSummary | null;
  expires_at?: string | null;
  next_action: string;
  order_id: string;
  product_key: string;
  provider: string;
  session_id: string;
  status: CommercialOrderStatus;
  total_cents: number;
  workspace_id: string;
};

export type CommercialCheckoutCompletionRequest = {
  outcome: "success" | "failure" | "cancel";
  provider_payment_id?: string;
};

export type CommercialOrderLineResponse = {
  price_code: string;
  product_key: string;
  quantity: number;
  total_amount_cents: number;
};

export type CommercialOrderResponse = {
  buyer_user_id: string;
  checkout_ref: string;
  checkout_url: string;
  created_at: string;
  currency: string;
  entitlement?: CommercialEntitlementSummary | null;
  id: string;
  lines: CommercialOrderLineResponse[];
  provider: string;
  session_id?: string | null;
  status: CommercialOrderStatus;
  total_cents: number;
  updated_at: string;
  workspace_id: string;
};

export type ProductOverviewItem = {
  access_state: string;
  cta_label: string;
  detail: string;
  href: string;
  key: string;
  label: string;
  progress_percent: number;
  status: string;
};

export type ProductAttentionItem = {
  href: string;
  key: string;
  reason: string;
  severity: "info" | "warning" | "blocking";
  stage: string;
  title: string;
};

export type ProductOverviewResponse = {
  access: CommercialAccessSnapshotV2;
  active_stage: string;
  attention: ProductAttentionItem[];
  contract_version: "product-overview.v1";
  exports: ProductOverviewItem[];
  generated_at: string;
  lean_progress_percent: number;
  navigation: ProductOverviewItem[];
  products: ProductOverviewItem[];
  project_title: string;
  session_id: string;
  workspace_id: string;
};

export type BlueprintResultResponse = {
  access: CommercialAccessSnapshotV2;
  architecture_sample: string;
  contract_version: "blueprint-result.v1";
  diagrams: DiagramCatalogEntry[];
  estimation: Record<string, unknown>;
  generated_at: string;
  protection: Record<string, unknown>;
  sections: Array<Record<string, unknown>>;
  session_id: string;
  stale: boolean;
  state: string;
  summary: string;
  title: string;
  version_number?: number | null;
  workspace_id: string;
};

export type ProductOfferResponse = {
  access: CommercialAccessSnapshotV2;
  can_checkout: boolean;
  checkout_disabled_reason: string;
  comparison: Record<string, unknown>;
  contract_version: "product-offer.v1";
  generated_at: string;
  product: CommercialProductResponse;
  session_id: string;
  workspace_id: string;
};

export type AcpInvitationResponse = {
  access: CommercialAccessSnapshotV2;
  benefits: string[];
  comparison: Record<string, unknown>;
  contract_version: "acp-invitation.v1";
  generated_at: string;
  metrics: Record<string, unknown>;
  next_action: string;
  session_id: string;
  state: string;
  workspace_id: string;
};

export type CommercialAuditMetric = {
  detail: string;
  key: string;
  label: string;
  tone: "blue" | "green" | "orange" | "red" | "slate" | "violet";
  unit: string;
  value: number | string;
};

export type CommercialAuditFunnelStep = {
  completed: boolean;
  conversion_percent: number;
  count: number;
  event_keys: string[];
  key: string;
  label: string;
  latest_at?: string | null;
  product: string;
};

export type CommercialAuditProductSummary = {
  blocked_events: number;
  cta_clicks: number;
  exports: number;
  product: string;
  purchases: number;
  views: number;
};

export type CommercialAuditEventEntry = {
  created_at: string;
  event_key: string;
  message: string;
  metadata: Record<string, unknown>;
  product: string;
  source: string;
  stage: SessionStage;
  status: ArtifactStatus;
};

export type CommercialAuditReport = {
  contract_version: "commercial-audit.v1";
  current_tier: CommercialTier;
  funnel: CommercialAuditFunnelStep[];
  generated_at: string;
  metrics: CommercialAuditMetric[];
  product_summary: CommercialAuditProductSummary[];
  recent_events: CommercialAuditEventEntry[];
  redaction_policy: string;
  requested_by_user_id?: string | null;
  session_id: string;
  warnings: string[];
  workspace_id?: string | null;
};

export type EstimationDeterministicInputs = {
  benchmark_corpus_hash: string;
  benchmark_ids: string[];
  calibration_sample_size: number;
  catalogs_used: string[];
  formula_notes: string[];
  pricing_catalog_signature: string;
  validation_fingerprint: string;
};

export type EstimationPackagePolicyState = {
  can_continue_to_package: boolean;
  commercial_blocked: boolean;
  package_block_reasons: string[];
  preliminary: boolean;
};

export type EstimationReportArtifact = {
  agentic: AgenticEstimate;
  analysis?: EstimationAnalysisArtifact | null;
  analysis_decision: EstimationAnalysisDecision;
  assumptions: string[];
  base_confidence?: ConfidenceBreakdown | null;
  blueprint_version_number?: number | null;
  confidence: ConfidenceBreakdown;
  contract_version: string;
  construction_scenarios?: EstimationConstructionScenario[];
  current_blueprint_version_number?: number | null;
  deterministic_inputs: EstimationDeterministicInputs;
  generated_at?: string | null;
  is_stale: boolean;
  maturity_stage: "canvas" | "blueprint" | "ready_to_build";
  notes: string[];
  package_policy: EstimationPackagePolicyState;
  risk_drivers: string[];
  stale_reasons: string[];
  source_artifacts: string[];
  traditional: TraditionalEstimate;
};

export type EstimationRunEntry = {
  active_provider: string;
  agentic_cost_total: number;
  agentic_duration_weeks: number;
  agentic_hours_total: number;
  automation_coverage_percent: number;
  blueprint_version_number?: number | null;
  confidence_label: string;
  confidence_score: number;
  created_at: string;
  id: string;
  maturity_stage: "canvas" | "blueprint" | "ready_to_build";
  pricing_policy: string;
  source_action: string;
  traditional_cost_total: number;
  traditional_duration_weeks: number;
  traditional_hours_total: number;
  uncertainty_band_percent: number;
};

export type ProjectActualsEntry = {
  actual_automation_coverage_percent: number;
  actual_cost_total: number;
  actual_duration_weeks: number;
  actual_hours_total: number;
  actual_provider?: string | null;
  created_at: string;
  delivery_mode: "traditional" | "agentic";
  estimation_run_id: string;
  id: string;
  notes: string;
  updated_at: string;
};

export type EstimationActualsUpsertRequest = {
  actual_automation_coverage_percent: number;
  actual_cost_total: number;
  actual_duration_weeks: number;
  actual_hours_total: number;
  actual_provider?: string | null;
  delivery_mode: "traditional" | "agentic";
  estimation_run_id: string;
  notes: string;
};

export type EstimationAnalysisDecisionRequest = {
  decision: "accepted" | "rejected";
  note: string;
};

export type EstimationErrorMetricEntry = {
  absolute_percentage_error_automation: number;
  absolute_percentage_error_cost: number;
  absolute_percentage_error_duration: number;
  absolute_percentage_error_hours: number;
  active_provider?: string | null;
  band_hit_cost: boolean;
  band_hit_duration: boolean;
  band_hit_hours: boolean;
  band_hit_overall: boolean;
  bias_automation_percent: number;
  bias_cost_percent: number;
  bias_duration_percent: number;
  bias_hours_percent: number;
  created_at: string;
  estimation_run_id: string;
  id: string;
  maturity_stage: "canvas" | "blueprint" | "ready_to_build";
  scenario_type: "traditional" | "agentic";
  updated_at: string;
};

export type ACPFileStatus = "complete" | "incomplete" | "needs_review";
export type ACPValidationSeverity = "info" | "warning" | "error";
export type ConstructionQuestionStatus = "open" | "answered" | "resolved";
export type ConstructionGapSeverity = "info" | "warning" | "blocking";
export type ConstructionGapStatus = "open" | "answered" | "waived" | "resolved";
export type ConstructionReadinessStatus = "not_started" | "needs_questions" | "blocked" | "ready_to_build";
export type AcpExportProfile = "blueprint-professional" | "acp-portable" | "acp-full" | "design-only" | "extended";
export type HandoffStatus = "pending" | "completed" | "returned";

export type ACPFileEntry = {
  content_hash: string;
  content_text: string;
  domain: string;
  format: string;
  missing_fields: string[];
  path: string;
  source_sections: string[];
  status: ACPFileStatus;
  title: string;
  warnings: string[];
};

export type ACPValidationIssue = {
  blocking: boolean;
  code: string;
  message: string;
  path: string;
  remediation: string;
  severity: ACPValidationSeverity;
  source_sections: string[];
};

export type ACPValidationReport = {
  can_export_zip: boolean;
  completeness_percent: number;
  issues: ACPValidationIssue[];
  overall_status: ACPFileStatus;
};

export type ConstructionQuestionOption = {
  key: string;
  label: string;
  description: string;
  impact: string;
  example: string;
  recommended?: boolean;
  confidence?: number;
  source_refs?: string[];
};

export type ConstructionQuestionEntry = {
  blocking: boolean;
  expected_answer_format: string;
  question_key: string;
  question_text: string;
  rationale: string;
  target_owner: string;
  purpose?: string;
  options?: ConstructionQuestionOption[];
};

export type ConstructionQuestionViewEntry = {
  answer_text: string;
  answered_at?: string | null;
  answered_by_display: string;
  blocking: boolean;
  domain: string;
  gap_key: string;
  gap_title: string;
  impacted_artifacts: string[];
  owner_role: string;
  question_key: string;
  question_text: string;
  rationale: string;
  resolved_at?: string | null;
  expected_answer_format: string;
  status: ConstructionQuestionStatus;
  target_owner: string;
  purpose?: string;
  options?: ConstructionQuestionOption[];
};

export type ConstructionQuestionAnswerRequest = {
  answer_text: string;
  impacted_artifacts: string[];
  owner_role: string;
};

export type ConstructionGapEntry = {
  blocking_stage: string;
  closure_criteria: string[];
  current_assumptions: string[];
  domain: string;
  evidence_paths: string[];
  gap_key: string;
  questions: ConstructionQuestionEntry[];
  remediation: string;
  severity: ConstructionGapSeverity;
  source_sections: string[];
  status: ConstructionGapStatus;
  summary: string;
  title: string;
};

export type ConstructionReadinessReport = {
  assumptions_count: number;
  blocking_gaps: number;
  can_start_build: boolean;
  gaps: ConstructionGapEntry[];
  next_recommended_action: string;
  open_questions: number;
  overall_status: ConstructionReadinessStatus;
};

export type ACPPreview = {
  blueprint_version_number?: number | null;
  construction_readiness: ConstructionReadinessReport;
  files: ACPFileEntry[];
  manifest_path: string;
  package_version: string;
  session_id: string;
  validation: ACPValidationReport;
};

export type BlueprintGraphNodeEntry = {
  description: string;
  id: string;
  label: string;
  properties: Record<string, unknown>;
  source_artifacts: string[];
  type: string;
};

export type BlueprintGraphEdgeEntry = {
  description: string;
  source: string;
  source_artifacts: string[];
  target: string;
  type: string;
};

export type BlueprintKnowledgeGraph = {
  edges: BlueprintGraphEdgeEntry[];
  generated_at: string;
  generated_from_session_id: string;
  graph_version: string;
  nodes: BlueprintGraphNodeEntry[];
};

export type SkillDefinition = {
  evidence_policy: string;
  input_schema: Record<string, unknown>;
  is_active: boolean;
  label: string;
  output_schema: Record<string, unknown>;
  skill_key: string;
  stage_hint: string;
  summary: string;
};

export type SkillRunArtifact = {
  artifact_kind: string;
  artifact_role: string;
  payload: Record<string, unknown>;
};

export type SkillRunEntry = {
  artifacts: SkillRunArtifact[];
  blueprint_version_number?: number | null;
  created_at: string;
  duration_ms: number;
  evidence: EvidenceItem[];
  id: string;
  label: string;
  result_summary: string;
  skill_key: string;
  source_action: string;
  stage: SessionStage;
  status: ArtifactStatus;
  warnings: string[];
};

export type ArtifactRecordEntry = {
  artifact_key: string;
  artifact_kind: string;
  artifact_metadata: Record<string, unknown>;
  artifact_title: string;
  blueprint_version_number?: number | null;
  content_hash: string;
  content_text: string;
  created_at: string;
  export_format: string;
  id: string;
  source_action: string;
  stage: SessionStage;
};

export type DiagramAccessState =
  | "unlocked"
  | "sample"
  | "locked_blueprint"
  | "locked_acp"
  | "stage_locked"
  | "not_generated";

export type DiagramGenerationState = "generated" | "planned" | "pending_generation" | "not_generated";

export type DiagramContentProtection = {
  disable_copy: boolean;
  disable_context_menu: boolean;
  disable_download: boolean;
  watermark_sample: boolean;
};

export type DiagramUpsellMessage = {
  cta_label: string;
  message: string;
  product: string;
  target_tier: CommercialTier;
  title: string;
};

export type DiagramCatalogEntry = {
  access_state: DiagramAccessState;
  available_content_formats: string[];
  available_formats: string[];
  category: string;
  diagram_key: string;
  diagram_surface: string;
  enabled_from_stage: string;
  generation_state: DiagramGenerationState;
  locked_reason: string;
  preferred_format: string;
  preview_thumbnail?: string | null;
  product_scope: string[];
  protection: DiagramContentProtection;
  required_tier: CommercialTier;
  source_artifact_count: number;
  source_paths: string[];
  summary: string;
  title: string;
  upgrade_cta_label: string;
  upsell?: DiagramUpsellMessage | null;
};

export type DiagramCatalogResponse = {
  current_stage: string;
  entries: DiagramCatalogEntry[];
  locked_count: number;
  pending_count: number;
  sample_count: number;
  session_id: string;
  tier: CommercialTier;
  total_count: number;
  unlocked_count: number;
  workspace_id: string;
};

export type DiagramContentResponse = {
  access_state: DiagramAccessState;
  asset_url?: string | null;
  content?: string | null;
  diagram_key: string;
  format: string;
  generation_state: DiagramGenerationState;
  metadata: Record<string, unknown>;
  protection: DiagramContentProtection;
  upsell?: DiagramUpsellMessage | null;
};

export type JourneyArtifactState =
  | "generated"
  | "reviewed"
  | "approved"
  | "rejected"
  | "stale"
  | "approved_legacy"
  | "needs_review_legacy";

export type JourneyDecisionType =
  | "create"
  | "patch"
  | "approve"
  | "reject"
  | "replace"
  | "mark_stale"
  | "backfill_legacy";

export type JourneyStageKey =
  | "discover"
  | "define"
  | "design"
  | "tools"
  | "memory"
  | "validate"
  | "estimate"
  | "build";

export type JourneyArtifactEvidenceEntry = {
  artifact_ref: string;
  authority_level: string;
  citation_label: string;
  detail: string;
  retrieval_score?: number | null;
  section_key: string;
  source_id: string;
  source_lineage: string[];
  source_type: string;
  source_version: string;
  used_for: string;
};

export type JourneyStageDecisionEntry = {
  actor_user_id?: string | null;
  artifact_id: string;
  created_at: string;
  decision_type: JourneyDecisionType;
  id: string;
  next_state?: JourneyArtifactState | null;
  note: string;
  payload: Record<string, unknown>;
  previous_state?: JourneyArtifactState | null;
  stage_key: JourneyStageKey;
};

export type JourneyStageArtifactEntry = {
  approved_at?: string | null;
  approved_by_user_id?: string | null;
  artifact_kind: string;
  based_on_artifact_id?: string | null;
  confidence?: number | null;
  context_fingerprint: string;
  corpus_hash: string;
  created_at: string;
  decisions: JourneyStageDecisionEntry[];
  evidence_manifest: JourneyArtifactEvidenceEntry[];
  execution_backend: string;
  id: string;
  input_fingerprint: string;
  missing_information: string[];
  model: string;
  output_fingerprint: string;
  prompt_version: string;
  proposal_payload: Record<string, unknown>;
  provider_key: string;
  rejected_at?: string | null;
  reviewed_at?: string | null;
  schema_version: string;
  session_id: string;
  source_action: string;
  source_stage_versions: Record<string, unknown>;
  stage_key: JourneyStageKey;
  stale_at?: string | null;
  stale_reasons: string[];
  state: JourneyArtifactState;
  superseded_by_artifact_id?: string | null;
  updated_at: string;
  user_patch: Record<string, unknown>;
  version_number: number;
  warnings: string[];
  workspace_id: string;
};

export type JourneyStageArtifactListResponse = {
  items: JourneyStageArtifactEntry[];
  latest?: JourneyStageArtifactEntry | null;
};

export type BlueprintConsistencyIssue = {
  affected_stage_keys: string[];
  category: string;
  citations: string[];
  detail: string;
  issue_key: string;
  severity: "info" | "warning" | "blocking";
  source_refs: string[];
  title: string;
};

export type ApprovedStageLineageEntry = {
  approved_at?: string | null;
  artifact_id?: string | null;
  artifact_kind: string;
  citation_labels: string[];
  decision_count: number;
  lineage_refs: string[];
  rejection_count: number;
  source_action: string;
  stage_key: string;
  state: string;
  version_number?: number | null;
};

export type BlueprintConsistencyReport = {
  approved_stage_lineage: ApprovedStageLineageEntry[];
  blocking_issues: string[];
  decision_history: Record<string, unknown>[];
  exportable_lineage: string[];
  generated_from_blueprint_version?: number | null;
  issues: BlueprintConsistencyIssue[];
  orphan_design_role_keys: string[];
  orphan_memory_dependency_keys: string[];
  orphan_tool_keys: string[];
  overall_status: ReviewState;
  restricted_lineage: string[];
  stale_stage_keys: string[];
  summary: string;
  uncovered_requirement_keys: string[];
  warnings: string[];
};

export type JourneyStageArtifactCreateRequest = {
  artifact_kind?: string;
  confidence?: number | null;
  context_fingerprint?: string;
  corpus_hash?: string;
  evidence_manifest?: JourneyArtifactEvidenceEntry[];
  execution_backend?: string;
  input_fingerprint?: string;
  missing_information?: string[];
  model?: string;
  note?: string;
  output_fingerprint?: string;
  prompt_version?: string;
  proposal_payload: Record<string, unknown>;
  provider_key?: string;
  schema_version?: string;
  source_action?: string;
  source_stage_versions?: Record<string, unknown>;
  user_patch?: Record<string, unknown>;
  warnings?: string[];
};

export type JourneyStageArtifactPatchRequest = {
  artifact_kind?: string | null;
  confidence?: number | null;
  context_fingerprint?: string | null;
  corpus_hash?: string | null;
  evidence_manifest?: JourneyArtifactEvidenceEntry[] | null;
  execution_backend?: string | null;
  input_fingerprint?: string | null;
  missing_information?: string[] | null;
  model?: string | null;
  note?: string;
  output_fingerprint?: string | null;
  prompt_version?: string | null;
  proposal_payload?: Record<string, unknown> | null;
  provider_key?: string | null;
  schema_version?: string | null;
  source_stage_versions?: Record<string, unknown> | null;
  user_patch?: Record<string, unknown> | null;
  warnings?: string[] | null;
};

export type JourneyStageArtifactApprovalRequest = {
  decision_payload?: Record<string, unknown>;
  note?: string;
};

export type JourneyStageArtifactRejectionRequest = {
  decision_payload?: Record<string, unknown>;
  note?: string;
};

export type DesignProposalRequest = {
  instructions?: string;
};

export type MetricSnapshotEntry = {
  approvals_pending: number;
  approvals_resolved: number;
  artifact_count: number;
  cost_estimate_usd: number;
  created_at: string;
  error_count: number;
  export_count: number;
  id: string;
  latest_evaluation_score?: number | null;
  latest_evaluation_status: string;
  needs_review_count: number;
  regenerations_count: number;
  source_action: string;
  total_duration_ms: number;
  warning_count: number;
};

export type MemoryObservabilityMetric = {
  denominator: number;
  detail: string;
  key: string;
  label: string;
  numerator: number;
  status: string;
  unit: string;
  value: number;
};

export type MemoryDashboardEntry = {
  average_budget_utilization: number;
  average_compression_gain: number;
  citation_coverage: number;
  grounded_hit_rate: number;
  label: string;
  llm_runs: number;
  scope_key: string;
  stale_rate: number;
};

export type MemoryValidationCheckEntry = {
  check_key: string;
  evidence: string[];
  label: string;
  status: string;
  summary: string;
};

export type MemoryObservabilityReport = {
  by_agent: MemoryDashboardEntry[];
  by_stage: MemoryDashboardEntry[];
  grounded_hit_runs: number;
  llm_run_count: number;
  metrics: MemoryObservabilityMetric[];
  recent_warnings: string[];
  stale_source_count: number;
  traced_source_count: number;
  validations: MemoryValidationCheckEntry[];
};

export type ExecutionLogEntry = {
  created_at: string;
  message: string;
  payload: Record<string, unknown>;
  stage: SessionStage;
  status: ArtifactStatus;
};

export type AlertEventEntry = {
  alert_key: string;
  created_at: string;
  evidence: string[];
  id: string;
  message: string;
  resolved_at?: string | null;
  severity: string;
  status: string;
  title: string;
  updated_at: string;
};

export type IntegrationStatusEntry = {
  checked_at: string;
  configured: boolean;
  detail: string;
  id: string;
  integration_key: string;
  label: string;
  reachable: boolean;
  status: string;
};

export type MonitoringContextBackendEntry = {
  key: string;
  label: string;
  run_count: number;
  share_percent: number;
};

export type MonitoringProviderObservabilityEntry = {
  degraded_count: number;
  effective_context_backend: string;
  execution_backend: string;
  fallback_count: number;
  input_tokens: number;
  long_term_hit_count: number;
  model_name: string;
  output_tokens: number;
  provider_key: string;
  run_count: number;
  total_duration_ms: number;
  total_tokens: number;
};

export type MonitoringStageObservabilityEntry = {
  approved_artifact_count: number;
  average_confidence: number;
  failure_count: number;
  label: string;
  long_term_hit_count: number;
  needs_review_count: number;
  rerun_count: number;
  run_count: number;
  simulation_pass_rate: number;
  simulation_run_count: number;
  stage_key: string;
  stale_artifact_count: number;
  success_count: number;
};

export type MonitoringCapabilityObservabilityEntry = {
  capability_key: string;
  degraded_count: number;
  failure_count: number;
  fallback_count: number;
  label: string;
  long_term_hit_count: number;
  run_count: number;
  success_count: number;
};

export type MonitoringReleaseGateEntry = {
  detail: string;
  evidence: string[];
  gate_key: string;
  label: string;
  status: string;
};

export type MonitoringReleaseObservability = {
  approval_resolution_rate: number;
  auth_or_isolation_error_count: number;
  average_compaction_ratio: number;
  average_latency_ms: number;
  capabilities: MonitoringCapabilityObservabilityEntry[];
  context_backends: MonitoringContextBackendEntry[];
  context_fingerprint_coverage: number;
  degraded_runs: number;
  estimated_cost_usd: number;
  estimation_band_hit_rate: number;
  estimation_error_metric_count: number;
  fallback_rate: number;
  fallback_runs: number;
  long_term_hit_count: number;
  project_actuals_count: number;
  providers: MonitoringProviderObservabilityEntry[];
  real_llm_runs: number;
  release_gates: MonitoringReleaseGateEntry[];
  rerun_count: number;
  simulation_pass_rate: number;
  simulation_run_count: number;
  source_version_coverage: number;
  stages: MonitoringStageObservabilityEntry[];
  stale_artifact_count: number;
  total_input_tokens: number;
  total_llm_runs: number;
  total_output_tokens: number;
  total_tokens: number;
};

export type MonitoringWorkspace = {
  alerts: AlertEventEntry[];
  current_metrics?: MetricSnapshotEntry | null;
  history: MetricSnapshotEntry[];
  integrations: IntegrationStatusEntry[];
  memory_observability?: MemoryObservabilityReport | null;
  recent_errors: ExecutionLogEntry[];
  release_observability?: MonitoringReleaseObservability | null;
};

export type ArtifactBrowserResponse = {
  items: ArtifactRecordEntry[];
};

export type WorkflowTemplateEntry = {
  architecture_scope: string[];
  governance_hints: string[];
  id: string;
  is_active: boolean;
  label: string;
  summary: string;
  supports_approvals: boolean;
  supports_handoffs: boolean;
  template_key: string;
  updated_at: string;
  workflow_profile: WorkflowProfile;
};

export type HandoffRecordEntry = {
  blueprint_version_number?: number | null;
  created_at: string;
  from_stage: SessionStage;
  handoff_key: string;
  id: string;
  owner_role: string;
  resolution_note: string;
  resolved_at?: string | null;
  status: HandoffStatus;
  summary: string;
  title: string;
  to_stage: SessionStage;
  triggered_by: string;
};

export type GovernancePolicyEntry = {
  compliance_status: string;
  evidence: string[];
  id: string;
  is_active: boolean;
  label: string;
  policy_key: string;
  policy_payload: Record<string, unknown>;
  scope: string;
  summary: string;
  updated_at: string;
};

export type SubagentRunEntry = {
  blueprint_version_number?: number | null;
  created_at: string;
  feature_flag_key: string;
  id: string;
  input_payload: Record<string, unknown>;
  output_payload: Record<string, unknown>;
  run_kind: string;
  status: ArtifactStatus;
  summary: string;
  title: string;
};

export type FeatureFlagEntry = {
  description: string;
  enabled: boolean;
  key: string;
  stage_hint: string;
};

export type CatalogItemSummary = {
  item_key: string;
  label: string;
  status: string;
  summary: string;
};

export type CatalogSummaryEntry = {
  active_count: number;
  catalog_key: string;
  item_count: number;
  items: CatalogItemSummary[];
  version: string;
};

export type WorkspaceSectionEntry = {
  capability_status: string;
  key: string;
  label: string;
  read_only: boolean;
  source_of_truth: string;
  summary: string;
  view_kind: string;
};

export type WorkspaceContract = {
  catalogs: CatalogSummaryEntry[];
  contract_version: string;
  feature_flags: FeatureFlagEntry[];
  sections: WorkspaceSectionEntry[];
};

export type ApprovalResolutionRequest = {
  decision: "approved" | "rejected";
  resolution_note: string;
};

export type HandoffResolutionRequest = {
  decision: Exclude<HandoffStatus, "pending">;
  resolution_note: string;
};

export type FeatureFlagUpdateRequest = {
  enabled: boolean;
};

export type LLMProviderKey = "openai" | "deepseek" | "codex_local" | "antigravity_cli";
export type CodexLocalCostPolicy = "marginal_only" | "fully_loaded" | "hybrid";
export type CodexAuthMode = "auto" | "api_key" | "access_token" | "chatgpt_session" | "profile";
export type AgentExecutionBackend = "provider_native" | "codex_cli" | "shadow_codex_cli";
export type KnowledgeAccessBackend = "inline_context" | "workspace_staged" | "hybrid";

export type OpenAIProviderConfig = {
  api_key_configured: boolean;
  available: boolean;
  fast_model: string;
  health_status: string;
  last_rotated_at?: string | null;
  reasoning_effort: string;
  reasoning_model: string;
  secret_source: string;
  status_note: string;
};

export type DeepSeekProviderConfig = {
  api_key_configured: boolean;
  available: boolean;
  base_url: string;
  fast_model: string;
  health_status: string;
  last_rotated_at?: string | null;
  reasoning_effort: string;
  reasoning_model: string;
  secret_source: string;
  status_note: string;
};

export type CodexLocalProviderConfig = {
  available: boolean;
  auth_mode: CodexAuthMode;
  command: string;
  cost_policy: CodexLocalCostPolicy;
  executable_found: boolean;
  fallback_models: string[];
  health_status: string;
  last_rotated_at?: string | null;
  max_concurrency: number;
  model: string;
  primary_agents: string[];
  profile: string;
  runner_id: string;
  secret_source: string;
  shadow_agents: string[];
  staged_agents: string[];
  status_note: string;
  timeout_ms: number;
};

export type AntigravityProviderConfig = {
  executable: string;
  model: string;
  effort: string;
  timeout_ms: number;
  max_concurrency: number;
  runner_id: string;
  auth_mode: string;
  fallback_models: string[];
  primary_agents: string[];
  shadow_agents: string[];
  staged_agents: string[];
  available: boolean;
  executable_found: boolean;
  health_status: string;
  secret_source: string;
  last_rotated_at?: string | null;
  status_note?: string;
};

export type LLMProviderOption = {
  configured: boolean;
  description: string;
  key: string;
  label: string;
  metadata: Record<string, unknown>;
  reachable: boolean;
  selected: boolean;
  supports_structured_output: boolean;
};

export type MemoryRolloutPhaseEntry = {
  description: string;
  enabled: boolean;
  label: string;
  phase_key: string;
  stage_keys: string[];
};

export type MemoryRolloutStageEntry = {
  effective_backend: string;
  enabled: boolean;
  expects_llm_call: boolean;
  label: string;
  phase_key: string;
  requested_backend: string;
  stage_key: string;
};

export type MemoryRolloutSummary = {
  effective_default_backend: string;
  manifest_ready: boolean;
  notes: string[];
  phases: MemoryRolloutPhaseEntry[];
  requested_backend: string;
  stages: MemoryRolloutStageEntry[];
  status: string;
};

export type LLMRuntimeSettings = {
  active_provider: LLMProviderKey;
  agent_execution_backend: AgentExecutionBackend;
  antigravity_cli?: AntigravityProviderConfig;
  antigravity?: AntigravityProviderConfig;
  codex_local: CodexLocalProviderConfig;
  compatibility_mode: string;
  deepseek: DeepSeekProviderConfig;
  field_origins: Record<string, string>;
  knowledge_access_backend: KnowledgeAccessBackend;
  memory_rollout?: MemoryRolloutSummary | null;
  openai: OpenAIProviderConfig;
  provider_options: LLMProviderOption[];
  uses_platform_credentials: boolean;
  updated_at?: string | null;
};

export type OpenAIProviderConfigUpdate = {
  fast_model: string;
  reasoning_effort: string;
  reasoning_model: string;
};

export type DeepSeekProviderConfigUpdate = {
  base_url: string;
  fast_model: string;
  reasoning_effort: string;
  reasoning_model: string;
};

export type CodexLocalProviderConfigUpdate = {
  auth_mode: CodexAuthMode;
  command: string;
  cost_policy: CodexLocalCostPolicy;
  fallback_models: string[];
  max_concurrency: number;
  model: string;
  primary_agents: string[];
  profile: string;
  runner_id: string;
  shadow_agents: string[];
  staged_agents: string[];
  timeout_ms: number;
};

export type AntigravityProviderConfigUpdate = {
  executable: string;
  model: string;
  effort: string;
  timeout_ms: number;
  max_concurrency: number;
  runner_id: string;
  auth_mode: string;
  fallback_models: string[];
  primary_agents: string[];
  shadow_agents: string[];
  staged_agents: string[];
};

export type LLMRuntimeSettingsUpdateRequest = {
  active_provider: LLMProviderKey;
  agent_execution_backend: AgentExecutionBackend;
  antigravity_cli?: AntigravityProviderConfigUpdate;
  antigravity?: AntigravityProviderConfigUpdate;
  codex_local: CodexLocalProviderConfigUpdate;
  deepseek: DeepSeekProviderConfigUpdate;
  knowledge_access_backend: KnowledgeAccessBackend;
  openai: OpenAIProviderConfigUpdate;
  uses_platform_credentials?: boolean | null;
};

export type RuntimeFieldOrigin = "default" | "override";
export type RuntimeProviderReleaseStage = "preview" | "general_availability" | "deprecated";
export type RuntimeSecretStatus = "not_configured" | "configured" | "invalid" | "rotating";

export type WorkspaceProviderSecretUpsertRequest = {
  activate_for_runtime: boolean;
  secret_kind: string;
  secret_ref: string;
  secret_value: string;
};

export type WorkspaceProviderSecretResponse = {
  active_for_runtime: boolean;
  configured: boolean;
  health_status: string;
  last_rotated_at?: string | null;
  provider_key: LLMProviderKey;
  secret_kind: string;
  secret_source: string;
  status: RuntimeSecretStatus;
  storage_mode: string;
  supports_workspace_secrets: boolean;
  updated_at?: string | null;
  uses_platform_credentials: boolean;
  workspace_id: string;
};

export type WorkspaceRuntimeHealthCheckEntry = {
  check_key: string;
  detail: string;
  label: string;
  status: string;
};

export type WorkspaceRuntimeHealthResponse = {
  agent_execution_backend: AgentExecutionBackend;
  checked_at: string;
  checks: WorkspaceRuntimeHealthCheckEntry[];
  health_status: string;
  knowledge_access_backend: KnowledgeAccessBackend;
  mode: string;
  overall_status: string;
  provider_key: LLMProviderKey;
  provider_label: string;
  secret_source: string;
  uses_platform_credentials: boolean;
  workspace_id: string;
};

export type PlatformRuntimeProviderResponse = {
  allowed_auth_modes: string[];
  allowed_models: string[];
  created_at?: string | null;
  default_models: Record<string, unknown>;
  health_policy: Record<string, unknown>;
  is_enabled: boolean;
  label: string;
  provider_key: LLMProviderKey;
  release_stage: RuntimeProviderReleaseStage;
  supports_platform_managed_credentials: boolean;
  supports_workspace_secrets: boolean;
  updated_at?: string | null;
};

export type PlatformRuntimeProviderUpdateRequest = {
  allowed_auth_modes?: string[] | null;
  allowed_models?: string[] | null;
  default_models?: Record<string, unknown> | null;
  health_policy?: Record<string, unknown> | null;
  is_enabled?: boolean | null;
  label?: string | null;
  release_stage?: RuntimeProviderReleaseStage | null;
  supports_platform_managed_credentials?: boolean | null;
  supports_workspace_secrets?: boolean | null;
};

export type RuntimeSettingsAuditEntry = {
  actor_email: string;
  actor_user_id?: string | null;
  after_payload_redacted: Record<string, unknown>;
  before_payload_redacted: Record<string, unknown>;
  change_type: string;
  created_at: string;
  id: string;
  scope_id: string;
  scope_type: "platform" | "workspace";
};

export type RuntimeSettingsAuditListResponse = {
  items: RuntimeSettingsAuditEntry[];
};

export type EstimationMaturityStage = "canvas" | "blueprint" | "ready_to_build";
export type EstimationScenarioType = "traditional" | "agentic";

export type EstimationCalibrationStageSummary = {
  band_hit_rate: number;
  calibrated_runs: number;
  maturity_stage: EstimationMaturityStage;
  mean_absolute_percentage_error_automation: number;
  mean_absolute_percentage_error_cost: number;
  mean_absolute_percentage_error_duration: number;
  mean_absolute_percentage_error_hours: number;
  mean_bias_automation_percent: number;
  mean_bias_cost_percent: number;
  mean_bias_duration_percent: number;
  mean_bias_hours_percent: number;
  total_runs: number;
};

export type EstimationRecentCalibrationEntry = {
  actual_cost_total: number;
  band_hit_overall: boolean;
  cost_absolute_percentage_error: number;
  estimated_cost_total: number;
  estimation_run_id: string;
  maturity_stage: EstimationMaturityStage;
  provider?: LLMProviderKey | null;
  scenario_type: EstimationScenarioType;
  session_id: string;
  session_title: string;
  updated_at: string;
};

export type EstimationCalibrationDashboard = {
  band_hit_rate: number;
  calibrated_runs: number;
  coverage_percent: number;
  generated_at?: string | null;
  mean_absolute_percentage_error_automation: number;
  mean_absolute_percentage_error_cost: number;
  mean_absolute_percentage_error_duration: number;
  mean_absolute_percentage_error_hours: number;
  mean_bias_cost_percent: number;
  precision_by_stage: EstimationCalibrationStageSummary[];
  recent_projects: EstimationRecentCalibrationEntry[];
  total_runs: number;
};

export type SkillRerunResponse = {
  skill_run: SkillRunEntry;
  snapshot: Record<string, unknown>;
};
