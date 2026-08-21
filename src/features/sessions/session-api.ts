import { apiClient } from "@/core/api";
import { getLongRunningApiRequestTimeoutMs } from "@/core/config/runtime";
import type {
  CanonicalContractKind,
  CanonicalContractMap,
  CanonicalExportReadiness,
  CanonicalExportResponse,
} from "@/features/contracts/canonical-contracts";
import type {
  ACPFileEntry,
  ACPPreview,
  ACPValidationReport,
  AcpExportProfile,
  ApproveToolsSelectionRequest,
  ApprovalResolutionRequest,
  ArtifactBrowserResponse,
  BlueprintEnvelope,
  BlueprintKnowledgeGraph,
  CommercialAuditReport,
  BlueprintPatchRequest,
  CanvasEnvelope,
  CommercialEventRequest,
  ConstructionGapEntry,
  ConstructionQuestionAnswerRequest,
  ConstructionQuestionViewEntry,
  ConstructionReadinessReport,
  DiscoveryEnvelope,
  DiscoveryInput,
  DesignProposalRequest,
  DiagramCatalogResponse,
  DiagramContentResponse,
  EstimationAnalysisDecisionRequest,
  EstimationEnvelope,
  EstimationActualsUpsertRequest,
  EstimationCalibrationDashboard,
  EvaluationDatasetUpdateRequest,
  EvaluationEnvelope,
  EvaluationRubricUpdateRequest,
  FeatureFlagUpdateRequest,
  HandoffResolutionRequest,
  IntegrationStatusEntry,
  JourneyStageArtifactApprovalRequest,
  JourneyStageArtifactCreateRequest,
  JourneyStageArtifactEntry,
  JourneyStageArtifactListResponse,
  JourneyStageArtifactPatchRequest,
  JourneyStageArtifactRejectionRequest,
  JourneyStageKey,
  LLMRuntimeSettings,
  LLMRuntimeSettingsUpdateRequest,
  MemoryRecommendationRequest,
  MonitoringWorkspace,
  ProjectActualsEntry,
  SkillRerunResponse,
  ToolRecommendationEnvelope,
  ToolRecommendationRequest,
  SimulationRunRecord,
  ValidationScenarioGenerationRequest,
  ValidationSimulationEventInjectionRequest,
  ValidationSimulationJudgeRequest,
  ValidationSimulationRunRequest,
} from "@/features/sessions/session-contracts";
import type { ProductJourneyOverview } from "@/features/product-experience/saas/product-journey-overview";
import type {
  AccessRequestCreateRequest,
  AccessRequestResolveRequest,
  AccessRequestResponse,
  ACPPhaseCommandRequest,
  ACPWorkspaceResponse,
  ActivityResponse,
  AcpInvitationResponse,
  AttentionResponse,
  BlueprintResultResponse,
  CommercialCheckoutCompletionRequest,
  CommercialCheckoutSessionRequest,
  CommercialCheckoutSessionResponse,
  CommercialOrderResponse,
  CommercialTier,
  DiagramCatalogV2Response,
  ExportCatalogResponse,
  ExportJobCreateRequest,
  ExportJobResponse,
  LauncherMetadataResponse,
  LauncherReportResponse,
  LauncherReportSubmitRequest,
  PlanAccessResponse,
  ProductCatalogResponse,
  ProductOfferResponse,
  ProductOverviewResponse,
  SessionApprovalEntry,
  SessionListResponse,
  SessionSnapshot,
  SessionStage,
  SessionSummary,
} from "@/features/sessions/types";

const LONG_RUNNING_STAGE_TIMEOUT_MS = getLongRunningApiRequestTimeoutMs();

function encodeNestedPath(path: string) {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

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

function isCanonicalContractKind(value: string | null): value is CanonicalContractKind {
  return (
    value === "blueprint-core.v1" ||
    value === "construction-pack.v1" ||
    value === "agent-construction-package.v2" ||
    value === "prompt-pack.v1" ||
    value === "estimation-pack.v1" ||
    value === "test-pack.v1"
  );
}

function isCanonicalExportReadiness(value: string | null): value is CanonicalExportReadiness {
  return value === "ready" || value === "needs_review" || value === "blocked";
}

function parseCanonicalExportHeaders<K extends CanonicalContractKind>(
  response: Response,
  expectedKind: K,
): CanonicalExportResponse<K>["meta"] {
  const contractVersionHeader = response.headers.get("x-canonical-contract-version");
  const readinessHeader = response.headers.get("x-canonical-export-readiness");
  const blueprintVersionHeader = response.headers.get("x-canonical-source-blueprint-version");

  return {
    checksumSha256: response.headers.get("x-canonical-checksum-sha256") ?? "",
    contractVersion: isCanonicalContractKind(contractVersionHeader) ? contractVersionHeader : expectedKind,
    generatedAt: response.headers.get("x-canonical-generated-at") ?? "",
    preview: response.headers.get("x-canonical-export-preview") === "true",
    readiness: isCanonicalExportReadiness(readinessHeader) ? readinessHeader : "needs_review",
    sourceBlueprintVersion: blueprintVersionHeader ? Number(blueprintVersionHeader) : null,
  };
}

export function createSessionsApi(client = apiClient) {
  async function getCanonicalExport<K extends CanonicalContractKind>(
    sessionId: string,
    kind: K,
    path: string,
    preview = false,
  ): Promise<CanonicalExportResponse<K>> {
    const response = await client.get<Response>(
      `/api/v1/sessions/${sessionId}${path}${buildQueryString({
        preview: preview ? "true" : undefined,
      })}`,
      {
        responseType: "response",
      },
    );

    return {
      data: (await response.json()) as CanonicalContractMap[K],
      meta: parseCanonicalExportHeaders(response, kind),
    };
  }

  return {
    answerAcpQuestion(sessionId: string, questionKey: string, payload: ConstructionQuestionAnswerRequest) {
      return client.patch<ConstructionQuestionViewEntry>(
        `/api/v1/sessions/${sessionId}/acp/questions/${encodeURIComponent(questionKey)}`,
        {
          body: payload,
        },
      );
    },
    bootstrapEvaluation(sessionId: string) {
      return client.post<SessionSnapshot>(`/api/v1/sessions/${sessionId}/evaluation/bootstrap`, {
        timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
      });
    },
    buildBlueprint(sessionId: string) {
      return client.post<BlueprintEnvelope>(`/api/v1/sessions/${sessionId}/build-blueprint`, {
        timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
      });
    },
    buildCanvas(sessionId: string) {
      return client.post<CanvasEnvelope>(`/api/v1/sessions/${sessionId}/build-canvas`, {
        timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
      });
    },
    checkIntegrations(sessionId: string) {
      return client.post<SessionSnapshot>(`/api/v1/sessions/${sessionId}/integrations/check`);
    },
    create() {
      return client.post<SessionSummary>("/api/v1/sessions");
    },
    enrichBlueprint(sessionId: string) {
      return client.post<BlueprintEnvelope>(`/api/v1/sessions/${sessionId}/enrich-blueprint`, {
        timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
      });
    },
    evaluateBlueprint(sessionId: string) {
      return client.post<EvaluationEnvelope>(`/api/v1/sessions/${sessionId}/evaluate`, {
        timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
      });
    },
    exportAcpZip(sessionId: string, profile: AcpExportProfile = "extended") {
      return client.get<Blob>(`/api/v1/sessions/${sessionId}/acp/export.zip${buildQueryString({ profile })}`, {
        responseType: "blob",
      });
    },
    exportBlueprintCore(sessionId: string, preview = false) {
      return getCanonicalExport(sessionId, "blueprint-core.v1", "/export/blueprint-core", preview);
    },
    exportConstructionPack(sessionId: string, preview = false) {
      return getCanonicalExport(sessionId, "construction-pack.v1", "/export/construction-pack", preview);
    },
    exportAgentConstructionPackage(sessionId: string, preview = false) {
      return getCanonicalExport(
        sessionId,
        "agent-construction-package.v2",
        "/export/agent-construction-package",
        preview,
      );
    },
    exportEstimationPack(sessionId: string, preview = false) {
      return getCanonicalExport(sessionId, "estimation-pack.v1", "/export/estimation-pack", preview);
    },
    exportTestPack(sessionId: string, preview = false) {
      return getCanonicalExport(sessionId, "test-pack.v1", "/export/test-pack", preview);
    },
    exportJson(sessionId: string) {
      return client.get<Record<string, unknown>>(`/api/v1/sessions/${sessionId}/export/json`);
    },
    exportMarkdown(sessionId: string) {
      return client.get<string>(`/api/v1/sessions/${sessionId}/export/markdown`, {
        responseType: "text",
      });
    },
    exportPromptPack(sessionId: string, preview = false) {
      return getCanonicalExport(sessionId, "prompt-pack.v1", "/export/prompt-pack", preview);
    },
    generateEstimationReport(sessionId: string) {
      return client.post<EstimationEnvelope>(`/api/v1/sessions/${sessionId}/estimate`, {
        timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
      });
    },
    applyEstimationAnalysisDecision(sessionId: string, payload: EstimationAnalysisDecisionRequest) {
      return client.post<EstimationEnvelope>(`/api/v1/sessions/${sessionId}/estimate/analysis-decision`, {
        body: payload,
        timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
      });
    },
    generateValidationScenarios(sessionId: string, payload: ValidationScenarioGenerationRequest = {}) {
      return client.post<JourneyStageArtifactEntry>(`/api/v1/sessions/${sessionId}/generate-validation-scenarios`, {
        body: payload,
        timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
      });
    },
    approveValidationScenarios(sessionId: string, payload: JourneyStageArtifactApprovalRequest) {
      return client.post<SessionSnapshot>(`/api/v1/sessions/${sessionId}/approve-validation-scenarios`, {
        body: payload,
      });
    },
    runValidationSimulation(sessionId: string, payload: ValidationSimulationRunRequest) {
      return client.post<SimulationRunRecord>(`/api/v1/sessions/${sessionId}/run-validation-simulation`, {
        body: payload,
        timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
      });
    },
    injectValidationEvent(sessionId: string, payload: ValidationSimulationEventInjectionRequest) {
      return client.post<SimulationRunRecord>(`/api/v1/sessions/${sessionId}/inject-validation-event`, {
        body: payload,
        timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
      });
    },
    judgeValidationRun(sessionId: string, payload: ValidationSimulationJudgeRequest) {
      return client.post<SimulationRunRecord>(`/api/v1/sessions/${sessionId}/judge-validation-run`, {
        body: payload,
        timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
      });
    },
    upsertEstimationActuals(sessionId: string, payload: EstimationActualsUpsertRequest) {
      return client.post<ProjectActualsEntry>(`/api/v1/sessions/${sessionId}/estimate/actuals`, {
        body: payload,
      });
    },
    generateAcp(sessionId: string, profile: AcpExportProfile = "extended") {
      return client.post<ACPPreview>(`/api/v1/sessions/${sessionId}/acp/generate${buildQueryString({ profile })}`, {
        timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
      });
    },
    getAcpConstructionReadiness(sessionId: string, profile: AcpExportProfile = "extended") {
      return client.get<ConstructionReadinessReport>(
        `/api/v1/sessions/${sessionId}/acp/construction-readiness${buildQueryString({ profile })}`,
      );
    },
    getAcpFile(sessionId: string, filePath: string, profile: AcpExportProfile = "extended") {
      return client.get<ACPFileEntry>(
        `/api/v1/sessions/${sessionId}/acp/files/${encodeNestedPath(filePath)}${buildQueryString({ profile })}`,
      );
    },
    getAcpGap(sessionId: string, gapKey: string, profile: AcpExportProfile = "extended") {
      return client.get<ConstructionGapEntry>(
        `/api/v1/sessions/${sessionId}/acp/gaps/${encodeURIComponent(gapKey)}${buildQueryString({ profile })}`,
      );
    },
    getAcpKnowledgeGraph(sessionId: string, profile: AcpExportProfile = "extended") {
      return client.get<BlueprintKnowledgeGraph>(
        `/api/v1/sessions/${sessionId}/acp/knowledge-graph${buildQueryString({ profile })}`,
      );
    },
    getAcpPreview(sessionId: string, profile: AcpExportProfile = "extended") {
      return client.get<ACPPreview>(`/api/v1/sessions/${sessionId}/acp/preview${buildQueryString({ profile })}`);
    },
    getAcpQuestions(sessionId: string, profile: AcpExportProfile = "extended") {
      return client.get<ConstructionQuestionViewEntry[]>(
        `/api/v1/sessions/${sessionId}/acp/questions${buildQueryString({ profile })}`,
      );
    },
    getAcpValidation(sessionId: string, profile: AcpExportProfile = "extended") {
      return client.get<ACPValidationReport>(`/api/v1/sessions/${sessionId}/acp/validate${buildQueryString({ profile })}`);
    },
    getDiagramCatalog(sessionId: string) {
      return client.get<DiagramCatalogResponse>(`/api/v1/sessions/${sessionId}/diagrams/catalog`);
    },
    getDiagramContent(sessionId: string, diagramKey: string, format?: string | null) {
      return client.get<DiagramContentResponse>(
        `/api/v1/sessions/${sessionId}/diagrams/${encodeURIComponent(diagramKey)}${buildQueryString({ format })}`,
      );
    },
    getEstimationCalibration() {
      return client.get<EstimationCalibrationDashboard>("/api/v1/estimation/calibration");
    },
    getMonitoringWorkspace(sessionId: string) {
      return client.get<MonitoringWorkspace>(`/api/v1/sessions/${sessionId}/monitoring`);
    },
    getRuntimeSettings() {
      return client.get<LLMRuntimeSettings>("/api/v1/runtime/llm");
    },
    listCommercialProducts() {
      return client.get<ProductCatalogResponse[]>("/api/v1/commerce/products");
    },
    createCheckoutSession(payload: CommercialCheckoutSessionRequest) {
      return client.post<CommercialCheckoutSessionResponse>("/api/v1/commerce/checkout-sessions", {
        body: payload,
      });
    },
    completeSandboxCheckout(checkoutRef: string, payload: CommercialCheckoutCompletionRequest = { outcome: "success" }) {
      return client.post<CommercialOrderResponse>(
        `/api/v1/commerce/checkout-sessions/${encodeURIComponent(checkoutRef)}/sandbox-complete`,
        {
          body: payload,
          timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
        },
      );
    },
    getCommercialOrder(orderId: string) {
      return client.get<CommercialOrderResponse>(`/api/v1/commerce/orders/${encodeURIComponent(orderId)}`);
    },
    getProductOverview(sessionId: string) {
      return client.get<ProductOverviewResponse>(`/api/v1/sessions/${sessionId}/product-overview`);
    },
    getProductJourneyOverview(sessionId: string) {
      return client.get<ProductJourneyOverview>(`/api/v1/sessions/${sessionId}/product-journey-overview`);
    },
    getBlueprintResult(sessionId: string) {
      return client.get<BlueprintResultResponse>(`/api/v1/sessions/${sessionId}/blueprint/result`);
    },
    getBlueprintOffer(sessionId: string) {
      return client.get<ProductOfferResponse>(`/api/v1/sessions/${sessionId}/blueprint/offer`);
    },
    getAcpInvitation(sessionId: string) {
      return client.get<AcpInvitationResponse>(`/api/v1/sessions/${sessionId}/acp/invitation`);
    },
    getAcpWorkspace(sessionId: string) {
      return client.get<ACPWorkspaceResponse>(`/api/v1/sessions/${sessionId}/acp/workspace`);
    },
    runAcpWorkspacePhase(sessionId: string, phaseKey: string, payload: ACPPhaseCommandRequest = {}) {
      return client.post<ACPWorkspaceResponse>(
        `/api/v1/sessions/${sessionId}/acp/workspace/phases/${encodeURIComponent(phaseKey)}/run`,
        {
          body: payload,
          timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
        },
      );
    },
    resumeAcpWorkspace(sessionId: string) {
      return client.post<ACPWorkspaceResponse>(`/api/v1/sessions/${sessionId}/acp/workspace/resume`, {
        timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
      });
    },
    getAttention(sessionId: string) {
      return client.get<AttentionResponse>(`/api/v1/sessions/${sessionId}/attention`);
    },
    getExportCatalog(sessionId: string) {
      return client.get<ExportCatalogResponse>(`/api/v1/sessions/${sessionId}/exports/catalog`);
    },
    createExportJob(sessionId: string, payload: ExportJobCreateRequest) {
      return client.post<ExportJobResponse>(`/api/v1/sessions/${sessionId}/exports/jobs`, {
        body: payload,
        timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
      });
    },
    getExportJob(sessionId: string, jobId: string) {
      return client.get<ExportJobResponse>(`/api/v1/sessions/${sessionId}/exports/jobs/${encodeURIComponent(jobId)}`);
    },
    retryExportJob(sessionId: string, jobId: string) {
      return client.post<ExportJobResponse>(`/api/v1/sessions/${sessionId}/exports/jobs/${encodeURIComponent(jobId)}/retry`);
    },
    cancelExportJob(sessionId: string, jobId: string) {
      return client.post<ExportJobResponse>(`/api/v1/sessions/${sessionId}/exports/jobs/${encodeURIComponent(jobId)}/cancel`);
    },
    downloadExportJob(sessionId: string, jobId: string) {
      return client.get<Blob>(`/api/v1/sessions/${sessionId}/exports/jobs/${encodeURIComponent(jobId)}/download`, {
        responseType: "blob",
      });
    },
    getAcpLauncher(sessionId: string) {
      return client.get<LauncherMetadataResponse>(`/api/v1/sessions/${sessionId}/acp/launcher`);
    },
    submitAcpLauncherReport(sessionId: string, payload: LauncherReportSubmitRequest) {
      return client.post<LauncherReportResponse>(`/api/v1/sessions/${sessionId}/acp/launcher/report`, {
        body: payload,
      });
    },
    getActivity(sessionId: string, limit = 40) {
      return client.get<ActivityResponse>(`/api/v1/sessions/${sessionId}/activity${buildQueryString({ limit })}`);
    },
    getPlanAccess(sessionId: string) {
      return client.get<PlanAccessResponse>(`/api/v1/sessions/${sessionId}/plan-access`);
    },
    getDiagramCatalogV2(
      sessionId: string,
      params: {
        category?: string;
        cursor?: string | null;
        limit?: number;
        q?: string;
      } = {},
    ) {
      return client.get<DiagramCatalogV2Response>(
        `/api/v1/sessions/${sessionId}/diagrams/catalog-v2${buildQueryString(params)}`,
      );
    },
    createAccessRequest(sessionId: string, payload: AccessRequestCreateRequest) {
      return client.post<AccessRequestResponse>(`/api/v1/sessions/${sessionId}/access-requests`, {
        body: payload,
      });
    },
    resolveAccessRequest(requestId: string, payload: AccessRequestResolveRequest) {
      return client.post<AccessRequestResponse>(`/api/v1/access-requests/${encodeURIComponent(requestId)}/resolve`, {
        body: payload,
      });
    },
    listAccessRequests(status?: string) {
      const query = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
      return client.get<AccessRequestResponse[]>(`/api/v1/commerce/access-requests${query}`);
    },
    getAccessRequestsCount() {
      return client.get<{ pending: number; total: number }>("/api/v1/commerce/access-requests/count");
    },
    createJourneyArtifact(sessionId: string, stageKey: JourneyStageKey, payload: JourneyStageArtifactCreateRequest) {
      return client.post<JourneyStageArtifactEntry>(`/api/v1/sessions/${sessionId}/journey/${stageKey}/artifacts`, {
        body: payload,
      });
    },
    listJourneyArtifacts(sessionId: string, stageKey: JourneyStageKey) {
      return client.get<JourneyStageArtifactListResponse>(`/api/v1/sessions/${sessionId}/journey/${stageKey}/artifacts`);
    },
    getLatestJourneyArtifact(sessionId: string, stageKey: JourneyStageKey) {
      return client.get<JourneyStageArtifactEntry | null>(
        `/api/v1/sessions/${sessionId}/journey/${stageKey}/artifacts/latest`,
      );
    },
    patchJourneyArtifact(
      sessionId: string,
      stageKey: JourneyStageKey,
      artifactId: string,
      payload: JourneyStageArtifactPatchRequest,
    ) {
      return client.patch<JourneyStageArtifactEntry>(
        `/api/v1/sessions/${sessionId}/journey/${stageKey}/artifacts/${encodeURIComponent(artifactId)}`,
        {
          body: payload,
        },
      );
    },
    approveJourneyArtifact(
      sessionId: string,
      stageKey: JourneyStageKey,
      artifactId: string,
      payload: JourneyStageArtifactApprovalRequest,
    ) {
      return client.post<JourneyStageArtifactEntry>(
        `/api/v1/sessions/${sessionId}/journey/${stageKey}/artifacts/${encodeURIComponent(artifactId)}/approve`,
        {
          body: payload,
        },
      );
    },
    rejectJourneyArtifact(
      sessionId: string,
      stageKey: JourneyStageKey,
      artifactId: string,
      payload: JourneyStageArtifactRejectionRequest,
    ) {
      return client.post<JourneyStageArtifactEntry>(
        `/api/v1/sessions/${sessionId}/journey/${stageKey}/artifacts/${encodeURIComponent(artifactId)}/reject`,
        {
          body: payload,
        },
      );
    },
    getSnapshot(sessionId: string) {
      return client.get<SessionSnapshot>(`/api/v1/sessions/${sessionId}`);
    },
    list(
      params: {
        cursor?: string | null;
        lifecycle?: "active" | "archived" | "trash" | "all";
        limit?: number;
        q?: string;
        sort?: "updated_desc" | "updated_asc" | "created_desc" | "title_asc" | "title_desc";
        status?: string | null;
        tier?: string | null;
      } = {},
    ) {
      return client.get<SessionListResponse>(`/api/v1/sessions${buildQueryString(params)}`);
    },
    rename(sessionId: string, payload: { expected_version?: number | null; title: string }) {
      return client.patch<SessionSummary>(`/api/v1/sessions/${sessionId}`, {
        body: payload,
      });
    },
    archive(sessionId: string) {
      return client.post<SessionSummary>(`/api/v1/sessions/${sessionId}/archive`);
    },
    restore(sessionId: string) {
      return client.post<SessionSummary>(`/api/v1/sessions/${sessionId}/restore`);
    },
    delete(sessionId: string, payload: { confirm_title: string }) {
      return client.delete<SessionSummary>(`/api/v1/sessions/${sessionId}`, {
        body: payload,
      });
    },
    listArtifacts(sessionId: string) {
      return client.get<ArtifactBrowserResponse>(`/api/v1/sessions/${sessionId}/artifacts`);
    },
    listIntegrations(sessionId: string) {
      return client.get<IntegrationStatusEntry[]>(`/api/v1/sessions/${sessionId}/integrations`);
    },
    normalizeDiscovery(sessionId: string, payload: DiscoveryInput) {
      return client.post<DiscoveryEnvelope>(`/api/v1/sessions/${sessionId}/normalize-discovery`, {
        body: payload,
        timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
      });
    },
    analyzeDiscovery(sessionId: string, payload: DiscoveryInput) {
      return client.post<JourneyStageArtifactEntry>(`/api/v1/sessions/${sessionId}/analyze-discovery`, {
        body: payload,
        timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
      });
    },
    defineRequirements(sessionId: string) {
      return client.post<JourneyStageArtifactEntry>(`/api/v1/sessions/${sessionId}/define-requirements`, {
        timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
      });
    },
    proposeDesign(sessionId: string, payload: DesignProposalRequest = {}) {
      return client.post<JourneyStageArtifactEntry>(`/api/v1/sessions/${sessionId}/propose-design`, {
        body: payload,
        timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
      });
    },
    recommendTools(sessionId: string, payload: ToolRecommendationRequest = {}) {
      return client.post<ToolRecommendationEnvelope>(`/api/v1/sessions/${sessionId}/recommend-tools`, {
        body: payload,
        timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
      });
    },
    recommendMemory(sessionId: string, payload: MemoryRecommendationRequest = {}) {
      return client.post<JourneyStageArtifactEntry>(`/api/v1/sessions/${sessionId}/recommend-memory`, {
        body: payload,
        timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
      });
    },
    approveToolsSelection(sessionId: string, payload: ApproveToolsSelectionRequest) {
      return client.post<SessionSnapshot>(`/api/v1/sessions/${sessionId}/approve-tools-selection`, {
        body: payload,
        timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
      });
    },
    approveMemoryProfile(sessionId: string, payload: JourneyStageArtifactApprovalRequest) {
      return client.post<SessionSnapshot>(`/api/v1/sessions/${sessionId}/approve-memory-profile`, {
        body: payload,
        timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
      });
    },
    patchBlueprint(sessionId: string, payload: BlueprintPatchRequest) {
      return client.patch<BlueprintEnvelope>(`/api/v1/sessions/${sessionId}/blueprint`, {
        body: payload,
      });
    },
    patchEvaluationDataset(sessionId: string, payload: EvaluationDatasetUpdateRequest) {
      return client.patch<SessionSnapshot>(`/api/v1/sessions/${sessionId}/evaluation/dataset`, {
        body: payload,
      });
    },
    patchEvaluationRubric(sessionId: string, payload: EvaluationRubricUpdateRequest) {
      return client.patch<SessionSnapshot>(`/api/v1/sessions/${sessionId}/evaluation/rubric`, {
        body: payload,
      });
    },
    patchFeatureFlag(sessionId: string, flagKey: string, payload: FeatureFlagUpdateRequest) {
      return client.patch<SessionSnapshot>(
        `/api/v1/sessions/${sessionId}/feature-flags/${encodeURIComponent(flagKey)}`,
        {
          body: payload,
        },
      );
    },
    patchCommercialTier(sessionId: string, payload: { tier: CommercialTier }) {
      return client.patch<SessionSnapshot>(`/api/v1/sessions/${sessionId}/commercial-tier`, {
        body: payload,
      });
    },
    recordCommercialEvent(sessionId: string, payload: CommercialEventRequest) {
      return client.post<SessionSnapshot>(`/api/v1/sessions/${sessionId}/commercial-events`, {
        body: payload,
      });
    },
    getCommercialAuditReport(sessionId: string, limit = 40) {
      return client.get<CommercialAuditReport>(`/api/v1/sessions/${sessionId}/commercial-audit?limit=${limit}`);
    },
    recordAcpInvitationEvent(sessionId: string, payload: CommercialEventRequest) {
      return client.post<SessionSnapshot>(`/api/v1/sessions/${sessionId}/acp/invitation-events`, {
        body: payload,
      });
    },
    patchRuntimeSettings(payload: LLMRuntimeSettingsUpdateRequest) {
      return client.patch<LLMRuntimeSettings>("/api/v1/runtime/llm", {
        body: payload,
      });
    },
    queryLibrary(
      sessionId: string,
      params: {
        artifact_kind?: string;
        blueprint_version_number?: number | null;
        date_from?: string;
        date_to?: string;
        q?: string;
        stage?: SessionStage | null;
      } = {},
    ) {
      return client.get<ArtifactBrowserResponse>(
        `/api/v1/sessions/${sessionId}/library${buildQueryString({
          artifact_kind: params.artifact_kind,
          blueprint_version_number: params.blueprint_version_number,
          date_from: params.date_from,
          date_to: params.date_to,
          q: params.q,
          stage: params.stage ?? undefined,
        })}`,
      );
    },
    rerunSkill(sessionId: string, skillKey: string) {
      return client.post<SkillRerunResponse>(
        `/api/v1/sessions/${sessionId}/skills/${encodeURIComponent(skillKey)}/rerun`,
        {
          timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
        },
      );
    },
    resolveApproval(sessionId: string, approvalId: string, payload: ApprovalResolutionRequest) {
      return client.post<SessionApprovalEntry>(
        `/api/v1/sessions/${sessionId}/approvals/${encodeURIComponent(approvalId)}/resolve`,
        {
          body: payload,
        },
      );
    },
    resolveHandoff(sessionId: string, handoffId: string, payload: HandoffResolutionRequest) {
      return client.post<SessionSnapshot>(`/api/v1/sessions/${sessionId}/handoffs/${encodeURIComponent(handoffId)}/resolve`, {
        body: payload,
      });
    },
    runSubagent(sessionId: string, runKind: string) {
      return client.post<SessionSnapshot>(
        `/api/v1/sessions/${sessionId}/subagents/${encodeURIComponent(runKind)}/run`,
        {
          timeoutMs: LONG_RUNNING_STAGE_TIMEOUT_MS,
        },
      );
    },
  };
}

export type SessionsApi = ReturnType<typeof createSessionsApi>;

export const sessionsApi = createSessionsApi();
