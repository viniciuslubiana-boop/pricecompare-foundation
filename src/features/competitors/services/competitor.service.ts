import { competitorRepository } from "@/repositories/competitor.repository";
import type {
  CompetitorFilters,
  CompetitorInsert,
  CompetitorStatus,
  CompetitorUpdate,
} from "../types/competitor.types";
import type { CompetitorFormValues } from "../schemas/competitor.schema";

/**
 * Competitor Service — ponto único de entrada para qualquer operação
 * sobre concorrentes. Futuras origens (scraping, IA, API, importação)
 * devem passar por aqui, nunca direto no repository.
 */
export const competitorService = {
  list: (filters: CompetitorFilters = {}) => competitorRepository.list(filters),

  create: async (values: CompetitorFormValues, userId: string) => {
    // impede dois concorrentes ATIVOS com a mesma URL
    if (values.status === "active") {
      const dup = await competitorRepository.findActiveByUrl(values.url);
      if (dup) {
        throw new Error(`Já existe um concorrente ativo com esta URL: ${dup.name}.`);
      }
    }
    const payload: CompetitorInsert = {
      name: values.name,
      url: values.url,
      notes: values.notes,
      status: values.status,
      created_by: userId,
    };
    return competitorRepository.create(payload);
  },

  update: async (id: string, values: CompetitorFormValues) => {
    if (values.status === "active") {
      const dup = await competitorRepository.findActiveByUrl(values.url, id);
      if (dup) {
        throw new Error(`Já existe outro concorrente ativo com esta URL: ${dup.name}.`);
      }
    }
    const payload: CompetitorUpdate = {
      name: values.name,
      url: values.url,
      notes: values.notes,
      status: values.status,
    };
    return competitorRepository.update(id, payload);
  },

  setStatus: async (id: string, status: CompetitorStatus) => {
    const payload: CompetitorUpdate = { status };
    return competitorRepository.update(id, payload);
  },

  remove: (id: string) => competitorRepository.delete(id),
};
