"use client";

import { resolveProductExperienceCutoverDecision } from "@/core/config/feature-flags";
import type { ProjectRouteStage } from "@/core/routing/routes";
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
  getProductStageForSection,
  type ProductExperienceProductSection,
} from "@/features/product-experience/shell/experience-model";
import { useProductExperienceRoute } from "@/features/product-experience/shell/use-product-experience-route";

type ProjectExperienceBoundaryProps = {
  productSection?: ProductExperienceProductSection | null;
  section?: string | null;
  sessionId: string;
  stage: ProjectRouteStage;
};

function ProductExperienceEnabledGate({
  productSection,
  sessionId,
  stage,
}: ProjectExperienceBoundaryProps) {
  const effectiveStage = productSection && productSection !== "work" ? getProductStageForSection(productSection) : stage;
  const {
    attentionAction,
    discoverAction,
    discoverActions,
    loadError,
    reload,
    resolveAttentionItem,
    stageAction,
    stageActions,
    state,
  } = useProductExperienceRoute({
    currentStage: effectiveStage,
    sessionId,
  });
  const activeRoute = state.active?.route.sessionId === sessionId ? state.active : null;
  const snapshot = activeRoute?.snapshot.data ?? null;
  const workspaceFlags = snapshot?.workspace_contract?.feature_flags ?? null;
  const cutoverDecision = resolveProductExperienceCutoverDecision({
    workspaceFlags,
    workspaceId: snapshot?.session.workspace_id ?? null,
  });

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

  const activeProduct = productSection ?? "work";
  const operationAction = effectiveStage === "discover" ? discoverAction : stageAction;

  return (
    <ProjectWorkspaceShell
      activeProduct={activeProduct}
      activeRoute={activeRoute}
      activeStage={effectiveStage}
      attentionAction={attentionAction}
      onResolveAttentionItem={resolveAttentionItem}
      onReload={() => void reload()}
      operationAction={operationAction}
      sessionId={sessionId}
    >
      <ProductExperienceCutoverTelemetry
        decision={cutoverDecision}
        routeKey={`${activeProduct}:${effectiveStage}`}
        sessionId={sessionId}
      />
      {productSection === "attention" ? (
        <AttentionInboxView
          actionState={attentionAction}
          activeRoute={activeRoute}
          currentStage={effectiveStage}
          onResolveItem={resolveAttentionItem}
        />
      ) : productSection === "diagrams" ? (
        <DiagramCenterPage projectId={sessionId} />
      ) : productSection && productSection !== "work" ? (
        <ProductSaasView activeRoute={activeRoute} section={productSection} />
      ) : stage === "discover" ? (
        <DiscoverStageView
          actionState={discoverAction}
          actions={discoverActions}
          activeRoute={activeRoute}
        />
      ) : stage === "define" ? (
        <DefineStageView
          actionState={stageAction}
          actions={stageActions}
          activeRoute={activeRoute}
        />
      ) : stage === "design" ? (
        <DesignStageView
          actionState={stageAction}
          actions={stageActions}
          activeRoute={activeRoute}
        />
      ) : stage === "tools" ? (
        <ToolsStageView
          actionState={stageAction}
          actions={stageActions}
          activeRoute={activeRoute}
        />
      ) : stage === "memory" ? (
        <MemoryStageView
          actionState={stageAction}
          actions={stageActions}
          activeRoute={activeRoute}
        />
      ) : stage === "estimate" ? (
        <EstimateStageView activeRoute={activeRoute} />
      ) : stage === "validate" ? (
        <ValidateStageView activeRoute={activeRoute} />
      ) : stage === "package" ? (
        <PackageStageView activeRoute={activeRoute} />
      ) : (
        <EstimateStageView activeRoute={activeRoute} />
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
