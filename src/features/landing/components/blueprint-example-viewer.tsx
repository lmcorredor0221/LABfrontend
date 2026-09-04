"use client";

import { useState } from "react";
import {
  Boxes,
  CheckCircle2,
  ChevronDown,
  Code2,
  Cpu,
  Eye,
  FileText,
  GitFork,
  Layers,
  Maximize2,
  Network,
  ShieldAlert,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react";
import { useLanguage } from "@/core/i18n/language-context";
import { byLanguage } from "@/features/product-experience/core/localized-copy";

type ViewerTab = "overview" | "diagrams" | "memory" | "hitl" | "tokens";
type ViewMode = "visual" | "code";

type DiagramKey =
  | "c4_context"
  | "agent_orchestration"
  | "human_intervention"
  | "bpmn_process"
  | "data_lineage"
  | "commercial_value";

interface BlueprintExampleViewerProps {
  mode?: "free" | "pro";
}

export function BlueprintExampleViewer({ mode = "pro" }: BlueprintExampleViewerProps) {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<ViewerTab>("diagrams");
  const [activeDiagram, setActiveDiagram] = useState<DiagramKey>("c4_context");
  const [viewMode, setViewMode] = useState<ViewMode>("visual");

  const tabs: { id: ViewerTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "diagrams", label: byLanguage(language, { es: "Diagramas de Arquitectura (6)", en: "Architecture Diagrams (6)", pt: "Diagramas de Arquitetura (6)" }), icon: Layers },
    { id: "overview", label: byLanguage(language, { es: "Alcance & Reglas", en: "Scope & Rules", pt: "Escopo & Regras" }), icon: FileText },
    { id: "memory", label: byLanguage(language, { es: "Matriz de Memoria", en: "Memory Matrix", pt: "Matriz de Memória" }), icon: Cpu },
    { id: "hitl", label: byLanguage(language, { es: "Gobernanza HITL", en: "HITL Governance", pt: "Governança HITL" }), icon: ShieldAlert },
    { id: "tokens", label: byLanguage(language, { es: "Tokens & Presupuesto", en: "Tokens & Budget", pt: "Tokens & Orçamento" }), icon: Zap },
  ];

  const diagramsList: {
    key: DiagramKey;
    title: string;
    badge: string;
    desc: string;
    mmdCode: string;
  }[] = [
    {
      key: "c4_context",
      title: byLanguage(language, { es: "1. C4 Context · Límites del Sistema", en: "1. C4 Context · System Boundaries", pt: "1. C4 Context · Limites do Sistema" }),
      badge: "C4 Architecture",
      desc: byLanguage(language, {
        es: "Sitúa el Agente de IA, usuarios multicanal, analistas y sistemas destino como SAP ERP.",
        en: "Positions the AI Agent, multichannel users, analysts, and target ERP systems.",
        pt: "Posiciona o Agente de IA, usuários multicanais, analistas e sistemas de destino."
      }),
      mmdCode: `flowchart LR
  node_client["Cliente (Multicanal)"] -->|Envía Factura PDF| node_channels["Inbox Email / Web API"]
  node_channels -->|Ingesta Metadatos| node_ai_agent["Agente IA Conciliador B2B"]
  node_ai_agent -->|Match >= 98%| node_sap["SAP ERP (S/4HANA)"]
  node_ai_agent -->|Discrepancia > $10| node_analyst["Analista HITL (Supervisión)"]
  node_analyst -->|Aprobación / Token| node_ai_agent
  node_analyst -->|Escalamiento Casos Legales| node_coord["Coordinador Operativo"]`,
    },
    {
      key: "agent_orchestration",
      title: byLanguage(language, { es: "2. Orquestación de Agentes & HITL", en: "2. Agent Orchestration & HITL", pt: "2. Orquestração de Agentes & HITL" }),
      badge: "Multi-Agent Control",
      desc: byLanguage(language, {
        es: "Capa de control entre Supervisor, Especialista de Extracción, Memoria Operacional y Gate HITL.",
        en: "Control layer between Supervisor, Extraction Specialist, Operational Memory, and HITL Gate.",
        pt: "Camada de controle entre Supervisor, Especialista de Extração, Memória Operacional e Gate HITL."
      }),
      mmdCode: `flowchart LR
  subgraph Orquestacion["Capa de Orquestación"]
    Supervisor["Agente Supervisor (HTN)"]
    Memory["Memoria Operacional (State)"]
  end
  subgraph Especialistas["Especialistas"]
    PDF_Parser["PDF Field Parser"]
    ERP_Search["SAP PO Matcher"]
  end
  subgraph Gobierno["Gobierno & HITL"]
    Gate["Gate de Aprobación Sensible"]
    Approver["Aprobador Humano HITL"]
  end
  Supervisor --> PDF_Parser
  Supervisor --> ERP_Search
  Supervisor --> Memory
  ERP_Search --> Gate
  Gate -->|Discrepancia| Approver
  Approver -->|Firma Digital| Gate`,
    },
    {
      key: "human_intervention",
      title: byLanguage(language, { es: "3. Flujo de Intervención Humana (HITL)", en: "3. Human Intervention Flow (HITL)", pt: "3. Fluxo de Intervenção Humana (HITL)" }),
      badge: "Governance & SLA",
      desc: byLanguage(language, {
        es: "Flujo explícito de escalamiento cuando la confianza es <98% o el monto excede el umbral seguro.",
        en: "Explicit escalation workflow when confidence is <98% or amount exceeds safe threshold.",
        pt: "Fluxo explícito de escalonamento quando a confiança é <98% ou o valor excede o limite seguro."
      }),
      mmdCode: `flowchart TD
  Start["Incertidumbre o Discrepancia Detectada"] --> Eval{"Evaluar Confianza & Monto"}
  Eval -->|Discrepancia <= $10 USD & Match >= 98%| Auto["Ejecución Autónoma"]
  Eval -->|Discrepancia > $10 USD o Proveedor Nuevo| Queue["Crear Tarea en Queue HITL"]
  Queue --> Alert["Notificar al Supervisor vía Dashboard"]
  Alert --> HumanDecision{"Decisión Humana"}
  HumanDecision -->|Aprobar| Token["Generar Token Temporal de Escritura"]
  HumanDecision -->|Rechazar| Reject["Registrar Causa en Bitácora & Notificar"]
  Token --> Resume["Reanudar Agente con Token Validado"]`,
    },
    {
      key: "bpmn_process",
      title: byLanguage(language, { es: "4. Proceso de Negocio BPMN", en: "4. BPMN Business Process", pt: "4. Processo de Negócio BPMN" }),
      badge: "BPMN 2.0 Standard",
      desc: byLanguage(language, {
        es: "Proceso end-to-end desde recepción multicanal hasta cierre contable en ERP.",
        en: "End-to-end process from multichannel reception to accounting closure in ERP.",
        pt: "Processo end-to-end desde recepção multicanal até fechamento contábil no ERP."
      }),
      mmdCode: `flowchart LR
  Client["Cliente Envíe PDF"] --> Ingestion["Ingesta & Control Duplicados"]
  Ingestion --> Extraction["Extracción de Datos de Factura"]
  Extraction --> RuleCheck{"¿Información Completa?"}
  RuleCheck -->|No| RequestInfo["Solicitar Datos Faltantes"]
  RuleCheck -->|Sí| SAPLookup["Búsqueda de PO en SAP"]
  SAPLookup --> MatchCheck{"¿Coincidencia de Monto?"}
  MatchCheck -->|Sí| SAPReconcile["Compensación Contable SAP"]
  MatchCheck -->|No| Escalation["Escalamiento a Cuentas por Pagar"]`,
    },
    {
      key: "data_lineage",
      title: byLanguage(language, { es: "5. Mapa de Trazabilidad de Datos", en: "5. Data Lineage Map", pt: "5. Mapa de Rastreabilidade de Dados" }),
      badge: "Data Lineage",
      desc: byLanguage(language, {
        es: "Línea del tiempo del dato desde PDF binario, tokens en LLM, pgvector hasta estado en SAP.",
        en: "Data timeline from binary PDF, LLM tokens, pgvector to SAP state.",
        pt: "Linha do tempo dos dados desde PDF binário, tokens em LLM, pgvector até estado no ERP."
      }),
      mmdCode: `flowchart LR
  PDF["PDF Document (S3)"] --> Parser["LayoutParser OCR"]
  Parser --> JSON["Structured Invoice Payload (JSON)"]
  JSON --> Embedding["text-embedding-3-small"]
  Embedding --> VectorDB["Vector Store (pgvector)"]
  JSON --> State["Audit Checkpoint Log (Postgres)"]
  State --> ERP["SAP Accounting Document (BKPF)"]`,
    },
    {
      key: "commercial_value",
      title: byLanguage(language, { es: "6. Flujo de Valor Financiero & ROI", en: "6. Financial Value & ROI Flow", pt: "6. Fluxo de Valor Financeiro & ROI" }),
      badge: "Value Stream",
      desc: byLanguage(language, {
        es: "Relación cuantitativa entre costo de generación LAB ($19-$89 USD) y ahorro de $5,400+ USD en desarrollo.",
        en: "Quantitative relationship between LAB cost ($19-$89 USD) and $5,400+ USD dev savings.",
        pt: "Relação quantitativa entre custo do LAB ($19-$89 USD) e economia de $5.400+ USD em dev."
      }),
      mmdCode: `flowchart LR
  LAB["Inversión LAB Blueprint Pro ($89 USD)"] --> Speed["Especificación Lista en < 5 min"]
  Speed --> Savings["Elimina 140h de Diseño Manual ($6,300 USD)"]
  Savings --> Efficiency["Consumo Token Optimizado ($0.0037 / doc)"]
  Efficiency --> TotalROI["Retorno de Inversión > 70x"]`,
    },
  ];

  const currentDiagramObj = diagramsList.find((d) => d.key === activeDiagram) || diagramsList[0];

  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-2xl overflow-hidden backdrop-blur-md">
      {/* Console Header */}
      <div className="px-6 py-4 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500/80" />
            <div className="h-3 w-3 rounded-full bg-amber-500/80" />
            <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <span>Blueprint Artifact Specification</span>
            <span className="text-slate-400">|</span>
            <span className="text-indigo-600 dark:text-indigo-400">Conciliador_Facturas_B2B</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold font-mono uppercase">
            {mode === "pro" ? "Blueprint Pro Spec" : "Blueprint Free Spec"}
          </span>
          <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold font-mono">
            Deterministic Governance
          </span>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1 p-2 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                isActive
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Display */}
      <div className="p-6 sm:p-8">
        {activeTab === "diagrams" && (
          <div className="space-y-6">
            {/* Diagram Selector & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {byLanguage(language, { es: "Seleccionar Diagrama del Blueprint:", en: "Select Blueprint Diagram:", pt: "Selecionar Diagrama do Blueprint:" })}
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {diagramsList.map((d) => {
                    const isSelected = d.key === activeDiagram;
                    return (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() => setActiveDiagram(d.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                          isSelected
                            ? "bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                      >
                        {d.title.split(" · ")[0]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center gap-1 shrink-0 bg-slate-200/70 dark:bg-slate-900 p-1 rounded-xl border border-slate-300/50 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setViewMode("visual")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    viewMode === "visual"
                      ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-xs"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>{byLanguage(language, { es: "Gráfico Visual", en: "Visual Graphic", pt: "Gráfico Visual" })}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("code")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    viewMode === "code"
                      ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-xs"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <Code2 className="h-3.5 w-3.5" />
                  <span>{byLanguage(language, { es: "Código Mermaid", en: "Mermaid Code", pt: "Código Mermaid" })}</span>
                </button>
              </div>
            </div>

            {/* Active Diagram Details Banner */}
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {currentDiagramObj.title}
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                    {currentDiagramObj.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {currentDiagramObj.desc}
                </p>
              </div>
            </div>

            {/* Diagram Content Canvas */}
            {viewMode === "visual" ? (
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 overflow-hidden relative min-h-[340px] flex flex-col justify-center items-center">
                <div className="w-full space-y-6">
                  {/* Dynamic SVG High-Fi Renderer according to selected diagram */}
                  {activeDiagram === "c4_context" && (
                    <svg className="w-full h-auto max-h-[380px]" viewBox="0 0 900 320" fill="none">
                      <rect width="900" height="320" rx="16" fill="#090d16" />
                      {/* Boundary Box */}
                      <rect x="220" y="30" width="460" height="260" rx="12" stroke="#334155" strokeDasharray="4 4" fill="#0f172a" fillOpacity="0.5" />
                      <text x="240" y="55" fill="#94a3b8" fontSize="11" fontWeight="700" fontFamily="monospace">// BOUNDARY: LAB AGENT SYSTEM</text>
                      
                      {/* Nodes */}
                      {/* Cliente */}
                      <g transform="translate(40, 120)">
                        <rect width="140" height="80" rx="10" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                        <text x="70" y="38" textAnchor="middle" fill="#f8fafc" fontSize="13" fontWeight="700">Cliente B2B</text>
                        <text x="70" y="56" textAnchor="middle" fill="#94a3b8" fontSize="10">Multicanal (Email/PDF)</text>
                      </g>
                      
                      {/* Arrow 1 */}
                      <path d="M 180 160 L 250 160" stroke="#6366f1" strokeWidth="2" markerEnd="url(#arrow)" />
                      <text x="215" y="150" textAnchor="middle" fill="#818cf8" fontSize="10" fontWeight="600">Adjunta PDF</text>
                      
                      {/* Agente IA */}
                      <g transform="translate(250, 110)">
                        <rect width="180" height="100" rx="12" fill="#1e1b4b" stroke="#6366f1" strokeWidth="2" />
                        <text x="90" y="42" textAnchor="middle" fill="#a5b4fc" fontSize="13" fontWeight="800">Agente Conciliador</text>
                        <text x="90" y="60" textAnchor="middle" fill="#818cf8" fontSize="11">RAG + Guardrails</text>
                        <rect x="20" y="70" width="140" height="18" rx="4" fill="#312e81" />
                        <text x="90" y="83" textAnchor="middle" fill="#c7d2fe" fontSize="9" fontWeight="700">ISO-Spec Governed</text>
                      </g>
                      
                      {/* Arrow 2 (To SAP) */}
                      <path d="M 430 140 L 510 140" stroke="#10b981" strokeWidth="2" />
                      <text x="470" y="130" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="600">Match &gt;= 98%</text>

                      {/* Arrow 3 (To HITL) */}
                      <path d="M 340 210 L 340 240 L 510 240" stroke="#f59e0b" strokeWidth="2" />
                      <text x="425" y="255" textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="600">Discrepancia &gt; $10</text>

                      {/* SAP ERP */}
                      <g transform="translate(510, 100)">
                        <rect width="150" height="80" rx="10" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
                        <text x="75" y="38" textAnchor="middle" fill="#ecfdf5" fontSize="13" fontWeight="700">SAP S/4HANA</text>
                        <text x="75" y="56" textAnchor="middle" fill="#a7f3d0" fontSize="10">Compensación Contable</text>
                      </g>

                      {/* HITL Analyst */}
                      <g transform="translate(510, 200)">
                        <rect width="150" height="75" rx="10" fill="#451a03" stroke="#f59e0b" strokeWidth="1.5" />
                        <text x="75" y="35" textAnchor="middle" fill="#fffbeb" fontSize="12" fontWeight="700">Analista HITL</text>
                        <text x="75" y="52" textAnchor="middle" fill="#fde68a" fontSize="10">Queue de Aprobación</text>
                      </g>

                      {/* External Coordinator */}
                      <g transform="translate(710, 120)">
                        <rect width="140" height="80" rx="10" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                        <text x="70" y="38" textAnchor="middle" fill="#f8fafc" fontSize="12" fontWeight="700">Coordinación</text>
                        <text x="70" y="56" textAnchor="middle" fill="#94a3b8" fontSize="10">Escalamientos</text>
                      </g>
                      <path d="M 660 235 L 780 235 L 780 200" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" />

                      <defs>
                        <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                          <path d="M 0 0 L 10 5 L 0 10 z" fill="#6366f1" />
                        </marker>
                      </defs>
                    </svg>
                  )}

                  {activeDiagram === "agent_orchestration" && (
                    <svg className="w-full h-auto max-h-[380px]" viewBox="0 0 900 320" fill="none">
                      <rect width="900" height="320" rx="16" fill="#090d16" />
                      
                      {/* Subgraph Orquestacion */}
                      <rect x="30" y="30" width="250" height="260" rx="12" stroke="#4338ca" fill="#1e1b4b" fillOpacity="0.4" />
                      <text x="45" y="55" fill="#a5b4fc" fontSize="11" fontWeight="800">// CONTROL LAYER</text>
                      <g transform="translate(50, 75)">
                        <rect width="210" height="70" rx="8" fill="#312e81" stroke="#6366f1" />
                        <text x="105" y="32" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">Agente Supervisor HTN</text>
                        <text x="105" y="50" textAnchor="middle" fill="#c7d2fe" fontSize="10">Planificación Determinística</text>
                      </g>
                      <g transform="translate(50, 175)">
                        <rect width="210" height="70" rx="8" fill="#1e1b4b" stroke="#4338ca" />
                        <text x="105" y="32" textAnchor="middle" fill="#e0e7ff" fontSize="12" fontWeight="700">Memoria Operacional</text>
                        <text x="105" y="50" textAnchor="middle" fill="#a5b4fc" fontSize="10">State Checkpoints (SQLite)</text>
                      </g>

                      {/* Subgraph Especialistas */}
                      <rect x="320" y="30" width="260" height="260" rx="12" stroke="#047857" fill="#064e3b" fillOpacity="0.3" />
                      <text x="335" y="55" fill="#6ee7b7" fontSize="11" fontWeight="800">// SPECIALIST WORKERS</text>
                      <g transform="translate(345, 75)">
                        <rect width="210" height="70" rx="8" fill="#065f46" stroke="#10b981" />
                        <text x="105" y="32" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">PDF Field Parser</text>
                        <text x="105" y="50" textAnchor="middle" fill="#a7f3d0" fontSize="10">Layout OCR + Strict Schemas</text>
                      </g>
                      <g transform="translate(345, 175)">
                        <rect width="210" height="70" rx="8" fill="#065f46" stroke="#10b981" />
                        <text x="105" y="32" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">SAP PO Matcher</text>
                        <text x="105" y="50" textAnchor="middle" fill="#a7f3d0" fontSize="10">Tolerancia &lt; $10 USD</text>
                      </g>

                      {/* Subgraph Governance */}
                      <rect x="610" y="30" width="260" height="260" rx="12" stroke="#b45309" fill="#451a03" fillOpacity="0.3" />
                      <text x="625" y="55" fill="#fcd34d" fontSize="11" fontWeight="800">// GOVERNANCE & HITL</text>
                      <g transform="translate(635, 75)">
                        <rect width="210" height="70" rx="8" fill="#78350f" stroke="#f59e0b" />
                        <text x="105" y="32" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">Gate de Aprobación Sensible</text>
                        <text x="105" y="50" textAnchor="middle" fill="#fde68a" fontSize="10">Token de Firma Digital</text>
                      </g>
                      <g transform="translate(635, 175)">
                        <rect width="210" height="70" rx="8" fill="#78350f" stroke="#f59e0b" />
                        <text x="105" y="32" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">Aprobador Humano HITL</text>
                        <text x="105" y="50" textAnchor="middle" fill="#fde68a" fontSize="10">Supervisor Dashboard</text>
                      </g>

                      {/* Arrows */}
                      <path d="M 260 110 L 345 110" stroke="#6366f1" strokeWidth="2" />
                      <path d="M 260 210 L 345 210" stroke="#6366f1" strokeWidth="2" />
                      <path d="M 555 210 L 635 110" stroke="#10b981" strokeWidth="2" />
                      <path d="M 740 145 L 740 175" stroke="#f59e0b" strokeWidth="2" />
                    </svg>
                  )}

                  {activeDiagram === "human_intervention" && (
                    <svg className="w-full h-auto max-h-[380px]" viewBox="0 0 900 320" fill="none">
                      <rect width="900" height="320" rx="16" fill="#090d16" />
                      
                      <g transform="translate(40, 120)">
                        <rect width="160" height="80" rx="10" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1.5" />
                        <text x="80" y="38" textAnchor="middle" fill="#fef2f2" fontSize="12" fontWeight="700">Incertidumbre Detectada</text>
                        <text x="80" y="56" textAnchor="middle" fill="#fca5a5" fontSize="10">Match &lt; 98% o &gt; $10 USD</text>
                      </g>

                      <path d="M 200 160 L 260 160" stroke="#ef4444" strokeWidth="2" />

                      <g transform="translate(260, 110)">
                        <polygon points="90,0 180,50 90,100 0,50" fill="#451a03" stroke="#f59e0b" strokeWidth="2" />
                        <text x="90" y="46" textAnchor="middle" fill="#fffbeb" fontSize="11" fontWeight="800">¿Requiere HITL?</text>
                        <text x="90" y="62" textAnchor="middle" fill="#fde68a" fontSize="9">Verificación Guardrails</text>
                      </g>

                      <path d="M 440 160 L 510 160" stroke="#f59e0b" strokeWidth="2" />
                      <text x="475" y="150" textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="700">SÍ</text>

                      <g transform="translate(510, 120)">
                        <rect width="160" height="80" rx="10" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1.5" />
                        <text x="80" y="38" textAnchor="middle" fill="#e0e7ff" fontSize="12" fontWeight="700">Queue de Aprobación</text>
                        <text x="80" y="56" textAnchor="middle" fill="#a5b4fc" fontSize="10">Notificación a Supervisor</text>
                      </g>

                      <path d="M 670 160 L 730 160" stroke="#6366f1" strokeWidth="2" />

                      <g transform="translate(730, 120)">
                        <rect width="140" height="80" rx="10" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
                        <text x="70" y="38" textAnchor="middle" fill="#ecfdf5" fontSize="12" fontWeight="700">Token Emitido</text>
                        <text x="70" y="56" textAnchor="middle" fill="#6ee7b7" fontSize="10">Reanudar Agente</text>
                      </g>
                    </svg>
                  )}

                  {activeDiagram === "bpmn_process" && (
                    <svg className="w-full h-auto max-h-[380px]" viewBox="0 0 900 320" fill="none">
                      <rect width="900" height="320" rx="16" fill="#090d16" />
                      <text x="40" y="45" fill="#64748b" fontSize="11" fontWeight="700" fontFamily="monospace">BPMN 2.0 AGENTIC WORKFLOW SPECIFICATION</text>
                      
                      <circle cx="70" cy="160" r="24" fill="#065f46" stroke="#10b981" strokeWidth="3" />
                      <text x="70" y="165" textAnchor="middle" fill="#ecfdf5" fontSize="10" fontWeight="800">START</text>

                      <path d="M 94 160 L 140 160" stroke="#475569" strokeWidth="2" />

                      <g transform="translate(140, 120)">
                        <rect width="130" height="80" rx="10" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                        <text x="65" y="42" textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="700">1. Ingesta PDF</text>
                        <text x="65" y="58" textAnchor="middle" fill="#94a3b8" fontSize="9">Email / Webhook</text>
                      </g>

                      <path d="M 270 160 L 310 160" stroke="#475569" strokeWidth="2" />

                      <g transform="translate(310, 120)">
                        <rect width="140" height="80" rx="10" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1.5" />
                        <text x="70" y="42" textAnchor="middle" fill="#e0e7ff" fontSize="11" fontWeight="700">2. Extraer Datos</text>
                        <text x="70" y="58" textAnchor="middle" fill="#a5b4fc" fontSize="9">JSON Validation</text>
                      </g>

                      <path d="M 450 160 L 490 160" stroke="#475569" strokeWidth="2" />

                      <g transform="translate(490, 120)">
                        <rect width="140" height="80" rx="10" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
                        <text x="70" y="42" textAnchor="middle" fill="#ecfdf5" fontSize="11" fontWeight="700">3. Match en SAP</text>
                        <text x="70" y="58" textAnchor="middle" fill="#6ee7b7" fontSize="9">Orden de Compra</text>
                      </g>

                      <path d="M 630 160 L 670 160" stroke="#475569" strokeWidth="2" />

                      <g transform="translate(670, 120)">
                        <rect width="130" height="80" rx="10" fill="#312e81" stroke="#818cf8" strokeWidth="1.5" />
                        <text x="65" y="42" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="700">4. Compensación</text>
                        <text x="65" y="58" textAnchor="middle" fill="#c7d2fe" fontSize="9">Registro ERP</text>
                      </g>

                      <path d="M 800 160 L 836 160" stroke="#475569" strokeWidth="2" />

                      <circle cx="860" cy="160" r="24" fill="#7f1d1d" stroke="#ef4444" strokeWidth="4" />
                      <text x="860" y="165" textAnchor="middle" fill="#fef2f2" fontSize="10" fontWeight="800">END</text>
                    </svg>
                  )}

                  {activeDiagram === "data_lineage" && (
                    <svg className="w-full h-auto max-h-[380px]" viewBox="0 0 900 320" fill="none">
                      <rect width="900" height="320" rx="16" fill="#090d16" />
                      <text x="40" y="45" fill="#64748b" fontSize="11" fontWeight="700" fontFamily="monospace">DATA LINEAGE & AUDIT LOG MAP</text>
                      
                      <g transform="translate(50, 110)">
                        <rect width="140" height="100" rx="10" fill="#1e293b" stroke="#475569" />
                        <text x="70" y="45" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">PDF Binario</text>
                        <text x="70" y="65" textAnchor="middle" fill="#94a3b8" fontSize="10">S3 Object Store</text>
                      </g>

                      <path d="M 190 160 L 250 160" stroke="#6366f1" strokeWidth="2" />

                      <g transform="translate(250, 110)">
                        <rect width="160" height="100" rx="10" fill="#1e1b4b" stroke="#6366f1" />
                        <text x="80" y="45" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">JSON Extraído</text>
                        <text x="80" y="65" textAnchor="middle" fill="#a5b4fc" fontSize="10">NIT, Total, Items</text>
                      </g>

                      <path d="M 410 160 L 470 160" stroke="#6366f1" strokeWidth="2" />

                      <g transform="translate(470, 110)">
                        <rect width="160" height="100" rx="10" fill="#312e81" stroke="#818cf8" />
                        <text x="80" y="45" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">Vector Embeddings</text>
                        <text x="80" y="65" textAnchor="middle" fill="#c7d2fe" fontSize="10">pgvector Storage</text>
                      </g>

                      <path d="M 630 160 L 690 160" stroke="#10b981" strokeWidth="2" />

                      <g transform="translate(690, 110)">
                        <rect width="160" height="100" rx="10" fill="#064e3b" stroke="#10b981" />
                        <text x="80" y="45" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">Documento SAP</text>
                        <text x="80" y="65" textAnchor="middle" fill="#a7f3d0" fontSize="10">BKPF Transaction Log</text>
                      </g>
                    </svg>
                  )}

                  {activeDiagram === "commercial_value" && (
                    <svg className="w-full h-auto max-h-[380px]" viewBox="0 0 900 320" fill="none">
                      <rect width="900" height="320" rx="16" fill="#090d16" />
                      <text x="40" y="45" fill="#64748b" fontSize="11" fontWeight="700" fontFamily="monospace">LAB COMMERCIAL VALUE & ROI PIPELINE</text>
                      
                      <g transform="translate(50, 110)">
                        <rect width="180" height="100" rx="12" fill="#1e1b4b" stroke="#6366f1" strokeWidth="2" />
                        <text x="90" y="45" textAnchor="middle" fill="#a5b4fc" fontSize="13" fontWeight="800">Blueprint Pro ($89)</text>
                        <text x="90" y="65" textAnchor="middle" fill="#c7d2fe" fontSize="10">Inversión Inicial LAB</text>
                      </g>

                      <path d="M 230 160 L 290 160" stroke="#6366f1" strokeWidth="2.5" />

                      <g transform="translate(290, 110)">
                        <rect width="200" height="100" rx="12" fill="#064e3b" stroke="#10b981" strokeWidth="2" />
                        <text x="100" y="45" textAnchor="middle" fill="#ecfdf5" fontSize="13" fontWeight="800">Ahorro 140h Dev</text>
                        <text x="100" y="65" textAnchor="middle" fill="#a7f3d0" fontSize="11">~$6,300 USD Ahorrados</text>
                      </g>

                      <path d="M 490 160 L 550 160" stroke="#10b981" strokeWidth="2.5" />

                      <g transform="translate(550, 110)">
                        <rect width="300" height="100" rx="12" fill="#312e81" stroke="#818cf8" strokeWidth="2" />
                        <text x="150" y="45" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="900">ROI Operativo &gt; 70x</text>
                        <text x="150" y="68" textAnchor="middle" fill="#c7d2fe" fontSize="11">Velocidad: 3.5 sem vs 12 sem manual</text>
                      </g>
                    </svg>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800 space-y-2">
                <div className="text-indigo-400 font-bold">// EXECUTABLE MERMAID SPECIFICATION ({currentDiagramObj.badge})</div>
                <pre className="text-emerald-400 font-mono leading-relaxed whitespace-pre-wrap">
                  {currentDiagramObj.mmdCode}
                </pre>
              </div>
            )}
          </div>
        )}

        {activeTab === "overview" && (
          <div className="space-y-6 font-mono text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="text-indigo-600 dark:text-indigo-400 font-bold mb-1">
                // AGENT CHARTER & DETERMINISTIC SCOPE
              </div>
              <p className="text-slate-700 dark:text-slate-300 font-sans leading-relaxed text-xs">
                <strong>Caso Real:</strong> Conciliación automatizada de facturas PDF recibidas por correo electrónico contra órdenes de compra registradas en el ERP SAP S/4HANA con límites estrictos de SLA y supervisión humana explícita.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-[11px]">
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500">Arquetipo:</span>
                  <div className="font-bold text-slate-900 dark:text-white">Conciliador HITL</div>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500">Autonomía:</span>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400">Condicional (&gt;98%)</div>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500">Herramientas:</span>
                  <div className="font-bold text-slate-900 dark:text-white">3 Conectores API</div>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500">SLA Ejecución:</span>
                  <div className="font-bold text-slate-900 dark:text-white font-mono">&lt; 4.2 seg / PDF</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-xs">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Acciones Permitidas (Atribución)</span>
                </div>
                <ul className="space-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
                  <li>• Extraer montos, NIT/RFC y líneas de items de PDFs estructurados.</li>
                  <li>• Consultar órdenes de compra activas en SAP API.</li>
                  <li>• Registrar compensación si la coincidencia es == 100% y el margen es &lt;= $10 USD.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-amber-500" />
                  <span>Guardrails de Seguridad & Escalamiento</span>
                </div>
                <ul className="space-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
                  <li>• No modificar datos maestros de proveedores en la base de datos de SAP.</li>
                  <li>• Escalar a revisión humana si la discrepancia excede $10 USD.</li>
                  <li>• Requerir aprobación de Tesorería para facturas mayores a $5,000 USD.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === "memory" && (
          <div className="space-y-4">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Estrategia de Memoria Multi-Capa (Memory Management Matrix):
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[10px]">
                  Corto Plazo (RAM)
                </span>
                <div className="font-bold text-slate-900 dark:text-white">Sliding Window Buffer</div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-sans">
                  Retiene los últimos 8 turnos conversacionales (~4,000 tokens). Aplica poda de mensajes obsoletos.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-[10px]">
                  Semántica (RAG)
                </span>
                <div className="font-bold text-slate-900 dark:text-white">Vector DB (pgvector)</div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-sans">
                  Recupera políticas contables y reglas de tolerancia comercial según el tipo de proveedor.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                  Operacional (State)
                </span>
                <div className="font-bold text-slate-900 dark:text-white">SQLite / Postgres Checkpoints</div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-sans">
                  Almacena el estado exacto del caso para reanudar la ejecución si el supervisor aprueba horas después.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "hitl" && (
          <div className="space-y-4">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Reglas de Supervisión Humana (Human-in-the-Loop Triggers):
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 font-sans text-xs">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Trigger 1: Discrepancia de Monto</div>
                  <div className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">
                    Si `abs(factura.total - po.total) &gt; $10 USD`, el agente detiene la liquidación y crea una tarea en la cola del tesorero con la evidencia en pantalla.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Trigger 2: Proveedor Nuevo / No Homologado</div>
                  <div className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">
                    Si el NIT o RFC no existe en el catálogo maestro de SAP, requiere validación de cuentas por pagar antes de procesar el PDF.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "tokens" && (
          <div className="space-y-4">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Estimación de Consumo de Tokens & Presupuesto (Token Spend Model):
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-slate-500 text-[11px]">Tokens / Ejecución:</span>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  1,850 avg
                </div>
                <span className="text-[10px] text-indigo-500">~ $0.0037 USD / doc</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-slate-500 text-[11px]">Costo Mensual (1,000 docs):</span>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  $3.70 USD
                </div>
                <span className="text-[10px] text-emerald-500">vs $2,400 manual</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-slate-500 text-[11px]">Límite de Seguridad:</span>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  10 turnos max
                </div>
                <span className="text-[10px] text-red-500">Infinite-loop breaker</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
