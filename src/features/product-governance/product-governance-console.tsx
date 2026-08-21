"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Boxes,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  Layers3,
  LayoutDashboard,
  RefreshCw,
  Save,
  Search,
} from "lucide-react";
import { AppButton, Badge, KeyValue, Panel, SelectField, TextAreaField } from "@/components/lean/ui";
import type {
  DiagramGovernanceEntry,
  DiagramGovernanceOverview,
  DiagramGovernanceUpdate,
} from "@/features/diagram-center/domain/governance-types";
import { diagramGovernanceApi } from "@/features/diagram-center/infrastructure/diagram-governance-api";
import type {
  DeliverableGovernanceEntry,
  DeliverableGovernanceOverview,
  DeliverableGovernanceUpdate,
  DeliverablePromptStatus,
  DeliverableType,
} from "@/features/deliverables/domain/types";
import { deliverableGovernanceApi } from "@/features/deliverables/infrastructure/deliverable-governance-api";
import { PromptEditor, type GovernanceScope } from "@/features/deliverables/presentation/deliverable-governance-page";
import {
  AdminSourceNote,
  AdminViewState,
} from "@/features/operations/components/admin-console-primitives";
import type { ProductGovernanceTabKey } from "@/features/operations/settings-admin-navigation";

type ProductGovernanceConsoleProps = {
  activeTab: ProductGovernanceTabKey;
  isPlatformAdmin: boolean;
};

type LoadStatus = "idle" | "loading" | "ready" | "error";

const TAB_DETAILS: Record<ProductGovernanceTabKey, {
  description: string;
  icon: typeof LayoutDashboard;
  title: string;
}> = {
  summary: {
    description: "Cobertura agregada por producto, etapa, disponibilidad, tier y seÃ±ales de calidad.",
    icon: LayoutDashboard,
    title: "Resumen de gobierno de producto",
  },
  diagrams: {
    description: "AdministraciÃ³n de disponibilidad, PromptSpec, contratos, generaciÃ³n y auditorÃ­a de diagramas.",
    icon: Layers3,
    title: "AdministraciÃ³n de diagramas",
  },
  artifacts: {
    description: "Documentos y artefactos generados por LLM o gobernados por el catÃ¡logo de entregables.",
    icon: FileText,
    title: "Artefactos y documentos",
  },
  components: {
    description: "Componentes que conforman entregables de Blueprint, Blueprint Pro y ACP.",
    icon: Boxes,
    title: "Componentes de entrega",
  },
  audit: {
    description: "Trazabilidad de cambios, jobs de generaciÃ³n, quality snapshots y validaciones de prompt.",
    icon: Activity,
    title: "AuditorÃ­a y calidad",
  },
};

const TIER_OPTIONS = [
  { label: "Blueprint", value: "blueprint" },
  { label: "Blueprint Pro", value: "blueprint_pro" },
  { label: "ACP", value: "acp" },
];

const PREVIEW_OPTIONS = [
  { label: "Completa", value: "full" },
  { label: "Limitada", value: "limited" },
  { label: "Bloqueada", value: "none" },
];

const PROMPT_STATUS_OPTIONS: Array<{ label: string; value: DiagramGovernanceUpdate["prompt_status"] }> = [
  { label: "Activo", value: "active" },
  { label: "Borrador", value: "draft" },
  { label: "Retirado", value: "retired" },
];

const DELIVERABLE_PROMPT_STATUS_OPTIONS: Array<{ label: string; value: DeliverablePromptStatus }> = [
  { label: "Activo", value: "active" },
  { label: "Borrador", value: "draft" },
  { label: "Deprecated", value: "deprecated" },
  { label: "Pausado", value: "paused" },
  { label: "Revisar", value: "needs_review" },
];

const BOOLEAN_OPTIONS = [
  { label: "Habilitado", value: "true" },
  { label: "Deshabilitado", value: "false" },
];

const GOVERNED_ARTIFACT_TYPES = new Set<DeliverableType>(["artifact", "document", "contract", "prompt", "lineage"]);

function formatToken(value: string | null | undefined) {
  return String(value || "n/a").replace(/[_-]+/g, " ");
}

function formatTimestamp(value: string | null | undefined) {
  if (!value) {
    return "Sin cambios";
  }
  try {
    return new Intl.DateTimeFormat("es-CO", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function messageFor(error: unknown, fallback = "No fue posible completar la operaciÃ³n.") {
  return error instanceof Error ? error.message : fallback;
}

function toJsonText(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2);
}

function parseJsonObject(value: string) {
  const parsed = JSON.parse(value || "{}") as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("El override debe ser un objeto JSON.");
  }
  return parsed as Record<string, unknown>;
}

function toDiagramDraft(entry: DiagramGovernanceEntry): DiagramGovernanceUpdate {
  return {
    enabled: entry.enabled,
    generation_enabled: entry.generation_enabled,
    notes: entry.notes ?? "",
    preview_mode_override: entry.preview_mode,
    prompt_override: entry.prompt_override ?? {},
    prompt_status: entry.prompt_status,
    required_tier_override: entry.required_tier,
  };
}

function toDeliverableDraft(entry: DeliverableGovernanceEntry): DeliverableGovernanceUpdate {
  return {
    enabled: entry.enabled,
    generation_enabled: entry.generation_enabled,
    notes: entry.notes ?? "",
    preview_mode_override: entry.preview_mode,
    prompt_override: entry.prompt_override ?? {},
    prompt_status: entry.prompt_status,
    required_tier_override: entry.required_tier,
  };
}

function diagramStatusTone(entry: DiagramGovernanceEntry) {
  if (!entry.active || !entry.enabled) {
    return "slate" as const;
  }
  if (!entry.generation_enabled) {
    return "orange" as const;
  }
  return "green" as const;
}

function deliverableStatusTone(entry: DeliverableGovernanceEntry) {
  if (!entry.active || !entry.enabled) {
    return "slate" as const;
  }
  if (!entry.generation_enabled || entry.prompt_status === "paused" || entry.prompt_status === "needs_review") {
    return "orange" as const;
  }
  return "green" as const;
}

function qualityStateTone(state: string | null | undefined) {
  if (state === "passed") {
    return "green" as const;
  }
  if (state === "warning" || state === "stale") {
    return "orange" as const;
  }
  if (state === "failed") {
    return "red" as const;
  }
  return "slate" as const;
}

function JsonPolicyBlock({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  return (
    <Panel className="border-[var(--border-default)] bg-[var(--surface-subtle)] p-4">
      <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">{label}</p>
      <pre className="mt-3 max-h-[220px] overflow-auto rounded-[14px] border border-[var(--border-default)] bg-white p-3 text-[11px] leading-5 text-[var(--text-secondary)]">
        {toJsonText(value)}
      </pre>
    </Panel>
  );
}

function DiagramGovernanceRow({
  entry,
  onSaved,
}: {
  entry: DiagramGovernanceEntry;
  onSaved: (entry: DiagramGovernanceEntry) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState<DiagramGovernanceUpdate>(() => toDiagramDraft(entry));
  const [overrideText, setOverrideText] = useState(() => toJsonText(entry.prompt_override));
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const promptSpec = entry.prompt_spec;

  async function save() {
    setSaving(true);
    setFeedback(null);
    setJsonError(null);
    try {
      const promptOverride = parseJsonObject(overrideText);
      const updated = await diagramGovernanceApi.update(entry.diagram_key, {
        ...draft,
        prompt_override: promptOverride,
      });
      setDraft(toDiagramDraft(updated));
      setOverrideText(toJsonText(updated.prompt_override));
      onSaved(updated);
      setFeedback("PolÃ­tica de diagrama publicada.");
    } catch (error) {
      const message = messageFor(error);
      if (message.toLowerCase().includes("json") || message.toLowerCase().includes("override")) {
        setJsonError(message);
      }
      setFeedback(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Fragment>
      <tr className="border-b border-[var(--border-subtle)] bg-white align-top">
        <td className="px-4 py-3">
          <p className="text-[13px] font-semibold text-[var(--text-primary)]">{entry.title}</p>
          <p className="mt-1 font-mono text-[11px] text-[var(--text-muted)]">{entry.diagram_key}</p>
          <p className="mt-1 line-clamp-2 text-[12px] text-[var(--text-secondary)]">{entry.description}</p>
        </td>
        <td className="hidden px-4 py-3 text-[12px] text-[var(--text-secondary)] lg:table-cell">
          <p className="font-semibold text-[var(--text-primary)]">{formatToken(entry.category)}</p>
          <p className="mt-1">{formatToken(entry.diagram_surface || entry.notation)}</p>
        </td>
        <td className="hidden px-4 py-3 xl:table-cell">
          <div className="flex flex-wrap gap-1.5">
            {entry.product_scope.map((product) => (
              <Badge key={`${entry.diagram_key}-${product}`} tone={product === "acp" ? "violet" : product === "blueprint_pro" ? "blue" : "green"}>
                {formatToken(product)}
              </Badge>
            ))}
          </div>
        </td>
        <td className="hidden px-4 py-3 text-[12px] font-semibold text-[var(--text-secondary)] md:table-cell">
          {formatToken(entry.required_tier)}
        </td>
        <td className="hidden px-4 py-3 text-[12px] text-[var(--text-secondary)] xl:table-cell">
          {formatToken(entry.enabled_from_stage)}
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-col items-start gap-1.5">
            <Badge tone={diagramStatusTone(entry)}>{entry.enabled ? "Visible" : "Oculto"}</Badge>
            <Badge tone={entry.generation_enabled ? "blue" : "orange"}>{entry.generation_enabled ? "Genera" : "Suspendido"}</Badge>
          </div>
        </td>
        <td className="hidden px-4 py-3 md:table-cell">
          <Badge tone={entry.prompt_status === "active" ? "blue" : "orange"}>{formatToken(entry.prompt_status)}</Badge>
        </td>
        <td className="hidden px-4 py-3 text-[12px] text-[var(--text-secondary)] 2xl:table-cell">
          {formatTimestamp(entry.updated_at)}
        </td>
        <td className="px-4 py-2 text-right">
          <button
            aria-expanded={expanded}
            aria-label={expanded ? `Contraer ${entry.title}` : `Expandir ${entry.title}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[12px] border border-[var(--border-default)] bg-white text-[var(--brand-primary)] transition hover:bg-[var(--brand-soft)]"
            type="button"
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </td>
      </tr>
      {expanded ? (
        <tr className="border-b border-[var(--border-default)] bg-[var(--surface-subtle)]">
          <td className="px-4 py-4" colSpan={9}>
            <div className="grid gap-4 rounded-[18px] border border-[var(--border-default)] bg-white p-4 xl:grid-cols-[minmax(0,1fr)_420px]">
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <KeyValue label="Contrato fuente" value={String(promptSpec.source_contract || promptSpec.output_contract)} hint="PromptSpec efectivo" />
                  <KeyValue label="Renderer" value={String(promptSpec.renderer_key || "n/a")} hint="Renderizado configurado" />
                  <KeyValue label="Validador" value={String(promptSpec.validator_key || "n/a")} hint="Quality gate tÃ©cnico" />
                  <KeyValue label="Formato preferido" value={String(entry.formats.preferred || "n/a")} hint={(entry.formats.available ?? []).join(", ") || "Sin formatos"} />
                  <KeyValue label="Access level" value={formatToken(entry.access_level)} hint="CatÃ¡logo de producto" />
                  <KeyValue label="GeneraciÃ³n default" value={formatToken(entry.default_generation_state)} hint="TaxonomÃ­a" />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Panel className="border-[var(--border-default)] bg-[var(--surface-subtle)] p-4">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Inputs y calidad</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {promptSpec.required_inputs.map((input) => <Badge key={`${entry.diagram_key}-${input}`} tone="slate">{input}</Badge>)}
                      {promptSpec.quality_gates.map((gate) => <Badge key={`${entry.diagram_key}-${gate}`} tone="blue">{gate}</Badge>)}
                    </div>
                  </Panel>
                  <Panel className="border-[var(--border-default)] bg-[var(--surface-subtle)] p-4">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Fuentes y rutas</p>
                    <div className="mt-3 space-y-2 text-[12px] leading-5 text-[var(--text-secondary)]">
                      <p><strong>Artifacts:</strong> {entry.source_artifact_keys.join(", ") || "Sin fuentes declaradas"}</p>
                      <p><strong>Portable:</strong> {entry.portable_paths.join(", ") || "Sin rutas portables"}</p>
                    </div>
                  </Panel>
                </div>

                <TextAreaField
                  label="Prompt override JSON"
                  error={jsonError ?? undefined}
                  hint="Mantiene compatibilidad total con overrides avanzados: notation, contracts, renderer, validator, layout_guidance, objective, semantic_rules y exclusions."
                  rows={10}
                  value={overrideText}
                  onValueChange={setOverrideText}
                />
              </div>

              <div className="space-y-3 rounded-[18px] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4">
                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">PolÃ­tica editable</p>
                <SelectField
                  label="Visibilidad"
                  options={BOOLEAN_OPTIONS}
                  value={String(draft.enabled)}
                  onValueChange={(value) => setDraft((current) => ({ ...current, enabled: value === "true" }))}
                />
                <SelectField
                  label="GeneraciÃ³n"
                  options={BOOLEAN_OPTIONS}
                  value={String(draft.generation_enabled)}
                  onValueChange={(value) => setDraft((current) => ({ ...current, generation_enabled: value === "true" }))}
                />
                <SelectField
                  label="Tier requerido"
                  options={TIER_OPTIONS}
                  value={draft.required_tier_override}
                  onValueChange={(value) => setDraft((current) => ({ ...current, required_tier_override: value }))}
                />
                <SelectField
                  label="Preview"
                  options={PREVIEW_OPTIONS}
                  value={draft.preview_mode_override}
                  onValueChange={(value) => setDraft((current) => ({ ...current, preview_mode_override: value }))}
                />
                <SelectField
                  label="Prompt"
                  options={PROMPT_STATUS_OPTIONS}
                  value={draft.prompt_status}
                  onValueChange={(value) => setDraft((current) => ({ ...current, prompt_status: value as DiagramGovernanceUpdate["prompt_status"] }))}
                />
                <TextAreaField
                  label="Notas de gobierno"
                  rows={4}
                  value={draft.notes}
                  onValueChange={(value) => setDraft((current) => ({ ...current, notes: value }))}
                />
                <AppButton className="w-full" icon={<Save className="h-4 w-4" />} loading={saving} onClick={() => void save()} variant="primary">
                  Guardar polÃ­tica
                </AppButton>
                {feedback ? <p className="text-[12px] font-semibold text-[var(--text-secondary)]" role="status">{feedback}</p> : null}
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </Fragment>
  );
}

function DiagramGovernanceTable({
  entries,
  onSaved,
}: {
  entries: DiagramGovernanceEntry[];
  onSaved: (entry: DiagramGovernanceEntry) => void;
}) {
  return (
    <Panel className="overflow-hidden p-0">
      <div className="border-b border-[var(--border-default)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[20px] font-semibold text-[var(--text-primary)]">Gobierno de diagramas</p>
            <p className="mt-1 max-w-3xl text-[13px] leading-6 text-[var(--text-secondary)]">
              Fila principal para lectura rÃ¡pida; el acordeÃ³n conserva contratos, PromptSpec, rutas y acciones avanzadas.
            </p>
          </div>
          <Badge tone="violet">{entries.length} diagramas</Badge>
        </div>
      </div>
      <div className="overflow-hidden">
        <table className="w-full table-auto border-collapse text-left">
          <thead>
            <tr className="border-b border-[var(--border-default)] bg-[var(--surface-subtle)] text-[12px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
              <th className="px-4 py-3 font-semibold">Diagrama</th>
              <th className="hidden px-4 py-3 font-semibold lg:table-cell">CategorÃ­a</th>
              <th className="hidden px-4 py-3 font-semibold xl:table-cell">Producto</th>
              <th className="hidden px-4 py-3 font-semibold md:table-cell">Tier</th>
              <th className="hidden px-4 py-3 font-semibold xl:table-cell">Etapa</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="hidden px-4 py-3 font-semibold md:table-cell">Prompt</th>
              <th className="hidden px-4 py-3 font-semibold 2xl:table-cell">Actualizado</th>
              <th className="px-4 py-3 text-right font-semibold">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <DiagramGovernanceRow entry={entry} key={entry.diagram_key} onSaved={onSaved} />
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function DiagramGovernancePanel({
  entries,
  error,
  filteredEntries,
  onQueryChange,
  onRefresh,
  onSaved,
  overview,
  query,
  status,
}: {
  entries: DiagramGovernanceEntry[];
  error: string | null;
  filteredEntries: DiagramGovernanceEntry[];
  onQueryChange: (value: string) => void;
  onRefresh: () => void;
  onSaved: (entry: DiagramGovernanceEntry) => void;
  overview: DiagramGovernanceOverview | null;
  query: string;
  status: LoadStatus;
}) {
  if ((status === "idle" || status === "loading") && !entries.length) {
    return <AdminViewState state="loading" title="Cargando gobierno de diagramas" description="Resolviendo registry, taxonomÃ­a y overrides publicados." />;
  }

  if (status === "error") {
    return (
      <AdminViewState
        action={<AppButton onClick={onRefresh}>Reintentar</AppButton>}
        state="error"
        title="No se pudo cargar diagramas"
        description={error ?? "El endpoint administrativo de diagramas no respondiÃ³ correctamente."}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-4">
        <Panel className="p-4"><Layers3 className="h-5 w-5 text-[var(--brand-primary)]" /><strong className="mt-3 block text-[22px]">{entries.length}</strong><span className="text-[12px] text-[var(--text-secondary)]">Tipos gobernados</span></Panel>
        <Panel className="p-4"><CheckCircle2 className="h-5 w-5 text-[var(--success)]" /><strong className="mt-3 block text-[22px]">{entries.filter((entry) => entry.enabled).length}</strong><span className="text-[12px] text-[var(--text-secondary)]">Visibles</span></Panel>
        <Panel className="p-4"><Activity className="h-5 w-5 text-[var(--brand-primary)]" /><strong className="mt-3 block text-[22px]">{overview?.average_quality_score ?? 0}</strong><span className="text-[12px] text-[var(--text-secondary)]">Calidad media Â· {overview?.total_versions ?? 0} versiones</span></Panel>
        <Panel className="p-4"><FileText className="h-5 w-5 text-[var(--brand-primary)]" /><strong className="mt-3 block text-[14px]">{overview?.prompt_spec_version ?? entries[0]?.prompt_spec_version ?? "â€”"}</strong><span className="text-[12px] text-[var(--text-secondary)]">PromptSpec baseline</span></Panel>
      </div>

      <Panel className="p-3">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_auto]">
          <label className="flex min-h-10 items-center gap-2 rounded-[9px] border border-[var(--border-default)] bg-white px-3">
            <Search aria-hidden="true" className="h-4 w-4 text-[var(--text-muted)]" />
            <span className="sr-only">Buscar diagrama</span>
            <input className="w-full bg-transparent text-[13px] outline-none" onChange={(event) => onQueryChange(event.target.value)} placeholder="Buscar por nombre, clave, producto, etapa o categorÃ­a..." value={query} />
          </label>
          <AppButton icon={<RefreshCw className="h-4 w-4" />} onClick={onRefresh} variant="secondary">
            Refrescar
          </AppButton>
        </div>
      </Panel>

      {status === "loading" ? (
        <p className="text-[12px] font-semibold text-[var(--text-secondary)]">Actualizando datos de diagramas...</p>
      ) : null}

      {filteredEntries.length ? (
        <DiagramGovernanceTable entries={filteredEntries} onSaved={onSaved} />
      ) : (
        <AdminViewState state="empty" title="Sin diagramas para este filtro" description="Ajusta la bÃºsqueda para volver al catÃ¡logo completo." />
      )}
    </div>
  );
}

function DeliverableGovernanceRow({
  entry,
  onSaved,
  scope,
}: {
  entry: DeliverableGovernanceEntry;
  onSaved: (entry: DeliverableGovernanceEntry) => void;
  scope: GovernanceScope;
}) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState<DeliverableGovernanceUpdate>(() => toDeliverableDraft(entry));
  const [overrideText, setOverrideText] = useState(() => toJsonText(entry.prompt_override));
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setFeedback(null);
    setJsonError(null);
    try {
      const promptOverride = parseJsonObject(overrideText);
      const updated = await deliverableGovernanceApi.update(entry.deliverable_key, {
        ...draft,
        prompt_override: promptOverride,
      }, scope);
      setDraft(toDeliverableDraft(updated));
      setOverrideText(toJsonText(updated.prompt_override));
      onSaved(updated);
      setFeedback("PolÃ­tica de entregable publicada.");
    } catch (error) {
      const message = messageFor(error);
      if (message.toLowerCase().includes("json") || message.toLowerCase().includes("override")) {
        setJsonError(message);
      }
      setFeedback(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Fragment>
      <tr className="border-b border-[var(--border-subtle)] bg-white align-top">
        <td className="px-4 py-3">
          <p className="text-[13px] font-semibold text-[var(--text-primary)]">{entry.title}</p>
          <p className="mt-1 font-mono text-[11px] text-[var(--text-muted)]">{entry.deliverable_key}</p>
          <p className="mt-1 line-clamp-2 text-[12px] text-[var(--text-secondary)]">{entry.description}</p>
        </td>
        <td className="hidden px-4 py-3 text-[12px] text-[var(--text-secondary)] lg:table-cell">
          <p className="font-semibold text-[var(--text-primary)]">{formatToken(entry.deliverable_type)}</p>
          <p className="mt-1">{formatToken(entry.category)}</p>
        </td>
        <td className="hidden px-4 py-3 text-[12px] text-[var(--text-secondary)] md:table-cell">
          {formatToken(entry.stage)} Â· desde {formatToken(entry.enabled_from_stage)}
        </td>
        <td className="hidden px-4 py-3 xl:table-cell">
          <div className="flex flex-wrap gap-1.5">
            {entry.product_scope.map((product) => (
              <Badge key={`${entry.deliverable_key}-${product}`} tone={product === "acp" ? "violet" : product === "blueprint_pro" ? "blue" : "green"}>
                {formatToken(product)}
              </Badge>
            ))}
          </div>
        </td>
        <td className="hidden px-4 py-3 text-[12px] font-semibold text-[var(--text-secondary)] xl:table-cell">
          {formatToken(entry.required_tier)}
        </td>
        <td className="hidden px-4 py-3 text-[12px] text-[var(--text-secondary)] 2xl:table-cell">
          {formatToken(entry.access_level)}
        </td>
        <td className="hidden px-4 py-3 text-[12px] text-[var(--text-secondary)] 2xl:table-cell">
          {formatToken(entry.generation_mode)}
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-col items-start gap-1.5">
            <Badge tone={deliverableStatusTone(entry)}>{entry.enabled ? "Visible" : "Oculto"}</Badge>
            <Badge tone={entry.prompt_status === "active" ? "blue" : "orange"}>{formatToken(entry.prompt_status)}</Badge>
          </div>
        </td>
        <td className="px-4 py-2 text-right">
          <button
            aria-expanded={expanded}
            aria-label={expanded ? `Contraer ${entry.title}` : `Expandir ${entry.title}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[12px] border border-[var(--border-default)] bg-white text-[var(--brand-primary)] transition hover:bg-[var(--brand-soft)]"
            type="button"
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </td>
      </tr>
      {expanded ? (
        <tr className="border-b border-[var(--border-default)] bg-[var(--surface-subtle)]">
          <td className="px-4 py-4" colSpan={9}>
            <div className="grid gap-4 rounded-[18px] border border-[var(--border-default)] bg-white p-4 xl:grid-cols-[minmax(0,1fr)_420px]">
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <KeyValue label="Formato" value={entry.formats.preferred} hint={entry.formats.available.join(", ")} />
                  <KeyValue label="Downloads" value={`${entry.blueprint_download ? "Blueprint" : "â€”"} / ${entry.acp_download ? "ACP" : "â€”"}`} hint={entry.exportable ? "Exportable" : "No exportable"} />
                  <KeyValue label="Scope" value={entry.scope_key} hint={entry.workspace_id ?? "platform"} />
                  <KeyValue label="Prompt template" value={entry.prompt_policy.prompt_template_key || "n/a"} hint={`v${entry.prompt_policy.prompt_version}`} />
                  <KeyValue label="Schema" value={entry.prompt_policy.schema_contract || entry.quality_policy.schema_contract} hint={entry.prompt_policy.validator_key || entry.quality_policy.validator_key} />
                  <KeyValue label="Actualizado" value={formatTimestamp(entry.updated_at)} hint="Override governance" />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <JsonPolicyBlock label="Prompt policy" value={entry.prompt_policy} />
                  <JsonPolicyBlock label="Context policy" value={entry.context_policy} />
                  <JsonPolicyBlock label="Quality policy" value={entry.quality_policy} />
                  <JsonPolicyBlock label="Dependency policy" value={entry.dependency_policy} />
                  <JsonPolicyBlock label="Access policy" value={entry.access_policy} />
                  <JsonPolicyBlock label="Rutas" value={{ canonical_paths: entry.canonical_paths, portable_paths: entry.portable_paths }} />
                </div>

                <TextAreaField
                  label="Prompt override JSON"
                  error={jsonError ?? undefined}
                  hint="Permite conservar overrides avanzados por artefacto/componente sin perder compatibilidad con el contrato actual."
                  rows={8}
                  value={overrideText}
                  onValueChange={setOverrideText}
                />

                {editingPrompt ? (
                  <PromptEditor
                    deliverableKey={entry.deliverable_key}
                    onClose={() => setEditingPrompt(false)}
                    scope={scope}
                  />
                ) : null}
              </div>

              <div className="space-y-3 rounded-[18px] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4">
                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">PolÃ­tica editable</p>
                <SelectField
                  label="Visibilidad"
                  options={BOOLEAN_OPTIONS}
                  value={String(draft.enabled)}
                  onValueChange={(value) => setDraft((current) => ({ ...current, enabled: value === "true" }))}
                />
                <SelectField
                  label="GeneraciÃ³n"
                  options={BOOLEAN_OPTIONS}
                  value={String(draft.generation_enabled)}
                  onValueChange={(value) => setDraft((current) => ({ ...current, generation_enabled: value === "true" }))}
                />
                <SelectField
                  label="Tier requerido"
                  options={TIER_OPTIONS}
                  value={draft.required_tier_override}
                  onValueChange={(value) => setDraft((current) => ({ ...current, required_tier_override: value }))}
                />
                <SelectField
                  label="Preview"
                  options={PREVIEW_OPTIONS}
                  value={draft.preview_mode_override}
                  onValueChange={(value) => setDraft((current) => ({ ...current, preview_mode_override: value }))}
                />
                <SelectField
                  label="Prompt"
                  options={DELIVERABLE_PROMPT_STATUS_OPTIONS}
                  value={draft.prompt_status}
                  onValueChange={(value) => setDraft((current) => ({ ...current, prompt_status: value as DeliverablePromptStatus }))}
                />
                <TextAreaField
                  label="Notas de gobierno"
                  rows={4}
                  value={draft.notes}
                  onValueChange={(value) => setDraft((current) => ({ ...current, notes: value }))}
                />
                <AppButton className="w-full" onClick={() => setEditingPrompt((value) => !value)} variant="secondary">
                  {editingPrompt ? "Ocultar PromptSpec" : "Editar PromptSpec"}
                </AppButton>
                <AppButton className="w-full" icon={<Save className="h-4 w-4" />} loading={saving} onClick={() => void save()} variant="primary">
                  Guardar polÃ­tica
                </AppButton>
                {feedback ? <p className="text-[12px] font-semibold text-[var(--text-secondary)]" role="status">{feedback}</p> : null}
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </Fragment>
  );
}

function ProductCoverageMatrix({ entries }: { entries: DeliverableGovernanceEntry[] }) {
  const products = ["blueprint", "blueprint_pro", "acp"];
  const stages = Array.from(new Set(entries.map((entry) => entry.stage))).filter(Boolean);

  return (
    <Panel className="p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[17px] font-semibold text-[var(--text-primary)]">Matriz producto Ã— etapa</p>
          <p className="mt-1 text-[13px] leading-6 text-[var(--text-secondary)]">
            Conteo de componentes activos por producto y etapa usando `product_scope` del catÃ¡logo canÃ³nico.
          </p>
        </div>
        <Badge tone="blue">{entries.length} componentes</Badge>
      </div>
      <div className="overflow-hidden">
        <table className="w-full min-w-[680px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[var(--border-default)] bg-[var(--surface-subtle)] text-[12px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
              <th className="px-4 py-3 font-semibold">Producto</th>
              {stages.map((stage) => <th className="px-4 py-3 font-semibold" key={stage}>{formatToken(stage)}</th>)}
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr className="border-b border-[var(--border-subtle)]" key={product}>
                <td className="px-4 py-3"><Badge tone={product === "acp" ? "violet" : product === "blueprint_pro" ? "blue" : "green"}>{formatToken(product)}</Badge></td>
                {stages.map((stage) => (
                  <td className="px-4 py-3 text-[13px] font-semibold text-[var(--text-primary)]" key={`${product}-${stage}`}>
                    {entries.filter((entry) => entry.stage === stage && entry.product_scope.includes(product)).length}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function DeliverableGovernanceTable({
  entries,
  onSaved,
  scope,
  title,
}: {
  entries: DeliverableGovernanceEntry[];
  onSaved: (entry: DeliverableGovernanceEntry) => void;
  scope: GovernanceScope;
  title: string;
}) {
  return (
    <Panel className="overflow-hidden p-0">
      <div className="border-b border-[var(--border-default)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[20px] font-semibold text-[var(--text-primary)]">{title}</p>
            <p className="mt-1 max-w-3xl text-[13px] leading-6 text-[var(--text-secondary)]">
              Tabla operativa con polÃ­ticas, rutas, PromptSpec y acciones secundarias dentro del acordeÃ³n.
            </p>
          </div>
          <Badge tone="violet">{entries.length} registros</Badge>
        </div>
      </div>
      <div className="overflow-hidden">
        <table className="w-full table-auto border-collapse text-left">
          <thead>
            <tr className="border-b border-[var(--border-default)] bg-[var(--surface-subtle)] text-[12px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
              <th className="px-4 py-3 font-semibold">Componente</th>
              <th className="hidden px-4 py-3 font-semibold lg:table-cell">Tipo</th>
              <th className="hidden px-4 py-3 font-semibold md:table-cell">Etapa</th>
              <th className="hidden px-4 py-3 font-semibold xl:table-cell">Producto</th>
              <th className="hidden px-4 py-3 font-semibold xl:table-cell">Tier</th>
              <th className="hidden px-4 py-3 font-semibold 2xl:table-cell">Access</th>
              <th className="hidden px-4 py-3 font-semibold 2xl:table-cell">GeneraciÃ³n</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3 text-right font-semibold">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <DeliverableGovernanceRow
                entry={entry}
                key={`${scope}-${entry.deliverable_key}`}
                onSaved={onSaved}
                scope={scope}
              />
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function DeliverableGovernancePanel({
  entries,
  error,
  filteredEntries,
  mode,
  onQueryChange,
  onRefresh,
  onSaved,
  onScopeChange,
  overview,
  query,
  scope,
  status,
}: {
  entries: DeliverableGovernanceEntry[];
  error: string | null;
  filteredEntries: DeliverableGovernanceEntry[];
  mode: "artifacts" | "components";
  onQueryChange: (value: string) => void;
  onRefresh: () => void;
  onSaved: (entry: DeliverableGovernanceEntry) => void;
  onScopeChange: (scope: GovernanceScope) => void;
  overview: DeliverableGovernanceOverview | null;
  query: string;
  scope: GovernanceScope;
  status: LoadStatus;
}) {
  if ((status === "idle" || status === "loading") && !entries.length) {
    return <AdminViewState state="loading" title="Cargando gobierno de entregables" description="Resolviendo catÃ¡logo, overrides, policies y auditorÃ­a." />;
  }

  if (status === "error") {
    return (
      <AdminViewState
        action={<AppButton onClick={onRefresh}>Reintentar</AppButton>}
        state="error"
        title="No se pudo cargar entregables"
        description={error ?? "El endpoint administrativo de entregables no respondiÃ³ correctamente."}
      />
    );
  }

  const title = mode === "artifacts" ? "Artefactos y documentos" : "Componentes de entrega";

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-4">
        <Panel className="p-4"><Boxes className="h-5 w-5 text-[var(--brand-primary)]" /><strong className="mt-3 block text-[22px]">{overview?.total_entries ?? entries.length}</strong><span className="text-[12px] text-[var(--text-secondary)]">CatÃ¡logo total</span></Panel>
        <Panel className="p-4"><CheckCircle2 className="h-5 w-5 text-[var(--success)]" /><strong className="mt-3 block text-[22px]">{overview?.active_entries ?? entries.filter((entry) => entry.active).length}</strong><span className="text-[12px] text-[var(--text-secondary)]">Activos</span></Panel>
        <Panel className="p-4"><Activity className="h-5 w-5 text-[var(--brand-primary)]" /><strong className="mt-3 block text-[22px]">{overview?.governed_entries ?? 0}</strong><span className="text-[12px] text-[var(--text-secondary)]">Con override</span></Panel>
        <Panel className="p-4"><FileText className="h-5 w-5 text-[var(--brand-primary)]" /><strong className="mt-3 block text-[14px]">{overview?.registry_version ?? "deliverable-catalog.v1"}</strong><span className="text-[12px] text-[var(--text-secondary)]">CatÃ¡logo canÃ³nico</span></Panel>
      </div>

      <Panel className="p-3">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_auto]">
          <label className="flex min-h-10 items-center gap-2 rounded-[9px] border border-[var(--border-default)] bg-white px-3">
            <Search aria-hidden="true" className="h-4 w-4 text-[var(--text-muted)]" />
            <span className="sr-only">Buscar entregable</span>
            <input className="w-full bg-transparent text-[13px] outline-none" onChange={(event) => onQueryChange(event.target.value)} placeholder="Buscar por nombre, clave, producto, etapa, tipo o policy..." value={query} />
          </label>
          <SelectField
            label="Scope"
            options={[{ label: "Plataforma", value: "platform" }, { label: "Workspace", value: "workspace" }]}
            value={scope}
            onValueChange={(value) => onScopeChange(value as GovernanceScope)}
          />
          <AppButton icon={<RefreshCw className="h-4 w-4" />} onClick={onRefresh} variant="secondary">
            Refrescar
          </AppButton>
        </div>
      </Panel>

      {mode === "components" ? <ProductCoverageMatrix entries={filteredEntries} /> : null}

      {status === "loading" ? (
        <p className="text-[12px] font-semibold text-[var(--text-secondary)]">Actualizando entregables...</p>
      ) : null}

      {filteredEntries.length ? (
        <DeliverableGovernanceTable entries={filteredEntries} onSaved={onSaved} scope={scope} title={title} />
      ) : (
        <AdminViewState state="empty" title="Sin registros para este filtro" description="Ajusta bÃºsqueda, scope o tab para revisar el catÃ¡logo completo." />
      )}
    </div>
  );
}

export function ProductGovernanceFilters() {
  return (
    <Panel className="p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="slate">Producto</Badge>
        <Badge tone="slate">Etapa</Badge>
        <Badge tone="slate">Tier</Badge>
        <Badge tone="slate">Access level</Badge>
        <Badge tone="slate">GeneraciÃ³n</Badge>
      </div>
      <p className="mt-3 text-[12px] leading-5 text-[var(--text-secondary)]">
        Los filtros quedan centralizados para las tablas de Diagramas, Artefactos y Componentes. En las siguientes fases
        se conectan a los endpoints enriquecidos de gobierno.
      </p>
    </Panel>
  );
}

type GovernanceAuditRow = {
  action: string;
  createdAt: string | null;
  detail: unknown;
  fields: string[];
  id: string;
  key: string;
  scope: string;
  source: "Diagrama" | "Entregable" | "Job diagrama" | "Quality entregable";
};

export function GovernanceAuditTable({
  deliverableOverview,
  diagramOverview,
  loading,
  onRefresh,
}: {
  deliverableOverview: DeliverableGovernanceOverview | null;
  diagramOverview: DiagramGovernanceOverview | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const rows = useMemo<GovernanceAuditRow[]>(() => {
    const diagramAudit = (diagramOverview?.recent_audit ?? []).map((event) => ({
      action: event.action || "governance_update",
      createdAt: event.created_at,
      detail: event,
      fields: event.changed_fields,
      id: `diagram-audit-${event.id}`,
      key: event.diagram_key,
      scope: "platform",
      source: "Diagrama" as const,
    }));
    const deliverableAudit = (deliverableOverview?.recent_audit ?? []).map((event) => ({
      action: event.action || "governance_update",
      createdAt: event.created_at,
      detail: event,
      fields: event.changed_fields,
      id: `deliverable-audit-${event.id}`,
      key: event.deliverable_key,
      scope: event.scope_key,
      source: "Entregable" as const,
    }));
    const diagramJobs = (diagramOverview?.recent_jobs ?? []).map((job) => ({
      action: job.status,
      createdAt: job.requested_at,
      detail: job,
      fields: [job.provider_key, job.model_name, job.prompt_spec_version].filter(Boolean),
      id: `diagram-job-${job.id}`,
      key: job.diagram_key,
      scope: job.project_id,
      source: "Job diagrama" as const,
    }));
    const deliverableQuality = (deliverableOverview?.quality_summary?.recent_snapshots ?? []).map((snapshot) => ({
      action: snapshot.state || "quality_snapshot",
      createdAt: snapshot.created_at,
      detail: snapshot,
      fields: [
        `score ${snapshot.score}`,
        snapshot.stage,
        ...snapshot.product_scope,
        snapshot.errors_count ? `${snapshot.errors_count} errores` : "",
        snapshot.warnings_count ? `${snapshot.warnings_count} warnings` : "",
      ].filter(Boolean),
      id: `deliverable-quality-${snapshot.id}`,
      key: snapshot.deliverable_key,
      scope: snapshot.version_ref || snapshot.session_id,
      source: "Quality entregable" as const,
    }));
    return [...diagramAudit, ...deliverableAudit, ...diagramJobs, ...deliverableQuality].sort((a, b) =>
      String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")),
    );
  }, [deliverableOverview, diagramOverview]);

  return (
    <Panel className="overflow-hidden p-0">
      <div className="border-b border-[var(--border-default)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[20px] font-semibold text-[var(--text-primary)]">AuditorÃ­a y calidad</p>
            <p className="mt-1 max-w-3xl text-[13px] leading-6 text-[var(--text-secondary)]">
              Consolida auditorÃ­a reciente de diagramas, auditorÃ­a de entregables y jobs de generaciÃ³n disponibles en
              los endpoints actuales, incluyendo quality snapshots persistidos de entregables.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="blue">{rows.length} eventos</Badge>
            <Badge tone={deliverableOverview?.quality_summary?.total_snapshots ? "green" : "slate"}>
              {deliverableOverview?.quality_summary?.total_snapshots ?? 0} snapshots
            </Badge>
            <AppButton icon={<RefreshCw className="h-4 w-4" />} onClick={onRefresh} variant="secondary">
              Refrescar
            </AppButton>
          </div>
        </div>
      </div>

      {loading && !rows.length ? (
        <div className="p-5">
          <AdminViewState state="loading" title="Cargando auditorÃ­a" description="Resolviendo eventos recientes de diagramas y entregables." />
        </div>
      ) : null}

      {!loading && !rows.length ? (
        <div className="p-5">
          <AdminViewState state="empty" title="Sin auditorÃ­a reciente" description="Los cambios de gobierno y jobs aparecerÃ¡n aquÃ­ cuando existan eventos." />
        </div>
      ) : null}

      {rows.length ? (
        <div className="overflow-hidden">
          <table className="w-full table-auto border-collapse text-left">
            <thead>
              <tr className="border-b border-[var(--border-default)] bg-[var(--surface-subtle)] text-[12px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                <th className="px-4 py-3 font-semibold">Fuente</th>
                <th className="px-4 py-3 font-semibold">Registro</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">AcciÃ³n</th>
                <th className="hidden px-4 py-3 font-semibold lg:table-cell">Campos/contexto</th>
                <th className="hidden px-4 py-3 font-semibold xl:table-cell">Fecha</th>
                <th className="px-4 py-3 text-right font-semibold">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const expanded = expandedRow === row.id;
                return (
                  <Fragment key={row.id}>
                    <tr className="border-b border-[var(--border-subtle)] bg-white align-top">
                      <td className="px-4 py-3">
                        <Badge
                          tone={
                            row.source === "Entregable"
                              ? "violet"
                              : row.source === "Job diagrama"
                                ? "orange"
                                : row.source === "Quality entregable"
                                  ? qualityStateTone(row.action)
                                  : "blue"
                          }
                        >
                          {row.source}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[13px] font-semibold text-[var(--text-primary)]">{row.key}</p>
                        <p className="mt-1 text-[11px] text-[var(--text-muted)]">{row.scope}</p>
                      </td>
                      <td className="hidden px-4 py-3 text-[12px] text-[var(--text-secondary)] md:table-cell">{formatToken(row.action)}</td>
                      <td className="hidden px-4 py-3 lg:table-cell">
                        <div className="flex flex-wrap gap-1.5">
                          {row.fields.slice(0, 4).map((field) => <Badge key={`${row.id}-${field}`} tone="slate">{formatToken(field)}</Badge>)}
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 text-[12px] text-[var(--text-secondary)] xl:table-cell">{formatTimestamp(row.createdAt)}</td>
                      <td className="px-4 py-2 text-right">
                        <button
                          aria-expanded={expanded}
                          aria-label={expanded ? `Contraer evento ${row.key}` : `Expandir evento ${row.key}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-[12px] border border-[var(--border-default)] bg-white text-[var(--brand-primary)] transition hover:bg-[var(--brand-soft)]"
                          type="button"
                          onClick={() => setExpandedRow(expanded ? null : row.id)}
                        >
                          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                      </td>
                    </tr>
                    {expanded ? (
                      <tr className="border-b border-[var(--border-default)] bg-[var(--surface-subtle)]">
                        <td className="px-4 py-4" colSpan={6}>
                          <pre className="max-h-[320px] overflow-auto rounded-[16px] border border-[var(--border-default)] bg-white p-4 text-[11px] leading-5 text-[var(--text-secondary)]">
                            {toJsonText(row.detail)}
                          </pre>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </Panel>
  );
}

export function ProductGovernanceSummary({
  artifactCount,
  componentCount,
  deliverableOverview,
  diagramOverview,
  diagramCount,
  loading,
}: {
  artifactCount: number;
  componentCount: number;
  deliverableOverview: DeliverableGovernanceOverview | null;
  diagramOverview: DiagramGovernanceOverview | null;
  diagramCount: number;
  loading: boolean;
}) {
  const deliverableQuality = deliverableOverview?.quality_summary;
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
      <Panel className="p-4">
        <p className="text-[12px] text-[var(--text-secondary)]">Diagramas gobernados</p>
        <p className="mt-2 text-[22px] font-semibold text-[var(--text-primary)]">{loading && !diagramCount ? "..." : diagramCount}</p>
      </Panel>
      <Panel className="p-4">
        <p className="text-[12px] text-[var(--text-secondary)]">Artefactos/documentos</p>
        <p className="mt-2 text-[22px] font-semibold text-[var(--text-primary)]">{loading && !artifactCount ? "..." : artifactCount}</p>
      </Panel>
      <Panel className="p-4">
        <p className="text-[12px] text-[var(--text-secondary)]">Componentes de entrega</p>
        <p className="mt-2 text-[22px] font-semibold text-[var(--text-primary)]">{loading && !componentCount ? "..." : componentCount}</p>
      </Panel>
      <Panel className="p-4">
        <p className="text-[12px] text-[var(--text-secondary)]">Calidad diagramas</p>
        <p className="mt-2 text-[22px] font-semibold text-[var(--text-primary)]">{diagramOverview?.average_quality_score ?? 0}</p>
        <p className="mt-1 text-[11px] text-[var(--text-muted)]">{diagramOverview?.total_versions ?? 0} versiones</p>
      </Panel>
      <Panel className="p-4">
        <p className="text-[12px] text-[var(--text-secondary)]">Calidad entregables</p>
        <p className="mt-2 text-[22px] font-semibold text-[var(--text-primary)]">
          {deliverableQuality?.total_snapshots ? deliverableQuality.average_score : "Sin datos"}
        </p>
        <p className="mt-1 text-[11px] text-[var(--text-muted)]">score promedio</p>
      </Panel>
      <Panel className="p-4">
        <p className="text-[12px] text-[var(--text-secondary)]">Snapshots calidad</p>
        <p className="mt-2 text-[22px] font-semibold text-[var(--text-primary)]">{deliverableQuality?.total_snapshots ?? 0}</p>
        <p className="mt-1 text-[11px] text-[var(--text-muted)]">persistidos</p>
      </Panel>
    </div>
  );
}
export function ProductGovernanceConsole({
  activeTab,
  isPlatformAdmin,
}: ProductGovernanceConsoleProps) {
  const detail = TAB_DETAILS[activeTab];
  const Icon = detail.icon;
  const [diagramEntries, setDiagramEntries] = useState<DiagramGovernanceEntry[]>([]);
  const [diagramOverview, setDiagramOverview] = useState<DiagramGovernanceOverview | null>(null);
  const [diagramStatus, setDiagramStatus] = useState<LoadStatus>("idle");
  const [diagramError, setDiagramError] = useState<string | null>(null);
  const [diagramQuery, setDiagramQuery] = useState("");
  const [deliverableEntries, setDeliverableEntries] = useState<DeliverableGovernanceEntry[]>([]);
  const [deliverableOverview, setDeliverableOverview] = useState<DeliverableGovernanceOverview | null>(null);
  const [deliverableStatus, setDeliverableStatus] = useState<LoadStatus>("idle");
  const [deliverableError, setDeliverableError] = useState<string | null>(null);
  const [deliverableQuery, setDeliverableQuery] = useState("");
  const [deliverableScope, setDeliverableScope] = useState<GovernanceScope>(isPlatformAdmin ? "platform" : "workspace");
  const effectiveDeliverableScope: GovernanceScope = isPlatformAdmin ? deliverableScope : "workspace";

  const loadDiagrams = useCallback(async () => {
    setDiagramStatus("loading");
    setDiagramError(null);
    try {
      const [response, overview] = await Promise.all([
        diagramGovernanceApi.list(),
        diagramGovernanceApi.overview(),
      ]);
      setDiagramEntries(response.entries);
      setDiagramOverview(overview);
      setDiagramStatus("ready");
    } catch (error) {
      setDiagramError(messageFor(error, "No se pudo cargar gobierno de diagramas."));
      setDiagramStatus("error");
    }
  }, []);

  useEffect(() => {
    const shouldLoadDiagrams = activeTab === "diagrams" || activeTab === "summary" || activeTab === "audit";
    if (!shouldLoadDiagrams || !isPlatformAdmin || diagramStatus !== "idle") {
      return undefined;
    }
    const task = window.setTimeout(() => {
      void loadDiagrams();
    }, 0);
    return () => window.clearTimeout(task);
  }, [activeTab, diagramStatus, isPlatformAdmin, loadDiagrams]);

  const filteredDiagramEntries = useMemo(() => {
    const normalized = diagramQuery.trim().toLowerCase();
    if (!normalized) {
      return diagramEntries;
    }
    return diagramEntries.filter((entry) =>
      [
        entry.title,
        entry.diagram_key,
        entry.category,
        entry.diagram_surface,
        entry.enabled_from_stage,
        entry.required_tier,
        entry.access_level,
        ...entry.product_scope,
      ].join(" ").toLowerCase().includes(normalized),
    );
  }, [diagramEntries, diagramQuery]);

  const handleDiagramSaved = useCallback((updated: DiagramGovernanceEntry) => {
    setDiagramEntries((current) => current.map((entry) => entry.diagram_key === updated.diagram_key ? updated : entry));
  }, []);

  const loadDeliverables = useCallback(async (scope: GovernanceScope = effectiveDeliverableScope) => {
    setDeliverableStatus("loading");
    setDeliverableError(null);
    try {
      const [response, overview] = await Promise.all([
        deliverableGovernanceApi.list(scope),
        deliverableGovernanceApi.overview(scope),
      ]);
      setDeliverableEntries(response.entries);
      setDeliverableOverview(overview);
      setDeliverableStatus("ready");
    } catch (error) {
      setDeliverableError(messageFor(error, "No se pudo cargar gobierno de entregables."));
      setDeliverableStatus("error");
    }
  }, [effectiveDeliverableScope]);

  useEffect(() => {
    const shouldLoadDeliverables = activeTab === "artifacts" || activeTab === "components" || activeTab === "summary" || activeTab === "audit";
    if (!shouldLoadDeliverables || deliverableStatus !== "idle") {
      return undefined;
    }
    const task = window.setTimeout(() => {
      void loadDeliverables();
    }, 0);
    return () => window.clearTimeout(task);
  }, [activeTab, deliverableStatus, loadDeliverables]);

  const filteredDeliverableEntries = useMemo(() => {
    const normalized = deliverableQuery.trim().toLowerCase();
    const baseEntries = activeTab === "artifacts"
      ? deliverableEntries.filter((entry) => GOVERNED_ARTIFACT_TYPES.has(entry.deliverable_type))
      : activeTab === "components"
        ? deliverableEntries
        : [];
    if (!normalized) {
      return baseEntries;
    }
    return baseEntries.filter((entry) =>
      [
        entry.title,
        entry.deliverable_key,
        entry.deliverable_type,
        entry.category,
        entry.stage,
        entry.enabled_from_stage,
        entry.required_tier,
        entry.access_level,
        entry.generation_mode,
        entry.prompt_policy.prompt_template_key,
        entry.quality_policy.validator_key,
        ...entry.product_scope,
      ].join(" ").toLowerCase().includes(normalized),
    );
  }, [activeTab, deliverableEntries, deliverableQuery]);

  const handleDeliverableSaved = useCallback((updated: DeliverableGovernanceEntry) => {
    setDeliverableEntries((current) => current.map((entry) => entry.deliverable_key === updated.deliverable_key ? updated : entry));
  }, []);

  const handleDeliverableScopeChange = useCallback((scope: GovernanceScope) => {
    const nextScope = isPlatformAdmin ? scope : "workspace";
    setDeliverableScope(nextScope);
    setDeliverableStatus("idle");
  }, [isPlatformAdmin]);
  const artifactEntries = useMemo(
    () => deliverableEntries.filter((entry) => GOVERNED_ARTIFACT_TYPES.has(entry.deliverable_type)),
    [deliverableEntries],
  );
  const governanceDataLoading =
    (isPlatformAdmin && (diagramStatus === "idle" || diagramStatus === "loading"))
    || deliverableStatus === "idle"
    || deliverableStatus === "loading";

  return (
    <div className="space-y-5">
      <AdminSourceNote status={!isPlatformAdmin && (activeTab === "diagrams" || activeTab === "summary" || activeTab === "audit") ? "partial" : "available"}>
        Gobierno de producto usa contratos reales enriquecidos en backend. Diagramas, Artefactos y Componentes operan
        dentro de la consola con tablas expandibles; Auditoría y calidad usan eventos, jobs y snapshots persistidos.
      </AdminSourceNote>
      <Panel className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[var(--brand-soft)] text-[var(--brand-primary)]">
              <Icon aria-hidden="true" className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[18px] font-semibold text-[var(--text-primary)]">{detail.title}</p>
              <p className="mt-1 max-w-3xl text-[13px] leading-6 text-[var(--text-secondary)]">{detail.description}</p>
            </div>
          </div>
          <Badge tone={isPlatformAdmin ? "green" : "orange"}>
            {isPlatformAdmin ? "Platform admin" : "Solo lectura"}
          </Badge>
        </div>
      </Panel>

      {activeTab === "diagrams" && !isPlatformAdmin ? (
        <AdminViewState
          state="forbidden"
          title="Gobierno de diagramas requiere administraciÃ³n de plataforma"
          description="Los endpoints de diagramas estÃ¡n protegidos por permisos de plataforma para evitar cambios globales accidentales."
        />
      ) : null}

      {activeTab === "diagrams" && isPlatformAdmin ? (
        <DiagramGovernancePanel
          entries={diagramEntries}
          error={diagramError}
          filteredEntries={filteredDiagramEntries}
          onQueryChange={setDiagramQuery}
          onRefresh={() => void loadDiagrams()}
          onSaved={handleDiagramSaved}
          overview={diagramOverview}
          query={diagramQuery}
          status={diagramStatus}
        />
      ) : null}

      {(activeTab === "artifacts" || activeTab === "components") ? (
        <DeliverableGovernancePanel
          entries={deliverableEntries}
          error={deliverableError}
          filteredEntries={filteredDeliverableEntries}
          mode={activeTab}
          onQueryChange={setDeliverableQuery}
          onRefresh={() => void loadDeliverables(effectiveDeliverableScope)}
          onSaved={handleDeliverableSaved}
          onScopeChange={handleDeliverableScopeChange}
          overview={deliverableOverview}
          query={deliverableQuery}
          scope={effectiveDeliverableScope}
          status={deliverableStatus}
        />
      ) : null}

      {activeTab === "summary" ? (
        <ProductGovernanceSummary
          artifactCount={artifactEntries.length}
          componentCount={deliverableEntries.length}
          deliverableOverview={deliverableOverview}
          diagramOverview={diagramOverview}
          diagramCount={diagramEntries.length}
          loading={governanceDataLoading}
        />
      ) : null}
      {activeTab !== "summary" && activeTab !== "diagrams" && activeTab !== "artifacts" && activeTab !== "components" && activeTab !== "audit" ? <ProductGovernanceFilters /> : null}
      {activeTab === "audit" ? (
        <GovernanceAuditTable
          diagramOverview={diagramOverview}
          deliverableOverview={deliverableOverview}
          loading={governanceDataLoading}
          onRefresh={() => {
            void loadDiagrams();
            void loadDeliverables(effectiveDeliverableScope);
          }}
        />
      ) : null}
    </div>
  );
}
