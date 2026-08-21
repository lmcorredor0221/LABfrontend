"use client";

import { useState } from "react";
import {
  DEFAULT_SETTINGS_CONFIG_SUB_TABS,
  SETTINGS_CONFIG_SUB_TABS,
  type AdminConfigTabKey,
} from "@/features/operations/settings-admin-navigation";

export type SettingsScope = "personal" | "platform" | "workspace";

type UseSettingsConfigNavigationOptions = {
  initialConfigSubTab?: string;
  initialConfigTab: AdminConfigTabKey;
  isPlatformPanelVisible: boolean;
};

function resolveScope(tab: AdminConfigTabKey, subTab: string, isPlatformPanelVisible: boolean): SettingsScope {
  if (tab === "general") {
    return "personal";
  }
  if (tab === "commerce") {
    return subTab === "prices" && isPlatformPanelVisible ? "platform" : "workspace";
  }
  if (tab === "governance") {
    return (subTab === "registry" || subTab === "runtimeAudit") && isPlatformPanelVisible ? "platform" : "workspace";
  }
  return "workspace";
}

function resolveConfigSubTab(tab: AdminConfigTabKey, subTab: string | undefined) {
  const tabs = SETTINGS_CONFIG_SUB_TABS[tab];
  return subTab && tabs.some((item) => item.key === subTab) ? subTab : DEFAULT_SETTINGS_CONFIG_SUB_TABS[tab];
}

export function useSettingsConfigNavigation({
  initialConfigSubTab,
  initialConfigTab,
  isPlatformPanelVisible,
}: UseSettingsConfigNavigationOptions) {
  const [activeConfigTab, setActiveConfigTab] = useState<AdminConfigTabKey>(initialConfigTab);
  const [activeConfigSubTabs, setActiveConfigSubTabs] = useState<Record<AdminConfigTabKey, string>>(() => ({
    ...DEFAULT_SETTINGS_CONFIG_SUB_TABS,
    [initialConfigTab]: resolveConfigSubTab(initialConfigTab, initialConfigSubTab),
  }));

  function handleConfigTabChange(tab: AdminConfigTabKey) {
    setActiveConfigTab(tab);
  }

  function handleConfigSubTabChange(subTab: string) {
    setActiveConfigSubTabs((current) => ({
      ...current,
      [activeConfigTab]: subTab,
    }));
  }

  const configSubTabs = SETTINGS_CONFIG_SUB_TABS[activeConfigTab];
  const activeConfigSubTab = activeConfigSubTabs[activeConfigTab] ?? DEFAULT_SETTINGS_CONFIG_SUB_TABS[activeConfigTab];
  const activeScope = resolveScope(activeConfigTab, activeConfigSubTab, isPlatformPanelVisible);

  return {
    activeConfigSubTab,
    activeConfigSubTabs,
    activeConfigTab,
    activeScope,
    configSubTabs,
    handleConfigSubTabChange,
    handleConfigTabChange,
    setActiveConfigSubTabs,
    setActiveConfigTab,
  };
}
