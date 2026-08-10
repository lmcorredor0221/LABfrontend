export const AUTH_WORKSPACE_STORAGE_KEY = "lean-builder.auth-workspace-id";

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storage = window.localStorage;
    return typeof storage?.getItem === "function" ? storage : null;
  } catch {
    return null;
  }
}

export function getStoredWorkspaceId() {
  const storage = getStorage();
  return storage?.getItem(AUTH_WORKSPACE_STORAGE_KEY) ?? null;
}

export function setStoredWorkspaceId(workspaceId: string) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.setItem(AUTH_WORKSPACE_STORAGE_KEY, workspaceId);
}

export function clearStoredWorkspaceId() {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.removeItem(AUTH_WORKSPACE_STORAGE_KEY);
}
