import type { Metadata } from "next";
import type { SupportedLanguage } from "@/core/i18n/language-config";
import { buildAbsoluteUrl, LANDING_LANGUAGES, SITE_NAME } from "@/core/seo/site";
import { INSIGHTS_ARTICLES, type InsightArticle } from "./insights-data";

const OG_LOCALE: Record<SupportedLanguage, string> = {
  es: "es_ES",
  en: "en_US",
  pt: "pt_BR",
};

const FALLBACK_ARTICLE_COPY: Record<SupportedLanguage, { title: string; description: string; home: string; insights: string }> = {
  es: {
    title: "Artículo | LAB",
    description: "Artículo técnico sobre sistemas agénticos de IA.",
    home: "Inicio",
    insights: "Artículos",
  },
  en: {
    title: "Article | LAB",
    description: "Technical article on agentic AI systems.",
    home: "Home",
    insights: "Insights",
  },
  pt: {
    title: "Artigo | LAB",
    description: "Artigo técnico sobre sistemas agênticos de IA.",
    home: "Início",
    insights: "Artigos",
  },
};

function localizedValue(values: Record<"es" | "en" | "pt", string> | undefined, language: SupportedLanguage, fallback = "") {
  return values?.[language] || values?.es || fallback;
}

export function findInsightArticle(slug: string): InsightArticle | undefined {
  return INSIGHTS_ARTICLES.find((article) => article.slug === slug);
}

export function buildInsightArticlePath(language: SupportedLanguage | "default", slug: string) {
  return language === "default" ? `/insights/${slug}` : `/${language}/insights/${slug}`;
}

export function buildInsightArticleAlternates(slug: string) {
  return {
    es: buildAbsoluteUrl(buildInsightArticlePath("es", slug)),
    en: buildAbsoluteUrl(buildInsightArticlePath("en", slug)),
    pt: buildAbsoluteUrl(buildInsightArticlePath("pt", slug)),
    "x-default": buildAbsoluteUrl(buildInsightArticlePath("default", slug)),
  };
}

export function buildInsightArticleMetadata({
  article,
  language,
  pathname,
  slug,
}: {
  article: InsightArticle | undefined;
  language: SupportedLanguage;
  pathname: string;
  slug: string;
}): Metadata {
  const fallback = FALLBACK_ARTICLE_COPY[language] ?? FALLBACK_ARTICLE_COPY.es;
  const title = localizedValue(article?.seoTitle, language, article ? `${localizedValue(article.title, language)} | LAB` : fallback.title);
  const description = localizedValue(article?.seoDescription, language, article ? localizedValue(article.summary, language) : fallback.description);
  const canonical = buildAbsoluteUrl(pathname);
  const ogImage = buildAbsoluteUrl(article?.ogImage || "/insights/lab-insights-og.svg");

  return {
    title,
    description,
    keywords: article?.keywords,
    alternates: {
      canonical,
      languages: buildInsightArticleAlternates(slug),
    },
    openGraph: {
      title,
      description,
      type: "article",
      siteName: SITE_NAME,
      url: canonical,
      locale: OG_LOCALE[language],
      publishedTime: article?.date,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: localizedValue(article?.heroImageAlt, language, localizedValue(article?.title, language, "Lean Agent Builder insights")),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export function buildInsightArticleJsonLd({
  article,
  language,
  pathname,
}: {
  article: InsightArticle | undefined;
  language: SupportedLanguage;
  pathname: string;
}) {
  if (!article) return null;

  const canonical = buildAbsoluteUrl(pathname);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: localizedValue(article.title, language),
    description: localizedValue(article.seoDescription, language, localizedValue(article.summary, language)),
    datePublished: article.date,
    dateModified: article.date,
    inLanguage: language,
    author: {
      "@type": "Organization",
      name: SITE_NAME,
      url: buildAbsoluteUrl("/"),
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: buildAbsoluteUrl("/"),
    },
    mainEntityOfPage: canonical,
    image: buildAbsoluteUrl(article.ogImage || "/insights/lab-insights-og.svg"),
    keywords: article.keywords?.join(", "),
  };
}

export function buildInsightBreadcrumbJsonLd({
  article,
  language,
  pathname,
}: {
  article: InsightArticle | undefined;
  language: SupportedLanguage;
  pathname: string;
}) {
  const fallback = FALLBACK_ARTICLE_COPY[language] ?? FALLBACK_ARTICLE_COPY.es;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: fallback.home,
        item: buildAbsoluteUrl(`/${language}`),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: fallback.insights,
        item: buildAbsoluteUrl(`/${language}/insights`),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: localizedValue(article?.title, language, fallback.title),
        item: buildAbsoluteUrl(pathname),
      },
    ],
  };
}

export function InsightArticleStructuredData({
  article,
  language,
  pathname,
}: {
  article: InsightArticle | undefined;
  language: SupportedLanguage;
  pathname: string;
}) {
  const articleJsonLd = buildInsightArticleJsonLd({ article, language, pathname });
  const breadcrumbJsonLd = buildInsightBreadcrumbJsonLd({ article, language, pathname });

  return (
    <>
      {articleJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />
      ) : null}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </>
  );
}

export function buildInsightStaticParams() {
  return INSIGHTS_ARTICLES.map((article) => ({
    slug: article.slug,
  }));
}

export function buildInsightSitemapAlternates(slug: string) {
  return LANDING_LANGUAGES.reduce<Record<string, string>>((acc, language) => {
    acc[language] = buildAbsoluteUrl(buildInsightArticlePath(language, slug));
    return acc;
  }, { "x-default": buildAbsoluteUrl(buildInsightArticlePath("default", slug)) });
}
