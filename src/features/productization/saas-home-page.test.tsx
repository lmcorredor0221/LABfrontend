import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/core/i18n/language-context";
import type { ProductJourneyOverview } from "@/features/product-experience/saas/product-journey-overview";
import { SaasHomePage } from "@/features/productization/saas-home-page";
import type { ProductCatalogResponse } from "@/features/sessions/types";

const mocks = vi.hoisted(() => ({
  authState: { current: {} as Record<string, unknown> },
  createSession: vi.fn(),
  getProductJourneyOverview: vi.fn(),
  getProductOverview: vi.fn(),
  listCommercialProducts: vi.fn(),
  push: vi.fn(),
  refreshList: vi.fn(),
  selectSession: vi.fn(),
  sessionState: { current: {} as Record<string, unknown> },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/core/auth/auth-context", () => ({
  useAuth: () => mocks.authState.current,
}));

vi.mock("@/features/sessions/session-context", () => ({
  useSessions: () => mocks.sessionState.current,
}));

vi.mock("@/components/lean/shell", () => ({
  TopUtilities: () => <div>Workspace utilities</div>,
  WorkspaceShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  WorkspaceUserCard: () => <div>User card</div>,
}));

const CATALOG: ProductCatalogResponse[] = [
  {
    benefits: ["Visualización dentro de la plataforma."],
    capabilities: ["blueprint.view"],
    description: "Diseño integral visible dentro de Lean Agent Builder.",
    exclusions: ["Sin descarga, copia o exportación externa."],
    name: "Blueprint",
    price: {
      billing_period: "free",
      currency: "USD",
      price_code: "blueprint-free-v1",
      unit_amount_cents: 0,
      version: 1,
    },
    product_key: "blueprint",
    product_type: "blueprint",
    scope: "project",
    tier: "blueprint",
    version: 1,
  },
  {
    benefits: ["Descarga profesional del Blueprint."],
    capabilities: ["blueprint.download"],
    description: "Documento profesional descargable.",
    exclusions: ["No incluye Test Suite ACP."],
    name: "Blueprint Profesional",
    price: {
      billing_period: "one_time",
      currency: "COP",
      price_code: "blueprint-pro-cop-v1",
      unit_amount_cents: 4900,
      version: 1,
    },
    product_key: "blueprint_pro",
    product_type: "blueprint",
    scope: "project",
    tier: "blueprint_pro",
    version: 1,
  },
  {
    benefits: ["Paquete técnico portable."],
    capabilities: ["acp.build"],
    description: "Paquete técnico portable.",
    exclusions: ["No ejecuta el despliegue final."],
    name: "Agent Construction Package",
    price: {
      billing_period: "one_time",
      currency: "USD",
      price_code: "acp-premium-cop-v1",
      unit_amount_cents: 14900,
      version: 1,
    },
    product_key: "acp",
    product_type: "acp",
    scope: "project",
    tier: "acp",
    version: 1,
  },
];

function buildSessionState(overrides: Record<string, unknown> = {}) {
  return {
    activeSessionId: null,
    activeSnapshot: null,
    createSession: mocks.createSession,
    getProductJourneyOverview: mocks.getProductJourneyOverview,
    getProductOverview: mocks.getProductOverview,
    items: [],
    listCommercialProducts: mocks.listCommercialProducts,
    listError: null,
    listStatus: "ready",
    refreshList: mocks.refreshList,
    selectSession: mocks.selectSession,
    snapshotStatus: "ready",
    ...overrides,
  };
}

function renderSaasHomePage() {
  return render(
    <LanguageProvider initialLanguage="es">
      <SaasHomePage />
    </LanguageProvider>,
  );
}

describe("SaasHomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authState.current = {
      user: {
        active_workspace_name: "Workspace Demo",
        email: "user@example.com",
        full_name: "Usuario Demo",
      },
    };
    mocks.listCommercialProducts.mockResolvedValue(CATALOG);
    mocks.getProductJourneyOverview.mockResolvedValue(null);
    mocks.sessionState.current = buildSessionState();
  });

  it("presenta el recorrido y los tres niveles comerciales a un usuario sin proyectos", async () => {
    renderSaasHomePage();

    expect(screen.getByRole("heading", { name: /De una necesidad de negocio/i })).toBeInTheDocument();
    expect(screen.queryByText("Nueva entrada SaaS")).not.toBeInTheDocument();
    expect(screen.queryByText("Paleta heredada")).not.toBeInTheDocument();

    expect((await screen.findAllByText(/\$\s*155\.425/)).length).toBeGreaterThan(0);
    expect(screen.getByText(/\$\s*472\.618/)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Crear Blueprint gratis" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Crear proyecto primero" })).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: /Que recibes en cada nivel/i }));
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(8);
  });

  it("crea un blueprint inicial y navega sin esperar el snapshot completo", async () => {
    const createdSession = {
      commercial_tier: "blueprint",
      created_at: "2026-08-05T10:00:00Z",
      current_stage: "draft_capture",
      id: "session-new",
      status: "draft",
      title: "Nueva sesion",
      updated_at: "2026-08-05T10:00:00Z",
      workspace_id: "workspace-1",
    };
    mocks.createSession.mockResolvedValue(createdSession);

    renderSaasHomePage();

    fireEvent.click(screen.getAllByRole("button", { name: "Crear Blueprint gratis" })[0]);

    await waitFor(() => expect(mocks.createSession).toHaveBeenCalledWith({ loadSnapshot: false }));
    expect(mocks.push).toHaveBeenCalledWith("/projects/session-new/work/discover");
  });

  it("prioriza continuidad y el nivel efectivo cuando existe un proyecto", async () => {
    const session = {
      commercial_tier: "blueprint_pro",
      created_at: "2026-08-05T10:00:00Z",
      current_stage: "build_blueprint",
      id: "session-1",
      status: "ready",
      title: "Asistente de soporte TI",
      updated_at: "2026-08-05T11:00:00Z",
      workspace_id: "workspace-1",
    };
    const journeyOverview: ProductJourneyOverview = {
      achieved_outcomes: [],
      active_operation: null,
      blocking_attention_count: 0,
      contract_version: "product-journey-overview.v2",
      current_stage: {
        label: "Herramientas pendientes",
        lifecycle: "running",
        product_key: "blueprint_basic",
        progress_percent: 41,
        stage_key: "tools",
      },
      deliverable_summary: {
        attention_count: 0,
        available_count: 1,
        error_count: 0,
        locked_count: 2,
        pending_count: 4,
        running_count: 1,
        stale_count: 0,
        total_count: 8,
      },
      generated_at: "2026-08-05T11:00:00Z",
      journey_state_machine: {
        contract_version: "journey-state-machine.v1",
        current: {
          blocking: false,
          detail: "Blueprint Pro esta habilitado para enriquecimiento, generacion y descarga.",
          href: "/projects/session-1/blueprint/pro",
          label: "Blueprint Pro",
          product_key: "blueprint_pro",
          progress_percent: 41,
          stage_key: "blueprint_pro",
          state_key: "blueprint_pro_active",
          substate: "running",
        },
        session_id: session.id,
        source_contracts: ["commercial-access.v2", "product-build-status.v1"],
        workspace_id: "workspace-1",
      },
      products: [
        {
          access_state: "allowed",
          active_operation: null,
          available_deliverable_count: 1,
          blocking_attention_count: 0,
          is_purchased: true,
          lifecycle: "running",
          primary_action: null,
          product_key: "blueprint_basic",
          product_label: "Blueprint",
          progress_percent: 41,
          purchase_required: false,
          technical_error_count: 0,
          total_deliverable_count: 5,
          warning_attention_count: 0,
        },
        {
          access_state: "allowed",
          active_operation: null,
          available_deliverable_count: 0,
          blocking_attention_count: 0,
          is_purchased: true,
          lifecycle: "ready_to_start",
          primary_action: null,
          product_key: "blueprint_pro",
          product_label: "Blueprint Profesional",
          progress_percent: 0,
          purchase_required: false,
          technical_error_count: 0,
          total_deliverable_count: 2,
          warning_attention_count: 0,
        },
        {
          access_state: "locked",
          active_operation: null,
          available_deliverable_count: 0,
          blocking_attention_count: 0,
          is_purchased: false,
          lifecycle: "locked",
          primary_action: null,
          product_key: "acp",
          product_label: "ACP Premium",
          progress_percent: 0,
          purchase_required: true,
          technical_error_count: 0,
          total_deliverable_count: 1,
          warning_attention_count: 0,
        },
      ],
      project_title: session.title,
      recommended_next_action: {
        action_key: "continue_current_stage",
        href: "/projects/session-1/work/tools",
        label: "Continuar herramientas",
        primary: true,
        product_key: "blueprint_basic",
        reason: "La etapa actual requiere completar herramientas.",
        state: "recommended",
      },
      session_id: session.id,
      source_contracts: ["product-build-status.v1"],
      technical_error_count: 0,
      warning_attention_count: 0,
      workspace_id: "workspace-1",
    };
    mocks.getProductJourneyOverview.mockResolvedValue(journeyOverview);
    mocks.sessionState.current = buildSessionState({
      activeSessionId: session.id,
      activeSnapshot: {
        commercial_access: { tier: "blueprint_pro", tier_label: "Blueprint Profesional" },
        session: { id: session.id },
      },
      items: [session],
    });

    renderSaasHomePage();

    expect(screen.getByRole("heading", { name: /Continua tu diseno/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continuar proyecto" })).toBeInTheDocument();
    expect(screen.getAllByText("Asistente de soporte TI")).toHaveLength(2);
    await waitFor(() => expect(mocks.getProductJourneyOverview).toHaveBeenCalledWith("session-1"));
    expect((await screen.findAllByText(/Blueprint Pro|Blueprint Profesional/i)).length).toBeGreaterThan(0);
    expect(screen.getByText("41%")).toBeInTheDocument();
    expect((await screen.findAllByText(/\$\s*155\.425/)).length).toBeGreaterThan(0);
    expect(screen.getByText(/Blueprint Pro esta habilitado para enriquecimiento, generacion y descarga/i)).toBeInTheDocument();
    expect(screen.getByText("Continuar herramientas")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Continuar proyecto" }));
    await waitFor(() => expect(mocks.selectSession).toHaveBeenCalledWith("session-1", { loadSnapshot: false, persist: true }));
    expect(mocks.push).toHaveBeenCalledWith("/projects/session-1/work/tools");

    fireEvent.click(screen.getByRole("button", { name: "Abrir Blueprint Profesional" }));
    await waitFor(() => expect(mocks.selectSession).toHaveBeenCalledWith("session-1", { loadSnapshot: false, persist: true }));
    expect(mocks.push).toHaveBeenCalledWith("/projects/session-1/blueprint/pro");
  });
});
