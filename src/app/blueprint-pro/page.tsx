import type { Metadata } from "next";
import { buildProductMetadata } from "@/core/seo/site";
import { BlueprintProDocument } from "@/features/landing/pages/product-page-documents";

export const metadata: Metadata = buildProductMetadata("es", "blueprint-pro", "/blueprint-pro");

export default function Page() {
  return <BlueprintProDocument language="es" forceLanguage />;
}
