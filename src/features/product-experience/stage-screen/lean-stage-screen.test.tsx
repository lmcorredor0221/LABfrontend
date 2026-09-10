import { render, screen } from "@testing-library/react";
import { LanguageProvider } from "@/core/i18n/language-context";
import {
  LeanGeneratedDeliverable,
  LeanStageScreen,
} from "@/features/product-experience/stage-screen/lean-stage-screen";
import type { LeanStageScreenContract } from "@/features/product-experience/stage-screen/stage-screen-contract";

function renderStageScreen(contract: LeanStageScreenContract) {
  return render(
    <LanguageProvider>
      <LeanStageScreen actionArea={<button type="button">Ejecutar</button>} contract={contract} />
    </LanguageProvider>,
  );
}

describe("LeanStageScreen", () => {
  it("hides the low-value stage metric from the hero", () => {
    renderStageScreen({
      attentionItems: [],
      linkedResults: [],
      metric: {
        helper: "Parametro interno sin accion para el usuario.",
        label: "Completitud funcional",
        progress: 100,
        value: "100%",
      },
      nextStep: "Continuar con la siguiente etapa.",
      primaryAction: {
        description: "Ejecutar la accion principal de la etapa.",
        label: "Guardar y analizar",
        tone: "brand",
      },
      stage: {
        description: "Captura el contexto minimo del negocio.",
        objective: "Validar completitud funcional.",
        statusLabel: "Listo",
        statusTone: "success",
        title: "Descubrir",
      },
      tabs: [
        {
          children: <p>Contenido de la tarea</p>,
          description: "Trabajo principal de la etapa.",
          key: "task",
          label: "Tarea",
        },
      ],
    });

    expect(screen.queryByText("Completitud funcional")).not.toBeInTheDocument();
    expect(screen.queryByText("100%")).not.toBeInTheDocument();
    expect(screen.queryByText("Parametro interno sin accion para el usuario.")).not.toBeInTheDocument();
    expect(screen.queryByRole("progressbar", { name: "Completitud funcional" })).not.toBeInTheDocument();
  });
});

describe("LeanGeneratedDeliverable", () => {
  it("hides generated deliverable metric cards", () => {
    render(
      <LanguageProvider>
        <LeanGeneratedDeliverable
          metrics={[
            {
              helper: "ReAct",
              label: "Ajuste",
              tone: "success",
              value: "88%",
            },
            {
              helper: "Requisitos cubiertos para la opcion seleccionada.",
              label: "Cobertura",
              tone: "success",
              value: "100%",
            },
            {
              helper: "Evidencia 0%. Pendientes undefined.",
              label: "Calidad",
              tone: "warning",
              value: "0%",
            },
          ]}
          sections={[
            {
              items: ["Decision base conservada"],
              title: "Decisiones",
            },
          ]}
          summary="Resumen visible del entregable generado."
          title="Entregable de diseno"
        />
      </LanguageProvider>,
    );

    expect(screen.getByText("Entregable de diseno")).toBeInTheDocument();
    expect(screen.getByText("Resumen visible del entregable generado.")).toBeInTheDocument();
    expect(screen.queryByText("Ajuste")).not.toBeInTheDocument();
    expect(screen.queryByText("Cobertura")).not.toBeInTheDocument();
    expect(screen.queryByText("Calidad")).not.toBeInTheDocument();
    expect(screen.queryByText("ReAct")).not.toBeInTheDocument();
    expect(screen.queryByText("Requisitos cubiertos para la opcion seleccionada.")).not.toBeInTheDocument();
    expect(screen.queryByText("Evidencia 0%. Pendientes undefined.")).not.toBeInTheDocument();
  });
});
