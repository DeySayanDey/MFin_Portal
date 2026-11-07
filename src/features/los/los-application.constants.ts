/** `mst_appl_options` group 35 — Relationship (nominee / guarantor). */
export const OPT_RELATION = 35;
/** Self relation is not valid for a guarantor. */
export const RELATION_SELF = 9;

/** `mst_appl_options` group 37 — Application Status. */
export const APPL_STATUS_OPT_GRP_ID = 37;

/** `mst_appl_options` group 38 — Inspection Result (1 Positive, 2 Negative, 3 Re-Inspection). */
export const OPT_INSPECTION_RESULT = 38;

export const APPL_STATUS_SUBMITTED = 1;
export const APPL_STATUS_APPROVED = 2;
export const APPL_STATUS_REJECTED = 3;
export const APPL_STATUS_RESUBMISSION = 4;

export const APPL_STATUS_CODES = [
  APPL_STATUS_SUBMITTED,
  APPL_STATUS_APPROVED,
  APPL_STATUS_REJECTED,
  APPL_STATUS_RESUBMISSION,
] as const;

export type ApplStatusCode = (typeof APPL_STATUS_CODES)[number];

const APPL_STATUS_KEYS: Record<ApplStatusCode, string> = {
  [APPL_STATUS_SUBMITTED]: "submitted",
  [APPL_STATUS_APPROVED]: "approved",
  [APPL_STATUS_REJECTED]: "rejected",
  [APPL_STATUS_RESUBMISSION]: "resubmission",
};

export function isApplStatusCode(value: number): value is ApplStatusCode {
  return value === 1 || value === 2 || value === 3 || value === 4;
}

/** Translation key under `los.applications.applStatus.*` for a known code. */
export function applStatusKey(code: number): string | null {
  return isApplStatusCode(code) ? APPL_STATUS_KEYS[code] : null;
}
