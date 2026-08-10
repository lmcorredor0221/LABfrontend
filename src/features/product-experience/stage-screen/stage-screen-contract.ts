import type { ReactNode } from "react";
import type { UxaTone } from "@/features/product-experience/design-system";

export type LeanStageTabKey = "task" | "result" | "evidence";

export type LeanStageScreenMetric = {
  label: string;
  value: string;
  helper?: string;
  progress?: number;
};

export type LeanStageScreenAction = {
  description: string;
  label: string;
  tone?: UxaTone;
};

export type LeanStageWorkbenchTab = {
  badge?: string | number;
  children: ReactNode;
  description: string;
  key: LeanStageTabKey;
  label: string;
};

export type LeanStageContextItem = {
  description?: string;
  href?: string;
  label: string;
  tone?: UxaTone;
  value: string;
};

export type LeanStageLinkedResult = {
  description: string;
  href?: string;
  label: string;
  locked?: boolean;
  type: "document" | "diagram" | "decision" | "artifact" | "operation";
};

export type LeanStageScreenContract = {
  attentionItems: LeanStageContextItem[];
  linkedResults: LeanStageLinkedResult[];
  metric: LeanStageScreenMetric;
  nextStep: string;
  primaryAction: LeanStageScreenAction;
  stage: {
    description: string;
    objective: string;
    statusLabel: string;
    statusTone: UxaTone;
    title: string;
  };
  tabs: LeanStageWorkbenchTab[];
};
