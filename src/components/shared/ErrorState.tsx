"use client";

import type { ReactNode } from "react";
import { CloudOff, RefreshCw, ServerCrash } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";

type ErrorStateProps = {
  title?: string;
  message?: string;
  action?: ReactNode;
  onRetry?: () => void;
  className?: string;
};

function isConnectivityError(message: string | undefined): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes("timeout") ||
    lower.includes("network") ||
    lower.includes("timed out") ||
    lower.includes("connection") ||
    lower.includes("unreachable") ||
    lower.includes("offline") ||
    lower.includes("failed to fetch") ||
    lower.includes("fetch failed") ||
    lower.includes("econnrefused") ||
    lower.includes("server off") ||
    lower.includes("abort")
  );
}

export function ErrorState({
  title,
  message,
  action,
  onRetry,
  className = "",
}: ErrorStateProps) {
  const t = useTranslations("ui");
  const tCommon = useTranslations("common");
  const resolvedTitle = title ?? t("errorTitle");
  const resolvedMessage = message ?? t("errorMessage");
  const connectivity = isConnectivityError(resolvedMessage);
  const Icon = connectivity ? CloudOff : ServerCrash;

  return (
    <div
      role="alert"
      className={`error-state flex w-full items-center justify-center px-4 py-8 text-center sm:py-10 ${className}`.trim()}
    >
      <div className="error-state-card relative w-full max-w-md overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-[var(--shadow-card)] sm:p-7">
        <div className="error-state-sheen pointer-events-none absolute inset-0" aria-hidden />
        <div className="error-state-blob error-state-blob--one pointer-events-none absolute -top-8 -right-6 h-24 w-24 rounded-full bg-accent-rose-soft/80 blur-2xl" aria-hidden />
        <div className="error-state-blob error-state-blob--two pointer-events-none absolute -bottom-8 -left-6 h-24 w-24 rounded-full bg-accent-rose-soft/50 blur-2xl" aria-hidden />

        <div className="error-state-icon-wrap relative z-10 mx-auto mb-4 flex h-20 w-20 items-center justify-center">
          <span className="error-state-wave error-state-wave--1 absolute inset-0 rounded-full" aria-hidden />
          <span className="error-state-wave error-state-wave--2 absolute inset-0 rounded-full" aria-hidden />
          <span className="error-state-wave error-state-wave--3 absolute inset-0 rounded-full" aria-hidden />
          <span className="error-state-orbit absolute inset-[0.25rem]" aria-hidden />
          <span className="error-state-glow absolute inset-4 rounded-full bg-accent-rose-soft blur-[3px]" aria-hidden />
          <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-rose-soft text-accent-rose ring-1 ring-border">
            <Icon
              className="error-state-icon h-6 w-6"
              aria-hidden="true"
              strokeWidth={1.75}
            />
          </span>
          <span className="error-state-dot error-state-dot--a absolute" aria-hidden />
          <span className="error-state-dot error-state-dot--b absolute" aria-hidden />
          <span className="error-state-dot error-state-dot--c absolute" aria-hidden />
        </div>

        <div className="error-state-copy relative z-10 space-y-2">
          <p className="text-base font-semibold tracking-tight text-foreground">
            {resolvedTitle}
          </p>
          <p className="mx-auto max-w-sm text-xs leading-relaxed text-muted sm:text-sm">
            {resolvedMessage}
          </p>
          <div className="pt-1">
            <span className="error-state-status inline-flex items-center gap-1.5 rounded-full border border-border bg-accent-rose-soft px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-accent-rose uppercase">
              <span className="error-state-status-dot h-1.5 w-1.5 rounded-full bg-accent-rose" />
              {connectivity ? t("errorOfflineHint") : t("errorServerHint")}
            </span>
          </div>
        </div>

        <div className="error-state-action relative z-10 mt-5">
          {action ? (
            action
          ) : onRetry ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="error-state-retry min-w-[7.5rem]"
              icon={RefreshCw}
              onClick={onRetry}
            >
              {tCommon("retry")}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
