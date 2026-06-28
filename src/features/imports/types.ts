export type ImportTargetType = "my_vehicles" | "competitor";

export type SystemField =
  | "brand"
  | "model"
  | "version"
  | "year_model"
  | "km"
  | "price"
  | "supplier_name"
  | "source_url"
  | "photo_url"
  | "city";

export interface SystemFieldDef {
  key: SystemField;
  label: string;
  requiredFor: ImportTargetType[];
  availableFor: ImportTargetType[];
}

export const SYSTEM_FIELDS: SystemFieldDef[] = [
  { key: "brand", label: "Marca", requiredFor: ["my_vehicles", "competitor"], availableFor: ["my_vehicles", "competitor"] },
  { key: "model", label: "Modelo", requiredFor: ["my_vehicles", "competitor"], availableFor: ["my_vehicles", "competitor"] },
  { key: "version", label: "Versão", requiredFor: [], availableFor: ["competitor"] },
  { key: "year_model", label: "Ano/Modelo", requiredFor: ["my_vehicles", "competitor"], availableFor: ["my_vehicles", "competitor"] },
  { key: "km", label: "KM", requiredFor: ["my_vehicles"], availableFor: ["my_vehicles", "competitor"] },
  { key: "price", label: "Valor", requiredFor: ["my_vehicles", "competitor"], availableFor: ["my_vehicles", "competitor"] },
  { key: "supplier_name", label: "Fornecedor", requiredFor: [], availableFor: ["my_vehicles"] },
  { key: "source_url", label: "Link do anúncio", requiredFor: [], availableFor: ["competitor"] },
  { key: "photo_url", label: "Foto (URL)", requiredFor: [], availableFor: ["competitor"] },
  { key: "city", label: "Cidade", requiredFor: [], availableFor: ["competitor"] },
];

export function fieldsForTarget(target: ImportTargetType): SystemFieldDef[] {
  return SYSTEM_FIELDS.filter((f) => f.availableFor.includes(target));
}

export function requiredFieldsForTarget(target: ImportTargetType): SystemField[] {
  return SYSTEM_FIELDS.filter((f) => f.requiredFor.includes(target)).map((f) => f.key);
}

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
    version: string;
    year_model: string;
    km: string;
    price: string;
    supplier_name: string;
    source_url: string;
    photo_url: string;
    city: string;
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
