"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, FileCode, Filter, Search, Sparkles } from "lucide-react";
import { useLanguage } from "@/core/i18n/language-context";
import { byLanguage } from "@/features/product-experience/core/localized-copy";
import { LandingHeader } from "../components/landing-header";
import { LandingFooter } from "../components/landing-footer";
import { INSIGHTS_ARTICLES, type InsightArticle } from "./insights-data";

export function InsightsHubView() {
  const { language } = useLanguage();
  const [isDark, setIsDark] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const categories = [
    { key: "all", label: byLanguage(language, { es: "Todos los Artículos (12)", en: "All Articles (12)", pt: "Todos os Artigos (12)" }) },
    { key: "architecture", label: byLanguage(language, { es: "Arquitectura", en: "Architecture", pt: "Arquitetura" }) },
    { key: "methodology", label: byLanguage(language, { es: "Metodología ACP", en: "ACP Methodology", pt: "Metodologia ACP" }) },
    { key: "memory", label: byLanguage(language, { es: "Memoria & Contexto", en: "Memory & Context", pt: "Memória & Contexto" }) },
    { key: "evaluation", label: byLanguage(language, { es: "Evaluación & Calidad", en: "Evaluation & Quality", pt: "Avaliação & Qualidade" }) },
    { key: "security", label: byLanguage(language, { es: "Seguridad & Riesgos", en: "Security & Risks", pt: "Segurança & Riscos" }) },
  ];

  const filteredArticles = INSIGHTS_ARTICLES.filter((article) => {
    const matchesCategory = selectedCategory === "all" || article.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesCategory;

    const titleStr = (article.title[language as "es" | "en" | "pt"] || article.title.es).toLowerCase();
    const summaryStr = (article.summary[language as "es" | "en" | "pt"] || article.summary.es).toLowerCase();
    const docStr = (article.sourceDoc || "").toLowerCase();

    return matchesCategory && (titleStr.includes(query) || summaryStr.includes(query) || docStr.includes(query));
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      <LandingHeader isDark={isDark} setIsDark={setIsDark} />

      <main>
        {/* HERO */}
        <section className="relative pt-16 pb-12 md:pt-20 md:pb-16 overflow-hidden text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider mb-6">
              <BookOpen className="h-3.5 w-3.5" />
              {byLanguage(language, { es: "Conocimiento de Ingeniería & Docs", en: "Engineering Knowledge & Docs", pt: "Conhecimento de Engenharia & Docs" })}
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
              {byLanguage(language, {
                es: "Artículos & Insights: Ingeniería Agéntica para Producción",
                en: "Articles & Insights: Production Agentic Engineering",
                pt: "Artigos & Insights: Engenharia Agêntica para Produção",
              })}
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
              {byLanguage(language, {
                es: "Publicaciones técnicas, patrones arquitectónicos y lecciones aprendidas construyendo agentes de IA en empresas reales.",
                en: "Technical publications, architectural patterns, and lessons learned building AI agents in real enterprises.",
                pt: "Publicações técnicas, padrões arquitetônicos e lições aprendidas construindo agentes de IA em empresas reais.",
              })}
            </p>

            {/* REAL-TIME SEARCH INPUT */}
            <div className="max-w-xl mx-auto relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={byLanguage(language, {
                  es: "Buscar artículos (ej. LangGraph, Memoria, Thoughtworks, Amazon...)",
                  en: "Search articles (e.g. LangGraph, Memory, Thoughtworks, Amazon...)",
                  pt: "Buscar artigos (ex. LangGraph, Memória, Thoughtworks, Amazon...)",
                })}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 shadow-sm"
              />
            </div>
          </div>
        </section>

        {/* ARTICLES & FILTERS */}
        <section className="py-12 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Category Filter Pills */}
            <div className="flex items-center justify-between gap-4 overflow-x-auto pb-4 mb-8 scrollbar-none">
              <div className="flex items-center gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                      selectedCategory === cat.key
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="text-xs text-slate-500 font-mono shrink-0">
                {filteredArticles.length} {byLanguage(language, { es: "artículos encontrados", en: "articles found", pt: "artigos encontrados" })}
              </div>
            </div>

            {/* Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredArticles.map((article) => (
                <article
                  key={article.id}
                  id={article.slug}
                  className="rounded-3xl p-6 sm:p-8 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500/50 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
                      <span className="px-2.5 py-1 rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-semibold text-[11px]">
                        {article.categoryLabel[language as "es" | "en" | "pt"] || article.categoryLabel.es}
                      </span>
                      <div className="flex items-center gap-2">
                        <span>{article.readTime}</span>
                        {article.sourceDoc ? (
                          <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[10px] text-slate-400">
                            <FileCode className="h-3 w-3" />
                            Docs/
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <Link href={`/${language}/insights/${article.slug}`}>
                      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-3 hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                        {article.title[language as "es" | "en" | "pt"] || article.title.es}
                      </h2>
                    </Link>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                      {article.summary[language as "es" | "en" | "pt"] || article.summary.es}
                    </p>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 mb-6">
                      <div className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                        {byLanguage(language, { es: "Puntos Clave / Key Takeaways:", en: "Key Takeaways:", pt: "Pontos-Chave:" })}
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                        {(article.keyTakeaways[language as "es" | "en" | "pt"] || article.keyTakeaways.es).map((k, kIdx) => (
                          <li key={kIdx} className="flex items-start gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{k}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono">{article.date}</span>
                    <Link
                      href={`/${language}/insights/${article.slug}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition"
                    >
                      <span>{byLanguage(language, { es: "Leer artículo completo", en: "Read full article", pt: "Ler artigo completo" })}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {/* BOTTOM CONVERSION BANNER */}
            <div className="mt-16 p-8 rounded-3xl bg-gradient-to-r from-indigo-900/60 to-slate-900 border border-indigo-500/40 text-center text-white">
              <Sparkles className="h-6 w-6 text-amber-400 mx-auto mb-3" />
              <h3 className="text-2xl font-extrabold mb-2">
                {byLanguage(language, {
                  es: "¿Tienes un caso de uso en mente?",
                  en: "Have a use case in mind?",
                  pt: "Tem um caso de uso em mente?",
                })}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto mb-6">
                {byLanguage(language, {
                  es: "No empieces construyendo a ciegas. Valida su viabilidad en menos de 1 minuto con nuestro diagnóstico gratuito.",
                  en: "Don't start coding blindly. Validate its feasibility in less than 1 minute with our free diagnosis.",
                  pt: "Não comece a programar às cegas. Valide a viabilidade em menos de 1 minuto com nosso diagnóstico gratuito.",
                })}
              </p>
              <Link
                href={`/${language}#validar-idea`}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-slate-950 text-xs font-extrabold shadow-lg hover:bg-slate-100 transition"
              >
                <span>{byLanguage(language, { es: "Validar mi idea gratis ahora →", en: "Validate my idea for free now →", pt: "Validar minha ideia grátis agora →" })}</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
