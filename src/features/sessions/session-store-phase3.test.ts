import { createSessionsStore } from "@/features/sessions/session-store";

function createSessionSummary(
  overrides?: Partial<{
    created_at: string;
    current_stage: "build_blueprint" | "post_validation";
    id: string;
    status: "ready" | "needs_review";
    title: string;
    updated_at: string;
  }>,
) {
  return {
    created_at: "2026-07-15T16:00:00",
    current_stage: "build_blueprint" as const,
    id: "session-1",
    status: "ready" as const,
    title: "Agente comercial LATAM",
    updated_at: "2026-07-15T16:10:00",
    ...overrides,
  };
}

function createDiscoveryArtifact() {
  return {
    autonomy_level: "medium",
    case_type: "copiloto",
    constraints: ["CRM Salesforce", "Politicas internas"],
    current_process: "Seguimiento comercial",
    current_user: "Equipo comercial LATAM",
    desired_outcome: "Reducir el tiempo de seguimiento y aumentar la conversion",
    mvp_definition: {
      non_delegable_decisions: ["Aprobar descuentos"],
      north_star_metric: "Reducir el tiempo de seguimiento en 30%",
      out_of_scope: ["Editar CRM"],
      v1_scope: ["Consultar pipeline", "Sugerir respuestas"],
    },
    operational_baseline: {
      automation_opportunities: ["Clasificar leads", "Resumir historial"],
      current_cost: "Impacto moderado en tiempo y calidad",
      current_time_spent: "Entre 2 y 8 horas por semana",
      frequent_errors: ["Datos incompletos", "Seguimiento tardio"],
    },
    problem_statement: "Las solicitudes comerciales llegan por varios canales y el seguimiento es inconsistente.",
    value_statement: "Ayuda al equipo comercial a responder mas rapido.",
  };
}

function createCanvasArtifact() {
  return {
    agent_profile: {
      agent_task: "Priorizar oportunidades y sugerir siguientes acciones",
      allowed_decisions: ["Sugerir siguiente paso"],
      expected_outputs: ["Resumen ejecutivo", "Prioridad sugerida"],
      human_approvals: ["Aprobacion de descuentos"],
      key_inputs: ["CRM Salesforce", "Historial comercial"],
      mission: "Ayudar al equipo comercial a mover el pipeline",
      primary_user: "Equipo comercial LATAM",
      prohibited_decisions: ["Cerrar contratos", "Modificar precios"],
      success_metrics: ["Reducir el tiempo de seguimiento en 30%"],
    },
    mvp_scope: ["Consultar pipeline", "Sugerir respuestas"],
    out_of_scope: ["Editar CRM"],
    primary_risk: "Datos desactualizados en CRM",
    success_metric: "Reducir el tiempo de seguimiento en 30%",
    user_goal: "Acelerar el seguimiento comercial",
  };
}

function createBlueprintArtifact(
  overrides?: Partial<{
    architecture: string;
    decisionSummary: string;
    deliverables: Array<{
      content_markdown: string;
      key: string;
      summary: string;
      title: string;
    }>;
    guardrails: string[];
    memoryStrategy: string;
    narrative: string;
    readiness_state: "complete" | "partial" | "blocked";
    reasoningPattern: string;
    tools: Array<{
      approval_reason: string;
      compensation_strategy: string;
      execution_mode: string;
      failure_mode: string;
      has_side_effects: boolean;
      inputs: string[];
      name: string;
      outputs: string[];
      purpose: string;
      requires_approval: boolean;
      retry_strategy: string;
      risk_level: string;
      validations: string[];
    }>;
  }>,
) {
  const tools =
    overrides?.tools ?? [
      {
        approval_reason: "",
        compensation_strategy: "No aplica porque no hay side effects.",
        execution_mode: "in_process_validation",
        failure_mode: "No hay datos suficientes para priorizar",
        has_side_effects: false,
        inputs: ["lead_context"],
        name: "priorizar_oportunidad",
        outputs: ["priority_score", "next_step"],
        purpose: "Priorizar oportunidades comerciales",
        requires_approval: false,
        retry_strategy: "Reintentar una vez cuando falten campos opcionales",
        risk_level: "low",
        validations: ["Schema valido"],
      },
    ];

  return {
    architecture: overrides?.architecture ?? "single_agent",
    contract_version: "blueprint.v1",
    delivery_package: {
      blueprint_coverage: {
        covered_sections: 3,
        missing_sections: [],
        overall_status: "partial" as const,
        sections: [
          {
            key: "design",
            note: "Decision estructural inicial lista.",
            source: "builder",
            status: "complete" as const,
            title: "Design",
          },
          {
            key: "tools",
            note: "Falta detallar el catalogo completo de tools.",
            source: "builder",
            status: "partial" as const,
            title: "Tools",
          },
          {
            key: "memory",
            note: "Perfil de memoria base disponible.",
            source: "builder",
            status: "partial" as const,
            title: "Memory",
          },
        ],
        total_sections: 3,
      },
      component_readiness: [
        {
          blocking_issues: [],
          checks: [],
          completed_checks: 3,
          component: "design",
          label: "Design",
          score: 100,
          status: "complete" as const,
          total_checks: 3,
        },
        {
          blocking_issues: [],
          checks: [],
          completed_checks: 2,
          component: "tools",
          label: "Tools",
          score: 80,
          status: "partial" as const,
          total_checks: 3,
        },
        {
          blocking_issues: [],
          checks: [],
          completed_checks: 2,
          component: "memory",
          label: "Memory",
          score: 75,
          status: "partial" as const,
          total_checks: 3,
        },
      ],
      contract_version: "delivery-package.v1",
      decision_summary:
        overrides?.decisionSummary ??
        "El agente prioriza oportunidades con un flujo simple y mantiene decisiones gobernadas.",
      decision_trace: [],
      deliverables: overrides?.deliverables ?? [],
      observability_plan: {
        alert_triggers: ["Baja confianza del scoring", "Tool failure repetido"],
        captured_signals: ["latency_ms", "tool_failures"],
        cost_tracking: "Seguimiento por run",
        decision_logging: "Registrar rationale de cada sugerencia",
        duration_tracking: "Capturar tiempo por etapa",
        plan_summary_policy: "Resumir cada checkpoint",
        result_tracking: "Persistir resultados clave del agente",
        tool_response_logging: "Log de contratos tool in/out",
      },
      pattern_catalog: [],
      risk_summary: {
        approval_gates_required: 0,
        high_risks: 0,
        low_risks: 2,
        medium_risks: 0,
        overall_status: "partial" as const,
        side_effect_tools: 0,
        summary: "Riesgo operativo bajo con monitoreo local.",
        total_checks: 2,
      },
      roadmap_evolution: {
        current_focus: "Cerrar el flujo central del builder",
        current_release: "MVP",
        milestones: [
          {
            capabilities: ["Discover", "Define", "Design"],
            objective: "Cerrar el flujo base",
            release: "MVP",
            title: "Builder v1",
            when_to_unlock: "Cuando el blueprint este listo",
          },
        ],
      },
      workflow_profile: {
        approval_pause: "Pausar en side effects",
        checkpoint_policy: "Checkpoint al final de cada etapa",
        compensation_strategy: "Rollback manual con trazabilidad",
        execution_pattern: "single_agent",
        inbox_strategy: "Procesar solicitudes por prioridad",
        outbox_strategy: "Publicar resumen y siguiente accion",
        retry_strategy: "Un reintento por error recuperable",
        steps: [
          {
            actor: "builder",
            fallback: "Escalar a humano",
            name: "priorizar_oportunidad",
            objective: "Priorizar oportunidades comerciales",
            outputs: ["priority_score"],
            requires_approval: false,
          },
        ],
        timeout_policy: "Abortar si supera 30s",
      },
    },
    guardrails: overrides?.guardrails ?? ["No ejecutar side effects sin aprobacion"],
    memory_profile: {
      goal_drift_guard: "Revalidar objetivo antes de cada accion",
      retrieval_policy: "Recuperar contexto por prioridad y sesion",
      review_trigger: "Abrir revision si cambia el objetivo del usuario",
      storage_layers: ["session_state", "checkpoint_summary"],
      strategy: overrides?.memoryStrategy ?? "session_memory",
      write_policy: "Persistir al final de cada checkpoint",
    },
    memory_strategy: overrides?.memoryStrategy ?? "session_memory",
    narrative:
      overrides?.narrative ??
      "Single agent con herramientas guiadas para priorizar oportunidades y preparar el siguiente paso comercial.",
    readiness_state: overrides?.readiness_state ?? "partial",
    reasoning_pattern: overrides?.reasoningPattern ?? "ReAct",
    safety_checks: [],
    tools,
  };
}

function createBlueprintEnvelope(
  data: ReturnType<typeof createBlueprintArtifact>,
  overrides?: Partial<{
    next_action: string;
    stage: "build_blueprint" | "post_validation";
    status: "ready" | "needs_review";
    warnings: string[];
  }>,
) {
  return {
    assumptions: [],
    data,
    evidence: [],
    missing_fields: [],
    next_action: overrides?.next_action ?? "patch_blueprint",
    stage: overrides?.stage ?? "build_blueprint",
    status: overrides?.status ?? "ready",
    warnings: overrides?.warnings ?? [],
  };
}

function createBlueprintSnapshot(
  summaryOverrides?: Partial<{
    current_stage: "build_blueprint" | "post_validation";
    updated_at: string;
  }>,
  blueprintOverrides?: Parameters<typeof createBlueprintArtifact>[0],
) {
  return {
    activity: [],
    approvals: [],
    blueprint: createBlueprintArtifact(blueprintOverrides),
    blueprint_versions: [
      {
        architecture: blueprintOverrides?.architecture ?? "single_agent",
        created_at: "2026-07-15T16:15:00",
        readiness_state: blueprintOverrides?.readiness_state ?? "partial",
        reasoning_pattern: blueprintOverrides?.reasoningPattern ?? "ReAct",
        source_action: "build_blueprint",
        status: "ready" as const,
        version_number: 1,
      },
    ],
    canvas: createCanvasArtifact(),
    contract_version: "session-snapshot.v1",
    discovery: createDiscoveryArtifact(),
    integration_statuses: [],
    metric_snapshots: [],
    selected_workflow_template_key: "single-agent-default",
    session: createSessionSummary(summaryOverrides),
    validations: [
      {
        artifact_name: "blueprint",
        created_at: summaryOverrides?.updated_at ?? "2026-07-15T16:15:00",
        missing_fields: [],
        status: "ready" as const,
        warnings: [],
      },
    ],
  };
}

describe("session store phase 3 flow", () => {
  it("builds, patches, enriches, and refetches the blueprint snapshot after every mutation", async () => {
    const builtBlueprint = createBlueprintArtifact();
    const patchedBlueprint = createBlueprintArtifact({
      architecture: "single_agent_with_skills",
      decisionSummary: "El blueprint ya incorpora skills guiadas y un catalogo real de tools.",
      narrative: "Blueprint actualizado con tools y memoria mas estrictas para el equipo comercial.",
      tools: [
        {
          approval_reason: "Consulta y actualiza contexto comercial critico",
          compensation_strategy: "No aplica porque solo consulta datos",
          execution_mode: "api_call",
          failure_mode: "CRM no disponible",
          has_side_effects: false,
          inputs: ["lead_id", "account_id"],
          name: "consultar_crm",
          outputs: ["lead_summary", "next_actions"],
          purpose: "Consultar el CRM y resumir contexto comercial",
          requires_approval: false,
          retry_strategy: "Reintentar una vez con backoff",
          risk_level: "medium",
          validations: ["Lead valido", "Account valida"],
        },
      ],
    });
    const enrichedBlueprint = createBlueprintArtifact({
      architecture: "single_agent_with_skills",
      decisionSummary: "El blueprint ya incluye entregables derivados, herramientas y memoria listas para operar.",
      deliverables: [
        {
          content_markdown: "# Runtime config",
          key: "runtime-config",
          summary: "Configuracion base del runtime del agente",
          title: "Runtime config",
        },
      ],
      narrative: "Blueprint enriquecido con entregables operativos y observabilidad lista.",
      tools: patchedBlueprint.tools,
    });

    const patchPayload = {
      narrative: "Blueprint actualizado con tools y memoria mas estrictas para el equipo comercial.",
      tools: patchedBlueprint.tools,
    };

    const api = {
      buildBlueprint: vi.fn().mockResolvedValue(createBlueprintEnvelope(builtBlueprint)),
      buildCanvas: vi.fn(),
      create: vi.fn(),
      enrichBlueprint: vi.fn().mockResolvedValue(
        createBlueprintEnvelope(enrichedBlueprint, {
          next_action: "ready_for_export",
          stage: "post_validation",
        }),
      ),
      getSnapshot: vi
        .fn()
        .mockResolvedValueOnce(
          createBlueprintSnapshot(
            {
              current_stage: "build_blueprint",
              updated_at: "2026-07-15T16:15:00",
            },
            {
              architecture: builtBlueprint.architecture,
              narrative: builtBlueprint.narrative,
              tools: builtBlueprint.tools,
            },
          ),
        )
        .mockResolvedValueOnce(
          createBlueprintSnapshot(
            {
              current_stage: "build_blueprint",
              updated_at: "2026-07-15T16:22:00",
            },
            {
              architecture: patchedBlueprint.architecture,
              decisionSummary: patchedBlueprint.delivery_package.decision_summary,
              narrative: patchedBlueprint.narrative,
              tools: patchedBlueprint.tools,
            },
          ),
        )
        .mockResolvedValueOnce(
          createBlueprintSnapshot(
            {
              current_stage: "post_validation",
              updated_at: "2026-07-15T16:30:00",
            },
            {
              architecture: enrichedBlueprint.architecture,
              decisionSummary: enrichedBlueprint.delivery_package.decision_summary,
              deliverables: enrichedBlueprint.delivery_package.deliverables,
              narrative: enrichedBlueprint.narrative,
              readiness_state: "complete",
              tools: enrichedBlueprint.tools,
            },
          ),
        ),
      list: vi
        .fn()
        .mockResolvedValueOnce({
          items: [
            createSessionSummary({
              current_stage: "build_blueprint",
              updated_at: "2026-07-15T16:15:00",
            }),
          ],
        })
        .mockResolvedValueOnce({
          items: [
            createSessionSummary({
              current_stage: "build_blueprint",
              updated_at: "2026-07-15T16:22:00",
            }),
          ],
        })
        .mockResolvedValueOnce({
          items: [
            createSessionSummary({
              current_stage: "post_validation",
              updated_at: "2026-07-15T16:30:00",
            }),
          ],
        }),
      normalizeDiscovery: vi.fn(),
      patchBlueprint: vi.fn().mockResolvedValue(createBlueprintEnvelope(patchedBlueprint)),
    };

    const store = createSessionsStore({
      api,
      clearActiveSessionId: vi.fn(),
      loadActiveSessionId: () => null,
      persistActiveSessionId: vi.fn(),
    });

    const buildEnvelope = await store.buildBlueprint("session-1");
    expect(api.buildBlueprint).toHaveBeenCalledWith("session-1");
    expect(buildEnvelope.data.architecture).toBe("single_agent");
    expect(store.getState().activeSnapshot?.blueprint?.architecture).toBe("single_agent");
    expect(store.getState().items[0]?.current_stage).toBe("build_blueprint");

    const patchEnvelope = await store.patchBlueprint("session-1", patchPayload);
    expect(api.patchBlueprint).toHaveBeenCalledWith("session-1", patchPayload);
    expect(patchEnvelope.data.architecture).toBe("single_agent_with_skills");
    expect(store.getState().activeSnapshot?.blueprint?.tools[0]?.name).toBe("consultar_crm");
    expect(store.getState().activeSnapshot?.blueprint?.narrative).toContain("tools y memoria");

    const enrichEnvelope = await store.enrichBlueprint("session-1");
    expect(api.enrichBlueprint).toHaveBeenCalledWith("session-1");
    expect(enrichEnvelope.stage).toBe("post_validation");
    expect(store.getState().activeSnapshot?.blueprint?.delivery_package.deliverables[0]?.key).toBe("runtime-config");
    expect(store.getState().items[0]?.current_stage).toBe("post_validation");
    expect(api.list).toHaveBeenCalledTimes(3);
    expect(api.getSnapshot).toHaveBeenCalledTimes(3);
  });
});
