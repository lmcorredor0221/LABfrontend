import {
  buildDiscoveryInput,
  createDiscoveryFormValues,
  getDiscoveryChecklist,
  getDiscoveryFieldErrors,
  getDiscoveryInputMissingFields,
  type DiscoveryFormErrors,
  type DiscoveryFormValues,
} from "@/features/discovery/discovery-adapter";
import type { ProductExperienceRouteSnapshot } from "@/features/product-experience/core/server-state";
import type {
  DiscoveryAnalysisArtifact,
  JourneyStageArtifactEntry,
} from "@/features/sessions/session-contracts";
import type { SessionValidationEntry } from "@/features/sessions/types";

export type DiscoverReviewDecision = "accepted" | "rejected";
export type DiscoverReviewDecisionMap = Record<string, DiscoverReviewDecision>;

export type DiscoverStageStatus =
  | "approved"
  | "draft"
  | "empty"
  | "error"
  | "loading"
  | "processing"
  | "stale"
  | "waiting_review";

export type DiscoverViewModel = {
  analysisArtifact: DiscoveryAnalysisArtifact | null;
  checklist: ReturnType<typeof getDiscoveryChecklist>;
  completionPercent: number;
  discoveryValidation: SessionValidationEntry | null;
  fieldErrors: DiscoveryFormErrors;
  formValues: DiscoveryFormValues;
  latestArtifact: JourneyStageArtifactEntry | null;
  missingFields: string[];
  projectTitle: string;
  reviewDecisions: DiscoverReviewDecisionMap;
  sessionId: string;
  snapshotUpdatedAt: string | null;
  status: DiscoverStageStatus;
  warnings: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function parseDiscoveryAnalysisArtifact(artifact?: JourneyStageArtifactEntry | null): DiscoveryAnalysisArtifact | null {
  if (!artifact || !isRecord(artifact.proposal_payload)) {
    return null;
  }

  if (
    artifact.schema_version !== "discovery-analysis.v1" &&
    artifact.proposal_payload.schema_version !== "discovery-analysis.v1" &&
    !("normalized_discovery_candidate" in artifact.proposal_payload)
  ) {
    return null;
  }

  return artifact.proposal_payload as DiscoveryAnalysisArtifact;
}

export function getDiscoverReviewDecisions(artifact?: JourneyStageArtifactEntry | null): DiscoverReviewDecisionMap {
  const raw = artifact && isRecord(artifact.user_patch) ? artifact.user_patch.review_decisions : null;

  if (!isRecord(raw)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(raw).filter(
      (entry): entry is [string, DiscoverReviewDecision] => entry[1] === "accepted" || entry[1] === "rejected",
    ),
  );
}

export function getDiscoverSuggestionId(prefix: string, itemKey: string, index: number) {
  return `${prefix}:${itemKey || index}`;
}

export function getDiscoverStageStatus(
  activeRoute: ProductExperienceRouteSnapshot | null,
  options: {
    dirty?: boolean;
    processing?: boolean;
  } = {},
): DiscoverStageStatus {
  const snapshotResource = activeRoute?.snapshot;
  const latestArtifact = activeRoute?.snapshot.data?.journey_latest_artifacts?.discover ?? null;
  const discovery = activeRoute?.snapshot.data?.discovery ?? null;

  if (!snapshotResource || snapshotResource.status === "loading" || snapshotResource.status === "idle") {
    return "loading";
  }

  if (snapshotResource.status === "error") {
    return "error";
  }

  if (options.processing) {
    return "processing";
  }

  if (latestArtifact?.state === "approved" || latestArtifact?.state === "approved_legacy") {
    return options.dirty ? "stale" : "approved";
  }

  if (latestArtifact?.state === "stale") {
    return "stale";
  }

  if (latestArtifact && latestArtifact.state !== "rejected") {
    return "waiting_review";
  }

  if (discovery || options.dirty) {
    return "draft";
  }

  return "empty";
}

export function buildDiscoverViewModel(
  activeRoute: ProductExperienceRouteSnapshot | null,
  options: {
    dirty?: boolean;
    formValues?: DiscoveryFormValues;
    processing?: boolean;
  } = {},
): DiscoverViewModel {
  const snapshot = activeRoute?.snapshot.data ?? null;
  const formValues = options.formValues ?? createDiscoveryFormValues(snapshot?.discovery);
  const input = buildDiscoveryInput(formValues);
  const missingFields = getDiscoveryInputMissingFields(input);
  const checklist = getDiscoveryChecklist(formValues);
  const completedChecklistItems = checklist.filter((item) => item.state === "done").length;
  const discoveryValidation = (snapshot?.validations ?? []).find((entry) => entry.artifact_name === "discovery") ?? null;
  const latestArtifact = snapshot?.journey_latest_artifacts?.discover ?? null;
  const analysisArtifact = parseDiscoveryAnalysisArtifact(latestArtifact);
  const warnings = [
    ...(discoveryValidation?.warnings ?? []),
    ...(latestArtifact?.warnings ?? []),
  ];

  return {
    analysisArtifact,
    checklist,
    completionPercent: checklist.length ? Math.round((completedChecklistItems / checklist.length) * 100) : 0,
    discoveryValidation,
    fieldErrors: getDiscoveryFieldErrors(formValues),
    formValues,
    latestArtifact,
    missingFields,
    projectTitle: activeRoute?.operation.data?.overview?.project_title ?? snapshot?.session.title ?? "Nuevo proyecto",
    reviewDecisions: getDiscoverReviewDecisions(latestArtifact),
    sessionId: activeRoute?.route.sessionId ?? snapshot?.session.id ?? "",
    snapshotUpdatedAt: snapshot?.session.updated_at ?? null,
    status: getDiscoverStageStatus(activeRoute, options),
    warnings,
  };
}

export function getDiscoverPrimaryAction(viewModel: DiscoverViewModel, dirty = false) {
  if (viewModel.status === "approved" && !dirty) {
    return {
      kind: "continue" as const,
      label: "Continuar a Definir",
    };
  }

  if (viewModel.analysisArtifact && viewModel.latestArtifact?.state !== "approved" && !dirty) {
    return {
      kind: "approve" as const,
      label: "Aprobar Discover",
    };
  }

  return {
    kind: "analyze" as const,
    label: "Guardar y analizar",
  };
}
