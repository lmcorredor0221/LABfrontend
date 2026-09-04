import type { Metadata } from "next";
import { buildProductMetadata, buildLocalizedProductPath } from "@/core/seo/site";
import { AcpDocument } from "@/features/landing/pages/product-page-documents";

export const metadata: Metadata = buildProductMetadata("en", "acp", buildLocalizedProductPath("en", "acp"));

export default function Page() {
  return <AcpDocument language="en" forceLanguage />;
}
