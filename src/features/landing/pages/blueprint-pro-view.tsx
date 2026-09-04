"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, CheckCircle2, Cpu, Eye, FileText, Layers, Lock, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { useCurrency } from "@/core/commerce/currency-context";
import { useLanguage } from "@/core/i18n/language-context";
import { byLanguage } from "@/features/product-experience/core/localized-copy";
import { LandingHeader } from "../components/landing-header";
import { LandingFooter } from "../components/landing-footer";
import { BlueprintExampleViewer } from "../components/blueprint-example-viewer";
import { RoiCalculatorWidget } from "../components/roi-calculator-widget";

export function BlueprintProView() {
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

  function handleBuyPro() {
    router.push("/register?tier=blueprint_pro");
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      <LandingHeader isDark={isDark} setIsDark={setIsDark} />

      <main>
        {/* HERO */}
        <section className="relative pt-16 pb-16 md:pt-24 md:pb-20 overflow-hidden text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider mb-6">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              {byLanguage(language, { es: "Nivel Profesional", en: "Professional Tier", pt: "Nível Profissional" })}
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
              {byLanguage(language, {
                es: "Blueprint Pro: Arquitectura Integral, Diagramas y Gobernanza",
                en: "Blueprint Pro: Comprehensive Architecture, Diagrams & Governance",
                pt: "Blueprint Pro: Arquitetura Integral, Diagramas e Governança",
              })}
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
              {byLanguage(language, {
                es: "El plano arquitectónico definitivo. Diseñado para equipos técnicos y líderes de negocio que necesitan controlar memoria, dependencias, riesgos y costos de tokens.",
                en: "The definitive architectural blueprint. Built for tech teams and business leaders who need to control memory, dependencies, risks, and token costs.",
                pt: "A planta arquitetônica definitiva. Criada para equipes técnicas e líderes de negócios que precisam controlar memória, dependências, riscos e custos de tokens.",
              })}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                type="button"
                onClick={handleBuyPro}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
              >
                <span>
                  {byLanguage(language, {
                    es: `Generar Blueprint Pro (${formatPrice(basePrices.blueprint_pro_usd)} ${currency})`,
                    en: `Generate Blueprint Pro (${formatPrice(basePrices.blueprint_pro_usd)} ${currency})`,
                    pt: `Gerar Blueprint Pro (${formatPrice(basePrices.blueprint_pro_usd)} ${currency})`,
                  })}
                </span>
                <ArrowRight className="h-4 w-4" />
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

        {/* REAL EXAMPLE VIEWER PRO */}
        <section className="py-16 bg-slate-100/60 dark:bg-slate-950 border-y border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
                {byLanguage(language, { es: "Consola Interactiva de Blueprint Pro", en: "Interactive Blueprint Pro Console", pt: "Console Interativo Blueprint Pro" })}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-3">
                {byLanguage(language, {
                  es: "Explora la consola arquitectónica de un Blueprint Pro real",
                  en: "Explore the architectural console of a real Blueprint Pro",
                  pt: "Explore o console arquitetônico de um Blueprint Pro real",
                })}
              </h2>
            </div>

            <BlueprintExampleViewer mode="pro" />
          </div>
        </section>

        {/* 4 CORE CAPABILITIES OF PRO */}
        <section className="py-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Feature 1 */}
              <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Layers className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {byLanguage(language, { es: "Diagramas de Secuencia y Flujos Interactivos", en: "Interactive Sequence & Flow Diagrams", pt: "Diagramas de Sequência e Fluxos Interativos" })}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {byLanguage(language, {
                    es: "Visualiza el ciclo cognitivo del agente: cómo recibe el input, qué ramas condicionales toma, en qué orden consulta herramientas externas y cuándo devuelve el resultado.",
                    en: "Visualize the agent cognitive loop: how it receives input, which branch conditions it takes, in what order it calls tools, and when it returns results.",
                    pt: "Visualize o ciclo cognitivo do agente: como recebe o input, quais condições ramifica, em que ordem consulta ferramentas e quando retorna o resultado.",
                  })}
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Cpu className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {byLanguage(language, { es: "Matriz de Memoria & Gestión de Contexto", en: "Memory Matrix & Context Management", pt: "Matriz de Memória & Gestão de Contexto" })}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {byLanguage(language, {
                    es: "Define la estrategia exacta para evitar degradación de contexto: memoria de corto plazo (buffer), memoria semántica (RAG) y memoria operacional persistente.",
                    en: "Define the exact strategy to avoid context rot: short-term buffer, semantic RAG memory, and persistent operational memory.",
                    pt: "Defina a estratégia exata para evitar degradação de contexto: memória de curto prazo (buffer), memória semântica (RAG) e memória operacional.",
                  })}
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {byLanguage(language, { es: "Gobernanza Human-in-the-Loop (HITL)", en: "Human-in-the-Loop (HITL) Governance", pt: "Governança Human-in-the-Loop (HITL)" })}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {byLanguage(language, {
                    es: "Establece reglas de aprobación obligatoria. Si un agente supera un umbral financiero o encuentra una discrepancia legal, el flujo se pausa y notifica al responsable humano.",
                    en: "Establish mandatory approval rules. If an agent exceeds a financial threshold or finds a legal discrepancy, the workflow pauses and alerts the human owner.",
                    pt: "Estabeleça regras de aprovação obrigatória. Se o agente exceder um limite financeiro ou encontrar divergência legal, o fluxo pausa e notifica o responsável humano.",
                  })}
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {byLanguage(language, { es: "Estimación y Contención de Tokens", en: "Token Spend & Cost Containment", pt: "Estimativa e Contenção de Tokens" })}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {byLanguage(language, {
                    es: "Calcula los tokens promedio de entrada y salida por turno, proyecta el costo operacional mensual y define los límites de seguridad contra bucles infinitos.",
                    en: "Calculate average prompt and completion tokens per run, project monthly operational costs, and set infinite-loop circuit breakers.",
                    pt: "Calcule os tokens médios de entrada e saída por turno, projete o custo operacional mensal e defina limites contra loops infinitos.",
                  })}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ROI CALCULATOR SECTION */}
        <section className="py-16 bg-slate-100/60 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <RoiCalculatorWidget />
          </div>
        </section>

        {/* UPGRADE CALLOUT TO ACP */}
        <section className="py-16 bg-white dark:bg-slate-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="p-8 rounded-3xl bg-gradient-to-r from-indigo-900/40 to-slate-900 border border-indigo-500/30 text-center">
              <h4 className="text-lg font-bold text-white mb-2">
                {byLanguage(language, {
                  es: "¿Listo para implementar con herramientas de código de IA o desarrolladores?",
                  en: "Ready to implement with AI coding tools or developers?",
                  pt: "Pronto para implementar com ferramentas de código IA ou desenvolvedores?",
                })}
              </h4>
              <p className="text-xs text-slate-300 max-w-xl mx-auto mb-6">
                {byLanguage(language, {
                  es: "El Agent Construction Package (ACP) transforma este Blueprint Pro en un paquete ZIP descargable con contratos JSON Schema y datasets de prueba.",
                  en: "The Agent Construction Package (ACP) turns this Blueprint Pro into a downloadable ZIP package with JSON Schema contracts and test datasets.",
                  pt: "O Agent Construction Package (ACP) transforma este Blueprint Pro em um pacote ZIP para download com contratos JSON Schema e datasets de teste.",
                })}
              </p>
              <Link
                href={`/${language}/acp`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-slate-900 text-xs font-extrabold hover:bg-slate-100 transition shadow-md"
              >
                <span>{byLanguage(language, { es: "Conoce el paquete técnico ACP →", en: "Explore ACP technical package →", pt: "Conheça o pacote técnico ACP →" })}</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
