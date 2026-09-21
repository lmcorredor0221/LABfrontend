import type { Metadata } from "next";
import { InsightArticleDocument } from "@/features/landing/pages/product-page-documents";
import {
  buildInsightArticleMetadata,
  buildInsightArticlePath,
  buildInsightStaticParams,
  findInsightArticle,
  InsightArticleStructuredData,
} from "@/features/landing/pages/insight-article-seo";

export async function generateStaticParams() {
  return buildInsightStaticParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = findInsightArticle(slug);
  return buildInsightArticleMetadata({
    article,
    language: "es",
    pathname: buildInsightArticlePath("default", slug),
    slug,
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = findInsightArticle(slug);
  const pathname = buildInsightArticlePath("default", slug);

  return (
    <>
      <InsightArticleStructuredData article={article} language="es" pathname={pathname} />
      <InsightArticleDocument language="es" forceLanguage slug={slug} />
    </>
  );
}
