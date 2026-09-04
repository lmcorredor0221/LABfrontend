"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Bot, Check, CheckCircle2, FileText, Layers, ShieldCheck, Sparkles } from "lucide-react";
import { useLanguage } from "@/core/i18n/language-context";
import { byLanguage } from "@/features/product-experience/core/localized-copy";
import { LandingHeader } from "../components/landing-header";
import { LandingFooter } from "../components/landing-footer";
import { ValidateIdeaSection } from "../components/validate-idea-section";
import { BlueprintExampleViewer } from "../components/blueprint-example-viewer";

export function BlueprintLandingView() {
  const router = useRouter();
  const { language } = useLanguage();
  const [isDark, setIsDark] = useState(true);
  const [promptText, setPromptText] = useState("");

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  function handleStartBlueprint(tier: "blueprint" | "blueprint_pro" | "acp" = "blueprint") {
    router.push(`/login?redirect=/projects/new&tier=${tier}`);
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      <LandingHeader isDark={isDark} setIsDark={setIsDark} />

      <main>
        {/* HERO */}
        <section className="relative pt-16 pb-16 md:pt-24 md:pb-20 overflow-hidden text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider mb-6">
              <FileText className="h-3.5 w-3.5" />
              {byLanguage(language, { es: "Nivel Inicial $0 USD", en: "Initial Tier $0 USD", pt: "Nível Inicial $0 USD" })}
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
              {byLanguage(language, {
                es: "Blueprint Free: Valida tu idea y define el alcance antes de gastar",
                en: "Blueprint Free: Validate your idea & define scope before spending",
                pt: "Blueprint Free: Valide sua ideia e defina o escopo antes de gastar",
              })}
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
              {byLanguage(language, {
                es: "El punto de partida obligatorio. Diagnóstico inicial de viabilidad agéntica, selección de arquetipo y especificación básica sin costo.",
                en: "The mandatory starting point. Initial agentic feasibility diagnosis, archetype selection, and basic specification at zero cost.",
                pt: "O ponto de partida obrigatório. Diagnóstico inicial de viabilidade agêntica, seleção de arquétipo e especificação básica sem custo.",
              })}
            </p>
          </div>
        </section>

        {/* VALIDATOR INTERACTIVE ENGINE */}
        <ValidateIdeaSection
          promptText={promptText}
          setPromptText={setPromptText}
          onStartBlueprint={handleStartBlueprint}
          onShowToast={() => {}}
        />

        {/* REAL EXAMPLE VIEWER */}
        <section className="py-16 bg-slate-100/60 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
                {byLanguage(language, { es: "Ejemplo Real de Salida", en: "Real Output Example", pt: "Exemplo Real de Saída" })}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-3">
                {byLanguage(language, {
                  es: "Explora la estructura de un Blueprint generado por LAB",
                  en: "Explore the structure of a LAB-generated Blueprint",
                  pt: "Explore a estrutura de um Blueprint gerado pelo LAB",
                })}
              </h2>
            </div>

            <BlueprintExampleViewer mode="free" />
          </div>
        </section>

        {/* DETAILS OF WHAT IS INCLUDED */}
        <section className="py-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {byLanguage(language, {
                  es: "¿Qué obtienes exactamente con Blueprint Free?",
                  en: "What exactly do you get with Blueprint Free?",
                  pt: "O que exatamente você recebe com o Blueprint Free?",
                })}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold mb-4">
                  1
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  {byLanguage(language, { es: "Diagnóstico Lean de Viabilidad", en: "Lean Feasibility Diagnosis", pt: "Diagnóstico Lean de Viabilidade" })}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {byLanguage(language, {
                    es: "Evaluación objetiva de 5 dimensiones: ambigüedad, complejidad de datos, autonomía requerida, costo estimado y riesgos.",
                    en: "Objective 5-dimension assessment: ambiguity, data complexity, required autonomy, estimated cost, and risks.",
                    pt: "Avaliação objetiva de 5 dimensões: ambiguidade, complexidade de dados, autonomia necessária, custo estimado e riscos.",
                  })}
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold mb-4">
                  2
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  {byLanguage(language, { es: "Selección de Arquetipo Agéntico", en: "Agentic Archetype Selection", pt: "Seleção de Arquétipo Agêntico" })}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {byLanguage(language, {
                    es: "Recomendación técnica del patrón arquitectónico más eficiente (Extractor, Router, ReAct, Conciliador HITL o Supervisor).",
                    en: "Technical recommendation of the most efficient pattern (Extractor, Router, ReAct, HITL Reconciler, or Supervisor).",
                    pt: "Recomendação técnica do padrão mais eficiente (Extrator, Router, ReAct, Conciliador HITL ou Supervisor).",
                  })}
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold mb-4">
                  3
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  {byLanguage(language, { es: "Precarga Inmediata al Workspace", en: "Immediate Workspace Prefill", pt: "Pré-carregamento Imediato no Workspace" })}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {byLanguage(language, {
                    es: "Un clic para inicializar tu proyecto en la plataforma sin tener que volver a redactar la necesidad ni los requerimientos.",
                    en: "One click to initialize your project in the platform without re-typing the business requirements.",
                    pt: "Um clique para inicializar seu projeto na plataforma sem redigitar os requisitos de negócio.",
                  })}
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold mb-4">
                  4
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  {byLanguage(language, { es: "Ruta de Evolución a Pro y ACP", en: "Upgrade Path to Pro & ACP", pt: "Caminho de Evolução para Pro e ACP" })}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {byLanguage(language, {
                    es: "Cuando tu idea está clara, puedes escalar a Blueprint Pro (diagramas de flujo) o generar el paquete técnico ACP con un clic.",
                    en: "Once clear, scale to Blueprint Pro (flow diagrams) or generate the ACP technical package with one click.",
                    pt: "Quando sua ideia estiver clara, escale para Blueprint Pro ou gere o pacote técnico ACP com um clique.",
                  })}
                </p>
              </div>
            </div>

            <div className="text-center mt-12">
              <Link
                href={`/${language}/blueprint-pro`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-md transition"
              >
                <span>{byLanguage(language, { es: "Conoce Blueprint Pro y sus diagramas →", en: "Explore Blueprint Pro & diagrams →", pt: "Conheça o Blueprint Pro e seus diagramas →" })}</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
