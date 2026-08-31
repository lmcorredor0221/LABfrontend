import { apiClient } from "@/core/api/client";

export type ProductProcessingMode = "basic_free" | "premium_enrichment" | "acp_implementation";
export type UncertaintyBacklogStatus = "open" | "in_progress" | "resolved" | "deferred" | "superseded" | "dismissed";
export type UncertaintyDisposition = "infer" | "defer" | "block" | "resolve_now";
export type UncertaintyKind = "question" | "gap" | "assumption" | "decision" | "hitl" | "runtime_error" | "stale_dependency";

export type UncertaintyOption = {
  key: string;
  label: string;
  description: string;
  impact: string;
  recommended: boolean;
  confidence: number;
};

export type UncertaintyBacklogEntry = {
  id: string;
  workspace_id: string;
  session_id: string;
  uncertainty_key: string;
  product_mode: ProductProcessingMode;
  source_stage: string;
  target_stage: string;
  kind: UncertaintyKind;
  disposition: UncertaintyDisposition;
  status: UncertaintyBacklogStatus;
  title: string;
  reason: string;
  impact: string;
  confidence: number;
  cost_to_resolve_units: number;
  assumed_answer: string;
  suggested_answer: string;
  answer_options: UncertaintyOption[];
  source_refs: string[];
  affected_deliverable_keys: string[];
  dependency_keys: string[];
  created_from: string;
};

export type PremiumEnrichmentItem = {
  entry: UncertaintyBacklogEntry;
  priority_score: number;
  priority_reason: string;
  changed_dependency_keys: string[];
  affected_deliverable_keys: string[];
  ordered_regeneration_keys: string[];
  unaffected_deliverable_count: number;
  material_impact?: boolean;
  reconciliation_decision?: "document_only" | "localized_reconciliation" | "structural_reconciliation";
  reconciliation_status?:
    | "not_required"
    | "pending_user_confirmation"
    | "queued"
    | "running"
    | "completed"
    | "completed_with_errors"
    | "failed"
    | "cancelled";
  reconciliation_queue_total?: number;
  reconciliation_queue_completed?: number;
  reconciliation_pending_keys?: string[];
};

export type PremiumEnrichmentWorkspace = {
  contract_version: "premium-enrichment-workspace.v1";
  workspace_id: string;
  session_id: string;
  current_tier: "blueprint" | "blueprint_pro" | "acp";
  product_mode: ProductProcessingMode;
  selectable_limit: number;
  total_uncertainties: number;
  prioritized_count: number;
  deferred_count: number;
  resolved_count: number;
  items: PremiumEnrichmentItem[];
  value_summary: string;
  processing_guidance: string;
};

export type PremiumUncertaintyResolutionRequest = {
  answer?: string;
  execution_mode?: "analyze_only" | "apply_reconciliation" | "apply_reprocess";
  selected_option_key?: string;
  regenerate?: boolean;
  max_deliverables?: number;
};

export type PremiumSelectiveReprocessResult = {
  contract_version: "premium-selective-reprocess-result.v1";
  resolved_entry: UncertaintyBacklogEntry;
  changed_dependency_keys: string[];
  affected_deliverable_keys?: string[];
  stale_deliverable_keys: string[];
  ordered_regeneration_keys: string[];
  reconciled_deliverable_keys?: string[];
  regenerated_deliverable_keys: string[];
  preserved_deliverable_keys: string[];
  material_impact: boolean;
  reconciliation_decision?: "document_only" | "localized_reconciliation" | "structural_reconciliation";
  reconciliation_status?:
    | "not_required"
    | "pending_user_confirmation"
    | "queued"
    | "running"
    | "completed"
    | "completed_with_errors"
    | "failed"
    | "cancelled";
  execution_mode?: "analyze_only" | "apply_reconciliation";
  legacy_execution_mode?: string;
  reprocess_decision: "document_only" | "localized_reprocess" | "structural_reprocess";
  recommended_action: string;
  impact_summary: string;
  reconciliation_job_ids?: string[];
  generation_job_ids: string[];
  generation_status_by_deliverable: Record<string, string>;
  superseded_uncertainty_count: number;
  comparison_summary: string;
  queue_total?: number;
  queue_completed?: number;
  queue_status?: string;
  queue_processed_keys?: string[];
};

export const premiumEnrichmentApi = {
  getWorkspace(sessionId: string, selectableLimit = 6) {
    return apiClient.get<PremiumEnrichmentWorkspace>(
      `/api/v1/sessions/${sessionId}/premium-enrichment?selectable_limit=${selectableLimit}`,
    );
  },
  resolveItem(sessionId: string, backlogId: string, payload: PremiumUncertaintyResolutionRequest) {
    return apiClient.post<PremiumSelectiveReprocessResult>(
      `/api/v1/sessions/${sessionId}/premium-enrichment/${backlogId}/resolve`,
      { body: payload },
    );
  },
  deferToAcp(sessionId: string, backlogId: string) {
    return apiClient.post<{ status: string; backlog_id: string }>(
      `/api/v1/sessions/${sessionId}/premium-enrichment/${backlogId}/defer-to-acp`,
    );
  },
  dismissItem(sessionId: string, backlogId: string) {
    return apiClient.post<{ status: string; backlog_id: string }>(
      `/api/v1/sessions/${sessionId}/premium-enrichment/${backlogId}/dismiss`,
    );
  },
};
