export const AUTH_TOKEN_STORAGE_KEY = "lean-builder.auth-token";

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
  return storage?.getItem(AUTH_TOKEN_STORAGE_KEY) ?? null;
}

export function setStoredToken(token: string) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken() {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}
