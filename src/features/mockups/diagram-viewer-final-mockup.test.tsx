import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DiagramViewerFinalMockup } from "./diagram-viewer-final-mockup";

describe("DiagramViewerFinalMockup", () => {
  it("permite buscar y abrir un diagrama bloqueado con una explicación accionable", async () => {
    const user = userEvent.setup();
    render(<DiagramViewerFinalMockup />);

    expect(screen.getByRole("heading", { name: /explora la solución/i })).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/buscar por nombre/i), "despliegue");
    await user.click(screen.getByRole("button", { name: /diagrama de despliegue/i }));

    expect(screen.getByRole("heading", { name: "Disponible con ACP" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Conocer ACP" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Descargar" })).toBeDisabled();
  });

  it("alterna entre catálogo y visor conservando la selección", async () => {
    const user = userEvent.setup();
    render(<DiagramViewerFinalMockup />);

    await user.click(screen.getByRole("button", { name: "Catálogo" }));
    expect(screen.getByRole("heading", { name: /diagramas encontrados/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /arquitectura de integración/i }));
    expect(screen.getByRole("heading", { name: "Arquitectura de integración" })).toBeInTheDocument();
    expect(screen.getByText(/generando arquitectura de integración/i)).toBeInTheDocument();
  });
});
