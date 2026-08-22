import type { Metadata } from "next";
import { buildLandingMetadata, buildLocalizedLandingPath } from "@/core/seo/site";
import { LandingPageDocument } from "@/features/landing/landing-page-document";

export const metadata: Metadata = buildLandingMetadata("pt", buildLocalizedLandingPath("pt"));

export default function Page() {
  return <LandingPageDocument language="pt" forceLanguage />;
}
