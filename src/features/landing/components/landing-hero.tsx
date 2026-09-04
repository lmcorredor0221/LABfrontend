"use client";

import { FileText, Lightbulb, Sparkles } from "lucide-react";
import { useLanguage } from "@/core/i18n/language-context";
import { byLanguage } from "@/features/product-experience/core/localized-copy";

interface LandingHeroProps {
  onOpenExampleModal: () => void;
  onValidateClick: () => void;
}

export function LandingHero({ onOpenExampleModal, onValidateClick }: LandingHeroProps) {
  const { language } = useLanguage();

  return (
    <section className="relative pt-12 pb-14 md:pt-18 md:pb-20 overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Positioning Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-6 shadow-xs">
            <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span>
              {byLanguage(language, {
                es: "No empieces programando. Diseña y valida primero.",
                en: "Don't start with code. Design and validate first.",
                pt: "Não comece programando. Desenhe e valide primeiro.",
              })}
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15] mb-6">
            {byLanguage(language, {
              es: "Diseña agentes de IA para tu empresa ",
              en: "Design AI agents for your business ",
              pt: "Desenhe agentes de IA para sua empresa ",
            })}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500">
              {byLanguage(language, {
                es: "antes de programar",
                en: "before coding",
                pt: "antes de programar",
              })}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl mx-auto mb-8">
            {byLanguage(language, {
              es: "Evalúa qué procesos automatizar con IA, qué herramientas necesitan, cómo manejarán memoria y cuánto costarán antes de escribir una sola línea de código.",
              en: "Evaluate which workflows to automate with AI, what tools they need, how they will manage memory, and what they will cost before writing a single line of code.",
              pt: "Avalie quais fluxos automatizar com IA, quais ferramentas precisam, como gerenciarão memória e quanto custarão antes de escrever uma única linha de código.",
            })}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <a
              href="#validar-idea"
              onClick={(e) => {
                e.preventDefault();
                onValidateClick();
              }}
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-xl shadow-indigo-600/25 transition-all flex items-center justify-center gap-2.5 hover:scale-[1.02]"
            >
              <Sparkles className="h-4 w-4" />
              <span>
                {byLanguage(language, {
                  es: "Validar mi idea gratis →",
                  en: "Validate my idea for free →",
                  pt: "Validar minha ideia grátis →",
                })}
              </span>
            </a>

            <button
              type="button"
              onClick={onOpenExampleModal}
              className="w-full sm:w-auto px-7 py-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>
                {byLanguage(language, {
                  es: "Ver un ejemplo de plano real",
                  en: "View a real blueprint example",
                  pt: "Ver um exemplo de planta real",
                })}
              </span>
            </button>
          </div>

          {/* Secondary Compatibility Chips */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
            <span className="font-medium">
              {byLanguage(language, {
                es: "Planos listos para:",
                en: "Blueprints ready for:",
                pt: "Plantas prontas para:",
              })}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-200/70 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-300">
              {byLanguage(language, { es: "Desarrolladores Humanos", en: "Human Developers", pt: "Desenvolvedores Humanos" })}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-200/70 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-300">
              Cursor
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-200/70 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-300">
              Claude Code
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-200/70 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-300">
              GitHub Copilot
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
