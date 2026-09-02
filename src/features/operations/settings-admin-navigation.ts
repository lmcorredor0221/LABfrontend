import {
  Activity,
  BarChart3,
  Boxes,
  CircleDollarSign,
  CreditCard,
  FileText,
  FolderKanban,
  Gauge,
  Layers3,
  LayoutDashboard,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  type LucideIcon,
} from "lucide-react";
import type {
  AdminConfigTabDefinition,
  AdminSubTabDefinition,
} from "@/features/operations/components/admin-console-primitives";

export type AdminSettingsSectionKey =
  | "configuration"
  | "hotmart"
  | "llm"
  | "overview"
  | "productGovernance"
  | "projects"
  | "roles"
  | "users";

export type AdminConfigTabKey = "commerce" | "general" | "governance" | "llmRuntime" | "security";
export type ProductGovernanceTabKey = "artifacts" | "audit" | "components" | "diagrams" | "summary";

export type AdminSectionDefinition = {
  description: string;
  group: "Operación" | "Gobierno" | "Sistema";
  icon: LucideIcon;
  key: AdminSettingsSectionKey;
  label: string;
};

export type AdminConfigTabDefinitionWithScope<TKey extends string = string> = AdminConfigTabDefinition<TKey> & {
  scope: string;
};

export const ADMIN_SECTIONS: AdminSectionDefinition[] = [
  {
    description: "Estado, crecimiento y consumo de la plataforma.",
    group: "Operación",
    icon: LayoutDashboard,
    key: "overview",
    label: "Overview",
  },
  {
    description: "Tokens, costos, proveedores y modelos de toda la plataforma.",
    group: "Operación",
    icon: BarChart3,
    key: "llm",
    label: "Analítica LLM",
  },
  {
    description: "Proyectos, actividad y distribución global por etapa.",
    group: "Operación",
    icon: FolderKanban,
    key: "projects",
    label: "Proyectos",
  },
  {
    description: "Usuarios activos y contexto de acceso.",
    group: "Gobierno",
    icon: Users,
    key: "users",
    label: "Usuarios",
  },
  {
    description: "Roles actuales y evolución de permisos.",
    group: "Gobierno",
    icon: ShieldCheck,
    key: "roles",
    label: "Roles y permisos",
  },
  {
    description: "Gobierno global de diagramas, artefactos, documentos LLM y componentes de entrega por producto.",
    group: "Gobierno",
    icon: Boxes,
    key: "productGovernance",
    label: "Gobierno de producto",
  },
  {
    description: "Configuraciones, credenciales y controles del sistema.",
    group: "Sistema",
    icon: SlidersHorizontal,
    key: "configuration",
    label: "Configuración",
  },
  {
    description: "Checkout, webhooks, activaciones, sincronización y conciliación bajo demanda.",
    group: "Sistema",
    icon: CreditCard,
    key: "hotmart",
    label: "Hotmart",
  },
];

export const CONFIG_TABS: Array<AdminConfigTabDefinitionWithScope<AdminConfigTabKey>> = [
  {
    description: "Identidad global, parámetros de plataforma y preferencias.",
    icon: Users,
    badge: "Base",
    key: "general",
    label: "General",
    scope: "Base",
    status: "available",
  },
  {
    description: "Providers, modelos y ejecución.",
    icon: Gauge,
    badge: "Runtime",
    key: "llmRuntime",
    label: "LLM runtime",
    scope: "Runtime",
    status: "available",
  },
  {
    description: "Secretos, accesos y privacidad.",
    icon: ShieldCheck,
    badge: "Seguridad",
    key: "security",
    label: "Seguridad",
    scope: "Seguridad",
    status: "available",
  },
  {
    description: "FinOps, planes y defaults globales.",
    icon: CircleDollarSign,
    badge: "FinOps",
    key: "commerce",
    label: "Comercial y costos",
    scope: "FinOps",
    status: "available",
  },
  {
    description: "Flags, registry y auditoría de plataforma.",
    icon: ShieldCheck,
    badge: "Control",
    key: "governance",
    label: "Control técnico",
    scope: "Técnico",
    status: "available",
  },
];

export const SETTINGS_CONFIG_SUB_TABS: Record<AdminConfigTabKey, Array<AdminSubTabDefinition<string>>> = {
  commerce: [
    { key: "prices", label: "Precios", description: "Precios base, defaults comerciales y costos por modelo." },
    { key: "budgets", label: "Presupuestos", description: "Budgets, umbrales y controles FinOps del workspace." },
    { key: "alerts", label: "Alertas", description: "Señales de consumo, límites y riesgo operativo." },
  ],
  general: [
    { key: "workspace", label: "Plataforma", description: "Identidad, plan, membresía y contexto global de administración." },
    { key: "preferences", label: "Preferencias", description: "Idioma, moneda y preferencias personales disponibles." },
    { key: "privacy", label: "Privacidad", description: "Consentimientos, límites visibles y datos sensibles." },
  ],
  governance: [
    { key: "flags", label: "Feature flags", description: "Flags por sesión y capacidades operativas." },
    { key: "registry", label: "Platform registry", description: "Providers globales, releases y defaults heredables." },
    { key: "runtimeAudit", label: "Auditoría de plataforma", description: "Eventos técnicos, trazabilidad y cambios sensibles." },
  ],
  llmRuntime: [
    { key: "runtime", label: "Runtime activo", description: "Provider efectivo, credenciales y defaults heredados." },
    { key: "providers", label: "Providers", description: "OpenAI, DeepSeek, Codex CLI y Antigravity CLI." },
    { key: "backends", label: "Backends", description: "Agent execution, knowledge backend y memoria híbrida." },
    { key: "diagnostics", label: "Diagnóstico", description: "Health checks, smoke commands y resumen operativo." },
  ],
  security: [
    { key: "secrets", label: "Secretos y credenciales", description: "Credenciales por provider, aislamiento y rotación." },
  ],
};

export const DEFAULT_SETTINGS_CONFIG_SUB_TABS: Record<AdminConfigTabKey, string> = {
  commerce: "prices",
  general: "workspace",
  governance: "flags",
  llmRuntime: "runtime",
  security: "secrets",
};

export const PRODUCT_GOVERNANCE_TABS: Array<AdminConfigTabDefinition<ProductGovernanceTabKey>> = [
  {
    description: "Cobertura por producto, etapa, disponibilidad y señales de calidad.",
    icon: LayoutDashboard,
    badge: "Resumen",
    key: "summary",
    label: "Resumen",
    status: "partial",
  },
  {
    description: "Disponibilidad, PromptSpec y contratos de diagramas.",
    icon: Layers3,
    badge: "Diagramas",
    key: "diagrams",
    label: "Diagramas",
    status: "available",
  },
  {
    description: "Documentos y artefactos generados o asistidos por LLM.",
    icon: FileText,
    badge: "LLM docs",
    key: "artifacts",
    label: "Artefactos",
    status: "available",
  },
  {
    description: "Elementos que conforman Blueprint, Blueprint Pro y ACP.",
    icon: Boxes,
    badge: "Entrega",
    key: "components",
    label: "Componentes",
    status: "available",
  },
  {
    description: "Trazabilidad de cambios, jobs, quality snapshots y validaciones.",
    icon: Activity,
    badge: "Calidad",
    key: "audit",
    label: "Auditoría",
    status: "partial",
  },
];

export const ADMIN_SECTION_KEYS = new Set<AdminSettingsSectionKey>(
  ADMIN_SECTIONS.map((section) => section.key),
);

export const ADMIN_CONFIG_TAB_KEYS = new Set<AdminConfigTabKey>(
  CONFIG_TABS.map((tab) => tab.key),
);

export const PRODUCT_GOVERNANCE_TAB_KEYS = new Set<ProductGovernanceTabKey>(
  PRODUCT_GOVERNANCE_TABS.map((tab) => tab.key),
);

export function getConfigSubTabs(tab: AdminConfigTabKey) {
  return SETTINGS_CONFIG_SUB_TABS[tab];
}

export function getDefaultConfigSubTab(tab: AdminConfigTabKey) {
  return DEFAULT_SETTINGS_CONFIG_SUB_TABS[tab];
}
