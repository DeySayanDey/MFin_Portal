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

export function termMaturityDate(startDate: string, tenure: string, termCodeOrLabel: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d+$/.test(tenure)) return "";
  const count = Number(tenure);
  const normalized = termCodeOrLabel.trim().toLowerCase();
  const code =
    normalized === "1" || /^days?$/.test(normalized) ? "1"
    : normalized === "2" || /^weeks?$/.test(normalized) ? "2"
    : normalized === "3" || /^months?$/.test(normalized) ? "3"
    : normalized === "4" || /^years?$/.test(normalized) ? "4"
    : "";

  const maxLimits: Record<string, number> = { "1": 120, "2": 17, "3": 120, "4": 50 };
  const maximum = maxLimits[code] ?? 0;
  if (!Number.isSafeInteger(count) || count < 1 || count > maximum) return "";
  const start = new Date(`${startDate}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || start.toISOString().slice(0, 10) !== startDate) return "";

  if (code === "1") {
    // Days (Term 1)
    start.setUTCDate(start.getUTCDate() + count);
  } else if (code === "2") {
    // Weeks (Term 2)
    start.setUTCDate(start.getUTCDate() + count * 7);
  } else if (code === "3") {
    // Months (Term 3)
    const day = start.getUTCDate();
    start.setUTCDate(1);
    start.setUTCMonth(start.getUTCMonth() + count);
    const endOfMonth = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate();
    start.setUTCDate(Math.min(day, endOfMonth));
  } else if (code === "4") {
    // Years (Term 4)
    const day = start.getUTCDate();
    start.setUTCDate(1);
    start.setUTCFullYear(start.getUTCFullYear() + count);
    const endOfMonth = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate();
    start.setUTCDate(Math.min(day, endOfMonth));
  } else {
    return "";
  }
  return start.toISOString().slice(0, 10);
}
