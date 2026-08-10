export type Currency = "USD" | "COP";

export type TRMData = {
  unit_usd: number;
  trm_cop: number;
  date: string;
  source: string;
};

const DEFAULT_TRM: TRMData = {
  unit_usd: 1.0,
  trm_cop: 3171.93,
  date: "2026-08-06",
  source: "Datos Abiertos Colombia / Superfinanciera",
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
