"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Boxes,
  CheckCircle2,
  ChevronDown,
  FileText,
  History,
  RefreshCw,
  Save,
  Search,
  Settings2,
  Sparkles,
} from "lucide-react";
import { AppButton, Badge, Panel, SelectField, TextAreaField } from "@/components/lean/ui";
import { ApiError } from "@/core/api/errors";
import type {
  DeliverableGovernanceEntry,
  DeliverableGovernanceOverview,
  DeliverableGovernanceUpdate,
  DeliverablePromptResponse,
  DeliverablePromptStatus,
  DeliverablePromptUpdate,
} from "@/features/deliverables/domain/types";
import { deliverableGovernanceApi } from "@/features/deliverables/infrastructure/deliverable-governance-api";
import { OperationsModuleShell } from "@/features/operations/operations-module-shell";
import { ErrorState, LoadingState } from "@/shared/states/runtime-states";

export type GovernanceScope = "platform" | "workspace";

const STAGE_OPTIONS = [
  { label: "Todas", value: "all" },
  { label: "Descubrir", value: "discover" },
  { label: "Definir", value: "define" },
  { label: "Disenar", value: "design" },
  { label: "Herramientas", value: "tools" },
  { label: "Memoria", value: "memory" },
  { label: "Estimar", value: "estimate" },
  { label: "Validar", value: "validate" },
  { label: "Package", value: "package" },
];

const TIER_OPTIONS = [
  { label: "Blueprint", value: "blueprint" },
  { label: "Blueprint Pro", value: "blueprint_pro" },
  { label: "ACP", value: "acp" },
];

const PROMPT_STATUS_OPTIONS: Array<{ label: string; value: DeliverablePromptStatus }> = [
  { label: "Activo", value: "active" },
  { label: "Borrador", value: "draft" },
  { label: "Deprecado", value: "deprecated" },
  { label: "Pausado", value: "paused" },
  { label: "Requiere revision", value: "needs_review" },
];

function toDraft(entry: DeliverableGovernanceEntry): DeliverableGovernanceUpdate {
  return {
    enabled: entry.enabled,
    generation_enabled: entry.generation_enabled,
    notes: entry.notes,
    preview_mode_override: entry.preview_mode,
    prompt_override: entry.prompt_override,
    prompt_status: entry.prompt_status,
    required_tier_override: entry.required_tier,
  };
}

function messageFor(error: unknown) {
  if (error instanceof ApiError && error.status === 403) {
    return "Esta consola requiere el rol Platform Admin.";
  }
  return error instanceof Error ? error.message : "No se pudo cargar el gobierno de entregables.";
}

function formatToken(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatTimestamp(value: string | null) {
  if (!value) {
    return "Sin cambios publicados";
  }
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function parseOverrideList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(String).join("\n");
  }
  return String(value ?? "");
}

function setPromptOverride(current: DeliverableGovernanceUpdate, key: string, value: string) {
  const normalized = key.endsWith("_refs") || key.endsWith("_collections")
    ? value.split("\n").map((item) => item.trim()).filter(Boolean)
    : value;
  return {
    ...current,
    prompt_override: { ...current.prompt_override, [key]: normalized },
  };
}

function promptUpdateFromResponse(prompt: DeliverablePromptResponse): DeliverablePromptUpdate {
  return {
    change_reason: "",
    fallback_policy: prompt.fallback_policy,
    metadata: {},
    prompt_body: prompt.prompt_body,
    prompt_status: prompt.prompt_status,
    schema_contract: prompt.schema_contract,
    validator_key: prompt.validator_key,
    version: prompt.prompt_version,
  };
}

export function PromptEditor({
  deliverableKey,
  onClose,
  scope,
}: {
  deliverableKey: string;
  onClose(): void;
  scope: GovernanceScope;
}) {
  const [prompt, setPrompt] = useState<DeliverablePromptResponse | null>(null);
  const [draft, setDraft] = useState<DeliverablePromptUpdate | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "saving">("loading");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    let mounted = true;
    const task = window.setTimeout(() => {
      setStatus("loading");
      setFeedback("");
      deliverableGovernanceApi.getPrompt(deliverableKey, scope)
        .then((response) => {
          if (!mounted) {
            return;
          }
          setPrompt(response);
          setDraft(promptUpdateFromResponse(response));
          setStatus("ready");
        })
        .catch((error) => {
          if (!mounted) {
            return;
          }
          setStatus("error");
          setFeedback(messageFor(error));
        });
    }, 0);
    return () => {
      mounted = false;
      window.clearTimeout(task);
    };
  }, [deliverableKey, scope]);

  async function validate() {
    if (!draft) {
      return;
    }
    setFeedback("");
    try {
      const result = await deliverableGovernanceApi.validatePrompt(deliverableKey, {
        fallback_policy: draft.fallback_policy,
        prompt_body: draft.prompt_body,
        schema_contract: draft.schema_contract,
        validator_key: draft.validator_key,
      });
      setFeedback(result.valid
        ? `Prompt valido. ${result.warnings.length} advertencia(s).`
        : `Prompt invalido: ${result.errors.join(", ")}`);
    } catch (error) {
      setFeedback(messageFor(error));
    }
  }

  async function save() {
    if (!draft) {
      return;
    }
    setStatus("saving");
    setFeedback("");
    try {
      const updated = await deliverableGovernanceApi.updatePrompt(deliverableKey, draft, scope);
      setPrompt(updated);
      setDraft(promptUpdateFromResponse(updated));
      setStatus("ready");
      setFeedback("Prompt publicado y versionado.");
    } catch (error) {
      setStatus("ready");
      setFeedback(messageFor(error));
    }
  }

  return (
    <Panel className="border-[var(--brand-primary)] bg-[var(--brand-soft)]/35 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.14em] text-[var(--brand-primary)]">PromptSpec gobernado</p>
          <h3 className="mt-1 text-[16px] font-semibold text-[var(--text-primary)]">{formatToken(deliverableKey)}</h3>
          <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
            Versiona instrucciones, contrato de salida, validador y fallback sin cambiar el proveedor LLM global.
          </p>
        </div>
        <AppButton onClick={onClose}>Cerrar editor</AppButton>
      </div>
      {status === "loading" ? (
        <p className="mt-4 text-[13px] text-[var(--text-secondary)]">Cargando PromptSpec...</p>
      ) : null}
      {status === "error" ? (
        <p className="mt-4 text-[13px] font-semibold text-[var(--danger)]">{feedback}</p>
      ) : null}
      {draft && prompt ? (
        <div className="mt-4 grid gap-3">
          <div className="grid gap-3 md:grid-cols-4">
            <SelectField
              label="Estado"
              onValueChange={(value) => setDraft((current) => current ? { ...current, prompt_status: value as DeliverablePromptStatus } : current)}
              options={PROMPT_STATUS_OPTIONS}
              value={draft.prompt_status}
            />
            <TextAreaField
              label="Schema contract"
              onChange={(event) => setDraft((current) => current ? { ...current, schema_contract: event.target.value } : current)}
              value={draft.schema_contract}
            />
            <TextAreaField
              label="Validator key"
              onChange={(event) => setDraft((current) => current ? { ...current, validator_key: event.target.value } : current)}
              value={draft.validator_key}
            />
            <TextAreaField
              label="Fallback policy"
              onChange={(event) => setDraft((current) => current ? { ...current, fallback_policy: event.target.value } : current)}
              value={draft.fallback_policy}
            />
          </div>
          <TextAreaField
            label={`Prompt body - ${prompt.prompt_template_key} - v${prompt.prompt_version}`}
            onChange={(event) => setDraft((current) => current ? { ...current, prompt_body: event.target.value } : current)}
            rows={8}
            value={draft.prompt_body}
          />
          <TextAreaField
            label="Razon del cambio"
            onChange={(event) => setDraft((current) => current ? { ...current, change_reason: event.target.value } : current)}
            placeholder="Explica por que se modifica este PromptSpec y como se valida."
            value={draft.change_reason}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[12px] text-[var(--text-secondary)]">
              {prompt.versions.length} version(es) registradas. Ultima lectura: {formatTimestamp(prompt.versions[0]?.created_at ?? null)}
            </p>
            <div className="flex flex-wrap gap-2">
              <AppButton onClick={() => void validate()} variant="secondary">Validar prompt</AppButton>
              <AppButton icon={<Save className="h-4 w-4" />} loading={status === "saving"} onClick={() => void save()} variant="primary">Guardar version</AppButton>
            </div>
          </div>
          {feedback ? <p className="text-[12px] font-semibold text-[var(--text-secondary)]" role="status">{feedback}</p> : null}
        </div>
      ) : null}
    </Panel>
  );
}

function GovernanceCard({
  entry,
  onSaved,
  scope,
}: {
  entry: DeliverableGovernanceEntry;
  onSaved(entry: DeliverableGovernanceEntry): void;
  scope: GovernanceScope;
}) {
  const [draft, setDraft] = useState<DeliverableGovernanceUpdate>(() => toDraft(entry));
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [editingPrompt, setEditingPrompt] = useState(false);

  async function save() {
    setSaving(true);
    setFeedback("");
    try {
      const updated = await deliverableGovernanceApi.update(entry.deliverable_key, draft, scope);
      onSaved(updated);
      setDraft(toDraft(updated));
      setFeedback("Politica publicada.");
    } catch (error) {
      setFeedback(messageFor(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel className="overflow-hidden p-0">
      <div className="flex flex-wrap items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">{entry.title}</h2>
            <Badge tone={draft.enabled ? "green" : "slate"}>{draft.enabled ? "Visible" : "Deshabilitado"}</Badge>
            <Badge tone={draft.generation_enabled ? "blue" : "orange"}>{draft.generation_enabled ? "Genera" : "Suspendido"}</Badge>
            <Badge tone={draft.prompt_status === "active" ? "blue" : "orange"}>{formatToken(draft.prompt_status)}</Badge>
          </div>
          <p className="mt-1 font-mono text-[11px] text-[var(--text-muted)]">{entry.deliverable_key}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold text-[var(--text-secondary)]">{entry.required_tier} - preview {entry.preview_mode}</p>
          <p className="mt-1 text-[10px] text-[var(--text-muted)]">Scope {entry.scope_key} - {formatTimestamp(entry.updated_at)}</p>
        </div>
      </div>
      <details className="group border-t border-[var(--border-subtle)]">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 text-[12px] font-semibold text-[var(--brand-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px]">
          Configurar politica, producto y generacion
          <ChevronDown aria-hidden="true" className="h-4 w-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t border-[var(--border-subtle)] bg-[var(--surface-muted)] p-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <SelectField
              label="Visibilidad"
              onValueChange={(value) => setDraft((current) => ({ ...current, enabled: value === "enabled" }))}
              options={[{ label: "Habilitado", value: "enabled" }, { label: "Deshabilitado", value: "disabled" }]}
              value={draft.enabled ? "enabled" : "disabled"}
            />
            <SelectField
              label="Generacion"
              onValueChange={(value) => setDraft((current) => ({ ...current, generation_enabled: value === "enabled" }))}
              options={[{ label: "Permitida", value: "enabled" }, { label: "Suspendida", value: "disabled" }]}
              value={draft.generation_enabled ? "enabled" : "disabled"}
            />
            <SelectField
              label="Plan minimo"
              onValueChange={(value) => setDraft((current) => ({ ...current, required_tier_override: value }))}
              options={TIER_OPTIONS}
              value={draft.required_tier_override}
            />
            <SelectField
              label="Preview"
              onValueChange={(value) => setDraft((current) => ({ ...current, preview_mode_override: value }))}
              options={[{ label: "Completa", value: "full" }, { label: "Limitada", value: "limited" }, { label: "Bloqueada", value: "none" }]}
              value={draft.preview_mode_override}
            />
            <SelectField
              label="Prompt"
              onValueChange={(value) => setDraft((current) => ({ ...current, prompt_status: value as DeliverablePromptStatus }))}
              options={PROMPT_STATUS_OPTIONS}
              value={draft.prompt_status}
            />
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <TextAreaField
              label="Override objetivo"
              onChange={(event) => setDraft((current) => setPromptOverride(current, "objective", event.target.value))}
              placeholder="Opcional. Ajusta el objetivo comercial o tecnico del entregable."
              value={String(draft.prompt_override.objective ?? "")}
            />
            <TextAreaField
              label="Refs corto plazo"
              onChange={(event) => setDraft((current) => setPromptOverride(current, "short_term_refs", event.target.value))}
              placeholder="Una referencia por linea."
              value={parseOverrideList(draft.prompt_override.short_term_refs)}
            />
            <TextAreaField
              label="Notas de gobierno"
              onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Razon del cambio, rollout y criterios de reversa."
              value={draft.notes}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <AppButton onClick={() => setEditingPrompt((current) => !current)} variant="secondary">
              {editingPrompt ? "Ocultar PromptSpec" : "Editar PromptSpec"}
            </AppButton>
            <AppButton icon={<Save className="h-3.5 w-3.5" />} loading={saving} onClick={() => void save()} variant="primary">Guardar politica</AppButton>
          </div>
          {feedback ? <p className="mt-3 text-[12px] font-semibold text-[var(--text-secondary)]" role="status">{feedback}</p> : null}
          {editingPrompt ? (
            <div className="mt-4">
              <PromptEditor deliverableKey={entry.deliverable_key} onClose={() => setEditingPrompt(false)} scope={scope} />
            </div>
          ) : null}
        </div>
      </details>
    </Panel>
  );
}

export function DeliverableGovernancePage() {
  const [entries, setEntries] = useState<DeliverableGovernanceEntry[]>([]);
  const [overview, setOverview] = useState<DeliverableGovernanceOverview | null>(null);
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("all");
  const [tier, setTier] = useState("all");
  const [scope, setScope] = useState<GovernanceScope>("platform");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");

  const load = useCallback(async (nextScope: GovernanceScope = scope) => {
    setStatus("loading");
    setError("");
    try {
      const [response, operations] = await Promise.all([
        deliverableGovernanceApi.list(nextScope),
        deliverableGovernanceApi.overview(nextScope),
      ]);
      setEntries(response.entries);
      setOverview(operations);
      setStatus("ready");
    } catch (requestError) {
      setStatus("error");
      setError(messageFor(requestError));
    }
  }, [scope]);

  useEffect(() => {
    const task = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(task);
  }, [load]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return entries.filter((entry) => {
      const matchesQuery = !normalized || `${entry.title} ${entry.deliverable_key}`.toLowerCase().includes(normalized);
      const matchesStage = stage === "all" || entry.deliverable_key.startsWith(`${stage}.`);
      const matchesTier = tier === "all" || entry.required_tier === tier;
      return matchesQuery && matchesStage && matchesTier;
    });
  }, [entries, query, stage, tier]);

  return (
    <OperationsModuleShell
      actions={
        <>
          <Link className="inline-flex min-h-10 items-center gap-2 rounded-[10px] border border-[var(--border-default)] bg-white px-3 text-[13px] font-semibold" href="/settings"><ArrowLeft className="h-4 w-4" /> Configuracion</Link>
          <AppButton icon={<RefreshCw className="h-4 w-4" />} onClick={() => void load()}>Refrescar</AppButton>
        </>
      }
      description="Administra que artefactos, documentos, prompts, contratos y diagramas pertenecen a Blueprint, Blueprint Pro y ACP; define visibilidad, generacion, prompts y trazabilidad."
      eyebrow="Gobierno de plataforma"
      moduleLabel="Entregables"
      sessionOptions={[]}
      showSessionContext={false}
      title="Gobierno de entregables"
    >
      {status === "loading" && !entries.length ? <LoadingState title="Cargando entregables" description="Resolviendo catalogo, overrides, auditoria y politicas efectivas." /> : null}
      {status === "error" ? <ErrorState title="Acceso no disponible" description={error} action={<AppButton onClick={() => void load()}>Reintentar</AppButton>} /> : null}
      {status !== "error" ? (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-4">
            <Panel className="p-4"><Boxes className="h-5 w-5 text-[var(--brand-primary)]" /><strong className="mt-3 block text-[22px]">{overview?.total_entries ?? entries.length}</strong><span className="text-[12px] text-[var(--text-secondary)]">Entregables registrados</span></Panel>
            <Panel className="p-4"><CheckCircle2 className="h-5 w-5 text-[var(--success)]" /><strong className="mt-3 block text-[22px]">{overview?.active_entries ?? 0}</strong><span className="text-[12px] text-[var(--text-secondary)]">Activos para producto</span></Panel>
            <Panel className="p-4"><Settings2 className="h-5 w-5 text-[var(--brand-primary)]" /><strong className="mt-3 block text-[22px]">{overview?.governed_entries ?? 0}</strong><span className="text-[12px] text-[var(--text-secondary)]">Con override publicado</span></Panel>
            <Panel className="p-4"><Sparkles className="h-5 w-5 text-[var(--brand-primary)]" /><strong className="mt-3 block text-[14px]">{overview?.registry_version ?? "deliverable-catalog.v1"}</strong><span className="text-[12px] text-[var(--text-secondary)]">Catalogo canonico</span></Panel>
          </div>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <Panel className="p-3">
              <div className="grid gap-3 xl:grid-cols-[minmax(220px,1fr)_160px_160px_160px]">
                <label className="flex min-h-10 items-center gap-2 rounded-[9px] border border-[var(--border-default)] bg-white px-3">
                  <Search aria-hidden="true" className="h-4 w-4 text-[var(--text-muted)]" />
                  <span className="sr-only">Buscar entregable</span>
                  <input className="w-full bg-transparent text-[13px] outline-none" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar titulo o clave..." value={query} />
                </label>
                <SelectField label="Etapa" onValueChange={setStage} options={STAGE_OPTIONS} value={stage} />
                <SelectField label="Plan" onValueChange={setTier} options={[{ label: "Todos", value: "all" }, ...TIER_OPTIONS]} value={tier} />
                <SelectField
                  label="Scope"
                  onValueChange={(value) => {
                    const nextScope = value as GovernanceScope;
                    setScope(nextScope);
                    void load(nextScope);
                  }}
                  options={[{ label: "Plataforma", value: "platform" }, { label: "Workspace", value: "workspace" }]}
                  value={scope}
                />
              </div>
            </Panel>
            <Panel className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div><p className="text-[11px] font-bold uppercase tracking-[.12em] text-[var(--text-muted)]">Auditoria</p><h2 className="mt-1 text-[16px] font-semibold">Cambios recientes</h2></div>
                <History aria-hidden="true" className="h-5 w-5 text-[var(--brand-primary)]" />
              </div>
              <div className="mt-3 divide-y divide-[var(--border-subtle)]">
                {(overview?.recent_audit ?? []).slice(0, 4).map((event) => (
                  <div className="py-2 text-[11px]" key={event.id}>
                    <strong className="block text-[var(--text-primary)]">{formatToken(event.deliverable_key)}</strong>
                    <span className="text-[var(--text-muted)]">{event.changed_fields.map(formatToken).join(", ") || "Sin cambio efectivo"} - {formatTimestamp(event.created_at)}</span>
                  </div>
                ))}
                {!overview?.recent_audit.length ? <p className="py-3 text-[12px] text-[var(--text-muted)]">Los cambios administrativos apareceran aqui.</p> : null}
              </div>
            </Panel>
          </div>
          <Panel className="p-4">
            <div className="flex flex-wrap gap-2">
              {Object.entries(overview?.by_type ?? {}).map(([key, value]) => <Badge key={key} tone="slate">{formatToken(key)} {value}</Badge>)}
              {Object.entries(overview?.by_prompt_status ?? {}).map(([key, value]) => <Badge key={`prompt-${key}`} tone={key === "active" ? "blue" : "orange"}>{formatToken(key)} {value}</Badge>)}
            </div>
          </Panel>
          <div className="space-y-3">
            {filtered.map((entry) => (
              <GovernanceCard
                entry={entry}
                key={entry.deliverable_key}
                onSaved={(updated) => setEntries((current) => current.map((item) => item.deliverable_key === updated.deliverable_key ? updated : item))}
                scope={scope}
              />
            ))}
            {!filtered.length ? (
              <Panel className="p-6 text-center">
                <FileText className="mx-auto h-6 w-6 text-[var(--text-muted)]" />
                <p className="mt-2 text-[14px] font-semibold text-[var(--text-primary)]">No hay entregables para este filtro.</p>
                <p className="mt-1 text-[12px] text-[var(--text-secondary)]">Ajusta busqueda, etapa o plan para revisar el catalogo completo.</p>
              </Panel>
            ) : null}
          </div>
        </div>
      ) : null}
    </OperationsModuleShell>
  );
}
