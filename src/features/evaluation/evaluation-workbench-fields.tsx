"use client";

import { AppButton, Panel, SelectField, TextAreaField, TextField } from "@/components/lean/ui";
import type {
  DatasetValidationIssue,
  EvaluationDatasetCaseFormValue,
  EvaluationRubricDimensionFormValue,
  RubricValidationIssue,
} from "@/features/evaluation/evaluation-adapter";
import { getDatasetIssueMessage, getRubricIssueMessage } from "@/features/evaluation/evaluation-adapter";

const BOOLEAN_SELECT_OPTIONS = [
  { label: "Activo", value: "true" },
  { label: "Inactivo", value: "false" },
];

const PRIORITY_OPTIONS = [
  { label: "Core", value: "core" },
  { label: "High", value: "high" },
  { label: "Stretch", value: "stretch" },
];

export function DatasetCaseCard({
  index,
  issues,
  onChange,
  onRemove,
  value,
}: {
  index: number;
  issues: DatasetValidationIssue[];
  onChange: (index: number, patch: Partial<EvaluationDatasetCaseFormValue>) => void;
  onRemove: (index: number) => void;
  value: EvaluationDatasetCaseFormValue;
}) {
  return (
    <Panel className="border-[var(--border-default)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[18px] font-semibold text-[var(--text-primary)]">
            {value.title.trim() || `Caso ${index + 1}`}
          </p>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
            Este caso alimenta la corrida real del workbench de evaluacion.
          </p>
        </div>
        <AppButton onClick={() => onRemove(index)}>Eliminar</AppButton>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        <TextField
          data-testid={`evaluation-dataset-case-key-${index}`}
          error={
            getDatasetIssueMessage(issues, index, "caseKey") ??
            getDatasetIssueMessage(issues, index, "caseKey_duplicate")
          }
          label={`Case key ${index + 1}`}
          onValueChange={(nextValue) => onChange(index, { caseKey: nextValue })}
          value={value.caseKey}
        />
        <TextField
          data-testid={`evaluation-dataset-case-title-${index}`}
          error={getDatasetIssueMessage(issues, index, "title")}
          label={`Titulo ${index + 1}`}
          onValueChange={(nextValue) => onChange(index, { title: nextValue })}
          value={value.title}
        />
        <TextField
          error={getDatasetIssueMessage(issues, index, "category")}
          label={`Categoria ${index + 1}`}
          onValueChange={(nextValue) => onChange(index, { category: nextValue })}
          value={value.category}
        />
        <SelectField
          label={`Prioridad ${index + 1}`}
          onValueChange={(nextValue) => onChange(index, { priority: nextValue })}
          options={PRIORITY_OPTIONS}
          value={value.priority}
        />
        <TextField
          label={`Source ${index + 1}`}
          onValueChange={(nextValue) => onChange(index, { source: nextValue })}
          value={value.source}
        />
        <SelectField
          label={`Estado ${index + 1}`}
          onValueChange={(nextValue) => onChange(index, { isActive: nextValue === "true" })}
          options={BOOLEAN_SELECT_OPTIONS}
          value={String(value.isActive)}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <TextAreaField
          error={getDatasetIssueMessage(issues, index, "scenario")}
          label={`Scenario ${index + 1}`}
          onValueChange={(nextValue) => onChange(index, { scenario: nextValue })}
          value={value.scenario}
        />
        <TextAreaField
          error={getDatasetIssueMessage(issues, index, "expectedResult")}
          label={`Expected result ${index + 1}`}
          onValueChange={(nextValue) => onChange(index, { expectedResult: nextValue })}
          value={value.expectedResult}
        />
      </div>
    </Panel>
  );
}

export function RubricDimensionCard({
  index,
  issues,
  onChange,
  onRemove,
  value,
}: {
  index: number;
  issues: RubricValidationIssue[];
  onChange: (index: number, patch: Partial<EvaluationRubricDimensionFormValue>) => void;
  onRemove: (index: number) => void;
  value: EvaluationRubricDimensionFormValue;
}) {
  return (
    <Panel className="border-[var(--border-default)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[18px] font-semibold text-[var(--text-primary)]">
            {value.label.trim() || `Dimension ${index + 1}`}
          </p>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
            Ajusta el criterio y su peso antes de correr la evaluacion.
          </p>
        </div>
        <AppButton onClick={() => onRemove(index)}>Eliminar</AppButton>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-4">
        <TextField
          data-testid={`evaluation-rubric-key-${index}`}
          error={getRubricIssueMessage(issues, index, "key") ?? getRubricIssueMessage(issues, index, "key_duplicate")}
          label={`Key ${index + 1}`}
          onValueChange={(nextValue) => onChange(index, { key: nextValue })}
          value={value.key}
        />
        <TextField
          data-testid={`evaluation-rubric-label-${index}`}
          error={getRubricIssueMessage(issues, index, "label")}
          label={`Label ${index + 1}`}
          onValueChange={(nextValue) => onChange(index, { label: nextValue })}
          value={value.label}
        />
        <TextField
          error={getRubricIssueMessage(issues, index, "weight")}
          label={`Weight ${index + 1}`}
          onValueChange={(nextValue) => onChange(index, { weight: Number(nextValue) || 0 })}
          type="number"
          value={String(value.weight)}
        />
        <SelectField
          label={`Hard block ${index + 1}`}
          onValueChange={(nextValue) => onChange(index, { hardBlock: nextValue === "true" })}
          options={[
            { label: "Si", value: "true" },
            { label: "No", value: "false" },
          ]}
          value={String(value.hardBlock)}
        />
      </div>

      <div className="mt-4">
        <TextAreaField
          error={getRubricIssueMessage(issues, index, "description")}
          label={`Descripcion ${index + 1}`}
          onValueChange={(nextValue) => onChange(index, { description: nextValue })}
          value={value.description}
        />
      </div>
    </Panel>
  );
}
