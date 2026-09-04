"use client";

import Link from "next/link";
import { ArrowRight, Check, Code2, Download, FileCode2, FileText, Layers, ShieldCheck, Sparkles } from "lucide-react";
import { useLanguage } from "@/core/i18n/language-context";
import { byLanguage } from "@/features/product-experience/core/localized-copy";

export function DeliverablesSection() {
  const { language } = useLanguage();

  return (
    <section id="artefactos" className="py-16 md:py-20 bg-slate-50 dark:bg-slate-950 border-y border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
            {byLanguage(language, {
              es: "Entregables Tangibles",
              en: "Tangible Deliverables",
              pt: "Entregáveis Tangíveis",
            })}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-3">
            {byLanguage(language, {
              es: "Blueprints claros y código estructurado para tu agente",
              en: "Clear blueprints and structured code for your AI agent",
              pt: "Blueprints claros e código estruturado para seu agente de IA",
            })}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-3 leading-relaxed">
            {byLanguage(language, {
              es: "No entregamos conceptos vagos. Generamos planos estratégicos para líderes de negocio y paquetes técnicos estandarizados para ingenieros.",
              en: "We don't deliver vague concepts. We generate strategic blueprints for business leaders and standardized technical packages for engineers.",
              pt: "Não entregamos conceitos vagos. Geramos planos estratégicos para líderes de negócios e pacotes técnicos padronizados para engenheiros.",
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Card 1: Blueprint */}
          <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-4 mb-4">
                <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-xs font-bold font-mono">
                  {byLanguage(language, { es: "PLANO ESTRATÉGICO (BLUEPRINT)", en: "STRATEGIC BLUEPRINT", pt: "PLANTA ESTRATÉGICA (BLUEPRINT)" })}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  {byLanguage(language, { es: "Para Negocio & Producto", en: "For Business & Product", pt: "Para Negócios & Produto" })}
                </span>
              </div>

              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-3">
                {byLanguage(language, {
                  es: "El mapa completo de decisiones y flujos",
                  en: "The complete map of decisions and workflows",
                  pt: "O mapa completo de decisões e fluxos",
                })}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                {byLanguage(language, {
                  es: "Especificación ejecutable que define exactamente qué hará el agente, qué APIs consultará, cuándo intervendrá un humano y qué límites de presupuesto tendrá.",
                  en: "Executable specification defining exactly what the agent will do, which APIs it will query, when a human intervenes, and what budget limits apply.",
                  pt: "Especificação executável que define exatamente o que o agente fará, quais APIs consultará, quando um humano intervirá e quais limites de orçamento terá.",
                })}
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>{byLanguage(language, { es: "Diagramas Navegables:", en: "Navigable Diagrams:", pt: "Diagramas Navegáveis:" })}</strong>{" "}
                    {byLanguage(language, { es: "Flujos de decisiones, árboles de razonamiento y matrices de memoria.", en: "Decision flows, reasoning trees, and memory matrices.", pt: "Fluxos de decisão, árvores de raciocínio e matrizes de memória." })}
                  </span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>{byLanguage(language, { es: "Políticas Human-in-the-Loop:", en: "Human-in-the-Loop Policies:", pt: "Políticas Human-in-the-Loop:" })}</strong>{" "}
                    {byLanguage(language, { es: "Reglas claras de cuándo y a quién escalar excepciones.", en: "Clear rules on when and whom to escalate exceptions.", pt: "Regras claras de quando e a quem escalar exceções." })}
                  </span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>{byLanguage(language, { es: "Estimación Financiera:", en: "Financial Estimation:", pt: "Estimativa Financeira:" })}</strong>{" "}
                    {byLanguage(language, { es: "Cálculo de consumo de tokens por ejecución y ROI proyectado.", en: "Token spend calculation per run and projected ROI.", pt: "Cálculo de consumo de tokens por execução e ROI projetado." })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Link
                href={`/${language}/blueprint-pro`}
                className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <span>{byLanguage(language, { es: "Explorar Blueprint Pro en detalle", en: "Explore Blueprint Pro in detail", pt: "Explorar Blueprint Pro em detalhes" })}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 2: ACP */}
          <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/60 shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-bl-full pointer-events-none" />

            <div>
              <div className="flex items-center justify-between gap-4 mb-4">
                <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold font-mono">
                  {byLanguage(language, { es: "PAQUETE TÉCNICO (ACP)", en: "TECHNICAL PACKAGE (ACP)", pt: "PACOTE TÉCNICO (ACP)" })}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  {byLanguage(language, { es: "Para Desarrolladores & IA", en: "For Developers & AI", pt: "Para Desenvolvedores & IA" })}
                </span>
              </div>

              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-3">
                {byLanguage(language, {
                  es: "El ZIP estandarizado listo para implementar",
                  en: "The standardized ZIP ready to implement",
                  pt: "O ZIP padronizado pronto para implementar",
                })}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                {byLanguage(language, {
                  es: "Un archivo .zip descargable con especificaciones técnicas completas, contratos de herramientas en JSON Schema, prompts versionados y datasets de prueba.",
                  en: "A downloadable .zip package with complete technical specs, JSON Schema tool contracts, versioned prompts, and evaluation datasets.",
                  pt: "Um arquivo .zip para download com especificações técnicas completas, contratos JSON Schema, prompts versionados e datasets de teste.",
                })}
              </p>

              <div className="space-y-3 mb-8 font-mono text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>📁 tools/tool_contracts.json</span>
                  <span className="text-[10px] text-indigo-500">JSON Schema v7</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>📁 prompts/system_prompt_v1.md</span>
                  <span className="text-[10px] text-emerald-500">Versioned</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>📁 evaluations/benchmark_cases.json</span>
                  <span className="text-[10px] text-amber-500">Golden Dataset</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Link
                href={`/${language}/acp`}
                className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <span>{byLanguage(language, { es: "Ver arquitectura y especificación ACP", en: "View ACP architecture and specification", pt: "Ver arquitetura e especificação ACP" })}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
