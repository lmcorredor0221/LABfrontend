import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SaasHomePage } from "@/features/productization/saas-home-page";
import type { ProductCatalogResponse } from "@/features/sessions/types";

const mocks = vi.hoisted(() => ({
  authState: { current: {} as Record<string, unknown> },
  createSession: vi.fn(),
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
      currency: "COP",
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
      unit_amount_cents: 24900000,
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
      currency: "COP",
      price_code: "acp-premium-cop-v1",
      unit_amount_cents: 89900000,
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
    mocks.sessionState.current = buildSessionState();
  });

  it("presenta el recorrido y los tres niveles comerciales a un usuario sin proyectos", async () => {
    render(<SaasHomePage />);

    expect(screen.getByRole("heading", { name: /De una necesidad de negocio/i })).toBeInTheDocument();
    expect(screen.queryByText("Nueva entrada SaaS")).not.toBeInTheDocument();
    expect(screen.queryByText("Paleta heredada")).not.toBeInTheDocument();

    expect(await screen.findByText("$249.000")).toBeInTheDocument();
    expect(screen.getByText("$899.000")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Crear Blueprint gratis" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Crear proyecto primero" })).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: /Qué recibes en cada nivel/i }));
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

    render(<SaasHomePage />);

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
    mocks.getProductOverview.mockResolvedValue({
      access: { tier: "blueprint_pro", tier_label: "Blueprint Profesional" },
      lean_progress_percent: 72,
      project_title: session.title,
    });
    mocks.sessionState.current = buildSessionState({
      activeSessionId: session.id,
      activeSnapshot: {
        commercial_access: { tier: "blueprint_pro", tier_label: "Blueprint Profesional" },
        session: { id: session.id },
      },
      items: [session],
    });

    render(<SaasHomePage />);

    expect(screen.getByRole("heading", { name: /Continúa tu diseño/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continuar proyecto" })).toBeInTheDocument();
    expect(screen.getAllByText("Asistente de soporte TI")).toHaveLength(2);
    await waitFor(() => expect(mocks.getProductOverview).toHaveBeenCalledWith("session-1"));
    expect(await screen.findByText("$249.000")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Abrir Blueprint Profesional" }));
    await waitFor(() => expect(mocks.selectSession).toHaveBeenCalledWith("session-1", { loadSnapshot: false, persist: true }));
    expect(mocks.push).toHaveBeenCalledWith("/projects/session-1/blueprint/pro");
  });
});
