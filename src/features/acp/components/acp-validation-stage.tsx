"use client";

import { ArrowRight } from "lucide-react";
import { byLanguage } from "@/features/product-experience/core/localized-copy";
import { useLanguage } from "@/core/i18n/language-context";
import { UxaButton } from "@/features/product-experience/design-system";
import type { ProductExperienceRouteSnapshot } from "@/features/product-experience/core/server-state";
import { ValidateStageView } from "@/features/product-experience/saas/saas-stage-views";
import { AcpSimulationGraph } from "@/features/acp/components/acp-simulation-graph";

export type AcpValidationStageProps = {
  activeRoute: ProductExperienceRouteSnapshot | null;
  onProceedToReconciliation: () => void;
};

export function AcpValidationStage({
  activeRoute,
  onProceedToReconciliation,
}: AcpValidationStageProps) {
  const { language } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <UxaButton onClick={onProceedToReconciliation} size="md" variant="primary">
          <span>
            {byLanguage(language, {
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
