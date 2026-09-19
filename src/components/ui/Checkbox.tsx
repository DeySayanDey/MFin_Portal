type CheckboxProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Boxed row (form cards) vs plain list row. */
  variant?: "box" | "row";
  className?: string;
};

export function Checkbox({
  label,
  checked,
  onChange,
  disabled = false,
  variant = "box",
  className = "",
}: CheckboxProps) {
  if (variant === "row") {
    return (
      <label
        className={`flex cursor-pointer items-start gap-3 text-sm text-slate-700 ${
          disabled ? "cursor-not-allowed opacity-50" : ""
        } ${className}`.trim()}
      >
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-brand focus:ring-brand/30"
        />
        <span>{label}</span>
      </label>
    );
  }

  return (
    <label
      className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-surface-muted px-3 py-2.5 text-sm text-slate-800 ${
        disabled ? "cursor-not-allowed opacity-50" : ""
      } ${className}`.trim()}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-border text-brand focus:ring-brand/30"
      />
      {label}
    </label>
  );
}
