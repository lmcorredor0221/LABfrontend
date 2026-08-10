import type { ProductExperienceRouteSnapshot } from "@/features/product-experience/core/server-state";
import { parseDefinitionArtifact } from "@/features/product-experience/define/define-model";
import type {
  DesignAlternative,
  DesignRecommendationArtifact,
  DesignRequirementCoverageEntry,
  JourneyStageArtifactEntry,
} from "@/features/sessions/session-contracts";

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
  canApprove: boolean;
  canGenerate: boolean;
  design: DesignRecommendationArtifact | null;
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

export function buildDesignReadiness(design?: DesignRecommendationArtifact | null): DesignReadinessItem[] {
  const selected = getSelectedAlternative(design);
  const openQuestions = asArray(design?.open_questions);
  const findings = asArray(design?.critic_findings);
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
      label: openQuestions.length ? "Preguntas abiertas para Atencion" : "Sin preguntas abiertas",
      state: openQuestions.length ? "blocked" : "done",
    },
    {
      key: "findings",
      label: findings.some((finding) => finding.severity === "blocking")
        ? "Findings bloqueantes"
        : "Findings sin bloqueo critico",
      state: findings.some((finding) => finding.severity === "blocking") ? "blocked" : "done",
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
  const defineApproved = isApprovedArtifact(latestDefineArtifact);
  const stale = hasStaleness(latestDefineArtifact) || hasStaleness(latestDesignArtifact);
  const design =
    defineApproved && !stale && latestDesignArtifact?.state !== "rejected"
      ? (options.draftDesign ?? parsedDesign)
      : null;
  const recommendedAlternative = getRecommendedAlternative(design);
  const selectedAlternative = getSelectedAlternative(design, options.selectedAlternativeKey);
  const readiness = buildDesignReadiness(design);
  const blockingFindingCount = asArray(design?.critic_findings).filter((finding) => finding.severity === "blocking").length;
  const openIssueCount = asArray(design?.open_questions).length + blockingFindingCount + asArray(design?.missing_information).length;
  const status: DesignStageStatus = (() => {
    if (!snapshotResource || snapshotResource.status === "idle" || snapshotResource.status === "loading") {
      return "loading";
    }

    if (snapshotResource.status === "error") {
      return "error";
    }

    if (options.processing) {
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
    canApprove: Boolean(latestDesignArtifact && design && selectedAlternative && status === "waiting_review" && openIssueCount === 0),
    canGenerate: defineApproved && Boolean(definition) && status !== "processing",
    design,
    latestDefineArtifact,
    latestDesignArtifact,
    openIssueCount,
    projectTitle: activeRoute?.operation.data?.overview?.project_title ?? snapshot?.session.title ?? "Proyecto LEAN",
    readiness,
    recommendedAlternative,
    selectedAlternative,
    sections,
    sessionId: activeRoute?.route.sessionId ?? snapshot?.session.id ?? "",
    snapshotUpdatedAt: snapshot?.session.updated_at ?? null,
    status,
    warnings: unique([
      ...asArray(latestDesignArtifact?.warnings),
      ...asArray(latestDesignArtifact?.stale_reasons),
      ...asArray(latestDefineArtifact?.stale_reasons),
    ]),
  };
}
