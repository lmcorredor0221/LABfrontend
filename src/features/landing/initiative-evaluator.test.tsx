import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { InitiativeEvaluator } from "./initiative-evaluator";
import * as contracts from "./initiative-evaluator-contracts";
import { LanguageProvider } from "@/core/i18n/language-context";

describe("InitiativeEvaluator Component", () => {
  it("renders the evaluator form with title, textarea, and quick examples", () => {
    render(
      <LanguageProvider initialLanguage="es">
        <InitiativeEvaluator />
      </LanguageProvider>,
    );

    expect(screen.getByText("EXPERIENCIA DIRECTA DE PRODUCTO")).toBeInTheDocument();
    expect(screen.getByText("¿Qué quieres resolver?")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Describe tu necesidad de negocio aquí/i)).toBeInTheDocument();
    expect(screen.getByText(/Tenemos 6 personas revisando facturas/i)).toBeInTheDocument();
    expect(screen.getByText("Analizar mi caso gratis")).toBeInTheDocument();
  });

  it("populates textarea when clicking a quick example chip", async () => {
    const user = userEvent.setup();
    render(
      <LanguageProvider initialLanguage="es">
        <InitiativeEvaluator />
      </LanguageProvider>,
    );

    const chip = screen.getByText(/Tenemos 6 personas revisando facturas/i);
    await user.click(chip);

    const textarea = screen.getByPlaceholderText(/Describe tu necesidad de negocio aquí/i) as HTMLTextAreaElement;
    expect(textarea.value).toContain("Tenemos 6 personas revisando facturas");
  });

  it("calls evaluation API and displays scorecard for viable initiative", async () => {
    const user = userEvent.setup();
    const mockResponse: contracts.InitiativeEvaluationResponse = {
      is_viable: true,
      readiness_score: 88,
      verdict_badge: "viable",
      verdict_title: "Candidato Óptimo para Construcción de Agente IA",
      verdict_summary: "La iniciativa reúne las condiciones clave de orquestación y datos no estructurados.",
      suggested_archetype: "Copiloto HITL y Orquestador de Sistemas",
      suggested_tier: "acp",
      dimensions: [
        {
          dimension_key: "ambiguity_reasoning",
          dimension_name: "Ambigüedad y Razonamiento",
          score: 85,
          weight: 0.25,
          justification: "Procesa PDFs no estructurados.",
          status: "optimal",
        },
        {
          dimension_key: "tool_orchestration",
          dimension_name: "Orquestación de Herramientas",
          score: 90,
          weight: 0.25,
          justification: "Llama a API de SAP.",
          status: "optimal",
        },
      ],
      key_strengths: ["Entradas no estructuradas", "Integración con ERP"],
      key_risks_or_gaps: ["Detallar esquemas de herramientas"],
      alternative: null,
      prefilled_project_data: {
        title: "Agente: Auditor De Facturas",
        initial_prompt: "Auditar facturas en PDF contra SAP",
        archetype: "Copiloto HITL",
      },
      token_usage: { prompt_tokens: 0, completion_tokens: 0, latency_ms: 10 },
      evaluation_id: "eval_test_123",
    };

    const spy = vi.spyOn(contracts, "evaluateInitiativeApi").mockResolvedValueOnce(mockResponse);
    const onStartProject = vi.fn();

    render(
      <LanguageProvider initialLanguage="es">
        <InitiativeEvaluator onStartProject={onStartProject} />
      </LanguageProvider>,
    );

    const textarea = screen.getByPlaceholderText(/Describe tu necesidad de negocio aquí/i);
    await user.type(textarea, "Auditor de facturas contra SAP");

    const submitBtn = screen.getByText("Analizar mi caso gratis");
    await user.click(submitBtn);

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
      expect(screen.getByText("Candidato Óptimo para Construcción de Agente IA")).toBeInTheDocument();
      expect(screen.getByText(/88/)).toBeInTheDocument();
      expect(screen.getByText("Iniciar Blueprint de esta Solución")).toBeInTheDocument();
    });

    const ctaBtn = screen.getByText("Iniciar Blueprint de esta Solución");
    await user.click(ctaBtn);
    expect(onStartProject).toHaveBeenCalledWith({
      title: "Agente: Auditor De Facturas",
      initial_prompt: "Auditar facturas en PDF contra SAP",
      archetype: "Copiloto HITL",
    });
  });

  it("displays strategic alternative card for non-viable initiative", async () => {
    const user = userEvent.setup();
    const mockResponse: contracts.InitiativeEvaluationResponse = {
      is_viable: false,
      readiness_score: 25,
      verdict_badge: "not_recommended",
      verdict_title: "No Recomendado: Alternativa Tecnológica Indicada",
      verdict_summary: "Esta iniciativa se resuelve mejor con código determinista o RPA.",
      suggested_archetype: null,
      suggested_tier: null,
      dimensions: [
        {
          dimension_key: "ambiguity_reasoning",
          dimension_name: "Ambigüedad y Razonamiento",
          score: 20,
          weight: 0.25,
          justification: "Reglas completamente fijas.",
          status: "critical",
        },
      ],
      key_strengths: [],
      key_risks_or_gaps: ["Reglas estáticas"],
      alternative: {
        recommended_technology: "Script Python / Cron Job",
        technology_category: "deterministic_script",
        why_not_agent: "Un agente agregaría costos de tokens innecesarios.",
        estimated_cost_risk: "Ahorro del 99.8% con script.",
        suggested_next_step: "Implementar como endpoint simple.",
      },
      prefilled_project_data: {},
      token_usage: { prompt_tokens: 0, completion_tokens: 0, latency_ms: 5 },
      evaluation_id: "eval_test_456",
    };

    vi.spyOn(contracts, "evaluateInitiativeApi").mockResolvedValueOnce(mockResponse);

    render(
      <LanguageProvider initialLanguage="es">
        <InitiativeEvaluator />
      </LanguageProvider>,
    );

    const textarea = screen.getByPlaceholderText(/Describe tu necesidad de negocio aquí/i);
    await user.type(textarea, "Calculadora simple de impuestos");

    const submitBtn = screen.getByText("Analizar mi caso gratis");
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Recomendación Estratégica Alternativa")).toBeInTheDocument();
      expect(screen.getByText("Script Python / Cron Job")).toBeInTheDocument();
      expect(screen.getByText("Un agente agregaría costos de tokens innecesarios.")).toBeInTheDocument();
    });
  });
});
