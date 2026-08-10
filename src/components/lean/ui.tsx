"use client";

import { useState } from "react";
import type {
  ButtonHTMLAttributes,
  ChangeEvent,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import {
  ChevronDown,
  ChevronRight,
  LoaderCircle,
  Minus,
  MoveRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "violet" | "green" | "orange" | "red" | "blue" | "slate";

const toneStyles: Record<Tone, string> = {
  violet:
    "bg-[var(--brand-soft)] text-[var(--brand-primary)] border-[rgba(79,70,245,0.12)]",
  green:
    "bg-[var(--success-soft)] text-[var(--success)] border-[rgba(34,197,94,0.12)]",
  orange:
    "bg-[var(--warning-soft)] text-[var(--warning)] border-[rgba(245,158,11,0.14)]",
  red: "bg-[var(--danger-soft)] text-[var(--danger)] border-[rgba(239,68,68,0.14)]",
  blue: "bg-[var(--info-soft)] text-[var(--info)] border-[rgba(59,130,246,0.14)]",
  slate:
    "bg-[var(--surface-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)]",
};

export function Badge({
  children,
  tone = "slate",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        toneStyles[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Panel({
  children,
  className,
  elevated = false,
  ...props
}: HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  elevated?: boolean;
}) {
  return (
    <section
      {...props}
      className={cn(
        "panel relative overflow-hidden",
        elevated && "shadow-[var(--shadow-elevated)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function PanelHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="space-y-1">
        {eyebrow ? (
          <p className="text-eyebrow text-[11px] font-medium text-[var(--text-secondary)]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-[30px] font-semibold leading-tight text-[var(--text-primary)]">
          {title}
        </h2>
        {description ? (
          <p className="max-w-3xl text-[15px] leading-7 text-[var(--text-secondary)]">
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        <div className="flex shrink-0 items-center gap-3">{action}</div>
      ) : null}
    </div>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  loading?: boolean;
  loadingLabel?: string;
  trailingIcon?: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
};

export function AppButton({
  children,
  disabled,
  className,
  icon,
  loading = false,
  loadingLabel,
  trailingIcon,
  type = "button",
  variant = "secondary",
  ...props
}: ButtonProps) {
  const variantClasses =
    variant === "primary"
      ? "gradient-button border-transparent"
      : variant === "ghost"
        ? "border-transparent bg-transparent text-[var(--brand-primary)]"
        : "bg-white text-[var(--text-primary)] border-[var(--border-default)]";
  const isDisabled = disabled || loading;

  return (
    <button
      aria-busy={loading}
      className={cn(
        "inline-flex h-12 items-center justify-center gap-2 rounded-[14px] border px-4 text-[14px] font-semibold transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses,
        className,
      )}
      disabled={isDisabled}
      type={type}
      {...props}
    >
      {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : icon}
      <span>{loadingLabel && loading ? loadingLabel : children}</span>
      {!loading
        ? (trailingIcon ??
          (variant === "primary" ? <MoveRight className="h-4 w-4" /> : null))
        : null}
    </button>
  );
}

export function IconButton({
  icon,
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: ReactNode;
  className?: string;
}) {
  return (
    <button
      className={cn(
        "inline-flex h-11 w-11 items-center justify-center rounded-[14px] border border-[var(--border-default)] bg-white text-[var(--text-primary)] transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      type={type}
      {...props}
    >
      {icon}
    </button>
  );
}

export function ProgressBar({
  value,
  className,
  color = "var(--brand-primary)",
}: {
  value: number;
  className?: string;
  color?: string;
}) {
  return (
    <div
      className={cn("h-2 rounded-full bg-[var(--surface-subtle)]", className)}
    >
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
          background: color,
        }}
      />
    </div>
  );
}

export function DividerLabel({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
      <span>{left}</span>
      <div className="h-px flex-1 bg-[var(--border-subtle)]" />
      <span>{right}</span>
    </div>
  );
}

export function KeyValue({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-[12px] text-[var(--text-muted)]">{label}</p>
      <div className="text-[15px] font-medium text-[var(--text-primary)]">
        {value}
      </div>
      {hint ? (
        <p className="text-[12px] text-[var(--text-secondary)]">{hint}</p>
      ) : null}
    </div>
  );
}

export function TabList({
  tabs,
  active,
  className,
  onChange,
}: {
  tabs: string[];
  active: string;
  className?: string;
  onChange?: (tab: string) => void;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-5 border-b border-[var(--border-subtle)]",
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab === active;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onChange?.(tab)}
            className={cn(
              "relative pb-4 text-[15px] font-medium transition",
              isActive
                ? "text-[var(--brand-primary)]"
                : "text-[var(--text-secondary)]",
            )}
          >
            {tab}
            {isActive ? (
              <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-[var(--brand-primary)]" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function InlineFieldError({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn("text-[12px] font-medium text-[var(--danger)]", className)}
    >
      {children}
    </p>
  );
}

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  density?: "regular" | "compact";
  error?: string;
  hint?: string;
  label: string;
  onValueChange?: (value: string, event: ChangeEvent<HTMLInputElement>) => void;
  trailing?: ReactNode;
};

export function TextField({
  className,
  density = "regular",
  defaultValue,
  error,
  hint,
  label,
  onChange,
  onValueChange,
  placeholder,
  required,
  trailing,
  value,
  ...props
}: TextFieldProps) {
  const isControlled = value !== undefined && (onChange || onValueChange);

  return (
    <label
      className={cn(
        "flex flex-col font-medium text-[var(--text-primary)]",
        density === "compact" ? "gap-1.5 text-[13px]" : "gap-2 text-[14px]",
        className,
      )}
    >
      {label ? (
        <span>
          {label}
          {required ? (
            <span className="ml-1 text-[var(--danger)]">*</span>
          ) : null}
        </span>
      ) : (
        <span className="sr-only">{placeholder ?? "Campo de texto"}</span>
      )}
      <div
        className={cn(
          "flex items-center border bg-white text-[var(--text-secondary)] transition focus-within:border-[var(--border-focus)]",
          density === "compact"
            ? "h-10 gap-2.5 rounded-[12px] px-3.5 text-[13px]"
            : "h-12 gap-3 rounded-[14px] px-4 text-[14px]",
          error
            ? "border-[rgba(239,68,68,0.42)]"
            : "border-[var(--border-default)]",
        )}
      >
        <input
          className={cn(
            "h-full w-full bg-transparent text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]",
            density === "compact" ? "text-[13px]" : "text-[14px]",
          )}
          defaultValue={!isControlled ? (defaultValue ?? value) : undefined}
          onChange={(event) => {
            onChange?.(event);
            onValueChange?.(event.target.value, event);
          }}
          placeholder={placeholder}
          required={required}
          value={isControlled ? value : undefined}
          {...props}
        />
        {trailing ? (
          <span className="shrink-0 text-[var(--text-muted)]">{trailing}</span>
        ) : null}
      </div>
      {hint ? (
        <p className="text-[12px] font-normal text-[var(--text-secondary)]">
          {hint}
        </p>
      ) : null}
      {error ? <InlineFieldError>{error}</InlineFieldError> : null}
    </label>
  );
}

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: string;
  footer?: ReactNode;
  hint?: string;
  label: string;
  onValueChange?: (
    value: string,
    event: ChangeEvent<HTMLTextAreaElement>,
  ) => void;
};

export function TextAreaField({
  className,
  defaultValue,
  error,
  footer,
  hint,
  label,
  onChange,
  onValueChange,
  placeholder,
  required,
  value,
  ...props
}: TextAreaFieldProps) {
  const isControlled = value !== undefined && (onChange || onValueChange);

  return (
    <label
      className={cn(
        "flex flex-col gap-2 text-[14px] font-medium text-[var(--text-primary)]",
        className,
      )}
    >
      <span>
        {label}
        {required ? <span className="ml-1 text-[var(--danger)]">*</span> : null}
      </span>
      <div
        className={cn(
          "rounded-[16px] border bg-white px-4 py-4 transition focus-within:border-[var(--border-focus)]",
          error
            ? "border-[rgba(239,68,68,0.42)]"
            : "border-[var(--border-default)]",
        )}
      >
        <textarea
          className="min-h-[92px] w-full resize-y bg-transparent text-[14px] leading-6 text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
          defaultValue={!isControlled ? (defaultValue ?? value) : undefined}
          onChange={(event) => {
            onChange?.(event);
            onValueChange?.(event.target.value, event);
          }}
          placeholder={placeholder}
          required={required}
          value={isControlled ? value : undefined}
          {...props}
        />
        {footer ? (
          <div className="pt-3 text-right text-[12px] font-normal text-[var(--text-muted)]">
            {footer}
          </div>
        ) : null}
      </div>
      {hint ? (
        <p className="text-[12px] font-normal text-[var(--text-secondary)]">
          {hint}
        </p>
      ) : null}
      {error ? <InlineFieldError>{error}</InlineFieldError> : null}
    </label>
  );
}

type SelectOption = {
  disabled?: boolean;
  label: string;
  value: string;
};

type SelectFieldProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "size"
> & {
  error?: string;
  hint?: string;
  label: string;
  onValueChange?: (
    value: string,
    event: ChangeEvent<HTMLSelectElement>,
  ) => void;
  options?: SelectOption[];
  placeholder?: string;
};

export function SelectField({
  className,
  defaultValue,
  error,
  hint,
  label,
  onChange,
  onValueChange,
  options,
  placeholder,
  required,
  value,
  ...props
}: SelectFieldProps) {
  const selectedValue = Array.isArray(value)
    ? value[0]
    : value !== undefined
      ? String(value)
      : undefined;
  const uncontrolledValue =
    defaultValue !== undefined
      ? Array.isArray(defaultValue)
        ? defaultValue[0]
        : String(defaultValue)
      : selectedValue;
  const fallbackOption = selectedValue ?? placeholder ?? "Seleccionar...";
  const resolvedOptions =
    options && options.length > 0
      ? options
      : [{ label: fallbackOption, value: fallbackOption, disabled: false }];
  const isControlled = value !== undefined && (onChange || onValueChange);

  return (
    <label
      className={cn(
        "flex flex-col gap-2 text-[14px] font-medium text-[var(--text-primary)]",
        className,
      )}
    >
      <span>
        {label}
        {required ? <span className="ml-1 text-[var(--danger)]">*</span> : null}
      </span>
      <div
        className={cn(
          "relative flex h-12 items-center rounded-[14px] border bg-white text-[14px] text-[var(--text-primary)] transition focus-within:border-[var(--border-focus)]",
          error
            ? "border-[rgba(239,68,68,0.42)]"
            : "border-[var(--border-default)]",
        )}
      >
        <select
          className="h-full w-full appearance-none bg-transparent px-4 pr-10 outline-none"
          defaultValue={
            !isControlled
              ? (uncontrolledValue ?? resolvedOptions[0]?.value)
              : undefined
          }
          onChange={(event) => {
            onChange?.(event);
            onValueChange?.(event.target.value, event);
          }}
          required={required}
          value={isControlled ? selectedValue : undefined}
          {...props}
        >
          {resolvedOptions.map((option) => (
            <option
              key={`${option.value}-${option.label}`}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 h-4 w-4 text-[var(--text-muted)]" />
      </div>
      {hint ? (
        <p className="text-[12px] font-normal text-[var(--text-secondary)]">
          {hint}
        </p>
      ) : null}
      {error ? <InlineFieldError>{error}</InlineFieldError> : null}
    </label>
  );
}

type SliderFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "children" | "type" | "value" | "defaultValue"
> & {
  error?: string;
  formatValue?: (value: number) => string;
  label: string;
  leftLabel: string;
  max?: number;
  min?: number;
  onValueChange?: (value: number, event: ChangeEvent<HTMLInputElement>) => void;
  rightLabel: string;
  step?: number;
  value: number;
  defaultValue?: number;
};

export function SliderField({
  className,
  defaultValue,
  error,
  formatValue,
  label,
  leftLabel,
  max = 1,
  min = 0,
  onChange,
  onValueChange,
  rightLabel,
  step = 0.01,
  value,
  ...props
}: SliderFieldProps) {
  const resolvedValue = Number.isFinite(value) ? value : (defaultValue ?? min);
  const clampedValue = Math.max(min, Math.min(max, resolvedValue));
  const normalizedValue =
    max === min ? 0 : ((clampedValue - min) / (max - min)) * 100;
  const isControlled = value !== undefined && (onChange || onValueChange);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between text-[14px] font-medium">
        <span>{label}</span>
        <span
          className={cn(
            "rounded-[12px] border px-3 py-1 text-[13px]",
            error
              ? "border-[rgba(239,68,68,0.42)] text-[var(--danger)]"
              : "border-[var(--border-default)]",
          )}
        >
          {formatValue ? formatValue(clampedValue) : clampedValue.toFixed(2)}
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-[var(--surface-subtle)]">
        <div
          className="h-full rounded-full bg-[var(--brand-primary)]"
          style={{ width: `${normalizedValue}%` }}
        />
        <span
          className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-[3px] border-white bg-[var(--brand-primary)] shadow-md"
          style={{ left: `calc(${normalizedValue}% - 10px)` }}
        />
        <input
          aria-label={label}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          defaultValue={
            !isControlled ? (defaultValue ?? clampedValue) : undefined
          }
          max={max}
          min={min}
          onChange={(event) => {
            onChange?.(event);
            onValueChange?.(Number.parseFloat(event.target.value), event);
          }}
          step={step}
          type="range"
          value={isControlled ? clampedValue : undefined}
          {...props}
        />
      </div>
      <div className="flex items-center justify-between text-[12px] text-[var(--text-muted)]">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
      {error ? <InlineFieldError>{error}</InlineFieldError> : null}
    </div>
  );
}

export function Checklist({
  items,
  className,
}: {
  items: {
    label: string;
    state?: "done" | "pending" | "alert";
    detail?: string;
  }[];
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {items.map((item, index) => (
        <div
          key={`${item.label}-${item.detail ?? ""}-${item.state ?? "pending"}-${index}`}
          className="flex items-start gap-3"
        >
          <span
            className={cn(
              "mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold",
              item.state === "done" &&
                "border-[rgba(34,197,94,0.18)] bg-[var(--success-soft)] text-[var(--success)]",
              item.state === "alert" &&
                "border-[rgba(245,158,11,0.18)] bg-[var(--warning-soft)] text-[var(--warning)]",
              (!item.state || item.state === "pending") &&
                "border-[var(--border-default)] bg-white text-[var(--text-muted)]",
            )}
          >
            {item.state === "done" ? "✓" : item.state === "alert" ? "!" : ""}
          </span>
          <div className="space-y-0.5">
            <p className="text-[14px] font-medium text-[var(--text-primary)]">
              {item.label}
            </p>
            {item.detail ? (
              <p className="text-[13px] text-[var(--text-secondary)]">
                {item.detail}
              </p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SimpleTable({
  columns,
  rows,
  className,
}: {
  columns: string[];
  rows: ReactNode[][];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[18px] border border-[var(--border-default)]",
        className,
      )}
    >
      <div
        className="grid bg-[var(--surface-subtle)] px-4 py-3 text-[12px] font-medium text-[var(--text-secondary)]"
        style={{
          gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
        }}
      >
        {columns.map((column) => (
          <div key={column}>{column}</div>
        ))}
      </div>
      <div className="divide-y divide-[var(--border-subtle)] bg-white">
        {rows.map((row, rowIndex) => (
          <div
            key={`${rowIndex}-${columns[0]}`}
            className="grid items-center gap-3 px-4 py-4 text-[14px] text-[var(--text-primary)]"
            style={{
              gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
            }}
          >
            {row.map((cell, cellIndex) => (
              <div key={`${rowIndex}-${cellIndex}`}>{cell}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function LinkRow({
  className,
  disabled,
  label,
  detail,
  onClick,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  detail?: string;
}) {
  return (
    <button
      disabled={disabled}
      type={type}
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-[14px] border border-[var(--border-default)] bg-white px-4 py-3 text-left transition hover:border-[rgba(79,70,245,0.28)] disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    >
      <div>
        <p className="text-[14px] font-medium text-[var(--text-primary)]">
          {label}
        </p>
        {detail ? (
          <p className="text-[13px] text-[var(--text-secondary)]">{detail}</p>
        ) : null}
      </div>
      <ChevronRight className="h-4 w-4 text-[var(--brand-primary)]" />
    </button>
  );
}

export function SeparatorNote({ text }: { text: string }) {
  return (
    <div className="rounded-[16px] border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-4 py-3 text-[13px] text-[var(--text-secondary)]">
      {text}
    </div>
  );
}

export function MiniStat({
  label,
  value,
  hint,
  tone = "violet",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: Tone;
}) {
  return (
    <div className="space-y-2 rounded-[18px] border border-[var(--border-default)] bg-white px-4 py-4">
      <p className="text-eyebrow text-[11px] text-[var(--text-muted)]">
        {label}
      </p>
      <div className="flex items-end gap-2">
        <p className="text-[22px] font-semibold leading-none text-[var(--text-primary)]">
          {value}
        </p>
        <Badge tone={tone}>{hint ?? "Activo"}</Badge>
      </div>
    </div>
  );
}

export function StatRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: ReactNode;
  tone?: Tone;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[14px] py-1 text-[14px]">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span className="flex items-center gap-2 font-medium text-[var(--text-primary)]">
        {tone ? (
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              tone === "green" && "bg-[var(--success)]",
              tone === "orange" && "bg-[var(--warning)]",
              tone === "red" && "bg-[var(--danger)]",
              tone === "blue" && "bg-[var(--info)]",
              tone === "violet" && "bg-[var(--brand-primary)]",
              tone === "slate" && "bg-[var(--text-muted)]",
            )}
          />
        ) : null}
        {value}
      </span>
    </div>
  );
}

export function RangeBar({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative h-2 rounded-full bg-gradient-to-r from-[var(--warning)] via-[var(--warning)] to-[var(--danger)]">
        <span
          className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white bg-[var(--text-primary)]"
          style={{ left: `calc(${value}% - 8px)` }}
        />
      </div>
      <div className="flex items-center justify-between text-[12px] text-[var(--text-muted)]">
        <span>Baja</span>
        <span>Muy alta</span>
      </div>
    </div>
  );
}

export function CollapsedSection({
  icon,
  title,
  subtitle,
  rightLabel,
  badge,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  rightLabel: string;
  badge?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 rounded-[20px] border border-[var(--border-default)] bg-white px-5 py-5">
      <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[var(--surface-subtle)] text-[var(--text-primary)]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[18px] font-semibold text-[var(--text-primary)]">
          {title}
        </p>
        <p className="text-[14px] text-[var(--text-secondary)]">{subtitle}</p>
      </div>
      <div className="hidden text-right text-[13px] text-[var(--text-secondary)] md:block">
        <p>{rightLabel}</p>
        {badge}
      </div>
      <ChevronRight className="h-5 w-5 text-[var(--text-muted)]" />
    </div>
  );
}

export function TinyTrend({
  value,
  positive = true,
}: {
  value: string;
  positive?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[13px] font-medium",
        positive ? "text-[var(--success)]" : "text-[var(--danger)]",
      )}
    >
      {positive ? "+" : <Minus className="h-3 w-3" />}
      {value}
    </span>
  );
}

export function AccordionPanel({
  title,
  subtitle,
  icon,
  badge,
  action,
  defaultExpanded = false,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  badge?: ReactNode;
  action?: ReactNode;
  defaultExpanded?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[20px] border border-[var(--border-default)] bg-white transition-all shadow-xs",
        className,
      )}
    >
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex cursor-pointer items-center justify-between gap-4 p-5 hover:bg-gray-50/70 transition-colors"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          {icon ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[var(--surface-subtle)] text-[var(--text-primary)]">
              {icon}
            </div>
          ) : null}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[17px] font-semibold text-[var(--text-primary)]">
                {title}
              </h3>
              {badge}
            </div>
            {subtitle ? (
              <p className="mt-0.5 text-[13px] text-[var(--text-secondary)] line-clamp-1">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {action ? (
            <div onClick={(e) => e.stopPropagation()}>{action}</div>
          ) : null}
          <div className="flex h-8 w-8 items-center justify-center text-[var(--text-muted)] rounded-full hover:bg-gray-100 transition-all">
            <ChevronDown
              className={cn(
                "h-5 w-5 transition-transform duration-200",
                isExpanded && "rotate-180",
              )}
            />
          </div>
        </div>
      </div>

      {isExpanded ? (
        <div className="border-t border-[var(--border-subtle)] bg-gray-50/30 p-5 space-y-4">
          {children}
        </div>
      ) : null}
    </div>
  );
}
