export type LLMBudgetScopeType = "workspace" | "user" | "project" | "initiative" | "stage" | "provider" | "model";

export type LLMBudgetPeriodType = "daily" | "weekly" | "monthly" | "custom";

export type FinOpsAlertSeverity = "low" | "medium" | "high" | "critical" | string;

export type FinOpsBudgetStatus = "ok" | "warning" | "hard_limit" | "inactive" | "unconfigured" | string;

export type FinOpsUsageRecord = {
  id: string;
  workspace_id: string | null;
  user_id: string | null;
  session_id: string | null;
  project_id: string | null;
  initiative_id: string | null;
  started_at: string;
  stage: string;
  substage: string;
  agent_key: string;
  capability_key: string;
  provider_key: string;
  model_name: string;
  execution_backend: string;
  execution_mode: string;
  request_id: string;
  status: string;
  duration_ms: number;
  queue_wait_ms: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cached_input_tokens: number;
  reasoning_tokens: number;
  cost_input: number;
  cost_output: number;
  cost_other: number;
  cost_total: number;
  currency: string;
  pricing_profile_key: string;
  fallback_used: boolean;
  retry_count: number;
};

export type FinOpsUsageListResponse = {
  items: FinOpsUsageRecord[];
  count: number;
  limit: number;
  offset: number;
};

export type FinOpsAvailability = {
  reason: string;
  source: string;
  status: "available" | "empty" | "partial" | "not_instrumented" | string;
};

export type FinOpsCurrencyBreakdownItem = {
  call_count: number;
  cost_total: number;
  currency: string;
};

export type FinOpsSummary = {
  call_count: number;
  cost_total: number;
  currency?: string;
  currency_breakdown?: FinOpsCurrencyBreakdownItem[];
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  cost_per_call: number;
  avg_latency_ms: number;
  p95_latency_ms: number;
  error_count: number;
  error_rate: number;
  retry_count: number;
  fallback_count: number;
  estimated_count?: number;
  estimated_availability?: FinOpsAvailability;
};

export type FinOpsTopConsumer = {
  dimension: string;
  key: string;
  call_count: number;
  cost_total: number;
  total_tokens: number;
  error_count: number;
};

export type FinOpsTopConsumersResponse = {
  items: FinOpsTopConsumer[];
  dimension: string;
  count: number;
};

export type FinOpsProviderBreakdownItem = {
  provider_key: string;
  model_name: string;
  call_count: number;
  cost_total: number;
  total_tokens: number;
  error_count: number;
};

export type FinOpsProviderBreakdownResponse = {
  items: FinOpsProviderBreakdownItem[];
  count: number;
};

export type FinOpsTimeseriesItem = {
  bucket: string;
  period_start: string;
  granularity: "day" | "week" | "month" | string;
  call_count: number;
  cost_total: number;
  currency: string;
  currency_breakdown: FinOpsCurrencyBreakdownItem[];
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  error_count: number;
  error_rate: number;
  retry_count: number;
  fallback_count: number;
  estimated_count: number;
};

export type FinOpsTimeseriesResponse = {
  availability: FinOpsAvailability;
  count: number;
  granularity: "day" | "week" | "month" | string;
  items: FinOpsTimeseriesItem[];
};

export type FinOpsBudgetEvaluation = {
  policy_id: string;
  policy_key: string;
  workspace_id: string;
  scope_type: LLMBudgetScopeType | string;
  scope_value: string;
  period_type: LLMBudgetPeriodType | string;
  period_start: string;
  period_end: string;
  limit_amount: number;
  currency: string;
  consumed_amount: number;
  remaining_amount: number;
  percent_consumed: number;
  status: FinOpsBudgetStatus;
  thresholds_reached: number[];
  next_threshold_percent: number | null;
  call_count: number;
  total_tokens: number;
  is_warning: boolean;
  is_hard_limit: boolean;
};

export type FinOpsBudgetPolicy = {
  id: string;
  workspace_id: string;
  policy_key: string;
  name: string;
  description: string;
  scope_type: LLMBudgetScopeType | string;
  scope_value: string;
  user_id: string | null;
  project_id: string | null;
  initiative_id: string | null;
  stage: string;
  provider_key: string;
  model_name: string;
  period_type: LLMBudgetPeriodType | string;
  custom_period_start: string | null;
  custom_period_end: string | null;
  limit_amount: number;
  currency: string;
  threshold_percentages: number[];
  hard_limit_percent: number;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  evaluation?: FinOpsBudgetEvaluation;
};

export type FinOpsBudgetListResponse = {
  items: FinOpsBudgetPolicy[];
  count: number;
};

export type FinOpsBudgetPolicyCreateRequest = {
  policy_key?: string;
  name?: string;
  description?: string;
  scope_type?: LLMBudgetScopeType;
  scope_value?: string;
  user_id?: string | null;
  project_id?: string | null;
  initiative_id?: string | null;
  stage?: string;
  provider_key?: string;
  model_name?: string;
  period_type?: LLMBudgetPeriodType;
  custom_period_start?: string | null;
  custom_period_end?: string | null;
  limit_amount: number;
  currency?: string;
  threshold_percentages?: number[];
  hard_limit_percent?: number;
  metadata?: Record<string, unknown>;
};

export type FinOpsBudgetPolicyPatchRequest = Partial<FinOpsBudgetPolicyCreateRequest> & {
  is_active?: boolean;
};

export type FinOpsAlert = {
  id: string;
  workspace_id: string;
  budget_policy_id: string | null;
  usage_record_id: string | null;
  alert_key: string;
  alert_type: string;
  severity: FinOpsAlertSeverity;
  title: string;
  message: string;
  status: string;
  scope_type: LLMBudgetScopeType | string;
  scope_value: string;
  provider_key: string;
  model_name: string;
  stage: string;
  threshold_percent: number;
  period_start: string;
  period_end: string;
  consumed_amount: number;
  limit_amount: number;
  currency: string;
  evidence: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

export type FinOpsAlertListResponse = {
  items: FinOpsAlert[];
  count: number;
};

export type FinOpsUsageQuery = {
  started_from?: string | null;
  started_to?: string | null;
  user_id?: string | null;
  session_id?: string | null;
  project_id?: string | null;
  initiative_id?: string | null;
  stage?: string | null;
  agent_key?: string | null;
  capability_key?: string | null;
  provider_key?: string | null;
  model_name?: string | null;
  limit?: number;
  offset?: number;
};

export type FinOpsSummaryQuery = Omit<FinOpsUsageQuery, "limit" | "offset">;

export type FinOpsTimeseriesQuery = FinOpsSummaryQuery & {
  granularity?: "day" | "week" | "month";
};

export type FinOpsTopConsumersQuery = FinOpsSummaryQuery & {
  dimension?: string;
  limit?: number;
};

export type FinOpsBudgetListQuery = {
  include_inactive?: boolean;
  include_evaluations?: boolean;
  as_of?: string | null;
};

export type FinOpsAlertListQuery = {
  status?: string;
  sync?: boolean;
  as_of?: string | null;
  limit?: number;
};
