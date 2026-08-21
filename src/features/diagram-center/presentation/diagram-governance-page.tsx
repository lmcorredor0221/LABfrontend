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

const DIAGRAM_NOTATION_OPTIONS = [
  { label: "Flowchart", value: "flowchart" },
  { label: "Sequence", value: "sequence" },
  { label: "UML Class", value: "class" },
  { label: "Entity Relationship", value: "er" },
  { label: "UML State", value: "state" },
  { label: "Journey", value: "journey" },
  { label: "C4", value: "c4" },
  { label: "BPMN 2.0", value: "bpmn" },
  { label: "UML Use Case", value: "uml_use_case" },
  { label: "UML Activity", value: "uml_activity" },
  { label: "UML Component", value: "uml_component" },
  { label: "UML Deployment", value: "deployment" },
  { label: "UML Package", value: "package" },
  { label: "Capability Map", value: "capability" },
];

type DiagramNotationProfile = {
  label: string;
  notation: string;
  presentation_contract: string;
  renderer_key: string;
  source_contract: string;
  standard: string;
  validator_key: string;
  compatiblePresentationContracts?: string[];
  compatibleRenderers?: string[];
  compatibleSourceContracts?: string[];
  compatibleValidators?: string[];
};

const NOTATION_PROFILES: Record<string, DiagramNotationProfile> = {
  flowchart: {
    compatibleRenderers: ["renderer.mermaid.v1", "renderer.svg.generic.v1", "renderer.agentic_graph.v1"],
    compatibleSourceContracts: ["mermaid-source.v1", "diagram-model.v1"],
    compatibleValidators: ["diagram.graph_integrity.v1", "agentic.workflow.semantic.v1"],
    label: "Flowchart",
    notation: "flowchart",
    presentation_contract: "diagram-presentation.v1",
    renderer_key: "renderer.mermaid.v1",
    source_contract: "mermaid-source.v1",
    standard: "Mermaid flowchart",
    validator_key: "diagram.graph_integrity.v1",
  },
  sequence: {
    label: "UML Sequence Diagram",
    notation: "sequence",
    presentation_contract: "diagram-presentation.v1",
    renderer_key: "renderer.plantuml.v1",
    source_contract: "plantuml-source.v1",
    standard: "UML Sequence Diagram",
    validator_key: "uml.sequence.semantic.v1",
  },
  class: {
    label: "UML Class Diagram",
    notation: "class",
    presentation_contract: "diagram-presentation.v1",
    renderer_key: "renderer.plantuml.v1",
    source_contract: "plantuml-source.v1",
    standard: "UML Class Diagram",
    validator_key: "uml.class.semantic.v1",
  },
  er: {
    label: "Entity Relationship Diagram",
    notation: "er",
    presentation_contract: "diagram-presentation.v1",
    renderer_key: "renderer.mermaid.v1",
    source_contract: "mermaid-source.v1",
    standard: "Entity Relationship Diagram",
    validator_key: "data.erd.semantic.v1",
  },
  state: {
    label: "UML State Machine Diagram",
    notation: "state",
    presentation_contract: "diagram-presentation.v1",
    renderer_key: "renderer.plantuml.v1",
    source_contract: "plantuml-source.v1",
    standard: "UML State Machine",
    validator_key: "uml.state.semantic.v1",
  },
  journey: {
    label: "User Journey Map",
    notation: "journey",
    presentation_contract: "diagram-presentation.v1",
    renderer_key: "renderer.mermaid.v1",
    source_contract: "mermaid-source.v1",
    standard: "User Journey Map",
    validator_key: "diagram.graph_integrity.v1",
  },
  c4: {
    compatibleValidators: ["c4.context.semantic.v1", "c4.container.semantic.v1"],
    label: "C4 Model",
    notation: "c4",
    presentation_contract: "diagram-presentation.v1",
    renderer_key: "renderer.c4.v1",
    source_contract: "c4-source.v1",
    standard: "C4 Model",
    validator_key: "c4.context.semantic.v1",
  },
  bpmn: {
    label: "BPMN 2.0",
    notation: "bpmn",
    presentation_contract: "diagram-presentation.v1",
    renderer_key: "renderer.bpmn_js.v1",
    source_contract: "bpmn-source.v1",
    standard: "BPMN 2.0",
    validator_key: "bpmn.2_0.schema_semantic.v1",
  },
  uml_use_case: {
    label: "UML Use Case Diagram",
    notation: "uml_use_case",
    presentation_contract: "diagram-presentation.v1",
    renderer_key: "renderer.plantuml.v1",
    source_contract: "plantuml-source.v1",
    standard: "UML Use Case Diagram",
    validator_key: "uml.use_case.semantic.v1",
  },
  uml_activity: {
    label: "UML Activity Diagram",
    notation: "uml_activity",
    presentation_contract: "diagram-presentation.v1",
    renderer_key: "renderer.plantuml.v1",
    source_contract: "plantuml-source.v1",
    standard: "UML Activity Diagram",
    validator_key: "uml.activity.semantic.v1",
  },
  uml_component: {
    label: "UML Component Diagram",
    notation: "uml_component",
    presentation_contract: "diagram-presentation.v1",
    renderer_key: "renderer.plantuml.v1",
    source_contract: "plantuml-source.v1",
    standard: "UML Component Diagram",
    validator_key: "uml.component.semantic.v1",
  },
  deployment: {
    label: "UML Deployment Diagram",
    notation: "deployment",
    presentation_contract: "diagram-presentation.v1",
    renderer_key: "renderer.plantuml.v1",
    source_contract: "plantuml-source.v1",
    standard: "UML Deployment Diagram",
    validator_key: "diagram.graph_integrity.v1",
  },
  package: {
    label: "UML Package Diagram",
    notation: "package",
    presentation_contract: "diagram-presentation.v1",
    renderer_key: "renderer.plantuml.v1",
    source_contract: "plantuml-source.v1",
    standard: "UML Package Diagram",
    validator_key: "diagram.graph_integrity.v1",
  },
  capability: {
    compatibleRenderers: ["renderer.svg.generic.v1", "renderer.agentic_graph.v1"],
    compatibleSourceContracts: ["diagram-model.v1", "mermaid-source.v1"],
    label: "Capability Map",
    notation: "capability",
    presentation_contract: "diagram-presentation.v1",
    renderer_key: "renderer.svg.generic.v1",
    source_contract: "diagram-model.v1",
    standard: "Capability Map",
    validator_key: "diagram.graph_integrity.v1",
  },
};

type PromptScalarKey =
  | "notation"
  | "presentation_contract"
  | "renderer_key"
  | "source_contract"
  | "standard"
  | "validator_key";

type LayoutGuidance = Record<string, unknown>;

const LAYOUT_STRATEGY_OPTIONS_BY_NOTATION: Record<string, { label: string; value: string }[]> = {
  bpmn: [{ label: "BPMN swimlane", value: "bpmn_swimlane" }, { label: "Split required", value: "split_required" }],
  uml_activity: [{ label: "UML Activity", value: "uml_activity" }, { label: "Split required", value: "split_required" }],
  uml_use_case: [{ label: "UML Use Case", value: "uml_use_case" }, { label: "Split required", value: "split_required" }],
  sequence: [{ label: "Timeline", value: "timeline" }, { label: "Split required", value: "split_required" }],
  flowchart: [{ label: "Layered", value: "layered" }, { label: "Fixed grid", value: "fixed_grid" }, { label: "Split required", value: "split_required" }],
};

const DIRECTION_OPTIONS = [
  { label: "Izquierda a derecha", value: "LR" },
  { label: "Arriba a abajo", value: "TB" },
  { label: "Derecha a izquierda", value: "RL" },
  { label: "Abajo a arriba", value: "BT" },
];

const DEFAULT_LAYOUT_BY_NOTATION: Record<string, LayoutGuidance> = {
  bpmn: {
    enable_adaptive_sizing: true,
    enable_edge_routing: true,
    max_edge_density: 0.12,
    max_edges_per_view: 20,
    max_nodes_per_view: 14,
    preferred_direction: "LR",
    preferred_strategy: "bpmn_swimlane",
    visual_quality_min_score: 86,
  },
  uml_activity: {
    enable_adaptive_sizing: true,
    enable_edge_routing: true,
    max_edge_density: 0.12,
    max_edges_per_view: 22,
    max_nodes_per_view: 14,
    preferred_direction: "TB",
    preferred_strategy: "uml_activity",
    visual_quality_min_score: 86,
  },
  uml_use_case: {
    enable_adaptive_sizing: true,
    enable_edge_routing: true,
    max_edge_density: 0.14,
    max_edges_per_view: 24,
    max_nodes_per_view: 18,
    preferred_direction: "TB",
    preferred_strategy: "uml_use_case",
    visual_quality_min_score: 84,
  },
  flowchart: {
    enable_adaptive_sizing: true,
    enable_edge_routing: true,
    max_edge_density: 0.16,
    max_edges_per_view: 22,
    max_nodes_per_view: 16,
    preferred_direction: "LR",
    preferred_strategy: "layered",
    visual_quality_min_score: 82,
  },
};

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

function promptScalarText(
  entry: DiagramGovernanceEntry,
  draft: DiagramGovernanceUpdate,
  key: PromptScalarKey,
) {
  return String(draft.prompt_override[key] ?? entry.prompt_spec[key] ?? "");
}

function setPromptScalarOverride(
  current: DiagramGovernanceUpdate,
  key: PromptScalarKey,
  value: string,
) {
  const nextOverride = { ...current.prompt_override };
  const normalized = value.trim();
  if (normalized) {
    nextOverride[key] = normalized;
  } else {
    delete nextOverride[key];
  }
  return {
    ...current,
    prompt_override: nextOverride,
  };
}

function profileForNotation(notation: string) {
  return NOTATION_PROFILES[notation] ?? NOTATION_PROFILES.flowchart;
}

function setPromptProfileOverride(current: DiagramGovernanceUpdate, notation: string) {
  const profile = profileForNotation(notation);
  return {
    ...current,
    prompt_override: {
      ...current.prompt_override,
      notation: profile.notation,
      presentation_contract: profile.presentation_contract,
      renderer_key: profile.renderer_key,
      source_contract: profile.source_contract,
      standard: profile.standard,
      validator_key: profile.validator_key,
      layout_guidance: DEFAULT_LAYOUT_BY_NOTATION[profile.notation] ?? DEFAULT_LAYOUT_BY_NOTATION.flowchart,
    },
  };
}

function compatibleOptions(recommended: string, values: string[], current: string) {
  const allowed = Array.from(new Set([recommended, ...values].filter(Boolean)));
  const options = allowed.map((value) => ({
    label: value === recommended ? `${value} (recomendado)` : value,
    value,
  }));
  if (current && !allowed.includes(current)) {
    options.push({ label: `${current} (actual, fuera del perfil)`, value: current });
  }
  return options;
}

function hasPromptOverride(draft: DiagramGovernanceUpdate, key: PromptScalarKey) {
  return Boolean(draft.prompt_override[key]);
}

function layoutGuidance(entry: DiagramGovernanceEntry, draft: DiagramGovernanceUpdate): LayoutGuidance {
  const base = entry.prompt_spec.layout_guidance && typeof entry.prompt_spec.layout_guidance === "object"
    ? entry.prompt_spec.layout_guidance
    : {};
  const override = draft.prompt_override.layout_guidance && typeof draft.prompt_override.layout_guidance === "object"
    ? draft.prompt_override.layout_guidance
    : {};
  return { ...base, ...override };
}

function layoutValue(entry: DiagramGovernanceEntry, draft: DiagramGovernanceUpdate, key: string, fallback: string | number | boolean) {
  const value = layoutGuidance(entry, draft)[key];
  return value ?? fallback;
}

function setLayoutOverride(current: DiagramGovernanceUpdate, key: string, value: string | number | boolean) {
  const currentLayout = current.prompt_override.layout_guidance && typeof current.prompt_override.layout_guidance === "object"
    ? current.prompt_override.layout_guidance
    : {};
  return {
    ...current,
    prompt_override: {
      ...current.prompt_override,
      layout_guidance: {
        ...currentLayout,
        [key]: value,
      },
    },
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
  const effectiveNotation = promptScalarText(entry, draft, "notation");
  const effectiveProfile = profileForNotation(effectiveNotation);
  const effectiveSourceContract = promptScalarText(entry, draft, "source_contract") || entry.prompt_spec.output_contract;
  const effectivePresentationContract = promptScalarText(entry, draft, "presentation_contract") || "diagram-presentation.v1";
  const effectiveRendererKey = promptScalarText(entry, draft, "renderer_key") || "renderer.svg.generic.v1";
  const effectiveValidatorKey = promptScalarText(entry, draft, "validator_key") || "diagram.graph_integrity.v1";
  const sourceContractOptions = compatibleOptions(
    effectiveProfile.source_contract,
    effectiveProfile.compatibleSourceContracts ?? [effectiveProfile.source_contract],
    effectiveSourceContract,
  );
  const presentationContractOptions = compatibleOptions(
    effectiveProfile.presentation_contract,
    effectiveProfile.compatiblePresentationContracts ?? [effectiveProfile.presentation_contract],
    effectivePresentationContract,
  );
  const rendererOptions = compatibleOptions(
    effectiveProfile.renderer_key,
    effectiveProfile.compatibleRenderers ?? [effectiveProfile.renderer_key],
    effectiveRendererKey,
  );
  const validatorOptions = compatibleOptions(
    effectiveProfile.validator_key,
    effectiveProfile.compatibleValidators ?? [effectiveProfile.validator_key],
    effectiveValidatorKey,
  );
  const profileAligned =
    effectiveSourceContract === effectiveProfile.source_contract
    && effectivePresentationContract === effectiveProfile.presentation_contract
    && effectiveRendererKey === effectiveProfile.renderer_key
    && effectiveValidatorKey === effectiveProfile.validator_key;

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
          <p className="mt-1 text-[10px] text-[var(--text-muted)]">
            {effectiveNotation}
            {draft.prompt_override.notation ? " · override" : ""}
            {" · "}
            {entry.prompt_spec.required_inputs.length} entradas
          </p>
        </div>
      </div>
      <div className="grid gap-2 border-t border-[var(--border-subtle)] bg-[var(--surface-muted)] px-4 py-3 text-[11px] md:grid-cols-4">
        <div>
          <p className="font-mono font-black uppercase tracking-[.14em] text-[var(--text-muted)]">Contrato fuente</p>
          <p className="mt-1 font-semibold text-[var(--text-primary)]">
            {effectiveSourceContract}
            {hasPromptOverride(draft, "source_contract") ? <span className="ml-1 text-[var(--brand-primary)]">override</span> : null}
          </p>
        </div>
        <div>
          <p className="font-mono font-black uppercase tracking-[.14em] text-[var(--text-muted)]">Presentacion</p>
          <p className="mt-1 font-semibold text-[var(--text-primary)]">
            {effectivePresentationContract}
            {hasPromptOverride(draft, "presentation_contract") ? <span className="ml-1 text-[var(--brand-primary)]">override</span> : null}
          </p>
        </div>
        <div>
          <p className="font-mono font-black uppercase tracking-[.14em] text-[var(--text-muted)]">Renderer</p>
          <p className="mt-1 font-semibold text-[var(--text-primary)]">
            {effectiveRendererKey}
            {hasPromptOverride(draft, "renderer_key") ? <span className="ml-1 text-[var(--brand-primary)]">override</span> : null}
          </p>
        </div>
        <div>
          <p className="font-mono font-black uppercase tracking-[.14em] text-[var(--text-muted)]">Validador</p>
          <p className="mt-1 font-semibold text-[var(--text-primary)]">
            {effectiveValidatorKey}
            {hasPromptOverride(draft, "validator_key") ? <span className="ml-1 text-[var(--brand-primary)]">override</span> : null}
          </p>
        </div>
      </div>
      <details className="group border-t border-[var(--border-subtle)]">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 text-[12px] font-semibold text-[var(--brand-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px]">
          Configurar política y PromptSpec
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
            <SelectField
              label="Notacion"
              onValueChange={(value) => setDraft((current) => setPromptProfileOverride(current, value))}
              options={DIAGRAM_NOTATION_OPTIONS}
              value={effectiveNotation}
            />
          </div>
          <div className="mt-3 rounded-[14px] border border-[var(--border-default)] bg-white p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] font-black uppercase tracking-[.14em] text-[var(--text-muted)]">
                  Perfil de notacion
                </p>
                <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
                  {effectiveProfile.label}: usa {effectiveProfile.source_contract}, {effectiveProfile.renderer_key} y {effectiveProfile.validator_key}.
                </p>
              </div>
              {!profileAligned ? (
                <AppButton
                  onClick={() => setDraft((current) => setPromptProfileOverride(current, effectiveNotation))}
                  type="button"
                  variant="secondary"
                >
                  Aplicar perfil recomendado
                </AppButton>
              ) : (
                <Badge tone="green">Perfil alineado</Badge>
              )}
            </div>
          </div>
          <div className="mt-3 rounded-[14px] border border-[var(--border-default)] bg-white p-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] font-black uppercase tracking-[.14em] text-[var(--text-muted)]">
                  Legibilidad y layout
                </p>
                <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
                  Controla densidad, direccion y politicas de split para evitar diagramas amontonados.
                </p>
              </div>
              {draft.prompt_override.layout_guidance ? <Badge tone="blue">Layout override</Badge> : <Badge tone="slate">Perfil base</Badge>}
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <SelectField
                label="Estrategia layout"
                onValueChange={(value) => setDraft((current) => setLayoutOverride(current, "preferred_strategy", value))}
                options={LAYOUT_STRATEGY_OPTIONS_BY_NOTATION[effectiveNotation] ?? LAYOUT_STRATEGY_OPTIONS_BY_NOTATION.flowchart}
                value={String(layoutValue(entry, draft, "preferred_strategy", "layered"))}
              />
              <SelectField
                label="Direccion preferida"
                onValueChange={(value) => setDraft((current) => setLayoutOverride(current, "preferred_direction", value))}
                options={DIRECTION_OPTIONS}
                value={String(layoutValue(entry, draft, "preferred_direction", "LR"))}
              />
              <label className="flex flex-col gap-2 text-[14px] font-medium text-[var(--text-primary)]">
                Nodos antes de split
                <input
                  className="h-12 rounded-[14px] border border-[var(--border-default)] bg-white px-4 text-[14px] text-[var(--text-primary)]"
                  min={4}
                  max={80}
                  onChange={(event) => setDraft((current) => setLayoutOverride(current, "max_nodes_per_view", Number(event.target.value)))}
                  type="number"
                  value={Number(layoutValue(entry, draft, "max_nodes_per_view", 16))}
                />
              </label>
              <label className="flex flex-col gap-2 text-[14px] font-medium text-[var(--text-primary)]">
                Aristas antes de split
                <input
                  className="h-12 rounded-[14px] border border-[var(--border-default)] bg-white px-4 text-[14px] text-[var(--text-primary)]"
                  min={4}
                  max={160}
                  onChange={(event) => setDraft((current) => setLayoutOverride(current, "max_edges_per_view", Number(event.target.value)))}
                  type="number"
                  value={Number(layoutValue(entry, draft, "max_edges_per_view", 22))}
                />
              </label>
              <label className="flex flex-col gap-2 text-[14px] font-medium text-[var(--text-primary)]">
                Densidad maxima
                <input
                  className="h-12 rounded-[14px] border border-[var(--border-default)] bg-white px-4 text-[14px] text-[var(--text-primary)]"
                  max={1}
                  min={0.01}
                  onChange={(event) => setDraft((current) => setLayoutOverride(current, "max_edge_density", Number(event.target.value)))}
                  step={0.01}
                  type="number"
                  value={Number(layoutValue(entry, draft, "max_edge_density", 0.16))}
                />
              </label>
              <label className="flex flex-col gap-2 text-[14px] font-medium text-[var(--text-primary)]">
                Score visual minimo
                <input
                  className="h-12 rounded-[14px] border border-[var(--border-default)] bg-white px-4 text-[14px] text-[var(--text-primary)]"
                  min={50}
                  max={100}
                  onChange={(event) => setDraft((current) => setLayoutOverride(current, "visual_quality_min_score", Number(event.target.value)))}
                  type="number"
                  value={Number(layoutValue(entry, draft, "visual_quality_min_score", 82))}
                />
              </label>
              <SelectField
                label="Sizing adaptativo"
                onValueChange={(value) => setDraft((current) => setLayoutOverride(current, "enable_adaptive_sizing", value === "true"))}
                options={[{ label: "Activo", value: "true" }, { label: "Inactivo", value: "false" }]}
                value={String(layoutValue(entry, draft, "enable_adaptive_sizing", true))}
              />
              <SelectField
                label="Ruteo de aristas"
                onValueChange={(value) => setDraft((current) => setLayoutOverride(current, "enable_edge_routing", value === "true"))}
                options={[{ label: "Activo", value: "true" }, { label: "Inactivo", value: "false" }]}
                value={String(layoutValue(entry, draft, "enable_edge_routing", true))}
              />
            </div>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <SelectField
              hint={`Opciones compatibles con ${effectiveProfile.label}.`}
              label="Contrato fuente"
              onValueChange={(value) => setDraft((current) => setPromptScalarOverride(current, "source_contract", value))}
              options={sourceContractOptions}
              value={effectiveSourceContract}
            />
            <SelectField
              hint={`Presentaciones optimas para ${effectiveProfile.label}.`}
              label="Presentacion"
              onValueChange={(value) => setDraft((current) => setPromptScalarOverride(current, "presentation_contract", value))}
              options={presentationContractOptions}
              value={effectivePresentationContract}
            />
            <SelectField
              hint={`Renderer recomendado por la notacion seleccionada.`}
              label="Renderer"
              onValueChange={(value) => setDraft((current) => setPromptScalarOverride(current, "renderer_key", value))}
              options={rendererOptions}
              value={effectiveRendererKey}
            />
            <SelectField
              hint={`Validador semantico compatible con ${effectiveProfile.label}.`}
              label="Validador"
              onValueChange={(value) => setDraft((current) => setPromptScalarOverride(current, "validator_key", value))}
              options={validatorOptions}
              value={effectiveValidatorKey}
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
