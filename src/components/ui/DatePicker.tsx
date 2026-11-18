"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { formatDateDMY } from "@/lib/date-format";
import { Select } from "@/components/ui/Select";

type DatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Inclusive min date `Y-m-d`. */
  min?: string;
  /** Inclusive max date `Y-m-d`. */
  max?: string;
  className?: string;
  id?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
};

const WEEKDAY_KEYS = [
  "weekdayMo",
  "weekdayTu",
  "weekdayWe",
  "weekdayTh",
  "weekdayFr",
  "weekdaySa",
  "weekdaySu",
] as const;

function parseYmd(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  return date;
}

function toYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

/** Monday-first grid (42 cells). */
function buildMonthGrid(month: Date): Date[] {
  const first = startOfMonth(month);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - mondayOffset);
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isBeforeDay(a: Date, b: Date): boolean {
  return toYmd(a) < toYmd(b);
}

function isAfterDay(a: Date, b: Date): boolean {
  return toYmd(a) > toYmd(b);
}

/**
 * Project-styled date picker (popover calendar).
 * Value is always `Y-m-d` (or empty string).
 */
export function DatePicker({
  value,
  onChange,
  placeholder,
  disabled = false,
  min,
  max,
  className = "",
  id,
  ...aria
}: DatePickerProps) {
  const t = useTranslations("ui");
  const locale = useLocale();
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});

  const selected = useMemo(() => parseYmd(value), [value]);
  const minDate = useMemo(() => (min ? parseYmd(min) : null), [min]);
  const maxDate = useMemo(() => (max ? parseYmd(max) : null), [max]);

  const [viewMonth, setViewMonth] = useState(() =>
    startOfMonth(selected ?? new Date()),
  );

  useEffect(() => {
    if (!open) return;
    setViewMonth(startOfMonth(selected ?? new Date()));
  }, [open, selected]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        if (panelRef.current?.querySelector('[aria-haspopup="listbox"][aria-expanded="true"]')) return;
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function placePanel(): CSSProperties | null {
    const trigger = triggerRef.current?.getBoundingClientRect();
    if (!trigger) return null;
    const gap = 6;
    const width = 296;
    const height = panelRef.current?.offsetHeight ?? 340;
    const spaceBelow = window.innerHeight - trigger.bottom - gap - 8;
    const spaceAbove = trigger.top - gap - 8;
    const openBelow = spaceBelow >= height || spaceBelow >= spaceAbove;
    const left = Math.max(8, Math.min(trigger.left, window.innerWidth - width - 8));
    const top = openBelow
      ? trigger.bottom + gap
      : Math.max(8, trigger.top - gap - Math.min(height, spaceAbove));
    return {
      position: "fixed",
      left,
      top,
      width,
      zIndex: 240,
      maxHeight: Math.max(160, openBelow ? spaceBelow : spaceAbove),
    };
  }

  useEffect(() => {
    if (!open) return;
    function place() {
      const next = placePanel();
      if (next) setPanelStyle(next);
    }
    place();
    const frame = requestAnimationFrame(place);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, viewMonth]);

  const displayLabel = useMemo(() => {
    if (!selected) return null;
    return formatDateDMY(value);
  }, [selected, value]);

  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, month) => {
      const sample = new Date(2020, month, 1);
      let label = String(month + 1);
      try {
        label = new Intl.DateTimeFormat(locale, { month: "short" }).format(sample);
      } catch {
        label = String(month + 1);
      }
      return { value: String(month), label };
    });
  }, [locale]);

  const yearOptions = useMemo(() => {
    const nowYear = today.getFullYear();
    let start = minDate ? minDate.getFullYear() : nowYear - 120;
    let end = maxDate ? maxDate.getFullYear() : nowYear + 20;
    if (start > end) {
      const swap = start;
      start = end;
      end = swap;
    }
    const years: number[] = [];
    for (let year = end; year >= start; year -= 1) years.push(year);
    const viewed = viewMonth.getFullYear();
    if (!years.includes(viewed)) years.unshift(viewed);
    return years;
  }, [maxDate, minDate, today, viewMonth]);

  const days = useMemo(() => buildMonthGrid(viewMonth), [viewMonth]);

  function isDisabledDay(day: Date): boolean {
    if (minDate && isBeforeDay(day, minDate)) return true;
    if (maxDate && isAfterDay(day, maxDate)) return true;
    return false;
  }

  function choose(day: Date) {
    if (isDisabledDay(day)) return;
    onChange(toYmd(day));
    setOpen(false);
    rootRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function clear() {
    onChange("");
    setOpen(false);
    rootRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function chooseToday() {
    if (isDisabledDay(today)) return;
    onChange(toYmd(today));
    setViewMonth(startOfMonth(today));
    setOpen(false);
    rootRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (
      event.key === "ArrowDown" ||
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      setOpen(true);
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`.trim()}>
      <div className="relative">
      <button
        ref={triggerRef}
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
          if (open) {
            setOpen(false);
            return;
          }
          const next = placePanel();
          if (next) setPanelStyle(next);
          setOpen(true);
        }}
        onKeyDown={onTriggerKeyDown}
        className={`relative flex w-full items-center justify-between gap-2 rounded-[var(--radius-control)] border border-border bg-surface py-2.5 text-left text-sm font-medium text-slate-900 outline-none transition hover:border-border-strong focus:border-brand focus:bg-surface focus:shadow-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50 ${
          value && !disabled ? "ps-3 pe-16" : "px-3"
        } ${open ? "border-brand/40 bg-surface ring-4 ring-brand/10" : ""}`}
      >
        <span
          className={`min-w-0 truncate ${
            displayLabel ? "font-medium text-slate-800" : "text-muted-soft"
          }`}
        >
          {displayLabel ?? placeholder ?? t("datePlaceholder")}
        </span>
        <span className="pointer-events-none absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1 text-muted-soft">
          <CalendarDays className="h-4 w-4" />
          <ChevronDown
            className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>
      {value && !disabled ? (
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

      {open && panelStyle.position === "fixed" && typeof document !== "undefined"
        ? createPortal(
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-label={t("calendarLabel")}
          style={panelStyle}
          className="overflow-y-auto rounded-xl border border-border bg-surface p-3 shadow-[var(--shadow-card)]"
        >
          <div className="mb-2 flex items-center gap-1">
            <Select
              aria-label={t("calendarMonth")}
              value={String(viewMonth.getMonth())}
              onChange={(value) => {
                const month = Number(value);
                setViewMonth(
                  (current) => new Date(current.getFullYear(), month, 1),
                );
              }}
              options={monthOptions}
              size="sm"
              searchable={false}
              clearable={false}
              className="min-w-0 flex-1"
              portalContainerRef={panelRef}
            />
            <Select
              aria-label={t("calendarYear")}
              value={String(viewMonth.getFullYear())}
              onChange={(value) => {
                const year = Number(value);
                setViewMonth((current) => new Date(year, current.getMonth(), 1));
              }}
              options={yearOptions.map((year) => ({ value: String(year), label: String(year) }))}
              size="sm"
              clearable={false}
              className="w-[5.5rem] shrink-0"
              menuMinWidth={160}
              portalContainerRef={panelRef}
            />
            <div className="ms-auto flex items-center gap-0.5">
              <button
                type="button"
                aria-label={t("calendarPrevMonth")}
                onClick={() => setViewMonth((m) => addMonths(m, -1))}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-surface-muted"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label={t("calendarNextMonth")}
                onClick={() => setViewMonth((m) => addMonths(m, 1))}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-surface-muted"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-0.5">
            {WEEKDAY_KEYS.map((key) => (
              <span
                key={key}
                className="py-1 text-center text-[10px] font-semibold tracking-wide text-muted uppercase"
              >
                {t(key)}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {days.map((day) => {
              const inMonth = day.getMonth() === viewMonth.getMonth();
              const isSelected = selected ? isSameDay(day, selected) : false;
              const isToday = isSameDay(day, today);
              const dayDisabled = isDisabledDay(day);
              return (
                <button
                  key={toYmd(day)}
                  type="button"
                  disabled={dayDisabled}
                  aria-pressed={isSelected}
                  onClick={() => choose(day)}
                  className={`inline-flex h-9 items-center justify-center rounded-lg text-sm transition disabled:cursor-not-allowed disabled:opacity-35 ${
                    isSelected
                      ? "bg-brand font-semibold text-white"
                      : isToday
                        ? "border border-brand/40 font-semibold text-brand-ink"
                        : inMonth
                          ? "text-slate-800 hover:bg-surface-muted"
                          : "text-muted-soft hover:bg-surface-muted"
                  }`}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
            <button
              type="button"
              onClick={clear}
              className="text-xs font-semibold text-slate-600 transition hover:text-slate-900"
            >
              {t("dateClear")}
            </button>
            <button
              type="button"
              onClick={chooseToday}
              disabled={isDisabledDay(today)}
              className="text-xs font-semibold text-brand transition hover:text-brand-ink disabled:opacity-40"
            >
              {t("dateToday")}
            </button>
          </div>
        </div>,
        document.body,
      )
        : null}
    </div>
  );
}
