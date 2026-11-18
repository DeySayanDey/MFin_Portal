"use client";

import { Headset } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  supportUnreadCount,
  useSupportInbox,
} from "@/features/support/services/support-inbox";

const SUPPORT_DESK_HREF = "/support/my-tickets";

type SupportDeskLinkProps = {
  className?: string;
  variant?: "icon" | "menu";
};

export function SupportDeskLink({
  className = "",
  variant = "icon",
}: SupportDeskLinkProps) {
  const t = useTranslations("navigation");
  const unread = supportUnreadCount(useSupportInbox());
  const label =
    unread > 0 ? t("notificationsUnread", { count: unread }) : t("supportDesk");

  if (variant === "menu") {
    return (
      <Link
        href={SUPPORT_DESK_HREF}
        role="menuitem"
        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-surface-muted ${className}`.trim()}
      >
        <span className="relative">
          <Headset className="h-4 w-4 text-muted-soft" aria-hidden />
          {unread > 0 ? (
            <span className="absolute -top-1 -end-1 h-2 w-2 rounded-full bg-rose-500" />
          ) : null}
        </span>
        {t("supportDesk")}
        {unread > 0 ? (
          <span className="ms-auto rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </Link>
    );
  }

  return (
    <Link
      href={SUPPORT_DESK_HREF}
      aria-label={label}
      title={t("supportDesk")}
      className={`relative inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border bg-white text-slate-600 shadow-sm transition hover:bg-surface-muted ${className}`.trim()}
    >
      <Headset className="h-4 w-4" aria-hidden />
      {unread > 0 ? (
        <span className="absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </Link>
  );
}
