import type { Metadata } from "next";
import { buildProductMetadata, buildLocalizedProductPath } from "@/core/seo/site";
import { AcpDocument } from "@/features/landing/pages/product-page-documents";

export const metadata: Metadata = buildProductMetadata("es", "acp", buildLocalizedProductPath("es", "acp"));

export default function Page() {
  return <AcpDocument language="es" forceLanguage />;
}
