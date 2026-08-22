import type { Metadata } from "next";
import { cookies } from "next/headers";
import { resolveInitialLanguage } from "@/core/i18n/language-config";
import { buildLandingMetadata, buildLandingStructuredData } from "@/core/seo/site";
import { LabLandingPage } from "@/features/landing/lab-landing-page";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const language = resolveInitialLanguage(
    cookieStore.get("antigravity_language")?.value,
    "es",
  );

  return buildLandingMetadata(language);
}

export default async function Page() {
  const cookieStore = await cookies();
  const language = resolveInitialLanguage(
    cookieStore.get("antigravity_language")?.value,
    "es",
  );
  const structuredData = buildLandingStructuredData(language);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <LabLandingPage />
    </>
  );
}
