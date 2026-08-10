import {
  applySelectedAlternative,
  buildDesignViewModel,
  getSelectedAlternative,
} from "@/features/product-experience/design/design-model";
import {
  createDefineArtifactFixture,
  createDefineRouteFixture,
  createDesignArtifactFixture,
  createDesignArtifactPayload,
} from "@/features/product-experience/define/define-test-fixtures";

describe("Design model UXA8", () => {
  it("builds a reviewable comparator when Define is approved", () => {
    const route = createDefineRouteFixture({
      defineArtifact: createDefineArtifactFixture({ state: "approved" }),
      designArtifact: createDesignArtifactFixture(),
      stage: "design",
    });
    const viewModel = buildDesignViewModel(route);

    expect(viewModel.status).toBe("waiting_review");
    expect(viewModel.canApprove).toBe(true);
    expect(viewModel.recommendedAlternative?.alternative_key).toBe("rag_supervisor");
    expect(viewModel.sections.find((section) => section.key === "alternatives")?.count).toBe(2);
  });

  it("marks Design stale when Define is stale", () => {
    const route = createDefineRouteFixture({
      defineArtifact: createDefineArtifactFixture({
        stale_at: "2026-08-03T11:00:00Z",
        stale_reasons: ["Definir cambio despues de Disenar."],
        state: "approved",
      }),
      designArtifact: createDesignArtifactFixture(),
      stage: "design",
    });

    const viewModel = buildDesignViewModel(route);
    expect(viewModel.status).toBe("stale");
    expect(viewModel.design).toBeNull();
    expect(viewModel.recommendedAlternative).toBeNull();
    expect(viewModel.openIssueCount).toBe(0);
  });

  it("tracks selected alternative and disables approval when open issues exist", () => {
    const design = createDesignArtifactPayload();
    const selected = applySelectedAlternative(design, "multi_agent");
    expect(getSelectedAlternative(selected)?.alternative_key).toBe("multi_agent");

    selected.open_questions = ["Confirmar ownership de arquitectura."];
    const route = createDefineRouteFixture({
      defineArtifact: createDefineArtifactFixture({ state: "approved" }),
      designArtifact: createDesignArtifactFixture({
        proposal_payload: selected as unknown as Record<string, unknown>,
      }),
      stage: "design",
    });

    const viewModel = buildDesignViewModel(route);
    expect(viewModel.openIssueCount).toBe(1);
    expect(viewModel.canApprove).toBe(false);
  });

  it("keeps approved Design ready to enable Tools", () => {
    const route = createDefineRouteFixture({
      defineArtifact: createDefineArtifactFixture({ state: "approved" }),
      designArtifact: createDesignArtifactFixture({ state: "approved" }),
      stage: "design",
    });

    expect(buildDesignViewModel(route).status).toBe("approved");
  });
});
