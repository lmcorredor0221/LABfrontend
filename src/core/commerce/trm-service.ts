export type Currency = "USD" | "COP";

export type TRMData = {
  unit_usd: number;
  trm_cop: number;
  date: string;
  source: string;
};

export type BasePricesData = {
  blueprint_free_usd: number;
  blueprint_pro_usd: number;
  acp_premium_usd: number;
  trm_cop: number;
};

const DEFAULT_TRM: TRMData = {
  unit_usd: 1.0,
  trm_cop: 3171.93,
  date: "2026-08-06",
  source: "Datos Abiertos Colombia / Superfinanciera",
};

export const DEFAULT_BASE_PRICES: BasePricesData = {
  blueprint_free_usd: 0.0,
  blueprint_pro_usd: 49.0,
  acp_premium_usd: 149.0,
  trm_cop: 3171.93,
};

export async function fetchTRM(): Promise<TRMData> {
  try {
    const res = await fetch("/api/v1/commerce/trm");
    if (res.ok) {
      const data = await res.json();
      if (data?.trm_cop) {
        return {
          unit_usd: 1.0,
          trm_cop: Number(data.trm_cop),
          date: String(data.date || "2026-08-06"),
          source: String(data.source || "TRM Oficial"),
        };
      }
    }
  } catch (err) {
    console.warn("No se pudo obtener TRM del backend, usando fallback:", err);
  }
  return DEFAULT_TRM;
}

export async function fetchBasePrices(): Promise<BasePricesData> {
  try {
    const res = await fetch("/api/v1/commerce/base-prices");
    if (res.ok) {
      const data = await res.json();
      if (data?.blueprint_pro_usd !== undefined) {
        return {
          blueprint_free_usd: 0.0,
          blueprint_pro_usd: Number(data.blueprint_pro_usd ?? 49.0),
          acp_premium_usd: Number(data.acp_premium_usd ?? 149.0),
          trm_cop: Number(data.trm_cop ?? 3171.93),
        };
      }
    }
  } catch (err) {
    console.warn("No se pudo obtener Precios Base del backend, usando fallback:", err);
  }
  return DEFAULT_BASE_PRICES;
}

export function formatPriceValue(
  usdAmount: number,
  targetCurrency: Currency,
  trmRate: number,
  fallbackCopAmount?: number
): string {
  if (usdAmount === 0) {
    return "$0";
  }

  if (targetCurrency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(usdAmount);
  }

  const copValue = fallbackCopAmount ?? Math.round(usdAmount * trmRate);
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(copValue);
}
