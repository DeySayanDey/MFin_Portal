"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import {
  Check,
  CircleAlert,
  Info,
  TriangleAlert,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  dismissToast,
  getToasts,
  subscribeToasts,
  TOAST_DURATION_MS,
  type ToastTone,
} from "@/components/ui/toast";

const toneClass: Record<ToastTone, string> = {
  success: "toast-card--success",
  error: "toast-card--error",
  warning: "toast-card--warning",
  info: "toast-card--info",
};

const toneIcon: Record<ToastTone, LucideIcon> = {
  success: Check,
  error: CircleAlert,
  warning: TriangleAlert,
  info: Info,
};

export function Toaster() {
  const t = useTranslations("common");
  const items = useSyncExternalStore(subscribeToasts, getToasts, getToasts);
  const knownIds = useRef(new Set<number>());
  const [mounted, setMounted] = useState(false);
  const incomingId =
    [...items].reverse().find((item) => !knownIds.current.has(item.id))?.id ??
    null;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    for (const item of items) knownIds.current.add(item.id);
  }, [items]);

  if (!mounted || items.length === 0) return null;

  const stacked = items.slice(-4);
  const settled = stacked.filter((item) => !item.leaving);

  return createPortal(
    <div
      className="toast-stack pointer-events-none fixed top-4 right-4 z-[240] w-[min(22rem,calc(100vw-2rem))]"
      aria-live="polite"
    >
      {stacked.map((item) => {
        const Icon = toneIcon[item.tone];
        const depth = item.leaving
          ? 0
          : settled.length - 1 - settled.indexOf(item);
        return (
          <div
            key={item.id}
            role="status"
            data-depth={depth}
            className={`toast-card relative flex gap-3 overflow-hidden rounded-2xl border px-3.5 py-3 text-sm shadow-[var(--shadow-card)] ${
              item.detail || item.action ? "items-start" : "items-center"
            } ${toneClass[item.tone]} ${
              item.id === incomingId ? "toast-card--fresh" : ""
            } ${item.leaving ? "toast-card--leaving" : ""}`}
            style={{ ["--toast-life" as string]: `${TOAST_DURATION_MS}ms` }}
          >
            <span className="toast-sheen pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-white/40" />
            <span className="relative flex h-7 w-7 shrink-0 items-center justify-center">
              <span className="toast-ring absolute inset-0 rounded-full border-2 border-current" />
              <span className="toast-icon relative flex h-7 w-7 items-center justify-center rounded-full">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="leading-5">{item.message}</p>
              {item.detail ? (
                <p className="mt-0.5 line-clamp-2 text-xs leading-5 opacity-80">{item.detail}</p>
              ) : null}
              {item.action ? (
                <button
                  type="button"
                  className="mt-1 text-xs font-semibold underline"
                  onClick={() => {
                    item.action?.onClick();
                    dismissToast(item.id);
                  }}
                >
                  {item.action.label}
                </button>
              ) : null}
            </div>
            <button
              type="button"
              className="rounded-md p-0.5 opacity-60 hover:opacity-100"
              aria-label={t("close")}
              onClick={() => dismissToast(item.id)}
            >
              <X className="h-4 w-4" />
            </button>
            {item.id === incomingId && !item.leaving ? (
              <span
                className="toast-life absolute inset-x-0 bottom-0 h-0.5"
                aria-hidden="true"
              />
            ) : null}
          </div>
        );
      })}
    </div>,
    document.body,
  );
}
