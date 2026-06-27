/**
 * Formatadores de exibição para o módulo de estoque.
 */

export const formatBRL = (v: number | string | null | undefined): string => {
  if (v === null || v === undefined || v === "") return "—";
  const n = typeof v === "string" ? Number(v) : v;
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(n);
};

export const formatKm = (v: number | string | null | undefined): string => {
  if (v === null || v === undefined || v === "") return "—";
  const n = typeof v === "string" ? Number(v) : v;
  if (!Number.isFinite(n)) return "—";
  return `${new Intl.NumberFormat("pt-BR").format(n)} km`;
};

export const formatYearModel = (v: string | null | undefined): string => {
  if (!v) return "—";
  return v.trim();
};
