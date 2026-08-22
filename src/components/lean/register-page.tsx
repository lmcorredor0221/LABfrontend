"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
  Building2,
  X,
} from "lucide-react";
import {
  AppButton,
  Badge,
  InlineFieldError,
  Panel,
  TextField,
} from "@/components/lean/ui";
import { apiClient } from "@/core/api";
import { useAuth } from "@/core/auth/auth-context";
import { clearLegacyStoredToken, setStoredToken } from "@/core/auth/token-store";
import type { LoginResponse } from "@/core/auth/types";
import { LanguageSelector } from "@/components/lean/language-selector";
import { useLanguage } from "@/core/i18n/language-context";
import { HOME_ROUTE, LOGIN_ROUTE } from "@/core/routing/routes";

type PasswordCriteria = {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
};

type LegalModalType = "terms" | "data_treatment" | "privacy" | null;

export function RegisterPage() {
  const router = useRouter();
  const auth = useAuth();
  const { language, t } = useLanguage();
  const passwordInputId = "register-password";
  const passwordRequirementsId = "register-password-requirements";
  const confirmPasswordInputId = "register-confirm-password";
  const confirmPasswordErrorId = "register-confirm-password-error";
  const acceptTermsInputId = "register-accept-terms";
  const acceptDataTreatmentInputId = "register-accept-data-treatment";
  const acceptPrivacyInputId = "register-accept-privacy";

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    workspaceName: "",
    honeypot: "",
    acceptTerms: false,
    acceptDataTreatment: false,
    acceptPrivacy: false,
    consentSystemNotifications: false,
    consentCommercialPromotions: false,
    consentEventsNewsletters: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [activeModal, setActiveModal] = useState<LegalModalType>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitInFlightRef = useRef(false);

  const criteria: PasswordCriteria = {
    minLength: form.password.length >= 8,
    hasUpper: /[A-Z]/.test(form.password),
    hasLower: /[a-z]/.test(form.password),
    hasNumber: /[0-9]/.test(form.password),
    hasSpecial: /[@$!%*?&#_\-+=/(){}\[\]]/.test(form.password),
  };

  const metCount = Object.values(criteria).filter(Boolean).length;
  const strengthPercent = (metCount / 5) * 100;
  const isPasswordStrong = metCount === 5;
  const passwordsMatch =
    form.password.length > 0 && form.password === form.confirmPassword;
  const canSubmit =
    form.fullName.trim() &&
    form.email.trim() &&
    isPasswordStrong &&
    passwordsMatch &&
    form.acceptTerms &&
    form.acceptDataTreatment &&
    form.acceptPrivacy &&
    !submitting;

  const localize = (en: string, es: string, pt: string) =>
    language === "en" ? en : language === "pt" ? pt : es;

  useEffect(() => {
    if (auth.status === "authenticated") {
      const redirectParam =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("redirect")
          : null;
      router.replace(redirectParam || "/projects");
    }
  }, [auth.status, router]);

  const registerHighlights = [
    {
      title: localize(
        "Governance and Data Rights",
        "Gobernanza y Habeas Data",
        "Governanca e Habeas Data",
      ),
      detail: localize(
        "Strict regulatory compliance with auditable evidence stored in the database.",
        "Cumplimiento normativo estricto con auditoria de evidencias en BD.",
        "Conformidade regulatoria rigorosa com auditoria de evidencias no banco.",
      ),
    },
    {
      title: localize(
        "Autonomous Local Environment",
        "Ambiente Autonomo Local",
        "Ambiente Autonomo Local",
      ),
      detail: localize(
        "Your keys and business data remain under your own infrastructure.",
        "Tus claves y datos de negocio permanecen bajo tu infraestructura.",
        "Suas chaves e dados de negocio permanecem na sua infraestrutura.",
      ),
    },
    {
      title: localize(
        "Independent Consents",
        "Consentimientos Independientes",
        "Consentimentos Independentes",
      ),
      detail: localize(
        "Choose freely which communications you want to receive.",
        "Controla libremente que comunicaciones deseas recibir.",
        "Controle livremente quais comunicacoes deseja receber.",
      ),
    },
  ];

  function updateField<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (error) setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitInFlightRef.current || !canSubmit) return;

    submitInFlightRef.current = true;
    setSubmitting(true);
    setError(null);

    let shouldClearAuthOnFailure = false;

    try {
      const response = await apiClient.post<LoginResponse>(
        "/api/v1/auth/register",
        {
          body: {
            full_name: form.fullName.trim(),
            email: form.email.trim().toLowerCase(),
            password: form.password,
            confirm_password: form.confirmPassword,
            workspace_name: form.workspaceName.trim() || undefined,
            accept_terms: form.acceptTerms,
            accept_privacy: form.acceptPrivacy,
            accept_data_treatment: form.acceptDataTreatment,
            consent_system_notifications: form.consentSystemNotifications,
            consent_commercial_promotions: form.consentCommercialPromotions,
            consent_events_newsletters: form.consentEventsNewsletters,
            honeypot_field: form.honeypot || undefined,
          },
        },
      );

      if (!response?.access_token) {
        throw new Error(
          localize(
            "The registration was created, but the backend did not return an access token. Please log in with your new account.",
            "El registro fue creado, pero el backend no devolvio un token de acceso. Inicia sesion con tu nueva cuenta.",
            "O cadastro foi criado, mas o backend nao retornou um token de acesso. Inicie sessao com sua nova conta.",
          ),
        );
      }

      const tokenPersisted = setStoredToken(response.access_token);
      if (!tokenPersisted) {
        throw new Error(
          localize(
            "Your account was created, but the browser blocked local session storage. Enable storage for this site and log in again.",
            "Tu cuenta fue creada, pero el navegador bloqueo el almacenamiento local de la sesion. Habilita el almacenamiento para este sitio e inicia sesion de nuevo.",
            "Sua conta foi criada, mas o navegador bloqueou o armazenamento local da sessao. Habilite o armazenamento deste site e inicie sessao novamente.",
          ),
        );
      }

      clearLegacyStoredToken();
      shouldClearAuthOnFailure = true;
      const hydratedState = await auth.hydrate({
        force: true,
        redirectOnUnauthorized: false,
      });

      if (hydratedState.status === "authenticated" && hydratedState.user) {
        const redirectParam =
          typeof window !== "undefined"
            ? new URLSearchParams(window.location.search).get("redirect")
            : null;
        router.replace(redirectParam || "/projects");
        return;
      }

      throw new Error(
        localize(
          "We created your account, but could not validate the new session. Please log in with your credentials.",
          "Creamos tu cuenta, pero no pudimos validar la nueva sesion. Inicia sesion con tus credenciales.",
          "Criamos sua conta, mas nao conseguimos validar a nova sessao. Inicie sessao com suas credenciais.",
        ),
      );
    } catch (err: unknown) {
      if (shouldClearAuthOnFailure) {
        auth.clear();
      }
      setSubmitting(false);
      submitInFlightRef.current = false;
      if (err && typeof err === "object" && "message" in err) {
        setError(String((err as { message: string }).message));
      } else {
        setError(
          localize(
            "There was an error processing the registration. Please try again.",
            "Error al procesar el registro. Intenta de nuevo.",
            "Erro ao processar o cadastro. Tente novamente.",
          ),
        );
      }
    }
  }

  return (
    <div
      className="auth-viewport min-h-[100dvh] overflow-y-auto bg-[#07152c] p-2.5 sm:p-3 lg:p-4"
      data-auth-build="auth-compact-20"
      data-auth-density="compact-20"
      data-auth-surface="register"
    >
      <div className="auth-shell mx-auto grid min-h-[calc(100dvh-20px)] max-w-[1500px] overflow-hidden rounded-[26px] border border-white/15 bg-white lg:min-h-[calc(100dvh-32px)] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.5fr)]">
        {/* Left Sidebar */}
        <section className="auth-marketing-shell auth-marketing-shell-register sidebar-sheen surface-noise relative order-2 px-5 py-6 text-white sm:px-7 sm:py-7 lg:order-1 lg:overflow-hidden lg:px-7 lg:py-8">
          <div className="relative z-10 flex h-full flex-col">
            <div className="auth-brand-row mb-5 flex items-center gap-2.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-[var(--gradient-primary)] shadow-[0_14px_28px_rgba(79,70,245,0.25)]">
                <Sparkles className="h-5 w-5 text-white" />
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
              {localize(
                "Secure Registration - Certified Privacy",
                "Registro Seguro - Privacidad Certificada",
                "Cadastro Seguro - Privacidade Certificada",
              )}
            </Badge>

            <div className="auth-marketing-copy max-w-[430px]">
              <h1 className="auth-marketing-title text-[30px] font-semibold leading-[1] tracking-[-0.03em] sm:text-[36px] lg:text-[clamp(34px,3vw,44px)]">
                {localize(
                  "Create your account ",
                  "Crea tu cuenta ",
                  "Crie sua conta ",
                )}
                <span className="text-[#8f91ff]">
                  {localize(
                    "on the local platform",
                    "en la plataforma local",
                    "na plataforma local",
                  )}
                </span>
              </h1>
              <p className="auth-marketing-subtitle mt-3 text-[13px] leading-5 text-white/74">
                {localize(
                  "Join the enterprise platform to design, evaluate, and build AI agents with governance and privacy built in.",
                  "Únete a la plataforma empresarial para diseñar, evaluar y construir agentes de IA con gobernanza y privacidad garantizada.",
                  "Junte-se à plataforma empresarial para desenhar, avaliar e construir agentes de IA com governança e privacidade garantidas.",
                )}
              </p>
            </div>

            <div className="auth-register-feature-list mt-5 space-y-3.5">
              {registerHighlights.map((item) => (
                <div
                  key={item.title}
                  className="auth-register-feature flex gap-3"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[rgba(109,74,255,0.3)]">
                    <ShieldCheck className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold">{item.title}</p>
                    <p className="mt-0.5 text-[11px] leading-5 text-white/68">
                      {item.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-5">
              <div className="auth-proof-card flex items-center gap-2.5 rounded-[14px] border border-white/12 bg-white/5 p-3 text-[11px] leading-4 text-white/70">
                <Lock className="h-4 w-4 shrink-0 text-[#4ff1df]" />
                <span>
                  {localize(
                    "Subscribers and teams get a dedicated and immutable workspace.",
                    "Suscriptores y equipos cuentan con workspace dedicado e inmutable.",
                    "Assinantes e equipes contam com workspace dedicado e imutável.",
                  )}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Content Form */}
        <section className="auth-form-stage auth-form-stage-scroll scrollbar-subtle relative order-1 flex min-h-0 flex-col justify-between overflow-y-auto bg-[linear-gradient(180deg,#ffffff_0%,#f9fbff_100%)] px-4 py-3 sm:px-6 sm:py-4 lg:order-2 lg:px-7 lg:py-5">
          <div className="auth-toolbar auth-toolbar-split flex min-h-9 items-center justify-between">
            <div className="auth-auth-mode-switch flex items-center gap-1.5 rounded-full border border-[var(--border-default)] bg-[var(--surface-subtle)] p-1 text-[11px]">
              <Link
                href={LOGIN_ROUTE}
                className="rounded-full px-3 py-1 font-medium text-[var(--text-secondary)] transition hover:text-black"
              >
                {t("nav.login")}
              </Link>
              <span className="rounded-full bg-[var(--brand-primary)] px-3 py-1 font-semibold text-white">
                {t("nav.register")}
              </span>
            </div>
            <LanguageSelector compact className="auth-language-selector" />
          </div>

          <div className="auth-form-wrap mx-auto my-3 w-full max-w-[540px]">
            <Panel className="auth-form-panel px-5 py-4 sm:px-6 sm:py-5">
              <Badge tone="violet" className="mb-3 text-[11px]">
                {t("register.badge")}
              </Badge>
              <h2 className="auth-form-title text-[25px] font-semibold leading-[1.05] tracking-[-0.02em] text-[var(--text-primary)] sm:text-[30px]">
                {t("register.title")}
              </h2>
              <p className="auth-form-subtitle mt-1.5 text-[13px] leading-5 text-[var(--text-secondary)]">
                {t("register.subtitle")}
              </p>

              <form
                className="auth-form-stack mt-4 space-y-3"
                onSubmit={handleSubmit}
              >
                {/* Honeypot anti-bot hidden field */}
                <input
                  type="text"
                  name="user_hp"
                  value={form.honeypot}
                  onChange={(e) => updateField("honeypot", e.target.value)}
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                />

                <TextField
                  className="auth-field"
                  density="compact"
                  label={t("register.fullName")}
                  placeholder={localize(
                    "E.g. Jane Smith",
                    "Ej. Juan Pérez",
                    "Ex. Joao Silva",
                  )}
                  value={form.fullName}
                  onValueChange={(val) => updateField("fullName", val)}
                  required
                  trailing={<User className="h-4 w-4" />}
                />

                <TextField
                  className="auth-field"
                  density="compact"
                  label={t("register.email")}
                  type="email"
                  placeholder="tu@empresa.com"
                  value={form.email}
                  onValueChange={(val) => updateField("email", val)}
                  required
                  trailing={<Mail className="h-4 w-4" />}
                />

                <TextField
                  className="auth-field"
                  density="compact"
                  label={t("register.workspace")}
                  placeholder={localize(
                    "E.g. My SaaS Company",
                    "Ej. Mi Empresa SaaS",
                    "Ex. Minha Empresa SaaS",
                  )}
                  value={form.workspaceName}
                  onValueChange={(val) => updateField("workspaceName", val)}
                  trailing={<Building2 className="h-4 w-4" />}
                />

                {/* Password Field */}
                <div className="space-y-1.5">
                  <label
                    className="block text-[12px] font-medium text-[var(--text-primary)]"
                    htmlFor={passwordInputId}
                  >
                    {t("register.password")}
                  </label>
                  <div className="relative">
                    <input
                      aria-describedby={form.password ? passwordRequirementsId : undefined}
                      id={passwordInputId}
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => updateField("password", e.target.value)}
                      placeholder={localize(
                        "Create a secure password",
                        "Crea una contraseña segura",
                        "Crie uma senha segura",
                      )}
                      required
                      className="auth-inline-input h-10 w-full rounded-[9px] border border-[var(--border-default)] bg-white px-3.5 py-2 pr-10 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-primary)]"
                    />
                    <button
                      aria-label={
                        showPassword
                          ? localize(
                              "Hide password",
                              "Ocultar contrasena",
                              "Ocultar senha",
                            )
                          : localize(
                              "Show password",
                              "Mostrar contrasena",
                              "Mostrar senha",
                            )
                      }
                      aria-pressed={showPassword}
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-2.5 text-[var(--text-muted)] hover:text-black"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* Strength Meter Bar */}
                  {form.password ? (
                    <div className="space-y-1.5 pt-0.5">
                      <div className="flex items-center justify-between gap-2 text-[10px] font-semibold">
                        <span className="text-[var(--text-secondary)]">
                          {t("register.passwordStrength")}
                        </span>
                        <span
                          className={
                            isPasswordStrong
                              ? "text-[#16a34a]"
                              : "text-[#d97706]"
                          }
                        >
                          {isPasswordStrong
                            ? localize(
                                "Excellent (Meets all requirements)",
                                "Excelente (Cumple todos los requisitos)",
                                "Excelente (Cumpre todos os requisitos)",
                              )
                            : localize(
                                `${metCount} of 5 requirements`,
                                `${metCount} de 5 requisitos`,
                                `${metCount} de 5 requisitos`,
                              )}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--border-subtle)]">
                        <div
                          className={`h-full transition-all duration-300 ${
                            metCount <= 2
                              ? "bg-red-500"
                              : metCount <= 4
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                          }`}
                          style={{ width: `${strengthPercent}%` }}
                        />
                      </div>

                      {/* Criteria checklist */}
                      <div
                        className="grid grid-cols-2 gap-1 pt-0.5 text-[10px]"
                        id={passwordRequirementsId}
                      >
                        <span
                          className={`flex items-center gap-1.5 ${criteria.minLength ? "text-[#16a34a]" : "text-[var(--text-muted)]"}`}
                        >
                          <CheckCircle2 className="h-3 w-3" />{" "}
                          {localize(
                            "Minimum 8 characters",
                            "Mínimo 8 caracteres",
                            "Mínimo 8 caracteres",
                          )}
                        </span>
                        <span
                          className={`flex items-center gap-1.5 ${criteria.hasUpper ? "text-[#16a34a]" : "text-[var(--text-muted)]"}`}
                        >
                          <CheckCircle2 className="h-3 w-3" />{" "}
                          {localize(
                            "1 uppercase (A-Z)",
                            "1 mayúscula (A-Z)",
                            "1 maiúscula (A-Z)",
                          )}
                        </span>
                        <span
                          className={`flex items-center gap-1.5 ${criteria.hasLower ? "text-[#16a34a]" : "text-[var(--text-muted)]"}`}
                        >
                          <CheckCircle2 className="h-3 w-3" />{" "}
                          {localize(
                            "1 lowercase (a-z)",
                            "1 minúscula (a-z)",
                            "1 minúscula (a-z)",
                          )}
                        </span>
                        <span
                          className={`flex items-center gap-1.5 ${criteria.hasNumber ? "text-[#16a34a]" : "text-[var(--text-muted)]"}`}
                        >
                          <CheckCircle2 className="h-3 w-3" />{" "}
                          {localize(
                            "1 number (0-9)",
                            "1 número (0-9)",
                            "1 número (0-9)",
                          )}
                        </span>
                        <span
                          className={`flex items-center gap-1.5 ${criteria.hasSpecial ? "text-[#16a34a]" : "text-[var(--text-muted)]"}`}
                        >
                          <CheckCircle2 className="h-3 w-3" />{" "}
                          {localize(
                            "1 special character (@$!%*?&#)",
                            "1 especial (@$!%*?&#)",
                            "1 especial (@$!%*?&#)",
                          )}
                        </span>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <label
                    className="block text-[12px] font-medium text-[var(--text-primary)]"
                    htmlFor={confirmPasswordInputId}
                  >
                    {t("register.confirmPassword")}
                  </label>
                  <input
                    aria-describedby={
                      form.confirmPassword && !passwordsMatch
                        ? confirmPasswordErrorId
                        : undefined
                    }
                    aria-invalid={
                      form.confirmPassword && !passwordsMatch ? true : undefined
                    }
                    id={confirmPasswordInputId}
                    type={showPassword ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={(e) =>
                      updateField("confirmPassword", e.target.value)
                    }
                    placeholder="••••••••"
                    required
                    className="auth-inline-input h-10 w-full rounded-[9px] border border-[var(--border-default)] bg-white px-3.5 py-2 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-primary)]"
                  />
                  {form.confirmPassword && !passwordsMatch ? (
                    <p
                      className="text-[11px] text-red-600"
                      id={confirmPasswordErrorId}
                    >
                      {localize(
                        "Passwords do not match.",
                        "Las contraseñas no coinciden.",
                        "As senhas não coincidem.",
                      )}
                    </p>
                  ) : null}
                </div>

                {/* Legal Acceptances Section */}
                <div className="space-y-2 rounded-[12px] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[var(--brand-primary)]" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-primary)]">
                      {t("register.legalTitle")}
                    </span>
                  </div>

                  <div className="flex items-start gap-2 text-[11px] leading-4 text-[var(--text-primary)]">
                    <input
                      id={acceptTermsInputId}
                      type="checkbox"
                      checked={form.acceptTerms}
                      onChange={(e) =>
                        updateField("acceptTerms", e.target.checked)
                      }
                      className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
                      required
                    />
                    <div className="min-w-0">
                      <label
                        className="cursor-pointer"
                        htmlFor={acceptTermsInputId}
                      >
                        {t("register.acceptTerms")}
                      </label>
                      <button
                        type="button"
                        onClick={() => setActiveModal("terms")}
                        className="mt-1 inline-flex font-semibold text-[var(--brand-primary)] underline"
                      >
                        {localize("(View)", "(Ver)", "(Ver)")}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-[11px] leading-4 text-[var(--text-primary)]">
                    <input
                      id={acceptDataTreatmentInputId}
                      type="checkbox"
                      checked={form.acceptDataTreatment}
                      onChange={(e) =>
                        updateField("acceptDataTreatment", e.target.checked)
                      }
                      className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
                      required
                    />
                    <div className="min-w-0">
                      <label
                        className="cursor-pointer"
                        htmlFor={acceptDataTreatmentInputId}
                      >
                        {t("register.acceptData")}
                      </label>
                      <button
                        type="button"
                        onClick={() => setActiveModal("data_treatment")}
                        className="mt-1 inline-flex font-semibold text-[var(--brand-primary)] underline"
                      >
                        {localize("(View)", "(Ver)", "(Ver)")}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-[11px] leading-4 text-[var(--text-primary)]">
                    <input
                      id={acceptPrivacyInputId}
                      type="checkbox"
                      checked={form.acceptPrivacy}
                      onChange={(e) =>
                        updateField("acceptPrivacy", e.target.checked)
                      }
                      className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
                      required
                    />
                    <div className="min-w-0">
                      <label
                        className="cursor-pointer"
                        htmlFor={acceptPrivacyInputId}
                      >
                        {t("register.acceptPrivacy")}
                      </label>
                      <button
                        type="button"
                        onClick={() => setActiveModal("privacy")}
                        className="mt-1 inline-flex font-semibold text-[var(--brand-primary)] underline"
                      >
                        {localize("(View)", "(Ver)", "(Ver)")}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Optional Consents Section */}
                <div className="space-y-1.5 rounded-[12px] border border-gray-200 bg-white p-3">
                  <p className="text-[11px] font-semibold text-[var(--text-primary)]">
                    {t("register.optionalConsentsTitle")}
                  </p>

                  <label className="flex cursor-pointer items-center gap-2 text-[11px] text-[var(--text-secondary)] hover:text-black">
                    <input
                      type="checkbox"
                      checked={form.consentSystemNotifications}
                      onChange={(e) =>
                        updateField(
                          "consentSystemNotifications",
                          e.target.checked,
                        )
                      }
                      className="h-3.5 w-3.5 rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
                    />
                    <span>{t("register.consentSystem")}</span>
                  </label>

                  <label className="flex cursor-pointer items-center gap-2 text-[11px] text-[var(--text-secondary)] hover:text-black">
                    <input
                      type="checkbox"
                      checked={form.consentCommercialPromotions}
                      onChange={(e) =>
                        updateField(
                          "consentCommercialPromotions",
                          e.target.checked,
                        )
                      }
                      className="h-3.5 w-3.5 rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
                    />
                    <span>{t("register.consentCommercial")}</span>
                  </label>

                  <label className="flex cursor-pointer items-center gap-2 text-[11px] text-[var(--text-secondary)] hover:text-black">
                    <input
                      type="checkbox"
                      checked={form.consentEventsNewsletters}
                      onChange={(e) =>
                        updateField(
                          "consentEventsNewsletters",
                          e.target.checked,
                        )
                      }
                      className="h-3.5 w-3.5 rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
                    />
                    <span>{t("register.consentEvents")}</span>
                  </label>
                </div>

                {error ? (
                  <InlineFieldError aria-live="assertive" role="alert">
                    {error}
                  </InlineFieldError>
                ) : null}

                <AppButton
                  variant="primary"
                  className="auth-primary-button h-10 w-full rounded-[9px] text-[13px]"
                  type="submit"
                  disabled={!canSubmit}
                  loading={submitting}
                  loadingLabel={localize(
                    "Processing secure registration",
                    "Procesando registro seguro",
                    "Processando cadastro seguro",
                  )}
                >
                  {t("register.submit")}
                </AppButton>
              </form>
            </Panel>
          </div>

          <div className="auth-footer-copy pb-1 text-center text-[11px] leading-4 text-[var(--text-secondary)]">
            {localize(
              "By registering, immutable evidence of your legal acceptance will be stored for audit purposes in accordance with applicable law.",
              "Al registrarte se almacenará evidencia inmutable de tu aceptación legal para fines de auditoría conforme a la ley.",
              "Ao se cadastrar, evidências imutáveis da sua aceitação legal serão armazenadas para fins de auditoria conforme a lei aplicável.",
            )}
          </div>
        </section>
      </div>

      {/* Legal Documents Reader Modals */}
      {activeModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-[20px] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[var(--brand-primary)]" />
                <h3 className="text-[18px] font-semibold text-[var(--text-primary)]">
                  {activeModal === "terms" &&
                    localize(
                      "Terms and Conditions of Use",
                      "Términos y Condiciones de Uso",
                      "Termos e Condições de Uso",
                    )}
                  {activeModal === "data_treatment" &&
                    localize(
                      "Personal Data Processing Policy (Habeas Data)",
                      "Política de Tratamiento de Datos Personales (Habeas Data)",
                      "Política de Tratamento de Dados Pessoais (Habeas Data)",
                    )}
                  {activeModal === "privacy" &&
                    localize(
                      "Privacy and Cookies Policy",
                      "Política de Privacidad y Cookies",
                      "Política de Privacidade e Cookies",
                    )}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-[13px] leading-6 text-gray-600">
              {activeModal === "terms" && (
                <>
                  <p className="font-semibold text-gray-800">
                    {localize(
                      "Version 1.0 (Effective from August 2026)",
                      "Versión 1.0 (Vigente a partir de Agosto 2026)",
                      "Versão 1.0 (Vigente a partir de Agosto de 2026)",
                    )}
                  </p>
                  <p>
                    {localize(
                      "Welcome to Lean Agent Builder. By registering and using our platform, you agree to comply with these Terms and Conditions of Use. The platform allows you to design, evaluate, and build AI agent solutions in local and private environments.",
                      "Bienvenido a Lean Agent Builder. Al registrarte y utilizar nuestra plataforma, aceptas cumplir con los presentes Términos y Condiciones de Uso. La plataforma permite diseñar, evaluar y construir soluciones de agentes de IA en entornos locales y privados.",
                      "Bem-vindo ao Lean Agent Builder. Ao se cadastrar e usar nossa plataforma, você concorda em cumprir estes Termos e Condições de Uso. A plataforma permite desenhar, avaliar e construir soluções de agentes de IA em ambientes locais e privados.",
                    )}
                  </p>
                  <p className="font-semibold text-gray-800">
                    {localize(
                      "1. License of Use and Intellectual Property",
                      "1. Licencia de Uso y Propiedad Intelectual",
                      "1. Licença de Uso e Propriedade Intelectual",
                    )}
                  </p>
                  <p>
                    {localize(
                      "All rights over the designs, artifacts, Blueprints, and ACP packages generated in your workspace belong exclusively to your organization.",
                      "Todos los derechos sobre los diseños, artefactos, Blueprints y paquetes ACP generados en tu workspace pertenecen exclusivamente a tu organización.",
                      "Todos os direitos sobre os desenhos, artefatos, Blueprints e pacotes ACP gerados no seu workspace pertencem exclusivamente à sua organização.",
                    )}
                  </p>
                  <p className="font-semibold text-gray-800">
                    {localize(
                      "2. Security and Account Responsibility",
                      "2. Seguridad y Responsabilidad de Cuenta",
                      "2. Segurança e Responsabilidade da Conta",
                    )}
                  </p>
                  <p>
                    {localize(
                      "You are responsible for maintaining the confidentiality of your access credentials.",
                      "Eres responsable de mantener la confidencialidad de tus credenciales de acceso.",
                      "Você é responsável por manter a confidencialidade das suas credenciais de acesso.",
                    )}
                  </p>
                </>
              )}

              {activeModal === "data_treatment" && (
                <>
                  <p className="font-semibold text-gray-800">
                    {localize(
                      "Authorization under Law 1581 and Data Protection Regulations",
                      "Autorización conforme a la Ley 1581 y Normativa de Protección de Datos",
                      "Autorização conforme a Lei 1581 e a Normativa de Proteção de Dados",
                    )}
                  </p>
                  <p>
                    {localize(
                      "In compliance with current Personal Data Protection regulations (Habeas Data), you authorize the platform to collect, store, and process your contact data solely for service delivery.",
                      "En cumplimiento de las normativas vigentes sobre Protección de Datos Personales (Habeas Data), autorizas a la plataforma a recolectar, almacenar y tratar tus datos de contacto únicamente para la prestación del servicio.",
                      "Em conformidade com as normas vigentes de Proteção de Dados Pessoais (Habeas Data), você autoriza a plataforma a coletar, armazenar e tratar seus dados de contato unicamente para a prestação do serviço.",
                    )}
                  </p>
                  <p className="font-semibold text-gray-800">
                    {localize("ARCO Rights", "Derechos ARCO", "Direitos ARCO")}
                  </p>
                  <p>
                    {localize(
                      "As the data owner, you have the right to Access, Rectify, Cancel, or Oppose the processing of your information from your account settings or through a formal request.",
                      "Como titular de los datos, tienes derecho a Acceder, Rectificar, Cancelar u Oponerte al tratamiento de tu información desde la configuración de tu cuenta o mediante solicitud formal.",
                      "Como titular dos dados, você tem direito de Acessar, Retificar, Cancelar ou se Opor ao tratamento das suas informações pela configuração da conta ou mediante solicitação formal.",
                    )}
                  </p>
                </>
              )}

              {activeModal === "privacy" && (
                <>
                  <p className="font-semibold text-gray-800">
                    {localize(
                      "Privacy Policy and Local Infrastructure",
                      "Política de Privacidad e Infraestructura Local",
                      "Política de Privacidade e Infraestrutura Local",
                    )}
                  </p>
                  <p>
                    {localize(
                      "We fully respect your privacy. The platform operates under a private scheme where your API secrets and contextual data remain within your infrastructure.",
                      "Respetamos plenamente tu privacidad. La plataforma opera bajo un esquema privado donde tus claves secretas de API y datos de contexto permanecen en tu infraestructura.",
                      "Respeitamos plenamente sua privacidade. A plataforma opera sob um esquema privado no qual suas chaves secretas de API e dados de contexto permanecem na sua infraestrutura.",
                    )}
                  </p>
                  <p className="font-semibold text-gray-800">
                    {localize("Use of Cookies", "Uso de Cookies", "Uso de Cookies")}
                  </p>
                  <p>
                    {localize(
                      "We use strictly necessary technical and session cookies to authenticate your access and preserve your interface preferences.",
                      "Utilizamos cookies técnicas y de sesión estrictamente necesarias para autenticar tu ingreso y mantener tus preferencias de interfaz.",
                      "Utilizamos cookies técnicas e de sessão estritamente necessárias para autenticar seu acesso e manter suas preferências de interface.",
                    )}
                  </p>
                </>
              )}
            </div>

            <div className="mt-6 flex justify-end border-t border-gray-100 pt-4">
              <AppButton variant="primary" onClick={() => setActiveModal(null)}>
                {localize(
                  "Understood and Close Document",
                  "Entendido y Cerrar Documento",
                  "Entendido e Fechar Documento",
                )}
              </AppButton>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
