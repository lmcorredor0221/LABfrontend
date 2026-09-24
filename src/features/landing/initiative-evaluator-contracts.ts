import { apiClient } from "@/core/api";

export type InitiativeDimensionScore = {
  dimension_key: string;
  dimension_name: string;
  score: number;
  weight: number;
  justification: string;
  status: "optimal" | "acceptable" | "critical";
};

export type InitiativeAlternativeRecommendation = {
  recommended_technology: string;
  technology_category: "rpa" | "deterministic_script" | "traditional_software" | "workflow_webhook" | "prompt_chain";
  why_not_agent: string;
  estimated_cost_risk: string;
  suggested_next_step: string;
};

export type OperationalCapabilityProfile = {
  interaction_channel?: string;
  archetype_key?: string;
  required_capabilities?: string[];
  action_capabilities?: string[];
  knowledge_modes?: string[];
  control_requirements?: string[];
  evidence_requirements?: string[];
  missing_information?: string[];
  business_summary?: string;
  technical_detail?: string;
};

export type InitiativeEvaluationRequest = {
  initiative_text: string;
  language?: "es" | "en" | "pt";
  business_context?: string;
  expected_users?: string;
  input_type?: "custom" | "example";
  example_id?: string;
  source?: string;
};

export type InitiativeEvaluationResponse = {
  is_viable: boolean;
  readiness_score: number;
  verdict_badge: "viable" | "partially_viable" | "not_recommended";
  verdict_title: string;
  verdict_summary: string;
  suggested_archetype: string | null;
  suggested_tier: "blueprint" | "blueprint_pro" | "acp" | null;
  dimensions: InitiativeDimensionScore[];
  key_strengths: string[];
  key_risks_or_gaps: string[];
  alternative: InitiativeAlternativeRecommendation | null;
  operational_profile?: OperationalCapabilityProfile | null;
  prefilled_project_data: {
    title?: string;
    description?: string;
    initial_prompt?: string;
    archetype?: string;
    recommended_stage?: string;
    operational_profile?: OperationalCapabilityProfile | null;
  };
  token_usage: {
    prompt_tokens?: number;
    completion_tokens?: number;
    cached_tokens?: number;
    latency_ms?: number;
  };
  evaluation_id: string;
  is_repeat?: boolean;
  repeat_count?: number;
};

export async function evaluateInitiativeApi(
  request: InitiativeEvaluationRequest,
): Promise<InitiativeEvaluationResponse> {
  return apiClient.post<InitiativeEvaluationResponse>(
    "/api/v1/sessions/evaluate-initiative",
    {
      body: {
        initiative_text: request.initiative_text,
        language: request.language || "es",
        business_context: request.business_context,
        expected_users: request.expected_users,
        input_type: request.input_type || "custom",
        example_id: request.example_id || "",
        source: request.source || "landing_validator",
      },
      redirectOnUnauthorized: false,
    },
  );
}
