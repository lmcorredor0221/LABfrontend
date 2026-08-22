"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
  Calculator,
  Check,
  CheckCircle2,
  ChevronDown,
  Code2,
  FileCode2,
  FileText,
  Layers,
  Lightbulb,
  Moon,
  Play,
  RotateCcw,
  Shield,
  ShieldAlert,
  Sparkles,
  Sun,
  UserCheck,
  Users,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { useAuth } from "@/core/auth/auth-context";
import { useCurrency } from "@/core/commerce/currency-context";
import { useLanguage } from "@/core/i18n/language-context";
import { buildLocalizedLandingPath, LANDING_LANGUAGES } from "@/core/seo/site";
import { byLanguage } from "@/features/product-experience/core/localized-copy";
import { cn } from "@/lib/utils";
import {
  evaluateInitiativeApi,
  type InitiativeEvaluationResponse,
} from "./initiative-evaluator-contracts";

type ScaleSize = "S" | "M" | "L" | "XL";

interface ToastMessage {
  id: number;
  message: string;
  type: "indigo" | "emerald" | "amber";
}

export function LabLandingPage() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { currency, setCurrency, formatPrice } = useCurrency();
  const { language, setLanguage } = useLanguage();
  const toastIdRef = useRef(0);

  // Dark / Light Theme
  const [isDark, setIsDark] = useState(true);

  // Modals
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalPlanData, setModalPlanData] = useState<{ title: string; price: number; usdPrice: number } | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Impact Calculator
  const [calcScale, setCalcScale] = useState<ScaleSize>("M");

  // FAQ Accordion
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Interactive Simulator / Evaluator State
  const [promptText, setPromptText] = useState("");
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalResult, setEvalResult] = useState<InitiativeEvaluationResponse | null>(null);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [evalStep, setEvalStep] = useState(0);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  function showToast(message: string, type: "indigo" | "emerald" | "amber" = "indigo") {
    toastIdRef.current += 1;
    const id = toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }

  // Quick prompt examples
  const examplePrompts = [
    {
      id: 1,
      icon: "📄",
      label: byLanguage(language, {
        es: '"6 personas revisando facturas a mano..."',
        en: '"6 people reviewing invoices by hand..."',
        pt: '"6 pessoas revisando faturas manualmente..."',
      }),
      text: byLanguage(language, {
        es: "Tenemos 6 personas revisando facturas en PDF y validándolas contra órdenes de compra registradas en el ERP. Queremos reducir el tiempo manual sin perder control de aprobación.",
        en: "We have 6 people reviewing PDF invoices and validating them against purchase orders in ERP. We want to reduce manual time without losing approval control.",
        pt: "Temos 6 pessoas revisando faturas em PDF e validando contra pedidos de compra no ERP. Queremos reduzir o tempo manual sem perder o controle de aprovação.",
      }),
    },
    {
      id: 2,
      icon: "💬",
      label: byLanguage(language, {
        es: '"Responder dudas repetitivas de clientes..."',
        en: '"Answering repetitive customer questions..."',
        pt: '"Respondendo dúvidas repetitivas de clientes..."',
      }),
      text: byLanguage(language, {
        es: "Quiero automatizar el soporte de clientes consultando el estado de pedidos en la API de Shopify y escalando casos complejos con inconsistencias a Zendesk.",
        en: "I want to automate customer support by checking order status in Shopify API and escalating complex cases with inconsistencies to Zendesk.",
        pt: "Quero automatizar o suporte ao cliente consultando o status de pedidos na API da Shopify e escalando casos complexos com inconsistências para o Zendesk.",
      }),
    },
    {
      id: 3,
      icon: "📋",
      label: byLanguage(language, {
        es: '"Leer PDF largos y sacar los datos clave..."',
        en: '"Reading long PDFs and extracting key data..."',
        pt: '"Lendo PDFs longos e extraindo dados-chave..."',
      }),
      text: byLanguage(language, {
        es: "Necesitamos analizar documentos legales y solicitudes de crédito comparando condiciones contra políticas internas, solicitando aprobación humana cuando existan inconsistencias.",
        en: "We need to analyze legal documents and credit applications comparing conditions against internal policies, requesting human approval when inconsistencies exist.",
        pt: "Precisamos analisar documentos legais e solicitações de crédito comparando condições com políticas internas, solicitando aprovação humana quando houver inconsistências.",
      }),
    },
  ];

  const impactData: Record<ScaleSize, { trad: string; lab: string; sav: string }> = {
    S: { trad: "120 – 160 h", lab: "60 – 90 h", sav: "35% – 50%" },
    M: { trad: "280 – 360 h", lab: "140 – 210 h", sav: "30% – 50%" },
    L: { trad: "600 – 850 h", lab: "320 – 480 h", sav: "35% – 48%" },
    XL: { trad: "1,200 – 1,800 h", lab: "650 – 1,000 h", sav: "35% – 45%" },
  };

  async function handleRunAnalysis() {
    if (!promptText.trim() || promptText.trim().length < 5) {
      showToast(
        byLanguage(language, {
          es: "Por favor describe tu necesidad de negocio primero.",
          en: "Please describe your business need first.",
          pt: "Por favor, descreva sua necessidade de negócio primeiro.",
        }),
        "amber",
      );
      return;
    }

    setEvalLoading(true);
    setEvalError(null);
    setEvalResult(null);
    setEvalStep(1);

    const stepTimer1 = setTimeout(() => setEvalStep(2), 350);
    const stepTimer2 = setTimeout(() => setEvalStep(3), 750);
    const stepTimer3 = setTimeout(() => setEvalStep(4), 1150);

    try {
      const evaluation = await evaluateInitiativeApi({
        initiative_text: promptText,
        language: language as "es" | "en" | "pt",
      });
      setEvalResult(evaluation);
      showToast(
        byLanguage(language, {
          es: "Análisis Lean completado con éxito ($0 USD)",
          en: "Lean analysis completed successfully ($0 USD)",
          pt: "Análise Lean concluída com sucesso ($0 USD)",
        }),
        "emerald",
      );
    } catch (err) {
      setEvalError(err instanceof Error ? err.message : "Error evaluando caso");
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      setEvalLoading(false);
    }
  }

  function handleStartBlueprint(tier: "blueprint" | "blueprint_pro" | "acp" = "blueprint") {
    if (evalResult?.prefilled_project_data) {
      if (typeof window !== "undefined") {
        try {
          window.sessionStorage.setItem(
            "pending_initiative_prefill",
            JSON.stringify(evalResult.prefilled_project_data),
          );
          window.localStorage.setItem(
            "pending_initiative_prefill",
            JSON.stringify(evalResult.prefilled_project_data),
          );
        } catch {
          // ignore storage errors
        }
      }
    }

    if (user) {
      router.push("/projects/new");
    } else {
      router.push(`/login?redirect=/projects/new&tier=${tier}`);
    }
  }

  function openPurchase(planName: string, usdPrice: number) {
    setModalPlanData({
      title: planName,
      price: currency === "COP" ? Math.round(usdPrice * 3170) : usdPrice,
      usdPrice,
    });
    setActiveModal("purchase");
  }

  const faqList = [
    {
      q: byLanguage(language, {
        es: "¿Necesito saber de agentes de IA para usar LAB?",
        en: "Do I need to know about AI agents to use LAB?",
        pt: "Preciso saber sobre agentes de IA para usar o LAB?",
      }),
      a: byLanguage(language, {
        es: "No. LAB está diseñado con metodología Lean para guiarte en lenguaje natural. Únicamente debes describir el problema o necesidad de tu negocio, y la plataforma se encarga de traducirlo progresivamente a especificaciones de arquitectura.",
        en: "No. LAB is designed with Lean methodology to guide you in natural language. You only describe your business need, and the platform translates it progressively into engineering specifications.",
        pt: "Não. O LAB foi desenvolvido com metodologia Lean para guiá-lo em linguagem natural. Você só precisa descrever o problema do seu negócio e a plataforma traduz para especificações de engenharia.",
      }),
    },
    {
      q: byLanguage(language, {
        es: "¿LAB construye el agente automáticamente?",
        en: "Does LAB build the agent automatically?",
        pt: "O LAB constrói o agente automaticamente?",
      }),
      a: byLanguage(language, {
        es: "No. LAB es una plataforma de descubrimiento y arquitectura agéntica. LAB genera el paquete de especificación estructurada (ACP) para que la programación posterior (ya sea mediante tu equipo o con herramientas como Codex, Claude Code o Cursor) se ejecute con contexto completo y sin ambigüedades. Si no tienes equipo técnico, puedes contratar la construcción a través de nuestra LAB Factory B2B.",
        en: "No. LAB is a discovery and agentic architecture platform. LAB produces the structured specification package (ACP) so that subsequent coding (with your team or AI assistants like Codex, Claude Code, or Cursor) proceeds with zero ambiguity. If you lack technical engineers, you can delegate build via LAB Factory B2B.",
        pt: "Não. O LAB é uma plataforma de descoberta e arquitetura agêntica. Gera o pacote estruturado (ACP) para que a programação (por sua equipe ou com Codex, Claude Code, Cursor) ocorra sem ambiguidades. Se não tiver equipe, você pode contratar a construção via LAB Factory B2B.",
      }),
    },
    {
      q: byLanguage(language, {
        es: "¿Qué diferencia existe entre Blueprint y ACP?",
        en: "What is the difference between Blueprint and ACP?",
        pt: "Qual a diferença entre Blueprint e ACP?",
      }),
      a: byLanguage(language, {
        es: "El Blueprint ($49 USD) es un documento técnico-funcional completo para toma de decisiones y entendimiento del proyecto. El ACP ($149 USD) incluye todo el Blueprint MÁS el paquete estructurado de archivos (JSON, schemas, prompts y máquinas de estados) listo para ser consumido directamente por herramientas de desarrollo agéntico.",
        en: "The Blueprint ($49 USD) is a comprehensive technical-functional document for decision-making. The ACP ($149 USD) includes the entire Blueprint PLUS the structured file package (JSON, schemas, prompts, state machines) ready for agentic IDEs.",
        pt: "O Blueprint ($49 USD) é um documento técnico-funcional completo. O ACP ($149 USD) inclui todo o Blueprint MAIS o pacote estruturado de arquivos (JSON, schemas, prompts, máquinas de estados) pronto para ferramentas agênticas.",
      }),
    },
    {
      q: byLanguage(language, {
        es: "¿Qué recibe exactamente mi equipo al adquirir el ACP?",
        en: "What exactly does my team receive with the ACP?",
        pt: "O que exatamente minha equipe recebe com o ACP?",
      }),
      a: byLanguage(language, {
        es: "Reciben un paquete comprimido con el contexto estructurado del agente, mapa de decisiones, máquinas de estado, especificación de conectores, estrategias de memoria, casos de prueba y las instrucciones paso a paso para iniciar la construcción en Codex, Claude Code, Cursor o código tradicional.",
        en: "They receive a compressed package with structured agent context, decision maps, state machines, connector specifications, memory strategies, test cases, and step-by-step build guides for Codex, Claude Code, Cursor, or traditional code.",
        pt: "Recebem um pacote compactado com contexto estruturado, mapas de decisão, máquinas de estado, especificações de conectores, memória, casos de teste e guia passo a passo.",
      }),
    },
    {
      q: byLanguage(language, {
        es: "¿El ACP funciona con Codex, Claude Code y Cursor?",
        en: "Does the ACP work with Codex, Claude Code, and Cursor?",
        pt: "O ACP funciona com Codex, Claude Code e Cursor?",
      }),
      a: byLanguage(language, {
        es: "Sí. Los formatos del ACP están estandarizados para ser leídos de forma óptima por entornos de programación agéntica y LLMs avanzados, evitando alucinaciones de código y garantizando que el asistente comprenda la arquitectura completa.",
        en: "Yes. ACP formats are standardized for optimal ingestion by agentic developer environments and advanced LLMs, preventing code hallucinations and ensuring full architectural alignment.",
        pt: "Sim. Os formatos do ACP são padronizados para leitura ideal por ambientes de programação agêntica e LLMs avançados, evitando alucinações de código.",
      }),
    },
    {
      q: byLanguage(language, {
        es: "¿LAB desarrolla las APIs o herramientas faltantes?",
        en: "Does LAB develop missing APIs or tools?",
        pt: "O LAB desenvolve as APIs ou ferramentas faltantes?",
      }),
      a: byLanguage(language, {
        es: "En las versiones de autoservicio (Blueprint y ACP), LAB define las especificaciones técnicas y contratos de interfaz mínimos requeridos. Si tu organización necesita que alguien programe esas APIs o conectores, nuestra línea LAB Factory B2B puede cotizar y construir esos componentes.",
        en: "In self-service tiers (Blueprint & ACP), LAB defines technical specifications and interface contracts. If your team needs custom connector or API implementation, LAB Factory B2B can quote and build them.",
        pt: "Nas versões de autosserviço (Blueprint e ACP), o LAB define especificações e contratos. Se precisar de desenvolvimento dessas APIs, nossa linha LAB Factory B2B pode cotar e construir.",
      }),
    },
    {
      q: byLanguage(language, {
        es: "¿Qué ocurre si ya tengo APIs o integraciones existentes?",
        en: "What if I have existing APIs or integrations?",
        pt: "O que acontece se eu já tiver APIs ou integrações existentes?",
      }),
      a: byLanguage(language, {
        es: "Excelente. LAB incorpora esas especificaciones preexistentes en el modelo de arquitectura, diseñando el flujo del agente alrededor de las herramientas con las que tu empresa ya cuenta.",
        en: "Great. LAB incorporates those pre-existing specifications into the architecture model, designing the agent workflow around tools your company already uses.",
        pt: "Excelente. O LAB incorpora essas especificações preexistentes ao modelo de arquitetura, projetando o fluxo do agente em torno das ferramentas que sua empresa já possui.",
      }),
    },
    {
      q: byLanguage(language, {
        es: "¿MCP (Model Context Protocol) es obligatorio?",
        en: "Is MCP (Model Context Protocol) mandatory?",
        pt: "O MCP (Model Context Protocol) é obrigatório?",
      }),
      a: byLanguage(language, {
        es: "No. MCP es una alternativa moderna de conexión entre agentes y herramientas. LAB evalúa el canal de integración más adecuado (REST, Webhooks, SQL, SDKs o MCP) dependiendo de la infraestructura de tu proyecto.",
        en: "No. MCP is a modern integration protocol. LAB evaluates the most appropriate connectivity channel (REST, Webhooks, SQL, SDKs, or MCP) based on your system infrastructure.",
        pt: "Não. O MCP é um protocolo moderno de conexão. O LAB avalia o canal mais adequado (REST, Webhooks, SQL, SDKs ou MCP) conforme sua infraestrutura.",
      }),
    },
    {
      q: byLanguage(language, {
        es: "¿Qué pasa si compro Blueprint y después quiero ACP?",
        en: "What if I buy Blueprint and later want ACP?",
        pt: "E se eu comprar o Blueprint e depois quiser o ACP?",
      }),
      a: byLanguage(language, {
        es: "Reconocemos tu pago de $49 USD. Al hacer upgrade al ACP desde tu panel, abonarás únicamente los +$109 USD de diferencia.",
        en: "We credit your $49 USD payment. When upgrading to ACP from your dashboard, you only pay the +$109 USD difference.",
        pt: "Reconhecemos seu pagamento de $49 USD. Ao fazer upgrade para ACP, você paga apenas a diferença de +$109 USD.",
      }),
    },
    {
      q: byLanguage(language, {
        es: "¿Cómo funciona LAB Builder para agencias y freelancers?",
        en: "How does LAB Builder work for agencies and freelancers?",
        pt: "Como funciona o LAB Builder para agências e freelancers?",
      }),
      a: byLanguage(language, {
        es: "LAB Builder ($89/mes) te otorga un espacio de trabajo recurrente que incluye 3 Blueprints y 1 ACP al mes, ideal para profesionales que estructuran agentes para clientes de forma constante.",
        en: "LAB Builder ($89/mo) gives you a recurring workspace including 3 Blueprints and 1 ACP each month, ideal for professionals structuring agents for clients.",
        pt: "O LAB Builder ($89/mês) oferece um workspace recorrente com 3 Blueprints e 1 ACP por mês para agências e freelancers.",
      }),
    },
    {
      q: byLanguage(language, {
        es: "¿Qué ocurre si no tengo equipo técnico?",
        en: "What happens if I don't have a technical team?",
        pt: "O que acontece se eu não tiver equipe técnica?",
      }),
      a: byLanguage(language, {
        es: "No hay problema. Puedes utilizar LAB para validar y diseñar el agente y posteriormente seleccionar el servicio de LAB Factory, donde nuestros ingenieros asumen el desarrollo completo a la medida.",
        en: "No problem. You can use LAB to validate and architect the agent, then delegate full custom development to our senior engineers via LAB Factory.",
        pt: "Sem problemas. Você pode usar o LAB para validar e projetar o agente e depois selecionar o serviço da LAB Factory para desenvolvimento sob medida.",
      }),
    },
  ];

  function handleLanguageNavigation(nextLanguage: "es" | "en" | "pt") {
    setLanguage(nextLanguage);

    const targetPath = buildLocalizedLandingPath(nextLanguage);
    if (pathname !== targetPath) {
      router.push(targetPath);
    }
  }

  return (
    <div className={cn("min-h-screen transition-colors duration-300", isDark ? "dark bg-[#0B0F17] text-slate-200" : "bg-slate-50 text-slate-800")}>
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border text-xs font-semibold shadow-2xl flex items-center gap-3 transition-all pointer-events-auto",
              toast.type === "emerald"
                ? "border-emerald-500/50 text-emerald-700 dark:text-emerald-300"
                : toast.type === "amber"
                ? "border-amber-500/50 text-amber-700 dark:text-amber-300"
                : "border-indigo-500/50 text-indigo-700 dark:text-indigo-300",
            )}
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* NAVBAR */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/85 dark:bg-[#131b2e]/80 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={buildLocalizedLandingPath(language)} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
                <Layers className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  LAB<span className="text-indigo-600 dark:text-indigo-400">.ai</span>
                </span>
                <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400 tracking-wider">
                  {byLanguage(language, {
                    es: "Diseño de Asistentes IA",
                    en: "AI Assistant Design",
                    pt: "Design de Assistentes IA",
                  })}
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#simulador" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              {byLanguage(language, { es: "Validar mi idea", en: "Validate my idea", pt: "Validar minha ideia" })}
            </a>
            <a href="#metodologia" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              {byLanguage(language, { es: "Cómo funciona", en: "How it works", pt: "Como funciona" })}
            </a>
            <a href="#artefactos" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              {byLanguage(language, { es: "Qué entregamos", en: "What we deliver", pt: "O que entregamos" })}
            </a>
            <a href="#estimador" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              {byLanguage(language, { es: "Ahorro de Tiempo", en: "Time Savings", pt: "Economia de Tempo" })}
            </a>
            <a href="#precios" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              {byLanguage(language, { es: "Planes", en: "Plans", pt: "Planos" })}
            </a>
            <a href="#factory" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              {byLanguage(language, { es: "Servicio Completo", en: "Full Service", pt: "Serviço Completo" })}
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Currency Switcher */}
            <div className="flex items-center rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setCurrency("USD")}
                className={cn(
                  "px-2 py-1 rounded-md transition",
                  currency === "USD"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white",
                )}
              >
                USD
              </button>
              <button
                type="button"
                onClick={() => setCurrency("COP")}
                className={cn(
                  "px-2 py-1 rounded-md transition",
                  currency === "COP"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white",
                )}
              >
                COP
              </button>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 p-0.5 text-xs font-semibold">
              {LANDING_LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => handleLanguageNavigation(lang)}
                  className={cn(
                    "px-1.5 py-1 rounded-md uppercase transition",
                    language === lang
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white",
                  )}
                >
                  {lang}
                </button>
              ))}
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-amber-400 hover:bg-slate-300 dark:hover:bg-slate-700 transition border border-slate-300 dark:border-slate-700"
              title="Cambiar Tema"
              type="button"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {user ? (
              <Link
                href="/projects"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition"
              >
                <span>{byLanguage(language, { es: "Mi Workspace", en: "My Workspace", pt: "Meu Workspace" })}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline-flex rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-indigo-500 transition"
                >
                  {byLanguage(language, { es: "Iniciar sesión", en: "Log in", pt: "Entrar" })}
                </Link>
                <a
                  href="#simulador"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.02]"
                >
                  <span>{byLanguage(language, { es: "Analizar mi idea gratis", en: "Analyze my idea for free", pt: "Analisar minha ideia grátis" })}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto mb-10">
            {/* Positioning Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-6 shadow-sm">
              <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span>{byLanguage(language, {
                es: "No construyas la casa sin los planos. Evita proyectos fallidos de IA.",
                en: "Don't build the house without the blueprints. Avoid failed AI projects.",
                pt: "Não construa a casa sem a planta. Evite projetos de IA fracassados.",
              })}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15] mb-6">
              {byLanguage(language, {
                es: "No programes a ciegas. Diseña los ",
                en: "Don't code blindly. Design your ",
                pt: "Não programe às cegas. Desenhe as ",
              })}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500">
                {byLanguage(language, {
                  es: "planos de tu automatización",
                  en: "automation blueprints",
                  pt: "plantas da sua automação",
                })}
              </span>
              {byLanguage(language, {
                es: " primero.",
                en: " first.",
                pt: " primeiro.",
              })}
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl mx-auto mb-8">
              {byLanguage(language, {
                es: "Actuamos como los arquitectos de tu proyecto de IA. Cuéntanos qué proceso manual quieres automatizar y te entregaremos las reglas, integraciones y pasos exactos para que tu equipo lo construya sin adivinar.",
                en: "We act as the architects of your AI project. Tell us which manual process you want to automate and we will deliver the exact rules, integrations, and steps so your team can build without guessing.",
                pt: "Atuamos como os arquitetos do seu projeto de IA. Conte-nos qual processo manual você quer automatizar e entregaremos as regras, integrações e etapas exatas para sua equipe construir sem adivinhação.",
              })}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
              <a
                href="#simulador"
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-xl shadow-indigo-600/25 transition-all flex items-center justify-center gap-3"
              >
                <Sparkles className="h-4 w-4" />
                <span>{byLanguage(language, { es: "Validar mi idea gratis →", en: "Validate my idea for free →", pt: "Validar minha ideia grátis →" })}</span>
              </a>
              <button
                type="button"
                onClick={() => setActiveModal("example")}
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>{byLanguage(language, { es: "Ver un ejemplo de plano real", en: "View a real blueprint example", pt: "Ver um exemplo de planta real" })}</span>
              </button>
            </div>

            {/* Secondary Compatibility Chips */}
            <div className="flex items-center justify-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                {byLanguage(language, {
                  es: 'Nuestros planos ("Blueprints") están diseñados para ser entendidos por:',
                  en: 'Our blueprints are designed to be understood by:',
                  pt: 'Nossas plantas ("Blueprints") são projetadas para serem compreendidas por:',
                })}
              </span>
              <span className="px-3 py-1 rounded-lg bg-slate-200/70 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                {byLanguage(language, { es: "Desarrolladores Humanos", en: "Human Developers", pt: "Desenvolvedores Humanos" })}
              </span>
              <span className="px-3 py-1 rounded-lg bg-slate-200/70 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                {byLanguage(language, { es: "Herramientas de código IA (Cursor, GitHub Copilot)", en: "AI coding tools (Cursor, GitHub Copilot)", pt: "Ferramentas de código IA (Cursor, GitHub Copilot)" })}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCT EXPERIENCE (INTERACTIVE SIMULATOR / EVALUATOR) */}
      <section id="simulador" className="py-12 bg-slate-100/70 dark:bg-slate-950/60 border-y border-slate-200 dark:border-slate-800/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#131b2e]/80 shadow-2xl relative overflow-hidden backdrop-blur-md">
            
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto mb-8">
              <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
                {byLanguage(language, {
                  es: "Evaluación Gratuita",
                  en: "Free Assessment",
                  pt: "Avaliação Gratuita",
                })}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-3">
                {byLanguage(language, { es: "¿Qué tarea repetitiva agota a tu equipo?", en: "What repetitive task drains your team?", pt: "Qual tarefa repetitiva esgota sua equipe?" })}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
                {byLanguage(language, {
                  es: "Cuéntanos tu problema en palabras sencillas. Te diremos al instante si la Inteligencia Artificial es la solución correcta para tu caso.",
                  en: "Tell us your problem in plain words. We'll tell you instantly if Artificial Intelligence is the right solution for your case.",
                  pt: "Conte-nos seu problema em palavras simples. Diremos instantaneamente se a Inteligência Artificial é a solução certa para o seu caso.",
                })}
              </p>
            </div>

            {/* Quick Example Buttons */}
            <div className="mb-4">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 text-center sm:text-left">
                {byLanguage(language, { es: "Haz clic en un ejemplo o escribe el tuyo:", en: "Click an example or write your own:", pt: "Clique em um exemplo ou escreva o seu:" })}
              </div>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                {examplePrompts.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setPromptText(item.text);
                      showToast(
                        byLanguage(language, {
                          es: "Ejemplo cargado en el simulador",
                          en: "Example loaded in simulator",
                          pt: "Exemplo carregado no simulador",
                        }),
                        "indigo",
                      );
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-500 transition-all text-left shadow-2xs flex items-center gap-1.5"
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Area */}
            <div className="space-y-4">
              <div className="relative">
                <textarea
                  id="sim-prompt"
                  rows={4}
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl p-4 text-sm sm:text-base text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-all resize-none shadow-sm leading-relaxed"
                  placeholder={byLanguage(language, {
                    es: "Escribe aquí tu problema... Ej: 'Tengo a dos asistentes pasando datos de correos electrónicos a un Excel todos los días. Toman mucho tiempo y a veces cometen errores.'",
                    en: "Describe your problem here... e.g. 'I have two assistants copying data from emails to Excel every day. It takes too long and they make errors.'",
                    pt: "Escreva seu problema aqui... Ex: 'Tenho dois assistentes copiando dados de e-mails para o Excel todos os dias. Demora muito e às vezes cometem erros.'",
                  })}
                  disabled={evalLoading}
                />
              </div>

              <button
                type="button"
                id="btn-run-sim"
                onClick={handleRunAnalysis}
                disabled={evalLoading}
                className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {evalLoading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{byLanguage(language, { es: "Analizando...", en: "Analyzing...", pt: "Analisando..." })}</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-white" />
                    <span>
                      {evalResult
                        ? byLanguage(language, { es: "Analizar otro caso gratis", en: "Analyze another case for free", pt: "Analisar outro caso grátis" })
                        : byLanguage(language, { es: "Analizar si la IA puede ayudarme", en: "Analyze if AI can help me", pt: "Analisar se a IA pode me ajudar" })}
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Processing Overlay / Loader */}
            {evalLoading ? (
              <div className="mt-8 p-6 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3 font-mono text-xs animate-fade-in">
                <div className="flex items-center gap-3 text-indigo-400 font-bold">
                  <div className="h-3.5 w-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  <span>{byLanguage(language, { es: "Evaluando tu proceso...", en: "Evaluating your process...", pt: "Avaliando seu processo..." })}</span>
                </div>
                <div className="space-y-1.5 text-slate-300 pl-6 font-sans">
                  <div className={cn("transition", evalStep >= 1 ? "opacity-100 text-emerald-400 font-semibold" : "opacity-40")}>
                    ✔ 1. {byLanguage(language, { es: "Entendiendo el problema real de tu negocio...", en: "Understanding your core business problem...", pt: "Entendendo o problema real do seu negócio..." })}
                  </div>
                  <div className={cn("transition", evalStep >= 2 ? "opacity-100 text-emerald-400 font-semibold" : "opacity-40")}>
                    ✔ 2. {byLanguage(language, { es: "Validando si una IA puede tomar estas decisiones...", en: "Validating whether an AI can make these decisions...", pt: "Validando se uma IA pode tomar essas decisões..." })}
                  </div>
                  <div className={cn("transition", evalStep >= 3 ? "opacity-100 text-emerald-400 font-semibold" : "opacity-40")}>
                    ✔ 3. {byLanguage(language, { es: "Identificando a qué sistemas tendría que conectarse...", en: "Identifying which systems it needs to connect to...", pt: "Identificando a quais sistemas precisaria se conectar..." })}
                  </div>
                  <div className={cn("transition", evalStep >= 4 ? "opacity-100 text-emerald-400 font-semibold" : "opacity-40")}>
                    ✔ 4. {byLanguage(language, { es: "Creando un diagnóstico preliminar...", en: "Creating a preliminary diagnosis...", pt: "Criando um diagnóstico preliminar..." })}
                  </div>
                </div>
              </div>
            ) : null}

            {/* Error Display */}
            {evalError ? (
              <div className="mt-6 flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 p-4 text-xs font-semibold text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{evalError}</span>
              </div>
            ) : null}

            {/* Live Results Output Card */}
            {evalResult ? (
              <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-8 animate-fade-in space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div>
                    <span className="px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase">
                      {byLanguage(language, { es: "Diagnóstico Rápido Gratuito", en: "Quick Free Diagnosis", pt: "Diagnóstico Rápido Gratuito" })}
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-2">
                      {evalResult.is_viable
                        ? byLanguage(language, { es: "¡Sí, la IA puede automatizar esto!", en: "Yes, AI can automate this!", pt: "Sim, a IA pode automatizar isso!" })
                        : evalResult.verdict_title}
                    </h3>
                  </div>
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700">
                    {byLanguage(language, { es: "Viabilidad del Proyecto: ", en: "Project Viability: ", pt: "Viabilidade do Projeto: " })}
                    <strong className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                      {evalResult.is_viable
                        ? byLanguage(language, { es: "Alta (Buen candidato)", en: "High (Good candidate)", pt: "Alta (Bom candidato)" })
                        : byLanguage(language, { es: "Moderada / Alternativa recomendada", en: "Moderate / Recommended Alternative", pt: "Moderada / Alternativa recomendada" })}
                    </strong>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 text-xs">
                  <div className="bg-white dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="text-slate-500 dark:text-slate-400 text-[11px] uppercase font-bold tracking-wide">
                      {byLanguage(language, { es: "Nivel de Dificultad", en: "Difficulty Level", pt: "Nível de Dificuldade" })}
                    </div>
                    <div className="text-slate-900 dark:text-white font-bold text-sm mt-0.5">
                      {evalResult.readiness_score >= 80 ? "Bajo - Medio" : "Medio"}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="text-slate-500 dark:text-slate-400 text-[11px] uppercase font-bold tracking-wide">
                      {byLanguage(language, { es: "Supervisión Humana", en: "Human Supervision", pt: "Supervisão Humana" })}
                    </div>
                    <div className="text-emerald-600 dark:text-emerald-400 font-bold text-sm mt-0.5">
                      {byLanguage(language, { es: "La IA sugiere, un humano aprueba", en: "AI suggests, human approves", pt: "A IA sugere, um humano aprova" })}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="text-slate-500 dark:text-slate-400 text-[11px] uppercase font-bold tracking-wide">
                      {byLanguage(language, { es: "Herramientas a Conectar", en: "Tools to Connect", pt: "Ferramentas para Conectar" })}
                    </div>
                    <div className="text-indigo-600 dark:text-indigo-400 font-bold text-sm mt-0.5">
                      {byLanguage(language, { es: "Se requiere conectar 3 sistemas", en: "Requires connecting 3 systems", pt: "Requer conexão com 3 sistemas" })}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="text-slate-500 dark:text-slate-400 text-[11px] uppercase font-bold tracking-wide">
                      {byLanguage(language, { es: "Riesgo de Fallo", en: "Failure Risk", pt: "Risco de Falha" })}
                    </div>
                    <div className="text-amber-600 dark:text-amber-400 font-bold text-sm mt-0.5">
                      {byLanguage(language, { es: "Bajo (Fácil de controlar)", en: "Low (Easy to control)", pt: "Baixo (Fácil de controlar)" })}
                    </div>
                  </div>
                </div>

                {/* Details Card */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs sm:text-sm mb-6 shadow-sm">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {byLanguage(language, { es: "Lo que entendimos que necesitas:", en: "What we understood you need:", pt: "O que entendemos que você precisa:" })}
                    </span>
                    <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                      {evalResult.verdict_summary || "Reducir el tiempo manual de copiar, validar y aprobar información que llega desordenada."}
                    </p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {byLanguage(language, { es: "La Solución Recomendada:", en: "The Recommended Solution:", pt: "A Solução Recomendada:" })}
                    </span>
                    <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                      {evalResult.suggested_archetype
                        ? `Un Asistente de tipo ${evalResult.suggested_archetype} que lee documentos, extrae los datos importantes y los pre-llena en tu sistema para que solo des "Aprobar".`
                        : "Un Asistente Virtual que lee documentos, extrae los datos importantes y los pre-llena en tu sistema para que solo des \"Aprobar\"."}
                    </p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {byLanguage(language, { es: "Sistemas típicos que deberías conectar:", en: "Typical systems you should connect:", pt: "Sistemas típicos que você deve conectar:" })}
                    </span>
                    <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                      {byLanguage(language, {
                        es: "Tu correo electrónico (Gmail/Outlook) + Tu sistema de gestión (Excel/ERP) + Un canal de alertas (WhatsApp/Slack).",
                        en: "Your email (Gmail/Outlook) + Your management system (Excel/ERP) + An alert channel (WhatsApp/Slack).",
                        pt: "Seu e-mail (Gmail/Outlook) + Seu sistema de gestão (Excel/ERP) + Um canal de alertas (WhatsApp/Slack).",
                      })}
                    </p>
                  </div>
                </div>

                {/* Positive Validation Banner */}
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">
                        {byLanguage(language, {
                          es: "El siguiente paso es crear los planos.",
                          en: "The next step is creating the blueprints.",
                          pt: "O próximo passo é criar as plantas.",
                        })}
                      </div>
                      <div className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                        {byLanguage(language, {
                          es: "Ya sabemos que es posible. Ahora necesitamos definir las reglas, los costos y cómo funcionará exactamente antes de contratar a un programador.",
                          en: "We know it is possible. Now we need to define rules, costs, and exact workflows before hiring a programmer.",
                          pt: "Já sabemos que é possível. Agora precisamos definir as regras, os custos e como funcionará exatamente antes de contratar um programador.",
                        })}
                      </div>
                    </div>
                  </div>
                  <a
                    href="#precios"
                    onClick={() => handleStartBlueprint("blueprint")}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition-all whitespace-nowrap shadow-lg shadow-emerald-600/20 text-center"
                  >
                    {byLanguage(language, {
                      es: "Ver cómo crear mis planos →",
                      en: "See how to create my blueprints →",
                      pt: "Ver como criar minhas plantas →",
                    })}
                  </a>
                </div>

              </div>
            ) : null}

          </div>
        </div>
      </section>

      {/* METODOLOGÍA LAB */}
      <section id="metodologia" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">
              {byLanguage(language, { es: "Nuestro Proceso", en: "Our Process", pt: "Nosso Processo" })}
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              {byLanguage(language, {
                es: "4 pasos antes de escribir código",
                en: "4 steps before writing code",
                pt: "4 etapas antes de escrever código",
              })}
            </p>
          </div>

          {/* 4 Process Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative pt-10">
              <div className="absolute -top-5 left-6 w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center border-4 border-slate-50 dark:border-[#0B0F17] shadow-sm">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                {byLanguage(language, { es: "El Problema Real", en: "The Core Problem", pt: "O Problema Real" })}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {byLanguage(language, {
                  es: "Analizamos el dolor de tu negocio y validamos si realmente necesitas IA o una solución más simple.",
                  en: "We analyze your business pain and validate if you truly need AI or a simpler solution.",
                  pt: "Analisamos a dor do seu negócio e validamos se você realmente precisa de IA ou de uma solução mais simples.",
                })}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative pt-10">
              <div className="absolute -top-5 left-6 w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center border-4 border-slate-50 dark:border-[#0B0F17] shadow-sm">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                {byLanguage(language, { es: "Reglas y Límites", en: "Rules & Boundaries", pt: "Regras e Limites" })}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {byLanguage(language, {
                  es: "Definimos qué decisiones puede tomar la IA sola y en qué momentos debe pedir autorización humana.",
                  en: "We define what decisions the AI can make alone and when it must request human authorization.",
                  pt: "Definimos quais decisões a IA pode tomar sozinha e em quais momentos deve pedir autorização humana.",
                })}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative pt-10">
              <div className="absolute -top-5 left-6 w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center border-4 border-slate-50 dark:border-[#0B0F17] shadow-sm">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                {byLanguage(language, { es: "Conexiones", en: "Integrations & Tools", pt: "Conexões" })}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {byLanguage(language, {
                  es: "Mapeamos los sistemas que la IA necesita leer (correo, Excel, CRM) y dónde debe escribir los resultados.",
                  en: "We map the systems the AI needs to read (email, Excel, CRM) and where it should write results.",
                  pt: "Mapeamos os sistemas que a IA precisa ler (e-mail, Excel, CRM) e onde deve escrever os resultados.",
                })}
              </p>
            </div>

            <div className="bg-indigo-600 p-6 rounded-3xl shadow-lg shadow-indigo-600/20 relative pt-10 text-white">
              <div className="absolute -top-5 left-6 w-10 h-10 rounded-full bg-white text-indigo-600 font-bold flex items-center justify-center border-4 border-slate-50 dark:border-[#0B0F17] shadow-sm">
                4
              </div>
              <h3 className="text-lg font-bold mb-2">
                {byLanguage(language, { es: "Entrega de Planos", en: "Blueprint Delivery", pt: "Entrega de Plantas" })}
              </h3>
              <p className="text-sm text-indigo-100">
                {byLanguage(language, {
                  es: "Te entregamos un documento visual para ti y un paquete de instrucciones técnicas para el programador.",
                  en: "We deliver a visual document for you and a technical instruction package for the developer.",
                  pt: "Entregamos um documento visual para você e um pacote de instruções técnicas para o programador.",
                })}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* QUÉ PRODUCE REALMENTE LAB (BLUEPRINT VS ACP) */}
      <section id="artefactos" className="py-20 bg-slate-100/70 dark:bg-slate-950 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">
              {byLanguage(language, { es: "¿Qué recibes a cambio?", en: "What do you receive in return?", pt: "O que você recebe em troca?" })}
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              {byLanguage(language, { es: "Dos documentos. Un solo objetivo: Claridad.", en: "Two documents. One goal: Clarity.", pt: "Dois documentos. Um único objetivo: Clareza." })}
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-3">
              {byLanguage(language, {
                es: 'Dependiendo de lo que necesites, generamos dos tipos de "planos". Uno para el negocio y otro para los programadores.',
                en: 'Depending on what you need, we generate two types of "blueprints". One for the business and another for developers.',
                pt: 'Dependendo do que você precisa, geramos dois tipos de "plantas". Uma para o negócio e outra para os programadores.',
              })}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-stretch">
            {/* Card Blueprint */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-bold font-mono">
                    {byLanguage(language, {
                      es: "PLANO ESTRATÉGICO (BLUEPRINT)",
                      en: "STRATEGIC BLUEPRINT",
                      pt: "PLANTA ESTRATÉGICA (BLUEPRINT)",
                    })}
                  </span>
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">
                  {byLanguage(language, { es: "Para el Gerente / Dueño", en: "For the Manager / Owner", pt: "Para o Gerente / Proprietário" })}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                  {byLanguage(language, {
                    es: "Es un documento visual y en español claro diseñado para ayudarte a tomar decisiones. Te muestra cómo funcionará el sistema, qué riesgos hay y cuánto esfuerzo tomará crearlo, para que apruebes el proyecto con confianza.",
                    en: "It is a visual, clear document designed to help you make decisions. It shows how the system will work, what risks exist, and how much effort it will take to build, so you approve the project with confidence.",
                    pt: "É um documento visual e em linguagem clara para ajudá-lo a tomar decisões. Mostra como o sistema funcionará, quais riscos existem e quanto esforço exigirá.",
                  })}
                </p>

                <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300 mb-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                    <div><strong>{byLanguage(language, { es: "Resumen de Negocio:", en: "Business Summary:", pt: "Resumo de Negócio:" })}</strong> {byLanguage(language, { es: "Problema que resolvemos y solución propuesta.", en: "Problem solved and proposed solution.", pt: "Problema resolvido e solução proposta." })}</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                    <div><strong>{byLanguage(language, { es: "Diagrama Paso a Paso:", en: "Step-by-Step Diagram:", pt: "Diagrama Passo a Passo:" })}</strong> {byLanguage(language, { es: "Cómo trabajará la IA del punto A al punto B.", en: "How the AI will work from point A to point B.", pt: "Como a IA trabalhará do ponto A ao ponto B." })}</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                    <div><strong>{byLanguage(language, { es: "Reglas y Alarmas:", en: "Rules & Alarms:", pt: "Regras e Alarmes:" })}</strong> {byLanguage(language, { es: "En qué casos la IA debe detenerse y pedir ayuda a un humano.", en: "When the AI must halt and request human help.", pt: "Em que casos a IA deve parar e pedir ajuda humana." })}</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                    <div><strong>{byLanguage(language, { es: "Estimación de Esfuerzo:", en: "Effort Estimation:", pt: "Estimativa de Esforço:" })}</strong> {byLanguage(language, { es: "Cuántas horas podría tomar desarrollarlo.", en: "How many hours it could take to develop.", pt: "Quantas horas pode levar para desenvolver." })}</div>
                  </div>
                </div>
              </div>
              <a
                href="#precios"
                className="w-full py-3.5 text-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-sm transition-all block"
              >
                {byLanguage(language, { es: "Ver precio del Plano Estratégico", en: "View Strategic Blueprint Pricing", pt: "Ver preço da Planta Estratégica" })}
              </a>
            </div>

            {/* Card ACP */}
            <div className="rounded-3xl bg-slate-900 text-white border-2 border-emerald-500 p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 px-4 py-1.5 bg-emerald-500 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider rounded-bl-xl font-mono">
                {byLanguage(language, { es: "Listo para Programar", en: "Ready to Build", pt: "Pronto para Programar" })}
              </div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold font-mono border border-emerald-500/30">
                    {byLanguage(language, { es: "PAQUETE TÉCNICO (ACP)", en: "TECHNICAL PACKAGE (ACP)", pt: "PACOTE TÉCNICO (ACP)" })}
                  </span>
                </div>
                <h3 className="text-2xl font-extrabold text-white mb-2">
                  {byLanguage(language, { es: "Para el Programador", en: "For the Developer", pt: "Para o Programador" })}
                </h3>
                <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                  {byLanguage(language, {
                    es: "Incluye el plano estratégico MÁS todos los archivos técnicos (instrucciones precisas, reglas de código y esquemas). Entrégale esto a tu ingeniero o a una IA programadora para que ensamblen el proyecto rápido y sin errores.",
                    en: "Includes the strategic blueprint PLUS all technical files (precise prompts, code rules, schemas). Hand this to your engineer or coding AI to assemble the project fast and without errors.",
                    pt: "Inclui a planta estratégica MAIS todos os arquivos técnicos (prompts precisos, regras de código, esquemas). Entregue ao seu engenheiro ou IA de código.",
                  })}
                </p>

                <div className="space-y-3 text-sm text-slate-200 mb-6">
                  <div className="flex items-start gap-3">
                    <Zap className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                    <div><strong>{byLanguage(language, { es: "Incluye el Plano Estratégico (Blueprint).", en: "Includes the Strategic Blueprint.", pt: "Inclui a Planta Estratégica (Blueprint)." })}</strong></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Code2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                    <div><strong>{byLanguage(language, { es: "Instrucciones y Prompts Base:", en: "Base Instructions & Prompts:", pt: "Instruções e Prompts Base:" })}</strong> {byLanguage(language, { es: "Cómo debe comportarse y responder la IA.", en: "How the AI must behave and respond.", pt: "Como a IA deve se comportar e responder." })}</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileCode2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                    <div><strong>{byLanguage(language, { es: "Estructura de Datos:", en: "Data Structure:", pt: "Estrutura de Dados:" })}</strong> {byLanguage(language, { es: "Cómo se debe enviar la información a tus otros sistemas (Excel, CRMs).", en: "How data must be sent to your other systems (Excel, CRMs).", pt: "Como as informações devem ser enviadas aos seus outros sistemas (Excel, CRMs)." })}</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                    <div><strong>{byLanguage(language, { es: "Optimizado para IA:", en: "Optimized for AI:", pt: "Otimizado para IA:" })}</strong> {byLanguage(language, { es: "Archivos listos para que herramientas como Cursor o Copilot escriban el código final.", en: "Files ready for tools like Cursor or Copilot to write the final code.", pt: "Arquivos prontos para ferramentas como Cursor ou Copilot escreverem o código final." })}</div>
                  </div>
                </div>
              </div>

              <div>
                <a
                  href="#precios"
                  className="w-full block text-center py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm transition-all shadow-lg shadow-emerald-500/20"
                >
                  {byLanguage(language, { es: "Ver precio del Paquete Técnico Completo", en: "View Full Technical Package Pricing", pt: "Ver preço do Pacote Técnico Completo" })}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PARA QUIÉN ES (SEGMENTOS) */}
      <section id="segmentos" className="py-16 bg-slate-100/70 dark:bg-slate-950 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="w-10 h-10 mx-auto rounded-xl bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold mb-3">
                <UserCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">
                {byLanguage(language, { es: "Para Líderes de Negocio", en: "For Business Leaders", pt: "Para Líderes de Negócios" })}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {byLanguage(language, {
                  es: "Valida si la IA es rentable para tu empresa y obtén claridad antes de gastar presupuesto en desarrollo.",
                  en: "Validate if AI is profitable for your company and gain clarity before spending development budget.",
                  pt: "Valide se a IA é rentável para sua empresa e obtenha clareza antes de gastar orçamento em desenvolvimento.",
                })}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="w-10 h-10 mx-auto rounded-xl bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold mb-3">
                <Code2 className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">
                {byLanguage(language, { es: "Para Equipos Técnicos", en: "For Technical Teams", pt: "Para Equipes Técnicas" })}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {byLanguage(language, {
                  es: "Recibe las reglas claras, los límites y las integraciones mapeadas para empezar a programar sin ambigüedades.",
                  en: "Receive clear rules, boundaries, and mapped integrations to start coding without ambiguities.",
                  pt: "Receba regras claras, limites e integrações mapeadas para começar a programar sem ambiguidades.",
                })}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="w-10 h-10 mx-auto rounded-xl bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold mb-3">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">
                {byLanguage(language, { es: "Para Agencias", en: "For Agencies", pt: "Para Agências" })}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {byLanguage(language, {
                  es: "Estandariza tu proceso de ventas y diseño técnico para tus clientes mediante nuestra suscripción mensual.",
                  en: "Standardize your sales and technical architecture process for clients through our monthly subscription.",
                  pt: "Padronize seu processo de vendas e arquitetura técnica para clientes por meio de nossa assinatura mensal.",
                })}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CALCULADORA DE IMPACTO */}
      <section id="estimador" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold mb-3 border border-emerald-200 dark:border-emerald-500/20">
              <Calculator className="h-3.5 w-3.5" />
              <span>{byLanguage(language, { es: "Estimación Transparente", en: "Transparent Estimation", pt: "Estimativa Transparente" })}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              {byLanguage(language, { es: "Estimación de Impacto en Horas", en: "Impact Estimation in Hours", pt: "Estimativa de Impacto em Horas" })}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-2">
              {byLanguage(language, {
                es: "Compara el rango orientativo de esfuerzo técnico con y sin especificación previa estructurada.",
                en: "Compare indicative engineering effort with and without structured prior specification.",
                pt: "Compare o esforço técnico indicativo com e sem especificação prévia estruturada.",
              })}
            </p>
          </div>

          {/* Dynamic Scale Selector */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex p-1.5 rounded-2xl bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 gap-1 text-xs sm:text-sm font-semibold">
              {[
                { key: "S", label: byLanguage(language, { es: "Pequeño (1 Agente)", en: "Small (1 Agent)", pt: "Pequeno (1 Agente)" }) },
                { key: "M", label: byLanguage(language, { es: "Mediano (Proyecto Tipo)", en: "Medium (Standard Project)", pt: "Médio (Projeto Padrão)" }) },
                { key: "L", label: byLanguage(language, { es: "Multi-Agente (2-3)", en: "Multi-Agent (2-3)", pt: "Multi-Agente (2-3)" }) },
                { key: "XL", label: byLanguage(language, { es: "Enterprise", en: "Enterprise", pt: "Enterprise" }) },
              ].map((scale) => (
                <button
                  key={scale.key}
                  type="button"
                  onClick={() => setCalcScale(scale.key as ScaleSize)}
                  className={cn(
                    "px-4 py-2 rounded-xl transition-all",
                    calcScale === scale.key
                      ? "bg-indigo-600 text-white shadow"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white",
                  )}
                >
                  {scale.label}
                </button>
              ))}
            </div>
          </div>

          {/* Output Comparison Box */}
          <div className="rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#131b2e]/80 max-w-4xl mx-auto shadow-2xl backdrop-blur-md">
            <div className="grid sm:grid-cols-3 gap-6 text-center font-mono">
              <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                  {byLanguage(language, { es: "Sin Diseño Estructurado", en: "Without Structured Design", pt: "Sem Design Estruturado" })}
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-200">
                  {impactData[calcScale].trad}
                </div>
                <div className="text-[11px] text-slate-400 mt-2 font-sans">
                  {byLanguage(language, { es: "Redescubrimiento constante en desarrollo", en: "Constant rediscovery in development", pt: "Redescoberta constante no desenvolvimento" })}
                </div>
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-950/50 p-6 rounded-2xl border border-indigo-200 dark:border-indigo-800 shadow-sm">
                <div className="text-xs text-indigo-700 dark:text-indigo-300 mb-1 font-bold">
                  {byLanguage(language, { es: "Con Blueprint + ACP", en: "With Blueprint + ACP", pt: "Com Blueprint + ACP" })}
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                  {impactData[calcScale].lab}
                </div>
                <div className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-2 font-sans">
                  {byLanguage(language, { es: "Aceleración por contexto claro", en: "Acceleration through clear context", pt: "Aceleração por contexto claro" })}
                </div>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-500/10 p-6 rounded-2xl border border-emerald-200 dark:border-emerald-500/30 shadow-sm">
                <div className="text-xs text-emerald-800 dark:text-emerald-300 mb-1 font-bold">
                  {byLanguage(language, { es: "Ahorro Potencial Estimado", en: "Estimated Potential Savings", pt: "Economia Potencial Estimada" })}
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {impactData[calcScale].sav}
                </div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-2 font-sans">
                  {byLanguage(language, { es: "Reducción de ambigüedad técnica", en: "Reduction in technical ambiguity", pt: "Redução de ambiguidade técnica" })}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 text-center italic">
              {byLanguage(language, {
                es: "«Estimación orientativa. El resultado depende de complejidad, autonomía, integraciones, herramientas existentes y decisiones pendientes.»",
                en: "«Indicative estimate. Results depend on complexity, autonomy, connectors, existing tools, and pending decisions.»",
                pt: "«Estimativa indicativa. O resultado depende de complexidade, autonomia, conectores, ferramentas e decisões pendentes.»",
              })}
            </div>
          </div>
        </div>
      </section>

      {/* MODELO COMERCIAL (PRICING 3 TIERS) */}
      <section id="precios" className="py-20 relative bg-slate-100/70 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
              {byLanguage(language, { es: "Embudo Comercial Progresivo", en: "Progressive Commercial Funnel", pt: "Funil Comercial Progressivo" })}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-3">
              {byLanguage(language, { es: "Planes por Proyecto", en: "Project Plans", pt: "Planos por Projeto" })}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-2">
              {byLanguage(language, {
                es: "Paga únicamente por el nivel de profundidad que requieras para tu decisión.",
                en: "Pay only for the depth of architecture your decision demands.",
                pt: "Pague apenas pelo nível de profundidade que sua decisão exige.",
              })}
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
            {/* Tier 1: Free */}
            <div className="rounded-3xl p-8 border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 flex flex-col justify-between shadow-sm">
              <div>
                <div className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Tier 1 — Aterrizaje</div>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">Free</h3>
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white my-4">
                  $0 <span className="text-xs font-normal text-slate-500">USD</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-6">
                  {byLanguage(language, {
                    es: "Aterriza tu idea inicial y descubre la viabilidad real de implementar un agente.",
                    en: "Shape your initial idea and uncover real viability before building an agent.",
                    pt: "Estruture sua ideia inicial e descubra a viabilidade real antes de implementar.",
                  })}
                </p>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-indigo-500 shrink-0" /> {byLanguage(language, { es: "Comprensión inicial de la necesidad", en: "Initial understanding of the need", pt: "Compreensão inicial da necessidade" })}</div>
                  <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-indigo-500 shrink-0" /> {byLanguage(language, { es: "Score de viabilidad agéntica", en: "Agentic viability score", pt: "Score de viabilidade agêntica" })}</div>
                  <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-indigo-500 shrink-0" /> {byLanguage(language, { es: "Evaluación de complejidad y autonomía", en: "Complexity & autonomy evaluation", pt: "Avaliação de complexidade e autonomia" })}</div>
                  <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-indigo-500 shrink-0" /> {byLanguage(language, { es: "Detección de herramientas principales", en: "Core tools and integrations detection", pt: "Detecção das principais ferramentas" })}</div>
                  <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-indigo-500 shrink-0" /> {byLanguage(language, { es: "Estimación preliminar de esfuerzo", en: "Preliminary effort estimation", pt: "Estimativa preliminar de esforço" })}</div>
                  <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-indigo-500 shrink-0" /> {byLanguage(language, { es: "Vista previa de artefactos sugeridos", en: "Suggested artifacts preview", pt: "Prévia de artefatos sugeridos" })}</div>
                </div>
              </div>
              <a
                href="#simulador"
                className="mt-8 w-full py-3.5 text-center rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs transition-all block"
              >
                {byLanguage(language, { es: "Analizar mi idea gratis", en: "Analyze my idea for free", pt: "Analisar minha ideia grátis" })}
              </a>
            </div>

            {/* Tier 2: Blueprint */}
            <div className="rounded-3xl p-8 border border-indigo-300 dark:border-indigo-500/40 bg-white/90 dark:bg-slate-900/90 flex flex-col justify-between shadow-sm relative">
              <div>
                <div className="text-xs font-bold uppercase text-indigo-600 dark:text-indigo-400">Tier 2 — Diseño Enriquecido</div>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">Blueprint</h3>
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white my-4">
                  {formatPrice(49)} <span className="text-xs font-normal text-slate-500">/ {byLanguage(language, { es: "proyecto", en: "project", pt: "projeto" })}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-6">
                  {byLanguage(language, {
                    es: "Diseño técnico y funcional estructurado para equipos de liderazgo y desarrollo.",
                    en: "Structured technical and functional design for leadership and engineering teams.",
                    pt: "Design técnico e funcional estruturado para liderança e times de engenharia.",
                  })}
                </p>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-indigo-500 shrink-0" /> {byLanguage(language, { es: "Todo lo incluido en el nivel Free", en: "Everything included in Free tier", pt: "Tudo incluído no nível Free" })}</div>
                  <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-indigo-500 shrink-0" /> {byLanguage(language, { es: "Arquitectura detallada + flujos de estado", en: "Detailed architecture + state flows", pt: "Arquitetura detalhada + fluxos de estado" })}</div>
                  <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-indigo-500 shrink-0" /> {byLanguage(language, { es: "Casos de uso + validaciones técnicas", en: "Use cases + technical validations", pt: "Casos de uso + validações técnicas" })}</div>
                  <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-indigo-500 shrink-0" /> {byLanguage(language, { es: "Definición de reglas de negocio y riesgos", en: "Business rules and risk mapping", pt: "Regras de negócio e mapeamento de riscos" })}</div>
                  <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-indigo-500 shrink-0" /> {byLanguage(language, { es: "Documento exportable PDF / Markdown", en: "Exportable PDF / Markdown document", pt: "Documento exportável em PDF / Markdown" })}</div>
                  <div className="flex items-center gap-2 font-semibold text-indigo-600 dark:text-indigo-400">
                    <Shield className="h-3.5 w-3.5 shrink-0" /> {byLanguage(language, { es: "Reconocimiento de pago para upgrade futuro", en: "Payment recognized for future upgrade", pt: "Reconhecimento de pagamento para upgrade futuro" })}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => openPurchase("Blueprint", 49)}
                className="mt-8 w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all"
              >
                {byLanguage(language, {
                  es: `Generar mi Blueprint (${formatPrice(49)})`,
                  en: `Generate my Blueprint (${formatPrice(49)})`,
                  pt: `Gerar meu Blueprint (${formatPrice(49)})`,
                })}
              </button>
            </div>

            {/* Tier 3: Blueprint + ACP */}
            <div className="rounded-3xl bg-gradient-to-b from-slate-900 to-indigo-950 text-white p-8 border-2 border-indigo-500 flex flex-col justify-between shadow-2xl relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-extrabold uppercase px-3 py-0.5 rounded-full font-mono">
                Ready for Agentic Build
              </div>
              <div>
                <div className="text-xs font-bold uppercase text-emerald-400">Tier 3 — Construcción Agéntica</div>
                <h3 className="text-2xl font-extrabold text-white mt-1">Blueprint + ACP</h3>
                <div className="text-3xl font-extrabold text-white my-4">
                  {formatPrice(149)} <span className="text-xs font-normal text-slate-400">/ {byLanguage(language, { es: "proyecto", en: "project", pt: "projeto" })}</span>
                </div>
                <p className="text-xs text-slate-300 mb-4">
                  {byLanguage(language, {
                    es: "Todo el Blueprint + el paquete comprimido para iniciar la construcción.",
                    en: "Entire Blueprint + compressed package to kickstart implementation.",
                    pt: "Todo o Blueprint + pacote compactado para iniciar a construção.",
                  })}
                </p>

                {/* Upgrade Callout Banner */}
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-300 mb-6 flex items-center gap-2">
                  <RotateCcw className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>
                    {byLanguage(language, {
                      es: `¿Ya compraste el Blueprint? Upgrade al ACP por solo +${formatPrice(109)}.`,
                      en: `Already bought Blueprint? Upgrade to ACP for only +${formatPrice(109)}.`,
                      pt: `Já comprou o Blueprint? Upgrade para ACP por apenas +${formatPrice(109)}.`,
                    })}
                  </span>
                </div>

                <div className="border-t border-slate-800 pt-4 space-y-2.5 text-xs text-slate-200">
                  <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> {byLanguage(language, { es: "Todo el Blueprint Técnico Completo", en: "Full Technical Blueprint Included", pt: "Planta Técnica Completa Incluída" })}</div>
                  <div className="flex items-center gap-2 font-bold text-white"><Zap className="h-3.5 w-3.5 text-amber-400 shrink-0" /> {byLanguage(language, { es: "Paquete ACP (Contexto + Prompts + Schemas)", en: "ACP Package (Context + Prompts + Schemas)", pt: "Pacote ACP (Contexto + Prompts + Schemas)" })}</div>
                  <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> {byLanguage(language, { es: "Diseñado para Codex, Claude Code y Cursor", en: "Designed for Codex, Claude Code, and Cursor", pt: "Projetado para Codex, Claude Code e Cursor" })}</div>
                  <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> {byLanguage(language, { es: "Contratos de interfaz y casos de prueba", en: "Interface contracts and test scenarios", pt: "Contratos de interface e casos de teste" })}</div>
                  <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> {byLanguage(language, { es: "Guía paso a paso para la construcción", en: "Step-by-step construction guide", pt: "Guia passo a passo para a construção" })}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => openPurchase("Blueprint + ACP", 149)}
                className="mt-8 w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all"
              >
                {byLanguage(language, {
                  es: `Preparar para construcción (${formatPrice(149)})`,
                  en: `Prepare for build (${formatPrice(149)})`,
                  pt: `Preparar para construção (${formatPrice(149)})`,
                })}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SUSCRIPCIÓN BUILDER */}
      <section id="builder" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8 sm:p-12 shadow-2xl relative overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold uppercase tracking-wider border border-indigo-500/20">
                  {byLanguage(language, { es: "Suscripción Profesional", en: "Professional Subscription", pt: "Assinatura Profissional" })}
                </span>
                <h2 className="text-3xl font-extrabold text-white">
                  {byLanguage(language, { es: "¿Construyes agentes para clientes?", en: "Do you build agents for clients?", pt: "Você constrói agentes para clientes?" })}
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {byLanguage(language, {
                    es: "Estandariza tu proceso de Discovery y arquitectura agéntica. Con LAB Builder dispones de una cuota mensual recurrente de Blueprints y paquetes ACP con herramientas avanzadas de workspace.",
                    en: "Standardize your Discovery and agentic architecture process. With LAB Builder you get a recurring monthly quota of Blueprints and ACP packages with advanced workspace tools.",
                    pt: "Padronize seu processo de Discovery e arquitetura agêntica. Com o LAB Builder você tem cota mensal recorrente de Blueprints e pacotes ACP com ferramentas avançadas.",
                  })}
                </p>

                <div className="space-y-2 text-xs text-slate-300 font-mono">
                  <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> <strong>3 Blueprints</strong> {byLanguage(language, { es: "incluidos al mes", en: "included per month", pt: "incluídos por mês" })}</div>
                  <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> <strong>1 Paquete ACP</strong> {byLanguage(language, { es: "incluido al mes", en: "included per month", pt: "incluído por mês" })}</div>
                  <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> {byLanguage(language, { es: "Workspace unificado de proyectos de clientes", en: "Unified workspace for client projects", pt: "Workspace unificado para projetos de clientes" })}</div>
                  <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> {byLanguage(language, { es: "Historial y reutilización de contexto agéntico", en: "History and context reuse across agents", pt: "Histórico e reutilização de contexto agêntico" })}</div>
                  <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> {byLanguage(language, { es: "Estandarización de entregables para tu agencia", en: "Standardized deliverables for your agency", pt: "Padronização de entregáveis para sua agência" })}</div>
                </div>
              </div>

              <div className="rounded-2xl p-8 border border-slate-800 bg-slate-950/60 text-center flex flex-col items-center justify-center">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">LAB Builder Pass</div>
                <div className="text-4xl font-extrabold text-white mb-2">{formatPrice(89)} <span className="text-xs font-normal text-slate-400">/ {byLanguage(language, { es: "mes", en: "mo", pt: "mês" })}</span></div>
                <p className="text-xs text-slate-400 mb-6 max-w-xs">
                  {byLanguage(language, {
                    es: "Ahorra hasta un 60% frente a la compra individual de licencias por proyecto.",
                    en: "Save up to 60% compared to purchasing single project licenses.",
                    pt: "Economize até 60% em relação à compra de licenças individuais.",
                  })}
                </p>

                <button
                  type="button"
                  onClick={() => setActiveModal("builder")}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all"
                >
                  {byLanguage(language, { es: "Ver plan Builder →", en: "Explore Builder plan →", pt: "Ver plano Builder →" })}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FACTORY B2B */}
      <section id="factory" className="py-16 bg-slate-100/70 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {byLanguage(language, {
                es: "¿No tienes programadores? Nosotros lo construimos.",
                en: "No developers? We build it for you.",
                pt: "Não tem desenvolvedores? Nós construímos para você.",
              })}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
              {byLanguage(language, {
                es: "Si prefieres delegar la implementación técnica, activamos nuestro equipo B2B.",
                en: "If you prefer delegating technical implementation, our B2B team is ready.",
                pt: "Se você preferir delegar a implementação técnica, ativamos nossa equipe B2B.",
              })}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm opacity-70">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-500" />
                <span>{byLanguage(language, { es: "Opción A: Tu equipo", en: "Option A: Your Team", pt: "Opção A: Sua equipe" })}</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                {byLanguage(language, {
                  es: "Te entregamos los planos (Blueprint + Paquete Técnico) y tus desarrolladores escriben el código.",
                  en: "We hand over the blueprints (Blueprint + Technical Package) and your developers write the code.",
                  pt: "Entregamos as plantas (Blueprint + Pacote Técnico) e seus desenvolvedores escrevem o código.",
                })}
              </p>
            </div>

            <div className="bg-amber-50 dark:bg-amber-500/10 p-6 rounded-2xl border border-amber-300 dark:border-amber-500/40 shadow-sm">
              <h3 className="text-lg font-bold text-amber-900 dark:text-amber-400 mb-2 flex items-center gap-2">
                <Wrench className="h-5 w-5 text-amber-500" />
                <span>{byLanguage(language, { es: "Opción B: LAB Factory", en: "Option B: LAB Factory", pt: "Opção B: LAB Factory" })}</span>
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-200/70 mb-4">
                {byLanguage(language, {
                  es: "Tomamos los planos que acabamos de diseñar y nuestro equipo sénior construye y conecta tu agente a la medida.",
                  en: "We take the blueprints just designed and our senior team builds and connects your custom agent.",
                  pt: "Pegamos as plantas recém-projetadas e nosso time sênior constrói e integra seu agente sob medida.",
                })}
              </p>
              <button
                type="button"
                onClick={() => setActiveModal("factory")}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md"
              >
                {byLanguage(language, { es: "Cotizar desarrollo completo", en: "Quote full development", pt: "Cotar desenvolvimento completo" })}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* MARCO DE VALIDACIÓN & MÉTRICAS */}
      <section className="py-16 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl p-8 border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900 text-center max-w-4xl mx-auto shadow-sm">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">
              {byLanguage(language, { es: "Marco de Validación & Métricas", en: "Validation & Metrics Framework", pt: "Estrutura de Validação e Métricas" })}
            </span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
              {byLanguage(language, { es: "Indicadores de Evaluación de Proyectos", en: "Project Assessment Indicators", pt: "Indicadores de Avaliação de Projetos" })}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 font-mono text-xs">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-indigo-600 dark:text-indigo-400 font-bold text-lg">Proyectos</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Analizados mediante Lean</div>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-emerald-600 dark:text-emerald-400 font-bold text-lg">Viabilidad</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Agéntica calificada</div>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-cyan-600 dark:text-cyan-400 font-bold text-lg">Integraciones</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Identificadas previamente</div>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-amber-600 dark:text-amber-400 font-bold text-lg">Decisiones</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Gaps detectados antes de dev</div>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
                <div className="text-purple-600 dark:text-purple-400 font-bold text-lg">30–50%</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Reducción est. de esfuerzo</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-20 bg-slate-100/70 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {byLanguage(language, { es: "Preguntas Frecuentes", en: "Frequently Asked Questions", pt: "Perguntas Frequentes" })}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
              {byLanguage(language, {
                es: "Respuestas transparentes sobre la plataforma, el alcance y los entregables.",
                en: "Clear answers on platform capabilities, scope, and deliverables.",
                pt: "Respostas transparentes sobre plataforma, escopo e entregáveis.",
              })}
            </p>
          </div>

          <div className="space-y-3">
            {faqList.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left font-bold text-sm text-slate-900 dark:text-white flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={cn("h-4 w-4 text-indigo-600 dark:text-indigo-400 transition-transform", isOpen && "rotate-180")} />
                  </button>
                  {isOpen ? (
                    <div className="p-5 pt-0 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/50 animate-fade-in">
                      {faq.a}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Layers className="h-4 w-4" />
            </div>
            <span className="text-base font-extrabold text-slate-900 dark:text-white">LAB.ai</span>
          </div>
          <div className="text-xs text-slate-500 font-mono text-center md:text-left">
            © 2026 LAB (Lean Agent Builder). De la necesidad de negocio al código agéntico.
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-500 dark:text-slate-400">
            <button type="button" onClick={() => handleLanguageNavigation("es")} className={cn("px-2 py-1 rounded border", language === "es" ? "bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 font-bold" : "opacity-50")}>ES</button>
            <button type="button" onClick={() => handleLanguageNavigation("pt")} className={cn("px-2 py-1 rounded border", language === "pt" ? "bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 font-bold" : "opacity-50")}>PT</button>
            <button type="button" onClick={() => handleLanguageNavigation("en")} className={cn("px-2 py-1 rounded border", language === "en" ? "bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 font-bold" : "opacity-50")}>EN</button>
          </div>
        </div>
      </footer>

      {/* MODAL EJEMPLO REAL */}
      {activeModal === "example" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg"
            >
              <X className="h-5 w-5" />
            </button>

            <span className="px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-bold font-mono uppercase">
              Ejemplo de Output Real — LAB Blueprint
            </span>

            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2 mb-4">
              Caso: Conciliador de Pagos B2B
            </h3>

            <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 font-mono">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <strong className="text-indigo-600 dark:text-indigo-400">1. Necesidad:</strong> Matchear automáticamente comprobantes bancarios PDF recibidos por correo con facturas emitidas en el ERP SAP.
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <strong className="text-indigo-600 dark:text-indigo-400">2. Viabilidad Agéntica:</strong> 92% (Alta). Tarea repetitiva con reglas claras de verificación cruzada.
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <strong className="text-indigo-600 dark:text-indigo-400">3. Human-in-the-Loop:</strong> El agente liquida automáticamente si la coincidencia es &gt;98%. Si hay discrepancia &gt;$10 USD, escala a tesorería.
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <strong className="text-indigo-600 dark:text-indigo-400">4. ACP Status:</strong> Paquete de contexto y reglas formateado para Cursor.
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  setPromptText(examplePrompts[0].text);
                  const simEl = document.getElementById("simulador");
                  simEl?.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/20"
              >
                Probar un caso similar en el simulador →
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* MODAL COMPRA / CHECKOUT */}
      {activeModal === "purchase" && modalPlanData ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
              Generar {modalPlanData.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Inversión total: ${modalPlanData.usdPrice} USD por proyecto. Sin renovaciones automáticas.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setActiveModal(null);
                showToast("Redirigiendo a pasarela de pago segura...", "emerald");
                if (user) {
                  router.push("/projects/new");
                } else {
                  router.push(`/register?tier=${modalPlanData.usdPrice > 50 ? "acp" : "blueprint_pro"}`);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Tu nombre completo"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  placeholder="tu@empresa.com"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">País</label>
                <select className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500">
                  <option>México</option>
                  <option>Colombia</option>
                  <option>Argentina</option>
                  <option>Chile</option>
                  <option>Perú</option>
                  <option>Brasil</option>
                  <option>Estados Unidos (USA)</option>
                  <option>Otro</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all mt-2"
              >
                Continuar al Checkout Seguro
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {/* MODAL BUILDER */}
      {activeModal === "builder" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Suscripción LAB Builder</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              $89 USD / mes — Incluye 3 Blueprints y 1 ACP mensuales.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setActiveModal(null);
                showToast("Solicitud recibida. Nos pondremos en contacto hoy.", "indigo");
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre o Nombre de la Agencia</label>
                <input
                  type="text"
                  required
                  placeholder="Nombre de la agencia"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Correo de Contacto</label>
                <input
                  type="email"
                  required
                  placeholder="contacto@agencia.com"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all mt-2"
              >
                Activar Plan Builder
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {/* MODAL FACTORY B2B */}
      {activeModal === "factory" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">LAB Factory B2B</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Cotización para la construcción y despliegue delegado del agente.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setActiveModal(null);
                showToast("Solicitud recibida. Nos pondremos en contacto hoy.", "indigo");
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Empresa / Proyecto</label>
                <input
                  type="text"
                  required
                  placeholder="Empresa S.A."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Correo Corporativo</label>
                <input
                  type="email"
                  required
                  placeholder="lider@empresa.com"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Alcance Estimado</label>
                <select className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500">
                  <option>Construcción del Agente desde ACP</option>
                  <option>Desarrollo de APIs / Conectores MCP externos</option>
                  <option>Agente + Integración con ERP / Legacy (Completo)</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all mt-2"
              >
                Enviar Solicitud de Cotización
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
