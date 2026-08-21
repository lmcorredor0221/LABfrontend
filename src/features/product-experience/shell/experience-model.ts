import {
  getProjectProductRoute,
  type ProjectProductRouteSection,
  type ProjectRouteStage,
} from "@/core/routing/routes";
import type { TranslationKey } from "@/core/i18n/locales/es";
import { getJourneyIndex } from "@/features/journey/journey-model";

export type ProductExperienceProductSection = ProjectProductRouteSection | "work";

export type ProductExperienceStageDefinition = {
  exitCriteria: string;
  key: ProjectRouteStage;
  nextAction: string;
  objective: string;
  output: string;
  product: "Blueprint" | "ACP";
  subtitle: string;
  title: string;
};

export type ProductExperienceProductNavItem = {
  description: string;
  href: string;
  key: ProductExperienceProductSection;
  label: string;
  product: "Blueprint" | "Blueprint Pro" | "ACP" | "Workspace";
};

export const PRODUCT_EXPERIENCE_STAGES: ProductExperienceStageDefinition[] = [
  {
    exitCriteria: "Contexto suficiente para que el LLM normalice el problema sin asumir informacion critica.",
    key: "discover",
    nextAction: "Completar contexto y analizar",
    objective: "Comprender problema, contexto de negocio, objetivos, restricciones y necesidades del usuario.",
    output: "Canvas de descubrimiento y contexto validado.",
    product: "Blueprint",
    subtitle: "Problema y contexto",
    title: "Descubrir",
  },
  {
    exitCriteria: "Requisitos funcionales, no funcionales, reglas y alcance listos para diseno.",
    key: "define",
    nextAction: "Revisar definicion propuesta",
    objective: "Consolidar y estructurar requerimientos, alcance y criterios de exito.",
    output: "Definicion funcional y no funcional aprobable.",
    product: "Blueprint",
    subtitle: "Objetivos y alcance",
    title: "Definir",
  },
  {
    exitCriteria: "Arquitectura, patrones agentivos, decisiones y flujos aprobados.",
    key: "design",
    nextAction: "Resolver autoridad y aprobar diseno",
    objective: "Definir arquitectura, comportamiento, patrones, colaboracion y toma de decisiones del agente.",
    output: "Especificacion de arquitectura y conducta.",
    product: "Blueprint",
    subtitle: "Arquitectura y conducta",
    title: "Disenar",
  },
  {
    exitCriteria: "Toolset minimo clasificado y justificado sin sobreaprovisionamiento.",
    key: "tools",
    nextAction: "Confirmar herramientas obligatorias",
    objective: "Identificar capacidades externas, herramientas, APIs, contratos y reglas de integracion.",
    output: "Herramientas minimas gobernadas.",
    product: "Blueprint",
    subtitle: "Capacidades y contratos",
    title: "Herramientas",
  },
  {
    exitCriteria: "Estrategia de corto/largo plazo, RAG y recuperacion consistente con herramientas.",
    key: "memory",
    nextAction: "Aprobar estrategia de memoria",
    objective: "Disenar memoria corta, memoria larga, RAG, conocimiento y gestion de contexto.",
    output: "Estrategia de memoria y conocimiento.",
    product: "Blueprint",
    subtitle: "Memoria y conocimiento",
    title: "Memoria",
  },
  {
    exitCriteria: "Estimacion y comparativas listas para mostrar valor comercial del Blueprint.",
    key: "estimate",
    nextAction: "Revisar escenarios de construccion",
    objective: "Cuantificar esfuerzo, costo, riesgo, ahorro, ROI y time to market.",
    output: "Estimacion y comparativa comercial.",
    product: "Blueprint",
    subtitle: "Valor, costo y ROI",
    title: "Estimar",
  },
  {
    exitCriteria: "Escenarios, pruebas, gaps y preguntas del ACP clasificados.",
    key: "validate",
    nextAction: "Validar Blueprint para ACP",
    objective: "Validar el Blueprint mediante escenarios, test suite, findings y gobernanza.",
    output: "Test suite y reporte de validacion.",
    product: "ACP",
    subtitle: "Pruebas y GAPs",
    title: "Validar",
  },
  {
    exitCriteria: "ACP portable con artefactos tecnicos, instrucciones y preguntas estructuradas.",
    key: "package",
    nextAction: "Generar paquete portable",
    objective: "Construir especificaciones y artefactos portables para iniciar implementacion agentica.",
    output: "Agent Construction Package.",
    product: "ACP",
    subtitle: "Paquete portable",
    title: "Package",
  },
];

export function getProductExperienceStage(stage: ProjectRouteStage, t?: (key: TranslationKey, fallback?: string) => string) {
  const definition = PRODUCT_EXPERIENCE_STAGES.find((item) => item.key === stage) ?? PRODUCT_EXPERIENCE_STAGES[0];
  if (t) {
    return {
      ...definition,
      subtitle: t(`stage.${stage}.subtitle`, definition.subtitle),
      title: t(`stage.${stage}.title`, definition.title),
    };
  }
  return definition;
}

export function getProductExperienceStageHref(sessionId: string, stage: ProjectRouteStage) {
  return `/projects/${sessionId}/work/${stage}`;
}

export function getProductExperienceProductHref(sessionId: string, section: ProductExperienceProductSection) {
  if (section === "work") {
    return getProductExperienceStageHref(sessionId, "discover");
  }

  return getProjectProductRoute(sessionId, section);
}

export function getProductExperienceProductNav(sessionId: string, t?: (key: TranslationKey, fallback?: string) => string): ProductExperienceProductNavItem[] {
  return [
    {
      description: t ? t("productNav.workDesc", "Etapas LEAN y accion principal") : "Etapas LEAN y accion principal",
      href: getProductExperienceStageHref(sessionId, "discover"),
      key: "work",
      label: t ? t("productNav.work", "Trabajo LEAN") : "Trabajo LEAN",
      product: "Workspace",
    },
    {
      description: t ? t("productNav.blueprintDesc", "Visualizacion protegida del diseno") : "Visualizacion protegida del diseno",
      href: getProjectProductRoute(sessionId, "blueprint"),
      key: "blueprint",
      label: t ? t("productNav.blueprint", "Blueprint") : "Blueprint",
      product: "Blueprint",
    },
    {
      description: t ? t("productNav.blueprintProDesc", "Descarga profesional y documentacion completa") : "Descarga profesional y documentacion completa",
      href: getProjectProductRoute(sessionId, "blueprint_pro"),
      key: "blueprint_pro",
      label: t ? t("productNav.blueprint_pro", "Blueprint Pro") : "Blueprint Pro",
      product: "Blueprint Pro",
    },
    {
      description: t ? t("productNav.diagramsDesc", "Catalogo unificado de diagramas") : "Catalogo unificado de diagramas",
      href: getProjectProductRoute(sessionId, "diagrams"),
      key: "diagrams",
      label: t ? t("productNav.diagrams", "Diagramas") : "Diagramas",
      product: "Blueprint",
    },
    {
      description: t ? t("productNav.acpDesc", "Paquete portable y validacion tecnica") : "Paquete portable y validacion tecnica",
      href: getProjectProductRoute(sessionId, "acp"),
      key: "acp",
      label: t ? t("productNav.acp", "ACP Premium") : "ACP Premium",
      product: "ACP",
    },
    {
      description: t ? t("productNav.artifactsDesc", "Documentos, versiones y evidencias") : "Documentos, versiones y evidencias",
      href: getProjectProductRoute(sessionId, "artifacts"),
      key: "artifacts",
      label: t ? t("productNav.artifacts", "Artefactos") : "Artefactos",
      product: "Workspace",
    },
    {
      description: t ? t("productNav.attentionDesc", "Preguntas, gaps y decisiones") : "Preguntas, gaps y decisiones",
      href: getProjectProductRoute(sessionId, "attention"),
      key: "attention",
      label: t ? t("productNav.attention", "Atencion") : "Atencion",
      product: "Workspace",
    },
    {
      description: t ? t("productNav.activityDesc", "Linea de tiempo y operaciones") : "Linea de tiempo y operaciones",
      href: getProjectProductRoute(sessionId, "activity"),
      key: "activity",
      label: t ? t("productNav.activity", "Actividad") : "Actividad",
      product: "Workspace",
    },
  ];
}

export function getStageState(candidate: ProjectRouteStage, activeStage: ProjectRouteStage) {
  const candidateIndex = getJourneyIndex(candidate);
  const activeIndex = getJourneyIndex(activeStage);

  if (candidate === activeStage) {
    return "active" as const;
  }

  return candidateIndex < activeIndex ? ("done" as const) : ("pending" as const);
}

export function getProductStageForSection(section: ProductExperienceProductSection | null | undefined): ProjectRouteStage {
  if (section === "acp" || section === "acp_overview") {
    return "validate";
  }

  if (section === "artifacts" || section === "attention" || section === "activity") {
    return "estimate";
  }

  return "estimate";
}
