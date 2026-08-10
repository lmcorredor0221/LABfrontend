"use client";

import { useState } from "react";
import { X, Zap, Globe } from "lucide-react";
import { AppButton, Badge, KeyValue, Panel } from "@/components/lean/ui";

type DrawerTab = "summary" | "schemas" | "examples" | "security" | "api";

type ToolUsageExample = {
  request?: unknown;
  response?: unknown;
  title?: string;
};

export type ToolContractView = {
  archetype?: string;
  audit_rules?: string[];
  auth_reference?: string;
  contract_review_state?: string;
  endpoint_reference?: string;
  execution_mode?: string;
  execution_stage?: string;
  inputs?: string[];
  name?: string;
  outputs?: string[];
  purpose?: string;
  registered_api_ref?: string;
  request_schema?: unknown;
  requires_approval?: boolean;
  response_schema?: unknown;
  risk_level?: string;
  security_config?: {
    auth_type?: string;
    encrypt_transit?: boolean;
  };
  timeout_policy?: string;
  tool_type?: string;
  typed_errors?: string[];
  usage_examples?: ToolUsageExample[];
  when_to_use?: string;
};

type ToolContractDrawerProps = {
  isOpen: boolean;
  tool: ToolContractView | null;
  onClose: () => void;
  onOpenBindModal: (toolName: string) => void;
};

export function ToolContractDrawer({
  isOpen,
  tool,
  onClose,
  onOpenBindModal,
}: ToolContractDrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>("summary");

  if (!isOpen || !tool) return null;

  const toolType = tool.tool_type || (tool.archetype === "approval_gate" || tool.archetype === "knowledge_retrieval" || tool.archetype === "human_handoff" || tool.archetype === "scheduler" ? "internal" : "external");
  const isInternal = toolType === "internal";
  const usageExamples = tool.usage_examples ?? [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-xl h-full bg-white shadow-2xl flex flex-col border-l border-[var(--border-default)]">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-[12px] ${isInternal ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
              {isInternal ? <Zap className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-[18px] text-[var(--text-primary)]">{tool.name}</h2>
                <Badge tone={isInternal ? "violet" : "blue"}>
                  {isInternal ? "⚡ Herramienta Interna" : "🌐 Herramienta Externa"}
                </Badge>
              </div>
              <p className="text-[12px] text-[var(--text-muted)] font-mono mt-0.5">{tool.archetype || "custom_tool"}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Navigation Tabs */}
        <div className="flex border-b border-[var(--border-subtle)] px-6 bg-gray-50/50 overflow-x-auto text-[13px] font-medium">
          {([
            { id: "summary", label: "Resumen & Uso" },
            { id: "schemas", label: "Contrato JSON Schema" },
            { id: "examples", label: "Ejemplos" },
            { id: "security", label: "Seguridad & Errores" },
            { id: "api", label: "Vinculación API" },
          ] satisfies Array<{ id: DrawerTab; label: string }>).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "border-[var(--brand-primary)] text-[var(--brand-primary)] font-semibold"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "summary" && (
            <div className="space-y-5">
              <Panel className="p-4 space-y-3 border-[var(--border-default)]">
                <p className="text-[12px] uppercase font-bold tracking-wider text-[var(--text-muted)]">Propósito del Agente</p>
                <p className="text-[14px] leading-relaxed text-[var(--text-primary)]">{tool.purpose || "Sin propósito definido."}</p>
              </Panel>

              {tool.when_to_use && (
                <Panel className="p-4 space-y-2 border-purple-100 bg-purple-50/40">
                  <p className="text-[12px] uppercase font-bold tracking-wider text-purple-800">¿Cuándo se activa en el flujo?</p>
                  <p className="text-[13px] leading-relaxed text-purple-900">{tool.when_to_use}</p>
                </Panel>
              )}

              <div className="grid grid-cols-2 gap-4">
                <KeyValue label="Etapa de Ejecución" value={tool.execution_stage || "execution"} />
                <KeyValue label="Nivel de Riesgo" value={tool.risk_level || "medium"} />
                <KeyValue label="Requiere Aprobación" value={tool.requires_approval ? "Sí (Human Gate)" : "No (Auto)"} />
                <KeyValue label="Modo de Ejecución" value={tool.execution_mode || "sync"} />
              </div>

              <div className="space-y-2">
                <p className="text-[13px] font-semibold text-[var(--text-primary)]">Entradas esperadas</p>
                <div className="flex flex-wrap gap-2">
                  {(tool.inputs || []).map((input: string) => (
                    <Badge key={input} tone="slate">{input}</Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[13px] font-semibold text-[var(--text-primary)]">Salidas generadas</p>
                <div className="flex flex-wrap gap-2">
                  {(tool.outputs || []).map((output: string) => (
                    <Badge key={output} tone="green">{output}</Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "schemas" && (
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-semibold text-[var(--text-primary)]">Request Schema (JSON Schema v7)</p>
                  <Badge tone="slate">Entrada</Badge>
                </div>
                <pre className="overflow-x-auto rounded-[14px] bg-slate-900 p-4 font-mono text-[12px] text-emerald-400">
                  {JSON.stringify(tool.request_schema || { type: "object", properties: {} }, null, 2)}
                </pre>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-semibold text-[var(--text-primary)]">Response Schema (JSON Schema v7)</p>
                  <Badge tone="green">Salida</Badge>
                </div>
                <pre className="overflow-x-auto rounded-[14px] bg-slate-900 p-4 font-mono text-[12px] text-cyan-400">
                  {JSON.stringify(tool.response_schema || { type: "object", properties: {} }, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {activeTab === "examples" && (
            <div className="space-y-5">
              {usageExamples.length > 0 ? (
                usageExamples.map((ex, i) => (
                  <Panel key={i} className="p-4 space-y-3 border-[var(--border-default)]">
                    <p className="font-semibold text-[14px] text-[var(--text-primary)]">Ejemplo {i + 1}: {ex.title || "Invocación estándar"}</p>
                    <div className="space-y-2">
                      <p className="text-[11px] font-mono text-[var(--text-muted)] uppercase">Petición (Payload):</p>
                      <pre className="overflow-x-auto rounded-[12px] bg-slate-900 p-3 font-mono text-[11px] text-amber-300">
                        {JSON.stringify(ex.request || {}, null, 2)}
                      </pre>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[11px] font-mono text-[var(--text-muted)] uppercase">Respuesta Esperada:</p>
                      <pre className="overflow-x-auto rounded-[12px] bg-slate-900 p-3 font-mono text-[11px] text-emerald-300">
                        {JSON.stringify(ex.response || {}, null, 2)}
                      </pre>
                    </div>
                  </Panel>
                ))
              ) : (
                <div className="rounded-[14px] border border-dashed border-gray-300 p-6 text-center text-[13px] text-[var(--text-secondary)]">
                  No hay ejemplos de uso registrados para esta herramienta.
                </div>
              )}
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-5">
              <Panel className="p-4 space-y-3 border-[var(--border-default)]">
                <p className="text-[13px] font-semibold text-[var(--text-primary)]">Configuración de Autenticación & Seguridad</p>
                <div className="grid grid-cols-2 gap-3 text-[13px]">
                  <div>
                    <span className="text-[var(--text-muted)]">Tipo Auth:</span>{" "}
                    <span className="font-medium">{tool.security_config?.auth_type || "internal_token"}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)]">Cifrado Tránsito:</span>{" "}
                    <span className="font-medium">{tool.security_config?.encrypt_transit ? "Sí (TLS 1.3)" : "Estándar"}</span>
                  </div>
                </div>
              </Panel>

              <div className="space-y-2">
                <p className="text-[13px] font-semibold text-[var(--text-primary)]">Errores Tipados (Domain Errors)</p>
                <div className="flex flex-wrap gap-2">
                  {(tool.typed_errors || ["EXECUTION_FAILED", "TIMEOUT", "UNAUTHORIZED"]).map((err: string) => (
                    <Badge key={err} tone="red">{err}</Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[13px] font-semibold text-[var(--text-primary)]">Reglas de Auditoría</p>
                <div className="space-y-1">
                  {(tool.audit_rules || ["Log immutable request and response hashes."]).map((rule: string, i: number) => (
                    <p key={i} className="text-[13px] text-[var(--text-secondary)] bg-gray-50 p-2.5 rounded-[8px] border border-gray-200">
                      • {rule}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "api" && (
            <div className="space-y-5">
              <Panel className="p-5 space-y-4 border-[var(--border-default)]">
                <div className="flex items-center justify-between">
                  <p className="text-[14px] font-semibold text-[var(--text-primary)]">Estado del Enlace API</p>
                  <Badge tone={tool.registered_api_ref ? "green" : "orange"}>
                    {tool.registered_api_ref ? "🔗 API Vinculada" : "⚠️ API Pendiente"}
                  </Badge>
                </div>
                
                <div className="space-y-2 text-[13px]">
                  <div>
                    <span className="text-[var(--text-muted)]">API Ref:</span>{" "}
                    <span className="font-mono font-medium text-[var(--text-primary)]">{tool.registered_api_ref || "Ninguna"}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)]">Endpoint Reference:</span>{" "}
                    <span className="font-mono font-medium text-[var(--text-primary)]">{tool.endpoint_reference || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)]">Auth Reference:</span>{" "}
                    <span className="font-mono font-medium text-[var(--text-primary)]">{tool.auth_reference || "N/A"}</span>
                  </div>
                </div>

                <AppButton
                  onClick={() => onOpenBindModal(tool.name ?? "")}
                  variant="primary"
                  className="w-full"
                >
                  🔗 {tool.registered_api_ref ? "Cambiar API o OpenAPI Vinculada" : "Vincular API o Especificación OpenAPI"}
                </AppButton>
              </Panel>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="border-t border-[var(--border-subtle)] bg-gray-50 px-6 py-4 flex items-center justify-between">
          <p className="text-[12px] text-[var(--text-muted)]">Revisión del Contrato: <span className="font-medium text-[var(--text-primary)]">{tool.contract_review_state || "approved"}</span></p>
          <AppButton onClick={onClose} variant="secondary">Cerrar</AppButton>
        </div>
      </div>
    </div>
  );
}
