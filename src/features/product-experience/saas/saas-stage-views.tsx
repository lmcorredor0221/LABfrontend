"use client";

import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, FileArchive, Gauge, PackageCheck, ShieldCheck } from "lucide-react";
import {
  UxaBadge,
  UxaEmptyState,
  UxaMetricCard,
  UxaPageState,
  UxaProcessingStrip,
  UxaStickyActionBar,
  UxaSurface,
} from "@/features/product-experience/design-system";
import type { ProductExperienceRouteSnapshot } from "@/features/product-experience/core/server-state";
import {
  buildEstimateReadiness,
  buildProductSaasViewModel,
  buildValidationReadiness,
  formatHours,
  formatMoney,
  formatPercent,
  formatWeeks,
  getConstructionScenarios,
  type ProductMetric,
  type ProductReadinessSummary,
  type SaasTone,
} from "@/features/product-experience/saas/saas-product-model";
import { byLanguage } from "@/features/product-experience/core/localized-copy";
import { useLanguage } from "@/core/i18n/language-context";

type StageViewProps = {
  activeRoute: ProductExperienceRouteSnapshot | null;
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

function ScenarioComparison({ activeRoute }: StageViewProps) {
  const { language } = useLanguage();
  const copy = (en: string, es: string, pt: string) => byLanguage(language, { en, es, pt });
  const snapshot = activeRoute?.snapshot.data ?? null;
  const scenarios = getConstructionScenarios(snapshot);

  if (!scenarios.length) {
    return (
      <EmptyOperationalState
        description={copy("When Estimate consolidates the report, the traditional, Blueprint, ACP, and agentic ACP comparison will appear.", "Cuando Estimar consolide el reporte se mostrara la comparativa tradicional, Blueprint, ACP y ACP agentico.", "Quando Estimar consolidar o relatorio, a comparativa tradicional, Blueprint, ACP e ACP agentico aparecera.")}
        title={copy("Comparison not generated yet", "Comparativa todavia no generada", "Comparativa ainda nao gerada")}
      />
    );
  }

  return (
    <UxaSurface className="overflow-hidden">
      <div className="border-b border-[var(--uxa-color-border)] p-[var(--uxa-panel-padding-lg)]">
        <UxaBadge tone="info">{copy("Commercial comparison", "Comparativa comercial", "Comparativa comercial")}</UxaBadge>
        <h2 className="mt-3 text-[20px] font-black">{copy("Construction approaches", "Enfoques de construccion", "Abordagens de construcao")}</h2>
        <p className="mt-2 text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">
          {copy("The goal is to show value without turning implementation gaps into artificial penalties for the Blueprint.", "El objetivo es mostrar valor sin convertir gaps de implementacion en castigos artificiales del Blueprint.", "O objetivo e mostrar valor sem converter gaps de implementacao em penalidades artificiais do Blueprint.")}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-[13px]">
          <thead className="bg-[var(--uxa-color-muted-panel)] text-[11px] uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)]">
            <tr>
              <th className="px-5 py-3">{copy("Scenario", "Escenario", "Cenario")}</th>
              <th className="px-5 py-3">{copy("Hours", "Horas", "Horas")}</th>
              <th className="px-5 py-3">{copy("Duration", "Duracion", "Duracao")}</th>
              <th className="px-5 py-3">{copy("Cost", "Costo", "Custo")}</th>
              <th className="px-5 py-3">{copy("Human", "Humano", "Humano")}</th>
              <th className="px-5 py-3">{copy("Savings", "Ahorro", "Economia")}</th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map((scenario) => (
              <tr className="border-t border-[var(--uxa-color-border)]" key={scenario.scenario_key}>
                <td className="px-5 py-[var(--uxa-panel-padding)]">
                  <div className="flex items-center gap-2">
                    <UxaBadge tone={scenario.tone}>{scenario.label}</UxaBadge>
                  </div>
                  <p className="mt-2 max-w-md text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">{scenario.description}</p>
                </td>
                <td className="px-5 py-[var(--uxa-panel-padding)] font-black">{formatHours(scenario.estimated_hours_total)}</td>
                <td className="px-5 py-[var(--uxa-panel-padding)]">{formatWeeks(scenario.estimated_duration_weeks)}</td>
                <td className="px-5 py-[var(--uxa-panel-padding)]">{formatMoney(scenario.estimated_cost)}</td>
                <td className="px-5 py-[var(--uxa-panel-padding)]">{formatPercent(scenario.human_intervention_percent)}</td>
                <td className="px-5 py-[var(--uxa-panel-padding)]">{formatPercent(scenario.effort_reduction_vs_traditional_percent)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </UxaSurface>
  );
}

export function EstimateStageView({ activeRoute }: StageViewProps) {
  const { language } = useLanguage();
  const copy = (en: string, es: string, pt: string) => byLanguage(language, { en, es, pt });
  const snapshot = activeRoute?.snapshot.data ?? null;
  const report = snapshot?.estimation_report ?? null;
  const summary = buildEstimateReadiness(activeRoute, language);

  return (
    <div className="space-y-5">
      <ReadinessHero icon={<Gauge aria-hidden="true" className="h-6 w-6" />} summary={summary} title={copy("Estimate value, cost, and ROI", "Estimar valor, costo y ROI", "Estimar valor, custo e ROI")} />
      <MetricGrid metrics={summary.metrics} />
      {report ? (
        <UxaSurface className="p-[var(--uxa-panel-padding-lg)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <UxaBadge tone={report.is_stale ? "warning" : "success"}>{report.confidence.label}</UxaBadge>
              <h2 className="mt-3 text-[20px] font-black">{copy("Confidence with controlled residual uncertainty", "Confianza con incertidumbre residual controlada", "Confianca com incerteza residual controlada")}</h2>
              <p className="mt-2 text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">
                {copy("Design and implementation questions are separated so they do not penalize the commercial value of the Blueprint.", "Preguntas de diseno e implementacion se separan para no penalizar el valor comercial del Blueprint.", "Perguntas de desenho e implementacao sao separadas para nao penalizar o valor comercial do Blueprint.")}
              </p>
            </div>
            <div className="w-full max-w-xs">
              <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)]">
                <span>{copy("Score", "Score", "Score")}</span>
                <span>{formatPercent(report.confidence.score)}</span>
              </div>
              <UxaProcessingStrip label={copy("Estimation confidence", "Confianza de estimacion", "Confianca da estimativa")} value={report.confidence.score} />
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <UxaSurface className="p-4" muted>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)]">{copy("Design gaps", "GAPs de diseno", "Gaps de desenho")}</p>
              <p className="mt-2 text-[22px] font-black">{report.confidence.design_gap_count ?? 0}</p>
            </UxaSurface>
            <UxaSurface className="p-4" muted>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)]">{copy("Implementation gaps", "GAPs implementacion", "Gaps de implementacao")}</p>
              <p className="mt-2 text-[22px] font-black">{report.confidence.implementation_gap_count ?? 0}</p>
            </UxaSurface>
            <UxaSurface className="p-4" muted>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)]">{copy("Residual band", "Banda residual", "Banda residual")}</p>
              <p className="mt-2 text-[22px] font-black">{formatPercent(report.confidence.uncertainty_band_percent)}</p>
            </UxaSurface>
          </div>
        </UxaSurface>
      ) : null}
      <ScenarioComparison activeRoute={activeRoute} />
      <UxaStickyActionBar label={copy("Estimate actions", "Acciones de Estimar", "Acoes de Estimar")}>
        <a className="uxa-button uxa-button--secondary" href={`/projects/${activeRoute?.route.sessionId ?? ""}/work/validate`}>
          <span>{copy("Prepare ACP", "Preparar ACP", "Preparar ACP")}</span>
        </a>
        <a className="uxa-button uxa-button--primary" href={summary.nextHref}>
          <span>{summary.nextLabel}</span>
        </a>
      </UxaStickyActionBar>
    </div>
  );
}

export function ValidateStageView({ activeRoute }: StageViewProps) {
  const { language } = useLanguage();
  const copy = (en: string, es: string, pt: string) => byLanguage(language, { en, es, pt });
  const snapshot = activeRoute?.snapshot.data ?? null;
  const summary = buildValidationReadiness(activeRoute, language);
  const dataset = snapshot?.evaluation_dataset ?? null;
  const rubric = snapshot?.evaluation_rubric ?? null;
  const runs = snapshot?.evaluation_runs ?? [];
  const simulations = snapshot?.simulation_runs ?? [];

  return (
    <div className="space-y-5">
      <ReadinessHero icon={<ShieldCheck aria-hidden="true" className="h-6 w-6" />} summary={summary} title={copy("Validate Blueprint before ACP", "Validar Blueprint antes del ACP", "Validar Blueprint antes do ACP")} />
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
        <a className="uxa-button uxa-button--secondary" href={`/projects/${activeRoute?.route.sessionId ?? ""}/diagrams`}>
          <span>{copy("View diagrams", "Ver diagramas", "Ver diagramas")}</span>
        </a>
        <a className="uxa-button uxa-button--primary" href={summary.nextHref}>
          <span>{summary.nextLabel}</span>
        </a>
      </UxaStickyActionBar>
    </div>
  );
}

export function PackageStageView({ activeRoute }: StageViewProps) {
  const { language } = useLanguage();
  const copy = (en: string, es: string, pt: string) => byLanguage(language, { en, es, pt });
  const packageSummary = buildProductSaasViewModel({ activeRoute, language, section: "acp" });
  const artifacts = packageSummary.artifactCards;
  const access = packageSummary.access;
  const canBuild = Boolean(access?.can_build_acp || packageSummary.accessTier === "acp");
  const summary = packageSummary.package;

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
          nextHref: `/projects/${activeRoute?.route.sessionId ?? ""}/acp`,
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
        <a className="uxa-button uxa-button--secondary" href={`/projects/${activeRoute?.route.sessionId ?? ""}/attention`}>
          <span>{copy("Resolve pending items", "Resolver pendientes", "Resolver pendencias")}</span>
        </a>
        <a className="uxa-button uxa-button--primary" href={`/projects/${activeRoute?.route.sessionId ?? ""}/acp`}>
          <span>{canBuild ? copy("Open ACP", "Abrir ACP", "Abrir ACP") : copy("Explore ACP", "Conocer ACP", "Conhecer ACP")}</span>
        </a>
      </UxaStickyActionBar>
    </div>
  );
}
