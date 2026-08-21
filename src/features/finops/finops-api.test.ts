import { createFinOpsApi } from "@/features/finops/finops-api";

describe("finops api", () => {
  it("builds usage and summary query endpoints", async () => {
    const client = {
      get: vi.fn().mockResolvedValue({ items: [], count: 0 }),
    };

    const api = createFinOpsApi(client as never);
    await api.listUsage({
      provider_key: "openai",
      model_name: "gpt-5.5",
      limit: 25,
      offset: 10,
    });
    await api.getSummary({
      started_from: "2026-08-01T00:00:00",
      started_to: "2026-08-31T23:59:59",
      stage: "define",
    });

    expect(client.get).toHaveBeenCalledWith(
      "/api/v1/finops/llm/usage?provider_key=openai&model_name=gpt-5.5&limit=25&offset=10",
    );
    expect(client.get).toHaveBeenCalledWith(
      "/api/v1/finops/llm/summary?started_from=2026-08-01T00%3A00%3A00&started_to=2026-08-31T23%3A59%3A59&stage=define",
    );
  });

  it("reads breakdowns using expected endpoint names", async () => {
    const client = {
      get: vi.fn().mockResolvedValue({ items: [], count: 0 }),
    };

    const api = createFinOpsApi(client as never);
    await api.getTopConsumers({ dimension: "provider_key", limit: 5 });
    await api.getProviderBreakdown({ provider_key: "deepseek" });
    await api.getTimeseries({ granularity: "week", provider_key: "openai" });

    expect(client.get).toHaveBeenCalledWith("/api/v1/finops/llm/top-consumers?dimension=provider_key&limit=5");
    expect(client.get).toHaveBeenCalledWith("/api/v1/finops/llm/provider-breakdown?provider_key=deepseek");
    expect(client.get).toHaveBeenCalledWith("/api/v1/finops/llm/timeseries?granularity=week&provider_key=openai");
  });

  it("creates and updates budgets with request bodies", async () => {
    const client = {
      patch: vi.fn().mockResolvedValue({ id: "budget-1" }),
      post: vi.fn().mockResolvedValue({ id: "budget-1" }),
    };

    const api = createFinOpsApi(client as never);
    await api.createBudget({
      policy_key: "workspace-monthly",
      scope_type: "workspace",
      limit_amount: 100,
      threshold_percentages: [50, 80, 100],
    });
    await api.updateBudget("budget/1", {
      is_active: false,
      limit_amount: 120,
    });

    expect(client.post).toHaveBeenCalledWith("/api/v1/finops/llm/budgets", {
      body: {
        policy_key: "workspace-monthly",
        scope_type: "workspace",
        limit_amount: 100,
        threshold_percentages: [50, 80, 100],
      },
    });
    expect(client.patch).toHaveBeenCalledWith("/api/v1/finops/llm/budgets/budget%2F1", {
      body: {
        is_active: false,
        limit_amount: 120,
      },
    });
  });

  it("lists budgets and alerts with operational query params", async () => {
    const client = {
      get: vi.fn().mockResolvedValue({ items: [], count: 0 }),
    };

    const api = createFinOpsApi(client as never);
    await api.listBudgets({ include_inactive: true, include_evaluations: false });
    await api.listAlerts({ status: "active", sync: false, limit: 20 });

    expect(client.get).toHaveBeenCalledWith(
      "/api/v1/finops/llm/budgets?include_inactive=true&include_evaluations=false",
    );
    expect(client.get).toHaveBeenCalledWith("/api/v1/finops/llm/alerts?status=active&sync=false&limit=20");
  });
});
