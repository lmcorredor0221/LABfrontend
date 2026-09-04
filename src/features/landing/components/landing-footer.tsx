"use client";

import Link from "next/link";
import { Bot } from "lucide-react";
import { useLanguage } from "@/core/i18n/language-context";
import { byLanguage } from "@/features/product-experience/core/localized-copy";

export function LandingFooter() {
  const { language } = useLanguage();

  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800/80 py-12 text-slate-500 dark:text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          {/* Col 1: Brand */}
          <div className="col-span-2 space-y-3">
            <Link href={`/${language}`} className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
                <Bot className="h-4 w-4" />
              </div>
              <span className="font-black text-sm tracking-tight text-slate-900 dark:text-white">
                Lean Agent Builder (LAB)
              </span>
            </Link>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              {byLanguage(language, {
                es: "Plataforma para validar, diseñar y especificar agentes de IA empresariales con planos ejecutables antes de programar.",
                en: "Platform to validate, design, and specify enterprise AI agents with executable blueprints before coding.",
                pt: "Plataforma para validar, desenhar e especificar agentes de IA empresariais com plantas executáveis antes de programar.",
              })}
            </p>
          </div>

          {/* Col 2: Productos */}
          <div className="space-y-2.5">
            <div className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
              {byLanguage(language, { es: "Productos", en: "Products", pt: "Produtos" })}
            </div>
            <ul className="space-y-2">
              <li>
                <Link href={`/${language}/blueprint`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                  Blueprint Free
                </Link>
              </li>
              <li>
                <Link href={`/${language}/blueprint-pro`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                  Blueprint Pro
                </Link>
              </li>
              <li>
                <Link href={`/${language}/acp`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                  Agent Construction Package (ACP)
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Recursos */}
          <div className="space-y-2.5">
            <div className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
              {byLanguage(language, { es: "Recursos", en: "Resources", pt: "Recursos" })}
            </div>
            <ul className="space-y-2">
              <li>
                <Link href={`/${language}/insights`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                  {byLanguage(language, { es: "Artículos & Insights", en: "Insights & Articles", pt: "Artigos & Insights" })}
                </Link>
              </li>
              <li>
                <a href="#validar-idea" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                  {byLanguage(language, { es: "Validar mi idea gratis", en: "Validate idea free", pt: "Validar ideia grátis" })}
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                  {byLanguage(language, { es: "Preguntas Frecuentes", en: "FAQ", pt: "Perguntas Frequentes" })}
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Plataforma */}
          <div className="space-y-2.5">
            <div className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
              {byLanguage(language, { es: "Plataforma", en: "Platform", pt: "Plataforma" })}
            </div>
            <ul className="space-y-2">
              <li>
                <Link href="/login" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                  {byLanguage(language, { es: "Iniciar sesión", en: "Log in", pt: "Entrar" })}
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                  {byLanguage(language, { es: "Registrarse", en: "Sign up", pt: "Criar conta" })}
                </Link>
              </li>
              <li>
                <Link href="/projects" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                  {byLanguage(language, { es: "Workspace de Proyectos", en: "Projects Workspace", pt: "Workspace de Projetos" })}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <div>
            © {new Date().getFullYear()} Lean Agent Builder (LAB). {byLanguage(language, { es: "Todos los derechos reservados.", en: "All rights reserved.", pt: "Todos os direitos reservados." })}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">v2.4.0</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-400">Enterprise Ready</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
