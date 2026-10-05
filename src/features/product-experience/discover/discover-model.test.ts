import {
  buildDiscoverViewModel,
  getDiscoverPrimaryAction,
} from "@/features/product-experience/discover/discover-model";
import {
  createAnalysisFixture,
  createDiscoverArtifactFixture,
  createDiscoveryFixture,
  createDiscoverRouteFixture,
} from "@/features/product-experience/discover/discover-test-fixtures";

describe("Discover UXA7 view model", () => {
  it("parses analysis artifacts and review decisions without legacy UI", () => {
    const viewModel = buildDiscoverViewModel(createDiscoverRouteFixture());

    expect(viewModel.status).toBe("waiting_review");
    expect(viewModel.completionPercent).toBe(100);
    expect(viewModel.analysisArtifact?.summary).toBe("Discovery consistente para construir Definir.");
    expect(viewModel.qualityConfidence).toBe(0.85);
    expect(viewModel.evidenceConfidence).toBe(0.73);
    expect(viewModel.delegatedPendingCount).toBe(1);
    expect(viewModel.blockingPendingCount).toBe(0);
    expect(viewModel.deferredResolutionItems).toHaveLength(1);
    expect(viewModel.reviewDecisions["question:q1"]).toBe("accepted");
    expect(getDiscoverPrimaryAction(viewModel).kind).toBe("approve");
  });

  it("marks approved discovery as stale when the user edits locally", () => {
    const viewModel = buildDiscoverViewModel(createDiscoverRouteFixture({
      artifact: createDiscoverArtifactFixture({ state: "approved" }),
    }), { dirty: true });

    expect(viewModel.status).toBe("stale");
    expect(getDiscoverPrimaryAction(viewModel, true).kind).toBe("analyze");
  });

  it("uses generated discovery analysis even when the canonical latest artifact is legacy approved", () => {
    const discovery = createDiscoveryFixture();
    const legacyArtifact = createDiscoverArtifactFixture({
      artifact_kind: "discovery_artifact",
      proposal_payload: discovery as unknown as Record<string, unknown>,
      schema_version: "journey-stage-artifact.v1",
      state: "approved_legacy",
      version_number: 1,
    });
    const analysisArtifact = createDiscoverArtifactFixture({
      id: "discover-analysis-2",
      proposal_payload: createAnalysisFixture(discovery) as unknown as Record<string, unknown>,
      state: "generated",
      version_number: 2,
    });
    const route = createDiscoverRouteFixture({
      artifact: legacyArtifact,
      discovery,
    });

    if (route.snapshot.data) {
      route.snapshot.data.journey_artifacts = [analysisArtifact, legacyArtifact];
      route.snapshot.data.journey_latest_artifacts = { discover: legacyArtifact };
    }

    const viewModel = buildDiscoverViewModel(route);

    expect(viewModel.latestArtifact?.id).toBe("discover-analysis-2");
    expect(viewModel.analysisArtifact?.summary).toBe("Discovery consistente para construir Definir.");
    expect(viewModel.status).toBe("waiting_review");
    expect(getDiscoverPrimaryAction(viewModel).kind).toBe("approve");
  });
});
