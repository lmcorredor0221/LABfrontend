import type { MetadataRoute } from "next";
import { buildAbsoluteUrl, buildLocalizedLandingPath, LANDING_LANGUAGES, SITE_URL } from "@/core/seo/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...LANDING_LANGUAGES.map((language) => ({
      url: buildAbsoluteUrl(buildLocalizedLandingPath(language)),
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
  ];
}
