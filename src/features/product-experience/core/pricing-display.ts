import type { Currency } from "@/core/commerce/trm-service";

export interface ProductPricingDisplay {
  primaryLabel: string;
  secondaryApproxLabel: string;
  combinedCtaLabel: string;
  usdAmount: number;
}

/**
 * Formats a dynamic tier price with dual-currency transparency (USD + COP equivalent).
 */
export function getProductPricingDisplay({
  usdAmount,
  currency,
  trmCop,
  formatPrice,
}: {
  usdAmount: number;
  currency: Currency;
  trmCop: number;
  formatPrice: (usd: number) => string;
}): ProductPricingDisplay {
  const formattedPrimary = formatPrice(usdAmount);
  const primaryLabel = `${formattedPrimary} ${currency}`;

  let secondaryApproxLabel = "";
  let combinedCtaLabel = primaryLabel;

  if (currency === "USD") {
    const copEquiv = Math.round(usdAmount * trmCop);
    secondaryApproxLabel = `~$${copEquiv.toLocaleString("es-CO")} COP`;
    combinedCtaLabel = `${primaryLabel} (${secondaryApproxLabel})`;
  } else {
    // If currency is COP, formatPrice already returns the converted amount
    secondaryApproxLabel = `$${usdAmount.toLocaleString("en-US")} USD`;
    combinedCtaLabel = primaryLabel;
  }

  return {
    primaryLabel,
    secondaryApproxLabel,
    combinedCtaLabel,
    usdAmount,
  };
}
