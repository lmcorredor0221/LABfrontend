import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { DiagramGovernanceEntry, DiagramGovernanceOverview } from "@/features/diagram-center/domain/governance-types";
import { diagramGovernanceApi } from "@/features/diagram-center/infrastructure/diagram-governance-api";
import type { DeliverableGovernanceEntry, DeliverableGovernanceOverview } from "@/features/deliverables/domain/types";
import { deliverableGovernanceApi } from "@/features/deliverables/infrastructure/deliverable-governance-api";
import { ProductGovernanceConsole } from "./product-governance-console";

vi.mock("@/features/diagram-center/infrastructure/diagram-governance-api", () => ({
  diagramGovernanceApi: {
    list: vi.fn(),
    overview: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/features/deliverables/infrastructure/deliverable-governance-api", () => ({
  deliverableGovernanceApi: {
    getPrompt: vi.fn(),
    list: vi.fn(),
    overview: vi.fn(),
    update: vi.fn(),
    updatePrompt: vi.fn(),
    validatePrompt: vi.fn(),
  },
}));

const diagramEntry: DiagramGovernanceEntry = {
  access_level: "sample",
  active: true,
  category: "architecture",
  default_generation_state: "generated",
  description: "Vista ejecutiva de arquitectura.",
  diagram_key: "architecture_overview",
  diagram_surface: "agent_design",
  enabled: true,
  enabled_from_stage: "design",
  formats: {
    available: ["svg", "mermaid"],
    preferred: "svg",
  },
  generation_enabled: true,
  notation: "flowchart",
  notes: "",
  portable_paths: ["Blueprint/diagrams/architecture-overview.svg"],
  preview_mode: "limited",
  product_scope: ["blueprint"],
  prompt_override: {},
  prompt_spec: {
    diagram_key: "architecture_overview",
    exclusions: ["No incluir secretos."],
    notation: "flowchart",
    objective: "Representar arquitectura.",
    output_contract: "diagram-model.v1",
    presentation_contract: "diagram-presentation.v1",
    quality_gates: ["Debe ser legible."],
    renderer_key: "renderer.svg.generic.v1",
    required_inputs: ["blueprint.architecture_spec"],
    semantic_rules: ["Usar contexto aprobado."],
    source_contract: "diagram-model.v1",
    standard: "Generic directed graph",
    validator_key: "diagram.graph_integrity.v1",
    version: "diagram-prompts.v1.0.0",
  },
  prompt_spec_version: "diagram-prompts.v1.0.0",
  prompt_status: "active",
  required_tier: "blueprint",
  source_artifact_keys: ["blueprint.architecture_spec"],
  title: "Arquitectura propuesta",
  updated_at: null,
};

const overview: DiagramGovernanceOverview = {
  active_provider: "codex_local",
  average_quality_score: 92,
  contract_version: "diagram-governance-overview.v1",
  job_counts: {},
  model_name: "gpt-5.5",
  prompt_spec_version: "diagram-prompts.v1.0.0",
  provider_configured: true,
  provider_mode: "local",
  recent_audit: [],
  recent_jobs: [],
  registry_version: "diagram-registry.v1",
  total_versions: 3,
};

const deliverableEntry: DeliverableGovernanceEntry = {
  access_level: "downloadable",
  access_policy: {
    content_protection: {
      disable_context_menu: true,
      disable_copy: true,
      disable_download: false,
    },
    preview_mode: "limited",
    sample_enabled: false,
  },
  acp_download: true,
  active: true,
  blueprint_download: true,
  canonical_paths: ["Blueprint/documents/problem-context.md"],
  category: "discovery",
  context_policy: {
    long_term_collections: ["approved_discovery"],
    max_context_tokens: 4000,
    retrieval_strategy: "approved_stage_snapshot_only",
    short_term_refs: ["discovery.problem_context"],
  },
  dependency_policy: {
    depends_on: ["discovery.problem_context"],
    invalidates_on_change: ["discovery.problem_context"],
  },
  deliverable_key: "discovery.problem_context_brief",
  deliverable_type: "document",
  description: "Documento de contexto del problema.",
  enabled: true,
  enabled_from_stage: "discover",
  exportable: true,
  formats: {
    available: ["markdown", "pdf"],
    preferred: "markdown",
  },
  generation_enabled: true,
  generation_mode: "llm_required",
  notes: "",
  portable_paths: ["Blueprint/discovery/problem-context.md"],
  preview_mode: "limited",
  product_scope: ["blueprint", "blueprint_pro", "acp"],
  prompt_override: {},
  prompt_policy: {
    fallback_policy: "manual_review",
    max_iterations: 2,
    prompt_status: "active",
    prompt_template_key: "deliverables.discovery.problem_context_brief.v1",
    prompt_version: "1.0.0",
    schema_contract: "document-markdown.v1",
    validator_key: "document.markdown.v1",
  },
  prompt_status: "active",
  quality_policy: {
    checks: ["has_sources"],
    minimum_score: 80,
    schema_contract: "document-markdown.v1",
    validator_key: "document.markdown.v1",
  },
  required_tier: "blueprint",
  scope_key: "platform",
  stage: "discover",
  title: "Problem context brief",
  updated_at: null,
  workspace_id: null,
};

const deliverableOverview: DeliverableGovernanceOverview = {
  active_entries: 1,
  by_access_state: { available: 1 },
  by_prompt_status: { active: 1 },
  by_stage: { discover: 1 },
  by_type: { document: 1 },
  contract_version: "deliverable-governance-overview.v1",
  governed_entries: 0,
  quality_summary: {
    average_score: 96,
    by_state: { passed: 1 },
    recent_snapshots: [
      {
        created_at: "2026-08-14T12:00:00Z",
        deliverable_key: "discovery.problem_context_brief",
        deliverable_type: "document",
        errors_count: 0,
        id: "quality-snapshot-1",
        product_scope: ["blueprint", "blueprint_pro", "acp"],
        score: 96,
        session_id: "session-1",
        stage: "discover",
        state: "passed",
        title: "Problem context brief",
        version_ref: "quality-test-v1",
        warnings_count: 1,
        workspace_id: "workspace-1",
      },
    ],
    total_snapshots: 1,
  },
  recent_audit: [],
  registry_version: "deliverable-catalog.v1",
  total_entries: 1,
};

describe("ProductGovernanceConsole", () => {
  it("loads diagram governance and saves policy from the accordion row", async () => {
    const user = userEvent.setup();
    vi.mocked(diagramGovernanceApi.list).mockResolvedValue({
      contract_version: "diagram-governance.v1",
      entries: [diagramEntry],
    });
    vi.mocked(diagramGovernanceApi.overview).mockResolvedValue(overview);
    vi.mocked(diagramGovernanceApi.update).mockResolvedValue({
      ...diagramEntry,
      notes: "Cambio publicado",
    });

    render(<ProductGovernanceConsole activeTab="diagrams" isPlatformAdmin />);

    await screen.findByText("Arquitectura propuesta");
    expect(screen.getByText("architecture_overview")).toBeInTheDocument();
    expect(screen.getByText("Gobierno de diagramas")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Expandir Arquitectura propuesta"));
    await screen.findByText("Prompt override JSON");

    await user.click(screen.getByRole("button", { name: /Guardar pol.*tica/i }));

    await waitFor(() => {
      expect(diagramGovernanceApi.update).toHaveBeenCalledWith(
        "architecture_overview",
        expect.objectContaining({
          enabled: true,
          generation_enabled: true,
          prompt_override: {},
          prompt_status: "active",
          required_tier_override: "blueprint",
        }),
      );
    });
    await screen.findByText(/Pol.*tica de diagrama publicada\./);
  });

  it("loads artifact governance and saves deliverable policy from the accordion row", async () => {
    const user = userEvent.setup();
    vi.mocked(deliverableGovernanceApi.list).mockResolvedValue({
      contract_version: "deliverable-governance.v1",
      entries: [deliverableEntry],
    });
    vi.mocked(deliverableGovernanceApi.overview).mockResolvedValue(deliverableOverview);
    vi.mocked(deliverableGovernanceApi.update).mockResolvedValue({
      ...deliverableEntry,
      notes: "Publicado desde consola",
    });

    render(<ProductGovernanceConsole activeTab="artifacts" isPlatformAdmin />);

    await screen.findByText("Problem context brief");
    expect(screen.getByText("discovery.problem_context_brief")).toBeInTheDocument();
    expect(screen.getAllByText("Artefactos y documentos").length).toBeGreaterThan(0);

    await user.click(screen.getByLabelText("Expandir Problem context brief"));
    await screen.findByText("Prompt policy");

    await user.click(screen.getByRole("button", { name: /Guardar pol.*tica/i }));

    await waitFor(() => {
      expect(deliverableGovernanceApi.update).toHaveBeenCalledWith(
        "discovery.problem_context_brief",
        expect.objectContaining({
          enabled: true,
          generation_enabled: true,
          prompt_override: {},
          prompt_status: "active",
          required_tier_override: "blueprint",
        }),
        "platform",
      );
    });
    await screen.findByText(/Pol.*tica de entregable publicada\./);
  });
  it("shows persisted deliverable quality snapshots in the audit table", async () => {
    vi.mocked(diagramGovernanceApi.list).mockResolvedValue({
      contract_version: "diagram-governance.v1",
      entries: [diagramEntry],
    });
    vi.mocked(diagramGovernanceApi.overview).mockResolvedValue(overview);
    vi.mocked(deliverableGovernanceApi.list).mockResolvedValue({
      contract_version: "deliverable-governance.v1",
      entries: [deliverableEntry],
    });
    vi.mocked(deliverableGovernanceApi.overview).mockResolvedValue(deliverableOverview);

    render(<ProductGovernanceConsole activeTab="audit" isPlatformAdmin />);

    await screen.findByText("Quality entregable");
    expect(screen.getByText("1 snapshots")).toBeInTheDocument();
    expect(screen.getByText("score 96")).toBeInTheDocument();
    expect(screen.getByText("quality-test-v1")).toBeInTheDocument();
  });
});
