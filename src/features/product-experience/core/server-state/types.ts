import type { ApiError } from "@/core/api";
import type { AuthUser } from "@/core/auth/types";
import type {
  AttentionActionRequestV2,
  AttentionActionResultV2,
  AttentionResponseV2,
} from "@/features/attention/attention-contracts";
import type { ActivityResponse, ProductOverviewResponse, SessionListResponse, SessionSnapshot } from "@/features/sessions/types";
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

export type ProductServerResource = "auth" | "list" | "snapshot" | "attention" | "operation";

export type ProductServerStatus = "idle" | "loading" | "ready" | "error" | "aborted";

export type ProductRouteStage =
  | "discover"
  | "define"
  | "design"
  | "tools"
  | "memory"
  | "validate"
  | "estimate"
  | "package"
  | "blueprint"
  | "acp"
  | "attention"
  | "activity"
  | string;

export type ProductServerResourceState<T> = {
  data: T | null;
  error: ApiError | Error | null;
  requestKey: string;
  status: ProductServerStatus;
  updatedAt: number | null;
  version: string;
};

export type ProductExperienceStageOperationStatus =
  | "queued"
  | "running"
  | "waiting_for_user"
  | "completed"
  | "failed"
  | "cancelled";

export type ProductExperienceStageOperationStep = {
  detail: string;
  key: string;
  label: string;
  status: string;
};

export type ProductExperienceStageOperation = {
  action: string;
  attempt_count: number;
  can_cancel: boolean;
  can_retry: boolean;
  cancel_requested_at: string | null;
  cancel_url: string;
  completed_at: string | null;
  created_at: string;
  current_step: string;
  detail: string;
  error_message: string;
  expires_at: string | null;
  heartbeat_at: string | null;
  id: string;
  idempotency_key: string;
  is_stale: boolean;
  recover_url: string;
  result: JourneyStageArtifactEntry | null;
  result_artifact_id: string | null;
  retry_url: string;
  session_id: string;
  stage_key: string;
  status: ProductExperienceStageOperationStatus;
  steps: ProductExperienceStageOperationStep[];
  technical_detail: string;
  updated_at: string;
  workspace_id: string;
};

export type ProductExperienceOperationState = {
  activity: ActivityResponse | null;
  overview: ProductOverviewResponse | null;
  stageOperation: ProductExperienceStageOperation | null;
};

export type ProductExperienceRouteSnapshot = {
  attention: ProductServerResourceState<AttentionResponseV2>;
  auth: ProductServerResourceState<AuthUser>;
  list: ProductServerResourceState<SessionListResponse>;
  operation: ProductServerResourceState<ProductExperienceOperationState>;
  requestId: number;
  route: ProductRouteState;
  snapshot: ProductServerResourceState<SessionSnapshot>;
};

export type ProductRouteState = {
  currentStage: ProductRouteStage;
  sessionId: string;
};

export type ProductExperienceLoadOptions = {
  force?: boolean;
  signal?: AbortSignal | null;
};

export type ProductExperienceMutationOptions = {
  idempotencyKey?: string;
  signal?: AbortSignal | null;
};

export type ProductExperienceApi = {
  getActivity(sessionId: string, limit: number, options?: ProductExperienceApiRequestOptions): Promise<ActivityResponse>;
  getAttentionV2(
    sessionId: string,
    params: ProductExperienceAttentionParams,
    options?: ProductExperienceApiRequestOptions,
  ): Promise<AttentionResponseV2>;
  getAuth(options?: ProductExperienceApiRequestOptions): Promise<AuthUser>;
  getProductOverview(sessionId: string, options?: ProductExperienceApiRequestOptions): Promise<ProductOverviewResponse>;
  getSnapshot(sessionId: string, options?: ProductExperienceApiRequestOptions): Promise<SessionSnapshot>;
  listSessions(options?: ProductExperienceApiRequestOptions): Promise<SessionListResponse>;
  analyzeDiscovery(
    sessionId: string,
    payload: DiscoveryInput,
    options?: ProductExperienceApiRequestOptions,
  ): Promise<JourneyStageArtifactEntry>;
  buildCanvas(sessionId: string, options?: ProductExperienceApiRequestOptions): Promise<CanvasEnvelope>;
  defineRequirements(sessionId: string, options?: ProductExperienceApiRequestOptions): Promise<JourneyStageArtifactEntry>;
  getCurrentStageOperation(
    sessionId: string,
    params?: ProductExperienceStageOperationParams,
    options?: ProductExperienceApiRequestOptions,
  ): Promise<ProductExperienceStageOperation | null>;
  getStageOperation(
    sessionId: string,
    operationId: string,
    options?: ProductExperienceApiRequestOptions,
  ): Promise<ProductExperienceStageOperation>;
  normalizeDiscovery(
    sessionId: string,
    payload: DiscoveryInput,
    options?: ProductExperienceApiRequestOptions,
  ): Promise<DiscoveryEnvelope>;
  proposeDesign(
    sessionId: string,
    payload: DesignProposalRequest,
    options?: ProductExperienceApiRequestOptions,
  ): Promise<JourneyStageArtifactEntry>;
  startProposeDesign(
    sessionId: string,
    payload: DesignProposalRequest,
    options?: ProductExperienceMutationRequestOptions,
  ): Promise<ProductExperienceStageOperation>;
  startAnalyzeDiscovery(
    sessionId: string,
    payload: DiscoveryInput,
    options?: ProductExperienceMutationRequestOptions,
  ): Promise<ProductExperienceStageOperation>;
  startDefineRequirements(
    sessionId: string,
    options?: ProductExperienceMutationRequestOptions,
  ): Promise<ProductExperienceStageOperation>;
  startRecommendTools(
    sessionId: string,
    payload: ToolRecommendationRequest,
    options?: ProductExperienceMutationRequestOptions,
  ): Promise<ProductExperienceStageOperation>;
  startRecommendMemory(
    sessionId: string,
    payload: MemoryRecommendationRequest,
    options?: ProductExperienceMutationRequestOptions,
  ): Promise<ProductExperienceStageOperation>;
  startGenerateEstimationReport(
    sessionId: string,
    options?: ProductExperienceMutationRequestOptions,
  ): Promise<ProductExperienceStageOperation>;
  retryStageOperation(
    sessionId: string,
    operationId: string,
    options?: ProductExperienceApiRequestOptions,
  ): Promise<ProductExperienceStageOperation>;
  cancelStageOperation(
    sessionId: string,
    operationId: string,
    options?: ProductExperienceApiRequestOptions,
  ): Promise<ProductExperienceStageOperation>;
  recoverStageOperation(
    sessionId: string,
    operationId: string,
    options?: ProductExperienceApiRequestOptions,
  ): Promise<ProductExperienceStageOperation>;
  recommendTools(
    sessionId: string,
    payload: ToolRecommendationRequest,
    options?: ProductExperienceApiRequestOptions,
  ): Promise<ToolRecommendationEnvelope>;
  recommendMemory(
    sessionId: string,
    payload: MemoryRecommendationRequest,
    options?: ProductExperienceApiRequestOptions,
  ): Promise<JourneyStageArtifactEntry>;
  generateEstimationReport(
    sessionId: string,
    options?: ProductExperienceApiRequestOptions,
  ): Promise<EstimationEnvelope>;
  prepareBlueprintCommercialResult(
    sessionId: string,
    options?: ProductExperienceApiRequestOptions,
  ): Promise<SessionSnapshot>;
  approveToolsSelection(
    sessionId: string,
    payload: ApproveToolsSelectionRequest,
    options?: ProductExperienceApiRequestOptions,
  ): Promise<SessionSnapshot>;
  approveMemoryProfile(
    sessionId: string,
    payload: JourneyStageArtifactApprovalRequest,
    options?: ProductExperienceApiRequestOptions,
  ): Promise<SessionSnapshot>;
  approveJourneyArtifact(
    sessionId: string,
    stageKey: JourneyStageKey,
    artifactId: string,
    payload: JourneyStageArtifactApprovalRequest,
    options?: ProductExperienceApiRequestOptions,
  ): Promise<JourneyStageArtifactEntry>;
  patchJourneyArtifact(
    sessionId: string,
    stageKey: JourneyStageKey,
    artifactId: string,
    payload: JourneyStageArtifactPatchRequest,
    options?: ProductExperienceApiRequestOptions,
  ): Promise<JourneyStageArtifactEntry>;
  rejectJourneyArtifact(
    sessionId: string,
    stageKey: JourneyStageKey,
    artifactId: string,
    payload: JourneyStageArtifactRejectionRequest,
    options?: ProductExperienceApiRequestOptions,
  ): Promise<JourneyStageArtifactEntry>;
  resolveAttentionItemV2(
    sessionId: string,
    itemKey: string,
    payload: AttentionActionRequestV2,
    options?: ProductExperienceApiRequestOptions,
  ): Promise<AttentionActionResultV2>;
};

export type ProductExperienceApiRequestOptions = {
  signal?: AbortSignal | null;
};

export type ProductExperienceMutationRequestOptions = ProductExperienceApiRequestOptions & {
  idempotencyKey?: string;
};

export type ProductExperienceAttentionParams = {
  current_stage?: string;
  cursor?: string | null;
  limit?: number;
  product?: string | null;
  severity?: string | null;
  stage?: string | null;
  status?: string | null;
  type?: string | null;
};

export type ProductExperienceStageOperationParams = {
  action?: string | null;
  stage_key?: string | null;
};

export type ProductExperienceStoreSnapshot = {
  active: ProductExperienceRouteSnapshot | null;
  history: ProductExperienceRouteSnapshot[];
};

export type ProductExperienceStoreListener = () => void;
