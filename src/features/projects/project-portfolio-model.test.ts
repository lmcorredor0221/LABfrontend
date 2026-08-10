import { describe, expect, it } from "vitest";
import {
  getProjectDisplayTitle,
  getProjectStageLabel,
  getProjectStatusLabel,
  getProjectTierLabel,
  hasActiveFilters,
  normalizePortfolioQuery,
} from "@/features/projects/project-portfolio-model";
import type { ProjectPortfolioItem } from "@/features/projects/project-portfolio-contracts";

const baseProject: ProjectPortfolioItem = {
  created_at: "2026-08-05T10:00:00Z",
  current_stage: "normalize_discovery",
  id: "project-1",
  status: "ready",
  title: "  ",
  updated_at: "2026-08-05T12:00:00Z",
};

describe("project portfolio model", () => {
  it("uses suggested title when the canonical title is empty", () => {
    expect(getProjectDisplayTitle({ ...baseProject, suggested_title: "Agente de soporte" })).toBe("Agente de soporte");
  });

  it("maps backend enums to product language", () => {
    expect(getProjectStageLabel("normalize_discovery")).toBe("Discovery");
    expect(getProjectStatusLabel("needs_review")).toBe("Atencion");
    expect(getProjectTierLabel("blueprint_pro")).toBe("Blueprint Pro");
  });

  it("normalizes query defaults and detects active filters", () => {
    const query = normalizePortfolioQuery({
      limit: 200,
      q: "ventas",
      status: "ready",
    });

    expect(query.limit).toBe(50);
    expect(query.lifecycle).toBe("active");
    expect(hasActiveFilters(query)).toBe(true);
  });
});
