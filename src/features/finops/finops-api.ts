import { apiClient } from "@/core/api";
import type {
  FinOpsAlertListQuery,
  FinOpsAlertListResponse,
  FinOpsBudgetListQuery,
  FinOpsBudgetListResponse,
  FinOpsBudgetPolicy,
  FinOpsBudgetPolicyCreateRequest,
  FinOpsBudgetPolicyPatchRequest,
  FinOpsProviderBreakdownResponse,
  FinOpsSummary,
  FinOpsSummaryQuery,
  FinOpsTimeseriesQuery,
  FinOpsTimeseriesResponse,
  FinOpsTopConsumersQuery,
  FinOpsTopConsumersResponse,
  FinOpsUsageListResponse,
  FinOpsUsageQuery,
} from "@/features/finops/finops-contracts";

type QueryValue = boolean | number | string | null | undefined;

function buildQueryString(params: Record<string, QueryValue>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    searchParams.set(key, String(value));
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export function createFinOpsApi(client = apiClient) {
  return {
    listUsage(params: FinOpsUsageQuery = {}) {
      return client.get<FinOpsUsageListResponse>(`/api/v1/finops/llm/usage${buildQueryString(params)}`);
    },
    getSummary(params: FinOpsSummaryQuery = {}) {
      return client.get<FinOpsSummary>(`/api/v1/finops/llm/summary${buildQueryString(params)}`);
    },
    getTopConsumers(params: FinOpsTopConsumersQuery = {}) {
      return client.get<FinOpsTopConsumersResponse>(`/api/v1/finops/llm/top-consumers${buildQueryString(params)}`);
    },
    getProviderBreakdown(params: FinOpsSummaryQuery = {}) {
      return client.get<FinOpsProviderBreakdownResponse>(
        `/api/v1/finops/llm/provider-breakdown${buildQueryString(params)}`,
      );
    },
    getTimeseries(params: FinOpsTimeseriesQuery = {}) {
      return client.get<FinOpsTimeseriesResponse>(`/api/v1/finops/llm/timeseries${buildQueryString(params)}`);
    },
    listBudgets(params: FinOpsBudgetListQuery = {}) {
      return client.get<FinOpsBudgetListResponse>(`/api/v1/finops/llm/budgets${buildQueryString(params)}`);
    },
    createBudget(payload: FinOpsBudgetPolicyCreateRequest) {
      return client.post<FinOpsBudgetPolicy>("/api/v1/finops/llm/budgets", {
        body: payload,
      });
    },
    updateBudget(budgetId: string, payload: FinOpsBudgetPolicyPatchRequest) {
      return client.patch<FinOpsBudgetPolicy>(`/api/v1/finops/llm/budgets/${encodeURIComponent(budgetId)}`, {
        body: payload,
      });
    },
    listAlerts(params: FinOpsAlertListQuery = {}) {
      return client.get<FinOpsAlertListResponse>(`/api/v1/finops/llm/alerts${buildQueryString(params)}`);
    },
  };
}

export type FinOpsApi = ReturnType<typeof createFinOpsApi>;

export const finOpsApi = createFinOpsApi();
