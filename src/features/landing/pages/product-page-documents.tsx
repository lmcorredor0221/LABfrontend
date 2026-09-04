import { type SupportedLanguage } from "@/core/i18n/language-config";
import { LanguageProvider } from "@/core/i18n/language-context";
import { BlueprintLandingView } from "./blueprint-landing-view";
import { BlueprintProView } from "./blueprint-pro-view";
import { AcpLandingView } from "./acp-landing-view";
import { InsightsHubView } from "./insights-hub-view";
import { InsightArticleView } from "./insight-article-view";

interface DocumentProps {
  forceLanguage?: boolean;
  language: SupportedLanguage;
}

export function BlueprintDocument({ forceLanguage, language }: DocumentProps) {
  const content = <BlueprintLandingView />;
  if (!forceLanguage) return content;
  return <LanguageProvider initialLanguage={language}>{content}</LanguageProvider>;
}

export function BlueprintProDocument({ forceLanguage, language }: DocumentProps) {
  const content = <BlueprintProView />;
  if (!forceLanguage) return content;
  return <LanguageProvider initialLanguage={language}>{content}</LanguageProvider>;
}

export function AcpDocument({ forceLanguage, language }: DocumentProps) {
  const content = <AcpLandingView />;
  if (!forceLanguage) return content;
  return <LanguageProvider initialLanguage={language}>{content}</LanguageProvider>;
}

export function InsightsDocument({ forceLanguage, language }: DocumentProps) {
  const content = <InsightsHubView />;
  if (!forceLanguage) return content;
  return <LanguageProvider initialLanguage={language}>{content}</LanguageProvider>;
}

export function InsightArticleDocument({
  forceLanguage,
  language,
  slug,
}: DocumentProps & { slug: string }) {
  const content = <InsightArticleView slug={slug} />;
  if (!forceLanguage) return content;
  return <LanguageProvider initialLanguage={language}>{content}</LanguageProvider>;
}
