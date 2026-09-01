"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Badge, Panel } from "@/components/lean/ui";

interface ProviderAccordionProps {
  badges?: { label: string; tone: "violet" | "green" | "orange" | "red" | "blue" | "slate" }[];
  children: ReactNode;
  defaultExpanded?: boolean;
  description?: string;
  icon?: ReactNode;
  id: string;
  title: string;
}

export function ProviderAccordion({
  badges = [],
  children,
  defaultExpanded = false,
  description,
  icon,
  id,
  title,
}: ProviderAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <Panel className="overflow-hidden transition-all duration-200 hover:border-[var(--border-focus)]/50">
      {/* Header Interactivo del Acordeón */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-[var(--surface-subtle)]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
        aria-expanded={isExpanded}
        aria-controls={`accordion-body-${id}`}
      >
        <div className="flex items-center gap-3">
          {icon ? <div className="text-[var(--brand-primary)]">{icon}</div> : null}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[17px] font-semibold text-[var(--text-primary)]">{title}</span>
            </div>
            {description ? <p className="mt-0.5 text-[13px] text-[var(--text-secondary)]">{description}</p> : null}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {badges.map((badge, idx) => (
              <Badge key={`${badge.label}-${idx}`} tone={badge.tone}>
                {badge.label}
              </Badge>
            ))}
          </div>

          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface-subtle)] text-[var(--text-secondary)] transition-transform duration-200">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </button>

      {/* Cuerpo Expandible del Acordeón */}
      {isExpanded && (
        <div
          id={`accordion-body-${id}`}
          className="border-t border-[var(--border-default)] bg-[var(--surface-canvas)]/30 p-5 space-y-4 animate-in fade-in-50 duration-200"
        >
          {children}
        </div>
      )}
    </Panel>
  );
}
