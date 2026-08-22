import type { Metadata } from "next";
import { buildLandingMetadata, buildLocalizedLandingPath } from "@/core/seo/site";
import { LandingPageDocument } from "@/features/landing/landing-page-document";

export const metadata: Metadata = buildLandingMetadata("en", buildLocalizedLandingPath("en"));

export default function Page() {
  return <LandingPageDocument language="en" forceLanguage />;
}
