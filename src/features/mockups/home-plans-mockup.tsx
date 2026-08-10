"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  FileCheck2,
  FolderKanban,
  Minus,
  PackageCheck,
  Play,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { TopUtilities, WorkspaceShell, WorkspaceUserCard } from "@/components/lean/shell";
import { AppButton, Badge, Panel, ProgressBar } from "@/components/lean/ui";
import { useAuth } from "@/core/auth/auth-context";
import { cn } from "@/lib/utils";

type PreviewMode = "new" | "returning";
type TierKey = "blueprint" | "blueprint_pro" | "acp";

type PlanDefinition = {
  accent: string;
  benefits: string[];
  description: string;
  exclusion: string;
  eyebrow: string;
  icon: ReactNode;
  key: TierKey;
  name: string;
  price: string;
  priceDetail: string;
  recommended?: boolean;
};

const PLANS: PlanDefinition[] = [
  {
    accent: "#3554c7",
    benefits: [
      "Diseño integral visible en la plataforma",
      "Narrativa de valor y arquitectura de muestra",
      "Acceso a diagramas de muestra",
    ],
    description: "Para explorar la solución, validar el enfoque y decidir si vale la pena avanzar.",
    exclusion: "Sin descarga, copia ni exportación externa.",
    eyebrow: "01 · EXPLORAR",
    icon: <Sparkles aria-hidden="true" className="h-4 w-4" />,
    key: "blueprint",
    name: "Blueprint",
    price: "$0",
    priceDetail: "Gratis por proyecto",
  },
  {
    accent: "#2446bf",
    benefits: [
      "Todo lo incluido en Blueprint",
      "Documento profesional descargable",
      "Arquitectura, alcance, reglas y roadmap",
      "Estimación de esfuerzo, tiempo y costo",
    ],
    description: "Para presentar, tomar una decisión de inversión o contratar la implementación.",
    exclusion: "No incluye Test Suite ni paquete técnico ACP.",
    eyebrow: "02 · DOCUMENTAR",
    icon: <FileCheck2 aria-hidden="true" className="h-4 w-4" />,
    key: "blueprint_pro",
    name: "Blueprint Profesional",
    price: "$249.000",
    priceDetail: "COP · Pago único",
    recommended: true,
  },
  {
    accent: "#0f766e",
    benefits: [
      "Todo lo incluido en Blueprint Profesional",
      "Prompts, contratos, herramientas y memoria",
      "Test Suite, GAPs y preguntas de implementación",
      "Paquete ZIP portable para herramientas agenticas",
    ],
    description: "Para iniciar la construcción con Codex, Cursor, Claude Code o Copilot.",
    exclusion: "No ejecuta el despliegue ni instala dependencias.",
    eyebrow: "03 · CONSTRUIR",
    icon: <PackageCheck aria-hidden="true" className="h-4 w-4" />,
    key: "acp",
    name: "ACP Premium",
    price: "$899.000",
    priceDetail: "COP · Pago único",
  },
];

const COMPARISON_ROWS = [
  ["Diseño visible en plataforma", "Incluido", "Incluido", "Incluido"],
  ["Blueprint descargable", "—", "Incluido", "Incluido"],
  ["Diagramas", "Muestras", "Blueprint", "Blueprint + ACP"],
  ["Estimación comercial", "—", "Incluido", "Incluido"],
  ["Prompt Pack y contratos", "—", "—", "Incluido"],
  ["Test Suite y GAPs", "—", "—", "Incluido"],
  ["Paquete técnico portable", "—", "—", "Incluido"],
];

const JOURNEY_STEPS = [
  ["01", "Descubrir", "Describe el problema y el contexto."],
  ["02", "Diseñar", "Valida arquitectura, reglas y alcance."],
  ["03", "Decidir", "Revisa esfuerzo, costo y nivel de entrega."],
  ["04", "Construir", "Lleva el paquete a tu herramienta preferida."],
];

function initials(value?: string | null) {
  return (
    value
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "LB"
  );
}

function MockupSidebarFooter() {
  const { user } = useAuth();

  return (
    <WorkspaceUserCard
      initials={initials(user?.full_name)}
      name={user?.full_name ?? "Lean Builder"}
      subtitle={user?.active_workspace_name ?? "Workspace actual"}
    />
  );
}

function PreviewSwitch({ mode, onChange }: { mode: PreviewMode; onChange(mode: PreviewMode): void }) {
  return (
    <div className="flex flex-col gap-2 sm:items-end">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">Vista simulada</p>
      <div aria-label="Seleccionar estado del mockup" className="inline-grid grid-cols-2 rounded-[10px] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-1" role="group">
        {([
          ["new", "Primera visita"],
          ["returning", "Con proyecto"],
        ] as const).map(([value, label]) => (
          <button
            aria-pressed={mode === value}
            className={cn(
              "min-h-9 rounded-[7px] px-3 text-[12px] font-semibold transition",
              mode === value
                ? "bg-white text-[var(--brand-primary)] shadow-[0_1px_4px_rgba(15,23,42,0.12)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
            )}
            key={value}
            onClick={() => onChange(value)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ActiveProjectCard() {
  return (
    <div className="rounded-[12px] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Proyecto activo</p>
          <p className="mt-2 text-[18px] font-semibold text-[var(--text-primary)]">Asistente de soporte TI</p>
          <p className="mt-1 text-[12px] text-[var(--text-secondary)]">Diseñar · Arquitectura y conducta</p>
        </div>
        <Badge tone="blue">Blueprint</Badge>
      </div>
      <div className="mt-5 flex items-center justify-between text-[11px] font-semibold text-[var(--text-secondary)]">
        <span>Progreso del proyecto</span>
        <span>72%</span>
      </div>
      <ProgressBar className="mt-2 h-1.5" value={72} />
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-4">
        <span className="text-[12px] text-[var(--text-secondary)]">Siguiente: aprobar diseño</span>
        <ArrowRight aria-hidden="true" className="h-4 w-4 text-[var(--brand-primary)]" />
      </div>
    </div>
  );
}

function FirstValueCard() {
  return (
    <div className="rounded-[12px] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Tu primera entrega</p>
        <Badge tone="green">Sin costo</Badge>
      </div>
      <p className="mt-3 text-[18px] font-semibold text-[var(--text-primary)]">Un Blueprint para decidir con evidencia</p>
      <div className="mt-4 space-y-3">
        {[
          "Define problema, alcance y restricciones",
          "Propone arquitectura y comportamiento",
          "Estima esfuerzo antes de construir",
        ].map((item) => (
          <div className="flex items-start gap-2.5" key={item}>
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] bg-[var(--brand-soft)] text-[var(--brand-primary)]">
              <Check aria-hidden="true" className="h-3 w-3" />
            </span>
            <span className="text-[12px] leading-5 text-[var(--text-secondary)]">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: PlanDefinition;
  selected: boolean;
  onSelect(plan: PlanDefinition): void;
}) {
  return (
    <article
      className={cn(
        "relative flex min-h-[430px] flex-col rounded-[12px] border bg-white p-5 transition duration-200",
        selected
          ? "border-[var(--brand-primary)] shadow-[0_16px_38px_rgba(36,70,191,0.13)]"
          : "border-[var(--border-default)] hover:-translate-y-1 hover:shadow-[var(--shadow-card)]",
      )}
    >
      <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: plan.accent }} />
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.16em]" style={{ color: plan.accent }}>
          {plan.icon}
          <span>{plan.eyebrow}</span>
        </div>
        {plan.recommended ? <Badge tone="blue">Recomendado</Badge> : null}
      </div>

      <h3 className="mt-5 text-[22px] font-semibold tracking-[-0.035em] text-[var(--text-primary)]">{plan.name}</h3>
      <p className="mt-2 min-h-14 text-[13px] leading-6 text-[var(--text-secondary)]">{plan.description}</p>

      <div className="mt-5 flex items-end gap-2 border-y border-[var(--border-subtle)] py-4">
        <p className="text-[30px] font-semibold tracking-[-0.045em] text-[var(--text-primary)]">{plan.price}</p>
        <p className="pb-1 text-[11px] font-medium text-[var(--text-muted)]">{plan.priceDetail}</p>
      </div>

      <div className="mt-5 flex-1 space-y-3">
        {plan.benefits.map((benefit) => (
          <div className="flex items-start gap-2.5" key={benefit}>
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] bg-[#e9f6ef] text-[#22734a]">
              <Check aria-hidden="true" className="h-3 w-3" />
            </span>
            <span className="text-[12px] leading-5 text-[var(--text-secondary)]">{benefit}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-start gap-2 border-t border-[var(--border-subtle)] pt-4">
        <Minus aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-muted)]" />
        <p className="text-[11px] leading-5 text-[var(--text-muted)]">{plan.exclusion}</p>
      </div>

      <AppButton
        aria-pressed={selected}
        className="mt-5 h-10 w-full rounded-[9px]"
        onClick={() => onSelect(plan)}
        variant={selected ? "primary" : "secondary"}
      >
        {selected ? "Nivel seleccionado" : plan.key === "blueprint" ? "Empezar gratis" : `Ver ${plan.name}`}
      </AppButton>
    </article>
  );
}

function ComparisonTable() {
  return (
    <div
      aria-label="Comparación de niveles"
      className="w-full min-w-0 max-w-full overflow-x-auto rounded-[12px] border border-[var(--border-default)] bg-white"
      role="region"
      tabIndex={0}
    >
      <table className="w-full min-w-[760px] border-collapse text-left">
        <thead>
          <tr className="bg-[var(--surface-subtle)] text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
            <th className="w-[34%] px-5 py-4">Capacidad</th>
            <th className="px-4 py-4">Blueprint</th>
            <th className="px-4 py-4 text-[var(--brand-primary)]">Profesional</th>
            <th className="px-4 py-4 text-[#0f766e]">ACP Premium</th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON_ROWS.map(([feature, blueprint, professional, acp]) => (
            <tr className="border-t border-[var(--border-subtle)]" key={feature}>
              <th className="px-5 py-3.5 text-[12px] font-semibold text-[var(--text-primary)]">{feature}</th>
              {[blueprint, professional, acp].map((value, index) => (
                <td className="px-4 py-3.5 text-[12px] text-[var(--text-secondary)]" key={`${feature}-${index}`}>
                  <span className="inline-flex items-center gap-2">
                    {value === "Incluido" ? <Check aria-hidden="true" className="h-3.5 w-3.5 text-[#22734a]" /> : null}
                    {value}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function HomePlansMockup() {
  const { user } = useAuth();
  const [mode, setMode] = useState<PreviewMode>("new");
  const [selectedTier, setSelectedTier] = useState<TierKey>("blueprint");
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [feedback, setFeedback] = useState("Blueprint está seleccionado como punto de partida.");

  function selectPlan(plan: PlanDefinition) {
    setSelectedTier(plan.key);
    setFeedback(
      plan.key === "blueprint"
        ? "Empezarás con un Blueprint gratuito dentro de la plataforma."
        : `${plan.name} quedó seleccionado para revisar su entrega antes de comprar.`,
    );
  }

  return (
    <WorkspaceShell
      sidebarFooter={<MockupSidebarFooter />}
      sidebarHeader={
        <div className="rounded-[10px] border border-white/10 bg-white/6 px-3 py-3">
          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/50">Mockup</p>
          <p className="mt-1 text-[12px] font-semibold text-white">Nueva página de inicio</p>
        </div>
      }
    >
      <div className="min-h-screen w-full min-w-0 max-w-[calc(100vw-2px)] overflow-x-hidden bg-[#f3f6fa] text-[var(--text-primary)] lg:max-w-none">
        <header className="border-b border-[var(--border-default)] bg-white">
          <div className="mx-auto flex max-w-[1360px] flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div className="flex flex-wrap items-center gap-2 text-[12px] text-[var(--text-secondary)]">
              <Link className="font-semibold text-[var(--brand-primary)]" href="/">
                Inicio actual
              </Link>
              <span aria-hidden="true" className="text-[var(--border-default)]">/</span>
              <span>Propuesta comercial</span>
              <Badge className="ml-1" tone="slate">01 · LIGHT</Badge>
            </div>
            <TopUtilities />
          </div>
        </header>

        <main className="mx-auto min-w-0 max-w-[1360px] space-y-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--brand-primary)]">Entrada del producto · propuesta</p>
              <p className="mt-2 text-[12px] text-[var(--text-secondary)]">
                La portada cambia su prioridad según el momento del usuario, sin mezclar administración ni navegación técnica.
              </p>
            </div>
            <PreviewSwitch mode={mode} onChange={setMode} />
          </div>

          <Panel className="border-[var(--border-default)] bg-white p-5 lg:p-6">
            <div className="pointer-events-none absolute right-0 top-0 hidden h-full w-[42%] opacity-60 lg:block" aria-hidden="true">
              <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(53,84,199,0.035))]" />
              <div className="absolute right-8 top-8 h-28 w-28 border border-[#dbe3f3]" />
              <div className="absolute right-16 top-16 h-28 w-28 border border-[#dbe3f3]" />
            </div>

            <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_360px] lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={mode === "new" ? "blue" : "green"}>{mode === "new" ? "Primera visita" : "Proyecto activo"}</Badge>
                  <Badge tone="slate">{user?.active_workspace_name ?? "Workspace actual"}</Badge>
                </div>
                <h1 className="mt-4 max-w-4xl text-[34px] font-semibold leading-[1.08] tracking-[-0.045em] text-[var(--text-primary)] sm:text-[40px] lg:text-[44px]">
                  {mode === "new"
                    ? "De una necesidad de negocio a un agente listo para construir."
                    : "Continúa tu diseño sin perder contexto ni decisiones."}
                </h1>
                <p className="mt-4 max-w-3xl text-[14px] leading-7 text-[var(--text-secondary)]">
                  {mode === "new"
                    ? "Empieza gratis con un Blueprint. Cuando estés listo, descarga la documentación profesional o adquiere el paquete técnico completo."
                    : "Retoma la etapa actual, revisa la entrega disponible y decide cuándo avanzar a documentación profesional o construcción."}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <AppButton
                    className="h-10 rounded-[9px] px-5"
                    icon={mode === "new" ? <Sparkles aria-hidden="true" className="h-4 w-4" /> : <Play aria-hidden="true" className="h-4 w-4" />}
                    onClick={() => setFeedback(mode === "new" ? "El flujo gratuito comenzaría en Descubrir." : "El proyecto se abriría en la etapa Diseñar.")}
                    variant="primary"
                  >
                    {mode === "new" ? "Crear Blueprint gratis" : "Continuar proyecto"}
                  </AppButton>
                  <AppButton
                    className="h-10 rounded-[9px]"
                    icon={<FolderKanban aria-hidden="true" className="h-4 w-4" />}
                    onClick={() => setFeedback("Aquí se abriría el portafolio de proyectos.")}
                  >
                    Ver proyectos
                  </AppButton>
                </div>
              </div>
              {mode === "new" ? <FirstValueCard /> : <ActiveProjectCard />}
            </div>
          </Panel>

          <section aria-labelledby="plans-title" className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--brand-primary)]">Niveles de entrega</p>
                <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.035em] text-[var(--text-primary)]" id="plans-title">
                  Elige hasta dónde quieres llevar tu proyecto
                </h2>
                <p className="mt-2 text-[13px] leading-6 text-[var(--text-secondary)]">
                  Empieza gratis. Los niveles pagos son compras únicas y se aplican al proyecto seleccionado.
                </p>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-semibold text-[var(--text-secondary)]">
                <ShieldCheck aria-hidden="true" className="h-4 w-4 text-[#22734a]" />
                <span>Sin suscripción · Precios en COP</span>
              </div>
            </div>

            <div className="relative grid gap-4 lg:grid-cols-3">
              <div aria-hidden="true" className="absolute left-[16%] right-[16%] top-7 hidden h-px bg-[var(--border-default)] lg:block" />
              {PLANS.map((plan) => (
                <PlanCard key={plan.key} onSelect={selectPlan} plan={plan} selected={selectedTier === plan.key} />
              ))}
            </div>

            <div aria-live="polite" className="flex items-start gap-3 rounded-[10px] border border-[#cbd9fb] bg-[#eef3ff] px-4 py-3 text-[12px] text-[#23439f]">
              <CircleDollarSign aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{feedback}</p>
            </div>
          </section>

          <Panel className="min-w-0 border-[var(--border-default)] bg-white p-5">
            <button
              aria-expanded={comparisonOpen}
              className="flex w-full items-center justify-between gap-4 text-left"
              onClick={() => setComparisonOpen((current) => !current)}
              type="button"
            >
              <span>
                <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Comparación detallada</span>
                <span className="mt-1 block text-[18px] font-semibold text-[var(--text-primary)]">Qué recibes en cada nivel</span>
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-[9px] border border-[var(--border-default)] text-[var(--brand-primary)]">
                {comparisonOpen ? <ChevronUp aria-hidden="true" className="h-4 w-4" /> : <ChevronDown aria-hidden="true" className="h-4 w-4" />}
              </span>
            </button>
            {comparisonOpen ? <div className="mt-5"><ComparisonTable /></div> : null}
          </Panel>

          <Panel className="border-[var(--border-default)] bg-white p-5">
            <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-center">
              <div>
                <Badge tone="slate">Cómo funciona</Badge>
                <h2 className="mt-3 text-[22px] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">Un recorrido, tres decisiones</h2>
                <p className="mt-2 text-[12px] leading-6 text-[var(--text-secondary)]">La complejidad aparece solo cuando aporta valor.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {JOURNEY_STEPS.map(([number, title, detail]) => (
                  <div className="rounded-[10px] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4" key={number}>
                    <span className="text-[10px] font-bold tracking-[0.16em] text-[var(--brand-primary)]">{number}</span>
                    <p className="mt-2 text-[14px] font-semibold text-[var(--text-primary)]">{title}</p>
                    <p className="mt-1 text-[11px] leading-5 text-[var(--text-secondary)]">{detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <footer className="flex flex-col gap-3 border-t border-[var(--border-default)] py-4 text-[11px] text-[var(--text-secondary)] sm:flex-row sm:items-center sm:justify-between">
            <span>Mockup navegable · No ejecuta compras ni crea proyectos reales.</span>
            <span>Enterprise Corporate · Densidad compacta</span>
          </footer>
        </main>
      </div>
    </WorkspaceShell>
  );
}
