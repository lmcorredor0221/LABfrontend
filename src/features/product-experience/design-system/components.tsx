import {
  forwardRef,
  useId,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type UxaTone = "brand" | "success" | "warning" | "danger" | "info" | "neutral";
export type UxaButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type UxaButtonSize = "sm" | "md" | "lg";
export type UxaPageStateTone = "neutral" | "info" | "warning" | "danger";

export type UxaButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
  size?: UxaButtonSize;
  variant?: UxaButtonVariant;
};

export const UxaButton = forwardRef<HTMLButtonElement, UxaButtonProps>(function UxaButton(
  {
    children,
    className,
    disabled,
    isLoading = false,
    size = "md",
    type = "button",
    variant = "primary",
    ...props
  },
  ref,
) {
  return (
    <button
      aria-busy={isLoading || undefined}
      className={cn("uxa-button", `uxa-button--${variant}`, size !== "md" && `uxa-button--${size}`, className)}
      disabled={disabled || isLoading}
      ref={ref}
      type={type}
      {...props}
    >
      {isLoading ? <span aria-hidden="true">...</span> : null}
      <span>{children}</span>
    </button>
  );
});

export function UxaBadge({
  children,
  className,
  tone = "neutral",
}: {
  children: ReactNode;
  className?: string;
  tone?: UxaTone;
}) {
  return <span className={cn("uxa-badge", `uxa-badge--${tone}`, className)}>{children}</span>;
}

export function UxaSurface({
  as: Component = "section",
  children,
  className,
  muted = false,
  ...props
}: {
  as?: "article" | "aside" | "div" | "section";
  children: ReactNode;
  className?: string;
  muted?: boolean;
} & Record<string, unknown>) {
  return (
    <Component className={cn(muted ? "uxa-card-muted" : "uxa-card", className)} {...props}>
      {children}
    </Component>
  );
}

export function UxaSkipLink({
  children = "Saltar al contenido",
  targetId = "main-content",
}: {
  children?: ReactNode;
  targetId?: string;
}) {
  return (
    <a className="skip-link" href={`#${targetId}`}>
      {children}
    </a>
  );
}

export type UxaTextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  hint?: string;
  label: string;
};

export const UxaTextField = forwardRef<HTMLInputElement, UxaTextFieldProps>(function UxaTextField(
  { className, error, hint, id, label, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className="uxa-field">
      <label htmlFor={inputId}>{label}</label>
      {hint ? (
        <p className="uxa-help-text" id={hintId}>
          {hint}
        </p>
      ) : null}
      <input
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        aria-invalid={error ? true : undefined}
        className={cn("uxa-input", className)}
        id={inputId}
        ref={ref}
        {...props}
      />
      {error ? (
        <p className="uxa-error-text" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
});

export type UxaTextareaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: string;
  hint?: string;
  label: string;
};

export const UxaTextareaField = forwardRef<HTMLTextAreaElement, UxaTextareaFieldProps>(function UxaTextareaField(
  { className, error, hint, id, label, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className="uxa-field">
      <label htmlFor={inputId}>{label}</label>
      {hint ? (
        <p className="uxa-help-text" id={hintId}>
          {hint}
        </p>
      ) : null}
      <textarea
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        aria-invalid={error ? true : undefined}
        className={cn("uxa-input uxa-textarea", className)}
        id={inputId}
        ref={ref}
        {...props}
      />
      {error ? (
        <p className="uxa-error-text" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
});

export type UxaStageRailItem = {
  description: string;
  href?: string;
  key: string;
  label: string;
  state: "done" | "active" | "blocked" | "pending" | "locked";
};

export function UxaStageRail({
  activeKey,
  items,
}: {
  activeKey: string;
  items: UxaStageRailItem[];
}) {
  return (
    <nav aria-label="Ruta LEAN" className="uxa-stage-rail">
      <ol className="uxa-stage-rail-list">
        {items.map((item, index) => {
          const active = activeKey === item.key;
          return (
            <li key={item.key}>
              <a
                aria-current={active ? "step" : undefined}
                className="uxa-stage-rail-link"
                href={item.href ?? `#${item.key}`}
              >
                <span className="uxa-stage-rail-marker">
                  {index + 1}
                </span>
                <span className="uxa-stage-rail-copy">
                  <span className="uxa-stage-rail-title">{item.label}</span>
                  <span className="uxa-stage-rail-description">{item.description}</span>
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function UxaStickyActionBar({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div aria-label={label} className="uxa-sticky-actions" role="region">
      {children}
    </div>
  );
}

export function UxaProcessingStrip({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const safeValue = Math.min(100, Math.max(0, value));
  return (
    <div aria-label={label} aria-valuemax={100} aria-valuemin={0} aria-valuenow={safeValue} role="progressbar">
      <div className="uxa-processing-strip">
        <span style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}

export function UxaPersistentProcessingFeedback({
  active,
  activityLabel,
  description,
  stageLabel,
  title,
}: {
  active: boolean;
  activityLabel?: ReactNode;
  description?: ReactNode;
  stageLabel?: ReactNode;
  title: ReactNode;
}) {
  if (!active) {
    return null;
  }

  return (
    <div aria-live="polite" className="uxa-processing-feedback" role="status">
      <div className="uxa-processing-feedback-shell">
        <span className="uxa-processing-feedback-icon" aria-hidden="true">
          <Loader2 className="h-4 w-4 animate-spin" />
        </span>
        <span className="uxa-processing-feedback-copy">
          <span className="uxa-processing-feedback-title">{title}</span>
          {description ? <span className="uxa-processing-feedback-description">{description}</span> : null}
        </span>
        <span className="uxa-processing-feedback-meta">
          {stageLabel ? <span>{stageLabel}</span> : null}
          {activityLabel ? <strong>{activityLabel}</strong> : null}
        </span>
        <span className="uxa-processing-feedback-bar" aria-hidden="true">
          <span />
        </span>
      </div>
    </div>
  );
}

export function UxaPageState({
  actions,
  description,
  eyebrow,
  icon,
  live = "polite",
  title,
  tone = "neutral",
}: {
  actions?: ReactNode;
  description: ReactNode;
  eyebrow?: ReactNode;
  icon?: ReactNode;
  live?: "off" | "polite" | "assertive";
  title: ReactNode;
  tone?: UxaPageStateTone;
}) {
  return (
    <section aria-live={live} className={cn("uxa-page-state", `uxa-page-state--${tone}`)}>
      {icon ? <span className="uxa-page-state-icon">{icon}</span> : null}
      <div className="uxa-page-state-copy">
        {eyebrow ? <p className="uxa-eyebrow">{eyebrow}</p> : null}
        <h2 className="uxa-page-state-title">{title}</h2>
        <div className="uxa-page-state-description">{description}</div>
      </div>
      {actions ? <div className="uxa-page-state-actions">{actions}</div> : null}
    </section>
  );
}

export function UxaEmptyState(props: Omit<Parameters<typeof UxaPageState>[0], "tone">) {
  return <UxaPageState {...props} tone="neutral" />;
}

export function UxaBlockedState(props: Omit<Parameters<typeof UxaPageState>[0], "live" | "tone">) {
  return <UxaPageState {...props} live="assertive" tone="danger" />;
}

export function UxaMetricCard({
  description,
  icon,
  label,
  value,
}: {
  description?: ReactNode;
  icon?: ReactNode;
  label: ReactNode;
  value: ReactNode;
}) {
  return (
    <article className="uxa-metric-card">
      {icon ? <span className="uxa-metric-card-icon">{icon}</span> : null}
      <div className="uxa-metric-card-copy">
        <p className="uxa-metric-card-label">{label}</p>
        <p className="uxa-metric-card-value">{value}</p>
        {description ? <div className="uxa-metric-card-description">{description}</div> : null}
      </div>
    </article>
  );
}

export type UxaSectionNavItem = {
  count?: ReactNode;
  description?: ReactNode;
  key: string;
  label: ReactNode;
};

export function UxaSectionNav({
  activeKey,
  ariaLabel,
  items,
  onSelect,
}: {
  activeKey: string;
  ariaLabel: string;
  items: UxaSectionNavItem[];
  onSelect: (key: string) => void;
}) {
  return (
    <nav aria-label={ariaLabel} className="uxa-section-nav">
      {items.map((item) => {
        const selected = activeKey === item.key;
        return (
          <button
            aria-current={selected ? "page" : undefined}
            className="uxa-section-nav-item"
            key={item.key}
            onClick={() => onSelect(item.key)}
            type="button"
          >
            <span className="uxa-section-nav-main">
              <span className="uxa-section-nav-label">{item.label}</span>
              {item.count !== undefined ? <span className="uxa-section-nav-count">{item.count}</span> : null}
            </span>
            {item.description ? <span className="uxa-section-nav-description">{item.description}</span> : null}
          </button>
        );
      })}
    </nav>
  );
}

export function UxaProductHero({
  actions,
  description,
  eyebrow,
  headingLevel = 1,
  meta,
  title,
}: {
  actions?: ReactNode;
  description: ReactNode;
  eyebrow?: ReactNode;
  headingLevel?: 1 | 2;
  meta?: ReactNode;
  title: ReactNode;
}) {
  const Heading = headingLevel === 1 ? "h1" : "h2";

  return (
    <header className="uxa-product-hero">
      <div className="uxa-product-hero-copy">
        {eyebrow ? <div className="uxa-product-hero-eyebrow">{eyebrow}</div> : null}
        <Heading className="uxa-product-hero-title">{title}</Heading>
        <div className="uxa-product-hero-description">{description}</div>
        {meta ? <div className="uxa-product-hero-meta">{meta}</div> : null}
      </div>
      {actions ? <div className="uxa-product-hero-actions">{actions}</div> : null}
    </header>
  );
}

export function UxaEvidenceCard({
  actions,
  children,
  description,
  eyebrow,
  title,
}: {
  actions?: ReactNode;
  children?: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
}) {
  return (
    <article className="uxa-evidence-card">
      <div className="uxa-evidence-card-header">
        <div>
          {eyebrow ? <p className="uxa-eyebrow">{eyebrow}</p> : null}
          <h3 className="uxa-card-title">{title}</h3>
          {description ? <div className="uxa-card-description">{description}</div> : null}
        </div>
        {actions ? <div className="uxa-evidence-card-actions">{actions}</div> : null}
      </div>
      {children ? <div className="uxa-evidence-card-body">{children}</div> : null}
    </article>
  );
}

export function UxaActionCard({
  actions,
  children,
  description,
  eyebrow = "Accion recomendada",
  title,
}: {
  actions?: ReactNode;
  children?: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
}) {
  return (
    <section className="uxa-action-card">
      <div className="uxa-action-card-copy">
        <p className="uxa-eyebrow">{eyebrow}</p>
        <h2 className="uxa-action-card-title">{title}</h2>
        {description ? <div className="uxa-card-description">{description}</div> : null}
        {children}
      </div>
      {actions ? <div className="uxa-action-card-actions">{actions}</div> : null}
    </section>
  );
}

export type UxaFilterChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
};

export const UxaFilterChip = forwardRef<HTMLButtonElement, UxaFilterChipProps>(function UxaFilterChip(
  { children, className, selected = false, type = "button", ...props },
  ref,
) {
  return (
    <button
      aria-pressed={selected}
      className={cn("uxa-filter-chip", selected && "uxa-filter-chip--selected", className)}
      ref={ref}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
});

export function UxaDrawerHeader({
  closeLabel = "Cerrar panel",
  description,
  eyebrow,
  onClose,
  title,
  titleId,
}: {
  closeLabel?: string;
  description?: ReactNode;
  eyebrow?: ReactNode;
  onClose: () => void;
  title: ReactNode;
  titleId: string;
}) {
  return (
    <header className="uxa-drawer-header">
      <div className="uxa-drawer-header-copy">
        {eyebrow ? <p className="uxa-eyebrow">{eyebrow}</p> : null}
        <h2 className="uxa-drawer-title" id={titleId}>{title}</h2>
        {description ? <div className="uxa-drawer-description">{description}</div> : null}
      </div>
      <button aria-label={closeLabel} className="uxa-drawer-close" onClick={onClose} type="button">
        <span aria-hidden="true">×</span>
      </button>
    </header>
  );
}
