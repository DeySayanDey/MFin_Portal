/**
 * When Laravel MenuTree leaves `route` null, map known items to app pages.
 * Prefer Laravel route when present and safe.
 */

import { sanitizeMenuRoute } from "@/features/navigation/utils/safe-menu-route";

/** Canonical Executive Dashboard. */
export const EXECUTIVE_DASHBOARD_ROUTE = "/dashboard";

/** Canonical Audit & Security page (matches MenuTree). */
export const AUDIT_SECURITY_ROUTE = "/security/audit-logs";

/** Canonical login attempt and password policy page. */
export const LOGIN_SETTINGS_ROUTE = "/security/login-settings";

/** Canonical Fiscal Year Setup page (matches MenuTree). */
export const FISCAL_YEAR_ROUTE = "/master/fiscal-year";

/** Canonical Holiday Calendar page (matches MenuTree). */
export const HOLIDAY_CALENDAR_ROUTE = "/master/holiday-calendar";

/** Canonical Business Hours / Operational Days page (matches MenuTree). */
export const BUSINESS_HOURS_ROUTE = "/master/business-hours";

/** Canonical Account Categories page (matches MenuTree). */
export const ACCOUNT_CATEGORIES_ROUTE = "/master/account-categories";

/** Canonical Account Main Heads page (matches MenuTree). */
export const ACCOUNT_HEADS_ROUTE = "/master/account-heads";

/** Canonical Account Ledgers page (matches MenuTree). */
export const ACCOUNT_LEDGERS_ROUTE = "/master/account-ledgers";

/** Canonical Account Subledgers page (matches MenuTree). */
export const ACCOUNT_SUBLEDGERS_ROUTE = "/master/account-subledgers";

/** Canonical Subledger↔Branch mapping page (matches MenuTree). */
export const ACCOUNT_SUBLEDGER_BRANCHES_ROUTE =
  "/master/account-subledger-branches";

/** Canonical Deposit Schemes page. */
export const DEPOSIT_SCHEMES_ROUTE = "/master/deposit-schemes";

/** Canonical Charges Setup page. */
export const CHARGES_SETUP_ROUTE = "/master/charges-setup";

/** Canonical Loan Schemes page. */
export const LOAN_SCHEMES_ROUTE = "/master/loan-schemes";

/** Canonical Loan Interest Slabs page. */
export const LOAN_ROI_SLABS_ROUTE = "/master/loan-roi-slabs";

/** Canonical Loan Eligibility Setup page. */
export const LOAN_ELIGIBILITY_ROUTE = "/master/loan-eligibility-setup";

/** Stable keys: `${menuId}:${submenuId}` for children; `${menuId}` for parents. */
const MENU_ROUTE_FALLBACKS: Record<string, string> = {
  // Master Menu → Business Hours (Operational Days)
  "2:3": BUSINESS_HOURS_ROUTE,
  // Master Menu → Fiscal Year Setup
  "2:11": FISCAL_YEAR_ROUTE,
  // Master Menu → Holiday Calendar
  "2:12": HOLIDAY_CALENDAR_ROUTE,
  // User & Security → Audit & Security
  "17:6": AUDIT_SECURITY_ROUTE,
};

function fallbackKey(menuId: number, submenuId?: number | null): string {
  if (submenuId == null) return String(menuId);
  return `${menuId}:${submenuId}`;
}

/**
 * Resolve a navigable app path for a menu node/child.
 * API route wins when valid; otherwise use known local fallbacks.
 */
export function resolveMenuRoute(options: {
  route: string | null | undefined;
  menuId: number;
  submenuId?: number | null;
  name?: string | null;
}): string | null {
  const fromApi = sanitizeMenuRoute(options.route);
  const name = (options.name ?? "").trim().toLowerCase();
  const isDashboard =
    name === "dashboard" ||
    name === "executive dashboard" ||
    name === "executive dashbord";

  if (isDashboard && (!fromApi || fromApi === "/dashboard" || fromApi === "/home")) {
    return EXECUTIVE_DASHBOARD_ROUTE;
  }

  if (fromApi) return fromApi;

  const byId =
    MENU_ROUTE_FALLBACKS[fallbackKey(options.menuId, options.submenuId)];
  if (byId) return byId;

  if (name === "audit & security" || name === "audit and security") {
    return AUDIT_SECURITY_ROUTE;
  }
  if (
    name === "login settings" ||
    name === "login security" ||
    name === "login & password policy" ||
    name === "password policy" ||
    name === "login attempts"
  ) {
    return LOGIN_SETTINGS_ROUTE;
  }
  if (name === "fiscal year setup" || name === "fiscal year") {
    return FISCAL_YEAR_ROUTE;
  }
  if (name === "holiday calendar" || name === "holidays") {
    return HOLIDAY_CALENDAR_ROUTE;
  }
  if (
    name === "business hours" ||
    name === "operational days" ||
    name === "operational day"
  ) {
    return BUSINESS_HOURS_ROUTE;
  }
  if (
    name === "account categories" ||
    name === "account category" ||
    name === "acct category" ||
    name === "acct categories"
  ) {
    return ACCOUNT_CATEGORIES_ROUTE;
  }
  if (
    name === "account heads" ||
    name === "account head" ||
    name === "acct head" ||
    name === "acct heads" ||
    name === "account main heads" ||
    name === "main heads"
  ) {
    return ACCOUNT_HEADS_ROUTE;
  }
  if (
    name === "account ledgers" ||
    name === "account ledger" ||
    name === "acct ledger" ||
    name === "acct ledgers" ||
    name === "ledgers"
  ) {
    return ACCOUNT_LEDGERS_ROUTE;
  }
  if (
    name === "account subledgers" ||
    name === "account subledger" ||
    name === "acct subledger" ||
    name === "acct subledgers" ||
    name === "sub ledgers" ||
    name === "sub-ledgers" ||
    name === "subledgers" ||
    name === "sub-ledger master"
  ) {
    return ACCOUNT_SUBLEDGERS_ROUTE;
  }
  if (
    name === "subledger branches" ||
    name === "subledger branch" ||
    name === "subledger branch mapping" ||
    name === "subledger branch mappings" ||
    name === "account subledger branches" ||
    name === "acct subledger branch"
  ) {
    return ACCOUNT_SUBLEDGER_BRANCHES_ROUTE;
  }
  if (
    name === "deposit schemes" ||
    name === "deposit scheme setups"
  ) {
    return DEPOSIT_SCHEMES_ROUTE;
  }
  if (
    name === "charges setup" ||
    name === "charge setup" ||
    name === "charges-setup"
  ) {
    return CHARGES_SETUP_ROUTE;
  }
  if (name === "loan schemes" || name === "loan scheme") {
    return LOAN_SCHEMES_ROUTE;
  }
  if (
    name === "loan interest slabs" ||
    name === "loan interest slab" ||
    name === "loan roi slabs" ||
    name === "loan roi slab" ||
    name === "loan scheme slabs" ||
    name === "loan scheme slab"
  ) {
    return LOAN_ROI_SLABS_ROUTE;
  }
  if (
    name === "loan eligibility setup" ||
    name === "loan eligibility" ||
    name === "loan eligibility parameters" ||
    name === "loan eligibility parameter"
  ) {
    return LOAN_ELIGIBILITY_ROUTE;
  }

  return null;
}
