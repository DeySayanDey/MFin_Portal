/** `mst_appl_options` group 50: Group Document Type (see docs/group-kyc-api.md). */
export const OPT_GROUP_DOC_TYPE = 50;
export const OPT_GROUP_DOC_TYPE_NAME = "Group Document Type";

export const GROUP_DOC_REGISTRATION = 1;
export const GROUP_DOC_PAN = 2;
export const GROUP_DOC_BANK = 3;
export const GROUP_DOC_RESOLUTION = 4;
export const GROUP_DOC_BYELAWS = 5;
export const GROUP_DOC_GST = 6;
export const GROUP_DOC_OTHER = 7;
export const GROUP_DOC_TYPES = [
  GROUP_DOC_REGISTRATION,
  GROUP_DOC_PAN,
  GROUP_DOC_BANK,
  GROUP_DOC_RESOLUTION,
  GROUP_DOC_BYELAWS,
  GROUP_DOC_GST,
  GROUP_DOC_OTHER,
] as const;
export type GroupDocType = (typeof GROUP_DOC_TYPES)[number];

export const GROUP_KYC_NO_MAX = 50;

/** Spaces removed and upper-cased; PAN, bank account and GST also lose hyphens. */
export function normalizeGroupKycNo(docTypeCd: number, raw: string): string {
  const upper = raw.trim().toUpperCase().replace(/\s/g, "");
  if (docTypeCd === GROUP_DOC_PAN || docTypeCd === GROUP_DOC_BANK || docTypeCd === GROUP_DOC_GST) {
    return upper.replace(/-/g, "");
  }
  return upper;
}

export function groupKycNumberError(docTypeCd: number, raw: string): "required" | "format" | null {
  const value = normalizeGroupKycNo(docTypeCd, raw);
  if (!value) return "required";
  if (value.length > GROUP_KYC_NO_MAX) return "format";
  if (docTypeCd === GROUP_DOC_PAN && !/^[A-Z]{5}\d{4}[A-Z]$/.test(value)) return "format";
  if (docTypeCd === GROUP_DOC_BANK && !/^\d{9,18}$/.test(value)) return "format";
  if (docTypeCd === GROUP_DOC_GST && !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(value)) {
    return "format";
  }
  if (
    (docTypeCd === GROUP_DOC_REGISTRATION ||
      docTypeCd === GROUP_DOC_RESOLUTION ||
      docTypeCd === GROUP_DOC_BYELAWS ||
      docTypeCd === GROUP_DOC_OTHER) &&
    !/^[A-Z0-9/\-.]{3,50}$/.test(value)
  ) {
    return "format";
  }
  return null;
}
