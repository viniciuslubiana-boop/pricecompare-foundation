import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];

export type BaseCompany = Tables["base_companies"]["Row"];
export type BaseCompanyInsert = Tables["base_companies"]["Insert"];
export type BaseCompanyUpdate = Tables["base_companies"]["Update"];

export type BaseCompanyType = "carros" | "motos" | "geral";
export type BaseCompanyStatus = "active" | "inactive";

export const BASE_COMPANY_TYPE_LABEL: Record<BaseCompanyType, string> = {
  carros: "Carros",
  motos: "Motos",
  geral: "Geral",
};
