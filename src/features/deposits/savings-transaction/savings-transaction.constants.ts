export const TRANS_DEPOSIT = 1;
export const TRANS_WITHDRAWAL = 2;
export const STATUS_POSTED = 1;
export const STATUS_PENDING = 2;
export const STATUS_REJECTED = 3;
export const OPT_TRANS_TYPE = 36;

export const TRANS_MODES = ["CA", "CQ", "TR", "OL"] as const;
export type TransMode = (typeof TRANS_MODES)[number];

/** Statuses that block a withdrawal. Freezed (4) also blocks deposits. */
export const WITHDRAWAL_BLOCKED = new Set([2, 3, 4, 5, 7]);
export const DEPOSIT_BLOCKED = new Set([4]);
