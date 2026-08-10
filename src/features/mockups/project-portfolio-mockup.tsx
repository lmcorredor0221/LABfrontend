"use client";

import { useState } from "react";
import { PageChrome, WorkspaceShell } from "@/components/lean/shell";
import { ProjectListState } from "@/features/projects/components/project-list-state";
import { ProjectMobileList } from "@/features/projects/components/project-mobile-list";
import { ProjectPortfolioHeader } from "@/features/projects/components/project-portfolio-header";
import { ProjectSummaryStrip } from "@/features/projects/components/project-summary-strip";
import { ProjectTable } from "@/features/projects/components/project-table";
import { ProjectToolbar } from "@/features/projects/components/project-toolbar";
import type { ProjectPortfolioItem, ProjectPortfolioQuery } from "@/features/projects/project-portfolio-contracts";
import { DEFAULT_PROJECT_PORTFOLIO_QUERY } from "@/features/projects/project-portfolio-api";

const sampleProjects: ProjectPortfolioItem[] = [
  {
    capabilities: {
      can_archive: true,
      can_delete: false,
      can_open: true,
      can_rename: true,
      can_restore: false,
    },
    commercial_tier: "blueprint_pro",
    created_at: "2026-08-01T11:10:00Z",
    current_stage: "build_blueprint",
    id: "portfolio-demo-1",
    pending_attention_count: 2,
    progress_percent: 62,
    row_version: 4,
    status: "needs_review",
    title: "Asistente de soporte interno RR. HH.",
    title_source: "manual",
    updated_at: "2026-08-05T14:30:00Z",
  },
  {
    capabilities: {
      can_archive: true,
      can_delete: false,
      can_open: true,
      can_rename: true,
      can_restore: false,
    },
    commercial_tier: "blueprint",
    created_at: "2026-08-02T09:00:00Z",
    current_stage: "normalize_discovery",
    id: "portfolio-demo-2",
    pending_attention_count: 0,
    progress_percent: 38,
    row_version: 2,
    status: "ready",
    title: "Agente comercial para cotizaciones B2B",
    title_source: "generated",
    updated_at: "2026-08-05T10:22:00Z",
  },
  {
    capabilities: {
      can_archive: true,
      can_delete: false,
      can_open: true,
      can_rename: true,
      can_restore: false,
    },
    commercial_tier: "acp",
    created_at: "2026-07-29T17:40:00Z",
    current_stage: "ready_for_export",
    id: "portfolio-demo-3",
    pending_attention_count: 0,
    progress_percent: 100,
    row_version: 7,
    status: "ready",
    title: "Onboarding tecnico para nuevos clientes",
    title_source: "manual",
    updated_at: "2026-08-04T21:08:00Z",
  },
  {
    capabilities: {
      can_archive: true,
      can_delete: false,
      can_open: true,
      can_rename: true,
      can_restore: false,
    },
    commercial_tier: "blueprint",
    created_at: "2026-08-03T08:15:00Z",
    current_stage: "input_validation",
    id: "portfolio-demo-4",
    pending_attention_count: 1,
    progress_percent: 20,
    row_version: 1,
    status: "draft",
    title: "Analista de contratos legales",
    title_source: "generated",
    updated_at: "2026-08-04T18:45:00Z",
  },
];

export function ProjectPortfolioMockup() {
  const [query, setQuery] = useState<ProjectPortfolioQuery>(DEFAULT_PROJECT_PORTFOLIO_QUERY);
  const filteredProjects = sampleProjects.filter((project) => {
    const matchesSearch = project.title.toLowerCase().includes(query.q.toLowerCase());
    const matchesStatus = query.status === "all" || project.status === query.status;
    const matchesTier = query.tier === "all" || project.commercial_tier === query.tier;
    return matchesSearch && matchesStatus && matchesTier;
  });

  return (
    <WorkspaceShell>
      <PageChrome breadcrumbs={["Mockups", "Portafolio de proyectos"]} density="compact">
        <div className="space-y-3">
          <ProjectPortfolioHeader canCreate creating={false} onCreateProject={() => undefined} />
          <ProjectToolbar
            facets={{
              active: 18,
              archived: 4,
              needs_review: 3,
              trash: 1,
            }}
            query={query}
            onChange={(patch) => setQuery((currentQuery) => ({ ...currentQuery, ...patch }))}
          />
          <ProjectSummaryStrip
            facets={{
              active: 18,
              archived: 4,
              needs_review: 3,
              trash: 1,
            }}
            total={filteredProjects.length}
          />
          {filteredProjects.length ? (
            <>
              <ProjectTable
                items={filteredProjects}
                mutatingProjectId={null}
                onArchive={() => undefined}
                onDelete={() => undefined}
                onOpen={() => undefined}
                onRename={() => undefined}
                onRestore={() => undefined}
              />
              <ProjectMobileList
                items={filteredProjects}
                mutatingProjectId={null}
                onArchive={() => undefined}
                onDelete={() => undefined}
                onOpen={() => undefined}
                onRename={() => undefined}
                onRestore={() => undefined}
              />
            </>
          ) : (
            <ProjectListState
              description="Ajusta los filtros para volver a ver proyectos representativos."
              kind="no-results"
              title="Mockup sin resultados"
            />
          )}
        </div>
      </PageChrome>
    </WorkspaceShell>
  );
}
