"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AppButton, Badge, Panel } from "@/components/lean/ui";
import { apiClient } from "@/core/api";
import { useCurrency } from "@/core/commerce/currency-context";
import { useLanguage } from "@/core/i18n/language-context";
import { byLanguage } from "@/features/product-experience/core/localized-copy";
import { cn } from "@/lib/utils";

export function UserCurrencyPreferencePanel() {
  const { currency, setCurrency, trm } = useCurrency();
  const { language, t } = useLanguage();

  return (
    <Panel className="border-[var(--border-default)] bg-white p-5 lg:p-6 space-y-4">
      <div>
        <Badge tone="blue">{t("settings.currencyDisplayBadge", "Moneda de Visualización")}</Badge>
        <h3 className="mt-2 text-[18px] font-semibold text-[var(--text-primary)]">
          {t("settings.personalCurrencyTitle", "Preferencia Personal de Moneda")}
        </h3>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
          {t("settings.personalCurrencyDesc", "Selecciona la moneda en la que deseas visualizar los precios en toda la plataforma.")}
        </p>
      </div>

      <div className="rounded-[12px] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-[14px] font-semibold text-[var(--text-primary)]">{t("settings.preferredCurrencyLabel", "Moneda Preferida")}</p>
            <p className="text-[12px] text-[var(--text-secondary)]">
              {t("settings.preferredCurrencyDesc", "Dólares (USD) o Pesos Colombianos (COP) según TRM oficial vigente del día.")}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setCurrency("USD")}
              className={cn(
                "h-9 px-4 rounded-[8px] text-[13px] font-semibold transition border",
                currency === "USD"
                  ? "bg-[var(--brand-primary)] text-white border-transparent shadow-sm"
                  : "bg-white text-[var(--text-primary)] border-[var(--border-default)] hover:bg-black/5",
              )}
            >
              {byLanguage(language, { en: "USD ($)", es: "USD ($)", pt: "USD ($)" })}
            </button>
            <button
              type="button"
              onClick={() => setCurrency("COP")}
              className={cn(
                "h-9 px-4 rounded-[8px] text-[13px] font-semibold transition border",
                currency === "COP"
                  ? "bg-[var(--brand-primary)] text-white border-transparent shadow-sm"
                  : "bg-white text-[var(--text-primary)] border-[var(--border-default)] hover:bg-black/5",
              )}
            >
              {byLanguage(language, { en: "COP ($)", es: "COP ($)", pt: "COP ($)" })}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[var(--border-default)] text-[12px] text-[var(--text-secondary)]">
          <span className="font-semibold text-[var(--brand-primary)]">
            {t("settings.trmCurrentLabel", "TRM Vigente Hoy")}: {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(trm.trm_cop)} COP/USD
          </span>
          <span>·</span>
          <span>{t("settings.trmDateLabel", "Fecha TRM")}: {trm.date || "Hoy"}</span>
          <span>·</span>
          <span className="text-[11px] text-[var(--text-muted)]">{t("settings.trmSourceLabel", "Fuente")}: datos.gov.co (SICS Colombia)</span>
        </div>
      </div>
    </Panel>
  );
}

export function UserPrivacyConsentsPanel() {
  const [consents, setConsents] = useState({
    consent_system_notifications: false,
    consent_commercial_promotions: false,
    consent_events_newsletters: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadConsents = useCallback(async () => {
    try {
      const data = await apiClient.get<{
        consent_system_notifications: boolean;
        consent_commercial_promotions: boolean;
        consent_events_newsletters: boolean;
      }>("/api/v1/auth/consents");
      setConsents({
        consent_system_notifications: Boolean(data.consent_system_notifications),
        consent_commercial_promotions: Boolean(data.consent_commercial_promotions),
        consent_events_newsletters: Boolean(data.consent_events_newsletters),
      });
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Settings debe sincronizar consentimientos iniciales con backend al montar.
    void loadConsents();
  }, [loadConsents]);

  async function handleSaveConsents() {
    setSaving(true);
    setMessage("");
    try {
      await apiClient.patch("/api/v1/auth/consents", {
        body: consents,
      });
      setMessage("Preferencias de consentimientos de privacidad actualizadas correctamente.");
      setTimeout(() => setMessage(""), 3500);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error al actualizar consentimientos.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel className="p-6">
      <div className="space-y-4">
        <div>
          <Badge tone="violet">Privacidad & Habeas Data</Badge>
          <h3 className="mt-2 text-[18px] font-semibold text-[var(--text-primary)]">
            Consentimientos de Comunicación Opcionales
          </h3>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
            Puedes activar o desactivar independientemente las autorizaciones de contacto en cualquier momento.
          </p>
        </div>

        {loading ? (
          <p className="text-[13px] text-[var(--text-muted)]">Cargando preferencias...</p>
        ) : (
          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-3 text-[13px] text-[var(--text-primary)] cursor-pointer">
              <input
                type="checkbox"
                checked={consents.consent_system_notifications}
                onChange={(e) =>
                  setConsents((prev) => ({ ...prev, consent_system_notifications: e.target.checked }))
                }
                className="h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)]"
              />
              <span>Recibir notificaciones operativas del sistema de la plataforma.</span>
            </label>

            <label className="flex items-center gap-3 text-[13px] text-[var(--text-primary)] cursor-pointer">
              <input
                type="checkbox"
                checked={consents.consent_commercial_promotions}
                onChange={(e) =>
                  setConsents((prev) => ({ ...prev, consent_commercial_promotions: e.target.checked }))
                }
                className="h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)]"
              />
              <span>Recibir comunicaciones comerciales, promociones y ofertas especiales.</span>
            </label>

            <label className="flex items-center gap-3 text-[13px] text-[var(--text-primary)] cursor-pointer">
              <input
                type="checkbox"
                checked={consents.consent_events_newsletters}
                onChange={(e) =>
                  setConsents((prev) => ({ ...prev, consent_events_newsletters: e.target.checked }))
                }
                className="h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)]"
              />
              <span>Recibir información sobre novedades, lanzamientos de características y boletines de eventos.</span>
            </label>

            {message ? (
              <p className="text-[12px] font-medium text-[var(--brand-primary)] pt-1">{message}</p>
            ) : null}

            <div className="pt-2">
              <AppButton
                onClick={() => void handleSaveConsents()}
                loading={saving}
                variant="primary"
                className="h-9 rounded-[8px] px-4 text-[13px]"
              >
                Guardar Preferencias de Privacidad
              </AppButton>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}

export function UserLanguagePreferencePanel() {
  const { language, setLanguage, languages, t } = useLanguage();
  const [message, setMessage] = useState("");

  function handleLanguageChange(code: "es" | "en" | "pt") {
    setLanguage(code);
    setMessage(t("settings.saveLangSuccess"));
    setTimeout(() => {
      setMessage("");
    }, 3000);
  }

  return (
    <Panel className="p-6">
      <div className="space-y-4">
        <div>
          <Badge tone="blue">{t("nav.switchLanguage")}</Badge>
          <h3 className="mt-2 text-[18px] font-semibold text-[var(--text-primary)]">
            {t("settings.langPanelTitle")}
          </h3>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
            {t("settings.langPanelSubtitle")}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          {languages.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => handleLanguageChange(item.code)}
              className={cn(
                "flex items-center gap-2.5 h-10 px-5 rounded-[10px] text-[13px] font-semibold transition border",
                language === item.code
                  ? "bg-[var(--brand-primary)] text-white border-transparent shadow-sm"
                  : "bg-white text-[var(--text-primary)] border-[var(--border-default)] hover:bg-black/5",
              )}
            >
              <span className="text-[16px]">{item.flag}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {message ? (
          <p className="text-[12px] font-medium text-[var(--brand-primary)] pt-1">{message}</p>
        ) : null}
      </div>
    </Panel>
  );
}

export function SettingsScopeHeader({
  accessLabel,
  description,
  eyebrow,
  icon,
  id,
  title,
}: {
  accessLabel: string;
  description: string;
  eyebrow: string;
  icon: ReactNode;
  id: string;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-[12px] border border-[var(--border-default)] bg-white p-5 md:flex-row md:items-start md:justify-between">
      <div className="flex items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[var(--brand-soft)] text-[var(--brand-primary)]">{icon}</span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">{eyebrow}</p>
          <h2 className="mt-1 text-[22px] font-semibold leading-tight text-[var(--text-primary)]" id={id}>{title}</h2>
          <p className="mt-2 max-w-3xl text-[13px] leading-6 text-[var(--text-secondary)]">{description}</p>
        </div>
      </div>
      <Badge tone="blue">{accessLabel}</Badge>
    </div>
  );
}
