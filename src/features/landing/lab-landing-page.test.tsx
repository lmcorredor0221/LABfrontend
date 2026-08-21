import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LabLandingPage } from "./lab-landing-page";
import * as contracts from "./initiative-evaluator-contracts";
import { LanguageProvider } from "@/core/i18n/language-context";
import { CurrencyProvider } from "@/core/commerce/currency-context";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  user: null,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
  usePathname: () => "/",
}));

vi.mock("@/core/auth/auth-context", () => ({
  useAuth: () => ({
    user: mocks.user,
    status: mocks.user ? "authenticated" : "anonymous",
    isHydrated: true,
  }),
}));

describe("LabLandingPage Component", () => {
  function renderWithProviders() {
    return render(
      <LanguageProvider initialLanguage="es">
        <CurrencyProvider>
          <LabLandingPage />
        </CurrencyProvider>
      </LanguageProvider>,
    );
  }

  it("renders all core sections of the LAB landing page", () => {
    renderWithProviders();

    // Navbar
    expect(screen.getAllByText(/LAB/i)[0]).toBeInTheDocument();
    expect(screen.getByText("Diseño de Asistentes IA")).toBeInTheDocument();

    // Hero
    expect(screen.getByText(/No programes a ciegas. Diseña los/i)).toBeInTheDocument();
    expect(screen.getByText(/No construyas la casa sin los planos. Evita proyectos fallidos de IA./i)).toBeInTheDocument();

    // Direct product experience (Simulator)
    expect(screen.getByText("Evaluación Gratuita")).toBeInTheDocument();
    expect(screen.getByText("¿Qué tarea repetitiva agota a tu equipo?")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Escribe aquí tu problema/i)).toBeInTheDocument();

    // Methodology (4 steps)
    expect(screen.getByText("4 pasos antes de escribir código")).toBeInTheDocument();
    expect(screen.getByText("El Problema Real")).toBeInTheDocument();
    expect(screen.getByText("Entrega de Planos")).toBeInTheDocument();

    // Deliverables (Blueprint vs ACP)
    expect(screen.getByText("Dos documentos. Un solo objetivo: Claridad.")).toBeInTheDocument();
    expect(screen.getByText("PLANO ESTRATÉGICO (BLUEPRINT)")).toBeInTheDocument();
    expect(screen.getByText("PAQUETE TÉCNICO (ACP)")).toBeInTheDocument();

    // Impact calculator
    expect(screen.getByText("Estimación de Impacto en Horas")).toBeInTheDocument();

    // Commercial plans
    expect(screen.getByText("Planes por Proyecto")).toBeInTheDocument();
    expect(screen.getByText("Free")).toBeInTheDocument();

    // Agencies & Factory
    expect(screen.getByText("¿Construyes agentes para clientes?")).toBeInTheDocument();
    expect(screen.getByText("¿No tienes programadores? Nosotros lo construimos.")).toBeInTheDocument();

    // FAQs
    expect(screen.getByText("Preguntas Frecuentes")).toBeInTheDocument();
  });

  it("interacts with the Impact Calculator buttons", async () => {
    const user = userEvent.setup();
    renderWithProviders();

    const smallScaleBtn = screen.getByText(/Pequeño \(1 Agente\)/i);
    await user.click(smallScaleBtn);

    expect(screen.getByText("120 – 160 h")).toBeInTheDocument();
    expect(screen.getByText("60 – 90 h")).toBeInTheDocument();
  });

  it("runs AI initiative analysis and displays scorecard inside Interactive Simulator", async () => {
    const user = userEvent.setup();
    const mockResponse: contracts.InitiativeEvaluationResponse = {
      is_viable: true,
      readiness_score: 87,
      verdict_badge: "viable",
      verdict_title: "LAB entendió tu necesidad: Candidato Óptimo",
      verdict_summary: "La iniciativa reúne las condiciones de orquestación y datos no estructurados.",
      suggested_archetype: "Extracción y Conciliación",
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
      ],
      key_strengths: ["Entradas no estructuradas"],
      key_risks_or_gaps: ["Validar esquemas de herramientas"],
      alternative: null,
      prefilled_project_data: {
        title: "Agente: Conciliador Facturas",
        initial_prompt: "Validar facturas contra ERP SAP",
        archetype: "Conciliador HITL",
      },
      token_usage: { prompt_tokens: 0, completion_tokens: 0, latency_ms: 12 },
      evaluation_id: "eval_landing_123",
    };

    vi.spyOn(contracts, "evaluateInitiativeApi").mockResolvedValueOnce(mockResponse);

    renderWithProviders();

    // Prefill via example chip
    const exampleChip = screen.getByText(/"6 personas revisando facturas a mano\.\.\."/i);
    await user.click(exampleChip);

    const textarea = screen.getByPlaceholderText(/Escribe aquí tu problema/i) as HTMLTextAreaElement;
    expect(textarea.value).toContain("Tenemos 6 personas revisando facturas");

    const analyzeBtn = screen.getByText("Analizar si la IA puede ayudarme");
    await user.click(analyzeBtn);

    await waitFor(() => {
      expect(screen.getByText("¡Sí, la IA puede automatizar esto!")).toBeInTheDocument();
      expect(screen.getByText("Ver cómo crear mis planos →")).toBeInTheDocument();
    });
  });
});
