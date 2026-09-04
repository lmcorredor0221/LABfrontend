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
    expect(screen.getByRole("heading", { name: /Diseña agentes de IA para tu empresa/i })).toBeInTheDocument();
    expect(screen.getByText(/Evalúa qué procesos automatizar con IA/i)).toBeInTheDocument();

    // Direct product experience (Validator)
    expect(screen.getAllByText("Validar mi idea gratis").length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText(/Escribe aquí tu problema/i)).toBeInTheDocument();

    // Transformation / Methodology
    expect(screen.getByText("Cómo LAB transforma tu idea en un sistema real")).toBeInTheDocument();
    expect(screen.getByText("Validación y Diagnóstico")).toBeInTheDocument();
    expect(screen.getByText("Diseño del Blueprint")).toBeInTheDocument();

    // Deliverables (Blueprint vs ACP)
    expect(screen.getByText("Blueprints claros y código estructurado para tu agente")).toBeInTheDocument();
    expect(screen.getByText("PLANO ESTRATÉGICO (BLUEPRINT)")).toBeInTheDocument();
    expect(screen.getByText("PAQUETE TÉCNICO (ACP)")).toBeInTheDocument();

    // Impact calculator
    expect(screen.getByText("Estimación Transparente")).toBeInTheDocument();

    // Commercial plans
    expect(screen.getByText("Paga solo por lo que necesitas, cuando lo necesitas")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Blueprint Free" })).toBeInTheDocument();

    // Agencies & Factory
    expect(screen.getByText("¿Construyes agentes para clientes?")).toBeInTheDocument();
    expect(screen.getByText("¿No tienes programadores?")).toBeInTheDocument();

    // FAQs
    expect(screen.getByRole("heading", { name: "Preguntas Frecuentes" })).toBeInTheDocument();
  });

  it("interacts with the Impact Calculator buttons", async () => {
    const user = userEvent.setup();
    renderWithProviders();

    const smallScaleBtn = screen.getByText(/Pequeño \(1 Agente\)/i);
    await user.click(smallScaleBtn);

    expect(screen.getByText("120 – 160 h")).toBeInTheDocument();
    expect(screen.getByText("60 – 90 h")).toBeInTheDocument();
  });

  it("runs AI initiative analysis and displays scorecard inside Interactive Validator", async () => {
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

    const analyzeBtn = screen.getByText("Analizar si la IA puede ayudarme ($0 USD)");
    await user.click(analyzeBtn);

    await waitFor(() => {
      expect(screen.getByText("¡Sí, la IA puede automatizar esto!")).toBeInTheDocument();
      expect(screen.getByText(/Crear Blueprint Free con este diagnóstico/i)).toBeInTheDocument();
    });
  });
});
