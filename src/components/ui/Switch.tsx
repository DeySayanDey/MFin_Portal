"use client";

type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Accessible name; required because the switch has no visible label of its own. */
  label: string;
  disabled?: boolean;
  busy?: boolean;
  className?: string;
};

export function Switch({ checked, onChange, label, disabled = false, busy = false, className = "" }: SwitchProps) {
  const inactive = disabled || busy;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-busy={busy || undefined}
      disabled={inactive}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 ${
        checked ? "border-brand bg-brand" : "border-border bg-slate-200"
      } ${inactive ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${className}`.trim()}
    >
      <span
        aria-hidden="true"
        className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-5 rtl:-translate-x-5" : "translate-x-0.5 rtl:-translate-x-0.5"
        } ${busy ? "animate-pulse" : ""}`}
      />
    </button>
  );
}
