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
    lower.includes("connection")
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
      className={`error-state grid min-h-[calc(100dvh-9rem)] w-full place-items-center px-4 py-8 text-center ${className}`.trim()}
    >
      <div className="error-state-card relative w-full max-w-md overflow-hidden rounded-2xl border border-rose-200/80 bg-surface px-6 py-10 shadow-[0_20px_50px_-20px_rgba(244,63,94,0.35)] sm:px-8">
        <div className="error-state-sheen pointer-events-none absolute inset-0" aria-hidden />
        <div className="error-state-blob error-state-blob--one pointer-events-none absolute -top-10 -right-8 h-28 w-28 rounded-full bg-rose-100/70 blur-2xl" aria-hidden />
        <div className="error-state-blob error-state-blob--two pointer-events-none absolute -bottom-12 -left-10 h-32 w-32 rounded-full bg-rose-50 blur-2xl" aria-hidden />

        <div className="error-state-icon-wrap relative z-10 mx-auto mb-7 flex h-28 w-28 items-center justify-center">
          <span className="error-state-wave error-state-wave--1 absolute inset-0 rounded-full" aria-hidden />
          <span className="error-state-wave error-state-wave--2 absolute inset-0 rounded-full" aria-hidden />
          <span className="error-state-wave error-state-wave--3 absolute inset-0 rounded-full" aria-hidden />
          <span className="error-state-orbit absolute inset-[0.35rem]" aria-hidden />
          <span className="error-state-glow absolute inset-8 rounded-full bg-rose-200/60 blur-[3px]" aria-hidden />
          <span className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 shadow-[0_8px_20px_-8px_rgba(244,63,94,0.55)] ring-1 ring-rose-200">
            <Icon
              className="error-state-icon h-8 w-8"
              aria-hidden="true"
              strokeWidth={1.75}
            />
          </span>
          <span className="error-state-dot error-state-dot--a absolute" aria-hidden />
          <span className="error-state-dot error-state-dot--b absolute" aria-hidden />
          <span className="error-state-dot error-state-dot--c absolute" aria-hidden />
        </div>

        <div className="error-state-copy relative z-10 space-y-2.5">
          <p className="text-lg font-semibold tracking-tight text-slate-900">
            {resolvedTitle}
          </p>
          <p className="mx-auto max-w-sm text-sm leading-6 text-muted">
            {resolvedMessage}
          </p>
          <p className="error-state-status mx-auto inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-[11px] font-semibold tracking-wide text-rose-700 uppercase">
            <span className="error-state-status-dot h-1.5 w-1.5 rounded-full bg-rose-500" />
            {connectivity ? t("errorOfflineHint") : t("errorServerHint")}
          </p>
        </div>

        <div className="error-state-action relative z-10 mt-8">
          {action ? (
            action
          ) : onRetry ? (
            <Button
              type="button"
              variant="secondary"
              className="error-state-retry min-w-[8.5rem]"
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
