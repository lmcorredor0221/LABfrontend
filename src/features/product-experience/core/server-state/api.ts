import { apiClient, type ApiRequestOptions } from "@/core/api";
import type { AuthUser } from "@/core/auth/types";
import type {
  AttentionActionRequestV2,
  AttentionActionResultV2,
  AttentionResponseV2,
} from "@/features/attention/attention-contracts";
import type {
  ActivityResponse,
  ProductOverviewResponse,
  SessionListResponse,
  SessionSnapshot,
} from "@/features/sessions/types";
import type {
  ApproveToolsSelectionRequest,
  CanvasEnvelope,
  DesignProposalRequest,
  DiscoveryEnvelope,
  DiscoveryInput,
  JourneyStageArtifactApprovalRequest,
  JourneyStageArtifactEntry,
  JourneyStageArtifactPatchRequest,
  JourneyStageArtifactRejectionRequest,
  JourneyStageKey,
  MemoryRecommendationRequest,
  ToolRecommendationEnvelope,
  ToolRecommendationRequest,
} from "@/features/sessions/session-contracts";
import type {
  ProductExperienceApiRequestOptions,
  ProductExperienceAttentionParams,
} from "@/features/product-experience/core/server-state/types";

type ProductExperienceApiClient = Pick<typeof apiClient, "get" | "patch" | "post">;

const LONG_RUNNING_STAGE_TIMEOUT_MS = 120000;

function buildQueryString(params: Record<string, string | number | null | undefined>) {
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

function requestOptions(options: ProductExperienceApiRequestOptions | undefined): Pick<ApiRequestOptions, "signal"> {
  return {
    signal: options?.signal ?? undefined,
  };
}

export function createProductExperienceApi(client: ProductExperienceApiClient = apiClient) {
  return {
    getActivity(sessionId: string, limit: number, options?: ProductExperienceApiRequestOptions) {
      return client.get<ActivityResponse>(`/api/v1/sessions/${sessionId}/activity${buildQueryString({ limit })}`, {
        timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
        ...requestOptions(options),
      });
    },
    getAttentionV2(
      sessionId: string,
      params: ProductExperienceAttentionParams,
      options?: ProductExperienceApiRequestOptions,
    ) {
      return client.get<AttentionResponseV2>(`/api/v1/sessions/${sessionId}/attention-v2${buildQueryString(params)}`, {
        timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
        ...requestOptions(options),
      });
    },
    getAuth(options?: ProductExperienceApiRequestOptions) {
      return client.get<AuthUser>("/api/v1/auth/me", {
        includeWorkspaceId: false,
        redirectOnUnauthorized: false,
        ...requestOptions(options),
      });
    },
    getProductOverview(sessionId: string, options?: ProductExperienceApiRequestOptions) {
      return client.get<ProductOverviewResponse>(`/api/v1/sessions/${sessionId}/product-overview`, {
        timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
        ...requestOptions(options),
      });
    },
    getSnapshot(sessionId: string, options?: ProductExperienceApiRequestOptions) {
      return client.get<SessionSnapshot>(`/api/v1/sessions/${sessionId}`, {
        timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
        ...requestOptions(options),
      });
    },
    listSessions(options?: ProductExperienceApiRequestOptions) {
      return client.get<SessionListResponse>("/api/v1/sessions", {
        ...requestOptions(options),
      });
    },
    analyzeDiscovery(sessionId: string, payload: DiscoveryInput, options?: ProductExperienceApiRequestOptions) {
      return client.post<JourneyStageArtifactEntry>(`/api/v1/sessions/${sessionId}/analyze-discovery`, {
        body: payload,
        timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
        ...requestOptions(options),
      });
    },
    buildCanvas(sessionId: string, options?: ProductExperienceApiRequestOptions) {
      return client.post<CanvasEnvelope>(`/api/v1/sessions/${sessionId}/build-canvas`, {
        timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
        ...requestOptions(options),
      });
    },
    defineRequirements(sessionId: string, options?: ProductExperienceApiRequestOptions) {
      return client.post<JourneyStageArtifactEntry>(`/api/v1/sessions/${sessionId}/define-requirements`, {
        timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
        ...requestOptions(options),
      });
    },
    normalizeDiscovery(sessionId: string, payload: DiscoveryInput, options?: ProductExperienceApiRequestOptions) {
      return client.post<DiscoveryEnvelope>(`/api/v1/sessions/${sessionId}/normalize-discovery`, {
        body: payload,
        timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
        ...requestOptions(options),
      });
    },
    proposeDesign(
      sessionId: string,
      payload: DesignProposalRequest = {},
      options?: ProductExperienceApiRequestOptions,
    ) {
      return client.post<JourneyStageArtifactEntry>(`/api/v1/sessions/${sessionId}/propose-design`, {
        body: payload,
        timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
        ...requestOptions(options),
      });
    },
    recommendTools(
      sessionId: string,
      payload: ToolRecommendationRequest = {},
      options?: ProductExperienceApiRequestOptions,
    ) {
      return client.post<ToolRecommendationEnvelope>(`/api/v1/sessions/${sessionId}/recommend-tools`, {
        body: payload,
        timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
        ...requestOptions(options),
      });
    },
    recommendMemory(
      sessionId: string,
      payload: MemoryRecommendationRequest = {},
      options?: ProductExperienceApiRequestOptions,
    ) {
      return client.post<JourneyStageArtifactEntry>(`/api/v1/sessions/${sessionId}/recommend-memory`, {
        body: payload,
        timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
        ...requestOptions(options),
      });
    },
    approveToolsSelection(
      sessionId: string,
      payload: ApproveToolsSelectionRequest,
      options?: ProductExperienceApiRequestOptions,
    ) {
      return client.post<SessionSnapshot>(`/api/v1/sessions/${sessionId}/approve-tools-selection`, {
        body: payload,
        timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
        ...requestOptions(options),
      });
    },
    approveMemoryProfile(
      sessionId: string,
      payload: JourneyStageArtifactApprovalRequest,
      options?: ProductExperienceApiRequestOptions,
    ) {
      return client.post<SessionSnapshot>(`/api/v1/sessions/${sessionId}/approve-memory-profile`, {
        body: payload,
        timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
        ...requestOptions(options),
      });
    },
    approveJourneyArtifact(
      sessionId: string,
      stageKey: JourneyStageKey,
      artifactId: string,
      payload: JourneyStageArtifactApprovalRequest,
      options?: ProductExperienceApiRequestOptions,
    ) {
      return client.post<JourneyStageArtifactEntry>(
        `/api/v1/sessions/${sessionId}/journey/${stageKey}/artifacts/${encodeURIComponent(artifactId)}/approve`,
        {
          body: payload,
          ...requestOptions(options),
        },
      );
    },
    patchJourneyArtifact(
      sessionId: string,
      stageKey: JourneyStageKey,
      artifactId: string,
      payload: JourneyStageArtifactPatchRequest,
      options?: ProductExperienceApiRequestOptions,
    ) {
      return client.patch<JourneyStageArtifactEntry>(
        `/api/v1/sessions/${sessionId}/journey/${stageKey}/artifacts/${encodeURIComponent(artifactId)}`,
        {
          body: payload,
          ...requestOptions(options),
        },
      );
    },
    rejectJourneyArtifact(
      sessionId: string,
      stageKey: JourneyStageKey,
      artifactId: string,
      payload: JourneyStageArtifactRejectionRequest,
      options?: ProductExperienceApiRequestOptions,
    ) {
      return client.post<JourneyStageArtifactEntry>(
        `/api/v1/sessions/${sessionId}/journey/${stageKey}/artifacts/${encodeURIComponent(artifactId)}/reject`,
        {
          body: payload,
          ...requestOptions(options),
        },
      );
    },
    resolveAttentionItemV2(
      sessionId: string,
      itemKey: string,
      payload: AttentionActionRequestV2,
      options?: ProductExperienceApiRequestOptions,
    ) {
      return client.post<AttentionActionResultV2>(
        `/api/v1/sessions/${sessionId}/attention-v2/${encodeURIComponent(itemKey)}/actions`,
        {
          body: payload,
          ...requestOptions(options),
        },
      );
    },
  };
}

export type ProductExperienceApiClientInstance = ReturnType<typeof createProductExperienceApi>;

export const productExperienceApi = createProductExperienceApi();
