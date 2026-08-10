import axe from "axe-core";
import { render } from "@testing-library/react";
import { UxaFoundationCatalog } from "@/features/product-experience/design-system/foundation-catalog";

describe("UXA foundation catalog accessibility", () => {
  it("has no serious or critical axe violations", async () => {
    const { container } = render(<UxaFoundationCatalog />);

    const results = await axe.run(container, {
      rules: {
        "color-contrast": { enabled: false },
      },
    });
    const seriousOrCritical = results.violations.filter(
      (violation) => violation.impact === "serious" || violation.impact === "critical",
    );

    expect(seriousOrCritical).toEqual([]);
  });
});
