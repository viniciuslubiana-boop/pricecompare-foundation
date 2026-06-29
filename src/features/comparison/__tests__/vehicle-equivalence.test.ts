import { describe, expect, it } from "vitest";
import {
  evaluateEquivalence,
  isEquivalent,
  normToken,
  prepareVehicle,
} from "../matching/vehicle-equivalence";
import type { CompetitorVehicle, MyVehicle } from "@/types/database.types";

const mine = (over: Partial<MyVehicle>): MyVehicle =>
  ({
    id: "m",
    brand: "Honda",
    model: "CB500",
    year_model: "2023/2024",
    km: 0,
    price: 50000,
    base_company_id: null,
    created_at: "",
    updated_at: "",
    created_by: null,
    source: "manual",
    supplier_name: null,
    ...over,
  }) as MyVehicle;

const comp = (over: Partial<CompetitorVehicle>): CompetitorVehicle =>
  ({
    id: "c",
    brand: "Honda",
    model: "CB500",
    year_model: "2023/2024",
    km: 0,
    price: 51000,
    competitor_id: null,
    competitor_name: "X",
    confidence: null,
    created_at: "",
    updated_at: "",
    extraction_id: null,
    photo_url: null,
    source: null,
    source_url: null,
    version: null,
    city: null,
    ...over,
  }) as CompetitorVehicle;

describe("vehicle equivalence (PCM strict rules)", () => {
  it("normalizes formatting variants of the same model", () => {
    expect(normToken("CB 500")).toBe("cb500");
    expect(normToken("CB-500")).toBe("cb500");
    expect(normToken("CB500")).toBe("cb500");
  });

  it.each<[string, string, string, string, boolean]>([
    ["Honda", "CB500", "Honda", "CB500", true],
    ["Honda", "CB500", "Honda", "CB500X", false],
    ["Honda", "CB300", "Honda", "CB250", false],
    ["Toyota", "Corolla", "Toyota", "Corolla Cross", false],
    ["Toyota", "Corolla XEi", "Toyota", "Corolla XEi", true],
    ["Jeep", "Compass", "Jeep", "Commander", false],
    ["Jeep", "Compass Longitude", "Jeep", "Compass Sport", false],
    ["Jeep", "Renegade", "Jeep", "Compass", false],
    ["Chevrolet", "Onix", "Chevrolet", "Onix Plus", false],
    ["Chevrolet", "Tracker", "Chevrolet", "Trailblazer", false],
    ["VW", "Nivus", "VW", "T-Cross", false],
    ["Hyundai", "HB20", "Hyundai", "HB20S", false],
    ["Honda", "HR-V", "Honda", "WR-V", false],
    ["Toyota", "Hilux", "Toyota", "SW4", false],
    ["Fiat", "Toro", "Fiat", "Strada", false],
    ["Nissan", "Kicks", "Nissan", "Versa", false],
    ["Honda", "CB500", "Yamaha", "CB500", false], // brand differs
  ])("%s %s vs %s %s → %s", (ba, ma, bb, mb, expected) => {
    const a = mine({ brand: ba, model: ma });
    const b = comp({ brand: bb, model: mb });
    expect(isEquivalent(a, b)).toBe(expected);
  });

  it("rejects different model years by default (strict)", () => {
    const a = mine({ year_model: "2022/2023" });
    const b = comp({ year_model: "2023/2024" });
    expect(isEquivalent(a, b)).toBe(false);
  });

  it("accepts year difference within configured tolerance", () => {
    const a = mine({ year_model: "2022/2023" });
    const b = comp({ year_model: "2023/2024" });
    expect(isEquivalent(a, b, { yearTolerance: 1 })).toBe(true);
  });

  it("rejects when fuel differs (both present)", () => {
    const a = mine({ model: "Compass 2.0 Diesel" });
    const b = comp({ model: "Compass 2.0 Flex" });
    const r = evaluateEquivalence(a, b);
    expect(r.equivalent).toBe(false);
    expect(r.reasons).toContain("fuel");
  });

  it("rejects when transmission differs (both present)", () => {
    const a = mine({ model: "Corolla XEi Automático" });
    const b = comp({ model: "Corolla XEi Manual" });
    expect(isEquivalent(a, b)).toBe(false);
  });

  it("returns 100 confidence when all secondary attributes match", () => {
    const a = mine({ model: "Compass Longitude 2.0 Flex Automático" });
    const b = comp({ model: "Compass Longitude 2.0 Flex Automático" });
    const r = evaluateEquivalence(a, b);
    expect(r.equivalent).toBe(true);
    expect(r.confidence).toBe(100);
  });

  it("returns 95 confidence when secondary info is missing on one side", () => {
    const a = mine({ model: "Compass Longitude" });
    const b = comp({ model: "Compass Longitude 2.0 Flex" });
    const r = evaluateEquivalence(a, b);
    expect(r.equivalent).toBe(true);
    expect(r.confidence).toBe(95);
  });

  it("caches the normalized vehicle (single pass)", () => {
    const v = mine({});
    expect(prepareVehicle(v)).toBe(prepareVehicle(v));
  });
});
