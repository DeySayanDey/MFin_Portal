"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2, type LucideIcon } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "success"
  | "warning"
  | "amber"
  | "violet"
  | "soft"
  | "danger";

type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  /** When true, shows spinner and disables button */
  loading?: boolean;
  /** Omit for icon-only buttons (provide `aria-label` or `tooltip`). */
  children?: ReactNode;
  /** Project UI tooltip label (replaces native `title`). */
  tooltip?: string;
};

const variantClass: Record<ButtonVariant, string> = {
  primary: "btn btn-primary",
  secondary: "btn btn-secondary",
  ghost: "btn btn-ghost",
  success: "btn btn-success",
  warning: "btn btn-warning",
  amber: "btn btn-amber",
  violet: "btn btn-violet",
  soft: "btn btn-soft",
  danger: "btn btn-danger",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "btn-sm",
  md: "",
  lg: "btn-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  icon: Icon,
  loading = false,
  className = "",
  children,
  type = "button",
  tooltip,
  disabled,
  ...props
}: ButtonProps) {
  const iconOnly =
    Boolean(Icon || loading) &&
    (children === undefined || children === null || children === "");

  const button = (
    <button
      type={type}
      className={`${variantClass[variant]} ${sizeClass[size]} ${
        iconOnly ? "btn-icon" : ""
      } ${className}`.trim()}
      disabled={disabled || loading}
      aria-busy={loading ? "true" : undefined}
      {...props}
      aria-label={props["aria-label"] ?? tooltip}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
      ) : Icon ? (
        <Icon className="h-4 w-4 shrink-0" />
      ) : null}
      {!iconOnly ? children : null}
    </button>
  );

  if (tooltip) {
    return <Tooltip label={tooltip}>{button}</Tooltip>;
  }

  return button;
}

export function ButtonActions({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`btn-actions ${className}`.trim()}>{children}</div>
  );
}
