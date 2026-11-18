/** Passport and driving licence must have an expiry date. */
export const EXPIRY_REQUIRED_TYPES = new Set([4, 5]);

export function todayYmd(): string {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Spaces removed and upper-cased. Hyphens also removed for Aadhaar, voter ID, passport, and licence. */
export function normalizeKycNo(docTypeCd: number, raw: string): string {
  const upper = raw.trim().toUpperCase();
  if (docTypeCd === 1 || docTypeCd === 2 || docTypeCd === 4 || docTypeCd === 5) {
    return upper.replace(/[\s-]/g, "");
  }
  return upper.replace(/\s/g, "");
}

export function kycNumberError(docTypeCd: number, raw: string): "required" | "format" | null {
  const value = normalizeKycNo(docTypeCd, raw);
  if (!value) return "required";
  if (docTypeCd === 1 && !/^[2-9]\d{11}$/.test(value)) return "format";
  if (docTypeCd === 2 && !/^[A-Z]{3}\d{7}$/.test(value)) return "format";
  if (docTypeCd === 3 && !/^[A-Z0-9/-]{4,20}$/.test(value)) return "format";
  if (docTypeCd === 4 && !/^[A-Z]\d{7}$/.test(value)) return "format";
  if (docTypeCd === 5 && !/^[A-Z]{2}\d{2}[A-Z0-9]{9,12}$/.test(value)) return "format";
  if (docTypeCd === 6 && !/^[A-Z0-9/-]{3,25}$/.test(value)) return "format";
  return null;
}
