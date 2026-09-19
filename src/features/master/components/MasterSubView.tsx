"use client";

import type { ReactNode } from "react";
import { OrganizationForm } from "@/features/master/organization";
import { WorkingHoursForm } from "@/features/master/working-hours";
import { CodeSeriesView } from "@/features/master/code-series";
import { RolesView } from "@/features/master/roles";
import { RbiLendingPolicyForm } from "@/features/master/rbi-lending-policy";
import {
  GatewayPanel,
  SeedPanel,
} from "@/features/master/components/MasterPanels";

const panelMap: Record<string, () => ReactNode> = {
  "company-profile": () => <OrganizationForm />,
  series: () => <CodeSeriesView />,
  timings: () => <WorkingHoursForm />,
  roles: () => <RolesView />,
  gateway: () => <GatewayPanel />,
  "rbi-policies": () => <RbiLendingPolicyForm />,
  "database-seed": () => <SeedPanel />,
};

type MasterSubViewProps = {
  slug: string;
};

/**
 * Master panel host. Page title/subtitle come from the app Header.
 */
export function MasterSubView({ slug }: MasterSubViewProps) {
  const Panel = panelMap[slug];
  return <div className="min-w-0">{Panel ? <Panel /> : null}</div>;
}
