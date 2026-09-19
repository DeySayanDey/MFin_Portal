/**
 * Time helpers for Working Hours.
 * Domain/API use HH:mm. Existing UI uses 12-hour "hh:mm AM/PM".
 */

const HHMM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DISPLAY_RE = /^(0?[1-9]|1[0-2]):([0-5]\d)\s*(AM|PM)$/i;

export function isValidHhmm(value: string): boolean {
  return HHMM_RE.test(value.trim());
}

/** Convert validated HH:mm to minutes since midnight. */
export function hhmmToMinutes(value: string): number | null {
  const match = value.trim().match(HHMM_RE);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** API HH:mm → UI "hh:mm AM/PM". Returns original string if not valid HH:mm. */
export function hhmmToDisplay(hhmm: string): string {
  const match = hhmm.trim().match(HHMM_RE);
  if (!match) return hhmm;
  let hours = Number(match[1]);
  const minutes = match[2]!;
  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${String(hours).padStart(2, "0")}:${minutes} ${period}`;
}

/**
 * UI "hh:mm AM/PM" → API HH:mm.
 * Also accepts already-valid HH:mm (passthrough).
 * Returns null when the value cannot be parsed.
 */
export function displayToHhmm(display: string): string | null {
  const trimmed = display.trim();
  if (isValidHhmm(trimmed)) return trimmed;

  const match = trimmed.match(DISPLAY_RE);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = match[2]!;
  const period = match[3]!.toUpperCase();

  if (period === "AM") {
    if (hours === 12) hours = 0;
  } else if (hours !== 12) {
    hours += 12;
  }

  return `${String(hours).padStart(2, "0")}:${minutes}`;
}
