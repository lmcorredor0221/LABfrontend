import type { Metadata } from "next";
import { buildProductMetadata, buildLocalizedProductPath } from "@/core/seo/site";
import { BlueprintProDocument } from "@/features/landing/pages/product-page-documents";

export const metadata: Metadata = buildProductMetadata("pt", "blueprint-pro", buildLocalizedProductPath("pt", "blueprint-pro"));

export default function Page() {
  return <BlueprintProDocument language="pt" forceLanguage />;
}
