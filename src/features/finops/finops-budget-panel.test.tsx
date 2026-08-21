import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FinOpsBudgetPanel } from "@/features/finops/finops-budget-panel";
import type { FinOpsApi } from "@/features/finops/finops-api";
import type { FinOpsBudgetListResponse, FinOpsBudgetPolicy } from "@/features/finops/finops-contracts";

function buildBudget(overrides: Partial<FinOpsBudgetPolicy> = {}): FinOpsBudgetPolicy {
  return {
    created_at: "2026-08-13T10:00:00",
    currency: "USD",
    custom_period_end: null,
    custom_period_start: null,
    description: "",
    evaluation: {
      call_count: 4,
      consumed_amount: 80,
      currency: "USD",
      is_hard_limit: false,
      is_warning: true,
      limit_amount: 100,
      next_threshold_percent: 95,
      percent_consumed: 80,
      period_end: "2026-09-01T00:00:00",
      period_start: "2026-08-01T00:00:00",
      period_type: "monthly",
      policy_id: "budget-1",
      policy_key: "workspace-monthly",
      remaining_amount: 20,
      scope_type: "workspace",
      scope_value: "workspace-1",
      status: "warning",
      thresholds_reached: [50, 80],
      total_tokens: 1000,
      workspace_id: "workspace-1",
    },
    hard_limit_percent: 100,
    id: "budget-1",
    initiative_id: null,
    is_active: true,
    limit_amount: 100,
    metadata: {},
    model_name: "",
    name: "Workspace budget",
    period_type: "monthly",
    policy_key: "workspace-monthly",
    project_id: null,
    provider_key: "",
    scope_type: "workspace",
    scope_value: "workspace-1",
    stage: "",
    threshold_percentages: [50, 80, 95, 100],
    updated_at: "2026-08-13T10:00:00",
    user_id: null,
    workspace_id: "workspace-1",
    ...overrides,
  };
}

function createMockApi(response: FinOpsBudgetListResponse = { count: 1, items: [buildBudget()] }): FinOpsApi {
  return {
    createBudget: vi.fn().mockResolvedValue(buildBudget({ id: "budget-new" })),
    getProviderBreakdown: vi.fn(),
    getSummary: vi.fn(),
    getTopConsumers: vi.fn(),
    listAlerts: vi.fn(),
    listBudgets: vi.fn().mockResolvedValue(response),
    listUsage: vi.fn(),
    updateBudget: vi.fn().mockResolvedValue(buildBudget({ limit_amount: 150 })),
  } as unknown as FinOpsApi;
}

describe("FinOpsBudgetPanel", () => {
  it("lists budget policies with evaluation state", async () => {
    const api = createMockApi();

    render(<FinOpsBudgetPanel api={api} canManage />);

    expect(await screen.findByText("1 politicas")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Expandir presupuestos FinOps IA" }));

    expect(await screen.findByText("Workspace budget")).toBeInTheDocument();
    expect(screen.getByText("warning")).toBeInTheDocument();
    expect(screen.getByText("80.0%")).toBeInTheDocument();
  });

  it("validates and creates a budget policy", async () => {
    const api = createMockApi({ count: 0, items: [] });

    render(<FinOpsBudgetPanel api={api} canManage />);
    fireEvent.click(screen.getByRole("button", { name: "Expandir presupuestos FinOps IA" }));
    await screen.findByText("Sin presupuestos FinOps");

    fireEvent.click(screen.getByRole("button", { name: /Crear presupuesto/i }));
    expect(await screen.findByText("El limite debe ser mayor a cero.")).toBeInTheDocument();
    expect(api.createBudget).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Identificador"), { target: { value: "workspace-monthly" } });
    fireEvent.change(screen.getByLabelText(/Limite USD/), { target: { value: "100" } });
    fireEvent.click(screen.getByRole("button", { name: /Crear presupuesto/i }));

    await waitFor(() => {
      expect(api.createBudget).toHaveBeenCalledWith(
        expect.objectContaining({
          limit_amount: 100,
          policy_key: "workspace-monthly",
          scope_type: "workspace",
          threshold_percentages: [50, 80, 95, 100],
        }),
      );
    });
  });

  it("loads a policy into edit mode and saves changes", async () => {
    const api = createMockApi();

    render(<FinOpsBudgetPanel api={api} canManage />);
    fireEvent.click(screen.getByRole("button", { name: "Expandir presupuestos FinOps IA" }));
    await screen.findByText("Workspace budget");

    fireEvent.click(screen.getByRole("button", { name: "Expandir presupuesto workspace-monthly" }));
    fireEvent.click(screen.getByText("Editar"));
    fireEvent.change(screen.getByLabelText(/Limite USD/), { target: { value: "150" } });
    fireEvent.click(screen.getByRole("button", { name: /Guardar cambios/i }));

    await waitFor(() => {
      expect(api.updateBudget).toHaveBeenCalledWith(
        "budget-1",
        expect.objectContaining({
          limit_amount: 150,
          policy_key: "workspace-monthly",
        }),
      );
    });
  });

  it("hides write actions for read-only users", async () => {
    const api = createMockApi();

    render(<FinOpsBudgetPanel api={api} canManage={false} />);

    expect(await screen.findByText("1 politicas")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Expandir presupuestos FinOps IA" }));

    expect(await screen.findByText("Workspace budget")).toBeInTheDocument();
    expect(screen.getByText("Solo lectura")).toBeInTheDocument();
    expect(screen.queryByText("Crear presupuesto")).not.toBeInTheDocument();
    expect(screen.queryByText("Editar")).not.toBeInTheDocument();
  });
});
