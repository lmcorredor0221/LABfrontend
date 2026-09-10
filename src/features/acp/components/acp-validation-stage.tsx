"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { byLanguage } from "@/features/product-experience/core/localized-copy";
import { useLanguage } from "@/core/i18n/language-context";
import { UxaButton } from "@/features/product-experience/design-system";
import type { ProductExperienceRouteSnapshot } from "@/features/product-experience/core/server-state";
import { ValidateStageView } from "@/features/product-experience/saas/saas-stage-views";
import { AcpSimulationGraph } from "@/features/acp/components/acp-simulation-graph";
import { sessionsApi } from "@/features/sessions/session-api";

export type AcpValidationStageProps = {
  activeRoute: ProductExperienceRouteSnapshot | null;
  sessionId: string;
  onReload: () => Promise<void> | void;
  onProceedToReconciliation: () => void;
};

export function AcpValidationStage({
  activeRoute,
  sessionId,
  onReload,
  onProceedToReconciliation,
}: AcpValidationStageProps) {
  const { language } = useLanguage();
  const [processing, setProcessing] = useState(false);

  async function handleProceed() {
    if (processing || !sessionId) return;
    setProcessing(true);
    try {
      for (const phaseKey of [
        "blueprint_validation",
        "test_suite",
        "gap_classification",
        "implementation_questions",
      ]) {
        await sessionsApi.runAcpWorkspacePhase(sessionId, phaseKey, {
          idempotency_key: `${sessionId}:${phaseKey}:${Date.now()}`,
        });
      }
      await onReload();
      onProceedToReconciliation();
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <UxaButton disabled={processing} isLoading={processing} onClick={() => void handleProceed()} size="md" variant="primary">
          <span>
            {processing
              ? byLanguage(language, {
                  en: "Running ACP validation...",
                  es: "Ejecutando validacion ACP...",
                  pt: "Executando validacao ACP...",
                })
              : byLanguage(language, {
                  en: "Continue to Complete Artifacts",
                  es: "Continuar a Completar Artefactos",
                  pt: "Continuar para Completar Artefatos",
                })}
          </span>
          <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
        </UxaButton>
      </div>

      <ValidateStageView
        activeRoute={activeRoute}
        supplementalContent={<AcpSimulationGraph />}
      />
    </div>
  );
}
