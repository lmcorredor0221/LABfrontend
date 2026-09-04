"use client";

import type {
  ACPFileEntry,
  ACPFileStatus,
  ACPPreview,
  ACPValidationSeverity,
  ConstructionQuestionAnswerRequest,
  ConstructionQuestionViewEntry,
  ConstructionReadinessStatus,
} from "@/features/sessions/session-contracts";
import type { ExportJobResponse } from "@/features/sessions/types";
import { sessionsApi } from "@/features/sessions/session-api";

export type ConstructionQuestionDraft = {
  answerText: string;
  impactedArtifactsText: string;
  ownerRole: string;
};

export type ConstructionQuestionFieldErrors = {
  answerText?: string;
};

function normalizeLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function createQuestionDraft(question?: ConstructionQuestionViewEntry | null): ConstructionQuestionDraft {
  return {
    answerText: question?.answer_text ?? "",
    impactedArtifactsText: (question?.impacted_artifacts ?? []).join("\n"),
    ownerRole: question?.owner_role || question?.target_owner || "",
  };
}

export function getConstructionQuestionErrors(
  draft: ConstructionQuestionDraft,
  decision: ConstructionQuestionAnswerRequest["decision"] = "answer",
): ConstructionQuestionFieldErrors {
  if (decision === "answer" && !draft.answerText.trim()) {
    return {
      answerText: "La respuesta no puede quedar vacia.",
    };
  }

  return {};
}

export function buildConstructionQuestionPayload(
  draft: ConstructionQuestionDraft,
  decision: ConstructionQuestionAnswerRequest["decision"] = "answer",
  selectedOptionKey?: string,
): ConstructionQuestionAnswerRequest {
  return {
    answer_text: draft.answerText.trim(),
    decision,
    selected_option_key: selectedOptionKey,
    impacted_artifacts: normalizeLines(draft.impactedArtifactsText),
    owner_role: draft.ownerRole.trim(),
  };
}

export function getAcpFileTone(status?: ACPFileStatus | null) {
  switch (status) {
    case "complete":
      return "green" as const;
    case "needs_review":
      return "orange" as const;
    default:
      return "slate" as const;
  }
}

export function formatAcpFileStatus(status?: ACPFileStatus | null) {
  switch (status) {
    case "complete":
      return "Completo";
    case "needs_review":
      return "Requiere revision";
    default:
      return "Incompleto";
  }
}

export function getConstructionTone(status?: ConstructionReadinessStatus | null) {
  switch (status) {
    case "ready_to_build":
      return "green" as const;
    case "blocked":
      return "red" as const;
    case "needs_questions":
      return "orange" as const;
    default:
      return "slate" as const;
  }
}

export function formatConstructionStatus(status?: ConstructionReadinessStatus | null) {
  switch (status) {
    case "ready_to_build":
      return "Listo para construir";
    case "needs_questions":
      return "Requiere respuestas";
    case "blocked":
      return "Bloqueado";
    default:
      return "Sin iniciar";
  }
}

export function getValidationSeverityTone(severity?: ACPValidationSeverity | null) {
  switch (severity) {
    case "error":
      return "red" as const;
    case "warning":
      return "orange" as const;
    case "info":
    default:
      return "slate" as const;
  }
}

export function getBlockingQuestions(questions: ConstructionQuestionViewEntry[]) {
  return questions.filter(
    (item) =>
      item.blocking &&
      item.status !== "resolved" &&
      item.status !== "deferred" &&
      item.status !== "dismissed",
  );
}

export function getOpenQuestions(questions: ConstructionQuestionViewEntry[]) {
  return questions.filter((item) => item.status === "open" || (!item.status && !item.answer_text));
}

export function getExportBlockedReason(preview: ACPPreview | null, questions: ConstructionQuestionViewEntry[]) {
  if (!preview) {
    return "Genera o carga el ACP antes de exportar.";
  }

  if (!preview.validation.can_export_zip) {
    return "El backend aun marca issues bloqueantes para el paquete ACP.";
  }

  if (getBlockingQuestions(questions).length > 0) {
    return "Todavia hay preguntas bloqueantes sin resolver.";
  }

  return null;
}

export function getManifestFile(preview?: ACPPreview | null) {
  if (!preview) {
    return null;
  }

  return preview.files.find((item) => item.path === preview.manifest_path) ?? preview.files[0] ?? null;
}

export function summarizeFileReadiness(files: ACPFileEntry[]) {
  return {
    complete: files.filter((item) => item.status === "complete").length,
    needsReview: files.filter((item) => item.status === "needs_review").length,
    incomplete: files.filter((item) => item.status === "incomplete").length,
  };
}

export function triggerAuthenticatedDownload(blob: Blob, fileName: string) {
  if (typeof window === "undefined") {
    return;
  }

  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

export async function downloadReadyExportJob({
  sessionId,
  job,
}: {
  sessionId: string;
  job: ExportJobResponse;
}) {
  if (job.status !== "ready") {
    return;
  }

  const blob = await sessionsApi.downloadExportJob(sessionId, job.id);
  triggerAuthenticatedDownload(blob, job.file_name || `${job.artifact_kind}.bin`);
}

export async function executeAcpZipDownload({
  sessionId,
}: {
  sessionId: string;
}) {
  let job = await sessionsApi.createExportJob(sessionId, {
    artifact_kind: "acp_portable_zip",
    profile: "acp-portable",
  });

  // Polling si el trabajo esta en cola o procesando
  let attempts = 0;
  while ((job.status === "queued" || job.status === "running") && attempts < 20) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    try {
      job = await sessionsApi.getExportJob(sessionId, job.id);
    } catch {
      // Ignored for polling
    }
    attempts++;
  }

  if (job.status === "ready") {
    await downloadReadyExportJob({ job, sessionId });
    return job;
  }

  if (job.status === "expired" || job.status === "failed") {
    const retried = await sessionsApi.retryExportJob(sessionId, job.id);
    let retryAttempts = 0;
    let currentRetry = retried;
    while ((currentRetry.status === "queued" || currentRetry.status === "running") && retryAttempts < 20) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      try {
        currentRetry = await sessionsApi.getExportJob(sessionId, retried.id);
      } catch {
        // Ignored for polling
      }
      retryAttempts++;
    }
    if (currentRetry.status === "ready") {
      await downloadReadyExportJob({ job: currentRetry, sessionId });
    }
    return currentRetry;
  }

  return job;
}

