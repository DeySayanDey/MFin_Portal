import { CompanyProfilePanel } from "@/components/master/CompanyProfilePanel";

export function MasterSetupView() {
  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          Institution Master Setup & System Administration
        </h1>
        <p className="mt-1 text-sm text-muted">
          Configure Company Profile, Auto-Numbering Series, Operational Timings,
          Role Permissions, Gateways & RBI Policies from the Master Menu
        </p>
      </header>

      <CompanyProfilePanel />
    </div>
  );
}
