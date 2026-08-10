import { ApiError } from "@/core/api";
import { sessionsApi, type SessionsApi } from "@/features/sessions/session-api";
import type {
  ApprovalResolutionRequest,
  AcpExportProfile,
  BlueprintPatchRequest,
  CommercialEventRequest,
  ConstructionQuestionAnswerRequest,
  DiscoveryInput,
  EstimationActualsUpsertRequest,
  EvaluationDatasetUpdateRequest,
  EvaluationRubricUpdateRequest,
  FeatureFlagUpdateRequest,
  HandoffResolutionRequest,
  JourneyStageArtifactApprovalRequest,
  JourneyStageArtifactCreateRequest,
  JourneyStageArtifactPatchRequest,
  JourneyStageArtifactRejectionRequest,
  JourneyStageKey,
  LLMRuntimeSettingsUpdateRequest,
  MemoryRecommendationRequest,
  ValidationScenarioGenerationRequest,
  ValidationSimulationEventInjectionRequest,
  ValidationSimulationJudgeRequest,
  ValidationSimulationRunRequest,
} from "@/features/sessions/session-contracts";
import type {
  AccessRequestCreateRequest,
  AccessRequestResolveRequest,
  ACPPhaseCommandRequest,
  ExportJobCreateRequest,
  LauncherReportSubmitRequest,
  CommercialCheckoutCompletionRequest,
  CommercialCheckoutSessionRequest,
  SessionSnapshot,
  SessionSummary,
} from "@/features/sessions/types";

type Listener = () => void;

type AsyncStatus = "idle" | "loading" | "ready" | "error";

export type SessionsState = {
  activeSessionId: string | null;
  activeSnapshot: SessionSnapshot | null;
  items: SessionSummary[];
  listError: ApiError | null;
  listStatus: AsyncStatus;
  snapshotError: ApiError | null;
  snapshotStatus: AsyncStatus;
};

type SessionsStoreDependencies = {
  api?: Partial<SessionsApi>;
  clearActiveSessionId?: () => void;
  loadActiveSessionId?: () => string | null;
  persistActiveSessionId?: (sessionId: string) => void;
};

type RefreshSessionListOptions = {
  force?: boolean;
  loadActiveSnapshot?: boolean;
  selectSessionId?: string | null;
};

type SelectSessionOptions = {
  forceSnapshot?: boolean;
  loadSnapshot?: boolean;
  persist?: boolean;
};

type CheckoutProductOptions = {
  cancelUrl?: string;
  idempotencyKey?: string;
  outcome?: CommercialCheckoutCompletionRequest["outcome"];
  providerPaymentId?: string;
  successUrl?: string;
};

type CreateSessionOptions = {
  loadSnapshot?: boolean;
};

const ACTIVE_SESSION_STORAGE_KEY = "lean-builder.active-session-id";

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storage = window.localStorage;
    return typeof storage?.getItem === "function" ? storage : null;
  } catch {
    return null;
  }
}

function getStoredActiveSessionId() {
  return getStorage()?.getItem(ACTIVE_SESSION_STORAGE_KEY) ?? null;
}

function setStoredActiveSessionId(sessionId: string) {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.setItem(ACTIVE_SESSION_STORAGE_KEY, sessionId);
}

function clearStoredActiveSessionId() {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
}

function toApiError(error: unknown) {
  if (error instanceof ApiError) {
    return error;
  }

  return ApiError.fromClientError({
    details: error,
    message: "No se pudo cargar la sesion solicitada.",
  });
}

function createInitialState(loadActiveSessionId: () => string | null): SessionsState {
  return {
    activeSessionId: loadActiveSessionId(),
    activeSnapshot: null,
    items: [],
    listError: null,
    listStatus: "idle",
    snapshotError: null,
    snapshotStatus: "idle",
  };
}

function upsertSessionSummary(items: SessionSummary[], summary: SessionSummary) {
  const nextItems = items.filter((item) => item.id !== summary.id);
  return [summary, ...nextItems];
}

function removeSessionSummary(items: SessionSummary[], sessionId: string) {
  return items.filter((item) => item.id !== sessionId);
}

export function createSessionsStore({
  api,
  clearActiveSessionId = clearStoredActiveSessionId,
  loadActiveSessionId = getStoredActiveSessionId,
  persistActiveSessionId = setStoredActiveSessionId,
}: SessionsStoreDependencies = {}) {
  const client: SessionsApi = {
    ...sessionsApi,
    ...api,
  };
  const listeners = new Set<Listener>();
  let listPromise: Promise<SessionSummary[]> | null = null;
  let snapshotPromise: Promise<SessionSnapshot> | null = null;
  let snapshotPromiseKey: string | null = null;
  let state = createInitialState(loadActiveSessionId);

  function emit() {
    listeners.forEach((listener) => listener());
  }

  function updateState(nextState: SessionsState | ((currentState: SessionsState) => SessionsState)) {
    state = typeof nextState === "function" ? nextState(state) : nextState;
    emit();
    return state;
  }

  function syncSnapshot(snapshot: SessionSnapshot) {
    persistActiveSessionId(snapshot.session.id);
    updateState((currentState) => ({
      ...currentState,
      activeSessionId: snapshot.session.id,
      activeSnapshot: snapshot,
      items: upsertSessionSummary(currentState.items, snapshot.session),
      snapshotError: null,
      snapshotStatus: "ready",
    }));

    return snapshot;
  }

  async function loadSnapshot(sessionId: string, force = false) {
    if (snapshotPromise && snapshotPromiseKey === sessionId && !force) {
      return snapshotPromise;
    }

    updateState((currentState) => ({
      ...currentState,
      activeSessionId: sessionId,
      snapshotError: null,
      snapshotStatus: "loading",
    }));

    snapshotPromiseKey = sessionId;
    snapshotPromise = (async () => {
      try {
        const snapshot = await client.getSnapshot(sessionId);

        updateState((currentState) => ({
          ...currentState,
          activeSessionId: snapshot.session.id,
          activeSnapshot: snapshot,
          snapshotError: null,
          snapshotStatus: "ready",
        }));

        return snapshot;
      } catch (error) {
        const apiError = toApiError(error);

        updateState((currentState) => ({
          ...currentState,
          activeSessionId: sessionId,
          activeSnapshot: currentState.activeSnapshot?.session.id === sessionId ? null : currentState.activeSnapshot,
          snapshotError: apiError,
          snapshotStatus: "error",
        }));

        if (apiError.status === 401) {
          return null as unknown as SessionSnapshot;
        }

        throw apiError;
      } finally {
        snapshotPromise = null;
        snapshotPromiseKey = null;
      }
    })();

    return snapshotPromise;
  }

  async function selectSession(sessionId: string, options: SelectSessionOptions = {}) {
    const { forceSnapshot = false, loadSnapshot: shouldLoadSnapshot = true, persist = true } = options;

    if (persist) {
      persistActiveSessionId(sessionId);
    }

    updateState((currentState) => ({
      ...currentState,
      activeSessionId: sessionId,
      activeSnapshot: currentState.activeSnapshot?.session.id === sessionId ? currentState.activeSnapshot : null,
      snapshotError: null,
      snapshotStatus:
        shouldLoadSnapshot && currentState.activeSnapshot?.session.id !== sessionId ? "idle" : currentState.snapshotStatus,
    }));

    if (!shouldLoadSnapshot) {
      return state.activeSnapshot;
    }

    return loadSnapshot(sessionId, forceSnapshot);
  }

  async function refreshList(options: RefreshSessionListOptions = {}) {
    const { force = false, loadActiveSnapshot = true, selectSessionId } = options;

    if (listPromise && !force) {
      return listPromise;
    }

    updateState((currentState) => ({
      ...currentState,
      listError: null,
      listStatus: "loading",
    }));

    listPromise = (async () => {
      try {
        const response = await client.list();
        const persistedActiveSessionId = selectSessionId ?? state.activeSessionId ?? loadActiveSessionId();
        const availableActiveSessionId = response.items.some((item) => item.id === persistedActiveSessionId)
          ? persistedActiveSessionId
          : (response.items[0]?.id ?? null);

        updateState((currentState) => ({
          ...currentState,
          activeSessionId: availableActiveSessionId,
          activeSnapshot:
            currentState.activeSnapshot?.session.id === availableActiveSessionId ? currentState.activeSnapshot : null,
          items: response.items,
          listError: null,
          listStatus: "ready",
          snapshotError:
            currentState.activeSnapshot?.session.id === availableActiveSessionId ? currentState.snapshotError : null,
          snapshotStatus:
            currentState.activeSnapshot?.session.id === availableActiveSessionId ? currentState.snapshotStatus : "idle",
        }));

        if (availableActiveSessionId) {
          persistActiveSessionId(availableActiveSessionId);

          if (loadActiveSnapshot) {
            await loadSnapshot(availableActiveSessionId, state.activeSnapshot?.session.id !== availableActiveSessionId);
          }
        } else {
          clearActiveSessionId();
        }

        return response.items;
      } catch (error) {
        const apiError = toApiError(error);

        updateState((currentState) => ({
          ...currentState,
          items: [],
          listError: apiError,
          listStatus: "error",
        }));

        if (apiError.status === 401) {
          return [];
        }

        throw apiError;
      } finally {
        listPromise = null;
      }
    })();

    return listPromise;
  }

  async function createSession(options: CreateSessionOptions = {}) {
    const { loadSnapshot: shouldLoadSnapshot = true } = options;
    const created = await client.create();

    updateState((currentState) => ({
      ...currentState,
      activeSessionId: created.id,
      items: [created, ...currentState.items.filter((item) => item.id !== created.id)],
      listError: null,
      listStatus: "ready",
    }));

    persistActiveSessionId(created.id);

    if (shouldLoadSnapshot) {
      await loadSnapshot(created.id, true);
    } else {
      void loadSnapshot(created.id, true).catch(() => undefined);
    }

    return created;
  }

  function syncSessionSummary(summary: SessionSummary, options: { removeFromList?: boolean } = {}) {
    updateState((currentState) => ({
      ...currentState,
      activeSnapshot:
        currentState.activeSnapshot?.session.id === summary.id
          ? {
              ...currentState.activeSnapshot,
              session: {
                ...currentState.activeSnapshot.session,
                ...summary,
              },
            }
          : currentState.activeSnapshot,
      items: options.removeFromList
        ? removeSessionSummary(currentState.items, summary.id)
        : upsertSessionSummary(currentState.items, summary),
      listError: null,
      listStatus: "ready",
    }));
    return summary;
  }

  async function renameSession(sessionId: string, payload: { expected_version?: number | null; title: string }) {
    const updated = await client.rename(sessionId, payload);
    return syncSessionSummary(updated);
  }

  async function archiveSession(sessionId: string) {
    const updated = await client.archive(sessionId);
    return syncSessionSummary(updated, { removeFromList: true });
  }

  async function restoreSession(sessionId: string) {
    const updated = await client.restore(sessionId);
    return syncSessionSummary(updated);
  }

  async function deleteSession(sessionId: string, payload: { confirm_title: string }) {
    const updated = await client.delete(sessionId, payload);
    return syncSessionSummary(updated, { removeFromList: true });
  }

  async function refreshSessionData(sessionId: string) {
    await refreshList({
      force: true,
      loadActiveSnapshot: false,
      selectSessionId: sessionId,
    });

    await loadSnapshot(sessionId, true);
    return state.activeSnapshot;
  }

  async function buildBlueprint(sessionId: string) {
    const envelope = await client.buildBlueprint(sessionId);
    await refreshSessionData(sessionId);
    return envelope;
  }

  async function normalizeDiscovery(sessionId: string, payload: DiscoveryInput) {
    const envelope = await client.normalizeDiscovery(sessionId, payload);
    await refreshSessionData(sessionId);
    return envelope;
  }

  async function recommendTools(sessionId: string, instructions = "") {
    const envelope = await client.recommendTools(sessionId, {
      instructions,
    });
    await refreshSessionData(sessionId);
    return envelope;
  }

  async function recommendMemory(sessionId: string, instructions = "") {
    const artifact = await client.recommendMemory(sessionId, {
      instructions,
    } satisfies MemoryRecommendationRequest);
    await refreshSessionData(sessionId);
    return artifact;
  }

  async function approveToolsSelection(sessionId: string, includeOptionalToolKeys: string[]) {
    const snapshot = await client.approveToolsSelection(sessionId, {
      include_optional_tool_keys: includeOptionalToolKeys,
    });
    return syncSnapshot(snapshot);
  }

  async function approveMemoryProfile(sessionId: string, payload: JourneyStageArtifactApprovalRequest) {
    const snapshot = await client.approveMemoryProfile(sessionId, payload);
    return syncSnapshot(snapshot);
  }

  async function buildCanvas(sessionId: string) {
    const envelope = await client.buildCanvas(sessionId);
    await refreshSessionData(sessionId);
    return envelope;
  }

  async function enrichBlueprint(sessionId: string) {
    const envelope = await client.enrichBlueprint(sessionId);
    await refreshSessionData(sessionId);
    return envelope;
  }

  async function patchBlueprint(sessionId: string, payload: BlueprintPatchRequest) {
    const envelope = await client.patchBlueprint(sessionId, payload);
    await refreshSessionData(sessionId);
    return envelope;
  }

  async function listJourneyArtifacts(sessionId: string, stageKey: JourneyStageKey) {
    return client.listJourneyArtifacts(sessionId, stageKey);
  }

  async function analyzeDiscovery(sessionId: string, payload: DiscoveryInput) {
    const artifact = await client.analyzeDiscovery(sessionId, payload);
    await refreshSessionData(sessionId);
    return artifact;
  }

  async function defineRequirements(sessionId: string) {
    const artifact = await client.defineRequirements(sessionId);
    await refreshSessionData(sessionId);
    return artifact;
  }

  async function proposeDesign(sessionId: string, instructions = "") {
    const artifact = await client.proposeDesign(sessionId, {
      instructions,
    });
    await refreshSessionData(sessionId);
    return artifact;
  }

  async function createJourneyArtifact(
    sessionId: string,
    stageKey: JourneyStageKey,
    payload: JourneyStageArtifactCreateRequest,
  ) {
    const artifact = await client.createJourneyArtifact(sessionId, stageKey, payload);
    await refreshSessionData(sessionId);
    return artifact;
  }

  async function patchJourneyArtifact(
    sessionId: string,
    stageKey: JourneyStageKey,
    artifactId: string,
    payload: JourneyStageArtifactPatchRequest,
  ) {
    const artifact = await client.patchJourneyArtifact(sessionId, stageKey, artifactId, payload);
    await refreshSessionData(sessionId);
    return artifact;
  }

  async function approveJourneyArtifact(
    sessionId: string,
    stageKey: JourneyStageKey,
    artifactId: string,
    payload: JourneyStageArtifactApprovalRequest = {},
  ) {
    const artifact = await client.approveJourneyArtifact(sessionId, stageKey, artifactId, payload);
    await refreshSessionData(sessionId);
    return artifact;
  }

  async function rejectJourneyArtifact(
    sessionId: string,
    stageKey: JourneyStageKey,
    artifactId: string,
    payload: JourneyStageArtifactRejectionRequest = {},
  ) {
    const artifact = await client.rejectJourneyArtifact(sessionId, stageKey, artifactId, payload);
    await refreshSessionData(sessionId);
    return artifact;
  }

  async function bootstrapEvaluation(sessionId: string) {
    const snapshot = await client.bootstrapEvaluation(sessionId);
    return syncSnapshot(snapshot);
  }

  async function patchEvaluationDataset(sessionId: string, payload: EvaluationDatasetUpdateRequest) {
    const snapshot = await client.patchEvaluationDataset(sessionId, payload);
    return syncSnapshot(snapshot);
  }

  async function patchEvaluationRubric(sessionId: string, payload: EvaluationRubricUpdateRequest) {
    const snapshot = await client.patchEvaluationRubric(sessionId, payload);
    return syncSnapshot(snapshot);
  }

  async function evaluateBlueprint(sessionId: string) {
    const envelope = await client.evaluateBlueprint(sessionId);
    await refreshSessionData(sessionId);
    return envelope;
  }

  async function generateValidationScenarios(sessionId: string, payload: ValidationScenarioGenerationRequest = {}) {
    const artifact = await client.generateValidationScenarios(sessionId, payload);
    await refreshSessionData(sessionId);
    return artifact;
  }

  async function approveValidationScenarios(sessionId: string, payload: JourneyStageArtifactApprovalRequest = {}) {
    const snapshot = await client.approveValidationScenarios(sessionId, payload);
    return syncSnapshot(snapshot);
  }

  async function runValidationSimulation(sessionId: string, payload: ValidationSimulationRunRequest) {
    const run = await client.runValidationSimulation(sessionId, payload);
    await refreshSessionData(sessionId);
    return run;
  }

  async function injectValidationEvent(sessionId: string, payload: ValidationSimulationEventInjectionRequest) {
    const run = await client.injectValidationEvent(sessionId, payload);
    await refreshSessionData(sessionId);
    return run;
  }

  async function judgeValidationRun(sessionId: string, payload: ValidationSimulationJudgeRequest) {
    const run = await client.judgeValidationRun(sessionId, payload);
    await refreshSessionData(sessionId);
    return run;
  }

  async function resolveApproval(sessionId: string, approvalId: string, payload: ApprovalResolutionRequest) {
    const approval = await client.resolveApproval(sessionId, approvalId, payload);
    await refreshSessionData(sessionId);
    return approval;
  }

  async function resolveHandoff(sessionId: string, handoffId: string, payload: HandoffResolutionRequest) {
    const snapshot = await client.resolveHandoff(sessionId, handoffId, payload);
    return syncSnapshot(snapshot);
  }

  async function runSubagent(sessionId: string, runKind: string) {
    const snapshot = await client.runSubagent(sessionId, runKind);
    return syncSnapshot(snapshot);
  }

  async function rerunSkill(sessionId: string, skillKey: string) {
    const response = await client.rerunSkill(sessionId, skillKey);
    syncSnapshot(response.snapshot as SessionSnapshot);
    return response;
  }

  async function getAcpPreview(sessionId: string, profile: AcpExportProfile = "extended") {
    return client.getAcpPreview(sessionId, profile);
  }

  async function generateAcp(sessionId: string, profile: AcpExportProfile = "extended") {
    const preview = profile === "extended" ? await client.generateAcp(sessionId) : await client.generateAcp(sessionId, profile);
    await refreshSessionData(sessionId);
    return preview;
  }

  async function getAcpValidation(sessionId: string, profile: AcpExportProfile = "extended") {
    return client.getAcpValidation(sessionId, profile);
  }

  async function getDiagramCatalog(sessionId: string) {
    return client.getDiagramCatalog(sessionId);
  }

  async function getDiagramContent(sessionId: string, diagramKey: string, format?: string | null) {
    return client.getDiagramContent(sessionId, diagramKey, format);
  }

  async function getAcpConstructionReadiness(sessionId: string, profile: AcpExportProfile = "extended") {
    return client.getAcpConstructionReadiness(sessionId, profile);
  }

  async function getAcpQuestions(sessionId: string, profile: AcpExportProfile = "extended") {
    return client.getAcpQuestions(sessionId, profile);
  }

  async function answerAcpQuestion(sessionId: string, questionKey: string, payload: ConstructionQuestionAnswerRequest) {
    return client.answerAcpQuestion(sessionId, questionKey, payload);
  }

  async function getAcpKnowledgeGraph(sessionId: string, profile: AcpExportProfile = "extended") {
    return client.getAcpKnowledgeGraph(sessionId, profile);
  }

  async function getAcpGap(sessionId: string, gapKey: string, profile: AcpExportProfile = "extended") {
    return client.getAcpGap(sessionId, gapKey, profile);
  }

  async function getAcpFile(sessionId: string, filePath: string, profile: AcpExportProfile = "extended") {
    return client.getAcpFile(sessionId, filePath, profile);
  }

  async function exportAcpZip(sessionId: string, profile: AcpExportProfile = "extended") {
    return client.exportAcpZip(sessionId, profile);
  }

  async function exportBlueprintCore(sessionId: string, preview = false) {
    return client.exportBlueprintCore(sessionId, preview);
  }

  async function exportConstructionPack(sessionId: string, preview = false) {
    return client.exportConstructionPack(sessionId, preview);
  }

  async function exportAgentConstructionPackage(sessionId: string, preview = false) {
    return client.exportAgentConstructionPackage(sessionId, preview);
  }

  async function exportPromptPack(sessionId: string, preview = false) {
    return client.exportPromptPack(sessionId, preview);
  }

  async function exportEstimationPack(sessionId: string, preview = false) {
    return client.exportEstimationPack(sessionId, preview);
  }

  async function exportTestPack(sessionId: string, preview = false) {
    return client.exportTestPack(sessionId, preview);
  }

  async function generateEstimationReport(sessionId: string) {
    const envelope = await client.generateEstimationReport(sessionId);
    await refreshSessionData(sessionId);
    return envelope;
  }

  async function applyEstimationAnalysisDecision(sessionId: string, payload: { decision: "accepted" | "rejected"; note: string }) {
    const envelope = await client.applyEstimationAnalysisDecision(sessionId, payload);
    await refreshSessionData(sessionId);
    return envelope;
  }

  async function upsertEstimationActuals(sessionId: string, payload: EstimationActualsUpsertRequest) {
    const actuals = await client.upsertEstimationActuals(sessionId, payload);
    await refreshSessionData(sessionId);
    return actuals;
  }

  async function exportMarkdown(sessionId: string) {
    return client.exportMarkdown(sessionId);
  }

  async function exportJson(sessionId: string) {
    return client.exportJson(sessionId);
  }

  async function getMonitoringWorkspace(sessionId: string) {
    return client.getMonitoringWorkspace(sessionId);
  }

  async function listArtifacts(sessionId: string) {
    return client.listArtifacts(sessionId);
  }

  async function queryLibrary(
    sessionId: string,
    params: {
      artifact_kind?: string;
      blueprint_version_number?: number | null;
      date_from?: string;
      date_to?: string;
      q?: string;
      stage?: SessionSummary["current_stage"] | null;
    } = {},
  ) {
    return client.queryLibrary(sessionId, params);
  }

  async function listIntegrations(sessionId: string) {
    return client.listIntegrations(sessionId);
  }

  async function checkIntegrations(sessionId: string) {
    const snapshot = await client.checkIntegrations(sessionId);
    return syncSnapshot(snapshot);
  }

  async function getRuntimeSettings() {
    return client.getRuntimeSettings();
  }

  async function listCommercialProducts() {
    return client.listCommercialProducts();
  }

  async function createCheckoutSession(payload: CommercialCheckoutSessionRequest) {
    return client.createCheckoutSession(payload);
  }

  async function completeSandboxCheckout(checkoutRef: string, payload: CommercialCheckoutCompletionRequest = { outcome: "success" }) {
    const order = await client.completeSandboxCheckout(checkoutRef, payload);
    if (order.session_id) {
      await loadSnapshot(order.session_id, true);
    }
    return order;
  }

  async function checkoutProduct(sessionId: string, productKey: string, options: CheckoutProductOptions = {}) {
    const checkout = await createCheckoutSession({
      cancel_url: options.cancelUrl,
      idempotency_key: options.idempotencyKey,
      product_key: productKey,
      session_id: sessionId,
      success_url: options.successUrl,
    });
    return completeSandboxCheckout(checkout.checkout_ref, {
      outcome: options.outcome ?? "success",
      provider_payment_id: options.providerPaymentId ?? `sandbox_${checkout.checkout_ref}`,
    });
  }

  async function getCommercialOrder(orderId: string) {
    return client.getCommercialOrder(orderId);
  }

  async function getProductOverview(sessionId: string) {
    return client.getProductOverview(sessionId);
  }

  async function getBlueprintResult(sessionId: string) {
    return client.getBlueprintResult(sessionId);
  }

  async function getBlueprintOffer(sessionId: string) {
    return client.getBlueprintOffer(sessionId);
  }

  async function getAcpInvitation(sessionId: string) {
    return client.getAcpInvitation(sessionId);
  }

  async function getAcpWorkspace(sessionId: string) {
    return client.getAcpWorkspace(sessionId);
  }

  async function runAcpWorkspacePhase(sessionId: string, phaseKey: string, payload: ACPPhaseCommandRequest = {}) {
    return client.runAcpWorkspacePhase(sessionId, phaseKey, payload);
  }

  async function resumeAcpWorkspace(sessionId: string) {
    return client.resumeAcpWorkspace(sessionId);
  }

  async function getAttention(sessionId: string) {
    return client.getAttention(sessionId);
  }

  async function getExportCatalog(sessionId: string) {
    return client.getExportCatalog(sessionId);
  }

  async function createExportJob(sessionId: string, payload: ExportJobCreateRequest) {
    return client.createExportJob(sessionId, payload);
  }

  async function getExportJob(sessionId: string, jobId: string) {
    return client.getExportJob(sessionId, jobId);
  }

  async function retryExportJob(sessionId: string, jobId: string) {
    return client.retryExportJob(sessionId, jobId);
  }

  async function cancelExportJob(sessionId: string, jobId: string) {
    return client.cancelExportJob(sessionId, jobId);
  }

  async function downloadExportJob(sessionId: string, jobId: string) {
    return client.downloadExportJob(sessionId, jobId);
  }

  async function getAcpLauncher(sessionId: string) {
    return client.getAcpLauncher(sessionId);
  }

  async function submitAcpLauncherReport(sessionId: string, payload: LauncherReportSubmitRequest) {
    return client.submitAcpLauncherReport(sessionId, payload);
  }

  async function getActivity(sessionId: string, limit?: number) {
    return client.getActivity(sessionId, limit);
  }

  async function getPlanAccess(sessionId: string) {
    return client.getPlanAccess(sessionId);
  }

  async function getDiagramCatalogV2(
    sessionId: string,
    params: {
      category?: string;
      cursor?: string | null;
      limit?: number;
      q?: string;
    } = {},
  ) {
    return client.getDiagramCatalogV2(sessionId, params);
  }

  async function createAccessRequest(sessionId: string, payload: AccessRequestCreateRequest) {
    return client.createAccessRequest(sessionId, payload);
  }

  async function resolveAccessRequest(requestId: string, payload: AccessRequestResolveRequest) {
    return client.resolveAccessRequest(requestId, payload);
  }

  async function patchRuntimeSettings(payload: LLMRuntimeSettingsUpdateRequest) {
    return client.patchRuntimeSettings(payload);
  }

  async function getEstimationCalibration() {
    return client.getEstimationCalibration();
  }

  async function patchFeatureFlag(sessionId: string, flagKey: string, payload: FeatureFlagUpdateRequest) {
    const snapshot = await client.patchFeatureFlag(sessionId, flagKey, payload);
    return syncSnapshot(snapshot);
  }

  async function patchCommercialTier(sessionId: string, tier: SessionSummary["commercial_tier"]) {
    if (!tier) {
      return state.activeSnapshot;
    }
    const snapshot = await client.patchCommercialTier(sessionId, { tier });
    return syncSnapshot(snapshot);
  }

  async function recordAcpInvitationEvent(sessionId: string, payload: CommercialEventRequest) {
    const snapshot = await client.recordAcpInvitationEvent(sessionId, payload);
    return syncSnapshot(snapshot);
  }

  async function recordCommercialEvent(sessionId: string, payload: CommercialEventRequest) {
    const snapshot = await client.recordCommercialEvent(sessionId, payload);
    return syncSnapshot(snapshot);
  }

  async function getCommercialAuditReport(sessionId: string, limit?: number) {
    return client.getCommercialAuditReport(sessionId, limit);
  }

  async function hydrateRouteSession(sessionId: string) {
    persistActiveSessionId(sessionId);
    return selectSession(sessionId, {
      forceSnapshot: state.activeSnapshot?.session.id !== sessionId,
      loadSnapshot: true,
      persist: true,
    });
  }

  function reset() {
    clearActiveSessionId();
    updateState(createInitialState(() => null));
  }

  return {
    answerAcpQuestion,
    bootstrapEvaluation,
    buildBlueprint,
    buildCanvas,
    checkIntegrations,
    createSession,
    evaluateBlueprint,
    generateValidationScenarios,
    approveValidationScenarios,
    runValidationSimulation,
    injectValidationEvent,
    judgeValidationRun,
    enrichBlueprint,
    exportAcpZip,
    exportAgentConstructionPackage,
    exportBlueprintCore,
    exportConstructionPack,
    exportEstimationPack,
    exportTestPack,
    exportJson,
    exportMarkdown,
    exportPromptPack,
    generateEstimationReport,
    applyEstimationAnalysisDecision,
    upsertEstimationActuals,
    generateAcp,
    getAcpConstructionReadiness,
    getAcpFile,
    getAcpGap,
    getAcpKnowledgeGraph,
    getAcpPreview,
    getAcpQuestions,
    getAcpValidation,
    getCommercialAuditReport,
    getDiagramCatalog,
    getDiagramContent,
    getEstimationCalibration,
    getMonitoringWorkspace,
    getAcpLauncher,
    getAcpWorkspace,
    getAcpInvitation,
    getActivity,
    getAttention,
    getBlueprintOffer,
    getBlueprintResult,
    getCommercialOrder,
    getDiagramCatalogV2,
    getExportCatalog,
    getExportJob,
    getPlanAccess,
    getProductOverview,
    getRuntimeSettings,
    createExportJob,
    retryExportJob,
    cancelExportJob,
    createAccessRequest,
    checkoutProduct,
    createCheckoutSession,
    completeSandboxCheckout,
    downloadExportJob,
    submitAcpLauncherReport,
    getState: () => state,
    hydrateRouteSession,
    analyzeDiscovery,
    defineRequirements,
    proposeDesign,
    listJourneyArtifacts,
    listArtifacts,
    listIntegrations,
    loadSnapshot,
    normalizeDiscovery,
    createJourneyArtifact,
    approveMemoryProfile,
    approveToolsSelection,
    approveJourneyArtifact,
    recommendMemory,
    recommendTools,
    patchBlueprint,
    patchCommercialTier,
    recordCommercialEvent,
    recordAcpInvitationEvent,
    patchEvaluationDataset,
    patchEvaluationRubric,
    patchFeatureFlag,
    patchJourneyArtifact,
    patchRuntimeSettings,
    renameSession,
    listCommercialProducts,
    queryLibrary,
    refreshList,
    refreshSessionData,
    rejectJourneyArtifact,
    rerunSkill,
    resolveApproval,
    resolveAccessRequest,
    resolveHandoff,
    archiveSession,
    deleteSession,
    restoreSession,
    resumeAcpWorkspace,
    reset,
    runSubagent,
    runAcpWorkspacePhase,
    selectSession,
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export type SessionsStore = ReturnType<typeof createSessionsStore>;
