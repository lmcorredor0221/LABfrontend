"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useAuth } from "@/core/auth/auth-context";
import { useCurrency } from "@/core/commerce/currency-context";
import { useLanguage } from "@/core/i18n/language-context";
import { byLanguage } from "@/features/product-experience/core/localized-copy";
import { LandingHeader } from "./components/landing-header";
import { LandingHero } from "./components/landing-hero";
import { ValidateIdeaSection } from "./components/validate-idea-section";
import { TransformationSection } from "./components/transformation-section";
import { DeliverablesSection } from "./components/deliverables-section";
import { TiersComparison } from "./components/tiers-comparison";
import { UseCasesSection } from "./components/use-cases-section";
import { InsightsPreview } from "./components/insights-preview";
import { LandingFaq } from "./components/landing-faq";
import { LandingFooter } from "./components/landing-footer";

interface ToastMessage {
  id: number;
  message: string;
  type: "indigo" | "emerald" | "amber";
}

export function LabLandingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { currency } = useCurrency();
  const { language } = useLanguage();
  const toastIdRef = useRef(0);

  // Dark / Light Theme
  const [isDark, setIsDark] = useState(true);

  // Modals
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalPlanData, setModalPlanData] = useState<{ title: string; price: number; usdPrice: number } | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Interactive Diagnostic State
  const [promptText, setPromptText] = useState("");

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

  function handleStartBlueprint(tier: "blueprint" | "blueprint_pro" | "acp" = "blueprint") {
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

  function handleScrollToValidator() {
    const el = document.getElementById("validar-idea") || document.getElementById("simulador");
    el?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* TOAST SYSTEM */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold flex items-center gap-2 pointer-events-auto animate-fade-in ${
              toast.type === "emerald"
                ? "bg-emerald-900/90 text-emerald-100 border-emerald-700/80"
                : toast.type === "amber"
                ? "bg-amber-900/90 text-amber-100 border-amber-700/80"
                : "bg-indigo-900/90 text-indigo-100 border-indigo-700/80"
            }`}
          >
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* HEADER */}
      <LandingHeader
        isDark={isDark}
        setIsDark={setIsDark}
        onOpenDiagnostic={handleScrollToValidator}
      />

      <main>
        {/* HERO SECTION */}
        <LandingHero
          onOpenExampleModal={() => setActiveModal("example")}
          onValidateClick={handleScrollToValidator}
        />

        {/* 1. VALIDAR MI IDEA GRATIS (EJE PRINCIPAL) */}
        <ValidateIdeaSection
          promptText={promptText}
          setPromptText={setPromptText}
          onStartBlueprint={handleStartBlueprint}
          onShowToast={showToast}
        />

        {/* 2. CÓMO LAB TRANSFORMA TU IDEA */}
        <TransformationSection />

        {/* 3. QUÉ RECIBES (BLUEPRINT vs ACP) */}
        <DeliverablesSection />

        {/* 4. CASOS DE USO REALES */}
        <UseCasesSection
          onSelectPrompt={(text) => {
            setPromptText(text);
            handleScrollToValidator();
            showToast(
              byLanguage(language, {
                es: "Caso de uso cargado en el validador",
                en: "Use case loaded in validator",
                pt: "Caso de uso carregado no validador",
              }),
              "indigo",
            );
          }}
        />

        {/* 5. TIERS & IMPACT ESTIMATOR */}
        <TiersComparison
          onStartFree={() => handleStartBlueprint("blueprint")}
          onOpenPurchase={openPurchase}
          onOpenBuilderModal={() => setActiveModal("builder")}
          onOpenFactoryModal={() => setActiveModal("factory")}
        />

        {/* 6. ARTÍCULOS & INSIGHTS PREVIEW */}
        <InsightsPreview />

        {/* 7. FAQ */}
        <LandingFaq />
      </main>

      {/* FOOTER */}
      <LandingFooter />

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
                  setPromptText("Tenemos 6 personas revisando facturas en PDF y validándolas contra órdenes de compra registradas en el ERP SAP. Queremos reducir el tiempo manual sin perder control de aprobación.");
                  handleScrollToValidator();
                }}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/20"
              >
                Probar un caso similar en el validador →
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
