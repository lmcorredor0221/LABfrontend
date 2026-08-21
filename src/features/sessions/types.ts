import type {
  AlertEventEntry,
  ArtifactRecordEntry,
  ACPValidationReport,
  BlueprintArtifact,
  BlueprintConsistencyReport,
  CanvasArtifact,
  ConstructionReadinessReport,
  DiscoveryArtifact,
  EstimationErrorMetricEntry,
  EstimationReportArtifact,
  EstimationRunEntry,
  EvaluationArtifact,
  EvaluationDatasetArtifact,
  EvaluationRunEntry,
  EvaluationRubricArtifact,
  GovernancePolicyEntry,
  HandoffRecordEntry,
  IntegrationStatusEntry,
  JourneyStageArtifactEntry,
  MetricSnapshotEntry,
  ProjectActualsEntry,
  ReviewState,
  SkillDefinition,
  SkillRunEntry,
  SimulationRunRecord,
  SubagentRunEntry,
  ToolRecommendationArtifact,
  DiagramCatalogEntry,
  DiagramCatalogResponse,
  WorkflowTemplateEntry,
  WorkspaceContract,
} from "@/features/sessions/session-contracts";

export type SessionStage =
  | "draft_capture"
  | "input_validation"
  | "normalize_discovery"
  | "build_canvas"
  | "build_blueprint"
  | "post_validation"
  | "ready_for_export";

export type ArtifactStatus = "draft" | "ready" | "needs_review" | "failed";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export type CommercialTier = "blueprint" | "blueprint_pro" | "acp";

export type SessionCommercialAccess = {
  available_upgrades: CommercialTier[];
  can_access_library_workspace: boolean;
  can_build_acp: boolean;
  can_download_acp: boolean;
  can_download_blueprint: boolean;
  can_export_acp_zip: boolean;
  can_export_blueprint_core: boolean;
  can_export_blueprint_document: boolean;
  can_export_construction_pack: boolean;
  can_export_estimation_pack: boolean;
  can_export_json: boolean;
  can_export_markdown: boolean;
  can_export_prompt_pack: boolean;
  can_export_test_pack: boolean;
  can_invite_acp: boolean;
  can_view_blueprint: boolean;
  can_view_diagram_acp: boolean;
  can_view_diagram_blueprint: boolean;
  can_view_diagram_sample: boolean;
  can_view_in_app_blueprint: boolean;
  capability_reasons?: Record<string, string>;
  checkout_state?: string;
  contract_version?: string;
  purchase_refs?: string[];
  reason_code?: string;
  tier: CommercialTier;
  tier_label: string;
  tier_rank: number;
  upgrade_cta_label: string;
  upgrade_message: string;
};

export type CommercialProductType = "blueprint" | "acp";
export type CommercialProductStatus = "active" | "archived";
export type CommercialOrderStatus = "pending" | "paid" | "failed" | "canceled" | "refunded";
export type CommercialEntitlementStatus =
  | "active"
  | "pending_activation"
  | "suspended"
  | "expired"
  | "revoked"
  | "refunded";
export type CommercialEntitlementSource = "checkout" | "admin_grant" | "legacy_backfill" | "legacy_migration";
export type CommercialAccessRequestStatus = "pending" | "approved" | "rejected" | "canceled";

export type ProductPriceResponse = {
  billing_period: string;
  currency: string;
  price_code: string;
  unit_amount_cents: number;
  version: number;
};

export type ProductCatalogResponse = {
  benefits: string[];
  capabilities: string[];
  description: string;
  exclusions: string[];
  name: string;
  price?: ProductPriceResponse | null;
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
  source: CommercialEntitlementSource;
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
  contract_version: string;
  entitlements: CommercialEntitlementSummary[];
  purchase_refs: string[];
  reason_code: string;
  role?: string | null;
  session_id?: string | null;
  tier: CommercialTier;
  tier_label: string;
  user_id?: string | null;
  workspace_id?: string | null;
};

export type CommercialCheckoutSessionRequest = {
  cancel_url?: string;
  idempotency_key?: string;
  price_code?: string;
  product_key: string;
  provider?: "sandbox" | "hotmart";
  session_id: string;
  success_url?: string;
};

export type CommercialCheckoutCompletionRequest = {
  outcome?: "success" | "failure" | "cancel";
  provider_payment_id?: string;
};

export type CommercialCheckoutSessionResponse = {
  checkout_ref: string;
  checkout_url: string;
  contract_version: string;
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

export type AccessRequestCreateRequest = {
  capability: string;
  reason?: string;
  session_id: string;
};

export type AccessRequestResolveRequest = {
  decision: "approved" | "rejected" | "canceled";
  resolution_note?: string;
};

export type AccessRequestResponse = {
  capability: string;
  created_at: string;
  id: string;
  product_key: string;
  reason: string;
  requester_user_id: string;
  resolution_note: string;
  resolved_at?: string | null;
  session_id: string;
  status: CommercialAccessRequestStatus;
  target_tier: CommercialTier;
  updated_at: string;
  workspace_id: string;
  project_title?: string;
  workspace_name?: string;
  requester_name?: string;
  requester_email?: string;
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
  stage?: string;
  title: string;
};

export type ProductOverviewResponse = {
  access: CommercialAccessSnapshotV2;
  active_stage: string;
  attention: ProductAttentionItem[];
  contract_version: string;
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
  contract_version: string;
  diagrams: DiagramCatalogEntry[];
  estimation: Record<string, unknown>;
  generated_at: string;
  protection?: Record<string, unknown>;
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
  contract_version: string;
  generated_at: string;
  product: ProductCatalogResponse;
  session_id: string;
  workspace_id: string;
};

export type AcpInvitationResponse = {
  access: CommercialAccessSnapshotV2;
  benefits: string[];
  comparison: Record<string, unknown>;
  contract_version: string;
  generated_at: string;
  metrics: Record<string, unknown>;
  next_action: string;
  session_id: string;
  state: string;
  workspace_id: string;
};

export type ACPWorkflowRunStatus =
  | "not_started"
  | "running"
  | "waiting_user"
  | "blocked"
  | "completed"
  | "completed_with_observations"
  | "failed"
  | "stale"
  | "canceled";

export type ACPPhaseDefinitionResponse = {
  key: string;
  label: string;
  objective: string;
  order: number;
  required: boolean;
};

export type ACPPhaseRunResponse = {
  id?: string | null;
  phase_key: string;
  phase_label: string;
  phase_order: number;
  status: ACPWorkflowRunStatus;
  attempt_count: number;
  input_refs: Array<Record<string, unknown>>;
  output_refs: Array<Record<string, unknown>>;
  checkpoints: Record<string, unknown>;
  blockers: Array<Record<string, unknown>>;
  warnings: string[];
  started_at?: string | null;
  completed_at?: string | null;
  updated_at?: string | null;
};

export type ACPBuildRunResponse = {
  id: string;
  workspace_id: string;
  session_id: string;
  blueprint_version_number?: number | null;
  status: ACPWorkflowRunStatus;
  current_phase_key: string;
  progress_percent: number;
  phase_order: string[];
  checkpoints: Record<string, unknown>;
  artifacts: Record<string, unknown>;
  blockers: Array<Record<string, unknown>>;
  warnings: string[];
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
};

export type ACPWorkspaceResponse = {
  access: CommercialAccessSnapshotV2;
  contract_version: string;
  generated_at: string;
  next_action: string;
  phase_definitions: ACPPhaseDefinitionResponse[];
  phases: ACPPhaseRunResponse[];
  readiness: ConstructionReadinessReport;
  run: ACPBuildRunResponse;
  session_id: string;
  validation: ACPValidationReport;
  workspace_id: string;
};

export type ACPPhaseCommandRequest = {
  force?: boolean;
  idempotency_key?: string;
};

export type AttentionItemResponse = {
  action_label: string;
  detected_at?: string | null;
  href: string;
  impact: string;
  key: string;
  metadata: Record<string, unknown>;
  owner_role: string;
  reason: string;
  severity: "info" | "warning" | "blocking";
  source: string;
  stage: string;
  status: string;
  title: string;
  type: "question" | "gap" | "approval" | "checkout" | "entitlement" | "warning" | "info";
};

export type AttentionResponse = {
  blocking_count: number;
  contract_version: string;
  generated_at: string;
  info_count: number;
  items: AttentionItemResponse[];
  session_id: string;
  total_count: number;
  warning_count: number;
  workspace_id: string;
};

export type ExportCatalogItemResponse = {
  access_state: "allowed" | "locked" | "blocked";
  content_type: string;
  cta_label: string;
  description: string;
  file_extension: string;
  key: string;
  label: string;
  locked_reason: string;
  product_key: string;
  profile: string;
  required_capability: string;
};

export type ExportCatalogResponse = {
  contract_version: string;
  generated_at: string;
  items: ExportCatalogItemResponse[];
  session_id: string;
  workspace_id: string;
};

export type ExportJobCreateRequest = {
  artifact_kind: string;
  idempotency_key?: string;
  profile?: string;
};

export type ExportJobStatus = "queued" | "running" | "ready" | "failed" | "canceled" | "expired";

export type ExportJobResponse = {
  artifact_kind: string;
  checksum_sha256: string;
  completed_at?: string | null;
  content_type: string;
  created_at: string;
  download_url: string;
  error_message: string;
  expires_at?: string | null;
  file_name: string;
  id: string;
  metadata: Record<string, unknown>;
  product_key: string;
  profile: string;
  session_id: string;
  size_bytes: number;
  status: ExportJobStatus;
  updated_at: string;
  workspace_id: string;
};

export type LauncherScriptResponse = {
  available: boolean;
  command: string;
  path: string;
  platform: string;
};

export type LauncherMetadataResponse = {
  contract_version: string;
  generated_at: string;
  launcher_version: string;
  manifest_path: string;
  package_name: string;
  report_output: string;
  requires_lean_backend: boolean;
  restrictions: string[];
  safe_defaults: Record<string, unknown>;
  scripts: LauncherScriptResponse[];
  session_id: string;
  workspace_id: string;
};

export type LauncherReportSubmitRequest = {
  detected_ide?: string;
  detected_tool?: string;
  launcher_version?: string;
  report?: Record<string, unknown>;
  report_path?: string;
  status?: string;
  summary?: string;
};

export type LauncherReportResponse = {
  contract_version: string;
  created_at: string;
  detected_ide: string;
  detected_tool: string;
  id: string;
  launcher_version: string;
  report_path: string;
  session_id: string;
  status: string;
  summary: string;
  workspace_id: string;
};

export type ActivityTimelineEntry = {
  created_at: string;
  currency: string;
  key: string;
  metadata: Record<string, unknown>;
  product_key: string;
  revenue_cents: number;
  source: string;
  status: string;
  title: string;
  type: "commercial" | "execution" | "export" | "workflow";
};

export type ActivityMetric = {
  detail: string;
  key: string;
  label: string;
  tone: "blue" | "green" | "orange" | "red" | "slate" | "violet";
  unit: string;
  value: number | string;
};

export type ActivityFunnelStep = {
  completed: boolean;
  conversion_percent: number;
  count: number;
  event_keys: string[];
  key: string;
  label: string;
  latest_at?: string | null;
  product: string;
};

export type ActivityResponse = {
  contract_version: string;
  funnel: ActivityFunnelStep[];
  generated_at: string;
  metrics: ActivityMetric[];
  session_id: string;
  timeline: ActivityTimelineEntry[];
  workspace_id: string;
};

export type PlanAccessResponse = {
  access: CommercialAccessSnapshotV2;
  contract_version: string;
  entitlements: CommercialEntitlementSummary[];
  generated_at: string;
  pending_requests: AccessRequestResponse[];
  products: ProductCatalogResponse[];
  session_id: string;
  workspace_id: string;
};

export type DiagramCatalogV2Response = DiagramCatalogResponse & {
  contract_version: string;
  has_more: boolean;
  limit: number;
  next_cursor?: string | null;
};

export type SessionSummary = {
  commercial_tier?: CommercialTier;
  id: string;
  title: string;
  suggested_title?: string | null;
  title_source?: "generated" | "manual" | "migrated";
  row_version?: number;
  status: ArtifactStatus;
  current_stage: SessionStage;
  workspace_id?: string | null;
  owner?: {
    id: string;
    name: string;
  } | null;
  pending_attention_count?: number;
  progress_percent?: number;
  archived_at?: string | null;
  deleted_at?: string | null;
  capabilities?: {
    can_open: boolean;
    can_rename: boolean;
    can_archive: boolean;
    can_restore: boolean;
    can_delete: boolean;
  };
  created_at: string;
  updated_at: string;
};

export type SessionListResponse = {
  items: SessionSummary[];
  page?: {
    next_cursor?: string | null;
    total: number;
  };
  facets?: {
    active: number;
    needs_review: number;
    archived: number;
    trash: number;
  };
};

export type SessionActivityEntry = {
  created_at: string;
  message: string;
  payload?: Record<string, unknown>;
  stage: SessionStage;
  status: ArtifactStatus;
};

export type SessionApprovalEntry = {
  created_at: string;
  gate_key: string;
  id: string;
  instructions?: string;
  rationale?: string;
  requested_in_stage: SessionStage;
  resolution_note?: string;
  resolved_at?: string | null;
  status: ApprovalStatus;
  title: string;
};

export type SessionMetricSnapshotEntry = MetricSnapshotEntry;

export type SessionIntegrationStatusEntry = IntegrationStatusEntry;

export type SessionValidationEntry = {
  artifact_name: string;
  created_at: string;
  missing_fields: string[];
  status: ArtifactStatus;
  warnings: string[];
};

export type SessionBlueprintVersionEntry = {
  architecture: string;
  created_at: string;
  readiness_state: ReviewState;
  reasoning_pattern: string;
  source_action: string;
  status: ArtifactStatus;
  version_number: number;
};

export type SessionSnapshot = {
  activity: SessionActivityEntry[];
  alert_events: AlertEventEntry[];
  approvals: SessionApprovalEntry[];
  artifact_records: ArtifactRecordEntry[];
  blueprint?: BlueprintArtifact | null;
  blueprint_versions?: SessionBlueprintVersionEntry[];
  canvas?: CanvasArtifact | null;
  commercial_access?: SessionCommercialAccess;
  contract_version: string;
  discovery?: DiscoveryArtifact | null;
  estimation_error_metrics: EstimationErrorMetricEntry[];
  estimation_report?: EstimationReportArtifact | null;
  estimation_runs: EstimationRunEntry[];
  evaluation?: EvaluationArtifact | null;
  evaluation_dataset?: EvaluationDatasetArtifact | null;
  evaluation_rubric?: EvaluationRubricArtifact | null;
  evaluation_runs: EvaluationRunEntry[];
  simulation_runs: SimulationRunRecord[];
  governance_policies: GovernancePolicyEntry[];
  handoff_records: HandoffRecordEntry[];
  integration_statuses: SessionIntegrationStatusEntry[];
  journey_artifacts: JourneyStageArtifactEntry[];
  journey_latest_artifacts?: Record<string, JourneyStageArtifactEntry>;
  latest_tool_recommendation?: ToolRecommendationArtifact | null;
  metric_snapshots: SessionMetricSnapshotEntry[];
  project_actuals: ProjectActualsEntry[];
  selected_workflow_template_key?: string;
  session: SessionSummary;
  skill_catalog: SkillDefinition[];
  skill_runs: SkillRunEntry[];
  blueprint_consistency?: BlueprintConsistencyReport;
  subagent_runs: SubagentRunEntry[];
  validations?: SessionValidationEntry[];
  workflow_templates: WorkflowTemplateEntry[];
  workspace_contract?: WorkspaceContract;
};
