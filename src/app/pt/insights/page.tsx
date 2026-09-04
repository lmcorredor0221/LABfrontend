import type { Metadata } from "next";
import { buildProductMetadata, buildLocalizedProductPath } from "@/core/seo/site";
import { InsightsDocument } from "@/features/landing/pages/product-page-documents";

export const metadata: Metadata = buildProductMetadata("pt", "insights", buildLocalizedProductPath("pt", "insights"));

export default function Page() {
  return <InsightsDocument language="pt" forceLanguage />;
}
