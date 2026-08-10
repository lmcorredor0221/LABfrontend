"use client";

import Link from "next/link";
import { useId, useState, type ReactNode } from "react";
import { ArrowRight, FileText, GitBranch, Lock, MessageCircle, Sparkles } from "lucide-react";
import { useLanguage } from "@/core/i18n/language-context";
import {
  UxaBadge,
  UxaProcessingStrip,
  UxaSurface,
} from "@/features/product-experience/design-system";
import type {
  LeanStageLinkedResult,
  LeanStageScreenContract,
  LeanStageTabKey,
  LeanStageWorkbenchTab,
} from "@/features/product-experience/stage-screen/stage-screen-contract";
import { cn } from "@/lib/utils";

type LeanStageScreenProps = {
  actionArea: ReactNode;
  contract: LeanStageScreenContract;
  message?: string;
};

const tabOrder: LeanStageTabKey[] = ["task", "result", "evidence"];

function clampProgress(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return undefined;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

function resultIcon(type: LeanStageLinkedResult["type"]) {
  if (type === "diagram") {
    return GitBranch;
  }
  if (type === "decision") {
    return MessageCircle;
  }
  if (type === "artifact" || type === "operation") {
    return Sparkles;
  }
  return FileText;
}

function StagePrimaryActionPanel({
  actionArea,
  contract,
  message,
}: LeanStageScreenProps) {
  const { t } = useLanguage();
  const progress = clampProgress(contract.metric.progress);

  return (
    <UxaSurface className="uxa-stage-hero">
      <div className="uxa-stage-hero-body">
        <div className="uxa-stage-hero-header">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <UxaBadge tone={contract.stage.statusTone}>{contract.stage.statusLabel}</UxaBadge>
              <UxaBadge tone={contract.primaryAction.tone ?? "info"}>{contract.primaryAction.label}</UxaBadge>
            </div>
            <h2 className="uxa-stage-title">
              {contract.stage.title}
            </h2>
            <p className="uxa-stage-description">
              {contract.stage.description}
            </p>
          </div>
          <div className="uxa-stage-metric-chip shrink-0">
            <span className="uxa-stage-metric-label">
              {contract.metric.label}
            </span>
            <strong className="uxa-stage-metric-value">
              {contract.metric.value}
            </strong>
            {progress !== undefined ? (
              <div className="min-w-[120px] flex-1">
                <UxaProcessingStrip label={contract.metric.label} value={progress} />
              </div>
            ) : null}
          </div>
        </div>
        <div className="uxa-stage-action-row">
          <div className="uxa-stage-action-copy">
            <div className="min-w-0">
              <p className="uxa-stage-action-eyebrow">{t("workbench.recommendedActionEyebrow", "Accion recomendada")}</p>
              <h3 className="uxa-stage-action-title">
                {contract.primaryAction.label}
              </h3>
            </div>
            <div className="min-w-0">
              <p className="uxa-stage-action-description">
                {contract.primaryAction.description}
              </p>
              {message ? (
                <p className="mt-2 rounded-[var(--uxa-radius-md)] bg-white/80 px-3 py-2 text-[12px] leading-5 text-[var(--uxa-color-ink)]" role="status">
                  {message}
                </p>
              ) : null}
            </div>
          </div>
          <div className="uxa-stage-action-strip">
            {actionArea}
          </div>
        </div>
        {contract.metric.helper ? (
          <p className="uxa-stage-helper-text">
            {contract.metric.helper}
          </p>
        ) : null}
      </div>
    </UxaSurface>
  );
}

function LeanStageWorkbench({ contract }: { contract: LeanStageScreenContract }) {
  const { t } = useLanguage();
  const generatedId = useId();
  const tabs = contract.tabs;
  const availableTabs = tabOrder
    .map((key) => tabs.find((tab) => tab.key === key))
    .filter((tab): tab is LeanStageWorkbenchTab => Boolean(tab));
  const [activeTab, setActiveTab] = useState<LeanStageTabKey>(availableTabs[0]?.key ?? "task");
  const active = availableTabs.find((tab) => tab.key === activeTab) ?? availableTabs[0];

  return (
    <UxaSurface className="min-w-0 overflow-hidden">
      <div className="border-b border-[var(--uxa-color-border-soft)] px-4">
        <div aria-label={t("workbench.stageWorkbenchAria", "Workbench de etapa")} className="scrollbar-subtle flex gap-7 overflow-x-auto" role="tablist">
          {availableTabs.map((tab) => {
            const selected = active.key === tab.key;
            return (
              <button
                aria-controls={`${generatedId}-${tab.key}`}
                aria-describedby={`${generatedId}-${tab.key}-description`}
                aria-label={`${tab.label}${tab.badge !== undefined ? ` ${tab.badge}` : ""}`}
                aria-selected={selected}
                className={cn(
                  "relative flex min-h-12 shrink-0 items-center gap-2 border-b-2 px-0 text-left transition",
                  selected
                    ? "border-[var(--uxa-color-brand)] text-[var(--uxa-color-brand)]"
                    : "border-transparent text-[var(--uxa-color-ink-soft)] hover:text-[var(--uxa-color-ink)]",
                )}
                id={`${generatedId}-${tab.key}-tab`}
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                role="tab"
                title={tab.description}
                type="button"
              >
                <span className={cn("text-[13px]", selected ? "font-black" : "font-semibold")}>{tab.label}</span>
                {tab.badge !== undefined ? (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[9px] font-black leading-none",
                      selected
                        ? "bg-[var(--uxa-color-brand-soft)] text-[var(--uxa-color-brand)]"
                        : "bg-[var(--uxa-state-neutral-bg)] text-[var(--uxa-color-ink-soft)]",
                    )}
                  >
                    {tab.badge}
                  </span>
                ) : null}
                <span className="sr-only" id={`${generatedId}-${tab.key}-description`}>
                  {tab.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div
        aria-labelledby={`${generatedId}-${active.key}-tab`}
        className="min-w-0 p-4"
        id={`${generatedId}-${active.key}`}
        role="tabpanel"
      >
        <div className="min-w-0 overflow-x-auto">{active.children}</div>
        {active.key === "evidence" ? <LeanStageEvidenceContext contract={contract} /> : null}
      </div>
    </UxaSurface>
  );
}

function LeanStageEvidenceContext({ contract }: { contract: LeanStageScreenContract }) {
  const { t } = useLanguage();
  const visibleAttention = contract.attentionItems.slice(0, 4);
  const hiddenAttentionCount = Math.max(0, contract.attentionItems.length - visibleAttention.length);

  return (
    <div className="mt-4 border-t border-[var(--uxa-color-border-soft)] pt-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[var(--uxa-color-ink-muted)]">
            {t("workbench.contextEvidence", "Evidencia contextual")}
          </p>
          <h3 className="mt-1 text-[17px] font-black text-[var(--uxa-color-ink)]">
            {t("workbench.contextSummaryTitle", "Atencion, artefactos y siguiente paso")}
          </h3>
        </div>
        <UxaBadge tone={contract.attentionItems.length ? "danger" : "success"}>
          {contract.attentionItems.length} {t("workbench.pendingItems", "pendiente(s)")}
        </UxaBadge>
      </div>

      <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1.05fr)_minmax(260px,0.95fr)]">
        <UxaSurface as="section" className="min-w-0 p-4" muted>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <UxaBadge tone={contract.attentionItems.length ? "warning" : "success"}>{t("workbench.stageAttention", "Atencion de la etapa")}</UxaBadge>
              <p className="mt-2 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
                {t("workbench.stageAttentionDesc", "Aqui queda la evidencia de preguntas, gaps o decisiones originadas en esta fase. La bandeja global sigue siendo el unico punto de accion persistente.")}
              </p>
            </div>
            {hiddenAttentionCount ? (
              <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-[var(--uxa-color-ink-muted)]">
                +{hiddenAttentionCount} {t("workbench.moreItems", "mas")}
              </span>
            ) : null}
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {visibleAttention.length ? (
              visibleAttention.map((item, index) => {
                const content = (
                  <div className="h-full rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-border)] bg-white p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <UxaBadge tone={item.tone ?? "warning"}>{item.label}</UxaBadge>
                    </div>
                    <p className="mt-2 text-[12px] font-black leading-5 text-[var(--uxa-color-ink)]">{item.value}</p>
                    {item.description ? (
                      <p className="mt-1 text-[11px] leading-4 text-[var(--uxa-color-ink-soft)]">{item.description}</p>
                    ) : null}
                  </div>
                );

                return item.href ? (
                  <Link className="block h-full" href={item.href} key={`${item.label}-${item.value}-${index}`}>
                    {content}
                  </Link>
                ) : (
                  <div className="h-full" key={`${item.label}-${item.value}-${index}`}>
                    {content}
                  </div>
                );
              })
            ) : (
              <p className="rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-border-soft)] bg-white p-3 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)] md:col-span-2">
                {t("workbench.noStageAttention", "No hay preguntas, gaps o decisiones bloqueando esta etapa.")}
              </p>
            )}
          </div>
        </UxaSurface>

        <div className="min-w-0 space-y-3">
          <UxaSurface as="section" className="min-w-0 p-4" muted>
            <UxaBadge tone="info">{t("workbench.linkedResults", "Resultados vinculados")}</UxaBadge>
            <div className="mt-3 grid gap-2">
              {contract.linkedResults.map((item, index) => {
                const Icon = resultIcon(item.type);
                const content = (
                  <div className={cn("flex gap-3 rounded-[var(--uxa-radius-md)] border p-3", item.locked ? "border-[var(--uxa-color-border-soft)] bg-white/70 opacity-75" : "border-[var(--uxa-color-border)] bg-white")}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--uxa-radius-md)] bg-[var(--uxa-color-brand-soft)] text-[var(--uxa-color-brand)]">
                      {item.locked ? <Lock aria-hidden="true" className="h-4 w-4" /> : <Icon aria-hidden="true" className="h-4 w-4" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[12px] font-black text-[var(--uxa-color-ink)]">{item.label}</span>
                      <span className="mt-0.5 block text-[11px] leading-4 text-[var(--uxa-color-ink-soft)]">{item.description}</span>
                    </span>
                  </div>
                );

                return item.href && !item.locked ? (
                  <Link href={item.href} key={`${item.type}-${item.label}-${index}`}>
                    {content}
                  </Link>
                ) : (
                  <div key={`${item.type}-${item.label}-${index}`}>{content}</div>
                );
              })}
            </div>
          </UxaSurface>

          <UxaSurface as="section" className="min-w-0 p-4" muted>
            <UxaBadge tone="neutral">{t("workbench.next", "Siguiente")}</UxaBadge>
            <p className="mt-2 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">{contract.nextStep}</p>
          </UxaSurface>
        </div>
      </div>
    </div>
  );
}

export function LeanStageScreen({ actionArea, contract, message }: LeanStageScreenProps) {
  return (
    <div className="space-y-4">
      <StagePrimaryActionPanel actionArea={actionArea} contract={contract} message={message} />
      <LeanStageWorkbench contract={contract} />
    </div>
  );
}

export function LeanStageInlineAction({
  children,
  href,
}: {
  children: ReactNode;
  href: string;
}) {
  return (
    <Link className="uxa-button uxa-button--secondary" href={href}>
      {children}
      <ArrowRight aria-hidden="true" className="h-4 w-4" />
    </Link>
  );
}
