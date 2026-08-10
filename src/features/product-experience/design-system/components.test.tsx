import { render, screen } from "@testing-library/react";
import {
  UxaButton,
  UxaPersistentProcessingFeedback,
  UxaProcessingStrip,
  UxaSkipLink,
  UxaStageRail,
  UxaTextareaField,
  UxaTextField,
} from "@/features/product-experience/design-system";

describe("UXA design system foundations", () => {
  it("renders the skip link with an explicit target", () => {
    render(<UxaSkipLink targetId="foundation-main" />);

    expect(screen.getByRole("link", { name: "Saltar al contenido" })).toHaveAttribute("href", "#foundation-main");
  });

  it("renders primary buttons as accessible actions", () => {
    render(<UxaButton>Continuar</UxaButton>);

    expect(screen.getByRole("button", { name: "Continuar" })).toBeEnabled();
  });

  it("associates text fields with labels, hints and errors", () => {
    render(<UxaTextField error="Campo requerido" hint="Describe el objetivo." label="Objetivo" />);

    const input = screen.getByRole("textbox", { name: "Objetivo" });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Describe el objetivo. Campo requerido");
    expect(screen.getByRole("alert")).toHaveTextContent("Campo requerido");
  });

  it("associates textarea fields with their visible label", () => {
    render(<UxaTextareaField label="Regla de negocio" />);

    expect(screen.getByRole("textbox", { name: "Regla de negocio" })).toBeInTheDocument();
  });

  it("marks the active stage with aria-current step", () => {
    render(
      <UxaStageRail
        activeKey="design"
        items={[
          { description: "Contexto", key: "discover", label: "Descubrir", state: "done" },
          { description: "Arquitectura", key: "design", label: "Disenar", state: "active" },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: /Disenar/ })).toHaveAttribute("aria-current", "step");
  });

  it("renders processing as a semantic progressbar", () => {
    render(<UxaProcessingStrip label="Progreso por pasos" value={70} />);

    expect(screen.getByRole("progressbar", { name: "Progreso por pasos" })).toHaveAttribute("aria-valuenow", "70");
  });

  it("renders persistent processing feedback only while active", () => {
    const { rerender } = render(
      <UxaPersistentProcessingFeedback
        active
        activityLabel="Backend/LLM"
        description="El proceso continua aunque no existan nuevos resultados visibles."
        stageLabel="Definir"
        title="Generando requisitos con LLM."
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Generando requisitos con LLM.");
    expect(screen.getByRole("status")).toHaveTextContent("Backend/LLM");

    rerender(
      <UxaPersistentProcessingFeedback
        active={false}
        title="Generando requisitos con LLM."
      />,
    );

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
