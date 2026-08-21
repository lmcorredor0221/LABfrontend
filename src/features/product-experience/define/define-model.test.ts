import {
  buildDefineViewModel,
  deriveDefinitionValidation,
  setOpenQuestionStatus,
} from "@/features/product-experience/define/define-model";
import {
  createDefineArtifactFixture,
  createDefineRouteFixture,
  createDefinitionArtifactPayload,
} from "@/features/product-experience/define/define-test-fixtures";
import { createDiscoverArtifactFixture } from "@/features/product-experience/discover/discover-test-fixtures";

describe("Define model UXA8", () => {
  it("builds a reviewable definition when Discover is approved", () => {
    const route = createDefineRouteFixture();
    const viewModel = buildDefineViewModel(route);

    expect(viewModel.status).toBe("waiting_review");
    expect(viewModel.discoveryApproved).toBe(true);
    expect(viewModel.canApprove).toBe(true);
    expect(viewModel.totalRequirementCount).toBeGreaterThan(0);
    expect(viewModel.sections.find((section) => section.key === "requirements")?.count).toBe(1);
  });

  it("keeps basic Blueprint questions as traceability instead of task actions", () => {
    const route = createDefineRouteFixture();
    const viewModel = buildDefineViewModel(route);

    expect(viewModel.traceableOpenQuestions).toHaveLength(1);
    expect(viewModel.actionableOpenQuestions).toEqual([]);
    expect(viewModel.sections.find((section) => section.key === "questions")?.count).toBe(0);
  });

  it("surfaces unresolved Define questions as task actions for Premium", () => {
    const route = createDefineRouteFixture();
    route.snapshot.data!.session.commercial_tier = "blueprint_pro";
    const viewModel = buildDefineViewModel(route);

    expect(viewModel.traceableOpenQuestions).toHaveLength(1);
    expect(viewModel.actionableOpenQuestions).toHaveLength(1);
    expect(viewModel.sections.find((section) => section.key === "questions")?.count).toBe(1);
  });

  it("marks Define stale when the approved Discover artifact is stale", () => {
    const route = createDefineRouteFixture({
      discoverArtifact: createDiscoverArtifactFixture({
        stale_at: "2026-08-03T11:00:00Z",
        stale_reasons: ["Discovery cambio despues de Definir."],
        state: "approved",
      }),
    });

    const viewModel = buildDefineViewModel(route);
    expect(viewModel.status).toBe("stale");
    expect(viewModel.definition).toBeNull();
    expect(viewModel.totalRequirementCount).toBe(0);
  });

  it("blocks approval for unresolved blocking questions and unlocks when resolved", () => {
    const definition = createDefinitionArtifactPayload();
    definition.open_questions = [
      {
        ...definition.open_questions[0],
        blocking: true,
        key: "Q-BLOCK",
        status: "needs_input",
      },
    ];
    const validation = deriveDefinitionValidation(definition);

    expect(validation.blocking_open_questions).toEqual(["Q-BLOCK"]);
    expect(validation.blocking_issues.length).toBeGreaterThan(0);

    const resolved = setOpenQuestionStatus(definition, "Q-BLOCK", "accepted");
    expect(deriveDefinitionValidation(resolved).blocking_open_questions).toEqual([]);
  });

  it("allows Basic Blueprint approval while deferring Define quality blockers", () => {
    const issues = ["untraced_item:NFR-01", "vague_nfr:NFR-02"];
    const definition = createDefinitionArtifactPayload();
    definition.validation = {
      ...definition.validation,
      blocking_issues: issues,
    };
    const route = createDefineRouteFixture({
      defineArtifact: createDefineArtifactFixture({
        proposal_payload: definition as unknown as Record<string, unknown>,
      }),
    });

    const viewModel = buildDefineViewModel(route);

    expect(viewModel.canApprove).toBe(true);
    expect(viewModel.approvalBlockingIssues).toEqual([]);
    expect(viewModel.deferredQualityIssues).toEqual(issues);
  });

  it("keeps Premium Define approval strict for quality blockers", () => {
    const issues = ["untraced_item:NFR-01", "vague_nfr:NFR-02"];
    const definition = createDefinitionArtifactPayload();
    definition.validation = {
      ...definition.validation,
      blocking_issues: issues,
    };
    const route = createDefineRouteFixture({
      defineArtifact: createDefineArtifactFixture({
        proposal_payload: definition as unknown as Record<string, unknown>,
      }),
    });
    route.snapshot.data!.session.commercial_tier = "blueprint_pro";

    const viewModel = buildDefineViewModel(route);

    expect(viewModel.canApprove).toBe(false);
    expect(viewModel.approvalBlockingIssues).toEqual(issues);
    expect(viewModel.deferredQualityIssues).toEqual([]);
  });

  it("keeps approved Define ready to enable Design", () => {
    const route = createDefineRouteFixture({
      defineArtifact: createDefineArtifactFixture({ state: "approved" }),
    });

    const viewModel = buildDefineViewModel(route);
    expect(viewModel.status).toBe("approved");
    expect(viewModel.canGenerate).toBe(true);
  });
});
