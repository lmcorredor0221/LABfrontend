import { createSessionsStore } from "@/features/sessions/session-store";
import type { JourneyStageArtifactEntry } from "@/features/sessions/session-contracts";
import type { SessionSnapshot, SessionSummary } from "@/features/sessions/types";

function createSessionSummary(overrides?: Partial<SessionSummary>): SessionSummary {
  return {
    created_at: "2026-07-22T09:00:00",
    current_stage: "build_blueprint",
    id: "session-ci1",
    status: "needs_review",
    title: "Proyecto CI1",
    updated_at: "2026-07-22T09:10:00",
    ...overrides,
  };
}

function createApprovedToolsArtifact(): JourneyStageArtifactEntry {
  return {
    approved_at: "2026-07-22T09:25:00",
    approved_by_user_id: "user-1",
    artifact_kind: "blueprint_tools",
    based_on_artifact_id: null,
    confidence: 0.88,
    context_fingerprint: "ctx-v2",
    corpus_hash: "corpus-v2",
    created_at: "2026-07-22T09:20:00",
    decisions: [],
    evidence_manifest: [],
    execution_backend: "provider_native",
    id: "artifact-v2",
    input_fingerprint: "input-v2",
    missing_information: [],
    model: "gpt-5",
    output_fingerprint: "output-v2",
    prompt_version: "tools.v2",
    proposal_payload: {
      mandatory_tools: ["crm_lookup"],
    },
    provider_key: "openai",
    rejected_at: null,
    reviewed_at: "2026-07-22T09:24:00",
    schema_version: "journey-stage-artifact.v1",
    session_id: "session-ci1",
    source_action: "recommend_tools",
    source_stage_versions: {
      design: 2,
    },
    stage_key: "tools",
    stale_at: null,
    stale_reasons: [],
    state: "approved",
    superseded_by_artifact_id: null,
    updated_at: "2026-07-22T09:25:00",
    user_patch: {
      include_optional_tool_keys: ["knowledge_search"],
    },
    version_number: 2,
    warnings: [],
    workspace_id: "workspace-1",
  };
}

function createSnapshot(overrides?: Partial<SessionSnapshot>): SessionSnapshot {
  return {
    activity: [],
    alert_events: [],
    approvals: [],
    artifact_records: [],
    blueprint: null,
    blueprint_versions: [],
    canvas: null,
    contract_version: "session-snapshot.v1",
    discovery: null,
    estimation_error_metrics: [],
    estimation_report: null,
    estimation_runs: [],
    evaluation: null,
    evaluation_dataset: null,
    evaluation_rubric: null,
    evaluation_runs: [],
    governance_policies: [],
    handoff_records: [],
    integration_statuses: [],
    journey_artifacts: [],
    metric_snapshots: [],
    project_actuals: [],
    session: createSessionSummary(),
    skill_catalog: [],
    skill_runs: [],
    subagent_runs: [],
    simulation_runs: [],
    validations: [],
    workflow_templates: [],
    workspace_contract: {
      catalogs: [],
      contract_version: "workspace-contract.v1",
      feature_flags: [],
      sections: [],
    },
    ...overrides,
  };
}

describe("session store CI1 journey artifact lifecycle", () => {
  it("refreshes session data after create, patch, approve and reject operations", async () => {
    const latestArtifact = createApprovedToolsArtifact();
    const list = vi
      .fn()
      .mockResolvedValueOnce({
        items: [createSessionSummary()],
      })
      .mockResolvedValue({
        items: [
          createSessionSummary({
            updated_at: "2026-07-22T09:30:00",
          }),
        ],
      });
    const getSnapshot = vi
      .fn()
      .mockResolvedValueOnce(createSnapshot())
      .mockResolvedValue(
        createSnapshot({
          journey_artifacts: [latestArtifact],
          journey_latest_artifacts: {
            tools: latestArtifact,
          },
        }),
      );
    const api = {
      approveJourneyArtifact: vi.fn().mockResolvedValue({ id: "artifact-v2" }),
      createJourneyArtifact: vi.fn().mockResolvedValue({ id: "artifact-v1" }),
      getSnapshot,
      list,
      patchJourneyArtifact: vi.fn().mockResolvedValue({ id: "artifact-v2" }),
      rejectJourneyArtifact: vi.fn().mockResolvedValue({ id: "artifact-v2" }),
    };
    const store = createSessionsStore({
      api,
      clearActiveSessionId: vi.fn(),
      loadActiveSessionId: () => "session-ci1",
      persistActiveSessionId: vi.fn(),
    });

    await store.loadSnapshot("session-ci1", true);
    await store.createJourneyArtifact("session-ci1", "tools", {
      artifact_kind: "blueprint_tools",
      proposal_payload: {
        mandatory_tools: ["crm_lookup"],
      },
    });
    await store.patchJourneyArtifact("session-ci1", "tools", "artifact-v1", {
      user_patch: {
        include_optional_tool_keys: ["knowledge_search"],
      },
    });
    await store.approveJourneyArtifact("session-ci1", "tools", "artifact-v2", {
      note: "Configuracion validada",
    });
    await store.rejectJourneyArtifact("session-ci1", "tools", "artifact-v2", {
      note: "Se requiere simplificar el set",
    });

    expect(api.createJourneyArtifact).toHaveBeenCalledWith("session-ci1", "tools", {
      artifact_kind: "blueprint_tools",
      proposal_payload: {
        mandatory_tools: ["crm_lookup"],
      },
    });
    expect(api.patchJourneyArtifact).toHaveBeenCalledWith("session-ci1", "tools", "artifact-v1", {
      user_patch: {
        include_optional_tool_keys: ["knowledge_search"],
      },
    });
    expect(api.approveJourneyArtifact).toHaveBeenCalledWith("session-ci1", "tools", "artifact-v2", {
      note: "Configuracion validada",
    });
    expect(api.rejectJourneyArtifact).toHaveBeenCalledWith("session-ci1", "tools", "artifact-v2", {
      note: "Se requiere simplificar el set",
    });
    expect(store.getState().activeSnapshot?.journey_latest_artifacts?.tools?.state).toBe("approved");
    expect(list).toHaveBeenCalledTimes(4);
    expect(getSnapshot).toHaveBeenCalledTimes(5);
  });
});
