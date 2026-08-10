import { render, screen } from "@testing-library/react";
import { ApprovalBar, EvidenceDrawer, StageProposalStatus, StaleBanner } from "@/features/journey/stage-proposal-ui";
import type { JourneyStageArtifactEntry } from "@/features/sessions/session-contracts";

function createArtifact(overrides?: Partial<JourneyStageArtifactEntry>): JourneyStageArtifactEntry {
  return {
    approved_at: null,
    approved_by_user_id: null,
    artifact_kind: "blueprint_design",
    based_on_artifact_id: null,
    confidence: 0.91,
    context_fingerprint: "ctx-1",
    corpus_hash: "corpus-1",
    created_at: "2026-07-22T09:00:00",
    decisions: [],
    evidence_manifest: [
      {
        artifact_ref: "artifact-0",
        authority_level: "approved",
        citation_label: "Discovery v1",
        detail: "Objetivos y restricciones consolidadas",
        retrieval_score: 0.92,
        section_key: "problem_statement",
        source_id: "discover-v1",
        source_lineage: ["discover:v1"],
        source_type: "journey_artifact",
        source_version: "1",
        used_for: "Construir arquitectura base",
      },
    ],
    execution_backend: "provider_native",
    id: "artifact-1",
    input_fingerprint: "input-1",
    missing_information: [],
    model: "gpt-5",
    output_fingerprint: "output-1",
    prompt_version: "design.v1",
    proposal_payload: {
      narrative: "Agente con coordinador y skill de CRM",
    },
    provider_key: "openai",
    rejected_at: null,
    reviewed_at: null,
    schema_version: "journey-stage-artifact.v1",
    session_id: "session-1",
    source_action: "enrich_blueprint",
    source_stage_versions: {
      define: 1,
    },
    stage_key: "design",
    stale_at: null,
    stale_reasons: [],
    state: "generated",
    superseded_by_artifact_id: null,
    updated_at: "2026-07-22T09:05:00",
    user_patch: {},
    version_number: 1,
    warnings: [],
    workspace_id: "workspace-1",
    ...overrides,
  };
}

describe("stage proposal UI", () => {
  it("renders proposal status badges and evidence details", () => {
    const artifact = createArtifact();

    render(
      <>
        <StageProposalStatus artifact={artifact} />
        <EvidenceDrawer evidence={artifact.evidence_manifest} />
      </>,
    );

    expect(screen.getByText("Generado")).toBeInTheDocument();
    expect(screen.getByText("v1")).toBeInTheDocument();
    expect(screen.getByText("openai")).toBeInTheDocument();
    expect(screen.getByText("Evidencia usada")).toBeInTheDocument();
  });

  it("shows stale reasons and blocks approvals for stale artifacts", () => {
    const artifact = createArtifact({
      stale_reasons: ["discover_changed", "define_changed"],
      state: "stale",
    });

    render(
      <>
        <StaleBanner artifact={artifact} />
        <ApprovalBar artifact={artifact} onApprove={vi.fn()} onReject={vi.fn()} />
      </>,
    );

    expect(screen.getByText("Esta propuesta quedó desactualizada por cambios upstream.")).toBeInTheDocument();
    expect(screen.getByText("discover_changed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aprobar propuesta" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Rechazar" })).toBeDisabled();
  });
});
