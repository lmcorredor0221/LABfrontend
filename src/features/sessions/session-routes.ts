import { getProjectProductRoute, getProjectRoute, type ProjectProductRouteSection, type ProjectRouteStage } from "@/core/routing/routes";
import {
  getJourneyIndex,
  hasEstimationEvidence,
  hasMemoryConfigured,
  hasPackageEvidence,
  hasToolingConfigured,
  hasValidationEvidence,
  type LeanJourneyStage,
} from "@/features/journey/journey-model";
import { hasAcpEntitlement, hasBlueprintProEntitlement } from "@/features/sessions/commercial-access";
import type { ArtifactStatus, SessionSnapshot, SessionStage, SessionSummary } from "@/features/sessions/types";
import type {
  JourneyStateMachine,
  ProductJourneyOverview,
  ProductJourneyRecommendedAction,
} from "@/features/product-experience/saas/product-journey-overview";

type SessionLabelLanguage = "en" | "es" | "pt";

const SESSION_STAGE_TO_PROJECT_STAGE: Record<SessionStage, ProjectRouteStage> = {
  draft_capture: "discover",
  input_validation: "discover",
  normalize_discovery: "discover",
  build_canvas: "define",
  build_blueprint: "design",
  post_validation: "estimate",
  ready_for_export: "package",
};

const SESSION_STAGE_LABELS: Record<SessionStage, Record<SessionLabelLanguage, string>> = {
  draft_capture: { en: "Initial capture", es: "Captura inicial", pt: "Captura inicial" },
  input_validation: { en: "Validation", es: "Validacion", pt: "Validacao" },
  normalize_discovery: { en: "Discovery", es: "Discovery", pt: "Discovery" },
  build_canvas: { en: "Canvas", es: "Canvas", pt: "Canvas" },
  build_blueprint: { en: "Blueprint", es: "Blueprint", pt: "Blueprint" },
  post_validation: { en: "Blueprint results", es: "Resultados Blueprint", pt: "Resultados do Blueprint" },
  ready_for_export: { en: "Package", es: "Package", pt: "Pacote" },
};

const SESSION_STATUS_LABELS: Record<ArtifactStatus, Record<SessionLabelLanguage, string>> = {
  draft: { en: "Draft", es: "Borrador", pt: "Rascunho" },
  ready: { en: "Ready", es: "Listo", pt: "Pronto" },
  needs_review: { en: "Needs review", es: "Requiere revision", pt: "Requer revisao" },
  failed: { en: "At risk", es: "Con riesgo", pt: "Em risco" },
};

const SESSION_STATUS_TONES: Record<ArtifactStatus, "green" | "orange" | "red" | "slate"> = {
  draft: "slate",
  ready: "green",
  needs_review: "orange",
  failed: "red",
};

const LAST_STAGE_STORAGE_KEY = "lean-builder.last-project-stage";

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storage = window.localStorage;
    return typeof storage?.getItem === "function" ? storage : null;
  } catch {
    return null;
  }
}

function isCanonicalProjectStage(value: string): value is LeanJourneyStage {
  return [
    "discover",
    "define",
    "design",
    "tools",
    "memory",
    "estimate",
    "validate",
    "package",
  ].includes(value);
}

function shouldOpenWorkStage(
  session: Pick<SessionSummary, "current_stage">,
  snapshot: SessionSnapshot | null = null,
) {
  if (snapshot?.blueprint) {
    return false;
  }

  if (session.current_stage === "draft_capture" || session.current_stage === "input_validation") {
    return true;
  }

  return session.current_stage === "normalize_discovery" && !snapshot?.discovery;
}

function getProductLandingSection(snapshot: SessionSnapshot | null): ProjectProductRouteSection {
  if (hasAcpEntitlement(snapshot)) {
    return "acp";
  }

  if (hasBlueprintProEntitlement(snapshot)) {
    return "blueprint_pro";
  }

  return "blueprint";
}

function getProductLandingSectionFromKey(productKey: string): ProjectProductRouteSection {
  if (productKey === "acp") {
    return "acp";
  }
  if (productKey === "blueprint_pro") {
    return "blueprint_pro";
  }
  return "blueprint";
}

function loadStoredStages() {
  const rawValue = getStorage()?.getItem(LAST_STAGE_STORAGE_KEY);
  if (!rawValue) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawValue) as Record<string, string>;
    return Object.fromEntries(Object.entries(parsed).filter(([, value]) => isCanonicalProjectStage(value))) as Record<
      string,
      LeanJourneyStage
    >;
  } catch {
    return {};
  }
}

function saveStoredStages(nextValue: Record<string, LeanJourneyStage>) {
  getStorage()?.setItem(LAST_STAGE_STORAGE_KEY, JSON.stringify(nextValue));
}

function getAccessibleJourneyStages(
  session: Pick<SessionSummary, "current_stage">,
  snapshot: SessionSnapshot | null = null,
) {
  const stages = new Set<LeanJourneyStage>(["discover"]);

  if (
    snapshot?.discovery ||
    ["build_canvas", "build_blueprint", "post_validation", "ready_for_export"].includes(session.current_stage)
  ) {
    stages.add("define");
  }

  if (
    snapshot?.canvas ||
    ["build_blueprint", "post_validation", "ready_for_export"].includes(session.current_stage)
  ) {
    stages.add("design");
    stages.add("tools");
    stages.add("memory");
  }

  if (
    hasMemoryConfigured(snapshot) ||
    hasEstimationEvidence(snapshot) ||
    hasValidationEvidence(snapshot) ||
    session.current_stage === "post_validation" ||
    session.current_stage === "ready_for_export"
  ) {
    stages.add("estimate");
  }

  if (hasAcpEntitlement(snapshot)) {
    if (snapshot?.blueprint || session.current_stage === "post_validation" || session.current_stage === "ready_for_export") {
      stages.add("validate");
    }

    if (
      hasPackageEvidence(snapshot) ||
      session.current_stage === "ready_for_export" ||
      (hasValidationEvidence(snapshot) && hasEstimationEvidence(snapshot))
    ) {
      stages.add("package");
    }
  }

  return stages;
}

function getStoredProjectStage(sessionId: string) {
  return loadStoredStages()[sessionId] ?? null;
}

function recommendProjectStage(
  session: Pick<SessionSummary, "current_stage">,
  snapshot: SessionSnapshot | null = null,
): LeanJourneyStage {
  if (!snapshot?.discovery) {
    return "discover";
  }

  if (!snapshot.canvas) {
    return "define";
  }

  if (!snapshot.blueprint) {
    return "design";
  }

  if (!hasToolingConfigured(snapshot)) {
    return "tools";
  }

  if (!hasMemoryConfigured(snapshot)) {
    return "memory";
  }

  if (!hasEstimationEvidence(snapshot)) {
    return "estimate";
  }

  if (!hasAcpEntitlement(snapshot)) {
    return "estimate";
  }

  if (!hasValidationEvidence(snapshot)) {
    return "validate";
  }

  if (!hasPackageEvidence(snapshot) && session.current_stage !== "ready_for_export") {
    return "package";
  }

  return "package";
}

function actionHrefOrProductRoute(sessionId: string, action: ProductJourneyRecommendedAction | null | undefined) {
  if (!action) {
    return null;
  }

  if (action.href.startsWith(`/projects/${sessionId}/`)) {
    return action.href;
  }

  if (action.action_key === "open_attention") {
    return `/projects/${sessionId}/attention`;
  }

  if (action.action_key === "view_progress") {
    return `/projects/${sessionId}/activity`;
  }

  return getProjectProductRoute(sessionId, getProductLandingSectionFromKey(action.product_key));
}

function getProjectRouteFromJourneyStateMachine(
  sessionId: string,
  journeyStateMachine: JourneyStateMachine | null | undefined,
) {
  const href = journeyStateMachine?.current.href;
  if (!href) {
    return null;
  }

  return href.startsWith(`/projects/${sessionId}/`) ? href : null;
}

function isContinuationAction(
  action: ProductJourneyRecommendedAction | null | undefined,
): action is ProductJourneyRecommendedAction {
  return action?.action_key === "continue_current_stage" && action.href.startsWith("/projects/");
}

export function getProjectRouteFromJourneyOverview(
  sessionId: string,
  overview: ProductJourneyOverview | null | undefined,
) {
  if (!overview) {
    return null;
  }

  const action = overview.recommended_next_action;
  if (action?.action_key === "open_attention" || action?.action_key === "view_progress") {
    return actionHrefOrProductRoute(sessionId, action);
  }

  if (isContinuationAction(action)) {
    return action.href;
  }

  const stateMachineRoute = getProjectRouteFromJourneyStateMachine(sessionId, overview.journey_state_machine);
  if (stateMachineRoute) {
    return stateMachineRoute;
  }

  const stageKey = overview.current_stage.stage_key;
  if (
    isCanonicalProjectStage(stageKey) &&
    overview.current_stage.lifecycle !== "completed" &&
    overview.current_stage.product_key === "blueprint_basic"
  ) {
    return getProjectRoute(sessionId, stageKey);
  }

  return actionHrefOrProductRoute(sessionId, action) ?? getProjectProductRoute(sessionId, "blueprint");
}

export function persistLastVisitedProjectStage(sessionId: string, stage: LeanJourneyStage) {
  const current = loadStoredStages();
  current[sessionId] = stage;
  saveStoredStages(current);
}

export function getJourneyIndexFromSessionStage(stage: SessionStage) {
  return getJourneyIndex(getProjectStageFromSessionStage(stage));
}

export function getProjectStageFromSessionStage(stage: SessionStage) {
  return SESSION_STAGE_TO_PROJECT_STAGE[stage];
}

export function getPreferredProjectStage(
  session: Pick<SessionSummary, "current_stage" | "id">,
  snapshot: SessionSnapshot | null = null,
) {
  const accessibleStages = getAccessibleJourneyStages(session, snapshot);
  const storedStage = getStoredProjectStage(session.id);

  if (storedStage && accessibleStages.has(storedStage)) {
    return storedStage;
  }

  return recommendProjectStage(session, snapshot);
}

export function getSessionProjectRoute(
  session: Pick<SessionSummary, "current_stage" | "id">,
  snapshot: SessionSnapshot | null = null,
  overview: ProductJourneyOverview | null = null,
) {
  const overviewRoute = getProjectRouteFromJourneyOverview(session.id, overview);
  if (overviewRoute) {
    return overviewRoute;
  }

  if (!shouldOpenWorkStage(session, snapshot)) {
    return getProjectProductRoute(session.id, getProductLandingSection(snapshot));
  }

  return getSessionProjectWorkRoute(session, snapshot);
}

export function getSessionProjectWorkRoute(
  session: Pick<SessionSummary, "current_stage" | "id">,
  snapshot: SessionSnapshot | null = null,
) {
  return getProjectRoute(session.id, getPreferredProjectStage(session, snapshot));
}

export function getSessionStageLabel(stage: SessionStage, language: SessionLabelLanguage = "es") {
  return SESSION_STAGE_LABELS[stage][language];
}

export function getSessionStatusLabel(status: ArtifactStatus, language: SessionLabelLanguage = "es") {
  return SESSION_STATUS_LABELS[status][language];
}

export function getSessionStatusTone(status: ArtifactStatus) {
  return SESSION_STATUS_TONES[status];
}
