import { apiClient } from "@/core/api";
import type {
  LLMProviderKey,
  LLMRuntimeSettings,
  LLMRuntimeSettingsUpdateRequest,
  PlatformRuntimeProviderResponse,
  PlatformRuntimeProviderUpdateRequest,
  PlatformProviderSecretResponse,
  RuntimeSettingsAuditListResponse,
  WorkspaceProviderSecretResponse,
  WorkspaceProviderSecretUpsertRequest,
  WorkspaceRuntimeHealthResponse,
} from "@/features/sessions/session-contracts";

export type RuntimeHealthResponse = {
  checked_at?: string;
  llm: {
    configured?: boolean;
    mode?: string;
    provider?: string;
    sdk_ready?: boolean;
  };
  runtime: {
    active_provider?: string;
    agent_execution_backend?: string;
    knowledge_access_backend?: string;
    scope?: string;
    scope_detail?: string;
  };
  status: string;
};

export type RuntimeExecutionSnapshot = {
  attempted_models: string[];
  duration_ms?: number | null;
  error_code?: string | null;
  exit_code?: number | null;
  fallback_used?: boolean | null;
  finished_at?: string | null;
  queue_wait_ms?: number | null;
  recoverable?: boolean | null;
  run_id?: string | null;
  selected_model?: string | null;
  status?: string | null;
  task_kind?: string | null;
  workspace_root?: string | null;
};

export type RuntimeStatusResponse = {
  active_provider: string;
  auth_detected: boolean;
  auth_mode: string;
  available: boolean;
  codex_home_path: string;
  configured_fallback_models: Record<string, string[]>;
  configured_models: Record<string, string | null>;
  executable: string;
  implementation_backend: string;
  implementation_detail: string;
  last_error: RuntimeExecutionSnapshot | null;
  last_known_result: RuntimeExecutionSnapshot | null;
  max_concurrency: number;
  provider: "codex_local";
  recommended_check: string;
  runner_id: string;
  selected_as_active_provider: boolean;
  smoke_blocking_reasons: string[];
  smoke_command: string;
  smoke_ready: boolean;
  status: string;
  timeout_ms: number;
  version: string | null;
};

export type RuntimePropagationMode = "fallback_only" | "reset_to_platform" | "force_selected" | "force_all";

export type RuntimePropagationRequest = {
  dry_run?: boolean;
  mode: RuntimePropagationMode;
  payload: LLMRuntimeSettingsUpdateRequest;
  workspace_ids?: string[];
};

export type RuntimePropagationItemResponse = {
  action: string;
  detail: string;
  effective_provider_after?: string | null;
  status: "applied" | "failed" | "planned" | "skipped" | string;
  workspace_id: string;
  workspace_name: string;
};

export type RuntimePropagationRunResponse = {
  applied_count: number;
  dry_run: boolean;
  failed_count: number;
  id: string;
  items: RuntimePropagationItemResponse[];
  mode: RuntimePropagationMode;
  planned_count: number;
  skipped_count: number;
  status: "applied" | "failed" | "planned" | "skipped" | string;
};

export function createRuntimeApi(client = apiClient) {
  return {
    health() {
      return client.get<RuntimeHealthResponse>("/health", {
        redirectOnUnauthorized: false,
      });
    },
    status() {
      return client.get<RuntimeStatusResponse>("/api/v1/runtime/status", {
        redirectOnUnauthorized: false,
      });
    },
    deleteWorkspaceSecret(providerKey: LLMProviderKey) {
      return client.delete<WorkspaceProviderSecretResponse>(`/api/v1/runtime/llm/secrets/${providerKey}`);
    },
    deletePlatformSecret(providerKey: LLMProviderKey) {
      return client.delete<PlatformProviderSecretResponse>(`/api/v1/platform/runtime/secrets/${providerKey}`, {
        redirectOnUnauthorized: false,
      });
    },
    getPlatformAudit(limit = 50) {
      return client.get<RuntimeSettingsAuditListResponse>(`/api/v1/platform/runtime/audit?limit=${limit}`, {
        redirectOnUnauthorized: false,
      });
    },
    getPlatformDefaults() {
      return client.get<LLMRuntimeSettings>("/api/v1/platform/runtime/defaults", {
        redirectOnUnauthorized: false,
      });
    },
    getPlatformSecret(providerKey: LLMProviderKey) {
      return client.get<PlatformProviderSecretResponse>(`/api/v1/platform/runtime/secrets/${providerKey}`, {
        redirectOnUnauthorized: false,
      });
    },
    getWorkspaceRuntimeHealth() {
      return client.get<WorkspaceRuntimeHealthResponse>("/api/v1/runtime/llm/health");
    },
    listPlatformProviders() {
      return client.get<PlatformRuntimeProviderResponse[]>("/api/v1/platform/runtime/providers", {
        redirectOnUnauthorized: false,
      });
    },
    resetWorkspaceRuntime() {
      return client.delete<LLMRuntimeSettings>("/api/v1/runtime/llm");
    },
    rotateWorkspaceSecret(providerKey: LLMProviderKey, payload: WorkspaceProviderSecretUpsertRequest) {
      return client.post<WorkspaceProviderSecretResponse>(`/api/v1/runtime/llm/secrets/${providerKey}/rotate`, {
        body: payload,
      });
    },
    rotatePlatformSecret(providerKey: LLMProviderKey, payload: WorkspaceProviderSecretUpsertRequest) {
      return client.post<PlatformProviderSecretResponse>(`/api/v1/platform/runtime/secrets/${providerKey}/rotate`, {
        body: payload,
        redirectOnUnauthorized: false,
      });
    },
    testWorkspaceRuntime() {
      return client.post<WorkspaceRuntimeHealthResponse>("/api/v1/runtime/llm/test");
    },
    updatePlatformDefaults(payload: LLMRuntimeSettingsUpdateRequest) {
      return client.patch<LLMRuntimeSettings>("/api/v1/platform/runtime/defaults", {
        body: payload,
        redirectOnUnauthorized: false,
      });
    },
    propagatePlatformDefaults(payload: RuntimePropagationRequest) {
      return client.post<RuntimePropagationRunResponse>("/api/v1/platform/runtime/defaults/propagate", {
        body: payload,
        redirectOnUnauthorized: false,
      });
    },
    updatePlatformProvider(providerKey: LLMProviderKey, payload: PlatformRuntimeProviderUpdateRequest) {
      return client.patch<PlatformRuntimeProviderResponse>(`/api/v1/platform/runtime/providers/${providerKey}`, {
        body: payload,
        redirectOnUnauthorized: false,
      });
    },
    upsertWorkspaceSecret(providerKey: LLMProviderKey, payload: WorkspaceProviderSecretUpsertRequest) {
      return client.post<WorkspaceProviderSecretResponse>(`/api/v1/runtime/llm/secrets/${providerKey}`, {
        body: payload,
      });
    },
    upsertPlatformSecret(providerKey: LLMProviderKey, payload: WorkspaceProviderSecretUpsertRequest) {
      return client.post<PlatformProviderSecretResponse>(`/api/v1/platform/runtime/secrets/${providerKey}`, {
        body: payload,
        redirectOnUnauthorized: false,
      });
    },
  };
}

export type RuntimeApi = ReturnType<typeof createRuntimeApi>;

export const runtimeApi = createRuntimeApi();
