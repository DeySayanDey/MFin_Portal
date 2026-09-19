import type { InputHTMLAttributes } from "react";

export const controlClass =
  "w-full rounded-xl border border-border bg-surface-muted px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-muted-soft hover:border-slate-300 focus:border-brand/40 focus:bg-white focus:ring-4 focus:ring-brand/10 disabled:cursor-not-allowed disabled:opacity-50";

export const controlReadOnlyClass =
  "cursor-default bg-slate-50 text-slate-600 hover:border-border focus:border-border focus:ring-0";

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
      readOnly={readOnly}
      className={`${controlClass} ${readOnly ? controlReadOnlyClass : ""} ${className}`.trim()}
    />
  );
}
