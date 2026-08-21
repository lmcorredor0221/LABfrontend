"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Clock3,
  Download,
  FileWarning,
  GitCompareArrows,
  Grid2X2,
  LayoutList,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";
import { useLanguage, type SupportedLanguage } from "@/core/i18n/language-context";
import { UxaButton } from "@/features/product-experience/design-system";
import type {
  DiagramCatalogItem,
  DiagramGenerationReason,
  DiagramGenerationState,
} from "@/features/diagram-center/domain/types";
import { useDiagramCenter } from "@/features/diagram-center/application/use-diagram-center";
import styles from "./diagram-center.module.css";

type ViewMode = "grid" | "list";
type CanvasZoomMode = "fit" | "actual" | "wide";

type DiagramCenterPageProps = {
  projectId: string;
  catalogFilter?: (item: DiagramCatalogItem) => boolean;
  title?: string;
  subtitle?: string;
  engineLabel?: string;
  initialViewMode?: ViewMode;
};

const ACCESS_LABELS: Record<SupportedLanguage, Record<"available" | "preview" | "locked" | "stage_locked" | "disabled", string>> = {
  es: { available: "Disponible", preview: "Vista previa", locked: "Por plan", stage_locked: "Por etapa", disabled: "Deshabilitado" },
  en: { available: "Available", preview: "Preview", locked: "Plan required", stage_locked: "By stage", disabled: "Disabled" },
  pt: { available: "Disponível", preview: "Prévia", locked: "Por plano", stage_locked: "Por etapa", disabled: "Desabilitado" },
};

const GENERATION_LABELS: Record<SupportedLanguage, Record<DiagramGenerationState, string>> = {
  es: { available: "Disponible", error: "Error", generating: "Generando", pending: "Pendiente", queued: "En cola", updating: "Actualizando" },
  en: { available: "Available", error: "Error", generating: "Generating", pending: "Pending", queued: "Queued", updating: "Updating" },
  pt: { available: "Disponível", error: "Erro", generating: "Gerando", pending: "Pendente", queued: "Na fila", updating: "Atualizando" },
};

const CANVAS_ZOOM_LABELS: Record<SupportedLanguage, Record<CanvasZoomMode, string>> = {
  es: { fit: "Ajustar", actual: "Tamano real", wide: "Vista amplia" },
  en: { fit: "Fit", actual: "Actual size", wide: "Wide view" },
  pt: { fit: "Ajustar", actual: "Tamanho real", wide: "Vista ampla" },
};

const DIAGRAM_COPY: Record<
  SupportedLanguage,
  {
    title: string;
    engine: string;
    inCatalog: string;
    availableCount: string;
    lockedCount: string;
    retry: string;
    search: string;
    searchPlaceholder: string;
    allCategories: string;
    allStages: string;
    allTypes: string;
    allAvailability: string;
    catalog: string;
    provider: string;
    noMatchesTitle: string;
    noMatchesDesc: string;
    viewer: string;
    selectDiagram: string;
    viewerDesc: string;
    regenerate: string;
    layoutUpgrade: string;
    layoutUpgradeAvailable: string;
    layoutUpgradeDesc: string;
    generate: string;
    viewDetail: string;
    generationNeedsAttention: string;
    readyToGenerate: string;
    workingDesc: string;
    errorDesc: string;
    generateDiagram: string;
    preview: string;
    qualityTitle: string;
    qualityOk: string;
    compareTitle: string;
    compareDesc: string;
    baseVersion: string;
    targetVersion: string;
    compare: string;
    added: string;
    removed: string;
    changed: string;
    version: string;
    notGenerated: string;
  }
> = {
  es: {
    title: "Diagramas de la solución",
    engine: "Motor gobernado",
    inCatalog: "En catálogo",
    availableCount: "Disponibles",
    lockedCount: "Por desbloquear",
    retry: "Reintentar",
    search: "Buscar diagramas",
    searchPlaceholder: "Buscar por nombre, beneficio o tipo…",
    allCategories: "Todas las categorías",
    allStages: "Todas las etapas",
    allTypes: "Todos los tipos",
    allAvailability: "Toda disponibilidad",
    catalog: "Catálogo",
    provider: "Proveedor",
    noMatchesTitle: "No hay coincidencias",
    noMatchesDesc: "Ajusta la búsqueda o elimina uno de los filtros.",
    viewer: "Visor",
    selectDiagram: "Selecciona un diagrama",
    viewerDesc: "Consulta aquí disponibilidad, beneficio, preview, versiones y acciones permitidas.",
    regenerate: "Regenerar",
    layoutUpgrade: "Actualizar legibilidad",
    layoutUpgradeAvailable: "Mejora de legibilidad",
    layoutUpgradeDesc: "Este diagrama fue creado con una revision anterior del renderer. Puedes generar una nueva version conservando la actual para comparacion.",
    generate: "Generar",
    viewDetail: "Ver detalle",
    generationNeedsAttention: "La generación necesita atención",
    readyToGenerate: "Listo para generar",
    workingDesc: "El proveedor LLM activo está construyendo el modelo canónico y ejecutando los controles de calidad.",
    errorDesc: "Revisa el mensaje de ejecución y vuelve a intentarlo cuando el contexto o el proveedor estén disponibles.",
    generateDiagram: "Generar diagrama",
    preview: "Vista previa",
    qualityTitle: "Calidad del modelo",
    qualityOk: "Schema, conectividad, densidad y seguridad verificados.",
    compareTitle: "Comparar versiones",
    compareDesc: "Revisa cambios estructurales entre dos modelos.",
    baseVersion: "Versión base",
    targetVersion: "Versión objetivo",
    compare: "Comparar",
    added: "agregados",
    removed: "retirados",
    changed: "modificados",
    version: "Versión",
    notGenerated: "Sin generar",
  },
  en: {
    title: "Solution diagrams",
    engine: "Governed engine",
    inCatalog: "In catalog",
    availableCount: "Available",
    lockedCount: "Locked",
    retry: "Retry",
    search: "Search diagrams",
    searchPlaceholder: "Search by name, value, or type…",
    allCategories: "All categories",
    allStages: "All stages",
    allTypes: "All types",
    allAvailability: "All availability",
    catalog: "Catalog",
    provider: "Provider",
    noMatchesTitle: "No matches",
    noMatchesDesc: "Adjust the search or remove one of the filters.",
    viewer: "Viewer",
    selectDiagram: "Select a diagram",
    viewerDesc: "Check availability, value, preview, versions, and allowed actions here.",
    regenerate: "Regenerate",
    layoutUpgrade: "Upgrade readability",
    layoutUpgradeAvailable: "Readability upgrade",
    layoutUpgradeDesc: "This diagram was created with an older renderer revision. You can generate a new version while keeping the current one for comparison.",
    generate: "Generate",
    viewDetail: "View detail",
    generationNeedsAttention: "Generation needs attention",
    readyToGenerate: "Ready to generate",
    workingDesc: "The active LLM provider is building the canonical model and running quality checks.",
    errorDesc: "Review the execution message and try again when the context or provider is available.",
    generateDiagram: "Generate diagram",
    preview: "Preview",
    qualityTitle: "Model quality",
    qualityOk: "Schema, connectivity, density, and security verified.",
    compareTitle: "Compare versions",
    compareDesc: "Review structural changes between two models.",
    baseVersion: "Base version",
    targetVersion: "Target version",
    compare: "Compare",
    added: "added",
    removed: "removed",
    changed: "changed",
    version: "Version",
    notGenerated: "Not generated",
  },
  pt: {
    title: "Diagramas da solução",
    engine: "Motor governado",
    inCatalog: "No catálogo",
    availableCount: "Disponíveis",
    lockedCount: "Bloqueados",
    retry: "Tentar novamente",
    search: "Buscar diagramas",
    searchPlaceholder: "Buscar por nome, valor ou tipo…",
    allCategories: "Todas as categorias",
    allStages: "Todas as etapas",
    allTypes: "Todos os tipos",
    allAvailability: "Toda disponibilidade",
    catalog: "Catálogo",
    provider: "Provedor",
    noMatchesTitle: "Sem resultados",
    noMatchesDesc: "Ajuste a busca ou remova um dos filtros.",
    viewer: "Visualizador",
    selectDiagram: "Selecione um diagrama",
    viewerDesc: "Consulte disponibilidade, valor, prévia, versões e ações permitidas aqui.",
    regenerate: "Regenerar",
    layoutUpgrade: "Atualizar legibilidade",
    layoutUpgradeAvailable: "Melhoria de legibilidade",
    layoutUpgradeDesc: "Este diagrama foi criado com uma revisao anterior do renderer. Voce pode gerar uma nova versao preservando a atual para comparacao.",
    generate: "Gerar",
    viewDetail: "Ver detalhe",
    generationNeedsAttention: "A geração precisa de atenção",
    readyToGenerate: "Pronto para gerar",
    workingDesc: "O provedor LLM ativo está construindo o modelo canônico e executando os controles de qualidade.",
    errorDesc: "Revise a mensagem de execução e tente novamente quando o contexto ou o provedor estiver disponível.",
    generateDiagram: "Gerar diagrama",
    preview: "Prévia",
    qualityTitle: "Qualidade do modelo",
    qualityOk: "Schema, conectividade, densidade e segurança verificados.",
    compareTitle: "Comparar versões",
    compareDesc: "Revise mudanças estruturais entre dois modelos.",
    baseVersion: "Versão base",
    targetVersion: "Versão alvo",
    compare: "Comparar",
    added: "adicionados",
    removed: "removidos",
    changed: "modificados",
    version: "Versão",
    notGenerated: "Não gerado",
  },
};

function formatToken(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value: string | null, language: SupportedLanguage) {
  if (!value) return DIAGRAM_COPY[language].notGenerated;
  const locale = language === "pt" ? "pt-BR" : language === "en" ? "en-US" : "es-CO";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function statusClass(item: DiagramCatalogItem) {
  if (["queued", "generating", "updating"].includes(item.generation_state)) return styles.statusWorking;
  if (item.generation_state === "error") return styles.statusError;
  if (item.access.access_state === "available") return styles.statusAvailable;
  if (item.access.access_state === "preview") return styles.statusPreview;
  if (item.access.access_state === "stage_locked") return styles.statusStage;
  return styles.statusLocked;
}

function ItemStatus({ item, language }: { item: DiagramCatalogItem; language: SupportedLanguage }) {
  const working = ["queued", "generating", "updating"].includes(item.generation_state);
  const Icon = working
    ? LoaderCircle
    : item.generation_state === "error"
      ? AlertTriangle
      : item.access.access_state === "available"
        ? CheckCircle2
        : item.access.access_state === "stage_locked"
          ? Clock3
          : LockKeyhole;
  const label = working || item.generation_state === "error"
    ? GENERATION_LABELS[language][item.generation_state]
    : ACCESS_LABELS[language][item.access.access_state];
  return (
    <span className={`${styles.status} ${statusClass(item)}`}>
      <Icon aria-hidden="true" className={working ? "animate-spin" : ""} size={11} />
      {label}
    </span>
  );
}

function CatalogCard({
  item,
  onGenerate,
  onSelect,
  selected,
  language,
  viewMode,
}: {
  item: DiagramCatalogItem;
  onGenerate: (reason: DiagramGenerationReason) => void;
  onSelect: () => void;
  selected: boolean;
  language: SupportedLanguage;
  viewMode: ViewMode;
}) {
  const copy = DIAGRAM_COPY[language];
  const working = ["queued", "generating", "updating"].includes(item.generation_state);
  const canStart = item.access.can_generate && item.generation_state === "pending";
  const canRegenerate = item.access.can_regenerate && item.generation_state === "available";
  const canUpgradeLayout = canRegenerate && item.needs_layout_upgrade;
  const generationReason: DiagramGenerationReason = canUpgradeLayout ? "layout_upgrade" : canRegenerate ? "regenerate" : "user_request";
  return (
    <article className={`${styles.card} ${selected ? styles.cardSelected : ""} ${viewMode === "list" ? styles.listCard : ""}`}>
      <div>
        <div className={styles.cardTop}>
          <span className={styles.tag}>{formatToken(item.category)}</span>
          {item.standard ? <span className={styles.tag}>{item.standard}</span> : null}
          {item.needs_layout_upgrade ? <span className={styles.upgradeTag}>{copy.layoutUpgradeAvailable}</span> : null}
          <ItemStatus item={item} language={language} />
        </div>
        <button aria-pressed={selected} className={styles.cardTitleButton} onClick={onSelect} type="button">
          <h4>{item.title}</h4>
          <p>{item.description}</p>
        </button>
      </div>
      <div className={styles.cardFooter}>
        {canStart || canRegenerate ? (
          <button
            className={`${styles.cardAction} ${canStart ? styles.cardActionPrimary : ""}`}
            disabled={working}
            onClick={() => onGenerate(generationReason)}
            type="button"
          >
            {canRegenerate ? <RefreshCw aria-hidden="true" size={12} /> : <Sparkles aria-hidden="true" size={12} />}
            {canUpgradeLayout ? copy.layoutUpgrade : canRegenerate ? copy.regenerate : copy.generate}
          </button>
        ) : (
          <button className={styles.cardAction} onClick={onSelect} type="button">
            {copy.viewDetail} <ArrowRight aria-hidden="true" size={12} />
          </button>
        )}
      </div>
    </article>
  );
}

function ViewerState({ item, language, onGenerate }: { item: DiagramCatalogItem; language: SupportedLanguage; onGenerate: () => void }) {
  const copy = DIAGRAM_COPY[language];
  const working = ["queued", "generating", "updating"].includes(item.generation_state);
  const isError = item.generation_state === "error";
  const Icon = working ? LoaderCircle : isError ? FileWarning : item.access.can_generate ? Sparkles : LockKeyhole;
  const title = working
    ? GENERATION_LABELS[language][item.generation_state]
    : isError
      ? copy.generationNeedsAttention
      : item.access.can_generate
        ? copy.readyToGenerate
        : ACCESS_LABELS[language][item.access.access_state];
  const description = working
    ? copy.workingDesc
    : isError
      ? copy.errorDesc
      : item.needs_layout_upgrade
        ? (item.layout_upgrade_reason || copy.layoutUpgradeDesc)
      : item.access.reason;
  return (
    <div className={styles.statePanel}>
      <div>
        <Icon aria-hidden="true" className={working ? "animate-spin" : ""} size={28} />
        <h4>{title}</h4>
        <p>{description}</p>
        {item.access.can_generate && !working ? (
          <UxaButton onClick={onGenerate} size="sm" variant="primary">
            <Sparkles aria-hidden="true" className="h-3.5 w-3.5" /> {copy.generateDiagram}
          </UxaButton>
        ) : item.access.cta_label ? (
          <UxaButton size="sm" variant="secondary">{item.access.cta_label}</UxaButton>
        ) : null}
      </div>
    </div>
  );
}

export function DiagramCenterPage({
  projectId,
  catalogFilter,
  title,
  subtitle,
  engineLabel,
  initialViewMode = "grid",
}: DiagramCenterPageProps) {
  const { language } = useLanguage();
  const copy = DIAGRAM_COPY[language];
  const {
    catalog,
    catalogStatus,
    compare,
    comparison,
    detail,
    detailStatus,
    download,
    error,
    generate,
    loadCatalog,
    loadDetail,
    selectedKey,
    setSelectedKey,
  } = useDiagramCenter(projectId);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [stage, setStage] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [canvasZoomMode, setCanvasZoomMode] = useState<CanvasZoomMode>("fit");
  const [baseVersionId, setBaseVersionId] = useState("");
  const [targetVersionId, setTargetVersionId] = useState("");
  const [selectedVersionId, setSelectedVersionId] = useState("");

  const catalogEntries = useMemo(() => catalog?.entries ?? [], [catalog?.entries]);
  const entries = useMemo(
    () => (catalogFilter ? catalogEntries.filter(catalogFilter) : catalogEntries),
    [catalogEntries, catalogFilter],
  );
  const summary = useMemo(
    () => ({
      available: entries.filter((item) => item.access.access_state === "available").length,
      locked: entries.filter((item) => ["disabled", "locked", "stage_locked"].includes(item.access.access_state)).length,
      total: entries.length,
    }),
    [entries],
  );
  const categories = useMemo(() => [...new Set(entries.map((item) => item.category))].sort(), [entries]);
  const stages = useMemo(() => [...new Set(entries.map((item) => item.stage))].sort(), [entries]);
  const types = useMemo(() => [...new Set(entries.map((item) => item.type))].sort(), [entries]);
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es");
    return entries.filter((item) => {
      const text = `${item.title} ${item.description} ${item.benefit} ${item.category} ${item.type}`.toLocaleLowerCase("es");
      return (
        (!normalizedQuery || text.includes(normalizedQuery)) &&
        (category === "all" || item.category === category) &&
        (stage === "all" || item.stage === stage) &&
        (typeFilter === "all" || item.type === typeFilter) &&
        (availability === "all" || item.access.access_state === availability)
      );
    });
  }, [availability, category, entries, query, stage, typeFilter]);
  const selectedItem = entries.find((item) => item.key === selectedKey) ?? null;
  const detailMatchesSelected = detail?.item.key === selectedItem?.key;
  const svgSource = detailMatchesSelected && detail?.renderings.svg
    ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(detail.renderings.svg)}`
    : "";
  const canvasZoomLabels = CANVAS_ZOOM_LABELS[language];
  const canvasClassName = `${styles.canvas} ${styles[`canvas_${canvasZoomMode}`]}`;
  const versions = detailMatchesSelected ? detail?.versions ?? [] : [];

  useEffect(() => {
    if (!entries.length) {
      return;
    }
    if (!selectedKey || !entries.some((item) => item.key === selectedKey)) {
      setSelectedKey(entries[0].key);
    }
  }, [entries, selectedKey, setSelectedKey]);

  function selectItem(item: DiagramCatalogItem) {
    setSelectedKey(item.key);
    setBaseVersionId("");
    setTargetVersionId("");
    setSelectedVersionId("");
  }

  async function startGeneration(reason: DiagramGenerationReason = "user_request") {
    if (!selectedItem) return;
    await generate(selectedItem.key, reason);
  }

  return (
    <section aria-labelledby="diagram-center-title" className={styles.root}>
      <header className={styles.hero}>
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <div>
            <h2 id="diagram-center-title" className="text-[16px] font-bold text-[var(--text-primary)]">{title ?? copy.title}</h2>
            {subtitle ? <p className="mt-1 max-w-2xl text-[11px] leading-5 text-[var(--text-secondary)]">{subtitle}</p> : null}
          </div>
          <span className={styles.eyebrow}>{engineLabel ?? copy.engine}</span>
        </div>
        <div aria-label="Resumen del catálogo" className={styles.summary}>
          <div className={styles.summaryItem}><strong>{catalogStatus === "loading" && !catalog ? "—" : summary.total}</strong><span>{copy.inCatalog}</span></div>
          <div className={styles.summaryItem}><strong>{catalogStatus === "loading" && !catalog ? "—" : summary.available}</strong><span>{copy.availableCount}</span></div>
          <div className={styles.summaryItem}><strong>{catalogStatus === "loading" && !catalog ? "—" : summary.locked}</strong><span>{copy.lockedCount}</span></div>
        </div>
      </header>

      {error ? (
        <div className={styles.errorBanner} role="alert">
          <span>{error}</span>
          <button className={styles.cardAction} onClick={() => void loadCatalog()} type="button">{copy.retry}</button>
        </div>
      ) : null}

      <div aria-label="Filtros del catálogo" className={styles.toolbar}>
        <div className={styles.fieldWrap}>
          <Search aria-hidden="true" className={styles.fieldIcon} />
          <input
            aria-label={copy.search}
            className={styles.input}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.searchPlaceholder}
            type="search"
            value={query}
          />
        </div>
        <select aria-label="Filtrar por categoría" className={styles.select} onChange={(event) => setCategory(event.target.value)} value={category}>
          <option value="all">{copy.allCategories}</option>
          {categories.map((value) => <option key={value} value={value}>{formatToken(value)}</option>)}
        </select>
        <select aria-label="Filtrar por etapa LEAN" className={styles.select} onChange={(event) => setStage(event.target.value)} value={stage}>
          <option value="all">{copy.allStages}</option>
          {stages.map((value) => <option key={value} value={value}>{formatToken(value)}</option>)}
        </select>
        <select aria-label="Filtrar por tipo de diagrama" className={styles.select} onChange={(event) => setTypeFilter(event.target.value)} value={typeFilter}>
          <option value="all">{copy.allTypes}</option>
          {types.map((value) => <option key={value} value={value}>{formatToken(value)}</option>)}
        </select>
        <select aria-label="Filtrar por disponibilidad" className={styles.select} onChange={(event) => setAvailability(event.target.value)} value={availability}>
          <option value="all">{copy.allAvailability}</option>
          <option value="available">{ACCESS_LABELS[language].available}</option>
          <option value="preview">{ACCESS_LABELS[language].preview}</option>
          <option value="locked">{ACCESS_LABELS[language].locked}</option>
          <option value="stage_locked">{ACCESS_LABELS[language].stage_locked}</option>
        </select>
        <div aria-label="Modo de visualización" className={styles.viewToggle} role="group">
          <button aria-label="Vista en tarjetas" aria-pressed={viewMode === "grid"} className={`${styles.iconButton} ${viewMode === "grid" ? styles.iconButtonActive : ""}`} onClick={() => setViewMode("grid")} type="button"><Grid2X2 aria-hidden="true" size={15} /></button>
          <button aria-label="Vista en lista" aria-pressed={viewMode === "list"} className={`${styles.iconButton} ${viewMode === "list" ? styles.iconButtonActive : ""}`} onClick={() => setViewMode("list")} type="button"><LayoutList aria-hidden="true" size={15} /></button>
        </div>
      </div>

      <div className={styles.workspace}>
        <section aria-label="Catálogo de diagramas" className={styles.catalogPane}>
          <div className={styles.paneHeader}>
            <div><h3>{copy.catalog}</h3><p>{filtered.length} / {entries.length}</p></div>
            <span className={styles.tag}>{copy.provider}: {formatToken(catalog?.provider_key ?? "loading")}</span>
          </div>
          {catalogStatus === "loading" && !catalog ? (
            <div className={styles.catalogGrid}>{Array.from({ length: 6 }, (_, index) => <div className={styles.skeleton} key={index} />)}</div>
          ) : filtered.length ? (
            <div className={viewMode === "grid" ? styles.catalogGrid : styles.catalogList}>
              {filtered.map((item) => (
                <CatalogCard
                  item={item}
                  key={item.key}
                  onGenerate={(reason) => {
                    selectItem(item);
                    void generate(item.key, reason);
                  }}
                  onSelect={() => selectItem(item)}
                  selected={selectedKey === item.key}
                  language={language}
                  viewMode={viewMode}
                />
              ))}
            </div>
          ) : (
            <div className={styles.statePanel}><div><Boxes aria-hidden="true" size={28} /><h4>{copy.noMatchesTitle}</h4><p>{copy.noMatchesDesc}</p></div></div>
          )}
        </section>

        <aside aria-label="Vista previa del diagrama" className={styles.viewerPane}>
          <div className={styles.paneHeader}>
            <div><h3>{copy.viewer}</h3><p>{selectedItem ? formatDate(selectedItem.updated_at, language) : copy.selectDiagram}</p></div>
            {selectedItem ? <ItemStatus item={selectedItem} language={language} /> : null}
          </div>
          {selectedItem ? (
            <div className={styles.viewerBody}>
              <div>
                <h3 className={styles.viewerTitle}>{selectedItem.title}</h3>
                <p className={styles.viewerDescription}>{selectedItem.benefit}</p>
              </div>
              <div className={styles.viewerMeta}>
                <span className={styles.tag}>{formatToken(selectedItem.category)}</span>
                {selectedItem.standard ? <span className={styles.tag}>{selectedItem.standard}</span> : null}
                {selectedItem.source_contract ? <span className={styles.tag}>{selectedItem.source_contract}</span> : null}
                <span className={styles.tag}>{formatToken(selectedItem.stage)}</span>
                <span className={styles.tag}>{formatToken(selectedItem.complexity)}</span>
                <span className={styles.tag}>{formatToken(selectedItem.required_tier)}</span>
              </div>
              {detailStatus === "loading" ? (
                <div className={styles.skeleton} />
              ) : detailMatchesSelected && detail?.model && svgSource ? (
                <>
                  <div aria-label="Controles de visualizacion del diagrama" className={styles.canvasToolbar} role="group">
                    {(["fit", "actual", "wide"] as CanvasZoomMode[]).map((mode) => (
                      <button
                        aria-pressed={canvasZoomMode === mode}
                        className={`${styles.canvasTool} ${canvasZoomMode === mode ? styles.canvasToolActive : ""}`}
                        key={mode}
                        onClick={() => setCanvasZoomMode(mode)}
                        type="button"
                      >
                        {canvasZoomLabels[mode]}
                      </button>
                    ))}
                  </div>
                  <div
                    aria-label={`Vista desplazable de ${detail.model.title}`}
                    className={canvasClassName}
                    onContextMenu={!selectedItem.access.can_download ? (e) => e.preventDefault() : undefined}
                    role="region"
                    tabIndex={0}
                  >
                    {/* SVG travels as an image resource; scripts and active markup are not injected into the DOM. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={`Diagrama ${detail.model.title}`}
                      className={!selectedItem.access.can_download ? "select-none pointer-events-none" : undefined}
                      draggable={selectedItem.access.can_download}
                      onContextMenu={!selectedItem.access.can_download ? (e) => e.preventDefault() : undefined}
                      onDragStart={!selectedItem.access.can_download ? (e) => e.preventDefault() : undefined}
                      src={svgSource}
                    />
                    {selectedItem.access.access_state === "preview" ? <span className={styles.watermark}>{copy.preview}</span> : null}
                  </div>
                  {detail.quality ? (
                    <div className={styles.quality}>
                      <span className={styles.qualityScore}>{detail.quality.score}</span>
                      <div><strong>{copy.qualityTitle}</strong><p>{detail.quality.warnings[0] ?? copy.qualityOk}</p></div>
                    </div>
                  ) : null}
                </>
              ) : (
                <ViewerState item={selectedItem} language={language} onGenerate={() => void startGeneration("user_request")} />
              )}

              <div className={styles.actionRow}>
                {selectedItem.access.can_regenerate && selectedItem.current_version ? (
                  <UxaButton
                    onClick={() => void startGeneration(selectedItem.needs_layout_upgrade ? "layout_upgrade" : "regenerate")}
                    size="sm"
                    variant="primary"
                  >
                    <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" /> {selectedItem.needs_layout_upgrade ? copy.layoutUpgrade : copy.regenerate}
                  </UxaButton>
                ) : null}
                {selectedItem.access.can_download && selectedItem.current_version ? (
                  <UxaButton onClick={() => void download(selectedItem.key, "svg")} size="sm" variant="secondary"><Download aria-hidden="true" className="h-3.5 w-3.5" /> SVG</UxaButton>
                ) : null}
                {selectedItem.access.can_download && selectedItem.current_version ? (
                  <UxaButton onClick={() => void download(selectedItem.key, "json")} size="sm" variant="ghost">JSON</UxaButton>
                ) : null}
                {!selectedItem.access.can_download && selectedItem.current_version ? (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-[var(--uxa-radius-sm)] border border-slate-200 bg-slate-100/80 px-2.5 py-1 text-[11px] font-semibold text-slate-500 cursor-not-allowed"
                    title={language === "es" ? "Descarga y exportación disponibles en Blueprint Pro y ACP" : "Download & export available in Blueprint Pro & ACP"}
                  >
                    <LockKeyhole className="h-3 w-3 text-slate-400" />
                    {language === "es" ? "Descarga protegida (Blueprint Pro)" : "Protected download (Blueprint Pro)"}
                  </span>
                ) : null}
              </div>

              {selectedItem.access.can_compare && versions.length > 1 ? (
                <div className={styles.comparePanel}>
                  <div><h3 className={styles.viewerTitle}>{copy.compareTitle}</h3><p className={styles.viewerDescription}>{copy.compareDesc}</p></div>
                  <div className={styles.compareSelectors}>
                    <select aria-label="Versión base" className={styles.select} onChange={(event) => setBaseVersionId(event.target.value)} value={baseVersionId}>
                      <option value="">{copy.baseVersion}</option>
                      {versions.map((version) => <option key={version.id} value={version.id}>v{version.version_number} · {version.quality_score}/100</option>)}
                    </select>
                    <select aria-label="Versión objetivo" className={styles.select} onChange={(event) => setTargetVersionId(event.target.value)} value={targetVersionId}>
                      <option value="">{copy.targetVersion}</option>
                      {versions.map((version) => <option key={version.id} value={version.id}>v{version.version_number} · {version.quality_score}/100</option>)}
                    </select>
                    <button className={styles.cardAction} disabled={!baseVersionId || !targetVersionId || baseVersionId === targetVersionId} onClick={() => void compare(selectedItem.key, baseVersionId, targetVersionId)} type="button"><GitCompareArrows aria-hidden="true" size={13} /> {copy.compare}</button>
                  </div>
                  {comparison ? (
                    <div className={styles.diffList}>
                      <div className={styles.diffItem}><strong>+{comparison.added_nodes.length}</strong><br />{copy.added}</div>
                      <div className={styles.diffItem}><strong>−{comparison.removed_nodes.length}</strong><br />{copy.removed}</div>
                      <div className={styles.diffItem}><strong>{comparison.changed_nodes.length}</strong><br />{copy.changed}</div>
                    </div>
                  ) : null}
                </div>
              ) : null}
              {versions.length ? (
                <select
                  aria-label="Consultar otra versión"
                  className={styles.select}
                  onChange={(event) => {
                    setSelectedVersionId(event.target.value);
                    void loadDetail(selectedItem.key, event.target.value);
                  }}
                  value={selectedVersionId || versions[0]?.id || ""}
                >
                  {versions.map((version) => <option key={version.id} value={version.id}>{copy.version} {version.version_number} · {formatDate(version.created_at, language)} · {formatToken(version.provider_key)}</option>)}
                </select>
              ) : null}
            </div>
          ) : (
            <div className={styles.viewerBody}><div className={styles.statePanel}><div><Boxes aria-hidden="true" size={28} /><h4>{copy.selectDiagram}</h4><p>{copy.viewerDesc}</p></div></div></div>
          )}
        </aside>
      </div>
    </section>
  );
}
