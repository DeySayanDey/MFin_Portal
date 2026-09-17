import Link from "next/link";

type PlaceholderProps = {
  title: string;
  description: string;
};

export function ModulePlaceholder({ title, description }: PlaceholderProps) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-start gap-3 rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:gap-4 sm:p-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-soft">
        Module
      </p>
      <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
        {title}
      </h1>
      <p className="text-sm leading-6 text-muted">{description}</p>
      <Link
        href="/"
        className="btn btn-primary"
      >
        Back to Executive Dashboard
      </Link>
    </div>
  );
}
