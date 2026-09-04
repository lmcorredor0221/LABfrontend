"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { useLanguage } from "@/core/i18n/language-context";
import { byLanguage } from "@/features/product-experience/core/localized-copy";
import { INSIGHTS_ARTICLES } from "../pages/insights-data";

export function InsightsPreview() {
  const { language } = useLanguage();
  const featured = INSIGHTS_ARTICLES.slice(0, 3);

  return (
    <section id="insights-preview" className="py-16 md:py-20 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
              {byLanguage(language, {
                es: "Artículos & Insights Técnicos",
                en: "Technical Insights & Articles",
                pt: "Artigos & Insights Técnicos",
              })}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-3">
              {byLanguage(language, {
                es: "Ingeniería agéntica y mejores prácticas para producción",
                en: "Agentic engineering & production best practices",
                pt: "Engenharia agêntica e melhores práticas de produção",
              })}
            </h2>
          </div>

          <Link
            href={`/${language}/insights`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
          >
            <span>{byLanguage(language, { es: "Ver todos los 12 artículos →", en: "View all 12 articles →", pt: "Ver todos os 12 artigos →" })}</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featured.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:shadow-lg transition-all"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-semibold text-[11px]">
                    {item.categoryLabel[language as "es" | "en" | "pt"] || item.categoryLabel.es}
                  </span>
                  <span>{item.readTime}</span>
                </div>

                <Link href={`/${language}/insights/${item.slug}`}>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2 leading-snug hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                    {item.title[language as "es" | "en" | "pt"] || item.title.es}
                  </h3>
                </Link>

                <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed line-clamp-3">
                  {item.summary[language as "es" | "en" | "pt"] || item.summary.es}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <Link
                  href={`/${language}/insights/${item.slug}`}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <span>{byLanguage(language, { es: "Leer artículo completo", en: "Read full article", pt: "Ler artigo completo" })}</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
