"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Minus, X } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type FloatingArchitectureStudioTier = "blueprint" | "blueprint_pro" | "acp";

export type FloatingArchitectureStudioProps = {
  /** Controls visibility — set to true while the heavy operation runs */
  isOpen: boolean;
  /** Product tier that determines which diagram + milestones + copy to show */
  tier: FloatingArchitectureStudioTier;
  /** Optional current step label forwarded from the operation panel */
  currentStep?: string;
  /** Called when user explicitly closes the overlay */
  onClose?: () => void;
};

// ─────────────────────────────────────────────────────────────────────────────
// Per-tier configuration
// ─────────────────────────────────────────────────────────────────────────────

type TierConfig = {
  heading: string;
  subheading: string;
  milestones: string[];
  valueCapsules: string[];
  accentColor: string;
};

const TIER_CONFIG: Record<FloatingArchitectureStudioTier, TierConfig> = {
  blueprint: {
    heading: "Procesando Blueprint",
    subheading: "Operacion tecnica dentro de la etapa actual",
    milestones: [
      "Solicitud recibida",
      "Estructuracion del contexto",
      "Analisis de necesidad y alcance",
      "Deteccion de preguntas y gaps",
      "Preparacion del resultado revisable",
      "Sincronizacion con la etapa actual",
    ],
    valueCapsules: [
      "Paso tecnico dentro del journey",
      "No agrega una etapa nueva al proyecto",
      "Resultado revisable antes de avanzar",
      "Trazabilidad por operacion",
    ],
    accentColor: "#3047b8",
  },
  blueprint_pro: {
    heading: "Construyendo Blueprint Pro",
    subheading: "Especificación formal · Grado ingeniería",
    milestones: [
      "Análisis profundo de requerimientos",
      "Generación de 10+ diagramas técnicos",
      "Master Spec: 6 capítulos formales",
      "5 escenarios FinOps con sensibilidad",
      "Contrato OpenAPI 3.1 y schemas Pydantic/Zod",
      "Validación ante comités de arquitectura",
    ],
    valueCapsules: [
      "~35–50 h de ingeniería formal → minutos",
      "Defendible ante comités técnicos",
      "OpenAPI 3.1 listo para desarrollo",
      "FinOps con escenarios de sensibilidad",
    ],
    accentColor: "#6d28d9",
  },
  acp: {
    heading: "Generando ACP Package",
    subheading: "Código base listo para producción",
    milestones: [
      "Resolución de herramientas y contratos",
      "Generación de estructura del repositorio",
      "Prompt Pack con instrucciones del sistema",
      "Schemas Pydantic/Zod tipados",
      "Suite de pruebas sintéticas",
      "ZIP listo para abrir en Cursor / Claude Code",
    ],
    valueCapsules: [
      "1–2 sprints de boilerplate ahorrados",
      "Abre directo en Cursor o Claude Code",
      "Schemas tipados listos para producción",
      "Tests sintéticos incluidos",
    ],
    accentColor: "#0d7c66",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Inline SVG — simplified runtime workflow (21 nodos, 5 fases)
// Nodos animados con CSS: cada grupo aparece con un delay escalonado
// ─────────────────────────────────────────────────────────────────────────────

function ArchitectureSVG({
  tier,
  progress,
}: {
  tier: FloatingArchitectureStudioTier;
  progress: number; // 0–1
}) {
  const accent = TIER_CONFIG[tier].accentColor;

  // Compute how many of the 6 node groups are "lit" based on progress
  const totalGroups = 6;
  const litGroups = Math.floor(progress * totalGroups);

  const nodeStyle = (groupIndex: number): React.CSSProperties => {
    const lit = groupIndex < litGroups;
    const active = groupIndex === litGroups;
    return {
      opacity: lit || active ? 1 : 0.18,
      transition: "opacity 0.6s ease",
    };
  };

  const edgeStyle = (groupIndex: number): React.CSSProperties => {
    const lit = groupIndex < litGroups;
    return {
      opacity: lit ? 0.7 : 0.08,
      transition: "opacity 0.6s ease",
    };
  };

  const pulseStyle = (groupIndex: number): React.CSSProperties => {
    const active = groupIndex === litGroups && progress < 1;
    return {
      opacity: active ? 1 : 0,
      transition: "opacity 0.4s ease",
    };
  };

  return (
    <svg
      aria-hidden="true"
      className="w-full"
      viewBox="0 0 720 140"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <marker id="fas-arrow" markerHeight="6" markerWidth="6" orient="auto-start-reverse" refX="5" refY="3" viewBox="0 0 10 6">
          <path d="M 0 0 L 6 3 L 0 6 z" fill="#60708a" />
        </marker>
        <filter id="fas-shadow">
          <feDropShadow dx="0" dy="2" floodColor="#000" floodOpacity="0.12" stdDeviation="2" />
        </filter>
        <radialGradient cx="50%" cy="50%" id="fas-pulse-grad" r="50%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.6" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Background */}
      <rect fill="#f0f2f8" height="140" rx="12" width="720" />

      {/* ── Group 0: Trigger / Input ── */}
      <g style={nodeStyle(0)}>
        <rect filter="url(#fas-shadow)" fill="#fff" height="62" rx="8" stroke={accent} strokeWidth="1.5" width="92" x="10" y="39" />
        <rect fill={accent} height="62" rx="4" width="4" x="10" y="39" />
        <text fill="#10172a" fontFamily="Inter,Arial,sans-serif" fontSize="10" fontWeight="700" x="22" y="67">Disparo de</text>
        <text fill="#10172a" fontFamily="Inter,Arial,sans-serif" fontSize="10" fontWeight="700" x="22" y="80">Evento</text>
        <text fill="#69748b" fontFamily="Inter,Arial,sans-serif" fontSize="9" x="22" y="93">start</text>
      </g>
      {/* Pulse ring */}
      <circle cx="56" cy="70" fill="url(#fas-pulse-grad)" r="28" style={pulseStyle(0)}>
        <animate attributeName="r" dur="1.2s" repeatCount="indefinite" values="16;30;16" />
        <animate attributeName="opacity" dur="1.2s" repeatCount="indefinite" values="0.6;0;0.6" />
      </circle>

      {/* Edge 0→1 */}
      <line markerEnd="url(#fas-arrow)" stroke="#60708a" strokeWidth="1.5" style={edgeStyle(0)} x1="102" x2="122" y1="70" y2="70" />

      {/* ── Group 1: Ingestion ── */}
      <g style={nodeStyle(1)}>
        <rect filter="url(#fas-shadow)" fill="#fff" height="62" rx="8" stroke={accent} strokeWidth="1.5" width="108" x="122" y="39" />
        <rect fill={accent} height="62" rx="4" width="4" x="122" y="39" />
        <text fill="#10172a" fontFamily="Inter,Arial,sans-serif" fontSize="10" fontWeight="700" x="134" y="67">Ingestión y</text>
        <text fill="#10172a" fontFamily="Inter,Arial,sans-serif" fontSize="10" fontWeight="700" x="134" y="80">Contexto</text>
        <text fill="#69748b" fontFamily="Inter,Arial,sans-serif" fontSize="9" x="134" y="93">process</text>
      </g>
      <circle cx="176" cy="70" fill="url(#fas-pulse-grad)" r="28" style={pulseStyle(1)}>
        <animate attributeName="r" dur="1.2s" repeatCount="indefinite" values="16;32;16" />
        <animate attributeName="opacity" dur="1.2s" repeatCount="indefinite" values="0.6;0;0.6" />
      </circle>

      {/* Edge 1→2 */}
      <line markerEnd="url(#fas-arrow)" stroke="#60708a" strokeWidth="1.5" style={edgeStyle(1)} x1="230" x2="250" y1="70" y2="70" />

      {/* ── Group 2: Supervisor ── */}
      <g style={nodeStyle(2)}>
        <rect filter="url(#fas-shadow)" fill="#fff" height="62" rx="8" stroke={accent} strokeWidth="2" width="116" x="250" y="39" />
        <rect fill={accent} height="62" rx="4" width="4" x="250" y="39" />
        <text fill="#10172a" fontFamily="Inter,Arial,sans-serif" fontSize="10" fontWeight="700" x="262" y="67">Supervisor</text>
        <text fill="#10172a" fontFamily="Inter,Arial,sans-serif" fontSize="10" fontWeight="700" x="262" y="80">Triage</text>
        <text fill="#69748b" fontFamily="Inter,Arial,sans-serif" fontSize="9" x="262" y="93">component</text>
      </g>
      <circle cx="308" cy="70" fill="url(#fas-pulse-grad)" r="32" style={pulseStyle(2)}>
        <animate attributeName="r" dur="1.2s" repeatCount="indefinite" values="18;36;18" />
        <animate attributeName="opacity" dur="1.2s" repeatCount="indefinite" values="0.6;0;0.6" />
      </circle>

      {/* Edge 2→3 specialists fork */}
      <line markerEnd="url(#fas-arrow)" stroke="#60708a" strokeWidth="1.5" style={edgeStyle(2)} x1="366" x2="386" y1="55" y2="28" />
      <line markerEnd="url(#fas-arrow)" stroke="#60708a" strokeWidth="1.5" style={edgeStyle(2)} x1="366" x2="386" y1="85" y2="112" />

      {/* ── Group 3: Specialists (two lanes) ── */}
      <g style={nodeStyle(3)}>
        {/* Upper specialist */}
        <rect filter="url(#fas-shadow)" fill="#fff" height="44" rx="8" stroke={accent} strokeWidth="1.5" width="100" x="386" y="8" />
        <rect fill={accent} height="44" rx="4" width="4" x="386" y="8" />
        <text fill="#10172a" fontFamily="Inter,Arial,sans-serif" fontSize="9" fontWeight="700" x="398" y="28">Especialista</text>
        <text fill="#10172a" fontFamily="Inter,Arial,sans-serif" fontSize="9" fontWeight="700" x="398" y="40">Técnico</text>
        {/* Lower specialist */}
        <rect filter="url(#fas-shadow)" fill="#fff" height="44" rx="8" stroke={accent} strokeWidth="1.5" width="100" x="386" y="88" />
        <rect fill={accent} height="44" rx="4" width="4" x="386" y="88" />
        <text fill="#10172a" fontFamily="Inter,Arial,sans-serif" fontSize="9" fontWeight="700" x="398" y="108">Especialista</text>
        <text fill="#10172a" fontFamily="Inter,Arial,sans-serif" fontSize="9" fontWeight="700" x="398" y="120">Herramientas</text>
      </g>
      <circle cx="436" cy="70" fill="url(#fas-pulse-grad)" r="32" style={pulseStyle(3)}>
        <animate attributeName="r" dur="1.2s" repeatCount="indefinite" values="18;36;18" />
        <animate attributeName="opacity" dur="1.2s" repeatCount="indefinite" values="0.6;0;0.6" />
      </circle>

      {/* Edges 3→4 merge */}
      <line markerEnd="url(#fas-arrow)" stroke="#60708a" strokeWidth="1.5" style={edgeStyle(3)} x1="486" x2="506" y1="30" y2="55" />
      <line markerEnd="url(#fas-arrow)" stroke="#60708a" strokeWidth="1.5" style={edgeStyle(3)} x1="486" x2="506" y1="110" y2="85" />

      {/* ── Group 4: Evaluation / Guardrails ── */}
      <g style={nodeStyle(4)}>
        <rect filter="url(#fas-shadow)" fill="#fff" height="62" rx="8" stroke={accent} strokeWidth="1.5" width="110" x="506" y="39" />
        <rect fill={accent} height="62" rx="4" width="4" x="506" y="39" />
        <text fill="#10172a" fontFamily="Inter,Arial,sans-serif" fontSize="10" fontWeight="700" x="518" y="67">Guardrails</text>
        <text fill="#10172a" fontFamily="Inter,Arial,sans-serif" fontSize="10" fontWeight="700" x="518" y="80">& Gate</text>
        <text fill="#69748b" fontFamily="Inter,Arial,sans-serif" fontSize="9" x="518" y="93">decision</text>
      </g>
      <circle cx="561" cy="70" fill="url(#fas-pulse-grad)" r="32" style={pulseStyle(4)}>
        <animate attributeName="r" dur="1.2s" repeatCount="indefinite" values="18;36;18" />
        <animate attributeName="opacity" dur="1.2s" repeatCount="indefinite" values="0.6;0;0.6" />
      </circle>

      {/* Edge 4→5 */}
      <line markerEnd="url(#fas-arrow)" stroke="#60708a" strokeWidth="1.5" style={edgeStyle(4)} x1="616" x2="636" y1="70" y2="70" />

      {/* ── Group 5: Output / Cierre ── */}
      <g style={nodeStyle(5)}>
        <rect filter="url(#fas-shadow)" fill="#fff" height="62" rx="8" stroke="#16a34a" strokeWidth="2" width="68" x="636" y="39" />
        <rect fill="#16a34a" height="62" rx="4" width="4" x="636" y="39" />
        <text fill="#10172a" fontFamily="Inter,Arial,sans-serif" fontSize="10" fontWeight="700" x="648" y="67">Cierre</text>
        <text fill="#10172a" fontFamily="Inter,Arial,sans-serif" fontSize="10" fontWeight="700" x="648" y="80">Exitoso</text>
        <text fill="#69748b" fontFamily="Inter,Arial,sans-serif" fontSize="9" x="648" y="93">end</text>
      </g>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Milestone list
// ─────────────────────────────────────────────────────────────────────────────

function MilestoneList({
  milestones,
  progress,
  accentColor,
}: {
  milestones: string[];
  progress: number;
  accentColor: string;
}) {
  const totalMs = milestones.length;
  const doneCount = Math.floor(progress * totalMs);
  const activeIndex = doneCount < totalMs ? doneCount : totalMs - 1;

  return (
    <ul className="space-y-1.5">
      {milestones.map((label, i) => {
        const done = i < doneCount;
        const active = i === activeIndex && progress < 1;
        return (
          <li
            className="flex items-start gap-2 text-[12px] leading-snug"
            key={label}
          >
            <span
              aria-hidden="true"
              className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
              style={{
                background: done ? "#16a34a" : active ? accentColor : "#e2e8f0",
                color: done || active ? "#fff" : "#94a3b8",
                transition: "background 0.4s ease",
              }}
            >
              {done ? "✓" : active ? "·" : ""}
            </span>
            <span
              style={{
                color: done ? "#15803d" : active ? "#10172a" : "#94a3b8",
                fontWeight: active ? 600 : done ? 500 : 400,
                transition: "color 0.4s ease",
              }}
            >
              {label}
            </span>
            {active && (
              <span
                className="ml-auto shrink-0 animate-pulse rounded-full px-1.5 py-0.5 text-[9px] font-semibold text-white"
                style={{ background: accentColor }}
              >
                en curso
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Value capsule carousel
// ─────────────────────────────────────────────────────────────────────────────

function ValueCapsule({
  capsules,
  accentColor,
}: {
  capsules: string[];
  accentColor: string;
}) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((prev) => (prev + 1) % capsules.length);
        setVisible(true);
      }, 350);
    }, 8000);
    return () => clearInterval(interval);
  }, [capsules.length]);

  return (
    <div
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-semibold text-white"
      style={{ background: accentColor, transition: "opacity 0.35s ease", opacity: visible ? 1 : 0 }}
    >
      <span aria-hidden="true">⚡</span>
      <span>{capsules[idx]}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Timer hook
// ─────────────────────────────────────────────────────────────────────────────

function useElapsedSeconds(running: boolean) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) {
      startRef.current = null;
      const resetTimer = setTimeout(() => setElapsed(0), 0);
      return () => clearTimeout(resetTimer);
    }

    startRef.current = Date.now();
    const resetTimer = setTimeout(() => setElapsed(0), 0);
    const tick = setInterval(() => {
      setElapsed(Math.floor((Date.now() - (startRef.current ?? Date.now())) / 1000));
    }, 1000);
    return () => {
      clearTimeout(resetTimer);
      clearInterval(tick);
    };
  }, [running]);

  return elapsed;
}

// ─────────────────────────────────────────────────────────────────────────────
// Simulated progress (advances quickly at first, never reaches 1.0 while running)
// ─────────────────────────────────────────────────────────────────────────────

function simulatedProgress(running: boolean, elapsedSeconds: number) {
  if (!running) {
    return 0;
  }
  const eased = 1 - Math.exp(-Math.max(0, elapsedSeconds + 1) / 20);
  return Math.min(0.97, eased * 0.85);
}

function useResetSignal(active: boolean, onReset: () => void) {
  useEffect(() => {
    if (!active) {
      return;
    }
    const resetTimer = setTimeout(onReset, 0);
    return () => clearTimeout(resetTimer);
  }, [active, onReset]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function FloatingArchitectureStudio({
  isOpen,
  tier,
  currentStep,
  onClose,
}: FloatingArchitectureStudioProps) {
  const [minimized, setMinimized] = useState(false);
  const config = TIER_CONFIG[tier];
  const elapsed = useElapsedSeconds(isOpen);
  const progress = simulatedProgress(isOpen, elapsed);
  const resetMinimized = useCallback(() => setMinimized(false), []);

  // Reset minimized state when overlay opens
  useResetSignal(isOpen, resetMinimized);

  if (!isOpen) return null;

  const formattedTime = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
  const progressPct = Math.round(progress * 100);

  // ── Minimized pill ──────────────────────────────────────────────────────────
  if (minimized) {
    return (
      <div
        className="fixed bottom-4 right-4 z-[100] flex items-center gap-2 rounded-full px-4 py-2 shadow-xl cursor-pointer select-none"
        onClick={() => setMinimized(false)}
        role="button"
        style={{ background: config.accentColor }}
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setMinimized(false)}
        aria-label="Expandir panel de progreso"
      >
        <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
        <span className="text-[11px] font-semibold text-white">
          {currentStep ?? config.heading} · {formattedTime}
        </span>
        <ChevronUp aria-hidden="true" className="h-3.5 w-3.5 text-white/80" />
      </div>
    );
  }

  // ── Full overlay ────────────────────────────────────────────────────────────
  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-label={config.heading}
      style={{ background: "rgba(10,16,32,0.72)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "#f8f9fc", border: `1px solid ${config.accentColor}33` }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ background: config.accentColor }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="h-2 w-2 animate-pulse rounded-full bg-white/80" />
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-white truncate">{config.heading}</p>
              <p className="text-[10px] text-white/70 truncate">{config.subheading}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-3">
            <span className="text-[11px] font-mono text-white/80 mr-2">{formattedTime}</span>
            <button
              aria-label="Minimizar"
              className="rounded-full p-1 text-white/70 hover:bg-white/20 transition-colors"
              onClick={() => setMinimized(true)}
              type="button"
            >
              <Minus aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
            {onClose && (
              <button
                aria-label="Cerrar panel"
                className="rounded-full p-1 text-white/70 hover:bg-white/20 transition-colors"
                onClick={onClose}
                type="button"
              >
                <X aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ── Progress bar ── */}
        <div className="h-1 w-full" style={{ background: "#e2e8f0" }}>
          <div
            className="h-1 transition-all duration-500"
            style={{ width: `${progressPct}%`, background: config.accentColor }}
          />
        </div>

        {/* ── Body ── */}
        <div className="p-5 space-y-4">
          {/* SVG diagram */}
          <div className="rounded-xl overflow-hidden border border-slate-200">
            <ArchitectureSVG progress={progress} tier={tier} />
          </div>

          {/* Current step */}
          {currentStep && (
            <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2">
              <span
                className="h-1.5 w-1.5 animate-pulse rounded-full"
                style={{ background: config.accentColor }}
              />
              <span className="text-[11px] font-medium text-slate-700 truncate">{currentStep}</span>
            </div>
          )}

          {/* Two-column: milestones + value */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
            <div className="min-w-0">
              <p
                className="mb-2 text-[10px] font-bold uppercase tracking-widest"
                style={{ color: config.accentColor }}
              >
                Proceso en curso
              </p>
              <MilestoneList
                accentColor={config.accentColor}
                milestones={config.milestones}
                progress={progress}
              />
            </div>

            {/* Value capsule + progress stat */}
            <div className="flex flex-col justify-between gap-3 sm:w-52">
              <ValueCapsule
                accentColor={config.accentColor}
                capsules={config.valueCapsules}
              />
              <div className="rounded-lg bg-slate-100 px-3 py-2 text-center">
                <p
                  className="text-[22px] font-black"
                  style={{ color: config.accentColor }}
                >
                  {progressPct}%
                </p>
                <p className="text-[10px] text-slate-500">completado</p>
              </div>
              <button
                className="flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-medium text-slate-500 hover:bg-slate-50 transition-colors"
                onClick={() => setMinimized(true)}
                type="button"
              >
                <ChevronDown aria-hidden="true" className="h-3 w-3" />
                Minimizar
              </button>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          className="px-5 py-2 text-[9px] text-slate-400 border-t border-slate-200"
          style={{ background: "#f0f2f8" }}
        >
          El sistema está construyendo la solución. Este panel desaparecerá automáticamente al finalizar.
        </div>
      </div>
    </div>
  );
}
