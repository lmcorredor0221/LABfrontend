import { getUniqueMessages, mergeUniqueMessages } from "@/shared/utils/unique-messages";

describe("unique messages helpers", () => {
  it("deduplicates messages while preserving first occurrence order", () => {
    expect(
      getUniqueMessages([
        "OpenAI no pudo normalizar discovery; se uso fallback deterministico.",
        "Hay approval gates pendientes antes de promover el blueprint a implementacion.",
        "OpenAI no pudo normalizar discovery; se uso fallback deterministico.",
      ]),
    ).toEqual([
      "OpenAI no pudo normalizar discovery; se uso fallback deterministico.",
      "Hay approval gates pendientes antes de promover el blueprint a implementacion.",
    ]);
  });

  it("ignores empty values and trims whitespace", () => {
    expect(getUniqueMessages(["", "  ", " Warning valida ", "Warning valida"])).toEqual(["Warning valida"]);
  });

  it("merges multiple groups without repeating messages", () => {
    expect(
      mergeUniqueMessages(
        ["Persisten elementos por revisar en el blueprint."],
        [
          "Hay approval gates pendientes antes de promover el blueprint a implementacion.",
          "Persisten elementos por revisar en el blueprint.",
        ],
      ),
    ).toEqual([
      "Persisten elementos por revisar en el blueprint.",
      "Hay approval gates pendientes antes de promover el blueprint a implementacion.",
    ]);
  });
});
