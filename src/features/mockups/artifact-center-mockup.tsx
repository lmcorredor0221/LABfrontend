"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart2,
  CheckCircle2,
  Eye,
  GitBranch,
  History,
  LockKeyhole,
  MapPin,
  RefreshCw,
  Search,
  Wand2,
  type LucideIcon,
} from "lucide-react";

import { UxaButton } from "@/features/product-experience/design-system";
import styles from "./artifact-center.module.css";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type ArtifactTier = "blueprint" | "blueprint_pro" | "commercial";
type ArtifactStatus = "available" | "stale" | "locked" | "generating";
type InspectorTab = "origin" | "versions" | "quality";

type DocumentSection = { body: string; title: string };

type ArtifactDocument = {
  category: string;
  generatedAt: string;
  key: string;
  lockedReason?: string;
  primaryMetric: string;
  promptVersion: string;
  purpose: string;
  quality: number;
  sections: DocumentSection[];
  sourceRefs: string[];
  stage: string;
  status: ArtifactStatus;
  subtitle: string;
  summary: string;
  tier: ArtifactTier;
  title: string;
  version: string;
};

// ─── Constantes ───────────────────────────────────────────────────────────────

const TIER_LABEL: Record<ArtifactTier | "all", string> = {
  all: "Todos",
  blueprint: "Blueprint",
  blueprint_pro: "Blueprint Pro",
  commercial: "Comerciales",
};

const STATUS_LABEL: Record<ArtifactStatus, string> = {
  available: "Disponible",
  generating: "Generando",
  locked: "Por desbloquear",
  stale: "Por actualizar",
};

const STATUS_CLASS: Record<ArtifactStatus, string> = {
  available: styles.statusAvailable,
  generating: styles.statusGenerating,
  locked: styles.statusLocked,
  stale: styles.statusStale,
};

const STATUS_BAND_COLOR: Record<ArtifactStatus, string> = {
  available: "var(--uxa-state-success)",
  generating: "var(--uxa-color-brand)",
  locked: "var(--uxa-color-border)",
  stale: "var(--uxa-state-warning)",
};

const DOCUMENTS: ArtifactDocument[] = [
  {
    category: "Resumen ejecutivo",
    generatedAt: "13 ago 2026, 12:58 p. m.",
    key: "executive-blueprint-result",
    primaryMetric: "5 fuentes",
    promptVersion: "artifact.executive_summary.v3",
    purpose: "Explicar el valor del Blueprint a un decisor de negocio sin exponer contenido técnico crudo.",
    quality: 94,
    sections: [
      { title: "Problema y oportunidad", body: "El volumen de solicitudes repetitivas crea fricción operativa, tiempos de respuesta variables y dependencia de conocimiento disperso." },
      { title: "Solución propuesta", body: "Un agente de soporte gobernado clasifica intención, recupera evidencia autorizada, propone respuesta trazable y escala decisiones sensibles." },
      { title: "Resultado esperado", body: "Reducir esfuerzo operativo, mejorar consistencia y dejar una base clara para enriquecer el Blueprint Profesional." },
    ],
    sourceRefs: ["discover.approved", "define.requirements", "design.selected_pattern", "tools.minimum_set", "memory.strategy"],
    stage: "Estimar",
    status: "available",
    subtitle: "Documento comercial listo para mostrar el valor del Blueprint Básico.",
    summary: "LAB consolidó una versión ejecutiva del diseño agéntico, conectando necesidad, alcance, arquitectura, herramientas mínimas, memoria y valor estimado.",
    tier: "commercial",
    title: "Resultado ejecutivo del Blueprint",
    version: "v2.1",
  },
  {
    category: "Comparativa comercial",
    generatedAt: "13 ago 2026, 1:04 p. m.",
    key: "commercial-build-comparison",
    primaryMetric: "59% ahorro",
    promptVersion: "artifact.commercial_comparison.v2",
    purpose: "Transformar la estimación aprobada en una narrativa comercial clara para conversión a Blueprint Pro o ACP.",
    quality: 91,
    sections: [
      { title: "Escenario base", body: "El desarrollo tradicional se usa como línea base para comparar horas, costo, intervención humana y riesgo." },
      { title: "Alternativa recomendada", body: "ACP con herramientas agénticas concentra el mayor ahorro porque reutiliza el diseño y reduce redescubrimiento." },
      { title: "Alcance de estimación", body: "La cifra cubre construcción del agente; integraciones externas, sistemas legacy y credenciales se cotizan aparte." },
    ],
    sourceRefs: ["estimate.report", "pricing.snapshot", "blueprint.scope", "tools.selected"],
    stage: "Estimar",
    status: "available",
    subtitle: "Compara Blueprint, Blueprint Pro, ACP y fábrica de desarrollo.",
    summary: "Comparativa editorial basada en la estimación vigente, sin recalcular ni inventar datos fuera del reporte aprobado.",
    tier: "commercial",
    title: "Comparativa comercial de construcción",
    version: "v1.4",
  },
  {
    category: "Arquitectura funcional",
    generatedAt: "12 ago 2026, 6:18 p. m.",
    key: "functional-architecture-document",
    primaryMetric: "12 decisiones",
    promptVersion: "artifact.functional_architecture.v4",
    purpose: "Documentar arquitectura, patrones, responsabilidades, límites y decisiones del agente sin forzar tecnología de implementación.",
    quality: 88,
    sections: [
      { title: "Arquitectura objetivo", body: "La solución usa un supervisor agéntico con subcapacidades de intake, recuperación, respuesta trazable y aprobación humana." },
      { title: "Patrones aplicados", body: "Se priorizan ReAct controlado, retrieval gobernado, HITL para decisiones sensibles y auditoría de evidencia." },
      { title: "Límites de diseño", body: "El Blueprint no implementa APIs externas; las identifica y define su rol para decisiones posteriores." },
    ],
    sourceRefs: ["design.selected_alternative", "define.nfr", "tools.contract_summary", "memory.policy"],
    stage: "Diseñar",
    status: "stale",
    subtitle: "Documento profesional del diseño integral del agente.",
    summary: "La arquitectura funcional está disponible, pero requiere actualizarse porque herramientas y memoria cambiaron después de la última versión.",
    tier: "blueprint_pro",
    title: "Documento de arquitectura funcional",
    version: "v1.7",
  },
  {
    category: "Memoria y conocimiento",
    generatedAt: "11 ago 2026, 8:42 p. m.",
    key: "memory-knowledge-strategy",
    primaryMetric: "9 reglas",
    promptVersion: "artifact.memory_strategy.v3",
    purpose: "Presentar la estrategia de memoria corta, larga, RAG, retención, privacidad y recuperación de conocimiento.",
    quality: 86,
    sections: [
      { title: "Memoria corta", body: "Mantiene contexto operativo por caso: intención, cliente, evidencia consultada, acción propuesta y decisión humana." },
      { title: "Memoria larga", body: "Conserva conocimiento aprobado, políticas, procedimientos, taxonomías e histórico auditable de decisiones." },
      { title: "Control de contexto", body: "Evita enviar todo el historial al LLM; recupera solo referencias relevantes y versiones aprobadas." },
    ],
    sourceRefs: ["memory.approved", "tools.selected", "repo_docs.memory_patterns"],
    stage: "Memoria",
    status: "available",
    subtitle: "Estrategia editorial para explicar cómo el agente recuerda y consulta conocimiento.",
    summary: "El documento traduce la estrategia técnica de memoria a una pieza profesional, trazable y entendible para stakeholders.",
    tier: "blueprint_pro",
    title: "Estrategia de memoria y conocimiento",
    version: "v1.2",
  },
  {
    category: "Reglas de negocio",
    generatedAt: "Pendiente",
    key: "business-rules-catalog",
    lockedReason: "Disponible al adquirir Blueprint Pro. Incluye reglas, excepciones, criterios de aprobación y trazabilidad.",
    primaryMetric: "Bloqueado",
    promptVersion: "artifact.business_rules.v1",
    purpose: "Convertir requisitos, excepciones y criterios en un documento gobernado para implementación posterior.",
    quality: 0,
    sections: [],
    sourceRefs: ["define.business_rules", "attention.accepted_decisions"],
    stage: "Definir",
    status: "locked",
    subtitle: "Catálogo profesional de reglas y excepciones del agente.",
    summary: "Este documento forma parte del Blueprint Profesional y permite cerrar ambigüedades antes de construir.",
    tier: "blueprint_pro",
    title: "Catálogo de reglas de negocio",
    version: "Sin versión",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function qualityColor(q: number) {
  if (q >= 80) return "var(--uxa-state-success)";
  if (q >= 60) return "var(--uxa-state-warning)";
  return "var(--uxa-state-danger)";
}

// ─── ItemStatus ───────────────────────────────────────────────────────────────

function ItemStatus({ status }: { status: ArtifactStatus }) {
  return (
    <span className={`${styles.status} ${STATUS_CLASS[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

// ─── CatalogCard ──────────────────────────────────────────────────────────────

function CatalogCard({
  document,
  onSelect,
  selected,
}: {
  document: ArtifactDocument;
  onSelect(): void;
  selected: boolean;
}) {
  const bandColor = STATUS_BAND_COLOR[document.status];

  return (
    <button
      aria-pressed={selected}
      className={`${styles.card} ${selected ? styles.cardSelected : ""}`}
      onClick={onSelect}
      style={{ "--statusBand": bandColor } as React.CSSProperties}
      type="button"
    >
      <div className={styles.cardTop}>
        <span className={styles.cardMeta}>
          {document.stage} · {TIER_LABEL[document.tier]}
        </span>
        <ItemStatus status={document.status} />
      </div>

      <div>
        <h4 className={styles.cardTitle}>{document.title}</h4>
        <p className={styles.cardSub}>{document.subtitle}</p>
      </div>

      <div className={styles.cardFooter}>
        <span
          className={styles.cardMetric}
          style={{
            background: `color-mix(in srgb, ${bandColor} 12%, transparent)`,
            color: bandColor,
          }}
        >
          {document.primaryMetric}
        </span>
        <span className={styles.cardCta}>
          Ver <ArrowRight aria-hidden="true" size={11} />
        </span>
      </div>
    </button>
  );
}

// ─── DocumentViewer ───────────────────────────────────────────────────────────

function DocumentViewer({ document }: { document: ArtifactDocument }) {
  const locked = document.status === "locked";
  const qColor = qualityColor(document.quality);

  return (
    <article className={styles.docPane}>

      {/* Stale banner */}
      {document.status === "stale" ? (
        <div className={styles.staleBanner}>
          <div>
            <AlertTriangle aria-hidden="true" size={13} />
            <span>Las fuentes han cambiado desde la última generación. Regenerar para actualizar.</span>
          </div>
          <UxaButton size="sm" variant="secondary">
            <RefreshCw aria-hidden="true" className="h-3 w-3" />
            Regenerar ahora
          </UxaButton>
        </div>
      ) : null}

      {locked ? (
        <div className={styles.lockedState}>
          <LockKeyhole aria-hidden="true" size={30} />
          <h4>Documento en Blueprint Pro</h4>
          <p>{document.lockedReason}</p>
          <UxaButton size="sm" variant="primary">
            Ver beneficio del Blueprint Pro
            <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
          </UxaButton>
        </div>
      ) : (
        <>
          {/* ── Portada del documento ── */}
          <div className={styles.docCover}>
            {/* Breadcrumb */}
            <div className={styles.docBreadcrumb}>
              {TIER_LABEL[document.tier]}
              <span>›</span>
              {document.stage}
              <span>›</span>
              {document.category}
            </div>

            {/* Título + score */}
            <div className={styles.docTitleRow}>
              <h3 className={styles.docTitle}>{document.title}</h3>
              {document.quality > 0 ? (
                <div
                  aria-label={`Calidad editorial: ${document.quality}%`}
                  className={styles.docScoreBadge}
                  style={{ color: qColor }}
                >
                  {document.quality}
                </div>
              ) : null}
            </div>

            {/* Subtítulo */}
            <p className={styles.docSubtitle}>{document.subtitle}</p>

            {/* Meta row: versión, fecha, estado */}
            <div className={styles.docMetaRow}>
              <ItemStatus status={document.status} />
              <span className={styles.tag}>{document.version}</span>
              <span className={styles.tag}>{document.category}</span>
              <span className={styles.tag}>{document.generatedAt}</span>
            </div>
          </div>

          {/* ── Cuerpo 2-col ── */}
          <div className={styles.docBody}>

            {/* Columna principal */}
            <div className={styles.docContent}>
              {/* Resumen ejecutivo */}
              <div className={styles.docSummaryBlock}>
                <span className={styles.docSummaryEyebrow}>Resumen ejecutivo</span>
                <p className={styles.docSummaryText}>{document.summary}</p>
              </div>

              {/* Secciones */}
              {document.sections.map((section, i) => (
                <div className={styles.docSection} key={section.title}>
                  <div className={styles.docSectionHeader}>
                    <span className={styles.docSectionNum}>{String(i + 1).padStart(2, "0")}</span>
                    <h4 className={styles.docSectionTitle}>{section.title}</h4>
                  </div>
                  <div className={styles.docSectionBody}>
                    {section.body.split(/\n+/).map((line, lIdx) => {
                      const boldParts = line.split(/\*\*([^*]+)\*\*/g);
                      return (
                        <p key={lIdx} className="mb-2 leading-relaxed">
                          {boldParts.map((part, pIdx) =>
                            pIdx % 2 === 1 ? (
                              <strong className="font-bold text-[var(--uxa-color-ink)]" key={pIdx}>
                                {part}
                              </strong>
                            ) : (
                              part
                            ),
                          )}
                        </p>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Acciones */}
              <div className={styles.docActions}>
                <UxaButton size="sm" variant="primary">
                  <RefreshCw aria-hidden="true" className="h-3 w-3" />
                  Regenerar con LLM
                </UxaButton>
                <UxaButton size="sm" variant="secondary">
                  <Eye aria-hidden="true" className="h-3 w-3" />
                  Exportar
                </UxaButton>
                <UxaButton size="sm" variant="ghost">
                  JSON
                </UxaButton>
              </div>
            </div>

            {/* Sidebar de metadata */}
            <div className={styles.docSidebar}>

              {/* Métricas clave */}
              <div className={styles.docSideSection}>
                <span className={styles.docSideLabel}>Indicadores</span>
                <div className={styles.docSideMetrics}>
                  <div className={styles.docSideMetric}>
                    <span className={styles.docSideMetricLabel}>Calidad</span>
                    <span
                      className={styles.docSideMetricValue}
                      style={{ color: qColor }}
                    >
                      {document.quality > 0 ? `${document.quality}%` : "—"}
                    </span>
                    {document.quality > 0 ? (
                      <div className={styles.qualityTrack}>
                        <div
                          className={styles.qualityFill}
                          style={{ width: `${document.quality}%`, background: qColor }}
                        />
                      </div>
                    ) : null}
                  </div>
                  <div className={styles.docSideMetric}>
                    <span className={styles.docSideMetricLabel}>Fuentes</span>
                    <span className={styles.docSideMetricValue}>{document.sourceRefs.length}</span>
                    <span className={styles.docSideMetricSub}>referencias</span>
                  </div>
                </div>
              </div>

              {/* Propósito */}
              <div className={styles.docSideSection}>
                <span className={styles.docSideLabel}>Propósito</span>
                <p className={styles.docPurposeText}>{document.purpose}</p>
              </div>

              {/* PromptSpec */}
              <div className={styles.docSideSection}>
                <span className={styles.docSideLabel}>PromptSpec</span>
                <p className={styles.docPurposeText} style={{ wordBreak: "break-all" }}>
                  {document.promptVersion}
                </p>
              </div>

              {/* Fuentes */}
              <div className={styles.docSideSection}>
                <span className={styles.docSideLabel}>Fuentes</span>
                <div className={styles.docSourcesWrap}>
                  {document.sourceRefs.map((ref) => (
                    <span className={styles.tag} key={ref}>{ref}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </article>
  );
}

// ─── InspectorPane ────────────────────────────────────────────────────────────


const TABS: { icon: LucideIcon; key: InspectorTab; label: string }[] = [
  { icon: MapPin, key: "origin", label: "Origen" },
  { icon: GitBranch, key: "versions", label: "Versiones" },
  { icon: BarChart2, key: "quality", label: "Calidad" },
];

function InspectorPane({
  document,
  onTabChange,
  tab,
}: {
  document: ArtifactDocument;
  onTabChange(tab: InspectorTab): void;
  tab: InspectorTab;
}) {
  const qColor = qualityColor(document.quality);

  return (
    <div className={styles.inspectorPane}>
      {/* Header */}
      <div className={styles.paneHeader}>
        <div>
          <p className={styles.inspectorHeaderSub}>Inspector</p>
          <h3 className={styles.inspectorHeaderTitle}>Contexto del artefacto</h3>
        </div>
        <Eye aria-hidden="true" size={14} style={{ color: "var(--uxa-color-ink-muted)" }} />
      </div>

      {/* Tabs */}
      <div className={styles.tabBar}>
        {TABS.map(({ icon: TabIcon, key, label }) => (
          <button
            className={`${styles.tabBtn} ${tab === key ? styles.tabBtnActive : ""}`}
            key={key}
            onClick={() => onTabChange(key)}
            type="button"
          >
            <TabIcon aria-hidden="true" size={12} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className={styles.tabBody}>
        {tab === "origin" ? (
          <>
            {[
              ["Etapa origen", document.stage],
              ["PromptSpec", document.promptVersion],
              ["Última generación", document.generatedAt],
              ["Modo", "LLM · fallback determinístico"],
            ].map(([label, value]) => (
              <div className={styles.infoRow} key={label}>
                <p className={styles.infoLabel}>{label}</p>
                <p className={styles.infoValue}>{value}</p>
              </div>
            ))}
          </>
        ) : null}

        {tab === "versions" ? (
          <div className={styles.timeline}>
            {[
              { active: true, note: "Versión publicada y visible.", version: `${document.version} · actual` },
              { active: false, note: "Disponible para comparar cambios editoriales.", version: "v anterior · antes de herramientas" },
              { active: false, note: "Primera generación sin revisión.", version: "v1.0 · inicial" },
            ].map(({ active, note, version }, i, arr) => (
              <div className={styles.timelineItem} key={version}>
                <div className={styles.timelineLine}>
                  <span
                    className={styles.timelineDot}
                    style={{
                      background: active ? "var(--uxa-color-brand)" : "var(--uxa-color-muted-panel)",
                      color: active ? "#fff" : "var(--uxa-color-ink-muted)",
                    }}
                  >
                    {active ? <CheckCircle2 size={12} /> : <History size={11} />}
                  </span>
                  {i < arr.length - 1 ? <div className={styles.timelineConnector} /> : null}
                </div>
                <div className={styles.timelineCopy}>
                  <p
                    className={styles.timelineVersion}
                    style={{ color: active ? "var(--uxa-color-brand)" : "var(--uxa-color-ink)" }}
                  >
                    {version}
                  </p>
                  <p className={styles.timelineNote}>{note}</p>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {tab === "quality" ? (
          <>
            <div className={styles.infoRow}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <p className={styles.infoLabel}>Score editorial</p>
                <span
                  className={styles.scoreCircle}
                  style={{
                    background: `color-mix(in srgb, ${qColor} 14%, transparent)`,
                    color: qColor,
                  }}
                >
                  {document.quality > 0 ? `${document.quality}` : "—"}
                </span>
              </div>
              {document.quality > 0 ? (
                <div className={styles.qualityTrack} style={{ marginTop: 6 }}>
                  <div
                    className={styles.qualityFill}
                    style={{ width: `${document.quality}%`, background: qColor }}
                  />
                </div>
              ) : null}
            </div>

            {[
              "No inventa datos fuera de fuentes aprobadas.",
              "Explica propósito, alcance y trazabilidad.",
              "Mantiene protección de copia según plan.",
            ].map((item) => (
              <div className={styles.criteriaItem} key={item}>
                <CheckCircle2
                  aria-hidden="true"
                  size={12}
                  style={{ color: "var(--uxa-state-success)", flexShrink: 0, marginTop: 1 }}
                />
                <p>{item}</p>
              </div>
            ))}
          </>
        ) : null}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ArtifactCenterMockup() {
  const [tier, setTier] = useState<ArtifactTier | "all">("all");
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState(DOCUMENTS[0].key);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("origin");

  const filteredDocuments = useMemo(
    () =>
      DOCUMENTS.filter((d) => tier === "all" || d.tier === tier).filter((d) => {
        const haystack = `${d.title} ${d.subtitle} ${d.category} ${d.stage}`.toLowerCase();
        return haystack.includes(query.trim().toLowerCase());
      }),
    [query, tier],
  );

  const selectedDocument =
    DOCUMENTS.find((d) => d.key === selectedKey) ?? filteredDocuments[0] ?? DOCUMENTS[0];

  const tierCount = useMemo(() => {
    const c: Record<ArtifactTier | "all", number> = { all: DOCUMENTS.length, blueprint: 0, blueprint_pro: 0, commercial: 0 };
    for (const d of DOCUMENTS) c[d.tier]++;
    return c;
  }, []);

  const summary = useMemo(() => ({
    total: DOCUMENTS.length,
    available: DOCUMENTS.filter((d) => d.status === "available").length,
    stale: DOCUMENTS.filter((d) => d.status === "stale").length,
    locked: DOCUMENTS.filter((d) => d.status === "locked").length,
  }), []);

  return (
    <section aria-labelledby="artifact-center-title" className={styles.root}>

      {/* ── Hero ── */}
      <header className={styles.hero}>
        <div className={styles.heroLeft}>
          <div>
            <h2 id="artifact-center-title" className={styles.heroTitle}>
              Visor de artefactos del Blueprint
            </h2>
            <p className={styles.heroSub}>
              Catálogo gobernado de documentos generados por LLM. Lectura editorial, origen, versiones y calidad.
            </p>
          </div>
          <span className={styles.eyebrow}>Motor gobernado</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Summary chips */}
          <div className={styles.summary} aria-label="Resumen del catálogo">
            <div className={styles.summaryItem}>
              <strong>{summary.total}</strong>
              <span>En catálogo</span>
            </div>
            <div className={`${styles.summaryItem} ${styles.available}`}>
              <strong>{summary.available}</strong>
              <span>Disponibles</span>
            </div>
            <div className={`${styles.summaryItem} ${styles.stale}`}>
              <strong>{summary.stale}</strong>
              <span>Por actualizar</span>
            </div>
            <div className={`${styles.summaryItem} ${styles.locked}`}>
              <strong>{summary.locked}</strong>
              <span>Por desbloquear</span>
            </div>
          </div>

          {/* Acciones */}
          <div className={styles.heroActions}>
            <UxaButton size="sm" variant="secondary">
              <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
              Actualizar contexto
            </UxaButton>
            <UxaButton size="sm" variant="primary">
              <Wand2 aria-hidden="true" className="h-3.5 w-3.5" />
              Regenerar con LLM
            </UxaButton>
          </div>
        </div>
      </header>

      {/* ── Toolbar ── */}
      <div aria-label="Filtros del catálogo" className={styles.toolbar}>
        {/* Búsqueda */}
        <div className={styles.fieldWrap}>
          <Search aria-hidden="true" className={styles.fieldIcon} />
          <input
            aria-label="Buscar artefactos"
            className={styles.input}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, etapa o categoría…"
            type="search"
            value={query}
          />
        </div>

        {/* Chips de tier */}
        <div aria-label="Filtrar por tier" className={styles.filterChips} role="group">
          {(["all", "blueprint", "blueprint_pro", "commercial"] as const).map((item) => (
            <button
              aria-pressed={tier === item}
              className={`${styles.chip} ${tier === item ? styles.chipSelected : ""}`}
              key={item}
              onClick={() => setTier(item)}
              type="button"
            >
              {TIER_LABEL[item]}
              <span className={styles.chipCount}>{tierCount[item]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Workspace ── */}
      <div className={styles.workspace}>

        {/* Catálogo */}
        <section aria-label="Catálogo de artefactos" className={styles.catalogPane}>
          <div className={styles.paneHeader}>
            <div>
              <h3>Catálogo</h3>
              <p>{filteredDocuments.length} / {DOCUMENTS.length} documentos</p>
            </div>
            <span className={styles.tag}>artefactos · LLM</span>
          </div>

          <div className={styles.catalogScroll}>
            {filteredDocuments.length > 0 ? (
              <div className={styles.catalogGrid}>
                {filteredDocuments.map((doc) => (
                  <CatalogCard
                    document={doc}
                    key={doc.key}
                    onSelect={() => setSelectedKey(doc.key)}
                    selected={doc.key === selectedDocument.key}
                  />
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <Search aria-hidden="true" size={24} />
                <h4>Sin coincidencias</h4>
                <p>Ajusta la búsqueda o cambia el filtro de tier.</p>
              </div>
            )}
          </div>
        </section>

        {/* Visor de documento */}
        <DocumentViewer document={selectedDocument} />

        {/* Inspector */}
        <InspectorPane
          document={selectedDocument}
          onTabChange={setInspectorTab}
          tab={inspectorTab}
        />
      </div>
    </section>
  );
}
