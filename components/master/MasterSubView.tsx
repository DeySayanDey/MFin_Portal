"use client";

import type { ReactNode } from "react";
import { CompanyProfilePanel } from "@/components/master/CompanyProfilePanel";
import {
  GatewayPanel,
  RbacPanel,
  RbiPanel,
  SeedPanel,
  SeriesPanel,
  TimingsPanel,
} from "@/components/master/MasterPanels";

const panelMap: Record<string, () => ReactNode> = {
  "company-profile": () => <CompanyProfilePanel />,
  series: () => <SeriesPanel />,
  timings: () => <TimingsPanel />,
  roles: () => <RbacPanel />,
  gateway: () => <GatewayPanel />,
  "rbi-policies": () => <RbiPanel />,
  "database-seed": () => <SeedPanel />,
};

type MasterSubViewProps = {
  slug: string;
  title: string;
  subtitle: string;
};

export function MasterSubView({ slug, title, subtitle }: MasterSubViewProps) {
  const Panel = panelMap[slug];

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          {title}
        </h1>
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
      </header>

      <div className="min-w-0">{Panel ? <Panel /> : null}</div>
    </div>
  );
}
