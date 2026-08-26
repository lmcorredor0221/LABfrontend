import { apiClient, type ApiRequestOptions } from "@/core/api";
import { getLongRunningApiRequestTimeoutMs } from "@/core/config/runtime";
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
  EstimationEnvelope,
  ToolRecommendationEnvelope,
  ToolRecommendationRequest,
} from "@/features/sessions/session-contracts";
import type {
  ProductExperienceApiRequestOptions,
  ProductExperienceAttentionParams,
  ProductExperienceMutationRequestOptions,
  ProductExperienceStageOperation,
  ProductExperienceStageOperationParams,
} from "@/features/product-experience/core/server-state/types";

type ProductExperienceApiClient = Pick<typeof apiClient, "get" | "patch" | "post">;

const LONG_RUNNING_STAGE_TIMEOUT_MS = getLongRunningApiRequestTimeoutMs();
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

function mutationRequestOptions(options: ProductExperienceMutationRequestOptions | undefined): Pick<ApiRequestOptions, "headers" | "signal"> {
  const headers = new Headers();
  if (options?.idempotencyKey) {
    headers.set("x-idempotency-key", options.idempotencyKey);
  }

  return {
    headers,
    signal: options?.signal ?? undefined,
  };
}

const STAGE_OPERATION_POLL_INTERVAL_MS = 2_500;
const STAGE_OPERATION_MAX_WAIT_MS = 20 * 60_000;

function abortError() {
  return new DOMException("The stage operation polling was aborted.", "AbortError");
}

function waitForPollInterval(signal: AbortSignal | null | undefined) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }

    const timeoutId = globalThis.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, STAGE_OPERATION_POLL_INTERVAL_MS);

    function onAbort() {
      globalThis.clearTimeout(timeoutId);
      reject(abortError());
    }

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function isOperationPending(status: ProductExperienceStageOperation["status"]) {
  return status === "queued" || status === "running" || status === "waiting_for_user";
}

async function pollStageOperationUntilArtifact(
  client: ProductExperienceApiClient,
  sessionId: string,
  operation: ProductExperienceStageOperation,
  options?: ProductExperienceApiRequestOptions,
) {
  const startedAt = Date.now();
  let current = operation;

  while (isOperationPending(current.status)) {
    if (Date.now() - startedAt > STAGE_OPERATION_MAX_WAIT_MS) {
      throw new Error(
        `La operacion ${current.id} sigue en proceso despues del umbral de espera local. Recarga para continuar el seguimiento.`,
      );
    }
    await waitForPollInterval(options?.signal);
    current = await client.get<ProductExperienceStageOperation>(
      `/api/v1/sessions/${sessionId}/stage-operations/${current.id}`,
      {
        timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
        ...requestOptions(options),
      },
    );
  }

  if (current.status === "completed" && current.result) {
    return current.result;
  }

  const detail = [current.error_message, current.technical_detail, current.detail].filter(Boolean).join(" | ");
  throw new Error(detail || `La operacion ${current.id} finalizo sin artefacto de Diseno.`);
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
    getCurrentStageOperation(
      sessionId: string,
      params: ProductExperienceStageOperationParams = {},
      options?: ProductExperienceApiRequestOptions,
    ) {
      return client.get<ProductExperienceStageOperation | null>(
        `/api/v1/sessions/${sessionId}/stage-operations/current${buildQueryString(params)}`,
        {
          timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
          ...requestOptions(options),
        },
      );
    },
    getStageOperation(
      sessionId: string,
      operationId: string,
      options?: ProductExperienceApiRequestOptions,
    ) {
      return client.get<ProductExperienceStageOperation>(
        `/api/v1/sessions/${sessionId}/stage-operations/${operationId}`,
        {
          timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
          ...requestOptions(options),
        },
      );
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
    startAnalyzeDiscovery(
      sessionId: string,
      payload: DiscoveryInput,
      options?: ProductExperienceMutationRequestOptions,
    ) {
      return client.post<ProductExperienceStageOperation>(`/api/v1/sessions/${sessionId}/analyze-discovery/start`, {
        body: payload,
        timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
        ...mutationRequestOptions(options),
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
    startDefineRequirements(
      sessionId: string,
      options?: ProductExperienceMutationRequestOptions,
    ) {
      return client.post<ProductExperienceStageOperation>(`/api/v1/sessions/${sessionId}/define-requirements/start`, {
        timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
        ...mutationRequestOptions(options),
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
      return client.post<ProductExperienceStageOperation>(`/api/v1/sessions/${sessionId}/propose-design/start`, {
        body: payload,
        timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
        ...requestOptions(options),
      }).then((operation) => pollStageOperationUntilArtifact(client, sessionId, operation, options));
    },
    startProposeDesign(
      sessionId: string,
      payload: DesignProposalRequest = {},
      options?: ProductExperienceMutationRequestOptions,
    ) {
      return client.post<ProductExperienceStageOperation>(`/api/v1/sessions/${sessionId}/propose-design/start`, {
        body: payload,
        timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
        ...mutationRequestOptions(options),
      });
    },
    retryStageOperation(
      sessionId: string,
      operationId: string,
      options?: ProductExperienceApiRequestOptions,
    ) {
      return client.post<ProductExperienceStageOperation>(
        `/api/v1/sessions/${sessionId}/stage-operations/${operationId}/retry`,
        {
          timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
          ...requestOptions(options),
        },
      );
    },
    cancelStageOperation(
      sessionId: string,
      operationId: string,
      options?: ProductExperienceApiRequestOptions,
    ) {
      return client.post<ProductExperienceStageOperation>(
        `/api/v1/sessions/${sessionId}/stage-operations/${operationId}/cancel`,
        {
          timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
          ...requestOptions(options),
        },
      );
    },
    recoverStageOperation(
      sessionId: string,
      operationId: string,
      options?: ProductExperienceApiRequestOptions,
    ) {
      return client.post<ProductExperienceStageOperation>(
        `/api/v1/sessions/${sessionId}/stage-operations/${operationId}/recover`,
        {
          timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
          ...requestOptions(options),
        },
      );
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
    startRecommendTools(
      sessionId: string,
      payload: ToolRecommendationRequest = {},
      options?: ProductExperienceMutationRequestOptions,
    ) {
      return client.post<ProductExperienceStageOperation>(`/api/v1/sessions/${sessionId}/recommend-tools/start`, {
        body: payload,
        timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
        ...mutationRequestOptions(options),
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
    startRecommendMemory(
      sessionId: string,
      payload: MemoryRecommendationRequest = {},
      options?: ProductExperienceMutationRequestOptions,
    ) {
      return client.post<ProductExperienceStageOperation>(`/api/v1/sessions/${sessionId}/recommend-memory/start`, {
        body: payload,
        timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
        ...mutationRequestOptions(options),
      });
    },
    generateEstimationReport(sessionId: string, options?: ProductExperienceApiRequestOptions) {
      return client.post<EstimationEnvelope>(`/api/v1/sessions/${sessionId}/estimate`, {
        timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
        ...requestOptions(options),
      });
    },
    startGenerateEstimationReport(sessionId: string, options?: ProductExperienceMutationRequestOptions) {
      return client.post<ProductExperienceStageOperation>(`/api/v1/sessions/${sessionId}/estimate/start`, {
        timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
        ...mutationRequestOptions(options),
      });
    },
    prepareBlueprintCommercialResult(sessionId: string, options?: ProductExperienceApiRequestOptions) {
      return client.post<SessionSnapshot>(`/api/v1/sessions/${sessionId}/blueprint/commercial-result`, {
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
          timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
          ...requestOptions(options),
        },
      );
    },
  };
}

export type ProductExperienceApiClientInstance = ReturnType<typeof createProductExperienceApi>;

export const productExperienceApi = createProductExperienceApi();
