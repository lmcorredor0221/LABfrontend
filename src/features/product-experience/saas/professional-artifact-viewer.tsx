"use client";

import React, { useState } from "react";
import {
  FileText,
  LockKeyhole,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  Copy,
  Check,
  TrendingUp,
  Clock,
  DollarSign,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "@/core/i18n/language-context";
import diagramCenterStyles from "@/features/diagram-center/presentation/diagram-center.module.css";
import { byLanguage } from "@/features/product-experience/core/localized-copy";
import { cn } from "@/lib/utils";

export type ProfessionalArtifactViewerProps = {
  canCopy?: boolean;
  canDownload?: boolean;
  className?: string;
  contentText?: string;
  description?: string;
  detail?: string;
  exportFormat?: string;
  metadata?: Record<string, unknown>;
  protectedView?: boolean;
  stage?: string;
  title: string;
  versionLabel?: string;
};

type TableBlock = {
  headers: string[];
  rows: string[][];
};

type ParsedBlock =
  | { type: "paragraph"; text: string }
  | { type: "list_item"; label?: string; value: string; isOrdered?: boolean; orderNum?: string }
  | { type: "callout"; tone: "info" | "warning" | "danger" | "success" | "indigo"; title?: string; text: string }
  | { type: "table"; table: TableBlock }
  | { type: "code"; code: string; language?: string };

type ParsedSection = {
  blocks: ParsedBlock[];
  rawBody: string[];
  title: string;
};

type CommercialKpi = {
  detail: string;
  icon?: string;
  label: string;
  tone?: "success" | "info" | "warning" | "brand";
  trend?: string;
  value: string;
};

type ParsedDocument = {
  kpis: CommercialKpi[];
  sections: ParsedSection[];
  summary: string;
  title: string;
  traceability: string[];
};

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asTextList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function stripSourceWrappers(content: string): string {
  return content
    .replace(/^```(?:markdown|md|json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

function renderFormattedInlineText(text: string): React.ReactNode {
  if (!text) return null;

  // Split by inline code `code`
  const codeParts = text.split(/`([^`]+)`/g);
  return codeParts.map((part, index) => {
    if (index % 2 === 1) {
      return (
        <code
          className="mx-1 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-indigo-700 ring-1 ring-inset ring-slate-200"
          key={index}
        >
          {part}
        </code>
      );
    }

    // Split by **bold**
    const boldParts = part.split(/\*\*([^*]+)\*\*/g);
    return (
      <span key={index}>
        {boldParts.map((boldPart, bIndex) => {
          if (bIndex % 2 === 1) {
            return (
              <strong className="font-bold text-[var(--uxa-color-ink)]" key={bIndex}>
                {boldPart}
              </strong>
            );
          }
          return boldPart;
        })}
      </span>
    );
  });
}

function parseBlocks(rawLines: string[]): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  let i = 0;

  while (i < rawLines.length) {
    const rawLine = rawLines[i].trim();
    if (!rawLine) {
      i++;
      continue;
    }

    // Check for Markdown table: line starts and ends with '|'
    if (rawLine.startsWith("|") && rawLine.endsWith("|")) {
      const tableLines: string[] = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith("|") && rawLines[i].trim().endsWith("|")) {
        tableLines.push(rawLines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        const headerRow = tableLines[0]
          .split("|")
          .map((c) => c.trim())
          .filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
        const isSeparator = tableLines[1].replace(/[-| :]/g, "").length === 0;
        const dataRows = tableLines.slice(isSeparator ? 2 : 1).map((r) =>
          r
            .split("|")
            .map((c) => c.trim())
            .filter((c, idx, arr) => idx > 0 && idx < arr.length - 1),
        );
        blocks.push({
          type: "table",
          table: { headers: headerRow, rows: dataRows },
        });
        continue;
      }
    }

    // Check for Callout / Alert banner
    const calloutMatch =
      rawLine.match(/^>\s*\[!(NOTE|IMPORTANT|WARNING|CAUTION|TIP)\]\s*(.*)$/i) ||
      rawLine.match(/^>\s*(🛡️|⚠️|💡|🔒|ℹ️)?\s*(.*)$/);

    if (rawLine.startsWith(">") && calloutMatch) {
      const calloutLines: string[] = [];
      let alertTag = "";
      const tagCheck = rawLine.match(/^>\s*\[!(NOTE|IMPORTANT|WARNING|CAUTION|TIP)\]\s*(.*)$/i);
      if (tagCheck) {
        alertTag = tagCheck[1].toUpperCase();
        if (tagCheck[2].trim()) calloutLines.push(tagCheck[2].trim());
      } else {
        calloutLines.push(rawLine.replace(/^>\s*/, "").trim());
      }
      i++;

      while (i < rawLines.length && rawLines[i].trim().startsWith(">")) {
        calloutLines.push(rawLines[i].trim().replace(/^>\s*/, "").trim());
        i++;
      }

      let tone: "info" | "warning" | "danger" | "success" | "indigo" = "indigo";
      let title = "";
      if (alertTag === "WARNING" || alertTag === "CAUTION") {
        tone = "warning";
        title = "Punto de Control & Alerta";
      } else if (alertTag === "IMPORTANT") {
        tone = "danger";
        title = "Requerimiento Crítico";
      } else if (alertTag === "NOTE" || alertTag === "TIP") {
        tone = "info";
        title = "Nota de Implementación";
      } else if (calloutLines.some((l) => l.includes("Human-in-the-Loop") || l.includes("HITL"))) {
        tone = "warning";
        title = "Gobernanza Human-in-the-Loop (HITL)";
      } else if (calloutLines.some((l) => l.includes("North Star") || l.includes("Métrica North Star"))) {
        tone = "indigo";
        title = "Métrica North Star";
      }

      blocks.push({
        type: "callout",
        tone,
        title,
        text: calloutLines.join(" "),
      });
      continue;
    }

    // Check for List items with bold label (- **Label:** Value or 1. **Label:** Value)
    const keyValueMatch = rawLine.match(/^([-*]|\d+\.)\s+\*\*([^*]+)\*\*:?\s*(.*)$/);
    if (keyValueMatch) {
      blocks.push({
        type: "list_item",
        isOrdered: /^\d+\./.test(keyValueMatch[1]),
        orderNum: keyValueMatch[1],
        label: keyValueMatch[2].trim(),
        value: keyValueMatch[3].trim(),
      });
      i++;
      continue;
    }

    // Check for Standard bullet list item (- Item or * Item)
    const bulletMatch = rawLine.match(/^([-*])\s+(.+)$/);
    if (bulletMatch) {
      blocks.push({
        type: "list_item",
        isOrdered: false,
        value: bulletMatch[2].trim(),
      });
      i++;
      continue;
    }

    // Check for Standard numbered list item (1. Item)
    const numberedMatch = rawLine.match(/^(\d+\.)\s+(.+)$/);
    if (numberedMatch) {
      blocks.push({
        type: "list_item",
        isOrdered: true,
        orderNum: numberedMatch[1],
        value: numberedMatch[2].trim(),
      });
      i++;
      continue;
    }

    // Standard Paragraph
    blocks.push({
      type: "paragraph",
      text: rawLine,
    });
    i++;
  }

  return blocks;
}

function extractCommercialKpis(text: string): CommercialKpi[] {
  const kpis: CommercialKpi[] = [];

  // 1. Ahorro Neto
  const savingsMatch = text.match(/Ahorro Neto(?: Proyectado)?:\s*\*\*?([^\n*]+)\*\*?/i);
  if (savingsMatch) {
    kpis.push({
      label: "Ahorro Neto Proyectado",
      value: savingsMatch[1].trim(),
      detail: "Reducción directa en costo de desarrollo",
      trend: "Ahorro directo",
      tone: "success",
      icon: "dollar",
    });
  }

  // 2. Horas Agénticas vs Tradicionales
  const hoursMatch = text.match(/Horas de Desarrollo Agéntico:\s*\*\*?([^\n*]+)\*\*?/i);
  if (hoursMatch) {
    kpis.push({
      label: "Horas Agénticas vs Trad.",
      value: hoursMatch[1].trim(),
      detail: "Aceleración en tiempo de construcción",
      trend: "Acelerado",
      tone: "brand",
      icon: "clock",
    });
  }

  // 3. Cobertura de Automatización
  const autoMatch = text.match(/(?:Nivel|Grado|Cobertura) de Automatización:\s*\*\*?([^\n*]+)\*\*?/i);
  if (autoMatch) {
    kpis.push({
      label: "Cobertura de Automatización",
      value: autoMatch[1].trim(),
      detail: "Procesos cubiertos por el agente",
      trend: "Gobernado",
      tone: "info",
      icon: "trending",
    });
  }

  // 4. Nivel de Confianza
  const confMatch = text.match(/Nivel de Confianza(?: de la Estimación)?:\s*\*\*?([^\n*]+)\*\*?/i);
  if (confMatch) {
    kpis.push({
      label: "Confianza de Estimación",
      value: confMatch[1].trim(),
      detail: "Banda de certidumbre de alcance",
      trend: "Alta",
      tone: "warning",
      icon: "shield",
    });
  }

  return kpis;
}

function parseMarkdownDocument(content: string, fallbackTitle: string, fallbackSummary: string): ParsedDocument {
  const clean = stripSourceWrappers(content);
  const lines = clean.split(/\r?\n/);
  let title = fallbackTitle;
  let summary = fallbackSummary;
  const sections: ParsedSection[] = [];
  let currentTitle = "";
  let currentRawLines: string[] = [];
  const intro: string[] = [];

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) return;

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      const headingText = heading[2].trim();
      if (heading[1] === "#" && title === fallbackTitle) {
        title = headingText;
        return;
      }

      if (currentTitle || currentRawLines.length) {
        sections.push({
          title: currentTitle || "Resumen Operativo",
          rawBody: currentRawLines,
          blocks: parseBlocks(currentRawLines),
        });
        currentRawLines = [];
      }
      currentTitle = headingText;
      return;
    }

    if (currentTitle) {
      currentRawLines.push(line);
    } else {
      intro.push(line);
    }
  });

  if (currentTitle || currentRawLines.length) {
    sections.push({
      title: currentTitle || "Resumen Operativo",
      rawBody: currentRawLines,
      blocks: parseBlocks(currentRawLines),
    });
  }

  if (!summary && intro.length) {
    summary = intro.slice(0, 2).join(" ").replace(/[*#]/g, "").trim();
  }

  const populatedSections = sections.filter((s) => s.blocks.length > 0);
  const finalSections = populatedSections.length
    ? populatedSections
    : [
        {
          title: "Contenido Principal",
          rawBody: intro,
          blocks: parseBlocks(intro.length ? intro : [fallbackSummary || fallbackTitle]),
        },
      ];

  const kpis = extractCommercialKpis(clean);

  return {
    title,
    summary: summary || fallbackSummary || clean.slice(0, 240),
    sections: finalSections,
    kpis,
    traceability: [],
  };
}

function tryParseProfessionalJson(content: string, fallbackTitle: string): ParsedDocument | null {
  try {
    const payload = JSON.parse(content) as Record<string, unknown>;
    const title = asText(payload.title) || fallbackTitle;
    const summary =
      asText(payload.executive_summary) || asText(payload.summary) || asText(payload.description) || "";
    const rawSections = Array.isArray(payload.sections) ? payload.sections : [];
    const sections: ParsedSection[] = rawSections
      .map((section, index) => {
        if (typeof section === "string") {
          return {
            title: `${index + 1}. ${fallbackTitle}`,
            rawBody: [section],
            blocks: parseBlocks([section]),
          };
        }
        if (!section || typeof section !== "object") return null;
        const record = section as Record<string, unknown>;
        const items = asTextList(record.items);
        const body = [asText(record.summary), asText(record.body), asText(record.content), ...items].filter(Boolean);
        return {
          title: asText(record.title) || asText(record.heading) || `${index + 1}. Sección`,
          rawBody: body.length ? body : [summary || fallbackTitle],
          blocks: parseBlocks(body.length ? body : [summary || fallbackTitle]),
        };
      })
      .filter((s): s is ParsedSection => Boolean(s));

    const traceability = [
      ...asTextList(payload.source_refs),
      ...asTextList(payload.traceability),
      ...asTextList(payload.inherits_from),
    ];

    return {
      title,
      summary,
      sections: sections.length
        ? sections
        : [
            {
              title: "Contenido Principal",
              rawBody: [summary || fallbackTitle],
              blocks: parseBlocks([summary || fallbackTitle]),
            },
          ],
      kpis: extractCommercialKpis(content),
      traceability: Array.from(new Set(traceability)),
    };
  } catch {
    return null;
  }
}

function buildDocument({
  contentText,
  description,
  detail,
  metadata,
  title,
}: Pick<ProfessionalArtifactViewerProps, "contentText" | "description" | "detail" | "metadata" | "title">): ParsedDocument {
  const content = stripSourceWrappers(contentText || detail || "");
  const fallbackSummary = asText(metadata?.purpose) || description || detail || "";
  const jsonDocument = content ? tryParseProfessionalJson(content, title) : null;
  const parsed = jsonDocument ?? parseMarkdownDocument(content || fallbackSummary, title, fallbackSummary);
  const traceability = [
    ...parsed.traceability,
    ...asTextList(metadata?.source_refs),
    ...asTextList(metadata?.inherits_from),
    ...asTextList(metadata?.traceability),
  ];

  return {
    ...parsed,
    traceability: Array.from(new Set(traceability)).slice(0, 8),
  };
}

export function ProfessionalArtifactViewer({
  canCopy,
  canDownload: _canDownload,
  className,
  contentText,
  description,
  detail,
  exportFormat,
  metadata = {},
  protectedView = true,
  stage,
  title,
  versionLabel,
}: ProfessionalArtifactViewerProps) {
  const { language } = useLanguage();
  const document = buildDocument({ contentText, description, detail, metadata, title });
  const [copied, setCopied] = useState(false);

  const allowCopy = !protectedView || canCopy === true;

  const blockProtectedEvent = !allowCopy
    ? (event: { preventDefault: () => void }) => {
        event.preventDefault();
      }
    : undefined;

  const handleCopy = () => {
    if (!allowCopy) return;
    const rawToCopy = contentText || detail || description || "";
    if (navigator.clipboard && rawToCopy) {
      navigator.clipboard.writeText(rawToCopy).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <article
      className={cn(
        allowCopy ? "select-text" : "select-none",
        "rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-white shadow-[var(--uxa-shadow-soft)] overflow-hidden",
        className,
      )}
      onContextMenu={blockProtectedEvent}
      onCopy={blockProtectedEvent}
      onCut={blockProtectedEvent}
      onDragStart={blockProtectedEvent}
    >
      {/* ── Document Header ── */}
      <header className="border-b border-[var(--uxa-color-border-soft)] bg-slate-50/40 p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-[12px] bg-[var(--uxa-color-brand-soft)] text-[var(--uxa-color-brand)] shadow-sm">
              <FileText aria-hidden="true" className="h-4.5 w-4.5" />
            </span>
            <span className={diagramCenterStyles.tag}>{exportFormat || "document"}</span>
            {stage ? <span className={diagramCenterStyles.tag}>{stage}</span> : null}
            {versionLabel ? <span className={diagramCenterStyles.tag}>{versionLabel}</span> : null}
            {protectedView ? (
              <span className={`${diagramCenterStyles.status} ${diagramCenterStyles.statusLocked}`}>
                <LockKeyhole aria-hidden="true" className="h-3 w-3" />
                {byLanguage(language, { en: "Protected view", es: "Vista protegida", pt: "Vista protegida" })}
              </span>
            ) : null}
          </div>

          {allowCopy ? (
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-[var(--uxa-radius-sm)] border border-[var(--uxa-color-border-soft)] bg-white px-3 py-1.5 text-[11px] font-bold text-[var(--uxa-color-ink)] shadow-sm hover:bg-slate-50 transition"
              title="Copiar texto del artefacto"
              type="button"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-[var(--uxa-color-ink-muted)]" />}
              {copied ? byLanguage(language, { en: "Copied", es: "Copiado", pt: "Copiado" }) : byLanguage(language, { en: "Copy text", es: "Copiar texto", pt: "Copiar texto" })}
            </button>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 rounded-[var(--uxa-radius-sm)] border border-slate-200 bg-slate-100/80 px-2.5 py-1 text-[11px] font-semibold text-slate-500 cursor-not-allowed"
              title={byLanguage(language, {
                en: "Copying text is available in Blueprint Pro & ACP",
                es: "La copia de texto está disponible en Blueprint Pro y ACP",
                pt: "A cópia de texto está disponível no Blueprint Pro e ACP",
              })}
            >
              <LockKeyhole className="h-3 w-3 text-slate-400" />
              {byLanguage(language, { en: "Protected text", es: "Texto protegido", pt: "Texto protegido" })}
            </span>
          )}
        </div>

        <h3 className="mt-4 text-[22px] font-black leading-tight text-[var(--uxa-color-ink)]">{document.title}</h3>
        <p className="mt-2.5 max-w-3xl text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">
          {document.summary ||
            byLanguage(language, {
              en: "Professional artifact generated from approved Blueprint context.",
              es: "Artefacto profesional generado desde el contexto aprobado del Blueprint.",
              pt: "Artefato profissional gerado a partir do contexto aprovado do Blueprint.",
            })}
        </p>
      </header>

      {/* ── Document Body ── */}
      <div className="space-y-5 p-5 md:p-6">
        {/* Bento KPI Row (Only shown if document contains commercial / estimation KPIs) */}
        {document.kpis.length > 0 && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 pb-2">
            {document.kpis.map((kpi, kIdx) => (
              <div
                className="rounded-[var(--uxa-radius-md)] border border-slate-200/90 bg-white p-3.5 shadow-sm transition hover:shadow-md"
                key={kIdx}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-mono text-[10px] font-black uppercase tracking-[.12em] text-[var(--uxa-color-ink-muted)]">
                    {kpi.label}
                  </span>
                  {kpi.icon === "dollar" && <DollarSign className="h-3.5 w-3.5 text-emerald-600" />}
                  {kpi.icon === "clock" && <Clock className="h-3.5 w-3.5 text-indigo-600" />}
                  {kpi.icon === "trending" && <TrendingUp className="h-3.5 w-3.5 text-blue-600" />}
                  {kpi.icon === "shield" && <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />}
                </div>
                <p className="mt-2 text-[18px] font-black tracking-tight text-[var(--uxa-color-ink)] md:text-[20px]">
                  {kpi.value}
                </p>
                <div className="mt-1 flex items-center justify-between text-[11px] text-[var(--uxa-color-ink-soft)]">
                  <span className="line-clamp-1">{kpi.detail}</span>
                  {kpi.trend && (
                    <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-200">
                      {kpi.trend}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sections Stream */}
        {document.sections.map((section, sIdx) => (
          <section
            className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border-soft)] bg-white p-5 shadow-sm space-y-3.5"
            key={`${section.title}-${sIdx}`}
          >
            <h4 className="text-[15px] font-black text-[var(--uxa-color-ink)] border-b border-slate-100 pb-2 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--uxa-color-brand)]" />
              {section.title}
            </h4>

            <div className="space-y-3 text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">
              {section.blocks.map((block, bIdx) => {
                if (block.type === "callout") {
                  const isWarning = block.tone === "warning";
                  const isDanger = block.tone === "danger";
                  const isSuccess = block.tone === "success";

                  return (
                    <div
                      className={cn(
                        "rounded-[var(--uxa-radius-md)] border p-4 shadow-xs",
                        isWarning && "border-amber-300 bg-amber-50/70 text-amber-950",
                        isDanger && "border-rose-300 bg-rose-50/70 text-rose-950",
                        isSuccess && "border-emerald-300 bg-emerald-50/70 text-emerald-950",
                        !isWarning && !isDanger && !isSuccess && "border-indigo-200 bg-indigo-50/60 text-indigo-950",
                      )}
                      key={bIdx}
                    >
                      <div className="flex items-start gap-2.5">
                        {isWarning && <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-amber-600 mt-0.5" />}
                        {isDanger && <ShieldAlert className="h-4.5 w-4.5 shrink-0 text-rose-600 mt-0.5" />}
                        {isSuccess && <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-600 mt-0.5" />}
                        {!isWarning && !isDanger && !isSuccess && <Sparkles className="h-4.5 w-4.5 shrink-0 text-indigo-600 mt-0.5" />}
                        <div className="space-y-1">
                          {block.title && <p className="font-bold text-[12px] uppercase tracking-wider">{block.title}</p>}
                          <p className="text-[12.5px] leading-relaxed">{renderFormattedInlineText(block.text)}</p>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (block.type === "table") {
                  return (
                    <div className="overflow-x-auto rounded-[var(--uxa-radius-md)] border border-slate-200 shadow-xs my-2" key={bIdx}>
                      <table className="w-full text-left text-[12px]">
                        <thead className="bg-slate-100/90 font-bold uppercase tracking-wider text-[var(--uxa-color-ink)] border-b border-slate-200">
                          <tr>
                            {block.table.headers.map((header, hIdx) => (
                              <th className="px-3.5 py-2.5" key={hIdx}>
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {block.table.rows.map((row, rIdx) => (
                            <tr className={rIdx % 2 === 1 ? "bg-slate-50/50" : "bg-white"} key={rIdx}>
                              {row.map((cell, cIdx) => {
                                const isSavingsCell = cell.includes("Ahorro") || cell.includes("COP") && cIdx >= 2;
                                return (
                                  <td
                                    className={cn(
                                      "px-3.5 py-2.5 text-slate-700",
                                      cIdx === 0 && "font-bold text-[var(--uxa-color-ink)]",
                                      isSavingsCell && "font-bold text-emerald-700",
                                    )}
                                    key={cIdx}
                                  >
                                    {renderFormattedInlineText(cell)}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                }

                if (block.type === "list_item") {
                  return (
                    <div className="flex items-start gap-2.5 pl-1" key={bIdx}>
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--uxa-color-brand)]" />
                      <p className="text-[12.5px] leading-relaxed text-slate-700">
                        {block.label ? (
                          <>
                            <strong className="font-bold text-[var(--uxa-color-ink)] mr-1">
                              {block.label}:
                            </strong>
                            {renderFormattedInlineText(block.value)}
                          </>
                        ) : (
                          renderFormattedInlineText(block.value)
                        )}
                      </p>
                    </div>
                  );
                }

                return (
                  <p className="text-[12.5px] leading-relaxed text-slate-700" key={bIdx}>
                    {renderFormattedInlineText(block.text)}
                  </p>
                );
              })}
            </div>
          </section>
        ))}

        {/* ── Traceability Section ── */}
        {document.traceability.length > 0 && (
          <section className="rounded-[var(--uxa-radius-md)] border border-[var(--uxa-color-border-soft)] bg-slate-50/50 p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck aria-hidden="true" className="h-4 w-4 text-[var(--uxa-color-success)]" />
              <h4 className="font-mono text-[10px] font-black uppercase tracking-[.16em] text-[var(--uxa-color-ink-muted)]">
                {byLanguage(language, { en: "Traceability & Approved Sources", es: "Trazabilidad y Fuentes Aprobadas", pt: "Rastreabilidade e Fontes Aprovadas" })}
              </h4>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {document.traceability.map((reference) => (
                <span className={diagramCenterStyles.tag} key={reference}>
                  {reference}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}

