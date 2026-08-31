"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, CheckCircle2, FileArchive, Gauge, PackageCheck, Play, RotateCcw, ShieldCheck } from "lucide-react";
import { sessionsApi } from "@/features/sessions/session-api";
import {
  UxaBadge,
  UxaButton,
  UxaEmptyState,
  UxaMetricCard,
  UxaPageState,
  UxaStickyActionBar,
  UxaSurface,
} from "@/features/product-experience/design-system";
import type { ProductExperienceRouteSnapshot } from "@/features/product-experience/core/server-state";
import {
  buildEstimateReadiness,
  buildProductSaasViewModel,
  buildValidationReadiness,
  formatHours,
  formatPercent,
  formatWeeks,
  getConstructionScenarios,
  type ProductMetric,
  type ProductReadinessSummary,
  type SaasTone,
} from "@/features/product-experience/saas/saas-product-model";
import { byLanguage } from "@/features/product-experience/core/localized-copy";
import { useCurrency } from "@/core/commerce/currency-context";
import type { Currency } from "@/core/commerce/trm-service";
import {
  EstimateRoiHifiMockup,
  type EstimateRoiHifiScenario,
} from "@/features/product-experience/saas/estimate-roi-hifi-view";
import { hasBlueprintProEntitlement } from "@/features/sessions/commercial-access";
import type {
  ProductStageActions,
  ProductStageActionState,
} from "@/features/product-experience/shell/use-product-experience-route";
import { useLanguage } from "@/core/i18n/language-context";
import { getProductExperienceProductHref } from "@/features/product-experience/shell/experience-model";

type StageViewProps = {
  actionState?: ProductStageActionState;
  activeRoute: ProductExperienceRouteSnapshot | null;
  actions?: ProductStageActions;
};

function toneForStatus(status?: string | null): SaasTone {
  if (!status) {
    return "neutral";
  }

  if (["approved", "ready", "pass", "completed", "complete"].includes(status)) {
    return "success";
  }

  if (["failed", "blocked", "rejected", "fail"].includes(status)) {
    return "danger";
  }

  if (["needs_review", "needs_revision", "warning", "stale"].includes(status)) {
    return "warning";
  }

  return "info";
}

function hasActiveServerOperation(
  activeRoute: ProductExperienceRouteSnapshot | null,
  stageKey: string,
  actions: string[],
) {
  const operation = activeRoute?.operation.data?.stageOperation ?? null;
  return Boolean(
    operation &&
      operation.stage_key === stageKey &&
      actions.includes(operation.action) &&
      ["queued", "running"].includes(operation.status),
  );
}

function EmptyOperationalState({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  const { language } = useLanguage();
  return (
    <UxaEmptyState
      description={description}
      eyebrow={byLanguage(language, { en: "No operational data", es: "Sin datos operativos", pt: "Sem dados operacionais" })}
      icon={<AlertTriangle aria-hidden="true" className="h-5 w-5" />}
      title={title}
    />
  );
}

function ReadinessHero({
  icon,
  summary,
  title,
}: {
  icon: ReactNode;
  summary: ProductReadinessSummary;
  title: string;
}) {
  const { language } = useLanguage();
  const stateTone = summary.tone === "danger" ? "danger" : summary.tone === "warning" ? "warning" : summary.tone === "info" ? "info" : "neutral";

  return (
    <UxaPageState
      description={(
        <div>
          <p>{summary.detail}</p>
          {summary.blockers.length ? (
            <ul className="mt-2 grid gap-1 pl-4 text-[var(--uxa-font-size-small)]">
              {summary.blockers.slice(0, 4).map((blocker, index) => <li key={`${blocker}-${index}`}>{blocker}</li>)}
            </ul>
          ) : null}
        </div>
      )}
      eyebrow={<span className="inline-flex flex-wrap gap-2"><UxaBadge tone={summary.tone}>{summary.stateLabel}</UxaBadge>{summary.blockers.length ? <UxaBadge tone="danger">{summary.blockers.length} {byLanguage(language, { en: "blocker(s)", es: "bloqueo(s)", pt: "bloqueio(s)" })}</UxaBadge> : <UxaBadge tone="success">{byLanguage(language, { en: "No operational blockers", es: "Sin bloqueos operativos", pt: "Sem bloqueios operacionais" })}</UxaBadge>}</span>}
      icon={icon}
      title={title}
      tone={stateTone}
    />
  );
}

function MetricGrid({ metrics }: { metrics: ProductMetric[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <UxaMetricCard
          description={metric.detail}
          key={metric.key}
          label={<span className="inline-flex items-center gap-2">{metric.label}<UxaBadge tone={metric.tone}>{metric.tone}</UxaBadge></span>}
          value={metric.value}
        />
      ))}
    </div>
  );
}

function formatScenarioCost(value: number | null | undefined, currency: Currency, trmRate: number) {
  const copValue = Number(value ?? 0);
  if (!Number.isFinite(copValue)) {
    return currency === "USD" ? "$0" : "$ 0 COP";
  }

  if (currency === "USD") {
    const usdValue = trmRate > 0 ? copValue / trmRate : 0;
    return new Intl.NumberFormat("en-US", {
      currency: "USD",
      maximumFractionDigits: 0,
      style: "currency",
    }).format(usdValue);
  }

  return new Intl.NumberFormat("es-CO", {
    currency: "COP",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(copValue);
}

function toHifiScenarios(scenarios: ReturnType<typeof getConstructionScenarios>): EstimateRoiHifiScenario[] {
  const traditional = scenarios.find((scenario) => scenario.scenario_key === "traditional_blueprint");
  const traditionalCost = Math.max(1, traditional?.estimated_cost ?? 0);

  return scenarios.map((scenario) => {
    const key = scenario.scenario_key === "traditional_blueprint"
      ? "traditional"
      : scenario.scenario_key === "done_for_you_factory"
        ? "factory"
        : scenario.scenario_key;
    const savings = scenario.scenario_key === "traditional_blueprint"
      ? 0
      : Math.max(0, Math.round((scenario.cost_savings_vs_traditional / traditionalCost) * 100));

    return {
      automation: scenario.automation_leverage_percent,
      cta: scenario.scenario_key === "acp_agentic" ? "Explorar esta alternativa" : "Comparar alternativa",
      description: scenario.description,
      duration: scenario.estimated_duration_weeks,
      human: scenario.human_intervention_percent,
      key,
      label: scenario.label,
      recommended: scenario.scenario_key === "acp_agentic",
      savings,
      totalCostCop: scenario.estimated_cost,
      totalHours: scenario.estimated_hours_total,
    };
  });
}

function ScenarioComparison({
  activeRoute,
  onScenarioCta,
  scenarioCtaBusy = false,
}: StageViewProps & {
  onScenarioCta?: (scenarioKey: string) => void;
  scenarioCtaBusy?: boolean;
}) {
  const router = useRouter();
  const { currency, formatPrice, trm } = useCurrency();
  const { language } = useLanguage();
  const copy = (en: string, es: string, pt: string) => byLanguage(language, { en, es, pt });
  const snapshot = activeRoute?.snapshot.data ?? null;
  const scenarios = getConstructionScenarios(snapshot);
  const sessionId = activeRoute?.route.sessionId ?? "";

  function productHref(section: "acp" | "blueprint" | "blueprint_pro") {
    return sessionId ? getProductExperienceProductHref(sessionId, section) : "";
  }

  function ctaForScenario(scenarioKey: string): { href: string; label: string; variant?: "primary" | "secondary" | "ghost" } | null {
    if (scenarioKey === "blueprint_basic") {
      return {
        href: productHref("blueprint"),
        label: copy("View Basic Blueprint", "Ver Blueprint Basico", "Ver Blueprint Basico"),
        variant: "secondary",
      };
    }

    if (scenarioKey === "blueprint_premium") {
      return {
        href: productHref("blueprint_pro"),
        label: copy(
          `Unlock Blueprint Pro for ${formatPrice(49)}`,
          `Desbloquear Blueprint Pro por ${formatPrice(49)}`,
          `Desbloquear Blueprint Pro por ${formatPrice(49)}`,
        ),
        variant: "secondary",
      };
    }

    if (scenarioKey === "agentic_blueprint") {
      return {
        href: productHref("blueprint_pro"),
        label: copy("Compare with Blueprint Pro", "Comparar con Blueprint Pro", "Comparar com Blueprint Pro"),
        variant: "ghost",
      };
    }

    if (scenarioKey === "acp_manual") {
      return {
        href: productHref("acp"),
        label: copy("Explore ACP", "Explorar ACP", "Explorar ACP"),
        variant: "secondary",
      };
    }

    if (scenarioKey === "acp_agentic") {
      return {
        href: productHref("acp"),
        label: copy(
          `Unlock this speed for ${formatPrice(149)}`,
          `Desbloquear esta velocidad por ${formatPrice(149)}`,
          `Desbloquear esta velocidade por ${formatPrice(149)}`,
        ),
        variant: "primary",
      };
    }

    if (scenarioKey === "done_for_you_factory") {
      return {
        href: sessionId ? getProductExperienceProductHref(sessionId, "attention") : "",
        label: copy("Request guided delivery", "Solicitar Fabrica de Desarrollo", "Solicitar Fabrica de Desenvolvimento"),
        variant: "secondary",
      };
    }

    return null;
  }

  if (!scenarios.length) {
    return (
      <EmptyOperationalState
        description={copy("When Estimate consolidates the report, the traditional, Blueprint, ACP, and agentic ACP comparison will appear.", "Cuando Estimar consolide el reporte se mostrara la comparativa tradicional, Blueprint, ACP y ACP agentico.", "Quando Estimar consolidar o relatorio, a comparativa tradicional, Blueprint, ACP e ACP agentico aparecera.")}
        title={copy("Comparison not generated yet", "Comparativa todavia no generada", "Comparativa ainda nao gerada")}
      />
    );
  }

  return (
    <UxaSurface className="min-w-0 overflow-hidden">
      <div className="border-b border-[var(--uxa-color-border)] p-4">
        <UxaBadge tone="info">{copy("Commercial comparison", "Comparativa comercial", "Comparativa comercial")}</UxaBadge>
        <h2 className="mt-3 text-[20px] font-black">{copy("Construction approaches", "Enfoques de construccion", "Abordagens de construcao")}</h2>
        <p className="mt-2 text-[12.5px] leading-5 text-[var(--uxa-color-ink-soft)]">
          {copy("The goal is to show value without turning implementation gaps into artificial penalties for the Blueprint.", "El objetivo es mostrar valor sin convertir gaps de implementacion en castigos artificiales del Blueprint.", "O objetivo e mostrar valor sem converter gaps de implementacao em penalidades artificiais do Blueprint.")}
        </p>
        <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2 text-[12px] text-[var(--uxa-color-ink-soft)]">
          <UxaBadge tone="success">{copy("Recommended sweet spot", "Punto dulce recomendado", "Ponto ideal recomendado")}</UxaBadge>
          <span className="min-w-0 flex-1">{copy("ACP + agentic tools concentrates the highest automation and the clearest conversion value.", "ACP + herramientas agenticas concentra la mayor automatizacion y el valor comercial mas claro.", "ACP + ferramentas agenticas concentra a maior automacao e o valor comercial mais claro.")}</span>
          <UxaBadge tone="neutral">{currency}</UxaBadge>
          {currency === "COP" ? <span>TRM {Math.round(trm.trm_cop).toLocaleString("es-CO")}</span> : null}
        </div>
        <div className="mt-4 rounded-[18px] border border-[var(--uxa-color-border)] bg-[var(--uxa-color-muted-panel)] p-3 text-[11.5px] leading-[1.55] text-[var(--uxa-color-ink-soft)]">
          <div className="flex flex-col gap-2 md:flex-row md:items-start">
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[12px] bg-white text-[var(--uxa-color-primary)] shadow-sm">
              <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink)]">
                {copy("Estimation scope", "Alcance de la estimacion", "Escopo da estimativa")}
              </p>
              <p className="mt-1">
                {copy(
                  "These figures are directional estimates based on market standards and the information currently approved in the Blueprint. They can change if the project context, internal constraints, scope, rates, risks, or execution conditions change.",
                  "Estas cifras son estimaciones referenciales basadas en estandares de mercado y en la informacion aprobada actualmente en el Blueprint. Pueden cambiar si cambia el contexto del proyecto, restricciones internas, alcance, tarifas, riesgos o condiciones de ejecucion.",
                  "Estes valores sao estimativas referenciais baseadas em padroes de mercado e nas informacoes atualmente aprovadas no Blueprint. Podem mudar se o contexto do projeto, restricoes internas, escopo, tarifas, riscos ou condicoes de execucao mudarem.",
                )}
              </p>
              <p className="mt-2">
                {copy(
                  "The estimate covers only the construction work directly related to the AI agent. The implementation or modernization of external tools, APIs, MCP servers, legacy systems, credentials, data owners, security approvals, or third-party integrations is excluded because it depends on client-controlled environments and knowledge.",
                  "La estimacion contempla exclusivamente el trabajo de construccion del agente de IA. No incluye la implementacion o modernizacion de herramientas externas, APIs, servidores MCP, sistemas legacy, credenciales, owners de datos, aprobaciones de seguridad o integraciones de terceros, porque dependen de entornos y conocimiento controlados por el cliente.",
                  "A estimativa contempla exclusivamente o trabalho de construcao do agente de IA. Nao inclui implementacao ou modernizacao de ferramentas externas, APIs, servidores MCP, sistemas legados, credenciais, owners de dados, aprovacoes de seguranca ou integracoes de terceiros, pois dependem de ambientes e conhecimento controlados pelo cliente.",
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="min-w-0 overflow-hidden">
        <table className="w-full table-fixed text-left text-[12px]">
          <colgroup>
            <col className="w-[36%]" />
            <col className="w-[7%]" />
            <col className="w-[8%]" />
            <col className="w-[13%]" />
            <col className="w-[8%]" />
            <col className="w-[8%]" />
            <col className="w-[20%]" />
          </colgroup>
          <thead className="bg-[var(--uxa-color-muted-panel)] text-[10.5px] uppercase tracking-[0.14em] text-[var(--uxa-color-ink-muted)]">
            <tr>
              <th className="px-3 py-3">{copy("Scenario", "Escenario", "Cenario")}</th>
              <th className="px-2 py-3">{copy("Hours", "Horas", "Horas")}</th>
              <th className="px-2 py-3">{copy("Duration", "Duracion", "Duracao")}</th>
              <th className="px-2 py-3">{copy("Cost", "Costo", "Custo")}</th>
              <th className="px-2 py-3">{copy("Human", "Humano", "Humano")}</th>
              <th className="px-2 py-3">{copy("Savings", "Ahorro", "Economia")}</th>
              <th className="px-3 py-3">{copy("Next step", "Siguiente paso", "Proximo passo")}</th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map((scenario) => {
              const cta = ctaForScenario(scenario.scenario_key);
              const recommended = scenario.scenario_key === "acp_agentic";
              return (
                <tr
                  className={`border-t border-[var(--uxa-color-border)] align-top ${recommended ? "bg-[rgba(43,170,118,0.08)] shadow-[inset_4px_0_0_rgba(43,170,118,0.9)]" : ""}`}
                  key={scenario.scenario_key}
                >
                  <td className="min-w-0 px-3 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <UxaBadge tone={scenario.tone}>{scenario.label}</UxaBadge>
                      {recommended ? <UxaBadge tone="success">{copy("Recommended", "Opcion recomendada", "Opcao recomendada")}</UxaBadge> : null}
                    </div>
                    <p className="mt-2 text-[11.5px] leading-[1.55] text-[var(--uxa-color-ink-soft)]">{scenario.description}</p>
                  </td>
                  <td className="min-w-0 whitespace-normal px-2 py-3 font-black">{formatHours(scenario.estimated_hours_total)}</td>
                  <td className="min-w-0 whitespace-normal px-2 py-3">{formatWeeks(scenario.estimated_duration_weeks)}</td>
                  <td className="min-w-0 break-words px-2 py-3 font-semibold">{formatScenarioCost(scenario.estimated_cost, currency, trm.trm_cop)}</td>
                  <td className="min-w-0 whitespace-normal px-2 py-3">{formatPercent(scenario.human_intervention_percent)}</td>
                  <td className="min-w-0 whitespace-normal px-2 py-3">{formatPercent(scenario.effort_reduction_vs_traditional_percent)}</td>
                  <td className="min-w-0 px-3 py-3">
                    {cta ? (
                      <UxaButton
                        aria-label={cta.label}
                        className="uxa-button--wrap uxa-button--table-cta"
                        disabled={!cta.href || scenarioCtaBusy}
                        isLoading={scenarioCtaBusy}
                        onClick={() => {
                          if (!cta.href) {
                            return;
                          }
                          if (onScenarioCta) {
                            onScenarioCta(scenario.scenario_key);
                            return;
                          }
                          router.push(cta.href);
                        }}
                        size="sm"
                        title={cta.label}
                        variant={cta.variant ?? "secondary"}
                      >
                        <span className="uxa-button__clamped-label">{cta.label}</span>
                        <ArrowRight aria-hidden="true" className="ml-1 inline h-3.5 w-3.5 shrink-0" />
                      </UxaButton>
                    ) : (
                      <span className="text-[12px] text-[var(--uxa-color-ink-muted)]">{copy("Reference only", "Solo referencia", "Apenas referencia")}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </UxaSurface>
  );
}

export function EstimateStageView({ actionState, activeRoute, actions }: StageViewProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const { currency, setCurrency, trm } = useCurrency();
  const copy = (en: string, es: string, pt: string) => byLanguage(language, { en, es, pt });
  const snapshot = activeRoute?.snapshot.data ?? null;
  const report = snapshot?.estimation_report ?? null;
  const hifiScenarios = toHifiScenarios(getConstructionScenarios(snapshot));
  const summary = buildEstimateReadiness(activeRoute, language);
  const processing =
    actionState?.status === "submitting" ||
    hasActiveServerOperation(activeRoute, "estimate", ["generate_estimation_report"]);
  const preparingBlueprint = processing && actionState?.action === "prepare_blueprint_commercial_result";
  const shouldGenerate = !report || report.is_stale;
  const generateLabel = !report
    ? summary.nextLabel
    : copy("Regenerate estimate", "Regenerar estimacion", "Regenerar estimativa");
  const sessionId = activeRoute?.route.sessionId ?? "";
  const hasBlueprintProAccess = hasBlueprintProEntitlement(activeRoute?.snapshot.data ?? null);
  const secondaryHref = hasBlueprintProAccess ? `/projects/${sessionId}/blueprint/pro` : `/projects/${sessionId}/blueprint`;
  const secondaryLabel = hasBlueprintProAccess
    ? copy("Open Blueprint Pro", "Abrir Blueprint Pro", "Abrir Blueprint Pro")
    : copy("Open Blueprint", "Abrir Blueprint", "Abrir Blueprint");

  async function handleGenerate() {
    if (!actions || processing) {
      return;
    }

    await actions.generateEstimationReport();
  }

  async function handleViewBlueprintResult() {
    if (!actions || processing) {
      return;
    }

    await actions.prepareBlueprintCommercialResult();
    router.push(summary.nextHref);
  }

  async function handleScenarioCta(scenarioKey: string) {
    if (processing) {
      return;
    }

    if (scenarioKey === "blueprint_basic") {
      await handleViewBlueprintResult();
      return;
    }

    if (!activeRoute?.route.sessionId) {
      return;
    }

    if (scenarioKey === "blueprint_premium" || scenarioKey === "agentic_blueprint") {
      router.push(getProductExperienceProductHref(activeRoute.route.sessionId, "blueprint_pro"));
      return;
    }

    if (scenarioKey === "acp_manual" || scenarioKey === "acp_agentic") {
      router.push(getProductExperienceProductHref(activeRoute.route.sessionId, "acp"));
      return;
    }

    if (scenarioKey === "factory") {
      router.push(getProductExperienceProductHref(activeRoute.route.sessionId, "attention"));
    }
  }

  return (
    <div className="space-y-5">
      {!report ? (
        <>
          <ReadinessHero icon={<Gauge aria-hidden="true" className="h-6 w-6" />} summary={summary} title={copy("Estimate value, cost, and ROI", "Estimar valor, costo y ROI", "Estimar valor, custo e ROI")} />
          <MetricGrid metrics={summary.metrics} />
        </>
      ) : null}
      {report ? (
        <EstimateRoiHifiMockup
          currency={currency}
          embedded
          isStale={report.is_stale}
          onCurrencyChange={setCurrency}
          onRefresh={() => void handleGenerate()}
          onScenarioCta={(scenarioKey) => void handleScenarioCta(scenarioKey)}
          scenarioCtaBusy={preparingBlueprint}
          scenarios={hifiScenarios}
          trm={trm.trm_cop}
        />
      ) : (
        <ScenarioComparison
          activeRoute={activeRoute}
          onScenarioCta={(scenarioKey) => void handleScenarioCta(scenarioKey)}
          scenarioCtaBusy={preparingBlueprint}
        />
      )}
      <UxaStickyActionBar label={copy("Estimate actions", "Acciones de Estimar", "Acoes de Estimar")}>
        <a className="uxa-button uxa-button--secondary" href={secondaryHref}>
          <span>{secondaryLabel}</span>
        </a>
        {shouldGenerate ? (
          <UxaButton disabled={!actions || processing} isLoading={processing} onClick={() => void handleGenerate()} variant="primary">
            <span>{generateLabel}</span>
          </UxaButton>
        ) : (
          <UxaButton
            disabled={!actions || processing}
            isLoading={preparingBlueprint}
            onClick={() => void handleViewBlueprintResult()}
            variant="primary"
          >
            <span>{summary.nextLabel}</span>
          </UxaButton>
        )}
      </UxaStickyActionBar>
    </div>
  );
}

export function ValidateStageView({ activeRoute }: StageViewProps) {
  const { language } = useLanguage();
  const copy = (en: string, es: string, pt: string) => byLanguage(language, { en, es, pt });
  const sessionId = activeRoute?.route.sessionId ?? "";
  const snapshot = activeRoute?.snapshot.data ?? null;
  const summary = buildValidationReadiness(activeRoute, language);
  const dataset = snapshot?.evaluation_dataset ?? null;
  const rubric = snapshot?.evaluation_rubric ?? null;
  const runs = snapshot?.evaluation_runs ?? [];
  const simulations = snapshot?.simulation_runs ?? [];

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shouldGenerate = !dataset || dataset.cases.length === 0;
  const shouldEvaluate = !shouldGenerate && runs.length === 0 && simulations.length === 0;

  async function handleValidateAction() {
    if (!sessionId || processing) return;
    setProcessing(true);
    setError(null);
    try {
      if (shouldGenerate) {
        await sessionsApi.generateValidationScenarios(sessionId);
      } else {
        await sessionsApi.evaluateBlueprint(sessionId);
      }
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-5">
      <ReadinessHero icon={<ShieldCheck aria-hidden="true" className="h-6 w-6" />} summary={summary} title={copy("Validate Blueprint before ACP", "Validar Blueprint antes del ACP", "Validar Blueprint antes do ACP")} />
      {error && (
        <div className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-state-danger)] bg-[var(--uxa-state-danger-bg)] p-4 text-[13px] text-[var(--uxa-color-ink)]">
          <p className="font-black">{copy("Validation error", "Error de validación", "Erro de validação")}</p>
          <p className="mt-1">{error}</p>
        </div>
      )}
      <MetricGrid metrics={summary.metrics} />
      <div className="grid gap-5 xl:grid-cols-[1fr_0.85fr]">
        <UxaSurface className="p-[var(--uxa-panel-padding-lg)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <UxaBadge tone={dataset ? "success" : "warning"}>Test Suite</UxaBadge>
              <h2 className="mt-3 text-[20px] font-black">{copy("Representative cases", "Casos representativos", "Casos representativos")}</h2>
              <p className="mt-2 text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">
                {copy("Each case must link expected behavior, sources, tools, and memory before packaging.", "Cada caso debe enlazar comportamiento esperado, fuentes, tools y memoria antes de empaquetar.", "Cada caso deve vincular comportamento esperado, fontes, tools e memoria antes de empacotar.")}
              </p>
            </div>
            <UxaBadge tone="neutral">{dataset?.version_number ? `v${dataset.version_number}` : copy("No version", "Sin version", "Sem versao")}</UxaBadge>
          </div>
          <div className="mt-5 grid gap-3">
            {(dataset?.cases ?? []).slice(0, 5).map((testCase) => (
              <article className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] p-4" key={testCase.case_key}>
                <div className="flex flex-wrap items-center gap-2">
                  <UxaBadge tone={testCase.priority === "high" ? "danger" : testCase.priority === "medium" ? "warning" : "info"}>{testCase.priority}</UxaBadge>
                  <UxaBadge tone={testCase.is_active ? "success" : "neutral"}>{testCase.category}</UxaBadge>
                </div>
                <h3 className="mt-3 text-[14px] font-black">{testCase.title}</h3>
                <p className="mt-2 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">{testCase.scenario}</p>
              </article>
            ))}
            {dataset?.cases.length ? null : (
              <p className="rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] p-4 text-[13px] text-[var(--uxa-color-ink-soft)]">
                {copy("There are no persisted Test Suite cases yet.", "Aun no hay casos persistidos para el Test Suite.", "Ainda nao ha casos persistidos para o Test Suite.")}
              </p>
            )}
          </div>
        </UxaSurface>
        <UxaSurface className="p-[var(--uxa-panel-padding-lg)]">
          <UxaBadge tone={rubric ? "success" : "warning"}>Quality gates</UxaBadge>
          <h2 className="mt-3 text-[20px] font-black">{copy("Rubric and simulations", "Rubrica y simulaciones", "Rubrica e simulacoes")}</h2>
          <div className="mt-5 space-y-3">
            {(rubric?.dimensions ?? []).slice(0, 5).map((dimension) => (
              <div className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] p-4" key={dimension.key}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[13px] font-black">{dimension.label}</p>
                  <UxaBadge tone={dimension.hard_block ? "danger" : "info"}>{dimension.weight}%</UxaBadge>
                </div>
                <p className="mt-2 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">{dimension.description}</p>
              </div>
            ))}
            {simulations.slice(0, 3).map((simulation) => (
              <div className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] p-4" key={simulation.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <UxaBadge tone={toneForStatus(simulation.final_status)}>{simulation.final_status}</UxaBadge>
                  <UxaBadge tone={simulation.is_stale ? "warning" : "success"}>{simulation.execution_state}</UxaBadge>
                </div>
                <p className="mt-3 text-[13px] font-black">{simulation.scenario_title}</p>
                <p className="mt-2 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">{simulation.summary}</p>
              </div>
            ))}
          </div>
        </UxaSurface>
      </div>
      <UxaSurface className="p-[var(--uxa-panel-padding-lg)]">
        <UxaBadge tone={runs.length ? "success" : "neutral"}>{copy("Validation runs", "Runs de validacion", "Execucoes de validacao")}</UxaBadge>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {runs.slice(0, 4).map((run) => (
            <article className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] p-4" key={run.id}>
              <div className="flex items-center justify-between gap-3">
                <UxaBadge tone={toneForStatus(run.status)}>{run.status}</UxaBadge>
                <span className="text-[12px] font-black">{formatPercent(run.overall_score)}</span>
              </div>
              <p className="mt-3 text-[13px] font-black">{run.summary}</p>
              <p className="mt-2 text-[12px] text-[var(--uxa-color-ink-soft)]">
                {run.blocking_issues.length ? `${run.blocking_issues.length} ${copy("blockers", "bloqueos", "bloqueios")}` : copy("No declared blockers", "Sin bloqueos declarados", "Sem bloqueios declarados")}
              </p>
            </article>
          ))}
          {runs.length ? null : (
            <p className="rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] p-4 text-[13px] text-[var(--uxa-color-ink-soft)]">
              {copy("There are no validation executions registered yet.", "Todavia no hay ejecuciones de validacion registradas.", "Ainda nao ha execucoes de validacao registradas.")}
            </p>
          )}
        </div>
      </UxaSurface>
      <UxaStickyActionBar label={copy("Validate actions", "Acciones de Validar", "Acoes de Validar")}>
        <a className="uxa-button uxa-button--secondary" href={`/projects/${sessionId}/diagrams`}>
          <span>{copy("View diagrams", "Ver diagramas", "Ver diagramas")}</span>
        </a>
        {shouldGenerate || shouldEvaluate ? (
          <UxaButton
            disabled={processing}
            isLoading={processing}
            onClick={() => void handleValidateAction()}
            variant="primary"
          >
            <span>
              {shouldGenerate
                ? copy("Generate Test Suite", "Generar Test Suite", "Gerar Test Suite")
                : copy("Run validation", "Ejecutar validación", "Executar validação")}
            </span>
          </UxaButton>
        ) : (
          <a className="uxa-button uxa-button--primary" href={summary.nextHref}>
            <span>{summary.nextLabel}</span>
          </a>
        )}
      </UxaStickyActionBar>
    </div>
  );
}

export function PackageStageView({ activeRoute }: StageViewProps) {
  const { language } = useLanguage();
  const copy = (en: string, es: string, pt: string) => byLanguage(language, { en, es, pt });
  const sessionId = activeRoute?.route.sessionId ?? "";
  const packageSummary = buildProductSaasViewModel({ activeRoute, language, section: "acp" });
  const artifacts = packageSummary.artifactCards;
  const access = packageSummary.access;
  const canBuild = Boolean(access?.can_build_acp || packageSummary.accessTier === "acp");
  const summary = packageSummary.package;

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGeneratePackage() {
    if (!sessionId || generating) return;
    setGenerating(true);
    setError(null);
    try {
      await sessionsApi.generateAcp(sessionId);
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-5">
      <ReadinessHero
        icon={<PackageCheck aria-hidden="true" className="h-6 w-6" />}
        summary={{
          ...summary,
          detail: canBuild
            ? copy(
                "ACP can be prepared as a portable package with contracts, instructions, questions, and artifacts.",
                "El ACP puede prepararse como paquete portable con contratos, instrucciones, preguntas y artefactos.",
                "O ACP pode ser preparado como pacote portavel com contratos, instrucoes, perguntas e artefatos.",
              )
            : copy(
                "The user can review ACP value, but construction and download require purchasing the package.",
                "El usuario puede revisar el valor del ACP, pero la construccion/descarga requiere adquirir el paquete.",
                "O usuario pode revisar o valor do ACP, mas construcao e download exigem a aquisicao do pacote.",
              ),
          nextHref: `/projects/${sessionId}/acp`,
          nextLabel: canBuild
            ? copy("Open ACP", "Abrir ACP", "Abrir ACP")
            : copy("View ACP invitation", "Ver invitacion ACP", "Ver convite ACP"),
          stateLabel: canBuild
            ? copy("ACP entitlement", "Entitlement ACP", "Entitlement ACP")
            : copy("ACP upsell", "Upsell ACP", "Upsell ACP"),
          tone: canBuild ? "success" : "warning",
        }}
        title={copy("Portable and decoupled package", "Package portable y desacoplado", "Package portavel e desacoplado")}
      />
      {error && (
        <div className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-state-danger)] bg-[var(--uxa-state-danger-bg)] p-4 text-[13px] text-[var(--uxa-color-ink)]">
          <p className="font-black">{copy("Generation error", "Error de generación", "Erro de geração")}</p>
          <p className="mt-1">{error}</p>
        </div>
      )}
      <MetricGrid metrics={summary.metrics} />
      <div className="grid gap-5 xl:grid-cols-[1fr_0.85fr]">
        <UxaSurface className="p-[var(--uxa-panel-padding-lg)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <UxaBadge tone={canBuild ? "success" : "warning"}>ACP</UxaBadge>
              <h2 className="mt-3 text-[20px] font-black">
                {copy("Construction package", "Paquete de construccion", "Pacote de construcao")}
              </h2>
              <p className="mt-2 text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">
                {copy(
                  "ACP does not execute implementation by itself: it delivers a portable specification, structured questions, and guides for agentic tools.",
                  "El ACP no ejecuta implementacion por si solo: entrega especificacion portable, preguntas estructuradas y guias para herramientas agenticas.",
                  "O ACP nao executa a implementacao sozinho: ele entrega especificacao portavel, perguntas estruturadas e guias para ferramentas agenticas.",
                )}
              </p>
            </div>
            <FileArchive aria-hidden="true" className="h-6 w-6 text-[var(--uxa-color-brand)]" />
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {[
              copy(
                "Portable manifest without mandatory internal IDs",
                "Manifest portable sin IDs internos obligatorios",
                "Manifest portavel sem IDs internos obrigatorios",
              ),
              copy(
                "Implementation questions with options and context",
                "Preguntas de implementacion con opciones y contexto",
                "Perguntas de implementacao com opcoes e contexto",
              ),
              copy(
                "Reusable tool and memory contracts",
                "Contratos de herramientas y memoria reutilizables",
                "Contratos reutilizaveis de ferramentas e memoria",
              ),
              copy(
                "Bootstrap guide for IDE or agentic tool",
                "Guia de arranque para IDE/herramienta agentica",
                "Guia de arranque para IDE/ferramenta agentica",
              ),
            ].map((item) => (
              <div className="flex items-start gap-3 rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] p-4" key={item}>
                <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[var(--uxa-state-success)]" />
                <p className="text-[13px] leading-5 text-[var(--uxa-color-ink-soft)]">{item}</p>
              </div>
            ))}
          </div>
        </UxaSurface>
        <UxaSurface className="p-[var(--uxa-panel-padding-lg)]">
          <UxaBadge tone={artifacts.length ? "success" : "warning"}>
            {copy("Artifacts", "Artefactos", "Artefatos")}
          </UxaBadge>
          <h2 className="mt-3 text-[20px] font-black">
            {copy("Available technical output", "Salida tecnica disponible", "Saida tecnica disponivel")}
          </h2>
          <div className="mt-5 space-y-3">
            {artifacts.slice(0, 6).map((artifact) => (
              <article className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] p-4" key={artifact.key}>
                <div className="flex flex-wrap items-center gap-2">
                  <UxaBadge tone="info">{artifact.stage}</UxaBadge>
                  <UxaBadge tone="neutral">{artifact.exportFormat}</UxaBadge>
                </div>
                <h3 className="mt-3 text-[13px] font-black">{artifact.label}</h3>
                <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">{artifact.detail}</p>
              </article>
            ))}
            {artifacts.length ? null : (
              <p className="rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] p-4 text-[13px] text-[var(--uxa-color-ink-soft)]">
                {copy(
                  "There are no exportable technical artifacts for ACP yet.",
                  "Aun no hay artefactos tecnicos exportables para el ACP.",
                  "Ainda nao ha artefatos tecnicos exportaveis para o ACP.",
                )}
              </p>
            )}
          </div>
        </UxaSurface>
      </div>
      <UxaStickyActionBar label={copy("Package actions", "Acciones de Package", "Acoes de Package")}>
        <a className="uxa-button uxa-button--secondary" href={`/projects/${sessionId}/attention`}>
          <span>{copy("Resolve pending items", "Resolver pendientes", "Resolver pendencias")}</span>
        </a>
        {canBuild ? (
          <>
            <UxaButton
              disabled={generating}
              isLoading={generating}
              onClick={() => void handleGeneratePackage()}
              variant="secondary"
            >
              <span>{copy("Generate ACP package", "Generar paquete ACP", "Gerar pacote ACP")}</span>
            </UxaButton>
            <a className="uxa-button uxa-button--primary" href={`/projects/${sessionId}/acp`}>
              <span>{copy("Open ACP", "Abrir ACP", "Abrir ACP")}</span>
            </a>
          </>
        ) : (
          <a className="uxa-button uxa-button--primary" href={`/projects/${sessionId}/acp`}>
            <span>{copy("Explore ACP", "Conocer ACP", "Conhecer ACP")}</span>
          </a>
        )}
      </UxaStickyActionBar>
    </div>
  );
}
