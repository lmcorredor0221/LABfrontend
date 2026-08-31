"use client";

import { useState, type ReactNode } from "react";
import { AlertTriangle, ArrowDown, ArrowRight, ChevronLeft, ChevronRight, Check, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

type Currency = "COP" | "USD";
type Tone = "blue" | "green" | "amber" | "slate";

export type EstimateRoiHifiScenario = {
  automation: number;
  cta: string;
  description: string;
  duration: number;
  human: number;
  key: string;
  label: string;
  metrics?: Array<{ label: string; value: string }>;
  recommended?: boolean;
  savings: number;
  totalCostCop: number;
  totalHours: number;
};

export type EstimateRoiHifiMockupProps = {
  currency?: Currency;
  embedded?: boolean;
  isStale?: boolean;
  onCurrencyChange?: (currency: Currency) => void;
  onRefresh?: () => void;
  onScenarioCta?: (scenarioKey: string) => void;
  scenarioCtaBusy?: boolean;
  scenarios?: EstimateRoiHifiScenario[];
  trm?: number;
};

type Scenario = EstimateRoiHifiScenario;

const TRM = 3123;

const SCENARIOS: Scenario[] = [
  {
    automation: 0,
    cta: "Solo referencia",
    description: "Equipo humano construye de forma tradicional; sirve como linea base para comparar Blueprint, ACP y tooling agentico.",
    duration: 2.8,
    human: 100,
    key: "traditional",
    label: "Desarrollo tradicional",
    savings: 0,
    totalCostCop: 49916213,
    totalHours: 317,
  },
  {
    automation: 18,
    cta: "Ver Blueprint Basico",
    description: "Producto de entrada: genera el diseno inicial, infiere, registra supuestos y continua con costo computacional controlado.",
    duration: 2,
    human: 82,
    key: "blueprint_basic",
    label: "Blueprint Basico",
    savings: 26,
    totalCostCop: 36984949,
    totalHours: 235,
  },
  {
    automation: 32,
    cta: "Mejorar Blueprint",
    description: "Blueprint enriquecido: resuelve decisiones relevantes y reconcilia solo los entregables afectados por dependencias.",
    duration: 1.6,
    human: 68,
    key: "blueprint_premium",
    label: "Blueprint Premium",
    savings: 39,
    totalCostCop: 30521423,
    totalHours: 194,
  },
  {
    automation: 45,
    cta: "Comparar alternativa",
    description: "Herramientas agenticas asisten la construccion tomando el Blueprint como insumo principal.",
    duration: 1.5,
    human: 55,
    key: "agentic_blueprint",
    label: "Agentic + Blueprint",
    savings: 43,
    totalCostCop: 28186087,
    totalHours: 178,
  },
  {
    automation: 30,
    cta: "Explorar implementacion",
    description: "Equipo humano implementa desde el ACP sin redescubrir ni redisenar la solucion.",
    duration: 1.9,
    human: 70,
    key: "acp_manual",
    label: "ACP + equipo humano",
    savings: 22,
    totalCostCop: 35916904,
    totalHours: 228,
  },
  {
    automation: 72,
    cta: "Explorar esta alternativa",
    description: "ACP como especificacion estructurada y herramientas agenticas para ejecutar gran parte del trabajo bajo supervision humana.",
    duration: 1.3,
    human: 28,
    key: "acp_agentic",
    label: "ACP + herramientas agenticas",
    recommended: true,
    savings: 52,
    totalCostCop: 23682182,
    totalHours: 149,
  },
  {
    automation: 65,
    cta: "Solicitar acompanamiento",
    description: "Nosotros podemos desarrollarlo por ustedes. El tiempo adicional contempla alineacion con infraestructura, sincronizacion y conocimiento de herramientas entregadas por el cliente. Si desean que tambien desarrollemos herramientas externas, se cotiza aparte.",
    duration: 2.8,
    human: 35,
    key: "factory",
    label: "Hagalo con nosotros",
    savings: 22,
    totalCostCop: 18485219,
    totalHours: 247,
  },
];

const TECHNICAL_METRICS = [
  { key: "blueprint", label: "Blueprint", suffix: "%", value: 81 },
  { key: "confidence", label: "Confianza", suffix: "%", value: 88 },
  { key: "design", label: "Gaps diseno", suffix: "", value: 0 },
  { key: "implementation", label: "Gaps implementacion", suffix: "", value: 0 },
  { key: "residual", label: "Residual", suffix: "%", value: 30 },
];

const OFFER_KEYS = ["blueprint_basic", "blueprint_premium", "acp_agentic", "factory"] as const;

const OFFER_COPY: Record<(typeof OFFER_KEYS)[number], {
  cta: string;
  price: string;
  subtitle: string;
  title: string;
  value: string;
}> = {
  blueprint_basic: {
    cta: "Ver Blueprint Basico",
    price: "Gratis",
    subtitle: "Entrada de bajo costo",
    title: "Blueprint",
    value: "Visualiza el diseno inicial, supuestos y oportunidad de ahorro sin bloquear el flujo.",
  },
  blueprint_premium: {
    cta: "Comprar por $49 USD",
    price: "$49 USD",
    subtitle: "Documento profesional",
    title: "Blueprint Pro",
    value: "Descarga el Blueprint profesional y enriquece decisiones relevantes con reconciliacion selectiva de entregables.",
  },
  acp_agentic: {
    cta: "Desbloquear por $149 USD",
    price: "$149 USD",
    subtitle: "Maximo ahorro",
    title: "Blueprint Pro + ACP",
    value: "Incluye el paquete portable de construccion para ejecutar con herramientas agenticas.",
  },
  factory: {
    cta: "Solicitar propuesta",
    price: "Cotizacion",
    subtitle: "Fabrica de desarrollo",
    title: "Fabrica",
    value: "Nosotros lo construimos con el ACP; herramientas externas o legacy se cotizan aparte.",
  },
};

function money(valueCop: number, currency: Currency, trmRate = TRM) {
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      currency: "USD",
      maximumFractionDigits: 0,
      style: "currency",
    }).format(valueCop / trmRate);
  }

  return new Intl.NumberFormat("es-CO", {
    currency: "COP",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(valueCop);
}

function shortMoney(valueCop: number, currency: Currency, trmRate = TRM) {
  if (currency === "USD") {
    return money(valueCop, "USD", trmRate);
  }

  const millions = valueCop / 1000000;
  return `$${millions.toLocaleString("es-CO", { maximumFractionDigits: 1 })} M`;
}

function weeks(value: number) {
  return `${value.toLocaleString("es-CO", { maximumFractionDigits: 1 })} sem`;
}

function hours(value: number) {
  const rounded = Number.isFinite(value) ? Math.round(value) : 0;
  return `${rounded.toLocaleString("es-CO")} h`;
}

function Badge({ children, tone = "slate", compact = false }: { children: ReactNode; tone?: Tone; compact?: boolean }) {
  return (
    <span
      className={cn(
        compact
          ? "inline-flex max-w-full min-h-5 items-center gap-1 rounded-full border px-1.5 py-0.5 text-center text-[clamp(8px,0.5rem+0.1vw,10px)] font-black uppercase leading-[1.15] tracking-[0.1em]"
          : "inline-flex max-w-full min-h-6 items-center gap-1 rounded-full border px-2 py-1 text-center text-[clamp(9px,0.58rem+0.12vw,11px)] font-black uppercase leading-[1.2] tracking-[0.11em]",
        tone === "blue" && "border-blue-100 bg-blue-50 text-blue-800",
        tone === "green" && "border-emerald-100 bg-emerald-50 text-emerald-800",
        tone === "amber" && "border-amber-100 bg-amber-50 text-amber-800",
        tone === "slate" && "border-slate-200 bg-slate-100 text-slate-600",
      )}
    >
      {children}
    </span>
  );
}

function CurrencySwitch({ currency, onChange }: { currency: Currency; onChange: (currency: Currency) => void }) {
  return (
    <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm" aria-label="Selector de moneda">
      {(["COP", "USD"] as const).map((item) => (
        <button
          className={cn(
            "rounded-full px-3 py-1 text-[12px] font-black transition",
            currency === item ? "bg-blue-800 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
          )}
          key={item}
          onClick={() => onChange(item)}
          type="button"
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function InlineAlert({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <div className="flex min-h-11 flex-wrap items-center justify-between gap-3 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-2 text-slate-700">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700" />
        <p className="min-w-0 text-[13px] leading-5">
          <span className="font-black text-amber-900">Actualizacion disponible:</span> el Blueprint cambio y puede ajustar la estimacion.
        </p>
      </div>
      <button className="inline-flex h-8 shrink-0 items-center gap-2 rounded-full border border-amber-200 bg-white px-3 text-[12px] font-black text-amber-900 transition hover:bg-amber-100" onClick={onRefresh} type="button">
        <RefreshCcw className="h-3.5 w-3.5" />
        Actualizar
      </button>
    </div>
  );
}

function OfferMetric({ label, value, dense = false }: { label: string; value: string; dense?: boolean }) {
  return (
    <div className={cn(
      "min-w-0 rounded-[14px] border border-slate-200 bg-white/75",
      dense ? "min-h-9 rounded-[11px] px-1 py-1" : "min-h-12 px-2 py-1.5",
    )}>
      <p className={cn(
        "min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-black uppercase text-slate-500",
        dense ? "text-[8px] leading-3 tracking-[0.08em]" : "text-[clamp(8px,0.5rem+0.12vw,9px)] leading-3 tracking-[0.12em]",
      )} title={label}>
        {label}
      </p>
      <p className={cn(
        "min-w-0 max-w-full whitespace-nowrap font-black leading-[1.15] text-slate-950 [font-variant-numeric:tabular-nums]",
        dense ? "mt-0.5 text-[clamp(10px,0.55rem+0.1vw,11px)] tracking-[-0.04em]" : "mt-1 text-[clamp(12px,0.8rem+0.16vw,15px)] tracking-[-0.02em]",
      )} title={value}>
        {value}
      </p>
    </div>
  );
}

function getComparisonMetrics(scenario: Scenario, currency: Currency, trm: number) {
  if (scenario.metrics?.length) {
    return scenario.metrics;
  }

  return [
    { label: "Costo", value: shortMoney(scenario.totalCostCop, currency, trm) },
    { label: "Horas", value: hours(scenario.totalHours) },
    { label: "Tiempo", value: weeks(scenario.duration) },
  ];
}

function ComparisonScenarioCard({
  currency,
  eyebrow,
  scenario,
  tone,
  trm,
}: {
  currency: Currency;
  eyebrow: string;
  scenario: Scenario;
  tone: "base" | "selected";
  trm: number;
}) {
  const metrics = getComparisonMetrics(scenario, currency, trm);

  return (
    <div className={cn(
      "min-w-0 rounded-[15px] border p-2.5",
      tone === "selected" ? "border-emerald-100 bg-emerald-50" : "border-transparent bg-slate-50",
    )}>
      <div className="min-w-0">
        <p className={cn(
          "text-[9px] font-black uppercase tracking-[0.14em]",
          tone === "selected" ? "text-emerald-700" : "text-slate-500",
        )}>
          {eyebrow}
        </p>
        <h3 className="mt-1 min-w-0 break-words text-[clamp(12px,0.7rem+0.12vw,14px)] font-black leading-[1.15] text-slate-950 [overflow-wrap:anywhere]">
          {scenario.label}
        </h3>
      </div>

      <dl className="mt-2 grid min-w-0 gap-1.5">
        {metrics.map((metric) => (
          <div className="min-w-0 rounded-[10px] border border-slate-200/80 bg-white/80 px-2 py-1.5" key={`${scenario.key}-${metric.label}`}>
            <dt className="break-words text-[9px] font-black uppercase leading-3 tracking-[0.1em] text-slate-500 [overflow-wrap:anywhere]">
              {metric.label}
            </dt>
            <dd className="mt-0.5 break-words text-[clamp(12px,0.72rem+0.12vw,14px)] font-black leading-[1.15] text-slate-950 [font-variant-numeric:tabular-nums] [overflow-wrap:anywhere]">
              {metric.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function OfferCarouselSummary({
  currency,
  traditional,
}: {
  currency: Currency;
  traditional: Scenario;
}) {
  const offers = OFFER_KEYS.map((key) => {
    const scenario = SCENARIOS.find((item) => item.key === key);
    if (!scenario) {
      throw new Error(`Missing scenario for offer ${key}`);
    }
    return {
      ...OFFER_COPY[key],
      scenario,
    };
  });
  const recommendedIndex = offers.findIndex((offer) => offer.scenario.recommended);
  const [activeIndex, setActiveIndex] = useState(recommendedIndex >= 0 ? recommendedIndex : 0);
  const activeOffer = offers[activeIndex] ?? offers[0];
  const activeScenario = activeOffer.scenario;
  const savingsCop = Math.max(0, traditional.totalCostCop - activeScenario.totalCostCop);
  const reducedHours = Math.max(0, traditional.totalHours - activeScenario.totalHours);

  const move = (direction: -1 | 1) => {
    setActiveIndex((current) => (current + direction + offers.length) % offers.length);
  };

  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
        <div>
          <Badge tone="blue">Resumen de la estimacion</Badge>
          <h2 className="mt-2 text-[22px] font-black tracking-[-0.03em] text-slate-950">Elige como convertir el Blueprint en ahorro real</h2>
          <p className="mt-1 max-w-3xl text-[13px] leading-5 text-slate-600">
            Un carrusel comercial muestra las 4 rutas disponibles. La comparativa usa la misma linea base tradicional y cambia segun la oferta seleccionada.
          </p>
        </div>
        <Badge tone="green">TRM {TRM.toLocaleString("es-CO")}</Badge>
      </div>

      <div className="grid gap-0 border-t border-slate-200 lg:grid-cols-[0.95fr_1.35fr]">
        <article className="relative overflow-hidden border-b border-slate-200 bg-slate-950 p-5 text-white lg:border-b-0 lg:border-r">
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -bottom-24 left-10 h-52 w-52 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={activeScenario.recommended ? "green" : "blue"}>{activeOffer.subtitle}</Badge>
              <span className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/80">
                {activeOffer.price}
              </span>
            </div>
            <h3 className="mt-4 text-[clamp(28px,4vw,44px)] font-black leading-[0.95] tracking-[-0.06em]">
              {activeOffer.title}
            </h3>
            <p className="mt-3 max-w-xl text-[14px] leading-6 text-slate-200">{activeOffer.value}</p>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <OfferMetric label="Ahorro potencial" value={shortMoney(savingsCop, currency, TRM)} />
              <OfferMetric label="Reduccion" value={`${activeScenario.savings}% / ${hours(reducedHours)}`} />
              <OfferMetric label="Costo estimado" value={shortMoney(activeScenario.totalCostCop, currency, TRM)} />
              <OfferMetric label="Duracion" value={weeks(activeScenario.duration)} />
            </div>

            <button className="group mt-5 inline-flex min-h-10 items-center rounded-[14px] bg-white px-4 text-[13px] font-black text-slate-950 shadow-[0_16px_34px_rgba(15,23,42,0.24)] transition hover:bg-blue-50" type="button">
              {activeOffer.cta}
              <ArrowRight className="ml-2 h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </button>
          </div>
        </article>

        <div className="min-w-0 bg-gradient-to-br from-white via-slate-50 to-blue-50/40 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Carrusel de ofertas</p>
              <h3 className="mt-1 text-[18px] font-black tracking-[-0.03em] text-slate-950">Blueprint â†’ Pro â†’ ACP â†’ Fabrica</h3>
            </div>
            <div className="flex items-center gap-2">
              <button className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-800" onClick={() => move(-1)} type="button" aria-label="Oferta anterior">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-800" onClick={() => move(1)} type="button" aria-label="Oferta siguiente">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,0.92fr)_auto_minmax(0,0.92fr)] md:items-center">
            <div className="rounded-[18px] border border-slate-200 bg-white p-3">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Linea base</p>
              <p className="mt-1 text-[14px] font-black text-slate-950">Desarrollo tradicional</p>
              <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(min(100%,4.875rem),1fr))] gap-2">
                <OfferMetric label="Costo" value={shortMoney(traditional.totalCostCop, currency, TRM)} />
                <OfferMetric label="Horas" value={hours(traditional.totalHours)} />
                <OfferMetric label="Tiempo" value={weeks(traditional.duration)} />
              </div>
            </div>
            <span className="mx-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm">
              <ArrowRight className="hidden h-4 w-4 md:block" />
              <ArrowDown className="h-4 w-4 md:hidden" />
            </span>
            <div className="rounded-[18px] border border-emerald-100 bg-emerald-50 p-3">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">Oferta seleccionada</p>
              <p className="mt-1 text-[14px] font-black text-emerald-950">{activeOffer.title}</p>
              <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(min(100%,4.875rem),1fr))] gap-2">
                <OfferMetric label="Costo" value={shortMoney(activeScenario.totalCostCop, currency, TRM)} />
                <OfferMetric label="Horas" value={hours(activeScenario.totalHours)} />
                <OfferMetric label="Tiempo" value={weeks(activeScenario.duration)} />
              </div>
            </div>
          </div>

          <div className="-mx-1 mt-4 flex snap-x gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
            {offers.map((offer, index) => (
              <button
                className={cn(
                  "min-w-[220px] flex-1 snap-start rounded-[18px] border bg-white p-3 text-left transition",
                  index === activeIndex
                    ? "border-blue-700 shadow-[0_14px_28px_rgba(30,64,175,0.14)]"
                    : "border-slate-200 hover:border-blue-200 hover:bg-blue-50/40",
                )}
                key={offer.scenario.key}
                onClick={() => setActiveIndex(index)}
                type="button"
              >
                <div className="flex items-start justify-between gap-2">
                  <Badge tone={offer.scenario.recommended ? "green" : "slate"}>{offer.price}</Badge>
                  <span className={cn("h-2.5 w-2.5 rounded-full", index === activeIndex ? "bg-blue-800" : "bg-slate-200")} />
                </div>
                <p className="mt-3 text-[15px] font-black leading-5 text-slate-950">{offer.title}</p>
                <p className="mt-1 overflow-hidden text-[12px] leading-5 text-slate-600 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">{offer.scenario.description}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-[12px] font-black text-emerald-800">{offer.scenario.savings}% ahorro</span>
                  <span className="text-[12px] font-semibold text-slate-500">{hours(offer.scenario.totalHours)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CommercialOfferCarousel({
  currency,
  onScenarioCta,
  scenarioCtaBusy = false,
  scenarios = SCENARIOS,
  traditional,
  trm = TRM,
}: {
  currency: Currency;
  onScenarioCta?: (scenarioKey: string) => void;
  scenarioCtaBusy?: boolean;
  scenarios?: Scenario[];
  traditional: Scenario;
  trm?: number;
}) {
  const offers = OFFER_KEYS.map((key) => {
    const scenario = scenarios.find((item) => item.key === key);
    if (!scenario) {
      throw new Error(`Missing scenario for offer ${key}`);
    }
    return {
      ...OFFER_COPY[key],
      scenario,
    };
  });
  const recommendedIndex = offers.findIndex((offer) => offer.scenario.recommended);
  const [activeIndex, setActiveIndex] = useState(recommendedIndex >= 0 ? recommendedIndex : 0);
  const activeOffer = offers[activeIndex] ?? offers[0];
  const activeScenario = activeOffer.scenario;
  const savingsCop = Math.max(0, traditional.totalCostCop - activeScenario.totalCostCop);
  const reducedHours = Math.max(0, traditional.totalHours - activeScenario.totalHours);

  function move(direction: -1 | 1) {
    setActiveIndex((current) => (current + direction + offers.length) % offers.length);
  }

  return (
    <section className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Badge tone="blue">Resumen de la estimacion</Badge>
          <h2 className="mt-1.5 text-[20px] font-black tracking-[-0.03em] text-slate-950">LAB encontro una oportunidad concreta de ahorro</h2>
          <p className="mt-1 max-w-3xl text-[12px] leading-4.5 text-slate-600">
            Explora las 4 rutas comerciales con la misma linea base. Cada opcion actualiza ahorro, costo, tiempo y siguiente paso sin cambiar de contexto.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge tone="green">TRM {trm.toLocaleString("es-CO")}</Badge>
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-white p-1 shadow-sm">
            <button
              aria-label="Oferta anterior"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-blue-800"
              onClick={() => move(-1)}
              type="button"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-10 text-center text-[12px] font-black text-slate-600">
              {activeIndex + 1}/{offers.length}
            </span>
            <button
              aria-label="Oferta siguiente"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-blue-800"
              onClick={() => move(1)}
              type="button"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 xl:items-stretch xl:grid-cols-[0.9fr_1.15fr_0.95fr]">
        <article className="grid min-w-0 content-center gap-3 rounded-[20px] border border-slate-200 bg-white p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Potencial identificado</p>
          <div className="grid gap-2">
            <p className="whitespace-nowrap text-[clamp(1.75rem,3vw,2.35rem)] font-black leading-[1] tracking-[-0.06em] text-slate-950 [font-variant-numeric:tabular-nums]">
              {shortMoney(savingsCop, currency, trm)}
            </p>
            <p className="max-w-[34ch] text-[12px] leading-5 text-slate-600">Ahorro estimado frente al desarrollo tradicional.</p>
          </div>
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-[16px] border border-emerald-100 bg-emerald-50/80 px-3 py-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-emerald-800 shadow-sm">
              <ArrowDown className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[15px] font-black leading-5 text-emerald-900">{activeScenario.savings}% menos</p>
              <p className="truncate text-[11.5px] font-semibold text-emerald-800/80" title={`${hours(reducedHours)} potencialmente reducidas`}>
                {hours(reducedHours)} potencialmente reducidas
              </p>
            </div>
          </div>
        </article>

        <article className="min-w-0 rounded-[20px] border border-slate-200 bg-white p-3 xl:flex xl:h-full xl:flex-col">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Comparacion base</p>
            <span className="text-[10px] font-semibold text-slate-400">A → B</span>
          </div>
          <div className="mt-2 grid min-w-0 flex-1 content-center gap-2 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-stretch">
            <ComparisonScenarioCard currency={currency} eyebrow="Escenario A · Base" scenario={traditional} tone="base" trm={trm} />
            <div className="flex items-center justify-center gap-1.5 px-1 text-slate-400" aria-label={`Comparacion de ${traditional.label} a ${activeScenario.label}`}>
              <span className="hidden h-px w-4 bg-slate-200 md:block" />
              <ArrowRight className="hidden h-4 w-4 shrink-0 md:block" aria-hidden="true" />
              <ArrowDown className="h-4 w-4 shrink-0 md:hidden" aria-hidden="true" />
              <span className="hidden h-px w-4 bg-slate-200 md:block" />
            </div>
            <ComparisonScenarioCard currency={currency} eyebrow="Escenario B · Seleccionado" scenario={activeScenario} tone="selected" trm={trm} />
          </div>
        </article>

        <article className={cn("grid min-w-0 content-center gap-2.5 rounded-[18px] border p-3.5", activeScenario.recommended ? "border-blue-100 bg-blue-50/65" : "border-slate-200 bg-slate-50")}>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge compact tone={activeScenario.recommended ? "green" : "blue"}>{activeOffer.subtitle}</Badge>
            <Badge compact tone="slate">{activeOffer.price}</Badge>
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-800">Alternativa sugerida</p>
            <h3 className="mt-1 text-[clamp(18px,1.35vw,21px)] font-black leading-tight tracking-[-0.04em] text-slate-950">{activeOffer.title}</h3>
            <p className="mt-1 text-[11.5px] leading-4.5 text-slate-700">{activeOffer.value}</p>
          </div>
          <div className="grid grid-cols-3 gap-1.5 rounded-[14px] border border-white/70 bg-white/70 p-1.5">
            <OfferMetric dense label="Ahorro" value={`${activeScenario.savings}%`} />
            <OfferMetric dense label="Horas" value={hours(activeScenario.totalHours)} />
            <OfferMetric dense label="Costo" value={shortMoney(activeScenario.totalCostCop, currency, trm)} />
          </div>
          <button
            className="group inline-flex min-h-8 w-fit max-w-full items-center rounded-[11px] bg-blue-800 px-3 text-[12px] font-black text-white shadow-[0_10px_20px_rgba(30,64,175,0.18)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={scenarioCtaBusy}
            onClick={() => onScenarioCta?.(activeScenario.key)}
            type="button"
          >
            {scenarioCtaBusy ? "Preparando..." : activeOffer.cta}
            <ArrowRight className="ml-1.5 h-3 w-3 transition group-hover:translate-x-0.5" />
          </button>
        </article>
      </div>

      <div className="mt-3 rounded-[18px] border border-slate-200 bg-slate-50/80 p-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Carrusel comercial</p>
            <p className="text-[11px] text-slate-600">Selecciona una oferta para recalcular la comparativa sin abrir otra pantalla.</p>
          </div>
          <div className="flex gap-1.5" role="tablist" aria-label="Ofertas comerciales">
            {offers.map((offer, index) => (
              <button
                aria-label={`Ver oferta ${offer.title}`}
                aria-selected={index === activeIndex}
                className={cn("h-2.5 rounded-full transition-all", index === activeIndex ? "w-8 bg-blue-800" : "w-2.5 bg-slate-300 hover:bg-slate-400")}
                key={offer.scenario.key}
                onClick={() => setActiveIndex(index)}
                role="tab"
                type="button"
              />
            ))}
          </div>
        </div>
        <div className="-mx-1 mt-2 flex snap-x gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:thin]">
          {offers.map((offer, index) => (
            <button
              className={cn(
                "min-w-[210px] flex-1 snap-start rounded-[16px] border bg-white p-2 text-left transition",
                index === activeIndex
                  ? "border-blue-700 shadow-[0_14px_26px_rgba(30,64,175,0.14)]"
                  : "border-slate-200 hover:border-blue-200 hover:bg-blue-50/50",
              )}
              key={offer.scenario.key}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              <div className="flex items-center justify-between gap-1.5">
                <Badge compact tone={offer.scenario.recommended ? "green" : "slate"}>{offer.price}</Badge>
                {offer.scenario.recommended ? <Badge compact tone="green">Maximo ahorro</Badge> : null}
              </div>
              <p className="mt-1.5 text-[14px] font-black leading-4 text-slate-950">{offer.title}</p>
              <p className="mt-0.5 overflow-hidden text-[10.5px] leading-[0.875rem] text-slate-600 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">{offer.value}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="whitespace-nowrap font-black text-emerald-800">{offer.scenario.savings}% ahorro</span>
                <span className="whitespace-nowrap font-semibold text-slate-500">{shortMoney(offer.scenario.totalCostCop, currency, trm)}</span>
                <span className="whitespace-nowrap font-semibold text-slate-500">{hours(offer.scenario.totalHours)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function MaturityPath() {
  const steps = [
    { caption: "Diseno inicial", key: "blueprint", label: "Blueprint", state: "done" },
    { caption: "Mayor definicion", key: "pro", label: "Blueprint Pro", state: "next" },
    { caption: "Paquete de construccion", key: "acp", label: "ACP", state: "target" },
  ];

  return (
    <section className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[12px] font-black uppercase tracking-[0.16em] text-slate-500">Recorrido comercial</p>
        <a className="text-[12px] font-black text-blue-800 hover:text-blue-700" href="#comparativa">
          Comparar alternativas <ArrowDown className="inline h-3.5 w-3.5" />
        </a>
      </div>
      <ol className="mt-3 grid gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
        {steps.map((step, index) => (
          <li className="contents" key={step.key}>
            <div className="flex items-center gap-3 rounded-[15px] border border-slate-200 bg-slate-50 px-3 py-2">
              <span className={cn("inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-black", step.state === "done" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800")}>
                {step.state === "done" ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-black text-slate-950">{step.label}</p>
                <p className="text-[11.5px] text-slate-500">{step.caption}</p>
              </div>
            </div>
            {index < steps.length - 1 ? <div className="hidden h-px bg-slate-200 md:block" /> : null}
          </li>
        ))}
      </ol>
    </section>
  );
}

function ScenarioGrid({
  currency,
  onScenarioCta,
  scenarioCtaBusy = false,
  scenarios = SCENARIOS,
  trm = TRM,
}: {
  currency: Currency;
  onScenarioCta?: (scenarioKey: string) => void;
  scenarioCtaBusy?: boolean;
  scenarios?: Scenario[];
  trm?: number;
}) {
  return (
    <section className="rounded-[22px] border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]" id="comparativa">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div>
          <Badge tone="blue">Comparativa comercial</Badge>
          <h2 className="mt-1 text-[20px] font-black tracking-[-0.03em] text-slate-950">Enfoques de construccion</h2>
        </div>
        <p className="max-w-2xl text-[12.5px] leading-5 text-slate-600">Las cifras son referenciales y contemplan solo la construccion del agente. APIs externas, MCP, legacy, credenciales e integraciones de terceros quedan fuera de esta estimacion.</p>
      </div>

      <div className="grid grid-cols-[minmax(0,2.2fr)_70px_76px_120px_72px_70px_minmax(0,1fr)] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 max-xl:hidden">
        <span>Escenario</span>
        <span>Horas</span>
        <span>Duracion</span>
        <span>Costo</span>
        <span>Humano</span>
        <span>Ahorro</span>
        <span>Siguiente paso</span>
      </div>

      <div className="divide-y divide-slate-200">
        {scenarios.map((scenario) => (
          <article
            className={cn(
              "grid min-w-0 gap-3 px-4 py-3 max-xl:grid-cols-1 xl:grid-cols-[minmax(0,2.2fr)_70px_76px_120px_72px_70px_minmax(0,1fr)] xl:items-center",
              scenario.recommended && "bg-emerald-50/55",
            )}
            key={scenario.key}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={scenario.recommended ? "green" : "slate"}>{scenario.label}</Badge>
                {scenario.recommended ? <Badge tone="green">Recomendado</Badge> : null}
              </div>
              <p className="mt-2 max-w-[64ch] text-[12.5px] leading-5 text-slate-600">{scenario.description}</p>
            </div>
            <CompactDatum label="Horas" value={hours(scenario.totalHours)} />
            <CompactDatum label="Duracion" value={weeks(scenario.duration)} />
            <CompactDatum label="Costo" value={money(scenario.totalCostCop, currency, trm)} />
            <CompactDatum label="Humano" value={`${scenario.human}%`} />
            <CompactDatum label="Ahorro" value={`${scenario.savings}%`} />
            <div className="min-w-0">
              {scenario.key === "traditional" ? (
                <p className="overflow-hidden text-[12px] font-semibold leading-5 text-slate-500 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">{scenario.cta}</p>
              ) : (
                <button
                  className={cn(
                    "group inline-flex min-h-9 max-w-full items-center justify-center rounded-[12px] px-3 text-[12px] font-black transition disabled:cursor-not-allowed disabled:opacity-60",
                    scenario.recommended
                      ? "bg-blue-800 text-white shadow-[0_8px_18px_rgba(30,64,175,0.18)] hover:bg-blue-700"
                      : "border border-slate-200 bg-white text-slate-800 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800",
                  )}
                  disabled={scenarioCtaBusy}
                  onClick={() => onScenarioCta?.(scenario.key)}
                  type="button"
                >
                  <span className="min-w-0 overflow-hidden leading-4 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">{scenarioCtaBusy ? "Preparando..." : scenario.cta}</span>
                  <ArrowRight className="ml-2 h-3.5 w-3.5 shrink-0 transition group-hover:translate-x-0.5" />
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function CompactDatum({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="hidden text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 max-xl:block">{label}</p>
      <p className="max-w-full whitespace-nowrap text-[clamp(12px,0.72rem+0.12vw,13px)] font-black leading-5 text-slate-950 [font-variant-numeric:tabular-nums]">{value}</p>
    </div>
  );
}

function TechnicalState() {
  return (
    <section className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12.5px] text-slate-600">
        <span className="font-black text-slate-950">Estado del diseno:</span>
        {TECHNICAL_METRICS.map((metric) => (
          <span key={metric.key}>
            {metric.label} <strong className="text-slate-950">{metric.value}{metric.suffix}</strong>
          </span>
        ))}
        <details className="group ml-auto">
          <summary className="cursor-pointer list-none text-[12px] font-black text-blue-800 hover:text-blue-700">
            Ver detalle tecnico <ArrowDown className="inline h-3.5 w-3.5 transition group-open:rotate-180" />
          </summary>
          <p className="mt-2 max-w-3xl text-[12px] leading-5 text-slate-500">
            Los indicadores se calculan con cobertura, fit, confianza y bloqueos pendientes. La incertidumbre residual representa variacion esperada por cambios de alcance, ambiente, owner tecnico o condiciones internas.
          </p>
        </details>
      </div>
    </section>
  );
}

function Disclosures() {
  return (
    <section className="grid gap-3 lg:grid-cols-2">
      <details className="group rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[14px] font-black text-slate-950">
          Como calculamos esta estimacion
          <ArrowDown className="h-4 w-4 transition group-open:rotate-180" />
        </summary>
        <div className="mt-3 space-y-2 text-[12.5px] leading-5 text-slate-600">
          <p>Se usan los insumos aprobados del Blueprint, escenarios de construccion, cobertura de diseno, estimacion tradicional y alternativa agentica.</p>
          <p>Los costos se calculan con tarifas y referencias de mercado. La moneda visual puede alternar entre COP y USD sin alterar el modelo base.</p>
        </div>
      </details>
      <details className="group rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[14px] font-black text-slate-950">
          Alcance, supuestos y exclusiones
          <ArrowDown className="h-4 w-4 transition group-open:rotate-180" />
        </summary>
        <div className="mt-3 space-y-2 text-[12.5px] leading-5 text-slate-600">
          <p>Estas cifras son estimaciones referenciales basadas en estandares de mercado y en la informacion aprobada actualmente en el Blueprint.</p>
          <p>No incluye implementacion o modernizacion de APIs externas, servidores MCP, sistemas legacy, credenciales, owners de datos, aprobaciones de seguridad ni integraciones de terceros.</p>
        </div>
      </details>
    </section>
  );
}

function resolveScenarios(overrides: Scenario[] = []) {
  const overrideByKey = new Map(overrides.map((scenario) => [scenario.key, scenario]));
  return SCENARIOS.map((scenario) => ({ ...scenario, ...overrideByKey.get(scenario.key) }));
}

export function EstimateRoiHifiMockup({
  currency: controlledCurrency,
  embedded = false,
  isStale = true,
  onCurrencyChange,
  onRefresh,
  onScenarioCta,
  scenarioCtaBusy = false,
  scenarios: scenarioOverrides,
  trm = TRM,
}: EstimateRoiHifiMockupProps = {}) {
  const [localCurrency, setLocalCurrency] = useState<Currency>("COP");
  const currency = controlledCurrency ?? localCurrency;
  const scenarios = resolveScenarios(scenarioOverrides);
  const traditional = scenarios.find((scenario) => scenario.key === "traditional") ?? scenarios[0];
  const setCurrency = onCurrencyChange ?? setLocalCurrency;

  if (!traditional) {
    return null;
  }

  return (
    <main className={cn("text-slate-950", embedded ? "bg-transparent p-0" : "min-h-screen bg-slate-50 p-4 md:p-5")}>
      <div className={cn("space-y-3", embedded ? "max-w-none" : "mx-auto max-w-[1360px]")}>
        <header className="rounded-[22px] border border-slate-200 bg-white px-5 py-4 shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-800">Lean Agent Builder</p>
              <h1 className="mt-1 text-[clamp(24px,3vw,28px)] font-black tracking-[-0.04em] text-slate-950">Estimacion, valor, costo y ROI</h1>
              <p className="mt-1 max-w-3xl text-[13px] leading-5 text-slate-600">
                Analisis comercial del Blueprint con escenarios de construccion, ahorro potencial y siguiente alternativa de valor.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={isStale ? "amber" : "green"}>{isStale ? "Blueprint desactualizado" : "Blueprint listo"}</Badge>
              <CurrencySwitch currency={currency} onChange={setCurrency} />
            </div>
          </div>
        </header>

        {isStale ? <InlineAlert onRefresh={onRefresh} /> : null}

        <CommercialOfferCarousel
          currency={currency}
          onScenarioCta={onScenarioCta}
          scenarioCtaBusy={scenarioCtaBusy}
          scenarios={scenarios}
          traditional={traditional}
          trm={trm}
        />

        <MaturityPath />

        <ScenarioGrid
          currency={currency}
          onScenarioCta={onScenarioCta}
          scenarioCtaBusy={scenarioCtaBusy}
          scenarios={scenarios}
          trm={trm}
        />

        <TechnicalState />

        <Disclosures />
      </div>
    </main>
  );
}
