/**
 * FIPE Statistics — métrica complementar.
 *
 * NUNCA substitui métricas principais de Comparação (Empresa Base vs
 * Concorrentes). Apenas refleta a relação entre o preço praticado e a
 * referência FIPE para os veículos com FIPE confirmada.
 */
import { analyticsRepository } from "../repositories/analytics.repository";
import {
  computeFipeIndicators,
  type FipeIndicators,
} from "@/features/fipe/utils/fipe-indicators";

export const fipeStatisticsService = {
  compute: computeFipeIndicators,
  async load(baseCompanyId?: string | null): Promise<FipeIndicators> {
    const vehicles = await analyticsRepository.listMyVehicles(baseCompanyId);
    return computeFipeIndicators(vehicles);
  },
};

export type { FipeIndicators };
