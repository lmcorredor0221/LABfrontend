"use client";

import { useState } from "react";
import { ArrowRight, Calculator, CheckCircle2, DollarSign, TrendingUp, Zap } from "lucide-react";
import { useCurrency } from "@/core/commerce/currency-context";
import { useLanguage } from "@/core/i18n/language-context";
import { byLanguage } from "@/features/product-experience/core/localized-copy";

type ProjectScale = "single" | "medium" | "large" | "enterprise";

export function RoiCalculatorWidget() {
  const { language } = useLanguage();
  const { currency, formatPrice } = useCurrency();
  const [scale, setScale] = useState<ProjectScale>("medium");

  const hourlyRateUsd = 45; // Benchmark LATAM 2026

  const scaleConfig: Record<ProjectScale, { label: string; tradHours: number; labHours: number; desc: string }> = {
    single: {
      label: byLanguage(language, { es: "1 Agente Simple", en: "1 Simple Agent", pt: "1 Agente Simples" }),
      tradHours: 140,
      labHours: 65,
      desc: byLanguage(language, { es: "1 Agente | 2 herramientas API | Extracción", en: "1 Agent | 2 API tools | Extraction", pt: "1 Agente | 2 ferramentas API | Extração" }),
    },
    medium: {
      label: byLanguage(language, { es: "2-3 Agentes (ERP / CRM)", en: "2-3 Agents (ERP / CRM)", pt: "2-3 Agentes (ERP / CRM)" }),
      tradHours: 320,
      labHours: 150,
      desc: byLanguage(language, { es: "2-3 Agentes | 5 herramientas | Conciliación HITL", en: "2-3 Agents | 5 tools | HITL Reconciliation", pt: "2-3 Agentes | 5 ferramentas | Conciliação HITL" }),
    },
    large: {
      label: byLanguage(language, { es: "Sistema Multiagente Complejo", en: "Complex Multi-Agent System", pt: "Sistema Multiagente Complexo" }),
      tradHours: 720,
      labHours: 360,
      desc: byLanguage(language, { es: "4-6 Agentes | Multi-sistema | Memoria RAG", en: "4-6 Agents | Multi-system | RAG Memory", pt: "4-6 Agentes | Multi-sistema | Memória RAG" }),
    },
    enterprise: {
      label: byLanguage(language, { es: "Flota Empresarial Multi-Área", en: "Multi-Dept Enterprise Fleet", pt: "Frota Empresarial Multi-Área" }),
      tradHours: 1500,
      labHours: 750,
      desc: byLanguage(language, { es: "8+ Agentes | Gobernanza corporativa completa", en: "8+ Agents | Full corporate governance", pt: "8+ Agentes | Governança corporativa completa" }),
    },
  };

  const current = scaleConfig[scale];
  const tradCostUsd = current.tradHours * hourlyRateUsd;
  const labSavingsHours = current.tradHours - current.labHours;
  const netSavingsUsd = labSavingsHours * hourlyRateUsd - 89;

  return (
    <div className="rounded-3xl p-6 sm:p-8 bg-slate-900 text-white border border-slate-800 shadow-2xl relative overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold font-mono uppercase tracking-wider">
            {byLanguage(language, { es: "Calculadora de ROI Empresarial 2026", en: "2026 Enterprise ROI Calculator", pt: "Calculadora de ROI Empresarial 2026" })}
          </span>
          <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-2">
            {byLanguage(language, {
              es: "Compara el costo de desarrollo a ciegas vs Con LAB",
              en: "Compare blind development cost vs With LAB",
              pt: "Compare o custo de desenvolvimento às cegas vs Com LAB",
            })}
          </h3>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Benchmark LATAM: <strong className="text-white">${hourlyRateUsd} USD / h</strong>
        </div>
      </div>

      {/* Scale Selector Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-8">
        {(["single", "medium", "large", "enterprise"] as ProjectScale[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setScale(k)}
            className={`p-3 rounded-xl border text-left transition text-xs ${
              scale === k
                ? "bg-indigo-600 border-indigo-500 text-white shadow-md font-bold"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            <div className="font-extrabold">{scaleConfig[k].label}</div>
            <div className="text-[10px] text-slate-300 mt-0.5">{scaleConfig[k].desc}</div>
          </button>
        ))}
      </div>

      {/* Live Calculation Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="text-xs font-bold text-slate-400">
            {byLanguage(language, { es: "Desarrollo Tradicional sin LAB", en: "Traditional Dev without LAB", pt: "Desenvolvimento sem LAB" })}
          </div>
          <div className="text-2xl font-black text-red-400">
            {formatPrice(tradCostUsd, tradCostUsd * 3170)}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {current.tradHours} horas de ingeniería • ~{Math.round(current.tradHours / 40)} semanas
          </div>
          <div className="text-[10px] text-red-400 font-semibold pt-1">
            ⚠ Alto riesgo de desbordamiento de presupuesto por rehacer prompts.
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-indigo-950/60 border border-indigo-800 space-y-2">
          <div className="text-xs font-bold text-indigo-300">
            {byLanguage(language, { es: "Con LAB Blueprint Pro / ACP", en: "With LAB Blueprint Pro / ACP", pt: "Com LAB Blueprint Pro / ACP" })}
          </div>
          <div className="text-2xl font-black text-indigo-400">
            {formatPrice(current.labHours * hourlyRateUsd + 89, (current.labHours * hourlyRateUsd + 89) * 3170)}
          </div>
          <div className="text-[11px] text-indigo-300 font-mono">
            {current.labHours} horas con ACP • ~{Math.round(current.labHours / 40)} semanas
          </div>
          <div className="text-[10px] text-emerald-400 font-semibold pt-1">
            ✓ Especificación determinista + generación lista para Cursor / Claude.
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-950/50 border border-emerald-800 space-y-2">
          <div className="text-xs font-bold text-emerald-300">
            {byLanguage(language, { es: "Ahorro Neto Estimado", en: "Estimated Net Savings", pt: "Economia Liquida Estimada" })}
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {formatPrice(netSavingsUsd, netSavingsUsd * 3170)}
          </div>
          <div className="text-[11px] text-emerald-300 font-mono">
            Ahorro de {labSavingsHours} horas de retrabajo
          </div>
          <div className="text-[10px] text-emerald-400 font-semibold pt-1">
            🚀 Retorno de inversión (ROI) &gt; 50x el costo del ACP.
          </div>
        </div>
      </div>
    </div>
  );
}
