"use client";

import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { byLanguage } from "@/features/product-experience/core/localized-copy";
import { useLanguage } from "@/core/i18n/language-context";

export type AcpWorkflowStep = "resolve" | "validate" | "complete" | "package";

export type AcpStepStepperProps = {
  activeStep: AcpWorkflowStep;
  completedSteps: AcpWorkflowStep[];
  onSelectStep: (step: AcpWorkflowStep) => void;
  canNavigateTo: (step: AcpWorkflowStep) => boolean;
  openQuestionsCount?: number;
};

export function AcpStepStepper({
  activeStep,
  completedSteps,
  onSelectStep,
  canNavigateTo,
  openQuestionsCount = 0,
}: AcpStepStepperProps) {
  const { language } = useLanguage();

  const steps = [
    {
      key: "resolve" as const,
      number: 1,
      label: byLanguage(language, {
        en: "1. Resolve",
        es: "1. Resolver",
        pt: "1. Resolver",
      }),
      description:
        openQuestionsCount > 0
          ? byLanguage(language, {
              en: `${openQuestionsCount} open questions`,
              es: `${openQuestionsCount} preguntas abiertas`,
              pt: `${openQuestionsCount} perguntas abertas`,
            })
          : byLanguage(language, {
              en: "Questions resolved",
              es: "Preguntas resueltas",
              pt: "Perguntas resolvidas",
            }),
    },
    {
      key: "validate" as const,
      number: 2,
      label: byLanguage(language, {
        en: "2. Validate",
        es: "2. Validar",
        pt: "2. Validar",
      }),
      description: byLanguage(language, {
        en: "Test suite & quality gates",
        es: "Test suite & calidad",
        pt: "Test suite & qualidade",
      }),
    },
    {
      key: "complete" as const,
      number: 3,
      label: byLanguage(language, {
        en: "3. Complete",
        es: "3. Completar",
        pt: "3. Completar",
      }),
      description: byLanguage(language, {
        en: "Artifacts & diagrams",
        es: "Artefactos & diagramas",
        pt: "Artefatos & diagramas",
      }),
    },
    {
      key: "package" as const,
      number: 4,
      label: byLanguage(language, {
        en: "4. Package",
        es: "4. Empaquetar",
        pt: "4. Empacotar",
      }),
      description: byLanguage(language, {
        en: "Download ACP ZIP",
        es: "Descargar ACP ZIP",
        pt: "Baixar ACP ZIP",
      }),
    },
  ];

  return (
    <nav aria-label="Ruta de Etapas ACP" className="uxa-stage-rail">
      <ol className="uxa-stage-rail-list grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {steps.map((step) => {
          const isActive = activeStep === step.key;
          const isCompleted = completedSteps.includes(step.key);
          const isAllowed = canNavigateTo(step.key);

          return (
            <li key={step.key}>
              <button
                aria-current={isActive ? "step" : undefined}
                className={cn(
                  "uxa-stage-rail-link w-full text-left transition-all",
                  isActive && "shadow-xs ring-1 ring-[var(--uxa-color-brand)]",
                  !isAllowed &&
                    "cursor-not-allowed opacity-50 hover:bg-transparent hover:border-transparent",
                )}
                disabled={!isAllowed}
                onClick={() => {
                  if (isAllowed) onSelectStep(step.key);
                }}
                type="button"
              >
                <span
                  className={cn(
                    "uxa-stage-rail-marker shrink-0",
                    isCompleted &&
                      !isActive &&
                      "bg-[var(--uxa-state-success-bg)] text-[var(--uxa-state-success)]",
                  )}
                >
                  {isCompleted && !isActive ? (
                    <Check aria-hidden="true" className="h-3.5 w-3.5 stroke-[3]" />
                  ) : !isAllowed ? (
                    <Lock aria-hidden="true" className="h-3 w-3 text-slate-400" />
                  ) : (
                    step.number
                  )}
                </span>
                <span className="uxa-stage-rail-copy min-w-0 flex-1">
                  <span className="uxa-stage-rail-title truncate">{step.label}</span>
                  <span className="uxa-stage-rail-description truncate">
                    {step.description}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
