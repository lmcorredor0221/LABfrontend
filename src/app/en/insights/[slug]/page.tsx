import type { Metadata } from "next";
import { InsightArticleDocument } from "@/features/landing/pages/product-page-documents";
import { INSIGHTS_ARTICLES } from "@/features/landing/pages/insights-data";

export async function generateStaticParams() {
  return INSIGHTS_ARTICLES.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = INSIGHTS_ARTICLES.find((a) => a.slug === slug);
  const title = article ? `${article.title.en} | LAB` : "Article | LAB";
  const description = article?.summary.en || "Technical article on agentic AI systems.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <InsightArticleDocument language="en" forceLanguage slug={slug} />;
}
