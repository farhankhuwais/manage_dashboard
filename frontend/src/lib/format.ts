export function formatRupiahShort(n: number | undefined | null): string {
  const v = Number(n || 0);
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000) return `Rp${(v / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (abs >= 1_000_000) return `Rp${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}jt`;
  if (abs >= 1_000) return `Rp${Math.round(v / 1_000)}rb`;
  return `Rp${v}`;
}

export function formatRupiah(n: number | undefined | null): string {
  return "Rp" + (Number(n) || 0).toLocaleString("id-ID");
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}
