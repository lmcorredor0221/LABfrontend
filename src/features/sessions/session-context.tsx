"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/core/auth/auth-context";
import { parseProjectRoute } from "@/core/routing/routes";
import { createSessionsStore, type SessionsStore } from "@/features/sessions/session-store";

const SessionsStoreContext = createContext<SessionsStore | null>(null);

export function SessionsProvider({
  children,
  store,
}: {
  children: ReactNode;
  store?: SessionsStore;
}) {
  const pathname = usePathname();
  const auth = useAuth();
  const [sessionsStore] = useState(() => store ?? createSessionsStore());
  const routeSessionId = parseProjectRoute(pathname ?? "/")?.sessionId ?? null;
  const activeWorkspaceId = auth.user?.active_workspace_id ?? null;
  const isProductExperienceRoute = (pathname ?? "/").startsWith("/projects/");

  useEffect(() => {
    if (auth.status === "authenticated") {
      sessionsStore.reset();
      if (!isProductExperienceRoute) {
        void sessionsStore.refreshList({ loadActiveSnapshot: false }).catch(() => undefined);
      }
      return;
    }

    if (auth.status === "anonymous") {
      sessionsStore.reset();
    }
  }, [activeWorkspaceId, auth.status, isProductExperienceRoute, sessionsStore]);

  useEffect(() => {
    if (auth.status !== "authenticated" || !routeSessionId || isProductExperienceRoute) {
      return;
    }

    void sessionsStore.hydrateRouteSession(routeSessionId).catch(() => undefined);
  }, [auth.status, isProductExperienceRoute, routeSessionId, sessionsStore]);

  return <SessionsStoreContext.Provider value={sessionsStore}>{children}</SessionsStoreContext.Provider>;
}

export function useSessions() {
  const store = useContext(SessionsStoreContext);

  if (!store) {
    throw new Error("useSessions must be used within a SessionsProvider.");
  }

  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState);

  return {
    ...state,
    answerAcpQuestion: store.answerAcpQuestion,
    analyzeDiscovery: store.analyzeDiscovery,
    archiveSession: store.archiveSession,
    approveMemoryProfile: store.approveMemoryProfile,
    approveToolsSelection: store.approveToolsSelection,
    approveJourneyArtifact: store.approveJourneyArtifact,
    bootstrapEvaluation: store.bootstrapEvaluation,
    buildBlueprint: store.buildBlueprint,
    buildCanvas: store.buildCanvas,
    checkIntegrations: store.checkIntegrations,
    checkoutProduct: store.checkoutProduct,
    completeSandboxCheckout: store.completeSandboxCheckout,
    createAccessRequest: store.createAccessRequest,
    createCheckoutSession: store.createCheckoutSession,
    createExportJob: store.createExportJob,
    createJourneyArtifact: store.createJourneyArtifact,
    createSession: store.createSession,
    deleteSession: store.deleteSession,
    generateValidationScenarios: store.generateValidationScenarios,
    approveValidationScenarios: store.approveValidationScenarios,
    runValidationSimulation: store.runValidationSimulation,
    injectValidationEvent: store.injectValidationEvent,
    judgeValidationRun: store.judgeValidationRun,
    evaluateBlueprint: store.evaluateBlueprint,
    enrichBlueprint: store.enrichBlueprint,
    exportAcpZip: store.exportAcpZip,
    exportAgentConstructionPackage: store.exportAgentConstructionPackage,
    exportBlueprintCore: store.exportBlueprintCore,
    exportConstructionPack: store.exportConstructionPack,
    exportEstimationPack: store.exportEstimationPack,
    exportTestPack: store.exportTestPack,
    exportJson: store.exportJson,
    exportMarkdown: store.exportMarkdown,
    exportPromptPack: store.exportPromptPack,
    retryExportJob: store.retryExportJob,
    cancelExportJob: store.cancelExportJob,
    downloadExportJob: store.downloadExportJob,
    submitAcpLauncherReport: store.submitAcpLauncherReport,
    generateEstimationReport: store.generateEstimationReport,
    applyEstimationAnalysisDecision: store.applyEstimationAnalysisDecision,
    upsertEstimationActuals: store.upsertEstimationActuals,
    generateAcp: store.generateAcp,
    getAcpConstructionReadiness: store.getAcpConstructionReadiness,
    getAcpFile: store.getAcpFile,
    getAcpGap: store.getAcpGap,
    getAcpKnowledgeGraph: store.getAcpKnowledgeGraph,
    getAcpPreview: store.getAcpPreview,
    getAcpQuestions: store.getAcpQuestions,
    getAcpValidation: store.getAcpValidation,
    getCommercialAuditReport: store.getCommercialAuditReport,
    getAcpLauncher: store.getAcpLauncher,
    getAcpWorkspace: store.getAcpWorkspace,
    getAcpInvitation: store.getAcpInvitation,
    getActivity: store.getActivity,
    getAttention: store.getAttention,
    getBlueprintOffer: store.getBlueprintOffer,
    getBlueprintResult: store.getBlueprintResult,
    getCommercialOrder: store.getCommercialOrder,
    getDiagramCatalog: store.getDiagramCatalog,
    getDiagramCatalogV2: store.getDiagramCatalogV2,
    getDiagramContent: store.getDiagramContent,
    getExportCatalog: store.getExportCatalog,
    getExportJob: store.getExportJob,
    getPlanAccess: store.getPlanAccess,
    getEstimationCalibration: store.getEstimationCalibration,
    getMonitoringWorkspace: store.getMonitoringWorkspace,
    getProductOverview: store.getProductOverview,
    getRuntimeSettings: store.getRuntimeSettings,
    hydrateRouteSession: store.hydrateRouteSession,
    defineRequirements: store.defineRequirements,
    proposeDesign: store.proposeDesign,
    listArtifacts: store.listArtifacts,
    listIntegrations: store.listIntegrations,
    listJourneyArtifacts: store.listJourneyArtifacts,
    loadSnapshot: store.loadSnapshot,
    normalizeDiscovery: store.normalizeDiscovery,
    recommendMemory: store.recommendMemory,
    recommendTools: store.recommendTools,
    renameSession: store.renameSession,
    resumeAcpWorkspace: store.resumeAcpWorkspace,
    patchBlueprint: store.patchBlueprint,
    patchCommercialTier: store.patchCommercialTier,
    recordCommercialEvent: store.recordCommercialEvent,
    recordAcpInvitationEvent: store.recordAcpInvitationEvent,
    patchEvaluationDataset: store.patchEvaluationDataset,
    patchEvaluationRubric: store.patchEvaluationRubric,
    patchFeatureFlag: store.patchFeatureFlag,
    patchJourneyArtifact: store.patchJourneyArtifact,
    patchRuntimeSettings: store.patchRuntimeSettings,
    listCommercialProducts: store.listCommercialProducts,
    queryLibrary: store.queryLibrary,
    refreshList: store.refreshList,
    refreshSessionData: store.refreshSessionData,
    rejectJourneyArtifact: store.rejectJourneyArtifact,
    rerunSkill: store.rerunSkill,
    resolveApproval: store.resolveApproval,
    resolveAccessRequest: store.resolveAccessRequest,
    resolveHandoff: store.resolveHandoff,
    reset: store.reset,
    restoreSession: store.restoreSession,
    runAcpWorkspacePhase: store.runAcpWorkspacePhase,
    runSubagent: store.runSubagent,
    selectSession: store.selectSession,
  };
}
