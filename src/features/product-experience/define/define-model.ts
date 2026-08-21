import type { ProductExperienceRouteSnapshot } from "@/features/product-experience/core/server-state";
import type {
  CanvasArtifact,
  DefinitionArtifact,
  DefinitionEntityBase,
  DefinitionItemStatus,
  DefinitionValidationSummary,
  JourneyStageArtifactEntry,
  OpenQuestion,
} from "@/features/sessions/session-contracts";
import type { CommercialTier } from "@/features/sessions/types";

export type DefineSection = "summary" | "requirements" | "nfr" | "rules" | "criteria" | "questions" | "traceability";

export type DefineStageStatus =
  | "approved"
  | "blocked"
  | "empty"
  | "error"
  | "loading"
  | "processing"
  | "stale"
  | "waiting_review";

export type DefineSectionDefinition = {
  count: number;
  description: string;
  key: DefineSection;
  label: string;
};

export type DefineViewModel = {
  approvalBlockingIssues: string[];
  canApprove: boolean;
  canGenerate: boolean;
  canvas: CanvasArtifact | null;
  commercialTier: CommercialTier;
  deferredQualityIssues: string[];
  definition: DefinitionArtifact | null;
  discoveryApproved: boolean;
  latestDefineArtifact: JourneyStageArtifactEntry | null;
  latestDiscoverArtifact: JourneyStageArtifactEntry | null;
  actionableOpenQuestions: OpenQuestion[];
  openBlockerCount: number;
  projectTitle: string;
  sections: DefineSectionDefinition[];
  sessionId: string;
  snapshotUpdatedAt: string | null;
  status: DefineStageStatus;
  totalRequirementCount: number;
  traceableOpenQuestions: OpenQuestion[];
  validation: DefinitionValidationSummary;
  warnings: string[];
};

export const DEFINE_SECTIONS: Array<Omit<DefineSectionDefinition, "count">> = [
  {
    description: "Resumen, objetivos y Canvas proyectado.",
    key: "summary",
    label: "Resumen",
  },
  {
    description: "Requisitos funcionales priorizados.",
    key: "requirements",
    label: "Funcionales",
  },
  {
    description: "Requisitos no funcionales medibles.",
    key: "nfr",
    label: "NFR",
  },
  {
    description: "Reglas de negocio y ownership.",
    key: "rules",
    label: "Reglas",
  },
  {
    description: "Criterios, dependencias y supuestos.",
    key: "criteria",
    label: "Criterios",
  },
  {
    description: "Preguntas accionables segun el producto activo.",
    key: "questions",
    label: "Preguntas",
  },
  {
    description: "Rastro entre entradas y requisitos.",
    key: "traceability",
    label: "Trazabilidad",
  },
];

const EMPTY_VALIDATION: DefinitionValidationSummary = {
  blocking_issues: [],
  blocking_open_questions: [],
  contradictions: [],
  coverage_ratio: 0,
  duplicate_keys: [],
  duplicate_signals: [],
  missing_acceptance: [],
  untraced_items: [],
  vague_nfrs: [],
};

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

function getEntityRef(entity: DefinitionEntityBase) {
  return entity.key || entity.title;
}

function getDefinitionEntities(definition: DefinitionArtifact) {
  return [
    ...asArray(definition.functional_requirements),
    ...asArray(definition.non_functional_requirements),
    ...asArray(definition.business_rules),
    ...asArray(definition.acceptance_criteria),
    ...asArray(definition.dependencies),
    ...asArray(definition.assumptions),
    ...asArray(definition.open_questions),
  ];
}

function isResolvedQuestion(question: OpenQuestion) {
  return question.status === "accepted" || question.status === "rejected";
}

export function getActionableDefineOpenQuestions(
  definition?: DefinitionArtifact | null,
  commercialTier: CommercialTier = "blueprint",
): OpenQuestion[] {
  if (!definition || commercialTier === "blueprint") {
    return [];
  }

  return asArray(definition.open_questions).filter((question) => !isResolvedQuestion(question));
}

export function parseDefineSection(value?: string | null): DefineSection {
  return DEFINE_SECTIONS.some((section) => section.key === value) ? (value as DefineSection) : "summary";
}

export function parseDefinitionArtifact(artifact?: JourneyStageArtifactEntry | null): DefinitionArtifact | null {
  if (!artifact || !isRecord(artifact.proposal_payload)) {
    return null;
  }

  const payload = artifact.proposal_payload;
  if (
    artifact.schema_version !== "definition-artifact.v1" &&
    payload.schema_version !== "definition-artifact.v1" &&
    !("functional_requirements" in payload)
  ) {
    return null;
  }

  return payload as unknown as DefinitionArtifact;
}

export function deriveDefinitionValidation(definition?: DefinitionArtifact | null): DefinitionValidationSummary {
  if (!definition) {
    return EMPTY_VALIDATION;
  }

  const existing = definition.validation ?? EMPTY_VALIDATION;
  const entities = getDefinitionEntities(definition);
  const activeEntities = entities.filter((entity) => entity.status !== "rejected");
  const traceability = asArray(definition.traceability);
  const tracedRequirementKeys = new Set(traceability.map((entry) => entry.requirement_key));
  const entityKeys = activeEntities.map((entity) => entity.key).filter(Boolean);
  const duplicateKeys = unique(entityKeys.filter((key, index) => entityKeys.indexOf(key) !== index));
  const missingAcceptance = activeEntities
    .filter((entity) => entity.status !== "needs_input" && !asArray(entity.acceptance).length)
    .map(getEntityRef);
  const untracedItems = [
    ...asArray(definition.functional_requirements),
    ...asArray(definition.non_functional_requirements),
    ...asArray(definition.business_rules),
  ]
    .filter((entity) => entity.status !== "rejected")
    .filter((entity) => !asArray(entity.source_refs).length || !tracedRequirementKeys.has(entity.key))
    .map(getEntityRef);
  const vagueNfrs = asArray(definition.non_functional_requirements)
    .filter((item) => item.status !== "rejected")
    .filter((item) => !item.metric || !item.target || !/[0-9%]/.test(item.target))
    .map(getEntityRef);
  const blockingOpenQuestions = asArray(definition.open_questions)
    .filter((item) => item.blocking && item.status !== "accepted" && item.status !== "rejected")
    .map(getEntityRef);
  const blockingIssues = unique([
    ...asArray(existing.blocking_issues),
    ...blockingOpenQuestions.map((key) => `Resolver pregunta bloqueante: ${key}`),
    ...vagueNfrs.map((key) => `Medir NFR: ${key}`),
  ]);
  const coveredTraceEntries = traceability.filter((entry) => entry.coverage_status === "covered").length;

  return {
    blocking_issues: blockingIssues,
    blocking_open_questions: blockingOpenQuestions,
    contradictions: unique(asArray(existing.contradictions)),
    coverage_ratio: traceability.length ? Math.round((coveredTraceEntries / traceability.length) * 100) / 100 : 0,
    duplicate_keys: duplicateKeys,
    duplicate_signals: unique(asArray(existing.duplicate_signals)),
    missing_acceptance: unique(missingAcceptance),
    untraced_items: unique(untracedItems),
    vague_nfrs: unique(vagueNfrs),
  };
}

export function getDefineApprovalBlockingIssues(
  validation: DefinitionValidationSummary,
  commercialTier: CommercialTier = "blueprint",
): string[] {
  if (commercialTier === "blueprint") {
    return [];
  }

  return asArray(validation.blocking_issues);
}

export function getDefineDeferredQualityIssues(
  validation: DefinitionValidationSummary,
  commercialTier: CommercialTier = "blueprint",
): string[] {
  if (commercialTier !== "blueprint") {
    return [];
  }

  return asArray(validation.blocking_issues);
}

export function setOpenQuestionStatus(
  definition: DefinitionArtifact,
  questionKey: string,
  status: DefinitionItemStatus,
): DefinitionArtifact {
  const nextOpenQuestions = asArray(definition.open_questions).map((question): OpenQuestion => {
    if (question.key !== questionKey) {
      return question;
    }

    return {
      ...question,
      status,
    };
  });

  const nextDefinition: DefinitionArtifact = {
    ...definition,
    open_questions: nextOpenQuestions,
  };

  return {
    ...nextDefinition,
    validation: deriveDefinitionValidation(nextDefinition),
  };
}

export function buildDefineViewModel(
  activeRoute: ProductExperienceRouteSnapshot | null,
  options: {
    draftDefinition?: DefinitionArtifact | null;
    processing?: boolean;
  } = {},
): DefineViewModel {
  const snapshotResource = activeRoute?.snapshot ?? null;
  const snapshot = snapshotResource?.data ?? null;
  const latestDefineArtifact = snapshot?.journey_latest_artifacts?.define ?? null;
  const latestDiscoverArtifact = snapshot?.journey_latest_artifacts?.discover ?? null;
  const parsedDefinition = parseDefinitionArtifact(latestDefineArtifact);
  const rawDefinition = options.draftDefinition ?? parsedDefinition;
  const discoveryApproved = isApprovedArtifact(latestDiscoverArtifact);
  const stale = hasStaleness(latestDiscoverArtifact) || hasStaleness(latestDefineArtifact);
  const definition =
    discoveryApproved && !stale && latestDefineArtifact?.state !== "rejected"
      ? rawDefinition
      : null;
  const commercialTier = snapshot?.session.commercial_tier ?? "blueprint";
  const actionableOpenQuestions = getActionableDefineOpenQuestions(definition, commercialTier);
  const traceableOpenQuestions = asArray(definition?.open_questions);
  const validation = deriveDefinitionValidation(definition);
  const approvalBlockingIssues = getDefineApprovalBlockingIssues(validation, commercialTier);
  const deferredQualityIssues = getDefineDeferredQualityIssues(validation, commercialTier);
  const stageOperation = activeRoute?.operation?.data?.stageOperation ?? null;
  const isStageOperationActive =
    stageOperation?.stage_key === "define" &&
    (stageOperation.status === "queued" || stageOperation.status === "running");
  const isProcessing = Boolean(options.processing || isStageOperationActive);
  const status: DefineStageStatus = (() => {
    if (!snapshotResource || snapshotResource.status === "idle" || snapshotResource.status === "loading") {
      return "loading";
    }

    if (snapshotResource.status === "error") {
      return "error";
    }

    if (isProcessing) {
      return "processing";
    }

    if (!discoveryApproved) {
      return "blocked";
    }

    if (stale) {
      return "stale";
    }

    if (!definition || !latestDefineArtifact || latestDefineArtifact.state === "rejected") {
      return "empty";
    }

    if (isApprovedArtifact(latestDefineArtifact)) {
      return "approved";
    }

    return "waiting_review";
  })();
  const totalRequirementCount =
    asArray(definition?.functional_requirements).length +
    asArray(definition?.non_functional_requirements).length +
    asArray(definition?.business_rules).length +
    asArray(definition?.acceptance_criteria).length;
  const sections = DEFINE_SECTIONS.map((section) => ({
    ...section,
    count:
      section.key === "requirements"
        ? asArray(definition?.functional_requirements).length
        : section.key === "nfr"
          ? asArray(definition?.non_functional_requirements).length
          : section.key === "rules"
            ? asArray(definition?.business_rules).length
            : section.key === "criteria"
              ? asArray(definition?.acceptance_criteria).length + asArray(definition?.dependencies).length + asArray(definition?.assumptions).length
              : section.key === "questions"
                ? actionableOpenQuestions.length
                : section.key === "traceability"
                  ? asArray(definition?.traceability).length
                  : totalRequirementCount,
  }));

  return {
    approvalBlockingIssues,
    canApprove: Boolean(latestDefineArtifact && definition && status === "waiting_review" && approvalBlockingIssues.length === 0),
    canGenerate: discoveryApproved && status !== "processing",
    canvas: definition?.canvas_projection ?? snapshot?.canvas ?? null,
    commercialTier,
    deferredQualityIssues,
    definition,
    discoveryApproved,
    latestDefineArtifact,
    latestDiscoverArtifact,
    actionableOpenQuestions,
    openBlockerCount: validation.blocking_open_questions.length,
    projectTitle: activeRoute?.operation.data?.overview?.project_title ?? snapshot?.session.title ?? "Proyecto LEAN",
    sections,
    sessionId: activeRoute?.route.sessionId ?? snapshot?.session.id ?? "",
    snapshotUpdatedAt: snapshot?.session.updated_at ?? null,
    status,
    totalRequirementCount,
    traceableOpenQuestions,
    validation,
    warnings: [
      ...asArray(latestDefineArtifact?.warnings),
      ...asArray(latestDefineArtifact?.stale_reasons),
      ...asArray(latestDiscoverArtifact?.stale_reasons),
    ],
  };
}
