export type ProductBuildProductKey = "blueprint_basic" | "blueprint_pro" | "acp";

export type ProductProcessingMode = "basic_free" | "premium_enrichment" | "acp_implementation";

export type ProductBuildLifecycle =
  | "not_purchased"
  | "payment_pending"
  | "locked"
  | "ready_to_start"
  | "queued"
  | "preparing"
  | "running"
  | "requires_attention"
  | "partial"
  | "completed"
  | "error";

export type ProductBuildDeliverableState =
  | "not_required"
  | "locked"
  | "pending"
  | "queued"
  | "generating"
  | "available"
  | "stale"
  | "requires_attention"
  | "error"
  | "skipped";

export type ProductBuildActionState = "hidden" | "disabled" | "available" | "recommended" | "running" | "blocked";

export type ProductBuildAttentionSeverity = "info" | "warning" | "blocking" | "technical_error";

export type ProductBuildProcessingQueueMode = "process_pending" | "retry_failed";

export type ProductBuildProcessingItemStatus = "pending" | "queued" | "processing" | "completed" | "failed";

export type ProductBuildProgress = {
  percent: number;
  completed_units: number;
  total_units: number;
  blocked_units: number;
  calculation: "weighted_units" | "manual" | "not_applicable";
  label: string;
};

export type ProductBuildEntitlement = {
  tier: "blueprint" | "blueprint_pro" | "acp";
  access_state: "allowed" | "preview" | "locked" | "payment_pending";
  is_purchased: boolean;
  purchase_required: boolean;
  checkout_href: string;
  upgrade_label: string;
};

export type ProductBuildCurrentActivity = {
  activity_key: string;
  label: string;
  detail: string;
  step_key: string;
  status: "idle" | "queued" | "running" | "waiting_user" | "completed" | "failed";
  started_at: string;
  updated_at: string;
};

export type ProductBuildStageStatus = {
  stage_key: string;
  label: string;
  lifecycle: ProductBuildLifecycle;
  progress: ProductBuildProgress;
  blocker_count: number;
  deliverable_count: number;
};

export type ProductBuildDeliverableStatus = {
  deliverable_key: string;
  title: string;
  deliverable_type: "diagram" | "document" | "artifact" | "prompt" | "contract" | "test" | "package" | "lineage";
  state: ProductBuildDeliverableState;
  product_surface: ProductBuildProductKey;
  stage_key: string;
  required: boolean;
  job_id: string;
  updated_at: string;
  href: string;
};

export type ProductBuildAttentionItem = {
  key: string;
  title: string;
  severity: ProductBuildAttentionSeverity;
  product_key: string;
  run_id: string;
  step_id: string;
  source: string;
  stage_key: string;
  deliverable_key: string;
  href: string;
  reason: string;
  blocking: boolean;
};

export type ProductBuildAttentionSummary = {
  total: number;
  blocking_count: number;
  warning_count: number;
  technical_error_count: number;
  items: ProductBuildAttentionItem[];
};

export type ProductBuildAction = {
  action_key: string;
  label: string;
  state: ProductBuildActionState;
  href: string;
  reason: string;
  primary: boolean;
};

export type ProductBuildRecoverableError = {
  code: string;
  title: string;
  message: string;
  recoverable: boolean;
  technical_message: string;
  retry_action_key: string;
  trace_refs: string[];
};

export type ProductBuildProcessingQueueItem = {
  deliverable_key: string;
  title: string;
  deliverable_type: ProductBuildDeliverableStatus["deliverable_type"];
  stage_key: string;
  status: ProductBuildProcessingItemStatus;
  attempt_count: number;
  retried: boolean;
  error_message: string;
  href: string;
  job_id: string;
  updated_at: string;
};

export type ProductBuildProcessingQueueStatus = {
  active: boolean;
  queue_id: string;
  mode: ProductBuildProcessingQueueMode;
  status: "idle" | "queued" | "running" | "completed" | "completed_with_errors";
  total_count: number;
  pending_count: number;
  processing_count: number;
  completed_count: number;
  failed_count: number;
  retried_count: number;
  started_at: string;
  completed_at: string;
  updated_at: string;
  current_deliverable_key: string;
  summary: string;
  completed_items: ProductBuildProcessingQueueItem[];
  failed_items: ProductBuildProcessingQueueItem[];
};

export type ProductBuildStatus = {
  contract_version: "product-build-status.v1";
  workspace_id: string;
  session_id: string;
  product_key: ProductBuildProductKey;
  product_mode: ProductProcessingMode;
  product_label: string;
  lifecycle: ProductBuildLifecycle;
  entitlement: ProductBuildEntitlement;
  progress: ProductBuildProgress;
  current_activity: ProductBuildCurrentActivity | null;
  stages: ProductBuildStageStatus[];
  deliverables: ProductBuildDeliverableStatus[];
  attention: ProductBuildAttentionSummary;
  actions: ProductBuildAction[];
  last_error: ProductBuildRecoverableError | null;
  processing_queue?: ProductBuildProcessingQueueStatus | null;
  generated_at: string;
  source_contracts: string[];
};

export function calculateProductBuildPercent(completedUnits: number, totalUnits: number): number {
  if (totalUnits <= 0) return 0;
  return Math.min(Math.max(Math.round((completedUnits / totalUnits) * 100), 0), 100);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function normalizeProductBuildStatus(payload: unknown): ProductBuildStatus {
  if (!isRecord(payload) || payload.contract_version !== "product-build-status.v1") {
    throw new Error("Expected product-build-status.v1 response.");
  }

  if (typeof payload.workspace_id !== "string" || typeof payload.session_id !== "string") {
    throw new Error("Product build status requires workspace_id and session_id.");
  }

  return payload as ProductBuildStatus;
}
