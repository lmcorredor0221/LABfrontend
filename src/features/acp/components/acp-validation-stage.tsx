"use client";

import { useState } from "react";
import { AlertCircle, ArrowRight } from "lucide-react";
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
  const [error, setError] = useState<string | null>(null);

  async function handleProceed() {
    if (processing || !sessionId) return;
    setProcessing(true);
    setError(null);
    try {
      for (const phaseKey of [
        "acp_input_readiness",
        "acp_questions_resolution",
        "acp_test_suite",
        "acp_graphic_simulation",
        "acp_quality_gates",
      ]) {
        await sessionsApi.runAcpWorkspacePhase(sessionId, phaseKey, {
          idempotency_key: `${sessionId}:${phaseKey}:${Date.now()}`,
        });
      }
      await onReload();
      onProceedToReconciliation();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
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
                  en: "Generate ACP tests and continue",
                  es: "Generar pruebas ACP y continuar",
                  pt: "Gerar testes ACP e continuar",
                })}
          </span>
          <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
        </UxaButton>
      </div>

      {error ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-state-danger)] bg-[var(--uxa-state-danger-bg)] p-4 text-[13px] text-[var(--uxa-color-ink)]"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[var(--uxa-state-danger)]" />
          <div>
            <p className="font-black">
              {byLanguage(language, {
                en: "ACP validation could not start",
                es: "No se pudo iniciar la validacion ACP",
                pt: "Nao foi possivel iniciar a validacao ACP",
              })}
            </p>
            <p className="mt-1 text-[var(--uxa-color-ink-soft)]">{error}</p>
          </div>
        </div>
      ) : null}

      <ValidateStageView
        activeRoute={activeRoute}
        hideStickyActions
        supplementalContent={<AcpSimulationGraph />}
      />
    </div>
  );
}
