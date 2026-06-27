import { supabase } from "@/integrations/supabase/client";
import type { Competitor } from "@/types/database.types";

export type CompetitorSourceUrls = {
  ownSite?: string;
  olx?: string;
  webmotors?: string;
  mobiauto?: string;
  icarros?: string;
};

export type LocatorCompetitorInsert = {
  name: string;
  url: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  google_place_id: string;
  created_by: string;
};

export const locatorRepository = {
  async findByPlaceId(placeId: string): Promise<Competitor | null> {
    const { data, error } = await supabase
      .from("competitors")
      .select("*")
      .eq("google_place_id", placeId)
      .limit(1);
    if (error) throw error;
    return (data?.[0] as Competitor | undefined) ?? null;
  },

  async findByPhone(phone: string): Promise<Competitor | null> {
    const digits = phone.replace(/\D/g, "");
    if (!digits) return null;
    const { data, error } = await supabase
      .from("competitors")
      .select("*")
      .not("phone", "is", null)
      .limit(50);
    if (error) throw error;
    const match = (data ?? []).find(
      (c) => (c.phone ?? "").replace(/\D/g, "") === digits,
    );
    return (match as Competitor | undefined) ?? null;
  },

  async findByNameAndAddress(name: string, address: string): Promise<Competitor | null> {
    const n = name.trim().toLowerCase();
    const a = address.trim().toLowerCase();
    if (!n || !a) return null;
    const { data, error } = await supabase
      .from("competitors")
      .select("*")
      .ilike("name", `%${name.trim().slice(0, 40)}%`)
      .limit(20);
    if (error) throw error;
    const match = (data ?? []).find(
      (c) =>
        c.name.trim().toLowerCase() === n &&
        (c.address ?? "").trim().toLowerCase() === a,
    );
    return (match as Competitor | undefined) ?? null;
  },

  async insert(payload: LocatorCompetitorInsert): Promise<Competitor> {
    const { data, error } = await supabase
      .from("competitors")
      .insert({
        ...payload,
        status: "active",
        source_urls: {},
      })
      .select()
      .single();
    if (error) throw error;
    return data as Competitor;
  },

  async updateSources(id: string, sources: CompetitorSourceUrls): Promise<Competitor> {
    const cleaned: Record<string, string> = {};
    for (const [k, v] of Object.entries(sources)) {
      const t = (v ?? "").trim();
      if (t) cleaned[k] = t;
    }
    const update: { source_urls: Record<string, string>; url?: string | null } = {
      source_urls: cleaned,
    };
    if (cleaned.ownSite) update.url = cleaned.ownSite;
    const { data, error } = await supabase
      .from("competitors")
      .update(update)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Competitor;
  },
};
