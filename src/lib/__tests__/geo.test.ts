import { describe, expect, it } from "vitest";
import { computeRegionLabel, estimateTravelMin, haversineKm } from "../geo";

describe("geo utils", () => {
  it("haversineKm returns zero for same coordinates", () => {
    expect(haversineKm(0, 0, 0, 0)).toBeCloseTo(0, 6);
  });

  it("haversineKm approximates distance at equator", () => {
    expect(haversineKm(0, 0, 0, 1)).toBeCloseTo(111.19, 1);
  });

  it("estimateTravelMin clamps values", () => {
    expect(estimateTravelMin(0)).toBe(10);
    expect(estimateTravelMin(30)).toBe(60);
    expect(estimateTravelMin(1000)).toBe(180);
  });

  it("computeRegionLabel uses capital rules when lat/lng present", () => {
    const label = computeRegionLabel("SP", "Sao Paulo", -23.4, -46.7);
    expect(label).toContain("Zona Norte");
  });

  it("computeRegionLabel falls back to state when city is empty", () => {
    expect(computeRegionLabel("XX", "", null, null)).toBe("XX");
  });
});
