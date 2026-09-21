"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { Building2, Lock, ShieldCheck } from "lucide-react";
import { AppButton, InlineFieldError, TextField } from "@/components/lean/ui";
import { trackLogin, trackSignUp } from "@/core/analytics/analytics-client";
import { useAuth } from "@/core/auth/auth-context";
import { getGoogleClientId, isGoogleAuthEnabled } from "@/core/config/runtime";
import { useLanguage } from "@/core/i18n/language-context";

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleAccountsApi = {
  id: {
    initialize(options: {
      callback: (response: GoogleCredentialResponse) => void;
      client_id: string;
      context?: "signin" | "signup" | "use";
      ux_mode?: "popup" | "redirect";
    }): void;
    renderButton(
      element: HTMLElement,
      options: {
        locale?: string;
        shape?: "rectangular" | "pill" | "circle" | "square";
        size?: "large" | "medium" | "small";
        text?: "signin_with" | "signup_with" | "continue_with" | "signin";
        theme?: "outline" | "filled_blue" | "filled_black";
        width?: number;
      },
    ): void;
  };
};

declare global {
  interface Window {
    google?: {
      accounts: GoogleAccountsApi;
    };
  }
}

type CompletionMode = "idle" | "registration_required" | "link_required";

export function GoogleAuthPanel({
  redirectTarget,
}: {
  redirectTarget: string;
}) {
  const router = useRouter();
  const auth = useAuth();
  const loginWithGoogle = auth.loginWithGoogle;
  const { language } = useLanguage();
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [credential, setCredential] = useState("");
  const [mode, setMode] = useState<CompletionMode>("idle");
  const [profile, setProfile] = useState({ email: "", fullName: "" });
  const [password, setPassword] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptDataTreatment, setAcceptDataTreatment] = useState(false);
  const [consentSystemNotifications, setConsentSystemNotifications] = useState(false);
  const [consentCommercialPromotions, setConsentCommercialPromotions] = useState(false);
  const [consentEventsNewsletters, setConsentEventsNewsletters] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enabled = isGoogleAuthEnabled();
  const clientId = getGoogleClientId();
  const localize = (en: string, es: string, pt: string) =>
    language === "en" ? en : language === "pt" ? pt : es;

  const finishAuthentication = useCallback(
    (isNewUser: boolean) => {
      if (isNewUser) {
        trackSignUp("google");
      } else {
        trackLogin("google");
      }
      router.replace(redirectTarget);
    },
    [redirectTarget, router],
  );

  const resolveCredential = useCallback(
    async (googleCredential: string) => {
      setError(null);
      try {
        const response = await loginWithGoogle({ credential: googleCredential });
        setCredential(googleCredential);
        setProfile({
          email: response.profile.email,
          fullName: response.profile.full_name,
        });
        if (response.status === "authenticated") {
          finishAuthentication(response.is_new_user);
          return;
        }
        setMode(response.status);
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : localize(
          "Google sign-in could not be completed.",
          "No se pudo completar el acceso con Google.",
          "Nao foi possivel concluir o acesso com o Google.",
        ));
      }
    },
    [finishAuthentication, language, loginWithGoogle],
  );

  useEffect(() => {
    if (!enabled || !scriptReady || !buttonRef.current || !window.google?.accounts) {
      return;
    }

    const target = buttonRef.current;
    target.replaceChildren();
    window.google.accounts.id.initialize({
      callback: (response) => {
        if (!response.credential) {
          setError(localize(
            "Google did not return a usable identity credential.",
            "Google no devolvió una credencial de identidad utilizable.",
            "O Google nao retornou uma credencial de identidade utilizavel.",
          ));
          return;
        }
        void resolveCredential(response.credential);
      },
      client_id: clientId,
      context: "use",
      ux_mode: "popup",
    });
    window.google.accounts.id.renderButton(target, {
      locale: language === "pt" ? "pt_BR" : language,
      shape: "rectangular",
      size: "large",
      text: "continue_with",
      theme: "outline",
      width: Math.min(400, Math.max(260, target.clientWidth || 320)),
    });
  }, [clientId, enabled, language, resolveCredential, scriptReady]);

  async function completeRegistration() {
    if (!acceptTerms || !acceptPrivacy || !acceptDataTreatment) {
      setError(localize(
        "Accept the three required legal documents to create your LAB account.",
        "Acepta los tres documentos obligatorios para crear tu cuenta de LAB.",
        "Aceite os tres documentos obrigatorios para criar sua conta LAB.",
      ));
      return;
    }
    setError(null);
    try {
      const response = await loginWithGoogle({
        credential,
        workspace_name: workspaceName.trim() || undefined,
        accept_terms: acceptTerms,
        accept_privacy: acceptPrivacy,
        accept_data_treatment: acceptDataTreatment,
        consent_system_notifications: consentSystemNotifications,
        consent_commercial_promotions: consentCommercialPromotions,
        consent_events_newsletters: consentEventsNewsletters,
      });
      if (response.status !== "authenticated") {
        throw new Error(localize(
          "LAB could not finish creating your account.",
          "LAB no pudo terminar de crear tu cuenta.",
          "O LAB nao conseguiu concluir a criacao da sua conta.",
        ));
      }
      finishAuthentication(true);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : localize(
        "LAB could not finish creating your account.",
        "LAB no pudo terminar de crear tu cuenta.",
        "O LAB nao conseguiu concluir a criacao da sua conta.",
      ));
    }
  }

  async function linkExistingAccount() {
    if (!password) {
      setError(localize(
        "Enter your current LAB password.",
        "Ingresa tu contraseña actual de LAB.",
        "Digite sua senha atual do LAB.",
      ));
      return;
    }
    setError(null);
    try {
      const response = await loginWithGoogle({ credential, password });
      if (response.status !== "authenticated") {
        throw new Error(localize(
          "The account could not be linked.",
          "No se pudo vincular la cuenta.",
          "Nao foi possivel vincular a conta.",
        ));
      }
      finishAuthentication(false);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : localize(
        "The account could not be linked.",
        "No se pudo vincular la cuenta.",
        "Nao foi possivel vincular a conta.",
      ));
    }
  }

  if (!enabled) {
    return null;
  }

  return (
    <div className="mt-3 space-y-3">
      <Script
        id="google-identity-services"
        onLoad={() => setScriptReady(true)}
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
      />

      {mode === "idle" ? (
        <>
          <div className="flex min-h-11 justify-center" ref={buttonRef} />
          {!scriptReady ? (
            <p className="text-center text-[11px] text-[var(--text-muted)]">
              {localize("Loading secure Google access…", "Cargando acceso seguro de Google…", "Carregando acesso seguro do Google…")}
            </p>
          ) : null}
        </>
      ) : null}

      {mode === "registration_required" ? (
        <div className="space-y-3 rounded-[14px] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4">
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-primary)]" />
            <div>
              <p className="text-[13px] font-semibold text-[var(--text-primary)]">
                {localize("Finish creating your LAB account", "Termina de crear tu cuenta de LAB", "Conclua a criacao da sua conta LAB")}
              </p>
              <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
                {profile.fullName} · {profile.email}
              </p>
            </div>
          </div>

          <TextField
            density="compact"
            label={localize("Workspace name (optional)", "Nombre del workspace (opcional)", "Nome do workspace (opcional)")}
            onValueChange={setWorkspaceName}
            placeholder={localize("E.g. My AI project", "Ej. Mi proyecto de IA", "Ex. Meu projeto de IA")}
            trailing={<Building2 className="h-4 w-4" />}
            value={workspaceName}
          />

          <div className="space-y-2 text-[11px] leading-4 text-[var(--text-primary)]">
            <label className="flex items-start gap-2">
              <input className="mt-0.5" checked={acceptTerms} onChange={(event) => setAcceptTerms(event.target.checked)} type="checkbox" />
              <span>{localize("I accept the", "Acepto los", "Aceito os")} <Link className="font-semibold text-[var(--brand-primary)] underline" href="/legal/terms" target="_blank">{localize("Terms and Conditions", "Términos y Condiciones", "Termos e Condicoes")}</Link>.</span>
            </label>
            <label className="flex items-start gap-2">
              <input className="mt-0.5" checked={acceptDataTreatment} onChange={(event) => setAcceptDataTreatment(event.target.checked)} type="checkbox" />
              <span>{localize("I accept the", "Acepto la", "Aceito a")} <Link className="font-semibold text-[var(--brand-primary)] underline" href="/legal/data-treatment" target="_blank">{localize("Personal Data Processing Policy", "Política de Tratamiento de Datos", "Politica de Tratamento de Dados")}</Link>.</span>
            </label>
            <label className="flex items-start gap-2">
              <input className="mt-0.5" checked={acceptPrivacy} onChange={(event) => setAcceptPrivacy(event.target.checked)} type="checkbox" />
              <span>{localize("I accept the", "Acepto la", "Aceito a")} <Link className="font-semibold text-[var(--brand-primary)] underline" href="/legal/privacy" target="_blank">{localize("Privacy and Cookies Policy", "Política de Privacidad y Cookies", "Politica de Privacidade e Cookies")}</Link>.</span>
            </label>
          </div>

          <details className="rounded-[10px] border border-[var(--border-subtle)] bg-white p-2.5 text-[11px]">
            <summary className="cursor-pointer font-semibold text-[var(--text-secondary)]">
              {localize("Optional communications", "Comunicaciones opcionales", "Comunicacoes opcionais")}
            </summary>
            <div className="mt-2 space-y-2 text-[var(--text-secondary)]">
              <label className="flex items-start gap-2"><input checked={consentSystemNotifications} onChange={(event) => setConsentSystemNotifications(event.target.checked)} type="checkbox" /><span>{localize("Product and system notifications", "Notificaciones del producto y del sistema", "Notificacoes do produto e do sistema")}</span></label>
              <label className="flex items-start gap-2"><input checked={consentCommercialPromotions} onChange={(event) => setConsentCommercialPromotions(event.target.checked)} type="checkbox" /><span>{localize("Commercial promotions", "Promociones comerciales", "Promocoes comerciais")}</span></label>
              <label className="flex items-start gap-2"><input checked={consentEventsNewsletters} onChange={(event) => setConsentEventsNewsletters(event.target.checked)} type="checkbox" /><span>{localize("Events and newsletters", "Eventos y boletines", "Eventos e boletins")}</span></label>
            </div>
          </details>

          <AppButton className="w-full" loading={auth.status === "submitting"} onClick={() => void completeRegistration()} variant="primary">
            {localize("Create account and save diagnosis", "Crear cuenta y guardar diagnóstico", "Criar conta e salvar diagnostico")}
          </AppButton>
        </div>
      ) : null}

      {mode === "link_required" ? (
        <div className="space-y-3 rounded-[14px] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4">
          <div>
            <p className="text-[13px] font-semibold text-[var(--text-primary)]">
              {localize("Link your existing LAB account", "Vincula tu cuenta existente de LAB", "Vincule sua conta LAB existente")}
            </p>
            <p className="mt-1 text-[11px] leading-4 text-[var(--text-secondary)]">
              {localize(
                `There is already a LAB account for ${profile.email}. Enter its current password once to enable Google access.`,
                `Ya existe una cuenta de LAB para ${profile.email}. Ingresa su contraseña actual una sola vez para habilitar Google.`,
                `Ja existe uma conta LAB para ${profile.email}. Digite a senha atual uma vez para habilitar o Google.`,
              )}
            </p>
          </div>
          <TextField
            autoComplete="current-password"
            density="compact"
            label={localize("Current LAB password", "Contraseña actual de LAB", "Senha atual do LAB")}
            onValueChange={setPassword}
            trailing={<Lock className="h-4 w-4" />}
            type="password"
            value={password}
          />
          <AppButton className="w-full" loading={auth.status === "submitting"} onClick={() => void linkExistingAccount()} variant="primary">
            {localize("Link and continue", "Vincular y continuar", "Vincular e continuar")}
          </AppButton>
        </div>
      ) : null}

      {error ? <InlineFieldError aria-live="assertive" role="alert">{error}</InlineFieldError> : null}
      <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
        <div className="h-px flex-1 bg-[var(--border-subtle)]" />
        <span>{localize("or continue with email", "o continúa con correo", "ou continue com e-mail")}</span>
        <div className="h-px flex-1 bg-[var(--border-subtle)]" />
      </div>
    </div>
  );
}
