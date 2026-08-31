import type {
  ProductBuildActionState,
  ProductBuildCurrentActivity,
  ProductBuildLifecycle,
  ProductBuildProductKey,
} from "@/features/product-experience/saas/product-build-status";
import type { CommercialTier } from "@/features/sessions/types";

export type ProductJourneyCurrentStage = {
  stage_key: string;
  label: string;
  lifecycle: ProductBuildLifecycle;
  progress_percent: number;
  product_key: ProductBuildProductKey;
};

export type ProductJourneyRecommendedAction = {
  action_key: string;
  label: string;
  state: ProductBuildActionState;
  href: string;
  reason: string;
  product_key: ProductBuildProductKey;
  primary: boolean;
};

export type ProductJourneyOutcome = {
  key: string;
  title: string;
  detail: string;
  product_key: ProductBuildProductKey;
  stage_key: string;
  href: string;
};

export type ProductJourneyDeliverableSummary = {
  total_count: number;
  available_count: number;
  pending_count: number;
  running_count: number;
  locked_count: number;
  stale_count: number;
  attention_count: number;
  error_count: number;
};

export type ProductJourneyProductSummary = {
  product_key: ProductBuildProductKey;
  product_label: string;
  lifecycle: ProductBuildLifecycle;
  access_state: "allowed" | "preview" | "locked" | "payment_pending";
  is_purchased: boolean;
  purchase_required: boolean;
  progress_percent: number;
  available_deliverable_count: number;
  total_deliverable_count: number;
  blocking_attention_count: number;
  warning_attention_count: number;
  technical_error_count: number;
  active_operation: ProductBuildCurrentActivity | null;
  primary_action: ProductJourneyRecommendedAction | null;
};

export type JourneyStateKey =
  | "discover"
  | "define"
  | "design"
  | "tools"
  | "memory"
  | "estimate"
  | "blueprint_free_ready"
  | "blueprint_pro_access_requested"
  | "blueprint_pro_access_pending"
  | "blueprint_pro_active"
  | "acp_access_requested"
  | "acp_access_pending"
  | "acp_prep"
  | "validate"
  | "package"
  | "completed";

export type JourneyStateSubstate =
  | "idle"
  | "running"
  | "waiting_user"
  | "waiting_dependency"
  | "retrying"
  | "completed"
  | "failed"
  | "blocked";

export type JourneyStateMachineStage = {
  state_key: JourneyStateKey;
  substate: JourneyStateSubstate;
  label: string;
  detail: string;
  product_key: ProductBuildProductKey;
  stage_key: string;
  href: string;
  progress_percent: number;
  blocking: boolean;
};

export type JourneyStateMachine = {
  contract_version: "journey-state-machine.v1";
  workspace_id: string;
  session_id: string;
  current: JourneyStateMachineStage;
  source_contracts: string[];
};

export type ProductJourneyOverview = {
  contract_version: "product-journey-overview.v2";
  workspace_id: string;
  session_id: string;
  project_title: string;
  current_stage: ProductJourneyCurrentStage;
  achieved_outcomes: ProductJourneyOutcome[];
  active_operation: ProductBuildCurrentActivity | null;
  blocking_attention_count: number;
  warning_attention_count: number;
  technical_error_count: number;
  recommended_next_action: ProductJourneyRecommendedAction | null;
  products: ProductJourneyProductSummary[];
  deliverable_summary: ProductJourneyDeliverableSummary;
  journey_state_machine?: JourneyStateMachine | null;
  generated_at: string;
  source_contracts: string[];
};

const JOURNEY_STATE_KEYS: JourneyStateKey[] = [
  "discover",
  "define",
  "design",
  "tools",
  "memory",
  "estimate",
  "blueprint_free_ready",
  "blueprint_pro_access_requested",
  "blueprint_pro_access_pending",
  "blueprint_pro_active",
  "acp_access_requested",
  "acp_access_pending",
  "acp_prep",
  "validate",
  "package",
  "completed",
];

const JOURNEY_SUBSTATES: JourneyStateSubstate[] = [
  "idle",
  "running",
  "waiting_user",
  "waiting_dependency",
  "retrying",
  "completed",
  "failed",
  "blocked",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isJourneyStateKey(value: unknown): value is JourneyStateKey {
  return typeof value === "string" && JOURNEY_STATE_KEYS.includes(value as JourneyStateKey);
}

function isJourneyStateSubstate(value: unknown): value is JourneyStateSubstate {
  return typeof value === "string" && JOURNEY_SUBSTATES.includes(value as JourneyStateSubstate);
}

function isJourneyStateMachineStage(value: unknown): value is JourneyStateMachineStage {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isJourneyStateKey(value.state_key) &&
    isJourneyStateSubstate(value.substate) &&
    typeof value.label === "string" &&
    typeof value.detail === "string" &&
    typeof value.product_key === "string" &&
    typeof value.stage_key === "string" &&
    typeof value.href === "string" &&
    typeof value.progress_percent === "number" &&
    typeof value.blocking === "boolean"
  );
}

export function readJourneyStateMachine(value: unknown): JourneyStateMachine | null {
  if (!isRecord(value) || value.contract_version !== "journey-state-machine.v1") {
    return null;
  }

  if (
    typeof value.workspace_id !== "string" ||
    typeof value.session_id !== "string" ||
    !Array.isArray(value.source_contracts) ||
    !isJourneyStateMachineStage(value.current)
  ) {
    return null;
  }

  return value as JourneyStateMachine;
}

export function getJourneyStateMachineCurrent(value: unknown): JourneyStateMachineStage | null {
  return readJourneyStateMachine(value)?.current ?? null;
}

export function getJourneyStateMachineTier(value: unknown): CommercialTier | null {
  const current = getJourneyStateMachineCurrent(value);
  if (!current) {
    return null;
  }

  if (current.product_key === "acp") {
    return "acp";
  }

  if (current.product_key === "blueprint_pro") {
    return "blueprint_pro";
  }

  return "blueprint";
}

export function normalizeProductJourneyOverview(payload: unknown): ProductJourneyOverview {
  if (!isRecord(payload) || payload.contract_version !== "product-journey-overview.v2") {
    throw new Error("Expected product-journey-overview.v2 response.");
  }

  if (typeof payload.workspace_id !== "string" || typeof payload.session_id !== "string") {
    throw new Error("Product journey overview requires workspace_id and session_id.");
  }

  if (!Array.isArray(payload.products)) {
    throw new Error("Product journey overview requires products.");
  }

  if (!isRecord(payload.current_stage)) {
    throw new Error("Product journey overview requires current_stage.");
  }

  if (payload.recommended_next_action !== null && !isRecord(payload.recommended_next_action)) {
    throw new Error("Product journey overview recommended_next_action must be null or an object.");
  }

  if (payload.journey_state_machine !== undefined && payload.journey_state_machine !== null && !isRecord(payload.journey_state_machine)) {
    throw new Error("Product journey overview journey_state_machine must be null or an object.");
  }

  return payload as ProductJourneyOverview;
}
