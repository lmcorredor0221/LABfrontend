"use client";

import { useEffect } from "react";
import { useSessions } from "@/features/sessions/session-context";

export function useSessionWorkspace({
  requireSnapshot = false,
}: {
  requireSnapshot?: boolean;
} = {}) {
  const sessions = useSessions();
  const {
    activeSessionId,
    activeSnapshot,
    answerAcpQuestion,
    bootstrapEvaluation,
    buildBlueprint,
    buildCanvas,
    checkIntegrations,
    checkoutProduct,
    cancelExportJob,
    createExportJob,
    createSession,
    evaluateBlueprint,
    exportAcpZip,
    exportJson,
    exportMarkdown,
    downloadExportJob,
    generateAcp,
    getAcpConstructionReadiness,
    getAcpFile,
    getAcpGap,
    getAcpKnowledgeGraph,
    getAcpPreview,
    getAcpQuestions,
    getAcpValidation,
    getAcpLauncher,
    getAcpWorkspace,
    getActivity,
    getAttention,
    getDiagramCatalogV2,
    getExportCatalog,
    getExportJob,
    getPlanAccess,
    getEstimationCalibration,
    getMonitoringWorkspace,
    getRuntimeSettings,
    hydrateRouteSession,
    items,
    listArtifacts,
    listError,
    listIntegrations,
    listStatus,
    loadSnapshot,
    normalizeDiscovery,
    patchBlueprint,
    patchCommercialTier,
    patchEvaluationDataset,
    patchEvaluationRubric,
    patchFeatureFlag,
    patchRuntimeSettings,
    queryLibrary,
    refreshList,
    refreshSessionData,
    rerunSkill,
    retryExportJob,
    resumeAcpWorkspace,
    resolveApproval,
    resolveHandoff,
    reset,
    runSubagent,
    runAcpWorkspacePhase,
    selectSession,
    submitAcpLauncherReport,
    snapshotError,
    snapshotStatus,
    upsertEstimationActuals,
  } = sessions;
  const explicitSelectedSession = items.find((item) => item.id === activeSessionId) ?? null;
  const selectedSession = explicitSelectedSession ?? items[0] ?? null;
  const selectedSnapshot = selectedSession && activeSnapshot?.session.id === selectedSession.id ? activeSnapshot : null;

  useEffect(() => {
    if (listStatus === "idle") {
      void refreshList({ loadActiveSnapshot: false });
    }
  }, [listStatus, refreshList]);

  useEffect(() => {
    if (listStatus !== "ready" || !selectedSession) {
      return;
    }

    if (activeSessionId !== selectedSession.id) {
      void selectSession(selectedSession.id, {
        loadSnapshot: requireSnapshot,
        persist: true,
      });
      return;
    }

    if (requireSnapshot && !selectedSnapshot && snapshotStatus === "idle") {
      void selectSession(selectedSession.id, {
        loadSnapshot: true,
        persist: true,
      });
    }
  }, [activeSessionId, listStatus, requireSnapshot, selectSession, selectedSession, selectedSnapshot, snapshotStatus]);

  async function selectWorkspaceSession(sessionId: string) {
    return selectSession(sessionId, {
      loadSnapshot: requireSnapshot,
      persist: true,
    });
  }

  return {
    activeSessionId,
    activeSnapshot,
    answerAcpQuestion,
    bootstrapEvaluation,
    buildBlueprint,
    buildCanvas,
    checkIntegrations,
    checkoutProduct,
    cancelExportJob,
    createExportJob,
    createSession,
    evaluateBlueprint,
    exportAcpZip,
    exportJson,
    exportMarkdown,
    downloadExportJob,
    generateAcp,
    getAcpConstructionReadiness,
    getAcpFile,
    getAcpGap,
    getAcpKnowledgeGraph,
    getAcpPreview,
    getAcpQuestions,
    getAcpValidation,
    getAcpLauncher,
    getAcpWorkspace,
    getActivity,
    getAttention,
    getDiagramCatalogV2,
    getExportCatalog,
    getExportJob,
    getPlanAccess,
    getEstimationCalibration,
    getMonitoringWorkspace,
    getRuntimeSettings,
    hydrateRouteSession,
    items,
    listArtifacts,
    listError,
    listIntegrations,
    listStatus,
    loadSnapshot,
    normalizeDiscovery,
    patchBlueprint,
    patchCommercialTier,
    patchEvaluationDataset,
    patchEvaluationRubric,
    patchFeatureFlag,
    patchRuntimeSettings,
    queryLibrary,
    refreshList,
    refreshSessionData,
    rerunSkill,
    retryExportJob,
    resumeAcpWorkspace,
    resolveApproval,
    resolveHandoff,
    reset,
    runSubagent,
    runAcpWorkspacePhase,
    selectSession,
    submitAcpLauncherReport,
    selectedSession,
    selectedSnapshot,
    selectWorkspaceSession,
    snapshotError,
    snapshotStatus,
    upsertEstimationActuals,
  };
}
