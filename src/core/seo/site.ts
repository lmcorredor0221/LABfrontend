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

function buildLandingLanguageAlternates(): Record<string, string> {
  return {
    es: buildAbsoluteUrl(buildLocalizedLandingPath("es")),
    en: buildAbsoluteUrl(buildLocalizedLandingPath("en")),
    pt: buildAbsoluteUrl(buildLocalizedLandingPath("pt")),
    "x-default": buildAbsoluteUrl("/"),
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
          target: `${SITE_URL}/#simulador`,
          "query-input": "required name=initiative",
        },
      },
    ],
  };
}
