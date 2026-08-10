import type {
  AgentConstructionPackageV2,
  BlueprintCoreV1,
  CanonicalContractKind,
  CanonicalContractMap,
  CanonicalExportPreviewState,
  ConstructionPackV1,
  EstimationPackV1,
  PromptPackV1,
  TestPackV1,
} from "@/features/contracts/canonical-contracts";
import {
  CANONICAL_CONTRACT_VERSIONS,
  REQUIRED_FIELDS_BY_CONTRACT,
  SPECIALIZED_CONTRACT_VERSIONS,
} from "@/features/contracts/canonical-contracts";

export type CanonicalValidationIssue = {
  code: string;
  message: string;
  path: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getSchemaVersion(kind: CanonicalContractKind) {
  return kind;
}

export function validateCanonicalContractPayload(
  kind: CanonicalContractKind,
  payload: unknown,
): CanonicalValidationIssue[] {
  if (!isRecord(payload)) {
    return [
      {
        code: "type_error",
        message: "El payload debe ser un objeto.",
        path: "",
      },
    ];
  }

  const issues: CanonicalValidationIssue[] = [];
  for (const field of REQUIRED_FIELDS_BY_CONTRACT[kind]) {
    if (!(field in payload)) {
      issues.push({
        code: "missing",
        message: `Falta el campo requerido '${field}'.`,
        path: field,
      });
    }
  }

  const schemaVersion = payload.schema_version;
  if (schemaVersion !== undefined && schemaVersion !== getSchemaVersion(kind)) {
    issues.push({
      code: "invalid_schema_version",
      message: `Se esperaba '${kind}' pero llego '${String(schemaVersion)}'.`,
      path: "schema_version",
    });
  }

  if (kind === CANONICAL_CONTRACT_VERSIONS.promptPack && isRecord(payload.origin)) {
    if (payload.origin.blueprint_core_version !== CANONICAL_CONTRACT_VERSIONS.blueprintCore) {
      issues.push({
        code: "invalid_origin_version",
        message: "El prompt pack no referencia la version esperada de blueprint core.",
        path: "origin.blueprint_core_version",
      });
    }
    if (payload.origin.behavior_spec_version !== SPECIALIZED_CONTRACT_VERSIONS.behaviorSpec) {
      issues.push({
        code: "invalid_origin_version",
        message: "El prompt pack no referencia la version esperada de behavior spec.",
        path: "origin.behavior_spec_version",
      });
    }
    if (payload.origin.llm_policy_version !== SPECIALIZED_CONTRACT_VERSIONS.llmPolicy) {
      issues.push({
        code: "invalid_origin_version",
        message: "El prompt pack no referencia la version esperada de llm policy.",
        path: "origin.llm_policy_version",
      });
    }
  }

  return issues;
}

export function buildCanonicalExportPreview<K extends CanonicalContractKind>(
  kind: K,
  contract: CanonicalContractMap[K],
): CanonicalExportPreviewState {
  if (kind === CANONICAL_CONTRACT_VERSIONS.blueprintCore) {
    const blueprint = contract as BlueprintCoreV1;
    return {
      generatedAt: blueprint.generated_at,
      kind,
      readinessLabel: `${blueprint.success_criteria.length} success criteria`,
      schemaVersion: blueprint.schema_version,
      sourceBlueprintVersion: blueprint.source_blueprint_version,
      sourceSessionId: blueprint.source_session_id,
      title: blueprint.identity.title,
    };
  }

  if (kind === CANONICAL_CONTRACT_VERSIONS.constructionPack) {
    const pack = contract as ConstructionPackV1;
    return {
      generatedAt: pack.generated_at,
      kind,
      readinessLabel: pack.readiness.status,
      schemaVersion: pack.schema_version,
      sourceBlueprintVersion: pack.source_blueprint_version,
      sourceSessionId: pack.source_session_id,
      title: `Construction pack (${pack.components.length} componentes)`,
    };
  }

  if (kind === CANONICAL_CONTRACT_VERSIONS.agentConstructionPackage) {
    const pack = contract as AgentConstructionPackageV2;
    return {
      generatedAt: pack.generated_at,
      kind,
      readinessLabel: `${pack.capability_catalog.length} capacidades / ${pack.tool_bindings.length} bindings / ${pack.memory_knowledge_plan.namespaces.length} namespaces`,
      schemaVersion: pack.schema_version,
      sourceBlueprintVersion: pack.source_blueprint_version,
      sourceSessionId: pack.source_session_id,
      title: `ACP Portable v2 (${pack.compatibility.length} targets)`,
    };
  }

  if (kind === CANONICAL_CONTRACT_VERSIONS.promptPack) {
    const pack = contract as PromptPackV1;
    return {
      generatedAt: pack.generated_at,
      kind,
      readinessLabel: `${pack.origin.input_hash.slice(0, 8)} input hash`,
      schemaVersion: pack.schema_version,
      sourceBlueprintVersion: pack.source_blueprint_version,
      sourceSessionId: pack.source_session_id,
      title: "Prompt pack por rol",
    };
  }

  if (kind === CANONICAL_CONTRACT_VERSIONS.testPack) {
    const testPack = contract as TestPackV1;
    return {
      generatedAt: testPack.generated_at,
      kind,
      readinessLabel: `${testPack.commands.length} commands`,
      schemaVersion: testPack.schema_version,
      sourceBlueprintVersion: testPack.source_blueprint_version,
      sourceSessionId: testPack.source_session_id,
      title: `Test pack ${testPack.framework_target}`,
    };
  }

  const pack = contract as EstimationPackV1;
  return {
    generatedAt: pack.generated_at,
    kind,
    readinessLabel: pack.confidence.label,
    schemaVersion: pack.schema_version,
    sourceBlueprintVersion: pack.source_blueprint_version,
    sourceSessionId: pack.source_session_id,
    title: `Estimacion ${pack.maturity_stage}`,
  };
}
