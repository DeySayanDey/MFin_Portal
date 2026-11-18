"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

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
  /** Ask "Save these details?" before submitting an edited form. The discard prompt on close is unaffected. */
  confirmOnSave?: boolean;
  /** Ask "Discard changes?" when closing after input. Turn off for search/picker dialogs. */
  confirmOnClose?: boolean;
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
  confirmOnSave = true,
  confirmOnClose = true,
}: ModalProps) {
  const titleId = useId();
  const t = useTranslations("common");
  const tUi = useTranslations("ui");
  const bypassRef = useRef(false);
  const pendingRef = useRef<(() => void) | null>(null);
  const [dirty, setDirty] = useState(false);
  const [prompt, setPrompt] = useState<"close" | "save" | null>(null);

  useEffect(() => {
    if (open) return;
    setDirty(false);
    setPrompt(null);
    pendingRef.current = null;
  }, [open]);

  function requestClose() {
    if (dirty && confirmOnClose) {
      pendingRef.current = null;
      setPrompt("close");
      return;
    }
    onClose();
  }

  function confirmPrompt() {
    const action = pendingRef.current;
    const kind = prompt;
    setPrompt(null);
    pendingRef.current = null;
    if (kind === "close") {
      setDirty(false);
      onClose();
      return;
    }
    if (action) {
      bypassRef.current = true;
      action();
      bypassRef.current = false;
    }
  }

  function onFooterClickCapture(event: MouseEvent<HTMLElement>) {
    if (bypassRef.current || !dirty) return;
    const button = (event.target as HTMLElement).closest("button");
    if (!button || button.disabled) return;
    const save =
      button.type === "submit" || button.classList.contains("btn-primary");
    const dismiss = button.classList.contains("btn-secondary");
    if (!save && !dismiss) return;
    if (save && !confirmOnSave) return;
    if (dismiss && !confirmOnClose) return;
    event.preventDefault();
    event.stopPropagation();
    if (dismiss) {
      pendingRef.current = null;
      setPrompt("close");
      return;
    }
    pendingRef.current = () => button.click();
    setPrompt("save");
  }

  function onSubmitCapture(event: FormEvent<HTMLDivElement>) {
    if (bypassRef.current || !dirty || !confirmOnSave) return;
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    event.preventDefault();
    event.stopPropagation();
    pendingRef.current = () => form.requestSubmit();
    setPrompt("save");
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !prompt) requestClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, dirty, prompt]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="modal-root fixed inset-0 z-[200] grid place-items-center p-4 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        aria-label={t("close")}
        className="absolute inset-0 cursor-pointer bg-slate-950/50"
        onClick={requestClose}
      />

        <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onInput={() => setDirty(true)}
        onChange={() => setDirty(true)}
        onSubmitCapture={onSubmitCapture}
        className={`modal-panel relative z-10 flex w-full max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface shadow-[0_12px_32px_-8px_rgba(15,23,42,0.28)] sm:max-h-[calc(100dvh-3rem)] ${sizeClass[size]} ${className}`.trim()}
      >
        <span
          className="absolute inset-x-0 top-0 h-1 bg-brand"
          aria-hidden
        />

        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border bg-surface px-5 pt-5 pb-4 sm:px-6 sm:pt-6 sm:pb-5">
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
            onClick={requestClose}
            className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border bg-surface text-slate-500 transition hover:border-border-strong hover:bg-surface-muted hover:text-slate-800"
            aria-label={t("close")}
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6">
          {children}
        </div>

        {footer ? (
          <footer
            className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border bg-surface px-5 py-4 sm:px-6"
            onClickCapture={onFooterClickCapture}
          >
            {footer}
          </footer>
        ) : null}
      </div>
      <ConfirmDialog
        open={prompt != null}
        onClose={() => setPrompt(null)}
        onConfirm={confirmPrompt}
        variant={prompt === "close" ? "danger" : "primary"}
        title={prompt === "close" ? tUi("formDiscardTitle") : tUi("formSaveTitle")}
        description={
          prompt === "close" ? tUi("formDiscardMessage") : tUi("formSaveMessage")
        }
        confirmLabel={
          prompt === "close" ? tUi("formDiscardConfirm") : t("save")
        }
        cancelLabel={prompt === "close" ? tUi("formKeepEditing") : t("cancel")}
      />
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
