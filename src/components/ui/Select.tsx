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
import { useTranslations } from "next-intl";
import { Check, ChevronDown, Search, X } from "lucide-react";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
  /** Stable list identity when two options share the same value. */
  id?: string;
};

type SelectProps = {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  size?: "sm" | "md";
  /** In-menu search. On for every dropdown unless set to false. */
  searchable?: boolean;
  /** Show a clear control once a value is selected. */
  clearable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  /** Accessible name when used without a wrapping label. */
  "aria-label"?: string;
  id?: string;
};

/**
 * Project-styled dropdown (listbox). Use instead of native <select>
 * for consistent UI across Master and app pages.
 */
export function Select({
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
  size = "md",
  searchable = true,
  clearable = true,
  searchPlaceholder,
  emptyMessage,
  className = "",
  id,
  ...aria
}: SelectProps) {
  const t = useTranslations("ui");
  const resolvedPlaceholder = placeholder ?? t("selectPlaceholder");
  const resolvedSearchPlaceholder = searchPlaceholder ?? t("selectSearch");
  const resolvedEmptyMessage = emptyMessage ?? t("selectEmpty");
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});

  const enableSearch = searchable;
  const canClear = clearable && !disabled && value !== "";

  const selected = options.find((option) => option.value === value);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(q),
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
      setQuery("");
    }
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !enableSearch) return;
    const frame = requestAnimationFrame(() => searchRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open, enableSearch]);

  useEffect(() => {
    if (!open) return;
    function place() {
      const next = placeMenu();
      if (next) setMenuStyle(next);
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
  }, [open, filtered.length, query]);

  function placeMenu(): CSSProperties | null {
    const trigger = triggerRef.current?.getBoundingClientRect();
    if (!trigger) return null;
    const gap = 6;
    const spaceBelow = window.innerHeight - trigger.bottom - gap - 8;
    const spaceAbove = trigger.top - gap - 8;
    const openBelow = spaceBelow >= 140 || spaceBelow >= spaceAbove;
    const maxHeight = Math.min(280, Math.max(96, openBelow ? spaceBelow : spaceAbove));
    const menuHeight = Math.min(menuRef.current?.offsetHeight ?? maxHeight, maxHeight);
    const top = openBelow
      ? trigger.bottom + gap
      : Math.max(8, trigger.top - gap - menuHeight);
    return {
      position: "fixed",
      left: trigger.left,
      width: trigger.width,
      top,
      maxHeight,
      zIndex: 240,
    };
  }

  function openMenu() {
    if (disabled) return;
    const next = placeMenu();
    if (next) setMenuStyle(next);
    const selectedIdx = options.findIndex((option) => option.value === value);
    setActiveIndex(selectedIdx >= 0 ? selectedIdx : 0);
    setQuery("");
    setOpen(true);
  }

  function choose(next: string) {
    onChange(next);
    setOpen(false);
    setQuery("");
    rootRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function clearSelection() {
    onChange("");
    setOpen(false);
    setQuery("");
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
      openMenu();
    }
  }

  function onListKeyDown(
    event: KeyboardEvent<HTMLDivElement | HTMLInputElement>,
  ) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) =>
        Math.min(index + 1, Math.max(filtered.length - 1, 0)),
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = filtered[activeIndex];
      if (option && !option.disabled) choose(option.value);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(Math.max(filtered.length - 1, 0));
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
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={aria["aria-label"]}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onTriggerKeyDown}
        className={`relative flex w-full items-center justify-between gap-2 border border-border bg-surface text-left text-sm font-medium text-slate-900 outline-none transition hover:border-border-strong focus:border-brand focus:bg-surface focus:shadow-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50 ${
          size === "sm"
            ? "rounded-lg py-1.5"
            : "rounded-[var(--radius-control)] py-2.5"
        } ${canClear ? "ps-3 pe-16" : "ps-3 pe-8"} ${
          open ? "border-brand bg-surface shadow-[var(--focus-ring)]" : ""
        }`}
      >
        <span
          className={`min-w-0 flex-1 truncate ${
            selected ? "font-medium text-slate-900" : "font-normal text-muted"
          }`}
        >
          {selected?.label ?? resolvedPlaceholder}
        </span>
        <ChevronDown
          className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-soft transition ${
            size === "sm" ? "right-2 h-3.5 w-3.5" : "right-3 h-4 w-4"
          } ${open ? "rotate-180" : ""}`}
        />
      </button>
      {canClear ? (
        <button
          type="button"
          aria-label={t("selectClear")}
          onClick={clearSelection}
          className={`absolute top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full text-muted-soft transition hover:bg-surface hover:text-slate-800 ${
            size === "sm" ? "right-7 h-5 w-5" : "right-8 h-6 w-6"
          }`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
      </div>

      {open && menuStyle.position === "fixed" && typeof document !== "undefined"
        ? createPortal(
        <div
          ref={menuRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          onKeyDown={onListKeyDown}
          style={menuStyle}
          className="overflow-y-auto rounded-[var(--radius-control)] border border-border bg-surface shadow-[var(--shadow-card)]"
        >
          {enableSearch ? (
            <div className="sticky top-0 z-10 border-b border-border bg-surface p-2">
              <label className="relative block">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-soft" />
                <input autoComplete="off"
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setActiveIndex(0);
                  }}
                  onKeyDown={onListKeyDown}
                  placeholder={resolvedSearchPlaceholder}
                  aria-label={resolvedSearchPlaceholder}
                  className="w-full rounded-lg border border-border bg-surface py-2 pr-8 pl-8 text-xs font-medium text-slate-900 outline-none placeholder:font-normal placeholder:text-muted-soft focus:border-brand focus:shadow-[var(--focus-ring)]"
                />
                {query ? (
                  <button
                    type="button"
                    aria-label={t("selectClear")}
                    onClick={() => {
                      setQuery("");
                      setActiveIndex(0);
                      searchRef.current?.focus();
                    }}
                    className="absolute top-1/2 right-2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-muted-soft hover:text-slate-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                ) : null}
              </label>
            </div>
          ) : null}

          <ul className="py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2.5 text-xs text-muted">{resolvedEmptyMessage}</li>
            ) : (
              filtered.map((option, index) => {
                const isSelected = option.value === value;
                const isActive = index === activeIndex;
                return (
                  <li key={option.id ?? `${option.value}-${index}`}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      disabled={option.disabled}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => {
                        if (!option.disabled) choose(option.value);
                      }}
                      className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
                        isSelected
                          ? "bg-brand-soft font-semibold text-brand-ink"
                          : isActive
                            ? "bg-surface-muted text-slate-800"
                            : "text-slate-700 hover:bg-surface-muted"
                      }`}
                    >
                      <span className="min-w-0 truncate">{option.label}</span>
                      {isSelected ? (
                        <Check className="h-3.5 w-3.5 shrink-0 text-brand-ink" />
                      ) : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>,
        document.body,
      )
        : null}
    </div>
  );
}
