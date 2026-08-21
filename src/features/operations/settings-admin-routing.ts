import {
  ADMIN_CONFIG_TAB_KEYS,
  ADMIN_SECTION_KEYS,
  PRODUCT_GOVERNANCE_TAB_KEYS,
  type AdminConfigTabKey,
  type AdminSettingsSectionKey,
  type ProductGovernanceTabKey,
} from "@/features/operations/settings-admin-navigation";

export type SettingsSearchParams = Record<string, string | string[] | undefined>;

const SECTION_ALIASES: Record<string, AdminSettingsSectionKey> = {
  configuration: "configuration",
  config: "configuration",
  llm: "llm",
  overview: "overview",
  "product-governance": "productGovernance",
  productGovernance: "productGovernance",
  projects: "projects",
  roles: "roles",
  users: "users",
};

const LEGACY_HOTMART_CONFIG_KEYS = new Set(["hotmart", "integrations.hotmart"]);
const LEGACY_DELIVERABLE_GOVERNANCE_KEYS = new Set(["deliverable", "deliverables", "fase-gate", "phase-gate"]);
const LEGACY_DIAGRAM_GOVERNANCE_KEYS = new Set(["diagram", "diagrams", "diagramas"]);

export type ParsedSettingsRouteState = {
  configSubTab?: string;
  configTab?: AdminConfigTabKey;
  productGovernanceTab?: ProductGovernanceTabKey;
  section?: AdminSettingsSectionKey;
};

export function firstParam(params: SettingsSearchParams, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export function parseSettingsSection(value: string | undefined): AdminSettingsSectionKey | undefined {
  if (!value) {
    return undefined;
  }
  const alias = SECTION_ALIASES[value];
  return alias && ADMIN_SECTION_KEYS.has(alias) ? alias : undefined;
}

export function parseSettingsConfigTab(value: string | undefined): AdminConfigTabKey | undefined {
  return value && ADMIN_CONFIG_TAB_KEYS.has(value as AdminConfigTabKey) ? (value as AdminConfigTabKey) : undefined;
}

export function parseProductGovernanceTab(value: string | undefined): ProductGovernanceTabKey | undefined {
  return value && PRODUCT_GOVERNANCE_TAB_KEYS.has(value as ProductGovernanceTabKey)
    ? (value as ProductGovernanceTabKey)
    : undefined;
}

export function parseSettingsRouteState(params: SettingsSearchParams): ParsedSettingsRouteState {
  const rawSection = firstParam(params, "section");
  const rawConfig = firstParam(params, "config") ?? firstParam(params, "configTab");
  const rawSubTab = firstParam(params, "subtab") ?? firstParam(params, "configSubTab");

  if (rawSection === "integrations" || (rawConfig && LEGACY_HOTMART_CONFIG_KEYS.has(rawConfig))) {
    return {
      configSubTab: "hotmart",
      configTab: "commerce",
      productGovernanceTab: undefined,
      section: "configuration",
    };
  }

  if (rawSection === "governance" && rawConfig && LEGACY_DELIVERABLE_GOVERNANCE_KEYS.has(rawConfig)) {
    return {
      configSubTab: undefined,
      configTab: undefined,
      productGovernanceTab: "components",
      section: "productGovernance",
    };
  }

  if (rawSection === "governance" && rawConfig && LEGACY_DIAGRAM_GOVERNANCE_KEYS.has(rawConfig)) {
    return {
      configSubTab: undefined,
      configTab: undefined,
      productGovernanceTab: "diagrams",
      section: "productGovernance",
    };
  }

  return {
    configSubTab: rawSubTab,
    configTab: parseSettingsConfigTab(rawConfig),
    productGovernanceTab: parseProductGovernanceTab(firstParam(params, "tab")),
    section: parseSettingsSection(rawSection),
  };
}

export function buildSettingsHref(state: {
  configSubTab?: string;
  configTab?: AdminConfigTabKey;
  productGovernanceTab?: ProductGovernanceTabKey;
  section?: AdminSettingsSectionKey;
}) {
  const params = new URLSearchParams();
  if (state.section) {
    params.set("section", state.section === "productGovernance" ? "product-governance" : state.section);
  }
  if (state.configTab) {
    params.set("config", state.configTab);
  }
  if (state.configSubTab) {
    params.set("subtab", state.configSubTab);
  }
  if (state.productGovernanceTab) {
    params.set("tab", state.productGovernanceTab);
  }
  const query = params.toString();
  return query ? `/settings?${query}` : "/settings";
}
