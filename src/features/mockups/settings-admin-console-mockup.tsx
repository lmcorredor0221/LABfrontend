"use client";

import { Fragment, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  Banknote,
  BarChart3,
  Bot,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock3,
  Command,
  Filter,
  FolderKanban,
  Gauge,
  KeyRound,
  Layers3,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCcw,
  Search,
  ServerCog,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Users,
  WalletCards,
  Zap,
} from "lucide-react";
import { BarsByDimension, DonutChart, MiniBarChart, MultiSeriesChart } from "@/components/lean/charts";
import { AppButton, Badge, KeyValue, Panel, ProgressBar, SelectField, SimpleTable, StatRow, TextField } from "@/components/lean/ui";
import { PageChrome, WorkspaceShell } from "@/components/lean/shell";
import {
  AdminAccordionTable as SharedConfigAccordionTable,
  AdminFormPanel as SharedConfigFormPanel,
  AdminKpiCard as KpiCard,
  AdminSourceNote as SourceNote,
  ContextSubTabs,
  FunctionalTabRail,
  SettingsAdminConsoleFrame,
} from "@/features/operations/components/admin-console-primitives";
import { cn } from "@/lib/utils";

type BadgeTone = "violet" | "green" | "orange" | "red" | "blue" | "slate";
type SectionKey = "overview" | "llm" | "projects" | "users" | "roles" | "configuration";
type CapabilityStatus = "available" | "gap" | "partial";

type SectionDefinition = {
  badge: string;
  badgeTone?: BadgeTone;
  counter?: string | number;
  description: string;
  group: "Operación" | "Gobierno" | "Sistema";
  icon: LucideIcon;
  key: SectionKey;
  label: string;
};

type KpiDefinition = {
  delta: string;
  detail: string;
  icon: LucideIcon;
  label: string;
  tone: BadgeTone;
  trend: number[];
  value: string;
};

type MetricTileDefinition = {
  detail: string;
  icon: LucideIcon;
  label: string;
  tone: BadgeTone;
  value: string;
};

type ConfigTabKey = "general" | "llmRuntime" | "security" | "commerce" | "governance";

type ConfigSubTabDefinition = {
  description: string;
  key: string;
  label: string;
};

type ConfigTabDefinition = {
  badge: string;
  description: string;
  icon: LucideIcon;
  key: ConfigTabKey;
  label: string;
  status: CapabilityStatus;
  subTabs: ConfigSubTabDefinition[];
};

type ConfigDetailField = {
  label: string;
  tone?: BadgeTone;
  value: string;
};

type ConfigActionDefinition = {
  label: string;
  tone?: BadgeTone;
};

type ConfigTableRow = {
  detail: string;
  expandedActions: ConfigActionDefinition[];
  fields: ConfigDetailField[];
  id: string;
  name: string;
  owner: string;
  primaryAction: string;
  scope: string;
  statusLabel: string;
  statusTone: BadgeTone;
  summary: string;
};

const SECTIONS: SectionDefinition[] = [
  {
    badge: "Live",
    badgeTone: "green",
    description: "Estado ejecutivo, crecimiento, consumo y señales de atención.",
    group: "Operación",
    icon: LayoutDashboard,
    key: "overview",
    label: "Overview",
  },
  {
    badge: "2 alertas",
    badgeTone: "orange",
    counter: "2 alertas",
    description: "Costos, tokens, modelos, providers, presupuestos y alertas LLM.",
    group: "Operación",
    icon: BarChart3,
    key: "llm",
    label: "FinOps & LLM",
  },
  {
    badge: "42",
    badgeTone: "slate",
    counter: 42,
    description: "Proyectos, etapas, estados, actividad y avance operativo.",
    group: "Operación",
    icon: FolderKanban,
    key: "projects",
    label: "Portafolio",
  },
  {
    badge: "48",
    badgeTone: "blue",
    counter: 48,
    description: "Usuarios registrados, actividad, estado, workspace y permisos visibles.",
    group: "Gobierno",
    icon: Users,
    key: "users",
    label: "Usuarios",
  },
  {
    badge: "RBAC",
    badgeTone: "violet",
    description: "Roles, permisos, matriz de acceso y asignaciones futuras.",
    group: "Gobierno",
    icon: ShieldCheck,
    key: "roles",
    label: "Roles y Permisos",
  },
  {
    badge: "Admin",
    badgeTone: "slate",
    description: "Todo lo existente en Settings agrupado por responsabilidad.",
    group: "Sistema",
    icon: SlidersHorizontal,
    key: "configuration",
    label: "Configuración",
  },
];

const OVERVIEW_KPIS: KpiDefinition[] = [
  {
    delta: "+18.4%",
    detail: "vs periodo anterior",
    icon: WalletCards,
    label: "Costo LLM",
    tone: "blue",
    trend: [42, 47, 45, 52, 58, 63, 71, 79],
    value: "US$ 428.63",
  },
  {
    delta: "+24.1%",
    detail: "2.31M input / 0.74M output",
    icon: Zap,
    label: "Tokens totales",
    tone: "green",
    trend: [36, 44, 42, 55, 61, 64, 73, 82],
    value: "3.05M",
  },
  {
    delta: "+9 nuevos",
    detail: "18 activos / 6 finalizados",
    icon: FolderKanban,
    label: "Proyectos",
    tone: "violet",
    trend: [18, 20, 24, 27, 29, 31, 35, 39],
    value: "42",
  },
  {
    delta: "+12.8%",
    detail: "31 activos en 7 dias",
    icon: Users,
    label: "Usuarios activos",
    tone: "orange",
    trend: [12, 15, 19, 20, 23, 26, 27, 31],
    value: "31",
  },
];

const LLM_METRICS: MetricTileDefinition[] = [
  { detail: "US$ 0.38 por llamada", icon: Banknote, label: "Costo total", tone: "blue", value: "US$ 428.63" },
  { detail: "75.7% del total", icon: Zap, label: "Input tokens", tone: "green", value: "2.31M" },
  { detail: "24.3% del total", icon: Sparkles, label: "Output tokens", tone: "violet", value: "0.74M" },
  { detail: "38 retries / 11 fallbacks", icon: Bot, label: "Llamadas", tone: "orange", value: "1,204" },
  { detail: "2.1 s promedio", icon: Clock3, label: "Latencia p95", tone: "blue", value: "4.2 s" },
  { detail: "10 llamadas no exitosas", icon: AlertTriangle, label: "Error rate", tone: "green", value: "0.8%" },
];

const USER_METRICS: MetricTileDefinition[] = [
  { detail: "+7 este mes", icon: Users, label: "Usuarios registrados", tone: "blue", value: "48" },
  { detail: "64.5% activación", icon: Activity, label: "Activos 7 días", tone: "green", value: "31" },
  { detail: "Tendencia positiva", icon: TrendingUp, label: "Nuevos usuarios", tone: "violet", value: "7" },
  { detail: "Revisar onboarding", icon: AlertTriangle, label: "Invitaciones pendientes", tone: "orange", value: "4" },
];

const PROPOSED_NAVIGATION: Array<{ detail: string; icon: LucideIcon; label: string }> = [
  { detail: "Resumen ejecutivo y señales de atención", icon: LayoutDashboard, label: "Overview" },
  { detail: "FinOps, tokens, costos, modelos y presupuestos", icon: BarChart3, label: "Analítica LLM" },
  { detail: "Distribución por etapa, actividad y portafolio", icon: FolderKanban, label: "Proyectos" },
  { detail: "Listado, estado, actividad y membresía", icon: Users, label: "Usuarios" },
  { detail: "Matriz de acceso independiente", icon: ShieldCheck, label: "Roles y permisos" },
  { detail: "General, proveedores, seguridad, integraciones y plataforma", icon: SlidersHorizontal, label: "Configuración" },
];

const providerBreakdown = [
  { color: "#2563eb", label: "OpenAI / gpt-5.5", value: 47 },
  { color: "#16a34a", label: "DeepSeek / v4-pro", value: 26 },
  { color: "#7c3aed", label: "Codex Local", value: 19 },
  { color: "#f59e0b", label: "Antigravity CLI", value: 8 },
];

const stageDistribution = [
  { color: "#4f46f5", label: "Descubrir", value: 19 },
  { color: "#2563eb", label: "Definir", value: 26 },
  { color: "#16a34a", label: "Diseñar", value: 22 },
  { color: "#f59e0b", label: "Herramientas", value: 13 },
  { color: "#dc2626", label: "Memoria", value: 9 },
  { color: "#64748b", label: "Listo/export", value: 11 },
];

const llmRows = [
  ["OpenAI", "gpt-5.5", "1.42M", "US$ 247.18", "612", <Badge key="ok-openai" tone="green">Estable</Badge>],
  ["DeepSeek", "deepseek-v4-pro", "0.88M", "US$ 61.42", "384", <Badge key="ok-deepseek" tone="green">Eficiente</Badge>],
  ["Codex Local", "codex", "0.51M est.", "US$ 92.70", "131", <Badge key="warn-codex" tone="orange">Auth a validar</Badge>],
  ["Antigravity CLI", "agy-pro", "0.24M est.", "US$ 27.33", "77", <Badge key="draft-agy" tone="slate">Preview</Badge>],
];

const projectRows = [
  ["Asistente soporte RR. HH.", "Diseñar", <Badge key="review-rh" tone="orange">Atención</Badge>, "62%", "Owner", "Hace 2 h"],
  ["Cotizador B2B comercial", "Definir", <Badge key="ready-cotizador" tone="green">Ready</Badge>, "38%", "Admin", "Hace 5 h"],
  ["Onboarding técnico clientes", "Exportación", <Badge key="complete-onboarding" tone="blue">Finalizado</Badge>, "100%", "Owner", "Ayer"],
  ["Analista contratos legales", "Descubrir", <Badge key="draft-legal" tone="slate">Draft</Badge>, "20%", "Editor", "Ayer"],
  ["Mesa de ayuda ITSM", "Memoria", <Badge key="review-itsm" tone="orange">Atención</Badge>, "71%", "Admin", "2 dias"],
];

const userRows = [
  ["Laura Méndez", "laura@leanbuilder.local", <Badge key="owner-laura" tone="violet">Owner</Badge>, <Badge key="active-laura" tone="green">Activa</Badge>, "9 proyectos", "Hoy 09:12"],
  ["Diego Rojas", "diego@leanbuilder.local", <Badge key="admin-diego" tone="blue">Admin</Badge>, <Badge key="active-diego" tone="green">Activo</Badge>, "6 proyectos", "Hoy 08:44"],
  ["María Silva", "maria@leanbuilder.local", <Badge key="editor-maria" tone="orange">Editor</Badge>, <Badge key="active-maria" tone="green">Activa</Badge>, "3 proyectos", "Ayer"],
  ["Andrés Torres", "andres@leanbuilder.local", <Badge key="viewer-andres" tone="slate">Viewer</Badge>, <Badge key="inactive-andres" tone="slate">Invitado</Badge>, "1 proyecto", "Hace 6 dias"],
];

const roleRows = [
  ["Owner", "Administración total del workspace", "Runtime, usuarios, billing, proyectos", <Badge key="owner-status" tone="green">Actual</Badge>],
  ["Admin", "Gobierno operativo", "Runtime, secretos, FinOps, proyectos", <Badge key="admin-status" tone="green">Actual</Badge>],
  ["Editor", "Construcción y edición", "Crear/editar proyectos, consumir capacidades", <Badge key="editor-status" tone="blue">Actual</Badge>],
  ["Viewer", "Lectura controlada", "Consultar resultados y entregables permitidos", <Badge key="viewer-status" tone="blue">Actual</Badge>],
  ["Platform admin", "Gobierno global SaaS", "Registry, defaults, precios, auditoría", <Badge key="platform-status" tone="orange">Parcial</Badge>],
  ["Roles custom", "Permisos granulares por capacidad", "Matriz futura y políticas asignables", <Badge key="custom-status" tone="slate">Requiere API</Badge>],
];

const CONFIG_TABS: ConfigTabDefinition[] = [
  {
    badge: "Base",
    description: "Identidad del workspace, preferencias operativas y consentimiento.",
    icon: Users,
    key: "general",
    label: "General",
    status: "available",
    subTabs: [
      { key: "workspace", label: "Workspace", description: "Perfil, plan, acceso y datos administrativos únicos." },
      { key: "preferences", label: "Preferencias", description: "Idioma, moneda y defaults de experiencia." },
      { key: "privacy", label: "Privacidad", description: "Consentimientos, retención y datos sensibles." },
    ],
  },
  {
    badge: "Runtime",
    description: "Provider activo, modelos, backends agentic y knowledge backend.",
    icon: Bot,
    key: "llmRuntime",
    label: "LLM runtime",
    status: "available",
    subTabs: [
      { key: "runtime", label: "Runtime activo", description: "Selección singleton del provider y fallback." },
      { key: "providers", label: "Providers", description: "Inventario administrable por proveedor/modelo." },
      { key: "backends", label: "Backends", description: "Servicios agentic, knowledge y CLI asociados." },
    ],
  },
  {
    badge: "Seguridad",
    description: "Secretos, rotación, health checks y auditoría de acciones sensibles.",
    icon: KeyRound,
    key: "security",
    label: "Seguridad",
    status: "available",
    subTabs: [
      { key: "secrets", label: "Secretos", description: "Credenciales por workspace y origen." },
      { key: "health", label: "Health", description: "Estado de conexión y pruebas recientes." },
      { key: "audit", label: "Auditoría sensible", description: "Cambios de alto impacto y responsables." },
    ],
  },
  {
    badge: "FinOps",
    description: "Precios base, presupuestos, alertas y administración Hotmart.",
    icon: Banknote,
    key: "commerce",
    label: "Comercial y costos",
    status: "available",
    subTabs: [
      { key: "prices", label: "Precios", description: "Base prices Blueprint/ACP y costos por modelo." },
      { key: "budgets", label: "Presupuestos", description: "Budgets, umbrales y alertas FinOps." },
      { key: "hotmart", label: "Hotmart", description: "Payment links, promociones, comunidad y sincronización." },
    ],
  },
  {
    badge: "Gobierno",
    description: "Feature flags, registry global, diagramas, entregables y auditoría runtime.",
    icon: Layers3,
    key: "governance",
    label: "Gobernanza",
    status: "partial",
    subTabs: [
      { key: "flags", label: "Feature flags", description: "Capacidades activas por sesión, workspace o plataforma." },
      { key: "registry", label: "Platform registry", description: "Catálogo global de providers y defaults." },
      { key: "artifacts", label: "Diagramas y entregables", description: "Reglas de calidad, exportación y publicación." },
      { key: "runtimeAudit", label: "Auditoría runtime", description: "Eventos técnicos, cambios de configuración y trazabilidad." },
    ],
  },
];

const DEFAULT_CONFIG_SUBTABS: Record<ConfigTabKey, string> = {
  commerce: "prices",
  general: "workspace",
  governance: "flags",
  llmRuntime: "runtime",
  security: "secrets",
};

const preferenceRows: ConfigTableRow[] = [
  {
    detail: "La preferencia se aplica al workspace y sirve como default para nuevas sesiones administrativas.",
    expandedActions: [
      { label: "Ver overrides por usuario", tone: "blue" },
      { label: "Restaurar default", tone: "slate" },
    ],
    fields: [
      { label: "Valor actual", value: "Español / es-CO" },
      { label: "Override usuario", value: "Permitido", tone: "blue" },
      { label: "Último cambio", value: "Hace 12 días" },
    ],
    id: "pref-language",
    name: "Idioma",
    owner: "Admin",
    primaryAction: "Editar",
    scope: "Workspace",
    statusLabel: "Activo",
    statusTone: "green",
    summary: "Define el idioma administrativo por defecto.",
  },
  {
    detail: "La moneda se usa para representar costos LLM, presupuestos FinOps y reportes comerciales.",
    expandedActions: [
      { label: "Ver impacto en reportes", tone: "blue" },
      { label: "Historial de tasas", tone: "slate" },
    ],
    fields: [
      { label: "Valor actual", value: "USD" },
      { label: "Fuente", value: "Workspace settings" },
      { label: "Afecta", value: "FinOps, Hotmart, LLM" },
    ],
    id: "pref-currency",
    name: "Moneda",
    owner: "Owner",
    primaryAction: "Editar",
    scope: "Workspace",
    statusLabel: "Activo",
    statusTone: "green",
    summary: "Moneda base para costos, precios y presupuestos.",
  },
  {
    detail: "Controla si se muestran ayudas contextuales, avisos de beta y mensajes de onboarding para administradores.",
    expandedActions: [
      { label: "Configurar audiencias", tone: "blue" },
      { label: "Previsualizar mensajes", tone: "slate" },
    ],
    fields: [
      { label: "Valor actual", value: "Reducido" },
      { label: "Audiencia", value: "Admins" },
      { label: "Modo", value: "No intrusivo" },
    ],
    id: "pref-guidance",
    name: "Mensajes de guía",
    owner: "Admin",
    primaryAction: "Editar",
    scope: "Administración",
    statusLabel: "Activo",
    statusTone: "green",
    summary: "Define la densidad de ayuda visible en Settings.",
  },
];

const privacyRows: ConfigTableRow[] = [
  {
    detail: "El consentimiento aplica a análisis agregados; no habilita exposición de prompts ni secretos.",
    expandedActions: [
      { label: "Ver política asociada", tone: "blue" },
      { label: "Exportar consentimiento", tone: "slate" },
    ],
    fields: [
      { label: "Estado", value: "Aceptado", tone: "green" },
      { label: "Versión", value: "2026.07" },
      { label: "Responsable", value: "Laura Méndez" },
    ],
    id: "privacy-consent",
    name: "Consentimiento analítico",
    owner: "Owner",
    primaryAction: "Revisar",
    scope: "Workspace",
    statusLabel: "Vigente",
    statusTone: "green",
    summary: "Permite métricas agregadas de uso administrativo.",
  },
  {
    detail: "La retención define cuánto tiempo se conservan eventos administrativos, trazas de configuración y errores técnicos.",
    expandedActions: [
      { label: "Ajustar retención", tone: "orange" },
      { label: "Ver exclusiones", tone: "slate" },
    ],
    fields: [
      { label: "Actual", value: "180 días" },
      { label: "Mínimo recomendado", value: "90 días" },
      { label: "Afecta", value: "Auditoría, runtime, seguridad" },
    ],
    id: "privacy-retention",
    name: "Retención de auditoría",
    owner: "Platform admin",
    primaryAction: "Configurar",
    scope: "Plataforma",
    statusLabel: "Parcial",
    statusTone: "orange",
    summary: "Control de conservación para eventos administrativos.",
  },
];

const providerRows: ConfigTableRow[] = [
  {
    detail: "Provider principal para generación, razonamiento y evaluación. La fila mantiene visible la acción operativa; el detalle reserva modelos, límites y fallback.",
    expandedActions: [
      { label: "Editar modelos habilitados", tone: "blue" },
      { label: "Configurar fallback", tone: "orange" },
      { label: "Ver costos por modelo", tone: "slate" },
    ],
    fields: [
      { label: "Modelos", value: "gpt-5, gpt-4.1, o-series" },
      { label: "Secret source", value: "Workspace secret" },
      { label: "Último health check", value: "Hoy 08:51", tone: "green" },
    ],
    id: "provider-openai",
    name: "OpenAI",
    owner: "Owner/Admin",
    primaryAction: "Probar",
    scope: "Workspace",
    statusLabel: "Activo",
    statusTone: "green",
    summary: "Provider LLM activo para tareas principales.",
  },
  {
    detail: "Provider alternativo para optimización de costo o escenarios específicos donde el modelo esté habilitado.",
    expandedActions: [
      { label: "Editar endpoint", tone: "blue" },
      { label: "Limitar por rol", tone: "orange" },
    ],
    fields: [
      { label: "Modelos", value: "deepseek-chat, deepseek-reasoner" },
      { label: "Modo", value: "Fallback controlado" },
      { label: "Último health check", value: "Ayer", tone: "blue" },
    ],
    id: "provider-deepseek",
    name: "DeepSeek",
    owner: "Admin",
    primaryAction: "Activar",
    scope: "Workspace",
    statusLabel: "Disponible",
    statusTone: "blue",
    summary: "Provider alternativo parametrizable.",
  },
  {
    detail: "Proveedor local para asistencia técnica dentro del entorno del administrador; requiere setup local y permisos del host.",
    expandedActions: [
      { label: "Ver guía local", tone: "blue" },
      { label: "Validar binario", tone: "orange" },
    ],
    fields: [
      { label: "Modo", value: "Local" },
      { label: "Permiso", value: "Por máquina" },
      { label: "Estado", value: "Detectado parcialmente", tone: "orange" },
    ],
    id: "provider-codex-local",
    name: "Codex Local",
    owner: "Usuario técnico",
    primaryAction: "Validar",
    scope: "Sesión",
    statusLabel: "Parcial",
    statusTone: "orange",
    summary: "Ejecución local asistida para flujos técnicos.",
  },
];

const backendRows: ConfigTableRow[] = [
  {
    detail: "Coordina tareas del runtime agentic: planificación, ejecución, memoria operativa y validaciones técnicas.",
    expandedActions: [
      { label: "Ver workers", tone: "blue" },
      { label: "Ajustar concurrencia", tone: "orange" },
    ],
    fields: [
      { label: "Endpoint", value: "/api/v1/agentic/*" },
      { label: "SLA interno", value: "99.5%" },
      { label: "Última incidencia", value: "Sin eventos críticos", tone: "green" },
    ],
    id: "backend-agentic",
    name: "Backend agentic",
    owner: "Platform admin",
    primaryAction: "Ver estado",
    scope: "Plataforma",
    statusLabel: "Operativo",
    statusTone: "green",
    summary: "Servicios core para flujos agentic.",
  },
  {
    detail: "Administra índices, embeddings y recuperación de contexto para proyectos, entregables y memoria.",
    expandedActions: [
      { label: "Ver índices", tone: "blue" },
      { label: "Reindexar", tone: "orange" },
    ],
    fields: [
      { label: "Índices activos", value: "12" },
      { label: "Latencia p95", value: "420 ms" },
      { label: "Última sincronización", value: "Hace 21 min" },
    ],
    id: "backend-knowledge",
    name: "Knowledge backend",
    owner: "Admin técnico",
    primaryAction: "Sincronizar",
    scope: "Workspace",
    statusLabel: "Activo",
    statusTone: "green",
    summary: "Búsqueda y memoria semántica para proyectos.",
  },
  {
    detail: "CLI complementaria para flujos avanzados. Debe quedar separada del runtime SaaS porque su operación depende del entorno local.",
    expandedActions: [
      { label: "Ver instalación", tone: "blue" },
      { label: "Deshabilitar por workspace", tone: "orange" },
    ],
    fields: [
      { label: "Modo", value: "Opt-in" },
      { label: "Compatibilidad", value: "Windows/macOS/Linux" },
      { label: "Estado", value: "Beta controlada", tone: "orange" },
    ],
    id: "backend-antigravity",
    name: "Antigravity CLI",
    owner: "Platform admin",
    primaryAction: "Revisar",
    scope: "Sesión",
    statusLabel: "Beta",
    statusTone: "orange",
    summary: "Herramienta local opcional para ejecución avanzada.",
  },
];

const secretRows: ConfigTableRow[] = [
  {
    detail: "La clave se guarda como referencia segura; nunca se muestra en texto plano dentro de Settings.",
    expandedActions: [
      { label: "Rotar secreto", tone: "orange" },
      { label: "Revocar", tone: "red" },
      { label: "Ver auditoría", tone: "slate" },
    ],
    fields: [
      { label: "Tipo", value: "API key" },
      { label: "Storage", value: "Workspace secret vault" },
      { label: "Rotación", value: "Hace 18 días" },
    ],
    id: "secret-openai",
    name: "OPENAI_API_KEY",
    owner: "Owner/Admin",
    primaryAction: "Probar",
    scope: "Workspace",
    statusLabel: "Configurado",
    statusTone: "green",
    summary: "Credencial principal para OpenAI.",
  },
  {
    detail: "Se usa únicamente cuando DeepSeek está habilitado como provider activo o fallback.",
    expandedActions: [
      { label: "Agregar o rotar", tone: "orange" },
      { label: "Limitar uso", tone: "blue" },
    ],
    fields: [
      { label: "Tipo", value: "API key" },
      { label: "Storage", value: "Workspace secret vault" },
      { label: "Uso", value: "Fallback" },
    ],
    id: "secret-deepseek",
    name: "DEEPSEEK_API_KEY",
    owner: "Admin",
    primaryAction: "Configurar",
    scope: "Workspace",
    statusLabel: "Pendiente",
    statusTone: "orange",
    summary: "Credencial para provider alternativo.",
  },
  {
    detail: "Credential set OAuth/client-secret para crear enlaces de pago, sincronizar ventas y administrar promociones.",
    expandedActions: [
      { label: "Rotar client secret", tone: "orange" },
      { label: "Mapear producto", tone: "blue" },
      { label: "Pausar integración", tone: "red" },
    ],
    fields: [
      { label: "Tipo", value: "OAuth client credentials" },
      { label: "Scopes", value: "products, sales, coupons, subscriptions" },
      { label: "Última sync", value: "Hace 16 min", tone: "green" },
    ],
    id: "secret-hotmart",
    name: "Hotmart credentials",
    owner: "Owner/Admin",
    primaryAction: "Probar",
    scope: "Workspace",
    statusLabel: "Listo",
    statusTone: "green",
    summary: "Credenciales comerciales para integración Hotmart.",
  },
];

const credentialHealthRows: ConfigTableRow[] = [
  {
    detail: "La prueba valida autenticación, permisos mínimos, cuotas y latencia de la última llamada.",
    expandedActions: [
      { label: "Ejecutar diagnóstico completo", tone: "blue" },
      { label: "Crear alerta", tone: "orange" },
    ],
    fields: [
      { label: "Latencia", value: "184 ms" },
      { label: "Permisos", value: "OK", tone: "green" },
      { label: "Cuota", value: "Dentro de rango", tone: "green" },
    ],
    id: "health-openai",
    name: "OpenAI health",
    owner: "Admin",
    primaryAction: "Retestar",
    scope: "Workspace",
    statusLabel: "OK",
    statusTone: "green",
    summary: "Última verificación de credenciales OpenAI.",
  },
  {
    detail: "Valida autorización, producto asociado, scopes comerciales y conectividad de webhooks.",
    expandedActions: [
      { label: "Reintentar webhook", tone: "blue" },
      { label: "Ver payload de prueba", tone: "slate" },
    ],
    fields: [
      { label: "OAuth", value: "OK", tone: "green" },
      { label: "Webhook", value: "Requiere firma", tone: "orange" },
      { label: "Producto", value: "Mapeado" },
    ],
    id: "health-hotmart",
    name: "Hotmart health",
    owner: "Owner/Admin",
    primaryAction: "Retestar",
    scope: "Workspace",
    statusLabel: "Atención",
    statusTone: "orange",
    summary: "Estado integral de credenciales y callbacks Hotmart.",
  },
];

const sensitiveAuditRows: ConfigTableRow[] = [
  {
    detail: "Cambio permitido, registrado y asociado al ticket interno de ajuste FinOps.",
    expandedActions: [
      { label: "Ver diff", tone: "blue" },
      { label: "Exportar evento", tone: "slate" },
    ],
    fields: [
      { label: "Antes", value: "OpenAI only" },
      { label: "Después", value: "OpenAI + DeepSeek fallback" },
      { label: "IP", value: "Workspace trusted range" },
    ],
    id: "audit-provider",
    name: "Cambio de fallback LLM",
    owner: "Diego Rojas",
    primaryAction: "Abrir",
    scope: "Runtime",
    statusLabel: "Auditado",
    statusTone: "green",
    summary: "Ajuste de provider alternativo realizado ayer.",
  },
  {
    detail: "Acción sensible: debe quedar visible como evento, pero el contenido del secreto jamás se revela.",
    expandedActions: [
      { label: "Ver política aplicada", tone: "blue" },
      { label: "Marcar revisión", tone: "orange" },
    ],
    fields: [
      { label: "Secreto", value: "OPENAI_API_KEY" },
      { label: "Método", value: "Rotación manual" },
      { label: "Resultado", value: "Correcto", tone: "green" },
    ],
    id: "audit-secret",
    name: "Rotación de secreto",
    owner: "Laura Méndez",
    primaryAction: "Abrir",
    scope: "Seguridad",
    statusLabel: "Auditado",
    statusTone: "green",
    summary: "Rotación de credencial principal completada.",
  },
];

const priceRows: ConfigTableRow[] = [
  {
    detail: "Precio base usado para estimaciones, presupuestos y reporting. La edición debe mantener historial porque afecta comparativos.",
    expandedActions: [
      { label: "Editar vigencia", tone: "orange" },
      { label: "Ver simulación", tone: "blue" },
    ],
    fields: [
      { label: "Input", value: "US$ 0.005 / 1K tokens" },
      { label: "Output", value: "US$ 0.015 / 1K tokens" },
      { label: "Fuente", value: "Tabla interna" },
    ],
    id: "price-blueprint",
    name: "Blueprint generation",
    owner: "Platform admin",
    primaryAction: "Editar",
    scope: "Plataforma",
    statusLabel: "Vigente",
    statusTone: "green",
    summary: "Base price para generación de blueprint.",
  },
  {
    detail: "Costo asociado a análisis, calibración y memoria ACP. Requiere edición con vigencia para evitar recalcular histórico.",
    expandedActions: [
      { label: "Editar vigencia", tone: "orange" },
      { label: "Comparar modelos", tone: "blue" },
    ],
    fields: [
      { label: "Input", value: "US$ 0.004 / 1K tokens" },
      { label: "Output", value: "US$ 0.012 / 1K tokens" },
      { label: "Aplica a", value: "ACP + Memory" },
    ],
    id: "price-acp",
    name: "ACP / Memory",
    owner: "Platform admin",
    primaryAction: "Editar",
    scope: "Plataforma",
    statusLabel: "Vigente",
    statusTone: "green",
    summary: "Precio base para capacidades ACP y memoria.",
  },
];

const budgetRows: ConfigTableRow[] = [
  {
    detail: "Presupuesto mensual acumulado de consumo LLM. Los umbrales controlan alertas, no bloqueos automáticos.",
    expandedActions: [
      { label: "Editar umbrales", tone: "orange" },
      { label: "Asignar owners", tone: "blue" },
    ],
    fields: [
      { label: "Budget", value: "US$ 1,200/mes" },
      { label: "Uso actual", value: "68%" },
      { label: "Umbrales", value: "70%, 85%, 95%" },
    ],
    id: "budget-workspace",
    name: "Workspace LLM mensual",
    owner: "Owner/Admin",
    primaryAction: "Editar",
    scope: "Workspace",
    statusLabel: "Saludable",
    statusTone: "green",
    summary: "Presupuesto global de consumo LLM.",
  },
  {
    detail: "Alerta específica para razonamiento avanzado; ayuda a detectar prompts costosos o modelos sobredimensionados.",
    expandedActions: [
      { label: "Ver proyectos asociados", tone: "blue" },
      { label: "Crear regla de bloqueo", tone: "orange" },
    ],
    fields: [
      { label: "Budget", value: "US$ 420/mes" },
      { label: "Uso actual", value: "82%" },
      { label: "Top consumidor", value: "Asistente soporte RR. HH." },
    ],
    id: "budget-reasoning",
    name: "Modelos reasoning",
    owner: "Admin FinOps",
    primaryAction: "Revisar",
    scope: "Workspace",
    statusLabel: "Atención",
    statusTone: "orange",
    summary: "Control dedicado a modelos de mayor costo.",
  },
];

const hotmartRows: ConfigTableRow[] = [
  {
    detail: "Configuración para generar enlaces de checkout según producto, oferta, moneda y trazabilidad interna.",
    expandedActions: [
      { label: "Mapear productos", tone: "blue" },
      { label: "Configurar metadata", tone: "orange" },
      { label: "Ver links recientes", tone: "slate" },
    ],
    fields: [
      { label: "Capacidad", value: "Payment links" },
      { label: "Estado backend", value: "Diseñado en plan Hotmart" },
      { label: "Dato requerido", value: "Producto/oferta/cupón" },
    ],
    id: "hotmart-payment-links",
    name: "Links de pago",
    owner: "Owner/Admin",
    primaryAction: "Abrir",
    scope: "Workspace",
    statusLabel: "Diseñado",
    statusTone: "blue",
    summary: "Generación parametrizable de links de checkout.",
  },
  {
    detail: "Administración de cupones, campañas y descuentos sincronizados con reglas comerciales internas.",
    expandedActions: [
      { label: "Crear promoción", tone: "blue" },
      { label: "Sincronizar cupones", tone: "orange" },
      { label: "Ver calendario", tone: "slate" },
    ],
    fields: [
      { label: "Capacidad", value: "Promociones/descuentos" },
      { label: "Estado backend", value: "Requiere módulo API" },
      { label: "Acordeón", value: "Reglas, vigencia y restricciones" },
    ],
    id: "hotmart-promotions",
    name: "Promociones",
    owner: "Admin comercial",
    primaryAction: "Abrir",
    scope: "Workspace",
    statusLabel: "Requiere API",
    statusTone: "orange",
    summary: "Gestión de descuentos y campañas Hotmart.",
  },
  {
    detail: "Sincroniza compradores, membresías, estado de acceso y eventos de comunidad hacia la plataforma.",
    expandedActions: [
      { label: "Ver mapeos", tone: "blue" },
      { label: "Reprocesar eventos", tone: "orange" },
      { label: "Pausar sync", tone: "red" },
    ],
    fields: [
      { label: "Capacidad", value: "Comunidad/suscripciones" },
      { label: "Última sync mock", value: "Hace 16 min" },
      { label: "Riesgo", value: "Webhooks y reconciliación", tone: "orange" },
    ],
    id: "hotmart-community",
    name: "Comunidad y accesos",
    owner: "Admin comercial",
    primaryAction: "Abrir",
    scope: "Workspace",
    statusLabel: "Parcial",
    statusTone: "orange",
    summary: "Sincronización de compradores y acceso comunitario.",
  },
];

const featureFlagRows: ConfigTableRow[] = [
  {
    detail: "Permite activar el dashboard de calibración para administradores sin exponerlo a todos los usuarios.",
    expandedActions: [
      { label: "Editar audiencia", tone: "blue" },
      { label: "Ver eventos", tone: "slate" },
    ],
    fields: [
      { label: "Audiencia", value: "Owner/Admin" },
      { label: "Scope", value: "Workspace" },
      { label: "Estado rollout", value: "100%", tone: "green" },
    ],
    id: "flag-estimation",
    name: "estimation_calibration_dashboard",
    owner: "Platform admin",
    primaryAction: "Toggle",
    scope: "Workspace",
    statusLabel: "Activo",
    statusTone: "green",
    summary: "Habilita analítica de calibración y estimaciones.",
  },
  {
    detail: "Feature flag nueva para separar el módulo Hotmart dentro de Settings sin activarlo a usuarios generales.",
    expandedActions: [
      { label: "Cambiar rollout", tone: "orange" },
      { label: "Limitar por rol", tone: "blue" },
    ],
    fields: [
      { label: "Audiencia", value: "Admin comercial" },
      { label: "Scope", value: "Workspace" },
      { label: "Estado rollout", value: "Beta", tone: "orange" },
    ],
    id: "flag-hotmart",
    name: "hotmart_admin",
    owner: "Platform admin",
    primaryAction: "Toggle",
    scope: "Workspace",
    statusLabel: "Beta",
    statusTone: "orange",
    summary: "Controla visibilidad de integración Hotmart admin.",
  },
];

const registryRows: ConfigTableRow[] = [
  {
    detail: "Registro global con modelos permitidos, defaults, capacidades y límites; solo editable por platform admin.",
    expandedActions: [
      { label: "Editar manifest", tone: "orange" },
      { label: "Ver compatibilidad", tone: "blue" },
    ],
    fields: [
      { label: "Modelos", value: "4 familias" },
      { label: "Default", value: "gpt-5" },
      { label: "Última revisión", value: "2026-08-08" },
    ],
    id: "registry-openai",
    name: "OpenAI registry",
    owner: "Platform admin",
    primaryAction: "Abrir",
    scope: "Plataforma",
    statusLabel: "Publicado",
    statusTone: "green",
    summary: "Catálogo global de modelos OpenAI permitidos.",
  },
  {
    detail: "Entrada para proveedor alternativo; el detalle conserva límites, regiones y modelos habilitados sin saturar la fila.",
    expandedActions: [
      { label: "Editar límites", tone: "orange" },
      { label: "Ver pruebas", tone: "blue" },
    ],
    fields: [
      { label: "Modelos", value: "2" },
      { label: "Default", value: "No" },
      { label: "Estado", value: "Habilitable por workspace", tone: "blue" },
    ],
    id: "registry-deepseek",
    name: "DeepSeek registry",
    owner: "Platform admin",
    primaryAction: "Abrir",
    scope: "Plataforma",
    statusLabel: "Disponible",
    statusTone: "blue",
    summary: "Catálogo de provider alternativo.",
  },
];

const artifactGovernanceRows: ConfigTableRow[] = [
  {
    detail: "Reglas de completitud, etiquetas y validación antes de exportar diagramas desde proyectos.",
    expandedActions: [
      { label: "Editar checklist", tone: "blue" },
      { label: "Ver fallos recientes", tone: "orange" },
    ],
    fields: [
      { label: "Aplica a", value: "Diagram Center" },
      { label: "Validaciones", value: "Nombres, pools, owners" },
      { label: "Modo", value: "Advertencia" },
    ],
    id: "governance-diagrams",
    name: "Gobierno de diagramas",
    owner: "Admin",
    primaryAction: "Configurar",
    scope: "Workspace",
    statusLabel: "Parcial",
    statusTone: "orange",
    summary: "Control de calidad para diagramas y flujos.",
  },
  {
    detail: "Reglas para documentos finales, publicación, exportación y trazabilidad de cambios.",
    expandedActions: [
      { label: "Editar plantillas", tone: "blue" },
      { label: "Revisar permisos", tone: "orange" },
    ],
    fields: [
      { label: "Aplica a", value: "Entregables" },
      { label: "Validaciones", value: "Estado, owner, revisión" },
      { label: "Modo", value: "Bloqueante en final" },
    ],
    id: "governance-artifacts",
    name: "Gobierno de entregables",
    owner: "Admin",
    primaryAction: "Configurar",
    scope: "Workspace",
    statusLabel: "Activo",
    statusTone: "green",
    summary: "Políticas de calidad para entregables.",
  },
];

const runtimeAuditRows: ConfigTableRow[] = [
  {
    detail: "Evento técnico de cambio en configuración de runtime. Mantiene diff, usuario y origen de solicitud.",
    expandedActions: [
      { label: "Ver diff técnico", tone: "blue" },
      { label: "Crear incidencia", tone: "orange" },
    ],
    fields: [
      { label: "Evento", value: "runtime.provider.updated" },
      { label: "Origen", value: "Settings admin" },
      { label: "Hace", value: "2 h" },
    ],
    id: "runtime-audit-provider",
    name: "Provider actualizado",
    owner: "Diego Rojas",
    primaryAction: "Abrir",
    scope: "Runtime",
    statusLabel: "Normal",
    statusTone: "green",
    summary: "Cambio de provider activo con auditoría completa.",
  },
  {
    detail: "Evento de sincronización Hotmart con conteo de registros, errores parciales y cursor de reconciliación.",
    expandedActions: [
      { label: "Ver payload resumido", tone: "blue" },
      { label: "Reprocesar lote", tone: "orange" },
    ],
    fields: [
      { label: "Evento", value: "hotmart.sync.completed" },
      { label: "Registros", value: "184" },
      { label: "Errores", value: "3 parciales", tone: "orange" },
    ],
    id: "runtime-audit-hotmart",
    name: "Sync Hotmart completada",
    owner: "Sistema",
    primaryAction: "Abrir",
    scope: "Integraciones",
    statusLabel: "Atención",
    statusTone: "orange",
    summary: "Sincronización comercial con advertencias menores.",
  },
];

function statusCopy(status: CapabilityStatus) {
  if (status === "available") {
    return { label: "Disponible hoy", tone: "green" as const };
  }
  if (status === "partial") {
    return { label: "Parcial", tone: "orange" as const };
  }
  return { label: "Requiere desarrollo", tone: "slate" as const };
}

function FilterRail() {
  return (
    <Panel className="p-4">
      <div className="mb-4 flex items-center gap-2">
        <Search className="h-4 w-4 text-[var(--text-muted)]" />
        <p className="text-[14px] font-semibold text-[var(--text-primary)]">Filtros administrativos</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <SelectField
          label="Periodo"
          value="30d"
          options={[
            { label: "Últimos 7 días", value: "7d" },
            { label: "Últimos 30 días", value: "30d" },
            { label: "Mes actual", value: "month" },
            { label: "Todo", value: "all" },
          ]}
          disabled
        />
        <TextField label="Usuario" value="" placeholder="Todos" readOnly />
        <TextField label="Proyecto" value="" placeholder="Todos" readOnly />
        <TextField label="Proveedor" value="" placeholder="Todos" readOnly />
        <TextField label="Modelo" value="" placeholder="Todos" readOnly />
        <SelectField
          label="Etapa"
          value="all"
          options={[
            { label: "Todas", value: "all" },
            { label: "Descubrir", value: "discover" },
            { label: "Definir", value: "define" },
            { label: "Diseñar", value: "design" },
            { label: "Memoria", value: "memory" },
          ]}
          disabled
        />
      </div>
    </Panel>
  );
}

function InsightCard({
  detail,
  icon: Icon,
  label,
  tone,
}: {
  detail: string;
  icon: LucideIcon;
  label: string;
  tone: BadgeTone;
}) {
  return (
    <div className="rounded-[18px] border border-[var(--border-default)] bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[var(--surface-subtle)] text-[var(--brand-primary)]">
          <Icon className="h-4 w-4" />
        </span>
        <Badge tone={tone}>{tone === "red" ? "Atención" : tone === "orange" ? "Revisar" : "OK"}</Badge>
      </div>
      <p className="mt-4 text-[14px] font-semibold text-[var(--text-primary)]">{label}</p>
      <p className="mt-2 text-[12px] leading-5 text-[var(--text-secondary)]">{detail}</p>
    </div>
  );
}

function OverviewSection() {
  return (
    <div className="space-y-5">
      <FilterRail />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {OVERVIEW_KPIS.map((item) => (
          <KpiCard key={item.label} item={item} />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        <Panel className="p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[20px] font-semibold text-[var(--text-primary)]">¿Está creciendo y cómo se está usando?</p>
              <p className="mt-1 text-[13px] leading-6 text-[var(--text-secondary)]">
                Vista combinada de usuarios activos, proyectos creados y consumo LLM. El objetivo es detectar crecimiento útil, no solo volumen.
              </p>
            </div>
            <Badge tone="blue">30 días</Badge>
          </div>
          <MultiSeriesChart
            className="h-[280px]"
            series={[
              { color: "#4f46f5", values: [18, 21, 23, 24, 29, 33, 37, 42] },
              { color: "#16a34a", values: [11, 14, 15, 18, 22, 25, 27, 31] },
              { color: "#f59e0b", values: [22, 29, 31, 34, 41, 53, 61, 73] },
            ]}
          />
          <div className="mt-4 flex flex-wrap gap-3 text-[12px] text-[var(--text-secondary)]">
            <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#4f46f5]" /> Proyectos</span>
            <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#16a34a]" /> Usuarios activos</span>
            <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#f59e0b]" /> Costo LLM indexado</span>
          </div>
        </Panel>

        <Panel className="p-5">
          <div className="mb-4">
            <p className="text-[20px] font-semibold text-[var(--text-primary)]">Señales ejecutivas</p>
            <p className="mt-1 text-[13px] leading-6 text-[var(--text-secondary)]">Lecturas accionables para decidir dónde mirar primero.</p>
          </div>
          <div className="grid gap-3">
            <InsightCard
              icon={TrendingUp}
              label="El uso crece más rápido que el número de proyectos"
              detail="Conviene revisar si hay proyectos intensivos en razonamiento o retries de modelos costosos."
              tone="orange"
            />
            <InsightCard
              icon={Gauge}
              label="Error rate bajo, pero Codex local necesita smoke test"
              detail="El runtime está usable, pero la autenticación local aparece como punto de control operativo."
              tone="orange"
            />
            <InsightCard
              icon={CheckCircle2}
              label="Proyectos finalizados aumentan sin degradar alertas"
              detail="La plataforma muestra crecimiento con señales FinOps controladas."
              tone="green"
            />
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel className="p-5 xl:col-span-1">
          <p className="text-[18px] font-semibold text-[var(--text-primary)]">Consumo por proveedor/modelo</p>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">Participación por costo LLM.</p>
          <div className="mt-5">
            <DonutChart centerLabel="grupos" centerValue="4" segments={providerBreakdown} size={190} />
          </div>
          <div className="mt-5 space-y-2">
            {providerBreakdown.map((item) => (
              <StatRow key={item.label} label={item.label} value={`${item.value}%`} tone="blue" />
            ))}
          </div>
        </Panel>

        <Panel className="p-5 xl:col-span-2">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[18px] font-semibold text-[var(--text-primary)]">¿Dónde están los proyectos?</p>
              <p className="mt-1 text-[13px] text-[var(--text-secondary)]">Distribución de proyectos por fase/etapa para detectar cuellos de botella.</p>
            </div>
            <Badge tone="violet">42 proyectos</Badge>
          </div>
          <BarsByDimension items={stageDistribution} />
        </Panel>
      </div>
    </div>
  );
}

function LlmSection() {
  return (
    <div className="space-y-5">
      <FilterRail />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {LLM_METRICS.map((metric) => {
          const Icon = metric.icon;
          return (
          <Panel key={metric.label} className="p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[12px] text-[var(--text-secondary)]">{metric.label}</p>
              <Icon className="h-4 w-4 text-[var(--brand-primary)]" />
            </div>
            <p className="mt-4 text-[22px] font-semibold text-[var(--text-primary)]">{metric.value}</p>
            <Badge className="mt-3" tone={metric.tone}>{metric.detail}</Badge>
          </Panel>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <Panel className="p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[20px] font-semibold text-[var(--text-primary)]">Evolución de consumo LLM</p>
              <p className="mt-1 text-[13px] text-[var(--text-secondary)]">Costos y tokens normalizados por día.</p>
            </div>
            <Badge tone="green">Ledger FinOps</Badge>
          </div>
          <MultiSeriesChart
            className="h-[260px]"
            series={[
              { color: "#2563eb", values: [18, 27, 23, 36, 41, 57, 63, 70] },
              { color: "#16a34a", values: [28, 34, 39, 48, 52, 58, 69, 83] },
            ]}
          />
        </Panel>

        <Panel className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[20px] font-semibold text-[var(--text-primary)]">Presupuestos y alertas</p>
              <p className="mt-1 text-[13px] text-[var(--text-secondary)]">Control por workspace, usuario, etapa, provider o modelo.</p>
            </div>
            <Badge tone="orange">2 alertas</Badge>
          </div>
          <div className="space-y-4">
            {[
              ["Workspace mensual", 68, "US$ 428.63 / US$ 630", "green"],
              ["OpenAI reasoning", 82, "US$ 247.18 / US$ 300", "orange"],
              ["Etapa Memoria", 41, "US$ 51.22 / US$ 125", "green"],
            ].map(([label, percent, detail, tone]) => (
              <div key={String(label)} className="rounded-[18px] border border-[var(--border-default)] bg-white p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-[14px] font-semibold text-[var(--text-primary)]">{label}</p>
                  <Badge tone={tone as BadgeTone}>{percent}%</Badge>
                </div>
                <ProgressBar value={Number(percent)} color={tone === "orange" ? "var(--warning)" : "var(--success)"} />
                <p className="mt-2 text-[12px] text-[var(--text-secondary)]">{detail}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[20px] font-semibold text-[var(--text-primary)]">Detalle por provider/modelo</p>
            <p className="mt-1 text-[13px] text-[var(--text-secondary)]">Ayuda a identificar qué proveedor genera mayor consumo y costo.</p>
          </div>
          <AppButton icon={<RefreshCcw className="h-4 w-4" />}>Refrescar</AppButton>
        </div>
        <SimpleTable columns={["Provider", "Modelo", "Tokens", "Costo", "Llamadas", "Estado"]} rows={llmRows} />
      </Panel>

      <SourceNote>
        Base disponible hoy: `GET /api/v1/finops/llm/summary`, `provider-breakdown`, `top-consumers`, `alerts`, `budgets` y `usage`.
        Para series temporales agregadas conviene agregar endpoint de buckets diarios/semanales para no cargar el ledger completo en frontend.
      </SourceNote>
    </div>
  );
}

function ProjectsSection() {
  return (
    <div className="space-y-5">
      <FilterRail />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          ["Total proyectos", "42", "39 activos + archivados", "blue"],
          ["Activos", "18", "En construcción o revisión", "green"],
          ["Finalizados", "6", "Listos/exportados", "violet"],
          ["Atención", "5", "Requieren decisión", "orange"],
          ["Progreso medio", "57%", "Sobre proyectos activos", "slate"],
        ].map(([label, value, detail, tone]) => (
          <Panel key={label} className="p-4">
            <p className="text-[12px] text-[var(--text-secondary)]">{label}</p>
            <p className="mt-3 text-[26px] font-semibold text-[var(--text-primary)]">{value}</p>
            <Badge className="mt-3" tone={tone as BadgeTone}>{detail}</Badge>
          </Panel>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Panel className="p-5">
          <p className="text-[20px] font-semibold text-[var(--text-primary)]">Distribución por etapa</p>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">Vista para detectar acumulaciones por fase.</p>
          <div className="mt-5">
            <BarsByDimension items={stageDistribution} />
          </div>
        </Panel>
        <Panel className="p-5">
          <p className="text-[20px] font-semibold text-[var(--text-primary)]">Actividad del portafolio</p>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">Creación y cierres por semana.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-[18px] border border-[var(--border-default)] bg-white p-4">
              <p className="text-[13px] font-semibold text-[var(--text-primary)]">Nuevos proyectos</p>
              <MiniBarChart className="mt-5" values={[2, 3, 4, 6, 5, 7, 9]} />
            </div>
            <div className="rounded-[18px] border border-[var(--border-default)] bg-white p-4">
              <p className="text-[13px] font-semibold text-[var(--text-primary)]">Proyectos finalizados</p>
              <MiniBarChart className="mt-5" values={[0, 1, 2, 1, 3, 4, 6]} />
            </div>
          </div>
        </Panel>
      </div>

      <Panel className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[20px] font-semibold text-[var(--text-primary)]">Proyectos recientes</p>
            <p className="mt-1 text-[13px] text-[var(--text-secondary)]">Tabla operativa con estado, etapa, dueño y última actividad.</p>
          </div>
          <AppButton icon={<FolderKanban className="h-4 w-4" />}>Abrir portafolio</AppButton>
        </div>
        <SimpleTable columns={["Proyecto", "Etapa", "Estado", "Progreso", "Rol", "Actividad"]} rows={projectRows} />
      </Panel>

      <SourceNote status="partial">
        Base disponible hoy: `GET /api/v1/sessions` devuelve proyectos, estado, etapa actual, owner, progreso y facets.
        Requiere desarrollo adicional para agregados históricos de crecimiento, proyectos finalizados por periodo y distribución global por etapa sin paginar.
      </SourceNote>
    </div>
  );
}

function UsersSection() {
  return (
    <div className="space-y-5">
      <Panel className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge tone="orange">Nuevo módulo requerido</Badge>
            <p className="mt-3 text-[24px] font-semibold text-[var(--text-primary)]">Administración de usuarios</p>
            <p className="mt-2 max-w-3xl text-[14px] leading-6 text-[var(--text-secondary)]">
              Pantalla dedicada para revisar usuarios registrados, membresías, estado, actividad y consumo. No debe mezclarse con preferencias personales ni runtime.
            </p>
          </div>
          <AppButton icon={<Users className="h-4 w-4" />} variant="primary">Invitar usuario</AppButton>
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {USER_METRICS.map((metric) => {
          const Icon = metric.icon;
          return (
          <Panel key={metric.label} className="p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[12px] text-[var(--text-secondary)]">{metric.label}</p>
              <Icon className="h-4 w-4 text-[var(--brand-primary)]" />
            </div>
            <p className="mt-3 text-[26px] font-semibold text-[var(--text-primary)]">{metric.value}</p>
            <Badge className="mt-3" tone={metric.tone}>{metric.detail}</Badge>
          </Panel>
          );
        })}
      </div>

      <Panel className="p-5">
        <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_220px]">
          <TextField label="Buscar usuario" placeholder="Nombre o email" value="" readOnly trailing={<Search className="h-4 w-4" />} />
          <SelectField label="Rol" value="all" options={[{ label: "Todos", value: "all" }, { label: "Owner", value: "owner" }, { label: "Admin", value: "admin" }]} disabled />
          <SelectField label="Estado" value="all" options={[{ label: "Todos", value: "all" }, { label: "Activo", value: "active" }, { label: "Invitado", value: "invited" }]} disabled />
        </div>
        <SimpleTable columns={["Usuario", "Email", "Rol", "Estado", "Actividad", "Último acceso"]} rows={userRows} />
      </Panel>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel className="p-5">
          <p className="text-[20px] font-semibold text-[var(--text-primary)]">Crecimiento de usuarios</p>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">Altas y usuarios activos por semana.</p>
          <MultiSeriesChart
            className="mt-5 h-[240px]"
            series={[
              { color: "#4f46f5", values: [12, 17, 19, 22, 27, 34, 41, 48] },
              { color: "#16a34a", values: [8, 11, 13, 18, 21, 25, 27, 31] },
            ]}
          />
        </Panel>
        <Panel className="p-5">
          <p className="text-[20px] font-semibold text-[var(--text-primary)]">Información administrativa recomendada</p>
          <div className="mt-4 space-y-3">
            <StatRow label="Identidad" value="Nombre, email, estado, verificación" tone="blue" />
            <StatRow label="Workspace" value="Membresía, rol, activo/inactivo" tone="violet" />
            <StatRow label="Actividad" value="Último acceso, proyectos, consumo LLM" tone="green" />
            <StatRow label="Seguridad" value="Tokens activos, invitaciones, bloqueos" tone="orange" />
          </div>
        </Panel>
      </div>

      <SourceNote status="gap">
        Hoy el frontend solo recibe `AuthUser` del usuario actual y sus `workspaces`. Existen tablas backend `users`, `workspace_memberships`,
        `auth_tokens` y `platform_role_assignments`, pero falta API admin para listar/editar usuarios, roles, estado e invitaciones.
      </SourceNote>
    </div>
  );
}

function RolesSection() {
  return (
    <div className="space-y-5">
      <Panel className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge tone="blue">Separado de configuración general</Badge>
            <p className="mt-3 text-[24px] font-semibold text-[var(--text-primary)]">Roles y permisos</p>
            <p className="mt-2 max-w-3xl text-[14px] leading-6 text-[var(--text-secondary)]">
              La experiencia separa membresías actuales de una futura matriz granular de permisos. Así el sistema puede crecer sin convertir Settings en una lista caótica de toggles.
            </p>
          </div>
          <AppButton icon={<ShieldCheck className="h-4 w-4" />}>Crear rol custom</AppButton>
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <Panel className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-[20px] font-semibold text-[var(--text-primary)]">Roles actuales y evolución</p>
            <Badge tone="green">WorkspaceRole existe</Badge>
          </div>
          <SimpleTable columns={["Rol", "Propósito", "Alcance", "Estado"]} rows={roleRows} />
        </Panel>

        <Panel className="p-5">
          <p className="text-[20px] font-semibold text-[var(--text-primary)]">Matriz de permisos propuesta</p>
          <p className="mt-1 text-[13px] leading-6 text-[var(--text-secondary)]">
            Progresiva: primero roles estándar, luego permisos por dominio/capacidad.
          </p>
          <div className="mt-5 space-y-4">
            {[
              ["Runtime LLM", ["Owner", "Admin"], "Editar provider, secretos y diagnóstico"],
              ["FinOps", ["Owner", "Admin"], "Presupuestos, alertas, costos y consumo"],
              ["Proyectos", ["Owner", "Admin", "Editor"], "Crear, editar y gestionar portfolio"],
              ["Auditoría", ["Owner", "Admin", "Platform"], "Ver cambios sensibles y trazas"],
              ["Usuarios", ["Owner", "Admin"], "Invitar, activar, cambiar rol"],
            ].map(([domain, roles, detail]) => (
              <div key={String(domain)} className="rounded-[18px] border border-[var(--border-default)] bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[14px] font-semibold text-[var(--text-primary)]">{domain}</p>
                  <div className="flex flex-wrap gap-2">
                    {(roles as string[]).map((role) => <Badge key={`${domain}-${role}`} tone="slate">{role}</Badge>)}
                  </div>
                </div>
                <p className="mt-2 text-[12px] leading-5 text-[var(--text-secondary)]">{detail}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel className="p-5">
        <p className="text-[20px] font-semibold text-[var(--text-primary)]">Diseño de escalabilidad</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <KeyValue label="Fase 1" value="Roles estándar" hint="owner/admin/editor/viewer y platform roles ya modelados." />
          <KeyValue label="Fase 2" value="Asignaciones administrables" hint="CRUD de usuarios, membresías e invitaciones." />
          <KeyValue label="Fase 3" value="Permisos granulares" hint="Matriz por dominio: runtime, FinOps, proyectos, integraciones." />
        </div>
      </Panel>

      <SourceNote status="partial">
        Disponible hoy: enums `WorkspaceRole` y `PlatformRole`, memberships en backend y checks de autorización en servicios.
        Falta capa API/UI para administración de usuarios, asignación de roles y permisos granulares.
      </SourceNote>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Retained temporarily as an extraction anchor while the mockup migrates to shared primitives.
function ConfigAccordionTable({
  description,
  rows,
  title,
}: {
  description: string;
  rows: ConfigTableRow[];
  title: string;
}) {
  const [expandedRow, setExpandedRow] = useState(rows[0]?.id ?? "");

  return (
    <Panel className="p-0">
      <div className="border-b border-[var(--border-default)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[20px] font-semibold text-[var(--text-primary)]">{title}</p>
            <p className="mt-1 max-w-3xl text-[13px] leading-6 text-[var(--text-secondary)]">{description}</p>
          </div>
          <Badge tone="violet">Tabla + acordeón</Badge>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[var(--border-default)] bg-[var(--surface-subtle)] text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              <th className="px-5 py-3 font-semibold">Configuración</th>
              <th className="px-5 py-3 font-semibold">Estado</th>
              <th className="px-5 py-3 font-semibold">Alcance</th>
              <th className="px-5 py-3 font-semibold">Responsable</th>
              <th className="px-5 py-3 font-semibold">Acción visible</th>
              <th className="px-5 py-3 text-right font-semibold">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isExpanded = expandedRow === row.id;
              return (
                <Fragment key={row.id}>
                  <tr className="border-b border-[var(--border-subtle)] bg-white align-top">
                    <td className="px-5 py-4">
                      <p className="text-[14px] font-semibold text-[var(--text-primary)]">{row.name}</p>
                      <p className="mt-1 max-w-lg text-[12px] leading-5 text-[var(--text-secondary)]">{row.summary}</p>
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={row.statusTone}>{row.statusLabel}</Badge>
                    </td>
                    <td className="px-5 py-4 text-[12px] font-medium text-[var(--text-secondary)]">{row.scope}</td>
                    <td className="px-5 py-4 text-[12px] font-medium text-[var(--text-secondary)]">{row.owner}</td>
                    <td className="px-5 py-3">
                      <AppButton className="h-9 px-3 text-[12px]" variant="ghost">
                        {row.primaryAction}
                      </AppButton>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? `Contraer ${row.name}` : `Expandir ${row.name}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-[12px] border border-[var(--border-default)] bg-white text-[var(--brand-primary)] transition hover:bg-[var(--brand-soft)]"
                        type="button"
                        onClick={() => setExpandedRow(isExpanded ? "" : row.id)}
                      >
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                    </td>
                  </tr>
                  {isExpanded ? (
                    <tr className="border-b border-[var(--border-default)] bg-[var(--surface-subtle)]">
                      <td className="px-5 py-4" colSpan={6}>
                        <div className="grid gap-4 rounded-[18px] border border-[var(--border-default)] bg-white p-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                          <div>
                            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                              Detalle secundario
                            </p>
                            <p className="mt-2 text-[13px] leading-6 text-[var(--text-secondary)]">{row.detail}</p>
                            <div className="mt-4 grid gap-3 md:grid-cols-3">
                              {row.fields.map((field) => (
                                <div key={`${row.id}-${field.label}`} className="rounded-[14px] border border-[var(--border-default)] bg-[var(--surface-subtle)] px-3 py-3">
                                  <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">{field.label}</p>
                                  <p className="mt-1 text-[13px] font-semibold text-[var(--text-primary)]">
                                    {field.tone ? <Badge tone={field.tone}>{field.value}</Badge> : field.value}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                              Acciones al expandir
                            </p>
                            <div className="mt-3 flex flex-col gap-2">
                              {row.expandedActions.map((action) => (
                                <AppButton
                                  key={`${row.id}-${action.label}`}
                                  className={cn(
                                    "h-10 justify-start px-3 text-[12px]",
                                    action.tone === "red" && "text-[var(--danger)]",
                                    action.tone === "orange" && "text-[var(--warning)]",
                                    action.tone === "blue" && "text-[var(--info)]",
                                  )}
                                  variant="secondary"
                                >
                                  {action.label}
                                </AppButton>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function WorkspaceConfigForm() {
  return (
    <SharedConfigFormPanel
      actions={<AppButton icon={<ServerCog className="h-4 w-4" />}>Guardar cambios</AppButton>}
      description="Configuración singleton: conviene formulario porque representa una entidad única del workspace, no una colección de registros."
      eyebrow="Formulario"
      title="Perfil administrativo del workspace"
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <TextField defaultValue="Lean Builder Admin" disabled label="Nombre del workspace" />
        <TextField defaultValue="Plan Business / Admin console" disabled label="Plan y acceso" />
        <SelectField
          defaultValue="active"
          disabled
          label="Estado"
          options={[
            { label: "Activo", value: "active" },
            { label: "Pausado", value: "paused" },
          ]}
        />
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <KeyValue label="Owner actual" value="Laura Méndez" hint="Administración total del workspace." />
        <KeyValue label="Usuarios" value="24 registrados" hint="Incluye activos, invitados e inactivos." />
        <KeyValue label="Última actividad" value="Hoy 09:12" hint="Señal operativa para overview." />
      </div>
    </SharedConfigFormPanel>
  );
}

function RuntimeConfigForm() {
  return (
    <SharedConfigFormPanel
      actions={
        <>
          <AppButton icon={<RefreshCcw className="h-4 w-4" />}>Probar runtime</AppButton>
          <AppButton icon={<ShieldCheck className="h-4 w-4" />} variant="primary">Aplicar</AppButton>
        </>
      }
      description="El provider activo, el fallback y los límites principales son configuración singleton; los proveedores individuales viven en tabla."
      eyebrow="Formulario"
      title="Runtime LLM activo"
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <SelectField
          defaultValue="openai"
          disabled
          label="Provider principal"
          options={[
            { label: "OpenAI", value: "openai" },
            { label: "DeepSeek", value: "deepseek" },
          ]}
        />
        <SelectField
          defaultValue="deepseek"
          disabled
          label="Fallback"
          options={[
            { label: "DeepSeek", value: "deepseek" },
            { label: "Sin fallback", value: "none" },
          ]}
        />
        <TextField defaultValue="US$ 1,200 / mes" disabled label="Budget asociado" />
      </div>
      <SourceNote>
        La acción visible debe ser probar/aplicar runtime. La configuración avanzada de modelos, límites, endpoints y costos se consulta en
        acordeón dentro de Providers.
      </SourceNote>
    </SharedConfigFormPanel>
  );
}

function ConfigContent({ subTabKey, tabKey }: { subTabKey: string; tabKey: ConfigTabKey }) {
  switch (`${tabKey}:${subTabKey}`) {
    case "general:workspace":
      return <WorkspaceConfigForm />;
    case "general:preferences":
      return (
        <SharedConfigAccordionTable
          description="Preferencias repetibles o versionables se administran como tabla; los overrides, impactos y restauración quedan en acordeón."
          rows={preferenceRows}
          title="Preferencias administrativas"
        />
      );
    case "general:privacy":
      return (
        <SharedConfigAccordionTable
          description="Consentimientos y retención tienen estado, versión y responsable. El detalle conserva evidencia y políticas asociadas."
          rows={privacyRows}
          title="Privacidad, consentimiento y retención"
        />
      );
    case "llmRuntime:runtime":
      return <RuntimeConfigForm />;
    case "llmRuntime:providers":
      return (
        <SharedConfigAccordionTable
          description="Cada provider es una fila operativa. La fila muestra estado y acción primaria; el acordeón muestra modelos, secretos, fallback y límites."
          rows={providerRows}
          title="Providers y modelos LLM"
        />
      );
    case "llmRuntime:backends":
      return (
        <SharedConfigAccordionTable
          description="Los backends se tratan como servicios administrables: estado visible, detalle técnico y acciones de operación al expandir."
          rows={backendRows}
          title="Backends agentic, knowledge y CLI"
        />
      );
    case "security:secrets":
      return (
        <SharedConfigAccordionTable
          description="Los secretos se listan como referencias seguras. Rotación, revocación y auditoría viven en detalle expandible."
          rows={secretRows}
          title="Secretos y credenciales"
        />
      );
    case "security:health":
      return (
        <SharedConfigAccordionTable
          description="Los health checks son registros operativos comparables; se muestran en tabla con diagnóstico extendido en acordeón."
          rows={credentialHealthRows}
          title="Health de credenciales"
        />
      );
    case "security:audit":
      return (
        <SharedConfigAccordionTable
          description="Los eventos sensibles deben ser escaneables. El acordeón contiene diff, evidencia, IP, políticas y acciones de revisión."
          rows={sensitiveAuditRows}
          title="Auditoría de acciones sensibles"
        />
      );
    case "commerce:prices":
      return (
        <SharedConfigAccordionTable
          description="Los precios base son múltiples registros con vigencia; por eso funcionan mejor como tabla editable con historial al expandir."
          rows={priceRows}
          title="Precios base y costos por capacidad"
        />
      );
    case "commerce:budgets":
      return (
        <SharedConfigAccordionTable
          description="Presupuestos y alertas son configuraciones repetibles con umbrales; la tabla permite comparar uso y estado rápidamente."
          rows={budgetRows}
          title="Budgets, umbrales y alertas FinOps"
        />
      );
    case "commerce:hotmart":
      return (
        <SharedConfigAccordionTable
          description="Hotmart se administra como integración comercial modular: links, promociones, comunidad y sync, con acciones avanzadas al expandir."
          rows={hotmartRows}
          title="Integración Hotmart"
        />
      );
    case "governance:flags":
      return (
        <SharedConfigAccordionTable
          description="Los flags son registros homogéneos con estado, audiencia y scope; el detalle concentra rollout, eventos y restricciones."
          rows={featureFlagRows}
          title="Feature flags administrativos"
        />
      );
    case "governance:registry":
      return (
        <SharedConfigAccordionTable
          description="El registry global es una tabla de entradas versionables. Las ediciones sensibles se reservan a platform admin."
          rows={registryRows}
          title="Platform registry"
        />
      );
    case "governance:artifacts":
      return (
        <SharedConfigAccordionTable
          description="Diagramas y entregables comparten reglas de calidad y publicación; el detalle contiene checklists y permisos avanzados."
          rows={artifactGovernanceRows}
          title="Gobierno de diagramas y entregables"
        />
      );
    case "governance:runtimeAudit":
      return (
        <SharedConfigAccordionTable
          description="Los eventos de runtime se consultan como bitácora operativa con detalle técnico expandible para no saturar la vista principal."
          rows={runtimeAuditRows}
          title="Auditoría runtime"
        />
      );
    default:
      return <WorkspaceConfigForm />;
  }
}

function ConfigurationSection() {
  const [activeTabKey, setActiveTabKey] = useState<ConfigTabKey>("general");
  const [activeSubTabs, setActiveSubTabs] = useState(DEFAULT_CONFIG_SUBTABS);
  const activeTab = CONFIG_TABS.find((tab) => tab.key === activeTabKey) ?? CONFIG_TABS[0];
  const activeSubTabKey = activeSubTabs[activeTabKey] ?? activeTab.subTabs[0]?.key ?? "";
  const activeSubTab = activeTab.subTabs.find((subTab) => subTab.key === activeSubTabKey) ?? activeTab.subTabs[0];
  const ActiveIcon = activeTab.icon;
  const activeCopy = statusCopy(activeTab.status);

  return (
    <div className="space-y-5">
      <Panel className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge tone="violet">Configuraciones → Tab funcional → Sub-tab → Tabla/Formulario → Acordeón</Badge>
            <p className="mt-3 text-[24px] font-semibold text-[var(--text-primary)]">Configuraciones como consola administrativa</p>
            <p className="mt-2 max-w-3xl text-[14px] leading-6 text-[var(--text-secondary)]">
              Las funcionalidades existentes dejan de competir como tarjetas independientes y pasan a una navegación jerárquica, escalable y operativa.
            </p>
          </div>
          <AppButton icon={<ServerCog className="h-4 w-4" />}>Refrescar plataforma</AppButton>
        </div>
      </Panel>

      <FunctionalTabRail
        activeTab={activeTabKey}
        countLabel={`${CONFIG_TABS.length} dominios`}
        description="Selecciona un dominio para administrar su configuración."
        onChange={setActiveTabKey}
        tabs={CONFIG_TABS}
      />

      <div className="space-y-5" id="configuration-panel" role="tabpanel">
        <Panel className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-[var(--brand-primary)] text-white">
                <ActiveIcon className="h-4 w-4" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[20px] font-semibold text-[var(--text-primary)]">{activeTab.label}</p>
                  <Badge tone={activeCopy.tone}>{activeCopy.label}</Badge>
                </div>
                <p className="mt-1 text-[13px] leading-6 text-[var(--text-secondary)]">
                  Configuraciones → {activeTab.label} → {activeSubTab?.label}
                </p>
              </div>
            </div>
            <Badge tone="slate">{activeTab.subTabs.length} sub-tabs</Badge>
          </div>

          <div className="mt-5">
            <ContextSubTabs
              activeSubTab={activeSubTabKey}
              onChange={(subTabKey) =>
                setActiveSubTabs((current) => ({
                  ...current,
                  [activeTabKey]: subTabKey,
                }))
              }
              tabs={activeTab.subTabs}
            />
          </div>
          <p className="mt-3 text-[12px] leading-5 text-[var(--text-secondary)]">{activeSubTab?.description}</p>
        </Panel>

        <ConfigContent subTabKey={activeSubTabKey} tabKey={activeTabKey} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel className="p-5">
          <p className="text-[20px] font-semibold text-[var(--text-primary)]">Criterio de organización aplicado</p>
          <p className="mt-1 text-[13px] leading-6 text-[var(--text-secondary)]">
            La vista separa configuración singleton, colecciones administrables y detalles secundarios para que el administrador escanee primero y profundice después.
          </p>
          <div className="mt-5 grid gap-3">
            {PROPOSED_NAVIGATION.slice(0, 4).map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-3 rounded-[18px] border border-[var(--border-default)] bg-white p-4">
                  <Icon className="h-4 w-4 text-[var(--brand-primary)]" />
                  <div>
                    <p className="text-[14px] font-semibold text-[var(--text-primary)]">{item.label}</p>
                    <p className="mt-1 text-[12px] text-[var(--text-secondary)]">{item.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel className="p-5">
          <p className="text-[20px] font-semibold text-[var(--text-primary)]">Acciones visibles vs. expandidas</p>
          <p className="mt-1 text-[13px] leading-6 text-[var(--text-secondary)]">
            Solo queda visible la acción operativa primaria. Lo destructivo, avanzado o contextual vive dentro del acordeón con permisos y auditoría.
          </p>
          <div className="mt-5 space-y-3">
            <StatRow label="Visible" value="Probar, abrir, editar básico" tone="blue" />
            <StatRow label="Acordeón" value="Rotar, revocar, mapear, reprocesar" tone="orange" />
            <StatRow label="Formulario" value="Workspace y runtime activo" tone="green" />
            <StatRow label="Tabla" value="Providers, secretos, precios, flags" tone="violet" />
            <StatRow label="Permiso alto" value="Registry/precios/secretos" tone="red" />
          </div>
        </Panel>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Retained temporarily as a legacy comparison anchor during the shared-primitives migration.
function LegacyConfigurationSection() {
  const [activeTabKey, setActiveTabKey] = useState<ConfigTabKey>("general");
  const [activeSubTabs, setActiveSubTabs] = useState(DEFAULT_CONFIG_SUBTABS);
  const activeTab = CONFIG_TABS.find((tab) => tab.key === activeTabKey) ?? CONFIG_TABS[0];
  const activeSubTabKey = activeSubTabs[activeTabKey] ?? activeTab.subTabs[0]?.key ?? "";
  const activeSubTab = activeTab.subTabs.find((subTab) => subTab.key === activeSubTabKey) ?? activeTab.subTabs[0];
  const ActiveIcon = activeTab.icon;
  const activeCopy = statusCopy(activeTab.status);

  return (
    <div className="space-y-5">
      <Panel className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge tone="violet">Configuraciones → Tab funcional → Sub-tab → Tabla/Formulario → Acordeón</Badge>
            <p className="mt-3 text-[24px] font-semibold text-[var(--text-primary)]">Configuraciones como consola administrativa</p>
            <p className="mt-2 max-w-3xl text-[14px] leading-6 text-[var(--text-secondary)]">
              Las funcionalidades existentes dejan de competir como tarjetas independientes y pasan a una navegación jerárquica, escalable y operativa.
            </p>
          </div>
          <AppButton icon={<ServerCog className="h-4 w-4" />}>Refrescar plataforma</AppButton>
        </div>
      </Panel>

      <div className="space-y-5">
        <Panel className="overflow-hidden p-0">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--border-default)] px-5 py-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Tabs funcionales</p>
              <p className="mt-1 text-[12px] text-[var(--text-secondary)]">Selecciona un dominio para administrar su configuración.</p>
            </div>
            <Badge tone="slate">{CONFIG_TABS.length} dominios</Badge>
          </div>
          <div className="p-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5" role="tablist" aria-label="Tabs funcionales de configuración">
              {CONFIG_TABS.map((tab) => {
                const Icon = tab.icon;
                const selected = tab.key === activeTabKey;
                const copy = statusCopy(tab.status);
                return (
                  <button
                    key={tab.key}
                    aria-selected={selected}
                    aria-controls="configuration-panel"
                    className={cn(
                      "group flex h-[84px] min-w-0 w-full items-center gap-3 rounded-[16px] border px-3 py-2.5 text-left transition",
                      selected
                        ? "border-[rgba(79,70,245,0.28)] bg-[var(--brand-soft)]"
                        : "border-transparent bg-transparent hover:border-[var(--border-default)] hover:bg-[var(--surface-subtle)]",
                    )}
                    role="tab"
                    type="button"
                    onClick={() => setActiveTabKey(tab.key)}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px]",
                        selected ? "bg-[var(--brand-primary)] text-white" : "bg-white text-[var(--brand-primary)]",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col items-start justify-center gap-1">
                      <span className="max-w-full truncate text-[13px] font-semibold text-[var(--text-primary)]">{tab.label}</span>
                      <Badge className="shrink-0" tone={selected ? "violet" : copy.tone}>{tab.badge}</Badge>
                      <span className="sr-only">{tab.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </Panel>

        <div className="space-y-5" id="configuration-panel" role="tabpanel">
          <Panel className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-[var(--brand-primary)] text-white">
                  <ActiveIcon className="h-4 w-4" />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[20px] font-semibold text-[var(--text-primary)]">{activeTab.label}</p>
                    <Badge tone={activeCopy.tone}>{activeCopy.label}</Badge>
                  </div>
                  <p className="mt-1 text-[13px] leading-6 text-[var(--text-secondary)]">
                    Configuraciones → {activeTab.label} → {activeSubTab?.label}
                  </p>
                </div>
              </div>
              <Badge tone="slate">{activeTab.subTabs.length} sub-tabs</Badge>
            </div>

            <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label={`Sub-tabs de ${activeTab.label}`}>
              {activeTab.subTabs.map((subTab) => {
                const selected = subTab.key === activeSubTabKey;
                return (
                  <button
                    key={subTab.key}
                    aria-selected={selected}
                    className={cn(
                      "rounded-full border px-4 py-2 text-[12px] font-semibold transition",
                      selected
                        ? "border-[rgba(79,70,245,0.28)] bg-[var(--brand-primary)] text-white"
                        : "border-[var(--border-default)] bg-white text-[var(--text-secondary)] hover:border-[var(--border-focus)] hover:text-[var(--text-primary)]",
                    )}
                    role="tab"
                    type="button"
                    onClick={() =>
                      setActiveSubTabs((current) => ({
                        ...current,
                        [activeTabKey]: subTab.key,
                      }))
                    }
                  >
                    {subTab.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-[12px] leading-5 text-[var(--text-secondary)]">{activeSubTab?.description}</p>
          </Panel>

          <ConfigContent subTabKey={activeSubTabKey} tabKey={activeTabKey} />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel className="p-5">
          <p className="text-[20px] font-semibold text-[var(--text-primary)]">Criterio de organización aplicado</p>
          <p className="mt-1 text-[13px] leading-6 text-[var(--text-secondary)]">
            La vista separa configuración singleton, colecciones administrables y detalles secundarios para que el administrador escanee primero y profundice después.
          </p>
          <div className="mt-5 grid gap-3">
            {PROPOSED_NAVIGATION.slice(0, 4).map((item) => {
              const Icon = item.icon;
              return (
              <div key={item.label} className="flex items-center gap-3 rounded-[18px] border border-[var(--border-default)] bg-white p-4">
                <Icon className="h-4 w-4 text-[var(--brand-primary)]" />
                <div>
                  <p className="text-[14px] font-semibold text-[var(--text-primary)]">{item.label}</p>
                  <p className="mt-1 text-[12px] text-[var(--text-secondary)]">{item.detail}</p>
                </div>
              </div>
              );
            })}
          </div>
        </Panel>

        <Panel className="p-5">
          <p className="text-[20px] font-semibold text-[var(--text-primary)]">Acciones visibles vs. expandidas</p>
          <p className="mt-1 text-[13px] leading-6 text-[var(--text-secondary)]">
            Solo queda visible la acción operativa primaria. Lo destructivo, avanzado o contextual vive dentro del acordeón con permisos y auditoría.
          </p>
          <div className="mt-5 space-y-3">
            <StatRow label="Visible" value="Probar, abrir, editar básico" tone="blue" />
            <StatRow label="Acordeón" value="Rotar, revocar, mapear, reprocesar" tone="orange" />
            <StatRow label="Formulario" value="Workspace y runtime activo" tone="green" />
            <StatRow label="Tabla" value="Providers, secretos, precios, flags" tone="violet" />
            <StatRow label="Permiso alto" value="Registry/precios/secretos" tone="red" />
          </div>
        </Panel>
      </div>
    </div>
  );
}

function renderSection(section: SectionKey) {
  switch (section) {
    case "llm":
      return <LlmSection />;
    case "projects":
      return <ProjectsSection />;
    case "users":
      return <UsersSection />;
    case "roles":
      return <RolesSection />;
    case "configuration":
      return <ConfigurationSection />;
    default:
      return <OverviewSection />;
  }
}

export function SettingsAdminConsoleMockup() {
  const [activeSection, setActiveSection] = useState<SectionKey>("overview");
  const [isNavigationCollapsed, setIsNavigationCollapsed] = useState(false);
  const active = SECTIONS.find((item) => item.key === activeSection) ?? SECTIONS[0];

  return (
    <SettingsAdminConsoleFrame
      activeSection={activeSection}
      actions={
        <div className="flex items-center gap-2">
          <AppButton icon={<Filter className="h-4 w-4" />} variant="secondary">Filtrar</AppButton>
          <AppButton icon={<RefreshCcw className="h-4 w-4" />} variant="primary">Sincronizar</AppButton>
        </div>
      }
      breadcrumbs={["Administración", "Workspace", active.label]}
      collapsed={isNavigationCollapsed}
      environmentLabel="Producción · Colombia (es-CO)"
      footer={
        <div className="grid gap-4 lg:grid-cols-3">
          <SourceNote>
            Estilo visual: se reutilizan `Panel`, `Badge`, `AppButton`, `SimpleTable`, tokens CSS y charts lean existentes.
          </SourceNote>
          <SourceNote status="partial">
            Datos reales disponibles: FinOps, sesiones/proyectos, runtime, platform registry, precios, consentimientos y Hotmart.
          </SourceNote>
          <SourceNote status="gap">
            Brecha principal: administración de usuarios/roles requiere endpoints admin dedicados y permisos de escritura auditados.
          </SourceNote>
        </div>
      }
      latencyLabel="184 ms"
      onSelectSection={setActiveSection}
      onToggleNavigation={() => setIsNavigationCollapsed((current) => !current)}
      planLabel="Business"
      runtimeIcon={<Bot className="h-3.5 w-3.5 text-[var(--brand-primary)]" />}
      runtimeLabel="gpt-5.5 (OpenAI)"
      sectionActions={
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[var(--success)]" />
          <Badge tone="blue">Auditoría activa</Badge>
        </div>
      }
      sections={SECTIONS}
      workspaceLabel="Lean Builder HQ"
    >
      {renderSection(activeSection)}
    </SettingsAdminConsoleFrame>
  );
}

function SessionStatusBar() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-default)] bg-[var(--surface-subtle)] px-6 py-2.5">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-secondary)]">
            Producción · Colombia (es-CO)
          </span>
        </div>
        <span className="h-3 w-px bg-[var(--border-default)]" />
        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--text-primary)]">
          <Bot className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
          <span>gpt-5.5 (OpenAI)</span>
          <Badge tone="green" className="px-1.5 py-0 font-mono text-[10px]">184 ms</Badge>
        </div>
      </div>

      <button
        type="button"
        className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-white px-2.5 py-1 text-[12px] text-[var(--text-secondary)] shadow-xs hover:border-[var(--border-focus)] hover:text-[var(--text-primary)]"
      >
        <Command className="h-3 w-3" />
        <span className="font-medium">Buscar comando...</span>
        <kbd className="rounded border bg-[var(--surface-subtle)] px-1 font-mono text-[10px]">⌘K</kbd>
      </button>
    </div>
  );
}

function NavigationRail({
  activeSection,
  collapsed,
  onSelectSection,
  onToggle,
}: {
  activeSection: SectionKey;
  collapsed: boolean;
  onSelectSection: (key: SectionKey) => void;
  onToggle: () => void;
}) {
  const groups = ["Operación", "Gobierno", "Sistema"] as const;

  return (
    <aside
      className={cn(
        "flex w-full flex-col overflow-hidden border-b border-[var(--border-default)] bg-white transition-[width,max-height,padding] duration-200 lg:shrink-0 lg:border-b-0 lg:border-r",
        collapsed
          ? "max-h-[76px] p-3 lg:max-h-none lg:w-[72px] lg:p-2"
          : "max-h-[680px] p-4 lg:max-h-none lg:w-[280px]",
      )}
    >
      <div className={cn("flex items-center gap-2", collapsed ? "mb-0 justify-center" : "mb-6 justify-between px-2")}>
        {collapsed ? (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[12px] font-bold text-[var(--brand-primary)]" title="Lean Builder HQ">
            LB
          </span>
        ) : (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Espacio de Trabajo</p>
            <div className="mt-1 flex items-center gap-3">
              <p className="text-[15px] font-bold text-[var(--text-primary)]">Lean Builder HQ</p>
              <Badge tone="violet">Business</Badge>
            </div>
          </div>
        )}
        <button
          type="button"
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Mostrar menú principal" : "Ocultar menú principal"}
          title={collapsed ? "Mostrar menú principal" : "Ocultar menú principal"}
          onClick={onToggle}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border-default)] bg-white text-[var(--text-secondary)] transition hover:border-[var(--border-focus)] hover:text-[var(--brand-primary)]"
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      <nav className={cn("space-y-6", collapsed && "space-y-3")} aria-label="Navegación principal">
        {groups.map((group) => (
          <div key={group} className="space-y-1">
            <p className={cn("px-2.5 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]", collapsed && "sr-only")}>
              {group}
            </p>
            <div className="space-y-1">
              {SECTIONS.filter((section) => section.group === group).map((item) => {
                const Icon = item.icon;
                const isSelected = activeSection === item.key;

                return (
                  <button
                    key={item.key}
                    type="button"
                    aria-current={isSelected ? "page" : undefined}
                    aria-label={collapsed ? item.label : undefined}
                    title={collapsed ? item.label : undefined}
                    onClick={() => onSelectSection(item.key)}
                    className={cn(
                      "group flex w-full items-center rounded-xl py-2 text-left text-[13px] font-medium transition-all",
                      collapsed ? "justify-center px-2" : "justify-between px-3",
                      isSelected
                        ? "bg-[var(--brand-primary)] font-semibold text-white shadow-sm"
                        : "text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]",
                    )}
                  >
                    <div className={cn("flex min-w-0 items-center gap-2.5", collapsed && "justify-center")}>
                      <Icon className={cn("h-4 w-4 shrink-0", isSelected ? "text-white" : "text-[var(--text-muted)] group-hover:text-[var(--brand-primary)]")} />
                      <span className={cn("truncate", collapsed && "sr-only")}>{item.label}</span>
                    </div>

                    <div className={cn("flex items-center gap-1.5", collapsed && "hidden")}>
                      {item.counter ? (
                        <span
                          className={cn(
                            "rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold",
                            isSelected ? "bg-white/20 text-white" : "bg-[var(--surface-subtle)] text-[var(--text-secondary)]",
                          )}
                        >
                          {item.counter}
                        </span>
                      ) : null}
                      {item.badge && !item.counter && !isSelected ? <Badge tone={item.badgeTone ?? "slate"}>{item.badge}</Badge> : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Retained temporarily as a legacy comparison anchor during the shared-frame migration.
function LegacySettingsAdminConsoleMockup() {
  const [activeSection, setActiveSection] = useState<SectionKey>("overview");
  const [isNavigationCollapsed, setIsNavigationCollapsed] = useState(false);
  const active = SECTIONS.find((item) => item.key === activeSection) ?? SECTIONS[0];
  const ActiveIcon = active.icon;

  return (
    <WorkspaceShell>
      <PageChrome
        breadcrumbs={["Administración", "Workspace", active.label]}
        density="compact"
        actions={
          <div className="flex items-center gap-2">
            <AppButton icon={<Filter className="h-4 w-4" />} variant="secondary">Filtrar</AppButton>
            <AppButton icon={<RefreshCcw className="h-4 w-4" />} variant="primary">Sincronizar</AppButton>
          </div>
        }
      >
        <div className="space-y-4">
          <Panel className="overflow-hidden border border-[var(--border-default)] p-0 shadow-sm">
            <SessionStatusBar />

            <div className="flex min-h-[720px] flex-col lg:flex-row">
              <NavigationRail
                activeSection={activeSection}
                collapsed={isNavigationCollapsed}
                onSelectSection={setActiveSection}
                onToggle={() => setIsNavigationCollapsed((current) => !current)}
              />

              <main className="min-w-0 flex-1 bg-[var(--surface-canvas)] p-6">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--border-default)] bg-white p-5">
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand-primary)]">
                      <ActiveIcon className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="text-[20px] font-bold text-[var(--text-primary)]">{active.label}</h2>
                      <p className="text-[13px] text-[var(--text-secondary)]">{active.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-[var(--success)]" />
                    <Badge tone="blue">Auditoría activa</Badge>
                  </div>
                </div>

                {renderSection(activeSection)}
              </main>
            </div>
          </Panel>

          <div className="grid gap-4 lg:grid-cols-3">
            <SourceNote>
              Estilo visual: se reutilizan `Panel`, `Badge`, `AppButton`, `SimpleTable`, tokens CSS y charts lean existentes.
            </SourceNote>
            <SourceNote status="partial">
              Datos reales disponibles: FinOps, sesiones/proyectos, runtime, platform registry, precios, consentimientos y Hotmart.
            </SourceNote>
            <SourceNote status="gap">
              Brecha principal: administración de usuarios/roles requiere endpoints admin dedicados y permisos de escritura auditados.
            </SourceNote>
          </div>
        </div>
      </PageChrome>
    </WorkspaceShell>
  );
}
