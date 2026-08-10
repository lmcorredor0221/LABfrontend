import { ApiError } from "@/core/api";
import { authApi, type AuthApi } from "@/core/auth/auth-api";
import type { AuthState, LoginCredentials } from "@/core/auth/types";
import { clearStoredToken, getStoredToken, setStoredToken } from "@/core/auth/token-store";
import { clearStoredWorkspaceId, setStoredWorkspaceId } from "@/core/auth/workspace-store";

type Listener = () => void;

export type AuthHydrateOptions = {
  force?: boolean;
  redirectOnUnauthorized?: boolean;
};

type AuthStoreDependencies = {
  api?: AuthApi;
  clearToken?: () => void;
  clearWorkspaceId?: () => void;
  loadToken?: () => string | null;
  persistToken?: (token: string) => void;
  persistWorkspaceId?: (workspaceId: string) => void;
};

function createInitialState(loadToken: () => string | null): AuthState {
  return {
    error: null,
    isHydrated: false,
    status: "idle",
    token: loadToken(),
    user: null,
  };
}

function toApiError(error: unknown) {
  if (error instanceof ApiError) {
    return error;
  }

  return ApiError.fromClientError({
    details: error,
    message: "No se pudo completar la autenticacion.",
  });
}

export function createAuthStore({
  api = authApi,
  clearToken = clearStoredToken,
  clearWorkspaceId = clearStoredWorkspaceId,
  loadToken = getStoredToken,
  persistToken = setStoredToken,
  persistWorkspaceId = setStoredWorkspaceId,
}: AuthStoreDependencies = {}) {
  const listeners = new Set<Listener>();
  let state = createInitialState(loadToken);
  let hydratePromise: Promise<AuthState> | null = null;

  function emit() {
    listeners.forEach((listener) => listener());
  }

  function updateState(nextState: AuthState | ((currentState: AuthState) => AuthState)) {
    state = typeof nextState === "function" ? nextState(state) : nextState;
    emit();
    return state;
  }

  function setAnonymousState(error: ApiError | null = null) {
    clearWorkspaceId();
    return updateState({
      error,
      isHydrated: true,
      status: "anonymous",
      token: null,
      user: null,
    });
  }

  async function hydrate(options: AuthHydrateOptions = {}) {
    const { force = false, redirectOnUnauthorized = false } = options;

    if (hydratePromise && !force) {
      return hydratePromise;
    }

    const token = loadToken();
    if (!token) {
      return Promise.resolve(setAnonymousState());
    }

    updateState((currentState) => ({
      ...currentState,
      error: null,
      status: "hydrating",
      token,
    }));

    hydratePromise = (async () => {
      try {
        const user = await api.me({
          redirectOnUnauthorized,
          token,
        });
        if (user.active_workspace_id) {
          persistWorkspaceId(user.active_workspace_id);
        } else {
          clearWorkspaceId();
        }

        return updateState({
          error: null,
          isHydrated: true,
          status: "authenticated",
          token,
          user,
        });
      } catch (error) {
        const apiError = toApiError(error);

        if (apiError.status === 401) {
          clearToken();
          clearWorkspaceId();
          return setAnonymousState();
        }

        if (apiError.status === 403) {
          clearWorkspaceId();
          try {
            const recoveredUser = await api.me({
              redirectOnUnauthorized,
              token,
            });
            if (recoveredUser.active_workspace_id) {
              persistWorkspaceId(recoveredUser.active_workspace_id);
            }
            return updateState({
              error: null,
              isHydrated: true,
              status: "authenticated",
              token,
              user: recoveredUser,
            });
          } catch (recoveryError) {
            const recoveryApiError = toApiError(recoveryError);
            updateState({
              error: recoveryApiError,
              isHydrated: true,
              status: "error",
              token,
              user: null,
            });
            throw recoveryApiError;
          }
        }

        updateState({
          error: apiError,
          isHydrated: true,
          status: "error",
          token,
          user: null,
        });

        throw apiError;
      } finally {
        hydratePromise = null;
      }
    })();

    return hydratePromise;
  }

  async function login(credentials: LoginCredentials) {
    updateState((currentState) => ({
      ...currentState,
      error: null,
      status: "submitting",
    }));

    try {
      const response = await api.login(credentials);
      persistToken(response.access_token);
      if (response.user.active_workspace_id) {
        persistWorkspaceId(response.user.active_workspace_id);
      } else {
        clearWorkspaceId();
      }

      return updateState({
        error: null,
        isHydrated: true,
        status: "authenticated",
        token: response.access_token,
        user: response.user,
      });
    } catch (error) {
      const apiError = toApiError(error);
      setAnonymousState(apiError);
      throw apiError;
    }
  }

  async function selectWorkspace(workspaceId: string) {
    const token = state.token ?? loadToken();

    if (!token) {
      return setAnonymousState();
    }

    updateState((currentState) => ({
      ...currentState,
      error: null,
      status: "submitting",
    }));

    try {
      const user = await api.selectWorkspace(workspaceId, {
        redirectOnUnauthorized: false,
        token,
      });
      if (user.active_workspace_id) {
        persistWorkspaceId(user.active_workspace_id);
      } else {
        clearWorkspaceId();
      }
      return updateState((currentState) => ({
        ...currentState,
        error: null,
        status: "authenticated",
        token,
        user,
      }));
    } catch (error) {
      const apiError = toApiError(error);

      if (apiError.status === 401) {
        clearToken();
        return setAnonymousState();
      }

      updateState((currentState) => ({
        ...currentState,
        error: apiError,
        status: currentState.user ? "authenticated" : "error",
      }));
      throw apiError;
    }
  }

  async function logout() {
    const token = state.token ?? loadToken();

    updateState((currentState) => ({
      ...currentState,
      error: null,
      status: "submitting",
    }));

    try {
      if (token) {
        await api.logout({ token });
      }
    } catch {
      // Local logout should still succeed even if token revocation fails remotely.
    } finally {
      clearToken();
      clearWorkspaceId();
      setAnonymousState();
    }

    return state;
  }

  function clear() {
    clearToken();
    clearWorkspaceId();
    return setAnonymousState();
  }

  return {
    clear,
    getState: () => state,
    hydrate,
    login,
    logout,
    selectWorkspace,
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export type AuthStore = ReturnType<typeof createAuthStore>;
