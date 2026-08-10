"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  Bot,
  CheckCircle2,
  ChevronDown,
  History,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { AppButton, Badge, Panel, SelectField, TextAreaField } from "@/components/lean/ui";
import { ApiError } from "@/core/api/errors";
import type {
  DiagramGovernanceEntry,
  DiagramGovernanceOverview,
  DiagramGovernanceUpdate,
} from "@/features/diagram-center/domain/governance-types";
import { diagramGovernanceApi } from "@/features/diagram-center/infrastructure/diagram-governance-api";
import { OperationsModuleShell } from "@/features/operations/operations-module-shell";
import { ErrorState, LoadingState } from "@/shared/states/runtime-states";

function toDraft(entry: DiagramGovernanceEntry): DiagramGovernanceUpdate {
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
  return error instanceof Error ? error.message : "No se pudo cargar el gobierno de diagramas.";
}

function formatToken(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function promptText(
  entry: DiagramGovernanceEntry,
  draft: DiagramGovernanceUpdate,
  key: "objective" | "semantic_rules" | "exclusions",
) {
  const value = draft.prompt_override[key] ?? entry.prompt_spec[key];
  return Array.isArray(value) ? value.join("\n") : String(value ?? "");
}

function setPromptOverride(
  current: DiagramGovernanceUpdate,
  key: "objective" | "semantic_rules" | "exclusions",
  value: string,
) {
  const normalized = key === "objective"
    ? value
    : value.split("\n").map((item) => item.trim()).filter(Boolean);
  return {
    ...current,
    prompt_override: { ...current.prompt_override, [key]: normalized },
  };
}

function GovernanceCard({
  entry,
  onSaved,
}: {
  entry: DiagramGovernanceEntry;
  onSaved(entry: DiagramGovernanceEntry): void;
}) {
  const [draft, setDraft] = useState<DiagramGovernanceUpdate>(() => toDraft(entry));
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  async function save() {
    setSaving(true);
    setFeedback("");
    try {
      const updated = await diagramGovernanceApi.update(entry.diagram_key, draft);
      onSaved(updated);
      setDraft(toDraft(updated));
      setFeedback("Política publicada");
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
            <Badge tone={draft.prompt_status === "active" ? "blue" : "orange"}>{draft.prompt_status}</Badge>
          </div>
          <p className="mt-1 font-mono text-[11px] text-[var(--text-muted)]">{entry.diagram_key} · {entry.prompt_spec_version}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold text-[var(--text-secondary)]">{entry.required_tier} · preview {entry.preview_mode}</p>
          <p className="mt-1 text-[10px] text-[var(--text-muted)]">{entry.prompt_spec.notation} · {entry.prompt_spec.required_inputs.length} entradas</p>
        </div>
      </div>
      <details className="group border-t border-[var(--border-subtle)]">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 text-[12px] font-semibold text-[var(--brand-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px]">
          Configurar política y PromptSpec
          <ChevronDown aria-hidden="true" className="h-4 w-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t border-[var(--border-subtle)] bg-[var(--surface-muted)] p-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <SelectField
              label="Visibilidad"
              onValueChange={(value) => setDraft((current) => ({ ...current, enabled: value === "enabled" }))}
              options={[{ label: "Habilitado", value: "enabled" }, { label: "Deshabilitado", value: "disabled" }]}
              value={draft.enabled ? "enabled" : "disabled"}
            />
            <SelectField
              label="Generación"
              onValueChange={(value) => setDraft((current) => ({ ...current, generation_enabled: value === "enabled" }))}
              options={[{ label: "Permitida", value: "enabled" }, { label: "Suspendida", value: "disabled" }]}
              value={draft.generation_enabled ? "enabled" : "disabled"}
            />
            <SelectField
              label="Plan mínimo"
              onValueChange={(value) => setDraft((current) => ({ ...current, required_tier_override: value }))}
              options={[
                { label: "Blueprint", value: "blueprint" },
                { label: "Blueprint Pro", value: "blueprint_pro" },
                { label: "ACP", value: "acp" },
              ]}
              value={draft.required_tier_override}
            />
            <SelectField
              label="Preview"
              onValueChange={(value) => setDraft((current) => ({ ...current, preview_mode_override: value }))}
              options={[{ label: "Completa", value: "full" }, { label: "Limitada", value: "limited" }, { label: "Bloqueada", value: "none" }]}
              value={draft.preview_mode_override}
            />
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <TextAreaField
              label="Objetivo efectivo"
              onChange={(event) => setDraft((current) => setPromptOverride(current, "objective", event.target.value))}
              value={promptText(entry, draft, "objective")}
            />
            <TextAreaField
              label="Reglas semánticas · una por línea"
              onChange={(event) => setDraft((current) => setPromptOverride(current, "semantic_rules", event.target.value))}
              value={promptText(entry, draft, "semantic_rules")}
            />
            <TextAreaField
              label="Exclusiones · una por línea"
              onChange={(event) => setDraft((current) => setPromptOverride(current, "exclusions", event.target.value))}
              value={promptText(entry, draft, "exclusions")}
            />
            <TextAreaField
              label="Notas de gobierno"
              onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Razón del cambio, rollout y criterios de reversión."
              value={draft.notes}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-[220px]">
              <SelectField
                label="Estado del PromptSpec"
                onValueChange={(value) => setDraft((current) => ({ ...current, prompt_status: value as DiagramGovernanceUpdate["prompt_status"] }))}
                options={[{ label: "Activo", value: "active" }, { label: "Borrador", value: "draft" }, { label: "Retirado", value: "retired" }]}
                value={draft.prompt_status}
              />
            </div>
            <AppButton icon={<Save className="h-3.5 w-3.5" />} loading={saving} onClick={() => void save()} variant="primary">Guardar política</AppButton>
          </div>
          {feedback ? <p className="mt-3 text-[12px] font-semibold text-[var(--text-secondary)]" role="status">{feedback}</p> : null}
        </div>
      </details>
    </Panel>
  );
}

export function DiagramGovernancePage() {
  const [entries, setEntries] = useState<DiagramGovernanceEntry[]>([]);
  const [overview, setOverview] = useState<DiagramGovernanceOverview | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");

  async function load() {
    setStatus("loading");
    setError("");
    try {
      const [response, operations] = await Promise.all([
        diagramGovernanceApi.list(),
        diagramGovernanceApi.overview(),
      ]);
      setEntries(response.entries);
      setOverview(operations);
      setStatus("ready");
    } catch (requestError) {
      setStatus("error");
      setError(messageFor(requestError));
    }
  }

  useEffect(() => {
    const task = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(task);
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return entries.filter((entry) => !normalized || `${entry.title} ${entry.diagram_key}`.toLowerCase().includes(normalized));
  }, [entries, query]);

  return (
    <OperationsModuleShell
      actions={
        <>
          <Link className="inline-flex min-h-10 items-center gap-2 rounded-[10px] border border-[var(--border-default)] bg-white px-3 text-[13px] font-semibold" href="/settings"><ArrowLeft className="h-4 w-4" /> Configuración</Link>
          <AppButton icon={<RefreshCw className="h-4 w-4" />} onClick={() => void load()}>Refrescar</AppButton>
        </>
      }
      description="Controla catálogo, monetización, disponibilidad y ciclo de vida de PromptSpecs sin alterar la selección de proveedor LLM."
      eyebrow="Gobierno de plataforma"
      moduleLabel="Diagramas"
      sessionOptions={[]}
      showSessionContext={false}
      title="Gobierno del Diagram Center"
    >
      {status === "loading" && !entries.length ? <LoadingState title="Cargando gobierno" description="Resolviendo registry y overrides publicados." /> : null}
      {status === "error" ? <ErrorState title="Acceso no disponible" description={error} action={<AppButton onClick={() => void load()}>Reintentar</AppButton>} /> : null}
      {status !== "error" ? (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-4">
            <Panel className="p-4"><Bot className="h-5 w-5 text-[var(--brand-primary)]" /><strong className="mt-3 block text-[16px]">{formatToken(overview?.active_provider ?? "cargando")}</strong><span className="text-[12px] text-[var(--text-secondary)]">{overview?.model_name || "Modelo efectivo"} · solo lectura</span></Panel>
            <Panel className="p-4"><ShieldCheck className="h-5 w-5 text-[var(--brand-primary)]" /><strong className="mt-3 block text-[22px]">{entries.length}</strong><span className="text-[12px] text-[var(--text-secondary)]">Tipos gobernados</span></Panel>
            <Panel className="p-4"><CheckCircle2 className="h-5 w-5 text-[var(--success)]" /><strong className="mt-3 block text-[22px]">{overview?.average_quality_score ?? 0}</strong><span className="text-[12px] text-[var(--text-secondary)]">Calidad media · {overview?.total_versions ?? 0} versiones</span></Panel>
            <Panel className="p-4"><Sparkles className="h-5 w-5 text-[var(--brand-primary)]" /><strong className="mt-3 block text-[14px]">{overview?.prompt_spec_version ?? entries[0]?.prompt_spec_version ?? "—"}</strong><span className="text-[12px] text-[var(--text-secondary)]">PromptSpec baseline activo</span></Panel>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div><p className="text-[11px] font-bold uppercase tracking-[.12em] text-[var(--text-muted)]">Operación</p><h2 className="mt-1 text-[16px] font-semibold">Jobs recientes</h2></div>
                <Activity aria-hidden="true" className="h-5 w-5 text-[var(--brand-primary)]" />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {Object.entries(overview?.job_counts ?? {}).map(([key, value]) => <Badge key={key} tone={key === "error" ? "red" : key === "available" ? "green" : "slate"}>{formatToken(key)} {value}</Badge>)}
              </div>
              <div className="mt-3 divide-y divide-[var(--border-subtle)]">
                {(overview?.recent_jobs ?? []).slice(0, 5).map((job) => (
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-2 text-[11px]" key={job.id}>
                    <div className="min-w-0"><strong className="block truncate text-[var(--text-primary)]">{formatToken(job.diagram_key)}</strong><span className="text-[var(--text-muted)]">{formatTimestamp(job.requested_at)} · {formatToken(job.provider_key || overview?.active_provider || "pendiente")}</span></div>
                    <Badge tone={job.status === "error" ? "red" : job.status === "available" ? "green" : "orange"}>{formatToken(job.status)}</Badge>
                  </div>
                ))}
                {!overview?.recent_jobs.length ? <p className="py-3 text-[12px] text-[var(--text-muted)]">Aún no hay jobs registrados.</p> : null}
              </div>
            </Panel>
            <Panel className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div><p className="text-[11px] font-bold uppercase tracking-[.12em] text-[var(--text-muted)]">Trazabilidad</p><h2 className="mt-1 text-[16px] font-semibold">Cambios administrativos</h2></div>
                <History aria-hidden="true" className="h-5 w-5 text-[var(--brand-primary)]" />
              </div>
              <div className="mt-3 divide-y divide-[var(--border-subtle)]">
                {(overview?.recent_audit ?? []).slice(0, 5).map((event) => (
                  <div className="py-2 text-[11px]" key={event.id}>
                    <strong className="block text-[var(--text-primary)]">{formatToken(event.diagram_key)}</strong>
                    <span className="text-[var(--text-muted)]">{event.changed_fields.map(formatToken).join(", ") || "Sin cambio efectivo"} · {formatTimestamp(event.created_at)}</span>
                  </div>
                ))}
                {!overview?.recent_audit.length ? <p className="py-3 text-[12px] text-[var(--text-muted)]">Los cambios publicados aparecerán aquí sin almacenar prompts en texto plano.</p> : null}
              </div>
            </Panel>
          </div>
          <Panel className="p-3">
            <label className="flex min-h-10 items-center gap-2 rounded-[9px] border border-[var(--border-default)] bg-white px-3">
              <Search aria-hidden="true" className="h-4 w-4 text-[var(--text-muted)]" />
              <span className="sr-only">Buscar tipo de diagrama</span>
              <input className="w-full bg-transparent text-[13px] outline-none" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar tipo o clave…" value={query} />
            </label>
          </Panel>
          <div className="space-y-3">
            {filtered.map((entry) => (
              <GovernanceCard
                entry={entry}
                key={entry.diagram_key}
                onSaved={(updated) => setEntries((current) => current.map((item) => item.diagram_key === updated.diagram_key ? updated : item))}
              />
            ))}
          </div>
        </div>
      ) : null}
    </OperationsModuleShell>
  );
}
