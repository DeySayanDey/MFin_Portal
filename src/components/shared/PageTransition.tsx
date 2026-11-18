"use client";

import type { ReactNode } from "react";
import { usePathname } from "@/i18n/navigation";

type PageTransitionProps = {
  children: ReactNode;
};

/**
 * Smooth enter animation for route content.
 * Remounts on pathname change (and on refresh) so the transition always plays.
 */
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="page-transition">
      {children}
    </div>
  );
}
