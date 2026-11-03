"use client";

import { useSearchParams } from "next/navigation";
import { usePathname } from "@/i18n/navigation";
import {
  DashboardSkeleton,
  PageFormSkeleton,
  PageListSkeleton,
} from "@/components/shared/skeletons";

const FORM_ROUTES = new Set([
  "/master/company-profile",
  "/master/timings",
  "/master/rbi-policies",
  "/master/global-settings",
]);

/** Tab ids in the same order as the section switcher. */
const TAB_ORDER: Record<string, readonly string[]> = {
  "/master/coa-tree": [
    "categories",
    "heads",
    "ledgers",
    "subledgers",
    "branches",
  ],
  "/master/account-ledger-setup": [
    "categories",
    "heads",
    "ledgers",
    "subledgers",
    "branches",
  ],
  "/master/deposit-schemes": ["setup", "charges"],
  "/master/loan-schemes": ["setup", "charges"],
  "/master/charges-setup": ["deposit", "loan"],
};

/** Dedicated routes that always open one chart-of-accounts section. */
const FIXED_TAB: Record<string, { count: number; active: number }> = {
  "/master/account-categories": { count: 5, active: 0 },
  "/master/account-heads": { count: 5, active: 1 },
  "/master/account-ledgers": { count: 5, active: 2 },
  "/master/account-subledgers": { count: 5, active: 3 },
  "/master/account-subledger-branches": { count: 5, active: 4 },
};

function tabSelection(
  pathname: string,
  tab: string | null,
): { count: number; active: number } | null {
  const fixed = FIXED_TAB[pathname];
  if (fixed) return fixed;

  const order = TAB_ORDER[pathname];
  if (!order) return null;

  const normalized = tab === "sub-ledger" ? "subledgers" : tab;
  const index = normalized ? order.indexOf(normalized) : -1;
  return { count: order.length, active: index >= 0 ? index : 0 };
}

/**
 * Path-aware route loading UI for (app) navigations and first paint.
 */
export function AppRouteLoading() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabs = tabSelection(pathname, searchParams.get("tab"));
  let content = (
    <PageListSkeleton tabs={tabs?.count ?? 0} activeTab={tabs?.active ?? 0} />
  );
  if (pathname === "/" || pathname === "" || pathname === "/dashboard") {
    content = <DashboardSkeleton />;
  } else if (FORM_ROUTES.has(pathname)) {
    content = <PageFormSkeleton />;
  }

  return (
    <div className="page-transition page-transition--loading">{content}</div>
  );
}
