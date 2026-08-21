import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DiagramCatalog, DiagramDetail } from "@/features/diagram-center/domain/types";
import { diagramCenterApi } from "@/features/diagram-center/infrastructure/diagram-center-api";
import { useDiagramCenter } from "./use-diagram-center";

vi.mock("@/features/diagram-center/infrastructure/diagram-center-api", () => ({
  diagramCenterApi: {
    catalog: vi.fn(),
    compare: vi.fn(),
    detail: vi.fn(),
    download: vi.fn(),
    generate: vi.fn(),
    job: vi.fn(),
  },
}));

const catalogMock = vi.mocked(diagramCenterApi.catalog);
const detailMock = vi.mocked(diagramCenterApi.detail);

function buildCatalog(generationState: DiagramCatalog["entries"][number]["generation_state"]): DiagramCatalog {
  const currentVersion =
    generationState === "available"
      ? {
          created_at: "2026-08-13T12:58:00.000Z",
          id: "version-1",
          model_name: "gpt-5.5",
          prompt_spec_version: "diagram-prompts.v1.0.0",
          provider_key: "codex_local",
          quality_score: 94,
          state: "available",
          version_number: 1,
        }
      : null;

  return {
    available_count: currentVersion ? 1 : 0,
    contract_version: "diagram-catalog.v3",
    current_stage: "estimate",
    entries: [
      {
        access: {
          access_state: "available",
          can_compare: false,
          can_download: false,
          can_generate: !currentVersion,
          can_regenerate: Boolean(currentVersion),
          can_view: true,
          cta_label: "",
          reason: "Disponible para Blueprint.",
          reason_code: "entitled",
          required_tier: "blueprint",
          visible: true,
        },
        available_actions: currentVersion ? ["view", "regenerate"] : ["generate"],
        benefit: "Muestra el proceso comercial del Blueprint.",
        category: "flow",
        complexity: "basic",
        current_version: currentVersion,
        description: "Diagrama preparado por el resultado comercial.",
        family: "process",
        generation_state: generationState,
        key: "current_process_map",
        layout_upgrade_reason: "",
        needs_layout_upgrade: false,
        notation: "bpmn",
        products: ["blueprint"],
        required_tier: "blueprint",
        stage: "discover",
        title: "Diagrama del proceso actual",
        type: "current_process",
        updated_at: currentVersion?.created_at ?? null,
      },
    ],
    locked_count: 0,
    preview_count: 0,
    project_id: "project-1",
    provider_key: "codex_local",
    tier: "blueprint",
    total_count: 1,
    workspace_id: "workspace-1",
  };
}

function buildDetail(modelAvailable: boolean): DiagramDetail {
  return {
    contract_version: "diagram-detail.v3",
    item: buildCatalog(modelAvailable ? "available" : "queued").entries[0],
    model: modelAvailable
      ? {
          assumptions: [],
          description: "Modelo disponible.",
          diagram_key: "current_process_map",
          direction: "LR",
          edges: [],
          groups: [],
          legend: [],
          metadata: {},
          nodes: [],
          notation: "bpmn",
          pools: [],
          schema_version: "diagram-model.v1",
          source_refs: ["artifact:blueprint"],
          title: "Diagrama del proceso actual",
        }
      : null,
    project_id: "project-1",
    quality: modelAvailable ? { checks: { valid: true }, errors: [], score: 94, valid: true, warnings: [] } : null,
    renderings: modelAvailable ? { svg: '<svg xmlns="http://www.w3.org/2000/svg"><title>Proceso</title></svg>' } : {},
    versions: modelAvailable ? [buildCatalog("available").entries[0].current_version!] : [],
  };
}

describe("useDiagramCenter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("refreshes automatic Blueprint diagram jobs and loads the generated version", async () => {
    catalogMock.mockResolvedValueOnce(buildCatalog("queued")).mockResolvedValueOnce(buildCatalog("available"));
    detailMock.mockResolvedValueOnce(buildDetail(false)).mockResolvedValueOnce(buildDetail(true));

    renderHook(() => useDiagramCenter("project-1"));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(catalogMock).toHaveBeenCalledTimes(1);
    expect(detailMock).toHaveBeenCalledWith("project-1", "current_process_map", undefined);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(catalogMock).toHaveBeenCalledTimes(2);
    expect(detailMock).toHaveBeenLastCalledWith("project-1", "current_process_map", "version-1");
  });
});
