"use client";

import { useCallback, useEffect, useState } from "react";
import { AppButton, Badge, Panel } from "@/components/lean/ui";
import { apiClient } from "@/core/api";
import { useCurrency } from "@/core/commerce/currency-context";
import { formatPriceValue } from "@/core/commerce/trm-service";
import { cn } from "@/lib/utils";

const DEFAULT_BLUEPRINT_PRO_USD = 49;
const DEFAULT_ACP_PREMIUM_USD = 149;

export function PlatformBasePricesAdminPanel() {
  const { trm } = useCurrency();
  const [blueprintProUsd, setBlueprintProUsd] = useState(DEFAULT_BLUEPRINT_PRO_USD);
  const [acpPremiumUsd, setAcpPremiumUsd] = useState(DEFAULT_ACP_PREMIUM_USD);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState("");

  const loadBasePrices = useCallback(async () => {
    try {
      const data = await apiClient.get<{ blueprint_pro_usd: number; acp_premium_usd: number }>("/api/v1/commerce/base-prices");
      if (data.blueprint_pro_usd) setBlueprintProUsd(data.blueprint_pro_usd);
      if (data.acp_premium_usd) setAcpPremiumUsd(data.acp_premium_usd);
    } catch {
      // fallback
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Settings debe cargar precios base iniciales desde backend al montar.
    void loadBasePrices();
  }, [loadBasePrices]);

  async function handleSavePrices() {
    setSaveStatus("saving");
    try {
      await apiClient.patch("/api/v1/commerce/base-prices", {
        body: {
          blueprint_pro_usd: Number(blueprintProUsd),
          acp_premium_usd: Number(acpPremiumUsd),
        },
      });
      setSaveStatus("saved");
      setSaveMessage("Precios base en USD de la plataforma actualizados exitosamente.");
      setTimeout(() => setSaveStatus("idle"), 3500);
    } catch (err) {
      setSaveStatus("error");
      setSaveMessage(err instanceof Error ? err.message : "Error al actualizar los precios base.");
    }
  }

  return (
    <Panel className="border-[var(--border-default)] bg-white p-5 lg:p-6 space-y-5">
      <div>
        <Badge tone="blue">Gobierno de Plataforma</Badge>
        <h3 className="mt-2 text-[20px] font-semibold text-[var(--text-primary)]">
          Administración de Precios Base (USD)
        </h3>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
          Configuración transversal de la plataforma. Defina los precios base en dólares estadounidenses (USD) que el sistema utiliza para calcular los planes de todos los usuarios.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-[12px] font-semibold text-[var(--text-secondary)] mb-1">
            Blueprint Profesional (USD)
          </label>
          <div className="flex items-center rounded-[8px] border border-[var(--border-default)] bg-white px-3 py-2">
            <span className="text-[14px] text-[var(--text-secondary)] mr-2">$</span>
            <input
              type="number"
              min="0"
              step="1"
              value={blueprintProUsd}
              onChange={(e) => setBlueprintProUsd(Number(e.target.value))}
              className="w-full text-[14px] font-semibold text-[var(--text-primary)] outline-none bg-transparent"
            />
            <span className="text-[12px] text-[var(--text-muted)] ml-2">USD</span>
          </div>
          <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
            Equivalente COP actual: <strong className="text-[var(--text-primary)]">{formatPriceValue(blueprintProUsd, "COP", trm.trm_cop)}</strong>
          </p>
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-[var(--text-secondary)] mb-1">
            ACP Premium (USD)
          </label>
          <div className="flex items-center rounded-[8px] border border-[var(--border-default)] bg-white px-3 py-2">
            <span className="text-[14px] text-[var(--text-secondary)] mr-2">$</span>
            <input
              type="number"
              min="0"
              step="1"
              value={acpPremiumUsd}
              onChange={(e) => setAcpPremiumUsd(Number(e.target.value))}
              className="w-full text-[14px] font-semibold text-[var(--text-primary)] outline-none bg-transparent"
            />
            <span className="text-[12px] text-[var(--text-muted)] ml-2">USD</span>
          </div>
          <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
            Equivalente COP actual: <strong className="text-[var(--text-primary)]">{formatPriceValue(acpPremiumUsd, "COP", trm.trm_cop)}</strong>
          </p>
        </div>
      </div>

      {saveMessage ? (
        <p className={cn("text-[12px]", saveStatus === "saved" ? "text-emerald-600 font-medium" : "text-red-600 font-medium")}>
          {saveMessage}
        </p>
      ) : null}

      <AppButton
        onClick={() => void handleSavePrices()}
        loading={saveStatus === "saving"}
        variant="primary"
        className="h-10 rounded-[9px] px-5"
      >
        Guardar Precios Base (USD)
      </AppButton>
    </Panel>
  );
}
