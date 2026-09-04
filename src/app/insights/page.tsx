import type { Metadata } from "next";
import { buildProductMetadata } from "@/core/seo/site";
import { InsightsDocument } from "@/features/landing/pages/product-page-documents";

export const metadata: Metadata = buildProductMetadata("es", "insights", "/insights");

export default function Page() {
  return <InsightsDocument language="es" forceLanguage />;
}
