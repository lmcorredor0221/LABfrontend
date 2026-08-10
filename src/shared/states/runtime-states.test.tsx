import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmptyState, ErrorState, LoadingState, RetryPanel } from "@/shared/states/runtime-states";

describe("runtime states", () => {
  it("renders loading state content", () => {
    render(<LoadingState title="Cargando runtime" />);

    expect(screen.getByText("Cargando runtime")).toBeInTheDocument();
    expect(screen.getByText(/preparando los datos/i)).toBeInTheDocument();
  });

  it("renders error state content", () => {
    render(<ErrorState title="Sin conexión" />);

    expect(screen.getByText("Sin conexión")).toBeInTheDocument();
    expect(screen.getByText(/problema al recuperar/i)).toBeInTheDocument();
  });

  it("renders empty state content", () => {
    render(<EmptyState title="Sin sesiones aún" />);

    expect(screen.getByText("Sin sesiones aún")).toBeInTheDocument();
    expect(screen.getByText(/no hay datos disponibles/i)).toBeInTheDocument();
  });

  it("renders retry panel and triggers retry callback", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(<RetryPanel onRetry={onRetry} />);

    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
