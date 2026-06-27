/**
 * Normalizadores do Extraction Engine.
 * Reaproveita os normalizadores do Inventory Engine para garantir
 * que veículos do concorrente sigam as mesmas regras.
 */
export {
  normalizeBrand,
  normalizeModel,
  normalizeYearModel,
  normalizeKm,
  normalizePrice,
} from "@/features/inventory/utils/inventory-normalization";

/** Converte HTML em texto plano simples para parsing. */
export function htmlToText(html: string): string {
  if (!html) return "";
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>(\s*)/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n\n")
    .trim();
}
