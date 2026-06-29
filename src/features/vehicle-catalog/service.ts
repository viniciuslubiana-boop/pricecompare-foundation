import { supabase } from "@/integrations/supabase/client";
import type {
  AliasSuggestion,
  CoverageReport,
  VehicleAliasInput,
  VehicleAliasRow,
  VehicleMasterCatalogInput,
  VehicleMasterCatalogRow,
} from "./types";

const TABLE = "vehicle_master_catalog" as const;
const ALIAS_TABLE = "vehicle_model_aliases" as const;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const vehicleCatalogService = {
  async list(): Promise<VehicleMasterCatalogRow[]> {
    const { data, error } = await db
      .from(TABLE)
      .select("*")
      .order("brand", { ascending: true })
      .order("canonical_model", { ascending: true });
    if (error) throw error;
    return (data ?? []) as VehicleMasterCatalogRow[];
  },
  async create(input: VehicleMasterCatalogInput): Promise<VehicleMasterCatalogRow> {
    const { data, error } = await db.from(TABLE).insert(input).select("*").single();
    if (error) throw error;
    return data as VehicleMasterCatalogRow;
  },
  async update(id: string, input: Partial<VehicleMasterCatalogInput>): Promise<VehicleMasterCatalogRow> {
    const { data, error } = await db.from(TABLE).update(input).eq("id", id).select("*").single();
    if (error) throw error;
    return data as VehicleMasterCatalogRow;
  },
  async setActive(id: string, active: boolean): Promise<void> {
    const { error } = await db.from(TABLE).update({ active }).eq("id", id);
    if (error) throw error;
  },
  async remove(id: string): Promise<void> {
    const { error } = await db.from(TABLE).delete().eq("id", id);
    if (error) throw error;
  },
};

// ---- Aliases ----

export const vehicleAliasService = {
  async list(): Promise<VehicleAliasRow[]> {
    const { data, error } = await db
      .from(ALIAS_TABLE)
      .select("*")
      .order("brand", { ascending: true })
      .order("alias", { ascending: true });
    if (error) throw error;
    return (data ?? []) as VehicleAliasRow[];
  },
  async create(input: VehicleAliasInput): Promise<VehicleAliasRow> {
    const payload = { ...input, notes: input.notes ?? null };
    const { data, error } = await db.from(ALIAS_TABLE).insert(payload).select("*").single();
    if (error) throw error;
    return data as VehicleAliasRow;
  },
  async update(id: string, input: Partial<VehicleAliasInput>): Promise<VehicleAliasRow> {
    const { data, error } = await db.from(ALIAS_TABLE).update(input).eq("id", id).select("*").single();
    if (error) throw error;
    return data as VehicleAliasRow;
  },
  async unlink(id: string): Promise<void> {
    const { error } = await db.from(ALIAS_TABLE).update({ master_catalog_id: null }).eq("id", id);
    if (error) throw error;
  },
  async remove(id: string): Promise<void> {
    const { error } = await db.from(ALIAS_TABLE).delete().eq("id", id);
    if (error) throw error;
  },
};

// ---- Audit ----

export interface CatalogAuditReport {
  vehiclesWithoutCanonical: Array<{ id: string; brand: string; model: string }>;
  orphanAliases: Array<{ id: string; brand: string; alias: string; canonical: string }>;
  duplicatedModels: Array<{ brand: string; canonical_model: string; count: number }>;
}

export async function loadCatalogAudit(): Promise<CatalogAuditReport> {
  const { data: catalog } = await db.from(TABLE).select("brand, canonical_model");
  const canonicalSet = new Set<string>(
    (catalog ?? []).map((c: { brand: string; canonical_model: string }) =>
      `${c.brand.toLowerCase()}|${c.canonical_model.toLowerCase()}`,
    ),
  );

  const { data: vehicles } = await db.from("my_vehicles").select("id, brand, model").limit(2000);
  const vehiclesWithoutCanonical = ((vehicles ?? []) as Array<{ id: string; brand: string; model: string }>)
    .filter((v) => !canonicalSet.has(`${(v.brand ?? "").toLowerCase()}|${(v.model ?? "").toLowerCase()}`))
    .slice(0, 200);

  const { data: aliases } = await db
    .from(ALIAS_TABLE)
    .select("id, brand, alias, canonical, master_catalog_id");
  const orphanAliases = ((aliases ?? []) as Array<{
    id: string; brand: string; alias: string; canonical: string; master_catalog_id: string | null;
  }>)
    .filter((a) => !a.master_catalog_id)
    .map(({ id, brand, alias, canonical }) => ({ id, brand, alias, canonical }));

  const counts = new Map<string, { brand: string; canonical_model: string; count: number }>();
  for (const c of (catalog ?? []) as Array<{ brand: string; canonical_model: string }>) {
    const key = `${c.brand.toLowerCase()}|${c.canonical_model.toLowerCase()}`;
    const existing = counts.get(key);
    if (existing) existing.count++;
    else counts.set(key, { brand: c.brand, canonical_model: c.canonical_model, count: 1 });
  }
  const duplicatedModels = Array.from(counts.values()).filter((c) => c.count > 1);

  return { vehiclesWithoutCanonical, orphanAliases, duplicatedModels };
}

// ---- Coverage Report ----

function norm(s: string | null | undefined): string {
  return (s ?? "").toString().trim().toLowerCase();
}

export async function loadCoverageReport(): Promise<CoverageReport> {
  const [catalogRes, vehiclesRes, aliasesRes] = await Promise.all([
    db.from(TABLE).select("brand, canonical_model"),
    db.from("my_vehicles").select("id, brand, model"),
    db.from(ALIAS_TABLE).select("id, brand, alias, master_catalog_id"),
  ]);

  const catalog = (catalogRes.data ?? []) as Array<{ brand: string; canonical_model: string }>;
  const vehicles = (vehiclesRes.data ?? []) as Array<{ id: string; brand: string; model: string }>;
  const aliases = (aliasesRes.data ?? []) as Array<{
    id: string; brand: string; alias: string; master_catalog_id: string | null;
  }>;

  const canonicalSet = new Set(catalog.map((c) => `${norm(c.brand)}|${norm(c.canonical_model)}`));
  const aliasSet = new Set(
    aliases
      .filter((a) => a.master_catalog_id)
      .map((a) => `${norm(a.brand)}|${norm(a.alias)}`),
  );

  let resolved = 0;
  for (const v of vehicles) {
    const k = `${norm(v.brand)}|${norm(v.model)}`;
    if (canonicalSet.has(k) || aliasSet.has(k)) resolved++;
  }

  const dupMap = new Map<string, number>();
  for (const c of catalog) {
    const k = `${norm(c.brand)}|${norm(c.canonical_model)}`;
    dupMap.set(k, (dupMap.get(k) ?? 0) + 1);
  }

  return {
    totalVehicles: vehicles.length,
    resolvedVehicles: resolved,
    unresolvedVehicles: vehicles.length - resolved,
    totalAliases: aliases.length,
    orphanAliases: aliases.filter((a) => !a.master_catalog_id).length,
    duplicatedModels: Array.from(dupMap.values()).filter((n) => n > 1).length,
  };
}

// ---- Alias Suggestions ----

export async function suggestAliases(): Promise<AliasSuggestion[]> {
  const [catalogRes, myRes, compRes, aliasesRes] = await Promise.all([
    db.from(TABLE).select("id, brand, canonical_model").eq("active", true),
    db.from("my_vehicles").select("brand, model"),
    db.from("competitor_vehicles").select("brand, model"),
    db.from(ALIAS_TABLE).select("brand, alias"),
  ]);

  const catalog = (catalogRes.data ?? []) as Array<{
    id: string; brand: string; canonical_model: string;
  }>;
  const myVehicles = (myRes.data ?? []) as Array<{ brand: string; model: string }>;
  const compVehicles = (compRes.data ?? []) as Array<{ brand: string; model: string }>;
  const existingAliases = (aliasesRes.data ?? []) as Array<{ brand: string; alias: string }>;

  const canonicalByBrand = new Map<string, Array<{ id: string; canonical_model: string }>>();
  for (const c of catalog) {
    const k = norm(c.brand);
    if (!canonicalByBrand.has(k)) canonicalByBrand.set(k, []);
    canonicalByBrand.get(k)!.push({ id: c.id, canonical_model: c.canonical_model });
  }
  const exactCanonicalSet = new Set(
    catalog.map((c) => `${norm(c.brand)}|${norm(c.canonical_model)}`),
  );
  const aliasSet = new Set(existingAliases.map((a) => `${norm(a.brand)}|${norm(a.alias)}`));

  // Count occurrences of (brand, model) across sources
  const counter = new Map<
    string,
    { brand: string; model: string; my: number; comp: number }
  >();
  for (const v of myVehicles) {
    const k = `${norm(v.brand)}|${norm(v.model)}`;
    const cur = counter.get(k) ?? { brand: v.brand, model: v.model, my: 0, comp: 0 };
    cur.my++;
    counter.set(k, cur);
  }
  for (const v of compVehicles) {
    const k = `${norm(v.brand)}|${norm(v.model)}`;
    const cur = counter.get(k) ?? { brand: v.brand, model: v.model, my: 0, comp: 0 };
    cur.comp++;
    counter.set(k, cur);
  }

  const collapse = (s: string) => norm(s).replace(/[^a-z0-9]/g, "");

  const suggestions: AliasSuggestion[] = [];
  for (const [key, info] of counter) {
    if (exactCanonicalSet.has(key)) continue;       // already canonical, skip
    if (aliasSet.has(key)) continue;                // already mapped as alias
    const candidates = canonicalByBrand.get(norm(info.brand)) ?? [];
    if (candidates.length === 0) continue;
    const modelCollapsed = collapse(info.model);
    if (!modelCollapsed) continue;

    let best: { id: string; canonical_model: string } | null = null;
    for (const c of candidates) {
      const cc = collapse(c.canonical_model);
      if (!cc) continue;
      if (cc === modelCollapsed || cc.startsWith(modelCollapsed) || modelCollapsed.startsWith(cc)) {
        best = c;
        break;
      }
      if (cc.includes(modelCollapsed) || modelCollapsed.includes(cc)) {
        best = c;
      }
    }
    if (!best) continue;

    suggestions.push({
      brand: info.brand,
      alias: info.model,
      canonical: best.canonical_model,
      master_catalog_id: best.id,
      occurrences: info.my + info.comp,
      source: info.my > 0 && info.comp > 0 ? "both" : info.my > 0 ? "my_vehicles" : "competitor_vehicles",
    });
  }

  suggestions.sort((a, b) => b.occurrences - a.occurrences);
  return suggestions.slice(0, 200);
}
