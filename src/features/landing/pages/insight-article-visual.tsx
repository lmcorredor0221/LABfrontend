import { ArrowRight, CheckCircle2, CircleDot, GitBranch, Layers3, Route, ShieldCheck } from "lucide-react";
import { byLanguage } from "@/features/product-experience/core/localized-copy";
import type { SupportedLanguage } from "@/core/i18n/language-config";
import type { InsightArticle } from "./insights-data";

interface InsightArticleVisualProps {
  article: InsightArticle;
  compact?: boolean;
  language: SupportedLanguage;
}

const KIND_ACCENT: Record<string, { line: string; panel: string; text: string }> = {
  "pattern-map": { line: "border-cyan-400/60", panel: "bg-cyan-400/12", text: "text-cyan-200" },
  "acp-pipeline": { line: "border-emerald-400/60", panel: "bg-emerald-400/12", text: "text-emerald-200" },
  "memory-layers": { line: "border-amber-300/70", panel: "bg-amber-300/12", text: "text-amber-100" },
  "evaluation-matrix": { line: "border-rose-300/70", panel: "bg-rose-300/12", text: "text-rose-100" },
  "production-checklist": { line: "border-lime-300/70", panel: "bg-lime-300/12", text: "text-lime-100" },
  "task-tree": { line: "border-sky-300/70", panel: "bg-sky-300/12", text: "text-sky-100" },
  "reflection-loop": { line: "border-orange-300/70", panel: "bg-orange-300/12", text: "text-orange-100" },
  "framework-radar": { line: "border-fuchsia-300/70", panel: "bg-fuchsia-300/12", text: "text-fuchsia-100" },
  "context-timeline": { line: "border-teal-300/70", panel: "bg-teal-300/12", text: "text-teal-100" },
  "htn-tree": { line: "border-blue-300/70", panel: "bg-blue-300/12", text: "text-blue-100" },
  "virtual-memory": { line: "border-violet-300/70", panel: "bg-violet-300/12", text: "text-violet-100" },
  "systems-blueprint": { line: "border-slate-300/70", panel: "bg-slate-300/12", text: "text-slate-100" },
};

function labelFor(kind: string, language: SupportedLanguage) {
  const labels = {
    "pattern-map": ["ReAct", "Router", "Planner", "HITL"],
    "acp-pipeline": ["Blueprint", "Contratos", "Tests", "Deploy"],
    "memory-layers": ["Contexto", "Memoria", "RAG", "Evidencia"],
    "evaluation-matrix": ["Calidad", "Coste", "Riesgo", "Trazas"],
    "production-checklist": ["Datos", "Tools", "Guardrails", "Evals"],
    "task-tree": ["Objetivo", "Subtareas", "Handoffs", "Artefactos"],
    "reflection-loop": ["Intento", "Critica", "Ajuste", "Salida"],
    "framework-radar": ["LangGraph", "CrewAI", "AutoGen", "ACP"],
    "context-timeline": ["Turno 1", "Resumen", "Checkpoint", "Recall"],
    "htn-tree": ["Meta", "Metodo", "Operador", "Rollback"],
    "virtual-memory": ["Core", "Contexto", "Archivo", "Page-in"],
    "systems-blueprint": ["Usuario", "Tools", "Memoria", "Observa"],
  }[kind] ?? ["Caso", "Blueprint", "ACP", "Valor"];

  if (language === "en") return labels.map((item) => item.replace("Critica", "Critique").replace("Memoria", "Memory"));
  if (language === "pt") return labels.map((item) => item.replace("Memoria", "Memoria").replace("Salida", "Saida"));
  return labels;
}

export function InsightArticleVisual({ article, compact = false, language }: InsightArticleVisualProps) {
  const visual = article.heroVisual;
  if (!visual) return null;

  const accent = KIND_ACCENT[visual.kind] ?? KIND_ACCENT["systems-blueprint"];
  const labels = labelFor(visual.kind, language);
  const visualTitle = visual.title[language] || visual.title.es;
  const eyebrow = visual.eyebrow[language] || visual.eyebrow.es;
  const detail = visual.detail[language] || visual.detail.es;

  return (
    <figure
      aria-label={article.heroImageAlt?.[language] || article.heroImageAlt?.es || visualTitle}
      className={`relative overflow-hidden rounded-lg border border-slate-800 bg-[#101722] text-white shadow-[0_20px_70px_rgba(15,23,42,0.24)] ${
        compact ? "p-4" : "p-5 sm:p-7"
      }`}
    >
      <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="relative grid gap-5 md:grid-cols-[1.05fr_.95fr] md:items-center">
        <div>
          <div className={`inline-flex items-center gap-2 rounded-md border ${accent.line} ${accent.panel} px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${accent.text}`}>
            <CircleDot className="h-3.5 w-3.5" />
            {eyebrow}
          </div>
          <h2 className={`${compact ? "mt-3 text-base" : "mt-4 text-2xl sm:text-3xl"} font-black leading-tight tracking-normal`}>
            {visualTitle}
          </h2>
          <p className={`${compact ? "mt-2 text-[11px]" : "mt-3 text-sm"} max-w-xl leading-relaxed text-slate-300`}>
            {detail}
          </p>
          {!compact ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {(article.tags ?? []).slice(0, 3).map((tag) => (
                <span key={tag} className="rounded-md border border-white/10 bg-white/8 px-2.5 py-1 text-[11px] font-bold text-slate-200">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="relative min-h-[170px]">
          <div className={`absolute right-0 top-0 rounded-lg border ${accent.line} ${accent.panel} px-4 py-3 text-right`}>
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300">
              {byLanguage(language, { es: "Senal clave", en: "Key signal", pt: "Sinal-chave" })}
            </div>
            <div className="mt-1 text-2xl font-black">{visual.metric}</div>
          </div>

          <div className="absolute left-0 top-10 grid w-[78%] gap-3">
            {labels.map((label, index) => {
              const Icon = index === 0 ? Route : index === 1 ? GitBranch : index === 2 ? Layers3 : ShieldCheck;
              return (
                <div
                  key={`${visual.kind}-${label}`}
                  className={`flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 shadow-sm backdrop-blur ${
                    index % 2 === 0 ? "translate-x-0" : "translate-x-8"
                  }`}
                >
                  <span className="flex items-center gap-2 text-[11px] font-bold text-slate-100">
                    <Icon className={`h-3.5 w-3.5 ${accent.text}`} />
                    {label}
                  </span>
                  {index < labels.length - 1 ? <ArrowRight className="h-3.5 w-3.5 text-slate-500" /> : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </figure>
  );
}
