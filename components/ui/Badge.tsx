import type { ReactNode } from "react";

export type BadgeTone =
  | "success"
  | "warning"
  | "info"
  | "danger"
  | "neutral"
  | "amber"
  | "violet";

const toneClass: Record<BadgeTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-blue-200 bg-blue-50 text-blue-700",
  danger: "border-rose-200 bg-rose-50 text-rose-700",
  neutral: "border-slate-200 bg-slate-100 text-slate-600",
  amber: "border-amber-300 bg-amber-50 text-amber-800",
  violet: "border-violet-200 bg-violet-50 text-violet-700",
};

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
  caps?: boolean;
};

export function Badge({
  children,
  tone = "neutral",
  className = "",
  caps = true,
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wide ${
        caps ? "uppercase" : "normal-case tracking-normal"
      } ${toneClass[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
