import { inventoryService } from "@/features/inventory/services/inventory.service";
import { inventoryVehicleSchema } from "@/features/inventory/schemas/inventory.schema";
import { findDuplicates } from "@/features/inventory/utils/inventory-duplicates";
import { importLogRepository } from "@/repositories/import.repository";
import type { Vehicle } from "@/features/inventory/types/inventory.types";
import type {
  ColumnMapping,
  ImportRunResult,
  PreviewRow,
  RawRow,
  SystemField,
} from "../types";

const FIELD_KEYS: SystemField[] = [
  "brand",
  "model",
  "year_model",
  "km",
  "price",
  "supplier_name",
];

function pick(row: RawRow, mapping: ColumnMapping, field: SystemField): string {
  const col = mapping[field];
  if (!col) return "";
  const v = row[col];
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

export function buildPreview(
  rows: RawRow[],
  mapping: ColumnMapping,
  existing: Vehicle[],
): PreviewRow[] {
  return rows.map((row, index) => {
    const raw = {
      brand: pick(row, mapping, "brand"),
      model: pick(row, mapping, "model"),
      year_model: pick(row, mapping, "year_model"),
      km: pick(row, mapping, "km"),
      price: pick(row, mapping, "price"),
      supplier_name: pick(row, mapping, "supplier_name"),
    };

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

export interface RunImportArgs {
  fileName: string;
  fileType: "csv" | "xlsx";
  rows: RawRow[];
  mapping: ColumnMapping;
  userId: string;
  duplicatesPolicy: "ignore" | "import";
  existing: Vehicle[];
}

export async function runImport(args: RunImportArgs): Promise<ImportRunResult> {
  const preview = buildPreview(args.rows, args.mapping, args.existing);
  const errorLog: Array<{ index: number; errors: string[] }> = [];
  let imported = 0;
  let failed = 0;

  for (const item of preview) {
    if (item.status === "invalid") {
      failed++;
      errorLog.push({ index: item.index, errors: item.errors });
      continue;
    }
    if (item.status === "duplicate" && args.duplicatesPolicy === "ignore") {
      failed++;
      errorLog.push({
        index: item.index,
        errors: [`Duplicada ignorada: ${item.duplicateReason ?? ""}`],
      });
      continue;
    }

    const parsed = inventoryVehicleSchema.safeParse(item.values);
    if (!parsed.success) {
      failed++;
      errorLog.push({
        index: item.index,
        errors: parsed.error.issues.map((i) => i.message),
      });
      continue;
    }

    try {
      await inventoryService.create(parsed.data, args.userId, args.fileType);
      imported++;
    } catch (e) {
      failed++;
      errorLog.push({
        index: item.index,
        errors: [(e as Error).message],
      });
    }
  }

  const status: ImportRunResult["status"] =
    imported === 0 ? "failed" : failed === 0 ? "completed" : "partial";

  await importLogRepository.create({
    file_name: args.fileName,
    file_type: args.fileType,
    rows_received: preview.length,
    rows_imported: imported,
    rows_failed: failed,
    status,
    error_log: errorLog.length ? (JSON.parse(JSON.stringify(errorLog)) as never) : null,
    created_by: args.userId,
  });

  return {
    rowsReceived: preview.length,
    rowsImported: imported,
    rowsFailed: failed,
    status,
    errorLog,
  };
}

export const importEngine = {
  fields: FIELD_KEYS,
  buildPreview,
  runImport,
};
