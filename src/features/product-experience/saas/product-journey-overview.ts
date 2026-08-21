import type {
  ProductBuildActionState,
  ProductBuildCurrentActivity,
  ProductBuildLifecycle,
  ProductBuildProductKey,
} from "@/features/product-experience/saas/product-build-status";

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
  generated_at: string;
  source_contracts: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

  return payload as ProductJourneyOverview;
}
