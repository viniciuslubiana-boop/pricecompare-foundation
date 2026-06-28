/** Normaliza URL/host para comparações (host + path sem www, sem trailing slash, lower-case). */
export function normalizeForCompare(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const t = raw.trim();
  if (!t) return null;
  let withProto = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  try {
    const u = new URL(withProto);
    const host = u.hostname.replace(/^www\./i, "").toLowerCase();
    const path = u.pathname.replace(/\/+$/, "");
    return `${host}${path}`.toLowerCase();
  } catch {
    return t.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/+$/, "").toLowerCase();
  }
}

/** True quando duas URLs apontam para o mesmo site (host + path). */
export function sameSite(a: string | null | undefined, b: string | null | undefined): boolean {
  const na = normalizeForCompare(a);
  const nb = normalizeForCompare(b);
  if (!na || !nb) return false;
  // mesmo host basta para evitar cadastro como concorrente
  const hostA = na.split("/")[0];
  const hostB = nb.split("/")[0];
  return hostA === hostB;
}
