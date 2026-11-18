import type { ReactNode } from "react";

type AlertTone = "success" | "error" | "warning" | "info";

const toneClass: Record<AlertTone, string> = {
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-rose-200 bg-rose-50 text-rose-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
};

type AlertProps = {
  children: ReactNode;
  tone?: AlertTone;
  className?: string;
};

export function Alert({
  children,
  tone = "info",
  className = "",
}: AlertProps) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-xl border px-4 py-3 text-sm ${toneClass[tone]} ${className}`.trim()}
    >
      {children}
    </p>
  );
}
