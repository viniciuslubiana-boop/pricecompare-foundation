import { competitorRepository } from "@/repositories/competitor.repository";
import { settingsService } from "@/features/settings/services/settings.service";
import { sameSite } from "@/features/settings/utils/url";
import type {
  CompetitorFilters,
  CompetitorInsert,
  CompetitorStatus,
  CompetitorUpdate,
} from "../types/competitor.types";
import type { CompetitorFormValues } from "../schemas/competitor.schema";

/**
 * Bloqueia cadastrar a Loja de Referência como concorrente.
 * Carrega settings sob demanda para não acoplar o engine.
 */
async function assertNotReferenceStore(url: string): Promise<void> {
  try {
    const bundle = await settingsService.loadAll();
    const ref = bundle.referenceStore;
    if (ref?.active && ref.website && sameSite(ref.website, url)) {
      throw new Error("Esta empresa já está configurada como Loja de Referência.");
    }
  } catch (err) {
    // só re-lança se for a mensagem do bloqueio
    if (err instanceof Error && err.message.includes("Loja de Referência")) throw err;
  }
}


/**
 * Competitor Service — ponto único de entrada para qualquer operação
 * sobre concorrentes. Futuras origens (scraping, IA, API, importação)
 * devem passar por aqui, nunca direto no repository.
 */
export const competitorService = {
  list: (filters: CompetitorFilters = {}) => competitorRepository.list(filters),
  getById: (id: string) => competitorRepository.findById(id),

  create: async (values: CompetitorFormValues, userId: string) => {
    await assertNotReferenceStore(values.url);
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
    await assertNotReferenceStore(values.url);
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
