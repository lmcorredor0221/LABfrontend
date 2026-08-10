import {
  buildCodexRolloutSummary,
  buildCodexRuntimeSummary,
  buildFeatureFlagSummary,
  buildIntegrationsSummary,
  buildLibraryQueryParams,
  buildLibrarySummary,
  buildMonitoringSummary,
  buildReleaseObservabilitySummary,
  buildRuntimeDraft,
  getAgentExecutionBackendCopy,
  getRuntimeFieldOriginLabel,
  getKnowledgeAccessBackendCopy,
  validateRuntimeSettingsForm,
} from "@/features/operations/operations-adapter";
import type { LLMRuntimeSettings } from "@/features/sessions/session-contracts";

describe("operations adapter", () => {
  it("summarizes monitoring workspace from real backend fields", () => {
    const summary = buildMonitoringSummary(
      {
        alerts: [
          {
            alert_key: "latency",
            created_at: "2026-07-15T18:00:00",
            evidence: [],
            id: "alert-1",
            message: "Latencia alta",
            severity: "warning",
            status: "active",
            title: "Latencia",
            updated_at: "2026-07-15T18:01:00",
          },
          {
            alert_key: "errors",
            created_at: "2026-07-15T18:02:00",
            evidence: [],
            id: "alert-2",
            message: "Errores de auth",
            severity: "critical",
            status: "active",
            title: "Errores",
            updated_at: "2026-07-15T18:03:00",
          },
        ],
        current_metrics: {
          approvals_pending: 2,
          approvals_resolved: 1,
          artifact_count: 9,
          cost_estimate_usd: 14.25,
          created_at: "2026-07-15T18:05:00",
          error_count: 3,
          export_count: 2,
          id: "metric-2",
          latest_evaluation_score: 88,
          latest_evaluation_status: "ready",
          needs_review_count: 1,
          regenerations_count: 1,
          source_action: "load_monitoring",
          total_duration_ms: 3200,
          warning_count: 4,
        },
        history: [
          {
            approvals_pending: 3,
            approvals_resolved: 1,
            artifact_count: 5,
            cost_estimate_usd: 10.4,
            created_at: "2026-07-15T18:00:00",
            error_count: 5,
            export_count: 1,
            id: "metric-1",
            latest_evaluation_score: 72,
            latest_evaluation_status: "needs_review",
            needs_review_count: 2,
            regenerations_count: 0,
            source_action: "load_monitoring",
            total_duration_ms: 2500,
            warning_count: 3,
          },
          {
            approvals_pending: 2,
            approvals_resolved: 1,
            artifact_count: 9,
            cost_estimate_usd: 14.25,
            created_at: "2026-07-15T18:05:00",
            error_count: 3,
            export_count: 2,
            id: "metric-2",
            latest_evaluation_score: 88,
            latest_evaluation_status: "ready",
            needs_review_count: 1,
            regenerations_count: 1,
            source_action: "load_monitoring",
            total_duration_ms: 3200,
            warning_count: 4,
          },
        ],
        integrations: [],
        recent_errors: [],
      },
      {
        band_hit_rate: 81,
        calibrated_runs: 4,
        coverage_percent: 66,
        generated_at: "2026-07-15T18:10:00",
        mean_absolute_percentage_error_automation: 11,
        mean_absolute_percentage_error_cost: 12,
        mean_absolute_percentage_error_duration: 13,
        mean_absolute_percentage_error_hours: 14,
        mean_bias_cost_percent: 5,
        precision_by_stage: [
          {
            band_hit_rate: 77,
            calibrated_runs: 2,
            maturity_stage: "canvas",
            mean_absolute_percentage_error_automation: 10,
            mean_absolute_percentage_error_cost: 11,
            mean_absolute_percentage_error_duration: 12,
            mean_absolute_percentage_error_hours: 13,
            mean_bias_automation_percent: 1,
            mean_bias_cost_percent: 2,
            mean_bias_duration_percent: 3,
            mean_bias_hours_percent: 4,
            total_runs: 3,
          },
        ],
        recent_projects: [],
        total_runs: 6,
      },
    );

    expect(summary.latestScoreLabel).toBe("88/100");
    expect(summary.severityCounts).toEqual({
      critical: 1,
      info: 0,
      warning: 1,
    });
    expect(summary.trendSeries.evaluation).toEqual([88, 72]);
    expect(summary.calibrationCoverage).toBe(66);
  });

  it("summarizes CI13 release observability from backend telemetry", () => {
    const summary = buildReleaseObservabilitySummary({
      alerts: [],
      current_metrics: null,
      history: [],
      integrations: [],
      memory_observability: null,
      recent_errors: [],
      release_observability: {
        approval_resolution_rate: 100,
        auth_or_isolation_error_count: 0,
        average_compaction_ratio: 41.5,
        average_latency_ms: 1320,
        capabilities: [
          {
            capability_key: "define.requirements",
            degraded_count: 0,
            failure_count: 0,
            fallback_count: 1,
            label: "Requirements definition",
            long_term_hit_count: 1,
            run_count: 2,
            success_count: 2,
          },
        ],
        context_backends: [
          {
            key: "workspace_staged_compact",
            label: "workspace staged compact",
            run_count: 3,
            share_percent: 75,
          },
        ],
        context_fingerprint_coverage: 100,
        degraded_runs: 1,
        estimated_cost_usd: 18.45,
        estimation_band_hit_rate: 66.67,
        estimation_error_metric_count: 3,
        fallback_rate: 25,
        fallback_runs: 1,
        long_term_hit_count: 3,
        project_actuals_count: 2,
        providers: [
          {
            degraded_count: 1,
            effective_context_backend: "workspace_staged_compact",
            execution_backend: "provider_native",
            fallback_count: 1,
            input_tokens: 1400,
            long_term_hit_count: 2,
            model_name: "gpt-5.5",
            output_tokens: 400,
            provider_key: "openai",
            run_count: 3,
            total_duration_ms: 3900,
            total_tokens: 1800,
          },
        ],
        real_llm_runs: 3,
        release_gates: [
          {
            detail: "Todo bien",
            evidence: [],
            gate_key: "context_fingerprint_coverage",
            label: "Context fingerprint coverage",
            status: "pass",
          },
          {
            detail: "Queda un gate",
            evidence: ["fallback_runs=1"],
            gate_key: "fallback_visibility",
            label: "Fallback visibility",
            status: "fail",
          },
        ],
        rerun_count: 2,
        simulation_pass_rate: 50,
        simulation_run_count: 2,
        source_version_coverage: 100,
        stages: [
          {
            approved_artifact_count: 1,
            average_confidence: 0.82,
            failure_count: 0,
            label: "Design",
            long_term_hit_count: 1,
            needs_review_count: 1,
            rerun_count: 1,
            run_count: 2,
            simulation_pass_rate: 0,
            simulation_run_count: 0,
            stage_key: "design",
            stale_artifact_count: 0,
            success_count: 1,
          },
          {
            approved_artifact_count: 1,
            average_confidence: 0.76,
            failure_count: 0,
            label: "Validate",
            long_term_hit_count: 0,
            needs_review_count: 0,
            rerun_count: 0,
            run_count: 1,
            simulation_pass_rate: 50,
            simulation_run_count: 2,
            stage_key: "validate",
            stale_artifact_count: 1,
            success_count: 1,
          },
        ],
        stale_artifact_count: 1,
        total_input_tokens: 1400,
        total_llm_runs: 4,
        total_output_tokens: 400,
        total_tokens: 1800,
      },
    });

    expect(summary.totalLlmRuns).toBe(4);
    expect(summary.failingGateCount).toBe(1);
    expect(summary.topProviderLabel).toBe("openai · gpt-5.5");
    expect(summary.mostUsedStage).toBe("Design");
    expect(summary.averageCompactionRatio).toBe(41.5);
  });

  it("builds trimmed library query params and summary counters", () => {
    const params = buildLibraryQueryParams({
      artifact_kind: "  blueprint  ",
      blueprint_version_number: 3,
      date_from: " 2026-07-01 ",
      date_to: " 2026-07-15 ",
      q: "  acp manifest  ",
      stage: "  ready_for_export  ",
    });

    expect(params).toEqual({
      artifact_kind: "blueprint",
      blueprint_version_number: 3,
      date_from: "2026-07-01",
      date_to: "2026-07-15",
      q: "acp manifest",
      stage: "ready_for_export",
    });

    const summary = buildLibrarySummary([
      {
        artifact_key: "manifest",
        artifact_kind: "blueprint",
        artifact_metadata: {},
        artifact_title: "Manifest",
        blueprint_version_number: 2,
        content_hash: "",
        content_text: "contenido",
        created_at: "2026-07-15T18:10:00",
        export_format: "yaml",
        id: "artifact-1",
        source_action: "generate_acp",
        stage: "ready_for_export",
      },
      {
        artifact_key: "dataset",
        artifact_kind: "evaluation",
        artifact_metadata: {},
        artifact_title: "Dataset",
        blueprint_version_number: 3,
        content_hash: "",
        content_text: "dataset",
        created_at: "2026-07-15T18:12:00",
        export_format: "json",
        id: "artifact-2",
        source_action: "bootstrap_dataset",
        stage: "post_validation",
      },
    ]);

    expect(summary.totalArtifacts).toBe(2);
    expect(summary.artifactKinds.size).toBe(2);
    expect(summary.artifactStages.size).toBe(2);
    expect(summary.versionCount).toBe(2);
    expect(summary.latestCreatedAt).toBe("2026-07-15T18:12:00");
  });

  it("summarizes integrations and feature flags from the live workspace contract", () => {
    const integrationsSummary = buildIntegrationsSummary(
      [
        {
          checked_at: "2026-07-15T18:12:00",
          configured: true,
          detail: "Proveedor principal",
          id: "integration-1",
          integration_key: "openai_runtime",
          label: "OpenAI Runtime",
          reachable: true,
          status: "healthy",
        },
        {
          checked_at: "2026-07-15T18:14:00",
          configured: false,
          detail: "Falta credencial",
          id: "integration-2",
          integration_key: "codex_local",
          label: "Codex Local",
          reachable: false,
          status: "degraded",
        },
      ],
      [
        {
          active_count: 2,
          catalog_key: "operational_tools",
          item_count: 3,
          items: [],
          version: "2026.07",
        },
      ],
    );

    expect(integrationsSummary.totalIntegrations).toBe(2);
    expect(integrationsSummary.configuredCount).toBe(1);
    expect(integrationsSummary.reachableCount).toBe(1);
    expect(integrationsSummary.degradedCount).toBe(1);
    expect(integrationsSummary.catalogCards[0]).toEqual({
      activeCount: 2,
      catalogKey: "operational_tools",
      itemCount: 3,
      label: "operational tools",
      version: "2026.07",
    });

    expect(
      buildFeatureFlagSummary([
        {
          description: "Activa monitoreo",
          enabled: true,
          key: "workspace_contract_v1",
          stage_hint: "ready_for_export",
        },
        {
          description: "Activa calibracion",
          enabled: false,
          key: "estimation_calibration_dashboard",
          stage_hint: "ready_for_export",
        },
      ]),
    ).toEqual({
      enabledCount: 1,
      totalCount: 2,
    });
  });

  it("validates provider specific runtime requirements", () => {
    expect(
      validateRuntimeSettingsForm({
        active_provider: "deepseek",
        agent_execution_backend: "provider_native",
        codex_local: {
          auth_mode: "auto",
          command: "codex",
          cost_policy: "hybrid",
          fallback_models: [],
          max_concurrency: 1,
          model: "gpt-5-codex",
          primary_agents: [],
          profile: "",
          runner_id: "local",
          shadow_agents: [],
          staged_agents: [],
          timeout_ms: 150000,
        },
        deepseek: {
          base_url: "notaurl",
          fast_model: "",
          reasoning_effort: "high",
          reasoning_model: "",
        },
        knowledge_access_backend: "inline_context",
        openai: {
          fast_model: "",
          reasoning_effort: "low",
          reasoning_model: "",
        },
      }),
    ).toEqual(
      expect.objectContaining({
        deepseek_base_url: "La base URL de DeepSeek debe ser valida.",
        deepseek_fast_model: "Define el fast model de DeepSeek.",
        deepseek_reasoning_model: "Define el reasoning model de DeepSeek.",
      }),
    );
  });

  it("validates advanced codex runtime controls", () => {
    expect(
      validateRuntimeSettingsForm({
        active_provider: "codex_local",
        agent_execution_backend: "codex_cli",
        codex_local: {
          auth_mode: "auto",
          command: "codex",
          cost_policy: "hybrid",
          fallback_models: ["gpt-5.5-mini"],
          max_concurrency: 0,
          model: "gpt-5-codex",
          primary_agents: ["normalize_discovery"],
          profile: "",
          runner_id: "",
          shadow_agents: [],
          staged_agents: [],
          timeout_ms: 999,
        },
        deepseek: {
          base_url: "https://api.deepseek.com",
          fast_model: "deepseek-v4-flash",
          reasoning_effort: "high",
          reasoning_model: "deepseek-v4-pro",
        },
        knowledge_access_backend: "workspace_staged",
        openai: {
          fast_model: "gpt-5.4-mini",
          reasoning_effort: "low",
          reasoning_model: "gpt-5.5",
        },
      }),
    ).toEqual(
      expect.objectContaining({
        codex_local_max_concurrency: "La concurrencia maxima de Codex debe ser al menos 1.",
        codex_local_runner_id: "Define el runner id de Codex.",
        codex_local_timeout_ms: "El timeout de Codex debe ser de al menos 1000 ms.",
      }),
    );
  });

  it("requires a non-native backend when rollout capabilities are configured", () => {
    expect(
      validateRuntimeSettingsForm({
        active_provider: "openai",
        agent_execution_backend: "provider_native",
        codex_local: {
          auth_mode: "profile",
          command: "codex",
          cost_policy: "hybrid",
          fallback_models: [],
          max_concurrency: 1,
          model: "gpt-5.5",
          primary_agents: ["normalize_discovery"],
          profile: "",
          runner_id: "local",
          shadow_agents: [],
          staged_agents: [],
          timeout_ms: 150000,
        },
        deepseek: {
          base_url: "https://api.deepseek.com",
          fast_model: "deepseek-v4-flash",
          reasoning_effort: "high",
          reasoning_model: "deepseek-v4-pro",
        },
        knowledge_access_backend: "inline_context",
        openai: {
          fast_model: "gpt-5.4-mini",
          reasoning_effort: "low",
          reasoning_model: "gpt-5.5",
        },
      }),
    ).toEqual(
      expect.objectContaining({
        agent_execution_backend: "Activa codex_cli o shadow_codex_cli para usar rollout por capacidades.",
        codex_local_profile: "Si auth_mode es profile, define tambien el profile de Codex.",
      }),
    );
  });

  it("builds rollout and runtime summaries for Codex", () => {
    const rollout = buildCodexRolloutSummary({
      primary_agents: ["normalize_discovery"],
      shadow_agents: ["build_canvas"],
      staged_agents: [],
    });

    expect(rollout.totalCount).toBe(2);
    expect(rollout.hasRollout).toBe(true);
    expect(rollout.groups[0].preview).toContain("normalize_discovery");

    const runtimeSummary = buildCodexRuntimeSummary(
      {
        active_provider: "deepseek",
        agent_execution_backend: "shadow_codex_cli",
        codex_local: {
          auth_mode: "chatgpt_session",
          available: true,
          command: "codex",
          cost_policy: "hybrid",
          executable_found: true,
          fallback_models: ["gpt-5.5-mini"],
          health_status: "local_runtime_ready",
          last_rotated_at: null,
          max_concurrency: 2,
          model: "gpt-5.5",
          primary_agents: ["normalize_discovery"],
          profile: "bridge",
          runner_id: "local",
          secret_source: "local_runtime",
          shadow_agents: ["build_canvas"],
          staged_agents: [],
          status_note: "ready",
          timeout_ms: 180000,
        },
        compatibility_mode: "backward_compatible",
        deepseek: {
          api_key_configured: true,
          available: true,
          base_url: "https://api.deepseek.com",
          fast_model: "deepseek-v4-flash",
          health_status: "workspace_ready",
          last_rotated_at: null,
          reasoning_effort: "high",
          reasoning_model: "deepseek-v4-pro",
          secret_source: "workspace_managed",
          status_note: "ready",
        },
        field_origins: {
          active_provider: "default",
          agent_execution_backend: "override",
          "codex_local.auth_mode": "override",
          "codex_local.command": "override",
          "codex_local.cost_policy": "override",
          "codex_local.fallback_models": "override",
          "codex_local.max_concurrency": "override",
          "codex_local.model": "override",
          "codex_local.primary_agents": "override",
          "codex_local.profile": "override",
          "codex_local.runner_id": "override",
          "codex_local.shadow_agents": "override",
          "codex_local.staged_agents": "override",
          "codex_local.timeout_ms": "override",
          "deepseek.base_url": "default",
          "deepseek.fast_model": "default",
          "deepseek.reasoning_effort": "default",
          "deepseek.reasoning_model": "default",
          knowledge_access_backend: "default",
          "openai.fast_model": "default",
          "openai.reasoning_effort": "default",
          "openai.reasoning_model": "default",
          uses_platform_credentials: "override",
        },
        knowledge_access_backend: "workspace_staged",
        openai: {
          api_key_configured: true,
          available: true,
          fast_model: "gpt-5.4-mini",
          health_status: "platform_ready",
          last_rotated_at: null,
          reasoning_effort: "low",
          reasoning_model: "gpt-5.5",
          secret_source: "platform_managed",
          status_note: "ready",
        },
        provider_options: [],
        updated_at: "2026-07-17T12:00:00Z",
        uses_platform_credentials: false,
      },
      {
        active_provider: "deepseek",
        auth_detected: true,
        auth_mode: "chatgpt_session",
        available: true,
        codex_home_path: "C:/codex-home",
        configured_fallback_models: {
          default: ["gpt-5.5-mini"],
        },
        configured_models: {
          default: "gpt-5.5",
        },
        executable: "codex",
        implementation_backend: "codex_exec_wrapper",
        implementation_detail: "Codex CLI staged workspace runtime",
        last_error: null,
        last_known_result: {
          attempted_models: ["gpt-5.5"],
          duration_ms: 6200,
          finished_at: "2026-07-17T12:15:00Z",
          queue_wait_ms: 90,
          selected_model: "gpt-5.5",
          status: "succeeded",
          task_kind: "runtime_smoke",
          workspace_root: "C:/runtime/codex-workspaces/run-1",
        },
        max_concurrency: 2,
        provider: "codex_local",
        recommended_check: "Ejecuta el smoke antes de promover corridas reales.",
        runner_id: "local",
        selected_as_active_provider: false,
        smoke_blocking_reasons: [],
        smoke_command: "python backend/scripts/run_codex_runtime_smoke.py",
        smoke_ready: true,
        status: "healthy",
        timeout_ms: 180000,
        version: "codex-cli 0.144.5",
      },
    );

    expect(runtimeSummary.readiness.label).toBe("Runtime listo");
    expect(runtimeSummary.auth.label).toBe("Auth detectada");
    expect(runtimeSummary.lastRun.label).toBe("Ultima corrida OK");
    expect(runtimeSummary.rollout.totalCount).toBe(2);
  });

  it("exposes human readable execution backend copy", () => {
    expect(getAgentExecutionBackendCopy("codex_cli")).toEqual(
      expect.objectContaining({
        label: "Codex runtime gobernado",
      }),
    );
    expect(getKnowledgeAccessBackendCopy("workspace_staged")).toEqual(
      expect.objectContaining({
        label: "Workspace staged",
      }),
    );
  });

  it("preserves credential scope and origin labels in runtime drafts", () => {
    const runtime: LLMRuntimeSettings = {
      active_provider: "openai",
      agent_execution_backend: "provider_native",
      codex_local: {
        auth_mode: "auto",
        available: true,
        command: "codex",
        cost_policy: "hybrid",
        executable_found: true,
        fallback_models: ["gpt-5-codex"],
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
        status_note: "Listo",
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
        status_note: "Pendiente",
      },
      field_origins: {
        active_provider: "default",
        "openai.fast_model": "override",
      },
      knowledge_access_backend: "inline_context",
      openai: {
        api_key_configured: true,
        available: true,
        fast_model: "gpt-5-mini",
        health_status: "workspace_ready",
        last_rotated_at: null,
        reasoning_effort: "high",
        reasoning_model: "gpt-5",
        secret_source: "workspace_managed",
        status_note: "OK",
      },
      provider_options: [],
      updated_at: "2026-07-20T10:00:00",
      uses_platform_credentials: false,
    };

    expect(buildRuntimeDraft(runtime).uses_platform_credentials).toBe(false);
    expect(getRuntimeFieldOriginLabel(runtime, "openai.fast_model")).toBe("Override workspace");
    expect(getRuntimeFieldOriginLabel(runtime, "agent_execution_backend")).toBe("Default plataforma");
  });
});
