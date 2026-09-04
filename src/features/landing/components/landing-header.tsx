"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, Bot, Menu, Moon, Sparkles, Sun, X } from "lucide-react";
import { useAuth } from "@/core/auth/auth-context";
import { useCurrency } from "@/core/commerce/currency-context";
import { useLanguage } from "@/core/i18n/language-context";
import { LANDING_LANGUAGES } from "@/core/seo/site";
import { byLanguage } from "@/features/product-experience/core/localized-copy";

interface LandingHeaderProps {
  isDark: boolean;
  setIsDark: (val: boolean | ((prev: boolean) => boolean)) => void;
  onOpenDiagnostic?: () => void;
}

export function LandingHeader({ isDark, setIsDark, onOpenDiagnostic }: LandingHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const { language, setLanguage } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function handleLanguageChange(nextLang: string) {
    setLanguage(nextLang as "es" | "en" | "pt");
    const segments = (pathname || "/").split("/").filter(Boolean);
    const supported = ["es", "en", "pt"];
    if (segments.length > 0 && supported.includes(segments[0])) {
      segments[0] = nextLang;
      router.push("/" + segments.join("/"));
    } else {
      router.push(`/${nextLang}`);
    }
  }

  function handleValidateClick(e: React.MouseEvent) {
    setMobileMenuOpen(false);
    if (pathname === "/" || pathname === `/${language}`) {
      e.preventDefault();
      const el = document.getElementById("validar-idea") || document.getElementById("simulador");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
      onOpenDiagnostic?.();
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Logo & Brand */}
        <div className="flex items-center gap-6">
          <Link href={`/${language}`} className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform">
              <Bot className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                LAB
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400">
                  AI
                </span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium -mt-0.5">
                {byLanguage(language, {
                  es: "Diseño de Asistentes IA",
                  en: "AI Assistant Design",
                  pt: "Design de Assistentes IA",
                })}
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <Link
              href={`/${language}/blueprint`}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              {byLanguage(language, { es: "Blueprint Free", en: "Blueprint Free", pt: "Blueprint Free" })}
            </Link>
            <Link
              href={`/${language}/blueprint-pro`}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              {byLanguage(language, { es: "Blueprint Pro", en: "Blueprint Pro", pt: "Blueprint Pro" })}
            </Link>
            <Link
              href={`/${language}/acp`}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              {byLanguage(language, { es: "ACP (Código)", en: "ACP (Code)", pt: "ACP (Código)" })}
            </Link>
            <Link
              href={`/${language}/insights`}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              {byLanguage(language, { es: "Artículos & Insights", en: "Insights & Articles", pt: "Artigos & Insights" })}
            </Link>
          </nav>
        </div>

        {/* Right Controls & CTAs */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Currency Switcher (Desktop) */}
          <div className="hidden sm:flex items-center rounded-lg border border-slate-300 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900 p-0.5 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setCurrency("USD")}
              className={`px-2 py-1 rounded-md transition ${currency === "USD" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
            >
              USD
            </button>
            <button
              type="button"
              onClick={() => setCurrency("COP")}
              className={`px-2 py-1 rounded-md transition ${currency === "COP" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
            >
              COP
            </button>
          </div>

          {/* Language Switcher */}
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900 px-2 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 transition"
            aria-label="Idioma"
          >
            {LANDING_LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang.toUpperCase()}
              </option>
            ))}
          </select>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={() => setIsDark((prev) => !prev)}
            className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition"
            aria-label="Cambiar tema"
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
          </button>

          {/* Primary CTA (Desktop & Tablet) */}
          {user ? (
            <Link
              href="/projects"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition"
            >
              <span>{byLanguage(language, { es: "Mi Workspace", en: "My Workspace", pt: "Meu Workspace" })}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden md:inline-flex rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-indigo-500 transition"
              >
                {byLanguage(language, { es: "Iniciar sesión", en: "Log in", pt: "Entrar" })}
              </Link>
              <a
                href="#validar-idea"
                onClick={handleValidateClick}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02]"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{byLanguage(language, { es: "Validar mi idea gratis", en: "Validate idea free", pt: "Validar ideia grátis" })}</span>
              </a>
            </>
          )}

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="lg:hidden p-2 rounded-lg border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition"
            aria-label="Abrir menú de navegación"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer / Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 pt-3 pb-5 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
              {byLanguage(language, { es: "Productos & Soluciones", en: "Products & Solutions", pt: "Produtos e Soluções" })}
            </span>

            <nav className="flex flex-col gap-1">
              <Link
                href={`/${language}/blueprint`}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition"
              >
                <span>{byLanguage(language, { es: "Blueprint Free ($0)", en: "Blueprint Free ($0)", pt: "Blueprint Free ($0)" })}</span>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">PRD Inicial</span>
              </Link>

              <Link
                href={`/${language}/blueprint-pro`}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition"
              >
                <span>{byLanguage(language, { es: "Blueprint Pro", en: "Blueprint Pro", pt: "Blueprint Pro" })}</span>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">C4 Spec</span>
              </Link>

              <Link
                href={`/${language}/acp`}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition"
              >
                <span>{byLanguage(language, { es: "ACP (Código Desplegable)", en: "ACP (Deployable Code)", pt: "ACP (Código Implantável)" })}</span>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">ZIP Kit</span>
              </Link>

              <Link
                href={`/${language}/insights`}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition"
              >
                <span>{byLanguage(language, { es: "Artículos & Insights", en: "Insights & Articles", pt: "Artigos & Insights" })}</span>
                <span className="text-xs text-slate-500 font-normal">12 Guías</span>
              </Link>
            </nav>

            <div className="my-1 border-t border-slate-200 dark:border-slate-800" />

            {/* Mobile Controls: Currency Switcher */}
            <div className="flex items-center justify-between px-1 py-1">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {byLanguage(language, { es: "Moneda de precios:", en: "Pricing currency:", pt: "Moeda de preços:" })}
              </span>
              <div className="flex items-center rounded-lg border border-slate-300 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900 p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setCurrency("USD")}
                  className={`px-3 py-1 rounded-md transition ${currency === "USD" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs" : "text-slate-500"}`}
                >
                  USD
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency("COP")}
                  className={`px-3 py-1 rounded-md transition ${currency === "COP" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs" : "text-slate-500"}`}
                >
                  COP
                </button>
              </div>
            </div>

            {/* Mobile Action CTAs */}
            <div className="flex flex-col gap-2 pt-2">
              {user ? (
                <Link
                  href="/projects"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-md"
                >
                  <span>{byLanguage(language, { es: "Mi Workspace", en: "My Workspace", pt: "Meu Workspace" })}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  <a
                    href="#validar-idea"
                    onClick={handleValidateClick}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>{byLanguage(language, { es: "Validar mi idea gratis", en: "Validate idea free", pt: "Validar ideia grátis" })}</span>
                  </a>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    {byLanguage(language, { es: "Iniciar sesión", en: "Log in", pt: "Entrar" })}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

