import { createSessionsStore } from "@/features/sessions/session-store";

function createSessionSummary(
  overrides?: Partial<{
    current_stage: "ready_for_export";
    id: string;
    status: "ready";
    title: string;
    updated_at: string;
  }>,
) {
  return {
    created_at: "2026-07-15T19:00:00",
    current_stage: "ready_for_export" as const,
    id: "session-phase5",
    status: "ready" as const,
    title: "Asistente comercial Phase 5",
    updated_at: "2026-07-15T19:05:00",
    ...overrides,
  };
}

function createWorkspaceContract(
  overrides?: Partial<{
    feature_flags: Array<{
      description: string;
      enabled: boolean;
      key: string;
      stage_hint: string;
    }>;
  }>,
) {
  return {
    catalogs: [
      {
        active_count: 2,
        catalog_key: "operational_tools",
        item_count: 3,
        items: [],
        version: "2026.07",
      },
    ],
    contract_version: "workspace-contract.v1",
    feature_flags: [
      {
        description: "Habilita el monitoreo operativo del workspace.",
        enabled: true,
        key: "workspace_contract_v1",
        stage_hint: "ready_for_export",
      },
      {
        description: "Activa la calibracion en tiempo real.",
        enabled: false,
        key: "estimation_calibration_dashboard",
        stage_hint: "ready_for_export",
      },
    ],
    sections: [
      {
        capability_status: "ready",
        key: "monitoring",
        label: "Monitoring",
        read_only: false,
        source_of_truth: "backend",
        summary: "Metricas reales por sesion.",
        view_kind: "workspace",
      },
    ],
    ...overrides,
  };
}

function createIntegrationStatus(
  overrides?: Partial<{
    checked_at: string;
    configured: boolean;
    detail: string;
    id: string;
    integration_key: string;
    label: string;
    reachable: boolean;
    status: string;
  }>,
) {
  return {
    checked_at: "2026-07-15T19:10:00",
    configured: true,
    detail: "Servicio saludable y reachable.",
    id: "integration-1",
    integration_key: "openai_runtime",
    label: "OpenAI Runtime",
    reachable: true,
    status: "healthy",
    ...overrides,
  };
}

function createSnapshot(
  overrides?: Partial<{
    integration_statuses: ReturnType<typeof createIntegrationStatus>[];
    session: ReturnType<typeof createSessionSummary>;
    workspace_contract: ReturnType<typeof createWorkspaceContract>;
  }>,
) {
  return {
    activity: [],
    alert_events: [],
    approvals: [],
    artifact_records: [],
    blueprint: null,
    blueprint_versions: [],
    canvas: null,
    contract_version: "session-snapshot.v1",
    discovery: null,
    evaluation: null,
    evaluation_dataset: null,
    evaluation_rubric: null,
    evaluation_runs: [],
    governance_policies: [],
    handoff_records: [],
    integration_statuses: overrides?.integration_statuses ?? [createIntegrationStatus()],
    metric_snapshots: [],
    session: overrides?.session ?? createSessionSummary(),
    skill_catalog: [],
    skill_runs: [],
    subagent_runs: [],
    validations: [],
    workflow_templates: [],
    workspace_contract: overrides?.workspace_contract ?? createWorkspaceContract(),
  };
}

function createRuntimeSettings() {
  return {
    active_provider: "openai" as const,
    agent_execution_backend: "provider_native" as const,
    codex_local: {
      available: true,
      auth_mode: "auto" as const,
      command: "codex",
      cost_policy: "hybrid" as const,
      executable_found: true,
      fallback_models: [],
      health_status: "local_runtime_ready",
      last_rotated_at: null,
      max_concurrency: 1,
      model: "gpt-5-codex",
      primary_agents: [],
      profile: "default",
      runner_id: "local",
      secret_source: "local_runtime",
      shadow_agents: [],
      staged_agents: [],
      status_note: "Local runtime listo.",
      timeout_ms: 150000,
    },
    compatibility_mode: "governed",
    deepseek: {
      api_key_configured: false,
      available: false,
      base_url: "https://api.deepseek.com",
      fast_model: "deepseek-chat",
      health_status: "platform_missing",
      last_rotated_at: null,
      reasoning_effort: "medium",
      reasoning_model: "deepseek-reasoner",
      secret_source: "platform_managed",
      status_note: "No configurado.",
    },
    field_origins: {
      active_provider: "default",
      agent_execution_backend: "default",
      "codex_local.auth_mode": "default",
      "codex_local.command": "default",
      "codex_local.cost_policy": "default",
      "codex_local.fallback_models": "default",
      "codex_local.max_concurrency": "default",
      "codex_local.model": "default",
      "codex_local.primary_agents": "default",
      "codex_local.profile": "default",
      "codex_local.runner_id": "default",
      "codex_local.shadow_agents": "default",
      "codex_local.staged_agents": "default",
      "codex_local.timeout_ms": "default",
      "deepseek.base_url": "default",
      "deepseek.fast_model": "default",
      "deepseek.reasoning_effort": "default",
      "deepseek.reasoning_model": "default",
      knowledge_access_backend: "default",
      "openai.fast_model": "default",
      "openai.reasoning_effort": "default",
      "openai.reasoning_model": "default",
      uses_platform_credentials: "default",
    },
    knowledge_access_backend: "inline_context" as const,
    openai: {
      api_key_configured: true,
      available: true,
      fast_model: "gpt-5-mini",
      health_status: "platform_ready",
      last_rotated_at: null,
      reasoning_effort: "high",
      reasoning_model: "gpt-5",
      secret_source: "platform_managed",
      status_note: "Proveedor activo.",
    },
    provider_options: [
      {
        configured: true,
        description: "Proveedor principal",
        key: "openai",
        label: "OpenAI",
        metadata: {},
        reachable: true,
        selected: true,
        supports_structured_output: true,
      },
    ],
    uses_platform_credentials: true,
    updated_at: "2026-07-15T19:12:00",
  };
}

describe("session store phase 5 flow", () => {
  it("synchronizes integrations and feature-flag updates into the active snapshot and keeps runtime context stable", async () => {
    const updatedIntegrationSnapshot = createSnapshot({
      integration_statuses: [
        createIntegrationStatus({
          checked_at: "2026-07-15T19:20:00",
          detail: "Check ejecutado desde el modulo operativo.",
          status: "healthy",
        }),
        createIntegrationStatus({
          checked_at: "2026-07-15T19:20:00",
          configured: false,
          detail: "Falta configurar credenciales locales.",
          id: "integration-2",
          integration_key: "codex_local",
          label: "Codex Local",
          reachable: false,
          status: "degraded",
        }),
      ],
    });
    const updatedFlagsSnapshot = createSnapshot({
      integration_statuses: updatedIntegrationSnapshot.integration_statuses,
      workspace_contract: createWorkspaceContract({
        feature_flags: [
          {
            description: "Habilita el monitoreo operativo del workspace.",
            enabled: true,
            key: "workspace_contract_v1",
            stage_hint: "ready_for_export",
          },
          {
            description: "Activa la calibracion en tiempo real.",
            enabled: true,
            key: "estimation_calibration_dashboard",
            stage_hint: "ready_for_export",
          },
        ],
      }),
    });
    const runtimeSettings = createRuntimeSettings();
    const persistActiveSessionId = vi.fn();

    const api = {
      checkIntegrations: vi.fn().mockResolvedValue(updatedIntegrationSnapshot),
      patchFeatureFlag: vi.fn().mockResolvedValue(updatedFlagsSnapshot),
      patchRuntimeSettings: vi.fn().mockResolvedValue(runtimeSettings),
    };

    const store = createSessionsStore({
      api,
      clearActiveSessionId: vi.fn(),
      loadActiveSessionId: () => null,
      persistActiveSessionId,
    });

    const integrationSnapshot = await store.checkIntegrations("session-phase5");
    expect(api.checkIntegrations).toHaveBeenCalledWith("session-phase5");
    expect(integrationSnapshot.integration_statuses).toHaveLength(2);
    expect(store.getState().activeSessionId).toBe("session-phase5");
    expect(store.getState().activeSnapshot?.integration_statuses[1]?.status).toBe("degraded");
    expect(store.getState().items[0]?.id).toBe("session-phase5");

    const featureFlagSnapshot = await store.patchFeatureFlag("session-phase5", "estimation_calibration_dashboard", {
      enabled: true,
    });
    expect(api.patchFeatureFlag).toHaveBeenCalledWith("session-phase5", "estimation_calibration_dashboard", {
      enabled: true,
    });
    expect(featureFlagSnapshot.workspace_contract?.feature_flags[1]?.enabled).toBe(true);
    expect(
      store
        .getState()
        .activeSnapshot?.workspace_contract?.feature_flags.find((item) => item.key === "estimation_calibration_dashboard")
        ?.enabled,
    ).toBe(true);

    const savedRuntime = await store.patchRuntimeSettings({
      active_provider: "openai",
      agent_execution_backend: "provider_native",
      codex_local: {
        auth_mode: "auto",
        command: "codex",
        cost_policy: "hybrid",
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
      knowledge_access_backend: "inline_context",
      openai: {
        fast_model: "gpt-5-mini",
        reasoning_effort: "high",
        reasoning_model: "gpt-5",
      },
    });
    expect(api.patchRuntimeSettings).toHaveBeenCalledTimes(1);
    expect(savedRuntime.active_provider).toBe("openai");
    expect(store.getState().activeSessionId).toBe("session-phase5");
    expect(store.getState().activeSnapshot?.session.title).toBe("Asistente comercial Phase 5");
    expect(persistActiveSessionId).toHaveBeenCalledWith("session-phase5");
  });
});
