import type { AttentionItemV2, AttentionOptionV2 } from "./attention-contracts";

export const ATTENTION_DECISION_CONTRACT_VERSION_V3 = "attention.decision.v3" as const;

export type AttentionDecisionProductV3 = "blueprint" | "acp" | "commercial";
export type AttentionDecisionSeverityV3 = "info" | "warning" | "blocking";
export type AttentionDecisionStatusV3 = "open" | "in_progress" | "deferred" | "resolved" | "dismissed" | "superseded";
export type AttentionDecisionActionKindV3 =
  | "navigate"
  | "answer"
  | "approve"
  | "reject"
  | "confirm"
  | "regenerate"
  | "retry"
  | "defer";

export type AttentionDecisionItemTypeV3 = AttentionItemV2["type"];

export interface AttentionDecisionSourceV3 {
  product: AttentionDecisionProductV3;
  stage: string;
  source: string;
  artifact_id?: string | null;
  artifact_version?: number | null;
  entity_id?: string | null;
  field_path?: string | null;
  href: string;
  return_href?: string;
  owner_role?: string;
  affected_artifact_refs?: string[];
}

export interface AttentionDecisionOptionV3 extends AttentionOptionV2 {
  risk?: string;
  tradeoff?: string;
}

export interface AttentionDecisionActionV3 {
  primary_kind: Exclude<AttentionDecisionActionKindV3, "defer">;
  primary_label?: string;
  can_resolve_inline?: boolean;
  allowed_kinds?: AttentionDecisionActionKindV3[];
}

export interface AttentionDecisionV3 {
  contract_version: typeof ATTENTION_DECISION_CONTRACT_VERSION_V3;
  decision_key?: string;
  item_type: AttentionDecisionItemTypeV3;
  severity: AttentionDecisionSeverityV3;
  status?: AttentionDecisionStatusV3;
  title: string;
  reason: string;
  impact?: string;
  consequence_if_unresolved: string;
  required_decision?: string;
  suggested_answer?: string;
  source: AttentionDecisionSourceV3;
  options?: AttentionDecisionOptionV3[];
  action?: AttentionDecisionActionV3;
}
