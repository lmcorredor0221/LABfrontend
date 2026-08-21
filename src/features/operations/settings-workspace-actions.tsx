"use client";

import { FolderKanban, RefreshCcw, ServerCog, Sparkles } from "lucide-react";
import { AppButton } from "@/components/lean/ui";
import type { SettingsScope } from "@/features/operations/use-settings-config-navigation";
import type { SessionSummary } from "@/features/sessions/types";

type SettingsActionTranslationKey =
  | "settings.backToProject"
  | "settings.createSession"
  | "settings.refreshPlatform"
  | "settings.refreshWorkspaceTop";

type SettingsWorkspaceActionsProps = {
  activeScope: SettingsScope;
  isHotmartConfigActive: boolean;
  isPlatformPanelVisible: boolean;
  onCreateSession: () => void;
  onOpenSelectedProject: (session: SessionSummary) => void;
  onRefreshPlatform: () => void;
  onRefreshWorkspace: () => void;
  selectedSession: SessionSummary | null;
  t: (key: SettingsActionTranslationKey, fallback?: string) => string;
};

export function SettingsWorkspaceActions({
  activeScope,
  isHotmartConfigActive,
  isPlatformPanelVisible,
  onCreateSession,
  onOpenSelectedProject,
  onRefreshPlatform,
  onRefreshWorkspace,
  selectedSession,
  t,
}: SettingsWorkspaceActionsProps) {
  return (
    <>
      {activeScope === "workspace" && selectedSession ? (
        <AppButton onClick={() => onOpenSelectedProject(selectedSession)} icon={<FolderKanban className="h-4 w-4" />}>
          {t("settings.backToProject", "Volver al proyecto")}
        </AppButton>
      ) : activeScope === "workspace" ? (
        <AppButton onClick={onCreateSession} icon={<Sparkles className="h-4 w-4" />}>
          {t("settings.createSession", "Crear sesión")}
        </AppButton>
      ) : null}
      {activeScope === "workspace" ? (
        <AppButton onClick={onRefreshWorkspace} icon={<RefreshCcw className="h-4 w-4" />}>
          {t("settings.refreshWorkspaceTop", "Refrescar workspace")}
        </AppButton>
      ) : null}
      {!isHotmartConfigActive && activeScope === "platform" && isPlatformPanelVisible ? (
        <AppButton onClick={onRefreshPlatform} icon={<ServerCog className="h-4 w-4" />}>
          {t("settings.refreshPlatform", "Refrescar plataforma")}
        </AppButton>
      ) : null}
    </>
  );
}
