"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, Clock3, X } from "lucide-react";

type TimePickerProps = {
  /** `HH:mm` or empty. Seconds, if present, are ignored. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
};

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const MINUTES = Array.from({ length: 60 }, (_, minute) => minute);

function parseTime(value: string): { hour: number; minute: number } | null {
  const match = value.trim().match(/^([01]\d|2[0-3]):([0-5]\d)/);
  if (!match) return null;
  return { hour: Number(match[1]), minute: Number(match[2]) };
}

function toHhmm(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** Scroll the list only. `scrollIntoView` also moves modal ancestors and clips the panel. */
function scrollListToSelected(list: HTMLDivElement | null) {
  const selected = list?.querySelector<HTMLElement>("[data-selected='true']");
  if (!list || !selected) return;
  const top =
    selected.offsetTop - (list.clientHeight - selected.offsetHeight) / 2;
  list.scrollTop = Math.max(0, top);
}

/**
 * Project-styled time picker. Value is always `HH:mm` (or empty).
 */
export function TimePicker({
  value,
  onChange,
  placeholder,
  disabled = false,
  className = "",
  id,
  ...aria
}: TimePickerProps) {
  const t = useTranslations("ui");
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const hourListRef = useRef<HTMLDivElement>(null);
  const minuteListRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const parsed = useMemo(() => parseTime(value), [value]);
  const [hour, setHour] = useState(parsed?.hour ?? 0);
  const [minute, setMinute] = useState(parsed?.minute ?? 0);

  useEffect(() => {
    if (!open) return;
    const next = parseTime(value);
    setHour(next?.hour ?? 0);
    setMinute(next?.minute ?? 0);
  }, [open, value]);

  useLayoutEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const scroller = panel?.closest<HTMLElement>(".overflow-y-auto");
    if (!panel || !scroller) return;
    const panelRect = panel.getBoundingClientRect();
    const scrollRect = scroller.getBoundingClientRect();
    if (panelRect.bottom > scrollRect.bottom - 8) {
      scroller.scrollTop += panelRect.bottom - scrollRect.bottom + 12;
    }
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    scrollListToSelected(hourListRef.current);
    scrollListToSelected(minuteListRef.current);
  }, [open, hour, minute]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function commit(nextHour: number, nextMinute: number) {
    setHour(nextHour);
    setMinute(nextMinute);
    onChange(toHhmm(nextHour, nextMinute));
  }

  function clear() {
    onChange("");
    setOpen(false);
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }
  }

  const display = parsed ? toHhmm(parsed.hour, parsed.minute) : null;

  return (
    <div ref={rootRef} className={`relative ${className}`.trim()}>
      <div className="relative">
        <button
          type="button"
          id={id}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          aria-label={aria["aria-label"]}
          aria-invalid={aria["aria-invalid"]}
          onClick={() => {
            if (disabled) return;
            setOpen((prev) => !prev);
          }}
          onKeyDown={onTriggerKeyDown}
          className={`relative flex w-full cursor-pointer items-center justify-between gap-2 rounded-[var(--radius-control)] border border-border bg-surface py-2.5 text-left text-sm font-medium text-slate-900 outline-none transition hover:border-border-strong focus:border-brand focus:bg-surface focus:shadow-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50 ${
            display && !disabled ? "ps-3 pe-16" : "px-3"
          } ${open ? "border-brand/40 bg-surface ring-4 ring-brand/10" : ""}`}
        >
          <span
            className={`min-w-0 truncate tabular-nums ${
              display ? "font-medium text-slate-800" : "text-muted-soft"
            }`}
          >
            {display ?? placeholder ?? t("timePlaceholder")}
          </span>
          <span className="pointer-events-none absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1 text-muted-soft">
            <Clock3 className="h-4 w-4" />
            <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
          </span>
        </button>
        {display && !disabled ? (
          <button
            type="button"
            aria-label={t("dateClear")}
            onClick={clear}
            className="absolute top-1/2 right-12 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-soft transition hover:bg-surface hover:text-slate-800"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-label={t("timeLabel")}
          className="mt-1.5 w-full overflow-hidden rounded-xl border border-border bg-surface p-3 shadow-[var(--shadow-card)]"
        >
          <div className="mb-2 grid grid-cols-2 gap-2">
            <span className="text-center text-[10px] font-semibold tracking-wide text-muted uppercase">
              {t("timeHour")}
            </span>
            <span className="text-center text-[10px] font-semibold tracking-wide text-muted uppercase">
              {t("timeMinute")}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div
              ref={hourListRef}
              className="relative max-h-24 overflow-y-auto rounded-lg bg-surface-muted p-1 scrollbar-thin"
            >
              {HOURS.map((item) => {
                const selected = item === hour;
                return (
                  <button
                    key={item}
                    type="button"
                    data-selected={selected ? "true" : undefined}
                    onClick={() => commit(item, minute)}
                    className={`flex h-8 w-full cursor-pointer items-center justify-center rounded-lg text-sm tabular-nums transition ${
                      selected
                        ? "bg-brand font-semibold text-white"
                        : "text-slate-800 hover:bg-surface"
                    }`}
                  >
                    {String(item).padStart(2, "0")}
                  </button>
                );
              })}
            </div>
            <div
              ref={minuteListRef}
              className="relative max-h-24 overflow-y-auto rounded-lg bg-surface-muted p-1 scrollbar-thin"
            >
              {MINUTES.map((item) => {
                const selected = item === minute;
                return (
                  <button
                    key={item}
                    type="button"
                    data-selected={selected ? "true" : undefined}
                    onClick={() => commit(hour, item)}
                    className={`flex h-8 w-full cursor-pointer items-center justify-center rounded-lg text-sm tabular-nums transition ${
                      selected
                        ? "bg-brand font-semibold text-white"
                        : "text-slate-800 hover:bg-surface"
                    }`}
                  >
                    {String(item).padStart(2, "0")}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
            <button
              type="button"
              onClick={clear}
              className="cursor-pointer text-xs font-semibold text-slate-600 transition hover:text-slate-900"
            >
              {t("dateClear")}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="cursor-pointer text-xs font-semibold text-brand transition hover:text-brand-ink"
            >
              {t("timeDone")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
