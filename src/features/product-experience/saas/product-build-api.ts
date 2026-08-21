import { apiClient, type ApiRequestOptions } from "@/core/api";
import {
  normalizeProductBuildStatus,
  type ProductBuildProductKey,
  type ProductBuildStatus,
} from "@/features/product-experience/saas/product-build-status";
import {
  normalizeProductJourneyOverview,
  type ProductJourneyOverview,
} from "@/features/product-experience/saas/product-journey-overview";

export type ProductBuildApiRequestOptions = Pick<ApiRequestOptions, "signal">;

export type ProductBuildApiClient = {
  get: typeof apiClient.get;
  post?: typeof apiClient.post;
};

export type ProductBuildApi = ReturnType<typeof createProductBuildApi>;

export function createProductBuildApi(client: ProductBuildApiClient = apiClient) {
  return {
    async getProductBuildStatus(
      sessionId: string,
      productKey: ProductBuildProductKey,
      options?: ProductBuildApiRequestOptions,
    ): Promise<ProductBuildStatus> {
      const payload = await client.get<unknown>(`/api/v1/sessions/${sessionId}/product-builds/${productKey}`, {
        signal: options?.signal ?? undefined,
      });
      return normalizeProductBuildStatus(payload);
    },

    async executeProductBuildAction(
      sessionId: string,
      productKey: ProductBuildProductKey,
      command: { action: "start" | "resume" | "retry"; allow_llm?: boolean; idempotency_key?: string },
      options?: ProductBuildApiRequestOptions,
    ): Promise<ProductBuildStatus> {
      if (!client.post) {
        throw new Error("client.post is not implemented.");
      }
      const payload = await client.post<unknown>(`/api/v1/sessions/${sessionId}/product-builds/${productKey}/actions`, {
        body: command,
        signal: options?.signal ?? undefined,
      });
      return normalizeProductBuildStatus(payload);
    },

    async listProductBuildStatuses(
      sessionId: string,
      options?: ProductBuildApiRequestOptions,
    ): Promise<ProductBuildStatus[]> {
      const payload = await client.get<unknown[]>(`/api/v1/sessions/${sessionId}/product-builds`, {
        signal: options?.signal ?? undefined,
      });
      return payload.map((item) => normalizeProductBuildStatus(item));
    },

    async getProductJourneyOverview(
      sessionId: string,
      options?: ProductBuildApiRequestOptions,
    ): Promise<ProductJourneyOverview> {
      const payload = await client.get<unknown>(`/api/v1/sessions/${sessionId}/product-journey-overview`, {
        signal: options?.signal ?? undefined,
      });
      return normalizeProductJourneyOverview(payload);
    },
  };
}

export const productBuildApi = createProductBuildApi();
