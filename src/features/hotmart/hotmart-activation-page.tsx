"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CircleAlert,
  LoaderCircle,
  LogIn,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { AppButton, Badge, Panel } from "@/components/lean/ui";
import { useAuth } from "@/core/auth/auth-context";
import { useLanguage } from "@/core/i18n/language-context";
import {
  buildAuthRoute,
  getHotmartActivationRoute,
  LOGIN_ROUTE,
  REGISTER_ROUTE,
} from "@/core/routing/routes";
import type {
  HotmartPendingActivationBootstrapResponse,
  HotmartPendingActivationResponse,
} from "@/features/hotmart/hotmart-contracts";
import { sessionsApi } from "@/features/sessions/session-api";

type PublicLoadStatus = "loading" | "ready" | "error";
type BootstrapStatus = "idle" | "loading" | "error";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

function formatAmount(amountCents: number, currency: string, locale: string) {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 2,
    }).format(amountCents / 100);
  } catch {
    return `${currency || "USD"} ${(amountCents / 100).toFixed(2)}`;
  }
}

export function HotmartActivationPage({
  activationToken,
}: {
  activationToken: string;
}) {
  const router = useRouter();
  const auth = useAuth();
  const { language } = useLanguage();
  const localize = useCallback(
    (en: string, es: string, pt: string) =>
      language === "en" ? en : language === "pt" ? pt : es,
    [language],
  );
  const locale =
    language === "en" ? "en-US" : language === "pt" ? "pt-BR" : "es-CO";
  const activationPath = getHotmartActivationRoute(activationToken);
  const [publicStatus, setPublicStatus] = useState<PublicLoadStatus>("loading");
  const [publicError, setPublicError] = useState<string | null>(null);
  const [activation, setActivation] =
    useState<HotmartPendingActivationResponse | null>(null);
  const [bootstrapStatus, setBootstrapStatus] =
    useState<BootstrapStatus>("idle");
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const bootstrapAttemptedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function loadActivation() {
      setPublicStatus("loading");
      setPublicError(null);

      try {
        const response =
          await sessionsApi.getHotmartPendingActivationPublic(activationToken);
        if (cancelled) {
          return;
        }
        setActivation(response);
        setPublicStatus("ready");
      } catch (error) {
        if (cancelled) {
          return;
        }
        setPublicError(
          getErrorMessage(
            error,
            localize(
              "We could not validate this Hotmart activation.",
              "No pudimos validar esta activacion de Hotmart.",
              "Nao foi possivel validar esta ativacao do Hotmart.",
            ),
          ),
        );
        setPublicStatus("error");
      }
    }

    void loadActivation();
    return () => {
      cancelled = true;
    };
  }, [activationToken, localize]);

  const loginRoute = useMemo(
    () =>
      buildAuthRoute(LOGIN_ROUTE, {
        email: activation?.buyer_email ?? null,
        redirect: activationPath,
      }),
    [activation?.buyer_email, activationPath],
  );
  const registerRoute = useMemo(
    () =>
      buildAuthRoute(REGISTER_ROUTE, {
        email: activation?.buyer_email ?? null,
        redirect: activationPath,
      }),
    [activation?.buyer_email, activationPath],
  );

  const emailMismatch =
    auth.status === "authenticated" &&
    !!activation?.buyer_email &&
    activation.buyer_email.toLowerCase() !==
      (auth.user?.email || "").trim().toLowerCase();
  const accountMismatchMessage =
    emailMismatch && activation
      ? localize(
          `This purchase belongs to ${activation.buyer_email}. Sign in with that email to activate it.`,
          `Esta compra pertenece a ${activation.buyer_email}. Inicia sesion con ese correo para activarla.`,
          `Esta compra pertence a ${activation.buyer_email}. Entre com esse email para ativa-la.`,
        )
      : null;

  useEffect(() => {
    if (!auth.isHydrated || auth.status !== "authenticated" || !activation) {
      return;
    }
    if (bootstrapAttemptedRef.current) {
      return;
    }
    if (emailMismatch) {
      return;
    }
    if (!activation.can_bootstrap && !activation.already_claimed) {
      return;
    }

    let cancelled = false;
    bootstrapAttemptedRef.current = true;

    async function bootstrapActivation() {
      setBootstrapStatus("loading");
      setBootstrapError(null);
      try {
        const response: HotmartPendingActivationBootstrapResponse =
          await sessionsApi.bootstrapHotmartPendingActivation(activationToken);
        if (cancelled) {
          return;
        }
        router.replace(response.redirect_path);
      } catch (error) {
        if (cancelled) {
          return;
        }
        bootstrapAttemptedRef.current = false;
        setBootstrapStatus("error");
        setBootstrapError(
          getErrorMessage(
            error,
            localize(
              "We could not activate the Hotmart purchase in LAB.",
              "No pudimos activar la compra Hotmart dentro de LAB.",
              "Nao foi possivel ativar a compra do Hotmart dentro do LAB.",
            ),
          ),
        );
      }
    }

    void bootstrapActivation();
    return () => {
      cancelled = true;
    };
  }, [
    activation,
    activationToken,
    auth.isHydrated,
    auth.status,
    emailMismatch,
    localize,
    router,
  ]);

  const amountLabel = activation
    ? formatAmount(activation.amount_cents, activation.currency, locale)
    : "";

  return (
    <div className="min-h-screen bg-[#07152c] px-4 py-8 text-white lg:px-8">
      <div className="mx-auto max-w-[1120px]">
        <div className="mb-8 flex items-center justify-center gap-4">
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

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)]">
          <Panel className="surface-noise rounded-[30px] border-[rgba(109,93,251,0.34)] px-6 py-7 sm:px-8 sm:py-8">
            <Badge tone="violet" className="mb-4 px-4 py-1.5 text-[11px]">
              {localize(
                "Hotmart activation",
                "Activacion Hotmart",
                "Ativacao Hotmart",
              )}
            </Badge>
            <h1 className="text-[32px] font-semibold leading-[1.02] tracking-[-0.03em] text-[var(--text-primary)] sm:text-[42px]">
              {localize(
                "Activate your purchase and enter LAB in one flow.",
                "Activa tu compra y entra a LAB en un solo flujo.",
                "Ative sua compra e entre no LAB em um unico fluxo.",
              )}
            </h1>
            <p className="mt-4 max-w-[520px] text-[16px] leading-7 text-[var(--text-secondary)]">
              {localize(
                "If you found the product through Hotmart, we validate the purchase, connect it to your account, and take you directly to the build experience.",
                "Si encontraste el producto en Hotmart, aqui validamos la compra, la conectamos con tu cuenta y te llevamos directo a la experiencia de construccion.",
                "Se voce encontrou o produto no Hotmart, aqui validamos a compra, conectamos com sua conta e levamos voce direto para a experiencia de construcao.",
              )}
            </p>

            <div className="mt-6 grid gap-3">
              {[
                localize(
                  "We validate the Hotmart purchase token.",
                  "Validamos el token de compra Hotmart.",
                  "Validamos o token da compra Hotmart.",
                ),
                localize(
                  "We create or reconnect your LAB access.",
                  "Creamos o reconectamos tu acceso en LAB.",
                  "Criamos ou reconectamos seu acesso no LAB.",
                ),
                localize(
                  "We activate the project and redirect you to build.",
                  "Activamos el proyecto y te redirigimos a construir.",
                  "Ativamos o projeto e redirecionamos voce para construir.",
                ),
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-[16px] border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand-primary)]">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <p className="text-[14px] text-white/88">{item}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel
            elevated
            className="rounded-[30px] px-6 py-7 shadow-[0_18px_48px_rgba(15,23,42,0.07)] sm:px-8 sm:py-8"
          >
            {publicStatus === "loading" ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                <LoaderCircle className="h-10 w-10 animate-spin text-[var(--brand-primary)]" />
                <p className="mt-5 text-[18px] font-semibold text-[var(--text-primary)]">
                  {localize(
                    "Validating Hotmart purchase",
                    "Validando compra Hotmart",
                    "Validando compra Hotmart",
                  )}
                </p>
                <p className="mt-2 max-w-[460px] text-[15px] leading-7 text-[var(--text-secondary)]">
                  {localize(
                    "We are reviewing the activation token and preparing the access path.",
                    "Estamos revisando el token de activacion y preparando la ruta de acceso.",
                    "Estamos revisando o token de ativacao e preparando a rota de acesso.",
                  )}
                </p>
              </div>
            ) : null}

            {publicStatus === "error" ? (
              <div className="space-y-5">
                <div className="flex items-start gap-3 rounded-[20px] border border-[rgba(239,68,68,0.18)] bg-[var(--danger-soft)] px-4 py-4 text-[var(--danger)]">
                  <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="text-[16px] font-semibold">
                      {localize(
                        "Activation not available",
                        "Activacion no disponible",
                        "Ativacao indisponivel",
                      )}
                    </p>
                    <p className="mt-1 text-[14px] leading-6">
                      {publicError}
                    </p>
                  </div>
                </div>
                <AppButton
                  type="button"
                  variant="primary"
                  onClick={() => router.replace("/")}
                >
                  {localize("Return to home", "Volver al inicio", "Voltar ao inicio")}
                </AppButton>
              </div>
            ) : null}

            {publicStatus === "ready" && activation ? (
              <div className="space-y-6">
                <div className="rounded-[22px] border border-[var(--border-default)] bg-[var(--surface-subtle)] px-5 py-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge
                      tone={
                        activation.already_claimed
                          ? "green"
                          : activation.can_bootstrap
                            ? "violet"
                            : "orange"
                      }
                    >
                      {activation.already_claimed
                        ? localize("Already activated", "Ya activada", "Ja ativada")
                        : activation.can_bootstrap
                          ? localize("Ready to activate", "Lista para activar", "Pronta para ativar")
                          : localize("Needs review", "Requiere revision", "Precisa de revisao")}
                    </Badge>
                    <Badge tone="blue">{amountLabel}</Badge>
                  </div>

                  <h2 className="mt-4 text-[24px] font-semibold text-[var(--text-primary)]">
                    {activation.display_name}
                  </h2>
                  <p className="mt-2 text-[15px] leading-7 text-[var(--text-secondary)]">
                    {activation.claim_status_message}
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[18px] border border-[var(--border-default)] bg-white px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                        {localize("Buyer email", "Correo comprador", "Email comprador")}
                      </p>
                      <p className="mt-1 text-[14px] text-[var(--text-primary)]">
                        {activation.buyer_email}
                      </p>
                    </div>
                    <div className="rounded-[18px] border border-[var(--border-default)] bg-white px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                        {localize("Resolution", "Resolucion", "Resolucao")}
                      </p>
                      <p className="mt-1 text-[14px] text-[var(--text-primary)]">
                        {activation.resolution_strategy}
                      </p>
                    </div>
                  </div>
                </div>

                {auth.status === "anonymous" ? (
                  <div className="space-y-4">
                    <div className="rounded-[20px] border border-[var(--border-default)] bg-white px-5 py-5">
                      <p className="text-[18px] font-semibold text-[var(--text-primary)]">
                        {localize(
                          "Continue with your LAB account",
                          "Continua con tu cuenta LAB",
                          "Continue com sua conta LAB",
                        )}
                      </p>
                      <p className="mt-2 text-[14px] leading-7 text-[var(--text-secondary)]">
                        {localize(
                          "Use the same email as the Hotmart purchase to connect the product automatically.",
                          "Usa el mismo correo de la compra en Hotmart para conectar el producto automaticamente.",
                          "Use o mesmo email da compra no Hotmart para conectar o produto automaticamente.",
                        )}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <AppButton
                        type="button"
                        variant="primary"
                        className="h-11"
                        icon={<LogIn className="h-4 w-4" />}
                        onClick={() => router.push(loginRoute)}
                      >
                        {localize("Log in", "Iniciar sesion", "Entrar")}
                      </AppButton>
                      <AppButton
                        type="button"
                        className="h-11"
                        icon={<UserPlus className="h-4 w-4" />}
                        onClick={() => router.push(registerRoute)}
                      >
                        {localize("Create account", "Crear cuenta", "Criar conta")}
                      </AppButton>
                    </div>
                  </div>
                ) : null}

                {auth.status === "authenticated" ? (
                  <div className="space-y-4">
                    <div className="rounded-[20px] border border-[var(--border-default)] bg-white px-5 py-5">
                      <p className="text-[18px] font-semibold text-[var(--text-primary)]">
                        {localize(
                          "Connecting purchase with your workspace",
                          "Conectando compra con tu workspace",
                          "Conectando compra com seu workspace",
                        )}
                      </p>
                      <p className="mt-2 text-[14px] leading-7 text-[var(--text-secondary)]">
                        {emailMismatch
                          ? localize(
                              `You are signed in as ${auth.user?.email || ""}, but the Hotmart purchase belongs to ${activation.buyer_email}.`,
                              `Entraste como ${auth.user?.email || ""}, pero la compra de Hotmart pertenece a ${activation.buyer_email}.`,
                              `Voce entrou como ${auth.user?.email || ""}, mas a compra do Hotmart pertence a ${activation.buyer_email}.`,
                            )
                          : activation.can_bootstrap || activation.already_claimed
                            ? localize(
                                "We are creating the project context and activating your Hotmart purchase.",
                                "Estamos creando el contexto del proyecto y activando tu compra Hotmart.",
                                "Estamos criando o contexto do projeto e ativando sua compra do Hotmart.",
                              )
                            : localize(
                                "The purchase was found, but it still needs manual parametrization before it can be activated inside LAB.",
                                "Encontramos la compra, pero aun requiere parametrizacion manual antes de activarse dentro de LAB.",
                                "Encontramos a compra, mas ela ainda precisa de parametrizacao manual antes de ser ativada dentro do LAB.",
                              )}
                      </p>
                    </div>

                    {bootstrapStatus === "loading" &&
                    !emailMismatch &&
                    (activation.can_bootstrap || activation.already_claimed) ? (
                      <div className="flex items-center gap-3 rounded-[18px] border border-[var(--border-default)] bg-[var(--surface-subtle)] px-4 py-4">
                        <LoaderCircle className="h-5 w-5 animate-spin text-[var(--brand-primary)]" />
                        <p className="text-[14px] text-[var(--text-primary)]">
                          {localize(
                            "Activating purchase and opening the build flow...",
                            "Activando compra y abriendo el flujo de construccion...",
                            "Ativando compra e abrindo o fluxo de construcao...",
                          )}
                        </p>
                      </div>
                    ) : null}

                    {accountMismatchMessage || bootstrapError ? (
                      <div className="space-y-3 rounded-[18px] border border-[rgba(239,68,68,0.18)] bg-[var(--danger-soft)] px-4 py-4">
                        <div className="flex items-start gap-3 text-[var(--danger)]">
                          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
                          <p className="text-[14px] leading-6">
                            {accountMismatchMessage || bootstrapError}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {emailMismatch ? (
                            <AppButton
                              type="button"
                              variant="primary"
                              onClick={() => {
                                auth.clear();
                                router.replace(loginRoute);
                              }}
                            >
                              {localize(
                                "Use another email",
                                "Usar otro correo",
                                "Usar outro email",
                              )}
                            </AppButton>
                          ) : null}
                          {!emailMismatch && (activation.can_bootstrap || activation.already_claimed) ? (
                            <AppButton
                              type="button"
                              onClick={() => {
                                bootstrapAttemptedRef.current = false;
                                setBootstrapError(null);
                                setBootstrapStatus("idle");
                              }}
                            >
                              {localize("Retry", "Reintentar", "Tentar novamente")}
                            </AppButton>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="flex items-center gap-2 text-[12px] text-[var(--text-muted)]">
                  <ArrowRight className="h-4 w-4" />
                  <span>
                    {localize(
                      "Parallel funnel: Hotmart discovers and sells, LAB activates and builds.",
                      "Embudo paralelo: Hotmart descubre y vende, LAB activa y construye.",
                      "Funil paralelo: Hotmart descobre e vende, LAB ativa e constroi.",
                    )}
                  </span>
                </div>
              </div>
            ) : null}
          </Panel>
        </div>
      </div>
    </div>
  );
}
