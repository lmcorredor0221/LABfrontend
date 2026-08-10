"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Bell,
  BookOpen,
  ChevronDown,
  CircleHelp,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Settings,
} from "lucide-react";
import { useAuth } from "@/core/auth/auth-context";
import { useLanguage } from "@/core/i18n/language-context";
import { LanguageSelector } from "@/components/lean/language-selector";
import { cn } from "@/lib/utils";

function getIsActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  if (href === "/projects") {
    return pathname === "/projects";
  }

  if (href.startsWith("/projects/")) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  if (href.startsWith("/agents/")) {
    return pathname.startsWith("/agents/");
  }

  return pathname.startsWith(href.split("/:")[0]) || pathname.startsWith(href);
}

export function WorkspaceShell({
  children,
}: {
  children: ReactNode;
  variant?: "full" | "icon";
  sidebarHeader?: ReactNode;
  sidebarFooter?: ReactNode;
  moduleLabel?: string;
}) {
  return (
    <div className="min-h-screen w-full bg-[var(--surface-canvas)] text-[var(--text-primary)]">
      <main className="min-h-screen w-full">{children}</main>
    </div>
  );
}

export function UserDropdownMenu({ compact = false }: { compact?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();

  const user = auth.user;
  const initials =
    user?.full_name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "LB";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    setIsOpen(false);
    await auth.logout();
    router.replace("/login");
  }

  const { t } = useLanguage();
  const globalNav = [
    { label: t("nav.home", "Inicio"), href: "/", icon: LayoutDashboard },
    { label: t("nav.projects", "Proyectos"), href: "/projects", icon: FolderKanban },
    { label: t("nav.settings", "Configuración"), href: "/settings", icon: Settings },
  ];

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-white px-2 py-1 text-[var(--text-primary)] transition hover:bg-[var(--surface-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]",
          compact ? "h-9 px-1.5" : "h-11 px-2.5"
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={t("shell.userMenu", "Menú de usuario")}
      >
        <div className={cn("flex items-center justify-center rounded-full bg-[#101b2d] font-semibold text-white shadow-sm", compact ? "h-7 w-7 text-[11px]" : "h-8 w-8 text-[13px]")}>
          {initials}
        </div>
        <span className="hidden text-[13px] font-medium sm:inline-block max-w-[130px] truncate">
          {user?.full_name ?? "Lean Builder Admin"}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-[var(--text-secondary)] transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-[var(--border-default)] bg-white p-2.5 shadow-2xl ring-1 ring-black/5 z-50 animate-in fade-in-50 zoom-in-95">
          {/* Header de Usuario */}
          <div className="px-3 py-2 border-b border-[var(--border-default)] mb-1.5">
            <p className="text-[14px] font-semibold text-[var(--text-primary)] truncate">{user?.full_name ?? "Lean Builder Admin"}</p>
            <p className="text-[12px] text-[var(--text-secondary)] truncate">{user?.active_workspace_name ?? user?.email ?? "Workspace local"}</p>
          </div>

          {/* Navegación Exclusiva (Inicio, Proyectos, Configuración) */}
          <div className="space-y-0.5">
            <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-secondary)]">{t("nav.mainNav", "Navegación Principal")}</p>
            {globalNav.map((item) => {
              const Icon = item.icon;
              const active = getIsActive(pathname, item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-[14px] font-medium transition",
                    active
                      ? "bg-[var(--brand-primary)] text-white font-semibold shadow-sm"
                      : "text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="my-2 border-t border-[var(--border-default)]" />

          {/* Ayuda y Documentación */}
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-[14px] font-medium text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition text-left"
            >
              <CircleHelp className="h-4 w-4 shrink-0 text-[var(--text-secondary)]" />
              <span>{t("nav.help", "Ayuda")}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-[14px] font-medium text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition text-left"
            >
              <BookOpen className="h-4 w-4 shrink-0 text-[var(--text-secondary)]" />
              <span>{t("nav.docs", "Documentación")}</span>
            </button>
          </div>

          <div className="my-2 border-t border-[var(--border-default)]" />

          {/* Cerrar Sesión */}
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={auth.status === "submitting"}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-[14px] font-medium text-red-600 hover:bg-red-50 transition text-left disabled:opacity-50"
          >
            <LogOut className="h-4 w-4 shrink-0 text-red-600" />
            <span>{auth.status === "submitting" ? t("nav.loggingOut", "Cerrando sesión...") : t("nav.logout", "Cerrar sesión")}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export function WorkspaceUserCard({
  name,
  subtitle,
}: {
  name: string;
  subtitle: string;
  initials?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[18px] border border-[var(--border-default)] bg-white px-3 py-3 text-[var(--text-primary)]">
      <UserDropdownMenu />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium">{name}</p>
        <p className="truncate text-[12px] text-[var(--text-secondary)]">{subtitle}</p>
      </div>
    </div>
  );
}

export function StatusCard({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-[18px] border border-[var(--border-default)] bg-white px-4 py-4 text-[var(--text-primary)]">
      <p className="text-[13px] text-[var(--text-secondary)]">{title}</p>
      <p className="mt-1 text-[16px] font-semibold">{subtitle}</p>
      <div className="mt-3 flex items-center gap-2 text-[13px] text-[#22734a]">
        <span className="h-2 w-2 rounded-full bg-[#22734a]" />
        Óptimo
      </div>
    </div>
  );
}

export function PageChrome({
  breadcrumbs,
  actions,
  children,
  density = "standard",
}: {
  breadcrumbs?: string[];
  actions?: ReactNode;
  children: ReactNode;
  density?: "compact" | "standard";
}) {
  const compact = density === "compact";

  return (
    <div className={cn("px-4 sm:px-6", compact ? "py-3 lg:px-5 lg:py-4" : "py-4 lg:px-8 lg:py-6")}>
      <div className={cn("mx-auto max-w-[1480px]", compact ? "space-y-3" : "space-y-6")}>
        <div className={cn("flex flex-col lg:flex-row lg:items-start lg:justify-between", compact ? "gap-2" : "gap-4")}>
          <div className="space-y-2">
            {breadcrumbs?.length ? (
              <div className={cn("flex flex-wrap items-center gap-2 text-[var(--text-secondary)]", compact ? "text-[12px]" : "text-[13px]")}>
                {breadcrumbs.map((item, index) => (
                  <div key={`${item}-${index}`} className="flex items-center gap-2">
                    <span>{item}</span>
                    {index < breadcrumbs.length - 1 ? <span className="text-[var(--border-default)]">{">"}</span> : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
        </div>
        {children}
      </div>
    </div>
  );
}

export function TopUtilities({
  density = "standard",
}: {
  density?: "compact" | "standard";
} = {}) {
  const auth = useAuth();
  const { t } = useLanguage();
  const workspaceOptions = auth.user?.workspaces ?? [];
  const activeWorkspaceId = auth.user?.active_workspace_id ?? "";
  const compact = density === "compact";

  return (
    <div className={cn("flex w-full items-center justify-end gap-3 sm:w-auto", compact ? "gap-2" : "gap-3")}>
      {workspaceOptions.length > 0 ? (
        <label className={cn("flex min-w-0 items-center rounded-[10px] border border-[var(--border-default)] bg-white text-[var(--text-primary)]", compact ? "h-9 gap-2 px-2.5 sm:min-w-[190px]" : "gap-3 px-3 py-2 sm:min-w-[220px]")}>
          <div className="min-w-0 flex-1">
            <p className={cn("uppercase tracking-[0.18em] text-[var(--text-muted)]", compact ? "sr-only" : "text-[11px]")}>{t("shell.workspaceLabel", "Workspace")}</p>
            <select
              value={activeWorkspaceId}
              onChange={(event) => void auth.selectWorkspace(event.target.value)}
              disabled={auth.status === "submitting" || workspaceOptions.length <= 1}
              className={cn("w-full min-w-0 truncate border-0 bg-transparent p-0 pr-5 font-semibold outline-none disabled:cursor-not-allowed", compact ? "text-[12px]" : "mt-1 text-[14px]")}
              aria-label={t("shell.workspaceSelectAria", "Seleccionar workspace")}
            >
              {workspaceOptions.map((workspace) => (
                <option key={workspace.workspace_id} value={workspace.workspace_id}>
                  {workspace.workspace_name}
                </option>
              ))}
            </select>
          </div>
        </label>
      ) : null}
      <button
        aria-label={t("shell.openNotifications", "Abrir notificaciones")}
        type="button"
        title={t("shell.notifications", "Notificaciones")}
        className={cn("relative flex items-center justify-center rounded-[10px] border border-[var(--border-default)] bg-white text-[var(--text-primary)] transition hover:bg-[var(--surface-subtle)]", compact ? "h-9 w-9" : "h-11 w-11")}
      >
        <Bell aria-hidden="true" className="h-4 w-4" />
        <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[var(--danger)]" />
      </button>

      <LanguageSelector />
      <UserDropdownMenu compact={compact} />
    </div>
  );
}
