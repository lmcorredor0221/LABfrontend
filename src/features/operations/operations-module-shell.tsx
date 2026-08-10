"use client";

import type { ReactNode } from "react";
import { PageChrome, TopUtilities, WorkspaceShell } from "@/components/lean/shell";
import { KeyValue, Panel, PanelHeader, SelectField } from "@/components/lean/ui";
import { useLanguage } from "@/core/i18n/language-context";
import { formatDateTime } from "@/features/operations/operations-adapter";
import { getSessionStageLabel } from "@/features/sessions/session-routes";
import type { SessionStage } from "@/features/sessions/types";

export function OperationsModuleShell({
  actions,
  children,
  description,
  eyebrow,
  moduleLabel,
  selectedSession,
  sessionDescription,
  sessionOptions,
  sessionValue,
  showSessionContext = true,
  title,
  onSessionChange,
}: {
  actions?: ReactNode;
  children: ReactNode;
  description: string;
  eyebrow?: string;
  moduleLabel: string;
  selectedSession?: {
    current_stage: SessionStage;
    title: string;
    updated_at: string;
  } | null;
  sessionDescription?: string;
  sessionOptions: Array<{ label: string; value: string }>;
  sessionValue?: string | null;
  showSessionContext?: boolean;
  title: string;
  onSessionChange?: (value: string) => void;
}) {
  const { language, t } = useLanguage();

  return (
    <WorkspaceShell variant="icon" moduleLabel={moduleLabel}>
      <PageChrome
        breadcrumbs={[t("shell.workspaceLabel", "Workspace"), selectedSession?.title ?? t("operations.noActiveSession", "Sin sesión activa"), moduleLabel]}
        actions={
          <>
            {actions}
            <TopUtilities />
          </>
        }
      >
        <div className="space-y-8">
          <div className={showSessionContext ? "grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]" : "block"}>
            <PanelHeader eyebrow={eyebrow} title={title} description={description} />
            {showSessionContext ? (
              <Panel className="p-5">
                <SelectField
                  data-testid="operations-session-select"
                  label={t("operations.activeSession", "Sesión activa")}
                  onValueChange={(value) => onSessionChange?.(value)}
                  options={sessionOptions}
                  value={sessionValue ?? ""}
                />
                <p className="mt-3 text-[13px] leading-6 text-[var(--text-secondary)]">{sessionDescription ?? t("operations.sessionContextDesc", "La sesión activa se conserva al navegar por los módulos operativos.")}</p>
                {selectedSession ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <KeyValue label={t("operations.stage", "Etapa")} value={getSessionStageLabel(selectedSession.current_stage, language)} />
                    <KeyValue label={t("operations.lastUpdated", "Última actualización")} value={formatDateTime(selectedSession.updated_at)} />
                  </div>
                ) : null}
              </Panel>
            ) : null}
          </div>
          {children}
        </div>
      </PageChrome>
    </WorkspaceShell>
  );
}
