"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Check, ChevronDown, Search } from "lucide-react";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectProps = {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  size?: "sm" | "md";
  /** Enable search when there are many options (default: auto when > 8). */
  searchable?: boolean;
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
  placeholder = "Select…",
  disabled = false,
  size = "md",
  searchable,
  searchPlaceholder = "Search…",
  emptyMessage = "No options found",
  className = "",
  id,
  ...aria
}: SelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const enableSearch = searchable ?? options.length > 8;

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
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
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

  function openMenu() {
    if (disabled) return;
    const selectedIdx = options.findIndex((option) => option.value === value);
    setActiveIndex(selectedIdx >= 0 ? selectedIdx : 0);
    setQuery("");
    setOpen(true);
  }

  function choose(next: string) {
    onChange(next);
    setOpen(false);
    setQuery("");
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

  function onListKeyDown(event: KeyboardEvent<HTMLDivElement>) {
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
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={aria["aria-label"]}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onTriggerKeyDown}
        className={`flex w-full items-center justify-between gap-2 border border-border bg-surface-muted text-left outline-none transition hover:border-slate-300 focus:border-brand/40 focus:bg-white focus:ring-4 focus:ring-brand/10 disabled:cursor-not-allowed disabled:opacity-50 ${
          size === "sm"
            ? "rounded-lg px-2 py-1.5 text-sm"
            : "rounded-xl px-3 py-2.5 text-sm"
        } ${open ? "border-brand/40 bg-white ring-4 ring-brand/10" : ""}`}
      >
        <span
          className={`min-w-0 truncate ${
            selected ? "font-medium text-slate-800" : "text-muted-soft"
          }`}
        >
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-soft transition ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open ? (
        <div
          id={listId}
          role="listbox"
          tabIndex={-1}
          onKeyDown={onListKeyDown}
          className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-border bg-white shadow-[var(--shadow-card)]"
        >
          {enableSearch ? (
            <div className="border-b border-border p-2">
              <label className="relative block">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-soft" />
                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setActiveIndex(0);
                  }}
                  placeholder={searchPlaceholder}
                  className="w-full rounded-lg border border-border bg-surface-muted py-2 pr-3 pl-8 text-xs text-slate-800 outline-none placeholder:text-muted-soft focus:border-brand/40 focus:bg-white focus:ring-2 focus:ring-brand/10"
                />
              </label>
            </div>
          ) : null}

          <ul className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2.5 text-xs text-muted">{emptyMessage}</li>
            ) : (
              filtered.map((option, index) => {
                const isSelected = option.value === value;
                const isActive = index === activeIndex;
                return (
                  <li key={option.value}>
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
        </div>
      ) : null}
    </div>
  );
}
