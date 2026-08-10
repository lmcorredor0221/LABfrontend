"use client";

import type { ProjectRouteStage } from "@/core/routing/routes";
import { AttentionInboxView } from "@/features/product-experience/attention/attention-components";
import type { ProductExperienceRouteSnapshot } from "@/features/product-experience/core/server-state";
import { DesignStageView } from "@/features/product-experience/design/design-stage-view";
import {
  createDefineArtifactFixture,
  createDefineRouteFixture,
  createDesignArtifactFixture,
} from "@/features/product-experience/define/define-test-fixtures";
import { DefineStageView } from "@/features/product-experience/define/define-stage-view";
import { createDiscoverRouteFixture } from "@/features/product-experience/discover/discover-test-fixtures";
import { DiscoverStageView } from "@/features/product-experience/discover/discover-stage-view";
import { MemoryStageView } from "@/features/product-experience/memory/memory-stage-view";
import { ProductSaasView } from "@/features/product-experience/saas/saas-product-views";
import { EstimateStageView, PackageStageView, ValidateStageView } from "@/features/product-experience/saas/saas-stage-views";
import {
  getProductStageForSection,
  type ProductExperienceProductSection,
} from "@/features/product-experience/shell/experience-model";
import { ProjectWorkspaceShell } from "@/features/product-experience/shell/project-workspace-shell";
import {
  createMemoryArtifactFixture,
  createToolsArtifactFixture,
  createToolsRouteFixture,
} from "@/features/product-experience/tools/tools-memory-test-fixtures";
import { ToolsStageView } from "@/features/product-experience/tools/tools-stage-view";

export const ENTERPRISE_CORPORATE_FIXTURE_ID = "enterprise-theme-fixture";

type EnterpriseCorporateProjectFixtureProps = {
  productSection?: ProductExperienceProductSection | null;
  section?: string | null;
  sessionId: string;
  stage: ProjectRouteStage;
};

function normalizeFixtureRoute(
  route: ProductExperienceRouteSnapshot,
  stage: ProjectRouteStage,
): ProductExperienceRouteSnapshot {
  const snapshot = route.snapshot.data;
  const attention = route.attention.data;
  const operation = route.operation.data;
  const projectTitle = "Proyecto Enterprise Corporate";

  return {
    ...route,
    attention: {
      ...route.attention,
      data: attention ? {
        ...attention,
        current_stage: stage,
        session_id: ENTERPRISE_CORPORATE_FIXTURE_ID,
      } : attention,
    },
    list: {
      ...route.list,
      data: route.list.data ? {
        ...route.list.data,
        items: route.list.data.items.map((item) => ({
          ...item,
          id: ENTERPRISE_CORPORATE_FIXTURE_ID,
          title: projectTitle,
        })),
      } : route.list.data,
    },
    operation: {
      ...route.operation,
      data: operation ? {
        ...operation,
        overview: operation.overview ? {
          ...operation.overview,
          active_stage: stage,
          project_title: projectTitle,
          session_id: ENTERPRISE_CORPORATE_FIXTURE_ID,
        } : operation.overview,
      } : operation,
    },
    route: {
      currentStage: stage,
      sessionId: ENTERPRISE_CORPORATE_FIXTURE_ID,
    },
    snapshot: {
      ...route.snapshot,
      data: snapshot ? {
        ...snapshot,
        session: {
          ...snapshot.session,
          id: ENTERPRISE_CORPORATE_FIXTURE_ID,
          title: projectTitle,
        },
      } : snapshot,
    },
  };
}

function routeForStage(stage: ProjectRouteStage): ProductExperienceRouteSnapshot {
  if (stage === "discover") {
    return normalizeFixtureRoute(createDiscoverRouteFixture(), stage);
  }

  if (stage === "define" || stage === "design") {
    return normalizeFixtureRoute(createDefineRouteFixture({
      defineArtifact: createDefineArtifactFixture({ state: "approved" }),
      designArtifact: createDesignArtifactFixture(),
      stage,
    }), stage);
  }

  const route = createToolsRouteFixture({
    memoryArtifact: createMemoryArtifactFixture(),
    stage: stage === "memory" ? "memory" : "tools",
    toolsArtifact: createToolsArtifactFixture({ state: "approved" }),
  });
  return normalizeFixtureRoute(route, stage);
}

export function EnterpriseCorporateProjectFixture({
  productSection,
  stage,
}: EnterpriseCorporateProjectFixtureProps) {
  const activeProduct = productSection ?? "work";
  const effectiveStage = productSection && productSection !== "work" ? getProductStageForSection(productSection) : stage;
  const activeRoute = routeForStage(effectiveStage);

  return (
    <ProjectWorkspaceShell
      activeProduct={activeProduct}
      activeRoute={activeRoute}
      activeStage={effectiveStage}
      sessionId={ENTERPRISE_CORPORATE_FIXTURE_ID}
    >
      {productSection === "attention" ? (
        <AttentionInboxView activeRoute={activeRoute} currentStage={effectiveStage} />
      ) : productSection && productSection !== "work" ? (
        <ProductSaasView activeRoute={activeRoute} section={productSection} />
      ) : stage === "discover" ? (
        <DiscoverStageView activeRoute={activeRoute} />
      ) : stage === "define" ? (
        <DefineStageView activeRoute={activeRoute} />
      ) : stage === "design" ? (
        <DesignStageView activeRoute={activeRoute} />
      ) : stage === "tools" ? (
        <ToolsStageView activeRoute={activeRoute} />
      ) : stage === "memory" ? (
        <MemoryStageView activeRoute={activeRoute} />
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
