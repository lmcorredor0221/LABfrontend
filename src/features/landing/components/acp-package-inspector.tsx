"use client";

import { useState } from "react";
import { Check, Code2, Copy, Download, FileCode, Folder, FolderOpen, Layers, Terminal } from "lucide-react";
import { useLanguage } from "@/core/i18n/language-context";
import { byLanguage } from "@/features/product-experience/core/localized-copy";

export function AcpPackageInspector() {
  const { language } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string>("tools/tool_contracts.json");

  const files: Record<string, { name: string; lang: string; content: string }> = {
    "tools/tool_contracts.json": {
      name: "tool_contracts.json",
      lang: "json",
      content: `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SAP_Invoice_Reconciler_Tool_Contracts",
  "version": "1.4.0",
  "tools": [
    {
      "name": "tool_search_purchase_order",
      "description": "Consultas órdenes de compra activas en SAP ERP por NIT/RFC y monto total",
      "parameters": {
        "type": "object",
        "properties": {
          "supplier_tax_id": {
            "type": "string",
            "description": "NIT o RFC del proveedor en formato homologado"
          },
          "invoice_total_amount": {
            "type": "number",
            "description": "Monto total de la factura extraído del PDF"
          }
        },
        "required": ["supplier_tax_id", "invoice_total_amount"]
      }
    }
  ]
}`,
    },
    "prompts/system_prompt_v1.md": {
      name: "system_prompt_v1.md",
      lang: "markdown",
      content: `# ROLE & INSTRUCTIONS: CONCILIADOR DE FACTURAS B2B

<system_identity>
Eres un agente de IA especializado en validación contable empresarial.
Tu objetivo es conciliar facturas recibidas en PDF contra el ERP SAP con verificación determinística de límites y escalamiento seguro.
</system_identity>

<execution_rules>
1. Invoca siempre \`tool_search_purchase_order\` antes de tomar una decisión de pago.
2. Si el margen de discrepancia es <= 0.5% y monto <= $10 USD, ejecuta la compensación automática.
3. Si el margen es > $10 USD o proveedor nuevo, invoca \`trigger_human_approval\` y detén el flujo.
</execution_rules>`,
    },
    "cognition/guardrails.yaml": {
      name: "guardrails.yaml",
      lang: "yaml",
      content: `version: "2.1"
security_boundaries:
  max_turns_per_session: 10
  max_tokens_budget_usd: 0.25
  prohibited_actions:
    - "MODIFY_VENDOR_TAX_ID"
    - "OVERRIDE_BANK_ACCOUNT"
  safety_filters:
    indirect_prompt_injection_prevention: true
    strict_json_argument_validation: true`,
    },
    "adapters/cursor.md": {
      name: "cursor.md",
      lang: "markdown",
      content: `# CURSOR AI AGENT INSTRUCTIONS (.cursorrules)

1. Utiliza los contratos JSON Schema en \`tools/tool_contracts.json\` como tipos estrictos en TypeScript/Python.
2. No modifiques la estructura de \`system_prompt_v1.md\` sin actualizar los benchmarks en \`evaluation/benchmark_cases.json\`.
3. Implementa los guardrails de contención de costos como middleware en la capa de orquestación.`,
    },
    "adapters/claude-code.md": {
      name: "claude-code.md",
      lang: "markdown",
      content: `# CLAUDE CODE CLI BUILD PLAN (CLAUDE.md)

- Build Command: \`pnpm run build\`
- Test Benchmark Command: \`pnpm test -- evaluations/benchmark_cases.json\`
- Code Style: Strict TypeScript + LangGraph checkpoints.`,
    },
    "diagrams/agent_loop.svg": {
      name: "agent_loop.svg",
      lang: "xml",
      content: `<svg viewBox="0 0 800 240" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="240" rx="12" fill="#090d16"/>
  <text x="30" y="35" fill="#a5b4fc" font-size="11" font-family="monospace" font-weight="700">// ACP EXECUTION LOOP ARCHITECTURE</text>
  
  <!-- Perception -->
  <g transform="translate(40, 70)">
    <rect width="180" height="120" rx="8" fill="#1e1b4b" stroke="#6366f1" stroke-width="1.5"/>
    <text x="90" y="45" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="700">1. Perception</text>
    <text x="90" y="65" text-anchor="middle" fill="#a5b4fc" font-size="10">PDF Ingestion + OCR</text>
  </g>
  
  <!-- Cognition -->
  <g transform="translate(260, 70)">
    <rect width="180" height="120" rx="8" fill="#312e81" stroke="#818cf8" stroke-width="1.5"/>
    <text x="90" y="45" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="700">2. Cognition</text>
    <text x="90" y="65" text-anchor="middle" fill="#c7d2fe" font-size="10">HTN Planning & RAG</text>
  </g>
  
  <!-- Action -->
  <g transform="translate(480, 70)">
    <rect width="180" height="120" rx="8" fill="#064e3b" stroke="#10b981" stroke-width="1.5"/>
    <text x="90" y="45" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="700">3. Action & ERP</text>
    <text x="90" y="65" text-anchor="middle" fill="#a7f3d0" font-size="10">Tool Call / HITL Escalation</text>
  </g>

  <!-- Connectors -->
  <path d="M 220 130 L 260 130" stroke="#6366f1" stroke-width="2"/>
  <path d="M 440 130 L 480 130" stroke="#818cf8" stroke-width="2"/>
</svg>`,
    },
  };

  const activeFileObj = files[selectedFile] || files["tools/tool_contracts.json"];

  function handleCopy() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(activeFileObj.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-200 shadow-2xl overflow-hidden backdrop-blur-md font-mono">
      {/* Inspector Top Bar */}
      <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-emerald-400" />
          <span className="font-bold text-white">ACP Package Explorer — Paquete Estándar descargable .ZIP</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition flex items-center gap-1.5"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? "¡Copiado!" : "Copiar Snippet"}</span>
          </button>

          <a
            href="#precios"
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-extrabold transition flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Descargar Muestra .ZIP</span>
          </a>
        </div>
      </div>

      {/* Main Grid: Tree + Editor */}
      <div className="grid grid-cols-1 md:grid-cols-3 min-h-[380px]">
        {/* File Tree Explorer (Left) */}
        <div className="p-4 bg-slate-900/60 border-r border-slate-800 text-xs space-y-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <FolderOpen className="h-3.5 w-3.5 text-indigo-400" />
            <span>acp-enterprise-bundle.zip</span>
          </div>

          <div className="space-y-1 pl-1">
            <div className="text-slate-400 font-bold text-[11px] flex items-center gap-1">
              <span>📁 diagrams/</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedFile("diagrams/agent_loop.svg")}
              className={`w-full text-left pl-4 py-1 rounded transition text-[11px] flex items-center gap-1.5 ${
                selectedFile === "diagrams/agent_loop.svg" ? "bg-indigo-600/30 text-white font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Layers className="h-3 w-3 text-indigo-400" />
              <span>agent_loop.svg</span>
            </button>

            <div className="text-slate-400 font-bold text-[11px] flex items-center gap-1 mt-2">
              <span>📁 adapters/</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedFile("adapters/cursor.md")}
              className={`w-full text-left pl-4 py-1 rounded transition text-[11px] flex items-center gap-1.5 ${
                selectedFile === "adapters/cursor.md" ? "bg-indigo-600/30 text-white font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileCode className="h-3 w-3 text-cyan-400" />
              <span>cursor.md</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedFile("adapters/claude-code.md")}
              className={`w-full text-left pl-4 py-1 rounded transition text-[11px] flex items-center gap-1.5 ${
                selectedFile === "adapters/claude-code.md" ? "bg-indigo-600/30 text-white font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileCode className="h-3 w-3 text-purple-400" />
              <span>claude-code.md</span>
            </button>

            <div className="text-slate-400 font-bold text-[11px] flex items-center gap-1 mt-2">
              <span>📁 tools/</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedFile("tools/tool_contracts.json")}
              className={`w-full text-left pl-4 py-1 rounded transition text-[11px] flex items-center gap-1.5 ${
                selectedFile === "tools/tool_contracts.json" ? "bg-indigo-600/30 text-white font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileCode className="h-3 w-3 text-amber-400" />
              <span>tool_contracts.json</span>
            </button>

            <div className="text-slate-400 font-bold text-[11px] flex items-center gap-1 mt-2">
              <span>📁 prompts/</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedFile("prompts/system_prompt_v1.md")}
              className={`w-full text-left pl-4 py-1 rounded transition text-[11px] flex items-center gap-1.5 ${
                selectedFile === "prompts/system_prompt_v1.md" ? "bg-indigo-600/30 text-white font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileCode className="h-3 w-3 text-emerald-400" />
              <span>system_prompt_v1.md</span>
            </button>

            <div className="text-slate-400 font-bold text-[11px] flex items-center gap-1 mt-2">
              <span>📁 cognition/</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedFile("cognition/guardrails.yaml")}
              className={`w-full text-left pl-4 py-1 rounded transition text-[11px] flex items-center gap-1.5 ${
                selectedFile === "cognition/guardrails.yaml" ? "bg-indigo-600/30 text-white font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileCode className="h-3 w-3 text-red-400" />
              <span>guardrails.yaml</span>
            </button>
          </div>
        </div>

        {/* Code View (Right 2 cols) */}
        <div className="col-span-2 p-4 sm:p-6 bg-slate-950 overflow-x-auto flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 mb-3 pb-2 border-b border-slate-800 flex items-center justify-between">
              <span>📄 {activeFileObj.name}</span>
              <span className="text-[10px] uppercase text-indigo-400">{activeFileObj.lang}</span>
            </div>

            {selectedFile.endsWith(".svg") ? (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex justify-center items-center">
                <div
                  className="w-full"
                  dangerouslySetInnerHTML={{ __html: activeFileObj.content }}
                />
              </div>
            ) : (
              <pre className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
                {activeFileObj.content}
              </pre>
            )}
          </div>

          <div className="mt-6 pt-3 border-t border-slate-900 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Formato Estandarizado LAB ACP v2.4</span>
            <span>Listo para Cursor & Claude Code</span>
          </div>
        </div>
      </div>
    </div>
  );
}
