"use client";

import { Fragment, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Banknote,
  BarChart3,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Command,
  Copy,
  ExternalLink,
  Filter,
  FolderKanban,
  Gauge,
  Globe2,
  KeyRound,
  Layers3,
  LayoutDashboard,
  RefreshCcw,
  Search,
  ServerCog,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
  UserCog,
  Users,
  WalletCards,
  Zap,
} from "lucide-react";
import { BarsByDimension, DonutChart, MiniBarChart, MultiSeriesChart, Sparkline } from "@/components/lean/charts";
import { AppButton, Badge, KeyValue, Panel, ProgressBar, SelectField, SimpleTable, StatRow, TextField } from "@/components/lean/ui";
import { PageChrome, WorkspaceShell } from "@/components/lean/shell";
import { cn } from "@/lib/utils";

type BadgeTone = "violet" | "green" | "orange" | "red" | "blue" | "slate";
type SectionKey = "overview" | "llm" | "projects" | "users" | "roles" | "configuration";
type CapabilityStatus = "available" | "gap" | "partial";

type SectionDefinition = {
  badge?: string;
  badgeTone?: BadgeTone;
  counter?: string | number;
  description: string;
  group: "Operación" | "Gobierno" | "Sistema";
  icon: LucideIcon;
  key: SectionKey;
  label: string;
};

type MetricCardDefinition = {
  delta: string;
  detail: string;
  icon: LucideIcon;
  label: string;
  tone: BadgeTone;
  trend: number[];
  value: string;
};

type AdminAction = {
  icon: LucideIcon;
  label: string;
  status: string;
  tone: BadgeTone;
};

type ConfigRow = {
  actions: string[];
  detail: string;
  fields: { label: string; value: string }[];
  id: string;
  name: string;
  owner: string;
  status: string;
  tone: BadgeTone;
  visibleAction: string;
};

const SECTIONS: SectionDefinition[] = [
  {
    group: "Operación",
    key: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    badge: "Live",
    badgeTone: "green",
    description: "Estado ejecutivo, crecimiento del ecosistema y alertas tempranas.",
  },
  {
    group: "Operación",
    key: "llm",
    label: "FinOps & LLM",
    icon: BarChart3,
    counter: "2 alertas",
    badgeTone: "orange",
    description: "Costos, tokens, latencias, cuotas de consumo y optimización de modelos.",
  },
  {
    group: "Operación",
    key: "projects",
    label: "Portafolio",
    icon: FolderKanban,
    counter: 42,
    badgeTone: "slate",
    description: "Proyectos en curso, estados de entrega y fases de diseño.",
  },
  {
    group: "Gobierno",
    key: "users",
    label: "Usuarios",
    icon: Users,
    counter: 48,
    badgeTone: "blue",
    description: "Cuentas registradas, miembros activos y gestión de accesos.",
  },
  {
    group: "Gobierno",
    key: "roles",
    label: "Roles y Permisos",
    icon: ShieldCheck,
    badge: "RBAC",
    badgeTone: "violet",
    description: "Matriz de privilegios por dominio y políticas de seguridad.",
  },
  {
    group: "Sistema",
    key: "configuration",
    label: "Configuración",
    icon: SlidersHorizontal,
    badge: "Admin",
    badgeTone: "slate",
    description: "Runtime LLM, credenciales, integraciones comerciales y feature flags.",
  },
];

const overviewMetrics: MetricCardDefinition[] = [
  {
    delta: "+18.4%",
    detail: "Crecimiento vs. periodo anterior",
    icon: TrendingUp,
    label: "Crecimiento plataforma",
    tone: "green",
    trend: [36, 42, 46, 58, 64, 71, 78],
    value: "78%",
  },
  {
    delta: "US$ 842",
    detail: "Costo LLM mensual estimado",
    icon: WalletCards,
    label: "Costo acumulado",
    tone: "orange",
    trend: [18, 24, 33, 48, 57, 69, 84],
    value: "68%",
  },
  {
    delta: "42 total",
    detail: "12 en diseño, 8 en memoria",
    icon: FolderKanban,
    label: "Proyectos administrados",
    tone: "blue",
    trend: [10, 14, 18, 21, 28, 34, 42],
    value: "42",
  },
  {
    delta: "184 ms",
    detail: "Runtime principal saludable",
    icon: Gauge,
    label: "Latencia p95",
    tone: "green",
    trend: [28, 24, 20, 21, 18, 19, 16],
    value: "OK",
  },
];

const adminActions: AdminAction[] = [
  { icon: ShieldAlert, label: "Revisar alertas FinOps", status: "2 pendientes", tone: "orange" },
  { icon: KeyRound, label: "Rotación de secretos", status: "18 días", tone: "green" },
  { icon: Globe2, label: "Sincronizar Hotmart", status: "Hace 16 min", tone: "blue" },
  { icon: Copy, label: "Copiar reporte ejecutivo", status: "PDF/CSV", tone: "slate" },
];

const configRows: ConfigRow[] = [
  {
    actions: ["Editar modelos", "Configurar fallback", "Ver costos por modelo"],
    detail: "Provider activo del workspace. La fila mantiene el estado y la acción primaria; el acordeón guarda modelos, límites y reglas avanzadas.",
    fields: [
      { label: "Modelos", value: "gpt-5, gpt-4.1, o-series" },
      { label: "Secret source", value: "Workspace vault" },
      { label: "Health", value: "184 ms / OK" },
    ],
    id: "runtime-openai",
    name: "OpenAI runtime",
    owner: "Owner/Admin",
    status: "Activo",
    tone: "green",
    visibleAction: "Probar",
  },
  {
    actions: ["Mapear productos", "Crear link", "Ver links recientes"],
    detail: "Módulo comercial para checkout, ofertas, cupones y trazabilidad interna desde Settings, no desde usuarios generales.",
    fields: [
      { label: "Scope", value: "Products, sales, coupons" },
      { label: "Última sync", value: "Hace 16 min" },
      { label: "Riesgo", value: "Webhooks y reconciliación" },
    ],
    id: "hotmart-links",
    name: "Hotmart payment links",
    owner: "Admin comercial",
    status: "Parcial",
    tone: "orange",
    visibleAction: "Abrir",
  },
  {
    actions: ["Rotar secreto", "Revocar", "Ver auditoría"],
    detail: "Referencia segura de credenciales. Nunca se muestran secretos en texto plano; el detalle concentra acciones sensibles con auditoría.",
    fields: [
      { label: "Tipo", value: "API key / OAuth credentials" },
      { label: "Storage", value: "Workspace secret vault" },
      { label: "Última rotación", value: "Hace 18 días" },
    ],
    id: "secrets",
    name: "Secretos y credenciales",
    owner: "Owner/Admin",
    status: "Listo",
    tone: "green",
    visibleAction: "Validar",
  },
  {
    actions: ["Cambiar rollout", "Limitar por rol", "Ver eventos"],
    detail: "Flags por workspace/plataforma para activar capacidades administrativas sin exponerlas a usuarios generales.",
    fields: [
      { label: "Flag principal", value: "hotmart_admin" },
      { label: "Audiencia", value: "Owner/Admin" },
      { label: "Rollout", value: "Beta controlada" },
    ],
    id: "flags",
    name: "Feature flags",
    owner: "Platform admin",
    status: "Beta",
    tone: "blue",
    visibleAction: "Toggle",
  },
];

function StatusNote({ children, status = "available" }: { children: ReactNode; status?: CapabilityStatus }) {
  const tone: BadgeTone = status === "available" ? "green" : status === "partial" ? "orange" : "slate";
  const label = status === "available" ? "Disponible" : status === "partial" ? "Parcial" : "Requiere backend";

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-subtle)] px-4 py-3">
      <CheckCircle2 className="mt-0.5 h-4 w-4 text-[var(--brand-primary)]" />
      <div>
        <Badge tone={tone}>{label}</Badge>
        <p className="mt-2 text-[12px] leading-5 text-[var(--text-secondary)]">{children}</p>
      </div>
    </div>
  );
}

function MetricCard({ metric }: { metric: MetricCardDefinition }) {
  const Icon = metric.icon;

  return (
    <Panel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium text-[var(--text-secondary)]">{metric.label}</p>
          <p className="mt-3 text-[26px] font-semibold leading-none text-[var(--text-primary)]">{metric.value}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand-primary)]">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <Badge tone={metric.tone}>{metric.delta}</Badge>
          <p className="mt-2 text-[12px] text-[var(--text-secondary)]">{metric.detail}</p>
        </div>
        <Sparkline values={metric.trend} className="max-w-[120px]" />
      </div>
    </Panel>
  );
}

function AdminActionCard({ action }: { action: AdminAction }) {
  const Icon = action.icon;

  return (
    <button
      type="button"
      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[var(--border-default)] bg-white p-4 text-left transition hover:border-[var(--border-focus)] hover:shadow-[var(--shadow-card)]"
    >
      <span className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-subtle)] text-[var(--brand-primary)]">
          <Icon className="h-4 w-4" />
        </span>
        <span>
          <span className="block text-[13px] font-semibold text-[var(--text-primary)]">{action.label}</span>
          <span className="mt-1 block text-[12px] text-[var(--text-secondary)]">{action.status}</span>
        </span>
      </span>
      <Badge tone={action.tone}>Admin</Badge>
    </button>
  );
}

function OverviewSection() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overviewMetrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_360px]">
        <Panel className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[18px] font-semibold text-[var(--text-primary)]">Evolución ejecutiva</p>
              <p className="mt-1 text-[13px] text-[var(--text-secondary)]">Uso, costo y actividad administrativa de las últimas semanas.</p>
            </div>
            <Badge tone="green">Tendencia positiva</Badge>
          </div>
          <MultiSeriesChart
            className="mt-5 h-[260px]"
            series={[
              { color: "#4F46F5", values: [18, 24, 32, 44, 54, 68, 78] },
              { color: "#06B6D4", values: [8, 18, 24, 31, 42, 51, 64] },
              { color: "#F59E0B", values: [5, 10, 18, 28, 38, 54, 68] },
            ]}
          />
        </Panel>

        <Panel className="p-5">
          <p className="text-[18px] font-semibold text-[var(--text-primary)]">Acciones rápidas</p>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">Atajos administrativos de alto valor.</p>
          <div className="mt-5 space-y-3">
            {adminActions.map((action) => (
              <AdminActionCard key={action.label} action={action} />
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function LlmSection() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-4">
        <MetricCard metric={{ label: "Tokens input", value: "9.8M", delta: "+22%", detail: "Prompts y contexto", icon: Bot, tone: "blue", trend: [24, 28, 34, 44, 52, 67, 88] }} />
        <MetricCard metric={{ label: "Tokens output", value: "4.2M", delta: "+16%", detail: "Respuestas generadas", icon: Zap, tone: "violet", trend: [18, 24, 31, 36, 45, 52, 64] }} />
        <MetricCard metric={{ label: "Costo estimado", value: "US$ 842", delta: "68% budget", detail: "Sin exceder límite", icon: Banknote, tone: "orange", trend: [12, 20, 28, 38, 52, 63, 68] }} />
        <MetricCard metric={{ label: "Latencia", value: "184 ms", delta: "p95", detail: "Runtime saludable", icon: Gauge, tone: "green", trend: [38, 34, 29, 25, 21, 19, 18] }} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel className="p-5">
          <p className="text-[18px] font-semibold text-[var(--text-primary)]">Consumo por proveedor/modelo</p>
          <BarsByDimension
            className="mt-6"
            items={[
              { label: "OpenAI · gpt-5", value: 74, color: "#4F46F5" },
              { label: "OpenAI · gpt-4.1", value: 48, color: "#06B6D4" },
              { label: "DeepSeek · fallback", value: 22, color: "#F59E0B" },
              { label: "Codex Local", value: 14, color: "#10B981" },
            ]}
          />
        </Panel>

        <Panel className="p-5">
          <p className="text-[18px] font-semibold text-[var(--text-primary)]">Filtros operativos</p>
          <div className="mt-5 space-y-4">
            <SelectField disabled label="Periodo" defaultValue="30d" options={[{ label: "Últimos 30 días", value: "30d" }]} />
            <SelectField disabled label="Proveedor" defaultValue="all" options={[{ label: "Todos", value: "all" }]} />
            <SelectField disabled label="Modelo" defaultValue="all" options={[{ label: "Todos", value: "all" }]} />
          </div>
        </Panel>
      </div>

      <SimpleTable
        columns={["Modelo", "Tokens", "Costo", "Estado"]}
        rows={[
          ["gpt-5", "7.1M", "US$ 612", <Badge key="gpt5" tone="green">Normal</Badge>],
          ["gpt-4.1", "2.7M", "US$ 164", <Badge key="gpt41" tone="blue">Optimizable</Badge>],
          ["deepseek-reasoner", "820K", "US$ 66", <Badge key="deepseek" tone="orange">Fallback</Badge>],
        ]}
      />
    </div>
  );
}

function ProjectsSection() {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Panel className="p-5">
          <p className="text-[18px] font-semibold text-[var(--text-primary)]">Distribución por fase</p>
          <DonutChart
            className="mt-5"
            centerLabel="proyectos"
            centerValue="42"
            segments={[
              { value: 12, color: "#4F46F5", label: "Diseño" },
              { value: 10, color: "#06B6D4", label: "Definir" },
              { value: 8, color: "#10B981", label: "Memoria" },
              { value: 7, color: "#F59E0B", label: "Review" },
              { value: 5, color: "#64748B", label: "Final" },
            ]}
          />
        </Panel>

        <Panel className="p-5">
          <p className="text-[18px] font-semibold text-[var(--text-primary)]">Salud del portafolio</p>
          <div className="mt-5 space-y-5">
            <div>
              <div className="mb-2 flex justify-between text-[13px] text-[var(--text-secondary)]">
                <span>Activos</span>
                <span>29/42</span>
              </div>
              <ProgressBar value={69} />
            </div>
            <div>
              <div className="mb-2 flex justify-between text-[13px] text-[var(--text-secondary)]">
                <span>Finalizados</span>
                <span>8/42</span>
              </div>
              <ProgressBar value={19} color="var(--success)" />
            </div>
            <div>
              <div className="mb-2 flex justify-between text-[13px] text-[var(--text-secondary)]">
                <span>Requieren atención</span>
                <span>5/42</span>
              </div>
              <ProgressBar value={12} color="var(--warning)" />
            </div>
          </div>
        </Panel>
      </div>

      <SimpleTable
        columns={["Proyecto", "Fase", "Avance", "Owner", "Señal"]}
        rows={[
          ["Asistente soporte RR. HH.", "Diseñar", "62%", "Laura Méndez", <Badge key="rrhh" tone="orange">Atención</Badge>],
          ["Cotizador B2B comercial", "Definir", "38%", "Diego Rojas", <Badge key="b2b" tone="green">Ready</Badge>],
          ["Onboarding técnico clientes", "Exportación", "100%", "María Silva", <Badge key="onb" tone="blue">Finalizado</Badge>],
        ]}
      />
    </div>
  );
}

function UsersSection() {
  return (
    <div className="space-y-5">
      <Panel className="p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px]">
          <TextField disabled label="Buscar usuario" placeholder="Nombre, email o rol" trailing={<Search className="h-4 w-4" />} />
          <AppButton icon={<UserCog className="h-4 w-4" />} variant="primary">Invitar usuario</AppButton>
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-3">
        <Panel className="p-5">
          <StatRow label="Usuarios registrados" value="48" tone="blue" />
          <StatRow label="Activos hoy" value="19" tone="green" />
          <StatRow label="Invitados" value="4" tone="slate" />
        </Panel>
        <Panel className="p-5">
          <StatRow label="Owners/Admins" value="6" tone="violet" />
          <StatRow label="Editors" value="28" tone="blue" />
          <StatRow label="Viewers" value="14" tone="slate" />
        </Panel>
        <Panel className="p-5">
          <p className="text-[13px] font-semibold text-[var(--text-primary)]">Crecimiento usuarios</p>
          <MiniBarChart values={[4, 8, 6, 12, 10, 14, 18]} className="mt-5" />
        </Panel>
      </div>

      <SimpleTable
        columns={["Usuario", "Email", "Rol", "Estado", "Actividad"]}
        rows={[
          ["Laura Méndez", "laura@leanbuilder.local", <Badge key="owner" tone="violet">Owner</Badge>, <Badge key="active" tone="green">Activa</Badge>, "Hoy 09:12"],
          ["Diego Rojas", "diego@leanbuilder.local", <Badge key="admin" tone="blue">Admin</Badge>, <Badge key="active2" tone="green">Activo</Badge>, "Hoy 08:44"],
          ["Andrés Torres", "andres@leanbuilder.local", <Badge key="viewer" tone="slate">Viewer</Badge>, <Badge key="invited" tone="slate">Invitado</Badge>, "Hace 6 días"],
        ]}
      />
    </div>
  );
}

function RolesSection() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <Panel className="p-5">
          <ShieldCheck className="h-5 w-5 text-[var(--brand-primary)]" />
          <p className="mt-3 text-[17px] font-semibold text-[var(--text-primary)]">Roles estándar</p>
          <p className="mt-1 text-[13px] leading-6 text-[var(--text-secondary)]">Owner, Admin, Editor y Viewer como base operativa.</p>
        </Panel>
        <Panel className="p-5">
          <KeyRound className="h-5 w-5 text-[var(--brand-primary)]" />
          <p className="mt-3 text-[17px] font-semibold text-[var(--text-primary)]">Permisos por dominio</p>
          <p className="mt-1 text-[13px] leading-6 text-[var(--text-secondary)]">Runtime, usuarios, billing, proyectos e integraciones.</p>
        </Panel>
        <Panel className="p-5">
          <Layers3 className="h-5 w-5 text-[var(--brand-primary)]" />
          <p className="mt-3 text-[17px] font-semibold text-[var(--text-primary)]">Roles custom</p>
          <p className="mt-1 text-[13px] leading-6 text-[var(--text-secondary)]">Preparado para permisos granulares futuros.</p>
        </Panel>
      </div>

      <SimpleTable
        columns={["Rol", "Propósito", "Dominios", "Estado"]}
        rows={[
          ["Owner", "Administración total", "Runtime, usuarios, billing", <Badge key="owner-role" tone="green">Actual</Badge>],
          ["Admin", "Gobierno operativo", "Runtime, FinOps, proyectos", <Badge key="admin-role" tone="green">Actual</Badge>],
          ["Platform admin", "Gobierno global SaaS", "Registry, defaults, auditoría", <Badge key="platform-role" tone="orange">Parcial</Badge>],
        ]}
      />

      <StatusNote status="partial">
        Existe base de roles; falta API/UI final para asignaciones, invitaciones y permisos custom granulares.
      </StatusNote>
    </div>
  );
}

function ConfigAccordionTable() {
  const [expandedRow, setExpandedRow] = useState(configRows[0]?.id ?? "");

  return (
    <Panel className="overflow-hidden p-0">
      <div className="border-b border-[var(--border-default)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[18px] font-semibold text-[var(--text-primary)]">Configuraciones críticas</p>
            <p className="mt-1 text-[13px] text-[var(--text-secondary)]">Tabla principal con detalle avanzado mediante acordeón.</p>
          </div>
          <Badge tone="violet">Settings premium</Badge>
        </div>
      </div>

      <div className="divide-y divide-[var(--border-subtle)]">
        {configRows.map((row) => {
          const expanded = expandedRow === row.id;

          return (
            <Fragment key={row.id}>
              <div className="grid gap-3 bg-white px-5 py-4 lg:grid-cols-[minmax(0,1fr)_120px_150px_120px_44px] lg:items-center">
                <div>
                  <p className="text-[14px] font-semibold text-[var(--text-primary)]">{row.name}</p>
                  <p className="mt-1 text-[12px] leading-5 text-[var(--text-secondary)]">{row.detail}</p>
                </div>
                <Badge tone={row.tone}>{row.status}</Badge>
                <span className="text-[12px] font-medium text-[var(--text-secondary)]">{row.owner}</span>
                <AppButton className="h-9 px-3 text-[12px]" variant="ghost">{row.visibleAction}</AppButton>
                <button
                  type="button"
                  aria-expanded={expanded}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-default)] bg-white text-[var(--brand-primary)]"
                  onClick={() => setExpandedRow(expanded ? "" : row.id)}
                >
                  {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              </div>

              {expanded ? (
                <div className="grid gap-4 border-t border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-5 py-4 lg:grid-cols-[minmax(0,1fr)_260px]">
                  <div className="grid gap-3 md:grid-cols-3">
                    {row.fields.map((field) => (
                      <KeyValue key={`${row.id}-${field.label}`} label={field.label} value={field.value} />
                    ))}
                  </div>
                  <div className="space-y-2">
                    {row.actions.map((action) => (
                      <AppButton key={`${row.id}-${action}`} className="h-10 w-full justify-start px-3 text-[12px]">
                        {action}
                      </AppButton>
                    ))}
                  </div>
                </div>
              ) : null}
            </Fragment>
          );
        })}
      </div>
    </Panel>
  );
}

function ConfigurationSection() {
  const [activeTab, setActiveTab] = useState("runtime");
  const tabs = [
    { key: "runtime", label: "Runtime", icon: Bot },
    { key: "security", label: "Credenciales", icon: KeyRound },
    { key: "commerce", label: "Hotmart", icon: Globe2 },
    { key: "governance", label: "Gobernanza", icon: ServerCog },
  ];

  return (
    <div className="space-y-5">
      <Panel className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge tone="violet">Configuraciones → Tab → Tabla → Acordeón</Badge>
            <p className="mt-3 text-[20px] font-semibold text-[var(--text-primary)]">Centro de configuración administrativo</p>
            <p className="mt-1 max-w-3xl text-[13px] leading-6 text-[var(--text-secondary)]">
              Variante compacta basada en navegación de consola: acceso rápido, estado visible y detalle progresivo.
            </p>
          </div>
          <AppButton icon={<ExternalLink className="h-4 w-4" />}>Abrir settings real</AppButton>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const selected = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[12px] font-semibold transition",
                  selected
                    ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white"
                    : "border-[var(--border-default)] bg-white text-[var(--text-secondary)] hover:border-[var(--border-focus)]",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </Panel>

      <ConfigAccordionTable />
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
          <Badge tone="green" className="py-0 px-1.5 font-mono text-[10px]">184 ms</Badge>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-white px-2.5 py-1 text-[12px] text-[var(--text-secondary)] shadow-xs hover:border-[var(--border-focus)] hover:text-[var(--text-primary)]"
        >
          <Command className="h-3 w-3" />
          <span className="font-medium">Buscar comando...</span>
          <kbd className="rounded border bg-[var(--surface-subtle)] px-1 font-mono text-[10px]">⌘K</kbd>
        </button>
      </div>
    </div>
  );
}

function NavigationRail({
  activeSection,
  onSelectSection,
}: {
  activeSection: SectionKey;
  onSelectSection: (key: SectionKey) => void;
}) {
  const groups = ["Operación", "Gobierno", "Sistema"] as const;

  return (
    <aside className="w-full flex-col border-b border-[var(--border-default)] bg-white p-4 lg:w-[280px] lg:border-b-0 lg:border-r">
      <div className="mb-6 px-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Espacio de Trabajo</p>
        <div className="mt-1 flex items-center justify-between">
          <p className="text-[15px] font-bold text-[var(--text-primary)]">Lean Builder HQ</p>
          <Badge tone="violet">Business</Badge>
        </div>
      </div>

      <nav className="space-y-6" aria-label="Navegación principal">
        {groups.map((group) => (
          <div key={group} className="space-y-1">
            <p className="px-2.5 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
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
                    onClick={() => onSelectSection(item.key)}
                    className={cn(
                      "group flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[13px] font-medium transition-all",
                      isSelected
                        ? "bg-[var(--brand-primary)] font-semibold text-white shadow-sm"
                        : "text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]",
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Icon className={cn("h-4 w-4 shrink-0", isSelected ? "text-white" : "text-[var(--text-muted)] group-hover:text-[var(--brand-primary)]")} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
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
                      {item.badge && !isSelected ? <Badge tone={item.badgeTone ?? "slate"}>{item.badge}</Badge> : null}
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

export function SettingsAdminConsoleCommandMockup() {
  const [activeSection, setActiveSection] = useState<SectionKey>("overview");
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
              <NavigationRail activeSection={activeSection} onSelectSection={setActiveSection} />

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
        </div>
      </PageChrome>
    </WorkspaceShell>
  );
}
