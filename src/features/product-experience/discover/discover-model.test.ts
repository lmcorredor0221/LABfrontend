import {
  buildDiscoverViewModel,
  getDiscoverPrimaryAction,
} from "@/features/product-experience/discover/discover-model";
import {
  createDiscoverArtifactFixture,
  createDiscoverRouteFixture,
} from "@/features/product-experience/discover/discover-test-fixtures";

describe("Discover UXA7 view model", () => {
  it("parses analysis artifacts and review decisions without legacy UI", () => {
    const viewModel = buildDiscoverViewModel(createDiscoverRouteFixture());

    expect(viewModel.status).toBe("waiting_review");
    expect(viewModel.completionPercent).toBe(100);
    expect(viewModel.analysisArtifact?.summary).toBe("Discovery consistente para construir Definir.");
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
});
