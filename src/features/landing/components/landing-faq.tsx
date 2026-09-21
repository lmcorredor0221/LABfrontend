"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { useLanguage } from "@/core/i18n/language-context";
import { byLanguage } from "@/features/product-experience/core/localized-copy";

export function LandingFaq() {
  const { language } = useLanguage();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqList = [
    {
      q: byLanguage(language, {
        es: "¿Qué es un agente de IA para empresas?",
        en: "What is an enterprise AI agent?",
        pt: "O que é um agente de IA para empresas?",
      }),
      a: byLanguage(language, {
        es: "Es un sistema de software que entiende un objetivo de negocio, consulta herramientas (APIs, CRM, ERP, base de datos), sigue políticas deterministas y completa flujos complejos con supervisión humana cuando hace falta. En LAB definimos su arquitectura antes de programarlo.",
        en: "It is a software system that understands a business goal, calls tools (APIs, CRM, ERP, DBs), follows deterministic policies, and completes complex workflows with human oversight when needed. In LAB, we define its architecture before coding.",
        pt: "É um sistema de software que entende um objetivo de negócio, consulta ferramentas (APIs, CRM, ERP, banco de dados), segue políticas determinísticas e conclui fluxos complexos com supervisão humana quando necessário. No LAB, definimos sua arquitetura antes de programar.",
      }),
    },
    {
      q: byLanguage(language, {
        es: "¿Cuál es la diferencia entre un chatbot tradicional y un agente de IA?",
        en: "What is the difference between a traditional chatbot and an AI agent?",
        pt: "Qual é a diferença entre um chatbot tradicional e um agente de IA?",
      }),
      a: byLanguage(language, {
        es: "Un chatbot tradicional solo responde texto a preguntas frecuentes. Un agente de IA ejecuta acciones en el mundo real: lee correos, valida facturas contra el ERP, calcula montos, toma decisiones basadas en reglas y escala excepciones a una persona.",
        en: "A traditional chatbot only replies with text to FAQs. An AI agent takes actions: reads emails, matches invoices against ERP, computes totals, makes rule-based decisions, and escalates edge cases to humans.",
        pt: "Um chatbot tradicional apenas responde texto a perguntas frequentes. Um agente de IA executa ações: lê e-mails, valida faturas contra o ERP, calcula valores, toma decisões com base em regras e escala exceções a uma pessoa.",
      }),
    },
    {
      q: byLanguage(language, {
        es: "¿Qué es un Blueprint y qué recibo exactamente?",
        en: "What is a Blueprint and what do I receive exactly?",
        pt: "O que é um Blueprint e o que recebo exatamente?",
      }),
      a: byLanguage(language, {
        es: "Un Blueprint es el diseño arquitectónico y estratégico de tu agente. Con Free completas seis decisiones guiadas y obtienes dentro de LAB una vista protegida del problema, alcance, arquitectura, herramientas, memoria y estimación. Pro profundiza ese mismo diseño, añade diagramas y documentación profesional, y habilita su descarga.",
        en: "A Blueprint is the architectural and strategic design of your agent. With Free, you complete six guided decisions and receive a protected view in LAB covering the problem, scope, architecture, tools, memory, and estimate. Pro deepens that same design, adds professional diagrams and documentation, and enables download.",
        pt: "Um Blueprint é o desenho arquitetônico e estratégico do seu agente. Com o Free, você completa seis decisões guiadas e recebe no LAB uma visualização protegida do problema, escopo, arquitetura, ferramentas, memória e estimativa. O Pro aprofunda o mesmo desenho, adiciona diagramas e documentação profissional e habilita o download.",
      }),
    },
    {
      q: byLanguage(language, {
        es: "¿Qué es el Agent Construction Package (ACP)?",
        en: "What is the Agent Construction Package (ACP)?",
        pt: "O que é o Agent Construction Package (ACP)?",
      }),
      a: byLanguage(language, {
        es: "Es el paquete técnico portable que convierte un Blueprint aprobado en contratos, prompts, workflows, pruebas, gaps y decisiones de despliegue para entregarlo a desarrollo. Puede utilizarse con un equipo propio o herramientas como Cursor y Claude Code; no incluye el agente terminado ni su despliegue final.",
        en: "It is the portable technical package that turns an approved Blueprint into contracts, prompts, workflows, tests, gaps, and deployment decisions for a development handoff. It can be used with your own team or tools such as Cursor and Claude Code; it does not include the finished agent or final deployment.",
        pt: "É o pacote técnico portátil que transforma um Blueprint aprovado em contratos, prompts, workflows, testes, gaps e decisões de implantação para entrega ao desenvolvimento. Pode ser usado com sua equipe ou ferramentas como Cursor e Claude Code; não inclui o agente finalizado nem a implantação final.",
      }),
    },
    {
      q: byLanguage(language, {
        es: "¿Puedo implementar el agente con mi propio equipo de desarrollo?",
        en: "Can I implement the agent with my own development team?",
        pt: "Posso implementar o agente com minha própria equipe de desenvolvimento?",
      }),
      a: byLanguage(language, {
        es: "Sí, absolutamente. Tanto el Blueprint como el ACP están diseñados para ser agnósticos a la infraestructura (LangGraph, CrewAI, AutoGen, scripts en Python o TypeScript). Tu equipo recibe especificaciones exactas sin ambigüedades.",
        en: "Yes, absolutely. Both Blueprint and ACP are designed to be infrastructure-agnostic (LangGraph, CrewAI, AutoGen, Python or TypeScript scripts). Your team receives exact specifications without ambiguity.",
        pt: "Sim, com certeza. Tanto o Blueprint quanto o ACP são agnósticos à infraestrutura (LangGraph, CrewAI, AutoGen, scripts Python ou TypeScript). Sua equipe recebe especificações exatas sem ambiguidade.",
      }),
    },
    {
      q: byLanguage(language, {
        es: "¿Qué pasa si mi caso no es apto para un agente de IA?",
        en: "What happens if my use case is not suitable for an AI agent?",
        pt: "O que acontece se meu caso não for adequado para um agente de IA?",
      }),
      a: byLanguage(language, {
        es: "Nuestro diagnóstico gratuito te lo dirá con total honestidad. Si una automatización determinista (RPA, webhook o script tradicional) es más barata y segura para tu necesidad, te recomendaremos esa alternativa sin hacerte gastar dinero innecesario en IA.",
        en: "Our free diagnosis will tell you honestly. If a deterministic automation (RPA, webhook, or traditional script) is cheaper and safer for your need, we recommend that alternative without wasting money on AI.",
        pt: "Nosso diagnóstico gratuito informará com total honestidade. Se uma automação determinística (RPA, webhook ou script tradicional) for mais barata e segura, recomendaremos essa alternativa sem gastos desnecessários.",
      }),
    },
  ];

  return (
    <section id="faq" className="py-16 md:py-20 bg-slate-100/70 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
            {byLanguage(language, { es: "Resolviendo Dudas", en: "Answering Questions", pt: "Tirando Dúvidas" })}
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-3">
            {byLanguage(language, { es: "Preguntas Frecuentes", en: "Frequently Asked Questions", pt: "Perguntas Frequentes" })}
          </h2>
        </div>

        <div className="space-y-3">
          {faqList.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 overflow-hidden transition-all shadow-2xs"
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${openFaq === idx ? "rotate-180 text-indigo-500" : ""}`}
                />
              </button>

              {openFaq === idx ? (
                <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 animate-fade-in">
                  {faq.a}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
