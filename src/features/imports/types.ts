export type SystemField =
  | "brand"
  | "model"
  | "year_model"
  | "km"
  | "price"
  | "supplier_name";

export const SYSTEM_FIELDS: { key: SystemField; label: string; required: boolean }[] = [
  { key: "brand", label: "Marca", required: true },
  { key: "model", label: "Modelo", required: true },
  { key: "year_model", label: "Ano/Modelo", required: true },
  { key: "km", label: "KM", required: true },
  { key: "price", label: "Valor", required: true },
  { key: "supplier_name", label: "Fornecedor", required: false },
];

export type ColumnMapping = Partial<Record<SystemField, string>>;

export type RawRow = Record<string, unknown>;

export interface ParsedFile {
  columns: string[];
  rows: RawRow[];
  fileType: "csv" | "xlsx";
}

export type RowStatus = "valid" | "invalid" | "duplicate";

export interface PreviewRow {
  index: number;
  values: {
    brand: string;
    model: string;
    year_model: string;
    km: string;
    price: string;
    supplier_name: string;
  };
  status: RowStatus;
  errors: string[];
  duplicateReason?: string;
}

export interface ImportRunResult {
  rowsReceived: number;
  rowsImported: number;
  rowsFailed: number;
  rowsInvalid: number;
  rowsDuplicateIgnored: number;
  rowsInsertError: number;
  status: "completed" | "partial" | "failed" | "no_changes";
  errorLog: Array<{ index: number; errors: string[] }>;
}
