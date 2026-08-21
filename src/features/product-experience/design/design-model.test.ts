import {
  applySelectedAlternative,
  buildDesignViewModel,
  calculateDesignMaturityScore,
  explainRuntimeWarning,
  getSelectedAlternative,
  normalizePercentScore,
} from "@/features/product-experience/design/design-model";
import {
  createDefineArtifactFixture,
  createDefineRouteFixture,
  createDesignArtifactFixture,
  createDesignArtifactPayload,
} from "@/features/product-experience/define/define-test-fixtures";

describe("Design model UXA8", () => {
  it("normalizes fit scores whether the backend sends 0-1 or 0-100 scale", () => {
    expect(normalizePercentScore(0.86)).toBe(86);
    expect(normalizePercentScore(86)).toBe(86);
    expect(normalizePercentScore(8600)).toBe(100);
  });

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
    expect(viewModel.maturityScore).toBeGreaterThan(80);
    expect(viewModel.maturityScore).toBeLessThanOrEqual(100);
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

  it("defers Design questions in Basic Blueprint without blocking approval", () => {
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
    expect(viewModel.openIssueCount).toBe(0);
    expect(viewModel.deferredIssueCount).toBe(1);
    expect(viewModel.canApprove).toBe(true);
    expect(viewModel.readiness.find((item) => item.key === "questions")).toMatchObject({
      label: "Preguntas diferidas para Premium",
      state: "pending",
    });
  });

  it("does not treat Basic Blueprint enrichment backlog as low design sufficiency", () => {
    const design = createDesignArtifactPayload();
    design.open_questions = Array.from({ length: 5 }, (_, index) => `Pregunta diferida ${index + 1}`);
    design.missing_information = Array.from({ length: 3 }, (_, index) => `Dato diferido ${index + 1}`);

    const route = createDefineRouteFixture({
      defineArtifact: createDefineArtifactFixture({ state: "approved" }),
      designArtifact: createDesignArtifactFixture({
        proposal_payload: design as unknown as Record<string, unknown>,
      }),
      stage: "design",
    });

    const viewModel = buildDesignViewModel(route);
    expect(viewModel.deferredIssueCount).toBe(8);
    expect(viewModel.openIssueCount).toBe(0);
    expect(viewModel.canApprove).toBe(true);
    expect(viewModel.maturityScore).toBeGreaterThanOrEqual(80);
  });

  it("tracks selected alternative and disables Premium approval when open issues exist", () => {
    const design = createDesignArtifactPayload();
    const selected = applySelectedAlternative(design, "multi_agent");
    selected.open_questions = ["Confirmar ownership de arquitectura."];
    const route = createDefineRouteFixture({
      defineArtifact: createDefineArtifactFixture({ state: "approved" }),
      designArtifact: createDesignArtifactFixture({
        proposal_payload: selected as unknown as Record<string, unknown>,
      }),
      stage: "design",
    });
    route.snapshot.data!.session.commercial_tier = "blueprint_pro";

    const viewModel = buildDesignViewModel(route);
    expect(viewModel.openIssueCount).toBe(1);
    expect(viewModel.deferredIssueCount).toBe(0);
    expect(viewModel.canApprove).toBe(false);
    expect(viewModel.readiness.find((item) => item.key === "questions")).toMatchObject({
      label: "Preguntas abiertas para Atencion",
      state: "blocked",
    });
  });

  it("calculates Design maturity from coverage, fit and confidence instead of status constants", () => {
    const design = createDesignArtifactPayload();
    design.confidence.overall = 0.72;
    design.alternatives[0]!.fit_score = 80;
    design.fit_matrix[0]!.scores[0]!.score = 86;
    const selected = getSelectedAlternative(design, "rag_supervisor");

    const maturity = calculateDesignMaturityScore({
      approvalBlockingIssueCount: 0,
      commercialTier: "blueprint_pro",
      deferredIssueCount: 1,
      design,
      selectedAlternative: selected,
      status: "waiting_review",
    });

    expect(maturity).toBeGreaterThan(75);
    expect(maturity).toBeLessThanOrEqual(100);
  });

  it("explains Codex runtime warnings without exposing policy text as the main message", () => {
    const warning = explainRuntimeWarning("Codex local no pudo ejecutar propose_agent_design; policy=blocked_until_critique_or_user_review.");

    expect(warning.title).toBe("Operacion LLM local con recuperacion");
    expect(warning.summary).toContain("Codex local no completo generar la propuesta de Disenar");
    expect(warning.technicalMessage).toContain("policy=blocked_until_critique_or_user_review");
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
