import { notFound } from "next/navigation";
import { MFinPageView } from "@/components/mfin/MFinPageView";
import { MasterSubView } from "@/components/master/MasterSubView";
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

const panelTitles: Record<string, { title: string; subtitle: string }> = {
  "company-profile": {
    title: "Company Master Profile",
    subtitle:
      "Official legal entity name, corporate identification number (CIN), and RBI registration",
  },
  series: {
    title: "Series Entry & Auto-Numbering",
    subtitle:
      "Configure distinct numbering formats, prefixes, counters, and padding lengths for all system entities",
  },
  timings: {
    title: "Software Timings & Sessions",
    subtitle:
      "Prevent unauthorized staff logins outside prescribed institutional operating windows",
  },
  roles: {
    title: "Designations & RBAC Permissions",
    subtitle:
      "Grant or restrict operational capabilities (Loan Sanction, Disbursal, Collection, Reversals, Legal Notice)",
  },
  gateway: {
    title: "SMS & WhatsApp Gateway",
    subtitle: "Configure transactional messaging gateways for OTP, EMI reminders, and alerts",
  },
  "rbi-policies": {
    title: "RBI Lending Policies",
    subtitle:
      "Statutory limits mandated under RBI/2021-22/112 Master Direction on Microfinance Loans",
  },
  "database-seed": {
    title: "Database & Seed Data (25+ JSON)",
    subtitle: "Database provider, seed packs, and demo data migration controls",
  },
};

export function createMFinPage(basePath: string) {
  return async function MFinRoutePage({
    params,
  }: {
    params: Promise<{ slug?: string[] }>;
  }) {
    const { slug = [] } = await params;
    const route = slug.length > 0 ? `${basePath}/${slug.join("/")}` : basePath;

    if (basePath === "/master" && slug.length === 1 && masterPanelSlugs.has(slug[0]!)) {
      const meta = panelTitles[slug[0]!]!;
      return (
        <MasterSubView slug={slug[0]!} title={meta.title} subtitle={meta.subtitle} />
      );
    }

    const content = resolvePageContent(route);
    if (!content) {
      notFound();
    }

    return <MFinPageView content={content} />;
  };
}
