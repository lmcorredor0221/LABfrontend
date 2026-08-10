"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FolderKanban, RefreshCcw } from "lucide-react";
import { AppButton, Badge, KeyValue, Panel, SelectField, SimpleTable, TextField } from "@/components/lean/ui";
import { CommercialTierPanel, resolveCommercialAccess } from "@/features/commercial/commercial-tier-panel";
import { OperationsModuleShell } from "@/features/operations/operations-module-shell";
import {
  buildLibraryQueryParams,
  buildLibrarySummary,
  formatDateTime,
  getArtifactTitle,
  getStatusTone,
} from "@/features/operations/operations-adapter";
import { useOperationalSession } from "@/features/operations/use-operational-session";
import { getSessionProjectRoute } from "@/features/sessions/session-routes";
import type { ArtifactBrowserResponse, ArtifactRecordEntry } from "@/features/sessions/session-contracts";
import type { CommercialTier } from "@/features/sessions/types";
import { useLanguage } from "@/core/i18n/language-context";
import { EmptyState, ErrorState, LoadingState } from "@/shared/states/runtime-states";

type AsyncState<TData> =
  | { data: null; error: null; status: "idle" | "loading" }
  | { data: TData; error: null; status: "ready" }
  | { data: null; error: string; status: "error" };

function createIdleState<TData>(): AsyncState<TData> {
  return {
    data: null,
    error: null,
    status: "idle",
  };
}

function downloadText(content: string, fileName: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

export function LibraryWorkspacePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const {
    checkoutProduct,
    createSession,
    items,
    listArtifacts,
    listError,
    listStatus,
    selectedSnapshot,
    queryLibrary,
    selectedSession,
    selectOperationalSession,
    snapshotStatus,
  } = useOperationalSession({ requireSnapshot: true });
  const [allArtifactsState, setAllArtifactsState] = useState<AsyncState<ArtifactBrowserResponse>>(createIdleState);
  const [resultsState, setResultsState] = useState<AsyncState<ArtifactBrowserResponse>>(createIdleState);
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [commercialActionTier, setCommercialActionTier] = useState<CommercialTier | null>(null);
  const [filters, setFilters] = useState({
    artifact_kind: "",
    blueprint_version_number: "",
    date_from: "",
    date_to: "",
    q: "",
    stage: "" as ArtifactRecordEntry["stage"] | "",
  });

  const sessionOptions = items.map((item) => ({
    label: item.title,
    value: item.id,
  }));
  const commercialAccess = resolveCommercialAccess(selectedSnapshot?.commercial_access);

  useEffect(() => {
    if (!selectedSession || !commercialAccess.can_access_library_workspace) {
      return;
    }

    let cancelled = false;

    async function loadArtifacts() {
      setAllArtifactsState({ data: null, error: null, status: "loading" });
      try {
        const data = await listArtifacts(selectedSession.id);
        if (cancelled) {
          return;
        }
        setAllArtifactsState({ data, error: null, status: "ready" });
      } catch (error) {
        if (cancelled) {
          return;
        }
        setAllArtifactsState({
          data: null,
          error: error instanceof Error ? error.message : "No se pudo cargar la biblioteca base.",
          status: "error",
        });
      }
    }

    void loadArtifacts();
    return () => {
      cancelled = true;
    };
  }, [commercialAccess.can_access_library_workspace, listArtifacts, selectedSession]);

  useEffect(() => {
    if (!selectedSession || !commercialAccess.can_access_library_workspace) {
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setResultsState({ data: null, error: null, status: "loading" });
      try {
        const data = await queryLibrary(selectedSession.id, {
          ...buildLibraryQueryParams({
            artifact_kind: filters.artifact_kind,
            blueprint_version_number:
              filters.blueprint_version_number.trim() === "" ? null : Number(filters.blueprint_version_number),
            date_from: filters.date_from,
            date_to: filters.date_to,
            q: filters.q,
            stage: filters.stage,
          }),
          stage: filters.stage || null,
        });
        setResultsState({ data, error: null, status: "ready" });
      } catch (error) {
        setResultsState({
          data: null,
          error: error instanceof Error ? error.message : "No se pudo consultar la biblioteca.",
          status: "error",
        });
      }
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [commercialAccess.can_access_library_workspace, filters, queryLibrary, selectedSession]);

  const allArtifacts = allArtifactsState.status === "ready" ? allArtifactsState.data.items : [];
  const librarySummary = buildLibrarySummary(allArtifacts);
  const resultItems = resultsState.status === "ready" ? resultsState.data.items : [];
  const effectiveSelectedArtifactId =
    selectedArtifactId && resultItems.some((item) => item.id === selectedArtifactId)
      ? selectedArtifactId
      : (resultItems[0]?.id ?? null);
  const selectedArtifact =
    resultItems.find((item) => item.id === effectiveSelectedArtifactId) ??
    allArtifacts.find((item) => item.id === effectiveSelectedArtifactId) ??
    resultItems[0] ??
    null;
  const artifactKindOptions = useMemo(
    () => [
      { label: "Todos los tipos", value: "" },
      ...Array.from(librarySummary.artifactKinds).sort().map((kind) => ({
        label: kind,
        value: kind,
      })),
    ],
    [librarySummary.artifactKinds],
  );
  const stageOptions = useMemo(
    () => [
      { label: "Todas las etapas", value: "" },
      ...Array.from(librarySummary.artifactStages).sort().map((stage) => ({
        label: stage,
        value: stage,
      })),
    ],
    [librarySummary.artifactStages],
  );

  async function handleCreateSession() {
    const created = await createSession();
    router.push(getSessionProjectRoute(created));
  }

  async function handleUpgradeTier(tier: CommercialTier) {
    if (!selectedSession) {
      return;
    }
    setCommercialActionTier(tier);
    try {
      await checkoutProduct(selectedSession.id, tier, {
        cancelUrl: window.location.href,
        idempotencyKey: `${selectedSession.id}:${tier}:library-page`,
        successUrl: window.location.href,
      });
    } finally {
      setCommercialActionTier(null);
    }
  }

  function handleDownloadArtifact(item: ArtifactRecordEntry | null) {
    setDownloadError(null);
    if (!item || !item.content_text.trim()) {
      setDownloadError("El artefacto seleccionado no expone contenido descargable en este snapshot.");
      return;
    }

    downloadText(item.content_text, `${item.artifact_key || item.id}.txt`);
  }

  if (listStatus === "loading" && items.length === 0) {
    return <LoadingState title="Cargando biblioteca" description="Estamos recuperando las sesiones para consultar artefactos reales." />;
  }

  if (listStatus === "error" && items.length === 0) {
    return (
      <ErrorState
        title="No se pudo abrir la biblioteca"
        description={listError?.message ?? "No fue posible obtener la lista de sesiones."}
        action={
          <AppButton variant="primary" onClick={() => void handleCreateSession()}>
            Crear sesion
          </AppButton>
        }
      />
    );
  }

  if (!selectedSession) {
    return (
      <OperationsModuleShell
        moduleLabel="Biblioteca"
        title="Biblioteca"
        description="Busca y explica artefactos persistidos por una sesion real."
        sessionOptions={sessionOptions}
        sessionValue={null}
      >
        <EmptyState
          title="Sin sesiones para inspeccionar"
          description="Crea o completa una sesion para exponer artefactos reales en la biblioteca."
          action={
            <AppButton variant="primary" onClick={() => void handleCreateSession()}>
              Crear sesion
            </AppButton>
          }
        />
      </OperationsModuleShell>
    );
  }

  if (!selectedSnapshot || snapshotStatus === "loading") {
    return (
      <OperationsModuleShell
        moduleLabel="Biblioteca"
        title="Biblioteca"
        description="Resolvemos el nivel comercial de la sesion antes de mostrar artefactos tecnicos."
        sessionOptions={sessionOptions}
        sessionValue={selectedSession.id}
        selectedSession={selectedSession}
        onSessionChange={(value) => void selectOperationalSession(value)}
      >
        <LoadingState title="Validando acceso" description="Estamos cargando la sesion activa y sus entitlements comerciales." />
      </OperationsModuleShell>
    );
  }

  if (!commercialAccess.can_access_library_workspace) {
    return (
      <OperationsModuleShell
        moduleLabel="Biblioteca"
        title="Biblioteca tecnica del ACP"
        description="Esta vista concentra artefactos tecnicos, lineage y contenido exportable del paquete premium."
        sessionOptions={sessionOptions}
        sessionValue={selectedSession.id}
        selectedSession={selectedSession}
        onSessionChange={(value) => void selectOperationalSession(value)}
        actions={
          <AppButton onClick={() => router.push(getSessionProjectRoute(selectedSession))} icon={<FolderKanban className="h-4 w-4" />}>
            Volver al proyecto
          </AppButton>
        }
      >
        <CommercialTierPanel
          access={commercialAccess}
          actionState={commercialActionTier}
          description="La Biblioteca se reserva para ACP Premium porque expone archivos, prompts, contratos y artefactos tecnicos listos para implementacion."
          onUpgrade={(tier) => void handleUpgradeTier(tier)}
          title="Desbloquea la biblioteca tecnica"
        />
        <EmptyState
          title="Biblioteca bloqueada por plan"
          description="Con Blueprint puedes ver el valor del agente dentro del journey. Con Blueprint Profesional obtienes el documento listo para decision. ACP Premium desbloquea esta biblioteca tecnica."
        />
      </OperationsModuleShell>
    );
  }

  return (
    <OperationsModuleShell
      moduleLabel={t("library.title", "Biblioteca")}
      title={t("library.title", "Biblioteca de artefactos")}
      description={t("library.description", "Explora, filtra y descarga los artefactos generados en tus proyectos.")}
      sessionOptions={sessionOptions}
      sessionValue={selectedSession.id}
      selectedSession={selectedSession}
      onSessionChange={(value) => void selectOperationalSession(value)}
      actions={
        <>
          <AppButton onClick={() => router.push(getSessionProjectRoute(selectedSession))} icon={<FolderKanban className="h-4 w-4" />}>
            {t("nav.projects", "Volver al proyecto")}
          </AppButton>
          <AppButton onClick={() => window.location.reload()} icon={<RefreshCcw className="h-4 w-4" />}>
            Recargar
          </AppButton>
        </>
      }
    >
      <div className="grid gap-4 xl:grid-cols-4">
        <Panel className="p-5">
          <KeyValue label="Artefactos totales" value={String(librarySummary.totalArtifacts)} hint="Carga base desde /artifacts" />
        </Panel>
        <Panel className="p-5">
          <KeyValue label="Tipos distintos" value={String(librarySummary.artifactKinds.size)} hint="Detectados en la sesion activa" />
        </Panel>
        <Panel className="p-5">
          <KeyValue label="Etapas con evidencia" value={String(librarySummary.artifactStages.size)} hint="Cobertura del session_id" />
        </Panel>
        <Panel className="p-5">
          <KeyValue label="Versiones blueprint" value={String(librarySummary.versionCount)} hint={formatDateTime(librarySummary.latestCreatedAt)} />
        </Panel>
      </div>

      <Panel className="p-6">
        <div className="grid gap-4 xl:grid-cols-[1.3fr_repeat(4,minmax(0,0.8fr))]">
          <TextField
            data-testid="library-search"
            label="Busqueda"
            placeholder="Busca por nombre, contenido, accion o tipo..."
            value={filters.q}
            onValueChange={(value) => setFilters((current) => ({ ...current, q: value }))}
          />
          <SelectField
            label="Tipo"
            options={artifactKindOptions}
            value={filters.artifact_kind}
            onValueChange={(value) => setFilters((current) => ({ ...current, artifact_kind: value }))}
          />
          <SelectField
            label="Etapa"
            options={stageOptions}
            value={filters.stage}
            onValueChange={(value) =>
              setFilters((current) => ({
                ...current,
                stage: value as ArtifactRecordEntry["stage"] | "",
              }))
            }
          />
          <TextField
            label="Desde"
            type="date"
            value={filters.date_from}
            onValueChange={(value) => setFilters((current) => ({ ...current, date_from: value }))}
          />
          <TextField
            label="Hasta"
            type="date"
            value={filters.date_to}
            onValueChange={(value) => setFilters((current) => ({ ...current, date_to: value }))}
          />
        </div>
      </Panel>

      {resultsState.status === "loading" ? (
        <LoadingState title="Consultando resultados" description="Aplicando filtros reales contra el backend." />
      ) : null}

      {resultsState.status === "error" ? (
        <ErrorState
          title="No se pudo consultar la biblioteca"
          description={resultsState.error}
          action={<AppButton onClick={() => window.location.reload()}>Reintentar</AppButton>}
        />
      ) : null}

      {resultsState.status === "ready" ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
          <Panel className="p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-[20px] font-semibold text-[var(--text-primary)]">Resultados ({resultItems.length})</p>
                <p className="text-[14px] text-[var(--text-secondary)]">Consulta servida por `/api/v1/sessions/{selectedSession.id}/library`.</p>
              </div>
              <Badge tone="blue">Filtro live</Badge>
            </div>
            {resultItems.length > 0 ? (
              <SimpleTable
                columns={["Artefacto", "Tipo", "Etapa", "Actualizado", "Version"]}
                rows={resultItems.map((item) => [
                  <button
                    data-testid={`library-artifact-${item.id}`}
                    key={`${item.id}-open`}
                    type="button"
                    onClick={() => setSelectedArtifactId(item.id)}
                    className="text-left font-medium text-[var(--brand-primary)]"
                  >
                    {getArtifactTitle(item)}
                  </button>,
                  <Badge key={`${item.id}-kind`} tone="violet">
                    {item.artifact_kind || "sin tipo"}
                  </Badge>,
                  item.stage,
                  formatDateTime(item.created_at),
                  item.blueprint_version_number ? `v${item.blueprint_version_number}` : "n/a",
                ])}
              />
            ) : (
              <EmptyState
                className="px-0 py-4"
                title="Sin resultados"
                description="El backend no devolvio artefactos para los filtros aplicados."
              />
            )}
          </Panel>

          <Panel className="p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-[20px] font-semibold text-[var(--text-primary)]">Inspector</p>
                <p className="text-[14px] text-[var(--text-secondary)]">Abre el contenido y metadata del artefacto seleccionado.</p>
              </div>
              <AppButton icon={<Download className="h-4 w-4" />} onClick={() => handleDownloadArtifact(selectedArtifact)}>
                Descargar
              </AppButton>
            </div>
            {selectedArtifact ? (
              <div className="space-y-5">
                <Panel className="border-[var(--border-default)] p-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <KeyValue label="Titulo" value={getArtifactTitle(selectedArtifact)} />
                    <KeyValue label="Tipo" value={selectedArtifact.artifact_kind || "sin tipo"} />
                    <KeyValue label="Etapa" value={selectedArtifact.stage} />
                    <KeyValue label="Ultima actualizacion" value={formatDateTime(selectedArtifact.created_at)} />
                  </div>
                </Panel>
                <Panel className="border-[var(--border-default)] p-5">
                  <p className="mb-3 text-[16px] font-semibold text-[var(--text-primary)]">Contenido</p>
                  <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap rounded-[16px] bg-[var(--surface-subtle)] p-4 text-[13px] leading-6 text-[var(--text-primary)]">
                    {selectedArtifact.content_text.trim() || JSON.stringify(selectedArtifact.artifact_metadata, null, 2)}
                  </pre>
                </Panel>
                <Panel className="border-[var(--border-default)] p-5">
                  <p className="mb-3 text-[16px] font-semibold text-[var(--text-primary)]">Metadata</p>
                  <div className="space-y-3">
                    <KeyValue label="Source action" value={selectedArtifact.source_action || "sin accion"} />
                    <KeyValue
                      label="Hash"
                      value={selectedArtifact.content_hash || "sin hash"}
                      hint={selectedArtifact.export_format || "sin formato declarado"}
                    />
                    <Badge tone={getStatusTone(selectedArtifact.artifact_kind)}>{selectedArtifact.artifact_kind || "sin tipo"}</Badge>
                  </div>
                </Panel>
                {downloadError ? <p className="text-[13px] font-medium text-[var(--danger)]">{downloadError}</p> : null}
              </div>
            ) : (
              <EmptyState
                className="px-0 py-4"
                title="Selecciona un artefacto"
                description="Elige un resultado de la tabla para ver su contenido real."
              />
            )}
          </Panel>
        </div>
      ) : null}
    </OperationsModuleShell>
  );
}
