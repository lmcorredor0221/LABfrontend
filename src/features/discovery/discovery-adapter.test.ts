import {
  buildDiscoveryInput,
  createDiscoveryFormValues,
  getDiscoveryFieldErrors,
  getDiscoveryInputMissingFields,
  mapAutonomySliderToLevel,
} from "@/features/discovery/discovery-adapter";

describe("discovery payload adapter", () => {
  it("builds the backend payload from the connected discovery form", () => {
    const payload = buildDiscoveryInput({
      automationOpportunities: "Clasificar tickets\nResumir casos",
      autonomyLevel: 0.82,
      constraints: "CRM Salesforce\nPoliticas de compliance",
      currentCost: "Impacto alto en costos o experiencia",
      currentProcess: "Atender tickets de soporte",
      currentTimeSpent: "Entre 2 y 8 horas por semana",
      currentUser: "Equipo de soporte",
      desiredOutcome: "Reducir tiempos de respuesta",
      frequentErrors: "Datos incompletos\nRespuestas inconsistentes",
      nonDelegableDecisions: "Aprobar devoluciones\nEliminar cuentas",
      northStarMetric: "Bajar el tiempo de primera respuesta a menos de 5 minutos",
      outOfScope: "Cambios irreversibles\nIntegraciones con ERP",
      problemStatement: "Las solicitudes llegan por varios canales y se responden tarde.",
      v1Scope: "Clasificar solicitudes\nSugerir respuestas",
    });

    expect(payload.autonomy_level).toBe("high");
    expect(payload.constraints).toEqual(["CRM Salesforce", "Politicas de compliance"]);
    expect(payload.operational_baseline.frequent_errors).toEqual([
      "Datos incompletos",
      "Respuestas inconsistentes",
    ]);
    expect(payload.mvp_definition.v1_scope).toEqual([
      "Clasificar solicitudes",
      "Sugerir respuestas",
    ]);
    expect(payload.mvp_definition.non_delegable_decisions).toEqual([
      "Aprobar devoluciones",
      "Eliminar cuentas",
    ]);
  });

  it("mirrors a persisted discovery artifact back into the form and reports missing fields", () => {
    const formValues = createDiscoveryFormValues({
      autonomy_level: "medium",
      case_type: "copiloto",
      constraints: ["CRM"],
      current_process: "Seguimiento comercial",
      current_user: "Equipo de ventas",
      desired_outcome: "Acelerar cierres",
      mvp_definition: {
        non_delegable_decisions: ["Aprobar descuentos"],
        north_star_metric: "",
        out_of_scope: [],
        v1_scope: ["Consultar pipeline"],
      },
      operational_baseline: {
        automation_opportunities: [],
        current_cost: "",
        current_time_spent: "Mas de 2 dias por semana",
        frequent_errors: [],
      },
      problem_statement: "No existe visibilidad del pipeline.",
      value_statement: "Mejor visibilidad para el equipo comercial.",
    });

    expect(formValues.currentProcess).toBe("Seguimiento comercial");
    expect(formValues.autonomyLevel).toBeGreaterThan(0.34);
    expect(mapAutonomySliderToLevel(formValues.autonomyLevel)).toBe("medium");

    const fieldErrors = getDiscoveryFieldErrors(formValues);
    const missingFields = getDiscoveryInputMissingFields(buildDiscoveryInput(formValues));

    expect(fieldErrors.currentCost).toBeDefined();
    expect(fieldErrors.frequentErrors).toBeDefined();
    expect(fieldErrors.automationOpportunities).toBeDefined();
    expect(fieldErrors.northStarMetric).toBeDefined();
    expect(missingFields).toContain("operational_baseline.current_cost");
    expect(missingFields).toContain("mvp_definition.north_star_metric");
  });
});
