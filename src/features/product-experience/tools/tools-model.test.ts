import {
  buildToolsDecisions,
  buildToolsViewModel,
} from "@/features/product-experience/tools/tools-model";
import {
  createApprovedToolsDigest,
  createToolRecommendationPayload,
  createToolsArtifactFixture,
  createToolsRouteFixture,
} from "@/features/product-experience/tools/tools-memory-test-fixtures";

describe("Tools model UXA9", () => {
  it("builds a promotable tools recommendation when Design is approved", () => {
    const route = createToolsRouteFixture();
    const viewModel = buildToolsViewModel(route);

    expect(viewModel.status).toBe("waiting_review");
    expect(viewModel.canPromote).toBe(true);
    expect(viewModel.recommendedTools.map((tool) => tool.tool_key)).toContain("knowledge_retrieval");
    expect(viewModel.optionalTools.map((tool) => tool.tool_key)).toContain("document_ingestion");
  });

  it("moves gaps, findings and needs information into a decisions queue", () => {
    const recommendation = createToolRecommendationPayload({
      coverage_gaps: [
        {
          gap_key: "gap-1",
          impact: "Sin tool no hay cobertura.",
          question: "Confirmar fuente.",
          reason: "Falta owner.",
          severity: "blocking",
          title: "Fuente pendiente",
        },
      ],
      needs_information: [
        {
          gap_key: "need-1",
          impact: "No bloquea MVP.",
          question: "Indicar frecuencia.",
          reason: "Mejora refresh.",
          severity: "warning",
          title: "Refresh",
        },
      ],
    });

    const decisions = buildToolsDecisions(recommendation);

    expect(decisions).toHaveLength(2);
    expect(decisions[0].mode).toBe("enrichment");
    expect(decisions[1].mode).toBe("enrichment");
  });

  it("consolidates repeated Tools gaps and findings with one unique React key", () => {
    const recommendation = createToolRecommendationPayload({
      coverage_gaps: [
        {
          gap_key: "gap-owner",
          impact: "Sin owner no hay trazabilidad.",
          question: "Confirmar owner de datos.",
          reason: "Falta owner de datos.",
          severity: "warning",
          title: "Owner pendiente",
        },
      ],
      needs_information: [
        {
          gap_key: "need-owner-context",
          impact: "Mejora la precision.",
          question: "Confirmar owner de datos",
          reason: "Falta owner de datos",
          severity: "warning",
          title: "Owner pendiente.",
        },
      ],
      evaluation: {
        ...createToolRecommendationPayload().evaluation,
        findings: [
          {
            affected_tool_keys: ["knowledge_retrieval"],
            category: "governance",
            detail: "Falta owner de datos.",
            finding_key: "finding-owner",
            severity: "warning",
            suggested_action: "Confirmar owner de datos.",
            title: "Owner pendiente",
          },
        ],
      },
    });

    const decisions = buildToolsDecisions(recommendation);

    expect(decisions).toHaveLength(1);
    expect(decisions[0].key).toMatch(/^decision:/);
    expect(decisions[0].occurrenceCount).toBe(3);
    expect(decisions[0].sourceReferences.map((reference) => reference.source).sort()).toEqual([
      "finding",
      "gap",
      "needs_information",
    ]);
    expect(new Set(decisions.map((item) => item.key)).size).toBe(decisions.length);
  });

  it("keeps Basic Blueprint promotable when gaps are registered as assumptions", () => {
    const base = createToolRecommendationPayload();
    const recommendation = createToolRecommendationPayload({
      coverage_gaps: [
        {
          gap_key: "gap-basic",
          impact: "Mejora la precision premium.",
          question: "Confirmar owner de datos.",
          reason: "Se puede inferir para Basic.",
          severity: "blocking",
          title: "Owner pendiente",
        },
      ],
      evaluation: {
        ...base.evaluation,
        promotion_blocked: true,
      },
    });
    const route = createToolsRouteFixture({
      toolsArtifact: createToolsArtifactFixture({
        proposal_payload: recommendation as unknown as Record<string, unknown>,
      }),
    });
    route.snapshot.data!.session.commercial_tier = "blueprint";

    const viewModel = buildToolsViewModel(route);

    expect(viewModel.commercialTier).toBe("blueprint");
    expect(viewModel.canPromote).toBe(true);
    expect(viewModel.decisions[0].mode).toBe("enrichment");
  });

  it("keeps Blueprint Pro blocked when promotion requires user closure", () => {
    const base = createToolRecommendationPayload();
    const recommendation = createToolRecommendationPayload({
      coverage_gaps: [
        {
          gap_key: "gap-pro",
          impact: "El documento premium queda incompleto.",
          question: "Confirmar owner de datos.",
          reason: "Premium requiere cerrar la decision.",
          severity: "blocking",
          title: "Owner pendiente",
        },
      ],
      evaluation: {
        ...base.evaluation,
        promotion_blocked: true,
      },
    });
    const route = createToolsRouteFixture({
      toolsArtifact: createToolsArtifactFixture({
        proposal_payload: recommendation as unknown as Record<string, unknown>,
      }),
    });
    route.snapshot.data!.session.commercial_tier = "blueprint_pro";

    const viewModel = buildToolsViewModel(route);

    expect(viewModel.commercialTier).toBe("blueprint_pro");
    expect(viewModel.canPromote).toBe(false);
    expect(viewModel.decisions[0].mode).toBe("blocker");
  });

  it("marks Tools stale and blocks promotion when the artifact is stale", () => {
    const route = createToolsRouteFixture({
      toolsArtifact: createToolsArtifactFixture({
        stale_at: "2026-08-03T13:00:00Z",
        stale_reasons: ["Design cambio despues de recomendar tools."],
        state: "stale",
      }),
    });
    const viewModel = buildToolsViewModel(route);

    expect(viewModel.status).toBe("stale");
    expect(viewModel.canPromote).toBe(false);
    expect(viewModel.recommendation).toBeNull();
    expect(viewModel.decisions).toHaveLength(0);
  });

  it("keeps approved Tools ready for Memory when a digest exists", () => {
    const approvedPayload = createToolRecommendationPayload({
      approved_tools_digest: createApprovedToolsDigest(),
    });
    const route = createToolsRouteFixture({
      toolsArtifact: createToolsArtifactFixture({
        proposal_payload: approvedPayload as unknown as Record<string, unknown>,
        state: "approved",
      }),
    });

    expect(buildToolsViewModel(route).status).toBe("approved");
  });
});
