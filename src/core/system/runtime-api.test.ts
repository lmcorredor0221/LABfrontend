import { createRuntimeApi } from "@/core/system/runtime-api";

describe("runtime api", () => {
  it("reads /health without forcing unauthorized redirect", async () => {
    const client = {
      get: vi.fn().mockResolvedValue({ status: "ok" }),
    };

    const api = createRuntimeApi(client as never);
    await api.health();

    expect(client.get).toHaveBeenCalledWith("/health", {
      redirectOnUnauthorized: false,
    });
  });

  it("reads runtime status without forcing unauthorized redirect", async () => {
    const client = {
      get: vi.fn().mockResolvedValue({ status: "healthy" }),
    };

    const api = createRuntimeApi(client as never);
    await api.status();

    expect(client.get).toHaveBeenCalledWith("/api/v1/runtime/status", {
      redirectOnUnauthorized: false,
    });
  });

  it("updates workspace secrets and runtime health using scoped endpoints", async () => {
    const client = {
      delete: vi.fn().mockResolvedValue({ configured: false }),
      get: vi.fn().mockResolvedValue({ overall_status: "healthy" }),
      post: vi.fn().mockResolvedValue({ configured: true }),
    };

    const api = createRuntimeApi(client as never);
    await api.getWorkspaceRuntimeHealth();
    await api.upsertWorkspaceSecret("openai", {
      activate_for_runtime: true,
      secret_kind: "api_key",
      secret_ref: "",
      secret_value: "secret",
    });
    await api.rotateWorkspaceSecret("deepseek", {
      activate_for_runtime: true,
      secret_kind: "api_key",
      secret_ref: "vault://deepseek",
      secret_value: "",
    });
    await api.deleteWorkspaceSecret("openai");

    expect(client.get).toHaveBeenCalledWith("/api/v1/runtime/llm/health");
    expect(client.post).toHaveBeenCalledWith("/api/v1/runtime/llm/secrets/openai", {
      body: {
        activate_for_runtime: true,
        secret_kind: "api_key",
        secret_ref: "",
        secret_value: "secret",
      },
    });
    expect(client.post).toHaveBeenCalledWith("/api/v1/runtime/llm/secrets/deepseek/rotate", {
      body: {
        activate_for_runtime: true,
        secret_kind: "api_key",
        secret_ref: "vault://deepseek",
        secret_value: "",
      },
    });
    expect(client.delete).toHaveBeenCalledWith("/api/v1/runtime/llm/secrets/openai");
  });

  it("reads platform governance endpoints without forcing unauthorized redirect", async () => {
    const client = {
      get: vi.fn().mockResolvedValue([]),
      patch: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({ configured: false }),
      post: vi.fn().mockResolvedValue({ status: "planned" }),
    };

    const api = createRuntimeApi(client as never);
    const runtimePayload = {
      active_provider: "openai" as const,
      agent_execution_backend: "provider_native" as const,
      codex_local: {
        auth_mode: "auto" as const,
        command: "codex",
        cost_policy: "hybrid" as const,
        fallback_models: [],
        max_concurrency: 1,
        model: "gpt-5-codex",
        primary_agents: [],
        profile: "default",
        runner_id: "local",
        shadow_agents: [],
        staged_agents: [],
        timeout_ms: 150000,
      },
      deepseek: {
        base_url: "https://api.deepseek.com",
        fast_model: "deepseek-chat",
        reasoning_effort: "medium",
        reasoning_model: "deepseek-reasoner",
      },
      knowledge_access_backend: "inline_context" as const,
      openai: {
        fast_model: "gpt-5-mini",
        reasoning_effort: "high",
        reasoning_model: "gpt-5",
      },
      uses_platform_credentials: true,
    };
    await api.listPlatformProviders();
    await api.getPlatformDefaults();
    await api.getPlatformSecret("openai");
    await api.getPlatformAudit(12);
    await api.updatePlatformProvider("openai", {
      is_enabled: true,
    });
    await api.updatePlatformDefaults(runtimePayload);
    await api.upsertPlatformSecret("openai", {
      activate_for_runtime: true,
      secret_kind: "api_key",
      secret_ref: "",
      secret_value: "secret",
    });
    await api.rotatePlatformSecret("deepseek", {
      activate_for_runtime: true,
      secret_kind: "api_key",
      secret_ref: "vault://deepseek",
      secret_value: "",
    });
    await api.deletePlatformSecret("openai");
    await api.propagatePlatformDefaults({
      dry_run: true,
      mode: "fallback_only",
      payload: runtimePayload,
    });

    expect(client.get).toHaveBeenCalledWith("/api/v1/platform/runtime/providers", {
      redirectOnUnauthorized: false,
    });
    expect(client.get).toHaveBeenCalledWith("/api/v1/platform/runtime/defaults", {
      redirectOnUnauthorized: false,
    });
    expect(client.get).toHaveBeenCalledWith("/api/v1/platform/runtime/secrets/openai", {
      redirectOnUnauthorized: false,
    });
    expect(client.get).toHaveBeenCalledWith("/api/v1/platform/runtime/audit?limit=12", {
      redirectOnUnauthorized: false,
    });
    expect(client.patch).toHaveBeenCalledWith("/api/v1/platform/runtime/providers/openai", {
      body: {
        is_enabled: true,
      },
      redirectOnUnauthorized: false,
    });
    expect(client.patch).toHaveBeenCalledWith("/api/v1/platform/runtime/defaults", {
      body: expect.objectContaining({
        active_provider: "openai",
        uses_platform_credentials: true,
      }),
      redirectOnUnauthorized: false,
    });
    expect(client.post).toHaveBeenCalledWith("/api/v1/platform/runtime/secrets/openai", {
      body: {
        activate_for_runtime: true,
        secret_kind: "api_key",
        secret_ref: "",
        secret_value: "secret",
      },
      redirectOnUnauthorized: false,
    });
    expect(client.post).toHaveBeenCalledWith("/api/v1/platform/runtime/secrets/deepseek/rotate", {
      body: {
        activate_for_runtime: true,
        secret_kind: "api_key",
        secret_ref: "vault://deepseek",
        secret_value: "",
      },
      redirectOnUnauthorized: false,
    });
    expect(client.delete).toHaveBeenCalledWith("/api/v1/platform/runtime/secrets/openai", {
      redirectOnUnauthorized: false,
    });
    expect(client.post).toHaveBeenCalledWith("/api/v1/platform/runtime/defaults/propagate", {
      body: {
        dry_run: true,
        mode: "fallback_only",
        payload: runtimePayload,
      },
      redirectOnUnauthorized: false,
    });
  });
});
