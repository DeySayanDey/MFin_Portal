import type {
  MFinFormField,
  MFinMetric,
  MFinTableColumn,
  MFinTableRow,
} from "@/lib/mfin/types";
import { DataTable as SharedDataTable } from "@/components/shared/DataTable";
import type { DataTableColumn } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextAreaField, TextField } from "@/components/ui/Form";

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
          className="rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-card)]"
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
  const mapped: DataTableColumn<MFinTableRow>[] = columns.map((col) => ({
    id: col.key,
    header: col.label,
    align:
      col.align === "right" ? "end" : col.align === "center" ? "center" : "start",
    className: col.align === "right" ? "font-medium tabular-nums" : undefined,
    cell: (row) => row[col.key] ?? "",
  }));

  return (
    <SharedDataTable
      title={title}
      data={rows}
      columns={mapped}
      getRowKey={(_row, index) => String(index)}
    />
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
    <Card title={title}>
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((field) => {
          const span = field.span === 2 ? "sm:col-span-2" : "";
          if (field.type === "toggle") {
            return (
              <div key={field.label} className={span}>
                <p className="mb-1.5 text-xs font-semibold text-slate-600">
                  {field.label}
                </p>
                <span className="inline-flex w-fit rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand-ink">
                  {field.value}
                </span>
              </div>
            );
          }
          if (field.type === "textarea") {
            return (
              <div key={field.label} className={span}>
                <TextAreaField
                  label={field.label}
                  value={field.value}
                  rows={3}
                  disabled
                  onChange={() => undefined}
                />
              </div>
            );
          }
          return (
            <div key={field.label} className={span}>
              <TextField label={field.label} value={field.value} readOnly />
            </div>
          );
        })}
      </div>
    </Card>
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
          className="rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-card)]"
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
    <section className="rounded-[var(--radius-card)] border border-dashed border-border bg-surface-muted p-4">
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
          <Button
            key={action}
            type="button"
            variant={isPrimary ? "primary" : "secondary"}
          >
            {action}
          </Button>
        );
      })}
    </div>
  );
}
