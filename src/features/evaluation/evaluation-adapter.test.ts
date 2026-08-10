import {
  buildDatasetPayload,
  buildRubricPayload,
  createBlankDatasetCase,
  createBlankRubricDimension,
  getDatasetValidationIssues,
  getRubricValidationIssues,
} from "@/features/evaluation/evaluation-adapter";

describe("evaluation adapter", () => {
  it("validates dataset required fields and duplicate case keys", () => {
    const issues = getDatasetValidationIssues({
      cases: [
        createBlankDatasetCase("case-a"),
        {
          ...createBlankDatasetCase("case-a"),
          title: "Caso repetido",
        },
      ],
    });

    expect(issues.map((item) => item.field)).toEqual(
      expect.arrayContaining(["title", "scenario", "expectedResult", "caseKey_duplicate"]),
    );
  });

  it("validates rubric summary, duplicate keys, and total weight", () => {
    const issues = getRubricValidationIssues({
      dimensions: [
        {
          ...createBlankRubricDimension("quality"),
          description: "Valida la calidad",
          key: "quality",
          label: "Quality",
          weight: 60,
        },
        {
          ...createBlankRubricDimension("quality"),
          description: "Valida consistencia",
          key: "quality",
          label: "Consistency",
          weight: 20,
        },
      ],
      summary: "",
    });

    expect(issues.map((item) => item.field)).toEqual(
      expect.arrayContaining(["summary", "key_duplicate", "weight_total"]),
    );
  });

  it("builds trimmed dataset and rubric payloads", () => {
    const datasetPayload = buildDatasetPayload({
      cases: [
        {
          caseKey: "  case-1  ",
          category: "  journey  ",
          expectedResult: "  responder bien  ",
          isActive: true,
          localId: "case-1",
          priority: "  core  ",
          scenario: "  usuario pregunta  ",
          source: "  manual  ",
          title: "  Caso 1  ",
        },
      ],
    });

    const rubricPayload = buildRubricPayload({
      dimensions: [
        {
          description: "  valida claridad  ",
          hardBlock: true,
          key: "  clarity  ",
          label: "  Claridad  ",
          localId: "clarity",
          weight: 100,
        },
      ],
      summary: "  Rubrica principal  ",
    });

    expect(datasetPayload.cases[0]).toMatchObject({
      case_key: "case-1",
      category: "journey",
      expected_result: "responder bien",
      priority: "core",
      scenario: "usuario pregunta",
      source: "manual",
      title: "Caso 1",
    });
    expect(rubricPayload).toMatchObject({
      summary: "Rubrica principal",
      dimensions: [
        {
          description: "valida claridad",
          hard_block: true,
          key: "clarity",
          label: "Claridad",
          weight: 100,
        },
      ],
    });
  });
});
