import type { Metadata } from "next";
import { buildProductMetadata } from "@/core/seo/site";
import { AcpDocument } from "@/features/landing/pages/product-page-documents";

export const metadata: Metadata = buildProductMetadata("es", "acp", "/acp");

export default function Page() {
  return <AcpDocument language="es" forceLanguage />;
}
