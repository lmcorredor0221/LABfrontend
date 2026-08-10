export type AttentionItemTypeV2 =
  | "question"
  | "gap"
  | "decision"
  | "approval"
  | "confirmation"
  | "validation"
  | "hitl"
  | "inconsistency"
  | "stale"
  | "runtime_error"
  | "access_request";

export type AttentionSeverityV2 = "info" | "warning" | "blocking";

export type AttentionProductV2 = "blueprint" | "acp" | "commercial";

export type AttentionStatusV2 = "open" | "in_progress" | "deferred" | "resolved" | "dismissed" | "superseded";

export type AttentionActionKindV2 = "navigate" | "answer" | "approve" | "reject" | "confirm" | "regenerate" | "retry";
export type AttentionActionRequestKindV2 = AttentionActionKindV2 | "defer";
export type AttentionActionResultStatusV2 = "applied" | "duplicate" | "unsupported" | "not_found" | "conflict" | "forbidden";

export type AttentionSourceRefV2 = {
  artifact_id?: string | null;
  artifact_version?: number | null;
  entity_id?: string | null;
  field_path?: string | null;
};

export type AttentionOptionV2 = {
  key: string;
  label: string;
  description: string;
  impact?: string;
  example?: string;
  recommended?: boolean;
  confidence?: number;
  source_refs?: string[];
};

export type AttentionActionV2 = {
  kind: AttentionActionKindV2;
  label: string;
  href: string;
  return_href: string;
  can_resolve_inline: boolean;
};

export type AttentionItemV2 = {
  affected_artifact_refs: string[];
  action: AttentionActionV2;
  blocking: boolean;
  consequence_if_unresolved: string;
  detected_at?: string | null;
  impact: string;
  key: string;
  options: AttentionOptionV2[];
  owner_role: string;
  owner_user_id: string;
  product: AttentionProductV2;
  reason: string;
  severity: AttentionSeverityV2;
  source: string;
  source_ref: AttentionSourceRefV2;
  stage: string;
  status: AttentionStatusV2;
  suggested_answer: string;
  title: string;
  type: AttentionItemTypeV2;
  updated_at?: string | null;
};

export type AttentionResponseV2 = {
  actionable_count: number;
  blocking_count: number;
  contract_version: "attention.v2";
  counts_by_product: Record<string, number>;
  counts_by_stage: Record<string, number>;
  counts_by_type: Record<string, number>;
  current_stage: string;
  cursor: string;
  generated_at: string;
  info_count: number;
  items: AttentionItemV2[];
  primary_item?: AttentionItemV2 | null;
  session_id: string;
  total_count: number;
  warning_count: number;
  workspace_id: string;
};

export type AttentionActionRequestV2 = {
  action_kind: AttentionActionRequestKindV2;
  answer_text?: string;
  decision?: string;
  idempotency_key?: string;
  payload?: Record<string, unknown>;
  resolution_note?: string;
  selected_option_key?: string;
  source_artifact_version?: number | null;
  was_suggested_answer_used?: boolean;
};

export type AttentionActionResultV2 = {
  action_kind: AttentionActionRequestKindV2;
  attention: AttentionResponseV2;
  contract_version: "attention-action.v2";
  item_key: string;
  message: string;
  session_id: string;
  status: AttentionActionResultStatusV2;
  workspace_id: string;
};
