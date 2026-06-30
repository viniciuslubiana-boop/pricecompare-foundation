// Utilitário compartilhado para baixar listas de veículos em CSV e XLSX.
// Usado tanto pela Prévia Normalizada do MAE quanto pelo estoque salvo
// (Meu Estoque / Concorrentes).
import Papa from "papaparse";
import * as XLSX from "xlsx";

export interface ExportVehicleRow {
  loja?: string | null;
  tipo?: "Empresa Base" | "Concorrente" | string | null;
  marca?: string | null;
  modelo?: string | null;
  versao?: string | null;
  ano?: string | number | null;
  km?: number | null;
  preco?: number | null;
  link?: string | null;
  imagem?: string | null;
  fonte?: string | null;
  status?: string | null;
  confianca?: number | null;
  data_coleta?: string | null;
}

const HEADERS: Array<{ key: keyof ExportVehicleRow; label: string }> = [
  { key: "loja", label: "Loja" },
  { key: "tipo", label: "Tipo" },
  { key: "marca", label: "Marca" },
  { key: "modelo", label: "Modelo" },
  { key: "versao", label: "Versão" },
  { key: "ano", label: "Ano/Modelo" },
  { key: "km", label: "KM" },
  { key: "preco", label: "Preço" },
  { key: "link", label: "Link do anúncio" },
  { key: "imagem", label: "Imagem" },
  { key: "fonte", label: "Fonte" },
  { key: "status", label: "Status" },
  { key: "confianca", label: "Confiança" },
  { key: "data_coleta", label: "Data da coleta" },
];

function toMatrix(rows: ExportVehicleRow[]): Array<Record<string, unknown>> {
  return rows.map((r) => {
    const out: Record<string, unknown> = {};
    for (const h of HEADERS) out[h.label] = r[h.key] ?? "";
    return out;
  });
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

export function downloadVehiclesCsv(rows: ExportVehicleRow[], baseName = "estoque") {
  const csv = Papa.unparse(toMatrix(rows), { header: true });
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, `${baseName}-${timestamp()}.csv`);
}

export function downloadVehiclesXlsx(rows: ExportVehicleRow[], baseName = "estoque") {
  const ws = XLSX.utils.json_to_sheet(toMatrix(rows));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Estoque");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerDownload(blob, `${baseName}-${timestamp()}.xlsx`);
}
