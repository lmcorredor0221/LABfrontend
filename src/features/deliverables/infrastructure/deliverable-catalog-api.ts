import { apiClient } from "@/core/api/client";
import type {
  CommercialTier,
  DeliverableCatalogResponse,
  DeliverableDetailResponse,
} from "@/features/deliverables/domain/types";

function buildQuery(params: Record<string, string | boolean | undefined>) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") {
      continue;
    }
    search.set(key, String(value));
  }

  const query = search.toString();
  return query ? `?${query}` : "";
}

export const deliverableCatalogApi = {
  list({
    currentStage = "estimate",
    includeInactive = false,
    sessionId,
    tier = "blueprint",
  }: {
    currentStage?: string;
    includeInactive?: boolean;
    sessionId?: string;
    tier?: CommercialTier;
  } = {}) {
    return apiClient.get<DeliverableCatalogResponse>(
      `/v3/deliverables/catalog${buildQuery({
        current_stage: currentStage,
        include_inactive: includeInactive,
        session_id: sessionId,
        tier,
      })}`,
    );
  },

  detail({
    deliverableKey,
    currentStage = "estimate",
    sessionId,
    tier = "blueprint",
  }: {
    deliverableKey: string;
    currentStage?: string;
    sessionId?: string;
    tier?: CommercialTier;
  }) {
    return apiClient.get<DeliverableDetailResponse>(
      `/v3/deliverables/${encodeURIComponent(deliverableKey)}${buildQuery({
        current_stage: currentStage,
        session_id: sessionId,
        tier,
      })}`,
    );
  },
};
