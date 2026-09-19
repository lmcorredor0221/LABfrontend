import { render, screen } from "@testing-library/react";
import { EstimateRoiHifiMockup } from "@/features/product-experience/saas/estimate-roi-hifi-view";

describe("EstimateRoiHifiMockup pricing", () => {
  it("renders offer prices from commerce base prices instead of stale hardcoded values", () => {
    render(
      <EstimateRoiHifiMockup
        basePrices={{ acp_premium_usd: 99, blueprint_pro_usd: 39 }}
        currency="USD"
        embedded
        isStale={false}
      />,
    );

    expect(screen.getAllByText("$39 USD").length).toBeGreaterThan(0);
    expect(screen.getAllByText("$99 USD").length).toBeGreaterThan(0);
    expect(screen.queryByText(/\$49 USD|\$149 USD|Blueprint Premium/)).toBeNull();
  });
});
