"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Bell,
  Brain,
  Check,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  CircleDot,
  FileText,
  GitBranch,
  Globe,
  Layers3,
  LockKeyhole,
  PackageCheck,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  Workflow,
  Wrench,
} from "lucide-react";
import {
  UxaBadge,
  UxaProductHero,
  UxaSurface,
  type UxaTone,
} from "@/features/product-experience/design-system";
import {
  DeliverableGenerationLiveTracker,
  ExecutiveProductKeyDeliverables,
} from "@/features/product-experience/saas/executive-overview-components";
import { cn } from "@/lib/utils";

export type ExecutiveOverviewProduct = "blueprint" | "blueprint_pro" | "acp";

type StoryMoment = {
  body: string;
  eyebrow: string;
  evidence: string[];
  icon: typeof Target;
  label: string;
  title: string;
  tone: UxaTone;
};

type ProductNarrative = {
  badge: string;
  description: string;
  nextLabel: string;
  nextHref: string;
  product: ExecutiveOverviewProduct;
  story: StoryMoment[];
  title: string;
  unlock?: string;
};

const PROJECT_TITLE = "Las solicitudes de clientes sobre fallas del servicio, facturacion y cambios";

const SHARED_STORY: StoryMoment[] = [
  {
    body: "La necesidad se capturo como un problema operativo concreto, con un proceso manual que podia medirse y una oportunidad clara de asistencia inteligente.",
    eyebrow: "Punto de partida",
    evidence: ["Contexto de negocio capturado", "Proceso actual identificado", "Oportunidad de automatizacion registrada"],
    icon: Target,
    label: "Descubrir",
    title: "Entender antes de construir",
    tone: "info",
  },
  {
    body: "El contexto se transformo en objetivos, alcance, requisitos y reglas que sirven como fuente de verdad para el resto del diseno.",
    eyebrow: "Definicion",
    evidence: ["Objetivos y alcance", "Requisitos funcionales y NFR", "Criterios de aceptacion y reglas"],
    icon: CheckCircle2,
    label: "Definir",
    title: "Convertir una necesidad en decisiones",
    tone: "success",
  },
  {
    body: "La solucion se estructuro con un patron agentivo, una arquitectura, controles, handoffs y mecanismos de decision alineados al caso.",
    eyebrow: "Diseno",
    evidence: ["Arquitectura y comportamiento", "Patrones de razonamiento", "Guardrails y aprobaciones"],
    icon: Workflow,
    label: "Diseñar",
    title: "Dar forma al agente",
    tone: "info",
  },
  {
    body: "Se identificaron las capacidades minimas que el agente necesita para operar, separando herramientas internas, integraciones y dependencias externas.",
    eyebrow: "Capacidades",
    evidence: ["Herramientas obligatorias", "Contratos y permisos", "Dependencias explicitas"],
    icon: Wrench,
    label: "Herramientas",
    title: "Elegir solo lo necesario",
    tone: "warning",
  },
  {
    body: "La estrategia de conocimiento define como recuperar evidencia, que conservar y como controlar el contexto para que el agente sea consistente y trazable.",
    eyebrow: "Conocimiento",
    evidence: ["Memoria corta y larga", "RAG y fuentes autorizadas", "Politicas de retencion y recuperacion"],
    icon: Brain,
    label: "Memoria",
    title: "Hacer que el conocimiento sea util",
    tone: "success",
  },
];

const NARRATIVES: Record<ExecutiveOverviewProduct, ProductNarrative> = {
  blueprint: {
    badge: "Blueprint basico",
    description: "Una lectura ejecutiva del camino que convierte una necesidad de negocio en un diseno integral visible y gobernado.",
    nextHref: "/mockups/artifact-center",
    nextLabel: "Explorar entregables del Blueprint",
    product: "blueprint",
    story: SHARED_STORY,
    title: "De una necesidad ambigua a una propuesta clara",
    unlock: "La vista protegida demuestra el valor generado. La documentacion exportable se desbloquea con Blueprint Pro.",
  },
  blueprint_pro: {
    badge: "Blueprint profesional",
    description: "La misma historia, enriquecida con decisiones resueltas, mayor profundidad documental y una base profesional para presentar la solucion.",
    nextHref: "/mockups/artifact-center",
    nextLabel: "Explorar documentos profesionales",
    product: "blueprint_pro",
    story: SHARED_STORY.map((moment, index) => ({
      ...moment,
      body:
        index < 2
          ? `${moment.body} En esta edicion se conserva la trazabilidad de la respuesta y su impacto sobre el diseno.`
          : `${moment.body} La definicion se presenta con mayor detalle para facilitar la decision tecnica y comercial.`,
    })),
    title: "De una propuesta clara a un Blueprint defendible",
    unlock: "Blueprint Pro agrega profundidad, versiones y documentacion profesional para compartir y decidir con evidencia.",
  },
  acp: {
    badge: "Agent Construction Package",
    description: "La culminacion del viaje: el conocimiento aprobado se organiza en un paquete portable para iniciar la construccion con preguntas explicitas donde aun se requiere implementacion.",
    nextHref: "/mockups/artifact-center",
    nextLabel: "Explorar paquete y artefactos",
    product: "acp",
    story: SHARED_STORY.map((moment, index) => ({
      ...moment,
      body:
        index < 2
          ? `${moment.body} El ACP hereda estas decisiones como contexto aprobado y no las vuelve a descubrir.`
          : `${moment.body} El resultado se traduce a especificaciones, validaciones y artefactos listos para una herramienta de construccion.`,
    })),
    title: "Del diseno aprobado a una construccion gobernada",
    unlock: "El ACP no oculta las decisiones pendientes de implementacion: las convierte en preguntas estructuradas con momento de cierre.",
  },
};

const PRODUCT_NAVIGATION = [
  { href: "#journey", key: "work", label: "Trabajo LEAN" },
  { href: productHref("blueprint"), key: "blueprint", label: "Blueprint" },
  { href: productHref("blueprint_pro"), key: "blueprint_pro", label: "Blueprint Pro" },
  { href: "/mockups/artifact-center", key: "diagrams", label: "Diagramas" },
  { href: productHref("acp"), key: "acp", label: "ACP Premium" },
  { href: "/mockups/artifact-center", key: "artifacts", label: "Artefactos" },
  { href: "#attention", key: "attention", label: "Atencion" },
  { href: "#activity", key: "activity", label: "Actividad" },
];

function productHref(product: ExecutiveOverviewProduct) {
  return `/mockups/executive-overview/${product === "blueprint_pro" ? "blueprint-pro" : product}`;
}

function productTone(product: ExecutiveOverviewProduct): UxaTone {
  return product === "acp" ? "success" : product === "blueprint_pro" ? "info" : "neutral";
}

function productReadiness(product: ExecutiveOverviewProduct) {
  if (product === "acp") {
    return {
      detail: "Las decisiones aprobadas se organizan como una base portable para iniciar la construccion.",
      label: "Paquete portable",
    };
  }

  if (product === "blueprint_pro") {
    return {
      detail: "La historia incorpora mayor profundidad documental, decisiones y evidencia para compartir el diseno.",
      label: "Blueprint enriquecido",
    };
  }

  return {
    detail: "La necesidad ya se convirtio en una propuesta de diseno visible, gobernada y lista para explorar.",
    label: "Diseno integral",
  };
}

function stageCompletion(product: ExecutiveOverviewProduct, index: number) {
  if (product === "blueprint") {
    return index < 3 ? "Aprobada" : index === 3 ? "Generada" : "Enriquecida";
  }

  if (product === "blueprint_pro") {
    return index < 5 ? "Enriquecida" : "Disponible";
  }

  return index < 5 ? "Heredada" : "Lista para ACP";
}

function OverviewHeader({ narrative }: { narrative: ProductNarrative }) {
  const activeNavKey = narrative.product === "blueprint" ? "blueprint" : narrative.product === "blueprint_pro" ? "blueprint_pro" : "acp";

  return (
    <header className="border-b border-[var(--border-default)] bg-white">
      <div className="uxa-project-topbar mx-auto flex w-full max-w-[var(--uxa-layout-content-max)] items-center justify-between gap-4 px-4 py-3 lg:px-5">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <a
            aria-label="Volver al inicio"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[var(--gradient-primary)] text-white shadow-sm"
            href="/mockups/executive-overview/blueprint"
          >
            <Sparkles className="h-5 w-5" />
          </a>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px]">
              <UxaBadge tone="success">Listo</UxaBadge>
              <UxaBadge tone="info">{narrative.badge}</UxaBadge>
              <span className="hidden font-medium text-[var(--text-secondary)] sm:inline">Resumen ejecutivo</span>
            </div>
            <h1 className="uxa-project-title truncate text-[18px] font-semibold text-[var(--text-primary)]">{PROJECT_TITLE}</h1>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button className="hidden h-9 items-center gap-2 rounded-lg border border-[var(--border-default)] bg-white px-3 text-[12px] font-semibold text-[var(--text-primary)] shadow-sm sm:flex" type="button">
            <Bell className="h-4 w-4 text-[var(--brand-primary)]" />
            <span>0</span>
            <UxaBadge tone="success">Al dia</UxaBadge>
          </button>
          <button className="uxa-button uxa-button--secondary uxa-button--sm" type="button">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Recargar</span>
          </button>
          <button aria-label="Cambiar idioma" className="hidden h-9 items-center gap-1.5 rounded-full border border-[var(--border-default)] bg-white px-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--text-primary)] shadow-sm sm:inline-flex" type="button">
            <Globe className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
            <span>ES</span>
            <ChevronDown className="h-3 w-3 text-[var(--text-secondary)]" />
          </button>
          <button aria-label="Menu de usuario" className="flex h-9 items-center gap-2 rounded-full border border-[var(--border-default)] bg-white py-1 pl-1 pr-2.5 text-[var(--text-primary)] shadow-sm" type="button">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#101b2d] text-[11px] font-semibold text-white">LB</span>
            <span className="hidden max-w-[132px] truncate text-[12px] font-semibold lg:inline">Lean Builder Admin</span>
            <ChevronDown className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
          </button>
        </div>
      </div>
      <nav aria-label="Navegacion de producto" className="uxa-product-navigation border-t border-[var(--border-default)] bg-[var(--surface-subtle)] px-4">
        <div className="uxa-product-navigation-list mx-auto flex w-full max-w-[var(--uxa-layout-content-max)] items-center gap-1 overflow-x-auto py-2 scrollbar-subtle lg:px-1">
          {PRODUCT_NAVIGATION.map((item) => (
            <a
              className={cn(
                "uxa-product-nav-link whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-medium transition",
                item.key === activeNavKey
                  ? "bg-[var(--brand-primary)] font-semibold text-white"
                  : "text-[var(--text-secondary)] hover:bg-white hover:text-[var(--text-primary)]",
              )}
              href={item.href}
              key={item.key}
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>
    </header>
  );
}

function Hero({ narrative }: { narrative: ProductNarrative }) {
  const readiness = productReadiness(narrative.product);

  return (
    <UxaProductHero
      description={narrative.description}
      eyebrow={
        <div className="flex flex-wrap items-center gap-2">
          <UxaBadge tone={productTone(narrative.product)}>{narrative.badge}</UxaBadge>
          <UxaBadge tone="neutral">Historia del proyecto</UxaBadge>
        </div>
      }
      headingLevel={2}
      meta={
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 text-[12px] text-[var(--uxa-color-ink-soft)]">
            <Sparkles className="h-4 w-4 text-[var(--brand-primary)]" />
            Resumen ejecutivo del viaje LEAN
          </span>
          <a className="uxa-button uxa-button--primary uxa-button--sm" href="#journey">
            <Play className="h-4 w-4" />
            <span>Recorrer la historia</span>
          </a>
          <a className="uxa-button uxa-button--secondary uxa-button--sm" href={narrative.nextHref}>
            <FileText className="h-4 w-4" />
            <span>{narrative.nextLabel}</span>
          </a>
        </div>
      }
      title={narrative.title}
      actions={
        <div className="w-full min-w-[230px] rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-[var(--uxa-color-muted-panel)] p-4">
          <div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--uxa-color-ink-muted)]">Estado del producto</p>
              <CircleDot className="h-5 w-5 text-[var(--brand-primary)]" />
            </div>
            <p className="mt-3 text-[20px] font-black leading-tight text-[var(--uxa-color-ink)]">{readiness.label}</p>
            <p className="mt-3 text-[13px] leading-5 text-[var(--uxa-color-ink-soft)]">{readiness.detail}</p>
            <div className="mt-5" aria-label="Cinco fases LEAN de la historia del proyecto">
              <div className="grid grid-cols-5 gap-1.5">
                {narrative.story.map((moment) => (
                  <span className="h-2 rounded-full bg-[var(--uxa-color-brand)]" key={moment.label} title={moment.label} />
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--uxa-color-ink-muted)]">
                <span>Historia LEAN</span>
                <span>{narrative.story.length} momentos</span>
              </div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-[var(--uxa-color-border-soft)] pt-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)]">Fases recorridas</p>
              <p className="mt-1 text-[20px] font-black text-[var(--uxa-color-ink)]">5</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)]">Producto</p>
              <p className="mt-1 text-[20px] font-black text-[var(--uxa-color-ink)]">{narrative.product === "acp" ? "ACP" : narrative.product === "blueprint_pro" ? "Pro" : "Basic"}</p>
            </div>
          </div>
        </div>
      }
    />
  );
}

function StoryRail({
  activeIndex,
  narrative,
  onSelect,
}: {
  activeIndex: number;
  narrative: ProductNarrative;
  onSelect: (index: number) => void;
}) {
  return (
    <UxaSurface className="p-4 lg:p-5" id="journey">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--uxa-color-brand)]">El viaje LEAN</p>
          <h2 className="mt-2 text-[21px] font-black text-[var(--uxa-color-ink)]">Cada fase deja una pieza de valor</h2>
        </div>
        <span className="hidden text-[11px] font-semibold text-[var(--uxa-color-ink-muted)] sm:block">Selecciona un hito para ver su evidencia</span>
      </div>
      <div className="mt-6 grid gap-2 md:grid-cols-5">
        {narrative.story.map((moment, index) => {
          const Icon = moment.icon;
          const active = index === activeIndex;
          return (
            <button
              aria-current={active ? "step" : undefined}
              className={cn(
                "group relative rounded-[var(--uxa-radius-md)] border p-3 text-left transition",
                active
                  ? "border-[var(--uxa-color-brand)] bg-[var(--uxa-color-brand-soft)] shadow-[var(--uxa-shadow-card)]"
                  : "border-[var(--uxa-color-border)] bg-[var(--uxa-color-panel)] hover:border-[var(--uxa-color-brand)]",
              )}
              key={moment.label}
              onClick={() => onSelect(index)}
              type="button"
            >
              <div className="flex items-center justify-between gap-2">
                <span className={cn("flex h-8 w-8 items-center justify-center rounded-full", active ? "bg-[var(--uxa-color-brand)] text-white" : "bg-[var(--uxa-color-muted-panel)] text-[var(--uxa-color-ink-soft)]")}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-[10px] font-black text-[var(--uxa-color-ink-muted)]">0{index + 1}</span>
              </div>
              <p className="mt-3 text-[12px] font-black text-[var(--uxa-color-ink)]">{moment.label}</p>
              <p className="mt-1 text-[10px] font-semibold text-[var(--uxa-color-ink-muted)]">{stageCompletion(narrative.product, index)}</p>
              {index < narrative.story.length - 1 ? <ChevronRight className="absolute -right-3 top-8 z-10 hidden h-5 w-5 text-[var(--uxa-color-border)] md:block" /> : null}
            </button>
          );
        })}
      </div>
    </UxaSurface>
  );
}

function StoryDetail({ moment, narrative }: { moment: StoryMoment; narrative: ProductNarrative }) {
  const Icon = moment.icon;

  return (
    <UxaSurface className="overflow-hidden p-0">
      <div className="border-b border-[var(--uxa-color-border)] bg-[var(--uxa-color-muted-panel)] px-5 py-4 lg:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-[var(--uxa-radius-md)] bg-[var(--uxa-color-brand)] text-white">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--uxa-color-ink-muted)]">{moment.eyebrow}</p>
              <h2 className="mt-1 text-[20px] font-black text-[var(--uxa-color-ink)]">{moment.title}</h2>
            </div>
          </div>
          <UxaBadge tone={moment.tone}>{stageCompletion(narrative.product, narrative.story.indexOf(moment))}</UxaBadge>
        </div>
      </div>
      <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.68fr)] lg:p-6">
        <div>
          <p className="max-w-2xl text-[15px] leading-7 text-[var(--uxa-color-ink-soft)]">{moment.body}</p>
          <div className="mt-6 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[var(--uxa-color-ink-muted)]">
            <GitBranch className="h-4 w-4 text-[var(--uxa-color-brand)]" />
            <span>Decisiones de esta fase alimentan la siguiente sin duplicar contexto.</span>
          </div>
        </div>
        <div className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-[var(--uxa-color-panel)] p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[var(--uxa-state-success)]" />
            <p className="text-[12px] font-black text-[var(--uxa-color-ink)]">Evidencia disponible</p>
          </div>
          <div className="mt-4 space-y-3">
            {moment.evidence.map((item) => (
              <div className="flex items-start gap-2" key={item}>
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--uxa-state-success)]" />
                <p className="text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </UxaSurface>
  );
}

function OutcomePanel({ narrative }: { narrative: ProductNarrative }) {
  const isAcp = narrative.product === "acp";
  const isPro = narrative.product === "blueprint_pro";
  const items = isAcp
    ? [
        { detail: "Arquitectura, flujos y decisiones aprobadas", icon: Layers3, label: "Especificacion portable" },
        { detail: "Preguntas de implementacion con momento de cierre", icon: CircleDot, label: "Gaps gestionados" },
        { detail: "Pruebas, prompts, herramientas y memoria", icon: PackageCheck, label: "Paquete de construccion" },
      ]
    : isPro
      ? [
          { detail: "Documento profesional con trazabilidad", icon: FileText, label: "Blueprint exportable" },
          { detail: "Diagramas especializados y versionados", icon: GitBranch, label: "Diseño documentado" },
          { detail: "Decisiones y preguntas relevantes enriquecidas", icon: Sparkles, label: "Profundidad adicional" },
        ]
      : [
          { detail: "Comprension del problema y oportunidad", icon: Target, label: "Necesidad entendida" },
          { detail: "Arquitectura, patrones y memoria visibles", icon: Workflow, label: "Diseño integral" },
          { detail: "Valor comercial y siguiente decision", icon: Sparkles, label: "Decision informada" },
        ];

  return (
    <UxaSurface className="p-5 lg:p-6" id="deliverables">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--uxa-color-brand)]">Resultado alcanzado</p>
          <h2 className="mt-2 text-[21px] font-black text-[var(--uxa-color-ink)]">La historia termina en un entregable util</h2>
        </div>
        <UxaBadge tone={isAcp ? "success" : "info"}>{isAcp ? "Listo para construccion" : isPro ? "Listo para presentar" : "Listo para explorar"}</UxaBadge>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div className="rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-border)] bg-[var(--uxa-color-muted-panel)] p-4" key={item.label}>
              <Icon className="h-5 w-5 text-[var(--uxa-color-brand)]" />
              <p className="mt-4 text-[13px] font-black text-[var(--uxa-color-ink)]">{item.label}</p>
              <p className="mt-1 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">{item.detail}</p>
            </div>
          );
        })}
      </div>
    </UxaSurface>
  );
}

function NextStep({ narrative }: { narrative: ProductNarrative }) {
  const nextProduct = narrative.product === "blueprint" ? "blueprint-pro" : narrative.product === "blueprint_pro" ? "acp" : null;
  const nextTitle = narrative.product === "blueprint" ? "Siguiente paso: profundizar con Blueprint Pro" : narrative.product === "blueprint_pro" ? "Siguiente paso: llevar el diseño a construcción" : "Siguiente paso: resolver decisiones propias del entorno";
  const nextBody = narrative.product === "blueprint" ? "Desbloquea la documentación profesional cuando necesites presentar, compartir o decidir con el diseño completo." : narrative.product === "blueprint_pro" ? "Activa ACP para transformar las decisiones aprobadas en un paquete portable de construcción." : "El ACP deja explícitos los puntos que solo pueden cerrarse con información del cliente durante la implementación.";

  return (
    <UxaSurface className="border-[var(--uxa-color-brand)] bg-[var(--uxa-color-brand-soft)] p-5 lg:p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-[var(--uxa-color-brand)]" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--uxa-color-brand)]">Continuidad del viaje</p>
          </div>
          <h2 className="mt-2 text-[20px] font-black text-[var(--uxa-color-ink)]">{nextTitle}</h2>
          <p className="mt-2 text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">{nextBody}</p>
        </div>
        {nextProduct ? (
          <a className="uxa-button uxa-button--primary shrink-0" href={`/mockups/executive-overview/${nextProduct}`}>
            <span>{narrative.product === "blueprint" ? "Ver Blueprint Pro" : "Ver ACP"}</span>
            <ArrowRight className="h-4 w-4" />
          </a>
        ) : (
          <a className="uxa-button uxa-button--secondary shrink-0" href="/mockups/artifact-center">
            <span>Ver paquete de referencia</span>
            <ArrowRight className="h-4 w-4" />
          </a>
        )}
      </div>
    </UxaSurface>
  );
}

export function ExecutiveOverviewMockup({ product }: { product: ExecutiveOverviewProduct }) {
  const narrative = NARRATIVES[product];
  const [activeIndex, setActiveIndex] = useState(0);
  const activeMoment = useMemo(() => narrative.story[activeIndex] ?? narrative.story[0], [activeIndex, narrative.story]);

  return (
    <main className="uxa-foundation-root min-h-screen w-full bg-[var(--surface-canvas)] text-[var(--text-primary)]">
      <OverviewHeader narrative={narrative} />
      <div className="mx-auto w-full max-w-[var(--uxa-layout-content-max)] space-y-4 px-4 pb-8 pt-4 lg:px-5">
        <Hero narrative={narrative} />
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-4">
            <StoryRail activeIndex={activeIndex} narrative={narrative} onSelect={setActiveIndex} />
            <StoryDetail moment={activeMoment} narrative={narrative} />
            <ExecutiveProductKeyDeliverables
              productKey={
                product === "blueprint"
                  ? "blueprint_basic"
                  : product === "blueprint_pro"
                    ? "blueprint_pro"
                    : "acp"
              }
            />
          </div>
          <aside className="space-y-4">
            <DeliverableGenerationLiveTracker
              productKey={
                product === "blueprint"
                  ? "blueprint_basic"
                  : product === "blueprint_pro"
                    ? "blueprint_pro"
                    : "acp"
              }
              productLabel={narrative.badge}
            />
            <UxaSurface className="p-5">
              <div className="flex items-center gap-2">
                <Layers3 className="h-4 w-4 text-[var(--uxa-color-brand)]" />
                <p className="text-[12px] font-black text-[var(--uxa-color-ink)]">Lectura ejecutiva</p>
              </div>
              <p className="mt-3 text-[12px] leading-6 text-[var(--uxa-color-ink-soft)]">
                La portada resume el porqué, el cómo y el resultado. El detalle técnico permanece disponible en sus visores especializados.
              </p>
              <div className="mt-4 space-y-2 border-t border-[var(--uxa-color-border-soft)] pt-4">
                {["Necesidad", "Decisiones", "Evidencia", "Resultado"].map((item) => (
                  <div className="flex items-center gap-2" key={item}>
                    <CheckCircle2 className="h-4 w-4 text-[var(--uxa-state-success)]" />
                    <span className="text-[11px] font-semibold text-[var(--uxa-color-ink-soft)]">{item}</span>
                  </div>
                ))}
              </div>
            </UxaSurface>
            <UxaSurface className="p-5">
              <div className="flex items-center gap-2">
                <LockKeyhole className="h-4 w-4 text-[var(--uxa-color-ink-muted)]" />
                <p className="text-[12px] font-black text-[var(--uxa-color-ink)]">Regla de acceso</p>
              </div>
              <p className="mt-3 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">{narrative.unlock}</p>
            </UxaSurface>
          </aside>
        </section>
        <OutcomePanel narrative={narrative} />
        <NextStep narrative={narrative} />
        <footer className="flex flex-wrap items-center justify-between gap-3 px-1 pb-3 text-[11px] text-[var(--uxa-color-ink-muted)]">
          <span>Mockup navegable · datos de referencia alineados al modelo actual</span>
          <a className="font-bold text-[var(--uxa-color-brand)] hover:underline" href="/mockups/artifact-center">Abrir visor de artefactos</a>
        </footer>
      </div>
    </main>
  );
}
