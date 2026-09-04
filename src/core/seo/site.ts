import type { Metadata } from "next";
import type { SupportedLanguage } from "@/core/i18n/language-config";

export const SITE_URL = "https://www.leanagentbuilder.com";
export const SITE_NAME = "Lean Agent Builder";
export const SITE_SHORT_NAME = "LAB.ai";
export const LANDING_LANGUAGES: readonly SupportedLanguage[] = ["es", "en", "pt"] as const;

interface LandingSeoCopy {
  title: string;
  description: string;
  organizationDescription: string;
}

const LANDING_SEO_COPY: Record<SupportedLanguage, LandingSeoCopy> = {
  es: {
    title: "Agentes de IA para empresas y automatización de procesos",
    description:
      "Diseña agentes de IA para tu empresa antes de programar. Evalúa procesos, define integraciones y entrega blueprints claros para implementar con menos riesgo.",
    organizationDescription:
      "Plataforma para diseñar, evaluar y documentar agentes de IA y automatizaciones empresariales con blueprints claros antes de construirlas.",
  },
  en: {
    title: "AI agents and workflow automation for business teams",
    description:
      "Design AI agents for your business before coding. Evaluate workflows, define integrations, and deliver clear blueprints for implementation.",
    organizationDescription:
      "Platform for designing, evaluating, and documenting AI agents and business automations with clear blueprints before implementation.",
  },
  pt: {
    title: "Agentes de IA para empresas e automação de processos",
    description:
      "Desenhe agentes de IA para sua empresa antes de programar. Avalie fluxos, defina integrações e entregue blueprints claros para construção.",
    organizationDescription:
      "Plataforma para desenhar, avaliar e documentar agentes de IA e automações empresariais com blueprints claros antes da implementação.",
  },
};

export type ProductSeoType = "blueprint" | "blueprint-pro" | "acp" | "insights";

const PRODUCT_SEO_COPY: Record<ProductSeoType, Record<SupportedLanguage, { title: string; description: string }>> = {
  blueprint: {
    es: {
      title: "Blueprint Free - Diagnóstico Inicial y Validación de Agentes IA",
      description: "Valida tu caso de uso con IA gratis antes de programar. Diagnóstico de viabilidad técnica, selección de arquetipos y alcance sin costo.",
    },
    en: {
      title: "Blueprint Free - Initial Diagnosis & AI Agent Validation",
      description: "Validate your AI use case for free before coding. Technical feasibility diagnosis, archetype selection, and scope at zero cost.",
    },
    pt: {
      title: "Blueprint Free - Diagnóstico Inicial e Validação de Agentes IA",
      description: "Valide seu caso de uso com IA grátis antes de programar. Diagnóstico de viabilidade técnica, seleção de arquétipos e escopo sem custo.",
    },
  },
  "blueprint-pro": {
    es: {
      title: "Blueprint Pro - Arquitectura Integral, Diagramas y Gobernanza HITL",
      description: "Diseño profesional de agentes de IA: diagramas de secuencia interactivos, matrices de memoria, políticas de herramientas y controles de supervisión humana.",
    },
    en: {
      title: "Blueprint Pro - Comprehensive Architecture, Diagrams & HITL Governance",
      description: "Professional AI agent architecture: interactive sequence diagrams, memory matrices, tool policies, and human supervision controls.",
    },
    pt: {
      title: "Blueprint Pro - Arquitetura Integral, Diagramas e Governança HITL",
      description: "Design profissional de agentes de IA: diagramas de sequência interativos, matrizes de memória, políticas de ferramentas e controles de supervisão humana.",
    },
  },
  acp: {
    es: {
      title: "Agent Construction Package (ACP) - Paquete ZIP para Implementación",
      description: "Paquete técnico descargable para Cursor, Claude Code, Copilot o desarrolladores: contratos JSON Schema, prompts versionados y datasets de prueba.",
    },
    en: {
      title: "Agent Construction Package (ACP) - Implementable ZIP Technical Package",
      description: "Downloadable technical package for Cursor, Claude Code, Copilot, or engineers: JSON Schema contracts, versioned prompts, and golden datasets.",
    },
    pt: {
      title: "Agent Construction Package (ACP) - Pacote ZIP para Implementação",
      description: "Pacote técnico para download para Cursor, Claude Code, Copilot ou desenvolvedores: contratos JSON Schema, prompts versionados e datasets de teste.",
    },
  },
  insights: {
    es: {
      title: "Artículos & Insights de Ingeniería Agéntica - LAB",
      description: "Patrones arquitectónicos, benchmarks, estrategias de memoria y lecciones aprendidas construyendo agentes de IA empresariales para producción.",
    },
    en: {
      title: "Agentic Engineering Articles & Insights - LAB",
      description: "Architectural patterns, benchmarks, memory strategies, and production lessons learned building enterprise AI agents.",
    },
    pt: {
      title: "Artigos & Insights de Engenharia Agêntica - LAB",
      description: "Padrões arquitetônicos, benchmarks, estratégias de memória e lições aprendidas construindo agentes de IA empresariais para produção.",
    },
  },
};

const OPEN_GRAPH_LOCALE: Record<SupportedLanguage, string> = {
  es: "es_ES",
  en: "en_US",
  pt: "pt_BR",
};

function getLandingSeoCopy(language: SupportedLanguage): LandingSeoCopy {
  return LANDING_SEO_COPY[language] ?? LANDING_SEO_COPY.es;
}

export function buildAbsoluteUrl(pathname: string): string {
  return new URL(pathname, SITE_URL).toString();
}

export function buildLocalizedLandingPath(language: SupportedLanguage): string {
  return `/${language}`;
}

export function buildLocalizedProductPath(language: SupportedLanguage, product: ProductSeoType): string {
  return `/${language}/${product}`;
}

function buildLandingLanguageAlternates(subPath: string = ""): Record<string, string> {
  const suffix = subPath ? `/${subPath}` : "";
  return {
    es: buildAbsoluteUrl(buildLocalizedLandingPath("es") + suffix),
    en: buildAbsoluteUrl(buildLocalizedLandingPath("en") + suffix),
    pt: buildAbsoluteUrl(buildLocalizedLandingPath("pt") + suffix),
    "x-default": buildAbsoluteUrl(subPath ? `/${subPath}` : "/"),
  };
}

export function buildLandingMetadata(
  language: SupportedLanguage,
  pathname: string = buildLocalizedLandingPath(language),
): Metadata {
  const copy = getLandingSeoCopy(language);
  const canonicalUrl = buildAbsoluteUrl(pathname);

  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical: canonicalUrl,
      languages: buildLandingLanguageAlternates(),
    },
    openGraph: {
      type: "website",
      url: canonicalUrl,
      siteName: SITE_NAME,
      title: `${copy.title} | ${SITE_NAME}`,
      description: copy.description,
      locale: OPEN_GRAPH_LOCALE[language],
    },
    twitter: {
      card: "summary_large_image",
      title: `${copy.title} | ${SITE_NAME}`,
      description: copy.description,
    },
  };
}

export function buildProductMetadata(
  language: SupportedLanguage,
  product: ProductSeoType,
  pathname: string = buildLocalizedProductPath(language, product),
): Metadata {
  const copy = PRODUCT_SEO_COPY[product]?.[language] ?? PRODUCT_SEO_COPY[product]?.es ?? {
    title: SITE_NAME,
    description: SITE_NAME,
  };
  const canonicalUrl = buildAbsoluteUrl(pathname);

  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical: canonicalUrl,
      languages: buildLandingLanguageAlternates(product),
    },
    openGraph: {
      type: "website",
      url: canonicalUrl,
      siteName: SITE_NAME,
      title: `${copy.title} | ${SITE_NAME}`,
      description: copy.description,
      locale: OPEN_GRAPH_LOCALE[language],
    },
    twitter: {
      card: "summary_large_image",
      title: `${copy.title} | ${SITE_NAME}`,
      description: copy.description,
    },
  };
}

export function buildLandingStructuredData(language: SupportedLanguage): Record<string, unknown> {
  const copy = getLandingSeoCopy(language);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: SITE_NAME,
        alternateName: SITE_SHORT_NAME,
        url: SITE_URL,
        logo: buildAbsoluteUrl("/favicon.ico"),
        description: copy.organizationDescription,
        availableLanguage: ["es", "en", "pt"],
      },
      {
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_URL,
        inLanguage: language,
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE_URL}/#validar-idea`,
          "query-input": "required name=initiative",
        },
      },
    ],
  };
}
