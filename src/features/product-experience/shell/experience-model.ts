import {
  getProjectProductRoute,
  type ProjectProductRouteSection,
  type ProjectRouteStage,
} from "@/core/routing/routes";
import type { TranslationKey } from "@/core/i18n/locales/es";
import {
  getJourneyIndex,
  resolveWorkStageForExperienceStage,
  type LeanExperienceStage,
  type LeanWorkStage,
} from "@/features/journey/journey-model";

export type ProductExperienceProductSection = ProjectProductRouteSection | "work";

export type ProductExperienceStageDefinition = {
  exitCriteria: string;
  key: LeanExperienceStage;
  nextAction: string;
  objective: string;
  output: string;
  product: "Blueprint" | "Blueprint Pro" | "ACP";
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
    exitCriteria: "Resultado base listo para explorar antes de solicitar capacidades premium.",
    key: "blueprint_free_ready",
    nextAction: "Revisar resultado y decidir si quieres solicitar Blueprint Pro",
    objective: "Presentar el resultado del Blueprint Free como momento de cierre del journey LEAN base.",
    output: "Blueprint Free listo para visualizar.",
    product: "Blueprint",
    subtitle: "Resultado base listo",
    title: "Blueprint",
  },
  {
    exitCriteria: "La solicitud de Blueprint Pro ya fue registrada para revision comercial o administrativa.",
    key: "blueprint_pro_access_requested",
    nextAction: "Esperar aprobacion o dar seguimiento a la solicitud",
    objective: "Hacer visible que Blueprint Pro aun no esta activo y que la solicitud fue creada.",
    output: "Solicitud de Blueprint Pro creada.",
    product: "Blueprint Pro",
    subtitle: "Solicitud registrada",
    title: "Solicitud Blueprint Pro",
  },
  {
    exitCriteria: "El acceso premium termina de activarse y sincronizar permisos efectivos.",
    key: "blueprint_pro_access_pending",
    nextAction: "Esperar activacion comercial efectiva",
    objective: "Narrar que la aprobacion existe, pero el acceso aun se esta propagando.",
    output: "Activacion comercial de Blueprint Pro en curso.",
    product: "Blueprint Pro",
    subtitle: "Espera activacion",
    title: "Activacion Blueprint Pro",
  },
  {
    exitCriteria: "Entregables profesionales listos para enriquecer, reconciliar de forma selectiva y descargar.",
    key: "blueprint_pro_active",
    nextAction: "Resolver preguntas, enriquecer y descargar el Blueprint Pro",
    objective: "Trabajar el enriquecimiento premium con trazabilidad, impacto y exportables reales.",
    output: "Workspace de Blueprint Pro activo.",
    product: "Blueprint Pro",
    subtitle: "Enriquecimiento y descarga",
    title: "Blueprint Pro",
  },
  {
    exitCriteria: "La solicitud de ACP ya fue registrada para revision comercial o administrativa.",
    key: "acp_access_requested",
    nextAction: "Esperar aprobacion o seguimiento de ACP",
    objective: "Mostrar que ACP aun no puede iniciar hasta que la solicitud sea aprobada.",
    output: "Solicitud de ACP creada.",
    product: "ACP",
    subtitle: "Solicitud registrada",
    title: "Solicitud ACP",
  },
  {
    exitCriteria: "El acceso ACP termina de activarse y sincronizar permisos efectivos.",
    key: "acp_access_pending",
    nextAction: "Esperar activacion comercial efectiva",
    objective: "Narrar la fase intermedia entre aprobacion y acceso operativo del ACP.",
    output: "Activacion comercial de ACP en curso.",
    product: "ACP",
    subtitle: "Espera activacion",
    title: "Activacion ACP",
  },
  {
    exitCriteria: "Preguntas, gaps, impacto y decisiones ACP organizadas antes de validar o empaquetar.",
    key: "acp_prep",
    nextAction: "Resolver preguntas, delegar decisiones e identificar impacto",
    objective: "Concentrar la preparacion del ACP sin regresar visualmente al workflow base.",
    output: "Workspace de preparacion ACP.",
    product: "ACP",
    subtitle: "Preparacion y pendientes",
    title: "Preparacion ACP",
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
  {
    exitCriteria: "Paquete premium final listo para descargar con trazabilidad y exportables coherentes.",
    key: "completed",
    nextAction: "Descargar el paquete final",
    objective: "Cerrar el journey premium con un estado final claro y descargable.",
    output: "Paquete premium completado.",
    product: "ACP",
    subtitle: "Entrega final lista",
    title: "Completado",
  },
];

function translationKeyForStage(
  stage: LeanExperienceStage,
  field: "title" | "subtitle",
): TranslationKey | null {
  if (
    stage === "discover" ||
    stage === "define" ||
    stage === "design" ||
    stage === "tools" ||
    stage === "memory" ||
    stage === "estimate" ||
    stage === "validate" ||
    stage === "package"
  ) {
    return `stage.${stage}.${field}` as TranslationKey;
  }

  return null;
}

export function getProductExperienceStage(stage: LeanExperienceStage, t?: (key: TranslationKey, fallback?: string) => string) {
  const definition = PRODUCT_EXPERIENCE_STAGES.find((item) => item.key === stage) ?? PRODUCT_EXPERIENCE_STAGES[0];
  if (t) {
    const subtitleKey = translationKeyForStage(definition.key, "subtitle");
    const titleKey = translationKeyForStage(definition.key, "title");
    return {
      ...definition,
      subtitle: subtitleKey ? t(subtitleKey, definition.subtitle) : definition.subtitle,
      title: titleKey ? t(titleKey, definition.title) : definition.title,
    };
  }
  return definition;
}

export function getProductExperienceStageHref(sessionId: string, stage: LeanWorkStage) {
  return `/projects/${sessionId}/work/${stage}`;
}

export function getProductExperienceStateHref(sessionId: string, stage: LeanExperienceStage) {
  if (
    stage === "discover" ||
    stage === "define" ||
    stage === "design" ||
    stage === "tools" ||
    stage === "memory" ||
    stage === "estimate"
  ) {
    return getProductExperienceStageHref(sessionId, stage);
  }

  if (stage === "blueprint_free_ready") {
    return getProjectProductRoute(sessionId, "blueprint");
  }

  if (stage === "blueprint_pro_access_requested" || stage === "blueprint_pro_access_pending") {
    return getProjectProductRoute(sessionId, "blueprint_pro_overview");
  }

  if (stage === "blueprint_pro_active") {
    return getProjectProductRoute(sessionId, "blueprint_pro");
  }

  if (stage === "acp_access_requested" || stage === "acp_access_pending") {
    return getProjectProductRoute(sessionId, "acp_overview");
  }

  if (stage === "acp_prep") {
    return getProjectProductRoute(sessionId, "acp");
  }

  if (stage === "validate") {
    return `${getProjectProductRoute(sessionId, "acp")}?acp_tab=validate`;
  }

  return `${getProjectProductRoute(sessionId, "acp")}?acp_tab=package`;
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

export function getStageState(candidate: LeanWorkStage, activeStage: LeanExperienceStage) {
  const candidateIndex = getJourneyIndex(candidate);
  const activeWorkStage = resolveWorkStageForExperienceStage(activeStage);
  const activeIndex = getJourneyIndex(activeWorkStage);

  if (candidate === activeWorkStage) {
    return "active" as const;
  }

  return candidateIndex < activeIndex ? ("done" as const) : ("pending" as const);
}

export function getProductFetchStageForSection(section: ProductExperienceProductSection | null | undefined): ProjectRouteStage {
  if (section === "acp" || section === "acp_overview") {
    return "validate";
  }

  if (section === "artifacts" || section === "attention" || section === "activity") {
    return "estimate";
  }

  return "estimate";
}

export function getProductDisplayStageForSection(section: ProductExperienceProductSection | null | undefined): LeanExperienceStage {
  if (section === "blueprint" || section === "blueprint_overview") {
    return "blueprint_free_ready";
  }

  if (section === "blueprint_pro_overview") {
    return "blueprint_pro_access_requested";
  }

  if (section === "blueprint_pro") {
    return "blueprint_pro_active";
  }

  if (section === "acp_overview") {
    return "acp_access_requested";
  }

  if (section === "acp") {
    return "acp_prep";
  }

  return "estimate";
}
