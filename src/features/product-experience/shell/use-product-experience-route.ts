"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createProductExperienceServerState } from "@/features/product-experience/core/server-state";
import type {
  ProductExperienceStageOperation,
  ProductExperienceStoreSnapshot,
  ProductRouteState,
} from "@/features/product-experience/core/server-state";
import {
  buildProductOperationEnvelope,
  completeMutationOperationEnvelope,
  createMutationOperationEnvelope,
  failMutationOperationEnvelope,
  isOperationActive,
  operationFromStageOperationRecord,
  type ProductOperationEnvelope,
} from "@/features/product-experience/operations/operation-model";
import { isAbortLikeError } from "@/features/product-experience/core/server-state/resource-state";
import type {
  AttentionActionRequestV2,
  AttentionActionResultV2,
} from "@/features/attention/attention-contracts";
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
import type { SessionSnapshot } from "@/features/sessions/types";

const productExperienceStore = createProductExperienceServerState();

export type ProductAttentionActionState = {
  itemKey?: string;
  message?: string;
  operation?: ProductOperationEnvelope;
  status: "idle" | "submitting" | "success" | "error";
};

export type ProductDiscoveryActionName = "normalize" | "analyze" | "review" | "approve" | "reject";
export type ProductStageActionName =
  | "build_canvas"
  | "define_requirements"
  | "propose_design"
  | "recommend_tools"
  | "recommend_memory"
  | "generate_estimation_report"
  | "prepare_blueprint_commercial_result"
  | "approve_tools_selection"
  | "approve_memory_profile"
  | "review"
  | "approve"
  | "reject";

export type ProductDiscoveryActionState = {
  action?: ProductDiscoveryActionName;
  message?: string;
  operation?: ProductOperationEnvelope;
  status: "idle" | "submitting" | "success" | "error";
};

export type ProductStageActionState = {
  action?: ProductStageActionName;
  message?: string;
  operation?: ProductOperationEnvelope;
  status: "idle" | "submitting" | "success" | "error";
};

export type ProductStageOperationControls = {
  cancelOperation(operationId: string): Promise<ProductExperienceStageOperation>;
  retryOperation(operationId: string): Promise<ProductExperienceStageOperation>;
};

export type ProductDiscoveryActions = {
  analyzeDiscovery(payload: DiscoveryInput): Promise<ProductExperienceStageOperation>;
  approveDiscoverArtifact(
    artifactId: string,
    payload: JourneyStageArtifactApprovalRequest,
  ): Promise<JourneyStageArtifactEntry>;
  normalizeDiscovery(payload: DiscoveryInput): Promise<DiscoveryEnvelope>;
  patchDiscoverArtifact(
    artifactId: string,
    payload: JourneyStageArtifactPatchRequest,
  ): Promise<JourneyStageArtifactEntry>;
  rejectDiscoverArtifact(
    artifactId: string,
    payload: JourneyStageArtifactRejectionRequest,
  ): Promise<JourneyStageArtifactEntry>;
};

export type ProductStageActions = {
  approveStageArtifact(
    stageKey: JourneyStageKey,
    artifactId: string,
    payload: JourneyStageArtifactApprovalRequest,
  ): Promise<JourneyStageArtifactEntry>;
  buildCanvas(): Promise<CanvasEnvelope>;
  defineRequirements(): Promise<ProductExperienceStageOperation>;
  approveMemoryProfile(payload: JourneyStageArtifactApprovalRequest): Promise<SessionSnapshot>;
  approveToolsSelection(payload: ApproveToolsSelectionRequest): Promise<SessionSnapshot>;
  patchStageArtifact(
    stageKey: JourneyStageKey,
    artifactId: string,
    payload: JourneyStageArtifactPatchRequest,
  ): Promise<JourneyStageArtifactEntry>;
  proposeDesign(payload?: DesignProposalRequest): Promise<ProductExperienceStageOperation>;
  recommendMemory(payload?: MemoryRecommendationRequest): Promise<ProductExperienceStageOperation>;
  recommendTools(payload?: ToolRecommendationRequest): Promise<ProductExperienceStageOperation>;
  generateEstimationReport(): Promise<ProductExperienceStageOperation>;
  prepareBlueprintCommercialResult(): Promise<SessionSnapshot>;
  rejectStageArtifact(
    stageKey: JourneyStageKey,
    artifactId: string,
    payload: JourneyStageArtifactRejectionRequest,
  ): Promise<JourneyStageArtifactEntry>;
};

function getServerSnapshot(): ProductExperienceStoreSnapshot {
  return {
    active: null,
    history: [],
  };
}

function toStageActionName(action: string): ProductStageActionName | undefined {
  const allowed: ProductStageActionName[] = [
    "build_canvas",
    "define_requirements",
    "propose_design",
    "recommend_tools",
    "recommend_memory",
    "generate_estimation_report",
    "prepare_blueprint_commercial_result",
    "approve_tools_selection",
    "approve_memory_profile",
    "review",
    "approve",
    "reject",
  ];
  return allowed.includes(action as ProductStageActionName) ? (action as ProductStageActionName) : undefined;
}

function statusForBackendOperation(operation: ProductOperationEnvelope): "submitting" | "success" | "error" {
  if (isOperationActive(operation)) {
    return "submitting";
  }
  if (operation.status === "failed" || operation.status === "cancelled") {
    return "error";
  }
  return "success";
}

function reconcileBackendOperation<
  TAction extends ProductDiscoveryActionState | ProductStageActionState,
>(current: TAction, serverOperation: ProductOperationEnvelope, stage: string): TAction {
  if (!current.operation || current.operation.id !== serverOperation.id || serverOperation.stage !== stage) {
    return current;
  }

  const nextStatus = statusForBackendOperation(serverOperation);
  const nextMessage = serverOperation.detail || current.message;
  if (
    current.status === nextStatus &&
    current.message === nextMessage &&
    current.operation.status === serverOperation.status &&
    current.operation.lastUpdatedAt === serverOperation.lastUpdatedAt
  ) {
    return current;
  }

  return {
    ...current,
    message: nextMessage,
    operation: serverOperation,
    status: nextStatus,
  };
}

export function useProductExperienceRoute(route: ProductRouteState, enabled = true) {
  const [attentionAction, setAttentionAction] = useState<ProductAttentionActionState>({ status: "idle" });
  const [discoveryAction, setDiscoveryAction] = useState<ProductDiscoveryActionState>({ status: "idle" });
  const [stageAction, setStageAction] = useState<ProductStageActionState>({ status: "idle" });
  const [loadError, setLoadError] = useState<Error | null>(null);
  const attentionMutationRef = useRef<Promise<AttentionActionResultV2> | null>(null);
  const discoveryMutationRef = useRef<Promise<unknown> | null>(null);
  const stageMutationRef = useRef<Promise<unknown> | null>(null);
  const state = useSyncExternalStore(
    productExperienceStore.subscribe,
    productExperienceStore.getState,
    getServerSnapshot,
  );
  const stableRoute = useMemo(
    () => ({
      currentStage: route.currentStage,
      sessionId: route.sessionId,
    }),
    [route.currentStage, route.sessionId],
  );

  const refreshRoute = useCallback(
    async (options: { force?: boolean } = {}) => {
      try {
        await productExperienceStore.loadRoute(stableRoute, options);
      } catch (error) {
        if (isAbortLikeError(error)) {
          return;
        }
        throw error;
      }
    },
    [stableRoute],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let disposed = false;
    void refreshRoute().catch((error: unknown) => {
      if (!disposed) {
        setLoadError(error instanceof Error ? error : new Error("No se pudo cargar la experiencia de producto."));
      }
    });

    return () => {
      disposed = true;
    };
  }, [enabled, refreshRoute]);

  const activeRoute = state.active?.route.sessionId === stableRoute.sessionId ? state.active : null;
  const currentActionState = stableRoute.currentStage === "discover" ? discoveryAction : stageAction;
  const serverOperation = useMemo(
    () => buildProductOperationEnvelope({ actionState: null, activeRoute }),
    [activeRoute],
  );
  const activeOperation = buildProductOperationEnvelope({
    actionState: currentActionState,
    activeRoute,
  });
  const isOperationProcessing =
    isOperationActive(activeOperation) ||
    discoveryAction.status === "submitting" ||
    stageAction.status === "submitting" ||
    attentionAction.status === "submitting";

  useEffect(() => {
    if (serverOperation?.source !== "server") {
      return;
    }

    setDiscoveryAction((current) => reconcileBackendOperation(current, serverOperation, "discover"));
    setStageAction((current) => reconcileBackendOperation(current, serverOperation, serverOperation.stage));
  }, [serverOperation]);

  useEffect(() => {
    if (!enabled || !isOperationProcessing) {
      return;
    }

    const intervalId = setInterval(() => {
      void refreshRoute({ force: true });
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [enabled, isOperationProcessing, refreshRoute]);

  const reload = useCallback(() => {
    setLoadError(null);
    return refreshRoute({ force: true });
  }, [refreshRoute]);

  const resolveAttentionItem = useCallback(
    async (itemKey: string, payload: AttentionActionRequestV2): Promise<AttentionActionResultV2> => {
      if (attentionMutationRef.current) {
        return attentionMutationRef.current;
      }

      const operation = createMutationOperationEnvelope({
        action: `attention_${payload.action_kind}`,
        message: "Aplicando accion del Segmento de Atencion.",
        sessionId: stableRoute.sessionId,
        stage: stableRoute.currentStage,
      });
      setAttentionAction({
        itemKey,
        operation,
        message: "Aplicando accion del Segmento de Atencion.",
        status: "submitting",
      });

      const promise = (async () => {
        try {
          const result = await productExperienceStore.resolveAttentionItem(itemKey, payload);
          const success = result.status === "applied" || result.status === "duplicate";
          setAttentionAction({
            itemKey,
            message: result.message,
            operation: success
              ? completeMutationOperationEnvelope(operation, result.message)
              : failMutationOperationEnvelope(operation, new Error(result.message)),
            status: success ? "success" : "error",
          });
          await refreshRoute({ force: true });
          return result;
        } catch (error) {
          const message = error instanceof Error ? error.message : "No se pudo resolver el item de atencion.";
          setAttentionAction({
            itemKey,
            message,
            operation: failMutationOperationEnvelope(operation, error),
            status: "error",
          });
          throw error;
        } finally {
          attentionMutationRef.current = null;
        }
      })();
      attentionMutationRef.current = promise;
      return promise;
    },
    [refreshRoute, stableRoute],
  );

  const runDiscoverMutation = useCallback(
    async <TResult,>(
      action: ProductDiscoveryActionName,
      message: string,
      mutation: () => Promise<TResult>,
    ): Promise<TResult> => {
      if (discoveryMutationRef.current) {
        return discoveryMutationRef.current as Promise<TResult>;
      }

      const operation = createMutationOperationEnvelope({
        action,
        message,
        sessionId: stableRoute.sessionId,
        stage: "discover",
      });
      setDiscoveryAction({
        action,
        message,
        operation,
        status: "submitting",
      });

      const promise = (async () => {
        try {
          const result = await mutation();
          setDiscoveryAction({
            action,
            message: "Discover sincronizado con backend.",
            operation: completeMutationOperationEnvelope(operation, "Discover sincronizado con backend."),
            status: "success",
          });
          await refreshRoute({ force: true });
          return result;
        } catch (error) {
          const nextMessage = error instanceof Error ? error.message : "No se pudo completar la accion de Discover.";
          setDiscoveryAction({
            action,
            message: nextMessage,
            operation: failMutationOperationEnvelope(operation, error),
            status: "error",
          });
          throw error;
        } finally {
          discoveryMutationRef.current = null;
        }
      })();
      discoveryMutationRef.current = promise;
      return promise;
    },
    [refreshRoute, stableRoute],
  );

  const runDiscoverOperationMutation = useCallback(
    async (
      action: ProductDiscoveryActionName,
      message: string,
      mutation: () => Promise<ProductExperienceStageOperation>,
    ): Promise<ProductExperienceStageOperation> => {
      if (discoveryMutationRef.current) {
        return discoveryMutationRef.current as Promise<ProductExperienceStageOperation>;
      }

      const operation = createMutationOperationEnvelope({
        action,
        message,
        sessionId: stableRoute.sessionId,
        stage: "discover",
      });
      setDiscoveryAction({
        action,
        message,
        operation,
        status: "submitting",
      });

      const promise = (async () => {
        try {
          const result = await mutation();
          const backendOperation = operationFromStageOperationRecord(result);
          setDiscoveryAction({
            action,
            message: result.detail || "Operacion de Discover iniciada en backend.",
            operation: backendOperation,
            status: statusForBackendOperation(backendOperation),
          });
          await refreshRoute({ force: true });
          return result;
        } catch (error) {
          const nextMessage = error instanceof Error ? error.message : "No se pudo iniciar la operacion de Discover.";
          setDiscoveryAction({
            action,
            message: nextMessage,
            operation: failMutationOperationEnvelope(operation, error),
            status: "error",
          });
          throw error;
        } finally {
          discoveryMutationRef.current = null;
        }
      })();
      discoveryMutationRef.current = promise;
      return promise;
    },
    [refreshRoute, stableRoute],
  );

  const discoverActions = useMemo<ProductDiscoveryActions>(
    () => ({
      analyzeDiscovery(payload) {
        return runDiscoverOperationMutation("analyze", "Analizando Discovery con LLM.", () =>
          productExperienceStore.startAnalyzeDiscovery(payload),
        );
      },
      approveDiscoverArtifact(artifactId, payload) {
        return runDiscoverMutation("approve", "Aprobando Discover y preparando Definir.", () =>
          productExperienceStore.approveDiscoverArtifact(artifactId, payload),
        );
      },
      normalizeDiscovery(payload) {
        return runDiscoverMutation("normalize", "Guardando y normalizando Discovery.", () =>
          productExperienceStore.normalizeDiscovery(payload),
        );
      },
      patchDiscoverArtifact(artifactId, payload) {
        return runDiscoverMutation("review", "Registrando revision de Discover.", () =>
          productExperienceStore.patchDiscoverArtifact(artifactId, payload),
        );
      },
      rejectDiscoverArtifact(artifactId, payload) {
        return runDiscoverMutation("reject", "Rechazando propuesta de Discover.", () =>
          productExperienceStore.rejectDiscoverArtifact(artifactId, payload),
        );
      },
    }),
    [runDiscoverMutation, runDiscoverOperationMutation],
  );

  const runStageMutation = useCallback(
    async <TResult,>(
      action: ProductStageActionName,
      message: string,
      mutation: () => Promise<TResult>,
    ): Promise<TResult> => {
      if (stageMutationRef.current) {
        return stageMutationRef.current as Promise<TResult>;
      }

      const operation = createMutationOperationEnvelope({
        action,
        message,
        sessionId: stableRoute.sessionId,
        stage: stableRoute.currentStage,
      });
      setStageAction({
        action,
        message,
        operation,
        status: "submitting",
      });

      const promise = (async () => {
        try {
          const result = await mutation();
          setStageAction({
            action,
            message: "Etapa sincronizada con backend.",
            operation: completeMutationOperationEnvelope(operation, "Etapa sincronizada con backend."),
            status: "success",
          });
          await refreshRoute({ force: true });
          return result;
        } catch (error) {
          const nextMessage = error instanceof Error ? error.message : "No se pudo completar la accion de la etapa.";
          setStageAction({
            action,
            message: nextMessage,
            operation: failMutationOperationEnvelope(operation, error),
            status: "error",
          });
          throw error;
        } finally {
          stageMutationRef.current = null;
        }
      })();
      stageMutationRef.current = promise;
      return promise;
    },
    [refreshRoute, stableRoute],
  );

  const runStageOperationMutation = useCallback(
    async (
      action: ProductStageActionName,
      message: string,
      mutation: () => Promise<ProductExperienceStageOperation>,
    ): Promise<ProductExperienceStageOperation> => {
      if (stageMutationRef.current) {
        return stageMutationRef.current as Promise<ProductExperienceStageOperation>;
      }

      const operation = createMutationOperationEnvelope({
        action,
        message,
        sessionId: stableRoute.sessionId,
        stage: stableRoute.currentStage,
      });
      setStageAction({
        action,
        message,
        operation,
        status: "submitting",
      });

      const promise = (async () => {
        try {
          const result = await mutation();
          const backendOperation = operationFromStageOperationRecord(result);
          setStageAction({
            action,
            message: result.detail || "Operacion iniciada en backend.",
            operation: backendOperation,
            status: statusForBackendOperation(backendOperation),
          });
          await refreshRoute({ force: true });
          return result;
        } catch (error) {
          const nextMessage = error instanceof Error ? error.message : "No se pudo iniciar la operacion de la etapa.";
          setStageAction({
            action,
            message: nextMessage,
            operation: failMutationOperationEnvelope(operation, error),
            status: "error",
          });
          throw error;
        } finally {
          stageMutationRef.current = null;
        }
      })();
      stageMutationRef.current = promise;
      return promise;
    },
    [refreshRoute, stableRoute],
  );

  const retryOperation = useCallback(
    async (operationId: string): Promise<ProductExperienceStageOperation> => {
      const result = await productExperienceStore.retryStageOperation(operationId);
      const backendOperation = operationFromStageOperationRecord(result);
      setStageAction({
        action: toStageActionName(result.action),
        message: result.detail || "Operacion reintentada.",
        operation: backendOperation,
        status: statusForBackendOperation(backendOperation),
      });
      await refreshRoute({ force: true });
      return result;
    },
    [refreshRoute],
  );

  const cancelOperation = useCallback(
    async (operationId: string): Promise<ProductExperienceStageOperation> => {
      const result = await productExperienceStore.cancelStageOperation(operationId);
      const backendOperation = operationFromStageOperationRecord(result);
      setStageAction({
        action: toStageActionName(result.action),
        message: result.detail || "Cancelacion solicitada.",
        operation: backendOperation,
        status: statusForBackendOperation(backendOperation),
      });
      await refreshRoute({ force: true });
      return result;
    },
    [refreshRoute],
  );

  const stageActions = useMemo<ProductStageActions>(
    () => ({
      approveStageArtifact(stageKey, artifactId, payload) {
        return runStageMutation("approve", `Aprobando ${stageKey}.`, () =>
          productExperienceStore.approveStageArtifact(stageKey, artifactId, payload),
        );
      },
      buildCanvas() {
        return runStageMutation("build_canvas", "Reconstruyendo Canvas desde Discovery aprobado.", () =>
          productExperienceStore.buildCanvas(),
        );
      },
      approveMemoryProfile(payload) {
        return runStageMutation("approve_memory_profile", "Aprobando estrategia de Memoria.", () =>
          productExperienceStore.approveMemoryProfile(payload),
        );
      },
      approveToolsSelection(payload) {
        return runStageMutation("approve_tools_selection", "Promoviendo herramientas aprobadas al blueprint.", () =>
          productExperienceStore.approveToolsSelection(payload),
        );
      },
      defineRequirements() {
        return runStageOperationMutation("define_requirements", "Generando Definir con LLM y memoria aprobada.", () =>
          productExperienceStore.startDefineRequirements(),
        );
      },
      patchStageArtifact(stageKey, artifactId, payload) {
        return runStageMutation("review", `Guardando revision de ${stageKey}.`, () =>
          productExperienceStore.patchStageArtifact(stageKey, artifactId, payload),
        );
      },
      proposeDesign(payload = {}) {
        return runStageOperationMutation("propose_design", "Generando alternativas de Diseno con LLM.", () =>
          productExperienceStore.startProposeDesign(payload),
        );
      },
      recommendMemory(payload = {}) {
        return runStageOperationMutation("recommend_memory", "Generando estrategia de Memoria con LLM.", () =>
          productExperienceStore.recommendMemory(payload),
        );
      },
      generateEstimationReport() {
        return runStageOperationMutation("generate_estimation_report", "Generando estimacion comercial y comparativa de valor.", () =>
          productExperienceStore.generateEstimationReport(),
        );
      },
      prepareBlueprintCommercialResult() {
        return runStageMutation("prepare_blueprint_commercial_result", "Preparando resultado comercial del Blueprint.", () =>
          productExperienceStore.prepareBlueprintCommercialResult(),
        );
      },
      recommendTools(payload = {}) {
        return runStageOperationMutation("recommend_tools", "Generando herramientas minimas con LLM.", () =>
          productExperienceStore.recommendTools(payload),
        );
      },
      rejectStageArtifact(stageKey, artifactId, payload) {
        return runStageMutation("reject", `Rechazando propuesta de ${stageKey}.`, () =>
          productExperienceStore.rejectStageArtifact(stageKey, artifactId, payload),
        );
      },
    }),
    [runStageMutation, runStageOperationMutation],
  );

  return {
    attentionAction,
    discoverAction: discoveryAction,
    discoverActions,
    loadError,
    operationControls: {
      cancelOperation,
      retryOperation,
    } satisfies ProductStageOperationControls,
    reload,
    resolveAttentionItem,
    stageAction,
    stageActions,
    state,
  };
}
