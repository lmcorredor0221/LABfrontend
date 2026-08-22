import { type SupportedLanguage } from "@/core/i18n/language-config";
import { LanguageProvider } from "@/core/i18n/language-context";
import { buildLandingStructuredData } from "@/core/seo/site";
import { LabLandingPage } from "@/features/landing/lab-landing-page";

export function LandingPageDocument({
  forceLanguage,
  language,
}: {
  forceLanguage?: boolean;
  language: SupportedLanguage;
}) {
  const content = (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildLandingStructuredData(language)) }}
      />
      <LabLandingPage />
    </>
  );

  if (!forceLanguage) {
    return content;
  }

  return <LanguageProvider initialLanguage={language}>{content}</LanguageProvider>;
}
