"use client";

import { Building2, CircleUserRound, KeyRound, Layers3, ServerCog, Sparkles } from "lucide-react";
import { useLanguage } from "@/core/i18n/language-context";
import { cn } from "@/lib/utils";

export type SettingsScope = "personal" | "workspace" | "platform";
export type SettingsCategory = "general" | "providers" | "secrets" | "governance";

interface SettingsTabsNavProps {
  activeCategory: SettingsCategory;
  activeScope: SettingsScope;
  isPlatformAdmin: boolean;
  onCategoryChange: (category: SettingsCategory) => void;
  onScopeChange: (scope: SettingsScope) => void;
}

export function SettingsTabsNav({
  activeCategory,
  activeScope,
  isPlatformAdmin,
  onCategoryChange,
  onScopeChange,
}: SettingsTabsNavProps) {
  const { t } = useLanguage();

  const scopeTabs: { icon: typeof Building2; id: SettingsScope; label: string }[] = [
    { id: "personal", label: t("settings.scope.personal", "Cuenta y acceso"), icon: CircleUserRound },
    { id: "workspace", label: t("settings.scope.workspace", "Workspace & LLM Runtime"), icon: Building2 },
    ...(isPlatformAdmin
      ? [{ id: "platform" as SettingsScope, label: t("settings.scope.platform", "Plataforma & Registry"), icon: ServerCog }]
      : []),
  ];

  const categoryTabs: { icon: typeof Sparkles; id: SettingsCategory; label: string }[] = [
    { id: "providers", label: t("settings.cat.providers", "Proveedores LLM & Runtimes"), icon: Sparkles },
    { id: "secrets", label: t("settings.cat.secrets", "Secretos & Credenciales"), icon: KeyRound },
    { id: "governance", label: t("settings.cat.governance", "Gobernanza & Enrutamiento"), icon: Layers3 },
  ];

  return (
    <div className="space-y-4">
      {/* Scope Navigation (Nivel 1) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border-default)] pb-3">
        {scopeTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeScope === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onScopeChange(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[14px] font-semibold transition-all duration-150",
                isActive
                  ? "bg-[var(--brand-primary)] text-white shadow-sm"
                  : "bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-panel)] hover:text-[var(--text-primary)]",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Category Sub-navigation (Nivel 2 - visible en Workspace scope) */}
      {activeScope === "workspace" && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {categoryTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onCategoryChange(tab.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-150",
                  isActive
                    ? "bg-[var(--brand-soft)] text-[var(--brand-primary)] font-semibold"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
