"use client";

import {
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type TooltipSide = "top" | "bottom";

type TooltipProps = {
  label: string;
  children: ReactNode;
  side?: TooltipSide;
  className?: string;
};

/**
 * Project tooltip — soft card surface, not native browser `title`.
 * Uses a fixed portal so it is not clipped by table overflow.
 */
export function Tooltip({
  label,
  children,
  side = "top",
  className = "",
}: TooltipProps) {
  const id = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  function place() {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCoords({
      top: side === "top" ? rect.top - 8 : rect.bottom + 8,
      left: rect.left + rect.width / 2,
    });
    setOpen(true);
  }

  function hide() {
    setOpen(false);
  }

  return (
    <>
      <span
        ref={triggerRef}
        className={`inline-flex cursor-pointer ${className}`.trim()}
        onMouseEnter={place}
        onMouseLeave={hide}
        onFocus={place}
        onBlur={hide}
      >
        {children}
      </span>
      {open
        ? createPortal(
            <span
              id={id}
              role="tooltip"
              className={`pointer-events-none fixed z-[120] max-w-[14rem] rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-foreground shadow-[var(--shadow-card)] ${
                side === "top" ? "-translate-x-1/2 -translate-y-full" : "-translate-x-1/2"
              }`}
              style={{ top: coords.top, left: coords.left }}
            >
              {label}
            </span>,
            document.body,
          )
        : null}
    </>
  );
}
