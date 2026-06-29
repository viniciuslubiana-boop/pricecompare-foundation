import { describe, expect, it } from "vitest";
import { ParallelumProvider } from "../providers/parallelum.provider";
import {
  applyFipeBrandAlias,
  applyFipeModelAlias,
  isFipeModelCompatible,
  normalizeText,
  parseYearModel,
  requiresManualFipeVersion,
} from "../utils/fipe-normalization";

describe("FIPE normalization", () => {
  it("separa letras e números colados antes do match", () => {
    expect(normalizeText("CB300F")).toBe("cb 300 f");
    expect(normalizeText("TIGGO8")).toBe("tiggo 8");
    expect(normalizeText("ONIX10MT")).toBe("onix 10 mt");
    expect(normalizeText("AIRCROSS7")).toBe("aircross 7");
    expect(normalizeText("1.6TGDI")).toBe("1.6 tgdi");
    expect(normalizeText("S20I")).toBe("s 20 i");
  });

  it("aplica aliases FIPE prioritários de marca e modelo", () => {
    expect(applyFipeBrandAlias("Caoa Chery")).toBe("CAOA CHERY/CHERY");
    expect(applyFipeBrandAlias("Chevrolet")).toBe("GM - Chevrolet");
    expect(applyFipeBrandAlias("Bmw Motorrad")).toBe("BMW MOTORRAD");
    expect(applyFipeModelAlias("Honda", "BIZ EX")).toBe("BIZ 125 EX");
    expect(applyFipeModelAlias("Honda", "CB300F TWISTER ABS")).toBe("CB 300F TWISTER");
    expect(applyFipeModelAlias("Honda", "CB 500 HORNET")).toBe("CB 500 HORNET");
    expect(applyFipeModelAlias("Chevrolet", "ONIX 10MT LT1")).toBe("ONIX HATCH LT 1.0 12V Flex 5p Mec.");
    expect(applyFipeModelAlias("BMW", "X1 S20I ACTIVE FLEX")).toBe("X1 SDRIVE 20i X-Line 2.0 TB Active Flex");
  });

  it("mantém gates rígidos contra falsos positivos", () => {
    expect(isFipeModelCompatible("CB 500X", "CB500")).toBe(false);
    expect(isFipeModelCompatible("HB20S Comfort", "HB20")).toBe(false);
    expect(isFipeModelCompatible("Corolla Cross XRE", "Corolla")).toBe(true);
    expect(requiresManualFipeVersion("Toyota", "Corolla")).toBe(true);
  });

  it("interpreta ano/modelo com barras mantendo o ano FIPE", () => {
    expect(parseYearModel("2025/2026")).toBe(2026);
    expect(parseYearModel("2022-2023")).toBe(2023);
  });
});

describe("ParallelumProvider diagnostics", () => {
  it("retorna diagnóstico detalhado quando o match é bloqueado antes da API", async () => {
    const provider = new ParallelumProvider();
    const { result, diagnostics } = await provider.quoteWithDiagnostics({
      brand: "Toyota",
      model: "Corolla",
      year_model: 2022,
    });

    expect(result).toBeNull();
    expect(diagnostics.final_status).toBe("nao_encontrada");
    expect(diagnostics.rejection_reason).toBe("modelo_nao_encontrado");
    expect(diagnostics.original_brand).toBe("Toyota");
    expect(diagnostics.original_model).toBe("Corolla");
  });
});