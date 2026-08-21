"use client";

import { Component, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  FolderKanban,
  Link2,
  Percent,
  RefreshCcw,
  Save,
  ShieldCheck,
  TestTube2,
  Trash2,
} from "lucide-react";
import {
  AppButton,
  Badge,
  Checklist,
  KeyValue,
  Panel,
  SelectField,
  SimpleTable,
  StatRow,
  TabList,
  TextField,
} from "@/components/lean/ui";
import type { AuthUser, WorkspaceRole } from "@/core/auth/types";
import { useAuth } from "@/core/auth/auth-context";
import { OperationsModuleShell } from "@/features/operations/operations-module-shell";
import { formatDateTime, getStatusTone } from "@/features/operations/operations-adapter";
import { useOperationalSession } from "@/features/operations/use-operational-session";
import { getSessionProjectRoute } from "@/features/sessions/session-routes";
import type { ProductCatalogResponse, SessionStage } from "@/features/sessions/types";
import { EmptyState, ErrorState, LoadingState } from "@/shared/states/runtime-states";
import { cn } from "@/lib/utils";
import { hotmartAdminApi, type HotmartAdminApi } from "@/features/hotmart/hotmart-api";
import type {
  HotmartClubModuleResponse,
  HotmartClubOverviewResponse,
  HotmartClubPageResponse,
  HotmartClubProgressResponse,
  HotmartClubStudentResponse,
  HotmartDashboardData,
  HotmartEnvironment,
  HotmartIntegrationStatusResponse,
  HotmartPaymentLinkResponse,
  HotmartPromotionMetricsResponse,
  HotmartPromotionResponse,
  HotmartProductMappingResponse,
  HotmartReconciliationIssueResponse,
  HotmartSyncResource,
  HotmartSyncRunResponse,
  HotmartTestConnectionResponse,
} from "@/features/hotmart/hotmart-contracts";

type AsyncState<TData> =
  | { data: null; error: null; status: "idle" | "loading" }
  | { data: TData; error: null; status: "ready" }
  | { data: null; error: string; status: "error" };

type FeedbackState = {
  message: string;
  tone: "error" | "info" | "success";
};

type HotmartAdminSession = {
  current_stage: SessionStage;
  id: string;
  title: string;
  updated_at: string;
};

type CredentialDraft = {
  api_base_url: string;
  auth_base_url: string;
  basic_token: string;
  client_id: string;
  client_secret: string;
  enabled: boolean;
  hottok: string;
  webhook_public_url: string;
};

type MappingDraft = {
  billing_mode: string;
  currency: string;
  entitlement_scope: string;
  grants_tier: "blueprint_pro" | "acp";
  hotmart_price_strategy: string;
  hotmart_product_id: string;
  hotmart_product_ucode: string;
  internal_product_key: string;
  is_active: boolean;
  offer_code: string;
  plan_code: string;
  trm_policy: string;
};

type LinkDraft = {
  callback_url: string;
  force_new: boolean;
  link_name: string;
  product_key: string;
};

type PromotionDraft = {
  affiliate_id: string;
  coupon_code: string;
  discount_percent: string;
  ends_at: string;
  internal_campaign_key: string;
  internal_product_key: string;
  offer_codes: string;
  publish: boolean;
  starts_at: string;
};

type SyncDraft = {
  force_reset: boolean;
  max_results: string;
  page_token: string;
  product_id: string;
  resource: HotmartSyncResource;
};

type ClubDraft = {
  is_extra: "all" | "false" | "true";
  module_id: string;
  subdomain: string;
  sync_modules: boolean;
  sync_pages: boolean;
  sync_progress: boolean;
  sync_students: boolean;
  user_id: string;
};

type ResolutionDraft = {
  resolution_action: string;
  resolution_note: string;
};

const WORKSPACE_HOTMART_ADMIN_ROLES = new Set<WorkspaceRole>(["owner", "admin"]);
const HOTMART_TABS = [
  "Resumen",
  "Credenciales",
  "Productos y ofertas",
  "Links de pago",
  "Promociones",
  "Sincronizacion",
  "Comunidad",
  "Reconciliacion",
  "Auditoria",
];

function createIdleState<TData>(): AsyncState<TData> {
  return {
    data: null,
    error: null,
    status: "idle",
  };
}

function createCredentialDraft(status?: HotmartIntegrationStatusResponse | null): CredentialDraft {
  return {
    api_base_url: status?.api_base_url ?? "",
    auth_base_url: status?.auth_base_url ?? "",
    basic_token: "",
    client_id: "",
    client_secret: "",
    enabled: status?.enabled ?? true,
    hottok: "",
    webhook_public_url: status?.webhook_public_url ?? "",
  };
}

function createMappingDraft(productKey = "blueprint_pro"): MappingDraft {
  return {
    billing_mode: "one_time",
    currency: "USD",
    entitlement_scope: "project",
    grants_tier: productKey === "acp" ? "acp" : "blueprint_pro",
    hotmart_price_strategy: "net_order_amount",
    hotmart_product_id: "",
    hotmart_product_ucode: "",
    internal_product_key: productKey,
    is_active: true,
    offer_code: "",
    plan_code: "",
    trm_policy: "internal_usd",
  };
}

function createLinkDraft(productKey = "blueprint_pro"): LinkDraft {
  return {
    callback_url: "",
    force_new: false,
    link_name: "",
    product_key: productKey,
  };
}

function createPromotionDraft(productKey = "blueprint_pro", offerCode = ""): PromotionDraft {
  return {
    affiliate_id: "",
    coupon_code: "",
    discount_percent: "10",
    ends_at: "",
    internal_campaign_key: "",
    internal_product_key: productKey,
    offer_codes: offerCode,
    publish: true,
    starts_at: "",
  };
}

function createSyncDraft(): SyncDraft {
  return {
    force_reset: false,
    max_results: "50",
    page_token: "",
    product_id: "",
    resource: "products",
  };
}

function createClubDraft(subdomain = ""): ClubDraft {
  return {
    is_extra: "all",
    module_id: "",
    subdomain,
    sync_modules: true,
    sync_pages: true,
    sync_progress: false,
    sync_students: true,
    user_id: "",
  };
}

function createResolutionDraft(): ResolutionDraft {
  return {
    resolution_action: "manual_resolution",
    resolution_note: "",
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getFeedbackClass(tone: FeedbackState["tone"]) {
  if (tone === "success") {
    return "text-[var(--success)]";
  }
  if (tone === "error") {
    return "text-[var(--danger)]";
  }
  return "text-[var(--text-secondary)]";
}

function getActiveWorkspaceRole(user: AuthUser | null): WorkspaceRole | null {
  const activeWorkspaceId = user?.active_workspace_id ?? null;
  return user?.workspaces.find((workspace) => workspace.workspace_id === activeWorkspaceId)?.role ?? null;
}

function canManageHotmart(user: AuthUser | null) {
  const role = getActiveWorkspaceRole(user);
  return role ? WORKSPACE_HOTMART_ADMIN_ROLES.has(role) : false;
}

function getProductOptions(products: ProductCatalogResponse[], mappings: HotmartProductMappingResponse[] = []) {
  const productKeys = new Set<string>();
  products.forEach((product) => productKeys.add(product.product_key));
  mappings.forEach((mapping) => productKeys.add(mapping.internal_product_key));

  if (productKeys.size === 0) {
    productKeys.add("blueprint_pro");
    productKeys.add("acp");
  }

  return Array.from(productKeys).map((productKey) => ({
    label: getProductLabel(products, productKey),
    value: productKey,
  }));
}

function getProductLabel(products: ProductCatalogResponse[], productKey: string) {
  return products.find((product) => product.product_key === productKey)?.name ?? productKey;
}

function getProductPriceCode(products: ProductCatalogResponse[], productKey: string) {
  return products.find((product) => product.product_key === productKey)?.price?.price_code ?? "";
}

function getConfiguredCount(status: HotmartIntegrationStatusResponse) {
  return [
    status.client_id_configured,
    status.client_secret_configured,
    status.basic_token_configured,
    status.hottok_configured,
  ].filter(Boolean).length;
}

function formatMoney(cents: number, currency: string) {
  const normalizedCurrency = currency?.trim() || "USD";
  try {
    return new Intl.NumberFormat("es-CO", {
      currency: normalizedCurrency,
      maximumFractionDigits: 2,
      style: "currency",
    }).format(cents / 100);
  } catch {
    return `${normalizedCurrency} ${(cents / 100).toFixed(2)}`;
  }
}

function normalizeBooleanLabel(value: boolean) {
  return value ? "Si" : "No";
}

function parseDelimitedList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeNumberInput(value: string) {
  return Number(value.replace(",", "."));
}

function isSubscriptionBillingMode(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized.includes("subscription") || normalized.includes("recurr");
}

function findActiveMappingForProduct(mappings: HotmartProductMappingResponse[], productKey: string) {
  return (
    mappings.find((mapping) => mapping.internal_product_key === productKey && mapping.is_active) ??
    mappings.find((mapping) => mapping.internal_product_key === productKey) ??
    null
  );
}

function getPromotionWindowLabel(promotion: HotmartPromotionResponse) {
  if (!promotion.starts_at && !promotion.ends_at) {
    return "Sin ventana";
  }
  return `${formatDateTime(promotion.starts_at)} -> ${formatDateTime(promotion.ends_at)}`;
}

function getSeverityTone(severity: string): "orange" | "red" | "slate" {
  const normalized = severity.toLowerCase();
  if (normalized === "critical" || normalized === "high") {
    return "red";
  }
  if (normalized === "medium") {
    return "orange";
  }
  return "slate";
}

function getClubIsExtraFilter(value: ClubDraft["is_extra"]) {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return null;
}

function getCompletedTone(completed: boolean): "green" | "orange" {
  return completed ? "green" : "orange";
}

function getReleaseTone(status: string): "green" | "orange" | "red" | "slate" {
  if (status === "ready" || status === "passed") {
    return "green";
  }
  if (status === "blocked" || status === "failed" || status === "critical") {
    return "red";
  }
  if (status === "needs_attention" || status === "warning" || status === "manual") {
    return "orange";
  }
  return "slate";
}

function upsertListItem<TItem extends { id: string }>(items: TItem[], nextItem: TItem) {
  const existingIndex = items.findIndex((item) => item.id === nextItem.id);
  if (existingIndex === -1) {
    return [nextItem, ...items];
  }
  return items.map((item, index) => (index === existingIndex ? nextItem : item));
}

class HotmartAdminErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; message: string }
> {
  state = {
    hasError: false,
    message: "",
  };

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message,
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          title="La consola Hotmart no pudo renderizarse"
          description={this.state.message || "Se detecto un error inesperado en la vista administrativa."}
        />
      );
    }
    return this.props.children;
  }
}

function HotmartAdminRestrictedState({ role }: { role: WorkspaceRole | null }) {
  return (
    <Panel className="p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <Badge tone="orange">Owner / Admin</Badge>
          <p className="text-[22px] font-semibold text-[var(--text-primary)]">Modulo Hotmart protegido</p>
          <p className="max-w-3xl text-[14px] leading-7 text-[var(--text-secondary)]">
            Esta integracion controla credenciales, links de pago, webhooks y acceso comercial del workspace. Por eso solo se muestra a
            membresias owner o admin.
          </p>
        </div>
        <KeyValue label="Rol actual" value={role ?? "Sin membresia activa"} hint="La API tambien valida permisos en backend." />
      </div>
    </Panel>
  );
}

function HotmartStatusBadge({ status }: { status: string }) {
  return <Badge tone={getStatusTone(status)}>{status || "unknown"}</Badge>;
}

function HotmartCredentialChecklist({ status }: { status: HotmartIntegrationStatusResponse }) {
  return (
    <Checklist
      items={[
        {
          detail: "Necesario para OAuth.",
          label: "Client ID",
          state: status.client_id_configured ? "done" : "alert",
        },
        {
          detail: "No se muestra despues de guardar.",
          label: "Client Secret",
          state: status.client_secret_configured ? "done" : "alert",
        },
        {
          detail: "Token Basic usado para solicitar access_token.",
          label: "Basic Token",
          state: status.basic_token_configured ? "done" : "alert",
        },
        {
          detail: "Valida webhooks entrantes.",
          label: "HOTTOK",
          state: status.hottok_configured ? "done" : "alert",
        },
      ]}
    />
  );
}

function HotmartSummaryPanel({
  data,
  lastTest,
}: {
  data: HotmartDashboardData;
  lastTest: HotmartTestConnectionResponse | null;
}) {
  const activeLinks = data.links.filter((link) => link.activation_status === "active").length;
  const activePromotions = data.promotionMetrics.active;
  const configuredCount = getConfiguredCount(data.status);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-9">
        <Panel className="p-5">
          <KeyValue label="Estado" value={<HotmartStatusBadge status={data.status.status} />} hint={data.status.environment} />
        </Panel>
        <Panel className="p-5">
          <KeyValue label="Credenciales" value={`${configuredCount}/4`} hint={`Storage: ${data.status.storage_mode}`} />
        </Panel>
        <Panel className="p-5">
          <KeyValue label="Mappings" value={String(data.mappings.length)} hint="Productos internos conectados" />
        </Panel>
        <Panel className="p-5">
          <KeyValue label="Links activos" value={String(activeLinks)} hint={`${data.links.length} links registrados`} />
        </Panel>
        <Panel className="p-5">
          <KeyValue label="Promos activas" value={String(activePromotions)} hint={`${data.promotionMetrics.total} promociones`} />
        </Panel>
        <Panel className="p-5">
          <KeyValue label="Club alumnos" value={String(data.clubOverview.students_count)} hint={`${data.clubOverview.open_issue_count} diferencias`} />
        </Panel>
        <Panel className="p-5">
          <KeyValue label="Diferencias" value={String(data.reconciliationIssues.length)} hint={`${data.syncRuns.length} sync runs`} />
        </Panel>
        <Panel className="p-5">
          <KeyValue
            label="Release"
            value={<Badge tone={getReleaseTone(data.releaseReadiness.overall_status)}>{data.releaseReadiness.overall_status}</Badge>}
            hint={data.releaseReadiness.release_candidate ? "RC aprobado" : "Revisar gate"}
          />
        </Panel>
        <Panel className="p-5">
          <KeyValue label="Ultimo health" value={formatDateTime(data.status.last_health_check_at)} hint={data.status.last_health_status || "Sin check"} />
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel className="p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-[20px] font-semibold text-[var(--text-primary)]">Preparacion operacional</p>
              <p className="text-[14px] leading-7 text-[var(--text-secondary)]">
                La consola muestra solo flags redacted; ningun secreto vuelve desde backend.
              </p>
            </div>
            <ShieldCheck className="h-6 w-6 text-[var(--brand-primary)]" />
          </div>
          <HotmartCredentialChecklist status={data.status} />
        </Panel>

        <Panel className="p-6">
          <div className="space-y-4">
            <div>
              <p className="text-[18px] font-semibold text-[var(--text-primary)]">Ultimo test de conexion</p>
              <p className="mt-1 text-[13px] leading-6 text-[var(--text-secondary)]">
                Resultado del intercambio OAuth contra Hotmart.
              </p>
            </div>
            {lastTest ? (
              <div className="space-y-3">
                <StatRow label="Reachable" value={normalizeBooleanLabel(lastTest.reachable)} tone={lastTest.reachable ? "green" : "red"} />
                <StatRow label="HTTP" value={lastTest.http_status ?? "n/a"} />
                <StatRow label="Expira en" value={lastTest.token_expires_in ? `${lastTest.token_expires_in}s` : "n/a"} />
                <p className="text-[13px] leading-6 text-[var(--text-secondary)]">{lastTest.message}</p>
              </div>
            ) : (
              <EmptyState
                className="border-0 px-0 py-2 shadow-none"
                title="Sin test ejecutado"
                description="Usa Credenciales > Probar conexion cuando existan Client ID, Secret y Basic Token."
              />
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function HotmartCredentialPanel({
  draft,
  environment,
  feedback,
  pending,
  status,
  testPending,
  onDraftChange,
  onSave,
  onTest,
}: {
  draft: CredentialDraft;
  environment: HotmartEnvironment;
  feedback: FeedbackState | null;
  pending: boolean;
  status: HotmartIntegrationStatusResponse;
  testPending: boolean;
  onDraftChange: (patch: Partial<CredentialDraft>) => void;
  onSave: () => void;
  onTest: () => void;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Panel className="p-6">
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            onSave();
          }}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <Badge tone="blue">{environment}</Badge>
              <p className="mt-2 text-[20px] font-semibold text-[var(--text-primary)]">Credenciales Hotmart</p>
              <p className="mt-1 text-[14px] leading-7 text-[var(--text-secondary)]">
                Los campos secretos quedan vacios despues de guardar. Si los dejas vacios, backend conserva los valores existentes.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <AppButton icon={<TestTube2 className="h-4 w-4" />} loading={testPending} onClick={onTest}>
                Probar conexion
              </AppButton>
              <AppButton icon={<Save className="h-4 w-4" />} loading={pending} type="submit" variant="primary">
                Guardar
              </AppButton>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              label="Integracion habilitada"
              onValueChange={(value) => onDraftChange({ enabled: value === "true" })}
              options={[
                { label: "Habilitada", value: "true" },
                { label: "Deshabilitada", value: "false" },
              ]}
              value={String(draft.enabled)}
            />
            <TextField
              label="Webhook publico"
              onValueChange={(value) => onDraftChange({ webhook_public_url: value })}
              placeholder="https://tu-dominio.com/api/v1/webhooks/hotmart"
              value={draft.webhook_public_url}
            />
            <TextField
              label="API base URL"
              onValueChange={(value) => onDraftChange({ api_base_url: value })}
              placeholder="Default por ambiente"
              value={draft.api_base_url}
            />
            <TextField
              label="Auth base URL"
              onValueChange={(value) => onDraftChange({ auth_base_url: value })}
              placeholder="https://api-sec-vlc.hotmart.com"
              value={draft.auth_base_url}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              autoComplete="off"
              label="Client ID"
              onValueChange={(value) => onDraftChange({ client_id: value })}
              placeholder={status.client_id_configured ? "Configurado - escribir solo para rotar" : "Pendiente"}
              value={draft.client_id}
            />
            <TextField
              autoComplete="off"
              label="Client Secret"
              onValueChange={(value) => onDraftChange({ client_secret: value })}
              placeholder={status.client_secret_configured ? "Configurado - escribir solo para rotar" : "Pendiente"}
              type="password"
              value={draft.client_secret}
            />
            <TextField
              autoComplete="off"
              label="Basic Token"
              onValueChange={(value) => onDraftChange({ basic_token: value })}
              placeholder={status.basic_token_configured ? "Configurado - escribir solo para rotar" : "Pendiente"}
              type="password"
              value={draft.basic_token}
            />
            <TextField
              autoComplete="off"
              label="HOTTOK"
              onValueChange={(value) => onDraftChange({ hottok: value })}
              placeholder={status.hottok_configured ? "Configurado - escribir solo para rotar" : "Pendiente para webhooks"}
              type="password"
              value={draft.hottok}
            />
          </div>

          {feedback ? (
            <p aria-live="polite" className={cn("text-[13px] font-medium", getFeedbackClass(feedback.tone))}>
              {feedback.message}
            </p>
          ) : null}
        </form>
      </Panel>

      <Panel className="p-6">
        <div className="space-y-4">
          <div>
            <p className="text-[18px] font-semibold text-[var(--text-primary)]">Estado redacted</p>
            <p className="mt-1 text-[13px] leading-6 text-[var(--text-secondary)]">
              Backend responde solamente flags de configuracion, origen de almacenamiento y salud.
            </p>
          </div>
          <HotmartCredentialChecklist status={status} />
          <div className="space-y-2 border-t border-[var(--border-subtle)] pt-4">
            <StatRow label="Status" value={<HotmartStatusBadge status={status.status} />} />
            <StatRow label="Storage" value={status.storage_mode} />
            <StatRow label="Enabled" value={normalizeBooleanLabel(status.enabled)} tone={status.enabled ? "green" : "orange"} />
          </div>
        </div>
      </Panel>
    </div>
  );
}

function HotmartMappingsPanel({
  draft,
  feedback,
  mappings,
  pending,
  products,
  onDraftChange,
  onEditMapping,
  onSave,
}: {
  draft: MappingDraft;
  feedback: FeedbackState | null;
  mappings: HotmartProductMappingResponse[];
  pending: boolean;
  products: ProductCatalogResponse[];
  onDraftChange: (patch: Partial<MappingDraft>) => void;
  onEditMapping: (mapping: HotmartProductMappingResponse) => void;
  onSave: () => void;
}) {
  const productOptions = getProductOptions(products, mappings);

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
      <Panel className="p-6">
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            onSave();
          }}
        >
          <div>
            <Badge tone="blue">Mapping</Badge>
            <p className="mt-2 text-[20px] font-semibold text-[var(--text-primary)]">Producto interno a Hotmart</p>
            <p className="mt-1 text-[14px] leading-7 text-[var(--text-secondary)]">
              Define la relacion que usara el backend para crear links y conciliar webhooks.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              label="Producto interno"
              onValueChange={(value) =>
                onDraftChange({
                  grants_tier: value === "acp" ? "acp" : "blueprint_pro",
                  internal_product_key: value,
                })
              }
              options={productOptions}
              value={draft.internal_product_key}
            />
            <SelectField
              label="Tier otorgado"
              onValueChange={(value) => onDraftChange({ grants_tier: value === "acp" ? "acp" : "blueprint_pro" })}
              options={[
                { label: "Blueprint Pro", value: "blueprint_pro" },
                { label: "ACP", value: "acp" },
              ]}
              value={draft.grants_tier}
            />
            <TextField
              label="Hotmart Product ID"
              onValueChange={(value) => onDraftChange({ hotmart_product_id: value })}
              value={draft.hotmart_product_id}
            />
            <TextField
              label="Hotmart UCODE"
              onValueChange={(value) => onDraftChange({ hotmart_product_ucode: value })}
              value={draft.hotmart_product_ucode}
            />
            <TextField label="Offer code" onValueChange={(value) => onDraftChange({ offer_code: value })} value={draft.offer_code} />
            <TextField label="Plan code" onValueChange={(value) => onDraftChange({ plan_code: value })} value={draft.plan_code} />
            <SelectField
              label="Moneda"
              onValueChange={(value) => onDraftChange({ currency: value })}
              options={[
                { label: "USD", value: "USD" },
                { label: "COP", value: "COP" },
                { label: "BRL", value: "BRL" },
                { label: "MXN", value: "MXN" },
              ]}
              value={draft.currency}
            />
            <SelectField
              label="Activo"
              onValueChange={(value) => onDraftChange({ is_active: value === "true" })}
              options={[
                { label: "Activo", value: "true" },
                { label: "Inactivo", value: "false" },
              ]}
              value={String(draft.is_active)}
            />
          </div>

          <AppButton icon={<Save className="h-4 w-4" />} loading={pending} type="submit" variant="primary">
            Guardar mapping
          </AppButton>

          {feedback ? (
            <p aria-live="polite" className={cn("text-[13px] font-medium", getFeedbackClass(feedback.tone))}>
              {feedback.message}
            </p>
          ) : null}
        </form>
      </Panel>

      <Panel className="p-6">
        <div className="mb-4 space-y-2">
          <p className="text-[20px] font-semibold text-[var(--text-primary)]">Mappings registrados</p>
          <p className="text-[14px] leading-7 text-[var(--text-secondary)]">Inventario parametrizable por ambiente.</p>
        </div>
        {mappings.length > 0 ? (
          <SimpleTable
            columns={["Producto", "Hotmart", "Oferta", "Tier", "Activo", "Accion"]}
            rows={mappings.map((mapping) => [
              mapping.internal_product_key,
              mapping.hotmart_product_id || mapping.hotmart_product_ucode || "n/a",
              mapping.offer_code || "n/a",
              mapping.grants_tier,
              <Badge key={`${mapping.id}-active`} tone={mapping.is_active ? "green" : "slate"}>
                {mapping.is_active ? "Activo" : "Inactivo"}
              </Badge>,
              <AppButton key={`${mapping.id}-edit`} className="h-10" onClick={() => onEditMapping(mapping)}>
                Editar
              </AppButton>,
            ])}
          />
        ) : (
          <EmptyState
            className="px-0 py-4"
            title="Sin mappings Hotmart"
            description="Crea al menos un mapping antes de generar links de pago para productos internos."
          />
        )}
      </Panel>
    </div>
  );
}

function HotmartPaymentLinksPanel({
  draft,
  feedback,
  links,
  mappings,
  pending,
  products,
  refreshPendingId,
  selectedSession,
  onDraftChange,
  onRefreshLink,
  onSubmit,
}: {
  draft: LinkDraft;
  feedback: FeedbackState | null;
  links: HotmartPaymentLinkResponse[];
  mappings: HotmartProductMappingResponse[];
  pending: boolean;
  products: ProductCatalogResponse[];
  refreshPendingId: string | null;
  selectedSession: HotmartAdminSession | null;
  onDraftChange: (patch: Partial<LinkDraft>) => void;
  onRefreshLink: (link: HotmartPaymentLinkResponse) => void;
  onSubmit: () => void;
}) {
  const mappedProducts = mappings.filter((mapping) => mapping.is_active);
  const productOptions = getProductOptions(
    products,
    mappedProducts.length > 0 ? mappedProducts : mappings,
  );
  const selectedPriceCode = getProductPriceCode(products, draft.product_key);

  return (
    <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Panel className="p-6">
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <div>
            <Badge tone="violet">Checkout Hotmart</Badge>
            <p className="mt-2 text-[20px] font-semibold text-[var(--text-primary)]">Generar link de pago</p>
            <p className="mt-1 text-[14px] leading-7 text-[var(--text-secondary)]">
              Crea una orden interna con provider Hotmart y luego solicita el Payment Link.
            </p>
          </div>

          <KeyValue
            label="Sesion destino"
            value={selectedSession?.title ?? "Sin sesion activa"}
            hint={selectedSession ? `ID ${selectedSession.id}` : "Crea o selecciona una sesion para asociar la orden."}
          />

          <SelectField
            label="Producto"
            onValueChange={(value) => onDraftChange({ product_key: value })}
            options={productOptions}
            value={draft.product_key}
          />
          <TextField
            label="Nombre del link"
            onValueChange={(value) => onDraftChange({ link_name: value })}
            placeholder={`Compra ${draft.product_key}`}
            value={draft.link_name}
          />
          <TextField
            label="Callback URL"
            onValueChange={(value) => onDraftChange({ callback_url: value })}
            placeholder="Opcional; usa config si se deja vacio"
            value={draft.callback_url}
          />
          <SelectField
            label="Forzar nuevo"
            onValueChange={(value) => onDraftChange({ force_new: value === "true" })}
            options={[
              { label: "No, reutilizar si existe", value: "false" },
              { label: "Si, crear otro", value: "true" },
            ]}
            value={String(draft.force_new)}
          />
          <KeyValue label="Price code interno" value={selectedPriceCode || "Default"} hint="Tomado del catalogo comercial interno." />

          <AppButton disabled={!selectedSession} loading={pending} type="submit" variant="primary">
            Crear link
          </AppButton>
          {feedback ? (
            <p aria-live="polite" className={cn("text-[13px] font-medium", getFeedbackClass(feedback.tone))}>
              {feedback.message}
            </p>
          ) : null}
        </form>
      </Panel>

      <Panel className="p-6">
        <div className="mb-4 space-y-2">
          <p className="text-[20px] font-semibold text-[var(--text-primary)]">Links generados</p>
          <p className="text-[14px] leading-7 text-[var(--text-secondary)]">
            Los links recien creados pueden quedar en pending_activation hasta que Hotmart los deje disponibles.
          </p>
        </div>
        {links.length > 0 ? (
          <SimpleTable
            columns={["Producto", "Estado", "Neto", "Provider", "Checkout", "Accion"]}
            rows={links.map((link) => [
              link.internal_product_key,
              <Badge key={`${link.id}-status`} tone={getStatusTone(link.activation_status)}>
                {link.activation_status}
              </Badge>,
              formatMoney(link.net_amount_cents, link.currency),
              link.provider_ref || link.hotmart_payment_link_id || "n/a",
              link.checkout_url ? (
                <a
                  key={`${link.id}-url`}
                  className="inline-flex items-center gap-1 text-[var(--brand-primary)]"
                  href={link.checkout_url}
                  rel="noreferrer"
                  target="_blank"
                >
                  Abrir <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                "Sin URL"
              ),
              <AppButton
                key={`${link.id}-refresh`}
                className="h-10"
                loading={refreshPendingId === link.id}
                onClick={() => onRefreshLink(link)}
              >
                Refresh
              </AppButton>,
            ])}
          />
        ) : (
          <EmptyState
            className="px-0 py-4"
            title="Sin links Hotmart"
            description="Cuando crees links, apareceran aqui con estado, monto y URL de checkout."
          />
        )}
      </Panel>
    </div>
  );
}

function HotmartPromotionMetricsGrid({ metrics }: { metrics: HotmartPromotionMetricsResponse }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <Panel className="p-4">
        <KeyValue label="Total" value={String(metrics.total)} hint="Promociones registradas" />
      </Panel>
      <Panel className="p-4">
        <KeyValue label="Activas" value={String(metrics.active)} hint="Cupones vigentes" />
      </Panel>
      <Panel className="p-4">
        <KeyValue label="Programadas" value={String(metrics.scheduled)} hint="Inicio futuro" />
      </Panel>
      <Panel className="p-4">
        <KeyValue label="Eliminadas" value={String(metrics.deleted)} hint="Marcadas deleted" />
      </Panel>
      <Panel className="p-4">
        <KeyValue label="Sync error" value={String(metrics.sync_error)} hint="Requieren revision" />
      </Panel>
      <Panel className="p-4">
        <KeyValue
          label="Origen"
          value={`${metrics.provider_coupon_count}/${metrics.internal_upgrade_credit_count}`}
          hint="Hotmart / creditos internos"
        />
      </Panel>
    </div>
  );
}

function HotmartPromotionsPanel({
  deletePendingId,
  draft,
  feedback,
  mappings,
  metrics,
  pending,
  products,
  promotions,
  onDeletePromotion,
  onDraftChange,
  onSubmit,
}: {
  deletePendingId: string | null;
  draft: PromotionDraft;
  feedback: FeedbackState | null;
  mappings: HotmartProductMappingResponse[];
  metrics: HotmartPromotionMetricsResponse;
  pending: boolean;
  products: ProductCatalogResponse[];
  promotions: HotmartPromotionResponse[];
  onDeletePromotion: (promotion: HotmartPromotionResponse) => void;
  onDraftChange: (patch: Partial<PromotionDraft>) => void;
  onSubmit: () => void;
}) {
  const activeMappings = mappings.filter((mapping) => mapping.is_active);
  const selectedMapping = findActiveMappingForProduct(mappings, draft.internal_product_key);
  const selectedIsSubscription = selectedMapping ? isSubscriptionBillingMode(selectedMapping.billing_mode) : false;
  const productOptions = getProductOptions(products, activeMappings.length > 0 ? activeMappings : mappings);

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)]">
      <Panel className="p-6">
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <Badge tone="violet">Etapa 6</Badge>
              <p className="mt-2 text-[20px] font-semibold text-[var(--text-primary)]">Crear cupón Hotmart</p>
              <p className="mt-1 text-[14px] leading-7 text-[var(--text-secondary)]">
                Publica descuentos provider_coupon y conserva separados los creditos internos de upgrade.
              </p>
            </div>
            <Percent className="h-6 w-6 shrink-0 text-[var(--brand-primary)]" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              label="Producto interno"
              onValueChange={(value) => {
                const mapping = findActiveMappingForProduct(mappings, value);
                onDraftChange({
                  internal_product_key: value,
                  offer_codes: draft.offer_codes || mapping?.offer_code || "",
                });
              }}
              options={productOptions}
              value={draft.internal_product_key}
            />
            <TextField
              label="Campaña interna"
              onValueChange={(value) => onDraftChange({ internal_campaign_key: value })}
              placeholder="black-friday-2026"
              value={draft.internal_campaign_key}
            />
            <TextField
              label="Código cupón"
              maxLength={25}
              onValueChange={(value) => onDraftChange({ coupon_code: value.toUpperCase() })}
              placeholder="BLACK10"
              required
              value={draft.coupon_code}
            />
            <TextField
              label="Descuento %"
              max="98.99"
              min="0.01"
              onValueChange={(value) => onDraftChange({ discount_percent: value })}
              step="0.01"
              type="number"
              value={draft.discount_percent}
            />
            <TextField
              hint="Separados por coma. Si se deja vacío puede aplicar a todo el producto según Hotmart."
              label="Offer IDs"
              onValueChange={(value) => onDraftChange({ offer_codes: value })}
              placeholder="111222,333444"
              value={draft.offer_codes}
            />
            <TextField
              label="Affiliate ID"
              onValueChange={(value) => onDraftChange({ affiliate_id: value })}
              placeholder="Opcional"
              value={draft.affiliate_id}
            />
            <TextField
              label="Inicio"
              onValueChange={(value) => onDraftChange({ starts_at: value })}
              type="datetime-local"
              value={draft.starts_at}
            />
            <TextField
              label="Fin"
              onValueChange={(value) => onDraftChange({ ends_at: value })}
              type="datetime-local"
              value={draft.ends_at}
            />
            <SelectField
              label="Publicación"
              onValueChange={(value) => onDraftChange({ publish: value === "true" })}
              options={[
                { label: "Publicar en Hotmart", value: "true" },
                { label: "Guardar como borrador local", value: "false" },
              ]}
              value={String(draft.publish)}
            />
            <KeyValue
              label="Mapping Hotmart"
              value={selectedMapping?.hotmart_product_id || "Sin product id"}
              hint={selectedMapping ? `billing=${selectedMapping.billing_mode}` : "Crea un mapping activo antes de publicar."}
            />
          </div>

          {selectedIsSubscription ? (
            <div className="rounded-[16px] border border-[rgba(245,158,11,0.34)] bg-[rgba(245,158,11,0.08)] px-4 py-3 text-[13px] leading-6 text-[var(--text-secondary)]">
              Hotmart no soporta crear cupones para productos de suscripción. Este flujo se bloquea antes de llamar al proveedor; usa un
              descuento interno de la plataforma o un mapping one_time.
            </div>
          ) : null}

          <AppButton disabled={selectedIsSubscription || !selectedMapping} loading={pending} type="submit" variant="primary">
            Publicar cupón
          </AppButton>

          {feedback ? (
            <p aria-live="polite" className={cn("text-[13px] font-medium", getFeedbackClass(feedback.tone))}>
              {feedback.message}
            </p>
          ) : null}
        </form>
      </Panel>

      <div className="space-y-5">
        <HotmartPromotionMetricsGrid metrics={metrics} />

        <Panel className="p-6">
          <div className="mb-4 space-y-2">
            <p className="text-[20px] font-semibold text-[var(--text-primary)]">Promociones registradas</p>
            <p className="text-[14px] leading-7 text-[var(--text-secondary)]">
              El listado refleja el estado local sincronizado despues de publicar o eliminar cupones en Hotmart.
            </p>
          </div>
          {promotions.length > 0 ? (
            <SimpleTable
              columns={["Cupón", "Producto", "Estado", "Descuento", "Vigencia", "Accion"]}
              rows={promotions.map((promotion) => [
                <div key={`${promotion.id}-coupon`} className="space-y-1">
                  <p className="font-semibold">{promotion.coupon_code}</p>
                  <p className="text-[12px] text-[var(--text-muted)]">{promotion.coupon_id || "Sin coupon id"}</p>
                </div>,
                getProductLabel(products, promotion.internal_product_key),
                <Badge key={`${promotion.id}-status`} tone={getStatusTone(promotion.status)}>
                  {promotion.status}
                </Badge>,
                `${promotion.discount_percent}%`,
                getPromotionWindowLabel(promotion),
                <AppButton
                  key={`${promotion.id}-delete`}
                  className="h-10"
                  disabled={promotion.status === "deleted"}
                  icon={<Trash2 className="h-4 w-4" />}
                  loading={deletePendingId === promotion.id}
                  onClick={() => onDeletePromotion(promotion)}
                >
                  Eliminar
                </AppButton>,
              ])}
            />
          ) : (
            <EmptyState
              className="px-0 py-4"
              title="Sin promociones"
              description="Crea un cupón para ver su estado, vigencia, descuento y trazabilidad de sincronización."
            />
          )}
        </Panel>
      </div>
    </div>
  );
}

function HotmartSyncPanel({
  cursors,
  draft,
  feedback,
  pending,
  runs,
  onDraftChange,
  onRunSync,
}: {
  cursors: HotmartDashboardData["syncCursors"];
  draft: SyncDraft;
  feedback: FeedbackState | null;
  pending: boolean;
  runs: HotmartSyncRunResponse[];
  onDraftChange: (patch: Partial<SyncDraft>) => void;
  onRunSync: () => void;
}) {
  const resourceOptions: Array<{ label: string; value: HotmartSyncResource }> = [
    { label: "Productos", value: "products" },
    { label: "Ofertas", value: "offers" },
    { label: "Planes", value: "plans" },
    { label: "Ventas", value: "sales" },
    { label: "Suscripciones", value: "subscriptions" },
    { label: "Cupones", value: "coupons" },
    { label: "Payment links", value: "payment_links" },
  ];

  return (
    <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Panel className="p-6">
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            onRunSync();
          }}
        >
          <div>
            <Badge tone="blue">Etapa 7</Badge>
            <p className="mt-2 text-[20px] font-semibold text-[var(--text-primary)]">Sync manual por recurso</p>
            <p className="mt-1 text-[14px] leading-7 text-[var(--text-secondary)]">
              Ejecuta una página de sync, actualiza cursor y abre diferencias sin duplicarlas.
            </p>
          </div>
          <SelectField
            label="Recurso"
            onValueChange={(value) => onDraftChange({ resource: value as HotmartSyncResource })}
            options={resourceOptions}
            value={draft.resource}
          />
          <TextField
            label="Product ID / UCODE"
            onValueChange={(value) => onDraftChange({ product_id: value })}
            placeholder="Opcional para ofertas, planes o cupones"
            value={draft.product_id}
          />
          <TextField
            label="Page token"
            onValueChange={(value) => onDraftChange({ page_token: value })}
            placeholder="Opcional; usa cursor guardado si queda vacío"
            value={draft.page_token}
          />
          <TextField
            label="Max resultados"
            min="1"
            onValueChange={(value) => onDraftChange({ max_results: value })}
            type="number"
            value={draft.max_results}
          />
          <SelectField
            label="Cursor"
            onValueChange={(value) => onDraftChange({ force_reset: value === "true" })}
            options={[
              { label: "Continuar cursor", value: "false" },
              { label: "Reiniciar cursor", value: "true" },
            ]}
            value={String(draft.force_reset)}
          />
          <AppButton loading={pending} type="submit" variant="primary">
            Ejecutar sync
          </AppButton>
          {feedback ? (
            <p aria-live="polite" className={cn("text-[13px] font-medium", getFeedbackClass(feedback.tone))}>
              {feedback.message}
            </p>
          ) : null}
        </form>
      </Panel>

      <div className="space-y-5">
        <Panel className="p-6">
          <div className="mb-4 space-y-2">
            <p className="text-[20px] font-semibold text-[var(--text-primary)]">Últimos sync runs</p>
            <p className="text-[14px] leading-7 text-[var(--text-secondary)]">
              Cada ejecución registra cursor, conteos y cantidad de issues creados/actualizados.
            </p>
          </div>
          {runs.length > 0 ? (
            <SimpleTable
              columns={["Recurso", "Estado", "Leídos", "Issues", "Cursor", "Fecha"]}
              rows={runs.slice(0, 8).map((run) => [
                run.resource,
                <Badge key={`${run.id}-status`} tone={getStatusTone(run.status)}>
                  {run.status}
                </Badge>,
                String(run.records_read),
                `${run.records_created}/${run.records_updated}`,
                run.cursor_after || "Sin cursor",
                formatDateTime(run.finished_at ?? run.started_at),
              ])}
            />
          ) : (
            <EmptyState className="px-0 py-4" title="Sin sync runs" description="Ejecuta un recurso para iniciar la bitácora de sync." />
          )}
        </Panel>

        <Panel className="p-6">
          <div className="mb-4 space-y-2">
            <p className="text-[20px] font-semibold text-[var(--text-primary)]">Cursors</p>
            <p className="text-[14px] leading-7 text-[var(--text-secondary)]">Estado reanudable por recurso.</p>
          </div>
          {cursors.length > 0 ? (
            <SimpleTable
              columns={["Recurso", "Page token", "Última transacción", "Último éxito"]}
              rows={cursors.map((cursor) => [
                cursor.resource,
                cursor.page_token || "Inicio",
                cursor.last_transaction || "n/a",
                formatDateTime(cursor.last_success_at),
              ])}
            />
          ) : (
            <EmptyState className="px-0 py-4" title="Sin cursors" description="Los cursors aparecerán después del primer sync exitoso." />
          )}
        </Panel>
      </div>
    </div>
  );
}

function HotmartClubPanel({
  draft,
  feedback,
  modules,
  overview,
  pages,
  pending,
  progress,
  students,
  onDraftChange,
  onRunSync,
}: {
  draft: ClubDraft;
  feedback: FeedbackState | null;
  modules: HotmartClubModuleResponse[];
  overview: HotmartClubOverviewResponse;
  pages: HotmartClubPageResponse[];
  pending: boolean;
  progress: HotmartClubProgressResponse[];
  students: HotmartClubStudentResponse[];
  onDraftChange: (patch: Partial<ClubDraft>) => void;
  onRunSync: () => void;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Panel className="p-6">
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            onRunSync();
          }}
        >
          <div>
            <Badge tone="blue">Etapa 8</Badge>
            <p className="mt-2 text-[20px] font-semibold text-[var(--text-primary)]">Comunidad Hotmart Club</p>
            <p className="mt-1 text-[14px] leading-7 text-[var(--text-secondary)]">
              Sincroniza modulos, paginas, alumnos y progreso para comparar Club contra accesos internos.
            </p>
          </div>
          <TextField
            label="Subdominio Club"
            onValueChange={(value) => onDraftChange({ subdomain: value })}
            placeholder="mi-club"
            required
            value={draft.subdomain}
          />
          <TextField
            label="Module ID"
            onValueChange={(value) => onDraftChange({ module_id: value })}
            placeholder="Opcional; limita paginas a un modulo"
            value={draft.module_id}
          />
          <TextField
            label="User ID"
            onValueChange={(value) => onDraftChange({ user_id: value })}
            placeholder="Opcional; limita progreso a un alumno"
            value={draft.user_id}
          />
          <SelectField
            label="Filtro modulo extra"
            onValueChange={(value) => onDraftChange({ is_extra: value as ClubDraft["is_extra"] })}
            options={[
              { label: "Todos", value: "all" },
              { label: "Solo extras", value: "true" },
              { label: "Solo base", value: "false" },
            ]}
            value={draft.is_extra}
          />
          <div className="grid gap-3 md:grid-cols-2">
            <SelectField
              label="Modulos"
              onValueChange={(value) => onDraftChange({ sync_modules: value === "true" })}
              options={[
                { label: "Sincronizar", value: "true" },
                { label: "Omitir", value: "false" },
              ]}
              value={String(draft.sync_modules)}
            />
            <SelectField
              label="Paginas"
              onValueChange={(value) => onDraftChange({ sync_pages: value === "true" })}
              options={[
                { label: "Sincronizar", value: "true" },
                { label: "Omitir", value: "false" },
              ]}
              value={String(draft.sync_pages)}
            />
            <SelectField
              label="Alumnos"
              onValueChange={(value) => onDraftChange({ sync_students: value === "true" })}
              options={[
                { label: "Sincronizar", value: "true" },
                { label: "Omitir", value: "false" },
              ]}
              value={String(draft.sync_students)}
            />
            <SelectField
              label="Progreso"
              onValueChange={(value) => onDraftChange({ sync_progress: value === "true" })}
              options={[
                { label: "No traer progreso", value: "false" },
                { label: "Traer progreso", value: "true" },
              ]}
              value={String(draft.sync_progress)}
            />
          </div>
          <div className="rounded-[16px] border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-4 py-3 text-[13px] leading-6 text-[var(--text-secondary)]">
            Escritura en Club queda deshabilitada: esta etapa solo lee datos oficiales y abre diferencias auditables para resolverlas con
            control administrativo.
          </div>
          <AppButton loading={pending} type="submit" variant="primary">
            Sincronizar Club
          </AppButton>
          {feedback ? (
            <p aria-live="polite" className={cn("text-[13px] font-medium", getFeedbackClass(feedback.tone))}>
              {feedback.message}
            </p>
          ) : null}
        </form>
      </Panel>

      <div className="space-y-5">
        <div className="grid gap-4 xl:grid-cols-5">
          <Panel className="p-5">
            <KeyValue label="Subdominio" value={overview.subdomain || "Sin sync"} hint={overview.environment} />
          </Panel>
          <Panel className="p-5">
            <KeyValue label="Modulos" value={String(overview.modules_count)} hint={`${overview.pages_count} paginas`} />
          </Panel>
          <Panel className="p-5">
            <KeyValue label="Alumnos" value={String(overview.students_count)} hint={`${overview.progress_count} progresos`} />
          </Panel>
          <Panel className="p-5">
            <KeyValue label="Diferencias Club" value={String(overview.open_issue_count)} hint="Issues abiertos" />
          </Panel>
          <Panel className="p-5">
            <KeyValue label="Ultimo sync" value={<HotmartStatusBadge status={overview.last_sync_status} />} hint={formatDateTime(overview.last_sync_at)} />
          </Panel>
        </div>

        <Panel className="p-6">
          <div className="mb-4 space-y-2">
            <p className="text-[20px] font-semibold text-[var(--text-primary)]">Modulos y paginas</p>
            <p className="text-[14px] leading-7 text-[var(--text-secondary)]">
              Snapshot del ultimo sync exitoso para administrar cobertura de contenido.
            </p>
          </div>
          {modules.length > 0 ? (
            <SimpleTable
              columns={["Modulo", "Paginas", "Extra", "Publico"]}
              rows={modules.slice(0, 8).map((module) => [
                <div key={`${module.module_id}-module`} className="space-y-1">
                  <p className="font-semibold">{module.name || module.module_id}</p>
                  <p className="text-[12px] text-[var(--text-muted)]">{module.module_id || "Sin id"}</p>
                </div>,
                String(module.total_pages),
                normalizeBooleanLabel(module.is_extra),
                normalizeBooleanLabel(module.is_public),
              ])}
            />
          ) : (
            <EmptyState className="px-0 py-4" title="Sin modulos Club" description="Ejecuta un sync para traer el inventario de Club." />
          )}
          {pages.length > 0 ? (
            <div className="mt-5">
              <SimpleTable
                columns={["Pagina", "Modulo", "Orden", "Tipo"]}
                rows={pages.slice(0, 8).map((page) => [
                  <div key={`${page.page_id}-page`} className="space-y-1">
                    <p className="font-semibold">{page.name || page.page_id}</p>
                    <p className="text-[12px] text-[var(--text-muted)]">{page.page_id || "Sin id"}</p>
                  </div>,
                  page.module_id || "n/a",
                  String(page.page_order),
                  page.type || "n/a",
                ])}
              />
            </div>
          ) : null}
        </Panel>

        <Panel className="p-6">
          <div className="mb-4 space-y-2">
            <p className="text-[20px] font-semibold text-[var(--text-primary)]">Alumnos Club</p>
            <p className="text-[14px] leading-7 text-[var(--text-secondary)]">
              Lista usada para reconciliar accesos Hotmart Club vs entitlements internos.
            </p>
          </div>
          {students.length > 0 ? (
            <SimpleTable
              columns={["Alumno", "Estado", "Engagement", "Progreso"]}
              rows={students.slice(0, 10).map((student) => [
                <div key={`${student.user_id}-student`} className="space-y-1">
                  <p className="font-semibold">{student.name || student.email || student.user_id}</p>
                  <p className="text-[12px] text-[var(--text-muted)]">{student.email || "Sin email"}</p>
                </div>,
                <Badge key={`${student.user_id}-status`} tone={student.status.toLowerCase().includes("active") ? "green" : "slate"}>
                  {student.status || "unknown"}
                </Badge>,
                student.engagement || "n/a",
                Object.keys(student.progress).length > 0 ? "Disponible" : "Sin resumen",
              ])}
            />
          ) : (
            <EmptyState className="px-0 py-4" title="Sin alumnos Club" description="Sincroniza alumnos para detectar accesos faltantes o sobrantes." />
          )}
        </Panel>

        <Panel className="p-6">
          <div className="mb-4 space-y-2">
            <p className="text-[20px] font-semibold text-[var(--text-primary)]">Progreso</p>
            <p className="text-[14px] leading-7 text-[var(--text-secondary)]">
              Lectura opcional; puede tardar mas porque consulta lecciones por alumno.
            </p>
          </div>
          {progress.length > 0 ? (
            <SimpleTable
              columns={["Alumno", "Pagina", "Completado", "Fecha"]}
              rows={progress.slice(0, 10).map((item) => [
                item.email || item.user_id || "n/a",
                item.page_name || item.page_id || "n/a",
                <Badge key={`${item.user_id}-${item.page_id}-done`} tone={getCompletedTone(item.completed)}>
                  {item.completed ? "Completo" : "Pendiente"}
                </Badge>,
                formatDateTime(item.completed_at),
              ])}
            />
          ) : (
            <EmptyState
              className="px-0 py-4"
              title="Sin progreso sincronizado"
              description="Activa 'Traer progreso' si necesitas revisar avance por alumno."
            />
          )}
        </Panel>
      </div>
    </div>
  );
}

function HotmartReconciliationPanel({
  feedback,
  issues,
  pendingIssueId,
  resolutionDraft,
  onDraftChange,
  onResolveIssue,
}: {
  feedback: FeedbackState | null;
  issues: HotmartReconciliationIssueResponse[];
  pendingIssueId: string | null;
  resolutionDraft: ResolutionDraft;
  onDraftChange: (patch: Partial<ResolutionDraft>) => void;
  onResolveIssue: (issue: HotmartReconciliationIssueResponse) => void;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Panel className="p-6">
        <div className="space-y-5">
          <div>
            <Badge tone="orange">Cola de diferencias</Badge>
            <p className="mt-2 text-[20px] font-semibold text-[var(--text-primary)]">Resolver issues</p>
            <p className="mt-1 text-[14px] leading-7 text-[var(--text-secondary)]">
              La resolución queda auditada. Acciones automáticas profundas pasan por etapas posteriores o runbooks.
            </p>
          </div>
          <TextField
            label="Acción"
            onValueChange={(value) => onDraftChange({ resolution_action: value })}
            placeholder="linked_manually, ignored_with_reason..."
            value={resolutionDraft.resolution_action}
          />
          <TextField
            label="Nota"
            onValueChange={(value) => onDraftChange({ resolution_note: value })}
            placeholder="Motivo o evidencia de resolución"
            value={resolutionDraft.resolution_note}
          />
          {feedback ? (
            <p aria-live="polite" className={cn("text-[13px] font-medium", getFeedbackClass(feedback.tone))}>
              {feedback.message}
            </p>
          ) : null}
        </div>
      </Panel>

      <Panel className="p-6">
        <div className="mb-4 space-y-2">
          <p className="text-[20px] font-semibold text-[var(--text-primary)]">Issues abiertos</p>
          <p className="text-[14px] leading-7 text-[var(--text-secondary)]">
            Diferencias encontradas por sync, webhooks o estado local.
          </p>
        </div>
        {issues.length > 0 ? (
          <SimpleTable
            columns={["Tipo", "Severidad", "Referencias", "Resumen", "Accion"]}
            rows={issues.map((issue) => [
              issue.issue_type,
              <Badge key={`${issue.id}-severity`} tone={getSeverityTone(issue.severity)}>
                {issue.severity}
              </Badge>,
              <div key={`${issue.id}-refs`} className="space-y-1 text-[12px] text-[var(--text-secondary)]">
                <p>Provider: {issue.provider_ref || "n/a"}</p>
                <p>Interno: {issue.internal_ref || "n/a"}</p>
              </div>,
              <div key={`${issue.id}-summary`} className="space-y-1">
                <p>{issue.summary}</p>
                <p className="text-[12px] text-[var(--text-secondary)]">{issue.suggested_action}</p>
              </div>,
              <AppButton
                key={`${issue.id}-resolve`}
                className="h-10"
                loading={pendingIssueId === issue.id}
                onClick={() => onResolveIssue(issue)}
              >
                Resolver
              </AppButton>,
            ])}
          />
        ) : (
          <EmptyState
            className="px-0 py-4"
            title="Sin diferencias abiertas"
            description="Cuando sync detecte inconsistencias, aparecerán aquí para resolución manual."
          />
        )}
      </Panel>
    </div>
  );
}

function HotmartAuditPreviewPanel({ data }: { data: HotmartDashboardData }) {
  const readiness = data.releaseReadiness;
  const alerts = data.operationalAlerts.length > 0 ? data.operationalAlerts : readiness.alerts;
  const runbook = data.runbook.length > 0 ? data.runbook : readiness.runbook;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-4">
        <Panel className="p-5">
          <KeyValue
            label="Readiness"
            value={<Badge tone={getReleaseTone(readiness.overall_status)}>{readiness.overall_status}</Badge>}
            hint={readiness.release_candidate ? "Release candidate aprobado" : "Requiere atencion"}
          />
        </Panel>
        <Panel className="p-5">
          <KeyValue label="Alertas activas" value={String(alerts.length)} hint={`Generado: ${formatDateTime(readiness.generated_at)}`} />
        </Panel>
        <Panel className="p-5">
          <KeyValue label="Checklist" value={String(readiness.checklist.length)} hint={`${readiness.checklist.filter((item) => item.status === "passed").length} passed`} />
        </Panel>
        <Panel className="p-5">
          <KeyValue label="Runbook" value={String(runbook.length)} hint="Secciones operativas" />
        </Panel>
      </div>

      <Panel className="p-6">
        <div className="mb-4 space-y-2">
          <Badge tone="blue">Etapa 9</Badge>
          <p className="text-[20px] font-semibold text-[var(--text-primary)]">Release checklist</p>
          <p className="text-[14px] leading-7 text-[var(--text-secondary)]">
            Controles automatizados para validar que Hotmart puede operar como producto finalizado.
          </p>
        </div>
        <SimpleTable
          columns={["Control", "Estado", "Severidad", "Detalle"]}
          rows={readiness.checklist.map((item) => [
            <div key={`${item.key}-label`} className="space-y-1">
              <p className="font-semibold">{item.label}</p>
              <p className="text-[12px] text-[var(--text-muted)]">{item.key}</p>
            </div>,
            <Badge key={`${item.key}-status`} tone={getReleaseTone(item.status)}>
              {item.status}
            </Badge>,
            <Badge key={`${item.key}-severity`} tone={getReleaseTone(item.severity)}>
              {item.severity}
            </Badge>,
            <div key={`${item.key}-detail`} className="space-y-1">
              <p>{item.detail}</p>
              <p className="text-[12px] text-[var(--text-secondary)]">{item.evidence.join(" / ") || "Sin evidencia"}</p>
            </div>,
          ])}
        />
      </Panel>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Panel className="p-6">
          <div className="mb-4 space-y-2">
            <p className="text-[20px] font-semibold text-[var(--text-primary)]">Alertas operativas</p>
            <p className="text-[14px] leading-7 text-[var(--text-secondary)]">
              Derivadas de credenciales, health, webhooks, sync, promociones y reconciliacion.
            </p>
          </div>
          {alerts.length > 0 ? (
            <SimpleTable
              columns={["Alerta", "Severidad", "Mensaje", "Evidencia"]}
              rows={alerts.map((alert) => [
                <div key={`${alert.key}-title`} className="space-y-1">
                  <p className="font-semibold">{alert.title}</p>
                  <p className="text-[12px] text-[var(--text-muted)]">{alert.key}</p>
                </div>,
                <Badge key={`${alert.key}-severity`} tone={getReleaseTone(alert.severity)}>
                  {alert.severity}
                </Badge>,
                alert.message,
                alert.evidence.join(" / ") || "n/a",
              ])}
            />
          ) : (
            <EmptyState className="px-0 py-4" title="Sin alertas activas" description="El gate automatizado no encontro bloqueos operativos." />
          )}
        </Panel>

        <Panel className="p-6">
          <div className="mb-4 space-y-2">
            <p className="text-[20px] font-semibold text-[var(--text-primary)]">Runbook admin</p>
            <p className="text-[14px] leading-7 text-[var(--text-secondary)]">
              Guia corta para operar, pausar y recuperar la integracion.
            </p>
          </div>
          <div className="space-y-5">
            {runbook.slice(0, 6).map((section) => (
              <div key={section.key} className="rounded-[16px] border border-[var(--border-subtle)] bg-white p-4">
                <p className="font-semibold text-[var(--text-primary)]">{section.title}</p>
                <Checklist
                  className="mt-3"
                  items={section.steps.slice(0, 4).map((step) => ({
                    detail: step,
                    label: section.key,
                    state: "done",
                  }))}
                />
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

export function HotmartAdminView({
  api = hotmartAdminApi,
  embedded = false,
  listError,
  listStatus,
  onCreateSession,
  onOpenIntegrations,
  onOpenProject,
  onSessionChange,
  selectedSession,
  sessionOptions,
  sessionValue,
  user,
}: {
  api?: HotmartAdminApi;
  embedded?: boolean;
  listError?: Error | null;
  listStatus?: "error" | "idle" | "loading" | "ready";
  onCreateSession?: () => void;
  onOpenIntegrations?: () => void;
  onOpenProject?: () => void;
  onSessionChange?: (sessionId: string) => void;
  selectedSession: HotmartAdminSession | null;
  sessionOptions: Array<{ label: string; value: string }>;
  sessionValue?: string | null;
  user: AuthUser | null;
}) {
  const role = getActiveWorkspaceRole(user);
  const canManage = canManageHotmart(user);
  const [environment, setEnvironment] = useState<HotmartEnvironment>("sandbox");
  const [activeTab, setActiveTab] = useState("Resumen");
  const [dashboardState, setDashboardState] = useState<AsyncState<HotmartDashboardData>>(createIdleState);
  const [credentialDraft, setCredentialDraft] = useState<CredentialDraft>(createCredentialDraft);
  const [mappingDraft, setMappingDraft] = useState<MappingDraft>(createMappingDraft);
  const [linkDraft, setLinkDraft] = useState<LinkDraft>(createLinkDraft);
  const [promotionDraft, setPromotionDraft] = useState<PromotionDraft>(createPromotionDraft);
  const [syncDraft, setSyncDraft] = useState<SyncDraft>(createSyncDraft);
  const [clubDraft, setClubDraft] = useState<ClubDraft>(createClubDraft);
  const [resolutionDraft, setResolutionDraft] = useState<ResolutionDraft>(createResolutionDraft);
  const [credentialFeedback, setCredentialFeedback] = useState<FeedbackState | null>(null);
  const [mappingFeedback, setMappingFeedback] = useState<FeedbackState | null>(null);
  const [linkFeedback, setLinkFeedback] = useState<FeedbackState | null>(null);
  const [promotionFeedback, setPromotionFeedback] = useState<FeedbackState | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<FeedbackState | null>(null);
  const [clubFeedback, setClubFeedback] = useState<FeedbackState | null>(null);
  const [reconciliationFeedback, setReconciliationFeedback] = useState<FeedbackState | null>(null);
  const [lastTest, setLastTest] = useState<HotmartTestConnectionResponse | null>(null);
  const [credentialPending, setCredentialPending] = useState(false);
  const [mappingPending, setMappingPending] = useState(false);
  const [linkPending, setLinkPending] = useState(false);
  const [promotionPending, setPromotionPending] = useState(false);
  const [syncPending, setSyncPending] = useState(false);
  const [clubPending, setClubPending] = useState(false);
  const [testPending, setTestPending] = useState(false);
  const [refreshPendingId, setRefreshPendingId] = useState<string | null>(null);
  const [deletePromotionPendingId, setDeletePromotionPendingId] = useState<string | null>(null);
  const [resolvePendingIssueId, setResolvePendingIssueId] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!canManage) {
      return;
    }
    setDashboardState({ data: null, error: null, status: "loading" });
    try {
      const data = await api.getDashboard(environment);
      setDashboardState({ data, error: null, status: "ready" });
      setCredentialDraft(createCredentialDraft(data.status));
      const defaultProduct = data.products[0]?.product_key ?? data.mappings[0]?.internal_product_key ?? "blueprint_pro";
      setMappingDraft((current) => (current.internal_product_key ? current : createMappingDraft(defaultProduct)));
      setLinkDraft((current) => (current.product_key ? current : createLinkDraft(defaultProduct)));
      const defaultMapping = findActiveMappingForProduct(data.mappings, defaultProduct);
      setPromotionDraft((current) =>
        current.internal_product_key ? current : createPromotionDraft(defaultProduct, defaultMapping?.offer_code ?? ""),
      );
      setClubDraft((current) => (current.subdomain ? current : createClubDraft(data.clubOverview.subdomain)));
    } catch (error) {
      setDashboardState({
        data: null,
        error: getErrorMessage(error, "No se pudo cargar la integracion Hotmart."),
        status: "error",
      });
    }
  }, [api, canManage, environment]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- La consola debe sincronizar su estado inicial con el backend al cambiar ambiente o permisos.
    void loadDashboard();
  }, [loadDashboard]);

  const dashboardData = dashboardState.status === "ready" ? dashboardState.data : null;

  async function handleSaveCredentials() {
    if (!canManage) {
      return;
    }
    setCredentialPending(true);
    setCredentialFeedback(null);
    try {
      const status = await api.saveCredentials({
        ...credentialDraft,
        environment,
      });
      setDashboardState((current) =>
        current.status === "ready"
          ? {
              data: {
                ...current.data,
                status,
              },
              error: null,
              status: "ready",
            }
          : current,
      );
      setCredentialDraft(createCredentialDraft(status));
      setCredentialFeedback({ message: "Credenciales Hotmart guardadas sin exponer secretos.", tone: "success" });
    } catch (error) {
      setCredentialFeedback({
        message: getErrorMessage(error, "No se pudieron guardar las credenciales Hotmart."),
        tone: "error",
      });
    } finally {
      setCredentialPending(false);
    }
  }

  async function handleTestConnection() {
    if (!canManage) {
      return;
    }
    setTestPending(true);
    setCredentialFeedback(null);
    try {
      const result = await api.testConnection(environment);
      setLastTest(result);
      const status = await api.getStatus(environment);
      setDashboardState((current) =>
        current.status === "ready"
          ? {
              data: {
                ...current.data,
                status,
              },
              error: null,
              status: "ready",
            }
          : current,
      );
      setCredentialFeedback({
        message: result.reachable ? "Conexion Hotmart validada." : result.message,
        tone: result.reachable ? "success" : "error",
      });
    } catch (error) {
      setCredentialFeedback({
        message: getErrorMessage(error, "No se pudo probar la conexion Hotmart."),
        tone: "error",
      });
    } finally {
      setTestPending(false);
    }
  }

  async function handleSaveMapping() {
    if (!dashboardData) {
      return;
    }
    if (!mappingDraft.internal_product_key.trim()) {
      setMappingFeedback({ message: "Selecciona un producto interno.", tone: "error" });
      return;
    }
    if (!mappingDraft.hotmart_product_id.trim() && !mappingDraft.hotmart_product_ucode.trim()) {
      setMappingFeedback({ message: "Agrega Hotmart Product ID o UCODE para que el mapping sea conciliable.", tone: "error" });
      return;
    }

    setMappingPending(true);
    setMappingFeedback(null);
    try {
      const mapping = await api.upsertMapping({
        ...mappingDraft,
        environment,
      });
      setDashboardState({
        data: {
          ...dashboardData,
          mappings: upsertListItem(dashboardData.mappings, mapping),
        },
        error: null,
        status: "ready",
      });
      setMappingFeedback({ message: "Mapping Hotmart actualizado.", tone: "success" });
    } catch (error) {
      setMappingFeedback({
        message: getErrorMessage(error, "No se pudo guardar el mapping Hotmart."),
        tone: "error",
      });
    } finally {
      setMappingPending(false);
    }
  }

  async function handleCreatePaymentLink() {
    if (!dashboardData || !selectedSession) {
      setLinkFeedback({ message: "Selecciona o crea una sesion antes de generar el link.", tone: "error" });
      return;
    }

    setLinkPending(true);
    setLinkFeedback(null);
    try {
      const response = await api.createCheckoutPaymentLink({
        callbackUrl: linkDraft.callback_url,
        environment,
        linkName: linkDraft.link_name || `Compra ${getProductLabel(dashboardData.products, linkDraft.product_key)}`,
        price_code: getProductPriceCode(dashboardData.products, linkDraft.product_key),
        product_key: linkDraft.product_key,
        session_id: selectedSession.id,
      });
      setDashboardState({
        data: {
          ...dashboardData,
          links: upsertListItem(dashboardData.links, response.paymentLink),
        },
        error: null,
        status: "ready",
      });
      setLinkFeedback({
        message: response.paymentLink.checkout_url
          ? "Payment Link Hotmart creado."
          : "Payment Link registrado; pendiente de activacion por Hotmart.",
        tone: "success",
      });
    } catch (error) {
      setLinkFeedback({
        message: getErrorMessage(error, "No se pudo crear el Payment Link Hotmart."),
        tone: "error",
      });
    } finally {
      setLinkPending(false);
    }
  }

  async function handleRefreshLink(link: HotmartPaymentLinkResponse) {
    if (!dashboardData) {
      return;
    }
    setRefreshPendingId(link.id);
    setLinkFeedback(null);
    try {
      const refreshed = await api.refreshPaymentLink(link.id, environment);
      setDashboardState({
        data: {
          ...dashboardData,
          links: upsertListItem(dashboardData.links, refreshed),
        },
        error: null,
        status: "ready",
      });
      setLinkFeedback({ message: "Estado del Payment Link actualizado.", tone: "success" });
    } catch (error) {
      setLinkFeedback({
        message: getErrorMessage(error, "No se pudo refrescar el Payment Link."),
        tone: "error",
      });
    } finally {
      setRefreshPendingId(null);
    }
  }

  async function refreshPromotionSlice(baseData: HotmartDashboardData) {
    const [promotions, promotionMetrics] = await Promise.all([
      api.listPromotions(environment),
      api.getPromotionMetrics(environment),
    ]);
    setDashboardState({
      data: {
        ...baseData,
        promotionMetrics,
        promotions,
      },
      error: null,
      status: "ready",
    });
  }

  async function handleCreatePromotion() {
    if (!dashboardData) {
      return;
    }
    const couponCode = promotionDraft.coupon_code.trim().toUpperCase();
    const discountPercent = normalizeNumberInput(promotionDraft.discount_percent);
    const selectedMapping = findActiveMappingForProduct(dashboardData.mappings, promotionDraft.internal_product_key);
    if (!selectedMapping) {
      setPromotionFeedback({ message: "Crea un mapping Hotmart activo antes de publicar promociones.", tone: "error" });
      return;
    }
    if (isSubscriptionBillingMode(selectedMapping.billing_mode)) {
      setPromotionFeedback({
        message: "Hotmart no soporta cupones para productos de suscripcion; usa descuento interno o mapping one_time.",
        tone: "error",
      });
      return;
    }
    if (!couponCode) {
      setPromotionFeedback({ message: "Define un codigo de cupon.", tone: "error" });
      return;
    }
    if (!Number.isFinite(discountPercent) || discountPercent <= 0 || discountPercent >= 99) {
      setPromotionFeedback({ message: "El descuento debe ser mayor a 0 y menor a 99%.", tone: "error" });
      return;
    }

    setPromotionPending(true);
    setPromotionFeedback(null);
    try {
      const promotion = await api.createPromotion({
        affiliate_id: promotionDraft.affiliate_id,
        coupon_code: couponCode,
        discount_percent: discountPercent,
        ends_at: promotionDraft.ends_at || null,
        environment,
        internal_campaign_key: promotionDraft.internal_campaign_key,
        internal_product_key: promotionDraft.internal_product_key,
        offer_codes: parseDelimitedList(promotionDraft.offer_codes),
        publish: promotionDraft.publish,
        starts_at: promotionDraft.starts_at || null,
      });
      const promotionMetrics = await api.getPromotionMetrics(environment);
      setDashboardState({
        data: {
          ...dashboardData,
          promotionMetrics,
          promotions: upsertListItem(dashboardData.promotions, promotion),
        },
        error: null,
        status: "ready",
      });
      setPromotionDraft(createPromotionDraft(promotion.internal_product_key, selectedMapping.offer_code));
      setPromotionFeedback({
        message: promotionDraft.publish === false ? "Promocion guardada como borrador local." : "Cupon Hotmart publicado y sincronizado.",
        tone: "success",
      });
    } catch (error) {
      setPromotionFeedback({
        message: getErrorMessage(error, "No se pudo publicar el cupon Hotmart."),
        tone: "error",
      });
      try {
        await refreshPromotionSlice(dashboardData);
      } catch {
        // La accion principal ya reporto el error; el refresh es best-effort para mostrar sync_error si backend lo registro.
      }
    } finally {
      setPromotionPending(false);
    }
  }

  async function handleDeletePromotion(promotion: HotmartPromotionResponse) {
    if (!dashboardData) {
      return;
    }
    const confirmed =
      typeof window === "undefined" ||
      window.confirm(`Eliminar el cupon ${promotion.coupon_code} en Hotmart y marcarlo deleted localmente?`);
    if (!confirmed) {
      return;
    }

    setDeletePromotionPendingId(promotion.id);
    setPromotionFeedback(null);
    try {
      const result = await api.deletePromotion(promotion.id, environment);
      const promotionMetrics = await api.getPromotionMetrics(environment);
      setDashboardState({
        data: {
          ...dashboardData,
          promotionMetrics,
          promotions: dashboardData.promotions.map((item) =>
            item.id === result.id
              ? {
                  ...item,
                  coupon_code: result.coupon_code || item.coupon_code,
                  coupon_id: result.coupon_id || item.coupon_id,
                  status: result.status,
                  updated_at: new Date().toISOString(),
                }
              : item,
          ),
        },
        error: null,
        status: "ready",
      });
      setPromotionFeedback({ message: result.message || "Cupon eliminado.", tone: "success" });
    } catch (error) {
      setPromotionFeedback({
        message: getErrorMessage(error, "No se pudo eliminar el cupon Hotmart."),
        tone: "error",
      });
    } finally {
      setDeletePromotionPendingId(null);
    }
  }

  async function handleRunSync() {
    if (!dashboardData) {
      return;
    }
    const maxResults = Math.max(1, Math.min(100, Math.round(normalizeNumberInput(syncDraft.max_results) || 50)));
    setSyncPending(true);
    setSyncFeedback(null);
    try {
      const run = await api.runSync({
        environment,
        force_reset: syncDraft.force_reset,
        max_results: maxResults,
        page_token: syncDraft.page_token,
        product_id: syncDraft.product_id,
        resource: syncDraft.resource,
      });
      const [syncRuns, syncCursors, reconciliationIssues, status, releaseReadiness, operationalAlerts] = await Promise.all([
        api.listSyncRuns(environment),
        api.listSyncCursors(environment),
        api.listReconciliationIssues(environment),
        api.getStatus(environment),
        api.getReleaseReadiness(environment),
        api.listOperationalAlerts(environment),
      ]);
      setDashboardState({
        data: {
          ...dashboardData,
          operationalAlerts,
          reconciliationIssues,
          releaseReadiness,
          status,
          syncCursors,
          syncRuns: upsertListItem(syncRuns, run),
        },
        error: null,
        status: "ready",
      });
      setSyncFeedback({
        message: `Sync ${run.resource} completado: ${run.records_read} leidos, ${run.issue_count} diferencias.`,
        tone: "success",
      });
    } catch (error) {
      setSyncFeedback({
        message: getErrorMessage(error, "No se pudo ejecutar sync Hotmart."),
        tone: "error",
      });
    } finally {
      setSyncPending(false);
    }
  }

  async function refreshClubSlice(baseData: HotmartDashboardData) {
    const [clubOverview, clubModules, clubPages, clubStudents, clubProgress] = await Promise.all([
      api.getClubOverview(environment),
      api.listClubModules(environment),
      api.listClubPages(environment),
      api.listClubStudents(environment),
      api.listClubProgress(environment),
    ]);
    setDashboardState({
      data: {
        ...baseData,
        clubModules,
        clubOverview,
        clubPages,
        clubProgress,
        clubStudents,
      },
      error: null,
      status: "ready",
    });
  }

  async function handleRunClubSync() {
    if (!dashboardData) {
      return;
    }
    const subdomain = clubDraft.subdomain.trim();
    if (!subdomain) {
      setClubFeedback({ message: "Define el subdominio de Hotmart Club antes de sincronizar.", tone: "error" });
      return;
    }

    setClubPending(true);
    setClubFeedback(null);
    try {
      const run = await api.syncClub({
        environment,
        is_extra: getClubIsExtraFilter(clubDraft.is_extra),
        module_id: clubDraft.module_id,
        subdomain,
        sync_modules: clubDraft.sync_modules,
        sync_pages: clubDraft.sync_pages,
        sync_progress: clubDraft.sync_progress,
        sync_students: clubDraft.sync_students,
        user_id: clubDraft.user_id,
      });
      const [
        clubOverview,
        clubModules,
        clubPages,
        clubStudents,
        clubProgress,
        reconciliationIssues,
        syncRuns,
        syncCursors,
        status,
        releaseReadiness,
        operationalAlerts,
      ] = await Promise.all([
        api.getClubOverview(environment),
        api.listClubModules(environment),
        api.listClubPages(environment),
        api.listClubStudents(environment),
        api.listClubProgress(environment),
        api.listReconciliationIssues(environment),
        api.listSyncRuns(environment),
        api.listSyncCursors(environment),
        api.getStatus(environment),
        api.getReleaseReadiness(environment),
        api.listOperationalAlerts(environment),
      ]);
      setDashboardState({
        data: {
          ...dashboardData,
          clubModules,
          clubOverview,
          clubPages,
          clubProgress,
          clubStudents,
          operationalAlerts,
          reconciliationIssues,
          releaseReadiness,
          status,
          syncCursors,
          syncRuns: upsertListItem(syncRuns, run),
        },
        error: null,
        status: "ready",
      });
      setClubDraft((current) => ({ ...current, subdomain }));
      setClubFeedback({
        message: `Club sincronizado: ${run.records_read} registros, ${run.issue_count} diferencias.`,
        tone: "success",
      });
    } catch (error) {
      setClubFeedback({
        message: getErrorMessage(error, "No se pudo sincronizar Hotmart Club."),
        tone: "error",
      });
      try {
        await refreshClubSlice(dashboardData);
      } catch {
        // La accion principal ya reporto el error; refrescar Club es best-effort.
      }
    } finally {
      setClubPending(false);
    }
  }

  async function handleResolveIssue(issue: HotmartReconciliationIssueResponse) {
    if (!dashboardData) {
      return;
    }
    setResolvePendingIssueId(issue.id);
    setReconciliationFeedback(null);
    try {
      const resolved = await api.resolveReconciliationIssue(issue.id, {
        resolution_action: resolutionDraft.resolution_action || "manual_resolution",
        resolution_note: resolutionDraft.resolution_note,
        status: "resolved",
      });
      setDashboardState({
        data: {
          ...dashboardData,
          reconciliationIssues: dashboardData.reconciliationIssues.filter((item) => item.id !== resolved.id),
        },
        error: null,
        status: "ready",
      });
      setResolutionDraft(createResolutionDraft());
      setReconciliationFeedback({ message: "Diferencia resuelta y auditada.", tone: "success" });
    } catch (error) {
      setReconciliationFeedback({
        message: getErrorMessage(error, "No se pudo resolver la diferencia."),
        tone: "error",
      });
    } finally {
      setResolvePendingIssueId(null);
    }
  }

  function handleEditMapping(mapping: HotmartProductMappingResponse) {
    setActiveTab("Productos y ofertas");
    setMappingDraft({
      billing_mode: mapping.billing_mode,
      currency: mapping.currency,
      entitlement_scope: mapping.entitlement_scope,
      grants_tier: mapping.grants_tier === "acp" ? "acp" : "blueprint_pro",
      hotmart_price_strategy: mapping.hotmart_price_strategy,
      hotmart_product_id: mapping.hotmart_product_id,
      hotmart_product_ucode: mapping.hotmart_product_ucode,
      internal_product_key: mapping.internal_product_key,
      is_active: mapping.is_active,
      offer_code: mapping.offer_code,
      plan_code: mapping.plan_code,
      trm_policy: mapping.trm_policy,
    });
  }

  const shellActions = (
    <>
      <SelectField
        className="min-w-[180px]"
        label="Ambiente"
        onValueChange={(value) => setEnvironment(value === "production" ? "production" : "sandbox")}
        options={[
          { label: "Sandbox", value: "sandbox" },
          { label: "Production", value: "production" },
        ]}
        value={environment}
      />
      <AppButton icon={<RefreshCcw className="h-4 w-4" />} loading={dashboardState.status === "loading"} onClick={() => void loadDashboard()}>
        Refrescar
      </AppButton>
      {selectedSession ? (
        <AppButton icon={<FolderKanban className="h-4 w-4" />} onClick={onOpenProject}>
          Proyecto
        </AppButton>
      ) : null}
    </>
  );

  const content = (
      <HotmartAdminErrorBoundary>
        {!canManage ? <HotmartAdminRestrictedState role={role} /> : null}

        {canManage && listStatus === "loading" && sessionOptions.length === 0 ? (
          <LoadingState title="Cargando contexto operativo" description="Recuperando sesiones para asociar links de pago." />
        ) : null}

        {canManage && listStatus === "error" && sessionOptions.length === 0 ? (
          <ErrorState
            title="No se pudieron cargar las sesiones"
            description={listError?.message ?? "Hotmart se puede configurar, pero no hay contexto para generar links por proyecto."}
            action={
              <AppButton onClick={onCreateSession} variant="primary">
                Crear sesion
              </AppButton>
            }
          />
        ) : null}

        {canManage && dashboardState.status === "loading" ? (
          <LoadingState title="Cargando Hotmart" description="Consultando status, mappings, catalogo interno y payment links." />
        ) : null}

        {canManage && dashboardState.status === "error" ? (
          <ErrorState
            title="No se pudo abrir Hotmart"
            description={dashboardState.error}
            action={
              <AppButton onClick={() => void loadDashboard()} variant="primary">
                Reintentar
              </AppButton>
            }
          />
        ) : null}

        {dashboardData ? (
          <div className="space-y-5">
            <Panel className="p-5">
              <TabList active={activeTab} onChange={setActiveTab} tabs={HOTMART_TABS} />
            </Panel>

            {activeTab === "Resumen" ? <HotmartSummaryPanel data={dashboardData} lastTest={lastTest} /> : null}

            {activeTab === "Credenciales" ? (
              <HotmartCredentialPanel
                draft={credentialDraft}
                environment={environment}
                feedback={credentialFeedback}
                onDraftChange={(patch) => setCredentialDraft((current) => ({ ...current, ...patch }))}
                onSave={() => void handleSaveCredentials()}
                onTest={() => void handleTestConnection()}
                pending={credentialPending}
                status={dashboardData.status}
                testPending={testPending}
              />
            ) : null}

            {activeTab === "Productos y ofertas" ? (
              <HotmartMappingsPanel
                draft={mappingDraft}
                feedback={mappingFeedback}
                mappings={dashboardData.mappings}
                onDraftChange={(patch) => setMappingDraft((current) => ({ ...current, ...patch }))}
                onEditMapping={handleEditMapping}
                onSave={() => void handleSaveMapping()}
                pending={mappingPending}
                products={dashboardData.products}
              />
            ) : null}

            {activeTab === "Links de pago" ? (
              <HotmartPaymentLinksPanel
                draft={linkDraft}
                feedback={linkFeedback}
                links={dashboardData.links}
                mappings={dashboardData.mappings}
                onDraftChange={(patch) => setLinkDraft((current) => ({ ...current, ...patch }))}
                onRefreshLink={(link) => void handleRefreshLink(link)}
                onSubmit={() => void handleCreatePaymentLink()}
                pending={linkPending}
                products={dashboardData.products}
                refreshPendingId={refreshPendingId}
                selectedSession={selectedSession}
              />
            ) : null}

            {activeTab === "Promociones" ? (
              <HotmartPromotionsPanel
                deletePendingId={deletePromotionPendingId}
                draft={promotionDraft}
                feedback={promotionFeedback}
                mappings={dashboardData.mappings}
                metrics={dashboardData.promotionMetrics}
                onDeletePromotion={(promotion) => void handleDeletePromotion(promotion)}
                onDraftChange={(patch) => setPromotionDraft((current) => ({ ...current, ...patch }))}
                onSubmit={() => void handleCreatePromotion()}
                pending={promotionPending}
                products={dashboardData.products}
                promotions={dashboardData.promotions}
              />
            ) : null}

            {activeTab === "Sincronizacion" ? (
              <HotmartSyncPanel
                cursors={dashboardData.syncCursors}
                draft={syncDraft}
                feedback={syncFeedback}
                onDraftChange={(patch) => setSyncDraft((current) => ({ ...current, ...patch }))}
                onRunSync={() => void handleRunSync()}
                pending={syncPending}
                runs={dashboardData.syncRuns}
              />
            ) : null}

            {activeTab === "Comunidad" ? (
              <HotmartClubPanel
                draft={clubDraft}
                feedback={clubFeedback}
                modules={dashboardData.clubModules}
                onDraftChange={(patch) => setClubDraft((current) => ({ ...current, ...patch }))}
                onRunSync={() => void handleRunClubSync()}
                overview={dashboardData.clubOverview}
                pages={dashboardData.clubPages}
                pending={clubPending}
                progress={dashboardData.clubProgress}
                students={dashboardData.clubStudents}
              />
            ) : null}

            {activeTab === "Reconciliacion" ? (
              <HotmartReconciliationPanel
                feedback={reconciliationFeedback}
                issues={dashboardData.reconciliationIssues}
                onDraftChange={(patch) => setResolutionDraft((current) => ({ ...current, ...patch }))}
                onResolveIssue={(issue) => void handleResolveIssue(issue)}
                pendingIssueId={resolvePendingIssueId}
                resolutionDraft={resolutionDraft}
              />
            ) : null}

            {activeTab === "Auditoria" ? <HotmartAuditPreviewPanel data={dashboardData} /> : null}

            <Panel className="p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <p className="text-[16px] font-semibold text-[var(--text-primary)]">Accesos rapidos</p>
                  <p className="text-[13px] leading-6 text-[var(--text-secondary)]">
                    Mantiene la consola dentro del segmento administrador; usuarios generales no ven estos controles.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <AppButton icon={<Link2 className="h-4 w-4" />} onClick={onOpenIntegrations}>
                    Settings
                  </AppButton>
                  {!selectedSession ? (
                    <AppButton onClick={onCreateSession} variant="primary">
                      Crear sesion
                    </AppButton>
                  ) : null}
                </div>
              </div>
            </Panel>
          </div>
        ) : null}
      </HotmartAdminErrorBoundary>
  );

  if (embedded) {
    return (
      <div className="space-y-5">
        <Panel className="p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <Badge tone="violet">Hotmart</Badge>
              <h3 className="mt-3 text-[20px] font-semibold text-[var(--text-primary)]">Consola Hotmart</h3>
              <p className="mt-1 text-[13px] leading-6 text-[var(--text-secondary)]">
                Administra la integracion Hotmart del workspace: credenciales, productos, links, promociones, comunidad, sincronizacion, reconciliacion y auditoria.
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-3">{shellActions}</div>
          </div>
        </Panel>
        {content}
      </div>
    );
  }

  return (
    <OperationsModuleShell
      actions={shellActions}
      description="Administra la integracion Hotmart del workspace: credenciales, productos, links y superficies reservadas para promociones, comunidad y conciliacion."
      eyebrow="Administrador de plataforma"
      moduleLabel="Hotmart"
      onSessionChange={onSessionChange}
      selectedSession={selectedSession}
      sessionDescription="La sesion activa solo se usa para generar ordenes/links de pago asociados a un proyecto."
      sessionOptions={sessionOptions}
      sessionValue={sessionValue}
      title="Consola Hotmart"
    >
      {content}
    </OperationsModuleShell>
  );
}

export function HotmartAdminPage({ api = hotmartAdminApi }: { api?: HotmartAdminApi } = {}) {
  const router = useRouter();
  const { user } = useAuth();
  const {
    createSession,
    items,
    listError,
    listStatus,
    selectedSession,
    selectOperationalSession,
  } = useOperationalSession({
    requireSnapshot: true,
  });

  const sessionOptions = useMemo(
    () =>
      items.map((item) => ({
        label: item.title,
        value: item.id,
      })),
    [items],
  );

  async function handleCreateSession() {
    const created = await createSession();
    router.push(getSessionProjectRoute(created));
  }

  return (
    <HotmartAdminView
      api={api}
      listError={listError}
      listStatus={listStatus}
      onCreateSession={() => void handleCreateSession()}
      onOpenIntegrations={() => router.push("/settings")}
      onOpenProject={() => {
        if (selectedSession) {
          router.push(getSessionProjectRoute(selectedSession));
        }
      }}
      onSessionChange={(value) => void selectOperationalSession(value)}
      selectedSession={selectedSession}
      sessionOptions={sessionOptions}
      sessionValue={selectedSession?.id ?? null}
      user={user}
    />
  );
}
