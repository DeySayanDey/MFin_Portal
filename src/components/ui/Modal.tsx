"use client";

import {
  useEffect,
  useId,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

type ModalSize = "sm" | "md" | "lg" | "xl";

const sizeClass: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-5xl",
};

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  className?: string;
};

/**
 * Viewport-centered dialog via portal (avoids parent transform / overflow clipping).
 */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "lg",
  className = "",
}: ModalProps) {
  const titleId = useId();
  const t = useTranslations("common");

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="modal-root fixed inset-0 z-[200] grid place-items-center p-4 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        aria-label={t("close")}
        className="absolute inset-0 cursor-pointer bg-slate-950/55 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`modal-panel relative z-10 flex w-full max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_25px_50px_-12px_rgba(15,23,42,0.35)] sm:max-h-[calc(100dvh-3rem)] ${sizeClass[size]} ${className}`.trim()}
      >
        <span
          className="absolute inset-x-0 top-0 h-1 bg-brand"
          aria-hidden
        />

        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border bg-surface-muted/80 px-5 pt-5 pb-4 sm:px-6 sm:pt-6 sm:pb-5">
          <div className="min-w-0 pe-2">
            <h2
              id={titleId}
              className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl"
            >
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-1.5 text-sm leading-5 text-muted">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border bg-surface text-slate-500 transition hover:border-slate-300 hover:bg-white hover:text-slate-800"
            aria-label={t("close")}
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6">
          {children}
        </div>

        {footer ? (
          <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border bg-surface-muted px-5 py-4 sm:px-6">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

type ModalBannerProps = {
  children: ReactNode;
  className?: string;
};

export function ModalBanner({ children, className = "" }: ModalBannerProps) {
  return (
    <div
      className={`rounded-xl bg-brand-dark px-4 py-3.5 text-white sm:px-5 ${className}`}
    >
      {children}
    </div>
  );
}

export function ModalSectionTitle({
  icon,
  children,
  trailing,
}: {
  icon?: ReactNode;
  children: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <h3 className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-slate-800">
        {icon}
        {children}
      </h3>
      {trailing}
    </div>
  );
}

/** @deprecated Prefer `@/components/ui/Form` — kept for existing modal callers. */
export {
  FormField,
  formControlClass as modalFieldClass,
  formSelectClass as modalSelectClass,
} from "@/components/ui/Form";

export function ModalCloseButton(
  props: ButtonHTMLAttributes<HTMLButtonElement>,
) {
  return (
    <button type="button" className="btn btn-primary px-5" {...props}>
      Close
    </button>
  );
}
