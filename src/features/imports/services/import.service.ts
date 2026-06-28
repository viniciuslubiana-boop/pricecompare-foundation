import { inventoryService } from "@/features/inventory/services/inventory.service";
import { inventoryVehicleSchema } from "@/features/inventory/schemas/inventory.schema";
import { findDuplicates } from "@/features/inventory/utils/inventory-duplicates";
import {
  normalizeBrand,
  normalizeModel,
  normalizeYearModel,
  normalizeKm,
  normalizePrice,
} from "@/features/inventory/utils/inventory-normalization";
import { importLogRepository } from "@/repositories/import.repository";
import { competitorVehicleRepository } from "@/features/extraction/repositories/competitor-vehicle.repository";
import type { Vehicle } from "@/features/inventory/types/inventory.types";
import type { CompetitorVehicle, CompetitorVehicleInsert } from "@/types/database.types";
import {
  type ColumnMapping,
  type ImportRunResult,
  type ImportTargetType,
  type PreviewRow,
  type RawRow,
  type SystemField,
  requiredFieldsForTarget,
} from "../types";

function pick(row: RawRow, mapping: ColumnMapping, field: SystemField): string {
  const col = mapping[field];
  if (!col) return "";
  const v = row[col];
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function extractValues(row: RawRow, mapping: ColumnMapping): PreviewRow["values"] {
  return {
    brand: pick(row, mapping, "brand"),
    model: pick(row, mapping, "model"),
    version: pick(row, mapping, "version"),
    year_model: pick(row, mapping, "year_model"),
    km: pick(row, mapping, "km"),
    price: pick(row, mapping, "price"),
    supplier_name: pick(row, mapping, "supplier_name"),
    source_url: pick(row, mapping, "source_url"),
    photo_url: pick(row, mapping, "photo_url"),
    city: pick(row, mapping, "city"),
  };
}

// ---------- Preview (Meu Estoque) ----------

export function buildPreview(
  rows: RawRow[],
  mapping: ColumnMapping,
  existing: Vehicle[],
): PreviewRow[] {
  return rows.map((row, index) => {
    const raw = extractValues(row, mapping);
    const parsed = inventoryVehicleSchema.safeParse(raw);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      return { index, values: raw, status: "invalid" as const, errors };
    }
    const dups = findDuplicates(parsed.data, existing);
    if (dups.length) {
      return {
        index,
        values: raw,
        status: "duplicate" as const,
        errors: [],
        duplicateReason: dups[0].reasons.join(", "),
      };
    }
    return { index, values: raw, status: "valid" as const, errors: [] };
  });
}

// ---------- Preview (Concorrente) ----------

interface CompetitorPreviewExisting {
  brand: string;
  model: string;
  year_model: string;
  km: number | null;
  price: number | null;
  source_url: string | null;
}

function isCompetitorDuplicate(
  candidate: {
    brand: string;
    model: string;
    year_model: string;
    km: number;
    price: number;
    source_url: string | null;
  },
  existing: CompetitorPreviewExisting[],
): string | null {
  const b = normalizeBrand(candidate.brand);
  const m = normalizeModel(candidate.model);
  const y = normalizeYearModel(candidate.year_model);
  for (const e of existing) {
    if (candidate.source_url && e.source_url && candidate.source_url === e.source_url) {
      return "Mesmo link de anúncio";
    }
    if (
      normalizeBrand(e.brand) === b &&
      normalizeModel(e.model) === m &&
      normalizeYearModel(e.year_model) === y
    ) {
      const kmClose = Math.abs((e.km ?? 0) - candidate.km) <= 5000;
      const priceClose =
        Math.abs((e.price ?? 0) - candidate.price) <=
        Math.max(e.price ?? 0, candidate.price) * 0.05;
      if (kmClose && priceClose) return "Mesma marca/modelo/ano com KM e preço próximos";
    }
  }
  return null;
}

export function buildCompetitorPreview(
  rows: RawRow[],
  mapping: ColumnMapping,
  existing: CompetitorPreviewExisting[],
): PreviewRow[] {
  return rows.map((row, index) => {
    const raw = extractValues(row, mapping);
    const errors: string[] = [];
    const brand = normalizeBrand(raw.brand);
    const model = normalizeModel(raw.model);
    const year_model = normalizeYearModel(raw.year_model);
    const price = normalizePrice(raw.price);
    const km = normalizeKm(raw.km);

    if (!brand) errors.push("brand: Marca é obrigatória");
    if (!model) errors.push("model: Modelo é obrigatório");
    if (!year_model || year_model.length < 4) errors.push("year_model: Ano/Modelo é obrigatório");
    if (price <= 0) errors.push("price: Valor é obrigatório");

    if (errors.length) {
      return { index, values: raw, status: "invalid" as const, errors };
    }
    const dup = isCompetitorDuplicate(
      { brand, model, year_model, km, price, source_url: raw.source_url || null },
      existing,
    );
    if (dup) {
      return {
        index,
        values: raw,
        status: "duplicate" as const,
        errors: [],
        duplicateReason: dup,
      };
    }
    return { index, values: raw, status: "valid" as const, errors: [] };
  });
}

// ---------- Run ----------

export interface RunImportArgs {
  target: ImportTargetType;
  fileName: string;
  fileType: "csv" | "xlsx";
  rows: RawRow[];
  mapping: ColumnMapping;
  userId: string;
  /** Required when target = my_vehicles */
  baseCompanyId?: string;
  /** Required when target = competitor */
  competitorId?: string;
  competitorName?: string;
  duplicatesPolicy: "ignore" | "import";
  /** Existing inventory (my_vehicles target) */
  existing?: Vehicle[];
  /** Existing competitor vehicles for duplicate detection */
  existingCompetitorVehicles?: CompetitorPreviewExisting[];
}

export async function runImport(args: RunImportArgs): Promise<ImportRunResult> {
  if (args.target === "my_vehicles") {
    if (!args.baseCompanyId) throw new Error("Selecione uma Empresa Base antes de importar.");
  } else {
    if (!args.competitorId) throw new Error("Selecione o concorrente antes de importar.");
  }

  const required = requiredFieldsForTarget(args.target);
  const missing = required.filter((f) => !args.mapping[f]);
  if (missing.length) {
    throw new Error(`Campos obrigatórios não mapeados: ${missing.join(", ")}`);
  }

  const preview =
    args.target === "my_vehicles"
      ? buildPreview(args.rows, args.mapping, args.existing ?? [])
      : buildCompetitorPreview(
          args.rows,
          args.mapping,
          args.existingCompetitorVehicles ?? [],
        );

  const errorLog: Array<{ index: number; errors: string[] }> = [];
  let imported = 0;
  let invalid = 0;
  let duplicateIgnored = 0;
  let insertError = 0;

  // Batch competitor inserts
  const competitorBatch: CompetitorVehicleInsert[] = [];

  for (const item of preview) {
    if (item.status === "invalid") {
      invalid++;
      errorLog.push({ index: item.index, errors: item.errors });
      continue;
    }
    if (item.status === "duplicate" && args.duplicatesPolicy === "ignore") {
      duplicateIgnored++;
      continue;
    }

    if (args.target === "my_vehicles") {
      const parsed = inventoryVehicleSchema.safeParse(item.values);
      if (!parsed.success) {
        invalid++;
        errorLog.push({
          index: item.index,
          errors: parsed.error.issues.map((i) => i.message),
        });
        continue;
      }
      try {
        await inventoryService.create(
          parsed.data,
          args.userId,
          args.baseCompanyId!,
          args.fileType,
        );
        imported++;
      } catch (e) {
        insertError++;
        errorLog.push({
          index: item.index,
          errors: [`Erro ao salvar no banco: ${(e as Error).message}`],
        });
      }
    } else {
      const v = item.values;
      const km = normalizeKm(v.km);
      const price = normalizePrice(v.price);
      const modelWithVersion = v.version
        ? `${normalizeModel(v.model)} ${v.version}`.trim()
        : normalizeModel(v.model);
      const payload: CompetitorVehicleInsert = {
        brand: normalizeBrand(v.brand),
        model: modelWithVersion,
        version: v.version || null,
        year_model: normalizeYearModel(v.year_model),
        km: km || null,
        price: price || null,
        competitor_id: args.competitorId,
        competitor_name: args.competitorName ?? null,
        source: "arquivo importado",
        source_url: v.source_url || null,
        photo_url: v.photo_url || null,
        city: v.city || null,
      };
      competitorBatch.push(payload);
    }
  }

  // Insert competitor batch in chunks
  if (args.target === "competitor" && competitorBatch.length) {
    const chunkSize = 200;
    let inserted: CompetitorVehicle[] = [];
    for (let i = 0; i < competitorBatch.length; i += chunkSize) {
      const slice = competitorBatch.slice(i, i + chunkSize);
      try {
        const res = await competitorVehicleRepository.bulkInsert(slice);
        inserted = inserted.concat(res);
      } catch (e) {
        insertError += slice.length;
        errorLog.push({
          index: -1,
          errors: [`Erro ao salvar lote de concorrente: ${(e as Error).message}`],
        });
      }
    }
    imported = inserted.length;
  }

  const realErrors = invalid + insertError;
  const failed = realErrors;
  const hasRealErrors = realErrors > 0;

  let status: ImportRunResult["status"];
  if (imported === 0 && !hasRealErrors && duplicateIgnored > 0) {
    status = "no_changes";
  } else if (imported === 0) {
    status = "failed";
  } else if (hasRealErrors) {
    status = "partial";
  } else {
    status = "completed";
  }

  const dbStatus: "completed" | "partial" | "failed" =
    status === "no_changes" ? "completed" : status;

  await importLogRepository.create({
    file_name: args.fileName,
    file_type: args.fileType,
    rows_received: preview.length,
    rows_imported: imported,
    rows_failed: failed,
    rows_duplicated: duplicateIgnored,
    status: dbStatus,
    import_target_type: args.target,
    base_company_id: args.target === "my_vehicles" ? (args.baseCompanyId ?? null) : null,
    competitor_id: args.target === "competitor" ? (args.competitorId ?? null) : null,
    error_log: errorLog.length ? (JSON.parse(JSON.stringify(errorLog)) as never) : null,
    created_by: args.userId,
  });

  return {
    rowsReceived: preview.length,
    rowsImported: imported,
    rowsFailed: failed,
    rowsInvalid: invalid,
    rowsDuplicateIgnored: duplicateIgnored,
    rowsInsertError: insertError,
    status,
    errorLog,
  };
}

export const importEngine = {
  buildPreview,
  buildCompetitorPreview,
  runImport,
};
