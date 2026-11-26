import { describe, expect, it } from "vitest";
import { BOTTOM_NAV_ITEMS, NAV_ITEMS } from "@/components/layout/navigation";

describe("Navigation Configuration", () => {
  it("keeps 6 total routes in sidebar without duplicates", () => {
    expect(NAV_ITEMS).toHaveLength(6);
    const hrefs = NAV_ITEMS.map((i) => i.href);
    expect(new Set(hrefs).size).toBe(6);
    expect(hrefs).toEqual([
      "/dashboard",
      "/models",
      "/analyzer",
      "/datasets",
      "/comparison",
      "/reports",
    ]);
  });

  it("exposes exactly 5 primary items in MobileBottomNavigation", () => {
    expect(BOTTOM_NAV_ITEMS).toHaveLength(5);
    expect(BOTTOM_NAV_ITEMS.map((i) => i.mobileLabel)).toEqual([
      "Home",
      "Model",
      "Analyze",
      "Dataset",
      "Compare",
    ]);
    expect(BOTTOM_NAV_ITEMS.map((i) => i.href)).toEqual([
      "/dashboard",
      "/models",
      "/analyzer",
      "/datasets",
      "/comparison",
    ]);
  });
});
