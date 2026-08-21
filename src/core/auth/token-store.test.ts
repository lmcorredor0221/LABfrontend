import {
  AUTH_TOKEN_STORAGE_KEY,
  LEGACY_AUTH_TOKEN_STORAGE_KEY,
  clearLegacyStoredToken,
  clearStoredToken,
  getStoredToken,
  setStoredToken,
} from "@/core/auth/token-store";

function replaceLocalStorage(storage: Pick<Storage, "getItem" | "removeItem" | "setItem">) {
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: storage,
  });
}

describe("auth token store", () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    replaceLocalStorage({
      getItem: vi.fn((key: string) => values.get(key) ?? null),
      removeItem: vi.fn((key: string) => {
        values.delete(key);
      }),
      setItem: vi.fn((key: string, value: string) => {
        values.set(key, value);
      }),
    });
  });

  it("persists and clears only the canonical auth token key", () => {
    window.localStorage.setItem(LEGACY_AUTH_TOKEN_STORAGE_KEY, "legacy-token");

    expect(setStoredToken("new-token")).toBe(true);
    expect(getStoredToken()).toBe("new-token");
    expect(window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe("new-token");
    expect(window.localStorage.getItem(LEGACY_AUTH_TOKEN_STORAGE_KEY)).toBe("legacy-token");

    expect(clearStoredToken()).toBe(true);
    expect(getStoredToken()).toBeNull();
    expect(window.localStorage.getItem(LEGACY_AUTH_TOKEN_STORAGE_KEY)).toBe("legacy-token");
  });

  it("removes the legacy registration token key explicitly", () => {
    window.localStorage.setItem(LEGACY_AUTH_TOKEN_STORAGE_KEY, "legacy-token");

    expect(clearLegacyStoredToken()).toBe(true);

    expect(window.localStorage.getItem(LEGACY_AUTH_TOKEN_STORAGE_KEY)).toBeNull();
  });

  it("returns safe failures when browser storage is blocked", () => {
    replaceLocalStorage({
      getItem: vi.fn(() => {
        throw new DOMException("Blocked", "SecurityError");
      }),
      removeItem: vi.fn(() => {
        throw new DOMException("Blocked", "SecurityError");
      }),
      setItem: vi.fn(() => {
        throw new DOMException("Blocked", "SecurityError");
      }),
    });

    expect(getStoredToken()).toBeNull();
    expect(setStoredToken("new-token")).toBe(false);
    expect(clearStoredToken()).toBe(false);
    expect(clearLegacyStoredToken()).toBe(false);
  });
});
