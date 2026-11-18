import { notFound } from "next/navigation";
import { MFinPageView } from "@/features/mfin/components/MFinPageView";
import { MasterSubView } from "@/features/master/components/MasterSubView";
import { resolvePageContent } from "@/lib/mfin/page-content";

const masterPanelSlugs = new Set([
  "company-profile",
  "series",
  "timings",
  "roles",
  "gateway",
  "rbi-policies",
  "database-seed",
]);

/** Removed app URLs — must not be served by MFin catch-all demos. */
const RETIRED_ROUTES = new Set(["/mis/audit-trail", "/security/audit-log"]);

export function createMFinPage(basePath: string) {
  return async function MFinRoutePage({
    params,
  }: {
    params: Promise<{ slug?: string[] }>;
  }) {
    const { slug = [] } = await params;
    const route = slug.length > 0 ? `${basePath}/${slug.join("/")}` : basePath;

    if (RETIRED_ROUTES.has(route)) {
      notFound();
    }

    if (basePath === "/master" && slug.length === 1 && masterPanelSlugs.has(slug[0]!)) {
      return <MasterSubView slug={slug[0]!} />;
    }

    const content = resolvePageContent(route);
    if (!content) {
      notFound();
    }

    return <MFinPageView content={content} />;
  };
}
