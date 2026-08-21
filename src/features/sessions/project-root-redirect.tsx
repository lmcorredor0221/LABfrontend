"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppButton } from "@/components/lean/ui";
import { getProjectRouteFromJourneyOverview } from "@/features/sessions/session-routes";
import { useSessions } from "@/features/sessions/session-context";
import type { ProductJourneyOverview } from "@/features/product-experience/saas/product-journey-overview";
import { ErrorState, LoadingState } from "@/shared/states/runtime-states";

type LoadState = "loading" | "error";

export function ProjectRootRedirect({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const { getProductJourneyOverview, selectSession } = useSessions();
  const [status, setStatus] = useState<LoadState>("loading");
  const [error, setError] = useState("");

  const resolveRoute = useCallback(
    async (overview: ProductJourneyOverview) => {
      await selectSession(sessionId, { loadSnapshot: false, persist: true });
      router.replace(getProjectRouteFromJourneyOverview(sessionId, overview) ?? `/projects/${sessionId}/blueprint`);
    },
    [router, selectSession, sessionId],
  );

  const load = useCallback(async () => {
    setStatus("loading");
    setError("");
    try {
      const overview = await getProductJourneyOverview(sessionId);
      await resolveRoute(overview);
    } catch (loadError) {
      setStatus("error");
      setError(loadError instanceof Error ? loadError.message : "No se pudo resolver la siguiente ruta del proyecto.");
    }
  }, [getProductJourneyOverview, resolveRoute, sessionId]);

  useEffect(() => {
    let mounted = true;

    globalThis.queueMicrotask(() => {
      if (mounted) {
        void load();
      }
    });

    return () => {
      mounted = false;
    };
  }, [load]);

  if (status === "error") {
    return (
      <div className="min-h-screen bg-[#f3f6fa] px-4 py-8 sm:px-6 lg:px-8">
        <ErrorState
          action={<AppButton onClick={() => void load()}>Reintentar</AppButton>}
          description={error || "No fue posible cargar el progreso canonico del proyecto."}
          title="No se pudo abrir el siguiente paso"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f6fa] px-4 py-8 sm:px-6 lg:px-8">
      <LoadingState
        description="Estamos leyendo el progreso canonico y buscando tu siguiente accion."
        title="Abriendo tu proyecto"
      />
    </div>
  );
}
