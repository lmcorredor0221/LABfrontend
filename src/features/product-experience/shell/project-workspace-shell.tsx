"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import {
  Bell,
  Check,
  ChevronDown,
  FolderKanban,
  Globe,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  Settings,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/core/auth/auth-context";
import type { TranslationKey } from "@/core/i18n/locales/es";
import { useLanguage } from "@/core/i18n/language-context";
import { PROJECT_STAGE_ORDER, type ProjectRouteStage } from "@/core/routing/routes";
import {
  AttentionDrawer,
  AttentionGlobalBadge,
  type ResolveAttentionItemHandler,
} from "@/features/product-experience/attention/attention-components";
import {
  UxaBadge,
  UxaButton,
  UxaPersistentProcessingFeedback,
  UxaSkipLink,
  UxaStageRail,
  type UxaStageRailItem,
} from "@/features/product-experience/design-system";
import type { ProductExperienceRouteSnapshot } from "@/features/product-experience/core/server-state";
import type { ProductOperationActionSnapshot } from "@/features/product-experience/operations/operation-model";
import type { ProductAttentionActionState } from "@/features/product-experience/shell/use-product-experience-route";
import {
  getProductExperienceProductNav,
  getProductExperienceStage,
  getProductExperienceStageHref,
  getStageState,
  type ProductExperienceProductSection,
} from "@/features/product-experience/shell/experience-model";
import { byLanguage } from "@/features/product-experience/core/localized-copy";
import { cn } from "@/lib/utils";

type ProjectWorkspaceShellProps = {
  activeProduct: ProductExperienceProductSection;
  activeRoute: ProductExperienceRouteSnapshot | null;
  activeStage: ProjectRouteStage;
  attentionAction?: ProductAttentionActionState;
  children: ReactNode;
  onResolveAttentionItem?: ResolveAttentionItemHandler;
  onReload?: () => void;
  operationAction?: ProductOperationActionSnapshot | null;
  sessionId: string;
};

function buildStageRailItems(
  sessionId: string,
  activeStage: ProjectRouteStage,
  t?: (key: TranslationKey, fallback?: string) => string,
): UxaStageRailItem[] {
  return PROJECT_STAGE_ORDER.map((stage) => {
    const definition = getProductExperienceStage(stage, t);
    return {
      description: definition.subtitle,
      href: getProductExperienceStageHref(sessionId, stage),
      key: stage,
      label: definition.title,
      state: getStageState(stage, activeStage),
    };
  });
}

function statusTone(status?: string | null) {
  if (status === "ready") {
    return "success" as const;
  }
  if (status === "failed") {
    return "danger" as const;
  }
  if (status === "needs_review") {
    return "warning" as const;
  }
  return "neutral" as const;
}

function getSessionStatusLabel(language: "es" | "en" | "pt", status?: string | null) {
  switch (status) {
    case "ready":
      return byLanguage(language, { en: "Ready", es: "Listo", pt: "Pronto" });
    case "draft":
      return byLanguage(language, { en: "Draft", es: "Borrador", pt: "Rascunho" });
    case "archived":
      return byLanguage(language, { en: "Archived", es: "Archivado", pt: "Arquivado" });
    case "needs_review":
      return byLanguage(language, { en: "Needs review", es: "Requiere revision", pt: "Requer revisao" });
    case "failed":
      return byLanguage(language, { en: "Failed", es: "Fallido", pt: "Falhou" });
    default:
      return status?.replaceAll("_", " ") ?? byLanguage(language, { en: "Unknown", es: "Desconocido", pt: "Desconhecido" });
  }
}

function getIsProductShellNavActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function ProjectLanguageSelector() {
  const { language, languages, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentLanguage = languages.find((item) => item.code === language) ?? languages[0];
  const localizedLabels = {
    en: t("lang.en", "English"),
    es: t("lang.es", "Espanol"),
    pt: t("lang.pt", "Portugues"),
  } as const;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={t("nav.switchLanguage", "Idioma")}
        className="inline-flex h-9 min-w-[76px] items-center justify-center gap-1.5 rounded-full border border-[var(--border-default)] bg-white px-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--text-primary)] shadow-sm transition hover:bg-[var(--surface-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
        onClick={() => setIsOpen((prev) => !prev)}
        type="button"
      >
        <Globe aria-hidden="true" className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
        {currentLanguage.code}
        <ChevronDown aria-hidden="true" className={cn("h-3 w-3 text-[var(--text-secondary)] transition", isOpen && "rotate-180")} />
      </button>

      {isOpen ? (
        <div className="absolute right-0 mt-2 w-40 rounded-2xl border border-[var(--border-default)] bg-white p-1.5 shadow-xl ring-1 ring-black/5">
          <p className="px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
            {t("lang.select", "Seleccionar idioma")}
          </p>
          {languages.map((item) => {
            const selected = item.code === language;
            return (
              <button
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-[12px] font-medium transition",
                  selected
                    ? "bg-[var(--brand-soft)] text-[var(--brand-primary)]"
                    : "text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]",
                )}
                key={item.code}
                onClick={() => {
                  setLanguage(item.code);
                  setIsOpen(false);
                }}
                type="button"
              >
                <span>{localizedLabels[item.code]}</span>
                {selected ? <Check aria-hidden="true" className="h-3.5 w-3.5" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function ProjectUserMenu() {
  const auth = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const user = auth.user;
  const initials =
    user?.full_name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "LB";
  const globalNav = [
    { href: "/", icon: LayoutDashboard, label: t("nav.home", "Inicio") },
    { href: "/projects", icon: FolderKanban, label: t("nav.projects", "Proyectos") },
    { href: "/settings", icon: Settings, label: t("nav.settings", "Configuracion") },
  ];

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

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={t("shell.userMenu", "Menu de usuario")}
        className="flex h-9 items-center gap-2 rounded-full border border-[var(--border-default)] bg-white py-1 pl-1 pr-2.5 text-[var(--text-primary)] shadow-sm transition hover:bg-[var(--surface-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
        onClick={() => setIsOpen((prev) => !prev)}
        type="button"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#101b2d] text-[11px] font-semibold text-white">
          {initials}
        </span>
        <span className="hidden max-w-[132px] truncate text-[12px] font-semibold sm:inline">
          {user?.full_name ?? "Lean Builder Admin"}
        </span>
        <ChevronDown aria-hidden="true" className={cn("h-3.5 w-3.5 text-[var(--text-secondary)] transition", isOpen && "rotate-180")} />
      </button>

      {isOpen ? (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-[var(--border-default)] bg-white p-2 shadow-xl ring-1 ring-black/5">
          <div className="border-b border-[var(--border-default)] px-3 py-2">
            <p className="truncate text-[13px] font-semibold text-[var(--text-primary)]">{user?.full_name ?? "Lean Builder Admin"}</p>
            <p className="truncate text-[11px] text-[var(--text-secondary)]">
              {user?.active_workspace_name ?? user?.email ?? "Workspace local"}
            </p>
          </div>
          <div className="py-1.5">
            {globalNav.map((item) => {
              const Icon = item.icon;
              const active = getIsProductShellNavActive(pathname, item.href);
              return (
                <Link
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition",
                    active
                      ? "bg-[var(--brand-primary)] text-white"
                      : "text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]",
                  )}
                  href={item.href}
                  key={item.href}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon aria-hidden="true" className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
          <button
            className="flex w-full items-center gap-2.5 rounded-xl border-t border-[var(--border-default)] px-3 py-2.5 text-left text-[13px] font-semibold text-[var(--danger-primary)] transition hover:bg-[var(--danger-soft)]"
            onClick={handleLogout}
            type="button"
          >
            <LogOut aria-hidden="true" className="h-4 w-4" />
            {t("nav.logout", "Cerrar sesion")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ProjectTopbar({
  activeRoute,
  activeStage,
  attentionButtonRef,
  onOpenAttention,
  onReload,
}: {
  activeRoute: ProductExperienceRouteSnapshot | null;
  activeStage: ProjectRouteStage;
  attentionButtonRef: RefObject<HTMLButtonElement | null>;
  onOpenAttention: (source: HTMLElement) => void;
  onReload?: () => void;
}) {
  const { language, t } = useLanguage();
  const snapshot = activeRoute?.snapshot.data ?? null;
  const attention = activeRoute?.attention.data ?? null;
  const overview = activeRoute?.operation.data?.overview ?? null;
  const definition = getProductExperienceStage(activeStage, t);
  const projectTitle = overview?.project_title ?? snapshot?.session.title ?? t("projects.defaultTitle", "Proyecto");
  const status = snapshot?.session.status ?? "draft";

  return (
    <header className="uxa-project-topbar border-b border-[var(--border-default)] bg-white px-4 py-3">
      <div className="uxa-project-topbar-inner flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Link
            aria-label={t("shell.homeAria", "Lean Agent Builder - Inicio")}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[var(--gradient-primary)] shadow-sm text-white"
            href="/"
          >
            <Sparkles aria-hidden="true" className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="uxa-project-kicker flex items-center gap-2 text-[11px]">
              <UxaBadge tone={statusTone(status)}>{getSessionStatusLabel(language, status)}</UxaBadge>
              <UxaBadge tone="info">{definition.product}</UxaBadge>
              <span className="uxa-project-stage-label font-medium text-[var(--text-secondary)]">{definition.title}</span>
            </div>
            <h1 className="uxa-project-title truncate text-[18px] font-semibold text-[var(--text-primary)]">
              {projectTitle}
            </h1>
          </div>
        </div>
        <div className="uxa-project-controls flex items-center gap-3">
          <AttentionGlobalBadge attention={attention} onOpen={onOpenAttention} ref={attentionButtonRef} />
          <UxaButton aria-label={t("shell.projectReloadAria", "Recargar datos del proyecto")} onClick={onReload} size="sm" variant="secondary">
            <RefreshCw aria-hidden="true" className="h-4 w-4" />
            <span className="hidden sm:inline">{t("shell.projectReload", "Recargar")}</span>
          </UxaButton>

          <ProjectLanguageSelector />
          <ProjectUserMenu />
        </div>
      </div>
    </header>
  );
}

function ProductNavigation({
  activeProduct,
  sessionId,
}: {
  activeProduct: ProductExperienceProductSection;
  sessionId: string;
}) {
  const { t } = useLanguage();
  const nav = getProductExperienceProductNav(sessionId, t);

  return (
    <nav aria-label={t("shell.productNavAria", "Navegacion de producto")} className="uxa-product-navigation border-b border-[var(--border-default)] bg-[var(--surface-subtle)] px-4">
      <div className="uxa-product-navigation-list flex items-center gap-1 overflow-x-auto py-2 scrollbar-subtle">
        {nav.map((item) => (
          <Link
            aria-current={activeProduct === item.key ? "page" : undefined}
            className={cn(
              "uxa-product-nav-link rounded-lg px-3 py-1.5 text-[13px] font-medium transition",
              activeProduct === item.key
                ? "bg-[var(--brand-primary)] text-white font-semibold"
                : "text-[var(--text-secondary)] hover:bg-white hover:text-[var(--text-primary)]"
            )}
            href={item.href}
            key={item.key}
            title={item.description}
          >
            <span className="uxa-product-nav-label">{item.label}</span>
            <span className="sr-only">{item.description}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function ProjectWorkspaceShell({
  activeProduct,
  activeRoute,
  activeStage,
  attentionAction,
  children,
  onResolveAttentionItem,
  onReload,
  operationAction,
  sessionId,
}: ProjectWorkspaceShellProps) {
  const [attentionAnnouncement, setAttentionAnnouncement] = useState("");
  const [attentionDrawerOpen, setAttentionDrawerOpen] = useState(false);
  const attentionButtonRef = useRef<HTMLButtonElement | null>(null);
  const attentionReturnFocusRef = useRef<HTMLElement | null>(null);
  const { t } = useLanguage();
  const stageRailItems = buildStageRailItems(sessionId, activeStage, t);
  const stageDefinition = getProductExperienceStage(activeStage, t);
  const activeOperationSubmitting = operationAction?.status === "submitting";
  const activeOperation = activeOperationSubmitting ? operationAction?.operation : null;
  const activeAttention = attentionAction?.status === "submitting";
  const processingActive = Boolean(activeOperationSubmitting || activeAttention);
  const processingTitle = activeAttention
    ? attentionAction?.message ?? t("processing.attention.title", "Aplicando accion del Segmento de Atencion.")
    : operationAction?.message ?? activeOperation?.detail ?? t("processing.generic.title", "Procesando informacion.");
  const processingStep = activeOperation?.currentStepKey
    ? t(activeOperation.currentStepKey, activeOperation.currentStep)
    : activeOperation?.currentStep;
  const processingDescription = activeAttention
    ? t("processing.attention.description", "Estamos guardando tu decision y refrescando el contexto del proyecto.")
    : processingStep
      ? `${processingStep}. ${t("processing.navigationHint", "El proceso continua aunque aun no existan nuevos resultados visibles.")}`
      : t("processing.generic.description", "La plataforma sigue trabajando y actualizara resultados, evidencia y Atencion al finalizar.");
  const processingActivity = activeAttention
    ? t("processing.attention.activity", "HITL")
    : t("processing.backendActivity", "Backend/LLM");

  function openAttention(source: HTMLElement) {
    attentionReturnFocusRef.current = source;
    setAttentionDrawerOpen(true);
  }

  function closeAttention() {
    setAttentionDrawerOpen(false);
    window.setTimeout(() => attentionReturnFocusRef.current?.focus(), 0);
  }

  const handleResolveAttentionItem: ResolveAttentionItemHandler = async (itemKey, payload) => {
    if (!onResolveAttentionItem) {
      return undefined;
    }

    const result = await onResolveAttentionItem(itemKey, payload);
    setAttentionAnnouncement(result?.message ?? t("shell.attentionResolved", "Item del Segmento de Atencion resuelto."));
    return result;
  };

  return (
    <div className="uxa-foundation-root min-h-screen w-full bg-[var(--surface-canvas)]">
      <UxaSkipLink targetId="project-workspace-main">{t("common.skipToContent", "Skip to content")}</UxaSkipLink>
      <p aria-live="polite" className="sr-only" role="status">
        {attentionAnnouncement || operationAction?.operation?.detail || attentionAction?.message || ""}
      </p>
      <div className="min-h-screen w-full">
        <ProjectTopbar
          activeRoute={activeRoute}
          activeStage={activeStage}
          attentionButtonRef={attentionButtonRef}
          onOpenAttention={openAttention}
          onReload={onReload}
        />
        <ProductNavigation activeProduct={activeProduct} sessionId={sessionId} />
        <div className={cn(
          "mx-auto grid w-full max-w-[var(--uxa-layout-content-max)] gap-4 px-4 pb-8 pt-4 lg:px-5",
          activeProduct === "work" ? "xl:grid-cols-[var(--uxa-layout-stage-rail-width)_minmax(0,1fr)]" : "w-full grid-cols-1"
        )}>
          {activeProduct === "work" ? (
            <aside className="hidden min-w-0 xl:block">
              <div className="scrollbar-subtle sticky top-[132px] max-h-[calc(100vh-150px)] overflow-y-auto pr-1">
                <UxaStageRail activeKey={activeStage} items={stageRailItems} />
              </div>
            </aside>
          ) : null}
          <main className="min-w-0 space-y-4" id="project-workspace-main" tabIndex={-1}>
            {children}
          </main>
        </div>
      </div>
      <button
        aria-label={t("shell.floatingAttentionAria", "Abrir Segmento de Atencion")}
        className="fixed bottom-5 right-5 z-40 flex min-h-[var(--uxa-target-primary)] items-center gap-2 rounded-[var(--uxa-radius-md)] bg-[var(--uxa-state-danger)] px-3 text-[12px] font-black text-[var(--uxa-color-inverse)] shadow-[var(--uxa-shadow-elevated)]"
        onClick={(event) => openAttention(event.currentTarget)}
        type="button"
      >
        <Bell aria-hidden="true" className="h-4 w-4" />
        {t("shell.floatingAttention", "Atencion")}
      </button>
      <UxaPersistentProcessingFeedback
        active={processingActive}
        activityLabel={processingActivity}
        description={processingDescription}
        stageLabel={stageDefinition.title}
        title={processingTitle}
      />
      <AttentionDrawer
        actionState={attentionAction}
        activeRoute={activeRoute}
        currentStage={activeStage}
        onClose={closeAttention}
        onResolveItem={handleResolveAttentionItem}
        open={attentionDrawerOpen}
      />
    </div>
  );
}
