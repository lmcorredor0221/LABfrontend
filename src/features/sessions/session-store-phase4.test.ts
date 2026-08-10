import { createSessionsStore } from "@/features/sessions/session-store";

function createSessionSummary(
  overrides?: Partial<{
    current_stage: "build_blueprint" | "post_validation" | "ready_for_export";
    status: "ready" | "needs_review";
    updated_at: string;
  }>,
) {
  return {
    created_at: "2026-07-15T18:00:00",
    current_stage: "post_validation" as const,
    id: "session-phase4",
    status: "needs_review" as const,
    title: "Asistente LATAM Phase 4",
    updated_at: "2026-07-15T18:05:00",
    ...overrides,
  };
}

function createBlueprintArtifact() {
  return {
    architecture: "single_agent",
    contract_version: "blueprint.v1",
    delivery_package: {
      blueprint_coverage: {
        covered_sections: 3,
        missing_sections: [],
        overall_status: "partial" as const,
        sections: [],
        total_sections: 3,
      },
      component_readiness: [],
      contract_version: "delivery-package.v1",
      decision_summary: "Blueprint listo para evaluacion y export.",
      decision_trace: [],
      deliverables: [],
      observability_plan: {
        alert_triggers: ["Pending approvals"],
        captured_signals: [],
        cost_tracking: "Por corrida",
        decision_logging: "Auditoria local",
        duration_tracking: "Por etapa",
        plan_summary_policy: "Resumen corto",
        result_tracking: "Persistir score",
        tool_response_logging: "Guardar contratos",
      },
      pattern_catalog: [],
      risk_summary: {
        approval_gates_required: 1,
        high_risks: 0,
        low_risks: 1,
        medium_risks: 1,
        overall_status: "partial" as const,
        side_effect_tools: 1,
        summary: "Requiere un gate para side effects.",
        total_checks: 2,
      },
      roadmap_evolution: {
        current_focus: "Cerrar evaluacion y ACP",
        current_release: "MVP",
        milestones: [],
      },
      workflow_profile: {
        approval_pause: "Pausar en side effects",
        checkpoint_policy: "checkpoint",
        compensation_strategy: "manual",
        execution_pattern: "single_agent",
        inbox_strategy: "fifo",
        outbox_strategy: "summary",
        retry_strategy: "1 retry",
        steps: [],
        timeout_policy: "30s",
      },
    },
    guardrails: ["No ejecutar side effects sin aprobacion"],
    memory_profile: {
      goal_drift_guard: "Revalidar objetivo",
      retrieval_policy: "Recuperar contexto reciente",
      review_trigger: "Cambios de objetivo",
      storage_layers: ["session_state"],
      strategy: "session_memory",
      write_policy: "Persistir checkpoint",
    },
    memory_strategy: "session_memory",
    narrative: "Blueprint listo para evaluacion controlada.",
    readiness_state: "partial" as const,
    reasoning_pattern: "ReAct",
    safety_checks: [],
    tools: [
      {
        approval_reason: "Tiene side effects",
        compensation_strategy: "Rollback manual",
        execution_mode: "api_call",
        failure_mode: "Servicio no disponible",
        has_side_effects: true,
        inputs: ["payload"],
        name: "publicar_payload",
        outputs: ["result"],
        purpose: "Publica un payload",
        requires_approval: true,
        retry_strategy: "1 retry",
        risk_level: "high",
        validations: ["schema"],
      },
    ],
  };
}

function createSnapshot(
  overrides?: Partial<{
    approvalStatus: "pending" | "approved";
    datasetVersion: number;
    overallScore: number;
    rubricVersion: number;
    sessionStage: "post_validation" | "ready_for_export";
    sessionStatus: "ready" | "needs_review";
    updatedAt: string;
  }>,
) {
  const approvalStatus = overrides?.approvalStatus ?? "pending";
  const sessionStage = overrides?.sessionStage ?? "post_validation";
  const sessionStatus = overrides?.sessionStatus ?? "needs_review";
  const overallScore = overrides?.overallScore ?? 68;

  return {
    activity: [],
    alert_events: [],
    approvals: [
      {
        created_at: "2026-07-15T18:04:00",
        gate_key: "side_effect_gate",
        id: "approval-1",
        instructions: "Revisar impacto antes de publicar.",
        rationale: "La tool publica datos hacia un sistema externo.",
        requested_in_stage: "post_validation" as const,
        resolution_note: approvalStatus === "approved" ? "Aprobado por QA" : "",
        resolved_at: approvalStatus === "approved" ? "2026-07-15T18:16:00" : null,
        status: approvalStatus,
        title: "Aprobacion de side effects",
      },
    ],
    artifact_records: [],
    blueprint: createBlueprintArtifact(),
    blueprint_versions: [],
    canvas: null,
    contract_version: "session-snapshot.v1",
    discovery: null,
    evaluation: {
      cases: [],
      coherence_status: overallScore >= 70 ? "complete" : "partial",
      completeness_status: overallScore >= 70 ? "complete" : "partial",
      gaps: overallScore >= 70 ? [] : ["Falta reforzar continuidad ACP"],
      recommendations: overallScore >= 70 ? ["Continuar a export"] : ["Revisar dataset y gates"],
      scores: {
        overall: overallScore,
      },
    },
    evaluation_dataset: {
      blueprint_version_number: 1,
      cases: [
        {
          case_key: "core-1",
          category: "journey",
          expected_result: "Responder con contexto",
          id: "dataset-case-1",
          is_active: true,
          priority: "core",
          scenario: "Usuario pregunta por estado",
          source: "manual",
          title: "Estado con contexto",
        },
      ],
      id: "dataset-1",
      source_action: "bootstrap_dataset",
      status: "ready" as const,
      summary: "Dataset inicial",
      version_number: overrides?.datasetVersion ?? 1,
    },
    evaluation_rubric: {
      blueprint_version_number: 1,
      dimensions: [
        {
          description: "Valida claridad",
          hard_block: false,
          key: "clarity",
          label: "Claridad",
          weight: 100,
        },
      ],
      id: "rubric-1",
      source_action: "bootstrap_rubric",
      summary: "Rubrica principal",
      version_number: overrides?.rubricVersion ?? 1,
    },
    evaluation_runs: [
      {
        blocking_issues: overallScore >= 70 ? [] : ["Approval pendiente"],
        blueprint_version_number: 1,
        category_scores: {
          journey: overallScore,
        },
        created_at: "2026-07-15T18:12:00",
        dataset_version_number: overrides?.datasetVersion ?? 1,
        dimension_scores: {
          clarity: overallScore,
        },
        id: "run-1",
        overall_score: overallScore,
        recommendations: overallScore >= 70 ? ["Exportar ACP"] : ["Cerrar gate"],
        results: [
          {
            blocking_issues: [],
            case_key: "core-1",
            category: "journey",
            evidence: ["snapshot"],
            observed_result: "Respuesta con contexto",
            recommendations: [],
            score: overallScore,
            status: overallScore >= 70 ? ("ready" as const) : ("needs_review" as const),
            summary: "Caso evaluado correctamente.",
            title: "Estado con contexto",
          },
        ],
        rubric_version_number: overrides?.rubricVersion ?? 1,
        source_action: "manual_run",
        status: overallScore >= 70 ? ("ready" as const) : ("needs_review" as const),
        summary: overallScore >= 70 ? "Corrida apta para ACP." : "La corrida requiere revision.",
      },
    ],
    governance_policies: [
      {
        compliance_status: approvalStatus === "approved" ? "compliant" : "blocked",
        evidence: [`pending_approvals=${approvalStatus === "approved" ? 0 : 1}`],
        id: "policy-1",
        is_active: true,
        label: "Promotion blockers",
        policy_key: "promotion_blockers",
        policy_payload: {},
        scope: "session",
        summary: "Bloquea promotion si hay approvals pendientes.",
        updated_at: "2026-07-15T18:04:00",
      },
    ],
    handoff_records: [],
    integration_statuses: [],
    metric_snapshots: [],
    selected_workflow_template_key: "single-agent-default",
    session: createSessionSummary({
      current_stage: sessionStage,
      status: sessionStatus,
      updated_at: overrides?.updatedAt ?? "2026-07-15T18:05:00",
    }),
    skill_catalog: [
      {
        evidence_policy: "always",
        input_schema: {},
        is_active: true,
        label: "Evaluation skill",
        output_schema: {},
        skill_key: "evaluation_skill",
        stage_hint: "post_validation",
        summary: "Reejecuta la skill de evaluacion",
      },
    ],
    skill_runs: [],
    subagent_runs: [
      {
        blueprint_version_number: 1,
        created_at: "2026-07-15T18:07:00",
        feature_flag_key: "specialized_subagents_v1",
        id: "subagent-run-1",
        input_payload: {},
        output_payload: {},
        run_kind: "risk_specialist",
        status: "needs_review" as const,
        summary: "Revisar tool con side effects.",
        title: "Subagente de riesgo",
      },
    ],
    validations: [],
    workflow_templates: [],
  };
}

function createEvaluationEnvelope(overrides?: Partial<{ status: "ready" | "needs_review" }>) {
  return {
    assumptions: [],
    data: {
      cases: [],
      coherence_status: "complete" as const,
      completeness_status: "complete" as const,
      gaps: [],
      recommendations: ["Continuar a ACP"],
      scores: {
        overall: 82,
      },
    },
    evidence: [],
    missing_fields: [],
    next_action: "security_review",
    stage: "post_validation" as const,
    status: overrides?.status ?? "ready",
    warnings: [],
  };
}

function createAcpPreview() {
  return {
    blueprint_version_number: 1,
    construction_readiness: {
      assumptions_count: 1,
      blocking_gaps: 0,
      can_start_build: true,
      gaps: [],
      next_recommended_action: "Exportar paquete",
      open_questions: 0,
      overall_status: "ready_to_build" as const,
    },
    files: [],
    manifest_path: "ACP/manifest.yaml",
    package_version: "acp.v1",
    session_id: "session-phase4",
    validation: {
      can_export_zip: true,
      completeness_percent: 100,
      issues: [],
      overall_status: "complete" as const,
    },
  };
}

describe("session store phase 4 flow", () => {
  it("bootstraps evaluation assets, refreshes after evaluation/governance, and advances to ACP export readiness", async () => {
    const api = {
      answerAcpQuestion: vi.fn(),
      bootstrapEvaluation: vi.fn().mockResolvedValue(createSnapshot()),
      buildBlueprint: vi.fn(),
      buildCanvas: vi.fn(),
      create: vi.fn(),
      enrichBlueprint: vi.fn(),
      evaluateBlueprint: vi.fn().mockResolvedValue(createEvaluationEnvelope()),
      exportAcpZip: vi.fn(),
      exportJson: vi.fn(),
      exportMarkdown: vi.fn(),
      generateAcp: vi.fn().mockResolvedValue(createAcpPreview()),
      getAcpConstructionReadiness: vi.fn(),
      getAcpFile: vi.fn(),
      getAcpGap: vi.fn(),
      getAcpKnowledgeGraph: vi.fn(),
      getAcpPreview: vi.fn(),
      getAcpQuestions: vi.fn(),
      getAcpValidation: vi.fn(),
      getSnapshot: vi
        .fn()
        .mockResolvedValueOnce(
          createSnapshot({
            datasetVersion: 2,
            overallScore: 82,
            rubricVersion: 2,
            sessionStatus: "ready",
            updatedAt: "2026-07-15T18:12:00",
          }),
        )
        .mockResolvedValueOnce(
          createSnapshot({
            approvalStatus: "approved",
            datasetVersion: 2,
            overallScore: 82,
            rubricVersion: 2,
            sessionStatus: "ready",
            updatedAt: "2026-07-15T18:16:00",
          }),
        )
        .mockResolvedValueOnce(
          createSnapshot({
            approvalStatus: "approved",
            datasetVersion: 2,
            overallScore: 82,
            rubricVersion: 2,
            sessionStage: "ready_for_export",
            sessionStatus: "ready",
            updatedAt: "2026-07-15T18:20:00",
          }),
        ),
      list: vi
        .fn()
        .mockResolvedValueOnce({
          items: [createSessionSummary({ current_stage: "post_validation", status: "ready", updated_at: "2026-07-15T18:12:00" })],
        })
        .mockResolvedValueOnce({
          items: [createSessionSummary({ current_stage: "post_validation", status: "ready", updated_at: "2026-07-15T18:16:00" })],
        })
        .mockResolvedValueOnce({
          items: [createSessionSummary({ current_stage: "ready_for_export", status: "ready", updated_at: "2026-07-15T18:20:00" })],
        }),
      normalizeDiscovery: vi.fn(),
      patchBlueprint: vi.fn(),
      patchEvaluationDataset: vi
        .fn()
        .mockResolvedValue(
          createSnapshot({
            datasetVersion: 2,
            updatedAt: "2026-07-15T18:08:00",
          }),
        ),
      patchEvaluationRubric: vi
        .fn()
        .mockResolvedValue(
          createSnapshot({
            datasetVersion: 2,
            rubricVersion: 2,
            updatedAt: "2026-07-15T18:10:00",
          }),
        ),
      rerunSkill: vi.fn(),
      resolveApproval: vi.fn().mockResolvedValue({
        created_at: "2026-07-15T18:04:00",
        gate_key: "side_effect_gate",
        id: "approval-1",
        requested_in_stage: "post_validation",
        resolution_note: "Aprobado por QA",
        resolved_at: "2026-07-15T18:16:00",
        status: "approved",
        title: "Aprobacion de side effects",
      }),
      resolveHandoff: vi.fn(),
      runSubagent: vi.fn(),
    };

    const store = createSessionsStore({
      api,
      clearActiveSessionId: vi.fn(),
      loadActiveSessionId: () => null,
      persistActiveSessionId: vi.fn(),
    });

    const bootstrapSnapshot = await store.bootstrapEvaluation("session-phase4");
    expect(api.bootstrapEvaluation).toHaveBeenCalledWith("session-phase4");
    expect(bootstrapSnapshot.evaluation_dataset?.version_number).toBe(1);
    expect(store.getState().activeSnapshot?.evaluation_rubric?.version_number).toBe(1);

    const datasetSnapshot = await store.patchEvaluationDataset("session-phase4", {
      cases: createSnapshot().evaluation_dataset?.cases ?? [],
    });
    expect(api.patchEvaluationDataset).toHaveBeenCalledTimes(1);
    expect(datasetSnapshot.evaluation_dataset?.version_number).toBe(2);

    const rubricSnapshot = await store.patchEvaluationRubric("session-phase4", {
      dimensions: createSnapshot().evaluation_rubric?.dimensions ?? [],
      summary: "Rubrica principal",
    });
    expect(api.patchEvaluationRubric).toHaveBeenCalledTimes(1);
    expect(rubricSnapshot.evaluation_rubric?.version_number).toBe(2);

    const evaluationEnvelope = await store.evaluateBlueprint("session-phase4");
    expect(api.evaluateBlueprint).toHaveBeenCalledWith("session-phase4");
    expect(evaluationEnvelope.status).toBe("ready");
    expect(store.getState().activeSnapshot?.evaluation_runs[0]?.overall_score).toBe(82);

    const approval = await store.resolveApproval("session-phase4", "approval-1", {
      decision: "approved",
      resolution_note: "Aprobado por QA",
    });
    expect(approval.status).toBe("approved");
    expect(store.getState().activeSnapshot?.approvals[0]?.status).toBe("approved");

    const preview = await store.generateAcp("session-phase4");
    expect(api.generateAcp).toHaveBeenCalledWith("session-phase4");
    expect(preview.validation.can_export_zip).toBe(true);
    expect(store.getState().items[0]?.current_stage).toBe("ready_for_export");
    expect(api.list).toHaveBeenCalledTimes(3);
    expect(api.getSnapshot).toHaveBeenCalledTimes(3);
  });
});
