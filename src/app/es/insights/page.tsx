import type { Metadata } from "next";
import { buildProductMetadata, buildLocalizedProductPath } from "@/core/seo/site";
import { InsightsDocument } from "@/features/landing/pages/product-page-documents";

export const metadata: Metadata = buildProductMetadata("es", "insights", buildLocalizedProductPath("es", "insights"));

export default function Page() {
  return <InsightsDocument language="es" forceLanguage />;
}
