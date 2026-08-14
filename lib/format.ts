export function formatCurrency(value: number | null | undefined): string {
  const v = value ?? 0;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatPercent(value: number | null | undefined): string {
  const v = value ?? 0;
  return `${(v * 100).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function toDateInputValue(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toISOString().slice(0, 10);
}
