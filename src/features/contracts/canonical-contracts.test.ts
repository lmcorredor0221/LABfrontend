import fs from "node:fs";
import path from "node:path";

import {
  CANONICAL_CONTRACT_VERSIONS,
  REQUIRED_FIELDS_BY_CONTRACT,
  SPECIALIZED_CONTRACT_VERSIONS,
  type CanonicalContractKind,
} from "@/features/contracts/canonical-contracts";
import {
  buildCanonicalExportPreview,
  validateCanonicalContractPayload,
} from "@/features/contracts/canonical-validation";

function repoRoot() {
  return path.resolve(__dirname, "../../../..");
}

function readJson(relativePath: string) {
  const filePath = path.join(repoRoot(), relativePath);
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

const STAGE_1_GOLDEN_CONTRACTS: CanonicalContractKind[] = [
  "blueprint-core.v1",
  "construction-pack.v1",
  "prompt-pack.v1",
  "estimation-pack.v1",
  "test-pack.v1",
];

describe("canonical contracts", () => {
  it("keeps frontend required fields aligned with the schema registry", () => {
    const registry = readJson("shared_specs/schemas/contract-registry.v1.json");
    const requiredByVersion = Object.fromEntries(
      registry.contracts.map((item: { required: string[]; schema_version: string }) => [item.schema_version, item.required]),
    ) as Record<CanonicalContractKind, string[]>;

    expect(requiredByVersion["blueprint-core.v1"]).toEqual(REQUIRED_FIELDS_BY_CONTRACT["blueprint-core.v1"]);
    expect(requiredByVersion["construction-pack.v1"]).toEqual(REQUIRED_FIELDS_BY_CONTRACT["construction-pack.v1"]);
    expect(requiredByVersion["agent-construction-package.v2"]).toEqual(
      REQUIRED_FIELDS_BY_CONTRACT["agent-construction-package.v2"],
    );
    expect(requiredByVersion["prompt-pack.v1"]).toEqual(REQUIRED_FIELDS_BY_CONTRACT["prompt-pack.v1"]);
    expect(requiredByVersion["estimation-pack.v1"]).toEqual(REQUIRED_FIELDS_BY_CONTRACT["estimation-pack.v1"]);
    expect(requiredByVersion["test-pack.v1"]).toEqual(REQUIRED_FIELDS_BY_CONTRACT["test-pack.v1"]);
  });

  it("validates generated stage-1 payloads without local drift", () => {
    const cases = ["01-copilot-simple", "02-agent-with-tools", "03-agent-with-knowledge-rag"];
    for (const caseKey of cases) {
      for (const contractKey of STAGE_1_GOLDEN_CONTRACTS) {
        const payload = readJson(
          `Docs/reingenieria-plataforma-2026-07-15/stage-1/golden/${caseKey}/${contractKey}.json`,
        );
        expect(validateCanonicalContractPayload(contractKey, payload)).toEqual([]);
      }
    }
  });

  it("builds compact previews from canonical contracts", () => {
    const blueprint = readJson(
      "Docs/reingenieria-plataforma-2026-07-15/stage-1/golden/01-copilot-simple/blueprint-core.v1.json",
    );
    const construction = readJson(
      "Docs/reingenieria-plataforma-2026-07-15/stage-1/golden/01-copilot-simple/construction-pack.v1.json",
    );
    const prompts = readJson(
      "Docs/reingenieria-plataforma-2026-07-15/stage-1/golden/01-copilot-simple/prompt-pack.v1.json",
    );
    const estimation = readJson(
      "Docs/reingenieria-plataforma-2026-07-15/stage-1/golden/01-copilot-simple/estimation-pack.v1.json",
    );
    const testPack = readJson(
      "Docs/reingenieria-plataforma-2026-07-15/stage-1/golden/01-copilot-simple/test-pack.v1.json",
    );
    const portableAcp = readJson("shared_specs/examples/agent-construction-package.v2.sample.json");

    expect(buildCanonicalExportPreview(CANONICAL_CONTRACT_VERSIONS.blueprintCore, blueprint).title).toBe(
      blueprint.identity.title,
    );
    expect(buildCanonicalExportPreview(CANONICAL_CONTRACT_VERSIONS.constructionPack, construction).readinessLabel).toBe(
      construction.readiness.status,
    );
    expect(
      buildCanonicalExportPreview(CANONICAL_CONTRACT_VERSIONS.agentConstructionPackage, portableAcp).readinessLabel,
    ).toContain("capacidades");
    expect(buildCanonicalExportPreview(CANONICAL_CONTRACT_VERSIONS.promptPack, prompts).readinessLabel).toContain(
      prompts.origin.input_hash.slice(0, 8),
    );
    expect(buildCanonicalExportPreview(CANONICAL_CONTRACT_VERSIONS.estimationPack, estimation).readinessLabel).toBe(
      estimation.confidence.label,
    );
    expect(buildCanonicalExportPreview(CANONICAL_CONTRACT_VERSIONS.testPack, testPack).readinessLabel).toBe(
      `${testPack.commands.length} commands`,
    );
  });

  it("flags version drift and missing required fields", () => {
    const issues = validateCanonicalContractPayload(CANONICAL_CONTRACT_VERSIONS.promptPack, {
      generated_at: "2026-07-16T00:00:00",
      origin: {
        behavior_spec_version: SPECIALIZED_CONTRACT_VERSIONS.behaviorSpec,
        blueprint_core_version: "blueprint-core.v0",
        heuristic_decision_version: SPECIALIZED_CONTRACT_VERSIONS.heuristicDecision,
        input_hash: "abc",
        llm_policy_version: SPECIALIZED_CONTRACT_VERSIONS.llmPolicy,
      },
      schema_version: CANONICAL_CONTRACT_VERSIONS.promptPack,
      source_session_id: "session-1",
    });

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "missing", path: "system_prompt" }),
        expect.objectContaining({ code: "invalid_origin_version", path: "origin.blueprint_core_version" }),
      ]),
    );
  });
});
