"use client";

import {
  useCallback,
  useEffect,
  useId,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  Ban,
  Check,
  CheckCircle2,
  HelpCircle,
  PowerOff,
  Trash2,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Button, type ButtonVariant } from "@/components/ui/Button";

export type ConfirmActionType =
  | "activate"
  | "deactivate"
  | "delete"
  | "approve"
  | "reject"
  | "custom";

export type ConfirmVariant =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "neutral";

export type ConfirmDialogProps = {
  /** Controls visibility */
  open: boolean;
  /** Callback fired on cancellation, backdrop click, or ESC key */
  onClose: () => void;
  /**
   * Action invoked when user confirms.
   * Can return a Promise to automatically enter an internal loading state
   * with button spinner and lock backdrop interactions.
   */
  onConfirm: () => void | Promise<void>;
  /** Predefined preset (e.g. "activate", "deactivate", "delete", "approve", "reject") */
  actionType?: ConfirmActionType;
  /** Visual tone of dialog (accent bar, icon badge, confirm button variant) */
  variant?: ConfirmVariant;
  /** Dialog heading. Defaults based on actionType or common confirm title */
  title?: ReactNode;
  /** Detailed description or cautionary note. Defaults based on actionType */
  description?: ReactNode;
  /** Custom confirm button text */
  confirmLabel?: ReactNode;
  /** Custom cancel button text */
  cancelLabel?: ReactNode;
  /** Custom icon overriding the action/variant default */
  icon?: LucideIcon;
  /** Name/identifier of target entity to highlight (e.g., "John Doe (EMP001)") */
  itemName?: string;
  /** Target entity category/label (e.g., "Staff", "Role", "Branch") */
  itemType?: string;
  /** Require user to type this exact keyword to enable confirmation (e.g., "DELETE") */
  confirmKeyword?: string;
  /** Manual external loading flag */
  loading?: boolean;
  /** Disable backdrop click to close */
  disableBackdropClick?: boolean;
  /** Custom dialog container CSS classes */
  className?: string;
  /** Optional body content rendered below description */
  children?: ReactNode;
};

type PresetConfig = {
  defaultVariant: ConfirmVariant;
  icon: LucideIcon;
  titleKey: string;
  descKey: string;
  buttonKey: string;
};

const ACTION_PRESETS: Record<Exclude<ConfirmActionType, "custom">, PresetConfig> = {
  activate: {
    defaultVariant: "success",
    icon: CheckCircle2,
    titleKey: "activate.title",
    descKey: "activate.description",
    buttonKey: "activate.button",
  },
  deactivate: {
    defaultVariant: "warning",
    icon: Ban,
    titleKey: "deactivate.title",
    descKey: "deactivate.description",
    buttonKey: "deactivate.button",
  },
  delete: {
    defaultVariant: "danger",
    icon: Trash2,
    titleKey: "delete.title",
    descKey: "delete.description",
    buttonKey: "delete.button",
  },
  approve: {
    defaultVariant: "success",
    icon: CheckCircle2,
    titleKey: "approve.title",
    descKey: "approve.description",
    buttonKey: "approve.button",
  },
  reject: {
    defaultVariant: "danger",
    icon: XCircle,
    titleKey: "reject.title",
    descKey: "reject.description",
    buttonKey: "reject.button",
  },
};

const VARIANT_STYLES: Record<
  ConfirmVariant,
  {
    topBar: string;
    iconWrap: string;
    buttonVariant: ButtonVariant;
    defaultIcon: LucideIcon;
    buttonIcon: LucideIcon;
  }
> = {
  danger: {
    topBar: "bg-rose-600",
    iconWrap:
      "bg-rose-50 text-rose-600 border-rose-200 ring-rose-500/15",
    buttonVariant: "danger",
    defaultIcon: AlertTriangle,
    buttonIcon: XCircle,
  },
  warning: {
    topBar: "bg-amber-500",
    iconWrap:
      "bg-amber-50 text-amber-600 border-amber-200 ring-amber-500/15",
    buttonVariant: "warning",
    defaultIcon: PowerOff,
    buttonIcon: PowerOff,
  },
  success: {
    topBar: "bg-emerald-600",
    iconWrap:
      "bg-emerald-50 text-emerald-600 border-emerald-200 ring-emerald-500/15",
    buttonVariant: "success",
    defaultIcon: CheckCircle2,
    buttonIcon: CheckCircle2,
  },
  primary: {
    topBar: "bg-brand",
    iconWrap:
      "bg-blue-50 text-blue-600 border-blue-200 ring-blue-500/15",
    buttonVariant: "primary",
    defaultIcon: HelpCircle,
    buttonIcon: Check,
  },
  secondary: {
    topBar: "bg-slate-400",
    iconWrap:
      "bg-slate-100 text-slate-600 border-slate-200 ring-slate-400/15",
    buttonVariant: "secondary",
    defaultIcon: HelpCircle,
    buttonIcon: Check,
  },
  neutral: {
    topBar: "bg-slate-400",
    iconWrap:
      "bg-slate-100 text-slate-600 border-slate-200 ring-slate-400/15",
    buttonVariant: "secondary",
    defaultIcon: HelpCircle,
    buttonIcon: Check,
  },
};

function ConfirmDialogContent({
  onClose,
  onConfirm,
  actionType = "custom",
  variant,
  title,
  description,
  confirmLabel,
  cancelLabel,
  icon: CustomIcon,
  itemName,
  itemType,
  confirmKeyword,
  loading: externalLoading = false,
  disableBackdropClick = false,
  className = "",
  children,
}: Omit<ConfirmDialogProps, "open">) {
  const titleId = useId();
  const descId = useId();
  const t = useTranslations("confirmDialog");
  const tCommon = useTranslations("common");

  const [isInternalBusy, setIsInternalBusy] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");

  const isBusy = externalLoading || isInternalBusy;

  // Resolve presets
  const preset =
    actionType !== "custom" ? ACTION_PRESETS[actionType] : undefined;

  const effectiveVariant: ConfirmVariant =
    variant ?? preset?.defaultVariant ?? "primary";

  const styles = VARIANT_STYLES[effectiveVariant];
  const IconComponent = CustomIcon ?? preset?.icon ?? styles.defaultIcon;
  const ConfirmButtonIcon = CustomIcon ?? preset?.icon ?? styles.buttonIcon;

  // Resolved titles & texts
  const resolvedTitle =
    title ?? (preset ? t(preset.titleKey) : t("defaultTitle"));

  const resolvedDescription =
    description ?? (preset ? t(preset.descKey) : t("defaultDescription"));

  const resolvedConfirmLabel =
    confirmLabel ?? (preset ? t(preset.buttonKey) : t("confirm"));

  const resolvedCancelLabel = cancelLabel ?? t("cancel");

  // Keyword check
  const isKeywordValid =
    !confirmKeyword ||
    keywordInput.trim().toLowerCase() ===
      confirmKeyword.trim().toLowerCase();

  // Escape key & scroll lock
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isBusy) {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isBusy, onClose]);

  const handleConfirmClick = async () => {
    if (isBusy || !isKeywordValid) return;
    try {
      const result = onConfirm();
      if (result && typeof (result as Promise<unknown>).then === "function") {
        setIsInternalBusy(true);
        await result;
      }
    } finally {
      setIsInternalBusy(false);
    }
  };

  const handleBackdropClick = () => {
    if (!isBusy && !disableBackdropClick) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="confirm-dialog-root fixed inset-0 z-[250] grid place-items-center p-4 sm:p-6"
      role="presentation"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label={tCommon("close")}
        className="absolute inset-0 cursor-pointer bg-slate-950/60 backdrop-blur-[2px] transition-opacity"
        onClick={handleBackdropClick}
        disabled={isBusy}
      />

      {/* Dialog card */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className={`confirm-dialog-panel relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_25px_50px_-12px_rgba(15,23,42,0.35)] animate-in fade-in zoom-in-95 duration-150 ${className}`.trim()}
      >
        {/* Top colored accent line */}
        <span
          className={`absolute inset-x-0 top-0 h-1.5 ${styles.topBar}`}
          aria-hidden="true"
        />

        {/* Content area */}
        <div className="p-6 sm:p-7">
          <div className="flex items-start gap-4">
            {/* Tone-themed icon badge */}
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ring-4 transition-transform ${styles.iconWrap}`}
            >
              <IconComponent className="h-6 w-6" aria-hidden="true" />
            </div>

            {/* Title & close button header */}
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-start justify-between gap-3">
                <h2
                  id={titleId}
                  className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl"
                >
                  {resolvedTitle}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isBusy}
                  aria-label={tCommon("close")}
                  className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border bg-surface text-slate-400 transition hover:border-slate-300 hover:bg-surface-muted hover:text-slate-700 disabled:pointer-events-none disabled:opacity-40"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Description */}
              <p
                id={descId}
                className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-[0.9375rem]"
              >
                {resolvedDescription}
              </p>
            </div>
          </div>

          {/* Highlighted target item chip/card if specified */}
          {itemName ? (
            <div className="mt-4 rounded-xl border border-border bg-surface-muted/70 p-3.5 sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-medium text-slate-500">
                  {itemType ?? t("targetItem")}
                </span>
                {actionType === "activate" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {t("statusActive")}
                  </span>
                ) : actionType === "deactivate" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    {t("statusInactive")}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 break-words font-semibold text-slate-900 sm:text-base">
                {itemName}
              </p>
            </div>
          ) : null}

          {/* Optional verification keyword prompt */}
          {confirmKeyword ? (
            <div className="mt-4 space-y-2 rounded-xl border border-amber-200/80 bg-amber-50/60 p-3.5 text-xs text-amber-900">
              <p className="font-medium">
                {t("keywordPrompt", { keyword: confirmKeyword })}
              </p>
              <input autoComplete="off"
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder={confirmKeyword}
                disabled={isBusy}
                className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:bg-slate-100"
              />
            </div>
          ) : null}

          {/* Custom children if provided */}
          {children ? <div className="mt-4">{children}</div> : null}
        </div>

        {/* Footer actions */}
        <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2.5 border-t border-border bg-surface-muted/90 px-6 py-4">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={isBusy}
          >
            {resolvedCancelLabel}
          </Button>

          <Button
            type="button"
            variant={styles.buttonVariant}
            size="md"
            icon={ConfirmButtonIcon}
            loading={isBusy}
            disabled={isBusy || !isKeywordValid}
            onClick={handleConfirmClick}
          >
            {isBusy ? t("processing") : resolvedConfirmLabel}
          </Button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}

/**
 * Enterprise confirmation dialog adhering to MFin Portal design system,
 * supporting multilingual next-intl labels, action presets, async execution,
 * and high-risk confirmation keyword verification.
 */
export function ConfirmDialog({
  open,
  ...props
}: ConfirmDialogProps) {
  if (!open || typeof document === "undefined") return null;
  return <ConfirmDialogContent key={String(open)} {...props} />;
}

/**
 * Convenient React Hook for triggering confirmation popups with async/await
 * or declarative state in any component.
 *
 * Example:
 * ```tsx
 * const { confirm, ConfirmDialogComponent } = useConfirmDialog();
 *
 * async function handleDelete(item: Staff) {
 *   const ok = await confirm({
 *     actionType: "deactivate",
 *     itemName: item.fullName,
 *   });
 *   if (ok) {
 *     await performDeactivate(item.id);
 *   }
 * }
 *
 * return (
 *   <>
 *     <StaffTable onDeactivate={handleDelete} />
 *     <ConfirmDialogComponent />
 *   </>
 * );
 * ```
 */
export type UseConfirmOptions = Omit<
  ConfirmDialogProps,
  "open" | "onClose" | "onConfirm"
>;

export function useConfirmDialog() {
  const [state, setState] = useState<{
    open: boolean;
    options: UseConfirmOptions;
    resolve?: (value: boolean) => void;
  }>({
    open: false,
    options: {},
  });

  const confirm = useCallback(
    (options: UseConfirmOptions = {}): Promise<boolean> => {
      return new Promise((resolve) => {
        setState({
          open: true,
          options,
          resolve,
        });
      });
    },
    [],
  );

  const handleClose = useCallback(() => {
    setState((prev) => {
      prev.resolve?.(false);
      return { ...prev, open: false, resolve: undefined };
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setState((prev) => {
      prev.resolve?.(true);
      return { ...prev, open: false, resolve: undefined };
    });
  }, []);

  const ConfirmDialogComponent = useCallback(() => {
    return (
      <ConfirmDialog
        open={state.open}
        onClose={handleClose}
        onConfirm={handleConfirm}
        {...state.options}
      />
    );
  }, [state.open, state.options, handleClose, handleConfirm]);

  return {
    confirm,
    ConfirmDialogComponent,
    isOpen: state.open,
    close: handleClose,
  };
}
