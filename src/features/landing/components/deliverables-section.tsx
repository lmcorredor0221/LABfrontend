"use client";

import Link from "next/link";
import { ArrowRight, Check, Download, Eye, PackageCheck } from "lucide-react";
import { trackFunnelCtaClick } from "@/core/analytics/analytics-client";
import { useLanguage } from "@/core/i18n/language-context";
import { byLanguage } from "@/features/product-experience/core/localized-copy";

export function DeliverablesSection() {
  const { language } = useLanguage();

  const products = [
    {
      label: "Blueprint Free",
      eyebrow: byLanguage(language, { es: "DISEÑO INICIAL", en: "INITIAL DESIGN", pt: "DESENHO INICIAL" }),
      icon: Eye,
      tone: "indigo",
      description: byLanguage(language, {
        es: "Convierte el diagnóstico en un proyecto y completa seis decisiones guiadas para obtener una primera versión coherente del agente.",
        en: "Turn the diagnosis into a project and complete six guided decisions to obtain a coherent first version of the agent.",
        pt: "Transforme o diagnóstico em um projeto e complete seis decisões guiadas para obter uma primeira versão coerente do agente.",
      }),
      items: [
        byLanguage(language, { es: "Problema, alcance y requerimientos", en: "Problem, scope, and requirements", pt: "Problema, escopo e requisitos" }),
        byLanguage(language, { es: "Arquitectura, herramientas y memoria", en: "Architecture, tools, and memory", pt: "Arquitetura, ferramentas e memória" }),
        byLanguage(language, { es: "Estimación de valor, costo y riesgos", en: "Value, cost, and risk estimate", pt: "Estimativa de valor, custo e riscos" }),
      ],
      access: byLanguage(language, {
        es: "$0 · Visible y protegido dentro de LAB",
        en: "$0 · View-only and protected inside LAB",
        pt: "$0 · Visível e protegido dentro do LAB",
      }),
      href: `/${language}/blueprint`,
      cta: byLanguage(language, { es: "Ver cómo funciona Free", en: "See how Free works", pt: "Ver como o Free funciona" }),
    },
    {
      label: "Blueprint Pro",
      eyebrow: byLanguage(language, { es: "DISEÑO PROFESIONAL", en: "PROFESSIONAL DESIGN", pt: "DESENHO PROFISSIONAL" }),
      icon: Download,
      tone: "blue",
      description: byLanguage(language, {
        es: "Profundiza y formaliza el mismo diseño con diagramas, contratos, gobernanza y documentación preparada para compartir.",
        en: "Deepen and formalize the same design with diagrams, contracts, governance, and documentation ready to share.",
        pt: "Aprofunde e formalize o mesmo desenho com diagramas, contratos, governança e documentação pronta para compartilhar.",
      }),
      items: [
        byLanguage(language, { es: "Diagramas de arquitectura y comportamiento", en: "Architecture and behavior diagrams", pt: "Diagramas de arquitetura e comportamento" }),
        byLanguage(language, { es: "Estrategias de tools, memoria, RAG y HITL", en: "Tools, memory, RAG, and HITL strategies", pt: "Estratégias de tools, memória, RAG e HITL" }),
        byLanguage(language, { es: "Documento profesional y estimación de ROI", en: "Professional document and ROI estimate", pt: "Documento profissional e estimativa de ROI" }),
      ],
      access: byLanguage(language, {
        es: "Pago único · ZIP profesional descargable",
        en: "One-time payment · Downloadable professional ZIP",
        pt: "Pagamento único · ZIP profissional para download",
      }),
      href: `/${language}/blueprint-pro`,
      cta: byLanguage(language, { es: "Explorar Blueprint Pro", en: "Explore Blueprint Pro", pt: "Explorar Blueprint Pro" }),
    },
    {
      label: "ACP",
      eyebrow: byLanguage(language, { es: "PREPARACIÓN TÉCNICA", en: "TECHNICAL PREPARATION", pt: "PREPARAÇÃO TÉCNICA" }),
      icon: PackageCheck,
      tone: "emerald",
      description: byLanguage(language, {
        es: "Convierte el diseño aprobado en el paquete de especificaciones que necesita el equipo responsable de implementarlo.",
        en: "Turn the approved design into the specification package needed by the team responsible for implementing it.",
        pt: "Transforme o desenho aprovado no pacote de especificações necessário para a equipe responsável pela implementação.",
      }),
      items: [
        byLanguage(language, { es: "Contratos, prompts y workflows portables", en: "Portable contracts, prompts, and workflows", pt: "Contratos, prompts e workflows portáteis" }),
        byLanguage(language, { es: "Pruebas, simulaciones y registro de gaps", en: "Tests, simulations, and gap register", pt: "Testes, simulações e registro de gaps" }),
        byLanguage(language, { es: "Readiness, despliegue y launcher", en: "Readiness, deployment, and launcher", pt: "Readiness, implantação e launcher" }),
      ],
      access: byLanguage(language, {
        es: "Pago único · Paquete técnico portable · No incluye despliegue",
        en: "One-time payment · Portable technical package · Deployment not included",
        pt: "Pagamento único · Pacote técnico portátil · Implantação não incluída",
      }),
      href: `/${language}/acp`,
      cta: byLanguage(language, { es: "Explorar el ACP", en: "Explore the ACP", pt: "Explorar o ACP" }),
    },
  ] as const;

  return (
    <section id="artefactos" className="border-y border-slate-200 bg-slate-50 py-16 dark:border-slate-800 dark:bg-slate-950 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400">
            {byLanguage(language, { es: "Qué recibes en cada nivel", en: "What you receive at each level", pt: "O que você recebe em cada nível" })}
          </span>
          <h2 className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">
            {byLanguage(language, {
              es: "El mismo proyecto gana profundidad sin perder contexto",
              en: "The same project gains depth without losing context",
              pt: "O mesmo projeto ganha profundidade sem perder contexto",
            })}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:text-base">
            {byLanguage(language, {
              es: "Free demuestra el diseño, Pro lo convierte en un entregable profesional y ACP lo prepara para implementación. Cada nivel conserva lo construido anteriormente.",
              en: "Free demonstrates the design, Pro turns it into a professional deliverable, and ACP prepares it for implementation. Each level preserves what was built before.",
              pt: "O Free demonstra o desenho, o Pro o transforma em um entregável profissional e o ACP o prepara para implementação. Cada nível preserva o que foi construído antes.",
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {products.map((product, index) => {
            const Icon = product.icon;
            const accent =
              product.tone === "emerald"
                ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300"
                : product.tone === "blue"
                  ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300"
                  : "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-300";

            return (
              <article
                key={product.label}
                className="relative flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7"
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-black tracking-[0.18em] text-slate-500 dark:text-slate-400">{product.eyebrow}</p>
                    <h3 className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{product.label}</h3>
                  </div>
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${accent}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">{product.description}</p>

                <ul className="my-6 space-y-3 text-sm text-slate-700 dark:text-slate-300">
                  {product.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  <p className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold leading-5 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                    {product.access}
                  </p>
                  <Link
                    href={product.href}
                    onClick={() => {
                      const productKey = product.label === "Blueprint Free" ? "blueprint" : product.label === "Blueprint Pro" ? "blueprint_pro" : "acp";
                      trackFunnelCtaClick({
                        cta_location: "deliverables",
                        cta_name: "explore_product",
                        destination: product.href,
                        funnel_stage: productKey === "acp" ? "prepare" : "design",
                        language,
                        product_key: productKey,
                      });
                    }}
                    className="inline-flex items-center gap-2 text-xs font-extrabold text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-400"
                  >
                    {product.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                {index < products.length - 1 ? (
                  <div className="absolute -bottom-4 left-1/2 z-10 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-indigo-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:-right-7 lg:bottom-auto lg:left-auto lg:top-1/2 lg:-translate-y-1/2 lg:translate-x-0">
                    <ArrowRight className="h-4 w-4 rotate-90 lg:rotate-0" />
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
