import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminRequestsPage } from "@/features/operations/admin-requests-page";
import { sessionsApi } from "@/features/sessions/session-api";
import type { AccessRequestResponse } from "@/features/sessions/types";

vi.mock("@/features/sessions/session-api", () => ({
  sessionsApi: {
    listAccessRequests: vi.fn(),
    resolveAccessRequest: vi.fn(),
  },
}));

const mockRequests: AccessRequestResponse[] = [
  {
    capability: "blueprint_pro",
    created_at: "2026-08-19T20:00:00Z",
    id: "req-1",
    product_key: "blueprint_pro",
    project_title: "Proyecto Agente Soporte",
    reason: "Necesitamos descargar el Blueprint Pro para el equipo de desarrollo.",
    requester_email: "ana@empresa.com",
    requester_name: "Ana García",
    requester_user_id: "user-1",
    resolution_note: "",
    resolved_at: null,
    session_id: "session-1",
    status: "pending",
    target_tier: "blueprint_pro",
    updated_at: "2026-08-19T20:00:00Z",
    workspace_id: "ws-1",
    workspace_name: "Empresa Workspace",
  },
  {
    capability: "acp_premium",
    created_at: "2026-08-19T18:00:00Z",
    id: "req-2",
    product_key: "acp",
    project_title: "Agente Cobranzas",
    reason: "Se requiere empaquetado portable ACP.",
    requester_email: "carlos@empresa.com",
    requester_name: "Carlos Ruiz",
    requester_user_id: "user-2",
    resolution_note: "Aprobado por el admin",
    resolved_at: "2026-08-19T19:00:00Z",
    session_id: "session-2",
    status: "approved",
    target_tier: "acp",
    updated_at: "2026-08-19T19:00:00Z",
    workspace_id: "ws-1",
    workspace_name: "Empresa Workspace",
  },
];

describe("AdminRequestsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sessionsApi.listAccessRequests).mockResolvedValue(mockRequests);
  });

  it("renders access requests with summary counts", async () => {
    render(<AdminRequestsPage />);

    expect(screen.getByText("Gestión de Solicitudes de Acceso")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Proyecto Agente Soporte")).toBeInTheDocument();
    });

    expect(screen.getByText("Total Solicitudes")).toBeInTheDocument();
    expect(screen.getByText("Pendientes")).toBeInTheDocument();
    expect(screen.getByText("Aprobadas")).toBeInTheDocument();
    expect(screen.getByText("Rechazadas")).toBeInTheDocument();
  });

  it("shows an actionable Platform Admin diagnostic when access is forbidden", async () => {
    vi.mocked(sessionsApi.listAccessRequests).mockRejectedValueOnce({
      status: 403,
      message: "Solo un platform admin puede ejecutar esta accion.",
    });

    render(<AdminRequestsPage />);

    expect(
      await screen.findByText(/requiere rol Platform Admin activo/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Ser owner del workspace no habilita aprobaciones comerciales/i)).toBeInTheDocument();
  });

  it("allows approving a pending request", async () => {
    vi.mocked(sessionsApi.resolveAccessRequest).mockResolvedValue({
      ...mockRequests[0],
      status: "approved",
      resolved_at: "2026-08-19T21:00:00Z",
    });

    render(<AdminRequestsPage />);

    await waitFor(() => {
      expect(screen.getByText("Proyecto Agente Soporte")).toBeInTheDocument();
    });

    const approveButton = screen.getByRole("button", { name: /Aprobar solicitud/i });
    await userEvent.click(approveButton);

    expect(sessionsApi.resolveAccessRequest).toHaveBeenCalledWith("req-1", {
      decision: "approved",
      resolution_note: "",
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Solicitud aprobada con éxito/i),
      ).toBeInTheDocument();
    });
  });

  it("allows rejecting a pending request with a note", async () => {
    vi.mocked(sessionsApi.resolveAccessRequest).mockResolvedValue({
      ...mockRequests[0],
      status: "rejected",
      resolution_note: "No cumple con los criterios",
      resolved_at: "2026-08-19T21:00:00Z",
    });

    render(<AdminRequestsPage />);

    await waitFor(() => {
      expect(screen.getByText("Proyecto Agente Soporte")).toBeInTheDocument();
    });

    const rejectButton = screen.getByRole("button", { name: /Rechazar/i });
    await userEvent.click(rejectButton);

    const noteInput = screen.getByPlaceholderText(/Motivo del rechazo/i);
    await userEvent.type(noteInput, "No cumple con los criterios");

    const confirmButton = screen.getByRole("button", { name: /Confirmar/i });
    await userEvent.click(confirmButton);

    expect(sessionsApi.resolveAccessRequest).toHaveBeenCalledWith("req-1", {
      decision: "rejected",
      resolution_note: "No cumple con los criterios",
    });
  });

  it("filters requests when clicking filter tabs", async () => {
    render(<AdminRequestsPage />);

    await waitFor(() => {
      expect(screen.getByText("Proyecto Agente Soporte")).toBeInTheDocument();
    });

    // Switch to "Aprobadas" tab
    const approvedTab = screen.getByRole("button", { name: /Aprobadas/i });
    await userEvent.click(approvedTab);

    expect(screen.getByText("Agente Cobranzas")).toBeInTheDocument();
    expect(screen.queryByText("Proyecto Agente Soporte")).not.toBeInTheDocument();
  });
});
