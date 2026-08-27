"use client";

import {
  Activity,
  ArrowRight,
  Boxes,
  Brain,
  Check,
  CheckCircle2,
  FileText,
  GitBranch,
  Globe,
  Layers3,
  LockKeyhole,
  PackageCheck,
  Play,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  Workflow,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  UxaBadge,
  UxaPersistentProcessingFeedback,
  UxaProcessingStrip,
  UxaProductHero,
  UxaSurface,
  type UxaTone,
} from "@/features/product-experience/design-system";
import type {
  ProductBuildDeliverableStatus,
  ProductBuildLifecycle,
  ProductBuildProductKey,
  ProductBuildStatus,
} from "@/features/product-experience/saas/product-build-status";
import { cn } from "@/lib/utils";

export type ExecutiveOverviewAction = {
  disabled?: boolean;
  href: string;
  label: string;
  tone?: UxaTone;
};

export type ExecutiveMilestone = {
  body: string;
  evidence: string[];
  icon: LucideIcon;
  key: string;
  label: string;
  progress: number;
  stateLabel: string;
  title: string;
  tone: UxaTone;
};

export type ExecutiveDeliverableGroup = {
  available: number;
  key: string;
  label: string;
  total: number;
};

export type KeyDeliverableItem = {
  category: string;
  description: string;
  formatBadge: string;
  icon: LucideIcon;
  key: string;
  previewNote: string;
  statusBadge: string;
  statusTone: UxaTone;
  targetMenu: "diagrams" | "governed-artifacts" | "commercial-artifacts";
  targetMenuLabel: string;
  title: string;
};

export type ExecutiveOverviewModel = {
  badge: string;
  deliverableGroups: ExecutiveDeliverableGroup[];
  description: string;
  keyDeliverables: KeyDeliverableItem[];
  keyDeliverablesTitle: string;
  keyDeliverablesSubtitle: string;
  milestoneSummary: string;
  milestones: ExecutiveMilestone[];
  nextAction: ExecutiveOverviewAction;
  productKey: ProductBuildProductKey;
  productLabel: string;
  projectTitle: string;
  secondaryAction?: ExecutiveOverviewAction;
  title: string;
  unlockMessage: string;
};

type BuildExecutiveOverviewModelOptions = {
  productKey: ProductBuildProductKey;
  projectTitle: string;
  sessionId: string;
  status?: ProductBuildStatus | null;
};

const PRODUCT_COPY: Record<
  ProductBuildProductKey,
  {
    badge: string;
    description: string;
    nextLabel: string;
    productLabel: string;
    secondaryLabel: string;
    title: string;
    unlockMessage: string;
  }
> = {
  acp: {
    badge: "Agent Construction Package",
    description:
      "Convierte el conocimiento aprobado en un paquete portable para iniciar la construccion con decisiones tecnicas explicitas.",
    nextLabel: "Explorar paquete",
    productLabel: "ACP",
    secondaryLabel: "Ver artefactos",
    title: "Del diseno aprobado a una construccion gobernada",
    unlockMessage:
      "El ACP conserva las decisiones humanas necesarias para implementacion como preguntas estructuradas, no como bloqueos invisibles.",
  },
  blueprint_basic: {
    badge: "Blueprint Basico",
    description:
      "Cuenta como la necesidad de negocio se convirtio en una propuesta clara, visible y gobernada dentro de la plataforma.",
    nextLabel: "Explorar Blueprint",
    productLabel: "Blueprint",
    secondaryLabel: "Ver diagramas",
    title: "De una necesidad ambigua a una propuesta clara",
    unlockMessage:
      "La vista protegida demuestra el valor generado. La descarga profesional se desbloquea con Blueprint Pro.",
  },
  blueprint_pro: {
    badge: "Blueprint Profesional",
    description:
      "Profundiza el Blueprint con decisiones resueltas, documentos profesionales, trazabilidad y entregables listos para compartir.",
    nextLabel: "Explorar Blueprint Pro",
    productLabel: "Blueprint Pro",
    secondaryLabel: "Ver artefactos",
    title: "De una propuesta clara a un Blueprint defendible",
    unlockMessage:
      "Blueprint Pro agrega profundidad, versiones y documentacion profesional para decidir con evidencia.",
  },
};

export const PRODUCT_KEY_DELIVERABLES: Record<
  ProductBuildProductKey,
  {
    items: KeyDeliverableItem[];
    sectionSubtitle: string;
    sectionTitle: string;
  }
> = {
  blueprint_basic: {
    sectionSubtitle:
      "Los 5 entregables estratégicos, arquitectónicos y comerciales co-creados en el viaje LEAN.",
    sectionTitle: "5 Artefactos Clave del Blueprint Básico",
    items: [
      {
        category: "Estrategia & Dirección",
        description:
          "Consolidación estructurada del dolor de negocio, baseline operativo, impacto cualitativo y métrica North Star co-creada en el viaje Lean.",
        formatBadge: "Brief Ejecutivo / Markdown",
        icon: FileText,
        key: "diagnostico_problema_contexto",
        previewNote: "Fuente única para comprender el dolor y la métrica de éxito sin ambigüedades.",
        statusBadge: "Disponible",
        statusTone: "success",
        targetMenu: "governed-artifacts",
        targetMenuLabel: "Artefactos Gobernados",
        title: "Diagnóstico del Problema y Contexto Operativo",
      },
      {
        category: "Alcance & Reglas",
        description:
          "Especificación del alcance MVP, criterios de aceptación, reglas de negocio no delegables y delimitación explícita de lo que queda fuera del alcance.",
        formatBadge: "Matriz de Requisitos & Reglas",
        icon: Target,
        key: "definicion_alcance_mvp",
        previewNote: "Límites claros del alcance para evitar desvíos y sobrecostos en desarrollo.",
        statusBadge: "Disponible",
        statusTone: "success",
        targetMenu: "governed-artifacts",
        targetMenuLabel: "Artefactos Gobernados",
        title: "Definición de Alcance y Requisitos MVP",
      },
      {
        category: "Arquitectura & Diseño",
        description:
          "Topología conceptual de la solución, loop de razonamiento agéntico y selección justificada de patrones (ReAct, Router, Plan & Execute).",
        formatBadge: "Diagrama Visual & Especificación",
        icon: Workflow,
        key: "arquitectura_propuesta_patrones",
        previewNote: "Diseño estructural del comportamiento agéntico listo para visualización.",
        statusBadge: "Disponible",
        statusTone: "success",
        targetMenu: "diagrams",
        targetMenuLabel: "Diagramas de Blueprint",
        title: "Arquitectura Propuesta y Patrones Agénticos",
      },
      {
        category: "Supervisión & Control",
        description:
          "Diagramas visuales de orquestación, interacción entre subagentes, puntos de control humano (HITL) y protocolos de contención.",
        formatBadge: "Diagramas de Alto Impacto",
        icon: ShieldAlert,
        key: "orquestacion_seguridad_guardrails",
        previewNote: "Garantiza supervisión humana obligatoria y mitigación de fallos.",
        statusBadge: "Disponible",
        statusTone: "success",
        targetMenu: "diagrams",
        targetMenuLabel: "Diagramas de Blueprint",
        title: "Orquestación Agéntica y Seguridad Guardrails",
      },
      {
        category: "Finanzas & Viabilidad",
        description:
          "Bento Grid de KPIs de ahorro, comparativa comercial de 2 columnas (Desarrollo Agéntico vs Tradicional) y scorecard de viabilidad económica.",
        formatBadge: "Dossier Comercial Bento / ROI",
        icon: Boxes,
        key: "propuesta_tecnico_comercial_roi",
        previewNote: "Sustento cuantitativo para comités de inversión y decisión de compra.",
        statusBadge: "Disponible",
        statusTone: "success",
        targetMenu: "commercial-artifacts",
        targetMenuLabel: "Artefactos Comerciales",
        title: "Propuesta Técnico-Comercial y Retorno de Inversión",
      },
    ],
  },
  blueprint_pro: {
    sectionSubtitle:
      "Entregables enriquecidos con profundidad técnica, contratos formales, 10+ diagramas de ingeniería y exportación formal.",
    sectionTitle: "5 Artefactos Clave de Blueprint Pro",
    items: [
      {
        category: "Documentación Profesional",
        description:
          "Documento integral de 6 capítulos defendible ante comités técnicos y ejecutivos, con control de versiones y descargable formalmente.",
        formatBadge: "Dossier Completo .md / .pdf",
        icon: FileText,
        key: "master_specification_document",
        previewNote: "Especificación formal para comités de arquitectura y licitación.",
        statusBadge: "Disponible",
        statusTone: "success",
        targetMenu: "commercial-artifacts",
        targetMenuLabel: "Artefactos Comerciales",
        title: "Master Specification Document (Markdown & PDF)",
      },
      {
        category: "Finanzas & FinOps",
        description:
          "Desglose financiero formal con banda de confianza (±15%), costo total de propiedad (TCO), ahorro neto y exportación a JSON.",
        formatBadge: "Dataset Financiero & JSON Pack",
        icon: Boxes,
        key: "estimation_pack_financiero",
        previewNote: "Modelado de 5 escenarios de construcción con desglose de horas y costo de tokens.",
        statusBadge: "Disponible",
        statusTone: "success",
        targetMenu: "commercial-artifacts",
        targetMenuLabel: "Artefactos Comerciales",
        title: "Estimation Pack y Modelado de 5 Escenarios",
      },
      {
        category: "Integraciones & Schemas",
        description:
          "Especificación técnica formal de interfaces JSON Schema/OpenAPI, parámetros de entrada/salida, retries y compensación de fallos.",
        formatBadge: "JSON Schema / OpenAPI 3.1",
        icon: Wrench,
        key: "contratos_herramientas_schemas",
        previewNote: "Contratos de interfaz listos para implementar sin dudas sobre el payload.",
        statusBadge: "Disponible",
        statusTone: "success",
        targetMenu: "governed-artifacts",
        targetMenuLabel: "Artefactos Gobernados",
        title: "Contratos de Herramientas y Schemas de Integración",
      },
      {
        category: "Conocimiento & RAG",
        description:
          "Políticas de memoria a corto plazo (sesión/threads), memoria a largo plazo (vector store/RAG), ventanas de contexto y retención de datos.",
        formatBadge: "Especificación de Memoria & RAG",
        icon: Brain,
        key: "memoria_dual_contratos_conocimiento",
        previewNote: "Control estricto de contexto para consistencia y optimización de tokens.",
        statusBadge: "Disponible",
        statusTone: "success",
        targetMenu: "governed-artifacts",
        targetMenuLabel: "Artefactos Gobernados",
        title: "Estrategia de Memoria Dual y Contratos de Conocimiento",
      },
      {
        category: "Ingeniería & Diagramas",
        description:
          "Colección completa de 10+ diagramas de arquitectura de software, contenedores C4, flujos de estados, secuencia y linaje de datos.",
        formatBadge: "Catálogo Multi-Notación SVG/PlantUML",
        icon: GitBranch,
        key: "catalogo_completo_diagramas_ingenieria",
        previewNote: "Modelado integral para ingeniería de software y auditoría técnica.",
        statusBadge: "Disponible",
        statusTone: "success",
        targetMenu: "diagrams",
        targetMenuLabel: "Diagramas de Blueprint",
        title: "Catálogo Completo de Diagramas de Arquitectura (C4, UML, BPMN)",
      },
    ],
  },
  acp: {
    sectionSubtitle:
      "Paquete integral portable y ejecutable listo para alimentar herramientas de IA (Cursor, Claude Code, Codex) y equipos de desarrollo.",
    sectionTitle: "5 Artefactos Clave del Agent Construction Package (ACP)",
    items: [
      {
        category: "Paquete Portable",
        description:
          "Estructura completa de repositorio con manifest.yaml, launchers y configuración para Cursor, Claude Code y Codex.",
        formatBadge: "ZIP / Directorio Normalizado",
        icon: PackageCheck,
        key: "paquete_portable_zip",
        previewNote: "Se abre directamente en Cursor o Claude Code con contexto completo precargado.",
        statusBadge: "Disponible",
        statusTone: "success",
        targetMenu: "governed-artifacts",
        targetMenuLabel: "Artefactos Gobernados",
        title: "Paquete Portable ZIP Listo para IDEs Agénticos",
      },
      {
        category: "Prompts & Razonamiento",
        description:
          "Batería completa de system prompts versionados, playbooks de razonamiento y guías de ensamblaje para LLMs.",
        formatBadge: "Promptbook Estructurado .md/.json",
        icon: Play,
        key: "prompt_pack_ejecutable",
        previewNote: "Instrucciones deterministas de razonamiento para guiar a los agentes de código.",
        statusBadge: "Disponible",
        statusTone: "success",
        targetMenu: "governed-artifacts",
        targetMenuLabel: "Artefactos Gobernados",
        title: "Prompt Pack Ejecutable (System, Planner, Evaluator)",
      },
      {
        category: "Runtime & Workflows",
        description:
          "Definiciones de estados persistentes (agent-runtime.yaml), checkpoints, retries automáticos y conectores tipados.",
        formatBadge: "YAML Runtime & Schemas Pydantic/Zod",
        icon: Workflow,
        key: "construction_pack_workflows",
        previewNote: "Máquinas de estado durables y conectores con tipado estricto.",
        statusBadge: "Disponible",
        statusTone: "success",
        targetMenu: "governed-artifacts",
        targetMenuLabel: "Artefactos Gobernados",
        title: "Construction Pack y Workflows Durables",
      },
      {
        category: "Calidad & Evaluación",
        description:
          "Batería de pruebas sintéticas y escenarios de estrés para verificar robustez, control de alucinaciones y guardrails.",
        formatBadge: "Test Suites & Fixtures JSON",
        icon: CheckCircle2,
        key: "test_suite_automatizada",
        previewNote: "Permite evaluar la precisión y estabilidad del agente antes del despliegue.",
        statusBadge: "Disponible",
        statusTone: "success",
        targetMenu: "governed-artifacts",
        targetMenuLabel: "Artefactos Gobernados",
        title: "Test Suite Automatizada y Dataset de Evaluación",
      },
      {
        category: "Despliegue & Telemetría",
        description:
          "Diagramas técnicos de secuencia de herramientas, contratos de datos, matriz de despliegue en nube y modelo de observabilidad.",
        formatBadge: "Diagramas de Implementación SVG",
        icon: Globe,
        key: "diagramas_implementacion_telemetria",
        previewNote: "Asegura el monitoreo operativo, observabilidad y despliegue empresarial.",
        statusBadge: "Disponible",
        statusTone: "success",
        targetMenu: "diagrams",
        targetMenuLabel: "Diagramas de Blueprint",
        title: "Diagramas de Implementación, Despliegue y Telemetría B2B",
      },
    ],
  },
};

function normalizePercent(value: number | null | undefined) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(value ?? 0)));
}

function lifecycleTone(lifecycle: ProductBuildLifecycle | undefined): UxaTone {
  if (lifecycle === "completed" || lifecycle === "partial") {
    return "success";
  }
  if (lifecycle === "requires_attention" || lifecycle === "locked" || lifecycle === "error") {
    return "danger";
  }
  if (lifecycle === "queued" || lifecycle === "preparing" || lifecycle === "running") {
    return "info";
  }
  if (lifecycle === "payment_pending" || lifecycle === "ready_to_start") {
    return "warning";
  }
  return "neutral";
}

function lifecycleLabel(lifecycle: ProductBuildLifecycle | undefined) {
  if (!lifecycle) {
    return "Sin estado";
  }
  return lifecycle.replaceAll("_", " ");
}

function isProcessingLifecycle(lifecycle: ProductBuildLifecycle | undefined) {
  return lifecycle === "queued" || lifecycle === "preparing" || lifecycle === "running";
}

function deliverableGroupLabel(key: string) {
  const labels: Record<string, string> = {
    artifact: "Artefactos",
    contract: "Contratos",
    diagram: "Diagramas",
    document: "Documentos",
    lineage: "Trazabilidad",
    package: "Paquetes",
    prompt: "Prompts",
    test: "Pruebas",
  };

  return labels[key] ?? key;
}

function buildDeliverableGroups(deliverables: ProductBuildDeliverableStatus[] | undefined): ExecutiveDeliverableGroup[] {
  if (!deliverables || !deliverables.length) {
    return [
      { available: 1, key: "document", label: "Documentos", total: 1 },
      { available: 1, key: "diagram", label: "Diagramas", total: 1 },
    ];
  }

  const counts = new Map<string, { available: number; total: number }>();
  for (const item of deliverables) {
    const groupKey = item.deliverable_type || "artifact";
    const current = counts.get(groupKey) ?? { available: 0, total: 0 };
    current.total += 1;
    if (item.state === "available") {
      current.available += 1;
    }
    counts.set(groupKey, current);
  }

  return Array.from(counts.entries()).map(([key, value]) => ({
    available: value.available,
    key,
    label: deliverableGroupLabel(key),
    total: value.total,
  }));
}

const DEFAULT_MILESTONES: Array<Omit<ExecutiveMilestone, "progress" | "stateLabel" | "tone">> = [
  {
    body: "La necesidad se captura como problema operativo concreto, con contexto de negocio, fricciones y oportunidad de automatizacion.",
    evidence: ["Contexto de negocio", "Proceso actual", "Oportunidad registrada"],
    icon: Target,
    key: "discover",
    label: "Descubrir",
    title: "Entender antes de construir",
  },
  {
    body: "El contexto se transforma en objetivos, alcance, requisitos, reglas y criterios que alimentan las siguientes decisiones.",
    evidence: ["Objetivos", "Requisitos", "Reglas y criterios"],
    icon: CheckCircle2,
    key: "define",
    label: "Definir",
    title: "Convertir necesidad en decisiones",
  },
  {
    body: "La solucion toma forma mediante arquitectura, patrones agentivos, roles, handoffs, guardrails y mecanismos de decision.",
    evidence: ["Arquitectura", "Patrones agentivos", "Guardrails"],
    icon: Workflow,
    key: "design",
    label: "Disenar",
    title: "Dar forma al agente",
  },
  {
    body: "Se identifica el conjunto minimo de herramientas, integraciones y contratos necesarios para operar sin sobreaprovisionar.",
    evidence: ["Herramientas minimas", "Integraciones", "Contratos"],
    icon: Wrench,
    key: "tools",
    label: "Herramientas",
    title: "Elegir solo lo necesario",
  },
  {
    body: "La estrategia de conocimiento define memoria corta, memoria larga, RAG, fuentes autorizadas y control de contexto.",
    evidence: ["Memoria corta/larga", "RAG", "Fuentes autorizadas"],
    icon: Brain,
    key: "memory",
    label: "Memoria",
    title: "Hacer util el conocimiento",
  },
];

function buildMilestones(status?: ProductBuildStatus | null): ExecutiveMilestone[] {
  const stageMap = new Map((status?.stages ?? []).map((stage) => [stage.stage_key, stage]));

  return DEFAULT_MILESTONES.map((milestone) => {
    const liveStage = stageMap.get(milestone.key as any);
    const progress = normalizePercent(liveStage?.progress.percent ?? 100);
    const stateLabel = liveStage?.progress.label ?? "Completado";
    const tone = lifecycleTone(liveStage?.lifecycle ?? "completed");

    return {
      ...milestone,
      progress,
      stateLabel,
      tone,
    };
  });
}

export function buildExecutiveOverviewModel({
  productKey,
  projectTitle,
  sessionId,
  status,
}: BuildExecutiveOverviewModelOptions): ExecutiveOverviewModel {
  const copy = PRODUCT_COPY[productKey] ?? PRODUCT_COPY.blueprint_basic;
  const deliverableConfig = PRODUCT_KEY_DELIVERABLES[productKey] ?? PRODUCT_KEY_DELIVERABLES.blueprint_basic;
  const milestones = buildMilestones(status);
  const deliverableGroups = buildDeliverableGroups(status?.deliverables);
  const completedCount = milestones.filter((item) => item.progress >= 100).length;
  const milestoneSummary = `${completedCount} de ${milestones.length} hitos consolidados`;

  const isPro = productKey === "blueprint_pro";
  const isAcp = productKey === "acp";

  const nextHref = isAcp
    ? `/projects/${sessionId}/acp`
    : isPro
      ? `/projects/${sessionId}/blueprint/pro`
      : `/projects/${sessionId}/blueprint`;

  const secondaryHref = isAcp
    ? `/projects/${sessionId}/artifacts`
    : isPro
      ? `/projects/${sessionId}/artifacts`
      : `/projects/${sessionId}/diagrams`;

  return {
    badge: copy.badge,
    deliverableGroups,
    description: copy.description,
    keyDeliverables: deliverableConfig.items,
    keyDeliverablesSubtitle: deliverableConfig.sectionSubtitle,
    keyDeliverablesTitle: deliverableConfig.sectionTitle,
    milestoneSummary,
    milestones,
    nextAction: {
      href: nextHref,
      label: copy.nextLabel,
    },
    productKey,
    productLabel: copy.productLabel,
    projectTitle: projectTitle || "Proyecto sin título",
    secondaryAction: {
      href: secondaryHref,
      label: copy.secondaryLabel,
    },
    title: copy.title,
    unlockMessage: copy.unlockMessage,
  };
}

export function ExecutiveOverviewShell({
  children,
  model,
  status,
}: {
  children?: ReactNode;
  model: ExecutiveOverviewModel;
  status?: ProductBuildStatus | null;
}) {
  const percent = normalizePercent(status?.progress.percent ?? 100);
  const label = status?.progress.label ?? "Progreso consolidado del build.";
  const isProcessing = isProcessingLifecycle(status?.lifecycle);

  return (
    <div className="space-y-5">
      <UxaProductHero
        actions={
          <div className="flex w-full min-w-[240px] flex-col gap-3 rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-[var(--uxa-color-muted-panel)] p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)]">
                Estado de Compilación
              </span>
              <UxaBadge tone={lifecycleTone(status?.lifecycle ?? "completed")}>
                {lifecycleLabel(status?.lifecycle ?? "completed")}
              </UxaBadge>
            </div>
            <div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[28px] font-black text-[var(--uxa-color-ink)]">{percent}%</span>
                <span className="text-[11px] font-semibold text-[var(--uxa-color-ink-muted)]">
                  {status?.progress.completed_units ?? 0}/{status?.progress.total_units ?? 0} entregables
                </span>
              </div>
              <p className="mt-1 text-[11px] text-[var(--uxa-color-ink-soft)]">{label}</p>
            </div>
            <UxaProcessingStrip label="Progreso global del producto" value={percent} />
          </div>
        }
        description={model.description}
        eyebrow={
          <div className="flex flex-wrap items-center gap-2">
            <UxaBadge tone="brand">{model.badge}</UxaBadge>
            <UxaBadge tone="neutral">Resumen Ejecutivo</UxaBadge>
          </div>
        }
        headingLevel={1}
        meta={
          <span className="inline-flex items-center gap-2 text-[var(--uxa-font-size-small)] text-[var(--uxa-color-ink-soft)]">
            <Sparkles aria-hidden="true" className="h-4 w-4 text-[var(--uxa-color-brand)]" />
            <span>{model.projectTitle}</span>
          </span>
        }
        title={model.title}
      />

      <UxaPersistentProcessingFeedback
        active={isProcessing}
        activityLabel={status?.current_activity?.label ?? lifecycleLabel(status?.lifecycle)}
        description={status?.current_activity?.detail ?? "Compilando entregables, diagramas y contratos de este nivel."}
        stageLabel={model.productLabel}
        title={`Generando ${model.productLabel}`}
      />

      {children}
    </div>
  );
}

export function ProductMilestoneTimeline({
  activeKey,
  milestones,
  onSelect,
}: {
  activeKey: string;
  milestones: ExecutiveMilestone[];
  onSelect?: (key: string) => void;
}) {
  return (
    <UxaSurface className="p-5 lg:p-6" id="journey-timeline">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--uxa-color-brand)]">
            Viaje y Decisión LEAN
          </p>
          <h2 className="mt-2 text-[20px] font-black text-[var(--uxa-color-ink)]">
            5 Momentos Clave del Proyecto
          </h2>
          <p className="mt-1 text-[13px] text-[var(--uxa-color-ink-soft)]">
            Cada fase resolvió decisiones fundamentales antes de pasar a la siguiente etapa.
          </p>
        </div>
        <UxaBadge tone="neutral">5 Fases Consolidadas</UxaBadge>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-5">
        {milestones.map((item, index) => {
          const Icon = item.icon;
          const isActive = item.key === activeKey;
          return (
            <button
              aria-current={isActive ? "step" : undefined}
              className={cn(
                "group flex flex-col justify-between rounded-[var(--uxa-radius-lg)] border p-4 text-left transition",
                isActive
                  ? "border-[var(--uxa-color-brand)] bg-[var(--uxa-color-brand-soft)] shadow-sm"
                  : "border-[var(--uxa-color-border)] bg-white hover:border-[var(--uxa-color-brand)]",
              )}
              key={item.key}
              onClick={() => onSelect?.(item.key)}
              type="button"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg transition",
                      isActive
                        ? "bg-[var(--uxa-color-brand)] text-white"
                        : "bg-[var(--uxa-color-muted-panel)] text-[var(--uxa-color-ink)] group-hover:bg-[var(--uxa-color-brand)] group-hover:text-white",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-[10px] font-black text-[var(--uxa-color-ink-muted)]">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-3 text-[14px] font-black text-[var(--uxa-color-ink)]">
                  {item.label}
                </h3>
                <p className="mt-1 text-[11px] font-semibold text-[var(--uxa-color-ink-muted)]">
                  {item.stateLabel}
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-[var(--uxa-color-border-soft)]">
                <UxaProcessingStrip label={`Progreso ${item.label}`} value={item.progress} />
              </div>
            </button>
          );
        })}
      </div>
    </UxaSurface>
  );
}

export function ExecutiveStorySection({
  milestone,
}: {
  milestone?: ExecutiveMilestone;
}) {
  if (!milestone) {
    return null;
  }

  const Icon = milestone.icon;

  return (
    <UxaSurface className="p-5 lg:p-6" id="milestone-detail">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--uxa-color-brand-soft)] text-[var(--uxa-color-brand)]">
              <Icon className="h-4 w-4" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-brand)]">
              {milestone.label}
            </span>
          </div>
          <h2 className="mt-2 text-[22px] font-black text-[var(--uxa-color-ink)]">
            {milestone.title}
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed text-[var(--uxa-color-ink-soft)]">
            {milestone.body}
          </p>
        </div>

        <div className="w-full lg:max-w-xs rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-[var(--uxa-color-muted-panel)] p-4">
          <div className="flex items-center gap-2 text-[12px] font-black text-[var(--uxa-color-ink)]">
            <ShieldCheck className="h-4 w-4 text-[var(--uxa-state-success)]" />
            <span>Evidencia Co-Creada</span>
          </div>
          <ul className="mt-3 space-y-2 text-[12px] text-[var(--uxa-color-ink-soft)]">
            {milestone.evidence.map((item) => (
              <li className="flex items-center gap-2" key={item}>
                <Check className="h-3.5 w-3.5 shrink-0 text-[var(--uxa-state-success)]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </UxaSurface>
  );
}

export function ProductBuildProgress({
  status,
}: {
  status?: ProductBuildStatus | null;
}) {
  const percent = normalizePercent(status?.progress.percent ?? 100);
  const label = status?.progress.label ?? "100% completado";

  return (
    <UxaSurface className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)]">
            Progreso del Producto
          </p>
          <h2 className="mt-1 text-[22px] font-black text-[var(--uxa-color-ink)]">{percent}%</h2>
        </div>
        <UxaBadge tone={lifecycleTone(status?.lifecycle ?? "completed")}>{label}</UxaBadge>
      </div>
      <div className="mt-4">
        <UxaProcessingStrip label="Avance general del build" value={percent} />
      </div>
    </UxaSurface>
  );
}

export function deliverableActionHref(
  itemKey: string,
  productKey: ProductBuildProductKey,
  sessionId?: string,
  targetMenuOverride?: "diagrams" | "governed-artifacts" | "commercial-artifacts",
): string {
  if (!sessionId) {
    return "#key-deliverables";
  }

  let menu = targetMenuOverride;
  if (!menu) {
    const config = PRODUCT_KEY_DELIVERABLES[productKey];
    const match = config?.items.find((item) => item.key === itemKey);
    if (match?.targetMenu) {
      menu = match.targetMenu;
    } else if (
      [
        "arquitectura_propuesta_patrones",
        "orquestacion_seguridad_guardrails",
        "diagrama_procesos",
        "arquitectura_estados",
        "catalogo_completo_diagramas_ingenieria",
        "diagramas_implementacion_telemetria",
      ].includes(itemKey)
    ) {
      menu = "diagrams";
    } else if (
      [
        "propuesta_tecnico_comercial_roi",
        "resumen_ejecutivo",
        "estimacion_roi",
        "master_specification_document",
        "estimation_pack_financiero",
      ].includes(itemKey)
    ) {
      menu = "commercial-artifacts";
    } else {
      menu = "governed-artifacts";
    }
  }

  switch (productKey) {
    case "blueprint_pro":
      return `/projects/${sessionId}/blueprint/pro?result_tab=${menu}`;
    case "acp":
      return `/projects/${sessionId}/acp?acp_tab=${menu}`;
    case "blueprint_basic":
    default:
      return `/projects/${sessionId}/blueprint?result_tab=${menu}`;
  }
}

export function ExecutiveProductKeyDeliverables({
  productKey,
  sessionId,
  status,
}: {
  productKey: ProductBuildProductKey;
  sessionId?: string;
  status?: ProductBuildStatus | null;
}) {
  const config = PRODUCT_KEY_DELIVERABLES[productKey] || PRODUCT_KEY_DELIVERABLES.blueprint_basic;
  const isActivelyGenerating = isProcessingLifecycle(status?.lifecycle);

  const totalCount = config.items.length;

  return (
    <UxaSurface className="p-5 lg:p-6" id="key-deliverables">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles aria-hidden="true" className="h-4 w-4 text-[var(--uxa-color-brand)]" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--uxa-color-brand)]">
              Entregables Diferenciadores
            </p>
          </div>
          <h2 className="mt-2 text-[20px] font-black text-[var(--uxa-color-ink)]">
            {config.sectionTitle}
          </h2>
          <p className="mt-1 text-[13px] text-[var(--uxa-color-ink-soft)]">
            {config.sectionSubtitle}
          </p>
        </div>
        <UxaBadge tone={isActivelyGenerating ? "warning" : "success"}>
          {isActivelyGenerating ? `${totalCount} en proceso` : `${totalCount} de ${totalCount} Listos`}
        </UxaBadge>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {config.items.map((item, index) => {
          const Icon = item.icon;
          const href = deliverableActionHref(item.key, productKey, sessionId, item.targetMenu);
          const isInProgress = isActivelyGenerating;
          const statusBadgeText = isInProgress ? "En proceso" : item.statusBadge;
          const statusTone: UxaTone = isInProgress ? "warning" : item.statusTone;

          return (
            <a
              className="group flex flex-col justify-between rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-white p-4 shadow-sm transition hover:border-[var(--uxa-color-brand)] hover:shadow-[var(--uxa-shadow-card)] focus:outline-none focus:ring-2 focus:ring-[var(--uxa-color-brand)]"
              href={href}
              key={item.key}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--uxa-color-brand-soft)] text-[var(--uxa-color-brand)] transition group-hover:scale-105">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[var(--uxa-color-ink-muted)]">
                      Artefacto 0{index + 1}
                    </span>
                  </div>
                  <UxaBadge tone={statusTone}>
                    {isInProgress ? (
                      <span className="inline-flex items-center gap-1">
                        <Activity className="h-3 w-3 animate-spin" /> En proceso
                      </span>
                    ) : (
                      statusBadgeText
                    )}
                  </UxaBadge>
                </div>

                <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-[var(--uxa-color-brand)]">
                  {item.category}
                </p>
                <h3 className="mt-1 text-[15px] font-black text-[var(--uxa-color-ink)] leading-snug transition group-hover:text-[var(--uxa-color-brand)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-[12px] leading-relaxed text-[var(--uxa-color-ink-soft)]">
                  {item.description}
                </p>
              </div>

              <div className="mt-4 border-t border-[var(--uxa-color-border-soft)] pt-3">
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="font-semibold text-[var(--uxa-color-ink-muted)]">
                    {item.formatBadge}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-[10px] font-bold",
                      isInProgress ? "text-[var(--uxa-state-warning)]" : "text-[var(--uxa-state-success)]",
                    )}
                  >
                    {isInProgress ? (
                      <>
                        <Activity className="h-3 w-3 animate-spin" /> En proceso
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3 w-3" /> Disponible
                      </>
                    )}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] italic text-[var(--uxa-color-ink-muted)]">
                  {item.previewNote}
                </p>
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-dashed border-[var(--uxa-color-border-soft)] pt-2.5">
                  <span className="rounded bg-[var(--uxa-color-muted-panel)] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[var(--uxa-color-ink-muted)]">
                    Menú: {item.targetMenuLabel}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[12px] font-bold text-[var(--uxa-color-brand)] group-hover:underline">
                    <span>Explorar</span>
                    <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </UxaSurface>
  );
}

export function DeliverableGenerationLiveTracker({
  productKey,
  productLabel,
  status,
  onProcessPending,
  onRetryFailed,
  processingDisabled = false,
}: {
  productKey: ProductBuildProductKey;
  productLabel: string;
  status?: ProductBuildStatus | null;
  onProcessPending?: (() => void | Promise<unknown>) | undefined;
  onRetryFailed?: (() => void | Promise<unknown>) | undefined;
  processingDisabled?: boolean;
}) {
  const processingQueue = status?.processing_queue ?? null;
  const deliverableCounts = (status?.deliverables ?? []).reduce(
    (accumulator, item) => {
      if (item.state === "pending" || item.state === "stale") {
        accumulator.pending += 1;
      } else if (item.state === "queued" || item.state === "generating") {
        accumulator.processing += 1;
      } else if (item.state === "available") {
        accumulator.completed += 1;
      } else if (item.state === "error") {
        accumulator.failed += 1;
      }
      return accumulator;
    },
    { completed: 0, failed: 0, pending: 0, processing: 0 },
  );
  const queueMetrics = processingQueue
    ? {
        completed: processingQueue.completed_count,
        failed: processingQueue.failed_count,
        pending: processingQueue.pending_count,
        processing: processingQueue.processing_count,
        retried: processingQueue.retried_count,
        total: processingQueue.total_count,
      }
    : {
        completed: 0,
        failed: deliverableCounts.failed,
        pending: deliverableCounts.pending,
        processing: deliverableCounts.processing,
        retried: 0,
        total: deliverableCounts.pending + deliverableCounts.failed,
      };
  const queueActive = Boolean(processingQueue?.active);
  const isActivelyGenerating = isProcessingLifecycle(status?.lifecycle) || queueActive;
  const percent = processingQueue?.total_count
    ? normalizePercent(((processingQueue.total_count - processingQueue.pending_count - processingQueue.processing_count) / Math.max(1, processingQueue.total_count)) * 100)
    : normalizePercent(status?.progress.percent);
  const canProcess = Boolean(onProcessPending && !processingDisabled && !queueActive && queueMetrics.total > 0);
  const canRetryFailed = Boolean(onRetryFailed && !processingDisabled && !queueActive && queueMetrics.failed > 0);
  const primaryLabel = queueMetrics.pending > 0 ? "Procesar pendientes" : "Reprocesar";
  const completedItems = processingQueue?.completed_items ?? [];
  const failedItems = processingQueue?.failed_items ?? [];

  const generationPhases = [
    { label: "Consolidando contexto y objetivos de negocio Lean", status: "completed" },
    { label: `Ensamblando especificaciones técnicas para ${productLabel}`, status: isActivelyGenerating ? "running" : "completed" },
    { label: "Generando diagramas visuales y contratos de interfaz", status: isActivelyGenerating ? "running" : "completed" },
    { label: "Validando controles de gobernanza, riesgo y HITL", status: isActivelyGenerating ? "queued" : "completed" },
    { label: "Empaquetando artefactos finales descargables", status: isActivelyGenerating ? "queued" : "completed" },
  ];

  return (
    <UxaSurface
      className={cn(
        "border p-4 transition-all duration-300",
        isActivelyGenerating
          ? "border-[var(--uxa-color-brand)] bg-[var(--uxa-color-brand-soft)] shadow-md"
          : "border-[var(--uxa-color-border)] bg-[var(--uxa-color-muted-panel)]",
      )}
    >
      <UxaPersistentProcessingFeedback
        active={queueActive}
        title={`Procesando ${productLabel}`}
        description={processingQueue?.summary || status?.current_activity?.detail || "La cola sigue ejecutandose en segundo plano."}
        stageLabel={status?.current_activity?.label || "Cola persistida"}
        activityLabel={`${queueMetrics.processing} en proceso`}
      />

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full",
              isActivelyGenerating
                ? "bg-[var(--uxa-color-brand)] text-white animate-pulse"
                : "bg-emerald-500 text-white",
            )}
          >
            {isActivelyGenerating ? (
              <Activity className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)]">
              Generación de Entregables
            </p>
            <h3 className="text-[13px] font-black text-[var(--uxa-color-ink)]">
              {isActivelyGenerating
                ? `Generando entregables de ${productLabel}...`
                : processingQueue?.status === "completed_with_errors"
                  ? `Procesamiento de ${productLabel} finalizado con errores`
                  : `Entregables de ${productLabel} generados y actualizados`}
            </h3>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {canRetryFailed ? (
            <button className="uxa-button uxa-button--secondary" onClick={() => void onRetryFailed?.()} type="button">
              Reprocesar fallidos
            </button>
          ) : null}
          {canProcess ? (
            <button className="uxa-button uxa-button--primary" onClick={() => void onProcessPending?.()} type="button">
              {primaryLabel}
            </button>
          ) : null}
          <UxaBadge tone={isActivelyGenerating ? "info" : processingQueue?.failed_count ? "danger" : "success"}>
            {isActivelyGenerating ? "En Ejecución" : processingQueue?.failed_count ? "Completado con errores" : "Completado"}
          </UxaBadge>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {[
          ["Total", queueMetrics.total],
          ["Pendientes", queueMetrics.pending],
          ["En proceso", queueMetrics.processing],
          ["Completados", queueMetrics.completed],
          ["Fallidos", queueMetrics.failed],
          ["Reintentados", queueMetrics.retried],
        ].map(([label, value]) => (
          <div className="rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-border-soft)] bg-white/80 px-3 py-2" key={String(label)}>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)]">{label}</p>
            <p className="mt-1 text-[16px] font-black text-[var(--uxa-color-ink)]">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-[11px] font-bold text-[var(--uxa-color-ink-soft)] mb-1">
          <span>{processingQueue ? "Avance de la cola" : "Avance de compilación"}</span>
          <span>{percent}%</span>
        </div>
        <UxaProcessingStrip label="Progreso del pipeline de artefactos" value={percent} />
      </div>

      {processingQueue?.summary ? (
        <p className="mt-3 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
          {processingQueue.summary}
        </p>
      ) : null}

      <div className="mt-3 space-y-1.5 rounded-[var(--uxa-radius-md)] bg-white p-2.5">
        {generationPhases.map((phase, idx) => (
          <div className="flex items-center gap-2 text-[11px]" key={phase.label}>
            {phase.status === "completed" ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
            ) : phase.status === "running" ? (
              <RefreshCw className="h-3.5 w-3.5 shrink-0 text-[var(--uxa-color-brand)] animate-spin" />
            ) : (
              <span className="h-2 w-2 shrink-0 rounded-full bg-slate-300 ml-1 mr-0.5" />
            )}
            <span
              className={cn(
                "truncate",
                phase.status === "completed"
                  ? "text-slate-700 font-medium"
                  : phase.status === "running"
                    ? "text-[var(--uxa-color-brand)] font-bold"
                    : "text-slate-400",
              )}
            >
              Paso {idx + 1}: {phase.label}
            </span>
          </div>
        ))}
      </div>

      {(completedItems.length || failedItems.length) ? (
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <div className="rounded-[var(--uxa-radius-md)] border border-emerald-200 bg-white/85 p-3">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
              Generados correctamente
            </p>
            {completedItems.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {completedItems.slice(0, 6).map((item) => (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700" key={item.deliverable_key}>
                    {item.title}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-[12px] text-[var(--uxa-color-ink-soft)]">Aun no hay entregables exitosos en esta corrida.</p>
            )}
          </div>
          <div className="rounded-[var(--uxa-radius-md)] border border-rose-200 bg-white/85 p-3">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-rose-700">
              Continúan con error
            </p>
            {failedItems.length ? (
              <div className="mt-2 space-y-2">
                {failedItems.slice(0, 6).map((item) => (
                  <div className="rounded-[var(--uxa-radius-sm)] bg-rose-50 px-2.5 py-2" key={item.deliverable_key}>
                    <p className="text-[11px] font-semibold text-rose-800">{item.title}</p>
                    <p className="mt-1 text-[11px] leading-4 text-rose-700">{item.error_message || "Sin detalle adicional registrado."}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-[12px] text-[var(--uxa-color-ink-soft)]">Sin errores persistentes en la última ejecución.</p>
            )}
          </div>
        </div>
      ) : null}
    </UxaSurface>
  );
}

export function DeliverableProgressSummary({
  groups,
}: {
  groups: ExecutiveDeliverableGroup[];
}) {
  const total = groups.reduce((sum, group) => sum + group.total, 0);
  const available = groups.reduce((sum, group) => sum + group.available, 0);

  return (
    <UxaSurface className="p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--uxa-color-brand)]">
            Entregables construidos
          </p>
          <h2 className="mt-2 text-[20px] font-black text-[var(--uxa-color-ink)]">
            Resultado disponible para explorar
          </h2>
        </div>
        <UxaBadge tone={available ? "success" : "warning"}>
          {available}/{total} disponibles
        </UxaBadge>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {groups.length ? (
          groups.map((group) => (
            <div
              className="rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-border)] bg-[var(--uxa-color-muted-panel)] p-4"
              key={group.key}
            >
              <Boxes aria-hidden="true" className="h-5 w-5 text-[var(--uxa-color-brand)]" />
              <p className="mt-3 text-[13px] font-black text-[var(--uxa-color-ink)]">{group.label}</p>
              <p className="mt-1 text-[12px] text-[var(--uxa-color-ink-soft)]">
                {group.available} disponibles de {group.total}
              </p>
            </div>
          ))
        ) : (
          <p className="rounded-[var(--uxa-radius-md)] bg-[var(--uxa-color-muted-panel)] p-4 text-[13px] text-[var(--uxa-color-ink-soft)] md:col-span-3">
            Todavia no hay entregables reportados para esta superficie.
          </p>
        )}
      </div>
    </UxaSurface>
  );
}

export function ProductAttentionCallout({
  attentionHref,
  status,
}: {
  attentionHref: string;
  status?: ProductBuildStatus | null;
}) {
  const attention = status?.attention;
  const total = attention?.total ?? 0;
  const blocking = attention?.blocking_count ?? 0;

  return (
    <UxaSurface className="p-5" muted>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <UxaBadge tone={blocking ? "danger" : total ? "warning" : "success"}>
              {total ? `${total} items` : "Sin pendientes"}
            </UxaBadge>
            {blocking ? <UxaBadge tone="danger">{blocking} bloqueantes</UxaBadge> : null}
          </div>
          <h2 className="mt-3 text-[18px] font-black text-[var(--uxa-color-ink)]">Segmento de Atencion</h2>
          <p className="mt-1 text-[13px] leading-5 text-[var(--uxa-color-ink-soft)]">
            Centraliza preguntas, gaps, decisiones y errores que pueden afectar este producto.
          </p>
        </div>
        <a className="uxa-button uxa-button--secondary shrink-0" href={attentionHref}>
          <span>Abrir Atencion</span>
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </a>
      </div>
      {attention?.items.length ? (
        <div className="mt-4 grid gap-2">
          {attention.items.slice(0, 3).map((item) => (
            <div
              className="rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-border)] bg-white px-3 py-2"
              key={item.key}
            >
              <p className="text-[12px] font-black text-[var(--uxa-color-ink)]">{item.title}</p>
              <p className="mt-1 line-clamp-2 text-[11px] text-[var(--uxa-color-ink-soft)]">{item.reason}</p>
            </div>
          ))}
        </div>
      ) : null}
    </UxaSurface>
  );
}

export function ProductNextAction({
  model,
}: {
  model: ExecutiveOverviewModel;
}) {
  return (
    <UxaSurface className="border-[var(--uxa-color-brand)] bg-[var(--uxa-color-brand-soft)] p-5">
      <div className="flex flex-col gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ArrowRight aria-hidden="true" className="h-4 w-4 text-[var(--uxa-color-brand)]" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--uxa-color-brand)]">
              Continuidad del viaje
            </p>
          </div>
          <h2 className="mt-2 text-[18px] font-black text-[var(--uxa-color-ink)]">
            Siguiente mejor acción
          </h2>
          <p className="mt-2 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">{model.unlockMessage}</p>
        </div>
        <div className="flex flex-col gap-2 pt-1">
          <a className="uxa-button uxa-button--primary w-full justify-center" href={model.nextAction.href}>
            <Play aria-hidden="true" className="h-4 w-4" />
            <span>{model.nextAction.label}</span>
          </a>
          {model.secondaryAction ? (
            <a className="uxa-button uxa-button--secondary w-full justify-center" href={model.secondaryAction.href}>
              <FileText aria-hidden="true" className="h-4 w-4" />
              <span>{model.secondaryAction.label}</span>
            </a>
          ) : null}
        </div>
      </div>
    </UxaSurface>
  );
}

export function ExecutiveOverviewDemo({
  model,
  status,
}: {
  model: ExecutiveOverviewModel;
  status?: ProductBuildStatus | null;
}) {
  return (
    <ExecutiveOverviewShell model={model} status={status}>
      <DeliverableGenerationLiveTracker
        productKey={model.productKey}
        productLabel={model.productLabel}
        status={status}
      />
      <ExecutiveProductKeyDeliverables productKey={model.productKey} sessionId={status?.session_id} />
      <DeliverableProgressSummary groups={model.deliverableGroups} />
      <ProductAttentionCallout attentionHref={`/projects/${status?.session_id ?? ""}/attention`} status={status} />
      <ProductNextAction model={model} />
    </ExecutiveOverviewShell>
  );
}

export const executiveOverviewIcons = {
  brain: Brain,
  file: FileText,
  git: GitBranch,
  layers: Layers3,
  lock: LockKeyhole,
  package: PackageCheck,
  sparkles: Sparkles,
};
