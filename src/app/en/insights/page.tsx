import type { Metadata } from "next";
import { buildProductMetadata, buildLocalizedProductPath } from "@/core/seo/site";
import { InsightsDocument } from "@/features/landing/pages/product-page-documents";

export const metadata: Metadata = buildProductMetadata("en", "insights", buildLocalizedProductPath("en", "insights"));

export default function Page() {
  return <InsightsDocument language="en" forceLanguage />;
}
