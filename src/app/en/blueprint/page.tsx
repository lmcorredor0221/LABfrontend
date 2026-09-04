import type { Metadata } from "next";
import { buildProductMetadata, buildLocalizedProductPath } from "@/core/seo/site";
import { BlueprintDocument } from "@/features/landing/pages/product-page-documents";

export const metadata: Metadata = buildProductMetadata("en", "blueprint", buildLocalizedProductPath("en", "blueprint"));

export default function Page() {
  return <BlueprintDocument language="en" forceLanguage />;
}
