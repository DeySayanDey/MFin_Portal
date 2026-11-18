import type { ReactNode } from "react";
import { AppRouteLoading } from "@/components/shared/AppRouteLoading";

/**
 * Instant loading UI while the (app) page segment streams / resolves.
 * Also covers hard refreshes before content is ready.
 */
export default function AppLoading() {
  return <AppRouteLoading />;
}
