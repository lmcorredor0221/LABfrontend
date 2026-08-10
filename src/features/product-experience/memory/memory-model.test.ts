import {
  buildMemoryViewModel,
  buildRagDependencyBlockers,
} from "@/features/product-experience/memory/memory-model";
import {
  createApprovedToolsDigest,
  createMemoryArtifactFixture,
  createMemoryRecommendationPayload,
  createToolsArtifactFixture,
  createToolsRouteFixture,
  createToolRecommendationPayload,
} from "@/features/product-experience/tools/tools-memory-test-fixtures";

describe("Memory model UXA9", () => {
  it("builds an approvable memory recommendation when Tools digest supports RAG", () => {
    const route = createToolsRouteFixture({
      memoryArtifact: createMemoryArtifactFixture(),
      toolsArtifact: createToolsArtifactFixture({
        proposal_payload: createToolRecommendationPayload({ approved_tools_digest: createApprovedToolsDigest() }) as unknown as Record<string, unknown>,
        state: "approved",
      }),
      stage: "memory",
    });
    const viewModel = buildMemoryViewModel(route);

    expect(viewModel.status).toBe("waiting_review");
    expect(viewModel.canApprove).toBe(true);
    expect(viewModel.memory?.knowledge_design.rag_required).toBe(true);
  });

  it("blocks Memory when Tools has not been promoted", () => {
    const route = createToolsRouteFixture({
      memoryArtifact: createMemoryArtifactFixture(),
      stage: "memory",
    });
    const viewModel = buildMemoryViewModel(route);

    expect(viewModel.status).toBe("blocked");
    expect(viewModel.blockers.map((item) => item.key)).toContain("tools_digest_required");
  });

  it("keeps document ingestion as a transversal RAG dependency", () => {
    const blockers = buildRagDependencyBlockers(
      createMemoryRecommendationPayload(),
      createApprovedToolsDigest({
        approved_tool_keys: ["knowledge_retrieval"],
        optional_tool_keys: [],
        selected_blueprint_tool_names: ["Knowledge Retrieval"],
        tool_count: 1,
      }),
    );

    expect(blockers.map((item) => item.key)).toContain("document_ingestion_missing");
  });

  it("does not approve stale Memory", () => {
    const route = createToolsRouteFixture({
      memoryArtifact: createMemoryArtifactFixture({
        stale_at: "2026-08-03T13:00:00Z",
        stale_reasons: ["Tools cambio despues de recomendar memoria."],
        state: "stale",
      }),
      toolsArtifact: createToolsArtifactFixture({
        proposal_payload: createToolRecommendationPayload({ approved_tools_digest: createApprovedToolsDigest() }) as unknown as Record<string, unknown>,
        state: "approved",
      }),
      stage: "memory",
    });
    const viewModel = buildMemoryViewModel(route);

    expect(viewModel.status).toBe("stale");
    expect(viewModel.canApprove).toBe(false);
    expect(viewModel.memory).toBeNull();
    expect(viewModel.blockers.map((item) => item.key)).toContain("memory_stale");
  });
});
