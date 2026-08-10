"use client";

import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Clock3, FileSearch, ShieldAlert, XCircle } from "lucide-react";
import { AppButton, Badge, Panel } from "@/components/lean/ui";
import type {
  JourneyArtifactEvidenceEntry,
  JourneyArtifactState,
  JourneyStageArtifactEntry,
} from "@/features/sessions/session-contracts";
import { useLanguage } from "@/core/i18n/language-context";
import { cn } from "@/lib/utils";

const STATE_META: Record<
  JourneyArtifactState,
  {
    label: string;
    tone: "blue" | "green" | "orange" | "red" | "slate" | "violet";
    icon: ReactNode;
  }
> = {
  approved: {
    label: "Aprobado",
    tone: "green",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  approved_legacy: {
    label: "Legacy aprobado",
    tone: "blue",
    icon: <ShieldAlert className="h-4 w-4" />,
  },
  generated: {
    label: "Generado",
    tone: "violet",
    icon: <Clock3 className="h-4 w-4" />,
  },
  needs_review_legacy: {
    label: "Legacy por revisar",
    tone: "orange",
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  rejected: {
    label: "Rechazado",
    tone: "red",
    icon: <XCircle className="h-4 w-4" />,
  },
  reviewed: {
    label: "Revisado",
    tone: "blue",
    icon: <FileSearch className="h-4 w-4" />,
  },
  stale: {
    label: "Desactualizado",
    tone: "orange",
    icon: <AlertTriangle className="h-4 w-4" />,
  },
};

export function StageProposalStatus({
  artifact,
  className,
  showVersion = true,
}: {
  artifact?: JourneyStageArtifactEntry | null;
  className?: string;
  showVersion?: boolean;
}) {
  const { t } = useLanguage();

  if (!artifact) {
    return <Badge className={className}>{t("artifactState.none", "Sin propuesta")}</Badge>;
  }

  const meta = STATE_META[artifact.state];
  const translatedLabel = t(`artifactState.${artifact.state}`, meta.label);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Badge tone={meta.tone} className="gap-1.5">
        {meta.icon}
        <span>{translatedLabel}</span>
      </Badge>
      {showVersion ? <Badge>v{artifact.version_number}</Badge> : null}
      {artifact.provider_key ? <Badge tone="slate">{artifact.provider_key}</Badge> : null}
    </div>
  );
}

export function StaleBanner({
  artifact,
  className,
}: {
  artifact?: JourneyStageArtifactEntry | null;
  className?: string;
}) {
  if (!artifact || artifact.state !== "stale" || artifact.stale_reasons.length === 0) {
    return null;
  }

  return (
    <Panel className={cn("border-[rgba(245,158,11,0.28)] bg-[var(--warning-soft)] p-4", className)}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 text-[var(--warning)]" />
        <div className="space-y-2">
          <p className="text-[14px] font-semibold text-[var(--text-primary)]">
            Esta propuesta quedó desactualizada por cambios upstream.
          </p>
          <div className="flex flex-wrap gap-2">
            {artifact.stale_reasons.map((reason, index) => (
              <Badge key={`${reason}-${index}`} tone="orange">
                {reason}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}

export function EvidenceDrawer({
  evidence,
  title = "Evidencia usada",
  className,
}: {
  evidence?: JourneyArtifactEvidenceEntry[] | null;
  title?: string;
  className?: string;
}) {
  const items = evidence ?? [];
  if (items.length === 0) {
    return null;
  }

  return (
    <details className={cn("group rounded-[20px] border border-[var(--border-default)] bg-white", className)}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[14px] font-semibold text-[var(--text-primary)]">
        <span>{title}</span>
        <Badge tone="slate">{items.length}</Badge>
      </summary>
      <div className="space-y-3 border-t border-[var(--border-subtle)] px-4 py-4">
        {items.map((item, index) => (
          <div
            key={`${item.source_type}-${item.source_id}-${item.citation_label}-${index}`}
            className="rounded-[16px] border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="blue">{item.source_type || "evidence"}</Badge>
              {item.citation_label ? <Badge tone="slate">{item.citation_label}</Badge> : null}
              {item.authority_level ? <Badge tone="slate">{item.authority_level}</Badge> : null}
            </div>
            {item.detail ? <p className="mt-2 text-[13px] leading-6 text-[var(--text-secondary)]">{item.detail}</p> : null}
            <div className="mt-2 flex flex-wrap gap-2 text-[12px] text-[var(--text-muted)]">
              {item.source_id ? <span>source: {item.source_id}</span> : null}
              {item.used_for ? <span>uso: {item.used_for}</span> : null}
              {typeof item.retrieval_score === "number" ? <span>score: {item.retrieval_score.toFixed(2)}</span> : null}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}

export function ApprovalBar({
  artifact,
  approveLabel = "Aprobar propuesta",
  approveDisabled = false,
  busy = false,
  onApprove,
  onReject,
  rejectLabel = "Rechazar",
}: {
  artifact?: JourneyStageArtifactEntry | null;
  approveLabel?: string;
  approveDisabled?: boolean;
  busy?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  rejectLabel?: string;
}) {
  if (!artifact) {
    return null;
  }

  const canReview = artifact.state !== "approved" && artifact.state !== "stale";

  return (
    <Panel className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-1">
        <p className="text-[15px] font-semibold text-[var(--text-primary)]">Control de propuesta</p>
        <p className="text-[13px] text-[var(--text-secondary)]">
          Estado actual: <span className="font-medium">{STATE_META[artifact.state].label}</span>
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <AppButton disabled={!canReview || busy} onClick={onReject}>
          {rejectLabel}
        </AppButton>
        <AppButton disabled={!canReview || busy || approveDisabled} loading={busy} onClick={onApprove} variant="primary">
          {approveLabel}
        </AppButton>
      </div>
    </Panel>
  );
}

export function StageBlockersNotice({
  blockers,
  title = "Acciones requeridas para habilitar la aprobación y continuar",
  className,
}: {
  blockers?: string[] | null;
  title?: string;
  className?: string;
}) {
  const items = (blockers ?? []).filter(Boolean);

  if (items.length === 0) {
    return null;
  }

  return (
    <Panel className={cn("border-amber-200 bg-amber-50/90 p-5 shadow-xs transition-all", className)}>
      <div className="flex items-start gap-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 font-bold">
          <AlertTriangle className="h-5 w-5 text-amber-700" />
        </div>
        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-[15px] font-semibold text-amber-950">{title}</h4>
            <Badge tone="orange">{items.length} bloqueo{items.length > 1 ? "s" : ""}</Badge>
          </div>
          <p className="text-[13px] text-amber-900 leading-relaxed">
            Para garantizar la coherencia y gobernanza de la solución, debes resolver los siguientes puntos antes de promover el blueprint o avanzar de etapa:
          </p>
          <ul className="mt-2 space-y-1.5 pt-1">
            {items.map((item, index) => (
              <li key={`blocker-${index}`} className="flex items-start gap-2.5 text-[13px] text-amber-950 font-medium bg-white/80 rounded-lg p-2.5 border border-amber-200/60">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-900 text-[11px] font-bold">
                  {index + 1}
                </span>
                <span className="leading-snug pt-0.5">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Panel>
  );
}
