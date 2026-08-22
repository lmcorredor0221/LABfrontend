import type { Metadata } from "next";
import type { SupportedLanguage } from "@/core/i18n/language-config";

export const SITE_URL = "https://www.leanagentbuilder.com";
export const SITE_NAME = "Lean Agent Builder";
export const SITE_SHORT_NAME = "LAB.ai";

interface LandingSeoCopy {
  title: string;
  description: string;
  organizationDescription: string;
}

const LANDING_SEO_COPY: Record<SupportedLanguage, LandingSeoCopy> = {
  es: {
    title: "Agentes de IA y automatizacion para empresas",
    description:
      "Disena, evalua y documenta agentes de IA antes de programar. Valida procesos, define integraciones y entrega blueprints listos para tu equipo tecnico.",
    organizationDescription:
      "Plataforma para disenar, evaluar y documentar agentes de IA y automatizaciones empresariales antes de construirlas.",
  },
  en: {
    title: "AI agents and automation for business teams",
    description:
      "Design, evaluate, and document AI agents before coding. Validate workflows, define integrations, and deliver build-ready blueprints.",
    organizationDescription:
      "Platform for designing, evaluating, and documenting AI agents and business automations before implementation.",
  },
  pt: {
    title: "Agentes de IA e automacao para empresas",
    description:
      "Desenhe, avalie e documente agentes de IA antes de programar. Valide fluxos, defina integracoes e entregue blueprints prontos para construcao.",
    organizationDescription:
      "Plataforma para desenhar, avaliar e documentar agentes de IA e automacoes empresariais antes da implementacao.",
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

export function buildLandingMetadata(language: SupportedLanguage): Metadata {
  const copy = getLandingSeoCopy(language);
  const canonicalUrl = buildAbsoluteUrl("/");

  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical: canonicalUrl,
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
      },
    ],
  };
}
