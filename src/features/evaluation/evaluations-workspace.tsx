"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, FolderKanban, Play, RefreshCcw } from "lucide-react";
import { AppButton, Badge, Checklist, KeyValue, MiniStat, Panel, ProgressBar, SimpleTable, TabList, TextAreaField } from "@/components/lean/ui";
import {
  buildDatasetPayload,
  buildRubricPayload,
  countActiveCases,
  createBlankDatasetCase,
  createBlankRubricDimension,
  createDatasetFormValues,
  createRubricFormValues,
  formatArtifactStatus,
  getArtifactTone,
  getDatasetValidationIssues,
  getLatestEvaluationRun,
  getRunCoveragePercent,
  getScoreDelta,
  getRubricValidationIssues,
  type EvaluationDatasetFormValues,
  type EvaluationRubricFormValues,
} from "@/features/evaluation/evaluation-adapter";
import { DatasetCaseCard, RubricDimensionCard } from "@/features/evaluation/evaluation-workbench-fields";
import { getSessionProjectRoute } from "@/features/sessions/session-routes";
import { OperationsModuleShell } from "@/features/operations/operations-module-shell";
import { useSessionWorkspace } from "@/features/sessions/use-session-workspace";
import type { SessionSnapshot, SessionSummary } from "@/features/sessions/types";
import { useLanguage } from "@/core/i18n/language-context";
import { EmptyState, ErrorState, LoadingState } from "@/shared/states/runtime-states";

type WorkspaceTab = "Resumen" | "Dataset" | "Rubrica" | "Corridas";
type SubmissionState = "idle" | "submitting" | "success" | "error";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function EvaluationWorkspaceContent({
  onRefresh,
  onRun,
  onSave,
  onSessionChange,
  selectedSession,
  sessionOptions,
  snapshot,
  submissionMessage,
  submissionState,
}: {
  onRefresh: () => Promise<void>;
  onRun: (datasetValues: EvaluationDatasetFormValues, rubricValues: EvaluationRubricFormValues) => Promise<void>;
  onSave: (tab: WorkspaceTab, datasetValues: EvaluationDatasetFormValues, rubricValues: EvaluationRubricFormValues) => Promise<void>;
  onSessionChange: (sessionId: string) => Promise<unknown>;
  selectedSession: SessionSummary;
  sessionOptions: Array<{ label: string; value: string }>;
  snapshot: SessionSnapshot;
  submissionMessage: string | null;
  submissionState: SubmissionState;
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("Resumen");
  const [datasetValues, setDatasetValues] = useState<EvaluationDatasetFormValues>(() =>
    createDatasetFormValues(snapshot.evaluation_dataset),
  );
  const [rubricValues, setRubricValues] = useState<EvaluationRubricFormValues>(() =>
    createRubricFormValues(snapshot.evaluation_rubric),
  );
  const [datasetIssues, setDatasetIssues] = useState<ReturnType<typeof getDatasetValidationIssues>>([]);
  const [rubricIssues, setRubricIssues] = useState<ReturnType<typeof getRubricValidationIssues>>([]);

  const latestRun = getLatestEvaluationRun(snapshot);
  const scoreDelta = getScoreDelta(snapshot);
  const runCoverage = getRunCoveragePercent(snapshot);
  const warnings = snapshot.validations?.flatMap((item) => item.warnings) ?? [];
  const activeCases = countActiveCases(snapshot.evaluation_dataset);
  const runTone = getArtifactTone(latestRun?.status ?? snapshot.session.status);

  function updateDatasetCase(index: number, patch: Partial<EvaluationDatasetFormValues["cases"][number]>) {
    setDatasetValues((currentValue) => ({
      ...currentValue,
      cases: currentValue.cases.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    }));
  }

  function updateRubricDimension(index: number, patch: Partial<EvaluationRubricFormValues["dimensions"][number]>) {
    setRubricValues((currentValue) => ({
      ...currentValue,
      dimensions: currentValue.dimensions.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    }));
  }

  function addDatasetCase() {
    setDatasetValues((currentValue) => ({
      ...currentValue,
      cases: [...currentValue.cases, createBlankDatasetCase(`case-${currentValue.cases.length + 1}`)],
    }));
    setActiveTab("Dataset");
  }

  function removeDatasetCase(index: number) {
    setDatasetValues((currentValue) => ({
      ...currentValue,
      cases: currentValue.cases.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function addRubricDimension() {
    setRubricValues((currentValue) => ({
      ...currentValue,
      dimensions: [...currentValue.dimensions, createBlankRubricDimension(`dimension-${currentValue.dimensions.length + 1}`)],
    }));
    setActiveTab("Rubrica");
  }

  function removeRubricDimension(index: number) {
    setRubricValues((currentValue) => ({
      ...currentValue,
      dimensions: currentValue.dimensions.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function handleSaveActiveTab() {
    if (activeTab === "Dataset") {
      const nextIssues = getDatasetValidationIssues(datasetValues);
      setDatasetIssues(nextIssues);
      if (nextIssues.length > 0) {
        return;
      }
    }

    if (activeTab === "Rubrica") {
      const nextIssues = getRubricValidationIssues(rubricValues);
      setRubricIssues(nextIssues);
      if (nextIssues.length > 0) {
        return;
      }
    }

    await onSave(activeTab, datasetValues, rubricValues);
  }

  async function handleRunEvaluation() {
    const nextDatasetIssues = getDatasetValidationIssues(datasetValues);
    const nextRubricIssues = getRubricValidationIssues(rubricValues);
    setDatasetIssues(nextDatasetIssues);
    setRubricIssues(nextRubricIssues);

    if (nextDatasetIssues.length > 0 || nextRubricIssues.length > 0) {
      setActiveTab(nextDatasetIssues.length > 0 ? "Dataset" : "Rubrica");
      return;
    }

    await onRun(datasetValues, rubricValues);
    setActiveTab("Corridas");
  }

  return (
    <OperationsModuleShell
      moduleLabel={t("evaluations.title", "Evaluaciones")}
      title={t("evaluations.title", "Evaluaciones y benchmarks")}
      description={t("evaluations.description", "Analiza el desempeño de agentes e indicadores de precisión.")}
      sessionOptions={sessionOptions}
      sessionValue={selectedSession.id}
      selectedSession={selectedSession}
      onSessionChange={(value) => void onSessionChange(value)}
      actions={
        <>
          <AppButton icon={<FolderKanban className="h-4 w-4" />} onClick={() => router.push(getSessionProjectRoute(selectedSession))}>
            Abrir proyecto
          </AppButton>
          <AppButton icon={<Bot className="h-4 w-4" />} onClick={() => router.push(`/agents/${selectedSession.id}`)}>
            Abrir agente
          </AppButton>
          <AppButton icon={<RefreshCcw className="h-4 w-4" />} onClick={() => void onRefresh()}>
            Refrescar
          </AppButton>
          <AppButton loading={submissionState === "submitting"} loadingLabel="Guardando..." onClick={() => void handleSaveActiveTab()}>
            Guardar {activeTab === "Dataset" ? "dataset" : activeTab === "Rubrica" ? "rubrica" : "estado"}
          </AppButton>
          <AppButton
            data-testid="evaluations-run-button"
            icon={<Play className="h-4 w-4" />}
            loading={submissionState === "submitting"}
            loadingLabel="Ejecutando..."
            onClick={() => void handleRunEvaluation()}
            variant="primary"
          >
            Ejecutar evaluacion
          </AppButton>
        </>
      }
    >
      <div className="grid gap-4 xl:grid-cols-5">
        <MiniStat label="Score actual" value={latestRun ? `${latestRun.overall_score}/100` : "Sin corridas"} hint={latestRun ? formatArtifactStatus(latestRun.status) : "Aun sin historial"} tone={runTone} />
        <MiniStat label="Corridas" value={snapshot.evaluation_runs.length} hint="Persistidas por sesion" tone="blue" />
        <MiniStat label="Cobertura" value={`${runCoverage}%`} hint={`${activeCases} casos activos`} tone="green" />
        <MiniStat label="Delta" value={scoreDelta === null ? "N/A" : `${scoreDelta > 0 ? "+" : ""}${scoreDelta} pts`} hint="Vs. corrida anterior" tone={scoreDelta !== null && scoreDelta < 0 ? "orange" : "green"} />
        <MiniStat label="Dataset / Rubrica" value={`${snapshot.evaluation_dataset?.version_number ?? 0} / ${snapshot.evaluation_rubric?.version_number ?? 0}`} hint="Versiones actuales" tone="violet" />
      </div>

      {submissionMessage ? (
        <Panel className="p-5">
          <p className="text-[16px] font-semibold text-[var(--text-primary)]">Estado del hub</p>
          <p className="mt-2 text-[14px] leading-7 text-[var(--text-secondary)]">{submissionMessage}</p>
        </Panel>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <Panel className="p-6">
            <TabList active={activeTab} onChange={(value) => setActiveTab(value as WorkspaceTab)} tabs={["Resumen", "Dataset", "Rubrica", "Corridas"]} />

            {activeTab === "Resumen" ? (
              <div className="mt-6 space-y-5">
                <Panel className="border-[var(--border-default)] p-5">
                  <div className="grid gap-4 md:grid-cols-4">
                    <KeyValue label="Estado" value={latestRun ? formatArtifactStatus(latestRun.status) : "Sin corridas"} />
                    <KeyValue label="Dataset" value={`v${snapshot.evaluation_dataset?.version_number ?? 0}`} />
                    <KeyValue label="Rubrica" value={`v${snapshot.evaluation_rubric?.version_number ?? 0}`} />
                    <KeyValue label="Ultima corrida" value={latestRun?.created_at ?? "Sin historial"} />
                  </div>
                  <p className="mt-5 text-[14px] leading-7 text-[var(--text-secondary)]">
                    {latestRun?.summary ?? "Esta sesion ya tiene dataset y rubrica, pero aun no registra una corrida ejecutada."}
                  </p>
                </Panel>

                {latestRun ? (
                  <SimpleTable
                    columns={["Caso", "Categoria", "Score", "Estado", "Resumen"]}
                    rows={latestRun.results.map((item) => [
                      item.title,
                      item.category,
                      `${item.score}/100`,
                      <Badge key={`${item.case_key}-status`} tone={getArtifactTone(item.status)}>
                        {formatArtifactStatus(item.status)}
                      </Badge>,
                      item.summary,
                    ])}
                  />
                ) : (
                  <EmptyState
                    className="px-0 py-4"
                    title="Aun no hay corridas para esta sesion"
                    description="Guarda dataset y rubrica, y luego ejecuta una corrida desde este hub."
                  />
                )}
              </div>
            ) : null}

            {activeTab === "Dataset" ? (
              <div className="mt-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[24px] font-semibold text-[var(--text-primary)]">Dataset de evaluacion</p>
                    <p className="mt-2 text-[14px] text-[var(--text-secondary)]">Edita los casos reales que alimentan las corridas de esta sesion.</p>
                  </div>
                  <AppButton onClick={addDatasetCase}>Agregar caso</AppButton>
                </div>
                {datasetValues.cases.map((item, index) => (
                  <DatasetCaseCard
                    key={item.localId}
                    index={index}
                    issues={datasetIssues}
                    onChange={updateDatasetCase}
                    onRemove={removeDatasetCase}
                    value={item}
                  />
                ))}
              </div>
            ) : null}

            {activeTab === "Rubrica" ? (
              <div className="mt-6 space-y-5">
                <TextAreaField
                  data-testid="evaluations-rubric-summary"
                  label="Resumen de la rubrica"
                  onValueChange={(value) => setRubricValues((currentValue) => ({ ...currentValue, summary: value }))}
                  value={rubricValues.summary}
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[24px] font-semibold text-[var(--text-primary)]">Dimensiones</p>
                    <p className="mt-2 text-[14px] text-[var(--text-secondary)]">Mantiene la suma de pesos en 100 para comparar corridas sin sesgos.</p>
                  </div>
                  <AppButton onClick={addRubricDimension}>Agregar dimension</AppButton>
                </div>
                {rubricValues.dimensions.map((item, index) => (
                  <RubricDimensionCard
                    key={item.localId}
                    index={index}
                    issues={rubricIssues}
                    onChange={updateRubricDimension}
                    onRemove={removeRubricDimension}
                    value={item}
                  />
                ))}
              </div>
            ) : null}

            {activeTab === "Corridas" ? (
              <div className="mt-6 space-y-5">
                {snapshot.evaluation_runs.length > 0 ? (
                  <>
                    <SimpleTable
                      columns={["Corrida", "Fecha", "Score", "Estado", "Dataset/Rubrica"]}
                      rows={snapshot.evaluation_runs.map((item) => [
                        item.id,
                        item.created_at,
                        `${item.overall_score}/100`,
                        <Badge key={`${item.id}-status`} tone={getArtifactTone(item.status)}>
                          {formatArtifactStatus(item.status)}
                        </Badge>,
                        `v${item.dataset_version_number} / v${item.rubric_version_number}`,
                      ])}
                    />
                    {latestRun ? (
                      <Panel className="border-[var(--border-default)] p-5">
                        <p className="text-[16px] font-semibold text-[var(--text-primary)]">Recomendaciones de la ultima corrida</p>
                        <Checklist
                          className="mt-4"
                          items={latestRun.recommendations.map((item) => ({
                            detail: "Derivado del backend de evaluacion.",
                            label: item,
                            state: "pending" as const,
                          }))}
                        />
                      </Panel>
                    ) : null}
                  </>
                ) : (
                  <EmptyState
                    className="px-0 py-4"
                    title="Sin historial de corridas"
                    description="Ejecuta la primera corrida para poblar el historial y el comparativo de scores."
                  />
                )}
              </div>
            ) : null}
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel className="p-5">
            <p className="text-[18px] font-semibold text-[var(--text-primary)]">Workbench actual</p>
            <Badge className="mt-4" tone={runTone}>
              {latestRun ? formatArtifactStatus(latestRun.status) : "Preparado"}
            </Badge>
            <div className="mt-5 space-y-3">
              <KeyValue label="Casos activos" value={activeCases} />
              <KeyValue label="Dimensiones" value={snapshot.evaluation_rubric?.dimensions.length ?? 0} />
              <KeyValue label="Blocking issues" value={latestRun?.blocking_issues.length ?? 0} />
            </div>
          </Panel>

          <Panel className="p-5">
            <p className="text-[18px] font-semibold text-[var(--text-primary)]">Checklist de validacion</p>
            <Checklist
              className="mt-5"
              items={[
                { label: "Sesion seleccionada", state: "done", detail: selectedSession.title },
                { label: "Dataset listo", state: datasetIssues.length === 0 && datasetValues.cases.length > 0 ? "done" : "pending" },
                { label: "Rubrica consistente", state: rubricIssues.length === 0 && rubricValues.dimensions.length > 0 ? "done" : "pending" },
                { label: "Corrida visible", state: latestRun ? "done" : "pending" },
              ]}
            />
          </Panel>

          <Panel className="p-5">
            <p className="text-[18px] font-semibold text-[var(--text-primary)]">Warnings del backend</p>
            <Checklist
              className="mt-5"
              items={
                warnings.length > 0
                  ? warnings.map((item) => ({
                      detail: "Registrado en la ultima validacion persistida.",
                      label: item,
                      state: "alert" as const,
                    }))
                  : [
                      {
                        detail: "No hay warnings persistidos para esta sesion.",
                        label: "Sin alertas activas",
                        state: "done" as const,
                      },
                    ]
              }
            />
          </Panel>

          <Panel className="p-5">
            <p className="text-[18px] font-semibold text-[var(--text-primary)]">Salud de la vista</p>
            <ProgressBar value={latestRun?.overall_score ?? 0} className="mt-5" />
            <p className="mt-4 text-[13px] leading-7 text-[var(--text-secondary)]">
              El hub distingue corridas exitosas, fallidas y ausencia total de historial sin depender de placeholders.
            </p>
          </Panel>
        </div>
      </div>
    </OperationsModuleShell>
  );
}

export function EvaluationsWorkspacePage() {
  const router = useRouter();
  const {
    bootstrapEvaluation,
    createSession,
    evaluateBlueprint,
    items,
    listError,
    listStatus,
    patchEvaluationDataset,
    patchEvaluationRubric,
    refreshSessionData,
    selectWorkspaceSession,
    selectedSession,
    selectedSnapshot,
    snapshotError,
    snapshotStatus,
  } = useSessionWorkspace({ requireSnapshot: true });
  const [submissionState, setSubmissionState] = useState<SubmissionState>("idle");
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);

  const sessionOptions = items.map((item) => ({
    label: item.title,
    value: item.id,
  }));

  async function handleCreateSession() {
    const created = await createSession();
    router.push(getSessionProjectRoute(created));
  }

  async function handleRefresh() {
    if (!selectedSession) {
      return;
    }

    await refreshSessionData(selectedSession.id);
  }

  async function handleBootstrap() {
    if (!selectedSession) {
      return;
    }

    setSubmissionState("submitting");
    setSubmissionMessage(null);

    try {
      await bootstrapEvaluation(selectedSession.id);
      await refreshSessionData(selectedSession.id);
      setSubmissionState("success");
      setSubmissionMessage("Workbench de evaluacion bootstrappeado y listo para editar.");
    } catch (error) {
      setSubmissionState("error");
      setSubmissionMessage(getErrorMessage(error, "No se pudo bootstrapear la evaluacion."));
    }
  }

  async function handleSave(
    tab: WorkspaceTab,
    datasetValues: EvaluationDatasetFormValues,
    rubricValues: EvaluationRubricFormValues,
  ) {
    if (!selectedSession) {
      return;
    }

    if (tab === "Dataset") {
      setSubmissionState("submitting");
      setSubmissionMessage(null);

      try {
        await patchEvaluationDataset(selectedSession.id, buildDatasetPayload(datasetValues));
        await refreshSessionData(selectedSession.id);
        setSubmissionState("success");
        setSubmissionMessage("Dataset persistido y sincronizado con el backend.");
      } catch (error) {
        setSubmissionState("error");
        setSubmissionMessage(getErrorMessage(error, "No se pudo guardar el dataset."));
      }
      return;
    }

    if (tab === "Rubrica") {
      setSubmissionState("submitting");
      setSubmissionMessage(null);

      try {
        await patchEvaluationRubric(selectedSession.id, buildRubricPayload(rubricValues));
        await refreshSessionData(selectedSession.id);
        setSubmissionState("success");
        setSubmissionMessage("Rubrica persistida y sincronizada con el backend.");
      } catch (error) {
        setSubmissionState("error");
        setSubmissionMessage(getErrorMessage(error, "No se pudo guardar la rubrica."));
      }
      return;
    }

    setSubmissionState("success");
    setSubmissionMessage("No hay cambios estructurados por guardar en esta pestana.");
  }

  async function handleRun(datasetValues: EvaluationDatasetFormValues, rubricValues: EvaluationRubricFormValues) {
    if (!selectedSession) {
      return;
    }

    setSubmissionState("submitting");
    setSubmissionMessage(null);

    try {
      await patchEvaluationDataset(selectedSession.id, buildDatasetPayload(datasetValues));
      await patchEvaluationRubric(selectedSession.id, buildRubricPayload(rubricValues));
      const envelope = await evaluateBlueprint(selectedSession.id);
      await refreshSessionData(selectedSession.id);
      setSubmissionState(envelope.status === "ready" ? "success" : "error");
      setSubmissionMessage(
        envelope.status === "ready"
          ? "Nueva corrida ejecutada y resultados sincronizados con la sesion."
          : "La corrida termino, pero el backend aun exige revisiones.",
      );
    } catch (error) {
      setSubmissionState("error");
      setSubmissionMessage(getErrorMessage(error, "No se pudo ejecutar la evaluacion."));
    }
  }

  if (listStatus === "loading" && items.length === 0) {
    return <LoadingState title="Cargando hub de evaluaciones" description="Estamos recuperando las sesiones para abrir su workbench real." />;
  }

  if (listStatus === "error" && items.length === 0) {
    return (
      <ErrorState
        title="No se pudo abrir Evaluaciones"
        description={listError?.message ?? "No fue posible obtener las sesiones disponibles."}
        action={
          <AppButton variant="primary" onClick={() => void handleCreateSession()}>
            Crear sesion
          </AppButton>
        }
      />
    );
  }

  if (!selectedSession) {
    return (
      <OperationsModuleShell
        moduleLabel="Evaluaciones"
        title="Evaluaciones"
        description="Selecciona una sesion para abrir su dataset, rubrica y corridas reales."
        sessionOptions={sessionOptions}
        sessionValue={null}
      >
        <EmptyState
          title="Sin sesiones para evaluar"
          description="Crea una sesion o completa el journey principal para abrir su workbench de calidad."
          action={
            <AppButton variant="primary" onClick={() => void handleCreateSession()}>
              Crear sesion
            </AppButton>
          }
        />
      </OperationsModuleShell>
    );
  }

  if (snapshotStatus === "loading" && !selectedSnapshot) {
    return (
      <OperationsModuleShell
        moduleLabel="Evaluaciones"
        title="Evaluaciones"
        description="Centro consolidado de calidad por sesion."
        sessionOptions={sessionOptions}
        sessionValue={selectedSession.id}
        selectedSession={selectedSession}
        onSessionChange={(value) => void selectWorkspaceSession(value)}
      >
        <LoadingState title="Cargando workbench de evaluacion" description="Recuperando dataset, rubrica y corridas persistidas de la sesion seleccionada." />
      </OperationsModuleShell>
    );
  }

  if (snapshotStatus === "error" && !selectedSnapshot) {
    return (
      <OperationsModuleShell
        moduleLabel="Evaluaciones"
        title="Evaluaciones"
        description="Centro consolidado de calidad por sesion."
        sessionOptions={sessionOptions}
        sessionValue={selectedSession.id}
        selectedSession={selectedSession}
        onSessionChange={(value) => void selectWorkspaceSession(value)}
      >
        <ErrorState
          title="No se pudo abrir la sesion seleccionada"
          description={snapshotError?.message ?? "La sesion no devolvio un snapshot utilizable."}
          action={
            <AppButton variant="primary" onClick={() => void handleRefresh()}>
              Reintentar
            </AppButton>
          }
        />
      </OperationsModuleShell>
    );
  }

  if (!selectedSnapshot?.blueprint) {
    return (
      <OperationsModuleShell
        moduleLabel="Evaluaciones"
        title="Evaluaciones"
        description="Centro consolidado de calidad por sesion."
        sessionOptions={sessionOptions}
        sessionValue={selectedSession.id}
        selectedSession={selectedSession}
        onSessionChange={(value) => void selectWorkspaceSession(value)}
      >
        <EmptyState
          title="Falta un blueprint para evaluar"
          description="Completa Design, Tools y Memory antes de usar este hub de evaluaciones."
          action={
            <AppButton variant="primary" onClick={() => router.push(getSessionProjectRoute(selectedSession))}>
              Abrir proyecto
            </AppButton>
          }
        />
      </OperationsModuleShell>
    );
  }

  if (!selectedSnapshot.evaluation_dataset || !selectedSnapshot.evaluation_rubric) {
    return (
      <OperationsModuleShell
        moduleLabel="Evaluaciones"
        title="Evaluaciones"
        description="Centro consolidado de calidad por sesion."
        sessionOptions={sessionOptions}
        sessionValue={selectedSession.id}
        selectedSession={selectedSession}
        onSessionChange={(value) => void selectWorkspaceSession(value)}
      >
        <Panel className="p-6">
          <EmptyState
            title="La sesion aun no tiene workbench de evaluacion"
            description="Bootstrap crea el dataset y la rubrica iniciales a partir del blueprint persistido."
            action={
              <AppButton
                data-testid="evaluations-bootstrap-button"
                loading={submissionState === "submitting"}
                loadingLabel="Preparando..."
                onClick={() => void handleBootstrap()}
                variant="primary"
              >
                Bootstrap de evaluacion
              </AppButton>
            }
          />
          {submissionMessage ? (
            <p className="mt-5 text-center text-[14px] text-[var(--text-secondary)]">{submissionMessage}</p>
          ) : null}
        </Panel>
      </OperationsModuleShell>
    );
  }

  return (
    <EvaluationWorkspaceContent
      key={[
        selectedSnapshot.session.id,
        selectedSnapshot.evaluation_dataset.version_number,
        selectedSnapshot.evaluation_rubric.version_number,
        selectedSnapshot.evaluation_runs[0]?.id ?? "no-run",
      ].join(":")}
      onRefresh={handleRefresh}
      onRun={handleRun}
      onSave={handleSave}
      onSessionChange={selectWorkspaceSession}
      selectedSession={selectedSession}
      sessionOptions={sessionOptions}
      snapshot={selectedSnapshot}
      submissionMessage={submissionMessage}
      submissionState={submissionState}
    />
  );
}
