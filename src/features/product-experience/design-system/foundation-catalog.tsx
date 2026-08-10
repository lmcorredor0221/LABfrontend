"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Clock3, MessageSquareText } from "lucide-react";
import {
  UxaActionCard,
  UxaBadge,
  UxaBlockedState,
  UxaButton,
  UxaDrawerHeader,
  UxaEmptyState,
  UxaEvidenceCard,
  UxaFilterChip,
  UxaMetricCard,
  UxaPageState,
  UxaProcessingStrip,
  UxaProductHero,
  UxaSectionNav,
  UxaSkipLink,
  UxaStageRail,
  UxaStickyActionBar,
  UxaSurface,
  UxaTextareaField,
  UxaTextField,
  type UxaStageRailItem,
} from "@/features/product-experience/design-system";
import { cn } from "@/lib/utils";

const stages: UxaStageRailItem[] = [
  { description: "Problema y contexto", key: "discover", label: "Descubrir", state: "done" },
  { description: "Objetivos y alcance", key: "define", label: "Definir", state: "done" },
  { description: "Arquitectura y conducta", key: "design", label: "Disenar", state: "active" },
  { description: "Capacidades minimas", key: "tools", label: "Herramientas", state: "blocked" },
  { description: "RAG y conocimiento", key: "memory", label: "Memoria", state: "pending" },
];

const productNavPreview = [
  "Trabajo LEAN",
  "Blueprint",
  "Blueprint Pro",
  "Diagramas",
  "ACP",
  "Artefactos",
  "Atencion",
  "Actividad",
];

const stateCards = [
  {
    icon: CheckCircle2,
    label: "Completado",
    text: "La etapa tiene artefacto aprobado y puede alimentar la memoria larga.",
    tone: "success" as const,
  },
  {
    icon: MessageSquareText,
    label: "HITL",
    text: "Una decision humana aparece en el Segmento de Atencion y en su etapa origen.",
    tone: "warning" as const,
  },
  {
    icon: AlertCircle,
    label: "Bloqueado",
    text: "La accion principal se reemplaza por el cierre del gap o pregunta.",
    tone: "danger" as const,
  },
  {
    icon: Clock3,
    label: "Procesando",
    text: "El sistema muestra actividad por pasos sin inventar tiempo restante.",
    tone: "info" as const,
  },
];

export function UxaFoundationCatalog() {
  const [density, setDensity] = useState<"compact" | "comfortable" | "dense">("compact");
  const [section, setSection] = useState("summary");

  return (
    <div className="uxa-foundation-root min-h-screen px-4 py-[var(--uxa-panel-padding)] lg:px-8" data-density={density}>
      <UxaSkipLink targetId="foundation-main" />
      <header className="mx-auto flex max-w-[var(--uxa-layout-content-max)] flex-col gap-4 rounded-[var(--uxa-radius-xl)] border border-[var(--uxa-color-border)] bg-white/80 p-[var(--uxa-space-5)] shadow-[var(--uxa-shadow-card)] backdrop-blur lg:flex-row lg:items-center lg:justify-between">
        <div>
          <UxaBadge tone="info">Sistema visual</UxaBadge>
          <h1 className="mt-3 text-[var(--uxa-font-size-page-title)] font-black leading-[var(--uxa-line-tight)] text-[var(--uxa-color-ink)]">
            Sistema visual para Lean Agent Builder
          </h1>
          <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[var(--uxa-color-ink-soft)]">
            Catalogo de tokens, densidad, estados, componentes criticos y accesibilidad para construir una experiencia SaaS coherente y mantenible.
          </p>
        </div>
        <fieldset className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-[var(--uxa-color-panel)] p-[var(--uxa-space-3)]">
          <legend className="px-2 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)]">
            Densidad
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {(["compact", "comfortable", "dense"] as const).map((item) => (
              <button
                aria-pressed={density === item}
                className={cn(
                  "min-h-11 rounded-[var(--uxa-radius-md)] border px-3 text-[11px] font-black capitalize",
                  density === item
                    ? "border-[var(--uxa-color-brand)] bg-[var(--uxa-color-brand)] text-white"
                    : "border-[var(--uxa-color-border)] bg-white text-[var(--uxa-color-ink-soft)]",
                )}
                key={item}
                onClick={() => setDensity(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </fieldset>
      </header>

      <div className="uxa-shell-grid mx-auto mt-[var(--uxa-space-5)] max-w-[var(--uxa-layout-content-max)]">
        <aside aria-label="Ruta LEAN de muestra">
          <UxaStageRail activeKey="design" items={stages} />
        </aside>

        <main className="min-w-0 space-y-[var(--uxa-space-5)]" id="foundation-main" tabIndex={-1}>
          <nav aria-label="Navegacion horizontal de muestra" className="uxa-product-navigation uxa-product-navigation--preview">
            <div className="uxa-product-navigation-list scrollbar-subtle">
              {productNavPreview.map((item, index) => (
                <a
                  aria-current={index === 0 ? "page" : undefined}
                  className="uxa-product-nav-link"
                  href="#foundation-main"
                  key={item}
                >
                  <span className="uxa-product-nav-label">{item}</span>
                </a>
              ))}
            </div>
          </nav>

          <UxaProductHero
            actions={<UxaButton>Continuar a Definir</UxaButton>}
            description="Contexto operativo, estado y accion principal conviven en un encabezado compacto y estable."
            eyebrow={<UxaBadge tone="success">Aprobado</UxaBadge>}
            meta={<UxaFilterChip selected>Vista operativa</UxaFilterChip>}
            title="Descubrir: problema y contexto"
          />

          <section aria-label="Metricas y navegacion semantica" className="grid gap-[var(--uxa-space-4)] lg:grid-cols-[220px_minmax(0,1fr)]">
            <UxaSectionNav
              activeKey={section}
              ariaLabel="Secciones de muestra"
              items={[
                { count: 3, description: "Estado y avance", key: "summary", label: "Resumen" },
                { count: 2, description: "Fuentes aprobadas", key: "evidence", label: "Evidencia" },
                { count: 1, description: "Decisiones pendientes", key: "attention", label: "Atencion" },
              ]}
              onSelect={setSection}
            />
            <div className="grid gap-[var(--uxa-space-3)] sm:grid-cols-3">
              <UxaMetricCard label="Completitud" value="100%" />
              <UxaMetricCard label="Evidencias" value="2" />
              <UxaMetricCard label="Bloqueantes" value="0" />
            </div>
          </section>

          <section aria-label="Patrones semanticos finales" className="grid gap-[var(--uxa-space-4)] lg:grid-cols-2">
            <UxaPageState
              description="Se conserva la ultima version aprobada mientras el sistema consolida nuevas evidencias."
              eyebrow="Procesando"
              icon={<Clock3 aria-hidden="true" className="h-5 w-5" />}
              title="Normalizando contexto"
              tone="info"
            />
            <UxaBlockedState
              actions={<UxaButton size="sm">Resolver autoridad</UxaButton>}
              description="La aprobacion requiere confirmar quien puede decidir sobre el canal de escalamiento."
              eyebrow="Bloqueante"
              icon={<AlertCircle aria-hidden="true" className="h-5 w-5" />}
              title="Falta una decision humana"
            />
            <UxaEmptyState
              description="Las fuentes aprobadas apareceran aqui con origen, fecha y responsable."
              eyebrow="Sin evidencia"
              icon={<MessageSquareText aria-hidden="true" className="h-5 w-5" />}
              title="Aun no hay registros"
            />
            <UxaEvidenceCard
              actions={<UxaButton size="sm" variant="secondary">Ver detalle</UxaButton>}
              description="Fuente aprobada y disponible para trazabilidad."
              eyebrow="Evidencia E-02"
              title="Politica de escalamiento"
            >
              <p className="text-[var(--uxa-font-size-small)] text-[var(--uxa-color-ink-soft)]">
                Responsable: Operaciones · Actualizada hoy
              </p>
            </UxaEvidenceCard>
            <UxaActionCard
              actions={<UxaButton size="sm">Continuar</UxaButton>}
              description="Usa la version aprobada como fuente de verdad para iniciar la siguiente etapa."
              title="Continuar a Definir"
            />
            <div className="overflow-hidden rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-white">
              <UxaDrawerHeader
                description="Una cabecera compacta mantiene contexto y cierre accesible."
                eyebrow="Atencion"
                onClose={() => undefined}
                title="Decision requerida"
                titleId="foundation-drawer-title"
              />
            </div>
          </section>

          <UxaSurface className="overflow-hidden p-[var(--uxa-space-5)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <UxaBadge tone="warning">Accion principal</UxaBadge>
                <h2 className="mt-3 text-[var(--uxa-font-size-screen-title)] font-black text-[var(--uxa-color-ink)]">
                  Resolver autoridad antes de aprobar Diseno
                </h2>
                <p className="mt-2 max-w-2xl text-[14px] leading-7 text-[var(--uxa-color-ink-soft)]">
                  El blocker se presenta en el contexto de la etapa y en la bandeja flotante de Atencion. La informacion generada queda debajo, sin competir con la tarea actual.
                </p>
              </div>
              <UxaButton size="lg">Responder pregunta</UxaButton>
            </div>
            <div className="mt-[var(--uxa-space-5)]">
              <UxaProcessingStrip label="Progreso de procesamiento por pasos" value={68} />
              <p className="mt-2 text-[12px] font-bold text-[var(--uxa-color-ink-soft)]">
                Paso actual: consolidando decisiones aprobadas. Siguiente: regenerar propuesta de herramientas.
              </p>
            </div>
          </UxaSurface>

          <section aria-labelledby="foundation-components-title" className="grid gap-[var(--uxa-space-4)] lg:grid-cols-2">
            <UxaSurface className="p-[var(--uxa-space-5)]">
              <h2 className="text-[20px] font-black" id="foundation-components-title">
                Componentes criticos
              </h2>
              <div className="mt-5 flex flex-wrap gap-3">
                <UxaButton>Primaria</UxaButton>
                <UxaButton variant="secondary">Secundaria</UxaButton>
                <UxaButton variant="ghost">Consulta</UxaButton>
                <UxaButton variant="danger">Bloqueante</UxaButton>
              </div>
              <div className="uxa-stage-action-strip mt-5">
                <UxaButton variant="secondary">Guardar borrador</UxaButton>
                <UxaButton>Continuar a Definir</UxaButton>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <UxaTextField hint="Debe ser claro y accionable." label="Objetivo de etapa" defaultValue="Aprobar arquitectura del agente" />
                <UxaTextField error="Define owner antes de continuar." label="Responsable" defaultValue="" />
              </div>
              <div className="mt-4">
                <UxaTextareaField
                  defaultValue="El agente debe consultar conocimiento aprobado, proponer respuesta y escalar si existe contradiccion."
                  hint="Campo persistente, con label visible y descripcion asociada."
                  label="Regla de comportamiento"
                />
              </div>
            </UxaSurface>

            <UxaSurface className="p-[var(--uxa-space-5)]">
              <h2 className="text-[20px] font-black">Estados normalizados</h2>
              <div className="mt-5 grid gap-3">
                {stateCards.map((item) => {
                  const Icon = item.icon;
                  return (
                    <article className="rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-border)] p-4" key={item.label}>
                      <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--uxa-radius-md)] bg-[var(--uxa-color-brand-soft)] text-[var(--uxa-color-brand)]">
                          <Icon aria-hidden="true" className="h-5 w-5" />
                        </span>
                        <div>
                          <UxaBadge tone={item.tone}>{item.label}</UxaBadge>
                          <p className="mt-2 text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">{item.text}</p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </UxaSurface>
          </section>

          <UxaStickyActionBar label="Acciones persistentes de la etapa">
            <div>
              <p className="text-[13px] font-black text-[var(--uxa-color-ink)]">Siguiente accion recomendada</p>
              <p className="mt-1 text-[12px] text-[var(--uxa-color-ink-soft)]">
                Resolver Q-14 para desbloquear aprobacion de Diseno.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <UxaButton variant="secondary">Guardar revision</UxaButton>
              <UxaButton>Continuar</UxaButton>
            </div>
          </UxaStickyActionBar>
        </main>

      </div>
    </div>
  );
}
