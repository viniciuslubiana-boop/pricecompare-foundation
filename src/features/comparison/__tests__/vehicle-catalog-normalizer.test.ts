import { describe, expect, it } from "vitest";
import {
  applyCatalogAlias,
  applyCatalogAliases,
  buildAliasMap,
  type AliasAuditEntry,
} from "../matching/vehicle-catalog-normalizer";
import { isEquivalent } from "../matching/vehicle-equivalence";
import type { CompetitorVehicle, MyVehicle } from "@/types/database.types";

const mine = (id: string, brand: string, model: string): MyVehicle =>
  ({
    id,
    brand,
    model,
    year_model: "2023/2024",
    km: 0,
    price: 50000,
    base_company_id: null,
    created_at: "",
    updated_at: "",
    created_by: null,
    source: "manual",
    supplier_name: null,
  }) as MyVehicle;

const comp = (id: string, brand: string, model: string): CompetitorVehicle =>
  ({
    id,
    brand,
    model,
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
  }) as CompetitorVehicle;

// Aliases APROVADOS (administrador vinculou ao master_catalog_id).
const approved = buildAliasMap([
  { brand: "Honda", alias: "CB 500", canonical: "CB500", master_catalog_id: "m1" },
  { brand: "Honda", alias: "CB-500", canonical: "CB500", master_catalog_id: "m1" },
  { brand: "Yamaha", alias: "NMAX 160", canonical: "NMAX", master_catalog_id: "m2" },
  { brand: "Honda", alias: "CB300F Twister", canonical: "CB300 Twister", master_catalog_id: "m3" },
]);

describe("vehicle-catalog-normalizer", () => {
  it("aplica canônico apenas quando há alias aprovado", () => {
    const a = applyCatalogAlias(mine("a", "Honda", "CB 500"), approved);
    expect(a.model).toBe("CB500");
    const b = applyCatalogAlias(mine("b", "Honda", "CB-500"), approved);
    expect(b.model).toBe("CB500");
    // sem alias: preserva
    const c = applyCatalogAlias(mine("c", "Honda", "CB500X"), approved);
    expect(c.model).toBe("CB500X");
  });

  it("não cria falsos positivos — CB500 ≠ CB500X", () => {
    const a = applyCatalogAlias(mine("a", "Honda", "CB 500"), approved);
    const b = applyCatalogAlias(comp("b", "Honda", "CB500X"), approved);
    expect(isEquivalent(a, b)).toBe(false);
  });

  it("Corolla ≠ Corolla Cross continua bloqueado (sem alias)", () => {
    const a = applyCatalogAlias(mine("a", "Toyota", "Corolla"), approved);
    const b = applyCatalogAlias(comp("b", "Toyota", "Corolla Cross"), approved);
    expect(isEquivalent(a, b)).toBe(false);
  });

  it("HB20 ≠ HB20S (sem alias aprovado)", () => {
    const a = applyCatalogAlias(mine("a", "Hyundai", "HB20"), approved);
    const b = applyCatalogAlias(comp("b", "Hyundai", "HB20S"), approved);
    expect(isEquivalent(a, b)).toBe(false);
  });

  it("NMAX 160 = NMAX quando há alias aprovado", () => {
    const a = applyCatalogAlias(mine("a", "Yamaha", "NMAX 160"), approved);
    const b = applyCatalogAlias(comp("b", "Yamaha", "NMAX"), approved);
    expect(isEquivalent(a, b)).toBe(true);
  });

  it("CB300F Twister = CB300 Twister quando há alias aprovado", () => {
    const a = applyCatalogAlias(mine("a", "Honda", "CB300F Twister"), approved);
    const b = applyCatalogAlias(comp("b", "Honda", "CB300 Twister"), approved);
    expect(isEquivalent(a, b)).toBe(true);
  });

  it("emite registro de auditoria quando aplica alias", () => {
    const audit: AliasAuditEntry[] = [];
    applyCatalogAliases(
      [mine("a", "Honda", "CB 500"), mine("b", "Honda", "CB500X")],
      approved,
      audit,
    );
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({
      vehicleId: "a",
      originalModel: "CB 500",
      canonicalModel: "CB500",
      masterCatalogId: "m1",
    });
  });

  it("preserva o objeto original quando não há alias (sem clone desnecessário)", () => {
    const v = mine("a", "Honda", "CB500X");
    expect(applyCatalogAlias(v, approved)).toBe(v);
  });
});
