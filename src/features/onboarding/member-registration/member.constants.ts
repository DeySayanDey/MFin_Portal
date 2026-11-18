export const REF_CODE_MAX_LENGTH = 30;

/** Letters, digits and `-` `/` `_`, starting with a letter or digit (e.g. CUST-2026-0004). */
export const REF_CODE_PATTERN = /^[A-Z0-9][A-Z0-9\-/_]*$/;

/** Mirrors the deposit nominee rule in `USP_DEPOSIT_NOMINEE_ADD_EDIT`. */
export const MEMBER_NOMINEE_MAX = 4;
export const NOMINEE_NAME_MAX_LENGTH = 150;
export const NOMINEE_MOBILE_PATTERN = /^[6-9]\d{9}$/;

export type NomineeListIssue = "max" | "invalid" | "duplicate" | "shareRequired" | "shareTotal";

type NomineeLike = {
  name: string;
  relationCd: number;
  dob: string | null;
  mobile: string | null;
  sharePercent: number | null;
};

/** Shares are optional for a single nominee; with two or more, every share is required and they must total 100. */
export function nomineeListIssue(nominees: NomineeLike[], today: string): NomineeListIssue | null {
  if (nominees.length > MEMBER_NOMINEE_MAX) return "max";
  for (const n of nominees) {
    const name = n.name.trim();
    if (!name || name.length > NOMINEE_NAME_MAX_LENGTH) return "invalid";
    if (!Number.isInteger(n.relationCd) || n.relationCd <= 0) return "invalid";
    if (n.dob && (!/^\d{4}-\d{2}-\d{2}$/.test(n.dob) || n.dob > today)) return "invalid";
    if (n.mobile && !NOMINEE_MOBILE_PATTERN.test(n.mobile)) return "invalid";
    if (n.sharePercent != null && !(n.sharePercent > 0 && n.sharePercent <= 100)) return "invalid";
  }
  const keys = nominees.map((n) => `${n.name.trim().toLowerCase()}|${n.relationCd}`);
  if (new Set(keys).size !== keys.length) return "duplicate";
  if (nominees.length > 1) {
    if (nominees.some((n) => n.sharePercent == null)) return "shareRequired";
    const total = nominees.reduce((sum, n) => sum + Math.round((n.sharePercent ?? 0) * 100), 0);
    if (total !== 10000) return "shareTotal";
  } else if (nominees.length === 1 && nominees[0].sharePercent != null && nominees[0].sharePercent !== 100) {
    return "shareTotal";
  }
  return null;
}

export function refCodeError(raw: string): string | null {
  const value = raw.trim().toUpperCase();
  if (!value) return null;
  if (value.length > REF_CODE_MAX_LENGTH) {
    return `Reference code cannot exceed ${REF_CODE_MAX_LENGTH} characters`;
  }
  if (!REF_CODE_PATTERN.test(value)) {
    return "Reference code may only contain letters, digits, -, / and _";
  }
  return null;
}
