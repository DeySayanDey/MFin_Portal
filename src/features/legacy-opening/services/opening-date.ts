export function openingDateToInput(value: string | null | undefined): string {
  if (!value) return "";
  const iso = /^(\d{4}-\d{2}-\d{2})(?:$|[T ])/.exec(value);
  if (iso) return iso[1];
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : "";
}

export function openingDateBeforeFinancialYear(startDate?: string): string {
  const normalized = openingDateToInput(startDate);
  if (!normalized) return "";
  const date = new Date(`${normalized}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== normalized) return "";
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}
