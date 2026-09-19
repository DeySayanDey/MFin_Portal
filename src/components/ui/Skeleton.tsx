import type { HTMLAttributes } from "react";

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  /** Visual shape preset. */
  rounded?: "md" | "lg" | "xl" | "2xl" | "full";
};

const roundedClass = {
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  full: "rounded-full",
} as const;

/**
 * Base shimmer block — compose into page / table / sidebar / dashboard skeletons.
 */
export function Skeleton({
  className = "",
  rounded = "lg",
  ...props
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse bg-slate-200/80 ${roundedClass[rounded]} ${className}`.trim()}
      {...props}
    />
  );
}
