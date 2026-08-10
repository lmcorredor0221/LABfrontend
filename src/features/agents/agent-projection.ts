"use client";

import { getSessionStageLabel, getSessionStatusLabel, getSessionStatusTone } from "@/features/sessions/session-routes";
import type { MonitoringWorkspace } from "@/features/sessions/session-contracts";
import type { SessionSnapshot } from "@/features/sessions/types";

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

function buildCoverageScore(snapshot: SessionSnapshot) {
  const summary = snapshot.blueprint?.delivery_package.blueprint_coverage;
  if (!summary || summary.total_sections <= 0) {
    return snapshot.blueprint ? 100 : 0;
  }

  return clampPercent(Math.round((summary.covered_sections / summary.total_sections) * 100));
}

function buildDescription(snapshot: SessionSnapshot) {
  return (
    snapshot.blueprint?.narrative?.trim() ||
    snapshot.discovery?.desired_outcome?.trim() ||
    snapshot.discovery?.problem_statement?.trim() ||
    "Proyeccion operativa derivada del blueprint y del runtime de la sesion."
  );
}

function buildRecommendations(snapshot: SessionSnapshot, monitoring: MonitoringWorkspace | null) {
  const evaluationRecommendations = snapshot.evaluation?.recommendations ?? [];
  const blockingApprovalTitles = snapshot.approvals
    .filter((item) => item.status === "pending")
    .map((item) => item.title);
  const activeAlerts = (monitoring?.alerts ?? [])
    .filter((item) => item.status !== "resolved")
    .map((item) => item.title);

  return [...evaluationRecommendations, ...blockingApprovalTitles, ...activeAlerts].slice(0, 5);
}

export function buildAgentProjection(snapshot: SessionSnapshot, monitoring: MonitoringWorkspace | null) {
  const latestRun = snapshot.evaluation_runs[0] ?? null;
  const coverageScore = buildCoverageScore(snapshot);
  const integrationCount = monitoring?.integrations.length ?? snapshot.integration_statuses.length;
  const artifactCount = monitoring?.current_metrics?.artifact_count ?? snapshot.artifact_records.length;
  const readinessScore = latestRun?.overall_score ?? null;
  const runtimeHealthLabel =
    monitoring?.current_metrics?.latest_evaluation_score !== null &&
    monitoring?.current_metrics?.latest_evaluation_score !== undefined
      ? `${monitoring.current_metrics.latest_evaluation_score}/100`
      : latestRun
        ? `${latestRun.overall_score}/100`
        : "Sin score";

  return {
    artifactCount,
    coverageScore,
    description: buildDescription(snapshot),
    guardrailCount: snapshot.blueprint?.guardrails.length ?? 0,
    integrationCount,
    memoryStrategy: snapshot.blueprint?.memory_strategy ?? "Sin estrategia declarada",
    pendingApprovals: snapshot.approvals.filter((item) => item.status === "pending").length,
    readinessLabel: readinessScore !== null ? `${readinessScore}/100` : "Sin corrida",
    reasoningPattern: snapshot.blueprint?.reasoning_pattern ?? "Sin patron declarado",
    recentActivity: snapshot.activity.slice(0, 4),
    recommendations: buildRecommendations(snapshot, monitoring),
    runtimeHealthLabel,
    sessionStageLabel: getSessionStageLabel(snapshot.session.current_stage),
    statusLabel: getSessionStatusLabel(snapshot.session.status),
    statusTone: getSessionStatusTone(snapshot.session.status),
    toolCount: snapshot.blueprint?.tools.length ?? 0,
    validationWarnings: snapshot.validations?.flatMap((item) => item.warnings).slice(0, 5) ?? [],
    workflowTemplateCount: snapshot.workflow_templates.length,
  };
}
