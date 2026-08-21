import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppButton, Checklist, SelectField, SliderField, TextAreaField, TextField } from "@/components/lean/ui";

describe("lean ui controls", () => {
  it("renders AppButton loading state", () => {
    render(
      <AppButton loading loadingLabel="Guardando">
        Guardar
      </AppButton>,
    );

    const button = screen.getByRole("button", { name: "Guardando" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("renders a real text input and emits value changes", async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();

    render(
      <TextField
        label="Correo electrónico"
        onValueChange={handleValueChange}
        placeholder="tu@empresa.com"
      />,
    );

    const input = screen.getByLabelText("Correo electrónico");
    await user.type(input, "admin@leanbuilder.local");

    expect(input).toHaveValue("admin@leanbuilder.local");
    expect(handleValueChange).toHaveBeenCalled();
  });

  it("associates text input hints and errors with aria-describedby", () => {
    render(
      <TextField
        error="Correo requerido"
        hint="Usa tu correo profesional."
        label="Correo electrÃ³nico"
      />,
    );

    const input = screen.getByLabelText("Correo electrÃ³nico");
    const hint = screen.getByText("Usa tu correo profesional.");
    const error = screen.getByText("Correo requerido");

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.getAttribute("aria-describedby")).toContain(hint.id);
    expect(input.getAttribute("aria-describedby")).toContain(error.id);
  });

  it("renders a real textarea and emits value changes", async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();

    render(
      <TextAreaField
        label="Contexto"
        onValueChange={handleValueChange}
        placeholder="Describe el contexto actual"
      />,
    );

    const textarea = screen.getByLabelText("Contexto");
    await user.type(textarea, "Necesitamos una base clara.");

    expect(textarea).toHaveValue("Necesitamos una base clara.");
    expect(handleValueChange).toHaveBeenCalled();
  });

  it("renders a real select and emits value changes", async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();

    function SelectHarness() {
      const [value, setValue] = useState("daily");

      return (
        <SelectField
          label="Frecuencia"
          onValueChange={(nextValue, event) => {
            setValue(nextValue);
            handleValueChange(nextValue, event);
          }}
          options={[
            { label: "Diaria", value: "daily" },
            { label: "Semanal", value: "weekly" },
          ]}
          value={value}
        />
      );
    }

    render(<SelectHarness />);

    const select = screen.getByLabelText("Frecuencia");
    await user.selectOptions(select, "weekly");

    expect(select).toHaveValue("weekly");
    expect(handleValueChange).toHaveBeenLastCalledWith("weekly", expect.any(Object));
  });

  it("renders a real slider and updates through a controlled wrapper", () => {
    function SliderHarness() {
      const [value, setValue] = useState(0.25);

      return (
        <SliderField
          label="Autonomía"
          leftLabel="Asistido"
          onValueChange={setValue}
          rightLabel="Autónomo"
          step={0.05}
          value={value}
        />
      );
    }

    render(<SliderHarness />);

    const slider = screen.getByRole("slider", { name: "Autonomía" });
    fireEvent.change(slider, { target: { value: "0.75" } });

    expect(screen.getByText("0.75")).toBeInTheDocument();
  });

  it("renders checklist items with repeated labels without duplicate-key warnings", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <Checklist
        items={[
          { label: "Hay approval gates pendientes antes de promover el blueprint a implementacion.", state: "alert" },
          { label: "Hay approval gates pendientes antes de promover el blueprint a implementacion.", state: "alert" },
        ]}
      />,
    );

    expect(
      screen.getAllByText("Hay approval gates pendientes antes de promover el blueprint a implementacion."),
    ).toHaveLength(2);
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
