"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppButton } from "@/components/lean/ui";
import { createAuthStore, type AuthStore } from "@/core/auth/auth-store";
import {
  LANGUAGE_COOKIE_NAME,
  LANGUAGE_STORAGE_KEY,
  resolveInitialLanguage,
} from "@/core/i18n/language-config";
import { translateKey, type SupportedLanguage } from "@/core/i18n/language-context";
import { isPublicRoute, LOGIN_ROUTE } from "@/core/routing/routes";
import { ErrorState, LoadingState } from "@/shared/states/runtime-states";

const AuthStoreContext = createContext<AuthStore | null>(null);

function resolveLanguage(): SupportedLanguage {
  if (typeof window === "undefined") {
    return "es";
  }

  try {
    const stored = window.localStorage?.getItem?.(LANGUAGE_STORAGE_KEY);
    if (stored) {
      return resolveInitialLanguage(stored, "es");
    }
  } catch {
    // Ignore storage errors in restricted test environments
  }

  try {
    const cookieMatch = document?.cookie
      ?.split(";")
      ?.map((item) => item.trim())
      ?.find((item) => item.startsWith(`${LANGUAGE_COOKIE_NAME}=`));
    return resolveInitialLanguage(cookieMatch?.split("=")[1], "es");
  } catch {
    return "es";
  }
}

function AuthGate({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const publicRoute = isPublicRoute(pathname ?? "/");
  const [hydratedLanguage, setHydratedLanguage] = useState<SupportedLanguage>("es");
  const enterpriseThemeFixtureRoute =
    process.env.NODE_ENV !== "production"
    && pathname?.startsWith("/projects/enterprise-theme-fixture");

  useEffect(() => {
    setHydratedLanguage(resolveLanguage());
  }, []);

  useEffect(() => {
    if (!auth.isHydrated || publicRoute || enterpriseThemeFixtureRoute) {
      return;
    }

    if (auth.status === "anonymous") {
      router.replace(LOGIN_ROUTE);
    }
  }, [auth.isHydrated, auth.status, enterpriseThemeFixtureRoute, publicRoute, router]);

  if (publicRoute || enterpriseThemeFixtureRoute) {
    return <>{children}</>;
  }

  if (!auth.isHydrated || auth.status === "idle" || auth.status === "hydrating") {
    return (
      <div className="min-h-screen bg-[var(--surface-canvas)] px-4 py-8">
        <div className="mx-auto max-w-[720px]">
          <LoadingState
            description={translateKey(hydratedLanguage, "auth.restoreDesc", "Estamos restaurando tu sesión local antes de abrir el workspace.")}
            title={translateKey(hydratedLanguage, "auth.restoreTitle", "Recuperando acceso")}
          />
        </div>
      </div>
    );
  }

  if (auth.status === "error") {
    return (
      <div className="min-h-screen bg-[var(--surface-canvas)] px-4 py-8">
        <div className="mx-auto max-w-[720px] space-y-5">
          <ErrorState
            action={
              <AppButton onClick={() => void auth.hydrate({ force: true })} variant="primary">
                {translateKey(hydratedLanguage, "auth.retry", "Reintentar autenticación")}
              </AppButton>
            }
            description={auth.error?.message ?? translateKey(hydratedLanguage, "auth.errorDesc", "No pudimos validar tu sesión local con el backend.")}
            title={translateKey(hydratedLanguage, "auth.errorTitle", "No se pudo restaurar la sesión")}
          />
        </div>
      </div>
    );
  }

  if (auth.status === "anonymous") {
    return (
      <div className="min-h-screen bg-[var(--surface-canvas)] px-4 py-8">
        <div className="mx-auto max-w-[720px]">
          <LoadingState
            description={translateKey(hydratedLanguage, "auth.redirectDesc", "No detectamos una sesión válida. Te llevamos al login.")}
            title={translateKey(hydratedLanguage, "auth.redirectTitle", "Redirigiendo al login")}
          />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function AuthProvider({
  children,
  store,
}: {
  children: ReactNode;
  store?: AuthStore;
}) {
  const [authStore] = useState(() => store ?? createAuthStore());

  useEffect(() => {
    void authStore.hydrate();
  }, [authStore]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    function handleUnauthorized() {
      authStore.clear();
    }

    window.addEventListener("lean-builder:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("lean-builder:unauthorized", handleUnauthorized);
  }, [authStore]);

  return (
    <AuthStoreContext.Provider value={authStore}>
      <AuthGate>{children}</AuthGate>
    </AuthStoreContext.Provider>
  );
}

export function useAuth() {
  const store = useContext(AuthStoreContext);

  if (!store) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState);

  return {
    ...state,
    clear: store.clear,
    hydrate: store.hydrate,
    login: store.login,
    logout: store.logout,
    selectWorkspace: store.selectWorkspace,
  };
}
