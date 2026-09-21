"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Code2, FileText, Layers, Sparkles } from "lucide-react";
import { trackFunnelCtaClick } from "@/core/analytics/analytics-client";
import { useLanguage } from "@/core/i18n/language-context";
import { byLanguage } from "@/features/product-experience/core/localized-copy";

export function TransformationSection() {
  const { language } = useLanguage();

  const steps = [
    {
      num: "01",
      icon: Sparkles,
      title: byLanguage(language, { es: "VALIDA", en: "VALIDATE", pt: "VALIDAR" }),
      question: byLanguage(language, {
        es: "¿Vale la pena construirlo?",
        en: "Is it worth building?",
        pt: "Vale a pena construir?",
      }),
      description: byLanguage(language, {
        es: "Describe el proceso y recibe una evaluación inicial de viabilidad, riesgos y alternativa recomendada.",
        en: "Describe the workflow and receive an initial assessment of feasibility, risks, and the recommended alternative.",
        pt: "Descreva o processo e receba uma avaliação inicial de viabilidade, riscos e alternativa recomendada.",
      }),
      product: byLanguage(language, {
        es: "Diagnóstico gratuito",
        en: "Free diagnosis",
        pt: "Diagnóstico gratuito",
      }),
      meta: byLanguage(language, {
        es: "Sin registro · Resultado inmediato",
        en: "No sign-up · Immediate result",
        pt: "Sem cadastro · Resultado imediato",
      }),
    },
    {
      num: "02",
      icon: FileText,
      title: byLanguage(language, { es: "DISEÑA", en: "DESIGN", pt: "DESENHAR" }),
      question: byLanguage(language, {
        es: "¿Cómo debería funcionar?",
        en: "How should it work?",
        pt: "Como deveria funcionar?",
      }),
      description: byLanguage(language, {
        es: "Completa las decisiones guiadas sobre alcance, arquitectura, herramientas, memoria y valor esperado.",
        en: "Complete guided decisions about scope, architecture, tools, memory, and expected value.",
        pt: "Complete decisões guiadas sobre escopo, arquitetura, ferramentas, memória e valor esperado.",
      }),
      product: "Blueprint Free → Blueprint Pro",
      meta: byLanguage(language, {
        es: "Free: visible en LAB · Pro: completo y descargable",
        en: "Free: view in LAB · Pro: complete and downloadable",
        pt: "Free: visível no LAB · Pro: completo e disponível para download",
      }),
    },
    {
      num: "03",
      icon: Layers,
      title: byLanguage(language, { es: "PREPARA", en: "PREPARE", pt: "PREPARAR" }),
      question: byLanguage(language, {
        es: "¿Qué necesita desarrollo?",
        en: "What does development need?",
        pt: "O que o desenvolvimento precisa?",
      }),
      description: byLanguage(language, {
        es: "Resuelve gaps y transforma el diseño en contratos, prompts, workflows, pruebas y decisiones de despliegue.",
        en: "Resolve gaps and turn the design into contracts, prompts, workflows, tests, and deployment decisions.",
        pt: "Resolva gaps e transforme o desenho em contratos, prompts, workflows, testes e decisões de implantação.",
      }),
      product: "Agent Construction Package (ACP)",
      meta: byLanguage(language, {
        es: "Paquete técnico portable · No es el agente desplegado",
        en: "Portable technical package · Not the deployed agent",
        pt: "Pacote técnico portátil · Não é o agente implantado",
      }),
    },
    {
      num: "04",
      icon: Code2,
      title: byLanguage(language, { es: "CONSTRUYE", en: "BUILD", pt: "CONSTRUIR" }),
      question: byLanguage(language, {
        es: "¿Quién lo implementará?",
        en: "Who will implement it?",
        pt: "Quem vai implementar?",
      }),
      description: byLanguage(language, {
        es: "Entrega el paquete a tu equipo o úsalo con Cursor, Claude Code y otras herramientas; Factory queda como opción aparte.",
        en: "Hand the package to your team or use it with Cursor, Claude Code, and other tools; Factory remains a separate option.",
        pt: "Entregue o pacote à sua equipe ou use-o com Cursor, Claude Code e outras ferramentas; Factory continua sendo uma opção separada.",
      }),
      product: byLanguage(language, {
        es: "Equipo propio o LAB Factory",
        en: "Your team or LAB Factory",
        pt: "Sua equipe ou LAB Factory",
      }),
      meta: byLanguage(language, {
        es: "Implementación posterior al ACP",
        en: "Implementation after the ACP",
        pt: "Implementação posterior ao ACP",
      }),
    },
  ];

  return (
    <section id="metodologia" className="relative overflow-hidden bg-white py-16 dark:bg-slate-900 md:py-20">
      <div className="pointer-events-none absolute inset-x-0 top-1/2 hidden h-px bg-gradient-to-r from-transparent via-indigo-300 to-transparent dark:via-indigo-800 lg:block" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400">
            {byLanguage(language, {
              es: "Así avanza tu proyecto",
              en: "How your project moves forward",
              pt: "Como seu projeto avança",
            })}
          </span>
          <h2 className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">
            {byLanguage(language, {
              es: "De una idea incierta a un agente listo para implementar",
              en: "From an uncertain idea to an agent ready to implement",
              pt: "De uma ideia incerta a um agente pronto para implementar",
            })}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:text-base">
            {byLanguage(language, {
              es: "Cada etapa responde una pregunta distinta. Tú eliges hasta dónde avanzar y conservas el contexto creado en las etapas anteriores.",
              en: "Each stage answers a different question. You choose how far to go and keep the context created in earlier stages.",
              pt: "Cada etapa responde a uma pergunta diferente. Você escolhe até onde avançar e mantém o contexto criado nas etapas anteriores.",
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <article
                key={step.num}
                className="group relative flex min-h-[338px] flex-col rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-400 hover:shadow-xl dark:border-slate-800 dark:bg-slate-950 dark:hover:border-indigo-700"
              >
                <div className="mb-5 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold tracking-[0.2em] text-slate-400 dark:text-slate-600">
                    {step.num}
                  </span>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-200 bg-white text-indigo-600 shadow-sm dark:border-indigo-900 dark:bg-slate-900 dark:text-indigo-400">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <p className="text-xs font-black tracking-[0.18em] text-indigo-600 dark:text-indigo-400">{step.title}</p>
                <h3 className="mt-2 text-xl font-extrabold leading-tight text-slate-900 dark:text-white">{step.question}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{step.description}</p>

                <div className="mt-auto border-t border-slate-200 pt-5 dark:border-slate-800">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <div>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white">{step.product}</p>
                      <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">{step.meta}</p>
                    </div>
                  </div>
                </div>

                {idx < steps.length - 1 ? (
                  <div className="absolute -right-3 top-1/2 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-indigo-200 bg-white text-indigo-500 shadow-sm dark:border-indigo-900 dark:bg-slate-900 lg:flex">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-indigo-200 bg-indigo-50/70 px-5 py-4 dark:border-indigo-900/70 dark:bg-indigo-950/30 sm:flex-row">
          <div>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white">
              {byLanguage(language, {
                es: "Empieza validando. No necesitas elegir un producto todavía.",
                en: "Start by validating. You do not need to choose a product yet.",
                pt: "Comece validando. Você ainda não precisa escolher um produto.",
              })}
            </p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              {byLanguage(language, {
                es: "El diagnóstico se convierte en el punto de partida de tu Blueprint Free si decides continuar.",
                en: "The diagnosis becomes the starting point for your Blueprint Free if you choose to continue.",
                pt: "O diagnóstico se torna o ponto de partida do seu Blueprint Free se você decidir continuar.",
              })}
            </p>
          </div>
          <Link
            href={`/${language}#validar-idea`}
            onClick={() =>
              trackFunnelCtaClick({
                cta_location: "journey",
                cta_name: "validate_idea",
                destination: "#validar-idea",
                funnel_stage: "validate",
                language,
                product_key: "blueprint",
              })
            }
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-extrabold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500"
          >
            {byLanguage(language, { es: "Validar mi idea gratis", en: "Validate my idea free", pt: "Validar minha ideia grátis" })}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
