import {
  buildBlueprintArtifactHighlights,
  buildBlueprintComparisonSummary,
  canDownloadBlueprintProfessional,
  resolveBlueprintProfessionalDownloadState,
} from "@/features/blueprint/blueprint-results-adapter";
import type { ProductExperienceRouteSnapshot } from "@/features/product-experience/core/server-state";
import type { ProductExperienceProductSection } from "@/features/product-experience/shell/experience-model";
import type {
  EstimationConstructionScenario,
  EvaluationRunEntry,
  JourneyStageArtifactEntry,
  SimulationRunRecord,
} from "@/features/sessions/session-contracts";
import type {
  CommercialTier,
  ProductOverviewItem,
  SessionCommercialAccess,
  SessionSnapshot,
} from "@/features/sessions/types";
import type { SupportedLanguage } from "@/core/i18n/language-context";

export type SaasTone = "success" | "warning" | "danger" | "info" | "neutral";

export type ProductStageCard = {
  detail: string;
  href: string;
  key: string;
  label: string;
  progress: number;
  tone: SaasTone;
};

export type ProductMetric = {
  detail: string;
  key: string;
  label: string;
  tone: SaasTone;
  value: string;
};

export type ProductRequirement = {
  detail: string;
  key: string;
  label: string;
  tone: SaasTone;
};

export type ProductReadinessSummary = {
  blockers: string[];
  detail: string;
  metrics: ProductMetric[];
  nextHref: string;
  nextLabel: string;
  stateLabel: string;
  tone: SaasTone;
};

export type ProductSaasViewModel = {
  access: SessionCommercialAccess | null;
  accessTier: CommercialTier;
  activityItems: Array<{
    detail: string;
    key: string;
    label: string;
    time: string;
    tone: SaasTone;
  }>;
  artifactCards: Array<{
    contentText: string;
    detail: string;
    exportFormat: string;
    isCommercial: boolean;
    isDiagram: boolean;
    key: string;
    label: string;
    metadata: Record<string, unknown>;
    stage: string;
    versionLabel: string;
  }>;
  blueprintComparison: ReturnType<typeof buildBlueprintComparisonSummary>;
  blueprintDownload: ReturnType<typeof resolveBlueprintProfessionalDownloadState>;
  blueprintHighlights: ReturnType<typeof buildBlueprintArtifactHighlights>;
  canDownloadBlueprint: boolean;
  estimate: ProductReadinessSummary;
  package: ProductReadinessSummary;
  products: ProductStageCard[];
  section: ProductExperienceProductSection;
  title: string;
  validation: ProductReadinessSummary;
};

const TIER_RANK: Record<CommercialTier, number> = {
  acp: 3,
  blueprint: 1,
  blueprint_pro: 2,
};

function copy(language: SupportedLanguage, en: string, es: string, pt: string) {
  if (language === "en") {
    return en;
  }

  if (language === "pt") {
    return pt;
  }

  return es;
}

function getSnapshot(activeRoute: ProductExperienceRouteSnapshot | null): SessionSnapshot | null {
  return activeRoute?.snapshot.data ?? null;
}

function getProductOverviewItems(activeRoute: ProductExperienceRouteSnapshot | null): ProductOverviewItem[] {
  return activeRoute?.operation.data?.overview?.products ?? [];
}

function unwrapArtifact<TArtifact>(value: TArtifact | { data?: TArtifact | null } | null | undefined): TArtifact | null {
  if (!value) {
    return null;
  }

  if (typeof value === "object" && "data" in value) {
    return (value as { data?: TArtifact | null }).data ?? null;
  }

  return value as TArtifact;
}

function asAccessTier(access?: SessionCommercialAccess | null): CommercialTier {
  return access?.tier ?? "blueprint";
}

function normalizePercent(value: number | null | undefined) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value ?? 0)));
}

export function formatPercent(value: number | null | undefined) {
  return `${normalizePercent(value)}%`;
}

export function formatHours(value: number | null | undefined) {
  if (!Number.isFinite(value)) {
    return "0 h";
  }

  return `${Math.round(value ?? 0).toLocaleString("es-CO")} h`;
}

export function formatWeeks(value: number | null | undefined) {
  if (!Number.isFinite(value)) {
    return "0 sem";
  }

  const rounded = Math.round((value ?? 0) * 10) / 10;
  return `${rounded.toLocaleString("es-CO")} sem`;
}

export function formatMoney(value: number | null | undefined) {
  if (!Number.isFinite(value)) {
    return "$ 0 COP";
  }

  return new Intl.NumberFormat("es-CO", {
    currency: "COP",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value ?? 0);
}

function toneFromAccess(accessState: string): SaasTone {
  if (accessState === "unlocked" || accessState === "active" || accessState === "available") {
    return "success";
  }

  if (accessState.includes("locked") || accessState.includes("required")) {
    return "warning";
  }

  return "info";
}

function getProductCards(
  activeRoute: ProductExperienceRouteSnapshot | null,
  sessionId: string,
  language: SupportedLanguage,
): ProductStageCard[] {
  const items = getProductOverviewItems(activeRoute);

  if (items.length) {
    return items.map((item) => ({
      detail: item.detail,
      href: item.href || `/projects/${sessionId}`,
      key: item.key,
      label: item.label,
      progress: normalizePercent(item.progress_percent),
      tone: toneFromAccess(item.access_state || item.status),
    }));
  }

  return [
    {
      detail: copy(
        language,
        "Protected viewing inside the platform.",
        "Visualizacion protegida dentro de la plataforma.",
        "Visualizacao protegida dentro da plataforma.",
      ),
      href: `/projects/${sessionId}/blueprint`,
      key: "blueprint",
      label: "Blueprint",
      progress: 0,
      tone: "info",
    },
    {
      detail: copy(
        language,
        "Downloadable documentation and professional edition.",
        "Documentacion descargable y version profesional.",
        "Documentacao baixavel e versao profissional.",
      ),
      href: `/projects/${sessionId}/blueprint/pro`,
      key: "blueprint_pro",
      label: "Blueprint Pro",
      progress: 0,
      tone: "warning",
    },
    {
      detail: copy(
        language,
        "Portable package to start agentic construction.",
        "Paquete portable para iniciar construccion agentica.",
        "Pacote portavel para iniciar a construcao agentica.",
      ),
      href: `/projects/${sessionId}/acp`,
      key: "acp",
      label: "ACP",
      progress: 0,
      tone: "info",
    },
  ];
}

function latestEvaluationRun(snapshot: SessionSnapshot | null): EvaluationRunEntry | null {
  return snapshot?.evaluation_runs?.[0] ?? null;
}

function latestSimulationRun(snapshot: SessionSnapshot | null): SimulationRunRecord | null {
  return snapshot?.simulation_runs?.[0] ?? null;
}

function getBlockingAttentionCount(activeRoute: ProductExperienceRouteSnapshot | null, stages: string[]) {
  const attention = activeRoute?.attention.data;
  if (!attention) {
    return 0;
  }

  return attention.items.filter((item) => item.severity === "blocking" && stages.includes(String(item.stage))).length;
}

function getOpenJourneyBlockers(snapshot: SessionSnapshot | null, stages: string[]) {
  return (snapshot?.journey_artifacts ?? []).flatMap((artifact) => {
    if (!stages.includes(artifact.stage_key)) {
      return [];
    }

    return [...artifact.missing_information, ...artifact.stale_reasons];
  });
}

export function buildEstimateReadiness(
  activeRoute: ProductExperienceRouteSnapshot | null,
  language: SupportedLanguage = "es",
): ProductReadinessSummary {
  const snapshot = getSnapshot(activeRoute);
  const report = snapshot?.estimation_report ?? null;

  if (!report) {
    return {
      blockers: [],
      detail: copy(
        language,
        "No consolidated estimate exists yet. Generate it from the approved Blueprint inputs to show commercial value.",
        "Aun no existe estimacion consolidada. Generala desde los insumos aprobados del Blueprint para mostrar valor comercial.",
        "Ainda nao existe estimativa consolidada. Gere-a a partir dos insumos aprovados do Blueprint para mostrar valor comercial.",
      ),
      metrics: [],
      nextHref: `/projects/${activeRoute?.route.sessionId ?? ""}/work/estimate`,
      nextLabel: copy(language, "Generate estimate", "Generar estimacion", "Gerar estimativa"),
      stateLabel: copy(language, "No estimate", "Sin estimacion", "Sem estimativa"),
      tone: "warning",
    };
  }

  const blockers = [
    ...report.stale_reasons,
    ...getOpenJourneyBlockers(snapshot, ["estimate"]),
  ];
  const agenticSavings = Math.max(0, report.agentic.net_savings_vs_traditional);

  return {
    blockers,
    detail: report.is_stale
      ? copy(
          language,
          "The estimate exists but must be regenerated to reflect approved decisions.",
          "La estimacion existe pero debe regenerarse para reflejar las decisiones aprobadas.",
          "A estimativa existe, mas deve ser regenerada para refletir as decisoes aprovadas.",
        )
      : copy(
          language,
          "Estimate ready to explain value, ROI, and delivery comparisons.",
          "Estimacion lista para explicar valor, ROI y comparativas de construccion.",
          "Estimativa pronta para explicar valor, ROI e comparativos de construcao.",
        ),
    metrics: [
      {
        detail: copy(
          language,
          "Estimated hours when building with the agentic package.",
          "Horas estimadas si se construye con paquete agentico.",
          "Horas estimadas se a construcao usar o pacote agentico.",
        ),
        key: "agentic_hours",
        label: copy(language, "Agentic hours", "Horas agentic", "Horas agentic"),
        tone: "info",
        value: formatHours(report.agentic.estimated_hours_total),
      },
      {
        detail: copy(
          language,
          "Net savings calculated against traditional delivery.",
          "Ahorro neto calculado frente a desarrollo tradicional.",
          "Economia liquida calculada contra o desenvolvimento tradicional.",
        ),
        key: "savings",
        label: copy(language, "Estimated savings", "Ahorro estimado", "Economia estimada"),
        tone: agenticSavings > 0 ? "success" : "neutral",
        value: formatMoney(agenticSavings),
      },
      {
        detail: copy(
          language,
          "Blueprint design coverage for commercial storytelling.",
          "Cobertura del diseno Blueprint para mostrar valor comercial.",
          "Cobertura do design Blueprint para demonstrar valor comercial.",
        ),
        key: "blueprint_coverage",
        label: copy(language, "Blueprint commercial", "Blueprint comercial", "Blueprint comercial"),
        tone: report.agentic.blueprint_design_coverage_percent >= 85 ? "success" : "warning",
        value: formatPercent(report.agentic.blueprint_design_coverage_percent),
      },
      {
        detail: copy(
          language,
          "Premium package oriented toward construction.",
          "Paquete premium orientado a construccion.",
          "Pacote premium orientado para construcao.",
        ),
        key: "acp_readiness",
        label: copy(language, "Actionable ACP", "ACP accionable", "ACP acionavel"),
        tone: report.agentic.acp_package_readiness_percent >= 85 ? "success" : "warning",
        value: formatPercent(report.agentic.acp_package_readiness_percent),
      },
    ],
    nextHref: `/projects/${activeRoute?.route.sessionId ?? ""}/blueprint?surface=commercial`,
    nextLabel: copy(language, "View Blueprint result", "Ver resultado Blueprint", "Ver resultado do Blueprint"),
    stateLabel: report.is_stale
      ? copy(language, "Stale", "Desactualizada", "Desatualizada")
      : copy(language, "Ready", "Lista", "Pronta"),
    tone: blockers.length ? "warning" : "success",
  };
}

export function buildValidationReadiness(
  activeRoute: ProductExperienceRouteSnapshot | null,
  language: SupportedLanguage = "es",
): ProductReadinessSummary {
  const snapshot = getSnapshot(activeRoute);
  const run = latestEvaluationRun(snapshot);
  const simulation = latestSimulationRun(snapshot);
  const evaluation = unwrapArtifact(snapshot?.evaluation);
  const blockers = [
    ...(run?.blocking_issues ?? []),
    ...(simulation?.judgement?.hard_gate_findings ?? []),
    ...(evaluation?.gaps ?? []),
    ...getOpenJourneyBlockers(snapshot, ["validate"]),
  ];
  const caseCount = snapshot?.evaluation_dataset?.cases.length ?? evaluation?.cases.length ?? 0;
  const rubricCount = snapshot?.evaluation_rubric?.dimensions.length ?? 0;

  return {
    blockers,
    detail: run
      ? copy(
          language,
          "Validation executed with traceable results to classify ACP gaps and implementation questions.",
          "Validacion ejecutada con resultados trazables para clasificar gaps y preguntas del ACP.",
          "Validacao executada com resultados rastreaveis para classificar gaps e perguntas do ACP.",
        )
      : copy(
          language,
          "Prepare scenarios, rubric, and simulations before generating the portable package.",
          "Prepara escenarios, rubrica y simulaciones antes de generar el paquete portable.",
          "Prepare cenarios, rubrica e simulacoes antes de gerar o pacote portavel.",
        ),
    metrics: [
      {
        detail: copy(
          language,
          "Functional and risk cases defined to validate the Blueprint.",
          "Casos funcionales y de riesgo definidos para validar el Blueprint.",
          "Casos funcionais e de risco definidos para validar o Blueprint.",
        ),
        key: "cases",
        label: copy(language, "Cases", "Casos", "Casos"),
        tone: caseCount ? "success" : "warning",
        value: String(caseCount),
      },
      {
        detail: copy(
          language,
          "Quality dimensions used as quality gates.",
          "Dimensiones de calidad usadas como quality gates.",
          "Dimensoes de qualidade usadas como quality gates.",
        ),
        key: "rubric",
        label: copy(language, "Rubric", "Rubrica", "Rubrica"),
        tone: rubricCount ? "success" : "warning",
        value: String(rubricCount),
      },
      {
        detail: copy(
          language,
          "Latest weighted validation score.",
          "Ultimo score ponderado de validacion.",
          "Ultimo score ponderado de validacao.",
        ),
        key: "score",
        label: "Score",
        tone: (run?.overall_score ?? 0) >= 80 ? "success" : run ? "warning" : "neutral",
        value: run ? formatPercent(run.overall_score) : copy(language, "Pending", "Pendiente", "Pendente"),
      },
      {
        detail: copy(
          language,
          "Visual simulation of representative scenarios.",
          "Simulacion grafica de escenarios representativos.",
          "Simulacao grafica de cenarios representativos.",
        ),
        key: "simulation",
        label: copy(language, "Simulation", "Simulacion", "Simulacao"),
        tone: simulation?.final_status === "pass" ? "success" : simulation ? "warning" : "neutral",
        value: simulation?.final_status?.replaceAll("_", " ") ?? copy(language, "Pending", "Pendiente", "Pendente"),
      },
    ],
    nextHref: `/projects/${activeRoute?.route.sessionId ?? ""}/acp?acp_tab=package`,
    nextLabel: blockers.length
      ? copy(language, "Resolve gates", "Resolver gates", "Resolver gates")
      : copy(language, "Continue to Package", "Continuar a Package", "Continuar para Package"),
    stateLabel: run ? run.status : copy(language, "Pending", "Pendiente", "Pendente"),
    tone: blockers.length ? "danger" : run ? "success" : "warning",
  };
}

function getStageArtifact(snapshot: SessionSnapshot | null, stage: string): JourneyStageArtifactEntry | null {
  return (snapshot?.journey_artifacts ?? []).find((artifact) => artifact.stage_key === stage) ?? null;
}

function isCommercialBlueprintMetadata(metadata: Record<string, unknown> | null | undefined, artifactKey: string) {
  return (
    artifactKey.startsWith("Blueprint/commercial/") ||
    (metadata?.product === "blueprint" && metadata?.surface === "commercial")
  );
}

function buildArtifactCards(snapshot: SessionSnapshot | null, language: SupportedLanguage) {
  const exportedArtifacts = (snapshot?.artifact_records ?? []).map((record) => ({
    contentText: record.content_text,
    detail: record.content_text.slice(0, 170) || record.artifact_kind,
    exportFormat: record.export_format,
    isCommercial: isCommercialBlueprintMetadata(record.artifact_metadata, record.artifact_key),
    isDiagram: Boolean(record.artifact_metadata?.diagram) || record.artifact_kind.includes("diagram") || record.export_format === "mermaid",
    key: record.id || record.artifact_key,
    label: record.artifact_title || record.artifact_key,
    metadata: record.artifact_metadata,
    stage: record.stage,
    versionLabel: record.blueprint_version_number
      ? `Blueprint v${record.blueprint_version_number}`
      : copy(language, "No version", "Sin version", "Sem versao"),
  }));

  const journeyArtifacts = (snapshot?.journey_artifacts ?? []).map((artifact) => ({
    contentText: [artifact.state, artifact.model, artifact.source_action].filter(Boolean).join(" - "),
    detail: [artifact.state, artifact.model, artifact.source_action].filter(Boolean).join(" · "),
    exportFormat: artifact.schema_version,
    isCommercial: false,
    isDiagram: false,
    key: artifact.id,
    label: `${artifact.stage_key} · ${artifact.artifact_kind}`,
    metadata: {},
    stage: artifact.stage_key,
    versionLabel: artifact.provider_key,
  }));

  return [...exportedArtifacts, ...journeyArtifacts];
}

function buildPackageReadiness(
  activeRoute: ProductExperienceRouteSnapshot | null,
  language: SupportedLanguage = "es",
): ProductReadinessSummary {
  const snapshot = getSnapshot(activeRoute);
  const access = snapshot?.commercial_access ?? null;
  const report = snapshot?.estimation_report ?? null;
  const packageArtifact = getStageArtifact(snapshot, "build") ?? getStageArtifact(snapshot, "package");
  const attentionBlockers = getBlockingAttentionCount(activeRoute, ["validate", "package", "build"]);
  const blockers = [
    ...(report?.package_policy.package_block_reasons ?? []),
    ...getOpenJourneyBlockers(snapshot, ["validate", "build", "package"]),
    ...(attentionBlockers ? [`${attentionBlockers} item(s) bloqueante(s) en Atencion`] : []),
  ];
  const canBuildAcp = Boolean(access?.can_build_acp || access?.tier === "acp");
  const artifactCards = buildArtifactCards(snapshot, language);

  return {
    blockers,
    detail: canBuildAcp
      ? "El workspace tiene permisos para preparar y descargar el Agent Construction Package."
      : "ACP requiere adquisicion o permiso antes de habilitar generacion y descarga.",
    metrics: [
      {
        detail: "Estado comercial para construir ACP.",
        key: "access",
        label: "Entitlement",
        tone: canBuildAcp ? "success" : "warning",
        value: canBuildAcp ? "Activo" : "Requiere ACP",
      },
      {
        detail: "Artefactos tecnicos detectados en snapshot.",
        key: "artifacts",
        label: "Artefactos",
        tone: artifactCards.length ? "success" : "warning",
        value: String(artifactCards.length),
      },
      {
        detail: "Package generado por el journey.",
        key: "package",
        label: "Package",
        tone: packageArtifact ? "success" : "warning",
        value: packageArtifact?.state ?? "Pendiente",
      },
      {
        detail: "Decision de avance a package desde Estimar.",
        key: "policy",
        label: "Gate",
        tone: report?.package_policy.can_continue_to_package ? "success" : "warning",
        value: report?.package_policy.can_continue_to_package ? "Listo" : "Revisar",
      },
    ],
    nextHref: `/projects/${activeRoute?.route.sessionId ?? ""}/acp`,
    nextLabel: canBuildAcp ? "Abrir ACP" : "Ver invitacion ACP",
    stateLabel: packageArtifact?.state ?? "Preparacion",
    tone: blockers.length ? "danger" : canBuildAcp ? "success" : "warning",
  };
}

function scenarioTone(scenario: EstimationConstructionScenario): SaasTone {
  if (scenario.scenario_key === "acp_agentic") {
    return "success";
  }

  if (scenario.scenario_key === "done_for_you_factory") {
    return "info";
  }

  if (scenario.scenario_key === "acp_manual") {
    return "info";
  }

  if (scenario.scenario_key === "blueprint_premium" || scenario.scenario_key === "agentic_blueprint") {
    return "warning";
  }

  if (scenario.scenario_key === "blueprint_basic") {
    return "neutral";
  }

  return "neutral";
}

export function getConstructionScenarios(snapshot: SessionSnapshot | null): Array<EstimationConstructionScenario & { tone: SaasTone }> {
  const report = snapshot?.estimation_report ?? null;
  const comparison = buildBlueprintComparisonSummary(report);
  const scenarios = report?.construction_scenarios?.length
    ? report.construction_scenarios
    : comparison
      ? [comparison.traditional, comparison.blueprintAssisted]
      : [];

  return scenarios.map((scenario) => ({
    ...scenario,
    tone: scenarioTone(scenario),
  }));
}

function buildActivityItems(activeRoute: ProductExperienceRouteSnapshot | null, language: SupportedLanguage) {
  const activity = activeRoute?.operation.data?.activity;
  const timeline = activity?.timeline ?? [];

  return timeline.slice(0, 12).map((item, index) => {
    const record = item as Record<string, unknown>;
    const label = String(
      record.title ??
        record.label ??
        record.event_type ??
        copy(language, `Event ${index + 1}`, `Evento ${index + 1}`, `Evento ${index + 1}`),
    );
    const detail = String(
      record.detail ??
        record.summary ??
        record.description ??
        copy(
          language,
          "Event registered in the timeline.",
          "Evento registrado en la linea de tiempo.",
          "Evento registrado na linha do tempo.",
        ),
    );
    const tone = String(record.tone ?? record.severity) === "error" ? "danger" : String(record.tone ?? record.severity) === "warning" ? "warning" : "info";

    return {
      detail,
      key: String(record.id ?? record.key ?? `${index}-${label}`),
      label,
      time: String(record.created_at ?? record.generated_at ?? record.time ?? ""),
      tone: tone as SaasTone,
    };
  });
}

function buildArtifactCardsLocalized(snapshot: SessionSnapshot | null, language: SupportedLanguage) {
  const exportedArtifacts = (snapshot?.artifact_records ?? []).map((record) => ({
    contentText: record.content_text,
    detail: record.content_text.slice(0, 170) || record.artifact_kind,
    exportFormat: record.export_format,
    isCommercial: isCommercialBlueprintMetadata(record.artifact_metadata, record.artifact_key),
    isDiagram: Boolean(record.artifact_metadata?.diagram) || record.artifact_kind.includes("diagram") || record.export_format === "mermaid",
    key: record.id || record.artifact_key,
    label: record.artifact_title || record.artifact_key,
    metadata: record.artifact_metadata,
    stage: record.stage,
    versionLabel: record.blueprint_version_number
      ? `Blueprint v${record.blueprint_version_number}`
      : copy(language, "No version", "Sin version", "Sem versao"),
  }));

  const journeyArtifacts = (snapshot?.journey_artifacts ?? []).map((artifact) => ({
    contentText: [artifact.state, artifact.model, artifact.source_action].filter(Boolean).join(" - "),
    detail: [artifact.state, artifact.model, artifact.source_action].filter(Boolean).join(" · "),
    exportFormat: artifact.schema_version,
    isCommercial: false,
    isDiagram: false,
    key: artifact.id,
    label: `${artifact.stage_key} · ${artifact.artifact_kind}`,
    metadata: {},
    stage: artifact.stage_key,
    versionLabel: artifact.provider_key,
  }));

  return [...exportedArtifacts, ...journeyArtifacts];
}

function buildPackageReadinessLocalized(
  activeRoute: ProductExperienceRouteSnapshot | null,
  language: SupportedLanguage = "es",
): ProductReadinessSummary {
  const snapshot = getSnapshot(activeRoute);
  const access = snapshot?.commercial_access ?? null;
  const report = snapshot?.estimation_report ?? null;
  const packageArtifact = getStageArtifact(snapshot, "build") ?? getStageArtifact(snapshot, "package");
  const attentionBlockers = getBlockingAttentionCount(activeRoute, ["validate", "package", "build"]);
  const blockers = [
    ...(report?.package_policy.package_block_reasons ?? []),
    ...getOpenJourneyBlockers(snapshot, ["validate", "build", "package"]),
    ...(attentionBlockers
      ? [
          copy(
            language,
            `${attentionBlockers} blocking item(s) in Attention`,
            `${attentionBlockers} item(s) bloqueante(s) en Atencion`,
            `${attentionBlockers} item(ns) bloqueantes em Atencao`,
          ),
        ]
      : []),
  ];
  const canBuildAcp = Boolean(access?.can_build_acp || access?.tier === "acp");
  const artifactCards = buildArtifactCardsLocalized(snapshot, language);

  return {
    blockers,
    detail: canBuildAcp
      ? copy(
          language,
          "The workspace can prepare and download the Agent Construction Package.",
          "El workspace tiene permisos para preparar y descargar el Agent Construction Package.",
          "O workspace pode preparar e baixar o Agent Construction Package.",
        )
      : copy(
          language,
          "ACP requires entitlement or purchase before enabling generation and download.",
          "ACP requiere adquisicion o permiso antes de habilitar generacion y descarga.",
          "O ACP requer entitlement ou compra antes de habilitar geracao e download.",
        ),
    metrics: [
      {
        detail: copy(language, "Commercial state required to build ACP.", "Estado comercial para construir ACP.", "Estado comercial para construir ACP."),
        key: "access",
        label: "Entitlement",
        tone: canBuildAcp ? "success" : "warning",
        value: canBuildAcp ? copy(language, "Active", "Activo", "Ativo") : copy(language, "Requires ACP", "Requiere ACP", "Requer ACP"),
      },
      {
        detail: copy(language, "Technical artifacts detected in the snapshot.", "Artefactos tecnicos detectados en snapshot.", "Artefatos tecnicos detectados no snapshot."),
        key: "artifacts",
        label: copy(language, "Artifacts", "Artefactos", "Artefatos"),
        tone: artifactCards.length ? "success" : "warning",
        value: String(artifactCards.length),
      },
      {
        detail: copy(language, "Package generated by the journey.", "Package generado por el journey.", "Package gerado pela jornada."),
        key: "package",
        label: "Package",
        tone: packageArtifact ? "success" : "warning",
        value: packageArtifact?.state ?? copy(language, "Pending", "Pendiente", "Pendente"),
      },
      {
        detail: copy(language, "Promotion decision to Package from Estimate.", "Decision de avance a package desde Estimar.", "Decisao de avancar para Package a partir de Estimar."),
        key: "policy",
        label: "Gate",
        tone: report?.package_policy.can_continue_to_package ? "success" : "warning",
        value: report?.package_policy.can_continue_to_package
          ? copy(language, "Ready", "Listo", "Pronto")
          : copy(language, "Review", "Revisar", "Revisar"),
      },
    ],
    nextHref: `/projects/${activeRoute?.route.sessionId ?? ""}/acp`,
    nextLabel: canBuildAcp
      ? copy(language, "Open ACP", "Abrir ACP", "Abrir ACP")
      : copy(language, "View ACP invitation", "Ver invitacion ACP", "Ver convite do ACP"),
    stateLabel: packageArtifact?.state ?? copy(language, "Preparation", "Preparacion", "Preparacao"),
    tone: blockers.length ? "danger" : canBuildAcp ? "success" : "warning",
  };
}

export function buildProductSaasViewModel({
  activeRoute,
  language = "es",
  section,
}: {
  activeRoute: ProductExperienceRouteSnapshot | null;
  language?: SupportedLanguage;
  section: ProductExperienceProductSection;
}): ProductSaasViewModel {
  const snapshot = getSnapshot(activeRoute);
  const access = snapshot?.commercial_access ?? null;
  const blueprint = unwrapArtifact(snapshot?.blueprint);

  return {
    access,
    accessTier: asAccessTier(access),
    activityItems: buildActivityItems(activeRoute, language),
    artifactCards: buildArtifactCardsLocalized(snapshot, language),
    blueprintComparison: buildBlueprintComparisonSummary(snapshot?.estimation_report ?? null),
    blueprintDownload: resolveBlueprintProfessionalDownloadState(access),
    blueprintHighlights: buildBlueprintArtifactHighlights(blueprint),
    canDownloadBlueprint: canDownloadBlueprintProfessional(access),
    estimate: buildEstimateReadiness(activeRoute, language),
    package: buildPackageReadinessLocalized(activeRoute, language),
    products: getProductCards(activeRoute, activeRoute?.route.sessionId ?? snapshot?.session.id ?? "", language),
    section,
    title: snapshot?.session.title ?? copy(language, "Project", "Proyecto", "Projeto"),
    validation: buildValidationReadiness(activeRoute, language),
  };
}

export function hasTier(current: CommercialTier, required: CommercialTier) {
  return TIER_RANK[current] >= TIER_RANK[required];
}
