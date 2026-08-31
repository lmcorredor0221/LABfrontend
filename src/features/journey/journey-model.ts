import type { SessionSnapshot } from "@/features/sessions/types";

export const LEAN_JOURNEY_STAGE_ORDER = [
  "discover",
  "define",
  "design",
  "tools",
  "memory",
  "estimate",
  "validate",
  "package",
] as const;

export type LeanJourneyStage = (typeof LEAN_JOURNEY_STAGE_ORDER)[number];
export type LeanWorkStage = LeanJourneyStage;
export type LeanJourneyProduct = "blueprint" | "acp";

export const LEAN_EXPERIENCE_STAGE_ORDER = [
  "discover",
  "define",
  "design",
  "tools",
  "memory",
  "estimate",
  "blueprint_free_ready",
  "blueprint_pro_access_requested",
  "blueprint_pro_access_pending",
  "blueprint_pro_active",
  "acp_access_requested",
  "acp_access_pending",
  "acp_prep",
  "validate",
  "package",
  "completed",
] as const;

export type LeanExperienceStage = (typeof LEAN_EXPERIENCE_STAGE_ORDER)[number];
export type LeanExperienceProduct = "blueprint" | "blueprint_pro" | "acp";

export type LeanJourneyStep = {
  index: number;
  label: string;
  product: LeanJourneyProduct;
  stage: LeanJourneyStage;
  subtitle: string;
};

export const LEAN_JOURNEY_STEPS: readonly LeanJourneyStep[] = [
  { index: 1, product: "blueprint", stage: "discover", label: "Descubrir", subtitle: "Entender el problema" },
  { index: 2, product: "blueprint", stage: "define", label: "Definir", subtitle: "Objetivos y alcance" },
  { index: 3, product: "blueprint", stage: "design", label: "Disenar", subtitle: "Arquitectura y comportamiento" },
  { index: 4, product: "blueprint", stage: "tools", label: "Herramientas", subtitle: "Capacidades y contratos" },
  { index: 5, product: "blueprint", stage: "memory", label: "Memoria", subtitle: "Memoria y conocimiento" },
  { index: 6, product: "blueprint", stage: "estimate", label: "Estimar", subtitle: "Resultados Blueprint y ROI" },
  { index: 7, product: "acp", stage: "validate", label: "Validar", subtitle: "Pruebas, GAPs y gobernanza ACP" },
  { index: 8, product: "acp", stage: "package", label: "Package", subtitle: "Construccion y exportables ACP" },
] as const;

export const BLUEPRINT_JOURNEY_STAGES = LEAN_JOURNEY_STEPS.filter((step) => step.product === "blueprint").map(
  (step) => step.stage,
) as readonly LeanJourneyStage[];

export const ACP_JOURNEY_STAGES = LEAN_JOURNEY_STEPS.filter((step) => step.product === "acp").map(
  (step) => step.stage,
) as readonly LeanJourneyStage[];

export const BLUEPRINT_JOURNEY_STEPS = LEAN_JOURNEY_STEPS.filter((step) => step.product === "blueprint");
export const ACP_JOURNEY_STEPS = LEAN_JOURNEY_STEPS.filter((step) => step.product === "acp");

const JOURNEY_INDEX_BY_STAGE = Object.fromEntries(
  LEAN_JOURNEY_STEPS.map((step) => [step.stage, step.index]),
) as Record<LeanJourneyStage, number>;

const JOURNEY_PRODUCT_BY_STAGE = Object.fromEntries(
  LEAN_JOURNEY_STEPS.map((step) => [step.stage, step.product]),
) as Record<LeanJourneyStage, LeanJourneyProduct>;

export type LeanExperienceStep = {
  index: number;
  label: string;
  product: LeanExperienceProduct;
  stage: LeanExperienceStage;
  subtitle: string;
};

export const LEAN_EXPERIENCE_STEPS: readonly LeanExperienceStep[] = [
  { index: 1, product: "blueprint", stage: "discover", label: "Descubrir", subtitle: "Entender el problema" },
  { index: 2, product: "blueprint", stage: "define", label: "Definir", subtitle: "Objetivos y alcance" },
  { index: 3, product: "blueprint", stage: "design", label: "Disenar", subtitle: "Arquitectura y comportamiento" },
  { index: 4, product: "blueprint", stage: "tools", label: "Herramientas", subtitle: "Capacidades y contratos" },
  { index: 5, product: "blueprint", stage: "memory", label: "Memoria", subtitle: "Memoria y conocimiento" },
  { index: 6, product: "blueprint", stage: "estimate", label: "Estimar", subtitle: "Resultados Blueprint y ROI" },
  { index: 7, product: "blueprint", stage: "blueprint_free_ready", label: "Blueprint", subtitle: "Resultado listo para explorar" },
  { index: 8, product: "blueprint_pro", stage: "blueprint_pro_access_requested", label: "Solicitar Pro", subtitle: "Solicitud creada" },
  { index: 9, product: "blueprint_pro", stage: "blueprint_pro_access_pending", label: "Aprobacion Pro", subtitle: "Espera activacion comercial" },
  { index: 10, product: "blueprint_pro", stage: "blueprint_pro_active", label: "Blueprint Pro", subtitle: "Enriquecimiento y descarga" },
  { index: 11, product: "acp", stage: "acp_access_requested", label: "Solicitar ACP", subtitle: "Solicitud creada" },
  { index: 12, product: "acp", stage: "acp_access_pending", label: "Aprobacion ACP", subtitle: "Espera activacion comercial" },
  { index: 13, product: "acp", stage: "acp_prep", label: "ACP", subtitle: "Preparacion y decisiones" },
  { index: 14, product: "acp", stage: "validate", label: "Validar", subtitle: "Pruebas, GAPs y gobernanza ACP" },
  { index: 15, product: "acp", stage: "package", label: "Package", subtitle: "Construccion y exportables ACP" },
  { index: 16, product: "acp", stage: "completed", label: "Completado", subtitle: "Paquete premium descargable" },
] as const;

export const LEAN_WORK_STAGES = LEAN_JOURNEY_STAGE_ORDER;

const EXPERIENCE_INDEX_BY_STAGE = Object.fromEntries(
  LEAN_EXPERIENCE_STEPS.map((step) => [step.stage, step.index]),
) as Record<LeanExperienceStage, number>;

const EXPERIENCE_PRODUCT_BY_STAGE = Object.fromEntries(
  LEAN_EXPERIENCE_STEPS.map((step) => [step.stage, step.product]),
) as Record<LeanExperienceStage, LeanExperienceProduct>;

const EXPERIENCE_WORK_STAGE_BY_STAGE: Record<LeanExperienceStage, LeanWorkStage> = {
  discover: "discover",
  define: "define",
  design: "design",
  tools: "tools",
  memory: "memory",
  estimate: "estimate",
  blueprint_free_ready: "estimate",
  blueprint_pro_access_requested: "estimate",
  blueprint_pro_access_pending: "estimate",
  blueprint_pro_active: "estimate",
  acp_access_requested: "estimate",
  acp_access_pending: "estimate",
  acp_prep: "estimate",
  validate: "estimate",
  package: "estimate",
  completed: "estimate",
};

export function isLeanJourneyStage(value: string): value is LeanJourneyStage {
  return LEAN_JOURNEY_STAGE_ORDER.includes(value as LeanJourneyStage);
}

export function isLeanWorkStage(value: string): value is LeanWorkStage {
  return isLeanJourneyStage(value);
}

export function isLeanExperienceStage(value: string): value is LeanExperienceStage {
  return LEAN_EXPERIENCE_STAGE_ORDER.includes(value as LeanExperienceStage);
}

export function getJourneyIndex(stage: LeanJourneyStage) {
  return JOURNEY_INDEX_BY_STAGE[stage];
}

export function getJourneyProgress(stage: LeanJourneyStage) {
  return Math.round((getJourneyIndex(stage) / LEAN_JOURNEY_STEPS.length) * 100);
}

export function getProductProgress(stage: LeanJourneyStage) {
  const product = getJourneyProduct(stage);
  const steps = product === "blueprint" ? BLUEPRINT_JOURNEY_STEPS : ACP_JOURNEY_STEPS;
  const productIndex = steps.findIndex((step) => step.stage === stage) + 1;
  return productIndex > 0 ? Math.round((productIndex / steps.length) * 100) : 0;
}

export function getJourneyProduct(stage: LeanJourneyStage) {
  return JOURNEY_PRODUCT_BY_STAGE[stage];
}

export function isAcpJourneyStage(stage: LeanJourneyStage) {
  return getJourneyProduct(stage) === "acp";
}

export function getJourneyStep(stage: LeanJourneyStage) {
  return LEAN_JOURNEY_STEPS[getJourneyIndex(stage) - 1];
}

export function getExperienceJourneyIndex(stage: LeanExperienceStage) {
  return EXPERIENCE_INDEX_BY_STAGE[stage];
}

export function getExperienceJourneyProgress(stage: LeanExperienceStage) {
  return Math.round((getExperienceJourneyIndex(stage) / LEAN_EXPERIENCE_STEPS.length) * 100);
}

export function getExperienceJourneyProduct(stage: LeanExperienceStage) {
  return EXPERIENCE_PRODUCT_BY_STAGE[stage];
}

export function getExperienceJourneyStep(stage: LeanExperienceStage) {
  return LEAN_EXPERIENCE_STEPS[getExperienceJourneyIndex(stage) - 1];
}

export function resolveWorkStageForExperienceStage(stage: LeanExperienceStage): LeanWorkStage {
  return EXPERIENCE_WORK_STAGE_BY_STAGE[stage];
}

export function hasPendingGovernance(snapshot: SessionSnapshot | null) {
  if (!snapshot) {
    return false;
  }

  const hasPendingApprovals = snapshot.approvals.some((item) => item.status === "pending");
  const hasPendingHandoffs = snapshot.handoff_records.some((item) => item.status === "pending");
  const hasBlockingPolicies = snapshot.governance_policies.some((item) =>
    ["blocked", "violated"].includes(item.compliance_status),
  );

  return hasPendingApprovals || hasPendingHandoffs || hasBlockingPolicies;
}

export function hasToolingConfigured(snapshot: SessionSnapshot | null) {
  return Boolean(snapshot?.blueprint?.tools.length);
}

export function hasMemoryConfigured(snapshot: SessionSnapshot | null) {
  const profile = snapshot?.blueprint?.memory_profile;
  const knowledgeMode = snapshot?.blueprint?.knowledge_profile?.mode ?? "none";
  const knowledgeSources = snapshot?.blueprint?.knowledge_profile?.sources ?? [];
  const ragReady = knowledgeMode !== "rag" || knowledgeSources.length > 0;

  return Boolean(
    snapshot?.blueprint &&
      snapshot.blueprint.memory_strategy.trim() &&
      profile &&
      profile.storage_layers.length > 0 &&
      profile.write_policy.trim() &&
      profile.retrieval_policy.trim() &&
      ragReady,
  );
}

export function hasValidationEvidence(snapshot: SessionSnapshot | null) {
  return Boolean((snapshot?.simulation_runs ?? []).length || (snapshot?.evaluation_runs ?? []).length);
}

export function hasEstimationEvidence(snapshot: SessionSnapshot | null) {
  return Boolean(snapshot?.estimation_report && !snapshot.estimation_report.is_stale);
}

export function hasPackageEvidence(snapshot: SessionSnapshot | null) {
  if (!snapshot) {
    return false;
  }

  if (snapshot.session.current_stage === "ready_for_export") {
    return true;
  }

  return (snapshot.artifact_records ?? []).some((item) =>
    [
      "acp_preview",
      "acp_zip_export",
      "blueprint_core_export",
      "construction_pack_export",
      "prompt_pack_export",
      "estimation_pack_export",
    ].includes(item.artifact_key),
  );
}
