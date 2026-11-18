/** `mst_appl_options` group 27: Current Status (member). */
export const OPT_MEMBER_STATUS = 27;

export const MEMBER_CLOSED = 4;
export const MEMBER_DEATH = 5;
export const CLOSURE_TYPES = [MEMBER_CLOSED, MEMBER_DEATH] as const;
export type ClosureType = (typeof CLOSURE_TYPES)[number];

export const CHECK_IDS = ["group", "loans", "deposits", "shares"] as const;
export type CheckId = (typeof CHECK_IDS)[number];

/** `block` stops closure; `warn` and `unknown` need the officer to confirm. */
export type CheckState = "loading" | "pass" | "block" | "warn" | "unknown";
