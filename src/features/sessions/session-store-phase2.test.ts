import { createSessionsStore } from "@/features/sessions/session-store";

function createSessionSummary(overrides?: Partial<{
  created_at: string;
  current_stage: "normalize_discovery" | "build_canvas";
  id: string;
  status: "ready" | "needs_review";
  title: string;
  updated_at: string;
}>) {
  return {
    created_at: "2026-07-15T12:00:00",
    current_stage: "normalize_discovery" as const,
    id: "session-1",
    status: "ready" as const,
    title: "Asistente comercial",
    updated_at: "2026-07-15T12:30:00",
    ...overrides,
  };
}

describe("session store phase 2 flow", () => {
  it("normalizes discovery, refreshes the live snapshot, and then builds canvas", async () => {
    const api = {
      buildCanvas: vi.fn().mockResolvedValue({
        assumptions: [],
        data: {
          agent_profile: {
            agent_task: "Priorizar oportunidades",
            allowed_decisions: ["Sugerir siguiente paso"],
            expected_outputs: ["Resumen ejecutivo"],
            human_approvals: ["Aprobacion de descuentos"],
            key_inputs: ["CRM", "Historial comercial"],
            mission: "Ayudar al equipo comercial a mover el pipeline",
            primary_user: "Equipo de ventas",
            prohibited_decisions: ["Cerrar ventas"],
            success_metrics: ["Tasa de adopcion"],
          },
          mvp_scope: ["Consultar pipeline", "Sugerir respuestas"],
          out_of_scope: ["Editar CRM"],
          primary_risk: "Datos desactualizados en CRM",
          success_metric: "Reducir el tiempo de seguimiento en un 30%",
          user_goal: "Acelerar el seguimiento comercial",
        },
        evidence: [],
        missing_fields: [],
        next_action: "build_blueprint",
        stage: "build_canvas",
        status: "ready",
        warnings: [],
      }),
      create: vi.fn(),
      getSnapshot: vi
        .fn()
        .mockResolvedValueOnce({
          activity: [],
          approvals: [],
          contract_version: "session-snapshot.v1",
          discovery: {
            autonomy_level: "medium",
            case_type: "copiloto",
            constraints: ["CRM"],
            current_process: "Seguimiento comercial",
            current_user: "Equipo de ventas",
            desired_outcome: "Acelerar cierres",
            mvp_definition: {
              non_delegable_decisions: ["Aprobar descuentos"],
              north_star_metric: "Reducir el tiempo de seguimiento en 30%",
              out_of_scope: ["Editar CRM"],
              v1_scope: ["Consultar pipeline", "Sugerir respuestas"],
            },
            operational_baseline: {
              automation_opportunities: ["Resumir oportunidades"],
              current_cost: "Impacto moderado en tiempo y calidad",
              current_time_spent: "Entre 2 y 8 horas por semana",
              frequent_errors: ["Datos incompletos"],
            },
            problem_statement: "No existe seguimiento consistente del pipeline.",
            value_statement: "Ayuda al equipo comercial a responder mas rapido.",
          },
          integration_statuses: [],
          metric_snapshots: [],
          session: createSessionSummary(),
          validations: [
            {
              artifact_name: "discovery",
              created_at: "2026-07-15T12:31:00",
              missing_fields: [],
              status: "ready",
              warnings: [],
            },
          ],
        })
        .mockResolvedValueOnce({
          activity: [],
          approvals: [],
          canvas: {
            agent_profile: {
              agent_task: "Priorizar oportunidades",
              allowed_decisions: ["Sugerir siguiente paso"],
              expected_outputs: ["Resumen ejecutivo"],
              human_approvals: ["Aprobacion de descuentos"],
              key_inputs: ["CRM", "Historial comercial"],
              mission: "Ayudar al equipo comercial a mover el pipeline",
              primary_user: "Equipo de ventas",
              prohibited_decisions: ["Cerrar ventas"],
              success_metrics: ["Tasa de adopcion"],
            },
            mvp_scope: ["Consultar pipeline", "Sugerir respuestas"],
            out_of_scope: ["Editar CRM"],
            primary_risk: "Datos desactualizados en CRM",
            success_metric: "Reducir el tiempo de seguimiento en un 30%",
            user_goal: "Acelerar el seguimiento comercial",
          },
          contract_version: "session-snapshot.v1",
          discovery: {
            autonomy_level: "medium",
            case_type: "copiloto",
            constraints: ["CRM"],
            current_process: "Seguimiento comercial",
            current_user: "Equipo de ventas",
            desired_outcome: "Acelerar cierres",
            mvp_definition: {
              non_delegable_decisions: ["Aprobar descuentos"],
              north_star_metric: "Reducir el tiempo de seguimiento en 30%",
              out_of_scope: ["Editar CRM"],
              v1_scope: ["Consultar pipeline", "Sugerir respuestas"],
            },
            operational_baseline: {
              automation_opportunities: ["Resumir oportunidades"],
              current_cost: "Impacto moderado en tiempo y calidad",
              current_time_spent: "Entre 2 y 8 horas por semana",
              frequent_errors: ["Datos incompletos"],
            },
            problem_statement: "No existe seguimiento consistente del pipeline.",
            value_statement: "Ayuda al equipo comercial a responder mas rapido.",
          },
          integration_statuses: [],
          metric_snapshots: [],
          session: createSessionSummary({
            current_stage: "build_canvas",
            updated_at: "2026-07-15T12:35:00",
          }),
          validations: [
            {
              artifact_name: "canvas",
              created_at: "2026-07-15T12:35:00",
              missing_fields: [],
              status: "ready",
              warnings: [],
            },
            {
              artifact_name: "discovery",
              created_at: "2026-07-15T12:31:00",
              missing_fields: [],
              status: "ready",
              warnings: [],
            },
          ],
        }),
      list: vi
        .fn()
        .mockResolvedValueOnce({
          items: [createSessionSummary()],
        })
        .mockResolvedValueOnce({
          items: [
            createSessionSummary({
              current_stage: "build_canvas",
              updated_at: "2026-07-15T12:35:00",
            }),
          ],
        }),
      normalizeDiscovery: vi.fn().mockResolvedValue({
        assumptions: [],
        data: {
          autonomy_level: "medium",
          case_type: "copiloto",
          constraints: ["CRM"],
          current_process: "Seguimiento comercial",
          current_user: "Equipo de ventas",
          desired_outcome: "Acelerar cierres",
          mvp_definition: {
            non_delegable_decisions: ["Aprobar descuentos"],
            north_star_metric: "Reducir el tiempo de seguimiento en 30%",
            out_of_scope: ["Editar CRM"],
            v1_scope: ["Consultar pipeline", "Sugerir respuestas"],
          },
          operational_baseline: {
            automation_opportunities: ["Resumir oportunidades"],
            current_cost: "Impacto moderado en tiempo y calidad",
            current_time_spent: "Entre 2 y 8 horas por semana",
            frequent_errors: ["Datos incompletos"],
          },
          problem_statement: "No existe seguimiento consistente del pipeline.",
          value_statement: "Ayuda al equipo comercial a responder mas rapido.",
        },
        evidence: [],
        missing_fields: [],
        next_action: "build_canvas",
        stage: "normalize_discovery",
        status: "ready",
        warnings: [],
      }),
    };

    const store = createSessionsStore({
      api,
      clearActiveSessionId: vi.fn(),
      loadActiveSessionId: () => null,
      persistActiveSessionId: vi.fn(),
    });

    await store.normalizeDiscovery("session-1", {
      autonomy_level: "medium",
      constraints: ["CRM"],
      current_process: "Seguimiento comercial",
      current_user: "Equipo de ventas",
      desired_outcome: "Acelerar cierres",
      mvp_definition: {
        non_delegable_decisions: ["Aprobar descuentos"],
        north_star_metric: "Reducir el tiempo de seguimiento en 30%",
        out_of_scope: ["Editar CRM"],
        v1_scope: ["Consultar pipeline", "Sugerir respuestas"],
      },
      operational_baseline: {
        automation_opportunities: ["Resumir oportunidades"],
        current_cost: "Impacto moderado en tiempo y calidad",
        current_time_spent: "Entre 2 y 8 horas por semana",
        frequent_errors: ["Datos incompletos"],
      },
      problem_statement: "No existe seguimiento consistente del pipeline.",
    });

    expect(api.normalizeDiscovery).toHaveBeenCalledTimes(1);
    expect(store.getState().activeSnapshot?.discovery?.desired_outcome).toBe("Acelerar cierres");
    expect(store.getState().items[0]?.current_stage).toBe("normalize_discovery");

    await store.buildCanvas("session-1");

    expect(api.buildCanvas).toHaveBeenCalledWith("session-1");
    expect(store.getState().activeSnapshot?.canvas?.user_goal).toBe("Acelerar el seguimiento comercial");
    expect(store.getState().items[0]?.current_stage).toBe("build_canvas");
  });
});
