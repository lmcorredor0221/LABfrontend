"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { apiClient } from "@/core/api";
import { useAuth } from "@/core/auth/auth-context";
import {
  DEFAULT_BASE_PRICES,
  fetchBasePrices,
  fetchTRM,
  formatPriceValue,
  type BasePricesData,
  type Currency,
  type TRMData,
} from "@/core/commerce/trm-service";

type CurrencyContextType = {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  trm: TRMData;
  basePrices: BasePricesData;
  formatPrice: (usdAmount: number, fallbackCopAmount?: number) => string;
  refreshTRM: () => Promise<void>;
  refreshBasePrices: () => Promise<void>;
};

const DEFAULT_TRM: TRMData = {
  unit_usd: 1.0,
  trm_cop: 3171.93,
  date: "2026-08-06",
  source: "Datos Abiertos Colombia / Superfinanciera",
};

const CURRENCY_STORAGE_KEY = "lean_app_currency";
const CURRENCY_STORAGE_OWNER_KEY = "lean_app_currency_user_id";
const CURRENCY_MIGRATION_PREFIX = "lean_app_currency_backend_migrated:";

function normalizeCurrency(value: string | null | undefined): Currency | null {
  if (value === "USD" || value === "COP") {
    return value;
  }
  return null;
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }
  const storage = window.localStorage;
  return typeof storage?.getItem === "function" && typeof storage?.setItem === "function" ? storage : null;
}

function readStoredCurrency(): Currency | null {
  try {
    return normalizeCurrency(getStorage()?.getItem(CURRENCY_STORAGE_KEY));
  } catch {
    return null;
  }
}

function readStoredCurrencyOwnerId(): string | null {
  try {
    return getStorage()?.getItem(CURRENCY_STORAGE_OWNER_KEY) ?? null;
  } catch {
    return null;
  }
}

function writeStoredCurrency(currency: Currency, userId?: string | null) {
  try {
    const storage = getStorage();
    storage?.setItem(CURRENCY_STORAGE_KEY, currency);
    if (userId) {
      storage?.setItem(CURRENCY_STORAGE_OWNER_KEY, userId);
    }
  } catch {
    // Ignore storage errors
  }
}

function hasMigrationMarker(userId: string): boolean {
  try {
    return getStorage()?.getItem(`${CURRENCY_MIGRATION_PREFIX}${userId}`) === "1";
  } catch {
    return false;
  }
}

function markMigration(userId: string) {
  try {
    getStorage()?.setItem(`${CURRENCY_MIGRATION_PREFIX}${userId}`, "1");
  } catch {
    // Ignore storage errors
  }
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "COP",
  setCurrency: () => {},
  trm: DEFAULT_TRM,
  basePrices: DEFAULT_BASE_PRICES,
  formatPrice: (usdAmount: number, fallbackCopAmount?: number) =>
    formatPriceValue(usdAmount, "COP", 3171.93, fallbackCopAmount),
  refreshTRM: async () => {},
  refreshBasePrices: async () => {},
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const [currency, setCurrencyState] = useState<Currency>("COP");
  const [trm, setTrm] = useState<TRMData>(DEFAULT_TRM);
  const [basePrices, setBasePrices] = useState<BasePricesData>(DEFAULT_BASE_PRICES);
  const migrationInFlightRef = useRef<string | null>(null);

  useEffect(() => {
    void loadTRM();
    void loadBasePrices();
  }, []);

  useEffect(() => {
    const storedCurrency = readStoredCurrency();
    const backendCurrency = normalizeCurrency(auth.user?.preferred_currency);
    const userId = auth.user?.id ?? null;

    if (auth.status !== "authenticated" || !userId) {
      if (storedCurrency) {
        queueMicrotask(() => setCurrencyState(storedCurrency));
      }
      return;
    }

    const storedOwnerId = readStoredCurrencyOwnerId();
    const migrationKey = `${CURRENCY_MIGRATION_PREFIX}${userId}`;
    const canMigrateLegacyStorage =
      storedCurrency != null &&
      backendCurrency != null &&
      storedCurrency !== backendCurrency &&
      !hasMigrationMarker(userId) &&
      (storedOwnerId == null || storedOwnerId === userId);

    if (canMigrateLegacyStorage && migrationInFlightRef.current !== migrationKey) {
      migrationInFlightRef.current = migrationKey;
      queueMicrotask(() => setCurrencyState(storedCurrency));
      writeStoredCurrency(storedCurrency, userId);
      void apiClient
        .patch("/api/v1/auth/currency", {
          body: { preferred_currency: storedCurrency },
        })
        .then(() => {
          markMigration(userId);
        })
        .catch(() => {
          const fallbackCurrency = backendCurrency ?? "COP";
          queueMicrotask(() => setCurrencyState(fallbackCurrency));
          writeStoredCurrency(fallbackCurrency, userId);
        })
        .finally(() => {
          migrationInFlightRef.current = null;
        });
      return;
    }

    const resolvedCurrency = backendCurrency ?? storedCurrency ?? "COP";
    queueMicrotask(() => setCurrencyState(resolvedCurrency));
    writeStoredCurrency(resolvedCurrency, userId);
    markMigration(userId);
  }, [auth.status, auth.user?.id, auth.user?.preferred_currency]);

  async function loadTRM() {
    const data = await fetchTRM();
    setTrm(data);
  }

  async function loadBasePrices() {
    const prices = await fetchBasePrices();
    setBasePrices(prices);
  }

  function setCurrency(c: Currency) {
    const previousCurrency = currency;
    setCurrencyState(c);
    writeStoredCurrency(c, auth.user?.id ?? null);

    if (auth.status !== "authenticated" || !auth.user?.id) {
      return;
    }

    void apiClient
      .patch("/api/v1/auth/currency", {
        body: { preferred_currency: c },
      })
      .then(() => {
        markMigration(auth.user!.id);
      })
      .catch(() => {
        setCurrencyState(previousCurrency);
        writeStoredCurrency(previousCurrency, auth.user?.id ?? null);
      });
  }

  function formatPrice(usdAmount: number, fallbackCopAmount?: number): string {
    return formatPriceValue(usdAmount, currency, trm.trm_cop, fallbackCopAmount);
  }

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        trm,
        basePrices,
        formatPrice,
        refreshTRM: loadTRM,
        refreshBasePrices: loadBasePrices,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
