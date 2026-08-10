import { apiClient } from "@/core/api/client";
import type {
  DiagramGovernanceEntry,
  DiagramGovernanceOverview,
  DiagramGovernanceResponse,
  DiagramGovernanceUpdate,
} from "@/features/diagram-center/domain/governance-types";

export const diagramGovernanceApi = {
  list() {
    return apiClient.get<DiagramGovernanceResponse>("/v3/admin/diagram-governance");
  },
  overview() {
    return apiClient.get<DiagramGovernanceOverview>("/v3/admin/diagram-governance/overview");
  },
  update(diagramKey: string, payload: DiagramGovernanceUpdate) {
    return apiClient.patch<DiagramGovernanceEntry>(
      `/v3/admin/diagram-governance/${encodeURIComponent(diagramKey)}`,
      { body: payload },
    );
  },
};
