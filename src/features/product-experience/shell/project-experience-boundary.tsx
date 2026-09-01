"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/core/auth/auth-context";
import { resolveProductExperienceCutoverDecision } from "@/core/config/feature-flags";
import type { ProjectRouteStage } from "@/core/routing/routes";
import { isLeanWorkStage, type LeanExperienceStage } from "@/features/journey/journey-model";
import { AttentionInboxView } from "@/features/product-experience/attention/attention-components";
import { DiagramCenterPage } from "@/features/diagram-center";
import { DesignStageView } from "@/features/product-experience/design/design-stage-view";
import { DefineStageView } from "@/features/product-experience/define/define-stage-view";
import { DiscoverStageView } from "@/features/product-experience/discover/discover-stage-view";
import { MemoryStageView } from "@/features/product-experience/memory/memory-stage-view";
import { UxaButton, UxaPageState } from "@/features/product-experience/design-system";
import { ProductSaasView } from "@/features/product-experience/saas/saas-product-views";
import { EstimateStageView, PackageStageView, ValidateStageView } from "@/features/product-experience/saas/saas-stage-views";
import { ProductExperienceCutoverTelemetry } from "@/features/product-experience/qa/cutover-telemetry";
import {
  ENTERPRISE_CORPORATE_FIXTURE_ID,
  EnterpriseCorporateProjectFixture,
} from "@/features/product-experience/qa/enterprise-corporate-project-fixture";
import { ProjectWorkspaceShell } from "@/features/product-experience/shell/project-workspace-shell";
import { ToolsStageView } from "@/features/product-experience/tools/tools-stage-view";
import {
  getProductDisplayStageForSection,
  getProductFetchStageForSection,
  type ProductExperienceProductSection,
} from "@/features/product-experience/shell/experience-model";
import { useProductExperienceRoute } from "@/features/product-experience/shell/use-product-experience-route";

type ProjectExperienceBoundaryProps = {
  productSection?: ProductExperienceProductSection | null;
  section?: string | null;
  sessionId: string;
  stage: ProjectRouteStage | LeanExperienceStage;
};

function ProductExperienceEnabledGate({
  productSection,
  sessionId,
  stage,
}: ProjectExperienceBoundaryProps) {
  const { selectWorkspace, user } = useAuth();
  const effectiveFetchStage =
    productSection && productSection !== "work"
      ? getProductFetchStageForSection(productSection)
      : (stage as ProjectRouteStage);
  const effectiveDisplayStage =
    productSection && productSection !== "work"
      ? getProductDisplayStageForSection(productSection)
      : (stage as LeanExperienceStage);
  const {
    attentionAction,
    discoverAction,
    discoverActions,
    loadError,
    operationControls,
    reload,
    resolveAttentionItem,
    stageAction,
    stageActions,
    state,
  } = useProductExperienceRoute({
    currentStage: effectiveFetchStage,
    sessionId,
  });
  const activeRoute = state.active?.route.sessionId === sessionId ? state.active : null;
  const snapshot = activeRoute?.snapshot.data ?? null;
  const workspaceFlags = snapshot?.workspace_contract?.feature_flags ?? null;
  const sessionWorkspaceId = snapshot?.session.workspace_id ?? null;
  const cutoverDecision = resolveProductExperienceCutoverDecision({
    workspaceFlags,
    workspaceId: sessionWorkspaceId,
  });
  const [workspaceSyncError, setWorkspaceSyncError] = useState<Error | null>(null);
  const [workspaceSyncAttempt, setWorkspaceSyncAttempt] = useState(0);
  const workspaceSyncRequestRef = useRef<string | null>(null);
  const shouldSyncWorkspace = Boolean(
    user
    && sessionWorkspaceId
    && user.active_workspace_id !== sessionWorkspaceId,
  );

  useEffect(() => {
    if (!user || !sessionWorkspaceId || user.active_workspace_id === sessionWorkspaceId) {
      workspaceSyncRequestRef.current = null;
      queueMicrotask(() => setWorkspaceSyncError(null));
      return;
    }
    if (workspaceSyncRequestRef.current === sessionWorkspaceId) {
      return;
    }

    workspaceSyncRequestRef.current = sessionWorkspaceId;
    queueMicrotask(() => setWorkspaceSyncError(null));

    let cancelled = false;
    void Promise.resolve(selectWorkspace(sessionWorkspaceId))
      .then(() => {
        if (cancelled) {
          return;
        }
        workspaceSyncRequestRef.current = null;
        void reload();
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        const resolvedError = error instanceof Error ? error : new Error("No se pudo sincronizar el workspace del proyecto.");
        setWorkspaceSyncError(resolvedError);
      });

    return () => {
      cancelled = true;
    };
  }, [reload, selectWorkspace, sessionWorkspaceId, user, workspaceSyncAttempt]);

  if (loadError && !activeRoute) {
    return (
      <div className="uxa-foundation-root flex min-h-screen items-center justify-center p-[var(--uxa-panel-padding-lg)]">
        <div className="w-full max-w-2xl">
          <UxaPageState
            actions={<UxaButton onClick={() => void reload()} variant="primary">Reintentar</UxaButton>}
            description={loadError.message}
            eyebrow="Error de carga"
            title="No se pudo cargar el proyecto"
            tone="danger"
          />
        </div>
      </div>
    );
  }

  if (workspaceSyncError && shouldSyncWorkspace) {
    return (
      <div className="uxa-foundation-root flex min-h-screen items-center justify-center p-[var(--uxa-panel-padding-lg)]">
        <div className="w-full max-w-2xl">
          <UxaPageState
            actions={(
              <UxaButton
                onClick={() => {
                  workspaceSyncRequestRef.current = null;
                  setWorkspaceSyncError(null);
                  setWorkspaceSyncAttempt((current) => current + 1);
                }}
                variant="primary"
              >
                Reintentar
              </UxaButton>
            )}
            description={workspaceSyncError.message}
            eyebrow="Workspace"
            title="No se pudo sincronizar el workspace del proyecto"
            tone="warning"
          />
        </div>
      </div>
    );
  }

  if (shouldSyncWorkspace) {
    return (
      <div className="uxa-foundation-root flex min-h-screen items-center justify-center p-[var(--uxa-panel-padding-lg)]">
        <div className="w-full max-w-2xl">
          <UxaPageState
            description="Estamos alineando el workspace activo con el workspace real del proyecto para respetar la configuracion efectiva de runtime y proveedores."
            eyebrow="Workspace"
            title="Sincronizando contexto del proyecto"
            tone="info"
          />
        </div>
      </div>
    );
  }

  const activeProduct = productSection ?? "work";
  const operationAction = effectiveFetchStage === "discover" ? discoverAction : stageAction;

  return (
    <ProjectWorkspaceShell
      activeProduct={activeProduct}
      activeRoute={activeRoute}
      activeStage={effectiveDisplayStage}
      attentionAction={attentionAction}
      onCancelOperation={(operationId) => void operationControls.cancelOperation(operationId)}
      onResolveAttentionItem={resolveAttentionItem}
      onReload={() => void reload()}
      onRetryOperation={(operationId) => void operationControls.retryOperation(operationId)}
      operationAction={operationAction}
      sessionId={sessionId}
    >
      <ProductExperienceCutoverTelemetry
        decision={cutoverDecision}
        routeKey={`${activeProduct}:${effectiveDisplayStage}`}
        sessionId={sessionId}
      />
      {productSection === "attention" ? (
        <AttentionInboxView
          actionState={attentionAction}
          activeRoute={activeRoute}
          currentStage={effectiveFetchStage}
          onResolveItem={resolveAttentionItem}
        />
      ) : productSection === "diagrams" ? (
        <DiagramCenterPage projectId={sessionId} />
      ) : productSection && productSection !== "work" ? (
        <ProductSaasView activeRoute={activeRoute} section={productSection} />
      ) : isLeanWorkStage(stage) && stage === "discover" ? (
        <DiscoverStageView
          actionState={discoverAction}
          actions={discoverActions}
          activeRoute={activeRoute}
        />
      ) : isLeanWorkStage(stage) && stage === "define" ? (
        <DefineStageView
          actionState={stageAction}
          actions={stageActions}
          activeRoute={activeRoute}
        />
      ) : isLeanWorkStage(stage) && stage === "design" ? (
        <DesignStageView
          actionState={stageAction}
          actions={stageActions}
          activeRoute={activeRoute}
        />
      ) : isLeanWorkStage(stage) && stage === "tools" ? (
        <ToolsStageView
          actionState={stageAction}
          actions={stageActions}
          activeRoute={activeRoute}
        />
      ) : isLeanWorkStage(stage) && stage === "memory" ? (
        <MemoryStageView
          actionState={stageAction}
          actions={stageActions}
          activeRoute={activeRoute}
        />
      ) : isLeanWorkStage(stage) && stage === "estimate" ? (
        <EstimateStageView
          actionState={stageAction}
          actions={stageActions}
          activeRoute={activeRoute}
        />
      ) : stage === "validate" ? (
        <ValidateStageView activeRoute={activeRoute} />
      ) : stage === "package" ? (
        <PackageStageView activeRoute={activeRoute} />
      ) : (
        <EstimateStageView
          actionState={stageAction}
          actions={stageActions}
          activeRoute={activeRoute}
        />
      )}
    </ProjectWorkspaceShell>
  );
}

export function ProjectExperienceBoundary(props: ProjectExperienceBoundaryProps) {
  if (process.env.NODE_ENV !== "production" && props.sessionId === ENTERPRISE_CORPORATE_FIXTURE_ID) {
    return <EnterpriseCorporateProjectFixture {...props} />;
  }

  return <ProductExperienceEnabledGate {...props} />;
}
