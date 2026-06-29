import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export type BulkAliasStatus =
  | "ready"
  | "already_exists"
  | "canonical_not_found"
  | "manual_review";

export interface BulkAliasSeed {
  brand: string;
  alias: string;
  canonical: string;
  manualReviewReason?: string;
}

export interface BulkAliasPreviewItem extends BulkAliasSeed {
  status: BulkAliasStatus;
  master_catalog_id: string | null;
  reason?: string;
}

export interface BulkAliasCommitReport {
  inserted: number;
  skippedAlreadyExists: number;
  skippedNoCanonical: number;
  manualReview: number;
  totalAliasesApproved: number;
  totalLinked: number;
  orphanAliases: number;
  canonicalModelsUsed: number;
}

// ---- Seed list (priority aliases) ----
// Pairs flagged as `manualReviewReason` must NEVER be auto-inserted.
export const PRIORITY_ALIAS_SEEDS: BulkAliasSeed[] = [
  // Honda
  { brand: "Honda", alias: "CG 160 START", canonical: "CG 160" },
  { brand: "Honda", alias: "XRE 300 SAHARA RAL", canonical: "XRE 300" },
  { brand: "Honda", alias: "NXR160 BROS ESDD", canonical: "NXR 160 Bros" },
  { brand: "Honda", alias: "XRE 300 ABS", canonical: "XRE 300" },
  { brand: "Honda", alias: "CG 160 TITAN", canonical: "CG 160 Titan" },
  { brand: "Honda", alias: "CB300F TWISTER ABS", canonical: "CB300F Twister" },
  // Yamaha
  { brand: "Yamaha", alias: "YZF R15 ABS", canonical: "YZF R15" },
  { brand: "Yamaha", alias: "FZ15 FAZER ABS", canonical: "FZ15 Fazer" },
  { brand: "Yamaha", alias: "YBR150 FACTOR ED", canonical: "YBR 150 Factor" },
  // Hyundai
  { brand: "Hyundai", alias: "HB20 1.0 M COMFOR", canonical: "HB20" },
  // Manual review — DO NOT auto-insert
  {
    brand: "Honda",
    alias: "XRE190 ADV",
    canonical: "XRE 190",
    manualReviewReason: "Possível variação (ADV) — revisar antes de aprovar",
  },
  {
    brand: "Yamaha",
    alias: "FZ25 FAZER ABS",
    canonical: "FZ25 Fazer",
    manualReviewReason: "Variante ABS — revisar antes de aprovar",
  },
];

const norm = (s: string) => (s ?? "").toString().trim().toLowerCase();

export async function buildBulkAliasPreview(
  seeds: BulkAliasSeed[] = PRIORITY_ALIAS_SEEDS,
): Promise<BulkAliasPreviewItem[]> {
  const [catalogRes, aliasesRes] = await Promise.all([
    db.from("vehicle_master_catalog").select("id, brand, canonical_model").eq("active", true),
    db.from("vehicle_model_aliases").select("brand, alias"),
  ]);

  const catalog = (catalogRes.data ?? []) as Array<{
    id: string;
    brand: string;
    canonical_model: string;
  }>;
  const aliases = (aliasesRes.data ?? []) as Array<{ brand: string; alias: string }>;

  const canonicalByKey = new Map<string, string>();
  for (const c of catalog) {
    canonicalByKey.set(`${norm(c.brand)}|${norm(c.canonical_model)}`, c.id);
  }
  const aliasSet = new Set(aliases.map((a) => `${norm(a.brand)}|${norm(a.alias)}`));

  return seeds.map<BulkAliasPreviewItem>((seed) => {
    if (seed.manualReviewReason) {
      return {
        ...seed,
        status: "manual_review",
        master_catalog_id: canonicalByKey.get(`${norm(seed.brand)}|${norm(seed.canonical)}`) ?? null,
        reason: seed.manualReviewReason,
      };
    }
    if (aliasSet.has(`${norm(seed.brand)}|${norm(seed.alias)}`)) {
      return { ...seed, status: "already_exists", master_catalog_id: null };
    }
    const mcid = canonicalByKey.get(`${norm(seed.brand)}|${norm(seed.canonical)}`);
    if (!mcid) {
      return {
        ...seed,
        status: "canonical_not_found",
        master_catalog_id: null,
        reason: "Modelo canônico não está no Catálogo Mestre",
      };
    }
    return { ...seed, status: "ready", master_catalog_id: mcid };
  });
}

export async function commitBulkAliases(
  preview: BulkAliasPreviewItem[],
): Promise<BulkAliasCommitReport> {
  const ready = preview.filter((p) => p.status === "ready" && p.master_catalog_id);

  let inserted = 0;
  if (ready.length > 0) {
    const payload = ready.map((r) => ({
      brand: r.brand,
      alias: r.alias,
      canonical: r.canonical,
      master_catalog_id: r.master_catalog_id,
      notes: "Importação em lote — aliases prioritários",
    }));
    const { data, error } = await db
      .from("vehicle_model_aliases")
      .insert(payload)
      .select("id");
    if (error) throw error;
    inserted = (data ?? []).length;
  }

  // Audit log
  try {
    const { data: userRes } = await supabase.auth.getUser();
    await db.from("audit_logs").insert({
      user_id: userRes.user?.id ?? null,
      action: "bulk_import_priority_aliases",
      module: "vehicle_master_catalog",
      new_data: {
        inserted,
        items: ready.map((r) => ({
          brand: r.brand,
          alias: r.alias,
          canonical: r.canonical,
          master_catalog_id: r.master_catalog_id,
        })),
        skipped: preview
          .filter((p) => p.status !== "ready")
          .map((p) => ({ brand: p.brand, alias: p.alias, status: p.status })),
      },
    });
  } catch {
    // audit failure must not block the operation
  }

  // Quick diagnostic
  const { data: allAliases } = await db
    .from("vehicle_model_aliases")
    .select("id, master_catalog_id");
  const aliasesAll = (allAliases ?? []) as Array<{ id: string; master_catalog_id: string | null }>;
  const totalLinked = aliasesAll.filter((a) => a.master_catalog_id).length;

  const { data: usedCanon } = await db
    .from("vehicle_model_aliases")
    .select("master_catalog_id")
    .not("master_catalog_id", "is", null);
  const canonicalModelsUsed = new Set(
    ((usedCanon ?? []) as Array<{ master_catalog_id: string }>).map((u) => u.master_catalog_id),
  ).size;

  return {
    inserted,
    skippedAlreadyExists: preview.filter((p) => p.status === "already_exists").length,
    skippedNoCanonical: preview.filter((p) => p.status === "canonical_not_found").length,
    manualReview: preview.filter((p) => p.status === "manual_review").length,
    totalAliasesApproved: aliasesAll.length,
    totalLinked,
    orphanAliases: aliasesAll.length - totalLinked,
    canonicalModelsUsed,
  };
}
