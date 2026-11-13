import type { InputHTMLAttributes } from "react";

export const controlClass =
  "w-full rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition placeholder:font-normal placeholder:text-muted-soft hover:border-border-strong focus:border-brand focus:bg-surface focus:shadow-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50";

export const controlReadOnlyClass =
  "cursor-default bg-surface-muted font-normal text-slate-700 hover:border-border focus:border-border focus:shadow-none";

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & {
  className?: string;
};

/** Bare text/number input matching portal design tokens. */
export function Input({
  className = "",
  readOnly,
  ...props
}: InputProps) {
  return (
    <input
      {...props}
      autoComplete="off"
      readOnly={readOnly}
      className={`${controlClass} ${readOnly ? controlReadOnlyClass : ""} ${className}`.trim()}
    />
  );
}
