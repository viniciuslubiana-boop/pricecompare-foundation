import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { ParsedFile, RawRow } from "../types";

export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_PREVIEW_ROWS = 2000;

export function detectFileType(file: File): "csv" | "xlsx" | null {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv")) return "csv";
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) return "xlsx";
  return null;
}

export async function parseFile(file: File): Promise<ParsedFile> {
  const type = detectFileType(file);
  if (!type) throw new Error("Formato não suportado. Use .csv ou .xlsx");
  if (file.size > MAX_FILE_SIZE) throw new Error("Arquivo muito grande. Máximo 10 MB.");

  if (type === "csv") return parseCSV(file);
  return parseXLSX(file);
}

function parseCSV(file: File): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    Papa.parse<RawRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (result) => {
        const columns = result.meta.fields ?? [];
        const rows = (result.data ?? []).slice(0, MAX_PREVIEW_ROWS);
        resolve({ columns, rows, fileType: "csv" });
      },
      error: (err) => reject(new Error(err.message)),
    });
  });
}

async function parseXLSX(file: File): Promise<ParsedFile> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error("Planilha vazia.");
  const sheet = wb.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json<RawRow>(sheet, {
    defval: "",
    raw: false,
  });
  const rows = json.slice(0, MAX_PREVIEW_ROWS);
  const columns = rows.length ? Object.keys(rows[0]) : [];
  return { columns, rows, fileType: "xlsx" };
}
