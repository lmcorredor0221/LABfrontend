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

    expect(buildToolsDecisions(recommendation)).toHaveLength(2);
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
