import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/core/i18n/language-context";
import type { DiagramCatalog, DiagramDetail } from "@/features/diagram-center/domain/types";
import { DiagramCenterPage } from "./diagram-center-page";

const generate = vi.fn();
const setSelectedKey = vi.fn();

const catalog: DiagramCatalog = {
  available_count: 1,
  contract_version: "diagram-catalog.v3",
  current_stage: "design",
  entries: [
    {
      access: {
        access_state: "available",
        can_compare: true,
        can_download: true,
        can_generate: true,
        can_regenerate: true,
        can_view: true,
        cta_label: "",
        reason: "Disponible por plan y etapa.",
        reason_code: "entitled",
        required_tier: "blueprint",
        visible: true,
      },
      available_actions: ["view", "download", "regenerate"],
      benefit: "Alinea negocio y tecnología.",
      category: "architecture",
      complexity: "advanced",
      current_version: {
        created_at: "2026-08-05T10:00:00",
        id: "version-1",
        model_name: "configured-model",
        prompt_spec_version: "diagram-prompts.v1.0.0",
        provider_key: "deepseek",
        quality_score: 96,
        state: "available",
        version_number: 1,
      },
      description: "Vista integral de la solución.",
      family: "architecture",
      generation_state: "available",
      key: "solution_architecture",
      layout_upgrade_reason: "",
      needs_layout_upgrade: false,
      notation: "flowchart",
      products: ["blueprint", "acp"],
      required_tier: "blueprint",
      stage: "design",
      title: "Arquitectura de solución",
      type: "solution_architecture",
      updated_at: "2026-08-05T10:00:00",
    },
    {
      access: {
        access_state: "locked",
        can_compare: false,
        can_download: false,
        can_generate: false,
        can_regenerate: false,
        can_view: false,
        cta_label: "Adquirir ACP",
        reason: "Este diagrama reduce ambigüedad de despliegue.",
        reason_code: "plan_required",
        required_tier: "acp",
        visible: true,
      },
      available_actions: [],
      benefit: "Reduce ambigüedad de despliegue.",
      category: "infrastructure",
      complexity: "advanced",
      current_version: null,
      description: "Topología física del runtime.",
      family: "deployment",
      generation_state: "pending",
      key: "deployment_diagram",
      layout_upgrade_reason: "",
      needs_layout_upgrade: false,
      notation: "deployment",
      products: ["acp"],
      required_tier: "acp",
      stage: "package",
      title: "Diagrama de despliegue",
      type: "deployment",
      updated_at: null,
    },
  ],
  locked_count: 1,
  preview_count: 0,
  project_id: "project-1",
  provider_key: "deepseek",
  tier: "blueprint",
  total_count: 2,
  workspace_id: "workspace-1",
};

const detail: DiagramDetail = {
  contract_version: "diagram-detail.v3",
  item: catalog.entries[0],
  model: {
    assumptions: [],
    description: "Modelo",
    diagram_key: "solution_architecture",
    direction: "LR",
    edges: [],
    groups: [],
    legend: [],
    metadata: {},
    nodes: [],
    notation: "flowchart",
    pools: [],
    schema_version: "diagram-model.v1",
    source_refs: ["artifact:1"],
    title: "Arquitectura de solución",
  },
  project_id: "project-1",
  quality: { checks: { valid: true }, errors: [], score: 96, valid: true, warnings: [] },
  renderings: { svg: '<svg xmlns="http://www.w3.org/2000/svg"><title>Arquitectura</title></svg>' },
  versions: [catalog.entries[0].current_version!],
};

vi.mock("@/features/diagram-center/application/use-diagram-center", () => ({
  useDiagramCenter: () => ({
    catalog,
    catalogStatus: "ready",
    compare: vi.fn(),
    comparison: null,
    detail,
    detailStatus: "ready",
    download: vi.fn(),
    error: "",
    generate,
    job: null,
    loadCatalog: vi.fn(),
    loadDetail: vi.fn(),
    selectedKey: "solution_architecture",
    setSelectedKey,
  }),
}));

describe("DiagramCenterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderPage() {
    return render(
      <LanguageProvider initialLanguage="es">
        <DiagramCenterPage projectId="project-1" />
      </LanguageProvider>,
    );
  }

  it("presents the governed catalog and the safe generated preview", () => {
    renderPage();

    expect(screen.getByRole("heading", { name: /diagramas de la soluci/i })).toBeInTheDocument();
    expect(screen.getAllByText("Arquitectura de solución").length).toBeGreaterThan(0);
    expect(screen.getByText("Diagrama de despliegue")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Diagrama Arquitectura de solución" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Vista desplazable de Arquitectura de solución" })).toHaveAttribute(
      "tabindex",
      "0",
    );
    expect(screen.getByText("Proveedor: Deepseek")).toBeInTheDocument();
  });

  it("filters by search and keeps the locked value discoverable", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByRole("searchbox", { name: "Buscar diagramas" }), "despliegue");

    const catalogRegion = screen.getByRole("region", { name: "Catálogo de diagramas" });
    expect(within(catalogRegion).queryByText("Arquitectura de solución")).not.toBeInTheDocument();
    expect(within(catalogRegion).getByText("Diagrama de despliegue")).toBeInTheDocument();
    expect(within(catalogRegion).getByText("Por plan")).toBeInTheDocument();
  });

  it("regenerates an entitled diagram through the application layer", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getAllByRole("button", { name: /regenerar/i })[0]);

    expect(generate).toHaveBeenCalledWith("solution_architecture", "regenerate");
  });

  it("requests a controlled layout upgrade for old renderer revisions", async () => {
    const user = userEvent.setup();
    catalog.entries[0].available_actions = ["view", "download", "regenerate", "layout_upgrade"];
    catalog.entries[0].layout_upgrade_reason = "Renderer anterior diagram-renderer.v1.2.0 detectado.";
    catalog.entries[0].needs_layout_upgrade = true;

    renderPage();

    await user.click(screen.getAllByRole("button", { name: /actualizar legibilidad/i })[0]);

    expect(generate).toHaveBeenCalledWith("solution_architecture", "layout_upgrade");

    catalog.entries[0].available_actions = ["view", "download", "regenerate"];
    catalog.entries[0].layout_upgrade_reason = "";
    catalog.entries[0].needs_layout_upgrade = false;
  });
});
