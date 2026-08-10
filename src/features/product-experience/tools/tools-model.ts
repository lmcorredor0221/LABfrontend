import type { ProductExperienceRouteSnapshot } from "@/features/product-experience/core/server-state";
import type {
  ApprovedToolsDigest,
  JourneyStageArtifactEntry,
  ToolRecommendationArtifact,
  ToolRecommendationEntry,
  ToolRecommendationFinding,
  ToolRecommendationGap,
} from "@/features/sessions/session-contracts";

export type ToolsSection = "decisions" | "coverage" | "catalog" | "contracts";

export type ToolsStageStatus =
  | "approved"
  | "blocked"
  | "empty"
  | "error"
  | "loading"
  | "processing"
  | "stale"
  | "waiting_review";

export type ToolsDecisionItem = {
  action: string;
  detail: string;
  key: string;
  severity: "info" | "warning" | "blocking";
  source: "gap" | "finding" | "needs_information";
  title: string;
};

export type ToolsSectionDefinition = {
  count: number;
  description: string;
  key: ToolsSection;
  label: string;
};

export type ToolsViewModel = {
  approvedDigest: ApprovedToolsDigest | null;
  canGenerate: boolean;
  canPromote: boolean;
  decisions: ToolsDecisionItem[];
  designApproved: boolean;
  latestDesignArtifact: JourneyStageArtifactEntry | null;
  latestToolsArtifact: JourneyStageArtifactEntry | null;
  optionalTools: ToolRecommendationEntry[];
  projectTitle: string;
  recommendation: ToolRecommendationArtifact | null;
  recommendedTools: ToolRecommendationEntry[];
  rejectedTools: ToolRecommendationEntry[];
  sections: ToolsSectionDefinition[];
  sessionId: string;
  snapshotUpdatedAt: string | null;
  status: ToolsStageStatus;
  warnings: string[];
};

export const TOOLS_SECTIONS: Array<Omit<ToolsSectionDefinition, "count">> = [
  {
    description: "Gaps, findings y decisiones pendientes.",
    key: "decisions",
    label: "Decisiones",
  },
  {
    description: "Cobertura de requisitos y roles.",
    key: "coverage",
    label: "Cobertura",
  },
  {
    description: "Set minimo y herramientas opcionales.",
    key: "catalog",
    label: "Catalogo",
  },
  {
    description: "Contratos, bindings y riesgos operativos.",
    key: "contracts",
    label: "Contratos",
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

function toDecisionFromGap(source: "gap" | "needs_information", gap: ToolRecommendationGap): ToolsDecisionItem {
  return {
    action: gap.question,
    detail: gap.reason || gap.impact,
    key: gap.gap_key,
    severity: gap.severity === "blocking" ? "blocking" : gap.severity === "warning" ? "warning" : "info",
    source,
    title: gap.title,
  };
}

function toDecisionFromFinding(finding: ToolRecommendationFinding): ToolsDecisionItem {
  return {
    action: finding.suggested_action,
    detail: finding.detail,
    key: finding.finding_key,
    severity: finding.severity,
    source: "finding",
    title: finding.title,
  };
}

export function parseToolsSection(value?: string | null): ToolsSection {
  return TOOLS_SECTIONS.some((section) => section.key === value) ? (value as ToolsSection) : "decisions";
}

export function parseToolsArtifact(
  artifact?: JourneyStageArtifactEntry | null,
  fallback?: ToolRecommendationArtifact | null,
): ToolRecommendationArtifact | null {
  if (artifact && isRecord(artifact.proposal_payload)) {
    const payload = artifact.proposal_payload;
    if (
      artifact.schema_version === "tool-recommendation.v1" ||
      payload.schema_version === "tool-recommendation.v1" ||
      "recommended_tools" in payload
    ) {
      return payload as unknown as ToolRecommendationArtifact;
    }
  }

  return fallback ?? null;
}

export function mergeToolsArtifactState(
  artifact: JourneyStageArtifactEntry | null,
  recommendation: ToolRecommendationArtifact | null,
): ToolRecommendationArtifact | null {
  if (!recommendation) {
    return null;
  }

  const staleReasons = unique([...(recommendation.stale_reasons ?? []), ...(artifact?.stale_reasons ?? [])]);
  return {
    ...recommendation,
    is_stale: recommendation.is_stale || hasStaleness(artifact),
    stale_reasons: staleReasons,
  };
}

export function buildToolsDecisions(recommendation?: ToolRecommendationArtifact | null): ToolsDecisionItem[] {
  if (!recommendation) {
    return [];
  }

  return [
    ...asArray(recommendation.coverage_gaps).map((gap) => toDecisionFromGap("gap", gap)),
    ...asArray(recommendation.needs_information).map((gap) => toDecisionFromGap("needs_information", gap)),
    ...asArray(recommendation.evaluation?.findings).map(toDecisionFromFinding),
  ];
}

export function buildToolsViewModel(
  activeRoute: ProductExperienceRouteSnapshot | null,
  options: {
    processing?: boolean;
  } = {},
): ToolsViewModel {
  const snapshotResource = activeRoute?.snapshot ?? null;
  const snapshot = snapshotResource?.data ?? null;
  const latestDesignArtifact = snapshot?.journey_latest_artifacts?.design ?? null;
  const latestToolsArtifact = snapshot?.journey_latest_artifacts?.tools ?? null;
  const persistedRecommendation = snapshot?.latest_tool_recommendation ?? null;
  const designApproved = isApprovedArtifact(latestDesignArtifact);
  const stale = hasStaleness(latestDesignArtifact) || hasStaleness(latestToolsArtifact);
  const recommendation =
    designApproved && !stale && latestToolsArtifact?.state !== "rejected"
      ? mergeToolsArtifactState(
          latestToolsArtifact,
          parseToolsArtifact(latestToolsArtifact, persistedRecommendation),
        )
      : null;
  const approvedDigest =
    designApproved && !stale
      ? (recommendation?.approved_tools_digest ?? persistedRecommendation?.approved_tools_digest ?? null)
      : null;
  const decisions = buildToolsDecisions(recommendation);
  const promotionBlocked = Boolean(recommendation?.evaluation?.promotion_blocked);
  const status: ToolsStageStatus = (() => {
    if (!snapshotResource || snapshotResource.status === "idle" || snapshotResource.status === "loading") {
      return "loading";
    }

    if (snapshotResource.status === "error") {
      return "error";
    }

    if (options.processing) {
      return "processing";
    }

    if (!designApproved) {
      return "blocked";
    }

    if (stale) {
      return "stale";
    }

    if (isApprovedArtifact(latestToolsArtifact) && approvedDigest) {
      return "approved";
    }

    if (!recommendation || !latestToolsArtifact || latestToolsArtifact.state === "rejected") {
      return "empty";
    }

    return "waiting_review";
  })();
  const recommendedTools = asArray(recommendation?.recommended_tools);
  const optionalTools = asArray(recommendation?.optional_tools);
  const rejectedTools = asArray(recommendation?.rejected_tools);
  const sections = TOOLS_SECTIONS.map((section) => ({
    ...section,
    count:
      section.key === "decisions"
        ? decisions.length
        : section.key === "coverage"
          ? asArray(recommendation?.requirements_coverage).length + asArray(recommendation?.design_role_coverage).length
          : section.key === "catalog"
            ? recommendedTools.length + optionalTools.length + rejectedTools.length
            : recommendedTools.filter((tool) => tool.contract_seed).length + optionalTools.filter((tool) => tool.contract_seed).length,
  }));

  return {
    approvedDigest,
    canGenerate: designApproved && status !== "processing",
    canPromote: Boolean(
      latestToolsArtifact &&
        recommendation &&
        status === "waiting_review" &&
        !promotionBlocked &&
        !recommendation.is_stale,
    ),
    decisions,
    designApproved,
    latestDesignArtifact,
    latestToolsArtifact,
    optionalTools,
    projectTitle: activeRoute?.operation.data?.overview?.project_title ?? snapshot?.session.title ?? "Proyecto LEAN",
    recommendation,
    recommendedTools,
    rejectedTools,
    sections,
    sessionId: activeRoute?.route.sessionId ?? snapshot?.session.id ?? "",
    snapshotUpdatedAt: snapshot?.session.updated_at ?? null,
    status,
    warnings: unique([
      ...asArray(latestToolsArtifact?.warnings),
      ...asArray(latestToolsArtifact?.stale_reasons),
      ...asArray(recommendation?.stale_reasons),
      ...asArray(latestDesignArtifact?.stale_reasons),
    ]),
  };
}
