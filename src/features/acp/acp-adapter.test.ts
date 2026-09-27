import {
  buildConstructionQuestionPayload,
  createQuestionDraft,
  downloadReadyExportJob,
  getBlockingQuestions,
  getConstructionQuestionErrors,
  getExportBlockedReason,
} from "@/features/acp/acp-adapter";
import { sessionsApi } from "@/features/sessions/session-api";

vi.mock("@/features/sessions/session-api", () => ({
  sessionsApi: {
    downloadExportJob: vi.fn(),
  },
}));

const mockSessionsApi = vi.mocked(sessionsApi);

describe("acp adapter", () => {
  it("requires a non-empty continuity answer", () => {
    expect(getConstructionQuestionErrors(createQuestionDraft())).toEqual({
      answerText: "La respuesta no puede quedar vacia.",
    });
  });

  it("normalizes question payload content", () => {
    const payload = buildConstructionQuestionPayload({
      answerText: "  Definir owner tecnico y ruta de despliegue  ",
      impactedArtifactsText: "ACP/manifest.yaml\nACP/runtime/system-prompt.md\n",
      ownerRole: "  Platform Lead  ",
    });

    expect(payload).toEqual({
      answer_text: "Definir owner tecnico y ruta de despliegue",
      decision: "answer",
      impacted_artifacts: ["ACP/manifest.yaml", "ACP/runtime/system-prompt.md"],
      owner_role: "Platform Lead",
    });
  });

  it("allows delegating a continuity question without forcing an answer", () => {
    expect(getConstructionQuestionErrors(createQuestionDraft(), "delegate")).toEqual({});

    const payload = buildConstructionQuestionPayload(
      {
        answerText: "   ",
        impactedArtifactsText: "",
        ownerRole: "  Platform Lead  ",
      },
      "delegate",
    );

    expect(payload).toEqual({
      answer_text: "",
      decision: "delegate",
      impacted_artifacts: [],
      owner_role: "Platform Lead",
    });
  });

  it("blocks export when validation or blocking questions remain", () => {
    const preview = {
      blueprint_version_number: 3,
      construction_readiness: {
        assumptions_count: 1,
        blocking_gaps: 1,
        can_start_build: false,
        gaps: [],
        next_recommended_action: "Responder la pregunta pendiente.",
        open_questions: 1,
        overall_status: "needs_questions" as const,
      },
      files: [],
      manifest_path: "ACP/manifest.yaml",
      package_version: "acp.v1",
      session_id: "session-1",
      validation: {
        can_export_zip: false,
        completeness_percent: 82,
        issues: [],
        overall_status: "needs_review" as const,
      },
    };

    expect(getExportBlockedReason(preview, [])).toBe(
      "El backend aun marca issues bloqueantes para el paquete ACP.",
    );

    const exportablePreview = {
      ...preview,
      validation: {
        ...preview.validation,
        can_export_zip: true,
      },
    };

    expect(
      getExportBlockedReason(exportablePreview, [
        {
          answer_text: "",
          answered_at: null,
          answered_by_display: "",
          blocking: true,
          domain: "deployment",
          expected_answer_format: "text",
          gap_key: "gap-1",
          gap_title: "Deployment owner",
          impacted_artifacts: [],
          owner_role: "",
          question_key: "question-1",
          question_text: "Quien es el owner?",
          rationale: "",
          resolved_at: null,
          status: "open" as const,
          target_owner: "Platform",
        },
      ]),
    ).toBe("Todavia hay preguntas bloqueantes sin resolver.");

    const delegatedBlockingQuestion = [
      {
        answer_text: "Delegado a implementacion.",
        answered_at: null,
        answered_by_display: "",
        blocking: true,
        domain: "deployment",
        expected_answer_format: "text",
        gap_key: "gap-1",
        gap_title: "Deployment owner",
        impacted_artifacts: [],
        owner_role: "",
        question_key: "question-1",
        question_text: "Quien es el owner?",
        rationale: "",
        resolved_at: "2026-08-27T09:00:00Z",
        status: "deferred" as const,
        target_owner: "Platform",
      },
    ];

    expect(getBlockingQuestions(delegatedBlockingQuestion)).toEqual([]);
    expect(getExportBlockedReason(exportablePreview, delegatedBlockingQuestion)).toBeNull();
  });

  it("downloads a ready ACP export through the authenticated API", async () => {
    let clickedDownload = "";
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      clickedDownload = this.download;
    });
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const createObjectUrl = vi.fn(() => "blob:acp-export");
    const revokeObjectUrl = vi.fn();

    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectUrl,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectUrl,
    });

    mockSessionsApi.downloadExportJob.mockResolvedValueOnce(new Blob(["acp"], { type: "application/zip" }));

    try {
      await downloadReadyExportJob({
        sessionId: "session-1",
        job: {
          artifact_kind: "acp_portable_zip",
          checksum_sha256: "checksum",
          completed_at: "2026-09-26T20:00:00Z",
          content_type: "application/zip",
          created_at: "2026-09-26T20:00:00Z",
          download_url: "/api/v1/sessions/session-1/exports/jobs/job-1/download",
          error_message: "",
          expires_at: "2026-09-27T20:00:00Z",
          file_name: "agent-acp.zip",
          id: "job-1",
          metadata: {},
          product_key: "acp",
          profile: "acp-portable",
          session_id: "session-1",
          size_bytes: 1024,
          status: "ready",
          updated_at: "2026-09-26T20:00:00Z",
          workspace_id: "workspace-1",
        },
      });

      expect(mockSessionsApi.downloadExportJob).toHaveBeenCalledWith("session-1", "job-1");
      expect(createObjectUrl).toHaveBeenCalledTimes(1);
      expect(clickedDownload).toBe("agent-acp.zip");
      expect(revokeObjectUrl).not.toHaveBeenCalled();
    } finally {
      clickSpy.mockRestore();
      Object.defineProperty(URL, "createObjectURL", {
        configurable: true,
        value: originalCreateObjectUrl,
      });
      Object.defineProperty(URL, "revokeObjectURL", {
        configurable: true,
        value: originalRevokeObjectUrl,
      });
    }
  });
});
