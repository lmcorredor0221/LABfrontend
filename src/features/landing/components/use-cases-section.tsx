"use client";

import { AlertCircle, ArrowRight, Bot, CheckCircle2, FileSpreadsheet, Headset, Layers, Scale, ShieldAlert } from "lucide-react";
import { useLanguage } from "@/core/i18n/language-context";
import { byLanguage } from "@/features/product-experience/core/localized-copy";

interface UseCasesSectionProps {
  onSelectPrompt: (text: string) => void;
}

export function UseCasesSection({ onSelectPrompt }: UseCasesSectionProps) {
  const { language } = useLanguage();

  const useCases = [
    {
      icon: FileSpreadsheet,
      badge: byLanguage(language, { es: "Finanzas & Contabilidad", en: "Finance & Accounting", pt: "Finanças & Contabilidade" }),
      title: byLanguage(language, {
        es: "Conciliación de Facturas PDF vs ERP",
        en: "Invoice PDF Reconciliation vs ERP",
        pt: "Conciliação de Faturas PDF vs ERP",
      }),
      desc: byLanguage(language, {
        es: "Extracción multimodal de datos en facturas, validación de montos contra órdenes de compra y aprobación humana para discrepancias.",
        en: "Multimodal data extraction from invoices, PO validation against ERP, and human sign-off on discrepancies.",
        pt: "Extração multimodal de dados em faturas, validação de pedidos no ERP e aprovação humana para discrepâncias.",
      }),
      savings: "70% – 85%",
      hitl: byLanguage(language, { es: "Escalamiento si discrepancia > $10 USD", en: "Escalates if discrepancy > $10 USD", pt: "Escala se discrepância > $10 USD" }),
      promptToLoad: byLanguage(language, {
        es: "Tenemos 6 personas revisando facturas en PDF y validándolas contra órdenes de compra registradas en el ERP SAP. Queremos automatizar la validación dejando solo las discrepancias para aprobación humana.",
        en: "We have 6 people reviewing PDF invoices and validating them against purchase orders in SAP ERP. We want to automate validation leaving only discrepancies for human approval.",
        pt: "Temos 6 pessoas revisando faturas em PDF e validando contra pedidos de compra no ERP SAP. Queremos automatizar a validação deixando apenas discrepâncias para aprovação humana.",
      }),
    },
    {
      icon: Headset,
      badge: byLanguage(language, { es: "Atención al Cliente", en: "Customer Support", pt: "Atendimento ao Cliente" }),
      title: byLanguage(language, {
        es: "Soporte N2 y Reembolsos Asistidos",
        en: "Tier-2 Support & Assisted Refunds",
        pt: "Suporte N2 e Reembolsos Assistidos",
      }),
      desc: byLanguage(language, {
        es: "Consulta el historial del cliente en CRM/Shopify, diagnostica el motivo de reclamo y autoriza reembolsos bajo umbrales predefinidos.",
        en: "Queries customer records in CRM/Shopify, diagnoses complaint root causes, and executes refunds within safety thresholds.",
        pt: "Consulta o histórico no CRM/Shopify, diagnostica o motivo da reclamação e autoriza reembolsos sob limites pré-definidos.",
      }),
      savings: "60% – 75%",
      hitl: byLanguage(language, { es: "Aprobación humana si supera $100 USD", en: "Human approval if refund > $100 USD", pt: "Aprovação humana se reembolso > $100 USD" }),
      promptToLoad: byLanguage(language, {
        es: "Quiero automatizar el soporte de clientes para que un agente consulte el estado de pedidos en la API de Shopify, tome decisiones de reembolso y escale casos complejos a Zendesk.",
        en: "I want to automate customer support so an agent queries order status in Shopify API, makes refund decisions, and escalates complex cases to Zendesk.",
        pt: "Quero automatizar o suporte ao cliente para que um agente consulte o status de pedidos na API da Shopify, tome decisões de reembolso e escale casos complexos para o Zendesk.",
      }),
    },
    {
      icon: Scale,
      badge: byLanguage(language, { es: "Legal & Cumplimiento", en: "Legal & Compliance", pt: "Jurídico & Conformidade" }),
      title: byLanguage(language, {
        es: "Auditoría de Contratos y Políticas",
        en: "Contract & Policy Compliance Audit",
        pt: "Auditoria de Contratos e Políticas",
      }),
      desc: byLanguage(language, {
        es: "Analiza contratos contra políticas internas de riesgo, detecta cláusulas de responsabilidad ilimitada y resalta divergencias clave.",
        en: "Scans vendor contracts against internal risk policies, flags uncapped liability clauses, and highlights critical variances.",
        pt: "Analisa contratos contra políticas internas de risco, detecta cláusulas de responsabilidade ilimitada e destaca divergências.",
      }),
      savings: "65% – 80%",
      hitl: byLanguage(language, { es: "Revisión obligatoria de cláusulas críticas", en: "Mandatory human review on critical terms", pt: "Revisão obrigatória de cláusulas críticas" }),
      promptToLoad: byLanguage(language, {
        es: "Necesitamos analizar documentos legales y solicitudes de crédito comparando condiciones contra políticas internas, solicitando aprobación humana cuando existan inconsistencias.",
        en: "We need to analyze legal documents and credit applications comparing conditions against internal policies, requesting human approval when inconsistencies exist.",
        pt: "Precisamos analisar documentos legais e solicitações de crédito comparando condições com políticas internas, solicitando aprovação humana quando houver inconsistências.",
      }),
    },
  ];

  return (
    <section id="casos" className="py-16 md:py-20 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
            {byLanguage(language, {
              es: "Casos de Uso Probados",
              en: "Proven Use Cases",
              pt: "Casos de Uso Comprovados",
            })}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-3">
            {byLanguage(language, {
              es: "Procesos que generan ROI inmediato con agentes",
              en: "Workflows delivering immediate ROI with agents",
              pt: "Processos que geram ROI imediato com agentes",
            })}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-3 leading-relaxed">
            {byLanguage(language, {
              es: "Descubre cómo otras organizaciones estructuran sus agentes antes de implementarlos.",
              en: "See how other organizations structure their agents before writing code.",
              pt: "Veja como outras organizações estruturam seus agentes antes de escrever código.",
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {useCases.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="rounded-2xl p-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-indigo-500/50 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                      {item.badge}
                    </span>
                    <div className="h-9 w-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>

                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                    {item.desc}
                  </p>

                  <div className="space-y-2 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mb-6 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        {byLanguage(language, { es: "Ahorro de tiempo:", en: "Time savings:", pt: "Economia de tempo:" })}
                      </span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                        {item.savings}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0">
                        HITL:
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 font-semibold text-right">
                        {item.hitl}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectPrompt(item.promptToLoad)}
                  className="w-full py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800/80 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition flex items-center justify-center gap-1.5"
                >
                  <span>{byLanguage(language, { es: "Validar este caso en el diagnóstico →", en: "Validate this case in diagnosis →", pt: "Validar este caso no diagnóstico →" })}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
