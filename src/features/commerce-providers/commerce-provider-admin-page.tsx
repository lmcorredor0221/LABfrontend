"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCcw, Save, ShieldCheck } from "lucide-react";
import { AppButton, Badge, KeyValue, Panel, TabList } from "@/components/lean/ui";
import { cn } from "@/lib/utils";
import { commerceProviderAdminApi } from "@/features/commerce-providers/provider-admin-api";
import type {
  CommercePaymentProviderKey,
  CommerceProviderCheckoutRecordResponse,
  CommerceProviderDefinitionResponse,
  CommerceProviderEnvironment,
  CommerceProviderProductMappingResponse,
  CommerceProviderReadinessResponse,
  CommerceProviderStatusResponse,
  CommerceProviderWebhookEventResponse,
} from "@/features/commerce-providers/provider-contracts";

type Props = {
  initialProviderKey?: CommercePaymentProviderKey;
};

const PROVIDER_TABS = ["Resumen", "Credenciales", "Mappings", "Checkouts", "Webhooks", "Readiness"];

type CredentialsForm = {
  accountId: string;
  accessKey: string;
  apiBaseUrl: string;
  enabled: boolean;
  merchantId: string;
  publicKey: string;
  secretKey: string;
  webhookPublicUrl: string;
  webhookSigningSecret: string;
  webhookUrlSecret: string;
};

type MappingForm = {
  billingMode: string;
  currency: string;
  entitlementScope: string;
  grantsTier: "blueprint" | "blueprint_pro" | "acp";
  internalProductKey: string;
  internalUnitAmountCents: string;
  isActive: boolean;
  packageCode: string;
  priceStrategy: string;
  providerOfferRef: string;
  providerPaymentLinkId: string;
  providerPlanId: string;
  providerPriceId: string;
  providerProductId: string;
};

const DEFAULT_CREDENTIAL_LABELS = {
  accountId: "Account ID",
  accessKey: "Access key",
  apiBaseUrl: "API base URL",
  merchantId: "Merchant ID",
  publicKey: "Public key",
  secretKey: "Secret key",
  webhookPublicUrl: "Webhook público",
  webhookSigningSecret: "Webhook signing secret",
  webhookUrlSecret: "Webhook URL secret",
};

const PROVIDER_CREDENTIAL_LABELS: Record<string, Partial<typeof DEFAULT_CREDENTIAL_LABELS>> = {
  payu: {
    accountId: "Account ID",
    apiBaseUrl: "Payments API URL",
    merchantId: "Merchant ID",
    publicKey: "API login",
    secretKey: "API key",
    webhookPublicUrl: "Confirmation URL pública",
    webhookSigningSecret: "HMAC secret opcional",
    webhookUrlSecret: "URL secret",
  },
  mercadopago: {
    apiBaseUrl: "Mercado Pago API URL",
    publicKey: "Public key",
    secretKey: "Access token",
    webhookPublicUrl: "Webhook público",
    webhookSigningSecret: "Webhook signing secret",
    webhookUrlSecret: "URL secret",
  },
  rebill: {
    publicKey: "Public key",
    secretKey: "Secret key",
    webhookPublicUrl: "Webhook público",
    webhookSigningSecret: "Webhook signing secret",
    webhookUrlSecret: "Webhook URL secret",
  },
  rapyd: {
    accessKey: "Access key",
    apiBaseUrl: "Rapyd API URL",
    secretKey: "Secret key",
    webhookPublicUrl: "Callback URL pública",
    webhookUrlSecret: "URL secret",
  },
};

const DEFAULT_MAPPING_LABELS = {
  providerOfferRef: "Offer ref",
  providerPaymentLinkId: "Payment link ID",
  providerPlanId: "Plan ID",
  providerPriceId: "Price ID",
  providerProductId: "Product ID",
};

const PROVIDER_MAPPING_LABELS: Record<string, Partial<typeof DEFAULT_MAPPING_LABELS>> = {
  payu: {
    providerOfferRef: "Template",
    providerPaymentLinkId: "Método preseleccionado",
    providerPlanId: "País de pago",
    providerPriceId: "Métodos de pago",
    providerProductId: "Account ID override",
  },
  mercadopago: {
    providerOfferRef: "Descripción factura",
    providerPaymentLinkId: "Métodos excluidos",
    providerPlanId: "Tipos excluidos",
    providerPriceId: "Tipo predeterminado",
    providerProductId: "Category ID",
  },
  rapyd: {
    providerOfferRef: "Statement descriptor",
    providerPaymentLinkId: "Métodos excluidos",
    providerPlanId: "País de pago",
    providerPriceId: "Métodos incluidos",
    providerProductId: "Merchant eWallet",
  },
};

const emptyStatus: CommerceProviderStatusResponse = {
  api_base_url: "",
  capabilities: [],
  contract_version: "commerce-provider-status.v1",
  enabled: false,
  environment: "sandbox",
  last_health_message: "",
  last_health_status: "",
  provider_key: "rebill",
  secret_statuses: [],
  status: "loading",
  updated_at: null,
  webhook_public_url: "",
  workspace_id: "",
};

function toneForStatus(status: string): "blue" | "green" | "orange" | "red" | "slate" {
  if (["connected", "configured", "created", "ok", "processed", "ready"].includes(status)) return "green";
  if (["partial_configured", "pending", "warning"].includes(status)) return "orange";
  if (["blocked", "failed", "rejected", "unresolved"].includes(status)) return "red";
  if (["received", "loading"].includes(status)) return "blue";
  return "slate";
}

function formatDate(value?: string | null) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatMinorAmount(currency: string, amountCents: number) {
  if (amountCents <= 0) {
    return "Orden LAB";
  }
  return `${currency || "USD"} ${(amountCents / 100).toLocaleString("es-CO", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;
}

export function CommerceProviderAdminPage({ initialProviderKey = "rebill" }: Props) {
  const [providers, setProviders] = useState<CommerceProviderDefinitionResponse[]>([]);
  const [providerKey, setProviderKey] = useState<CommercePaymentProviderKey>(initialProviderKey);
  const [environment, setEnvironment] = useState<CommerceProviderEnvironment>("sandbox");
  const [activeTab, setActiveTab] = useState(PROVIDER_TABS[0]);
  const [status, setStatus] = useState<CommerceProviderStatusResponse>(emptyStatus);
  const [readiness, setReadiness] = useState<CommerceProviderReadinessResponse | null>(null);
  const [mappings, setMappings] = useState<CommerceProviderProductMappingResponse[]>([]);
  const [checkouts, setCheckouts] = useState<CommerceProviderCheckoutRecordResponse[]>([]);
  const [webhooks, setWebhooks] = useState<CommerceProviderWebhookEventResponse[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingCredentials, setSavingCredentials] = useState(false);
  const [savingMapping, setSavingMapping] = useState(false);

  const [credentialsForm, setCredentialsForm] = useState({
    accountId: "",
    accessKey: "",
    apiBaseUrl: "",
    enabled: true,
    merchantId: "",
    publicKey: "",
    secretKey: "",
    webhookPublicUrl: "",
    webhookSigningSecret: "",
    webhookUrlSecret: "",
  });
  const [mappingForm, setMappingForm] = useState<MappingForm>({
    billingMode: "one_time",
    currency: "USD",
    entitlementScope: "project",
    grantsTier: "blueprint_pro",
    internalProductKey: "blueprint_pro",
    internalUnitAmountCents: "",
    isActive: true,
    packageCode: "",
    priceStrategy: "provider_authoritative",
    providerOfferRef: "",
    providerPaymentLinkId: "",
    providerPlanId: "",
    providerPriceId: "",
    providerProductId: "",
  });

  const selectedProvider = useMemo(
    () => providers.find((provider) => provider.provider_key === providerKey),
    [providerKey, providers],
  );

  const loadProviderState = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const [providerList, statusPayload, readinessPayload, mappingPayload, checkoutPayload, webhookPayload] = await Promise.all([
        commerceProviderAdminApi.listProviders(),
        commerceProviderAdminApi.getStatus(providerKey, environment),
        commerceProviderAdminApi.getReadiness(providerKey, environment),
        commerceProviderAdminApi.listMappings(providerKey, environment),
        commerceProviderAdminApi.listCheckouts(providerKey, environment),
        commerceProviderAdminApi.listWebhookEvents(providerKey, environment),
      ]);
      setProviders(providerList);
      setStatus(statusPayload);
      setReadiness(readinessPayload);
      setMappings(mappingPayload);
      setCheckouts(checkoutPayload);
      setWebhooks(webhookPayload);
      setCredentialsForm((current) => ({
        ...current,
        apiBaseUrl: statusPayload.api_base_url,
        enabled: statusPayload.enabled,
        webhookPublicUrl: statusPayload.webhook_public_url,
      }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo cargar la consola de pasarelas.");
    } finally {
      setLoading(false);
    }
  }, [environment, providerKey]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- La consola debe cargar el estado remoto inicial al montar y al cambiar provider/ambiente.
    void loadProviderState();
  }, [loadProviderState]);

  async function handleSaveCredentials() {
    setSavingCredentials(true);
    setMessage("");
    const secrets: Record<string, string> = {};
    if (credentialsForm.accessKey.trim()) secrets.access_key = credentialsForm.accessKey.trim();
    if (credentialsForm.secretKey.trim()) secrets.secret_key = credentialsForm.secretKey.trim();
    if (providerKey !== "rapyd" && credentialsForm.publicKey.trim()) secrets.public_key = credentialsForm.publicKey.trim();
    if (credentialsForm.merchantId.trim()) secrets.merchant_id = credentialsForm.merchantId.trim();
    if (credentialsForm.accountId.trim()) secrets.account_id = credentialsForm.accountId.trim();
    if (providerKey !== "rapyd" && credentialsForm.webhookSigningSecret.trim()) {
      secrets.webhook_signing_secret = credentialsForm.webhookSigningSecret.trim();
    }
    if (credentialsForm.webhookUrlSecret.trim()) secrets.webhook_url_secret = credentialsForm.webhookUrlSecret.trim();
    try {
      const response = await commerceProviderAdminApi.upsertCredentials(providerKey, {
        api_base_url: credentialsForm.apiBaseUrl,
        enabled: credentialsForm.enabled,
        environment,
        secrets,
        webhook_public_url: credentialsForm.webhookPublicUrl,
      });
      setStatus(response);
      setMessage("Credenciales actualizadas.");
      setCredentialsForm((current) => ({
        ...current,
        accountId: "",
        accessKey: "",
        merchantId: "",
        publicKey: "",
        secretKey: "",
        webhookSigningSecret: "",
        webhookUrlSecret: "",
      }));
      await loadProviderState();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudieron guardar las credenciales.");
    } finally {
      setSavingCredentials(false);
    }
  }

  async function handleSaveMapping() {
    setSavingMapping(true);
    setMessage("");
    try {
      await commerceProviderAdminApi.upsertMapping(providerKey, {
        billing_mode: mappingForm.billingMode as "one_time" | "subscription",
        currency: mappingForm.currency,
        entitlement_scope: mappingForm.entitlementScope,
        environment,
        grants_tier: mappingForm.grantsTier,
        internal_product_key: mappingForm.internalProductKey,
        internal_unit_amount_usd_cents: Number.parseInt(mappingForm.internalUnitAmountCents.replace(/\D/g, ""), 10) || 0,
        is_active: mappingForm.isActive,
        package_code: mappingForm.packageCode,
        price_strategy: mappingForm.priceStrategy,
        provider_offer_ref: mappingForm.providerOfferRef,
        provider_payment_link_id: mappingForm.providerPaymentLinkId,
        provider_plan_id: mappingForm.providerPlanId,
        provider_price_id: mappingForm.providerPriceId,
        provider_product_id: mappingForm.providerProductId,
      });
      setMessage("Mapping guardado.");
      await loadProviderState();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo guardar el mapping.");
    } finally {
      setSavingMapping(false);
    }
  }

  async function handleTestConnection() {
    setLoading(true);
    setMessage("");
    try {
      const response = await commerceProviderAdminApi.testConnection(providerKey, environment);
      setMessage(response.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo probar la conexión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--surface-base)] px-4 py-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <Panel className="border-[var(--border-default)] bg-white p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Badge tone="blue">Commerce</Badge>
              <h1 className="mt-2 text-[28px] font-semibold text-[var(--text-primary)]">Pasarelas</h1>
              <p className="mt-1 text-[14px] text-[var(--text-secondary)]">
                {selectedProvider?.display_name ?? providerKey} · {environment}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                className="h-11 rounded-[8px] border border-[var(--border-default)] bg-white px-3 text-[14px]"
                value={providerKey}
                onChange={(event) => setProviderKey(event.target.value as CommercePaymentProviderKey)}
              >
                {providers.length ? (
                  providers.map((provider) => (
                    <option key={provider.provider_key} value={provider.provider_key}>
                      {provider.display_name}
                    </option>
                  ))
                ) : (
                  <option value={providerKey}>{providerKey}</option>
                )}
              </select>
              <select
                className="h-11 rounded-[8px] border border-[var(--border-default)] bg-white px-3 text-[14px]"
                value={environment}
                onChange={(event) => setEnvironment(event.target.value as CommerceProviderEnvironment)}
              >
                <option value="sandbox">Sandbox</option>
                <option value="production">Producción</option>
              </select>
              <AppButton icon={<RefreshCcw className="h-4 w-4" />} loading={loading} onClick={() => void loadProviderState()}>
                Actualizar
              </AppButton>
            </div>
          </div>
        </Panel>

        {message ? (
          <Panel className="border-[var(--border-default)] bg-white px-4 py-3">
            <p className="text-[13px] text-[var(--text-secondary)]">{message}</p>
          </Panel>
        ) : null}

        <Panel className="border-[var(--border-default)] bg-white p-5">
          <TabList tabs={PROVIDER_TABS} active={activeTab} onChange={setActiveTab} />
          <div className="pt-5">
            {activeTab === "Resumen" ? (
              <ProviderOverview status={status} readiness={readiness} />
            ) : null}
            {activeTab === "Credenciales" ? (
              <CredentialsPanel
                form={credentialsForm}
                providerKey={providerKey}
                saving={savingCredentials}
                status={status}
                updateForm={setCredentialsForm}
                onSave={() => void handleSaveCredentials()}
                onTest={() => void handleTestConnection()}
              />
            ) : null}
            {activeTab === "Mappings" ? (
              <MappingsPanel
                form={mappingForm}
                mappings={mappings}
                providerKey={providerKey}
                saving={savingMapping}
                updateForm={setMappingForm}
                onSave={() => void handleSaveMapping()}
              />
            ) : null}
            {activeTab === "Checkouts" ? <CheckoutsPanel checkouts={checkouts} /> : null}
            {activeTab === "Webhooks" ? <WebhooksPanel webhooks={webhooks} /> : null}
            {activeTab === "Readiness" ? <ReadinessPanel readiness={readiness} /> : null}
          </div>
        </Panel>
      </div>
    </main>
  );
}

function ProviderOverview({
  readiness,
  status,
}: {
  readiness: CommerceProviderReadinessResponse | null;
  status: CommerceProviderStatusResponse;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-4">
      <Metric label="Estado" value={status.status} tone={toneForStatus(status.status)} />
      <Metric label="Activo" value={status.enabled ? "Sí" : "No"} tone={status.enabled ? "green" : "red"} />
      <Metric label="Readiness" value={readiness?.status ?? "sin check"} tone={readiness?.ready ? "green" : "red"} />
      <Metric label="Secrets" value={String(status.secret_statuses.filter((item) => item.configured).length)} tone="blue" />
      <KeyValue className="lg:col-span-2" label="API base" value={status.api_base_url || "No configurada"} />
      <KeyValue className="lg:col-span-2" label="Webhook" value={status.webhook_public_url || "No configurado"} />
      <div className="lg:col-span-4 flex flex-wrap gap-2">
        {status.capabilities.map((capability) => (
          <Badge key={capability} tone="slate">
            {capability}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function CredentialsPanel({
  form,
  onSave,
  onTest,
  providerKey,
  saving,
  status,
  updateForm,
}: {
  form: CredentialsForm;
  onSave: () => void;
  onTest: () => void;
  providerKey: CommercePaymentProviderKey;
  saving: boolean;
  status: CommerceProviderStatusResponse;
  updateForm: (value: typeof form | ((current: typeof form) => typeof form)) => void;
}) {
  const labels = credentialLabelsForProvider(providerKey);
  const isPayUProvider = providerKey === "payu";
  const isRapydProvider = providerKey === "rapyd";
  return (
    <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-[13px] font-medium text-[var(--text-primary)] sm:col-span-2">
          <input
            checked={form.enabled}
            onChange={(event) => updateForm((current) => ({ ...current, enabled: event.target.checked }))}
            type="checkbox"
          />
          Provider activo
        </label>
        <TextInput label={labels.apiBaseUrl} value={form.apiBaseUrl} onChange={(apiBaseUrl) => updateForm((current) => ({ ...current, apiBaseUrl }))} />
        <TextInput
          label={labels.webhookPublicUrl}
          value={form.webhookPublicUrl}
          onChange={(webhookPublicUrl) => updateForm((current) => ({ ...current, webhookPublicUrl }))}
        />
        {isRapydProvider ? (
          <TextInput label={labels.accessKey} type="password" value={form.accessKey} onChange={(accessKey) => updateForm((current) => ({ ...current, accessKey }))} />
        ) : null}
        <TextInput label={labels.secretKey} type="password" value={form.secretKey} onChange={(secretKey) => updateForm((current) => ({ ...current, secretKey }))} />
        {!isRapydProvider ? (
          <TextInput label={labels.publicKey} type="password" value={form.publicKey} onChange={(publicKey) => updateForm((current) => ({ ...current, publicKey }))} />
        ) : null}
        {isPayUProvider ? (
          <>
            <TextInput label={labels.merchantId} type="password" value={form.merchantId} onChange={(merchantId) => updateForm((current) => ({ ...current, merchantId }))} />
            <TextInput label={labels.accountId} type="password" value={form.accountId} onChange={(accountId) => updateForm((current) => ({ ...current, accountId }))} />
          </>
        ) : null}
        {!isRapydProvider ? (
          <TextInput
            label={labels.webhookSigningSecret}
            type="password"
            value={form.webhookSigningSecret}
            onChange={(webhookSigningSecret) => updateForm((current) => ({ ...current, webhookSigningSecret }))}
          />
        ) : null}
        <TextInput
          label={labels.webhookUrlSecret}
          type="password"
          value={form.webhookUrlSecret}
          onChange={(webhookUrlSecret) => updateForm((current) => ({ ...current, webhookUrlSecret }))}
        />
        <div className="flex flex-wrap gap-3 sm:col-span-2">
          <AppButton icon={<Save className="h-4 w-4" />} loading={saving} onClick={onSave} variant="primary">
            Guardar
          </AppButton>
          <AppButton icon={<ShieldCheck className="h-4 w-4" />} onClick={onTest}>
            Probar conexión
          </AppButton>
        </div>
      </div>
      <div className="space-y-3">
        {status.secret_statuses.map((secret) => (
          <div key={secret.secret_kind} className="flex items-center justify-between rounded-[8px] border border-[var(--border-default)] px-3 py-2">
            <span className="text-[13px] font-medium text-[var(--text-primary)]">{secretLabelForProvider(providerKey, secret.secret_kind)}</span>
            <Badge tone={secret.configured ? "green" : "red"}>{secret.storage_mode}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

function MappingsPanel({
  form,
  mappings,
  onSave,
  providerKey,
  saving,
  updateForm,
}: {
  form: MappingForm;
  mappings: CommerceProviderProductMappingResponse[];
  onSave: () => void;
  providerKey: CommercePaymentProviderKey;
  saving: boolean;
  updateForm: (value: typeof form | ((current: typeof form) => typeof form)) => void;
}) {
  const labels = mappingLabelsForProvider(providerKey);
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <TextInput label="Producto LAB" value={form.internalProductKey} onChange={(internalProductKey) => updateForm((current) => ({ ...current, internalProductKey }))} />
        <TextInput label="Package code" value={form.packageCode} onChange={(packageCode) => updateForm((current) => ({ ...current, packageCode }))} />
        <TextInput label="Moneda" value={form.currency} onChange={(currency) => updateForm((current) => ({ ...current, currency }))} />
        <TextInput
          label="Monto checkout en centavos"
          value={form.internalUnitAmountCents}
          onChange={(internalUnitAmountCents) => updateForm((current) => ({ ...current, internalUnitAmountCents }))}
        />
        <SelectInput
          label="Modo"
          value={form.billingMode}
          options={[
            ["one_time", "One time"],
            ["subscription", "Suscripción"],
          ]}
          onChange={(billingMode) => updateForm((current) => ({ ...current, billingMode }))}
        />
        <SelectInput
          label="Tier otorgado"
          value={form.grantsTier}
          options={[
            ["blueprint", "Blueprint"],
            ["blueprint_pro", "Blueprint Pro"],
            ["acp", "ACP"],
          ]}
          onChange={(grantsTier) => updateForm((current) => ({ ...current, grantsTier: grantsTier as MappingForm["grantsTier"] }))}
        />
        <SelectInput
          label="Estrategia de precio"
          value={form.priceStrategy}
          options={[
            ["provider_authoritative", "Provider authoritative"],
            ["internal_authoritative", "Internal authoritative"],
          ]}
          onChange={(priceStrategy) => updateForm((current) => ({ ...current, priceStrategy }))}
        />
        <TextInput label="Scope entitlement" value={form.entitlementScope} onChange={(entitlementScope) => updateForm((current) => ({ ...current, entitlementScope }))} />
        <label className="flex items-center gap-2 text-[13px] font-medium text-[var(--text-primary)]">
          <input
            checked={form.isActive}
            onChange={(event) => updateForm((current) => ({ ...current, isActive: event.target.checked }))}
            type="checkbox"
          />
          Mapping activo
        </label>
        <TextInput label={labels.providerProductId} value={form.providerProductId} onChange={(providerProductId) => updateForm((current) => ({ ...current, providerProductId }))} />
        <TextInput label={labels.providerPlanId} value={form.providerPlanId} onChange={(providerPlanId) => updateForm((current) => ({ ...current, providerPlanId }))} />
        <TextInput label={labels.providerPriceId} value={form.providerPriceId} onChange={(providerPriceId) => updateForm((current) => ({ ...current, providerPriceId }))} />
        <TextInput
          label={labels.providerPaymentLinkId}
          value={form.providerPaymentLinkId}
          onChange={(providerPaymentLinkId) => updateForm((current) => ({ ...current, providerPaymentLinkId }))}
        />
        <TextInput label={labels.providerOfferRef} value={form.providerOfferRef} onChange={(providerOfferRef) => updateForm((current) => ({ ...current, providerOfferRef }))} />
      </div>
      <AppButton icon={<Save className="h-4 w-4" />} loading={saving} onClick={onSave} variant="primary">
        Guardar mapping
      </AppButton>
      <DataTable
        columns={["Producto", "Paquete", "Modo", "Monto", "Provider IDs", "Estado"]}
        rows={mappings.map((mapping) => [
          mapping.internal_product_key,
          mapping.package_code || "default",
          mapping.billing_mode,
          formatMinorAmount(mapping.currency, mapping.internal_unit_amount_usd_cents),
          [mapping.provider_product_id, mapping.provider_plan_id, mapping.provider_price_id, mapping.provider_payment_link_id].filter(Boolean).join(" · ") || "sin ID",
          mapping.is_active ? "activo" : "inactivo",
        ])}
      />
    </div>
  );
}

function CheckoutsPanel({ checkouts }: { checkouts: CommerceProviderCheckoutRecordResponse[] }) {
  return (
    <DataTable
      columns={["Fecha", "Checkout", "Orden", "Total", "Estado"]}
      rows={checkouts.map((checkout) => [
        formatDate(checkout.created_at),
        checkout.checkout_ref,
        checkout.order_id,
        `${checkout.currency} ${(checkout.amount_cents / 100).toFixed(2)}`,
        checkout.status,
      ])}
    />
  );
}

function WebhooksPanel({ webhooks }: { webhooks: CommerceProviderWebhookEventResponse[] }) {
  return (
    <DataTable
      columns={["Fecha", "Evento", "Resource", "Firma", "Estado"]}
      rows={webhooks.map((webhook) => [
        formatDate(webhook.created_at),
        webhook.event_type || webhook.event_id,
        webhook.provider_resource_id || "sin resource",
        webhook.signature_validated ? "validada" : "no validada",
        webhook.processing_status,
      ])}
    />
  );
}

function ReadinessPanel({ readiness }: { readiness: CommerceProviderReadinessResponse | null }) {
  if (!readiness) {
    return <p className="text-[14px] text-[var(--text-secondary)]">Sin readiness cargado.</p>;
  }
  return (
    <div className="space-y-3">
      {readiness.checks.map((check) => (
        <div key={check.key} className="flex items-start justify-between gap-4 rounded-[8px] border border-[var(--border-default)] px-4 py-3">
          <div>
            <p className="text-[14px] font-semibold text-[var(--text-primary)]">{check.label}</p>
            <p className="text-[13px] text-[var(--text-secondary)]">{check.detail}</p>
          </div>
          <Badge tone={toneForStatus(check.status)}>{check.status}</Badge>
        </div>
      ))}
    </div>
  );
}

function credentialLabelsForProvider(providerKey: CommercePaymentProviderKey) {
  return {
    ...DEFAULT_CREDENTIAL_LABELS,
    ...(PROVIDER_CREDENTIAL_LABELS[providerKey] ?? {}),
  };
}

function mappingLabelsForProvider(providerKey: CommercePaymentProviderKey) {
  return {
    ...DEFAULT_MAPPING_LABELS,
    ...(PROVIDER_MAPPING_LABELS[providerKey] ?? {}),
  };
}

function secretLabelForProvider(providerKey: CommercePaymentProviderKey, secretKind: string) {
  const labels = credentialLabelsForProvider(providerKey);
  const lookup: Record<string, string> = {
    account_id: labels.accountId,
    access_key: labels.accessKey,
    merchant_id: labels.merchantId,
    public_key: labels.publicKey,
    secret_key: labels.secretKey,
    webhook_signing_secret: labels.webhookSigningSecret,
    webhook_url_secret: labels.webhookUrlSecret,
  };
  return lookup[secretKind] ?? secretKind;
}

function Metric({
  label,
  tone,
  value,
}: {
  label: string;
  tone: "blue" | "green" | "orange" | "red" | "slate";
  value: string;
}) {
  const badgeLabel = {
    blue: "Info",
    green: "OK",
    orange: "Atención",
    red: "Bloqueo",
    slate: "Neutro",
  }[tone];
  return (
    <div className="rounded-[8px] border border-[var(--border-default)] p-4">
      <p className="text-[12px] text-[var(--text-muted)]">{label}</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="break-all text-[18px] font-semibold text-[var(--text-primary)]">{value}</p>
        <Badge tone={tone}>{badgeLabel}</Badge>
      </div>
    </div>
  );
}

function TextInput({
  autoComplete,
  label,
  onChange,
  type = "text",
  value,
}: {
  autoComplete?: string;
  label: string;
  onChange: (value: string) => void;
  type?: string;
  value: string;
}) {
  return (
    <label className="block text-[12px] font-semibold text-[var(--text-secondary)]">
      {label}
      <input
        autoComplete={autoComplete || (type === "password" ? "new-password" : "off")}
        className="mt-1 h-10 w-full rounded-[8px] border border-[var(--border-default)] bg-white px-3 text-[14px] text-[var(--text-primary)] outline-none"
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        type={type}
        value={value}
      />
    </label>
  );
}

function SelectInput({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
  value: string;
}) {
  return (
    <label className="block text-[12px] font-semibold text-[var(--text-secondary)]">
      {label}
      <select
        className="mt-1 h-10 w-full rounded-[8px] border border-[var(--border-default)] bg-white px-3 text-[14px] text-[var(--text-primary)] outline-none"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map(([key, optionLabel]) => (
          <option key={key} value={key}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function DataTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  if (!rows.length) {
    return (
      <div className="rounded-[8px] border border-[var(--border-default)] px-4 py-8 text-center text-[14px] text-[var(--text-secondary)]">
        Sin registros.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-[8px] border border-[var(--border-default)]">
      <table className="min-w-full divide-y divide-[var(--border-subtle)] text-left text-[13px]">
        <thead className="bg-[var(--surface-subtle)]">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-4 py-3 font-semibold text-[var(--text-secondary)]">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-subtle)] bg-white">
          {rows.map((row) => (
            <tr key={row.join(":")} className="align-top">
              {row.map((cell, index) => (
                <td key={`${row.join(":")}-${index}`} className={cn("max-w-[340px] break-words px-4 py-3 text-[var(--text-primary)]", index === row.length - 1 && "font-medium")}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
