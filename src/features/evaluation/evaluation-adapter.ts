"use client";

import type {
  EvaluationDatasetArtifact,
  EvaluationDatasetCase,
  EvaluationDatasetUpdateRequest,
  EvaluationRubricArtifact,
  EvaluationRubricDimension,
  EvaluationRubricUpdateRequest,
} from "@/features/sessions/session-contracts";
import type { ArtifactStatus, SessionSnapshot } from "@/features/sessions/types";

export type EvaluationDatasetCaseFormValue = {
  caseKey: string;
  category: string;
  expectedResult: string;
  isActive: boolean;
  localId: string;
  priority: string;
  scenario: string;
  source: string;
  title: string;
};

export type EvaluationRubricDimensionFormValue = {
  description: string;
  hardBlock: boolean;
  key: string;
  label: string;
  localId: string;
  weight: number;
};

export type EvaluationDatasetFormValues = {
  cases: EvaluationDatasetCaseFormValue[];
};

export type EvaluationRubricFormValues = {
  dimensions: EvaluationRubricDimensionFormValue[];
  summary: string;
};

export type DatasetValidationIssue = {
  field:
    | "caseKey"
    | "caseKey_duplicate"
    | "category"
    | "expectedResult"
    | "scenario"
    | "title";
  index: number;
  message: string;
};

export type RubricValidationIssue = {
  field:
    | "description"
    | "key"
    | "key_duplicate"
    | "label"
    | "summary"
    | "weight"
    | "weight_total";
  index?: number;
  message: string;
};

function normalizeLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toLocalId(prefix: string, index: number, persistedId?: string | null) {
  return persistedId ?? `${prefix}-${index + 1}`;
}

export function createBlankDatasetCase(seed = "case-1"): EvaluationDatasetCaseFormValue {
  return {
    caseKey: seed,
    category: "journey",
    expectedResult: "",
    isActive: true,
    localId: seed,
    priority: "core",
    scenario: "",
    source: "manual",
    title: "",
  };
}

export function createBlankRubricDimension(seed = "dimension-1"): EvaluationRubricDimensionFormValue {
  return {
    description: "",
    hardBlock: false,
    key: seed,
    label: "",
    localId: seed,
    weight: 20,
  };
}

export function createDatasetFormValues(dataset?: EvaluationDatasetArtifact | null): EvaluationDatasetFormValues {
  if (!dataset?.cases.length) {
    return {
      cases: [createBlankDatasetCase()],
    };
  }

  return {
    cases: dataset.cases.map((item, index) => ({
      caseKey: item.case_key,
      category: item.category,
      expectedResult: item.expected_result,
      isActive: item.is_active,
      localId: toLocalId("dataset-case", index, item.id),
      priority: item.priority,
      scenario: item.scenario,
      source: item.source,
      title: item.title,
    })),
  };
}

export function createRubricFormValues(rubric?: EvaluationRubricArtifact | null): EvaluationRubricFormValues {
  if (!rubric?.dimensions.length) {
    return {
      dimensions: [createBlankRubricDimension()],
      summary: "",
    };
  }

  return {
    dimensions: rubric.dimensions.map((item, index) => ({
      description: item.description,
      hardBlock: item.hard_block,
      key: item.key,
      label: item.label,
      localId: toLocalId("rubric-dimension", index, item.key),
      weight: item.weight,
    })),
    summary: rubric.summary,
  };
}

export function buildDatasetPayload(values: EvaluationDatasetFormValues): EvaluationDatasetUpdateRequest {
  return {
    cases: values.cases.map((item): EvaluationDatasetCase => ({
      case_key: item.caseKey.trim(),
      category: item.category.trim(),
      expected_result: item.expectedResult.trim(),
      is_active: item.isActive,
      priority: item.priority.trim() || "core",
      scenario: item.scenario.trim(),
      source: item.source.trim() || "manual",
      title: item.title.trim(),
    })),
  };
}

export function buildRubricPayload(values: EvaluationRubricFormValues): EvaluationRubricUpdateRequest {
  return {
    dimensions: values.dimensions.map((item): EvaluationRubricDimension => ({
      description: item.description.trim(),
      hard_block: item.hardBlock,
      key: item.key.trim(),
      label: item.label.trim(),
      weight: Number.isFinite(item.weight) ? item.weight : 0,
    })),
    summary: values.summary.trim(),
  };
}

export function getDatasetValidationIssues(values: EvaluationDatasetFormValues): DatasetValidationIssue[] {
  const issues: DatasetValidationIssue[] = [];
  const seenKeys = new Map<string, number>();

  values.cases.forEach((item, index) => {
    const normalizedKey = item.caseKey.trim().toLowerCase();
    if (!normalizedKey) {
      issues.push({ field: "caseKey", index, message: "Cada caso necesita un case key unico." });
    } else if (seenKeys.has(normalizedKey)) {
      issues.push({ field: "caseKey_duplicate", index, message: "No repitas el mismo case key en el dataset." });
    } else {
      seenKeys.set(normalizedKey, index);
    }

    if (!item.title.trim()) {
      issues.push({ field: "title", index, message: "Cada caso necesita un titulo claro." });
    }

    if (!item.category.trim()) {
      issues.push({ field: "category", index, message: "Define la categoria del caso." });
    }

    if (!item.scenario.trim()) {
      issues.push({ field: "scenario", index, message: "Describe el escenario que debe evaluarse." });
    }

    if (!item.expectedResult.trim()) {
      issues.push({ field: "expectedResult", index, message: "Describe el resultado esperado del caso." });
    }
  });

  return issues;
}

export function getRubricValidationIssues(values: EvaluationRubricFormValues): RubricValidationIssue[] {
  const issues: RubricValidationIssue[] = [];
  const seenKeys = new Set<string>();
  let totalWeight = 0;

  if (!values.summary.trim()) {
    issues.push({ field: "summary", message: "La rubrica necesita un resumen ejecutivo." });
  }

  values.dimensions.forEach((item, index) => {
    const normalizedKey = item.key.trim().toLowerCase();

    if (!normalizedKey) {
      issues.push({ field: "key", index, message: "Cada dimension necesita una clave tecnica." });
    } else if (seenKeys.has(normalizedKey)) {
      issues.push({ field: "key_duplicate", index, message: "No repitas la clave de una dimension." });
    } else {
      seenKeys.add(normalizedKey);
    }

    if (!item.label.trim()) {
      issues.push({ field: "label", index, message: "La dimension necesita un nombre visible." });
    }

    if (!item.description.trim()) {
      issues.push({ field: "description", index, message: "Describe que valida esta dimension." });
    }

    if (!Number.isFinite(item.weight) || item.weight <= 0) {
      issues.push({ field: "weight", index, message: "El peso debe ser mayor que cero." });
    } else {
      totalWeight += item.weight;
    }
  });

  if (totalWeight !== 100) {
    issues.push({
      field: "weight_total",
      message: "La suma de pesos debe ser exactamente 100 para comparar corridas de forma consistente.",
    });
  }

  return issues;
}

export function getLatestEvaluationRun(snapshot?: SessionSnapshot | null) {
  return snapshot?.evaluation_runs?.[0] ?? null;
}

export function countActiveCases(dataset?: EvaluationDatasetArtifact | null) {
  return dataset?.cases.filter((item) => item.is_active).length ?? 0;
}

export function getRunCoveragePercent(snapshot?: SessionSnapshot | null) {
  const latestRun = getLatestEvaluationRun(snapshot);
  const totalCases = snapshot?.evaluation_dataset?.cases.length ?? 0;

  if (!latestRun || totalCases <= 0) {
    return 0;
  }

  return Math.round((latestRun.results.length / totalCases) * 100);
}

export function getScoreDelta(snapshot?: SessionSnapshot | null) {
  const [currentRun, previousRun] = snapshot?.evaluation_runs ?? [];

  if (!currentRun || !previousRun) {
    return null;
  }

  return currentRun.overall_score - previousRun.overall_score;
}

export function formatArtifactStatus(status?: ArtifactStatus | null) {
  switch (status) {
    case "ready":
      return "Listo";
    case "failed":
      return "Fallido";
    case "needs_review":
      return "Requiere revision";
    default:
      return "Borrador";
  }
}

export function getArtifactTone(status?: ArtifactStatus | null) {
  switch (status) {
    case "ready":
      return "green" as const;
    case "failed":
      return "red" as const;
    case "needs_review":
      return "orange" as const;
    default:
      return "slate" as const;
  }
}

export function getDatasetIssueMessage(
  issues: DatasetValidationIssue[],
  index: number,
  field: DatasetValidationIssue["field"],
) {
  return issues.find((item) => item.index === index && item.field === field)?.message;
}

export function getRubricIssueMessage(
  issues: RubricValidationIssue[],
  index: number,
  field: Exclude<RubricValidationIssue["field"], "summary" | "weight_total">,
) {
  return issues.find((item) => item.index === index && item.field === field)?.message;
}

export function splitMultilineSummary(value: string) {
  return normalizeLines(value);
}
