"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { fetchTRM, formatPriceValue, type Currency, type TRMData } from "@/core/commerce/trm-service";

type CurrencyContextType = {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  trm: TRMData;
  formatPrice: (usdAmount: number, fallbackCopAmount?: number) => string;
  refreshTRM: () => Promise<void>;
};

const DEFAULT_TRM: TRMData = {
  unit_usd: 1.0,
  trm_cop: 3171.93,
  date: "2026-08-06",
  source: "Datos Abiertos Colombia / Superfinanciera",
};

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "COP",
  setCurrency: () => {},
  trm: DEFAULT_TRM,
  formatPrice: (usdAmount: number, fallbackCopAmount?: number) =>
    formatPriceValue(usdAmount, "COP", 3171.93, fallbackCopAmount),
  refreshTRM: async () => {},
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("COP");
  const [trm, setTrm] = useState<TRMData>(DEFAULT_TRM);

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage && typeof window.localStorage.getItem === "function") {
        const savedCurrency = window.localStorage.getItem("lean_app_currency") as Currency | null;
        if (savedCurrency === "USD" || savedCurrency === "COP") {
          setCurrencyState(savedCurrency);
        }
      }
    } catch {
      // Ignore storage errors in test or SSR environments
    }
    void loadTRM();
  }, []);

  async function loadTRM() {
    const data = await fetchTRM();
    setTrm(data);
  }

  function setCurrency(c: Currency) {
    setCurrencyState(c);
    try {
      if (typeof window !== "undefined" && window.localStorage && typeof window.localStorage.setItem === "function") {
        window.localStorage.setItem("lean_app_currency", c);
      }
    } catch {
      // Ignore storage errors
    }
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
        formatPrice,
        refreshTRM: loadTRM,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
