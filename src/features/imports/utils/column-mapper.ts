import type { ColumnMapping, SystemField } from "../types";

const ALIASES: Record<SystemField, string[]> = {
  brand: ["marca", "brand", "fabricante", "make"],
  model: ["modelo", "model"],
  version: ["versao", "versão", "version", "trim"],
  year_model: ["ano", "ano/modelo", "ano modelo", "year", "year_model", "ano_modelo"],
  km: ["km", "quilometragem", "kilometragem", "mileage", "odometro", "odômetro"],
  price: ["preco", "preço", "valor", "price", "value"],
  supplier_name: ["fornecedor", "supplier", "vendedor"],
  source_url: ["link", "url", "anuncio", "anúncio", "source", "fonte"],
  photo_url: ["foto", "imagem", "photo", "image"],
  city: ["cidade", "city", "localizacao", "localização"],
};

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\s./-]+/g, " ")
    .trim();

export function autoMapColumns(
  columns: string[],
  available?: SystemField[],
): ColumnMapping {
  const mapping: ColumnMapping = {};
  const used = new Set<string>();
  const entries = (Object.entries(ALIASES) as [SystemField, string[]][]).filter(
    ([field]) => !available || available.includes(field),
  );
  for (const [field, aliases] of entries) {
    const match = columns.find((c) => {
      if (used.has(c)) return false;
      const n = norm(c);
      return aliases.some((a) => n === norm(a) || n.includes(norm(a)));
    });
    if (match) {
      mapping[field] = match;
      used.add(match);
    }
  }
  return mapping;
}

export function mappingIsComplete(mapping: ColumnMapping, required: SystemField[]): boolean {
  return required.every((f) => !!mapping[f]);
}
