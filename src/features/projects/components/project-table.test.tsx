import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProjectTable } from "@/features/projects/components/project-table";
import type { ProjectPortfolioItem } from "@/features/projects/project-portfolio-contracts";

const writableProject: ProjectPortfolioItem = {
  capabilities: {
    can_archive: true,
    can_delete: false,
    can_open: true,
    can_rename: true,
    can_restore: false,
  },
  commercial_tier: "blueprint_pro",
  created_at: "2026-08-05T10:00:00Z",
  current_stage: "build_blueprint",
  id: "project-1",
  pending_attention_count: 2,
  progress_percent: 62,
  row_version: 3,
  status: "needs_review",
  title: "Asistente de soporte",
  updated_at: "2026-08-05T12:00:00Z",
};

const viewerProject: ProjectPortfolioItem = {
  ...writableProject,
  capabilities: {
    can_archive: false,
    can_delete: false,
    can_open: true,
    can_rename: false,
    can_restore: false,
  },
  id: "project-2",
  title: "Consulta ejecutiva",
};

describe("ProjectTable", () => {
  it("renders compact portfolio rows with authorized actions only", () => {
    render(
      <ProjectTable
        items={[writableProject, viewerProject]}
        mutatingProjectId={null}
        onArchive={vi.fn()}
        onDelete={vi.fn()}
        onOpen={vi.fn()}
        onRename={vi.fn()}
        onRestore={vi.fn()}
      />,
    );

    expect(screen.getByText("Asistente de soporte")).toBeInTheDocument();
    expect(screen.getByText("Consulta ejecutiva")).toBeInTheDocument();
    expect(screen.getAllByText("Abrir")).toHaveLength(2);
    expect(screen.getAllByLabelText("Renombrar proyecto")).toHaveLength(1);
    expect(screen.getAllByLabelText("Archivar proyecto")).toHaveLength(1);
  });
});
