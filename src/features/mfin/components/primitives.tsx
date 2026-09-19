import type {
  MFinFormField,
  MFinMetric,
  MFinTableColumn,
  MFinTableRow,
} from "@/lib/mfin/types";

const toneMap = {
  green: "bg-brand-soft text-brand-ink",
  blue: "bg-accent-blue-soft text-accent-blue",
  amber: "bg-accent-amber-soft text-amber-800",
  violet: "bg-accent-violet-soft text-accent-violet",
  rose: "bg-accent-rose-soft text-accent-rose",
  slate: "bg-slate-100 text-slate-600",
} as const;

export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <header>
      <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
        {title}
      </h1>
      <p className="mt-1 text-sm leading-6 text-muted">{subtitle}</p>
    </header>
  );
}

export function MetricGrid({ metrics }: { metrics: MFinMetric[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-soft">
            {metric.label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {metric.value}
          </p>
          {metric.hint ? (
            <span
              className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                toneMap[metric.tone ?? "green"]
              }`}
            >
              {metric.hint}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function DataTable({
  title,
  columns,
  rows,
}: {
  title?: string;
  columns: MFinTableColumn[];
  rows: MFinTableRow[];
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]">
      {title ? (
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-surface-muted text-[11px] uppercase tracking-[0.12em] text-muted-soft">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 font-semibold ${
                    col.align === "right"
                      ? "text-right"
                      : col.align === "center"
                        ? "text-center"
                        : "text-left"
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={idx}
                className="border-t border-border/80 hover:bg-surface-muted/60"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-slate-700 ${
                      col.align === "right"
                        ? "text-right font-medium tabular-nums"
                        : col.align === "center"
                          ? "text-center"
                          : "text-left"
                    }`}
                  >
                    {row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function FormGrid({
  title,
  fields,
}: {
  title?: string;
  fields: MFinFormField[];
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
      {title ? (
        <h2 className="mb-4 text-sm font-semibold text-slate-900">{title}</h2>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <label
            key={field.label}
            className={`flex flex-col gap-1.5 ${field.span === 2 ? "sm:col-span-2" : ""}`}
          >
            <span className="text-xs font-medium text-muted">{field.label}</span>
            {field.type === "textarea" ? (
              <textarea
                readOnly
                defaultValue={field.value}
                rows={3}
                className="rounded-xl border border-border bg-surface-muted px-3 py-2 text-sm text-slate-800"
              />
            ) : field.type === "toggle" ? (
              <span className="inline-flex w-fit rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand-ink">
                {field.value}
              </span>
            ) : (
              <input
                readOnly
                defaultValue={field.value}
                className="rounded-xl border border-border bg-surface-muted px-3 py-2 text-sm text-slate-800"
              />
            )}
          </label>
        ))}
      </div>
    </section>
  );
}

export function InfoCards({
  cards,
}: {
  cards: Array<{ title: string; body: string; badge?: string }>;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <article
          key={card.title}
          className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]"
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900">{card.title}</h3>
            {card.badge ? (
              <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand-ink">
                {card.badge}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm leading-6 text-muted">{card.body}</p>
        </article>
      ))}
    </div>
  );
}

export function NotesPanel({ notes }: { notes: string[] }) {
  return (
    <section className="rounded-2xl border border-dashed border-border bg-surface-muted/70 p-4">
      <ul className="space-y-2 text-sm leading-6 text-muted">
        {notes.map((note) => (
          <li key={note}>• {note}</li>
        ))}
      </ul>
    </section>
  );
}

export function ActionBar({ actions }: { actions: string[] }) {
  return (
    <div className="btn-actions">
      {actions.map((action, idx) => {
        const isPrimary = idx === actions.length - 1;
        return (
          <button
            key={action}
            type="button"
            className={isPrimary ? "btn btn-primary" : "btn btn-secondary"}
          >
            {action}
          </button>
        );
      })}
    </div>
  );
}
