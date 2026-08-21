import { apiClient } from "@/core/api/client";

export type AcpStageReadinessEntry = {
  stage_key: string;
  label: string;
  completed: boolean;
  justified: boolean;
  justification: string;
  technical_question_count: number;
  blocking_question_count: number;
  next_action: string;
};

export type AcpDirectRouteResolution = {
  contract_version: "acp-direct-route-resolution.v1";
  workspace_id: string;
  session_id: string;
  current_tier: "blueprint" | "blueprint_pro" | "acp";
  route_kind: "acp_direct" | "acp_after_blueprint";
  product_mode: "acp_implementation";
  question_policy: "full_readiness";
  required_stage_keys: string[];
  completed_stage_keys: string[];
  missing_stage_keys: string[];
  justified_stage_keys: string[];
  stages: AcpStageReadinessEntry[];
  can_start_package: boolean;
  can_export_package: boolean;
  next_stage_key: string;
  readiness_blockers: string[];
  total_technical_questions: number;
  total_blocking_questions: number;
  catalog_counts: Record<string, number>;
  portable_catalog_paths: string[];
  processing_guidance: string;
};

export const acpDirectApi = {
  getResolution(sessionId: string) {
    return apiClient.get<AcpDirectRouteResolution>(`/api/v1/sessions/${sessionId}/acp/direct-resolution`);
  },
};
