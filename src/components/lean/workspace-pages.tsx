import {
  Activity,
  ArrowUpRight,
  Bot,
  BrainCircuit,
  CalendarRange,
  CircleAlert,
  CircleGauge,
  Download,
  ExternalLink,
  FileCode2,
  FileStack,
  Filter,
  FolderCog,
  FolderKanban,
  Gauge,
  History,
  LayoutGrid,
  MonitorCheck,
  Plus,
  RefreshCcw,
  Settings,
  Shield,
  Sparkles,
  Target,
} from "lucide-react";
import { WorkspaceShell, WorkspaceUserCard, StatusCard, PageChrome, TopUtilities } from "@/components/lean/shell";
import {
  AppButton,
  Badge,
  Checklist,
  CollapsedSection,
  IconButton,
  KeyValue,
  LinkRow,
  MiniStat,
  Panel,
  PanelHeader,
  ProgressBar,
  SeparatorNote,
  SimpleTable,
  StatRow,
  TabList,
  TextField,
} from "@/components/lean/ui";
import {
  BarsByDimension,
  ComparisonChart,
  DonutChart,
  MiniBarChart,
  MultiSeriesChart,
  Sparkline,
} from "@/components/lean/charts";

function DefaultFooter() {
  return (
    <>
      <StatusCard title="Sistema operativo" subtitle="Salud del sistema" />
      <WorkspaceUserCard name="María González" subtitle="Admin" initials="MG" />
    </>
  );
}

function HeaderMetricCard({
  title,
  value,
  subtitle,
  progress,
  badge,
  sparkline,
}: {
  title: string;
  value: string;
  subtitle?: string;
  progress?: number;
  badge?: React.ReactNode;
  sparkline?: number[];
}) {
  return (
    <Panel className="p-5">
      <p className="text-[13px] text-[var(--text-secondary)]">{title}</p>
      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <p className="text-[24px] font-semibold text-[var(--text-primary)]">{value}</p>
          {subtitle ? <p className="mt-2 text-[13px] text-[var(--text-secondary)]">{subtitle}</p> : null}
        </div>
        {badge}
      </div>
      {progress !== undefined ? <ProgressBar value={progress} className="mt-4" /> : null}
      {sparkline ? <Sparkline values={sparkline} className="mt-4 h-10" /> : null}
    </Panel>
  );
}

function SectionTitle({
  title,
  linkLabel = "Ver todas",
}: {
  title: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h3 className="text-[18px] font-semibold text-[var(--text-primary)]">{title}</h3>
      {linkLabel ? (
        <button type="button" className="text-[14px] font-medium text-[var(--brand-primary)]">
          {linkLabel}
        </button>
      ) : null}
    </div>
  );
}

function ListDot({
  color,
  title,
  detail,
}: {
  color: string;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-1 h-3 w-3 rounded-full" style={{ background: color }} />
      <div>
        <p className="text-[14px] font-medium text-[var(--text-primary)]">{title}</p>
        <p className="text-[13px] text-[var(--text-secondary)]">{detail}</p>
      </div>
    </div>
  );
}

function FlowStep({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-[116px] rounded-[16px] border border-[var(--border-default)] bg-white px-4 py-4 text-center text-[14px] font-medium text-[var(--text-primary)] shadow-[var(--shadow-card)]">
        {label}
      </div>
      <span className="text-[var(--brand-primary)]">→</span>
    </div>
  );
}

export function DashboardPage() {
  return (
    <WorkspaceShell sidebarFooter={<DefaultFooter />}>
      <PageChrome
        actions={
          <>
            <div className="rounded-[16px] border border-[var(--border-default)] bg-white px-4 py-3">
              <p className="text-[12px] text-[var(--text-muted)]">Workspace actual</p>
              <div className="mt-1 flex items-center gap-3 text-[16px] font-semibold">
                <FolderKanban className="h-4 w-4 text-[var(--text-secondary)]" />
                AI Sales Assistant
              </div>
            </div>
            <TopUtilities />
          </>
        }
      >
        <div className="space-y-8">
          <PanelHeader
            title="¡Hola, María! 👋"
            description="Bienvenida a tu cockpit ejecutivo. Así avanza tu operación Lean."
          />

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <HeaderMetricCard title="Progreso general" value="72%" subtitle="Completado" progress={72} />
            <HeaderMetricCard title="Evaluación promedio" value="92/100" badge={<Badge tone="green">Excelente</Badge>} />
            <HeaderMetricCard title="Salud del agente" value="98%" badge={<Badge tone="green">Saludable</Badge>} />
            <HeaderMetricCard title="Riesgos activos" value="3" badge={<Badge tone="red">Requieren atención</Badge>} />
          </div>

          <Panel className="p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[18px] font-semibold">Timeline Lean del proyecto</h3>
              <Badge tone="slate">9 etapas</Badge>
            </div>
            <div className="mt-7 overflow-x-auto pb-2">
              <div className="flex min-w-[860px] items-start justify-between gap-4">
                {[
                  { label: "Descubrir", state: "En curso", active: true },
                  { label: "Definir", state: "Pendiente", active: false },
                  { label: "Diseñar", state: "Pendiente", active: false },
                  { label: "Herramientas", state: "Pendiente", active: false },
                  { label: "Memoria", state: "Pendiente", active: false },
                  { label: "Evaluar", state: "Pendiente", active: false },
                  { label: "Seguridad", state: "Pendiente", active: false },
                  { label: "Construir", state: "Pendiente", active: false },
                  { label: "Operar", state: "Pendiente", active: false },
                ].map((item, index) => (
                  <div key={item.label} className="flex flex-1 flex-col items-center text-center">
                    <div className="flex w-full items-center gap-2">
                      <span
                        className={`flex h-12 w-12 items-center justify-center rounded-full border text-[14px] font-semibold ${
                          item.active
                            ? "border-[rgba(79,70,245,0.18)] bg-[var(--brand-soft)] text-[var(--brand-primary)]"
                            : "border-[var(--border-default)] bg-white text-[var(--text-secondary)]"
                        }`}
                      >
                        {index + 1}
                      </span>
                      {index < 8 ? <div className="h-px flex-1 bg-[var(--border-default)]" /> : null}
                    </div>
                    <p className="mt-4 text-[15px] font-medium">{item.label}</p>
                    <p className={`mt-1 text-[13px] ${item.active ? "text-[var(--brand-primary)]" : "text-[var(--text-muted)]"}`}>
                      {item.state}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-4 rounded-[18px] border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-5 py-4 md:flex-row md:items-center md:justify-between">
              <p className="text-[15px] text-[var(--text-secondary)]">
                Siguiente foco: <span className="font-medium text-[var(--text-primary)]">Definir objetivos y éxito</span>
              </p>
              <AppButton variant="primary">Continuar etapa</AppButton>
            </div>
          </Panel>

          <div className="grid gap-5 xl:grid-cols-2">
            <Panel className="p-6">
              <SectionTitle title="Sugerencias de IA" />
              <div className="space-y-4">
                <LinkRow label="Falta estrategia de memoria" detail="Define cómo tu agente recordará información." />
                <LinkRow label="Riesgo de alucinación medio" detail="Revisa tus prompts y restricciones." />
                <LinkRow label="API incompleta" detail="Genera el Agent Control Package." />
              </div>
            </Panel>

            <Panel className="p-6">
              <SectionTitle title="Actividad reciente" />
              <div className="space-y-5">
                <ListDot color="#7c6cff" title="Blueprint actualizado" detail="Hace 5 min" />
                <ListDot color="#22c55e" title="Evaluación ejecutada" detail="Hace 15 min" />
                <ListDot color="#8b5cf6" title="Memoria configurada" detail="Hace 1 hora" />
                <ListDot color="#f59e0b" title="Handoff completado" detail="Hace 2 horas" />
              </div>
            </Panel>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <Panel className="p-6">
              <SectionTitle title="Proyectos recientes" />
              <div className="space-y-4">
                {[
                  ["AI Sales Assistant", "Proyecto principal", "En producción"],
                  ["HR Onboarding Agent", "En desarrollo", ""],
                  ["Customer Support Bot", "En pruebas", ""],
                ].map(([name, detail, badge]) => (
                  <div key={name} className="flex items-start justify-between gap-4 rounded-[16px] border border-[var(--border-default)] px-4 py-4">
                    <div>
                      <p className="text-[16px] font-medium">{name}</p>
                      <p className="text-[13px] text-[var(--text-secondary)]">
                        {detail}{" "}
                        {badge ? <span className="font-medium text-[var(--success)]">• {badge}</span> : null}
                      </p>
                    </div>
                    <button type="button" className="text-[var(--text-muted)]">
                      •••
                    </button>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel className="p-6">
              <SectionTitle title="Agentes en producción" />
              <div className="grid items-center gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
                <DonutChart
                  centerValue="12"
                  centerLabel="Total"
                  segments={[
                    { value: 7, color: "#22c55e" },
                    { value: 3, color: "#fbbf24" },
                    { value: 1, color: "#ef4444" },
                    { value: 1, color: "#94a3b8" },
                  ]}
                  size={200}
                />
                <div className="space-y-4">
                  <StatRow label="Saludables" value="7 (58%)" tone="green" />
                  <StatRow label="Advertencia" value="3 (25%)" tone="orange" />
                  <StatRow label="Críticos" value="1 (8%)" tone="red" />
                  <StatRow label="Sin datos" value="1 (8%)" tone="slate" />
                </div>
              </div>
            </Panel>
          </div>

          <Panel className="p-6">
            <SectionTitle title="Actividad reciente del workspace" linkLabel="Ver toda la actividad" />
            <div className="space-y-3">
              {[
                ["Nueva versión del Blueprint publicada", "Hace 5 min", "Blueprint", "violet"],
                ["Evaluación de calidad ejecutada", "Hace 15 min", "Evaluación", "green"],
                ["Handoff a producción completado", "Hace 1 hora", "Despliegue", "violet"],
                ["Alerta de latencia elevada", "Hace 2 horas", "Alerta", "orange"],
              ].map(([label, time, chip, tone]) => (
                <div key={label} className="flex flex-col gap-3 rounded-[16px] border border-[var(--border-default)] px-4 py-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[15px] font-medium">{label}</p>
                    <p className="text-[13px] text-[var(--text-secondary)]">AI Sales Assistant</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[13px] text-[var(--text-secondary)]">{time}</span>
                    <Badge tone={tone as "violet" | "green" | "orange"}>{chip}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-6">
            <SectionTitle title="Acciones rápidas" linkLabel="" />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { title: "Nuevo proyecto", detail: "Inicia un nuevo proyecto Lean", Icon: FolderKanban },
                { title: "Evaluar agente", detail: "Ejecuta pruebas y métricas de calidad", Icon: Gauge },
                { title: "Ver monitoreo", detail: "Monitorea en vivo el rendimiento", Icon: Activity },
                { title: "Importar flujo", detail: "Desde archivo YAML o base de datos", Icon: Download },
              ].map((item) => (
                <button
                  key={item.title}
                  type="button"
                  className="rounded-[20px] border border-[var(--border-default)] bg-white px-5 py-5 text-left transition hover:-translate-y-1"
                >
                  <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-[14px] bg-[var(--brand-soft)] text-[var(--brand-primary)]">
                    <item.Icon className="h-5 w-5" />
                  </div>
                  <p className="text-[17px] font-semibold">{item.title}</p>
                  <p className="mt-2 text-[14px] leading-6 text-[var(--text-secondary)]">{item.detail}</p>
                </button>
              ))}
            </div>
          </Panel>
        </div>
      </PageChrome>
    </WorkspaceShell>
  );
}

export function AgentPage() {
  return (
    <WorkspaceShell sidebarFooter={<WorkspaceUserCard name="María González" subtitle="Admin" initials="MG" />}>
      <PageChrome
        breadcrumbs={["Proyectos", "Asistente Soporte TI", "Agentes", "Centro del blueprint"]}
        actions={
          <>
            <AppButton variant="primary" icon={<Plus className="h-4 w-4" />}>
              Nuevo agente
            </AppButton>
            <TopUtilities />
          </>
        }
      >
        <div className="space-y-8">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[44px] font-semibold">Agente Soporte TI</h1>
              <Badge tone="green">Activo</Badge>
              <span className="text-[14px] text-[var(--text-secondary)]">v2.3.1</span>
            </div>
            <p className="text-[16px] text-[var(--text-secondary)]">
              Agente para soporte técnico de TI que responde consultas, guía soluciones y gestiona tickets.
            </p>
          </div>

          <div className="grid gap-5 xl:grid-cols-[repeat(4,minmax(0,1fr))_1.15fr]">
            <HeaderMetricCard title="Agente activo" value="Agente Soporte TI" subtitle="Versión v2.3.1" />
            <HeaderMetricCard title="Listo para producción" value="92%" badge={<Badge tone="green">Excelente</Badge>} sparkline={[62, 60, 58, 63, 62, 61, 70, 92]} />
            <HeaderMetricCard title="Salud del agente" value="98%" badge={<Badge tone="green">Saludable</Badge>} />
            <HeaderMetricCard title="Riesgos activos" value="2" badge={<Badge tone="orange">Advertencia</Badge>} />
            <Panel className="p-5">
              <SectionTitle title="Lo que puedes hacer ahora" linkLabel="" />
              <div className="space-y-3">
                {[
                  "Probar el agente en el chat",
                  "Ver métricas en tiempo real",
                  "Ajustar instrucciones o herramientas",
                  "Publicar nueva versión",
                ].map((item) => (
                  <LinkRow key={item} label={item} />
                ))}
              </div>
            </Panel>
          </div>

          <TabList tabs={["Blueprint", "Runtime", "Versiones", "Roadmap"]} active="Runtime" />

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-5">
              <Panel className="p-6">
                <SectionTitle title="Runtime del agente" linkLabel="" />
                <div className="grid gap-4 md:grid-cols-5">
                  {[
                    ["Conversaciones (7d)", "2,543", "+12%"],
                    ["Resolución correcta", "86.7%", "+4.3%"],
                    ["Tiempo promedio", "1m 48s", "0%"],
                    ["Errores", "23", "+1%"],
                    ["Satisfacción", "4.6/5", "+0.3"],
                  ].map(([label, value, hint]) => (
                    <MiniStat key={label} label={label} value={value} hint={hint} tone={label === "Errores" ? "red" : "green"} />
                  ))}
                </div>

                <div className="mt-6 grid gap-5 xl:grid-cols-[1.25fr_0.85fr]">
                  <Panel className="border-[var(--border-default)] p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h4 className="text-[18px] font-semibold">Probar el agente</h4>
                      <div className="flex items-center gap-2">
                        <Badge tone="slate">Modo de prueba</Badge>
                        <Badge tone="slate">Simulación</Badge>
                      </div>
                    </div>
                    <div className="space-y-4 rounded-[20px] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4">
                      <div className="ml-auto max-w-[72%] rounded-[18px] bg-[var(--brand-soft)] px-4 py-3">
                        <p className="text-[14px] text-[var(--text-primary)]">¿Cómo puedo restablecer mi contraseña de correo?</p>
                        <p className="mt-1 text-[12px] text-[var(--text-secondary)]">10:30 AM</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand-primary)]">
                          <Bot className="h-5 w-5" />
                        </div>
                        <div className="max-w-[78%] rounded-[18px] border border-[var(--border-default)] bg-white px-4 py-4">
                          <p className="text-[14px] leading-7">
                            Para restablecer tu contraseña de correo:
                            <br />
                            1. Ve a <span className="text-[var(--brand-primary)]">portal.lean.com/login</span>
                            <br />
                            2. Haz clic en “¿Olvidaste tu contraseña?”
                            <br />
                            3. Ingresa tu correo corporativo.
                            <br />
                            4. Revisa tu bandeja y sigue las instrucciones.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          readOnly
                          value="Escribe tu mensaje..."
                          className="h-12 flex-1 rounded-[14px] border border-[var(--border-default)] bg-white px-4 text-[14px] text-[var(--text-muted)]"
                        />
                        <IconButton icon={<ArrowUpRight className="h-4 w-4" />} />
                      </div>
                    </div>
                  </Panel>

                  <Panel className="border-[var(--border-default)] p-5">
                    <SectionTitle title="Actividad reciente" />
                    <div className="space-y-4">
                      <ListDot color="#22c55e" title="Conversación completada" detail="Hace 2 min" />
                      <ListDot color="#22c55e" title="Respuesta correcta" detail="Hace 5 min" />
                      <ListDot color="#f97316" title="Herramienta ejecutada" detail="Hace 12 min" />
                      <ListDot color="#ef4444" title="Ticket creado" detail="Hace 18 min" />
                      <ListDot color="#14b8a6" title="Contexto actualizado" detail="Hace 25 min" />
                    </div>
                    <AppButton className="mt-6 w-full" icon={<MonitorCheck className="h-4 w-4" />}>
                      Ver monitoreo en vivo
                    </AppButton>
                  </Panel>
                </div>
              </Panel>
            </div>

            <div className="space-y-5">
              <Panel className="p-6">
                <SectionTitle title="Cobertura del blueprint" linkLabel="" />
                <div className="grid items-center gap-6">
                  <DonutChart
                    centerValue="87%"
                    centerLabel=""
                    segments={[
                      { value: 87, color: "#4f46f5" },
                      { value: 9, color: "#c4b5fd" },
                      { value: 4, color: "#e0e7ff" },
                    ]}
                    size={190}
                  />
                  <div className="space-y-3">
                    <StatRow label="Implementado" value="87%" tone="violet" />
                    <StatRow label="Parcial" value="9%" tone="blue" />
                    <StatRow label="Pendiente" value="4%" tone="slate" />
                  </div>
                </div>
              </Panel>

              <Panel className="p-6">
                <SectionTitle title="Subprocesos especializados" linkLabel="" />
                <div className="space-y-4">
                  <LinkRow label="Restablecimiento de acceso" detail="Activo • 86% de cobertura" />
                  <LinkRow label="Reporte de incidentes" detail="Activo • 79% de cobertura" />
                </div>
              </Panel>

              <Panel className="p-6">
                <SectionTitle title="Próximos pasos recomendados" linkLabel="" />
                <Checklist
                  items={[
                    { label: "Revisar 2 riesgos activos", state: "alert" },
                    { label: "Mejorar cobertura en 3 skills", state: "pending" },
                    { label: "Ejecutar evaluación de seguridad", state: "pending" },
                  ]}
                />
              </Panel>
            </div>
          </div>
        </div>
      </PageChrome>
    </WorkspaceShell>
  );
}

export function TemplatesPage() {
  return (
    <WorkspaceShell sidebarFooter={<WorkspaceUserCard name="María González" subtitle="Admin" initials="MG" />}>
      <PageChrome
        breadcrumbs={["Proyectos", "Plantillas y artefactos"]}
        actions={
          <>
            <AppButton icon={<RefreshCcw className="h-4 w-4" />}>Actualizar ACP</AppButton>
            <AppButton variant="primary">Regenerar ACP</AppButton>
            <TopUtilities />
          </>
        }
      >
        <div className="space-y-8">
          <PanelHeader
            title="Plantillas y artefactos"
            description="Inspecciona el ACP, sus gaps de continuidad y los artefactos versionados listos para handoff."
          />

          <div className="grid gap-4 lg:grid-cols-5">
            <HeaderMetricCard title="Progreso real" value="72%" subtitle="Captura" progress={72} />
            <HeaderMetricCard title="Siguiente foco" value="Descubrir" subtitle="Continuar por descubrir." />
            <HeaderMetricCard title="Atención operativa" value="Sin bloqueos visibles" badge={<Badge tone="green">Sin bloqueos visibles</Badge>} />
            <HeaderMetricCard title="Workspace activo" value="Nueva sesión" />
            <HeaderMetricCard title="Admin del proyecto" value="Lean Builder Admin" subtitle="admin@leanbuilder.local" />
          </div>

          <Panel className="p-6">
            <TabList tabs={["ACP", "Artefactos", "Exportes"]} active="ACP" />
            <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-5">
                <Panel className="border-[var(--border-default)] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-[28px] font-semibold">ACP versionado</h3>
                      <p className="mt-1 text-[15px] text-[var(--text-secondary)]">
                        Revisa, compara y evalúa el diseño del Agente en una sola vista maestra.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge tone="slate">v2.3.1 (Actual)</Badge>
                      <AppButton>Comparar</AppButton>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Badge tone="slate">Sin preview</Badge>
                    <Badge tone="orange">Continuidad</Badge>
                    <Badge tone="green">Prompts</Badge>
                  </div>
                  <div className="mt-6 grid gap-4 md:grid-cols-5">
                    {[
                      ["Package valid", "—", "Cargar preview"],
                      ["Construcción", "—", "Sin readiness calculado"],
                      ["Gaps bloqueantes", "0", "Cierres requeridos en serio."],
                      ["Preguntas abiertas", "0", "Ciclo vivo de captura."],
                      ["Estado", "Pendiente de builder", "Última actualización 15 Jun 2024"],
                    ].map(([label, value, detail]) => (
                      <MiniStat key={label} label={label} value={value} hint={detail} tone="slate" />
                    ))}
                  </div>
                </Panel>

                <div className="panel-dark p-7">
                  <p className="text-eyebrow text-[11px] text-white/55">Preview del ACP</p>
                  <h3 className="mt-3 text-[32px] font-semibold text-white">Hub canónico del ACP versionado</h3>
                  <p className="mt-3 max-w-2xl text-[16px] leading-7 text-white/70">
                    Esta vista concentra el ACP versionado y el browser de artefactos para que revisar, comparar y exportar no se sienta como flujos separados.
                  </p>
                  <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_300px]">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-4">
                        <FlowStep label="Entrada" />
                        <FlowStep label="Memoria" />
                        <FlowStep label="Razonamiento" />
                        <FlowStep label="Herramientas" />
                        <FlowStep label="Respuesta" />
                      </div>
                      <AppButton className="w-fit bg-white/8 text-white hover:bg-white/12" variant="ghost">
                        Abrir vista detallada
                      </AppButton>
                    </div>
                    <div className="rounded-[20px] border border-white/10 bg-white/5 p-5">
                      <SectionTitle title="Checklist de esta versión" linkLabel="" />
                      <Checklist
                        items={[
                          { label: "Objetivo definido", state: "done" },
                          { label: "KPIs definidos", state: "done" },
                          { label: "Riesgos identificados", state: "done" },
                          { label: "Restricciones", state: "done" },
                          { label: "Stakeholders", state: "done" },
                        ]}
                      />
                    </div>
                  </div>
                </div>

                <Panel className="p-6">
                  <SectionTitle title="Exportar y compartir" linkLabel="" />
                  <div className="grid gap-3 md:grid-cols-4">
                    <AppButton variant="primary" icon={<FileCode2 className="h-4 w-4" />}>
                      Exportar JSON
                    </AppButton>
                    <AppButton>Exportar Markdown</AppButton>
                    <AppButton>Copiar manifest.yaml</AppButton>
                    <AppButton>Descargar ACP .zip</AppButton>
                  </div>
                </Panel>

                <div className="grid gap-5 xl:grid-cols-2">
                  <Panel className="p-6">
                    <SectionTitle title="Browser de artefactos" linkLabel="" />
                    <div className="mb-5 flex flex-wrap gap-2">
                      <Badge tone="violet">0 artefactos</Badge>
                      <Badge tone="orange">ACP</Badge>
                      <Badge tone="green">Exportes</Badge>
                      <Badge tone="orange">Hub parcial</Badge>
                    </div>
                    <div className="flex gap-3">
                      <TextField label="" placeholder="Buscar artefactos..." className="flex-1" />
                      <IconButton icon={<LayoutGrid className="h-4 w-4" />} />
                    </div>
                    <div className="mt-6 rounded-[22px] border border-[var(--border-default)] bg-[var(--surface-subtle)] px-6 py-12 text-center">
                      <FileStack className="mx-auto h-10 w-10 text-[var(--text-muted)]" />
                      <p className="mt-4 text-[22px] font-semibold">Aún no hay artefactos registrados</p>
                      <p className="mt-3 text-[15px] text-[var(--text-secondary)]">
                        Construye y ajusta el blueprint y luego exporta para poblar el browser versionado.
                      </p>
                      <AppButton variant="primary" className="mt-6">
                        Ir a Diseñar
                      </AppButton>
                    </div>
                  </Panel>

                  <Panel className="p-6">
                    <SectionTitle title="Inspector de artefacto" linkLabel="" />
                    <TabList tabs={["Vista previa", "Metadata", "Origen"]} active="Vista previa" className="mb-5" />
                    <div className="panel-dark p-6">
                      <p className="text-[24px] font-semibold text-white">Selecciona un artefacto</p>
                      <p className="mt-3 text-[15px] text-white/68">
                        Selecciona un artefacto para ver su comparativo y metadatos.
                      </p>
                      <div className="mt-6 rounded-[16px] border border-white/10 bg-white/6 px-4 py-4 text-white/68">
                        Elige un artefacto para ver su contenido
                      </div>
                    </div>
                  </Panel>
                </div>
              </div>

              <Panel className="p-6">
                <SectionTitle title="Inspector del ACP" linkLabel="" />
                <div className="space-y-6">
                  <div className="space-y-3">
                    <KeyValue label="Versión" value="v2.3.1 (Actual)" />
                    <KeyValue label="Creado" value="15 Jun 2024, 9:15 AM" />
                    <KeyValue label="Actualizado" value="15 Jun 2024, 10:30 AM" />
                    <KeyValue label="Por" value="Lean Builder Admin" />
                  </div>
                  <div>
                    <p className="text-eyebrow text-[11px] text-[var(--text-muted)]">Cobertura del blueprint</p>
                    <p className="mt-2 text-[36px] font-semibold">98%</p>
                    <ProgressBar value={98} className="mt-4" color="var(--success)" />
                    <button type="button" className="mt-4 text-[14px] font-medium text-[var(--brand-primary)]">
                      Ver detalle
                    </button>
                  </div>
                  <div className="rounded-[18px] border border-[var(--border-default)] px-4 py-4">
                    <p className="text-eyebrow text-[11px] text-[var(--text-muted)]">Próximo corte útil</p>
                    <p className="mt-2 text-[18px] font-semibold">Roadmap</p>
                    <p className="mt-2 text-[14px] leading-6 text-[var(--text-secondary)]">
                      Roadmap formal del blueprint para escalar de MVP a MVP 3 sin sobrediseñar.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Badge tone="green">Activo</Badge>
                      <Badge tone="green">Flag on</Badge>
                    </div>
                  </div>
                </div>
              </Panel>
            </div>
          </Panel>
        </div>
      </PageChrome>
    </WorkspaceShell>
  );
}

export function EvaluationsPage() {
  return (
    <WorkspaceShell variant="icon" moduleLabel="Evaluaciones">
      <PageChrome
        breadcrumbs={["Proyectos", "Asistente Soporte TI", "Hub de calidad"]}
        actions={
          <>
            <AppButton icon={<CalendarRange className="h-4 w-4" />}>Últimos 30 días</AppButton>
            <AppButton icon={<Download className="h-4 w-4" />}>Exportar</AppButton>
          </>
        }
      >
        <div className="space-y-8">
          <PanelHeader
            title="Evaluaciones"
            description="Centro consolidado de calidad del agente. Compara corridas, descubre hallazgos y asegura la mejora continua."
            eyebrow="Hub de calidad histórica"
          />

          <Panel className="p-5">
            <TabList tabs={["Resumen", "Dataset", "Rúbrica", "Corridas", "Reporte"]} active="Resumen" />
          </Panel>

          <Panel className="p-6">
            <SectionTitle title="Panorama de calidad" linkLabel="" />
            <div className="grid gap-4 xl:grid-cols-5">
              <Panel className="p-5">
                <p className="text-[13px] text-[var(--text-secondary)]">Score de calidad</p>
                <p className="mt-4 text-[54px] font-semibold">92<span className="text-[22px] text-[var(--text-secondary)]">/100</span></p>
                <Badge tone="green" className="mt-4">▲ 8 pts vs. período anterior</Badge>
                <Sparkline values={[62, 68, 71, 69, 78, 74, 81, 84, 92]} className="mt-6 h-12" />
              </Panel>
              <Panel className="p-5">
                <p className="text-[13px] text-[var(--text-secondary)]">Corridas ejecutadas</p>
                <p className="mt-4 text-[54px] font-semibold">12</p>
                <p className="text-[14px] text-[var(--text-secondary)]">Total</p>
                <MiniBarChart values={[4, 8, 7, 9, 8, 6, 11, 7, 10, 8]} className="mt-5" />
              </Panel>
              <HeaderMetricCard title="Mejor corrida" value="96/100" subtitle="v2.3.1 • 15 Jun" badge={<Badge tone="green">Excelente</Badge>} />
              <HeaderMetricCard title="Cobertura de rúbrica" value="87%" subtitle="74/85 criterios evaluados" progress={87} />
              <HeaderMetricCard title="Hallazgos críticos" value="5" badge={<Badge tone="red">Requieren atención</Badge>} />
            </div>
          </Panel>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
            <Panel className="p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-[22px] font-semibold">Comparación de corridas</h3>
                  <p className="text-[14px] text-[var(--text-secondary)]">
                    Evolución del score de calidad en las últimas corridas.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge tone="violet">Score</Badge>
                  <Badge tone="slate">Cobertura</Badge>
                  <AppButton>Todas las versiones</AppButton>
                </div>
              </div>
              <div className="grid gap-5 xl:grid-cols-[1.25fr_0.85fr]">
                <ComparisonChart values={[72, 76, 79, 81, 87, 90, 96]} />
                <Panel className="border-[var(--border-default)] p-5">
                  <SimpleTable
                    columns={["Corrida", "Fecha", "Score", "Delta"]}
                    rows={[
                      ["v2.3.1", "15 Jun 10:30", "96", "▲ 6"],
                      ["v2.2.0", "10 Jun 09:15", "90", "▲ 4"],
                      ["v2.1.0", "5 Jun 14:40", "86", "▲ 5"],
                      ["v2.0.0", "1 Jun 11:20", "81", "▲ 4"],
                      ["v1.9.0", "25 May 16:05", "77", "▲ 5"],
                    ]}
                  />
                </Panel>
              </div>
            </Panel>

            <Panel className="p-6">
              <SectionTitle title="Salud de calidad" linkLabel="" />
              <DonutChart
                centerValue=""
                centerLabel="Saludable"
                segments={[
                  { value: 82, color: "#34d399" },
                  { value: 18, color: "#dbeafe" },
                ]}
                size={220}
              />
              <p className="mt-5 text-center text-[14px] text-[var(--text-secondary)]">
                Tendencia estable
                <br />
                Sin degradaciones críticas
              </p>
            </Panel>
          </div>

          <div className="grid gap-5 xl:grid-cols-[0.95fr_1.1fr_0.75fr]">
            <Panel className="p-6">
              <SectionTitle title="Distribución de resultados" linkLabel="" />
              <div className="grid items-center gap-5">
                <DonutChart
                  centerValue="96"
                  centerLabel="Total de casos"
                  segments={[
                    { value: 72, color: "#22c55e" },
                    { value: 16, color: "#fbbf24" },
                    { value: 5, color: "#ef4444" },
                    { value: 3, color: "#94a3b8" },
                  ]}
                />
                <div className="space-y-3">
                  <StatRow label="Correctos" value="72 (75%)" tone="green" />
                  <StatRow label="Parciales" value="16 (17%)" tone="orange" />
                  <StatRow label="Incorrectos" value="5 (5%)" tone="red" />
                  <StatRow label="No evaluables" value="3 (3%)" tone="slate" />
                </div>
              </div>
            </Panel>
            <Panel className="p-6">
              <SectionTitle title="Performance por dimensión" linkLabel="" />
              <BarsByDimension
                items={[
                  { label: "Exactitud", value: 96 },
                  { label: "Completitud", value: 92 },
                  { label: "Seguridad", value: 88, color: "var(--warning)" },
                  { label: "Claridad", value: 95 },
                  { label: "Adherencia", value: 93 },
                ]}
              />
            </Panel>
            <Panel className="p-6">
              <SectionTitle title="Hallazgos críticos" linkLabel="" />
              <Checklist
                items={[
                  { label: "Respuestas incompletas", state: "alert", detail: "Impacta a 23% de los casos" },
                  { label: "Falta de contexto", state: "alert", detail: "Impacta a 18% de los casos" },
                  { label: "Variabilidad en tono", state: "pending", detail: "Impacta a 12% de los casos" },
                  { label: "Buenas prácticas", state: "done", detail: "Fortaleza del agente" },
                ]}
              />
            </Panel>
          </div>

          <Panel className="p-6">
            <SectionTitle title="Recomendaciones clave" linkLabel="" />
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { title: "Mejorar completitud", detail: "Refuerza instrucciones en pasos críticos del flujo.", Icon: Sparkles },
                { title: "Reducir preguntas innecesarias", detail: "Ajusta la estrategia de memoria y contexto.", Icon: BrainCircuit },
                { title: "Estandarizar tono y estilo", detail: "Aplica guías de estilo y ejemplos.", Icon: Shield },
              ].map((item) => (
                <div key={item.title} className="rounded-[18px] border border-[var(--border-default)] bg-white px-5 py-5">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-[14px] bg-[var(--brand-soft)] text-[var(--brand-primary)]">
                    <item.Icon className="h-5 w-5" />
                  </div>
                  <p className="text-[18px] font-semibold">{item.title}</p>
                  <p className="mt-3 text-[14px] leading-6 text-[var(--text-secondary)]">{item.detail}</p>
                  <button type="button" className="mt-5 text-[14px] font-medium text-[var(--brand-primary)]">
                    Ver detalle
                  </button>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="overflow-hidden bg-[linear-gradient(180deg,#f3f0ff_0%,#efe8ff_100%)] px-6 py-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[24px] font-semibold">Revisa en detalle las corridas o lanza una nueva evaluación</p>
                <p className="mt-2 text-[15px] text-[var(--text-secondary)]">
                  Explora el historial, profundiza hallazgos o ejecuta una nueva corrida sobre tu dataset y rúbrica vigentes.
                </p>
              </div>
              <AppButton variant="primary" className="md:min-w-[320px]">
                Ver corridas y ejecutar evaluación
              </AppButton>
            </div>
          </Panel>
        </div>
      </PageChrome>
    </WorkspaceShell>
  );
}

export function MonitoringPage() {
  return (
    <WorkspaceShell variant="icon" moduleLabel="Monitoreo">
      <PageChrome
        breadcrumbs={["Proyectos", "Asistente Soporte TI", "Monitoreo"]}
        actions={
          <>
            <AppButton>Últimos 7 días</AppButton>
            <IconButton icon={<RefreshCcw className="h-4 w-4" />} />
            <AppButton icon={<CircleGauge className="h-4 w-4" />}>Configurar monitores</AppButton>
          </>
        }
      >
        <div className="space-y-8">
          <PanelHeader
            title="Monitoreo operativo"
            description="Supervisa la salud, calidad y rendimiento de tu agente en producción en tiempo real."
          />

          <div className="grid gap-4 xl:grid-cols-6">
            <HeaderMetricCard title="Salud operativa" value="98%" badge={<Badge tone="green">Saludable</Badge>} sparkline={[84, 88, 85, 92, 90, 98]} />
            <HeaderMetricCard title="Conversaciones" value="2,543" badge={<Badge tone="green">+12%</Badge>} subtitle="vs. 7 días anteriores" />
            <HeaderMetricCard title="Tasa de resolución" value="86.7%" badge={<Badge tone="green">+4.3%</Badge>} />
            <HeaderMetricCard title="Tiempo promedio" value="1m 48s" badge={<Badge tone="green">-9%</Badge>} />
            <HeaderMetricCard title="Errores" value="23" badge={<Badge tone="red">-13%</Badge>} subtitle="Requieren atención" />
            <HeaderMetricCard title="CSAT promedio" value="4.6/5" badge={<Badge tone="green">+0.3</Badge>} subtitle="Satisfacción" />
          </div>

          <Panel className="p-5">
            <TabList tabs={["Salud", "Alertas", "Calibración", "Handoffs"]} active="Salud" />
          </Panel>

          <Panel className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-[22px] font-semibold">Tendencia operativa</h3>
                <p className="text-[14px] text-[var(--text-secondary)]">
                  Evolución de las métricas clave en el período seleccionado.
                </p>
              </div>
              <AppButton>Diario</AppButton>
            </div>
            <MultiSeriesChart
              series={[
                { color: "#4f46f5", values: [2500, 2380, 2600, 2480, 2660, 2640, 2550] },
                { color: "#22c55e", values: [3300, 3600, 3480, 3560, 3440, 3490, 3500] },
                { color: "#f59e0b", values: [1300, 1180, 1260, 1200, 1320, 1210, 1160] },
                { color: "#ef4444", values: [420, 480, 455, 430, 438, 502, 446] },
              ]}
            />
          </Panel>

          <div className="grid gap-5 xl:grid-cols-2">
            <Panel className="p-6">
              <SectionTitle title="Resumen de alertas" linkLabel="" />
              <div className="grid items-center gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
                <DonutChart
                  centerValue="23"
                  centerLabel="Total"
                  segments={[
                    { value: 5, color: "#ef4444" },
                    { value: 10, color: "#f59e0b" },
                    { value: 8, color: "#4f46f5" },
                  ]}
                  size={200}
                />
                <div className="space-y-4">
                  <StatRow label="Críticas" value="5" tone="red" />
                  <StatRow label="Advertencias" value="10" tone="orange" />
                  <StatRow label="Informativas" value="8" tone="violet" />
                </div>
              </div>
              <AppButton className="mt-5 w-full">Ver todas las alertas</AppButton>
            </Panel>

            <Panel className="p-6">
              <SectionTitle title="Alertas críticas" linkLabel="" />
              <div className="space-y-4">
                {[
                  ["Aumento de errores en autenticación", "Hace 15 min"],
                  ["Latencia elevada en MCP Server", "Hace 32 min"],
                  ["Caída en tasa de resolución", "Hace 1 h"],
                  ["Errores en flujo de reembolso", "Hace 2 h"],
                  ["Fallas en servicio PostgreSQL", "Hace 2 h"],
                ].map(([title, time]) => (
                  <div key={title} className="flex items-start justify-between gap-4 rounded-[16px] border border-[var(--border-default)] px-4 py-4">
                    <div className="flex gap-3">
                      <CircleAlert className="mt-0.5 h-5 w-5 text-[var(--danger)]" />
                      <div>
                        <p className="text-[15px] font-medium">{title}</p>
                        <p className="text-[13px] text-[var(--text-secondary)]">Requiere revisión inmediata.</p>
                      </div>
                    </div>
                    <span className="text-[13px] text-[var(--text-secondary)]">{time}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <Panel className="p-6">
              <SectionTitle title="Distribución por intención" linkLabel="" />
              <BarsByDimension
                items={[
                  { label: "Restablecimiento de contraseña", value: 61, color: "var(--brand-primary)" },
                  { label: "Consulta de factura", value: 49, color: "var(--brand-primary)" },
                  { label: "Reportar incidente", value: 38, color: "var(--brand-primary)" },
                  { label: "Solicitud de acceso", value: 32, color: "var(--brand-primary)" },
                  { label: "Problemas con pago", value: 27, color: "var(--brand-primary)" },
                ]}
              />
            </Panel>

            <Panel className="p-6">
              <SectionTitle title="Distribución de calidad" linkLabel="" />
              <div className="grid items-center gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
                <DonutChart
                  centerValue=""
                  centerLabel=""
                  segments={[
                    { value: 86.7, color: "#22c55e" },
                    { value: 9.2, color: "#f59e0b" },
                    { value: 4.1, color: "#ef4444" },
                  ]}
                />
                <div className="space-y-4">
                  <StatRow label="Exitosas" value="86.7% (2,206)" tone="green" />
                  <StatRow label="Parciales" value="9.2% (234)" tone="orange" />
                  <StatRow label="Fallidas" value="4.1% (103)" tone="red" />
                </div>
              </div>
            </Panel>
          </div>

          <Panel className="p-6">
            <SectionTitle title="Salud por integración" linkLabel="" />
            <SimpleTable
              columns={["Integración", "Estado", "Latencia promedio", "Tasa de éxito", "Tendencia"]}
              rows={[
                ["Auth Service", <Badge key="health-auth" tone="green">Saludable</Badge>, "120ms", "99.3%", <Sparkline key="health-auth-trend" values={[68, 71, 72, 70, 75, 78]} />],
                ["PostgreSQL", <Badge key="health-pg" tone="green">Saludable</Badge>, "95ms", "99.1%", <Sparkline key="health-pg-trend" values={[60, 63, 62, 64, 67, 70]} />],
                ["MCP Server", <Badge key="health-mcp" tone="orange">Advertencia</Badge>, "1,250ms", "95.4%", <Sparkline key="health-mcp-trend" values={[40, 44, 43, 46, 48, 52]} color="#f59e0b" />],
                ["OpenAI (GPT-4o mini)", <Badge key="health-openai" tone="green">Saludable</Badge>, "850ms", "98.8%", <Sparkline key="health-openai-trend" values={[62, 61, 63, 64, 66, 68]} />],
                ["Email Service", <Badge key="health-mail" tone="blue">Informativa</Badge>, "210ms", "99.9%", <Sparkline key="health-mail-trend" values={[58, 59, 60, 61, 62, 63]} />],
              ]}
            />
          </Panel>

          <div className="grid gap-5 xl:grid-cols-2">
            <Panel className="p-6">
              <SectionTitle title="Timeline de eventos" linkLabel="" />
              <div className="space-y-4">
                {[
                  ["Se resolvió la alerta: Latencia elevada en MCP Server", "Hace 10 min"],
                  ["Despliegue de versión v2.1.0", "Hace 1 h"],
                  ["Aumento de errores en autenticación detectado", "Hace 2 h"],
                  ["Integración Email Service restablecida", "Hace 5 h"],
                  ["Mantenimiento programado completado", "Hace 1 día"],
                ].map(([label, time]) => (
                  <div key={label} className="flex items-start justify-between gap-4 rounded-[16px] border border-[var(--border-default)] px-4 py-4">
                    <div className="flex gap-3">
                      <History className="mt-0.5 h-5 w-5 text-[var(--brand-primary)]" />
                      <p className="text-[14px] text-[var(--text-primary)]">{label}</p>
                    </div>
                    <span className="text-[13px] text-[var(--text-secondary)]">{time}</span>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel className="p-6">
              <SectionTitle title="Handoffs recientes" linkLabel="" />
              <div className="space-y-4">
                {[
                  ["Problema de configuración avanzada", "Hace 20 min", "Completado", "green"],
                  ["Solicitud especial de reembolso", "Hace 45 min", "En progreso", "orange"],
                  ["Fallos recurrentes en sistema", "Hace 1 h", "Completado", "green"],
                ].map(([label, time, state, tone]) => (
                  <div key={label} className="rounded-[16px] border border-[var(--border-default)] px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[15px] font-medium">{label}</p>
                      <Badge tone={tone as "green" | "orange"}>{state}</Badge>
                    </div>
                    <p className="mt-2 text-[13px] text-[var(--text-secondary)]">{time}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </PageChrome>
    </WorkspaceShell>
  );
}

export function LibraryPage() {
  return (
    <WorkspaceShell variant="icon" moduleLabel="Biblioteca">
      <PageChrome
        breadcrumbs={["Workspace", "Nueva sesión", "Biblioteca"]}
        actions={
          <>
            <AppButton icon={<Download className="h-4 w-4" />}>Exportar</AppButton>
            <AppButton variant="primary" icon={<Plus className="h-4 w-4" />}>
              Nuevo proyecto
            </AppButton>
            <TopUtilities />
          </>
        }
      >
        <div className="space-y-8">
          <PanelHeader
            eyebrow="Módulo operativo"
            title="Biblioteca"
            description="Busca, rastrea y explica artefactos, lineage del blueprint y trazas persistidas."
          />

          <div className="grid gap-4 xl:grid-cols-4">
            <HeaderMetricCard title="Progreso real" value="0%" progress={0} />
            <HeaderMetricCard title="Siguiente foco" value="Descubrir" subtitle="La sesión sigue trazada en captura." />
            <HeaderMetricCard title="Atención operativa" value="Sin bloqueos" badge={<Badge tone="green">Sin bloqueos</Badge>} />
            <Panel className="grid grid-cols-3 divide-x divide-[var(--border-subtle)] p-5">
              <KeyValue label="Artefactos totales" value="642" hint="+18 esta semana" />
              <KeyValue label="Versiones activas" value="198" hint="+7 esta semana" className="px-4" />
              <KeyValue label="Con bloqueos" value="3" hint="Requieren atención" className="pl-4" />
            </Panel>
          </div>

          <Panel className="p-6">
            <div className="grid gap-4 xl:grid-cols-[1.2fr_repeat(3,minmax(0,0.8fr))_0.9fr_auto_auto]">
              <TextField label="Filtros" placeholder="Buscar por nombre, contenido o acción..." />
              <AppButton className="justify-between">Todos los tipos</AppButton>
              <AppButton className="justify-between">Todas las etapas</AppButton>
              <AppButton className="justify-between">Todos los estados</AppButton>
              <AppButton className="justify-between">01/06/2024 - 15/06/2024</AppButton>
              <AppButton icon={<Filter className="h-4 w-4" />}>Más filtros</AppButton>
              <AppButton>Guardar vista</AppButton>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="violet">Tipos: Blueprint, Trace, Plantilla</Badge>
              <Badge tone="violet">Estados: Activo, Operativo</Badge>
              <Badge tone="violet">Rango: 01/06/2024 - 15/06/2024</Badge>
              <button type="button" className="text-[14px] font-medium text-[var(--brand-primary)]">
                Limpiar todo
              </button>
            </div>
          </Panel>

          <Panel className="p-0">
            <div className="grid xl:grid-cols-[1.05fr_1fr]">
              <div className="border-r border-[var(--border-subtle)] p-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-[22px] font-semibold">Resultados (128)</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <AppButton>Relevancia</AppButton>
                    <IconButton icon={<LayoutGrid className="h-4 w-4" />} />
                  </div>
                </div>
                <SimpleTable
                  columns={["Artefacto", "Tipo", "Etapa", "Estado", "Actualizado", "Versión"]}
                  rows={[
                    ["Fuente de verdad", <Badge key="artifact-truth-type" tone="violet">Blueprint</Badge>, "Discover", <Badge key="artifact-truth-state" tone="green">Activo</Badge>, "15 Jun 2024, 10:30", "v2.3.1"],
                    ["AI Sales Assistant", <Badge key="artifact-sales-type" tone="violet">Blueprint</Badge>, "Design", <Badge key="artifact-sales-state" tone="green">Activo</Badge>, "15 Jun 2024, 09:45", "v2.3.0"],
                    ["Evaluación de intención", <Badge key="artifact-eval-type" tone="blue">Trace</Badge>, "Evaluate", <Badge key="artifact-eval-state" tone="green">Activo</Badge>, "14 Jun 2024, 16:20", "v2.1.0"],
                    ["Plantilla: Onboarding Agent", <Badge key="artifact-template-type" tone="orange">Plantilla</Badge>, "Define", <Badge key="artifact-template-state" tone="green">Activo</Badge>, "14 Jun 2024, 11:12", "v1.4.2"],
                    ["Memoria: Ventas Q2", <Badge key="artifact-memory-type" tone="green">Memoria</Badge>, "Memory", <Badge key="artifact-memory-state" tone="green">Activo</Badge>, "13 Jun 2024, 14:05", "v1.0.0"],
                    ["Trace: Sesión 3f2a9c", <Badge key="artifact-trace-type" tone="blue">Trace</Badge>, "Operate", <Badge key="artifact-trace-state" tone="green">Activo</Badge>, "13 Jun 2024, 10:02", "v1.2.3"],
                  ]}
                />
                <div className="mt-4 flex items-center justify-between text-[13px] text-[var(--text-secondary)]">
                  <span>1-20 de 128</span>
                  <div className="flex items-center gap-3">
                    <AppButton>20</AppButton>
                    <div className="flex items-center gap-2">
                      <Badge tone="violet">1</Badge>
                      <span>2</span>
                      <span>3</span>
                      <span>…</span>
                      <span>7</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-[24px] font-semibold">Inspector del artefacto</h3>
                    <div className="mt-2 flex items-center gap-3">
                      <p className="text-[18px] font-semibold">Fuente de verdad</p>
                      <Badge tone="green">Activo</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button" className="text-[14px] text-[var(--text-secondary)]">
                      Cerrar
                    </button>
                    <ExternalLink className="h-4 w-4 text-[var(--text-muted)]" />
                  </div>
                </div>

                <TabList tabs={["Vista previa", "Origen", "Metadata"]} active="Vista previa" />

                <div className="mt-6 grid gap-5">
                  <Panel className="border-[var(--border-default)] p-5">
                    <div className="grid gap-5 md:grid-cols-3">
                      <KeyValue label="Resumen" value="Artefacto principal que registra la fuente de verdad y habilita lineage del blueprint." />
                      <KeyValue label="Etapa" value="Discover" />
                      <KeyValue label="Propietario" value="Lean Builder Admin" />
                    </div>
                  </Panel>
                  <Panel className="border-[var(--border-default)] p-5">
                    <SectionTitle title="Lineage del blueprint" linkLabel="" />
                    <div className="flex flex-wrap items-center gap-3">
                      <FlowStep label="Entradas 3" />
                      <FlowStep label="Procesos 5" />
                      <FlowStep label="Salidas 3" />
                      <div className="rounded-[16px] border border-[var(--brand-soft)] bg-[var(--brand-soft)] px-4 py-4 text-[14px] font-semibold text-[var(--brand-primary)]">
                        Trazas 128
                      </div>
                    </div>
                  </Panel>
                  <div className="grid gap-5 xl:grid-cols-[1fr_260px]">
                    <Panel className="border-[var(--border-default)] p-5">
                      <SectionTitle title="Actividad reciente" linkLabel="Ver historial completo" />
                      <SimpleTable
                        columns={["Evento", "Detalle", "Hace"]}
                        rows={[
                          ["Blueprint actualizado", "Se actualizó la configuración del flujo principal.", "Hace 15 min"],
                          ["Nueva traza persistida", "Sesión 3f2a9c registrada exitosamente.", "Hace 35 min"],
                          ["Entrada conectada", "Fuente CRM clientes vinculada.", "Hace 2 horas"],
                        ]}
                      />
                    </Panel>
                    <Panel className="border-[var(--border-default)] p-5">
                      <SectionTitle title="Usado en" linkLabel="" />
                      <div className="space-y-3">
                        <LinkRow label="AI Sales Assistant" />
                        <LinkRow label="HR Onboarding Agent" />
                        <LinkRow label="Customer Support Bot" />
                      </div>
                    </Panel>
                  </div>
                  <div className="grid gap-5 xl:grid-cols-[1fr_0.85fr]">
                    <Panel className="border-[var(--border-default)] p-5">
                      <SectionTitle title="Etiquetas" linkLabel="" />
                      <div className="flex flex-wrap gap-2">
                        {["fuente-de-verdad", "lineage", "registry", "trazas", "persistencia"].map((tag) => (
                          <Badge key={tag} tone="slate">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </Panel>
                    <Panel className="border-[var(--border-default)] p-5">
                      <SectionTitle title="Notas" linkLabel="Agregar nota" />
                      <p className="text-[14px] text-[var(--text-secondary)]">Sin notas</p>
                    </Panel>
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </PageChrome>
    </WorkspaceShell>
  );
}

export function IntegrationsPage() {
  return (
    <WorkspaceShell variant="icon" moduleLabel="Integraciones">
      <PageChrome
        breadcrumbs={["Workspace", "Nueva sesión", "Integraciones"]}
        actions={
          <>
            <AppButton>AI Sales Assistant</AppButton>
            <TopUtilities />
          </>
        }
      >
        <div className="space-y-8">
          <PanelHeader
            eyebrow="Hub de arquitectura"
            title="Integraciones"
            description="Visibilidad del stack base para backend, frontend, datos y motor LLM."
          />

          <div className="grid gap-4 xl:grid-cols-5">
            <HeaderMetricCard title="Salud general" value="98%" badge={<Badge tone="green">Saludable</Badge>} sparkline={[78, 82, 84, 83, 88, 92]} />
            <HeaderMetricCard title="Servicios activos" value="24/26" badge={<Badge tone="green">Activos</Badge>} />
            <HeaderMetricCard title="Incidentes" value="1" badge={<Badge tone="red">Requiere atención</Badge>} />
            <HeaderMetricCard title="Latencia promedio" value="182 ms" badge={<Badge tone="green">▼ 18 ms</Badge>} />
            <HeaderMetricCard title="Disponibilidad" value="99.2%" badge={<Badge tone="green">▲ 0.3%</Badge>} />
          </div>

          <Panel className="p-6">
            <SectionTitle title="Salud de servicios críticos" linkLabel="Ver todos los servicios" />
            <div className="grid gap-4 xl:grid-cols-6">
              {[
                ["OpenAI", "GPT-4o", "99.9%", "231 ms", "Healthy", "#22c55e"],
                ["PostgreSQL", "Database", "99.8%", "96 ms", "Healthy", "#22c55e"],
                ["Redis", "Cache", "98.1%", "145 ms", "Degraded", "#f59e0b"],
                ["MCP Server", "Tools & Context", "99.7%", "150 ms", "Healthy", "#22c55e"],
                ["Lean Builder API", "Backend", "99.9%", "112 ms", "Healthy", "#22c55e"],
              ].map(([title, detail, availability, latency, status, color]) => (
                <Panel key={title} className="border-[var(--border-default)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[16px] font-semibold">{title}</p>
                      <p className="text-[13px] text-[var(--text-secondary)]">{detail}</p>
                    </div>
                    <Badge tone={status === "Healthy" ? "green" : "orange"}>{status}</Badge>
                  </div>
                  <div className="mt-5 space-y-2">
                    <KeyValue label="Disponibilidad" value={availability} />
                    <KeyValue label="Latencia P95" value={latency} />
                  </div>
                  <Sparkline values={[55, 58, 57, 60, 62, 65]} color={color} className="mt-6 h-10" />
                </Panel>
              ))}
              <button
                type="button"
                className="rounded-[20px] border border-dashed border-[var(--border-default)] bg-white px-4 py-6 text-center text-[var(--text-secondary)]"
              >
                <Plus className="mx-auto h-5 w-5 text-[var(--text-muted)]" />
                <p className="mt-4 text-[15px] font-medium">Agregar servicio</p>
              </button>
            </div>
          </Panel>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_320px]">
            <Panel className="p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-[22px] font-semibold">Arquitectura e integraciones</h3>
                  <p className="text-[14px] text-[var(--text-secondary)]">
                    Mapa del stack y flujo de datos entre servicios y capas.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge tone="violet">Flujo de datos</Badge>
                  <Badge tone="slate">Capas</Badge>
                </div>
              </div>
              <Panel className="border-[var(--border-default)] bg-[var(--surface-subtle)] p-6">
                <div className="grid place-items-center gap-6">
                  <div className="flex flex-wrap items-center justify-center gap-5">
                    <div className="rounded-[16px] border border-[var(--border-default)] bg-white px-5 py-4 text-center">
                      <p className="font-medium">Web App</p>
                      <p className="text-[13px] text-[var(--text-secondary)]">Frontend</p>
                    </div>
                    <div className="rounded-[16px] border border-[var(--border-default)] bg-white px-5 py-4 text-center">
                      <p className="font-medium">Mobile App</p>
                      <p className="text-[13px] text-[var(--text-secondary)]">Frontend</p>
                    </div>
                  </div>
                  <FlowStep label="API Gateway" />
                  <div className="flex flex-wrap items-center justify-center gap-5">
                    <FlowStep label="Auth Service" />
                    <FlowStep label="Lean Builder API" />
                    <FlowStep label="AI Orchestrator" />
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-5">
                    <FlowStep label="PostgreSQL" />
                    <FlowStep label="Redis Cache" />
                    <FlowStep label="S3 Storage" />
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-5">
                    <FlowStep label="OpenAI" />
                    <FlowStep label="MCP Server" />
                    <FlowStep label="External APIs" />
                  </div>
                </div>
              </Panel>
            </Panel>

            <div className="space-y-5">
              <Panel className="p-6">
                <SectionTitle title="Resumen de arquitectura" linkLabel="" />
                <div className="space-y-3">
                  <StatRow label="Capas" value="6" />
                  <StatRow label="Servicios" value="26" />
                  <StatRow label="Integraciones externas" value="8" />
                  <StatRow label="Flujos de datos" value="18" />
                  <StatRow label="Último escaneo" value="Hoy, 10:30 AM" />
                </div>
              </Panel>
              <Panel className="p-6">
                <SectionTitle title="Actividad reciente" linkLabel="Ver todas las actividades" />
                <div className="space-y-4">
                  <ListDot color="#ef4444" title="Redis" detail="Alta latencia detectada • Hace 5 min" />
                  <ListDot color="#f59e0b" title="Evolución" detail="Tiempo de respuesta elevado • Hace 15 min" />
                  <ListDot color="#4f46f5" title="MCP Server" detail="Despliegue completado • Hace 32 min" />
                  <ListDot color="#22c55e" title="PostgreSQL" detail="Conexiones estables • Hace 1 h" />
                </div>
              </Panel>
            </div>
          </div>

          <Panel className="p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-[22px] font-semibold">Servicios e integraciones</h3>
                <p className="text-[14px] text-[var(--text-secondary)]">
                  Inventario de servicios con métricas de salud y rendimiento.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <TextField label="" placeholder="Buscar servicio o integración..." />
                <AppButton>Todos los estados</AppButton>
                <AppButton>Todas las capas</AppButton>
                <IconButton icon={<LayoutGrid className="h-4 w-4" />} />
                <AppButton variant="primary" icon={<Plus className="h-4 w-4" />}>
                  Nuevo servicio
                </AppButton>
              </div>
            </div>
            <SimpleTable
              columns={["Servicio", "Capa", "Estado", "Disponibilidad", "Latencia P95", "Tendencia", "Último check"]}
              rows={[
                ["OpenAI (GPT-4o)", "LLM Provider", <Badge key="service-openai-state" tone="green">Healthy</Badge>, "99.9%", "231 ms", <Sparkline key="service-openai-trend" values={[50, 54, 52, 55, 57, 60]} />, "10:30 AM"],
                ["PostgreSQL", "Database", <Badge key="service-pg-state" tone="green">Healthy</Badge>, "99.8%", "96 ms", <Sparkline key="service-pg-trend" values={[61, 62, 61, 65, 66, 68]} />, "10:30 AM"],
                ["Redis", "Cache", <Badge key="service-redis-state" tone="orange">Degraded</Badge>, "98.1%", "145 ms", <Sparkline key="service-redis-trend" values={[40, 43, 44, 48, 50, 55]} color="#f59e0b" />, "10:30 AM"],
                ["MCP Server", "Tools", <Badge key="service-mcp-state" tone="green">Healthy</Badge>, "99.7%", "150 ms", <Sparkline key="service-mcp-trend" values={[58, 60, 62, 63, 64, 66]} />, "10:30 AM"],
                ["Lean Builder API", "Backend", <Badge key="service-api-state" tone="green">Healthy</Badge>, "99.9%", "112 ms", <Sparkline key="service-api-trend" values={[56, 58, 59, 61, 63, 65]} />, "10:30 AM"],
              ]}
            />
          </Panel>

          <Panel className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-[22px] font-semibold">Catálogos y runtime</h3>
              <button type="button" className="text-[14px] font-medium text-[var(--brand-primary)]">
                Expandir todos
              </button>
            </div>
            <div className="space-y-4">
              {[
                { title: "Integraciones vivas y runtime", detail: "Estado en tiempo real de servicios y catálogos operativos.", pills: ["22 Healthy", "2 Degraded", "0 Down"] },
                { title: "Arquitectura y componentes", detail: "Servicios base, dependencias y capas del stack.", pills: ["18 Healthy", "1 Degraded", "0 Down"] },
                { title: "Catálogos de habilidades y herramientas", detail: "Habilidades, prompts, herramientas y flujos disponibles.", pills: ["45 Activas", "3 En revisión", "2 Inactivas"] },
                { title: "Catálogos de conocimiento", detail: "Fuentes de datos, documentos y memoria.", pills: ["12 Sin cambios", "1 Actualizado", "0 Con errores"] },
                { title: "Templates y workflows", detail: "Plantillas, flujos y automatizaciones.", pills: ["9 Publicados", "1 Borrador", "0 Con errores"] },
              ].map((item) => (
                <div key={item.title} className="flex flex-col gap-4 rounded-[18px] border border-[var(--border-default)] px-5 py-5 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <p className="text-[17px] font-semibold">{item.title}</p>
                    <p className="text-[14px] text-[var(--text-secondary)]">{item.detail}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.pills.map((pill, index) => (
                      <Badge key={pill} tone={index === 0 ? "green" : index === 1 ? "orange" : "red"}>
                        {pill}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </PageChrome>
    </WorkspaceShell>
  );
}

export function SettingsPage() {
  return (
    <WorkspaceShell variant="icon" moduleLabel="Configuración">
      <PageChrome
        breadcrumbs={["Workspace", "Nueva sesión", "Configuración"]}
        actions={<AppButton icon={<ExternalLink className="h-4 w-4" />}>Ver documentación</AppButton>}
      >
        <div className="space-y-8">
          <PanelHeader
            eyebrow="Configuración"
            title="Configuración del workspace"
            description="Gestiona el entorno, runtime, políticas y calibración para operar tu builder con control y confianza."
          />

          <div className="grid gap-4 xl:grid-cols-4">
            <HeaderMetricCard title="Progreso general" value="72%" subtitle="Completado" progress={72} badge={<Badge tone="slate">Borrador</Badge>} />
            <HeaderMetricCard title="Siguiente paso" value="Descubrir" subtitle="Continuar por descubrir." />
            <HeaderMetricCard title="Atención operativa" value="Sin bloqueos visibles" badge={<Badge tone="green">Sin bloqueos visibles</Badge>} />
            <HeaderMetricCard title="Workspace activo" value="Lean Builder Admin" subtitle="admin@leanbuilder.local" />
          </div>

          <div className="grid gap-5 xl:grid-cols-[210px_minmax(0,1fr)_280px]">
            <Panel className="p-0">
              <div className="divide-y divide-[var(--border-subtle)]">
                {[
                  { title: "LLM Runtime", detail: "Motor y ejecución", active: true },
                  { title: "Calibración", detail: "Datos y pruebas", active: false },
                  { title: "Gobierno", detail: "Políticas y seguridad", active: false },
                  { title: "Workspace", detail: "Entorno y acceso", active: false },
                ].map((item) => (
                  <button
                    key={item.title}
                    type="button"
                    className={`flex w-full items-center gap-4 px-5 py-5 text-left ${
                      item.active ? "border-l-4 border-[var(--brand-primary)] bg-[var(--brand-soft)]" : ""
                    }`}
                  >
                    <div className={`flex h-11 w-11 items-center justify-center rounded-[14px] ${item.active ? "bg-[var(--gradient-primary)] text-white" : "bg-[var(--surface-subtle)] text-[var(--text-primary)]"}`}>
                      <Settings className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[16px] font-semibold">{item.title}</p>
                      <p className="text-[13px] text-[var(--text-secondary)]">{item.detail}</p>
                    </div>
                  </button>
                ))}
              </div>
            </Panel>

            <div className="space-y-5">
              <Panel className="p-6">
                <SectionTitle title="LLM Runtime" linkLabel="" />
                <div className="grid gap-4 md:grid-cols-2">
                  <Panel className="border-[var(--border-default)] p-5">
                    <KeyValue label="Proveedor activo" value="OpenAI" />
                    <div className="mt-3 flex items-center gap-2">
                      <Badge tone="green">Activo</Badge>
                      <span className="text-[13px] text-[var(--text-secondary)]">Conexión verificada</span>
                    </div>
                  </Panel>
                  <Panel className="border-[var(--border-default)] p-5">
                    <KeyValue label="Modelo" value="GPT-4o" hint="Última validación: Hace 5 min" />
                    <button type="button" className="mt-3 text-[14px] font-medium text-[var(--brand-primary)]">
                      Cambiar
                    </button>
                  </Panel>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <TextField label="Endpoint / Base URI" value="https://api.openai.com/v1" />
                  <TextField label="Versión de API" value="v1" />
                </div>

                <div className="mt-8">
                  <h4 className="mb-4 text-eyebrow text-[11px] text-[var(--text-muted)]">Configuración del runtime</h4>
                  <div className="grid gap-4 md:grid-cols-[1.5fr_0.85fr_0.85fr]">
                    <Panel className="border-[var(--border-default)] p-5">
                      <p className="text-[14px] font-medium">Temperatura</p>
                      <p className="mt-4 text-[28px] font-semibold">0.2</p>
                      <ProgressBar value={20} className="mt-4" />
                      <div className="mt-3 flex justify-between text-[12px] text-[var(--text-muted)]">
                        <span>0</span>
                        <span>0.5</span>
                        <span>1.0</span>
                        <span>2.0</span>
                      </div>
                    </Panel>
                    <TextField label="Max tokens" value="2048" />
                    <TextField label="Timeout" value="60 seg" />
                    <TextField label="Reintentos" value="2 veces" />
                    <TextField label="Backoff" value="Exponencial" />
                    <TextField label="Ventana de contexto" value="128k" />
                  </div>
                </div>

                <Panel className="mt-5 border-[var(--border-default)] p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="text-[16px] font-semibold">Configuración avanzada</h4>
                    <button type="button" className="text-[var(--text-muted)]">
                      ∧
                    </button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <TextField label="Top P" value="1.0" />
                    <TextField label="Frecuencia de penalización" value="0.0" />
                    <TextField label="Presencia de penalización" value="0.0" />
                  </div>
                </Panel>

                <Panel className="mt-5 border-[rgba(34,197,94,0.22)] bg-[rgba(34,197,94,0.05)] p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-[18px] font-semibold text-[var(--success)]">Conexión exitosa con OpenAI</p>
                      <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
                        Latencia: 124 ms • modelo: gpt-4o • región: us-east-1
                      </p>
                    </div>
                    <AppButton>Probar conexión</AppButton>
                  </div>
                </Panel>

                <SeparatorNote text="Buenas prácticas: usa valores moderados de temperatura (0.2 - 0.7) para obtener respuestas más consistentes." />
              </Panel>

              <div className="space-y-4">
                <CollapsedSection
                  icon={<Target className="h-5 w-5" />}
                  title="Calibración"
                  subtitle="Datos, pruebas y estimación para calibrar el comportamiento."
                  rightLabel="Última ejecución Hace 15 min"
                  badge={<Badge tone="green">92%</Badge>}
                />
                <CollapsedSection
                  icon={<Shield className="h-5 w-5" />}
                  title="Gobierno"
                  subtitle="Políticas, guardrails y controles de seguridad."
                  rightLabel="Políticas activas 8"
                  badge={<Badge tone="green">Cumpliente</Badge>}
                />
                <CollapsedSection
                  icon={<FolderCog className="h-5 w-5" />}
                  title="Workspace"
                  subtitle="Entorno, acceso e información general del workspace."
                  rightLabel="Estado"
                  badge={<Badge tone="violet">Borrador</Badge>}
                />
              </div>
            </div>

            <div className="space-y-5">
              <Panel className="p-6">
                <SectionTitle title="Resumen del workspace" linkLabel="" />
                <div className="space-y-3">
                  <StatRow label="Sesiones" value="11" />
                  <StatRow label="Snapshots" value="0" />
                  <StatRow label="Proyecto" value="Nueva sesión" />
                  <StatRow label="Acceso" value="admin@leanbuilder.local" />
                  <StatRow label="Estado" value={<Badge tone="violet">Borrador</Badge>} />
                </div>
              </Panel>
              <Panel className="p-6">
                <SectionTitle title="Salud del workspace" linkLabel="" />
                <div className="space-y-3">
                  <StatRow label="Cobertura de pruebas" value="92%" tone="green" />
                  <StatRow label="Políticas activas" value="8" tone="green" />
                  <StatRow label="Integraciones" value="3" tone="blue" />
                  <StatRow label="Riesgos abiertos" value="0" tone="orange" />
                </div>
              </Panel>
              <Panel className="p-6">
                <SectionTitle title="Acciones rápidas" linkLabel="" />
                <div className="space-y-3">
                  <LinkRow label="Probar runtime" />
                  <LinkRow label="Validar políticas" />
                  <LinkRow label="Exportar configuración" />
                  <AppButton variant="primary" className="mt-2 w-full">
                    Guardar cambios
                  </AppButton>
                </div>
              </Panel>
              <Panel className="p-6">
                <SectionTitle title="Historial reciente" linkLabel="Ver historial completo" />
                <div className="space-y-4">
                  <ListDot color="#4f46f5" title="Runtime actualizado" detail="Hace 5 min" />
                  <ListDot color="#22c55e" title="Políticas validadas" detail="Hace 1 hora" />
                  <ListDot color="#94a3b8" title="Snapshot creado" detail="Hace 2 horas" />
                </div>
              </Panel>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-[var(--border-subtle)] pt-5 text-[13px] text-[var(--text-muted)] md:flex-row md:items-center md:justify-between">
            <p>Último guardado: Hace 3 min por Lean Builder Admin</p>
            <p>ID del workspace: ws_7f3b2a8e</p>
          </div>
        </div>
      </PageChrome>
    </WorkspaceShell>
  );
}
