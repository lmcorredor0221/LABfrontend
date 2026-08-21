import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FinOpsDashboard } from "@/features/finops/finops-dashboard";
import type { FinOpsApi } from "@/features/finops/finops-api";
import type {
  FinOpsAlertListResponse,
  FinOpsProviderBreakdownResponse,
  FinOpsSummary,
  FinOpsTimeseriesResponse,
  FinOpsTopConsumersResponse,
} from "@/features/finops/finops-contracts";

const summary: FinOpsSummary = {
  avg_latency_ms: 120,
  call_count: 4,
  currency: "USD",
  currency_breakdown: [{ call_count: 4, cost_total: 12.3456, currency: "USD" }],
  cost_per_call: 3.0864,
  cost_total: 12.3456,
  error_count: 1,
  error_rate: 0.25,
  fallback_count: 1,
  input_tokens: 1000,
  output_tokens: 500,
  p95_latency_ms: 240,
  retry_count: 2,
  total_tokens: 1500,
};

const timeseries: FinOpsTimeseriesResponse = {
  availability: {
    reason: "Buckets temporales calculados desde el ledger LLM filtrado por workspace.",
    source: "llm_usage_ledger.started_at",
    status: "available",
  },
  count: 2,
  granularity: "day",
  items: [
    {
      bucket: "2026-08-13T00:00:00",
      call_count: 2,
      cost_total: 5,
      currency: "USD",
      currency_breakdown: [{ call_count: 2, cost_total: 5, currency: "USD" }],
      error_count: 0,
      error_rate: 0,
      estimated_count: 0,
      fallback_count: 0,
      granularity: "day",
      input_tokens: 500,
      output_tokens: 250,
      period_start: "2026-08-13T00:00:00",
      retry_count: 0,
      total_tokens: 750,
    },
    {
      bucket: "2026-08-14T00:00:00",
      call_count: 2,
      cost_total: 7.3456,
      currency: "USD",
      currency_breakdown: [{ call_count: 2, cost_total: 7.3456, currency: "USD" }],
      error_count: 1,
      error_rate: 0.5,
      estimated_count: 1,
      fallback_count: 1,
      granularity: "day",
      input_tokens: 500,
      output_tokens: 250,
      period_start: "2026-08-14T00:00:00",
      retry_count: 2,
      total_tokens: 750,
    },
  ],
};

const providerBreakdown: FinOpsProviderBreakdownResponse = {
  count: 2,
  items: [
    {
      call_count: 3,
      cost_total: 10,
      error_count: 0,
      model_name: "gpt-5.5",
      provider_key: "openai",
      total_tokens: 1200,
    },
    {
      call_count: 1,
      cost_total: 2.3456,
      error_count: 1,
      model_name: "deepseek-v4-pro",
      provider_key: "deepseek",
      total_tokens: 300,
    },
  ],
};

const topConsumers: FinOpsTopConsumersResponse = {
  count: 1,
  dimension: "agent_key",
  items: [
    {
      call_count: 4,
      cost_total: 12.3456,
      dimension: "agent_key",
      error_count: 1,
      key: "builder",
      total_tokens: 1500,
    },
  ],
};

const alerts: FinOpsAlertListResponse = {
  count: 1,
  items: [
    {
      alert_key: "budget_threshold:1:80",
      alert_type: "budget_threshold",
      budget_policy_id: "budget-1",
      consumed_amount: 80,
      created_at: "2026-08-13T10:00:00",
      currency: "USD",
      evidence: {},
      id: "alert-1",
      limit_amount: 100,
      message: "Budget workspace consumed 80% of 100 USD.",
      metadata: {},
      model_name: "",
      period_end: "2026-09-01T00:00:00",
      period_start: "2026-08-01T00:00:00",
      provider_key: "",
      resolved_at: null,
      scope_type: "workspace",
      scope_value: "workspace-1",
      severity: "medium",
      stage: "",
      status: "active",
      threshold_percent: 80,
      title: "LLM budget threshold 80% reached",
      updated_at: "2026-08-13T10:00:00",
      usage_record_id: null,
      workspace_id: "workspace-1",
    },
  ],
};

function createMockApi(overrides: Partial<FinOpsApi> = {}): FinOpsApi {
  return {
    createBudget: vi.fn(),
    getProviderBreakdown: vi.fn().mockResolvedValue(providerBreakdown),
    getSummary: vi.fn().mockResolvedValue(summary),
    getTimeseries: vi.fn().mockResolvedValue(timeseries),
    getTopConsumers: vi.fn().mockResolvedValue(topConsumers),
    listAlerts: vi.fn().mockResolvedValue(alerts),
    listBudgets: vi.fn(),
    listUsage: vi.fn(),
    updateBudget: vi.fn(),
    ...overrides,
  } as unknown as FinOpsApi;
}

function emptySummary(): FinOpsSummary {
  return {
    avg_latency_ms: 0,
    call_count: 0,
    cost_per_call: 0,
    cost_total: 0,
    error_count: 0,
    error_rate: 0,
    fallback_count: 0,
    input_tokens: 0,
    output_tokens: 0,
    p95_latency_ms: 0,
    retry_count: 0,
    total_tokens: 0,
  };
}

describe("FinOpsDashboard", () => {
  it("renders FinOps KPIs, provider detail, top consumers and alerts", async () => {
    const api = createMockApi();

    render(<FinOpsDashboard api={api} />);

    expect(await screen.findByTestId("finops-dashboard")).toBeInTheDocument();
    expect(screen.getByText("Costo total")).toBeInTheDocument();
    expect(screen.getAllByText("1.500").length).toBeGreaterThan(0);
    expect(screen.getByText("openai / gpt-5.5")).toBeInTheDocument();
    expect(screen.getByText("builder")).toBeInTheDocument();
    expect(screen.getByText("LLM budget threshold 80% reached")).toBeInTheDocument();
    expect(screen.getByText("Disponibilidad de datos FinOps")).toBeInTheDocument();
    expect(screen.getByText("Serie: available")).toBeInTheDocument();
    expect(screen.getByText("EvoluciÃ³n del consumo")).toBeInTheDocument();
  });

  it("renders empty states when no usage is available", async () => {
    const api = createMockApi({
      getProviderBreakdown: vi.fn().mockResolvedValue({ count: 0, items: [] }),
      getSummary: vi.fn().mockResolvedValue(emptySummary()),
      getTimeseries: vi.fn().mockResolvedValue({
        availability: { reason: "No hay buckets", source: "llm_usage_ledger.started_at", status: "empty" },
        count: 0,
        granularity: "day",
        items: [],
      }),
      getTopConsumers: vi.fn().mockResolvedValue({ count: 0, dimension: "agent_key", items: [] }),
      listAlerts: vi.fn().mockResolvedValue({ count: 0, items: [] }),
    });

    render(<FinOpsDashboard api={api} />);

    expect(await screen.findByText("Sin consumo LLM registrado")).toBeInTheDocument();
    expect(screen.getByText("Sin consumo por proveedor")).toBeInTheDocument();
    expect(screen.getByText("Sin top consumers")).toBeInTheDocument();
    expect(screen.getByText("Sin alertas FinOps")).toBeInTheDocument();
    expect(screen.getByText("Sin serie temporal LLM")).toBeInTheDocument();
  });

  it("sends complete filter params and top-consumer dimension to the API client", async () => {
    const api = createMockApi();

    render(<FinOpsDashboard api={api} />);
    await screen.findByTestId("finops-dashboard");

    fireEvent.change(await screen.findByLabelText("Provider"), { target: { value: "deepseek" } });
    fireEvent.change(await screen.findByLabelText("Usuario"), { target: { value: "user-123" } });
    fireEvent.change(await screen.findByLabelText("Proyecto"), { target: { value: "project-456" } });
    fireEvent.change(await screen.findByLabelText("Top por"), { target: { value: "project_id" } });

    await waitFor(() => {
      expect(api.getSummary).toHaveBeenLastCalledWith(
        expect.objectContaining({ project_id: "project-456", provider_key: "deepseek", user_id: "user-123" }),
      );
      expect(api.getTimeseries).toHaveBeenLastCalledWith(
        expect.objectContaining({ project_id: "project-456", provider_key: "deepseek", user_id: "user-123" }),
      );
      expect(api.getTopConsumers).toHaveBeenLastCalledWith(
        expect.objectContaining({ dimension: "project_id", project_id: "project-456", user_id: "user-123" }),
      );
    });
  });
});
