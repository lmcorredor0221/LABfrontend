import type { Metadata } from "next";
import { buildProductMetadata } from "@/core/seo/site";
import { BlueprintDocument } from "@/features/landing/pages/product-page-documents";

export const metadata: Metadata = buildProductMetadata("es", "blueprint", "/blueprint");

export default function Page() {
  return <BlueprintDocument language="es" forceLanguage />;
}
