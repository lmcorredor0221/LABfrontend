import { fireEvent, render, screen } from "@testing-library/react";
import { BarChart3, Settings, ShieldCheck } from "lucide-react";
import {
  AdminAccordionTable,
  AdminKpiCard,
  FunctionalTabRail,
  type AdminConfigTabDefinition,
} from "@/features/operations/components/admin-console-primitives";

describe("admin console primitives", () => {
  it("renders an executive KPI card with trend context", () => {
    render(
      <AdminKpiCard
        item={{
          delta: "+18%",
          detail: "vs periodo anterior",
          icon: BarChart3,
          label: "Costo LLM",
          tone: "blue",
          trend: [1, 2, 3, 5],
          value: "US$ 428.63",
        }}
      />,
    );

    expect(screen.getByText("Costo LLM")).toBeInTheDocument();
    expect(screen.getByText("US$ 428.63")).toBeInTheDocument();
    expect(screen.getByText("+18%")).toBeInTheDocument();
  });

  it("keeps five functional tabs in a single shared rail contract", () => {
    const tabs: Array<AdminConfigTabDefinition<"general" | "runtime" | "security" | "commerce" | "governance">> = [
      { badge: "Base", description: "General", icon: Settings, key: "general", label: "General", status: "available" },
      { badge: "Runtime", description: "Runtime", icon: BarChart3, key: "runtime", label: "LLM runtime", status: "available" },
      { badge: "Seguridad", description: "Security", icon: ShieldCheck, key: "security", label: "Seguridad", status: "available" },
      { badge: "FinOps", description: "Commerce", icon: BarChart3, key: "commerce", label: "Comercial", status: "partial" },
      { badge: "Control", description: "Technical control", icon: ShieldCheck, key: "governance", label: "Control técnico", status: "gap" },
    ];
    const onChange = vi.fn();

    render(
      <FunctionalTabRail
        activeTab="general"
        countLabel="5 dominios"
        description="Selecciona un dominio."
        onChange={onChange}
        tabs={tabs}
      />,
    );

    expect(screen.getByText("5 dominios")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /General/i })).toHaveAttribute("aria-selected", "true");

    fireEvent.click(screen.getByRole("tab", { name: /Control t/i }));

    expect(onChange).toHaveBeenCalledWith("governance");
  });

  it("shows primary actions first and secondary detail through accordion rows", () => {
    render(
      <AdminAccordionTable
        description="Configuraciones densas con detalle progresivo."
        title="Providers"
        rows={[
          {
            detail: "Modelos, credenciales y fallbacks.",
            expandedActions: [{ label: "Rotar secreto", tone: "orange" }],
            fields: [{ label: "Modelo", value: "gpt-5.5" }],
            id: "openai",
            name: "OpenAI",
            owner: "Platform admin",
            primaryAction: "Editar",
            scope: "Workspace",
            statusLabel: "Activo",
            statusTone: "green",
            summary: "Provider principal del runtime.",
          },
        ]}
      />,
    );

    expect(screen.getByText("Providers")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Editar" })).toBeInTheDocument();
    expect(screen.getByText("Modelos, credenciales y fallbacks.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Contraer OpenAI/i }));

    expect(screen.queryByText("Rotar secreto")).not.toBeInTheDocument();
  });
});
