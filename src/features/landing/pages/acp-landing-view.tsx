"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Code2, Download, FileCode2, Layers, ShieldCheck, Sparkles, Terminal } from "lucide-react";
import { useCurrency } from "@/core/commerce/currency-context";
import { useLanguage } from "@/core/i18n/language-context";
import { byLanguage } from "@/features/product-experience/core/localized-copy";
import { LandingHeader } from "../components/landing-header";
import { LandingFooter } from "../components/landing-footer";
import { AcpPackageInspector } from "../components/acp-package-inspector";
import { RoiCalculatorWidget } from "../components/roi-calculator-widget";

export function AcpLandingView() {
  const router = useRouter();
  const { language } = useLanguage();
  const { currency, formatPrice, basePrices } = useCurrency();
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  function handleBuyAcp() {
    router.push("/register?tier=acp");
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      <LandingHeader isDark={isDark} setIsDark={setIsDark} />

      <main>
        {/* HERO */}
        <section className="relative pt-16 pb-16 md:pt-24 md:pb-20 overflow-hidden text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-6">
              <Download className="h-3.5 w-3.5 text-emerald-500" />
              {byLanguage(language, { es: "Paquete de Construcción Portable", en: "Portable Construction Package", pt: "Pacote de Construção Portátil" })}
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
              {byLanguage(language, {
                es: "Agent Construction Package (ACP): El Estándar de Código para tu Agente",
                en: "Agent Construction Package (ACP): The Code Standard for Your Agent",
                pt: "Agent Construction Package (ACP): O Padrão de Código para seu Agente",
              })}
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
              {byLanguage(language, {
                es: "Entrega especificaciones técnicas estandarizadas a tus desarrolladores o asistentes de IA (Cursor, Claude Code, Windsurf). Elimina el 60% del retrabajo en desarrollo agéntico.",
                en: "Hand standardized technical specifications to your engineers or AI coding assistants (Cursor, Claude Code, Windsurf). Eliminate 60% of agentic rework.",
                pt: "Entregue especificações técnicas padronizadas para seus desenvolvedores ou assistentes IA (Cursor, Claude Code, Windsurf). Elimine 60% do retrabalho agêntico.",
              })}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                type="button"
                onClick={handleBuyAcp}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-extrabold shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
              >
                <Download className="h-4 w-4" />
                <span>
                  {byLanguage(language, {
                    es: `Generar Paquete ACP (${formatPrice(basePrices.acp_premium_usd)} ${currency})`,
                    en: `Generate ACP Package (${formatPrice(basePrices.acp_premium_usd)} ${currency})`,
                    pt: `Gerar Pacote ACP (${formatPrice(basePrices.acp_premium_usd)} ${currency})`,
                  })}
                </span>
              </button>

              <Link
                href={`/${language}#validar-idea`}
                className="w-full sm:w-auto px-6 py-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                {byLanguage(language, { es: "Validar mi idea gratis primero", en: "Validate my idea free first", pt: "Validar minha ideia grátis primeiro" })}
              </Link>
            </div>
          </div>
        </section>

        {/* REAL ACP PACKAGE INSPECTOR */}
        <section className="py-16 bg-slate-100/60 dark:bg-slate-950 border-y border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
                {byLanguage(language, { es: "Explorador Interactivo de Archivos Real", en: "Interactive Real File Explorer", pt: "Explorador Interativo de Arquivos Real" })}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-3">
                {byLanguage(language, {
                  es: "Inspecciona el contenido del paquete ACP (.zip) estandarizado",
                  en: "Inspect the contents of the standardized ACP (.zip) package",
                  pt: "Inspecione o conteúdo do pacote ACP (.zip) padronizado",
                })}
              </h2>
            </div>

            <AcpPackageInspector />
          </div>
        </section>

        {/* ROI CALCULATOR */}
        <section className="py-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <RoiCalculatorWidget />
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
