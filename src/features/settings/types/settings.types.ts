export type ThemePref = "light" | "dark" | "system";

export interface ReferenceStoreSettings {
  /** Loja de Referência ativa — empresa base de todas as comparações do PCM. */
  name: string;
  city: string;
  state: string;
  website: string;
  logoUrl: string;
  mainStock: string;
  active: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface GeneralSettings {
  companyName: string;
  city: string;
  state: string;
  currency: "BRL";
  theme: ThemePref;
}

export interface ComparisonSettings {
  minCompatibility: number; // 0..100
  yearTolerance: number;
  kmTolerance: number; // km
  priceTolerance: number; // %
  sameYearOnly: boolean;
  considerVersion: boolean;
}

export type MarketSource = "site" | "olx" | "webmotors" | "mobiauto" | "icarros";
export type UpdateFrequency = "manual" | "daily" | "weekly";

export interface MarketSettings {
  defaultRadiusKm: number;
  sources: MarketSource[];
  frequency: UpdateFrequency;
}

export type DuplicateStrategy = "ignore" | "import" | "update";

export interface ImportSettings {
  duplicateStrategy: DuplicateStrategy;
  csvDelimiter: "," | ";" | "auto";
  trimWhitespace: boolean;
}

export interface ReportSettings {
  showLogo: boolean;
  showDateTime: boolean;
  showCompetitors: boolean;
  showPriceHistory: boolean;
  showListingLinks: boolean;
}

export interface AppSettingsBundle {
  general: GeneralSettings;
  comparison: ComparisonSettings;
  market: MarketSettings;
  imports: ImportSettings;
  reports: ReportSettings;
}

export const SETTINGS_KEYS = {
  general: "general",
  comparison: "comparison",
  market: "market",
  imports: "imports",
  reports: "reports",
} as const;

export type SettingsKey = keyof typeof SETTINGS_KEYS;

export const DEFAULT_SETTINGS: AppSettingsBundle = {
  general: {
    companyName: "",
    city: "",
    state: "",
    currency: "BRL",
    theme: "system",
  },
  comparison: {
    minCompatibility: 80,
    yearTolerance: 1,
    kmTolerance: 15000,
    priceTolerance: 5,
    sameYearOnly: false,
    considerVersion: true,
  },
  market: {
    defaultRadiusKm: 50,
    sources: ["site", "olx", "webmotors", "mobiauto", "icarros"],
    frequency: "manual",
  },
  imports: {
    duplicateStrategy: "ignore",
    csvDelimiter: "auto",
    trimWhitespace: true,
  },
  reports: {
    showLogo: true,
    showDateTime: true,
    showCompetitors: true,
    showPriceHistory: true,
    showListingLinks: true,
  },
};
