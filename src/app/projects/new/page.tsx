"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/core/auth/auth-context";
import { useLanguage } from "@/core/i18n/language-context";
import { byLanguage } from "@/features/product-experience/core/localized-copy";
import { useSessions } from "@/features/sessions/session-context";

export default function NewProjectPage() {
  const router = useRouter();
  const auth = useAuth();
  const sessions = useSessions();
  const { language } = useLanguage();
  const [error, setError] = useState<string | null>(null);
  const initiatedRef = useRef(false);

  useEffect(() => {
    if (!auth.isHydrated) {
      return;
    }

    if (auth.status === "anonymous") {
      router.replace("/login?redirect=/projects/new");
      return;
    }

    if (initiatedRef.current) {
      return;
    }
    initiatedRef.current = true;

    async function initializeProject() {
      setError(null);

      try {
        // Read any pending prefill from landing initiative evaluator
        let prefillData: Record<string, unknown> | null = null;
        if (typeof window !== "undefined") {
          try {
            const rawPrefill =
              window.sessionStorage.getItem("pending_initiative_prefill") ||
              window.localStorage.getItem("pending_initiative_prefill");
            if (rawPrefill) {
              prefillData = JSON.parse(rawPrefill);
            }
          } catch {
            // Ignore parse errors
          }
        }

        // Create the session
        const session = await sessions.createSession({ loadSnapshot: false });

        // Save prefill associated with created session
        if (prefillData && typeof window !== "undefined") {
          try {
            window.sessionStorage.setItem(
              `session_eval_prefill_${session.id}`,
              JSON.stringify(prefillData),
            );
            window.localStorage.setItem(
              `session_eval_prefill_${session.id}`,
              JSON.stringify(prefillData),
            );
            window.sessionStorage.removeItem("pending_initiative_prefill");
            window.localStorage.removeItem("pending_initiative_prefill");
          } catch {
            // Ignore storage errors
          }
        }

        // Select the session
        await sessions.selectSession(session.id, {
          loadSnapshot: false,
          persist: true,
        });

        // Navigate to Discover stage
        router.replace(`/projects/${session.id}/discover`);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : byLanguage(language, {
                es: "No se pudo inicializar el nuevo proyecto.",
                en: "Could not initialize new project.",
                pt: "Não foi possível inicializar o novo projeto.",
              }),
        );
      }
    }

    void initializeProject();
  }, [auth.isHydrated, auth.status, language, router, sessions]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25 animate-pulse">
            <Sparkles className="h-7 w-7" />
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-950/40 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-center gap-2 text-rose-400 font-bold">
              <AlertCircle className="h-5 w-5" />
              <span>
                {byLanguage(language, {
                  es: "Error al crear proyecto",
                  en: "Error creating project",
                  pt: "Erro ao criar projeto",
                })}
              </span>
            </div>
            <p className="text-xs text-rose-200/80 leading-relaxed">{error}</p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={() => {
                  initiatedRef.current = false;
                  window.location.reload();
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition shadow-lg shadow-rose-600/30"
              >
                {byLanguage(language, {
                  es: "Reintentar",
                  en: "Retry",
                  pt: "Tentar novamente",
                })}
              </button>
              <button
                type="button"
                onClick={() => router.replace("/projects")}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
              >
                {byLanguage(language, {
                  es: "Ver mis proyectos",
                  en: "View my projects",
                  pt: "Ver meus projetos",
                })}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h1 className="text-2xl font-extrabold tracking-tight">
              {byLanguage(language, {
                es: "Iniciando tu Blueprint...",
                en: "Starting your Blueprint...",
                pt: "Iniciando seu Blueprint...",
              })}
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              {byLanguage(language, {
                es: "Preparando el espacio de trabajo agéntico y configurando la metodología Lean.",
                en: "Preparing the agentic workspace and configuring Lean methodology.",
                pt: "Preparando o espaço de trabalho agêntico e configurando a metodologia Lean.",
              })}
            </p>
            <div className="flex justify-center pt-4">
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
