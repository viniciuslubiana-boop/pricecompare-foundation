/**
 * Vehicle Catalog Normalizer
 *
 * Resolve o nome do modelo via Catálogo Mestre + aliases aprovados
 * (vehicle_model_aliases.master_catalog_id NOT NULL) ANTES do
 * Comparison Engine preparar os veículos.
 *
 * Regras (PCM_BUSINESS_RULES.md):
 *   - Não flexibiliza o matching; apenas reescreve o `model` quando
 *     houver alias APROVADO por administrador.
 *   - Sem alias aprovado → comportamento original preservado.
 *   - Sem fuzzy matching. Comparação exata após normalização
 *     (collapse de espaços/pontuação + lowercase).
 *   - Não persiste alterações: apenas devolve clones com `model`
 *     reescrito; o dado original em `my_vehicles` / `competitor_vehicles`
 *     permanece intacto.
 */
import { supabase } from "@/integrations/supabase/client";
import type { CompetitorVehicle, MyVehicle } from "@/types/database.types";
import { normToken } from "./vehicle-equivalence";

export interface ApprovedAlias {
  brand: string;
  alias: string;
  canonical: string;
  master_catalog_id: string;
}

export interface AliasAuditEntry {
  vehicleId: string;
  brand: string;
  originalModel: string;
  alias: string;
  canonicalModel: string;
  masterCatalogId: string;
}

/** Map key: `${normToken(brand)}|${normToken(alias)}`. */
export type ApprovedAliasMap = Map<
  string,
  { canonical: string; master_catalog_id: string }
>;

const keyOf = (brand: string, model: string): string =>
  `${normToken(brand)}|${normToken(model)}`;

/** Carrega aliases aprovados do Supabase (uma única vez por execução). */
export async function loadApprovedAliases(): Promise<ApprovedAliasMap> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data, error } = await db
    .from("vehicle_model_aliases")
    .select("brand, alias, canonical, master_catalog_id")
    .not("master_catalog_id", "is", null);
  if (error) throw error;
  return buildAliasMap((data ?? []) as ApprovedAlias[]);
}

export function buildAliasMap(rows: ApprovedAlias[]): ApprovedAliasMap {
  const map: ApprovedAliasMap = new Map();
  for (const r of rows) {
    if (!r.master_catalog_id) continue;
    map.set(keyOf(r.brand, r.alias), {
      canonical: r.canonical,
      master_catalog_id: r.master_catalog_id,
    });
  }
  return map;
}

/**
 * Aplica o canônico em UM veículo (clone superficial).
 * Retorna o próprio objeto quando não houver alias aprovado correspondente.
 */
export function applyCatalogAlias<T extends MyVehicle | CompetitorVehicle>(
  vehicle: T,
  aliases: ApprovedAliasMap,
  audit?: AliasAuditEntry[],
): T {
  if (!vehicle?.brand || !vehicle?.model) return vehicle;
  const k = keyOf(vehicle.brand, vehicle.model);
  const hit = aliases.get(k);
  if (!hit) return vehicle;
  // Já é exatamente o canônico — evita clone e auditoria ruidosa.
  if (vehicle.model.trim() === hit.canonical.trim()) return vehicle;

  if (audit) {
    audit.push({
      vehicleId: vehicle.id,
      brand: vehicle.brand,
      originalModel: vehicle.model,
      alias: vehicle.model,
      canonicalModel: hit.canonical,
      masterCatalogId: hit.master_catalog_id,
    });
  }
  return { ...vehicle, model: hit.canonical } as T;
}

/** Aplica em lote. Cache em memória — não consulta Supabase. */
export function applyCatalogAliases<T extends MyVehicle | CompetitorVehicle>(
  list: T[],
  aliases: ApprovedAliasMap,
  audit?: AliasAuditEntry[],
): T[] {
  if (aliases.size === 0) return list;
  return list.map((v) => applyCatalogAlias(v, aliases, audit));
}
