import type { ProductExperienceRouteSnapshot } from "@/features/product-experience/core/server-state";
import { resolveDisplayCommercialTier } from "@/features/sessions/commercial-access";
import type { CommercialTier } from "@/features/sessions/types";
import type {
  ApprovedToolsDigest,
  JourneyStageArtifactEntry,
  MemoryRecommendationArtifact,
  MemoryRecommendationFinding,
} from "@/features/sessions/session-contracts";

export type MemorySection = "strategy" | "knowledge" | "budget" | "governance" | "dependencies";

export type MemoryStageStatus =
  | "approved"
  | "blocked"
  | "empty"
  | "error"
  | "loading"
  | "processing"
  | "stale"
  | "waiting_review";

export type MemoryBlocker = {
  detail: string;
  key: string;
  severity: "blocking" | "warning";
  title: string;
};

export type MemorySectionDefinition = {
  count: number;
  description: string;
  key: MemorySection;
  label: string;
};

export type MemoryViewModel = {
  approvedDigest: ApprovedToolsDigest | null;
  blockers: MemoryBlocker[];
  canApprove: boolean;
  canGenerate: boolean;
  commercialTier: CommercialTier;
  latestMemoryArtifact: JourneyStageArtifactEntry | null;
  latestToolsArtifact: JourneyStageArtifactEntry | null;
  memory: MemoryRecommendationArtifact | null;
  projectTitle: string;
  sections: MemorySectionDefinition[];
  sessionId: string;
  snapshotUpdatedAt: string | null;
  status: MemoryStageStatus;
  toolsApproved: boolean;
  warnings: string[];
};

export const MEMORY_SECTIONS: Array<Omit<MemorySectionDefinition, "count">> = [
  {
    description: "Decision principal de memoria.",
    key: "strategy",
    label: "Estrategia",
  },
  {
    description: "RAG, fuentes, ownership e ingestion.",
    key: "knowledge",
    label: "Conocimiento",
  },
  {
    description: "Presupuesto de contexto y recuperacion.",
    key: "budget",
    label: "Contexto",
  },
  {
    description: "Retencion, sensibilidad y reglas write/read.",
    key: "governance",
    label: "Gobernanza",
  },
  {
    description: "Dependencias de herramientas aprobadas.",
    key: "dependencies",
    label: "Dependencias",
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

function findingToBlocker(
  finding: MemoryRecommendationFinding,
  commercialTier: CommercialTier = "blueprint",
): MemoryBlocker {
  const isDeferredBasicFinding = commercialTier === "blueprint" && finding.severity === "blocking";
  return {
    detail: finding.suggested_action || finding.detail,
    key: finding.finding_key,
    severity: isDeferredBasicFinding ? "warning" : finding.severity === "blocking" ? "blocking" : "warning",
    title: finding.title,
  };
}

function hasApprovedTool(digest: ApprovedToolsDigest | null, toolKey: string) {
  return Boolean(digest?.approved_tool_keys.includes(toolKey));
}

export function parseMemorySection(value?: string | null): MemorySection {
  return MEMORY_SECTIONS.some((section) => section.key === value) ? (value as MemorySection) : "strategy";
}

export function parseMemoryArtifact(artifact?: JourneyStageArtifactEntry | null): MemoryRecommendationArtifact | null {
  if (!artifact || !isRecord(artifact.proposal_payload)) {
    return null;
  }

  const payload = artifact.proposal_payload;
  if (
    artifact.schema_version !== "memory-recommendation.v1" &&
    payload.schema_version !== "memory-recommendation.v1" &&
    !("memory_need_decision" in payload)
  ) {
    return null;
  }

  return payload as unknown as MemoryRecommendationArtifact;
}

export function buildRagDependencyBlockers(
  memory: MemoryRecommendationArtifact | null,
  digest: ApprovedToolsDigest | null,
): MemoryBlocker[] {
  if (!memory?.knowledge_design.rag_required) {
    return [];
  }

  const blockers: MemoryBlocker[] = [];
  const hasRetrieval = Boolean(digest?.knowledge_tool_keys.length) || hasApprovedTool(digest, "knowledge_retrieval");
  const hasDocumentIngestion = hasApprovedTool(digest, "document_ingestion");

  if (!hasRetrieval) {
    blockers.push({
      detail: "RAG requiere una herramienta aprobada de recuperacion de conocimiento antes de aprobar Memoria.",
      key: "rag_retrieval_tool_missing",
      severity: "blocking",
      title: "Falta knowledge retrieval aprobado",
    });
  }

  if (!hasDocumentIngestion) {
    blockers.push({
      detail: "RAG requiere document_ingestion aprobado para ingesta, refresh y lineage de fuentes.",
      key: "document_ingestion_missing",
      severity: "blocking",
      title: "Falta document_ingestion en Herramientas",
    });
  }

  return blockers;
}

export function buildMemoryBlockers(
  memory: MemoryRecommendationArtifact | null,
  digest: ApprovedToolsDigest | null,
  options: {
    commercialTier?: CommercialTier;
    stale?: boolean;
    toolsApproved?: boolean;
  } = {},
): MemoryBlocker[] {
  const blockers: MemoryBlocker[] = [];
  const commercialTier = options.commercialTier ?? "blueprint";

  if (!options.toolsApproved) {
    blockers.push({
      detail: "Promueve primero Herramientas para que Memoria consuma el digest canonico aprobado.",
      key: "tools_digest_required",
      severity: "blocking",
      title: "Tools debe estar aprobado",
    });
  }

  if (!memory) {
    blockers.push({
      detail: "Genera una propuesta vigente antes de aprobar Memoria.",
      key: "memory_recommendation_required",
      severity: "blocking",
      title: "Propuesta de Memoria pendiente",
    });
    return blockers;
  }

  if (options.stale || memory.is_stale) {
    blockers.push({
      detail: "La propuesta esta desactualizada por cambios aguas arriba; regenerala antes de aprobar.",
      key: "memory_stale",
      severity: "blocking",
      title: "Memoria desactualizada",
    });
  }

  if (memory.dry_compile_status.status === "blocked") {
    blockers.push(
      ...memory.dry_compile_status.blocking_issues.map((issue, index) => ({
        detail: issue,
        key: `dry_compile_${index}`,
        severity: "blocking" as const,
        title: "Compilacion seca bloqueada",
      })),
    );
  }

  blockers.push(
    ...asArray(memory.critic_findings)
      .filter((finding) => finding.severity === "blocking" || finding.severity === "warning")
      .map((finding) => findingToBlocker(finding, commercialTier)),
  );
  blockers.push(
    ...asArray(memory.tool_dependencies)
      .filter((dependency) => dependency.required && dependency.status === "missing")
      .map((dependency) => ({
        detail: dependency.reason,
        key: `tool_dependency_${dependency.tool_key}`,
        severity: "blocking" as const,
        title: `Falta herramienta requerida: ${dependency.tool_key}`,
      })),
  );
  blockers.push(...buildRagDependencyBlockers(memory, digest));

  return blockers.filter((blocker, index, list) => list.findIndex((item) => item.key === blocker.key) === index);
}

export function buildMemoryViewModel(
  activeRoute: ProductExperienceRouteSnapshot | null,
  options: {
    draftMemory?: MemoryRecommendationArtifact | null;
    processing?: boolean;
  } = {},
): MemoryViewModel {
  const snapshotResource = activeRoute?.snapshot ?? null;
  const snapshot = snapshotResource?.data ?? null;
  const latestToolsArtifact = snapshot?.journey_latest_artifacts?.tools ?? null;
  const latestMemoryArtifact = snapshot?.journey_latest_artifacts?.memory ?? null;
  const commercialTier = resolveDisplayCommercialTier(snapshot);
  const rawMemory = options.draftMemory ?? parseMemoryArtifact(latestMemoryArtifact);
  const rawApprovedDigest =
    snapshot?.latest_tool_recommendation?.approved_tools_digest ??
    ((latestToolsArtifact?.proposal_payload as { approved_tools_digest?: ApprovedToolsDigest | null } | undefined)?.approved_tools_digest ?? null);
  const toolsApproved = isApprovedArtifact(latestToolsArtifact) && !hasStaleness(latestToolsArtifact) && Boolean(rawApprovedDigest);
  const stale = hasStaleness(latestToolsArtifact) || hasStaleness(latestMemoryArtifact) || Boolean(rawMemory?.is_stale);
  const memory =
    toolsApproved && !stale && latestMemoryArtifact?.state !== "rejected"
      ? rawMemory
      : null;
  const approvedDigest = toolsApproved ? rawApprovedDigest : null;
  const blockers = buildMemoryBlockers(rawMemory, rawApprovedDigest, { commercialTier, stale, toolsApproved });
  const blockingCount = blockers.filter((blocker) => blocker.severity === "blocking").length;
  const stageOperation = activeRoute?.operation?.data?.stageOperation ?? null;
  const isStageOperationActive =
    stageOperation?.stage_key === "memory" &&
    (stageOperation.status === "queued" || stageOperation.status === "running");
  const isProcessing = Boolean(options.processing || isStageOperationActive);
  const status: MemoryStageStatus = (() => {
    if (!snapshotResource || snapshotResource.status === "idle" || snapshotResource.status === "loading") {
      return "loading";
    }

    if (snapshotResource.status === "error") {
      return "error";
    }

    if (isProcessing) {
      return "processing";
    }

    if (!toolsApproved) {
      return "blocked";
    }

    if (stale) {
      return "stale";
    }

    if (!memory || !latestMemoryArtifact || latestMemoryArtifact.state === "rejected") {
      return "empty";
    }

    if (isApprovedArtifact(latestMemoryArtifact)) {
      return "approved";
    }

    return "waiting_review";
  })();
  const sections = MEMORY_SECTIONS.map((section) => ({
    ...section,
    count:
      section.key === "strategy"
        ? memory ? 1 : 0
        : section.key === "knowledge"
          ? asArray(memory?.knowledge_design.approved_sources).length + (memory?.knowledge_design.rag_required ? 1 : 0)
          : section.key === "budget"
            ? asArray(memory?.context_budget_plan).length
            : section.key === "governance"
              ? asArray(memory?.write_read_matrix).length + asArray(memory?.retention_and_deletion).length + asArray(memory?.sensitivity_and_isolation).length
              : asArray(memory?.tool_dependencies).length,
  }));

  return {
    approvedDigest,
    blockers,
    canApprove: Boolean(latestMemoryArtifact && memory && status === "waiting_review" && blockingCount === 0),
    canGenerate: toolsApproved && status !== "processing",
    commercialTier,
    latestMemoryArtifact,
    latestToolsArtifact,
    memory,
    projectTitle: activeRoute?.operation.data?.overview?.project_title ?? snapshot?.session.title ?? "Proyecto LEAN",
    sections,
    sessionId: activeRoute?.route.sessionId ?? snapshot?.session.id ?? "",
    snapshotUpdatedAt: snapshot?.session.updated_at ?? null,
    status,
    toolsApproved,
    warnings: unique([
      ...asArray(latestMemoryArtifact?.warnings),
      ...asArray(latestMemoryArtifact?.stale_reasons),
      ...asArray(memory?.stale_reasons),
      ...asArray(latestToolsArtifact?.stale_reasons),
    ]),
  };
}
