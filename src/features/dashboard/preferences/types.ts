export type DashboardPeriod = "7d" | "30d" | "90d" | "all";

export interface DashboardFilters {
  period: DashboardPeriod;
  brand: string | null;
  model: string | null;
  competitorId: string | null;
  city: string | null;
  state: string | null;
}

export interface DashboardLayout {
  blockOrder: string[];
}

export interface DashboardPreferences {
  baseCompanyId: string | null;
  filters: DashboardFilters;
  layout: DashboardLayout;
  favorites: string[];
  collapsed: string[];
  hidden: string[];
}

export const DEFAULT_FILTERS: DashboardFilters = {
  period: "30d",
  brand: null,
  model: null,
  competitorId: null,
  city: null,
  state: null,
};

export const DEFAULT_BLOCK_ORDER = [
  "visao-geral",
  "competitividade",
  "mercado",
  "operacao",
];

export const DEFAULT_PREFERENCES: DashboardPreferences = {
  baseCompanyId: null,
  filters: DEFAULT_FILTERS,
  layout: { blockOrder: DEFAULT_BLOCK_ORDER },
  favorites: [],
  collapsed: [],
  hidden: [],
};
