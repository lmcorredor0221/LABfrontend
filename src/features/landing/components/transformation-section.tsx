"use client";

import { ArrowRight, Bot, CheckCircle2, Code2, Cpu, FileText, Layers, ShieldCheck, Sparkles } from "lucide-react";
import { useLanguage } from "@/core/i18n/language-context";
import { byLanguage } from "@/features/product-experience/core/localized-copy";

export function TransformationSection() {
  const { language } = useLanguage();

  const steps = [
    {
      num: "01",
      icon: Sparkles,
      title: byLanguage(language, {
        es: "Validación y Diagnóstico",
        en: "Validation & Diagnosis",
        pt: "Validação e Diagnóstico",
      }),
      subtitle: byLanguage(language, {
        es: "Evaluamos viabilidad técnica, retorno de inversión y si una automatización simple basta.",
        en: "We evaluate technical feasibility, ROI, and whether a simple deterministic automation is enough.",
        pt: "Avaliamos viabilidade técnica, ROI e se uma automação determinística é suficiente.",
      }),
      points: [
        byLanguage(language, { es: "Descarte de hype innecesario", en: "No unnecessary AI hype", pt: "Sem hype desnecessário de IA" }),
        byLanguage(language, { es: "Identificación de fuentes de datos", en: "Data sources identification", pt: "Identificação de fontes de dados" }),
        byLanguage(language, { es: "Cálculo de complejidad de tokens", en: "Token complexity estimation", pt: "Estimativa de complexidade de tokens" }),
      ],
    },
    {
      num: "02",
      icon: FileText,
      title: byLanguage(language, {
        es: "Diseño del Blueprint",
        en: "Blueprint Architecture",
        pt: "Arquitetura do Blueprint",
      }),
      subtitle: byLanguage(language, {
        es: "Estructuramos el plano estratégico: arquetipos, dependencias, roles y disparadores humanos.",
        en: "We structure the strategic blueprint: archetypes, dependencies, roles, and human triggers.",
        pt: "Estruturamos a planta estratégica: arquétipos, dependências, papéis e gatilhos humanos.",
      }),
      points: [
        byLanguage(language, { es: "Diagramas de flujo navegables", en: "Navigable flow diagrams", pt: "Diagramas de fluxo navegáveis" }),
        byLanguage(language, { es: "Puntos de control Human-in-the-Loop", en: "Human-in-the-Loop checkpoints", pt: "Pontos de controle Human-in-the-Loop" }),
        byLanguage(language, { es: "Estrategia de memoria y contexto", en: "Memory & context strategy", pt: "Estratégia de memória e contexto" }),
      ],
    },
    {
      num: "03",
      icon: Layers,
      title: byLanguage(language, {
        es: "Paquete Técnico (ACP)",
        en: "Technical Package (ACP)",
        pt: "Pacote Técnico (ACP)",
      }),
      subtitle: byLanguage(language, {
        es: "Generamos el Agent Construction Package: especificaciones formales y contratos de herramientas.",
        en: "We generate the Agent Construction Package: formal specs and tool schema contracts.",
        pt: "Geramos o Agent Construction Package: especificações formais e contratos de ferramentas.",
      }),
      points: [
        byLanguage(language, { es: "Tool contracts en JSON Schema", en: "Tool contracts in JSON Schema", pt: "Contratos de ferramentas em JSON Schema" }),
        byLanguage(language, { es: "Prompts versionados y guardrails", en: "Versioned prompts & guardrails", pt: "Prompts versionados e guardrails" }),
        byLanguage(language, { es: "Datasets sintéticos de prueba", en: "Synthetic test datasets", pt: "Datasets sintéticos de teste" }),
      ],
    },
    {
      num: "04",
      icon: Code2,
      title: byLanguage(language, {
        es: "Implementación Ágil",
        en: "Agile Implementation",
        pt: "Implementação Ágil",
      }),
      subtitle: byLanguage(language, {
        es: "Entrega un ZIP estructurado a tu equipo o a herramientas de IA para construir sin fricción.",
        en: "Hand over a structured ZIP to your dev team or AI coding tools to build without ambiguity.",
        pt: "Entregue um ZIP estruturado à sua equipe ou ferramentas de IA para construir sem atrito.",
      }),
      points: [
        byLanguage(language, { es: "Listo para Cursor / Claude Code", en: "Ready for Cursor / Claude Code", pt: "Pronto para Cursor / Claude Code" }),
        byLanguage(language, { es: "0% de tiempo perdido en rediseños", en: "0% wasted time on redesigns", pt: "0% de tempo perdido em retrabalho" }),
        byLanguage(language, { es: "Opción de construcción delegada en LAB Factory", en: "Delegated build option in LAB Factory", pt: "Opção de construção delegada no LAB Factory" }),
      ],
    },
  ];

  return (
    <section id="metodologia" className="py-16 md:py-20 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
            {byLanguage(language, {
              es: "Metodología Lean Agéntica",
              en: "Lean Agentic Methodology",
              pt: "Metodologia Lean Agêntica",
            })}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-3">
            {byLanguage(language, {
              es: "Cómo LAB transforma tu idea en un sistema real",
              en: "How LAB transforms your idea into a real system",
              pt: "Como o LAB transforma sua ideia em um sistema real",
            })}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-3 leading-relaxed">
            {byLanguage(language, {
              es: "El 80% de los proyectos de IA fallan por empezar programando sin arquitectura. LAB te lleva paso a paso desde el problema de negocio hasta el paquete de construcción.",
              en: "80% of AI agent projects fail due to coding without architecture. LAB guides you step by step from business problem to build package.",
              pt: "80% dos projetos de IA falham por começar a programar sem arquitetura. O LAB guia você passo a passo do problema de negócio ao pacote de construção.",
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
