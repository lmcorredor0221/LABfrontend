import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AgentDetailPage } from "@/features/agents/agent-detail-page";
import { EvaluationsWorkspacePage } from "@/features/evaluation/evaluations-workspace";
import { TemplatesWorkspacePage } from "@/features/templates/templates-workspace";
import { AuthProvider } from "@/core/auth/auth-context";
import { createAuthStore } from "@/core/auth/auth-store";
import { SessionsProvider } from "@/features/sessions/session-context";
import type { ACPFileEntry, ACPPreview, ArtifactBrowserResponse } from "@/features/sessions/session-contracts";
import { createSessionsStore } from "@/features/sessions/session-store";
import type { SessionSnapshot, SessionSummary } from "@/features/sessions/types";

const replaceMock = vi.fn();
const pushMock = vi.fn();
let mockPathname = "/";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
}));

function createSessionSummary(
  id: string,
  title: string,
  overrides?: Partial<SessionSummary>,
): SessionSummary {
  return {
    created_at: "2026-07-15T11:00:00",
    current_stage: "ready_for_export",
    id,
    status: "ready",
    title,
    updated_at: "2026-07-15T12:00:00",
    ...overrides,
  };
}

function createSnapshot(session: SessionSummary, score: number, suffix: string): SessionSnapshot {
  return {
    activity: [
      {
        created_at: "2026-07-15T12:30:00",
        message: `Actividad ${suffix}`,
        stage: "ready_for_export",
        status: "ready",
      },
    ],
    alert_events: [],
    approvals: [],
    artifact_records: [
      {
        artifact_key: `artifact-${suffix}`,
        artifact_kind: "acp_preview",
        artifact_metadata: {},
        artifact_title: `Artefacto ${suffix}`,
        blueprint_version_number: 2,
        content_hash: `hash-${suffix}`,
        content_text: `Contenido ${suffix}`,
        created_at: "2026-07-15T12:40:00",
        export_format: "md",
        id: `artifact-id-${suffix}`,
        source_action: "generate_acp",
        stage: "ready_for_export",
      },
    ],
    blueprint: {
      architecture: `Arquitectura ${suffix}`,
      contract_version: "blueprint.v1",
      delivery_package: {
        blueprint_coverage: {
          covered_sections: 7,
          missing_sections: [],
          overall_status: "complete",
          sections: [],
          total_sections: 8,
        },
        component_readiness: [],
        contract_version: "delivery-package.v1",
        decision_summary: `Resumen ${suffix}`,
        decision_trace: [],
        deliverables: [],
        observability_plan: {
          alert_triggers: [],
          captured_signals: [],
          cost_tracking: "manual",
          decision_logging: "enabled",
          duration_tracking: "enabled",
          plan_summary_policy: "resumir",
          result_tracking: "enabled",
          tool_response_logging: "enabled",
        },
        pattern_catalog: [],
        risk_summary: {
          approval_gates_required: 0,
          high_risks: 0,
          low_risks: 1,
          medium_risks: 0,
          overall_status: "complete",
          side_effect_tools: 0,
          summary: "Sin riesgos criticos",
          total_checks: 1,
        },
        roadmap_evolution: {
          current_focus: "Operar",
          current_release: "MVP",
          milestones: [],
        },
        workflow_profile: {
          approval_pause: "manual",
          checkpoint_policy: "por etapa",
          compensation_strategy: "rollback",
          execution_pattern: "single-agent",
          inbox_strategy: "structured",
          outbox_strategy: "structured",
          retry_strategy: "limited",
          steps: [],
          timeout_policy: "short",
        },
      },
      guardrails: [`Guardrail ${suffix}`],
      memory_profile: {
        goal_drift_guard: "revisar objetivo",
        retrieval_policy: "contexto reciente",
        review_trigger: "cambio mayor",
        storage_layers: ["session_state"],
        strategy: "resumen",
        write_policy: "checkpoint",
      },
      memory_strategy: `Memoria ${suffix}`,
      narrative: `Narrativa ${suffix}`,
      readiness_state: "complete",
      reasoning_pattern: `Pattern ${suffix}`,
      safety_checks: [],
      tools: [
        {
          approval_reason: "",
          compensation_strategy: "rollback",
          execution_mode: "api_call",
          failure_mode: "timeout",
          has_side_effects: false,
          inputs: ["input"],
          name: `tool-${suffix}`,
          outputs: ["output"],
          purpose: `Proposito ${suffix}`,
          requires_approval: false,
          retry_strategy: "once",
          risk_level: "low",
          validations: ["schema"],
        },
      ],
    },
    blueprint_versions: [],
    canvas: null,
    contract_version: "session-snapshot.v1",
    discovery: {
      autonomy_level: "medium",
      case_type: "assistant",
      constraints: [],
      current_process: "manual",
      current_user: "operaciones",
      desired_outcome: `Objetivo ${suffix}`,
      mvp_definition: {
        non_delegable_decisions: [],
        north_star_metric: "score",
        out_of_scope: [],
        v1_scope: [],
      },
      operational_baseline: {
        automation_opportunities: [],
        current_cost: "medio",
        current_time_spent: "8h",
        frequent_errors: [],
      },
      problem_statement: `Problema ${suffix}`,
      value_statement: `Valor ${suffix}`,
    },
    estimation_error_metrics: [],
    estimation_report: null,
    estimation_runs: [],
    evaluation: {
      cases: [],
      coherence_status: "complete",
      completeness_status: "complete",
      gaps: [],
      recommendations: [`Recomendacion ${suffix}`],
      scores: { quality: score },
    },
    evaluation_dataset: {
      blueprint_version_number: 2,
      cases: [
        {
          case_key: `case-${suffix}`,
          category: "journey",
          expected_result: `Esperado ${suffix}`,
          is_active: true,
          priority: "core",
          scenario: `Escenario ${suffix}`,
          source: "manual",
          title: `Caso ${suffix}`,
        },
      ],
      source_action: "bootstrap",
      status: "ready",
      summary: `Dataset ${suffix}`,
      version_number: 1,
    },
    evaluation_rubric: {
      blueprint_version_number: 2,
      dimensions: [
        {
          description: `Dimension ${suffix}`,
          hard_block: false,
          key: `dimension-${suffix}`,
          label: `Dimension ${suffix}`,
          weight: 100,
        },
      ],
      source_action: "bootstrap",
      summary: `Rubrica ${suffix}`,
      version_number: 1,
    },
    evaluation_runs: [
      {
        blocking_issues: [],
        blueprint_version_number: 2,
        category_scores: { journey: score },
        created_at: "2026-07-15T13:00:00",
        dataset_version_number: 1,
        dimension_scores: { quality: score },
        id: `run-${suffix}`,
        overall_score: score,
        recommendations: [`Ajuste ${suffix}`],
        results: [
          {
            blocking_issues: [],
            case_key: `case-${suffix}`,
            category: "journey",
            evidence: [],
            observed_result: `Observado ${suffix}`,
            recommendations: [],
            score,
            status: "ready",
            summary: `Resumen corrida ${suffix}`,
            title: `Caso ${suffix}`,
          },
        ],
        rubric_version_number: 1,
        source_action: "evaluate",
        status: "ready",
        summary: `Run ${suffix}`,
      },
    ],
    governance_policies: [],
    handoff_records: [],
    integration_statuses: [
      {
        checked_at: "2026-07-15T13:10:00",
        configured: true,
        detail: `Integracion ${suffix}`,
        id: `integration-${suffix}`,
        integration_key: `integration-${suffix}`,
        label: `Integracion ${suffix}`,
        reachable: true,
        status: "healthy",
      },
    ],
    journey_artifacts: [],
    metric_snapshots: [],
    project_actuals: [],
    selected_workflow_template_key: undefined,
    session,
    skill_catalog: [],
    skill_runs: [],
    subagent_runs: [],
    simulation_runs: [],
    validations: [
      {
        artifact_name: `artifact-${suffix}`,
        created_at: "2026-07-15T13:20:00",
        missing_fields: [],
        status: "ready",
        warnings: [`Warning ${suffix}`],
      },
    ],
    workflow_templates: [
      {
        architecture_scope: ["assistant"],
        governance_hints: [],
        id: `template-${suffix}`,
        is_active: true,
        label: `Template ${suffix}`,
        summary: `Template ${suffix}`,
        supports_approvals: false,
        supports_handoffs: false,
        template_key: `template-${suffix}`,
        updated_at: "2026-07-15T13:30:00",
        workflow_profile: {
          approval_pause: "manual",
          checkpoint_policy: "etapa",
          compensation_strategy: "rollback",
          execution_pattern: "single-agent",
          inbox_strategy: "structured",
          outbox_strategy: "structured",
          retry_strategy: "limited",
          steps: [],
          timeout_policy: "short",
        },
      },
    ],
    workspace_contract: {
      catalogs: [],
      contract_version: "workspace-contract.v1",
      feature_flags: [],
      sections: [],
    },
  };
}

function createAuthStoreForTests() {
  return createAuthStore({
    api: {
      login: vi.fn(),
      logout: vi.fn(),
      me: vi.fn().mockResolvedValue({
        active_workspace_id: "workspace-1",
        active_workspace_name: "Workspace principal",
        email: "admin@leanbuilder.local",
        full_name: "Lean Builder Admin",
        id: "user-1",
        workspaces: [],
      }),
      selectWorkspace: vi.fn(),
    },
    clearToken: vi.fn(),
    loadToken: () => "seed-token",
    persistToken: vi.fn(),
  });
}

function renderWithProviders(ui: React.ReactNode, store: ReturnType<typeof createSessionsStore>) {
  const authStore = createAuthStoreForTests();

  return render(
    <AuthProvider store={authStore}>
      <SessionsProvider store={store}>{ui}</SessionsProvider>
    </AuthProvider>,
  );
}

describe("phase 6 cross-session workspaces", () => {
  beforeEach(() => {
    mockPathname = "/";
    pushMock.mockReset();
    replaceMock.mockReset();
  });

  it("reloads templates when the selected session changes", async () => {
    mockPathname = "/templates";
    const sessionOne = createSessionSummary("session-1", "Ventas LATAM");
    const sessionTwo = createSessionSummary("session-2", "Soporte TI");

    const store = createSessionsStore({
      api: {
        getAcpFile: vi.fn(async (sessionId: string): Promise<ACPFileEntry> => ({
          content_hash: `${sessionId}-hash`,
          content_text: `Manifest ${sessionId}`,
          domain: "runtime",
          format: "markdown",
          missing_fields: [],
          path: `ACP/${sessionId}/manifest.md`,
          source_sections: [],
          status: "complete",
          title: `Manifest ${sessionId}`,
          warnings: [],
        })),
        getAcpPreview: vi.fn(async (sessionId: string): Promise<ACPPreview> => ({
          blueprint_version_number: 2,
          construction_readiness: {
            assumptions_count: 1,
            blocking_gaps: 0,
            can_start_build: true,
            gaps: [],
            next_recommended_action: "Listo",
            open_questions: 0,
            overall_status: "ready_to_build",
          },
          files: [
            {
              content_hash: `${sessionId}-hash`,
              content_text: "",
              domain: "runtime",
              format: "markdown",
              missing_fields: [],
              path: `ACP/${sessionId}/manifest.md`,
              source_sections: [],
              status: "complete",
              title: `Manifest ${sessionId}`,
              warnings: [],
            },
          ],
          manifest_path: `ACP/${sessionId}/manifest.md`,
          package_version: `acp-${sessionId}`,
          session_id: sessionId,
          validation: {
            can_export_zip: true,
            completeness_percent: sessionId === "session-1" ? 84 : 97,
            issues: [],
            overall_status: "complete",
          },
        })),
        getAcpQuestions: vi.fn().mockResolvedValue([]),
        list: vi.fn().mockResolvedValue({
          items: [sessionOne, sessionTwo],
        }),
        listArtifacts: vi.fn(async (sessionId: string): Promise<ArtifactBrowserResponse> => ({
          items: [
            {
              artifact_key: `artifact-${sessionId}`,
              artifact_kind: "acp_preview",
              artifact_metadata: {},
              artifact_title: `Artefacto ${sessionId}`,
              blueprint_version_number: 2,
              content_hash: `hash-${sessionId}`,
              content_text: `Contenido ${sessionId}`,
              created_at: "2026-07-15T13:00:00",
              export_format: "md",
              id: `artifact-${sessionId}`,
              source_action: "generate_acp",
              stage: "ready_for_export",
            },
          ],
        })),
      },
      clearActiveSessionId: vi.fn(),
      loadActiveSessionId: () => "session-1",
      persistActiveSessionId: vi.fn(),
    });

    renderWithProviders(<TemplatesWorkspacePage />, store);

    expect(await screen.findByTestId("templates-package-version", {}, { timeout: 4000 })).toHaveTextContent("acp-session-1");
    expect(await screen.findByTestId("templates-selected-file-content", {}, { timeout: 4000 })).toHaveTextContent("Manifest session-1");

    await userEvent.selectOptions(screen.getByTestId("operations-session-select"), "session-2");

    await waitFor(() => {
      expect(screen.getByTestId("templates-package-version")).toHaveTextContent("acp-session-2");
      expect(screen.getByTestId("templates-selected-file-content")).toHaveTextContent("Manifest session-2");
    }, { timeout: 4000 });
  });

  it("reloads evaluations when the selected session changes", async () => {
    mockPathname = "/evaluations";
    const sessionOne = createSessionSummary("session-1", "Ventas LATAM");
    const sessionTwo = createSessionSummary("session-2", "Soporte TI");

    const store = createSessionsStore({
      api: {
        getSnapshot: vi.fn(async (sessionId: string) =>
          sessionId === "session-1"
            ? createSnapshot(sessionOne, 81, "uno")
            : createSnapshot(sessionTwo, 94, "dos"),
        ),
        list: vi.fn().mockResolvedValue({
          items: [sessionOne, sessionTwo],
        }),
      },
      clearActiveSessionId: vi.fn(),
      loadActiveSessionId: () => "session-1",
      persistActiveSessionId: vi.fn(),
    });

    renderWithProviders(<EvaluationsWorkspacePage />, store);

    expect(await screen.findByText("Run uno")).toBeInTheDocument();
    expect((await screen.findAllByText("81/100")).length).toBeGreaterThan(0);

    await userEvent.selectOptions(screen.getByTestId("operations-session-select"), "session-2");

    await waitFor(() => {
      expect(screen.getByText("Run dos")).toBeInTheDocument();
      expect(screen.getAllByText("94/100").length).toBeGreaterThan(0);
    }, { timeout: 4000 });
  });

  it("renders agent detail as a session-derived projection", async () => {
    mockPathname = "/agents/session-1";
    const sessionOne = createSessionSummary("session-1", "Ventas LATAM");

    const store = createSessionsStore({
      api: {
        getMonitoringWorkspace: vi.fn().mockResolvedValue({
          alerts: [],
          current_metrics: {
            approvals_pending: 0,
            approvals_resolved: 1,
            artifact_count: 4,
            cost_estimate_usd: 12,
            created_at: "2026-07-15T13:10:00",
            error_count: 0,
            export_count: 2,
            id: "metric-1",
            latest_evaluation_score: 81,
            latest_evaluation_status: "ready",
            needs_review_count: 0,
            regenerations_count: 1,
            source_action: "evaluate",
            total_duration_ms: 1400,
            warning_count: 1,
          },
          history: [],
          integrations: [
            {
              checked_at: "2026-07-15T13:10:00",
              configured: true,
              detail: "Healthy",
              id: "integration-1",
              integration_key: "crm",
              label: "CRM",
              reachable: true,
              status: "healthy",
            },
          ],
          recent_errors: [],
        }),
        getSnapshot: vi.fn().mockResolvedValue(createSnapshot(sessionOne, 81, "uno")),
        list: vi.fn().mockResolvedValue({
          items: [sessionOne],
        }),
      },
      clearActiveSessionId: vi.fn(),
      loadActiveSessionId: () => "session-1",
      persistActiveSessionId: vi.fn(),
    });

    renderWithProviders(<AgentDetailPage sessionId="session-1" />, store);

    expect((await screen.findByTestId("agent-projection-title")).textContent).toBe("Ventas LATAM");
    expect(await screen.findByText("Derivado de sesion")).toBeInTheDocument();
    expect(await screen.findByText("Recomendacion uno")).toBeInTheDocument();
  });
});
