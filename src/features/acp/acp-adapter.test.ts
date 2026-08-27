import {
  buildConstructionQuestionPayload,
  createQuestionDraft,
  getBlockingQuestions,
  getConstructionQuestionErrors,
  getExportBlockedReason,
} from "@/features/acp/acp-adapter";

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
});
