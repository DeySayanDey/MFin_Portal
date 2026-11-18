"use client";

import { useEffect, useRef, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Bell } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { presentSupportNotice, useSupportNoticePermission } from "@/features/support/services/support-notice";
import { useSupportDeskRealtime } from "@/features/support/services/use-support-realtime";
import {
  markAllSupportNoticesRead,
  markSupportNoticeRead,
  pushSupportNotice,
  queueOpenSupportTicket,
  supportUnreadCount,
  useSupportInbox,
} from "@/features/support/services/support-inbox";

const SUPPORT_DESK_HREF = "/support/my-tickets";

/** Keeps the support socket open on every page and stores new messages. */
export function SupportDeskNotifier() {
  const tNotice = useTranslations("support.raiseTicket.notice");
  const router = useRouter();
  useSupportNoticePermission();
  useSupportDeskRealtime({
    sessionKey: 0,
    ticketNumber: null,
    onRefresh: () => undefined,
    onNotice: (notice) => {
      pushSupportNotice(notice);
      const title = notice.title || tNotice("fallbackTitle");
      presentSupportNotice({
        title,
        body: notice.body,
        tag: notice.number || notice.ticketId || "support-ticket",
        openLabel: tNotice("open"),
        onOpen: () => {
          if (notice.number) queueOpenSupportTicket(notice.number);
          router.push(SUPPORT_DESK_HREF);
        },
      });
    },
  });
  return null;
}

export function SupportNoticeBell() {
  const t = useTranslations("navigation");
  const tNotice = useTranslations("support.raiseTicket.notice");
  const format = useFormatter();
  const router = useRouter();
  const items = useSupportInbox();
  const unread = supportUnreadCount(items);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (rootRef.current && !rootRef.current.contains(target)) setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function openItem(id: string, number: string) {
    markSupportNoticeRead(id);
    setOpen(false);
    if (number) queueOpenSupportTicket(number);
    router.push(SUPPORT_DESK_HREF);
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border bg-white text-slate-600 shadow-sm transition hover:bg-surface-muted"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={
          unread > 0 ? t("notificationsUnread", { count: unread }) : t("notifications")
        }
      >
        <Bell className="h-4 w-4" aria-hidden />
        {unread > 0 ? <UnreadBadge count={unread} /> : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={t("notifications")}
          className="absolute top-full right-0 z-40 mt-1.5 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-white shadow-[var(--shadow-card)]"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
            <p className="text-xs font-semibold text-slate-800">{t("notifications")}</p>
            {unread > 0 ? (
              <button
                type="button"
                onClick={markAllSupportNoticesRead}
                className="text-[11px] font-semibold text-brand-ink hover:underline"
              >
                {t("markAllRead")}
              </button>
            ) : null}
          </div>
          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted">{t("notificationsEmpty")}</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => openItem(item.id, item.number)}
                    className={`flex w-full flex-col gap-0.5 px-3 py-2 text-left transition hover:bg-surface-muted ${
                      item.unread ? "bg-brand-soft/40" : ""
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-semibold text-slate-800">
                        {item.title || tNotice("fallbackTitle")}
                      </span>
                      {item.unread ? (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-rose-500" />
                      ) : null}
                    </span>
                    {item.number ? (
                      <span className="text-[11px] font-medium text-brand-ink">{item.number}</span>
                    ) : null}
                    {item.body ? (
                      <span className="line-clamp-2 text-[11px] text-slate-600">{item.body}</span>
                    ) : null}
                    <span className="text-[10px] text-muted-soft">
                      {format.dateTime(new Date(item.at), {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                      })}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

function UnreadBadge({ count }: { count: number }) {
  return (
    <span className="absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white">
      {count > 9 ? "9+" : count}
    </span>
  );
}
