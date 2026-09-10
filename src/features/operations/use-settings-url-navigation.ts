"use client";

import { useRouter } from "next/navigation";
import {
  getDefaultConfigSubTab,
  type AdminConfigTabKey,
  type AdminSettingsSectionKey,
  type ProductGovernanceTabKey,
} from "@/features/operations/settings-admin-navigation";
import { buildSettingsHref } from "@/features/operations/settings-admin-routing";

type UseSettingsUrlNavigationOptions = {
  activeConfigSubTab: string;
  activeConfigTab: AdminConfigTabKey;
  activeProductGovernanceTab: ProductGovernanceTabKey;
  configSubTabsByTab: Record<AdminConfigTabKey, string>;
  onConfigSubTabChange: (subTab: string) => void;
  onConfigTabChange: (tab: AdminConfigTabKey) => void;
  onProductGovernanceTabChange: (tab: ProductGovernanceTabKey) => void;
  onSectionChange: (section: AdminSettingsSectionKey) => void;
};

export function useSettingsUrlNavigation({
  activeConfigSubTab,
  activeConfigTab,
  activeProductGovernanceTab,
  configSubTabsByTab,
  onConfigSubTabChange,
  onConfigTabChange,
  onProductGovernanceTabChange,
  onSectionChange,
}: UseSettingsUrlNavigationOptions) {
  const router = useRouter();

  function replaceSettingsUrl(href: string) {
    router.replace(href, { scroll: false });
  }

  function getConfigSubTabFor(tab: AdminConfigTabKey) {
    return configSubTabsByTab[tab] ?? getDefaultConfigSubTab(tab);
  }

  function handleSectionChange(sectionKey: AdminSettingsSectionKey) {
    onSectionChange(sectionKey);
    replaceSettingsUrl(
      buildSettingsHref({
        configSubTab: sectionKey === "configuration" ? activeConfigSubTab : undefined,
        configTab: sectionKey === "configuration" ? activeConfigTab : undefined,
        productGovernanceTab: sectionKey === "productGovernance" ? activeProductGovernanceTab : undefined,
        section: sectionKey,
      }),
    );
  }

  function handleConfigTabNavigation(tab: AdminConfigTabKey) {
    onSectionChange("configuration");
    onConfigTabChange(tab);
    replaceSettingsUrl(
      buildSettingsHref({
        configSubTab: getConfigSubTabFor(tab),
        configTab: tab,
        section: "configuration",
      }),
    );
  }

  function handleConfigSubTabNavigation(subTab: string) {
    onSectionChange("configuration");
    onConfigSubTabChange(subTab);
    replaceSettingsUrl(
      buildSettingsHref({
        configSubTab: subTab,
        configTab: activeConfigTab,
        section: "configuration",
      }),
    );
  }

  function handleProductGovernanceTabNavigation(tab: ProductGovernanceTabKey) {
    onSectionChange("productGovernance");
    onProductGovernanceTabChange(tab);
    replaceSettingsUrl(
      buildSettingsHref({
        productGovernanceTab: tab,
        section: "productGovernance",
      }),
    );
  }

  return {
    handleConfigSubTabNavigation,
    handleConfigTabNavigation,
    handleProductGovernanceTabNavigation,
    handleSectionChange,
  };
}
