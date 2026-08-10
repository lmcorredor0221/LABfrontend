import type { ReactNode } from "react";
import { CircleAlert, Inbox, LoaderCircle, RefreshCcw } from "lucide-react";
import { AppButton, Badge, Panel } from "@/components/lean/ui";
import { cn } from "@/lib/utils";

type StateProps = {
  action?: ReactNode;
  className?: string;
  description?: string;
  title: string;
};

export function LoadingState({
  action,
  className,
  description = "Estamos preparando los datos para esta vista.",
  title = "Cargando",
}: Partial<StateProps>) {
  return (
    <Panel className={cn("flex flex-col items-center justify-center gap-4 px-6 py-10 text-center", className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand-primary)]">
        <LoaderCircle className="h-6 w-6 animate-spin" />
      </div>
      <div className="space-y-2">
        <p className="text-[18px] font-semibold text-[var(--text-primary)]">{title}</p>
        <p className="max-w-xl text-[14px] leading-7 text-[var(--text-secondary)]">{description}</p>
      </div>
      {action}
    </Panel>
  );
}

export function ErrorState({
  action,
  className,
  description = "Hubo un problema al recuperar la información. Revisa el estado del backend o vuelve a intentarlo.",
  title = "No se pudo cargar la información",
}: StateProps) {
  return (
    <Panel className={cn("flex flex-col items-center justify-center gap-4 px-6 py-10 text-center", className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--danger-soft)] text-[var(--danger)]">
        <CircleAlert className="h-6 w-6" />
      </div>
      <div className="space-y-2">
        <p className="text-[18px] font-semibold text-[var(--text-primary)]">{title}</p>
        <p className="max-w-xl text-[14px] leading-7 text-[var(--text-secondary)]">{description}</p>
      </div>
      {action}
    </Panel>
  );
}

export function EmptyState({
  action,
  className,
  description = "Aún no hay datos disponibles para esta vista.",
  title = "Todavía no hay contenido",
}: StateProps) {
  return (
    <Panel className={cn("flex flex-col items-center justify-center gap-4 px-6 py-10 text-center", className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-subtle)] text-[var(--text-secondary)]">
        <Inbox className="h-6 w-6" />
      </div>
      <div className="space-y-2">
        <p className="text-[18px] font-semibold text-[var(--text-primary)]">{title}</p>
        <p className="max-w-xl text-[14px] leading-7 text-[var(--text-secondary)]">{description}</p>
      </div>
      {action}
    </Panel>
  );
}

export function RetryPanel({
  className,
  description = "Haz una nueva llamada cuando el backend o la conexión estén nuevamente disponibles.",
  onRetry,
  retryLabel = "Reintentar",
  title = "¿Quieres volver a intentarlo?",
}: {
  className?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  title?: string;
}) {
  return (
    <Panel className={cn("flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Badge tone="orange">Recuperación</Badge>
          <p className="text-[16px] font-semibold text-[var(--text-primary)]">{title}</p>
        </div>
        <p className="text-[14px] leading-7 text-[var(--text-secondary)]">{description}</p>
      </div>
      <AppButton
        className="shrink-0"
        icon={<RefreshCcw className="h-4 w-4" />}
        onClick={onRetry}
        type="button"
      >
        {retryLabel}
      </AppButton>
    </Panel>
  );
}
