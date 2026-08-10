"use client";

import { useState } from "react";
import { Link2, FileJson, Check, X, Shield, Key } from "lucide-react";
import { AppButton, Badge, Panel, TextField, TextAreaField } from "@/components/lean/ui";

type ApiBindModalProps = {
  isOpen: boolean;
  toolName: string;
  toolPurpose: string;
  currentEndpoint?: string;
  currentAuth?: string;
  currentApiRef?: string;
  onClose: () => void;
  onBind: (data: {
    toolName: string;
    registered_api_ref: string;
    endpoint_reference: string;
    auth_reference: string;
    openapi_spec?: Record<string, unknown>;
  }) => Promise<void>;
};

export function ApiBindModal({
  isOpen,
  toolName,
  toolPurpose,
  currentEndpoint = "",
  currentAuth = "",
  currentApiRef = "",
  onClose,
  onBind,
}: ApiBindModalProps) {
  const [bindMode, setBindMode] = useState<"catalog" | "manual" | "openapi">("catalog");
  const [apiRef, setApiRef] = useState(currentApiRef || "crm_salesforce_api_v2");
  const [endpointRef, setEndpointRef] = useState(currentEndpoint || "https://api.crm.internal/v2/data");
  const [authRef, setAuthRef] = useState(currentAuth || "workspace_secret:CRM_API_KEY");
  const [openapiJson, setOpenapiJson] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit() {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      let openapiSpec: Record<string, unknown> | undefined;
      if (bindMode === "openapi" && openapiJson.trim()) {
        try {
          openapiSpec = JSON.parse(openapiJson);
        } catch (e) {
          throw new Error("El contenido ingresado no es un JSON válido para OpenAPI.");
        }
      }

      await onBind({
        toolName,
        registered_api_ref: bindMode === "catalog" ? apiRef : "",
        endpoint_reference: endpointRef,
        auth_reference: authRef,
        openapi_spec: openapiSpec,
      });

      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error al vincular la API.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-[24px] border border-[var(--border-default)] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[var(--brand-soft)] text-[var(--brand-primary)]">
              <Link2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-[18px] font-semibold text-[var(--text-primary)]">Vincular API Externa</h3>
              <p className="text-[13px] text-[var(--text-secondary)]">Herramienta: <span className="font-mono text-[var(--brand-primary)]">{toolName}</span></p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-gray-100 hover:text-[var(--text-primary)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex gap-2 border-b border-[var(--border-subtle)] pb-3">
            <button
              type="button"
              onClick={() => setBindMode("catalog")}
              className={`px-4 py-2 text-[14px] font-medium rounded-[12px] transition-all ${
                bindMode === "catalog"
                  ? "bg-[var(--brand-soft)] text-[var(--brand-primary)]"
                  : "text-[var(--text-secondary)] hover:bg-gray-50"
              }`}
            >
              Catálogo de APIs Registradas
            </button>
            <button
              type="button"
              onClick={() => setBindMode("manual")}
              className={`px-4 py-2 text-[14px] font-medium rounded-[12px] transition-all ${
                bindMode === "manual"
                  ? "bg-[var(--brand-soft)] text-[var(--brand-primary)]"
                  : "text-[var(--text-secondary)] hover:bg-gray-50"
              }`}
            >
              Endpoint Directo REST/gRPC
            </button>
            <button
              type="button"
              onClick={() => setBindMode("openapi")}
              className={`px-4 py-2 text-[14px] font-medium rounded-[12px] transition-all ${
                bindMode === "openapi"
                  ? "bg-[var(--brand-soft)] text-[var(--brand-primary)]"
                  : "text-[var(--text-secondary)] hover:bg-gray-50"
              }`}
            >
              Importar OpenAPI (Swagger)
            </button>
          </div>

          {errorMsg && (
            <div className="rounded-[12px] bg-red-50 p-3 text-[13px] text-red-600 border border-red-200">
              {errorMsg}
            </div>
          )}

          {bindMode === "catalog" && (
            <div className="space-y-4">
              <p className="text-[13px] text-[var(--text-secondary)]">
                Selecciona una API pre-registrada en el workspace con autenticación y políticas de seguridad configuradas.
              </p>
              <div className="grid gap-3">
                {[
                  { ref: "crm_salesforce_api_v2", name: "Salesforce CRM API v2", url: "https://api.salesforce.com/v52.0", auth: "OAuth2 Bearer Token" },
                  { ref: "erp_sap_s4hana", name: "SAP S/4HANA OData Core", url: "https://sap.enterprise.internal/odata/v4", auth: "API Key + Secret" },
                  { ref: "zendesk_support_api", name: "Zendesk Tickets REST", url: "https://company.zendesk.com/api/v2", auth: "Basic Auth (Token)" },
                ].map((item) => (
                  <div
                    key={item.ref}
                    onClick={() => {
                      setApiRef(item.ref);
                      setEndpointRef(item.url);
                      setAuthRef(item.auth);
                    }}
                    className={`cursor-pointer rounded-[14px] border p-4 transition-all ${
                      apiRef === item.ref
                        ? "border-[var(--brand-primary)] bg-[var(--brand-soft)]/20 shadow-sm"
                        : "border-[var(--border-default)] hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-[15px] text-[var(--text-primary)]">{item.name}</p>
                      {apiRef === item.ref && <Badge tone="violet">Seleccionado</Badge>}
                    </div>
                    <p className="mt-1 font-mono text-[12px] text-[var(--text-muted)]">{item.url}</p>
                    <div className="mt-2 flex items-center gap-2 text-[12px] text-[var(--text-secondary)]">
                      <Shield className="h-3.5 w-3.5" />
                      <span>{item.auth}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {bindMode === "manual" && (
            <div className="space-y-4">
              <TextField
                label="Endpoint Reference (URL Base o Ruta)"
                value={endpointRef}
                onValueChange={setEndpointRef}
                placeholder="https://api.empresa.com/v1/resource"
              />
              <TextField
                label="Referencia de Autenticación / Secreto"
                value={authRef}
                onValueChange={setAuthRef}
                placeholder="workspace_secret:MI_API_KEY"
              />
            </div>
          )}

          {bindMode === "openapi" && (
            <div className="space-y-4">
              <p className="text-[13px] text-[var(--text-secondary)]">
                Pega el archivo OpenAPI 3.0 (JSON) para mapear automáticamente endpoints, request schemas y respuestas.
              </p>
              <TextAreaField
                label="Especificación OpenAPI 3.0 (JSON)"
                value={openapiJson}
                onValueChange={setOpenapiJson}
                placeholder='{ "openapi": "3.0.0", "info": { "title": "Mi API Externa" }, "paths": { ... } }'
                rows={6}
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[var(--border-subtle)] bg-gray-50 px-6 py-4">
          <AppButton onClick={onClose} variant="secondary" disabled={submitting}>
            Cancelar
          </AppButton>
          <AppButton onClick={handleSubmit} variant="primary" loading={submitting} loadingLabel="Vincular API...">
            Vincular API y Actualizar Contrato
          </AppButton>
        </div>
      </div>
    </div>
  );
}
