"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from "react";
import {
  ArrowRight,
  Bell,
  Check,
  ChevronDown,
  FolderKanban,
  Globe,
  Inbox,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  Settings,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/core/auth/auth-context";
import type { TranslationKey } from "@/core/i18n/locales/es";
import { useLanguage } from "@/core/i18n/language-context";
import {
  AttentionDrawer,
  AttentionGlobalBadge,
  type ResolveAttentionItemHandler,
} from "@/features/product-experience/attention/attention-components";
import {
  UxaBadge,
  UxaButton,
  UxaDrawerHeader,
  UxaPersistentProcessingFeedback,
  UxaProcessingStrip,
  UxaSkipLink,
  UxaStageRail,
  UxaSurface,
  type UxaStageRailItem,
} from "@/features/product-experience/design-system";
import type { ProductExperienceRouteSnapshot } from "@/features/product-experience/core/server-state";
import { ProductOperationPanel } from "@/features/product-experience/operations/operation-panel";
import {
  buildProductOperationEnvelope,
  type ProductOperationActionSnapshot,
} from "@/features/product-experience/operations/operation-model";
import {
  getJourneyStateMachineDisplay,
} from "@/features/product-experience/saas/journey-state-machine-ui";
import { getJourneyStateMachineCurrent } from "@/features/product-experience/saas/product-journey-overview";
import type { ProductAttentionActionState } from "@/features/product-experience/shell/use-product-experience-route";
import {
  getProductExperienceProductNav,
  getProductExperienceStage,
  getProductExperienceStageHref,
  getStageState,
  type ProductExperienceProductSection,
} from "@/features/product-experience/shell/experience-model";
import {
  LEAN_WORK_STAGES,
  type LeanExperienceStage,
} from "@/features/journey/journey-model";
import { byLanguage } from "@/features/product-experience/core/localized-copy";
import { cn } from "@/lib/utils";

const BLUEPRINT_WORK_STAGE_ORDER = LEAN_WORK_STAGES.filter(
  (stage): stage is Exclude<(typeof LEAN_WORK_STAGES)[number], "validate" | "package"> =>
    stage !== "validate" && stage !== "package",
);

type ProjectWorkspaceShellProps = {
  activeProduct: ProductExperienceProductSection;
  activeRoute: ProductExperienceRouteSnapshot | null;
  activeStage: LeanExperienceStage;
  attentionAction?: ProductAttentionActionState;
  children: ReactNode;
  onResolveAttentionItem?: ResolveAttentionItemHandler;
  onCancelOperation?: (operationId: string) => void | Promise<void>;
  onReload?: () => void;
  onRetryOperation?: (operationId: string) => void | Promise<void>;
  operationAction?: ProductOperationActionSnapshot | null;
  sessionId: string;
};

function buildStageRailItems(
  sessionId: string,
  activeStage: LeanExperienceStage,
  t?: (key: TranslationKey, fallback?: string) => string,
): UxaStageRailItem[] {
  return BLUEPRINT_WORK_STAGE_ORDER.map((stage) => {
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

  if (href === "/projects") {
    return pathname === "/projects";
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
    { href: "/admin/requests", icon: Inbox, label: t("nav.requests", "Gestión de solicitudes") },
    { href: "/settings", icon: Settings, label: t("nav.settings", "Configuración") },
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
  activeStage: LeanExperienceStage;
  attentionButtonRef: RefObject<HTMLButtonElement | null>;
  onOpenAttention: (source: HTMLElement) => void;
  onReload?: () => void;
}) {
  const { language, t } = useLanguage();
  const snapshot = activeRoute?.snapshot.data ?? null;
  const attention = activeRoute?.attention.data ?? null;
  const overview = activeRoute?.operation.data?.overview ?? null;
  const definition = getProductExperienceStage(activeStage, t);
  const journeyDisplay = getJourneyStateMachineDisplay(language, overview?.journey_state_machine ?? null);
  const projectTitle = overview?.project_title ?? snapshot?.session.title ?? t("projects.defaultTitle", "Proyecto");
  const status = snapshot?.session.status ?? "draft";
  const productLabel = journeyDisplay?.productLabel ?? definition.product;
  const stageLabel = journeyDisplay?.label ?? definition.title;
  const stageDetail = journeyDisplay?.detail ?? definition.subtitle;
  const substateLabel = journeyDisplay?.substateLabel ?? null;
  const substateTone = journeyDisplay?.substateTone ?? "info";

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
              <UxaBadge tone="info">{productLabel}</UxaBadge>
              {substateLabel ? <UxaBadge tone={substateTone}>{substateLabel}</UxaBadge> : null}
              <span className="uxa-project-stage-label font-medium text-[var(--text-secondary)]">{stageLabel}</span>
            </div>
            <h1 className="uxa-project-title truncate text-[18px] font-semibold text-[var(--text-primary)]">
              {projectTitle}
            </h1>
            <p className="mt-1 truncate text-[12px] text-[var(--text-secondary)]">{stageDetail}</p>
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

type JourneyActionState = "available" | "recommended" | "running" | "blocked" | "disabled" | "hidden";

function getActionTone(state?: JourneyActionState) {
  switch (state) {
    case "blocked":
      return "danger" as const;
    case "running":
      return "info" as const;
    case "recommended":
      return "brand" as const;
    case "available":
      return "success" as const;
    default:
      return "neutral" as const;
  }
}

function getActionStateLabel(
  language: "es" | "en" | "pt",
  state?: JourneyActionState,
) {
  switch (state) {
    case "blocked":
      return byLanguage(language, { en: "Blocked", es: "Bloqueada", pt: "Bloqueada" });
    case "running":
      return byLanguage(language, { en: "In progress", es: "En curso", pt: "Em andamento" });
    case "recommended":
      return byLanguage(language, { en: "Recommended", es: "Recomendada", pt: "Recomendada" });
    case "available":
      return byLanguage(language, { en: "Available", es: "Disponible", pt: "Disponivel" });
    default:
      return byLanguage(language, { en: "Stand by", es: "En espera", pt: "Em espera" });
  }
}

function formatCountLabel(
  language: "es" | "en" | "pt",
  count: number,
  singular: { en: string; es: string; pt: string },
  plural: { en: string; es: string; pt: string },
) {
  const labels = count === 1 ? singular : plural;
  return `${count} ${byLanguage(language, labels)}`;
}

function ContextCard({
  body,
  eyebrow,
  title,
}: {
  body: ReactNode;
  eyebrow: ReactNode;
  title: ReactNode;
}) {
  return (
    <div className="rounded-[18px] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-secondary)]">{eyebrow}</p>
      <h3 className="mt-2 text-[15px] font-semibold text-[var(--text-primary)]">{title}</h3>
      <div className="mt-2 text-[12.5px] leading-6 text-[var(--text-secondary)]">{body}</div>
    </div>
  );
}

function JourneyContextPanel({
  activeRoute,
  activeStage,
  onOpenAttention,
  onReload,
  processingActive,
  processingDescription,
  processingTitle,
}: {
  activeRoute: ProductExperienceRouteSnapshot | null;
  activeStage: LeanExperienceStage;
  onOpenAttention: (source: HTMLElement) => void;
  onReload?: () => void;
  processingActive: boolean;
  processingDescription: string;
  processingTitle: string;
}) {
  const { language, t } = useLanguage();
  const guideDrawerBodyId = useId();
  const guideDrawerTitleId = useId();
  const guideDrawerRef = useRef<HTMLElement | null>(null);
  const guideDrawerTriggerRef = useRef<HTMLButtonElement | null>(null);
  const shouldRestoreGuideFocusRef = useRef(false);
  const [guideDrawerOpen, setGuideDrawerOpen] = useState(false);
  const overview = activeRoute?.operation.data?.overview ?? null;
  const attention = activeRoute?.attention.data ?? null;
  const snapshot = activeRoute?.snapshot.data ?? null;
  const definition = getProductExperienceStage(activeStage, t);
  const currentJourney = getJourneyStateMachineCurrent(overview?.journey_state_machine ?? null);
  const journeyDisplay = getJourneyStateMachineDisplay(language, overview?.journey_state_machine ?? null);
  const projectTitle = overview?.project_title ?? snapshot?.session.title ?? t("projects.defaultTitle", "Proyecto");
  const productLabel = journeyDisplay?.productLabel ?? definition.product;
  const stageLabel = journeyDisplay?.label ?? definition.title;
  const stageDetail = journeyDisplay?.detail ?? definition.subtitle;
  const substateLabel = journeyDisplay?.substateLabel ?? byLanguage(language, { en: "Ready", es: "Listo", pt: "Pronto" });
  const substateTone = journeyDisplay?.substateTone ?? "info";
  const progress = Math.max(0, Math.min(100, Math.round(currentJourney?.progress_percent ?? 0)));
  const actionableCount = attention?.actionable_count ?? 0;
  const blockingCount = attention?.blocking_count ?? 0;
  const exports = overview?.exports ?? [];
  const readyExports = exports.filter((item) => item.status === "ready").length;
  const runningExports = exports.filter((item) => item.status === "running").length;
  const pendingExports = exports.filter((item) => item.status === "pending").length;
  const failedExports = exports.filter((item) => item.status === "failed").length;
  const hasAttentionAction = blockingCount > 0 || (actionableCount > 0 && currentJourney?.substate === "waiting_user");
  const fallbackHref = currentJourney?.href || "";
  const ctaAction = hasAttentionAction
    ? {
        kind: "attention" as const,
        label: blockingCount > 0
          ? byLanguage(language, { en: "Resolve blockers", es: "Resolver bloqueos", pt: "Resolver bloqueios" })
          : byLanguage(language, { en: "Review attention", es: "Revisar Atencion", pt: "Revisar Atencao" }),
        reason: blockingCount > 0
          ? byLanguage(language, {
              en: "There are blockers that must be reviewed before moving forward.",
              es: "Hay bloqueos que deben revisarse antes de continuar.",
              pt: "Ha bloqueios que precisam ser revisados antes de continuar.",
            })
          : byLanguage(language, {
              en: "There are pending questions or decisions waiting for your input.",
              es: "Hay preguntas o decisiones pendientes esperando tu input.",
              pt: "Ha perguntas ou decisoes pendentes aguardando sua resposta.",
            }),
      }
    : fallbackHref
        ? {
          action: {
              action_key: "open_current_context",
              href: fallbackHref,
              label: byLanguage(language, {
                en: `Open ${stageLabel}`,
                es: `Abrir ${stageLabel}`,
                pt: `Abrir ${stageLabel}`,
              }),
              primary: true,
              product_key: currentJourney?.product_key ?? "blueprint_basic",
              reason: currentJourney?.detail ?? stageDetail,
              state: (currentJourney?.blocking ? "blocked" : currentJourney?.substate === "running" ? "running" : "available") as JourneyActionState,
            },
            kind: "link" as const,
          }
        : {
            kind: "reload" as const,
            label: byLanguage(language, { en: "Refresh context", es: "Recargar contexto", pt: "Recarregar contexto" }),
            reason: byLanguage(language, {
              en: "Reload the latest state to recover the next recommended action.",
              es: "Recarga el ultimo estado para recuperar la siguiente accion recomendada.",
              pt: "Recarregue o ultimo estado para recuperar a proxima acao recomendada.",
            }),
          };
  const expectationText = blockingCount > 0
    ? byLanguage(language, {
        en: "Resolve the blocking items in Attention before continuing with the next product transition.",
        es: "Resuelve los items bloqueantes en Atencion antes de continuar con la siguiente transicion del flujo.",
        pt: "Resolva os itens bloqueantes em Atencao antes de continuar com a proxima transicao do fluxo.",
      })
    : actionableCount > 0
      ? byLanguage(language, {
          en: "Review the pending questions, decisions, or warnings that LAB grouped for you.",
          es: "Revisa las preguntas, decisiones o alertas pendientes que LAB ya agrupo para ti.",
          pt: "Revise as perguntas, decisoes ou alertas pendentes que o LAB ja agrupou para voce.",
        })
      : currentJourney?.substate === "waiting_user"
          ? stageDetail
          : byLanguage(language, {
              en: "No immediate action is required from you right now.",
              es: "No hay una accion inmediata requerida de tu lado en este momento.",
              pt: "Nao ha uma acao imediata necessaria da sua parte neste momento.",
            });
  const labNowTitle = processingActive
    ? processingTitle
    : currentJourney?.blocking
      ? byLanguage(language, {
          en: "LAB detected a blocking condition in the current context.",
          es: "LAB detecto una condicion bloqueante en el contexto actual.",
          pt: "O LAB detectou uma condicao bloqueante no contexto atual.",
        })
      : currentJourney?.substate === "running" || currentJourney?.substate === "retrying"
        ? stageDetail
        : byLanguage(language, {
            en: "LAB keeps the project context synchronized and ready to continue.",
            es: "LAB mantiene el contexto del proyecto sincronizado y listo para continuar.",
            pt: "O LAB mantem o contexto do projeto sincronizado e pronto para continuar.",
          });
  const labNowDescription = processingActive
    ? processingDescription
    : currentJourney?.detail ?? stageDetail;
  const progressLabel = byLanguage(language, {
    en: `Current progress in ${stageLabel}`,
    es: `Progreso actual en ${stageLabel}`,
    pt: `Progresso atual em ${stageLabel}`,
  });
  const guideTitle = byLanguage(language, { en: "Current guide", es: "Guia del momento", pt: "Guia do momento" });
  const nextStepLabel = byLanguage(language, { en: "What comes next", es: "Que sigue", pt: "O que vem depois" });
  const nextStepTitle = byLanguage(language, { en: "Recommended action", es: "Accion recomendada", pt: "Acao recomendada" });
  const viewGuideLabel = byLanguage(language, { en: "View guide", es: "Ver guia", pt: "Ver guia" });
  const closeGuideLabel = byLanguage(language, { en: "Close guide", es: "Cerrar guia", pt: "Fechar guia" });
  const expectationTitle = byLanguage(language, { en: "Your next input", es: "Tu siguiente input", pt: "Sua proxima entrada" });
  const expectationEyebrow = byLanguage(language, { en: "What LAB expects from me", es: "Que espera de mi", pt: "O que o LAB espera de mim" });
  const labNowEyebrow = byLanguage(language, { en: "What LAB does", es: "Que hace LAB", pt: "O que o LAB faz" });
  const locationEyebrow = byLanguage(language, { en: "Where am I", es: "Donde estoy", pt: "Onde estou" });
  const footerLabel = byLanguage(language, { en: "Related state", es: "Estado relacionado", pt: "Estado relacionado" });
  const attentionRequiredLabel = byLanguage(language, { en: "Attention required", es: "Atencion requerida", pt: "Atencao necessaria" });
  const pendingReviewLabel = byLanguage(language, { en: "Pending review", es: "Revision pendiente", pt: "Revisao pendente" });
  const refreshLabel = byLanguage(language, { en: "Refresh", es: "Recarga", pt: "Recarga" });
  const ctaTone = ctaAction.kind === "link"
    ? getActionTone(ctaAction.action.state)
    : ctaAction.kind === "attention"
      ? blockingCount > 0 ? "danger" : "warning"
      : "neutral";
  const ctaStatusLabel = ctaAction.kind === "link"
    ? getActionStateLabel(language, ctaAction.action.state)
    : ctaAction.kind === "attention"
      ? (blockingCount > 0 ? attentionRequiredLabel : pendingReviewLabel)
      : refreshLabel;
  const ctaReason = ctaAction.kind === "link" ? ctaAction.action.reason : ctaAction.reason;
  const summaryText = hasAttentionAction ? ctaReason : currentJourney?.detail ?? stageDetail;
  const footerSummary = exports.length > 0 ? (
    <>
      {readyExports > 0 ? <UxaBadge tone="success">{formatCountLabel(language, readyExports, { en: "export ready", es: "export listo", pt: "export pronto" }, { en: "exports ready", es: "exports listos", pt: "exports prontos" })}</UxaBadge> : null}
      {runningExports > 0 ? <UxaBadge tone="info">{formatCountLabel(language, runningExports, { en: "export running", es: "export en proceso", pt: "export em processamento" }, { en: "exports running", es: "exports en proceso", pt: "exports em processamento" })}</UxaBadge> : null}
      {pendingExports > 0 ? <UxaBadge tone="warning">{formatCountLabel(language, pendingExports, { en: "export pending", es: "export pendiente", pt: "export pendente" }, { en: "exports pending", es: "exports pendientes", pt: "exports pendentes" })}</UxaBadge> : null}
      {failedExports > 0 ? <UxaBadge tone="danger">{formatCountLabel(language, failedExports, { en: "export failed", es: "export fallido", pt: "export falhou" }, { en: "exports failed", es: "exports fallidos", pt: "exports falharam" })}</UxaBadge> : null}
      {attention?.total_count ? <UxaBadge tone="danger">{formatCountLabel(language, attention.total_count, { en: "attention item", es: "item en Atencion", pt: "item em Atencao" }, { en: "attention items", es: "items en Atencion", pt: "itens em Atencao" })}</UxaBadge> : null}
    </>
  ) : (
    <span>{stageDetail}</span>
  );

  const ctaPrimaryControl = ctaAction.kind === "link" ? (
    <Link className="uxa-button uxa-button--primary uxa-button--sm inline-flex items-center gap-2" href={ctaAction.action.href}>
      <span>{ctaAction.action.label}</span>
      <ArrowRight aria-hidden="true" className="h-4 w-4" />
    </Link>
  ) : ctaAction.kind === "attention" ? (
    <UxaButton
      className="inline-flex items-center gap-2"
      onClick={(event) => onOpenAttention(event.currentTarget)}
      size="sm"
    >
      <span>{ctaAction.label}</span>
      <ArrowRight aria-hidden="true" className="h-4 w-4" />
    </UxaButton>
  ) : (
    <UxaButton className="inline-flex items-center gap-2" onClick={onReload} size="sm" variant="secondary">
      <span>{ctaAction.label}</span>
      <RefreshCw aria-hidden="true" className="h-4 w-4" />
    </UxaButton>
  );

  const ctaCardBody = (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <UxaBadge tone={ctaTone}>{ctaStatusLabel}</UxaBadge>
      </div>
      <p>{ctaReason}</p>
      {ctaPrimaryControl}
    </div>
  );

  useEffect(() => {
    if (!guideDrawerOpen) {
      return;
    }

    const dialog = guideDrawerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusableSelector = [
      "button:not([disabled])",
      "a[href]",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "input:not([disabled])",
      "[tabindex]:not([tabindex='-1'])",
    ].join(",");

    window.setTimeout(() => dialog?.querySelector<HTMLElement>(focusableSelector)?.focus(), 0);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        shouldRestoreGuideFocusRef.current = true;
        setGuideDrawerOpen(false);
        return;
      }

      if (event.key === "Tab" && dialog) {
        const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector));
        const first = focusable[0];
        const last = focusable.at(-1);
        if (!first || !last) {
          return;
        }
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [guideDrawerOpen]);

  useEffect(() => {
    if (guideDrawerOpen || !shouldRestoreGuideFocusRef.current) {
      return;
    }

    shouldRestoreGuideFocusRef.current = false;
    window.setTimeout(() => guideDrawerTriggerRef.current?.focus(), 0);
  }, [guideDrawerOpen]);

  const closeGuideDrawer = () => {
    shouldRestoreGuideFocusRef.current = true;
    setGuideDrawerOpen(false);
  };

  return (
    <section aria-label={byLanguage(language, { en: "Current project context", es: "Contexto actual del proyecto", pt: "Contexto atual do projeto" })}>
      <UxaSurface aria-live="polite" className="overflow-hidden border border-[var(--border-default)] bg-white shadow-sm">
        <div className="px-4 py-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <UxaBadge tone="info">{productLabel}</UxaBadge>
                <UxaBadge tone={substateTone}>{substateLabel}</UxaBadge>
                {blockingCount > 0 ? <UxaBadge tone="danger">{formatCountLabel(language, blockingCount, { en: "blocker", es: "bloqueo", pt: "bloqueio" }, { en: "blockers", es: "bloqueos", pt: "bloqueios" })}</UxaBadge> : null}
                {actionableCount > 0 && blockingCount === 0 ? <UxaBadge tone="warning">{formatCountLabel(language, actionableCount, { en: "pending item", es: "pendiente", pt: "pendencia" }, { en: "pending items", es: "pendientes", pt: "pendencias" })}</UxaBadge> : null}
              </div>
              <div className="mt-2 flex min-w-0 flex-col gap-1 lg:flex-row lg:items-baseline lg:gap-3">
                <h2 className="shrink-0 text-[18px] font-semibold text-[var(--text-primary)] text-pretty">
                  {stageLabel}
                </h2>
                <p className="min-w-0 line-clamp-2 break-words text-[12.5px] leading-5 text-[var(--text-secondary)] lg:line-clamp-1">
                  {summaryText}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <UxaBadge tone="neutral">
                {byLanguage(language, { en: "Progress", es: "Progreso", pt: "Progresso" })} {progress}%
              </UxaBadge>
              <UxaButton
                aria-controls={guideDrawerBodyId}
                aria-expanded={guideDrawerOpen}
                aria-haspopup="dialog"
                className="shrink-0"
                onClick={() => setGuideDrawerOpen(true)}
                ref={guideDrawerTriggerRef}
                size="sm"
                variant="ghost"
              >
                <span>{viewGuideLabel}</span>
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </UxaButton>
              {ctaPrimaryControl}
            </div>
          </div>
        </div>
      </UxaSurface>
      {guideDrawerOpen ? (
        <div className="fixed inset-0 z-[90]">
          <button aria-label={closeGuideLabel} className="absolute inset-0 bg-slate-950/50" onClick={closeGuideDrawer} type="button" />
          <aside
            aria-labelledby={guideDrawerTitleId}
            aria-modal="true"
            className="absolute right-0 top-0 flex h-full w-full max-w-[640px] flex-col overflow-hidden overscroll-contain bg-[var(--uxa-color-canvas)] shadow-[var(--uxa-shadow-elevated)]"
            ref={guideDrawerRef}
            role="dialog"
          >
            <UxaDrawerHeader
              closeLabel={closeGuideLabel}
              description={`${projectTitle} · ${stageLabel}`}
              eyebrow={<UxaBadge tone="info">{productLabel}</UxaBadge>}
              onClose={closeGuideDrawer}
              title={guideTitle}
              titleId={guideDrawerTitleId}
            />
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-[var(--uxa-panel-padding-lg)]">
              <div className="space-y-4" id={guideDrawerBodyId}>
                <div className="rounded-[18px] border border-[var(--border-default)] bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-semibold text-[var(--text-secondary)]">
                    <span>{progressLabel}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="mt-3">
                    <UxaProcessingStrip label={progressLabel} value={progress} />
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <ContextCard
                    body={(
                      <div className="space-y-2">
                        <p className="font-semibold text-[var(--text-primary)]">{stageLabel}</p>
                        <p>{stageDetail}</p>
                      </div>
                    )}
                    eyebrow={locationEyebrow}
                    title={productLabel}
                  />
                  <ContextCard
                    body={(
                      <div className="space-y-2">
                        <p className="font-semibold text-[var(--text-primary)]">{labNowTitle}</p>
                        <p>{labNowDescription}</p>
                      </div>
                    )}
                    eyebrow={labNowEyebrow}
                    title={substateLabel}
                  />
                  <ContextCard
                    body={(
                      <div className="space-y-2">
                        <p>{expectationText}</p>
                      </div>
                    )}
                    eyebrow={expectationEyebrow}
                    title={expectationTitle}
                  />
                  <ContextCard
                    body={ctaCardBody}
                    eyebrow={nextStepLabel}
                    title={nextStepTitle}
                  />
                </div>
                <div className="rounded-[18px] border border-[var(--border-default)] bg-white p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-secondary)]">{footerLabel}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-secondary)]">{footerSummary}</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </section>
  );
}

export function ProjectWorkspaceShell({
  activeProduct,
  activeRoute,
  activeStage,
  attentionAction,
  children,
  onCancelOperation,
  onResolveAttentionItem,
  onReload,
  onRetryOperation,
  operationAction,
  sessionId,
}: ProjectWorkspaceShellProps) {
  const [attentionAnnouncement, setAttentionAnnouncement] = useState("");
  const [attentionDrawerOpen, setAttentionDrawerOpen] = useState(false);
  const attentionButtonRef = useRef<HTMLButtonElement | null>(null);
  const attentionReturnFocusRef = useRef<HTMLElement | null>(null);
  const { language, t } = useLanguage();
  const stageRailItems = buildStageRailItems(sessionId, activeStage, t);
  const stageDefinition = getProductExperienceStage(activeStage, t);
  const journeyDisplay = getJourneyStateMachineDisplay(language, activeRoute?.operation.data?.overview?.journey_state_machine ?? null);
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
  const operationPanelVisible = Boolean(buildProductOperationEnvelope({ actionState: operationAction, activeRoute }));

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
            <JourneyContextPanel
              activeRoute={activeRoute}
              activeStage={activeStage}
              onOpenAttention={openAttention}
              onReload={onReload}
              processingActive={processingActive}
              processingDescription={processingDescription}
              processingTitle={processingTitle}
            />
            {operationPanelVisible ? (
              <ProductOperationPanel
                actionState={operationAction}
                activeRoute={activeRoute}
                onCancelOperation={onCancelOperation}
                onReload={onReload}
                onRetryOperation={onRetryOperation}
              />
            ) : null}
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
        stageLabel={journeyDisplay?.label ?? stageDefinition.title}
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
