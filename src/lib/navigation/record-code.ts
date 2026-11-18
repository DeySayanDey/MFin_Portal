const MAX_CODE_LENGTH = 60;

/** A record found by its URL code: `id` is used for API calls, `code` is the canonical URL value. */
export type RecordRef = { id: number; code: string };

/** Business code shown in page URLs; the id is used only while a record has no code yet. */
export function recordCode(code: string | null | undefined, id: number): string {
  return code?.trim() || String(id);
}

/** `/base/{code}{suffix}` with the code encoded as a single path segment. */
export function recordPath(base: string, code: string, suffix = ""): string {
  return `${base}/${encodeURIComponent(code)}${suffix}`;
}

/** Reads a code from a route segment or query value; null when it cannot be a record code. */
export function readRecordCode(raw: string | string[] | undefined): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  let decoded = value;
  if (value.includes("%")) {
    try {
      decoded = decodeURIComponent(value);
    } catch {
      return null;
    }
  }
  decoded = decoded.trim();
  if (!decoded || decoded.length > MAX_CODE_LENGTH || /[\u0000-\u001f\u007f]/.test(decoded)) {
    return null;
  }
  return decoded;
}

/** Old links carried the numeric id; such values are resolved by id and redirected to the code. */
export function legacyRecordId(code: string): number | null {
  if (!/^\d+$/.test(code)) return null;
  const id = Number(code);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function sameRecordCode(a: string, b: string): boolean {
  return a.localeCompare(b, undefined, { sensitivity: "accent" }) === 0;
}
