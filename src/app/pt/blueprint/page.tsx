import type { Metadata } from "next";
import { buildProductMetadata, buildLocalizedProductPath } from "@/core/seo/site";
import { BlueprintDocument } from "@/features/landing/pages/product-page-documents";

export const metadata: Metadata = buildProductMetadata("pt", "blueprint", buildLocalizedProductPath("pt", "blueprint"));

export default function Page() {
  return <BlueprintDocument language="pt" forceLanguage />;
}
