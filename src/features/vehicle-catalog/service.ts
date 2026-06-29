import { supabase } from "@/integrations/supabase/client";
import type { VehicleMasterCatalogInput, VehicleMasterCatalogRow } from "./types";

// Use a relaxed typing: the generated Database types may not yet reflect the
// new table at editor time, but it exists at runtime.
const TABLE = "vehicle_master_catalog" as const;
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

// ---- Audit helpers ----

export interface CatalogAuditReport {
  vehiclesWithoutCanonical: Array<{ id: string; brand: string; model: string }>;
  orphanAliases: Array<{ id: string; brand: string; alias: string; canonical: string }>;
  duplicatedModels: Array<{ brand: string; canonical_model: string; count: number }>;
}

export async function loadCatalogAudit(): Promise<CatalogAuditReport> {
  // Catalog entries
  const { data: catalog } = await db.from(TABLE).select("brand, canonical_model");
  const canonicalSet = new Set<string>(
    (catalog ?? []).map((c: { brand: string; canonical_model: string }) =>
      `${c.brand.toLowerCase()}|${c.canonical_model.toLowerCase()}`,
    ),
  );

  // Vehicles missing a corresponding catalog entry
  const { data: vehicles } = await db
    .from("my_vehicles")
    .select("id, brand, model")
    .limit(2000);
  const vehiclesWithoutCanonical = ((vehicles ?? []) as Array<{ id: string; brand: string; model: string }>)
    .filter((v) => !canonicalSet.has(`${(v.brand ?? "").toLowerCase()}|${(v.model ?? "").toLowerCase()}`))
    .slice(0, 200);

  // Orphan aliases: aliases without master_catalog_id
  const { data: aliases } = await db
    .from("vehicle_model_aliases")
    .select("id, brand, alias, canonical, master_catalog_id");
  const orphanAliases = ((aliases ?? []) as Array<{
    id: string;
    brand: string;
    alias: string;
    canonical: string;
    master_catalog_id: string | null;
  }>)
    .filter((a) => !a.master_catalog_id)
    .map(({ id, brand, alias, canonical }) => ({ id, brand, alias, canonical }));

  // Duplicated canonical models (case-insensitive brand+model)
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
