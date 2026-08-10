"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Zap,
  Globe,
  Search,
} from "lucide-react";
import { AppButton, Badge, Panel } from "@/components/lean/ui";
import type { ToolContractView } from "@/features/blueprint/tool-contract-drawer";

type ToolFilterType = "all" | "internal" | "external" | "bound";

type ToolAccordionListProps = {
  tools: ToolContractView[];
  onOpenDrawer: (tool: ToolContractView) => void;
  onOpenBindModal: (toolName: string) => void;
  onUpdateTool?: (index: number, patch: Partial<ToolContractView>) => void;
  onRemoveTool?: (index: number) => void;
};

export function ToolAccordionList({
  tools,
  onOpenDrawer,
  onOpenBindModal,
}: ToolAccordionListProps) {
  const [filterType, setFilterType] = useState<ToolFilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIndexMap, setExpandedIndexMap] = useState<Record<number, boolean>>({});

  const filteredTools = tools.filter((t) => {
    const tType = t.tool_type || (t.archetype === "approval_gate" || t.archetype === "knowledge_retrieval" || t.archetype === "human_handoff" || t.archetype === "scheduler" ? "internal" : "external");
    if (filterType === "internal" && tType !== "internal") return false;
    if (filterType === "external" && tType !== "external") return false;
    if (filterType === "bound" && !t.registered_api_ref) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (t.name || "").toLowerCase().includes(q);
      const matchPurpose = (t.purpose || "").toLowerCase().includes(q);
      const matchArchetype = (t.archetype || "").toLowerCase().includes(q);
      return matchName || matchPurpose || matchArchetype;
    }
    return true;
  });

  const allExpanded = filteredTools.length > 0 && filteredTools.every((_, i) => expandedIndexMap[i]);

  function toggleExpand(index: number) {
    setExpandedIndexMap((prev) => ({ ...prev, [index]: !prev[index] }));
  }

  function toggleAll() {
    if (allExpanded) {
      setExpandedIndexMap({});
    } else {
      const nextMap: Record<number, boolean> = {};
      filteredTools.forEach((_, i) => { nextMap[i] = true; });
      setExpandedIndexMap(nextMap);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filtering & Search Bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-[18px] border border-[var(--border-default)] bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "all", label: `Todas (${tools.length})` },
            { id: "internal", label: "⚡ Internas" },
            { id: "external", label: "🌐 Externas" },
            { id: "bound", label: "🔗 APIs Vinculadas" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilterType(item.id as ToolFilterType)}
              className={`px-3.5 py-1.5 text-[13px] font-medium rounded-[10px] transition-all ${
                filterType === item.id
                  ? "bg-[var(--brand-primary)] text-white shadow-xs"
                  : "bg-gray-100 text-[var(--text-secondary)] hover:bg-gray-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o propósito..."
              className="w-full rounded-[10px] border border-[var(--border-default)] bg-gray-50 py-1.5 pl-9 pr-3 text-[13px] outline-none focus:border-[var(--brand-primary)] focus:bg-white"
            />
          </div>
          <AppButton onClick={toggleAll} variant="secondary" className="whitespace-nowrap text-[12px]">
            {allExpanded ? "Plegar Todo" : "Desplegar Todo"}
          </AppButton>
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {filteredTools.length === 0 ? (
          <Panel className="p-8 text-center border-dashed border-gray-300">
            <p className="text-[15px] text-[var(--text-secondary)]">No se encontraron herramientas con los filtros seleccionados.</p>
          </Panel>
        ) : (
          filteredTools.map((t, index) => {
            const isInternal = (t.tool_type || (t.archetype === "approval_gate" || t.archetype === "knowledge_retrieval" || t.archetype === "human_handoff" || t.archetype === "scheduler" ? "internal" : "external")) === "internal";
            const isOpen = Boolean(expandedIndexMap[index]);
            const isBound = Boolean(t.registered_api_ref);

            return (
              <div
                key={t.name ?? index}
                className={`overflow-hidden rounded-[18px] border transition-all ${
                  isOpen
                    ? "border-[var(--brand-primary)] shadow-md bg-white"
                    : "border-[var(--border-default)] bg-white hover:border-gray-300"
                }`}
              >
                {/* Accordion Header */}
                <div
                  onClick={() => toggleExpand(index)}
                  className="flex cursor-pointer flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between bg-white hover:bg-gray-50/50"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${
                        isInternal ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {isInternal ? <Zap className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-[16px] text-[var(--text-primary)]">{t.name ?? "Herramienta sin nombre"}</span>
                        <Badge tone={isInternal ? "violet" : "blue"}>
                          {isInternal ? "⚡ Interna" : "🌐 Externa"}
                        </Badge>
                        <Badge tone="slate">{t.execution_stage || "tools"}</Badge>
                        <Badge tone={t.risk_level === "high" ? "red" : t.risk_level === "medium" ? "orange" : "green"}>
                          Riesgo: {t.risk_level || "low"}
                        </Badge>
                        {isBound && (
                          <Badge tone="green">🔗 API Vinc.</Badge>
                        )}
                        {t.requires_approval && (
                          <Badge tone="orange">🔒 Gate Humano</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-[13px] text-[var(--text-secondary)] line-clamp-1">
                        {t.purpose || "Sin descripción corta"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <AppButton
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDrawer(t);
                      }}
                      variant="secondary"
                      className="text-[12px] h-8 px-3"
                    >
                      Contrato Completo
                    </AppButton>
                    <div className="flex h-8 w-8 items-center justify-center text-[var(--text-muted)]">
                      {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </div>
                  </div>
                </div>

                {/* Accordion Body */}
                {isOpen && (
                  <div className="border-t border-[var(--border-subtle)] bg-gray-50/40 p-5 space-y-5">
                    {/* Section 1: Propósito & Reglas de Invocación */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-[14px] border border-[var(--border-subtle)] bg-white p-4 space-y-2">
                        <p className="text-[12px] uppercase font-bold tracking-wider text-[var(--text-muted)]">Propósito & Problema que resuelve</p>
                        <p className="text-[13px] leading-relaxed text-[var(--text-primary)]">{t.purpose}</p>
                      </div>
                      <div className="rounded-[14px] border border-purple-100 bg-purple-50/40 p-4 space-y-2">
                        <p className="text-[12px] uppercase font-bold tracking-wider text-purple-900">¿Cuándo se ejecuta?</p>
                        <p className="text-[13px] leading-relaxed text-purple-950">
                          {t.when_to_use || "Invocada según el flujo razonado por el agente."}
                        </p>
                      </div>
                    </div>

                    {/* Section 2: Request & Response Schemas */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <p className="text-[13px] font-semibold text-[var(--text-primary)]">Entradas (Request Schema)</p>
                        <pre className="overflow-x-auto rounded-[12px] bg-slate-900 p-3 font-mono text-[11px] text-emerald-400">
                          {JSON.stringify(t.request_schema || { properties: t.inputs || {} }, null, 2)}
                        </pre>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[13px] font-semibold text-[var(--text-primary)]">Salidas (Response Schema)</p>
                        <pre className="overflow-x-auto rounded-[12px] bg-slate-900 p-3 font-mono text-[11px] text-cyan-400">
                          {JSON.stringify(t.response_schema || { properties: t.outputs || {} }, null, 2)}
                        </pre>
                      </div>
                    </div>

                    {/* Section 3: Ejemplos & Errores */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <p className="text-[13px] font-semibold text-[var(--text-primary)]">Ejemplo de Uso</p>
                        <pre className="overflow-x-auto rounded-[12px] bg-slate-900 p-3 font-mono text-[11px] text-amber-300">
                          {JSON.stringify((t.usage_examples || [])[0] || { request: {}, response: {} }, null, 2)}
                        </pre>
                      </div>

                      <div className="rounded-[14px] border border-[var(--border-subtle)] bg-white p-4 space-y-3">
                        <p className="text-[13px] font-semibold text-[var(--text-primary)]">Seguridad & Errores Tipados</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(t.typed_errors || ["EXECUTION_ERROR"]).map((err: string) => (
                            <Badge key={err} tone="red">{err}</Badge>
                          ))}
                        </div>
                        <div className="text-[12px] text-[var(--text-secondary)] space-y-1">
                          <p>• Auth: <span className="font-mono">{t.security_config?.auth_type || "internal_token"}</span></p>
                          <p>• Timeout: <span className="font-mono">{t.timeout_policy || "5000ms"}</span></p>
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Acciones de Vinculación API */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-4">
                      <div className="text-[13px] text-[var(--text-secondary)]">
                        <span className="font-medium text-[var(--text-primary)]">API Registrada:</span>{" "}
                        <span className="font-mono">{t.registered_api_ref || t.endpoint_reference || "No vinculada"}</span>
                      </div>
                      <div className="flex gap-2">
                        <AppButton
                          onClick={() => onOpenBindModal(t.name ?? "")}
                          variant="secondary"
                          className="text-[12px]"
                        >
                          🔗 {t.registered_api_ref ? "Cambiar Vinculación API" : "Vincular con API Externa / OpenAPI"}
                        </AppButton>
                        <AppButton
                          onClick={() => onOpenDrawer(t)}
                          variant="primary"
                          className="text-[12px]"
                        >
                          Ver Detalle Completo ➔
                        </AppButton>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
