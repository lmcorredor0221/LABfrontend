import { apiClient } from "@/core/api/client";
import type {
  DeliverableGovernanceEntry,
  DeliverableGovernanceOverview,
  DeliverableGovernanceResponse,
  DeliverableGovernanceUpdate,
  DeliverablePromptResponse,
  DeliverablePromptUpdate,
  DeliverablePromptValidationRequest,
  DeliverablePromptValidationResponse,
} from "@/features/deliverables/domain/types";

type GovernanceScope = "platform" | "workspace";

type DeliverableGovernanceOverviewFilters = {
  product?: "blueprint" | "blueprint_pro" | "acp";
  stage?: string;
  type?: string;
  quality_state?: "unknown" | "passed" | "warning" | "failed" | "stale";
};

function scopeQuery(scope: GovernanceScope, filters: DeliverableGovernanceOverviewFilters = {}) {
  const params = new URLSearchParams({ scope });
  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params.set(key, value);
    }
  }
  return `?${params.toString()}`;
}

export const deliverableGovernanceApi = {
  list(scope: GovernanceScope = "platform") {
    return apiClient.get<DeliverableGovernanceResponse>(`/v3/admin/deliverable-governance${scopeQuery(scope)}`);
  },
  overview(scope: GovernanceScope = "platform", filters: DeliverableGovernanceOverviewFilters = {}) {
    return apiClient.get<DeliverableGovernanceOverview>(
      `/v3/admin/deliverable-governance/overview${scopeQuery(scope, filters)}`,
    );
  },
  update(deliverableKey: string, payload: DeliverableGovernanceUpdate, scope: GovernanceScope = "platform") {
    return apiClient.patch<DeliverableGovernanceEntry>(
      `/v3/admin/deliverable-governance/${encodeURIComponent(deliverableKey)}${scopeQuery(scope)}`,
      { body: payload },
    );
  },
  getPrompt(deliverableKey: string, scope: GovernanceScope = "platform") {
    return apiClient.get<DeliverablePromptResponse>(
      `/v3/admin/deliverable-governance/${encodeURIComponent(deliverableKey)}/prompt${scopeQuery(scope)}`,
    );
  },
  updatePrompt(deliverableKey: string, payload: DeliverablePromptUpdate, scope: GovernanceScope = "platform") {
    return apiClient.patch<DeliverablePromptResponse>(
      `/v3/admin/deliverable-governance/${encodeURIComponent(deliverableKey)}/prompt${scopeQuery(scope)}`,
      { body: payload },
    );
  },
  validatePrompt(deliverableKey: string, payload: DeliverablePromptValidationRequest) {
    return apiClient.post<DeliverablePromptValidationResponse>(
      `/v3/admin/deliverable-governance/${encodeURIComponent(deliverableKey)}/prompt/validate`,
      { body: payload },
    );
  },
};
