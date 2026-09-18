"use client";

import { CheckCircle2, Code2, FileText, Layers, Sparkles } from "lucide-react";
import { useLanguage } from "@/core/i18n/language-context";
import { byLanguage } from "@/features/product-experience/core/localized-copy";

export function TransformationSection() {
  const { language } = useLanguage();

  const steps = [
    {
      num: "01",
      icon: Sparkles,
      title: byLanguage(language, {
        es: "VALIDA",
        en: "VALIDATE",
        pt: "VALIDAR",
      }),
      subtitle: byLanguage(language, {
        es: "¿Vale la pena construirlo? Evaluamos viabilidad, complejidad, riesgos y alternativas antes de invertir.",
        en: "Is it worth building? We assess feasibility, complexity, risks, and alternatives before investing.",
        pt: "Vale a pena construir? Avaliamos viabilidade, complexidade, riscos e alternativas antes de investir.",
      }),
      points: [
        byLanguage(language, { es: "Si realmente necesita IA", en: "Whether it really needs AI", pt: "Se realmente precisa de IA" }),
        byLanguage(language, { es: "Riesgos y datos necesarios", en: "Risks and required data", pt: "Riscos e dados necessários" }),
        byLanguage(language, { es: "Diseño inicial gratuito", en: "Free initial design", pt: "Desenho inicial gratuito" }),
      ],
    },
    {
      num: "02",
      icon: FileText,
      title: byLanguage(language, {
        es: "DISEÑA",
        en: "DESIGN",
        pt: "DESENHAR",
      }),
      subtitle: byLanguage(language, {
        es: "Define cómo debe funcionar: flujos, herramientas, memoria, reglas, intervención humana y costes.",
        en: "Define how it should work: flows, tools, memory, rules, human intervention, and costs.",
        pt: "Defina como deve funcionar: fluxos, ferramentas, memória, regras, intervenção humana e custos.",
      }),
      points: [
        byLanguage(language, { es: "Blueprint Pro como resultado", en: "Blueprint Pro as the result", pt: "Blueprint Pro como resultado" }),
        byLanguage(language, { es: "Diagramas y decisiones clave", en: "Key diagrams and decisions", pt: "Diagramas e decisões-chave" }),
        byLanguage(language, { es: "Memoria y control humano", en: "Memory and human control", pt: "Memória e controle humano" }),
      ],
    },
    {
      num: "03",
      icon: Layers,
      title: byLanguage(language, {
        es: "PREPARA",
        en: "PREPARE",
        pt: "PREPARAR",
      }),
      subtitle: byLanguage(language, {
        es: "Convierte el diseño en contratos, prompts, pruebas y especificaciones listas para implementación.",
        en: "Turn the design into contracts, prompts, tests, and specs ready for implementation.",
        pt: "Converta o desenho em contratos, prompts, testes e especificações prontas para implementação.",
      }),
      points: [
        byLanguage(language, { es: "ACP como resultado", en: "ACP as the result", pt: "ACP como resultado" }),
        byLanguage(language, { es: "Contratos JSON Schema", en: "JSON Schema contracts", pt: "Contratos JSON Schema" }),
        byLanguage(language, { es: "Prompts, guardrails y pruebas", en: "Prompts, guardrails, and tests", pt: "Prompts, guardrails e testes" }),
      ],
    },
    {
      num: "04",
      icon: Code2,
      title: byLanguage(language, {
        es: "CONSTRUYE",
        en: "BUILD",
        pt: "CONSTRUIR",
      }),
      subtitle: byLanguage(language, {
        es: "Implementa donde prefieras: tu equipo, Cursor, Claude Code, Copilot u otras herramientas.",
        en: "Implement wherever you prefer: your team, Cursor, Claude Code, Copilot, or other tools.",
        pt: "Implemente onde preferir: sua equipe, Cursor, Claude Code, Copilot ou outras ferramentas.",
      }),
      points: [
        byLanguage(language, { es: "ZIP estructurado para desarrollo", en: "Structured ZIP for development", pt: "ZIP estruturado para desenvolvimento" }),
        byLanguage(language, { es: "Menos ambigüedad técnica", en: "Less technical ambiguity", pt: "Menos ambiguidade técnica" }),
        byLanguage(language, { es: "Factory queda como opción aparte", en: "Factory stays as a separate option", pt: "Factory fica como opção separada" }),
      ],
    },
  ];

  return (
    <section id="metodologia" className="py-16 md:py-20 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
            {byLanguage(language, {
              es: "Método de decisión",
              en: "Decision method",
              pt: "Método de decisão",
            })}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-3">
            {byLanguage(language, {
              es: "De idea a agente listo para construir",
              en: "From idea to build-ready agent",
              pt: "Da ideia ao agente pronto para construir",
            })}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-3 leading-relaxed">
            {byLanguage(language, {
              es: "Antes de programar, LAB te ayuda a decidir si conviene construir, cómo debería funcionar y qué necesita tu equipo para implementarlo sin ambigüedad.",
              en: "Before coding, LAB helps you decide whether to build, how it should work, and what your team needs to implement it without ambiguity.",
              pt: "Antes de programar, o LAB ajuda você a decidir se vale construir, como deve funcionar e o que sua equipe precisa para implementar sem ambiguidade.",
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="relative rounded-2xl p-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-slate-300 dark:text-slate-800 group-hover:text-indigo-500/40 transition">
                      {step.num}
                    </span>
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                    {step.subtitle}
                  </p>
                </div>

                <ul className="text-[11px] text-slate-700 dark:text-slate-300 space-y-1.5 pt-3 border-t border-slate-200 dark:border-slate-800/80">
                  {step.points.map((p, pIdx) => (
                    <li key={pIdx} className="flex items-start gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
