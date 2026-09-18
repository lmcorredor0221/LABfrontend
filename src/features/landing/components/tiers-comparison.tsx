"use client";

import { useState } from "react";
import { Check, Users, Wrench } from "lucide-react";
import { useCurrency } from "@/core/commerce/currency-context";
import { useLanguage } from "@/core/i18n/language-context";
import { byLanguage } from "@/features/product-experience/core/localized-copy";

type ScaleSize = "S" | "M" | "L" | "XL";

interface TiersComparisonProps {
  onStartFree: () => void;
  onOpenPurchase: (planName: string, usdPrice: number) => void;
  onOpenBuilderModal: () => void;
  onOpenFactoryModal: () => void;
}

export function TiersComparison({
  onStartFree,
  onOpenPurchase,
  onOpenBuilderModal,
  onOpenFactoryModal,
}: TiersComparisonProps) {
  const { language } = useLanguage();
  const { currency, formatPrice, basePrices } = useCurrency();
  const [calcScale, setCalcScale] = useState<ScaleSize>("M");
  const acpUpgradeUsd = Math.max(basePrices.acp_premium_usd - basePrices.blueprint_pro_usd, 0);
  const builderMonthlyUsd = 89;

  const impactData: Record<ScaleSize, { trad: string; lab: string; sav: string }> = {
    S: { trad: "120 – 160 h", lab: "60 – 90 h", sav: "35% – 50%" },
    M: { trad: "280 – 360 h", lab: "140 – 210 h", sav: "30% – 50%" },
    L: { trad: "600 – 850 h", lab: "320 – 480 h", sav: "35% – 48%" },
    XL: { trad: "1,200 – 1,800 h", lab: "650 – 1,000 h", sav: "35% – 45%" },
  };

  const scaleLabels: Record<ScaleSize, { label: string; desc: string }> = {
    S: {
      label: byLanguage(language, { es: "Pequeño (1 Agente)", en: "Small (1 Agent)", pt: "Pequeno (1 Agente)" }),
      desc: byLanguage(language, { es: "1 Agente | 2 Herramientas", en: "1 Agent | 2 Tools", pt: "1 Agente | 2 Ferramentas" }),
    },
    M: {
      label: byLanguage(language, { es: "Mediano (2-3 Agentes)", en: "Medium (2-3 Agents)", pt: "Médio (2-3 Agentes)" }),
      desc: byLanguage(language, { es: "2-3 Agentes | 5 Herramientas | ERP", en: "2-3 Agents | 5 Tools | ERP", pt: "2-3 Agentes | 5 Ferramentas | ERP" }),
    },
    L: {
      label: byLanguage(language, { es: "Grande (Sistema Multiagente)", en: "Large (Multi-agent System)", pt: "Grande (Sistema Multiagente)" }),
      desc: byLanguage(language, { es: "4-6 Agentes | Multi-sistema | HITL", en: "4-6 Agents | Multi-system | HITL", pt: "4-6 Agentes | Multi-sistema | HITL" }),
    },
    XL: {
      label: byLanguage(language, { es: "Empresarial (Flota Completa)", en: "Enterprise (Full Fleet)", pt: "Empresarial (Frota Completa)" }),
      desc: byLanguage(language, { es: "8+ Agentes | Múltiples Áreas", en: "8+ Agents | Multiple Depts", pt: "8+ Agentes | Múltiplas Áreas" }),
    },
  };

  return (
    <div className="space-y-16">
      {/* IMPACT ESTIMATOR */}
      <section id="estimador" className="py-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
              {byLanguage(language, { es: "Estimación Transparente", en: "Transparent Estimation", pt: "Estimativa Transparente" })}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-3">
              {byLanguage(language, {
                es: "Qué esfuerzo puedes evitar cuando diseñas antes de programar",
                en: "What effort you can avoid when you design before coding",
                pt: "Que esforço você pode evitar ao desenhar antes de programar",
              })}
            </h2>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-lg">
            {/* Scale Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-8">
              {(["S", "M", "L", "XL"] as ScaleSize[]).map((scale) => (
                <button
                  key={scale}
                  type="button"
                  onClick={() => setCalcScale(scale)}
                  className={`p-3 rounded-xl border text-left transition ${
                    calcScale === scale
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400"
                  }`}
                >
                  <div className="text-xs font-extrabold">{scaleLabels[scale].label}</div>
                  <div className={`text-[10px] mt-0.5 ${calcScale === scale ? "text-indigo-100" : "text-slate-500 dark:text-slate-400"}`}>
                    {scaleLabels[scale].desc}
                  </div>
                </button>
              ))}
            </div>

            {/* Impact Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  {byLanguage(language, { es: "Desarrollo a ciegas (Tradicional)", en: "Blind Development (Traditional)", pt: "Desenvolvimento às cegas (Tradicional)" })}
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-700 dark:text-slate-300">
                  {impactData[calcScale].trad}
                </div>
                <div className="text-[11px] text-red-500 mt-1">
                  {byLanguage(language, { es: "Alto riesgo de retrabajo", en: "High risk of rework", pt: "Alto risco de retrabalho" })}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60">
                <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-1">
                  {byLanguage(language, { es: "Con Blueprint & ACP LAB", en: "With LAB Blueprint & ACP", pt: "Com Blueprint & ACP LAB" })}
                </div>
                <div className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">
                  {impactData[calcScale].lab}
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                  {byLanguage(language, { es: "Especificación determinista", en: "Deterministic specification", pt: "Especificação determinística" })}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-1">
                  {byLanguage(language, { es: "Ahorro Estimado de Esfuerzo", en: "Estimated Effort Savings", pt: "Economia Estimada de Esforço" })}
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  {impactData[calcScale].sav}
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                  {byLanguage(language, { es: "Menos ambigüedad y retrabajo", en: "Less ambiguity and rework", pt: "Menos ambiguidade e retrabalho" })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TIERS & PRICING */}
      <section id="precios" className="py-14 bg-slate-50 dark:bg-slate-950 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
              {byLanguage(language, { es: "Funnel por proyecto", en: "Per-project funnel", pt: "Funil por projeto" })}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-3">
              {byLanguage(language, {
                es: "Valida gratis, diseña completo o prepara para construir",
                en: "Validate for free, complete the design, or prepare to build",
                pt: "Valide grátis, complete o desenho ou prepare para construir",
              })}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-2">
              {byLanguage(language, {
                es: "Blueprint y ACP siguen siendo los entregables; aquí los presentamos desde la decisión de negocio que habilitan.",
                en: "Blueprint and ACP remain the deliverables; here they are presented through the business decision they enable.",
                pt: "Blueprint e ACP continuam sendo os entregáveis; aqui aparecem pela decisão de negócio que habilitam.",
              })}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
            {/* TIER 1: FREE */}
            <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between">
              <div>
                <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold font-mono">
                  {byLanguage(language, { es: "EXPLORA", en: "EXPLORE", pt: "EXPLORAR" })}
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-3 mb-1">
                  {byLanguage(language, { es: "Valida y diseña tu idea", en: "Validate and design your idea", pt: "Valide e desenhe sua ideia" })}
                </h3>
                <div className="flex items-baseline gap-1 my-4">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">$0</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">USD</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                  {byLanguage(language, {
                    es: "Comprueba si tu idea tiene sentido y obtén un diseño inicial.",
                    en: "Check whether your idea makes sense and get an initial design.",
                    pt: "Verifique se sua ideia faz sentido e receba um desenho inicial.",
                  })}
                </p>

                <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{byLanguage(language, { es: "Diagnóstico Lean de Viabilidad", en: "Lean Feasibility Diagnosis", pt: "Diagnóstico Lean de Viabilidade" })}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{byLanguage(language, { es: "Arquetipo de Agente Sugerido", en: "Suggested Agent Archetype", pt: "Arquétipo de Agente Sugerido" })}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{byLanguage(language, { es: "Especificación Básica Navegable", en: "Basic Navigable Specification", pt: "Especificação Básica Navegável" })}</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={onStartFree}
                className="w-full py-3.5 rounded-xl border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 font-extrabold text-xs hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition"
              >
                {byLanguage(language, { es: "Validar mi idea gratis", en: "Validate my idea for free", pt: "Validar minha ideia grátis" })}
              </button>
            </div>

            {/* TIER 2: BLUEPRINT PRO */}
            <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-slate-900 border-2 border-indigo-500 dark:border-indigo-500 shadow-xl flex flex-col justify-between relative scale-[1.02]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                {byLanguage(language, { es: "Más Popular", en: "Most Popular", pt: "Mais Popular" })}
              </div>

              <div>
                <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-xs font-bold font-mono">
                  {byLanguage(language, { es: "DISEÑA", en: "DESIGN", pt: "DESENHAR" })}
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-3 mb-1">
                  {byLanguage(language, { es: "Diseño completo", en: "Complete design", pt: "Desenho completo" })}
                </h3>
                <div className="flex items-baseline gap-1 my-4">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">
                    {formatPrice(basePrices.blueprint_pro_usd)}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    {currency} / {byLanguage(language, { es: "proyecto", en: "project", pt: "projeto" })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                  {byLanguage(language, {
                    es: "Define completamente cómo funcionará tu agente antes de programarlo. Incluye Blueprint Pro.",
                    en: "Fully define how your agent will work before coding. Includes Blueprint Pro.",
                    pt: "Defina completamente como seu agente funcionará antes de programar. Inclui Blueprint Pro.",
                  })}
                </p>

                <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{byLanguage(language, { es: "Todo lo del plan Free", en: "Everything in Free", pt: "Tudo do plano Free" })}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{byLanguage(language, { es: "Diagramas de flujo interactivos", en: "Interactive flow diagrams", pt: "Diagramas de fluxo interativos" })}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{byLanguage(language, { es: "Matriz de Memoria & Contexto", en: "Memory & Context Matrix", pt: "Matriz de Memória & Contexto" })}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{byLanguage(language, { es: "Políticas Human-in-the-Loop", en: "Human-in-the-Loop Policies", pt: "Políticas Human-in-the-Loop" })}</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => onOpenPurchase("Blueprint Pro", basePrices.blueprint_pro_usd)}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/25 transition"
              >
                {byLanguage(language, { es: "Completar mi diseño", en: "Complete my design", pt: "Completar meu desenho" })} — {formatPrice(basePrices.blueprint_pro_usd)} {currency}
              </button>
            </div>

            {/* TIER 3: ACP */}
            <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between">
              <div>
                <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold font-mono">
                  {byLanguage(language, { es: "PREPARA", en: "PREPARE", pt: "PREPARAR" })}
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-3 mb-1">
                  {byLanguage(language, { es: "Listo para construir", en: "Ready to build", pt: "Pronto para construir" })}
                </h3>
                <div className="flex items-baseline gap-1 my-4">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">
                    {formatPrice(basePrices.acp_premium_usd)}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    {currency} / {byLanguage(language, { es: "proyecto", en: "project", pt: "projeto" })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                  {byLanguage(language, {
                    es: "Convierte tu diseño en las especificaciones técnicas necesarias para comenzar la implementación. Incluye Blueprint Pro + ACP.",
                    en: "Turn your design into the technical specs needed to start implementation. Includes Blueprint Pro + ACP.",
                    pt: "Converta seu desenho nas especificações técnicas necessárias para iniciar a implementação. Inclui Blueprint Pro + ACP.",
                  })}
                </p>
                <p className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
                  {byLanguage(language, {
                    es: "¿Ya compraste Diseño Pro? Actualiza por",
                    en: "Already bought Complete Design? Upgrade for",
                    pt: "Já comprou Desenho completo? Atualize por",
                  })}{" "}
                  {formatPrice(acpUpgradeUsd)} {currency}.
                </p>

                <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 mb-8 font-mono">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{byLanguage(language, { es: "Todo lo de Blueprint Pro", en: "Everything in Blueprint Pro", pt: "Tudo do Blueprint Pro" })}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{byLanguage(language, { es: "Contratos JSON Schema", en: "JSON Schema contracts", pt: "Contratos JSON Schema" })}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{byLanguage(language, { es: "Prompts versionados y guardrails", en: "Versioned prompts and guardrails", pt: "Prompts versionados e guardrails" })}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{byLanguage(language, { es: "Dataset de evaluación", en: "Evaluation dataset", pt: "Dataset de avaliação" })}</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => onOpenPurchase("Agent Construction Package (ACP)", basePrices.acp_premium_usd)}
                className="w-full py-3.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-extrabold text-xs shadow-md transition"
              >
                {byLanguage(language, { es: "Preparar para construcción", en: "Prepare for build", pt: "Preparar para construção" })} — {formatPrice(basePrices.acp_premium_usd)} {currency}
              </button>
            </div>
          </div>

          {/* Builder & Factory Cards */}
          <div className="mx-auto mt-14 max-w-5xl text-center">
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {byLanguage(language, { es: "¿Necesitas algo diferente?", en: "Need something different?", pt: "Precisa de algo diferente?" })}
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {byLanguage(language, {
                es: "Estas opciones no son el siguiente paso obligatorio del ACP: son rutas separadas para equipos con otras necesidades.",
                en: "These options are not the mandatory next step after ACP: they are separate paths for teams with different needs.",
                pt: "Essas opções não são o próximo passo obrigatório depois do ACP: são rotas separadas para equipes com outras necessidades.",
              })}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto mt-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-1">
                  <Users className="h-4 w-4" />
                  <span>{byLanguage(language, { es: "¿Construyes agentes para clientes?", en: "Do you build agents for clients?", pt: "Constrói agentes para clientes?" })}</span>
                </div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                  LAB Builder (Agencias & Consultores)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {formatPrice(builderMonthlyUsd)} {currency}/mes —{" "}
                  {byLanguage(language, {
                    es: "3 Blueprints y 1 ACP incluidos al mes.",
                    en: "3 Blueprints and 1 ACP included per month.",
                    pt: "3 Blueprints e 1 ACP incluídos por mês.",
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenBuilderModal}
                className="px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold shrink-0 hover:bg-indigo-100 transition"
              >
                {byLanguage(language, { es: "Saber más", en: "Learn more", pt: "Saber mais" })}
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold mb-1">
                  <Wrench className="h-4 w-4" />
                  <span>{byLanguage(language, { es: "¿No tienes programadores?", en: "No programmers available?", pt: "Não tem programadores?" })}</span>
                </div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                  LAB Factory (Construcción Delegada)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {byLanguage(language, {
                    es: "Nosotros construimos y desplegamos tu agente desde tu ACP.",
                    en: "We build and deploy your agent from your ACP.",
                    pt: "Nós construímos e implantamos seu agente a partir do seu ACP.",
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenFactoryModal}
                className="px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-bold shrink-0 hover:bg-amber-100 transition"
              >
                {byLanguage(language, { es: "Cotizar Factory", en: "Get Factory Quote", pt: "Cotar Factory" })}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
