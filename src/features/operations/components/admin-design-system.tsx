"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import {
  UxaBadge,
  UxaButton,
  UxaSurface,
  type UxaButtonSize,
  type UxaButtonVariant,
  type UxaTone,
} from "@/features/product-experience/design-system";
import { cn } from "@/lib/utils";

export type AdminDesignTone = "blue" | "green" | "orange" | "red" | "slate" | "violet";

const ADMIN_TO_UXA_TONE: Record<AdminDesignTone, UxaTone> = {
  blue: "info",
  green: "success",
  orange: "warning",
  red: "danger",
  slate: "neutral",
  violet: "info",
};

export function AdminBadge({
  children,
  className,
  tone = "slate",
}: {
  children: ReactNode;
  className?: string;
  tone?: AdminDesignTone;
}) {
  return (
    <UxaBadge
      className={cn(
        tone === "violet" && "border-[rgba(79,70,245,0.22)] bg-[var(--brand-soft)] text-[var(--brand-primary)]",
        className,
      )}
      tone={ADMIN_TO_UXA_TONE[tone]}
    >
      {children}
    </UxaBadge>
  );
}

export function AdminSurface({
  as = "section",
  children,
  className,
  muted = false,
}: {
  as?: "article" | "aside" | "div" | "section";
  children: ReactNode;
  className?: string;
  muted?: boolean;
}) {
  return (
    <UxaSurface
      as={as}
      className={cn("border-[var(--border-default)] bg-white shadow-[0_14px_38px_rgba(15,23,42,0.045)]", className)}
      muted={muted}
    >
      {children}
    </UxaSurface>
  );
}

export type AdminButtonVariant = "danger" | "ghost" | "primary" | "secondary";

function mapButtonVariant(variant: AdminButtonVariant): UxaButtonVariant {
  return variant;
}

function mapButtonSize(className?: string): UxaButtonSize | undefined {
  if (!className) {
    return undefined;
  }
  if (className.includes("h-9") || className.includes("text-[12px]")) {
    return "sm";
  }
  if (className.includes("h-12")) {
    return "lg";
  }
  return undefined;
}

export function AdminButton({
  children,
  className,
  disabled,
  icon,
  loading = false,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
  loading?: boolean;
  variant?: AdminButtonVariant;
}) {
  return (
    <UxaButton
      className={cn(icon && "inline-flex items-center gap-2", className)}
      disabled={disabled}
      isLoading={loading}
      size={mapButtonSize(className)}
      variant={mapButtonVariant(variant)}
      {...props}
    >
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      {children}
    </UxaButton>
  );
}
