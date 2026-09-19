"use client";

import {
  ArrowLeft,
  Boxes,
  CheckCircle2,
  FileQuestion,
  Gauge,
  GitBranch,
  Lock,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  TestTube2,
  Workflow,
} from "lucide-react";
import { AppButton, Badge, KeyValue, Panel, ProgressBar, SimpleTable } from "@/components/lean/ui";
import { formatCurrency } from "@/features/operations/operations-adapter";
import type { AcpGateState, AcpInvitationMetrics } from "@/features/acp/acp-invitation-adapter";
import { useCurrency } from "@/core/commerce/currency-context";
import { useLanguage } from "@/core/i18n/language-context";
import { byLanguage } from "@/features/product-experience/core/localized-copy";
import { getProductPricingDisplay } from "@/features/product-experience/core/pricing-display";

type AcpInvitationActionState = "idle" | "submitting" | "error";

function getValueBlocks(language: "en" | "es" | "pt") {
  return [
    {
      icon: ShieldCheck,
      title: byLanguage(language, { en: "Blueprint Validation", es: "Validación del Blueprint", pt: "Validação do Blueprint" }),
      text: byLanguage(language, {
        en: "Turns the design into verifiable scenarios, gates, and criteria before building.",
        es: "Convierte el diseño en escenarios, gates y criterios verificables antes de construir.",
        pt: "Transforma o desenho em cenários, gates e critérios verificáveis antes de construir.",
      }),
    },
    {
      icon: TestTube2,
      title: "Test Suite",
      text: byLanguage(language, {
        en: "Defines test cases, rubrics, and evaluation assets to reduce regressions during implementation.",
        es: "Define casos, rúbricas y assets de evaluación para reducir regresiones durante implementación.",
        pt: "Define casos, rubricas e ativos de avaliação para reduzir regressões durante a implementação.",
      }),
    },
    {
      icon: FileQuestion,
      title: byLanguage(language, { en: "GAPs & Key Questions", es: "GAPs y preguntas", pt: "GAPs e perguntas" }),
      text: byLanguage(language, {
        en: "Identifies deferrable decisions, owners, impact, and options to resolve them at the right moment.",
        es: "Identifica decisiones diferibles, owners, impacto y opciones para resolverlas en el momento correcto.",
        pt: "Identifica decisões que podem ser postergadas, responsáveis, impacto e opções para resolvê-las no momento certo.",
      }),
    },
    {
      icon: PackageCheck,
      title: byLanguage(language, { en: "Portable Package", es: "Paquete portable", pt: "Pacote portátil" }),
      text: byLanguage(language, {
        en: "Delivers prompts, contracts, memory, tools, and instructions ready for dev teams or agentic tooling.",
        es: "Entrega prompts, contratos, memoria, herramientas e instrucciones listas para equipos o tooling agéntico.",
        pt: "Entrega prompts, contratos, memória, ferramentas e instruções prontas para equipes ou ferramentas agênticas.",
      }),
    },
  ];
}

function getProblemBlocks(language: "en" | "es" | "pt") {
  return [
    byLanguage(language, {
      en: "Avoids re-interpreting the Blueprint when development starts.",
      es: "Evita reinterpretar el Blueprint cuando empieza la construcción.",
      pt: "Evita reinterpretar o Blueprint quando a construção começa.",
    }),
    byLanguage(language, {
      en: "Narrows open questions down to truly environment-dependent decisions.",
      es: "Reduce preguntas abiertas a decisiones realmente dependientes del entorno.",
      pt: "Reduz perguntas abertas a decisões realmente dependentes do ambiente.",
    }),
    byLanguage(language, {
      en: "Turns architecture, memory, and tools into actionable technical assets.",
      es: "Convierte arquitectura, memoria y herramientas en artefactos técnicos accionables.",
      pt: "Transforma arquitetura, memória e ferramentas em artefatos técnicos acionáveis.",
    }),
    byLanguage(language, {
      en: "Runs with Codex, Cursor, Claude Code, GitHub Copilot, and other agentic dev environments.",
      es: "Permite ejecutar el paquete con Codex, Cursor, Claude Code, GitHub Copilot u otros asistentes.",
      pt: "Permite executar o pacote com Codex, Cursor, Claude Code, GitHub Copilot ou outros assistentes.",
    }),
  ];
}

function formatHours(value: number) {
  return `${value.toFixed(1)} h`;
}

function formatWeeks(value: number, language: "en" | "es" | "pt" = "es") {
  const unit = byLanguage(language, { en: "wks", es: "sem", pt: "sem" });
  return `${value.toFixed(1)} ${unit}`;
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function gateBadge(gateState: AcpGateState, language: "en" | "es" | "pt") {
  if (gateState === "unlocked") {
    return <Badge tone="green">{byLanguage(language, { en: "ACP enabled", es: "ACP habilitado", pt: "ACP habilitado" })}</Badge>;
  }
  if (gateState === "permission_required") {
    return <Badge tone="orange">{byLanguage(language, { en: "Permission required", es: "Permiso requerido", pt: "Permissão necessária" })}</Badge>;
  }
  return <Badge tone="violet">{byLanguage(language, { en: "Upgrade available", es: "Upgrade disponible", pt: "Upgrade disponível" })}</Badge>;
}

export function AcpInvitationPanel({
  actionState,
  gateState,
  metrics,
  onAcquireAcp,
  onReturnToBlueprint,
  upgradeMessage,
}: {
  actionState: AcpInvitationActionState;
  gateState: AcpGateState;
  metrics: AcpInvitationMetrics;
  onAcquireAcp: () => void;
  onReturnToBlueprint: () => void;
  upgradeMessage?: string | null;
}) {
  const { language } = useLanguage();
  const canAcquire = gateState === "purchase_required";
  const isPermissionBlocked = gateState === "permission_required";
  const { currency, formatPrice, basePrices, trm } = useCurrency();
  const acpPricing = getProductPricingDisplay({
    usdAmount: basePrices.acp_premium_usd,
    currency,
    trmCop: trm.trm_cop,
    formatPrice,
  });

  const valueBlocks = getValueBlocks(language);
  const problemBlocks = getProblemBlocks(language);

  return (
    <div className="space-y-5">
      <Panel className="overflow-hidden p-0">
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="relative overflow-hidden bg-[radial-gradient(circle_at_12%_14%,rgba(124,58,237,0.22),transparent_30%),radial-gradient(circle_at_78%_8%,rgba(20,184,166,0.16),transparent_26%),linear-gradient(135deg,#0b1220_0%,#17213b_52%,#241743_100%)] p-8 text-white">
            <div className="absolute inset-x-10 bottom-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="violet">
                {byLanguage(language, {
                  en: "03 · PREPARE — Ready to build",
                  es: "03 · PREPARA — Listo para construir",
                  pt: "03 · PREPARE — Pronto para construir",
                })}
              </Badge>
              {gateBadge(gateState, language)}
              <Badge tone="green">
                {byLanguage(language, {
                  en: "Blueprint preserved",
                  es: "Blueprint preservado",
                  pt: "Blueprint preservado",
                })}
              </Badge>
            </div>
            <div className="mt-8 max-w-4xl">
              <p className="text-[44px] font-semibold leading-tight">
                {byLanguage(language, {
                  en: "ACP turns the Blueprint into an execution-ready construction package.",
                  es: "El ACP convierte el Blueprint en un paquete de construcción.",
                  pt: "O ACP transforma o Blueprint em um pacote de construção.",
                })}
              </p>
              <p className="mt-4 max-w-3xl text-[15px] leading-7 text-white/74">
                {byLanguage(language, {
                  en: "The Blueprint explains what must be built. The Agent Construction Package defines how to begin implementation: tests, gaps, open questions, prompts, contracts, memory, tools, and portable artifacts ready for dev teams or agentic tools (Cursor, Claude Code, Codex).",
                  es: "El Blueprint explica qué se debe construir. El Agent Construction Package define cómo arrancar la implementación: pruebas, gaps, preguntas, prompts, contratos, memoria, herramientas y artefactos portables para trabajar con equipos humanos o herramientas agénticas (Cursor, Claude Code, Codex).",
                  pt: "O Blueprint explica o que deve ser construído. O Agent Construction Package define como iniciar a implementação: testes, gaps, perguntas, prompts, contratos, memória, ferramentas e artefatos portáteis para trabalhar com equipes humanas ou ferramentas agênticas (Cursor, Claude Code, Codex).",
                })}
              </p>
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-4">
              <div className="rounded-[22px] border border-white/10 bg-white/8 p-4 backdrop-blur">
                <p className="text-[12px] text-white/58">
                  {byLanguage(language, { en: "Additional savings", es: "Ahorro adicional", pt: "Economia adicional" })}
                </p>
                <p className="mt-2 text-[28px] font-semibold">{formatPercent(metrics.additionalCostSavingsPercent)}</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/8 p-4 backdrop-blur">
                <p className="text-[12px] text-white/58">
                  {byLanguage(language, { en: "Effort reduction", es: "Menos esfuerzo", pt: "Menos esforço" })}
                </p>
                <p className="mt-2 text-[28px] font-semibold">{formatPercent(metrics.additionalEffortReductionPercent)}</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/8 p-4 backdrop-blur">
                <p className="text-[12px] text-white/58">
                  {byLanguage(language, { en: "Risk reduced", es: "Riesgo reducido", pt: "Risco reduzido" })}
                </p>
                <p className="mt-2 text-[28px] font-semibold">{formatPercent(metrics.riskReductionPercent)}</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/8 p-4 backdrop-blur">
                <p className="text-[12px] text-white/58">
                  {byLanguage(language, { en: "Human intervention", es: "Intervención humana", pt: "Intervenção humana" })}
                </p>
                <p className="mt-2 text-[28px] font-semibold">
                  -{formatPercent(metrics.humanInterventionReductionPercent)}
                </p>
              </div>
            </div>

            {upgradeMessage ? (
              <div className="mt-6 rounded-[18px] border border-white/12 bg-white/10 px-4 py-3 text-[13px] leading-6 text-white/78">
                {upgradeMessage}
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-3">
              <AppButton
                className="border-white/12 bg-white/8 text-white hover:bg-white/12"
                icon={<ArrowLeft className="h-4 w-4" />}
                onClick={onReturnToBlueprint}
              >
                {byLanguage(language, { en: "Back to Blueprint", es: "Volver al Blueprint", pt: "Voltar ao Blueprint" })}
              </AppButton>
              <AppButton
                icon={<Sparkles className="h-4 w-4" />}
                loading={actionState === "submitting"}
                loadingLabel={byLanguage(language, { en: "Activating ACP...", es: "Activando ACP...", pt: "Ativando ACP..." })}
                onClick={onAcquireAcp}
                variant="primary"
                disabled={!canAcquire}
              >
                {isPermissionBlocked
                  ? byLanguage(language, {
                      en: "Request workspace permission",
                      es: "Solicita permiso de workspace",
                      pt: "Solicitar permissão de workspace",
                    })
                  : byLanguage(language, {
                      en: `⚡ Prepare for build (ACP) — ${acpPricing.combinedCtaLabel}`,
                      es: `⚡ Preparar para construcción (ACP) — ${acpPricing.combinedCtaLabel}`,
                      pt: `⚡ Preparar para construção (ACP) — ${acpPricing.combinedCtaLabel}`,
                    })}
              </AppButton>
            </div>
          </div>

          <div className="border-l border-[var(--border-default)] bg-white p-6">
            <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
              {byLanguage(language, { en: "What you get", es: "Qué obtienes", pt: "O que você recebe" })}
            </p>
            <div className="mt-5 space-y-3">
              {valueBlocks.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-[20px] border border-[var(--border-default)] bg-[var(--surface-muted)] p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-white text-[var(--brand-primary)]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <p className="text-[14px] font-semibold text-[var(--text-primary)]">{item.title}</p>
                    </div>
                    <p className="mt-3 text-[12px] leading-5 text-[var(--text-secondary)]">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <Panel className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[18px] font-semibold text-[var(--text-primary)]">Blueprint vs ACP</p>
              <p className="mt-2 text-[13px] leading-6 text-[var(--text-secondary)]">
                {byLanguage(language, {
                  en: "The comparison quantifies the incremental value of ACP compared to building with only the Blueprint.",
                  es: "La comparativa cuantifica el valor incremental del ACP frente a construir solo con el Blueprint.",
                  pt: "A comparação quantifica o valor incremental do ACP em relação à construção apenas com o Blueprint.",
                })}
              </p>
            </div>
            <Badge tone="green">
              {byLanguage(language, { en: "Incremental ROI", es: "ROI incremental", pt: "ROI incremental" })}
            </Badge>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <div className="rounded-[20px] border border-[var(--border-default)] bg-white p-4">
              <div className="flex items-center gap-3">
                <GitBranch className="h-5 w-5 text-[var(--brand-primary)]" />
                <p className="text-[14px] font-semibold text-[var(--text-primary)]">{metrics.blueprintAssisted.label}</p>
              </div>
              <div className="mt-4 grid gap-3">
                <KeyValue label={byLanguage(language, { en: "Hours", es: "Horas", pt: "Horas" })} value={formatHours(metrics.blueprintAssisted.estimated_hours_total)} />
                <KeyValue label={byLanguage(language, { en: "Cost", es: "Costo", pt: "Custo" })} value={formatCurrency(metrics.blueprintAssisted.estimated_cost)} />
                <KeyValue label={byLanguage(language, { en: "Human", es: "Humano", pt: "Humano" })} value={formatPercent(metrics.blueprintAssisted.human_intervention_percent)} />
              </div>
            </div>
            <div className="rounded-[20px] border border-[rgba(124,58,237,0.18)] bg-[rgba(124,58,237,0.06)] p-4">
              <div className="flex items-center gap-3">
                <Boxes className="h-5 w-5 text-[var(--brand-primary)]" />
                <p className="text-[14px] font-semibold text-[var(--text-primary)]">{metrics.acpManual.label}</p>
              </div>
              <div className="mt-4 grid gap-3">
                <KeyValue label={byLanguage(language, { en: "Hours", es: "Horas", pt: "Horas" })} value={formatHours(metrics.acpManual.estimated_hours_total)} />
                <KeyValue label={byLanguage(language, { en: "Cost", es: "Costo", pt: "Custo" })} value={formatCurrency(metrics.acpManual.estimated_cost)} />
                <KeyValue label={byLanguage(language, { en: "Duration", es: "Duración", pt: "Duração" })} value={formatWeeks(metrics.acpManual.estimated_duration_weeks, language)} />
              </div>
            </div>
            <div className="rounded-[20px] border border-[rgba(20,184,166,0.2)] bg-[rgba(20,184,166,0.08)] p-4">
              <div className="flex items-center gap-3">
                <Workflow className="h-5 w-5 text-[#0f766e]" />
                <p className="text-[14px] font-semibold text-[var(--text-primary)]">{metrics.acpAgentic.label}</p>
              </div>
              <div className="mt-4 grid gap-3">
                <KeyValue label={byLanguage(language, { en: "Hours", es: "Horas", pt: "Horas" })} value={formatHours(metrics.acpAgentic.estimated_hours_total)} />
                <KeyValue label={byLanguage(language, { en: "Cost", es: "Costo", pt: "Custo" })} value={formatCurrency(metrics.acpAgentic.estimated_cost)} />
                <KeyValue label={byLanguage(language, { en: "Automation", es: "Automatización", pt: "Automação" })} value={formatPercent(metrics.acpAgentic.automation_leverage_percent)} />
              </div>
            </div>
          </div>

          <SimpleTable
            columns={[
              byLanguage(language, { en: "Commercial Question", es: "Pregunta comercial", pt: "Pergunta comercial" }),
              byLanguage(language, { en: "ACP Answer", es: "Respuesta ACP", pt: "Resposta ACP" }),
            ]}
            rows={[
              [
                byLanguage(language, { en: "What else do I get", es: "Qué obtengo adicionalmente", pt: "O que recebo adicionalmente" }),
                byLanguage(language, {
                  en: "A portable technical package, closing questions, tests, and implementation artifacts.",
                  es: "Un paquete técnico portable, preguntas de cierre, pruebas y artefactos de implementación.",
                  pt: "Um pacote técnico portátil, perguntas de fechamento, testes e artefatos de implementação.",
                }),
              ],
              [
                byLanguage(language, { en: "What problem does it solve", es: "Qué problema resuelve", pt: "Que problema resolve" }),
                byLanguage(language, {
                  en: "Avoids manually rediscovering, reinterpreting, and rebuilding prompts, contracts, memory, and tools.",
                  es: "Evita redescubrir, reinterpretar y rearmar manualmente prompts, contratos, memoria y herramientas.",
                  pt: "Evita redescobrir, reinterpretar e reconstruir manualmente prompts, contratos, memória e ferramentas.",
                }),
              ],
              [
                byLanguage(language, { en: "How much effort is saved", es: "Cuánto esfuerzo ahorra", pt: "Quanto esforço economiza" }),
                byLanguage(language, {
                  en: `${formatPercent(metrics.additionalEffortReductionPercent)} additional savings compared to assisted Blueprint.`,
                  es: `${formatPercent(metrics.additionalEffortReductionPercent)} adicional frente al Blueprint asistido.`,
                  pt: `${formatPercent(metrics.additionalEffortReductionPercent)} adicional em relação ao Blueprint assistido.`,
                }),
              ],
              [
                byLanguage(language, { en: "How it reduces risk", es: "Cómo reduce riesgo", pt: "Como reduz o risco" }),
                byLanguage(language, {
                  en: "Makes explicit gaps, owners, deferrable decisions, tests, and acceptance criteria.",
                  es: "Hace explícitos gaps, owners, decisiones diferibles, tests y criterios de aceptación.",
                  pt: "Torna explícitos gaps, responsáveis, decisões que podem ser postergadas, testes e critérios de aceitação.",
                }),
              ],
              [
                byLanguage(language, { en: "Expected ROI", es: "ROI esperado", pt: "ROI esperado" }),
                byLanguage(language, {
                  en: `${formatCurrency(metrics.additionalCostSavings)} estimated incremental savings compared to Blueprint scenario.`,
                  es: `${formatCurrency(metrics.additionalCostSavings)} de ahorro incremental estimado frente al escenario Blueprint.`,
                  pt: `${formatCurrency(metrics.additionalCostSavings)} de economia incremental estimada em relação ao cenário Blueprint.`,
                }),
              ],
            ]}
          />
        </Panel>

        <div className="space-y-5">
          <Panel className="p-5">
            <div className="flex items-center gap-3">
              <Gauge className="h-5 w-5 text-[var(--brand-primary)]" />
              <p className="text-[16px] font-semibold text-[var(--text-primary)]">
                {byLanguage(language, { en: "Operational impact", es: "Impacto operacional", pt: "Impacto operacional" })}
              </p>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <div className="flex items-center justify-between text-[12px] text-[var(--text-secondary)]">
                  <span>{byLanguage(language, { en: "Automation lift", es: "Lift de automatización", pt: "Ganho de automação" })}</span>
                  <span>{formatPercent(metrics.automationLiftPercent)}</span>
                </div>
                <ProgressBar value={metrics.automationLiftPercent} className="mt-2" />
              </div>
              <div>
                <div className="flex items-center justify-between text-[12px] text-[var(--text-secondary)]">
                  <span>{byLanguage(language, { en: "Risk reduced", es: "Riesgo reducido", pt: "Risco reduzido" })}</span>
                  <span>{formatPercent(metrics.riskReductionPercent)}</span>
                </div>
                <ProgressBar value={metrics.riskReductionPercent} className="mt-2" color="#0f766e" />
              </div>
            </div>
          </Panel>

          <Panel className="p-5">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-[var(--text-secondary)]" />
              <p className="text-[16px] font-semibold text-[var(--text-primary)]">
                {byLanguage(language, { en: "Locked features", es: "Funcionalidades bloqueadas", pt: "Recursos bloqueados" })}
              </p>
            </div>
            <div className="mt-4 space-y-2">
              {[
                byLanguage(language, { en: "Validate", es: "Validar", pt: "Validar" }),
                "Test Suite",
                "GAPs",
                byLanguage(language, { en: "Questions", es: "Preguntas", pt: "Perguntas" }),
                "Package",
                byLanguage(language, { en: "ACP Download", es: "Descarga ACP", pt: "Download ACP" }),
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-[16px] border border-[var(--border-default)] bg-[var(--surface-muted)] px-3 py-3">
                  <CheckCircle2 className="h-4 w-4 text-[var(--text-muted)]" />
                  <p className="text-[13px] font-semibold text-[var(--text-primary)]">{item}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <Panel className="p-5">
        <p className="text-[16px] font-semibold text-[var(--text-primary)]">
          {byLanguage(language, { en: "Problems ACP solves", es: "Problemas que el ACP resuelve", pt: "Problemas que o ACP resolve" })}
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {problemBlocks.map((item) => (
            <div key={item} className="rounded-[18px] border border-[var(--border-default)] bg-white px-4 py-4 text-[13px] leading-6 text-[var(--text-secondary)]">
              {item}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
