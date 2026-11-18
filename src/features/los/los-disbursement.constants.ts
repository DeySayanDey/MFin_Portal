/** `mst_appl_options` group 41: Payment Mode. */
export const OPT_PAYMENT_MODE = 41;

export const PAY_MODE_CASH = 1;
export const PAY_MODE_CHEQUE = 2;
export const PAY_MODE_BANK_TRANSFER = 3;
export const PAY_MODE_SB_ACCOUNT = 4;
export const PAY_MODE_ADJUSTMENT = 5;

/** Used only when the options API is unavailable; `key` is under `los.applications.disbursement.modes`. */
export const PAYMENT_MODE_FALLBACK = [
  { value: String(PAY_MODE_CASH), key: "cash" },
  { value: String(PAY_MODE_CHEQUE), key: "cheque" },
  { value: String(PAY_MODE_BANK_TRANSFER), key: "bankTransfer" },
  { value: String(PAY_MODE_SB_ACCOUNT), key: "sbAccount" },
  { value: String(PAY_MODE_ADJUSTMENT), key: "adjustment" },
] as const;

export const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const ACCOUNT_NO_PATTERN = /^\d{9,18}$/;
