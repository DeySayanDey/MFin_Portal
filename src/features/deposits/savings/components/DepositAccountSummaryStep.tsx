"use client";

type SummaryRow = {
  label: string;
  value: string;
};

type SummarySection = {
  title: string;
  rows: SummaryRow[];
};

export function DepositAccountSummaryStep({
  sections,
}: {
  sections: SummarySection[];
}) {
  return (
    <div className="flex flex-col gap-4">
      {sections.map((section) => (
        <section
          key={section.title}
          className="rounded-xl border border-border bg-surface-muted p-3"
        >
          <h3 className="text-sm font-semibold text-slate-800">{section.title}</h3>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            {section.rows.map((row) => (
              <div key={`${section.title}-${row.label}`} className="min-w-0">
                <dt className="text-xs font-semibold text-slate-600">{row.label}</dt>
                <dd className="wrap-break-word text-sm text-slate-800">{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
