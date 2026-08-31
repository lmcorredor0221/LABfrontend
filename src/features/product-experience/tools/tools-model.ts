import type { ProductExperienceRouteSnapshot } from "@/features/product-experience/core/server-state";
import { resolveDisplayCommercialTier } from "@/features/sessions/commercial-access";
import type {
  ApprovedToolsDigest,
  JourneyStageArtifactEntry,
  ToolRecommendationArtifact,
  ToolRecommendationEntry,
  ToolRecommendationFinding,
  ToolRecommendationGap,
} from "@/features/sessions/session-contracts";
import type { CommercialTier } from "@/features/sessions/types";

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

export type ToolsDecisionReference = {
  key: string;
  source: "gap" | "finding" | "needs_information";
  title: string;
};

export type ToolsDecisionItem = {
  action: string;
  detail: string;
  key: string;
  mode: "assumption" | "enrichment" | "required" | "blocker";
  occurrenceCount: number;
  severity: "info" | "warning" | "blocking";
  source: "gap" | "finding" | "needs_information";
  sourceReferences: ToolsDecisionReference[];
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
  commercialTier: CommercialTier;
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

function resolveCommercialTier(activeRoute: ProductExperienceRouteSnapshot | null): CommercialTier {
  const snapshot = activeRoute?.snapshot.data ?? null;
  const tier = resolveDisplayCommercialTier(snapshot);
  return tier === "blueprint_pro" || tier === "acp" ? tier : "blueprint";
}

function getDecisionMode(
  tier: CommercialTier,
  source: ToolsDecisionItem["source"],
  severity: ToolsDecisionItem["severity"],
): ToolsDecisionItem["mode"] {
  if (tier === "blueprint") {
    return "enrichment";
  }

  return severity === "blocking" ? "blocker" : "required";
}

function toDecisionFromGap(
  source: "gap" | "needs_information",
  gap: ToolRecommendationGap,
  tier: CommercialTier,
): ToolsDecisionItem {
  const severity: ToolsDecisionItem["severity"] =
    tier === "blueprint"
      ? (gap.severity === "blocking" ? "warning" : gap.severity === "warning" ? "warning" : "info")
      : (gap.severity === "blocking" ? "blocking" : gap.severity === "warning" ? "warning" : "info");
  const action =
    tier === "blueprint"
      ? (gap.question ? `${gap.question} · Diferido a [Enriquecer en Premium]` : "Diferido a [Enriquecer en Premium]")
      : gap.question;
  return {
    action,
    detail: gap.reason || gap.impact,
    key: gap.gap_key,
    mode: getDecisionMode(tier, source, severity),
    occurrenceCount: 1,
    severity,
    source,
    sourceReferences: [{ key: gap.gap_key, source, title: gap.title }],
    title: gap.title,
  };
}

function toDecisionFromFinding(finding: ToolRecommendationFinding, tier: CommercialTier): ToolsDecisionItem {
  const severity: ToolsDecisionItem["severity"] =
    tier === "blueprint"
      ? (finding.severity === "blocking" ? "warning" : finding.severity)
      : finding.severity;
  const action =
    tier === "blueprint"
      ? (finding.suggested_action ? `${finding.suggested_action} · Diferido a [Enriquecer en Premium]` : "Diferido a [Enriquecer en Premium]")
      : finding.suggested_action;
  return {
    action,
    detail: finding.detail,
    key: finding.finding_key,
    mode: getDecisionMode(tier, "finding", severity),
    occurrenceCount: 1,
    severity,
    source: "finding",
    sourceReferences: [{ key: finding.finding_key, source: "finding", title: finding.title }],
    title: finding.title,
  };
}

const SEVERITY_RANK: Record<ToolsDecisionItem["severity"], number> = {
  info: 0,
  warning: 1,
  blocking: 2,
};

const MODE_RANK: Record<ToolsDecisionItem["mode"], number> = {
  assumption: 0,
  enrichment: 1,
  required: 2,
  blocker: 3,
};

function normalizeDecisionText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function stableHash(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(36);
}

function decisionFingerprint(item: ToolsDecisionItem) {
  const topic = normalizeDecisionText(item.title);
  const message = normalizeDecisionText([item.detail, item.action].filter(Boolean).join(" "));
  return [topic, message].filter(Boolean).join("|");
}

function mergeDecisionReferences(
  current: ToolsDecisionReference[],
  incoming: ToolsDecisionReference[],
): ToolsDecisionReference[] {
  const merged = new Map<string, ToolsDecisionReference>();
  for (const reference of [...current, ...incoming]) {
    const key = `${reference.source}:${reference.key || reference.title}`;
    if (!merged.has(key)) {
      merged.set(key, reference);
    }
  }
  return Array.from(merged.values());
}

export function consolidateToolsDecisions(items: ToolsDecisionItem[]): ToolsDecisionItem[] {
  const consolidated = new Map<string, ToolsDecisionItem>();

  for (const item of items) {
    const fingerprint = decisionFingerprint(item);
    const existing = consolidated.get(fingerprint);
    if (!existing) {
      consolidated.set(fingerprint, {
        ...item,
        key: `decision:${stableHash(fingerprint || item.key)}`,
        occurrenceCount: item.occurrenceCount || 1,
        sourceReferences: mergeDecisionReferences([], item.sourceReferences),
      });
      continue;
    }

    const higherSeverity =
      SEVERITY_RANK[item.severity] > SEVERITY_RANK[existing.severity] ? item.severity : existing.severity;
    const higherMode = MODE_RANK[item.mode] > MODE_RANK[existing.mode] ? item.mode : existing.mode;
    consolidated.set(fingerprint, {
      ...existing,
      action: existing.action || item.action,
      detail: existing.detail || item.detail,
      mode: higherMode,
      occurrenceCount: existing.occurrenceCount + (item.occurrenceCount || 1),
      severity: higherSeverity,
      sourceReferences: mergeDecisionReferences(existing.sourceReferences, item.sourceReferences),
    });
  }

  return Array.from(consolidated.values());
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

export function buildToolsDecisions(
  recommendation?: ToolRecommendationArtifact | null,
  tier: CommercialTier = "blueprint",
): ToolsDecisionItem[] {
  if (!recommendation) {
    return [];
  }

  return consolidateToolsDecisions([
    ...asArray(recommendation.coverage_gaps).map((gap) => toDecisionFromGap("gap", gap, tier)),
    ...asArray(recommendation.needs_information).map((gap) => toDecisionFromGap("needs_information", gap, tier)),
    ...asArray(recommendation.evaluation?.findings).map((finding) => toDecisionFromFinding(finding, tier)),
  ]);
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
  const commercialTier = resolveCommercialTier(activeRoute);
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
  const decisions = buildToolsDecisions(recommendation, commercialTier);
  const promotionBlocked = Boolean(recommendation?.evaluation?.promotion_blocked);
  const shouldBlockPromotion = commercialTier === "blueprint" ? false : promotionBlocked;
  const stageOperation = activeRoute?.operation?.data?.stageOperation ?? null;
  const isStageOperationActive =
    stageOperation?.stage_key === "tools" &&
    (stageOperation.status === "queued" || stageOperation.status === "running");
  const isProcessing = Boolean(options.processing || isStageOperationActive);
  const status: ToolsStageStatus = (() => {
    if (!snapshotResource || snapshotResource.status === "idle" || snapshotResource.status === "loading") {
      return "loading";
    }

    if (snapshotResource.status === "error") {
      return "error";
    }

    if (isProcessing) {
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
        !shouldBlockPromotion &&
        !recommendation.is_stale,
    ),
    commercialTier,
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
