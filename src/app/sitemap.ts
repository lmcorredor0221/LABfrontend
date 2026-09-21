import type { MetadataRoute } from "next";
import { buildAbsoluteUrl, LANDING_LANGUAGES } from "@/core/seo/site";
import { INSIGHTS_ARTICLES } from "@/features/landing/pages/insights-data";
import { buildInsightSitemapAlternates } from "@/features/landing/pages/insight-article-seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const productPaths = [
    "",
    "/blueprint",
    "/blueprint-pro",
    "/acp",
    "/insights",
  ];

  const productEntries: MetadataRoute.Sitemap = productPaths.flatMap((path) => {
    const isRoot = path === "";
    const priority = isRoot ? 1.0 : 0.9;

    const baseEntry = {
      url: buildAbsoluteUrl(path || "/"),
      lastModified,
      changeFrequency: "weekly" as const,
      priority,
    };

    const localizedEntries = LANDING_LANGUAGES.map((lang) => ({
      url: buildAbsoluteUrl(`/${lang}${path}`),
      lastModified,
      changeFrequency: "weekly" as const,
      priority: isRoot ? 0.9 : 0.8,
    }));

    return [baseEntry, ...localizedEntries];
  });

  const articleEntries: MetadataRoute.Sitemap = INSIGHTS_ARTICLES.flatMap((article) => {
    const baseEntry = {
      url: buildAbsoluteUrl(`/insights/${article.slug}`),
      lastModified: new Date(article.date),
      changeFrequency: "monthly" as const,
      priority: 0.8,
      alternates: {
        languages: buildInsightSitemapAlternates(article.slug),
      },
    };

    const localizedEntries = LANDING_LANGUAGES.map((lang) => ({
      url: buildAbsoluteUrl(`/${lang}/insights/${article.slug}`),
      lastModified: new Date(article.date),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      alternates: {
        languages: buildInsightSitemapAlternates(article.slug),
      },
    }));

    return [baseEntry, ...localizedEntries];
  });

  return [...productEntries, ...articleEntries];
}
