/**
 * Extraction Service — orquestra parsing, normalização, validação,
 * preview e persistência das linhas extraídas de concorrentes.
 *
 * Toda nova origem (HTML colado, scraping real, IA) deve passar por
 * este serviço. Nada vai direto ao repository.
 */
import { extractionRepository } from "@/repositories/extraction.repository";
import { competitorVehicleRepository } from "../repositories/competitor-vehicle.repository";
import { parseExtractionInput } from "../parsers/extraction.parser";
import {
  applyValidation,
  averageConfidence,
} from "../validators/extraction.validator";
import type {
  ExtractedVehicle,
  ExtractionInput,
  ExtractionPreviewResult,
} from "../types/extraction.types";
import type {
  CompetitorVehicleInsert,
  ExtractionLogInsert,
} from "@/types/database.types";

function summarize(rows: ExtractedVehicle[]) {
  return {
    total: rows.length,
    valid: rows.filter((r) => r.status === "valid").length,
    review: rows.filter((r) => r.status === "review").length,
    invalid: rows.filter((r) => r.status === "invalid").length,
  };
}

export const extractionService = {
  /** Gera preview a partir de texto ou HTML colado. */
  preview(input: ExtractionInput): ExtractionPreviewResult {
    const parsed = parseExtractionInput(input);
    const rows = applyValidation(parsed);
    return { rows, totals: summarize(rows) };
  },

  /** Reaplica validação após edição manual de uma linha. */
  revalidate(rows: ExtractedVehicle[]): ExtractionPreviewResult {
    const next = applyValidation(rows);
    return { rows: next, totals: summarize(next) };
  },

  /** Confirma e persiste somente linhas válidas. */
  async confirm(params: {
    rows: ExtractedVehicle[];
    competitorId: string;
    competitorName: string;
    competitorUrl: string | null;
    userId: string;
  }) {
    const totals = summarize(params.rows);
    const validRows = params.rows.filter((r) => r.status === "valid");

    let savedCount = 0;
    let logStatus: "completed" | "partial" | "failed" = "completed";
    const errorLog: { row: number; errors: string[] }[] = [];

    params.rows.forEach((r, i) => {
      if (r.status !== "valid") {
        errorLog.push({ row: i + 1, errors: r.errors });
      }
    });

    try {
      if (validRows.length) {
        const payload: CompetitorVehicleInsert[] = validRows.map((r) => ({
          brand: r.brand,
          model: r.model,
          year_model: r.year_model,
          km: r.km,
          price: r.price,
          source_url: r.source_url,
          competitor_name: params.competitorName,
          confidence: {
            ...r.confidence,
            average: averageConfidence(r),
          },
        }));
        const inserted = await competitorVehicleRepository.bulkInsert(payload);
        savedCount = inserted.length;
      }
      if (savedCount === 0) logStatus = "failed";
      else if (savedCount < totals.total) logStatus = "partial";
    } catch (err) {
      logStatus = "failed";
      errorLog.push({
        row: 0,
        errors: [err instanceof Error ? err.message : String(err)],
      });
    }

    const logPayload: ExtractionLogInsert = {
      competitor_id: params.competitorId,
      url: params.competitorUrl ?? "manual://paste",
      status: logStatus,
      started_by: params.userId,
      finished_at: new Date().toISOString(),
      vehicles_found: savedCount,
      pages_processed: 1,
      total_pages: 1,
      checkpoint_page: 1,
      error_log: errorLog.length ? errorLog : null,
    };

    await extractionRepository.create(logPayload);

    return { savedCount, totals, status: logStatus };
  },
};
