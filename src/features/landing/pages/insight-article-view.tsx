"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, Copy, FileCode, FileText, Share2, Sparkles } from "lucide-react";
import { useLanguage } from "@/core/i18n/language-context";
import { byLanguage } from "@/features/product-experience/core/localized-copy";
import { LandingHeader } from "../components/landing-header";
import { LandingFooter } from "../components/landing-footer";
import { INSIGHTS_ARTICLES, type InsightArticle } from "./insights-data";

interface InsightArticleViewProps {
  slug: string;
}

export function InsightArticleView({ slug }: InsightArticleViewProps) {
  const { language } = useLanguage();
  const [isDark, setIsDark] = useState(true);
  const [copied, setCopied] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  useEffect(() => {
    function handleScroll() {
      const totalHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const currentIndex = INSIGHTS_ARTICLES.findIndex((a) => a.slug === slug);
  const article = INSIGHTS_ARTICLES[currentIndex >= 0 ? currentIndex : 0];
  const prevArticle = currentIndex > 0 ? INSIGHTS_ARTICLES[currentIndex - 1] : null;
  const nextArticle = currentIndex < INSIGHTS_ARTICLES.length - 1 ? INSIGHTS_ARTICLES[currentIndex + 1] : null;

  const title = article.title[language as "es" | "en" | "pt"] || article.title.es;
  const summary = article.summary[language as "es" | "en" | "pt"] || article.summary.es;
  const categoryLabel = article.categoryLabel[language as "es" | "en" | "pt"] || article.categoryLabel.es;
  const takeaways = article.keyTakeaways[language as "es" | "en" | "pt"] || article.keyTakeaways.es;

  function handleCopyLink() {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* READING PROGRESS BAR */}
      <div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 z-50 transition-all duration-150"
        style={{ width: `${scrollProgress}%` }}
      />

      <LandingHeader isDark={isDark} setIsDark={setIsDark} />

      <main className="py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-8">
            <Link href={`/${language}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
              {byLanguage(language, { es: "Inicio", en: "Home", pt: "Início" })}
            </Link>
            <span>/</span>
            <Link href={`/${language}/insights`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
              {byLanguage(language, { es: "Artículos & Insights", en: "Insights", pt: "Artigos" })}
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-white truncate max-w-xs">{title}</span>
          </nav>

          {/* Action Header: Back + Copy Link */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <Link
              href={`/${language}/insights`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{byLanguage(language, { es: "Volver a todos los artículos", en: "Back to all articles", pt: "Voltar a todos os artigos" })}</span>
            </Link>

            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-indigo-500 transition shadow-2xs"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "¡Enlace copiado!" : "Copiar Enlace"}</span>
            </button>
          </div>

          {/* Article Header */}
          <header className="mb-10">
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-4">
              <span className="px-2.5 py-1 rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold text-[11px]">
                {categoryLabel}
              </span>
              <span>•</span>
              <span>{article.readTime}</span>
              <span>•</span>
              <span className="font-mono text-[11px]">{article.date}</span>
              {article.sourceDoc ? (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-400">
                    <FileCode className="h-3 w-3 text-indigo-400" />
                    Docs/{article.sourceDoc}
                  </span>
                </>
              ) : null}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white leading-[1.2] mb-6">
              {title}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              {summary}
            </p>
          </header>

          {/* Key Takeaways Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 mb-10 shadow-2xs">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-xs uppercase tracking-wider mb-4">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>{byLanguage(language, { es: "Puntos Clave / Key Takeaways", en: "Key Takeaways", pt: "Pontos-Chave" })}</span>
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
              {takeaways.map((t, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Table of Contents (ToC) */}
          {article.sections && article.sections.length > 0 ? (
            <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 mb-10 text-xs">
              <div className="font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                {byLanguage(language, { es: "Índice del Artículo", en: "Table of Contents", pt: "Índice do Artigo" })}
              </div>
              <ul className="space-y-1.5 text-indigo-600 dark:text-indigo-400 font-semibold">
                {article.sections.map((sec, sIdx) => {
                  const secTitle = sec.heading[language as "es" | "en" | "pt"] || sec.heading.es;
                  return (
                    <li key={sIdx}>
                      <a href={`#sec-${sIdx}`} className="hover:underline flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-mono">0{sIdx + 1}.</span>
                        <span>{secTitle}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          {/* Article Body Sections */}
          <div className="space-y-10 text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed border-b border-slate-200 dark:border-slate-800 pb-12">
            {article.sections?.map((sec, sIdx) => (
              <section key={sIdx} id={`sec-${sIdx}`} className="space-y-3 scroll-mt-24">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                  {sec.heading[language as "es" | "en" | "pt"] || sec.heading.es}
                </h2>
                <div className="text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed text-sm">
                  {sec.content[language as "es" | "en" | "pt"] || sec.content.es}
                </div>
              </section>
            )) || (
              <p className="text-slate-600 dark:text-slate-300">
                {summary}
              </p>
            )}
          </div>

          {/* Previous / Next Article Nav */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-8 border-b border-slate-200 dark:border-slate-800">
            {prevArticle ? (
              <Link
                href={`/${language}/insights/${prevArticle.slug}`}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition group flex flex-col justify-between"
              >
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">← Artículo Anterior</div>
                <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition line-clamp-2">
                  {prevArticle.title[language as "es" | "en" | "pt"] || prevArticle.title.es}
                </div>
              </Link>
            ) : <div />}

            {nextArticle ? (
              <Link
                href={`/${language}/insights/${nextArticle.slug}`}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition group flex flex-col justify-between text-right"
              >
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Artículo Siguiente →</div>
                <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition line-clamp-2">
                  {nextArticle.title[language as "es" | "en" | "pt"] || nextArticle.title.es}
                </div>
              </Link>
            ) : <div />}
          </div>

          {/* PLG Conversion Callout */}
          <div className="my-12 p-8 rounded-3xl bg-gradient-to-r from-indigo-900/50 to-slate-900 border border-indigo-500/30 text-center text-white">
            <Sparkles className="h-6 w-6 text-amber-400 mx-auto mb-3" />
            <h3 className="text-2xl font-extrabold mb-2">
              {byLanguage(language, {
                es: "¿Quieres aplicar esta arquitectura a tu caso de uso?",
                en: "Want to apply this architecture to your use case?",
                pt: "Quer aplicar esta arquitetura ao seu caso de uso?",
              })}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto mb-6">
              {byLanguage(language, {
                es: "Valida tu iniciativa con el diagnóstico gratuito de LAB en menos de 1 minuto y genera tu Blueprint.",
                en: "Validate your initiative with LAB's free diagnosis in under 1 minute and generate your Blueprint.",
                pt: "Valide sua iniciativa com o diagnóstico gratuito do LAB em menos de 1 minuto e gere seu Blueprint.",
              })}
            </p>
            <Link
              href={`/${language}#validar-idea`}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-slate-900 text-xs font-extrabold shadow-lg hover:bg-slate-100 transition"
            >
              <span>{byLanguage(language, { es: "Validar mi idea gratis ahora →", en: "Validate my idea for free now →", pt: "Validar minha ideia grátis agora →" })}</span>
            </Link>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
