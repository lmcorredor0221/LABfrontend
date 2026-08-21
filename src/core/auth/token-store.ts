export const AUTH_TOKEN_STORAGE_KEY = "lean-builder.auth-token";
export const LEGACY_AUTH_TOKEN_STORAGE_KEY = "antigravity_auth_token";

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

export function getStoredToken() {
  const storage = getStorage();

  try {
    return storage?.getItem(AUTH_TOKEN_STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

export function setStoredToken(token: string) {
  const storage = getStorage();

  if (!storage) {
    return false;
  }

  try {
    storage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    return true;
  } catch {
    return false;
  }
}

export function clearStoredToken() {
  const storage = getStorage();

  if (!storage) {
    return false;
  }

  try {
    storage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function clearLegacyStoredToken() {
  const storage = getStorage();

  if (!storage) {
    return false;
  }

  try {
    storage.removeItem(LEGACY_AUTH_TOKEN_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
