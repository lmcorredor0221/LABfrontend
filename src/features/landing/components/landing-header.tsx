"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, Bot, Moon, Sparkles, Sun } from "lucide-react";
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
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
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Currency Switcher */}
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

          {/* Auth & Primary CTA */}
          {user ? (
            <Link
              href="/projects"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition"
            >
              <span>{byLanguage(language, { es: "Mi Workspace", en: "My Workspace", pt: "Meu Workspace" })}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-flex rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-indigo-500 transition"
              >
                {byLanguage(language, { es: "Iniciar sesión", en: "Log in", pt: "Entrar" })}
              </Link>
              <a
                href="#validar-idea"
                onClick={handleValidateClick}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02]"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{byLanguage(language, { es: "Validar mi idea gratis", en: "Validate idea free", pt: "Validar ideia grátis" })}</span>
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
