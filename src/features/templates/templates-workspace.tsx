"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Download, FileCode2, FolderKanban, RefreshCcw } from "lucide-react";
import { AppButton, Badge, Checklist, KeyValue, MiniStat, Panel, ProgressBar, SimpleTable, TabList } from "@/components/lean/ui";
import { useLanguage } from "@/core/i18n/language-context";
import { getSessionProjectRoute, getSessionStageLabel, getSessionStatusLabel } from "@/features/sessions/session-routes";
import { OperationsModuleShell } from "@/features/operations/operations-module-shell";
import { buildLibrarySummary, formatDateTime, getArtifactTitle } from "@/features/operations/operations-adapter";
import {
  getAcpFileTone,
  getBlockingQuestions,
  getConstructionTone,
  getExportBlockedReason,
  getManifestFile,
  getValidationSeverityTone,
  summarizeFileReadiness,
} from "@/features/acp/acp-adapter";
import { useSessionWorkspace } from "@/features/sessions/use-session-workspace";
import type {
  ACPFileEntry,
  ACPPreview,
  ArtifactRecordEntry,
  ConstructionQuestionViewEntry,
} from "@/features/sessions/session-contracts";
import { EmptyState, ErrorState, LoadingState, RetryPanel } from "@/shared/states/runtime-states";

type TemplatesTab = "ACP" | "Artefactos" | "Exportes";
type AsyncStatus = "idle" | "loading" | "ready" | "error";
type SubmissionState = "idle" | "submitting" | "success" | "error";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

function downloadText(content: string, fileName: string, mimeType: string) {
  downloadBlob(new Blob([content], { type: mimeType }), fileName);
}

export function TemplatesWorkspacePage() {
  const router = useRouter();
  const { language } = useLanguage();
  const localize = (en: string, es: string, pt: string) => (language === "en" ? en : language === "pt" ? pt : es);
  const formatAcpStatus = (status?: string | null) => {
    switch (status) {
      case "ready_to_build":
        return localize("Ready to build", "Listo para construir", "Pronto para construir");
      case "needs_questions":
        return localize("Needs answers", "Requiere respuestas", "Requer respostas");
      case "blocked":
        return localize("Blocked", "Bloqueado", "Bloqueado");
      default:
        return localize("Not started", "Sin iniciar", "Nao iniciado");
    }
  };
  const formatFileStatus = (status?: string | null) => {
    switch (status) {
      case "complete":
        return localize("Complete", "Completo", "Completo");
      case "needs_review":
        return localize("Needs review", "Requiere revision", "Requer revisao");
      default:
        return localize("Incomplete", "Incompleto", "Incompleto");
    }
  };
  const copy = language === "en"
    ? {
        moduleLabel: "Templates",
        title: "Templates and artifacts",
        emptyModuleDesc: "Select a session to open its ACP, review artifacts, and run real exports.",
        moduleDesc: "Session-driven hub for versioned ACP, artifact browser, and backend exports.",
        createSession: "Create session",
        noSessionsTitle: "There are no sessions to review yet",
        noSessionsDesc: "Create a session and complete the main journey to expose a reusable ACP and versioned artifacts.",
        openProject: "Open project",
        openAgent: "Open agent",
        refreshAcp: "Refresh ACP",
        regenerateAcp: "Regenerate ACP",
        package: "Package",
        noPreview: "No preview",
        packageReady: "ACP ready to inspect",
        generateAcp: "Generate ACP",
        currentStage: "Current stage",
        artifacts: "Artifacts",
        blockingQuestions: "Blocking questions",
        noBlockers: "No blockers",
        completeness: "Completeness",
        readinessHint: "ACP readiness",
        workspaceStatus: "Workspace status",
        syncingTitle: "Syncing templates workspace",
        syncingDesc: "Loading ACP preview, continuity questions, and backend artifacts.",
        openWorkspaceError: "Could not open the selected workspace",
        openWorkspaceErrorDesc: "The session did not return reusable data.",
        tabs: ["ACP", "Artifacts", "Exports"] as TemplatesTab[],
      }
    : language === "pt"
      ? {
          moduleLabel: "Modelos",
          title: "Modelos e artefatos",
          emptyModuleDesc: "Selecione uma sessão para abrir seu ACP, revisar artefatos e executar exportações reais.",
          moduleDesc: "Hub orientado por sessão para ACP versionado, navegador de artefatos e exportações do backend.",
          createSession: "Criar sessão",
          noSessionsTitle: "Ainda não há sessões para revisar",
          noSessionsDesc: "Crie uma sessão e conclua a jornada principal para expor um ACP reutilizável e artefatos versionados.",
          openProject: "Abrir projeto",
          openAgent: "Abrir agente",
          refreshAcp: "Atualizar ACP",
          regenerateAcp: "Regenerar ACP",
          package: "Pacote",
          noPreview: "Sem prévia",
          packageReady: "ACP pronto para inspeção",
          generateAcp: "Gerar ACP",
          currentStage: "Etapa atual",
          artifacts: "Artefatos",
          blockingQuestions: "Perguntas bloqueantes",
          noBlockers: "Sem bloqueios",
          completeness: "Completude",
          readinessHint: "Prontidão do ACP",
          workspaceStatus: "Estado do workspace",
          syncingTitle: "Sincronizando workspace de modelos",
          syncingDesc: "Carregando prévia do ACP, perguntas de continuidade e artefatos do backend.",
          openWorkspaceError: "Não foi possível abrir o workspace selecionado",
          openWorkspaceErrorDesc: "A sessão não retornou dados reutilizáveis.",
          tabs: ["ACP", "Artefatos", "Exportes"] as TemplatesTab[],
        }
      : {
          moduleLabel: "Plantillas",
          title: "Plantillas y artefactos",
          emptyModuleDesc: "Selecciona una sesión para abrir su ACP, revisar artefactos y ejecutar exportes reales.",
          moduleDesc: "Hub session-driven para ACP versionado, browser de artefactos y exportes del backend.",
          createSession: "Crear sesión",
          noSessionsTitle: "Todavía no hay sesiones para revisar",
          noSessionsDesc: "Crea una sesión y completa el journey principal para exponer un ACP reutilizable y artefactos versionados.",
          openProject: "Abrir proyecto",
          openAgent: "Abrir agente",
          refreshAcp: "Actualizar ACP",
          regenerateAcp: "Regenerar ACP",
          package: "Paquete",
          noPreview: "Sin preview",
          packageReady: "ACP listo para inspección",
          generateAcp: "Generar ACP",
          currentStage: "Etapa actual",
          artifacts: "Artefactos",
          blockingQuestions: "Preguntas bloqueantes",
          noBlockers: "Sin bloqueos",
          completeness: "Completitud",
          readinessHint: "Readiness ACP",
          workspaceStatus: "Estado del workspace",
          syncingTitle: "Sincronizando workspace de plantillas",
          syncingDesc: "Recuperando preview ACP, preguntas de continuidad y artefactos del backend.",
          openWorkspaceError: "No se pudo abrir el workspace seleccionado",
          openWorkspaceErrorDesc: "La sesión no devolvió datos reutilizables.",
          tabs: ["ACP", "Artefactos", "Exportes"] as TemplatesTab[],
        };
  const {
    createSession,
    exportAcpZip,
    exportJson,
    exportMarkdown,
    generateAcp,
    getAcpFile,
    getAcpPreview,
    getAcpQuestions,
    items,
    listArtifacts,
    listError,
    listStatus,
    selectWorkspaceSession,
    selectedSession,
  } = useSessionWorkspace();
  const [activeTab, setActiveTab] = useState<TemplatesTab>("ACP");
  const [workspaceStatus, setWorkspaceStatus] = useState<AsyncStatus>("idle");
  const [preview, setPreview] = useState<ACPPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ConstructionQuestionViewEntry[]>([]);
  const [artifacts, setArtifacts] = useState<ArtifactRecordEntry[]>([]);
  const [artifactsError, setArtifactsError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<ACPFileEntry | null>(null);
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [actionState, setActionState] = useState<SubmissionState>("idle");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [activeActionKey, setActiveActionKey] = useState<string | null>(null);

  const sessionOptions = items.map((item) => ({
    label: item.title,
    value: item.id,
  }));
  const fileSummary = useMemo(() => summarizeFileReadiness(preview?.files ?? []), [preview?.files]);
  const blockingQuestions = useMemo(() => getBlockingQuestions(questions), [questions]);
  const exportBlockedReason = getExportBlockedReason(preview, questions);
  const librarySummary = useMemo(() => buildLibrarySummary(artifacts), [artifacts]);
  const compareArtifacts = useMemo(() => artifacts.slice(0, 2), [artifacts]);
  const selectedArtifact =
    artifacts.find((item) => item.id === selectedArtifactId) ?? artifacts[0] ?? null;
  const selectedSessionRoute = selectedSession ? getSessionProjectRoute(selectedSession) : null;

  async function handleCreateSession() {
    const created = await createSession();
    router.push(getSessionProjectRoute(created));
  }

  const hydrateSelectedFile = useCallback(async (targetSessionId: string, nextPreview: ACPPreview | null) => {
    const nextManifest = getManifestFile(nextPreview);

    if (!nextManifest) {
      setSelectedFile(null);
      return;
    }

    try {
      const fileEntry = await getAcpFile(targetSessionId, nextManifest.path);
      setSelectedFile(fileEntry);
    } catch (error) {
      setSelectedFile(null);
      setActionState("error");
      setActionMessage(getErrorMessage(error, "No se pudo cargar el manifest ACP."));
    }
  }, [getAcpFile]);

  const loadWorkspace = useCallback(async (targetSessionId: string) => {
    setWorkspaceStatus("loading");
    setPreviewError(null);
    setArtifactsError(null);

    const [previewResult, questionsResult, artifactsResult] = await Promise.allSettled([
      getAcpPreview(targetSessionId),
      getAcpQuestions(targetSessionId),
      listArtifacts(targetSessionId),
    ]);

    const nextPreview = previewResult.status === "fulfilled" ? previewResult.value : null;
    const nextQuestions = questionsResult.status === "fulfilled" ? questionsResult.value : [];
    const nextArtifacts = artifactsResult.status === "fulfilled" ? artifactsResult.value.items : [];
    const nextPreviewError =
      previewResult.status === "rejected"
        ? getErrorMessage(previewResult.reason, "No se pudo cargar el preview ACP de la sesion seleccionada.")
        : null;
    const nextArtifactsError =
      artifactsResult.status === "rejected"
        ? getErrorMessage(artifactsResult.reason, "No se pudo cargar el browser de artefactos.")
        : null;

    setPreview(nextPreview);
    setQuestions(nextQuestions);
    setArtifacts(nextArtifacts);
    setPreviewError(nextPreviewError);
    setArtifactsError(nextArtifactsError);
    setSelectedArtifactId(nextArtifacts[0]?.id ?? null);
    setShowCompare(false);

    if (nextPreview) {
      await hydrateSelectedFile(targetSessionId, nextPreview);
    } else {
      setSelectedFile(null);
    }

    if (!nextPreview && nextArtifacts.length === 0) {
      setWorkspaceStatus(nextPreviewError || nextArtifactsError ? "error" : "ready");
      return;
    }

    setWorkspaceStatus("ready");
  }, [getAcpPreview, getAcpQuestions, hydrateSelectedFile, listArtifacts]);

  useEffect(() => {
    if (!selectedSession) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadWorkspace(selectedSession.id);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadWorkspace, selectedSession]);

  async function handleRefresh() {
    if (!selectedSession) {
      return;
    }

    await loadWorkspace(selectedSession.id);
  }

  async function handleGenerateAcp() {
    if (!selectedSession) {
      return;
    }

    setActionState("submitting");
    setActionMessage(null);
    setActiveActionKey("generate");

    try {
      await generateAcp(selectedSession.id);
      await loadWorkspace(selectedSession.id);
      setActionState("success");
      setActionMessage("ACP regenerado y sincronizado con la sesion seleccionada.");
    } catch (error) {
      setActionState("error");
      setActionMessage(getErrorMessage(error, "No se pudo regenerar el ACP."));
    } finally {
      setActiveActionKey(null);
    }
  }

  async function handleSelectFile(filePath: string) {
    if (!selectedSession) {
      return;
    }

    setActiveActionKey(`file:${filePath}`);
    try {
      const fileEntry = await getAcpFile(selectedSession.id, filePath);
      setSelectedFile(fileEntry);
      setActiveTab("ACP");
    } catch (error) {
      setActionState("error");
      setActionMessage(getErrorMessage(error, "No se pudo abrir el archivo ACP seleccionado."));
    } finally {
      setActiveActionKey(null);
    }
  }

  async function handleExportMarkdown() {
    if (!selectedSession) {
      return;
    }

    setActionState("submitting");
    setActionMessage(null);
    setActiveActionKey("export:markdown");

    try {
      const content = await exportMarkdown(selectedSession.id);
      downloadText(content, `${selectedSession.id}-templates.md`, "text/markdown;charset=utf-8");
      setActionState("success");
      setActionMessage("Export markdown descargado desde el backend.");
    } catch (error) {
      setActionState("error");
      setActionMessage(getErrorMessage(error, "No se pudo exportar el markdown."));
    } finally {
      setActiveActionKey(null);
    }
  }

  async function handleExportJson() {
    if (!selectedSession) {
      return;
    }

    setActionState("submitting");
    setActionMessage(null);
    setActiveActionKey("export:json");

    try {
      const content = await exportJson(selectedSession.id);
      downloadText(JSON.stringify(content, null, 2), `${selectedSession.id}-templates.json`, "application/json;charset=utf-8");
      setActionState("success");
      setActionMessage("Export JSON descargado desde el backend.");
    } catch (error) {
      setActionState("error");
      setActionMessage(getErrorMessage(error, "No se pudo exportar el JSON."));
    } finally {
      setActiveActionKey(null);
    }
  }

  async function handleExportZip() {
    if (!selectedSession) {
      return;
    }

    setActionState("submitting");
    setActionMessage(null);
    setActiveActionKey("export:zip");

    try {
      const blob = await exportAcpZip(selectedSession.id);
      downloadBlob(blob, `${selectedSession.id}-acp.zip`);
      setActionState("success");
      setActionMessage("ACP zip descargado correctamente.");
    } catch (error) {
      setActionState("error");
      setActionMessage(getErrorMessage(error, "No se pudo exportar el ACP zip."));
    } finally {
      setActiveActionKey(null);
    }
  }

  if (listStatus === "loading" && items.length === 0) {
    return <LoadingState title={copy.syncingTitle} description={copy.syncingDesc} />;
  }

  if (listStatus === "error" && items.length === 0) {
    return (
      <ErrorState
        title="No se pudo abrir Plantillas"
        description={listError?.message ?? "No fue posible obtener las sesiones disponibles."}
        action={
          <AppButton variant="primary" onClick={() => void handleCreateSession()}>
            {copy.createSession}
          </AppButton>
        }
      />
    );
  }

  if (!selectedSession) {
    return (
      <OperationsModuleShell
        moduleLabel={copy.moduleLabel}
        title={copy.title}
        description={copy.emptyModuleDesc}
        sessionOptions={sessionOptions}
        sessionValue={null}
      >
        <EmptyState
          title={copy.noSessionsTitle}
          description={copy.noSessionsDesc}
          action={
            <AppButton variant="primary" onClick={() => void handleCreateSession()}>
              {copy.createSession}
            </AppButton>
          }
        />
      </OperationsModuleShell>
    );
  }

  return (
    <OperationsModuleShell
      moduleLabel={copy.moduleLabel}
      title={copy.title}
      description={copy.moduleDesc}
      sessionOptions={sessionOptions}
      sessionValue={selectedSession.id}
      selectedSession={selectedSession}
      onSessionChange={(value) => void selectWorkspaceSession(value)}
      actions={
        <>
          <AppButton icon={<FolderKanban className="h-4 w-4" />} onClick={() => selectedSessionRoute && router.push(selectedSessionRoute)}>
            {copy.openProject}
          </AppButton>
          <AppButton data-testid="templates-open-agent" icon={<Bot className="h-4 w-4" />} onClick={() => router.push(`/agents/${selectedSession.id}`)}>
            {copy.openAgent}
          </AppButton>
          <AppButton icon={<RefreshCcw className="h-4 w-4" />} onClick={() => void handleRefresh()}>
            {copy.refreshAcp}
          </AppButton>
          <AppButton
            icon={<RefreshCcw className="h-4 w-4" />}
            loading={activeActionKey === "generate" && actionState === "submitting"}
            onClick={() => void handleGenerateAcp()}
            variant="primary"
          >
            {copy.regenerateAcp}
          </AppButton>
        </>
      }
    >
      <div className="grid gap-4 xl:grid-cols-5">
        <MiniStat label={copy.package} value={preview?.package_version ?? copy.noPreview} hint={preview ? copy.packageReady : copy.generateAcp} tone={preview ? "violet" : "slate"} />
        <MiniStat label={copy.currentStage} value={getSessionStageLabel(selectedSession.current_stage, language)} hint={getSessionStatusLabel(selectedSession.status, language)} tone="blue" />
        <MiniStat label={copy.artifacts} value={artifacts.length} hint={localize("Persisted per session", "Persistidos por sesión", "Persistidos por sessão")} tone="green" />
        <MiniStat label={copy.blockingQuestions} value={blockingQuestions.length} hint={blockingQuestions.length > 0 ? localize("Continuity pending", "Continuidad pendiente", "Continuidade pendente") : copy.noBlockers} tone={blockingQuestions.length > 0 ? "orange" : "green"} />
        <MiniStat label={copy.completeness} value={`${preview?.validation.completeness_percent ?? 0}%`} hint={copy.readinessHint} tone={preview?.validation.can_export_zip ? "green" : "orange"} />
      </div>

      {actionMessage ? (
        <Panel className="p-5">
          <p className="text-[16px] font-semibold text-[var(--text-primary)]">{copy.workspaceStatus}</p>
          <p className="mt-2 text-[14px] leading-7 text-[var(--text-secondary)]">{actionMessage}</p>
        </Panel>
      ) : null}

      <Panel className="p-6">
        <TabList active={activeTab} onChange={(value) => setActiveTab(value as TemplatesTab)} tabs={copy.tabs} />

        {workspaceStatus === "loading" ? (
          <LoadingState className="mt-6" title={copy.syncingTitle} description={copy.syncingDesc} />
        ) : null}

        {workspaceStatus === "error" ? (
          <ErrorState
            className="mt-6"
            title={copy.openWorkspaceError}
            description={previewError ?? artifactsError ?? copy.openWorkspaceErrorDesc}
            action={
              <AppButton variant="primary" onClick={() => void handleRefresh()}>
                {localize("Retry", "Reintentar", "Tentar novamente")}
              </AppButton>
            }
          />
        ) : null}

        {workspaceStatus === "ready" && activeTab === "ACP" ? (
          <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-5">
              {preview ? (
                <Panel className="border-[var(--border-default)] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[12px] text-[var(--text-secondary)]">{localize("ACP preview", "Preview del ACP", "Preview do ACP")}</p>
                      <h3
                        data-testid="templates-package-version"
                        className="mt-2 text-[28px] font-semibold text-[var(--text-primary)]"
                      >
                        {preview.package_version}
                      </h3>
                      <p className="mt-2 text-[14px] leading-7 text-[var(--text-secondary)]">
                        {localize("This view derives directly from the selected session and preserves the manifest, ACP files, and open continuity.", "Esta vista deriva directamente de la sesion seleccionada y conserva el manifest, los archivos ACP y la continuidad abierta.", "Esta visao deriva diretamente da sessao selecionada e preserva o manifest, os arquivos ACP e a continuidade em aberto.")}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={getConstructionTone(preview.construction_readiness.overall_status)}>
                        {formatAcpStatus(preview.construction_readiness.overall_status)}
                      </Badge>
                      <Badge tone={preview.validation.can_export_zip ? "green" : "orange"}>
                        {preview.validation.can_export_zip ? localize("Exportable", "Exportable", "Exportável") : localize("Blocked", "Con bloqueos", "Com bloqueios")}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-6 grid gap-4 md:grid-cols-5">
                    <MiniStat label="Manifest" value={preview.manifest_path} hint={localize("Canonical file", "Archivo canónico", "Arquivo canônico")} tone="violet" />
                    <MiniStat label={localize("Files", "Archivos", "Arquivos")} value={preview.files.length} hint={localize("Included in the package", "Incluidos en el paquete", "Incluídos no pacote")} tone="green" />
                    <MiniStat label={localize("Questions", "Preguntas", "Perguntas")} value={questions.length} hint={localize("Open continuity", "Continuidad abierta", "Continuidade aberta")} tone="orange" />
                    <MiniStat label="GAPs" value={preview.construction_readiness.gaps.length} hint={localize("Detected", "Detectados", "Detectados")} tone="orange" />
                    <MiniStat label={localize("Blockers", "Bloqueos", "Bloqueios")} value={blockingQuestions.length} hint={preview.validation.can_export_zip ? localize("Zip allowed", "Zip permitido", "Zip permitido") : localize("Zip blocked", "Zip bloqueado", "Zip bloqueado")} tone={blockingQuestions.length > 0 ? "red" : "green"} />
                  </div>
                </Panel>
              ) : (
                <EmptyState
                  title={localize("This session does not have an ACP preview yet", "Esta sesion aun no tiene preview ACP", "Esta sessao ainda nao possui preview do ACP")}
                  description={previewError ?? localize("Generate the ACP package from the backend to review files, readiness, and exports.", "Genera el paquete ACP desde el backend para revisar archivos, readiness y exportes.", "Gere o pacote ACP no backend para revisar arquivos, prontidão e exportações.")}
                  action={
                    <AppButton variant="primary" onClick={() => void handleGenerateAcp()}>
                      {copy.generateAcp}
                    </AppButton>
                  }
                />
              )}

              {preview ? (
                <div className="grid gap-5 xl:grid-cols-2">
                  <Panel className="p-6">
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[18px] font-semibold text-[var(--text-primary)]">{localize("ACP files", "Archivos ACP", "Arquivos ACP")}</p>
                        <p className="text-[14px] text-[var(--text-secondary)]">{localize("Select a generated file to review its real content.", "Selecciona un archivo generado para revisar su contenido real.", "Selecione um arquivo gerado para revisar seu conteudo real.")}</p>
                      </div>
                      <Badge tone="violet">{preview.files.length} {localize("files", "archivos", "arquivos")}</Badge>
                    </div>
                    <div className="space-y-3">
                      {preview.files.map((item) => (
                        <button
                          key={item.path}
                          type="button"
                          onClick={() => void handleSelectFile(item.path)}
                          className={`w-full rounded-[18px] border px-4 py-4 text-left transition ${
                            item.path === selectedFile?.path
                              ? "border-[rgba(79,70,245,0.24)] bg-[var(--brand-soft)]"
                              : "border-[var(--border-default)] bg-white"
                          }`}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone={getAcpFileTone(item.status)}>{formatFileStatus(item.status)}</Badge>
                            <span className="text-[12px] text-[var(--text-secondary)]">{item.format}</span>
                          </div>
                          <p className="mt-3 text-[15px] font-semibold text-[var(--text-primary)]">{item.title}</p>
                          <p className="mt-1 text-[12px] text-[var(--text-secondary)]">{item.path}</p>
                        </button>
                      ))}
                    </div>
                  </Panel>

                  <Panel className="p-6">
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[18px] font-semibold text-[var(--text-primary)]">{localize("ACP inspector", "Inspector ACP", "Inspetor ACP")}</p>
                        <p className="text-[14px] text-[var(--text-secondary)]">{localize("Content and metadata for the selected file.", "Contenido y metadata del archivo seleccionado.", "Conteudo e metadados do arquivo selecionado.")}</p>
                      </div>
                      {selectedFile ? <Badge tone={getAcpFileTone(selectedFile.status)}>{formatFileStatus(selectedFile.status)}</Badge> : null}
                    </div>
                    {selectedFile ? (
                      <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <KeyValue label={localize("Title", "Titulo", "Titulo")} value={selectedFile.title} />
                          <KeyValue label={localize("Domain", "Dominio", "Dominio")} value={selectedFile.domain} />
                          <KeyValue label={localize("Format", "Formato", "Formato")} value={selectedFile.format} />
                          <KeyValue label={localize("Warnings", "Advertencias", "Alertas")} value={selectedFile.warnings.length} />
                        </div>
                        <pre
                          data-testid="templates-selected-file-content"
                          className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-[18px] bg-[var(--surface-subtle)] px-4 py-4 text-[12px] leading-6 text-[var(--text-primary)]"
                        >
                          {selectedFile.content_text || localize("No textual content available.", "Sin contenido textual disponible.", "Sem conteudo textual disponivel.")}
                        </pre>
                      </div>
                    ) : (
                      <EmptyState className="px-0 py-4" title={localize("Select an ACP file", "Selecciona un archivo ACP", "Selecione um arquivo ACP")} description={localize("The manifest content or any generated file will be shown here.", "El contenido del manifest o de cualquier archivo generado se mostrara aqui.", "O conteudo do manifest ou de qualquer arquivo gerado sera exibido aqui.")} />
                    )}
                  </Panel>
                </div>
              ) : null}
            </div>

            <div className="space-y-5">
              <Panel className="p-6">
                <p className="text-[18px] font-semibold text-[var(--text-primary)]">{localize("Readiness", "Readiness", "Prontidao")}</p>
                <ProgressBar value={preview?.validation.completeness_percent ?? 0} className="mt-5" />
                <div className="mt-5 space-y-3">
                  <KeyValue label={localize("Can export zip", "Puede exportar zip", "Pode exportar zip")} value={preview?.validation.can_export_zip ? localize("Yes", "Si", "Sim") : localize("No", "No", "Nao")} />
                  <KeyValue label={localize("Blocking gaps", "GAPs bloqueantes", "GAPs bloqueantes")} value={preview?.construction_readiness.blocking_gaps ?? 0} />
                  <KeyValue label={localize("Open questions", "Preguntas abiertas", "Perguntas abertas")} value={preview?.construction_readiness.open_questions ?? 0} />
                  <KeyValue label={localize("Last session update", "Ultima sesion", "Ultima sessao")} value={formatDateTime(selectedSession.updated_at)} />
                </div>
                {exportBlockedReason ? (
                  <p className="mt-4 text-[13px] leading-7 text-[var(--text-secondary)]">{exportBlockedReason}</p>
                ) : null}
              </Panel>

              <Panel className="p-6">
                <p className="text-[18px] font-semibold text-[var(--text-primary)]">{localize("Release checklist", "Checklist de salida", "Checklist de saida")}</p>
                <Checklist
                  className="mt-5"
                  items={[
                    { label: localize("Visible ACP preview", "Preview ACP visible", "Preview do ACP visivel"), state: preview ? "done" : "pending" },
                    { label: localize("Session artifacts loaded", "Artefactos de sesion cargados", "Artefatos da sessao carregados"), state: artifacts.length > 0 ? "done" : "pending" },
                    { label: localize("No blocking questions", "Sin preguntas bloqueantes", "Sem perguntas bloqueantes"), state: blockingQuestions.length === 0 ? "done" : "alert" },
                    { label: localize("Exportable zip", "Zip exportable", "Zip exportavel"), state: preview?.validation.can_export_zip ? "done" : "pending" },
                  ]}
                />
              </Panel>

              <Panel className="p-6">
                <p className="text-[18px] font-semibold text-[var(--text-primary)]">
                  {localize("Validation issues", "Issues de validacion", "Issues de validacao")}
                </p>
                <div className="mt-5 space-y-3">
                  {(preview?.validation.issues ?? []).slice(0, 4).map((item) => (
                    <div key={`${item.code}-${item.path}`} className="rounded-[16px] border border-[var(--border-default)] px-4 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={getValidationSeverityTone(item.severity)}>{item.severity}</Badge>
                        <span className="text-[12px] text-[var(--text-secondary)]">
                          {item.path || localize("No path", "Sin path", "Sem caminho")}
                        </span>
                      </div>
                      <p className="mt-3 text-[13px] leading-6 text-[var(--text-secondary)]">{item.message}</p>
                    </div>
                  ))}
                  {(preview?.validation.issues ?? []).length === 0 ? (
                    <EmptyState
                      className="px-0 py-4"
                      title={localize("No persisted issues", "Sin issues persistidos", "Sem issues persistidos")}
                      description={localize(
                        "The backend did not report validation issues for this session.",
                        "El backend no reporto issues de validacion para esta sesion.",
                        "O backend nao reportou issues de validacao para esta sessao.",
                      )}
                    />
                  ) : null}
                </div>
              </Panel>
            </div>
          </div>
        ) : null}

        {workspaceStatus === "ready" && activeTab === "Artefactos" ? (
          <div className="mt-6 space-y-5">
            <div className="grid gap-4 xl:grid-cols-4">
              <MiniStat label={localize("Total artifacts", "Total artefactos", "Total de artefatos")} value={librarySummary.totalArtifacts} hint={localize("Persisted by backend", "Persistidos por backend", "Persistidos pelo backend")} tone="violet" />
              <MiniStat label={localize("Kinds", "Tipos", "Tipos")} value={librarySummary.artifactKinds.size} hint={localize("Detected classes", "Clases detectadas", "Classes detectadas")} tone="green" />
              <MiniStat label={localize("Stages", "Etapas", "Etapas")} value={librarySummary.artifactStages.size} hint={localize("With evidence", "Con evidencia", "Com evidencia")} tone="blue" />
              <MiniStat label={localize("Versions", "Versiones", "Versoes")} value={librarySummary.versionCount} hint={formatDateTime(librarySummary.latestCreatedAt)} tone="orange" />
            </div>

            {artifactsError ? (
              <RetryPanel
                title={localize(
                  "The artifact browser needs a retry.",
                  "El browser de artefactos necesita reintento",
                  "O navegador de artefatos precisa de nova tentativa.",
                )}
                description={artifactsError}
                onRetry={() => void handleRefresh()}
              />
            ) : null}

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
              <Panel className="p-6">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[20px] font-semibold text-[var(--text-primary)]">
                      {localize("Artifact browser", "Browser de artefactos", "Navegador de artefatos")}
                    </p>
                    <p className="text-[14px] text-[var(--text-secondary)]">
                      {localize(
                        "Real inventory of the selected session without hardcoded IDs.",
                        "Inventario real de la sesion seleccionada, sin IDs hardcodeados.",
                        "Inventario real da sessao selecionada, sem IDs hardcodeados.",
                      )}
                    </p>
                  </div>
                  <AppButton disabled={compareArtifacts.length < 2} onClick={() => setShowCompare((currentValue) => !currentValue)}>
                    {showCompare
                      ? localize("Hide comparison", "Ocultar comparacion", "Ocultar comparacao")
                      : localize("Compare", "Comparar", "Comparar")}
                  </AppButton>
                </div>
                {artifacts.length > 0 ? (
                  <SimpleTable
                    columns={[
                      localize("Artifact", "Artefacto", "Artefato"),
                      localize("Type", "Tipo", "Tipo"),
                      localize("Stage", "Etapa", "Etapa"),
                      localize("Updated", "Actualizado", "Atualizado"),
                      localize("Version", "Version", "Versao"),
                    ]}
                    rows={artifacts.map((item) => [
                      <button
                        key={item.id}
                        data-testid={`templates-artifact-${item.id}`}
                        type="button"
                        onClick={() => setSelectedArtifactId(item.id)}
                        className="text-left font-medium text-[var(--brand-primary)]"
                      >
                        {getArtifactTitle(item)}
                      </button>,
                      <Badge key={`${item.id}-kind`} tone="violet">
                        {item.artifact_kind || localize("No type", "sin tipo", "sem tipo")}
                      </Badge>,
                      item.stage,
                      formatDateTime(item.created_at),
                      item.blueprint_version_number ? `v${item.blueprint_version_number}` : localize("n/a", "n/a", "n/d"),
                    ])}
                  />
                ) : (
                  <EmptyState
                    className="px-0 py-4"
                    title={localize("No artifacts for this session", "Sin artefactos para esta sesion", "Sem artefatos para esta sessao")}
                    description={localize(
                      "Generate or export deliverables to populate this browser.",
                      "Genera o exporta entregables para poblar este browser.",
                      "Gere ou exporte entregaveis para preencher este navegador.",
                    )}
                  />
                )}
              </Panel>

              <Panel className="p-6">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[20px] font-semibold text-[var(--text-primary)]">
                      {localize("Inspector", "Inspector", "Inspetor")}
                    </p>
                    <p className="text-[14px] text-[var(--text-secondary)]">
                      {localize(
                        "Selected artifact detail and optional comparison.",
                        "Detalle del artefacto seleccionado y comparacion opcional.",
                        "Detalhe do artefato selecionado e comparacao opcional.",
                      )}
                    </p>
                  </div>
                  {showCompare && compareArtifacts.length >= 2 ? (
                    <Badge tone="blue">{localize("Comparison active", "Comparacion activa", "Comparacao ativa")}</Badge>
                  ) : null}
                </div>
                {selectedArtifact ? (
                  <div className="space-y-5">
                    {showCompare && compareArtifacts.length >= 2 ? (
                      <Panel className="border-[var(--border-default)] p-5">
                        <p className="text-[16px] font-semibold text-[var(--text-primary)]">
                          {localize("Quick comparison", "Comparacion rapida", "Comparacao rapida")}
                        </p>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          {compareArtifacts.map((item) => (
                            <div key={`${item.id}-compare`} className="rounded-[16px] border border-[var(--border-default)] px-4 py-4">
                              <p className="text-[15px] font-semibold text-[var(--text-primary)]">{getArtifactTitle(item)}</p>
                              <p className="mt-2 text-[13px] text-[var(--text-secondary)]">{item.stage}</p>
                              <p className="mt-2 text-[12px] text-[var(--text-secondary)]">{formatDateTime(item.created_at)}</p>
                            </div>
                          ))}
                        </div>
                      </Panel>
                    ) : null}

                    <Panel className="border-[var(--border-default)] p-5">
                      <div className="grid gap-4 md:grid-cols-2">
                        <KeyValue label={localize("Title", "Titulo", "Titulo")} value={getArtifactTitle(selectedArtifact)} />
                        <KeyValue label={localize("Type", "Tipo", "Tipo")} value={selectedArtifact.artifact_kind || localize("No type", "sin tipo", "sem tipo")} />
                        <KeyValue label={localize("Stage", "Etapa", "Etapa")} value={selectedArtifact.stage} />
                        <KeyValue label={localize("Updated", "Actualizado", "Atualizado")} value={formatDateTime(selectedArtifact.created_at)} />
                      </div>
                    </Panel>
                    <Panel className="border-[var(--border-default)] p-5">
                      <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap rounded-[16px] bg-[var(--surface-subtle)] p-4 text-[13px] leading-6 text-[var(--text-primary)]">
                        {selectedArtifact.content_text.trim() || JSON.stringify(selectedArtifact.artifact_metadata, null, 2)}
                      </pre>
                    </Panel>
                  </div>
                ) : (
                  <EmptyState
                    className="px-0 py-4"
                    title={localize("Select an artifact", "Selecciona un artefacto", "Selecione um artefato")}
                    description={localize(
                      "Choose a browser result to review its real content.",
                      "Elige un resultado del browser para revisar su contenido real.",
                      "Escolha um resultado do navegador para revisar seu conteudo real.",
                    )}
                  />
                )}
              </Panel>
            </div>
          </div>
        ) : null}

        {workspaceStatus === "ready" && activeTab === "Exportes" ? (
          <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-5">
              <Panel className="p-6">
                <div className="mb-4 space-y-2">
                  <p className="text-[22px] font-semibold text-[var(--text-primary)]">
                    {localize("Export and share", "Exportar y compartir", "Exportar e compartilhar")}
                  </p>
                  <p className="text-[14px] text-[var(--text-secondary)]">
                    {localize(
                      "These actions download real assets generated by the selected session.",
                      "Estas acciones descargan activos reales generados por la sesion seleccionada.",
                      "Estas acoes baixam ativos reais gerados pela sessao selecionada.",
                    )}
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <AppButton
                    data-testid="templates-export-markdown"
                    icon={<FileCode2 className="h-4 w-4" />}
                    loading={activeActionKey === "export:markdown" && actionState === "submitting"}
                    onClick={() => void handleExportMarkdown()}
                  >
                    {localize("Export markdown", "Exportar markdown", "Exportar markdown")}
                  </AppButton>
                  <AppButton
                    data-testid="templates-export-json"
                    icon={<FileCode2 className="h-4 w-4" />}
                    loading={activeActionKey === "export:json" && actionState === "submitting"}
                    onClick={() => void handleExportJson()}
                  >
                    {localize("Export JSON", "Exportar JSON", "Exportar JSON")}
                  </AppButton>
                  <AppButton
                    data-testid="templates-export-zip"
                    disabled={Boolean(exportBlockedReason)}
                    icon={<Download className="h-4 w-4" />}
                    loading={activeActionKey === "export:zip" && actionState === "submitting"}
                    onClick={() => void handleExportZip()}
                    variant="primary"
                  >
                    {localize("Download ACP zip", "Descargar ACP zip", "Baixar ACP zip")}
                  </AppButton>
                </div>
              </Panel>

              <Panel className="p-6">
                <p className="text-[18px] font-semibold text-[var(--text-primary)]">
                  {localize("Package coverage", "Cobertura del paquete", "Cobertura do pacote")}
                </p>
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <KeyValue label={localize("Complete files", "Archivos completos", "Arquivos completos")} value={fileSummary.complete} />
                  <KeyValue label={localize("Needs review", "Requiere revision", "Requer revisao")} value={fileSummary.needsReview} />
                  <KeyValue label={localize("Incomplete", "Incompletos", "Incompletos")} value={fileSummary.incomplete} />
                </div>
                <ProgressBar value={preview?.validation.completeness_percent ?? 0} className="mt-5" />
              </Panel>
            </div>

            <div className="space-y-5">
              <Panel className="p-6">
                <p className="text-[18px] font-semibold text-[var(--text-primary)]">
                  {localize("Validations before export", "Validaciones antes de exportar", "Validacoes antes de exportar")}
                </p>
                <Checklist
                  className="mt-5"
                  items={[
                    { label: localize("Selected session", "Sesion seleccionada", "Sessao selecionada"), state: "done", detail: selectedSession.title },
                    { label: localize("ACP generated", "ACP generado", "ACP gerado"), state: preview ? "done" : "pending" },
                    {
                      label: localize("No zip blocker", "Sin bloqueo para zip", "Sem bloqueio para zip"),
                      state: exportBlockedReason ? "alert" : "done",
                      detail: exportBlockedReason ?? localize("Zip enabled by backend.", "Zip habilitado por backend.", "Zip habilitado pelo backend."),
                    },
                    { label: localize("Artifacts available", "Artefactos disponibles", "Artefatos disponiveis"), state: artifacts.length > 0 ? "done" : "pending" },
                  ]}
                />
              </Panel>

              {exportBlockedReason ? (
                <RetryPanel
                  title={localize("The zip is not released yet", "El zip aun no esta liberado", "O zip ainda nao foi liberado")}
                  description={exportBlockedReason}
                  onRetry={() => void handleRefresh()}
                  retryLabel={localize("Revalidate package", "Revalidar paquete", "Revalidar pacote")}
                />
              ) : null}
            </div>
          </div>
        ) : null}
      </Panel>
    </OperationsModuleShell>
  );
}
