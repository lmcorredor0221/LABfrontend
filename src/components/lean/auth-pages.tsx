"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CircleAlert,
  LoaderCircle,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import {
  AppButton,
  Badge,
  DividerLabel,
  InlineFieldError,
  Panel,
  ProgressBar,
  TextField,
} from "@/components/lean/ui";
import { useAuth } from "@/core/auth/auth-context";
import { LanguageSelector } from "@/components/lean/language-selector";
import { useLanguage } from "@/core/i18n/language-context";
import {
  SEEDED_LOCAL_ADMIN_EMAIL,
  SEEDED_LOCAL_ADMIN_PASSWORD,
} from "@/core/auth/constants";
import {
  validateLoginCredentials,
  type LoginValidationErrors,
} from "@/core/auth/login-validation";
import {
  buildAuthRoute,
  HOME_ROUTE,
  LOGIN_ROUTE,
  REGISTER_ROUTE,
} from "@/core/routing/routes";
import {
  runtimeApi,
  type RuntimeHealthResponse,
} from "@/core/system/runtime-api";
import { useSessions } from "@/features/sessions/session-context";

type BootStepStatus = "pending" | "loading" | "done" | "warning" | "error";
type RuntimeLoadState = "idle" | "loading" | "ready" | "error";

type BootStep = {
  detail: string;
  key: "access" | "auth" | "runtime" | "sessions" | "workspace";
  startedAt: number | null;
  status: BootStepStatus;
  title: string;
  updatedAt: number | null;
};

type RuntimeState = {
  data: RuntimeHealthResponse | null;
  error: string | null;
  status: RuntimeLoadState;
};

const INITIAL_BOOT_STEPS: BootStep[] = [
  {
    key: "access",
    title: "Verificando acceso a plataforma",
    detail: "Comprobando conectividad con el backend.",
    status: "pending",
    startedAt: null,
    updatedAt: null,
  },
  {
    key: "auth",
    title: "Autenticando usuario",
    detail: "Resolviendo si existe una sesion restaurable.",
    status: "pending",
    startedAt: null,
    updatedAt: null,
  },
  {
    key: "runtime",
    title: "Cargando runtime LLM",
    detail: "Validando el runtime y el proveedor configurado.",
    status: "pending",
    startedAt: null,
    updatedAt: null,
  },
  {
    key: "sessions",
    title: "Recuperando sesiones",
    detail: "Precargando la lista de sesiones del workspace.",
    status: "pending",
    startedAt: null,
    updatedAt: null,
  },
  {
    key: "workspace",
    title: "Restaurando workspace",
    detail: "Preparando la vista inicial del builder.",
    status: "pending",
    startedAt: null,
    updatedAt: null,
  },
] as const;

function shouldShowLocalSeedUserAction() {
  return process.env.NODE_ENV !== "production";
}

function patchBootStep(
  steps: BootStep[],
  key: BootStep["key"],
  patch: Partial<Omit<BootStep, "key" | "title">>,
) {
  const now = Date.now();

  return steps.map((step) => {
    if (step.key !== key) {
      return step;
    }

    const nextStatus = patch.status ?? step.status;
    const startedAt =
      step.startedAt ?? (nextStatus === "loading" ? now : step.startedAt);
    const updatedAt =
      patch.updatedAt ?? (nextStatus === "pending" ? null : now);

    return {
      ...step,
      ...patch,
      startedAt,
      updatedAt,
    };
  });
}

function getElapsedLabel(step: BootStep) {
  if (step.status === "pending") {
    return "--";
  }

  if (step.status === "loading") {
    return "...";
  }

  if (!step.startedAt || !step.updatedAt) {
    return "--";
  }

  const elapsedMs = Math.max(step.updatedAt - step.startedAt, 200);
  return `${(elapsedMs / 1000).toFixed(1)}s`;
}

function getBootProgress(steps: BootStep[]) {
  const score = steps.reduce((total, step) => {
    switch (step.status) {
      case "done":
        return total + 1;
      case "warning":
        return total + 0.8;
      case "error":
        return total + 0.35;
      case "loading":
        return total + 0.5;
      default:
        return total;
    }
  }, 0);

  return Math.round((score / steps.length) * 100);
}

function getBootTone(status: BootStepStatus) {
  switch (status) {
    case "done":
      return "green";
    case "warning":
      return "orange";
    case "error":
      return "red";
    case "loading":
      return "violet";
    default:
      return "slate";
  }
}

function getBootLabel(status: BootStepStatus) {
  switch (status) {
    case "done":
      return "Completado";
    case "warning":
      return "Parcial";
    case "error":
      return "Error";
    case "loading":
      return "En progreso";
    default:
      return "Pendiente";
  }
}

function getRuntimeMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}

function getSystemStatusTone(status: RuntimeLoadState, healthy = false) {
  if (status === "error") {
    return "bg-[var(--danger-soft)] text-[var(--danger)]";
  }

  if (healthy || status === "ready") {
    return "bg-[var(--success-soft)] text-[var(--success)]";
  }

  if (status === "loading") {
    return "bg-[var(--brand-soft)] text-[var(--brand-primary)]";
  }

  return "bg-[var(--surface-subtle)] text-[var(--text-secondary)]";
}

export function BootPage() {
  const router = useRouter();
  const { hydrate } = useAuth();
  const { refreshList } = useSessions();
  const [bootSteps, setBootSteps] = useState<BootStep[]>(INITIAL_BOOT_STEPS);
  const [blockingError, setBlockingError] = useState<string | null>(null);
  const [sessionsWarning, setSessionsWarning] = useState<string | null>(null);
  const [isContinuingWithWarning, setIsContinuingWithWarning] = useState(false);

  const runBootFlow = useCallback(async () => {
    setBlockingError(null);
    setSessionsWarning(null);
    setIsContinuingWithWarning(false);
    setBootSteps(INITIAL_BOOT_STEPS);

    setBootSteps((current) =>
      patchBootStep(current, "access", {
        detail: "Consultando /health para validar disponibilidad de la plataforma.",
        status: "loading",
      }),
    );

    let runtime: RuntimeHealthResponse;
    try {
      runtime = await runtimeApi.health();
      setBootSteps((current) =>
        patchBootStep(current, "access", {
          detail: "Backend disponible y respondiendo correctamente.",
          status: "done",
        }),
      );
      setBootSteps((current) =>
        patchBootStep(current, "runtime", {
          detail:
            runtime.status === "ok"
              ? "Runtime cargado y listo para trabajar."
              : "Runtime respondio sin estado OK.",
          status: runtime.status === "ok" ? "done" : "warning",
        }),
      );
    } catch (error) {
      const message = getRuntimeMessage(
        error,
        "No pudimos alcanzar el backend.",
      );
      setBlockingError(message);
      setBootSteps((current) =>
        patchBootStep(current, "access", {
          detail: message,
          status: "error",
        }),
      );
      setBootSteps((current) =>
        patchBootStep(current, "runtime", {
          detail: "El runtime no pudo validarse porque /health fallo.",
          status: "error",
        }),
      );
      return;
    }

    setBootSteps((current) =>
      patchBootStep(current, "auth", {
        detail: "Validando si existe una sesion recuperable.",
        status: "loading",
      }),
    );

    const hydratedState = await hydrate({
      force: true,
      redirectOnUnauthorized: false,
    });
    if (hydratedState.status !== "authenticated" || !hydratedState.user) {
      setBootSteps((current) =>
        patchBootStep(current, "auth", {
          detail: "No se encontro una sesion valida. Redirigiendo al login.",
          status: "warning",
        }),
      );
      setBootSteps((current) =>
        patchBootStep(current, "workspace", {
          detail: "Preparando el ingreso manual al workspace.",
          status: "done",
        }),
      );
      router.replace(LOGIN_ROUTE);
      return;
    }

    const hydratedUser = hydratedState.user;
    setBootSteps((current) =>
      patchBootStep(current, "auth", {
        detail: `Sesion restaurada para ${hydratedUser.full_name}.`,
        status: "done",
      }),
    );

    setBootSteps((current) =>
      patchBootStep(current, "sessions", {
        detail: "Sincronizando sesiones recientes del workspace.",
        status: "loading",
      }),
    );

    try {
      const items = await refreshList({
        force: true,
        loadActiveSnapshot: false,
      });
      setBootSteps((current) =>
        patchBootStep(current, "sessions", {
          detail:
            items.length > 0
              ? `${items.length} sesiones detectadas en el workspace.`
              : "No hay sesiones previas; puedes iniciar una nueva desde el dashboard.",
          status: "done",
        }),
      );
      setBootSteps((current) =>
        patchBootStep(current, "workspace", {
          detail: "Workspace restaurado. Redirigiendo al cockpit principal.",
          status: "done",
        }),
      );
      router.replace(HOME_ROUTE);
    } catch (error) {
      const message = getRuntimeMessage(
        error,
        "No se pudieron precargar las sesiones.",
      );
      setSessionsWarning(message);
      setBootSteps((current) =>
        patchBootStep(current, "sessions", {
          detail: `${message} Puedes continuar y reintentar desde el dashboard.`,
          status: "warning",
        }),
      );
      setBootSteps((current) =>
        patchBootStep(current, "workspace", {
          detail:
            "El acceso esta listo, pero las sesiones se recuperaran luego.",
          status: "warning",
        }),
      );
    }
  }, [hydrate, refreshList, router]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void runBootFlow();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [runBootFlow]);

  const progress = getBootProgress(bootSteps);

  return (
    <div className="min-h-screen bg-[#07152c] px-4 py-10 text-white lg:px-8">
      <div className="mx-auto max-w-[1394px]">
        <div className="mb-10 flex justify-center">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[var(--gradient-primary)] shadow-[0_16px_30px_rgba(79,70,245,0.22)]">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-[18px] font-semibold tracking-[0.08em] text-white">
                Lean Agent
              </p>
              <p className="text-[18px] font-semibold tracking-[0.08em] text-white/90">
                Builder
              </p>
            </div>
          </div>
        </div>

        <Panel className="surface-noise glow-ring mx-auto max-w-[980px] rounded-[32px] border-[rgba(109,93,251,0.34)] px-6 py-8 sm:px-10 sm:py-10">
          <div className="space-y-8">
            <div className="text-center">
              <Badge tone="violet" className="mb-5 px-5 py-2 text-[12px]">
                Boot / Inicializacion
              </Badge>
              <h1 className="text-[34px] font-semibold leading-tight text-[var(--text-primary)] sm:text-[56px]">
                Preparando tu workspace
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-[18px] leading-8 text-[var(--text-secondary)]">
                Estamos preparando el acceso al workspace y validando el
                runtime antes de abrir el builder.
              </p>
            </div>

            <div className="overflow-hidden rounded-[24px] border border-[var(--border-default)]">
              {bootSteps.map((step) => (
                <div
                  key={step.key}
                  className="grid gap-4 border-b border-[var(--border-subtle)] px-6 py-5 last:border-b-0 md:grid-cols-[48px_minmax(0,1fr)_auto_auto]"
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full border-2 ${
                      step.status === "done"
                        ? "border-[rgba(34,197,94,0.22)] bg-[var(--success-soft)] text-[var(--success)]"
                        : step.status === "warning"
                          ? "border-[rgba(245,158,11,0.24)] bg-[var(--warning-soft)] text-[var(--warning)]"
                          : step.status === "error"
                            ? "border-[rgba(239,68,68,0.22)] bg-[var(--danger-soft)] text-[var(--danger)]"
                            : "border-[rgba(79,70,245,0.28)] bg-[var(--brand-soft)] text-[var(--brand-primary)]"
                    }`}
                  >
                    {step.status === "loading" ? (
                      <LoaderCircle className="h-6 w-6 animate-spin" />
                    ) : (
                      <ShieldCheck className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <p className="text-[18px] font-semibold text-[var(--text-primary)]">
                      {step.title}
                    </p>
                    <p className="mt-1 text-[16px] text-[var(--text-secondary)]">
                      {step.detail}
                    </p>
                  </div>
                  <Badge
                    tone={getBootTone(step.status)}
                    className="h-fit justify-self-start md:justify-self-end"
                  >
                    {getBootLabel(step.status)}
                  </Badge>
                  <p className="text-[16px] text-[var(--text-secondary)]">
                    {getElapsedLabel(step)}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <DividerLabel
                left={`${progress}%`}
                right={
                  blockingError
                    ? "Esperando recuperacion"
                    : "Sincronizando acceso y contexto"
                }
              />
              <ProgressBar value={progress} className="h-3" />
            </div>

            <div className="rounded-[20px] border border-[var(--border-default)] bg-[var(--surface-subtle)] px-5 py-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[var(--brand-soft)] text-[var(--brand-primary)]">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[20px] font-semibold text-[var(--text-primary)]">
                    Estado del arranque
                  </p>
                  <p className="mt-1 text-[16px] text-[var(--text-secondary)]">
                    {blockingError
                      ? "El acceso al backend esta bloqueado hasta que /health vuelva a responder."
                      : sessionsWarning
                        ? "La autenticacion ya fue resuelta. Puedes abrir el dashboard y recuperar sesiones luego."
                        : "El workspace se abrira automaticamente cuando la restauracion termine."}
                  </p>
                </div>
              </div>
            </div>

            {blockingError ? (
              <div className="rounded-[20px] border border-[rgba(239,68,68,0.2)] bg-[var(--danger-soft)] px-5 py-5 text-[var(--danger)]">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-3">
                    <CircleAlert className="mt-0.5 h-5 w-5" />
                    <div>
                      <p className="text-[16px] font-semibold">
                        No se pudo completar el boot
                      </p>
                      <p className="mt-1 text-[14px] leading-7">
                        {blockingError}
                      </p>
                    </div>
                  </div>
                  <AppButton
                    type="button"
                    variant="primary"
                    onClick={() => void runBootFlow()}
                  >
                    Reintentar
                  </AppButton>
                </div>
              </div>
            ) : null}

            {sessionsWarning ? (
              <div className="rounded-[20px] border border-[rgba(245,158,11,0.2)] bg-[var(--warning-soft)] px-5 py-5 text-[var(--warning)]">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[16px] font-semibold">
                      Acceso parcial listo
                    </p>
                    <p className="mt-1 text-[14px] leading-7">
                      {sessionsWarning}
                    </p>
                  </div>
                  <AppButton
                    type="button"
                    variant="primary"
                    loading={isContinuingWithWarning}
                    loadingLabel="Abriendo"
                    onClick={() => {
                      setIsContinuingWithWarning(true);
                      router.replace(HOME_ROUTE);
                    }}
                  >
                    Abrir dashboard
                  </AppButton>
                </div>
              </div>
            ) : null}
          </div>
        </Panel>

        <div className="mt-8 flex items-center justify-center gap-4 text-white/90">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[20px] font-semibold">Infraestructura administrada y aislada</p>
            <p className="text-[16px] text-white/65">
              La informacion operativa permanece segmentada por contexto.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const { language, t } = useLanguage();
  const localize = (en: string, es: string, pt: string) =>
    language === "en" ? en : language === "pt" ? pt : es;
  const redirectTarget = searchParams.get("redirect")?.trim() || "/projects";
  const prefillEmail = searchParams.get("email")?.trim() || "";
  const [formValues, setFormValues] = useState({
    email: prefillEmail,
    password: "",
  });
  const [validationErrors, setValidationErrors] =
    useState<LoginValidationErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [runtimeState, setRuntimeState] = useState<RuntimeState>({
    data: null,
    error: null,
    status: "idle",
  });

  useEffect(() => {
    if (auth.status === "authenticated") {
      router.replace(redirectTarget);
    }
  }, [auth.status, redirectTarget, router]);

  useEffect(() => {
    let isMounted = true;

    async function loadRuntimeStatus() {
      setRuntimeState({
        data: null,
        error: null,
        status: "loading",
      });

      try {
        const health = await runtimeApi.health();
        if (!isMounted) {
          return;
        }

        setRuntimeState({
          data: health,
          error: null,
          status: "ready",
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setRuntimeState({
          data: null,
          error: getRuntimeMessage(
            error,
            "No pudimos validar el backend.",
          ),
          status: "error",
        });
      }
    }

    void loadRuntimeStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  function setFieldValue(field: "email" | "password", value: string) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));

    setValidationErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[field];
      return nextErrors;
    });

    if (submitError) {
      setSubmitError(null);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateLoginCredentials(formValues);
    setValidationErrors(nextErrors);
    setSubmitError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      await auth.login({
        email: formValues.email.trim(),
        password: formValues.password,
      });
      router.replace(redirectTarget);
    } catch (error) {
      setSubmitError(
        getRuntimeMessage(
          error,
          localize(
            "Could not sign in.",
            "No se pudo iniciar sesion.",
            "Nao foi possivel iniciar sessao.",
          ),
        ),
      );
    }
  }

  const systemStatusItems = [
    {
      label: "API",
      status:
        runtimeState.status === "ready" && runtimeState.data?.status === "ok"
          ? "OK"
          : runtimeState.status === "error"
            ? localize("Error", "Error", "Erro")
            : localize("Checking", "Verificando", "Verificando"),
      healthy:
        runtimeState.status === "ready" && runtimeState.data?.status === "ok",
    },
    {
      label: localize("Runtime", "Runtime", "Runtime"),
      status:
        runtimeState.status === "ready"
          ? localize("Ready", "Listo", "Pronto")
          : runtimeState.status === "error"
            ? localize("Unverified", "Sin validar", "Nao validado")
            : localize("Loading", "Cargando", "Carregando"),
      healthy: runtimeState.status === "ready",
    },
    {
      label: localize("Services", "Servicios", "Servicos"),
      status:
        runtimeState.status === "error"
          ? localize("Pending", "Pendiente", "Pendente")
          : runtimeState.status === "ready"
            ? "OK"
            : localize("Loading", "Cargando", "Carregando"),
      healthy: runtimeState.status === "ready",
    },
    {
      label: localize("Models", "Modelos", "Modelos"),
      status:
        runtimeState.status === "ready"
          ? "OK"
          : runtimeState.status === "error"
            ? localize("Unverified", "Sin validar", "Nao validado")
            : localize("Loading", "Cargando", "Carregando"),
      healthy: runtimeState.status === "ready",
    },
  ];
  const loginBenefits = [
    {
      title: t("login.benefitLeanTitle", "Metodología Lean"),
      detail: t(
        "login.benefitLeanDetail",
        "10 fases para reducir riesgo, ordenar decisiones y acelerar el diseño del agente.",
      ),
    },
    {
      title: t("login.benefitLocalTitle", "Base ya construida"),
      detail: t(
        "login.benefitLocalDetail",
        "El nucleo ya esta construido y reduce entre 50% y 75% el esfuerzo pendiente frente a un esquema tradicional.",
      ),
    },
    {
      title: t("login.benefitProductionTitle", "Camino corto a produccion"),
      detail: t(
        "login.benefitProductionDetail",
        "La validacion de usuarios y el endurecimiento operativo siguen en progreso, pero el cierre restante es mucho menor.",
      ),
    },
    {
      title: t("login.benefitIntegrationsTitle", "Servidor externo con aislamiento"),
      detail: t(
        "login.benefitIntegrationsDetail",
        "La aplicacion corre fuera del cliente y la informacion permanece segmentada dentro del servidor.",
      ),
    },
  ];
  const marketingTitle = t(
    "login.benefitsTitle",
    "Construye agentes de IA con mucho menos esfuerzo",
  );
  const marketingTitleAccent = t(
    "login.marketingTitleAccent",
    "con mucho menos esfuerzo",
  );
  const quoteAuthor = t("login.quoteAuthor", "Equipo Lean Agent Builder");
  const quoteRole = t("login.quoteRole", "Estado actual del producto");
  const quoteInitials =
    quoteAuthor
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "LB";
  const accentIndex = marketingTitle
    .toLocaleLowerCase()
    .lastIndexOf(marketingTitleAccent.toLocaleLowerCase());
  const marketingTitleLead =
    accentIndex >= 0
      ? marketingTitle.slice(0, accentIndex).trimEnd()
      : marketingTitle;
  const marketingTitleHighlight =
    accentIndex >= 0 ? marketingTitle.slice(accentIndex) : marketingTitleAccent;
  const registerRoute = buildAuthRoute(REGISTER_ROUTE, {
    redirect: redirectTarget !== "/projects" ? redirectTarget : null,
    email: formValues.email.trim() || prefillEmail || null,
  });

  return (
    <div
      className="auth-viewport min-h-[100dvh] overflow-y-auto bg-[#07152c] p-3 sm:p-4 lg:p-4 [@media(max-height:900px)]:p-2.5"
      data-auth-build="auth-compact-20"
      data-auth-density="compact-20"
      data-auth-surface="login"
    >
      <div className="auth-shell mx-auto grid min-h-[calc(100dvh-24px)] max-w-[1500px] overflow-hidden rounded-[28px] border border-white/15 bg-white lg:min-h-[calc(100dvh-32px)] lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.48fr)] [@media(max-height:900px)]:rounded-[24px]">
        <section className="auth-marketing-shell sidebar-sheen surface-noise relative order-2 px-6 py-5 text-white sm:px-7 lg:order-1 lg:overflow-hidden lg:px-8 lg:py-6 [@media(max-height:900px)]:px-6 [@media(max-height:900px)]:py-4">
          <div className="relative z-10 flex h-full flex-col">
            <div className="auth-brand-row mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-[var(--gradient-primary)] shadow-[0_14px_28px_rgba(79,70,245,0.25)]">
                <Sparkles className="h-[18px] w-[18px] text-white" />
              </div>
              <div>
                <p className="text-[15px] font-semibold leading-none">
                  Lean Agent
                </p>
                <p className="mt-1 text-[15px] font-semibold leading-none">
                  Builder
                </p>
              </div>
            </div>

            <Badge
              tone="blue"
              className="mb-4 w-fit border-[#1d3655] bg-[#0d213e] px-3 py-1 text-[11px] text-[#4ff1df]"
            >
              {t("login.marketingBadge", "Base avanzada - informacion aislada - menor esfuerzo")}
            </Badge>

            <div className="auth-marketing-copy max-w-[368px]">
              <h1 className="auth-marketing-title text-[30px] font-semibold leading-[0.95] tracking-[-0.035em] sm:text-[32px] lg:text-[clamp(34px,2.6vw,40px)] [@media(max-height:900px)]:text-[clamp(30px,2.2vw,36px)]">
                {marketingTitleLead ? `${marketingTitleLead} ` : null}
                <span className="text-[#8f91ff]">
                  {marketingTitleHighlight}
                </span>
              </h1>
              <p className="auth-marketing-subtitle mt-2.5 max-w-[350px] text-[13px] leading-[1.55] text-white/72">
                {t(
                  "login.marketingSubtitle",
                  "Lean Agent Builder te permite diseñar y evaluar agentes de IA sobre una base ya construida. Hoy la aplicacion corre en infraestructura administrada y el esfuerzo pendiente para concluirla es entre 50% y 75% menor que en un esquema tradicional.",
                )}
              </p>
            </div>

            <div className="auth-benefits-grid mt-4 grid gap-2 sm:grid-cols-2 [@media(max-height:900px)]:mt-3">
              {loginBenefits.map((item) => (
                <div
                  key={item.title}
                  className="auth-benefit-card min-h-[82px] rounded-[14px] border border-white/10 bg-white/5 p-2.5 [@media(max-height:900px)]:min-h-[76px]"
                >
                  <div className="mb-1.5 flex h-7 w-7 items-center justify-center rounded-[9px] bg-[rgba(109,74,255,0.24)]">
                    <ShieldCheck className="h-[14px] w-[14px] text-white" />
                  </div>
                  <p className="text-[13px] font-semibold leading-4">
                    {item.title}
                  </p>
                  <p className="mt-1 text-[11px] leading-[1.4] text-white/66 [@media(max-height:900px)]:line-clamp-2">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>

            <div className="auth-proof-card mt-3 rounded-[16px] border border-white/12 bg-white/6 p-3 [@media(max-height:900px)]:mt-2">
              <p className="text-[11px] italic leading-[1.45] text-white/76">
                &ldquo;
                {t(
                  "login.quote",
                  "Ya existe una base funcional para iterar mas rapido y cerrar el producto con mucho menos esfuerzo que en un desarrollo tradicional.",
                )}
                &rdquo;
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/18 text-[10px]">
                  {quoteInitials}
                </div>
                <div>
                  <p className="text-[11px] font-medium">{quoteAuthor}</p>
                  <p className="text-[10px] text-white/62">{quoteRole}</p>
                </div>
              </div>
            </div>

            <div className="auth-privacy-note mt-auto flex items-start gap-2.5 pt-3 [@media(max-height:900px)]:pt-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] border border-white/12 bg-white/5">
                <Lock className="h-[13px] w-[13px]" />
              </div>
              <div>
                <p className="text-[12px] font-semibold">
                  {t("login.privacyTitle", "Infraestructura administrada con aislamiento.")}
                </p>
                <p className="mt-1 max-w-[360px] text-[11px] leading-[1.45] text-white/64">
                  {t(
                    "login.privacyDesc",
                    "La aplicacion se aloja en un servidor externo al cliente y la informacion permanece separada mientras completamos el cierre a produccion.",
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="auth-form-stage order-1 grid min-h-0 grid-rows-[40px_minmax(0,1fr)_auto_auto] overflow-y-auto bg-[linear-gradient(180deg,#ffffff_0%,#f9fbff_100%)] px-5 py-4 sm:px-6 lg:order-2 lg:px-8 lg:py-4 [@media(max-height:900px)]:px-5 [@media(max-height:900px)]:py-3">
          <div className="auth-toolbar relative z-20 flex h-10 items-center justify-end">
            <LanguageSelector compact className="auth-language-selector z-30" />
          </div>

          <div className="auth-form-center flex min-h-0 items-stretch justify-center py-0">
            <div className="auth-form-wrap auth-login-stack mx-auto flex h-full w-full max-w-[500px] flex-col">
              <Panel
                elevated
                className="auth-form-panel px-5 py-4 shadow-[0_18px_48px_rgba(15,23,42,0.07)] sm:px-5"
              >
                <Badge tone="violet" className="mb-2.5 text-[10px]">
                  {t("login.badge")}
                </Badge>
                <h2 className="auth-form-title text-[20px] font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--text-primary)] sm:text-[22px]">
                  {t("login.title")}
                </h2>
                <p className="auth-form-subtitle mt-1 text-[11px] leading-[1.45] text-[var(--text-secondary)]">
                  {t("login.subtitle")}
                </p>

                <form
                  className="auth-form-stack mt-3 space-y-1.5"
                  onSubmit={handleSubmit}
                >
                  <TextField
                    autoComplete="email"
                    className="auth-field"
                    density="compact"
                    label={t("login.emailLabel")}
                    onValueChange={(value) => setFieldValue("email", value)}
                    placeholder="tu@empresa.com"
                    required
                    trailing={<Mail className="h-[18px] w-[18px]" />}
                    value={formValues.email}
                    error={validationErrors.email}
                  />

                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between text-[11px] font-medium">
                      <span>{t("login.passwordLabel")}</span>
                    </div>
                    <TextField
                      autoComplete="current-password"
                      className="auth-field"
                      density="compact"
                      error={validationErrors.password}
                      aria-label={t("login.passwordLabel")}
                      label=""
                      onValueChange={(value) =>
                        setFieldValue("password", value)
                      }
                      placeholder="••••••••"
                      required
                      trailing={<Lock className="h-[18px] w-[18px]" />}
                      type="password"
                      value={formValues.password}
                    />
                  </div>

                  {submitError ? (
                    <InlineFieldError aria-live="assertive" role="alert">
                      {submitError}
                    </InlineFieldError>
                  ) : null}

                  <AppButton
                    variant="primary"
                    className="auth-primary-button h-9 w-full text-[12px]"
                    type="submit"
                    loading={auth.status === "submitting"}
                    loadingLabel={localize(
                      "Validating access",
                      "Validando acceso",
                      "Validando acesso",
                    )}
                  >
                    {t("login.submit")}
                  </AppButton>
                  {shouldShowLocalSeedUserAction() ? (
                    <>
                      <div className="flex h-3 items-center gap-2 text-[10px] text-[var(--text-muted)]">
                        <div className="h-px flex-1 bg-[var(--border-subtle)]" />
                        <span>o</span>
                        <div className="h-px flex-1 bg-[var(--border-subtle)]" />
                      </div>
                      <AppButton
                        className="auth-secondary-button h-8 w-full text-[11px]"
                        icon={<UserRound className="h-4 w-4" />}
                        onClick={() => {
                          setFormValues({
                            email: SEEDED_LOCAL_ADMIN_EMAIL,
                            password: SEEDED_LOCAL_ADMIN_PASSWORD,
                          });
                          setValidationErrors({});
                          setSubmitError(null);
                        }}
                      >
                        {t("login.seedUser")}
                      </AppButton>
                    </>
                  ) : null}
                  <div className="pt-0 text-center text-[11px] text-[var(--text-secondary)]">
                    <span>{t("login.noAccount")} </span>
                    <a
                      href={registerRoute}
                      className="font-semibold text-[var(--brand-primary)] hover:underline"
                    >
                      {t("login.registerFree")}
                    </a>
                  </div>

                  <div className="border-t border-[var(--border-subtle)] pt-2">
                    <div className="flex items-start gap-2 text-[10px] leading-[1.4] text-[var(--text-secondary)]">
                      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 text-[var(--text-primary)]" />
                      <p>
                        {localize(
                          "Access is currently enabled through an assisted process.",
                          "La habilitacion de accesos aun se acompana de forma asistida.",
                          "A habilitacao de acessos ainda acontece de forma assistida.",
                        )}
                        <br />
                        {localize(
                          "If your workspace is not ready yet, register above or contact the team.",
                          "Si tu workspace aun no esta listo, registrate arriba o contacta al equipo.",
                          "Se o seu workspace ainda nao estiver pronto, cadastre-se acima ou fale com a equipe.",
                        )}
                      </p>
                    </div>
                  </div>
                </form>
              </Panel>

              <div className="auth-runtime-strip">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {systemStatusItems.map((item) => (
                    <div
                      key={`${item.label}-inline-runtime`}
                      className="flex items-center gap-2 rounded-[12px] px-2 py-1"
                    >
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] ${getSystemStatusTone(runtimeState.status, item.healthy)}`}
                      >
                        {runtimeState.status === "error"
                          ? "!"
                          : runtimeState.status === "loading"
                            ? "..."
                            : "✓"}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                          {item.label}
                        </p>
                        <p className="truncate text-[11px] text-[var(--text-secondary)]">
                          {item.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {runtimeState.status === "error" ? (
                  <p className="mt-1 px-2 text-[10px] text-[var(--danger)]">
                    {runtimeState.error}
                  </p>
                ) : null}
              </div>

              <p className="auth-footer-copy text-center text-[10px] text-[var(--text-muted)]">
                {localize(
                  "(c) 2024 Lean Agent Builder. All rights reserved.",
                  "(c) 2024 Lean Agent Builder. Todos los derechos reservados.",
                  "(c) 2024 Lean Agent Builder. Todos os direitos reservados.",
                )}
              </p>
            </div>
          </div>

          <div className="auth-runtime-wrap auth-form-wrap mx-auto w-full max-w-[548px]">
            <div className="auth-runtime-strip rounded-[16px] border border-[var(--border-default)] bg-white/90 px-3 py-2 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {systemStatusItems.map((item) => (
                  <div
                    key={`${item.label}-runtime`}
                    className="flex items-center gap-2.5 rounded-[12px] px-2 py-1.5"
                  >
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${getSystemStatusTone(runtimeState.status, item.healthy)}`}
                    >
                      {runtimeState.status === "error"
                        ? "!"
                        : runtimeState.status === "loading"
                          ? "..."
                            : "OK"}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                        {item.label}
                      </p>
                      <p className="truncate text-[12px] text-[var(--text-secondary)]">
                        {item.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {runtimeState.status === "error" ? (
                <p className="mt-1.5 px-2 text-[11px] text-[var(--danger)]">
                  {runtimeState.error}
                </p>
              ) : null}
            </div>
          </div>

          <p className="auth-footer-copy pt-2 text-center text-[11px] text-[var(--text-muted)]">
            {localize(
              "© 2024 Lean Agent Builder. All rights reserved.",
              "© 2024 Lean Agent Builder. Todos los derechos reservados.",
              "© 2024 Lean Agent Builder. Todos os direitos reservados.",
            )}
          </p>
        </section>
      </div>
    </div>
  );
}
