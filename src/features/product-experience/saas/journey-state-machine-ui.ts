import type { SupportedLanguage } from "@/core/i18n/language-context";
import { byLanguage } from "@/features/product-experience/core/localized-copy";
import type { UxaTone } from "@/features/product-experience/design-system";
import {
  getJourneyStateMachineCurrent,
  type JourneyStateKey,
  type JourneyStateSubstate,
} from "@/features/product-experience/saas/product-journey-overview";

type LocalizedTriplet = {
  en: string;
  es: string;
  pt: string;
};

export type JourneyStateMachineDisplay = {
  detail: string;
  label: string;
  productLabel: string;
  substateLabel: string;
  substateTone: UxaTone;
};

const STATE_LABELS: Record<JourneyStateKey, LocalizedTriplet> = {
  discover: { en: "Discover", es: "Descubrir", pt: "Descobrir" },
  define: { en: "Define", es: "Definir", pt: "Definir" },
  design: { en: "Design", es: "Disenar", pt: "Design" },
  tools: { en: "Tools", es: "Herramientas", pt: "Ferramentas" },
  memory: { en: "Memory", es: "Memoria", pt: "Memoria" },
  estimate: { en: "Blueprint Free", es: "Blueprint Free", pt: "Blueprint Free" },
  blueprint_free_ready: { en: "Blueprint Free ready", es: "Blueprint Free listo", pt: "Blueprint Free pronto" },
  blueprint_pro_access_requested: { en: "Blueprint Pro request", es: "Solicitud Blueprint Pro", pt: "Solicitacao Blueprint Pro" },
  blueprint_pro_access_pending: { en: "Blueprint Pro activation", es: "Activacion Blueprint Pro", pt: "Ativacao Blueprint Pro" },
  blueprint_pro_active: { en: "Blueprint Pro", es: "Blueprint Pro", pt: "Blueprint Pro" },
  acp_access_requested: { en: "ACP request", es: "Solicitud ACP", pt: "Solicitacao ACP" },
  acp_access_pending: { en: "ACP activation", es: "Activacion ACP", pt: "Ativacao ACP" },
  acp_prep: { en: "ACP preparation", es: "Preparacion ACP", pt: "Preparacao ACP" },
  validate: { en: "Validate", es: "Validar", pt: "Validar" },
  package: { en: "Package", es: "Package", pt: "Pacote" },
  completed: { en: "Completed", es: "Completado", pt: "Concluido" },
};

const STATE_DETAILS: Record<JourneyStateKey, LocalizedTriplet> = {
  discover: {
    en: "Capture and understand the problem before structuring the solution.",
    es: "Captura y entendimiento inicial del problema antes de estructurar la solucion.",
    pt: "Captura e entendimento inicial do problema antes de estruturar a solucao.",
  },
  define: {
    en: "Consolidate scope, objectives, and requirements.",
    es: "Consolida alcance, objetivos y requerimientos.",
    pt: "Consolida escopo, objetivos e requisitos.",
  },
  design: {
    en: "Define architecture, behavior, and governance decisions.",
    es: "Define arquitectura, comportamiento y decisiones de gobernanza.",
    pt: "Define arquitetura, comportamento e decisoes de governanca.",
  },
  tools: {
    en: "Classify tools, contracts, and integrations with the minimum viable set.",
    es: "Clasifica herramientas, contratos e integraciones con el set minimo viable.",
    pt: "Classifica ferramentas, contratos e integracoes com o conjunto minimo viavel.",
  },
  memory: {
    en: "Define memory, knowledge, and context strategy.",
    es: "Define la estrategia de memoria, conocimiento y contexto.",
    pt: "Define a estrategia de memoria, conhecimento e contexto.",
  },
  estimate: {
    en: "Prepare the free Blueprint before moving to premium products.",
    es: "Prepara el Blueprint Free antes de pasar a productos premium.",
    pt: "Prepara o Blueprint Free antes de avancar para produtos premium.",
  },
  blueprint_free_ready: {
    en: "The free Blueprint is ready to review before requesting Blueprint Pro.",
    es: "El Blueprint Free esta listo para revisarse antes de solicitar Blueprint Pro.",
    pt: "O Blueprint Free esta pronto para revisao antes de solicitar o Blueprint Pro.",
  },
  blueprint_pro_access_requested: {
    en: "The Blueprint Pro request was created and is waiting for approval.",
    es: "La solicitud de Blueprint Pro fue creada y esta esperando aprobacion.",
    pt: "A solicitacao de Blueprint Pro foi criada e aguarda aprovacao.",
  },
  blueprint_pro_access_pending: {
    en: "Blueprint Pro is waiting for the commercial activation to finish.",
    es: "Blueprint Pro esta esperando que termine la activacion comercial.",
    pt: "O Blueprint Pro aguarda a conclusao da ativacao comercial.",
  },
  blueprint_pro_active: {
    en: "Blueprint Pro is enabled for enrichment, generation, and download.",
    es: "Blueprint Pro esta habilitado para enriquecimiento, generacion y descarga.",
    pt: "O Blueprint Pro esta habilitado para enriquecimento, geracao e download.",
  },
  acp_access_requested: {
    en: "The ACP request was created and is waiting for approval.",
    es: "La solicitud de ACP fue creada y esta esperando aprobacion.",
    pt: "A solicitacao de ACP foi criada e aguarda aprovacao.",
  },
  acp_access_pending: {
    en: "ACP is waiting for the commercial activation to finish.",
    es: "ACP esta esperando que termine la activacion comercial.",
    pt: "O ACP aguarda a conclusao da ativacao comercial.",
  },
  acp_prep: {
    en: "ACP is open to organize questions, gaps, impact, and implementation decisions.",
    es: "ACP esta abierto para organizar preguntas, gaps, impacto y decisiones de implementacion.",
    pt: "O ACP esta aberto para organizar perguntas, gaps, impacto e decisoes de implementacao.",
  },
  validate: {
    en: "Validate the ACP with scenarios, findings, and governance evidence.",
    es: "Valida el ACP con escenarios, hallazgos y evidencia de gobernanza.",
    pt: "Valida o ACP com cenarios, achados e evidencia de governanca.",
  },
  package: {
    en: "Prepare the final ACP package and the exportable bundle.",
    es: "Prepara el paquete final ACP y el bundle exportable.",
    pt: "Prepara o pacote final do ACP e o bundle exportavel.",
  },
  completed: {
    en: "The premium package is complete and ready to download.",
    es: "El paquete premium esta completo y listo para descargar.",
    pt: "O pacote premium esta concluido e pronto para download.",
  },
};

const SUBSTATE_LABELS: Record<JourneyStateSubstate, LocalizedTriplet> = {
  idle: { en: "Ready", es: "Listo", pt: "Pronto" },
  running: { en: "Processing", es: "Procesando", pt: "Processando" },
  waiting_user: { en: "Waiting for you", es: "Espera usuario", pt: "Aguardando voce" },
  waiting_dependency: { en: "Waiting dependency", es: "Espera dependencia", pt: "Aguardando dependencia" },
  retrying: { en: "Retrying", es: "Reintentando", pt: "Tentando novamente" },
  completed: { en: "Completed", es: "Completado", pt: "Concluido" },
  failed: { en: "Failed", es: "Fallido", pt: "Falhou" },
  blocked: { en: "Blocked", es: "Bloqueado", pt: "Bloqueado" },
};

const SUBSTATE_TONES: Record<JourneyStateSubstate, UxaTone> = {
  idle: "info",
  running: "info",
  waiting_user: "warning",
  waiting_dependency: "warning",
  retrying: "warning",
  completed: "success",
  failed: "danger",
  blocked: "danger",
};

function productLabel(language: SupportedLanguage, productKey: string) {
  if (productKey === "acp") {
    return "ACP";
  }

  if (productKey === "blueprint_pro") {
    return byLanguage(language, {
      en: "Blueprint Pro",
      es: "Blueprint Pro",
      pt: "Blueprint Pro",
    });
  }

  return byLanguage(language, {
    en: "Blueprint",
    es: "Blueprint",
    pt: "Blueprint",
  });
}

export function getJourneyStateMachineDisplay(
  language: SupportedLanguage,
  stateMachine: unknown,
): JourneyStateMachineDisplay | null {
  const current = getJourneyStateMachineCurrent(stateMachine);
  if (!current) {
    return null;
  }

  return {
    detail: byLanguage(language, STATE_DETAILS[current.state_key]),
    label: byLanguage(language, STATE_LABELS[current.state_key]),
    productLabel: productLabel(language, current.product_key),
    substateLabel: byLanguage(language, SUBSTATE_LABELS[current.substate]),
    substateTone: SUBSTATE_TONES[current.substate],
  };
}
