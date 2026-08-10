"use client";

import React, { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";
import { useLanguage } from "@/core/i18n/language-context";
import { cn } from "@/lib/utils";

export function LanguageSelector({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { language, setLanguage, languages, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang =
    languages.find((item) => item.code === language) || languages[0];
  const localizedLabels = {
    en: t("lang.en", "English"),
    es: t("lang.es", "Espanol"),
    pt: t("lang.pt", "Portugues"),
  } as const;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className={`relative inline-block text-left ${className}`}
      ref={dropdownRef}
    >
      <button
        aria-label={t("nav.switchLanguage", "Idioma")}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "inline-flex items-center rounded-full border border-[var(--border-default)] bg-white font-semibold text-[var(--text-primary)] shadow-sm transition hover:bg-[var(--surface-subtle)]",
          compact
            ? "h-10 min-w-[84px] gap-1.5 px-3 text-[12px]"
            : "gap-2 px-3 py-1.5 text-[13px]",
        )}
      >
        <Globe
          className={cn(
            "text-[var(--brand-primary)]",
            compact ? "h-3.5 w-3.5" : "h-4 w-4",
          )}
        />
        <span className="tracking-[0.18em] uppercase">
          {currentLang.code.toUpperCase()}
        </span>
        <ChevronDown
          className={cn(
            "text-[var(--text-muted)]",
            compact ? "h-3 w-3" : "h-3.5 w-3.5",
          )}
        />
      </button>

      {isOpen ? (
        <div
          className={cn(
            "absolute right-0 z-50 mt-1.5 origin-top-right rounded-[14px] border border-[var(--border-default)] bg-white shadow-xl",
            compact ? "w-36 p-1" : "w-40 p-1.5",
          )}
        >
          <div
            className={cn(
              "font-bold uppercase tracking-wider text-[var(--text-muted)]",
              compact ? "px-2 py-1 text-[9px]" : "px-2 py-1 text-[10px]",
            )}
          >
            {t("lang.select", "Seleccionar idioma")}
          </div>
          {languages.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => {
                setLanguage(item.code);
                setIsOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-[8px] font-medium transition",
                compact
                  ? "px-2 py-1.5 text-[12px]"
                  : "px-2.5 py-1.5 text-[13px]",
                language === item.code
                  ? "bg-[var(--brand-soft)] text-[var(--brand-primary)] font-semibold"
                  : "text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]",
              )}
            >
              <span className="flex items-center gap-2">
                <span>{localizedLabels[item.code]}</span>
              </span>
              {language === item.code ? (
                <Check className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
