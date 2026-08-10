"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Command,
  FileText,
  FolderKanban,
  Gauge,
  Layers3,
  Menu,
  MoreHorizontal,
  Network,
  PanelRightOpen,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import styles from "./visual-proposals-lab.module.css";

type Proposal = {
  id: string;
  name: string;
  mode: "light" | "dark";
  concept: string;
  message: string;
  canvas: string;
  surface: string;
  sidebar: string;
  panel: string;
  text: string;
  muted: string;
  border: string;
  primary: string;
  primaryForeground: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  radius: string;
  shadow: string;
  atmosphere: string;
  displayFont: string;
  bodyFont: string;
  density: "airy" | "balanced" | "dense";
};

const PROPOSALS: Proposal[] = [
  {
    id: "enterprise-corporate",
    name: "Enterprise Corporate",
    mode: "light",
    concept: "Control plane sobrio para equipos que necesitan confianza, trazabilidad y jerarquía clara.",
    message: "La automatización es gobernable.",
    canvas: "#F1F5F9",
    surface: "#FFFFFF",
    sidebar: "#0F172A",
    panel: "#F8FAFC",
    text: "#0F172A",
    muted: "#475569",
    border: "#CBD5E1",
    primary: "#1E40AF",
    primaryForeground: "#FFFFFF",
    accent: "#0284C7",
    success: "#166534",
    warning: "#92400E",
    danger: "#B91C1C",
    info: "#1D4ED8",
    radius: "8px",
    shadow: "0 12px 26px rgba(15, 23, 42, .08)",
    atmosphere: "radial-gradient(circle at 82% 0%, rgba(14, 165, 233, .16), transparent 34%)",
    displayFont: '"IBM Plex Sans", "Segoe UI", sans-serif',
    bodyFont: '"IBM Plex Sans", "Segoe UI", sans-serif',
    density: "dense",
  },
  {
    id: "minimal-saas",
    name: "Minimal SaaS",
    mode: "light",
    concept: "Monocromo cálido, acción naranja y superficies casi planas para reducir ruido visual.",
    message: "Cada decisión tiene un siguiente paso.",
    canvas: "#F4F4F5",
    surface: "#FFFFFF",
    sidebar: "#18181B",
    panel: "#FAFAFA",
    text: "#18181B",
    muted: "#52525B",
    border: "#D4D4D8",
    primary: "#C2410C",
    primaryForeground: "#FFFFFF",
    accent: "#EA580C",
    success: "#166534",
    warning: "#92400E",
    danger: "#B91C1C",
    info: "#1D4ED8",
    radius: "10px",
    shadow: "0 4px 16px rgba(24, 24, 27, .06)",
    atmosphere: "linear-gradient(115deg, rgba(234, 88, 12, .09), transparent 40%)",
    displayFont: '"Geist", "Segoe UI", sans-serif',
    bodyFont: '"Geist", "Segoe UI", sans-serif',
    density: "balanced",
  },
  {
    id: "ai-workspace",
    name: "AI Workspace",
    mode: "light",
    concept: "Workspace claro con índigo como señal de inteligencia, contexto y procesamiento.",
    message: "La IA trabaja dentro de tu contexto.",
    canvas: "#F8F8FC",
    surface: "#FFFFFF",
    sidebar: "#FFFFFF",
    panel: "#F4F3FF",
    text: "#1E1B4B",
    muted: "#5B5A78",
    border: "#DDDDF0",
    primary: "#4338CA",
    primaryForeground: "#FFFFFF",
    accent: "#6366F1",
    success: "#166534",
    warning: "#92400E",
    danger: "#B91C1C",
    info: "#1D4ED8",
    radius: "12px",
    shadow: "0 14px 32px rgba(79, 70, 229, .11)",
    atmosphere: "radial-gradient(circle at 8% 2%, rgba(129, 140, 248, .18), transparent 30%)",
    displayFont: '"Sora", "Segoe UI", sans-serif',
    bodyFont: '"IBM Plex Sans", "Segoe UI", sans-serif',
    density: "airy",
  },
  {
    id: "modern-glass",
    name: "Modern Glass",
    mode: "light",
    concept: "Capas translúcidas sobre una atmósfera lavanda, con el contenido aún legible y operativo.",
    message: "El sistema se adapta sin perder claridad.",
    canvas: "#F3E8FF",
    surface: "rgba(255, 255, 255, .72)",
    sidebar: "rgba(255, 255, 255, .74)",
    panel: "rgba(255, 255, 255, .52)",
    text: "#2E1065",
    muted: "#5B21B6",
    border: "rgba(255, 255, 255, .7)",
    primary: "#6D28D9",
    primaryForeground: "#FFFFFF",
    accent: "#A855F7",
    success: "#166534",
    warning: "#92400E",
    danger: "#B91C1C",
    info: "#1D4ED8",
    radius: "18px",
    shadow: "0 18px 42px rgba(91, 33, 182, .16)",
    atmosphere: "radial-gradient(circle at 86% 8%, rgba(192, 132, 252, .6), transparent 33%), radial-gradient(circle at 15% 80%, rgba(125, 211, 252, .36), transparent 28%)",
    displayFont: '"Plus Jakarta Sans", "Segoe UI", sans-serif',
    bodyFont: '"Plus Jakarta Sans", "Segoe UI", sans-serif',
    density: "airy",
  },
  {
    id: "nordic-clean",
    name: "Nordic Clean",
    mode: "light",
    concept: "Papel cálido, contraste editorial y detalles ámbar para jornadas largas de lectura y revisión.",
    message: "El pensamiento complejo puede sentirse sereno.",
    canvas: "#FAFAF9",
    surface: "#FFFFFF",
    sidebar: "#F5F5F4",
    panel: "#F5F5F4",
    text: "#1C1917",
    muted: "#57534E",
    border: "#D6D3D1",
    primary: "#1C1917",
    primaryForeground: "#FFFFFF",
    accent: "#B45309",
    success: "#166534",
    warning: "#92400E",
    danger: "#B91C1C",
    info: "#1D4ED8",
    radius: "8px",
    shadow: "0 2px 0 rgba(28, 25, 23, .06)",
    atmosphere: "linear-gradient(140deg, rgba(245, 158, 11, .09), transparent 42%)",
    displayFont: '"Newsreader", Georgia, serif',
    bodyFont: '"IBM Plex Sans", "Segoe UI", sans-serif',
    density: "balanced",
  },
  {
    id: "material-next",
    name: "Material Next",
    mode: "light",
    concept: "Sistema accesible y amistoso: superficies crema, teal funcional y acentos coral medidos.",
    message: "La productividad también puede ser humana.",
    canvas: "#FFF8F0",
    surface: "#FFFFFF",
    sidebar: "#FFFDF9",
    panel: "#FFF1E4",
    text: "#292524",
    muted: "#57534E",
    border: "#E7D7C8",
    primary: "#0F766E",
    primaryForeground: "#FFFFFF",
    accent: "#EA580C",
    success: "#166534",
    warning: "#92400E",
    danger: "#B91C1C",
    info: "#1D4ED8",
    radius: "16px",
    shadow: "0 14px 28px rgba(120, 53, 15, .1)",
    atmosphere: "radial-gradient(circle at 12% 0%, rgba(251, 146, 60, .22), transparent 30%)",
    displayFont: '"Nunito Sans", "Segoe UI", sans-serif',
    bodyFont: '"Nunito Sans", "Segoe UI", sans-serif',
    density: "airy",
  },
  {
    id: "midnight-ai",
    name: "Midnight AI",
    mode: "dark",
    concept: "Obsidiana profunda con índigo eléctrico para un espacio de concentración y razonamiento.",
    message: "El contexto permanece cerca; el ruido queda fuera.",
    canvas: "#0E0E10",
    surface: "#18181B",
    sidebar: "#09090B",
    panel: "#202027",
    text: "#F4F4F5",
    muted: "#A1A1AA",
    border: "#30303A",
    primary: "#818CF8",
    primaryForeground: "#11111A",
    accent: "#A5B4FC",
    success: "#34D399",
    warning: "#FBBF24",
    danger: "#FB7185",
    info: "#60A5FA",
    radius: "12px",
    shadow: "0 18px 38px rgba(0, 0, 0, .34)",
    atmosphere: "radial-gradient(circle at 82% 0%, rgba(99, 102, 241, .22), transparent 30%)",
    displayFont: '"Sora", "Segoe UI", sans-serif',
    bodyFont: '"IBM Plex Sans", "Segoe UI", sans-serif',
    density: "balanced",
  },
  {
    id: "carbon-enterprise",
    name: "Carbon Enterprise",
    mode: "dark",
    concept: "Carbón técnico, bordes definidos y blanco de alta autoridad para operaciones empresariales.",
    message: "La operación está bajo control.",
    canvas: "#121214",
    surface: "#1E1E21",
    sidebar: "#0C0C0E",
    panel: "#26262A",
    text: "#FAFAFA",
    muted: "#A1A1AA",
    border: "#3F3F46",
    primary: "#F4F4F5",
    primaryForeground: "#18181B",
    accent: "#A1A1AA",
    success: "#4ADE80",
    warning: "#FACC15",
    danger: "#FB7185",
    info: "#93C5FD",
    radius: "10px",
    shadow: "0 12px 28px rgba(0, 0, 0, .36)",
    atmosphere: "linear-gradient(120deg, rgba(161, 161, 170, .08), transparent 45%)",
    displayFont: '"IBM Plex Sans", "Segoe UI", sans-serif',
    bodyFont: '"IBM Plex Sans", "Segoe UI", sans-serif',
    density: "dense",
  },
  {
    id: "deep-space",
    name: "Deep Space",
    mode: "dark",
    concept: "Azul noche y violetas tenues que dan profundidad sin convertir la interfaz en una demo de efectos.",
    message: "Explora el sistema completo desde una sola órbita.",
    canvas: "#070F1E",
    surface: "#0D1B2A",
    sidebar: "#050B16",
    panel: "#11263B",
    text: "#E2E8F0",
    muted: "#94A3B8",
    border: "#263B54",
    primary: "#A78BFA",
    primaryForeground: "#170F2D",
    accent: "#C4B5FD",
    success: "#34D399",
    warning: "#FBBF24",
    danger: "#FB7185",
    info: "#7DD3FC",
    radius: "16px",
    shadow: "0 18px 44px rgba(0, 0, 0, .42)",
    atmosphere: "radial-gradient(circle at 76% 10%, rgba(124, 58, 237, .3), transparent 30%), radial-gradient(circle at 5% 76%, rgba(14, 165, 233, .13), transparent 25%)",
    displayFont: '"Plus Jakarta Sans", "Segoe UI", sans-serif',
    bodyFont: '"Plus Jakarta Sans", "Segoe UI", sans-serif',
    density: "airy",
  },
  {
    id: "neon-intelligence",
    name: "Neon Intelligence",
    mode: "dark",
    concept: "Consola operativa verde profunda para estados de ejecución, monitoreo y automatización.",
    message: "La inteligencia está viva y observable.",
    canvas: "#0A1A14",
    surface: "#12251D",
    sidebar: "#071310",
    panel: "#183126",
    text: "#E8F5E9",
    muted: "#9DB5A8",
    border: "#27503D",
    primary: "#34D399",
    primaryForeground: "#062118",
    accent: "#6EE7B7",
    success: "#6EE7B7",
    warning: "#FBBF24",
    danger: "#FB7185",
    info: "#7DD3FC",
    radius: "8px",
    shadow: "0 14px 34px rgba(0, 0, 0, .34), 0 0 0 1px rgba(52, 211, 153, .04)",
    atmosphere: "radial-gradient(circle at 20% 0%, rgba(16, 185, 129, .2), transparent 34%)",
    displayFont: '"IBM Plex Mono", "Cascadia Mono", monospace',
    bodyFont: '"IBM Plex Mono", "Cascadia Mono", monospace',
    density: "dense",
  },
  {
    id: "graphite-workspace",
    name: "Graphite Workspace",
    mode: "dark",
    concept: "Grafito mate y naranja de alta señal para construir, revisar y moverse rápido.",
    message: "Menos ornamentación; más entrega.",
    canvas: "#18181B",
    surface: "#27272A",
    sidebar: "#09090B",
    panel: "#303035",
    text: "#FAFAFA",
    muted: "#A1A1AA",
    border: "#52525B",
    primary: "#FB923C",
    primaryForeground: "#1C0D03",
    accent: "#FDBA74",
    success: "#4ADE80",
    warning: "#FACC15",
    danger: "#FB7185",
    info: "#93C5FD",
    radius: "6px",
    shadow: "0 10px 24px rgba(0, 0, 0, .38)",
    atmosphere: "linear-gradient(110deg, rgba(249, 115, 22, .12), transparent 38%)",
    displayFont: '"Geist", "Segoe UI", sans-serif',
    bodyFont: '"Geist", "Segoe UI", sans-serif',
    density: "dense",
  },
  {
    id: "premium-dark",
    name: "Premium Dark",
    mode: "dark",
    concept: "Chocolate oscuro, oro y una lectura casi editorial para una experiencia premium y contenida.",
    message: "La herramienta tiene el peso de una pieza bien hecha.",
    canvas: "#15100E",
    surface: "#1C1210",
    sidebar: "#0E0A09",
    panel: "#2B1A15",
    text: "#F5ECE9",
    muted: "#BCAAA4",
    border: "#4B332B",
    primary: "#FBBF24",
    primaryForeground: "#2A1800",
    accent: "#FCD34D",
    success: "#6EE7B7",
    warning: "#FBBF24",
    danger: "#FB7185",
    info: "#7DD3FC",
    radius: "14px",
    shadow: "0 20px 44px rgba(0, 0, 0, .42)",
    atmosphere: "radial-gradient(circle at 84% 0%, rgba(245, 158, 11, .2), transparent 32%)",
    displayFont: '"Newsreader", Georgia, serif',
    bodyFont: '"IBM Plex Sans", "Segoe UI", sans-serif',
    density: "airy",
  },
];

const STAGES = [
  ["discover", "Descubrir", "Problema y contexto"],
  ["define", "Definir", "Objetivos y alcance"],
  ["design", "Diseñar", "Arquitectura y conducta"],
  ["tools", "Herramientas", "Capacidades y contratos"],
  ["memory", "Memoria", "Conocimiento y RAG"],
  ["estimate", "Estimar", "Valor, costo y ROI"],
  ["validate", "Validar", "Pruebas y GAPs"],
  ["package", "Package", "Paquete portable"],
] as const;

const NAV_ITEMS = [
  ["Inicio", Gauge],
  ["Proyectos", FolderKanban],
  ["Agentes", Bot],
  ["Plantillas", Layers3],
  ["Evaluaciones", CheckCircle2],
  ["Monitoreo", Activity],
  ["Biblioteca", FileText],
  ["Integraciones", Network],
  ["Configuración", Settings2],
] as const;

const CSS_VARS = [
  "canvas",
  "surface",
  "sidebar",
  "panel",
  "text",
  "muted",
  "border",
  "primary",
  "primaryForeground",
  "accent",
  "success",
  "warning",
  "danger",
  "info",
  "radius",
  "shadow",
  "atmosphere",
  "displayFont",
  "bodyFont",
] as const;

function themeStyle(proposal: Proposal) {
  return Object.fromEntries(CSS_VARS.map((key) => [`--vp-${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`, proposal[key]])) as CSSProperties;
}

function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "info" | "ai" }) {
  return <span className={`${styles.badge} ${styles[`badge${tone[0].toUpperCase()}${tone.slice(1)}`]}`}>{children}</span>;
}

function Button({ children, variant = "secondary", icon: Icon, onClick, className = "" }: { children: ReactNode; variant?: "primary" | "secondary" | "ghost" | "danger"; icon?: typeof ArrowRight; onClick?: () => void; className?: string }) {
  return (
    <button className={`${styles.button} ${styles[`button${variant[0].toUpperCase()}${variant.slice(1)}`]} ${className}`} onClick={onClick} type="button">
      {Icon ? <Icon aria-hidden="true" size={15} /> : null}
      <span>{children}</span>
    </button>
  );
}

export function VisualProposalsLab() {
  const [selectedId, setSelectedId] = useState(PROPOSALS[0].id);
  const [activeStage, setActiveStage] = useState("discover");
  const [attentionOpen, setAttentionOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const proposal = PROPOSALS.find((item) => item.id === selectedId) ?? PROPOSALS[0];
  const stage = STAGES.find((item) => item[0] === activeStage) ?? STAGES[0];

  return (
    <div className={`${styles.root} ${styles[`density${proposal.density[0].toUpperCase()}${proposal.density.slice(1)}`]}`} data-mode={proposal.mode} style={themeStyle(proposal)}>
      <a className={styles.skipLink} href="#visual-main">Saltar al contenido</a>
      <div className={styles.atmosphere} aria-hidden="true" />
      {mobileMenuOpen ? (
        <div className={styles.mobileOverlay}>
          <button aria-label="Cerrar menú" className={styles.mobileBackdrop} onClick={() => setMobileMenuOpen(false)} type="button" />
          <aside className={styles.mobileSidebar}>{/* The same navigation hierarchy, rendered as a prototype overlay. */}<Sidebar onClose={() => setMobileMenuOpen(false)} /></aside>
        </div>
      ) : null}

      <div className={styles.shell}>
        <Sidebar />
        <div className={styles.appColumn}>
          <header className={styles.topbar}>
            <div className={styles.topbarLeft}>
              <button aria-label="Abrir menú" className={`${styles.iconButton} ${styles.mobileOnly}`} onClick={() => setMobileMenuOpen(true)} type="button"><Menu size={17} /></button>
              <div className={styles.breadcrumb}><span>Proyectos</span><span>/</span><strong>PRJ-204</strong></div>
              <span className={styles.topbarDivider} />
              <span className={styles.projectName}>Asistente de soporte inteligente</span>
            </div>
            <div className={styles.topbarActions}>
              <button aria-label="Abrir comandos" className={styles.commandButton} onClick={() => setDialogOpen(true)} type="button"><Command size={14} /><span>Buscar</span><kbd>⌘ K</kbd></button>
              <button aria-label="Notificaciones" className={styles.iconButton} type="button"><Activity size={16} /></button>
              <span className={styles.avatar}>AM</span>
            </div>
          </header>

          <main className={styles.main} id="visual-main">
            <section className={styles.labHeader}>
              <div>
                <div className={styles.eyebrow}><Sparkles size={13} /> VISUAL PROPOSALS LAB <span>·</span> 12 DIRECCIONES</div>
                <h1>Una misma experiencia. Doce identidades.</h1>
                <p>Mockup de alta fidelidad para comparar la evolución visual de Lean Agent Builder sin alterar navegación, IA, etapas ni comportamiento.</p>
              </div>
              <div className={styles.labMeta}><Badge tone="ai">{proposal.mode === "light" ? "Modo claro" : "Modo oscuro"}</Badge><span className={styles.metaText}>Dirección {PROPOSALS.findIndex((item) => item.id === proposal.id) + 1} / 12</span></div>
            </section>

            <section aria-label="Seleccionar dirección visual" className={styles.proposalPicker}>
              <div className={styles.pickerIntro}><span className={styles.pickerKicker}>DIRECCIONES</span><strong>Explora el sistema visual</strong><span className={styles.pickerHint}>Selecciona una tarjeta para aplicar sus tokens al mismo flujo.</span></div>
              <div className={styles.proposalGrid} role="tablist" aria-label="Propuestas de identidad visual">
                {PROPOSALS.map((item, index) => (
                  <button aria-selected={proposal.id === item.id} className={`${styles.proposalCard} ${proposal.id === item.id ? styles.proposalCardSelected : ""}`} key={item.id} onClick={() => setSelectedId(item.id)} role="tab" type="button">
                    <span className={styles.proposalSwatch} style={{ background: item.canvas }}><span style={{ background: item.primary }} /><span style={{ background: item.accent }} /><span style={{ background: item.sidebar }} /></span>
                    <span className={styles.proposalCardText}><small>{String(index + 1).padStart(2, "0")} · {item.mode === "light" ? "LIGHT" : "DARK"}</small><strong>{item.name}</strong></span>
                  </button>
                ))}
              </div>
            </section>

            <section className={styles.directionBanner}>
              <div className={styles.directionIdentity}><span className={styles.directionMark} style={{ background: proposal.primary }}><Sparkles size={17} /></span><div><div className={styles.directionTitle}><strong>{proposal.name}</strong><Badge tone={proposal.mode === "dark" ? "info" : "neutral"}>{proposal.mode === "dark" ? "Dark" : "Light"}</Badge></div><p>{proposal.concept}</p></div></div>
              <div className={styles.directionMessage}><span>MENSAJE</span><strong>{proposal.message}</strong></div>
            </section>

            <section className={styles.dashboardHeader}>
              <div><div className={styles.statusRow}><Badge tone="ai">Blueprint v12</Badge><Badge tone="success">2 etapas aprobadas</Badge><Badge><span className={styles.liveDot} />Sin ejecución activa</Badge></div><h2>Asistente de soporte inteligente</h2><p>Última actualización hace 2 min · Contexto consolidado: 10 evidencias, 4 decisiones</p></div>
              <div className={styles.progressBox}><div className={styles.progressCopy}><span>Avance verificable</span><strong>2 / 8 etapas</strong></div><div className={styles.segmentedProgress}>{STAGES.map((item, index) => <span className={index < 2 ? styles.progressDone : index === 2 ? styles.progressActive : ""} key={item[0]} />)}</div><button className={styles.inlineLink} onClick={() => setAttentionOpen(true)} type="button"><AlertCircle size={13} /> 4 pendientes</button></div>
            </section>

            <div className={styles.contentGrid}>
              <aside className={styles.stageRail} aria-label="Ruta LEAN">
                <div className={styles.railHeading}><span className={styles.railKicker}>RUTA LEAN</span><strong>Diseño a construcción</strong></div>
                <ol>{STAGES.map((item, index) => { const active = item[0] === activeStage; const completed = index < 2; return <li key={item[0]}><button aria-current={active ? "step" : undefined} className={`${styles.stageButton} ${active ? styles.stageButtonActive : ""}`} onClick={() => setActiveStage(item[0])} type="button"><span className={`${styles.stageNumber} ${completed ? styles.stageNumberDone : ""} ${active ? styles.stageNumberActive : ""}`}>{completed ? <Check size={13} /> : index + 1}</span><span><strong>{item[1]}</strong><small>{item[2]}</small></span>{index === 2 ? <span className={styles.stageMarker}>●</span> : null}</button></li>; })}</ol>
                <div className={styles.contextCard}><div className={styles.contextTitle}><ShieldCheck size={14} /> Contexto activo</div><p>Solo viajan al modelo las evidencias y decisiones necesarias para la tarea actual.</p><button onClick={() => setDialogOpen(true)} type="button">Inspeccionar memoria <ArrowRight size={12} /></button></div>
              </aside>

              <section className={styles.stageWorkspace} aria-labelledby="stage-title">
                <div className={styles.stageWorkspaceHeader}><div><div className={styles.statusRow}><Badge tone="ai">Blueprint · Etapa {STAGES.findIndex((item) => item[0] === stage[0]) + 1}</Badge><Badge tone={activeStage === "design" ? "warning" : "neutral"}>{activeStage === "design" ? "Requiere atención" : "En preparación"}</Badge></div><h3 id="stage-title">{stage[1]}: {stage[2]}</h3><p>Comprender el contexto disponible antes de continuar con la siguiente entrega validada.</p></div><button aria-label="Más opciones de la etapa" className={styles.iconButton} type="button"><MoreHorizontal size={17} /></button></div>
                <div className={styles.actionCard}><div className={styles.actionIcon}><Target size={18} /></div><div><span className={styles.actionKicker}>ACCIÓN PRINCIPAL</span><strong>{activeStage === "design" ? "Resolver autoridad antes de aprobar Diseño" : `Completar ${stage[1]} y analizar`}</strong><p>El sistema muestra el siguiente paso con el contexto que lo justifica, sin competir con la tarea.</p></div><Button icon={ArrowRight} variant="primary" onClick={() => setDialogOpen(true)}>{activeStage === "design" ? "Responder pregunta" : "Continuar"}</Button></div>
                <div className={styles.formCard}><div className={styles.cardHeader}><div><span className={styles.cardKicker}>ENTRADA DE CONTEXTO</span><h4>1. Cuéntanos sobre el problema</h4></div><Badge tone="warning">Obligatorio</Badge></div><div className={styles.formGrid}><label className={styles.field}><span>Describe el problema y el contexto <em>*</em></span><textarea defaultValue="El equipo recibe cientos de solicitudes repetitivas relacionadas con contraseñas, acceso VPN, correo electrónico y problemas básicos." /></label><div className={styles.fieldStack}><label className={styles.field}><span>¿Qué tarea o proceso quieres resolver? <em>*</em></span><input defaultValue="Clasificar tickets y responder automáticamente" /></label><label className={styles.field}><span>¿Qué resultado esperas lograr?</span><select defaultValue="reducir"><option value="reducir">Reducir tiempo de respuesta y carga operativa</option><option value="calidad">Aumentar calidad y trazabilidad</option></select></label></div></div><div className={styles.formFooter}><span>4 evidencias vinculadas</span><span>Guardado automático · hace 2 min</span></div></div>
                <div className={styles.formCard}><div className={styles.cardHeader}><div><span className={styles.cardKicker}>SEÑALES DE VALIDACIÓN</span><h4>2. Impacto y oportunidad</h4></div><Badge tone="success">Completo</Badge></div><div className={styles.signalGrid}><div className={styles.signal}><span>Tiempo actual</span><strong>2–8 h / semana</strong><small>Impacto moderado</small></div><div className={styles.signal}><span>Autonomía objetivo</span><strong>0.84</strong><div className={styles.fakeSlider}><i /></div></div><div className={styles.signal}><span>Restricciones</span><strong>6 confirmadas</strong><small>MS Teams · Active Directory · ITSM</small></div></div></div>
                <div className={styles.stickyActions}><div><strong>Siguiente: {activeStage === "discover" ? "Revisar definición propuesta" : "Aprobar salida versionada"}</strong><span>Los cambios se guardan como borrador y mantienen trazabilidad.</span></div><div className={styles.buttonRow}><Button variant="secondary">Guardar borrador</Button><Button icon={ArrowRight} variant="primary" onClick={() => setDialogOpen(true)}>Continuar</Button></div></div>
              </section>

              <aside className={styles.attentionPanel} aria-label="Segmento de Atención"><div className={styles.attentionHeader}><div><span className={styles.attentionKicker}>SEGMENTO TRANSVERSAL</span><h3>Requiere tu atención</h3></div><button aria-label="Abrir panel de atención" className={styles.panelOpenButton} onClick={() => setAttentionOpen(true)} type="button"><PanelRightOpen size={16} /></button></div><p className={styles.attentionIntro}>Preguntas, gaps y decisiones que pueden cambiar la salida actual.</p><div className={styles.attentionList}><button className={`${styles.attentionItem} ${styles.attentionCritical}`} onClick={() => setAttentionOpen(true)} type="button"><div><Badge tone="danger">Q-14 · Bloquea</Badge><strong>¿Quién autoriza un cambio con impacto financiero?</strong></div><ArrowRight size={14} /></button><button className={styles.attentionItem} onClick={() => setAttentionOpen(true)} type="button"><div><Badge tone="warning">S-03 · Desactualizado</Badge><strong>Memoria usa una versión anterior de Herramientas</strong></div><ArrowRight size={14} /></button><button className={styles.attentionItem} onClick={() => setAttentionOpen(true)} type="button"><div><Badge tone="info">G-08 · GAP</Badge><strong>Falta confirmar el proveedor de tickets</strong></div><ArrowRight size={14} /></button></div><Button className={styles.fullButton} icon={ArrowRight} variant="secondary" onClick={() => setAttentionOpen(true)}>Abrir bandeja completa</Button><div className={styles.syncCard}><div className={styles.syncIcon}><CheckCircle2 size={14} /></div><div><strong>Snapshot sincronizado</strong><span>4 evidencias y 2 decisiones están disponibles para esta etapa.</span></div></div></aside>
            </div>

            <section className={styles.componentShelf} aria-labelledby="components-title"><div className={styles.shelfHeader}><div><span className={styles.eyebrow}>FOUNDATION PREVIEW</span><h2 id="components-title">Componentes y estados clave</h2></div><span className={styles.metaText}>Tokens vivos de {proposal.name}</span></div><div className={styles.shelfGrid}><div className={styles.shelfCell}><span className={styles.shelfLabel}>BOTONES</span><div className={styles.buttonRow}><Button variant="primary">Primaria</Button><Button variant="secondary">Secundaria</Button><Button variant="ghost">Consulta</Button></div></div><div className={styles.shelfCell}><span className={styles.shelfLabel}>ESTADOS</span><div className={styles.buttonRow}><Badge tone="success"><CheckCircle2 size={12} /> Aprobado</Badge><Badge tone="warning">Revisión</Badge><Badge tone="danger">Bloqueado</Badge><Badge tone="ai"><Sparkles size={12} /> IA</Badge></div></div><div className={styles.shelfCell}><span className={styles.shelfLabel}>CAMPO</span><div className={styles.compactInput}><Search size={14} /><span>Buscar en el contexto…</span><kbd>⌘ K</kbd></div></div><div className={styles.shelfCell}><span className={styles.shelfLabel}>PROGRESO</span><div className={styles.shelfProgress}><div><span>Procesamiento por pasos</span><strong>68%</strong></div><div className={styles.progressTrack}><i /></div></div></div></div></section>
          </main>
        </div>
      </div>

      {attentionOpen ? <div className={styles.modalLayer}><button aria-label="Cerrar Segmento de Atención" className={styles.modalBackdrop} onClick={() => setAttentionOpen(false)} type="button" /><section aria-labelledby="attention-dialog-title" aria-modal="true" className={`${styles.dialog} ${styles.attentionDialog}`} role="dialog"><div className={styles.dialogHeader}><div><span className={styles.attentionKicker}>SEGMENTO TRANSVERSAL</span><h2 id="attention-dialog-title">Requiere tu atención</h2></div><button aria-label="Cerrar" className={styles.iconButton} onClick={() => setAttentionOpen(false)} type="button"><X size={17} /></button></div><p>Las acciones aparecen aquí y también en la etapa que las originó. El flujo funcional permanece intacto.</p><div className={styles.dialogList}><div className={styles.dialogItem}><Badge tone="danger">Bloqueante · Q-14</Badge><strong>Define la autoridad para aprobar compensaciones</strong><span>Impacto: impide cerrar el approval gate de Diseño.</span><Button variant="primary" onClick={() => setAttentionOpen(false)}>Resolver ahora</Button></div><div className={styles.dialogItem}><Badge tone="warning">Revisión · S-03</Badge><strong>Regenerar Memoria con Herramientas v7</strong><span>Impacto: conserva la trazabilidad y evita contexto obsoleto.</span><Button variant="secondary" onClick={() => setAttentionOpen(false)}>Ver detalle</Button></div></div></section></div> : null}
      {dialogOpen ? <div className={styles.modalLayer}><button aria-label="Cerrar diálogo" className={styles.modalBackdrop} onClick={() => setDialogOpen(false)} type="button" /><section aria-labelledby="command-dialog-title" aria-modal="true" className={styles.dialog} role="dialog"><div className={styles.dialogHeader}><div><span className={styles.eyebrow}><Command size={13} /> COMMAND SURFACE</span><h2 id="command-dialog-title">¿Qué quieres inspeccionar?</h2></div><button aria-label="Cerrar" className={styles.iconButton} onClick={() => setDialogOpen(false)} type="button"><X size={17} /></button></div><div className={styles.commandList}><button onClick={() => setDialogOpen(false)} type="button"><Search size={16} /><span><strong>Buscar contexto</strong><small>Encuentra evidencias y decisiones</small></span><kbd>↵</kbd></button><button onClick={() => setDialogOpen(false)} type="button"><ShieldCheck size={16} /><span><strong>Inspeccionar memoria usada</strong><small>Revisa qué viaja a la tarea actual</small></span><kbd>↵</kbd></button><button onClick={() => setDialogOpen(false)} type="button"><CircleHelp size={16} /><span><strong>Ver criterios de avance</strong><small>Consulta la salida esperada de esta etapa</small></span><kbd>↵</kbd></button></div></section></div> : null}
    </div>
  );
}

function Sidebar({ onClose }: { onClose?: () => void }) {
  return <aside className={`${styles.sidebar} ${onClose ? styles.sidebarMobile : ""}`}><div className={styles.brand}><span className={styles.brandMark}><Sparkles size={16} /></span><div><strong>Lean Agent Builder</strong><small>Workspace SaaS</small></div>{onClose ? <button aria-label="Cerrar menú" className={styles.iconButton} onClick={onClose} type="button"><X size={17} /></button> : null}</div><nav aria-label="Navegación principal" className={styles.mainNav}>{NAV_ITEMS.map(([label, Icon]) => <button aria-current={label === "Proyectos" ? "page" : undefined} className={`${styles.navItem} ${label === "Proyectos" ? styles.navItemActive : ""}`} key={label} type="button"><Icon size={15} /><span>{label}</span></button>)}</nav><div className={styles.sidebarBottom}><div className={styles.helpRow}><CircleHelp size={14} /><span>Centro de ayuda</span></div><div className={styles.workspaceCard}><span className={styles.avatarSmall}>LB</span><div><strong>Lean Builder</strong><small>Workspace principal</small></div><ChevronDown size={14} /></div></div></aside>;
}
