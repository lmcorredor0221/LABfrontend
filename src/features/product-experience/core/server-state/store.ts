import type { ApiError } from "@/core/api";
import type { AuthUser } from "@/core/auth/types";
import type {
  AttentionActionRequestV2,
  AttentionActionResultV2,
  AttentionResponseV2,
} from "@/features/attention/attention-contracts";
import { productExperienceApi, type ProductExperienceApiClientInstance } from "@/features/product-experience/core/server-state/api";
import {
  createEmptyResourceState,
  createErrorResourceState,
  createLoadingResourceState,
  createReadyResourceState,
  isAbortLikeError,
} from "@/features/product-experience/core/server-state/resource-state";
import type {
  ProductExperienceLoadOptions,
  ProductExperienceMutationOptions,
  ProductExperienceOperationState,
  ProductExperienceRouteSnapshot,
  ProductExperienceStageOperation,
  ProductExperienceStoreListener,
  ProductExperienceStoreSnapshot,
  ProductRouteState,
  ProductServerResourceState,
} from "@/features/product-experience/core/server-state/types";
import type { SessionListResponse, SessionSnapshot } from "@/features/sessions/types";
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
  ToolRecommendationRequest,
} from "@/features/sessions/session-contracts";

type InflightEntry<T> = {
  promise: Promise<T>;
};

type ProductExperienceServerStateDependencies = {
  api?: ProductExperienceApiClientInstance;
  now?: () => number;
};

type ResourceCache = {
  attention: Map<string, ProductServerResourceState<AttentionResponseV2>>;
  auth: Map<string, ProductServerResourceState<AuthUser>>;
  list: Map<string, ProductServerResourceState<SessionListResponse>>;
  operation: Map<string, ProductServerResourceState<ProductExperienceOperationState>>;
  snapshot: Map<string, ProductServerResourceState<SessionSnapshot>>;
};

const DEFAULT_ACTIVITY_LIMIT = 40;

function signalFrom(options: ProductExperienceLoadOptions | ProductExperienceMutationOptions | undefined) {
  return options?.signal ?? null;
}

function createInitialRouteSnapshot(route: ProductRouteState, requestId = 0): ProductExperienceRouteSnapshot {
  return {
    attention: createEmptyResourceState(""),
    auth: createEmptyResourceState(""),
    list: createEmptyResourceState(""),
    operation: createEmptyResourceState(""),
    requestId,
    route,
    snapshot: createEmptyResourceState(""),
  };
}

function attentionKey(route: ProductRouteState) {
  return `attention:${route.sessionId}:${route.currentStage}`;
}

function operationKey(route: ProductRouteState) {
  return `operation:${route.sessionId}`;
}

function snapshotKey(sessionId: string) {
  return `snapshot:${sessionId}`;
}

function listKey() {
  return "list:current-workspace";
}

function authKey() {
  return "auth:current-user";
}

function versionFromSnapshot(snapshot: SessionSnapshot) {
  return `${snapshot.session.id}:${snapshot.session.updated_at}`;
}

function versionFromAttention(attention: AttentionResponseV2) {
  return `${attention.session_id}:${attention.generated_at}:${attention.total_count}:${attention.cursor}`;
}

function versionFromList(list: SessionListResponse) {
  return list.items.map((item) => `${item.id}:${item.updated_at}`).join("|");
}

function versionFromOperation(operation: ProductExperienceOperationState) {
  return [
    operation.overview?.generated_at ?? "",
    operation.activity?.generated_at ?? "",
    operation.activity?.timeline?.length ?? 0,
    operation.stageOperation?.id ?? "",
    operation.stageOperation?.status ?? "",
    operation.stageOperation?.updated_at ?? "",
  ].join(":");
}

function toError(error: unknown): ApiError | Error {
  return error instanceof Error ? error : new Error("No se pudo completar la carga del servidor.");
}

function resolveIdempotencyKey(options?: ProductExperienceMutationOptions): string | undefined {
  if (options?.idempotencyKey) {
    return options.idempotencyKey;
  }
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return undefined;
}

export function createProductExperienceServerState({
  api = productExperienceApi,
}: ProductExperienceServerStateDependencies = {}) {
  const listeners = new Set<ProductExperienceStoreListener>();
  const inflight = new Map<string, InflightEntry<unknown>>();
  const cache: ResourceCache = {
    attention: new Map(),
    auth: new Map(),
    list: new Map(),
    operation: new Map(),
    snapshot: new Map(),
  };
  let state: ProductExperienceStoreSnapshot = {
    active: null,
    history: [],
  };
  let activeRouteController: AbortController | null = null;
  let activeRouteSignature = "";
  let requestSequence = 0;

  function emit() {
    listeners.forEach((listener) => listener());
  }

  function setState(nextState: ProductExperienceStoreSnapshot | ((current: ProductExperienceStoreSnapshot) => ProductExperienceStoreSnapshot)) {
    state = typeof nextState === "function" ? nextState(state) : nextState;
    emit();
    return state;
  }

  function updateActiveResource<K extends keyof ProductExperienceRouteSnapshot>(
    requestId: number,
    resource: K,
    value: ProductExperienceRouteSnapshot[K],
  ) {
    setState((current) => {
      if (!current.active || current.active.requestId !== requestId) {
        return current;
      }

      return {
        ...current,
        active: {
          ...current.active,
          [resource]: value,
        },
      };
    });
  }

  function updateCache<T>(map: Map<string, ProductServerResourceState<T>>, key: string, value: ProductServerResourceState<T>) {
    map.set(key, value);
    return value;
  }

  async function singleFlight<T>(key: string, _force: boolean, loader: () => Promise<T>): Promise<T> {
    // Forced reloads should bypass cache, not launch a second identical request while one is still running.
    const existing = inflight.get(key);
    if (existing) {
      return existing.promise as Promise<T>;
    }

    const promise = loader().finally(() => {
      globalThis.setTimeout(() => {
        const current = inflight.get(key);
        if (current?.promise === promise) {
          inflight.delete(key);
        }
      }, 0);
    });
    inflight.set(key, { promise });
    return promise;
  }

  function mergeSignals(controller: AbortController, externalSignal: AbortSignal | null) {
    if (!externalSignal) {
      return controller.signal;
    }

    if (externalSignal.aborted) {
      controller.abort(externalSignal.reason);
      return controller.signal;
    }

    externalSignal.addEventListener("abort", () => controller.abort(externalSignal.reason), { once: true });
    return controller.signal;
  }

  function startRoute(route: ProductRouteState, options: ProductExperienceLoadOptions | undefined) {
    const signature = `${route.sessionId}:${route.currentStage}`;
    if (activeRouteController && signature !== activeRouteSignature) {
      activeRouteController.abort("route_changed");
    }

    activeRouteSignature = signature;
    activeRouteController = new AbortController();
    const requestId = ++requestSequence;
    const signal = mergeSignals(activeRouteController, signalFrom(options));
    setState((current) => ({
      active: {
        ...createInitialRouteSnapshot(route, requestId),
        attention: cache.attention.get(attentionKey(route)) ?? createLoadingResourceState(attentionKey(route)),
        auth: cache.auth.get(authKey()) ?? createLoadingResourceState(authKey()),
        list: cache.list.get(listKey()) ?? createLoadingResourceState(listKey()),
        operation: cache.operation.get(operationKey(route)) ?? createLoadingResourceState(operationKey(route)),
        snapshot: cache.snapshot.get(snapshotKey(route.sessionId)) ?? createLoadingResourceState(snapshotKey(route.sessionId)),
      },
      history: current.active ? [current.active, ...current.history].slice(0, 20) : current.history,
    }));

    return { requestId, signal };
  }

  async function loadAuth({ force, requestId, signal }: { force: boolean; requestId: number; signal: AbortSignal }) {
    const key = authKey();
    const cached = cache.auth.get(key);
    if (cached && !force) {
      updateActiveResource(requestId, "auth", cached);
      return cached.data;
    }

    try {
      const data = await singleFlight(key, force, () => api.getAuth({ signal }));
      const ready = updateCache(cache.auth, key, createReadyResourceState({ data, requestKey: key, version: data.id }));
      updateActiveResource(requestId, "auth", ready);
      return data;
    } catch (error) {
      const failed = createErrorResourceState<AuthUser>({
        error: toError(error),
        requestKey: key,
        status: isAbortLikeError(error) ? "aborted" : "error",
      });
      updateActiveResource(requestId, "auth", failed);
      throw error;
    }
  }

  async function loadList({ force, requestId, signal }: { force: boolean; requestId: number; signal: AbortSignal }) {
    const key = listKey();
    const cached = cache.list.get(key);
    if (cached && !force) {
      updateActiveResource(requestId, "list", cached);
      return cached.data;
    }

    try {
      const data = await singleFlight(key, force, () => api.listSessions({ signal }));
      const ready = updateCache(cache.list, key, createReadyResourceState({ data, requestKey: key, version: versionFromList(data) }));
      updateActiveResource(requestId, "list", ready);
      return data;
    } catch (error) {
      const failed = createErrorResourceState<SessionListResponse>({
        error: toError(error),
        requestKey: key,
        status: isAbortLikeError(error) ? "aborted" : "error",
      });
      updateActiveResource(requestId, "list", failed);
      throw error;
    }
  }

  async function loadSnapshotResource({
    force,
    requestId,
    route,
    signal,
  }: {
    force: boolean;
    requestId: number;
    route: ProductRouteState;
    signal: AbortSignal;
  }) {
    const key = snapshotKey(route.sessionId);
    const cached = cache.snapshot.get(key);
    if (cached && !force) {
      updateActiveResource(requestId, "snapshot", cached);
      return cached.data;
    }

    try {
      const data = await singleFlight(key, force, () => api.getSnapshot(route.sessionId, { signal }));
      const ready = updateCache(cache.snapshot, key, createReadyResourceState({ data, requestKey: key, version: versionFromSnapshot(data) }));
      updateActiveResource(requestId, "snapshot", ready);
      return data;
    } catch (error) {
      const failed = createErrorResourceState<SessionSnapshot>({
        error: toError(error),
        requestKey: key,
        status: isAbortLikeError(error) ? "aborted" : "error",
      });
      updateActiveResource(requestId, "snapshot", failed);
      throw error;
    }
  }

  async function loadAttention({
    force,
    requestId,
    route,
    signal,
  }: {
    force: boolean;
    requestId: number;
    route: ProductRouteState;
    signal: AbortSignal;
  }) {
    const key = attentionKey(route);
    const cached = cache.attention.get(key);
    if (cached && !force) {
      updateActiveResource(requestId, "attention", cached);
      return cached.data;
    }

    try {
      const data = await singleFlight(key, force, () =>
        api.getAttentionV2(route.sessionId, { current_stage: route.currentStage, limit: 50 }, { signal }),
      );
      const ready = updateCache(cache.attention, key, createReadyResourceState({ data, requestKey: key, version: versionFromAttention(data) }));
      updateActiveResource(requestId, "attention", ready);
      return data;
    } catch (error) {
      const failed = createErrorResourceState<AttentionResponseV2>({
        error: toError(error),
        requestKey: key,
        status: isAbortLikeError(error) ? "aborted" : "error",
      });
      updateActiveResource(requestId, "attention", failed);
      throw error;
    }
  }

  async function loadOperation({
    force,
    requestId,
    route,
    signal,
  }: {
    force: boolean;
    requestId: number;
    route: ProductRouteState;
    signal: AbortSignal;
  }) {
    const key = operationKey(route);
    const cached = cache.operation.get(key);
    if (cached && !force) {
      updateActiveResource(requestId, "operation", cached);
      return cached.data;
    }

    try {
      const data = await singleFlight(key, force, async () => {
        const [overview, activity, stageOperation] = await Promise.all([
          api.getProductOverview(route.sessionId, { signal }),
          api.getActivity(route.sessionId, DEFAULT_ACTIVITY_LIMIT, { signal }),
          api.getCurrentStageOperation(route.sessionId, { stage_key: route.currentStage || undefined }, { signal }),
        ]);
        return { activity, overview, stageOperation };
      });
      const ready = updateCache(cache.operation, key, createReadyResourceState({ data, requestKey: key, version: versionFromOperation(data) }));
      updateActiveResource(requestId, "operation", ready);
      return data;
    } catch (error) {
      const failed = createErrorResourceState<ProductExperienceOperationState>({
        error: toError(error),
        requestKey: key,
        status: isAbortLikeError(error) ? "aborted" : "error",
      });
      updateActiveResource(requestId, "operation", failed);
      throw error;
    }
  }

  async function loadRoute(route: ProductRouteState, options: ProductExperienceLoadOptions = {}) {
    const { requestId, signal } = startRoute(route, options);
    const force = options.force ?? false;
    await loadSnapshotResource({ force, requestId, route, signal });
    void Promise.allSettled([
      loadAuth({ force, requestId, signal }),
      loadList({ force, requestId, signal }),
      loadAttention({ force, requestId, route, signal }),
      loadOperation({ force, requestId, route, signal }),
    ]);

    return state.active;
  }

  function syncSessionSnapshot(snapshot: SessionSnapshot) {
    const key = snapshotKey(snapshot.session.id);
    const ready = updateCache(cache.snapshot, key, createReadyResourceState({ data: snapshot, requestKey: key, version: versionFromSnapshot(snapshot) }));
    setState((current) => {
      if (!current.active || current.active.route.sessionId !== snapshot.session.id) {
        return current;
      }

      return {
        ...current,
        active: {
          ...current.active,
          snapshot: ready,
        },
      };
    });
  }

  function syncAttention(attention: AttentionResponseV2, currentStage = state.active?.route.currentStage ?? "") {
    const key = attentionKey({ currentStage, sessionId: attention.session_id });
    const ready = updateCache(cache.attention, key, createReadyResourceState({ data: attention, requestKey: key, version: versionFromAttention(attention) }));
    setState((current) => {
      if (!current.active || current.active.route.sessionId !== attention.session_id) {
        return current;
      }

      return {
        ...current,
        active: {
          ...current.active,
          attention: ready,
        },
      };
    });
  }

  function syncStageOperation(stageOperation: ProductExperienceStageOperation) {
    const key = operationKey({ currentStage: "", sessionId: stageOperation.session_id });
    const previous = cache.operation.get(key)?.data ?? { activity: null, overview: null, stageOperation: null };
    const data: ProductExperienceOperationState = {
      ...previous,
      stageOperation,
    };
    const ready = updateCache(cache.operation, key, createReadyResourceState({ data, requestKey: key, version: versionFromOperation(data) }));
    setState((current) => {
      if (!current.active || current.active.route.sessionId !== stageOperation.session_id) {
        return current;
      }

      return {
        ...current,
        active: {
          ...current.active,
          operation: ready,
        },
      };
    });
  }

  function invalidateSession(sessionId: string, options: { attention?: boolean } = {}) {
    const shouldInvalidateAttention = options.attention ?? true;
    const sessionSnapshotKey = snapshotKey(sessionId);
    const sessionOperationKey = operationKey({ currentStage: "", sessionId });
    cache.snapshot.delete(sessionSnapshotKey);
    cache.operation.delete(sessionOperationKey);
    inflight.delete(sessionSnapshotKey);
    inflight.delete(sessionOperationKey);

    if (shouldInvalidateAttention) {
      for (const key of cache.attention.keys()) {
        if (key.startsWith(`attention:${sessionId}:`)) {
          cache.attention.delete(key);
        }
      }
      for (const key of inflight.keys()) {
        if (key.startsWith(`attention:${sessionId}:`)) {
          inflight.delete(key);
        }
      }
    }
  }

  async function resolveAttentionItem(
    itemKey: string,
    payload: AttentionActionRequestV2,
    options: ProductExperienceMutationOptions = {},
  ): Promise<AttentionActionResultV2> {
    const active = state.active;
    if (!active) {
      throw new Error("No active product route is loaded.");
    }

    const result = await api.resolveAttentionItemV2(active.route.sessionId, itemKey, payload, {
      signal: signalFrom(options),
    });
    invalidateSession(active.route.sessionId, { attention: false });
    syncAttention(result.attention, active.route.currentStage);
    return result;
  }

  function activeSessionId() {
    const active = state.active;
    if (!active) {
      throw new Error("No active product route is loaded.");
    }

    return active.route.sessionId;
  }

  async function normalizeDiscovery(
    payload: DiscoveryInput,
    options: ProductExperienceMutationOptions = {},
  ): Promise<DiscoveryEnvelope> {
    const sessionId = activeSessionId();
    const result = await api.normalizeDiscovery(sessionId, payload, {
      signal: signalFrom(options),
    });
    invalidateSession(sessionId);
    return result;
  }

  async function analyzeDiscovery(
    payload: DiscoveryInput,
    options: ProductExperienceMutationOptions = {},
  ): Promise<JourneyStageArtifactEntry> {
    const sessionId = activeSessionId();
    const result = await api.analyzeDiscovery(sessionId, payload, {
      signal: signalFrom(options),
    });
    invalidateSession(sessionId);
    return result;
  }

  async function startAnalyzeDiscovery(
    payload: DiscoveryInput,
    options: ProductExperienceMutationOptions = {},
  ): Promise<ProductExperienceStageOperation> {
    const sessionId = activeSessionId();
    const result = await api.startAnalyzeDiscovery(sessionId, payload, {
      idempotencyKey: resolveIdempotencyKey(options),
      signal: signalFrom(options),
    });
    syncStageOperation(result);
    return result;
  }

  async function buildCanvas(options: ProductExperienceMutationOptions = {}): Promise<CanvasEnvelope> {
    const sessionId = activeSessionId();
    const result = await api.buildCanvas(sessionId, {
      signal: signalFrom(options),
    });
    invalidateSession(sessionId);
    return result;
  }

  async function defineRequirements(options: ProductExperienceMutationOptions = {}): Promise<JourneyStageArtifactEntry> {
    const sessionId = activeSessionId();
    const result = await api.defineRequirements(sessionId, {
      signal: signalFrom(options),
    });
    invalidateSession(sessionId);
    return result;
  }

  async function startDefineRequirements(
    options: ProductExperienceMutationOptions = {},
  ): Promise<ProductExperienceStageOperation> {
    const sessionId = activeSessionId();
    const result = await api.startDefineRequirements(sessionId, {
      idempotencyKey: resolveIdempotencyKey(options),
      signal: signalFrom(options),
    });
    syncStageOperation(result);
    return result;
  }

  async function proposeDesign(
    payload: DesignProposalRequest = {},
    options: ProductExperienceMutationOptions = {},
  ): Promise<JourneyStageArtifactEntry> {
    const sessionId = activeSessionId();
    const result = await api.proposeDesign(sessionId, payload, {
      signal: signalFrom(options),
    });
    invalidateSession(sessionId);
    return result;
  }

  async function startProposeDesign(
    payload: DesignProposalRequest = {},
    options: ProductExperienceMutationOptions = {},
  ): Promise<ProductExperienceStageOperation> {
    const sessionId = activeSessionId();
    const result = await api.startProposeDesign(sessionId, payload, {
      idempotencyKey: resolveIdempotencyKey(options),
      signal: signalFrom(options),
    });
    syncStageOperation(result);
    return result;
  }

  async function retryStageOperation(
    operationId: string,
    options: ProductExperienceMutationOptions = {},
  ): Promise<ProductExperienceStageOperation> {
    const sessionId = activeSessionId();
    const result = await api.retryStageOperation(sessionId, operationId, {
      signal: signalFrom(options),
    });
    syncStageOperation(result);
    return result;
  }

  async function cancelStageOperation(
    operationId: string,
    options: ProductExperienceMutationOptions = {},
  ): Promise<ProductExperienceStageOperation> {
    const sessionId = activeSessionId();
    const result = await api.cancelStageOperation(sessionId, operationId, {
      signal: signalFrom(options),
    });
    syncStageOperation(result);
    return result;
  }

  async function recoverStageOperation(
    operationId: string,
    options: ProductExperienceMutationOptions = {},
  ): Promise<ProductExperienceStageOperation> {
    const sessionId = activeSessionId();
    const result = await api.recoverStageOperation(sessionId, operationId, {
      signal: signalFrom(options),
    });
    syncStageOperation(result);
    return result;
  }

  async function recommendTools(
    payload: ToolRecommendationRequest = {},
    options: ProductExperienceMutationOptions = {},
  ): Promise<ProductExperienceStageOperation> {
    const sessionId = activeSessionId();
    const result = await api.startRecommendTools(sessionId, payload, {
      idempotencyKey: resolveIdempotencyKey(options),
      signal: signalFrom(options),
    });
    syncStageOperation(result);
    return result;
  }

  async function recommendMemory(
    payload: MemoryRecommendationRequest = {},
    options: ProductExperienceMutationOptions = {},
  ): Promise<ProductExperienceStageOperation> {
    const sessionId = activeSessionId();
    const result = await api.startRecommendMemory(sessionId, payload, {
      idempotencyKey: resolveIdempotencyKey(options),
      signal: signalFrom(options),
    });
    syncStageOperation(result);
    return result;
  }

  async function generateEstimationReport(options: ProductExperienceMutationOptions = {}): Promise<ProductExperienceStageOperation> {
    const sessionId = activeSessionId();
    const result = await api.startGenerateEstimationReport(sessionId, {
      idempotencyKey: resolveIdempotencyKey(options),
      signal: signalFrom(options),
    });
    syncStageOperation(result);
    return result;
  }

  async function prepareBlueprintCommercialResult(options: ProductExperienceMutationOptions = {}): Promise<SessionSnapshot> {
    const sessionId = activeSessionId();
    const result = await api.prepareBlueprintCommercialResult(sessionId, {
      signal: signalFrom(options),
    });
    invalidateSession(sessionId);
    syncSessionSnapshot(result);
    return result;
  }

  async function approveToolsSelection(
    payload: ApproveToolsSelectionRequest,
    options: ProductExperienceMutationOptions = {},
  ): Promise<SessionSnapshot> {
    const sessionId = activeSessionId();
    const result = await api.approveToolsSelection(sessionId, payload, {
      signal: signalFrom(options),
    });
    invalidateSession(sessionId);
    syncSessionSnapshot(result);
    return result;
  }

  async function approveMemoryProfile(
    payload: JourneyStageArtifactApprovalRequest,
    options: ProductExperienceMutationOptions = {},
  ): Promise<SessionSnapshot> {
    const sessionId = activeSessionId();
    const result = await api.approveMemoryProfile(sessionId, payload, {
      signal: signalFrom(options),
    });
    invalidateSession(sessionId);
    syncSessionSnapshot(result);
    return result;
  }

  async function patchStageArtifact(
    stageKey: JourneyStageKey,
    artifactId: string,
    payload: JourneyStageArtifactPatchRequest,
    options: ProductExperienceMutationOptions = {},
  ): Promise<JourneyStageArtifactEntry> {
    const sessionId = activeSessionId();
    const result = await api.patchJourneyArtifact(sessionId, stageKey, artifactId, payload, {
      signal: signalFrom(options),
    });
    invalidateSession(sessionId);
    return result;
  }

  async function approveStageArtifact(
    stageKey: JourneyStageKey,
    artifactId: string,
    payload: JourneyStageArtifactApprovalRequest,
    options: ProductExperienceMutationOptions = {},
  ): Promise<JourneyStageArtifactEntry> {
    const sessionId = activeSessionId();
    const result = await api.approveJourneyArtifact(sessionId, stageKey, artifactId, payload, {
      signal: signalFrom(options),
    });
    invalidateSession(sessionId);
    return result;
  }

  async function rejectStageArtifact(
    stageKey: JourneyStageKey,
    artifactId: string,
    payload: JourneyStageArtifactRejectionRequest,
    options: ProductExperienceMutationOptions = {},
  ): Promise<JourneyStageArtifactEntry> {
    const sessionId = activeSessionId();
    const result = await api.rejectJourneyArtifact(sessionId, stageKey, artifactId, payload, {
      signal: signalFrom(options),
    });
    invalidateSession(sessionId);
    return result;
  }

  async function patchDiscoverArtifact(
    artifactId: string,
    payload: JourneyStageArtifactPatchRequest,
    options: ProductExperienceMutationOptions = {},
  ): Promise<JourneyStageArtifactEntry> {
    return patchStageArtifact("discover", artifactId, payload, options);
  }

  async function approveDiscoverArtifact(
    artifactId: string,
    payload: JourneyStageArtifactApprovalRequest,
    options: ProductExperienceMutationOptions = {},
  ): Promise<JourneyStageArtifactEntry> {
    return approveStageArtifact("discover", artifactId, payload, options);
  }

  async function rejectDiscoverArtifact(
    artifactId: string,
    payload: JourneyStageArtifactRejectionRequest,
    options: ProductExperienceMutationOptions = {},
  ): Promise<JourneyStageArtifactEntry> {
    return rejectStageArtifact("discover", artifactId, payload, options);
  }

  function reset() {
    activeRouteController?.abort("reset");
    activeRouteController = null;
    activeRouteSignature = "";
    inflight.clear();
    cache.auth.clear();
    cache.list.clear();
    cache.snapshot.clear();
    cache.attention.clear();
    cache.operation.clear();
    setState({ active: null, history: [] });
  }

  return {
    analyzeDiscovery,
    startAnalyzeDiscovery,
    approveDiscoverArtifact,
    approveMemoryProfile,
    approveToolsSelection,
    approveStageArtifact,
    buildCanvas,
    defineRequirements,
    startDefineRequirements,
    generateEstimationReport,
    getState: () => state,
    invalidateSession,
    loadRoute,
    normalizeDiscovery,
    patchDiscoverArtifact,
    patchStageArtifact,
    prepareBlueprintCommercialResult,
    proposeDesign,
    startProposeDesign,
    retryStageOperation,
    cancelStageOperation,
    recoverStageOperation,
    recommendMemory,
    recommendTools,
    reset,
    rejectDiscoverArtifact,
    rejectStageArtifact,
    resolveAttentionItem,
    subscribe(listener: ProductExperienceStoreListener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    syncAttention,
    syncSessionSnapshot,
  };
}

export type ProductExperienceServerState = ReturnType<typeof createProductExperienceServerState>;
