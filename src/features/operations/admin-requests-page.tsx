"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Inbox,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";
import { useLanguage } from "@/core/i18n/language-context";
import { sessionsApi } from "@/features/sessions/session-api";
import type { AccessRequestResponse } from "@/features/sessions/types";
import { UxaBadge, UxaSurface } from "@/features/product-experience/design-system";
import { cn } from "@/lib/utils";

type FilterStatus = "all" | "pending" | "approved" | "rejected";

function resolveAdminRequestsErrorMessage(err: unknown, language: string) {
  const statusCode =
    typeof err === "object" && err !== null && "status" in err
      ? Number((err as { status?: unknown }).status)
      : 0;
  if (statusCode === 403) {
    return language === "es"
      ? "Esta consola requiere rol Platform Admin activo. Ser owner del workspace no habilita aprobaciones comerciales."
      : "This console requires an active Platform Admin role. Workspace owner access does not authorize commercial approvals.";
  }
  if (err instanceof Error) {
    return err.message;
  }
  return language === "es"
    ? "No se pudieron cargar las solicitudes de acceso."
    : "Could not load access requests.";
}

export function AdminRequestsPage() {
  const { language } = useLanguage();
  const [requests, setRequests] = useState<AccessRequestResponse[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setStatus("loading");
    setErrorMessage("");
    try {
      const data = await sessionsApi.listAccessRequests();
      setRequests(Array.isArray(data) ? data : []);
      setStatus("ready");
    } catch (err: unknown) {
      setStatus("error");
      setErrorMessage(resolveAdminRequestsErrorMessage(err, language));
    }
  }, [language]);

  useEffect(() => {
    queueMicrotask(() => void fetchRequests());
  }, [fetchRequests]);

  const handleResolve = async (requestId: string, decision: "approved" | "rejected", note = "") => {
    setResolvingId(requestId);
    setActionSuccessMessage(null);
    try {
      const updated = await sessionsApi.resolveAccessRequest(requestId, {
        decision,
        resolution_note: note,
      });
      setRequests((prev) =>
        prev.map((item) => (item.id === requestId ? { ...item, ...updated, status: decision } : item)),
      );
      setRejectingId(null);
      setRejectNote("");
      setActionSuccessMessage(
        decision === "approved"
          ? language === "es"
            ? "Solicitud aprobada con éxito. El proyecto ahora tiene el acceso desbloqueado."
            : "Request approved successfully. The project now has unlocked access."
          : language === "es"
          ? "Solicitud rechazada."
          : "Request rejected.",
      );
    } catch (err: unknown) {
      alert(
        err instanceof Error
          ? err.message
          : language === "es"
          ? "Error al procesar la solicitud."
          : "Error processing request.",
      );
    } finally {
      setResolvingId(null);
    }
  };

  const counts = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === "pending").length;
    const approved = requests.filter((r) => r.status === "approved").length;
    const rejected = requests.filter((r) => r.status === "rejected" || r.status === "canceled").length;
    return { total, pending, approved, rejected };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return requests.filter((item) => {
      if (activeFilter === "pending" && item.status !== "pending") return false;
      if (activeFilter === "approved" && item.status !== "approved") return false;
      if (activeFilter === "rejected" && item.status !== "rejected" && item.status !== "canceled") return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.project_title?.toLowerCase().includes(q) ||
        item.workspace_name?.toLowerCase().includes(q) ||
        item.requester_name?.toLowerCase().includes(q) ||
        item.requester_email?.toLowerCase().includes(q) ||
        item.product_key?.toLowerCase().includes(q) ||
        item.reason?.toLowerCase().includes(q)
      );
    });
  }, [requests, activeFilter, searchQuery]);

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(language === "es" ? "es-ES" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--uxa-color-brand)] text-white shadow-sm">
              <Inbox aria-hidden="true" className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-[22px] font-black tracking-tight text-[var(--uxa-color-ink)]">
                {language === "es"
                  ? "Gestión de Solicitudes de Acceso"
                  : "Access Request Management"}
              </h1>
              <p className="text-[13px] text-[var(--uxa-color-ink-soft)]">
                {language === "es"
                  ? "Panel de administración del sistema para revisar y autorizar accesos comerciales a Blueprint Pro y ACP Premium."
                  : "System admin panel to review and authorize commercial access to Blueprint Pro and ACP Premium."}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="uxa-button uxa-button--secondary"
            disabled={status === "loading"}
            onClick={() => void fetchRequests()}
            type="button"
          >
            <RefreshCw aria-hidden="true" className={cn("h-4 w-4", status === "loading" && "animate-spin")} />
            <span>{language === "es" ? "Recargar" : "Reload"}</span>
          </button>
        </div>
      </div>

      {/* Success alert message */}
      {actionSuccessMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-[13px] font-medium text-emerald-900 shadow-sm">
          <CheckCircle2 aria-hidden="true" className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>{actionSuccessMessage}</span>
          <button
            className="ml-auto text-emerald-700 hover:text-emerald-900"
            onClick={() => setActionSuccessMessage(null)}
            type="button"
          >
            &times;
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          className={cn(
            "rounded-2xl border p-4 text-left transition",
            activeFilter === "all"
              ? "border-[var(--uxa-color-brand)] bg-[var(--uxa-color-brand)] text-white shadow-sm"
              : "border-[var(--uxa-color-border)] bg-white text-[var(--uxa-color-ink)] hover:border-[var(--uxa-color-brand)]",
          )}
          onClick={() => setActiveFilter("all")}
          type="button"
        >
          <p className={cn("text-[11px] font-black uppercase tracking-wider", activeFilter === "all" ? "text-white/80" : "text-[var(--uxa-color-ink-muted)]")}>
            {language === "es" ? "Total Solicitudes" : "Total Requests"}
          </p>
          <p className="mt-1 text-[24px] font-black">{counts.total}</p>
        </button>

        <button
          className={cn(
            "rounded-2xl border p-4 text-left transition",
            activeFilter === "pending"
              ? "border-amber-500 bg-amber-500 text-white shadow-sm"
              : "border-[var(--uxa-color-border)] bg-white text-[var(--uxa-color-ink)] hover:border-amber-400",
          )}
          onClick={() => setActiveFilter("pending")}
          type="button"
        >
          <div className="flex items-center justify-between">
            <p className={cn("text-[11px] font-black uppercase tracking-wider", activeFilter === "pending" ? "text-white/80" : "text-amber-700")}>
              {language === "es" ? "Pendientes" : "Pending"}
            </p>
            {counts.pending > 0 && (
              <span className={cn("inline-flex h-2 w-2 rounded-full", activeFilter === "pending" ? "bg-white" : "bg-amber-500 animate-pulse")} />
            )}
          </div>
          <p className="mt-1 text-[24px] font-black">{counts.pending}</p>
        </button>

        <button
          className={cn(
            "rounded-2xl border p-4 text-left transition",
            activeFilter === "approved"
              ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
              : "border-[var(--uxa-color-border)] bg-white text-[var(--uxa-color-ink)] hover:border-emerald-500",
          )}
          onClick={() => setActiveFilter("approved")}
          type="button"
        >
          <p className={cn("text-[11px] font-black uppercase tracking-wider", activeFilter === "approved" ? "text-white/80" : "text-emerald-700")}>
            {language === "es" ? "Aprobadas" : "Approved"}
          </p>
          <p className="mt-1 text-[24px] font-black">{counts.approved}</p>
        </button>

        <button
          className={cn(
            "rounded-2xl border p-4 text-left transition",
            activeFilter === "rejected"
              ? "border-rose-600 bg-rose-600 text-white shadow-sm"
              : "border-[var(--uxa-color-border)] bg-white text-[var(--uxa-color-ink)] hover:border-rose-400",
          )}
          onClick={() => setActiveFilter("rejected")}
          type="button"
        >
          <p className={cn("text-[11px] font-black uppercase tracking-wider", activeFilter === "rejected" ? "text-white/80" : "text-rose-700")}>
            {language === "es" ? "Rechazadas" : "Rejected"}
          </p>
          <p className="mt-1 text-[24px] font-black">{counts.rejected}</p>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search aria-hidden="true" className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--uxa-color-ink-muted)]" />
          <input
            className="w-full rounded-xl border border-[var(--uxa-color-border)] bg-white py-2 pl-10 pr-4 text-[13px] text-[var(--uxa-color-ink)] placeholder-[var(--uxa-color-ink-muted)] transition focus:border-[var(--uxa-color-brand)] focus:outline-none focus:ring-1 focus:ring-[var(--uxa-color-brand)]"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === "es"
                ? "Buscar por proyecto, usuario, email o motivo..."
                : "Search by project, user, email or reason..."
            }
            type="text"
            value={searchQuery}
          />
        </div>
      </div>

      {/* Requests List */}
      {status === "loading" ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--uxa-color-border)] bg-white py-16 text-center">
          <RefreshCw aria-hidden="true" className="h-8 w-8 animate-spin text-[var(--uxa-color-brand)]" />
          <p className="mt-3 text-[14px] font-semibold text-[var(--uxa-color-ink)]">
            {language === "es" ? "Cargando solicitudes..." : "Loading requests..."}
          </p>
        </div>
      ) : status === "error" ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-[13px] text-rose-900">
          <AlertCircle aria-hidden="true" className="mx-auto h-8 w-8 text-rose-600" />
          <p className="mt-2 font-bold">{errorMessage}</p>
          <button
            className="uxa-button uxa-button--secondary mt-4"
            onClick={() => void fetchRequests()}
            type="button"
          >
            {language === "es" ? "Reintentar" : "Retry"}
          </button>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--uxa-color-border)] bg-white py-16 text-center">
          <Inbox aria-hidden="true" className="h-10 w-10 text-[var(--uxa-color-ink-muted)]" />
          <h3 className="mt-3 text-[15px] font-black text-[var(--uxa-color-ink)]">
            {language === "es" ? "No se encontraron solicitudes" : "No requests found"}
          </h3>
          <p className="mt-1 max-w-sm text-[12px] text-[var(--uxa-color-ink-soft)]">
            {language === "es"
              ? activeFilter === "pending"
                ? "No hay solicitudes de acceso pendientes de revisión."
                : "No hay solicitudes que coincidan con los filtros aplicados."
              : "No access requests match the selected filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((item) => {
            const isPending = item.status === "pending";
            const isApproved = item.status === "approved";
            const isRejected = item.status === "rejected" || item.status === "canceled";
            const isAcp = item.product_key?.toLowerCase().includes("acp");
            const isResolving = resolvingId === item.id;
            const isRejecting = rejectingId === item.id;

            return (
              <UxaSurface
                className={cn(
                  "p-5 transition hover:shadow-md",
                  isPending && "border-l-4 border-l-amber-500",
                  isApproved && "border-l-4 border-l-emerald-500",
                  isRejected && "border-l-4 border-l-rose-500",
                )}
                key={item.id}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  {/* Left info */}
                  <div className="space-y-2.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <UxaBadge tone={isAcp ? "brand" : "info"}>
                        {isAcp ? "Agent Construction Package (ACP)" : "Blueprint Pro"}
                      </UxaBadge>
                      <UxaBadge
                        tone={
                          isPending
                            ? "warning"
                            : isApproved
                            ? "success"
                            : "danger"
                        }
                      >
                        {isPending
                          ? language === "es"
                            ? "Pendiente de revisión"
                            : "Pending Review"
                          : isApproved
                          ? language === "es"
                            ? "Aprobada"
                            : "Approved"
                          : language === "es"
                          ? "Rechazada"
                          : "Rejected"}
                      </UxaBadge>
                      <span className="flex items-center gap-1 text-[11px] text-[var(--uxa-color-ink-muted)]">
                        <Clock aria-hidden="true" className="h-3.5 w-3.5" />
                        {formatDate(item.created_at)}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-[16px] font-black text-[var(--uxa-color-ink)] truncate">
                          {item.project_title || (language === "es" ? "Proyecto sin título" : "Untitled Project")}
                        </h3>
                        {item.session_id && (
                          <Link
                            className="text-[var(--uxa-color-brand)] hover:underline inline-flex items-center gap-0.5 text-[12px] font-semibold"
                            href={`/projects/${item.session_id}/blueprint/pro`}
                            target="_blank"
                          >
                            <span>{language === "es" ? "Abrir proyecto" : "Open project"}</span>
                            <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                          </Link>
                        )}
                      </div>
                      <p className="text-[12px] text-[var(--uxa-color-ink-muted)]">
                        Workspace: <span className="font-semibold text-[var(--uxa-color-ink)]">{item.workspace_name || item.workspace_id}</span>
                      </p>
                    </div>

                    <div className="rounded-xl border border-[var(--uxa-color-border-soft)] bg-[var(--uxa-color-muted-panel)] p-3">
                      <div className="flex items-center gap-2 text-[12px] font-semibold text-[var(--uxa-color-ink)]">
                        <User aria-hidden="true" className="h-4 w-4 text-[var(--uxa-color-ink-muted)]" />
                        <span>{item.requester_name || item.requester_user_id}</span>
                        {item.requester_email && (
                          <span className="text-[var(--uxa-color-ink-muted)]">({item.requester_email})</span>
                        )}
                      </div>
                      {item.reason && (
                        <p className="mt-1.5 text-[12px] text-[var(--uxa-color-ink-soft)] leading-5">
                          <span className="font-semibold text-[var(--uxa-color-ink)]">
                            {language === "es" ? "Motivo: " : "Reason: "}
                          </span>
                          {item.reason}
                        </p>
                      )}
                    </div>

                    {/* Resolution details if already processed */}
                    {item.resolved_at && (
                      <div className="text-[11px] text-[var(--uxa-color-ink-muted)] pt-1">
                        <span>
                          {language === "es" ? "Resuelta el " : "Resolved on "}
                          {formatDate(item.resolved_at)}
                        </span>
                        {item.resolution_note && (
                          <span className="block mt-0.5 text-[var(--uxa-color-ink-soft)]">
                            {language === "es" ? "Nota: " : "Note: "}
                            {item.resolution_note}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Action buttons */}
                  {isPending && (
                    <div className="flex flex-col gap-2 shrink-0 sm:min-w-[200px]">
                      <button
                        className="uxa-button uxa-button--primary justify-center"
                        disabled={isResolving}
                        onClick={() => void handleResolve(item.id, "approved")}
                        type="button"
                      >
                        <ShieldCheck aria-hidden="true" className="h-4 w-4 mr-1.5" />
                        <span>
                          {isResolving
                            ? language === "es"
                              ? "Aprobando..."
                              : "Approving..."
                            : language === "es"
                            ? "Aprobar solicitud"
                            : "Approve request"}
                        </span>
                      </button>

                      {isRejecting ? (
                        <div className="space-y-2 rounded-xl border border-rose-200 bg-rose-50/50 p-3">
                          <input
                            className="w-full rounded-lg border border-rose-300 bg-white p-2 text-[12px] text-[var(--uxa-color-ink)] placeholder-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
                            onChange={(e) => setRejectNote(e.target.value)}
                            placeholder={language === "es" ? "Motivo del rechazo (opcional)" : "Rejection note (optional)"}
                            type="text"
                            value={rejectNote}
                          />
                          <div className="flex gap-2">
                            <button
                              className="uxa-button uxa-button--secondary justify-center flex-1 text-[11px] py-1 border-rose-300 text-rose-700 hover:bg-rose-100"
                              disabled={isResolving}
                              onClick={() => void handleResolve(item.id, "rejected", rejectNote)}
                              type="button"
                            >
                              {language === "es" ? "Confirmar" : "Confirm"}
                            </button>
                            <button
                              className="uxa-button uxa-button--secondary justify-center text-[11px] py-1"
                              onClick={() => {
                                setRejectingId(null);
                                setRejectNote("");
                              }}
                              type="button"
                            >
                              {language === "es" ? "Cancelar" : "Cancel"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          className="uxa-button uxa-button--secondary justify-center text-rose-700 hover:bg-rose-50 border-rose-200"
                          disabled={isResolving}
                          onClick={() => setRejectingId(item.id)}
                          type="button"
                        >
                          <XCircle aria-hidden="true" className="h-4 w-4 mr-1.5 text-rose-500" />
                          <span>{language === "es" ? "Rechazar" : "Reject"}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </UxaSurface>
            );
          })}
        </div>
      )}
    </div>
  );
}
