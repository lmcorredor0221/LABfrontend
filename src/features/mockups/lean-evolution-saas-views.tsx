"use client";

import { useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bot,
  Boxes,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  ClipboardCheck,
  Database,
  Download,
  Eye,
  FileSearch,
  FileText,
  Gauge,
  GitBranch,
  History,
  Layers3,
  Library,
  Lock,
  Network,
  Play,
  RefreshCcw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type SaasScreenKey =
  | "blueprint-free"
  | "blueprint-pro"
  | "acp-invitation"
  | "acp-gate"
  | "acp-workspace"
  | "export-center"
  | "launcher"
  | "commercial-audit"
  | "access-plan"
  | "admin-saas";

export type CommercialScenario = "free" | "pro" | "acp" | "restricted";

export const SAAS_SCREEN_OPTIONS: Array<{ key: SaasScreenKey; label: string; description: string }> = [
  { key: "blueprint-free", label: "Blueprint", description: "Resultado protegido" },
  { key: "blueprint-pro", label: "Blueprint Pro", description: "Adquisicion y descarga" },
  { key: "acp-invitation", label: "Invitacion ACP", description: "Valor incremental" },
  { key: "acp-gate", label: "Gate ACP", description: "Compra o permiso" },
  { key: "acp-workspace", label: "Workspace ACP", description: "Construccion guiada" },
  { key: "export-center", label: "Exportar", description: "Perfiles y conformance" },
  { key: "launcher", label: "Launcher", description: "Inicio portable" },
  { key: "commercial-audit", label: "Actividad", description: "Funnel y auditoria" },
  { key: "access-plan", label: "Plan y acceso", description: "Tier, rol y permisos" },
  { key: "admin-saas", label: "Admin SaaS", description: "Evolucion parametrizable" },
];

const SAAS_KEYS = new Set<SaasScreenKey>(SAAS_SCREEN_OPTIONS.map((item) => item.key));

export function isSaasScreenKey(value: string): value is SaasScreenKey {
  return SAAS_KEYS.has(value as SaasScreenKey);
}

type LegacyTarget = "stage" | "attention" | "diagrams" | "estimate" | "validate" | "package";
type NavigateTarget = SaasScreenKey | LegacyTarget;
type Tone = "brand" | "success" | "warning" | "danger" | "info" | "neutral";

type SaasViewProps = {
  active: SaasScreenKey;
  onNavigate: (screen: NavigateTarget) => void;
  scenario: CommercialScenario;
  onScenarioChange: (scenario: CommercialScenario) => void;
};

const toneClasses: Record<Tone, string> = {
  brand: "border-[var(--border-focus)] bg-[var(--brand-soft)] text-[var(--text-primary)]",
  success: "border-[var(--success)] bg-[var(--success-soft)] text-[var(--text-primary)]",
  warning: "border-[var(--warning)] bg-[var(--warning-soft)] text-[var(--text-primary)]",
  danger: "border-[var(--danger)] bg-[var(--danger-soft)] text-[var(--text-primary)]",
  info: "border-[var(--info)] bg-[var(--info-soft)] text-[var(--text-primary)]",
  neutral: "border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-secondary)]",
};

function StatusBadge({ children, tone = "neutral", className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-extrabold", toneClasses[tone], className)}>
      {children}
    </span>
  );
}

function ActionButton({
  children,
  icon: Icon,
  variant = "secondary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  icon?: LucideIcon;
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const styles = {
    primary:
      "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-[var(--text-inverse)] shadow-[var(--shadow-focus)] hover:bg-[var(--brand-primary-hover)]",
    secondary:
      "border-[var(--border-default)] bg-[var(--surface-panel)] text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]",
    ghost: "border-transparent bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]",
    danger: "border-[var(--danger)] bg-[var(--danger-soft)] text-[var(--text-primary)] hover:brightness-95",
  };
  return (
    <button
      {...props}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-[12px] font-extrabold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)] disabled:cursor-not-allowed disabled:opacity-45",
        styles[variant],
        className,
      )}
      type={props.type ?? "button"}
    >
      {Icon ? <Icon aria-hidden="true" className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}

function Surface({ children, className, ...props }: React.HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return (
    <section {...props} className={cn("rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface-panel)] shadow-[var(--shadow-card)]", className)}>
      {children}
    </section>
  );
}

const SCENARIO_META: Record<CommercialScenario, { plan: string; role: string; access: string; tone: Tone }> = {
  free: { plan: "Blueprint Free", role: "Owner", access: "Compra requerida", tone: "warning" },
  pro: { plan: "Blueprint Pro", role: "Owner", access: "Descarga Blueprint", tone: "success" },
  acp: { plan: "ACP Premium", role: "Owner", access: "Acceso completo", tone: "success" },
  restricted: { plan: "ACP Premium", role: "Viewer", access: "Permiso requerido", tone: "danger" },
};

const PRODUCT_NAV: Array<{ label: string; icon: LucideIcon; target: NavigateTarget; screen: SaasScreenKey | "diagrams" | "attention" }> = [
  { label: "Trabajo", icon: ClipboardCheck, target: "stage", screen: "attention" },
  { label: "Blueprint", icon: Layers3, target: "blueprint-free", screen: "blueprint-free" },
  { label: "ACP", icon: Boxes, target: "acp-invitation", screen: "acp-invitation" },
  { label: "Diagramas", icon: Network, target: "diagrams", screen: "diagrams" },
  { label: "Artefactos", icon: Library, target: "export-center", screen: "export-center" },
  { label: "Atencion", icon: AlertCircle, target: "attention", screen: "attention" },
  { label: "Actividad", icon: Activity, target: "commercial-audit", screen: "commercial-audit" },
];

function ProductShell({
  active,
  navSection,
  scenario,
  onScenarioChange,
  onNavigate,
  children,
}: SaasViewProps & { children: ReactNode; navSection?: "diagrams" }) {
  const meta = SCENARIO_META[scenario];
  const activeProduct = navSection ?? (active.startsWith("blueprint")
    ? "blueprint-free"
    : active.startsWith("acp") || active === "launcher"
      ? "acp-invitation"
      : active);
  return (
    <div className="min-h-[1100px] bg-[var(--surface-canvas)] font-[family-name:var(--font-sans-local)] text-[var(--text-primary)]">
      <header className="border-b border-[var(--border-default)] bg-[var(--surface-panel)] px-5 pt-5 lg:px-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone="brand">Asistente de soporte inteligente</StatusBadge>
              <StatusBadge tone={meta.tone}><CircleDot className="h-3 w-3" />{meta.plan}</StatusBadge>
              <StatusBadge>{meta.role}</StatusBadge>
            </div>
            <h1 className="mt-3 text-[26px] font-black tracking-[-0.035em]">Productos y construccion</h1>
            <p className="mt-1 text-[12px] text-[var(--text-secondary)]">Workspace Lean Builder / Tenant aislado / Blueprint v12</p>
          </div>
          <div className="min-w-[330px] rounded-2xl border border-[var(--border-default)] bg-[var(--surface-subtle)] p-3.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Simular acceso del mockup</p>
                <p className="mt-1 text-[11px] font-extrabold">{meta.access}</p>
              </div>
              <Settings className="h-4 w-4 text-[var(--brand-primary)]" />
            </div>
            <div className="mt-3 grid grid-cols-4 gap-1" role="group" aria-label="Escenario comercial">
              {(["free", "pro", "acp", "restricted"] as CommercialScenario[]).map((item) => (
                <button
                  aria-pressed={scenario === item}
                  className={cn(
                    "min-h-9 rounded-lg border px-2 text-[9px] font-extrabold transition",
                    scenario === item
                      ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-[var(--text-inverse)]"
                      : "border-[var(--border-default)] bg-[var(--surface-panel)] text-[var(--text-secondary)] hover:bg-[var(--brand-soft)]",
                  )}
                  key={item}
                  onClick={() => onScenarioChange(item)}
                  type="button"
                >
                  {item === "free" ? "Free" : item === "pro" ? "Pro" : item === "acp" ? "ACP" : "Sin permiso"}
                </button>
              ))}
            </div>
          </div>
        </div>
        <nav aria-label="Navegacion del producto" className="mt-5 flex gap-1 overflow-x-auto">
          {PRODUCT_NAV.map((item) => {
            const Icon = item.icon;
            const selected = activeProduct === item.screen;
            return (
              <button
                aria-current={selected ? "page" : undefined}
                className={cn(
                  "flex min-h-12 shrink-0 items-center gap-2 border-b-2 px-3 text-[11px] font-extrabold transition",
                  selected
                    ? "border-[var(--brand-primary)] text-[var(--brand-primary)]"
                    : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                )}
                key={item.label}
                onClick={() => onNavigate(item.target)}
                type="button"
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
                {item.label === "Atencion" ? <span className="rounded-full bg-[var(--danger-soft)] px-1.5 py-0.5 text-[8px]">3</span> : null}
              </button>
            );
          })}
        </nav>
      </header>
      <main className="p-4 lg:p-6">{children}</main>
    </div>
  );
}

function SectionHeading({ eyebrow, title, detail, actions }: { eyebrow: string; title: string; detail: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--brand-primary)]">{eyebrow}</p>
        <h2 className="mt-2 text-[28px] font-black tracking-[-0.04em]">{title}</h2>
        <p className="mt-2 max-w-3xl text-[12px] leading-5 text-[var(--text-secondary)]">{detail}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

const BLUEPRINT_DOMAINS = [
  { title: "Arquitectura y orquestacion", detail: "Supervisor, especialistas, handoffs, estados y reglas de decision.", icon: GitBranch, count: "6 artefactos" },
  { title: "Herramientas y contratos", detail: "Capacidades minimas, side effects, errores, auth refs y compensacion.", icon: Wrench, count: "8 artefactos" },
  { title: "Memoria y conocimiento", detail: "Corto y largo plazo, RAG, recuperacion, retencion y trazabilidad.", icon: Database, count: "7 artefactos" },
  { title: "Calidad, seguridad y costo", detail: "NFRs, guardrails, riesgos, observabilidad y estimacion comparativa.", icon: ShieldCheck, count: "9 artefactos" },
];

function BlueprintFreeView(props: SaasViewProps) {
  const { scenario, onNavigate } = props;
  const downloadable = scenario === "pro" || scenario === "acp";
  return (
    <ProductShell {...props}>
      <SectionHeading
        eyebrow="Producto 1 / Blueprint"
        title="El diseno integral del agente esta listo"
        detail="Explora el resultado completo dentro de la plataforma. El contenido gratuito permanece protegido y la descarga profesional se habilita por entitlement."
        actions={
          <>
            <ActionButton icon={Eye}>Vista protegida</ActionButton>
            <ActionButton icon={Download} onClick={() => onNavigate("blueprint-pro")} variant="primary">
              {downloadable ? "Abrir descargas" : "Adquirir Blueprint Pro"}
            </ActionButton>
          </>
        }
      />
      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Surface className="relative overflow-hidden p-6 select-none" onContextMenu={(event: React.MouseEvent) => event.preventDefault()}>
            <div aria-hidden="true" className="pointer-events-none absolute right-6 top-5 rotate-[-8deg] text-[34px] font-black text-[var(--brand-primary)] opacity-[0.06]">LEAN BUILDER / VIEW ONLY</div>
            <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap gap-2"><StatusBadge tone="success">Blueprint completo</StatusBadge><StatusBadge>Version 12</StatusBadge><StatusBadge tone="info">30 artefactos</StatusBadge></div>
                <h3 className="mt-4 text-[21px] font-black">Asistente de soporte inteligente</h3>
                <p className="mt-2 max-w-3xl text-[11px] leading-5 text-[var(--text-secondary)]">Sistema multiagente supervisado para clasificar, recuperar conocimiento, resolver solicitudes grounded y escalar excepciones con trazabilidad.</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[['94%', 'Diseno'], ['6', 'Diagramas'], ['4%', 'GAP diseno']].map(([value, label]) => <div className="min-w-[82px] rounded-xl bg-[var(--surface-subtle)] p-3" key={label}><p className="text-[18px] font-black">{value}</p><p className="mt-1 text-[8px] uppercase tracking-wider text-[var(--text-muted)]">{label}</p></div>)}
              </div>
            </div>
            <div className="relative mt-6 grid gap-3 md:grid-cols-2">
              {BLUEPRINT_DOMAINS.map((domain) => {
                const Icon = domain.icon;
                return <button className="group rounded-2xl border border-[var(--border-default)] bg-[var(--surface-panel)] p-4 text-left transition hover:border-[var(--border-focus)]" key={domain.title} type="button"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand-primary)]"><Icon className="h-4 w-4" /></span><div><div className="flex items-center gap-2"><p className="text-[12px] font-black">{domain.title}</p><ChevronRight className="h-3.5 w-3.5 text-[var(--text-muted)] transition group-hover:translate-x-0.5" /></div><p className="mt-1 text-[10px] leading-4 text-[var(--text-secondary)]">{domain.detail}</p><p className="mt-2 text-[9px] font-extrabold text-[var(--brand-primary)]">{domain.count}</p></div></div></button>;
              })}
            </div>
          </Surface>
          <Surface className="overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-[var(--border-default)] p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Muestra incluida</p><h3 className="mt-1 text-[16px] font-black">Diagrama de arquitectura</h3></div><ActionButton icon={Network} onClick={() => onNavigate("diagrams")}>Abrir visor completo</ActionButton></div>
            <div className="relative min-h-[310px] overflow-hidden bg-[radial-gradient(circle_at_top_right,var(--brand-soft),transparent_40%),var(--surface-subtle)] p-8 select-none">
              <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(var(--border-default)_1px,transparent_1px),linear-gradient(90deg,var(--border-default)_1px,transparent_1px)] [background-size:28px_28px]" />
              <div className="relative mx-auto grid max-w-4xl items-center gap-5 md:grid-cols-[1fr_80px_1fr_80px_1fr]">
                {[
                  { label: "Canales", detail: "Web / Email", icon: Users },
                  { label: "Supervisor", detail: "Routing + policy", icon: GitBranch },
                  { label: "Especialistas", detail: "Resolver / Escalar", icon: Bot },
                ].map((node, index) => {
                  const Icon = node.icon;
                  return <div className="contents" key={node.label}><div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-panel)] p-5 text-center shadow-[var(--shadow-card)]"><span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand-primary)]"><Icon className="h-5 w-5" /></span><p className="mt-3 text-[11px] font-black">{node.label}</p><p className="mt-1 text-[9px] text-[var(--text-secondary)]">{node.detail}</p></div>{index < 2 ? <div className="hidden items-center md:flex"><span className="h-px flex-1 bg-[var(--brand-primary)]" /><ArrowRight className="h-4 w-4 text-[var(--brand-primary)]" /></div> : null}</div>;
                })}
              </div>
            </div>
          </Surface>
        </div>
        <aside className="space-y-5">
          <Surface className="border-[var(--border-focus)] p-5">
            <StatusBadge tone="brand">Blueprint Pro</StatusBadge>
            <h3 className="mt-3 text-[18px] font-black">Lleva el diseno a tu equipo</h3>
            <p className="mt-2 text-[11px] leading-5 text-[var(--text-secondary)]">Descarga arquitectura, contratos, diagramas, memoria, roadmap y estimacion profesional sin desbloquear aun el ACP.</p>
            <div className="mt-4 space-y-2">{["Documentacion funcional y tecnica", "Todos los diagramas Blueprint", "Roadmap, esfuerzo, costo y ROI", "Versiones Markdown y JSON autorizadas"].map((item) => <div className="flex gap-2 text-[10px]" key={item}><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--success)]" /><span>{item}</span></div>)}</div>
            <ActionButton className="mt-5 w-full" onClick={() => onNavigate("blueprint-pro")} variant="primary">{downloadable ? "Gestionar descargas" : "Ver valor y activar demo"}<ArrowRight className="h-4 w-4" /></ActionButton>
          </Surface>
          <Surface className="p-5"><div className="flex items-center gap-2"><Lock className="h-4 w-4 text-[var(--brand-primary)]" /><p className="text-[12px] font-black">Proteccion activa</p></div><p className="mt-2 text-[10px] leading-5 text-[var(--text-secondary)]">Copiar, descargar, arrastrar y menu contextual permanecen deshabilitados en activos no autorizados. La API vuelve a verificar el acceso.</p></Surface>
          <Surface className="p-5"><p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Valor estimado</p><div className="mt-4 grid grid-cols-2 gap-2">{[['31%', 'Menos tiempo'], ['27%', 'Menos costo'], ['Bajo', 'Riesgo diseno'], ['6%', 'Incertidumbre']].map(([value, label]) => <div className="rounded-xl bg-[var(--surface-subtle)] p-3" key={label}><p className="text-[18px] font-black">{value}</p><p className="mt-1 text-[8px] uppercase text-[var(--text-muted)]">{label}</p></div>)}</div><ActionButton className="mt-4 w-full" onClick={() => onNavigate("estimate")}>Ver comparativa completa</ActionButton></Surface>
        </aside>
      </div>
    </ProductShell>
  );
}

function AccessGate({
  kind,
  scenario,
  onActivate,
  onNavigate,
}: {
  kind: "blueprint" | "acp";
  scenario: CommercialScenario;
  onActivate: () => void;
  onNavigate: (screen: NavigateTarget) => void;
}) {
  const restricted = scenario === "restricted";
  return (
    <Surface className={cn("overflow-hidden", restricted ? "border-[var(--danger)]" : "border-[var(--border-focus)]")}>
      <div className={cn("p-6", restricted ? "bg-[var(--danger-soft)]" : "bg-[var(--brand-soft)]")}>
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-panel)] text-[var(--brand-primary)] shadow-[var(--shadow-card)]">{restricted ? <Lock className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}</span>
        <StatusBadge className="mt-4" tone={restricted ? "danger" : "brand"}>{restricted ? "Permiso requerido" : "Activacion demo"}</StatusBadge>
        <h3 className="mt-3 text-[20px] font-black">{restricted ? "El workspace ya tiene el producto" : `Desbloquea ${kind === "blueprint" ? "Blueprint Pro" : "el ACP"}`}</h3>
        <p className="mt-2 text-[11px] leading-5 text-[var(--text-secondary)]">{restricted ? "Tu rol Viewer no incluye esta capacidad. Solicita acceso al owner sin volver a comprar el producto." : "Este mockup no simula cobro, suscripcion ni factura. La accion cambia el entitlement solo para demostrar el recorrido del producto."}</p>
      </div>
      <div className="p-5">
        {restricted ? <><ActionButton className="w-full" icon={Users} variant="primary">Solicitar acceso al owner</ActionButton><ActionButton className="mt-2 w-full" onClick={() => onNavigate("access-plan")}>Ver capacidades del rol</ActionButton></> : <ActionButton className="w-full" icon={Zap} onClick={onActivate} variant="primary">Activar demo {kind === "blueprint" ? "Blueprint Pro" : "ACP"}</ActionButton>}
      </div>
    </Surface>
  );
}

function BlueprintProView(props: SaasViewProps) {
  const { scenario, onScenarioChange, onNavigate } = props;
  const active = scenario === "pro" || scenario === "acp";
  const [downloadState, setDownloadState] = useState<"idle" | "downloading" | "done">("idle");
  const startDownload = () => {
    setDownloadState("downloading");
    window.setTimeout(() => setDownloadState("done"), 700);
  };
  return (
    <ProductShell {...props}>
      <SectionHeading eyebrow="Producto 1 / Entregable profesional" title={active ? "Blueprint Pro activo" : "Adquiere el Blueprint Profesional"} detail="Desbloquea la descarga del diseno integral sin mezclarlo con los artefactos de construccion exclusivos del ACP." actions={<ActionButton onClick={() => onNavigate("blueprint-free")}>Volver al resultado</ActionButton>} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Surface className="overflow-hidden">
            <div className="grid lg:grid-cols-[1.1fr_.9fr]">
              <div className="p-6 lg:p-8"><StatusBadge tone="brand">30 artefactos / 6 diagramas</StatusBadge><h3 className="mt-4 text-[24px] font-black tracking-[-0.03em]">Toda la claridad para construir con menos incertidumbre</h3><p className="mt-3 text-[12px] leading-6 text-[var(--text-secondary)]">El Blueprint Pro empaqueta decisiones de arquitectura, comportamiento, herramientas, memoria, conocimiento, seguridad, roadmap y estimacion en formatos profesionales.</p><div className="mt-6 grid gap-3 sm:grid-cols-2">{["Arquitectura propuesta", "Patrones agenticos", "Orquestacion y flujos", "Herramientas y contratos", "Memoria, RAG y conocimiento", "Roadmap, costo y ROI"].map((item) => <div className="flex items-center gap-2 rounded-xl border border-[var(--border-default)] p-3 text-[10px] font-bold" key={item}><CheckCircle2 className="h-4 w-4 text-[var(--success)]" />{item}</div>)}</div></div>
              <div className="bg-[var(--surface-dark)] p-6 text-[var(--text-inverse)] lg:p-8"><p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Impacto estimado</p><div className="mt-5 grid grid-cols-2 gap-3">{[['31%', 'Ahorro tiempo'], ['27%', 'Ahorro costo'], ['94%', 'Diseno cerrado'], ['6%', 'Residual max.']].map(([value, label]) => <div className="rounded-xl border border-white/10 bg-white/5 p-4" key={label}><p className="text-[24px] font-black">{value}</p><p className="mt-1 text-[9px] text-[var(--text-muted)]">{label}</p></div>)}</div><p className="mt-5 text-[10px] leading-5 text-[var(--text-muted)]">No incluye Test Suite, GAP registry de implementacion, launcher ni paquete portable. Esas capacidades pertenecen al ACP.</p></div>
            </div>
          </Surface>
          <Surface className="overflow-hidden"><div className="flex items-center justify-between border-b border-[var(--border-default)] p-5"><div><p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Packs incluidos</p><h3 className="mt-1 text-[16px] font-black">Descargas gobernadas por capability</h3></div><StatusBadge tone={active ? "success" : "warning"}>{active ? "Habilitadas" : "Bloqueadas"}</StatusBadge></div><div className="divide-y divide-[var(--border-subtle)]">{[["Blueprint Core", "PDF + Markdown", "Documentacion integral", Layers3], ["Diagram Pack", "SVG protegido + PDF", "6 diagramas Blueprint", Network], ["Estimation Pack", "XLSX + JSON", "Tiempo, costo, riesgo y ROI", Gauge]].map(([name, format, detail, IconValue]) => { const Icon = IconValue as LucideIcon; return <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center" key={String(name)}><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand-primary)]"><Icon className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="text-[11px] font-black">{String(name)}</p><p className="mt-1 text-[9px] text-[var(--text-secondary)]">{String(detail)} / {String(format)}</p></div><ActionButton disabled={!active || downloadState === "downloading"} icon={Download} onClick={startDownload}>{downloadState === "downloading" ? "Preparando..." : downloadState === "done" ? "Descargado" : "Descargar"}</ActionButton></div>; })}</div></Surface>
        </div>
        <aside className="space-y-5">
          {active ? <Surface className="border-[var(--success)] p-5"><StatusBadge tone="success">Entitlement activo</StatusBadge><h3 className="mt-3 text-[17px] font-black">Listo para descargar</h3><p className="mt-2 text-[10px] leading-5 text-[var(--text-secondary)]">Capability efectiva: `blueprint.export`. Cada descarga queda registrada en la auditoria comercial.</p><ActionButton className="mt-4 w-full" icon={Download} onClick={startDownload} variant="primary">Descargar Blueprint Pro</ActionButton></Surface> : <AccessGate kind="blueprint" onActivate={() => onScenarioChange("pro")} onNavigate={onNavigate} scenario={scenario} />}
          <Surface className="p-5"><StatusBadge tone="neutral">Siguiente producto</StatusBadge><h3 className="mt-3 text-[16px] font-black">Convierte el diseno en un paquete de construccion</h3><p className="mt-2 text-[10px] leading-5 text-[var(--text-secondary)]">El ACP agrega validacion, tests, GAPs, preguntas estructuradas, especificaciones portables y launcher seguro.</p><ActionButton className="mt-4 w-full" onClick={() => onNavigate("acp-invitation")}>Comparar con ACP<ArrowRight className="h-4 w-4" /></ActionButton></Surface>
        </aside>
      </div>
    </ProductShell>
  );
}

function AcpInvitationView(props: SaasViewProps) {
  const { scenario, onScenarioChange, onNavigate } = props;
  const hasAcp = scenario === "acp";
  const canAcquire = scenario === "pro";
  return (
    <ProductShell {...props}>
      <SectionHeading eyebrow="Producto 2 / Agent Construction Package" title="Del diseno aprobado a una construccion controlada" detail="El ACP no implementa el agente por ti ni elimina decisiones humanas. Organiza lo minimo necesario para que un equipo o herramienta agentica construya sin redefinir la arquitectura." />
      <Surface className="relative overflow-hidden border-[var(--border-focus)]">
        <div className="absolute inset-y-0 right-0 hidden w-[38%] bg-[radial-gradient(circle_at_center,var(--brand-soft),transparent_65%)] lg:block" />
        <div className="relative grid gap-8 p-6 lg:grid-cols-[1.15fr_.85fr] lg:p-8">
          <div><StatusBadge tone="brand">Valor incremental sobre Blueprint</StatusBadge><h3 className="mt-4 max-w-2xl text-[27px] font-black tracking-[-0.04em]">Menos interpretacion, mas avance desde el primer sprint</h3><p className="mt-3 max-w-2xl text-[12px] leading-6 text-[var(--text-secondary)]">Especificaciones declarativas, prompts, tool schemas, tests, decisiones pendientes y perfiles portables preparados para Codex, Claude Code, Cursor, Copilot u otro consumidor.</p><div className="mt-6 grid gap-3 sm:grid-cols-3">{[['42%', 'Ahorro adicional'], ['68%', 'Ahorro total'], ['Bajo', 'Riesgo residual']].map(([value, label]) => <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-panel)] p-4" key={label}><p className="text-[25px] font-black">{value}</p><p className="mt-1 text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{label}</p></div>)}</div></div>
          <Surface className="p-5"><p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Lo que agrega el ACP</p><div className="mt-4 space-y-3">{["Validacion del Blueprint y Test Suite", "GAPs y preguntas de implementacion", "Prompts, tools, workflows y contratos", "Memoria y RAG portables", "Conformance, checksums y perfiles", "Launcher multiplataforma en modo seguro"].map((item) => <div className="flex gap-2 text-[10px] font-semibold" key={item}><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--success)]" />{item}</div>)}</div></Surface>
        </div>
      </Surface>
      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Surface className="overflow-hidden"><div className="border-b border-[var(--border-default)] p-5"><h3 className="text-[16px] font-black">Blueprint vs ACP</h3><p className="mt-1 text-[10px] text-[var(--text-secondary)]">Dos entregables, responsabilidades distintas.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-[10px]"><thead className="bg-[var(--surface-subtle)] text-[9px] uppercase tracking-wider text-[var(--text-muted)]"><tr>{["Capacidad", "Blueprint Pro", "ACP"].map((head) => <th className="px-5 py-3" key={head}>{head}</th>)}</tr></thead><tbody>{[["Diseno integral", "Incluido", "Referencia aprobada"], ["Diagramas y contratos", "Documentados", "Traducidos a schemas"], ["Pruebas y conformance", "Criterios", "Suite ejecutable"], ["Preguntas de implementacion", "Identificadas", "Gestionadas por momento"], ["Inicio con herramientas agenticas", "Guia", "Launcher + perfiles"]].map((row) => <tr className="border-t border-[var(--border-subtle)]" key={row[0]}>{row.map((cell, index) => <td className={cn("px-5 py-4", index === 0 ? "font-black" : "text-[var(--text-secondary)]")} key={cell}>{cell}</td>)}</tr>)}</tbody></table></div></Surface>
        <aside className="space-y-4">
          {hasAcp ? <Surface className="border-[var(--success)] p-5"><StatusBadge tone="success">ACP activo</StatusBadge><h3 className="mt-3 text-[17px] font-black">Continua con la validacion</h3><p className="mt-2 text-[10px] leading-5 text-[var(--text-secondary)]">El producto esta habilitado para este workspace y tu rol tiene `acp.build`.</p><ActionButton className="mt-4 w-full" onClick={() => onNavigate("acp-workspace")} variant="primary">Abrir workspace ACP<ArrowRight className="h-4 w-4" /></ActionButton></Surface> : canAcquire ? <AccessGate kind="acp" onActivate={() => onScenarioChange("acp")} onNavigate={onNavigate} scenario={scenario} /> : scenario === "restricted" ? <AccessGate kind="acp" onActivate={() => undefined} onNavigate={onNavigate} scenario={scenario} /> : <Surface className="border-[var(--warning)] bg-[var(--warning-soft)] p-5"><StatusBadge tone="warning">Prerequisito</StatusBadge><h3 className="mt-3 text-[17px] font-black">Activa Blueprint Pro primero</h3><p className="mt-2 text-[10px] leading-5 text-[var(--text-secondary)]">El usuario puede conocer todo el valor del ACP, pero su activacion parte del Blueprint aprobado.</p><ActionButton className="mt-4 w-full" onClick={() => onNavigate("blueprint-pro")} variant="primary">Ir a Blueprint Pro</ActionButton></Surface>}
          <Surface className="p-5"><p className="text-[11px] font-black">ROI incremental</p><p className="mt-2 text-[10px] leading-5 text-[var(--text-secondary)]">La comparativa usa tiempo, costo, intervencion humana, riesgo, automatizacion, calidad y time to market. No presenta ahorro como garantia contractual.</p></Surface>
        </aside>
      </div>
    </ProductShell>
  );
}

function AcpGateView(props: SaasViewProps) {
  const { scenario, onNavigate, onScenarioChange } = props;
  if (scenario === "acp") {
    return <ProductShell {...props}><div className="mx-auto max-w-3xl py-16"><Surface className="border-[var(--success)] p-8 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--success-soft)] text-[var(--success)]"><CheckCircle2 className="h-6 w-6" /></span><StatusBadge className="mt-5" tone="success">Entitlement verificado</StatusBadge><h2 className="mt-4 text-[25px] font-black">El workspace ACP esta disponible</h2><p className="mx-auto mt-2 max-w-xl text-[11px] leading-5 text-[var(--text-secondary)]">Producto activo, rol autorizado y Blueprint aprobado. Puedes continuar sin un gate adicional.</p><ActionButton className="mt-6" onClick={() => onNavigate("acp-workspace")} variant="primary">Entrar al ACP<ArrowRight className="h-4 w-4" /></ActionButton></Surface></div></ProductShell>;
  }
  return (
    <ProductShell {...props}>
      <div className="mx-auto max-w-4xl py-12">
        <div className="mb-5 text-center"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--brand-primary)]">Deep link protegido</p><h2 className="mt-2 text-[28px] font-black">Esta etapa pertenece al ACP</h2><p className="mx-auto mt-2 max-w-2xl text-[12px] leading-5 text-[var(--text-secondary)]">No mostramos contenido premium antes de verificar producto, rol y capability.</p></div>
        <div className="grid gap-5 md:grid-cols-[1fr_340px]">
          <Surface className="p-6"><StatusBadge tone="warning">Contenido bloqueado</StatusBadge><div className="mt-5 space-y-3">{[["1", "Producto", scenario === "pro" ? "Blueprint Pro activo; ACP no adquirido" : "Blueprint Free activo"], ["2", "Rol", scenario === "restricted" ? "Viewer sin acp.build" : "Owner autorizado para adquirir"], ["3", "Siguiente accion", scenario === "restricted" ? "Solicitar permiso" : "Revisar invitacion ACP"]].map(([step, label, detail]) => <div className="flex gap-3 rounded-xl border border-[var(--border-default)] p-4" key={step}><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[10px] font-black text-[var(--brand-primary)]">{step}</span><div><p className="text-[10px] font-black">{label}</p><p className="mt-1 text-[9px] text-[var(--text-secondary)]">{detail}</p></div></div>)}</div></Surface>
          {scenario === "restricted" ? <AccessGate kind="acp" onActivate={() => undefined} onNavigate={onNavigate} scenario={scenario} /> : scenario === "pro" ? <AccessGate kind="acp" onActivate={() => onScenarioChange("acp")} onNavigate={onNavigate} scenario={scenario} /> : <Surface className="p-5"><Lock className="h-5 w-5 text-[var(--brand-primary)]" /><h3 className="mt-3 text-[17px] font-black">Conoce el ACP antes de activarlo</h3><p className="mt-2 text-[10px] leading-5 text-[var(--text-secondary)]">Compara entregables, ahorro y riesgos sin iniciar automaticamente la segunda etapa.</p><ActionButton className="mt-4 w-full" onClick={() => onNavigate("acp-invitation")} variant="primary">Ver invitacion ACP</ActionButton></Surface>}
        </div>
      </div>
    </ProductShell>
  );
}

const ACP_PHASES = [
  { key: "validation", label: "Validacion", detail: "Conformance del Blueprint", state: "done", icon: ShieldCheck },
  { key: "tests", label: "Test Suite", detail: "Escenarios y criterios", state: "active", icon: ClipboardCheck },
  { key: "gaps", label: "GAPs", detail: "Diseno vs implementacion", state: "attention", icon: AlertTriangle },
  { key: "questions", label: "Preguntas", detail: "Decisiones por momento", state: "attention", icon: Users },
  { key: "build", label: "Build", detail: "Artefactos tecnicos", state: "pending", icon: Wrench },
  { key: "download", label: "Descarga", detail: "Perfil y conformance", state: "pending", icon: Download },
] as const;

function AcpWorkspaceView(props: SaasViewProps) {
  const [phase, setPhase] = useState<(typeof ACP_PHASES)[number]["key"]>("tests");
  const { scenario, onNavigate } = props;
  if (scenario !== "acp") return <AcpGateView {...props} active="acp-gate" />;
  const selected = ACP_PHASES.find((item) => item.key === phase) ?? ACP_PHASES[1];
  return (
    <ProductShell {...props}>
      <SectionHeading eyebrow="ACP / Workspace de construccion" title="Construye sin redefinir el Blueprint" detail="Cada subfase convierte una parte del diseno aprobado en artefactos portables y conserva las decisiones humanas que solo pueden cerrarse durante implementacion." actions={<><ActionButton icon={Eye} onClick={() => onNavigate("blueprint-free")}>Consultar Blueprint</ActionButton><ActionButton icon={Download} onClick={() => onNavigate("export-center")} variant="primary">Preparar exportacion</ActionButton></>} />
      <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)_330px]">
        <Surface className="h-fit p-4"><div className="flex items-center justify-between"><p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Ruta ACP</p><StatusBadge tone="success">Activo</StatusBadge></div><div className="mt-4 space-y-2">{ACP_PHASES.map((item, index) => { const Icon = item.icon; const isActive = item.key === phase; return <button className={cn("w-full rounded-xl border p-3 text-left transition", isActive ? "border-[var(--border-focus)] bg-[var(--brand-soft)]" : "border-[var(--border-default)] hover:bg-[var(--surface-subtle)]")} key={item.key} onClick={() => setPhase(item.key)} type="button"><div className="flex items-start gap-3"><span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", isActive ? "bg-[var(--brand-primary)] text-[var(--text-inverse)]" : "bg-[var(--surface-subtle)] text-[var(--text-secondary)]")}><Icon className="h-3.5 w-3.5" /></span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="text-[10px] font-black">{index + 1}. {item.label}</p><span className={cn("h-2 w-2 rounded-full", item.state === "done" ? "bg-[var(--success)]" : item.state === "attention" ? "bg-[var(--warning)]" : item.state === "active" ? "bg-[var(--brand-primary)]" : "bg-[var(--border-default)]")} /></div><p className="mt-1 text-[8px] text-[var(--text-secondary)]">{item.detail}</p></div></div></button>; })}</div></Surface>
        <div className="space-y-5">
          <Surface className="p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><StatusBadge tone={selected.state === "attention" ? "warning" : selected.state === "done" ? "success" : "brand"}>{selected.state === "attention" ? "Requiere revision" : selected.state === "done" ? "Completada" : "En curso"}</StatusBadge><h3 className="mt-3 text-[21px] font-black">{selected.label}</h3><p className="mt-2 text-[11px] leading-5 text-[var(--text-secondary)]">{selected.detail}. La salida conserva referencias al Blueprint y genera evidencia trazable para el paquete.</p></div><ActionButton icon={Play} variant="primary">Ejecutar subfase</ActionButton></div><div className="mt-6 grid gap-3 sm:grid-cols-3">{[['Entrada', 'Blueprint v12 aprobado'], ['Procesamiento', 'LLM + reglas + memoria'], ['Salida', selected.key === 'tests' ? '12 escenarios' : 'Artefacto versionado']].map(([label, value]) => <div className="rounded-xl bg-[var(--surface-subtle)] p-4" key={label}><p className="text-[8px] font-black uppercase tracking-wider text-[var(--text-muted)]">{label}</p><p className="mt-2 text-[10px] font-extrabold">{value}</p></div>)}</div></Surface>
          <Surface className="overflow-hidden"><div className="flex items-center justify-between border-b border-[var(--border-default)] p-5"><div><p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Trabajo de la subfase</p><h3 className="mt-1 text-[15px] font-black">Acciones y resultados</h3></div><StatusBadge tone="info">Trazabilidad activa</StatusBadge></div><div className="divide-y divide-[var(--border-subtle)]">{[["TS-04", "Validar escalamiento por evidencia contradictoria", "Listo", "success"], ["TS-07", "Confirmar compensacion despues de side effect", "Revisar", "warning"], ["IMP-02", "Seleccionar lenguaje durante implementacion", "No bloqueante", "info"]].map(([id, title, status, tone]) => <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center" key={id}><span className="font-mono text-[9px] font-black text-[var(--brand-primary)]">{id}</span><div className="flex-1"><p className="text-[11px] font-black">{title}</p><p className="mt-1 text-[9px] text-[var(--text-secondary)]">Origen: Blueprint / Responsable y consecuencia documentados</p></div><StatusBadge tone={tone as Tone}>{status}</StatusBadge><ActionButton onClick={() => onNavigate(status === "Revisar" ? "attention" : "package")}>Abrir</ActionButton></div>)}</div></Surface>
        </div>
        <aside className="space-y-5"><Surface className="p-5"><div className="flex items-center justify-between"><p className="text-[12px] font-black">Readiness ACP</p><span className="text-[25px] font-black">76%</span></div><div className="mt-3 h-2 rounded-full bg-[var(--surface-subtle)]"><div className="h-full w-[76%] rounded-full bg-[var(--brand-primary)]" /></div><div className="mt-4 space-y-2">{[["Blueprint", "Aprobado", "success"], ["Tests", "8/12", "brand"], ["GAPs", "2 abiertos", "warning"], ["Export", "Pendiente", "neutral"]].map(([label, value, tone]) => <div className="flex items-center justify-between text-[10px]" key={label}><span className="text-[var(--text-secondary)]">{label}</span><StatusBadge tone={tone as Tone}>{value}</StatusBadge></div>)}</div></Surface><Surface className="border-[var(--warning)] bg-[var(--warning-soft)] p-5"><StatusBadge tone="warning">2 decisiones humanas</StatusBadge><h3 className="mt-3 text-[16px] font-black">No bloquean el diseno</h3><p className="mt-2 text-[10px] leading-5 text-[var(--text-secondary)]">Stack objetivo y proveedor de tickets quedan estructurados para resolverse cuando el ACP se ejecute.</p><ActionButton className="mt-4 w-full" onClick={() => onNavigate("attention")}>Revisar decisiones</ActionButton></Surface><Surface className="p-5"><p className="text-[12px] font-black">Siguiente hito</p><p className="mt-2 text-[10px] leading-5 text-[var(--text-secondary)]">Completa 4 escenarios, valida conformance y elige un perfil portable antes de descargar.</p><ActionButton className="mt-4 w-full" onClick={() => onNavigate("export-center")}>Abrir Export Center</ActionButton></Surface></aside>
      </div>
    </ProductShell>
  );
}

const EXPORT_PACKS = [
  ["Blueprint Core", "blueprint-core.v1", "Diseno integral", "success"],
  ["Construction Pack", "construction-pack.v2", "Workflows y schemas", "success"],
  ["Prompt Pack", "prompt-pack.v1", "Prompts y playbooks", "success"],
  ["Tool Pack", "tool-pack.v2", "Capabilities y bindings", "success"],
  ["Memory Pack", "memory-pack.v2", "RAG y memoria portable", "success"],
  ["Test Pack", "test-pack.v1", "Escenarios y criterios", "warning"],
  ["Launcher Pack", "launcher-pack.v1", "Scripts y launch report", "success"],
] as const;

function ExportCenterView(props: SaasViewProps) {
  const { scenario, onNavigate } = props;
  const [profile, setProfile] = useState<"portable" | "full">("portable");
  const [status, setStatus] = useState<"idle" | "checking" | "ready">("idle");
  if (scenario !== "acp") return <AcpGateView {...props} active="acp-gate" />;
  const validate = () => {
    setStatus("checking");
    window.setTimeout(() => setStatus("ready"), 700);
  };
  return (
    <ProductShell {...props}>
      <SectionHeading eyebrow="Artefactos / Export Center" title="Elige que paquete llevaras a construccion" detail="Portable es el perfil recomendado y excluye dependencias de Lean Builder. Full conserva trazabilidad interna y exige una seleccion consciente." actions={<ActionButton icon={RefreshCcw} onClick={validate} variant="primary">{status === "checking" ? "Validando..." : "Validar conformance"}</ActionButton>} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_370px]">
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { key: "portable" as const, title: "ACP Portable", badge: "Recomendado", detail: "Sin IDs, endpoints, estados ni servicios exclusivos de Lean Builder.", icon: ShieldCheck },
              { key: "full" as const, title: "ACP Full", badge: "Opt-in", detail: "Incluye trazabilidad interna para soporte y migracion controlada.", icon: Database },
            ].map((item) => { const Icon = item.icon; const selected = profile === item.key; return <button aria-pressed={selected} className={cn("rounded-2xl border p-5 text-left transition", selected ? "border-[var(--border-focus)] bg-[var(--brand-soft)] shadow-[var(--shadow-card)]" : "border-[var(--border-default)] bg-[var(--surface-panel)] hover:bg-[var(--surface-subtle)]")} key={item.key} onClick={() => { setProfile(item.key); setStatus("idle"); }} type="button"><div className="flex items-start justify-between"><span className={cn("flex h-11 w-11 items-center justify-center rounded-xl", selected ? "bg-[var(--brand-primary)] text-[var(--text-inverse)]" : "bg-[var(--surface-subtle)] text-[var(--text-secondary)]")}><Icon className="h-5 w-5" /></span><StatusBadge tone={item.key === "portable" ? "brand" : "warning"}>{item.badge}</StatusBadge></div><h3 className="mt-4 text-[17px] font-black">{item.title}</h3><p className="mt-2 text-[10px] leading-5 text-[var(--text-secondary)]">{item.detail}</p></button>; })}
          </div>
          <Surface className="overflow-hidden"><div className="flex items-center justify-between border-b border-[var(--border-default)] p-5"><div><p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Contenido exportable</p><h3 className="mt-1 text-[16px] font-black">7 packs versionados</h3></div><StatusBadge>{profile === "portable" ? "Perfil portable" : "Perfil full"}</StatusBadge></div><div className="divide-y divide-[var(--border-subtle)]">{EXPORT_PACKS.map(([name, contract, detail, tone]) => <div className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_180px_120px] sm:items-center" key={contract}><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand-primary)]"><FileText className="h-4 w-4" /></span><div><p className="text-[11px] font-black">{name}</p><p className="mt-1 text-[9px] text-[var(--text-secondary)]">{detail}</p></div></div><code className="text-[9px] text-[var(--text-secondary)]">{contract}</code><StatusBadge tone={tone as Tone}>{tone === "success" ? "Valido" : "1 warning"}</StatusBadge></div>)}</div></Surface>
        </div>
        <aside className="space-y-5">
          <Surface className="p-5"><div className="flex items-center justify-between"><p className="text-[12px] font-black">Conformance externo</p><StatusBadge tone={status === "ready" ? "success" : "neutral"}>{status === "checking" ? "Ejecutando" : status === "ready" ? "Aprobado" : "Pendiente"}</StatusBadge></div><div className="mt-4 space-y-3">{[["Schema ACP v2", "Valido"], ["Checksums", "7/7"], ["Consumer externo", status === "ready" ? "Aprobado" : "Sin ejecutar"], ["IDs internos", profile === "portable" ? "0" : "3 controlados"]].map(([label, value]) => <div className="flex items-center justify-between rounded-lg bg-[var(--surface-subtle)] px-3 py-2 text-[9px]" key={label}><span className="text-[var(--text-secondary)]">{label}</span><strong>{value}</strong></div>)}</div><ActionButton className="mt-4 w-full" disabled={status !== "ready"} icon={Download} variant="primary">Descargar {profile === "portable" ? "ACP Portable" : "ACP Full"}</ActionButton></Surface>
          <Surface className="border-[var(--warning)] bg-[var(--warning-soft)] p-5"><StatusBadge tone="warning">Warning no bloqueante</StatusBadge><h3 className="mt-3 text-[14px] font-black">2 preguntas viajan en el paquete</h3><p className="mt-2 text-[10px] leading-5 text-[var(--text-secondary)]">Lenguaje y proveedor de ticketing solo pueden definirse al implementar. Incluyen contexto, opciones, impacto y punto de resolucion.</p></Surface>
          <Surface className="p-5"><div className="flex items-center gap-2"><Play className="h-4 w-4 text-[var(--brand-primary)]" /><p className="text-[12px] font-black">Launcher incluido</p></div><p className="mt-2 text-[10px] leading-5 text-[var(--text-secondary)]">Scripts Windows, PowerShell y Bash preparan el entorno fuera de Lean Builder sin instalar ni ejecutar acciones destructivas.</p><ActionButton className="mt-4 w-full" onClick={() => onNavigate("launcher")}>Revisar Launcher</ActionButton></Surface>
        </aside>
      </div>
    </ProductShell>
  );
}

function LauncherView(props: SaasViewProps) {
  const { scenario } = props;
  const [platform, setPlatform] = useState<"windows" | "powershell" | "unix">("windows");
  const [ran, setRan] = useState(false);
  if (scenario !== "acp") return <AcpGateView {...props} active="acp-gate" />;
  const script = platform === "windows" ? "start-acp.bat" : platform === "powershell" ? "start-acp.ps1" : "start-acp.sh";
  return (
    <ProductShell {...props}>
      <SectionHeading eyebrow="ACP / Launcher portable" title="Abre el paquete en el entorno del usuario" detail="El launcher detecta IDEs, herramientas agenticas, runtimes y prerequisitos. Sugiere una ruta segura; no instala software ni despliega la solucion." actions={<ActionButton icon={Play} onClick={() => setRan(true)} variant="primary">Simular diagnostico</ActionButton>} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Surface className="overflow-hidden"><div className="flex flex-col gap-3 border-b border-[var(--border-default)] p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Seleccion de plataforma</p><h3 className="mt-1 text-[16px] font-black">Tres entrypoints, un contrato</h3></div><div className="flex gap-1">{(["windows", "powershell", "unix"] as const).map((item) => <button aria-pressed={platform === item} className={cn("min-h-9 rounded-lg border px-3 text-[9px] font-black", platform === item ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-[var(--text-inverse)]" : "border-[var(--border-default)] bg-[var(--surface-panel)]")} key={item} onClick={() => { setPlatform(item); setRan(false); }} type="button">{item === "unix" ? "macOS/Linux" : item}</button>)}</div></div><div className="bg-[var(--surface-dark)] p-6 font-[family-name:var(--font-mono-local)] text-[11px] leading-6 text-[var(--text-inverse)]"><p className="text-[var(--text-muted)]"># Inicio seguro del ACP</p><p className="mt-2">{platform === "powershell" ? ".\\start-acp.ps1 --diagnose" : platform === "unix" ? "./start-acp.sh --diagnose" : "start-acp.bat --diagnose"}</p><p className="mt-4 text-[var(--success)]">[ok] manifest ACP v2 verificado</p><p className="text-[var(--success)]">[ok] checksums validos</p><p className={ran ? "text-[var(--success)]" : "text-[var(--text-muted)]"}>{ran ? "[ok] Codex CLI y VS Code detectados" : "[--] esperando diagnostico local"}</p><p className={ran ? "text-[var(--warning)]" : "text-[var(--text-muted)]"}>{ran ? "[warn] POSTGRES_URL debe resolverse durante implementacion" : "[--] no se realizaron cambios en el equipo"}</p></div></Surface>
          <div className="grid gap-4 md:grid-cols-3">{[["IDE", ran ? "VS Code" : "Por detectar", FileSearch], ["Herramienta agentica", ran ? "Codex CLI" : "Por detectar", Bot], ["Runtime", ran ? "Node 22 / Python 3.13" : "Por detectar", Wrench]].map(([label, value, IconValue]) => { const Icon = IconValue as LucideIcon; return <Surface className="p-5" key={String(label)}><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand-primary)]"><Icon className="h-4 w-4" /></span><p className="mt-3 text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">{String(label)}</p><p className="mt-1 text-[12px] font-black">{String(value)}</p></Surface>; })}</div>
        </div>
        <aside className="space-y-5"><Surface className="p-5"><StatusBadge tone="success">Modo seguro</StatusBadge><h3 className="mt-3 text-[16px] font-black">El usuario conserva el control</h3><div className="mt-4 space-y-2">{["No instala dependencias", "No modifica credenciales", "No despliega infraestructura", "No ejecuta codigo del agente", "Explica cada siguiente paso"].map((item) => <div className="flex gap-2 text-[10px]" key={item}><Check className="h-3.5 w-3.5 text-[var(--success)]" />{item}</div>)}</div></Surface><Surface className="p-5"><div className="flex items-center justify-between"><p className="text-[12px] font-black">launch-report.json</p><StatusBadge tone={ran ? "success" : "neutral"}>{ran ? "Generado" : "Pendiente"}</StatusBadge></div><p className="mt-2 text-[10px] leading-5 text-[var(--text-secondary)]">Registra plataforma, herramientas encontradas, prerequisitos, decisiones abiertas y comando recomendado.</p><ActionButton className="mt-4 w-full" disabled={!ran} icon={FileText}>Ver reporte</ActionButton></Surface><Surface className="border-[var(--info)] bg-[var(--info-soft)] p-5"><StatusBadge tone="info">Fuera de Lean Builder</StatusBadge><p className="mt-3 text-[10px] leading-5 text-[var(--text-secondary)]">{script} viaja dentro del ZIP. Lean Builder genera y valida el paquete, pero no controla su ejecucion posterior.</p></Surface></aside>
      </div>
    </ProductShell>
  );
}

type DiagramAccess = "sample" | "blueprint" | "acp" | "stage" | "missing";
type DiagramItem = { id: string; name: string; category: string; stage: string; product: "Blueprint" | "ACP"; access: DiagramAccess; version: string };

const DIAGRAMS: DiagramItem[] = [
  { id: "D-01", name: "Arquitectura general", category: "Arquitectura", stage: "Disenar", product: "Blueprint", access: "sample", version: "v12" },
  { id: "D-02", name: "Orquestacion multiagente", category: "Orquestacion", stage: "Disenar", product: "Blueprint", access: "blueprint", version: "v12" },
  { id: "D-03", name: "Flujo de handoffs", category: "Orquestacion", stage: "Disenar", product: "Blueprint", access: "blueprint", version: "v11" },
  { id: "D-04", name: "Mapa de herramientas", category: "Herramientas", stage: "Herramientas", product: "Blueprint", access: "blueprint", version: "v9" },
  { id: "D-05", name: "Contratos y side effects", category: "Herramientas", stage: "Herramientas", product: "Blueprint", access: "blueprint", version: "v9" },
  { id: "D-06", name: "Memoria de corto plazo", category: "Memoria", stage: "Memoria", product: "Blueprint", access: "blueprint", version: "v8" },
  { id: "D-07", name: "Memoria de largo plazo", category: "Memoria", stage: "Memoria", product: "Blueprint", access: "blueprint", version: "v8" },
  { id: "D-08", name: "Pipeline RAG", category: "Conocimiento", stage: "Memoria", product: "Blueprint", access: "blueprint", version: "v8" },
  { id: "D-09", name: "Modelo de conocimiento", category: "Conocimiento", stage: "Memoria", product: "Blueprint", access: "blueprint", version: "v7" },
  { id: "D-10", name: "Flujo end-to-end", category: "Flujos", stage: "Disenar", product: "Blueprint", access: "blueprint", version: "v10" },
  { id: "D-11", name: "Escalamiento humano", category: "Flujos", stage: "Disenar", product: "Blueprint", access: "blueprint", version: "v10" },
  { id: "D-12", name: "Modelo de datos", category: "Datos", stage: "Definir", product: "Blueprint", access: "blueprint", version: "v6" },
  { id: "D-13", name: "Segregacion multitenant", category: "Seguridad", stage: "Disenar", product: "Blueprint", access: "blueprint", version: "v5" },
  { id: "D-14", name: "Threat model", category: "Seguridad", stage: "Disenar", product: "Blueprint", access: "blueprint", version: "v5" },
  { id: "D-15", name: "Observabilidad", category: "Operacion", stage: "Disenar", product: "Blueprint", access: "blueprint", version: "v4" },
  { id: "D-16", name: "Guia de despliegue", category: "Despliegue", stage: "Estimar", product: "Blueprint", access: "stage", version: "borrador" },
  { id: "D-17", name: "Matriz de escenarios", category: "Pruebas", stage: "Validar", product: "ACP", access: "acp", version: "v3" },
  { id: "D-18", name: "Cobertura Test Suite", category: "Pruebas", stage: "Validar", product: "ACP", access: "acp", version: "v3" },
  { id: "D-19", name: "Workflow portable", category: "Portabilidad", stage: "Package", product: "ACP", access: "acp", version: "v2" },
  { id: "D-20", name: "Checkpoints agnosticos", category: "Portabilidad", stage: "Package", product: "ACP", access: "acp", version: "v2" },
  { id: "D-21", name: "Capability bindings", category: "Portabilidad", stage: "Package", product: "ACP", access: "acp", version: "v2" },
  { id: "D-22", name: "Conformance externo", category: "Portabilidad", stage: "Package", product: "ACP", access: "acp", version: "v2" },
  { id: "D-23", name: "Topologia de produccion", category: "Despliegue", stage: "Package", product: "ACP", access: "missing", version: "pendiente" },
  { id: "D-24", name: "FinOps del runtime", category: "Operacion", stage: "Package", product: "ACP", access: "missing", version: "pendiente" },
];

function diagramState(item: DiagramItem, scenario: CommercialScenario): { label: string; tone: Tone; viewable: boolean; downloadable: boolean } {
  if (item.access === "missing") return { label: "No generado", tone: "neutral", viewable: false, downloadable: false };
  if (item.access === "stage") return { label: "Etapa pendiente", tone: "warning", viewable: false, downloadable: false };
  if (item.access === "sample") return { label: "Muestra", tone: "info", viewable: true, downloadable: false };
  if (item.access === "blueprint") {
    const viewable = scenario === "pro" || scenario === "acp";
    return { label: viewable ? "Disponible" : "Requiere Blueprint Pro", tone: viewable ? "success" : "warning", viewable, downloadable: viewable };
  }
  const viewable = scenario === "acp";
  return { label: viewable ? "Disponible ACP" : "Requiere ACP", tone: viewable ? "success" : "danger", viewable, downloadable: viewable };
}

export function UnifiedDiagramViewer({
  scenario,
  onNavigate,
  onScenarioChange,
}: {
  scenario: CommercialScenario;
  onNavigate: (screen: NavigateTarget) => void;
  onScenarioChange: (scenario: CommercialScenario) => void;
}) {
  const [category, setCategory] = useState("Todos");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(20);
  const [selectedId, setSelectedId] = useState("D-01");
  const categories = ["Todos", ...Array.from(new Set(DIAGRAMS.map((item) => item.category)))];
  const filtered = DIAGRAMS.filter((item) => (category === "Todos" || item.category === category) && `${item.name} ${item.category} ${item.product}`.toLowerCase().includes(query.toLowerCase()));
  const visible = filtered.slice(0, limit);
  const selected = DIAGRAMS.find((item) => item.id === selectedId) ?? DIAGRAMS[0];
  const state = diagramState(selected, scenario);
  return (
    <ProductShell active="blueprint-free" navSection="diagrams" onNavigate={onNavigate} onScenarioChange={onScenarioChange} scenario={scenario}>
      <SectionHeading eyebrow="Catalogo unificado" title="Todo el valor generado, en un solo visor" detail="Los 24 diagramas permanecen visibles en el catalogo. Acceso, proteccion y descarga dependen de etapa, producto, compra, rol y policy efectiva." actions={<><StatusBadge tone="info">24 diagramas</StatusBadge><ActionButton icon={Search}>Buscar por evidencia</ActionButton></>} />
      <div className="grid gap-4 xl:grid-cols-[250px_320px_minmax(0,1fr)_280px]">
        <Surface className="h-fit max-h-[720px] overflow-hidden p-4"><div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Catalogo</p><h3 className="mt-1 text-[17px] font-black">Categorias</h3></div><StatusBadge tone="success">{categories.length - 1}</StatusBadge></div><div className="mt-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface-panel)] px-3"><label className="flex min-h-11 items-center gap-2"><Search className="h-3.5 w-3.5 text-[var(--text-muted)]" /><span className="sr-only">Buscar diagramas</span><input className="w-full bg-transparent text-[10px] outline-none placeholder:text-[var(--text-muted)]" onChange={(event) => { setQuery(event.target.value); setLimit(20); }} placeholder="Buscar diagrama..." value={query} /></label></div><div className="mt-4 max-h-[565px] space-y-1 overflow-y-auto pr-1 [scrollbar-color:var(--text-muted)_transparent] [scrollbar-width:thin]">{categories.map((item) => { const count = item === "Todos" ? DIAGRAMS.length : DIAGRAMS.filter((diagram) => diagram.category === item).length; return <button className={cn("flex min-h-10 w-full items-center justify-between rounded-xl px-3 text-left text-[10px] font-bold", category === item ? "bg-[var(--brand-primary)] text-[var(--text-inverse)]" : "text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]")} key={item} onClick={() => { setCategory(item); setLimit(20); }} type="button"><span>{item}</span><span className={cn("rounded-full px-2 py-0.5 text-[8px]", category === item ? "bg-white/15" : "bg-[var(--surface-subtle)]")}>{count}</span></button>; })}</div></Surface>
        <Surface className="h-fit max-h-[720px] overflow-hidden"><div className="border-b border-[var(--border-default)] p-4"><div className="flex items-center justify-between"><p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Diagramas</p><span className="text-[9px] text-[var(--text-secondary)]">{Math.min(limit, filtered.length)} de {filtered.length}</span></div></div><div className="max-h-[595px] space-y-1 overflow-y-auto p-2 [scrollbar-color:var(--text-muted)_transparent] [scrollbar-width:thin]">{visible.map((item) => { const itemState = diagramState(item, scenario); return <button className={cn("w-full rounded-xl border p-3 text-left transition", selected.id === item.id ? "border-[var(--border-focus)] bg-[var(--brand-soft)]" : "border-transparent hover:bg-[var(--surface-subtle)]")} key={item.id} onClick={() => setSelectedId(item.id)} type="button"><div className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-subtle)] text-[var(--brand-primary)]">{itemState.viewable ? <Network className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}</span><div className="min-w-0 flex-1"><p className="truncate text-[10px] font-black">{item.name}</p><p className="mt-1 text-[8px] text-[var(--text-secondary)]">{item.category} / {item.stage}</p><StatusBadge className="mt-2 max-w-full truncate px-1.5 py-0.5 text-[7px]" tone={itemState.tone}>{itemState.label}</StatusBadge></div></div></button>; })}{filtered.length > limit ? <button className="min-h-10 w-full rounded-xl border border-dashed border-[var(--border-default)] text-[9px] font-black text-[var(--brand-primary)] hover:bg-[var(--brand-soft)]" onClick={() => setLimit((current) => current + 20)} type="button">Cargar {Math.min(20, filtered.length - limit)} mas</button> : null}</div></Surface>
        <Surface className="min-h-[720px] overflow-hidden"><div className="flex flex-col gap-3 border-b border-[var(--border-default)] p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap gap-2"><StatusBadge tone={state.tone}>{state.label}</StatusBadge><StatusBadge>{selected.version}</StatusBadge></div><h3 className="mt-2 text-[16px] font-black">{selected.name}</h3></div><div className="flex gap-2"><ActionButton icon={Eye}>Pantalla completa</ActionButton><ActionButton disabled={!state.downloadable} icon={Download} variant="primary">Descargar</ActionButton></div></div><div className="relative min-h-[580px] overflow-hidden bg-[radial-gradient(circle_at_top_right,var(--brand-soft),transparent_38%),var(--surface-subtle)] p-7 select-none" onContextMenu={(event) => event.preventDefault()} onCopy={(event) => event.preventDefault()} onCut={(event) => event.preventDefault()} onDragStart={(event) => event.preventDefault()}><div className="absolute inset-0 opacity-30 [background-image:linear-gradient(var(--border-default)_1px,transparent_1px),linear-gradient(90deg,var(--border-default)_1px,transparent_1px)] [background-size:26px_26px]" /><div className="relative flex min-h-[500px] items-center justify-center">{state.viewable ? <div className="w-full max-w-2xl"><div className="grid items-center gap-4 sm:grid-cols-[1fr_60px_1fr_60px_1fr]">{[["Entrada", Users], ["Orquestar", GitBranch], ["Resultado", CheckCircle2]].map(([label, IconValue], index) => { const Icon = IconValue as LucideIcon; return <div className="contents" key={String(label)}><div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-panel)] p-5 text-center shadow-[var(--shadow-card)]"><Icon className="mx-auto h-5 w-5 text-[var(--brand-primary)]" /><p className="mt-3 text-[10px] font-black">{String(label)}</p><p className="mt-1 text-[8px] text-[var(--text-secondary)]">{selected.category}</p></div>{index < 2 ? <div className="hidden items-center sm:flex"><span className="h-px flex-1 bg-[var(--brand-primary)]" /><ChevronRight className="h-4 w-4 text-[var(--brand-primary)]" /></div> : null}</div>; })}</div><p className="mt-8 text-center text-[9px] font-black uppercase tracking-[0.24em] text-[var(--brand-primary)] opacity-40">Lean Builder / {selected.id} / {selected.version}</p></div> : <div className="max-w-md rounded-2xl border border-[var(--border-default)] bg-[var(--surface-panel)] p-7 text-center shadow-[var(--shadow-elevated)]"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand-primary)]"><Lock className="h-5 w-5" /></span><StatusBadge className="mt-4" tone={state.tone}>{state.label}</StatusBadge><h4 className="mt-3 text-[17px] font-black">{selected.product === "ACP" ? "Este diagrama hace parte del ACP" : selected.access === "missing" ? "Este diagrama aun no fue generado" : "Este diagrama forma parte del Blueprint Pro"}</h4><p className="mt-2 text-[10px] leading-5 text-[var(--text-secondary)]">{selected.product === "ACP" ? "Adquiere el ACP para acceder a los artefactos de implementacion y construccion." : selected.access === "missing" ? "Completa la etapa indicada para producirlo. El catalogo conserva su lugar para mostrar el alcance total." : "Activa Blueprint Pro para consultar la documentacion y los diagramas detallados."}</p>{selected.access !== "missing" && selected.access !== "stage" ? <ActionButton className="mt-5" onClick={() => onNavigate(selected.product === "ACP" ? "acp-invitation" : "blueprint-pro")} variant="primary">Ver opcion de acceso</ActionButton> : null}</div>}</div></div></Surface>
        <aside className="space-y-4"><Surface className="p-4"><p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Inspector</p><div className="mt-4 space-y-3">{[["Producto", selected.product], ["Etapa", selected.stage], ["Categoria", selected.category], ["Policy", selected.product === "ACP" ? "diagram.acp.view" : "diagram.blueprint.view"], ["Version", selected.version]].map(([label, value]) => <div className="border-b border-[var(--border-subtle)] pb-2" key={label}><p className="text-[8px] uppercase text-[var(--text-muted)]">{label}</p><p className="mt-1 text-[10px] font-black">{value}</p></div>)}</div></Surface><Surface className="p-4"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[var(--success)]" /><p className="text-[11px] font-black">Proteccion</p></div><p className="mt-2 text-[9px] leading-4 text-[var(--text-secondary)]">Watermark, menu contextual, copiar, arrastrar y descargar se gobiernan segun policy. El backend vuelve a autorizar cada activo.</p></Surface><Surface className="p-4"><p className="text-[11px] font-black">Relacion con el proceso</p><p className="mt-2 text-[9px] leading-4 text-[var(--text-secondary)]">Origen: {selected.stage}. Las decisiones, evidencias y versiones relacionadas permanecen trazables.</p><ActionButton className="mt-3 w-full" onClick={() => onNavigate("attention")}>Ver decisiones relacionadas</ActionButton></Surface></aside>
      </div>
    </ProductShell>
  );
}

function CommercialAuditView(props: SaasViewProps) {
  const funnel = [["Blueprint visto", 184, "100%"], ["Intent Blueprint Pro", 92, "50%"], ["Blueprint Pro activado", 61, "33%"], ["Invitacion ACP vista", 44, "24%"], ["ACP activado", 18, "10%"], ["ACP exportado", 12, "7%"]] as const;
  return (
    <ProductShell {...props}>
      <SectionHeading eyebrow="Actividad / Auditoria autorizada" title="Del valor explorado a la exportacion" detail="Separa eventos de producto, seguridad y operacion. Las activaciones del mockup son demo; no se presentan como pagos, ordenes ni facturas reales." actions={<><ActionButton icon={RefreshCcw}>Actualizar</ActionButton><ActionButton icon={Download} variant="primary">Exportar evidencia</ActionButton></>} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_350px]">
        <div className="space-y-5"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[["184", "Blueprint views", Eye], ["27", "Intentos bloqueados", Lock], ["18", "ACP activados demo", Zap], ["12", "Exportaciones", Download]].map(([value, label, IconValue]) => { const Icon = IconValue as LucideIcon; return <Surface className="p-4" key={String(label)}><div className="flex items-start justify-between"><div><p className="text-[23px] font-black">{String(value)}</p><p className="mt-1 text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{String(label)}</p></div><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand-primary)]"><Icon className="h-4 w-4" /></span></div></Surface>; })}</div><Surface className="overflow-hidden"><div className="border-b border-[var(--border-default)] p-5"><h3 className="text-[16px] font-black">Funnel comercial</h3><p className="mt-1 text-[10px] text-[var(--text-secondary)]">Eventos tecnicos; checkout y billing no estan conectados.</p></div><div className="space-y-3 p-5">{funnel.map(([label, value, rate], index) => <div className="grid grid-cols-[170px_minmax(0,1fr)_50px] items-center gap-3" key={label}><div><p className="text-[10px] font-black">{label}</p><p className="text-[8px] text-[var(--text-muted)]">{value} eventos</p></div><div className="h-7 overflow-hidden rounded-lg bg-[var(--surface-subtle)]"><div className="flex h-full items-center rounded-lg bg-[var(--brand-primary)] px-2 text-[8px] font-black text-[var(--text-inverse)]" style={{ width: `${Math.max(14, 100 - index * 16)}%` }}>{rate}</div></div><span className="text-right text-[9px] font-black">{rate}</span></div>)}</div></Surface><Surface className="overflow-hidden"><div className="flex items-center justify-between border-b border-[var(--border-default)] p-5"><h3 className="text-[16px] font-black">Eventos recientes</h3><StatusBadge tone="info">Tenant filtrado</StatusBadge></div><div className="divide-y divide-[var(--border-subtle)]">{[["diagram.access_blocked", "Diagrama ACP bloqueado", "Viewer / hace 2 min", "warning"], ["blueprint.export_completed", "Blueprint Core descargado", "Owner / hace 18 min", "success"], ["acp.conformance_failed", "1 warning de portabilidad", "Owner / hace 27 min", "danger"], ["acp.demo_activated", "Tier ACP habilitado en demo", "Admin / hace 1 h", "info"]].map(([event, detail, meta, tone]) => <div className="grid gap-2 p-4 sm:grid-cols-[220px_minmax(0,1fr)_150px_100px] sm:items-center" key={event}><code className="text-[9px] font-black text-[var(--brand-primary)]">{event}</code><p className="text-[10px] font-bold">{detail}</p><p className="text-[9px] text-[var(--text-secondary)]">{meta}</p><StatusBadge tone={tone as Tone}>{tone === "success" ? "Exito" : tone === "danger" ? "Error" : tone === "warning" ? "Bloqueo" : "Demo"}</StatusBadge></div>)}</div></Surface></div>
        <aside className="space-y-5"><Surface className="border-[var(--info)] bg-[var(--info-soft)] p-5"><StatusBadge tone="info">Honestidad de producto</StatusBadge><h3 className="mt-3 text-[16px] font-black">No equivale a revenue</h3><p className="mt-2 text-[10px] leading-5 text-[var(--text-secondary)]">`commercial-tier` simula activacion. Sin orden, pasarela, suscripcion, renovacion, refund ni factura no debe reportarse ingreso.</p></Surface><Surface className="p-5"><p className="text-[12px] font-black">Salud del funnel</p><div className="mt-4 space-y-3">{[["Blueprint -> Pro", "33%", "success"], ["Pro -> ACP", "30%", "warning"], ["ACP -> export", "67%", "success"], ["Errores conformance", "2", "danger"]].map(([label, value, tone]) => <div className="flex items-center justify-between text-[10px]" key={label}><span className="text-[var(--text-secondary)]">{label}</span><StatusBadge tone={tone as Tone}>{value}</StatusBadge></div>)}</div></Surface><Surface className="p-5"><p className="text-[12px] font-black">Acceso administrativo</p><p className="mt-2 text-[10px] leading-5 text-[var(--text-secondary)]">Los eventos respetan workspace, rol y capacidad de auditoria. No se mezclan tenants.</p><ActionButton className="mt-4 w-full" onClick={() => props.onNavigate("access-plan")}>Ver plan y acceso</ActionButton></Surface></aside>
      </div>
    </ProductShell>
  );
}

function AccessPlanView(props: SaasViewProps) {
  const { scenario, onScenarioChange } = props;
  const meta = SCENARIO_META[scenario];
  const capabilities = [
    ["blueprint.view", true, "Explorar resultado protegido"],
    ["blueprint.export", scenario !== "free" && scenario !== "restricted", "Descargar Blueprint Pro"],
    ["acp.view", scenario === "acp" || scenario === "restricted", "Conocer estado del ACP"],
    ["acp.build", scenario === "acp", "Ejecutar subfases ACP"],
    ["acp.export", scenario === "acp", "Descargar ACP"],
    ["commercial.audit", scenario !== "restricted", "Consultar funnel autorizado"],
  ] as const;
  return (
    <ProductShell {...props}>
      <SectionHeading eyebrow="Workspace / Plan y acceso" title="Una sola respuesta para producto, rol y capacidad" detail="La UI diferencia falta de compra de falta de permiso y mantiene el aislamiento por tenant en cada evaluacion." />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5"><Surface className="p-6"><div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div><StatusBadge tone={meta.tone}>{meta.access}</StatusBadge><h3 className="mt-3 text-[21px] font-black">Workspace Lean Builder</h3><p className="mt-2 text-[10px] text-[var(--text-secondary)]">tenant: org_lean / workspace: ws_primary / rol: {meta.role}</p></div><div className="grid grid-cols-2 gap-3">{[["Plan", meta.plan], ["Rol efectivo", meta.role]].map(([label, value]) => <div className="min-w-[150px] rounded-xl bg-[var(--surface-subtle)] p-4" key={label}><p className="text-[8px] uppercase tracking-wider text-[var(--text-muted)]">{label}</p><p className="mt-2 text-[12px] font-black">{value}</p></div>)}</div></div></Surface><Surface className="overflow-hidden"><div className="border-b border-[var(--border-default)] p-5"><h3 className="text-[16px] font-black">Capabilities efectivas</h3><p className="mt-1 text-[10px] text-[var(--text-secondary)]">El frontend consume decisiones del backend; no infiere acceso por nombre del plan.</p></div><div className="divide-y divide-[var(--border-subtle)]">{capabilities.map(([capability, allowed, detail]) => <div className="grid gap-3 p-4 sm:grid-cols-[210px_minmax(0,1fr)_130px] sm:items-center" key={capability}><code className="text-[9px] font-black text-[var(--brand-primary)]">{capability}</code><p className="text-[10px] text-[var(--text-secondary)]">{detail}</p><StatusBadge tone={allowed ? "success" : "danger"}>{allowed ? "Permitida" : "Denegada"}</StatusBadge></div>)}</div></Surface><Surface className="p-5"><div className="grid gap-4 md:grid-cols-2"><div className="rounded-xl border border-[var(--warning)] bg-[var(--warning-soft)] p-4"><StatusBadge tone="warning">purchase_required</StatusBadge><p className="mt-3 text-[10px] leading-5 text-[var(--text-secondary)]">El workspace no tiene el producto. Mostrar valor y CTA de activacion.</p></div><div className="rounded-xl border border-[var(--danger)] bg-[var(--danger-soft)] p-4"><StatusBadge tone="danger">permission_required</StatusBadge><p className="mt-3 text-[10px] leading-5 text-[var(--text-secondary)]">El producto existe, pero el rol no tiene capability. Solicitar acceso al owner.</p></div></div></Surface></div>
        <aside className="space-y-5"><Surface className="p-5"><p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Cambiar escenario</p><div className="mt-4 space-y-2">{(["free", "pro", "acp", "restricted"] as CommercialScenario[]).map((item) => <button className={cn("flex min-h-12 w-full items-center justify-between rounded-xl border px-3 text-left", scenario === item ? "border-[var(--border-focus)] bg-[var(--brand-soft)]" : "border-[var(--border-default)] hover:bg-[var(--surface-subtle)]")} key={item} onClick={() => onScenarioChange(item)} type="button"><div><p className="text-[10px] font-black">{SCENARIO_META[item].plan}</p><p className="mt-1 text-[8px] text-[var(--text-secondary)]">{SCENARIO_META[item].role}</p></div>{scenario === item ? <CheckCircle2 className="h-4 w-4 text-[var(--brand-primary)]" /> : <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />}</button>)}</div></Surface><Surface className="border-[var(--success)] bg-[var(--success-soft)] p-5"><div className="flex gap-2"><ShieldCheck className="h-4 w-4 text-[var(--success)]" /><p className="text-[12px] font-black">Aislamiento multitenant</p></div><p className="mt-2 text-[10px] leading-5 text-[var(--text-secondary)]">Proyecto, artefacto, diagrama, evento y entitlement se filtran por `workspaceId` validado contra la membresia actual.</p></Surface></aside>
      </div>
    </ProductShell>
  );
}

function AdminSaasView(props: SaasViewProps) {
  return (
    <ProductShell {...props}>
      <SectionHeading eyebrow="Administracion SaaS / Evolucion" title="Parametrizacion comercial y de contenido" detail="Esta vista representa el target necesario para operar a escala. Las policies actuales siguen parcialmente definidas por codigo; no se simula que la consola ya sea productiva." actions={<ActionButton disabled icon={Settings} variant="primary">Guardar cambios</ActionButton>} />
      <Surface className="mb-5 border-[var(--warning)] bg-[var(--warning-soft)] p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 text-[var(--warning)]" /><div><StatusBadge tone="warning">Target de producto / no implementado</StatusBadge><h3 className="mt-2 text-[15px] font-black">Configuracion actual por codigo y migraciones</h3><p className="mt-1 text-[10px] leading-5 text-[var(--text-secondary)]">El mockup documenta la direccion futura sin presentar checkout, billing, invoices o renovaciones como capacidades disponibles.</p></div></div><StatusBadge>Roadmap P2</StatusBadge></div></Surface>
      <div className="grid gap-5 xl:grid-cols-[220px_minmax(0,1fr)_330px]">
        <Surface className="h-fit p-3"><p className="px-2 py-2 text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">Configuracion</p>{[["Planes y capabilities", Layers3], ["Politicas de diagramas", Network], ["Catalogo de artefactos", Library], ["Pricing versionado", Gauge], ["Auditoria y retencion", History], ["Proveedores LLM", Bot]].map(([label, IconValue], index) => { const Icon = IconValue as LucideIcon; return <button className={cn("flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[10px] font-bold", index === 0 ? "bg-[var(--brand-soft)] text-[var(--brand-primary)]" : "text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]")} key={String(label)} type="button"><Icon className="h-4 w-4" />{String(label)}</button>; })}</Surface>
        <div className="space-y-5"><Surface className="overflow-hidden"><div className="flex items-center justify-between border-b border-[var(--border-default)] p-5"><div><h3 className="text-[16px] font-black">Planes y capabilities</h3><p className="mt-1 text-[10px] text-[var(--text-secondary)]">Version target 2026.08 / solo lectura</p></div><ActionButton disabled>Nuevo plan</ActionButton></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-[10px]"><thead className="bg-[var(--surface-subtle)] text-[8px] uppercase tracking-wider text-[var(--text-muted)]"><tr>{["Plan", "Blueprint view", "Blueprint export", "ACP build", "ACP export", "Estado"].map((head) => <th className="px-4 py-3" key={head}>{head}</th>)}</tr></thead><tbody>{[["Blueprint Free", true, false, false, false], ["Blueprint Pro", true, true, false, false], ["ACP Premium", true, true, true, true]].map(([plan, ...flags]) => <tr className="border-t border-[var(--border-subtle)]" key={String(plan)}><td className="px-4 py-4 font-black">{String(plan)}</td>{flags.map((flag, index) => <td className="px-4 py-4" key={`${String(plan)}-${index}`}>{flag ? <CheckCircle2 className="h-4 w-4 text-[var(--success)]" /> : <Lock className="h-4 w-4 text-[var(--text-muted)]" />}</td>)}<td className="px-4 py-4"><StatusBadge tone="warning">Por migrar</StatusBadge></td></tr>)}</tbody></table></div></Surface><Surface className="p-5"><div className="flex items-center justify-between"><div><h3 className="text-[15px] font-black">Politica de diagramas</h3><p className="mt-1 text-[10px] text-[var(--text-secondary)]">Etapa, rol, producto, compra y proteccion.</p></div><StatusBadge tone="info">API base disponible</StatusBadge></div><div className="mt-4 grid gap-3 md:grid-cols-3">{[["Arquitectura", "Muestra Free", "Owner + Viewer"], ["Memoria RAG", "Blueprint Pro", "Owner + Editor"], ["Conformance", "ACP Premium", "Owner"]].map(([diagram, product, role]) => <div className="rounded-xl border border-[var(--border-default)] p-4" key={diagram}><p className="text-[10px] font-black">{diagram}</p><p className="mt-2 text-[9px] text-[var(--text-secondary)]">{product}</p><p className="mt-1 text-[8px] text-[var(--text-muted)]">{role}</p></div>)}</div></Surface></div>
        <aside className="space-y-5"><Surface className="p-5"><p className="text-[12px] font-black">Estado de capacidades</p><div className="mt-4 space-y-3">{[["Gates backend", "Implementado", "success"], ["Auditoria comercial", "Implementado", "success"], ["Checkout", "Pendiente", "warning"], ["Orders y subscriptions", "Pendiente", "warning"], ["Consola de policies", "Target", "info"]].map(([label, value, tone]) => <div className="flex items-center justify-between text-[10px]" key={label}><span className="text-[var(--text-secondary)]">{label}</span><StatusBadge tone={tone as Tone}>{value}</StatusBadge></div>)}</div></Surface><Surface className="p-5"><div className="flex items-center gap-2"><Bot className="h-4 w-4 text-[var(--brand-primary)]" /><p className="text-[12px] font-black">Proveedores LLM</p></div><p className="mt-2 text-[10px] leading-5 text-[var(--text-secondary)]">La configuracion global corresponde al administrador general; los workspaces consumen providers autorizados sin exponer secretos.</p><div className="mt-3 rounded-xl bg-[var(--surface-subtle)] p-3 text-[9px]"><strong>Default:</strong> Codex CLI Runtime Bridge</div></Surface><Surface className="border-[var(--danger)] bg-[var(--danger-soft)] p-5"><StatusBadge tone="danger">No disponible aun</StatusBadge><p className="mt-3 text-[10px] leading-5 text-[var(--text-secondary)]">No mostrar facturas, renovaciones, refunds ni revenue hasta implementar el dominio comercial real.</p></Surface></aside>
      </div>
    </ProductShell>
  );
}

export function SaasProductView(props: SaasViewProps) {
  if (props.active === "blueprint-free") return <BlueprintFreeView {...props} />;
  if (props.active === "blueprint-pro") return <BlueprintProView {...props} />;
  if (props.active === "acp-invitation") return <AcpInvitationView {...props} />;
  if (props.active === "acp-gate") return <AcpGateView {...props} />;
  if (props.active === "acp-workspace") return <AcpWorkspaceView {...props} />;
  if (props.active === "export-center") return <ExportCenterView {...props} />;
  if (props.active === "launcher") return <LauncherView {...props} />;
  if (props.active === "commercial-audit") return <CommercialAuditView {...props} />;
  if (props.active === "access-plan") return <AccessPlanView {...props} />;
  return <AdminSaasView {...props} />;
}
