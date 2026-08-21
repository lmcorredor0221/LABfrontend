import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/core/i18n/language-context";
import type { DiagramGovernanceEntry, DiagramGovernanceOverview } from "@/features/diagram-center/domain/governance-types";
import { diagramGovernanceApi } from "@/features/diagram-center/infrastructure/diagram-governance-api";
import { DiagramGovernancePage } from "./diagram-governance-page";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("@/features/diagram-center/infrastructure/diagram-governance-api", () => ({
  diagramGovernanceApi: {
    list: vi.fn(),
    overview: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/features/operations/operations-module-shell", () => ({
  OperationsModuleShell: ({ actions, children }: { actions?: ReactNode; children: ReactNode }) => (
    <div>
      <div>{actions}</div>
      <main>{children}</main>
    </div>
  ),
}));

const processEntry: DiagramGovernanceEntry = {
  diagram_key: "current_process_map",
  access_level: "downloadable",
  active: true,
  category: "process",
  default_generation_state: "generated",
  description: "Mapa del proceso actual.",
  diagram_surface: "process_design",
  enabled: true,
  enabled_from_stage: "discover",
  formats: {
    available: ["svg", "mermaid"],
    preferred: "svg",
  },
  generation_enabled: true,
  notation: "flowchart",
  notes: "",
  preview_mode: "limited",
  product_scope: ["blueprint", "acp"],
  prompt_override: {},
  prompt_spec: {
    diagram_key: "current_process_map",
    exclusions: ["No incluir secretos."],
    notation: "flowchart",
    objective: "Representar el proceso actual.",
    output_contract: "diagram-model.v1",
    presentation_contract: "diagram-presentation.v1",
    quality_gates: ["Debe ser legible."],
    renderer_key: "renderer.svg.generic.v1",
    required_inputs: ["session.discovery"],
    semantic_rules: ["Usar contexto aprobado."],
    source_contract: "diagram-model.v1",
    standard: "Generic directed graph",
    validator_key: "diagram.graph_integrity.v1",
    version: "diagram-prompts.v1.0.0",
    layout_guidance: {
      enable_adaptive_sizing: true,
      enable_edge_routing: true,
      max_edge_density: 0.16,
      max_edges_per_view: 22,
      max_nodes_per_view: 16,
      preferred_direction: "LR",
      preferred_strategy: "layered",
      visual_quality_min_score: 82,
    },
  },
  prompt_spec_version: "diagram-prompts.v1.0.0",
  prompt_status: "active",
  portable_paths: ["Blueprint/diagrams/current-process-map.svg"],
  required_tier: "blueprint",
  source_artifact_keys: ["discovery.problem_context_brief"],
  title: "Diagrama del proceso actual",
  updated_at: null,
};

const overview: DiagramGovernanceOverview = {
  active_provider: "codex_local",
  average_quality_score: 0,
  contract_version: "diagram-governance-overview.v1",
  job_counts: {},
  model_name: "gpt-5.5",
  prompt_spec_version: "diagram-prompts.v1.0.0",
  provider_configured: true,
  provider_mode: "local",
  recent_audit: [],
  recent_jobs: [],
  registry_version: "diagram-registry.v1",
  total_versions: 0,
};

describe("DiagramGovernancePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(diagramGovernanceApi.list).mockResolvedValue({
      contract_version: "diagram-governance.v1",
      entries: [processEntry],
    });
    vi.mocked(diagramGovernanceApi.overview).mockResolvedValue(overview);
    vi.mocked(diagramGovernanceApi.update).mockImplementation(async (_diagramKey, payload) => ({
      ...processEntry,
      ...payload,
      prompt_override: payload.prompt_override,
      prompt_spec: {
        ...processEntry.prompt_spec,
        ...payload.prompt_override,
        output_contract: String(payload.prompt_override.source_contract ?? processEntry.prompt_spec.output_contract),
      },
    }));
  });

  it("applies the complete BPMN profile when the notation changes", async () => {
    const user = userEvent.setup();
    render(
      <LanguageProvider initialLanguage="es">
        <DiagramGovernancePage />
      </LanguageProvider>,
    );

    await screen.findByText("Diagrama del proceso actual");
    await user.click(screen.getByText(/Configurar/));
    await user.selectOptions(screen.getByLabelText("Notacion"), "bpmn");

    await screen.findByText(/BPMN 2\.0: usa bpmn-source\.v1/);

    const numericInputs = screen.getAllByRole("spinbutton");
    await user.clear(numericInputs[0]);
    await user.type(numericInputs[0], "12");

    await user.click(screen.getByRole("button", { name: /Guardar/ }));

    await waitFor(() => {
      expect(diagramGovernanceApi.update).toHaveBeenCalledWith(
        "current_process_map",
        expect.objectContaining({
          prompt_override: expect.objectContaining({
            notation: "bpmn",
            renderer_key: "renderer.bpmn_js.v1",
            source_contract: "bpmn-source.v1",
            standard: "BPMN 2.0",
            validator_key: "bpmn.2_0.schema_semantic.v1",
            layout_guidance: expect.objectContaining({
              max_nodes_per_view: 12,
              preferred_strategy: "bpmn_swimlane",
            }),
          }),
        }),
      );
    });
  });
});
