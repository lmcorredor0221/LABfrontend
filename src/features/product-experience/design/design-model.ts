import type { ProductExperienceRouteSnapshot } from "@/features/product-experience/core/server-state";
import { parseDefinitionArtifact } from "@/features/product-experience/define/define-model";
import { resolveDisplayCommercialTier } from "@/features/sessions/commercial-access";
import type {
  DesignAlternative,
  DesignRecommendationArtifact,
  DesignRequirementCoverageEntry,
  JourneyStageArtifactEntry,
} from "@/features/sessions/session-contracts";
import type { CommercialTier } from "@/features/sessions/types";

export type DesignSection = "alternatives" | "fit" | "coverage" | "critique" | "architecture";

export type DesignStageStatus =
  | "approved"
  | "blocked"
  | "empty"
  | "error"
  | "loading"
  | "processing"
  | "stale"
  | "waiting_review";

export type DesignSectionDefinition = {
  count: number;
  description: string;
  key: DesignSection;
  label: string;
};

export type DesignReadinessItem = {
  key: string;
  label: string;
  state: "done" | "blocked" | "pending";
};

export type DesignViewModel = {
  approvalBlockingIssues: string[];
  canApprove: boolean;
  canGenerate: boolean;
  commercialTier: CommercialTier;
  deferredIssueCount: number;
  design: DesignRecommendationArtifact | null;
  maturityScore: number;
  latestDefineArtifact: JourneyStageArtifactEntry | null;
  latestDesignArtifact: JourneyStageArtifactEntry | null;
  openIssueCount: number;
  projectTitle: string;
  readiness: DesignReadinessItem[];
  recommendedAlternative: DesignAlternative | null;
  selectedAlternative: DesignAlternative | null;
  sections: DesignSectionDefinition[];
  sessionId: string;
  snapshotUpdatedAt: string | null;
  status: DesignStageStatus;
  warnings: string[];
  warningItems: DesignWarningItem[];
};

export type DesignWarningItem = {
  impact: string;
  recovery: string;
  summary: string;
  technicalMessage: string;
  title: string;
};

export const DESIGN_SECTIONS: Array<Omit<DesignSectionDefinition, "count">> = [
  {
    description: "Comparador principal de arquitectura.",
    key: "alternatives",
    label: "Alternativas",
  },
  {
    description: "Matriz de ajuste por requisito.",
    key: "fit",
    label: "Fit",
  },
  {
    description: "Cobertura del diseno frente a requisitos.",
    key: "coverage",
    label: "Cobertura",
  },
  {
    description: "Findings, riesgos y remediacion.",
    key: "critique",
    label: "Critica",
  },
  {
    description: "Roles, handoffs, guardrails y fallos.",
    key: "architecture",
    label: "Arquitectura",
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function asArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

function isApprovedArtifact(artifact?: JourneyStageArtifactEntry | null) {
  return artifact?.state === "approved" || artifact?.state === "approved_legacy";
}

function hasStaleness(artifact?: JourneyStageArtifactEntry | null) {
  return artifact?.state === "stale" || Boolean(artifact?.stale_at) || Boolean(artifact?.stale_reasons?.length);
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function normalizePercentScore(value?: number | null): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.round(clamp(numeric <= 1 ? numeric * 100 : numeric, 0, 100));
}

function priorityWeight(priority?: string | null): number {
  switch (String(priority ?? "").toLowerCase()) {
    case "critical":
      return 1.45;
    case "high":
      return 1.25;
    case "low":
      return 0.75;
    default:
      return 1;
  }
}

function coverageWeight(status?: string | null): number {
  switch (String(status ?? "").toLowerCase()) {
    case "covered":
    case "done":
    case "accepted":
      return 1;
    case "partial":
    case "needs_review":
      return 0.55;
    case "not_covered":
    case "uncovered":
    case "missing":
    case "blocked":
      return 0;
    default:
      return 0.35;
  }
}

export function calculateCoveragePercent(coverage: DesignRequirementCoverageEntry[]): number {
  if (!coverage.length) {
    return 0;
  }

  const totals = coverage.reduce(
    (acc, entry) => {
      const weight = priorityWeight(entry.priority);
      acc.available += coverageWeight(entry.coverage_status) * weight;
      acc.total += weight;
      return acc;
    },
    { available: 0, total: 0 },
  );
  return normalizePercentScore(totals.total ? totals.available / totals.total : 0);
}

function average(values: number[]) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (!valid.length) {
    return 0;
  }
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

export function calculateSelectedFitPercent(
  design?: DesignRecommendationArtifact | null,
  selectedAlternative?: DesignAlternative | null,
): number {
  if (!design || !selectedAlternative) {
    return 0;
  }

  if (selectedAlternative.fit_score) {
    return normalizePercentScore(selectedAlternative.fit_score);
  }

  const scores = asArray(design.fit_matrix)
    .flatMap((entry) => asArray(entry.scores))
    .filter((score) => score.alternative_key === selectedAlternative.alternative_key)
    .map((score) => normalizePercentScore(score.score));
  return normalizePercentScore(average(scores));
}

export function calculateDesignMaturityScore(params: {
  approvalBlockingIssueCount: number;
  commercialTier?: CommercialTier;
  deferredIssueCount: number;
  design?: DesignRecommendationArtifact | null;
  selectedAlternative?: DesignAlternative | null;
  status: DesignStageStatus;
}): number {
  const { approvalBlockingIssueCount, commercialTier = "blueprint", deferredIssueCount, design, selectedAlternative, status } = params;
  if (!design) {
    return status === "blocked" ? 0 : 20;
  }

  const coverage = deriveCoverageForAlternative(design, selectedAlternative?.alternative_key ?? design.recommended_alternative_key);
  const coverageScore = calculateCoveragePercent(coverage);
  const fitScore = calculateSelectedFitPercent(design, selectedAlternative);
  const confidenceScore = normalizePercentScore(design.confidence?.overall);
  const structureScore = average([
    selectedAlternative ? 100 : 0,
    asArray(design.alternatives).length ? 100 : 0,
    asArray(design.fit_matrix).length ? 100 : 0,
    coverage.length ? 100 : 0,
  ]);
  const warningFindingCount = asArray(design.critic_findings).filter((finding) => finding.severity !== "blocking").length;
  const rawScore =
    commercialTier === "blueprint"
      ? (coverageScore * 0.44) + (fitScore * 0.3) + (structureScore * 0.2) + (confidenceScore * 0.06)
      : (coverageScore * 0.36) + (fitScore * 0.24) + (confidenceScore * 0.22) + (structureScore * 0.18);
  const deferredPenalty = commercialTier === "blueprint" ? 0 : Math.min(8, deferredIssueCount * 3);
  const warningPenalty = commercialTier === "blueprint" ? Math.min(3, warningFindingCount) : Math.min(6, warningFindingCount * 2);
  const penalty = Math.min(30, approvalBlockingIssueCount * 12) + deferredPenalty + warningPenalty;
  return Math.round(clamp(rawScore - penalty, 0, 100));
}

function capabilityLabel(capability: string) {
  switch (capability) {
    case "propose_agent_design":
      return "generar la propuesta de Disenar";
    case "critique_agent_design":
      return "evaluar la propuesta de Disenar";
    case "define_requirements":
    case "requirements_definition_skill":
      return "generar Definir";
    case "recommend_minimal_tools":
      return "recomendar Herramientas";
    case "recommend_memory_architecture":
      return "generar Memoria";
    default:
      return capability.replaceAll("_", " ");
  }
}

function extractCapabilityFromWarning(warning: string) {
  const match = warning.match(/(?:ejecutar|para)\s+([a-z0-9_]+)/i);
  return match?.[1]?.toLowerCase() ?? "";
}

function extractPolicyFromWarning(warning: string) {
  return warning.match(/policy=([a-z0-9_]+)/i)?.[1] ?? "";
}

export function explainRuntimeWarning(warning: string): DesignWarningItem {
  const technicalMessage = warning.trim();
  const capability = extractCapabilityFromWarning(technicalMessage);
  const policy = extractPolicyFromWarning(technicalMessage);
  const target = capabilityLabel(capability);

  if (/codex local/i.test(technicalMessage) && /no pudo ejecutar/i.test(technicalMessage)) {
    return {
      impact:
        policy === "blocked_until_critique_or_user_review"
          ? "La plataforma conserva una salida trazable y exige revision antes de promoverla."
          : "La propuesta puede continuar, pero la revision automatica no alcanzo el nivel esperado.",
      recovery:
        "Si necesitas elevar confianza, reintenta la etapa o revisa la configuracion del proveedor Codex local.",
      summary: `Codex local no completo ${target}. El sistema aplico la politica de recuperacion configurada y dejo evidencia para revision.`,
      technicalMessage,
      title: "Operacion LLM local con recuperacion",
    };
  }

  return {
    impact: "Puede afectar la confianza o trazabilidad de la etapa si no se revisa.",
    recovery: "Revisa la evidencia tecnica o reintenta la etapa si el resultado no es suficiente.",
    summary: technicalMessage,
    technicalMessage,
    title: "Advertencia de ejecucion",
  };
}

export function parseDesignSection(value?: string | null): DesignSection {
  return DESIGN_SECTIONS.some((section) => section.key === value) ? (value as DesignSection) : "alternatives";
}

export function parseDesignArtifact(artifact?: JourneyStageArtifactEntry | null): DesignRecommendationArtifact | null {
  if (!artifact || !isRecord(artifact.proposal_payload)) {
    return null;
  }

  const payload = artifact.proposal_payload;
  if (
    artifact.schema_version !== "design-recommendation.v1" &&
    payload.schema_version !== "design-recommendation.v1" &&
    !("alternatives" in payload)
  ) {
    return null;
  }

  return payload as unknown as DesignRecommendationArtifact;
}

export function getRecommendedAlternative(design?: DesignRecommendationArtifact | null) {
  if (!design) {
    return null;
  }

  return (
    asArray(design.alternatives).find((alternative) => alternative.alternative_key === design.recommended_alternative_key) ??
    asArray(design.alternatives)[0] ??
    null
  );
}

export function getSelectedAlternative(
  design?: DesignRecommendationArtifact | null,
  selectedKey?: string | null,
): DesignAlternative | null {
  if (!design) {
    return null;
  }

  const explicitSelection =
    selectedKey ??
    design.selected_design?.alternative_key ??
    design.recommended_alternative_key ??
    asArray(design.alternatives)[0]?.alternative_key ??
    null;

  return asArray(design.alternatives).find((alternative) => alternative.alternative_key === explicitSelection) ?? null;
}

export function applySelectedAlternative(
  design: DesignRecommendationArtifact,
  selectedKey: string,
): DesignRecommendationArtifact {
  const selected = getSelectedAlternative(design, selectedKey);
  return {
    ...design,
    selected_design: selected,
  };
}

export function deriveCoverageForAlternative(
  design: DesignRecommendationArtifact,
  selectedKey: string,
): DesignRequirementCoverageEntry[] {
  const directCoverage = asArray(design.requirements_coverage);
  if (directCoverage.length) {
    return directCoverage;
  }

  return asArray(design.fit_matrix).map((entry) => {
    const score = asArray(entry.scores).find((candidate) => candidate.alternative_key === selectedKey);
    return {
      category: entry.category,
      coverage_status: score?.coverage_status ?? "partial",
      priority: entry.priority,
      rationale: score?.rationale ?? "Cobertura inferida desde matriz de fit.",
      requirement_key: entry.requirement_key,
      requirement_title: entry.requirement_title,
      source_refs: [entry.requirement_key],
    };
  });
}

export function getDesignApprovalBlockingIssues(
  design?: DesignRecommendationArtifact | null,
  commercialTier: CommercialTier = "blueprint",
): string[] {
  if (!design || commercialTier === "blueprint") {
    return [];
  }

  return [
    ...asArray(design.open_questions).map((item) => `open_question:${item}`),
    ...asArray(design.missing_information).map((item) => `missing_information:${item}`),
    ...asArray(design.critic_findings)
      .filter((finding) => finding.severity === "blocking")
      .map((finding) => `blocking_finding:${finding.finding_key || finding.title}`),
  ];
}

export function getDesignDeferredIssueCount(
  design?: DesignRecommendationArtifact | null,
  commercialTier: CommercialTier = "blueprint",
): number {
  if (!design || commercialTier !== "blueprint") {
    return 0;
  }

  const blockingFindings = asArray(design.critic_findings).filter((finding) => finding.severity === "blocking").length;
  return asArray(design.open_questions).length + asArray(design.missing_information).length + blockingFindings;
}

export function buildDesignReadiness(
  design?: DesignRecommendationArtifact | null,
  commercialTier: CommercialTier = "blueprint",
): DesignReadinessItem[] {
  const selected = getSelectedAlternative(design);
  const openQuestions = asArray(design?.open_questions);
  const findings = asArray(design?.critic_findings);
  const strictQuestions = commercialTier !== "blueprint" ? openQuestions : [];
  const deferredQuestions = commercialTier === "blueprint" ? openQuestions : [];
  const strictBlockingFindings =
    commercialTier !== "blueprint" ? findings.filter((finding) => finding.severity === "blocking") : [];
  const deferredBlockingFindings =
    commercialTier === "blueprint" ? findings.filter((finding) => finding.severity === "blocking") : [];
  return [
    {
      key: "alternative",
      label: selected ? "Alternativa seleccionada" : "Seleccionar alternativa",
      state: selected ? "done" : "blocked",
    },
    {
      key: "fit_matrix",
      label: asArray(design?.fit_matrix).length ? "Matriz de fit disponible" : "Matriz de fit pendiente",
      state: asArray(design?.fit_matrix).length ? "done" : "pending",
    },
    {
      key: "questions",
      label: strictQuestions.length
        ? "Preguntas abiertas para Atencion"
        : deferredQuestions.length
          ? "Preguntas diferidas para Premium"
          : "Sin preguntas abiertas",
      state: strictQuestions.length ? "blocked" : deferredQuestions.length ? "pending" : "done",
    },
    {
      key: "findings",
      label: strictBlockingFindings.length
        ? "Findings bloqueantes"
        : deferredBlockingFindings.length
          ? "Findings diferidos para Premium"
        : "Findings sin bloqueo critico",
      state: strictBlockingFindings.length ? "blocked" : deferredBlockingFindings.length ? "pending" : "done",
    },
  ];
}

export function buildDesignViewModel(
  activeRoute: ProductExperienceRouteSnapshot | null,
  options: {
    draftDesign?: DesignRecommendationArtifact | null;
    processing?: boolean;
    selectedAlternativeKey?: string | null;
  } = {},
): DesignViewModel {
  const snapshotResource = activeRoute?.snapshot ?? null;
  const snapshot = snapshotResource?.data ?? null;
  const latestDefineArtifact = snapshot?.journey_latest_artifacts?.define ?? null;
  const latestDesignArtifact = snapshot?.journey_latest_artifacts?.design ?? null;
  const definition = parseDefinitionArtifact(latestDefineArtifact);
  const parsedDesign = parseDesignArtifact(latestDesignArtifact);
  const commercialTier = resolveDisplayCommercialTier(snapshot);
  const defineApproved = isApprovedArtifact(latestDefineArtifact);
  const stale = hasStaleness(latestDefineArtifact) || hasStaleness(latestDesignArtifact);
  const design =
    defineApproved && !stale && latestDesignArtifact?.state !== "rejected"
      ? (options.draftDesign ?? parsedDesign)
      : null;
  const recommendedAlternative = getRecommendedAlternative(design);
  const selectedAlternative = getSelectedAlternative(design, options.selectedAlternativeKey);
  const readiness = buildDesignReadiness(design, commercialTier);
  const approvalBlockingIssues = getDesignApprovalBlockingIssues(design, commercialTier);
  const deferredIssueCount = getDesignDeferredIssueCount(design, commercialTier);
  const openIssueCount = approvalBlockingIssues.length;
  const warnings = unique([
    ...asArray(latestDesignArtifact?.warnings),
    ...asArray(latestDesignArtifact?.stale_reasons),
    ...asArray(latestDefineArtifact?.stale_reasons),
  ]);
  const stageOperation = activeRoute?.operation?.data?.stageOperation ?? null;
  const isStageOperationActive =
    stageOperation?.stage_key === "design" &&
    (stageOperation.status === "queued" || stageOperation.status === "running");
  const isProcessing = Boolean(options.processing || isStageOperationActive);
  const status: DesignStageStatus = (() => {
    if (!snapshotResource || snapshotResource.status === "idle" || snapshotResource.status === "loading") {
      return "loading";
    }

    if (snapshotResource.status === "error") {
      return "error";
    }

    if (isProcessing) {
      return "processing";
    }

    if (!defineApproved || !definition) {
      return "blocked";
    }

    if (stale) {
      return "stale";
    }

    if (!design || !latestDesignArtifact || latestDesignArtifact.state === "rejected") {
      return "empty";
    }

    if (isApprovedArtifact(latestDesignArtifact)) {
      return "approved";
    }

    return "waiting_review";
  })();
  const sections = DESIGN_SECTIONS.map((section) => ({
    ...section,
    count:
      section.key === "alternatives"
        ? asArray(design?.alternatives).length
        : section.key === "fit"
          ? asArray(design?.fit_matrix).length
          : section.key === "coverage"
            ? asArray(design?.requirements_coverage).length
            : section.key === "critique"
              ? asArray(design?.critic_findings).length + asArray(design?.open_questions).length + asArray(design?.missing_information).length
              : selectedAlternative
                ? asArray(selectedAlternative.roles).length + asArray(selectedAlternative.handoffs).length + asArray(selectedAlternative.failure_modes).length
                : 0,
  }));

  return {
    approvalBlockingIssues,
    canApprove: Boolean(latestDesignArtifact && design && selectedAlternative && status === "waiting_review" && approvalBlockingIssues.length === 0),
    canGenerate: defineApproved && Boolean(definition) && status !== "processing",
    commercialTier,
    deferredIssueCount,
    design,
    latestDefineArtifact,
    latestDesignArtifact,
    maturityScore: calculateDesignMaturityScore({
      approvalBlockingIssueCount: approvalBlockingIssues.length,
      commercialTier,
      deferredIssueCount,
      design,
      selectedAlternative,
      status,
    }),
    openIssueCount,
    projectTitle: activeRoute?.operation.data?.overview?.project_title ?? snapshot?.session.title ?? "Proyecto LEAN",
    readiness,
    recommendedAlternative,
    selectedAlternative,
    sections,
    sessionId: activeRoute?.route.sessionId ?? snapshot?.session.id ?? "",
    snapshotUpdatedAt: snapshot?.session.updated_at ?? null,
    status,
    warnings,
    warningItems: warnings.map(explainRuntimeWarning),
  };
}
