"use client";

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
]);

/**
 * Path-aware route loading UI for (app) navigations and first paint.
 */
export function AppRouteLoading() {
  const pathname = usePathname();

  let content = <PageListSkeleton />;
  if (pathname === "/" || pathname === "") {
    content = <DashboardSkeleton />;
  } else if (FORM_ROUTES.has(pathname)) {
    content = <PageFormSkeleton />;
  }

  return (
    <div className="page-transition page-transition--loading">{content}</div>
  );
}
